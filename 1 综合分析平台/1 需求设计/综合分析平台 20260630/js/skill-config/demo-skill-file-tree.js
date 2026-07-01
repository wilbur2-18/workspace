/**
 * 技能配置 · 多文件树（审计思路 + skillFiles）
 * 依赖 demo-mock-data.js 的 newSkillId（若未挂载则本地生成 id）
 */
(function (global) {
  function nid(prefix) {
    if (typeof global.newSkillId === 'function') return global.newSkillId(prefix || 'sf');
    return (prefix || 'sf') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function ensureSkillFiles(skill) {
    if (!skill || typeof skill !== 'object') return [];
    if (!Array.isArray(skill.skillFiles)) skill.skillFiles = [];
    return skill.skillFiles;
  }

  function newFileNode(fileKind, codeLang) {
    const ext = fileKind === 'md' ? '.md' : codeLang === 'python' ? '.py' : codeLang === 'javascript' ? '.js' : codeLang === 'typescript' ? '.ts' : codeLang === 'shell' ? '.sh' : '.txt';
    const base =
      fileKind === 'md'
        ? '未命名'
        : codeLang === 'python'
          ? 'script'
          : codeLang === 'javascript'
            ? 'script'
            : codeLang === 'typescript'
              ? 'script'
              : codeLang === 'shell'
                ? 'script'
                : 'snippet';
    return {
      id: nid('sf'),
      kind: 'file',
      fileKind: fileKind === 'md' ? 'md' : 'code',
      codeLang: fileKind === 'md' ? '' : String(codeLang || ''),
      filename: base + ext,
      content: '',
    };
  }

  function newFolderNode() {
    return { id: nid('fd'), kind: 'folder', name: '新建文件夹', children: [] };
  }

  /** 深度遍历文件节点：visitor({ node, path }) path 为 POSIX 风格相对路径（不含前导 /） */
  function walkFiles(nodes, base, visitor) {
    const list = Array.isArray(nodes) ? nodes : [];
    list.forEach((node) => {
      if (!node || typeof node !== 'object') return;
      if (node.kind === 'folder') {
        const seg = String(node.name || '').trim() || '未命名文件夹';
        const nextBase = base ? base + '/' + seg : seg;
        visitor({ node, path: nextBase, isFolder: true });
        walkFiles(node.children, nextBase, visitor);
      } else if (node.kind === 'file') {
        const fn = String(node.filename || '').trim();
        const path = base ? base + '/' + fn : fn;
        visitor({ node, path, isFolder: false });
      }
    });
  }

  /** 返回重复的路径（已 trim，大小写敏感）；空文件名视为 '' 仍参与重复检测 */
  function findDuplicatePaths(skillFiles) {
    const seen = new Map();
    const dups = [];
    walkFiles(skillFiles, '', ({ path }) => {
      const prev = seen.get(path);
      if (prev) {
        if (!dups.includes(path)) dups.push(path);
      } else {
        seen.set(path, true);
      }
    });
    return dups;
  }

  /** 供资料匹配等沿用：每条文件 → title=文件名 body=内容 */
  function flattenToExtractionRules(skill) {
    const root = ensureSkillFiles(skill);
    const out = [];
    walkFiles(root, '', ({ node, path, isFolder }) => {
      if (isFolder) return;
      out.push({
        id: String(node.id),
        title: String(node.filename || '').trim() || path,
        body: String(node.content || ''),
        materialIds: Array.isArray(node.materialIds) ? node.materialIds.slice() : [],
      });
    });
    return out;
  }

  function syncExtractionRulesFromSkillFiles(skill) {
    if (!skill || typeof skill !== 'object') return;
    skill.extractionRules = flattenToExtractionRules(skill);
  }

  function findFileNodeById(nodes, id) {
    const want = String(id);
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (!n) continue;
      if (n.kind === 'file' && String(n.id) === want) return { node: n, parent: nodes, index: i, parentFolder: null };
      if (n.kind === 'folder' && Array.isArray(n.children)) {
        const hit = findFileNodeById(n.children, id);
        if (hit) {
          if (!hit.parentFolder) hit.parentFolder = n;
          return hit;
        }
      }
    }
    return null;
  }

  function findFolderNodeById(nodes, id) {
    const want = String(id);
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (!n) continue;
      if (n.kind === 'folder' && String(n.id) === want) return { node: n, parent: nodes, index: i };
      if (n.kind === 'folder' && Array.isArray(n.children)) {
        const hit = findFolderNodeById(n.children, id);
        if (hit) return hit;
      }
    }
    return null;
  }

  function removeNodeById(root, id) {
    const fid = findFileNodeById(root, id);
    if (fid) {
      fid.parent.splice(fid.index, 1);
      return true;
    }
    const fol = findFolderNodeById(root, id);
    if (fol) {
      fol.parent.splice(fol.index, 1);
      return true;
    }
    return false;
  }

  /**
   * @param {'root'|string} parentRef — 'root' 或 folder 的 id
   */
  function insertChild(root, parentRef, child) {
    if (parentRef === 'root' || !parentRef) {
      root.push(child);
      return;
    }
    const hit = findFolderNodeById(root, parentRef);
    if (!hit || !hit.node) {
      root.push(child);
      return;
    }
    if (!Array.isArray(hit.node.children)) hit.node.children = [];
    hit.node.children.push(child);
  }

  /** 展开用：收集所有 folder id */
  function collectFolderKeys(nodes, out) {
    (nodes || []).forEach((n) => {
      if (!n) return;
      if (n.kind === 'folder') {
        out.push('folder:' + n.id);
        collectFolderKeys(n.children, out);
      }
    });
  }

  function antChildrenFromNodes(nodes) {
    return (nodes || []).map((n) => nodeToAnt(n)).filter(Boolean);
  }

  function nodeToAnt(n) {
    if (!n) return null;
    if (n.kind === 'folder') {
      return {
        key: 'folder:' + n.id,
        title: String(n.name || '').trim() || '未命名文件夹',
        selectable: false,
        children: antChildrenFromNodes(n.children),
      };
    }
    if (n.kind === 'file') {
      const fn = String(n.filename || '').trim() || '未命名文件';
      return {
        key: 'file:' + n.id,
        title: fn,
        isLeaf: true,
      };
    }
    return null;
  }

  /** 与 Vue 侧 skillConfigTreeData 一致：审计思路 + skillFiles 树 */
  function buildAntTreeData(skillFiles) {
    const roots = Array.isArray(skillFiles) ? skillFiles : [];
    return [{ key: 'rule', title: 'skill.md', isLeaf: true }, ...antChildrenFromNodes(roots)];
  }

  function remapSkillFilesTree(nodes) {
    return (nodes || []).map((n) => {
      if (!n) return null;
      if (n.kind === 'folder') {
        return {
          id: nid('fd'),
          kind: 'folder',
          name: n.name || '',
          children: remapSkillFilesTree(n.children),
        };
      }
      return {
        id: nid('sf'),
        kind: 'file',
        fileKind: n.fileKind === 'code' ? 'code' : 'md',
        codeLang: n.fileKind === 'code' ? String(n.codeLang || '') : '',
        filename: String(n.filename || ''),
        content: String(n.content || ''),
      };
    }).filter(Boolean);
  }

  function defaultExpandedKeys(skillFiles) {
    const keys = [];
    collectFolderKeys(skillFiles || [], keys);
    return keys;
  }

  /**
   * 决定「+」新节点插入位置：选中文件夹则入该夹；选中文件则与其同目录；选中审计思路则根目录。
   * @returns {'root'|string} folderId 或 'root'
   */
  function findAddParentRef(root, navKey) {
    if (!navKey || navKey === 'rule') return 'root';
    if (String(navKey).startsWith('folder:')) return String(navKey).slice('folder:'.length);
    const fileId = String(navKey).startsWith('file:') ? String(navKey).slice('file:'.length) : String(navKey);
    function walk(arr, parentFolderId) {
      for (let i = 0; i < (arr || []).length; i++) {
        const n = arr[i];
        if (!n) continue;
        if (n.kind === 'file' && String(n.id) === fileId) return parentFolderId == null ? 'root' : parentFolderId;
        if (n.kind === 'folder' && Array.isArray(n.children)) {
          const hit = walk(n.children, String(n.id));
          if (hit !== undefined) return hit;
        }
      }
      return undefined;
    }
    const hit = walk(root, null);
    return hit === undefined ? 'root' : hit;
  }

  function deepCloneSkillFiles(nodes) {
    try {
      return JSON.parse(JSON.stringify(nodes || []));
    } catch (e) {
      return [];
    }
  }

  function antTreeNodeKey(node) {
    if (!node) return null;
    if (node.key != null) return node.key;
    if (node.eventKey != null) return node.eventKey;
    return null;
  }

  /** rc-tree / ant-tree：与 node.pos 末段结合得到相对落点（-1 前 / 0 中 / 1 后） */
  function relativeDropPosition(info) {
    const pos = info && info.node && info.node.pos != null ? String(info.node.pos) : '0';
    const parts = pos.split('-');
    const last = Number(parts[parts.length - 1]);
    const dp = info && info.dropPosition;
    if (dp == null || Number.isNaN(last)) return 0;
    return dp - last;
  }

  /**
   * @returns {{ kind: 'rule'|'file'|'folder', parent: any[]|null, index: number, node: any }|null}
   */
  function locateByTreeKey(root, treeKey) {
    if (treeKey === 'rule') return { kind: 'rule', parent: null, index: -1, node: null };
    if (String(treeKey).startsWith('file:')) {
      const id = String(treeKey).slice('file:'.length);
      const hit = findFileNodeById(root, id);
      return hit ? { kind: 'file', parent: hit.parent, index: hit.index, node: hit.node } : null;
    }
    if (String(treeKey).startsWith('folder:')) {
      const id = String(treeKey).slice('folder:'.length);
      const hit = findFolderNodeById(root, id);
      return hit ? { kind: 'folder', parent: hit.parent, index: hit.index, node: hit.node } : null;
    }
    return null;
  }

  /** 判断 targetFolderId 是否位于 folderNode 子树内（含自身） */
  function folderCoversId(folderNode, targetFolderId) {
    if (!folderNode || folderNode.kind !== 'folder') return false;
    if (String(folderNode.id) === String(targetFolderId)) return true;
    const ch = folderNode.children || [];
    for (let i = 0; i < ch.length; i++) {
      const c = ch[i];
      if (c && c.kind === 'folder' && folderCoversId(c, targetFolderId)) return true;
    }
    return false;
  }

  /**
   * 根据 Ant Design Vue Tree 的 @drop 回调，在 skill.skillFiles 上完成单节点移动（审计思路为虚拟首项，不在 skillFiles 内）。
   * @returns {{ ok: boolean, message?: string }}
   */
  function applyTreeDropFromAntEvent(skill, info) {
    if (!skill || typeof skill !== 'object') return { ok: false, message: '内部错误' };
    const dragKey = antTreeNodeKey(info && info.dragNode) || (info.dragNodesKeys && info.dragNodesKeys[0]);
    const dropKey = antTreeNodeKey(info && info.node);
    if (!dragKey || dragKey === 'rule') return { ok: false, message: '审计思路不可移动' };
    if (!dropKey) return { ok: false, message: '无效的放置目标' };
    if (String(dragKey) === String(dropKey)) return { ok: false, message: '不能与自身交换位置' };

    const live = ensureSkillFiles(skill);
    const clone = deepCloneSkillFiles(live);
    const dragLoc = locateByTreeKey(clone, dragKey);
    if (!dragLoc || dragLoc.kind === 'rule' || !dragLoc.parent) return { ok: false, message: '找不到要移动的节点' };

    const dropToGap = info.dropToGap === true;
    const relative = relativeDropPosition(info);
    const dropLocBefore = locateByTreeKey(clone, dropKey);
    if (!dropLocBefore) return { ok: false, message: '找不到放置目标' };

    const draggedNode = dragLoc.node;
    if (draggedNode.kind === 'folder' && !dropToGap && dropLocBefore.kind === 'folder') {
      if (String(draggedNode.id) === String(dropLocBefore.node.id)) return { ok: false, message: '不能将文件夹移入自身' };
      if (folderCoversId(draggedNode, dropLocBefore.node.id)) return { ok: false, message: '不能将文件夹移入其子文件夹' };
    }

    const [removed] = dragLoc.parent.splice(dragLoc.index, 1);
    if (!removed) return { ok: false, message: '移动失败' };

    const dropLocAfter = locateByTreeKey(clone, dropKey);
    let parentList;
    let insertIndex = 0;

    if (dropKey === 'rule') {
      if (dropToGap && relative < 0) {
        dragLoc.parent.splice(dragLoc.index, 0, removed);
        return { ok: false, message: '不能在审计思路之上插入' };
      }
      parentList = clone;
      insertIndex = 0;
    } else if (!dropLocAfter) {
      dragLoc.parent.splice(dragLoc.index, 0, removed);
      return { ok: false, message: '无效的放置位置' };
    } else if (!dropToGap) {
      if (dropLocAfter.kind === 'folder') {
        if (removed.kind === 'folder' && folderCoversId(removed, dropLocAfter.node.id)) {
          dragLoc.parent.splice(dragLoc.index, 0, removed);
          return { ok: false, message: '不能将文件夹移入其子文件夹' };
        }
        if (!Array.isArray(dropLocAfter.node.children)) dropLocAfter.node.children = [];
        parentList = dropLocAfter.node.children;
        insertIndex = parentList.length;
      } else {
        parentList = dropLocAfter.parent;
        insertIndex = dropLocAfter.index;
      }
    } else {
      parentList = dropLocAfter.parent;
      if (!parentList) {
        dragLoc.parent.splice(dragLoc.index, 0, removed);
        return { ok: false, message: '无效的放置位置' };
      }
      insertIndex = relative <= -1 ? dropLocAfter.index : dropLocAfter.index + 1;
    }

    insertIndex = Math.max(0, Math.min(insertIndex, parentList.length));
    parentList.splice(insertIndex, 0, removed);

    if (findDuplicatePaths(clone).length) {
      return { ok: false, message: '移动后文件名路径重复，已取消' };
    }

    live.splice(0, live.length, ...clone);
    syncExtractionRulesFromSkillFiles(skill);
    return { ok: true };
  }

  /** 供 a-tree :draggable —— 审计思路不可拖 */
  function treeNodeIsDraggable(node) {
    const k = antTreeNodeKey(node);
    return !!(k && k !== 'rule');
  }

  global.DemoSkillFileTree = {
    ensureSkillFiles,
    newFileNode,
    newFolderNode,
    walkFiles,
    findDuplicatePaths,
    flattenToExtractionRules,
    syncExtractionRulesFromSkillFiles,
    findFileNodeById,
    findFolderNodeById,
    removeNodeById,
    insertChild,
    collectFolderKeys,
    buildAntTreeData,
    defaultExpandedKeys,
    nodeToAnt,
    remapSkillFilesTree,
    findAddParentRef,
    applyTreeDropFromAntEvent,
    treeNodeIsDraggable,
    antTreeNodeKey,
  };
})(typeof window !== 'undefined' ? window : globalThis);
