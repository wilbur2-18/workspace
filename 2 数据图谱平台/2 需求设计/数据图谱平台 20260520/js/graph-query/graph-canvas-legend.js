(function () {
  const app = window.__DGP_COMPONENT_APP;
  const visual = () => window.DGP_GRAPH_VISUAL;

  app.component('GraphCanvasLegend', {
    props: {
      nodes: { type: Array, default: () => [] },
      edges: { type: Array, default: () => [] },
      hiddenNodeTypes: { type: Array, default: () => [] },
      hiddenEdgeTypes: { type: Array, default: () => [] },
      selectedNode: { type: Object, default: null },
      nodeColorMap: { type: Object, default: () => ({}) },
      edgeColorMap: { type: Object, default: () => ({}) },
    },
    emits: ['toggle-node-type', 'toggle-edge-type', 'clear-selection', 'node-action'],
    computed: {
      nodeItems() {
        const v = visual();
        if (!v) return [];
        const counts = new Map();
        this.nodes.forEach((n) => {
          const type = n.type || '未分类实体';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return v.nodeLegendItems(this.nodes).map((item) => ({
          ...item,
          count: counts.get(item.type) || 0,
          hidden: this.hiddenNodeTypes.includes(item.type),
          color: this.nodeColorMap[item.type] || item.color,
        }));
      },
      edgeItems() {
        const v = visual();
        if (!v) return [];
        const counts = new Map();
        this.edges.forEach((e) => {
          const type = e.type || '未分类关系';
          counts.set(type, (counts.get(type) || 0) + 1);
        });
        return v.edgeLegendItems(this.edges).map((item) => ({
          ...item,
          count: counts.get(item.type) || 0,
          hidden: this.hiddenEdgeTypes.includes(item.type),
          color: this.edgeColorMap[item.type] || item.color,
        }));
      },
      selectedNodeColor() {
        const v = visual();
        const type = this.selectedNode?.type || '未分类实体';
        return this.nodeColorMap[type] || (v ? v.getNodeColor(type) : '');
      },
    },
    methods: {
      onCycleMenuClick({ key }) {
        if (key === 'canvas-cycle-directed' || key === 'canvas-cycle-undirected') {
          this.$emit('node-action', key);
        }
      },
    },
    template: `
      <div
        class="graph-canvas-bottom-bar"
        :class="selectedNode ? 'is-node-actions' : 'is-filter'"
        :aria-label="selectedNode ? '当前节点操作' : '图谱过滤图例'"
      >
        <template v-if="selectedNode">
          <div class="graph-canvas-node-action-summary">
            <span class="graph-canvas-node-action-summary__dot" :style="{ background: selectedNodeColor }"></span>
            <span class="graph-canvas-node-action-summary__main">
              <strong>{{ selectedNode.label || selectedNode.id }}</strong>
              <small>{{ selectedNode.type || '实体' }}</small>
            </span>
          </div>
          <div class="graph-canvas-node-action-list" role="toolbar" aria-label="节点常用操作">
            <a-button size="small" @click="$emit('node-action', 'detail')">
              <template #icon><ds-icon name="circle-info" aria-hidden="true" /></template>
              详情
            </a-button>
            <a-button size="small" @click="$emit('node-action', 'neighbors')">
              <template #icon><ds-icon name="diagram-project" aria-hidden="true" /></template>
              直接邻居
            </a-button>
            <a-button size="small" @click="$emit('node-action', 'shortest-path')">
              <template #icon><ds-icon name="bullseye" aria-hidden="true" /></template>
              最短路径
            </a-button>
            <a-dropdown :trigger="['click']" placement="top">
              <a-button size="small">
                <template #icon><ds-icon name="share-nodes" aria-hidden="true" /></template>
                环路识别
                <ds-icon name="chevron-down" aria-hidden="true" />
              </a-button>
              <template #overlay>
                <a-menu @click="onCycleMenuClick">
                  <a-menu-item key="canvas-cycle-directed">当前图·有向环路</a-menu-item>
                  <a-menu-item key="canvas-cycle-undirected">当前图·无向环路</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button size="small" @click="$emit('node-action', 'expand')">
              <template #icon><ds-icon name="plus" aria-hidden="true" /></template>
              展开一跳
            </a-button>
            <a-button size="small" @click="$emit('node-action', 'hide')">
              <template #icon><ds-icon name="eye" aria-hidden="true" /></template>
              隐藏
            </a-button>
            <a-button size="small" @click="$emit('node-action', 'center')">
              <template #icon><ds-icon name="bullseye" aria-hidden="true" /></template>
              设为中心
            </a-button>
          </div>
          <a-button type="text" size="small" class="graph-canvas-bottom-bar__close" title="取消选中" @click="$emit('clear-selection')">
            <ds-icon name="close" aria-hidden="true" />
          </a-button>
        </template>
        <template v-else>
          <div class="graph-canvas-filter-group">
            <span class="graph-canvas-filter-group__title">实体</span>
            <button
              v-for="item in nodeItems"
              :key="item.type"
              type="button"
              class="graph-canvas-filter-chip"
              :class="{ 'is-muted': item.hidden }"
              :aria-pressed="item.hidden ? 'false' : 'true'"
              @click="$emit('toggle-node-type', item.type)"
            >
              <span class="graph-canvas-filter-chip__dot" :style="{ background: item.color }"></span>
              <span>{{ item.type }}</span>
              <em>{{ item.count }}</em>
            </button>
          </div>
          <div class="graph-canvas-filter-group">
            <span class="graph-canvas-filter-group__title">关系</span>
            <button
              v-for="item in edgeItems"
              :key="item.type"
              type="button"
              class="graph-canvas-filter-chip graph-canvas-filter-chip--edge"
              :class="{ 'is-muted': item.hidden }"
              :aria-pressed="item.hidden ? 'false' : 'true'"
              @click="$emit('toggle-edge-type', item.type)"
            >
              <span class="graph-canvas-filter-chip__line" :style="{ '--legend-edge-color': item.color }"></span>
              <span>{{ item.type }}</span>
              <em>{{ item.count }}</em>
            </button>
          </div>
        </template>
      </div>
    `,
  });
})();
