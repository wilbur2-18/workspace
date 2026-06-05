(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};
  const message = antd.message;

  function uniq(arr) {
    return Array.from(new Set((arr || []).map(String).filter(Boolean)));
  }

  function statusActions(status, doneActions) {
    const st = String(status || 'done');
    if (st === 'queued') return ['abort', 'delete'];
    if (st === 'parsing') return ['abort', 'rerun', 'delete'];
    if (st === 'failed') return ['rerun', 'delete'];
    return doneActions || ['delete'];
  }

  function materialStatusActions(status, doneActions) {
    const set = materialActionSet(status);
    if (set && Array.isArray(set.bulk)) return set.bulk.slice();
    return doneActions || ['ref', 'download', 'delete'];
  }

  function uploadSessionActions(status) {
    const st = String(status || 'pending');
    if (st === 'pending') return ['upload', 'remove'];
    if (st === 'uploading') return ['cancel-upload'];
    if (st === 'failed') return ['retry-upload', 'remove'];
    return ['remove'];
  }

  function materialActionSet(status) {
    const st = String(status || 'done');
    if (st === 'queued') {
      return {
        primary: ['abort'],
        more: ['ref', 'download', 'rename', 'delete'],
        context: ['abort', 'ref', 'download', 'rename', 'delete'],
        bulk: ['ref', 'download', 'abort', 'delete'],
      };
    }
    if (st === 'parsing') {
      return {
        primary: ['ref'],
        more: ['abort', 'download', 'rename', 'delete'],
        context: ['ref', 'abort', 'download', 'rename', 'delete'],
        bulk: ['ref', 'download', 'abort', 'delete'],
      };
    }
    if (st === 'failed') {
      return {
        primary: ['rerun'],
        more: ['ref', 'download', 'rename', 'delete'],
        context: ['rerun', 'ref', 'download', 'rename', 'delete'],
        bulk: ['ref', 'download', 'rerun', 'delete'],
      };
    }
    return {
      primary: ['ref'],
      more: ['rerun', 'download', 'rename', 'delete'],
      context: ['ref', 'rerun', 'download', 'rename', 'delete'],
      bulk: ['ref', 'download', 'rerun', 'delete'],
    };
  }

  function batchChildStatusActions(status) {
    const st = String(status || 'done');
    if (st === 'queued' || st === 'parsing') return ['abort'];
    if (st === 'failed' || st === 'done') return ['rerun', 'delete'];
    return ['delete'];
  }

  function taskStatusActions(status) {
    const st = String(status || 'done');
    if (st === 'queued' || st === 'parsing') return ['abort', 'rerun', 'delete'];
    if (st === 'failed' || st === 'done') return ['rerun', 'delete'];
    return ['delete'];
  }

  function unionActions(items) {
    return uniq(items.flatMap((item) => item.availableActions || []));
  }

  function actionPriorityIndex(action) {
    const order = ['upload', 'retry-upload', 'cancel-upload', 'abort', 'rerun', 'ref', 'download', 'remove', 'delete'];
    const idx = order.indexOf(String(action || ''));
    return idx >= 0 ? idx : order.length;
  }

  function actionSupportsPrimary(item, action) {
    if (!item || !(item.availableActions || []).includes(action)) return false;
    const st = String(item.status || '');
    if (action === 'delete') return false;
    if (action === 'ref' && item.kind === 'resource-material' && (st === 'queued' || st === 'failed')) return false;
    if (action === 'abort' && item.kind === 'resource-material' && st === 'parsing') return false;
    return true;
  }

  function materialTreeKeyFromNode(node) {
    const key = node && (node.eventKey || node.key || (node.dataRef && node.dataRef.key));
    return String(key || '');
  }

  function parseTreeKey(key) {
    const s = String(key || '');
    const idx = s.indexOf(':');
    if (idx < 0) return { kind: '', id: '' };
    return { kind: s.slice(0, idx), id: s.slice(idx + 1) };
  }

  NS.actionGroups = NS.actionGroups || {};
  NS.actionGroups.bulkActions = {
        workbenchBulkAreaActive(area) {
          return String((this.workbenchBulkSelection && this.workbenchBulkSelection.area) || '') === String(area || '');
        },
        workbenchBulkScopeActive(area, scope) {
          if (!this.workbenchBulkAreaActive(area)) return false;
          const current = String((this.workbenchBulkSelection && this.workbenchBulkSelection.scope) || area || '');
          return current === String(scope || area || '');
        },
        workbenchBulkKeys(area) {
          if (!this.workbenchBulkAreaActive(area)) return [];
          return uniq((this.workbenchBulkSelection && this.workbenchBulkSelection.keys) || []);
        },
        workbenchBulkSelectedCount(area) {
          return this.workbenchBulkKeys(area).length;
        },
        workbenchBulkIsSelected(desc) {
          return !!(desc && this.workbenchBulkScopeActive(desc.area, desc.scope) && this.workbenchBulkKeys(desc.area).includes(String(desc.key)));
        },
        workbenchBulkRowClass(desc) {
          if (!desc || !desc.key) return {};
          return {
            'is-bulk-mode': this.workbenchBulkScopeActive(desc.area, desc.scope),
            'is-bulk-selected': this.workbenchBulkIsSelected(desc),
          };
        },
        resetWorkbenchBulkSelection(area) {
          if (area && !this.workbenchBulkAreaActive(area)) return;
          this.workbenchBulkSelection = { area: null, scope: null, keys: [] };
        },
        workbenchBulkSelectableKeys(area, scope) {
          const out = [];
          const pushKey = (key) => {
            const s = String(key || '');
            if (s) out.push(s);
          };
          const walkTree = (nodes) => {
            (nodes || []).forEach((node) => {
              pushKey(this.workbenchBulkTreeNodeKey(area, node));
              walkTree(node && node.children);
            });
          };
          if (area === 'resource' && scope === 'material') {
            const view = String(this.workbenchMaterialStatusView || 'all');
            if (view === 'queued' || view === 'parsing' || view === 'failed') {
              (this.workbenchRawMaterialsForTree || []).forEach((m) => {
                if (m && this.workbenchMaterialStatusOf(m) === view) pushKey(`resource:material:${m.id}`);
              });
            } else {
              walkTree(this.workbenchMaterialFileTreeData || []);
            }
          } else if (area === 'upload' && scope === 'session') {
            (this.workbenchUploadSessionItems || []).forEach((item) => {
              if (item && item.uid) pushKey(`upload:item:${item.uid}`);
            });
          } else if (area === 'resource' && scope === 'database') {
            (this.filteredDatabaseResources || []).forEach((tbl) => {
              const desc = this.workbenchBulkDbTableDescriptor(tbl);
              if (desc) pushKey(desc.key);
            });
          } else if (area === 'result') {
            walkTree(this.workbenchAnalysisResultAntTreeData || []);
          } else if (area === 'task' && scope === 'batch-child') {
            (this.filteredBatchChildren || []).forEach((child) => {
              const desc = this.workbenchBulkBatchChildDescriptor(child);
              if (desc) pushKey(desc.key);
            });
          } else if (area === 'task') {
            (this.workbenchTaskTreeSections || []).forEach((section) => {
              (section.children || []).forEach((node) => {
                const desc = this.workbenchBulkTaskDescriptor(node);
                if (desc) pushKey(desc.key);
              });
            });
          }
          return uniq(out);
        },
        workbenchBulkAllSelected(area, scope) {
          const keys = this.workbenchBulkSelectableKeys(area, scope);
          const selected = new Set(this.workbenchBulkKeys(area));
          return !!keys.length && keys.every((key) => selected.has(key));
        },
        workbenchBulkSomeSelected(area, scope) {
          const keys = this.workbenchBulkSelectableKeys(area, scope);
          const selected = new Set(this.workbenchBulkKeys(area));
          const count = keys.filter((key) => selected.has(key)).length;
          return count > 0 && count < keys.length;
        },
        toggleWorkbenchBulkSelectAll(area, scope, evOrChecked) {
          const keys = this.workbenchBulkSelectableKeys(area, scope);
          if (!keys.length) return;
          let checked = true;
          if (typeof evOrChecked === 'boolean') checked = evOrChecked;
          else if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
          if (checked) {
            this.workbenchBulkSelection = { area: String(area), scope: String(scope || area), keys };
            return;
          }
          const removing = new Set(keys);
          const next = this.workbenchBulkKeys(area).filter((key) => !removing.has(key));
          this.workbenchBulkSelection = { area: String(area), scope: String(scope || area), keys: next };
        },
        startWorkbenchBulkMode(area, scope) {
          this.workbenchBulkSelection = { area: String(area), scope: String(scope || area), keys: [] };
        },
        toggleWorkbenchBulkSelection(desc, evOrChecked, force) {
          if (!desc || !desc.area || !desc.key) return;
          const area = String(desc.area);
          const scope = String(desc.scope || area);
          const key = String(desc.key);
          let keys = this.workbenchBulkScopeActive(area, scope) ? this.workbenchBulkKeys(area) : [];
          let checked = force;
          if (checked === undefined) {
            if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
            else checked = !keys.includes(key);
          }
          const cascadeKeys = this.workbenchBulkCascadeKeys(desc);
          if (checked) {
            keys = uniq([...keys, ...cascadeKeys]);
          } else {
            const removing = new Set([...cascadeKeys, ...this.workbenchBulkAncestorFolderKeys(desc)]);
            keys = keys.filter((item) => !removing.has(item));
          }
          this.workbenchBulkSelection = { area, scope, keys };
        },
        startWorkbenchBulkSelection(desc) {
          this.toggleWorkbenchBulkSelection(desc, null, true);
        },
        handleWorkbenchBulkRowClick(ev, desc) {
          if (!desc || !desc.key) return false;
          if (this.workbenchBulkScopeActive(desc.area, desc.scope)) {
            this.toggleWorkbenchBulkSelection(desc);
            return true;
          }
          return false;
        },
        onWorkbenchBulkMaterialFolderRowClick(ev, d) {
          const desc = this.workbenchBulkMaterialFolderDescriptor(d);
          if (this.workbenchBulkScopeActive('resource', 'material')) {
            this.onWorkbenchMaterialFolderRowClick(d);
            return;
          }
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.onWorkbenchMaterialFolderRowClick(d);
        },
        onWorkbenchBulkMaterialFileRowClick(ev, d) {
          const desc = this.workbenchBulkMaterialFileDescriptor(d);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.onWorkbenchMaterialFileTreeRawClick(d);
        },
        onWorkbenchBulkStatusNodeRowClick(ev, node, sectionKey) {
          const desc = this.workbenchBulkStatusNodeDescriptor(node, sectionKey);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.selectTreeNode(node, sectionKey);
        },
        onWorkbenchBulkDbTableRowClick(ev, tbl) {
          const desc = this.workbenchBulkDbTableDescriptor(tbl);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.previewDbTableResource(tbl);
        },
        onWorkbenchBulkResultFolderRowClick(ev, d) {
          const desc = this.workbenchBulkResultFolderDescriptor(d);
          if (this.workbenchBulkScopeActive('result', 'result')) {
            this.onWorkbenchAnalysisResultFolderRowClick(d);
            return;
          }
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.onWorkbenchAnalysisResultFolderRowClick(d);
        },
        onWorkbenchBulkResultFileRowClick(ev, d) {
          const desc = this.workbenchBulkResultFileDescriptor(d);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.onWorkbenchAnalysisResultTreeLeafClick(d);
        },
        onWorkbenchBulkTaskNodeRowClick(ev, node, sectionKey) {
          const desc = this.workbenchBulkTaskDescriptor(node);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.selectTreeNode(node, sectionKey);
        },
        onWorkbenchBulkBatchChildRowOpen(ev, child) {
          const desc = this.workbenchBulkBatchChildDescriptor(child);
          if (this.handleWorkbenchBulkRowClick(ev, desc)) return;
          this.openMaterialDetail(child);
        },
        workbenchBulkMaterialFolderDescriptor(d) {
          const id = String((d && d.folderId) || '').trim();
          if (!id) return null;
          return { area: 'resource', scope: 'material', key: `resource:folder:${id}`, kind: 'resource-folder', raw: d, availableActions: ['ref', 'delete'] };
        },
        workbenchBulkMaterialFileDescriptor(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return null;
          const st = this.workbenchMaterialStatusOf(m);
          return { area: 'resource', scope: 'material', key: `resource:material:${m.id}`, kind: 'resource-material', status: st, raw: m, node: d, availableActions: materialStatusActions(st, ['ref', 'download', 'delete']) };
        },
        workbenchBulkStatusNodeDescriptor(node, sectionKey) {
          if (!node || sectionKey !== 'material') return null;
          const m = node.raw;
          if (!m) return null;
          const st = this.workbenchMaterialStatusOf(m);
          return { area: 'resource', scope: 'material', key: `resource:material:${m.id}`, kind: 'resource-material', status: st, raw: m, node, availableActions: materialStatusActions(st, ['ref', 'download', 'delete']) };
        },
        workbenchBulkDbTableDescriptor(tbl) {
          const id = String((tbl && tbl.id) || '').trim();
          if (!id) return null;
          return { area: 'resource', scope: 'database', key: `resource:db:${id}`, kind: 'database-table', raw: tbl, availableActions: ['delete'] };
        },
        workbenchBulkResultFolderDescriptor(d) {
          const id = String((d && d.userFolderId) || '').trim();
          if (!id) return null;
          return { area: 'result', scope: 'result', key: `result:folder:${id}`, kind: 'result-folder', raw: d, availableActions: ['download', 'delete'] };
        },
        workbenchBulkResultFileDescriptor(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return null;
          return { area: 'result', scope: 'result', key: `result:material:${m.id}`, kind: 'result-material', raw: m, node: d, availableActions: ['ref', 'download', 'delete'] };
        },
        workbenchBulkUploadSessionDescriptor(item) {
          if (!item || !item.uid) return null;
          const st = String(item.status || 'pending');
          return { area: 'upload', scope: 'session', key: `upload:item:${item.uid}`, kind: 'upload-session', status: st, raw: item, availableActions: uploadSessionActions(st) };
        },
        workbenchBulkTaskDescriptor(node) {
          const m = node && node.raw;
          if (!m || this.isWorkbenchBatchParentTask(m)) return null;
          const st = this.workbenchAnalysisStatusOf(m);
          return { area: 'task', scope: 'task', key: `task:item:${m.id}`, kind: 'task', status: st, raw: m, node, availableActions: taskStatusActions(st) };
        },
        workbenchBulkBatchChildDescriptor(child) {
          if (!child) return null;
          const st = this.workbenchAnalysisStatusOf(child);
          return { area: 'task', scope: 'batch-child', key: `task:item:${child.id}`, kind: 'batch-child', status: st, raw: child, availableActions: batchChildStatusActions(st) };
        },
        workbenchBulkTreeNodeKey(area, node) {
          if (!node) return '';
          if (area === 'resource') {
            if (node.isFolder && node.folderId) return `resource:folder:${node.folderId}`;
            if (!node.isFolder && node.materialId) return `resource:material:${node.materialId}`;
          }
          if (area === 'result') {
            if (node.isFolder && node.userFolderId) return `result:folder:${node.userFolderId}`;
            if (!node.isFolder && node.materialId) return `result:material:${node.materialId}`;
          }
          return '';
        },
        findWorkbenchBulkTreeNode(area, key) {
          const nodes = area === 'resource' ? this.workbenchMaterialFileTreeData : this.workbenchAnalysisResultAntTreeData;
          let hit = null;
          const walk = (list) => {
            (list || []).forEach((node) => {
              if (hit || !node) return;
              if (this.workbenchBulkTreeNodeKey(area, node) === key) {
                hit = node;
                return;
              }
              walk(node.children || []);
            });
          };
          walk(nodes || []);
          return hit;
        },
        workbenchBulkTreeDescendantKeys(area, node) {
          const out = [];
          const walk = (list) => {
            (list || []).forEach((child) => {
              const key = this.workbenchBulkTreeNodeKey(area, child);
              if (key) out.push(key);
              walk(child && child.children);
            });
          };
          walk(node && node.children);
          return out;
        },
        workbenchBulkCascadeKeys(desc) {
          if (!desc || !desc.key) return [];
          const keys = [String(desc.key)];
          if (desc.kind !== 'resource-folder' && desc.kind !== 'result-folder') return keys;
          const node = this.findWorkbenchBulkTreeNode(desc.area, String(desc.key));
          return uniq([...keys, ...this.workbenchBulkTreeDescendantKeys(desc.area, node)]);
        },
        workbenchBulkAncestorFolderKeys(desc) {
          if (!desc || !desc.area || !desc.raw) return [];
          const out = [];
          if (desc.area === 'resource') {
            const folders = this.workbenchMaterialFoldersList || [];
            const byId = new Map(folders.map((f) => [String(f.id), f]));
            let pid = '';
            if (desc.kind === 'resource-material') {
              const ps = desc.raw.projectSource || {};
              pid = ps.parentId != null && ps.parentId !== '' ? String(ps.parentId) : '';
            } else if (desc.kind === 'resource-folder') {
              const f = byId.get(String(desc.raw.folderId || ''));
              pid = f && f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
            }
            const guard = new Set();
            while (pid && byId.has(pid) && !guard.has(pid)) {
              guard.add(pid);
              out.push(`resource:folder:${pid}`);
              const f = byId.get(pid);
              pid = f && f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
            }
          }
          if (desc.area === 'result') {
            const folders = this.workbenchAnalysisResultFoldersList || [];
            const byId = new Map(folders.map((f) => [String(f.id), f]));
            let pid = '';
            if (desc.kind === 'result-material') {
              const ps = desc.raw.projectSource || {};
              pid = ps.resultFolderId != null && ps.resultFolderId !== '' ? String(ps.resultFolderId) : '';
            } else if (desc.kind === 'result-folder') {
              const f = byId.get(String(desc.raw.userFolderId || ''));
              pid = f && f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
            }
            const guard = new Set();
            while (pid && byId.has(pid) && !guard.has(pid)) {
              guard.add(pid);
              out.push(`result:folder:${pid}`);
              const f = byId.get(pid);
              pid = f && f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
            }
          }
          return out;
        },
        findWorkbenchBulkResultFolderNode(id) {
          const target = String(id || '');
          let hit = null;
          const walk = (nodes) => {
            (nodes || []).forEach((node) => {
              if (hit || !node) return;
              if (node.isFolder && String(node.userFolderId || '') === target) {
                hit = node;
                return;
              }
              walk(node.children || []);
            });
          };
          walk(this.workbenchAnalysisResultAntTreeData || []);
          return hit;
        },
        resolveWorkbenchBulkDescriptor(key) {
          const parts = String(key || '').split(':');
          if (parts.length < 3) return null;
          const area = parts[0];
          const kind = parts[1];
          const id = parts.slice(2).join(':');
          if (area === 'resource' && kind === 'material') {
            const m = this.wbMaterialVmById(id);
            const projectRow = (this.workbenchProjectRowsForFileTree || []).find((row) => String((row && row.id) || '') === id) || null;
            const raw = m || (projectRow ? {
              id,
              type: 'raw',
              title: projectRow.name || projectRow.title || '未命名文件',
              projectSource: projectRow,
            } : null);
            if (!raw) return null;
            const st = this.workbenchMaterialStatusOf(raw);
            return { area, key, kind: 'resource-material', status: st, raw, availableActions: materialStatusActions(st, ['ref', 'download', 'delete']) };
          }
          if (area === 'resource' && kind === 'folder') {
            const f = (this.workbenchMaterialFoldersList || []).find((row) => String(row.id) === id);
            const raw = { folderId: id, title: (f && f.name) || '文件夹' };
            return { area, key, kind: 'resource-folder', raw, availableActions: ['ref', 'delete'] };
          }
          if (area === 'resource' && kind === 'db') {
            const row = (this.dbResourceList || []).find((tbl) => String(tbl.id) === id);
            if (!row) return null;
            return { area, key, kind: 'database-table', raw: row, availableActions: ['delete'] };
          }
          if (area === 'upload' && kind === 'item') {
            const row = (this.workbenchUploadSessionItems || []).find((item) => String(item && item.uid) === id);
            if (!row) return null;
            const st = String(row.status || 'pending');
            return { area, key, kind: 'upload-session', status: st, raw: row, availableActions: uploadSessionActions(st) };
          }
          if (area === 'result' && kind === 'material') {
            const m = this.wbMaterialVmById(id);
            if (!m) return null;
            return { area, key, kind: 'result-material', raw: m, availableActions: ['ref', 'download', 'delete'] };
          }
          if (area === 'result' && kind === 'folder') {
            const raw = this.findWorkbenchBulkResultFolderNode(id) || { userFolderId: id, title: '结果文件夹' };
            return { area, key, kind: 'result-folder', raw, availableActions: ['download', 'delete'] };
          }
          if (area === 'task' && kind === 'item') {
            const m = this.findWorkbenchTaskById(id) || this.findWorkbenchTaskChildById(id);
            if (!m || this.isWorkbenchBatchParentTask(m)) return null;
            const st = this.workbenchAnalysisStatusOf(m);
            const isChild = this.isWorkbenchBatchChildTask(m);
            return { area, key, kind: isChild ? 'batch-child' : 'task', status: st, raw: m, availableActions: isChild ? batchChildStatusActions(st) : taskStatusActions(st) };
          }
          return null;
        },
        workbenchBulkSelectedDescriptors(area) {
          return this.workbenchBulkKeys(area).map((key) => this.resolveWorkbenchBulkDescriptor(key)).filter(Boolean);
        },
        workbenchBulkActionCount(action, area) {
          return this.workbenchBulkSelectedDescriptors(area)
            .filter((item) => (item.availableActions || []).includes(action))
            .length;
        },
        workbenchBulkPrimaryActionCount(action, area) {
          return this.workbenchBulkSelectedDescriptors(area)
            .filter((item) => actionSupportsPrimary(item, action))
            .length;
        },
        workbenchBulkActionCountText(action, area) {
          const count = this.workbenchBulkActionCount(action, area);
          if (count > 99) return '99+';
          return String(count || '');
        },
        workbenchMaterialActionSet(raw) {
          return materialActionSet(this.workbenchMaterialStatusOf(raw));
        },
        workbenchMaterialPrimaryActions(raw) {
          const set = this.workbenchMaterialActionSet(raw);
          return (set && set.primary) ? set.primary.slice() : [];
        },
        workbenchMaterialMoreActions(raw) {
          const set = this.workbenchMaterialActionSet(raw);
          return (set && set.more) ? set.more.slice() : [];
        },
        workbenchMaterialContextActions(raw) {
          const set = this.workbenchMaterialActionSet(raw);
          return (set && set.context) ? set.context.slice() : [];
        },
        workbenchMaterialActionLabel(action) {
          return {
            ref: '添加到对话',
            download: '下载',
            rename: '重命名',
            delete: '删除',
            abort: '中止',
            rerun: '重跑',
            'cancel-upload': '取消上传',
            upload: '上传',
            'retry-upload': '重试上传',
            remove: '移除',
          }[String(action || '')] || '';
        },
        workbenchMaterialActionIcon(action) {
          return {
            ref: 'chat-ref',
            download: 'download',
            rename: 'edit',
            delete: 'trash',
            abort: 'stop',
            rerun: 'redo',
            'cancel-upload': 'stop',
          }[String(action || '')] || 'more';
        },
        workbenchMaterialActionDanger(action) {
          return String(action || '') === 'delete';
        },
        workbenchBulkActionNoopMessage(action) {
          return `当前所选项目均不支持“${this.workbenchBulkActionLabel(action, 'resource')}”`;
        },
        workbenchBulkActionResultMessage(action, handled, skipped) {
          const suffix = skipped > 0 ? `，跳过 ${skipped} 项` : '';
          if (action === 'upload') return `已开始上传 ${handled} 项${suffix}`;
          if (action === 'retry-upload') return `已重试上传 ${handled} 项${suffix}`;
          if (action === 'ref') return `已添加 ${handled} 项到对话${suffix}`;
          if (action === 'download') return `已开始下载 ${handled} 项${suffix}`;
          if (action === 'cancel-upload') return `已取消 ${handled} 个文件上传${suffix}`;
          if (action === 'abort') return `已中止 ${handled} 项${suffix}`;
          if (action === 'rerun') return `已重跑 ${handled} 项${suffix}`;
          if (action === 'remove') return `已移除 ${handled} 项${suffix}`;
          if (action === 'delete') return `已删除 ${handled} 项${suffix}`;
          return `已处理 ${handled} 项${suffix}`;
        },
        workbenchBulkActionKeys(area, group) {
          const items = this.workbenchBulkSelectedDescriptors(area);
          const actions = unionActions(items);
          const orderedAll = actions
            .map((action) => ({
              action,
              count: this.workbenchBulkActionCount(action, area),
            }))
            .sort((a, b) => b.count - a.count || actionPriorityIndex(a.action) - actionPriorityIndex(b.action))
            .map((entry) => entry.action);
          if (orderedAll.length <= 2) return group === 'more' ? [] : orderedAll;
          const primary = actions
            .map((action) => ({
              action,
              count: this.workbenchBulkPrimaryActionCount(action, area),
            }))
            .filter((entry) => entry.count > 0)
            .sort((a, b) => b.count - a.count || actionPriorityIndex(a.action) - actionPriorityIndex(b.action))
            .slice(0, 2)
            .map((entry) => entry.action);
          const more = actions
            .filter((action) => !primary.includes(action))
            .map((action) => ({
              action,
              count: this.workbenchBulkActionCount(action, area),
            }))
            .sort((a, b) => b.count - a.count || actionPriorityIndex(a.action) - actionPriorityIndex(b.action))
            .map((entry) => entry.action);
          return group === 'more' ? more : primary;
        },
        workbenchBulkActionLabel(action, area) {
          const items = this.workbenchBulkSelectedDescriptors(area)
            .filter((item) => (item.availableActions || []).includes(action));
          if (action === 'upload') return '上传';
          if (action === 'retry-upload') return '重试上传';
          if (action === 'ref') return '添加到对话';
          if (action === 'download') return items.some((item) => item.kind.indexOf('folder') >= 0) ? '打包下载' : '下载';
          if (action === 'cancel-upload') return '取消上传';
          if (action === 'abort') return '中止';
          if (action === 'rerun') return '重跑';
          if (action === 'remove') return '移除';
          if (action === 'delete') return '删除';
          return action;
        },
        workbenchBulkActionTooltip(action, area) {
          const label = this.workbenchBulkActionLabel(action, area);
          const count = this.workbenchBulkActionCountText(action, area);
          return count ? `${label}（${count}）` : label;
        },
        workbenchBulkActionMenuLabel(action, area) {
          return this.workbenchBulkActionTooltip(action, area);
        },
        workbenchBulkActionIcon(action) {
          return {
            upload: 'upload-inbox',
            'retry-upload': 'redo',
            ref: 'chat-ref',
            download: 'download',
            'cancel-upload': 'close',
            abort: 'pause',
            rerun: 'redo',
            remove: 'close',
            delete: 'trash',
          }[action] || 'more';
        },
        workbenchBulkAreaLabel(area) {
          return ({ resource: '资源', result: '结果', task: '任务', upload: '上传' })[area] || '项目';
        },
        onWorkbenchBulkAction(area, action) {
          const selected = this.workbenchBulkSelectedDescriptors(area);
          const items = selected.filter((item) => (item.availableActions || []).includes(action));
          const skipped = Math.max(0, selected.length - items.length);
          if (!items.length) {
            message.info(this.workbenchBulkActionNoopMessage(action));
            return;
          }
          if (action === 'upload') return this.applyWorkbenchBulkUpload(area, items, skipped);
          if (action === 'retry-upload') return this.applyWorkbenchBulkRetryUpload(area, items, skipped);
          if (action === 'ref') return this.applyWorkbenchBulkRef(area, items, skipped);
          if (action === 'download') return this.applyWorkbenchBulkDownload(area, items, skipped);
          if (action === 'cancel-upload') return this.confirmWorkbenchBulkCancelUpload(area, items, skipped);
          if (action === 'abort') return this.confirmWorkbenchBulkAbort(area, items, skipped);
          if (action === 'rerun') return this.confirmWorkbenchBulkRerun(area, items, skipped);
          if (action === 'remove') return this.confirmWorkbenchBulkRemove(area, items, skipped);
          if (action === 'delete') return this.confirmWorkbenchBulkDelete(area, items, skipped);
        },
        applyWorkbenchBulkUpload(area, items, skipped) {
          const handled = this.applyWorkbenchUploadSessionItemsUpload(items.map((item) => item.raw));
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('upload', handled, skipped), 1500);
        },
        applyWorkbenchBulkRetryUpload(area, items, skipped) {
          const handled = this.applyWorkbenchUploadSessionItemsRetry(items.map((item) => item.raw));
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('retry-upload', handled, skipped), 1500);
        },
        applyWorkbenchBulkRef(area, items, skipped) {
          items.forEach((item) => {
            if (item.kind === 'resource-folder') this.toggleWorkbenchMaterialFolderInChat(item.raw);
            if (item.kind === 'resource-material') this.handleTreeContextMenu('ref', { id: item.raw.id, raw: item.raw }, 'material');
            if (item.kind === 'result-material') this.handleTreeContextMenu('ref', { id: item.raw.id, raw: item.raw }, 'analysis', 'result');
          });
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('ref', items.length, skipped), 1500);
        },
        applyWorkbenchBulkDownload(area, items, skipped) {
          if (area === 'result') {
            this.openWorkbenchPackageDownloadModalFromBulk(items);
            return;
          }
          items.forEach((item) => {
            if (item.kind === 'resource-material') this.downloadWorkbenchMaterialPreview(item.raw, false);
            if (item.kind === 'result-folder') this.downloadWorkbenchAnalysisResultFolderZip(item.raw, 'keep');
          });
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('download', items.length, skipped), 1500);
        },
        confirmWorkbenchBulkCancelUpload(area, items, skipped) {
          const n = items.length;
          window.dsConfirm.action({
            title: `取消支持上传中的 ${n} 个文件？`,
            content: skipped > 0 ? `取消后不会进入解析队列。另有 ${skipped} 项将自动跳过。` : '取消后不会进入解析队列。',
            okText: '取消上传',
            onOk: () => this.applyWorkbenchBulkCancelUpload(area, items, skipped),
          });
        },
        applyWorkbenchBulkCancelUpload(area, items, skipped) {
          const rows = items.map((item) => item.raw).filter(Boolean);
          const handled = this.applyWorkbenchUploadSessionItemsCancel(rows);
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('cancel-upload', handled, skipped), 1500);
        },
        confirmWorkbenchBulkAbort(area, items, skipped) {
          const n = items.length;
          window.dsConfirm.action({
            title: `中止支持该操作的 ${n} 项？`,
            content: skipped > 0 ? `中止后将标记为失败。另有 ${skipped} 项将自动跳过。` : '中止后将标记为失败。',
            okText: '中止',
            onOk: () => this.applyWorkbenchBulkAbort(area, items, skipped),
          });
        },
        applyWorkbenchBulkAbort(area, items, skipped) {
          items.forEach((item) => {
            if (item.kind === 'resource-material') this._applyAbortWorkbenchMaterial(item.raw, false);
            if (item.kind === 'task' || item.kind === 'batch-child') {
              const t = this.resolveCreatedWorkbenchTaskRef(item.raw) || this.resolveDemoWorkbenchTaskRef(item.raw) || item.raw;
              this.clearBatchChildRerunTimers(t);
              this.setWorkbenchTaskStatus(t, 'failed');
              const parent = this.findWorkbenchBatchParentOfChild(t);
              if (parent) this.syncBatchParentStatus(parent);
            }
          });
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('abort', items.length, skipped), 1500);
        },
        confirmWorkbenchBulkRerun(area, items, skipped) {
          const n = items.length;
          window.dsConfirm.action({
            title: `重跑支持该操作的 ${n} 项？`,
            content: skipped > 0 ? `将重新进入执行队列。另有 ${skipped} 项将自动跳过。` : '将重新进入执行队列。',
            okText: '重跑',
            onOk: () => this.applyWorkbenchBulkRerun(area, items, skipped),
          });
        },
        applyWorkbenchBulkRerun(area, items, skipped) {
          const materialIds = [];
          items.forEach((item) => {
            if (item.kind === 'resource-material') {
              const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
              const row = arr.find((r) => r && String(r.id) === String(item.raw.id));
              if (row) {
                if (this._clearWorkbenchParseTimers) this._clearWorkbenchParseTimers(row.id);
                row.status = 'parsing';
                row.progress = 12;
                materialIds.push(String(row.id));
              }
              if (item.raw.projectSource) {
                item.raw.projectSource.status = 'parsing';
                item.raw.projectSource.progress = 12;
              }
            }
            if (item.kind === 'task' || item.kind === 'batch-child') {
              const t = this.resolveCreatedWorkbenchTaskRef(item.raw) || this.resolveDemoWorkbenchTaskRef(item.raw) || item.raw;
              this.setWorkbenchTaskStatus(t, 'parsing');
              const parent = this.findWorkbenchBatchParentOfChild(t);
              if (parent) this.syncBatchParentStatus(parent);
            }
          });
          if (materialIds.length && this._startWorkbenchParseSimulation) this._startWorkbenchParseSimulation(materialIds, 'parsing');
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('rerun', items.length, skipped), 1500);
        },
        confirmWorkbenchBulkDelete(area, items, skipped) {
          const n = items.length;
          window.dsConfirm.delete({
            batchTitle: skipped > 0 ? `删除支持该操作的 ${n} 项？` : `删除已选 ${n} 项？`,
            kind: area === 'task' ? 'task' : 'default',
            onOk: () => this.applyWorkbenchBulkDelete(area, items, skipped),
          });
        },
        confirmWorkbenchBulkRemove(area, items, skipped) {
          const n = items.length;
          window.dsConfirm.action({
            title: skipped > 0 ? `移除支持该操作的 ${n} 项？` : `移除已选 ${n} 项？`,
            content: skipped > 0 ? `仅移除支持该操作的文件，另有 ${skipped} 项将自动跳过。` : '移除后不会进入上传队列。',
            okText: '移除',
            onOk: () => this.applyWorkbenchBulkRemove(area, items, skipped),
          });
        },
        applyWorkbenchBulkRemove(area, items, skipped) {
          const handled = this.applyWorkbenchUploadSessionItemsRemove(items.map((item) => item.raw));
          this.resetWorkbenchBulkSelection(area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('remove', handled, skipped), 1500);
        },
        applyWorkbenchBulkDelete(area, items, skipped) {
          const pid = this.workbenchProjectId;
          items.forEach((item) => {
            if (item.kind === 'resource-material' || item.kind === 'result-material') this._applyDeleteMaterial(item.raw, false);
            if (item.kind === 'resource-folder') {
              this.wbDeleteFolderTarget = { folderId: String(item.raw.folderId), name: item.raw.title || '文件夹' };
              this.confirmDeleteWorkbenchMaterialFolder();
            }
            if (item.kind === 'database-table') {
              this.dbResourceList = (this.dbResourceList || []).filter((tbl) => String(tbl.id) !== String(item.raw.id));
            }
            if (item.kind === 'result-folder') this.applyWorkbenchBulkDeleteResultFolder(item.raw.userFolderId);
            if (item.kind === 'task' || item.kind === 'batch-child') this.applyWorkbenchBulkDeleteTask(item.raw);
          });
          this.resetWorkbenchBulkSelection(area);
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          if (pid) this.refreshWorkbenchDemoResources(area === 'resource' ? 'material' : area);
          this._setWorkbenchBatchToast(this.workbenchBulkActionResultMessage('delete', items.length, skipped), 1500);
        },
        applyWorkbenchBulkDeleteResultFolder(folderId) {
          const pid = this.workbenchProjectId;
          if (!pid || !folderId || typeof demoProjectAnalysisResultFoldersById === 'undefined') return;
          const folds = demoProjectAnalysisResultFoldersById[pid] || [];
          const delIds = this.collectWorkbenchAnalysisResultFolderSubtreeIds(folderId, folds);
          (this.materials || []).forEach((m) => {
            if (!m || m.type !== 'analysis') return;
            const ps = m.projectSource || {};
            const rid = String(ps.resultFolderId || '');
            if (rid && delIds.has(rid)) m.projectSource = { ...ps, resultFolderId: null };
          });
          if (typeof demoProjectAnalysisResultsById !== 'undefined') {
            (demoProjectAnalysisResultsById[pid] || []).forEach((r) => {
              if (r && delIds.has(String(r.resultFolderId || ''))) r.resultFolderId = null;
            });
          }
          demoProjectAnalysisResultFoldersById[pid] = folds.filter((f) => !delIds.has(String(f.id)));
        },
        applyWorkbenchBulkDeleteTask(task) {
          if (!task || !task.id) return;
          const id = String(task.id);
          const removeFrom = (rows) => {
            if (!Array.isArray(rows)) return;
            for (let i = rows.length - 1; i >= 0; i -= 1) {
              const row = rows[i];
              if (!row) continue;
              if (String(row.id) === id) {
                rows.splice(i, 1);
                continue;
              }
              if (Array.isArray(row.children)) row.children = row.children.filter((child) => child && String(child.id) !== id);
            }
          };
          removeFrom(this.workbenchCreatedTasks);
          if (typeof demoWorkbenchTaskRows !== 'undefined') removeFrom(demoWorkbenchTaskRows);
          if (this.selectedMaterialId === id) this.selectedMaterialId = null;
        },
        applyWorkbenchBulkTreeDrop(area, info) {
          if (!this.workbenchBulkAreaActive(area) || !(this.workbenchBulkSelectedCount(area) > 0)) return false;
          if (info && info.dropToGap === true) {
            message.info('批量移动请拖入目标文件夹');
            return true;
          }
          const drop = parseTreeKey(materialTreeKeyFromNode(info && info.node));
          if (area === 'resource') {
            if (drop.kind !== 'folder' || !drop.id) {
              message.warning('请选择目标文件夹');
              return true;
            }
            const items = this.workbenchBulkSelectedDescriptors('resource');
            if (items.some((item) => item.kind !== 'resource-material' && item.kind !== 'resource-folder')) {
              message.warning('当前选择包含不可移动对象');
              return true;
            }
            const pid = this.workbenchProjectId;
            const mats = demoProjectMaterialsById[pid] || [];
            const folds = demoProjectMaterialFoldersById[pid] || [];
            const invalidFolderMove = items.some((item) => {
              if (item.kind !== 'resource-folder') return false;
              const ids = this.collectWorkbenchMaterialFolderSubtreeIds(item.raw.folderId);
              return ids && ids.has(String(drop.id));
            });
            if (invalidFolderMove) {
              message.warning('不能将文件夹移入自身或其子文件夹');
              return true;
            }
            items.forEach((item) => {
              if (item.kind === 'resource-material') {
                const idx = mats.findIndex((row) => row && String(row.id) === String(item.raw.id));
                if (idx >= 0) mats[idx] = { ...mats[idx], parentId: drop.id };
              } else {
                const idx = folds.findIndex((row) => row && String(row.id) === String(item.raw.folderId));
                if (idx >= 0) folds[idx] = { ...folds[idx], parentId: drop.id };
              }
            });
          } else if (area === 'result') {
            if (drop.kind !== 'folder' || !drop.id) {
              message.warning('请选择目标结果文件夹');
              return true;
            }
            const items = this.workbenchBulkSelectedDescriptors('result');
            if (items.some((item) => item.kind !== 'result-material' && item.kind !== 'result-folder')) {
              message.warning('当前选择包含不可移动对象');
              return true;
            }
            const pid = this.workbenchProjectId;
            const rows = demoProjectAnalysisResultsById[pid] || [];
            const folds = demoProjectAnalysisResultFoldersById[pid] || [];
            const invalidFolderMove = items.some((item) => {
              if (item.kind !== 'result-folder') return false;
              const ids = this.collectWorkbenchAnalysisResultFolderSubtreeIds(item.raw.userFolderId, folds);
              return ids && ids.has(String(drop.id));
            });
            if (invalidFolderMove) {
              message.warning('不能将文件夹移入自身或其子文件夹');
              return true;
            }
            items.forEach((item) => {
              if (item.kind === 'result-material') {
                const idx = rows.findIndex((row) => row && String(row.id) === String(item.raw.id));
                if (idx >= 0) rows[idx] = { ...rows[idx], resultFolderId: drop.id };
                if (item.raw.projectSource) item.raw.projectSource = { ...item.raw.projectSource, resultFolderId: drop.id };
              } else {
                const idx = folds.findIndex((row) => row && String(row.id) === String(item.raw.userFolderId));
                if (idx >= 0) folds[idx] = { ...folds[idx], parentId: drop.id };
              }
            });
          } else {
            return false;
          }
          this.resetWorkbenchBulkSelection(area);
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          message.success('已批量移动');
          return true;
        }
  };
})();
