(function () {
  const app = window.__DEMO_APP;
  const createVNode = window.Vue && window.Vue.createVNode;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const freeauditPanels = (window.DemoFreeAudit && window.DemoFreeAudit.panels) || {};
  const CHAT_DEMO_SCENARIOS = freeauditUtils.CHAT_DEMO_SCENARIOS || [];
  const resolveWorkbenchDemoScenario = freeauditUtils.resolveWorkbenchDemoScenario;
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};
  const wbMatMaterialPathPrefixForRow = freeauditUtils.wbMatMaterialPathPrefixForRow || function () { return ''; };

  const V2_WORKBENCH_TOUR_BANNER_SRC = './assets/generated/freeaudit-workbench-tour-banner.png';
  const V2_DOC_WORKSPACE_RAIL_WIDTH = 48;
  const V2_DOC_WORKSPACE_SPLIT_WIDTH = 4;

  const V2_RAIL_TOOLS = [
    { id: 'toggle', label: '展开或收起右栏', icon: '#right-bar', panel: 'toggle' },
    { id: 'file', label: '打开文件目录', icon: '#notes', panel: 'file' },
    { id: 'database', label: '打开库表目录', icon: '#form', panel: 'database' },
    { id: 'graph', label: '打开数据图谱目录', icon: '#connect', panel: 'graph' },
    { id: 'knowledge', label: '打开知识库目录', icon: '#book', panel: 'knowledge' },
    { id: 'result', label: '打开结果目录', icon: '#notes', panel: 'result' },
  ];

  const V2_MAIN_VIEWS = [
    { id: 'search', label: '搜索', icon: 'search' },
    { id: 'skill', label: '技能', icon: 'book-open' },
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
    { id: 'org', label: '共享技能' },
    { id: 'market', label: '技能市场' },
  ];

  const V2_SKILL_INSTALL_COUNT_BY_ID = {
    'sk-pub-1': 128,
    'sk-pub-2': 86,
    'sk-pub-3': 54,
    'sk-pub-4': 37,
    'sk-prv-1': 12,
  };

  function getV2SkillDimensionRows(kind) {
    const dims = (window.DemoSkillData && window.DemoSkillData.skillDimensions) || {};
    const rows = kind === 'skillType' ? dims.skillTypes : dims.auditScenes;
    return (Array.isArray(rows) ? rows : []).filter((item) => item && item.enabled !== false);
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

  function getV2SkillDimensionLabel(kind, value) {
    const rows = getV2SkillDimensionRows(kind === 'skillType' ? 'skillType' : 'auditScene');
    const hit = rows.find((item) => String(item.id) === String(value));
    return hit ? hit.label : (value ? String(value) : '');
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
      return inputs.slice(0, 3).map((item) => String(item || '').trim()).filter(Boolean);
    }
    const files = flattenV2SkillFiles(raw && raw.skillFiles);
    return files.slice(0, 3).map((file) => String(file.filename || file.name || '输入文件').trim()).filter(Boolean);
  }

  function resolveV2SkillOutputSummary(raw) {
    const text = String((raw && raw.outputSummary) || '').trim();
    if (text) return text;
    const rule = String((raw && raw.analysisRule) || '').trim();
    if (rule) return '输出疑点清单，并给出风险说明与核查建议。';
    return '输出分析结果、核查结论与后续处理建议。';
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
    if (scopeTab === 'market') {
      const label = isV2MarketSkill(raw) ? '技能市场' : (String(raw.sourceLabel || '技能市场').trim() || '技能市场');
      return { name: label, org: '' };
    }
    if (scopeTab === 'workbench') {
      const name = String(raw.createdBy || raw.ownerName || raw.userName || raw.sharedBy || raw.author || '我').trim() || '我';
      let org = String(raw.ownerOrg || raw.organization || raw.department || raw.dept || '').trim();
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
    if (!name && org) name = org;
    return { name: name || '审计中心', org: org && org !== name ? org : '' };
  }

  function isV2MarketSkill(raw) {
    const sourceKind = String((raw && raw.sourceKind) || '').trim();
    if (sourceKind) return sourceKind === 'market';
    const sharedBy = String((raw && raw.sharedBy) || '').trim();
    return sharedBy === '系统预置' || sharedBy === '平台管理员';
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
    const sourceId = getV2SkillSourceId(raw);
    let row = null;
    if (typeof demoSeedToAnalysisTemplateShape === 'function') {
      row = demoSeedToAnalysisTemplateShape(raw, raw.library || 'public');
    } else {
      row = JSON.parse(JSON.stringify(raw));
    }
    if (!row) return null;
    const now = formatV2SkillInstalledAt();
    const library = raw.library || row.library || 'public';
    const sourceMeta = meta && typeof meta === 'object' ? meta : {};
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
    row.createdAt = row.createdAt || raw.createdAt || now;
    row.updatedAt = now;
    return row;
  }

  function buildV2SharedSkill(raw) {
    if (!raw) return null;
    const sourceId = getV2SkillSourceId(raw);
    const now = formatV2SkillInstalledAt();
    const row = JSON.parse(JSON.stringify(raw));
    row.id = 'sk-shared-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    row.library = 'public';
    row.sharedBy = row.sharedBy && row.sharedBy !== '系统预置' ? row.sharedBy : '我';
    row.sourceSkillId = sourceId || row.sourceSkillId || raw.id;
    row.sourceLibrary = raw.sourceLibrary || raw.library || 'project';
    row.sourceKind = 'shared';
    row.sourceLabel = '共享技能';
    row.sourceSkillName = raw.sourceSkillName || raw.name || row.name || '';
    row.sourceVersionLabel = raw.sourceVersionLabel || '工作台共享';
    row.createdAt = now;
    row.updatedAt = now;
    return row;
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
    return String((scenario && (scenario.seedText || scenario.title)) || '').trim() || '未命名对话';
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
    if (id === 'scenario-guide') return '6 小时';
    return '';
  }

  function getScenarioAgeHours(scenario) {
    const id = String((scenario && scenario.id) || '');
    if (id === 'scenario-guide') return 6;
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
    host.chatInput = '';
    host.chatInputRefItems = [];
    host.chatUploadAttachments = [];
    host.historyDropdownOpen = false;
    if (typeof host.clearDailyGuidePrompt === 'function') host.clearDailyGuidePrompt();
    if (typeof host.closeChatInputTriggerMenu === 'function') host.closeChatInputTriggerMenu();
    if (typeof host.adjustInputHeight === 'function') host.adjustInputHeight();
    if (typeof host.focusChatInput === 'function') host.$nextTick(() => host.focusChatInput());
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
        }"
        :style="v2ShellGridStyle"
      >
        <aside class="workbench-v2-sidebar" aria-label="工作台对话与任务" data-tour-id="workbench-sidebar">
          <div class="workbench-v2-brand">
            <button
              type="button"
              class="workbench-v2-brand__mark"
              :title="sidebarCollapsed ? '展开左栏' : '返回首页'"
              :aria-label="sidebarCollapsed ? '展开左栏' : '返回首页'"
              @click="handleBrandMarkClick"
            >
              <img class="workbench-v2-brand__image" src="./assets/generated/kian-kun-logo-wide.svg" alt="KianKun 审计分析平台" />
              <svg class="iconpark-icon workbench-v2-brand__logo" aria-hidden="true"><use href="#workbench"></use></svg>
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
              type="button"
              class="workbench-v2-sidebar-action"
              title="新建对话"
              aria-label="新建对话"
              @click="newSession"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use href="#edit-two"></use></svg>
              <span>新建对话</span>
            </button>
            <button
              type="button"
              class="workbench-v2-sidebar-action"
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
              :class="{ 'is-active': activeMainView === view.id }"
              :data-tour-id="view.id === 'skill' ? 'workbench-skill-entry' : null"
              @click="setMainView(view.id)"
            >
              <ds-icon :name="view.icon" aria-hidden="true" />
              <span>{{ view.label }}</span>
            </button>
          </div>
          <section class="workbench-v2-conversation-list" aria-label="历史对话和任务列表">
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
                :class="{ 'is-active': item.id === activeConversationId, 'is-bulk-mode': v2ConversationBulkActive, 'is-bulk-selected': isConversationBulkSelected(item) }"
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
                v-for="item in taskList"
                :key="item.id"
                :trigger="['contextmenu']"
                :disabled="workbenchBulkScopeActive('task', 'task')"
              >
              <div
                class="workbench-v2-conversation workbench-v2-conversation--task"
                :class="{ 'is-active': item.id === activeTaskId, 'is-bulk-mode': workbenchBulkScopeActive('task', 'task'), 'is-bulk-selected': workbenchBulkIsSelected(sidebarTaskBulkDescriptor(item)) }"
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
                <span v-if="!workbenchBulkScopeActive('task', 'task')" class="workbench-v2-conversation__actions" @click.stop>
                  <a-dropdown :trigger="['click']">
                    <button type="button" class="workbench-v2-task-inline-action" title="更多" aria-label="更多操作" @click.stop>
                      <ds-icon name="more" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu @click="({ key }) => onSidebarTaskMenu(key, item)">
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
              <div v-if="!taskList.length" class="workbench-v2-list-empty">暂无任务</div>
              </div>
            </div>
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
          <header v-show="activeMainView !== 'skill'" class="workbench-v2-header">
            <div class="workbench-v2-header__left">
              <div class="workbench-v2-title-group">
                <h1 class="workbench-v2-title">{{ activeMainTitle }}</h1>
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
                v-else-if="showTaskDetailToggle"
                type="button"
                class="nlm-assistant-header-btn"
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
              <a-input
                v-model:value="v2SearchQuery"
                allow-clear
                size="large"
                placeholder="搜索对话、任务"
                class="workbench-v2-search-input"
              >
                <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
              </a-input>
              <div class="workbench-v2-search-results">
                <section class="workbench-v2-content-section">
                  <div class="workbench-v2-content-section__head">
                    <h2>最近对话</h2>
                    <span>{{ filteredSearchConversations.length }}</span>
                  </div>
                  <div class="workbench-v2-list-cards">
                    <button
                      v-for="item in filteredSearchConversations"
                      :key="'search-conv-' + item.id"
                      type="button"
                      class="workbench-v2-wide-card"
                      @click="selectHistoryConversation(item)"
                    >
                      <span class="workbench-v2-wide-card__icon"><ds-icon name="chat-ref" aria-hidden="true" /></span>
                      <span class="workbench-v2-wide-card__body">
                        <span class="workbench-v2-wide-card__title">{{ item.title }}</span>
                        <span class="workbench-v2-wide-card__meta">{{ item.timeLabel || item.meta }}</span>
                      </span>
                    </button>
                    <div v-if="!filteredSearchConversations.length" class="workbench-v2-list-empty">暂无匹配对话</div>
                  </div>
                </section>
                <section class="workbench-v2-content-section">
                  <div class="workbench-v2-content-section__head">
                    <h2>最近任务</h2>
                    <span>{{ filteredSearchTasks.length }}</span>
                  </div>
                  <div class="workbench-v2-list-cards">
                    <button
                      v-for="item in filteredSearchTasks"
                      :key="'search-task-' + item.id"
                      type="button"
                      class="workbench-v2-wide-card"
                      @click="openTaskCard(item)"
                    >
                      <span class="workbench-v2-wide-card__icon" :class="item.iconClass"><ds-icon :name="item.iconName" :title="item.iconTitle" /></span>
                      <span class="workbench-v2-wide-card__body">
                        <span class="workbench-v2-wide-card__title">{{ item.title }}</span>
                        <span class="workbench-v2-wide-card__meta">{{ item.sourceSkillName || item.statusLabel }}</span>
                      </span>
                      <span class="workbench-v2-status" :class="'is-' + item.status">{{ item.statusLabel }}</span>
                    </button>
                    <div v-if="!filteredSearchTasks.length" class="workbench-v2-list-empty">暂无匹配任务</div>
                  </div>
                </section>
              </div>
            </div>
          </section>

          <section v-show="activeMainView === 'skill'" class="workbench-v2-view-stage workbench-v2-skill-view workbench-v2-skill-page" aria-label="工作台技能">
            <header class="workbench-v2-skill-header">
              <div class="workbench-v2-skill-header__main">
                <h1 class="workbench-v2-skill-header__title">技能</h1>
                <p class="workbench-v2-skill-header__subtitle">通过技能为大模型注入审计思路</p>
              </div>
              <div class="workbench-v2-skill-header__actions">
                <div
                  v-if="v2SkillScopeTab === 'workbench'"
                  class="workbench-v2-skill-header__cta-group"
                >
                  <button
                    type="button"
                    class="ds-btn-page-cta workbench-v2-skill-header__action workbench-v2-skill-header__action--primary"
                    title="创建技能"
                    aria-label="创建技能"
                    @click="createWorkbenchSkill"
                  >
                    <ds-icon name="plus" class="ds-btn-icon-before" aria-hidden="true" />
                    <span>创建技能</span>
                  </button>
                  <a-dropdown
                    :trigger="['click']"
                    placement="bottomRight"
                  >
                    <button
                      type="button"
                      class="ds-btn-page-cta workbench-v2-skill-header__action workbench-v2-skill-header__action--caret"
                      title="更多创建方式"
                      aria-label="更多创建方式"
                      @click.stop
                    >
                      <ds-icon name="chevron-down" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu @click="onV2SkillCreateMenu">
                        <a-menu-item key="copy-from-other">从其他工作台添加</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
                <button
                  v-else
                  type="button"
                  class="ds-btn-page-cta workbench-v2-skill-header__action"
                  title="创建技能"
                  aria-label="创建技能"
                  @click="createWorkbenchSkill"
                >
                  <ds-icon name="plus" class="ds-btn-icon-before" aria-hidden="true" />
                  <span>创建技能</span>
                </button>
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
                    title="按审计场景过滤"
                    aria-label="按审计场景过滤"
                    @click.stop
                  >
                    <span class="workbench-v2-skill-filter-control__label">审计场景</span>
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
            <nav class="workbench-v2-skill-type-tabs" aria-label="技能类型">
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
            </nav>
            <section class="workbench-v2-skill-section" aria-label="技能列表">
              <div v-if="v2SkillCards.length" class="workbench-v2-skill-grid">
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
                        </div>
                        <div class="tc-template-card__tags tc-template-card__tags--compact">
                          <TagLg v-if="v2SkillCardAuditSceneLabel(card)">{{ v2SkillCardAuditSceneLabel(card) }}</TagLg>
                          <TagLg v-if="v2SkillCardSkillTypeLabel(card)">{{ v2SkillCardSkillTypeLabel(card) }}</TagLg>
                          <span class="tc-template-card__download-tag">
                            <ds-icon name="download" aria-hidden="true" />
                            <span>{{ v2SkillCardInstallCountLabel(card) }} 次下载</span>
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="v2SkillScopeTab === 'workbench'"
                        class="tc-template-card__actions"
                        :class="{ 'has-shared-tag': v2SkillCardIsShared(card) }"
                      >
                        <span
                          v-if="v2SkillCardIsShared(card)"
                          class="tc-template-card__shared-corner-tag"
                        >已共享</span>
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
                              <a-menu-item key="edit">编辑</a-menu-item>
                              <a-menu-item key="share">{{ v2SkillCardShareMenuLabel(card) }}</a-menu-item>
                              <a-menu-item key="delete" danger>删除</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
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
                            <ds-icon name="file-lines" aria-hidden="true" />
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
                          v-if="v2SkillScopeTab === 'workbench'"
                          class="tc-template-card__owner"
                          :title="'创建人：' + v2SkillCardOwnerNameLabel(card) + (v2SkillCardOwnerOrgLabel(card) ? '；组织：' + v2SkillCardOwnerOrgLabel(card) : '')"
                        >
                          <ds-icon name="user" aria-hidden="true" />
                          <span class="tc-template-card__owner-name">{{ v2SkillCardOwnerNameLabel(card) }}</span>
                          <span v-if="v2SkillCardOwnerOrgLabel(card)" class="tc-template-card__owner-org">{{ v2SkillCardOwnerOrgLabel(card) }}</span>
                        </span>
                        <span
                          v-else-if="v2SkillScopeTab === 'market'"
                          class="tc-template-card__owner"
                          :title="'来源：' + card.sourceLabel"
                        >
                          <ds-icon name="user" aria-hidden="true" />
                          <span class="tc-template-card__owner-name">{{ card.sourceLabel }}</span>
                        </span>
                        <span
                          v-else
                          class="tc-template-card__owner"
                          :title="'创建人：' + v2SkillCardOwnerNameLabel(card) + (v2SkillCardOwnerOrgLabel(card) ? '；组织：' + v2SkillCardOwnerOrgLabel(card) : '')"
                        >
                          <ds-icon name="user" aria-hidden="true" />
                          <span class="tc-template-card__owner-name">{{ v2SkillCardOwnerNameLabel(card) }}</span>
                          <span v-if="v2SkillCardOwnerOrgLabel(card)" class="tc-template-card__owner-org">{{ v2SkillCardOwnerOrgLabel(card) }}</span>
                        </span>
                      </div>
                      <div class="tc-template-card__footer-right">
                        <span
                          class="tc-template-card__updated"
                          :title="'更新时间：' + card.updatedAtLabel"
                        >
                          <ds-icon name="clock" aria-hidden="true" />
                          <span>{{ card.updatedAtLabel }}</span>
                        </span>
                        <a-dropdown
                          v-if="v2SkillScopeTab !== 'workbench' && v2SkillCardAlreadyAdded(card)"
                          :trigger="['click']"
                          placement="bottomRight"
                          @click.stop
                        >
                          <a-button
                            class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-item__cta is-install is-added"
                            :title="'已添加，可直接试用：' + card.name"
                            :aria-label="'已添加技能：' + card.name"
                            @click.stop
                          >
                            <span class="ds-trigger-btn__text">已添加</span>
                            <ds-icon name="chevron-down" class="ds-trigger-btn__icon" aria-hidden="true" />
                          </a-button>
                          <template #overlay>
                            <a-menu @click="({ key }) => onV2AddedSkillMenu(key, card)">
                              <a-menu-item key="try">直接试用</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                        <a-button
                          v-else
                          class="ds-trigger-btn ds-trigger-btn--icon-text workbench-v2-skill-item__cta"
                          :class="{
                            'is-use': v2SkillScopeTab === 'workbench',
                            'is-install': v2SkillScopeTab !== 'workbench',
                          }"
                          :title="v2SkillCardCtaLabel(card) + '技能'"
                          :aria-label="v2SkillCardCtaLabel(card) + '技能'"
                          @click.stop="onV2SkillCardCta(card)"
                        >
                          <span class="ds-trigger-btn__text">{{ v2SkillCardCtaLabel(card) }}</span>
                        </a-button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
              <div v-else class="workbench-v2-skill-empty">{{ v2SkillEmptyText }}</div>
            </section>
          </section>

          <section v-show="activeMainView === 'task'" class="workbench-v2-view-stage workbench-v2-task-view" aria-label="工作台任务">
            <template v-if="activeTaskIsBatch && !activeBatchChildCard">
              <div class="workbench-v2-batch-overview">
                <div class="workbench-v2-batch-child-list">
                  <a-dropdown
                    v-for="child in activeBatchChildCards"
                    :key="'v2-batch-child-' + child.id"
                    :trigger="['contextmenu']"
                    @click.stop
                  >
                    <div
                      class="workbench-v2-batch-child-card"
                      :class="{ 'is-active': child.id === activeBatchChildId }"
                      role="button"
                      tabindex="0"
                      @click="selectBatchChild(child)"
                      @keydown.enter.prevent="selectBatchChild(child)"
                      @keydown.space.prevent="selectBatchChild(child)"
                    >
                      <span class="workbench-v2-task-card__icon" :class="child.iconClass"><ds-icon :name="child.iconName" :title="child.iconTitle" /></span>
                      <span class="workbench-v2-task-card__body">
                        <span class="workbench-v2-task-card__title">{{ child.title }}</span>
                        <span class="workbench-v2-task-card__meta">{{ activeTaskCard.title }}</span>
                      </span>
                      <span class="workbench-v2-batch-child-card__right">
                        <span class="workbench-v2-status" :class="'is-' + child.status">{{ v2BatchChildStatusText(child) }}</span>
                        <span class="workbench-v2-batch-child-card__actions" @click.stop>
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
                </div>
              </div>
            </template>
            <template v-else-if="activeTaskCard">
              <div class="workbench-v2-task-workspace" :class="{ 'is-batch-child-selected': activeTaskIsBatch }">
                <aside v-if="activeTaskIsBatch" class="workbench-v2-batch-child-pane" aria-label="子任务列表">
                  <div class="workbench-v2-batch-child-pane__head">
                    <button type="button" class="workbench-v2-icon-action" title="返回对话" aria-label="返回对话" @click="closeTaskContext">
                      <ds-icon name="arrow-left" aria-hidden="true" />
                    </button>
                    <span class="workbench-v2-batch-child-pane__title">{{ activeTaskCard.title }}</span>
                    <div class="nlm-material-toolbar__actions workbench-v2-batch-child-pane__actions">
                      <a-tooltip :title="workbenchBulkScopeActive('task', 'batch-child') ? '取消多选' : '多选'">
                        <a-button
                          type="text"
                          :class="['ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn', { 'is-active': workbenchBulkScopeActive('task', 'batch-child') }]"
                          :disabled="!workbenchBulkScopeActive('task', 'batch-child') && !workbenchBulkSelectableKeys('task', 'batch-child').length"
                          :title="workbenchBulkScopeActive('task', 'batch-child') ? '取消多选' : '多选'"
                          :aria-label="workbenchBulkScopeActive('task', 'batch-child') ? '取消子任务多选' : '子任务多选'"
                          :aria-pressed="workbenchBulkScopeActive('task', 'batch-child') ? 'true' : 'false'"
                          @click.stop="workbenchBulkScopeActive('task', 'batch-child') ? resetWorkbenchBulkSelection('task') : startWorkbenchBulkMode('task', 'batch-child')"
                        >
                          <svg class="iconpark-icon" aria-hidden="true"><use href="#check-correct"></use></svg>
                        </a-button>
                      </a-tooltip>
                      <a-tooltip title="刷新">
                        <a-button
                          type="text"
                          class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-toolbar-pool-refresh-btn"
                          title="刷新"
                          aria-label="刷新任务列表"
                          @click="refreshV2BatchChildList"
                        >
                          <ds-icon name="refresh" aria-hidden="true" />
                        </a-button>
                      </a-tooltip>
                      <a-dropdown :trigger="['click']" @click.stop>
                        <a-tooltip title="更多">
                          <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn" title="更多" aria-label="更多操作" @click.stop>
                            <ds-icon name="more" aria-hidden="true" />
                          </a-button>
                        </a-tooltip>
                        <template #overlay>
                          <a-menu @click="({ key }) => handleV2BatchParentHeaderMenu(key)">
                            <a-menu-item v-if="canDownloadTask(activeTaskCard)" key="download-package">下载</a-menu-item>
                            <a-menu-item v-if="sidebarBatchParentShowAbortQuick(activeTaskCard)" key="abort-task">一键中止</a-menu-item>
                            <a-menu-item v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)" key="rerun-all">一键重跑</a-menu-item>
                            <a-menu-item
                              v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)"
                              key="rerun-failed-only"
                              :disabled="!sidebarBatchParentFailedChildCount(activeTaskCard)"
                            >一键重跑（仅失败）</a-menu-item>
                            <a-menu-item
                              v-if="sidebarBatchParentCanRerunMenu(activeTaskCard)"
                              key="clear-failed-only"
                              :disabled="!sidebarBatchParentFailedChildCount(activeTaskCard)"
                            >一键清空（仅失败）</a-menu-item>
                            <a-menu-item v-if="sidebarTaskCanShowRerun(activeTaskCard)" key="rerun-task">{{ sidebarTaskRerunMenuLabel(activeTaskCard) }}</a-menu-item>
                            <a-menu-divider v-if="sidebarTaskMenuHasNonDelete(activeTaskCard)" />
                            <a-menu-item key="delete" danger>删除</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </div>
                  </div>
                  <div class="wb-task-batch-children-view workbench-v2-batch-child-list">
                    <div class="wb-material-status-footer wb-batch-child-status-footer wb-material-status-footer--file-pool ds-popover-panel__footer">
                      <div class="wb-material-status-footer__right">
                        <FreeAuditStatusFilterBar
                          aria-label="子任务状态摘要"
                          :active-key="v2BatchChildStatusView"
                          :items="v2BatchChildStatusItems"
                          @select="setV2BatchChildStatusView"
                        />
                      </div>
                    </div>
                    ${freeauditPanels.bulkBar ? freeauditPanels.bulkBar('task', 'batch-child') : ''}
                    <div class="wb-task-batch-child-list-shell">
                      <div class="nlm-cards-wrap nlm-tree-wrap nlm-task-batch-child-list">
                        <FreeAuditBatchChildRow
                          v-for="child in pagedV2BatchChildCards"
                          :key="'v2-batch-child-pane-' + child.id"
                          :child="child.raw || child"
                          :selected="child.id === activeBatchChildId"
                          :bulk-descriptor="workbenchBulkBatchChildDescriptor(child)"
                          :bulk-selected="workbenchBulkIsSelected(workbenchBulkBatchChildDescriptor(child))"
                          :bulk-mode="workbenchBulkScopeActive('task', 'batch-child')"
                          :status="child.status"
                          :queue-position="v2BatchChildQueuePosition(child)"
                          :show-more="v2BatchChildShowMoreMenu(child)"
                          :can-abort="v2BatchChildCanAbort(child)"
                          :can-rerun="v2BatchChildCanRerun(child)"
                          :can-delete="v2BatchChildCanDelete(child)"
                          :progress="v2BatchChildProgress(child)"
                          @open="onWorkbenchBulkBatchChildRowOpen"
                          @menu="onV2BatchChildMenu"
                          @abort="abortV2BatchChild"
                          @rerun="rerunV2BatchChild"
                          @bulk-toggle="toggleWorkbenchBulkSelection"
                        />
                        <a-empty v-if="!filteredV2BatchChildCards.length" description="暂无子任务" />
                      </div>
                      <div class="wb-task-batch-child-list-footer">
                        <div class="wb-material-list-top-actions wb-batch-child-list-top-actions">
                          <span class="wb-batch-child-list-top-actions__count">共 {{ filteredV2BatchChildCards.length }} 条</span>
                        </div>
                        <a-pagination
                          v-if="filteredV2BatchChildCards.length"
                          size="small"
                          :current="v2BatchChildPage"
                          :page-size="v2BatchChildPageSize"
                          :total="filteredV2BatchChildCards.length"
                          :show-size-changer="false"
                          @change="onV2BatchChildPageChange"
                        />
                      </div>
                    </div>
                  </div>
                </aside>
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
                          <div v-if="turn.role === 'thinking'" class="nlm-thinking wb-task-context-thinking">
                            <div class="nlm-thinking-steps nlm-tool-calls">
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
                          </div>
                          <div v-else class="nlm-msg-row">
                            <div class="nlm-msg-wrap">
                              <div :class="['nlm-msg', turn.role, { 'wb-task-context-msg--system': turn.kind === 'system' }]">{{ turn.text }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    <aside v-if="v2TaskDetailVisible" class="workbench-v2-task-floating-detail" aria-label="任务详情">
                      <div class="workbench-v2-task-floating-detail__head">
                        <span class="workbench-v2-task-floating-detail__title">{{ activeTaskContextCard.title }}</span>
                        <button type="button" class="workbench-v2-text-btn" @click="openTaskBasicInfo">
                          <ds-icon name="circle-info" aria-hidden="true" />
                          <span>基本信息</span>
                        </button>
                      </div>
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
              title="基本信息"
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

          <section v-show="activeMainView === 'chat'" class="workbench-v2-chat-stage workbench-v2-chat-stage--capability-host" aria-label="新版工作台对话区">
            <free-audit-capability-host
              v-if="capabilityHostReady"
              ref="capabilityHost"
              class="workbench-v2-capability-host"
              embed-mode="v2"
              @task-created="onCapabilityHostTaskCreated"
            />
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
                        <svg class="iconpark-icon" aria-hidden="true"><use :href="item.icon"></use></svg>
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
                <a-tooltip title="引用">
                  <a-button
                    type="text"
                    class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                    title="引用"
                    aria-label="添加到对话"
                    @click.stop="addV2PathResourceToChat"
                  ><iconpark-icon name="message-sent" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
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
                    ><iconpark-icon v-if="action === 'ref'" name="message-sent" class="iconpark-icon" aria-hidden="true"></iconpark-icon><ds-icon v-else :name="v2WorkbenchMaterialActionIcon(action)" /></a-button>
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
                  <a-tooltip title="引用">
                    <a-button
                      type="text"
                      class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm workbench-v2-detail-title-btn"
                      title="引用"
                      aria-label="添加到对话"
                      @click.stop="handleV2PathAnalysisAction('ref')"
                    ><iconpark-icon name="message-sent" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
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
                <div class="workbench-v2-detail-empty__inner">
                  <ds-icon class="workbench-v2-detail-empty__icon" :name="v2BlankDetailIconName" aria-hidden="true" />
                  <h3 class="workbench-v2-detail-empty__title">{{ v2BlankDetailTitle }}</h3>
                  <p class="workbench-v2-detail-empty__desc">{{ v2BlankDetailDesc }}</p>
                </div>
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
              class="workbench-v2-directory-switcher__btn workbench-v2-doc-workspace__rail-toggle"
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
              :class="{ 'is-active': tool.active }"
              :title="tool.label"
              :aria-label="tool.label"
              :aria-pressed="tool.active ? 'true' : 'false'"
              @click="onRailToolClick(tool)"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use :href="tool.icon"></use></svg>
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
        <a-tour
          v-if="tourOpen"
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
              <span class="workbench-v2-tour-progress">
                <span class="workbench-v2-tour-dots" aria-hidden="true">
                  <span
                    v-for="index in workbenchTourIndicatorItems(total)"
                    :key="index"
                    class="ant-tour-indicator"
                    :class="{ 'ant-tour-indicator-active': index === current }"
                  ></span>
                </span>
                <a-checkbox
                  v-model:checked="tourSuppressNextTime"
                  class="workbench-v2-tour-repeat-choice"
                  @click.stop
                >下次不再显示</a-checkbox>
              </span>
              <a-button
                v-if="current === 0 && tourLaunchMode === 'auto'"
                size="small"
                class="workbench-v2-tour-skip-button"
                @click.stop="skipWorkbenchTour"
              >跳过引导</a-button>
            </div>
          </template>
        </a-tour>
      </a-layout>
    `,
    data() {
      const projectId = getV2ProjectId();
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
        sidebarCollapsed: false,
        v2SidebarHistoryExpanded: true,
        v2SidebarTasksExpanded: true,
        v2SidebarWidth: 260,
        v2DetailHostWidth: 420,
        v2DocWorkspaceColumnWidth: 388,
        v2Resizing: null,
        activeMainView: 'chat',
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
        v2SearchQuery: '',
        v2SkillSearchQuery: '',
        v2SkillScopeTab: 'workbench',
        v2SkillTypeFilter: 'all',
        v2SkillCategoryTab: 'all',
        v2SkillSortBy: 'time',
        v2SkillSortOrder: 'desc',
        v2SharedSkillRows: [],
        v2OtherWorkbenchSkillModalOpen: false,
        v2OtherWorkbenchSkillSearch: '',
        v2BridgeTick: 0,
        v2RightPanel: null,
        v2RightDrawerCollapsed: true,
        v2DocWorkspaceCollapsed: true,
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
        tourAutoShown: false,
        tourLaunchMode: 'manual',
        tourSuppressNextTime: false,
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
        return V2_MAIN_VIEWS;
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
        return this.activeMainView === 'chat' || this.activeMainView === 'task';
      },
      isRightDrawerOpen() {
        return this.isPreviewView && !this.v2DocWorkspaceCollapsed;
      },
      isV2DetailOpen() {
        return this.isPreviewView && !this.v2DocWorkspaceCollapsed && this.v2SourcesRightView === 'detail';
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
        const sidebarW = this.sidebarCollapsed ? '64px' : `${this.v2SidebarWidth}px`;
        const docWorkspaceW = `${this.v2DocWorkspaceWidth}px`;
        const previewTailW = this.isPreviewView ? `calc(${V2_DOC_WORKSPACE_RAIL_WIDTH}px + var(--ds-space-xs))` : '0px';
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
          cols.push(this.isRightDrawerOpen ? `calc(${V2_DOC_WORKSPACE_RAIL_WIDTH}px + var(--ds-space-xs))` : `${V2_DOC_WORKSPACE_RAIL_WIDTH}px`);
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
        const map = { file: '文件目录', database: '库表目录', graph: '图谱目录', knowledge: '知识库', result: '结果目录' };
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
          file: '选择文件查看预览',
          database: '选择库表查看详情',
          graph: '选择图谱查看详情',
          knowledge: '选择知识库查看详情',
          result: '选择结果查看详情',
        };
        return map[this.v2RightPanel] || '选择内容查看详情';
      },
      v2BlankDetailDesc() {
        const map = {
          file: '从右侧文件目录中选择一个文件。',
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
          { key: 'file', label: '文件', icon: '#notes' },
          { key: 'database', label: '数据库表', icon: '#form' },
          { key: 'graph', label: '数据图谱', icon: '#connect' },
          { key: 'knowledge', label: '知识库', icon: '#book' },
          { key: 'result', label: '结果', icon: '#notes' },
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
          key === 'first' ? 'workbench-v2-tour--first' : '',
          key === 'assistant' ? 'workbench-v2-tour--assistant' : '',
          key === 'rail' ? 'workbench-v2-tour--rail' : '',
          key === 'task' ? 'workbench-v2-tour--task-start' : '',
        ].filter(Boolean).join(' ');
      },
      workbenchTourFirstStepDescription() {
        return '这里是审计工作台，你可以通过对话或任务的方式，让 AI 协助你开展资料核查、疑点梳理、结果整理等审计工作。';
      },
      workbenchTourFirstStepCover() {
        if (typeof createVNode !== 'function') return null;
        return createVNode('img', {
          alt: '工作台引导示意图',
          class: 'workbench-v2-tour-cover-image',
          src: V2_WORKBENCH_TOUR_BANNER_SRC,
        });
      },
      workbenchTourFinalDescription() {
        return '在下方输入你想让 AI 协助完成的事项。需要补充材料时，可以先上传附件、引用资料或选择技能，再发送给 AI 处理。';
      },
      workbenchTourFinalPlacement() {
        return 'top';
      },
      workbenchTourSteps() {
        return (this.workbenchTourRawSteps || []).map((step) => {
          const { tourStepKey, ...tourStep } = step;
          return tourStep;
        });
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
      taskCards() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
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
          return merged.concat(fallbackCards.filter((row) => !mergedIds.has(String(row.id || ''))));
        }
        return localCreated.concat(fallbackCards.filter((row) => !localIds.has(String(row.id || ''))));
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
          { key: 'done', label: '成功', tone: 'done', count: count('done') },
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
      v2SkillScopeTabs() {
        return V2_SKILL_SCOPE_TABS;
      },
      v2SkillTypeFilterOptions() {
        return getV2SkillSceneFilterOptions();
      },
      v2SkillTypeFilterLabel() {
        const current = getV2SkillSceneFilterOptions().find((item) => item.id === (this.v2SkillTypeFilter || 'all'));
        return current ? current.label : '全部';
      },
      v2SkillFilterVisible() {
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
        const publicRows = typeof SKILL_SEED_PUBLIC !== 'undefined' && Array.isArray(SKILL_SEED_PUBLIC)
          ? SKILL_SEED_PUBLIC
          : [];
        const sharedRows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        return {
          workbench: fromHost.length ? fromHost.length : fallbackRows.length,
          org: publicRows.filter((raw) => !isV2MarketSkill(raw)).length + sharedRows.length,
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
        const q = String(this.v2SkillSearchQuery || '').trim();
        if (q) return '未找到匹配的技能';
        const baseCards = this.v2SkillBaseCards || [];
        if (this.v2SkillTypeFilter !== 'all') return '当前审计场景下暂无技能';
        if (!baseCards.length) {
          if (this.v2SkillScopeTab === 'workbench') return '暂无当前工作台技能';
          if (this.v2SkillScopeTab === 'org') return '暂无共享技能';
          return '暂无技能市场内容';
        }
        return '当前技能类型下暂无技能';
      },
      v2SkillBaseCards() {
        void this.v2BridgeTick;
        const q = String(this.v2SkillSearchQuery || '').trim().toLowerCase();
        let rows = [];
        if (this.v2SkillScopeTab === 'workbench') {
          rows = this.currentV2WorkbenchSkillRows;
        } else {
          const publicRows = typeof SKILL_SEED_PUBLIC !== 'undefined' && Array.isArray(SKILL_SEED_PUBLIC)
            ? SKILL_SEED_PUBLIC
            : [];
          rows = this.v2SkillScopeTab === 'org'
            ? [
                ...(Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : []),
                ...publicRows.filter((raw) => !isV2MarketSkill(raw)),
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
        const cards = (this.v2SkillBaseCards || [])
          .filter((card) => matchV2SkillCategory(card, this.v2SkillCategoryTab));
        return sortV2SkillCards(cards, this.v2SkillSortBy, this.v2SkillSortOrder);
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
        if (this.activeMainView === 'task') {
          const hit = this.activeTaskContextCard || this.activeTaskCard;
          return (hit && hit.title) || '任务';
        }
        return this.activeConversationTitle;
      },
      showTaskDetailToggle() {
        return this.activeMainView === 'task' && !!this.activeTaskContextCard && (!this.activeTaskIsBatch || !!this.activeBatchChildCard);
      },
    },
    methods: {
      workbenchTourTarget(id) {
        const root = this.$el && typeof this.$el.querySelector === 'function' ? this.$el : document;
        const shell = root.querySelector('[data-tour-id="workbench-shell"]') || root.querySelector('.workbench-v2-shell') || this.$el;
        const fallback = root.querySelector('[data-tour-id="workbench-main"]') || shell;
        const target = id ? root.querySelector(`[data-tour-id="${id}"]`) : shell;
        if (!target || typeof target.getBoundingClientRect !== 'function') return fallback || null;
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return fallback || null;
        return target;
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
      workbenchTourPrevButtonProps() {
        return { children: '上一步' };
      },
      workbenchTourNextButtonProps(label = '下一步') {
        return { children: label };
      },
      emptyWorkbenchTourSteps() {
        const prevButtonProps = this.workbenchTourPrevButtonProps();
        return [
          {
            tourStepKey: 'first',
            title: '欢迎进入 KianKun 审计分析平台',
            description: this.workbenchTourFirstStepDescription,
            cover: this.workbenchTourFirstStepCover,
            target: null,
            nextButtonProps: this.workbenchTourNextButtonProps('如何使用'),
          },
          {
            tourStepKey: 'sidebar',
            title: '左侧：工作记录和操作入口',
            description: '这里用于管理当前工作台内的对话和任务。你可以查看历史记录，也可以新建对话或任务，继续推进审计工作。',
            target: () => this.workbenchTourTarget('workbench-sidebar'),
            placement: 'right',
            prevButtonProps,
            nextButtonProps: this.workbenchTourNextButtonProps(),
          },
          {
            tourStepKey: 'assistant',
            title: '中间：当前对话区',
            description: '这里是你和 AI 协作的主要区域。你可以上传附件、输入核查事项，并围绕同一问题连续追问；AI 的分析过程和生成内容也会在这里呈现。',
            target: () => this.workbenchTourAssistantTarget(),
            placement: 'left',
            prevButtonProps,
            nextButtonProps: this.workbenchTourNextButtonProps(),
          },
          {
            tourStepKey: 'rail',
            title: '右侧：审计资源区',
            description: '这里存放当前审计工作可用的资料、数据、知识和结果。你可以添加、浏览资源，也可以基于这些资源发起对话或创建任务，让 AI 协助核查分析。',
            target: () => this.workbenchTourTarget('workbench-rail'),
            placement: 'left',
            prevButtonProps,
            nextButtonProps: this.workbenchTourNextButtonProps(),
          },
          {
            tourStepKey: 'final',
            title: '从输入框开始',
            description: this.workbenchTourFinalDescription,
            target: () => this.workbenchTourFinalTarget(),
            placement: this.workbenchTourFinalPlacement,
            prevButtonProps,
            nextButtonProps: this.workbenchTourNextButtonProps('完成'),
          },
        ];
      },
      workbenchTourIndicatorItems(total) {
        const count = Math.max(0, Number(total) || 0);
        return Array.from({ length: count }, (_, index) => index);
      },
      getWorkbenchTourStorageKey() {
        return `workbenchTourSeen:${this.projectId || 'default'}`;
      },
      hasSeenWorkbenchTour() {
        try {
          return window.localStorage.getItem(this.getWorkbenchTourStorageKey()) === '1';
        } catch (_) {
          return false;
        }
      },
      markWorkbenchTourSeen() {
        try {
          window.localStorage.setItem(this.getWorkbenchTourStorageKey(), '1');
        } catch (_) { /* noop */ }
      },
      clearWorkbenchTourSeen() {
        try {
          window.localStorage.removeItem(this.getWorkbenchTourStorageKey());
        } catch (_) { /* noop */ }
      },
      saveWorkbenchTourPreference() {
        if (this.tourSuppressNextTime) this.markWorkbenchTourSeen();
        else this.clearWorkbenchTourSeen();
      },
      openWorkbenchTour(isAuto = false) {
        if (isAuto && this.hasSeenWorkbenchTour()) return;
        this.tourLaunchMode = isAuto ? 'auto' : 'manual';
        this.tourCurrent = 0;
        this.tourSuppressNextTime = this.hasSeenWorkbenchTour();
        this.tourOpen = true;
        if (isAuto) this.tourAutoShown = true;
      },
      closeWorkbenchTour() {
        this.tourOpen = false;
        this.saveWorkbenchTourPreference();
      },
      finishWorkbenchTour() {
        this.tourOpen = false;
        this.saveWorkbenchTourPreference();
      },
      skipWorkbenchTour() {
        this.tourSuppressNextTime = true;
        this.markWorkbenchTourSeen();
        this.tourOpen = false;
      },
      scheduleWorkbenchTourAutoOpen() {
        if (this.tourAutoShown || this.hasSeenWorkbenchTour()) return;
        if (this._workbenchTourTimer) window.clearTimeout(this._workbenchTourTimer);
        this._workbenchTourTimer = window.setTimeout(() => {
          this._workbenchTourTimer = null;
          this.openWorkbenchTour(true);
        }, 180);
      },
      setMainView(view) {
        const next = String(view || 'chat');
        if (!['search', 'skill', 'chat', 'task'].includes(next)) return;
        this.activeMainView = next;
        this.$nextTick(() => {
          this.syncRightDrawerFromHost();
          this.v2BridgeTick += 1;
        });
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
        const scope = active.scopeLabel || '文件';
        const title = String(active.title || '').trim();
        const tab = active.raw || null;
        if (scope === '文件') {
          const row = (host && host.workbenchSelectedProjectMaterialRow)
            || (host && host.selectedMaterial && host.selectedMaterial.projectSource)
            || (tab && tab.resourceRow)
            || null;
          const folders = (host && host.workbenchMaterialFoldersList) || [];
          const prefix = row ? wbMatMaterialPathPrefixForRow(row, folders) : '';
          const segs = prefix.split('/').map((item) => String(item || '').trim()).filter(Boolean);
          return ['文件', ...segs, title].filter(Boolean);
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
          return '文件';
        }
        if (tab.kind === 'material') {
          const materialId = String(tab.materialId || '').trim();
          const material = host && Array.isArray(host.materials)
            ? host.materials.find((item) => item && String(item.id || '') === materialId)
            : null;
          return material && material.type === 'analysis' ? '结果' : '文件';
        }
        if (tab.kind === 'extraction') return '库表';
        if (tab.kind === 'skill') return '技能';
        return '文件';
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
      findV2InstalledSkillForLibraryCard(card) {
        const raw = card && card.raw;
        const sourceId = getV2SkillSourceId(raw);
        if (!sourceId) return null;
        return (this.currentV2WorkbenchSkillRows || []).find((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return itemSourceId && itemSourceId === sourceId;
        }) || null;
      },
      v2SkillCardAlreadyAdded(card) {
        if (this.v2SkillScopeTab === 'workbench') return false;
        return this.isV2SkillAlreadyAdded(card && card.raw);
      },
      v2SkillCardCtaLabel(card) {
        if (this.v2SkillScopeTab === 'workbench') return '使用';
        return this.v2SkillCardAlreadyAdded(card) ? '已添加' : '添加';
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
        if (!card) return;
        if (this.v2SkillScopeTab === 'workbench') {
          this.citeSkillCard(card);
          return;
        }
        if (this.v2SkillCardAlreadyAdded(card)) {
          if (typeof message !== 'undefined' && message.info) message.info('该技能已添加到当前工作台');
          return;
        }
        this.installV2SkillCard(card);
      },
      onV2AddedSkillMenu(key, card) {
        const action = String(key || '');
        if (action === 'try') this.tryInstalledSkillFromLibraryCard(card);
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
      installV2SkillCard(card) {
        const raw = card && card.raw;
        const pid = String(this.projectId || '').trim();
        if (!raw || !pid || typeof demoProjectAnalysisTemplatesById === 'undefined') return;
        const sourceId = getV2SkillSourceId(raw);
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
        const row = buildV2InstalledSkill(raw);
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
          this.openSkillCard(card);
        } else if (action === 'share') {
          this.shareSkillCard(card);
        } else if (action === 'delete') {
          this.deleteSkillCard(card);
        }
      },
      createWorkbenchSkill() {
        const host = this.capabilityHost;
        if (host && typeof host.onWorkbenchTemplateAddMenu === 'function') {
          host.onWorkbenchTemplateAddMenu({ key: 'new' });
        }
      },
      onV2SkillCreateMenu({ key }) {
        const action = String(key || '');
        if (action === 'copy-from-other') {
          this.openV2OtherWorkbenchSkillModal();
        }
      },
      openSkillCard(card) {
        const host = this.capabilityHost;
        if (!host || !card || !card.node) return;
        const readOnly = this.v2SkillScopeTab !== 'workbench';
        if (typeof host.openWbProjectSkillDetailFromNode === 'function') {
          host.openWbProjectSkillDetailFromNode(card.node, { readOnly, forceModal: readOnly });
        } else if (typeof host.selectWorkbenchSkillTemplate === 'function') {
          host.selectWorkbenchSkillTemplate(card.node);
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
        return rows.some((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return itemSourceId && itemSourceId === sourceId;
        });
      },
      v2SkillCardShareMenuLabel(card) {
        return this.v2SkillCardIsShared(card) ? '取消共享' : '共享';
      },
      shareSkillCard(card) {
        const raw = card && card.raw;
        if (!raw) return;
        const sourceId = getV2SkillSourceId(raw);
        const rows = Array.isArray(this.v2SharedSkillRows) ? this.v2SharedSkillRows : [];
        const index = rows.findIndex((item) => {
          const itemSourceId = getV2SkillSourceId(item);
          return sourceId && itemSourceId === sourceId;
        });
        const existed = index >= 0;
        const name = String(card.name || raw.name || '未命名技能').trim() || '未命名技能';
        if (existed) {
          const dc = window.dsConfirm;
          const doUnshare = () => {
            this.v2SharedSkillRows = rows.filter((_, i) => i !== index);
            this.v2BridgeTick += 1;
            if (typeof message !== 'undefined' && message.success) {
              message.success(`「${name}」已取消共享`);
            }
          };
          if (dc && typeof dc.action === 'function') {
            dc.action({
              title: '取消共享？',
              content: `取消后，该技能将从共享技能中移除；你仍可在当前工作台继续维护。`,
              okText: '取消共享',
              onOk: doUnshare,
            });
            return;
          }
          doUnshare();
          return;
        }
        const row = buildV2SharedSkill(raw);
        if (!row) return;
        if (typeof window !== 'undefined' && window.DemoSkillFileTree && window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
          window.DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
        }
        this.v2SharedSkillRows = [row, ...rows];
        this.v2BridgeTick += 1;
        if (typeof message !== 'undefined' && message.success) {
          message.success(`「${name}」已共享，可在「共享技能」中查看`);
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
                : `任务已完成。产出「${resultTitle || title}」已沉淀到结果侧，右上角任务详情中可查看配置、引用资源和基本信息。`,
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
          const ordered = ['abort', 'rerun', 'delete'].filter((action) => this.workbenchBulkActionCount(action, area) > 0);
          if (group === 'primary') return ordered.filter((action) => action !== 'delete');
          if (group === 'more') return ordered.includes('delete') ? ['delete'] : [];
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
          const label = ({ abort: '中止', rerun: '重跑', delete: '删除' })[action] || action;
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
        this.openTaskCard(item);
      },
      refreshV2BatchChildList() {
        const host = this.capabilityHost;
        if (host && typeof host.refreshWorkbenchDemoResources === 'function') {
          host.refreshWorkbenchDemoResources('task');
          this.v2BridgeTick += 1;
        }
      },
      handleV2BatchParentHeaderMenu(key) {
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
        this.v2TaskDetailLayout = 'overlay';
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
      openTaskBasicInfo() {
        if (!this.activeTaskContextCard) return;
        this.v2TaskBasicInfoModalOpen = true;
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
        this._v2TaskCreateSyncTimer = window.setInterval(() => this.syncCreatedTasksFromHost(), 300);
        this.ensureV2TaskDetailLayoutObserver();
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
        if (this._v2TaskCreateSyncTimer) {
          window.clearInterval(this._v2TaskCreateSyncTimer);
          this._v2TaskCreateSyncTimer = null;
        }
        if (this._workbenchTourTimer) {
          window.clearTimeout(this._workbenchTourTimer);
          this._workbenchTourTimer = null;
        }
        if (this._v2TaskDetailLayoutObserver) {
          this._v2TaskDetailLayoutObserver.disconnect();
          this._v2TaskDetailLayoutObserver = null;
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
      v2TaskDetailVisible() {
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
      },
      activeMainView() {
        this.$nextTick(() => this.ensureV2TaskDetailLayoutObserver());
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
