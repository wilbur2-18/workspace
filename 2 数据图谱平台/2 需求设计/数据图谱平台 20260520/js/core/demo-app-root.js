(function () {
  const runtime = window.DGP_RUNTIME;
  const data = window.DGP_DATA;
  const componentApp = window.__DGP_COMPONENT_APP;
  const disambig = window.DGP_ENTITY_DISAMBIG || { needsEntityDisambiguation: () => false };

  const root = Vue.createApp({
    template: `
      <a-config-provider :theme="appTheme">
        <a-layout class="app-shell dgp-app-shell" :class="{ 'dgp-app-shell--immersive': hidePlatformHeader }">
          <a-layout-header
            v-if="!hidePlatformHeader"
            class="app-header ds-header-bar ds-bg-enriched dgp-header"
          >
            <div class="header-section dgp-header-brand">
              <a href="#" class="header-logo-area" @click.prevent="navigate(VIEW_IDS.GRAPH_QUERY)">
                <div class="header-logo dgp-logo">图</div>
                <span>数据图谱平台</span>
              </a>
              <nav class="header-nav dgp-header-nav" aria-label="一级模块">
                <a
                  v-for="item in navItems"
                  :key="item.id"
                  href="#"
                  :class="{ active: activeNavId === item.id, 'is-active': activeNavId === item.id }"
                  @click.prevent="navigate(item.id)"
                >{{ item.label }}</a>
              </nav>
            </div>
            <div class="header-actions dgp-header-actions">
              <a-avatar size="small" class="header-avatar">U</a-avatar>
              <span class="header-user-name">系统管理员</span>
            </div>
          </a-layout-header>
          <main
            class="dgp-main"
            :class="{
              'dgp-main--canvas': currentView === VIEW_IDS.GRAPH_CANVAS,
              'dgp-main--graph-query': currentView === VIEW_IDS.GRAPH_QUERY,
            }"
          >
            <graph-home-view
              v-if="currentView === VIEW_IDS.GRAPH_QUERY"
              :graphs="graphs"
              :history="history"
              :basic-templates="basicTemplates"
              :data-templates="dataTemplates"
              @quick-query-finish="onQuickQueryFinish"
              @open-template-query="openTemplateQuery"
              @open-history="openHistory"
              @open-batch-preview="openBatchPreview"
            />
            <graph-workbench-view
              v-else-if="currentView === VIEW_IDS.GRAPH_CANVAS"
              :graph="selectedGraph"
              :history="history"
              :basic-templates="basicTemplates"
              :data-templates="dataTemplates"
              :result="result"
              :query-summary="querySummary"
              :active-history-id="activeHistoryId"
              @open-quick-query-modal="openQuickQueryModal"
              @open-template-query="openTemplateQueryFromWorkbench"
              @go-home="navigate(VIEW_IDS.GRAPH_QUERY)"
              @select-history="selectHistory"
              @rename-history="renameHistory"
              @delete-history="deleteHistory"
            />
            <module-placeholder-view
              v-else
              :title="placeholder.title"
              :desc="placeholder.desc"
              :points="placeholder.points"
            />
          </main>

          <entity-confirm-modal
            v-model:open="entityConfirmOpen"
            :keyword="pendingEntityKeyword"
            @confirm="onEntityConfirmed"
          />
          <quick-query-modal
            v-model:open="quickQueryOpen"
            :graph="quickQueryGraph"
            :basic-templates="basicTemplates"
            :initial-mode="quickQueryMode"
            @submit="finishQuickQuery"
            @need-entity-confirm="onQuickQueryNeedConfirm"
          />
          <template-query-modal
            v-model:open="templateQueryOpen"
            :graphs="graphs"
            :data-templates="dataTemplates"
            :initial-graph="templateQueryGraph"
            :initial-template-id="templateQueryTemplateId"
            @finish="finishTemplateQuery"
          />
        </a-layout>
      </a-config-provider>
    `,
    data() {
      return {
        VIEW_IDS: runtime.VIEW_IDS,
        appTheme: runtime.APP_THEME,
        navItems: [
          { id: runtime.VIEW_IDS.DASHBOARD, label: '工作台' },
          { id: runtime.VIEW_IDS.GRAPH_QUERY, label: '图谱查询' },
          { id: runtime.VIEW_IDS.GRAPH_MANAGEMENT, label: '图谱管理' },
          { id: runtime.VIEW_IDS.SYSTEM, label: '系统管理' },
        ],
        currentView: runtime.parseHash().view,
        graphs: data.graphs,
        basicTemplates: data.basicTemplates,
        dataTemplates: data.dataTemplates,
        reasoningTemplates: data.reasoningTemplates,
        batchTasks: data.batchTasks,
        history: data.history,
        result: runtime.clone(data.getResultForHistory('h-audit-100')),
        selectedGraph: data.graphs[0],
        activeHistoryId: 'h-audit-100',
        querySummary: '关系探索 / 多主体复杂关联',
        entityConfirmOpen: false,
        pendingQuickPayload: null,
        pendingEntityKeyword: '',
        quickQueryOpen: false,
        quickQueryGraph: null,
        quickQueryMode: 'entity',
        templateQueryOpen: false,
        templateQueryGraph: null,
        templateQueryTemplateId: '',
      };
    },
    computed: {
      hidePlatformHeader() {
        return this.currentView === this.VIEW_IDS.GRAPH_CANVAS;
      },
      activeNavId() {
        return this.currentView === this.VIEW_IDS.GRAPH_CANVAS ? this.VIEW_IDS.GRAPH_QUERY : this.currentView;
      },
      placeholder() {
        const map = {
          [this.VIEW_IDS.DASHBOARD]: {
            title: '工作台',
            desc: '一级模块占位。本次 demo 不展开工作台，仅保留平台级入口结构。',
            points: ['待办与最近访问', '常用图谱快捷入口', '运行状态概览'],
          },
          [this.VIEW_IDS.GRAPH_MANAGEMENT]: {
            title: '图谱管理',
            desc: '一级模块占位。本次 demo 不展开图谱建模、数据接入与权限管理。',
            points: ['图谱资产列表', '图谱配置与发布', '权限与授权范围'],
          },
          [this.VIEW_IDS.SYSTEM]: {
            title: '系统管理',
            desc: '一级模块占位。本次 demo 不展开组织、角色、菜单和审计日志。',
            points: ['用户与角色', '菜单权限', '运行配置'],
          },
        };
        return map[this.currentView] || map[this.VIEW_IDS.DASHBOARD];
      },
    },
    methods: {
      navigate(viewId) {
        this.currentView = viewId;
        runtime.setHash(viewId);
      },
      onQuickQueryFinish(payload) {
        if (disambig.needsEntityDisambiguation(payload.mode, payload.params)) {
          this.pendingQuickPayload = payload;
          this.pendingEntityKeyword = payload.params?.nameKeyword || '';
          this.entityConfirmOpen = true;
          return;
        }
        this.finishQuickQuery(payload);
      },
      onQuickQueryNeedConfirm(payload) {
        this.quickQueryOpen = false;
        this.pendingQuickPayload = payload;
        this.pendingEntityKeyword = payload.params?.nameKeyword || '';
        this.entityConfirmOpen = true;
      },
      onEntityConfirmed(entity) {
        const base = this.pendingQuickPayload;
        if (!base) return;
        const params = { ...base.params, confirmedEntityId: entity.id, confirmedEntity: entity };
        this.finishQuickQuery({ ...base, params });
        this.pendingQuickPayload = null;
        this.pendingEntityKeyword = '';
      },
      finishQuickQuery(payload) {
        const hideLoading = antd.message.loading('查询执行中…', 0);
        window.setTimeout(() => {
          hideLoading();
          this.selectedGraph = payload.graph;
          const modeLabel =
            this.basicTemplates.find((t) => t.id === payload.mode)?.name || '实体信息查询';
          const summaryPart =
            payload.params?.nameKeyword ||
            payload.params?.startNode ||
            payload.params?.confirmedEntity?.label ||
            '—';
          this.querySummary = `${modeLabel} / ${summaryPart}`;
          this.activeHistoryId = 'h-a';
          this.result = runtime.clone(data.graphResult);
          this.quickQueryOpen = false;
          this.pendingQuickPayload = null;
          this.entityConfirmOpen = false;
          this.currentView = this.VIEW_IDS.GRAPH_CANVAS;
          runtime.setHash(this.VIEW_IDS.GRAPH_CANVAS);
          antd.message.success('查询已完成，已生成当前小图');
        }, 480);
      },
      openTemplateQuery(payload = {}) {
        this.templateQueryGraph = payload.graph || this.selectedGraph;
        this.templateQueryTemplateId = payload.templateId || '';
        this.templateQueryOpen = true;
      },
      openTemplateQueryFromWorkbench(payload = {}) {
        this.openTemplateQuery({ graph: payload.graph || this.selectedGraph, templateId: payload.templateId || '' });
      },
      openQuickQueryModal(payload = {}) {
        this.quickQueryGraph = payload.graph || this.selectedGraph;
        this.quickQueryMode = payload.mode || 'entity';
        this.quickQueryOpen = true;
      },
      finishTemplateQuery(payload) {
        const hideLoading = antd.message.loading('模板查询执行中…', 0);
        window.setTimeout(() => {
          hideLoading();
          this.selectedGraph = payload.graph;
          const paramSummary = Object.values(payload.params || {})
            .filter((v) => v !== undefined && v !== null && v !== '')
            .slice(0, 2)
            .join(' / ');
          this.querySummary = `${payload.template?.name || '模板查询'} / ${paramSummary || '—'}`;
          this.activeHistoryId = 'h-a';
          this.result = runtime.clone(data.graphResult);
          this.templateQueryOpen = false;
          this.currentView = this.VIEW_IDS.GRAPH_CANVAS;
          runtime.setHash(this.VIEW_IDS.GRAPH_CANVAS);
          antd.message.success('模板查询已完成，已生成当前小图');
        }, 480);
      },
      applyHistory(h) {
        const g = this.graphs.find((x) => x.id === h.baseId);
        if (g) this.selectedGraph = g;
        this.activeHistoryId = h.id;
        this.querySummary = h.mode + ' / 历史小图 / ' + h.updated;
        this.result = runtime.clone(data.getResultForHistory(h.id));
      },
      openHistory(h) {
        this.applyHistory(h);
        this.currentView = this.VIEW_IDS.GRAPH_CANVAS;
        runtime.setHash(this.VIEW_IDS.GRAPH_CANVAS, { historyId: h.id });
      },
      selectHistory(h) {
        this.applyHistory(h);
        runtime.setHash(this.VIEW_IDS.GRAPH_CANVAS, { historyId: h.id });
      },
      renameHistory(payload) {
        const item = this.history.find((h) => h.id === payload.history.id);
        if (!item) return;
        item.name = payload.name;
        antd.message.success('已重命名最近查询');
      },
      deleteHistory(h) {
        const nextHistory = this.history.filter((item) => item.id !== h.id);
        this.history = nextHistory;
        if (this.activeHistoryId === h.id && nextHistory.length) {
          const next = nextHistory.find((item) => item.baseId === this.selectedGraph.id) || nextHistory[0];
          this.applyHistory(next);
          runtime.setHash(this.VIEW_IDS.GRAPH_CANVAS, { historyId: next.id });
        }
        antd.message.success('已删除最近查询');
      },
      openBatchPreview() {
        const batchHistory = this.history.find((h) => h.mode === '数据模板') || this.history[0];
        if (batchHistory) this.openHistory(batchHistory);
      },
    },
    mounted() {
      const initial = runtime.parseHash();
      const initialHistoryId = initial.params?.get?.('historyId');
      if (initialHistoryId) {
        const h = this.history.find((x) => x.id === initialHistoryId);
        if (h) this.applyHistory(h);
      }
      if (initial.path !== initial.view) {
        runtime.setHash(initial.view, initial.params);
      }
      window.addEventListener('hashchange', () => {
        const parsed = runtime.parseHash();
        if (this.currentView !== parsed.view) this.currentView = parsed.view;
        const historyId = parsed.params?.get?.('historyId');
        if (historyId) {
          const h = this.history.find((x) => x.id === historyId);
          if (h && h.id !== this.activeHistoryId) this.applyHistory(h);
        }
      });
    },
  });

  Object.entries(componentApp._context.components).forEach(([name, component]) => {
    root.component(name, component);
  });

  window.__DGP_APP = root;
})();
