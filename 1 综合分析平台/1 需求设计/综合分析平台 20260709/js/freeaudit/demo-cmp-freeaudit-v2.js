(function () {
  const app = window.__DEMO_APP;
  const createVNode = window.Vue && window.Vue.createVNode;
  const Modal = window.antd && window.antd.Modal;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const freeauditPanels = (window.DemoFreeAudit && window.DemoFreeAudit.panels) || {};
  const CHAT_DEMO_SCENARIOS = freeauditUtils.CHAT_DEMO_SCENARIOS || [];
  const resolveWorkbenchDemoScenario = freeauditUtils.resolveWorkbenchDemoScenario;
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};
  const wbMatMaterialPathPrefixForRow = freeauditUtils.wbMatMaterialPathPrefixForRow || function () { return ''; };

  const V2_WORKBENCH_TOUR_BANNER_SRC = './assets/generated/freeaudit-workbench-tour-banner.png';
  const V2_DOC_WORKSPACE_RAIL_WIDTH = 48;
  const V2_DOC_WORKSPACE_SPLIT_WIDTH = 4;
  const V2_SKILL_CONFIRM_WRAP_CLASS = (window.dsConfirm && window.dsConfirm.WRAP_CLASS) || 'modal-w-520';
  const V2_DETAIL_DOCK_MIN_WIDTH = 944;

  function getV2ElementContentWidth(el) {
    if (!el) return 0;
    const styles = window.getComputedStyle ? window.getComputedStyle(el) : null;
    const left = styles ? parseFloat(styles.paddingLeft) || 0 : 0;
    const right = styles ? parseFloat(styles.paddingRight) || 0 : 0;
    return Math.max(0, el.clientWidth - left - right);
  }

  function openV2SkillViewConfirm(opts) {
    const options = opts || {};
    if (!Modal || typeof Modal.confirm !== 'function') {
      if (typeof options.onOk === 'function') return options.onOk();
      return;
    }
    return Modal.confirm({
      wrapClassName: V2_SKILL_CONFIRM_WRAP_CLASS,
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
  function openV2AppRunCreatedNotice() {
    const content = '可在应用的执行记录或任务列表中查看。';
    if (Modal && typeof Modal.info === 'function') {
      return Modal.info({
        title: '任务已创建',
        content,
        okText: '知道了',
        centered: true,
        icon: null,
      });
    }
    if (typeof message !== 'undefined' && message.success) message.success(content);
  }

  function normalizeV2SkillPublishVersionLabel(value) {
    return String(value || '').trim();
  }

  function looksLikeV2SkillVersionLabel(value) {
    return /^v?\d+(?:\.\d+){0,3}(?:[-_\s][\w\u4e00-\u9fa5]+)?$/i.test(String(value || '').trim());
  }

  function getV2SkillDefaultPublishVersionLabel(raw) {
    const list = Array.isArray(raw && raw.publishedVersions) ? raw.publishedVersions : [];
    const latest = list
      .map((item) => item && item.versionLabel)
      .map((label) => normalizeV2SkillPublishVersionLabel(label))
      .filter(Boolean)
      .sort((a, b) => String(b).localeCompare(String(a)))[0];
    if (looksLikeV2SkillVersionLabel(latest)) return latest;
    const sourceLabel = normalizeV2SkillPublishVersionLabel(raw && raw.sourceVersionLabel);
    if (looksLikeV2SkillVersionLabel(sourceLabel)) return sourceLabel;
    return 'v1.0.0';
  }

  function buildV2SkillPublishedVersion(row, versionLabel, now) {
    const snapshot = JSON.parse(JSON.stringify(row || {}));
    delete snapshot.publishedVersions;
    return {
      versionLabel,
      versionNote: '公开版本',
      createdAt: now,
      publisherName: String((row && (row.sharedBy || row.createdBy || row.ownerName)) || V2_DEMO_CURRENT_SKILL_OWNER.name).trim(),
      publisherRole: '',
      versionStatus: 'published',
      snapshot,
    };
  }

  function buildV2ShareConfirmContent(state) {
    if (!createVNode) return '公开后，当前副本将成为公共技能，系统内所有用户可使用。后续编辑或配置不会自动同步，需手动点击“同步”。';
    return createVNode('div', { class: 'workbench-v2-share-confirm' }, [
      createVNode('p', { class: 'workbench-v2-share-confirm__text' }, '公开后，当前副本将成为公共技能，系统内所有用户可使用。'),
      createVNode('p', { class: 'workbench-v2-share-confirm__text' }, '后续编辑或配置不会自动同步，需手动点击“同步”。'),
      createVNode('label', { class: 'workbench-v2-share-confirm__field' }, [
        createVNode('span', { class: 'workbench-v2-share-confirm__label' }, '版本号'),
        createVNode('input', {
          class: 'workbench-v2-share-confirm__input',
          value: state.value,
          placeholder: '例如 v1.0.0',
          onInput: (event) => {
            state.value = event && event.target ? event.target.value : '';
          },
        }),
      ]),
    ]);
  }

  const V2_RAIL_TOOLS = [
    { id: 'toggle', label: '展开或收起右栏', icon: '#right-bar', panel: 'toggle' },
    { id: 'file', label: '打开材料与结果目录', icon: '#notes', iconparkName: 'folder-close', panel: 'file' },
    { id: 'database', label: '打开库表目录', icon: '#form', iconparkName: 'data', panel: 'database' },
    { id: 'graph', label: '打开数据图谱目录', icon: '#connect', panel: 'graph' },
    { id: 'knowledge', label: '打开知识库目录', icon: '#book', panel: 'knowledge' },
  ];

  const V2_MAIN_VIEWS = [
    { id: 'search', label: '搜索', icon: 'search' },
    { id: 'skill', label: '技能', icon: 'book-open' },
    { id: 'app', label: '应用', icon: 'cube' },
  ];

  const V2_WORKBENCH_PROJECT_OPTIONS_STORAGE_KEY = 'workbenchV2ProjectOptions';
  const V2_WORKBENCH_PROJECT_BASE_IDS = [
    'PRJ-2026-001',
    'PRJ-2026-002',
    'PRJ-2026-003',
    'PRJ-2026-004',
  ];
  const V2_WORKBENCH_PROJECT_DESCRIPTION_BY_ID = Object.freeze({
    'PRJ-2026-001': '展示完整审计分析流程。',
    'PRJ-2026-002': '进入后自动展示模型请求排队、等待与生成中反馈。',
    'PRJ-2026-003': '进入后自动展示删除结果前的授权确认与审批状态。',
    'PRJ-2026-004': '进入后展示空白工作台，便于演示首次对话入口。',
  });
  const V2_WORKBENCH_PROJECT_OPTIONS = Object.freeze(V2_WORKBENCH_PROJECT_BASE_IDS.map((id) => ({
    id,
    name: getProjectTitle(id),
    description: getProjectDescription(id),
  })));

  const V2_SKILL_SCOPE_TABS = [
    { id: 'workbench', label: '当前工作台技能' },
    { id: 'org', label: '公共技能' },
    { id: 'market', label: '技能市场' },
  ];

  const V2_APP_SCOPE_TABS = [
    { id: 'team', label: '公共应用' },
    { id: 'mine', label: '我的应用' },
  ];

  const V2_DEMO_APPS = [
    {
      id: 'app-contract-change',
      name: '合同变更链路核查',
      desc: '上传合同、变更签证和付款资料，自动生成变更链路核查摘要。',
      scene: 'construction',
      appType: 'analysis',
	      inputLabel: '合同、变更签证、付款资料',
	      outputLabel: '变更链路核查摘要',
	      uploadPrompt: '请上传合同、变更签证、付款资料',
	      uploadExampleFiles: ['合同.pdf'],
	      outputExampleFiles: ['变更链路核查摘要.md'],
	      skillName: '合同变更链路与金额追踪',
      skillVersion: 'v1.3.0',
      appVersion: 'v1.0.0',
      updatedAt: '06-26 10:30',
      status: 'published',
      owner: '我',
      ownerOrg: '审计一部',
      useCount: 128,
      recordStatus: '成功',
      recordTime: '06-26 11:18',
      materials: 4,
    },
    {
      id: 'app-fund-payment',
      name: '资金拨付异常扫描',
      desc: '围绕预算批复、拨付记录和用途说明，快速识别拨付异常线索。',
      scene: 'finance',
      appType: 'verification',
	      inputLabel: '预算批复、拨付记录、用途说明',
	      outputLabel: '拨付异常线索清单',
	      uploadPrompt: '请上传预算批复、拨付记录、用途说明',
	      uploadExampleFiles: ['预算批复.pdf'],
	      outputExampleFiles: ['拨付异常线索清单.md'],
	      skillName: '资金拨付合规性核查',
      skillVersion: 'v1.1.0',
      appVersion: 'v1.0.0',
      updatedAt: '06-25 17:45',
      status: 'draft',
      owner: '我',
      ownerOrg: '审计一部',
      useCount: 16,
      recordStatus: '执行中',
      recordTime: '06-26 09:42',
      materials: 3,
    },
    {
      id: 'app-report-draft',
      name: '审计报告初稿生成',
      desc: '基于底稿、疑点和整改反馈生成统一格式的审计报告初稿。',
      scene: 'finance',
      appType: 'writing',
	      inputLabel: '审计底稿、疑点、整改反馈',
	      outputLabel: '审计报告初稿',
	      uploadPrompt: '请上传审计底稿、疑点、整改反馈',
	      uploadExampleFiles: ['审计底稿.pdf'],
	      outputExampleFiles: ['审计报告初稿.md'],
	      skillName: '工作底稿与审计报告初稿',
      skillVersion: 'v0.9.2',
      appVersion: 'v0.8.0',
      updatedAt: '06-24 15:20',
      status: 'published',
      owner: '审计方法组',
      ownerOrg: '审计方法组',
      useCount: 86,
      recordStatus: '失败',
      recordTime: '06-25 16:08',
      materials: 5,
    },
  ];

  const V2_APP_EXECUTION_RECORDS = [
    {
      id: 'app-run-contract-0626',
      appId: 'app-contract-change',
      title: '合同变更链路核查',
      timeLabel: '06-26 11:18',
      sidebarTimeLabel: '5 小时',
      status: 'done',
      statusLabel: '成功',
      summary: '识别 3 条合同变更链路、2 条金额差异线索。',
      resultTitle: '合同变更链路核查结果.md',
      files: ['工程结算合同.pdf', '变更签证台账.xlsx', '付款记录.xlsx'],
    },
    {
      id: 'app-run-report-0625',
      appId: 'app-report-draft',
      title: '审计报告初稿生成',
      timeLabel: '06-25 16:08',
      sidebarTimeLabel: '1 天',
      status: 'failed',
      statusLabel: '失败',
      summary: '底稿字段缺失，报告初稿生成失败。',
      resultTitle: '执行失败说明.md',
      files: ['审计底稿.docx', '整改反馈.xlsx'],
    },
    {
      id: 'app-run-contract-0624',
      appId: 'app-contract-change',
      title: '合同变更链路核查',
      timeLabel: '06-24 14:10',
      sidebarTimeLabel: '2 天',
      status: 'done',
      statusLabel: '成功',
      summary: '生成合同变更链路摘要，已归档到当前工作台结果。',
      resultTitle: '合同变更链路摘要.md',
      files: ['合同扫描件.pdf', '补充说明.docx'],
    },
  ];

  const V2_SKILL_INSTALL_COUNT_BY_ID = {
    'sk-pub-1': 128,
    'sk-pub-2': 86,
    'sk-pub-3': 54,
    'sk-pub-4': 37,
    'sk-prv-1': 12,
  };

  const V2_DEMO_CURRENT_SKILL_OWNER = Object.freeze({
    name: '审计员01',
    org: '审计管理组',
  });

  function normalizeV2SkillOwnerName(name) {
    const text = String(name || '').trim();
    if (text === '我') return V2_DEMO_CURRENT_SKILL_OWNER.name;
    return text;
  }

  function getV2RuntimePublicSkillRows() {
    const rows = window.DemoSkillData && Array.isArray(window.DemoSkillData.publicSkillRuntimeRows)
      ? window.DemoSkillData.publicSkillRuntimeRows
      : null;
    if (rows) return rows;
    return typeof SKILL_SEED_PUBLIC !== 'undefined' && Array.isArray(SKILL_SEED_PUBLIC) ? SKILL_SEED_PUBLIC : [];
  }

  function getV2SkillRowSourceIndex(rows, sourceId) {
    if (!sourceId || !Array.isArray(rows)) return -1;
    return rows.findIndex((item) => {
      const itemSourceId = getV2SkillSourceId(item);
      return itemSourceId && itemSourceId === sourceId;
    });
  }

  function upsertV2RuntimePublicSkill(row) {
    const rows = getV2RuntimePublicSkillRows();
    if (!row || !Array.isArray(rows)) return;
    const sourceId = getV2SkillSourceId(row);
    const index = getV2SkillRowSourceIndex(rows, sourceId);
    if (index >= 0) rows.splice(index, 1, row);
    else rows.unshift(row);
  }

  function removeV2RuntimePublicSkill(sourceId) {
    const rows = getV2RuntimePublicSkillRows();
    const index = getV2SkillRowSourceIndex(rows, sourceId);
    if (index >= 0) rows.splice(index, 1);
  }

  function getV2SkillDimensionRows(kind) {
    const dims = (window.DemoSkillData && window.DemoSkillData.skillDimensions) || {};
    const rows = kind === 'skillType' ? dims.skillTypes : dims.auditScenes;
    return (Array.isArray(rows) ? rows : []).filter((item) => item && item.enabled !== false);
  }

  function getV2SkillCategoryLabel(categoryId, fallback) {
    const dims = (window.DemoSkillData && window.DemoSkillData.skillDimensions) || {};
    const categories = Array.isArray(dims.categories) ? dims.categories : [];
    const cat = categories.find((item) => String(item.id) === String(categoryId));
    return cat && cat.label ? String(cat.label) : fallback;
  }

  function touchV2SkillDimensionsRevision() {
    void (window.DemoSkillData && window.DemoSkillData.skillDimensionsRevision);
  }

  function getV2SkillSceneFilterOptions() {
    return [{ id: 'all', label: '全部' }, ...getV2SkillDimensionRows('auditScene')];
  }

  function getV2SkillCategoryTabs() {
    return [{ id: 'all', label: '全部' }, ...getV2SkillDimensionRows('skillType')];
  }

  function getV2SkillTimestamp(raw) {
    const text = String((raw && raw.updatedAt) || (raw && raw.createdAt) || '').trim();
    if (!text) return 0;
    const parsed = Date.parse(text.replace(' ', 'T'));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function getV2SkillUpdatedAtLabel(raw) {
    const text = String((raw && raw.updatedAt) || (raw && raw.createdAt) || '').trim();
    if (!text) return '—';
    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (!match) return text;
    const month = String(match[2]).padStart(2, '0');
    const day = String(match[3]).padStart(2, '0');
    const hour = match[4];
    const minute = match[5];
    if (hour != null && minute != null) {
      return `${month}-${day} ${String(hour).padStart(2, '0')}:${minute}`;
    }
    return `${month}-${day}`;
  }

  function matchV2SkillTypeFilter(card, filterId) {
    const id = String(filterId || 'all').trim();
    if (!id || id === 'all') return true;
    return String((card && card.auditScene) || '') === id;
  }

  function getV2SkillCategoryId(card) {
    return String((card && card.skillType) || '').trim() || 'other';
  }

  function matchV2SkillCategory(card, categoryId) {
    const id = String(categoryId || 'all').trim();
    if (!id || id === 'all') return true;
    return getV2SkillCategoryId(card) === id;
  }

  function getV2AppCategoryId(app) {
    return getV2SkillDimensionId('skillType', app && app.appType) || 'other';
  }

  function getV2AppCategoryTabs() {
    return getV2SkillCategoryTabs();
  }

  function matchV2AppCategory(app, categoryId) {
    const id = String(categoryId || 'all').trim();
    if (!id || id === 'all') return true;
    return getV2AppCategoryId(app) === id;
  }

  function getV2SkillDimensionLabel(kind, value) {
    const rows = getV2SkillDimensionRows(kind === 'skillType' ? 'skillType' : 'auditScene');
    const hit = rows.find((item) => String(item.id) === String(value));
    return hit ? hit.label : (value ? String(value) : '');
  }

  function getV2SkillDimensionId(kind, value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const rows = getV2SkillDimensionRows(kind === 'skillType' ? 'skillType' : 'auditScene');
    const hit = rows.find((item) => String(item.id) === text || String(item.label) === text);
    return hit ? String(hit.id) : text;
  }

  function getV2AppSceneId(app) {
    return getV2SkillDimensionId('auditScene', app && app.scene);
  }

  function v2AppSceneLabelValue(value) {
    const id = getV2SkillDimensionId('auditScene', value);
    return getV2SkillDimensionLabel('auditScene', id);
  }

  function v2AppTypeLabelValue(value) {
    const id = getV2SkillDimensionId('skillType', value);
    return getV2SkillDimensionLabel('skillType', id) || '技能应用';
  }

  function flattenV2SkillFiles(files) {
    const out = [];
    const walk = (rows) => {
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (!row) return;
        if (row.kind === 'folder') walk(row.children || []);
        else out.push(row);
      });
    };
    walk(files || []);
    return out;
  }

  function resolveV2SkillInputFileNames(raw) {
    const inputs = raw && raw.skillInputs;
    if (Array.isArray(inputs) && inputs.length) {
      return inputs.slice(0, 3).map((item) => String(item || '').trim().replace(/\.md$/i, '')).filter(Boolean);
    }
    const files = flattenV2SkillFiles(raw && raw.skillFiles);
    return files.slice(0, 3).map((file) => String(file.filename || file.name || '输入文件').trim().replace(/\.md$/i, '')).filter(Boolean);
  }

  function resolveV2SkillOutputSummary(raw) {
    const text = String((raw && raw.outputSummary) || '').trim();
    if (text) return text;
    const rule = String((raw && raw.analysisRule) || '').trim();
    if (rule) return '输出疑点清单，并给出风险说明与核查建议。';
    return '输出分析结果、核查结论与后续处理建议。';
  }

  function splitV2AppInputLabel(label) {
    return String(label || '').split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
  }

  function sortV2SkillCards(cards, sortBy, sortOrder) {
    const field = sortBy === 'install' ? 'install' : 'time';
    const dir = sortOrder === 'asc' ? 1 : -1;
    return cards.slice().sort((a, b) => {
      const left = field === 'install'
        ? Number(a.installCount || 0)
        : getV2SkillTimestamp(a.raw);
      const right = field === 'install'
        ? Number(b.installCount || 0)
        : getV2SkillTimestamp(b.raw);
      if (left === right) {
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN') * dir;
      }
      return (left - right) * dir;
    });
  }

  function getV2SkillCreatorLabel(raw, scopeTab) {
    return getV2SkillOwnerParts(raw, scopeTab).name;
  }

  function getV2SkillOwnerParts(raw, scopeTab) {
    if (!raw) return { name: '未知', org: '' };
    if (scopeTab === 'workbench') {
      const name = normalizeV2SkillOwnerName(
        raw.createdBy || raw.ownerName || raw.userName || raw.sharedBy || raw.author || V2_DEMO_CURRENT_SKILL_OWNER.name
      ) || V2_DEMO_CURRENT_SKILL_OWNER.name;
      let org = String(raw.ownerOrg || raw.organization || raw.department || raw.dept || '').trim();
      if (!org) org = V2_DEMO_CURRENT_SKILL_OWNER.org;
      if (org && org === name) org = '';
      return { name, org };
    }
    let org = String(raw.ownerOrg || raw.organization || raw.department || raw.dept || '').trim();
    let name = String(raw.ownerName || raw.userName || raw.createdBy || '').trim();
    const sharedBy = String(raw.sharedBy || '').trim();
    if (!name && sharedBy) {
      const parts = sharedBy.split(/[-－—]/).map((part) => part.trim()).filter(Boolean);
      if (!org && parts.length >= 2) org = parts.slice(0, -1).join('-');
      name = parts.length >= 2 ? parts[parts.length - 1] : sharedBy;
    }
    name = normalizeV2SkillOwnerName(name);
    if (!name && org) name = org;
    return { name: name || '审计中心', org: org && org !== name ? org : '' };
  }

  function isV2MarketSkill(raw) {
    const sourceKind = String((raw && raw.sourceKind) || '').trim();
    if (sourceKind) return sourceKind === 'market';
    const sharedBy = String((raw && raw.sharedBy) || '').trim();
    return sharedBy === '系统预置' || sharedBy === '平台管理员';
  }

  function isV2RecommendedPublicSkill(raw) {
    return !!(raw && !isV2MarketSkill(raw) && raw.recommendedAt);
  }

  function getV2SkillInstallCount(raw) {
    const id = String((raw && raw.id) || '').trim();
    if (id && Object.prototype.hasOwnProperty.call(V2_SKILL_INSTALL_COUNT_BY_ID, id)) {
      return V2_SKILL_INSTALL_COUNT_BY_ID[id];
    }
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return 20 + (hash % 180);
  }

  function getV2SkillSourceId(raw) {
    return String((raw && (raw.sourceSkillId || raw.id)) || '').trim();
  }

  function formatV2SkillInstalledAt() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
    ].join('-') + ' ' + [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(':');
  }

  function buildV2InstalledSkill(raw, meta) {
    if (!raw) return null;
    const sourceMeta = meta && typeof meta === 'object' ? meta : {};
    const sourceId = normalizeV2SkillPublishVersionLabel(sourceMeta.sourceSkillId) || getV2SkillSourceId(raw);
    let row = null;
    if (typeof demoSeedToAnalysisTemplateShape === 'function') {
      row = demoSeedToAnalysisTemplateShape(raw, raw.library || 'public');
    } else {
      row = JSON.parse(JSON.stringify(raw));
    }
    if (!row) return null;
    const now = formatV2SkillInstalledAt();
    const library = raw.library || row.library || 'public';
    row.id = 'sk-prj-install-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    row.library = library;
    row.sourceSkillId = sourceId || row.sourceSkillId || raw.id;
    row.sourceLibrary = sourceMeta.sourceLibrary || raw.sourceLibrary || (isV2MarketSkill(raw) ? 'market' : 'shared');
    row.sourceKind = sourceMeta.sourceLibrary || raw.sourceKind || (isV2MarketSkill(raw) ? 'market' : 'shared');
    row.sourceLabel = sourceMeta.sourceVersionLabel || (isV2MarketSkill(raw) ? '技能市场' : '共享技能');
    row.sourceSkillName = raw.sourceSkillName || raw.name || row.name || '';
    row.sourceVersionLabel = sourceMeta.sourceVersionLabel || raw.sourceVersionLabel || (isV2MarketSkill(raw) ? '技能市场' : '共享技能');
    if (sourceMeta.sourceWorkbenchId) row.sourceWorkbenchId = sourceMeta.sourceWorkbenchId;
    if (sourceMeta.sourceWorkbenchName) row.sourceWorkbenchName = sourceMeta.sourceWorkbenchName;
    if (!row.auditScene && raw.auditScene) row.auditScene = raw.auditScene;
    if (!row.skillType && raw.skillType) row.skillType = raw.skillType;
    if ((!row.auditScene || !row.skillType) && row.sourceSkillId) {
      const resolve = window.DemoSkillData && typeof window.DemoSkillData.resolveSkillDimensionsFromSourceId === 'function'
        ? window.DemoSkillData.resolveSkillDimensionsFromSourceId
        : null;
      if (resolve) {
        const dims = resolve(row.sourceSkillId);
        if (!row.auditScene && dims.auditScene) row.auditScene = dims.auditScene;
        if (!row.skillType && dims.skillType) row.skillType = dims.skillType;
      }
    }
    if (!row.createdBy && !row.ownerName) row.createdBy = V2_DEMO_CURRENT_SKILL_OWNER.name;
    if (!row.ownerOrg) row.ownerOrg = V2_DEMO_CURRENT_SKILL_OWNER.org;
    row.createdAt = row.createdAt || raw.createdAt || now;
    row.updatedAt = now;
    return row;
  }

  function buildV2SharedSkill(raw, meta) {
    if (!raw) return null;
    const sourceId = getV2SkillSourceId(raw);
    const now = formatV2SkillInstalledAt();
    const sourceMeta = meta && typeof meta === 'object' ? meta : {};
    const versionLabel = normalizeV2SkillPublishVersionLabel(sourceMeta.versionLabel || raw.versionLabel || raw.sourceVersionLabel || '工作台共享');
    const row = JSON.parse(JSON.stringify(raw));
    row.id = 'sk-shared-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    row.library = 'public';
    row.sharedBy = row.sharedBy && row.sharedBy !== '系统预置' ? row.sharedBy : V2_DEMO_CURRENT_SKILL_OWNER.name;
    row.sourceSkillId = sourceId || row.sourceSkillId || raw.id;
    row.sourceLibrary = raw.sourceLibrary || raw.library || 'project';
    row.sourceKind = 'shared';
    row.sourceLabel = '共享技能';
    row.sourceSkillName = raw.sourceSkillName || raw.name || row.name || '';
    row.versionLabel = versionLabel;
    row.sourceVersionLabel = versionLabel;
    row.createdAt = now;
    row.updatedAt = now;
    row.publishedVersions = [buildV2SkillPublishedVersion(row, versionLabel, now)];
    return row;
  }

  function normalizeV2SkillSyncValue(value) {
    if (Array.isArray(value)) return value.map((item) => normalizeV2SkillSyncValue(item));
    if (!value || typeof value !== 'object') return value == null ? '' : value;
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeV2SkillSyncValue(value[key]);
        return acc;
      }, {});
  }

  function getV2SkillSyncSnapshot(raw) {
    const row = raw || {};
    return normalizeV2SkillSyncValue({
      name: String(row.name || '').trim(),
      description: String(row.description || '').trim(),
      auditScene: String(row.auditScene || '').trim(),
      skillType: String(row.skillType || '').trim(),
      dimensionValues: row.dimensionValues || {},
      skillInputs: Array.isArray(row.skillInputs) ? row.skillInputs : [],
      outputSummary: String(row.outputSummary || '').trim(),
      analysisRule: String(row.analysisRule || '').trim(),
      applicableScenario: String(row.applicableScenario || '').trim(),
      skillFiles: Array.isArray(row.skillFiles) ? row.skillFiles : [],
    });
  }

  function isV2SkillSyncSnapshotEqual(source, published) {
    try {
      return JSON.stringify(getV2SkillSyncSnapshot(source)) === JSON.stringify(getV2SkillSyncSnapshot(published));
    } catch (_) {
      return false;
    }
  }

  function getV2ProjectId() {
    const raw = (window.location.hash || '').replace(/^#/, '');
    const query = raw.includes('?') ? raw.split('?')[1] : '';
    const params = new URLSearchParams(query || '');
    return params.get('projectId') || '';
  }

  function getProjectTitle(projectId) {
    const id = String(projectId || '');
    if (!id) return '新版工作台';
    if (WORKBENCH_PROJECT_NAME_BY_ID[id]) return WORKBENCH_PROJECT_NAME_BY_ID[id];
    try {
      const raw = sessionStorage.getItem('pendingNewProject');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && String(parsed.id || '') === id && parsed.name) return String(parsed.name);
    } catch (_) { /* noop */ }
    return '工作台 ' + id;
  }

  function getProjectDescription(projectId, sourceRow) {
    const direct = String((sourceRow && (sourceRow.description || sourceRow.summary)) || '').trim();
    if (direct) return direct;
    const id = String(projectId || '');
    try {
      const sourceProjects = []
        .concat((window.DemoProjectData && window.DemoProjectData.projects) || [])
        .concat((window.DemoData && window.DemoData.projects) || []);
      const hit = sourceProjects.find((row) => String((row && row.id) || '') === id);
      const desc = String((hit && (hit.description || hit.summary)) || '').trim();
      if (desc) return desc;
    } catch (_) { /* noop */ }
    if (V2_WORKBENCH_PROJECT_DESCRIPTION_BY_ID[id]) return V2_WORKBENCH_PROJECT_DESCRIPTION_BY_ID[id];
    try {
      const raw = sessionStorage.getItem('pendingNewProject');
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && String(parsed.id || '') === id) {
        return String(parsed.description || parsed.summary || '').trim();
      }
    } catch (_) { /* noop */ }
    return '';
  }

  function normalizeV2WorkbenchProjectOptions(rows) {
    const seen = new Set();
    return (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: String((row && row.id) || '').trim(),
        name: String((row && row.name) || '').trim(),
        description: getProjectDescription(row && row.id, row),
      }))
      .filter((row) => {
        if (!row.id || seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      })
      .map((row) => ({
        id: row.id,
        name: row.name || getProjectTitle(row.id),
        description: row.description || getProjectDescription(row.id, row),
      }));
  }

  function readStoredV2WorkbenchProjectOptions() {
    const byId = new Map(V2_WORKBENCH_PROJECT_OPTIONS.map((row) => [row.id, { ...row }]));
    try {
      const raw = sessionStorage.getItem(V2_WORKBENCH_PROJECT_OPTIONS_STORAGE_KEY);
      const savedRows = raw ? JSON.parse(raw) : [];
      normalizeV2WorkbenchProjectOptions(savedRows).forEach((row) => {
        byId.set(row.id, { ...row });
      });
    } catch (_) { /* noop */ }
    try {
      const raw = sessionStorage.getItem('pendingNewProject');
      const pending = raw ? JSON.parse(raw) : null;
      if (pending && pending.id) {
        byId.set(String(pending.id), {
          id: String(pending.id),
          name: String(pending.name || '').trim() || getProjectTitle(pending.id),
        });
      }
    } catch (_) { /* noop */ }
    return normalizeV2WorkbenchProjectOptions(Array.from(byId.values()));
  }

  function writeStoredV2WorkbenchProjectOptions(rows) {
    try {
      sessionStorage.setItem(
        V2_WORKBENCH_PROJECT_OPTIONS_STORAGE_KEY,
        JSON.stringify(normalizeV2WorkbenchProjectOptions(rows))
      );
    } catch (_) { /* noop */ }
  }

  function getInitialConversationId(projectId) {
    const scenario = typeof resolveWorkbenchDemoScenario === 'function'
      ? resolveWorkbenchDemoScenario(projectId)
      : null;
    if (scenario && scenario.kind === 'guide') return '';
    return (scenario && scenario.id) || (CHAT_DEMO_SCENARIOS[0] && CHAT_DEMO_SCENARIOS[0].id) || '';
  }

  function shouldStartWithBlankConversation(projectId) {
    const scenario = typeof resolveWorkbenchDemoScenario === 'function'
      ? resolveWorkbenchDemoScenario(projectId)
      : null;
    return !!(scenario && scenario.kind === 'guide');
  }

  function getConversationTitle(scenario) {
    return String((scenario && (scenario.conversationTitle || scenario.seedText || scenario.title)) || '').trim() || '未命名对话';
  }

  function getDraftConversationTitle(text) {
    const raw = String(text || '').trim().replace(/\s+/g, ' ');
    if (!raw) return '新建对话';
    return raw.length > 18 ? raw.slice(0, 18) + '...' : raw;
  }

  function getScenarioTimeLabel(scenario) {
    const id = String((scenario && scenario.id) || '');
    if (id === 'scenario-full') return '1 周';
    if (id === 'scenario-queue') return '8 小时';
    if (id === 'scenario-result-decision') return '7 小时';
    if (id === 'scenario-data-scope-query') return '5 小时';
    if (id === 'scenario-guide') return '6 小时';
    return '';
  }

  function getScenarioAgeHours(scenario) {
    const id = String((scenario && scenario.id) || '');
    if (id === 'scenario-guide') return 6;
    if (id === 'scenario-data-scope-query') return 5;
    if (id === 'scenario-result-decision') return 7;
    if (id === 'scenario-queue') return 8;
    if (id === 'scenario-full') return 24 * 7;
    return Number.MAX_SAFE_INTEGER;
  }

  function parseDemoTs(value) {
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const normalized = raw.replace(' ', 'T');
    const utcLike = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : normalized + 'Z';
    const ms = Date.parse(utcLike);
    return Number.isFinite(ms) ? ms : 0;
  }

  function getRelativeTimeLabelFromTs(value) {
    const ms = parseDemoTs(value);
    if (!ms) return '';
    const diffMinutes = Math.max(1, Math.round((Date.now() - ms) / 60000));
    if (diffMinutes < 60) return diffMinutes + ' 分钟';
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return diffHours + ' 小时';
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return diffDays + ' 天';
    return Math.round(diffDays / 7) + ' 周';
  }

  function clonePlain(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_) {
      return value;
    }
  }

  function getTaskStatusLabel(status) {
    const normalized = String(status || '').trim();
    if (normalized === 'done') return '完成';
    if (normalized === 'parsing') return '运行中';
    if (normalized === 'queued') return '排队中';
    if (normalized === 'failed') return '失败';
    return '待处理';
  }

  function getWorkbenchTaskIcon(row) {
    const taskConfig = (row && row.taskConfig) || {};
    const taskType = String((row && row.taskType) || taskConfig.taskType || '').trim();
    if (taskType === 'download-package') return { name: 'download', title: '打包下载任务', className: '' };
    if (taskConfig.taskType === 'generate-skill' || String(taskConfig.skillId || '').trim() === 'generate-skill') {
      return { name: 'tips', title: '生成技能任务', className: '' };
    }
    if (taskType === 'batch') return { name: 'document-folder', title: '跑批任务', className: '' };
    return { name: 'edit-one', title: '单次任务', className: 'is-task-single' };
  }

  function getWorkbenchTaskType(row) {
    const taskConfig = (row && row.taskConfig) || {};
    return String((row && row.taskType) || taskConfig.taskType || '').trim();
  }

  function getWorkbenchTaskSkillName(row) {
    return String((row && row.taskConfig && row.taskConfig.skillName) || (row && row.projectSource && row.projectSource.sourceSkillName) || '').trim();
  }

  function getWorkbenchTaskInstruction(row) {
    return String((row && row.taskConfig && row.taskConfig.instruction) || (row && row.batchMeta && row.batchMeta.instruction) || '').trim();
  }

  function getWorkbenchTaskResources(row) {
    const resources = row && row.taskConfig && row.taskConfig.resources;
    return Array.isArray(resources) ? resources : [];
  }

  function getWorkbenchTaskTypeTagLabel(row) {
    const taskType = getWorkbenchTaskType(row);
    if (taskType === 'generate-skill') return '生成技能任务';
    if (taskType === 'download-package') return '打包下载任务';
    if (taskType === 'batch') return '跑批任务';
    if (taskType === 'batch-child') return '子任务';
    return '单次任务';
  }

  function getWorkbenchTaskSkillTagLabel(row) {
    const taskType = getWorkbenchTaskType(row);
    if (taskType === 'download-package') return '';
    const skillName = stripDemoLabel(getWorkbenchTaskSkillName(row));
    if (!skillName || ['文件打包', '生成技能配置', '按意图生成技能配置'].includes(skillName)) return '';
    return skillName;
  }

  function getWorkbenchTaskResourceLabel(row) {
    return String((row && (row.name || row.title || row.fileName || row.label)) || '').trim() || '未命名资源';
  }

  function stripDemoLabel(text) {
    return String(text || '').replace(/[（(]演示[）)]/g, '').trim();
  }

  function getTaskStatusIcon(status) {
    const normalized = String(status || '').trim();
    if (normalized === 'queued') return { kind: 'ds', name: 'clock', className: 'is-queued' };
    if (normalized === 'parsing') return { kind: 'symbol', name: 'loading-four', className: 'is-parsing is-spin' };
    if (normalized === 'failed') return { kind: 'symbol', name: 'close-one', className: 'is-failed' };
    return null;
  }

  function getV2AppRecordStatusIcon(status) {
    const normalized = String(status || '').trim();
    if (normalized === 'done') return { kind: 'symbol', name: 'check-correct', className: 'is-done' };
    return getTaskStatusIcon(normalized);
  }

  function resolveCapabilityHost(vm) {
    const bridged = typeof window !== 'undefined' ? window.__DEMO_FREEAUDIT_CAPABILITY_HOST : null;
    if (bridged && typeof bridged.onWorkbenchV2RailSelect === 'function') return bridged;
    if (!vm) return null;
    const ref = vm.$refs && vm.$refs.capabilityHost;
    if (ref && typeof ref.onWorkbenchV2RailSelect === 'function') return ref;
    return null;
  }

  function registerCapabilityHost(vm, attempt = 0) {
    const ref = vm && vm.$refs && vm.$refs.capabilityHost;
    if (ref) {
      if (typeof window !== 'undefined') window.__DEMO_FREEAUDIT_CAPABILITY_HOST = ref;
      if (typeof ref.setWorkbenchEmbedMode === 'function') ref.setWorkbenchEmbedMode('v2');
      installCapabilityHostSyncBridge(vm, ref);
      if (vm && typeof vm.patchHostSendBridge === 'function') vm.patchHostSendBridge();
      return ref;
    }
    if (attempt < 10) setTimeout(() => registerCapabilityHost(vm, attempt + 1), 50);
    return null;
  }

  function installCapabilityHostSyncBridge(vm, host) {
    if (!vm || !host || host.__workbenchV2ShellSyncVm === vm) return;
    host.__workbenchV2ShellSyncVm = vm;
    [
      'openWorkbenchV2DetailTab',
      'activateWorkbenchV2DetailTab',
      'closeWorkbenchV2DetailTab',
      'openMaterialDetail',
      'registerWorkbenchV2DetailTabForMaterial',
      'registerWorkbenchV2DetailTabForResource',
      'registerWorkbenchV2DetailTabForExtraction',
    ].forEach((name) => {
      if (typeof host[name] !== 'function') return;
      const original = host[name].__workbenchV2ShellOriginal || host[name];
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        const shellVm = this.__workbenchV2ShellSyncVm;
        if (shellVm) {
          shellVm.v2DocWorkspaceCollapsed = false;
          shellVm.v2DocWorkspaceFullscreen = false;
          if (typeof shellVm.syncRightDrawerFromHost === 'function') {
            shellVm.syncRightDrawerFromHost(this);
            shellVm.$nextTick(() => {
              shellVm.syncRightDrawerFromHost(this);
              if (typeof shellVm.refreshV2DetailTeleport === 'function') {
                shellVm.refreshV2DetailTeleport();
              }
            });
          }
        }
        return result;
      };
      wrapped.__workbenchV2ShellOriginal = original;
      host[name] = wrapped;
    });
  }

  function resetCapabilityHostForNewSession(vm, saveExisting, attempt = 0) {
    const host = resolveCapabilityHost(vm);
    if (!host) {
      if (attempt < 10) setTimeout(() => resetCapabilityHostForNewSession(vm, saveExisting, attempt + 1), 50);
      return;
    }
    const messages = Array.isArray(host.chatMessages) ? host.chatMessages : [];
    if (saveExisting && messages.length) {
      const now = new Date();
      const title = '会话 ' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const session = {
        id: 'session-' + Date.now(),
        title,
        createdAt: title,
        messages: clonePlain(messages),
      };
      host.sessionHistory = [session].concat(host.sessionHistory || []);
      if (vm) vm.v2SavedSessions = [session].concat(vm.v2SavedSessions || []);
    }
    if (typeof host.clearChatThinkingIntervals === 'function') host.clearChatThinkingIntervals();
    if (typeof host.hideChatQueueNotice === 'function') host.hideChatQueueNotice();
    host.activeChatScenarioId = '';
    host.chatMessages = [];
    host.chatComposerDecision = null;
    host.chatInput = '';
    host.chatInputRefItems = [];
    host.chatUploadAttachments = [];
    host.historyDropdownOpen = false;
    if (typeof host.clearDailyGuidePrompt === 'function') host.clearDailyGuidePrompt();
    if (typeof host.closeChatInputTriggerMenu === 'function') host.closeChatInputTriggerMenu();
    host.$nextTick(() => {
      if (typeof host.adjustInputHeight === 'function') host.adjustInputHeight();
      if (typeof host.focusChatInput === 'function') host.focusChatInput();
    });
  }

  function openCapabilityHostTaskCreate(vm, attempt = 0) {
    const host = resolveCapabilityHost(vm);
    if (!host) {
      if (attempt < 10) setTimeout(() => openCapabilityHostTaskCreate(vm, attempt + 1), 50);
      return;
    }
    if (typeof host.handleWorkbenchTaskCreate === 'function') {
      host.handleWorkbenchTaskCreate();
      return;
    }
    if (typeof host.openWorkbenchTaskCreateModal === 'function') host.openWorkbenchTaskCreateModal();
  }

  function selectCapabilityHostRail(vm, panel, attempt = 0) {
    const host = resolveCapabilityHost(vm);
    if (!host || typeof host.onWorkbenchV2RailSelect !== 'function') {
      if (attempt < 10) setTimeout(() => selectCapabilityHostRail(vm, panel, attempt + 1), 50);
      return;
    }
    host.onWorkbenchV2RailSelect(panel);
    if (vm && typeof vm.syncRightDrawerFromHost === 'function') vm.syncRightDrawerFromHost(host);
  }

  function loadCapabilityHostConversation(vm, item, attempt = 0) {
    if (!item || !item.id) return;
    const host = resolveCapabilityHost(vm);
    if (!host) {
      if (attempt < 10) setTimeout(() => loadCapabilityHostConversation(vm, item, attempt + 1), 50);
      return;
    }
    if (item.source === 'session' && typeof host.restoreSession === 'function') {
      const session = (host.sessionHistory || []).find((row) => row && row.id === item.id);
      if (session) host.restoreSession(session);
      return;
    }
    if (item.source === 'demo' && typeof host.loadChatDemoScenario === 'function') {
      const scenario = (CHAT_DEMO_SCENARIOS || []).find((row) => row && row.id === item.id);
      if (scenario && scenario.kind === 'guide') {
        if (typeof host.clearChatThinkingIntervals === 'function') host.clearChatThinkingIntervals();
        if (typeof host.hideChatQueueNotice === 'function') host.hideChatQueueNotice();
        host.chatComposerDecision = null;
        host.chatMessages = [];
        host.activeChatScenarioId = scenario.id;
        host.chatInput = '';
        host.chatInputRefItems = [];
        host.chatUploadAttachments = [];
        if (typeof host.clearDailyGuidePrompt === 'function') host.clearDailyGuidePrompt();
        return;
      }
      if (scenario) host.loadChatDemoScenario(scenario);
    }
  }

  function openWorkbenchProjectEditFromV2(vm, attempt = 0) {
    const host = resolveCapabilityHost(vm);
    if (host && typeof host.openWorkbenchProjectEdit === 'function') {
      host.openWorkbenchProjectEdit();
      return;
    }
    const pid = String((vm && vm.projectId) || getV2ProjectId() || '').trim();
    const bridge = typeof window !== 'undefined' ? window.__demoQuoteSkillBridge : null;
    if (pid && bridge && typeof bridge.openEditForWorkbenchProject === 'function') {
      bridge.openEditForWorkbenchProject(pid);
      return;
    }
    if (attempt < 10) {
      setTimeout(() => openWorkbenchProjectEditFromV2(vm, attempt + 1), 50);
      return;
    }
    if (typeof message !== 'undefined' && message.warning) message.warning('工作台编辑入口暂不可用，请稍后重试');
  }

  function getTaskRows(projectId) {
    if (typeof demoWorkbenchTaskRows === 'undefined' || !Array.isArray(demoWorkbenchTaskRows)) return [];
    const pid = String(projectId || '').trim();
    return demoWorkbenchTaskRows
      .filter((row) => !pid || String((row && row.projectId) || 'PRJ-2026-001') === pid)
      .slice()
      .sort((a, b) => parseDemoTs(b && b.projectSource && b.projectSource.createdAt) - parseDemoTs(a && a.projectSource && a.projectSource.createdAt))
      .map((row) => {
        const icon = getWorkbenchTaskIcon(row);
        const statusIcon = getTaskStatusIcon(row && row.status);
        return {
          id: row.id,
          title: String(row.title || '').trim() || '未命名任务',
          status: String(row.status || '').trim() || 'pending',
          statusLabel: getTaskStatusLabel(row.status),
          timeLabel: String(row.status || '').trim() === 'done' ? getRelativeTimeLabelFromTs(row && row.projectSource && row.projectSource.createdAt) : '',
          iconName: icon.name,
          iconTitle: icon.title,
          iconClass: icon.className,
          statusIcon,
          taskTypeTagLabel: getWorkbenchTaskTypeTagLabel(row),
          taskSkillTagLabel: getWorkbenchTaskSkillTagLabel(row),
          raw: row,
        };
      });
  }

  function getTaskCardFromRaw(raw, host) {
    if (!raw) return null;
    const icon = getWorkbenchTaskIcon(raw);
    const status = host && typeof host.workbenchAnalysisStatusOf === 'function'
      ? host.workbenchAnalysisStatusOf(raw)
      : String(raw.status || '').trim() || 'pending';
    const statusIcon = getTaskStatusIcon(status);
    return {
      id: raw.id,
      title: String(raw.title || '').trim() || '未命名任务',
      status,
      statusLabel: getTaskStatusLabel(status),
      timeLabel: String(status || '').trim() === 'done' ? getRelativeTimeLabelFromTs(raw && raw.projectSource && raw.projectSource.createdAt) : '',
      sourceSkillName: getWorkbenchTaskSkillName(raw),
      taskType: getWorkbenchTaskType(raw),
      childCount: Array.isArray(raw.children) ? raw.children.length : 0,
      iconName: icon.name,
      iconTitle: icon.title,
      iconClass: icon.className,
      statusIcon,
      taskTypeTagLabel: getWorkbenchTaskTypeTagLabel(raw),
      taskSkillTagLabel: getWorkbenchTaskSkillTagLabel(raw),
      raw,
      node: { id: raw.id, raw },
    };
  }

  app.component('FreeAuditWorkbenchV2', {
    emits: ['navigate', 'open-new-project-modal'],
    template: `
      <a-layout
        class="workbench-v2-shell"
        data-tour-id="workbench-shell"
        :class="{
          'is-sidebar-collapsed': sidebarCollapsed,
          'is-preview-enabled': isPreviewView,
          'is-right-drawer-open': isRightDrawerOpen,
          'is-detail-open': isV2DetailOpen,
          'is-doc-workspace-fullscreen': isV2DocWorkspaceFullscreen,
          'is-mode-unselected': !workbenchMode,
          'is-simple-mode': isSimpleWorkbenchMode,
        }"
        :style="v2ShellGridStyle"
      >
        <aside class="workbench-v2-sidebar" aria-label="工作台对话与任务" data-tour-id="workbench-sidebar" @click.self="sidebarCollapsed && expandSidebar()">
          <div class="workbench-v2-brand">
            <button
              type="button"
              class="workbench-v2-brand__mark"
              :title="sidebarCollapsed ? '展开左栏' : '返回首页'"
              :aria-label="sidebarCollapsed ? '展开左栏' : '返回首页'"
              @click="handleBrandMarkClick"
            >
              <img class="workbench-v2-brand__image" src="./assets/generated/kian-kun-logo-wide.svg" alt="KianKun 审计分析平台" />
              <img class="workbench-v2-brand__logo" src="./assets/generated/qian-kun-logo-square.svg" alt="" aria-hidden="true" />
              <ds-icon class="workbench-v2-brand__expand" name="angles-right" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="workbench-v2-sidebar-collapse-btn"
              title="收起左栏"
              aria-label="收起左栏"
              @click="collapseSidebar"
            >
              <svg class="iconpark-icon workbench-v2-sidebar-collapse-icon" aria-hidden="true"><use href="#left-bar"></use></svg>
            </button>
          </div>
          <div v-if="!sidebarCollapsed" class="workbench-v2-mode-switch" aria-label="工作模式切换">
            <button type="button" :class="{ 'is-active': isSimpleWorkbenchMode }" @click="selectWorkbenchMode('simple')">简单模式</button>
            <button type="button" :class="{ 'is-active': isExpertWorkbenchMode }" @click="selectWorkbenchMode('expert')">专家模式</button>
          </div>
          <a-dropdown
            v-model:open="v2ProjectDropdownOpen"
            :trigger="['click']"
            placement="bottomLeft"
            overlay-class-name="workbench-v2-project-menu"
          >
            <div
              class="workbench-v2-project-context"
              role="button"
              tabindex="0"
              aria-label="当前工作台"
              :title="'切换工作台：' + projectTitle"
              @keydown.enter.prevent="v2ProjectDropdownOpen = true"
              @keydown.space.prevent="v2ProjectDropdownOpen = true"
            >
              <span class="workbench-v2-project-kicker">当前工作台</span>
              <span class="workbench-v2-project-title-row">
                <span class="workbench-v2-project-title" :title="projectTitle">{{ projectTitle }}</span>
                <ds-icon name="chevron-down" class="workbench-v2-project-chevron" aria-hidden="true" />
              </span>
            </div>
            <template #overlay>
              <div class="workbench-v2-project-menu__panel">
                <div class="workbench-v2-project-menu__search-row" @click.stop>
                  <span class="workbench-v2-project-search-field">
                    <ds-icon name="search" aria-hidden="true" />
                    <input
                      ref="v2ProjectSearchInput"
                      v-model="v2ProjectSearchQuery"
                      type="search"
                      class="workbench-v2-project-search-input"
                      placeholder="搜索工作台"
                      aria-label="搜索工作台"
                      @keydown.stop
                      @click.stop
                    />
                  </span>
                </div>
                <a-menu
                  :selected-keys="[projectId]"
                  @click="onWorkbenchProjectMenuClick"
                >
                  <a-menu-item
                    v-for="project in filteredWorkbenchProjectOptions"
                    :key="project.id"
                    class="workbench-v2-project-menu__project"
                    :class="{ 'workbench-v2-project-menu__current': project.id === projectId }"
                  >
                    <span class="workbench-v2-project-menu__item">
                      <span class="workbench-v2-project-menu__main">
                        <span class="workbench-v2-project-menu__text">
                          <span class="workbench-v2-project-menu__name">{{ project.name }}</span>
                          <span
                            v-if="project.description"
                            class="workbench-v2-project-menu__desc"
                            :title="project.description"
                          >{{ project.description }}</span>
                        </span>
                        <ds-icon
                          v-if="project.id === projectId"
                          name="check"
                          class="workbench-v2-project-menu__check"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </a-menu-item>
                  <a-menu-item
                    v-if="!filteredWorkbenchProjectOptions.length"
                    key="__project_empty__"
                    disabled
                    class="workbench-v2-project-menu__empty"
                  >
                    <span class="workbench-v2-project-menu__empty-text">未找到工作台</span>
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="__create_workbench__" class="workbench-v2-project-menu__create">
                    <span class="workbench-v2-project-menu__create-label">
                      <ds-icon name="plus" aria-hidden="true" />
                      <span>新建工作台</span>
                    </span>
                  </a-menu-item>
                  <a-menu-item key="__manage_workbench__" class="workbench-v2-project-menu__manage">
                    <span class="workbench-v2-project-menu__manage-label">
                      <svg class="iconpark-icon" aria-hidden="true"><use href="#workbench"></use></svg>
                      <span>管理工作台</span>
                    </span>
                  </a-menu-item>
                </a-menu>
              </div>
            </template>
          </a-dropdown>
          <div class="workbench-v2-sidebar-actions" aria-label="主内容">
            <button
              v-if="isExpertWorkbenchMode"
              type="button"
              class="workbench-v2-sidebar-action"
              data-tour-id="workbench-new-conversation-button"
              title="新建对话"
              aria-label="新建对话"
              @click="newSession"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use href="#edit-two"></use></svg>
              <span>新建对话</span>
            </button>
            <button
              v-if="isExpertWorkbenchMode"
              type="button"
              class="workbench-v2-sidebar-action"
              data-tour-id="workbench-task-create-button"
              title="新建任务"
              aria-label="新建任务"
              @click="openTaskCreate"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use href="#writing-fluently"></use></svg>
              <span>新建任务</span>
            </button>
            <button
              v-for="view in mainViews"
              :key="view.id"
              type="button"
              class="workbench-v2-sidebar-action"
              :data-tour-id="view.id === 'skill' ? 'workbench-sidebar-skill-button' : null"
              :class="{ 'is-active': isV2SidebarMainViewActive(view.id) }"
              @click="setMainView(view.id)"
            >
              <iconpark-icon v-if="view.id === 'app'" name="application-two" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
              <ds-icon v-else :name="view.icon" aria-hidden="true" />
              <span>{{ view.label }}</span>
            </button>
          </div>
          <section class="workbench-v2-conversation-list" aria-label="历史对话和任务列表">
            <template v-if="isExpertWorkbenchMode">
            <div class="workbench-v2-nav-group workbench-v2-nav-group--history" :class="{ 'is-collapsed': !v2SidebarHistoryExpanded }">
              <div class="workbench-v2-section-head">
                <button
                  type="button"
                  class="workbench-v2-section-head__toggle"
                  :title="v2SidebarHistoryExpanded ? '收起对话' : '展开对话'"
                  :aria-label="v2SidebarHistoryExpanded ? '收起对话' : '展开对话'"
                  :aria-expanded="v2SidebarHistoryExpanded ? 'true' : 'false'"
                  aria-controls="workbench-v2-sidebar-history-list"
                  @click="v2SidebarHistoryExpanded = !v2SidebarHistoryExpanded"
                >
                  <span class="workbench-v2-section-head__label">对话</span>
                  <ds-icon name="chevron-right" class="workbench-v2-section-head__chev" :class="{ 'is-expanded': v2SidebarHistoryExpanded }" aria-hidden="true" />
                </button>
                <span class="workbench-v2-section-head__actions" @click.stop>
                  <button
                    type="button"
                    class="workbench-v2-section-icon-btn"
                    :class="{ 'is-active': v2ConversationBulkActive }"
                    :title="v2ConversationBulkActive ? '退出多选' : '多选'"
                    :aria-label="v2ConversationBulkActive ? '退出对话多选' : '对话多选'"
                    :aria-pressed="v2ConversationBulkActive ? 'true' : 'false'"
                    @click.stop="toggleConversationBulkMode"
                  >
                    <svg class="iconpark-icon" aria-hidden="true"><use href="#check-correct"></use></svg>
                  </button>
                </span>
              </div>
              <div v-show="v2SidebarHistoryExpanded" id="workbench-v2-sidebar-history-list" class="workbench-v2-nav-group__body">
              <a-dropdown
                v-for="item in historyConversations"
                :key="item.id"
                :trigger="['contextmenu']"
                :disabled="v2ConversationBulkActive"
              >
              <div
                class="workbench-v2-conversation"
                :class="{ 'is-active': activeMainView === 'chat' && item.id === activeConversationId, 'is-bulk-mode': v2ConversationBulkActive, 'is-bulk-selected': isConversationBulkSelected(item) }"
                role="button"
                tabindex="0"
                @click="handleConversationRowClick(item)"
                @keydown.enter.prevent="handleConversationRowClick(item)"
                @keydown.space.prevent="handleConversationRowClick(item)"
              >
                <a-checkbox
                  v-if="v2ConversationBulkActive"
                  class="workbench-v2-conversation__check"
                  :checked="isConversationBulkSelected(item)"
                  :aria-label="'选择对话 ' + item.title"
                  @click.stop
                  @change="(e) => toggleConversationBulkSelection(item, e)"
                />
                <span class="workbench-v2-conversation__icon" aria-hidden="true"><ds-icon name="chat-ref" /></span>
                <span class="workbench-v2-conversation__main">
                  <span class="workbench-v2-conversation__title">{{ item.title }}</span>
                </span>
                <span v-if="!v2ConversationBulkActive && item.timeLabel" class="workbench-v2-conversation__time">{{ item.timeLabel }}</span>
                <span v-if="!v2ConversationBulkActive" class="workbench-v2-conversation__actions" @click.stop>
                  <a-dropdown :trigger="['click']">
                    <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多会话操作" @click.stop>
                      <ds-icon name="more" aria-hidden="true" />
                    </button>
	                    <template #overlay>
	                      <a-menu @click="({ key }) => onSidebarConversationMenu(key, item)">
	                        <a-menu-item key="delete" danger>删除</a-menu-item>
	                      </a-menu>
	                    </template>
                  </a-dropdown>
                </span>
              </div>
	              <template #overlay>
	                <a-menu @click="({ key }) => onSidebarConversationMenu(key, item)">
	                  <a-menu-item key="delete" danger>删除</a-menu-item>
	                </a-menu>
	              </template>
              </a-dropdown>
              <div v-if="!historyConversations.length" class="workbench-v2-list-empty">暂无对话</div>
              <div v-if="v2ConversationBulkActive" class="workbench-v2-conversation-bulk-bar" aria-label="对话批量操作">
                <a-checkbox
                  class="workbench-v2-conversation-bulk-bar__select"
                  :checked="conversationBulkAllSelected"
                  :indeterminate="conversationBulkSomeSelected"
                  :disabled="!historyConversations.length"
                  @change="toggleConversationBulkSelectAll"
	                >全选</a-checkbox>
	                <span class="workbench-v2-conversation-bulk-bar__count">已选 {{ v2ConversationBulkSelectedCount }}</span>
	                <button
	                  type="button"
	                  class="workbench-v2-conversation-bulk-bar__btn is-danger"
                  :disabled="!v2ConversationBulkSelectedCount"
                  @click="confirmConversationBulkDelete"
                >删除</button>
                <button type="button" class="workbench-v2-conversation-bulk-bar__btn" @click="resetConversationBulkMode">取消</button>
              </div>
              </div>
            </div>
            <div
              class="workbench-v2-nav-group workbench-v2-nav-group--tasks"
              :class="{ 'is-collapsed': !v2SidebarTasksExpanded }"
              data-tour-id="workbench-task-list"
            >
              <div class="workbench-v2-section-head">
                <button
                  type="button"
                  class="workbench-v2-section-head__toggle"
                  :title="v2SidebarTasksExpanded ? '收起任务' : '展开任务'"
                  :aria-label="v2SidebarTasksExpanded ? '收起任务' : '展开任务'"
                  :aria-expanded="v2SidebarTasksExpanded ? 'true' : 'false'"
                  aria-controls="workbench-v2-sidebar-task-list"
                  @click="v2SidebarTasksExpanded = !v2SidebarTasksExpanded"
                >
                  <span class="workbench-v2-section-head__label">任务</span>
                  <ds-icon name="chevron-right" class="workbench-v2-section-head__chev" :class="{ 'is-expanded': v2SidebarTasksExpanded }" aria-hidden="true" />
                </button>
                <span class="workbench-v2-section-head__actions" @click.stop>
                  <button
                    type="button"
                    class="workbench-v2-section-icon-btn"
                    :class="{ 'is-active': workbenchBulkScopeActive('task', 'task') }"
                    :title="workbenchBulkScopeActive('task', 'task') ? '退出多选' : '多选'"
                    :aria-label="workbenchBulkScopeActive('task', 'task') ? '退出任务多选' : '任务多选'"
                    :aria-pressed="workbenchBulkScopeActive('task', 'task') ? 'true' : 'false'"
                    @click.stop="toggleSidebarTaskBulkMode"
                  >
                    <svg class="iconpark-icon" aria-hidden="true"><use href="#check-correct"></use></svg>
                  </button>
                </span>
              </div>
              <div v-show="v2SidebarTasksExpanded" id="workbench-v2-sidebar-task-list" class="workbench-v2-nav-group__body">
              <div
                v-if="workbenchBulkScopeActive('task', 'task')"
                class="workbench-bulk-bar workbench-bulk-bar--task workbench-v2-sidebar-bulk-bar"
                role="toolbar"
                aria-label="任务批量操作"
              >
                <span class="workbench-bulk-bar__summary">
                  <a-checkbox
                    class="workbench-bulk-bar__check"
                    :checked="workbenchBulkAllSelected('task', 'task')"
                    :indeterminate="workbenchBulkSomeSelected('task', 'task')"
                    :disabled="!workbenchBulkSelectableKeys('task', 'task').length"
                    @change="(e) => toggleWorkbenchBulkSelectAll('task', 'task', e)"
                  />
                  <span class="workbench-bulk-bar__count">已选 {{ workbenchBulkSelectedCount('task') }} 项</span>
                  <button type="button" class="workbench-bulk-bar__cancel-link" @click.stop="resetWorkbenchBulkSelection('task')">取消</button>
                </span>
                <div class="workbench-bulk-bar__actions">
                  <a-tooltip
                    v-for="action in workbenchBulkActionKeys('task', 'primary').concat(workbenchBulkActionKeys('task', 'more'))"
                    :key="'sidebar-task-bulk-' + action"
                    :title="workbenchBulkActionTooltip(action, 'task')"
                  >
                    <span
                      class="workbench-bulk-bar__action-badge"
                      :class="{ 'has-count': workbenchBulkActionCount(action, 'task') > 0 }"
                      :data-count="workbenchBulkActionCountText(action, 'task')"
                    >
                      <a-button
                        type="text"
                        class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn workbench-bulk-bar__btn"
                        :class="{ 'is-danger': action === 'delete' }"
                        :disabled="!workbenchBulkActionCount(action, 'task')"
                        :title="workbenchBulkActionTooltip(action, 'task')"
                        :aria-label="workbenchBulkActionTooltip(action, 'task')"
                        @click.stop="onWorkbenchBulkAction('task', action)"
                      ><ds-icon :name="workbenchBulkActionIcon(action)" aria-hidden="true" /></a-button>
                    </span>
                  </a-tooltip>
                </div>
              </div>
              <a-dropdown
                v-for="item in taskCards"
                :key="item.id"
                :trigger="['contextmenu']"
                :disabled="workbenchBulkScopeActive('task', 'task') || item.sourceType === 'app-execution'"
              >
              <div
                class="workbench-v2-conversation workbench-v2-conversation--task"
                :class="{ 'is-active': (activeMainView === 'task' && item.id === activeTaskId) || (item.sourceType === 'app-execution' && activeMainView === 'app' && v2AppStage === 'record' && item.id === v2ActiveAppRecordId), 'is-bulk-mode': workbenchBulkScopeActive('task', 'task'), 'is-bulk-selected': workbenchBulkIsSelected(sidebarTaskBulkDescriptor(item)) }"
                role="button"
                tabindex="0"
                @click="handleSidebarTaskRowClick(item, $event)"
                @keydown.enter.prevent="handleSidebarTaskRowClick(item, $event)"
                @keydown.space.prevent="handleSidebarTaskRowClick(item, $event)"
              >
                <a-checkbox
                  v-if="workbenchBulkScopeActive('task', 'task') && sidebarTaskBulkDescriptor(item)"
                  class="workbench-v2-conversation__check"
                  :checked="workbenchBulkIsSelected(sidebarTaskBulkDescriptor(item))"
                  :aria-label="'选择任务 ' + item.title"
                  @click.stop
                  @change="(e) => toggleWorkbenchBulkSelection(sidebarTaskBulkDescriptor(item), e)"
                />
                <span class="workbench-v2-conversation__icon" :class="item.iconClass" aria-hidden="true">
                  <ds-icon :name="item.iconName" :title="item.iconTitle" />
                </span>
                <span class="workbench-v2-conversation__main">
                  <span class="workbench-v2-conversation__title">{{ item.title }}</span>
                </span>
                <span v-if="!workbenchBulkScopeActive('task', 'task') && item.timeLabel" class="workbench-v2-conversation__time">{{ item.timeLabel }}</span>
                <span
                  v-else-if="!workbenchBulkScopeActive('task', 'task') && item.statusIcon"
                  class="workbench-v2-conversation__status-icon"
                  :class="item.statusIcon.className"
                  :title="item.statusLabel"
                  :aria-label="item.statusLabel"
                >
                  <ds-icon v-if="item.statusIcon.kind === 'ds'" :name="item.statusIcon.name" />
                  <svg v-else class="iconpark-icon" aria-hidden="true" focusable="false"><use :href="'#' + item.statusIcon.name"></use></svg>
                </span>
                <span v-else-if="!workbenchBulkScopeActive('task', 'task')" class="workbench-v2-conversation__state" :class="'is-' + item.status">{{ item.statusLabel }}</span>
                <span v-if="!workbenchBulkScopeActive('task', 'task') && item.sourceType !== 'app-execution'" class="workbench-v2-conversation__actions" @click.stop>
                  <a-dropdown :trigger="['click']">
                    <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多操作" @click.stop>
                      <ds-icon name="more" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu @click="({ key }) => onSidebarTaskMenu(key, item)">
                        <a-menu-item key="task-detail">查看基本信息</a-menu-item>
                        <a-menu-divider />
                        <a-menu-item v-if="canDownloadTask(item)" key="download-package">下载</a-menu-item>
                        <a-menu-item v-if="canSidebarPackageTaskAbort(item)" key="abort-task">中止</a-menu-item>
                        <a-menu-item v-if="sidebarBatchParentShowAbortQuick(item) && !canSidebarPackageTaskAbort(item)" key="abort-task">{{ sidebarAbortMenuLabel(item) }}</a-menu-item>
                        <a-menu-item v-if="sidebarBatchParentCanRerunMenu(item)" key="rerun-all">一键重跑</a-menu-item>
                        <a-menu-item
                          v-if="sidebarBatchParentCanRerunMenu(item)"
                          key="rerun-failed-only"
                          :disabled="!sidebarBatchParentFailedChildCount(item)"
                        >一键重跑（仅失败）</a-menu-item>
                        <a-menu-item
                          v-if="sidebarBatchParentCanRerunMenu(item)"
                          key="clear-failed-only"
                          :disabled="!sidebarBatchParentFailedChildCount(item)"
                        >一键清空（仅失败）</a-menu-item>
                        <a-menu-item v-if="sidebarTaskCanShowRerun(item)" key="rerun-task">{{ sidebarTaskRerunMenuLabel(item) }}</a-menu-item>
                        <a-menu-divider v-if="sidebarTaskMenuHasNonDelete(item)" />
                        <a-menu-item key="delete" danger>删除</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </span>
              </div>
              <template #overlay>
                <a-menu @click="({ key }) => onSidebarTaskMenu(key, item)">
                  <a-menu-item key="task-detail">查看基本信息</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item v-if="canDownloadTask(item)" key="download-package">下载</a-menu-item>
                  <a-menu-item v-if="canSidebarPackageTaskAbort(item)" key="abort-task">中止</a-menu-item>
                  <a-menu-item v-if="sidebarBatchParentShowAbortQuick(item) && !canSidebarPackageTaskAbort(item)" key="abort-task">{{ sidebarAbortMenuLabel(item) }}</a-menu-item>
                  <a-menu-item v-if="sidebarBatchParentCanRerunMenu(item)" key="rerun-all">一键重跑</a-menu-item>
                  <a-menu-item
                    v-if="sidebarBatchParentCanRerunMenu(item)"
                    key="rerun-failed-only"
                    :disabled="!sidebarBatchParentFailedChildCount(item)"
                  >一键重跑（仅失败）</a-menu-item>
                  <a-menu-item
                    v-if="sidebarBatchParentCanRerunMenu(item)"
                    key="clear-failed-only"
                    :disabled="!sidebarBatchParentFailedChildCount(item)"
                  >一键清空（仅失败）</a-menu-item>
                  <a-menu-item v-if="sidebarTaskCanShowRerun(item)" key="rerun-task">{{ sidebarTaskRerunMenuLabel(item) }}</a-menu-item>
                  <a-menu-divider v-if="sidebarTaskMenuHasNonDelete(item)" />
                  <a-menu-item key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
              </a-dropdown>
              <div v-if="!taskCards.length" class="workbench-v2-list-empty">暂无任务</div>
              </div>
            </div>
            </template>
            <template v-else>
              <div class="workbench-v2-nav-group workbench-v2-nav-group--tasks" aria-label="收藏">
                <div class="workbench-v2-section-head">
                  <span class="workbench-v2-section-head__label">收藏</span>
                </div>
                <div class="workbench-v2-nav-group__body">
                  <div
                    v-for="app in v2FrequentSidebarApps"
                    :key="'frequent-app-' + app.id"
                    class="workbench-v2-conversation workbench-v2-conversation--task"
                    :class="{ 'is-active': activeMainView === 'app' && v2AppStage === 'use' && v2ActiveAppId === app.id }"
                    role="button"
                    tabindex="0"
                    :title="app.name"
                    @click="openV2AppUse(app)"
                    @keydown.enter.prevent="openV2AppUse(app)"
                    @keydown.space.prevent="openV2AppUse(app)"
                  >
                    <span class="workbench-v2-conversation__icon" aria-hidden="true">
                      <iconpark-icon name="application-one" class="iconpark-icon"></iconpark-icon>
                    </span>
                    <span class="workbench-v2-conversation__main">
                      <span class="workbench-v2-conversation__title">{{ app.name }}</span>
                    </span>
                  </div>
                  <div v-if="!v2FrequentSidebarApps.length" class="workbench-v2-list-empty">暂无收藏</div>
                </div>
              </div>
              <div class="workbench-v2-nav-group workbench-v2-nav-group--tasks" :class="{ 'is-collapsed': !v2SidebarAppHistoryExpanded }" aria-label="应用任务">
                <div class="workbench-v2-section-head">
                  <button
                    type="button"
                    class="workbench-v2-section-head__toggle"
                    :title="v2SidebarAppHistoryExpanded ? '收起任务' : '展开任务'"
                    :aria-label="v2SidebarAppHistoryExpanded ? '收起任务' : '展开任务'"
                    :aria-expanded="v2SidebarAppHistoryExpanded ? 'true' : 'false'"
                    aria-controls="workbench-v2-sidebar-app-history-list"
                    @click="v2SidebarAppHistoryExpanded = !v2SidebarAppHistoryExpanded"
                  >
                    <span class="workbench-v2-section-head__label">任务</span>
                    <ds-icon name="chevron-right" class="workbench-v2-section-head__chev" :class="{ 'is-expanded': v2SidebarAppHistoryExpanded }" aria-hidden="true" />
                  </button>
                </div>
                <div v-show="v2SidebarAppHistoryExpanded" id="workbench-v2-sidebar-app-history-list" class="workbench-v2-nav-group__body">
                  <a-dropdown
                    v-for="record in v2SidebarExecutionRecords"
                    :key="record.id"
                    :trigger="['contextmenu']"
                  >
                  <div
                    class="workbench-v2-conversation workbench-v2-conversation--task"
                    :class="{ 'is-active': activeMainView === 'app' && v2AppStage === 'record' && v2ActiveAppRecordId === record.id }"
                    role="button"
                    tabindex="0"
                    :title="record.title"
                    @click="openV2AppRecord(record)"
                    @keydown.enter.prevent="openV2AppRecord(record)"
                    @keydown.space.prevent="openV2AppRecord(record)"
                  >
                    <span class="workbench-v2-conversation__icon is-task-single" aria-hidden="true"><ds-icon name="edit-one" title="单次任务" /></span>
                    <span class="workbench-v2-conversation__main">
                      <span class="workbench-v2-conversation__title">{{ record.title }}</span>
                    </span>
                    <span v-if="record.timeLabel" class="workbench-v2-conversation__time">{{ record.timeLabel }}</span>
                    <span
                      v-else-if="record.statusIcon"
                      class="workbench-v2-conversation__status-icon"
                      :class="record.statusIcon.className"
                      :title="record.statusLabel"
                      :aria-label="record.statusLabel"
                    >
                      <ds-icon v-if="record.statusIcon.kind === 'ds'" :name="record.statusIcon.name" />
                      <svg v-else class="iconpark-icon" aria-hidden="true" focusable="false"><use :href="'#' + record.statusIcon.name"></use></svg>
                    </span>
                    <span v-else class="workbench-v2-conversation__state" :class="'is-' + record.status">{{ record.statusLabel }}</span>
                    <span class="workbench-v2-conversation__actions" @click.stop>
                      <a-dropdown :trigger="['click']">
                        <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多历史记录操作" @click.stop>
                          <ds-icon name="more" aria-hidden="true" />
                        </button>
                        <template #overlay>
                          <a-menu @click="({ key }) => onV2AppRecordMenu(key, record)">
                            <a-menu-item key="rename">重命名</a-menu-item>
                            <a-menu-item key="delete" danger>删除</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </span>
                  </div>
                  <template #overlay>
                    <a-menu @click="({ key }) => onV2AppRecordMenu(key, record)">
                      <a-menu-item key="rename">重命名</a-menu-item>
                      <a-menu-item key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                  </a-dropdown>
                  <div v-if="!v2SidebarExecutionRecords.length" class="workbench-v2-list-empty">暂无历史</div>
                </div>
              </div>
            </template>
          </section>
          <div class="workbench-v2-sidebar-footer">
            <button type="button" class="workbench-v2-sidebar-action workbench-v2-sidebar-action--quiet" title="编辑工作台" aria-label="编辑工作台" @click="openWorkbenchSettings">
              <svg class="iconpark-icon" aria-hidden="true"><use href="#config"></use></svg>
              <span>设置</span>
            </button>
          </div>
        </aside>

        <div
          v-if="!sidebarCollapsed"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-sidebar-resizer"
          :class="{ 'is-v2-resizer-active': v2Resizing && v2Resizing.side === 'sidebar' }"
          role="separator"
          aria-orientation="vertical"
          title="调整左栏宽度"
          @mousedown.stop.prevent="beginV2Resize('sidebar', $event)"
        ></div>

        <main class="workbench-v2-main" data-tour-id="workbench-main">
          <header v-show="showWorkbenchMainHeader" class="workbench-v2-header">
            <div class="workbench-v2-header__left">
              <div class="workbench-v2-title-group">
                <button
                  v-if="activeMainView === 'app' && (v2AppStage === 'config' || v2AppStage === 'use')"
                  type="button"
                  class="workbench-v2-title-more-btn workbench-v2-title-back-btn"
                  title="返回应用"
                  aria-label="返回应用"
                  @click="backToV2AppList"
                >
                  <iconpark-icon name="arrow-left" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                </button>
                <button
                  v-if="activeMainView === 'task' && activeTaskIsBatch && activeBatchChildCard"
                  type="button"
                  class="workbench-v2-title-more-btn workbench-v2-title-back-btn"
                  title="返回子任务列表"
                  aria-label="返回子任务列表"
                  @click="backToV2BatchChildList"
                >
                  <iconpark-icon name="arrow-left" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                </button>
                <h1 class="workbench-v2-title">{{ activeMainTitle }}</h1>
                <span
                  v-if="activeMainView === 'app' && (v2AppStage === 'config' || v2AppStage === 'use') && v2AppCardIsShared(activeV2App)"
                  class="workbench-v2-title-status-tag"
                  title="已公开为公共应用"
                >已公开</span>
                <a-dropdown
                  v-if="activeMainView === 'app' && (v2AppStage === 'config' || v2AppStage === 'use') && activeV2App"
                  :trigger="['click']"
                  placement="bottomLeft"
                  @click.stop
                >
                  <button type="button" class="workbench-v2-title-more-btn" title="管理应用" aria-label="更多应用操作" @click.stop>
                    <ds-icon name="more" aria-hidden="true" />
                  </button>
                  <template #overlay>
                    <a-menu @click="({ key }) => onV2AppCardMenu(key, activeV2App)">
                      <a-menu-item v-if="isSimpleWorkbenchMode" key="favorite">{{ v2AppFavoriteMenuLabel(activeV2App) }}</a-menu-item>
                      <a-menu-divider v-if="isSimpleWorkbenchMode && v2AppEditable(activeV2App)" />
                      <a-menu-item v-if="v2AppEditable(activeV2App)" key="edit">编辑</a-menu-item>
                      <a-menu-item v-if="v2AppEditable(activeV2App)" key="share">{{ v2AppCardShareMenuLabel(activeV2App) }}</a-menu-item>
                      <a-menu-item v-if="v2AppEditable(activeV2App)" key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
                <a-dropdown v-if="activeMainView === 'task' && activeTaskIsBatch && !activeBatchChildCard" :trigger="['click']" placement="bottomLeft" @click.stop>
                  <button type="button" class="workbench-v2-title-more-btn" title="更多操作" aria-label="更多操作" @click.stop>
                    <ds-icon name="more" aria-hidden="true" />
                  </button>
                  <template #overlay>
                    <a-menu @click="({ key }) => handleV2BatchParentHeaderMenu(key)">
                      <a-menu-item v-if="sidebarBatchParentShowAbortQuick(activeTaskCard)" key="abort-task">一键中止</a-menu-item>
                      <a-menu-item v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)" key="rerun-all">一键重跑</a-menu-item>
                      <a-menu-item v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)" key="rerun-failed-only" :disabled="!sidebarBatchParentFailedChildCount(activeTaskCard)">一键重跑（仅失败）</a-menu-item>
                      <a-menu-item v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)" key="rerun-no-result" :disabled="!v2BatchChildNoResultCount()">一键重跑（无结果）</a-menu-item>
                      <a-menu-item v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)" key="clear-failed-only" :disabled="!sidebarBatchParentFailedChildCount(activeTaskCard)">一键清空（仅失败）</a-menu-item>
                      <a-menu-divider v-if="sidebarTaskMenuHasNonDelete(activeTaskCard)" />
                      <a-menu-item key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </div>
            <div class="workbench-v2-header__right">
              <button
                v-if="activeMainView === 'chat'"
                type="button"
                class="nlm-assistant-header-btn workbench-v2-generate-skill-btn"
                data-tour-id="workbench-generate-skill-button"
                title="生成技能"
                aria-label="生成技能"
                @click="openGenerateSkillConfig"
              >
                <ds-icon name="tips" aria-hidden="true" />
                <span>生成技能</span>
              </button>
              <button
                v-else-if="showAppFloatingDetailToggle"
                type="button"
                class="nlm-assistant-header-btn"
                :class="{ 'is-active': appFloatingDetailVisible }"
                :title="appFloatingDetailToggleTitle"
                :aria-label="appFloatingDetailToggleTitle"
                @click="toggleAppFloatingDetail"
              >
                <ds-icon name="circle-info" aria-hidden="true" />
                <span>{{ appFloatingDetailButtonLabel }}</span>
              </button>
              <button
                v-else-if="activeMainView === 'app' && v2AppEditable(activeV2App) && v2AppStage === 'use'"
                type="button"
                class="nlm-assistant-header-btn"
                :class="{ 'workbench-v2-app-header-primary': !v2AppCardIsShared(activeV2App) }"
                @click="toggleV2AppShare(activeV2App)"
              >{{ v2AppCardShareMenuLabel(activeV2App) }}</button>
              <button
                v-else-if="showTaskDetailToggle"
                type="button"
                class="nlm-assistant-header-btn"
                :class="{ 'is-active': v2TaskDetailVisible }"
                :title="v2TaskDetailVisible ? '隐藏任务详情' : '显示任务详情'"
                :aria-label="v2TaskDetailVisible ? '隐藏任务详情' : '显示任务详情'"
                @click="toggleTaskDetail"
              >
                <ds-icon name="circle-info" aria-hidden="true" />
                <span>任务详情</span>
              </button>
            </div>
          </header>

          <section v-show="activeMainView === 'search'" class="workbench-v2-view-stage workbench-v2-search-view" aria-label="工作台搜索">
            <div class="workbench-v2-search-shell">
              <header class="workbench-v2-skill-header workbench-v2-search-header">
                <div class="workbench-v2-skill-header__main">
                  <h1 class="workbench-v2-skill-header__title">搜索</h1>
                </div>
              </header>
              <a-input
                v-model:value="v2SearchQuery"
                allow-clear
                size="large"
                :placeholder="isSimpleWorkbenchMode ? '搜索历史执行记录' : '搜索对话、任务'"
                class="workbench-v2-search-input"
              >
                <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
              </a-input>
              <div v-if="isSimpleWorkbenchMode" class="workbench-v2-search-results workbench-v2-search-results--app-records">
                <section class="workbench-v2-content-section">
                  <div class="workbench-v2-content-section__head">
                    <h2>{{ hasV2SearchQuery ? '匹配执行记录' : '历史执行记录' }}</h2>
                  </div>
                  <div class="workbench-v2-list-cards">
                    <div
                      v-for="record in filteredSearchAppRecords"
                      :key="'simple-search-record-' + record.id"
                      class="workbench-v2-wide-card workbench-v2-wide-card--task"
                      role="button"
                      tabindex="0"
                      @click="openV2AppRecord(record)"
                      @keydown.enter.prevent="openV2AppRecord(record)"
                      @keydown.space.prevent="openV2AppRecord(record)"
                    >
                      <span class="workbench-v2-wide-card__icon is-task-single"><ds-icon name="edit-one" title="单次任务" /></span>
                      <span class="workbench-v2-wide-card__body">
                        <span class="workbench-v2-wide-card__title">{{ record.title }}</span>
                        <span class="workbench-v2-wide-card__meta">
                          <span class="workbench-v2-wide-card__task-tag">引用材料{{ v2AppRecordSourceFiles(record).length }}</span>
                          <span class="workbench-v2-wide-card__task-tag workbench-v2-wide-card__task-tag--skill">产出结果{{ v2AppRecordResultFiles(record).length }}</span>
                        </span>
                      </span>
                      <span class="workbench-v2-wide-card__right" @click.stop>
                        <span v-if="record.statusLabel" class="workbench-v2-status" :class="'is-' + v2AppRecordStatusClass(record)">{{ record.statusLabel }}</span>
                        <span class="workbench-v2-wide-card__actions">
                          <a-dropdown :trigger="['click']">
                            <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多历史记录操作" @click.stop>
                              <ds-icon name="more" aria-hidden="true" />
                            </button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onV2AppRecordMenu(key, record)">
                                <a-menu-item key="rename">重命名</a-menu-item>
                                <a-menu-item key="delete" danger>删除</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </span>
                      </span>
                    </div>
                    <div v-if="!filteredSearchAppRecords.length" class="workbench-v2-list-empty">暂无匹配执行记录</div>
                  </div>
                </section>
              </div>
              <div v-else class="workbench-v2-search-results">
                <section class="workbench-v2-content-section">
                  <div class="workbench-v2-content-section__head">
                    <h2>{{ hasV2SearchQuery ? '匹配对话' : '最近对话' }}</h2>
                  </div>
                  <div class="workbench-v2-list-cards">
                    <div
                      v-for="item in filteredSearchConversations"
                      :key="'search-conv-' + item.id"
                      class="workbench-v2-wide-card workbench-v2-wide-card--conversation"
                      role="button"
                      tabindex="0"
                      :aria-label="'打开对话 ' + item.title"
                      @click="selectHistoryConversation(item)"
                      @keydown.enter.prevent="selectHistoryConversation(item)"
                      @keydown.space.prevent="selectHistoryConversation(item)"
                    >
                      <span class="workbench-v2-wide-card__icon"><ds-icon name="chat-ref" aria-hidden="true" /></span>
                      <span class="workbench-v2-wide-card__body">
                        <span class="workbench-v2-wide-card__title">{{ item.title }}</span>
                        <span class="workbench-v2-wide-card__meta">{{ item.timeLabel || item.meta }}</span>
                      </span>
                      <span class="workbench-v2-wide-card__actions" @click.stop>
                        <a-dropdown :trigger="['click']">
                          <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多会话操作" @click.stop>
                            <ds-icon name="more" aria-hidden="true" />
                          </button>
                          <template #overlay>
                            <a-menu @click="({ key }) => onSidebarConversationMenu(key, item)">
                              <a-menu-item key="delete" danger>删除</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                      </span>
                    </div>
                    <div v-if="!filteredSearchConversations.length" class="workbench-v2-list-empty">暂无匹配对话</div>
                  </div>
                </section>
                <section class="workbench-v2-content-section">
                  <div class="workbench-v2-content-section__head">
                    <h2>{{ hasV2SearchQuery ? '匹配任务' : '最近任务' }}</h2>
                  </div>
                  <div class="workbench-v2-list-cards">
                    <div
                      v-for="item in filteredSearchTasks"
                      :key="'search-task-' + item.id"
                      class="workbench-v2-wide-card workbench-v2-wide-card--task"
                      role="button"
                      tabindex="0"
                      :aria-label="'打开任务 ' + item.title"
                      @click="openTaskCard(item)"
                      @keydown.enter.prevent="openTaskCard(item)"
                      @keydown.space.prevent="openTaskCard(item)"
                    >
                      <span class="workbench-v2-wide-card__icon" :class="item.iconClass"><ds-icon :name="item.iconName" :title="item.iconTitle" /></span>
                      <span class="workbench-v2-wide-card__body">
	                        <span class="workbench-v2-wide-card__title">{{ item.title }}</span>
	                        <span class="workbench-v2-wide-card__meta">
	                          <span class="workbench-v2-wide-card__task-tag" :title="item.taskTypeTagLabel">{{ item.taskTypeTagLabel }}</span>
	                          <span
	                            v-if="item.taskSkillTagLabel"
	                            class="workbench-v2-wide-card__task-tag workbench-v2-wide-card__task-tag--skill"
	                            :title="item.taskSkillTagLabel"
	                          >{{ item.taskSkillTagLabel }}</span>
	                        </span>
                      </span>
                      <span class="workbench-v2-wide-card__right" @click.stop>
                        <span v-if="item.statusLabel" class="workbench-v2-status" :class="'is-' + item.status">{{ item.statusLabel }}</span>
                        <span class="workbench-v2-wide-card__actions">
                          <a-dropdown :trigger="['click']">
                            <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多任务操作" @click.stop>
                              <ds-icon name="more" aria-hidden="true" />
                            </button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onSidebarTaskMenu(key, item)">
                                <a-menu-item key="task-detail">查看基本信息</a-menu-item>
                                <a-menu-divider />
                                <a-menu-item v-if="canDownloadTask(item)" key="download-package">下载</a-menu-item>
                                <a-menu-item v-if="canSidebarPackageTaskAbort(item)" key="abort-task">中止</a-menu-item>
                                <a-menu-item v-if="sidebarBatchParentShowAbortQuick(item) && !canSidebarPackageTaskAbort(item)" key="abort-task">{{ sidebarAbortMenuLabel(item) }}</a-menu-item>
                                <a-menu-item v-if="sidebarBatchParentCanRerunMenu(item)" key="rerun-all">一键重跑</a-menu-item>
                                <a-menu-item
                                  v-if="sidebarBatchParentCanRerunMenu(item)"
                                  key="rerun-failed-only"
                                  :disabled="!sidebarBatchParentFailedChildCount(item)"
                                >一键重跑（仅失败）</a-menu-item>
                                <a-menu-item
                                  v-if="sidebarBatchParentCanRerunMenu(item)"
                                  key="clear-failed-only"
                                  :disabled="!sidebarBatchParentFailedChildCount(item)"
                                >一键清空（仅失败）</a-menu-item>
                                <a-menu-item v-if="sidebarTaskCanShowRerun(item)" key="rerun-task">{{ sidebarTaskRerunMenuLabel(item) }}</a-menu-item>
                                <a-menu-divider v-if="sidebarTaskMenuHasNonDelete(item)" />
                                <a-menu-item key="delete" danger>删除</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </span>
                      </span>
                    </div>
                    <div v-if="!filteredSearchTasks.length" class="workbench-v2-list-empty">暂无匹配任务</div>
                  </div>
                </section>
              </div>
            </div>
          </section>

          <section
            v-show="activeMainView === 'app'"
            ref="v2AppPage"
            class="workbench-v2-view-stage workbench-v2-app-page"
            :class="{
              'is-app-detail': v2AppStage !== 'list',
              'is-app-record': v2AppStage === 'record',
              'is-app-main-header': v2AppStage === 'config' || v2AppStage === 'use' || v2AppStage === 'record',
              'is-app-history-overlay': showAppHistoryPanel && v2AppDetailLayout === 'overlay',
              'is-app-history-docked': showAppHistoryPanel && v2AppDetailLayout === 'dock',
              'is-app-record-detail-overlay': showAppRecordDetailPanel && v2AppDetailLayout === 'overlay',
              'is-app-record-detail-docked': showAppRecordDetailPanel && v2AppDetailLayout === 'dock',
            }"
            aria-label="应用中心"
          >
            <header v-if="showAppPageSkillHeader" class="workbench-v2-skill-header">
              <div class="workbench-v2-skill-header__main">
                <h1 class="workbench-v2-skill-header__title">{{ v2AppPageTitle }}</h1>
                <p v-if="v2AppStage === 'list'" class="workbench-v2-skill-header__subtitle">{{ v2AppPageSubtitle }}</p>
              </div>
              <div v-if="isExpertWorkbenchMode && v2AppStage === 'list'" class="workbench-v2-skill-header__actions">
                <button type="button" class="ds-btn-page-cta workbench-v2-skill-header__action" @click="openV2AppConfig(null)">
                  <ds-icon name="plus" class="ds-btn-icon-before" aria-hidden="true" />
                  <span>创建应用</span>
                </button>
              </div>
            </header>

            <template v-if="v2AppStage === 'list'">
              <div class="workbench-v2-skill-tabs" aria-label="应用范围">
                <div class="workbench-v2-skill-scope-tabs" role="tablist">
                  <button
                    v-for="tab in v2AppScopeTabs"
                    :key="tab.id"
                    type="button"
                    class="workbench-v2-skill-scope-tab"
                    :class="{ 'is-active': v2AppScopeTab === tab.id }"
                    role="tab"
                    :aria-selected="v2AppScopeTab === tab.id"
                    @click="setV2AppScopeTab(tab.id)"
                  >
                    {{ tab.label }}
                  </button>
                </div>
              </div>
              <div class="workbench-v2-skill-search-row">
                <label class="workbench-v2-skill-search">
                  <ds-icon name="search" class="workbench-v2-skill-search__icon" aria-hidden="true" />
                  <input
                    v-model="v2AppSearchQuery"
                    type="search"
                    class="workbench-v2-skill-search__input"
                    placeholder="搜索应用名称、适用场景"
                    aria-label="搜索应用名称、适用场景"
                  />
                </label>
                <div class="workbench-v2-skill-search-row__actions">
                  <a-dropdown :trigger="['click']" placement="bottomRight">
                    <button
                      type="button"
                      class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                      :class="{ 'is-active': v2AppTypeFilter !== 'all' }"
                      title="按适用场景过滤"
                      aria-label="按适用场景过滤"
                      @click.stop
                    >
                      <span class="workbench-v2-skill-filter-control__label">适用场景</span>
                      <span class="workbench-v2-skill-filter-control__value">{{ v2AppTypeFilterLabel }}</span>
                      <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu :selected-keys="[v2AppTypeFilter]" @click="onV2AppTypeFilter">
                        <a-menu-item v-for="option in v2AppTypeFilterOptions" :key="option.id">{{ option.label }}</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                  <a-dropdown :trigger="['click']" placement="bottomRight">
                    <button
                      type="button"
                      class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                      :class="{ 'is-active': v2AppSortActive }"
                      title="排序"
                      aria-label="排序"
                      @click.stop
                    >
                      <span class="workbench-v2-skill-filter-control__label">排序</span>
                      <span class="workbench-v2-skill-filter-control__value">{{ v2AppSortLabel }}</span>
                      <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu :selected-keys="[v2AppSortKey]" @click="onV2AppSort">
                        <a-menu-item key="time-desc">最新优先</a-menu-item>
                        <a-menu-item key="time-asc">最早优先</a-menu-item>
                        <a-menu-item key="name-asc">名称 A-Z</a-menu-item>
                        <a-menu-item key="name-desc">名称 Z-A</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
              </div>
              <nav v-if="v2AppCategoryTabs.length" class="workbench-v2-skill-type-tabs" aria-label="应用类型">
                <div class="workbench-v2-skill-tabs__list">
                  <button
                    v-for="tab in v2AppCategoryTabs"
                    :key="'app-type-filter-' + tab.id"
                    type="button"
                    class="workbench-v2-skill-tab"
                    :class="{ 'is-active': v2AppCategoryTab === tab.id }"
                    @click="setV2AppCategoryTab(tab.id)"
                  >
                    <span>{{ tab.label }}</span>
                  </button>
                </div>
                <span class="workbench-v2-skill-tabs__total">共 {{ filteredV2AppCards.length }} 个</span>
              </nav>
              <section class="workbench-v2-app-grid workbench-v2-skill-grid" aria-label="应用列表">
                <article
                  v-for="app in filteredV2AppCards"
                  :key="app.id"
                  class="workbench-v2-app-card workbench-v2-skill-item tc-template-card tc-template-card--list ds-list-card"
                >
                  <div class="tc-template-card__body">
                    <div
                      class="workbench-v2-app-card__open-target"
                      role="button"
                      tabindex="0"
                      @click="openV2AppCard(app, $event)"
                      @keydown.enter.prevent="openV2AppCard(app, $event)"
                      @keydown.space.prevent="openV2AppCard(app, $event)"
                    >
                    <div class="tc-template-card__head">
                      <div class="tc-template-card__hero-icon" aria-hidden="true">
                        <iconpark-icon name="application-one" class="iconpark-icon"></iconpark-icon>
                      </div>
                      <div class="tc-template-card__title-block">
                        <div class="tc-template-card__title-line">
                          <h3 class="tc-template-card__name">{{ app.name }}</h3>
                        </div>
                        <div class="tc-template-card__tags tc-template-card__tags--compact">
                          <TagLg>{{ v2AppSceneLabel(app.scene) }}</TagLg>
                        </div>
                      </div>
                      <div
                        class="tc-template-card__actions"
                        :class="{ 'has-shared-tag': v2AppCardHasCornerTag(app) }"
                      >
                        <span
                          v-if="v2AppCardHasCornerTag(app)"
                          class="tc-template-card__shared-corner-tag"
                          title="已公开为公共应用"
                        >已公开</span>
                        <div class="tc-template-card__more-slot" @click.stop>
                          <a-dropdown
                            :trigger="['click']"
                            placement="bottomRight"
                            @click.stop
                          >
                            <a-button
                              type="text"
                              size="small"
                              class="tc-template-card__more-btn ds-icon-btn ds-icon-btn--standard"
                              title="管理应用"
                              aria-label="更多应用操作"
                              @click.stop
                            >
                              <ds-icon name="more" aria-hidden="true" />
                            </a-button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onV2AppCardMenu(key, app)">
                                <a-menu-item v-if="isSimpleWorkbenchMode" key="favorite">{{ v2AppFavoriteMenuLabel(app) }}</a-menu-item>
                                <a-menu-item v-if="isExpertWorkbenchMode && v2AppEditable(app)" key="edit">编辑</a-menu-item>
                                <a-menu-item v-if="isExpertWorkbenchMode && v2AppEditable(app)" key="share">{{ v2AppCardShareMenuLabel(app) }}</a-menu-item>
                                <a-menu-item v-if="isExpertWorkbenchMode && v2AppEditable(app)" key="delete" danger>删除</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </div>
                      </div>
                    </div>
                    <p class="tc-template-card__desc">{{ app.desc }}</p>
                    <div class="tc-template-card__io">
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输入</span>
                        <div class="tc-template-card__file-list">
                          <span
                            v-for="name in v2AppInputFileNames(app)"
                            :key="app.id + '-file-' + name"
                            class="tc-template-card__file-chip"
                          >
                            <span>{{ name }}</span>
                          </span>
                          <span v-if="!v2AppInputFileNames(app).length" class="tc-template-card__io-text">按应用说明上传材料。</span>
                        </div>
                      </div>
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输出</span>
                        <span class="tc-template-card__io-text">{{ app.outputLabel }}</span>
                      </div>
                    </div>
                    </div>
                    <div
                      class="ds-card-foot tc-template-card__footer"
                      role="group"
                      :aria-label="'应用操作：' + app.name"
                    >
                      <div class="tc-template-card__meta">
                        <span
                          class="tc-template-card__owner"
                          :title="'创建人：' + app.owner"
                        >
                          <ds-icon name="user" aria-hidden="true" />
                          <span class="tc-template-card__owner-name">{{ app.owner }}</span>
                        </span>
                        <span
                          class="tc-template-card__owner-org"
                          :title="'组织：' + app.ownerOrg"
                        >
                          <iconpark-icon name="mark" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                          <span>{{ app.ownerOrg }}</span>
                        </span>
                      </div>
                      <span
                        class="tc-template-card__install-count"
                        :title="'收藏次数：' + v2AppUseCountLabel(app) + '次'"
                      >
                        <iconpark-icon name="star" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                        <span>{{ v2AppUseCountLabel(app) }}次</span>
                      </span>
                      <div class="tc-template-card__footer-right workbench-v2-app-card__actions" @click.stop>
                        <button type="button" class="workbench-v2-app-card__primary" @click.stop.prevent="openV2AppEnter(app)">进入</button>
                      </div>
                    </div>
                  </div>
                </article>
                <div v-if="!filteredV2AppCards.length" class="workbench-v2-skill-empty">暂无应用</div>
              </section>
            </template>

            <template v-else-if="v2AppStage === 'config'">
              <header
                class="workbench-v2-app-content-toolbar"
                aria-label="应用配置工具栏"
              >
                <div
                  v-if="!isSimpleWorkbenchMode"
                  class="workbench-v2-app-mode-switch workbench-v2-mode-switch"
                  role="tablist"
                  aria-label="应用配置模式"
                >
                  <button
                    v-if="v2AppEditable(activeV2App)"
                    type="button"
                    :class="{ 'is-active': v2AppConfigView === 'config' }"
                    role="tab"
                    :aria-selected="v2AppConfigView === 'config'"
                    @click="openV2AppConfigEditorView"
                  >
                    配置
                  </button>
                  <button
                    type="button"
                    role="tab"
                    :class="{ 'is-active': v2AppConfigView === 'preview' }"
                    :aria-selected="v2AppConfigView === 'preview'"
                    @click="openV2AppConfigPreview"
                  >
                    预览
                  </button>
                </div>
              </header>

              <section v-if="v2AppConfigView === 'config'" class="workbench-v2-app-config-page" aria-label="应用配置页">
                <section class="workbench-v2-app-config-card workbench-v2-app-config-basics" aria-label="基本信息与示例文件">
                  <div class="workbench-v2-app-config-block workbench-v2-app-config-block--profile">
                    <div class="workbench-v2-app-config-summary">
                      <div class="workbench-v2-app-config-summary__head">
                        <div class="workbench-v2-app-config-summary__identity">
                          <div class="workbench-v2-app-config-summary__icon" aria-hidden="true">
                            <iconpark-icon name="application-one" class="iconpark-icon"></iconpark-icon>
                          </div>
                          <div class="workbench-v2-app-config-summary__meta">
                            <h2>{{ v2AppForm.name || activeV2App.name }}</h2>
                            <div class="tc-template-card__tags tc-template-card__tags--compact workbench-v2-app-config-summary__tags">
                              <TagLg>{{ v2AppSceneLabel(v2AppForm.scene || activeV2App.scene) }}</TagLg>
                              <TagLg>{{ v2AppTypeLabel(v2AppForm.appType || activeV2App.appType) }}</TagLg>
                            </div>
                          </div>
                        </div>
                        <button type="button" class="workbench-v2-app-config-summary__edit" @click="openV2AppConfig(activeV2App)">编辑</button>
                      </div>
                      <p class="workbench-v2-app-config-summary__desc">{{ v2AppForm.desc || activeV2App.desc }}</p>
                    </div>
                    <div class="workbench-v2-app-config-io">
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输入</span>
                        <div class="tc-template-card__file-list">
                          <span
                            v-for="name in v2AppFormInputItems()"
                            :key="'config-io-input-' + name"
                            class="tc-template-card__file-chip"
                          >
                            <span>{{ name }}</span>
                          </span>
                          <span v-if="!v2AppFormInputItems().length" class="tc-template-card__io-text">按应用说明上传材料。</span>
                        </div>
                      </div>
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输出</span>
                        <span class="tc-template-card__io-text">{{ v2AppForm.outputLabel || '输出分析结果与核查建议' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="workbench-v2-app-config-block workbench-v2-app-config-block--examples">
                    <header class="workbench-v2-app-config-block__head">
                      <h2>示例文件</h2>
                      <p>配置使用页展示的输入、输出示例，帮助使用者理解应上传的材料与预期结果。</p>
                    </header>
                    <div class="workbench-v2-app-config-examples">
                      <section>
                        <header>
                          <h3>上传文件示例</h3>
                          <button type="button" class="workbench-v2-app-config-text-btn" @click="simulateV2AppExampleUpload('input')">
                            <ds-icon name="upload" aria-hidden="true" />
                            <span>添加</span>
                          </button>
                        </header>
                        <div class="workbench-v2-app-config-list">
                          <div v-for="file in v2AppForm.uploadExampleFiles" :key="'config-upload-example-' + file" class="workbench-v2-app-config-list__row">
                            <span class="workbench-v2-app-config-list__name">
                              <ds-icon :name="v2AppRecordFileIconName(file)" class="workbench-v2-app-config-list__file-icon" aria-hidden="true" />
                              <span>{{ file }}</span>
                            </span>
                            <button type="button" class="workbench-v2-app-config-example-btn" @click="removeV2AppExampleFile('input', file)">
                              <ds-icon name="delete" aria-hidden="true" />
                              <span>移除</span>
                            </button>
                          </div>
                          <div v-if="!v2AppForm.uploadExampleFiles.length" class="workbench-v2-app-config-list__empty">暂无上传文件示例</div>
                        </div>
                      </section>
                      <section>
                        <header>
                          <h3>结果输出示例</h3>
                          <button type="button" class="workbench-v2-app-config-text-btn" @click="simulateV2AppExampleUpload('output')">
                            <ds-icon name="upload" aria-hidden="true" />
                            <span>添加</span>
                          </button>
                        </header>
                        <div class="workbench-v2-app-config-list">
                          <div v-for="file in v2AppForm.outputExampleFiles" :key="'config-output-example-' + file" class="workbench-v2-app-config-list__row">
                            <span class="workbench-v2-app-config-list__name">
                              <ds-icon :name="v2AppRecordFileIconName(file)" class="workbench-v2-app-config-list__file-icon" aria-hidden="true" />
                              <span>{{ file }}</span>
                            </span>
                            <button type="button" class="workbench-v2-app-config-example-btn" @click="removeV2AppExampleFile('output', file)">
                              <ds-icon name="delete" aria-hidden="true" />
                              <span>移除</span>
                            </button>
                          </div>
                          <div v-if="!v2AppForm.outputExampleFiles.length" class="workbench-v2-app-config-list__empty">暂无结果输出示例</div>
                        </div>
                      </section>
                    </div>
                  </div>
                </section>
                <section class="workbench-v2-app-config-card workbench-v2-app-upload-setting" aria-label="上传说明设置">
                  <header class="workbench-v2-app-config-block__head">
                    <h2>上传说明</h2>
                    <p>自定义应用使用页的上传提示文字。</p>
                  </header>
                  <a-textarea
                    v-model:value="v2AppForm.uploadPrompt"
                    :maxlength="120"
                    :rows="3"
                    show-count
                    @blur="autosaveV2AppConfigPage"
                  />
                </section>
              </section>
              <section v-else class="workbench-v2-app-use workbench-v2-app-config-preview is-history-hidden" aria-label="应用预览页">
                <div class="workbench-v2-app-use-workspace">
                  <div class="workbench-v2-app-use__main">
                    <div class="workbench-v2-app-use-stack">
                      <section class="workbench-v2-app-use-intro" aria-label="应用介绍预览">
                        <div class="workbench-v2-app-use-hero">
                          <header class="workbench-v2-app-use-hero__head">
                            <h2 class="workbench-v2-app-use-hero__title">{{ activeV2App.name }}</h2>
                            <div class="workbench-v2-app-use-hero__tags">
                              <span class="workbench-v2-app-use-hero__tag">{{ v2AppSceneLabel(activeV2App.scene) }}</span>
                              <span class="workbench-v2-app-use-hero__tag">{{ v2AppTypeLabel(activeV2App.appType) }}</span>
                            </div>
                          </header>
                          <p class="workbench-v2-app-use-hero__desc">{{ activeV2App.desc }}</p>
                          <div class="workbench-v2-app-use-hero__io-panel">
                            <div class="workbench-v2-app-use-hero__io-col workbench-v2-app-use-hero__io-col--input">
                              <section class="workbench-v2-app-use-hero__io-block">
                                <h3 class="workbench-v2-app-use-hero__io-label">上传文件</h3>
                                <div class="workbench-v2-app-use-hero__chip-list">
                                  <span
                                    v-for="name in v2AppInputFileNames(activeV2App)"
                                    :key="activeV2App.id + '-preview-input-' + name"
                                    class="workbench-v2-app-use-hero__chip"
                                  >{{ name }}</span>
                                  <span v-if="!v2AppInputFileNames(activeV2App).length" class="workbench-v2-app-use-hero__io-empty">按应用说明上传材料。</span>
                                </div>
                              </section>
                              <section v-if="v2AppExampleInputFiles(activeV2App).length" class="workbench-v2-app-use-hero__io-block">
                                <h3 class="workbench-v2-app-use-hero__io-label">示例</h3>
                                <ul class="wb-task-detail-simple-list workbench-v2-app-use-hero__example-list">
                                  <FreeAuditTaskDetailSimpleRow
                                    v-for="file in v2AppExampleInputFiles(activeV2App)"
                                    :key="'preview-ex-in-' + file"
                                    :aria-label="file"
                                    :icon-class="v2AppRecordFileIconToneClass(file)"
                                    :class="{ 'is-active': v2AppActiveExampleKey === 'input:' + file }"
                                    @open="openV2AppExamplePreview(file, 'input')"
                                  >
                                    <template #icon>
                                      <ds-icon :name="v2AppRecordFileIconName(file)" :class="v2AppRecordFileIconToneClass(file)" />
                                    </template>
                                    {{ file }}
                                  </FreeAuditTaskDetailSimpleRow>
                                </ul>
                              </section>
                            </div>
                            <div class="workbench-v2-app-use-hero__io-col workbench-v2-app-use-hero__io-col--output">
                              <section class="workbench-v2-app-use-hero__io-block">
                                <h3 class="workbench-v2-app-use-hero__io-label">产出结果</h3>
                                <p class="workbench-v2-app-use-hero__output-text">{{ activeV2App.outputLabel }}</p>
                              </section>
                              <section v-if="v2AppExampleOutputFiles(activeV2App).length" class="workbench-v2-app-use-hero__io-block">
                                <h3 class="workbench-v2-app-use-hero__io-label">示例</h3>
                                <ul class="wb-task-detail-simple-list workbench-v2-app-use-hero__example-list">
                                  <FreeAuditTaskDetailSimpleRow
                                    v-for="file in v2AppExampleOutputFiles(activeV2App)"
                                    :key="'preview-ex-out-' + file"
                                    :aria-label="file"
                                    :icon-class="v2AppRecordFileIconToneClass(file)"
                                    :class="{ 'is-active': v2AppActiveExampleKey === 'output:' + file }"
                                    @open="openV2AppExamplePreview(file, 'output')"
                                  >
                                    <template #icon>
                                      <ds-icon :name="v2AppRecordFileIconName(file)" :class="v2AppRecordFileIconToneClass(file)" />
                                    </template>
                                    {{ file }}
                                  </FreeAuditTaskDetailSimpleRow>
                                </ul>
                              </section>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section class="workbench-v2-app-use-run" aria-label="应用执行预览">
                        <div class="workbench-v2-app-use-run__inner">
                          <div class="workbench-v2-app-run-toolbar">
                            <p class="workbench-v2-app-run-tip">{{ activeV2AppUploadPrompt }}</p>
                            <button type="button" class="workbench-v2-app-execute-btn" disabled>生成结果</button>
                          </div>
                          <section class="project-material-upload workbench-v2-app-use-upload" aria-label="本次执行材料预览">
                            <a-upload-dragger class="project-material-upload__dragger project-material-upload__dragger--empty" :multiple="true" :disabled="true" :open-file-dialog-on-click="false" :file-list="[]" :show-upload-list="false">
                              <div class="project-material-upload__drop-action" aria-disabled="true">
                                <p class="ant-upload-drag-icon"><ds-icon name="file-import" /></p>
                                <p class="ant-upload-text">预览模式不支持上传</p>
                              </div>
                            </a-upload-dragger>
                          </section>
                          <section class="project-material-upload__guide workbench-v2-app-use-guide" aria-label="上传说明预览">
                            <div class="project-material-upload__guide-title">上传说明</div>
                            <ol class="project-material-upload__guide-list">
                              <li class="project-material-upload__guide-item">
                                <span class="project-material-upload__guide-index">1.</span>
                                <span class="project-material-upload__guide-text">支持上传 PDF、图片、表格、文档、MD、TXT、JSON、XML 等常见格式。</span>
                              </li>
                              <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">2.</span><span class="project-material-upload__guide-text">支持上传 ZIP 压缩包。</span></li>
                              <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">3.</span><span class="project-material-upload__guide-text">一批最多上传4GB文件（数量不限）</span></li>
                            </ol>
                          </section>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </section>
            </template>

            <template v-else-if="v2AppStage === 'use'">
              <section
                class="workbench-v2-app-use"
                :class="{
                  'is-history-hidden': !showAppHistoryPanel,
                  'is-history-overlay': showAppHistoryPanel,
                }"
                aria-label="应用使用页"
              >
                <div class="workbench-v2-app-use-workspace">
                  <div class="workbench-v2-app-use__main">
                    <div class="workbench-v2-app-use-stack">
                  <section class="workbench-v2-app-use-intro" aria-label="应用介绍">
                    <div class="workbench-v2-app-use-hero">
                      <header class="workbench-v2-app-use-hero__head">
                        <h2 class="workbench-v2-app-use-hero__title">{{ activeV2App.name }}</h2>
                        <div class="workbench-v2-app-use-hero__tags">
                          <span class="workbench-v2-app-use-hero__tag">{{ v2AppSceneLabel(activeV2App.scene) }}</span>
                          <span class="workbench-v2-app-use-hero__tag">{{ v2AppTypeLabel(activeV2App.appType) }}</span>
                        </div>
                      </header>
                      <p class="workbench-v2-app-use-hero__desc">{{ activeV2App.desc }}</p>
                      <div class="workbench-v2-app-use-hero__io-panel">
                        <div class="workbench-v2-app-use-hero__io-col workbench-v2-app-use-hero__io-col--input">
                          <section class="workbench-v2-app-use-hero__io-block">
                            <h3 class="workbench-v2-app-use-hero__io-label">上传文件</h3>
                            <div class="workbench-v2-app-use-hero__chip-list">
                              <span
                                v-for="name in v2AppInputFileNames(activeV2App)"
                                :key="activeV2App.id + '-hero-input-' + name"
                                class="workbench-v2-app-use-hero__chip"
                              >{{ name }}</span>
                              <span v-if="!v2AppInputFileNames(activeV2App).length" class="workbench-v2-app-use-hero__io-empty">按应用说明上传材料。</span>
                            </div>
                          </section>
                          <section v-if="v2AppExampleInputFiles(activeV2App).length" class="workbench-v2-app-use-hero__io-block">
                            <h3 class="workbench-v2-app-use-hero__io-label">示例</h3>
                            <ul class="wb-task-detail-simple-list workbench-v2-app-use-hero__example-list">
                              <FreeAuditTaskDetailSimpleRow
                                v-for="file in v2AppExampleInputFiles(activeV2App)"
                                :key="'hero-ex-in-' + file"
                                :aria-label="file"
                                :icon-class="v2AppRecordFileIconToneClass(file)"
                                :class="{ 'is-active': v2AppActiveExampleKey === 'input:' + file }"
                                @open="openV2AppExamplePreview(file, 'input')"
                              >
                                <template #icon>
                                  <ds-icon :name="v2AppRecordFileIconName(file)" :class="v2AppRecordFileIconToneClass(file)" />
                                </template>
                                {{ file }}
                              </FreeAuditTaskDetailSimpleRow>
                            </ul>
                          </section>
                        </div>
                        <div class="workbench-v2-app-use-hero__io-col workbench-v2-app-use-hero__io-col--output">
                          <section class="workbench-v2-app-use-hero__io-block">
                            <h3 class="workbench-v2-app-use-hero__io-label">产出结果</h3>
                            <p class="workbench-v2-app-use-hero__output-text">{{ activeV2App.outputLabel }}</p>
                          </section>
                          <section v-if="v2AppExampleOutputFiles(activeV2App).length" class="workbench-v2-app-use-hero__io-block">
                            <h3 class="workbench-v2-app-use-hero__io-label">示例</h3>
                            <ul class="wb-task-detail-simple-list workbench-v2-app-use-hero__example-list">
                              <FreeAuditTaskDetailSimpleRow
                                v-for="file in v2AppExampleOutputFiles(activeV2App)"
                                :key="'hero-ex-out-' + file"
                                :aria-label="file"
                                :icon-class="v2AppRecordFileIconToneClass(file)"
                                :class="{ 'is-active': v2AppActiveExampleKey === 'output:' + file }"
                                @open="openV2AppExamplePreview(file, 'output')"
                              >
                                <template #icon>
                                  <ds-icon :name="v2AppRecordFileIconName(file)" :class="v2AppRecordFileIconToneClass(file)" />
                                </template>
                                {{ file }}
                              </FreeAuditTaskDetailSimpleRow>
                            </ul>
                          </section>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section class="workbench-v2-app-use-run" aria-label="应用执行">
                    <div class="workbench-v2-app-use-run__inner">
                      <div class="workbench-v2-app-run-toolbar">
                        <p class="workbench-v2-app-run-tip">{{ activeV2AppUploadPrompt }}</p>
                        <button type="button" class="workbench-v2-app-execute-btn" :disabled="!v2AppCanGenerateResult" @click="runV2App">
                          {{ v2AppUseState === 'running' ? '生成中' : '生成结果' }}
                        </button>
                      </div>
                      <section class="project-material-upload workbench-v2-app-use-upload" :class="{ 'project-material-upload--has-session': v2AppUploadFiles.length }" aria-label="本次执行材料">
                        <template v-if="v2AppUploadFiles.length">
                          <div class="project-material-upload__session-layout workbench-v2-app-use-upload__session-layout">
                            <section class="project-material-upload__file-panel" aria-label="待上传文件列表">
                              <div class="project-material-upload__file-panel-head">
                                <h3 class="project-material-upload__file-title">已上传{{ v2AppUploadFiles.length }}个文件</h3>
                                <div class="project-material-upload__file-panel-actions">
                                  <button type="button" class="workbench-v2-app-config-text-btn" @click="continueUploadV2AppFiles">
                                    <ds-icon name="upload" aria-hidden="true" />
                                    <span>继续上传</span>
                                  </button>
                                </div>
                              </div>
                              <div class="project-material-upload__table" role="table" aria-label="待上传文件列表">
                                <div class="project-material-upload__table-row project-material-upload__table-row--head" role="row">
                                  <div role="columnheader">文件名</div>
                                  <div role="columnheader">大小</div>
                                  <div role="columnheader">状态</div>
                                  <div role="columnheader">操作</div>
                                </div>
                                <div v-for="file in v2AppUploadFiles" :key="file.id" class="project-material-upload__table-row" role="row">
                                  <div role="cell" class="project-material-upload__file-meta">
                                    <div class="project-material-upload__file-name" :title="file.name">{{ file.name }}</div>
                                  </div>
                                  <div role="cell">{{ file.sizeLabel }}</div>
                                  <div role="cell"><span class="project-material-upload__status" :class="'is-' + file.status">{{ v2AppUploadStatusLabel(file) }}</span></div>
                                  <div role="cell" class="project-material-upload__ops">
                                    <button type="button" class="project-material-upload__remove-btn" :disabled="file.status === 'uploading'" @click="removeV2AppUploadFile(file.id)">
                                      <ds-icon name="trash" aria-hidden="true" />
                                      <span>删除</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </section>
                          </div>
                        </template>
                        <template v-else>
                          <a-upload-dragger class="project-material-upload__dragger project-material-upload__dragger--empty" :multiple="true" :open-file-dialog-on-click="false" :before-upload="blockV2AppRealUpload" :file-list="[]" :show-upload-list="false">
                            <div class="project-material-upload__drop-action" role="button" tabindex="0" @click="continueUploadV2AppFiles" @keydown.enter.prevent="continueUploadV2AppFiles" @keydown.space.prevent="continueUploadV2AppFiles">
                              <p class="ant-upload-drag-icon"><ds-icon name="file-import" /></p>
                              <p class="ant-upload-text">将文件拖拽至此区域或<span class="project-material-upload__upload-link">选择文件上传</span></p>
                            </div>
                          </a-upload-dragger>
                        </template>
                      </section>
                      <section class="project-material-upload__guide workbench-v2-app-use-guide" aria-label="上传说明">
                        <div class="project-material-upload__guide-title">上传说明</div>
                        <ol class="project-material-upload__guide-list">
                          <li class="project-material-upload__guide-item">
                            <span class="project-material-upload__guide-index">1.</span>
                            <div class="project-material-upload__guide-content">
                              <span class="project-material-upload__guide-text">支持上传 PDF、图片、表格、文档、MD、TXT、JSON、XML 等常见格式。</span>
                              <a-popover trigger="hover" placement="right" overlayClassName="project-material-upload__format-popover">
                                <template #content>
                                  <div class="project-material-upload__format-detail">
                                    <div class="project-material-upload__format-title">上传支持格式</div>
                                    <dl class="project-material-upload__format-groups">
                                      <div><dt>文档</dt><dd>PDF、DOC、DOCX、WPS、MD、TXT</dd></div>
                                      <div><dt>表格</dt><dd>XLSX、XLS、CSV</dd></div>
                                      <div><dt>图片</dt><dd>JPG、PNG、BMP、TIF</dd></div>
                                      <div><dt>结构化数据</dt><dd>JSON、XML</dd></div>
                                    </dl>
                                    <p class="project-material-upload__format-note">系统会自动提取文档文字和表格数据，用于后续解析、引用和审计分析；DOC / WPS 文件会自动转换为 DOCX 后再进入解析。</p>
                                  </div>
                                </template>
                                <button type="button" class="project-material-upload__detail-btn">查看细则</button>
                              </a-popover>
                            </div>
                          </li>
                          <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">2.</span><span class="project-material-upload__guide-text">支持上传 ZIP 压缩包。</span></li>
                          <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">3.</span><span class="project-material-upload__guide-text">一批最多上传4GB文件（数量不限）</span></li>
                        </ol>
                      </section>
                    </div>
                  </section>
                    </div>
                  </div>
                </div>
              </section>
              <aside v-if="showAppHistoryPanel" class="workbench-v2-app-history-panel workbench-v2-floating-detail-panel" aria-label="生成记录">
                <header>
                  <h2>生成记录</h2>
                  <span>{{ activeV2AppRecords.length }} 次</span>
                </header>
                <div class="workbench-v2-app-history-list">
                  <article
                    v-for="record in activeV2AppRecords"
                    :key="record.id"
                    class="workbench-v2-wide-card workbench-v2-wide-card--task workbench-v2-app-history-item"
                    :class="{ 'is-active': activeV2AppRecord && activeV2AppRecord.id === record.id }"
                    role="button"
                    tabindex="0"
                    @click="openV2AppResult(record)"
                    @keydown.enter.prevent="openV2AppResult(record)"
                    @keydown.space.prevent="openV2AppResult(record)"
                  >
                    <span class="workbench-v2-wide-card__icon is-task-single">
                      <ds-icon name="edit-one" title="单次任务" />
                    </span>
                    <span class="workbench-v2-wide-card__body">
                      <span class="workbench-v2-wide-card__title">{{ record.title }}</span>
                      <span class="workbench-v2-wide-card__meta">
                        <span class="workbench-v2-wide-card__task-tag">引用材料{{ v2AppRecordSourceFiles(record).length }}</span>
                        <span class="workbench-v2-wide-card__task-tag workbench-v2-wide-card__task-tag--skill">产出结果{{ v2AppRecordResultFiles(record).length }}</span>
                      </span>
                    </span>
                    <span class="workbench-v2-wide-card__right">
                      <span v-if="record.status === 'done'" class="workbench-v2-wide-card__time">{{ record.timeLabel || '刚刚' }}</span>
                      <span v-else-if="record.statusLabel" class="workbench-v2-status" :class="'is-' + v2AppRecordStatusClass(record)">{{ record.statusLabel }}</span>
                    </span>
                  </article>
                  <div v-if="!activeV2AppRecords.length" class="workbench-v2-list-empty workbench-v2-app-history-empty">
                    <span class="workbench-v2-app-history-empty__icon">
                      <ds-icon name="menu" title="暂无生成记录" />
                    </span>
                    <strong>暂无生成记录</strong>
                    <span>上传材料并执行应用后，生成记录会自动显示在这里。</span>
                  </div>
                </div>
              </aside>
            </template>

            <template v-else>
            <section class="workbench-v2-app-record-reader" aria-label="执行记录结果阅读页">
              <article
                v-if="isExpertWorkbenchMode"
                class="workbench-v2-app-record-reader__document workbench-v2-app-record-reader__document--log"
                aria-label="应用任务执行日志"
              >
                <div class="nlm-chat-body workbench-v2-task-chat-body workbench-v2-app-record-log">
                  <div class="nlm-chat-messages workbench-v2-task-chat-messages" role="log" aria-live="polite">
                    <div
                      v-for="turn in activeV2AppRecordContextTurns"
                      :key="turn.id"
                      :class="['nlm-chat-turn', { 'nlm-chat-turn--tool-trace': turn.role === 'thinking' }]"
                    >
                      <div v-if="turn.role === 'thinking'" class="nlm-thinking wb-task-context-thinking nlm-thinking-steps nlm-tool-calls">
                        <div
                          v-for="(call, ci) in (turn.toolCalls || [])"
                          :key="turn.id + '-app-tc-' + ci"
                          class="nlm-tool-call nlm-tool-call--plain"
                          :class="{ 'nlm-tool-call--stream': call.type === 'text' }"
                        >
                          <p v-if="call.type === 'text'" class="nlm-tool-stream-text">{{ call.body }}</p>
                          <p v-else class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line" :class="{ 'nlm-tool-call-line--running': call.status === 'running' }">
                            <span class="nlm-tool-call-line__ic" aria-hidden="true">
                              <svg v-if="call.status === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
                              <svg v-else-if="call.status === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
                              <svg v-else class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
                            </span>
                            <span class="nlm-tool-call-line__txt">{{ call.label }}</span>
                          </p>
                        </div>
                      </div>
                      <div v-else class="nlm-msg-row">
                        <div class="nlm-msg-wrap">
                          <div :class="['nlm-msg', turn.role, { 'wb-task-context-msg--system': turn.kind === 'system' }]">{{ turn.text }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
              <article v-else class="workbench-v2-app-record-reader__document" aria-label="结果文件阅读区">
                <header class="workbench-v2-app-record-reader__file-head">
                  <div class="workbench-v2-app-record-reader__file-title">
                    <strong>{{ activeV2AppRecordPreviewTitle }}</strong>
                  </div>
                  <button type="button" class="workbench-v2-app-card__link workbench-v2-app-record-reader__download" @click="downloadV2AppRecordResult">
                    <span>下载</span>
                  </button>
                </header>
                <div class="workbench-v2-app-record-reader__content">
                  <template v-if="activeV2AppRecordPreviewIsResult">
                    <h2>{{ activeV2AppRecord.resultTitle }}</h2>
                    <p>{{ activeV2AppRecord.summary }}</p>
                    <section class="workbench-v2-app-record-reader__quote">
                      <h3>重点结论</h3>
                      <p>1. 识别 3 条合同变更链路，其中 2 条存在金额差异线索。</p>
                      <p>2. 付款记录与变更签证台账存在金额不一致，建议优先复核审批依据。</p>
                      <p>3. 部分付款节点晚于合同约定，需要结合验收记录确认责任归属。</p>
                    </section>
                    <section class="workbench-v2-app-record-reader__advice">
                      <h3>核查建议</h3>
                      <p>先复核付款金额差异，再补充缺失审批附件，最后将异常链路同步至项目问题清单。</p>
                      <p>建议导出本结果后作为审计底稿附件，和原始合同、台账、付款记录一并归档。</p>
                    </section>
                  </template>
                  <template v-else>
                    <h2>{{ activeV2AppRecordPreviewTitle }}</h2>
                    <p>{{ v2AppRecordFileKindLabel(activeV2AppRecordPreviewTitle) }} 文件预览</p>
                    <section class="workbench-v2-app-record-reader__quote">
                      <h3>文件摘要</h3>
                      <p>该文件已作为本次执行的引用材料参与核查。</p>
                      <p>可结合右侧引用资源列表切换查看其他材料。</p>
                    </section>
                  </template>
                </div>
              </article>
            </section>
            <aside v-if="showAppRecordDetailPanel" class="workbench-v2-app-record-detail-panel workbench-v2-floating-detail-panel" aria-label="任务详情">
                <div class="workbench-v2-task-floating-detail__body workbench-v2-app-record-detail__body">
                  <div class="wb-task-detail-sections" role="region" aria-label="任务详情：产出结果、使用技能与引用资源">
                    <section
                      v-for="section in activeV2AppRecordDetailSections"
                      :key="section.key"
                      :class="['wb-task-detail-section', 'wb-task-detail-section--' + section.key]"
                    >
                      <h4 class="wb-task-detail-section__title">{{ section.title }}</h4>
                      <ul v-if="section.kind === 'simple-list'" class="wb-task-detail-simple-list">
                        <FreeAuditTaskDetailSimpleRow
                          v-for="(row, idx) in section.rows"
                          :key="section.key + '-' + idx"
                          :aria-label="row.label"
                          :icon-class="row.iconClass || section.iconClass || ''"
                          :class="{ 'is-active': row.active }"
                          @open="openV2AppRecordDetailRow(section, row)"
                        >
                          <template #icon>
                            <svg
                              v-if="row.iconHref || section.iconHref"
                              class="iconpark-icon"
                              :class="row.iconToneClass || section.iconToneClass || ''"
                              :title="row.iconTitle || section.iconTitle || section.title"
                            ><use :href="row.iconHref || section.iconHref"></use></svg>
                            <iconpark-icon
                              v-else-if="row.iconparkName || section.iconparkName"
                              :name="row.iconparkName || section.iconparkName"
                              class="iconpark-icon"
                              :class="row.iconToneClass || section.iconToneClass || ''"
                              :title="row.iconTitle || section.iconTitle || section.title"
                              aria-hidden="true"
                            ></iconpark-icon>
                            <ds-icon
                              v-else
                              :name="row.iconName || section.iconName || 'document-folder'"
                              :class="row.iconToneClass || section.iconToneClass || ''"
                              :title="row.iconTitle || section.iconTitle || section.title"
                            />
                          </template>
                          {{ row.label }}
                        </FreeAuditTaskDetailSimpleRow>
                      </ul>
                      <div v-else class="wb-task-detail-generate-req-box" role="region" :aria-label="section.title">
                        <p
                          v-for="(line, idx) in section.lines"
                          :key="section.key + '-' + idx"
                          class="wb-task-detail-generate-req-body"
                        >{{ line }}</p>
                      </div>
                    </section>
                  </div>
                </div>
              </aside>
            </template>
          </section>

          <a-modal
            v-model:open="v2AppExamplePreview.open"
            :title="v2AppExamplePreview.title"
            :width="v2AppExamplePreview.isOnlinePreview ? 760 : 640"
            :wrapClassName="v2AppExamplePreview.isOnlinePreview ? 'modal-w-760' : 'modal-w-640'"
            :footer="null"
            centered
          >
            <div class="workbench-v2-app-example-preview" :class="{ 'is-online-preview': v2AppExamplePreview.isOnlinePreview }">
              <template v-if="v2AppExamplePreview.isOnlinePreview">
                <section class="workbench-v2-app-example-viewer" aria-label="文件在线预览">
                  <div class="workbench-v2-app-example-viewer__toolbar">
                    <div class="workbench-v2-app-example-viewer__file">
                      <ds-icon :name="v2AppRecordFileIconName(v2AppExamplePreview.fileName)" aria-hidden="true" />
                      <span>{{ v2AppExamplePreview.fileName }}</span>
                    </div>
                    <div class="workbench-v2-app-example-viewer__meta">
                      <span>{{ v2AppExamplePreview.previewMeta }}</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <div class="workbench-v2-app-example-viewer__canvas">
                    <article class="workbench-v2-app-example-viewer__page" :aria-label="v2AppExamplePreview.previewPageLabel">
                      <header class="workbench-v2-app-example-viewer__page-head">
                        <span>{{ v2AppExamplePreview.previewPageLabel }}</span>
                        <strong>{{ v2AppExamplePreview.fileName }}</strong>
                      </header>
                      <p v-for="line in v2AppExamplePreview.lines" :key="line">{{ line }}</p>
                    </article>
                  </div>
                </section>
              </template>
              <template v-else>
                <div class="workbench-v2-app-example-preview__head">
                  <ds-icon :name="v2AppRecordFileIconName(v2AppExamplePreview.fileName)" aria-hidden="true" />
                  <div>
                    <strong>{{ v2AppExamplePreview.fileName }}</strong>
                    <span>{{ v2AppRecordFileTypeLabel(v2AppExamplePreview.fileName) }} 文件预览</span>
                  </div>
                </div>
                <div class="workbench-v2-app-example-preview__body">
                  <p v-for="line in v2AppExamplePreview.lines" :key="line">{{ line }}</p>
                </div>
              </template>
            </div>
          </a-modal>

          <a-modal
            v-model:open="v2AppEditorOpen"
            :title="v2AppEditorTitle"
            width="520"
            wrapClassName="modal-w-520"
            centered
            @cancel="closeV2AppEditor"
          >
            <a-form layout="vertical" class="skill-modal-form workbench-v2-app-config__form workbench-v2-app-config__form--plain">
              <a-form-item label="应用名称" required>
                <a-input
                  v-model:value="v2AppForm.name"
                  placeholder="请输入应用名称"
                  allow-clear
                  :maxlength="60"
                />
              </a-form-item>
              <a-form-item label="选择技能" required>
                <a-select
                  v-model:value="v2AppEditorSourceSkillKey"
                  :options="v2AppEditorSkillOptions"
                  placeholder="请选择一个当前工作台技能"
                  show-search
                  option-filter-prop="label"
                  style="width: 100%"
                  :disabled="v2AppEditorMode === 'edit' || !v2AppEditorSkillOptions.length"
                  @change="onV2AppSkillChange"
                />
              </a-form-item>
              <div class="wb-skill-create-advanced">
                <button
                  type="button"
                  class="wb-skill-create-advanced__toggle"
                  :aria-expanded="v2AppEditorMoreOpen"
                  @click="v2AppEditorMoreOpen = !v2AppEditorMoreOpen"
                >
                  <span>{{ v2AppEditorMoreOpen ? '收起信息设置' : '更多信息设置' }}</span>
                  <ds-icon
                    :name="v2AppEditorMoreOpen ? 'chevron-up' : 'chevron-down'"
                    class="wb-skill-create-advanced__icon"
                  />
                </button>
                <div v-show="v2AppEditorMoreOpen" class="wb-skill-create-advanced__body">
                  <a-form-item label="应用描述">
                    <a-textarea
                      v-model:value="v2AppForm.desc"
                      placeholder="选填。描述该应用的用途与适用场景"
                      :rows="3"
                      :maxlength="300"
                      show-count
                    />
                  </a-form-item>
                  <a-form-item label="适用场景">
                    <a-select
                      v-model:value="v2AppForm.scene"
                      :options="v2AppSceneOptions"
                      placeholder="请选择适用场景"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="应用类型">
                    <a-select
                      v-model:value="v2AppForm.appType"
                      :options="v2AppTypeOptions"
                      placeholder="请选择应用类型"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="输入">
                    <a-select
                      v-model:value="v2AppForm.inputItems"
                      mode="tags"
                      placeholder="回车添加输入项，如：合同、发票"
                      style="width: 100%"
                    />
                  </a-form-item>
                  <a-form-item label="输出">
                    <a-input
                      v-model:value="v2AppForm.outputLabel"
                      placeholder="请输入产出结果名称"
                      allow-clear
                    />
                  </a-form-item>
                </div>
              </div>
            </a-form>
            <template #footer>
              <a-button @click="closeV2AppEditor">取消</a-button>
              <a-button type="primary" @click="createV2AppFromEditor">{{ v2AppEditorMode === 'edit' ? '保存' : '创建' }}</a-button>
            </template>
          </a-modal>

          <section v-show="isExpertWorkbenchMode && activeMainView === 'skill'" class="workbench-v2-view-stage workbench-v2-skill-view workbench-v2-skill-page" aria-label="工作台技能" data-tour-id="workbench-skill-stage">
            <header class="workbench-v2-skill-header">
              <div class="workbench-v2-skill-header__main">
                <h1 class="workbench-v2-skill-header__title">技能</h1>
                <p class="workbench-v2-skill-header__subtitle">通过技能为大模型注入审计思路</p>
              </div>
              <div
                class="workbench-v2-skill-header__actions"
              >
                <div class="workbench-v2-skill-header__cta-group">
                  <input
                    ref="v2SkillImportInput"
                    type="file"
                    accept="application/json,.json"
                    style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;"
                    @change="onV2SkillImportChange"
                  />
                  <a-dropdown
                    v-model:open="v2SkillCreateDropdownOpen"
                    :trigger="['click']"
                    placement="bottomRight"
                    overlay-class-name="workbench-v2-skill-create-menu"
                  >
                    <button
                      type="button"
                      class="ds-btn-page-cta workbench-v2-skill-header__action workbench-v2-skill-header__action--menu"
                      :class="{ 'is-open': v2SkillCreateDropdownOpen }"
                      title="添加"
                      aria-label="添加"
                      @click.stop
                    >
                      <ds-icon name="plus" class="ds-btn-icon-before" aria-hidden="true" />
                      <span>添加</span>
                      <ds-icon name="chevron-down" class="ds-btn-caret" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu @click="onV2SkillCreateMenu">
                        <a-menu-item key="create">创建技能</a-menu-item>
                        <a-menu-item key="import">导入技能</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
              </div>
            </header>
            <div class="workbench-v2-skill-tabs" aria-label="技能分类">
              <div class="workbench-v2-skill-scope-tabs" role="tablist">
                <button
                  v-for="tab in v2SkillScopeTabs"
                  :key="tab.id"
                  type="button"
                  class="workbench-v2-skill-scope-tab"
                  :class="{ 'is-active': v2SkillScopeTab === tab.id }"
                  :data-tour-id="tab.id === 'org' ? 'workbench-public-skill-tab' : null"
                  role="tab"
                  :aria-selected="v2SkillScopeTab === tab.id"
                  @click="setV2SkillScopeTab(tab.id)"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>
            <div class="workbench-v2-skill-search-row">
              <label class="workbench-v2-skill-search">
                <ds-icon name="search" class="workbench-v2-skill-search__icon" aria-hidden="true" />
                <input
                  v-model="v2SkillSearchQuery"
                  type="search"
                  class="workbench-v2-skill-search__input"
                  placeholder="搜索技能名称、描述"
                  aria-label="搜索技能名称、描述"
                />
              </label>
              <div class="workbench-v2-skill-search-row__actions">
                <a-dropdown
                  v-if="v2SkillFilterVisible"
                  :trigger="['click']"
                  placement="bottomRight"
                >
                  <button
                    type="button"
                    class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                    :class="{ 'is-active': v2SkillTypeFilter !== 'all' }"
                    :title="'按' + v2AuditSceneCategoryLabel + '过滤'"
                    :aria-label="'按' + v2AuditSceneCategoryLabel + '过滤'"
                    @click.stop
                  >
                    <span class="workbench-v2-skill-filter-control__label">{{ v2AuditSceneCategoryLabel }}</span>
                    <span class="workbench-v2-skill-filter-control__value">{{ v2SkillTypeFilterLabel }}</span>
                    <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                  </button>
                  <template #overlay>
                    <a-menu
                      :selected-keys="[v2SkillTypeFilter]"
                      @click="onV2SkillTypeFilter"
                    >
                      <a-menu-item
                        v-for="option in v2SkillTypeFilterOptions"
                        :key="option.id"
                      >
                        {{ option.label }}
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
                <a-dropdown :trigger="['click']" placement="bottomRight">
                  <button
                    type="button"
                    class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                    :class="{ 'is-active': v2SkillSortActive }"
                    title="排序"
                    aria-label="排序"
                    @click.stop
                  >
                    <span class="workbench-v2-skill-filter-control__label">排序</span>
                    <span class="workbench-v2-skill-filter-control__value">{{ v2SkillSortLabel }}</span>
                    <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                  </button>
                  <template #overlay>
                    <a-menu
                      :selected-keys="[v2SkillSortKey]"
                      @click="onV2SkillSort"
                    >
                      <a-menu-item key="time-desc">最新优先</a-menu-item>
                      <a-menu-item key="time-asc">最早优先</a-menu-item>
                      <a-menu-item v-if="v2SkillSortInstallVisible" key="install-desc">添加次数高</a-menu-item>
                      <a-menu-item v-if="v2SkillSortInstallVisible" key="install-asc">添加次数低</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </div>
            <nav class="workbench-v2-skill-type-tabs" :aria-label="v2SkillTypeCategoryLabel">
              <div class="workbench-v2-skill-tabs__list">
                <button
                  v-for="tab in v2SkillCategoryTabs"
                  :key="tab.id"
                  type="button"
                  class="workbench-v2-skill-tab"
                  :class="{ 'is-active': v2SkillCategoryTab === tab.id }"
                  @click="setV2SkillCategoryTab(tab.id)"
                >
                  <span>{{ tab.label }}</span>
                </button>
              </div>
              <span class="workbench-v2-skill-tabs__total">共 {{ v2SkillCards.length }} 个</span>
            </nav>
            <section class="workbench-v2-skill-section" aria-label="技能列表" data-tour-id="workbench-public-skill-list">
              <template v-if="v2SkillCards.length">
                <div class="workbench-v2-skill-grid">
                    <article
                      v-for="card in v2SkillCards"
                      :key="card.key"
                      class="workbench-v2-skill-item tc-template-card tc-template-card--list ds-list-card"
                      role="button"
                      tabindex="0"
                      @click="openSkillCard(card)"
                      @keydown.enter.prevent="openSkillCard(card)"
                      @keydown.space.prevent="openSkillCard(card)"
                    >
                  <div class="tc-template-card__body">
                    <div class="tc-template-card__head">
                      <div class="tc-template-card__hero-icon" aria-hidden="true">
                        <ds-icon name="book-open" />
                      </div>
                      <div class="tc-template-card__title-block">
                        <div class="tc-template-card__title-line">
                          <h3 class="tc-template-card__name">{{ card.name }}</h3>
                          <span
                            v-if="v2SkillCardVersionLabel(card)"
                            class="tc-template-card__version-spacer"
                            aria-hidden="true"
                          ></span>
                          <span
                            v-if="v2SkillCardVersionLabel(card)"
                            class="tc-template-card__version-tag"
                          >{{ v2SkillCardVersionLabel(card) }}</span>
                        </div>
                        <div class="tc-template-card__tags tc-template-card__tags--compact">
                          <TagLg v-if="v2SkillCardAuditSceneLabel(card)">{{ v2SkillCardAuditSceneLabel(card) }}</TagLg>
                          <TagLg v-if="v2SkillCardSkillTypeLabel(card)">{{ v2SkillCardSkillTypeLabel(card) }}</TagLg>
                        </div>
                      </div>
                      <div
                        class="tc-template-card__actions"
                        :class="{ 'has-shared-tag': v2SkillCardHasCornerTag(card) }"
                      >
                        <span
                          v-if="v2SkillCardHasCornerTag(card)"
                          class="tc-template-card__shared-corner-tag"
                          :class="{ 'tc-template-card__shared-corner-tag--warning': v2SkillCardCornerTagWarning(card) }"
                          :title="v2SkillCardCornerTagTitle(card)"
                        >{{ v2SkillCardCornerTagLabel(card) }}</span>
                        <div class="tc-template-card__more-slot" @click.stop>
                          <a-dropdown
                            :trigger="['click']"
                            placement="bottomRight"
                            @click.stop
                          >
                            <a-button
                              type="text"
                              size="small"
                              class="tc-template-card__more-btn ds-icon-btn ds-icon-btn--standard"
                              title="管理技能"
                              aria-label="管理技能"
                              @click.stop
                            >
                              <ds-icon name="more" aria-hidden="true" />
                            </a-button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onV2SkillCardMenu(key, card)">
                                <template v-if="v2SkillScopeTab === 'workbench'">
                                  <a-menu-item key="edit">编辑</a-menu-item>
                                  <a-menu-item key="publish-app">生成应用</a-menu-item>
                                  <a-menu-item key="share">{{ v2SkillCardShareMenuLabel(card) }}</a-menu-item>
                                  <a-menu-item v-if="v2SkillCardIsShared(card)" key="update">同步</a-menu-item>
                                  <a-menu-item key="export">导出</a-menu-item>
                                  <a-menu-item key="delete" danger>删除</a-menu-item>
                                </template>
                                <template v-else>
                                  <a-menu-item key="info">查看信息</a-menu-item>
                                </template>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </div>
                      </div>
                    </div>
                    <p
                      class="tc-template-card__desc"
                      :title="card.description"
                    >{{ card.description }}</p>
                    <div class="tc-template-card__io">
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输入</span>
                        <div class="tc-template-card__file-list">
                          <span
                            v-for="name in v2SkillCardInputFileNames(card)"
                            :key="card.key + '-file-' + name"
                            class="tc-template-card__file-chip"
                          >
                            <span>{{ name }}</span>
                          </span>
                          <span v-if="!v2SkillCardInputFileNames(card).length" class="tc-template-card__io-text">按技能配置读取审计资料。</span>
                        </div>
                      </div>
                      <div class="tc-template-card__io-row">
                        <span class="tc-template-card__io-label">输出</span>
                        <span class="tc-template-card__io-text">{{ v2SkillCardOutputSummary(card) }}</span>
                      </div>
                    </div>
                    <div
                      class="ds-card-foot tc-template-card__footer"
                      role="group"
                      :aria-label="'技能操作：' + (card.name || '')"
                      @click.stop
                    >
                      <div class="tc-template-card__meta">
                        <span
                          class="tc-template-card__owner"
                          :title="'创建人：' + v2SkillCardOwnerNameLabel(card)"
                        >
                          <ds-icon name="user" aria-hidden="true" />
                          <span class="tc-template-card__owner-name">{{ v2SkillCardOwnerNameLabel(card) }}</span>
                        </span>
                        <span
                          v-if="v2SkillCardOwnerOrgLabel(card)"
                          class="tc-template-card__owner-org"
                          :title="'组织：' + v2SkillCardOwnerOrgLabel(card)"
                        >
                          <iconpark-icon name="mark" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                          <span>{{ v2SkillCardOwnerOrgLabel(card) }}</span>
                        </span>
                      </div>
                      <span
                        v-if="v2SkillScopeTab === 'workbench'"
                        class="tc-template-card__updated"
                        :title="'更新时间：' + card.updatedAtLabel"
                      >
                        <iconpark-icon name="history" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                        <span>{{ card.updatedAtLabel }}</span>
                      </span>
                      <span
                        v-else
                        class="tc-template-card__install-count"
                        :title="'添加次数：' + v2SkillCardInstallCountLabel(card) + '次'"
                      >
                        <ds-icon name="download" aria-hidden="true" />
                        <span>{{ v2SkillCardInstallCountLabel(card) }}次</span>
                      </span>
                      <div class="tc-template-card__footer-right">
                        <a-button
                          v-if="v2SkillScopeTab === 'workbench'"
                          type="primary"
                          class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-item__cta is-use"
                          title="使用技能"
                          aria-label="使用技能"
                          @click.stop="useV2SkillCard(card)"
                        >
                          <span class="ds-trigger-btn__text">使用</span>
                        </a-button>
                        <div
                          v-else
                          class="workbench-v2-skill-item__cta-group"
                        >
                          <a-button
                            v-if="v2SkillCardAlreadyAdded(card)"
                            class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-item__cta is-install is-added"
                            disabled
                            title="该技能已添加到当前工作台"
                            aria-label="该技能已添加到当前工作台"
                            :data-tour-id="workbenchTourPublicSkillActionTourId(card)"
                          >
                            <span class="ds-trigger-btn__text">已添加</span>
                          </a-button>
                          <a-dropdown
                            v-else
                            v-bind="workbenchTourPublicSkillDropdownProps(card)"
                            :trigger="['hover']"
                            :mouse-enter-delay="0.12"
                            :mouse-leave-delay="0.18"
                            placement="bottomRight"
                            overlay-class-name="workbench-v2-skill-item__cta-menu"
                            @click.stop
                          >
                            <a-button
                              class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-item__cta is-install is-add-menu"
                              :title="'添加技能：' + card.name"
                              :aria-label="'添加技能：' + card.name"
                              :data-tour-id="workbenchTourPublicSkillActionTourId(card)"
                              @click.stop="installV2SkillCard(card)"
                            >
                              <span class="ds-trigger-btn__text">添加</span>
                              <ds-icon name="chevron-down" class="ds-trigger-btn__icon" aria-hidden="true" />
                            </a-button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onV2SkillCardInstallMenu(key, card)">
                                <a-menu-item key="add">添加到当前工作台</a-menu-item>
                                <a-menu-item
                                  key="add-and-use"
                                  :data-tour-id="workbenchTourPublicSkillAddUseTourId(card)"
                                >添加并使用</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </div>
                      </div>
                    </div>
                  </div>
                    </article>
                </div>
              </template>
              <div v-else class="workbench-v2-skill-empty">{{ v2SkillEmptyText }}</div>
            </section>
          </section>

          <section v-show="isExpertWorkbenchMode && activeMainView === 'task'" class="workbench-v2-view-stage workbench-v2-task-view" aria-label="工作台任务">
            <template v-if="activeTaskIsBatch && !activeBatchChildCard">
              <div class="workbench-v2-batch-overview">
                <div class="workbench-v2-batch-toolbar">
                  <nav class="workbench-v2-skill-type-tabs workbench-v2-batch-status-tabs" aria-label="任务状态">
                    <div class="workbench-v2-skill-tabs__list">
                      <button
                        v-for="tab in v2BatchChildStatusItems"
                        :key="'batch-status-' + tab.key"
                        type="button"
                        class="workbench-v2-skill-tab"
                        :class="{ 'is-active': v2BatchChildStatusView === tab.key }"
                        @click="setV2BatchChildStatusView(tab.key)"
                      >
                        <span>{{ tab.label }}</span>
                        <span class="workbench-v2-skill-tab__count">{{ tab.count }}</span>
                      </button>
                    </div>
                  </nav>
                  <div class="nlm-material-toolbar__actions workbench-v2-batch-toolbar__actions">
                    <a-tooltip title="刷新">
                      <a-button
                        class="workbench-v2-batch-toolbar__secondary-btn"
                        title="刷新"
                        aria-label="刷新子任务列表"
                        @click.stop="refreshV2BatchChildList"
                      >
                        <ds-icon name="refresh" aria-hidden="true" />
                        <span>刷新</span>
                      </a-button>
                    </a-tooltip>
                    <a-button
                      type="text"
                      class="workbench-v2-batch-toolbar__bulk-btn"
                      :class="{ 'is-active': workbenchBulkScopeActive('task', 'batch-child') }"
                      :disabled="!v2BatchChildBulkSelectableKeys().length"
                      @click.stop="toggleV2BatchChildBulkMode"
                    >{{ workbenchBulkScopeActive('task', 'batch-child') ? '退出批量' : '批量管理' }}</a-button>
                  </div>
                </div>
                <div class="workbench-v2-batch-child-list">
                  ${freeauditPanels.bulkBar ? freeauditPanels.bulkBar('task', 'batch-child') : ''}
                  <a-dropdown
                    v-for="child in filteredV2BatchChildCards"
                    :key="'v2-batch-child-' + child.id"
                    :trigger="['contextmenu']"
                    @click.stop
                  >
                    <div
                      class="workbench-v2-batch-child-card"
                      :class="{ 'is-active': child.id === activeBatchChildId, 'is-bulk-mode': workbenchBulkScopeActive('task', 'batch-child'), 'is-bulk-selected': workbenchBulkIsSelected(workbenchBulkBatchChildDescriptor(child)) }"
                      role="button"
                      tabindex="0"
                      @click="onWorkbenchBulkBatchChildRowOpen($event, child)"
                      @keydown.enter.prevent="onWorkbenchBulkBatchChildRowOpen($event, child)"
                      @keydown.space.prevent="onWorkbenchBulkBatchChildRowOpen($event, child)"
                    >
                      <a-checkbox
                        v-if="workbenchBulkScopeActive('task', 'batch-child') && workbenchBulkBatchChildDescriptor(child)"
                        class="workbench-v2-batch-child-card__check"
                        :checked="workbenchBulkIsSelected(workbenchBulkBatchChildDescriptor(child))"
                        :aria-label="'选择子任务 ' + child.title"
                        @click.stop
                        @change="(e) => toggleWorkbenchBulkSelection(workbenchBulkBatchChildDescriptor(child), e)"
                      />
                      <span class="workbench-v2-task-card__icon" :class="child.iconClass"><ds-icon :name="child.iconName" :title="child.iconTitle" /></span>
                      <span class="workbench-v2-task-card__body">
                        <span class="workbench-v2-task-card__title workbench-v2-task-card__title--batch-child" :title="child.title">{{ v2BatchChildDisplayTitle(child) }}</span>
                      </span>
                      <span class="workbench-v2-batch-child-card__right">
                        <span class="workbench-v2-status" :class="'is-' + child.status">{{ v2BatchChildStatusText(child) }}</span>
                        <span v-if="!workbenchBulkScopeActive('task', 'batch-child')" class="workbench-v2-batch-child-card__actions" @click.stop>
                          <button
                            v-if="v2BatchChildCanAbort(child) && !v2BatchChildCanRerun(child) && !v2BatchChildCanDelete(child)"
                            type="button"
                            class="workbench-v2-icon-action"
                            title="中止"
                            aria-label="中止子任务"
                            @click.stop="abortV2BatchChild(child)"
                          >
                            <ds-icon name="stop" aria-hidden="true" />
                          </button>
                          <button
                            v-else-if="!v2BatchChildCanAbort(child) && v2BatchChildCanRerun(child) && !v2BatchChildCanDelete(child)"
                            type="button"
                            class="workbench-v2-icon-action"
                            title="重跑"
                            aria-label="重跑子任务"
                            @click.stop="rerunV2BatchChild(child)"
                          >
                            <ds-icon name="refresh" aria-hidden="true" />
                          </button>
                          <button
                            v-else-if="!v2BatchChildCanAbort(child) && !v2BatchChildCanRerun(child) && v2BatchChildCanDelete(child)"
                            type="button"
                            class="workbench-v2-icon-action"
                            title="删除"
                            aria-label="删除子任务"
                            @click.stop="onV2BatchChildMenu('delete', child)"
                          >
                            <ds-icon name="delete" aria-hidden="true" />
                          </button>
                          <a-dropdown v-else-if="v2BatchChildShowMoreMenu(child)" :trigger="['click']" @click.stop>
                            <button type="button" class="workbench-v2-icon-action" title="更多" aria-label="更多操作" @click.stop>
                              <ds-icon name="more" aria-hidden="true" />
                            </button>
                            <template #overlay>
                              <a-menu @click="({ key }) => onV2BatchChildMenu(key, child)">
                                <a-menu-item v-if="v2BatchChildCanAbort(child)" key="abort-task">中止</a-menu-item>
                                <a-menu-item v-if="v2BatchChildCanRerun(child)" key="rerun-task">重跑</a-menu-item>
                                <a-menu-divider v-if="v2BatchChildCanDelete(child) && (v2BatchChildCanAbort(child) || v2BatchChildCanRerun(child))" />
                                <a-menu-item v-if="v2BatchChildCanDelete(child)" key="delete" danger>删除</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </span>
                      </span>
                    </div>
                    <template #overlay>
                      <a-menu @click="({ key }) => onV2BatchChildMenu(key, child)">
                        <a-menu-item v-if="v2BatchChildCanAbort(child)" key="abort-task">中止</a-menu-item>
                        <a-menu-item v-if="v2BatchChildCanRerun(child)" key="rerun-task">重跑</a-menu-item>
                        <a-menu-divider v-if="v2BatchChildCanDelete(child) && (v2BatchChildCanAbort(child) || v2BatchChildCanRerun(child))" />
                        <a-menu-item v-if="v2BatchChildCanDelete(child)" key="delete" danger>删除</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                  <a-empty v-if="!filteredV2BatchChildCards.length" description="暂无子任务" />
                </div>
              </div>
            </template>
            <template v-else-if="activeTaskCard">
              <div class="workbench-v2-task-workspace">
                <section
                  class="nlm-assistant-column workbench-v2-task-context-pane"
                  :class="{ 'is-task-detail-visible': v2TaskDetailVisible }"
                  aria-label="任务上下文"
                >
                  <div
                    ref="v2TaskChatBody"
                    class="nlm-chat-body workbench-v2-task-chat-body"
                    :class="{
                      'is-task-detail-docked': v2TaskDetailVisible && v2TaskDetailLayout === 'dock',
                      'is-task-detail-overlay': v2TaskDetailVisible && v2TaskDetailLayout === 'overlay',
                    }"
                  >
                      <div class="nlm-chat-messages workbench-v2-task-chat-messages" role="log" aria-live="polite">
                        <div
                          v-for="turn in activeTaskContextTurns"
                          :key="turn.id"
                          :class="['nlm-chat-turn', { 'nlm-chat-turn--tool-trace': turn.role === 'thinking' }]"
                        >
                          <div v-if="turn.role === 'thinking'" class="nlm-thinking wb-task-context-thinking nlm-thinking-steps nlm-tool-calls">
                            <div
                              v-for="(call, ci) in (turn.toolCalls || [])"
                              :key="turn.id + '-v2-tc-' + ci"
                              class="nlm-tool-call nlm-tool-call--plain"
                              :class="{ 'nlm-tool-call--stream': call.type === 'text' }"
                            >
                              <p v-if="call.type === 'text'" class="nlm-tool-stream-text">{{ call.body }}</p>
                              <p v-else class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line" :class="{ 'nlm-tool-call-line--running': call.status === 'running' }">
                                <span class="nlm-tool-call-line__ic" aria-hidden="true">
                                  <svg v-if="call.status === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
                                  <svg v-else-if="call.status === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
                                  <svg v-else class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
                                </span>
                                <span class="nlm-tool-call-line__txt">{{ call.label }}</span>
                              </p>
                            </div>
                          </div>
                          <div v-else class="nlm-msg-row">
                            <div class="nlm-msg-wrap">
                              <div :class="['nlm-msg', turn.role, { 'wb-task-context-msg--system': turn.kind === 'system' }]">{{ turn.text }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    <aside v-if="v2TaskDetailVisible" class="workbench-v2-task-floating-detail" aria-label="任务详情">
                      <div class="workbench-v2-task-floating-detail__body">
                        <div class="wb-task-detail-sections" role="region" :aria-label="activeTaskDetailAriaLabel">
                          <section
                            v-for="section in activeTaskDetailSections"
                            :key="section.key"
                            :class="['wb-task-detail-section', 'wb-task-detail-section--' + section.key]"
                          >
                            <h4 class="wb-task-detail-section__title">{{ section.title }}</h4>
                            <ul v-if="section.kind === 'simple-list'" class="wb-task-detail-simple-list">
                              <FreeAuditTaskDetailSimpleRow
                                v-for="(row, idx) in section.rows"
                                :key="section.key + '-' + idx"
                                :aria-label="row.label"
                                :icon-class="row.iconClass || section.iconClass || ''"
                                @open="openTaskDetailSection(section, row)"
                              >
                                <template #icon>
                                  <svg
                                    v-if="row.iconHref || section.iconHref"
                                    class="iconpark-icon"
                                    :class="row.iconToneClass || section.iconToneClass || ''"
                                    :title="row.iconTitle || section.iconTitle || section.title"
                                  ><use :href="row.iconHref || section.iconHref"></use></svg>
                                  <ds-icon
                                    v-else
                                    :name="row.iconName || section.iconName || 'document-folder'"
                                    :class="row.iconToneClass || section.iconToneClass || ''"
                                    :title="row.iconTitle || section.iconTitle || section.title"
                                  />
                                </template>
                                {{ row.label }}
                              </FreeAuditTaskDetailSimpleRow>
                            </ul>
                            <div v-else class="wb-task-detail-generate-req-box" role="region" :aria-label="section.title">
                              <p
                                v-for="(line, idx) in section.lines"
                                :key="section.key + '-' + idx"
                                class="wb-task-detail-generate-req-body"
                              >{{ line }}</p>
                            </div>
                          </section>
                        </div>
                      </div>
                    </aside>
                  </div>
                </section>
              </div>
            </template>
            <a-modal
              v-model:open="v2TaskBasicInfoModalOpen"
              title="任务详情"
              :footer="null"
              width="520px"
            >
              <FreeAuditBasicInfoPane
                pane-class="workbench-v2-task-basic-pane"
                body-class="material-preview-basic-tab"
                :rows="activeTaskBasicRows"
                key-prefix="v2-task-basic"
                status-row-label="状态"
                :status-class="activeTaskBasicStatusClass"
                :status-text="(activeTaskContextCard && activeTaskContextCard.statusLabel) || '—'"
                hide-chrome
              />
            </a-modal>
          </section>

          <section
            v-show="isExpertWorkbenchMode && activeMainView === 'chat'"
            class="workbench-v2-chat-stage workbench-v2-chat-stage--capability-host"
            :class="{ 'is-expert-guide-prompt-visible': v2ExpertGuidePromptVisible }"
            aria-label="新版工作台对话区"
          >
            <free-audit-capability-host
              v-if="capabilityHostReady"
              ref="capabilityHost"
              class="workbench-v2-capability-host"
              embed-mode="v2"
              @task-created="onCapabilityHostTaskCreated"
            />
            <article v-if="v2ExpertGuidePromptVisible" class="workbench-v2-expert-guide-prompt" aria-label="专家模式教学提示">
              <span class="workbench-v2-expert-guide-prompt__eyebrow">第一次使用专家模式？</span>
              <p class="workbench-v2-expert-guide-prompt__desc">先跟着我一起，尝试用“对话”修改材料。</p>
              <div class="workbench-v2-expert-guide-prompt__actions">
                <button type="button" class="workbench-v2-expert-guide-prompt__primary" @click="startExpertModeTeaching">开始引导</button>
                <button type="button" class="workbench-v2-expert-guide-prompt__secondary" @click="dismissExpertModeTeaching">跳过引导</button>
              </div>
            </article>
          </section>
        </main>

        <div
          v-if="isV2WorkspaceOpen"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-main-detail-resizer"
          :class="{ 'is-v2-resizer-active': v2Resizing && (v2Resizing.side === 'detailHost' || v2Resizing.side === 'docWorkspace') }"
          role="separator"
          aria-orientation="vertical"
          title="调整资料工作区宽度"
          @mousedown.stop.prevent="beginV2Resize(hasV2DocDetailPane ? 'detailHost' : 'docWorkspace', $event)"
        ></div>
        <section
          v-if="isPreviewView"
          v-show="isV2WorkspaceOpen"
          class="workbench-v2-doc-workspace"
          :class="{
            'has-detail': isV2DetailOpen,
            'has-drawer': isRightDrawerOpen,
          }"
          :style="v2DocWorkspaceStyle"
          aria-label="资料预览与目录"
        >
          <div class="workbench-v2-doc-workspace__content">
          <div class="workbench-v2-doc-workspace__tabs" role="tablist" aria-label="已打开的资料页签">
            <div class="workbench-v2-doc-workspace__tab-strip">
              <div
                v-for="tab in v2DocWorkspaceTabs"
                :key="tab.key"
                :class="['workbench-v2-doc-workspace__tab', { 'is-active': tab.active }]"
                role="tab"
                tabindex="0"
                :aria-selected="tab.active ? 'true' : 'false'"
                :title="tab.title"
                @click="activateV2DocWorkspaceTab(tab)"
                @keydown.enter.prevent="activateV2DocWorkspaceTab(tab)"
                @keydown.space.prevent="activateV2DocWorkspaceTab(tab)"
              >
                <span
                  class="workbench-v2-doc-workspace__tab-leading nlm-tree-leaf-icon"
                  :class="tab.iconSprite ? tab.iconClass : ''"
                >
                  <span class="workbench-v2-doc-workspace__tab-icon-wrap" aria-hidden="true">
                    <svg v-if="tab.iconSprite" class="iconpark-icon" aria-hidden="true"><use :href="tab.iconSprite"></use></svg>
                    <ds-icon v-else :name="tab.iconName || 'file-lines'" :class="tab.iconClass" aria-hidden="true" />
                  </span>
                  <button
                    v-if="tab.closeable"
                    type="button"
                    class="workbench-v2-doc-workspace__tab-close"
                    :title="'关闭 ' + tab.title"
                    :aria-label="'关闭 ' + tab.title"
                    @click.stop="closeV2DocWorkspaceTab(tab)"
                  >
                    <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
                  </button>
                </span>
                <span class="workbench-v2-doc-workspace__tab-label">{{ tab.title }}</span>
              </div>
              <a-dropdown :trigger="['click']" placement="bottomLeft">
                <button
                  type="button"
                  class="workbench-v2-doc-workspace__add-btn"
                  title="打开资料来源"
                  aria-label="打开资料来源"
                  @click.stop
                >
                  <ds-icon name="plus" aria-hidden="true" />
                </button>
                <template #overlay>
                  <a-menu @click="({ key }) => onV2DocWorkspaceSourceMenu(key)">
                    <a-menu-item v-for="item in v2DocWorkspaceSourceMenuItems" :key="item.key">
                      <span class="workbench-v2-doc-workspace__source-menu-item">
                        <iconpark-icon v-if="item.iconparkName" :name="item.iconparkName" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
                        <svg v-else class="iconpark-icon" aria-hidden="true"><use :href="item.icon"></use></svg>
                        <span>{{ item.label }}</span>
                      </span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div class="workbench-v2-doc-workspace__tab-actions">
              <button
                v-if="shouldShowV2FullscreenControl"
                type="button"
                class="workbench-v2-doc-workspace__fullscreen-btn"
                :class="{ 'is-active': v2DocWorkspaceFullscreen }"
                :title="v2DocWorkspaceFullscreen ? '退出全屏' : '全屏查看'"
                :aria-label="v2DocWorkspaceFullscreen ? '退出全屏' : '全屏查看'"
                :aria-pressed="v2DocWorkspaceFullscreen ? 'true' : 'false'"
                @click="toggleV2DocWorkspaceFullscreen"
              >
                <span class="workbench-v2-rail__fullscreen-icon" aria-hidden="true"></span>
              </button>
            </div>
          </div>
          <div class="workbench-v2-doc-workspace__body" :style="v2DocWorkspaceBodyStyle">
            <div
              v-if="isV2WorkspaceOpen"
              class="workbench-v2-detail-column"
              :class="{ 'is-open': isV2DetailOpen, 'is-anchor-only': !hasV2DocDetailPane }"
            >
              <div v-if="isV2DetailOpen" class="workbench-v2-detail-title-bar">
                <h2 class="workbench-v2-detail-title" :title="v2DetailTitleLabel">{{ v2DetailTitleLabel }}</h2>
                <div class="workbench-v2-detail-title-actions" aria-label="当前详情操作">
              <template v-if="v2ActiveDetailResource">
                <a-tooltip title="添加到对话">
                  <a-button
                    type="text"
                    class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                    title="添加到对话"
                    aria-label="添加到对话"
                    @click.stop="addV2PathResourceToChat"
                  ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                </a-tooltip>
                <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                  <a-tooltip title="更多">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      title="更多"
                      aria-label="更多操作"
                      @click.stop
                    ><ds-icon name="more" /></a-button>
                  </a-tooltip>
                  <template #overlay>
                    <a-menu @click="onV2PathResourceMenu">
                      <a-menu-item key="detail">详情</a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="delete" danger>删除</a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </template>
              <template v-else-if="v2ActiveRawMaterial">
                <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                  <a-tooltip title="更多">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      title="更多"
                      aria-label="更多操作"
                      @click.stop
                    ><ds-icon name="more" /></a-button>
                  </a-tooltip>
                  <template #overlay>
                    <a-menu @click="onV2PathRawMaterialMenu">
                      <a-menu-item key="detail">详情</a-menu-item>
                      <a-menu-divider v-if="v2ActiveRawMaterialMoreActions.length" />
                      <template v-for="(action, idx) in v2ActiveRawMaterialMoreActions" :key="'v2-path-raw-more-' + action">
                        <a-menu-divider v-if="action === 'delete' && idx > 0" />
                        <a-menu-item :key="action" :danger="v2WorkbenchMaterialActionDanger(action)">{{ v2WorkbenchMaterialActionLabel(action) }}</a-menu-item>
                      </template>
                    </a-menu>
                  </template>
                </a-dropdown>
                <template v-for="action in v2ActiveRawMaterialPrimaryActions" :key="'v2-path-raw-primary-' + action">
                  <a-tooltip :title="v2WorkbenchMaterialActionLabel(action)">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      :title="v2WorkbenchMaterialActionLabel(action)"
                      :aria-label="action === 'ref' ? '添加到对话' : v2WorkbenchMaterialActionLabel(action)"
                      @click.stop="handleV2PathRawMaterialAction(action)"
                    ><iconpark-icon v-if="action === 'ref'" name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon><ds-icon v-else :name="v2WorkbenchMaterialActionIcon(action)" /></a-button>
                  </a-tooltip>
                </template>
              </template>
              <template v-else-if="v2ActiveAnalysisMaterial">
                <template v-if="!v2ActiveAnalysisIsTask">
                  <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                    <a-tooltip title="更多">
                      <a-button
                        type="text"
                        class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                        title="更多"
                        aria-label="更多操作"
                        @click.stop
                      ><ds-icon name="more" /></a-button>
                    </a-tooltip>
                    <template #overlay>
                      <a-menu @click="onV2PathAnalysisMenu">
                        <a-menu-item key="detail">详情</a-menu-item>
                        <a-menu-divider />
                        <a-menu-item key="rename">重命名</a-menu-item>
                        <a-sub-menu key="export-path-analysis-sub" title="下载">
                          <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                          <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                          <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                        </a-sub-menu>
                        <a-menu-item key="delete">删除</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                  <a-tooltip title="添加到对话">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      title="添加到对话"
                      aria-label="添加到对话"
                      @click.stop="handleV2PathAnalysisAction('ref')"
                    ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                  </a-tooltip>
                </template>
                <template v-else>
                  <a-tooltip title="刷新">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      :disabled="!projectId"
                      title="刷新"
                      aria-label="重新加载任务列表，不刷新对话"
                      @click.stop="refreshV2PathTaskResult"
                    ><ds-icon name="refresh" aria-hidden="true" /></a-button>
                  </a-tooltip>
                  <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                    <a-tooltip title="更多">
                      <a-button
                        type="text"
                        class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                        title="更多"
                        aria-label="更多操作"
                        @click.stop
                      ><ds-icon name="more" /></a-button>
                    </a-tooltip>
                    <template #overlay>
                      <a-menu @click="onV2PathTaskAnalysisMenu">
                        <a-menu-item key="detail">详情</a-menu-item>
                        <a-menu-divider />
                        <a-menu-item v-if="v2ActiveAnalysisCanAbort" key="abort-task">中止</a-menu-item>
                        <a-menu-item v-if="v2ActiveAnalysisCanRerunAll" key="rerun-all">一键重跑</a-menu-item>
                        <a-menu-item v-if="v2ActiveAnalysisCanRerunTask" key="rerun-task">{{ v2ActiveAnalysisRerunLabel }}</a-menu-item>
                        <a-menu-item key="delete">删除</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </template>
              </template>
                </div>
              </div>
              <div
                id="workbench-v2-detail-host"
                class="workbench-v2-detail-host"
                :class="{ 'is-open': isV2DetailOpen }"
                aria-label="工作台详情预览"
              ></div>
              <div v-if="isV2BlankDetailOpen" class="workbench-v2-detail-empty" aria-label="资料预览空态">
                <ds-icon class="workbench-v2-detail-empty__icon" :name="v2BlankDetailIconName" aria-hidden="true" />
                <h3 class="workbench-v2-detail-empty__title">{{ v2BlankDetailTitle }}</h3>
                <p class="workbench-v2-detail-empty__desc">{{ v2BlankDetailDesc }}</p>
              </div>
            </div>
            <div
              v-if="isRightDrawerOpen && (isV2DetailOpen || isV2BlankDetailOpen)"
              class="nlm-resizer workbench-v2-col-resizer workbench-v2-detail-drawer-resizer"
              :class="{ 'is-v2-resizer-active': v2Resizing && v2Resizing.side === 'detailDrawer' }"
              role="separator"
              aria-orientation="vertical"
              title="调整预览与目录分界"
              @mousedown.stop.prevent="beginV2Resize('detailDrawer', $event)"
            ></div>
            <div
              id="workbench-v2-right-drawer-host"
              class="workbench-v2-right-drawer-host"
              :class="{ 'is-open': isRightDrawerOpen }"
              :style="rightDrawerHostStyle"
              aria-label="工作台右栏目录"
            ></div>
          </div>
          </div>
        </section>
        <aside
          v-if="isPreviewView"
          class="workbench-v2-doc-workspace__rail"
          aria-label="资料工作区工具栏"
          data-tour-id="workbench-rail"
        >
          <div class="workbench-v2-doc-workspace__rail-controls">
            <button
	              type="button"
	              class="workbench-v2-directory-switcher__btn workbench-v2-directory-switcher__btn--toggle workbench-v2-doc-workspace__rail-toggle"
              :class="{ 'is-active': isV2WorkspaceOpen }"
              :title="isV2WorkspaceOpen ? '收起资料工作区' : '展开资料工作区'"
              :aria-label="isV2WorkspaceOpen ? '收起资料工作区' : '展开资料工作区'"
              :aria-pressed="isV2WorkspaceOpen ? 'true' : 'false'"
              @click="toggleV2DocWorkspace"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use href="#right-bar"></use></svg>
            </button>
          </div>
          <span class="workbench-v2-doc-workspace__rail-divider" aria-hidden="true"></span>
          <div class="workbench-v2-doc-workspace__rail-sources" aria-label="资料目录切换">
            <button
              v-for="tool in railSourceTools"
	              :key="tool.id"
	              type="button"
	              class="workbench-v2-directory-switcher__btn"
	              :class="['workbench-v2-directory-switcher__btn--' + tool.id, { 'is-active': tool.active }]"
              :data-tour-id="tool.id === 'file' ? 'workbench-rail-file-button' : null"
              :title="tool.label"
              :aria-label="tool.label"
              :aria-pressed="tool.active ? 'true' : 'false'"
              @click="onRailToolClick(tool)"
            >
              <iconpark-icon v-if="tool.iconparkName" :name="tool.iconparkName" class="iconpark-icon" aria-hidden="true"></iconpark-icon>
              <svg v-else class="iconpark-icon" aria-hidden="true"><use :href="tool.icon"></use></svg>
            </button>
          </div>
        </aside>
        <a-modal
          v-model:open="v2OtherWorkbenchSkillModalOpen"
          title="从其他工作台添加"
          width="720"
          wrapClassName="modal-w-720"
          centered
          :footer="null"
          @cancel="closeV2OtherWorkbenchSkillModal"
        >
          <div class="workbench-v2-skill-copy-modal">
            <label class="workbench-v2-skill-search workbench-v2-skill-copy-modal__search">
              <ds-icon name="search" class="workbench-v2-skill-search__icon" aria-hidden="true" />
              <input
                v-model="v2OtherWorkbenchSkillSearch"
                type="search"
                class="workbench-v2-skill-search__input"
                placeholder="搜索技能或来源工作台"
                aria-label="搜索其他工作台技能"
              />
            </label>
            <div v-if="v2OtherWorkbenchSkillCards.length" class="workbench-v2-skill-copy-list">
              <article
                v-for="row in v2OtherWorkbenchSkillCards"
                :key="row.key"
                class="workbench-v2-skill-copy-row"
              >
                <div class="workbench-v2-skill-copy-row__main">
                  <div class="workbench-v2-skill-copy-row__title">{{ row.name }}</div>
                  <div class="workbench-v2-skill-copy-row__desc">{{ row.description }}</div>
                  <div class="workbench-v2-skill-copy-row__source">来源：{{ row.projectName }}</div>
                </div>
                <a-button
                  class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-copy-row__action"
                  :disabled="row.added"
                  @click="installV2OtherWorkbenchSkill(row)"
                >
                  <span class="ds-trigger-btn__text">{{ row.added ? '已添加' : '添加' }}</span>
                </a-button>
              </article>
            </div>
            <a-empty v-else description="暂无可添加的其他工作台技能" />
          </div>
        </a-modal>
        <div
          v-if="v2ModeGateOpen"
          class="workbench-v2-mode-gate"
          role="dialog"
          aria-modal="true"
          aria-label="选择工作模式"
        >
          <section class="workbench-v2-mode-card">
            <header class="workbench-v2-mode-card__hero">
              <span class="workbench-v2-mode-card__eyebrow">欢迎登录</span>
              <h1 class="workbench-v2-mode-card__title">请选择工作模式</h1>
            </header>
            <div class="workbench-v2-mode-card__options">
              <button type="button" class="workbench-v2-mode-option workbench-v2-mode-option--simple" @click="selectWorkbenchMode('simple')">
                <span class="workbench-v2-mode-option__recommend">新手推荐</span>
                <span class="workbench-v2-mode-option__media" aria-hidden="true">
                  <img src="./assets/img/mode-gate/mode-gate-simple-flow-512x384.svg" alt="" />
                </span>
                <span class="workbench-v2-mode-option__body">
                  <span class="workbench-v2-mode-option__title-row">
                    <span class="workbench-v2-mode-option__title">简单模式</span>
                  </span>
                  <span class="workbench-v2-mode-option__desc">更简单，更易上手，轻松使用AI能力提升工作效率。</span>
                </span>
              </button>
              <button type="button" class="workbench-v2-mode-option workbench-v2-mode-option--expert" @click="selectWorkbenchMode('expert')">
                <span class="workbench-v2-mode-option__media" aria-hidden="true">
                  <img src="./assets/img/mode-gate/mode-gate-expert-flow-512x384.svg" alt="" />
                </span>
                <span class="workbench-v2-mode-option__body">
                  <span class="workbench-v2-mode-option__title">专家模式</span>
                  <span class="workbench-v2-mode-option__desc">更多AI协同审计方式，能力更强也更复杂，支持多种数据与工具的接入</span>
                </span>
              </button>
            </div>
          </section>
        </div>
        <a-tour
          v-if="tourOpen"
          :key="'workbench-tour-' + tourGuideKind + '-' + tourRenderKey"
          v-model:current="tourCurrent"
          :root-class-name="workbenchTourRootClassName"
          :open="tourOpen"
          :steps="workbenchTourSteps"
          :gap="workbenchTourGap"
          @close="closeWorkbenchTour"
          @finish="finishWorkbenchTour"
        >
          <template #indicatorsRender="{ current, total }">
            <div class="workbench-v2-tour-indicators">
              <span
                class="workbench-v2-tour-progress"
                :aria-label="'第 ' + (Number(current) + 1) + ' 步，共 ' + total + ' 步'"
              >
                <span class="workbench-v2-tour-dots" aria-hidden="true">
                  <span
                    v-for="index in workbenchTourIndicatorItems(total)"
                    :key="index"
                    class="ant-tour-indicator"
                    :class="{ 'ant-tour-indicator-active': index === current }"
                  ></span>
                </span>
              </span>
              <a-button
                v-if="!workbenchTourIsCompleteStep(current)"
                size="small"
                class="workbench-v2-tour-skip-button"
                @click.stop="skipWorkbenchTour"
              >{{ workbenchTourSkipLabel(current) }}</a-button>
              <a-button
                v-if="workbenchTourIsCompleteStep(current)"
                size="small"
                type="primary"
                class="workbench-v2-tour-action-button"
                :class="{ 'workbench-v2-tour-action-button--first': workbenchTourIsSkillCompleteStep(current) }"
                @click.stop="endWorkbenchTour"
              >结束引导</a-button>
            </div>
          </template>
        </a-tour>
        <a-tour
          v-if="v2HelpCoachOpen"
          root-class-name="workbench-v2-tour--help"
          :current="0"
          :open="v2HelpCoachOpen"
          :steps="workbenchHelpCoachSteps"
          :gap="workbenchTourGap"
          @update:open="onWorkbenchHelpCoachOpenChange"
          @close="finishWorkbenchHelpCoach"
          @finish="finishWorkbenchHelpCoach"
        />
        <teleport v-if="isExpertWorkbenchMode" to="body">
          <div class="workbench-v2-help-float" data-tour-id="workbench-help-button">
            <span v-if="v2HelpHintVisible" class="workbench-v2-help-float__hint">之后可在这里学习</span>
            <a-popover
              :open="v2HelpPopoverOpen"
              trigger="click"
              placement="topRight"
              :arrow="false"
              overlayClassName="workbench-v2-help-popover"
              @update:open="onWorkbenchHelpOpenChange"
            >
              <template #content>
                <div class="workbench-v2-help-panel">
                  <div class="workbench-v2-help-panel__head">
                    <div class="workbench-v2-help-panel__title">基础操作引导</div>
                  </div>
                  <button
                    v-for="guide in workbenchHelpGuides"
                    :key="guide.key"
                    type="button"
                    class="workbench-v2-help-guide"
                    @click="startWorkbenchGuide(guide.key)"
                  >
                    <ds-icon :name="guide.icon" class="workbench-v2-help-guide__icon" aria-hidden="true" />
                    <span class="workbench-v2-help-guide__main">
                      <span class="workbench-v2-help-guide__title">{{ guide.title }}</span>
                      <span class="workbench-v2-help-guide__desc">{{ guide.desc }}</span>
                    </span>
                  </button>
                </div>
              </template>
              <button
                ref="workbenchHelpButton"
                type="button"
                class="workbench-v2-help-float__button"
                title="帮助"
                aria-label="打开引导帮助"
              >
                <ds-icon name="circle-info" aria-hidden="true" />
                <span>帮助</span>
              </button>
            </a-popover>
          </div>
        </teleport>
      </a-layout>
    `,
    data() {
      const projectId = getV2ProjectId();
      const shouldShowOnboarding = shouldStartWithBlankConversation(projectId);
      return {
        projectId,
        activeConversationId: getInitialConversationId(projectId),
        draftConversationTitle: '',
        v2SavedSessions: [],
        v2ConversationBulkActive: false,
        v2ConversationBulkKeys: [],
        v2ArchivedConversationIds: [],
        v2DeletedConversationIds: [],
        v2PendingConversationSelectId: '',
        workbenchMode: 'simple',
        v2ModeGateOpen: shouldShowOnboarding,
        sidebarCollapsed: false,
        v2SidebarHistoryExpanded: true,
        v2SidebarTasksExpanded: true,
        v2SidebarAppHistoryExpanded: true,
        v2SidebarWidth: 260,
        v2DetailHostWidth: 420,
        v2DocWorkspaceColumnWidth: 388,
        v2Resizing: null,
        activeMainView: 'app',
        v2AppScopeTab: 'team',
        v2AppSearchQuery: '',
        v2AppTypeFilter: 'all',
        v2AppCategoryTab: 'all',
        v2AppSortBy: 'time',
        v2AppSortOrder: 'desc',
        v2AppRevision: 0,
        v2SidebarAppSearchQuery: '',
        v2RecentAppIds: ['app-contract-change', 'app-report-draft'],
        v2FavoriteAppIds: ['app-contract-change', 'app-report-draft'],
        v2AppExecutionRecords: V2_APP_EXECUTION_RECORDS.map((record) => ({ ...record, seeded: true, files: (record.files || []).slice() })),
        v2ActiveAppRecordId: 'app-run-contract-0626',
        v2AppRecordPreviewFile: '',
        v2AppUploadFiles: [],
        v2AppStage: 'list',
        v2AppConfigView: 'config',
        v2ActiveAppId: 'app-contract-change',
        v2AppUseState: 'ready',
        v2AppActiveExampleKey: '',
        v2AppExamplePreview: {
          open: false,
          title: '文件预览',
          fileName: '',
          lines: [],
          isOnlinePreview: false,
          previewMeta: 'FILE',
          previewPageLabel: '文件预览',
        },
        v2AppEditorOpen: false,
        v2AppEditorMode: 'create',
        v2AppEditorSourceAppId: '',
        v2AppEditorSourceSkillKey: '',
        v2AppEditorMoreOpen: false,
        v2AppForm: {
          kind: 'skill',
          name: '',
          desc: '',
          scene: '',
          appType: '',
          appUrl: '',
          skillName: '',
          skillVersion: '',
          inputItems: [],
	          inputLabel: '',
	          outputLabel: '',
	          inputExamples: {},
	          outputExample: '',
	          uploadPrompt: '',
	          uploadExampleFiles: [],
	          outputExampleFiles: [],
	          uploadRule: 'free',
        },
        activeTaskId: '',
        activeBatchChildId: '',
        v2BatchChildStatusView: 'all',
        v2BatchChildPage: 1,
        v2BatchChildPageSize: 5,
        v2BatchChildBulkActive: false,
        v2BatchChildBulkKeys: [],
        v2CreatedTasks: [],
        v2TaskBasicInfoModalOpen: false,
        v2TaskDetailVisible: true,
        v2TaskDetailLayout: 'overlay',
        v2AppDetailLayout: 'overlay',
        v2AppHistoryVisible: false,
        v2AppRecordDetailVisible: true,
        v2SearchQuery: '',
        v2SkillSearchQuery: '',
        v2SkillScopeTab: 'workbench',
        v2SkillTypeFilter: 'all',
        v2SkillCategoryTab: 'all',
        v2SkillSortBy: 'time',
        v2SkillSortOrder: 'desc',
        v2SkillCreateDropdownOpen: false,
        v2SharedSkillRows: [],
        v2OtherWorkbenchSkillModalOpen: false,
        v2OtherWorkbenchSkillSearch: '',
        v2BridgeTick: 0,
        v2RightPanel: 'file',
        v2RightDrawerCollapsed: false,
        v2DocWorkspaceCollapsed: false,
        v2DocWorkspaceFullscreen: false,
        v2DirectoryToolsCollapsed: false,
        v2StudioWidth: 340,
        v2SourcesRightView: 'list',
        v2DocWorkspaceActiveTitle: '',
        v2DocWorkspaceActiveKey: '',
        v2DocWorkspaceTabMirror: [],
        capabilityHostReady: false,
        tourOpen: false,
        tourCurrent: 0,
        tourRenderKey: 0,
        tourAutoShown: false,
        tourLaunchMode: 'manual',
        tourGuideKind: 'basic',
        tourIncludeIntro: false,
        tourSelectedSkillCard: null,
        tourSkillCompleted: false,
        tourSuppressCloseHint: false,
        tourSkipAutoPrepareOnce: false,
        v2ExpertGuidePromptVisible: false,
        v2HelpPopoverOpen: false,
        v2HelpCoachOpen: false,
        v2HelpHintVisible: false,
        _v2HelpHintTimer: null,
        v2ProjectOptions: readStoredV2WorkbenchProjectOptions(),
        v2ProjectDropdownOpen: false,
        v2ProjectSearchQuery: '',
      };
    },
    computed: {
      projectTitle() {
        const hit = this.workbenchProjectOptions.find((project) => project.id === this.projectId);
        return (hit && hit.name) || getProjectTitle(this.projectId);
      },
      mainViews() {
        return this.isSimpleWorkbenchMode
          ? V2_MAIN_VIEWS.filter((view) => view.id === 'search' || view.id === 'app')
          : V2_MAIN_VIEWS;
      },
      isExpertWorkbenchMode() {
        return this.workbenchMode === 'expert';
      },
      isSimpleWorkbenchMode() {
        return this.workbenchMode === 'simple';
      },
      isEmptyWorkbenchProject() {
        return shouldStartWithBlankConversation(this.projectId);
      },
      workbenchHelpGuides() {
        return [
          {
            key: 'basic',
            icon: 'chat-ref',
            title: '对话“改材料”',
            desc: '上传材料，输入要求，发送对话。',
          },
          {
            key: 'skill',
            icon: 'book-open',
            title: '复用审计思路',
            desc: '选择审计方法，进行专业审计。',
          },
        ];
      },
      workbenchProjectOptions() {
        const rows = normalizeV2WorkbenchProjectOptions(this.v2ProjectOptions || []);
        const currentId = String(this.projectId || '').trim();
        if (currentId && !rows.some((project) => String(project.id) === currentId)) {
          return normalizeV2WorkbenchProjectOptions([
            ...rows,
            {
              id: currentId,
              name: getProjectTitle(currentId),
              description: getProjectDescription(currentId),
            },
          ]);
        }
        return rows;
      },
      filteredWorkbenchProjectOptions() {
        const keyword = String(this.v2ProjectSearchQuery || '').trim().toLowerCase();
        const rows = this.workbenchProjectOptions || [];
        if (!keyword) return rows;
        return rows.filter((project) => {
          const hay = [
            project && project.name,
            project && project.description,
          ].join(' ').toLowerCase();
          return hay.includes(keyword);
        });
      },
      capabilityHost() {
        void this.v2BridgeTick;
        return resolveCapabilityHost(this);
      },
      isPreviewView() {
        return this.isExpertWorkbenchMode && (
          this.activeMainView === 'chat'
          || this.activeMainView === 'task'
          || (this.activeMainView === 'app' && this.v2AppStage === 'record')
        );
      },
      isRightDrawerOpen() {
        return this.isPreviewView && !this.v2DocWorkspaceCollapsed;
      },
      hasV2ActiveDetailTab() {
        const host = this.capabilityHost;
        const activeKey = this.v2DocWorkspaceActiveKey || (host && host.workbenchV2DetailActiveTabKey);
        return !!String(activeKey || '').trim();
      },
      isV2DetailOpen() {
        return this.isPreviewView
          && !this.v2DocWorkspaceCollapsed
          && (this.v2SourcesRightView === 'detail' || this.hasV2ActiveDetailTab);
      },
      isV2BlankDetailOpen() {
        return false;
      },
      hasV2DocDetailPane() {
        return this.isV2DetailOpen || this.isV2BlankDetailOpen;
      },
      isV2WorkspaceOpen() {
        return this.isPreviewView && !this.v2DocWorkspaceCollapsed;
      },
      isV2DocWorkspaceFullscreen() {
        return this.isV2WorkspaceOpen && this.v2DocWorkspaceFullscreen;
      },
      shouldShowV2FullscreenControl() {
        return this.isV2WorkspaceOpen && this.isV2DetailOpen;
      },
      shouldReserveV2DirectoryWidth() {
        return false;
      },
      v2DocWorkspaceWidth() {
        if (!this.hasV2DocDetailPane) {
          return this.clampV2DocWorkspaceColumnWidth(Number(this.v2DocWorkspaceColumnWidth) || 388);
        }
        const detailW = Math.min(720, Math.max(280, Number(this.v2DetailHostWidth) || 420));
        const drawerW = Math.min(500, Math.max(240, Number(this.v2StudioWidth) || 340));
        return Math.max(240, detailW + 1 + drawerW);
      },
      v2ShellGridStyle() {
        const sidebarW = this.sidebarCollapsed ? '48px' : `${this.v2SidebarWidth}px`;
        const docWorkspaceW = `${this.v2DocWorkspaceWidth}px`;
        const previewTailW = this.isPreviewView ? `${V2_DOC_WORKSPACE_RAIL_WIDTH}px` : '0px';
        if (this.isV2DocWorkspaceFullscreen) {
          return {
            '--workbench-v2-sidebar-current-width': sidebarW,
            '--workbench-v2-doc-workspace-current-width': docWorkspaceW,
            '--workbench-v2-preview-tail-width': previewTailW,
            gridTemplateColumns: `${sidebarW} minmax(0, 1fr)`,
          };
        }
        const cols = [];
        cols.push(sidebarW);
        cols.push('minmax(280px, 1fr)');
        if (this.isV2WorkspaceOpen) {
          cols.push(docWorkspaceW);
        }
        if (this.isPreviewView) {
          cols.push(`${V2_DOC_WORKSPACE_RAIL_WIDTH}px`);
        }
        return {
          '--workbench-v2-sidebar-current-width': sidebarW,
          '--workbench-v2-doc-workspace-current-width': docWorkspaceW,
          '--workbench-v2-preview-tail-width': previewTailW,
          gridTemplateColumns: cols.join(' '),
        };
      },
      v2DocWorkspaceStyle() {
        return {
          width: '100%',
          minWidth: 0,
          maxWidth: 'none',
          minHeight: 0,
          height: '100%',
        };
      },
      v2DocWorkspaceBodyStyle() {
        const detailW = Math.min(720, Math.max(280, Number(this.v2DetailHostWidth) || 420));
        const drawerW = Math.min(500, Math.max(240, Number(this.v2StudioWidth) || 340));
        if (this.isV2DocWorkspaceFullscreen) {
          if (this.hasV2DocDetailPane) {
            return { gridTemplateColumns: `minmax(0, 1fr) ${V2_DOC_WORKSPACE_SPLIT_WIDTH}px minmax(280px, 360px)` };
          }
          return { gridTemplateColumns: 'minmax(0, 1fr)' };
        }
        if (this.isV2WorkspaceOpen) {
          if (this.hasV2DocDetailPane) {
            return { gridTemplateColumns: `${detailW}px ${V2_DOC_WORKSPACE_SPLIT_WIDTH}px minmax(0, ${drawerW}px)` };
          }
          return { gridTemplateColumns: 'minmax(0, 1fr)' };
        }
        return { gridTemplateColumns: 'minmax(0, 1fr)' };
      },
      rightDrawerHostStyle() {
        return {
          width: '100%',
          minWidth: 0,
          maxWidth: 'none',
          minHeight: 0,
          height: '100%',
        };
      },
      v2DocWorkspacePanelLabel() {
        const map = { file: '材料与结果目录', database: '库表目录', graph: '图谱目录', knowledge: '知识库', result: '结果目录' };
        return map[this.v2RightPanel] || '目录';
      },
      v2BlankDetailIconName() {
        if (this.v2RightPanel === 'database') return 'table';
        if (this.v2RightPanel === 'graph') return 'map-draw';
        if (this.v2RightPanel === 'knowledge') return 'book';
        if (this.v2RightPanel === 'result') return 'notes';
        return 'file-lines';
      },
      v2BlankDetailTitle() {
        const map = {
          file: '选择材料查看预览',
          database: '选择库表查看详情',
          graph: '选择图谱查看详情',
          knowledge: '选择知识库查看详情',
          result: '选择结果查看详情',
        };
        return map[this.v2RightPanel] || '选择内容查看详情';
      },
      v2BlankDetailDesc() {
        const map = {
          file: '从右侧材料或结果目录中选择一个条目。',
          database: '从右侧库表目录中选择一个数据表。',
          graph: '从右侧图谱目录中选择一个图谱。',
          knowledge: '从右侧知识库目录中选择一个条目。',
          result: '从右侧结果目录中选择一个结果。',
        };
        return map[this.v2RightPanel] || '从右侧目录中选择内容。';
      },
      v2DocWorkspaceTabs() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
        const activeKey = this.v2DocWorkspaceActiveKey || (host && host.workbenchV2DetailActiveTabKey);
        const tabs = Array.isArray(this.v2DocWorkspaceTabMirror) ? this.v2DocWorkspaceTabMirror : [];
        const mapped = tabs.map((tab) => ({
          key: String(tab.key || ''),
          title: String(tab.title || '未命名预览'),
          active: String(tab.key || '') === String(activeKey || ''),
          closeable: true,
          scopeLabel: this.getV2DocWorkspaceTabScopeLabel(tab, host),
          ...this.getV2DocWorkspaceTabIconMeta(tab, host),
          raw: tab,
        })).filter((tab) => tab.key);
        if (mapped.length) return mapped;
        if (this.isV2DetailOpen) {
          const fallbackTitle = String(
            this.v2DocWorkspaceActiveTitle
            || '预览详情'
          ).trim();
          return [{
            key: 'detail:fallback',
            title: fallbackTitle,
            active: true,
            closeable: false,
            iconName: null,
            iconSprite: '#notes',
            iconClass: '',
            raw: null,
          }];
        }
        return [];
      },
      v2DocWorkspaceSourceMenuItems() {
        return [
          { key: 'file', label: '材料', icon: '#notes', iconparkName: 'folder-close' },
          { key: 'database', label: '数据库表', icon: '#form', iconparkName: 'data' },
          { key: 'graph', label: '数据图谱', icon: '#connect' },
          { key: 'knowledge', label: '知识库', icon: '#book' },
        ];
      },
      v2DocWorkspacePathLabel() {
        const active = this.v2DocWorkspaceTabs.find((tab) => tab.active) || this.v2DocWorkspaceTabs[0];
        if (!active || !active.title) return this.v2DocWorkspacePanelLabel;
        const parts = this.v2DocWorkspacePathParts(active);
        return parts.length ? parts.join(' / ') : active.title;
      },
      v2DetailTitleLabel() {
        const active = this.v2DocWorkspaceTabs.find((tab) => tab.active) || this.v2DocWorkspaceTabs[0];
        if (active && active.title) return active.title;
        const fallback = String(this.v2DocWorkspaceActiveTitle || '').trim();
        return fallback || '预览详情';
      },
      v2ActiveDetailResource() {
        const host = this.capabilityHost;
        return this.isV2DetailOpen && host && host.selectedResourcePreview ? host.selectedResourcePreview : null;
      },
      v2ActiveRawMaterial() {
        const host = this.capabilityHost;
        if (!this.isV2DetailOpen || !host || !host.selectedMaterialDetail || !host.selectedMaterial) return null;
        return host.selectedMaterial.type === 'raw' ? host.selectedMaterial : null;
      },
      v2ActiveAnalysisMaterial() {
        const host = this.capabilityHost;
        if (!this.isV2DetailOpen || !host || !host.selectedMaterial) return null;
        return host.selectedMaterial.type === 'analysis' ? host.selectedMaterial : null;
      },
      v2ActiveRawMaterialPrimaryActions() {
        const host = this.capabilityHost;
        const material = this.v2ActiveRawMaterial;
        if (!host || !material || typeof host.workbenchMaterialPrimaryActions !== 'function') return [];
        return host.workbenchMaterialPrimaryActions(material);
      },
      v2ActiveRawMaterialMoreActions() {
        const host = this.capabilityHost;
        const material = this.v2ActiveRawMaterial;
        if (!host || !material || typeof host.workbenchMaterialMoreActions !== 'function') return [];
        return host.workbenchMaterialMoreActions(material);
      },
      v2ActiveAnalysisIsTask() {
        const host = this.capabilityHost;
        return !!(host && host.selectedMaterialIsWorkbenchCreatedTask);
      },
      v2ActiveAnalysisCanAbort() {
        const host = this.capabilityHost;
        const material = this.v2ActiveAnalysisMaterial;
        return !!(host && material && typeof host.workbenchAnalysisStatusOf === 'function' && ['queued', 'parsing'].includes(host.workbenchAnalysisStatusOf(material)));
      },
      v2ActiveAnalysisCanRerunAll() {
        const host = this.capabilityHost;
        const material = this.v2ActiveAnalysisMaterial;
        return !!(host && material && typeof host.batchParentCanRerunMenu === 'function' && host.batchParentCanRerunMenu(material));
      },
      v2ActiveAnalysisCanRerunTask() {
        const host = this.capabilityHost;
        const material = this.v2ActiveAnalysisMaterial;
        return !!(host && material && typeof host.workbenchTaskCanShowRerun === 'function' && host.workbenchTaskCanShowRerun(material));
      },
      v2ActiveAnalysisRerunLabel() {
        const host = this.capabilityHost;
        const material = this.v2ActiveAnalysisMaterial;
        if (!host || !material || typeof host.workbenchTaskRerunMenuLabel !== 'function') return '重跑';
        return host.workbenchTaskRerunMenuLabel(material);
      },
      railTools() {
        return this.railSourceTools;
      },
      workbenchTourRawSteps() {
        return this.emptyWorkbenchTourSteps();
      },
      workbenchTourRootClassName() {
        const current = (this.workbenchTourRawSteps || [])[this.tourCurrent] || {};
        const key = current.tourStepKey || '';
        return [
          this.tourGuideKind === 'basic' ? 'workbench-v2-tour--action' : '',
          key === 'first' ? 'workbench-v2-tour--first' : '',
          key === 'assistant' ? 'workbench-v2-tour--assistant' : '',
          key === 'rail' ? 'workbench-v2-tour--rail' : '',
          key === 'upload' ? 'workbench-v2-tour--upload' : '',
          key === 'input' ? 'workbench-v2-tour--input' : '',
          key === 'send' ? 'workbench-v2-tour--send' : '',
          key === 'process' ? 'workbench-v2-tour--process' : '',
          key === 'complete' ? 'workbench-v2-tour--complete' : '',
          key === 'learn-more' ? 'workbench-v2-tour--learn-more' : '',
          key.indexOf('skill-') === 0 ? 'workbench-v2-tour--skill' : '',
          key === 'task' ? 'workbench-v2-tour--task-start' : '',
        ].filter(Boolean).join(' ');
      },
      workbenchTourFirstStepCover() {
        if (typeof createVNode !== 'function') return null;
        return createVNode('img', {
          alt: '工作台引导示意图',
          class: 'workbench-v2-tour-cover-image',
          src: V2_WORKBENCH_TOUR_BANNER_SRC,
        });
      },
      workbenchTourCurrentStepKey() {
        const current = (this.workbenchTourRawSteps || [])[this.tourCurrent] || {};
        return current.tourStepKey || '';
      },
      workbenchTourFinalPlacement() {
        return 'top';
      },
      workbenchTourSteps() {
        return (this.workbenchTourRawSteps || []).map((step) => {
          const { tourStepKey, ...tourStep } = step;
          if (this.tourGuideKind === 'basic' || this.tourGuideKind === 'skill') {
            return {
              ...tourStep,
              prevButtonProps: this.workbenchTourHiddenNextButtonProps(),
              nextButtonProps: this.workbenchTourHiddenNextButtonProps(),
            };
          }
          return tourStep;
        });
      },
      workbenchHelpCoachSteps() {
        return [
          {
            title: '后续可以在这里重新学习',
            target: () => this.workbenchTourHelpTarget(),
            placement: 'topRight',
            nextButtonProps: this.workbenchTourNextButtonProps('知道了'),
          },
        ];
      },
      workbenchTourLearnMoreDescription() {
        if (typeof createVNode !== 'function') return '你还可以继续学习其他操作。';
        const guides = (this.workbenchHelpGuides || [])
          .filter((guide) => ['basic', 'skill'].includes(guide.key))
          .map((guide) => ({ ...guide, learned: guide.key === 'basic' || (guide.key === 'skill' && this.tourSkillCompleted) }));
        return createVNode('div', { class: 'workbench-v2-tour-guide-panel' }, [
          createVNode('p', { class: 'workbench-v2-tour-guide-desc' }, '你还可以继续学习其他操作。'),
          createVNode('div', { class: 'workbench-v2-tour-guide-list' }, guides.map((guide) => {
            const children = [
              createVNode('ds-icon', { name: guide.icon, class: 'workbench-v2-help-guide__icon', 'aria-hidden': 'true' }),
              createVNode('span', { class: 'workbench-v2-help-guide__main' }, [
                createVNode('span', { class: 'workbench-v2-help-guide__title' }, guide.title),
                createVNode('span', { class: 'workbench-v2-help-guide__desc' }, guide.desc),
              ]),
            ];
            if (guide.learned) {
              children.push(createVNode('span', { class: 'workbench-v2-tour-guide-card__status' }, '已学习'));
            }
            children.push(createVNode('button', {
              type: 'button',
              class: [
                'workbench-v2-tour-guide-card__action',
                guide.learned ? 'is-secondary' : '',
              ],
              onClick: (event) => {
                if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
                this.chooseWorkbenchTourGuide(guide.key);
              },
            }, guide.learned ? '重新学习' : '继续学习'));
            return createVNode('div', {
              key: guide.key,
              class: 'workbench-v2-help-guide workbench-v2-tour-guide-card',
            }, children);
          })),
        ]);
      },
      workbenchTourGap() {
        return { offset: 0, radius: 8 };
      },
      railSourceTools() {
        const panel = this.v2RightPanel || 'file';
        return V2_RAIL_TOOLS.filter((tool) => tool.panel !== 'toggle').map((tool) => ({
          ...tool,
          active: panel === tool.panel,
        }));
      },
      historyConversations() {
        const activeId = getInitialConversationId(this.projectId);
        const hideGuideScenario = shouldStartWithBlankConversation(this.projectId);
        const archivedIds = new Set((this.v2ArchivedConversationIds || []).map(String));
        const deletedIds = new Set((this.v2DeletedConversationIds || []).map(String));
        const saved = (this.v2SavedSessions || []).map((session) => ({
          id: session.id,
          title: String(session.title || '').trim() || '未命名对话',
          meta: '历史对话',
          timeLabel: '刚刚',
          source: 'session',
        }));
        const scenarios = hideGuideScenario ? [] : (CHAT_DEMO_SCENARIOS || []).map((scenario) => ({
          id: scenario.id,
          title: getConversationTitle(scenario),
          meta: '历史对话',
          timeLabel: getScenarioTimeLabel(scenario),
          ageHours: getScenarioAgeHours(scenario),
          source: 'demo',
        })).sort((a, b) => {
          if (a.ageHours !== b.ageHours) return a.ageHours - b.ageHours;
          if (a.id === activeId) return -1;
          if (b.id === activeId) return 1;
          return String(a.id || '').localeCompare(String(b.id || ''));
        });
        return saved.concat(scenarios).filter((item) => {
          const id = String((item && item.id) || '');
          return id && !archivedIds.has(id) && !deletedIds.has(id);
        });
      },
      v2ConversationBulkSelectedCount() {
        return this.v2ConversationBulkKeys.length;
      },
      conversationBulkAllSelected() {
        const ids = (this.historyConversations || []).map((item) => String(item.id || '')).filter(Boolean);
        if (!ids.length) return false;
        const selected = new Set(this.v2ConversationBulkKeys || []);
        return ids.every((id) => selected.has(id));
      },
      conversationBulkSomeSelected() {
        const ids = (this.historyConversations || []).map((item) => String(item.id || '')).filter(Boolean);
        if (!ids.length) return false;
        const selected = new Set(this.v2ConversationBulkKeys || []);
        const count = ids.filter((id) => selected.has(id)).length;
        return count > 0 && count < ids.length;
      },
      taskList() {
        return getTaskRows(this.projectId);
      },
      appExecutionTaskCards() {
        return (this.v2SidebarExecutionRecords || []).map((record) => ({
          id: record.id,
          title: String(record.title || '').trim() || '未命名任务',
          status: String(record.status || '').trim() || 'pending',
          statusLabel: String(record.statusLabel || getTaskStatusLabel(record.status)).trim(),
          timeLabel: String(record.timeLabel || '').trim(),
          iconName: 'edit-one',
          iconTitle: '单次任务',
          iconClass: 'is-task-single',
          statusIcon: record.statusIcon || getTaskStatusIcon(record.status),
          sourceType: 'app-execution',
          rawRecord: record,
        }));
      },
      taskCards() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
        const appCards = this.appExecutionTaskCards || [];
        const localCreated = (this.v2CreatedTasks || [])
          .map((row) => getTaskCardFromRaw(row, host))
          .filter(Boolean);
        const localIds = new Set(localCreated.map((row) => String(row.id || '')));
        const fallbackCards = (this.taskList || []).map((row) => ({ ...row, raw: row.raw || null, node: row.raw ? { id: row.raw.id, raw: row.raw } : null }));
        if (host && Array.isArray(host.workbenchTaskTreeSections)) {
          const hostCards = host.workbenchTaskTreeSections
            .flatMap((section) => (section && section.children) || [])
            .map((node) => getTaskCardFromRaw(node && node.raw, host))
            .filter(Boolean);
          const merged = localCreated.concat(hostCards.filter((row) => !localIds.has(String(row.id || ''))));
          const mergedIds = new Set(merged.map((row) => String(row.id || '')));
          const baseCards = merged.concat(fallbackCards.filter((row) => !mergedIds.has(String(row.id || ''))));
          const appIds = new Set(appCards.map((row) => String(row.id || '')));
          return appCards.concat(baseCards.filter((row) => !appIds.has(String(row.id || ''))));
        }
        const baseCards = localCreated.concat(fallbackCards.filter((row) => !localIds.has(String(row.id || ''))));
        const appIds = new Set(appCards.map((row) => String(row.id || '')));
        return appCards.concat(baseCards.filter((row) => !appIds.has(String(row.id || ''))));
      },
      taskStatusSummary() {
        return (this.taskCards || []).reduce((sum, row) => {
          const st = String((row && row.status) || '');
          if (st in sum) sum[st] += 1;
          return sum;
        }, { queued: 0, parsing: 0, done: 0, failed: 0, pending: 0 });
      },
      activeTaskCard() {
        const id = String(this.activeTaskId || '');
        if (!id) return null;
        return (this.taskCards || []).find((item) => item && String(item.id) === id) || null;
      },
      activeTaskIsBatch() {
        return getWorkbenchTaskType(this.activeTaskCard && this.activeTaskCard.raw) === 'batch';
      },
      activeBatchChildCards() {
        const raw = this.activeTaskCard && this.activeTaskCard.raw;
        const children = Array.isArray(raw && raw.children) ? raw.children : [];
        const host = this.capabilityHost;
        return children.map((child) => getTaskCardFromRaw(child, host)).filter(Boolean);
      },
      v2BatchChildStatusItems() {
        const cards = this.activeBatchChildCards || [];
        const count = (key) => cards.filter((child) => this.v2BatchChildMatchesStatus(child, key)).length;
        return [
          { key: 'all', label: '全部', count: cards.length },
          { key: 'queued', label: '排队中', tone: 'queued', count: count('queued') },
          { key: 'parsing', label: '运行中', tone: 'parsing', count: count('parsing') },
          { key: 'done', label: '完成', tone: 'done', count: count('done') },
          { key: 'no-result', label: '无结果', tone: 'queued', count: count('no-result') },
          { key: 'failed', label: '失败', tone: 'failed', count: count('failed') },
        ];
      },
      filteredV2BatchChildCards() {
        const view = String(this.v2BatchChildStatusView || 'all');
        return (this.activeBatchChildCards || []).filter((child) => this.v2BatchChildMatchesStatus(child, view));
      },
      pagedV2BatchChildCards() {
        const page = Math.max(1, Number(this.v2BatchChildPage) || 1);
        const size = Math.max(1, Number(this.v2BatchChildPageSize) || 1);
        const start = (page - 1) * size;
        return this.filteredV2BatchChildCards.slice(start, start + size);
      },
      activeBatchChildCard() {
        const id = String(this.activeBatchChildId || '');
        if (!id) return null;
        return (this.activeBatchChildCards || []).find((item) => item && String(item.id) === id) || null;
      },
      activeTaskContextCard() {
        return this.activeBatchChildCard || this.activeTaskCard || null;
      },
      activeTaskContextTurns() {
        const card = this.activeTaskContextCard;
        if (!card || !card.raw) return [];
        return this.buildV2TaskContextTurns(card);
      },
      activeV2AppRecordContextTurns() {
        const record = this.activeV2AppRecord || null;
        if (!record) return [];
        const app = this.activeV2AppRecordApp || {};
        const appName = String(app.name || '应用任务').trim();
        const title = String(record.title || appName || '应用任务').trim();
        const files = this.v2AppRecordSourceFiles(record).map((file) => String(file || '').trim()).filter(Boolean);
        const instruction = String(app.uploadPrompt || '').trim();
        const resultTitle = String(record.resultTitle || '执行结果').trim();
        const statusText = String(record.statusLabel || this.v2AppUseStatusText || '—').trim() || '—';
        const actionStatus = record.status === 'failed' ? 'fail' : (record.status === 'parsing' || record.status === 'queued' ? 'running' : 'done');
        const lines = [`来源应用：${appName}`];
        if (files.length) lines.push(`上传材料：${files.join('、')}`);
        if (instruction) lines.push(`任务指令：${instruction}`);
        return [
          {
            id: `${record.id || 'app-record'}-user`,
            role: 'user',
            text: `查看应用任务「${title}」的执行过程。`,
          },
          {
            id: `${record.id || 'app-record'}-thinking`,
            role: 'thinking',
            toolCalls: [
              { type: 'text', body: lines.join('\n') },
              { type: 'action', status: actionStatus, label: `执行应用：${appName}` },
              { type: 'action', status: actionStatus, label: `生成结果：${resultTitle}` },
            ],
          },
          {
            id: `${record.id || 'app-record'}-bot`,
            role: 'bot',
            text: record.status === 'failed'
              ? `任务当前状态为「${statusText}」。可在右侧查看已上传材料，并回到来源应用重新执行。`
              : record.status === 'parsing' || record.status === 'queued'
                ? `任务当前状态为「${statusText}」。这里展示应用任务的执行过程，完成后可从右侧查看结果与资源。`
                : `任务已完成。产出「${resultTitle}」已沉淀到结果侧，可从任务详情点击结果或资源在右侧查看。`,
          },
        ];
      },
      activeTaskBasicRows() {
        const card = this.activeTaskContextCard;
        const raw = card && card.raw;
        if (!card || !raw) return [];
        const ps = raw.projectSource || {};
        const completed = ['done', 'failed'].includes(card.status)
          ? String(ps.completedAt || ps.failedAt || ps.createdAt || '').trim() || '—'
          : '—';
        const typeLabelMap = {
          batch: '跑批任务',
          'batch-child': '跑批子任务',
          'download-package': '打包下载',
          'generate-skill': '生成技能',
        };
        return [
          { label: '任务名称', value: card.title || '—' },
          { label: '任务类型', value: typeLabelMap[getWorkbenchTaskType(raw)] || '单次任务' },
          { label: '状态', value: card.statusLabel || '—' },
          { label: '创建时间', value: String(ps.createdAt || '').trim() || '—' },
          { label: '完成时间', value: completed },
        ];
      },
      activeTaskBasicStatusClass() {
        const status = String((this.activeTaskContextCard && this.activeTaskContextCard.status) || '');
        const map = { queued: 'is-neutral', parsing: 'is-primary', done: 'is-success', failed: 'is-error' };
        return map[status] || 'is-neutral';
      },
      activeTaskDetailSections() {
        const card = this.activeTaskContextCard;
        const raw = card && card.raw;
        if (!card || !raw) return [];
        const taskType = getWorkbenchTaskType(raw);
        const skillName = stripDemoLabel(getWorkbenchTaskSkillName(raw)) || '—';
        const instruction = getWorkbenchTaskInstruction(raw) || '—';
        const resources = getWorkbenchTaskResources(raw)
          .map((resource) => ({
            label: getWorkbenchTaskResourceLabel(resource),
            resource,
            iconHref: '#notes',
            iconTitle: '引用资源',
            iconToneClass: 'is-result',
          }))
          .filter((row) => row && row.label);
        if (taskType === 'download-package') {
          const meta = raw.packageMeta || (raw.taskConfig && raw.taskConfig.packageMeta) || {};
          const scope = meta.scope || {};
          return [
            card.status === 'done'
              ? {
                key: 'artifact',
                title: '任务产物',
                kind: 'simple-list',
                rows: [{ label: '打包结果已生成，可从任务操作中下载。', iconName: 'download', iconTitle: 'ZIP 文件包' }],
              }
              : { key: 'artifact', title: '任务产物', lines: ['文件包生成中，完成后可下载。'] },
            { key: 'scope', title: '打包范围', lines: [`已选 ${Number(scope.total || 0)} 项 · 结果文件 ${Number(scope.fileCount || 0)} 个 · 文件夹 ${Number(scope.folderCount || 0)} 个`] },
            { key: 'config', title: '打包配置', lines: [`目录结构：${meta.structureMode === 'flat' ? '剔除层级' : '保留层级'}`, `下载格式：${meta.formatMode === 'pdf' ? 'MD 转 PDF' : '保留原始格式'}`, '下载包有效期：30 天'] },
          ];
        }
        if (taskType === 'batch') {
          const meta = raw.batchMeta || {};
          const children = raw.children || [];
          const done = children.filter((child) => String((child && child.status) || '') === 'done').length;
          return [
            { key: 'batch-overview', title: '跑批概览', lines: [`数据源：${meta.fileName || '—'}`, `标识列：${Array.isArray(meta.idColumns) && meta.idColumns.length ? meta.idColumns.join('、') : (meta.idColumn || '—')}`, `子任务：${done}/${children.length}`] },
            { key: 'instruction', title: '任务指令', lines: [instruction] },
            { key: 'skill', title: '使用技能', lines: [skillName] },
          ];
        }
        const resultTitle = taskType === 'generate-skill'
          ? stripDemoLabel((raw.taskConfig && (raw.taskConfig.outputSkillName || raw.taskConfig.generatedSkillName || raw.taskConfig.skillName)) || raw.title || '') || '可复用技能草稿'
          : stripDemoLabel((raw.projectSource && (raw.projectSource.outputTitle || raw.projectSource.name)) || raw.title || '') || '任务输出';
        const sections = [
          {
            key: 'output',
            title: taskType === 'generate-skill' ? '产出技能' : '产出结果',
            kind: 'simple-list',
            rows: [{
              label: `${resultTitle} · ${card.statusLabel || '—'}`,
              iconHref: taskType === 'generate-skill' ? '#book-open' : '#notes',
              iconTitle: taskType === 'generate-skill' ? '产出技能' : '产出结果',
              iconToneClass: taskType === 'generate-skill' ? 'is-md' : 'is-result',
            }],
          },
          { key: 'instruction', title: taskType === 'generate-skill' ? '生成要求' : '任务指令', lines: [instruction] },
          taskType === 'generate-skill'
            ? { key: 'skill', title: '引用上下文', lines: [instruction || '—'] }
            : {
              key: 'skill',
              title: '使用技能',
              kind: 'simple-list',
              rows: [{ label: skillName, iconHref: '#book-open', iconTitle: '技能' }],
            },
        ];
        if (taskType !== 'generate-skill') {
          sections.push(resources.length
            ? { key: 'resources', title: '引用资源', kind: 'simple-list', rows: resources }
            : { key: 'resources', title: '引用资源', lines: ['未配置引用资源'] });
        }
        return sections;
      },
      activeTaskDetailAriaLabel() {
        const taskType = getWorkbenchTaskType(this.activeTaskContextCard && this.activeTaskContextCard.raw);
        if (taskType === 'generate-skill') return '任务详情：产出技能、生成要求与引用上下文';
        if (taskType === 'download-package') return '任务详情：任务产物、打包范围与打包配置';
        return '任务详情：产出结果、使用技能与引用资源';
      },
      activeV2AppRecordDetailSections() {
        const record = this.activeV2AppRecord || {};
        const app = this.activeV2AppRecordApp || {};
        const statusLabel = String(record.statusLabel || this.v2AppUseStatusText || '—').trim() || '—';
        const resultTitle = String(record.resultTitle || '').trim() || '—';
        const skillName = stripDemoLabel(app.skillName || (this.activeV2App && this.activeV2App.skillName)) || app.name || '—';
        const previewFile = String(this.v2AppRecordPreviewFile || '').trim();
        const resultRow = {
          label: `${resultTitle} · ${statusLabel}`,
          iconHref: '#notes',
          iconTitle: '产出结果',
          iconToneClass: 'is-result',
          action: 'preview-result',
          active: !previewFile,
        };
        const resources = this.v2AppRecordSourceFiles(record)
          .map((file) => ({
            label: String(file || '').trim(),
            iconHref: '#notes',
            iconTitle: '引用资源',
            iconToneClass: 'is-result',
            action: 'preview-file',
            active: previewFile === String(file || '').trim(),
          }))
          .filter((row) => row.label);
        const simpleSections = [
          {
            key: 'source-app',
            title: '来源应用',
            kind: 'simple-list',
            rows: [{
              label: app.name || skillName,
              iconparkName: 'application-one',
              iconTitle: '来源应用',
              action: 'open-app',
            }],
          },
          {
            key: 'output',
            title: '产出结果',
            kind: 'simple-list',
            rows: [resultRow],
          },
          resources.length
            ? { key: 'resources', title: '上传材料', kind: 'simple-list', rows: resources }
            : { key: 'resources', title: '上传材料', lines: ['未配置上传材料'] },
        ];
        if (this.isSimpleWorkbenchMode) return simpleSections;
        const sourceAppSection = {
          key: 'source-app',
          title: '来源应用',
          kind: 'simple-list',
          rows: [{
            label: app.name || skillName,
            iconparkName: 'application-one',
            iconTitle: '来源应用',
            action: 'open-app',
          }],
        };
        return [
          sourceAppSection,
          { key: 'instruction', title: '任务指令', lines: ['—'] },
          {
            key: 'skill',
            title: '使用技能',
            kind: 'simple-list',
            rows: [{ label: skillName, iconHref: '#book-open', iconTitle: '技能' }],
          },
          resources.length
            ? { key: 'resources', title: '引用资源', kind: 'simple-list', rows: resources }
            : { key: 'resources', title: '引用资源', lines: ['未配置引用资源'] },
          {
            key: 'output',
            title: '产出结果',
            kind: 'simple-list',
            rows: [resultRow],
          },
        ];
      },
      activeV2AppRecordPreviewTitle() {
        return String(this.v2AppRecordPreviewFile || (this.activeV2AppRecord && this.activeV2AppRecord.resultTitle) || '执行结果').trim();
      },
      activeV2AppRecordPreviewIsResult() {
        return !this.v2AppRecordPreviewFile;
      },
      v2SkillScopeTabs() {
        return V2_SKILL_SCOPE_TABS;
      },
      v2AppScopeTabs() {
        return V2_APP_SCOPE_TABS;
      },
      v2AppPageTitle() {
        if (this.v2AppStage === 'record') return this.activeV2AppRecord.title || '执行记录';
        if (this.v2AppStage === 'config') return this.activeV2App.name;
        if (this.v2AppStage === 'use') return this.activeV2App.name;
        return '应用';
      },
      v2AppPageSubtitle() {
        if (this.v2AppStage === 'use') return '上传材料、生成结果、查看结果和使用记录。';
        return this.isSimpleWorkbenchMode ? '使用审计应用，驱动大模型帮助你完成日常工作。' : '管理和使用当前工作台内的技能应用。';
      },
      v2AppEditorTitle() {
        return this.v2AppEditorMode === 'edit' ? '编辑应用' : '创建应用';
      },
      v2AppEditorSkillOptions() {
        const options = this.v2AppSkillOptions || [];
        const value = String(this.v2AppEditorSourceSkillKey || '').trim();
        if (!value || options.some((item) => item.value === value)) return options;
        const label = String((this.v2AppForm && (this.v2AppForm.skillName || this.v2AppForm.name)) || value).trim();
        return [{ value, label, disabled: true }, ...options];
      },
      v2AppSkillOptions() {
        void this.v2BridgeTick;
        return (this.currentV2WorkbenchSkillRows || []).map((raw) => {
          const id = String((raw && (raw.id || raw.sourceSkillId || raw.name)) || '').trim();
          const card = {
            key: `project:${id || 'unknown'}`,
            raw,
            name: String((raw && raw.name) || '未命名技能').trim() || '未命名技能',
            description: String((raw && (raw.description || raw.summary)) || '暂无摘要').trim() || '暂无摘要',
            auditScene: String((raw && raw.auditScene) || '').trim(),
            skillType: String((raw && raw.skillType) || '').trim(),
          };
          const inputs = resolveV2SkillInputFileNames(raw);
          return {
            value: card.key,
            label: card.name,
            desc: card.description,
            scene: card.auditScene,
            appType: card.skillType,
            inputItems: inputs,
            inputLabel: inputs.length ? inputs.join('、') : '按技能配置读取审计资料',
            outputLabel: resolveV2SkillOutputSummary(raw),
            skillName: card.name,
            skillVersion: this.v2SkillCardVersionLabel(card) || '当前版本',
          };
        });
      },
      v2AppTypeFilterOptions() {
        touchV2SkillDimensionsRevision();
        return getV2SkillSceneFilterOptions();
      },
      v2AppTypeFilterLabel() {
        const current = this.v2AppTypeFilterOptions.find((item) => item.id === this.v2AppTypeFilter);
        return current ? current.label : '全部';
      },
      v2AppSceneOptions() {
        touchV2SkillDimensionsRevision();
        return getV2SkillDimensionRows('auditScene').map((item) => ({ value: item.id, label: item.label }));
      },
      v2AppTypeOptions() {
        touchV2SkillDimensionsRevision();
        return getV2SkillDimensionRows('skillType').map((item) => ({ value: item.id, label: item.label }));
      },
      v2AppSortKey() {
        return `${this.v2AppSortBy}-${this.v2AppSortOrder}`;
      },
      v2AppSortLabel() {
        const key = this.v2AppSortKey;
        if (key === 'time-asc') return '最早优先';
        if (key === 'name-asc') return '名称 A-Z';
        if (key === 'name-desc') return '名称 Z-A';
        return '最新优先';
      },
      v2AppSortActive() {
        return this.v2AppSortBy !== 'time' || this.v2AppSortOrder !== 'desc';
      },
      v2AppBaseCards() {
        void this.v2AppRevision;
        const q = String(this.v2AppSearchQuery || '').trim().toLowerCase();
        return V2_DEMO_APPS.filter((app) => {
          if (!this.v2AppInCurrentScope(app)) return false;
          if (this.v2AppTypeFilter !== 'all' && getV2AppSceneId(app) !== this.v2AppTypeFilter) return false;
          const hay = [
            app.name,
            app.desc,
            v2AppSceneLabelValue(app.scene),
            v2AppTypeLabelValue(app.appType),
            app.skillName,
          ].join(' ').toLowerCase();
          return !q || hay.includes(q);
        });
      },
      v2AppCategoryTabs() {
        touchV2SkillDimensionsRevision();
        return getV2AppCategoryTabs();
      },
      v2AppCards() {
        const cards = (this.v2AppBaseCards || [])
          .filter((app) => matchV2AppCategory(app, this.v2AppCategoryTab));
        return cards.slice().sort((a, b) => {
          const direction = this.v2AppSortOrder === 'asc' ? 1 : -1;
          if (this.v2AppSortBy === 'name') return direction * String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
          return direction * String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
        });
      },
      v2SimpleSidebarAppGroups() {
        void this.v2AppRevision;
        const q = String(this.v2SidebarAppSearchQuery || '').trim().toLowerCase();
        const groups = new Map();
        V2_DEMO_APPS
          .filter((app) => app.status === 'published')
          .filter((app) => !q || String(app.name || '').toLowerCase().includes(q))
          .forEach((app) => {
            const type = v2AppSceneLabelValue(app.scene) || '其他应用';
            if (!groups.has(type)) groups.set(type, []);
            groups.get(type).push(app);
          });
        return Array.from(groups, ([type, apps]) => ({ type, apps }));
      },
      v2RecentSidebarApps() {
        return this.v2AppRowsByIds(this.v2RecentAppIds);
      },
      v2FrequentSidebarApps() {
        return this.v2AppRowsByIds(this.v2FavoriteAppIds);
      },
      v2SidebarExecutionRecords() {
        return (this.v2AppExecutionRecords || []).map((record) => {
          const status = String(record.status || '').trim();
          return {
            ...record,
            timeLabel: status === 'done' ? String(record.sidebarTimeLabel || record.timeLabel || '').trim() : '',
            statusIcon: getTaskStatusIcon(record.status),
          };
        });
      },
      filteredSearchAppRecords() {
        void this.v2AppRevision;
        const q = String(this.v2SearchQuery || '').trim().toLowerCase();
        if (!q) return this.v2SidebarExecutionRecords;
        return this.v2SidebarExecutionRecords.filter((record) => {
          const app = V2_DEMO_APPS.find((item) => item.id === record.appId) || {};
          const hay = [record.title, record.statusLabel, record.summary, record.resultTitle, v2AppSceneLabelValue(app.scene)].join(' ').toLowerCase();
          return hay.includes(q);
        });
      },
      filteredV2AppCards() {
        return this.v2AppCards;
      },
      v2AppUseCountLabel() {
        return (app) => Number((app && app.useCount) || 0).toLocaleString('zh-CN');
      },
      activeV2App() {
        void this.v2AppRevision;
        const hit = V2_DEMO_APPS.find((app) => app.id === this.v2ActiveAppId);
        return hit || V2_DEMO_APPS[0];
      },
      activeV2AppUploadPrompt() {
        const app = this.activeV2App;
        const prompt = String((app && app.uploadPrompt) || '').trim();
        if (prompt) return prompt;
        return this.v2AppDefaultUploadPrompt(this.v2AppInputFileNames(app));
      },
      activeV2AppRecords() {
        return this.v2SidebarExecutionRecords.filter((record) => record.appId === this.activeV2App.id && !record.seeded);
      },
      v2AppCanGenerateResult() {
        const files = this.v2AppUploadFiles || [];
        return this.v2AppUseState !== 'running' && files.length > 0 && !files.some((file) => file.status === 'uploading');
      },
      activeV2AppRecord() {
        const hit = this.v2SidebarExecutionRecords.find((record) => record.id === this.v2ActiveAppRecordId);
        return hit || this.activeV2AppRecords[0] || this.v2SidebarExecutionRecords[0] || {};
      },
      activeV2AppRecordApp() {
        const record = this.activeV2AppRecord || {};
        return V2_DEMO_APPS.find((app) => app.id === record.appId) || this.activeV2App || {};
      },
      v2AppUseStatusText() {
        if (this.v2AppUseState === 'empty') return '待上传';
        if (this.v2AppUseState === 'running') return '执行中';
        if (this.v2AppUseState === 'failed') return '失败';
        return '成功';
      },
      v2AppUseStatusClass() {
        if (this.v2AppUseState === 'running') return 'is-parsing';
        if (this.v2AppUseState === 'failed') return 'is-failed';
        if (this.v2AppUseState === 'empty') return 'is-queued';
        return 'is-done';
      },
      v2AppResultSummary() {
        if (this.v2AppUseState === 'empty') return '上传材料并点击执行后，系统会自动创建当前工作台任务。';
        if (this.v2AppUseState === 'running') return '正在解析材料并调用绑定技能，完成后结果会写入当前工作台结果树。';
        if (this.v2AppUseState === 'failed') return '执行失败，请检查上传材料后重新执行。';
        return '已识别 3 条合同变更链路、2 条金额差异线索，建议进入结果详情复核。';
      },
      v2AuditSceneCategoryLabel() {
        touchV2SkillDimensionsRevision();
        return getV2SkillCategoryLabel('auditScene', '业务场景');
      },
      v2SkillTypeCategoryLabel() {
        touchV2SkillDimensionsRevision();
        return getV2SkillCategoryLabel('skillType', '技能类型');
      },
      v2SkillTypeFilterOptions() {
        touchV2SkillDimensionsRevision();
        return getV2SkillSceneFilterOptions();
      },
      v2SkillTypeFilterLabel() {
        touchV2SkillDimensionsRevision();
        const current = getV2SkillSceneFilterOptions().find((item) => item.id === (this.v2SkillTypeFilter || 'all'));
        return current ? current.label : '全部';
      },
      v2SkillFilterVisible() {
        touchV2SkillDimensionsRevision();
        return getV2SkillDimensionRows('auditScene').length > 0;
      },
      v2SkillSortInstallVisible() {
        return this.v2SkillScopeTab === 'org' || this.v2SkillScopeTab === 'market';
      },
      v2SkillSortKey() {
        return `${this.v2SkillSortBy}-${this.v2SkillSortOrder}`;
      },
      v2SkillSortLabel() {
        const key = this.v2SkillSortKey;
        if (key === 'time-asc') return '最早优先';
        if (key === 'install-desc') return '添加次数高';
        if (key === 'install-asc') return '添加次数低';
        return '最新优先';
      },
      v2SkillSortActive() {
        return this.v2SkillSortBy !== 'time' || this.v2SkillSortOrder !== 'desc';
      },
      v2SkillTabCounts() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
        const fromHost = host && Array.isArray(host.workbenchProjectTemplates)
          ? host.workbenchProjectTemplates
          : [];
        const fallbackMap = (window.DemoData && window.DemoData.projectAnalysisTemplatesByProject) || {};
        const fallbackRows = Array.isArray(fallbackMap[this.projectId]) ? fallbackMap[this.projectId] : [];
        const publicRows = getV2RuntimePublicSkillRows();
        const sharedRows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        const sharedSourceIds = new Set(sharedRows.map((item) => getV2SkillSourceId(item)).filter(Boolean));
        const publicOrgRows = publicRows.filter((raw) => !isV2MarketSkill(raw) && !sharedSourceIds.has(getV2SkillSourceId(raw)));
        return {
          workbench: fromHost.length ? fromHost.length : fallbackRows.length,
          org: publicOrgRows.length + sharedRows.length,
          market: publicRows.filter((raw) => isV2MarketSkill(raw)).length,
        };
      },
      currentV2WorkbenchSkillRows() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
        const fromHost = host && Array.isArray(host.workbenchProjectTemplates)
          ? host.workbenchProjectTemplates
          : [];
        const fallbackMap = (window.DemoData && window.DemoData.projectAnalysisTemplatesByProject) || {};
        const fallbackRows = Array.isArray(fallbackMap[this.projectId]) ? fallbackMap[this.projectId] : [];
        return fromHost.length ? fromHost : fallbackRows;
      },
      v2OtherWorkbenchSkillCards() {
        void this.v2BridgeTick;
        const map = typeof demoProjectAnalysisTemplatesById !== 'undefined' ? demoProjectAnalysisTemplatesById : {};
        const optionsById = new Map(readStoredV2WorkbenchProjectOptions().map((row) => [row.id, row]));
        const q = String(this.v2OtherWorkbenchSkillSearch || '').trim().toLowerCase();
        const rows = [];
        Object.keys(map || {}).forEach((pid) => {
          if (String(pid) === String(this.projectId)) return;
          const project = optionsById.get(pid) || { id: pid, name: getProjectTitle(pid) };
          (Array.isArray(map[pid]) ? map[pid] : []).forEach((raw) => {
            if (!raw) return;
            const name = String(raw.name || '未命名技能').trim() || '未命名技能';
            const projectName = String(project.name || getProjectTitle(pid)).trim() || getProjectTitle(pid);
            const description = String(raw.description || '暂无简介').trim() || '暂无简介';
            const haystack = [name, description, projectName].join(' ').toLowerCase();
            if (q && !haystack.includes(q)) return;
            rows.push({
              key: `${pid}:${raw.id || name}`,
              projectId: pid,
              projectName,
              raw,
              name,
              description,
              added: this.isV2SkillAlreadyAdded(raw),
            });
          });
        });
        return rows;
      },
      v2SkillCategoryTabs() {
        touchV2SkillDimensionsRevision();
        const baseCards = this.v2SkillBaseCards || [];
        return getV2SkillCategoryTabs().map((item) => ({
          ...item,
          count: baseCards.filter((card) => matchV2SkillCategory(card, item.id)).length,
        }));
      },
      v2SkillCtaLabel() {
        return this.v2SkillScopeTab === 'workbench' ? '使用' : '添加';
      },
      v2SkillEmptyText() {
        touchV2SkillDimensionsRevision();
        const q = String(this.v2SkillSearchQuery || '').trim();
        if (q) return '未找到匹配的技能';
        const baseCards = this.v2SkillBaseCards || [];
        if (this.v2SkillTypeFilter !== 'all') return '当前' + this.v2AuditSceneCategoryLabel + '下暂无技能';
        if (!baseCards.length) {
          if (this.v2SkillScopeTab === 'workbench') return '暂无当前工作台技能';
          if (this.v2SkillScopeTab === 'org') return '暂无公共技能';
          return '暂无技能市场内容';
        }
        return '当前' + this.v2SkillTypeCategoryLabel + '下暂无技能';
      },
      v2SkillBaseCards() {
        void this.v2BridgeTick;
        const q = String(this.v2SkillSearchQuery || '').trim().toLowerCase();
        let rows = [];
        if (this.v2SkillScopeTab === 'workbench') {
          rows = this.currentV2WorkbenchSkillRows;
        } else {
          const publicRows = getV2RuntimePublicSkillRows();
          const sharedRows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
          const sharedSourceIds = new Set(sharedRows.map((item) => getV2SkillSourceId(item)).filter(Boolean));
          rows = this.v2SkillScopeTab === 'org'
            ? [
                ...sharedRows,
                ...publicRows.filter((raw) => !isV2MarketSkill(raw) && !sharedSourceIds.has(getV2SkillSourceId(raw))),
              ]
            : publicRows.filter((raw) => isV2MarketSkill(raw));
        }
        return rows
          .map((raw) => {
            const id = String((raw && raw.id) || '').trim();
            const scope = this.v2SkillScopeTab === 'workbench' ? 'project' : 'public';
            const node = {
              source: this.v2SkillScopeTab === 'workbench' ? 'template' : 'library',
              id,
              key: `${scope}:${id || 'unknown'}`,
              scope,
              raw,
            };
            const rawTags = Array.isArray(raw.tags)
              ? raw.tags
              : (raw.tags && typeof raw.tags === 'object' ? Object.values(raw.tags) : []);
            const tags = rawTags.map((tag) => String(tag || '').trim()).filter(Boolean);
            return {
              key: node.key,
              node,
              raw,
              name: String(raw.name || '未命名技能').trim() || '未命名技能',
              description: String(raw.description || raw.summary || '暂无摘要').trim() || '暂无摘要',
              creator: getV2SkillCreatorLabel(raw, this.v2SkillScopeTab),
              installCount: getV2SkillInstallCount(raw),
              updatedAtLabel: getV2SkillUpdatedAtLabel(raw),
              auditScene: String(raw.auditScene || '').trim(),
              skillType: String(raw.skillType || '').trim(),
              sourceLabel: String(raw.sourceLabel || raw.sourceVersionLabel || (this.v2SkillScopeTab === 'workbench' ? '当前工作台' : (isV2MarketSkill(raw) ? '技能市场' : '共享技能'))).trim(),
              tags,
              recommended: this.v2SkillScopeTab === 'org' && isV2RecommendedPublicSkill(raw),
            };
          })
          .filter((card) => {
            if (!q) return true;
            const hay = [card.name, card.description, ...(card.tags || [])].join(' ').toLowerCase();
            return hay.includes(q);
          })
          .filter((card) => {
            if (this.v2SkillTypeFilter === 'all') return true;
            return matchV2SkillTypeFilter(card, this.v2SkillTypeFilter);
          });
      },
      v2SkillCards() {
        touchV2SkillDimensionsRevision();
        const cards = (this.v2SkillBaseCards || [])
          .filter((card) => matchV2SkillCategory(card, this.v2SkillCategoryTab));
        const sorted = sortV2SkillCards(cards, this.v2SkillSortBy, this.v2SkillSortOrder);
        if (this.v2SkillScopeTab !== 'org') return sorted;
        return sorted.slice().sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));
      },
      hasV2SearchQuery() {
        return !!String(this.v2SearchQuery || '').trim();
      },
      filteredSearchConversations() {
        const q = String(this.v2SearchQuery || '').trim().toLowerCase();
        if (!q) return this.historyConversations || [];
        return (this.historyConversations || []).filter((item) => String((item && item.title) || '').toLowerCase().includes(q));
      },
      filteredSearchTasks() {
        const q = String(this.v2SearchQuery || '').trim().toLowerCase();
        if (!q) return this.taskCards || [];
        return (this.taskCards || []).filter((item) => {
          const hay = [item.title, item.statusLabel, item.sourceSkillName].join(' ').toLowerCase();
          return hay.includes(q);
        });
      },
      activeConversationTitle() {
        if (!this.activeConversationId && this.draftConversationTitle) return this.draftConversationTitle;
        const hit = (this.historyConversations || []).find((item) => item && item.id === this.activeConversationId);
        return hit && hit.title ? hit.title : this.projectTitle;
      },
      activeMainTitle() {
        if (this.activeMainView === 'search') return '搜索';
        if (this.activeMainView === 'skill') return '技能';
        if (this.activeMainView === 'app' && (this.v2AppStage === 'config' || this.v2AppStage === 'use' || this.v2AppStage === 'record')) {
          return this.v2AppPageTitle;
        }
        if (this.activeMainView === 'task') {
          const hit = this.activeTaskContextCard || this.activeTaskCard;
          return (hit && hit.title) || '任务';
        }
        return this.activeConversationTitle;
      },
      showWorkbenchMainHeader() {
        if (this.activeMainView === 'skill' || this.activeMainView === 'search') return false;
        if (this.activeMainView === 'app' && this.v2AppStage === 'list') return false;
        if (!this.isExpertWorkbenchMode) {
          return this.activeMainView === 'app' && (this.v2AppStage === 'config' || this.v2AppStage === 'use' || this.v2AppStage === 'record');
        }
        return true;
      },
      showAppPageSkillHeader() {
        if (this.activeMainView !== 'app') return false;
        if (this.v2AppStage === 'config' || this.v2AppStage === 'use' || this.v2AppStage === 'record') return false;
        return true;
      },
      showTaskDetailToggle() {
        return this.activeMainView === 'task' && !!this.activeTaskContextCard && (!this.activeTaskIsBatch || !!this.activeBatchChildCard);
      },
      showAppHistoryToggle() {
        return this.activeMainView === 'app' && this.v2AppStage === 'use';
      },
      showAppRecordDetailToggle() {
        return this.activeMainView === 'app' && this.v2AppStage === 'record';
      },
      showAppFloatingDetailToggle() {
        return this.showAppHistoryToggle || this.showAppRecordDetailToggle;
      },
      appFloatingDetailVisible() {
        if (this.v2AppStage === 'record') return this.v2AppRecordDetailVisible;
        if (this.v2AppStage === 'use') return this.v2AppHistoryVisible;
        return false;
      },
      appFloatingDetailToggleTitle() {
        if (this.v2AppStage === 'record') {
          return this.v2AppRecordDetailVisible ? '隐藏任务详情' : '显示任务详情';
        }
        return this.v2AppHistoryVisible ? '隐藏执行记录' : '显示执行记录';
      },
      appFloatingDetailButtonLabel() {
        return this.v2AppStage === 'use' ? '执行记录' : '任务详情';
      },
      showAppHistoryPanel() {
        return this.showAppHistoryToggle && this.v2AppHistoryVisible;
      },
      showAppRecordDetailPanel() {
        return this.showAppRecordDetailToggle && this.v2AppRecordDetailVisible;
      },
    },
    methods: {
      workbenchTourTarget(id) {
        const root = this.$el && typeof this.$el.querySelector === 'function' ? this.$el : document;
        const doc = typeof document !== 'undefined' ? document : root;
        const queryTourTarget = (selector) => root.querySelector(selector) || (doc !== root ? doc.querySelector(selector) : null);
        const shell = queryTourTarget('[data-tour-id="workbench-shell"]') || queryTourTarget('.workbench-v2-shell') || this.$el;
        const fallback = queryTourTarget('[data-tour-id="workbench-main"]') || shell;
        const target = id ? queryTourTarget(`[data-tour-id="${id}"]`) : shell;
        if (!target || typeof target.getBoundingClientRect !== 'function') return fallback || null;
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return fallback || null;
        return target;
      },
      workbenchTourVisibleDomTarget(selector) {
        const target = document.querySelector(selector);
        if (!target || typeof target.getBoundingClientRect !== 'function') return null;
        const rect = target.getBoundingClientRect();
        return rect.width && rect.height ? target : null;
      },
      workbenchTourFirstPublicSkillCard() {
        if (this.activeMainView !== 'skill' || this.v2SkillScopeTab !== 'org') return null;
        const cards = this.v2SkillCards || [];
        return cards.find((card) => !this.v2SkillCardAlreadyAdded(card)) || cards[0] || null;
      },
      workbenchTourIsFirstPublicSkillCard(card) {
        const target = this.workbenchTourFirstPublicSkillCard();
        return !!(card && target && String(card.key || '') === String(target.key || ''));
      },
      workbenchTourPublicSkillActionTourId(card) {
        return this.workbenchTourIsFirstPublicSkillCard(card) ? 'workbench-public-skill-action' : null;
      },
      workbenchTourPublicSkillAddUseTourId(card) {
        return this.workbenchTourIsFirstPublicSkillCard(card) ? 'workbench-public-skill-add-use' : null;
      },
      workbenchTourPublicSkillDropdownProps(card) {
        const shouldOpen = this.tourOpen
          && this.tourGuideKind === 'skill'
          && this.workbenchTourCurrentStepKey === 'skill-select'
          && this.workbenchTourIsFirstPublicSkillCard(card)
          && !this.v2SkillCardAlreadyAdded(card);
        return shouldOpen ? { open: true } : {};
      },
      workbenchTourAssistantTarget() {
        const frame = this.workbenchTourTarget('workbench-assistant-frame');
        const main = this.workbenchTourTarget('workbench-main');
        if (frame && frame !== main) return frame;
        const stage = this.workbenchTourTarget('workbench-assistant-stage');
        if (stage && stage !== main) return stage;
        return this.workbenchTourTarget('workbench-chat-composer');
      },
      workbenchTourFinalTarget() {
        return this.workbenchTourTarget('workbench-chat-composer');
      },
      workbenchTourHelpTarget() {
        return this.workbenchTourTarget('workbench-help-button');
      },
      workbenchTourPrevButtonProps() {
        return { children: '上一步' };
      },
      workbenchTourNextButtonProps(label = '下一步') {
        return { children: label };
      },
      workbenchTourHiddenNextButtonProps() {
        return { style: { display: 'none' } };
      },
      workbenchTourSkillInputDescription() {
        const names = this.v2SkillCardInputFileNames(this.tourSelectedSkillCard);
        const tags = names.length ? names : ['按技能配置读取审计资料'];
        if (typeof createVNode !== 'function') return tags.join('、');
        return createVNode('div', { class: 'workbench-v2-tour-skill-inputs' }, tags.map((name) => createVNode('span',
          {
            class: 'workbench-v2-tour-skill-inputs__tag',
            title: name,
          },
          name)));
      },
      emptyWorkbenchTourSteps() {
        const prevButtonProps = this.workbenchTourPrevButtonProps();
        if (this.tourGuideKind === 'skill') {
          return [
            {
              tourStepKey: 'skill-nav',
              title: '点击“技能”',
              target: () => this.workbenchTourTarget('workbench-sidebar-skill-button'),
              placement: 'right',
            },
            {
              tourStepKey: 'skill-select',
              title: '选择一个技能，并点击“添加并使用”',
              target: () => this.workbenchTourTarget('workbench-public-skill-list'),
              placement: 'top',
            },
            {
              tourStepKey: 'skill-upload',
              title: '根据技能要求上传材料',
              description: this.workbenchTourSkillInputDescription(),
              target: () => this.workbenchTourTarget('chat-upload-attachment-button'),
              placement: 'top',
            },
            {
              tourStepKey: 'skill-send',
              title: '点击“发送”',
              target: () => this.workbenchTourTarget('chat-send-button'),
              placement: 'top',
            },
            {
              tourStepKey: 'skill-complete',
              title: '恭喜你，完成一次技能使用！',
              description: 'AI将根据技能里编写的规则，针对上传材料进行分析处理',
              target: () => this.workbenchTourAssistantTarget(),
              placement: 'left',
            },
          ];
        }
        if (this.tourGuideKind === 'task') {
          return [
            {
              tourStepKey: 'task',
              title: '创建核查任务',
              target: () => this.workbenchTourTarget('workbench-task-create-button'),
              placement: 'right',
              nextButtonProps: this.workbenchTourNextButtonProps(),
            },
            {
              tourStepKey: 'task',
              title: '查看任务进展',
              target: () => this.workbenchTourTarget('workbench-task-list'),
              placement: 'right',
              prevButtonProps,
              nextButtonProps: this.workbenchTourNextButtonProps('完成'),
            },
          ];
        }
        return [
          {
            tourStepKey: 'upload',
            title: '上传要修改的材料',
            target: () => this.workbenchTourTarget('chat-upload-attachment-button'),
            placement: 'top',
          },
          {
            tourStepKey: 'send',
            title: '先输入修改要求，然后点击“发送”',
            target: () => this.workbenchTourTarget('workbench-chat-composer'),
            placement: 'top',
          },
          {
            tourStepKey: 'complete',
            title: '恭喜你，完成一次对话！',
            description: '后续可在右侧资源区查看上传的文件和产出的结果。',
            target: () => this.workbenchTourAssistantTarget(),
            placement: 'left',
          },
        ];
      },
      workbenchTourIndicatorItems(total) {
        const count = Math.max(0, Number(total) || 0);
        return Array.from({ length: count }, (_, index) => index);
      },
      workbenchTourIsCompleteStep(current = this.tourCurrent) {
        return this.workbenchTourIsBasicCompleteStep(current) || this.workbenchTourIsSkillCompleteStep(current);
      },
      workbenchTourIsBasicCompleteStep(current = this.tourCurrent) {
        const step = (this.workbenchTourRawSteps || [])[Number(current) || 0] || {};
        return this.tourGuideKind === 'basic' && step.tourStepKey === 'complete';
      },
      workbenchTourIsSkillCompleteStep(current = this.tourCurrent) {
        const step = (this.workbenchTourRawSteps || [])[Number(current) || 0] || {};
        return this.tourGuideKind === 'skill' && step.tourStepKey === 'skill-complete';
      },
      workbenchTourSkipLabel(current) {
        const step = (this.workbenchTourRawSteps || [])[Number(current) || 0] || {};
        return step.tourStepKey === 'learn-more' ? '暂不学习' : '跳过引导';
      },
      openWorkbenchHelpMenu() {
        this.v2HelpCoachOpen = false;
        this.v2HelpHintVisible = false;
        this.v2HelpPopoverOpen = true;
        this.focusWorkbenchHelpButton();
      },
      finishWorkbenchBasicTourToHelp() {
        this.tourOpen = false;
        this.returnToChatAndHintHelp();
      },
      advanceWorkbenchBasicTour(action) {
        this.advanceWorkbenchActionTour(action);
      },
      advanceWorkbenchActionTour(action) {
        if (!this.tourOpen) return;
        const expectedByKind = {
          basic: { upload: 'upload', send: 'send' },
          skill: { nav: 'skill-nav', use: 'skill-select', upload: 'skill-upload', send: 'skill-send' },
        };
        const expected = expectedByKind[this.tourGuideKind] && expectedByKind[this.tourGuideKind][action];
        if (!expected || this.workbenchTourCurrentStepKey !== expected) return;
        const steps = this.workbenchTourRawSteps || [];
        const nextIndex = Math.min(steps.length - 1, Number(this.tourCurrent || 0) + 1);
        if (nextIndex === this.tourCurrent) return;
        this.tourCurrent = nextIndex;
        this.tourRenderKey += 1;
      },
      workbenchBasicHasReadyUpload() {
        const host = resolveCapabilityHost(this);
        return !!(host && (host.chatUploadAttachments || []).some((item) => item && String(item.status || '') === 'ready'));
      },
      prepareWorkbenchGuide(kind) {
        if (kind === 'skill') {
          this.activeMainView = 'chat';
          return;
        }
        this.activeMainView = 'chat';
        if (kind === 'task') this.v2SidebarTasksExpanded = true;
      },
      prepareWorkbenchPublicSkillTourList() {
        this.activeMainView = 'skill';
        this.v2SkillScopeTab = 'org';
        this.v2SkillSearchQuery = '';
        this.v2SkillCategoryTab = 'all';
        this.v2SkillTypeFilter = 'all';
      },
      refreshWorkbenchTourPosition() {
        this.$nextTick(() => {
          if (this.tourOpen) this.tourRenderKey += 1;
        });
      },
      prepareWorkbenchTourStep() {
        if (this.tourSkipAutoPrepareOnce) {
          this.tourSkipAutoPrepareOnce = false;
          return;
        }
        if (this.tourGuideKind === 'basic') {
          const key = this.workbenchTourCurrentStepKey;
          if (key === 'upload' && this.workbenchBasicHasReadyUpload()) {
            this.advanceWorkbenchBasicTour('upload');
            return;
          }
          if (key === 'send') {
            const host = resolveCapabilityHost(this);
            if (host && typeof host.focusChatInput === 'function') host.focusChatInput();
          }
          return;
        }
        if (this.tourGuideKind !== 'skill') return;
        const key = this.workbenchTourCurrentStepKey;
        if (key === 'skill-nav') {
          this.activeMainView = 'chat';
          this.refreshWorkbenchTourPosition();
        } else if (key === 'skill-select') {
          this.prepareWorkbenchPublicSkillTourList();
          this.refreshWorkbenchTourPosition();
        } else if (key === 'skill-upload' || key === 'skill-send') {
          this.activeMainView = 'chat';
          this.refreshWorkbenchTourPosition();
        }
      },
      openWorkbenchTour(isAuto = false, kind = 'basic') {
        const nextKind = ['basic', 'skill', 'task'].includes(kind) ? kind : 'basic';
        this.tourLaunchMode = isAuto ? 'auto' : 'manual';
        this.tourGuideKind = nextKind;
        this.tourIncludeIntro = false;
        this.tourCurrent = 0;
        this.tourRenderKey += 1;
        this.tourSelectedSkillCard = null;
        this.v2HelpPopoverOpen = false;
        this.v2HelpCoachOpen = false;
        this.v2HelpHintVisible = false;
        this.prepareWorkbenchGuide(nextKind);
        this.$nextTick(() => {
          this.prepareWorkbenchTourStep();
          this.$nextTick(() => { this.tourOpen = true; });
        });
        if (isAuto) this.tourAutoShown = true;
      },
      closeWorkbenchTour() {
        if (this.tourSuppressCloseHint) {
          this.tourSuppressCloseHint = false;
          return;
        }
        this.tourOpen = false;
        this.returnToChatAndHintHelp();
      },
      finishWorkbenchTour() {
        if (this.tourGuideKind === 'basic' && this.workbenchTourCurrentStepKey === 'complete') {
          this.endWorkbenchTour();
          return;
        }
        if (this.tourGuideKind === 'basic' && this.workbenchTourCurrentStepKey === 'learn-more') {
          this.tourOpen = false;
          this.$nextTick(() => this.openWorkbenchTour(false, 'skill'));
          return;
        }
        if (this.tourGuideKind === 'skill') {
          this.tourOpen = false;
          this.activeMainView = 'chat';
          this.tourSkillCompleted = true;
          this.$nextTick(() => this.openWorkbenchHelpMenu());
          return;
        }
        this.tourOpen = false;
      },
      skipWorkbenchTour() {
        if (this.tourGuideKind === 'basic' && this.workbenchTourCurrentStepKey === 'complete') {
          this.endWorkbenchTour();
          return;
        }
        this.tourOpen = false;
        this.returnToChatAndHintHelp();
      },
      restartWorkbenchBasicTour() {
        if (this.tourGuideKind !== 'basic') return;
        this.tourSkipAutoPrepareOnce = true;
        this.tourCurrent = 0;
        this.tourRenderKey += 1;
      },
      endWorkbenchTour() {
        if (this.tourGuideKind === 'skill') {
          this.tourOpen = false;
          this.activeMainView = 'chat';
          this.tourSkillCompleted = true;
          this.$nextTick(() => this.openWorkbenchHelpMenu());
          return;
        }
        this.finishWorkbenchBasicTourToHelp();
      },
      startWorkbenchGuide(kind) {
        this.openWorkbenchTour(false, kind || 'basic');
      },
      chooseWorkbenchTourGuide(kind) {
        this.tourOpen = false;
        this.$nextTick(() => this.openWorkbenchTour(false, kind || 'skill'));
      },
      onWorkbenchHelpOpenChange(open) {
        this.v2HelpPopoverOpen = !!open;
        if (!open) this.v2HelpCoachOpen = false;
        if (open) this.v2HelpHintVisible = false;
      },
      onWorkbenchHelpCoachOpenChange(open) {
        if (open) return;
        this.finishWorkbenchHelpCoach();
      },
      finishWorkbenchHelpCoach() {
        this.v2HelpCoachOpen = false;
        this.v2HelpPopoverOpen = false;
        this.v2HelpHintVisible = false;
      },
      focusWorkbenchHelpButton() {
        this.$nextTick(() => {
          const btn = this.$refs.workbenchHelpButton;
          if (btn && typeof btn.focus === 'function') btn.focus();
        });
      },
      returnToChatAndHintHelp() {
        this.activeMainView = 'chat';
        this.v2HelpHintVisible = false;
        this.v2HelpPopoverOpen = false;
        this.v2HelpCoachOpen = false;
        if (this._v2HelpHintTimer) window.clearTimeout(this._v2HelpHintTimer);
        this._v2HelpHintTimer = null;
        this.$nextTick(() => {
          this.focusWorkbenchHelpButton();
          this.v2HelpCoachOpen = true;
        });
      },
      scheduleWorkbenchTourAutoOpen() {
        if (!this.isExpertWorkbenchMode) return;
        if (!this.isEmptyWorkbenchProject) return;
        if (this.tourAutoShown) return;
        if (this._workbenchTourTimer) window.clearTimeout(this._workbenchTourTimer);
        this._workbenchTourTimer = window.setTimeout(() => {
          this._workbenchTourTimer = null;
          this.openWorkbenchTour(true, 'basic');
        }, 180);
      },
      setMainView(view) {
        if (!this.workbenchMode) return;
        const next = String(view || 'chat');
        const allowed = this.isSimpleWorkbenchMode ? ['search', 'app'] : ['search', 'skill', 'app', 'chat', 'task'];
        if (!allowed.includes(next)) return;
        this.activeMainView = next;
        if (next === 'skill') this.advanceWorkbenchActionTour('nav');
        if (next === 'app') {
          this.v2AppStage = 'list';
          if (!V2_APP_SCOPE_TABS.some((item) => item.id === this.v2AppScopeTab)) {
            this.v2AppScopeTab = 'team';
          }
        }
        this.$nextTick(() => {
          this.syncRightDrawerFromHost();
          this.v2BridgeTick += 1;
        });
      },
      isV2SidebarMainViewActive(view) {
        const target = String(view || '');
        if (this.isSimpleWorkbenchMode && target === 'app' && this.v2AppStage === 'use') return false;
        return this.activeMainView === target;
      },
      collapseSidebar() {
        this.sidebarCollapsed = true;
      },
      expandSidebar() {
        this.sidebarCollapsed = false;
      },
      handleBrandMarkClick() {
        if (this.sidebarCollapsed) {
          this.expandSidebar();
          return;
        }
        this.$emit('navigate', 'project');
      },
      selectWorkbenchMode(mode) {
        const next = mode === 'simple' ? 'simple' : 'expert';
        const shouldShowGuide = this.isEmptyWorkbenchProject;
        const wasInApp = this.activeMainView === 'app';
        const previousAppStage = this.v2AppStage;
        this.workbenchMode = next;
        this.v2ModeGateOpen = false;
        this.activeMainView = wasInApp ? 'app' : (next === 'simple' ? 'app' : 'chat');
        if (next === 'simple') {
          if (!V2_APP_SCOPE_TABS.some((item) => item.id === this.v2AppScopeTab)) this.v2AppScopeTab = 'team';
        }
        if (next === 'expert' && !V2_APP_SCOPE_TABS.some((item) => item.id === this.v2AppScopeTab)) this.v2AppScopeTab = 'mine';
        if (wasInApp && next === 'simple' && previousAppStage === 'config') {
          this.openV2AppUse(this.activeV2App);
        }
        this.tourOpen = false;
        this.v2HelpPopoverOpen = false;
        this.v2HelpCoachOpen = false;
        this.v2HelpHintVisible = false;
        this.v2DocWorkspaceCollapsed = next !== 'expert';
        if (next === 'expert' && shouldShowGuide) {
          this.v2ExpertGuidePromptVisible = true;
          this.$nextTick(() => {
            this.syncRightDrawerFromHost();
            this.v2BridgeTick += 1;
          });
        } else {
          this.v2ExpertGuidePromptVisible = false;
        }
      },
      setV2AppScopeTab(tab) {
        const next = String(tab || '').trim();
        if (!V2_APP_SCOPE_TABS.some((item) => item.id === next)) return;
        this.v2AppScopeTab = next;
        this.v2AppTypeFilter = 'all';
        this.v2AppCategoryTab = 'all';
      },
      setV2AppCategoryTab(tab) {
        const next = String(tab || '').trim();
        if (!getV2AppCategoryTabs(this.v2AppBaseCards).some((item) => item.id === next)) return;
        this.v2AppCategoryTab = next;
      },
      v2AppInCurrentScope(app) {
        if (!app) return false;
        const owner = String((app && app.owner) || '').trim();
        if (this.v2AppScopeTab === 'team') {
          return app.status === 'published' && owner !== '我';
        }
        return owner === '我';
      },
      onV2AppTypeFilter({ key }) {
        const next = String(key || 'all').trim() || 'all';
        if (!this.v2AppTypeFilterOptions.some((item) => item.id === next)) return;
        this.v2AppTypeFilter = next;
      },
      onV2AppSort({ key }) {
        const text = String(key || '').trim();
        const splitAt = text.lastIndexOf('-');
        if (splitAt <= 0) return;
        const field = text.slice(0, splitAt);
        const order = text.slice(splitAt + 1);
        if (field !== 'time' && field !== 'name') return;
        this.v2AppSortBy = field;
        this.v2AppSortOrder = order === 'asc' ? 'asc' : 'desc';
      },
      v2AppRowsByIds(ids) {
        return (ids || [])
          .map((id) => V2_DEMO_APPS.find((app) => app.id === id))
          .filter(Boolean);
      },
      v2AppEditable(app) {
        return this.isExpertWorkbenchMode && app && String(app.owner || '').trim() === '我';
      },
      v2AppCardIsShared(app) {
        return app && app.status === 'published';
      },
      v2AppCardHasCornerTag(app) {
        return this.v2AppScopeTab === 'mine' && this.v2AppCardIsShared(app);
      },
      v2AppCardShareMenuLabel(app) {
        return this.v2AppCardIsShared(app) ? '取消公开' : '公开';
      },
      v2AppIsFavorite(app) {
        return !!(app && app.id && (this.v2FavoriteAppIds || []).includes(app.id));
      },
      v2AppFavoriteMenuLabel(app) {
        return this.v2AppIsFavorite(app) ? '取消收藏' : '收藏';
      },
      toggleV2AppFavorite(app) {
        if (!app || !app.id) return;
        const exists = this.v2AppIsFavorite(app);
        this.v2FavoriteAppIds = exists
          ? (this.v2FavoriteAppIds || []).filter((id) => id !== app.id)
          : [app.id, ...(this.v2FavoriteAppIds || [])];
        if (typeof message !== 'undefined' && message.success) {
          message.success(exists ? '已取消收藏' : '已收藏');
        }
      },
      touchV2RecentApp(app) {
        if (!app || !app.id) return;
        this.v2RecentAppIds = [app.id, ...this.v2RecentAppIds.filter((id) => id !== app.id)].slice(0, 5);
      },
      v2AppSceneLabel(value) {
        return v2AppSceneLabelValue(value);
      },
      v2AppTypeLabel(value) {
        return v2AppTypeLabelValue(value);
      },
	      v2AppInputFileNames(app) {
	        return splitV2AppInputLabel(app && app.inputLabel);
	      },
	      v2AppFormInputItems() {
	        const form = this.v2AppForm || {};
	        return Array.isArray(form.inputItems)
	          ? form.inputItems.map((item) => String(item || '').trim()).filter(Boolean)
	          : splitV2AppInputLabel(form.inputLabel);
	      },
	      normalizeV2AppExampleFiles(value) {
	        if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
	        const text = String(value || '').trim();
	        return text ? [text] : [];
	      },
	      v2AppDefaultUploadPrompt(items) {
	        const names = Array.isArray(items) ? items.map((item) => String(item || '').trim()).filter(Boolean) : [];
	        return names.length ? `请上传${names.join('、')}` : '请上传应用所需材料';
	      },
	      uniqueV2AppExampleFileName(files, baseName) {
	        const existing = new Set(this.normalizeV2AppExampleFiles(files));
	        const base = String(baseName || '示例文件.pdf').trim() || '示例文件.pdf';
	        if (!existing.has(base)) return base;
	        const match = base.match(/^(.*?)(\.[^.]+)?$/);
	        const stem = (match && match[1]) || base;
	        const ext = (match && match[2]) || '';
	        let index = 2;
	        let next = `${stem}-${index}${ext}`;
	        while (existing.has(next)) {
	          index += 1;
	          next = `${stem}-${index}${ext}`;
	        }
	        return next;
	      },
	      v2AppDefaultExampleFileName(label, type) {
	        const text = String(label || '').trim() || (type === 'output' ? '产出结果' : '上传材料');
	        if (type === 'output') return /\.md$/i.test(text) ? text : `${text}.md`;
	        if (/\.(pdf|docx?|xlsx?|csv|md|txt|json|xml|png|jpe?g)$/i.test(text)) return text;
	        return `${text}.${/台账|记录|表|清单/.test(text) ? 'xlsx' : 'pdf'}`;
	      },
	      v2AppConfigInputExampleFile(item) {
	        const key = String(item || '').trim();
        if (!key) return '';
        return String(((this.v2AppForm && this.v2AppForm.inputExamples) || {})[key] || '').trim();
      },
      openV2AppLibraryForFavorite() {
        this.v2AppStage = 'list';
        this.activeMainView = 'app';
      },
	      fillV2AppFormFromSource(source) {
	        const app = source || {};
	        const inputItems = splitV2AppInputLabel(app.inputLabel);
	        const inputExamples = { ...((app && app.inputExamples) || {}) };
	        const legacyInputFiles = this.normalizeV2AppExampleFiles(Object.values(inputExamples));
	        const uploadExampleFiles = this.normalizeV2AppExampleFiles(app.uploadExampleFiles);
	        const outputExampleFiles = this.normalizeV2AppExampleFiles(app.outputExampleFiles);
	        this.v2AppForm = {
	          kind: app.kind === 'external' ? 'external' : 'skill',
	          name: String(app.name || '').trim(),
	          desc: String(app.desc || '').trim(),
	          scene: getV2SkillDimensionId('auditScene', app.scene),
          appType: getV2SkillDimensionId('skillType', app.appType),
	          appUrl: String(app.appUrl || '').trim(),
	          skillName: String(app.skillName || '').trim(),
	          skillVersion: String(app.skillVersion || '当前版本').trim(),
	          inputItems,
	          inputLabel: String(app.inputLabel || '').trim(),
	          outputLabel: String(app.outputLabel || '').trim(),
	          inputExamples,
	          outputExample: String(app.outputExample || '').trim(),
	          uploadPrompt: String(app.uploadPrompt || '').trim() || this.v2AppDefaultUploadPrompt(inputItems),
	          uploadExampleFiles: uploadExampleFiles.length ? uploadExampleFiles : legacyInputFiles,
	          outputExampleFiles: outputExampleFiles.length ? outputExampleFiles : this.normalizeV2AppExampleFiles(app.outputExample),
	          uploadRule: String(app.uploadRule || 'free').trim() || 'free',
	        };
	      },
      openV2AppConfig(app) {
        const source = app && app.id ? app : (V2_DEMO_APPS.find((item) => item.id === this.v2ActiveAppId) || V2_DEMO_APPS[0] || {});
        this.v2AppEditorMode = app && app.id ? 'edit' : 'create';
        this.v2AppEditorSourceAppId = app && app.id ? app.id : '';
        const option = app && app.id
          ? this.findV2AppSkillOptionByName(source.skillName)
          : (this.v2AppSkillOptions[0] || null);
        this.v2AppEditorSourceSkillKey = option ? option.value : (source.skillName ? `app-skill:${source.id || source.skillName}` : '');
        this.fillV2AppFormFromSource(source);
        if (!(app && app.id) && option) this.applyV2AppSkillOption(option);
        this.v2AppEditorMoreOpen = false;
        this.v2AppEditorOpen = true;
      },
      openV2AppConfigPage(app) {
        const source = app && app.id ? app : this.activeV2App;
        if (!this.v2AppEditable(source)) {
          this.openV2AppUse(source);
          return;
        }
        this.v2ActiveAppId = source && source.id ? source.id : this.v2ActiveAppId;
        this.v2AppEditorMode = 'edit';
        this.v2AppEditorSourceAppId = source && source.id ? source.id : '';
        const option = this.findV2AppSkillOptionByName(source && source.skillName);
        this.v2AppEditorSourceSkillKey = option ? option.value : (source && source.skillName ? `app-skill:${source.id || source.skillName}` : '');
        this.fillV2AppFormFromSource(source || {});
        this.v2AppEditorOpen = false;
        this.v2AppStage = 'config';
        this.v2AppConfigView = 'config';
        this.activeMainView = 'app';
      },
      openV2AppConfigEditorView() {
        this.v2AppConfigView = 'config';
      },
      openV2AppConfigPreview() {
        this.autosaveV2AppConfigPage();
        this.v2AppConfigView = 'preview';
        this.v2AppHistoryVisible = false;
      },
      openV2AppCard(app, evt) {
        if (!app) return;
        if (evt && evt.target && typeof evt.target.closest === 'function') {
          if (evt.target.closest('.workbench-v2-app-card__actions, .tc-template-card__more-slot, .tc-template-card__footer, button, a, input, textarea, select, label')) {
            return;
          }
        }
        if (this.isExpertWorkbenchMode && this.v2AppEditable(app)) {
          this.openV2AppConfigPage(app);
          return;
        }
        this.openV2AppUse(app);
      },
      openV2AppEnter(app) {
        if (!app) return;
        this.openV2AppUse(app);
      },
      openV2AppFromSkill(card) {
        if (!card) return;
        const inputs = this.v2SkillCardInputFileNames(card);
        const name = String(card.name || '未命名技能').trim() || '未命名技能';
        this.v2AppEditorMode = 'create';
        this.v2AppEditorSourceAppId = '';
        this.v2AppEditorSourceSkillKey = String(card.key || '').trim();
        this.v2AppForm = {
          kind: 'skill',
          name,
          desc: String(card.description || '').trim(),
          scene: getV2SkillDimensionId('auditScene', card.auditScene),
          appType: getV2SkillDimensionId('skillType', card.skillType),
          appUrl: '',
          skillName: name,
          skillVersion: this.v2SkillCardVersionLabel(card) || '当前版本',
	          inputItems: inputs,
	          inputLabel: inputs.length ? inputs.join('、') : '按技能配置读取审计资料',
	          outputLabel: this.v2SkillCardOutputSummary(card),
	          inputExamples: {},
	          outputExample: '',
	          uploadPrompt: this.v2AppDefaultUploadPrompt(inputs),
	          uploadExampleFiles: [],
	          outputExampleFiles: [],
	          uploadRule: 'free',
	        };
        this.v2AppEditorMoreOpen = false;
        this.v2AppEditorOpen = true;
      },
      findV2AppSkillOption(value) {
        const key = String(value || '').trim();
        return (this.v2AppSkillOptions || []).find((item) => item.value === key) || null;
      },
      findV2AppSkillOptionByName(name) {
        const text = String(name || '').trim();
        if (!text) return null;
        return (this.v2AppSkillOptions || []).find((item) => item.skillName === text || item.label === text) || null;
      },
      applyV2AppSkillOption(option) {
        if (!option) return;
        this.v2AppEditorSourceSkillKey = option.value;
        this.v2AppForm = {
          ...(this.v2AppForm || {}),
          kind: 'skill',
          name: option.label || '',
          desc: option.desc || '',
          scene: getV2SkillDimensionId('auditScene', option.scene),
          appType: getV2SkillDimensionId('skillType', option.appType),
          appUrl: '',
          skillName: option.skillName || option.label || '',
          skillVersion: option.skillVersion || '当前版本',
	          inputItems: option.inputItems && option.inputItems.length ? option.inputItems.slice() : splitV2AppInputLabel(option.inputLabel),
	          inputLabel: option.inputLabel || '按技能配置读取审计资料',
	          outputLabel: option.outputLabel || '输出分析结果、核查结论与后续处理建议。',
	          inputExamples: {},
	          outputExample: '',
	          uploadPrompt: this.v2AppDefaultUploadPrompt(option.inputItems && option.inputItems.length ? option.inputItems : splitV2AppInputLabel(option.inputLabel)),
	          uploadExampleFiles: [],
	          outputExampleFiles: [],
	          uploadRule: 'free',
	        };
      },
      onV2AppSkillChange(value) {
        this.applyV2AppSkillOption(this.findV2AppSkillOption(value));
      },
      closeV2AppEditor() {
        this.v2AppEditorOpen = false;
      },
      upsertV2AppFromEditor(status) {
        const form = this.v2AppForm || {};
        const name = String(form.name || '').trim();
        if (!name) {
          if (typeof message !== 'undefined' && message.warning) message.warning('请填写应用名称');
          return null;
        }
        const existing = this.v2AppEditorSourceAppId
          ? V2_DEMO_APPS.find((item) => item.id === this.v2AppEditorSourceAppId)
          : null;
        const kind = form.kind === 'external' ? 'external' : 'skill';
        const skillName = String(form.skillName || '').trim();
        const skillVersion = String(form.skillVersion || '').trim();
        const appUrl = String(form.appUrl || '').trim();
        if (status === 'published' && kind === 'skill' && (!skillName || !skillVersion)) {
          if (typeof message !== 'undefined' && message.warning) message.warning('请先选择绑定技能');
          return null;
        }
        if (status === 'published' && kind === 'external' && !appUrl) {
          if (typeof message !== 'undefined' && message.warning) message.warning('请填写应用地址');
          return null;
        }
        const inputItems = Array.isArray(form.inputItems)
          ? form.inputItems.map((item) => String(item || '').trim()).filter(Boolean)
          : splitV2AppInputLabel(form.inputLabel);
        const formInputExamples = form.inputExamples || {};
	        const inputExamples = inputItems.reduce((acc, item) => {
	          const fileName = String(formInputExamples[item] || '').trim();
	          if (fileName) acc[item] = fileName;
	          return acc;
	        }, {});
	        const uploadExampleFiles = this.normalizeV2AppExampleFiles(form.uploadExampleFiles);
	        const outputExampleFiles = this.normalizeV2AppExampleFiles(form.outputExampleFiles);
	        const payload = {
	          kind,
	          name,
	          desc: String(form.desc || '').trim(),
          scene: getV2SkillDimensionId('auditScene', form.scene),
          appType: getV2SkillDimensionId('skillType', form.appType),
          appUrl,
          inputLabel: kind === 'external' ? '跳转第三方应用' : (inputItems.join('、') || '按应用说明上传材料'),
          outputLabel: kind === 'external' ? '由第三方应用返回结果' : (String(form.outputLabel || '').trim() || '输出分析结果与核查建议'),
	          skillName: kind === 'external' ? '' : (skillName || name),
	          skillVersion: kind === 'external' ? '' : (skillVersion || '当前版本'),
	          inputExamples: kind === 'external' ? {} : inputExamples,
	          outputExample: kind === 'external' ? '' : (outputExampleFiles[0] || String(form.outputExample || '').trim()),
	          uploadPrompt: kind === 'external' ? '' : (String(form.uploadPrompt || '').trim() || this.v2AppDefaultUploadPrompt(inputItems)),
	          uploadExampleFiles: kind === 'external' ? [] : uploadExampleFiles,
	          outputExampleFiles: kind === 'external' ? [] : outputExampleFiles,
	          uploadRule: kind === 'external' ? 'free' : (String(form.uploadRule || '').trim() || 'free'),
	          updatedAt: '刚刚',
	        };
        const app = existing || {
          id: 'app-custom-' + Date.now().toString(36),
          appVersion: 'v1.0.0',
          owner: '我',
          ownerOrg: '审计一部',
          useCount: 0,
          recordStatus: '未执行',
          recordTime: '刚刚',
          materials: 0,
        };
        Object.assign(app, payload, { status: status || app.status || 'draft' });
        if (!existing) V2_DEMO_APPS.unshift(app);
        this.v2ActiveAppId = app.id;
        this.v2AppEditorSourceAppId = app.id;
        this.v2AppRevision += 1;
        return app;
      },
      createV2AppFromEditor() {
        const isEdit = this.v2AppEditorMode === 'edit';
        if (this.v2AppForm.kind === 'skill' && !String(this.v2AppForm.skillName || '').trim()) {
          if (typeof message !== 'undefined' && message.warning) message.warning('请先选择绑定技能');
          return;
        }
        if (this.v2AppForm.kind === 'external' && !String(this.v2AppForm.name || '').trim()) {
          this.v2AppForm = {
            ...(this.v2AppForm || {}),
            name: '第三方应用',
            desc: '通过外部链接访问第三方应用。',
            scene: '',
            appType: '',
          };
        }
        const app = this.upsertV2AppFromEditor('draft');
        if (!app) return;
        this.closeV2AppEditor();
        if (!isEdit) this.openV2AppConfigPage(app);
        if (typeof message !== 'undefined' && message.success) {
          message.success(isEdit ? '已保存应用' : '已创建应用，可直接使用或继续配置');
        }
      },
      publishV2AppFromEditor() {
        const app = this.upsertV2AppFromEditor('published');
        if (!app) return;
        this.closeV2AppEditor();
        this.v2AppStage = 'list';
        this.activeMainView = 'app';
        if (typeof message !== 'undefined' && message.success) {
          message.success(`「${app.name}」已发布`);
        }
      },
      autosaveV2AppConfigPage() {
        if (this.v2AppStage !== 'config' || !this.activeV2App) return null;
        return this.upsertV2AppFromEditor(this.activeV2App.status || 'draft');
      },
      publishV2AppConfigPage() {
        let app = null;
        if (this.v2AppStage === 'config') {
          app = this.upsertV2AppFromEditor('published');
          if (!app) return;
          this.openV2AppConfigPage(app);
        } else {
          app = this.activeV2App;
          if (!app) return;
          app.status = 'published';
          app.updatedAt = '刚刚';
          this.v2AppRevision += 1;
        }
        if (typeof message !== 'undefined' && message.success) message.success('已公开');
      },
	      simulateV2AppExampleUpload(type, label) {
	        const form = this.v2AppForm || {};
	        if (type === 'output') {
	          const files = this.normalizeV2AppExampleFiles(form.outputExampleFiles);
	          const fileName = this.uniqueV2AppExampleFileName(files, this.v2AppDefaultExampleFileName(label || form.outputLabel, 'output'));
	          const outputExampleFiles = [...files, fileName];
	          this.v2AppForm = { ...form, outputExample: outputExampleFiles[0] || '', outputExampleFiles };
	          this.autosaveV2AppConfigPage();
	          return;
	        }
	        const files = this.normalizeV2AppExampleFiles(form.uploadExampleFiles);
	        const inputItems = this.v2AppFormInputItems();
	        const baseLabel = label || inputItems[files.length % Math.max(inputItems.length, 1)] || '上传材料';
	        const fileName = this.uniqueV2AppExampleFileName(files, this.v2AppDefaultExampleFileName(baseLabel, 'input'));
	        const inputExamples = { ...((form && form.inputExamples) || {}) };
	        if (label) inputExamples[String(label).trim()] = fileName;
	        this.v2AppForm = { ...form, inputExamples, uploadExampleFiles: [...files, fileName] };
	        this.autosaveV2AppConfigPage();
	      },
	      removeV2AppExampleFile(type, fileName) {
	        const form = this.v2AppForm || {};
	        const target = String(fileName || '').trim();
	        if (!target) return;
	        if (type === 'output') {
	          const outputExampleFiles = this.normalizeV2AppExampleFiles(form.outputExampleFiles).filter((file) => file !== target);
	          this.v2AppForm = { ...form, outputExample: outputExampleFiles[0] || '', outputExampleFiles };
	          this.autosaveV2AppConfigPage();
	          return;
	        }
	        const uploadExampleFiles = this.normalizeV2AppExampleFiles(form.uploadExampleFiles).filter((file) => file !== target);
	        const inputExamples = { ...((form && form.inputExamples) || {}) };
	        Object.keys(inputExamples).forEach((key) => {
	          if (String(inputExamples[key] || '').trim() === target) delete inputExamples[key];
	        });
	        this.v2AppForm = { ...form, inputExamples, uploadExampleFiles };
	        this.autosaveV2AppConfigPage();
	      },
	      v2AppExampleInputFiles(app) {
	        const items = splitV2AppInputLabel(app && app.inputLabel);
	        const uploaded = this.normalizeV2AppExampleFiles(app && app.uploadExampleFiles);
	        if (uploaded.length) return uploaded;
	        const examples = (app && app.inputExamples) || {};
	        const legacyFiles = this.normalizeV2AppExampleFiles(Object.values(examples));
	        if (legacyFiles.length) return legacyFiles;
	        return items.length ? items.map((item) => this.v2AppDefaultExampleFileName(item, 'input')) : ['示例材料.pdf'];
	      },
	      v2AppExampleOutputFiles(app) {
	        const uploaded = this.normalizeV2AppExampleFiles(app && app.outputExampleFiles);
	        if (uploaded.length) return uploaded;
	        const legacy = this.normalizeV2AppExampleFiles(app && app.outputExample);
	        if (legacy.length) return legacy;
	        const title = String((app && app.outputLabel) || '应用结果').trim() || '应用结果';
	        return [this.v2AppDefaultExampleFileName(title, 'output')];
	      },
	      v2AppExampleOutputFile(app) {
	        return this.v2AppExampleOutputFiles(app)[0] || '应用结果.md';
	      },
      openV2AppUse(app, state) {
        const nextAppId = app && app.id ? app.id : this.v2ActiveAppId;
        if (nextAppId !== this.v2ActiveAppId) {
          this.v2AppUploadFiles = [];
          this.v2AppActiveExampleKey = '';
        }
        this.v2ActiveAppId = nextAppId;
        const record = this.v2SidebarExecutionRecords.find((item) => item.appId === this.v2ActiveAppId);
        if (record) this.v2ActiveAppRecordId = record.id;
        this.v2AppRecordPreviewFile = '';
        this.touchV2RecentApp(app || this.activeV2App);
        this.v2AppUseState = state || 'ready';
        this.v2AppEditorOpen = false;
        this.v2AppStage = 'use';
        this.activeMainView = 'app';
        this.v2AppHistoryVisible = false;
      },
      openV2AppRecord(record) {
        if (!record) return;
        this.v2ActiveAppId = record.appId || this.v2ActiveAppId;
        this.v2ActiveAppRecordId = record.id;
        this.v2AppRecordPreviewFile = '';
        this.v2AppUseState = record.status === 'failed' ? 'failed' : 'done';
        this.v2AppStage = 'record';
        this.activeMainView = 'app';
        this.v2AppRecordDetailVisible = true;
        if (this.isExpertWorkbenchMode) this.v2DocWorkspaceCollapsed = false;
        this.$nextTick(() => this.syncRightDrawerFromHost());
      },
      onV2AppRecordMenu(key, record) {
        if (!record) return;
        if (key === 'rename') {
          const next = window.prompt('重命名历史记录', record.title);
          const title = String(next || '').trim();
          if (!title || title === record.title) return;
          this.v2AppExecutionRecords = this.v2SidebarExecutionRecords.map((item) => (
            item.id === record.id ? { ...item, title } : item
          ));
          return;
        }
        if (key === 'delete') {
          if (!window.confirm('删除这条历史记录？')) return;
          const nextRecords = this.v2SidebarExecutionRecords.filter((item) => item.id !== record.id);
          this.v2AppExecutionRecords = nextRecords;
          if (this.v2ActiveAppRecordId === record.id) {
            const next = nextRecords[0];
            this.v2ActiveAppRecordId = next ? next.id : '';
            if (next) this.v2ActiveAppId = next.appId || this.v2ActiveAppId;
          }
        }
      },
      backToV2AppList() {
        this.v2AppStage = 'list';
        this.activeMainView = 'app';
      },
      publishV2App(app) {
        if (!app) return;
        openV2SkillViewConfirm({
          title: '公开应用？',
          content: '公开后，系统内所有用户可使用。',
          okText: '公开',
          cancelText: '取消',
          onOk: () => {
            app.status = 'published';
            app.updatedAt = '刚刚';
            this.v2AppRevision += 1;
            if (typeof message !== 'undefined' && message.success) {
              message.success(`「${app.name}」已公开`);
            }
          },
        });
      },
      unpublishV2App(app) {
        if (!app) return;
        openV2SkillViewConfirm({
          title: '取消公开？',
          content: '取消后，该应用将从公共应用中移除；你仍可在我的应用中继续维护。',
          okText: '取消公开',
          cancelText: '保留公开',
          onOk: () => {
            app.status = 'draft';
            app.updatedAt = '刚刚';
            this.v2AppRevision += 1;
            if (typeof message !== 'undefined' && message.success) {
              message.success(`「${app.name}」已取消公开`);
            }
          },
        });
      },
      toggleV2AppShare(app) {
        this.v2AppCardIsShared(app) ? this.unpublishV2App(app) : this.publishV2App(app);
      },
      onV2AppCardMenu(key, app) {
        const action = String(key || '');
        if (action === 'favorite') {
          this.toggleV2AppFavorite(app);
        } else if (action === 'edit') {
          this.openV2AppConfig(app);
        } else if (action === 'share') {
          this.toggleV2AppShare(app);
        } else if (action === 'delete') {
          this.deleteV2App(app);
        }
      },
      deleteV2App(app) {
        if (!app || !app.id) return;
        openV2SkillViewConfirm({
          title: '删除应用？',
          content: '删除后，该应用不会继续出现在应用列表中。',
          okText: '删除',
          cancelText: '取消',
          okButtonProps: { danger: true },
          onOk: () => {
            const index = V2_DEMO_APPS.findIndex((item) => item.id === app.id);
            if (index >= 0) V2_DEMO_APPS.splice(index, 1);
            if (this.v2ActiveAppId === app.id) this.v2ActiveAppId = (V2_DEMO_APPS[0] && V2_DEMO_APPS[0].id) || '';
            this.v2FavoriteAppIds = (this.v2FavoriteAppIds || []).filter((id) => id !== app.id);
            this.v2AppExecutionRecords = (this.v2AppExecutionRecords || []).filter((record) => record.appId !== app.id);
            this.v2AppRevision += 1;
            if (typeof message !== 'undefined' && message.success) message.success('已删除应用');
          },
        });
      },
      runV2App() {
        const app = this.activeV2App || {};
        const files = (this.v2AppUploadFiles || []).map((file) => String(file.name || '').trim()).filter(Boolean);
        if (!files.length || !this.v2AppCanGenerateResult) {
          if (typeof message !== 'undefined' && message.warning) message.warning('请先上传材料');
          return;
        }
        const id = 'app-run-' + Date.now().toString(36);
        const now = new Date();
        const record = {
          id,
          appId: app.id,
          title: `${app.name || '应用执行'} ${this.formatV2AppRunTimestamp(now)}`,
          timeLabel: '刚刚',
          sidebarTimeLabel: '刚刚',
          status: 'parsing',
          statusLabel: '进行中',
          summary: '系统正在解析上传材料并生成结果。',
          resultTitle: '结果生成中',
          files,
        };
        this.v2AppExecutionRecords = [record, ...(this.v2AppExecutionRecords || [])];
        this.v2ActiveAppRecordId = id;
        this.v2AppUploadFiles = [];
        this.v2AppUseState = 'running';
        this.v2AppHistoryVisible = true;
        this.v2AppRecordDetailVisible = true;
        this.v2AppRevision += 1;
        openV2AppRunCreatedNotice();
      },
      openV2AppResult(record) {
        if (record && record.id) this.v2ActiveAppRecordId = record.id;
        if (record && record.appId) this.v2ActiveAppId = record.appId;
        this.v2AppRecordPreviewFile = '';
        this.v2AppUseState = record && record.status === 'failed' ? 'failed' : 'done';
        this.v2AppStage = 'record';
        this.activeMainView = 'app';
        if (this.isExpertWorkbenchMode) this.v2DocWorkspaceCollapsed = false;
        this.$nextTick(() => this.syncRightDrawerFromHost());
      },
      openV2AppRecordDetailRow(section, row) {
        const action = String((row && row.action) || '');
        if (!action) return;
        if (action === 'open-app') {
          this.openV2AppUse(this.activeV2AppRecordApp || this.activeV2App);
          return;
        }
        if (this.isExpertWorkbenchMode && (action === 'preview-result' || action === 'preview-file')) {
          this.openV2AppRecordArtifactInWorkspace(action, row);
          return;
        }
        this.v2AppRecordPreviewFile = action === 'preview-file' ? String((row && row.label) || '').trim() : '';
      },
      openV2AppRecordArtifactInWorkspace(action, row) {
        const host = resolveCapabilityHost(this);
        const panel = action === 'preview-result' ? 'result' : 'file';
        this.v2DocWorkspaceCollapsed = false;
        this.v2DocWorkspaceFullscreen = false;
        this.v2DirectoryToolsCollapsed = false;
        if (!host) return;
        if (typeof host.openWorkbenchV2RightPanel === 'function') host.openWorkbenchV2RightPanel(panel);
        const label = String((row && row.label) || '').split('·')[0].trim();
        const material = this.findV2AppRecordMaterialByTitle(label, action === 'preview-result' ? 'analysis' : 'raw')
          || this.ensureV2AppRecordFallbackMaterial(label, action === 'preview-result' ? 'analysis' : 'raw');
        if (material && typeof host.openMaterialDetail === 'function') host.openMaterialDetail(material);
        this.syncRightDrawerFromHost(host);
      },
      ensureV2AppRecordFallbackMaterial(title, type) {
        const host = resolveCapabilityHost(this);
        const label = String(title || '').trim();
        if (!host || !label) return null;
        const record = this.activeV2AppRecord || {};
        const app = this.activeV2AppRecordApp || {};
        const suffix = label.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '').slice(0, 48) || 'artifact';
        const materialType = type === 'analysis' ? 'analysis' : 'raw';
        const id = `app-record-${materialType}-${record.id || 'current'}-${suffix}`;
        const mats = Array.isArray(host.materials) ? host.materials : [];
        const existing = mats.find((m) => m && String(m.id || '') === id);
        if (existing) return existing;
        const ext = (label.match(/\.([^.]+)$/) || [])[1] || '';
        const format = ext ? ext.toUpperCase() : (materialType === 'analysis' ? 'MD' : 'PDF');
        const material = {
          id,
          type: materialType,
          title: label,
          rawSubtype: ['XLSX', 'XLS', 'CSV'].includes(format) ? 'table' : 'document',
          format,
          meta: record.timeLabel || '应用任务',
          projectSource: {
            id,
            name: label,
            title: label,
            outputTitle: materialType === 'analysis' ? label : '',
            status: 'done',
            progress: 100,
            format,
            createdAt: record.timeLabel || '',
            uploadedAt: record.timeLabel || '',
            sourceAppName: app.name || '',
            appRecordId: record.id || '',
            summary: materialType === 'analysis'
              ? String(record.summary || '应用任务产出结果').trim()
              : `该文件作为应用任务「${record.title || app.name || '应用任务'}」的上传材料参与执行。`,
          },
        };
        host.materials = [material, ...mats];
        return material;
      },
      findV2AppRecordMaterialByTitle(title, type) {
        const host = resolveCapabilityHost(this);
        const target = String(title || '').trim();
        if (!host || !target) return null;
        const normalize = (value) => String(value || '')
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/\s+/g, '')
          .toLowerCase();
        const wanted = normalize(target);
        const mats = Array.isArray(host.materials) ? host.materials : [];
        const namesOf = (m) => {
          const ps = (m && m.projectSource) || {};
          return [m && m.title, m && m.name, ps.name, ps.title, ps.outputTitle, ps.fileName, ps.originalName].filter(Boolean);
        };
        const matchesType = (m) => {
          if (type === 'analysis') return m && m.type === 'analysis';
          if (type === 'raw') return m && (m.type === 'raw' || m.type === undefined);
          return !!m;
        };
        return mats.find((m) => matchesType(m) && namesOf(m).some((name) => normalize(name) === wanted))
          || mats.find((m) => matchesType(m) && namesOf(m).some((name) => {
            const n = normalize(name);
            return n && (n.includes(wanted) || wanted.includes(n));
          }))
          || null;
      },
      formatV2AppRunTimestamp(date) {
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
      },
      continueUploadV2AppFiles() {
        if ((this.v2AppUploadFiles || []).some((file) => file.status === 'uploading')) return;
        const existing = new Set((this.v2AppUploadFiles || []).map((file) => file.name));
        const names = this.v2AppExampleInputFiles(this.activeV2App).filter((name) => !existing.has(name));
        const nextNames = (names.length ? names : ['补充材料.pdf']).slice(0, 3);
        const now = Date.now();
        const ids = nextNames.map((name, index) => `upload-${now}-${index}`);
        const nextFiles = nextNames.map((name, index) => ({
          id: ids[index],
          name,
          sizeLabel: `${(0.48 + index * 0.31).toFixed(2)} MB`,
          status: 'uploading',
          progress: 8,
        }));
        this.v2AppUploadFiles = [...(this.v2AppUploadFiles || []), ...nextFiles];
        [36, 72, 100].forEach((progress, step) => {
          window.setTimeout(() => {
            this.v2AppUploadFiles = (this.v2AppUploadFiles || []).map((file) => (
              ids.includes(file.id)
                ? { ...file, progress, status: progress >= 100 ? 'done' : 'uploading' }
                : file
            ));
          }, 320 * (step + 1));
        });
      },
      removeV2AppUploadFile(id) {
        this.v2AppUploadFiles = (this.v2AppUploadFiles || []).filter((file) => file.id !== id);
      },
      blockV2AppRealUpload() {
        return false;
      },
      openV2AppExamplePreview(fileName, type) {
        const name = String(fileName || '').trim();
        const isOutput = type === 'output';
        const fileType = this.v2AppRecordFileTypeLabel(name);
        const isOnlinePreview = /^(PDF|MD)$/i.test(fileType);
        const previewPageLabel = fileType === 'PDF' ? 'PDF 第 1 页' : (fileType === 'MD' ? 'Markdown 预览' : '文件预览');
        let lines = [];
        if (name.includes('合同')) {
          lines = [
            '合同编号：HT-2026-0418',
            '项目名称：A市城建集团道路提升工程二标段',
            '合同金额：12,800,000.00 元',
            '发包方：A市城建集团有限公司；承包方：华北建设工程有限公司',
            '关键条款：工程量变更须经监理单位、建设单位、审计复核三方确认后计价。',
            '付款约定：阶段验收合格后 15 个工作日内支付至审定金额的 85%。',
          ];
        } else if (name.includes('预算批复')) {
          lines = [
            '批复文号：财建〔2026〕42号',
            '项目名称：市政道路综合提升专项资金',
            '批复金额：8,600,000.00 元',
            '资金用途：道路修复、管线迁改、交通组织及配套审计费用。',
            '使用要求：专款专用，按合同、验收和拨付审批资料留存完整链路。',
          ];
        } else if (name.includes('审计底稿')) {
          lines = [
            '审计事项：工程变更及付款合规性复核',
            '已核资料：施工合同、变更签证、付款审批单、验收记录。',
            '初步发现：部分变更签证缺少监理确认，付款节点与验收日期存在 7-12 天偏差。',
            '待补资料：补充现场签证原件、审批流截图及对应付款凭证。',
          ];
        } else if (isOutput && name.includes('变更链路核查摘要')) {
          lines = [
            '# 变更链路核查摘要',
            '## 主要发现',
            '1. 识别 3 条合同变更链路，其中 1 条缺少审计复核节点。',
            '2. 发现 2 条金额差异线索，涉及变更签证与付款台账金额不一致。',
            '## 建议',
            '优先复核审批附件、台账金额与付款记录的一致性。',
          ];
        } else if (isOutput && name.includes('拨付异常线索清单')) {
          lines = [
            '# 拨付异常线索清单',
            '| 线索 | 涉及金额 | 风险说明 |',
            '| 预算用途不一致 | 320,000.00 元 | 拨付摘要与批复用途不完全匹配 |',
            '| 附件缺失 | 180,000.00 元 | 缺少验收或用途说明材料 |',
          ];
        } else if (isOutput && name.includes('审计报告初稿')) {
          lines = [
            '# 审计报告初稿',
            '## 一、审计基本情况',
            '本次审计围绕工程变更、付款节点和整改反馈资料开展复核。',
            '## 二、发现问题',
            '部分变更事项审批链条不完整，付款依据与验收资料存在口径差异。',
          ];
        } else {
          lines = isOutput
            ? ['# 示例输出', '系统将按应用配置生成结构化结果、核查结论和后续处理建议。']
            : ['文件首页预览：这里展示示例材料的正文摘录、关键字段和可识别内容。'];
        }
        this.v2AppActiveExampleKey = `${isOutput ? 'output' : 'input'}:${name}`;
        this.v2AppExamplePreview = {
          open: true,
          title: name || '文件预览',
          fileName: name,
          lines,
          isOnlinePreview,
          previewMeta: fileType === 'PDF' ? '1 / 1' : fileType,
          previewPageLabel,
        };
      },
      v2AppUploadStatusLabel(file) {
        return file && file.status === 'uploading' ? `上传中 ${Math.round(Number(file.progress || 0))}%` : '已上传';
      },
      v2AppRecordStatusClass(record) {
        const status = String((record && record.status) || '').trim();
        if (status === 'failed') return 'failed';
        if (status === 'parsing' || status === 'running') return 'parsing';
        if (status === 'queued') return 'queued';
        return 'done';
      },
      v2AppRecordResultFiles(record) {
        const title = String((record && record.resultTitle) || '').trim();
        if (!title) return [];
        if (record && record.status === 'failed') return [title];
        if (title === '结果生成中') return [title];
        return [title, '风险说明.pdf'];
      },
      v2AppRecordSourceFiles(record) {
        return Array.isArray(record && record.files) ? record.files : [];
      },
      v2AppRecordFileIconName(fileName) {
        const api = window.DemoFileIcons;
        if (api && typeof api.iconFor === 'function') return api.iconFor('', fileName).iconName;
        return 'file-lines';
      },
      v2AppRecordFileIconToneClass(fileName) {
        const name = String(fileName || '').trim();
        const api = window.DemoFileIcons;
        if (!api || typeof api.iconFor !== 'function') {
          if (/\.md$/i.test(name)) return 'is-markdown';
          return '';
        }
        const meta = api.iconFor('', name);
        if (meta.group === 'text' && /\.md$/i.test(name)) return 'is-markdown';
        return meta.toneClass || '';
      },
      v2AppRecordFileTypeLabel(fileName) {
        const api = window.DemoFileIcons;
        if (api && typeof api.normalizeExt === 'function') return api.normalizeExt('', fileName) || 'FILE';
        const match = String(fileName || '').match(/\.([a-z0-9]+)$/i);
        return match ? String(match[1] || '').toUpperCase() : 'FILE';
      },
      v2AppRecordFileKindLabel(fileName) {
        const type = this.v2AppRecordFileTypeLabel(fileName);
        if (type === 'MD') return 'Markdown';
        if (type === 'XLSX' || type === 'XLS') return 'Excel';
        if (type === 'DOCX' || type === 'DOC') return 'Word';
        return type;
      },
      downloadV2AppRecordResult() {
        const title = String(this.activeV2AppRecordPreviewTitle || '执行结果').trim();
        if (typeof message !== 'undefined' && message.success) message.success(`已下载「${title}」`);
      },
      startExpertModeTeaching() {
        this.v2ExpertGuidePromptVisible = false;
        this.$nextTick(() => this.openWorkbenchTour(false, 'basic'));
      },
      dismissExpertModeTeaching() {
        this.v2ExpertGuidePromptVisible = false;
      },
      v2DocWorkspacePathParts(activeTab) {
        const active = activeTab || this.v2DocWorkspaceTabs.find((tab) => tab.active) || this.v2DocWorkspaceTabs[0];
        const host = this.capabilityHost;
        if (!active || !active.title) return [this.v2DocWorkspacePanelLabel].filter(Boolean);
        const activeKind = active.kind || (active.raw && active.raw.kind);
        const resourceType = active.resourceType || (active.raw && active.raw.resourceType);
        if (activeKind === 'resource') {
          const row = active.resourceRow || (active.raw && active.raw.resourceRow) || {};
          if (resourceType === 'database') {
            const catalog = host && Array.isArray(host.dbCatalogs)
              ? host.dbCatalogs.find((item) => item && String(item.id || '') === String(row.databaseId || ''))
              : null;
            const databaseName = String(row.databaseName || row.database || (catalog && catalog.name) || '').trim();
            const tableName = String(row.tableName || row.name || active.title || '').trim();
            return ['库表', databaseName, tableName].filter(Boolean);
          }
          if (resourceType === 'graph') return ['数据图谱', active.title].filter(Boolean);
          if (resourceType === 'knowledge') return ['知识库', active.title].filter(Boolean);
          return ['资源', active.title].filter(Boolean);
        }
        const scope = active.scopeLabel || '材料';
        const title = String(active.title || '').trim();
        const tab = active.raw || null;
        if (scope === '材料' || scope === '文件') {
          const row = (host && host.workbenchSelectedProjectMaterialRow)
            || (host && host.selectedMaterial && host.selectedMaterial.projectSource)
            || (tab && tab.resourceRow)
            || null;
          const folders = (host && host.workbenchMaterialFoldersList) || [];
          const prefix = row ? wbMatMaterialPathPrefixForRow(row, folders) : '';
          const segs = prefix.split('/').map((item) => String(item || '').trim()).filter(Boolean);
          return ['材料', ...segs, title].filter(Boolean);
        }
        if (scope === '结果') {
          const material = host && host.selectedMaterial;
          const folderName = material && material.projectSource && material.projectSource.folderTitle;
          return ['结果', folderName, title].map((item) => String(item || '').trim()).filter(Boolean);
        }
        return [scope, title].filter(Boolean);
      },
      syncRightDrawerFromHost(sourceHost) {
        const host = sourceHost || resolveCapabilityHost(this);
        if (!host) return;
        const hostRef = this.isV2WorkspaceOpen ? this.ensureV2DirectoryPanelOpen(host) : host;
        const prevSourcesRightView = this.v2SourcesRightView;
        this.v2RightPanel = hostRef.workbenchV2RightPanel || this.v2RightPanel || 'file';
        if (this.isV2WorkspaceOpen) {
          this.v2RightDrawerCollapsed = false;
          if (hostRef.workbenchV2RightDrawerCollapsed) hostRef.workbenchV2RightDrawerCollapsed = false;
        } else {
          this.v2RightDrawerCollapsed = true;
        }
        this.v2StudioWidth = hostRef.studioWidth;
        this.v2SourcesRightView = hostRef.sourcesRightView;
        this.v2DocWorkspaceActiveTitle = this.resolveV2DocWorkspaceActiveTitle(hostRef);
        this.v2DocWorkspaceActiveKey = String(hostRef.workbenchV2DetailActiveTabKey || '');
        this.v2DocWorkspaceTabMirror = Array.isArray(hostRef.workbenchV2DetailTabs)
          ? hostRef.workbenchV2DetailTabs.map((tab) => ({
            ...tab,
            resourceRow: tab && tab.resourceRow ? { ...tab.resourceRow } : tab && tab.resourceRow,
          }))
          : [];
        if (!this.v2Resizing && hostRef.sourcesRightView === 'detail' && prevSourcesRightView !== 'detail') {
          const detailW = Number(hostRef.sourcesDetailWidth) || this.v2DetailHostWidth;
          this.v2DetailHostWidth = Math.min(720, Math.max(280, detailW));
        }
        if (hostRef.sourcesRightView !== 'detail') this.v2DirectoryToolsCollapsed = false;
        this.v2BridgeTick += 1;
        if (this.isV2WorkspaceOpen) this.$nextTick(() => this.refreshV2DetailTeleport());
      },
      refreshV2DetailTeleport() {
        const host = resolveCapabilityHost(this);
        if (!host || typeof host.syncWorkbenchV2DetailHostReady !== 'function') return;
        host.syncWorkbenchV2DetailHostReady();
      },
      ensureV2DirectoryPanelOpen(host) {
        const ref = host || resolveCapabilityHost(this);
        if (!ref || !this.isV2WorkspaceOpen) return ref;
        ref.workbenchV2RightDrawerCollapsed = false;
        if (!ref.workbenchV2RightPanel && typeof ref.openWorkbenchV2RightPanel === 'function') {
          ref.openWorkbenchV2RightPanel('file');
        }
        return ref;
      },
      onRailToolClick(tool) {
        if (!this.isPreviewView) return;
        this.v2DocWorkspaceCollapsed = false;
        this.v2DocWorkspaceFullscreen = false;
        this.v2DirectoryToolsCollapsed = false;
        this.v2RightDrawerCollapsed = false;
        const host = resolveCapabilityHost(this);
        const panel = tool && tool.panel;
        if (host && typeof host.openWorkbenchV2RightPanel === 'function' && panel) {
          host.openWorkbenchV2RightPanel(panel);
          this.syncRightDrawerFromHost(host);
          return;
        }
        selectCapabilityHostRail(this, panel);
      },
      toggleV2DocWorkspace() {
        if (!this.isPreviewView) return;
        if (this.isV2WorkspaceOpen) {
          this.v2DocWorkspaceCollapsed = true;
          this.v2DocWorkspaceFullscreen = false;
          return;
        }
        this.v2DocWorkspaceCollapsed = false;
        this.v2DirectoryToolsCollapsed = false;
        this.v2RightDrawerCollapsed = false;
        const host = resolveCapabilityHost(this);
        if (!host) return;
        if (typeof host.openWorkbenchV2RightPanel === 'function') {
          host.openWorkbenchV2RightPanel(this.v2RightPanel || host.workbenchV2RightPanel || 'file');
        }
        host.workbenchV2RightDrawerCollapsed = false;
        this.syncRightDrawerFromHost(host);
      },
      toggleV2DocWorkspaceFullscreen() {
        if (!this.shouldShowV2FullscreenControl) return;
        this.v2DocWorkspaceFullscreen = !this.v2DocWorkspaceFullscreen;
      },
      toggleV2DirectoryTools() {
        if (!this.isV2DetailOpen || !this.v2RightPanel) return;
        this.v2DirectoryToolsCollapsed = !this.v2DirectoryToolsCollapsed;
      },
      addV2PathResourceToChat() {
        const host = resolveCapabilityHost(this);
        const row = this.v2ActiveDetailResource;
        if (!host || !row || typeof host.addResourceToChat !== 'function') return;
        host.addResourceToChat(row.type, row);
      },
      openV2ActiveDetailBasicInfo() {
        const host = resolveCapabilityHost(this);
        if (!host || typeof host.openActiveWorkbenchBasicInfoModal !== 'function') return;
        host.openActiveWorkbenchBasicInfoModal();
      },
      onV2PathResourceMenu({ key } = {}) {
        if (key === 'detail') {
          this.openV2ActiveDetailBasicInfo();
          return;
        }
        const host = resolveCapabilityHost(this);
        const row = this.v2ActiveDetailResource;
        if (!host || !row || typeof host.onResourcePreviewContextMenu !== 'function') return;
        host.onResourcePreviewContextMenu(key, row);
        this.syncRightDrawerFromHost(host);
      },
      v2WorkbenchMaterialActionLabel(action) {
        const host = resolveCapabilityHost(this);
        if (host && typeof host.workbenchMaterialActionLabel === 'function') return host.workbenchMaterialActionLabel(action);
        return String(action || '');
      },
      v2WorkbenchMaterialActionIcon(action) {
        const host = resolveCapabilityHost(this);
        if (host && typeof host.workbenchMaterialActionIcon === 'function') return host.workbenchMaterialActionIcon(action);
        if (action === 'ref') return 'chat-ref';
        if (action === 'delete') return 'delete';
        if (action === 'download') return 'download';
        if (action === 'rerun') return 'refresh';
        return 'more';
      },
      v2WorkbenchMaterialActionDanger(action) {
        const host = resolveCapabilityHost(this);
        return !!(host && typeof host.workbenchMaterialActionDanger === 'function' && host.workbenchMaterialActionDanger(action));
      },
      handleV2PathRawMaterialAction(action) {
        if (action === 'detail') {
          this.openV2ActiveDetailBasicInfo();
          return;
        }
        const host = resolveCapabilityHost(this);
        const material = this.v2ActiveRawMaterial;
        if (!host || !material || typeof host.handleWorkbenchMaterialAction !== 'function') return;
        host.handleWorkbenchMaterialAction(action, material);
        this.syncRightDrawerFromHost(host);
      },
      onV2PathRawMaterialMenu({ key } = {}) {
        this.handleV2PathRawMaterialAction(key);
      },
      handleV2PathAnalysisAction(key, mode) {
        if (key === 'detail') {
          this.openV2ActiveDetailBasicInfo();
          return;
        }
        const host = resolveCapabilityHost(this);
        const material = this.v2ActiveAnalysisMaterial;
        if (!host || !material || typeof host.handleTreeContextMenu !== 'function') return;
        if (mode) host.handleTreeContextMenu(key, { raw: material }, 'analysis', mode);
        else host.handleTreeContextMenu(key, { raw: material }, 'analysis');
        this.syncRightDrawerFromHost(host);
      },
      onV2PathAnalysisMenu({ key } = {}) {
        this.handleV2PathAnalysisAction(key);
      },
      onV2PathTaskAnalysisMenu({ key } = {}) {
        this.handleV2PathAnalysisAction(key, 'task');
      },
      refreshV2PathTaskResult() {
        const host = resolveCapabilityHost(this);
        if (!host || typeof host.refreshWorkbenchDemoResources !== 'function') return;
        host.refreshWorkbenchDemoResources('task');
        this.syncRightDrawerFromHost(host);
      },
      resolveV2DocWorkspaceActiveTitle(host) {
        if (!host) return '';
        const activeKey = String(host.workbenchV2DetailActiveTabKey || '');
        const tab = Array.isArray(host.workbenchV2DetailTabs)
          ? host.workbenchV2DetailTabs.find((item) => item && String(item.key || '') === activeKey)
          : null;
        return String(
          (tab && tab.title)
          || (host.selectedResourcePreview && host.selectedResourcePreview.name)
          || (host.workbenchSelectedProjectMaterialRow && host.workbenchSelectedProjectMaterialRow.name)
          || (host.selectedMaterial && (host.selectedMaterial.title || host.selectedMaterial.name))
          || (host.selectedMaterialDetail && host.selectedMaterialDetail.title)
          || host.workbenchEmbedRightAnalysisHeaderTitle
          || ''
        ).trim();
      },
      getV2DocWorkspaceTabIconMeta(tab, host) {
        const fallback = { iconName: 'file-lines', iconSprite: null, iconClass: '' };
        if (!tab) return fallback;
        if (tab.kind === 'resource') {
          const type = String(tab.resourceType || '').trim();
          if (type === 'database') return { iconName: null, iconSprite: '#form', iconClass: '' };
          if (type === 'graph') return { iconName: null, iconSprite: '#map-draw', iconClass: 'is-data' };
          if (type === 'knowledge') return { iconName: 'book', iconSprite: null, iconClass: '' };
          const row = tab.resourceRow || {};
          if (host && typeof host.getMaterialIcon === 'function') {
            return {
              iconName: host.getMaterialIcon({ ...row, type: 'raw' }),
              iconSprite: null,
              iconClass: typeof host.getMaterialIconColorClass === 'function'
                ? host.getMaterialIconColorClass({ ...row, type: 'raw' })
                : '',
            };
          }
          return fallback;
        }
        if (tab.kind === 'material') {
          const materialId = String(tab.materialId || '').trim();
          const material = host && Array.isArray(host.materials)
            ? host.materials.find((item) => item && String(item.id || '') === materialId)
            : null;
          if (material && host && typeof host.getMaterialIcon === 'function') {
            return {
              iconName: host.getMaterialIcon(material),
              iconSprite: null,
              iconClass: typeof host.getMaterialIconColorClass === 'function'
                ? host.getMaterialIconColorClass(material)
                : '',
            };
          }
          return fallback;
        }
        if (tab.kind === 'extraction') return { iconName: null, iconSprite: '#form', iconClass: 'is-data' };
        if (tab.kind === 'skill') return { iconName: null, iconSprite: '#book-open', iconClass: 'is-md' };
        return { iconName: null, iconSprite: '#notes', iconClass: '' };
      },
      getV2DocWorkspaceTabScopeLabel(tab, host) {
        if (!tab) return '';
        if (tab.kind === 'resource') {
          const type = String(tab.resourceType || '').trim();
          if (type === 'database') return '库表';
          if (type === 'graph') return '图谱';
          if (type === 'knowledge') return '知识库';
          return '材料';
        }
        if (tab.kind === 'material') {
          const materialId = String(tab.materialId || '').trim();
          const material = host && Array.isArray(host.materials)
            ? host.materials.find((item) => item && String(item.id || '') === materialId)
            : null;
          return material && material.type === 'analysis' ? '结果' : '材料';
        }
        if (tab.kind === 'extraction') return '库表';
        if (tab.kind === 'skill') return '技能';
        return '材料';
      },
      activateV2DocWorkspaceTab(tab) {
        if (!tab || !tab.raw || !tab.raw.key) return;
        const host = resolveCapabilityHost(this);
        if (host && typeof host.activateWorkbenchV2DetailTab === 'function') {
          host.activateWorkbenchV2DetailTab(tab.raw.key);
          this.syncRightDrawerFromHost(host);
        }
      },
      closeV2DocWorkspaceTab(tab) {
        if (!tab || !tab.raw || !tab.raw.key) return;
        const host = resolveCapabilityHost(this);
        if (host && typeof host.closeWorkbenchV2DetailTab === 'function') {
          host.closeWorkbenchV2DetailTab(tab.raw.key);
          this.syncRightDrawerFromHost(host);
        }
      },
      onV2DocWorkspaceSourceMenu(key) {
        const panel = String(key || '').trim();
        if (!['file', 'database', 'graph', 'knowledge', 'result'].includes(panel)) return;
        const host = resolveCapabilityHost(this);
        if (!host) return;
        this.v2DocWorkspaceCollapsed = false;
        this.v2DocWorkspaceFullscreen = false;
        this.v2DirectoryToolsCollapsed = false;
        if (typeof host.openWorkbenchV2RightPanel === 'function') {
          host.openWorkbenchV2RightPanel(panel);
          this.syncRightDrawerFromHost(host);
          return;
        }
        selectCapabilityHostRail(this, panel);
      },
      beginV2Resize(side, e) {
        if (!e || e.button !== 0 || this.v2Resizing) return;
        e.preventDefault();
        e.stopPropagation();
        const startX = typeof e.clientX === 'number' ? e.clientX : 0;
        this.v2Resizing = {
          side,
          startX,
          sidebarWidth: this.v2SidebarWidth,
          detailHostWidth: this.v2DetailHostWidth,
          docWorkspaceWidth: Number(this.v2DocWorkspaceColumnWidth) || this.v2DocWorkspaceWidth,
          drawerWidth: this.v2StudioWidth,
        };
        document.body.classList.add('is-col-resizing');
        const moveHandler = this._boundV2ResizeMove || this.onV2ResizeMove;
        const stopHandler = this._boundV2ResizeStop || this.stopV2Resize;
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', stopHandler);
        document.addEventListener('pointermove', moveHandler);
        document.addEventListener('pointerup', stopHandler);
        document.addEventListener('pointercancel', stopHandler);
      },
      onV2ResizeMove(e) {
        if (!this.v2Resizing) return;
        if (e.type === 'mousemove' && typeof e.buttons === 'number' && e.buttons === 0) return;
        const clientX = typeof e.clientX === 'number' ? e.clientX : 0;
        const delta = clientX - this.v2Resizing.startX;
        const host = resolveCapabilityHost(this);
        if (this.v2Resizing.side === 'sidebar') {
          this.v2SidebarWidth = Math.min(400, Math.max(200, this.v2Resizing.sidebarWidth + delta));
        } else if (this.v2Resizing.side === 'detailHost') {
          const next = this.clampV2DetailHostWidth(this.v2Resizing.detailHostWidth - delta);
          this.v2DetailHostWidth = next;
          if (host) host.sourcesDetailWidth = next;
        } else if (this.v2Resizing.side === 'docWorkspace') {
          const next = this.clampV2DocWorkspaceColumnWidth(this.v2Resizing.docWorkspaceWidth - delta);
          this.v2DocWorkspaceColumnWidth = next;
        } else if (this.v2Resizing.side === 'detailDrawer') {
          const detailStart = this.v2Resizing.detailHostWidth;
          const drawerStart = this.v2Resizing.drawerWidth;
          const minDelta = Math.max(280 - detailStart, drawerStart - 500);
          const maxDelta = Math.min(720 - detailStart, drawerStart - 240);
          const appliedDelta = Math.min(maxDelta, Math.max(minDelta, delta));
          const nextDetail = detailStart + appliedDelta;
          const nextDrawer = drawerStart - appliedDelta;
          this.v2DetailHostWidth = nextDetail;
          this.v2StudioWidth = nextDrawer;
          if (host) {
            host.sourcesDetailWidth = nextDetail;
            host.studioWidth = nextDrawer;
          }
        } else if (this.v2Resizing.side === 'drawer') {
          const next = Math.min(500, Math.max(240, this.v2Resizing.drawerWidth - delta));
          this.v2StudioWidth = next;
          if (host) host.studioWidth = next;
        }
      },
      v2ShellLayoutMetrics() {
        const shell = this.$el && typeof this.$el.closest === 'function'
          ? this.$el.closest('.workbench-v2-shell')
          : document.querySelector('.workbench-v2-shell');
        const shellWidth = shell ? shell.getBoundingClientRect().width : 0;
        const sidebarW = this.sidebarCollapsed ? 64 : Math.min(400, Math.max(200, Number(this.v2SidebarWidth) || 260));
        const sidebarResizerW = this.sidebarCollapsed ? 0 : 1;
        const mainDocResizerW = this.isV2WorkspaceOpen ? 1 : 0;
        const mainMinW = 280;
        const hasDirectoryWidth = this.isRightDrawerOpen;
        const railW = this.isPreviewView ? V2_DOC_WORKSPACE_RAIL_WIDTH : 0;
        const drawerW = hasDirectoryWidth ? Math.min(500, Math.max(240, Number(this.v2StudioWidth) || 340)) : 0;
        const splitW = this.hasV2DocDetailPane && hasDirectoryWidth ? V2_DOC_WORKSPACE_SPLIT_WIDTH : 0;
        const maxDocWorkspaceCol = shellWidth
          ? Math.max(240, shellWidth - sidebarW - sidebarResizerW - mainDocResizerW - mainMinW)
          : 720;
        return {
          shellWidth,
          mainMinW,
          drawerW,
          splitW,
          railW,
          maxDocWorkspaceCol,
        };
      },
      clampV2DocWorkspaceColumnWidth(width) {
        const { maxDocWorkspaceCol, railW } = this.v2ShellLayoutMetrics();
        const minCol = 240;
        const maxContentCol = Math.max(minCol, maxDocWorkspaceCol - railW);
        return Math.min(maxContentCol, Math.max(minCol, width));
      },
      clampV2DetailHostWidth(width) {
        const { drawerW, splitW, railW, maxDocWorkspaceCol } = this.v2ShellLayoutMetrics();
        const maxDetailWidth = Math.min(720, Math.max(280, maxDocWorkspaceCol - splitW - drawerW - railW));
        return Math.min(maxDetailWidth, Math.max(280, width));
      },
      stopV2Resize() {
        const side = this.v2Resizing && this.v2Resizing.side;
        this.v2Resizing = null;
        document.body.classList.remove('is-col-resizing');
        const moveHandler = this._boundV2ResizeMove || this.onV2ResizeMove;
        const stopHandler = this._boundV2ResizeStop || this.stopV2Resize;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', stopHandler);
        document.removeEventListener('pointermove', moveHandler);
        document.removeEventListener('pointerup', stopHandler);
        document.removeEventListener('pointercancel', stopHandler);
        if (side === 'detailHost' || side === 'detailDrawer') {
          const host = resolveCapabilityHost(this);
          if (host) host.sourcesDetailWidth = this.v2DetailHostWidth;
        }
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      initCapabilityHostEmbed(attempt = 0) {
        const host = resolveCapabilityHost(this) || registerCapabilityHost(this);
        if (!host || typeof host.setWorkbenchEmbedMode !== 'function') {
          if (attempt < 10) setTimeout(() => this.initCapabilityHostEmbed(attempt + 1), 50);
          return;
        }
        host.setWorkbenchEmbedMode('v2');
        this.patchHostSendBridge();
        this.syncRightDrawerFromHost(host);
      },
      conversationBulkId(item) {
        return String((item && item.id) || '').trim();
      },
      isConversationBulkSelected(item) {
        const id = this.conversationBulkId(item);
        return !!id && (this.v2ConversationBulkKeys || []).includes(id);
      },
      toggleConversationBulkMode() {
        if (this.v2ConversationBulkActive) {
          this.resetConversationBulkMode();
          return;
        }
        this.v2SidebarHistoryExpanded = true;
        this.v2ConversationBulkActive = true;
        this.v2ConversationBulkKeys = [];
      },
      resetConversationBulkMode() {
        this.v2ConversationBulkActive = false;
        this.v2ConversationBulkKeys = [];
      },
      toggleConversationBulkSelection(item, evOrChecked) {
        const id = this.conversationBulkId(item);
        if (!id) return;
        let checked;
        if (typeof evOrChecked === 'boolean') checked = evOrChecked;
        else if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
        else checked = !(this.v2ConversationBulkKeys || []).includes(id);
        const next = new Set((this.v2ConversationBulkKeys || []).map(String));
        if (checked) next.add(id);
        else next.delete(id);
        this.v2ConversationBulkKeys = Array.from(next);
      },
      toggleConversationBulkSelectAll(evOrChecked) {
        let checked = true;
        if (typeof evOrChecked === 'boolean') checked = evOrChecked;
        else if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
        this.v2ConversationBulkKeys = checked
          ? (this.historyConversations || []).map((item) => String(item.id || '')).filter(Boolean)
          : [];
      },
      handleConversationRowClick(item) {
        if (this.v2ConversationBulkActive) {
          this.toggleConversationBulkSelection(item);
          return;
        }
        this.selectHistoryConversation(item);
      },
      selectHistoryConversation(item) {
        if (!item || !item.id) return;
        this.activeMainView = 'chat';
        this.activeConversationId = item.id;
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.draftConversationTitle = '';
        this.$nextTick(() => loadCapabilityHostConversation(this, item));
      },
      newSession() {
        this.resetConversationBulkMode();
        this.patchHostSendBridge();
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.activeConversationId = '';
        this.draftConversationTitle = '新建对话';
        this.v2TaskBasicInfoModalOpen = false;
        this.$nextTick(() => resetCapabilityHostForNewSession(this, true));
      },
      selectedConversationBulkItems() {
        const selected = new Set((this.v2ConversationBulkKeys || []).map(String));
        return (this.historyConversations || []).filter((item) => selected.has(String((item && item.id) || '')));
      },
      clearActiveConversationIfRemoved(ids) {
        const removed = new Set((ids || []).map(String));
        if (!removed.has(String(this.activeConversationId || ''))) return;
        this.activeConversationId = '';
        this.draftConversationTitle = '';
      },
      applyConversationBulkArchive(items) {
        const ids = (items || []).map((item) => String(item.id || '')).filter(Boolean);
        if (!ids.length) return;
        this.v2ArchivedConversationIds = Array.from(new Set([...(this.v2ArchivedConversationIds || []), ...ids]));
        this.v2ConversationBulkKeys = [];
        this.v2ConversationBulkActive = false;
        this.clearActiveConversationIfRemoved(ids);
        this.showSidebarMenuNotice(`已归档 ${ids.length} 个会话`);
      },
      applyConversationBulkDelete(items) {
        const ids = (items || []).map((item) => String(item.id || '')).filter(Boolean);
        if (!ids.length) return;
        const idSet = new Set(ids);
        this.v2SavedSessions = (this.v2SavedSessions || []).filter((session) => !idSet.has(String((session && session.id) || '')));
        const host = this.capabilityHost;
        if (host && Array.isArray(host.sessionHistory)) {
          host.sessionHistory = host.sessionHistory.filter((session) => !idSet.has(String((session && session.id) || '')));
        }
        this.v2DeletedConversationIds = Array.from(new Set([...(this.v2DeletedConversationIds || []), ...ids]));
        this.v2ConversationBulkKeys = [];
        this.v2ConversationBulkActive = false;
        this.clearActiveConversationIfRemoved(ids);
        this.showSidebarMenuNotice(`已删除 ${ids.length} 个会话`);
      },
      confirmConversationBulkArchive() {
        const items = this.selectedConversationBulkItems();
        if (!items.length) return;
        const dc = window.dsConfirm;
        if (dc && typeof dc.action === 'function') {
          dc.action({
            title: `归档已选 ${items.length} 个会话？`,
            content: '归档后会从当前对话列表移出。',
            okText: '归档',
            onOk: () => this.applyConversationBulkArchive(items),
          });
          return;
        }
        this.applyConversationBulkArchive(items);
      },
      confirmConversationBulkDelete() {
        const items = this.selectedConversationBulkItems();
        if (!items.length) return;
        const dc = window.dsConfirm;
        if (dc && typeof dc.delete === 'function') {
          dc.delete({
            batchTitle: `删除已选 ${items.length} 个会话？`,
            onOk: () => this.applyConversationBulkDelete(items),
          });
          return;
        }
        this.applyConversationBulkDelete(items);
      },
      confirmConversationBulkDeleteForItem(item) {
        if (!item) return;
        const dc = window.dsConfirm;
        if (dc && typeof dc.delete === 'function') {
          dc.delete({
            batchTitle: '删除该会话？',
            onOk: () => this.applyConversationBulkDelete([item]),
          });
          return;
        }
        this.applyConversationBulkDelete([item]);
      },
      commitDraftConversation(seedText) {
        const host = this.capabilityHost;
        if (!host || this.activeConversationId) return;
        const title = getDraftConversationTitle(seedText);
        const id = 'v2-session-' + Date.now();
        const session = {
          id,
          title,
          createdAt: title,
          messages: clonePlain(host.chatMessages || []),
        };
        host.sessionHistory = [session].concat((host.sessionHistory || []).filter((item) => item && item.id !== id));
        this.v2SavedSessions = [session].concat((this.v2SavedSessions || []).filter((item) => item && item.id !== id));
        this.v2PendingConversationSelectId = id;
        this.activeConversationId = id;
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.draftConversationTitle = '';
        this.$nextTick(() => this.ensurePendingConversationSelected(id));
        setTimeout(() => this.ensurePendingConversationSelected(id), 80);
      },
      ensurePendingConversationSelected(id) {
        const target = String(id || this.v2PendingConversationSelectId || '').trim();
        if (!target) return;
        const exists = (this.historyConversations || []).some((item) => String((item && item.id) || '') === target);
        if (!exists) return;
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.activeConversationId = target;
        if (String(this.v2PendingConversationSelectId || '') === target) this.v2PendingConversationSelectId = '';
      },
      patchHostSendBridge() {
        const host = this.capabilityHost;
        if (!host) return;
        if (!host._workbenchV2SendPatched && typeof host.sendChat === 'function') {
          const original = host.sendChat.bind(host);
          host._workbenchV2OriginalSendChat = host.sendChat;
          host._workbenchV2SendPatched = true;
          host.sendChat = (...args) => {
            const wasDraft = !this.activeConversationId && !!this.draftConversationTitle;
            const seedText = String(host.chatInput || '').trim();
            const beforeLen = Array.isArray(host.chatMessages) ? host.chatMessages.length : 0;
            const result = original(...args);
            this.$nextTick(() => {
              const afterLen = Array.isArray(host.chatMessages) ? host.chatMessages.length : 0;
              if (wasDraft && seedText && afterLen > beforeLen) this.commitDraftConversation(seedText);
            });
            return result;
          };
        }
        if (typeof host.startDemoConversation === 'function' && !host._workbenchV2StartDemoPatched) {
          const originalStartDemo = host.startDemoConversation.bind(host);
          host._workbenchV2OriginalStartDemoConversation = host.startDemoConversation;
          host._workbenchV2StartDemoPatched = true;
          host.startDemoConversation = (...args) => {
            const wasDraft = !this.activeConversationId && !!this.draftConversationTitle;
            const seedText = String(args[0] || host.chatInput || '').trim();
            const result = originalStartDemo(...args);
            if (wasDraft && seedText) this.commitDraftConversation(seedText);
            this.advanceWorkbenchActionTour('send');
            return result;
          };
        }
      },
      openTaskCreate() {
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.v2TaskBasicInfoModalOpen = false;
        this.$nextTick(() => openCapabilityHostTaskCreate(this));
      },
      syncCreatedTasksFromHost() {
        const host = this.capabilityHost;
        const rows = host && Array.isArray(host.workbenchCreatedTasks) ? host.workbenchCreatedTasks : [];
        const currentIdSet = new Set((this.v2CreatedTasks || []).map((row) => String((row && row.id) || '')).filter(Boolean));
        const added = rows.find((row) => row && row.id && !currentIdSet.has(String(row.id)));
        const nextIds = rows.map((row) => String((row && row.id) || '')).filter(Boolean).join('|');
        const currentIds = (this.v2CreatedTasks || []).map((row) => String((row && row.id) || '')).filter(Boolean).join('|');
        if (nextIds === currentIds) return;
        this.v2CreatedTasks = rows.slice();
        if (added) this.focusCreatedTask(added);
        this.v2BridgeTick += 1;
      },
      focusCreatedTask(task) {
        const id = String((task && task.id) || '');
        if (!id) return;
        this.activeMainView = 'task';
        this.activeTaskId = id;
        this.activeConversationId = '';
        this.activeBatchChildId = '';
        this.v2BatchChildStatusView = 'all';
        this.v2BatchChildPage = 1;
        this.v2BatchChildBulkActive = false;
        this.v2BatchChildBulkKeys = [];
        this.v2TaskBasicInfoModalOpen = false;
        this.v2TaskDetailVisible = true;
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      onCapabilityHostTaskCreated(task) {
        const id = String((task && task.id) || '');
        if (id) {
          this.v2CreatedTasks = [task].concat((this.v2CreatedTasks || []).filter((row) => String((row && row.id) || '') !== id));
          this.focusCreatedTask(task);
        }
        this.v2BridgeTick += 1;
        this.$nextTick(() => {
          this.syncRightDrawerFromHost();
          this.ensureV2BatchChildPageInRange();
        });
      },
      openWorkbenchSettings() {
        openWorkbenchProjectEditFromV2(this);
      },
      openWorkbenchSearch() {
        this.setMainView('search');
      },
      openWorkbenchSkillLibrary() {
        this.setMainView('skill');
      },
      isV2SkillAlreadyAdded(raw) {
        const sourceId = getV2SkillSourceId(raw);
        if (!sourceId) return false;
        return (this.currentV2WorkbenchSkillRows || []).some((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return itemSourceId && itemSourceId === sourceId;
        });
      },
      getV2SkillCardInstallSourceId(card) {
        const raw = card && card.raw;
        if (!raw) return '';
        if (this.v2SkillCardIsMineShared(card)) return String(raw.id || '').trim();
        return getV2SkillSourceId(raw);
      },
      findV2InstalledSkillForLibraryCard(card) {
        const sourceId = this.getV2SkillCardInstallSourceId(card);
        if (!sourceId) return null;
        return (this.currentV2WorkbenchSkillRows || []).find((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return itemSourceId && itemSourceId === sourceId;
        }) || null;
      },
      v2SkillCardAlreadyAdded(card) {
        if (this.v2SkillScopeTab === 'workbench') return false;
        const sourceId = this.getV2SkillCardInstallSourceId(card);
        if (!sourceId) return false;
        return (this.currentV2WorkbenchSkillRows || []).some((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return itemSourceId && itemSourceId === sourceId;
        });
      },
      v2SkillCardIsMineShared(card) {
        if (this.v2SkillScopeTab !== 'org') return false;
        const raw = card && card.raw;
        if (!raw) return false;
        const rawId = String(raw.id || '').trim();
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        return rows.some((item) => String((item && item.id) || '').trim() === rawId);
      },
      v2PublicSkillCardNeedsSync(card) {
        if (!this.v2SkillCardIsMineShared(card)) return false;
        const installed = this.findV2InstalledSkillForLibraryCard(card);
        if (!installed) return false;
        return !isV2SkillSyncSnapshotEqual(installed, card && card.raw);
      },
      v2SkillCardHasCornerTag(card) {
        if (this.v2SkillScopeTab === 'workbench') return this.v2SkillCardIsShared(card);
        if (this.v2SkillScopeTab === 'org') return !!(card && card.recommended);
        return false;
      },
      v2SkillCardCornerTagWarning(card) {
        return this.v2SkillScopeTab === 'workbench' && this.v2SkillCardNeedsSync(card);
      },
      v2SkillCardCornerTagLabel(card) {
        if (this.v2SkillScopeTab === 'workbench') return this.v2SkillCardNeedsSync(card) ? '未同步' : '已公开';
        if (this.v2SkillScopeTab === 'org' && card && card.recommended) return '推荐';
        return '';
      },
      v2SkillCardCornerTagTitle(card) {
        if (this.v2SkillScopeTab === 'workbench') return this.v2SkillCardNeedsSync(card) ? '当前工作台内容尚未同步到公共技能' : '已公开为公共技能';
        if (this.v2SkillScopeTab === 'org' && card && card.recommended) return '管理员推荐置顶的公共技能';
        return '';
      },
      v2SkillCardCtaLabel(card) {
        if (this.v2SkillScopeTab === 'workbench') return '使用';
        return '使用';
      },
      v2SkillCardOwnerNameLabel(card) {
        return getV2SkillOwnerParts(card && card.raw, this.v2SkillScopeTab).name;
      },
      v2SkillCardOwnerOrgLabel(card) {
        return getV2SkillOwnerParts(card && card.raw, this.v2SkillScopeTab).org;
      },
      v2SkillCardAuditSceneLabel(card) {
        return getV2SkillDimensionLabel('auditScene', card && card.auditScene);
      },
      v2SkillCardSkillTypeLabel(card) {
        return getV2SkillDimensionLabel('skillType', card && card.skillType);
      },
      v2SkillCardVersionLabel(card) {
        const raw = card && card.raw;
        if (!raw) return '';
        const direct = normalizeV2SkillPublishVersionLabel(raw.versionLabel);
        if (direct) return direct;
        const source = normalizeV2SkillPublishVersionLabel(raw.sourceVersionLabel);
        if (looksLikeV2SkillVersionLabel(source)) return source;
        const list = Array.isArray(raw.publishedVersions) ? raw.publishedVersions : [];
        const latest = list
          .map((item) => item && item.versionLabel)
          .map((label) => normalizeV2SkillPublishVersionLabel(label))
          .filter(Boolean)
          .sort((a, b) => String(b).localeCompare(String(a)))[0];
        return latest || '';
      },
      v2SkillCardInstallCountLabel(card) {
        return Number((card && card.installCount) || 0).toLocaleString('zh-CN');
      },
      v2SkillCardInputFileNames(card) {
        return resolveV2SkillInputFileNames(card && card.raw);
      },
      v2SkillCardOutputSummary(card) {
        return resolveV2SkillOutputSummary(card && card.raw);
      },
      openV2OtherWorkbenchSkillModal() {
        this.v2OtherWorkbenchSkillSearch = '';
        this.v2OtherWorkbenchSkillModalOpen = true;
      },
      closeV2OtherWorkbenchSkillModal() {
        this.v2OtherWorkbenchSkillModalOpen = false;
        this.v2OtherWorkbenchSkillSearch = '';
      },
      setV2SkillScopeTab(tab) {
        const next = String(tab || '').trim();
        if (!V2_SKILL_SCOPE_TABS.some((item) => item.id === next)) return;
        const prev = this.v2SkillScopeTab;
        this.v2SkillScopeTab = next;
        this.v2SkillCategoryTab = 'all';
        this.v2SkillTypeFilter = 'all';
        if (next === 'workbench' && this.v2SkillSortBy === 'install') {
          this.v2SkillSortBy = 'time';
          this.v2SkillSortOrder = 'desc';
        }
      },
      setV2SkillCategoryTab(tab) {
        const next = String(tab || '').trim();
        if (!getV2SkillCategoryTabs().some((item) => item.id === next)) return;
        this.v2SkillCategoryTab = next;
      },
      onV2SkillTypeFilter({ key }) {
        const next = String(key || 'all').trim() || 'all';
        if (!getV2SkillSceneFilterOptions().some((item) => item.id === next)) return;
        this.v2SkillTypeFilter = next;
      },
      onV2SkillSort({ key }) {
        const text = String(key || '').trim();
        const splitAt = text.lastIndexOf('-');
        if (splitAt <= 0) return;
        const field = text.slice(0, splitAt);
        const order = text.slice(splitAt + 1);
        if (field !== 'time' && field !== 'install') return;
        if (field === 'install' && !this.v2SkillSortInstallVisible) return;
        this.v2SkillSortBy = field;
        this.v2SkillSortOrder = order === 'asc' ? 'asc' : 'desc';
      },
      onV2SkillCardCta(card) {
        this.useV2SkillCard(card);
      },
      useV2SkillCard(card) {
        if (!card) return;
        if (this.tourOpen && this.tourGuideKind === 'skill') this.tourSelectedSkillCard = card;
        if (this.v2SkillScopeTab === 'workbench') {
          this.citeSkillCard(card);
          this.advanceWorkbenchActionTour('use');
          return;
        }
        if (!this.v2SkillCardAlreadyAdded(card)) {
          this.installV2SkillCard(card);
        }
        if (!this.v2SkillCardAlreadyAdded(card)) return;
        this.tryInstalledSkillFromLibraryCard(card);
        this.advanceWorkbenchActionTour('use');
      },
      onV2SkillCardInstallMenu(key, card) {
        const action = String(key || '');
        if (action === 'add') this.installV2SkillCard(card);
        if (action === 'add-and-use') this.useV2SkillCard(card);
      },
      unshareSkillCardFromFooter(card) {
        this.shareSkillCard(card);
      },
      onV2AddedSkillMenu(key, card) {
        const action = String(key || '');
        if (action === 'try') this.useV2SkillCard(card);
      },
      tryInstalledSkillFromLibraryCard(card) {
        const installed = this.findV2InstalledSkillForLibraryCard(card);
        if (!installed) {
          if (typeof message !== 'undefined' && message.warning) message.warning('未找到当前工作台中的技能实例');
          return;
        }
        const id = String(installed.id || '').trim();
        const node = {
          source: 'template',
          id,
          key: `project:${id || 'unknown'}`,
          scope: 'project',
          raw: installed,
        };
        this.citeSkillCard({
          key: node.key,
          node,
          raw: installed,
          name: String(installed.name || (card && card.name) || '未命名技能').trim() || '未命名技能',
        });
      },
      syncV2PublicSkillCard(card) {
        if (!this.v2PublicSkillCardNeedsSync(card)) return;
        const installed = this.findV2InstalledSkillForLibraryCard(card);
        if (!installed) return;
        this.updateSharedSkillCard({
          ...card,
          raw: installed,
          name: String(installed.name || (card && card.name) || '未命名技能').trim() || '未命名技能',
        });
      },
      installV2SkillCard(card) {
        const raw = card && card.raw;
        const pid = String(this.projectId || '').trim();
        if (!raw || !pid || typeof demoProjectAnalysisTemplatesById === 'undefined') return;
        const sourceId = this.getV2SkillCardInstallSourceId(card);
        if (!demoProjectAnalysisTemplatesById[pid]) demoProjectAnalysisTemplatesById[pid] = [];
        const list = demoProjectAnalysisTemplatesById[pid] || [];
        const existed = list.find((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return sourceId && itemSourceId === sourceId;
        });
        const name = String(card.name || '未命名技能').trim() || '未命名技能';
        if (existed) {
          if (typeof message !== 'undefined' && message.info) {
            message.info(`「${name}」已添加到当前工作台`);
          }
          return;
        }
        const installMeta = this.v2SkillCardIsMineShared(card)
          ? {
              sourceSkillId: sourceId,
              sourceLibrary: 'shared',
              sourceVersionLabel: normalizeV2SkillPublishVersionLabel(raw.versionLabel || raw.sourceVersionLabel) || '共享技能',
            }
          : undefined;
        const row = buildV2InstalledSkill(raw, installMeta);
        if (!row) return;
        if (typeof window !== 'undefined' && window.DemoSkillFileTree && window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
          window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
        }
        demoProjectAnalysisTemplatesById[pid] = [row, ...list];
        const host = this.capabilityHost;
        if (host && typeof host.workbenchDemoRefreshTick === 'number') {
          host.workbenchDemoRefreshTick += 1;
        }
        this.v2BridgeTick += 1;
        if (typeof message !== 'undefined' && message.success) {
          message.success(`「${name}」已添加到当前工作台`);
        }
      },
      installV2OtherWorkbenchSkill(row) {
        if (!row || !row.raw || row.added) return;
        const pid = String(this.projectId || '').trim();
        if (!pid || typeof demoProjectAnalysisTemplatesById === 'undefined') return;
        if (!demoProjectAnalysisTemplatesById[pid]) demoProjectAnalysisTemplatesById[pid] = [];
        if (this.isV2SkillAlreadyAdded(row.raw)) {
          if (typeof message !== 'undefined' && message.info) message.info('该技能已添加到当前工作台');
          return;
        }
        const skill = buildV2InstalledSkill(row.raw, {
          sourceLibrary: 'workbench',
          sourceVersionLabel: '其他工作台',
          sourceWorkbenchId: row.projectId,
          sourceWorkbenchName: row.projectName,
        });
        if (!skill) return;
        demoProjectAnalysisTemplatesById[pid] = [skill, ...(demoProjectAnalysisTemplatesById[pid] || [])];
        const host = this.capabilityHost;
        if (host && typeof host.workbenchDemoRefreshTick === 'number') {
          host.workbenchDemoRefreshTick += 1;
        }
        this.v2BridgeTick += 1;
        if (typeof message !== 'undefined' && message.success) {
          message.success(`「${row.name}」已添加到当前工作台`);
        }
      },
      onV2SkillCardMenu(key, card) {
        const action = String(key || '');
        if (action === 'edit') {
          this.openSkillBasicCard(card);
        } else if (action === 'info') {
          this.openSkillBasicCard(card);
        } else if (action === 'publish-app') {
          this.openV2AppFromSkill(card);
        } else if (action === 'share') {
          this.shareSkillCard(card);
        } else if (action === 'update') {
          this.updateSharedSkillCard(card);
        } else if (action === 'export') {
          this.exportV2SkillCard(card);
        } else if (action === 'delete') {
          this.deleteSkillCard(card);
        }
      },
      createWorkbenchSkill() {
        this.v2SkillCreateDropdownOpen = false;
        const host = this.capabilityHost;
        if (host && typeof host.onWorkbenchTemplateAddMenu === 'function') {
          host.onWorkbenchTemplateAddMenu({ key: 'new' });
        }
      },
      onV2SkillCreateMenu({ key }) {
        this.handleV2SkillCreateAction(key);
      },
      handleV2SkillCreateAction(action) {
        const nextAction = String(action || '');
        this.v2SkillCreateDropdownOpen = false;
        if (nextAction === 'create') {
          this.createWorkbenchSkill();
        } else if (nextAction === 'import') {
          this.triggerV2SkillImport();
        }
      },
      triggerV2SkillImport() {
        const input = this.$refs.v2SkillImportInput;
        if (input && typeof input.click === 'function') input.click();
      },
      onV2SkillImportChange(ev) {
        const input = ev && ev.target;
        const file = input && input.files && input.files[0];
        const reset = () => {
          if (input) input.value = '';
        };
        if (!file) {
          reset();
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result || '{}'));
            this.importV2SkillPayload(parsed);
          } catch (error) {
            if (typeof message !== 'undefined' && message.error) {
              message.error('文件解析失败，请使用导出的 JSON 技能文件');
            }
          } finally {
            reset();
          }
        };
        reader.onerror = () => {
          if (typeof message !== 'undefined' && message.error) {
            message.error('读取文件失败，请重试');
          }
          reset();
        };
        reader.readAsText(file, 'utf-8');
      },
      importV2SkillPayload(payload) {
        const pid = String(this.projectId || '').trim();
        if (!pid || typeof demoProjectAnalysisTemplatesById === 'undefined') return;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          if (typeof message !== 'undefined' && message.warning) {
            message.warning('仅支持导入单个技能 JSON');
          }
          return;
        }
        const row = buildV2InstalledSkill(payload, {
          sourceLibrary: 'import',
          sourceVersionLabel: '导入技能',
        });
        if (!row) {
          if (typeof message !== 'undefined' && message.warning) {
            message.warning('技能文件内容不完整，无法导入');
          }
          return;
        }
        if (!demoProjectAnalysisTemplatesById[pid]) demoProjectAnalysisTemplatesById[pid] = [];
        const list = demoProjectAnalysisTemplatesById[pid] || [];
        const sourceId = getV2SkillSourceId(row);
        const existed = list.find((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return sourceId && itemSourceId === sourceId;
        });
        if (existed) {
          if (typeof message !== 'undefined' && message.info) {
            message.info(`「${row.name || '未命名技能'}」已添加到当前工作台`);
          }
          return;
        }
        if (typeof window !== 'undefined' && window.DemoSkillFileTree && window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
          window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
        }
        demoProjectAnalysisTemplatesById[pid] = [row, ...list];
        const host = this.capabilityHost;
        if (host && typeof host.workbenchDemoRefreshTick === 'number') {
          host.workbenchDemoRefreshTick += 1;
        }
        this.v2BridgeTick += 1;
        if (typeof message !== 'undefined' && message.success) {
          message.success(`「${row.name || '未命名技能'}」已导入到当前工作台`);
        }
      },
      openSkillCard(card) {
        const host = this.capabilityHost;
        if (!host || !card || !card.node) return;
        const readOnly = this.v2SkillScopeTab !== 'workbench';
        if (typeof host.openWbProjectSkillDetailFromNode === 'function') {
          host.openWbProjectSkillDetailFromNode(card.node, {
            readOnly,
            forceModal: readOnly,
            panel: 'config',
          });
        } else if (typeof host.selectWorkbenchSkillTemplate === 'function') {
          host.selectWorkbenchSkillTemplate(card.node);
        }
      },
      openSkillBasicCard(card) {
        const host = this.capabilityHost;
        if (!host || !card || !card.node) return;
        const readOnly = this.v2SkillScopeTab !== 'workbench';
        if (typeof host.openWbProjectSkillDetailFromNode === 'function') {
          host.openWbProjectSkillDetailFromNode(card.node, {
            readOnly,
            forceModal: true,
            panel: 'basic',
          });
        }
      },
      citeSkillCard(card) {
        const host = this.capabilityHost;
        if (host && card && card.node && typeof host.onWbProjectSkillTreeMenu === 'function') {
          host.onWbProjectSkillTreeMenu({ key: 'cite' }, card.node);
          this.activeMainView = 'chat';
        }
      },
      v2SkillCardIsShared(card) {
        const raw = card && card.raw;
        if (!raw) return false;
        const sourceId = getV2SkillSourceId(raw);
        if (!sourceId) return false;
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        if (getV2SkillRowSourceIndex(rows, sourceId) >= 0) return true;
        return getV2SkillRowSourceIndex(getV2RuntimePublicSkillRows().filter((item) => !isV2MarketSkill(item)), sourceId) >= 0;
      },
      findV2SharedSkillRowForCard(card) {
        const raw = card && card.raw;
        if (!raw) return null;
        const sourceId = getV2SkillSourceId(raw);
        if (!sourceId) return null;
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        const localIndex = getV2SkillRowSourceIndex(rows, sourceId);
        if (localIndex >= 0) return rows[localIndex];
        const publicRows = getV2RuntimePublicSkillRows().filter((item) => !isV2MarketSkill(item));
        const runtimeIndex = getV2SkillRowSourceIndex(publicRows, sourceId);
        return runtimeIndex >= 0 ? publicRows[runtimeIndex] : null;
      },
      v2SkillCardNeedsSync(card) {
        if (this.v2SkillScopeTab !== 'workbench') return false;
        if (!this.v2SkillCardIsShared(card)) return false;
        const shared = this.findV2SharedSkillRowForCard(card);
        if (!shared) return false;
        return !isV2SkillSyncSnapshotEqual(card && card.raw, shared);
      },
      v2SkillCardShareMenuLabel(card) {
        return this.v2SkillCardIsShared(card) ? '取消公开' : '公开';
      },
      shareSkillCard(card) {
        const raw = card && card.raw;
        if (!raw) return;
        const sourceId = getV2SkillSourceId(raw);
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        const index = getV2SkillRowSourceIndex(rows, sourceId);
        const runtimeIndex = getV2SkillRowSourceIndex(getV2RuntimePublicSkillRows().filter((item) => !isV2MarketSkill(item)), sourceId);
        const existed = index >= 0;
        const name = String(card.name || raw.name || '未命名技能').trim() || '未命名技能';
        if (existed || runtimeIndex >= 0) {
          const doUnshare = () => {
            this.v2SharedSkillRows = rows.filter((_, i) => i !== index);
            removeV2RuntimePublicSkill(sourceId);
            this.v2BridgeTick += 1;
            if (typeof message !== 'undefined' && message.success) {
              message.success(`「${name}」已取消公开`);
            }
          };
          openV2SkillViewConfirm({
            title: '取消公开？',
            content: '取消后，该技能将从公共技能中移除；你仍可在当前工作台继续维护。',
            okText: '取消公开',
            cancelText: '保留公开',
            onOk: doUnshare,
          });
          return;
        }
        const versionState = {
          value: getV2SkillDefaultPublishVersionLabel(raw),
        };
        const doShare = () => {
          const versionLabel = normalizeV2SkillPublishVersionLabel(versionState.value);
          if (!versionLabel) {
            if (typeof message !== 'undefined' && message.warning) message.warning('请填写版本号');
            return Promise.reject();
          }
          const row = buildV2SharedSkill(raw, { versionLabel });
          if (!row) return;
          if (typeof window !== 'undefined' && window.DemoSkillFileTree && window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
          }
          upsertV2RuntimePublicSkill(row);
          this.v2SharedSkillRows = [row, ...rows];
          this.v2BridgeTick += 1;
          if (typeof message !== 'undefined' && message.success) {
            message.success(`「${name}」已公开，可在「公共技能」中查看`);
          }
        };
        openV2SkillViewConfirm({
          title: '公开技能？',
          content: buildV2ShareConfirmContent(versionState),
          okText: '公开',
          cancelText: '取消',
          onOk: doShare,
        });
      },
      updateSharedSkillCard(card, options) {
        const raw = card && (card.raw || card);
        if (!raw) return;
        const sourceId = getV2SkillSourceId(raw);
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        const index = getV2SkillRowSourceIndex(rows, sourceId);
        const runtimeRows = getV2RuntimePublicSkillRows();
        const runtimeIndex = getV2SkillRowSourceIndex(runtimeRows.filter((item) => !isV2MarketSkill(item)), sourceId);
        if (index < 0 && runtimeIndex < 0) {
          if (typeof message !== 'undefined' && message.info) message.info('请先公开后再同步');
          return;
        }
        const name = String((card && card.name) || raw.name || '未命名技能').trim() || '未命名技能';
        const doUpdate = () => {
          const current = index >= 0 ? rows[index] : runtimeRows.find((item) => getV2SkillSourceId(item) === sourceId);
          const next = buildV2SharedSkill(raw, {
            versionLabel: normalizeV2SkillPublishVersionLabel(current && (current.versionLabel || current.sourceVersionLabel)) || getV2SkillDefaultPublishVersionLabel(raw),
          });
          if (!next) return;
          next.id = current.id;
          next.createdAt = current.createdAt || next.createdAt;
          if (index >= 0) {
            rows.splice(index, 1, next);
            this.v2SharedSkillRows = rows.slice();
          }
          upsertV2RuntimePublicSkill(next);
          this.v2BridgeTick += 1;
          if (typeof message !== 'undefined' && message.success) {
            message.success(`「${name}」已同步到公共技能`);
          }
        };
        if (options && options.skipConfirm) {
          doUpdate();
          return;
        }
        openV2SkillViewConfirm({
          title: '同步公开技能？',
          content: '同步后，公共技能版本将与当前工作台内容一致。是否继续？',
          okText: '同步',
          cancelText: '暂不同步',
          onOk: doUpdate,
        });
      },
      exportV2SkillCard(card) {
        const raw = card && card.raw;
        if (!raw || typeof document === 'undefined') return;
        const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'skill-' + String(card.name || raw.name || 'export').replace(/[/\\\\?%*:|"<>]/g, '_') + '.json';
        link.click();
        URL.revokeObjectURL(link.href);
        if (typeof message !== 'undefined' && message.success) {
          message.success('已导出');
        }
      },
      deleteSkillCard(card) {
        const host = this.capabilityHost;
        if (host && card && card.node && typeof host.onWbProjectSkillTreeMenu === 'function') {
          host.onWbProjectSkillTreeMenu({ key: 'delete' }, card.node);
        }
      },
      buildV2TaskContextTurns(card) {
        const raw = card && card.raw;
        if (!raw) return [];
        const taskType = getWorkbenchTaskType(raw);
        const skillName = stripDemoLabel(getWorkbenchTaskSkillName(raw)) || '工作台技能';
        const instruction = getWorkbenchTaskInstruction(raw);
        const resources = getWorkbenchTaskResources(raw).map(getWorkbenchTaskResourceLabel);
        const statusText = card.statusLabel || getTaskStatusLabel(raw.status);
        const title = card.title || '未命名任务';
        const resultTitle = stripDemoLabel((raw.projectSource && (raw.projectSource.outputTitle || raw.projectSource.name)) || raw.title || title);
        const actionStatus = card.status === 'failed' ? 'fail' : (card.status === 'parsing' || card.status === 'queued' ? 'running' : 'done');
        const actionLabel = taskType === 'batch-child'
          ? `执行子任务：${title}`
          : taskType === 'generate-skill'
            ? `生成技能：${title}`
            : `执行任务：${title}`;
        const lines = [];
        if (skillName) lines.push(`使用技能：${skillName}`);
        if (resources.length) lines.push(`引用资源：${resources.join('、')}`);
        if (instruction) lines.push(`任务指令：${instruction}`);
        return [
          {
            id: `${card.id}-user`,
            role: 'user',
            text: taskType === 'batch-child'
              ? `查看跑批子任务「${title}」的执行上下文。`
              : `查看任务「${title}」的执行上下文。`,
          },
          {
            id: `${card.id}-thinking`,
            role: 'thinking',
            toolCalls: [
              { type: 'text', body: lines.length ? lines.join('\n') : '读取任务配置与执行上下文。' },
              { type: 'action', status: actionStatus, label: actionLabel },
            ],
          },
          {
            id: `${card.id}-bot`,
            role: 'bot',
            text: card.status === 'failed'
              ? `任务当前状态为「${statusText}」。可在任务操作中重跑，或先核查输入资料与技能配置。`
              : card.status === 'parsing' || card.status === 'queued'
                ? `任务当前状态为「${statusText}」。这里展示已进入队列/执行过程的上下文，完成后会补充产出摘要。`
                : `任务已完成。产出「${resultTitle || title}」已沉淀到结果侧，可在任务配置中查看配置与引用资源，左侧任务更多菜单可打开任务详情。`,
          },
        ];
      },
      openTaskCard(item) {
        if (!item || !item.id) return;
        this.activeMainView = 'task';
        this.activeTaskId = item.id;
        this.activeConversationId = '';
        this.activeBatchChildId = '';
        this.v2BatchChildStatusView = 'all';
        this.v2BatchChildPage = 1;
        this.v2BatchChildBulkActive = false;
        this.v2BatchChildBulkKeys = [];
        this.v2TaskBasicInfoModalOpen = false;
        this.v2TaskDetailVisible = true;
        if (this.isExpertWorkbenchMode) this.v2DocWorkspaceCollapsed = false;
        this.$nextTick(() => {
          this.syncRightDrawerFromHost();
          this.ensureV2TaskDetailLayoutObserver();
        });
      },
      closeTaskContext() {
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.v2BatchChildBulkActive = false;
        this.v2BatchChildBulkKeys = [];
        this.v2TaskBasicInfoModalOpen = false;
        this.v2TaskDetailVisible = true;
      },
      selectBatchChild(child) {
        if (!child || !child.id) return;
        this.activeBatchChildId = child.id;
        this.v2TaskBasicInfoModalOpen = false;
        this.v2TaskDetailVisible = true;
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      backToV2BatchChildList() {
        this.activeBatchChildId = '';
        this.v2TaskBasicInfoModalOpen = false;
      },
      getV2BatchChildRaw(child) {
        return (child && child.raw) || child || null;
      },
      ensureV2BatchChildPageInRange() {
        const size = Math.max(1, Number(this.v2BatchChildPageSize) || 1);
        const total = this.filteredV2BatchChildCards.length;
        const maxPage = Math.max(1, Math.ceil(total / size));
        const nextPage = Math.min(Math.max(1, Number(this.v2BatchChildPage) || 1), maxPage);
        if (nextPage !== this.v2BatchChildPage) this.v2BatchChildPage = nextPage;
        const selectable = new Set(this.v2BatchChildBulkSelectableKeys());
        const nextKeys = this.v2BatchChildBulkKeys.filter((key) => selectable.has(key));
        if (nextKeys.length !== this.v2BatchChildBulkKeys.length) this.v2BatchChildBulkKeys = nextKeys;
      },
      onV2BatchChildPageChange(page) {
        this.v2BatchChildPage = Math.max(1, Number(page) || 1);
      },
      setV2BatchChildStatusView(key) {
        this.v2BatchChildStatusView = String(key || 'all');
        this.v2BatchChildPage = 1;
        this.v2BatchChildBulkKeys = [];
      },
      syncHostBatchChildListState(sourceHost) {
        const host = sourceHost || this.capabilityHost;
        const parent = this.activeTaskCard && this.activeTaskCard.raw;
        if (!host || !parent || getWorkbenchTaskType(parent) !== 'batch') return host || null;
        host.wbTaskListView = 'batch-children';
        host.wbActiveBatchParentId = parent.id;
        host.wbBatchChildStatusView = String(this.v2BatchChildStatusView || 'all');
        host.wbBatchChildPage = Math.max(1, Number(this.v2BatchChildPage) || 1);
        host.wbBatchChildPageSize = Math.max(1, Number(this.v2BatchChildPageSize) || 1);
        host.selectedMaterialId = this.activeBatchChildId || null;
        return host;
      },
      v2BatchChildBulkSelectableKeys() {
        return this.filteredV2BatchChildCards
          .map((child) => {
            const desc = this.workbenchBulkBatchChildDescriptor(child);
            return desc && desc.key;
          })
          .filter(Boolean);
      },
      v2BatchChildBulkSelectedKeys(sourceHost) {
        const host = sourceHost || this.syncHostBatchChildListState();
        if (!host) return [];
        if (typeof host.workbenchBulkKeys === 'function') return host.workbenchBulkKeys('task');
        const selection = host.workbenchBulkSelection || {};
        return Array.isArray(selection.keys) ? selection.keys.map(String).filter(Boolean) : [];
      },
      toggleV2BatchChildBulkMode() {
        if (this.workbenchBulkScopeActive('task', 'batch-child')) {
          this.resetWorkbenchBulkSelection('task');
          return;
        }
        this.startWorkbenchBulkMode('task', 'batch-child');
      },
      workbenchBulkScopeActive(area, scope) {
        if (area === 'task' && scope === 'batch-child') return this.v2BatchChildBulkActive;
        const host = this.syncHostBatchChildListState();
        return !!(host && typeof host.workbenchBulkScopeActive === 'function' && host.workbenchBulkScopeActive(area, scope));
      },
      workbenchBulkSelectableKeys(area, scope) {
        const host = this.syncHostBatchChildListState();
        const keys = host && typeof host.workbenchBulkSelectableKeys === 'function'
          ? host.workbenchBulkSelectableKeys(area, scope)
          : [];
        if (area === 'task' && scope === 'batch-child' && !keys.length) return this.v2BatchChildBulkSelectableKeys();
        return keys;
      },
      startWorkbenchBulkMode(area, scope) {
        if (area === 'task' && scope === 'batch-child') {
          this.v2BatchChildBulkActive = true;
          this.v2BatchChildBulkKeys = [];
          this.v2BridgeTick += 1;
          return;
        }
        if (area === 'task' && scope === 'task') {
          this.v2BatchChildBulkActive = false;
          this.v2BatchChildBulkKeys = [];
        }
        const host = this.syncHostBatchChildListState();
        if (!host) return;
        if (typeof host.startWorkbenchBulkMode === 'function') host.startWorkbenchBulkMode(area, scope);
        if (area === 'task' && scope === 'batch-child' && !this.workbenchBulkScopeActive(area, scope)) {
          host.workbenchBulkSelection = { area: 'task', scope: 'batch-child', keys: [] };
        }
        this.v2BridgeTick += 1;
      },
      resetWorkbenchBulkSelection(area) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          this.v2BatchChildBulkActive = false;
          this.v2BatchChildBulkKeys = [];
          this.v2BridgeTick += 1;
          return;
        }
        const host = this.syncHostBatchChildListState();
        if (!host || typeof host.resetWorkbenchBulkSelection !== 'function') return;
        host.resetWorkbenchBulkSelection(area);
        this.v2BridgeTick += 1;
      },
      workbenchBulkAllSelected(area, scope) {
        const keys = this.workbenchBulkSelectableKeys(area, scope);
        if (!keys.length) return false;
        const selected = new Set(area === 'task' && scope === 'batch-child' ? this.v2BatchChildBulkKeys : this.v2BatchChildBulkSelectedKeys());
        return keys.every((key) => selected.has(key));
      },
      workbenchBulkSomeSelected(area, scope) {
        const keys = this.workbenchBulkSelectableKeys(area, scope);
        if (!keys.length) return false;
        const selected = new Set(area === 'task' && scope === 'batch-child' ? this.v2BatchChildBulkKeys : this.v2BatchChildBulkSelectedKeys());
        const count = keys.filter((key) => selected.has(key)).length;
        return count > 0 && count < keys.length;
      },
      toggleWorkbenchBulkSelectAll(area, scope, evOrChecked) {
        const keys = this.workbenchBulkSelectableKeys(area, scope);
        if (area === 'task' && scope === 'batch-child' && keys.length) {
          let checked = true;
          if (typeof evOrChecked === 'boolean') checked = evOrChecked;
          else if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
          this.v2BatchChildBulkActive = true;
          this.v2BatchChildBulkKeys = checked ? keys.slice() : [];
        } else {
          const host = this.syncHostBatchChildListState();
          if (!host || typeof host.toggleWorkbenchBulkSelectAll !== 'function') return;
          host.toggleWorkbenchBulkSelectAll(area, scope, evOrChecked);
        }
        this.v2BridgeTick += 1;
      },
      workbenchBulkSelectedCount(area) {
        if (area === 'task' && this.v2BatchChildBulkActive) return this.v2BatchChildBulkKeys.length;
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkSelectedCount === 'function' ? host.workbenchBulkSelectedCount(area) : 0;
      },
      workbenchBulkActionKeys(area, group) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          const ordered = ['abort', 'rerun', 'delete'];
          if (group === 'primary') return ordered;
          if (group === 'more') return [];
          return ordered;
        }
        const host = this.syncHostBatchChildListState();
        if (!host || typeof host.workbenchBulkActionKeys !== 'function') return [];
        return host.workbenchBulkActionKeys(area, group);
      },
      workbenchBulkActionTooltip(action, area) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          const label = this.workbenchBulkActionMenuLabel(action, area).replace(/（.*$/, '');
          const count = this.workbenchBulkActionCountText(action, area);
          return count ? `${label}（${count}）` : label;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionTooltip === 'function' ? host.workbenchBulkActionTooltip(action, area) : '';
      },
      workbenchBulkActionCount(action, area) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          return this.filteredV2BatchChildCards
            .filter((child) => this.v2BatchChildBulkKeys.includes(`task:item:${this.getV2BatchChildRaw(child).id}`))
            .filter((child) => (this.workbenchBulkBatchChildDescriptor(child).availableActions || []).includes(action))
            .length;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionCount === 'function' ? host.workbenchBulkActionCount(action, area) : 0;
      },
      workbenchBulkActionCountText(action, area) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          const count = this.workbenchBulkActionCount(action, area);
          return count > 0 ? `${count}项` : '';
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionCountText === 'function' ? host.workbenchBulkActionCountText(action, area) : '';
      },
      workbenchBulkActionIcon(action) {
        if (action === 'abort') return 'pause';
        if (action === 'rerun') return 'redo';
        if (action === 'delete') return 'trash';
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionIcon === 'function' ? host.workbenchBulkActionIcon(action) : '';
      },
      workbenchBulkActionMenuLabel(action, area) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          const label = ({ abort: '批量中止', rerun: '批量重跑', delete: '批量删除' })[action] || action;
          const count = this.workbenchBulkActionCountText(action, area);
          return count ? `${label}（${count}）` : label;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionMenuLabel === 'function' ? host.workbenchBulkActionMenuLabel(action, area) : '';
      },
      onWorkbenchBulkAction(area, action) {
        if (area === 'task' && this.v2BatchChildBulkActive) {
          const selected = this.activeBatchChildCards.filter((child) => this.v2BatchChildBulkKeys.includes(`task:item:${child.id}`));
          if (!selected.length) return;
          if (action === 'abort') {
            selected.forEach((child) => this.abortV2BatchChild(child));
          } else if (action === 'rerun') {
            selected.forEach((child) => this.rerunV2BatchChild(child));
          } else if (action === 'delete') {
            window.dsConfirm.delete({
              batchTitle: `删除已选 ${selected.length} 项？`,
              kind: 'task',
              onOk: () => {
                const parent = this.activeTaskCard && this.activeTaskCard.raw;
                if (parent && Array.isArray(parent.children)) {
                  const removing = new Set(selected.map((child) => String(child.id)));
                  parent.children = parent.children.filter((child) => !removing.has(String(child && child.id)));
                  if (this.activeBatchChildId && removing.has(String(this.activeBatchChildId))) this.activeBatchChildId = '';
                }
                this.v2BatchChildBulkKeys = [];
                this.v2BatchChildBulkActive = false;
                this.v2BridgeTick += 1;
              },
            });
            return;
          }
          this.v2BatchChildBulkKeys = [];
          this.v2BatchChildBulkActive = false;
          this.v2BridgeTick += 1;
          return;
        }
        const host = this.syncHostBatchChildListState();
        if (!host || typeof host.onWorkbenchBulkAction !== 'function') return;
        host.onWorkbenchBulkAction(area, action);
        this.v2BridgeTick += 1;
      },
      workbenchBulkBatchChildDescriptor(child) {
        const host = this.syncHostBatchChildListState();
        const raw = this.getV2BatchChildRaw(child);
        if (!raw) return null;
        if (host && typeof host.workbenchBulkBatchChildDescriptor === 'function') {
          const desc = host.workbenchBulkBatchChildDescriptor(raw);
          if (desc) return desc;
        }
        const status = this.v2BatchChildStatus(child);
        let availableActions = ['delete'];
        if (status === 'queued' || status === 'parsing') availableActions = ['abort'];
        else if (status === 'failed' || status === 'done') availableActions = ['rerun', 'delete'];
        return { area: 'task', scope: 'batch-child', key: `task:item:${raw.id}`, kind: 'batch-child', status, raw, availableActions };
      },
      sidebarTaskBulkDescriptor(item) {
        if (item && item.sourceType === 'app-execution') return null;
        const raw = item && item.raw;
        if (!raw || !raw.id) return null;
        const host = this.syncHostBatchChildListState();
        const node = { id: raw.id, raw };
        if (host && typeof host.workbenchBulkTaskDescriptor === 'function') {
          const desc = host.workbenchBulkTaskDescriptor(node);
          if (desc) return desc;
        }
        if (host && typeof host.isWorkbenchBatchParentTask === 'function' && host.isWorkbenchBatchParentTask(raw)) return null;
        const status = this.sidebarTaskAnalysisStatus(item);
        let availableActions = ['delete'];
        if (status === 'queued' || status === 'parsing') availableActions = ['abort'];
        else if (status === 'failed' || status === 'done') availableActions = ['rerun', 'delete'];
        return { area: 'task', scope: 'task', key: `task:item:${raw.id}`, kind: 'task', status, raw, node, availableActions };
      },
      workbenchBulkIsSelected(desc) {
        if (desc && desc.area === 'task' && desc.scope === 'batch-child') {
          return this.v2BatchChildBulkKeys.includes(String(desc.key));
        }
        const host = this.syncHostBatchChildListState();
        return !!(host && typeof host.workbenchBulkIsSelected === 'function' && host.workbenchBulkIsSelected(desc));
      },
      toggleWorkbenchBulkSelection(desc, evOrChecked, force) {
        if (desc && desc.area === 'task' && desc.scope === 'batch-child') {
          const key = String(desc.key || '');
          if (!key) return;
          let checked = typeof force === 'boolean' ? force : !this.v2BatchChildBulkKeys.includes(key);
          if (typeof evOrChecked === 'boolean') checked = evOrChecked;
          else if (evOrChecked && evOrChecked.target && typeof evOrChecked.target.checked === 'boolean') checked = evOrChecked.target.checked;
          const next = new Set(this.v2BatchChildBulkKeys);
          this.v2BatchChildBulkActive = true;
          if (checked) next.add(key);
          else next.delete(key);
          this.v2BatchChildBulkKeys = Array.from(next);
          this.v2BridgeTick += 1;
          return;
        }
        const host = this.syncHostBatchChildListState();
        if (!host || typeof host.toggleWorkbenchBulkSelection !== 'function') return;
        host.toggleWorkbenchBulkSelection(desc, evOrChecked, force);
        this.v2BridgeTick += 1;
      },
      onWorkbenchBulkBatchChildRowOpen(ev, child) {
        const desc = this.workbenchBulkBatchChildDescriptor(child);
        if (desc && this.workbenchBulkScopeActive(desc.area, desc.scope)) {
          this.toggleWorkbenchBulkSelection(desc);
          return;
        }
        this.onV2BatchChildOpen(ev, child);
      },
      handleSidebarTaskRowClick(item, ev) {
        const desc = this.sidebarTaskBulkDescriptor(item);
        if (desc && this.workbenchBulkScopeActive(desc.area, desc.scope)) {
          this.toggleWorkbenchBulkSelection(desc, ev);
          return;
        }
        if (item && item.sourceType === 'app-execution') {
          this.openV2AppRecord(item.rawRecord || item);
          return;
        }
        this.openTaskCard(item);
      },
      refreshV2BatchChildList() {
        const host = this.capabilityHost;
        if (host && typeof host.refreshWorkbenchDemoResources === 'function') {
          host.refreshWorkbenchDemoResources('task');
          this.v2BridgeTick += 1;
        }
      },
      v2BatchChildNoResultCount() {
        return (this.activeBatchChildCards || []).filter((child) => this.v2BatchChildMatchesStatus(child, 'no-result')).length;
      },
      rerunV2BatchNoResultChildren() {
        const targets = (this.activeBatchChildCards || []).filter((child) => this.v2BatchChildMatchesStatus(child, 'no-result'));
        if (!targets.length) {
          message.info('暂无无结果子任务');
          return;
        }
        targets.forEach((child) => this.rerunV2BatchChild(child));
        this.v2BatchChildStatusView = 'all';
        this.v2BridgeTick += 1;
      },
      handleV2BatchParentHeaderMenu(key) {
        if (key === 'rerun-no-result') {
          this.rerunV2BatchNoResultChildren();
          return;
        }
        const host = this.syncHostBatchChildListState();
        if (!host || typeof host.handleBatchParentHeaderMenu !== 'function') return;
        host.handleBatchParentHeaderMenu(key);
        this.v2BridgeTick += 1;
      },
      v2BatchChildHasResultFile(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.batchChildHasResultFile === 'function') return host.batchChildHasResultFile(raw);
        return !!(raw && raw.projectSource && raw.projectSource.outputTitle);
      },
      v2BatchChildMatchesStatus(child, key) {
        const view = String(key || 'all');
        if (view === 'all') return true;
        const status = this.v2BatchChildStatus(child);
        if (view === 'no-result') return status === 'done' && !this.v2BatchChildHasResultFile(child);
        if (view === 'done') return status === 'done' && this.v2BatchChildHasResultFile(child);
        return status === view;
      },
      v2BatchChildStatus(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.workbenchAnalysisStatusOf === 'function') return host.workbenchAnalysisStatusOf(raw);
        return String((child && child.status) || (raw && raw.status) || '');
      },
      v2BatchChildCanAbort(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.batchChildCanAbort === 'function') return host.batchChildCanAbort(raw);
        return ['queued', 'parsing'].includes(this.v2BatchChildStatus(child));
      },
      v2BatchChildCanRerun(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.batchChildCanRerun === 'function') return host.batchChildCanRerun(raw);
        return ['failed', 'done'].includes(this.v2BatchChildStatus(child));
      },
      v2BatchChildCanDelete(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.batchChildCanDelete === 'function') return host.batchChildCanDelete(raw);
        return ['failed', 'done'].includes(this.v2BatchChildStatus(child));
      },
      v2BatchChildShowMoreMenu(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.batchChildShowMoreMenu === 'function') return host.batchChildShowMoreMenu(raw);
        let count = 0;
        if (this.v2BatchChildCanAbort(child)) count += 1;
        if (this.v2BatchChildCanRerun(child)) count += 1;
        if (this.v2BatchChildCanDelete(child)) count += 1;
        return count > 1;
      },
      v2BatchChildDisplayTitle(child) {
        const text = String((child && child.title) || '').trim();
        const chars = Array.from(text);
        if (chars.length <= 30) return text;
        return `${chars.slice(0, 16).join('')}…${chars.slice(-13).join('')}`;
      },
      v2BatchChildQueuePosition(child) {
        const raw = this.getV2BatchChildRaw(child);
        const parent = this.activeTaskCard && this.activeTaskCard.raw;
        if (!raw || this.v2BatchChildStatus(child) !== 'queued') return 0;
        const queued = ((parent && parent.children) || []).filter((item) => this.v2BatchChildStatus(item) === 'queued');
        const idx = queued.findIndex((item) => String(item && item.id) === String(raw.id));
        return idx >= 0 ? idx + 1 : 0;
      },
      v2BatchChildProgress(child) {
        const raw = this.getV2BatchChildRaw(child);
        const ps = (raw && raw.projectSource) || {};
        return Math.max(0, Math.min(100, Number(ps.progress || raw.progress || 0) || 0));
      },
      v2BatchChildStatusText(child) {
        const status = this.v2BatchChildStatus(child);
        if (status === 'queued') {
          const pos = this.v2BatchChildQueuePosition(child);
          return pos > 0 ? `第${pos}位` : '排队中';
        }
        if (status === 'parsing') {
          const progress = this.v2BatchChildProgress(child);
          return progress > 0 ? `${Math.round(progress)}%` : '运行中';
        }
        return (child && child.statusLabel) || getTaskStatusLabel(status);
      },
      onV2BatchChildOpen(e, child) {
        this.selectBatchChild(child);
      },
      onV2BatchChildMenu(key, child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (!host || !raw) return;
        if (typeof host.handleBatchChildContextMenu === 'function') {
          host.handleBatchChildContextMenu(key, raw);
        } else if (typeof host.handleTreeContextMenu === 'function') {
          host.handleTreeContextMenu(key, { id: raw.id, raw }, 'analysis', 'task');
        }
        this.v2BridgeTick += 1;
      },
      abortV2BatchChild(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.workbenchTaskRowAbort === 'function') {
          host.workbenchTaskRowAbort(raw);
          this.v2BridgeTick += 1;
        }
      },
      rerunV2BatchChild(child) {
        const host = this.capabilityHost;
        const raw = this.getV2BatchChildRaw(child);
        if (host && raw && typeof host.workbenchTaskRowRerun === 'function') {
          host.workbenchTaskRowRerun(raw);
          this.v2BridgeTick += 1;
        }
      },
      runWithHostSelectedTask(fn) {
        const host = this.capabilityHost;
        const raw = this.activeTaskContextCard && this.activeTaskContextCard.raw;
        if (!host || !raw || typeof fn !== 'function') return;
        const prevSelectedMaterialId = host.selectedMaterialId;
        host.selectedMaterialId = raw.id;
        try {
          fn(host, raw);
        } finally {
          host.selectedMaterialId = prevSelectedMaterialId;
        }
      },
      openTaskDetailSection(section, row) {
        if (!section) return;
        this.v2DocWorkspaceCollapsed = false;
        this.v2DocWorkspaceFullscreen = false;
        this.runWithHostSelectedTask((host, raw) => {
          const taskType = getWorkbenchTaskType(raw);
          if (section.key === 'artifact' && typeof host.downloadWorkbenchPackageTask === 'function') {
            host.downloadWorkbenchPackageTask(raw);
            return;
          }
          if (section.key === 'output') {
            if (taskType === 'generate-skill' && typeof host.wbOpenTaskDetailSkill === 'function') host.wbOpenTaskDetailSkill();
            else if (typeof host.openWorkbenchAnalysisModal === 'function') host.openWorkbenchAnalysisModal();
            return;
          }
          if (section.key === 'skill' && typeof host.wbOpenTaskDetailSkill === 'function') {
            host.wbOpenTaskDetailSkill();
            return;
          }
          if (section.key === 'resources' && row && row.resource && typeof host.openWbTaskResourcePreview === 'function') {
            host.openWbTaskResourcePreview(row.resource);
          }
        });
        this.syncRightDrawerFromHost(this.capabilityHost);
      },
      toggleTaskDetail() {
        if (!this.showTaskDetailToggle) return;
        this.v2TaskDetailVisible = !this.v2TaskDetailVisible;
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      toggleAppHistory() {
        if (!this.showAppHistoryToggle) return;
        if (!this.activeV2AppRecords.length) {
          if (typeof message !== 'undefined' && message.info) message.info('暂无执行记录');
          return;
        }
        this.v2AppHistoryVisible = !this.v2AppHistoryVisible;
        this.$nextTick(() => this.ensureV2AppDetailLayoutObserver());
      },
      toggleAppRecordDetail() {
        if (!this.showAppRecordDetailToggle) return;
        this.v2AppRecordDetailVisible = !this.v2AppRecordDetailVisible;
        this.$nextTick(() => this.ensureV2AppDetailLayoutObserver());
      },
      toggleAppFloatingDetail() {
        if (this.v2AppStage === 'record') {
          this.toggleAppRecordDetail();
          return;
        }
        this.toggleAppHistory();
      },
      syncV2TaskDetailLayout() {
        const el = this.$refs.v2TaskChatBody;
        if (!el || !this.v2TaskDetailVisible) {
          this.v2TaskDetailLayout = 'overlay';
          return;
        }
        const containerWidth = el.clientWidth;
        if (!containerWidth) {
          this.v2TaskDetailLayout = 'overlay';
          return;
        }
        this.v2TaskDetailLayout = containerWidth >= V2_DETAIL_DOCK_MIN_WIDTH ? 'dock' : 'overlay';
      },
      ensureV2TaskDetailLayoutObserver() {
        if (this._v2TaskDetailLayoutObserver) {
          this._v2TaskDetailLayoutObserver.disconnect();
          this._v2TaskDetailLayoutObserver = null;
        }
        const el = this.$refs.v2TaskChatBody;
        if (!el || !this.v2TaskDetailVisible || typeof ResizeObserver === 'undefined') {
          this.syncV2TaskDetailLayout();
          return;
        }
        this._v2TaskDetailLayoutObserver = new ResizeObserver(() => {
          this.syncV2TaskDetailLayout();
        });
        this._v2TaskDetailLayoutObserver.observe(el);
        this.syncV2TaskDetailLayout();
      },
      syncV2AppDetailLayout() {
        const visible = this.showAppHistoryPanel || this.showAppRecordDetailPanel;
        const el = this.$refs.v2AppPage;
        if (!el || !visible) {
          this.v2AppDetailLayout = 'overlay';
          return;
        }
        const containerWidth = getV2ElementContentWidth(el);
        if (!containerWidth) {
          this.v2AppDetailLayout = 'overlay';
          return;
        }
        this.v2AppDetailLayout = containerWidth >= V2_DETAIL_DOCK_MIN_WIDTH ? 'dock' : 'overlay';
      },
      ensureV2AppDetailLayoutObserver() {
        if (this._v2AppDetailLayoutObserver) {
          this._v2AppDetailLayoutObserver.disconnect();
          this._v2AppDetailLayoutObserver = null;
        }
        const visible = this.showAppHistoryPanel || this.showAppRecordDetailPanel;
        const el = this.$refs.v2AppPage;
        if (!el || !visible || typeof ResizeObserver === 'undefined') {
          this.syncV2AppDetailLayout();
          return;
        }
        this._v2AppDetailLayoutObserver = new ResizeObserver(() => {
          this.syncV2AppDetailLayout();
        });
        this._v2AppDetailLayoutObserver.observe(el);
        this.syncV2AppDetailLayout();
      },
      openTaskBasicInfo() {
        if (!this.activeTaskContextCard) return;
        this.v2TaskBasicInfoModalOpen = true;
      },
      openSidebarTaskDetail(item) {
        if (!item || !item.id) return;
        this.openTaskCard(item);
        this.$nextTick(() => {
          this.v2TaskBasicInfoModalOpen = true;
        });
      },
      canDownloadTask(item) {
        const host = this.capabilityHost;
        return !!(host && item && item.raw && typeof host.workbenchPackageTaskCanDownload === 'function' && host.workbenchPackageTaskCanDownload(item.raw));
      },
      sidebarTaskAnalysisStatus(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.workbenchAnalysisStatusOf === 'function') {
          return host.workbenchAnalysisStatusOf(raw);
        }
        return (item && item.status) || (raw && raw.status) || '';
      },
      isSidebarPackageDownloadTask(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        return !!(host && raw && typeof host.isWorkbenchPackageDownloadTask === 'function' && host.isWorkbenchPackageDownloadTask(raw));
      },
      canSidebarPackageTaskAbort(item) {
        return this.isSidebarPackageDownloadTask(item) && ['queued', 'parsing'].includes(this.sidebarTaskAnalysisStatus(item));
      },
      sidebarBatchParentShowAbortQuick(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.batchParentShowAbortQuick === 'function' && host.batchParentShowAbortQuick(raw)) return true;
        if (getWorkbenchTaskType(raw) === 'batch') {
          return ((raw && raw.children) || []).some((child) => ['queued', 'parsing'].includes(String((child && child.status) || '')));
        }
        return ['queued', 'parsing'].includes(this.sidebarTaskAnalysisStatus(item));
      },
      sidebarAbortMenuLabel(item) {
        return getWorkbenchTaskType(item && item.raw) === 'batch' ? '一键中止' : '中止';
      },
      sidebarBatchParentCanRerunMenu(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.batchParentCanRerunMenu === 'function' && host.batchParentCanRerunMenu(raw)) return true;
        return getWorkbenchTaskType(raw) === 'batch' && Array.isArray(raw && raw.children) && raw.children.length > 0;
      },
      sidebarBatchParentFailedChildCount(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.batchParentFailedChildCount === 'function') return host.batchParentFailedChildCount(raw);
        return ((raw && raw.children) || []).filter((child) => String((child && child.status) || '') === 'failed').length;
      },
      sidebarTaskCanShowRerun(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.workbenchTaskCanShowRerun === 'function' && host.workbenchTaskCanShowRerun(raw)) return true;
        const st = this.sidebarTaskAnalysisStatus(item);
        const type = getWorkbenchTaskType(raw);
        if (type === 'download-package') return st === 'failed' || st === 'done';
        if (type === 'batch') return false;
        if (type === 'batch-child') return st === 'failed' || st === 'done';
        return st === 'queued' || st === 'parsing' || st === 'failed' || st === 'done';
      },
      sidebarTaskRerunMenuLabel(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.workbenchTaskRerunMenuLabel === 'function') {
          return host.workbenchTaskRerunMenuLabel(raw);
        }
        return '重跑';
      },
      sidebarTaskMenuHasNonDelete(item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (host && raw && typeof host.workbenchTaskMenuHasNonDelete === 'function') {
          return host.workbenchTaskMenuHasNonDelete(raw);
        }
        return (
          this.canDownloadTask(item) ||
          this.canSidebarPackageTaskAbort(item) ||
          this.sidebarBatchParentShowAbortQuick(item) ||
          this.sidebarBatchParentCanRerunMenu(item) ||
          this.sidebarTaskCanShowRerun(item)
        );
      },
      showSidebarMenuNotice(text) {
        const msg = window.antd && window.antd.message;
        if (msg && typeof msg.info === 'function') msg.info(text);
      },
      onSidebarHistoryHeaderMenu(key) {
        if (key === 'batch') this.toggleConversationBulkMode();
      },
      toggleSidebarTaskBulkMode() {
        const host = this.capabilityHost;
        if (this.workbenchBulkScopeActive('task', 'task')) {
          if (host && typeof host.resetWorkbenchBulkSelection === 'function') {
            host.resetWorkbenchBulkSelection('task');
            this.v2BridgeTick += 1;
          }
          return;
        }
        if (host && typeof host.startWorkbenchBulkMode === 'function') {
          this.v2SidebarTasksExpanded = true;
          this.activeMainView = 'task';
          this.startWorkbenchBulkMode('task', 'task');
          this.showSidebarMenuNotice('已进入任务批量操作模式');
          return;
        }
        this.showSidebarMenuNotice('任务批量操作入口已预留');
      },
      onSidebarTaskHeaderMenu(key) {
        if (key !== 'batch') return;
        this.toggleSidebarTaskBulkMode();
      },
	      onSidebarConversationMenu(key, item) {
	        if (key === 'delete') this.confirmConversationBulkDeleteForItem(item);
	      },
      onSidebarTaskMenu(key, item) {
        if (key === 'task-detail') {
          this.openSidebarTaskDetail(item);
          return;
        }
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (!host || !raw || typeof host.handleTreeContextMenu !== 'function') return;
        host.handleTreeContextMenu(key, { id: raw.id, raw }, 'analysis', 'task');
      },
      onWorkbenchProjectMenuClick({ key }) {
        if (key === '__project_empty__') return;
        if (key === '__create_workbench__') {
          this.v2ProjectDropdownOpen = false;
          this.$emit('open-new-project-modal');
          return;
        }
        if (key === '__manage_workbench__') {
          this.v2ProjectDropdownOpen = false;
          this.$emit('navigate', 'project');
          return;
        }
        this.v2ProjectDropdownOpen = false;
        this.switchWorkbenchProject(key);
      },
      switchWorkbenchProject(projectId) {
        const nextId = String(projectId || '').trim();
        if (!nextId || nextId === this.projectId) return;
        window.location.hash = `freeaudit?projectId=${encodeURIComponent(nextId)}`;
      },
      openGenerateSkillConfig() {
        const host = this.capabilityHost;
        if (host && typeof host.openGenerateSkillConfigModal === 'function') {
          host.openGenerateSkillConfigModal();
        }
      },
      syncProjectFromHash() {
        this.projectId = getV2ProjectId();
        const shouldShowOnboarding = this.isEmptyWorkbenchProject;
        this.v2ProjectOptions = readStoredV2WorkbenchProjectOptions();
        this.activeConversationId = getInitialConversationId(this.projectId);
        this.activeTaskId = '';
        this.draftConversationTitle = '';
        this.v2SavedSessions = [];
        this.v2ConversationBulkActive = false;
        this.v2ConversationBulkKeys = [];
        this.v2ArchivedConversationIds = [];
        this.v2DeletedConversationIds = [];
        this.v2CreatedTasks = [];
        this.v2ModeGateOpen = shouldShowOnboarding;
        this.v2ExpertGuidePromptVisible = false;
        this.tourOpen = false;
        this.tourAutoShown = false;
        if (this._workbenchTourTimer) {
          window.clearTimeout(this._workbenchTourTimer);
          this._workbenchTourTimer = null;
        }
      },
    },
    mounted() {
      this._boundV2ResizeMove = (e) => this.onV2ResizeMove(e);
      this._boundV2ResizeStop = () => this.stopV2Resize();
      const onHashChange = () => this.syncProjectFromHash();
      window.addEventListener('hashchange', onHashChange);
      window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE = (task) => this.onCapabilityHostTaskCreated(task);
      window.__DEMO_FREEAUDIT_V2_DETAIL_TABS_BRIDGE = (host) => this.syncRightDrawerFromHost(host);
      window.__DEMO_FREEAUDIT_V2_SET_MAIN_VIEW_BRIDGE = (view) => this.setMainView(view);
      this.$nextTick(() => {
        this.capabilityHostReady = true;
        this.$nextTick(() => {
        registerCapabilityHost(this);
        this.initCapabilityHostEmbed();
        this.patchHostSendBridge();
        this.syncRightDrawerFromHost();
        this._stopV2BatchChildPageWatch = this.$watch(
          () => [
            this.activeTaskId,
            this.v2BatchChildStatusView,
            this.filteredV2BatchChildCards.length,
            this.v2BatchChildPageSize,
            this.v2BridgeTick,
          ].join('|'),
          () => this.ensureV2BatchChildPageInRange()
        );
        this._stopV2RightDrawerWatch = this.$watch(
          () => {
            const host = resolveCapabilityHost(this);
            if (!host) return '';
            return [
              host.workbenchV2RightPanel,
              host.workbenchV2RightDrawerCollapsed,
              host.studioWidth,
              host.sourcesRightView,
              host.workbenchV2DetailActiveTabKey,
              (host.workbenchV2DetailTabs || []).map((tab) => [tab && tab.key, tab && tab.title].join(':')).join(','),
              host.selectedMaterialId,
              host.selectedResourcePreview && host.selectedResourcePreview.name,
              host.selectedMaterialDetail && host.selectedMaterialDetail.title,
            ].join('|');
          },
          () => this.syncRightDrawerFromHost()
        );
        this._stopV2BasicTourUploadWatch = this.$watch(
          () => {
            const host = resolveCapabilityHost(this);
            if (!host) return 0;
            return (host.chatUploadAttachments || []).filter((item) => item && String(item.status || '') === 'ready').length;
          },
          (count) => {
            if (Number(count) > 0) this.advanceWorkbenchActionTour('upload');
          }
        );
        this._v2TaskCreateSyncTimer = window.setInterval(() => this.syncCreatedTasksFromHost(), 300);
        this.ensureV2TaskDetailLayoutObserver();
        this.ensureV2AppDetailLayoutObserver();
        this.scheduleWorkbenchTourAutoOpen();
        });
      });
      this._workbenchV2Cleanup = () => {
        window.removeEventListener('hashchange', onHashChange);
        if (window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE) window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE = null;
        if (window.__DEMO_FREEAUDIT_V2_DETAIL_TABS_BRIDGE) window.__DEMO_FREEAUDIT_V2_DETAIL_TABS_BRIDGE = null;
        if (window.__DEMO_FREEAUDIT_V2_SET_MAIN_VIEW_BRIDGE) window.__DEMO_FREEAUDIT_V2_SET_MAIN_VIEW_BRIDGE = null;
        if (this._stopV2BatchChildPageWatch) {
          this._stopV2BatchChildPageWatch();
          this._stopV2BatchChildPageWatch = null;
        }
        if (this._stopV2RightDrawerWatch) {
          this._stopV2RightDrawerWatch();
          this._stopV2RightDrawerWatch = null;
        }
        if (this._stopV2BasicTourUploadWatch) {
          this._stopV2BasicTourUploadWatch();
          this._stopV2BasicTourUploadWatch = null;
        }
        if (this._v2TaskCreateSyncTimer) {
          window.clearInterval(this._v2TaskCreateSyncTimer);
          this._v2TaskCreateSyncTimer = null;
        }
        if (this._workbenchTourTimer) {
          window.clearTimeout(this._workbenchTourTimer);
          this._workbenchTourTimer = null;
        }
        if (this._v2HelpHintTimer) {
          window.clearTimeout(this._v2HelpHintTimer);
          this._v2HelpHintTimer = null;
        }
        if (this._v2TaskDetailLayoutObserver) {
          this._v2TaskDetailLayoutObserver.disconnect();
          this._v2TaskDetailLayoutObserver = null;
        }
        if (this._v2AppDetailLayoutObserver) {
          this._v2AppDetailLayoutObserver.disconnect();
          this._v2AppDetailLayoutObserver = null;
        }
        this.stopV2Resize();
        const host = resolveCapabilityHost(this);
        if (host && typeof host.setWorkbenchEmbedMode === 'function') {
          host.setWorkbenchEmbedMode('');
        }
        if (host && host._workbenchV2SendPatched && host._workbenchV2OriginalSendChat) {
          host.sendChat = host._workbenchV2OriginalSendChat;
          host._workbenchV2OriginalSendChat = null;
          host._workbenchV2SendPatched = false;
        }
      };
    },
    watch: {
      workbenchMode(mode) {
        if (mode === 'simple') this.activeMainView = 'app';
      },
      v2TaskDetailVisible() {
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      v2AppHistoryVisible() {
        this.$nextTick(() => this.ensureV2AppDetailLayoutObserver());
      },
      v2AppRecordDetailVisible() {
        this.$nextTick(() => this.ensureV2AppDetailLayoutObserver());
      },
      v2AppStage() {
        this.$nextTick(() => this.ensureV2AppDetailLayoutObserver());
      },
      activeMainView() {
        this.$nextTick(() => {
          this.ensureV2TaskDetailLayoutObserver();
          this.ensureV2AppDetailLayoutObserver();
        });
      },
      tourCurrent() {
        this.$nextTick(() => this.prepareWorkbenchTourStep());
      },
      v2ProjectDropdownOpen(open) {
        if (open) {
          this.$nextTick(() => {
            const input = this.$refs.v2ProjectSearchInput;
            if (input && typeof input.focus === 'function') input.focus();
          });
          return;
        }
        this.v2ProjectSearchQuery = '';
      },
      isV2WorkspaceOpen(open) {
        if (!open) return;
        this.$nextTick(() => this.refreshV2DetailTeleport());
      },
      isV2DetailOpen(open) {
        if (!open) return;
        this.$nextTick(() => this.refreshV2DetailTeleport());
      },
    },
    beforeUnmount() {
      if (this._workbenchV2Cleanup) this._workbenchV2Cleanup();
    },
  });
})();
