(function () {
  function getFreeAuditQuery() {
    const raw = (window.location.hash || '').replace(/^#/, '');
    const base = raw.split('?')[0];
    if (base !== 'freeaudit' && base !== 'freeaudit-v2') return {};
    const q = raw.includes('?') ? raw.split('?')[1] : '';
    const params = new URLSearchParams(q || '');
    return {
      projectId: params.get('projectId') || null,
      materialId: params.get('materialId') || null,
      analysisResultId: params.get('analysisResultId') || null,
      reportId: params.get('reportId') || null,
      openTemplate: params.get('openTemplate') === '1',
    };
  }

  const presetSuggestions = [
    '总结当前工作台中的主要疑点',
    '从资料中找出合规风险点',
    '基于所选资料生成报告初稿'
  ];

  /** 审计助手 · 工作台样例对话（由工作台自动加载，不再通过历史切换） */
  const CHAT_DEMO_SCENARIOS = Object.freeze([
    {
      id: 'scenario-queue',
      title: '排队样例',
      kind: 'queued',
      seedText: '梳理合同付款节点与发票开具的差异',
      queuePosition: 3,
    },
    {
      id: 'scenario-full',
      title: '基础样例',
      kind: 'full',
      seedText: '总结当前工作台中的主要疑点',
    },
    {
      id: 'scenario-result-decision',
      title: '审批样例',
      kind: 'result-decision',
      seedText: '请帮我删除结果树里「预算测算草稿」下的预算偏差临时表',
      isDefault: true,
    },
    {
      id: 'scenario-guide',
      title: '初始化引导样例',
      kind: 'guide',
    },
  ]);

  const WORKBENCH_DEMO_SCENARIO_BY_PROJECT_ID = Object.freeze({
    'PRJ-2026-001': 'scenario-full',
    'PRJ-2026-002': 'scenario-queue',
    'PRJ-2026-003': 'scenario-result-decision',
    'PRJ-2026-004': 'scenario-guide',
  });

  function resolveWorkbenchDemoScenario(projectId) {
    const scenarioId = WORKBENCH_DEMO_SCENARIO_BY_PROJECT_ID[String(projectId || '')];
    if (!scenarioId) return null;
    return CHAT_DEMO_SCENARIOS.find((s) => s.id === scenarioId) || null;
  }

  const WORKBENCH_PROJECT_NAME_BY_ID = Object.freeze({
    'PRJ-2026-001': 'A市城建集团年度经济责任审计',
    'PRJ-2026-002': '模型繁忙与排队反馈',
    'PRJ-2026-003': '工具调用授权确认',
    'PRJ-2026-004': '空白对话起步',
    'PRJ-2026-005': 'E区财政收支审计',
    'PRJ-2026-006': 'F县乡村振兴资金审计',
    'PRJ-001': 'A市城建项目',
    'PRJ-002': 'B区采购专项',
    'PRJ-003': 'C县专项审计',
  });

  const SUMMARY_RESPONSE_DEMO = `基于所选资料，关于「总结当前工作台中的主要疑点」的总结：

1. 主要疑点：合同金额 100 万与已开发票 58 万不一致 [1][2]，剩余 42 万未开票，需核实是否已履约或分批开票；审批单金额 8 万与合同尾款 50 万（50%）不符 [1][3]，疑为分批审批或审批范围差异。

2. 合规风险：支出科目「应付账款」32 万与银行实际支付 58 万存在差异 [2][4]，需核对明细与分类；审批流程与合同约定付款节点未一一对应，待人工确认。

3. 建议：对上述疑点进行人工确认后纳入报告；建议补充合同履约证明及剩余发票。

引用：[1][2][3]`;

  const DEMO_RUN_SUMMARY_TEXT = '本次模型已完成：资料阅读与多轮关键词检索、技能「疑点归纳与交叉核对」结构化输出，并已更新《审计备忘录-疑点摘录.md》差异草案。你可继续追问、保存到结果或将结论沉淀为技能。';

  function demoToolDiffLineClass(line) {
    const s = String(line);
    if (s.startsWith('-')) return 'nlm-tool-diff-line--del';
    if (s.startsWith('+')) return 'nlm-tool-diff-line--add';
    return 'nlm-tool-diff-line--ctx';
  }

  function demoLinesUnifiedDiff(oldText, newText, options) {
    const maxOut = (options && options.maxOut) || 500;
    const cap = 600;
    const a0 = String(oldText || '').split(/\r?\n/);
    const b0 = String(newText || '').split(/\r?\n/);
    const truncatedInput = a0.length > cap || b0.length > cap;
    const a = a0.slice(0, cap);
    const b = b0.slice(0, cap);
    const n = a.length;
    const m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = dp[i - 1][j] > dp[i][j - 1] ? dp[i - 1][j] : dp[i][j - 1];
      }
    }
    const out = [];
    let i = n;
    let j = m;
    let truncated = truncatedInput;
    while ((i > 0 || j > 0) && out.length < maxOut) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        out.push(` ${a[i - 1]}`);
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        out.push(`+${b[j - 1]}`);
        j--;
      } else if (i > 0) {
        out.push(`-${a[i - 1]}`);
        i--;
      } else {
        break;
      }
    }
    if (i > 0 || j > 0) truncated = true;
    out.reverse();
    return { lines: out, truncated };
  }

  function toAnalysisTemplateShared(seed, library) {
    const row = {
      id: seed.id,
      name: seed.name,
      description: seed.description || '',
      tags: Array.isArray(seed.tags) ? seed.tags.slice() : [],
      skillFiles: Array.isArray(seed.skillFiles) ? JSON.parse(JSON.stringify(seed.skillFiles)) : [],
      extractionRules: [],
      analysisRule: seed.analysisRule || '',
      applicableScenario: seed.applicableScenario != null ? String(seed.applicableScenario) : '',
      linkedResourceIds: Array.isArray(seed.linkedResourceIds) ? seed.linkedResourceIds.map((id) => String(id)) : [],
      linkedResourceMeta: seed.linkedResourceMeta && typeof seed.linkedResourceMeta === 'object' ? { ...seed.linkedResourceMeta } : {},
      createdAt: seed.createdAt,
      updatedAt: seed.updatedAt,
      library,
    };
    if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
      DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
    }
    return row;
  }

  function normalizeWorkbenchMaterialParentId(v) {
    if (v === undefined || v === null || v === '') return null;
    return String(v);
  }

  function wbMatAntTreeKey(kind, id) {
    return `${kind}:${String(id)}`;
  }

  function wbMatParseTreeKey(key) {
    const s = String(key || '');
    if (s.startsWith('folder:')) return { kind: 'folder', id: s.slice('folder:'.length) };
    if (s.startsWith('raw:')) return { kind: 'raw', id: s.slice('raw:'.length) };
    return { kind: '', id: '' };
  }

  function wbMatAntTreeNodeKey(node) {
    if (!node) return null;
    if (node.key != null) return node.key;
    if (node.eventKey != null) return node.eventKey;
    return null;
  }

  /** rc-tree / ant-tree：与 node.pos 末段结合得到相对落点（-1 前 / 0 中 / 1 后） */
  function wbMatRelativeDropPosition(info) {
    const pos = info && info.node && info.node.pos != null ? String(info.node.pos) : '0';
    const parts = pos.split('-');
    const last = Number(parts[parts.length - 1]);
    const dp = info && info.dropPosition;
    if (dp == null || Number.isNaN(last)) return 0;
    return dp - last;
  }

  function wbMatFolderCoversTarget(folders, rootFolderId, targetFolderId) {
    if (!rootFolderId || !targetFolderId) return false;
    if (String(rootFolderId) === String(targetFolderId)) return true;
    const list = Array.isArray(folders) ? folders : [];
    const children = list.filter((f) => normalizeWorkbenchMaterialParentId(f.parentId) === String(rootFolderId));
    for (let i = 0; i < children.length; i++) {
      if (wbMatFolderCoversTarget(list, children[i].id, targetFolderId)) return true;
    }
    return false;
  }

  /** 从根到该文件夹名称路径（不含文件名） */
  function wbMatMaterialPathSegmentsForParentFolderId(folderId, folders) {
    const list = Array.isArray(folders) ? folders : [];
    const byId = new Map(list.map((f) => [String(f.id), f]));
    const segs = [];
    let pid = folderId != null ? String(folderId) : '';
    const guard = new Set();
    while (pid && byId.has(pid) && !guard.has(pid)) {
      guard.add(pid);
      const f = byId.get(pid);
      segs.push(String(f.name || f.id || '').trim() || String(f.id));
      pid = normalizeWorkbenchMaterialParentId(f.parentId) || '';
    }
    segs.reverse();
    return segs;
  }

  /** 资料行（projectSource）路径前缀，如「合同与财务/合同扫描件/」 */
  function wbMatMaterialPathPrefixForRow(materialProjectRow, folders) {
    const pid = normalizeWorkbenchMaterialParentId(materialProjectRow && materialProjectRow.parentId);
    if (!pid) return '';
    const segs = wbMatMaterialPathSegmentsForParentFolderId(pid, folders);
    return segs.length ? `${segs.join('/')}/` : '';
  }

  function wbMatExpandFolderAncestors(folderId, folders) {
    const keys = [];
    const list = Array.isArray(folders) ? folders : [];
    const byId = new Map(list.map((f) => [String(f.id), f]));
    let pid = folderId != null ? String(folderId) : '';
    const guard = new Set();
    while (pid && byId.has(pid) && !guard.has(pid)) {
      guard.add(pid);
      keys.push(wbMatAntTreeKey('folder', pid));
      const f = byId.get(pid);
      pid = normalizeWorkbenchMaterialParentId(f.parentId) || '';
    }
    return keys;
  }

  /**
   * 建树：仅文件夹 + 已完成资料；搜索时命中子项则纳入祖先文件夹；仅在搜索模式下裁剪无可见子节点的空文件夹（非搜索时保留空夹，否则「新建文件夹」不可见）。
   * @returns {{ treeData: any[], autoExpandKeys: string[] }}
   */
  function buildWorkbenchMaterialAntTreeData(input) {
    const folderList = Array.isArray(input.folders) ? input.folders.slice() : [];
    const sourceRows = Array.isArray(input.materialProjectRows)
      ? input.materialProjectRows
      : (Array.isArray(input.doneMaterialProjectRows) ? input.doneMaterialProjectRows : []);
    const allowedStatusSet = new Set(Array.isArray(input.includeStatuses) && input.includeStatuses.length ? input.includeStatuses : ['done']);
    const materialRows = sourceRows.filter((r) => allowedStatusSet.has(String(r.status || 'done')));
    const q = String(input.searchQuery || '').trim().toLowerCase();
    const folderById = new Map(folderList.map((f) => [String(f.id), f]));

    function rowMatches(r) {
      if (!q) return true;
      const title = String(r.name || '').toLowerCase();
      return title.includes(q);
    }
    function folderMatches(f) {
      if (!q) return true;
      return String(f.name || '').toLowerCase().includes(q);
    }

    const visibleRawIds = new Set();
    materialRows.forEach((r) => {
      if (rowMatches(r)) visibleRawIds.add(String(r.id));
    });

    if (q) {
      function addRawsUnderFolderRecursive(fid) {
        materialRows.forEach((r) => {
          if (normalizeWorkbenchMaterialParentId(r.parentId) === String(fid)) visibleRawIds.add(String(r.id));
        });
        folderList.forEach((ch) => {
          if (normalizeWorkbenchMaterialParentId(ch.parentId) === String(fid)) addRawsUnderFolderRecursive(ch.id);
        });
      }
      folderList.forEach((f) => {
        if (folderMatches(f)) addRawsUnderFolderRecursive(f.id);
      });
    }

    const visibleFolderIds = new Set();
    visibleRawIds.forEach((rid) => {
      const r = materialRows.find((x) => String(x.id) === rid);
      if (!r) return;
      wbMatExpandFolderAncestors(normalizeWorkbenchMaterialParentId(r.parentId), folderList)
        .map((k) => wbMatParseTreeKey(k))
        .filter((x) => x.kind === 'folder' && x.id)
        .forEach((x) => visibleFolderIds.add(String(x.id)));
    });
    if (q) {
      folderList.forEach((f) => {
        if (folderMatches(f)) visibleFolderIds.add(String(f.id));
      });
    } else {
      folderList.forEach((f) => visibleFolderIds.add(String(f.id)));
    }

    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
    function sortKey(a, b) {
      const sa = Number(a.sort) || 0;
      const sb = Number(b.sort) || 0;
      if (sa !== sb) return sa - sb;
      return collator.compare(String(a.nameKey || a.id || ''), String(b.nameKey || b.id || ''));
    }

    function buildRawNode(r) {
      const id = String(r.id);
      return {
        key: wbMatAntTreeKey('raw', id),
        title: String(r.name || '未命名'),
        isLeaf: true,
        isFolder: false,
        selectable: true,
        materialId: id,
        rawProjectRow: r,
      };
    }

    function buildFolderNode(f) {
      const id = String(f.id);
      const childFolders = folderList
        .filter((c) => normalizeWorkbenchMaterialParentId(c.parentId) === id && (!q || visibleFolderIds.has(String(c.id))))
        .sort(sortKey);
      const childRaws = materialRows
        .filter((r) => normalizeWorkbenchMaterialParentId(r.parentId) === id && visibleRawIds.has(String(r.id)))
        .map((r) => ({ ...r, nameKey: r.name, id: r.id }))
        .sort(sortKey);
      const folderChildren = childFolders.map((cf) => buildFolderNode(cf));
      const rawChildren = childRaws.map((r) => buildRawNode(r));
      const children = [...folderChildren, ...rawChildren];
      const descendantFileCount =
        rawChildren.length +
        folderChildren.reduce((sum, node) => sum + (Number(node.descendantFileCount) || 0), 0);
      return {
        key: wbMatAntTreeKey('folder', id),
        title: String(f.name || '未命名文件夹'),
        isFolder: true,
        isLeaf: false,
        selectable: true,
        folderId: id,
        folderRow: f,
        descendantFileCount,
        children,
      };
    }

    function pruneEmptyFolders(node) {
      if (!node || !node.isFolder) return node;
      const nextChildren = (node.children || []).map(pruneEmptyFolders).filter(Boolean);
      if (!nextChildren.length) return null;
      const descendantFileCount = nextChildren.reduce((sum, child) => {
        if (child.isFolder) return sum + (Number(child.descendantFileCount) || 0);
        return sum + 1;
      }, 0);
      return { ...node, children: nextChildren, descendantFileCount };
    }

    const rootsFolders = folderList
      .filter((f) => !normalizeWorkbenchMaterialParentId(f.parentId) && (!q || visibleFolderIds.has(String(f.id))))
      .sort(sortKey);
    const rootsRaws = materialRows
      .filter((r) => !normalizeWorkbenchMaterialParentId(r.parentId) && visibleRawIds.has(String(r.id)))
      .map((r) => ({ ...r, nameKey: r.name }))
      .sort(sortKey);
    const treeChildren = [
      ...rootsFolders.map((f) => buildFolderNode(f)),
      ...rootsRaws.map((r) => buildRawNode(r)),
    ];
    const treeData = q ? treeChildren.map(pruneEmptyFolders).filter(Boolean) : treeChildren;
    const autoExpandKeys = [];
    if (q) {
      visibleFolderIds.forEach((fid) => autoExpandKeys.push(wbMatAntTreeKey('folder', fid)));
    }
    return { treeData, autoExpandKeys };
  }

  /** 审计助手右侧「结果」栏：与资料文件树一致的 Ant Tree key 约定 */
  function wbArAntTreeKey(kind, id) {
    return `${kind}:${String(id)}`;
  }

  function wbArParseTreeKey(key) {
    const s = String(key || '');
    if (s.startsWith('arfolder:')) return { kind: 'folder', id: s.slice('arfolder:'.length) };
    if (s.startsWith('aranalysis:')) return { kind: 'analysis', id: s.slice('aranalysis:'.length) };
    return { kind: '', id: '' };
  }

  const WB_AR_RESULT_ROOT_FOLDER_KEY = wbArAntTreeKey('folder', '__result_root__');
  const WB_AR_TASK_OUTPUT_FOLDER_KEY = wbArAntTreeKey('folder', '__task_output__');
  const WB_AR_DIALOG_OUTPUT_FOLDER_KEY = wbArAntTreeKey('folder', '__dialog_output__');
  /** 兼容旧导出：与「任务产出 / 对话产出」节点 key 一致 */
  const WB_AR_TASK_ROOT_FOLDER_KEY = WB_AR_TASK_OUTPUT_FOLDER_KEY;
  const WB_AR_DIALOG_ROOT_FOLDER_KEY = WB_AR_DIALOG_OUTPUT_FOLDER_KEY;

  function isDialogResultMaterial(m) {
    const ps = m && m.projectSource ? m.projectSource : {};
    return ps.resultTreeBucket === 'dialog' || ps.sourceDialog === true;
  }

  function normalizeArResultFolderParentId(v) {
    if (v === undefined || v === null || v === '') return null;
    return String(v);
  }

  function linkedTaskIdOfResultFolder(f) {
    return f && String(f.linkedTaskId || '').trim() ? String(f.linkedTaskId).trim() : '';
  }

  function wbArFolderCoversTarget(folders, rootFolderId, targetFolderId) {
    if (!rootFolderId || !targetFolderId) return false;
    if (String(rootFolderId) === String(targetFolderId)) return true;
    const list = Array.isArray(folders) ? folders : [];
    const children = list.filter((f) => normalizeArResultFolderParentId(f.parentId) === String(rootFolderId));
    for (let i = 0; i < children.length; i++) {
      if (wbArFolderCoversTarget(list, children[i].id, targetFolderId)) return true;
    }
    return false;
  }

  /**
   * 结果树：根下为文件夹与「根级结果」叶子混排（无「任务产出/对话产出」虚拟分组）；子夹 parentId 挂在父夹下；
   * 任务关联夹 linkedTaskId 下仍合并「未指定 resultFolderId 但 sourceTaskId 一致」的产出。
   * @param {{ materials: any[], searchQuery?: string, sortMode?: 'name'|'created_desc'|'created_asc', resultFolders?: { id: string, name?: string, parentId?: string | null, sort?: number, resultTreeAnchor?: string, parentTaskId?: string | null, linkedTaskId?: string | null }[] }} input
   * @returns {{ treeData: any[], autoExpandKeys: string[], initialExpandKeys: string[] }}
   */
  function buildWorkbenchAnalysisResultAntTreeData(input) {
    const materials = Array.isArray(input.materials) ? input.materials : [];
    const resultFolders = Array.isArray(input.resultFolders) ? input.resultFolders : [];
    const q = String(input.searchQuery || '').trim().toLowerCase();
    const rawSortMode = String(input.sortMode || 'name');
    const sortMode = ['created_desc', 'created_asc'].includes(rawSortMode) ? rawSortMode : 'name';
    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
    const folderById = new Map(resultFolders.map((f) => [String(f.id), f]));

    function rowMatches(m) {
      if (!q) return true;
      const title = String(m.title || '').toLowerCase();
      const ps = m && m.projectSource ? m.projectSource : {};
      const skill = String(ps.sourceSkillName || '').toLowerCase();
      const taskTitle = String(ps.sourceTaskName || ps.taskName || '').toLowerCase();
      if (isDialogResultMaterial(m) && ['对话', '会话', '助手'].some((kw) => q.includes(kw))) return true;
      return title.includes(q) || skill.includes(q) || taskTitle.includes(q);
    }

    function folderMetaMatches(f) {
      if (!q) return true;
      return String(f.name || '').toLowerCase().includes(q);
    }

    function createdTimeOfMaterial(m) {
      const ps = m && m.projectSource ? m.projectSource : {};
      const raw = String(ps.createdAt || m.meta || m.createdAt || '').trim();
      if (!raw) return null;
      const t = Date.parse(raw.includes('T') ? raw : raw.replace(' ', 'T'));
      return Number.isNaN(t) ? null : t;
    }

    function byName(a, b) {
      return collator.compare(String(a.nameKey || a.title || a.id || ''), String(b.nameKey || b.title || b.id || ''));
    }

    function byTime(a, b) {
      const at = typeof a.sortTime === 'number' && Number.isFinite(a.sortTime) ? a.sortTime : null;
      const bt = typeof b.sortTime === 'number' && Number.isFinite(b.sortTime) ? b.sortTime : null;
      if (at == null && bt == null) return byName(a, b);
      if (at == null) return 1;
      if (bt == null) return -1;
      const diff = sortMode === 'created_asc' ? at - bt : bt - at;
      return diff || byName(a, b);
    }

    function sortEntries(entries) {
      const sorter = sortMode === 'name' ? byName : byTime;
      return entries.slice().sort(sorter);
    }

    function sortTreeChildren(folderChildren, leafNodes) {
      return [...sortEntries(folderChildren), ...sortEntries(leafNodes)];
    }

    function buildLeafNode(m) {
      const title = String(m.title || '未命名');
      return {
        key: wbArAntTreeKey('analysis', String(m.id)),
        title,
        isLeaf: true,
        isFolder: false,
        selectable: true,
        materialId: String(m.id),
        nameKey: title,
        sortTime: createdTimeOfMaterial(m),
      };
    }

    function visibleMaterialsForFolder(folderTitle, arr) {
      if (!q) return arr.slice();
      const ft = String(folderTitle || '').toLowerCase();
      if (ft.includes(q)) return arr.slice();
      return arr.filter(rowMatches);
    }

    function materialsLooseForLinkedTask(ltid) {
      const tid = String(ltid || '').trim();
      if (!tid) return [];
      return materials.filter((m) => {
        if (isDialogResultMaterial(m)) return false;
        const ps = m && m.projectSource ? m.projectSource : {};
        if (String(ps.resultFolderId || '').trim()) return false;
        return String(ps.sourceTaskId || '').trim() === tid;
      });
    }

    function materialsInFolderById(fid) {
      const id = String(fid);
      return materials.filter((m) => {
        const ps = m && m.projectSource ? m.projectSource : {};
        return String(ps.resultFolderId || '') === id;
      });
    }

    function materialsMergedInFolder(fid, ltid) {
      const looseMatFilter = folderMetaMatches(folderById.get(String(fid)) || { name: '' }) ? () => true : rowMatches;
      const inFolder = materialsInFolderById(fid).filter(looseMatFilter);
      const looseTask = ltid ? materialsLooseForLinkedTask(ltid).filter(looseMatFilter) : [];
      const byId = new Map();
      inFolder.forEach((m) => byId.set(String(m.id), m));
      looseTask.forEach((m) => {
        if (!byId.has(String(m.id))) byId.set(String(m.id), m);
      });
      return Array.from(byId.values());
    }

    function buildResultFolderBranch(fid) {
      const f = folderById.get(String(fid));
      if (!f) return null;
      const id = String(f.id);
      const ltid = linkedTaskIdOfResultFolder(f);
      const childMetas = resultFolders
        .filter((c) => {
          const p = normalizeArResultFolderParentId(c.parentId);
          if (p === id) return true;
          if (ltid && !normalizeArResultFolderParentId(c.parentId) && String(c.parentTaskId || '').trim() === ltid) return true;
          return false;
        });
      const matsArr = materialsMergedInFolder(id, ltid);
      const vis = visibleMaterialsForFolder(String(f.name || ''), matsArr);
      const folderChildren = childMetas.map((c) => buildResultFolderBranch(c.id)).filter(Boolean);
      const leafNodes = vis.map(buildLeafNode);
      const children = sortTreeChildren(folderChildren, leafNodes);
      const descendantFileCount =
        leafNodes.length +
        folderChildren.reduce((sum, node) => sum + (Number(node.descendantFileCount) || 0), 0);
      const childTimes = children
        .map((node) => (typeof node.sortTime === 'number' && Number.isFinite(node.sortTime) ? node.sortTime : null))
        .filter((t) => t != null);
      const sortTime = childTimes.length
        ? (sortMode === 'created_asc' ? Math.min(...childTimes) : Math.max(...childTimes))
        : null;
      const title = String(f.name || '未命名文件夹');
      return {
        key: wbArAntTreeKey('folder', id),
        folderName: title,
        title,
        isFolder: true,
        isLeaf: !children.length,
        selectable: true,
        folderKind: 'userResult',
        userFolderId: id,
        linkedTaskFolder: !!ltid,
        descendantFileCount,
        children,
        nameKey: title,
        sortTime,
      };
    }

    const rootFolderMetas = resultFolders
      .filter((f) => !normalizeArResultFolderParentId(f.parentId) && !String(f.parentTaskId || '').trim())
      .slice();
    const linkedRootTaskIds = new Set(
      rootFolderMetas.map((x) => linkedTaskIdOfResultFolder(x)).filter(Boolean),
    );

    const rootLooseMaterials = materials.filter((m) => {
      if (!rowMatches(m)) return false;
      const ps = m && m.projectSource ? m.projectSource : {};
      if (String(ps.resultFolderId || '').trim()) return false;
      const tid = String(ps.sourceTaskId || '').trim();
      if (tid && linkedRootTaskIds.has(tid)) return false;
      return true;
    });

    const rootEntries = [
      ...rootFolderMetas.map((fm) => ({
        t: 'folder',
        node: buildResultFolderBranch(fm.id),
        nameKey: fm.name || fm.id,
      })),
      ...rootLooseMaterials.map((m) => ({
        t: 'leaf',
        node: buildLeafNode(m),
        nameKey: m.title || m.id,
      })),
    ]
      .filter((x) => x.node)
      .sort((a, b) => {
        if (a.t !== b.t) return a.t === 'folder' ? -1 : 1;
        const an = a.node || {};
        const bn = b.node || {};
        return sortMode === 'name' ? byName(an, bn) : byTime(an, bn);
      });

    let treeData = rootEntries.map((x) => x.node).filter(Boolean);
    if (!treeData.length) {
      return { treeData: [], autoExpandKeys: [], initialExpandKeys: [] };
    }

    function pruneEmptyFolders(node) {
      if (!node || !node.isFolder) return node;
      const nextChildren = (node.children || []).map(pruneEmptyFolders).filter(Boolean);
      const folderMatched = folderMetaMatches({ name: node.title });
      if (q && !folderMatched && !nextChildren.length) return null;
      const descendantFileCount = nextChildren.reduce((sum, child) => {
        if (child.isFolder) return sum + (Number(child.descendantFileCount) || 0);
        return sum + 1;
      }, 0);
      const nextTimes = nextChildren
        .map((child) => (typeof child.sortTime === 'number' && Number.isFinite(child.sortTime) ? child.sortTime : null))
        .filter((t) => t != null);
      const sortTime = nextTimes.length
        ? (sortMode === 'created_asc' ? Math.min(...nextTimes) : Math.max(...nextTimes))
        : null;
      return { ...node, children: nextChildren, isLeaf: !nextChildren.length, descendantFileCount, sortTime };
    }
    treeData = treeData.map(pruneEmptyFolders).filter(Boolean);
    if (!treeData.length) {
      return { treeData: [], autoExpandKeys: [], initialExpandKeys: [] };
    }

    function wbArExpandResultFolderAncestorsForMaterial(m) {
      const keys = [];
      const ps = m && m.projectSource ? m.projectSource : {};
      let pid = normalizeArResultFolderParentId(ps.resultFolderId);
      const guard = new Set();
      while (pid && folderById.has(pid) && !guard.has(pid)) {
        guard.add(pid);
        keys.push(wbArAntTreeKey('folder', pid));
        const pf = folderById.get(pid);
        pid = normalizeArResultFolderParentId(pf && pf.parentId);
      }
      return keys;
    }

    const autoExpandKeys = [];
    if (q) {
      rootFolderMetas.forEach((fm) => {
        const n = buildResultFolderBranch(fm.id);
        if (n && n.key) autoExpandKeys.push(n.key);
      });
      materials.forEach((m) => {
        if (!rowMatches(m)) return;
        wbArExpandResultFolderAncestorsForMaterial(m).forEach((k) => autoExpandKeys.push(k));
      });
    }

    return { treeData, autoExpandKeys, initialExpandKeys: [] };
  }

  /** 创建任务 ·「结果输出位置」：选中根目录时的 value */
  const WB_TASK_CREATE_RESULT_OUTPUT_ROOT = '__root__';

  /**
   * 创建任务弹窗：结果树仅文件夹（含根目录），与 buildWorkbenchAnalysisResultAntTreeData 的 parentId / parentTaskId 规则一致。
   * @param {Array<{ id: string, name?: string, parentId?: string | null, sort?: number, parentTaskId?: string | null, linkedTaskId?: string | null }>} resultFolders
   * @returns {Array<{ value: string, title: string, key: string, selectable: boolean, isLeaf?: boolean, children?: any[] }>}
   */
  function buildWorkbenchAnalysisResultFolderPickerTree(resultFolders) {
    const folders = Array.isArray(resultFolders) ? resultFolders : [];
    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

    function sortFolders(list) {
      return list.slice().sort((a, b) => {
        const sa = Number(a.sort) || 0;
        const sb = Number(b.sort) || 0;
        if (sa !== sb) return sa - sb;
        return collator.compare(String(a.name || a.id || ''), String(b.name || b.id || ''));
      });
    }

    function childFolderMetas(parentFolderId, parentLinkedTaskId) {
      const pid = parentFolderId == null ? null : String(parentFolderId);
      const ltid = parentLinkedTaskId == null ? '' : String(parentLinkedTaskId);
      return sortFolders(
        folders.filter((f) => {
          const p = normalizeArResultFolderParentId(f.parentId);
          const pt = String(f.parentTaskId || '').trim();
          if (pid) {
            if (p === pid) return true;
            if (ltid && !p && pt === ltid) return true;
            return false;
          }
          return p == null && !pt;
        }),
      );
    }

    function buildFolderNode(f) {
      const id = String(f.id);
      const ltid = linkedTaskIdOfResultFolder(f);
      const kids = childFolderMetas(id, ltid).map(buildFolderNode);
      return {
        value: id,
        title: String(f.name || '未命名文件夹'),
        key: id,
        selectable: true,
        isLeaf: !kids.length,
        children: kids.length ? kids : undefined,
      };
    }

    const rootKids = childFolderMetas(null, null).map(buildFolderNode);
    return [
      {
        value: WB_TASK_CREATE_RESULT_OUTPUT_ROOT,
        title: '根目录',
        key: WB_TASK_CREATE_RESULT_OUTPUT_ROOT,
        selectable: true,
        children: rootKids.length ? rootKids : undefined,
      },
    ];
  }

  function resolveWbTaskCreateResultOutputFolder(resultOutputFolderId, resultFolders) {
    const raw = String(resultOutputFolderId || '').trim();
    if (!raw || raw === WB_TASK_CREATE_RESULT_OUTPUT_ROOT) {
      return { folderId: null, folderLabel: '根目录' };
    }
    const f = (Array.isArray(resultFolders) ? resultFolders : []).find((x) => String(x.id) === raw);
    return {
      folderId: raw,
      folderLabel: (f && String(f.name || '').trim()) || '未命名文件夹',
    };
  }

  function wbArCollectSiblingEntriesForDrop(parentFolderId, folders, rows) {
    const pNorm = parentFolderId == null || parentFolderId === '' ? null : String(parentFolderId);
    const parentFolderObj = pNorm ? folders.find((x) => String(x.id) === pNorm) : null;
    const linkedForParent = parentFolderObj ? linkedTaskIdOfResultFolder(parentFolderObj) : '';

    const linkedRootTids = new Set(
      folders
        .filter((f) => {
          const fp = normalizeArResultFolderParentId(f.parentId);
          const pt = String(f.parentTaskId || '').trim();
          return fp == null && !pt;
        })
        .map((f) => linkedTaskIdOfResultFolder(f))
        .filter(Boolean),
    );

    const folderKids = folders
      .filter((f) => {
        const fp = normalizeArResultFolderParentId(f.parentId);
        const pt = String(f.parentTaskId || '').trim();
        if (pNorm == null) return fp == null && !pt;
        if (fp === pNorm) return true;
        if (linkedForParent && fp == null && pt === linkedForParent) return true;
        return false;
      })
      .map((f) => ({ t: 'folder', o: f, sort: Number(f.sort) || 0, nameKey: f.name || f.id }));

    const analysisKids = rows
      .filter((r) => {
        const rid = String(r.resultFolderId || '').trim();
        const tid = String(r.sourceTaskId || '').trim();
        if (pNorm == null) {
          if (rid) return false;
          if (tid && linkedRootTids.has(tid)) return false;
          return true;
        }
        if (rid === pNorm) return true;
        if (linkedForParent && !rid && tid === linkedForParent) return true;
        return false;
      })
      .map((r) => ({ t: 'analysis', o: r, sort: Number(r.sort) || 0, nameKey: r.name || r.id }));

    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
    return [...folderKids, ...analysisKids].sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return collator.compare(String(a.nameKey), String(b.nameKey));
    });
  }

  function wbArRenumberSorts(parentFolderId, folders, rows) {
    const sibs = wbArCollectSiblingEntriesForDrop(parentFolderId, folders, rows);
    sibs.forEach((item, idx) => {
      if (item.t === 'folder') {
        const i = folders.findIndex((f) => String(f.id) === String(item.o.id));
        if (i >= 0) folders[i] = { ...folders[i], sort: idx };
      } else {
        const i = rows.findIndex((r) => String(r.id) === String(item.o.id));
        if (i >= 0) rows[i] = { ...rows[i], sort: idx };
      }
    });
  }

  /**
   * 将 Ant Tree 的 drop 落到 demoProjectAnalysisResultFoldersById / demoProjectAnalysisResultsById（仅演示）。
   * @returns {{ ok: boolean, message?: string }}
   */
  function applyWorkbenchAnalysisResultTreeDrop(projectId, info) {
    const pid = String(projectId || '');
    if (!pid) return { ok: false, message: '未定位工作台' };
    const rows = typeof demoProjectAnalysisResultsById !== 'undefined' ? demoProjectAnalysisResultsById[pid] : null;
    const folds = typeof demoProjectAnalysisResultFoldersById !== 'undefined' ? demoProjectAnalysisResultFoldersById[pid] : null;
    if (!Array.isArray(rows) || !Array.isArray(folds)) return { ok: false, message: '结果数据未就绪' };

    const dragKey = wbMatAntTreeNodeKey(info && info.dragNode) || (info.dragNodesKeys && info.dragNodesKeys[0]);
    const dropKey = wbMatAntTreeNodeKey(info && info.node);
    if (!dragKey || !dropKey || String(dragKey) === String(dropKey)) return { ok: false, message: '无效的拖拽' };

    const drag = wbArParseTreeKey(dragKey);
    const drop = wbArParseTreeKey(dropKey);
    if (!drag.id || !drop.id) return { ok: false, message: '无效的节点' };
    if (drag.kind !== 'folder' && drag.kind !== 'analysis') return { ok: false, message: '未知的拖拽类型' };
    if (drop.kind !== 'folder' && drop.kind !== 'analysis') return { ok: false, message: '无效的放置目标' };

    const dropToGap = info.dropToGap === true;
    const rel = wbMatRelativeDropPosition(info);

    const dragFolder = drag.kind === 'folder' ? folds.find((f) => String(f.id) === drag.id) : null;
    const dragRow = drag.kind === 'analysis' ? rows.find((r) => String(r.id) === drag.id) : null;
    if (drag.kind === 'folder' && !dragFolder) return { ok: false, message: '找不到被拖拽文件夹' };
    if (drag.kind === 'analysis' && !dragRow) return { ok: false, message: '找不到被拖拽结果' };

    const dragObj = drag.kind === 'folder' ? dragFolder : dragRow;
    const oldParentFolder =
      drag.kind === 'folder'
        ? normalizeArResultFolderParentId(dragFolder.parentId)
        : normalizeArResultFolderParentId(dragRow.resultFolderId);

    function applyOrder(targetParentFolderId, ordered) {
      const tp = targetParentFolderId == null || targetParentFolderId === '' ? null : String(targetParentFolderId);
      ordered.forEach((item, idx) => {
        if (item.t === 'folder') {
          const i = folds.findIndex((f) => String(f.id) === String(item.o.id));
          if (i >= 0) {
            folds[i] = {
              ...folds[i],
              parentId: tp,
              sort: idx,
              parentTaskId: null,
            };
          }
        } else {
          const i = rows.findIndex((r) => String(r.id) === String(item.o.id));
          if (i >= 0) {
            rows[i] = {
              ...rows[i],
              resultFolderId: tp,
              sort: idx,
            };
          }
        }
      });
      if (String(oldParentFolder || '') !== String(tp || '')) {
        wbArRenumberSorts(oldParentFolder, folds, rows);
      }
    }

    if (drop.kind === 'folder' && !dropToGap) {
      if (drag.kind === 'folder' && wbArFolderCoversTarget(folds, drag.id, drop.id)) {
        return { ok: false, message: '不能将文件夹移入其子文件夹' };
      }
      const newParent = drop.id;
      const cur = wbArCollectSiblingEntriesForDrop(newParent, folds, rows).filter(
        (x) => !(x.t === drag.kind && String(x.o.id) === String(drag.id)),
      );
      const dragEntry = {
        t: drag.kind,
        o: dragObj,
        sort: Number(drag.kind === 'folder' ? dragFolder.sort : dragRow.sort) || 0,
        nameKey: (drag.kind === 'folder' ? dragFolder.name : dragRow.name) || drag.id,
      };
      cur.push(dragEntry);
      applyOrder(newParent, cur);
      return { ok: true };
    }

    let targetParentId = null;
    if (drop.kind === 'analysis') {
      const dr = rows.find((r) => String(r.id) === drop.id);
      targetParentId = normalizeArResultFolderParentId(dr && dr.resultFolderId);
    } else {
      const df = folds.find((f) => String(f.id) === drop.id);
      targetParentId = normalizeArResultFolderParentId(df && df.parentId);
    }

    const sibsAll = wbArCollectSiblingEntriesForDrop(targetParentId, folds, rows);
    const dragEntry = sibsAll.find((x) => x.t === drag.kind && String(x.o.id) === String(drag.id));
    if (!dragEntry) return { ok: false, message: '找不到被拖拽项' };
    const without = sibsAll.filter((x) => !(x.t === drag.kind && String(x.o.id) === String(drag.id)));

    const dropIdx = without.findIndex((x) => x.t === drop.kind && String(x.o.id) === String(drop.id));
    if (dropIdx < 0) return { ok: false, message: '找不到放置位置' };

    let insertAt = dropIdx + (rel >= 1 ? 1 : 0);
    if (rel <= -1) insertAt = dropIdx;
    const fromIdx = sibsAll.findIndex((x) => x.t === drag.kind && String(x.o.id) === String(drag.id));
    if (fromIdx >= 0 && fromIdx < insertAt) insertAt -= 1;
    insertAt = Math.max(0, Math.min(insertAt, without.length));
    const next = without.slice();
    next.splice(insertAt, 0, dragEntry);
    applyOrder(targetParentId, next);
    return { ok: true };
  }

  function wbMatCollectSiblings(parentId, folders, doneRows) {
    const p = normalizeWorkbenchMaterialParentId(parentId);
    const folderKids = folders
      .filter((f) => normalizeWorkbenchMaterialParentId(f.parentId) === p)
      .map((f) => ({ t: 'folder', o: f, sort: Number(f.sort) || 0, nameKey: f.name || f.id }));
    const rawKids = doneRows
      .filter((r) => String(r.status || '') === 'done' && normalizeWorkbenchMaterialParentId(r.parentId) === p)
      .map((r) => ({ t: 'raw', o: r, sort: Number(r.sort) || 0, nameKey: r.name || r.id }));
    const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
    const both = [...folderKids, ...rawKids].sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return collator.compare(String(a.nameKey), String(b.nameKey));
    });
    return both;
  }

  function wbMatRenumberSorts(parentId, folders, doneRows) {
    const sibs = wbMatCollectSiblings(parentId, folders, doneRows);
    sibs.forEach((item, idx) => {
      if (item.t === 'folder') {
        const i = folders.findIndex((f) => String(f.id) === String(item.o.id));
        if (i >= 0) folders[i] = { ...folders[i], sort: idx };
      } else {
        const i = doneRows.findIndex((r) => String(r.id) === String(item.o.id));
        if (i >= 0) doneRows[i] = { ...doneRows[i], sort: idx };
      }
    });
  }

  /**
   * 将 Ant Tree 的 drop 事件落到 demoProjectMaterialFoldersById / 资料行 parentId+sort（仅演示）。
   * @returns {{ ok: boolean, message?: string }}
   */
  function applyWorkbenchMaterialTreeDrop(projectId, info) {
    const pid = String(projectId || '');
    if (!pid) return { ok: false, message: '未定位工作台' };
    const mats = typeof demoProjectMaterialsById !== 'undefined' ? demoProjectMaterialsById[pid] : null;
    const folds = typeof demoProjectMaterialFoldersById !== 'undefined' ? demoProjectMaterialFoldersById[pid] : null;
    if (!Array.isArray(mats) || !Array.isArray(folds)) return { ok: false, message: '资料数据未就绪' };

    const dragKey = wbMatAntTreeNodeKey(info && info.dragNode) || (info.dragNodesKeys && info.dragNodesKeys[0]);
    const dropKey = wbMatAntTreeNodeKey(info && info.node);
    if (!dragKey || !dropKey || String(dragKey) === String(dropKey)) return { ok: false, message: '无效的拖拽' };

    const drag = wbMatParseTreeKey(dragKey);
    const drop = wbMatParseTreeKey(dropKey);
    if (!drag.id || !drop.id) return { ok: false, message: '无效的节点' };

    const dropToGap = info.dropToGap === true;
    const rel = wbMatRelativeDropPosition(info);

    const dragObj = drag.kind === 'folder' ? folds.find((f) => String(f.id) === drag.id) : mats.find((r) => String(r.id) === drag.id);
    if (!dragObj) return { ok: false, message: '找不到被拖拽项' };

    const oldParentId = drag.kind === 'folder'
      ? normalizeWorkbenchMaterialParentId(dragObj.parentId)
      : normalizeWorkbenchMaterialParentId(dragObj.parentId);

    function applyOrder(targetParentId, ordered) {
      const tp = normalizeWorkbenchMaterialParentId(targetParentId);
      ordered.forEach((item, idx) => {
        if (item.t === 'folder') {
          const i = folds.findIndex((f) => String(f.id) === String(item.o.id));
          if (i >= 0) folds[i] = { ...folds[i], parentId: tp, sort: idx };
        } else {
          const i = mats.findIndex((r) => String(r.id) === String(item.o.id));
          if (i >= 0) mats[i] = { ...mats[i], parentId: tp, sort: idx };
        }
      });
      if (String(normalizeWorkbenchMaterialParentId(oldParentId) || '') !== String(normalizeWorkbenchMaterialParentId(tp) || '')) {
        wbMatRenumberSorts(oldParentId, folds, mats);
      }
    }

    if (drop.kind === 'folder' && !dropToGap) {
      if (drag.kind === 'folder' && wbMatFolderCoversTarget(folds, drag.id, drop.id)) {
        return { ok: false, message: '不能将文件夹移入其子文件夹' };
      }
      const newParent = drop.id;
      const cur = wbMatCollectSiblings(newParent, folds, mats).filter((x) => !(x.t === drag.kind && String(x.o.id) === String(drag.id)));
      const dragEntry = {
        t: drag.kind,
        o: dragObj,
        sort: Number(dragObj.sort) || 0,
        nameKey: dragObj.name || dragObj.id,
      };
      cur.push(dragEntry);
      applyOrder(newParent, cur);
      return { ok: true };
    }

    let targetParentId = null;
    if (drop.kind === 'raw') {
      const dr = mats.find((r) => String(r.id) === drop.id);
      targetParentId = normalizeWorkbenchMaterialParentId(dr && dr.parentId);
    } else {
      const df = folds.find((f) => String(f.id) === drop.id);
      targetParentId = normalizeWorkbenchMaterialParentId(df && df.parentId);
    }

    const sibsAll = wbMatCollectSiblings(targetParentId, folds, mats);
    const dragEntry = sibsAll.find((x) => x.t === drag.kind && String(x.o.id) === String(drag.id));
    if (!dragEntry) return { ok: false, message: '找不到被拖拽项' };
    const without = sibsAll.filter((x) => !(x.t === drag.kind && String(x.o.id) === String(drag.id)));

    const dropIdx = without.findIndex((x) => x.t === drop.kind && String(x.o.id) === String(drop.id));
    if (dropIdx < 0) return { ok: false, message: '找不到放置位置' };

    let insertAt = dropIdx + (rel >= 1 ? 1 : 0);
    if (rel <= -1) insertAt = dropIdx;
    const fromIdx = sibsAll.findIndex((x) => x.t === drag.kind && String(x.o.id) === String(drag.id));
    if (fromIdx >= 0 && fromIdx < insertAt) insertAt -= 1;
    insertAt = Math.max(0, Math.min(insertAt, without.length));
    const next = without.slice();
    next.splice(insertAt, 0, dragEntry);
    applyOrder(targetParentId, next);
    return { ok: true };
  }

  window.__DEMO_FREEAUDIT_UTILS = Object.freeze({
    getFreeAuditQuery,
    presetSuggestions,
    CHAT_DEMO_SCENARIOS,
    WORKBENCH_DEMO_SCENARIO_BY_PROJECT_ID,
    resolveWorkbenchDemoScenario,
    WORKBENCH_PROJECT_NAME_BY_ID,
    SUMMARY_RESPONSE_DEMO,
    DEMO_RUN_SUMMARY_TEXT,
    demoToolDiffLineClass,
    demoLinesUnifiedDiff,
    toAnalysisTemplateShared,
    normalizeWorkbenchMaterialParentId,
    wbMatAntTreeKey,
    wbMatMaterialPathPrefixForRow,
    buildWorkbenchMaterialAntTreeData,
    wbArAntTreeKey,
    wbArParseTreeKey,
    WB_AR_RESULT_ROOT_FOLDER_KEY,
    WB_AR_TASK_OUTPUT_FOLDER_KEY,
    WB_AR_DIALOG_OUTPUT_FOLDER_KEY,
    WB_AR_TASK_ROOT_FOLDER_KEY,
    WB_AR_DIALOG_ROOT_FOLDER_KEY,
    buildWorkbenchAnalysisResultAntTreeData,
    WB_TASK_CREATE_RESULT_OUTPUT_ROOT,
    buildWorkbenchAnalysisResultFolderPickerTree,
    resolveWbTaskCreateResultOutputFolder,
    applyWorkbenchAnalysisResultTreeDrop,
    applyWorkbenchMaterialTreeDrop,
    wbMatAntTreeNodeKey,
    wbMatRelativeDropPosition,
  });
})();
