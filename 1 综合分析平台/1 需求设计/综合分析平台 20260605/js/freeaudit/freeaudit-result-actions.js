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

  NS.actionGroups = NS.actionGroups || {};
  NS.actionGroups.resultActions = {
        analysisResultStatusLabel(status) {
          const map = { queued: '排队中', parsing: '执行中', done: '成功', failed: '失败' };
          return map[status] || map.done;
        },
        analysisStatusChipClass(status) {
          const s = (status && String(status)) || 'done';
          const map = { queued: 'is-neutral', parsing: 'is-primary', done: 'is-success', failed: 'is-error' };
          return map[s] || map.done;
        },
        toggleWorkbenchAnalysisSearchPanel() {
          this.workbenchAnalysisSearchOpen = !this.workbenchAnalysisSearchOpen;
          if (!this.workbenchAnalysisSearchOpen) this.workbenchAnalysisSearchQuery = '';
        },
        setWorkbenchAnalysisResultSortMode(mode) {
          const next = ['name', 'created_desc', 'created_asc'].includes(String(mode || '')) ? String(mode) : 'name';
          this.workbenchAnalysisResultSortMode = next;
        },
        workbenchAnalysisTaskProgressPercent(m) {
          if (!m) return 0;
          if (this.isWorkbenchBatchParentTask(m)) return this.workbenchBatchProgressPercent(m);
          const p = Number((m.projectSource && m.projectSource.progress) ?? m.progress ?? 0);
          if (Number.isNaN(p)) return 0;
          return Math.max(0, Math.min(100, p));
        },
        analysisResultBasicMetaRowsFromRecord(r) {
          if (!r) return [];
          const statusMap = { queued: '排队中', parsing: '执行中', done: '成功', failed: '失败' };
          const st = statusMap[r.status] || statusMap.done;
          return [
            { label: '名称', value: String(r.name || '').trim() || '—' },
            { label: '格式', value: String(r.format || 'MD').toUpperCase() },
            { label: '来源技能', value: String(r.sourceSkillName || '').trim() || '—' },
            { label: '状态', value: st },
            { label: '生成时间', value: String(r.createdAt || '').trim() || '—' },
          ];
        },
        collectDoneAnalysisMaterialsInResultFolder(d) {
          const fid = d && d.userFolderId ? String(d.userFolderId) : '';
          const pid = this.workbenchProjectId;
          if (!fid || !pid || typeof demoProjectAnalysisResultFoldersById === 'undefined') return [];
          const folds = demoProjectAnalysisResultFoldersById[pid] || [];
          const folderMeta = folds.find((f) => String(f.id) === fid);
          const ltid = folderMeta ? String(folderMeta.linkedTaskId || '').trim() : '';
          const subtreeIds = this.collectWorkbenchAnalysisResultFolderSubtreeIds(fid, folds);
          const list = this.workbenchDoneSortedAnalysisMaterialsForResultPanel || [];
          return list.filter((m) => {
            const ps = m.projectSource || {};
            const rid = String(ps.resultFolderId || '').trim();
            if (rid && subtreeIds.has(rid)) return true;
            if (ltid && !rid && String(ps.sourceTaskId || '').trim() === ltid) return true;
            return false;
          });
        },
        onWorkbenchAnalysisResultTreeDrop(info) {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          if (this.applyWorkbenchBulkTreeDrop && this.applyWorkbenchBulkTreeDrop('result', info)) return;
          if (info && info.dropToGap === true) {
            message.info('结果排序由当前排序规则控制，可拖入文件夹调整层级');
            return;
          }
          const res = applyWorkbenchAnalysisResultTreeDrop(pid, info);
          if (!res.ok) {
            if (res.message) message.warning(res.message);
            return;
          }
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          message.success('已更新结果树顺序');
        },
        onWorkbenchFileTreeFolderContextMenu(key, d) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkMaterialFolderDescriptor(d));
            return;
          }
          if (key === 'ref') {
            this.toggleWorkbenchMaterialFolderInChat(d);
            return;
          }
          if (key === 'upload-file' || key === 'cross-workbench-import' || key === 'new-folder') {
            this.onWorkbenchMaterialAddMenu(key, d && d.folderId);
            return;
          }
          this.onWorkbenchMaterialFolderMenu(key, d);
        },
        onWorkbenchMaterialStatusListContextMenu(key, raw) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkStatusNodeDescriptor({ id: raw && raw.id, raw }, 'material'));
            return;
          }
          this.handleWorkbenchMaterialAction(key, raw);
        },
        confirmDeleteWorkbenchMaterialFolder() {
          const pid = this.workbenchProjectId;
          const t = this.wbDeleteFolderTarget;
          if (!pid || !t || !t.folderId || typeof demoProjectMaterialFoldersById === 'undefined') {
            this.wbDeleteFolderModalOpen = false;
            this.wbDeleteFolderTarget = null;
            return;
          }
          const delIds = this.collectWorkbenchMaterialFolderSubtreeIds(t.folderId);
          const mats = demoProjectMaterialsById[pid] || [];
          for (let i = mats.length - 1; i >= 0; i--) {
            const p = mats[i].parentId != null && mats[i].parentId !== '' ? String(mats[i].parentId) : '';
            if (p && delIds.has(p)) mats.splice(i, 1);
          }
          const folds = demoProjectMaterialFoldersById[pid] || [];
          demoProjectMaterialFoldersById[pid] = folds.filter((f) => !delIds.has(String(f.id)));
          this.wbDeleteFolderModalOpen = false;
          this.wbDeleteFolderTarget = null;
          this.refreshWorkbenchDemoResources('material');
          message.success('已删除文件夹及下属内容');
        },
        isWorkbenchFileTreeRawSelected(d) {
          const st = this.selectedTreeNode;
          return !!(st && st.source === 'material' && d && d.materialId && String(st.id) === String(d.materialId));
        },
        onWorkbenchMaterialFileTreeRawClick(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.selectTreeNode({ id: m.id, raw: m }, 'material');
        },
        ensureWorkbenchAnalysisResultTaskFolders() {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultFoldersById === 'undefined') return;
          if (!Array.isArray(demoProjectAnalysisResultFoldersById[pid])) demoProjectAnalysisResultFoldersById[pid] = [];
          const folds = demoProjectAnalysisResultFoldersById[pid];
          const tasks = this.workbenchCompletedTasksForResultTree || [];
          const rootFolds = folds.filter((f) => {
            const p = f.parentId != null && f.parentId !== '' ? String(f.parentId) : '';
            const pt = String(f.parentTaskId || '').trim();
            return !p && !pt;
          });
          let added = false;
          tasks.forEach((t) => {
            if (!t || !t.id) return;
            const tid = String(t.id);
            if (folds.some((f) => String(f.linkedTaskId || '') === tid)) return;
            const title = String(t.folderTitle || tid).trim() || tid;
            const maxSort = rootFolds.reduce((acc, f) => Math.max(acc, Number(f.sort) || 0), -1);
            folds.push({
              id: `arf-tr-${tid}-${Date.now().toString(36)}`,
              name: title,
              parentId: null,
              sort: maxSort + 1,
              linkedTaskId: tid,
            });
            added = true;
          });
          if (added) this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          this.syncTaskOutputsIntoLinkedResultFolders();
        },
        syncTaskOutputsIntoLinkedResultFolders() {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultsById === 'undefined' || typeof demoProjectAnalysisResultFoldersById === 'undefined') return;
          const rows = demoProjectAnalysisResultsById[pid] || [];
          const folds = demoProjectAnalysisResultFoldersById[pid] || [];
          let changed = false;
          folds.forEach((f) => {
            const tid = String(f.linkedTaskId || '').trim();
            if (!tid) return;
            const fid = String(f.id);
            for (let i = rows.length - 1; i >= 0; i--) {
              const r = rows[i];
              if (String(r.sourceTaskId || '') !== tid) continue;
              if (String(r.status || '') !== 'done') continue;
              if (String(r.resultFolderId || '').trim()) continue;
              const maxSort = Math.max(
                -1,
                ...rows.filter((x) => String(x.resultFolderId || '') === fid).map((x) => Number(x.sort) || 0),
                ...folds.filter((x) => String(x.parentId || '') === fid).map((x) => Number(x.sort) || 0),
              );
              rows.splice(i, 1, { ...r, resultFolderId: fid, sort: maxSort + 1 });
              changed = true;
            }
          });
          if (changed) this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
        },
        openWorkbenchAnalysisResultCreateFolderModal(spec) {
          let s = spec;
          if (spec == null || spec === '') s = { type: 'root' };
          else if (typeof spec === 'string') s = { type: 'underFolder', folderId: String(spec) };
          else if (typeof spec === 'object' && spec.type) s = { ...spec };
          else s = { type: 'root' };
          this.wbArResultCreateFolderSpec = s;
          this.wbArResultCreateFolderName = '';
          this.wbArResultCreateFolderModalOpen = true;
        },
        closeWorkbenchAnalysisResultCreateFolderModal() {
          this.wbArResultCreateFolderModalOpen = false;
          this.wbArResultCreateFolderName = '';
          this.wbArResultCreateFolderSpec = null;
        },
        openWorkbenchAnalysisResultCreateFolderForNode(d) {
          if (!d || !d.isFolder) return;
          if (d.userFolderId) {
            this.openWorkbenchAnalysisResultCreateFolderModal({ type: 'underFolder', folderId: String(d.userFolderId) });
          }
        },
        onWorkbenchAnalysisResultAnyFolderMenu(key, d) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkResultFolderDescriptor(d));
            return;
          }
          if (key === 'ref') {
            this.toggleWorkbenchAnalysisResultFolderInChat(d);
            return;
          }
          if (key === 'download-folder-package' || key === 'download-folder-zip-keep' || key === 'download-folder-zip-flat') {
            const mode = key === 'download-folder-zip-flat' ? 'flat' : 'keep';
            this.openWorkbenchPackageDownloadModalFromFolder(d, mode);
            return;
          }
          if (key === 'new-folder') {
            this.openWorkbenchAnalysisResultCreateFolderForNode(d);
            return;
          }
          if (d && d.userFolderId) {
            this.onWorkbenchAnalysisResultUserFolderMenu(key, d);
          }
        },
        downloadWorkbenchAnalysisResultFolderZip(d, mode) {
          this.openWorkbenchPackageDownloadModalFromFolder(d, mode);
        },
        isWorkbenchPackageDownloadTask(task) {
          const tc = (task && task.taskConfig) || {};
          return String((task && task.taskType) || tc.taskType || '') === 'download-package';
        },
        workbenchPackageTaskCanDownload(task) {
          return !!(this.isWorkbenchPackageDownloadTask(task) && this.workbenchAnalysisStatusOf(task) === 'done');
        },
        workbenchPackageTaskArtifactLabel(task) {
          const meta = (task && task.packageMeta) || (task && task.taskConfig && task.taskConfig.packageMeta) || {};
          const name = String((task && task.title) || (task && task.projectSource && task.projectSource.name) || '打包下载任务').trim() || '打包下载任务';
          const format = meta.formatMode === 'pdf' ? 'MD 转 PDF' : '原始格式';
          return `${name}.zip · ${format}`;
        },
        downloadWorkbenchPackageTask(task) {
          if (!this.workbenchPackageTaskCanDownload(task)) return;
          message.success(`已开始下载：${this.workbenchPackageTaskArtifactLabel(task)}`);
        },
        packageDateStamp() {
          const d = new Date();
          const pad = (n) => String(n).padStart(2, '0');
          return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
        makeWorkbenchPackageTaskName() {
          return `结果打包下载-${this.packageDateStamp()}`;
        },
        openWorkbenchPackageDownloadModalFromFolder(d, structureMode) {
          const desc = this.workbenchBulkResultFolderDescriptor(d);
          if (!desc) return;
          this.openWorkbenchPackageDownloadModal({
            items: [desc],
            structureMode: structureMode === 'flat' ? 'flat' : 'keep',
          });
        },
        openWorkbenchPackageDownloadModalFromBulk(items) {
          this.openWorkbenchPackageDownloadModal({ items });
        },
        openWorkbenchPackageDownloadModal(payload) {
          const items = Array.isArray(payload && payload.items) ? payload.items.filter(Boolean) : [];
          if (!items.length) {
            message.warning('请先选择要打包的结果');
            return;
          }
          const unique = [];
          const seen = new Set();
          items.forEach((item) => {
            const key = String(item && item.key || '');
            if (!key || seen.has(key)) return;
            seen.add(key);
            unique.push(item);
          });
          this.wbPackageDownloadTarget = { items: unique };
          this.wbPackageDownloadForm = {
            taskName: this.makeWorkbenchPackageTaskName(),
            structureMode: payload && payload.structureMode === 'flat' ? 'flat' : 'keep',
            formatMode: 'raw',
          };
          this.wbPackageDownloadModalOpen = true;
        },
        closeWorkbenchPackageDownloadModal() {
          this.wbPackageDownloadModalOpen = false;
          this.wbPackageDownloadTarget = null;
          this.wbPackageDownloadForm = {
            taskName: '',
            structureMode: 'keep',
            formatMode: 'raw',
          };
        },
        workbenchPackageDownloadTargetItems() {
          return (this.wbPackageDownloadTarget && this.wbPackageDownloadTarget.items) || [];
        },
        workbenchPackagePreviewTitleFromNode(node) {
          if (!node) return '未命名';
          if (node.isFolder) return String(node.title || node.name || '结果文件夹').trim() || '结果文件夹';
          const m = this.wbMaterialVmById(node.materialId);
          return String((m && (m.title || m.name)) || node.title || '未命名结果').trim() || '未命名结果';
        },
        workbenchPackagePreviewRowsFromTreeNode(node, depth) {
          if (!node) return [];
          const rows = [{
            key: String(node.key || node.userFolderId || node.materialId || this.workbenchPackagePreviewTitleFromNode(node)),
            kind: node.isFolder ? 'folder' : 'file',
            title: this.workbenchPackagePreviewTitleFromNode(node),
            depth: Math.max(0, Number(depth) || 0),
          }];
          (node.children || []).forEach((child) => {
            rows.push(...this.workbenchPackagePreviewRowsFromTreeNode(child, rows[0].depth + 1));
          });
          return rows;
        },
        workbenchPackageDownloadPreviewRows() {
          const items = this.workbenchPackageDownloadTargetItems();
          const selected = new Set(items.map((item) => String(item && item.key || '')).filter(Boolean));
          const topItems = items.filter((item) => {
            if (!item || !item.key) return false;
            const ancestors = this.workbenchBulkAncestorFolderKeys(item) || [];
            return !ancestors.some((key) => selected.has(String(key)));
          });
          const rows = [];
          const seen = new Set();
          topItems.forEach((item) => {
            let next = [];
            if (item.kind === 'result-folder') {
              const id = String(item.raw && item.raw.userFolderId || '').trim();
              const node = this.findWorkbenchBulkResultFolderNode(id) || item.raw;
              next = this.workbenchPackagePreviewRowsFromTreeNode(node, 0);
            } else if (item.kind === 'result-material') {
              const m = item.raw || {};
              next = [{
                key: String(item.key),
                kind: 'file',
                title: String(m.title || m.name || '未命名结果').trim() || '未命名结果',
                depth: 0,
              }];
            }
            next.forEach((row) => {
              const key = `${row.kind}:${row.key}:${row.depth}`;
              if (seen.has(key)) return;
              seen.add(key);
              rows.push(row);
            });
          });
          return rows;
        },
        workbenchPackageDownloadScope() {
          const items = this.workbenchPackageDownloadTargetItems();
          const rows = this.workbenchPackageDownloadPreviewRows();
          const fileCount = rows.filter((row) => row.kind === 'file').length;
          const folderCount = rows.filter((row) => row.kind === 'folder').length;
          return {
            total: items.length,
            fileCount,
            folderCount,
          };
        },
        workbenchPackageDownloadScopeText() {
          const s = this.workbenchPackageDownloadScope();
          return `已选 ${s.total} 项 · 结果文件 ${s.fileCount} 个 · 文件夹 ${s.folderCount} 个`;
        },
        scheduleWorkbenchPackageTask(task) {
          if (!task) return;
          this.clearBatchChildRerunTimers(task);
          this.setWorkbenchTaskStatus(task, 'queued');
          task.projectSource = task.projectSource || {};
          task.projectSource.progress = 0;
          const timers = [];
          timers.push(window.setTimeout(() => {
            const t = this.resolveCreatedWorkbenchTaskRef(task);
            if (!t || this.workbenchAnalysisStatusOf(t) !== 'queued') return;
            this.setWorkbenchTaskStatus(t, 'parsing');
            t.projectSource.progress = 45;
          }, 700));
          timers.push(window.setTimeout(() => {
            const t = this.resolveCreatedWorkbenchTaskRef(task);
            if (!t || this.workbenchAnalysisStatusOf(t) !== 'parsing') return;
            this.setWorkbenchTaskStatus(t, 'done');
            t.projectSource.progress = 100;
            t.projectSource.completedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
            t.packageMeta = { ...(t.packageMeta || {}), ready: true };
            message.success('打包下载任务已完成，可在任务列表下载');
          }, 2200));
          task._wbRerunTimers = timers;
        },
        submitWorkbenchPackageDownloadTask() {
          const form = this.wbPackageDownloadForm || {};
          const taskName = String(form.taskName || '').trim();
          if (!taskName) {
            message.warning('请输入任务名称');
            return;
          }
          const scope = this.workbenchPackageDownloadScope();
          if (!scope.total) {
            message.warning('请先选择要打包的结果');
            return;
          }
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const taskId = 'wb-task-package-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const packageMeta = {
            scope,
            structureMode: form.structureMode === 'flat' ? 'flat' : 'keep',
            formatMode: form.formatMode === 'pdf' ? 'pdf' : 'raw',
            previewRows: this.workbenchPackageDownloadPreviewRows().map((row) => ({
              key: row.key,
              kind: row.kind,
              title: row.title,
              depth: row.depth,
            })),
            items: this.workbenchPackageDownloadTargetItems().map((item) => ({
              key: item.key,
              kind: item.kind,
              title: String((item.raw && (item.raw.title || item.raw.name)) || (item.raw && item.raw.title) || '未命名').trim() || '未命名',
            })),
            expireDays: 30,
          };
          const created = {
            id: taskId,
            type: 'analysis',
            title: taskName,
            taskType: 'download-package',
            status: 'queued',
            packageMeta,
            projectSource: {
              status: 'queued',
              createdAt: now,
              sourceSkillName: '文件打包',
              name: taskName,
            },
            taskConfig: {
              taskType: 'download-package',
              packageMeta,
            },
          };
          this.workbenchCreatedTasks = [created, ...(this.workbenchCreatedTasks || [])];
          this.closeWorkbenchPackageDownloadModal();
          this.resetWorkbenchBulkSelection('result');
          this.scheduleWorkbenchPackageTask(created);
          message.success('已创建打包任务，可在任务列表查看进度');
        },
        confirmWorkbenchAnalysisResultCreateFolder() {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultFoldersById === 'undefined') return;
          const trimmed = String(this.wbArResultCreateFolderName || '').trim();
          if (!trimmed) {
            message.warning('名称不能为空');
            return;
          }
          if (!Array.isArray(demoProjectAnalysisResultFoldersById[pid])) demoProjectAnalysisResultFoldersById[pid] = [];
          const folds = demoProjectAnalysisResultFoldersById[pid];
          const sp = this.wbArResultCreateFolderSpec || { type: 'root' };
          const pnorm = (v) => (v === undefined || v === null || v === '' ? '' : String(v));
          const matchesSibling = (f) => {
            const p = pnorm(f.parentId);
            const pt = String((f && f.parentTaskId) || '').trim();
            if (sp.type === 'underFolder') {
              return p === String(sp.folderId || '');
            }
            return !p && !pt;
          };
          const maxSort = folds.filter(matchesSibling).reduce((acc, f) => Math.max(acc, Number(f.sort) || 0), -1);
          const row = {
            id: 'arf-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
            name: trimmed,
            parentId: sp.type === 'underFolder' ? String(sp.folderId) : null,
            sort: maxSort + 1,
          };
          folds.push(row);
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          message.success(sp.type === 'underFolder' ? '已创建子文件夹' : '已创建文件夹');
          this.closeWorkbenchAnalysisResultCreateFolderModal();
        },
        buildWorkbenchTaskDialogTurnsSnapshot(m) {
          const tcEarly = m && m.taskConfig;
          if (tcEarly && tcEarly.taskType === 'generate-skill') {
            return this.buildGenerateSkillTaskDialogTurnsSnapshot(m);
          }
          const skill = (m.taskConfig && m.taskConfig.skillName) || (m.projectSource && m.projectSource.sourceSkillName) || '技能';
          const title = String(m.title || '任务').trim() || '任务';
          const st = this.workbenchAnalysisStatusOf(m);
          const resources = (m.taskConfig && m.taskConfig.resources) || [];
          const resNames = resources.map((r) => String(r.name || r.key || '引用资料').trim()).filter(Boolean);
          const resLine = resNames.length
            ? `引用资源（${resNames.length}）：${resNames.slice(0, 3).join('、')}${resNames.length > 3 ? ' 等' : ''}`
            : '未在任务中配置引用资源';
          const idBase = String(m.id || 'task');
          const turns = [];
          turns.push({
            id: `${idBase}-u1`,
            role: 'user',
            text: `请使用「${skill}」完成本任务分析。\n\n约束：\n· 输出为可审计的 Markdown，关键结论需能在正文中点回资料段落。\n· ${resLine}`,
          });
          if (st === 'queued') {
            turns.push({
              id: `${idBase}-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `已将任务「${title}」绑定到面板上下文，等待调度。` },
                { type: 'text', body: resLine },
                { type: 'action', label: '等待调度：任务在队列中，未占用执行槽位', status: 'running' },
              ],
            });
            turns.push({
              id: `${idBase}-b1`,
              role: 'bot',
              text: '任务已进入队列；资源与规则包校验将在分配执行槽后自动开始。',
            });
            return turns;
          }
          if (st === 'parsing') {
            turns.push({
              id: `${idBase}-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `已将任务「${title}」绑定到面板上下文，准备执行技能沙箱。` },
                { type: 'text', body: resLine },
                { type: 'action', label: `调用技能「${skill}」并装载规则模板`, status: 'ok' },
                { type: 'action', label: '规则校验：词条白名单 + 口径表加载', status: 'ok' },
                { type: 'action', label: '抽取段落候选并写入中间索引', status: 'running' },
              ],
            });
            turns.push({
              id: `${idBase}-b1`,
              role: 'bot',
              text: '已开始执行：助手正在抽取与对齐字段，完成后将把 Markdown 结果挂到右侧「结果」中与任务同名的文件夹。',
            });
            return turns;
          }
          if (st === 'failed') {
            turns.push({
              id: `${idBase}-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `已将任务「${title}」绑定到面板上下文，准备执行技能沙箱。` },
                { type: 'text', body: resLine },
                { type: 'action', label: `调用技能「${skill}」并装载规则模板`, status: 'ok' },
                { type: 'action', label: '规则校验：词条白名单 + 口径表加载', status: 'ok' },
                { type: 'action', label: '抽取段落候选并写入中间索引', status: 'ok' },
                { type: 'action', label: '核对金额口径与合同条款对齐', status: 'fail' },
              ],
            });
            turns.push({
              id: `${idBase}-b1`,
              role: 'bot',
              text: '执行失败：在金额口径对齐步骤出现异常退出。建议检查引用资料的时间范围与字段单位后重跑。',
            });
            return turns;
          }
          const readActions = resNames.slice(0, 2).map((nm) => ({
            type: 'action',
            label: `阅读《${nm}》并定位关键字段`,
            status: 'ok',
          }));
          turns.push({
            id: `${idBase}-think`,
            role: 'thinking',
            toolCalls: [
              { type: 'text', body: `已将任务「${title}」绑定到面板上下文，准备执行技能沙箱。` },
              { type: 'text', body: resLine },
              { type: 'action', label: `调用技能「${skill}」并装载规则模板`, status: 'ok' },
              ...readActions,
              { type: 'action', label: '生成结论段落与差异表（中间 Markdown）', status: 'ok' },
              { type: 'action', label: '同步结果到工作台结果树', status: 'ok' },
            ],
          });
          turns.push({
            id: `${idBase}-b1`,
            role: 'bot',
            text: `分析已完成。主要结论与证据链已写入当前任务的 Markdown 结果，可在右侧「结果」中打开「${title}」文件夹查看与历史版本。`,
          });
          turns.push({
            id: `${idBase}-u2`,
            role: 'user',
            text: '请把「异常金额」相关的三处证据按条款号排序，并补一句口径说明。',
          });
          turns.push({
            id: `${idBase}-b2`,
            role: 'bot',
            text: '已在结果稿中追加异常段落重排与口径脚注，可在右侧预览中查看最新稿。',
          });
          return turns;
        },
        onWorkbenchAnalysisResultFolderRowClick(d) {
          if (!d || d.key == null) return;
          const key = String(d.key);
          const expanded = new Set(this.workbenchAnalysisResultTreeExpandedKeys || []);
          if (expanded.has(key)) expanded.delete(key);
          else expanded.add(key);
          this.workbenchAnalysisResultTreeExpandedKeys = Array.from(expanded);
        },
        isWorkbenchAnalysisResultTreeLeafSelected(d) {
          const st = this.selectedTreeNode;
          return !!(st && st.source === 'analysis' && d && d.materialId && String(st.id) === String(d.materialId));
        },
        onWorkbenchAnalysisResultTreeLeafClick(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.selectTreeNode({ id: m.id, raw: m }, 'analysis');
        },
        openWorkbenchAnalysisResultTreeLeafDetail(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.openDetailFromTreeTitle({ id: m.id, raw: m }, 'analysis');
        },
        collectWorkbenchAnalysisResultFolderSubtreeIds(rootFolderId, folderList) {
          const list = Array.isArray(folderList) ? folderList : [];
          const root = String(rootFolderId || '');
          if (!root) return new Set();
          const out = new Set([root]);
          let added = true;
          while (added) {
            added = false;
            list.forEach((f) => {
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
        onWorkbenchAnalysisResultUserFolderMenu(key, d) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultFoldersById === 'undefined' || !d || !d.userFolderId) return;
          const folds = demoProjectAnalysisResultFoldersById[pid] || [];
          const fid = String(d.userFolderId);
          if (key === 'rename') {
            const row = folds.find((f) => String(f.id) === fid);
            if (!row) return;
            const name = window.prompt('重命名文件夹', row.name || '');
            if (name == null) return;
            const trimmed = String(name).trim();
            if (!trimmed) {
              message.warning('名称不能为空');
              return;
            }
            const idx = folds.findIndex((f) => String(f.id) === fid);
            if (idx >= 0) folds.splice(idx, 1, { ...folds[idx], name: trimmed });
            this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
            message.success('已重命名');
            return;
          }
          if (key === 'delete') {
            this.confirmDeleteWorkbenchAnalysisResultFolder(fid);
          }
        },
        onWorkbenchAnalysisResultUserFolderContextMenu(key, d) {
          this.onWorkbenchAnalysisResultAnyFolderMenu(key, d);
        },
        confirmDeleteWorkbenchAnalysisResultFolder(folderId) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultFoldersById === 'undefined' || !folderId) return;
          const folds = demoProjectAnalysisResultFoldersById[pid] || [];
          const row = folds.find((f) => String(f.id) === String(folderId));
          const folderName = String((row && row.name) || '文件夹').trim() || '文件夹';
          window.dsConfirm.delete({
            title: `删除「${folderName}」？`,
            kind: 'folder',
            syncScope: `文件夹「${folderName}」及其子文件夹`,
            onOk: () => {
              const delIds = this.collectWorkbenchAnalysisResultFolderSubtreeIds(folderId, folds);
              const mats = this.materials || [];
              mats.forEach((m) => {
                if (!m || m.type !== 'analysis') return;
                const ps = m.projectSource || {};
                const rid = String(ps.resultFolderId || '');
                if (rid && delIds.has(rid)) {
                  const nextPs = { ...ps, resultFolderId: null };
                  m.projectSource = nextPs;
                  const j = (demoProjectAnalysisResultsById[pid] || []).findIndex((r) => String(r.id) === String(m.id));
                  if (j >= 0) {
                    const r0 = demoProjectAnalysisResultsById[pid][j];
                    demoProjectAnalysisResultsById[pid].splice(j, 1, { ...r0, resultFolderId: null });
                  }
                }
              });
              demoProjectAnalysisResultFoldersById[pid] = folds.filter((f) => !delIds.has(String(f.id)));
              this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
              message.success('已删除文件夹');
            },
          });
        },
        resolveDemoWorkbenchTaskRef(m) {
          if (!m || !m.id) return null;
          const id = String(m.id);
          const rows = this.workbenchTaskDemoRows || [];
          for (let i = 0; i < rows.length; i += 1) {
            const row = rows[i];
            if (!row) continue;
            if (String(row.id) === id) return row;
            const children = row.children || [];
            for (let j = 0; j < children.length; j += 1) {
              if (children[j] && String(children[j].id) === id) return children[j];
            }
          }
          return null;
        },
        resolveCreatedWorkbenchTaskRef(m) {
          if (!m || !m.id) return null;
          const id = String(m.id);
          for (let i = 0; i < (this.workbenchCreatedTasks || []).length; i += 1) {
            const row = this.workbenchCreatedTasks[i];
            if (!row) continue;
            if (String(row.id) === id) return row;
            const children = row.children || [];
            for (let j = 0; j < children.length; j += 1) {
              if (children[j] && String(children[j].id) === id) return children[j];
            }
          }
          return null;
        },
        handleBatchChildContextMenu(key, child) {
          if (!child) return;
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkBatchChildDescriptor(child));
            return;
          }
          if (key === 'abort-task') {
            if (!this.batchChildCanAbort(child)) return;
            this.workbenchTaskRowAbort(child);
          } else if (key === 'rerun-task') {
            if (!this.batchChildCanRerun(child)) return;
            this.workbenchTaskRowRerun(child);
          } else if (key === 'delete') {
            if (!this.batchChildCanDelete(child)) return;
            const parent = this.wbActiveBatchParentTask;
            if (!parent || !Array.isArray(parent.children)) return;
            window.dsConfirm.delete({
              title: '删除子任务？',
              kind: 'task',
              onOk: () => {
                parent.children = parent.children.filter((c) => c && c.id !== child.id);
                this.syncBatchParentStatus(parent);
                if (this.selectedMaterialId === child.id) this.selectedMaterialId = null;
                message.success('已删除子任务');
              },
            });
          }
        },
        handleBatchParentHeaderMenu(key) {
          const parent = this.wbActiveBatchParentTask;
          if (!parent) return;
          this.handleTreeContextMenu(key, { id: parent.id, raw: parent }, 'analysis', 'task');
        },
        workbenchTaskRowAbort(raw) {
          if (!raw || !raw.id) return;
          if (this.isWorkbenchBatchParentTask(raw)) {
            this.abortBatchParentTask(raw);
            return;
          }
          if (this.resolveDemoWorkbenchTaskRef(raw)) {
            this.abortWorkbenchDemoTask(raw);
            return;
          }
          if (this.resolveCreatedWorkbenchTaskRef(raw)) {
            this.abortWorkbenchCreatedTask(raw);
            return;
          }
        },
        workbenchTaskRowRerun(raw) {
          if (!raw || !raw.id) return;
          if (this.isWorkbenchBatchParentTask(raw)) return;
          if (this.resolveDemoWorkbenchTaskRef(raw)) {
            this.rerunWorkbenchDemoTask(raw);
            return;
          }
          if (this.resolveCreatedWorkbenchTaskRef(raw)) {
            this.rerunWorkbenchCreatedTask(raw);
            return;
          }
        },
        abortWorkbenchDemoTask(m) {
          if (!m || !m.id) return;
          const st = this.workbenchAnalysisStatusOf(m);
          if (st !== 'queued' && st !== 'parsing') return;
          const isChild = this.isWorkbenchBatchChildTask(m);
          window.dsConfirm.action({
            title: isChild ? '中止子任务？' : '中止任务？',
            content: '中止后任务将停止执行，可稍后重新发起。',
            okText: '中止',
            onOk: () => {
              const t = this.resolveDemoWorkbenchTaskRef(m);
              if (!t) return;
              this.clearBatchChildRerunTimers(t);
              this.setWorkbenchTaskStatus(t, 'failed');
              const parent = this.findWorkbenchBatchParentOfChild(t);
              if (parent) this.syncBatchParentStatus(parent);
              message.info('已中止');
            },
          });
        },
        onWorkbenchAnalysisResultTreeRawToggleRef(d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.handleTreeContextMenu('ref', { id: m.id, raw: m }, 'analysis', 'result');
        },
        onWorkbenchAnalysisResultTreeRawMenu(key, d) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkResultFileDescriptor(d));
            return;
          }
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.handleTreeContextMenu(key, { id: m.id, raw: m }, 'analysis', 'result');
        },
        onWorkbenchAnalysisResultTreeDragStart(ev, d) {
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m || m.loading) {
            ev.preventDefault();
            return;
          }
          this.onTreeLeafDragStart(ev, { id: m.id, raw: m }, 'analysis');
        },
        wbMaterialTypeIcon(record) {
          const r = record || {};
          return this.wbFileIconSuffixFromFormatName(r.format, r.name);
        },
        wbMaterialTypeIconClass(record) {
          if (!record || record.status !== 'done') return '';
          const name = String((record && record.name) || '').trim();
          const api = window.DemoFileIcons;
          if (api && typeof api.iconFor === 'function') return api.iconFor(record.format, name).toneClass;
          return '';
        },
        openWorkbenchProjectMaterialMetaEdit(record) {
          if (!record || !record.id) return;
          this.wbMaterialMetaEditForm = {
            name: String(record.name || '').trim(),
          };
          this._wbMaterialMetaSnap = { name: this.wbMaterialMetaEditForm.name };
          this.wbMaterialMetaEditTargetId = record.id;
          this.wbMaterialMetaEditVisible = true;
        },
        closeWorkbenchProjectMaterialMetaEdit() {
          this.wbMaterialMetaEditVisible = false;
          this.wbMaterialMetaEditTargetId = '';
          this._wbMaterialMetaSnap = null;
        },
        cancelWorkbenchProjectMaterialMetaEdit() {
          const snap = this._wbMaterialMetaSnap;
          if (snap) {
            this.wbMaterialMetaEditForm = { name: snap.name };
          }
          this.closeWorkbenchProjectMaterialMetaEdit();
        },
        confirmWorkbenchProjectMaterialMetaEdit() {
          const id = this.wbMaterialMetaEditTargetId;
          const pid = this.workbenchProjectId;
          const name = String((this.wbMaterialMetaEditForm && this.wbMaterialMetaEditForm.name) || '').trim();
          if (!pid || !id) return;
          if (!name) {
            message.warning('请填写资料名称');
            return;
          }
          const rows = demoProjectMaterialsById[pid] || [];
          const idx = rows.findIndex((x) => x.id === id);
          if (idx < 0) return;
          rows.splice(idx, 1, { ...rows[idx], name });
          const m = (this.materials || []).find((x) => x.projectSource && x.projectSource.id === id);
          if (m) {
            m.title = name;
            m.projectSource = { ...m.projectSource, name };
            if (m.paired) {
              m.paired.title = `${name} - 提取结果`;
            }
          }
          this.closeWorkbenchProjectMaterialMetaEdit();
          message.success('已重命名');
        },
        downloadWorkbenchMaterialPreview(raw, toastText) {
          const rec = raw && raw.projectSource ? raw.projectSource : this.workbenchSelectedProjectMaterialRow;
          if (!rec) return;
          const pages = raw && raw.projectSource && typeof materialPreviewDocumentPagesFromRecord === 'function'
            ? materialPreviewDocumentPagesFromRecord(raw.projectSource)
            : this.workbenchMaterialDocumentPages || [];
          const body = pages.join('\n\n---\n\n');
          const base = String(rec.name || '资料').replace(/\.[^.]+$/, '');
          const safe = base.replace(/[/\\?%*:|"<>]/g, '_');
          const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safe}-预览.txt`;
          a.click();
          URL.revokeObjectURL(url);
          if (toastText !== false) message.success(typeof toastText === 'string' ? toastText : '已开始下载');
        },
        cancelWbAnalysisModalEmbedEdit() {
          this.wbAnalysisModalEmbedDraft = String(this._wbAnalysisModalEmbedSnap ?? '');
        },
        saveWbAnalysisModalEmbedEdit() {
          const rec = this.wbAnalysisModalRecord;
          const pid = this.workbenchProjectId;
          if (!rec || !rec.id || !pid) return;
          if (String(rec.format || 'MD').toUpperCase() === 'CSV') return;
          const oldMd = String(this.wbAnalysisModalPreviewMarkdown || '');
          const md = String(this.wbAnalysisModalEmbedDraft ?? '');
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          if (oldMd !== md) {
            this.pushWorkbenchAnalysisVersionEntry(rec.id, `${now} · 保存前`, oldMd, now, '编辑前版本');
          }
          const patch = {
            analysisMarkdown: md,
            analysisMarkdownEditedBy: '我',
            analysisMarkdownEditedAt: now,
          };
          const id = rec.id;
          const list = demoProjectAnalysisResultsById[pid];
          if (Array.isArray(list)) {
            const idx = list.findIndex((r) => r && r.id === id);
            if (idx >= 0) list.splice(idx, 1, { ...list[idx], ...patch });
          }
          const m = (this.materials || []).find((x) => x.id === id && x.type === 'analysis');
          if (m) {
            m.analysisMarkdown = md;
            if (m.projectSource) Object.assign(m.projectSource, patch);
          }
          this.wbAnalysisModalRecord = { ...rec, ...patch };
          this._wbAnalysisModalEmbedSnap = md;
          this.$nextTick(() => this.resetWorkbenchAnalysisEmbedDraftFromPreview());
          message.success('保存成功');
        },
        copyWbAnalysisModalEmbedPreview() {
          if (!this.wbAnalysisModalRecord) return;
          if (String(this.wbAnalysisModalRecord.format || 'MD').toUpperCase() === 'CSV') return;
          const text = String(this.wbAnalysisModalEmbedDraft ?? '');
          const ok = () => message.success('已复制到剪贴板');
          const fail = () => message.warning('复制失败');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(ok).catch(fail);
          } else {
            try {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.cssText = 'position:fixed;left:-9999px;top:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              ok();
            } catch (_) {
              fail();
            }
          }
        },
        openWorkbenchAnalysisModal() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return;
          this.clearWbAnalysisModalCitationFloats();
          this.wbAnalysisModalEmbedDraft = '';
          this._wbAnalysisModalEmbedSnap = '';
          const ps = m.projectSource || {};
          this.wbAnalysisModalRecord = {
            id: ps.id || m.id,
            name: ps.name || m.title,
            format: String(ps.format || m.format || 'MD').toUpperCase(),
            createdAt: ps.createdAt || m.meta,
            status: ps.status || 'done',
            sourceSkillName: ps.sourceSkillName || m.sourceSkillName,
            analysisMarkdown: m.analysisMarkdown || ps.analysisMarkdown,
            analysisCsvData: m.analysisCsvData || ps.analysisCsvData || '',
            analysisMarkdownEditedBy: ps.analysisMarkdownEditedBy,
            analysisMarkdownEditedAt: ps.analysisMarkdownEditedAt,
            citationMap: m.citationMap || ps.citationMap,
          };
          this.wbAnalysisModalActiveTab = 'basic';
          this.ensureWorkbenchAnalysisVersionHistoryForRecord(this.wbAnalysisModalRecord);
          this.wbAnalysisModalOpen = true;
          this.$nextTick(() => this.resetWbAnalysisModalEmbedDraftFromPreview());
        },
        closeWbAnalysisModal() {
          this.wbAnalysisModalOpen = false;
          this.wbAnalysisModalRecord = null;
          this.wbAnalysisModalActiveTab = 'basic';
          this.wbAnalysisModalEmbedDraft = '';
          this._wbAnalysisModalEmbedSnap = '';
          this.clearWbAnalysisModalCitationFloats();
        },
        isTreeNodeSelected(node, sectionKey) {
          if (!this.selectedTreeNode) return false;
          return node.id === this.selectedTreeNode.id;
        },
        selectTreeNode(node, sectionKey) {
          if (node.raw.loading) return;
          this.selectedTreeNode = { source: sectionKey === 'analysis' ? 'analysis' : 'material', id: node.id };
          if (sectionKey === 'analysis' && this.isWorkbenchBatchParentTask(node.raw)) {
            this.enterBatchChildListView(node.raw);
            return;
          }
          if (sectionKey === 'material' || sectionKey === 'analysis') {
            const ephemeralTask = !!(this.workbenchCreatedTasks || []).find((t) => t && t.id === node.raw.id);
            const demoTask = !!((this.workbenchTaskDemoRows || []).some((t) => t && t.id === node.raw.id));
            const taskSidebarRow = ephemeralTask || demoTask;
            if (
              taskSidebarRow ||
              (this.canOpenMaterialPreview(node.raw) && this.canOpenAnalysisPreview(node.raw))
            ) {
              this.openMaterialDetail(node.raw);
            }
          }
        },
        openDetailFromTreeTitle(node, sectionKey) {
          this.selectedTreeNode = { source: sectionKey === 'analysis' ? 'analysis' : 'material', id: node.id };
          if (sectionKey === 'analysis' && this.isWorkbenchBatchParentTask(node.raw)) {
            this.enterBatchChildListView(node.raw);
            return;
          }
          this.openMaterialDetail(node.raw);
        },
        handleTreeContextMenu(key, node, sectionKey, treeScope) {
          const ts = treeScope || null;
          const raw = node && node.raw;
          const demoTask = !!(raw && (this.workbenchTaskDemoRows || []).some((t) => t && t.id === raw.id));
          const ephemeralTask = !!(raw && (this.workbenchCreatedTasks || []).find((t) => t && t.id === raw.id));
          if (key === 'bulk-select') {
            let desc = null;
            if (ts === 'task') desc = this.workbenchBulkTaskDescriptor(node);
            else if (sectionKey === 'material') desc = this.workbenchBulkStatusNodeDescriptor(node, 'material');
            this.startWorkbenchBulkSelection(desc);
            return;
          }
          if (key === 'delete' && demoTask && ts === 'task') {
            this.deleteWorkbenchDemoTask(raw);
            return;
          }
          if (key === 'delete' && ephemeralTask) {
            this.deleteWorkbenchCreatedTask(raw);
            return;
          }
          if (ts === 'task' && key === 'download-package') {
            this.downloadWorkbenchPackageTask(raw);
            return;
          }
          if (
            ts === 'task' &&
            demoTask &&
            (key === 'rerun-all' || key === 'rerun-failed-only' || key === 'rerun-full' || key === 'rerun-continue' || key === 'clear-failed-only')
          ) {
            this.onBatchParentRerunMenu(key, raw);
            return;
          }
          if (ts === 'task' && demoTask && key === 'rerun-task') {
            this.rerunWorkbenchDemoTask(raw);
            return;
          }
          if (ts === 'task' && demoTask && key === 'abort-task') {
            if (this.isWorkbenchBatchParentTask(raw)) this.abortBatchParentTask(raw);
            else this.abortWorkbenchDemoTask(raw);
            return;
          }
          if (
            ts === 'task' &&
            ephemeralTask &&
            (key === 'rerun-all' || key === 'rerun-failed-only' || key === 'rerun-full' || key === 'rerun-continue' || key === 'clear-failed-only')
          ) {
            this.onBatchParentRerunMenu(key, raw);
            return;
          }
          if (ts === 'task' && ephemeralTask && key === 'rerun-task') {
            this.rerunWorkbenchCreatedTask(raw);
            return;
          }
          if (ts === 'task' && ephemeralTask && key === 'abort-task') {
            if (this.isWorkbenchBatchParentTask(raw)) this.abortBatchParentTask(raw);
            else this.abortWorkbenchCreatedTask(raw);
            return;
          }
          if (ts === 'task' && ephemeralTask && ['edit', 'download', 'rename'].includes(key)) {
            return;
          }
          if (ts === 'task' && demoTask && ['edit', 'download', 'rename'].includes(key)) {
            return;
          }
          if (key === 'ref') {
            if (!raw) return;
            this.addChatInputMaterialRef(raw, { focus: true });
            this.toastMessage = '已添加到对话';
            setTimeout(() => { this.toastMessage = ''; }, 1500);
            return;
          }
          if (sectionKey === 'material' && (key === 'cancel-upload' || key === 'abort' || key === 'rerun' || key === 'rename' || key === 'delete')) {
            this.handleWorkbenchMaterialAction(key, raw);
            return;
          }
          if (typeof key === 'string' && key.indexOf('export-') === 0 && sectionKey === 'analysis') {
            const fmt = key.slice('export-'.length);
            if (fmt === 'md' || fmt === 'pdf' || fmt === 'docx' || fmt === 'csv') {
              this.simulateWorkbenchAnalysisResultExport(fmt);
            }
            return;
          }
          if (key === 'download' && sectionKey === 'material') {
            this.downloadWorkbenchMaterialPreview(raw);
            return;
          }
          if (key === 'edit' || key === 'rename') {
            this.openWorkbenchTreeItemMetaEdit(node.raw, sectionKey);
            return;
          }
          this.handleMaterialMenuClick(key, node.raw);
        },
        handleWorkbenchMaterialAction(key, raw) {
          if (!raw) return;
          if (key === 'ref') {
            this.handleTreeContextMenu('ref', { id: raw.id, raw }, 'material');
            return;
          }
          if (key === 'cancel-upload') {
            this.cancelWorkbenchUploadMaterial(raw);
            return;
          }
          if (key === 'abort') {
            this.abortWorkbenchMaterial(raw);
            return;
          }
          if (key === 'rerun') {
            this.rerunWorkbenchMaterial(raw);
            return;
          }
          if (key === 'download') {
            this.downloadWorkbenchMaterialPreview(raw);
            return;
          }
          if (key === 'rename') {
            this.openWorkbenchTreeItemMetaEdit(raw, 'material');
            return;
          }
          if (key === 'delete') {
            this.deleteMaterial(raw);
          }
        },
        onMaterialListAreaClick() {},
        onTreeLeafDragStart(ev, node, sectionKey) {
          if (node.raw.loading) { ev.preventDefault(); return; }
          const payload = { source: 'material', id: node.id };
          const raw = JSON.stringify(payload);
          ev.dataTransfer.setData('application/json', raw);
          ev.dataTransfer.setData('text/plain', raw);
          ev.dataTransfer.effectAllowed = 'copy';
        },
        onMsgBubbleClick(msg, e) {
          if (e.target.closest('.analysis-inline-citation')) {
            e.stopPropagation();
            this.handleChatAnalysisInlineCitationClick(e);
            return;
          }
          if (e.target.closest('.nlm-citation')) {
            e.stopPropagation();
            this.handleCitationClick(e);
            return;
          }
        },
        findMaterialBySourceId(sourceId) {
          for (const m of this.materials) {
            if (m.id === sourceId) return { material: m };
            if (m.paired && m.paired.id === sourceId) return { material: m };
          }
          return null;
        },
        openSaveResultModal(msg, payload) {
          if (!msg || msg.role !== 'bot') return;
          const seedText = this.getMessageFullPlainText(msg);
          const seedName = (seedText.slice(0, 28) + (seedText.length > 28 ? '...' : '') || '对话结果').trim();
          this.saveResultModalSourceType = 'message';
          this.saveResultModalSourceMsgId = msg.id;
          this.saveResultModalSourcePayload = null;
          this.saveResultForm = { name: seedName };
          this.saveResultModalVisible = true;
        },
        closeSaveResultModal() {
          this.saveResultModalVisible = false;
          this.saveResultModalSourceType = 'message';
          this.saveResultModalSourceMsgId = null;
          this.saveResultModalSourcePayload = null;
          this.saveResultForm = { name: '' };
        },
        confirmSaveResultModal() {
          const name = String((this.saveResultForm && this.saveResultForm.name) || '').trim();
          if (!name) {
            message.warning('请先输入结果名称');
            return;
          }
          const msg = (this.chatMessages || []).find((x) => x.id === this.saveResultModalSourceMsgId);
          if (!msg) {
            message.warning('未找到对应消息，无法保存');
            return;
          }
          this.addMessageToMaterialPool(msg, name);
          this.closeSaveResultModal();
        }
  };
})();
