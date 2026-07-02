(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};

  const Modal = antd.Modal;
  const message = antd.message;
  const SKILL_CONFIRM_WRAP_CLASS = (window.dsConfirm && window.dsConfirm.WRAP_CLASS) || 'modal-w-520';
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

  function openSkillViewModalConfirm(opts) {
    const options = opts || {};
    if (!Modal || typeof Modal.confirm !== 'function') {
      if (typeof options.onOk === 'function') return options.onOk();
      return;
    }
    return Modal.confirm({
      wrapClassName: SKILL_CONFIRM_WRAP_CLASS,
      title: options.title || '',
      content: options.content || '',
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      centered: true,
      icon: null,
      okButtonProps: options.danger ? { danger: true } : undefined,
      onOk: options.onOk,
      onCancel: options.onCancel,
    });
  }

  function openSkillViewDeleteConfirm(opts) {
    const options = opts || {};
    const subject = String(options.subject || '该技能').trim() || '该技能';
    return openSkillViewModalConfirm({
      title: `删除${subject}？`,
      content: options.content || '删除后不可恢复，请确认是否删除？',
      okText: options.okText || '删除',
      cancelText: options.cancelText || '取消',
      danger: true,
      onOk: options.onOk,
      onCancel: options.onCancel,
    });
  }

  function resolveWorkbenchV2ShellVm(hostContext) {
    const host = hostContext || null;
    if (host && host.__workbenchV2ShellSyncVm) return host.__workbenchV2ShellSyncVm;
    if (typeof window !== 'undefined' && window.__DEMO_FREEAUDIT_CAPABILITY_HOST) {
      return window.__DEMO_FREEAUDIT_CAPABILITY_HOST.__workbenchV2ShellSyncVm || null;
    }
    return null;
  }

  function promptSharedSkillSyncAfterWorkbenchSave(hostContext, skill) {
    if (!skill) return;
    const shell = resolveWorkbenchV2ShellVm(hostContext);
    if (!shell || typeof shell.v2SkillCardIsShared !== 'function' || typeof shell.updateSharedSkillCard !== 'function') return;
    if (!shell.v2SkillCardIsShared({ raw: skill })) return;
    shell.updateSharedSkillCard(skill);
  }

  NS.actionGroups = NS.actionGroups || {};
  NS.actionGroups.skillActions = {
        onWbTaskCreateSkillChange() {
          this.syncWbTaskCreateInstructionFromSkill();
        },
        syncWbTaskCreateInstructionFromSkill() {
          this.clearWbTaskCreateInstructionTimer();
          if (!this.wbTaskCreateInstructionPrerequisitesMet()) {
            this.wbTaskCreateInstructionState = 'idle';
            this.wbTaskCreateForm.instruction = '';
            return;
          }
          this.wbTaskCreateInstructionState = 'generating';
          this.wbTaskCreateForm.instruction = '';
          const token = (this._wbTaskCreateInstructionGenToken = Date.now());
          this._wbTaskCreateInstructionTimer = setTimeout(() => {
            this._wbTaskCreateInstructionTimer = null;
            if (this._wbTaskCreateInstructionGenToken !== token) return;
            if (!this.wbTaskCreateInstructionPrerequisitesMet()) {
              this.wbTaskCreateInstructionState = 'idle';
              this.wbTaskCreateForm.instruction = '';
              return;
            }
            this.wbTaskCreateForm.instruction = this.buildWbTaskCreateInstructionText();
            this.wbTaskCreateInstructionState = 'ready';
          }, 720);
        },
        toggleWbSkillSearchPanel() {
          this.wbSkillSidebarSearchOpen = !this.wbSkillSidebarSearchOpen;
          if (!this.wbSkillSidebarSearchOpen) this.wbSkillSidebarSearchKeyword = '';
        },
        getSkillAnalysisRulePlaceholder() {
          if (typeof window !== 'undefined' && typeof window.__demoGetSkillAnalysisRulePlaceholder === 'function') {
            return window.__demoGetSkillAnalysisRulePlaceholder();
          }
          return (typeof window !== 'undefined' && window.__DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER) || '';
        },
        freeAuditPolishUndoDisabled(key) {
          return (
            !!this.freeAuditAiPolishKey || !Object.prototype.hasOwnProperty.call(this.freeAuditPolishUndo, key)
          );
        },
        beginFreeAuditAiPolish(key, getText, setText, onDone) {
          if (this.freeAuditAiPolishKey) return;
          this.freeAuditPolishUndo[key] = String(getText() == null ? '' : getText());
          this.freeAuditAiPolishKey = key;
          window.setTimeout(() => {
            const sample =
              typeof window.__demoPolishSampleForKey === 'function' ? window.__demoPolishSampleForKey(key) : '';
            setText(sample);
            this.freeAuditAiPolishKey = '';
            if (typeof onDone === 'function') onDone();
          }, 1300);
        },
        undoFreeAuditPolish(key, setText, onDone) {
          if (this.freeAuditAiPolishKey) return;
          if (key.startsWith('wb-') && this.wbProjectSkillConfigTabLocked) return;
          if (!Object.prototype.hasOwnProperty.call(this.freeAuditPolishUndo, key)) return;
          const prev = this.freeAuditPolishUndo[key];
          delete this.freeAuditPolishUndo[key];
          setText(prev);
          if (typeof onDone === 'function') onDone();
        },
        demoAiPolishSummaryTaskName() {
          this.beginFreeAuditAiPolish(
            'summary:name',
            () => this.summaryTaskResultForm.name,
            (t) => {
              this.summaryTaskResultForm.name = t;
            }
          );
        },
        undoSummaryTaskName() {
          this.undoFreeAuditPolish('summary:name', (t) => {
            this.summaryTaskResultForm.name = t;
          });
        },
        demoAiPolishSummaryTaskAnalysisRule() {
          this.beginFreeAuditAiPolish(
            'summary:analysisRule',
            () => this.summaryTaskResultForm.analysisRule,
            (t) => {
              this.summaryTaskResultForm.analysisRule = t;
            }
          );
        },
        undoSummaryTaskAnalysisRule() {
          this.undoFreeAuditPolish('summary:analysisRule', (t) => {
            this.summaryTaskResultForm.analysisRule = t;
          });
        },
        demoAiPolishSummaryErField(er, field) {
          const key = 'summary-er:' + er.id + ':' + field;
          this.beginFreeAuditAiPolish(
            key,
            () => er[field],
            (t) => {
              er[field] = t;
            }
          );
        },
        undoSummaryErField(er, field) {
          const key = 'summary-er:' + er.id + ':' + field;
          this.undoFreeAuditPolish(key, (t) => {
            er[field] = t;
          });
        },
        demoAiPolishWbSkillFileField(file, field) {
          if (this.wbProjectSkillConfigTabLocked || !file) return;
          const short = field === 'filename' ? 'fn' : 'ct';
          const key = 'wb-sf:' + file.id + ':' + short;
          this.beginFreeAuditAiPolish(
            key,
            () => (field === 'filename' ? file.filename : file.content),
            (t) => {
              if (field === 'filename') file.filename = t;
              else file.content = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        undoWbSkillFileField(file, field) {
          if (this.wbProjectSkillConfigTabLocked || !file) return;
          const short = field === 'filename' ? 'fn' : 'ct';
          const key = 'wb-sf:' + file.id + ':' + short;
          this.undoFreeAuditPolish(
            key,
            (t) => {
              if (field === 'filename') file.filename = t;
              else file.content = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        demoAiPolishWbAnalysisRule() {
          if (this.wbProjectSkillConfigTabLocked) return;
          const s = this.wbDetailSelectedSkill;
          if (!s) return;
          this.beginFreeAuditAiPolish(
            'wb-analysisRule',
            () => s.analysisRule,
            (t) => {
              s.analysisRule = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        undoWbAnalysisRule() {
          if (this.wbProjectSkillConfigTabLocked) return;
          const s = this.wbDetailSelectedSkill;
          if (!s) return;
          this.undoFreeAuditPolish(
            'wb-analysisRule',
            (t) => {
              s.analysisRule = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        demoAiPolishWbProjectAuditRuleField(er, field) {
          if (this.wbProjectSkillConfigTabLocked || !er) return;
          const key = 'wb-project-er:' + er.id + ':' + field;
          this.beginFreeAuditAiPolish(
            key,
            () => er[field],
            (t) => {
              er[field] = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        undoWbProjectAuditRuleField(er, field) {
          if (this.wbProjectSkillConfigTabLocked || !er) return;
          const key = 'wb-project-er:' + er.id + ':' + field;
          this.undoFreeAuditPolish(
            key,
            (t) => {
              er[field] = t;
            },
            () => this.scheduleWbProjectSkillDetailSync()
          );
        },
        demoAiPolishWbProjectAnalysisRule() {
          this.demoAiPolishWbAnalysisRule();
        },
        undoWbProjectAnalysisRule() {
          this.undoWbAnalysisRule();
        },
        wbOpenTaskDetailSkill() {
          const m = this.selectedMaterial;
          if (!m || !m.taskConfig) return;
          const tc = m.taskConfig;
          if (tc.taskType === 'generate-skill' || String(tc.skillId || '').trim() === 'generate-skill') {
            message.info('生成技能类任务请在左侧技能栏查看产物');
            return;
          }
          const pid = this.workbenchProjectId;
          const sid = String(tc.skillId || '').trim();
          if (!pid || !sid) return;
          this.openWbProjectSkillDetail({ id: sid }, { readOnly: true });
        },
        buildGenerateSkillTaskDialogTurnsSnapshot(m) {
          const tc = (m && m.taskConfig) || {};
          const intent = String(tc.intent || '').trim() || '（未填写生成技能要求）';
          const title = String(m.title || '任务').trim() || '任务';
          const st = this.workbenchAnalysisStatusOf(m);
          const outSkill = String(tc.outputSkillName || tc.generatedSkillName || '').trim()
            || this.wbTaskDetailStripDemoLabel((m.projectSource && m.projectSource.name) || '') || '可复用技能草稿';
          const idBase = String(m.id || 'task');
          const turns = [];
          turns.push({
            id: `${idBase}-gs-u1`,
            role: 'user',
            text: `【生成技能要求】\n\n${intent}`,
          });
          if (st === 'queued') {
            turns.push({
              id: `${idBase}-gs-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `已接收「${title}」，将把对话与面板上下文一并送入技能生成管线。` },
                { type: 'text', body: `目标产物技能：${outSkill}` },
                { type: 'action', label: '等待调度：生成技能任务在队列中', status: 'running' },
              ],
            });
            turns.push({
              id: `${idBase}-gs-b1`,
              role: 'bot',
              text: '任务已进入队列；绑定工作台上下文与引用摘要后，将按生成要求产出可复用技能草稿。',
            });
            return turns;
          }
          if (st === 'parsing') {
            turns.push({
              id: `${idBase}-gs-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `正在根据生成要求提炼技能结构：${outSkill}` },
                { type: 'text', body: '已载入当前对话与引用资料摘要作为上下文。' },
                { type: 'action', label: '解析生成要求并生成技能元数据', status: 'ok' },
                { type: 'action', label: '对齐工作台资料边界与输出模板', status: 'running' },
              ],
            });
            turns.push({
              id: `${idBase}-gs-b1`,
              role: 'bot',
              text: '正在生成技能：规则段落、引用位与复核要点写入中，完成后将出现在左侧技能栏。',
            });
            return turns;
          }
          if (st === 'failed') {
            turns.push({
              id: `${idBase}-gs-think`,
              role: 'thinking',
              toolCalls: [
                { type: 'text', body: `尝试根据生成要求生成技能：${outSkill}` },
                { type: 'text', body: '已载入工作台上下文与引用摘要。' },
                { type: 'action', label: '解析生成要求并生成技能元数据', status: 'ok' },
                { type: 'action', label: '写入技能草稿与引用模板', status: 'fail' },
              ],
            });
            turns.push({
              id: `${idBase}-gs-b1`,
              role: 'bot',
              text: '生成失败：技能草稿未能落库。可在任务更多菜单中重试，或微调生成要求后再次创建任务。',
            });
            return turns;
          }
          turns.push({
            id: `${idBase}-gs-think`,
            role: 'thinking',
            toolCalls: [
              { type: 'text', body: `已根据生成要求产出技能：${outSkill}` },
              { type: 'text', body: '已合并对话上下文与引用资料摘要。' },
              { type: 'action', label: '解析生成要求并生成技能元数据', status: 'ok' },
              { type: 'action', label: '写入技能草稿、引用位与复核要点', status: 'ok' },
              { type: 'action', label: '同步到工作台技能列表', status: 'ok' },
            ],
          });
          turns.push({
            id: `${idBase}-gs-b1`,
            role: 'bot',
            text: `技能已生成。可在左侧技能栏打开「${outSkill}」查看配置，并与资料建立关联后复用。`,
          });
          return turns;
        },
        onWorkbenchFileTreeRawMenu(key, d) {
          if (key === 'bulk-select') {
            this.startWorkbenchBulkSelection(this.workbenchBulkMaterialFileDescriptor(d));
            return;
          }
          const m = this.wbMaterialVmById(d && d.materialId);
          if (!m) return;
          this.handleWorkbenchMaterialAction(key, m);
        },
        chatAtRawMaterialDisplayTitle(m) {
          if (!m) return '';
          const row = m.projectSource || {};
          const folders = this.workbenchMaterialFoldersList || [];
          const prefix = wbMatMaterialPathPrefixForRow(row, folders);
          const title = String(m.title != null ? m.title : m.name != null ? m.name : '未命名').trim() || '未命名';
          return prefix ? `${prefix}${title}` : title;
        },
        onWorkbenchTemplateAddMenu(info) {
          const key = info && info.key;
          if (key === 'library') {
            this.openTemplateLibrary();
            return;
          }
          if (key === 'new') {
            const pid = this.workbenchProjectId;
            if (!pid) {
              message.warning('请先通过工作台进入本工作台的审计助手后再创建技能');
              return;
            }
            this.openWbProjectSkillCreateBasicModal();
          }
        },
        openTemplateLibrary() {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先通过工作台进入本工作台的审计助手后再引用技能');
            return;
          }
          const openWithBridge = () => {
            const bridge = window.__demoQuoteSkillBridge;
            if (bridge && typeof bridge.openForWorkbenchProject === 'function') {
              bridge.openForWorkbenchProject(pid);
              return true;
            }
            return false;
          };
          if (openWithBridge()) return;
          const ensureBridge = typeof window.__demoEnsureProjectAssistShellMounted === 'function'
            ? window.__demoEnsureProjectAssistShellMounted()
            : Promise.resolve();
          Promise.resolve(ensureBridge).then(() => {
            if (openWithBridge()) return;
            message.warning('引用技能面板暂不可用，请稍后重试');
          });
        },
        selectWorkbenchSkillTemplate(node) {
          if (!node || !node.key) return;
          if (this.isWbProjectSkillSummarizing(node.raw)) {
            message.info('该工作台技能正在总结中，暂不可引用');
            return;
          }
          this.wbSelectedTemplateKey = this.wbSelectedTemplateKey === node.key ? '' : node.key;
        },
        onWbSkillTreeLeafContextMenu(node) {
          if (!node || !node.key) return;
          this.wbSkillTreeActionMenuKey = node.key;
        },
        onWbSkillTreeActionMenuOpenUpdate(open, node) {
          if (open) {
            this.wbSkillTreeActionMenuKey = node && node.key ? node.key : null;
          } else if (node && node.key && this.wbSkillTreeActionMenuKey === node.key) {
            this.wbSkillTreeActionMenuKey = null;
          }
        },
        onWbProjectSkillTreeMenu(info, node) {
          const key = info && info.key;
          const tpl = node && node.raw;
          if (!tpl) return;
          if (this.isWbProjectSkillSummarizing(tpl) && key !== 'delete') {
            message.info('该工作台技能正在总结中，完成后可查看与操作');
            return;
          }
          if (key === 'cite') {
            const name = String(tpl.name != null ? tpl.name : '未命名').trim() || '未命名';
            this.appendChatInputToken('/' + name);
          } else if (key === 'archive') {
            this.wbArchiveProjectTemplatesToMyLibrary([tpl]);
          } else if (key === 'delete') {
            this.wbDeleteProjectAnalysisTemplate(tpl, node.key);
          }
        },
        wbArchiveProjectTemplatesToMyLibrary(templates) {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          const selected = (templates || []).filter(Boolean);
          if (!selected.length) {
            message.warning('没有可入库的技能');
            return;
          }
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const privatePool = this.analysisTemplatePool.private || [];
          const usedIds = new Set(privatePool.map((x) => x.id));
          const inserted = [];
          selected.forEach((tpl) => {
            let newId = typeof newSkillId === 'function' ? newSkillId('priv-arch') : 'priv-arch-' + Date.now();
            while (usedIds.has(newId)) {
              newId = typeof newSkillId === 'function' ? newSkillId('priv-arch') : newId + 'x';
            }
            usedIds.add(newId);
            let skillFiles = [];
            if (typeof window.DemoSkillFileTree !== 'undefined' && window.DemoSkillFileTree.remapSkillFilesTree) {
              skillFiles = window.DemoSkillFileTree.remapSkillFilesTree(tpl.skillFiles || []);
            } else if (Array.isArray(tpl.extractionRules) && tpl.extractionRules.length) {
              skillFiles = tpl.extractionRules.map((r, ri) => ({
                id: newId + '-sf' + (ri + 1),
                kind: 'file',
                fileKind: 'md',
                codeLang: '',
                filename: (String(r.title || '').trim() || '条目' + (ri + 1)) + '.md',
                content: String(r.body || ''),
              }));
            }
            const row = {
              id: newId,
              name: tpl.name,
              description: (tpl.description != null ? tpl.description : '') || '',
              tags: Array.isArray(tpl.tags) ? tpl.tags.slice() : [],
              skillFiles,
              extractionRules: [],
              analysisRule: tpl.analysisRule || '',
              applicableScenario: tpl.applicableScenario != null ? String(tpl.applicableScenario) : '',
              createdAt: now,
              updatedAt: now,
              library: 'private',
              publishedVersions: [],
              sourceSkillId: tpl.id,
              sourceLibrary: 'project',
              sourceSkillName: tpl.name || tpl.id,
              sourceVersionLabel: '工作台实例',
            };
            if (typeof window.DemoSkillFileTree !== 'undefined' && window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
              window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
            }
            inserted.push(row);
          });
          const priv = this.analysisTemplatePool.private || [];
          inserted.forEach((row) => priv.push(row));
          message.success(`已将 ${inserted.length} 个技能入库到「我的技能」`);
        },
        wbDeleteProjectAnalysisTemplate(template, nodeKey) {
          if (!template || !this.workbenchProjectId) return;
          const id = String(template.id || '');
          const pid = this.workbenchProjectId;
          openSkillViewDeleteConfirm({
            subject: '该技能',
            onOk: () => {
              const taskId = this.summarySkillTaskByTemplateId && this.summarySkillTaskByTemplateId[id];
              if (taskId) {
                this._clearSummaryTaskTimers(taskId);
                this.summaryTemplateTasks = (this.summaryTemplateTasks || []).filter((x) => x.id !== taskId);
                const map = { ...(this.summarySkillTaskByTemplateId || {}) };
                delete map[id];
                this.summarySkillTaskByTemplateId = map;
              }
              const list = demoProjectAnalysisTemplatesById[pid] || [];
              demoProjectAnalysisTemplatesById[pid] = list.filter((x) => String(x.id) !== id);
              if (nodeKey && this.wbSelectedTemplateKey === nodeKey) this.wbSelectedTemplateKey = '';
              if (String(this.wbProjectSkillDetailId) === id) {
                this._wbProjectSkillModalSnapshot = null;
                this.closeWbProjectSkillDetailModal(false);
              }
              message.success('技能已删除');
            },
          });
        },
        openWbProjectSkillDetailFromNode(node, options) {
          if (!node || !node.raw) return;
          if (this.isWbProjectSkillSummarizing(node.raw)) {
            message.info('该工作台技能正在总结中，完成后可查看');
            return;
          }
          const readOnly = !!(options && options.readOnly);
          const forceModal = !!(options && options.forceModal);
          const panel = options && options.panel;
          this.openWbProjectSkillDetail(node.raw, { readOnly, forceModal, panel });
        },
        isWbProjectSkillSummarizing(template) {
          const id = template && template.id ? String(template.id) : '';
          if (!id) return false;
          return !!(this.summarySkillTaskByTemplateId && this.summarySkillTaskByTemplateId[id]);
        },
        normalizeWbProjectSkillKind(source) {
          const raw = source && typeof source === 'object' ? source.skillKind : source;
          return String(raw || '').trim() === 'general' ? 'general' : 'audit';
        },
        syncWbProjectSkillFormFromSkill(s) {
          if (!s) return;
          const dimensionValues = s.dimensionValues && typeof s.dimensionValues === 'object'
            ? s.dimensionValues
            : {};
          this.wbProjectSkillForm = {
            id: s.id,
            name: s.name || '',
            skillKind: this.normalizeWbProjectSkillKind(s),
            description: s.description != null ? String(s.description) : '',
            skillType: String(dimensionValues.skillType || s.skillType || '').trim(),
            auditScene: String(dimensionValues.auditScene || s.auditScene || '').trim(),
            skillInputs: Array.isArray(s.skillInputs) ? [...s.skillInputs] : [],
            outputSummary: s.outputSummary != null ? String(s.outputSummary) : '',
          };
        },
        syncWbProjectSkillDimensionValues(skill, values) {
          if (!skill) return;
          const rows = Array.isArray(this.wbProjectSkillCategoryRows) && this.wbProjectSkillCategoryRows.length
            ? this.wbProjectSkillCategoryRows
            : [{ id: 'auditScene' }, { id: 'skillType' }];
          const next = skill.dimensionValues && typeof skill.dimensionValues === 'object'
            ? { ...skill.dimensionValues }
            : {};
          rows.forEach((category) => {
            const categoryId = String((category && category.id) || '').trim();
            if (!categoryId) return;
            const value = String((values && values[categoryId]) || '').trim();
            if (value) next[categoryId] = value;
            else delete next[categoryId];
            if (categoryId === 'auditScene') skill.auditScene = value;
            if (categoryId === 'skillType') skill.skillType = value;
          });
          skill.dimensionValues = next;
        },
        syncWbProjectSkillFormToSelected() {
          const s = this.wbDetailSelectedSkill;
          if (!s || this.wbProjectSkillDetailReadOnly) return;
          const name = String(this.wbProjectSkillForm.name || '').trim();
          const skillKind = this.normalizeWbProjectSkillKind(this.wbProjectSkillForm.skillKind);
          const desc = String(this.wbProjectSkillForm.description || '').trim();
          const skillType = String(this.wbProjectSkillForm.skillType || '').trim();
          const auditScene = String(this.wbProjectSkillForm.auditScene || '').trim();
          const skillInputs = [...(this.wbProjectSkillForm.skillInputs || [])].map((t) => String(t).trim()).filter(Boolean);
          const outputSummary = String(this.wbProjectSkillForm.outputSummary || '').trim();
          s.name = name;
          s.skillKind = skillKind;
          s.description = desc;
          s.skillInputs = Array.from(new Set(skillInputs));
          s.outputSummary = outputSummary;
          this.syncWbProjectSkillDimensionValues(s, { skillType, auditScene });
        },
        validateWbProjectGeneralSkillConfigForSave() {
          const s = this.wbDetailSelectedSkill;
          if (!s) return false;
          this.ensureWbProjectGeneralSkillFiles(s);
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (T && T.findDuplicatePaths) {
            const dups = T.findDuplicatePaths(s.skillFiles || []);
            if (dups.length) {
              message.warning('文件名路径重复：' + dups.join('、'));
              return false;
            }
          }
          if (!String(s.analysisRule || '').trim()) {
            message.warning('请填写 skill.md 文件内容');
            return false;
          }
          let bad = false;
          const walk = (nodes) => {
            (nodes || []).forEach((node) => {
              if (!node) return;
              if (node.kind === 'folder') {
                if (!String(node.name || '').trim()) bad = true;
                walk(node.children);
              } else if (node.kind === 'file') {
                if (!String(node.filename || '').trim() || !String(node.content || '').trim()) bad = true;
              }
            });
          };
          walk(s.skillFiles || []);
          if (bad) {
            message.warning('每个文件夹须有名称；每个文件须填写文件名与具体内容');
            return false;
          }
          return true;
        },
        ensureWbProjectGeneralSkillFiles(skill) {
          const s = skill || this.wbDetailSelectedSkill;
          if (!s) return [];
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (T && T.ensureSkillFiles) T.ensureSkillFiles(s);
          else if (!Array.isArray(s.skillFiles)) s.skillFiles = [];
          if (!String(s.analysisRule || '').trim() && String(s.generalConfigInstruction || '').trim()) {
            s.analysisRule = String(s.generalConfigInstruction || '').trim();
          }
          s.generalConfigFileName = 'skill.md';
          return s.skillFiles || [];
        },
        ensureWbProjectAuditSkillRules(skill) {
          const s = skill || this.wbDetailSelectedSkill;
          if (!s) return [];
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          let rules = Array.isArray(s.extractionRules) ? s.extractionRules : [];
          if (!rules.length && T && typeof T.flattenToExtractionRules === 'function') {
            rules = T.flattenToExtractionRules(s);
          }
          rules = (Array.isArray(rules) ? rules : []).map((rule) => ({
            id: rule && rule.id ? String(rule.id) : newSkillId('er'),
            title: String((rule && rule.title) || ''),
            body: String((rule && rule.body) || ''),
            materialIds: Array.isArray(rule && rule.materialIds)
              ? Array.from(new Set(rule.materialIds.map((id) => String(id))))
              : [],
          }));
          if (!rules.length) {
            rules = [{ id: newSkillId('er'), title: '', body: '', materialIds: [] }];
          }
          s.extractionRules = rules;
          return s.extractionRules;
        },
        getWbProjectAuditSkillRules(skill) {
          const s = skill || this.wbDetailSelectedSkill;
          return s && Array.isArray(s.extractionRules) ? s.extractionRules : [];
        },
        syncWbProjectAuditSkillFilesFromRules(skill) {
          const s = skill || this.wbDetailSelectedSkill;
          if (!s) return [];
          const rules = this.ensureWbProjectAuditSkillRules(s).map((rule) => this.wbNormalizeRuleForProjectTemplate(rule));
          s.extractionRules = rules;
          s.skillFiles = rules.map((rule) => ({
            id: String(rule.id || newSkillId('sf')),
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: String(rule.title || ''),
            content: String(rule.body || ''),
            materialIds: Array.isArray(rule.materialIds)
              ? Array.from(new Set(rule.materialIds.map((id) => String(id))))
              : [],
          }));
          s.manualMaterialIds = Array.from(
            new Set(
              rules.flatMap((rule) => (
                Array.isArray(rule.materialIds) ? rule.materialIds.map((id) => String(id)) : []
              ))
            )
          );
          return s.skillFiles;
        },
        validateWbProjectAuditSkillConfigForSave() {
          const s = this.wbDetailSelectedSkill;
          if (!s) return false;
          const rules = this.ensureWbProjectAuditSkillRules(s);
          for (let i = 0; i < rules.length; i += 1) {
            if (!String(rules[i].title || '').trim()) {
              message.warning(`请填写第 ${i + 1} 个分析对象的材料类型名称`);
              return false;
            }
            if (!String(rules[i].body || '').trim()) {
              message.warning(`请填写第 ${i + 1} 个分析对象的关键信息抽取规则`);
              return false;
            }
          }
          if (!String(s.analysisRule || '').trim()) {
            message.warning('请填写分析规则');
            return false;
          }
          return true;
        },
        validateWbProjectSkillFilesForSave() {
          return window.DemoSkillConfig.validateSkillFilesForSave(this.wbDetailSelectedSkill, message);
        },
        hydrateWbProjectSkillForModal(target) {
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (!target) return target;
          if (this.normalizeWbProjectSkillKind(target) === 'general') {
            if (!Array.isArray(target.extractionRules)) target.extractionRules = [];
            this.ensureWbProjectGeneralSkillFiles(target);
            return target;
          }
          this.ensureWbProjectAuditSkillRules(target);
          if (T && T.ensureSkillFiles) T.ensureSkillFiles(target);
          this.syncWbProjectAuditSkillFilesFromRules(target);
          return target;
        },
        normalizeWbProjectSkillReadonlyPreview(template) {
          if (!template) return null;
          let target = null;
          if (typeof demoSeedToAnalysisTemplateShape === 'function') {
            target = demoSeedToAnalysisTemplateShape(template, template.library || 'public');
          } else {
            target = JSON.parse(JSON.stringify(template));
          }
          if (!target.id) target.id = template.id || ('preview-' + Date.now().toString(36));
          if (!target.library) target.library = template.library || 'public';
          return this.hydrateWbProjectSkillForModal(target);
        },
        refreshWbProjectSkillModalSnapshotAfterPaneSave() {
          const s = this.wbDetailSelectedSkill;
          const pid = this.workbenchProjectId;
          if (!s || !pid) return;
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const f = list.find((x) => String(x.id) === String(s.id));
          if (f) this._wbProjectSkillModalSnapshot = window.DemoSkillConfig.skillSnapshot(f);
        },
        captureWbProjectSkillBasicPaneSnap() {
          if (this.wbProjectSkillDetailReadOnly) return;
          this._wbProjectSkillBasicPaneSnap = window.DemoSkillConfig.basicSnapshot(this.wbProjectSkillForm);
        },
        captureWbProjectSkillConfigPaneSnap() {
          const s = this.wbDetailSelectedSkill;
          if (!s || this.wbProjectSkillDetailReadOnly) return;
          this._wbProjectSkillConfigPaneSnap = window.DemoSkillConfig.skillSnapshot(s);
        },
        captureWbProjectSkillPaneSnapshotsAfterOpen() {
          if (this.wbProjectSkillDetailReadOnly) {
            this._wbProjectSkillBasicPaneSnap = null;
            this._wbProjectSkillConfigPaneSnap = null;
            return;
          }
          this.captureWbProjectSkillBasicPaneSnap();
          this.captureWbProjectSkillConfigPaneSnap();
        },
        cancelWbProjectSkillBasicPaneEdit() {
          const snap = this._wbProjectSkillBasicPaneSnap;
          if (snap) {
            this.wbProjectSkillForm.name = snap.name;
            this.wbProjectSkillForm.skillKind = snap.skillKind || '';
            this.wbProjectSkillForm.description = snap.description;
            this.wbProjectSkillForm.skillType = snap.skillType || '';
            this.wbProjectSkillForm.auditScene = snap.auditScene || '';
            this.wbProjectSkillForm.skillInputs = snap.skillInputs ? [...snap.skillInputs] : [];
            this.wbProjectSkillForm.outputSummary = snap.outputSummary || '';
          }
          this.captureWbProjectSkillBasicPaneSnap();
        },
        closeWbProjectSkillBasicModal(fromSave) {
          const saved = fromSave === true;
          const createCommitted = this._wbProjectSkillCreateCommitted;
          if (this._wbProjectSkillDetailSyncTimer) {
            window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
            this._wbProjectSkillDetailSyncTimer = null;
          }
          const templateId = this.wbProjectSkillDetailId;
          const pid = this.workbenchProjectId;
          const wasCreate = this.wbProjectSkillDetailModalIsCreate;
          const wasReadOnly = this.wbProjectSkillDetailReadOnly;
          if (!saved && pid) {
            if (wasCreate && templateId && !createCommitted) {
              const list = demoProjectAnalysisTemplatesById[pid] || [];
              demoProjectAnalysisTemplatesById[pid] = list.filter((x) => String(x.id) !== String(templateId));
            } else if (!wasReadOnly && this._wbProjectSkillModalSnapshot && templateId) {
              const list = demoProjectAnalysisTemplatesById[pid] || [];
              const idx = list.findIndex((x) => String(x.id) === String(templateId));
              if (idx >= 0) {
                list.splice(idx, 1, JSON.parse(JSON.stringify(this._wbProjectSkillModalSnapshot)));
                demoProjectAnalysisTemplatesById[pid] = [...list];
              }
            }
          }
          this._wbProjectSkillModalSnapshot = null;
          this.wbProjectSkillReadonlyPreview = null;
          this.wbProjectSkillDetailModalIsCreate = false;
          this.wbProjectSkillBasicModalOpen = false;
          this.wbProjectSkillDetailReadOnly = false;
          this.wbProjectSkillDetailId = '';
          this.wbProjectSkillDetailActiveTab = 'basic';
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this.wbProjectSkillAuditExpandedRuleId = '';
          this._wbProjectSkillCreateCommitted = false;
        },
        onWbProjectSkillBasicModalCancel() {
          if (this.wbProjectSkillBasicPaneDirty) {
            openSkillViewModalConfirm({
              title: '有未保存的编辑',
              content: '关闭后将放弃未保存的修改，是否继续？',
              okText: '放弃并关闭',
              cancelText: '留在本页',
              onOk: () => this.closeWbProjectSkillBasicModal(false),
            });
            return;
          }
          this.closeWbProjectSkillBasicModal(false);
        },
        saveWbProjectSkillBasicPane() {
          if (this.wbProjectSkillDetailReadOnly) return;
          const name = String(this.wbProjectSkillForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
          const rawSkillKind = String(this.wbProjectSkillForm.skillKind || '').trim();
          const allowedSkillKinds = new Set((this.wbProjectSkillKindOptions || []).map((item) => String(item.id)));
          if (rawSkillKind && !allowedSkillKinds.has(rawSkillKind)) {
            message.warning('所选技能类型已失效，请重新选择');
            return;
          }
          this.wbProjectSkillForm.skillKind = this.normalizeWbProjectSkillKind(rawSkillKind);
          const skillType = String(this.wbProjectSkillForm.skillType || '').trim();
          const allowedType = new Set((this.wbProjectSkillTypeDimensionOptions || []).map((item) => String(item.id)));
          if (skillType && !allowedType.has(skillType)) {
            message.warning('所选' + this.wbProjectSkillDimensionFieldLabel + '已不在分类设置中，请重新选择');
            return;
          }
          const auditScene = String(this.wbProjectSkillForm.auditScene || '').trim();
          const allowedScene = new Set((this.wbProjectAuditSceneDimensionOptions || []).map((item) => String(item.id)));
          if (auditScene && !allowedScene.has(auditScene)) {
            message.warning('所选' + this.wbProjectAuditSceneCategoryLabel + '已不在分类设置中，请重新选择');
            return;
          }
          if (this._wbProjectSkillDetailSyncTimer) {
            window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
            this._wbProjectSkillDetailSyncTimer = null;
          }
          this.syncWbProjectSkillFormToSelected();
          this.syncWbProjectSkillDetailNow();
          const s = this.wbDetailSelectedSkill;
          this._wbProjectSkillCreateCommitted = true;
          this.refreshWbProjectSkillModalSnapshotAfterPaneSave();
          this.captureWbProjectSkillPaneSnapshotsAfterOpen();
          if (this.wbProjectSkillDetailModalIsCreate) this.wbProjectSkillDetailModalIsCreate = false;
          message.success('保存成功');
          promptSharedSkillSyncAfterWorkbenchSave(this, s);
        },
        cancelWbProjectSkillConfigPaneEdit() {
          const snap = this._wbProjectSkillConfigPaneSnap;
          const pid = this.workbenchProjectId;
          if (snap && pid) {
            const list = demoProjectAnalysisTemplatesById[pid] || [];
            const idx = list.findIndex((x) => String(x.id) === String(snap.id));
            if (idx >= 0) {
              list.splice(idx, 1, JSON.parse(JSON.stringify(snap)));
              demoProjectAnalysisTemplatesById[pid] = [...list];
            }
          }
          this.$nextTick(() => {
            this.captureWbProjectSkillConfigPaneSnap();
            this.ensureWbProjectSkillFirstObjectExpanded();
          });
        },
        saveWbProjectSkillConfigPane() {
          if (this.wbProjectSkillDetailReadOnly) return;
          if (this.normalizeWbProjectSkillKind(this.wbDetailSelectedSkill) === 'general') {
            if (!this.validateWbProjectGeneralSkillConfigForSave()) return;
          } else if (!this.validateWbProjectAuditSkillConfigForSave()) {
            return;
          }
          if (this._wbProjectSkillDetailSyncTimer) {
            window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
            this._wbProjectSkillDetailSyncTimer = null;
          }
          this.syncWbProjectSkillFormToSelected();
          this.syncWbProjectSkillDetailNow();
          const s = this.wbDetailSelectedSkill;
          this._wbProjectSkillCreateCommitted = true;
          this.refreshWbProjectSkillModalSnapshotAfterPaneSave();
          this.captureWbProjectSkillPaneSnapshotsAfterOpen();
          if (this.wbProjectSkillDetailModalIsCreate) this.wbProjectSkillDetailModalIsCreate = false;
          message.success('保存成功');
          promptSharedSkillSyncAfterWorkbenchSave(this, s);
        },
        startWbProjectSkillResourcePaneEdit() {
          if (this.wbProjectSkillDetailReadOnly) return;
          const s = this.wbDetailSelectedSkill;
          if (!s) return;
          this._wbProjectSkillResourcePaneSnap = this.getWbSkillLinkedResourceIds(s);
          this.wbProjectSkillResourcePaneEditing = true;
        },
        cancelWbProjectSkillResourcePaneEdit() {
          const s = this.wbDetailSelectedSkill;
          if (s && Array.isArray(this._wbProjectSkillResourcePaneSnap)) {
            s.linkedResourceIds = this._wbProjectSkillResourcePaneSnap.slice();
          }
          this._wbProjectSkillResourcePaneSnap = null;
          this.wbProjectSkillResourcePaneEditing = false;
        },
        saveWbProjectSkillResourcePane() {
          if (this.wbProjectSkillDetailReadOnly) return;
          const s = this.wbDetailSelectedSkill;
          if (!s) return;
          s.linkedResourceIds = this.getWbSkillLinkedResourceIds(s);
          this.syncWbProjectSkillDetailNow();
          this._wbProjectSkillCreateCommitted = true;
          this.refreshWbProjectSkillModalSnapshotAfterPaneSave();
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillResourcePaneSnap = null;
          message.success('关联资源已保存');
          promptSharedSkillSyncAfterWorkbenchSave(this, s);
        },
        onWbProjectSkillTabUpdate(key) {
          const next = String(key || 'basic');
          if (next === String(this.wbProjectSkillDetailActiveTab)) return;
          const leaving = String(this.wbProjectSkillDetailActiveTab);
          if (
            (leaving === 'basic' && this.wbProjectSkillBasicPaneDirty)
            || (leaving === 'config' && this.wbProjectSkillConfigPaneDirty)
            || (leaving === 'resource' && this.wbProjectSkillResourcePaneEditing)
          ) {
            openSkillViewModalConfirm({
              title: '有未保存的编辑',
              content: '切换页签将放弃当前页签的未保存修改，是否继续？',
              okText: '放弃并切换',
              cancelText: '留在本页',
              onOk: () => {
                if (leaving === 'basic') this.cancelWbProjectSkillBasicPaneEdit();
                if (leaving === 'config') this.cancelWbProjectSkillConfigPaneEdit();
                if (leaving === 'resource') this.cancelWbProjectSkillResourcePaneEdit();
                this.wbProjectSkillDetailActiveTab = next;
              },
            });
            return;
          }
          this.wbProjectSkillDetailActiveTab = next;
        },
        _prepareWbProjectSkillV2Preview(template) {
          const pid = this.workbenchProjectId;
          if (!template || !template.id || !pid) return null;
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const idx = list.findIndex((x) => x.id === template.id);
          if (idx < 0) return null;
          const target = list[idx];
          this.hydrateWbProjectSkillForModal(target);
          demoProjectAnalysisTemplatesById[pid] = [...list];
          const fresh = (demoProjectAnalysisTemplatesById[pid] || []).find((x) => x.id === target.id) || target;
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this._wbProjectSkillCreateCommitted = false;
          this.wbProjectSkillDetailReadOnly = true;
          this.wbProjectSkillDetailModalIsCreate = false;
          this._wbProjectSkillModalSnapshot = null;
          this.wbProjectSkillDetailId = fresh.id;
          this.wbProjectSkillDetailActiveTab = 'config';
          this.syncWbProjectSkillFormFromSkill(fresh);
          this.wbProjectSkillConfigNavKey = 'rule';
          this.wbProjectSkillDetailModalOpen = false;
          return fresh;
        },
        openWbProjectSkillDetail(template, options) {
          const pid = this.workbenchProjectId;
          if (!template || !template.id || !pid) return;
          const readOnly = !!(options && options.readOnly);
          const forceModal = !!(options && options.forceModal);
          const panel = options && options.panel === 'basic' ? 'basic' : 'config';
          const useV2Embed = this.workbenchEmbedMode === 'v2' && readOnly && !forceModal;
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this._wbProjectSkillCreateCommitted = false;
          this.wbProjectSkillDetailReadOnly = readOnly;
          this.wbProjectSkillDetailModalIsCreate = false;
          this.wbProjectSkillAuditExpandedRuleId = '';
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const idx = list.findIndex((x) => x.id === template.id);
          if (idx < 0) {
            if (!readOnly) return;
            const preview = this.normalizeWbProjectSkillReadonlyPreview(template);
            if (!preview || !preview.id) return;
            this.wbProjectSkillReadonlyPreview = preview;
            this._wbProjectSkillModalSnapshot = null;
            this.wbProjectSkillDetailId = preview.id;
            this.wbProjectSkillDetailActiveTab = panel;
            this.syncWbProjectSkillFormFromSkill(preview);
            this.wbProjectSkillConfigNavKey = 'rule';
            this.wbProjectSkillBasicModalOpen = panel === 'basic';
            this.wbProjectSkillDetailModalOpen = panel === 'config';
            this.$nextTick(() => {
              if (panel === 'config') this.ensureWbProjectSkillFirstObjectExpanded();
              this.captureWbProjectSkillPaneSnapshotsAfterOpen();
            });
            return;
          }
          this.wbProjectSkillReadonlyPreview = null;
          const target = list[idx];
          this.hydrateWbProjectSkillForModal(target);
          demoProjectAnalysisTemplatesById[pid] = [...list];
          const fresh = (demoProjectAnalysisTemplatesById[pid] || []).find((x) => x.id === target.id) || target;
          if (!readOnly) {
            this._wbProjectSkillModalSnapshot = window.DemoSkillConfig.skillSnapshot(fresh);
          } else {
            this._wbProjectSkillModalSnapshot = null;
          }
          this.wbProjectSkillDetailId = fresh.id;
          this.wbProjectSkillDetailActiveTab = panel;
          this.syncWbProjectSkillFormFromSkill(fresh);
          this.wbProjectSkillConfigNavKey = 'rule';
          if (useV2Embed) {
            this.wbProjectSkillBasicModalOpen = false;
            this.wbProjectSkillDetailModalOpen = false;
            if (typeof this.registerWorkbenchV2DetailTabForSkill === 'function') {
              this.registerWorkbenchV2DetailTabForSkill(fresh.id, fresh.name);
            }
            this.$nextTick(() => this.ensureWbProjectSkillFirstObjectExpanded());
            return;
          }
          this.wbProjectSkillBasicModalOpen = panel === 'basic';
          this.wbProjectSkillDetailModalOpen = panel === 'config';
          this.$nextTick(() => {
            if (panel === 'config') this.ensureWbProjectSkillFirstObjectExpanded();
            this.captureWbProjectSkillPaneSnapshotsAfterOpen();
          });
        },
        openWbProjectSkillCreateBasicModal() {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先通过工作台进入本工作台的审计助手后再创建技能');
            return;
          }
          this.wbProjectSkillCreateBasicSubmitting = false;
          this.wbProjectSkillCreateBasicForm = {
            name: '',
            skillKind: '',
            description: '',
            skillType: '',
            auditScene: '',
            skillInputs: [],
            outputSummary: '',
          };
          this.wbProjectSkillReadonlyPreview = null;
          this._wbProjectSkillModalSnapshot = null;
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this._wbProjectSkillCreateCommitted = false;
          this.wbProjectSkillDetailModalIsCreate = false;
          this.wbProjectSkillDetailReadOnly = false;
          this.wbProjectSkillDetailId = '';
          this.wbProjectSkillDetailActiveTab = 'basic';
          this.wbProjectSkillConfigNavKey = 'rule';
          this.wbProjectSkillConfigTreeExpandedKeys = [];
          this.wbProjectSkillAuditExpandedRuleId = '';
          this.wbProjectSkillCreateAdvancedOpen = false;
          this.wbProjectSkillCreateBasicModalOpen = true;
          this.wbProjectSkillBasicModalOpen = false;
          this.wbProjectSkillDetailModalOpen = false;
        },
        closeWbProjectSkillCreateBasicModal() {
          this.wbProjectSkillCreateBasicSubmitting = false;
          this.wbProjectSkillCreateBasicModalOpen = false;
          this.wbProjectSkillCreateAdvancedOpen = false;
        },
        submitWbProjectSkillCreateBasic() {
          if (this.wbProjectSkillCreateBasicSubmitting) return;
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('请先通过工作台进入本工作台的审计助手后再创建技能');
            return;
          }
          const name = String(this.wbProjectSkillCreateBasicForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
          const rawSkillKind = String(this.wbProjectSkillCreateBasicForm.skillKind || '').trim();
          const allowedSkillKinds = new Set((this.wbProjectSkillKindOptions || []).map((item) => String(item.id)));
          if (!rawSkillKind) {
            message.warning('请选择技能类型');
            return;
          }
          if (!allowedSkillKinds.has(rawSkillKind)) {
            message.warning('所选技能类型已失效，请重新选择');
            return;
          }
          const skillKind = this.normalizeWbProjectSkillKind(rawSkillKind);
          const skillType = String(this.wbProjectSkillCreateBasicForm.skillType || '').trim();
          const allowedType = new Set((this.wbProjectSkillTypeDimensionOptions || []).map((item) => String(item.id)));
          if (skillType && !allowedType.has(skillType)) {
            message.warning('所选' + this.wbProjectSkillDimensionFieldLabel + '已不在分类设置中，请重新选择');
            return;
          }
          const auditScene = String(this.wbProjectSkillCreateBasicForm.auditScene || '').trim();
          const allowedScene = new Set((this.wbProjectAuditSceneDimensionOptions || []).map((item) => String(item.id)));
          if (auditScene && !allowedScene.has(auditScene)) {
            message.warning('所选' + this.wbProjectAuditSceneCategoryLabel + '已不在分类设置中，请重新选择');
            return;
          }
          this.wbProjectSkillCreateBasicSubmitting = true;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const row = {
            id: 'sk-prj-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            library: 'project',
            name,
            skillKind,
            description: String(this.wbProjectSkillCreateBasicForm.description || '').trim(),
            tags: [],
            skillType,
            auditScene,
            skillInputs: Array.from(new Set((this.wbProjectSkillCreateBasicForm.skillInputs || []).map((t) => String(t).trim()).filter(Boolean))),
            outputSummary: String(this.wbProjectSkillCreateBasicForm.outputSummary || '').trim(),
            dimensionValues: {},
            autoMatchOnSave: true,
            skillFiles: [],
            extractionRules: [],
            analysisRule: '',
            applicableScenario: '',
            generalConfigInstruction: '',
            createdAt: now,
            updatedAt: now,
            createdBy: '我',
            matchStatus: 'pending_config',
            matchPhase: '待配置',
            matchProgress: 0,
          };
          this.syncWbProjectSkillDimensionValues(row, { skillType, auditScene });
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          list.unshift(row);
          demoProjectAnalysisTemplatesById[pid] = [...list];
          this.wbProjectSkillReadonlyPreview = null;
          this._wbProjectSkillModalSnapshot = null;
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this._wbProjectSkillCreateCommitted = false;
          this.wbProjectSkillDetailModalIsCreate = true;
          this.wbProjectSkillDetailReadOnly = false;
          this.wbProjectSkillDetailId = row.id;
          this.wbProjectSkillDetailActiveTab = 'config';
          this.syncWbProjectSkillFormFromSkill(row);
          this.wbProjectSkillConfigNavKey = 'rule';
          this.wbProjectSkillAuditExpandedRuleId = '';
          this.wbProjectSkillCreateBasicSubmitting = false;
          this.wbProjectSkillCreateBasicModalOpen = false;
          this.wbProjectSkillCreateAdvancedOpen = false;
          this.wbProjectSkillBasicModalOpen = false;
          this.wbProjectSkillDetailModalOpen = true;
          this.$nextTick(() => {
            this.ensureWbProjectSkillFirstObjectExpanded();
            this.captureWbProjectSkillPaneSnapshotsAfterOpen();
          });
        },
        openWbProjectSkillCreateUnified() {
          this.openWbProjectSkillCreateBasicModal();
        },
        ensureWbProjectSkillFirstObjectExpanded() {
          const s = this.wbDetailSelectedSkill;
          if (!s) {
            this.wbProjectSkillAuditExpandedRuleId = '';
            this.wbProjectSkillConfigNavKey = 'rule';
            this.wbProjectSkillConfigTreeExpandedKeys = [];
            return;
          }
          if (this.normalizeWbProjectSkillKind(s) === 'general') {
            const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
            this.ensureWbProjectGeneralSkillFiles(s);
            this.wbProjectSkillAuditExpandedRuleId = '';
            this.wbProjectSkillConfigNavKey = 'rule';
            this.wbProjectSkillConfigTreeExpandedKeys = T && T.defaultExpandedKeys ? T.defaultExpandedKeys(s.skillFiles || []) : [];
            return;
          }
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (s && T && T.ensureSkillFiles) T.ensureSkillFiles(s);
          const rules = this.ensureWbProjectAuditSkillRules(s);
          this.wbProjectSkillConfigNavKey = 'rule';
          this.wbProjectSkillConfigTreeExpandedKeys = s && T && T.defaultExpandedKeys ? T.defaultExpandedKeys(s.skillFiles || []) : [];
          if (rules.length) {
            const current = String(this.wbProjectSkillAuditExpandedRuleId || '');
            this.wbProjectSkillAuditExpandedRuleId = rules.some((rule) => String(rule.id) === current)
              ? current
              : String(rules[0].id);
          } else {
            this.wbProjectSkillAuditExpandedRuleId = '';
          }
        },
        toggleWbProjectSkillAuditRuleExpand(ruleId) {
          const rid = String(ruleId || '');
          if (!rid) return;
          this.wbProjectSkillAuditExpandedRuleId = this.wbProjectSkillAuditExpandedRuleId === rid ? '' : rid;
        },
        addWbProjectSkillAuditRule() {
          if (this.wbProjectSkillConfigTabLocked || !this.wbDetailSelectedSkill) return;
          const rules = this.ensureWbProjectAuditSkillRules(this.wbDetailSelectedSkill);
          const next = {
            id: newSkillId('er'),
            title: '',
            body: '',
            materialIds: [],
          };
          rules.push(next);
          this.wbProjectSkillAuditExpandedRuleId = String(next.id);
        },
        removeWbProjectSkillAuditRule(index) {
          if (this.wbProjectSkillConfigTabLocked || !this.wbDetailSelectedSkill) return;
          const rules = this.ensureWbProjectAuditSkillRules(this.wbDetailSelectedSkill);
          if (rules.length <= 1) return;
          rules.splice(index, 1);
          const current = String(this.wbProjectSkillAuditExpandedRuleId || '');
          if (!rules.some((rule) => String(rule.id) === current)) {
            this.wbProjectSkillAuditExpandedRuleId = rules[0] ? String(rules[0].id) : '';
          }
        },
        closeWbProjectSkillDetailModal(fromSave) {
          const saved = fromSave === true;
          const createCommitted = this._wbProjectSkillCreateCommitted;
          if (this._wbProjectSkillDetailSyncTimer) {
            window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
            this._wbProjectSkillDetailSyncTimer = null;
          }
          const templateId = this.wbProjectSkillDetailId;
          const pid = this.workbenchProjectId;
          const wasCreate = this.wbProjectSkillDetailModalIsCreate;
          const wasReadOnly = this.wbProjectSkillDetailReadOnly;
          if (!saved && pid) {
            if (wasCreate && templateId && !createCommitted) {
              const list = demoProjectAnalysisTemplatesById[pid] || [];
              demoProjectAnalysisTemplatesById[pid] = list.filter((x) => String(x.id) !== String(templateId));
            } else if (!wasReadOnly && this._wbProjectSkillModalSnapshot && templateId) {
              const list = demoProjectAnalysisTemplatesById[pid] || [];
              const idx = list.findIndex((x) => String(x.id) === String(templateId));
              if (idx >= 0) {
                list.splice(idx, 1, JSON.parse(JSON.stringify(this._wbProjectSkillModalSnapshot)));
                demoProjectAnalysisTemplatesById[pid] = [...list];
              }
            }
          }
          this._wbProjectSkillModalSnapshot = null;
          this.wbProjectSkillReadonlyPreview = null;
          this.wbProjectSkillDetailModalIsCreate = false;
          this.wbProjectSkillBasicModalOpen = false;
          this.wbProjectSkillDetailModalOpen = false;
          this.wbProjectSkillDetailReadOnly = false;
          this.wbProjectSkillDetailId = '';
          this.wbProjectSkillConfigNavKey = 'rule';
          this.wbProjectSkillConfigTreeExpandedKeys = [];
          this.wbProjectSkillAuditExpandedRuleId = '';
          this.wbProjectSkillDetailActiveTab = 'basic';
          this.wbProjectSkillResourcePaneEditing = false;
          this._wbProjectSkillBasicPaneSnap = null;
          this._wbProjectSkillConfigPaneSnap = null;
          this._wbProjectSkillResourcePaneSnap = null;
          this._wbProjectSkillCreateCommitted = false;
        },
        scheduleWbProjectSkillDetailSync() {
          if (this.wbProjectSkillDetailReadOnly) return;
          if (this._wbProjectSkillDetailSyncTimer) window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
          this._wbProjectSkillDetailSyncTimer = window.setTimeout(() => {
            this.syncWbProjectSkillDetailNow();
            this._wbProjectSkillDetailSyncTimer = null;
          }, 250);
        },
        syncWbProjectSkillDetailNow() {
          const s = this.wbDetailSelectedSkill;
          const pid = this.workbenchProjectId;
          if (!s || !pid) return;
          if (this.wbProjectSkillDetailReadOnly) return;
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (this.normalizeWbProjectSkillKind(s) === 'general') {
            if (!Array.isArray(s.extractionRules)) s.extractionRules = [];
            this.ensureWbProjectGeneralSkillFiles(s);
          } else {
            this.ensureWbProjectAuditSkillRules(s);
          }
          if (!Array.isArray(s.extractionRules)) s.extractionRules = [];
          s.extractionRules = s.extractionRules.map((x) => ({
            id: x.id || newSkillId('er'),
            title: String(x.title || ''),
            body: String(x.body || ''),
            materialIds: this.normalizeWbProjectSkillKind(s) === 'general'
              ? (Array.isArray(x.materialIds) ? Array.from(new Set(x.materialIds.map((mid) => String(mid)))) : [])
              : this.wbNormalizeRuleForProjectTemplate(x).materialIds,
          }));
          if (this.normalizeWbProjectSkillKind(s) !== 'general') {
            this.syncWbProjectAuditSkillFilesFromRules(s);
          } else {
            this.ensureWbProjectGeneralSkillFiles(s);
            s.generalConfigInstruction = String(s.analysisRule || '');
          }
          s.analysisRule = String(s.analysisRule || '');
          s.applicableScenario = String(s.applicableScenario || '');
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          s.updatedAt = now;
          if (!s.createdAt) {
            s.createdAt = now;
            if (!s.createdBy) s.createdBy = '我';
          }
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const idx = list.findIndex((x) => x.id === s.id);
          if (idx >= 0) {
            list.splice(idx, 1, { ...s });
            demoProjectAnalysisTemplatesById[pid] = [...list];
          }
        },
        wbNormalizeRuleForProjectTemplate(rule) {
          const pid = this.workbenchProjectId;
          const mats = pid ? demoProjectMaterialsById[pid] || [] : [];
          return window.DemoProjectSkillMatch
            ? window.DemoProjectSkillMatch.normalizeRuleForProjectTemplate(rule, (r) =>
                window.DemoProjectSkillMatch.autoMatchMaterialIdsForRule(r, mats))
            : { ...(rule || {}), materialIds: [] };
        },
        getWbSkillLinkedResourceIds(template) {
          const t = template || {};
          const direct = Array.isArray(t.linkedResourceIds) ? t.linkedResourceIds.map((id) => String(id)).filter(Boolean) : [];
          if (direct.length) return Array.from(new Set(direct));
          const ids = new Set();
          if (Array.isArray(t.manualMaterialIds)) t.manualMaterialIds.forEach((id) => ids.add(String(id)));
          (Array.isArray(t.extractionRules) ? t.extractionRules : []).forEach((rule) => {
            (Array.isArray(rule && rule.materialIds) ? rule.materialIds : []).forEach((id) => ids.add(String(id)));
          });
          return Array.from(ids);
        },
        getWbSkillLinkedResourceCount(template) {
          return this.getWbSkillLinkedResourceIds(template).length;
        },
        getWbSkillLinkedResourceBylineState(template) {
          const ids = this.getWbSkillLinkedResourceIds(template);
          const total = ids.length;
          if (!total) {
            return {
              kind: 'idle',
              text: '未匹配到资料',
              ariaLabel: '查看匹配资料，当前未匹配',
            };
          }
          const pid = this.workbenchProjectId;
          const mats = pid ? demoProjectMaterialsById[pid] || [] : [];
          const byId = new Map(mats.map((m) => [String(m.id), m]));
          let done = 0;
          let pending = 0;
          let failed = 0;
          for (let i = 0; i < ids.length; i += 1) {
            const row = byId.get(String(ids[i]));
            const status = row && row.status ? String(row.status) : '';
            if (status === 'done') {
              done += 1;
            } else if (status === 'queued' || status === 'parsing') {
              pending += 1;
            } else if (status === 'failed') {
              failed += 1;
            } else {
              done += 1;
            }
          }
          if (pending > 0) {
            return {
              kind: 'running',
              text: '匹配中…',
              ariaLabel: '查看匹配资料，匹配中，当前完成 ' + done + ' 条，共 ' + total + ' 条',
            };
          }
          if (failed > 0) {
            return {
              kind: 'failed',
              text: '未匹配到资料',
              ariaLabel: '查看匹配资料，未匹配到资料',
            };
          }
          return {
            kind: 'success',
            text: '已匹配到 ' + total + ' 份资料',
            ariaLabel: '查看匹配资料，已匹配到 ' + total + ' 份资料',
          };
        },
        getWbSkillLinkedResources(template) {
          const pid = this.workbenchProjectId;
          const mats = pid ? demoProjectMaterialsById[pid] || [] : [];
          const byId = new Map(mats.map((m) => [String(m.id), m]));
          const ids = this.getWbSkillLinkedResourceIds(template);
          const metaMap = template && template.linkedResourceMeta && typeof template.linkedResourceMeta === 'object'
            ? template.linkedResourceMeta
            : {};
          return ids.map((id) => {
            const row = byId.get(String(id));
            return {
              id: String(id),
              name: row && row.name ? String(row.name) : String(id),
              format: row && row.format ? String(row.format) : '—',
              updatedAt: row && row.uploadedAt ? String(row.uploadedAt) : '—',
              matchSource: String(metaMap[id] || '命中配置规则'),
            };
          });
        },
        openWbSkillResourcePopover(template) {
          if (!template || !template.id) return;
          this.wbSkillResourcePopoverSkillId = String(template.id);
          this.wbSkillResourcePopoverOpen = true;
        },
        closeWbSkillResourcePopover() {
          this.wbSkillResourcePopoverOpen = false;
          this.wbSkillResourcePopoverSkillId = '';
        },
        openWbSkillResourceEditor(template) {
          if (!template) return;
          this.closeWbSkillResourcePopover();
          this.openWbProjectSkillDetail(template, { readOnly: false });
          this.wbProjectSkillDetailActiveTab = 'resource';
        },
        saveWbProjectSkillConfig() {
          const pid = this.workbenchProjectId;
          if (!pid || !this.wbDetailSelectedSkill || !window.DemoProjectSkillMatch) return;
          this.syncWbProjectSkillDetailNow();
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const fresh = list.find((x) => x.id === this.wbDetailSelectedSkill.id);
          if (!fresh || !window.DemoProjectSkillMatch.validateProjectSkillConfigForMatch(fresh, message)) return;
          const idx = list.findIndex((x) => x.id === fresh.id);
          if (idx < 0) return;
          const row = { ...list[idx] };
          row.extractionRules = (row.extractionRules || [])
            .map((x) => ({
              id: x.id || newSkillId('er'),
              title: String(x.title || '').trim(),
              body: String(x.body || '').trim(),
              materialIds: Array.isArray(x.materialIds) ? Array.from(new Set(x.materialIds.map((mid) => String(mid)))) : [],
            }))
            .filter((x) => String(x.title || '').trim() && String(x.body || '').trim());
          row.analysisRule = String(row.analysisRule || '').trim();
          row.applicableScenario = String(row.applicableScenario || '').trim();
          const normRules = row.extractionRules.map((r) => this.wbNormalizeRuleForProjectTemplate(r));
          row.extractionRules = normRules;
          row.manualMaterialIds = Array.from(
            new Set(normRules.flatMap((r) => (Array.isArray(r.materialIds) ? r.materialIds : []).map((x) => String(x)))),
          );
          list.splice(idx, 1, row);
          demoProjectAnalysisTemplatesById[pid] = [...list];
          this.closeWbProjectSkillDetailModal(true);
          message.success('配置已保存');
          promptSharedSkillSyncAfterWorkbenchSave(this, row);
        },
        wbProjectSkillModalCreator(sk) {
          if (!sk) return '—';
          return sk.createdBy || '我';
        },
        wbProjectSkillModalCreatedDateYmd(sk) {
          if (!sk || sk.createdAt == null || sk.createdAt === '') return '—';
          const t = String(sk.createdAt).trim();
          const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
          if (m) return m[1];
          return t.slice(0, 10) || '—';
        },
        wbProjectSkillModalUpdatedCompact(sk) {
          if (!sk) return '—';
          const raw = sk.updatedAt != null && sk.updatedAt !== '' ? sk.updatedAt : sk.createdAt;
          if (raw == null || raw === '') return '—';
          const t = String(raw).trim();
          const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
          if (m) return `${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
          const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (m2) return `${m2[2]}-${m2[3]}`;
          return t.slice(0, 16) || '—';
        },
        scheduleBotRunSummary(botMsg) {
          if (!botMsg || !botMsg.chatRunSummary) return;
          const msgId = botMsg.id;
          botMsg.chatRunSummaryProgress = 0;
          if (botMsg._runSummaryIv) {
            clearInterval(botMsg._runSummaryIv);
            botMsg._runSummaryIv = null;
          }
          if (botMsg._runSummaryStartTid) {
            clearTimeout(botMsg._runSummaryStartTid);
            botMsg._runSummaryStartTid = null;
          }
          const tid = setTimeout(() => {
            const m = this.chatMessages.find((x) => x.id === msgId);
            if (m) m._runSummaryStartTid = null;
            if (!m || !m.chatRunSummary) return;
            const iv = setInterval(() => {
              const cur = this.chatMessages.find((x) => x.id === msgId);
              if (!cur || !cur.chatRunSummary) {
                clearInterval(iv);
                return;
              }
              const len = cur.chatRunSummary.length;
              const step = len > 100 ? 2 : 1;
              const next = Math.min(len, (cur.chatRunSummaryProgress || 0) + step);
              cur.chatRunSummaryProgress = next;
              if (next >= len) {
                clearInterval(iv);
                cur._runSummaryIv = null;
              }
              this.$nextTick(() => {
                const w = this.$refs.chatMessages;
                if (w) w.scrollTop = w.scrollHeight;
              });
            }, 46);
            m._runSummaryIv = iv;
          }, 520);
          botMsg._runSummaryStartTid = tid;
        },
        saveExperienceToTemplate() {
          this.layoutMode = 'A';
          this.toastMessage = '已保存至技能库';
          window.location.hash = 'template';
          setTimeout(() => { this.toastMessage = ''; window.dispatchEvent(new HashChangeEvent('hashchange')); }, 1500);
        },
        addMessageToMaterialPool(msg, customName) {
          const text = this.getMessageFullPlainText(msg);
          const title = String(customName || '').trim() || text.slice(0, 28) + (text.length > 28 ? '...' : '') || '对话结果';
          const artifact = this.getAnalysisArtifactFromMessage ? this.getAnalysisArtifactFromMessage(msg) : null;
          if (artifact && typeof artifact.csvData === 'string' && artifact.csvData.trim()) {
            this.createWorkbenchResultRowFromMarkdown({
              name: title,
              format: 'CSV',
              csvData: String(artifact.csvData).trim(),
              overview: text,
            });
          } else {
            this.createWorkbenchResultRowFromMarkdown({
              name: title,
              markdown: this.formatSavedResultBodyFromMessage(msg),
              overview: text,
            });
          }
          msg.saved = true;
          this.toastMessage = '已保存到结果';
          setTimeout(() => { this.toastMessage = ''; }, 2000);
        },
        summaryTaskStatusLabel(task) {
          const map = { queued: '排队中', running: '总结中', done: '总结完成' };
          return map[String((task && task.status) || 'queued')] || '排队中';
        },
        makeSummaryTemplateDraftFromMessage(msg) {
          const text = String((msg && this.getMessageFullPlainText(msg)) || '').trim();
          const plain = text.replace(/\s+/g, ' ').trim();
          const nameSeed = plain ? plain.slice(0, 18) : '对话总结';
          const tags = ['技能', '对话总结', '审计助手'];
          return {
            name: `${nameSeed}技能`,
            description: `基于审计助手对话内容提炼，可复用于同类审计分析任务。`,
            tags,
            analysisRule: plain || '请结合当前资料与审计发现进行结构化分析，输出关键风险、证据链和复核建议。',
            extractionRules: [
              {
                id: 'sum-er-' + Date.now().toString(36),
                title: '对话上下文与已引用资料',
                body: '提炼核心事实、关键金额/日期/主体及异常线索，形成可复用分析输入。',
                materialIds: [],
              },
            ],
          };
        },
        summarizeLatestBotMessageToTemplate() {
          this.openGenerateSkillConfigModal();
        },
        openGenerateSkillConfigModal() {
          if (!this.workbenchProjectId) {
            message.warning('请先进入具体工作台后再生成技能');
            return;
          }
          this.clearWbGenerateSkillRecoTimers();
          this.wbGenerateSkillIntentText = '';
          this.wbGenerateSkillRecommendationItems = [
            { loading: true, text: '' },
            { loading: true, text: '' },
            { loading: true, text: '' },
          ];
          this.wbGenerateSkillConfigModalOpen = true;
          this.$nextTick(() => {
            this.startGenerateSkillRecommendationSimulation();
          });
        },
        closeGenerateSkillConfigModal() {
          this.wbGenerateSkillConfigModalOpen = false;
          this.clearWbGenerateSkillRecoTimers();
        },
        clearWbGenerateSkillRecoTimers() {
          (this._wbGenerateSkillRecoTimers || []).forEach((tid) => window.clearTimeout(tid));
          this._wbGenerateSkillRecoTimers = [];
        },
        getLatestBotMessagePlainSeed() {
          const list = this.chatMessages || [];
          for (let i = list.length - 1; i >= 0; i--) {
            const m = list[i];
            if (m && m.role === 'bot') {
              const t = String(this.getMessageFullPlainText(m) || '').trim();
              if (t) return t.replace(/\s+/g, ' ').slice(0, 80);
            }
          }
          return '';
        },
        buildGenerateSkillRecommendationTexts() {
          const seed = this.getLatestBotMessagePlainSeed();
          const topic = seed || '当前审计主题与已引用资料';
          const short = topic.length > 28 ? `${topic.slice(0, 28)}…` : topic;
          return [
            `针对「${short}」提炼可复用核查技能：输出结构化风险清单、证据引用位与复核要点。`,
            '围绕对话中的关键实体与金额口径，生成对标检查步骤、输出段落模板与禁运项说明。',
            '结合当前结论与待复核疑点，生成后续同类任务可一键复用的分析技能（含输入边界与引用资料范围）。',
          ];
        },
        startGenerateSkillRecommendationSimulation() {
          this.clearWbGenerateSkillRecoTimers();
          const texts = this.buildGenerateSkillRecommendationTexts();
          const delays = [320, 760, 1280];
          this._wbGenerateSkillRecoTimers = [];
          texts.forEach((text, idx) => {
            const tid = window.setTimeout(() => {
              const rows = this.wbGenerateSkillRecommendationItems || [];
              if (!rows[idx]) return;
              rows[idx].text = text;
              rows[idx].loading = false;
            }, delays[idx]);
            this._wbGenerateSkillRecoTimers.push(tid);
          });
        },
        applyGenerateSkillRecommendation(text) {
          const t = String(text || '').trim();
          if (!t) return;
          this.wbGenerateSkillIntentText = t;
        },
        submitGenerateSkillConfig() {
          const intent = String(this.wbGenerateSkillIntentTrimmed || '').trim();
          if (!intent) {
            message.warning('请填写意图，或待推荐生成完成后点选一条');
            return;
          }
          const taskId = 'wb-gen-skill-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const nameLine = intent.length > 36 ? `${intent.slice(0, 36)}…` : intent;
          const created = {
            id: taskId,
            type: 'analysis',
            title: `生成技能任务 · ${nameLine}`,
            checked: false,
            projectSource: {
              status: 'queued',
              createdAt: now,
              sourceSkillName: '按意图生成技能配置',
              name: '按意图生成的技能配置',
            },
            status: 'queued',
            taskConfig: {
              taskType: 'generate-skill',
              skillName: '生成技能配置',
              intent,
              outputSkillName: `可复用核查技能 · ${nameLine}`,
              resources: [
                { key: 'dialog-intent', name: intent.length > 160 ? `${intent.slice(0, 160)}…` : intent },
              ],
            },
          };
          this.workbenchCreatedTasks = [created, ...(this.workbenchCreatedTasks || [])];
          this.closeGenerateSkillConfigModal();
          message.success('已在右侧任务区创建「生成技能任务」');
          this.studioCollapsed = false;
        },
        openSummarizeToTemplateModal(msg) {
          if (!msg || msg.role !== 'bot') return;
          if (!this.workbenchProjectId) {
            message.warning('请先进入具体工作台后再总结为技能');
            return;
          }
          const draft = this.makeSummaryTemplateDraftFromMessage(msg);
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('缺少工作台上下文，无法创建工作台级技能');
            return;
          }
          if (!demoProjectAnalysisTemplatesById[pid]) demoProjectAnalysisTemplatesById[pid] = [];
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const placeholderId = 'sk-prj-sum-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
          const placeholder = {
            id: placeholderId,
            library: 'project',
            name: draft.name,
            description: draft.description || '',
            tags: Array.from(new Set([...(draft.tags || []), '总结中'])),
            extractionRules: Array.isArray(draft.extractionRules) && draft.extractionRules.length ? draft.extractionRules.map((x) => ({ ...x })) : [{ id: 'sum-er-' + Date.now().toString(36), title: '总结中', body: '正在根据对话生成技能配置，请稍候。', materialIds: [] }],
            analysisRule: String(draft.analysisRule || '').trim(),
            manualMaterialIds: [],
            createdAt: now,
            updatedAt: now,
          };
          demoProjectAnalysisTemplatesById[pid] = [placeholder, ...(demoProjectAnalysisTemplatesById[pid] || [])];
          this.enqueueSummaryTemplateTask({
            sourceMsgId: msg.id,
            name: draft.name,
            draftTemplate: draft,
            templateId: placeholderId,
            projectId: pid,
          });
          this.workbenchLeftPrimaryTab = 'skill';
          this.sourcesCollapsed = false;
          this.sourcesLeftView = 'list';
          this.studioCollapsed = false;
          this.toastMessage = '已开始总结，已在技能栏新增工作台级技能（总结中）';
          setTimeout(() => { this.toastMessage = ''; }, 1200);
        },
        enqueueSummaryTemplateTask(payload) {
          const id = 'sum-task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          const task = {
            id,
            taskName: payload.name || '对话总结技能任务',
            sourceMsgId: payload.sourceMsgId || null,
            status: 'queued',
            progress: 8,
            draftTemplate: payload.draftTemplate || null,
            templateId: payload.templateId || '',
            projectId: payload.projectId || '',
            savedTemplateId: null,
          };
          this.summaryTemplateTasks = [task, ...(this.summaryTemplateTasks || [])];
          if (task.templateId) {
            this.summarySkillTaskByTemplateId = {
              ...(this.summarySkillTaskByTemplateId || {}),
              [task.templateId]: id,
            };
          }
          this.runSummaryTemplateTask(id);
          return task;
        },
        _clearSummaryTaskTimers(taskId) {
          if (!this._summaryTaskTimers) return;
          const key = String(taskId || '');
          const pair = this._summaryTaskTimers[key];
          if (!pair) return;
          if (pair.startTimer) window.clearTimeout(pair.startTimer);
          if (pair.progressTimer) window.clearInterval(pair.progressTimer);
          if (pair.doneTimer) window.clearTimeout(pair.doneTimer);
          delete this._summaryTaskTimers[key];
        },
        runSummaryTemplateTask(taskId) {
          const key = String(taskId || '');
          if (!key) return;
          if (!this._summaryTaskTimers) this._summaryTaskTimers = {};
          this._clearSummaryTaskTimers(key);
          const startTimer = window.setTimeout(() => {
            const idx = (this.summaryTemplateTasks || []).findIndex((x) => x.id === key);
            if (idx < 0) return;
            const startTask = this.summaryTemplateTasks[idx];
            this.summaryTemplateTasks.splice(idx, 1, { ...startTask, status: 'running', progress: 20 });
          }, 400);
          const progressTimer = window.setInterval(() => {
            const idx = (this.summaryTemplateTasks || []).findIndex((x) => x.id === key);
            if (idx < 0) { this._clearSummaryTaskTimers(key); return; }
            const task = this.summaryTemplateTasks[idx];
            if (task.status !== 'running') return;
            const next = Math.min(92, Number(task.progress || 20) + Math.max(3, Math.round(Math.random() * 10)));
            this.summaryTemplateTasks.splice(idx, 1, { ...task, progress: next });
          }, 520);
          const doneTimer = window.setTimeout(() => {
            const idx = (this.summaryTemplateTasks || []).findIndex((x) => x.id === key);
            if (idx < 0) return;
            const task = this.summaryTemplateTasks[idx];
            const doneTask = { ...task, status: 'done', progress: 100 };
            this.summaryTemplateTasks.splice(idx, 1, doneTask);
            this._clearSummaryTaskTimers(key);
            this.finalizeSummaryProjectSkill(doneTask);
          }, 3200);
          this._summaryTaskTimers[key] = { startTimer, progressTimer, doneTimer };
        },
        finalizeSummaryProjectSkill(task) {
          const pid = String((task && task.projectId) || '');
          const templateId = String((task && task.templateId) || '');
          if (!pid || !templateId) return;
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          const idx = list.findIndex((x) => String(x.id) === templateId);
          if (idx < 0) return;
          const current = list[idx];
          const draft = task.draftTemplate || {};
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          let rules = Array.isArray(draft.extractionRules) ? draft.extractionRules : [];
          if (!rules.length) {
            rules = [{ id: 'sum-er-' + Date.now().toString(36), title: '对话上下文与已引用资料', body: '提炼核心事实并组织为可复用输入。', materialIds: [] }];
          }
          const mats = demoProjectMaterialsById[pid] || [];
          if (window.DemoProjectSkillMatch) {
            rules = rules.map((r) =>
              window.DemoProjectSkillMatch.normalizeRuleForProjectTemplate(r, (rule) =>
                window.DemoProjectSkillMatch.autoMatchMaterialIdsForRule(rule, mats),
              ),
            );
          }
          const manualMaterialIds = Array.from(
            new Set(rules.flatMap((r) => (Array.isArray(r.materialIds) ? r.materialIds : []).map((x) => String(x)))),
          );
          const tags = (Array.isArray(draft.tags) ? draft.tags : []).filter((t) => String(t || '').trim() && String(t || '').trim() !== '总结中');
          const merged = {
            ...current,
            name: String(draft.name || current.name || '未命名技能').trim(),
            description: String(draft.description || current.description || '').trim(),
            tags: tags.length ? tags : (current.tags || []).filter((t) => String(t || '').trim() !== '总结中'),
            extractionRules: rules,
            analysisRule: String(draft.analysisRule || current.analysisRule || '').trim(),
            manualMaterialIds,
            updatedAt: now,
          };
          list.splice(idx, 1, merged);
          demoProjectAnalysisTemplatesById[pid] = [...list];
          const map = { ...(this.summarySkillTaskByTemplateId || {}) };
          delete map[templateId];
          this.summarySkillTaskByTemplateId = map;
          this.toastMessage = `技能「${merged.name || '未命名'}」已总结完成`;
          setTimeout(() => { this.toastMessage = ''; }, 1600);
        },
        cancelSummaryTemplateTask(task) {
          if (!task || !task.id) return;
          openSkillViewModalConfirm({
            title: '确定取消该任务？',
            content: '取消后任务卡片会消失，且本次总结结果不会保存。',
            okText: '确认取消',
            cancelText: '继续执行',
            danger: true,
            onOk: () => {
              const id = String(task.id);
              const templateId = String(task.templateId || '');
              this._clearSummaryTaskTimers(id);
              this.summaryTemplateTasks = (this.summaryTemplateTasks || []).filter((x) => x.id !== id);
              if (templateId) {
                const map = { ...(this.summarySkillTaskByTemplateId || {}) };
                delete map[templateId];
                this.summarySkillTaskByTemplateId = map;
              }
              this.toastMessage = '任务已取消';
              setTimeout(() => { this.toastMessage = ''; }, 1200);
            },
          });
        },
        openSummaryTaskResultModal(task) {
          if (!task || task.status !== 'done' || !task.draftTemplate) return;
          const d = task.draftTemplate;
          const rules = Array.isArray(d.extractionRules) && d.extractionRules.length
            ? d.extractionRules.map((r) => ({
              id: r.id || ('sum-er-' + Date.now().toString(36)),
              title: String(r.title || '').trim(),
              body: String(r.body || '').trim(),
              materialIds: Array.isArray(r.materialIds) ? Array.from(new Set(r.materialIds.map((id) => String(id)))) : [],
            }))
            : [{ id: 'sum-er-' + Date.now().toString(36), title: '', body: '', materialIds: [] }];
          this.summaryTaskResultTaskId = task.id;
          this.summaryTaskResultForm = {
            name: d.name || '',
            extractionRules: rules,
            analysisRule: d.analysisRule || '',
          };
          this.summaryTaskResultExpandedRuleId = (rules[0] && rules[0].id) || '';
          this.summaryTaskResultModalVisible = true;
        },
        closeSummaryTaskResultModal() {
          this.summaryTaskResultModalVisible = false;
          this.summaryTaskResultTaskId = null;
          this.summaryTaskResultExpandedRuleId = '';
          this.summaryTaskResultForm = { name: '', extractionRules: [], analysisRule: '' };
        },
        summaryRuleMatchedMaterialCount(rule) {
          const ids = Array.isArray(rule && rule.materialIds) ? rule.materialIds : [];
          return Array.from(new Set(ids.map((x) => String(x)))).length;
        },
        toggleSummaryTemplateRuleExpand(ruleId) {
          const id = String(ruleId || '');
          if (!id) return;
          this.summaryTaskResultExpandedRuleId = this.summaryTaskResultExpandedRuleId === id ? '' : id;
        },
        addSummaryTemplateExtractionRule() {
          if (!Array.isArray(this.summaryTaskResultForm.extractionRules)) this.summaryTaskResultForm.extractionRules = [];
          const newRule = {
            id: 'sum-er-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            title: '',
            body: '',
            materialIds: [],
          };
          this.summaryTaskResultForm.extractionRules.push(newRule);
          this.summaryTaskResultExpandedRuleId = newRule.id;
        },
        removeSummaryTemplateExtractionRule(index) {
          const list = Array.isArray(this.summaryTaskResultForm.extractionRules) ? this.summaryTaskResultForm.extractionRules : [];
          if (list.length <= 1) return;
          const removed = list[index];
          list.splice(index, 1);
          this.summaryTaskResultForm.extractionRules = [...list];
          if (removed && this.summaryTaskResultExpandedRuleId === removed.id) {
            this.summaryTaskResultExpandedRuleId = (list[0] && list[0].id) || '';
          }
        },
        confirmSummaryTaskResultModal() {
          const taskId = this.summaryTaskResultTaskId;
          if (!taskId) return;
          const idx = (this.summaryTemplateTasks || []).findIndex((x) => x.id === taskId);
          if (idx < 0) return;
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('缺少工作台上下文，无法保存技能');
            return;
          }
          const name = String(this.summaryTaskResultForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
          const draft = this.summaryTemplateTasks[idx].draftTemplate || {};
          const tags = Array.isArray(draft.tags) && draft.tags.length ? draft.tags : ['技能', '对话总结'];
          const description = String(draft.description || '').trim();
          const analysisRule = String(this.summaryTaskResultForm.analysisRule || '').trim();
          if (!demoProjectAnalysisTemplatesById[pid]) demoProjectAnalysisTemplatesById[pid] = [];
          const newId = 'sk-prj-sum-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
          let rules = (this.summaryTaskResultForm.extractionRules || [])
            .map((x) => ({
              id: x.id || ('sum-er-' + Date.now().toString(36)),
              title: String(x.title || '').trim(),
              body: String(x.body || '').trim(),
              materialIds: [],
            }))
            .filter((x) => x.title && x.body);
          if (!rules.length) {
            rules = [{ id: 'sum-er-' + Date.now().toString(36), title: '对话上下文与已引用资料', body: '提炼核心事实并组织为可复用输入。', materialIds: [] }];
          }
          const mats = demoProjectMaterialsById[pid] || [];
          if (window.DemoProjectSkillMatch) {
            rules = rules.map((r) =>
              window.DemoProjectSkillMatch.normalizeRuleForProjectTemplate(r, (rule) =>
                window.DemoProjectSkillMatch.autoMatchMaterialIdsForRule(rule, mats),
              ),
            );
          }
          const manualMaterialIds = Array.from(
            new Set(rules.flatMap((r) => (Array.isArray(r.materialIds) ? r.materialIds : []).map((x) => String(x)))),
          );
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          let skillFiles = [];
          if (T && rules.length) {
            skillFiles = rules.map((r, ri) => ({
              id: newId + '-sf' + (ri + 1),
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: (String(r.title || '').trim() || '条目' + (ri + 1)) + '.md',
              content: String(r.body || ''),
              materialIds: Array.isArray(r.materialIds) ? r.materialIds.slice() : [],
            }));
          }
          const row = {
            id: newId,
            library: 'project',
            name,
            description,
            tags,
            skillFiles,
            extractionRules: T && skillFiles.length ? [] : rules,
            analysisRule,
            manualMaterialIds,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          };
          if (T && T.syncExtractionRulesFromSkillFiles && skillFiles.length) {
            T.syncExtractionRulesFromSkillFiles(row);
          }
          demoProjectAnalysisTemplatesById[pid] = [row, ...(demoProjectAnalysisTemplatesById[pid] || [])];
          const currentTask = this.summaryTemplateTasks[idx];
          this.summaryTemplateTasks.splice(idx, 1, { ...currentTask, savedTemplateId: newId });
          this.closeSummaryTaskResultModal();
          this.toastMessage = '已保存为工作台级技能';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        }
  };
})();
