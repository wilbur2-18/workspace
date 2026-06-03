(function () {
  const app = window.__DEMO_APP;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const CHAT_DEMO_SCENARIOS = freeauditUtils.CHAT_DEMO_SCENARIOS || [];
  const resolveWorkbenchDemoScenario = freeauditUtils.resolveWorkbenchDemoScenario;
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};

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

  function getTaskStatusIcon(status) {
    const normalized = String(status || '').trim();
    if (normalized === 'queued') return { kind: 'ds', name: 'clock', className: 'is-queued' };
    if (normalized === 'parsing') return { kind: 'symbol', name: 'loading-four', className: 'is-parsing is-spin' };
    if (normalized === 'failed') return { kind: 'symbol', name: 'close-one', className: 'is-failed' };
    return null;
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
        };
      });
  }

  app.component('FreeAuditWorkbenchV2', {
    emits: ['navigate'],
    template: `
      <a-layout class="workbench-v2-shell" :class="{ 'is-sidebar-collapsed': sidebarCollapsed }">
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
              <ds-icon name="angles-left" aria-hidden="true" />
            </button>
          </div>
          <div class="workbench-v2-sidebar-actions" aria-label="常用操作">
            <button type="button" class="workbench-v2-sidebar-action" @click="newSession">
              <ds-icon name="plus" aria-hidden="true" />
              <span>新建对话</span>
            </button>
            <button type="button" class="workbench-v2-sidebar-action" @click="openTaskCreate">
              <ds-icon name="check-circle" aria-hidden="true" />
              <span>新建任务</span>
            </button>
            <button type="button" class="workbench-v2-sidebar-action" @click="openWorkbenchSearch">
              <ds-icon name="search" aria-hidden="true" />
              <span>搜索</span>
            </button>
            <button type="button" class="workbench-v2-sidebar-action" @click="openWorkbenchSkillLibrary">
              <ds-icon name="book-open" aria-hidden="true" />
              <span>技能</span>
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
              </div>
              <div v-if="!taskList.length" class="workbench-v2-list-empty">暂无任务</div>
            </div>
          </section>
          <div class="workbench-v2-sidebar-footer">
            <button type="button" class="workbench-v2-sidebar-action workbench-v2-sidebar-action--quiet">
              <svg class="iconpark-icon" aria-hidden="true"><use href="#tool"></use></svg>
              <span>设置</span>
            </button>
          </div>
        </aside>

        <main class="workbench-v2-main">
          <header class="workbench-v2-header">
            <div class="workbench-v2-header__left">
              <div class="workbench-v2-title-group">
                <h1 class="workbench-v2-title">{{ activeConversationTitle }}</h1>
              </div>
            </div>
            <div class="workbench-v2-header__right">
              <button type="button" class="nlm-assistant-header-btn workbench-v2-generate-skill-btn" title="生成技能" aria-label="生成技能" @click="openGenerateSkillConfig">
                <ds-icon name="tips" aria-hidden="true" />
                <span>生成技能</span>
              </button>
            </div>
          </header>

          <section class="workbench-v2-chat-stage workbench-v2-chat-stage--legacy" aria-label="新版工作台对话区">
            <free-audit-view ref="legacyWorkbench" class="workbench-v2-legacy-chat-host" />
          </section>
        </main>

        <aside class="workbench-v2-rail" aria-label="工作台工具">
          <button v-for="tool in tools" :key="tool.id" type="button" class="workbench-v2-rail__btn" :class="{ 'is-active': tool.active }" :aria-label="tool.label">
            <svg class="iconpark-icon"><use :href="tool.icon"></use></svg>
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
        tools: [
          { id: 'material', label: '资料', icon: '#book', active: true },
          { id: 'result', label: '结果', icon: '#notes', active: false },
          { id: 'skill', label: '技能', icon: '#tool', active: false },
          { id: 'graph', label: '图谱', icon: '#connect', active: false },
          { id: 'global', label: '外部资源', icon: '#map-draw', active: false },
        ],
      };
    },
    computed: {
      projectTitle() {
        return getProjectTitle(this.projectId);
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
      activeConversationTitle() {
        if (!this.activeConversationId && this.draftConversationTitle) return this.draftConversationTitle;
        const hit = (this.historyConversations || []).find((item) => item && item.id === this.activeConversationId);
        return hit && hit.title ? hit.title : this.projectTitle;
      },
    },
    methods: {
      collapseSidebar() {
        this.sidebarCollapsed = true;
      },
      expandSidebar() {
        this.sidebarCollapsed = false;
      },
      handleBrandMarkClick() {
        if (this.sidebarCollapsed) this.expandSidebar();
      },
      selectHistoryConversation(item) {
        if (!item || !item.id) return;
        this.activeConversationId = item.id;
        this.draftConversationTitle = '';
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy) return;
        if (item.source === 'session' && typeof legacy.restoreSession === 'function') {
          const session = (legacy.sessionHistory || []).find((row) => row && row.id === item.id);
          if (session) legacy.restoreSession(session);
          return;
        }
        if (item.source === 'demo' && typeof legacy.loadChatDemoScenario === 'function') {
          const scenario = (CHAT_DEMO_SCENARIOS || []).find((row) => row && row.id === item.id);
          if (scenario) legacy.loadChatDemoScenario(scenario);
        }
      },
      newSession() {
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy) return;
        if (typeof legacy.clearChatThinkingIntervals === 'function') legacy.clearChatThinkingIntervals();
        if (typeof legacy.hideChatQueueNotice === 'function') legacy.hideChatQueueNotice();
        legacy.activeChatScenarioId = '';
        legacy.chatMessages = [];
        legacy.chatInput = '';
        legacy.chatInputRefItems = [];
        legacy.chatUploadAttachments = [];
        legacy.historyDropdownOpen = false;
        if (typeof legacy.closeChatInputTriggerMenu === 'function') legacy.closeChatInputTriggerMenu();
        if (typeof legacy.adjustInputHeight === 'function') legacy.adjustInputHeight();
        if (typeof legacy.focusChatInput === 'function') {
          legacy.$nextTick(() => legacy.focusChatInput());
        }
        this.activeConversationId = '';
        this.draftConversationTitle = '新建对话';
      },
      commitDraftConversation(seedText) {
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy || this.activeConversationId) return;
        const title = getDraftConversationTitle(seedText);
        const id = 'v2-session-' + Date.now();
        const session = {
          id,
          title,
          createdAt: title,
          messages: clonePlain(legacy.chatMessages || []),
        };
        legacy.sessionHistory = [session].concat((legacy.sessionHistory || []).filter((item) => item && item.id !== id));
        this.v2SavedSessions = [session].concat((this.v2SavedSessions || []).filter((item) => item && item.id !== id));
        this.activeConversationId = id;
        this.draftConversationTitle = '';
      },
      patchLegacySendBridge() {
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy || legacy._workbenchV2SendPatched || typeof legacy.sendChat !== 'function') return;
        const original = legacy.sendChat.bind(legacy);
        legacy._workbenchV2OriginalSendChat = legacy.sendChat;
        legacy._workbenchV2SendPatched = true;
        legacy.sendChat = (...args) => {
          const wasDraft = !this.activeConversationId && !!this.draftConversationTitle;
          const seedText = String(legacy.chatInput || '').trim();
          const beforeLen = Array.isArray(legacy.chatMessages) ? legacy.chatMessages.length : 0;
          const result = original(...args);
          this.$nextTick(() => {
            const afterLen = Array.isArray(legacy.chatMessages) ? legacy.chatMessages.length : 0;
            if (wasDraft && seedText && afterLen > beforeLen) this.commitDraftConversation(seedText);
          });
          return result;
        };
      },
      openTaskCreate() {
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy) return;
        if (typeof legacy.handleWorkbenchTaskCreate === 'function') {
          legacy.handleWorkbenchTaskCreate();
          return;
        }
        if (typeof legacy.openWorkbenchTaskCreateModal === 'function') legacy.openWorkbenchTaskCreateModal();
      },
      openWorkbenchSearch() {
        const legacy = this.$refs.legacyWorkbench;
        if (legacy && typeof legacy.focusChatInput === 'function') {
          legacy.focusChatInput();
        }
      },
      openWorkbenchSkillLibrary() {
        const legacy = this.$refs.legacyWorkbench;
        if (!legacy) return;
        if (typeof legacy.openTemplateLibrary === 'function') {
          legacy.openTemplateLibrary();
          return;
        }
        if (typeof legacy.onWorkbenchTemplateAddMenu === 'function') {
          legacy.onWorkbenchTemplateAddMenu({ key: 'library' });
        }
      },
      openGenerateSkillConfig() {
        const legacy = this.$refs.legacyWorkbench;
        if (legacy && typeof legacy.openGenerateSkillConfigModal === 'function') {
          legacy.openGenerateSkillConfigModal();
        }
      },
      syncProjectFromHash() {
        this.projectId = getV2ProjectId();
        this.activeConversationId = getInitialConversationId(this.projectId);
        this.draftConversationTitle = '';
        this.v2SavedSessions = [];
      },
    },
    mounted() {
      const onHashChange = () => this.syncProjectFromHash();
      window.addEventListener('hashchange', onHashChange);
      this.$nextTick(() => this.patchLegacySendBridge());
      this._workbenchV2Cleanup = () => {
        window.removeEventListener('hashchange', onHashChange);
        const legacy = this.$refs.legacyWorkbench;
        if (legacy && legacy._workbenchV2SendPatched && legacy._workbenchV2OriginalSendChat) {
          legacy.sendChat = legacy._workbenchV2OriginalSendChat;
          legacy._workbenchV2OriginalSendChat = null;
          legacy._workbenchV2SendPatched = false;
        }
      };
    },
    beforeUnmount() {
      if (this._workbenchV2Cleanup) this._workbenchV2Cleanup();
    },
  });
})();
