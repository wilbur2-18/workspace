(function () {
  const app = window.__DGP_COMPONENT_APP;
  const layoutMixin = window.DGP_WORKBENCH_LAYOUT || {};

  /** 图数据模板 → 历史小图（演示用子图，不改 mock 结构） */
  const DATA_TEMPLATE_HISTORY_MAP = {
    'dt-chain': 'h-a-03',
    'dt-risk': 'h-a-06',
    'dt-treasury': 'h-a-04',
    'dt-control': 'h-audit-100',
    'dt-bid': 'h-p-02',
    'dt-loop': 'h-a-14',
  };

  const BASIC_TEMPLATE_HISTORY_MAP = {
    entity: 'h-a',
    path: 'h-a-14',
    cypher: 'h-audit-100',
  };

  app.component('GraphWorkbenchView', {
    mixins: [layoutMixin],
    props: {
      graph: { type: Object, required: true },
      history: { type: Array, required: true },
      basicTemplates: { type: Array, default: () => [] },
      dataTemplates: { type: Array, default: () => [] },
      result: { type: Object, required: true },
      querySummary: { type: String, required: true },
      activeHistoryId: { type: String, default: '' },
    },
    emits: ['open-quick-query-modal', 'open-template-query', 'go-home', 'select-history', 'rename-history', 'delete-history'],
    data() {
      return {
        workbenchTopTab: 'graph-query',
        onGraphAnalysisTool: '',
        onAlgorithmAnalysisTool: '',
        viewMode: 'canvas',
        legendVisible: true,
        rightPanelTabs: [{ id: 'rp-chat-init', type: 'chat', title: '对话' }],
        activeRightPanelTabId: 'rp-chat-init',
        rightPanelTabSeq: 1,
        graphAnalysisForm: {
          cycleAlgo: 'dfs',
          cycleMaxLen: '3',
          cycleMaxLen2: '10',
          cycleUndirected: false,
          includeNodes: [],
          searchAlgo: 'keyword-partial',
          searchScope: 'label',
          keyword: '',
          pathStart: undefined,
          pathEnd: undefined,
          pathLength: '10',
          maxPaths: '5',
        },
        graphAnalysisHasResults: false,
        graphAnalysisTasks: [],
        graphAnalysisTaskSeq: 0,
        graphChatSeeded: false,
        graphChatMessages: [],
        graphChatInput: '',
        graphChatSeq: 0,
        graphChatReplyPending: false,
        graphChatAutoAnalysisToken: 0,
        selectedType: 'node',
        selectedId: '',
        hiddenNodeIds: [],
        hiddenNodeTypes: [],
        hiddenEdgeTypes: [],
        nodeColorMap: {},
        edgeColorMap: {},
        nodeLabelFields: {},
        edgeLabelFields: {},
        historyFilter: '',
        historyTab: 'recent',
        historySearchOpen: false,
        queryTemplateTab: 'general',
        pinnedHistoryIds: ['h-audit-100', 'h-a-03'],
        advancedFilterModalOpen: false,
        advancedFilterDraftRules: [],
        advancedFilterStripOpen: false,
        listDisplayMode: 'split',
        listSinglePane: 'nodes',
        listNodeSort: { field: '', order: '' },
        listEdgeSort: { field: '', order: '' },
        listColumnFilterDraft: { target: 'node', field: 'label', operator: 'contains', value: '' },
        filterRuleSeq: 1,
        globalFilterRules: [],
        querySteps: [],
        focusedStepId: '',
        editingStepFilterId: '',
        addStepMenuOpen: false,
        templatePickerOpen: false,
        templatePickerMode: '',
        templatePickerStepId: '',
        filterDrawerOpen: false,
        filterDrawerTarget: '',
        scopeFlyoutStyle: null,
        layoutPickerStyle: null,
        listLayoutPickerOpen: false,
        listLayoutPickerStyle: null,
        pendingQueryTemplateRef: null,
        savedStepTemplates: [],
        layoutMode: 'force',
        layoutTemplateKey: 'force',
        layoutPickerOpen: false,
        operationPanelCollapsed: false,
        queryPanelCollapsed: false,
        canvasFullscreen: false,
        canvasMinimapOpen: false,
        sourceDataModalOpen: false,
        renameHistoryOpen: false,
        renameHistoryTarget: null,
        renameHistoryName: '',
        canvasContextMenu: {
          open: false,
          x: 0,
          y: 0,
        },
      };
    },
    computed: {
      activeRightPanelTab() {
        return this.rightPanelTabs.find((tab) => tab.id === this.activeRightPanelTabId) || null;
      },
      isRightPanelVisible() {
        return !this.operationPanelCollapsed;
      },
      isStyleTabActive() {
        const styleTab = this.rightPanelTabs.find((tab) => tab.type === 'style');
        return Boolean(styleTab && this.activeRightPanelTabId === styleTab.id && !this.operationPanelCollapsed);
      },
      graphAnalysisCycleAlgoOptions() {
        return [{ label: '深度优先搜索(DFS)', value: 'dfs' }];
      },
      graphAnalysisSearchAlgoOptions() {
        return [{ label: '关键词搜索(部分匹配)', value: 'keyword-partial' }];
      },
      graphAnalysisSearchScopeOptions() {
        return [{ label: '标签搜索', value: 'label' }];
      },
      graphAnalysisNodeOptions() {
        return this.visibleNodes.slice(0, 24).map((node) => ({
          label: `${node.label || node.id}（${node.type || '实体'}）`,
          value: node.id,
        }));
      },
      graphHistory() {
        const q = this.historyFilter.trim().toLowerCase();
        const list = this.history
          .filter((h) => h.baseId === this.graph.id)
          .filter((h) => this.historyTab !== 'favorite' || this.pinnedHistoryIds.includes(h.id))
          .filter((h) => {
            if (!q) return true;
            return [h.name, h.mode, h.updated].some((v) => String(v || '').toLowerCase().includes(q));
          });
        list.sort((a, b) => {
          const pa = this.pinnedHistoryIds.includes(a.id) ? 1 : 0;
          const pb = this.pinnedHistoryIds.includes(b.id) ? 1 : 0;
          if (pa !== pb) return pb - pa;
          const ta = Date.parse(String(a.updated).replace(/-/g, '/')) || 0;
          const tb = Date.parse(String(b.updated).replace(/-/g, '/')) || 0;
          return tb - ta;
        });
        return list;
      },
      historyEmptyText() {
        if (this.historyFilter.trim()) return '未找到匹配查询';
        return this.historyTab === 'favorite' ? '暂无收藏查询' : '暂无最近查询';
      },
      generalQueryTemplateCards() {
        return [
          {
            key: 'entity',
            title: '实体查询',
            desc: '按实体快速定位关联关系',
            icon: 'bullseye',
            action: 'quick',
            mode: 'entity',
          },
          {
            key: 'path',
            title: '路径查询',
            desc: '寻找实体间的关联路径',
            icon: 'link',
            action: 'quick',
            mode: 'path',
          },
          {
            key: 'cypher',
            title: '语言查询',
            desc: '使用 GQL / Cypher 语句查询',
            icon: 'code',
            action: 'quick',
            mode: 'cypher',
          },
        ];
      },
      dataTemplateCards() {
        return this.dataTemplates.map((item) => ({
          key: item.id,
          title: item.name,
          desc: item.desc,
          iconSymbol: 'whole-site-accelerator',
          action: 'template',
          templateId: item.id,
        }));
      },
      queryTemplateCards() {
        return this.queryTemplateTab === 'template' ? this.dataTemplateCards : this.generalQueryTemplateCards;
      },
      queryTemplateEmptyText() {
        return this.queryTemplateTab === 'template' ? '暂无可用模板' : '暂无通用查询';
      },
      workbenchTitle() {
        return (this.graph.name || '') + ' / ' + (this.result.name || '');
      },
      workbenchTopTabOptions() {
        return [
          { value: 'graph-query', label: '开始' },
          { value: 'on-graph-analysis', label: '分析' },
        ];
      },
      isAlgorithmCycleActive() {
        if (this.activeRightPanelTab?.type === 'analysis-cycle') return true;
        return this.onAlgorithmAnalysisTool === 'algo-cycle-directed' || this.onAlgorithmAnalysisTool === 'algo-cycle-undirected';
      },
      isAnalysisNodeSearchActive() {
        return this.activeRightPanelTab?.type === 'analysis-node-search' || this.onAlgorithmAnalysisTool === 'node-search';
      },
      isAnalysisPathQueryActive() {
        return this.activeRightPanelTab?.type === 'analysis-path-query' || this.onAlgorithmAnalysisTool === 'path-query';
      },
      isAgentAssistantActive() {
        return this.activeRightPanelTab?.type === 'chat';
      },
      visibleGraphAnalysisTasks() {
        return this.graphAnalysisTasks.filter((task) => task.status === 'running' || task.status === 'done');
      },
      selectedNode() {
        return this.result.nodes.find((n) => n.id === this.selectedId) || this.result.nodes[0];
      },
      selectedEdge() {
        return this.result.edges.find((e) => e.id === this.selectedId) || this.result.edges[0];
      },
      selectedObject() {
        return this.selectedType === 'edge' ? this.selectedEdge : this.selectedNode;
      },
      mergedScopeNodes() {
        const nodeMap = new Map();
        const steps = (this.querySteps || []).filter((s) => s.includedInView);
        steps.forEach((step) => {
          this.getStepFilteredNodes(step).forEach((n) => nodeMap.set(n.id, n));
        });
        return Array.from(nodeMap.values());
      },
      mergedScopeEdges() {
        const nodeIds = new Set(this.mergedScopeNodes.map((n) => n.id));
        const edgeMap = new Map();
        const steps = (this.querySteps || []).filter((s) => s.includedInView);
        steps.forEach((step) => {
          this.getStepFilteredEdges(step).forEach((e) => {
            if (nodeIds.has(e.from) && nodeIds.has(e.to)) edgeMap.set(e.id, e);
          });
        });
        return Array.from(edgeMap.values());
      },
      visibleNodes() {
        return this.mergedScopeNodes.filter((n) => {
          const type = n.type || '未分类实体';
          if (this.hiddenNodeIds.includes(n.id) || this.hiddenNodeTypes.includes(type)) return false;
          return this.matchesAppliedAdvancedRules(n, 'node');
        });
      },
      visibleNodeIds() {
        return new Set(this.visibleNodes.map((n) => n.id));
      },
      visibleEdges() {
        const nodeIds = this.visibleNodeIds;
        return this.mergedScopeEdges.filter((e) => {
          const type = e.type || '未分类关系';
          if (this.hiddenEdgeTypes.includes(type)) return false;
          if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) return false;
          return this.matchesAppliedAdvancedRules(e, 'edge');
        });
      },
      queryScopeStats() {
        return {
          nodeCount: this.visibleNodes.length,
          edgeCount: this.visibleEdges.length,
        };
      },
      displayScopeLabel() {
        const indices = (this.querySteps || [])
          .map((s, i) => (s.includedInView ? i + 1 : 0))
          .filter(Boolean);
        if (!indices.length) return '未选择步骤';
        if (indices.length === 1) return `步骤 ${indices[0]}`;
        if (indices.length === (this.querySteps || []).length) return `步骤 1–${indices.length} 并集`;
        return `步骤 ${indices.join('、')} 并集`;
      },
      activeGlobalFilterRules() {
        return (this.globalFilterRules || []).filter((rule) => String(rule.value || '').trim());
      },
      globalFilterSummary() {
        return this.activeGlobalFilterRules.length
          ? `已启用 ${this.activeGlobalFilterRules.length} 个条件`
          : '未启用';
      },
      advancedFilterSummary() {
        const n = this.activeGlobalFilterRules.length;
        if (!n) return '未设置条件';
        if (n === 1) {
          const r = this.activeGlobalFilterRules[0];
          const target = r.target === 'edge' ? '关系' : '实体';
          return `${target} · ${r.field} ${r.value}`;
        }
        return `已设置 ${n} 条条件`;
      },
      advancedFilterTags() {
        return this.activeGlobalFilterRules.map((rule) => ({
          id: rule.id,
          label: this.formatFilterRuleLabel(rule),
        }));
      },
      showAdvancedFilterStrip() {
        return this.advancedFilterStripOpen && this.advancedFilterTags.length > 0;
      },
      entityTypeFilterItems() {
        const counts = new Map();
        this.mergedScopeNodes.forEach((n) => {
          const type = n.type || '未分类实体';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return Array.from(counts.entries())
          .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
          .map(([type, count]) => ({
            type,
            count,
            color: this.nodeColorMap[type] || this.defaultNodeColor(type),
            hidden: this.hiddenNodeTypes.includes(type),
          }));
      },
      edgeTypeFilterItems() {
        const counts = new Map();
        this.mergedScopeEdges.forEach((e) => {
          const type = e.type || '未分类关系';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return Array.from(counts.entries())
          .sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
          .map(([type, count]) => ({
            type,
            count,
            color: this.edgeColorMap[type] || this.defaultEdgeColor(type),
            hidden: this.hiddenEdgeTypes.includes(type),
          }));
      },
      focusedStep() {
        return (this.querySteps || []).find((s) => s.id === this.focusedStepId) || this.querySteps[0] || null;
      },
      emphasisNodeIds() {
        const step = this.focusedStep;
        return step ? [...(step.nodeIds || [])] : [];
      },
      templatePickerTitle() {
        if (this.templatePickerMode === 'initial') return '更换起点模板';
        if (this.templatePickerMode === 'add') return '添加查询步骤';
        if (this.templatePickerMode === 'edit') return '更换本步模板';
        return '选择查询模板';
      },
      filterDrawerTitle() {
        if (this.filterDrawerTarget === 'global') return '全局过滤';
        const step = this.querySteps.find((s) => s.id === this.filterDrawerTarget);
        return step ? `${step.label} · 步骤过滤` : '过滤配置';
      },
      filterDrawerStep() {
        if (this.filterDrawerTarget === 'global') return null;
        return this.querySteps.find((s) => s.id === this.filterDrawerTarget) || null;
      },
      filterDrawerRules() {
        if (this.filterDrawerTarget === 'global') return this.globalFilterRules;
        return this.filterDrawerStep?.stepFilterRules || [];
      },
      activeHistoryItem() {
        return this.history.find((h) => h.id === this.activeHistoryId) || null;
      },
      activeFilterRules() {
        return this.activeGlobalFilterRules;
      },
      filterTargetOptions() {
        return [
          { label: '实体', value: 'node' },
          { label: '关系', value: 'edge' },
        ];
      },
      filterOperatorOptions() {
        return [
          { label: '包含', value: 'contains' },
          { label: '等于', value: 'equals' },
          { label: '不等于', value: 'notEquals' },
          { label: '大于等于', value: 'gte' },
          { label: '小于等于', value: 'lte' },
        ];
      },
      nodeFilterFieldOptions() {
        const propKeys = new Set();
        (this.result.nodes || []).forEach((n) => Object.keys(n.props || {}).forEach((key) => propKeys.add(key)));
        return [
          { label: '名称', value: 'label' },
          { label: '类型', value: 'type' },
          { label: 'ID', value: 'id' },
          { label: '风险分', value: 'riskScore' },
          { label: '权重', value: 'weight' },
          ...Array.from(propKeys).map((key) => ({ label: key, value: key })),
        ];
      },
      edgeFilterFieldOptions() {
        const propKeys = new Set();
        (this.result.edges || []).forEach((e) => Object.keys(e.props || {}).forEach((key) => propKeys.add(key)));
        return [
          { label: '关系类型', value: 'type' },
          { label: '起点', value: 'from' },
          { label: '终点', value: 'to' },
          { label: '金额', value: 'amountValue' },
          { label: 'ID', value: 'id' },
          { label: '权重', value: 'weight' },
          ...Array.from(propKeys).map((key) => ({ label: key, value: key })),
        ];
      },
      edgeRows() {
        let edges = this.selectedType === 'node' && this.selectedId
          ? this.visibleEdges.filter((e) => e.from === this.selectedId || e.to === this.selectedId)
          : this.visibleEdges;
        edges = this.sortListByColumn(edges, 'edge');
        return edges.map((e) => ({
          key: e.id,
          id: e.id,
          type: e.type,
          from: this.nodeLabel(e.from),
          to: this.nodeLabel(e.to),
          amount: e.amount,
          _fromId: e.from,
          _toId: e.to,
          _amountValue: e.amountValue,
        }));
      },
      nodeRows() {
        let nodes = this.selectedType === 'edge' && this.selectedEdge
          ? this.visibleNodes.filter((n) => n.id === this.selectedEdge.from || n.id === this.selectedEdge.to)
          : this.visibleNodes;
        nodes = this.sortListByColumn(nodes, 'node');
        return nodes.map((n) => ({ key: n.id, id: n.id, label: n.label, type: n.type, props: n.props }));
      },
      nodeColumns() {
        const { field, order } = this.listNodeSort;
        return [
          this.buildListTableColumn({
            title: '名称',
            dataIndex: 'label',
            key: 'label',
            target: 'node',
            field: 'label',
            sortState: { field, order },
            sorter: (a, b) => String(a.label || '').localeCompare(String(b.label || ''), 'zh-CN'),
          }),
          this.buildListTableColumn({
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            target: 'node',
            field: 'type',
            sortState: { field, order },
            sorter: (a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'zh-CN'),
          }),
          this.buildListTableColumn({
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            target: 'node',
            field: 'id',
            sortState: { field, order },
            sorter: (a, b) => String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN'),
          }),
        ];
      },
      edgeColumns() {
        const { field, order } = this.listEdgeSort;
        return [
          this.buildListTableColumn({
            title: '关系',
            dataIndex: 'type',
            key: 'type',
            target: 'edge',
            field: 'type',
            sortState: { field, order },
            sorter: (a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'zh-CN'),
          }),
          this.buildListTableColumn({
            title: '起点',
            dataIndex: 'from',
            key: 'from',
            target: 'edge',
            field: 'from',
            sortState: { field, order },
            sorter: (a, b) => String(a.from || '').localeCompare(String(b.from || ''), 'zh-CN'),
          }),
          this.buildListTableColumn({
            title: '终点',
            dataIndex: 'to',
            key: 'to',
            target: 'edge',
            field: 'to',
            sortState: { field, order },
            sorter: (a, b) => String(a.to || '').localeCompare(String(b.to || ''), 'zh-CN'),
          }),
          this.buildListTableColumn({
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            target: 'edge',
            field: 'amountValue',
            width: 90,
            sortState: { field, order },
            sorter: (a, b) => Number(b._amountValue || 0) - Number(a._amountValue || 0),
          }),
        ];
      },
      listNodeTitle() {
        return this.selectedType === 'edge' && this.selectedId ? '关联节点' : '节点列表';
      },
      listEdgeTitle() {
        return this.selectedType === 'node' && this.selectedId ? '关联关系' : '关系列表';
      },
      listNodeSummary() {
        if (this.selectedType === 'edge' && this.selectedEdge) {
          return `当前关系两端节点 · ${this.nodeRows.length} 条`;
        }
        return `当前可见节点 · ${this.nodeRows.length} 条`;
      },
      listEdgeSummary() {
        if (this.selectedType === 'node' && this.selectedNode) {
          return `${this.selectedNode.label || this.selectedNode.id} 的关联关系 · ${this.edgeRows.length} 条`;
        }
        return `当前可见关系 · ${this.edgeRows.length} 条`;
      },
      relationTypeSummary() {
        const types = Array.from(new Set(this.visibleEdges.map((e) => e.type).filter(Boolean)));
        return types.length ? types.join(' / ') : '暂无关系';
      },
      querySubjectLabel() {
        const node = this.selectedType === 'node' ? this.selectedNode : this.result.nodes[0];
        if (!node) return this.result.name || '当前查询';
        return `${node.label || node.id} / ${node.type || '实体'}`;
      },
      queryStatusText() {
        const hiddenNodeTypeCount = this.hiddenNodeTypes.length;
        const hiddenEdgeTypeCount = this.hiddenEdgeTypes.length;
        const hiddenCount = this.hiddenNodeIds.length + hiddenNodeTypeCount + hiddenEdgeTypeCount;
        return hiddenCount > 0 ? `已过滤 · 隐藏 ${hiddenCount} 项` : '原始结果 · 未隐藏节点';
      },
      resultScaleText() {
        return `${this.queryScopeStats.nodeCount} 个节点 · ${this.queryScopeStats.edgeCount} 条关系`;
      },
      initialStepQuerySummary() {
        const profile = this.queryTemplateProfile;
        const subject = this.querySubjectLabel;
        const layers = (this.result.nodes || []).map((n) => {
          const match = String((n.props && n.props['层级']) || '').match(/\d+/);
          return Number(n.layer !== undefined ? n.layer : (match ? match[0] : 0));
        });
        const maxLayer = Math.max(0, ...layers);
        return `${subject} · ${maxLayer || 2} 跳`;
      },
      queryTemplateProfile() {
        const mode = this.activeHistoryItem?.mode || this.querySummary.split('/')[0]?.trim() || '实体信息查询';
        const name = this.result.name || this.activeHistoryItem?.name || '当前查询图';
        const subject = this.querySubjectLabel;
        const layers = this.result.nodes.map((n) => {
          const match = String((n.props && n.props['层级']) || '').match(/\d+/);
          return Number(n.layer !== undefined ? n.layer : (match ? match[0] : 0));
        });
        const maxLayer = Math.max(0, ...layers);
        const relationTypes = this.relationTypeSummary;
        const updated = this.activeHistoryItem?.updated ? this.formatHistoryUpdated(this.activeHistoryItem.updated) : '当前执行';
        const profiles = {
          主体链路穿透: {
            template: '主体链路穿透',
            desc: '按主体名称、穿透层级和关系范围生成多跳关联网络。',
            tags: ['模板查询', `${maxLayer || 2} 跳`, '双向关系'],
            rows: [
              ['主体名称', subject],
              ['查询层级', `${maxLayer || 2} 跳`],
              ['关系类型', relationTypes],
              ['关系方向', '入边 + 出边'],
              ['时间范围', '2023-01-01 至 2026-05-20'],
              ['执行时间', updated],
            ],
          },
          国库支付穿透: {
            template: '国库支付穿透',
            desc: '围绕行政事业单位国库支付、开票和人员关系做方向追踪。',
            tags: ['模板查询', `${maxLayer || 4} 跳`, '支付链'],
            rows: [
              ['单位或企业', name.replace(/^国库支付-/, '')],
              ['穿透跳数', `${maxLayer || 4} 跳`],
              ['最小金额', '10 万元'],
              ['关系类型', relationTypes],
              ['方向边', '遵循国库支付与开票方向'],
              ['执行时间', updated],
            ],
          },
          高风险对象排查: {
            template: '高风险对象排查',
            desc: '按风险评分筛选重点人员和企业，并展开电话、车辆、单位等线索。',
            tags: ['模板查询', '风险分层', '高分优先'],
            rows: [
              ['排查批次', '财政供养交叉批次02'],
              ['最低匹配分', '60'],
              ['扩展层级', `${maxLayer || 3} 跳`],
              ['命中类型', this.nodeTypeSummary],
              ['关系类型', relationTypes],
              ['执行时间', updated],
            ],
          },
          支付闭环排查: {
            template: '支付闭环排查',
            desc: '检查国库支付、开票、人员、电话和车辆是否形成闭合链路。',
            tags: ['模板查询', '闭环', '支付开票'],
            rows: [
              ['查询对象', subject],
              ['闭环层级', `${maxLayer || 4} 层`],
              ['主路径关系', relationTypes],
              ['证据类型', this.nodeTypeSummary],
              ['执行时间', updated],
            ],
          },
          围标团伙排查: {
            template: '围标团伙排查',
            desc: '通过同电话、同车辆、人员关系和法人股东识别企业团伙。',
            tags: ['模板查询', '社区聚类', '桥接线索'],
            rows: [
              ['采购批次', name.replace(/^围标排查-/, '')],
              ['社区数量', `${new Set((this.result.nodes || []).map((n) => n.groupId)).size} 个`],
              ['桥接关系', relationTypes],
              ['实体类型', this.nodeTypeSummary],
              ['执行时间', updated],
            ],
          },
          路径分析: {
            template: '路径分析',
            desc: '指定起点、终点和最大深度，查找实体间可解释路径。',
            tags: ['通用查询', `${maxLayer || 3} 跳`, '路径'],
            rows: [
              ['起始节点', this.result.nodes[0]?.label || '—'],
              ['目标节点', this.result.nodes[this.result.nodes.length - 1]?.label || '—'],
              ['最大深度', `${maxLayer || 3} 跳`],
              ['边型', relationTypes],
              ['方向边', '遵循关系方向'],
              ['执行时间', updated],
            ],
          },
          实体信息查询: {
            template: '实体信息查询',
            desc: '按实体类型、ID、名称和步数生成初始查询结果。',
            tags: ['通用查询', `${maxLayer || 2} 跳`, '实体'],
            rows: [
              ['实体类型', this.selectedNode?.type || this.result.nodes[0]?.type || '实体'],
              ['实体名称', this.selectedNode?.label || this.result.nodes[0]?.label || '—'],
              ['查询步数', `${maxLayer || 2} 跳`],
              ['关系方向', '两个都'],
              ['关系类型', relationTypes],
              ['执行时间', updated],
            ],
          },
        };
        return profiles[mode] || {
          template: mode,
          desc: '基于当前查询模板参数生成图谱结果。',
          tags: ['模板查询', `${maxLayer || 2} 跳`, '结果图'],
          rows: [
            ['查询对象', subject],
            ['查询模板', mode],
            ['查询层级', `${maxLayer || 2} 跳`],
            ['实体类型', this.nodeTypeSummary],
            ['关系类型', relationTypes],
            ['执行时间', updated],
          ],
        };
      },
      queryConfigRows() {
        return [
          ['底层图谱', this.graph.name],
          ...this.queryTemplateProfile.rows,
          ['结果状态', this.queryStatusText],
          ['结果规模', this.resultScaleText],
        ];
      },
      nodeTypeSummary() {
        const types = Array.from(new Set((this.result.nodes || []).map((n) => n.type || '未分类实体')));
        return types.join(' / ') || '暂无实体';
      },
      queryFilterSummary() {
        return this.activeFilterRules.length
          ? `已启用 ${this.activeFilterRules.length} 个条件`
          : '未启用过滤';
      },
      layoutModeOptions() {
        const modes = window.DGP_GRAPH_LAYOUT?.LAYOUT_MODES || [
          { value: 'force', label: '关系探索' },
          { value: 'radial', label: '中心穿透' },
          { value: 'hierarchical', label: '链路分层' },
          { value: 'concentric', label: '风险分层' },
          { value: 'circular', label: '环形闭环' },
          { value: 'grid', label: '网格浏览' },
          { value: 'community', label: '社区聚类' },
        ];
        return modes.map((m) => ({ label: m.label, value: m.value }));
      },
      layoutCatalog() {
        const modes = window.DGP_GRAPH_LAYOUT?.LAYOUT_MODES || [];
        return modes.map((m) => ({
          ...m,
          key: m.value,
          layout: m.value,
          variant: m.value,
          caseName: this.history.find((h) => h.id === m.recommendedHistoryId)?.name || '当前查询',
        }));
      },
      layoutTemplateGroups() {
        const list = this.layoutCatalog;
        return [
          { title: '全部布局', items: list },
        ];
      },
      currentLayoutTemplate() {
        return this.layoutCatalog
          .find((item) => item.key === this.layoutTemplateKey || item.layout === this.layoutMode) || this.layoutCatalog[0] || {};
      },
      listDisplayModeCatalog() {
        return [
          {
            key: 'split',
            label: '双表',
            variant: 'split',
            hint: '节点表与关系表并列展示',
          },
          {
            key: 'single',
            label: '单表',
            variant: 'single',
            hint: '单表展示，可切换节点或关系',
          },
        ];
      },
      listDisplayModeGroups() {
        return [{ title: '列表展示', items: this.listDisplayModeCatalog }];
      },
      currentListDisplayMode() {
        return this.listDisplayModeCatalog.find((item) => item.key === this.listDisplayMode) || this.listDisplayModeCatalog[0];
      },
      entityStyleRows() {
        const counts = new Map();
        this.result.nodes.forEach((node) => {
          const type = node.type || '未分类实体';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([type, count]) => ({
          type,
          count,
          color: this.nodeColorMap[type] || this.defaultNodeColor(type),
          labelField: this.nodeLabelFields[type] || 'label',
          labelOptions: this.nodeLabelOptions(type),
        }));
      },
      edgeStyleRows() {
        const counts = new Map();
        this.result.edges.forEach((edge) => {
          const type = edge.type || '未分类关系';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return Array.from(counts.entries()).map(([type, count]) => ({
          type,
          count,
          color: this.edgeColorMap[type] || this.defaultEdgeColor(type),
          labelField: this.edgeLabelFields[type] || 'type',
          labelOptions: this.edgeLabelOptions(type),
        }));
      },
      activeLayoutHint() {
        const modes = window.DGP_GRAPH_LAYOUT?.LAYOUT_MODES || [];
        const hit = modes.find((m) => m.value === this.layoutMode);
        const base = hit?.desc || '';
        if (this.viewMode !== 'canvas' || this.visibleNodes.length <= 45) return base;
        const focus = '大图谱：默认显示节点名称与关系名称；选中节点或关系时高亮当前对象，悬停可查看完整属性信息；显示属性决定名称取自哪个字段';
        return base ? `${base} · ${focus}` : focus;
      },
      graphCenterNodeId() {
        return this.result.centerNodeId || '';
      },
      graphTreeRootId() {
        return this.result.treeRootId || this.result.centerNodeId || '';
      },
      graphPathNodeIds() {
        return this.result.pathNodeIds || [];
      },
      activeSelectedNode() {
        if (this.selectedType !== 'node' || !this.selectedId) return null;
        return this.visibleNodes.find((n) => n.id === this.selectedId) || null;
      },
      isCanvasContextCenterDisabled() {
        const node = this.activeSelectedNode;
        if (!node) return true;
        const centerId = this.graphCenterNodeId || this.result?.centerNodeId || '';
        return Boolean(centerId && centerId === node.id);
      },
      selectedObjectTitle() {
        if (!this.selectedObject) return '未选中对象';
        const prefix = this.selectedType === 'edge' ? '关系' : '节点';
        return `${prefix}：${this.selectedObject.label || this.selectedObject.type || this.selectedObject.id}`;
      },
      selectedObjectIdLabel() {
        return this.selectedType === 'edge' ? '关系ID' : '节点ID';
      },
      selectedObjectTypeLabel() {
        if (!this.selectedObject) return '暂无类型';
        return this.selectedType === 'edge' ? (this.selectedObject.type || '未分类关系') : (this.selectedObject.type || '未分类实体');
      },
      selectedObjectDetailRows() {
        const item = this.selectedObject;
        if (!item) return [];
        const rows = [];
        const push = (label, value) => {
          if (value === undefined || value === null || value === '') return;
          if (rows.some((row) => row.label === label)) return;
          rows.push({ label, value: String(value) });
        };
        push('ID', item.props?.ID || item.id);
        push('名称', item.label);
        push('类型', item.type);
        if (this.selectedType === 'edge') {
          push('起点', this.nodeLabel(item.from));
          push('终点', this.nodeLabel(item.to));
          push('金额', item.amount);
          push('权重', item.weight);
        } else {
          push('层级', item.level !== undefined ? `第 ${item.level} 层` : undefined);
          push('分组', item.groupId);
          push('风险分', item.riskScore);
          push('权重', item.weight);
        }
        Object.entries(item.props || {}).forEach(([key, value]) => push(key, value));
        return rows;
      },
      selectedObjectSourceUrl() {
        if (!this.selectedObject) return '';
        const kind = this.selectedType === 'edge' ? 'relation' : 'entity';
        const id = encodeURIComponent(this.selectedObject.id || '');
        return `/graph-data/source/${kind}/${id}?graph=${encodeURIComponent(this.graph.id || '')}`;
      },
      sourceDataColumns() {
        return [
          { title: '来源表', dataIndex: 'sourceTable', width: 150 },
          { title: '字段', dataIndex: 'field', width: 120 },
          { title: '值', dataIndex: 'value' },
        ];
      },
      selectedObjectSourceRows() {
        if (!this.selectedObject) return [];
        const objectType = this.selectedObjectTypeLabel;
        const source = this.selectedObject.props?.来源 || (this.selectedType === 'edge' ? '关系明细表' : `${objectType}主数据表`);
        return this.selectedObjectDetailRows.map((row, index) => ({
          key: `${this.selectedObject.id}-${index}`,
          sourceTable: source,
          field: row.label,
          value: row.value,
        }));
      },
      sourceDataModalTitle() {
        return `${this.selectedObjectTitle} · 来源数据`;
      },
    },
    watch: {
      operationPanelCollapsed() {
        this.syncCanvasMinimapLayout();
      },
      layoutPickerOpen(open) {
        if (!open) this.layoutPickerStyle = null;
        else this.$nextTick(() => this.syncLayoutPickerPosition());
      },
      listLayoutPickerOpen(open) {
        if (!open) this.listLayoutPickerStyle = null;
        else this.$nextTick(() => this.syncListLayoutPickerPosition());
      },
      result: {
        immediate: true,
        handler(next) {
          if (!next || !next.nodes || !next.nodes.length) return;
          if (next.recommendedLayout && next.recommendedLayout !== this.layoutMode) {
            this.layoutMode = next.recommendedLayout;
            this.layoutTemplateKey = next.recommendedLayout;
          }
          if (this.selectedId && !next.nodes.some((n) => n.id === this.selectedId)) {
            this.selectedId = '';
            this.selectedType = 'node';
          }
          this.hiddenNodeTypes = [];
          this.hiddenEdgeTypes = [];
          if (!this.applyPendingTemplateToStepIndex()) {
            this.initQuerySession();
          }
          this.ensureStyleDefaults();
        },
      },
    },
    mounted() {
      this._graphAnalysisTaskTimers = {};
      document.addEventListener('fullscreenchange', this.onCanvasFullscreenChange);
      document.addEventListener('keydown', this.onWorkbenchKeydown);
      this._onLayoutPickerReflow = () => {
        if (this.layoutPickerOpen) this.syncLayoutPickerPosition();
        if (this.listLayoutPickerOpen) this.syncListLayoutPickerPosition();
      };
      window.addEventListener('resize', this._onLayoutPickerReflow);
      window.addEventListener('scroll', this._onLayoutPickerReflow, true);
      if (!this.querySteps.length) this.initQuerySession();
    },
    beforeUnmount() {
      this.clearAllAnalysisTaskTimers();
      if (this._graphAutoAnalysisTimer) {
        window.clearTimeout(this._graphAutoAnalysisTimer);
        this._graphAutoAnalysisTimer = 0;
      }
      document.removeEventListener('fullscreenchange', this.onCanvasFullscreenChange);
      document.removeEventListener('keydown', this.onWorkbenchKeydown);
      window.removeEventListener('resize', this._onLayoutPickerReflow);
      window.removeEventListener('scroll', this._onLayoutPickerReflow, true);
    },
    methods: {
      switchWorkbenchTopTab(tab) {
        if (this.workbenchTopTab === tab) return;
        this.workbenchTopTab = tab;
        this.onGraphAnalysisTool = '';
        this.onAlgorithmAnalysisTool = '';
        this.closeAllPopovers();
        if (tab === 'on-graph-analysis') {
          this.viewMode = 'canvas';
          this.layoutPickerOpen = false;
          this.layoutPickerStyle = null;
          this.listLayoutPickerOpen = false;
          this.listLayoutPickerStyle = null;
        }
      },
      runOnGraphAnalysisTool(key) {
        this.onGraphAnalysisTool = key;
        this.onAlgorithmAnalysisTool = '';
        const labels = {
          neighbors: '直接邻居',
          'shortest-path': '最短距离',
          'canvas-cycle-directed': '当前图·有向环路',
          'canvas-cycle-undirected': '当前图·无向环路',
        };
        this.toast(`已执行${labels[key] || '图上分析'}（演示）`);
      },
      runAlgorithmAnalysisTool(key) {
        this.onAlgorithmAnalysisTool = key;
        this.onGraphAnalysisTool = '';
        this.openAnalysisPanelFromTool(key);
      },
      onAlgorithmCycleMenuClick({ key }) {
        if (key === 'algo-cycle-directed' || key === 'algo-cycle-undirected') {
          this.runAlgorithmAnalysisTool(key);
        }
      },
      nextRightPanelTabId(type) {
        this.rightPanelTabSeq += 1;
        return `rp-${type}-${this.rightPanelTabSeq}`;
      },
      defaultRightPanelTabTitle(type, payload = {}) {
        if (type === 'style') return '样式';
        if (type === 'detail') return payload.title || '对象';
        if (type === 'analysis-cycle') return '环检测';
        if (type === 'analysis-node-search') return '节点搜索';
        if (type === 'analysis-path-query') return '路径查询';
        if (type === 'chat') return '对话';
        return '面板';
      },
      openRightPanelTab(type, payload = {}) {
        const existing = this.rightPanelTabs.find((tab) => tab.type === type);
        if (existing) {
          if (payload.title) existing.title = payload.title;
          if (type === 'analysis-cycle' && payload.cycleUndirected !== undefined) {
            this.graphAnalysisForm.cycleUndirected = payload.cycleUndirected;
          }
          this.activeRightPanelTabId = existing.id;
        } else {
          const tab = {
            id: this.nextRightPanelTabId(type),
            type,
            title: payload.title || this.defaultRightPanelTabTitle(type, payload),
          };
          this.rightPanelTabs.push(tab);
          this.activeRightPanelTabId = tab.id;
          if (type === 'analysis-cycle' && payload.cycleUndirected !== undefined) {
            this.graphAnalysisForm.cycleUndirected = payload.cycleUndirected;
          }
        }
        this.layoutPickerOpen = false;
        this.operationPanelCollapsed = false;
      },
      activateRightPanelTab(tabId) {
        if (!this.rightPanelTabs.some((tab) => tab.id === tabId)) return;
        this.activeRightPanelTabId = tabId;
        this.layoutPickerOpen = false;
        this.operationPanelCollapsed = false;
      },
      closeRightPanelTab(tabId) {
        const index = this.rightPanelTabs.findIndex((tab) => tab.id === tabId);
        if (index < 0) return;
        this.rightPanelTabs.splice(index, 1);
        if (this.activeRightPanelTabId === tabId) {
          const nextTab = this.rightPanelTabs[Math.min(index, this.rightPanelTabs.length - 1)];
          this.activeRightPanelTabId = nextTab ? nextTab.id : '';
        }
        if (!this.rightPanelTabs.length) {
          this.operationPanelCollapsed = true;
        }
      },
      detailPanelTabTitle() {
        if (!this.selectedId) return '对象';
        const name = this.selectedObject?.label || this.selectedObject?.id || '';
        return name ? `对象 · ${name}` : '对象';
      },
      ensureGraphChatSeeded() {
        if (this.graphChatSeeded) return;
        this.graphChatSeeded = true;
        this.graphChatSeq = 1;
        this.graphChatMessages = [
          {
            id: 'gc-welcome',
            role: 'bot',
            text: '我是图谱 AI 助手。我会结合当前查询结果与步骤变化自动分析，你也可以继续提问。',
          },
        ];
      },
      summarizeVisibleGraphTypes() {
        const nodeTypes = new Map();
        this.visibleNodes.forEach((n) => {
          const type = n.type || '未分类实体';
          nodeTypes.set(type, (nodeTypes.get(type) || 0) + 1);
        });
        const edgeTypes = new Map();
        this.visibleEdges.forEach((e) => {
          const type = e.type || '未分类关系';
          edgeTypes.set(type, (edgeTypes.get(type) || 0) + 1);
        });
        const topNodes = [...nodeTypes.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type, count]) => `${type} ${count}`)
          .join('、');
        const topEdges = [...edgeTypes.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type, count]) => `${type} ${count}`)
          .join('、');
        return { topNodes: topNodes || '—', topEdges: topEdges || '—' };
      },
      buildGraphAutoAnalysisPrompt(options = {}) {
        const trigger = options.trigger || 'init';
        const step = options.step;
        const graphName = this.result?.name || '当前查询图';
        const stats = this.queryScopeStats;
        const scope = this.displayScopeLabel;
        if (trigger === 'step-added' && step) {
          const stepTitle = step.templateLabel || step.querySummary || step.label;
          return `请结合新增查询步骤「${step.label} · ${stepTitle}」，重新分析当前图谱结果并给出优先排查建议。`;
        }
        return `请分析当前查询结果「${graphName}」（${scope}，${stats.nodeCount} 节点 · ${stats.edgeCount} 关系），识别关键关联与异常模式，并给出优先排查建议。`;
      },
      buildGraphAutoAnalysisReply(options = {}) {
        const trigger = options.trigger || 'init';
        const step = options.step;
        const graphName = this.result?.name || '当前查询图';
        const stats = this.queryScopeStats;
        const scope = this.displayScopeLabel;
        const { topNodes, topEdges } = this.summarizeVisibleGraphTypes();
        const stepLine = step
          ? `最新步骤：${step.label} · ${step.templateLabel || step.querySummary || '未命名步骤'}（${(step.nodeIds || []).length} 节点 / ${(step.edgeIds || []).length} 关系）。`
          : '';
        const intro = trigger === 'step-added'
          ? '已读取最新查询步骤并重新扫描当前画布上下文。'
          : '已读取当前画布上下文（节点、关系类型与筛选条件）。';
        return [
          intro,
          '',
          `查询：${graphName}`,
          `范围：${scope} · ${stats.nodeCount} 节点 · ${stats.edgeCount} 关系`,
          stepLine,
          `主要实体：${topNodes}`,
          `主要关系：${topEdges}`,
          '',
          '初步结论：',
          '1. 存在 2 条疑似资金环路，建议优先查看「供应商 A」及相关企业节点；',
          '2. 最短路径上「账户 X → 账户 Y」关联强度较高，可作为下一跳展开对象；',
          '3. 若需结构化结果，可使用工具栏的环检测、节点搜索或路径查询。',
        ].filter(Boolean).join('\n');
      },
      triggerGraphAutoAnalysis(options = {}) {
        if (!this.result?.nodes?.length || !(this.querySteps || []).length) return;
        const trigger = options.trigger || 'init';
        const step = options.step || null;
        this.graphChatAutoAnalysisToken += 1;
        const token = this.graphChatAutoAnalysisToken;
        this.openGraphAgentAssistant({ skipScroll: true });
        this.ensureGraphChatSeeded();
        const prompt = this.buildGraphAutoAnalysisPrompt({ trigger, step });
        this.graphChatSeq += 1;
        this.graphChatMessages.push({
          id: `gc-${this.graphChatSeq}`,
          role: 'user',
          text: prompt,
          auto: true,
        });
        this.scrollGraphChatToBottom();
        this.graphChatReplyPending = true;
        window.setTimeout(() => {
          if (token !== this.graphChatAutoAnalysisToken) return;
          this.graphChatSeq += 1;
          this.graphChatMessages.push({
            id: `gc-${this.graphChatSeq}`,
            role: 'bot',
            text: this.buildGraphAutoAnalysisReply({ trigger, step }),
          });
          this.graphChatReplyPending = false;
          this.scrollGraphChatToBottom();
        }, 900);
      },
      notifyQueryStepsChanged(payload = {}) {
        this._graphAutoAnalysisPending = payload;
        if (this._graphAutoAnalysisTimer) {
          window.clearTimeout(this._graphAutoAnalysisTimer);
        }
        this._graphAutoAnalysisTimer = window.setTimeout(() => {
          this._graphAutoAnalysisTimer = 0;
          const pending = this._graphAutoAnalysisPending || {};
          this._graphAutoAnalysisPending = null;
          if (pending.reason === 'step-added' && pending.step) {
            this.triggerGraphAutoAnalysis({ trigger: 'step-added', step: pending.step });
            return;
          }
          if (pending.reason === 'init') {
            this.triggerGraphAutoAnalysis({ trigger: 'init' });
          }
        }, 50);
      },
      renderGraphChatMessage(msg) {
        if (!msg) return '';
        const text = String(msg.text || '');
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      },
      scrollGraphChatToBottom() {
        this.$nextTick(() => {
          const wrap = this.$refs.graphChatMessages;
          if (wrap) wrap.scrollTop = wrap.scrollHeight;
        });
      },
      onGraphChatInputKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.sendGraphChat();
        }
      },
      sendGraphChat() {
        const text = this.graphChatInput.trim();
        if (!text || this.graphChatReplyPending) return;
        this.ensureGraphChatSeeded();
        this.graphChatSeq += 1;
        this.graphChatMessages.push({ id: `gc-${this.graphChatSeq}`, role: 'user', text });
        this.graphChatInput = '';
        this.scrollGraphChatToBottom();
        this.graphChatReplyPending = true;
        window.setTimeout(() => {
          this.graphChatSeq += 1;
          this.graphChatMessages.push({
            id: `gc-${this.graphChatSeq}`,
            role: 'bot',
            text:
              '（演示）已收到你的问题。我会结合当前图谱上下文继续分析，你也可以在工具栏使用环检测、节点搜索或路径查询获取结构化结果。',
          });
          this.graphChatReplyPending = false;
          this.scrollGraphChatToBottom();
        }, 720);
      },
      openGraphAgentAssistant(options = {}) {
        this.ensureGraphChatSeeded();
        this.openRightPanelTab('chat');
        this.operationPanelCollapsed = false;
        if (!options.skipScroll) this.scrollGraphChatToBottom();
      },
      openAnalysisPanelFromTool(toolKey) {
        if (toolKey === 'algo-cycle-directed') {
          this.openRightPanelTab('analysis-cycle', { cycleUndirected: false });
          return;
        }
        if (toolKey === 'algo-cycle-undirected') {
          this.openRightPanelTab('analysis-cycle', { cycleUndirected: true });
          return;
        }
        if (toolKey === 'node-search') {
          this.openRightPanelTab('analysis-node-search');
          return;
        }
        if (toolKey === 'path-query') {
          this.openRightPanelTab('analysis-path-query');
        }
      },
      analysisTaskTitle(tabType) {
        const labels = {
          'analysis-cycle': '环检测',
          'analysis-node-search': '节点搜索',
          'analysis-path-query': '路径查询',
        };
        return labels[tabType] || '图分析';
      },
      clearAnalysisTaskTimer(taskId) {
        const timerId = this._graphAnalysisTaskTimers?.[taskId];
        if (timerId) {
          window.clearTimeout(timerId);
          delete this._graphAnalysisTaskTimers[taskId];
        }
      },
      clearAllAnalysisTaskTimers() {
        if (!this._graphAnalysisTaskTimers) return;
        Object.keys(this._graphAnalysisTaskTimers).forEach((taskId) => this.clearAnalysisTaskTimer(taskId));
      },
      runAnalysisTaskProgress(taskId) {
        this.clearAnalysisTaskTimer(taskId);
        const tick = () => {
          const task = this.graphAnalysisTasks.find((item) => item.id === taskId);
          if (!task || task.status !== 'running') return;
          const step = 4 + Math.floor(Math.random() * 7);
          task.progress = Math.min(100, task.progress + step);
          if (task.progress >= 100) {
            task.progress = 100;
            task.status = 'done';
            this.clearAnalysisTaskTimer(taskId);
            return;
          }
          this._graphAnalysisTaskTimers[taskId] = window.setTimeout(tick, 100 + Math.floor(Math.random() * 90));
        };
        this._graphAnalysisTaskTimers[taskId] = window.setTimeout(tick, 160);
      },
      restartAnalysisTask(task) {
        task.progress = 0;
        task.status = 'running';
        this.runAnalysisTaskProgress(task.id);
      },
      startGraphAnalysisTask(tabType) {
        if (!tabType || !tabType.startsWith('analysis-')) return;
        const payload = {};
        if (tabType === 'analysis-cycle') {
          payload.cycleUndirected = this.graphAnalysisForm.cycleUndirected;
        }
        this.openRightPanelTab(tabType, payload);
        const existing = this.graphAnalysisTasks.find((task) => task.tabType === tabType);
        if (existing) {
          existing.cycleUndirected = payload.cycleUndirected;
          this.restartAnalysisTask(existing);
          return;
        }
        this.graphAnalysisTaskSeq += 1;
        const task = {
          id: `gat-${this.graphAnalysisTaskSeq}`,
          tabType,
          title: this.analysisTaskTitle(tabType),
          progress: 0,
          status: 'running',
          cycleUndirected: payload.cycleUndirected,
        };
        this.graphAnalysisTasks.push(task);
        this.runAnalysisTaskProgress(task.id);
      },
      isAnalysisTaskChipActive(task) {
        return this.activeRightPanelTab?.type === task.tabType;
      },
      focusAnalysisTask(task) {
        if (!task) return;
        const payload = {};
        if (task.tabType === 'analysis-cycle' && task.cycleUndirected !== undefined) {
          payload.cycleUndirected = task.cycleUndirected;
        }
        this.openRightPanelTab(task.tabType, payload);
      },
      runGraphAnalysisSearch() {
        const tabType = this.activeRightPanelTab?.type || '';
        if (tabType === 'analysis-node-search') {
          this.graphAnalysisHasResults = Boolean(this.graphAnalysisForm.keyword.trim());
        } else {
          this.graphAnalysisHasResults = false;
        }
        this.startGraphAnalysisTask(tabType);
        this.toast(`已开始${this.analysisTaskTitle(tabType)}（演示）`);
      },
      toast(text) {
        if (typeof antd !== 'undefined' && antd.message && typeof antd.message.info === 'function') {
          antd.message.info(text);
          return;
        }
        console.info('[toast]', text);
      },
      nodeById(id) {
        return this.result.nodes.find((n) => n.id === id) || {};
      },
      nodeLabel(id) {
        return this.nodeById(id).label || id;
      },
      filterFieldOptions(rule) {
        return rule.target === 'edge' ? this.edgeFilterFieldOptions : this.nodeFilterFieldOptions;
      },
      updateFilterTarget(rule) {
        const options = this.filterFieldOptions(rule);
        if (!options.some((item) => item.value === rule.field)) {
          rule.field = options[0]?.value || 'type';
        }
      },
      nextFilterRuleId() {
        const id = this.filterRuleSeq;
        this.filterRuleSeq += 1;
        return id;
      },
      createEmptyFilterRule() {
        return { id: this.nextFilterRuleId(), target: 'node', field: 'type', operator: 'contains', value: '', source: 'advanced' };
      },
      buildListTableColumn(config) {
        const { title, dataIndex, key, target, field, sortState, sorter, width } = config;
        const col = {
          title,
          dataIndex,
          key,
          __filterTarget: target,
          __filterField: field,
          customFilterDropdown: true,
          filteredValue: this.getListColumnFilteredValue(target, field),
          sorter,
          sortOrder: sortState.field === key ? sortState.order : null,
        };
        if (width) col.width = width;
        return col;
      },
      getListColumnFilterRule(target, field) {
        return (this.globalFilterRules || []).find(
          (rule) => rule.source === 'list-column' && rule.target === target && rule.field === field,
        );
      },
      getListColumnFilteredValue(target, field) {
        const value = String(this.getListColumnFilterRule(target, field)?.value || '').trim();
        return value ? [value] : null;
      },
      upsertListColumnFilterRule(target, field, operator, value) {
        const trimmed = String(value || '').trim();
        const rules = [...(this.globalFilterRules || [])];
        const idx = rules.findIndex(
          (rule) => rule.source === 'list-column' && rule.target === target && rule.field === field,
        );
        if (!trimmed) {
          if (idx >= 0) rules.splice(idx, 1);
        } else {
          const next = {
            id: idx >= 0 ? rules[idx].id : this.nextFilterRuleId(),
            target,
            field,
            operator: operator || 'contains',
            value: trimmed,
            source: 'list-column',
          };
          if (idx >= 0) rules[idx] = next;
          else rules.push(next);
        }
        this.globalFilterRules = rules;
        this.advancedFilterStripOpen = this.activeGlobalFilterRules.length > 0;
      },
      onListColumnFilterVisibleChange(visible, column) {
        if (!visible || !column?.__filterTarget) return;
        const rule = this.getListColumnFilterRule(column.__filterTarget, column.__filterField);
        this.listColumnFilterDraft = {
          target: column.__filterTarget,
          field: column.__filterField,
          operator: rule?.operator || 'contains',
          value: rule?.value || '',
        };
      },
      applyListColumnFilter(confirm) {
        const { target, field, operator, value } = this.listColumnFilterDraft;
        this.upsertListColumnFilterRule(target, field, operator, value);
        confirm?.();
      },
      clearListColumnFilter(clearFilters) {
        const { target, field } = this.listColumnFilterDraft;
        this.upsertListColumnFilterRule(target, field, 'contains', '');
        this.listColumnFilterDraft = { target, field, operator: 'contains', value: '' };
        clearFilters?.({ confirm: true, closeDropdown: true });
      },
      isListColumnFilterActive() {
        return (this.globalFilterRules || []).some((rule) => rule.source === 'list-column' && String(rule.value || '').trim());
      },
      addGlobalFilterRule() {
        this.globalFilterRules = [...this.globalFilterRules, this.createEmptyFilterRule()];
      },
      addAdvancedFilterDraftRule() {
        this.advancedFilterDraftRules = [...this.advancedFilterDraftRules, this.createEmptyFilterRule()];
      },
      removeGlobalFilterRule(id) {
        this.globalFilterRules = this.globalFilterRules.filter((rule) => rule.id !== id);
      },
      removeAdvancedFilterDraftRule(id) {
        this.advancedFilterDraftRules = this.advancedFilterDraftRules.filter((rule) => rule.id !== id);
      },
      resetGlobalFilters() {
        this.globalFilterRules = [];
        this.advancedFilterStripOpen = false;
      },
      resetAdvancedFilterDraft() {
        this.advancedFilterDraftRules = [];
      },
      addStepFilterRule(stepId) {
        const step = this.querySteps.find((s) => s.id === stepId);
        if (!step) return;
        step.stepFilterRules = [...(step.stepFilterRules || []), this.createEmptyFilterRule()];
        this.querySteps = [...this.querySteps];
      },
      removeStepFilterRule(stepId, ruleId) {
        const step = this.querySteps.find((s) => s.id === stepId);
        if (!step) return;
        step.stepFilterRules = (step.stepFilterRules || []).filter((r) => r.id !== ruleId);
        this.querySteps = [...this.querySteps];
      },
      resetStepFilters(stepId) {
        const step = this.querySteps.find((s) => s.id === stepId);
        if (!step) return;
        step.stepFilterRules = [];
        this.querySteps = [...this.querySteps];
      },
      initQuerySession() {
        if (!this.result?.nodes?.length) {
          this.querySteps = [];
          this.globalFilterRules = [];
          this.advancedFilterStripOpen = false;
          this.focusedStepId = '';
          return;
        }
        const step = this.buildInitialQueryStep();
        this.querySteps = [step];
        this.globalFilterRules = [];
        this.advancedFilterStripOpen = false;
        this.filterRuleSeq = 1;
        this.focusedStepId = step.id;
        this.editingStepFilterId = '';
        this.pendingQueryTemplateRef = null;
        this.notifyQueryStepsChanged({ reason: 'init' });
      },
      defaultTemplateRefFromSession() {
        const item = this.activeHistoryItem;
        if (item) {
          return { source: 'history', id: item.id, name: item.mode, summary: item.name };
        }
        const mode = this.querySummary.split('/')[0]?.trim() || '实体信息查询';
        return { source: 'history', id: this.activeHistoryId || '', name: mode, summary: this.result.name || '' };
      },
      resolveTemplateMeta(ref) {
        const fallback = this.queryTemplateProfile;
        if (!ref) {
          return {
            templateLabel: fallback.template,
            querySummary: this.initialStepQuerySummary,
            templateRef: this.defaultTemplateRefFromSession(),
          };
        }
        if (ref.source === 'dataTemplate') {
          const tpl = this.dataTemplates.find((t) => t.id === ref.id);
          return {
            templateLabel: tpl?.name || ref.name || '图数据模板',
            querySummary: ref.paramsSummary || ref.summary || tpl?.desc || '图数据模板查询',
            templateRef: ref,
          };
        }
        if (ref.source === 'basic') {
          const tpl = this.basicTemplates.find((t) => t.id === ref.id);
          return {
            templateLabel: tpl?.name || ref.name || '通用查询',
            querySummary: ref.paramsSummary || ref.summary || tpl?.desc || '通用查询',
            templateRef: ref,
          };
        }
        if (ref.source === 'history') {
          const h = this.history.find((x) => x.id === ref.id);
          return {
            templateLabel: h?.mode || ref.name || fallback.template,
            querySummary: ref.summary || h?.name || this.initialStepQuerySummary,
            templateRef: ref,
          };
        }
        if (ref.source === 'savedStep') {
          return {
            templateLabel: ref.name || '已存步骤模板',
            querySummary: ref.summary || '复用已保存步骤配置',
            templateRef: ref,
          };
        }
        return {
          templateLabel: ref.name || fallback.template,
          querySummary: ref.summary || this.initialStepQuerySummary,
          templateRef: ref,
        };
      },
      getResultSliceForTemplateRef(ref, options) {
        const opts = options || {};
        const allNodeIds = (this.result.nodes || []).map((n) => n.id);
        const allEdgeIds = (this.result.edges || []).map((e) => e.id);
        const dataApi = window.DGP_DATA;
        if (!dataApi?.getResultForHistory) {
          return { nodeIds: allNodeIds, edgeIds: allEdgeIds };
        }
        let historyId = '';
        if (ref?.source === 'history' && ref.id) historyId = ref.id;
        else if (ref?.source === 'dataTemplate' && ref.id) historyId = DATA_TEMPLATE_HISTORY_MAP[ref.id] || '';
        else if (ref?.source === 'basic' && ref.id) historyId = BASIC_TEMPLATE_HISTORY_MAP[ref.id] || '';
        if (!historyId) return { nodeIds: allNodeIds, edgeIds: allEdgeIds };
        const graph = dataApi.getResultForHistory(historyId);
        if (!graph?.nodes?.length) return { nodeIds: allNodeIds, edgeIds: allEdgeIds };
        let nodeIds = graph.nodes.map((n) => n.id);
        let edgeIds = (graph.edges || []).map((e) => e.id);
        if (opts.intersectWithCurrent) {
          const resultNodeSet = new Set(allNodeIds);
          nodeIds = nodeIds.filter((id) => resultNodeSet.has(id));
          const nodeSet = new Set(nodeIds);
          edgeIds = (this.result.edges || [])
            .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
            .map((e) => e.id);
          if (!nodeIds.length) {
            return { nodeIds: allNodeIds, edgeIds: allEdgeIds, usedCurrentGraph: true };
          }
        }
        return { nodeIds, edgeIds };
      },
      buildInitialQueryStep() {
        const ref = this.pendingQueryTemplateRef || this.defaultTemplateRefFromSession();
        const meta = this.resolveTemplateMeta(ref);
        const slice = this.getResultSliceForTemplateRef(meta.templateRef);
        return {
          id: `step-${Date.now()}`,
          kind: 'initial',
          label: '步骤 1',
          includedInView: true,
          templateLabel: meta.templateLabel,
          querySummary: meta.querySummary,
          templateRef: meta.templateRef,
          anchorNodeId: '',
          anchorNodeId2: '',
          nodeIds: slice.nodeIds,
          edgeIds: slice.edgeIds,
          stepFilterRules: ref?.stepFilterRules ? JSON.parse(JSON.stringify(ref.stepFilterRules)) : [],
          status: slice.nodeIds.length ? 'ok' : 'empty',
        };
      },
      createQueryStepFromConfig(config) {
        const stepNum = config.labelIndex || this.querySteps.length + 1;
        const ref = config.templateRef || { source: 'template', id: '', name: config.templateLabel };
        const meta = this.resolveTemplateMeta(ref);
        let nodeIds = config.nodeIds;
        let edgeIds = config.edgeIds;
        if (!nodeIds || !edgeIds) {
          const slice = this.getResultSliceForTemplateRef(meta.templateRef, { intersectWithCurrent: config.intersectWithCurrent });
          nodeIds = slice.nodeIds;
          edgeIds = slice.edgeIds;
        }
        return {
          id: `step-${Date.now()}-${stepNum}`,
          kind: config.kind || 'template',
          label: `步骤 ${stepNum}`,
          includedInView: true,
          templateLabel: config.templateLabel || meta.templateLabel,
          querySummary: config.querySummary || meta.querySummary,
          templateRef: meta.templateRef,
          anchorNodeId: config.anchorNodeId || '',
          anchorNodeId2: config.anchorNodeId2 || '',
          nodeIds,
          edgeIds,
          stepFilterRules: config.stepFilterRules ? JSON.parse(JSON.stringify(config.stepFilterRules)) : [],
          status: nodeIds.length ? 'ok' : 'empty',
        };
      },
      positionLayoutPicker(event) {
        const el = event?.currentTarget || this.$refs.layoutPickerAnchor;
        const width = Math.min(420, window.innerWidth - 24);
        const gap = 4;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
          this.layoutPickerStyle = {
            position: 'fixed',
            top: '100px',
            left: '24px',
            width: `${width}px`,
            maxHeight: 'min(500px, calc(100vh - 112px))',
            zIndex: 'var(--ds-z-popover-local)',
          };
          return;
        }
        const rect = el.getBoundingClientRect();
        let top = rect.bottom + gap;
        let left = rect.left;
        const maxHeight = Math.min(500, window.innerHeight - top - 12);
        if (left + width > window.innerWidth - 12) {
          left = Math.max(12, window.innerWidth - width - 12);
        }
        this.layoutPickerStyle = {
          position: 'fixed',
          top: `${Math.round(top)}px`,
          left: `${Math.round(left)}px`,
          width: `${width}px`,
          maxHeight: `${Math.round(maxHeight)}px`,
          zIndex: 'var(--ds-z-popover-local)',
        };
      },
      syncLayoutPickerPosition() {
        if (!this.layoutPickerOpen) return;
        this.positionLayoutPicker({ currentTarget: this.$refs.layoutPickerAnchor });
      },
      positionListLayoutPicker(event) {
        const el = event?.currentTarget || this.$refs.listLayoutPickerAnchor;
        const width = Math.min(300, window.innerWidth - 24);
        const gap = 4;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
          this.listLayoutPickerStyle = {
            position: 'fixed',
            top: '100px',
            left: '24px',
            width: `${width}px`,
            maxHeight: 'min(280px, calc(100vh - 112px))',
            zIndex: 'var(--ds-z-popover-local)',
          };
          return;
        }
        const rect = el.getBoundingClientRect();
        let top = rect.bottom + gap;
        let left = rect.left;
        const maxHeight = Math.min(280, window.innerHeight - top - 12);
        if (left + width > window.innerWidth - 12) {
          left = Math.max(12, window.innerWidth - width - 12);
        }
        this.listLayoutPickerStyle = {
          position: 'fixed',
          top: `${Math.round(top)}px`,
          left: `${Math.round(left)}px`,
          width: `${width}px`,
          maxHeight: `${Math.round(maxHeight)}px`,
          zIndex: 'var(--ds-z-popover-local)',
        };
      },
      syncListLayoutPickerPosition() {
        if (!this.listLayoutPickerOpen) return;
        this.positionListLayoutPicker({ currentTarget: this.$refs.listLayoutPickerAnchor });
      },
      positionScopeFlyout(event) {
        const el = event?.currentTarget;
        const width = 320;
        const gap = 6;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
          this.scopeFlyoutStyle = {
            position: 'fixed',
            top: '120px',
            left: '340px',
            width: `${width}px`,
            maxHeight: '420px',
            zIndex: 'var(--ds-z-popover-local)',
          };
          return;
        }
        const rect = el.getBoundingClientRect();
        let top = rect.top;
        const left = rect.right + gap;
        const maxHeight = Math.min(480, window.innerHeight - 16);
        if (top + maxHeight > window.innerHeight - 8) {
          top = Math.max(8, window.innerHeight - maxHeight - 8);
        }
        this.scopeFlyoutStyle = {
          position: 'fixed',
          top: `${Math.round(top)}px`,
          left: `${Math.round(left)}px`,
          width: `${width}px`,
          maxHeight: `${Math.round(maxHeight)}px`,
          zIndex: 'var(--ds-z-popover-local)',
        };
      },
      openTemplatePicker(mode, stepId, event) {
        const sid = stepId || '';
        if (this.templatePickerOpen && this.templatePickerMode === mode && this.templatePickerStepId === sid) {
          this.closeTemplatePicker();
          return;
        }
        this.closeFilterDrawer();
        this.templatePickerMode = mode;
        this.templatePickerStepId = sid;
        this.positionScopeFlyout(event);
        this.templatePickerOpen = true;
        this.addStepMenuOpen = false;
        if (mode === 'initial' || mode === 'add') {
          this.queryTemplateTab = 'template';
        }
      },
      closeTemplatePicker() {
        this.templatePickerOpen = false;
        this.templatePickerMode = '';
        this.templatePickerStepId = '';
        if (!this.filterDrawerOpen) this.scopeFlyoutStyle = null;
      },
      openFilterDrawer(target, event) {
        if (this.filterDrawerOpen && this.filterDrawerTarget === target) {
          this.closeFilterDrawer();
          return;
        }
        this.closeTemplatePicker();
        this.filterDrawerTarget = target;
        this.positionScopeFlyout(event);
        this.filterDrawerOpen = true;
        this.editingStepFilterId = '';
      },
      closeFilterDrawer() {
        this.filterDrawerOpen = false;
        this.filterDrawerTarget = '';
        if (!this.templatePickerOpen) this.scopeFlyoutStyle = null;
      },
      closeAllPopovers() {
        this.closeTemplatePicker();
        this.closeFilterDrawer();
        this.closeCanvasContextMenu();
        this.layoutPickerOpen = false;
        this.layoutPickerStyle = null;
        this.listLayoutPickerOpen = false;
        this.listLayoutPickerStyle = null;
      },
      formatFilterRuleLabel(rule) {
        const target = rule.target === 'edge' ? '关系' : '实体';
        const op = (this.filterOperatorOptions.find((item) => item.value === rule.operator) || {}).label || rule.operator;
        const field = (this.filterFieldOptions(rule).find((item) => item.value === rule.field) || {}).label || rule.field;
        const value = String(rule.value || '').trim() || '…';
        return `${target} · ${field} ${op}「${value}」`;
      },
      openAdvancedFilterModal() {
        this.closeAllPopovers();
        this.advancedFilterDraftRules = JSON.parse(JSON.stringify(this.globalFilterRules));
        if (!this.advancedFilterDraftRules.length) {
          this.advancedFilterDraftRules = [this.createEmptyFilterRule()];
        }
        this.advancedFilterModalOpen = true;
      },
      confirmAdvancedFilter() {
        this.globalFilterRules = JSON.parse(JSON.stringify(this.advancedFilterDraftRules));
        this.advancedFilterModalOpen = false;
        this.advancedFilterStripOpen = this.activeGlobalFilterRules.length > 0;
      },
      cancelAdvancedFilterModal() {
        this.advancedFilterModalOpen = false;
        this.advancedFilterDraftRules = [];
      },
      closeAdvancedFilterStrip() {
        this.advancedFilterStripOpen = false;
      },
      focusDisplayFilter(kind) {
        if (kind !== 'advanced') return;
        if (this.showAdvancedFilterStrip) {
          this.$el?.querySelector('.graph-canvas-advanced-filter-strip')?.scrollIntoView?.({ block: 'nearest' });
          return;
        }
        this.openAdvancedFilterModal();
      },
      onWorkbenchKeydown(event) {
        const key = String(event.key || '').toLowerCase();
        if (key === 'escape') {
          if (this.canvasContextMenu.open) {
            this.closeCanvasContextMenu();
            return;
          }
          if (this.advancedFilterModalOpen) {
            this.cancelAdvancedFilterModal();
            return;
          }
          if (this.layoutPickerOpen) {
            this.layoutPickerOpen = false;
            return;
          }
          if (this.listLayoutPickerOpen) {
            this.listLayoutPickerOpen = false;
          }
        }
      },
      onNodeTableChange(_pagination, _filters, sorter) {
        const next = Array.isArray(sorter) ? sorter[0] : sorter;
        if (!next || !next.order) {
          this.listNodeSort = { field: '', order: '' };
          return;
        }
        this.listNodeSort = { field: next.columnKey || next.field, order: next.order };
      },
      onEdgeTableChange(_pagination, _filters, sorter) {
        const next = Array.isArray(sorter) ? sorter[0] : sorter;
        if (!next || !next.order) {
          this.listEdgeSort = { field: '', order: '' };
          return;
        }
        this.listEdgeSort = { field: next.columnKey || next.field, order: next.order };
      },
      sortListByColumn(items, kind) {
        const state = kind === 'node' ? this.listNodeSort : this.listEdgeSort;
        if (!state.field || !state.order) return items;
        const sorted = [...items];
        const dir = state.order === 'ascend' ? 1 : -1;
        if (kind === 'node') {
          return sorted.sort((a, b) => {
            if (state.field === 'label') return dir * String(a.label || a.id).localeCompare(String(b.label || b.id), 'zh-CN');
            if (state.field === 'type') return dir * String(a.type || '').localeCompare(String(b.type || ''), 'zh-CN');
            return dir * String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN');
          });
        }
        return sorted.sort((a, b) => {
          if (state.field === 'type') return dir * String(a.type || '').localeCompare(String(b.type || ''), 'zh-CN');
          if (state.field === 'from') return dir * String(this.nodeLabel(a.from)).localeCompare(String(this.nodeLabel(b.from)), 'zh-CN');
          if (state.field === 'to') return dir * String(this.nodeLabel(a.to)).localeCompare(String(this.nodeLabel(b.to)), 'zh-CN');
          if (state.field === 'amount') return dir * (Number(a.amountValue || 0) - Number(b.amountValue || 0));
          return 0;
        });
      },
      openStepFilterDrawer(stepId, event) {
        this.openFilterDrawer(stepId, event);
      },
      onScopeQueryTemplateClick(item) {
        const mode = this.templatePickerMode;
        const stepId = this.templatePickerStepId;
        this.closeTemplatePicker();
        if (item.action === 'template') {
          if (mode === 'initial') {
            this.pendingQueryTemplateRef = { source: 'dataTemplate', id: item.templateId, name: item.title, summary: item.desc };
            this.$emit('open-template-query', { graph: this.graph, templateId: item.templateId });
            return;
          }
          if (mode === 'edit' && stepId) {
            const idx = this.querySteps.findIndex((s) => s.id === stepId);
            this.pendingQueryTemplateRef = {
              source: 'dataTemplate',
              id: item.templateId,
              name: item.title,
              replaceStepIndex: idx >= 0 ? idx : undefined,
            };
            this.$emit('open-template-query', { graph: this.graph, templateId: item.templateId });
            return;
          }
          this.applyTemplateChoice({ source: 'dataTemplate', id: item.templateId, name: item.title, summary: item.desc });
          return;
        }
        const ref = { source: 'basic', id: item.mode, name: item.title, summary: item.desc };
        if (mode === 'initial') {
          this.pendingQueryTemplateRef = ref;
          this.$emit('open-quick-query-modal', { graph: this.graph, mode: item.mode });
          return;
        }
        if (mode === 'edit' && stepId) {
          const idx = this.querySteps.findIndex((s) => s.id === stepId);
          this.pendingQueryTemplateRef = { ...ref, replaceStepIndex: idx >= 0 ? idx : undefined };
          this.$emit('open-quick-query-modal', { graph: this.graph, mode: item.mode });
          return;
        }
        this.applyTemplateChoice(ref);
      },
      applyTemplateChoice(payload) {
        const { source, id, name, summary } = payload;
        const ref = { source, id, name, summary };
        if (this.templatePickerMode === 'initial') {
          this.applyTemplateAsInitial(ref);
          this.closeTemplatePicker();
          return;
        }
        if (this.templatePickerMode === 'edit' && this.templatePickerStepId) {
          this.applyTemplateToExistingStep(this.templatePickerStepId, ref);
          this.closeTemplatePicker();
          return;
        }
        if (this.templatePickerMode === 'add') {
          this.appendQueryStepFromTemplate(ref);
          this.closeTemplatePicker();
        }
      },
      applyTemplateAsInitial(ref) {
        if (ref.source === 'dataTemplate') {
          this.pendingQueryTemplateRef = ref;
          this.$emit('open-template-query', { graph: this.graph, templateId: ref.id });
          return;
        }
        if (ref.source === 'basic') {
          this.pendingQueryTemplateRef = ref;
          this.$emit('open-quick-query-modal', { graph: this.graph, mode: ref.id });
          return;
        }
        if (ref.source === 'history') {
          const h = this.history.find((x) => x.id === ref.id);
          if (!h) {
            this.toast('未找到对应历史查询');
            return;
          }
          this.pendingQueryTemplateRef = {
            source: 'history',
            id: h.id,
            name: h.mode,
            summary: h.name,
          };
          this.$emit('select-history', h);
          return;
        }
        if (ref.source === 'savedStep') {
          const saved = this.savedStepTemplates.find((t) => t.id === ref.id);
          if (!saved) return;
          this.pendingQueryTemplateRef = {
            source: 'savedStep',
            id: saved.id,
            name: saved.name,
            summary: saved.snapshot?.querySummary,
            stepFilterRules: saved.snapshot?.stepFilterRules,
          };
          const snapRef = saved.snapshot?.templateRef;
          if (snapRef?.source === 'dataTemplate') {
            this.$emit('open-template-query', { graph: this.graph, templateId: snapRef.id });
            return;
          }
          if (snapRef?.source === 'basic') {
            this.$emit('open-quick-query-modal', { graph: this.graph, mode: snapRef.id });
            return;
          }
          if (snapRef?.source === 'history' && snapRef.id) {
            const h = this.history.find((x) => x.id === snapRef.id);
            if (h) {
              this.$emit('select-history', h);
              return;
            }
          }
          this.initQuerySession();
          this.toast('已按已存步骤模板更新起点查询');
        }
      },
      applyTemplateToExistingStep(stepId, ref) {
        const index = this.querySteps.findIndex((s) => s.id === stepId);
        if (index < 0) return;
        const run = () => {
          const meta = this.resolveTemplateMeta(ref);
          const slice = this.getResultSliceForTemplateRef(meta.templateRef);
          const step = this.querySteps[index];
          if (step.kind === 'expand' || step.kind === 'path') {
            this.toast('拓展/路径步骤请使用「重新执行」或删除后改用模板查询添加新步骤');
            return;
          }
          step.templateLabel = meta.templateLabel;
          step.querySummary = meta.querySummary;
          step.templateRef = meta.templateRef;
          step.nodeIds = slice.nodeIds;
          step.edgeIds = slice.edgeIds;
          step.status = slice.nodeIds.length ? 'ok' : 'empty';
          this.querySteps = [...this.querySteps];
          this.toast('已更新本步查询模板');
        };
        if (ref.source === 'dataTemplate') {
          this.pendingQueryTemplateRef = { ...ref, replaceStepIndex: index };
          this.$emit('open-template-query', { graph: this.graph, templateId: ref.id });
          return;
        }
        if (ref.source === 'basic') {
          this.pendingQueryTemplateRef = { ...ref, replaceStepIndex: index };
          this.$emit('open-quick-query-modal', { graph: this.graph, mode: ref.id });
          return;
        }
        if (ref.source === 'history') {
          const h = this.history.find((x) => x.id === ref.id);
          if (!h) return;
          this.pendingQueryTemplateRef = { source: 'history', id: h.id, name: h.mode, summary: h.name, replaceStepIndex: index };
          this.$emit('select-history', h);
          return;
        }
        this.confirmClearStepsAfter(index, '更换查询模板将清除后续所有查询步骤。', run);
      },
      appendQueryStepFromTemplate(ref) {
        if (ref.source === 'savedStep') {
          const saved = this.savedStepTemplates.find((t) => t.id === ref.id);
          if (!saved) return;
          const snap = saved.snapshot;
          if (snap?.kind === 'expand') {
            this.addExpandQueryStep();
            const step = this.querySteps[this.querySteps.length - 1];
            if (step) {
              step.templateLabel = saved.name;
              step.stepFilterRules = JSON.parse(JSON.stringify(snap.stepFilterRules || []));
              this.querySteps = [...this.querySteps];
            }
            return;
          }
          const step = this.createQueryStepFromConfig({
            kind: snap?.kind || 'template',
            templateRef: snap?.templateRef || ref,
            templateLabel: snap?.templateLabel || saved.name,
            querySummary: snap?.querySummary,
            stepFilterRules: snap?.stepFilterRules,
            labelIndex: this.querySteps.length + 1,
          });
          this.querySteps = [...this.querySteps, step];
          this.focusedStepId = step.id;
          this.toast('已插入已存步骤模板');
          this.notifyQueryStepsChanged({ reason: 'step-added', step });
          return;
        }
        const meta = this.resolveTemplateMeta(ref);
        const slice = this.getResultSliceForTemplateRef(meta.templateRef, { intersectWithCurrent: true });
        const step = this.createQueryStepFromConfig({
          kind: 'template',
          templateRef: meta.templateRef,
          templateLabel: meta.templateLabel,
          querySummary: meta.querySummary,
          labelIndex: this.querySteps.length + 1,
          nodeIds: slice.nodeIds,
          edgeIds: slice.edgeIds,
          intersectWithCurrent: true,
        });
        this.querySteps = [...this.querySteps, step];
        this.focusedStepId = step.id;
        const hint = slice.usedCurrentGraph ? '（与当前图无节点重叠，已使用当前图范围）' : '';
        this.toast(`已添加查询步骤：${meta.templateLabel}${hint}`);
        this.notifyQueryStepsChanged({ reason: 'step-added', step });
      },
      pickDataTemplate(templateId) {
        const tpl = this.dataTemplates.find((t) => t.id === templateId);
        this.applyTemplateChoice({
          source: 'dataTemplate',
          id: templateId,
          name: tpl?.name,
          summary: tpl?.desc,
        });
      },
      pickBasicTemplate(templateId) {
        const tpl = this.basicTemplates.find((t) => t.id === templateId);
        this.applyTemplateChoice({
          source: 'basic',
          id: templateId,
          name: tpl?.name,
          summary: tpl?.desc,
        });
      },
      pickHistoryTemplate(historyId) {
        const h = this.history.find((x) => x.id === historyId);
        if (!h) return;
        this.applyTemplateChoice({
          source: 'history',
          id: historyId,
          name: h.mode,
          summary: h.name,
        });
      },
      pickSavedStepTemplate(templateId) {
        const saved = this.savedStepTemplates.find((t) => t.id === templateId);
        if (!saved) return;
        this.applyTemplateChoice({
          source: 'savedStep',
          id: templateId,
          name: saved.name,
          summary: saved.snapshot?.querySummary,
        });
      },
      getStepNodes(step) {
        const idSet = new Set(step?.nodeIds || []);
        return (this.result.nodes || []).filter((n) => idSet.has(n.id));
      },
      getStepEdges(step) {
        const idSet = new Set(step?.edgeIds || []);
        return (this.result.edges || []).filter((e) => idSet.has(e.id));
      },
      getStepFilteredNodes(step) {
        const nodes = this.getStepNodes(step);
        return nodes.filter((n) => this.matchesFilterRules(n, 'node', step?.stepFilterRules || []));
      },
      getStepFilteredEdges(step) {
        const nodeIds = new Set(this.getStepFilteredNodes(step).map((n) => n.id));
        return this.getStepEdges(step).filter((e) => {
          if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) return false;
          return this.matchesFilterRules(e, 'edge', step?.stepFilterRules || []);
        });
      },
      stepStats(step) {
        const nodes = this.getStepFilteredNodes(step);
        const nodeIds = new Set(nodes.map((n) => n.id));
        const edges = this.getStepFilteredEdges(step).filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
        return { nodeCount: nodes.length, edgeCount: edges.length };
      },
      stepKindLabel(kind) {
        if (kind === 'initial') return '初始';
        if (kind === 'expand') return '拓展';
        if (kind === 'path') return '路径';
        if (kind === 'template') return '模板';
        return '查询';
      },
      applyPendingTemplateToStepIndex() {
        const ref = this.pendingQueryTemplateRef;
        const idx = ref?.replaceStepIndex;
        if (idx === undefined || idx === null || idx < 0) return false;
        const meta = this.resolveTemplateMeta(ref);
        const slice = this.getResultSliceForTemplateRef(meta.templateRef);
        const step = this.querySteps[idx];
        if (!step) {
          this.pendingQueryTemplateRef = null;
          return false;
        }
        step.templateLabel = meta.templateLabel;
        step.querySummary = meta.querySummary;
        step.templateRef = meta.templateRef;
        step.nodeIds = slice.nodeIds;
        step.edgeIds = slice.edgeIds;
        step.status = slice.nodeIds.length ? 'ok' : 'empty';
        if (ref.stepFilterRules) {
          step.stepFilterRules = JSON.parse(JSON.stringify(ref.stepFilterRules));
        }
        this.truncateStepsAfter(idx);
        this.querySteps = [...this.querySteps];
        this.pendingQueryTemplateRef = null;
        this.toast('已更新本步查询并同步图谱结果');
        return true;
      },
      stepFilterSummary(step) {
        const rules = (step?.stepFilterRules || []).filter((r) => String(r.value || '').trim());
        if (!rules.length) return '';
        return rules.map((r) => {
          const target = r.target === 'edge' ? '关系' : '实体';
          const op = { contains: '包含', equals: '=', notEquals: '≠', gte: '≥', lte: '≤' }[r.operator] || r.operator;
          return `${target}.${r.field} ${op} ${r.value}`;
        }).join('；');
      },
      toggleStepIncluded(step) {
        const included = this.querySteps.filter((s) => s.includedInView);
        if (included.length <= 1 && step.includedInView) {
          this.toast('至少保留一个显示步骤');
          return;
        }
        step.includedInView = !step.includedInView;
        this.querySteps = [...this.querySteps];
      },
      focusQueryStep(step) {
        this.focusedStepId = step.id;
      },
      addFilterDrawerRule() {
        if (this.filterDrawerTarget === 'global') {
          this.addGlobalFilterRule();
          return;
        }
        this.addStepFilterRule(this.filterDrawerTarget);
      },
      removeFilterDrawerRule(ruleId) {
        if (this.filterDrawerTarget === 'global') {
          this.removeGlobalFilterRule(ruleId);
          return;
        }
        this.removeStepFilterRule(this.filterDrawerTarget, ruleId);
      },
      resetFilterDrawerRules() {
        if (this.filterDrawerTarget === 'global') {
          this.resetGlobalFilters();
          return;
        }
        this.resetStepFilters(this.filterDrawerTarget);
      },
      confirmClearStepsAfter(index, message, onOk) {
        const run = () => {
          this.truncateStepsAfter(index);
          onOk?.();
        };
        if (index >= this.querySteps.length - 1) {
          onOk?.();
          return;
        }
        if (typeof antd !== 'undefined' && antd.Modal?.confirm) {
          antd.Modal.confirm({
            title: '后续步骤将被清除',
            content: message || '修改或重跑本步后，后续查询步骤将删除（锚点或依赖可能失效）。',
            okText: '继续',
            cancelText: '取消',
            onOk: run,
          });
          return;
        }
        if (window.confirm(message || '将清除后续步骤，是否继续？')) run();
      },
      truncateStepsAfter(index) {
        this.querySteps = this.querySteps.slice(0, index + 1);
        if (!this.querySteps.some((s) => s.id === this.focusedStepId)) {
          this.focusedStepId = this.querySteps[this.querySteps.length - 1]?.id || '';
        }
      },
      deleteQueryStep(step) {
        const index = this.querySteps.findIndex((s) => s.id === step.id);
        if (index < 0) return;
        if (index === 0) {
          this.toast('初始步骤不可删除');
          return;
        }
        const run = () => {
          this.querySteps = this.querySteps.slice(0, index);
          if (!this.querySteps.some((s) => s.id === this.focusedStepId)) {
            this.focusedStepId = this.querySteps[this.querySteps.length - 1]?.id || '';
          }
          this.toast('已删除该步骤及后续步骤');
        };
        if (index < this.querySteps.length - 1) {
          if (typeof antd !== 'undefined' && antd.Modal?.confirm) {
            antd.Modal.confirm({
              title: '删除查询步骤',
              content: '删除本步将同时删除之后所有查询步骤。',
              okText: '删除',
              cancelText: '取消',
              onOk: run,
            });
          } else if (window.confirm('删除本步将同时删除之后所有查询步骤。是否继续？')) {
            run();
          }
        } else {
          run();
        }
      },
      rerunQueryStep(step) {
        const index = this.querySteps.findIndex((s) => s.id === step.id);
        if (index < 0) return;
        const run = () => {
          if (step.kind === 'expand' && step.anchorNodeId) {
            const subset = this.computeExpandSubset(step.anchorNodeId, 2);
            step.nodeIds = subset.nodeIds;
            step.edgeIds = subset.edgeIds;
            step.status = subset.nodeIds.length ? 'ok' : 'empty';
          } else if (step.kind === 'path') {
            const subset = this.computePathSubset(step.anchorNodeId, step.anchorNodeId2);
            step.nodeIds = subset.nodeIds;
            step.edgeIds = subset.edgeIds;
            step.status = subset.nodeIds.length ? 'ok' : 'empty';
          } else if (step.kind === 'initial' || step.kind === 'template') {
            const slice = this.getResultSliceForTemplateRef(step.templateRef);
            step.nodeIds = slice.nodeIds;
            step.edgeIds = slice.edgeIds;
            step.status = slice.nodeIds.length ? 'ok' : 'empty';
          } else {
            step.nodeIds = (this.result.nodes || []).map((n) => n.id);
            step.edgeIds = (this.result.edges || []).map((e) => e.id);
            step.status = 'ok';
          }
          this.querySteps = [...this.querySteps];
          this.toast('已重新执行本步查询');
        };
        this.confirmClearStepsAfter(index, '重新执行将清除后续所有查询步骤。', run);
      },
      editStepQuery(step, event) {
        this.openTemplatePicker('edit', step.id, event);
      },
      saveStepAsTemplate(step) {
        const item = {
          id: `stpl-${Date.now()}`,
          name: `${step.templateLabel}`.slice(0, 24),
          savedAt: new Date().toISOString().slice(0, 10),
          snapshot: {
            kind: step.kind,
            templateRef: step.templateRef ? JSON.parse(JSON.stringify(step.templateRef)) : null,
            templateLabel: step.templateLabel,
            querySummary: step.querySummary,
            stepFilterRules: JSON.parse(JSON.stringify(step.stepFilterRules || [])),
            anchorNodeId: step.anchorNodeId,
            anchorNodeId2: step.anchorNodeId2,
          },
        };
        this.savedStepTemplates = [item, ...this.savedStepTemplates].slice(0, 12);
        this.toast(`已保存步骤模板「${item.name}」`);
      },
      buildAdjacency() {
        const adj = new Map();
        const add = (a, b) => {
          if (!adj.has(a)) adj.set(a, new Set());
          adj.get(a).add(b);
        };
        (this.result.edges || []).forEach((e) => {
          add(e.from, e.to);
          add(e.to, e.from);
        });
        return adj;
      },
      computeExpandSubset(anchorNodeId, maxHops) {
        if (!anchorNodeId) return { nodeIds: [], edgeIds: [] };
        const adj = this.buildAdjacency();
        const visited = new Set([anchorNodeId]);
        let frontier = [anchorNodeId];
        for (let hop = 0; hop < maxHops; hop += 1) {
          const next = [];
          frontier.forEach((id) => {
            (adj.get(id) || []).forEach((nid) => {
              if (!visited.has(nid)) {
                visited.add(nid);
                next.push(nid);
              }
            });
          });
          frontier = next;
        }
        const nodeIds = Array.from(visited);
        const nodeSet = new Set(nodeIds);
        const edgeIds = (this.result.edges || [])
          .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
          .map((e) => e.id);
        return { nodeIds, edgeIds };
      },
      computePathSubset(nodeIdA, nodeIdB) {
        const pathIds = this.result.pathNodeIds;
        if (Array.isArray(pathIds) && pathIds.length) {
          const nodeSet = new Set(pathIds);
          const edgeIds = (this.result.edges || [])
            .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
            .map((e) => e.id);
          return { nodeIds: [...pathIds], edgeIds };
        }
        const ids = [nodeIdA, nodeIdB].filter(Boolean);
        const unique = [...new Set(ids)];
        const nodeSet = new Set(unique);
        const edgeIds = (this.result.edges || [])
          .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
          .map((e) => e.id);
        return { nodeIds: unique, edgeIds };
      },
      addExpandQueryStep() {
        if (this.selectedType !== 'node' || !this.selectedId) {
          this.toast('请先在画布选中一个实体作为拓展锚点');
          return;
        }
        const anchorNodeId = this.selectedId;
        const subset = this.computeExpandSubset(anchorNodeId, 2);
        const label = this.nodeLabel(anchorNodeId);
        const stepNum = this.querySteps.length + 1;
        const step = {
          id: `step-${Date.now()}`,
          kind: 'expand',
          label: `步骤 ${stepNum}`,
          includedInView: true,
          templateLabel: '关系拓展',
          templateRef: { source: 'expand', id: 'expand-2hop', name: '关系拓展' },
          querySummary: `从「${label}」· 2 跳`,
          anchorNodeId,
          anchorNodeId2: '',
          nodeIds: subset.nodeIds,
          edgeIds: subset.edgeIds,
          stepFilterRules: [],
          status: subset.nodeIds.length ? 'ok' : 'empty',
        };
        this.querySteps = [...this.querySteps, step];
        this.focusedStepId = step.id;
        this.addStepMenuOpen = false;
        this.toast('已添加拓展查询步骤');
        this.notifyQueryStepsChanged({ reason: 'step-added', step });
      },
      addPathQueryStep() {
        let nodeA = this.selectedType === 'node' ? this.selectedId : '';
        let nodeB = '';
        const enterprises = (this.result.nodes || []).filter((n) => n.type === '企业');
        if (!nodeA && enterprises.length >= 2) {
          nodeA = enterprises[0].id;
          nodeB = enterprises[1].id;
        } else if (nodeA && enterprises.length >= 2) {
          nodeB = enterprises.find((n) => n.id !== nodeA)?.id || '';
        }
        if (!nodeA || !nodeB) {
          this.toast('请选中实体，或确保图中有至少两个企业节点');
          return;
        }
        const subset = this.computePathSubset(nodeA, nodeB);
        const stepNum = this.querySteps.length + 1;
        const connected = subset.edgeIds.length > 0;
        const step = {
          id: `step-${Date.now()}`,
          kind: 'path',
          label: `步骤 ${stepNum}`,
          includedInView: true,
          templateLabel: '路径分析',
          templateRef: { source: 'path', id: 'path-analysis', name: '路径分析' },
          querySummary: `${this.nodeLabel(nodeA)} ↔ ${this.nodeLabel(nodeB)} · ${connected ? '连通' : '不连通'}`,
          anchorNodeId: nodeA,
          anchorNodeId2: nodeB,
          nodeIds: subset.nodeIds,
          edgeIds: subset.edgeIds,
          stepFilterRules: [],
          status: 'ok',
        };
        this.querySteps = [...this.querySteps, step];
        this.focusedStepId = step.id;
        this.addStepMenuOpen = false;
        this.toast('已添加路径分析步骤');
        this.notifyQueryStepsChanged({ reason: 'step-added', step });
      },
      getCanvasFilterValue(item, target, field) {
        if (!item) return '';
        if (target === 'edge') {
          if (field === 'from') return this.nodeLabel(item.from);
          if (field === 'to') return this.nodeLabel(item.to);
          if (field === 'amountValue') return item.amountValue ?? item.amount ?? '';
        }
        if (field in item) return item[field];
        return item.props?.[field] ?? '';
      },
      compareCanvasFilterValue(actual, operator, expected) {
        const raw = String(actual ?? '').trim();
        const value = String(expected ?? '').trim();
        if (!value) return true;
        if (operator === 'gte' || operator === 'lte') {
          const a = Number.parseFloat(raw.replace(/[^\d.-]/g, ''));
          const b = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
          if (Number.isNaN(a) || Number.isNaN(b)) return false;
          return operator === 'gte' ? a >= b : a <= b;
        }
        const left = raw.toLowerCase();
        const right = value.toLowerCase();
        if (operator === 'equals') return left === right;
        if (operator === 'notEquals') return left !== right;
        return left.includes(right);
      },
      matchesFilterRules(item, target, rules) {
        return (rules || [])
          .filter((rule) => rule.target === target && String(rule.value || '').trim())
          .every((rule) => this.compareCanvasFilterValue(
            this.getCanvasFilterValue(item, target, rule.field),
            rule.operator,
            rule.value,
          ));
      },
      matchesAppliedAdvancedRules(item, target) {
        const rules = this.activeGlobalFilterRules.filter((rule) => rule.target === target);
        if (!rules.length) return true;
        return this.matchesFilterRules(item, target, rules);
      },
      matchesCanvasFilters(item, target) {
        return this.matchesFilterRules(item, target, this.globalFilterRules);
      },
      cssColorToHex(value, fallback) {
        const raw = String(value || '').trim();
        if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
        if (/^#[0-9a-f]{3}$/i.test(raw)) {
          return '#' + raw.slice(1).split('').map((ch) => ch + ch).join('');
        }
        const match = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (match) {
          return '#' + [match[1], match[2], match[3]]
            .map((n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0'))
            .join('');
        }
        return fallback;
      },
      defaultNodeColor(type) {
        const color = window.DGP_GRAPH_VISUAL?.getNodeColor(type);
        return this.cssColorToHex(color, '#2f6fbb');
      },
      defaultEdgeColor(type) {
        const color = window.DGP_GRAPH_VISUAL?.getEdgeColor(type);
        return this.cssColorToHex(color, '#cf3b27');
      },
      ensureStyleDefaults() {
        const nextNodeColors = { ...this.nodeColorMap };
        const nextEdgeColors = { ...this.edgeColorMap };
        const nextNodeLabels = { ...this.nodeLabelFields };
        const nextEdgeLabels = { ...this.edgeLabelFields };
        this.result.nodes.forEach((node) => {
          const type = node.type || '未分类实体';
          if (!nextNodeColors[type]) nextNodeColors[type] = this.defaultNodeColor(type);
          if (!nextNodeLabels[type]) nextNodeLabels[type] = 'label';
        });
        this.result.edges.forEach((edge) => {
          const type = edge.type || '未分类关系';
          if (!nextEdgeColors[type]) nextEdgeColors[type] = this.defaultEdgeColor(type);
          if (!nextEdgeLabels[type]) nextEdgeLabels[type] = 'type';
        });
        this.nodeColorMap = nextNodeColors;
        this.edgeColorMap = nextEdgeColors;
        this.nodeLabelFields = nextNodeLabels;
        this.edgeLabelFields = nextEdgeLabels;
      },
      nodeLabelOptions(type) {
        const keys = new Set();
        this.result.nodes
          .filter((node) => (node.type || '未分类实体') === type)
          .forEach((node) => Object.keys(node.props || {}).forEach((key) => keys.add(key)));
        return [
          { label: '名称', value: 'label' },
          { label: 'ID', value: 'id' },
          { label: '类型', value: 'type' },
          ...Array.from(keys).map((key) => ({ label: key, value: key })),
        ];
      },
      edgeLabelOptions(type) {
        const keys = new Set();
        this.result.edges
          .filter((edge) => (edge.type || '未分类关系') === type)
          .forEach((edge) => Object.keys(edge.props || {}).forEach((key) => keys.add(key)));
        return [
          { label: '类型', value: 'type' },
          { label: '金额', value: 'amount' },
          { label: 'ID', value: 'id' },
          ...Array.from(keys).map((key) => ({ label: key, value: key })),
        ];
      },
      setNodeTypeColor(type, value) {
        this.nodeColorMap = { ...this.nodeColorMap, [type]: value };
      },
      setEdgeTypeColor(type, value) {
        this.edgeColorMap = { ...this.edgeColorMap, [type]: value };
      },
      setNodeLabelField(type, value) {
        this.nodeLabelFields = { ...this.nodeLabelFields, [type]: value };
      },
      setEdgeLabelField(type, value) {
        this.edgeLabelFields = { ...this.edgeLabelFields, [type]: value };
      },
      resetNodeStyles() {
        const nextColors = {};
        const nextLabels = {};
        this.result.nodes.forEach((node) => {
          const type = node.type || '未分类实体';
          nextColors[type] = this.defaultNodeColor(type);
          nextLabels[type] = 'label';
        });
        this.nodeColorMap = nextColors;
        this.nodeLabelFields = nextLabels;
      },
      resetEdgeStyles() {
        const nextColors = {};
        const nextLabels = {};
        this.result.edges.forEach((edge) => {
          const type = edge.type || '未分类关系';
          nextColors[type] = this.defaultEdgeColor(type);
          nextLabels[type] = 'type';
        });
        this.edgeColorMap = nextColors;
        this.edgeLabelFields = nextLabels;
      },
      selectNode(n, options = {}) {
        this.selectedType = 'node';
        this.selectedId = n.id;
        if (options.openDetail !== false) {
          this.openRightPanelTab('detail', { title: this.detailPanelTabTitle() });
        }
      },
      selectEdge(e) {
        this.selectedType = 'edge';
        this.selectedId = e.id;
        this.openRightPanelTab('detail', { title: this.detailPanelTabTitle() });
      },
      hideSelected() {
        if (this.selectedType === 'node' && !this.hiddenNodeIds.includes(this.selectedId)) {
          this.hiddenNodeIds.push(this.selectedId);
          this.clearSelectedObject();
          return;
        }
        if (this.selectedType === 'edge') this.toast('已隐藏当前关系，仅影响本次查询结果');
      },
      expandSelected() {
        this.addExpandQueryStep();
      },
      openPanel(panel) {
        if (panel === 'detail') {
          this.openRightPanelTab('detail', { title: this.detailPanelTabTitle() });
          return;
        }
        if (panel === 'canvas') {
          this.openRightPanelTab('style');
        }
      },
      toggleLayoutPicker(event) {
        this.listLayoutPickerOpen = false;
        this.listLayoutPickerStyle = null;
        if (this.layoutPickerOpen) {
          this.layoutPickerOpen = false;
          this.layoutPickerStyle = null;
          return;
        }
        this.layoutPickerOpen = true;
        this.$nextTick(() => this.positionLayoutPicker(event));
      },
      toggleListLayoutPicker(event) {
        this.layoutPickerOpen = false;
        this.layoutPickerStyle = null;
        if (this.listLayoutPickerOpen) {
          this.listLayoutPickerOpen = false;
          this.listLayoutPickerStyle = null;
          return;
        }
        this.listLayoutPickerOpen = true;
        this.$nextTick(() => this.positionListLayoutPicker(event));
      },
      selectListDisplayMode(item) {
        this.listDisplayMode = item.key;
        if (item.key === 'single' && !['nodes', 'edges'].includes(this.listSinglePane)) {
          this.listSinglePane = 'nodes';
        }
        this.listLayoutPickerOpen = false;
        this.listLayoutPickerStyle = null;
      },
      selectLayoutTemplate(item) {
        this.layoutTemplateKey = item.key;
        this.layoutMode = item.layout;
        this.layoutPickerOpen = false;
        this.layoutPickerStyle = null;
      },
      toggleRightOperationPanel() {
        this.layoutPickerOpen = false;
        this.operationPanelCollapsed = !this.operationPanelCollapsed;
      },
      openCanvasStylePanel() {
        this.layoutPickerOpen = false;
        this.layoutPickerStyle = null;
        this.listLayoutPickerOpen = false;
        this.listLayoutPickerStyle = null;
        this.openRightPanelTab('style');
      },
      expandAllDisplayPanels() {
        this.layoutPickerOpen = false;
        this.queryPanelCollapsed = false;
        if (this.viewMode === 'canvas') {
          this.legendVisible = true;
        }
        this.operationPanelCollapsed = false;
      },
      collapseAllDisplayPanels() {
        this.layoutPickerOpen = false;
        this.queryPanelCollapsed = true;
        if (this.viewMode === 'canvas') {
          this.legendVisible = false;
        }
        this.operationPanelCollapsed = true;
      },
      onCanvasBackgroundClick() {
        this.layoutPickerOpen = false;
        this.closeAllPopovers();
        this.clearSelectedObject();
      },
      canvasChartZoomIn() {
        this.$refs.graphChart?.zoomIn();
      },
      canvasChartZoomOut() {
        this.$refs.graphChart?.zoomOut();
      },
      canvasChartFocusCenter() {
        this.$refs.graphChart?.focusCenter();
      },
      canvasDownload() {
        this.toast(this.viewMode === 'list' ? '已准备下载当前筛选列表' : '已准备下载 PNG / Excel / JSON');
      },
      canvasScreenshot() {
        this.toast('已生成当前画布快照');
      },
      openSourceDataModal() {
        if (!this.selectedObject) return;
        this.sourceDataModalOpen = true;
      },
      canvasSave() {
        this.toast('已保存为历史小图');
      },
      toggleCanvasMinimap() {
        this.canvasMinimapOpen = !this.canvasMinimapOpen;
        if (this.canvasMinimapOpen) {
          this.$nextTick(() => {
            const host = this.$refs.minimapHost;
            this.$refs.graphChart?.mountMinimap(host);
          });
          return;
        }
        this.$refs.graphChart?.disposeMinimap();
      },
      syncCanvasMinimapLayout() {
        if (!this.canvasMinimapOpen) return;
        this.$nextTick(() => {
          this.$refs.graphChart?.mountMinimap(this.$refs.minimapHost);
        });
      },
      toggleCanvasFullscreen() {
        const wrap = this.$el?.querySelector('.graph-canvas-wrap');
        if (!wrap) return;
        if (!document.fullscreenElement) {
          const req = wrap.requestFullscreen?.() || wrap.webkitRequestFullscreen?.();
          if (req?.catch) {
            req.catch(() => this.toast('当前环境不支持全屏'));
          }
          return;
        }
        (document.exitFullscreen?.() || document.webkitExitFullscreen?.())?.catch?.(() => {});
      },
      onCanvasFullscreenChange() {
        this.canvasFullscreen = document.fullscreenElement === this.$el?.querySelector('.graph-canvas-wrap');
      },
      onGraphContextMenuNode({ node, nativeEvent }) {
        if (!node || !nativeEvent) return;
        nativeEvent.preventDefault();
        this.closeAllPopovers();
        this.selectNode(node, { openDetail: false });
        this.canvasContextMenu = {
          open: true,
          x: nativeEvent.clientX,
          y: nativeEvent.clientY,
        };
      },
      onGraphContextMenuEdge({ edge, nativeEvent }) {
        if (!edge || !nativeEvent) return;
        nativeEvent.preventDefault();
        this.closeCanvasContextMenu();
        this.selectEdge(edge);
      },
      closeCanvasContextMenu() {
        if (!this.canvasContextMenu.open) return;
        this.canvasContextMenu.open = false;
      },
      onCanvasNodeContextMenuClick({ key }) {
        this.closeCanvasContextMenu();
        if (!this.activeSelectedNode) return;
        if (key === 'expand-direct') {
          this.expandSelected();
          return;
        }
        if (key === 'expand-conditional') {
          this.toast('条件扩展（演示）：将打开拓展条件配置');
          return;
        }
        if (key === 'hide') {
          this.hideSelected();
          return;
        }
        if (key === 'delete') {
          this.deleteSelectedFromResult();
          return;
        }
        if (key === 'center') {
          this.handleNodeAction('center');
          return;
        }
        if (key === 'neighbors' || key === 'shortest-path' || key === 'canvas-cycle-directed' || key === 'canvas-cycle-undirected') {
          this.handleNodeAction(key);
        }
      },
      clearSelectedObject() {
        this.selectedId = '';
        this.selectedType = 'node';
        this.layoutPickerOpen = false;
      },
      toggleNodeTypeFilter(type) {
        const key = type || '未分类实体';
        this.hiddenNodeTypes = this.hiddenNodeTypes.includes(key)
          ? this.hiddenNodeTypes.filter((item) => item !== key)
          : [...this.hiddenNodeTypes, key];
        if (this.selectedType === 'node' && this.selectedId && this.hiddenNodeTypes.includes(this.selectedNode?.type || '未分类实体')) {
          this.clearSelectedObject();
        }
      },
      toggleEdgeTypeFilter(type) {
        const key = type || '未分类关系';
        this.hiddenEdgeTypes = this.hiddenEdgeTypes.includes(key)
          ? this.hiddenEdgeTypes.filter((item) => item !== key)
          : [...this.hiddenEdgeTypes, key];
        if (this.selectedType === 'edge' && this.selectedId && this.hiddenEdgeTypes.includes(this.selectedEdge?.type || '未分类关系')) {
          this.clearSelectedObject();
        }
      },
      handleNodeAction(action) {
        if (!this.activeSelectedNode) return;
        if (action === 'neighbors' || action === 'shortest-path' || action === 'canvas-cycle-directed' || action === 'canvas-cycle-undirected') {
          this.runOnGraphAnalysisTool(action);
          return;
        }
        if (action === 'detail') {
          this.openPanel('detail');
          return;
        }
        if (action === 'expand') {
          this.expandSelected();
          return;
        }
        if (action === 'hide') {
          this.hideSelected();
          return;
        }
        if (action === 'center') {
          this.toast('已设为中心节点');
        }
      },
      deleteSelectedFromResult() {
        this.toast('仅从本次查询结果删除，不删除原始数据');
      },
      nodeRow(record) {
        return { onClick: () => this.selectNode(this.result.nodes.find((n) => n.id === record.id)) };
      },
      edgeRow(record) {
        return { onClick: () => this.selectEdge(this.result.edges.find((e) => e.id === record.id)) };
      },
      nodeRowClassName(record) {
        const classes = [];
        if (this.selectedType === 'node' && record.id === this.selectedId) classes.push('is-selected');
        if (this.selectedType === 'edge' && this.selectedEdge && (record.id === this.selectedEdge.from || record.id === this.selectedEdge.to)) {
          classes.push('is-related');
        }
        return classes.join(' ');
      },
      edgeRowClassName(record) {
        const classes = [];
        if (this.selectedType === 'edge' && record.id === this.selectedId) classes.push('is-selected');
        if (this.selectedType === 'node') classes.push('is-related');
        return classes.join(' ');
      },
      formatHistoryUpdated(value) {
        const raw = String(value || '').trim();
        if (!raw) return '—';
        return raw.split(/\s+/)[0] || raw;
      },
      formatHistoryListDate(value) {
        const date = this.formatHistoryUpdated(value);
        const match = date.match(/^\d{4}-(\d{2}-\d{2})$/);
        return match ? match[1] : date;
      },
      onHistoryClick(h) {
        this.$emit('select-history', h);
      },
      isHistoryPinned(id) {
        return this.pinnedHistoryIds.includes(id);
      },
      toggleHistoryPinned(h) {
        const hit = this.isHistoryPinned(h.id);
        this.pinnedHistoryIds = hit
          ? this.pinnedHistoryIds.filter((id) => id !== h.id)
          : [h.id, ...this.pinnedHistoryIds];
      },
      toggleHistorySearch() {
        if (this.historySearchOpen) this.historyFilter = '';
        this.historySearchOpen = !this.historySearchOpen;
      },
      openHistoryRename(h) {
        this.renameHistoryTarget = h;
        this.renameHistoryName = h.name || '';
        this.renameHistoryOpen = true;
      },
      confirmHistoryRename() {
        const name = this.renameHistoryName.trim();
        if (!this.renameHistoryTarget || !name) return;
        this.$emit('rename-history', { history: this.renameHistoryTarget, name });
        this.renameHistoryOpen = false;
        this.renameHistoryTarget = null;
        this.renameHistoryName = '';
      },
      deleteHistoryItem(h) {
        const messageApi = window.antd && window.antd.Modal;
        const run = () => this.$emit('delete-history', h);
        if (messageApi && typeof messageApi.confirm === 'function') {
          messageApi.confirm({
            title: '删除最近查询',
            content: `确认删除“${h.name}”？`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: run,
          });
          return;
        }
        run();
      },
      onHistoryMenuClick(h, event) {
        const key = event && event.key;
        if (key === 'rename') {
          this.openHistoryRename(h);
          return;
        }
        if (key === 'delete') this.deleteHistoryItem(h);
      },
      onQueryTemplateClick(item) {
        if (item.action === 'template') {
          this.$emit('open-template-query', { graph: this.graph, templateId: item.templateId });
          return;
        }
        this.$emit('open-quick-query-modal', { graph: this.graph, mode: item.mode });
      },
      onNewQueryMenuClick({ key }) {
        if (key === 'quick') {
          this.$emit('open-quick-query-modal', { graph: this.graph });
          return;
        }
        if (key === 'template') {
          this.$emit('open-template-query');
        }
      },
    },
    template: `
      <section class="graph-canvas-view shell-main-flex-col">
        <header class="workbench-top-header workbench-top-header--unified workbench-top-header--project-detail">
          <div class="workbench-top-header__left workbench-top-header__left--with-pane-toggle">
            <a-button type="text" class="ds-icon-btn workbench-back-text-btn" title="返回图谱查询" aria-label="返回图谱查询" @click="$emit('go-home')">
              <svg class="iconpark-icon workbench-back-icon"><use href="#arrow-left"></use></svg>
            </a-button>
            <a-button
              type="text"
              class="ds-icon-btn workbench-left-pane-toggle-btn"
              :title="sourcesCollapsed ? '展开左栏（历史查询）' : '收起左栏（历史查询）'"
              :aria-label="sourcesCollapsed ? '展开左栏' : '收起左栏'"
              :aria-expanded="sourcesCollapsed ? 'false' : 'true'"
              @click="toggleSourcesCollapsed"
            >
              <svg class="iconpark-icon workbench-left-pane-toggle-icon" aria-hidden="true"><use href="#left-bar"></use></svg>
            </a-button>
            <span class="workbench-top-header__session-name" :title="workbenchTitle">{{ workbenchTitle }}</span>
            <div
              v-if="workbenchTopTab === 'graph-query'"
              class="workbench-top-header__edit-actions"
              role="toolbar"
              aria-label="编辑操作"
            >
              <a-button type="text" class="ds-icon-btn workbench-top-header__edit-btn" title="保存为历史小图" aria-label="保存为历史小图" @click="canvasSave">
                <ds-icon name="save" aria-hidden="true" />
              </a-button>
              <a-button type="text" class="ds-icon-btn workbench-top-header__edit-btn" title="撤销上一步操作" aria-label="撤销上一步操作" @click="toast('已撤销上一步操作')">
                <ds-icon name="arrow-rotate-left" aria-hidden="true" />
              </a-button>
              <a-button type="text" class="ds-icon-btn workbench-top-header__edit-btn" title="恢复下一步操作" aria-label="恢复下一步操作" @click="toast('已执行下一步操作')">
                <ds-icon name="redo" aria-hidden="true" />
              </a-button>
            </div>
          </div>
          <div class="workbench-top-header__center-title-wrap">
            <nav class="workbench-top-header__tabs" role="tablist" aria-label="工作台页签">
              <button
                v-for="tab in workbenchTopTabOptions"
                :key="tab.value"
                type="button"
                role="tab"
                class="workbench-top-header__tab"
                :class="{ 'is-active': workbenchTopTab === tab.value }"
                :aria-selected="workbenchTopTab === tab.value ? 'true' : 'false'"
                @click="switchWorkbenchTopTab(tab.value)"
              >{{ tab.label }}</button>
            </nav>
          </div>
        </header>

        <div
          v-if="visibleGraphAnalysisTasks.length"
          class="graph-analysis-task-dock"
          role="region"
          aria-label="算法分析执行进度"
        >
          <button
            v-for="task in visibleGraphAnalysisTasks"
            :key="task.id"
            type="button"
            class="graph-analysis-task-chip"
            :class="{
              'is-active': isAnalysisTaskChipActive(task),
              'is-running': task.status === 'running',
              'is-done': task.status === 'done',
            }"
            :title="'查看' + task.title + '面板'"
            :aria-label="task.title + '，进度' + task.progress + '%，点击查看'"
            @click="focusAnalysisTask(task)"
          >
            <span class="graph-analysis-task-chip__head">
              <span class="graph-analysis-task-chip__title">{{ task.title }}</span>
              <span class="graph-analysis-task-chip__pct">{{ task.progress }}%</span>
            </span>
            <span
              class="graph-analysis-task-chip__track"
              role="progressbar"
              :aria-valuenow="task.progress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span class="graph-analysis-task-chip__bar" :style="{ width: task.progress + '%' }"></span>
            </span>
          </button>
        </div>

        <div ref="mainBody" class="workbench-body">
          <aside class="workbench-rail workbench-rail--sources" :style="leftWorkbenchRailStyle">
            <div v-show="!sourcesCollapsed" class="nlm-side-panel graph-wb-side-panel graph-wb-history-panel">
              <div class="nlm-side-panel-body graph-wb-side-panel-body graph-wb-history-panel__body">
                <section class="graph-wb-query-section graph-wb-query-section--templates">
                  <div class="graph-wb-query-region-head">
                    <strong>图谱查询</strong>
                  </div>
                  <div class="graph-wb-query-template-tabs" role="tablist" aria-label="查询类型">
                    <button
                      type="button"
                      role="tab"
                      class="graph-wb-query-template-tab"
                      :class="{ 'is-active': queryTemplateTab === 'general' }"
                      :aria-selected="queryTemplateTab === 'general' ? 'true' : 'false'"
                      @click="queryTemplateTab = 'general'"
                    >通用查询</button>
                    <button
                      type="button"
                      role="tab"
                      class="graph-wb-query-template-tab"
                      :class="{ 'is-active': queryTemplateTab === 'template' }"
                      :aria-selected="queryTemplateTab === 'template' ? 'true' : 'false'"
                      @click="queryTemplateTab = 'template'"
                    >模板查询</button>
                  </div>
                  <div v-if="queryTemplateCards.length" class="graph-wb-query-template-list">
                    <button
                      v-for="item in queryTemplateCards"
                      :key="item.key"
                      type="button"
                      class="graph-wb-query-template-card"
                      @click="onQueryTemplateClick(item)"
                    >
                      <span class="graph-wb-query-template-card__icon">
                        <svg v-if="item.iconSymbol" class="iconpark-icon" aria-hidden="true"><use :href="'#' + item.iconSymbol"></use></svg>
                        <ds-icon v-else :name="item.icon" aria-hidden="true" />
                      </span>
                      <span class="graph-wb-query-template-card__text">
                        <strong>{{ item.title }}</strong>
                        <small>{{ item.desc }}</small>
                      </span>
                    </button>
                  </div>
                  <a-empty v-else :description="queryTemplateEmptyText" />
                </section>
                <section class="graph-wb-query-section graph-wb-query-section--recent">
                  <div class="graph-wb-query-region-head">
                    <strong>历史查询</strong>
                    <button
                      type="button"
                      class="graph-wb-history-search-toggle"
                      :class="{ 'is-active': historySearchOpen || historyFilter }"
                      :aria-pressed="historySearchOpen ? 'true' : 'false'"
                      aria-label="搜索历史查询"
                      title="搜索"
                      @click="toggleHistorySearch"
                    ><ds-icon name="search" aria-hidden="true" /></button>
                  </div>
                  <a-input
                    v-if="historySearchOpen"
                    v-model:value="historyFilter"
                    size="small"
                    allow-clear
                    placeholder="搜索最近查询"
                    aria-label="搜索最近查询"
                    class="ds-input-inline-search ds-input-inline-search--compact graph-wb-history-search-input"
                  >
                    <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
                  </a-input>
                  <div class="graph-wb-history-tabs" role="tablist" aria-label="历史查询范围">
                    <button
                      type="button"
                      class="graph-wb-history-tab"
                      :class="{ 'is-active': historyTab === 'recent' }"
                      role="tab"
                      :aria-selected="historyTab === 'recent' ? 'true' : 'false'"
                      @click="historyTab = 'recent'"
                    >最近查询</button>
                    <button
                      type="button"
                      class="graph-wb-history-tab"
                      :class="{ 'is-active': historyTab === 'favorite' }"
                      role="tab"
                      :aria-selected="historyTab === 'favorite' ? 'true' : 'false'"
                      @click="historyTab = 'favorite'"
                    >我的收藏</button>
                  </div>
                  <div v-if="graphHistory.length" class="graph-query-history-list graph-wb-history-panel__list">
                    <div
                      v-for="h in graphHistory"
                      :key="h.id"
                      role="button"
                      tabindex="0"
                      class="graph-query-history-row"
                      :class="{ 'is-active': activeHistoryId === h.id, 'is-pinned': isHistoryPinned(h.id) }"
                      :aria-label="'切换历史小图：' + h.name + (h.updated ? '，更新于 ' + formatHistoryListDate(h.updated) : '')"
                      @click="onHistoryClick(h)"
                      @keydown.enter.prevent="onHistoryClick(h)"
                      @keydown.space.prevent="onHistoryClick(h)"
                    >
                      <span class="graph-query-history-row__content">
                        <svg class="iconpark-icon graph-query-history-row__graph-icon" aria-hidden="true"><use href="#map-draw"></use></svg>
                        <span class="graph-query-history-row__text">
                          <span class="graph-query-history-row__name">{{ h.name }}</span>
                        </span>
                      </span>
                      <span class="graph-query-history-row__aside">
                        <span class="graph-query-history-row__meta">
                          <span v-if="activeHistoryId === h.id" class="graph-query-history-row__badge">当前</span>
                          <time
                            v-else-if="h.updated"
                            class="graph-query-history-row__date"
                            :datetime="String(h.updated).replace(' ', 'T')"
                          >{{ formatHistoryListDate(h.updated) }}</time>
                        </span>
                        <span class="graph-query-history-row__actions">
                          <button
                            type="button"
                            class="graph-query-history-row__action"
                            :class="{ 'is-active': isHistoryPinned(h.id) }"
                            :aria-label="isHistoryPinned(h.id) ? '取消置顶' : '置顶'"
                            :title="isHistoryPinned(h.id) ? '取消置顶' : '置顶'"
                            @click.stop="toggleHistoryPinned(h)"
                          ><ds-icon name="arrow-up" aria-hidden="true" /></button>
                          <span class="graph-query-history-row__more" @click.stop>
                            <a-dropdown :trigger="['click']" placement="bottomRight">
                              <button
                                type="button"
                                class="graph-query-history-row__action"
                                aria-label="更多操作"
                                title="更多"
                              ><ds-icon name="more" aria-hidden="true" /></button>
                              <template #overlay>
                                <a-menu class="graph-query-history-menu" @click="(event) => onHistoryMenuClick(h, event)">
                                  <a-menu-item key="rename">
                                    <span class="graph-query-history-menu__item"><ds-icon name="edit" aria-hidden="true" />重命名</span>
                                  </a-menu-item>
                                  <a-menu-item key="delete" danger>
                                    <span class="graph-query-history-menu__item"><ds-icon name="trash" aria-hidden="true" />删除</span>
                                  </a-menu-item>
                                </a-menu>
                              </template>
                            </a-dropdown>
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                  <div v-else class="graph-wb-history-panel__empty">
                    <a-empty :description="historyEmptyText" />
                  </div>
                </section>
              </div>
            </div>
          </aside>

          <div
            v-show="!sourcesCollapsed"
            class="nlm-resizer"
            role="separator"
            aria-orientation="vertical"
            title="调整左栏宽度"
            @mousedown.stop.prevent="beginResize('sources', $event)"
          ></div>

          <main class="graph-wb-center-panel nlm-assistant-column">
            <div class="graph-canvas-wrap" :class="{ 'is-fullscreen': canvasFullscreen }">
              <div class="graph-canvas-stage">
                <div class="graph-canvas-flow-chrome">
                <div
                  class="graph-canvas-flow-toolbar"
                  :class="{ 'is-on-graph-analysis': workbenchTopTab === 'on-graph-analysis' }"
                  :aria-label="workbenchTopTab === 'on-graph-analysis' ? '图上分析工具栏' : (viewMode === 'list' ? '列表工具栏' : '画布工具栏')"
                >
                  <div
                    v-if="workbenchTopTab === 'graph-query'"
                    class="graph-canvas-toolbar-start"
                    role="toolbar"
                    :aria-label="viewMode === 'list' ? '列表工具栏' : '画布工具栏'"
                  >
                    <div class="graph-canvas-toolbar-clusters">
                      <div
                        class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--view"
                        :class="{
                          'is-layout-picker-open': layoutPickerOpen && viewMode === 'canvas',
                          'is-list-layout-picker-open': listLayoutPickerOpen && viewMode === 'list',
                        }"
                        aria-label="视图与展示"
                      >
                        <div class="graph-canvas-toolbar-cluster__body graph-canvas-toolbar-cluster__body--view">
                          <div class="graph-canvas-mode-toggle-group" role="group" aria-label="模式切换">
                            <button
                              type="button"
                              class="graph-canvas-mode-toggle"
                              :class="{ 'is-active': viewMode === 'canvas' }"
                              :aria-pressed="viewMode === 'canvas' ? 'true' : 'false'"
                              @click="viewMode = 'canvas'; listLayoutPickerOpen = false; listLayoutPickerStyle = null"
                            >
                              <ds-icon name="diagram-project" class="graph-canvas-mode-toggle__icon" aria-hidden="true" />
                              <span class="graph-canvas-mode-toggle__label">画布</span>
                            </button>
                            <button
                              type="button"
                              class="graph-canvas-mode-toggle"
                              :class="{ 'is-active': viewMode === 'list' }"
                              :aria-pressed="viewMode === 'list' ? 'true' : 'false'"
                              @click="viewMode = 'list'; layoutPickerOpen = false; layoutPickerStyle = null"
                            >
                              <ds-icon name="table" class="graph-canvas-mode-toggle__icon" aria-hidden="true" />
                              <span class="graph-canvas-mode-toggle__label">列表</span>
                            </button>
                          </div>
                          <div class="graph-canvas-toolbar-view-tools">
                            <div
                              v-if="viewMode === 'canvas'"
                              class="graph-canvas-toolbar-display-style"
                              :class="{ 'is-layout-picker-open': layoutPickerOpen }"
                            >
                              <button
                                ref="layoutPickerAnchor"
                                type="button"
                                class="graph-canvas-panel-layout-btn graph-canvas-panel-layout-btn--toolbar"
                                :class="{ 'is-open': layoutPickerOpen }"
                                :aria-expanded="layoutPickerOpen ? 'true' : 'false'"
                                title="切换布局方式"
                                @click.stop="toggleLayoutPicker($event)"
                              >
                                <span class="graph-canvas-layout-card__preview" :class="'is-' + (currentLayoutTemplate.variant || 'balanced')" aria-hidden="true">
                                  <span></span><span></span><span></span><span></span><span></span>
                                </span>
                                <span class="graph-canvas-layout-card__text">
                                  <strong>{{ currentLayoutTemplate.label || '关系探索' }}</strong>
                                  <small>布局方式</small>
                                </span>
                                <ds-icon name="chevron-down" class="graph-canvas-layout-card__arrow" aria-hidden="true" />
                              </button>
                            </div>
                            <div
                              v-else
                              class="graph-canvas-toolbar-display-style"
                              :class="{ 'is-list-layout-picker-open': listLayoutPickerOpen }"
                            >
                              <button
                                ref="listLayoutPickerAnchor"
                                type="button"
                                class="graph-canvas-panel-layout-btn graph-canvas-panel-layout-btn--toolbar"
                                :class="{ 'is-open': listLayoutPickerOpen }"
                                :aria-expanded="listLayoutPickerOpen ? 'true' : 'false'"
                                :title="currentListDisplayMode.hint"
                                @click.stop="toggleListLayoutPicker($event)"
                              >
                                <span
                                  class="graph-canvas-layout-card__preview graph-canvas-list-layout-preview"
                                  :class="'is-' + currentListDisplayMode.variant"
                                  aria-hidden="true"
                                ></span>
                                <span class="graph-canvas-layout-card__text">
                                  <strong>{{ currentListDisplayMode.label }}</strong>
                                  <small>列表展示</small>
                                </span>
                                <ds-icon name="chevron-down" class="graph-canvas-layout-card__arrow" aria-hidden="true" />
                              </button>
                            </div>
                            <button
                              type="button"
                              class="graph-canvas-ribbon-btn ds-btn--ribbon-stack graph-canvas-toolbar-style-btn"
                              :class="{ 'is-active': isStyleTabActive }"
                              title="打开样式面板"
                              :aria-pressed="isStyleTabActive ? 'true' : 'false'"
                              @click="openCanvasStylePanel"
                            >
                              <ds-icon name="table-columns" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                              <span class="graph-canvas-ribbon-btn__label">样式</span>
                            </button>
                          </div>
                        </div>
                        <div class="graph-canvas-toolbar-cluster__caption">视图</div>
                      </div>
                      <div class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--filter" aria-label="显示筛选">
                        <div class="graph-canvas-toolbar-cluster__body">
                          <a-button
                            type="text"
                            class="graph-canvas-ribbon-btn ds-btn--ribbon-stack graph-canvas-ribbon-btn--filter-advanced"
                            :class="{ 'is-active': showAdvancedFilterStrip || advancedFilterModalOpen }"
                            title="配置高级筛选条件"
                            :aria-pressed="showAdvancedFilterStrip || advancedFilterModalOpen ? 'true' : 'false'"
                            @click="openAdvancedFilterModal"
                          >
                            <ds-icon name="filter" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                            <span class="graph-canvas-ribbon-btn__label">高级筛选</span>
                          </a-button>
                        </div>
                        <div class="graph-canvas-toolbar-cluster__caption">筛选</div>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else
                    class="graph-canvas-toolbar-start graph-canvas-toolbar-start--analysis"
                    role="toolbar"
                    aria-label="图上分析工具栏"
                  >
                    <div class="graph-canvas-toolbar-clusters graph-canvas-toolbar-clusters--analysis">
                      <div class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--algorithm" aria-label="算法分析">
                        <div class="graph-canvas-toolbar-cluster__body">
                          <a-dropdown :trigger="['click']" placement="bottom">
                            <a-button
                              type="text"
                              class="graph-canvas-ribbon-btn ds-btn--ribbon-stack graph-canvas-ribbon-dropdown-btn graph-canvas-algorithm-cycle-btn"
                              :class="{ 'is-active': isAlgorithmCycleActive }"
                              title="调用图算法检测环路（作用于底层图数据）"
                              :aria-pressed="isAlgorithmCycleActive ? 'true' : 'false'"
                            >
                              <ds-icon name="share-nodes" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                              <span class="graph-canvas-ribbon-btn__label-row">
                                <span class="graph-canvas-ribbon-btn__label">环检测</span>
                                <ds-icon name="chevron-down" class="graph-canvas-ribbon-btn__icon graph-canvas-ribbon-btn__icon--tail" aria-hidden="true" />
                              </span>
                            </a-button>
                            <template #overlay>
                              <a-menu class="graph-canvas-algorithm-cycle-menu" @click="onAlgorithmCycleMenuClick">
                                <a-menu-item key="algo-cycle-directed">有向环检测</a-menu-item>
                                <a-menu-item key="algo-cycle-undirected">无向环检测</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                          <a-button
                            type="text"
                            class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                            :class="{ 'is-active': isAnalysisNodeSearchActive }"
                            title="按算法在当前图上搜索节点"
                            :aria-pressed="isAnalysisNodeSearchActive ? 'true' : 'false'"
                            @click="runAlgorithmAnalysisTool('node-search')"
                          >
                            <ds-icon name="search" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                            <span class="graph-canvas-ribbon-btn__label">节点搜索</span>
                          </a-button>
                          <a-button
                            type="text"
                            class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                            :class="{ 'is-active': isAnalysisPathQueryActive }"
                            title="按算法条件查询路径"
                            :aria-pressed="isAnalysisPathQueryActive ? 'true' : 'false'"
                            @click="runAlgorithmAnalysisTool('path-query')"
                          >
                            <ds-icon name="share-nodes" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                            <span class="graph-canvas-ribbon-btn__label">路径查询</span>
                          </a-button>
                        </div>
                        <div class="graph-canvas-toolbar-cluster__caption">算法分析</div>
                      </div>
                      <div class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--agent" aria-label="智能体">
                        <div class="graph-canvas-toolbar-cluster__body">
                          <a-button
                            type="text"
                            class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                            :class="{ 'is-active': isAgentAssistantActive }"
                            title="打开图谱 AI 助手对话"
                            :aria-pressed="isAgentAssistantActive ? 'true' : 'false'"
                            @click="openGraphAgentAssistant"
                          >
                            <ds-icon name="magic" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                            <span class="graph-canvas-ribbon-btn__label">AI助手</span>
                          </a-button>
                        </div>
                        <div class="graph-canvas-toolbar-cluster__caption">智能体</div>
                      </div>
                    </div>
                  </div>
                  <div v-if="workbenchTopTab === 'graph-query'" class="graph-canvas-toolbar-end">
                    <div class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--display" role="toolbar" aria-label="界面区域显示">
                      <div class="graph-canvas-toolbar-cluster__body">
                        <a-button
                          type="text"
                          class="graph-canvas-ribbon-btn ds-btn--ribbon-stack graph-canvas-ribbon-btn--compact"
                          title="展开查询、图例与操作栏"
                          @click="expandAllDisplayPanels"
                        >
                          <ds-icon name="angles-right" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                          <span class="graph-canvas-ribbon-btn__label">全部展开</span>
                        </a-button>
                        <a-button
                          type="text"
                          class="graph-canvas-ribbon-btn ds-btn--ribbon-stack graph-canvas-ribbon-btn--compact"
                          title="收起查询、图例与操作栏"
                          @click="collapseAllDisplayPanels"
                        >
                          <ds-icon name="angles-left" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                          <span class="graph-canvas-ribbon-btn__label">全部收起</span>
                        </a-button>
                        <a-button
                          type="text"
                          class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                          :class="{ 'is-active': !queryPanelCollapsed }"
                          :title="queryPanelCollapsed ? '显示查询范围面板' : '隐藏查询范围面板'"
                          :aria-pressed="!queryPanelCollapsed ? 'true' : 'false'"
                          @click="queryPanelCollapsed = !queryPanelCollapsed"
                        >
                          <svg class="iconpark-icon graph-canvas-ribbon-btn__icon" aria-hidden="true"><use href="#left-bar"></use></svg>
                          <span class="graph-canvas-ribbon-btn__label">查询</span>
                        </a-button>
                        <a-button
                          v-if="viewMode === 'canvas'"
                          type="text"
                          class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                          :class="{ 'is-active': legendVisible }"
                          :title="legendVisible ? '隐藏底部图例条' : '显示底部图例条'"
                          :aria-pressed="legendVisible ? 'true' : 'false'"
                          @click="legendVisible = !legendVisible"
                        >
                          <svg class="iconpark-icon graph-canvas-ribbon-btn__icon" aria-hidden="true"><use href="#bottom-bar"></use></svg>
                          <span class="graph-canvas-ribbon-btn__label">图例</span>
                        </a-button>
                        <a-button
                          type="text"
                          class="graph-canvas-ribbon-btn ds-btn--ribbon-stack"
                          :class="{ 'is-active': isRightPanelVisible }"
                          :title="isRightPanelVisible ? '隐藏操作栏' : '显示操作栏'"
                          :aria-pressed="isRightPanelVisible ? 'true' : 'false'"
                          @click="toggleRightOperationPanel"
                        >
                          <svg class="iconpark-icon graph-canvas-ribbon-btn__icon" aria-hidden="true"><use href="#right-bar"></use></svg>
                          <span class="graph-canvas-ribbon-btn__label">操作</span>
                        </a-button>
                      </div>
                      <div class="graph-canvas-toolbar-cluster__caption">显示</div>
                    </div>
                    <div class="graph-canvas-toolbar-cluster graph-canvas-toolbar-cluster--export graph-canvas-toolbar-cluster--end" role="toolbar" aria-label="快照与下载">
                      <div class="graph-canvas-toolbar-cluster__body">
                        <a-button v-if="viewMode === 'canvas'" type="text" class="graph-canvas-ribbon-btn ds-btn--ribbon-stack" title="生成当前画布快照" @click="canvasScreenshot">
                          <ds-icon name="file-image" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                          <span class="graph-canvas-ribbon-btn__label">快照</span>
                        </a-button>
                        <a-button v-else type="text" class="graph-canvas-ribbon-btn ds-btn--ribbon-stack" title="导出当前筛选列表" @click="toast('已导出当前筛选列表')">
                          <ds-icon name="table" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                          <span class="graph-canvas-ribbon-btn__label">导出</span>
                        </a-button>
                        <a-button type="text" class="graph-canvas-ribbon-btn ds-btn--ribbon-stack" :title="viewMode === 'list' ? '下载当前列表' : '下载 PNG / Excel / JSON'" @click="canvasDownload">
                          <ds-icon name="download" class="graph-canvas-ribbon-btn__icon" aria-hidden="true" />
                          <span class="graph-canvas-ribbon-btn__label">下载</span>
                        </a-button>
                      </div>
                      <div class="graph-canvas-toolbar-cluster__caption">快照与下载</div>
                    </div>
                  </div>
                </div>
                <div
                  v-if="showAdvancedFilterStrip"
                  class="graph-canvas-advanced-filter-strip"
                  role="region"
                  aria-label="高级筛选规则"
                >
                  <span class="graph-canvas-advanced-filter-strip__label">高级筛选</span>
                  <div class="graph-canvas-advanced-filter-strip__rules">
                    <span
                      v-for="tag in advancedFilterTags"
                      :key="'strip-adv-' + tag.id"
                      class="graph-canvas-filter-tag graph-canvas-filter-tag--rule"
                      :title="tag.label"
                    >{{ tag.label }}</span>
                  </div>
                  <a-button size="small" type="link" class="graph-canvas-advanced-filter-strip__edit" @click="openAdvancedFilterModal">
                    编辑
                  </a-button>
                  <a-button size="small" type="link" class="graph-canvas-advanced-filter-strip__clear" @click="resetGlobalFilters">
                    清空
                  </a-button>
                  <button type="button" class="graph-canvas-advanced-filter-strip__close" aria-label="收起规则展示" @click="closeAdvancedFilterStrip">
                    <ds-icon name="close" aria-hidden="true" />
                  </button>
                </div>
                <div
                  v-if="listLayoutPickerOpen && viewMode === 'list'"
                  class="graph-canvas-layout-picker graph-canvas-layout-picker--toolbar graph-canvas-layout-picker--list graph-canvas-layout-picker--fixed"
                  :style="listLayoutPickerStyle"
                  role="dialog"
                  aria-label="列表展示方式"
                  @click.stop
                >
                  <div class="graph-canvas-layout-picker__scroll">
                    <section v-for="group in listDisplayModeGroups" :key="group.title" class="graph-canvas-layout-picker__group">
                      <h3>{{ group.title }}</h3>
                      <div class="graph-canvas-layout-picker__grid">
                        <button
                          v-for="item in group.items"
                          :key="item.key"
                          type="button"
                          class="graph-canvas-layout-option"
                          :class="{ 'is-active': listDisplayMode === item.key }"
                          :aria-label="item.label"
                          :title="item.hint"
                          @click.stop="selectListDisplayMode(item)"
                        >
                          <span
                            class="graph-canvas-layout-option__preview graph-canvas-list-layout-preview"
                            :class="'is-' + item.variant"
                            aria-hidden="true"
                          ></span>
                          <span class="graph-canvas-layout-option__body">
                            <strong>{{ item.label }}</strong>
                          </span>
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
                <div
                  v-if="layoutPickerOpen && viewMode === 'canvas'"
                  class="graph-canvas-layout-picker graph-canvas-layout-picker--toolbar graph-canvas-layout-picker--fixed"
                  :style="layoutPickerStyle"
                  role="dialog"
                  aria-label="图谱布局方式"
                  @click.stop
                >
                  <div class="graph-canvas-layout-picker__scroll">
                    <section v-for="group in layoutTemplateGroups" :key="group.title" class="graph-canvas-layout-picker__group">
                      <h3>{{ group.title }}</h3>
                      <div class="graph-canvas-layout-picker__grid">
                        <button
                          v-for="item in group.items"
                          :key="item.key"
                          type="button"
                          class="graph-canvas-layout-option"
                          :class="{ 'is-active': layoutTemplateKey === item.key }"
                          :aria-label="item.label"
                          @click.stop="selectLayoutTemplate(item)"
                        >
                          <span class="graph-canvas-layout-option__preview" :class="'is-' + item.variant" aria-hidden="true">
                            <span></span><span></span><span></span><span></span><span></span><span></span>
                          </span>
                          <span class="graph-canvas-layout-option__body">
                            <strong>{{ item.label }}</strong>
                          </span>
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
                </div>

                <div
                  class="graph-canvas-flow-body"
                  :class="{
                    'is-panel-collapsed': operationPanelCollapsed,
                    'is-query-collapsed': queryPanelCollapsed,
                    'is-list-mode': viewMode === 'list',
                    'is-advanced-strip-open': showAdvancedFilterStrip,
                  }"
                >
                  <aside v-show="!queryPanelCollapsed" class="graph-canvas-query-panel graph-query-scope-panel" aria-label="查询范围">
                    <div class="graph-query-scope">
                      <header class="graph-query-scope-summary">
                        <div class="graph-canvas-flow-kicker">查询范围</div>
                        <strong class="graph-query-scope-summary__title">{{ result.name || '当前查询图' }}</strong>
                        <div class="graph-query-scope-summary__kpi">
                          <span>当前查看</span>
                          <strong>{{ queryScopeStats.nodeCount }} 节点 · {{ queryScopeStats.edgeCount }} 关系</strong>
                        </div>
                        <p class="graph-query-scope-summary__display">显示：{{ displayScopeLabel }}</p>
                        <p v-if="showAdvancedFilterStrip || hiddenNodeTypes.length || hiddenEdgeTypes.length" class="graph-query-scope-summary__hint">
                          <button v-if="showAdvancedFilterStrip || activeGlobalFilterRules.length" type="button" class="graph-query-scope-summary__link" @click="focusDisplayFilter('advanced')">
                            高级筛选 {{ activeGlobalFilterRules.length }} 条
                          </button>
                          <template v-if="(showAdvancedFilterStrip || activeGlobalFilterRules.length) && (hiddenNodeTypes.length || hiddenEdgeTypes.length)"> · </template>
                          <template v-if="hiddenNodeTypes.length || hiddenEdgeTypes.length">已隐藏类型</template>
                        </p>
                      </header>

                      <section class="graph-query-scope-timeline" aria-label="查询步骤">
                        <article
                          v-for="(step, stepIndex) in querySteps"
                          :key="step.id"
                          class="graph-query-scope-step"
                          :class="{ 'is-focused': focusedStepId === step.id, 'is-dimmed': !step.includedInView }"
                          @click="focusQueryStep(step)"
                        >
                          <div class="graph-query-scope-step__head">
                            <label class="graph-query-scope-step__check" @click.stop>
                              <input
                                type="checkbox"
                                :checked="step.includedInView"
                                :aria-label="'显示' + step.label"
                                @change="toggleStepIncluded(step)"
                              />
                            </label>
                            <span class="graph-query-scope-step__index">{{ step.label }}</span>
                            <span class="graph-query-scope-step__kind">{{ stepKindLabel(step.kind) }}</span>
                            <button
                              type="button"
                              class="graph-query-scope-step__menu"
                              :aria-label="step.label + ' 更多操作'"
                              @click.stop="focusQueryStep(step)"
                            >⋯</button>
                          </div>
                          <div class="graph-query-scope-step__query">
                            <span class="graph-query-scope-step__template">{{ step.templateLabel }}</span>
                            <span class="graph-query-scope-step__params">{{ step.querySummary }}</span>
                          </div>
                          <p class="graph-query-scope-step__scale">
                            本步 {{ stepStats(step).nodeCount }} 节点 · {{ stepStats(step).edgeCount }} 关系
                          </p>
                          <div class="graph-query-scope-step__filters">
                            <span v-if="stepFilterSummary(step)" class="graph-query-scope-step__filter-summary">
                              过滤：{{ stepFilterSummary(step) }}
                            </span>
                            <span v-else class="graph-query-scope-step__filter-summary is-empty">无步骤过滤</span>
                            <button type="button" class="graph-query-scope-step__filter-edit" @click.stop="openStepFilterDrawer(step.id, $event)">
                              配置过滤
                            </button>
                          </div>
                          <div class="graph-query-scope-step__actions" @click.stop>
                            <a-button size="small" @click="rerunQueryStep(step)">重新执行</a-button>
                            <a-button size="small" @click="editStepQuery(step, $event)">更换模板</a-button>
                            <a-button size="small" @click="saveStepAsTemplate(step)">存为模板</a-button>
                            <a-button v-if="stepIndex > 0" size="small" danger @click="deleteQueryStep(step)">删除</a-button>
                          </div>
                        </article>

                        <div class="graph-query-scope-add">
                          <a-button block size="small" @click="openTemplatePicker('add', '', $event)">
                            <ds-icon name="plus" aria-hidden="true" />
                            <span>添加查询步骤（选模板）</span>
                          </a-button>
                          <a-button block size="small" type="link" @click="addStepMenuOpen = !addStepMenuOpen">
                            拓展 / 路径等操作
                          </a-button>
                          <div v-if="addStepMenuOpen" class="graph-query-scope-add__menu">
                            <a-button block size="small" @click="addExpandQueryStep">从选中实体拓展（2 跳）</a-button>
                            <a-button block size="small" @click="addPathQueryStep">路径分析（演示）</a-button>
                          </div>
                        </div>
                      </section>

                    </div>
                  </aside>

                  <section class="graph-canvas-flow-result" aria-label="图谱结果">
                    <div v-if="viewMode === 'canvas'" class="graph-canvas-stage-inner graph-canvas-flow-result-body">
                      <div class="graph-canvas-stage-overlays" aria-hidden="false">
                        <div
                          v-if="canvasMinimapOpen"
                          class="graph-canvas-minimap"
                          role="region"
                          aria-label="画布缩略图"
                        >
                          <div ref="minimapHost" class="graph-canvas-minimap__chart"></div>
                        </div>
                        <div class="graph-canvas-viewport-controls" role="toolbar" aria-label="画布视口">
                          <button type="button" class="graph-canvas-viewport-btn" title="缩小" aria-label="缩小" @click="canvasChartZoomOut">
                            <ds-icon name="minus" aria-hidden="true" />
                          </button>
                          <button type="button" class="graph-canvas-viewport-btn" title="放大" aria-label="放大" @click="canvasChartZoomIn">
                            <ds-icon name="plus" aria-hidden="true" />
                          </button>
                          <button type="button" class="graph-canvas-viewport-btn" title="居中显示查询主体" aria-label="居中" @click="canvasChartFocusCenter">
                            <ds-icon name="bullseye" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            class="graph-canvas-viewport-btn"
                            :class="{ 'is-active': canvasMinimapOpen }"
                            title="缩略图"
                            aria-label="缩略图"
                            :aria-pressed="canvasMinimapOpen ? 'true' : 'false'"
                            @click="toggleCanvasMinimap"
                          >
                            <ds-icon name="sitemap" aria-hidden="true" />
                          </button>
                          <button type="button" class="graph-canvas-viewport-btn" title="全屏显示" aria-label="全屏" @click="toggleCanvasFullscreen">
                            <ds-icon name="fullscreen" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <graph-canvas-legend
                        v-if="legendVisible || activeSelectedNode"
                        :nodes="mergedScopeNodes"
                        :edges="mergedScopeEdges"
                        :hidden-node-types="hiddenNodeTypes"
                        :hidden-edge-types="hiddenEdgeTypes"
                        :selected-node="activeSelectedNode"
                        :node-color-map="nodeColorMap"
                        :edge-color-map="edgeColorMap"
                        @toggle-node-type="toggleNodeTypeFilter"
                        @toggle-edge-type="toggleEdgeTypeFilter"
                        @clear-selection="clearSelectedObject"
                        @node-action="handleNodeAction"
                      />
                      <graph-canvas-chart
                        ref="graphChart"
                        :nodes="visibleNodes"
                        :edges="visibleEdges"
                        :selected-id="selectedId"
                        :selected-type="selectedType"
                        :layout-mode="layoutMode"
                        :layout-meta="result.layoutMeta || {}"
                        :center-node-id="graphCenterNodeId"
                        :tree-root-id="graphTreeRootId"
                        :path-node-ids="graphPathNodeIds"
                        :node-color-map="nodeColorMap"
                        :edge-color-map="edgeColorMap"
                        :node-label-fields="nodeLabelFields"
                        :edge-label-fields="edgeLabelFields"
                        @select-node="selectNode"
                        @select-edge="selectEdge"
                        @click-canvas="onCanvasBackgroundClick"
                        @contextmenu-node="onGraphContextMenuNode"
                        @contextmenu-edge="onGraphContextMenuEdge"
                      />
                    </div>
                    <div v-else class="graph-list-mode graph-canvas-flow-result-body">
                      <div v-if="listDisplayMode === 'single'" class="graph-list-mode__tabs" role="tablist" aria-label="单表查看对象">
                        <button
                          type="button"
                          role="tab"
                          class="graph-list-mode__tab"
                          :class="{ 'is-active': listSinglePane === 'nodes' }"
                          :aria-selected="listSinglePane === 'nodes' ? 'true' : 'false'"
                          @click="listSinglePane = 'nodes'"
                        >节点</button>
                        <button
                          type="button"
                          role="tab"
                          class="graph-list-mode__tab"
                          :class="{ 'is-active': listSinglePane === 'edges' }"
                          :aria-selected="listSinglePane === 'edges' ? 'true' : 'false'"
                          @click="listSinglePane = 'edges'"
                        >关系</button>
                      </div>
                      <div class="graph-list-mode__grid" :class="'is-' + listDisplayMode">
                        <section v-show="listDisplayMode === 'split' || listSinglePane === 'nodes'" class="graph-list-panel graph-list-panel--nodes">
                          <div class="graph-list-panel__head">
                            <div>
                              <h3>{{ listNodeTitle }}</h3>
                              <p>{{ listNodeSummary }}</p>
                            </div>
                          </div>
                          <a-table
                            size="small"
                            class="graph-list-table"
                            :columns="nodeColumns"
                            :data-source="nodeRows"
                            :pagination="false"
                            :row-class-name="nodeRowClassName"
                            :scroll="{ y: 520 }"
                            @change="onNodeTableChange"
                            @customFilterDropdownVisibleChange="onListColumnFilterVisibleChange"
                            @row="nodeRow"
                          >
                            <template #customFilterDropdown="{ confirm, clearFilters, column }">
                              <div
                                v-if="column && column.__filterTarget"
                                class="graph-list-column-filter"
                                @click.stop
                              >
                                <p class="graph-list-column-filter__hint">与高级筛选共用条件，确定后同步画布与列表。</p>
                                <a-select
                                  v-model:value="listColumnFilterDraft.operator"
                                  size="small"
                                  class="graph-list-column-filter__operator"
                                  :options="filterOperatorOptions"
                                />
                                <a-input
                                  v-model:value="listColumnFilterDraft.value"
                                  size="small"
                                  allow-clear
                                  class="graph-list-column-filter__value"
                                  placeholder="输入筛选值"
                                  @pressEnter="applyListColumnFilter(confirm)"
                                />
                                <div class="graph-list-column-filter__actions">
                                  <a-button size="small" type="link" @click="clearListColumnFilter(clearFilters)">重置</a-button>
                                  <a-button size="small" type="primary" @click="applyListColumnFilter(confirm)">确定</a-button>
                                </div>
                              </div>
                            </template>
                          </a-table>
                        </section>
                        <section v-show="listDisplayMode === 'split' || listSinglePane === 'edges'" class="graph-list-panel graph-list-panel--edges">
                          <div class="graph-list-panel__head">
                            <div>
                              <h3>{{ listEdgeTitle }}</h3>
                              <p>{{ listEdgeSummary }}</p>
                            </div>
                          </div>
                          <a-table
                            size="small"
                            class="graph-list-table"
                            :columns="edgeColumns"
                            :data-source="edgeRows"
                            :pagination="false"
                            :row-class-name="edgeRowClassName"
                            :scroll="{ y: 520 }"
                            @change="onEdgeTableChange"
                            @customFilterDropdownVisibleChange="onListColumnFilterVisibleChange"
                            @row="edgeRow"
                          >
                            <template #customFilterDropdown="{ confirm, clearFilters, column }">
                              <div
                                v-if="column && column.__filterTarget"
                                class="graph-list-column-filter"
                                @click.stop
                              >
                                <p class="graph-list-column-filter__hint">与高级筛选共用条件，确定后同步画布与列表。</p>
                                <a-select
                                  v-model:value="listColumnFilterDraft.operator"
                                  size="small"
                                  class="graph-list-column-filter__operator"
                                  :options="filterOperatorOptions"
                                />
                                <a-input
                                  v-model:value="listColumnFilterDraft.value"
                                  size="small"
                                  allow-clear
                                  class="graph-list-column-filter__value"
                                  placeholder="输入筛选值"
                                  @pressEnter="applyListColumnFilter(confirm)"
                                />
                                <div class="graph-list-column-filter__actions">
                                  <a-button size="small" type="link" @click="clearListColumnFilter(clearFilters)">重置</a-button>
                                  <a-button size="small" type="primary" @click="applyListColumnFilter(confirm)">确定</a-button>
                                </div>
                              </div>
                            </template>
                          </a-table>
                        </section>
                      </div>
                    </div>
                  </section>

                  <aside
                    class="graph-canvas-flow-panel"
                    :class="{ 'is-collapsed': operationPanelCollapsed }"
                    aria-label="共用操作面板"
                    :aria-expanded="!operationPanelCollapsed"
                  >
                    <div v-if="!operationPanelCollapsed && rightPanelTabs.length" class="graph-canvas-flow-panel-head">
                      <nav class="graph-canvas-flow-panel-tab-rail" aria-label="右侧面板">
                        <div
                          v-for="tab in rightPanelTabs"
                          :key="tab.id"
                          class="graph-canvas-flow-panel-tab-wrap"
                          :class="{ 'is-active': activeRightPanelTabId === tab.id }"
                        >
                          <button
                            type="button"
                            class="graph-canvas-flow-panel-tab"
                            :class="{ 'is-active': activeRightPanelTabId === tab.id }"
                            :aria-current="activeRightPanelTabId === tab.id ? 'page' : undefined"
                            :title="tab.title"
                            @click="activateRightPanelTab(tab.id)"
                          >{{ tab.title }}</button>
                          <button
                            type="button"
                            class="graph-canvas-flow-panel-tab__close"
                            :aria-label="'关闭' + tab.title"
                            @click.stop="closeRightPanelTab(tab.id)"
                          >
                            <ds-icon name="close" aria-hidden="true" />
                          </button>
                        </div>
                      </nav>
                    </div>
                    <div class="graph-canvas-flow-panel-shell">
                      <div v-if="!operationPanelCollapsed && activeRightPanelTab" class="graph-canvas-flow-panel-main">
                        <div class="graph-canvas-inspector-body graph-canvas-flow-panel-body">
                          <template v-if="activeRightPanelTab.type === 'style'">
                            <section class="graph-canvas-inspector-section">
                              <div class="graph-canvas-inspector-section-head">
                                <div class="graph-canvas-inspector-section-title">实体样式</div>
                                <button type="button" class="graph-canvas-style-reset" @click="resetNodeStyles">重置样式</button>
                              </div>
                              <div class="graph-canvas-style-table-head" aria-hidden="true">
                                <span>颜色</span>
                                <span>实体类型</span>
                                <span>显示属性</span>
                              </div>
                              <div class="graph-canvas-style-list">
                                <div v-for="row in entityStyleRows" :key="row.type" class="graph-canvas-style-row">
                                  <label class="graph-canvas-color-picker" :aria-label="row.type + '颜色'">
                                    <input type="color" :value="row.color" @input="setNodeTypeColor(row.type, $event.target.value)" />
                                    <span class="graph-canvas-color-swatch graph-canvas-color-swatch--node" :style="{ background: row.color }"></span>
                                  </label>
                                  <span class="graph-canvas-style-row__meta">
                                    <span class="graph-canvas-style-row__name">{{ row.type }}</span>
                                  </span>
                                  <a-select
                                    size="small"
                                    class="graph-canvas-style-row__select"
                                    :value="row.labelField"
                                    :options="row.labelOptions"
                                    aria-label="实体显示字段"
                                    @change="(value) => setNodeLabelField(row.type, value)"
                                  />
                                </div>
                              </div>
                            </section>
                            <section class="graph-canvas-inspector-section">
                              <div class="graph-canvas-inspector-section-head">
                                <div class="graph-canvas-inspector-section-title">边样式</div>
                                <button type="button" class="graph-canvas-style-reset" @click="resetEdgeStyles">重置样式</button>
                              </div>
                              <div class="graph-canvas-style-table-head" aria-hidden="true">
                                <span>颜色</span>
                                <span>边类型</span>
                                <span>显示属性</span>
                              </div>
                              <div class="graph-canvas-style-list">
                                <div v-for="row in edgeStyleRows" :key="row.type" class="graph-canvas-style-row">
                                  <label class="graph-canvas-color-picker" :aria-label="row.type + '颜色'">
                                    <input type="color" :value="row.color" @input="setEdgeTypeColor(row.type, $event.target.value)" />
                                    <span class="graph-canvas-color-swatch graph-canvas-color-swatch--edge" :style="{ '--graph-style-color': row.color }"></span>
                                  </label>
                                  <span class="graph-canvas-style-row__meta">
                                    <span class="graph-canvas-style-row__name">{{ row.type }}</span>
                                  </span>
                                  <a-select
                                    size="small"
                                    class="graph-canvas-style-row__select"
                                    :value="row.labelField"
                                    :options="row.labelOptions"
                                    aria-label="关系显示字段"
                                    @change="(value) => setEdgeLabelField(row.type, value)"
                                  />
                                </div>
                              </div>
                            </section>
                          </template>
                          <template v-else-if="activeRightPanelTab.type === 'analysis-cycle'">
                            <div class="graph-analysis-panel">
                              <a-form layout="vertical" class="graph-analysis-panel__form" :colon="false">
                                <a-form-item label="环检测算法">
                                  <a-select v-model:value="graphAnalysisForm.cycleAlgo" :options="graphAnalysisCycleAlgoOptions" />
                                </a-form-item>
                                <a-form-item label="包含节点">
                                  <a-select
                                    v-model:value="graphAnalysisForm.includeNodes"
                                    mode="multiple"
                                    allow-clear
                                    placeholder="请选择包含节点"
                                    :options="graphAnalysisNodeOptions"
                                  />
                                </a-form-item>
                                <a-form-item label="最大环长度">
                                  <a-input v-model:value="graphAnalysisForm.cycleMaxLen" />
                                </a-form-item>
                                <a-form-item label="最大环长">
                                  <a-input v-model:value="graphAnalysisForm.cycleMaxLen2" />
                                </a-form-item>
                                <a-form-item label="考虑方向">
                                  <div class="graph-analysis-panel__switch-row">
                                    <span>无向</span>
                                    <a-switch v-model:checked="graphAnalysisForm.cycleUndirected" />
                                  </div>
                                </a-form-item>
                              </a-form>
                              <div class="graph-analysis-panel__footer">
                                <a-button type="primary" @click="runGraphAnalysisSearch">开始搜索</a-button>
                              </div>
                            </div>
                          </template>
                          <template v-else-if="activeRightPanelTab.type === 'analysis-node-search'">
                            <div class="graph-analysis-panel">
                              <a-form layout="vertical" class="graph-analysis-panel__form" :colon="false">
                                <a-form-item label="搜索算法">
                                  <a-select v-model:value="graphAnalysisForm.searchAlgo" :options="graphAnalysisSearchAlgoOptions" />
                                </a-form-item>
                                <a-form-item label="搜索范围">
                                  <a-select v-model:value="graphAnalysisForm.searchScope" :options="graphAnalysisSearchScopeOptions" />
                                </a-form-item>
                                <a-form-item label="搜索关键词">
                                  <a-input v-model:value="graphAnalysisForm.keyword" placeholder="请输入搜索关键词" allow-clear />
                                </a-form-item>
                              </a-form>
                              <div class="graph-analysis-panel__footer">
                                <a-button type="primary" @click="runGraphAnalysisSearch">开始搜索</a-button>
                              </div>
                              <div
                                class="graph-analysis-panel__results"
                                :class="{ 'is-empty': !graphAnalysisHasResults }"
                              >
                                <div v-if="graphAnalysisHasResults" class="graph-analysis-panel__result-list">
                                  <button
                                    v-for="node in visibleNodes.slice(0, 6)"
                                    :key="'analysis-hit-' + node.id"
                                    type="button"
                                    class="graph-analysis-panel__result-item"
                                    @click="selectNode(node)"
                                  >
                                    <span class="graph-analysis-panel__result-name">{{ node.label || node.id }}</span>
                                    <span class="graph-analysis-panel__result-meta">{{ node.type }}</span>
                                  </button>
                                </div>
                                <div v-else class="graph-analysis-panel__empty">
                                  <ds-icon name="search" class="graph-analysis-panel__empty-icon" aria-hidden="true" />
                                  <p>暂无搜索结果</p>
                                  <small>请尝试使用不同的关键词或搜索范围</small>
                                </div>
                              </div>
                            </div>
                          </template>
                          <template v-else-if="activeRightPanelTab.type === 'analysis-path-query'">
                            <div class="graph-analysis-panel">
                              <a-form layout="vertical" class="graph-analysis-panel__form" :colon="false">
                                <a-form-item label="起始节点">
                                  <a-select
                                    v-model:value="graphAnalysisForm.pathStart"
                                    allow-clear
                                    placeholder="请选择起始节点"
                                    :options="graphAnalysisNodeOptions"
                                  />
                                </a-form-item>
                                <a-form-item label="结束节点">
                                  <a-select
                                    v-model:value="graphAnalysisForm.pathEnd"
                                    allow-clear
                                    placeholder="请选择结束节点"
                                    :options="graphAnalysisNodeOptions"
                                  />
                                </a-form-item>
                                <a-form-item label="路径长度">
                                  <a-input v-model:value="graphAnalysisForm.pathLength" />
                                </a-form-item>
                                <a-form-item label="返回最大路径数量">
                                  <a-input v-model:value="graphAnalysisForm.maxPaths" />
                                </a-form-item>
                              </a-form>
                              <div class="graph-analysis-panel__footer">
                                <a-button type="primary" @click="runGraphAnalysisSearch">开始搜索</a-button>
                              </div>
                            </div>
                          </template>
                          <template v-else-if="activeRightPanelTab.type === 'chat'">
                            <div class="graph-wb-chat-embed">
                              <div class="nlm-chat-body">
                                <div ref="graphChatMessages" class="nlm-chat-messages">
                                  <div
                                    v-for="msg in graphChatMessages"
                                    :key="msg.id"
                                    class="nlm-chat-turn"
                                  >
                                    <div class="nlm-msg-row">
                                      <div class="nlm-msg-wrap">
                                        <div :class="['nlm-msg', msg.role]" v-html="renderGraphChatMessage(msg)"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="nlm-chat-input-wrap">
                                  <div class="nlm-chat-input-box">
                                    <div class="nlm-chat-input-text">
                                      <textarea
                                        v-model="graphChatInput"
                                        placeholder="输入问题，结合当前图谱上下文向 AI 助手提问；Enter 发送"
                                        rows="1"
                                        @keydown="onGraphChatInputKeydown"
                                      ></textarea>
                                    </div>
                                    <div class="nlm-chat-input-bar">
                                      <div class="nlm-chat-input-bar__right">
                                        <button
                                          type="button"
                                          class="ds-icon-btn ds-icon-btn--standard nlm-chat-send-btn"
                                          title="发送"
                                          aria-label="发送"
                                          :disabled="graphChatReplyPending || !graphChatInput.trim()"
                                          @click="sendGraphChat"
                                        >
                                          <svg class="iconpark-icon nlm-chat-send-btn__icon" aria-hidden="true"><use href="#send"></use></svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <div class="nlm-disclaimer">系统生成内容需人工核查，分析结论以人工确认为准。</div>
                                </div>
                              </div>
                            </div>
                          </template>
                          <template v-else-if="activeRightPanelTab.type === 'detail'">
                            <div v-if="selectedObject" class="graph-object-detail">
                              <div class="graph-object-detail__head">
                                <div class="graph-object-panel-title">{{ selectedObjectTitle }}</div>
                                <span class="graph-object-detail__badge">{{ selectedObjectTypeLabel }}</span>
                              </div>
                              <div class="graph-object-detail__id-row">
                                <span class="graph-object-detail__id-label">{{ selectedObjectIdLabel }}</span>
                                <span class="graph-object-detail__id-value">{{ selectedObject.id }}</span>
                              </div>
                              <section class="graph-object-detail__section">
                                <div class="graph-object-detail__section-title">属性信息</div>
                                <table v-if="selectedObjectDetailRows.length" class="graph-prop-table">
                                  <tbody>
                                    <tr v-for="row in selectedObjectDetailRows" :key="row.label">
                                      <th>{{ row.label }}</th>
                                      <td>{{ row.value }}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <a-empty v-else class="graph-object-detail__empty" description="暂无属性信息" />
                              </section>
                              <section class="graph-object-detail__section graph-object-detail__section--source">
                                <div class="graph-object-detail__section-title">关联数据</div>
                                <button type="button" class="graph-object-source-link" @click="openSourceDataModal">
                                  <span class="graph-object-source-link__url">{{ selectedObjectSourceUrl }}</span>
                                  <span class="graph-object-source-link__action">查看来源数据表</span>
                                </button>
                              </section>
                            </div>
                            <a-empty v-else description="暂无选中对象" />
                          </template>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>

              </div>
            </div>
          </main>
        </div>
        <div
          v-if="templatePickerOpen || filterDrawerOpen || layoutPickerOpen || listLayoutPickerOpen"
          class="graph-query-scope-flyout-dismiss"
          aria-hidden="true"
          @click="closeAllPopovers"
        ></div>
        <div
          v-if="templatePickerOpen"
          class="graph-query-scope-flyout"
          :style="scopeFlyoutStyle"
          role="dialog"
          :aria-label="templatePickerTitle"
          @click.stop
        >
          <header class="graph-query-scope-flyout__head">
            <strong>{{ templatePickerTitle }}</strong>
            <button type="button" class="graph-query-scope-flyout__close" aria-label="收起" @click="closeTemplatePicker">收起</button>
          </header>
          <div class="graph-query-scope-flyout__body graph-wb-query-section graph-wb-query-section--templates">
            <div class="graph-wb-query-template-tabs" role="tablist" aria-label="查询类型">
              <button
                type="button"
                role="tab"
                class="graph-wb-query-template-tab"
                :class="{ 'is-active': queryTemplateTab === 'general' }"
                :aria-selected="queryTemplateTab === 'general' ? 'true' : 'false'"
                @click="queryTemplateTab = 'general'"
              >通用查询</button>
              <button
                type="button"
                role="tab"
                class="graph-wb-query-template-tab"
                :class="{ 'is-active': queryTemplateTab === 'template' }"
                :aria-selected="queryTemplateTab === 'template' ? 'true' : 'false'"
                @click="queryTemplateTab = 'template'"
              >模板查询</button>
            </div>
            <div v-if="queryTemplateCards.length" class="graph-wb-query-template-list">
              <button
                v-for="item in queryTemplateCards"
                :key="'scope-' + item.key"
                type="button"
                class="graph-wb-query-template-card"
                @click="onScopeQueryTemplateClick(item)"
              >
                <span class="graph-wb-query-template-card__icon">
                  <svg v-if="item.iconSymbol" class="iconpark-icon" aria-hidden="true"><use :href="'#' + item.iconSymbol"></use></svg>
                  <ds-icon v-else :name="item.icon" aria-hidden="true" />
                </span>
                <span class="graph-wb-query-template-card__text">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.desc }}</small>
                </span>
              </button>
            </div>
            <a-empty v-else :description="queryTemplateEmptyText" />
          </div>
        </div>
        <div
          v-if="filterDrawerOpen && filterDrawerTarget !== 'global'"
          class="graph-query-scope-flyout graph-query-scope-flyout--filter"
          :style="scopeFlyoutStyle"
          role="dialog"
          :aria-label="filterDrawerTitle"
          @click.stop
        >
          <header class="graph-query-scope-flyout__head">
            <strong>{{ filterDrawerTitle }}</strong>
            <button type="button" class="graph-query-scope-flyout__close" aria-label="收起" @click="closeFilterDrawer">收起</button>
          </header>
          <div class="graph-query-scope-flyout__body">
            <p v-if="filterDrawerStep" class="graph-query-scope-flyout__hint">
              仅作用于「{{ filterDrawerStep.label }}」本步结果
            </p>
            <div class="graph-canvas-filter-rules">
              <div
                v-for="rule in filterDrawerRules"
                :key="rule.id"
                class="graph-canvas-filter-rule"
              >
                <a-select
                  v-model:value="rule.target"
                  size="small"
                  class="graph-canvas-filter-rule__target"
                  :options="filterTargetOptions"
                  @change="updateFilterTarget(rule)"
                />
                <a-select
                  v-model:value="rule.field"
                  size="small"
                  class="graph-canvas-filter-rule__field"
                  :options="filterFieldOptions(rule)"
                />
                <a-select
                  v-model:value="rule.operator"
                  size="small"
                  class="graph-canvas-filter-rule__operator"
                  :options="filterOperatorOptions"
                />
                <a-input
                  v-model:value="rule.value"
                  size="small"
                  allow-clear
                  class="graph-canvas-filter-rule__value"
                  placeholder="值"
                />
                <button
                  type="button"
                  class="graph-canvas-filter-rule__remove"
                  aria-label="删除过滤条件"
                  @click="removeFilterDrawerRule(rule.id)"
                ><ds-icon name="trash" aria-hidden="true" /></button>
              </div>
            </div>
            <div class="graph-canvas-filter-actions">
              <a-button size="small" @click="addFilterDrawerRule">
                <ds-icon name="plus" aria-hidden="true" />
                <span>添加条件</span>
              </a-button>
              <a-button v-if="filterDrawerRules.length" size="small" @click="resetFilterDrawerRules">
                <ds-icon name="refresh" aria-hidden="true" />
                <span>清空</span>
              </a-button>
            </div>
          </div>
        </div>
        <a-modal
          v-model:open="advancedFilterModalOpen"
          title="高级筛选"
          width="640px"
          ok-text="完成"
          cancel-text="取消"
          :destroy-on-close="false"
          @ok="confirmAdvancedFilter"
          @cancel="cancelAdvancedFilterModal"
        >
          <p class="graph-canvas-advanced-modal__hint">配置在点击「完成」后生效；与实体/关系类型筛选并列组合，互不影响。列表列筛选写入的条件会在此一并展示与编辑。</p>
          <div class="graph-canvas-filter-rules graph-canvas-filter-rules--modal">
            <div
              v-for="rule in advancedFilterDraftRules"
              :key="'adv-modal-' + rule.id"
              class="graph-canvas-filter-rule"
            >
              <a-select
                v-model:value="rule.target"
                size="small"
                class="graph-canvas-filter-rule__target"
                :options="filterTargetOptions"
                @change="updateFilterTarget(rule)"
              />
              <a-select
                v-model:value="rule.field"
                size="small"
                class="graph-canvas-filter-rule__field"
                :options="filterFieldOptions(rule)"
              />
              <a-select
                v-model:value="rule.operator"
                size="small"
                class="graph-canvas-filter-rule__operator"
                :options="filterOperatorOptions"
              />
              <a-input
                v-model:value="rule.value"
                size="small"
                allow-clear
                class="graph-canvas-filter-rule__value"
                placeholder="值"
              />
              <button
                type="button"
                class="graph-canvas-filter-rule__remove"
                aria-label="删除过滤条件"
                @click="removeAdvancedFilterDraftRule(rule.id)"
              ><ds-icon name="trash" aria-hidden="true" /></button>
            </div>
          </div>
          <div class="graph-canvas-filter-actions">
            <a-button size="small" @click="addAdvancedFilterDraftRule">
              <ds-icon name="plus" aria-hidden="true" />
              <span>添加条件</span>
            </a-button>
            <a-button v-if="advancedFilterDraftRules.length" size="small" @click="resetAdvancedFilterDraft">
              <ds-icon name="refresh" aria-hidden="true" />
              <span>清空</span>
            </a-button>
          </div>
        </a-modal>
        <a-modal
          v-model:open="renameHistoryOpen"
          title="重命名最近查询"
          width="420px"
          ok-text="保存"
          cancel-text="取消"
          :ok-button-props="{ disabled: !renameHistoryName.trim() }"
          @ok="confirmHistoryRename"
          @cancel="renameHistoryOpen = false"
        >
          <a-input
            v-model:value="renameHistoryName"
            placeholder="输入查询名称"
            maxlength="32"
            show-count
            @pressEnter="confirmHistoryRename"
          />
        </a-modal>
        <a-modal
          :open="sourceDataModalOpen"
          :title="sourceDataModalTitle"
          width="720px"
          wrap-class-name="graph-object-source-modal-wrap"
          :footer="null"
          destroyOnClose
          @cancel="sourceDataModalOpen = false"
        >
          <div class="graph-object-source-modal">
            <div class="graph-object-source-modal__url">{{ selectedObjectSourceUrl }}</div>
            <a-table
              size="small"
              :columns="sourceDataColumns"
              :data-source="selectedObjectSourceRows"
              :pagination="false"
              :scroll="{ y: 360 }"
            />
          </div>
        </a-modal>
        <div v-if="canvasContextMenu.open" class="graph-canvas-context-menu-layer">
          <div
            class="graph-canvas-context-menu-dismiss"
            aria-hidden="true"
            @click="closeCanvasContextMenu"
            @contextmenu.prevent="closeCanvasContextMenu"
          ></div>
          <div
            class="graph-canvas-node-context-menu"
            :style="{ left: canvasContextMenu.x + 'px', top: canvasContextMenu.y + 'px' }"
            role="menu"
            aria-label="节点右键菜单"
            @click.stop
            @contextmenu.prevent
          >
            <a-menu mode="vertical" class="graph-canvas-node-context-menu__menu" @click="onCanvasNodeContextMenuClick">
              <a-sub-menu key="expand" title="扩展节点" popup-class-name="graph-canvas-node-context-menu__popup">
                <a-menu-item key="expand-direct">直接扩展</a-menu-item>
                <a-menu-item key="expand-conditional">条件扩展</a-menu-item>
              </a-sub-menu>
              <a-menu-item key="hide">隐藏节点</a-menu-item>
              <a-menu-item key="delete">删除节点</a-menu-item>
              <a-menu-item key="center" :disabled="isCanvasContextCenterDisabled">设为中心节点</a-menu-item>
              <a-sub-menu key="on-graph-analysis" title="图上分析" popup-class-name="graph-canvas-node-context-menu__popup">
                <a-menu-item key="neighbors">直接邻居</a-menu-item>
                <a-menu-item key="shortest-path">最短距离</a-menu-item>
                <a-sub-menu key="cycle" title="环路识别" popup-class-name="graph-canvas-node-context-menu__popup">
                  <a-menu-item key="canvas-cycle-directed">当前图·有向环路</a-menu-item>
                  <a-menu-item key="canvas-cycle-undirected">当前图·无向环路</a-menu-item>
                </a-sub-menu>
              </a-sub-menu>
            </a-menu>
          </div>
        </div>
      </section>
    `,
  });
})();
