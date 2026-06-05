(function () {
  const app = window.__DEMO_APP;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const freeauditPanels = (window.DemoFreeAudit && window.DemoFreeAudit.panels) || {};
  const CHAT_DEMO_SCENARIOS = freeauditUtils.CHAT_DEMO_SCENARIOS || [];
  const resolveWorkbenchDemoScenario = freeauditUtils.resolveWorkbenchDemoScenario;
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};

  const V2_RAIL_TOOLS = [
    { id: 'toggle', label: '展开或收起右栏', icon: '#right-bar', panel: 'toggle' },
    { id: 'file', label: '文件', icon: '#notes', panel: 'file' },
    { id: 'database', label: '库表', icon: '#form', panel: 'database' },
    { id: 'graph', label: '图谱', icon: '#connect', panel: 'graph' },
    { id: 'knowledge', label: '知识库', icon: '#book', panel: 'knowledge' },
    { id: 'result', label: '结果', icon: '#notes', panel: 'result' },
  ];

  const V2_MAIN_VIEWS = [
    { id: 'search', label: '搜索', icon: 'search' },
    { id: 'skill', label: '技能', icon: 'book-open' },
  ];

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

  function getInitialConversationId(projectId) {
    const scenario = typeof resolveWorkbenchDemoScenario === 'function'
      ? resolveWorkbenchDemoScenario(projectId)
      : null;
    return (scenario && scenario.id) || (CHAT_DEMO_SCENARIOS[0] && CHAT_DEMO_SCENARIOS[0].id) || '';
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
      return ref;
    }
    if (attempt < 10) setTimeout(() => registerCapabilityHost(vm, attempt + 1), 50);
    return null;
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
    emits: ['navigate'],
    template: `
      <a-layout
        class="workbench-v2-shell"
        :class="{
          'is-sidebar-collapsed': sidebarCollapsed,
          'is-preview-enabled': isPreviewView,
          'is-right-drawer-open': isRightDrawerOpen,
          'is-detail-open': isV2DetailOpen,
          'is-v2-resizing': !!v2Resizing,
        }"
        :style="v2ShellGridStyle"
      >
        <aside class="workbench-v2-sidebar" aria-label="工作台对话与任务">
          <div class="workbench-v2-brand">
            <button
              type="button"
              class="workbench-v2-brand__mark"
              :title="sidebarCollapsed ? '展开左栏' : '浙江审计综合分析'"
              :aria-label="sidebarCollapsed ? '展开左栏' : '浙江审计综合分析'"
              @click="handleBrandMarkClick"
            >
              <svg class="iconpark-icon workbench-v2-brand__logo" aria-hidden="true"><use href="#workbench"></use></svg>
              <ds-icon class="workbench-v2-brand__expand" name="angles-right" aria-hidden="true" />
            </button>
            <span class="workbench-v2-brand__text">
              <span class="workbench-v2-brand__name">浙江审计综合分析</span>
              <span class="workbench-v2-brand__sub">Audit Analytics</span>
            </span>
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
          <div class="workbench-v2-sidebar-actions" aria-label="主内容">
            <button
              type="button"
              class="workbench-v2-sidebar-action"
              title="新建会话"
              aria-label="新建会话"
              @click="newSession"
            >
              <ds-icon name="plus" aria-hidden="true" />
              <span>新建会话</span>
            </button>
            <button
              type="button"
              class="workbench-v2-sidebar-action"
              title="新建任务"
              aria-label="新建任务"
              @click="openTaskCreate"
            >
              <ds-icon name="plus" aria-hidden="true" />
              <span>新建任务</span>
            </button>
            <button
              v-for="view in mainViews"
              :key="view.id"
              type="button"
              class="workbench-v2-sidebar-action"
              :class="{ 'is-active': activeMainView === view.id }"
              @click="setMainView(view.id)"
            >
              <ds-icon :name="view.icon" aria-hidden="true" />
              <span>{{ view.label }}</span>
            </button>
          </div>
          <section class="workbench-v2-conversation-list" aria-label="历史对话和任务列表">
            <h2 class="workbench-v2-project-title" :title="projectTitle">{{ projectTitle }}</h2>
            <div class="workbench-v2-nav-group workbench-v2-nav-group--history">
              <h3 class="workbench-v2-section-label">对话</h3>
              <button
                v-for="item in historyConversations"
                :key="item.id"
                type="button"
                class="workbench-v2-conversation"
                :class="{ 'is-active': item.id === activeConversationId }"
                @click="selectHistoryConversation(item)"
              >
                <span class="workbench-v2-conversation__icon" aria-hidden="true"><ds-icon name="chat-ref" /></span>
                <span class="workbench-v2-conversation__main">
                  <span class="workbench-v2-conversation__title">{{ item.title }}</span>
                </span>
                <span v-if="item.timeLabel" class="workbench-v2-conversation__time">{{ item.timeLabel }}</span>
              </button>
              <div v-if="!historyConversations.length" class="workbench-v2-list-empty">暂无历史对话</div>
            </div>
            <div class="workbench-v2-nav-group workbench-v2-nav-group--tasks">
              <h3 class="workbench-v2-section-label">任务</h3>
              <div
                v-for="item in taskList"
                :key="item.id"
                class="workbench-v2-conversation workbench-v2-conversation--task"
                :class="{ 'is-active': item.id === activeTaskId }"
                role="button"
                tabindex="0"
                @click="openTaskCard(item)"
                @keydown.enter.prevent="openTaskCard(item)"
                @keydown.space.prevent="openTaskCard(item)"
              >
                <span class="workbench-v2-conversation__icon" :class="item.iconClass" aria-hidden="true">
                  <ds-icon :name="item.iconName" :title="item.iconTitle" />
                </span>
                <span class="workbench-v2-conversation__main">
                  <span class="workbench-v2-conversation__title">{{ item.title }}</span>
                </span>
                <span v-if="item.timeLabel" class="workbench-v2-conversation__time">{{ item.timeLabel }}</span>
                <span
                  v-else-if="item.statusIcon"
                  class="workbench-v2-conversation__status-icon"
                  :class="item.statusIcon.className"
                  :title="item.statusLabel"
                  :aria-label="item.statusLabel"
                >
                  <ds-icon v-if="item.statusIcon.kind === 'ds'" :name="item.statusIcon.name" />
                  <svg v-else class="iconpark-icon" aria-hidden="true" focusable="false"><use :href="'#' + item.statusIcon.name"></use></svg>
                </span>
                <span v-else class="workbench-v2-conversation__state" :class="'is-' + item.status">{{ item.statusLabel }}</span>
                <span class="workbench-v2-conversation__actions" @click.stop>
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
              <div v-if="!taskList.length" class="workbench-v2-list-empty">暂无任务</div>
            </div>
          </section>
          <div class="workbench-v2-sidebar-footer">
            <button type="button" class="workbench-v2-sidebar-action workbench-v2-sidebar-action--quiet" title="编辑工作台" aria-label="编辑工作台" @click="openWorkbenchSettings">
              <svg class="iconpark-icon" aria-hidden="true"><use href="#tool"></use></svg>
              <span>设置</span>
            </button>
          </div>
        </aside>

        <div
          v-if="!sidebarCollapsed"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          title="调整左栏宽度"
          @mousedown.stop.prevent="beginV2Resize('sidebar', $event)"
        ></div>

        <main class="workbench-v2-main">
          <header class="workbench-v2-header">
            <div class="workbench-v2-header__left">
              <div class="workbench-v2-title-group">
                <h1 class="workbench-v2-title">{{ activeMainTitle }}</h1>
              </div>
            </div>
            <div class="workbench-v2-header__right">
              <button v-if="activeMainView === 'chat'" type="button" class="nlm-assistant-header-btn workbench-v2-generate-skill-btn" title="生成技能" aria-label="生成技能" @click="openGenerateSkillConfig">
                <ds-icon name="tips" aria-hidden="true" />
                <span>生成技能</span>
              </button>
              <template v-else-if="activeMainView === 'skill'">
                <button type="button" class="nlm-assistant-header-btn" title="引用技能" aria-label="引用技能" @click="quoteWorkbenchSkill">
                  <ds-icon name="book-open" aria-hidden="true" />
                  <span>引用技能</span>
                </button>
                <button type="button" class="nlm-assistant-header-btn workbench-v2-generate-skill-btn" title="创建技能" aria-label="创建技能" @click="createWorkbenchSkill">
                  <ds-icon name="plus" aria-hidden="true" />
                  <span>创建技能</span>
                </button>
              </template>
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

          <section v-show="activeMainView === 'skill'" class="workbench-v2-view-stage workbench-v2-skill-view" aria-label="工作台技能">
            <div class="workbench-v2-view-toolbar">
              <a-input
                v-model:value="v2SkillSearchQuery"
                allow-clear
                placeholder="搜索技能名称或标签"
                class="ds-input-inline-search"
              >
                <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
              </a-input>
            </div>
            <div class="workbench-v2-skill-grid">
              <article v-for="card in v2SkillCards" :key="card.key" class="workbench-v2-skill-card">
                <div class="workbench-v2-skill-card__top">
                  <span class="workbench-v2-skill-card__icon"><ds-icon name="book-open" aria-hidden="true" /></span>
                  <button type="button" class="workbench-v2-icon-action" title="编辑" aria-label="编辑技能" @click="openSkillCard(card)">
                    <ds-icon name="edit" aria-hidden="true" />
                  </button>
                </div>
                <h2>{{ card.name }}</h2>
                <p>{{ card.description }}</p>
                <div class="workbench-v2-tag-row">
                  <span v-for="tag in card.tags" :key="card.key + '-' + tag" class="workbench-v2-tag">{{ tag }}</span>
                </div>
                <div class="workbench-v2-card-actions-row">
                  <button type="button" class="workbench-v2-text-btn" @click="citeSkillCard(card)">
                    <ds-icon name="chat-ref" aria-hidden="true" />
                    <span>引用</span>
                  </button>
                  <button type="button" class="workbench-v2-text-btn" @click="archiveSkillCard(card)">入库</button>
                  <button type="button" class="workbench-v2-icon-action" title="删除" aria-label="删除技能" @click="deleteSkillCard(card)">
                    <ds-icon name="delete" aria-hidden="true" />
                  </button>
                </div>
              </article>
              <div v-if="!v2SkillCards.length" class="workbench-v2-empty-panel">暂无技能</div>
            </div>
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
                  <div class="wb-task-batch-children-view workbench-v2-batch-child-old-list">
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
          v-if="isV2DetailOpen"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-main-detail-resizer"
          role="separator"
          aria-orientation="vertical"
          title="调整详情预览宽度"
          @mousedown.stop.prevent="beginV2Resize('detailHost', $event)"
        ></div>
        <div
          id="workbench-v2-detail-host"
          class="workbench-v2-detail-host"
          :class="{ 'is-open': isV2DetailOpen }"
          aria-label="工作台详情预览"
        ></div>
        <div
          v-if="isRightDrawerOpen && isV2DetailOpen"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-detail-drawer-resizer"
          role="separator"
          aria-orientation="vertical"
          title="调整详情预览与右栏分界"
          @mousedown.stop.prevent="beginV2Resize('detailDrawer', $event)"
        ></div>
        <div
          v-if="isRightDrawerOpen && !isV2DetailOpen"
          class="nlm-resizer workbench-v2-col-resizer workbench-v2-main-drawer-resizer"
          role="separator"
          aria-orientation="vertical"
          title="调整右栏宽度"
          @mousedown.stop.prevent="beginV2Resize('drawer', $event)"
        ></div>
        <div
          id="workbench-v2-right-drawer-host"
          class="workbench-v2-right-drawer-host"
          :class="{ 'is-open': isRightDrawerOpen }"
          :style="rightDrawerHostStyle"
          aria-label="工作台右栏目录"
        ></div>

        <aside v-if="isPreviewView" class="workbench-v2-rail" aria-label="工作台工具">
          <button
            v-for="tool in railTools"
            :key="tool.id"
            type="button"
            class="workbench-v2-rail__btn"
            :class="{ 'is-active': tool.active }"
            :title="tool.label"
            :aria-label="tool.label"
            :aria-pressed="tool.active ? 'true' : 'false'"
            @click="onRailToolClick(tool)"
          >
            <svg class="iconpark-icon" aria-hidden="true"><use :href="tool.icon"></use></svg>
          </button>
        </aside>
      </a-layout>
    `,
    data() {
      const projectId = getV2ProjectId();
      return {
        projectId,
        activeConversationId: getInitialConversationId(projectId),
        draftConversationTitle: '',
        v2SavedSessions: [],
        sidebarCollapsed: false,
        v2SidebarWidth: 260,
        v2DetailHostWidth: 420,
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
        v2BridgeTick: 0,
        v2RightPanel: null,
        v2RightDrawerCollapsed: true,
        v2StudioWidth: 340,
        v2SourcesRightView: 'list',
        capabilityHostReady: false,
      };
    },
    computed: {
      projectTitle() {
        return getProjectTitle(this.projectId);
      },
      mainViews() {
        return V2_MAIN_VIEWS;
      },
      capabilityHost() {
        return resolveCapabilityHost(this);
      },
      isPreviewView() {
        return this.activeMainView === 'chat' || this.activeMainView === 'task';
      },
      isRightDrawerOpen() {
        return this.isPreviewView && !this.v2RightDrawerCollapsed && !!this.v2RightPanel;
      },
      isV2DetailOpen() {
        return this.isPreviewView && this.v2SourcesRightView === 'detail';
      },
      v2ShellGridStyle() {
        const cols = [];
        cols.push(this.sidebarCollapsed ? '64px' : `${this.v2SidebarWidth}px`);
        if (!this.sidebarCollapsed) cols.push('8px');
        cols.push('minmax(280px, 1fr)');
        if (this.isV2DetailOpen) {
          cols.push('8px');
          const detailW = Math.min(720, Math.max(280, Number(this.v2DetailHostWidth) || 420));
          cols.push(`${detailW}px`);
        }
        if (this.isRightDrawerOpen) {
          cols.push('8px');
          const drawerW = Math.min(500, Math.max(240, Number(this.v2StudioWidth) || 340));
          cols.push(`${drawerW}px`);
        }
        if (this.isPreviewView) cols.push('48px');
        return { gridTemplateColumns: cols.join(' ') };
      },
      rightDrawerHostStyle() {
        if (this.v2RightDrawerCollapsed || !this.v2RightPanel) {
          return { display: 'none' };
        }
        return {
          width: '100%',
          minWidth: 0,
          maxWidth: 'none',
          minHeight: 0,
          height: '100%',
        };
      },
      railTools() {
        const panel = this.v2RightPanel;
        const open = this.isRightDrawerOpen;
        return V2_RAIL_TOOLS.map((tool) => {
          let active = false;
          if (tool.panel === 'toggle') active = open;
          else if (open && panel === tool.panel) active = true;
          return { ...tool, active };
        });
      },
      historyConversations() {
        const activeId = getInitialConversationId(this.projectId);
        const saved = (this.v2SavedSessions || []).map((session) => ({
          id: session.id,
          title: String(session.title || '').trim() || '未命名对话',
          meta: '历史对话',
          timeLabel: '刚刚',
          source: 'session',
        }));
        const scenarios = (CHAT_DEMO_SCENARIOS || []).map((scenario) => ({
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
        return saved.concat(scenarios);
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
      v2SkillCards() {
        void this.v2BridgeTick;
        const host = this.capabilityHost;
        const fromHost = host && Array.isArray(host.workbenchProjectTemplates)
          ? host.workbenchProjectTemplates
          : [];
        const fallbackMap = (window.DemoData && window.DemoData.projectAnalysisTemplatesByProject) || {};
        const fallbackRows = Array.isArray(fallbackMap[this.projectId]) ? fallbackMap[this.projectId] : [];
        const rows = fromHost.length ? fromHost : fallbackRows;
        const q = String(this.v2SkillSearchQuery || '').trim().toLowerCase();
        return rows
          .map((raw) => {
            const id = String((raw && raw.id) || '').trim();
            const node = { source: 'template', id, key: `project:${id || 'unknown'}`, scope: 'project', raw };
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
              tags,
            };
          })
          .filter((card) => {
            if (!q) return true;
            const hay = [card.name, card.description, ...(card.tags || [])].join(' ').toLowerCase();
            return hay.includes(q);
          });
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
        if (this.sidebarCollapsed) this.expandSidebar();
      },
      syncRightDrawerFromHost(sourceHost) {
        const host = sourceHost || resolveCapabilityHost(this);
        if (!host) return;
        const prevSourcesRightView = this.v2SourcesRightView;
        this.v2RightPanel = host.workbenchV2RightPanel;
        this.v2RightDrawerCollapsed = host.workbenchV2RightDrawerCollapsed;
        this.v2StudioWidth = host.studioWidth;
        this.v2SourcesRightView = host.sourcesRightView;
        if (!this.v2Resizing && host.sourcesRightView === 'detail' && prevSourcesRightView !== 'detail') {
          const detailW = Number(host.sourcesDetailWidth) || this.v2DetailHostWidth;
          this.v2DetailHostWidth = Math.min(720, Math.max(280, detailW));
        }
        this.v2BridgeTick += 1;
      },
      onRailToolClick(tool) {
        if (!this.isPreviewView) return;
        selectCapabilityHostRail(this, tool && tool.panel);
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
      clampV2DetailHostWidth(width) {
        const shell = this.$el && typeof this.$el.getBoundingClientRect === 'function'
          ? this.$el
          : document.querySelector('.workbench-v2-shell');
        const shellWidth = shell ? shell.getBoundingClientRect().width : 0;
        let maxDetailWidth = 720;
        if (shellWidth) {
          const sidebarW = this.sidebarCollapsed ? 64 : Math.min(400, Math.max(200, Number(this.v2SidebarWidth) || 260));
          const sidebarResizerW = this.sidebarCollapsed ? 0 : 8;
          const detailResizerW = 8;
          const drawerW = this.isRightDrawerOpen ? Math.min(500, Math.max(240, Number(this.v2StudioWidth) || 340)) : 0;
          const drawerResizerW = this.isRightDrawerOpen ? 8 : 0;
          const railW = this.isPreviewView ? 48 : 0;
          const mainMinW = 280;
          const fixedW = sidebarW + sidebarResizerW + detailResizerW + drawerResizerW + drawerW + railW;
          maxDetailWidth = Math.min(maxDetailWidth, shellWidth - fixedW - mainMinW);
        }
        maxDetailWidth = Math.max(280, maxDetailWidth);
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
        this.activeMainView = 'chat';
        this.activeTaskId = '';
        this.activeBatchChildId = '';
        this.activeConversationId = '';
        this.draftConversationTitle = '新建对话';
        this.v2TaskBasicInfoModalOpen = false;
        this.$nextTick(() => resetCapabilityHostForNewSession(this, true));
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
        this.activeConversationId = id;
        this.draftConversationTitle = '';
      },
      patchHostSendBridge() {
        const host = this.capabilityHost;
        if (!host || host._workbenchV2SendPatched || typeof host.sendChat !== 'function') return;
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
      quoteWorkbenchSkill() {
        const host = this.capabilityHost;
        if (!host) return;
        if (typeof host.openTemplateLibrary === 'function') {
          host.openTemplateLibrary();
          return;
        }
        if (typeof host.onWorkbenchTemplateAddMenu === 'function') {
          host.onWorkbenchTemplateAddMenu({ key: 'library' });
        }
      },
      createWorkbenchSkill() {
        const host = this.capabilityHost;
        if (host && typeof host.onWorkbenchTemplateAddMenu === 'function') {
          host.onWorkbenchTemplateAddMenu({ key: 'new' });
        }
      },
      openSkillCard(card) {
        const host = this.capabilityHost;
        if (!host || !card || !card.node) return;
        if (typeof host.openWbProjectSkillDetailFromNode === 'function') {
          host.openWbProjectSkillDetailFromNode(card.node, { readOnly: false });
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
      archiveSkillCard(card) {
        const host = this.capabilityHost;
        if (host && card && card.node && typeof host.onWbProjectSkillTreeMenu === 'function') {
          host.onWbProjectSkillTreeMenu({ key: 'archive' }, card.node);
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
        const host = this.syncHostBatchChildListState();
        if (!host) return;
        if (typeof host.startWorkbenchBulkMode === 'function') host.startWorkbenchBulkMode(area, scope);
        if (area === 'task' && scope === 'batch-child' && !this.workbenchBulkScopeActive(area, scope)) {
          host.workbenchBulkSelection = { area: 'task', scope: 'batch-child', keys: [] };
        }
        this.v2BridgeTick += 1;
      },
      resetWorkbenchBulkSelection(area) {
        if (area === 'task') {
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
        if (area === 'task') return this.v2BatchChildBulkKeys.length;
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkSelectedCount === 'function' ? host.workbenchBulkSelectedCount(area) : 0;
      },
      workbenchBulkActionKeys(area, group) {
        if (area === 'task') {
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
        if (area === 'task') {
          const label = this.workbenchBulkActionMenuLabel(action, area).replace(/（.*$/, '');
          const count = this.workbenchBulkActionCountText(action, area);
          return count ? `${label}（${count}）` : label;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionTooltip === 'function' ? host.workbenchBulkActionTooltip(action, area) : '';
      },
      workbenchBulkActionCount(action, area) {
        if (area === 'task') {
          return this.filteredV2BatchChildCards
            .filter((child) => this.v2BatchChildBulkKeys.includes(`task:item:${this.getV2BatchChildRaw(child).id}`))
            .filter((child) => (this.workbenchBulkBatchChildDescriptor(child).availableActions || []).includes(action))
            .length;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionCount === 'function' ? host.workbenchBulkActionCount(action, area) : 0;
      },
      workbenchBulkActionCountText(action, area) {
        if (area === 'task') {
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
        if (area === 'task') {
          const label = ({ abort: '中止', rerun: '重跑', delete: '删除' })[action] || action;
          const count = this.workbenchBulkActionCountText(action, area);
          return count ? `${label}（${count}）` : label;
        }
        const host = this.syncHostBatchChildListState();
        return host && typeof host.workbenchBulkActionMenuLabel === 'function' ? host.workbenchBulkActionMenuLabel(action, area) : '';
      },
      onWorkbenchBulkAction(area, action) {
        if (area === 'task') {
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
        const rootStyle = getComputedStyle(document.documentElement);
        const chatMaxRaw = rootStyle.getPropertyValue('--nlm-chat-messages-max-width').trim();
        const chatMax = Number.parseFloat(chatMaxRaw) || 800;
        const gapRaw = rootStyle.getPropertyValue('--ds-space-m').trim();
        const gap = Number.parseFloat(gapRaw) || 16;
        const detailWidth = 320;
        const chatWidth = Math.min(chatMax, containerWidth);
        const remaining = containerWidth - chatWidth;
        this.v2TaskDetailLayout = remaining >= detailWidth + gap ? 'dock' : 'overlay';
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
      onSidebarTaskMenu(key, item) {
        const host = this.capabilityHost;
        const raw = item && item.raw;
        if (!host || !raw || typeof host.handleTreeContextMenu !== 'function') return;
        host.handleTreeContextMenu(key, { id: raw.id, raw }, 'analysis', 'task');
      },
      openGenerateSkillConfig() {
        const host = this.capabilityHost;
        if (host && typeof host.openGenerateSkillConfigModal === 'function') {
          host.openGenerateSkillConfigModal();
        }
      },
      syncProjectFromHash() {
        this.projectId = getV2ProjectId();
        this.activeConversationId = getInitialConversationId(this.projectId);
        this.activeTaskId = '';
        this.draftConversationTitle = '';
        this.v2SavedSessions = [];
        this.v2CreatedTasks = [];
      },
    },
    mounted() {
      this._boundV2ResizeMove = (e) => this.onV2ResizeMove(e);
      this._boundV2ResizeStop = () => this.stopV2Resize();
      const onHashChange = () => this.syncProjectFromHash();
      window.addEventListener('hashchange', onHashChange);
      window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE = (task) => this.onCapabilityHostTaskCreated(task);
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
            ].join('|');
          },
          () => this.syncRightDrawerFromHost()
        );
        this._v2TaskCreateSyncTimer = window.setInterval(() => this.syncCreatedTasksFromHost(), 300);
        this.ensureV2TaskDetailLayoutObserver();
        });
      });
      this._workbenchV2Cleanup = () => {
        window.removeEventListener('hashchange', onHashChange);
        if (window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE) window.__DEMO_FREEAUDIT_TASK_CREATED_BRIDGE = null;
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
    },
    beforeUnmount() {
      if (this._workbenchV2Cleanup) this._workbenchV2Cleanup();
    },
  });
})();
