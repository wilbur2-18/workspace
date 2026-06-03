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
  NS.actionGroups.taskActions = {
        ensureWbBatchChildPageInRange() {
          const size = Math.max(1, Number(this.wbBatchChildPageSize) || 1);
          const total = this.filteredBatchChildren.length;
          const maxPage = Math.max(1, Math.ceil(total / size));
          const nextPage = Math.min(Math.max(1, Number(this.wbBatchChildPage) || 1), maxPage);
          if (nextPage !== this.wbBatchChildPage) this.wbBatchChildPage = nextPage;
        },
        onWbBatchChildPageChange(page) {
          this.wbBatchChildPage = Math.max(1, Number(page) || 1);
        },
        workbenchMenuItemIcon(key) {
          const map = {
            'upload-file': 'upload',
            'cross-workbench-import': 'inbox-out',
            'new-folder': 'folder-plus',
            new: 'plus',
            library: 'book-open',
            ref: 'chat-ref',
            chat: 'chat-ref',
            cite: 'chat-ref',
            download: 'download',
            rename: 'edit',
            delete: 'trash',
            abort: 'stop',
            rerun: 'redo',
            'cancel-upload': 'stop',
          };
          return map[key] || '';
        },
        workbenchMenuItemShowIcon(key) {
          const iconKeys = {
            'upload-file': true,
            'cross-workbench-import': true,
            'new-folder': true,
            ref: true,
            chat: true,
            cite: true,
          };
          return !!iconKeys[String(key || '')];
        },
        workbenchMenuItemsNeedIconSlot(actions) {
          if (!Array.isArray(actions) || !actions.length) return false;
          let hasIcon = false;
          let hasTextOnly = false;
          actions.forEach((action) => {
            if (this.workbenchMenuItemShowIcon(action)) hasIcon = true;
            else hasTextOnly = true;
          });
          return hasIcon && hasTextOnly;
        },
        findWorkbenchTaskById(id) {
          const tid = String(id || '');
          if (!tid) return null;
          const created = (this.workbenchCreatedTasks || []).find((x) => x && x.id === tid);
          if (created) return created;
          const demo = (this.workbenchTaskDemoRows || []).find((x) => x && x.id === tid);
          return demo || null;
        },
        isWorkbenchBatchParentTask(raw) {
          return !!(raw && raw.taskType === 'batch');
        },
        isWorkbenchBatchChildTask(raw) {
          return !!(raw && raw.taskType === 'batch-child');
        },
        batchChildCanAbort(child) {
          if (!child) return false;
          const st = this.workbenchAnalysisStatusOf(child);
          return st === 'queued' || st === 'parsing';
        },
        batchChildCanRerun(child) {
          if (!child) return false;
          const st = this.workbenchAnalysisStatusOf(child);
          return st === 'failed' || st === 'done';
        },
        batchChildCanDelete(child) {
          if (!child) return false;
          const st = this.workbenchAnalysisStatusOf(child);
          return st === 'done' || st === 'failed';
        },
        batchChildHasResultFile(child) {
          const pid = String(this.workbenchProjectId || '').trim();
          const childId = String(child && child.id || '').trim();
          if (!pid || !childId || typeof demoProjectAnalysisResultsById === 'undefined') return false;
          const rows = demoProjectAnalysisResultsById[pid] || [];
          return rows.some((row) => row && String(row.sourceTaskId || '').trim() === childId);
        },
        /** 跑批子任务在父任务 children 中的排队序号（仅 queued，从 1 起） */
        batchChildQueuePosition(child) {
          const parent = this.wbActiveBatchParentTask;
          if (!parent || !child || !child.id) return 0;
          if (this.workbenchAnalysisStatusOf(child) !== 'queued') return 0;
          const queued = (parent.children || []).filter((c) => c && this.workbenchAnalysisStatusOf(c) === 'queued');
          const idx = queued.findIndex((c) => String(c.id) === String(child.id));
          return idx >= 0 ? idx + 1 : 0;
        },
        batchChildShowMoreMenu(child) {
          if (!child) return false;
          let count = 0;
          if (this.batchChildCanAbort(child)) count += 1;
          if (this.batchChildCanRerun(child)) count += 1;
          if (this.batchChildCanDelete(child)) count += 1;
          return count > 1;
        },
        batchParentHasChildren(parent) {
          return Array.isArray(parent && parent.children) && parent.children.length > 0;
        },
        batchParentFailedChildCount(parent) {
          const children = (parent && parent.children) || [];
          return children.filter((c) => this.workbenchAnalysisStatusOf(c) === 'failed').length;
        },
        batchParentCanAbort(parent) {
          if (!this.isWorkbenchBatchParentTask(parent)) return false;
          const children = parent.children || [];
          return children.some((c) => this.batchChildCanAbort(c));
        },
        batchParentCanRerunMenu(parent) {
          return this.isWorkbenchBatchParentTask(parent) && this.batchParentHasChildren(parent);
        },
        batchParentShowAbortQuick(parent) {
          return this.isWorkbenchBatchParentTask(parent)
            ? this.batchParentCanAbort(parent)
            : ['queued', 'parsing'].includes(this.workbenchAnalysisStatusOf(parent));
        },
        batchParentShowRerunQuick(parent) {
          if (this.isWorkbenchBatchParentTask(parent)) return false;
          return this.workbenchAnalysisStatusOf(parent) === 'failed';
        },
        workbenchTaskCanShowRerun(raw) {
          if (!raw) return false;
          const st = this.workbenchAnalysisStatusOf(raw);
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(raw)) return st === 'failed' || st === 'done';
          if (this.isWorkbenchBatchParentTask(raw)) return false;
          if (this.isWorkbenchBatchChildTask(raw)) return this.batchChildCanRerun(raw);
          return st === 'queued' || st === 'parsing' || st === 'failed' || st === 'done';
        },
        workbenchTaskRerunMenuLabel(raw) {
          return this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(raw) ? '重新打包' : '重跑';
        },
        workbenchTaskMenuHasNonDelete(raw) {
          if (!raw) return false;
          return (
            this.workbenchPackageTaskCanDownload(raw) ||
            (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(raw) && ['queued', 'parsing'].includes(this.workbenchAnalysisStatusOf(raw))) ||
            this.batchParentShowAbortQuick(raw) ||
            this.batchParentCanRerunMenu(raw) ||
            this.workbenchTaskCanShowRerun(raw)
          );
        },
        batchParentHeaderNonDeleteActionCount(parent) {
          if (!parent) return 0;
          let count = 0;
          if (this.batchParentShowAbortQuick(parent)) count += 1;
          if (this.batchParentCanRerunMenu(parent)) count += 3;
          return count;
        },
        batchParentHeaderShowMoreMenu(parent) {
          return this.batchParentHeaderNonDeleteActionCount(parent) > 1;
        },
        findWorkbenchBatchParentOfChild(child) {
          if (!child || !child.id) return null;
          const cid = String(child.id);
          const sources = [];
          sources.push(this.workbenchTaskDemoRows || []);
          sources.push(this.workbenchCreatedTasks || []);
          for (let s = 0; s < sources.length; s += 1) {
            const rows = sources[s] || [];
            for (let i = 0; i < rows.length; i += 1) {
              const row = rows[i];
              if (!row || row.taskType !== 'batch') continue;
              const children = row.children || [];
              if (children.some((c) => c && String(c.id) === cid)) return row;
            }
          }
          return null;
        },
        setWorkbenchTaskStatus(task, status) {
          if (!task) return;
          task.status = status;
          task.projectSource = task.projectSource || {};
          task.projectSource.status = status;
        },
        syncBatchParentStatus(parent) {
          if (!parent || !this.isWorkbenchBatchParentTask(parent)) return;
          const children = parent.children || [];
          if (!children.length) return;
          const statuses = children.map((c) => this.workbenchAnalysisStatusOf(c));
          let next = 'done';
          if (statuses.some((st) => st === 'parsing')) next = 'parsing';
          else if (statuses.some((st) => st === 'queued')) next = 'queued';
          else if (statuses.some((st) => st === 'failed')) next = 'failed';
          else if (statuses.every((st) => st === 'done')) next = 'done';
          this.setWorkbenchTaskStatus(parent, next);
        },
        workbenchBatchProgressText(raw) {
          const children = (raw && raw.children) || [];
          if (!children.length) return '';
          const done = children.filter((c) => this.workbenchAnalysisStatusOf(c) === 'done').length;
          return `${done}/${children.length}`;
        },
        workbenchBatchProgressPercent(raw) {
          const children = (raw && raw.children) || [];
          if (!children.length) return 0;
          const done = children.filter((c) => this.workbenchAnalysisStatusOf(c) === 'done').length;
          return Math.max(0, Math.min(100, (done / children.length) * 100));
        },
        openWorkbenchTaskCreateModal() {
          this.clearWbTaskCreateInstructionTimer();
          this.wbTaskCreateInstructionState = 'idle';
          this.wbTaskCreateStep = 1;
          this.wbTaskCreateForm = {
            taskName: '',
            skillId: '',
            taskType: 'single',
            resultOutputFolderId: WB_TASK_CREATE_RESULT_OUTPUT_ROOT,
            instruction: '',
            dataSourceFile: null,
            idColumns: [],
            subtaskNamingMode: 'same_as_object',
            subtaskNamingColumns: [],
            resourceTab: 'file',
            resourceQuery: '',
            fileExpandedKeys: [],
            resultExpandedKeys: [],
            selectedResources: [],
          };
          this.wbTaskCreateModalOpen = true;
        },
        closeWorkbenchTaskCreateModal() {
          this.clearWbTaskCreateInstructionTimer();
          this.wbTaskCreateInstructionState = 'idle';
          this.wbTaskCreateModalOpen = false;
          this.wbTaskCreateStep = 1;
        },
        clearWbTaskCreateInstructionTimer() {
          if (this._wbTaskCreateInstructionTimer) {
            clearTimeout(this._wbTaskCreateInstructionTimer);
            this._wbTaskCreateInstructionTimer = null;
          }
        },
        buildWbTaskCreateInstructionText() {
          const skillId = String(this.wbTaskCreateForm.skillId || '');
          const skill = (this.workbenchProjectTemplates || []).find((tpl) => String(tpl.id) === skillId);
          const skillName = (skill && skill.name) || '所选技能';
          if (this.wbTaskCreateForm.taskType === 'batch') {
            const idCols = this.wbTaskCreateBatchIdColumns;
            const colText = idCols.map((col) => `{{${col}}}`).join('、');
            return `请使用技能「${skillName}」，针对数据源中 ${colText} 等标识符组合的每一行，执行分析并输出结构化结果。`;
          }
          const rule = String((skill && skill.analysisRule) || '').trim();
          return rule || `请使用技能「${skillName}」对所选资源进行分析，输出审计结论与引用依据。`;
        },
        onWbTaskCreateTypeChange() {
          if (this.wbTaskCreateForm.taskType === 'single') {
            this.wbTaskCreateForm.dataSourceFile = null;
            this.wbTaskCreateForm.idColumns = [];
            this.wbTaskCreateForm.subtaskNamingMode = 'same_as_object';
            this.wbTaskCreateForm.subtaskNamingColumns = [];
          }
          this.syncWbTaskCreateInstructionFromSkill();
        },
        onWbTaskCreateSubtaskNamingModeChange() {
          if (this.wbTaskCreateForm.subtaskNamingMode !== 'custom') {
            this.wbTaskCreateForm.subtaskNamingColumns = [];
          }
        },
        wbTaskCreateInstructionPrerequisitesMet() {
          const f = this.wbTaskCreateForm || {};
          if (!String(f.skillId || '').trim()) return false;
          if (f.taskType === 'batch') {
            if (!f.dataSourceFile) return false;
            if (!this.wbTaskCreateBatchSelectedColumnCount) return false;
          }
          return true;
        },
        syncWbTaskCreateBatchInstruction() {
          this.syncWbTaskCreateInstructionFromSkill();
        },
        applyWbTaskCreateDataSourceFile(name) {
          const fileName = String(name || '').trim() || '企业清单-跑批样本.xlsx';
          const lower = fileName.toLowerCase();
          if (!lower.endsWith('.xlsx') && !lower.endsWith('.csv')) {
            message.warning('仅支持 .xlsx 或 .csv 文件');
            return;
          }
          this.wbTaskCreateForm.dataSourceFile = {
            name: fileName,
            mockKey: lower.endsWith('.csv') ? 'csv' : 'xlsx',
          };
          if (!this.wbTaskCreateBatchSelectedColumnCount) {
            const preview = window.DEMO_BATCH_DATASOURCE_PREVIEW;
            const firstCol = preview && preview.columns && preview.columns[0];
            if (firstCol) this.wbTaskCreateForm.idColumns = [firstCol];
          }
          this.syncWbTaskCreateBatchInstruction();
        },
        isWbTaskCreateIdColumnSelected(columnName) {
          const col = String(columnName || '').trim();
          if (!col) return false;
          return this.wbTaskCreateBatchIdColumns.includes(col);
        },
        toggleWbTaskCreateIdColumn(columnName) {
          if (!this.wbTaskCreateForm.dataSourceFile) return;
          const col = String(columnName || '').trim();
          if (!col) return;
          const cols = [...this.wbTaskCreateBatchIdColumns];
          const idx = cols.indexOf(col);
          if (idx >= 0) cols.splice(idx, 1);
          else cols.push(col);
          this.wbTaskCreateForm.idColumns = cols;
          this.syncWbTaskCreateBatchInstruction();
        },
        wbBatchMetaIdColumnText(task) {
          const meta = task && task.batchMeta;
          if (!meta) return '—';
          const cols = meta.idColumns;
          if (Array.isArray(cols) && cols.length) return cols.join('、');
          return String(meta.idColumn || '').trim() || '—';
        },
        wbTaskCreateBatchRowLabel(row, preview, idCols) {
          const columns = (preview && preview.columns) || [];
          const parts = (idCols || [])
            .map((col) => {
              const idx = columns.indexOf(col);
              return idx >= 0 ? String((row && row[idx]) || '').trim() : '';
            })
            .filter(Boolean);
          return parts.join(' · ');
        },
        clearWbTaskCreateDataSource() {
          this.wbTaskCreateForm.dataSourceFile = null;
          this.wbTaskCreateForm.idColumns = [];
          this.wbTaskCreateForm.subtaskNamingColumns = [];
          this.syncWbTaskCreateInstructionFromSkill();
        },
        goWbTaskCreateStep2() {
          if (this.wbTaskCreateStep1NextDisabled) return;
          this.wbTaskCreateStep = 2;
          this.syncWbTaskCreateTreeExpandedKeys('file');
        },
        enterBatchChildListView(parentTask) {
          if (!parentTask || !this.isWorkbenchBatchParentTask(parentTask)) return;
          this.wbTaskListView = 'batch-children';
          this.wbActiveBatchParentId = parentTask.id;
          this.wbBatchChildStatusView = 'all';
          this.wbBatchChildPage = 1;
          this.selectedTreeNode = { source: 'analysis', id: parentTask.id };
          this.selectedMaterialId = null;
          this.sourcesRightView = 'list';
          this.studioCollapsed = false;
        },
        exitBatchChildListView() {
          this.wbTaskListView = 'main';
          this.wbActiveBatchParentId = '';
          this.wbBatchChildStatusView = 'all';
          this.wbBatchChildPage = 1;
          if (this.selectedMaterial && this.isWorkbenchBatchParentTask(this.selectedMaterial)) {
            this.selectedMaterialId = null;
          }
          if (this.sourcesRightView === 'detail' && !this.selectedMaterialId) {
            this.sourcesRightView = 'list';
          }
        },
        setWbBatchChildStatusView(status) {
          if (!['queued', 'parsing', 'done', 'failed', 'no-result'].includes(status)) return;
          this.wbBatchChildStatusView = status;
          this.wbBatchChildPage = 1;
        },
        resetWbBatchChildStatusView() {
          this.wbBatchChildStatusView = 'all';
          this.wbBatchChildPage = 1;
        },
        clearBatchChildRerunTimers(child) {
          const t = child || null;
          if (!t || !Array.isArray(t._wbRerunTimers)) return;
          t._wbRerunTimers.forEach((timerId) => window.clearTimeout(timerId));
          t._wbRerunTimers = null;
        },
        workbenchTaskRerunTargetName() {
          const t = this.wbTaskRerunConfirmTarget || {};
          return String(t.title || t.rowLabel || (t.projectSource && t.projectSource.name) || '未命名任务').trim() || '未命名任务';
        },
        workbenchTaskRerunTargetTypeLabel() {
          const t = this.wbTaskRerunConfirmTarget;
          const mode = String(this.wbTaskRerunConfirmMode || 'task');
          if (mode === 'batch-parent' || this.isWorkbenchBatchParentTask(t)) return '跑批任务';
          if (mode === 'batch-child' || this.isWorkbenchBatchChildTask(t)) return '跑批子任务';
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(t)) return '打包下载任务';
          const tc = (t && t.taskConfig) || {};
          if (tc.taskType === 'generate-skill' || String(tc.skillId || '') === 'generate-skill') return '生成技能任务';
          return '单次任务';
        },
        workbenchTaskRerunConfirmTitle() {
          const t = this.wbTaskRerunConfirmTarget;
          const mode = String(this.wbTaskRerunConfirmMode || 'task');
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(t)) return '确认重新打包';
          if (mode === 'batch-parent') return '确认一键重跑';
          if (mode === 'batch-child' || this.isWorkbenchBatchChildTask(t)) return '确认重跑子任务';
          return '确认重跑任务';
        },
        workbenchTaskRerunConfirmDesc() {
          const t = this.wbTaskRerunConfirmTarget;
          const mode = String(this.wbTaskRerunConfirmMode || 'task');
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(t)) return '将基于原打包范围和下载格式重新创建打包任务。';
          if (mode === 'batch-parent') return '将基于原跑批范围、任务指令和当前可用配置重新执行整批子任务。';
          if (mode === 'batch-child' || this.isWorkbenchBatchChildTask(t)) return '将仅重跑当前子任务，不影响其他子任务。';
          return '将基于原任务输入范围和当前可用配置重新执行，并创建新的任务记录。';
        },
        workbenchTaskRerunKeepLabel() {
          const t = this.wbTaskRerunConfirmTarget;
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(t)) return '保留旧文件包，新文件包生成后并存';
          return '保留旧产物，新产出与原产出并存';
        },
        workbenchTaskRerunDeleteLabel() {
          const t = this.wbTaskRerunConfirmTarget;
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(t)) return '删除旧文件包，再重新打包';
          return '删除旧产物，再重新执行';
        },
        openWorkbenchTaskRerunConfirm(task, mode) {
          if (!task) return;
          this.wbTaskRerunConfirmTarget = task;
          this.wbTaskRerunConfirmMode = mode || (this.isWorkbenchBatchChildTask(task) ? 'batch-child' : 'task');
          this.wbTaskRerunConfirmDisposition = 'keep';
          this.wbTaskRerunConfirmOpen = true;
        },
        closeWorkbenchTaskRerunConfirm() {
          this.wbTaskRerunConfirmOpen = false;
          this.wbTaskRerunConfirmTarget = null;
          this.wbTaskRerunConfirmMode = 'task';
          this.wbTaskRerunConfirmDisposition = 'keep';
        },
        cloneWorkbenchTaskPayloadForRerun(source, title, now) {
          const raw = source || {};
          const taskConfig = JSON.parse(JSON.stringify(raw.taskConfig || {}));
          const projectSource = JSON.parse(JSON.stringify(raw.projectSource || {}));
          const id = 'wb-task-rerun-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          return {
            id,
            type: 'analysis',
            title,
            status: 'queued',
            analysisMarkdown: raw.analysisMarkdown || (projectSource && projectSource.analysisMarkdown) || '',
            taskConfig,
            taskType: raw.taskType || taskConfig.taskType,
            packageMeta: raw.packageMeta ? JSON.parse(JSON.stringify(raw.packageMeta)) : undefined,
            projectSource: {
              ...projectSource,
              id,
              status: 'queued',
              progress: 0,
              createdAt: now,
              completedAt: null,
              name: title,
            },
          };
        },
        scheduleWorkbenchRerunCreatedTask(task) {
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
            t.projectSource = t.projectSource || {};
            t.projectSource.progress = 45;
          }, 700));
          timers.push(window.setTimeout(() => {
            const t = this.resolveCreatedWorkbenchTaskRef(task);
            if (!t || this.workbenchAnalysisStatusOf(t) !== 'parsing') return;
            this.setWorkbenchTaskStatus(t, 'done');
            t.projectSource = t.projectSource || {};
            t.projectSource.progress = 100;
            t.projectSource.completedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
            if (typeof this.ensureWorkbenchAnalysisResultTaskFolders === 'function') this.ensureWorkbenchAnalysisResultTaskFolders();
            message.success('重跑任务已完成');
          }, 2200));
          task._wbRerunTimers = timers;
        },
        createWorkbenchRerunTask(source) {
          if (!source) return null;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const isPackage = this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(source);
          const base = String(source.title || (source.projectSource && source.projectSource.name) || '任务').trim() || '任务';
          const title = isPackage ? `${base}（重新打包）` : `${base}（重跑）`;
          const created = this.cloneWorkbenchTaskPayloadForRerun(source, title, now);
          if (isPackage) {
            const packageMeta = JSON.parse(JSON.stringify((source.packageMeta || (source.taskConfig && source.taskConfig.packageMeta) || {})));
            packageMeta.ready = false;
            created.taskType = 'download-package';
            created.packageMeta = packageMeta;
            created.taskConfig = {
              ...(created.taskConfig || {}),
              taskType: 'download-package',
              skillId: 'download-package',
              skillName: '文件打包',
              packageMeta,
            };
          }
          this.workbenchCreatedTasks = [created, ...(this.workbenchCreatedTasks || [])];
          if (isPackage && typeof this.scheduleWorkbenchPackageTask === 'function') this.scheduleWorkbenchPackageTask(created);
          else this.scheduleWorkbenchRerunCreatedTask(created);
          return created;
        },
        confirmWorkbenchTaskRerun() {
          const target = this.wbTaskRerunConfirmTarget;
          const mode = String(this.wbTaskRerunConfirmMode || 'task');
          const disposition = String(this.wbTaskRerunConfirmDisposition || 'keep');
          this.closeWorkbenchTaskRerunConfirm();
          if (!target) return;
          if (mode === 'batch-parent') {
            const ref =
              this.resolveDemoWorkbenchTaskRef(target) ||
              this.resolveCreatedWorkbenchTaskRef(target) ||
              target;
            const children = ref.children || [];
            children.forEach((c) => this.rerunBatchChild(c, { force: true }));
            this.syncBatchParentStatus(ref);
            message.success(disposition === 'delete' ? `已删除旧产物并发起整批重跑（${children.length} 个子任务）` : `已发起整批重跑（${children.length} 个子任务）`);
            return;
          }
          if (mode === 'batch-child' || this.isWorkbenchBatchChildTask(target)) {
            this.rerunBatchChild(target);
            message.success(disposition === 'delete' ? '已删除旧产物并提交子任务重跑' : '已提交子任务重跑');
            return;
          }
          const created = this.createWorkbenchRerunTask(target);
          if (!created) return;
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(created)) {
            message.success(disposition === 'delete' ? '已删除旧文件包并提交重新打包' : '已提交重新打包');
          } else {
            message.success(disposition === 'delete' ? '已删除旧产物并提交重跑' : '已提交重跑');
          }
        },
        applyBatchChildAbort(child) {
          const t =
            this.resolveDemoWorkbenchTaskRef(child) || this.resolveCreatedWorkbenchTaskRef(child);
          if (!t || !this.batchChildCanAbort(t)) return false;
          this.clearBatchChildRerunTimers(t);
          this.setWorkbenchTaskStatus(t, 'failed');
          const parent = this.findWorkbenchBatchParentOfChild(t);
          if (parent) this.syncBatchParentStatus(parent);
          return true;
        },
        rerunBatchChild(child, opts) {
          const options = opts || {};
          const t =
            this.resolveDemoWorkbenchTaskRef(child) || this.resolveCreatedWorkbenchTaskRef(child);
          if (!t) return;
          if (!options.force && !this.batchChildCanRerun(t)) return;
          this.clearBatchChildRerunTimers(t);
          this.setWorkbenchTaskStatus(t, 'queued');
          const parent = this.findWorkbenchBatchParentOfChild(t);
          if (parent) this.syncBatchParentStatus(parent);
          const timers = [];
          timers.push(
            window.setTimeout(() => {
              const cur =
                this.resolveDemoWorkbenchTaskRef(child) ||
                this.resolveCreatedWorkbenchTaskRef(child);
              if (!cur || this.workbenchAnalysisStatusOf(cur) !== 'queued') return;
              this.setWorkbenchTaskStatus(cur, 'parsing');
              if (parent) this.syncBatchParentStatus(parent);
            }, 600)
          );
          timers.push(
            window.setTimeout(() => {
              const cur =
                this.resolveDemoWorkbenchTaskRef(child) ||
                this.resolveCreatedWorkbenchTaskRef(child);
              if (!cur || this.workbenchAnalysisStatusOf(cur) !== 'parsing') return;
              this.setWorkbenchTaskStatus(cur, 'done');
              const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
              cur.projectSource = cur.projectSource || {};
              cur.projectSource.completedAt = cur.projectSource.completedAt || now;
              if (parent) this.syncBatchParentStatus(parent);
              if (typeof this.ensureWorkbenchAnalysisResultTaskFolders === 'function') {
                this.ensureWorkbenchAnalysisResultTaskFolders();
              }
            }, 2000)
          );
          t._wbRerunTimers = timers;
        },
        abortBatchParentTask(parent) {
          if (!parent || !this.isWorkbenchBatchParentTask(parent)) return;
          const ref =
            this.resolveDemoWorkbenchTaskRef(parent) ||
            this.resolveCreatedWorkbenchTaskRef(parent) ||
            parent;
          const targets = (ref.children || []).filter((c) => this.batchChildCanAbort(c));
          if (!targets.length) {
            message.info('没有可中止的子任务');
            return;
          }
          window.dsConfirm.action({
            title: '中止跑批任务？',
            content: `将中止 ${targets.length} 个排队中/运行中的子任务。`,
            okText: '中止',
            onOk: () => {
              targets.forEach((c) => this.applyBatchChildAbort(c));
              this.syncBatchParentStatus(ref);
              message.success(`已中止 ${targets.length} 个子任务`);
            },
          });
        },
        rerunBatchParentFull(parent) {
          if (!parent || !this.isWorkbenchBatchParentTask(parent)) return;
          const ref =
            this.resolveDemoWorkbenchTaskRef(parent) ||
            this.resolveCreatedWorkbenchTaskRef(parent) ||
            parent;
          const children = ref.children || [];
          if (!children.length) return;
          this.openWorkbenchTaskRerunConfirm(ref, 'batch-parent');
        },
        rerunBatchParentFailedOnly(parent) {
          if (!parent || !this.isWorkbenchBatchParentTask(parent)) return;
          const ref =
            this.resolveDemoWorkbenchTaskRef(parent) ||
            this.resolveCreatedWorkbenchTaskRef(parent) ||
            parent;
          const targets = (ref.children || []).filter((c) => this.workbenchAnalysisStatusOf(c) === 'failed');
          if (!targets.length) {
            message.info('没有失败的子任务可重跑');
            return;
          }
          window.dsConfirm.action({
            title: '仅失败重跑？',
            content: `将对 ${targets.length} 个失败子任务重新排队执行。`,
            okText: '重跑',
            onOk: () => {
              targets.forEach((c) => this.rerunBatchChild(c));
              this.syncBatchParentStatus(ref);
              message.success(`已发起仅失败重跑（${targets.length} 个子任务）`);
            },
          });
        },
        clearBatchParentFailedOnly(parent) {
          if (!parent || !this.isWorkbenchBatchParentTask(parent)) return;
          const ref =
            this.resolveDemoWorkbenchTaskRef(parent) ||
            this.resolveCreatedWorkbenchTaskRef(parent) ||
            parent;
          const targets = (ref.children || []).filter((c) => this.workbenchAnalysisStatusOf(c) === 'failed');
          if (!targets.length) {
            message.info('没有失败的子任务可清空');
            return;
          }
          const failedIds = new Set(targets.map((c) => c && c.id).filter(Boolean));
          window.dsConfirm.delete({
            title: '清空失败子任务？',
            content: `将删除 ${targets.length} 个失败子任务记录。`,
            kind: 'task',
            onOk: () => {
              ref.children = (ref.children || []).filter((c) => c && !failedIds.has(c.id));
              this.syncBatchParentStatus(ref);
              if (this.selectedMaterialId && failedIds.has(this.selectedMaterialId)) {
                this.selectedMaterialId = null;
              }
              message.success(`已清空 ${targets.length} 个失败子任务`);
            },
          });
        },
        onBatchParentRerunMenu(key, raw) {
          if (key === 'rerun-all' || key === 'rerun-full') this.rerunBatchParentFull(raw);
          else if (key === 'rerun-failed-only' || key === 'rerun-continue') this.rerunBatchParentFailedOnly(raw);
          else if (key === 'clear-failed-only') this.clearBatchParentFailedOnly(raw);
          else if (key === 'rerun-task') this.workbenchTaskRowRerun(raw);
        },
        handleWorkbenchTaskCreate() {
          this.openWorkbenchTaskCreateModal();
        },
        submitWorkbenchTaskCreate() {
          const taskName = String(this.wbTaskCreateForm.taskName || '').trim();
          const skillId = String(this.wbTaskCreateForm.skillId || '').trim();
          const selected = this.wbTaskCreateForm.selectedResources || [];
          const instruction = String(this.wbTaskCreateForm.instruction || '').trim();
          const taskType = this.wbTaskCreateForm.taskType === 'batch' ? 'batch' : 'single';
          if (!taskName) {
            message.warning('请输入任务名称');
            return;
          }
          if (!skillId) {
            message.warning('请选择一个技能');
            return;
          }
          if (!instruction) {
            message.warning('请填写任务指令');
            return;
          }
          const resultOutput = resolveWbTaskCreateResultOutputFolder(
            this.wbTaskCreateForm.resultOutputFolderId,
            this.workbenchAnalysisResultFoldersList,
          );
          if (!String(this.wbTaskCreateForm.resultOutputFolderId || '').trim()) {
            message.warning('请选择结果输出位置');
            return;
          }
          if (!selected.length) {
            message.warning('请至少添加一个资源');
            return;
          }
          const skill = (this.workbenchProjectTemplates || []).find((tpl) => String(tpl.id) === skillId);
          const skillName = (skill && skill.name) || '';
          const resources = selected.map((row) => ({ ...row }));
          const resolvedResourceKeys = Array.from(new Set(
            resources.flatMap((row) => {
              const covered = Array.isArray(row.coveredResourceKeys) ? row.coveredResourceKeys : [];
              return covered.length ? covered : [row.key];
            }).filter(Boolean)
          ));
          const taskConfigResultOutput = {
            resultOutputFolderId: resultOutput.folderId,
            resultOutputFolderLabel: resultOutput.folderLabel,
            resolvedResourceKeys,
          };
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          if (taskType === 'batch') {
            const namingMode = this.wbTaskCreateForm.subtaskNamingMode === 'custom' ? 'custom' : 'same_as_object';
            const namingColumns = [...this.wbTaskCreateBatchNamingColumns];
            if (namingMode === 'custom' && !namingColumns.length) {
              message.warning('请选择子任务命名列');
              return;
            }
            const parentId = 'wb-task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
            const preview = window.DEMO_BATCH_DATASOURCE_PREVIEW || { rows: [] };
            const idColumns = [...this.wbTaskCreateBatchIdColumns];
            const idColumn = idColumns.join('、');
            const rowLabels = (preview.rows || []).slice(0, 8).map((row, i) => {
              const label = this.wbTaskCreateBatchRowLabel(row, preview, namingColumns);
              return label || `第 ${i + 1} 行`;
            });
            const children = rowLabels.map((rowLabel, i) => {
              const childId = parentId + '-c-' + (i + 1);
              const st = i < 2 ? 'done' : i === 3 ? 'parsing' : i === 6 ? 'failed' : 'queued';
              return {
                id: childId,
                type: 'analysis',
                title: rowLabel,
                status: st,
                taskType: 'batch-child',
                parentId,
                rowLabel,
                taskConfig: { skillId, skillName, resources, instruction, ...taskConfigResultOutput },
                projectSource: {
                  id: childId,
                  status: st,
                  createdAt: now,
                  sourceSkillName: skillName,
                  name: rowLabel,
                },
              };
            });
            const parentStatus = children.some((c) => c.status === 'parsing')
              ? 'parsing'
              : children.every((c) => c.status === 'done')
                ? 'done'
                : 'queued';
            const fileName = (this.wbTaskCreateForm.dataSourceFile && this.wbTaskCreateForm.dataSourceFile.name) || '数据源.xlsx';
            const created = {
              id: parentId,
              type: 'analysis',
              title: taskName,
              checked: false,
              taskType: 'batch',
              status: parentStatus,
              children,
              batchMeta: {
                fileName,
                idColumn,
                idColumns,
                subtaskNamingMode: namingMode,
                subtaskNamingColumns: namingColumns,
                total: children.length,
                instruction,
              },
              projectSource: {
                status: parentStatus,
                createdAt: now,
                sourceSkillName: skillName,
                name: taskName,
              },
              taskConfig: { skillId, skillName, resources, instruction, ...taskConfigResultOutput },
            };
            this.workbenchCreatedTasks = [created, ...(this.workbenchCreatedTasks || [])];
            this.closeWorkbenchTaskCreateModal();
            message.success(`跑批任务已创建，共 ${children.length} 个子任务`);
            return;
          }
          const taskId = 'wb-task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const status = 'queued';
          const created = {
            id: taskId,
            type: 'analysis',
            title: taskName,
            taskType: 'single',
            checked: false,
            projectSource: {
              status,
              createdAt: now,
              sourceSkillName: skillName,
              name: `${taskName} · 分析报告（排队中）`,
            },
            status,
            taskConfig: {
              skillId,
              skillName,
              resources,
              instruction,
              ...taskConfigResultOutput,
            },
          };
          this.workbenchCreatedTasks = [created, ...(this.workbenchCreatedTasks || [])];
          this.closeWorkbenchTaskCreateModal();
          message.success('任务已创建');
        },
        rerunWorkbenchDemoTask(m) {
          if (!m || !m.id) return;
          if (this.isWorkbenchBatchChildTask(m)) {
            if (!this.batchChildCanRerun(m)) return;
            this.openWorkbenchTaskRerunConfirm(m, 'batch-child');
            return;
          }
          this.openWorkbenchTaskRerunConfirm(m, 'task');
        },
        deleteWorkbenchDemoTask(m) {
          if (!m || !m.id) return;
          const isBatchParent = this.isWorkbenchBatchParentTask(m);
          const childCount = isBatchParent && Array.isArray(m.children) ? m.children.length : 0;
          window.dsConfirm.delete({
            title: isBatchParent ? '删除跑批任务？' : '删除任务？',
            kind: 'task',
            taskBatch: isBatchParent,
            onOk: () => {
              if (typeof demoWorkbenchTaskRows === 'undefined') return;
              const i = demoWorkbenchTaskRows.findIndex((x) => x && x.id === m.id);
              if (i < 0) return;
              demoWorkbenchTaskRows.splice(i, 1);
              if (this.wbActiveBatchParentId === m.id) {
                this.exitBatchChildListView();
              }
              if (this.selectedMaterialId === m.id) {
                this.closeWorkbenchMaterialDetail();
              }
              this.selectedTreeNode = null;
              message.success('任务已删除');
            },
          });
        }
  };
})();
