(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};

  const Modal = antd.Modal;
  const message = antd.message;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const getFreeAuditQuery = freeauditUtils.getFreeAuditQuery || function () { return {}; };
  const presetSuggestions = freeauditUtils.presetSuggestions || [];
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};
  const SUMMARY_RESPONSE_DEMO = freeauditUtils.SUMMARY_RESPONSE_DEMO || '';
  const DEMO_RUN_SUMMARY_TEXT = freeauditUtils.DEMO_RUN_SUMMARY_TEXT || '';
  const demoToolDiffLineClass = freeauditUtils.demoToolDiffLineClass || function () { return 'nlm-tool-diff-line--ctx'; };
  const demoLinesUnifiedDiff = freeauditUtils.demoLinesUnifiedDiff || function () { return { lines: [], truncated: false }; };
  const toAnalysisTemplateShared = freeauditUtils.toAnalysisTemplateShared || function (seed) { return seed; };
  const buildWorkbenchMaterialAntTreeData = freeauditUtils.buildWorkbenchMaterialAntTreeData || function () { return { treeData: [], autoExpandKeys: [] }; };
  const buildWorkbenchAnalysisResultAntTreeData = freeauditUtils.buildWorkbenchAnalysisResultAntTreeData || function () { return { treeData: [], autoExpandKeys: [], initialExpandKeys: [] }; };
  const buildWorkbenchAnalysisResultFolderPickerTree = freeauditUtils.buildWorkbenchAnalysisResultFolderPickerTree || function () { return []; };
  const WB_TASK_CREATE_RESULT_OUTPUT_ROOT = freeauditUtils.WB_TASK_CREATE_RESULT_OUTPUT_ROOT || '__root__';
  const resolveWbTaskCreateResultOutputFolder = freeauditUtils.resolveWbTaskCreateResultOutputFolder || function () { return { folderId: null, folderLabel: '根目录' }; };
  const applyWorkbenchMaterialTreeDrop = freeauditUtils.applyWorkbenchMaterialTreeDrop || function () { return { ok: false, message: '未实现' }; };
  const applyWorkbenchAnalysisResultTreeDrop = freeauditUtils.applyWorkbenchAnalysisResultTreeDrop || function () { return { ok: false, message: '未实现' }; };
  const wbMatMaterialPathPrefixForRow = freeauditUtils.wbMatMaterialPathPrefixForRow || function () { return ''; };
  const wbMatAntTreeKey = freeauditUtils.wbMatAntTreeKey || function (k, id) { return `${k}:${id}`; };
  const cloneRows = function (list) { return (Array.isArray(list) ? list : []).map((row) => ({ ...row })); };
  const WORKBENCH_RESOURCE_SEEDS = (NS && NS.workbenchResourceSeeds) || {};
  const projectUsesEmptyWorkbenchResourceSeeds = function (projectId) {
    return String(projectId || '') === 'PRJ-2026-004';
  };
  const WORKBENCH_MAX_UPLOAD_FILES = 50;
  const WORKBENCH_MAX_UPLOAD_BYTES = 1000 * 1024 * 1024;
  const WORKBENCH_DEMO_UPLOAD_SAMPLES = [
    { name: '审计报告草案.pdf', size: 524288, type: 'application/pdf' },
    { name: '银行流水明细.xlsx', size: 1835008, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: '会议纪要.docx', size: 262144, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: '合同扫描件.jpg', size: 1048576, type: 'image/jpeg' },
    { name: '凭证附件.zip', size: 4194304, type: 'application/zip' },
  ];

  NS.actionGroups = NS.actionGroups || {};
  NS.actionGroups.resourceActions = {
        workbenchResourceDrawerHeadLabel(key) {
          const names = {
            file: '文件',
            database: '数据库表',
            graph: '数据图谱',
            knowledge: '知识库',
          };
          return names[String(key || '')] || '';
        },
        workbenchResourceDrawerHeadCount(key) {
          const counts = this.workbenchResourceDrawerCounts || {};
          return Number(counts[key]) || 0;
        },
        toggleResourceDrawer(key) {
          if (!key || !this.resourceDrawerOpen || !(key in this.resourceDrawerOpen)) return;
          this.resourceDrawerOpen[key] = !this.resourceDrawerOpen[key];
          this.$nextTick(() => this.updateResourceDrawerHeights());
        },
        ensureResourceDrawerOpen(key) {
          if (!key || !this.resourceDrawerOpen || !(key in this.resourceDrawerOpen)) return;
          this.sourcesCollapsed = false;
          if (!this.resourceDrawerOpen[key]) this.resourceDrawerOpen[key] = true;
          this.$nextTick(() => this.updateResourceDrawerHeights());
        },
        setWorkbenchEmbedMode(mode) {
          const next = String(mode || '') === 'v2' ? 'v2' : '';
          if (this.workbenchEmbedMode === next) return;
          this.workbenchEmbedMode = next;
          if (next === 'v2') {
            this.sourcesCollapsed = true;
            this.studioCollapsed = true;
            this.workbenchV2RightDrawerCollapsed = true;
            this.workbenchV2RightPanel = null;
          }
        },
        syncWorkbenchV2ResourceDrawerOpen(panel) {
          const keys = ['file', 'database', 'graph', 'knowledge'];
          keys.forEach((k) => {
            if (this.resourceDrawerOpen && k in this.resourceDrawerOpen) {
              this.resourceDrawerOpen[k] = panel === k;
            }
          });
          this.$nextTick(() => this.updateResourceDrawerHeights());
        },
        openWorkbenchV2RightPanel(panel) {
          const kind = String(panel || '').trim();
          if (!kind) return;
          this.sourcesRightView = 'list';
          if (kind === 'result') {
            this.workbenchV2RightPanel = 'result';
            this.workbenchV2RightDrawerCollapsed = false;
            return;
          }
          if (!['file', 'database', 'graph', 'knowledge'].includes(kind)) return;
          this.workbenchV2RightPanel = kind;
          this.workbenchV2RightDrawerCollapsed = false;
          this.syncWorkbenchV2ResourceDrawerOpen(kind);
        },
        toggleWorkbenchV2RightDrawer() {
          this.sourcesRightView = 'list';
          this.workbenchV2RightDrawerCollapsed = !this.workbenchV2RightDrawerCollapsed;
          if (this.workbenchV2RightDrawerCollapsed) {
            return;
          }
          if (!this.workbenchV2RightPanel) this.openWorkbenchV2RightPanel('file');
        },
        onWorkbenchV2RailSelect(panel) {
          const kind = String(panel || '').trim();
          if (kind === 'toggle') {
            if (!this.workbenchV2RightDrawerCollapsed) {
              this.workbenchV2RightDrawerCollapsed = true;
              this.sourcesRightView = 'list';
              return;
            }
            this.toggleWorkbenchV2RightDrawer();
            return;
          }
          if (this.workbenchV2RightPanel === kind && !this.workbenchV2RightDrawerCollapsed) {
            this.workbenchV2RightDrawerCollapsed = true;
            this.sourcesRightView = 'list';
            return;
          }
          this.openWorkbenchV2RightPanel(kind);
        },
        toggleWorkbenchMaterialSearchPanel() {
          this.workbenchMaterialSearchOpen = !this.workbenchMaterialSearchOpen;
          if (!this.workbenchMaterialSearchOpen) this.materialSearchQuery = '';
        },
        findWorkbenchTaskChildById(id) {
          const tid = String(id || '');
          if (!tid) return null;
          const sources = [...(this.workbenchCreatedTasks || []), ...(this.workbenchTaskDemoRows || [])];
          for (let i = 0; i < sources.length; i += 1) {
            const t = sources[i];
            if (!t || !Array.isArray(t.children)) continue;
            const c = t.children.find((x) => x && x.id === tid);
            if (c) return c;
          }
          return null;
        },
        mockWbTaskCreateDataSourceUpload() {
          if (this.wbTaskCreateForm.dataSourceFile) return;
          this.applyWbTaskCreateDataSourceFile('企业清单-跑批样本.xlsx');
        },
        beforeWbTaskCreateDataSourceUpload(file) {
          const name = String((file && file.name) || '').trim();
          if (!name) return false;
          this.applyWbTaskCreateDataSourceFile(name);
          return false;
        },
        onWbTaskCreateResourceTabChange(tab) {
          const next = String(tab || 'file');
          this.wbTaskCreateForm.resourceTab = next;
          this.wbTaskCreateForm.resourceQuery = '';
          this.syncWbTaskCreateTreeExpandedKeys(next);
        },
        syncWbTaskCreateTreeExpandedKeys(tab) {
          const f = this.wbTaskCreateForm || {};
          const t = String(tab || f.resourceTab || 'file');
          if (t === 'file') {
            f.fileExpandedKeys = (this.wbTaskCreateFileTreeFolderKeys || []).slice();
          } else if (t === 'result') {
            f.resultExpandedKeys = (this.wbTaskCreateResultTreeFolderKeys || []).slice();
          }
        },
        wbTaskCreateTreeNodeCoveredKeys(node, tab) {
          const t = String(tab || (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          const keys = [];
          const walk = (n) => {
            if (!n) return;
            if (n.isFolder) {
              (n.children || []).forEach(walk);
              return;
            }
            const mapped = this.wbTaskCreateTreeNodeToResource(n, t);
            if (mapped && mapped.key) keys.push(mapped.key);
          };
          walk(node);
          return Array.from(new Set(keys));
        },
        wbTaskCreateTreeNodeToResource(node, tab) {
          if (!node) return null;
          const t = String(tab || (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          if (t === 'file') {
            if (node.isFolder) {
              const id = String(node.folderId || '').trim();
              if (!id) return null;
              return {
                key: `file-folder:${id}`,
                type: 'file-folder',
                typeLabel: '文件夹',
                id,
                name: String(node.title || '未命名文件夹'),
                iconClass: 'folder',
                iconToneClass: '',
                coveredResourceKeys: this.wbTaskCreateTreeNodeCoveredKeys(node, t),
              };
            }
            const id = String(node.materialId || '').trim();
            const vm = id ? this.wbMaterialVmById(id) : null;
            if (!id) return null;
            return {
              key: `file:${id}`,
              type: 'file',
              typeLabel: '文件',
              id,
              name: String((vm && vm.title) || node.title || '未命名文件'),
              iconClass: this.getMaterialIcon(vm || { title: node.title, type: 'raw' }),
              iconToneClass: this.getMaterialIconColorClass(vm || { type: 'raw' }),
            };
          }
          if (t === 'result') {
            if (node.isFolder) {
              const id = String(node.userFolderId || node.key || '').trim();
              if (!id) return null;
              return {
                key: `result-folder:${id}`,
                type: 'result-folder',
                typeLabel: '结果文件夹',
                id,
                name: String(node.title || node.folderName || '未命名结果文件夹'),
                iconClass: 'folder',
                iconToneClass: 'is-result',
                coveredResourceKeys: this.wbTaskCreateTreeNodeCoveredKeys(node, t),
              };
            }
            const id = String(node.materialId || '').trim();
            const vm = id ? this.wbMaterialVmById(id) : null;
            if (!id) return null;
            return {
              key: `result:${id}`,
              type: 'result',
              typeLabel: '结果',
              id,
              name: String((vm && vm.title) || node.title || '未命名结果'),
              iconClass: this.getMaterialIcon(vm || { type: 'analysis', title: node.title }),
              iconToneClass: this.getMaterialIconColorClass(vm || { type: 'analysis', title: node.title }),
            };
          }
          return null;
        },
        wbTaskCreateTreeNodeMatchesQuery(node) {
          const q = String((this.wbTaskCreateForm && this.wbTaskCreateForm.resourceQuery) || '').trim().toLowerCase();
          if (!q) return true;
          return String((node && node.title) || '').toLowerCase().includes(q);
        },
        collectWbTaskCreateCurrentTreeResources() {
          const tab = String((this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          const q = String((this.wbTaskCreateForm && this.wbTaskCreateForm.resourceQuery) || '').trim().toLowerCase();
          const roots = tab === 'result' ? (this.wbTaskCreateResultTreeData || []) : (this.wbTaskCreateFileTreeData || []);
          const out = [];
          const visit = (node) => {
            if (!node) return;
            const titleMatches = !q || String(node.title || '').toLowerCase().includes(q);
            if (node.isFolder) {
              if (!q || titleMatches) {
                this.wbTaskCreateTreeNodeLeafResources(node, tab).forEach((item) => out.push(item));
                return;
              }
              (node.children || []).forEach(visit);
              return;
            }
            if (!q || titleMatches) {
              const mapped = this.wbTaskCreateTreeNodeToResource(node, tab);
              if (mapped) out.push(mapped);
            }
          };
          roots.forEach(visit);
          const byKey = new Map();
          out.forEach((item) => {
            if (item && item.key && !byKey.has(item.key)) byKey.set(item.key, item);
          });
          return Array.from(byKey.values());
        },
        toggleWbTaskCreateTreeNodeExpanded(node, tab) {
          if (!node || !node.isFolder || node.key == null) return;
          const t = String(tab || (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          const field = t === 'result' ? 'resultExpandedKeys' : 'fileExpandedKeys';
          const f = this.wbTaskCreateForm || {};
          const key = String(node.key);
          const expanded = new Set((f[field] || []).map(String));
          if (expanded.has(key)) expanded.delete(key);
          else expanded.add(key);
          f[field] = Array.from(expanded);
        },
        wbTaskCreateTreeNodeAllResourceKeys(node, tab) {
          const t = String(tab || (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          const keys = [];
          const walk = (n) => {
            if (!n) return;
            const mapped = this.wbTaskCreateTreeNodeToResource(n, t);
            if (mapped && mapped.key) keys.push(mapped.key);
            (n.children || []).forEach(walk);
          };
          walk(node);
          return Array.from(new Set(keys));
        },
        wbTaskCreateTreeNodeLeafResources(node, tab) {
          const t = String(tab || (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          const out = [];
          const walk = (n) => {
            if (!n) return;
            if (n.isFolder) {
              (n.children || []).forEach(walk);
              return;
            }
            const mapped = this.wbTaskCreateTreeNodeToResource(n, t);
            if (mapped && mapped.key) out.push(mapped);
          };
          walk(node);
          const byKey = new Map();
          out.forEach((item) => {
            if (item && item.key && !byKey.has(item.key)) byKey.set(item.key, item);
          });
          return Array.from(byKey.values());
        },
        wbTaskCreateSelectedCoveredKeySet() {
          const keys = new Set();
          (this.wbTaskCreateForm.selectedResources || []).forEach((item) => {
            if (!item || !item.key) return;
            keys.add(item.key);
            (item.coveredResourceKeys || []).forEach((key) => {
              if (key) keys.add(key);
            });
          });
          return keys;
        },
        isWbTaskCreateTreeNodeChecked(node, tab) {
          const mapped = this.wbTaskCreateTreeNodeToResource(node, tab);
          if (!mapped || !mapped.key) return false;
          const covered = this.wbTaskCreateSelectedCoveredKeySet();
          if (!node.isFolder) return covered.has(mapped.key);
          const leafKeys = mapped.coveredResourceKeys || [];
          return covered.has(mapped.key) || (!!leafKeys.length && leafKeys.every((key) => covered.has(key)));
        },
        isWbTaskCreateTreeNodeIndeterminate(node, tab) {
          if (!node || !node.isFolder || this.isWbTaskCreateTreeNodeChecked(node, tab)) return false;
          const mapped = this.wbTaskCreateTreeNodeToResource(node, tab);
          const leafKeys = (mapped && mapped.coveredResourceKeys) || [];
          if (!leafKeys.length) return false;
          const covered = this.wbTaskCreateSelectedCoveredKeySet();
          return leafKeys.some((key) => covered.has(key));
        },
        toggleWbTaskCreateTreeNodeSelection(node, tab) {
          const mapped = this.wbTaskCreateTreeNodeToResource(node, tab);
          if (!mapped || !mapped.key) return;
          const checked = this.isWbTaskCreateTreeNodeChecked(node, tab);
          if (node.isFolder) {
            const leafResources = this.wbTaskCreateTreeNodeLeafResources(node, tab);
            const nodeKeys = new Set(this.wbTaskCreateTreeNodeAllResourceKeys(node, tab));
            const leafKeys = new Set(leafResources.map((item) => item.key).filter(Boolean));
            this.wbTaskCreateForm.selectedResources = (this.wbTaskCreateForm.selectedResources || []).filter((item) => {
              if (!item || !item.key) return false;
              if (nodeKeys.has(item.key)) return false;
              return !(item.coveredResourceKeys || []).some((key) => leafKeys.has(key));
            });
            if (!checked) leafResources.forEach((item) => this.addWbTaskCreateResource(item));
            return;
          }
          if (checked) {
            this.removeWbTaskCreateResource(mapped.key);
            return;
          }
          this.addWbTaskCreateResource(mapped);
        },
        wbTaskCreateDbGroupTableKeys(grp) {
          return Array.from(new Set(((grp && grp.tables) || []).map((item) => item && item.key).filter(Boolean)));
        },
        isWbTaskCreateDbGroupChecked(grp) {
          const keys = this.wbTaskCreateDbGroupTableKeys(grp);
          if (!keys.length) return false;
          return keys.every((key) => this.isWbTaskCreateResourceSelected(key));
        },
        isWbTaskCreateDbGroupIndeterminate(grp) {
          const keys = this.wbTaskCreateDbGroupTableKeys(grp);
          if (!keys.length || this.isWbTaskCreateDbGroupChecked(grp)) return false;
          return keys.some((key) => this.isWbTaskCreateResourceSelected(key));
        },
        toggleWbTaskCreateDbGroupSelection(grp) {
          const tables = (grp && grp.tables) || [];
          if (!tables.length) return;
          const checked = this.isWbTaskCreateDbGroupChecked(grp);
          if (checked) {
            const keys = new Set(tables.map((item) => item && item.key).filter(Boolean));
            this.wbTaskCreateForm.selectedResources = (this.wbTaskCreateForm.selectedResources || []).filter((item) => !keys.has(item && item.key));
            return;
          }
          tables.forEach((item) => this.addWbTaskCreateResource(item));
        },
        selectAllWbTaskCreateCurrentResources() {
          const rows = this.wbTaskCreateCurrentSelectableResources || [];
          rows.forEach((item) => this.addWbTaskCreateResource(item));
        },
        cancelAllWbTaskCreateCurrentResources() {
          const f = this.wbTaskCreateForm || {};
          const tab = String(f.resourceTab || 'file');
          const q = String(f.resourceQuery || '').trim();
          if (!q && (tab === 'file' || tab === 'result' || tab === 'database' || tab === 'graph')) {
            const typeSet =
              tab === 'file' ? new Set(['file', 'file-folder']) :
              tab === 'result' ? new Set(['result', 'result-folder']) :
              new Set([tab]);
            f.selectedResources = (f.selectedResources || []).filter((item) => !typeSet.has(String((item && item.type) || '')));
            return;
          }
          const keys = new Set((this.wbTaskCreateCurrentSelectableResources || []).map((item) => item && item.key).filter(Boolean));
          f.selectedResources = (f.selectedResources || []).filter((item) => !keys.has(item && item.key));
        },
        addWbTaskCreateResource(item) {
          if (!item || !item.key) return;
          const exists = (this.wbTaskCreateForm.selectedResources || []).some((row) => row.key === item.key);
          if (exists) return;
          this.wbTaskCreateForm.selectedResources = [...(this.wbTaskCreateForm.selectedResources || []), { ...item }];
        },
        isWbTaskCreateResourceSelected(key) {
          return (this.wbTaskCreateForm.selectedResources || []).some((item) => item.key === key);
        },
        toggleWbTaskCreateResource(item) {
          if (!item || !item.key) return;
          if (this.isWbTaskCreateResourceSelected(item.key)) {
            this.removeWbTaskCreateResource(item.key);
            return;
          }
          this.addWbTaskCreateResource(item);
        },
        removeWbTaskCreateResource(key) {
          this.wbTaskCreateForm.selectedResources = (this.wbTaskCreateForm.selectedResources || []).filter((item) => item.key !== key);
        },
        clearWbTaskCreateResources() {
          this.wbTaskCreateForm.selectedResources = [];
        },
        setWorkbenchMaterialStatusView(status) {
          if (status !== 'queued' && status !== 'parsing' && status !== 'failed') return;
          this.workbenchMaterialStatusView = status;
          this.selectedTreeNode = null;
          this.resetWorkbenchBulkSelection('resource');
        },
        resetWorkbenchMaterialStatusView() {
          this.workbenchMaterialStatusView = 'all';
          this.selectedTreeNode = null;
          this.resetWorkbenchBulkSelection('resource');
        },
        openWorkbenchUploadingStatusView() {
          if (!this.workbenchHasUploadingMaterials) return;
          this.openWorkbenchUploadMaterialModal();
        },
        toggleWorkbenchDbSearchPanel() {
          this.workbenchDbSearchOpen = !this.workbenchDbSearchOpen;
          if (!this.workbenchDbSearchOpen) this.dbResourceSearchQuery = '';
        },
        toggleWorkbenchGraphSearchPanel() {
          this.workbenchGraphSearchOpen = !this.workbenchGraphSearchOpen;
          if (!this.workbenchGraphSearchOpen) this.graphResourceSearchQuery = '';
        },
        setResourceDrawerBodyRef(key, el) {
          if (!key || !this.resourceDrawerBodyEls || !(key in this.resourceDrawerBodyEls)) return;
          const nextEl = el || null;
          if (this.resourceDrawerBodyEls[key] === nextEl) return;
          this.resourceDrawerBodyEls[key] = nextEl;
          this.updateResourceDrawerHeights();
        },
        updateResourceDrawerHeights() {
          const keys = ['file', 'database', 'graph', 'knowledge'];
          const prev = this.resourceDrawerContentHeights || {};
          const next = { ...prev };
          let changed = false;
          keys.forEach((k) => {
            if (!this.resourceDrawerOpen[k]) return;
            const el = this.resourceDrawerBodyEls[k];
            const h = el ? Math.max(1, Math.ceil(el.scrollHeight || el.clientHeight || 1)) : 1;
            if (next[k] !== h) {
              next[k] = h;
              changed = true;
            }
          });
          if (changed) this.resourceDrawerContentHeights = next;
        },
        resourceDrawerSectionStyle(key) {
          const isOpen = !!(this.resourceDrawerOpen && this.resourceDrawerOpen[key]);
          if (!isOpen) return { flex: '0 0 auto', minHeight: '34px' };
          const keys = ['file', 'database', 'graph', 'knowledge'].filter((k) => this.resourceDrawerOpen[k]);
          const openCount = keys.length || 1;
          const minPct = 10;
          const totalMin = minPct * openCount;
          const freePct = Math.max(0, 100 - totalMin);
          const weightSum = keys.reduce((sum, k) => sum + Math.max(1, Number(this.resourceDrawerContentHeights[k] || 1)), 0);
          const w = Math.max(1, Number(this.resourceDrawerContentHeights[key] || 1));
          const growPct = weightSum > 0 ? (w / weightSum) * freePct : freePct / openCount;
          const basis = minPct + growPct;
          return {
            flex: '1 1 0',
            minHeight: '10%',
            height: `${basis}%`,
          };
        },
        closeResourcePreview() {
          this.selectedResourcePreview = null;
          this.resourcePreviewTab = 'basic';
          if (this.workbenchEmbedMode === 'v2') {
            this.sourcesRightView = 'list';
          } else {
            this.sourcesLeftView = 'list';
          }
        },
        previewResource(type, row) {
          if (!row) return;
          this.selectedResourcePreview = { ...row, type };
          this.resourcePreviewTab = 'basic';
          if (this.workbenchEmbedMode === 'v2') {
            this.sourcesLeftView = 'list';
            this.sourcesRightView = 'detail';
            this.studioCollapsed = false;
          } else {
            this.sourcesLeftView = 'detail';
            this.sourcesDetailWidth = 450;
          }
        },
        removeResource(type, row) {
          if (!row) return;
          const title = row.name || '未命名资源';
          if (type === 'knowledge') {
            message.info('知识库能力暂未开放');
            return;
          }
          if (type === 'database') {
            this.confirmRemoveDbTableResource(row);
            return;
          }
          window.dsConfirm.delete({
            subject: '该资源',
            onOk: () => {
              if (type === 'graph') {
                this.graphResourceList = (this.graphResourceList || []).filter((item) => item.id !== row.id);
              }
              message.success(`已删除：${title}`);
            },
          });
        },
        confirmRemoveDbTableResource(row) {
          if (!row) return;
          const label =
            row.databaseName && row.tableName ? `${row.databaseName} / ${row.tableName}` : String(row.tableName || row.name || '该表');
          window.dsConfirm.delete({
            title: '删除库表引用？',
            kind: 'folder',
            syncScope: `库表「${label}」`,
            onOk: () => {
              this.dbResourceList = (this.dbResourceList || []).filter((item) => item.id !== row.id);
              message.success(`已删除：${label}`);
            },
          });
        },
        formatWorkbenchDbTableRowCount(n) {
          if (n == null || n === '') return '—';
          const num = Number(n);
          if (!Number.isFinite(num) || num < 0) return String(n);
          if (num >= 100000000) return `${(Math.round((num / 100000000) * 10) / 10).toString().replace(/\.0$/, '')} 亿行`;
          if (num >= 10000) return `${(Math.round((num / 10000) * 10) / 10).toString().replace(/\.0$/, '')} 万行`;
          if (num >= 1000) return `${(Math.round((num / 1000) * 10) / 10).toString().replace(/\.0$/, '')} 千行`;
          return `${num} 行`;
        },
        workbenchDbTableRowExists(databaseId, tableName) {
          const id = String(databaseId || '') + '::' + String(tableName || '');
          return (this.dbResourceList || []).some((r) => r.id === id);
        },
        buildDbTablePreviewPayload(row) {
          if (!row) return {};
          const tc = row.comment != null && String(row.comment).trim() !== '' ? String(row.comment) : '—';
          return {
            id: row.id,
            name: `${row.databaseName} / ${row.tableName}`,
            source: row.source || '',
            owner: row.owner,
            updatedAt: row.updatedAt,
            tableComment: tc,
            rowCountLabel: this.formatWorkbenchDbTableRowCount(row.rowCount),
            tables: [{ name: row.tableName, ddl: row.ddl }],
          };
        },
        previewDbTableResource(row) {
          if (!row) return;
          this.previewResource('database', this.buildDbTablePreviewPayload(row));
        },
        onWorkbenchDbTableContextMenu(key, tbl) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkDbTableDescriptor(tbl));
            return;
          }
          if (key === 'chat') this.addResourceToChat('database', tbl);
          else if (key === 'delete') this.confirmRemoveDbTableResource(tbl);
        },
        onWorkbenchDbCatalogMoreMenu(key, grp) {
          if (key === 'remove-catalog') this.removeWorkbenchDatabaseCatalog(grp);
        },
        onWorkbenchDbCatalogContextMenu(key, grp) {
          if (key === 'chat') {
            this.addResourceToChat('database', {
              databaseId: grp && grp.databaseId,
              databaseName: grp && grp.databaseName,
            });
            return;
          }
          if (key === 'remove-catalog') this.removeWorkbenchDatabaseCatalog(grp);
        },
        removeWorkbenchDatabaseCatalog(grp) {
          if (!grp || grp.databaseId == null) return;
          const id = String(grp.databaseId);
          const name = String(grp.databaseName || '').trim() || '该数据源';
          window.dsConfirm.delete({
            title: '移除此数据源？',
            kind: 'folder',
            syncScope: `「${name}」下的全部库表引用`,
            okText: '移除',
            onOk: () => {
              this.dbResourceList = (this.dbResourceList || []).filter((r) => String(r.databaseId) !== id);
              message.success('已移除数据源及其表引用');
            },
          });
        },
        onWorkbenchGraphContextMenu(key, graph) {
          if (key === 'delete') this.removeResource('graph', graph);
        },
        onWorkbenchGraphRowContextMenu(key, graph) {
          if (key === 'chat') this.addResourceToChat('graph', graph);
          else if (key === 'delete') this.removeResource('graph', graph);
        },
        onResourcePreviewContextMenu(key, row) {
          if (key !== 'delete' || !row) return;
          if (row.type === 'database') {
            this.confirmRemoveDbTableResource(row);
            return;
          }
          if (row.type === 'graph') {
            this.removeResource('graph', row);
          }
        },
        onWbDbAddTableRowSelectionChange(keys) {
          this.wbDbAddSelectedTableNames = Array.isArray(keys) ? keys : [];
        },
        wbDbAddTableGetCheckboxProps(record) {
          return record && record.disabled ? { disabled: true } : { disabled: false };
        },
        isWorkbenchDbTableGroupExpanded(databaseId) {
          const key = String(databaseId);
          const v = this.workbenchDbTableGroupExpanded[key];
          if (v === undefined) return true;
          return !!v;
        },
        toggleWorkbenchDbTableGroup(databaseId) {
          const key = String(databaseId);
          const open = this.isWorkbenchDbTableGroupExpanded(databaseId);
          this.workbenchDbTableGroupExpanded = { ...this.workbenchDbTableGroupExpanded, [key]: !open };
        },
        openWorkbenchDbAddModal() {
          this.wbDbAddCatalogId = undefined;
          this.wbDbAddSelectedTableNames = [];
          this.wbDbAddTableSearchQuery = '';
          this.wbDbAddModalOpen = true;
        },
        closeWorkbenchDbAddModal() {
          this.wbDbAddModalOpen = false;
          this.wbDbAddCatalogId = undefined;
          this.wbDbAddSelectedTableNames = [];
          this.wbDbAddTableSearchQuery = '';
        },
        onWorkbenchDbAddCatalogChange() {
          this.wbDbAddSelectedTableNames = [];
          this.wbDbAddTableSearchQuery = '';
        },
        openWorkbenchGraphAddModal() {
          this.wbGraphAddSelectedIds = [];
          this.wbGraphAddModalOpen = true;
        },
        closeWorkbenchGraphAddModal() {
          this.wbGraphAddModalOpen = false;
          this.wbGraphAddSelectedIds = [];
        },
        openWorkbenchGraphDetailModal(item) {
          if (!item) return;
          this.wbGraphDetailRecord = { ...item };
          this.wbGraphDetailActiveTab = 'basic';
          this.wbGraphDetailModalOpen = true;
        },
        closeWorkbenchGraphDetailModal() {
          this.wbGraphDetailModalOpen = false;
          this.wbGraphDetailRecord = null;
          this.wbGraphDetailActiveTab = 'basic';
        },
        toggleWorkbenchGraphCard(item) {
          if (!item || item.disabled) return;
          const id = String(item.id);
          const set = new Set(this.wbGraphAddSelectedIds || []);
          if (set.has(id)) set.delete(id);
          else set.add(id);
          this.wbGraphAddSelectedIds = Array.from(set);
        },
        onWbGraphAddCheckboxChange(item, e) {
          if (!item || item.disabled) return;
          const id = String(item.id);
          const checked = !!(e && e.target && e.target.checked);
          const set = new Set(this.wbGraphAddSelectedIds || []);
          if (checked) set.add(id);
          else set.delete(id);
          this.wbGraphAddSelectedIds = Array.from(set);
        },
        submitWorkbenchGraphAdd() {
          const selected = new Set((this.wbGraphAddSelectedIds || []).map((x) => String(x)));
          if (!selected.size) {
            message.warning('请至少勾选一个数据图谱');
            return;
          }
          const exists = new Set((this.graphResourceList || []).map((g) => String(g.id)));
          const toAdd = (this.graphCatalogs || []).filter((g) => selected.has(String(g.id)) && !exists.has(String(g.id)));
          if (!toAdd.length) {
            message.info('所选图谱均已存在于工作台，未新增');
            this.closeWorkbenchGraphAddModal();
            return;
          }
          this.graphResourceList = [...toAdd.map((g) => ({ ...g })), ...(this.graphResourceList || [])];
          message.success(`已添加 ${toAdd.length} 个数据图谱`);
          this.closeWorkbenchGraphAddModal();
          this.ensureResourceDrawerOpen('graph');
        },
        filterWbDbAddCatalogOption(input, option) {
          const q = String(input || '').trim().toLowerCase();
          if (!q) return true;
          const lab = option && option.label != null ? String(option.label).toLowerCase() : '';
          return lab.includes(q);
        },
        submitWorkbenchDbAddTables() {
          const catalog = (this.dbCatalogs || []).find((x) => x.id === this.wbDbAddCatalogId);
          if (!catalog) {
            message.warning('请先选择数据库');
            return;
          }
          const names = Array.isArray(this.wbDbAddSelectedTableNames) ? this.wbDbAddSelectedTableNames : [];
          if (!names.length) {
            message.warning('请至少勾选一张数据表');
            return;
          }
          const stamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
          let added = 0;
          names.forEach((tableName) => {
            const t = (catalog.tables || []).find((x) => x.name === tableName);
            if (!t) return;
            if (this.workbenchDbTableRowExists(catalog.id, tableName)) return;
            this.dbResourceList = this.dbResourceList || [];
            this.dbResourceList.push({
              id: `${catalog.id}::${tableName}`,
              databaseId: catalog.id,
              databaseName: catalog.name,
              tableName,
              name: tableName,
              ddl: t.ddl,
              comment: t.comment != null ? String(t.comment) : '',
              rowCount: t.rowCount,
              source: catalog.source,
              owner: catalog.owner,
              updatedAt: stamp,
            });
            added += 1;
          });
          if (!added) {
            message.info('所选表均已存在于工作台，未新增');
          } else {
            message.success(`已添加 ${added} 张表`);
            this.closeWorkbenchDbAddModal();
            this.ensureResourceDrawerOpen('database');
          }
        },
        addGraphResource() {
          const now = Date.now();
          this.graphResourceList = [
            {
              id: 'graph-added-' + now,
              name: '新建图谱配置',
              source: '内置图谱中心',
              entityCount: 0,
              edgeCount: 0,
              updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            },
            ...(this.graphResourceList || []),
          ];
          message.success('已添加数据图谱配置');
          this.ensureResourceDrawerOpen('graph');
        },
        initFromUrl() {
          const rawRoute = (window.location.hash || '').replace(/^#/, '');
          /* hash 已切到 project/ 等其它路由时仍会触发本组件的 hashchange，勿按「无 projectId」误跳工作台 */
          if (!rawRoute.startsWith('freeaudit')) return;
          const q = getFreeAuditQuery();
          if (!q.projectId) {
            message.warning('请先选择或创建工作台后再打开审计助手');
            window.location.hash = 'project';
            return;
          }
          let auxiliaryEnterStaged = false;
          try {
            if (sessionStorage.getItem('demoAuxiliaryEnterAnim') === '1') {
              sessionStorage.removeItem('demoAuxiliaryEnterAnim');
              auxiliaryEnterStaged = true;
            }
          } catch (_) { /* ignore */ }
          if (auxiliaryEnterStaged) {
            this.sourcesCollapsed = true;
            this.studioCollapsed = true;
          }
          const nextProjectId = String(q.projectId || '');
          const projectChanged = String(this.workbenchProjectId || '') !== nextProjectId;
          if (projectChanged) {
            this.clearChatThinkingIntervals();
            this.hideChatQueueNotice();
            this.chatMessages = [];
            this.chatComposerDecision = null;
            this.chatInput = '';
            this.chatInputRefItems = [];
            this.activeChatScenarioId = '';
          }
          this.workbenchProjectId = nextProjectId;
          this.ensureWorkbenchUploadSessionState(nextProjectId);
          this.dbResourceList = projectUsesEmptyWorkbenchResourceSeeds(nextProjectId)
            ? []
            : cloneRows(WORKBENCH_RESOURCE_SEEDS.dbResourceList);
          this.graphResourceList = projectUsesEmptyWorkbenchResourceSeeds(nextProjectId)
            ? []
            : cloneRows(WORKBENCH_RESOURCE_SEEDS.graphResourceList);
          this.knowledgeResourceList = projectUsesEmptyWorkbenchResourceSeeds(nextProjectId)
            ? []
            : cloneRows(WORKBENCH_RESOURCE_SEEDS.knowledgeResourceList);
          this.workbenchMaterialId = q.materialId || null;
          this.workbenchAnalysisResultId = q.analysisResultId || null;
          this.workbenchReportId = q.reportId || null;
          this.syncWorkbenchUploadSessionFromProjectRows(nextProjectId);
          const pid = this.workbenchProjectId;
          const pRows = demoProjectMaterialsById[pid] || [];
          const aRows = demoProjectAnalysisResultsById[pid] || [];
          const mappedRaw = pRows.map((r) => mapProjectRowToWorkbenchMaterial(r, pid));
          const mappedAnalysis = aRows.map((r) => mapAnalysisResultRowToWorkbench(r, pid));
          this.materials = [...mappedRaw, ...mappedAnalysis];
          this.$nextTick(() => {
            this.ensureWorkbenchAnalysisResultTaskFolders();
            const keys = this.workbenchAnalysisResultAntTreeInitialExpandKeys || [];
            if (keys.length) this.workbenchAnalysisResultTreeExpandedKeys = keys.slice();
          });
          this.workbenchMaterialFilterPopoverOpen = false;
          this.wbSkillSidebarSearchKeyword = '';
          this.workbenchAnalysisSearchQuery = '';
          if (this.workbenchMaterialId && this.materials.some((x) => x.id === this.workbenchMaterialId)) this.selectedMaterialId = this.workbenchMaterialId;
          else if (this.workbenchAnalysisResultId && this.materials.some((x) => x.id === this.workbenchAnalysisResultId)) this.selectedMaterialId = this.workbenchAnalysisResultId;
          else if (this.workbenchReportId) this.selectedMaterialId = this.materials.find((x) => x.type === 'analysis')?.id || this.materials[0]?.id;
          else if (this.materials.length) this.selectedMaterialId = this.materials[0].id;
          else this.selectedMaterialId = null;
          const sel = this.selectedMaterialId ? this.materials.find((m) => m.id === this.selectedMaterialId) : null;
          this.sourcesRightView = 'list';
          if (sel) sel.checked = true;
          if (q.openTemplate) {
            this.$nextTick(() => this.openTemplateLibrary());
            const raw2 = (window.location.hash || '').replace(/^#/, '');
            if (raw2.startsWith('freeaudit?')) {
              const [base2, query2 = ''] = raw2.split('?');
              const params2 = new URLSearchParams(query2);
              params2.delete('openTemplate');
              const next2 = params2.toString() ? `${base2}?${params2.toString()}` : base2;
              window.history.replaceState(null, '', '#' + next2);
            }
          }
          if (auxiliaryEnterStaged) {
            this.$nextTick(() => {
              window.setTimeout(() => {
                this.sourcesCollapsed = false;
                this.studioCollapsed = false;
              }, 70);
            });
          }
          this.$nextTick(() => this.ensureDefaultDemoConversation());
        },
        refreshWorkbenchDemoResources(listScope) {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先进入工作台');
            return;
          }
          this.ensureWorkbenchUploadSessionState(pid);
          this.syncWorkbenchUploadSessionFromProjectRows(pid);
          const pRows = demoProjectMaterialsById[pid] || [];
          const aRows = demoProjectAnalysisResultsById[pid] || [];
          const mappedRaw = pRows.map((r) => mapProjectRowToWorkbenchMaterial(r, pid));
          const mappedAnalysis = aRows.map((r) => mapAnalysisResultRowToWorkbench(r, pid));
          this.materials = [...mappedRaw, ...mappedAnalysis];
          this.ensureWorkbenchAnalysisResultTaskFolders();
          this.syncTaskOutputsIntoLinkedResultFolders();
          this.$nextTick(() => {
            const keys = this.workbenchAnalysisResultAntTreeInitialExpandKeys || [];
            if (keys.length) this.workbenchAnalysisResultTreeExpandedKeys = keys.slice();
          });
          const prevSel = this.selectedMaterialId;
          if (prevSel && this.materials.some((x) => x.id === prevSel)) {
            this.selectedMaterialId = prevSel;
          } else if (this.workbenchMaterialId && this.materials.some((x) => x.id === this.workbenchMaterialId)) {
            this.selectedMaterialId = this.workbenchMaterialId;
          } else if (this.workbenchAnalysisResultId && this.materials.some((x) => x.id === this.workbenchAnalysisResultId)) {
            this.selectedMaterialId = this.workbenchAnalysisResultId;
          } else if (this.workbenchReportId) {
            this.selectedMaterialId = this.materials.find((x) => x.type === 'analysis')?.id || this.materials[0]?.id || null;
          } else if (this.materials.length) {
            this.selectedMaterialId = this.materials[0].id;
          } else {
            this.selectedMaterialId = null;
          }
          const sel = this.selectedMaterialId ? this.materials.find((m) => m.id === this.selectedMaterialId) : null;
          if (sel) sel.checked = true;
          this.workbenchMaterialStatusPopoverOpenQueued = false;
          this.workbenchMaterialStatusPopoverOpenParsing = false;
          this.workbenchMaterialStatusPopoverOpenFailed = false;
          this.workbenchAnalysisStatusPopoverOpenQueued = false;
          this.workbenchAnalysisStatusPopoverOpenParsing = false;
          this.workbenchAnalysisStatusPopoverOpenFailed = false;
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          const scope = listScope === 'skill' ? 'skill' : listScope === 'result' ? 'result' : listScope === 'task' ? 'task' : 'material';
          const hint =
            scope === 'result'
              ? '结果列表已同步；助手对话未刷新。'
              : scope === 'skill'
                ? '技能列表已同步；助手对话未刷新。'
                : scope === 'task'
                  ? '任务列表已同步；助手对话未刷新。'
                  : '资料列表已同步；助手对话未刷新。';
          message.success(hint);
        },
        openProjectCenterUpload() {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先进入工作台并打开审计助手后再上传资料');
            return;
          }
          this.openWorkbenchUploadMaterialModal(null);
        },
        openProjectCenterUploadForFolder(folderId) {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先进入工作台并打开审计助手后再上传资料');
            return;
          }
          const fid = folderId != null ? String(folderId).trim() : '';
          if (!fid) {
            this.openProjectCenterUpload();
            return;
          }
          this.openWorkbenchUploadMaterialModal(fid);
        },
        ensureWorkbenchUploadSessionState(pid) {
          const projectId = String(pid || this.workbenchProjectId || '').trim();
          if (!projectId) return null;
          const sessions = this.wbUploadMaterialSessionByProjectId || {};
          const parents = this.wbUploadMaterialParentFolderByProjectId || {};
          if (!Array.isArray(sessions[projectId])) {
            this.wbUploadMaterialSessionByProjectId = { ...sessions, [projectId]: [] };
          }
          if (!(projectId in parents)) {
            this.wbUploadMaterialParentFolderByProjectId = { ...parents, [projectId]: null };
          }
          return projectId;
        },
        getWorkbenchUploadSessionItems(pid) {
          const projectId = this.ensureWorkbenchUploadSessionState(pid);
          if (!projectId) return [];
          return Array.isArray(this.wbUploadMaterialSessionByProjectId[projectId]) ? this.wbUploadMaterialSessionByProjectId[projectId] : [];
        },
        setWorkbenchUploadSessionItems(items, pid) {
          const projectId = this.ensureWorkbenchUploadSessionState(pid);
          if (!projectId) return;
          this.wbUploadMaterialSessionByProjectId = {
            ...(this.wbUploadMaterialSessionByProjectId || {}),
            [projectId]: Array.isArray(items) ? items : [],
          };
        },
        getWorkbenchUploadParentFolder(pid) {
          const projectId = this.ensureWorkbenchUploadSessionState(pid);
          if (!projectId) return null;
          const v = (this.wbUploadMaterialParentFolderByProjectId || {})[projectId];
          return v != null && String(v).trim() !== '' ? String(v).trim() : null;
        },
        setWorkbenchUploadParentFolder(folderId, pid) {
          const projectId = this.ensureWorkbenchUploadSessionState(pid);
          if (!projectId) return;
          const next = folderId != null && String(folderId).trim() !== '' ? String(folderId).trim() : null;
          this.wbUploadMaterialParentFolderByProjectId = {
            ...(this.wbUploadMaterialParentFolderByProjectId || {}),
            [projectId]: next,
          };
        },
        syncWorkbenchUploadSessionFromProjectRows(pid) {
          const projectId = this.ensureWorkbenchUploadSessionState(pid);
          if (!projectId || typeof demoProjectMaterialsById === 'undefined') return;
          const rows = Array.isArray(demoProjectMaterialsById[projectId]) ? demoProjectMaterialsById[projectId] : [];
          const session = this.getWorkbenchUploadSessionItems(projectId);
          const existing = new Set(session.map((item) => String(item.sourceMaterialId || item.uid || '')));
          const nextRows = [];
          const imported = [];
          rows.forEach((row) => {
            if (!row || String(row.status || '') !== 'uploading') {
              nextRows.push(row);
              return;
            }
            const key = String(row.id || '');
            if (key && !existing.has(key)) {
              imported.push({
                uid: key,
                sourceMaterialId: key,
                name: row.name || '未命名资料',
                size: Number(row.size || 0),
                type: '',
                status: 'uploading',
                progress: Math.max(0, Math.min(100, Number(row.progress || 0) || 0)),
                failureReason: '',
                parentFolderId: row.parentId != null && String(row.parentId).trim() !== '' ? String(row.parentId).trim() : null,
              });
            }
          });
          if (nextRows.length !== rows.length) demoProjectMaterialsById[projectId] = nextRows;
          if (imported.length) this.setWorkbenchUploadSessionItems([...session, ...imported], projectId);
        },
        openWorkbenchUploadMaterialModal(parentFolderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') {
            message.warning('请先进入工作台并打开审计助手后再上传资料');
            return;
          }
          this.ensureWorkbenchUploadSessionState(pid);
          this.syncWorkbenchUploadSessionFromProjectRows(pid);
          if (parentFolderId !== undefined) this.setWorkbenchUploadParentFolder(parentFolderId, pid);
          this.wbUploadMaterialVisible = true;
        },
        blockWorkbenchRealUploadMaterial() {
          return false;
        },
        simulateWorkbenchUploadMaterial(evt) {
          if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
          if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') {
            message.warning('请先进入工作台并打开审计助手后再上传资料');
            return;
          }
          const session = this.getWorkbenchUploadSessionItems(pid);
          if (session.length >= WORKBENCH_MAX_UPLOAD_FILES) {
            message.warning('单次最多上传 50 个文件');
            return;
          }
          const sample = WORKBENCH_DEMO_UPLOAD_SAMPLES[session.length % WORKBENCH_DEMO_UPLOAD_SAMPLES.length];
          const seq = session.length + 1;
          const extMatch = sample.name.match(/(\.[^.]+)$/);
          const ext = extMatch ? extMatch[1] : '';
          const baseName = ext ? sample.name.slice(0, -ext.length) : sample.name;
          const name = `${baseName}-${seq}${ext}`;
          const uid = 'upload-demo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          this.setWorkbenchUploadSessionItems([{
            uid,
            name,
            size: sample.size,
            type: sample.type,
            status: 'pending',
            progress: 0,
            failureReason: '',
            parentFolderId: this.getWorkbenchUploadParentFolder(pid),
          }, ...session], pid);
        },
        beforeWorkbenchUploadMaterial(file) {
          const pid = this.workbenchProjectId;
          if (!pid || !file) return false;
          const bytes = Number(file.size || 0);
          if (Number.isFinite(bytes) && bytes > WORKBENCH_MAX_UPLOAD_BYTES) {
            message.warning('单个文件不能超过 1000.00 MB');
            return false;
          }
          const session = this.getWorkbenchUploadSessionItems(pid);
          if (session.length >= WORKBENCH_MAX_UPLOAD_FILES) {
            message.warning('单次最多上传 50 个文件');
            return false;
          }
          const uid = file && file.uid ? String(file.uid) : ('upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
          this.setWorkbenchUploadSessionItems([{
            uid,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'pending',
            progress: 0,
            failureReason: '',
            parentFolderId: this.getWorkbenchUploadParentFolder(pid),
          }, ...session], pid);
          return false;
        },
        findWorkbenchUploadSessionItem(uid, pid) {
          const key = String(uid || '');
          if (!key) return null;
          return this.getWorkbenchUploadSessionItems(pid).find((item) => item && String(item.uid) === key) || null;
        },
        patchWorkbenchUploadSessionItem(uid, patch, pid) {
          const key = String(uid || '');
          if (!key) return;
          const session = this.getWorkbenchUploadSessionItems(pid).map((item) => {
            if (!item || String(item.uid) !== key) return item;
            return { ...item, ...(typeof patch === 'function' ? patch(item) : (patch || {})) };
          });
          this.setWorkbenchUploadSessionItems(session, pid);
        },
        removeWorkbenchUploadSessionItemsByUid(uids, pid) {
          const idSet = new Set((Array.isArray(uids) ? uids : [uids]).map((uid) => String(uid || '')).filter(Boolean));
          if (!idSet.size) return;
          this.setWorkbenchUploadSessionItems(this.getWorkbenchUploadSessionItems(pid).filter((item) => !idSet.has(String(item && item.uid))), pid);
          if (this.workbenchBulkAreaActive && this.workbenchBulkAreaActive('upload')) {
            const nextKeys = this.workbenchBulkKeys('upload').filter((key) => !idSet.has(String(key).split(':').slice(2).join(':')));
            this.workbenchBulkSelection = { area: 'upload', scope: 'session', keys: nextKeys };
          }
        },
        removeWorkbenchUploadMaterial(file) {
          const uid = String(file && file.uid ? file.uid : '');
          if (!uid) return;
          this.removeWorkbenchUploadSessionItemsByUid(uid);
        },
        clearWorkbenchUploadPendingItems() {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          const removing = this.getWorkbenchUploadSessionItems(pid)
            .filter((item) => String(item.status || '') === 'pending')
            .map((item) => item.uid);
          this.removeWorkbenchUploadSessionItemsByUid(removing, pid);
        },
        closeWorkbenchUploadMaterialModal() {
          this.wbUploadMaterialVisible = false;
        },
        formatWorkbenchUploadMaterialSize(size) {
          const bytes = Number(size || 0);
          if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
          return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        },
        workbenchUploadSessionStatusLabel(item) {
          const st = String((item && item.status) || '');
          if (st === 'pending') return '待上传';
          if (st === 'uploading') return `上传中 ${Math.max(0, Math.min(100, Number(item.progress || 0) || 0))}%`;
          if (st === 'failed') return '上传失败';
          return '待上传';
        },
        workbenchUploadSessionFailureText(item) {
          return String((item && item.failureReason) || '').trim();
        },
        workbenchUploadSessionItemAction(item) {
          const st = String((item && item.status) || '');
          if (st === 'pending') return 'remove';
          if (st === 'uploading') return 'cancel-upload';
          if (st === 'failed') return 'retry-upload';
          return '';
        },
        workbenchUploadSessionSecondaryAction(item) {
          return String((item && item.status) || '') === 'failed' ? 'remove' : '';
        },
        workbenchUploadSessionActionLabel(action) {
          return {
            upload: '上传',
            'retry-upload': '重试上传',
            'cancel-upload': '取消上传',
            remove: '移除',
          }[String(action || '')] || '';
        },
        handleWorkbenchUploadSessionItemAction(action, item) {
          if (!action || !item) return;
          if (action === 'remove') this.removeWorkbenchUploadMaterial(item);
          else if (action === 'cancel-upload') this.cancelWorkbenchUploadSessionItem(item);
          else if (action === 'retry-upload') this.retryWorkbenchUploadSessionItem(item);
        },
        _clearWorkbenchUploadTimers(id) {
          const key = String(id || '');
          const timers = this._workbenchUploadTimers || {};
          (timers[key] || []).forEach((tid) => window.clearTimeout(tid));
          if (key && timers[key]) delete timers[key];
        },
        _clearWorkbenchParseTimers(id) {
          const key = String(id || '');
          const timers = this._workbenchParseTimers || {};
          (timers[key] || []).forEach((tid) => window.clearTimeout(tid));
          if (key && timers[key]) delete timers[key];
        },
        _touchWorkbenchMaterialDemoState() {
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
        },
        _shouldWorkbenchUploadSessionFail(item) {
          const bytes = Number((item && item.size) || 0);
          return Number.isFinite(bytes) && bytes > 1000 * 1024 * 1024;
        },
        _workbenchUploadSessionFailureReason(item) {
          if (this._shouldWorkbenchUploadSessionFail(item)) return '文件大小超过 1000.00 MB';
          return '上传失败，请稍后重试';
        },
        _startWorkbenchParseSimulation(ids, startStatus = 'queued') {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') return;
          const rows = demoProjectMaterialsById[pid] || [];
          const stages = String(startStatus || 'queued') === 'parsing'
            ? [{ delay: 1600, status: 'done', progress: 100 }]
            : [
              { delay: 1100, status: 'parsing', progress: 38 },
              { delay: 3200, status: 'done', progress: 100 },
            ];
          (Array.isArray(ids) ? ids : []).forEach((id) => {
            const key = String(id || '');
            if (!key) return;
            this._clearWorkbenchParseTimers(key);
            const timers = stages.map((stage) => window.setTimeout(() => {
              const row = rows.find((r) => r && String(r.id) === key);
              if (!row) return;
              const st = String(row.status || '');
              const canMove =
                (stage.status === 'parsing' && st === 'queued') ||
                (stage.status === 'done' && (st === 'queued' || st === 'parsing'));
              if (!canMove) return;
              row.status = stage.status;
              row.progress = stage.progress;
              this._touchWorkbenchMaterialDemoState();
              if (stage.status === 'done') this._clearWorkbenchParseTimers(key);
            }, stage.delay));
            this._workbenchParseTimers = { ...(this._workbenchParseTimers || {}), [key]: timers };
          });
        },
        _ingestWorkbenchUploadSessionItem(item, pid) {
          const projectId = String(pid || this.workbenchProjectId || '').trim();
          if (!projectId || !item || typeof demoProjectMaterialsById === 'undefined') return;
          const rows = Array.isArray(demoProjectMaterialsById[projectId]) ? demoProjectMaterialsById[projectId] : [];
          const parentFolder = item.parentFolderId != null && String(item.parentFolderId).trim() !== '' ? String(item.parentFolderId).trim() : null;
          const siblingSortMax = rows.reduce((acc, row) => {
            const same = row && String(row.parentId || '') === String(parentFolder || '');
            if (!same) return acc;
            const s = Number(row.sort);
            return Number.isFinite(s) ? Math.max(acc, s) : acc;
          }, 0);
          const resourceId = String(item.sourceMaterialId || ('mat-upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)));
          rows.unshift({
            id: resourceId,
            name: item.name || '未命名资料',
            status: 'queued',
            progress: 0,
            failureReason: '',
            uploadedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            tags: [],
            format: String((item.name || '').split('.').pop() || '').toUpperCase() || 'FILE',
            size: Number(item.size || 0),
            parentId: parentFolder,
            sort: siblingSortMax + 1,
          });
          demoProjectMaterialsById[projectId] = rows;
          this.removeWorkbenchUploadSessionItemsByUid(item.uid, projectId);
          this.refreshWorkbenchDemoResources('material');
          this.ensureResourceDrawerOpen('file');
          this._startWorkbenchParseSimulation([resourceId], 'queued');
          this._maybeCompleteWorkbenchUploadSession(projectId);
        },
        _maybeCompleteWorkbenchUploadSession(pid) {
          const projectId = String(pid || this.workbenchProjectId || '').trim();
          if (!projectId) return;
          if ((this.getWorkbenchUploadSessionItems(projectId) || []).length > 0) return;
          message.success('已全部上传');
          if (this.wbUploadMaterialVisible) this.closeWorkbenchUploadMaterialModal();
        },
        _startWorkbenchUploadSessionSimulation(uids, pid) {
          const projectId = String(pid || this.workbenchProjectId || '').trim();
          if (!projectId) return;
          const stages = [{ delay: 700, progress: 24 }, { delay: 1500, progress: 61 }, { delay: 2600, progress: 100 }];
          (Array.isArray(uids) ? uids : []).forEach((uid) => {
            const key = String(uid || '');
            if (!key) return;
            this._clearWorkbenchUploadTimers(key);
            const timers = stages.map((stage, index) => window.setTimeout(() => {
              const item = this.findWorkbenchUploadSessionItem(key, projectId);
              if (!item || String(item.status || '') !== 'uploading') return;
              if (index < stages.length - 1) {
                this.patchWorkbenchUploadSessionItem(key, { progress: stage.progress }, projectId);
                return;
              }
              if (this._shouldWorkbenchUploadSessionFail(item)) {
                this.patchWorkbenchUploadSessionItem(key, {
                  status: 'failed',
                  progress: 0,
                  failureReason: this._workbenchUploadSessionFailureReason(item),
                }, projectId);
                this._clearWorkbenchUploadTimers(key);
                return;
              }
              this._ingestWorkbenchUploadSessionItem({ ...item, progress: 100 }, projectId);
              this._clearWorkbenchUploadTimers(key);
            }, stage.delay));
            this._workbenchUploadTimers = { ...(this._workbenchUploadTimers || {}), [key]: timers };
          });
        },
        _applyCancelWorkbenchUploadMaterials(materials, toastText) {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          const ids = new Set((Array.isArray(materials) ? materials : [])
            .filter((m) => m && String(m.status || '') === 'uploading')
            .map((m) => String(m.uid)));
          if (!ids.size) return;
          ids.forEach((id) => this._clearWorkbenchUploadTimers(id));
          this.removeWorkbenchUploadSessionItemsByUid(Array.from(ids), pid);
          if (toastText !== false) {
            const text = typeof toastText === 'string' ? toastText : `已取消 ${ids.size} 个文件上传`;
            this._setWorkbenchBatchToast(text, 1500);
          }
        },
        cancelWorkbenchUploadSessionItem(item) {
          if (!item || String(item.status || '') !== 'uploading') return;
          const run = () => this._applyCancelWorkbenchUploadMaterials([item]);
          const dc = window.dsConfirm;
          if (!dc || !dc.action) {
            run();
            return;
          }
          dc.action({
            title: '取消该文件上传？',
            content: '取消后不会进入解析队列。',
            okText: '取消上传',
            onOk: run,
          });
        },
        retryWorkbenchUploadSessionItem(item) {
          if (!item || String(item.status || '') !== 'failed') return;
          const pid = this.workbenchProjectId;
          if (!pid) return;
          this.patchWorkbenchUploadSessionItem(item.uid, { status: 'uploading', progress: 8, failureReason: '' }, pid);
          this._startWorkbenchUploadSessionSimulation([item.uid], pid);
        },
        applyWorkbenchUploadSessionItemsUpload(items) {
          const pid = this.workbenchProjectId;
          if (!pid) return 0;
          const eligible = (Array.isArray(items) ? items : [])
            .filter((item) => item && String(item.status || '') === 'pending');
          if (!eligible.length) return 0;
          const idSet = new Set(eligible.map((item) => String(item.uid)));
          const session = this.getWorkbenchUploadSessionItems(pid).map((item) => {
            if (!item || !idSet.has(String(item.uid))) return item;
            return { ...item, status: 'uploading', progress: 8, failureReason: '' };
          });
          this.setWorkbenchUploadSessionItems(session, pid);
          this._startWorkbenchUploadSessionSimulation(Array.from(idSet), pid);
          return eligible.length;
        },
        applyWorkbenchUploadSessionItemsRetry(items) {
          const pid = this.workbenchProjectId;
          if (!pid) return 0;
          const eligible = (Array.isArray(items) ? items : [])
            .filter((item) => item && String(item.status || '') === 'failed');
          if (!eligible.length) return 0;
          const idSet = new Set(eligible.map((item) => String(item.uid)));
          const session = this.getWorkbenchUploadSessionItems(pid).map((item) => {
            if (!item || !idSet.has(String(item.uid))) return item;
            return { ...item, status: 'uploading', progress: 8, failureReason: '' };
          });
          this.setWorkbenchUploadSessionItems(session, pid);
          this._startWorkbenchUploadSessionSimulation(Array.from(idSet), pid);
          return eligible.length;
        },
        applyWorkbenchUploadSessionItemsCancel(items) {
          const eligible = (Array.isArray(items) ? items : []).filter((item) => item && String(item.status || '') === 'uploading');
          if (!eligible.length) return 0;
          this._applyCancelWorkbenchUploadMaterials(eligible, false);
          return eligible.length;
        },
        applyWorkbenchUploadSessionItemsRemove(items) {
          const eligible = (Array.isArray(items) ? items : []).filter(Boolean);
          if (!eligible.length) return 0;
          this.removeWorkbenchUploadSessionItemsByUid(eligible.map((item) => item.uid));
          return eligible.length;
        },
        submitWorkbenchUploadMaterials() {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('未定位到工作台');
            return;
          }
          const count = this.applyWorkbenchUploadSessionItemsUpload(this.workbenchUploadSessionPendingList || []);
          if (!count) {
            message.warning('请先选择资料');
            return;
          }
          message.success(`已开始上传 ${count} 个文件`);
        },
        onWorkbenchMaterialAddMenu(key, folderId) {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先进入工作台并打开审计助手后再上传资料');
            return;
          }
          const targetFolderId = folderId != null ? String(folderId).trim() : '';
          if (key === 'upload-file') {
            if (targetFolderId) this.openProjectCenterUploadForFolder(targetFolderId);
            else this.openProjectCenterUpload();
            return;
          }
          if (key === 'cross-workbench-import') {
            this.openCrossWorkbenchImportModal(targetFolderId);
            return;
          }
          if (key === 'new-folder') {
            this.openWorkbenchMaterialCreateFolderModal(targetFolderId);
          }
        },
        crossWorkbenchImportSourceProjects() {
          const currentPid = String(this.workbenchProjectId || '').trim();
          const materialMap = typeof demoProjectMaterialsById !== 'undefined' ? demoProjectMaterialsById : {};
          const resultMap = typeof demoProjectAnalysisResultsById !== 'undefined' ? demoProjectAnalysisResultsById : {};
          const ids = Array.from(new Set([...Object.keys(materialMap || {}), ...Object.keys(resultMap || {})]))
            .filter((id) => id && id !== currentPid);
          return ids.map((id) => {
            const fileCount = (materialMap[id] || []).filter((row) => String((row && row.status) || '') === 'done').length;
            const resultCount = (resultMap[id] || []).filter((row) => String((row && row.status) || '') === 'done').length;
            return {
              id,
              name: WORKBENCH_PROJECT_NAME_BY_ID[id] || `工作台 ${id}`,
              fileCount,
              resultCount,
            };
          }).filter((row) => row.fileCount + row.resultCount > 0);
        },
        crossWorkbenchImportSourceOptions() {
          return this.crossWorkbenchImportSourceProjects().map((row) => ({
            label: row.name,
            value: row.id,
          }));
        },
        openCrossWorkbenchImportModal(targetFolderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') {
            message.warning('请先进入工作台并打开审计助手后再引入资料');
            return;
          }
          const sources = this.crossWorkbenchImportSourceProjects();
          this.wbCrossWorkbenchImportSourceProjectId = sources.length ? sources[0].id : '';
          this.wbCrossWorkbenchImportTab = 'file';
          this.wbCrossWorkbenchImportQuery = '';
          this.wbCrossWorkbenchImportSelectedKeys = [];
          this.wbCrossWorkbenchImportExpandedKeys = [];
          const target = targetFolderId != null ? String(targetFolderId).trim() : '';
          this.wbCrossWorkbenchImportTargetFolderId = target;
          this.wbCrossWorkbenchImportTargetOriginFolderId = target;
          this.wbCrossWorkbenchImportOpen = true;
          this.$nextTick(() => this.syncCrossWorkbenchImportExpandedKeys());
        },
        closeCrossWorkbenchImportModal() {
          this.wbCrossWorkbenchImportOpen = false;
          this.wbCrossWorkbenchImportSourceProjectId = '';
          this.wbCrossWorkbenchImportTab = 'file';
          this.wbCrossWorkbenchImportQuery = '';
          this.wbCrossWorkbenchImportSelectedKeys = [];
          this.wbCrossWorkbenchImportExpandedKeys = [];
          this.wbCrossWorkbenchImportTargetFolderId = '';
          this.wbCrossWorkbenchImportTargetOriginFolderId = '';
        },
        onCrossWorkbenchImportSourceChange(projectId) {
          this.wbCrossWorkbenchImportSourceProjectId = String(projectId || '');
          this.wbCrossWorkbenchImportSelectedKeys = [];
          this.wbCrossWorkbenchImportQuery = '';
          this.syncCrossWorkbenchImportExpandedKeys();
        },
        onCrossWorkbenchImportTabChange(tab) {
          this.wbCrossWorkbenchImportTab = String(tab || 'file');
          this.wbCrossWorkbenchImportSelectedKeys = [];
          this.wbCrossWorkbenchImportQuery = '';
          this.syncCrossWorkbenchImportExpandedKeys();
        },
        syncCrossWorkbenchImportExpandedKeys() {
          const keys = [];
          const walk = (node) => {
            if (!node) return;
            if (node.isFolder && node.key) keys.push(node.key);
            (node.children || []).forEach(walk);
          };
          (this.crossWorkbenchImportTreeData() || []).forEach(walk);
          this.wbCrossWorkbenchImportExpandedKeys = keys;
        },
        crossWorkbenchImportSourceMeta() {
          return this.crossWorkbenchImportSourceProjects().find((row) => row.id === this.wbCrossWorkbenchImportSourceProjectId) || null;
        },
        crossWorkbenchImportTreeData() {
          const sourcePid = String(this.wbCrossWorkbenchImportSourceProjectId || '');
          if (!sourcePid) return [];
          const query = this.wbCrossWorkbenchImportQuery || '';
          if (this.wbCrossWorkbenchImportTab === 'result') {
            const rows = typeof demoProjectAnalysisResultsById !== 'undefined' ? (demoProjectAnalysisResultsById[sourcePid] || []) : [];
            const folders = typeof demoProjectAnalysisResultFoldersById !== 'undefined' ? (demoProjectAnalysisResultFoldersById[sourcePid] || []) : [];
            return buildWorkbenchAnalysisResultAntTreeData({
              materials: rows
                .filter((row) => String((row && row.status) || 'done') === 'done')
                .map((row) => ({
                  id: String(row.id),
                  title: String(row.name || '未命名结果'),
                  type: 'analysis',
                  projectSource: row,
                })),
              resultFolders: folders,
              searchQuery: query,
              sortMode: 'name',
            }).treeData || [];
          }
          const rows = typeof demoProjectMaterialsById !== 'undefined' ? (demoProjectMaterialsById[sourcePid] || []) : [];
          const folders = typeof demoProjectMaterialFoldersById !== 'undefined' ? (demoProjectMaterialFoldersById[sourcePid] || []) : [];
          return buildWorkbenchMaterialAntTreeData({
            folders,
            materialProjectRows: rows,
            includeStatuses: ['done'],
            searchQuery: query,
          }).treeData || [];
        },
        crossWorkbenchImportSourceMaterialRowById(id) {
          const sourcePid = String(this.wbCrossWorkbenchImportSourceProjectId || '');
          const rid = String(id || '').trim();
          if (!sourcePid || !rid) return null;
          if (this.wbCrossWorkbenchImportTab === 'result') {
            const rows = typeof demoProjectAnalysisResultsById !== 'undefined' ? (demoProjectAnalysisResultsById[sourcePid] || []) : [];
            return rows.find((row) => String(row.id) === rid) || null;
          }
          const rows = typeof demoProjectMaterialsById !== 'undefined' ? (demoProjectMaterialsById[sourcePid] || []) : [];
          return rows.find((row) => String(row.id) === rid) || null;
        },
        crossWorkbenchImportTreeNodeIconMeta(node) {
          const tab = String(this.wbCrossWorkbenchImportTab || 'file');
          if (!node) return { iconClass: 'file-lines', iconToneClass: '' };
          if (node.isFolder) return { iconClass: 'folder', iconToneClass: tab === 'result' ? 'is-result' : '' };
          const row = this.crossWorkbenchImportSourceMaterialRowById(node.materialId);
          if (tab === 'result') {
            const vm = row ? { ...row, type: 'analysis', title: row.name || node.title } : { type: 'analysis', title: node.title };
            return {
              iconClass: this.getMaterialIcon(vm),
              iconToneClass: this.getMaterialIconColorClass(vm),
            };
          }
          const vm = row ? { ...row, type: row.type || 'raw', title: row.name || node.title } : { type: 'raw', title: node.title };
          return {
            iconClass: this.getMaterialIcon(vm),
            iconToneClass: this.getMaterialIconColorClass(vm),
          };
        },
        crossWorkbenchImportTreeNodeToResource(node, tab) {
          if (!node) return null;
          const t = String(tab || this.wbCrossWorkbenchImportTab || 'file');
          if (t === 'result') {
            if (node.isFolder) {
              const id = String(node.userFolderId || node.key || '').trim();
              if (!id) return null;
              return {
                key: `result-folder:${id}`,
                type: 'result-folder',
                typeLabel: '结果文件夹',
                id,
                name: String(node.title || node.folderName || '未命名结果文件夹'),
                iconClass: 'folder',
                iconToneClass: 'is-result',
                coveredResourceKeys: this.crossWorkbenchImportTreeNodeCoveredKeys(node, t),
              };
            }
            const id = String(node.materialId || '').trim();
            if (!id) return null;
            const meta = this.crossWorkbenchImportTreeNodeIconMeta(node);
            return {
              key: `result:${id}`,
              type: 'result',
              typeLabel: '结果',
              id,
              name: String(node.title || '未命名结果'),
              iconClass: meta.iconClass,
              iconToneClass: meta.iconToneClass,
            };
          }
          if (node.isFolder) {
            const id = String(node.folderId || '').trim();
            if (!id) return null;
            return {
              key: `file-folder:${id}`,
              type: 'file-folder',
              typeLabel: '文件夹',
              id,
              name: String(node.title || '未命名文件夹'),
              iconClass: 'folder',
              iconToneClass: '',
              coveredResourceKeys: this.crossWorkbenchImportTreeNodeCoveredKeys(node, t),
            };
          }
          const id = String(node.materialId || '').trim();
          if (!id) return null;
          const meta = this.crossWorkbenchImportTreeNodeIconMeta(node);
          return {
            key: `file:${id}`,
            type: 'file',
            typeLabel: '文件',
            id,
            name: String(node.title || '未命名文件'),
            iconClass: meta.iconClass,
            iconToneClass: meta.iconToneClass,
          };
        },
        crossWorkbenchImportTreeNodeCoveredKeys(node, tab) {
          const t = String(tab || this.wbCrossWorkbenchImportTab || 'file');
          const keys = [];
          const walk = (n) => {
            if (!n) return;
            (n.children || []).forEach((child) => {
              const mapped = this.crossWorkbenchImportTreeNodeToResource(child, t);
              if (mapped && mapped.key) keys.push(mapped.key);
              walk(child);
            });
          };
          walk(node);
          return Array.from(new Set(keys));
        },
        crossWorkbenchImportTreeNodeLeafResources(node, tab) {
          const t = String(tab || this.wbCrossWorkbenchImportTab || 'file');
          const out = [];
          const walk = (n) => {
            if (!n) return;
            if (n.isFolder) {
              (n.children || []).forEach(walk);
              return;
            }
            const mapped = this.crossWorkbenchImportTreeNodeToResource(n, t);
            if (mapped && mapped.key) out.push(mapped);
          };
          walk(node);
          const byKey = new Map();
          out.forEach((item) => {
            if (item && item.key && !byKey.has(item.key)) byKey.set(item.key, item);
          });
          return Array.from(byKey.values());
        },
        crossWorkbenchImportSelectedKeySet() {
          const keys = new Set();
          (this.crossWorkbenchImportSelectedRows() || []).forEach((item) => {
            if (!item || !item.key) return;
            keys.add(item.key);
            (item.coveredResourceKeys || []).forEach((key) => {
              if (key) keys.add(key);
            });
          });
          return keys;
        },
        isCrossWorkbenchImportTreeNodeChecked(node) {
          const mapped = this.crossWorkbenchImportTreeNodeToResource(node);
          if (!mapped || !mapped.key) return false;
          const covered = this.crossWorkbenchImportSelectedKeySet();
          if (!node.isFolder) return covered.has(mapped.key);
          const childKeys = mapped.coveredResourceKeys || [];
          return covered.has(mapped.key) || (!!childKeys.length && childKeys.every((key) => covered.has(key)));
        },
        isCrossWorkbenchImportTreeNodeIndeterminate(node) {
          if (!node || !node.isFolder || this.isCrossWorkbenchImportTreeNodeChecked(node)) return false;
          const mapped = this.crossWorkbenchImportTreeNodeToResource(node);
          const childKeys = (mapped && mapped.coveredResourceKeys) || [];
          if (!childKeys.length) return false;
          const covered = this.crossWorkbenchImportSelectedKeySet();
          return childKeys.some((key) => covered.has(key));
        },
        toggleCrossWorkbenchImportTreeNodeExpanded(node) {
          if (!node || !node.isFolder || node.key == null) return;
          const key = String(node.key);
          const expanded = new Set((this.wbCrossWorkbenchImportExpandedKeys || []).map(String));
          if (expanded.has(key)) expanded.delete(key);
          else expanded.add(key);
          this.wbCrossWorkbenchImportExpandedKeys = Array.from(expanded);
        },
        addCrossWorkbenchImportResource(item) {
          if (!item || !item.key) return;
          const exists = (this.wbCrossWorkbenchImportSelectedKeys || []).some((key) => key === item.key);
          if (exists) return;
          this.wbCrossWorkbenchImportSelectedKeys = [...(this.wbCrossWorkbenchImportSelectedKeys || []), item.key];
        },
        removeCrossWorkbenchImportResource(key) {
          this.wbCrossWorkbenchImportSelectedKeys = (this.wbCrossWorkbenchImportSelectedKeys || []).filter((itemKey) => itemKey !== key);
        },
        clearCrossWorkbenchImportResources() {
          this.wbCrossWorkbenchImportSelectedKeys = [];
        },
        toggleCrossWorkbenchImportTreeNodeSelection(node) {
          const mapped = this.crossWorkbenchImportTreeNodeToResource(node);
          if (!mapped || !mapped.key) return;
          const checked = this.isCrossWorkbenchImportTreeNodeChecked(node);
          if (checked) {
            this.removeCrossWorkbenchImportResource(mapped.key);
            return;
          }
          this.addCrossWorkbenchImportResource(mapped);
        },
        crossWorkbenchImportResourceByKey(key) {
          const needle = String(key || '').trim();
          if (!needle) return null;
          let hit = null;
          const walk = (node) => {
            if (!node || hit) return;
            const mapped = this.crossWorkbenchImportTreeNodeToResource(node);
            if (mapped && mapped.key === needle) {
              hit = mapped;
              return;
            }
            (node.children || []).forEach(walk);
          };
          (this.crossWorkbenchImportTreeData() || []).forEach(walk);
          return hit;
        },
        crossWorkbenchImportSelectedRows() {
          const rows = (this.wbCrossWorkbenchImportSelectedKeys || [])
            .map((key) => this.crossWorkbenchImportResourceByKey(key))
            .filter(Boolean);
          const byKey = new Map();
          rows.forEach((row) => {
            if (row && row.key && !byKey.has(row.key)) byKey.set(row.key, row);
          });
          return Array.from(byKey.values());
        },
        crossWorkbenchImportCurrentSelectableResources() {
          const q = String(this.wbCrossWorkbenchImportQuery || '').trim().toLowerCase();
          const out = [];
          const visit = (node) => {
            if (!node) return;
            const titleMatches = !q || String(node.title || '').toLowerCase().includes(q);
            if (node.isFolder) {
              if (!q || titleMatches) {
                this.crossWorkbenchImportTreeNodeLeafResources(node).forEach((item) => out.push(item));
                return;
              }
              (node.children || []).forEach(visit);
              return;
            }
            if (!q || titleMatches) {
              const mapped = this.crossWorkbenchImportTreeNodeToResource(node);
              if (mapped) out.push(mapped);
            }
          };
          (this.crossWorkbenchImportTreeData() || []).forEach(visit);
          const byKey = new Map();
          out.forEach((item) => {
            if (item && item.key && !byKey.has(item.key)) byKey.set(item.key, item);
          });
          return Array.from(byKey.values());
        },
        crossWorkbenchImportCurrentSelectedCount() {
          const keys = new Set((this.crossWorkbenchImportCurrentSelectableResources() || []).map((item) => item && item.key).filter(Boolean));
          const covered = this.crossWorkbenchImportSelectedKeySet();
          return Array.from(keys).filter((key) => covered.has(key)).length;
        },
        selectAllCrossWorkbenchImportCurrentResources() {
          (this.crossWorkbenchImportCurrentSelectableResources() || []).forEach((item) => this.addCrossWorkbenchImportResource(item));
        },
        cancelAllCrossWorkbenchImportCurrentResources() {
          const keys = new Set((this.crossWorkbenchImportCurrentSelectableResources() || []).map((item) => item && item.key).filter(Boolean));
          const keep = (this.crossWorkbenchImportSelectedRows() || []).filter((item) => {
            if (!item || !item.key) return false;
            if (keys.has(item.key)) return false;
            return !(item.coveredResourceKeys || []).some((key) => keys.has(key));
          });
          this.wbCrossWorkbenchImportSelectedKeys = keep.map((item) => item.key);
        },
        crossWorkbenchImportTargetTreeData() {
          const root = {
            title: '根目录',
            value: '',
            key: '__root__',
            selectable: true,
          };
          const folders = this.workbenchMaterialFoldersList || [];
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const sortFolders = (list) => list.slice().sort((a, b) => {
            const sa = Number(a.sort) || 0;
            const sb = Number(b.sort) || 0;
            if (sa !== sb) return sa - sb;
            return collator.compare(String(a.name || a.id || ''), String(b.name || b.id || ''));
          });
          const build = (parentId) => sortFolders(folders.filter((f) => String(f.parentId || '') === String(parentId || ''))).map((f) => {
            const children = build(f.id);
            return {
              title: String(f.name || '未命名文件夹'),
              value: String(f.id),
              key: String(f.id),
              selectable: true,
              children: children.length ? children : undefined,
            };
          });
          const children = build('');
          if (children.length) root.children = children;
          return [root];
        },
        crossWorkbenchImportSelectedDescriptors() {
          return (this.crossWorkbenchImportSelectedRows() || []).map((item) => ({
            kind: item.type,
            id: String(item.id || ''),
            title: String(item.name || '资料'),
          })).filter((item) => item.id);
        },
        crossWorkbenchImportSelectedSummary() {
          const list = this.crossWorkbenchImportSelectedDescriptors();
          const folders = list.filter((item) => item.kind === 'file-folder' || item.kind === 'result-folder').length;
          const files = list.length - folders;
          if (!list.length) return '未选择资料';
          return `已选 ${list.length} 项 · 文件 ${files} 个 · 文件夹 ${folders} 个`;
        },
        crossWorkbenchImportTargetLabel() {
          const targetId = String(this.wbCrossWorkbenchImportTargetFolderId || '');
          if (!targetId) return '根目录';
          const hit = (this.workbenchMaterialFoldersList || []).find((f) => String(f.id) === targetId);
          return (hit && String(hit.name || '').trim()) || '未命名文件夹';
        },
        crossWorkbenchImportSubmitDisabled() {
          return !this.wbCrossWorkbenchImportSourceProjectId || !this.crossWorkbenchImportSelectedDescriptors().length;
        },
        crossWorkbenchImportResolveUniqueName(baseName, parentFolderId, nextMaterials, nextFolders) {
          const raw = String(baseName || '未命名资料').trim() || '未命名资料';
          const parent = parentFolderId != null && String(parentFolderId).trim() ? String(parentFolderId).trim() : null;
          const siblingNames = new Set();
          (nextMaterials || []).forEach((row) => {
            if (String(row.parentId || '') === String(parent || '')) siblingNames.add(String(row.name || ''));
          });
          (nextFolders || []).forEach((row) => {
            if (String(row.parentId || '') === String(parent || '')) siblingNames.add(String(row.name || ''));
          });
          if (!siblingNames.has(raw)) return raw;
          const dot = raw.lastIndexOf('.');
          const hasExt = dot > 0 && dot < raw.length - 1 && raw.length - dot <= 8;
          const stem = hasExt ? raw.slice(0, dot) : raw;
          const ext = hasExt ? raw.slice(dot) : '';
          let i = 1;
          let next = `${stem} (${i})${ext}`;
          while (siblingNames.has(next)) {
            i += 1;
            next = `${stem} (${i})${ext}`;
          }
          return next;
        },
        crossWorkbenchImportCollectFileFolder(folderId, sourceFolders, sourceMaterials) {
          const fid = String(folderId || '');
          const folder = (sourceFolders || []).find((row) => String(row.id) === fid);
          if (!folder) return null;
          const children = (sourceFolders || []).filter((row) => String(row.parentId || '') === fid);
          const files = (sourceMaterials || []).filter((row) => String(row.parentId || '') === fid && String(row.status || 'done') === 'done');
          return {
            folder,
            folders: children.map((row) => this.crossWorkbenchImportCollectFileFolder(row.id, sourceFolders, sourceMaterials)).filter(Boolean),
            files,
          };
        },
        crossWorkbenchImportCollectResultFolder(folderId, sourceFolders, sourceResults) {
          const fid = String(folderId || '');
          const folder = (sourceFolders || []).find((row) => String(row.id) === fid);
          if (!folder) return null;
          const children = (sourceFolders || []).filter((row) => String(row.parentId || '') === fid);
          const files = (sourceResults || []).filter((row) => {
            const direct = String(row.resultFolderId || '') === fid;
            const linked = String(folder.linkedTaskId || '') && !String(row.resultFolderId || '').trim() && String(row.sourceTaskId || '') === String(folder.linkedTaskId || '');
            return (direct || linked) && String(row.status || 'done') === 'done';
          });
          return {
            folder,
            folders: children.map((row) => this.crossWorkbenchImportCollectResultFolder(row.id, sourceFolders, sourceResults)).filter(Boolean),
            files,
          };
        },
        submitCrossWorkbenchImport() {
          const sourcePid = String(this.wbCrossWorkbenchImportSourceProjectId || '');
          const targetPid = String(this.workbenchProjectId || '');
          if (!sourcePid || !targetPid || this.crossWorkbenchImportSubmitDisabled()) {
            message.warning('请选择要引入的资料');
            return;
          }
          const selected = this.crossWorkbenchImportSelectedDescriptors();
          const targetParent = String(this.wbCrossWorkbenchImportTargetFolderId || '').trim();
          const sourceName = (this.crossWorkbenchImportSourceMeta() || {}).name || `工作台 ${sourcePid}`;
          const targetMaterials = demoProjectMaterialsById[targetPid] || [];
          const targetFolders = demoProjectMaterialFoldersById[targetPid] || [];
          const nextMaterials = targetMaterials.slice();
          const nextFolders = targetFolders.slice();
          let importedFiles = 0;
          let importedFolders = 0;
          const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
          const sourceMaterialRows = typeof demoProjectMaterialsById !== 'undefined' ? (demoProjectMaterialsById[sourcePid] || []) : [];
          const sourceMaterialFolders = typeof demoProjectMaterialFoldersById !== 'undefined' ? (demoProjectMaterialFoldersById[sourcePid] || []) : [];
          const sourceResultRows = typeof demoProjectAnalysisResultsById !== 'undefined' ? (demoProjectAnalysisResultsById[sourcePid] || []) : [];
          const sourceResultFolders = typeof demoProjectAnalysisResultFoldersById !== 'undefined' ? (demoProjectAnalysisResultFoldersById[sourcePid] || []) : [];
          const newFolderId = () => `mf-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const newMaterialId = () => `m-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const nextSortForParent = (arr, parentId) => arr
            .filter((row) => String(row.parentId || '') === String(parentId || ''))
            .reduce((max, row) => Math.max(max, Number(row.sort) || 0), -1) + 1;
          const addMaterialCopy = (row, parentId, sourceType) => {
            if (!row) return;
            const name = this.crossWorkbenchImportResolveUniqueName(row.name || row.title, parentId, nextMaterials, nextFolders);
            const id = newMaterialId();
            nextMaterials.push({
              ...row,
              id,
              name,
              parentId: parentId || null,
              status: 'done',
              progress: 100,
              sort: nextSortForParent(nextMaterials, parentId),
              uploader: '系统引入',
              uploadedAt: now,
              importedFromWorkspace: sourceName,
              importedFromWorkspaceId: sourcePid,
              importedFromPath: String(row.name || row.title || ''),
              importedSourceType: sourceType,
              importedAt: now,
            });
            importedFiles += 1;
          };
          const addFolderCopy = (tree, parentId, sourceType) => {
            if (!tree || !tree.folder) return;
            const name = this.crossWorkbenchImportResolveUniqueName(tree.folder.name, parentId, nextMaterials, nextFolders);
            const id = newFolderId();
            nextFolders.push({
              id,
              name,
              parentId: parentId || null,
              sort: nextSortForParent(nextFolders, parentId),
              importedFromWorkspace: sourceName,
              importedFromWorkspaceId: sourcePid,
              importedSourceType: sourceType,
              importedAt: now,
            });
            importedFolders += 1;
            (tree.folders || []).forEach((child) => addFolderCopy(child, id, sourceType));
            (tree.files || []).forEach((file) => addMaterialCopy(file, id, sourceType));
          };
          selected.forEach((item) => {
            if (item.kind === 'file') {
              addMaterialCopy(sourceMaterialRows.find((row) => String(row.id) === item.id), targetParent || null, '文件');
            } else if (item.kind === 'file-folder') {
              addFolderCopy(this.crossWorkbenchImportCollectFileFolder(item.id, sourceMaterialFolders, sourceMaterialRows), targetParent || null, '文件夹');
            } else if (item.kind === 'result') {
              addMaterialCopy(sourceResultRows.find((row) => String(row.id) === item.id), targetParent || null, '结果文件');
            } else if (item.kind === 'result-folder') {
              addFolderCopy(this.crossWorkbenchImportCollectResultFolder(item.id, sourceResultFolders, sourceResultRows), targetParent || null, '结果文件夹');
            }
          });
          demoProjectMaterialsById[targetPid] = nextMaterials;
          demoProjectMaterialFoldersById[targetPid] = nextFolders;
          if (targetParent) {
            const expanded = new Set(this.workbenchFileTreeExpandedKeys || []);
            expanded.add(wbMatAntTreeKey('folder', targetParent));
            this.workbenchFileTreeExpandedKeys = Array.from(expanded);
          }
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          this.ensureResourceDrawerOpen('file');
          this.closeCrossWorkbenchImportModal();
          message.success(`已引入 ${importedFiles} 个文件${importedFolders ? `、${importedFolders} 个文件夹` : ''}`);
        },
        openWorkbenchMaterialCreateFolderModal(parentFolderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialFoldersById === 'undefined') {
            message.warning('请先进入工作台并打开审计助手后再新建文件夹');
            return;
          }
          this.wbCreateFolderForm = {
            name: '',
            parentFolderId: parentFolderId != null ? String(parentFolderId).trim() : '',
          };
          this.wbCreateFolderModalOpen = true;
        },
        closeWorkbenchMaterialCreateFolderModal() {
          this.wbCreateFolderModalOpen = false;
          this.wbCreateFolderForm = { name: '', parentFolderId: '' };
        },
        wbTaskConfigResolveResourceKind(item) {
          if (!item || typeof item !== 'object') return 'unknown';
          const t = String(item.type || '').trim().toLowerCase();
          if (t === 'file' || t === 'file-folder' || t === 'result' || t === 'result-folder' || t === 'database' || t === 'graph' || t === 'knowledge' || t === 'intent') return t;
          const k = String(item.key || '');
          if (k.startsWith('file:')) return 'file';
          if (k.startsWith('file-folder:')) return 'file-folder';
          if (k.startsWith('result:')) return 'result';
          if (k.startsWith('result-folder:')) return 'result-folder';
          if (k.startsWith('database:')) return 'database';
          if (k.startsWith('graph:')) return 'graph';
          if (k.startsWith('knowledge:')) return 'knowledge';
          if (k === 'dialog-intent' || k === 'intent') return 'intent';
          return 'unknown';
        },
        wbTaskConfigResourceTypeLabelZh(kind) {
          const map = {
            file: '文件',
            'file-folder': '文件夹',
            result: '结果',
            'result-folder': '结果文件夹',
            database: '数据库表',
            graph: '知识图谱',
            knowledge: '知识库',
            intent: '意图',
            unknown: '资料',
          };
          return map[kind] || map.unknown;
        },
        wbTaskConfigResourceDisplayTitle(item) {
          if (!item || typeof item !== 'object') return '—';
          const v = item.name || item.title || item.fileName || item.label;
          return String(v != null ? v : '').trim() || '未命名';
        },
        wbTaskConfigResourceRowSingleLine(item) {
          if (!item || typeof item !== 'object') return '—';
          const title = this.wbTaskConfigResourceDisplayTitle(item);
          const cleaned = this.wbTaskDetailStripDemoLabel(title);
          return cleaned || '未命名';
        },
        wbTaskConfigResourceRowAriaLabel(item) {
          if (!item || typeof item !== 'object') return '引用资源';
          const k = this.wbTaskConfigResolveResourceKind(item);
          const t = this.wbTaskConfigResourceRowSingleLine(item);
          const typeZh = this.wbTaskConfigResourceTypeLabelZh(k);
          return `${t}，${typeZh}`;
        },
        wbTaskConfigResourceIconMeta(item) {
          if (!item || typeof item !== 'object') return { iconClass: 'folder', iconToneClass: '' };
          if (item.iconClass) {
            const ic = String(item.iconClass).trim();
            const { faSuffixToLogical } = window.DEMO_ICON_MAP || {};
            let logical = ic;
            if (ic.startsWith('fa-')) {
              const suffix = ic.slice(3);
              logical = typeof faSuffixToLogical === 'function' ? faSuffixToLogical(suffix) : suffix;
            } else if (typeof faSuffixToLogical === 'function') {
              logical = faSuffixToLogical(ic) || ic;
            }
            return { iconClass: logical, iconToneClass: item.iconToneClass || '' };
          }
          const kind = this.wbTaskConfigResolveResourceKind(item);
          if (kind === 'file') {
            const api = window.DemoFileIcons;
            if (api && typeof api.iconFor === 'function') {
              const meta = api.iconFor(item.format || item.mimeType || item.mime, item.name || item.fileName || item.title);
              return { iconClass: meta.iconName, iconToneClass: meta.toneClass };
            }
            return { iconClass: 'file-lines', iconToneClass: '' };
          }
          if (kind === 'file-folder') return { iconClass: 'folder', iconToneClass: '' };
          if (kind === 'result') return { iconClass: 'file-text', iconToneClass: 'is-result' };
          if (kind === 'result-folder') return { iconClass: 'folder', iconToneClass: 'is-result' };
          if (kind === 'database') return { iconClass: 'table', iconToneClass: 'is-data' };
          if (kind === 'graph') return { iconClass: 'map-draw', iconToneClass: 'is-data' };
          if (kind === 'knowledge') return { iconClass: 'book', iconToneClass: '' };
          if (kind === 'intent') return { iconClass: 'bullseye', iconToneClass: 'is-primary' };
          return { iconClass: 'file', iconToneClass: '' };
        },
        wbTaskConfigResourceDetailRowsForItem(item) {
          const rows = [];
          if (!item || typeof item !== 'object') return rows;
          const kind = this.wbTaskConfigResolveResourceKind(item);
          rows.push({ label: '资源类型', value: this.wbTaskConfigResourceTypeLabelZh(kind) });
          if (item.key != null && String(item.key).trim()) rows.push({ label: '标识', value: String(item.key).trim() });
          if (item.id != null && String(item.id).trim()) rows.push({ label: 'ID', value: String(item.id).trim() });
          const title = this.wbTaskConfigResourceDisplayTitle(item);
          if (title && title !== '—') rows.push({ label: '名称', value: title });
          if (kind === 'database') {
            if (item.connectionLabel) rows.push({ label: '数据源', value: String(item.connectionLabel).trim() });
            if (item.logicalTableName) rows.push({ label: '逻辑表名', value: String(item.logicalTableName).trim() });
            if (item.tableSchema) rows.push({ label: 'Schema', value: String(item.tableSchema).trim() });
            if (item.physicalTable) rows.push({ label: '物理表', value: String(item.physicalTable).trim() });
            if (item.rowEstimate != null && String(item.rowEstimate).trim() !== '') {
              const n = Number(item.rowEstimate);
              rows.push({
                label: '行数（估算）',
                value: Number.isFinite(n) ? n.toLocaleString('zh-CN') : String(item.rowEstimate).trim(),
              });
            }
          }
          if (kind === 'unknown') rows.push({ label: '说明', value: '未标注类型时可从「创建任务」侧资源选择器获得完整类型信息。' });
          return rows;
        },
        materialBasicMetaRowsFromProjectSourceRow(r) {
          if (!r) return [];
          const statusMap = { queued: '排队中', parsing: '解析中', done: '完成', failed: '未解析' };
          const st = statusMap[r.status] || '排队中';
          const size = r.size == null || r.size === '' ? '—' : `${Number(r.size).toFixed(1)} MB`;
          return [
            { label: '名称', value: String(r.name || '').trim() || '—' },
            { label: '大小', value: size },
            { label: '格式', value: String(r.format || '').trim() || '—' },
            { label: '状态', value: st },
            { label: '上传人', value: String(r.uploader || r.uploadedBy || '').trim() || '—' },
            { label: '上传时间', value: String(r.uploadedAt || '').trim() || '—' },
            ...(r.importedFromWorkspace ? [
              { label: '来源工作台', value: String(r.importedFromWorkspace || '').trim() || '—' },
              { label: '来源路径', value: String(r.importedFromPath || r.name || '').trim() || '—' },
              { label: '来源类型', value: String(r.importedSourceType || '').trim() || '—' },
              { label: '引入时间', value: String(r.importedAt || '').trim() || '—' },
            ] : []),
          ];
        },
        /** 资料文件在当前排队列表中的排队序号（仅 queued，从 1 起） */
        workbenchMaterialQueuePosition(item) {
          if (!item || this.workbenchMaterialStatusOf(item) !== 'queued') return 0;
          const id = String(item.id || '').trim();
          const psId = item.projectSource && String(item.projectSource.id || '').trim();
          const queued = (this.workbenchRawMaterialsForTree || []).filter((m) => m && this.workbenchMaterialStatusOf(m) === 'queued');
          const idx = queued.findIndex((m) => {
            const mid = String(m && m.id || '').trim();
            const mpsId = m && m.projectSource && String(m.projectSource.id || '').trim();
            return (id && mid === id) || (psId && mpsId === psId);
          });
          return idx >= 0 ? idx + 1 : 0;
        },
        wbResolveTaskResourceMaterialVm(item) {
          if (!item || typeof item !== 'object') return null;
          const key = String(item.key != null ? item.key : '').trim();
          const mats = this.materials || [];
          const tryMatch = (k) => {
            if (!k) return null;
            for (let i = 0; i < mats.length; i++) {
              const m = mats[i];
              if (!m) continue;
              const t = m.type;
              if (t !== 'raw' && t !== undefined) continue;
              const id = String(m.id || '').trim();
              const psId = m.projectSource && String(m.projectSource.id || '').trim();
              if (id === k || psId === k) return m;
            }
            return null;
          };
          let hit = tryMatch(key);
          if (hit) return hit;
          if (key.startsWith('file:')) hit = tryMatch(key.replace(/^file:/, '').trim());
          return hit;
        },
        wbTaskResourceBuildDdlFromFieldDefinitions(item) {
          if (!item || typeof item !== 'object') return '';
          const defs = Array.isArray(item.fieldDefinitions) ? item.fieldDefinitions.filter(Boolean) : [];
          if (!defs.length) return '';
          const schema = String(item.tableSchema || '').trim();
          const table = String(item.physicalTable || item.tableName || 'DEMO_TABLE').trim();
          const qual = schema ? `"${schema}"."${table}"` : `"${table}"`;
          const cols = defs.map((f) => {
            const cn = String(f.columnName || f.name || 'COL').trim();
            const dt = String(f.dataType || f.type || 'VARCHAR(64)').trim();
            const nullableZh = String(f.nullable != null ? f.nullable : '是').trim();
            const nn = nullableZh === '否' ? ' NOT NULL' : '';
            return `  "${cn}" ${dt}${nn}`;
          }).join(',\n');
          return `CREATE TABLE ${qual} (\n${cols}\n);`;
        },
        wbTaskResourceResolveDatabasePreviewTables(item) {
          if (!item || typeof item !== 'object') return [];
          const tablesIn = Array.isArray(item.tables) ? item.tables : [];
          const normalized = tablesIn.map((t) => ({
            name: String(t.name || t.tableName || '—').trim() || '—',
            ddl: String(t.ddl || '').trim(),
          })).filter((t) => t.ddl);
          if (normalized.length) return normalized;
          const ddlDirect = String(item.ddl || '').trim();
          if (ddlDirect) {
            const nm = String(item.physicalTable || item.tableName || item.logicalTableName || item.name || '表').trim();
            const clean = nm.replace(/（演示）/g, '').replace(/\(演示\)/g, '').trim() || '表';
            return [{ name: clean, ddl: ddlDirect }];
          }
          const key = String(item.key != null ? item.key : '').trim();
          const idFromKey = key.startsWith('database:') ? key.slice('database:'.length).trim() : '';
          const list = this.dbResourceList || [];
          const row = list.find((r) => {
            const id = String(r.id || '').trim();
            return id && (id === key || id === idFromKey);
          });
          if (row && String(row.ddl || '').trim()) {
            return [{ name: String(row.tableName || row.name || '—').trim(), ddl: String(row.ddl).trim() }];
          }
          const built = this.wbTaskResourceBuildDdlFromFieldDefinitions(item);
          if (built) {
            const nm = String(item.physicalTable || item.logicalTableName || '表')
              .replace(/（演示）/g, '')
              .replace(/\(演示\)/g, '')
              .trim() || '表';
            return [{ name: nm, ddl: built }];
          }
          return [];
        },
        openWbTaskResourcePreview(item) {
          const resolved = this.wbResolveTaskResourceMaterialVm(item);
          this.wbTaskResourcePreviewItem = item;
          this.wbTaskResourcePreviewResolvedMaterial = resolved;
          this.wbTaskResourcePreviewActiveTab = 'basic';
          this.wbTaskResourcePreviewOcrLines = false;
          this.wbTaskResourcePreviewOpen = true;
        },
        wbTaskDetailStripDemoLabel(s) {
          let t = String(s == null ? '' : s).trim();
          if (!t) return t;
          t = t
            .replace(/（演示）/g, '')
            .replace(/\(演示\)/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          return t;
        },
        closeWbTaskResourcePreview() {
          this.wbTaskResourcePreviewOpen = false;
          this.wbTaskResourcePreviewItem = null;
          this.wbTaskResourcePreviewResolvedMaterial = null;
          this.wbTaskResourcePreviewActiveTab = 'basic';
          this.wbTaskResourcePreviewOcrLines = false;
        },
        downloadWbTaskResourcePreview() {
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          if (!vm || !vm.projectSource) return;
          const pages = this.wbTaskResourcePreviewDocumentPages || [];
          const body = pages.join('\n\n---\n\n');
          const base = String(vm.projectSource.name || '资料').replace(/\.[^.]+$/, '');
          const safe = base.replace(/[/\\?%*:|"<>]/g, '_');
          const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safe}-预览.txt`;
          a.click();
          URL.revokeObjectURL(url);
          message.success('已开始下载');
        },
        confirmWorkbenchMaterialCreateFolder() {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialFoldersById === 'undefined') {
            this.closeWorkbenchMaterialCreateFolderModal();
            return;
          }
          const folds = demoProjectMaterialFoldersById[pid] || [];
          const name = String((this.wbCreateFolderForm && this.wbCreateFolderForm.name) || '').trim();
          if (!name) {
            message.warning('名称不能为空');
            return;
          }
          const parentFolderId = this.wbCreateFolderForm && this.wbCreateFolderForm.parentFolderId != null
            ? String(this.wbCreateFolderForm.parentFolderId).trim()
            : '';
          const siblings = folds.filter((f) => String(f.parentId || '') === parentFolderId);
          const nextSort = siblings.reduce((acc, f) => Math.max(acc, Number(f.sort) || 0), -1) + 1;
          const newFolderId = this.wbMatNewFolderId();
          folds.push({
            id: newFolderId,
            name,
            parentId: parentFolderId,
            sort: nextSort,
          });
          if (parentFolderId) {
            const expanded = new Set(this.workbenchFileTreeExpandedKeys || []);
            expanded.add(wbMatAntTreeKey('folder', parentFolderId));
            this.workbenchFileTreeExpandedKeys = Array.from(expanded);
          }
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          this.closeWorkbenchMaterialCreateFolderModal();
          message.success('已新建文件夹');
        },
        wbMaterialVmById(materialId) {
          const id = materialId != null ? String(materialId) : '';
          if (!id) return null;
          return (this.materials || []).find((m) => m && String(m.id) === id) || null;
        },
        wbMaterialFileTreeSlotNodeData(node) {
          if (!node) return null;
          const direct = node.dataRef || node;
          if (direct && direct.materialId) return direct;
          const rawKey = direct && (direct.key != null ? direct.key : direct.eventKey != null ? direct.eventKey : '');
          const key = String(rawKey || '');
          if (!key.startsWith('raw:')) return direct;
          const materialId = key.slice('raw:'.length);
          const row = (this.workbenchDoneProjectRowsForFileTree || []).find((r) => String(r.id) === materialId) || null;
          return {
            materialId,
            rawProjectRow: row,
          };
        },
        wbWorkbenchMaterialVmForTreeFile(d) {
          if (!d) return null;
          const vm = this.wbMaterialVmById(d.materialId);
          if (vm) return vm;
          const r = d.rawProjectRow;
          if (!r) return { type: 'raw', id: d.materialId, projectSource: {} };
          const fmt = String(r.format || '').toUpperCase();
          const rawSubtype = fmt === 'XLSX' || fmt === 'XLS' || fmt === 'CSV' ? 'table' : 'document';
          return {
            type: 'raw',
            id: String(r.id),
            title: r.name,
            rawSubtype,
            format: r.format,
            projectSource: r,
          };
        },
        wbMatNewFolderId() {
          return typeof newSkillId === 'function' ? newSkillId('mf') : `mf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        },
        collectWorkbenchMaterialFolderSubtreeIds(rootFolderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialFoldersById === 'undefined') return new Set();
          const folds = demoProjectMaterialFoldersById[pid] || [];
          const root = String(rootFolderId || '');
          if (!root) return new Set();
          const out = new Set([root]);
          let added = true;
          while (added) {
            added = false;
            folds.forEach((f) => {
              const id = String(f.id || '');
              const p = f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
              if (!id || out.has(id)) return;
              if (p && out.has(p)) {
                out.add(id);
                added = true;
              }
            });
          }
          return out;
        },
        collectDoneRawProjectRowsInMaterialFolder(folderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined' || !folderId) return [];
          const folderIds = this.collectWorkbenchMaterialFolderSubtreeIds(folderId);
          const mats = demoProjectMaterialsById[pid] || [];
          return mats.filter((r) => {
            if (String(r.status || '') !== 'done') return false;
            const p = r.parentId != null && r.parentId !== '' ? String(r.parentId) : '';
            return folderIds.has(p);
          });
        },
        onWorkbenchMaterialFileTreeDrop(info) {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          if (this.applyWorkbenchBulkTreeDrop && this.applyWorkbenchBulkTreeDrop('resource', info)) return;
          const res = applyWorkbenchMaterialTreeDrop(pid, info);
          if (!res.ok) {
            if (res.message) message.warning(res.message);
            return;
          }
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          message.success('已更新目录顺序');
        },
        onWorkbenchMaterialFolderRowClick(d) {
          if (!d || !d.folderId) return;
          const key = d.key != null ? String(d.key) : wbMatAntTreeKey('folder', d.folderId);
          const expanded = new Set(this.workbenchFileTreeExpandedKeys || []);
          if (expanded.has(key)) expanded.delete(key);
          else expanded.add(key);
          this.workbenchFileTreeExpandedKeys = Array.from(expanded);
        },
        onWorkbenchMaterialFolderMenu(key, d) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialFoldersById === 'undefined' || !d || !d.folderId) return;
          const folds = demoProjectMaterialFoldersById[pid];
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkMaterialFolderDescriptor(d));
            return;
          }
          if (key === 'upload-file' || key === 'cross-workbench-import' || key === 'new-folder') {
            this.onWorkbenchMaterialAddMenu(key, d.folderId);
            return;
          }
          if (key === 'ref') {
            this.toggleWorkbenchMaterialFolderInChat(d);
            return;
          }
          if (key === 'rename') {
            const row = folds.find((f) => String(f.id) === String(d.folderId));
            if (!row) return;
            const name = window.prompt('重命名文件夹', row.name || '');
            if (name == null) return;
            const trimmed = String(name).trim();
            if (!trimmed) {
              message.warning('名称不能为空');
              return;
            }
            const idx = folds.findIndex((f) => String(f.id) === String(d.folderId));
            if (idx >= 0) folds.splice(idx, 1, { ...folds[idx], name: trimmed });
            this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
            message.success('已重命名');
            return;
          }
          if (key === 'delete') {
            const row = folds.find((f) => String(f.id) === String(d.folderId));
            this.wbDeleteFolderTarget = { folderId: String(d.folderId), name: (row && row.name) || d.title || '文件夹' };
            this.wbDeleteFolderModalOpen = true;
          }
        },
        openWorkbenchFileTreeRawDetail(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.openDetailFromTreeTitle({ id: m.id, raw: m }, 'material');
        },
        onWorkbenchFileTreeRawToggleRef(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.handleTreeContextMenu('ref', { id: m.id, raw: m }, 'material');
        }
  };
})();
