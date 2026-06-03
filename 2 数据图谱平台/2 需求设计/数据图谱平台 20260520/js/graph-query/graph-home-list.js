(function () {
  const app = window.__DGP_COMPONENT_APP;
  const { compactNumber } = window.DGP_RUNTIME;

  app.component('GraphHomeView', {
    props: {
      graphs: { type: Array, required: true },
      history: { type: Array, required: true },
      basicTemplates: { type: Array, required: true },
      dataTemplates: { type: Array, required: true },
    },
    emits: ['quick-query-finish', 'open-history', 'open-template-query', 'open-batch-preview'],
    data() {
      return {
        selectedGraphId: '',
        graphDropdownOpen: false,
        advancedQueryOpen: false,
        quickMode: 'entity',
        entityType: '人员',
        entityId: '',
        entityName: '',
        entitySteps: 1,
        entityRelationDirection: 'both',
        entityRelationType: [],
        entityFilterExpression: '',
        templateSearchKeyword: '',
        historySearchKeyword: '',
        pathStartType: '人员',
        pathEndType: '人员',
        pathStartNodes: [],
        pathTargetNodes: [],
        pathMaxHop: 3,
        pathQueryType: 'shortest',
        pathEdgeType: undefined,
        pathDirection: 'any',
        pathEdgePropertyFilters: [
          { id: 'edge-filter-1', relationType: undefined, property: '', operator: 'contains', value: '' },
        ],
        nodePickerOpen: false,
        nodePickerTarget: 'start',
        nodePickerType: '人员',
        nodePickerId: '',
        nodePickerName: '',
        nodePickerSearched: false,
        aiGenerateOpen: false,
        aiKnowledgeBase: undefined,
        aiModel: undefined,
        aiRequirement: '',
        cypherStatement: 'MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 100',
      };
    },
    computed: {
      accessibleGraphs() {
        return this.graphs.filter((g) => g.permission === 'query' || g.permission === 'view');
      },
      activeGraphId() {
        if (this.selectedGraphId && this.accessibleGraphs.some((g) => g.id === this.selectedGraphId)) {
          return this.selectedGraphId;
        }
        return this.accessibleGraphs[0]?.id || '';
      },
      currentGraph() {
        return this.accessibleGraphs.find((g) => g.id === this.activeGraphId) || this.accessibleGraphs[0] || null;
      },
      canQueryCurrentGraph() {
        return this.currentGraph?.permission === 'query';
      },
      quickTemplateItems() {
        return this.basicTemplates.map((t) => ({
          id: t.id,
          name: t.name,
          desc: t.desc,
        }));
      },
      quickSegmentOptions() {
        return this.quickTemplateItems.map((tpl) => ({
          label: tpl.id === 'entity' ? '实体查询' : tpl.name,
          value: tpl.id,
        }));
      },
      entityTypeOptions() {
        return ['人员', '企业', '机动车', '行政事业单位', '电话'];
      },
      entityPrimaryFieldLabel() {
        return ['企业', '行政事业单位'].includes(this.entityType) ? '名称' : 'ID';
      },
      entitySecondaryFieldLabel() {
        if (this.entityType === '企业') return '统一信用代码';
        if (this.entityType === '行政事业单位') return '单位名称';
        if (this.entityType === '机动车') return '车牌号';
        if (this.entityType === '电话') return '号码';
        if (this.entityType === '人员') return '姓名';
        return '名称';
      },
      entityPrimaryPlaceholder() {
        return ['企业', '行政事业单位'].includes(this.entityType) ? '输入名称' : '输入 ID 搜索值';
      },
      entitySecondaryPlaceholder() {
        if (this.entityType === '企业') return '输入统一信用代码';
        if (this.entityType === '行政事业单位') return '输入单位名称';
        if (this.entityType === '机动车') return '输入车牌号';
        if (this.entityType === '电话') return '输入电话号码';
        if (this.entityType === '人员') return '输入姓名搜索值';
        return '输入名称搜索值';
      },
      relationTypeOptions() {
        return ['财政供养', '人员关系', '拥有车辆', '企业核心人员', '法人股东', '缴纳社保', '开发票', '用有电话', '国库支付'];
      },
      relationDirectionOptions() {
        return [
          { label: '两个都', value: 'both' },
          { label: '在', value: 'in' },
          { label: '出去', value: 'out' },
        ];
      },
      pathQueryTypeOptions() {
        return [
          { label: '最短路径', value: 'shortest' },
          { label: '全部路径', value: 'all' },
          { label: '无环路径', value: 'acyclic' },
        ];
      },
      pathDirectionOptions() {
        return [
          { label: '本人', value: 'any' },
          { label: '正向', value: 'forward' },
          { label: '逆向', value: 'reverse' },
        ];
      },
      edgeFilterOperatorOptions() {
        return [
          { label: '包含', value: 'contains' },
          { label: '是', value: 'is' },
          { label: '不等于', value: 'neq' },
          { label: '远端匹配', value: 'far_match' },
          { label: '近端匹配', value: 'near_match' },
        ];
      },
      nodePickerTitle() {
        return this.nodePickerTarget === 'start' ? '选择起始节点' : '选择目标节点';
      },
      selectedPickerNodes() {
        return this.nodePickerTarget === 'start' ? this.pathStartNodes : this.pathTargetNodes;
      },
      nodePickerOptions() {
        const nodes = [
          { id: 'p-001', type: '人员', name: '财政供养人员-01', code: 'P-001' },
          { id: 'p-014', type: '人员', name: '企业核心人员-02', code: 'P-014' },
          { id: 'p-027', type: '人员', name: '法人股东-03', code: 'P-027' },
          { id: 'c-construct-a', type: '企业', name: '恒达建设有限公司', code: '91330000MA01' },
          { id: 'c-service-b', type: '企业', name: '新源服务有限公司', code: '91330102MA98' },
          { id: 'u-finance', type: '行政事业单位', name: '市财政局', code: 'U-008' },
          { id: 'v-a1028', type: '机动车', name: '浙A1028审', code: '浙A1028审' },
          { id: 'tel-13800138000', type: '电话', name: '13800138000', code: '13800138000' },
        ];
        const idKeyword = String(this.nodePickerId || '').trim().toLowerCase();
        const nameKeyword = String(this.nodePickerName || '').trim().toLowerCase();
        return nodes.filter((node) => {
          const typeMatched = !this.nodePickerType || node.type === this.nodePickerType;
          const idMatched =
            !idKeyword ||
            [node.id, node.code].some((value) => String(value || '').toLowerCase().includes(idKeyword));
          const nameMatched =
            !nameKeyword ||
            [node.name, node.code].some((value) => String(value || '').toLowerCase().includes(nameKeyword));
          return typeMatched && idMatched && nameMatched;
        });
      },
      aiKnowledgeBaseOptions() {
        return ['浙江审计关系图谱知识库', '财政资金审计知识库', '企业关系识别知识库'];
      },
      aiModelOptions() {
        return ['Qwen', 'DeepSeek'];
      },
      queryTemplateItems() {
        return this.dataTemplates.map((t) => ({
          id: `audit-${t.id}`,
          name: t.name,
          desc: t.desc,
          kind: 'audit',
          type: t.type,
          vars: t.vars,
          templateId: t.id,
        }));
      },
      filteredQueryTemplateItems() {
        const keyword = String(this.templateSearchKeyword || '').trim().toLowerCase();
        if (!keyword) return this.queryTemplateItems;
        return this.queryTemplateItems.filter((tpl) => {
          return [tpl.name, tpl.desc, tpl.type].some((value) => String(value || '').toLowerCase().includes(keyword));
        });
      },
      currentHistoryList() {
        const list = (this.historyByGraph[this.activeGraphId] || []).slice();
        list.sort((a, b) => {
          const ta = Date.parse(String(a.updated).replace(/-/g, '/')) || 0;
          const tb = Date.parse(String(b.updated).replace(/-/g, '/')) || 0;
          return tb - ta;
        });
        const keyword = String(this.historySearchKeyword || '').trim().toLowerCase();
        if (!keyword) return list;
        return list.filter((h) => {
          return [h.name, h.mode, h.updated].some((value) => String(value || '').toLowerCase().includes(keyword));
        });
      },
      historyByGraph() {
        return this.history.reduce((map, item) => {
          if (!map[item.baseId]) map[item.baseId] = [];
          map[item.baseId].push(item);
          return map;
        }, {});
      },
    },
    created() {
      const firstId = this.accessibleGraphs[0]?.id;
      if (firstId) this.selectedGraphId = firstId;
    },
    methods: {
      compactNumber,
      formatHistoryUpdated(value) {
        const raw = String(value || '').trim();
        if (!raw) return '—';
        return raw.split(/\s+/)[0] || raw;
      },
      onGraphSwitchMenuClick(info) {
        const next = info && info.key ? String(info.key) : '';
        if (!next) return;
        this.selectedGraphId = next;
        this.graphDropdownOpen = false;
      },
      buildQuickParams() {
        if (this.quickMode === 'path') {
          return {
            startNodes: this.pathStartNodes,
            targetNodes: this.pathTargetNodes,
            maxHop: this.pathMaxHop,
            queryType: this.pathQueryType,
          };
        }
        if (this.quickMode === 'cypher') {
          return {
            statement: this.cypherStatement || 'MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 100',
          };
        }
        return {
          entityType: this.entityType,
          idKeyword: this.entityId,
          nameKeyword: this.entityName || '财政供养人员-01',
          steps: this.entitySteps,
          relationDirection: this.entityRelationDirection,
          relationType: this.entityRelationType,
          filterExpression: this.entityFilterExpression,
        };
      },
      onQuickQuery() {
        if (!this.currentGraph || !this.canQueryCurrentGraph) return;
        this.$emit('quick-query-finish', {
          graph: this.currentGraph,
          mode: this.quickMode,
          params: this.buildQuickParams(),
        });
      },
      onTemplateStart(tpl) {
        if (!this.currentGraph || !this.canQueryCurrentGraph) return;
        this.$emit('open-template-query', {
          graph: this.currentGraph,
          templateId: tpl.templateId,
        });
      },
      openNodePicker(target) {
        this.nodePickerTarget = target;
        this.nodePickerType = target === 'start' ? this.pathStartType : this.pathEndType;
        this.nodePickerId = '';
        this.nodePickerName = '';
        this.nodePickerSearched = false;
        this.nodePickerOpen = true;
      },
      searchNodePicker() {
        this.nodePickerSearched = true;
      },
      clearNodePickerSearch() {
        this.nodePickerId = '';
        this.nodePickerName = '';
        this.nodePickerSearched = false;
      },
      clearAllPickerNodes() {
        if (this.nodePickerTarget === 'start') {
          this.pathStartNodes = [];
          return;
        }
        this.pathTargetNodes = [];
      },
      confirmNodePicker() {
        if (this.nodePickerTarget === 'start') {
          this.pathStartType = this.nodePickerType;
        } else {
          this.pathEndType = this.nodePickerType;
        }
        this.nodePickerOpen = false;
      },
      selectNodeOption(node) {
        const list = this.nodePickerTarget === 'start' ? this.pathStartNodes : this.pathTargetNodes;
        if (!list.some((item) => item.id === node.id)) {
          list.push({ id: node.id, type: node.type, name: node.name, code: node.code });
        }
      },
      removePathNode(target, id) {
        const key = target === 'start' ? 'pathStartNodes' : 'pathTargetNodes';
        this[key] = this[key].filter((node) => node.id !== id);
      },
      addPathEdgeFilter() {
        this.pathEdgePropertyFilters.push({
          id: `edge-filter-${Date.now()}`,
          relationType: undefined,
          property: '',
          operator: 'contains',
          value: '',
        });
      },
      removePathEdgeFilter(id) {
        if (this.pathEdgePropertyFilters.length <= 1) return;
        this.pathEdgePropertyFilters = this.pathEdgePropertyFilters.filter((item) => item.id !== id);
      },
      openAiGenerate() {
        this.aiGenerateOpen = true;
      },
      generateCypherByAi() {
        const requirement = this.aiRequirement || '查找与目标主体存在投资关系的公司';
        this.cypherStatement = `MATCH (n)-[r]->(m) WHERE n.name CONTAINS '${requirement.slice(0, 8)}' RETURN n,r,m LIMIT 100`;
        this.aiGenerateOpen = false;
      },
      clearQuickInputs() {
        this.entityId = '';
        this.entityName = '';
        this.entitySteps = 1;
        this.entityRelationDirection = 'both';
        this.entityRelationType = [];
        this.entityFilterExpression = '';
        this.pathStartNodes = [];
        this.pathTargetNodes = [];
        this.pathMaxHop = 3;
        this.pathQueryType = 'shortest';
        this.pathEdgeType = undefined;
        this.pathDirection = 'any';
        this.pathEdgePropertyFilters = [
          { id: 'edge-filter-1', relationType: undefined, property: '', operator: 'contains', value: '' },
        ];
        this.cypherStatement = '';
      },
    },
    template: `
      <div class="dgp-scroll">
        <main class="main-container graph-query-home-shell">
          <section class="ds-page-hero ds-page-hero--l1 graph-query-page-hero graph-query-quick-query" aria-label="快捷查询">
            <div class="graph-query-quick-query__head">
              <div class="graph-query-quick-query__title-block">
                <div class="graph-query-quick-query__title-line">
                  <h1 class="ds-page-hero__title ds-page-hero__title--with-icon">
                    <span class="ds-page-hero__title-icon ds-page-hero__title-icon--audit-space" aria-hidden="true">
                      <svg class="iconpark-icon"><use href="#map-draw"></use></svg>
                    </span>
                    <span class="ds-page-hero__title-text">{{ currentGraph?.name || '请选择图谱' }}</span>
                  </h1>
                  <a-dropdown v-model:open="graphDropdownOpen" :trigger="['hover']" placement="bottomLeft">
                    <button
                      type="button"
                      class="graph-query-switch-btn"
                      :class="{ 'is-active': graphDropdownOpen, 'is-open': graphDropdownOpen }"
                      aria-label="切换图谱"
                      :aria-expanded="graphDropdownOpen ? 'true' : 'false'"
                    >
                      <span>切换图谱</span>
                      <ds-icon name="chevron-down" class="graph-query-switch-btn__icon" aria-hidden="true" />
                    </button>
                    <template #overlay>
                      <a-menu class="graph-query-context-menu" @click="onGraphSwitchMenuClick">
                        <a-menu-item
                          v-for="g in accessibleGraphs"
                          :key="g.id"
                          class="graph-query-context-menu__menu-item"
                          :class="{ 'is-active': activeGraphId === g.id }"
                        >
                          <span class="graph-query-context-menu__item">
                            <span class="graph-query-context-menu__main">
                              <span class="graph-query-context-menu__title-row">
                                <span class="graph-query-context-menu__name">
                                  <span>{{ g.name }}</span>
                                </span>
                                <span class="graph-query-context-menu__stats">
                                  <span class="graph-query-context-menu__stat graph-query-context-menu__stat--nodes" aria-label="节点数">
                                    <svg class="iconpark-icon graph-query-context-menu__stat-icon" aria-hidden="true"><use href="#avatar"></use></svg>
                                    <span>{{ compactNumber(g.entities) }}</span>
                                  </span>
                                  <span class="graph-query-context-menu__stat graph-query-context-menu__stat--edges" aria-label="边数">
                                    <svg class="iconpark-icon graph-query-context-menu__stat-icon" aria-hidden="true"><use href="#connection-point-two"></use></svg>
                                    <span>{{ compactNumber(g.relations) }}</span>
                                  </span>
                                </span>
                              </span>
                              <span class="graph-query-context-menu__desc">{{ g.desc }}</span>
                            </span>
                          </span>
                        </a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
              </div>
              <div class="graph-query-current-stats" aria-label="当前图谱规模">
                <span class="graph-query-current-stat graph-query-current-stat--entities">
                  <svg class="iconpark-icon graph-query-current-stat__icon" aria-hidden="true"><use href="#avatar"></use></svg>
                  <span class="graph-query-current-stat__label">实体</span>
                  <strong>{{ compactNumber(currentGraph?.entities || 0) }}</strong>
                </span>
                <span class="graph-query-current-stat graph-query-current-stat--relations">
                  <svg class="iconpark-icon graph-query-current-stat__icon" aria-hidden="true"><use href="#connection-point-two"></use></svg>
                  <span class="graph-query-current-stat__label">边</span>
                  <strong>{{ compactNumber(currentGraph?.relations || 0) }}</strong>
                </span>
              </div>
            </div>

            <div class="graph-query-quick-query__box">
              <div class="graph-query-quick-query__dock">
                <div class="graph-query-quick-query__mode-row">
                  <a-segmented
                    v-model:value="quickMode"
                    class="ds-ant-segmented ds-ant-segmented--l1-skill-scope graph-query-quick-query__mode"
                    size="large"
                    :options="quickSegmentOptions"
                    aria-label="快捷查询方式"
                  />
                  <button
                    type="button"
                    class="graph-query-advanced-toggle"
                    :class="{ 'is-active': advancedQueryOpen }"
                    :aria-expanded="advancedQueryOpen ? 'true' : 'false'"
                    @click="advancedQueryOpen = !advancedQueryOpen"
                  >
                    <span>高级查询</span>
                    <span class="graph-query-advanced-switch" aria-hidden="true">
                      <span class="graph-query-advanced-switch__thumb"></span>
                    </span>
                  </button>
                </div>

                <div class="graph-query-quick-query__form-stage">
                  <button type="button" class="graph-query-form-clear-btn" @click="clearQuickInputs">清空</button>
                  <div v-if="quickMode === 'entity'" class="graph-query-quick-form graph-query-quick-form--entity">
                    <label class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">对象类型</span>
                      <a-select v-model:value="entityType" class="graph-query-quick-form__select" aria-label="实体类型">
                        <a-select-option v-for="type in entityTypeOptions" :key="type" :value="type">{{ type }}</a-select-option>
                      </a-select>
                    </label>
                    <label class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">{{ entityPrimaryFieldLabel }}</span>
                      <a-input v-model:value="entityId" :placeholder="entityPrimaryPlaceholder" allow-clear />
                    </label>
                    <label class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">{{ entitySecondaryFieldLabel }}</span>
                      <a-input v-model:value="entityName" :placeholder="entitySecondaryPlaceholder" allow-clear />
                    </label>
                    <div class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">查询步数</span>
                      <a-input-number v-model:value="entitySteps" :min="1" :max="5" />
                    </div>
                    <a-button type="primary" class="graph-query-quick-form__submit" :disabled="!canQueryCurrentGraph" @click="onQuickQuery">
                      <template #icon><ds-icon name="search" aria-hidden="true" /></template>
                      快捷查询
                    </a-button>
                  </div>

                  <div v-if="advancedQueryOpen && quickMode === 'entity'" class="graph-query-advanced-panel graph-query-advanced-panel--entity">
                    <div class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">关系方向</span>
                      <a-segmented
                        v-model:value="entityRelationDirection"
                        class="graph-query-advanced-segmented"
                        :options="relationDirectionOptions"
                      />
                    </div>
                    <label class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">两者关系类型</span>
                      <a-select
                        v-model:value="entityRelationType"
                        mode="multiple"
                        allow-clear
                        placeholder="选择关系类型"
                        :max-tag-count="2"
                      >
                        <a-select-option v-for="type in relationTypeOptions" :key="type" :value="type">{{ type }}</a-select-option>
                      </a-select>
                    </label>
                    <label class="graph-query-quick-field graph-query-quick-field--wide">
                      <span class="graph-query-quick-field__label">过滤条件</span>
                      <a-input v-model:value="entityFilterExpression" placeholder="WHERE 条件表达式" allow-clear />
                    </label>
                  </div>

                  <div v-if="quickMode === 'path'" class="graph-query-quick-form graph-query-quick-form--path">
                    <div class="graph-query-quick-field graph-query-quick-field--node-picker">
                      <span class="graph-query-quick-field__label">起始节点</span>
                      <button type="button" class="graph-query-node-picker" @click="openNodePicker('start')">
                        <span v-if="!pathStartNodes.length" class="graph-query-node-picker__placeholder">选择起始节点</span>
                        <span
                          v-for="node in pathStartNodes"
                          :key="node.id"
                          class="graph-query-node-chip"
                          @click.stop
                        >
                          <span>{{ node.name }}</span>
                          <button type="button" aria-label="移除起始节点" @click="removePathNode('start', node.id)">×</button>
                        </span>
                      </button>
                    </div>
                    <div class="graph-query-quick-field graph-query-quick-field--node-picker">
                      <span class="graph-query-quick-field__label">目标节点</span>
                      <button type="button" class="graph-query-node-picker" @click="openNodePicker('target')">
                        <span v-if="!pathTargetNodes.length" class="graph-query-node-picker__placeholder">选择目标节点</span>
                        <span
                          v-for="node in pathTargetNodes"
                          :key="node.id"
                          class="graph-query-node-chip"
                          @click.stop
                        >
                          <span>{{ node.name }}</span>
                          <button type="button" aria-label="移除目标节点" @click="removePathNode('target', node.id)">×</button>
                        </span>
                      </button>
                    </div>
                    <div class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">最大深度</span>
                      <a-input-number v-model:value="pathMaxHop" :min="1" :max="5" />
                    </div>
                    <div class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">查询类型</span>
                      <a-select v-model:value="pathQueryType" class="graph-query-quick-form__select" aria-label="查询类型">
                        <a-select-option v-for="type in pathQueryTypeOptions" :key="type.value" :value="type.value">{{ type.label }}</a-select-option>
                      </a-select>
                    </div>
                    <a-button type="primary" class="graph-query-quick-form__submit" :disabled="!canQueryCurrentGraph" @click="onQuickQuery">
                      <template #icon><ds-icon name="search" aria-hidden="true" /></template>
                      快捷查询
                    </a-button>
                  </div>

                  <div v-if="advancedQueryOpen && quickMode === 'path'" class="graph-query-advanced-panel graph-query-advanced-panel--path">
                    <label class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">边型</span>
                      <a-select v-model:value="pathEdgeType" allow-clear placeholder="不选默认全部">
                        <a-select-option v-for="type in relationTypeOptions" :key="type" :value="type">{{ type }}</a-select-option>
                      </a-select>
                    </label>
                    <div class="graph-query-quick-field">
                      <span class="graph-query-quick-field__label">方向边</span>
                      <a-segmented
                        v-model:value="pathDirection"
                        class="graph-query-advanced-segmented"
                        :options="pathDirectionOptions"
                      />
                    </div>
                    <div class="graph-query-edge-filter">
                      <div class="graph-query-edge-filter__head">
                        <span class="graph-query-quick-field__label">属性边过滤</span>
                        <button type="button" class="graph-query-edge-filter__add" @click="addPathEdgeFilter">
                          <ds-icon name="plus" aria-hidden="true" />
                          <span>添加条件</span>
                        </button>
                      </div>
                      <div
                        v-for="filter in pathEdgePropertyFilters"
                        :key="filter.id"
                        class="graph-query-edge-filter__row"
                      >
                        <a-select v-model:value="filter.relationType" allow-clear placeholder="关系类型">
                          <a-select-option v-for="type in relationTypeOptions" :key="type" :value="type">{{ type }}</a-select-option>
                        </a-select>
                        <a-input v-model:value="filter.property" placeholder="属性" allow-clear />
                        <a-select v-model:value="filter.operator">
                          <a-select-option v-for="op in edgeFilterOperatorOptions" :key="op.value" :value="op.value">{{ op.label }}</a-select-option>
                        </a-select>
                        <a-input v-model:value="filter.value" placeholder="值" allow-clear />
                        <button
                          type="button"
                          class="graph-query-edge-filter__remove"
                          :disabled="pathEdgePropertyFilters.length <= 1"
                          aria-label="删除过滤条件"
                          @click="removePathEdgeFilter(filter.id)"
                        >×</button>
                      </div>
                    </div>
                  </div>

                  <div v-if="quickMode === 'cypher'" class="graph-query-quick-form graph-query-quick-form--cypher">
                    <label class="graph-query-quick-field graph-query-quick-field--statement">
                      <span class="graph-query-quick-field__head">
                        <span class="graph-query-quick-field__label">查询语句</span>
                        <button type="button" class="graph-query-ai-generate-btn" aria-label="AI生成查询语句" @click="openAiGenerate">
                          <ds-icon name="magic" aria-hidden="true" />
                          <span>AI生成</span>
                        </button>
                      </span>
                      <a-textarea
                        v-model:value="cypherStatement"
                        :auto-size="{ minRows: 1, maxRows: 8 }"
                        placeholder="输入查询语句"
                      />
                    </label>
                    <a-button type="primary" class="graph-query-quick-form__submit" :disabled="!canQueryCurrentGraph" @click="onQuickQuery">
                      <template #icon><ds-icon name="search" aria-hidden="true" /></template>
                      快捷查询
                    </a-button>
                  </div>
                </div>

                <p v-if="!canQueryCurrentGraph" class="graph-query-quick-query__hint">当前图谱仅可查看历史结果，不能新建查询。</p>
              </div>
            </div>
          </section>

          <div class="ds-l1-toolbar-rail-content-stack">
            <div class="graph-query-dual-panels">
              <section class="graph-query-panel graph-query-panel--templates" aria-label="所选图谱的查询模板">
                <header class="graph-query-panel__head">
                  <div>
                    <h2 class="graph-query-panel__title">模板查询</h2>
                  </div>
                  <a-input
                    v-model:value="templateSearchKeyword"
                    class="graph-query-panel-search"
                    allow-clear
                    aria-label="搜索模板"
                  >
                    <template #prefix><ds-icon name="search" aria-hidden="true" /></template>
                  </a-input>
                </header>
                <div class="graph-query-panel__body">
                  <div v-if="filteredQueryTemplateItems.length" class="graph-query-template-group">
                    <div class="graph-query-template-group__grid">
                      <div
                        v-for="tpl in filteredQueryTemplateItems"
                        :key="tpl.id"
                        class="graph-query-template-row graph-query-template-row--detailed"
                        :class="{ 'is-disabled': !canQueryCurrentGraph }"
                        role="button"
                        tabindex="0"
                        :aria-label="'开始查询：' + tpl.name"
                        @click="onTemplateStart(tpl)"
                        @keydown.enter.prevent="onTemplateStart(tpl)"
                        @keydown.space.prevent="onTemplateStart(tpl)"
                      >
                        <div class="graph-query-template-row__icon" aria-hidden="true">
                          <svg class="iconpark-icon"><use href="#whole-site-accelerator"></use></svg>
                        </div>
                        <div class="graph-query-template-row__text">
                          <p class="graph-query-template-row__title">{{ tpl.name }}</p>
                          <p class="graph-query-template-row__desc">{{ tpl.desc || '暂无描述' }}</p>
                        </div>
                        <a-button
                          type="primary"
                          size="small"
                          class="graph-query-template-row__action"
                          :disabled="!canQueryCurrentGraph"
                          :aria-label="'开始查询：' + tpl.name"
                          @click.stop="onTemplateStart(tpl)"
                        >
                          <template #icon><ds-icon name="search" aria-hidden="true" /></template>
                          查询
                        </a-button>
                      </div>
                    </div>
                  </div>
                  <div v-if="!filteredQueryTemplateItems.length" class="ds-page-empty-block ds-page-empty-block--l1 graph-query-panel__empty">
                    <a-empty :description="templateSearchKeyword ? '未找到匹配模板' : '当前图谱暂无查询模板'" />
                  </div>
                </div>
              </section>
              <section class="graph-query-panel graph-query-panel--history" aria-label="所选图谱的查询历史">
                <header class="graph-query-panel__head">
                  <div>
                    <h2 class="graph-query-panel__title">历史查询</h2>
                  </div>
                  <a-input
                    v-model:value="historySearchKeyword"
                    class="graph-query-panel-search"
                    allow-clear
                    aria-label="搜索历史"
                  >
                    <template #prefix><ds-icon name="search" aria-hidden="true" /></template>
                  </a-input>
                </header>
                <div class="graph-query-panel__body">
                  <div v-if="currentHistoryList.length" class="graph-query-history-list">
                    <button
                      v-for="h in currentHistoryList"
                      :key="h.id"
                      type="button"
                      class="graph-query-history-row"
                      :aria-label="'打开历史小图：' + h.name + (h.updated ? '，更新于 ' + formatHistoryUpdated(h.updated) : '')"
                      @click="$emit('open-history', h)"
                    >
                      <span class="graph-query-history-row__content">
                        <svg class="iconpark-icon graph-query-history-row__graph-icon" aria-hidden="true"><use href="#map-draw"></use></svg>
                        <span class="graph-query-history-row__name">{{ h.name }}</span>
                      </span>
                      <span class="graph-query-history-row__aside">
                        <time
                          v-if="h.updated"
                          class="graph-query-history-row__date"
                          :datetime="String(h.updated).replace(' ', 'T')"
                        >{{ formatHistoryUpdated(h.updated) }}</time>
                        <ds-icon name="chevron-right" class="graph-query-history-row__icon" aria-hidden="true" />
                      </span>
                    </button>
                  </div>
                  <div v-if="!currentHistoryList.length" class="ds-page-empty-block ds-page-empty-block--l1 graph-query-panel__empty">
                    <a-empty :description="historySearchKeyword ? '未找到匹配历史' : '当前图谱暂无查询历史'" />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
        <a-modal
          :open="nodePickerOpen"
          :title="nodePickerTitle"
          width="1000px"
          wrap-class-name="graph-query-node-modal-wrap"
          :footer="null"
          destroyOnClose
          @cancel="nodePickerOpen = false"
        >
          <div class="graph-query-node-modal">
            <section class="graph-query-node-modal__advanced">
              <span class="graph-query-node-modal__advanced-badge">高级搜索</span>
              <div class="graph-query-node-modal__advanced-fields">
                <label class="graph-query-node-modal__field graph-query-node-modal__field--type">
                  <span class="graph-query-node-modal__field-label">实体类型</span>
                  <a-select v-model:value="nodePickerType" placeholder="请选择实体类型" aria-label="实体类型">
                    <a-select-option v-for="type in entityTypeOptions" :key="type" :value="type">{{ type }}</a-select-option>
                  </a-select>
                </label>
                <div class="graph-query-node-modal__field-row">
                  <label class="graph-query-node-modal__field">
                    <span class="graph-query-node-modal__field-label">id</span>
                    <a-input v-model:value="nodePickerId" placeholder="输入 id 搜索值" allow-clear />
                  </label>
                  <label class="graph-query-node-modal__field">
                    <span class="graph-query-node-modal__field-label">name</span>
                    <a-input v-model:value="nodePickerName" placeholder="输入 name 搜索值" allow-clear />
                  </label>
                </div>
              </div>
              <div class="graph-query-node-modal__advanced-actions">
                <a-button type="primary" @click="searchNodePicker">查询</a-button>
                <a-button @click="clearNodePickerSearch">清空</a-button>
              </div>
            </section>
            <section v-if="nodePickerSearched" class="graph-query-node-modal__results">
              <div v-if="nodePickerOptions.length" class="graph-query-node-modal__list">
                <button
                  v-for="node in nodePickerOptions"
                  :key="node.id"
                  type="button"
                  class="graph-query-node-option"
                  :class="{ 'is-selected': selectedPickerNodes.some((item) => item.id === node.id) }"
                  @click="selectNodeOption(node)"
                >
                  <span class="graph-query-node-option__main">
                    <span class="graph-query-node-option__name">{{ node.name }}</span>
                    <span class="graph-query-node-option__meta">{{ node.type }} · {{ node.code }}</span>
                  </span>
                  <span class="graph-query-node-option__action">
                    {{ selectedPickerNodes.some((item) => item.id === node.id) ? '已添加' : '添加' }}
                  </span>
                </button>
              </div>
              <a-empty v-else description="未找到匹配节点" />
            </section>

            <section class="graph-query-node-modal__panel">
              <div class="graph-query-node-modal__panel-head">
                <span class="graph-query-node-modal__panel-title">已选节点（{{ selectedPickerNodes.length }}）</span>
                <button
                  type="button"
                  class="graph-query-node-modal__clear-all"
                  :disabled="!selectedPickerNodes.length"
                  @click="clearAllPickerNodes"
                >
                  清空全部
                </button>
              </div>
              <div class="graph-query-node-modal__panel-body">
                <div v-if="selectedPickerNodes.length" class="graph-query-node-modal__chips">
                  <span
                    v-for="node in selectedPickerNodes"
                    :key="node.id"
                    class="graph-query-node-chip"
                  >
                    <span>{{ node.name }}</span>
                    <button
                      type="button"
                      aria-label="移除已选节点"
                      @click="removePathNode(nodePickerTarget, node.id)"
                    >×</button>
                  </span>
                </div>
                <a-empty v-else description="暂无节点数据" />
              </div>
            </section>

            <div class="graph-query-node-modal__footer ds-modal-footer-end">
              <a-button @click="nodePickerOpen = false">取消</a-button>
              <a-button
                type="primary"
                :disabled="!selectedPickerNodes.length"
                @click="confirmNodePicker"
              >
                确认选择（{{ selectedPickerNodes.length }}）
              </a-button>
            </div>
          </div>
        </a-modal>
        <a-modal
          :open="aiGenerateOpen"
          title="生成 GQL 查询"
          width="760px"
          wrap-class-name="graph-query-ai-modal-wrap"
          :footer="null"
          destroyOnClose
          @cancel="aiGenerateOpen = false"
        >
          <div class="graph-query-ai-modal">
            <label class="graph-query-ai-modal__field">
              <span>选择知识库</span>
              <a-select v-model:value="aiKnowledgeBase" placeholder="请选择知识库">
                <a-select-option v-for="item in aiKnowledgeBaseOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <label class="graph-query-ai-modal__field">
              <span>选择模型品牌</span>
              <a-select v-model:value="aiModel" placeholder="请选择模型品牌">
                <a-select-option v-for="item in aiModelOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </label>
            <label class="graph-query-ai-modal__field">
              <span>查询需求描述</span>
              <a-textarea
                v-model:value="aiRequirement"
                :maxlength="500"
                :auto-size="{ minRows: 5, maxRows: 8 }"
                placeholder="请描述您的查询需求，例如：查找所有与杭州交投科技有限公司有投资关系的公司"
              />
              <span class="graph-query-ai-modal__counter">{{ String(aiRequirement || '').length }} / 500</span>
            </label>
            <div class="graph-query-ai-modal__footer ds-modal-footer-end">
              <a-button @click="aiGenerateOpen = false">取消</a-button>
              <a-button
                type="primary"
                :disabled="!aiKnowledgeBase || !aiModel || !String(aiRequirement || '').trim()"
                @click="generateCypherByAi"
              >
                生成
              </a-button>
            </div>
          </div>
        </a-modal>
      </div>
    `,
  });
})();
