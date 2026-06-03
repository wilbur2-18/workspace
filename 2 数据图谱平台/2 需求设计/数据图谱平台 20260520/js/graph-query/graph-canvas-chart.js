(function () {
  const app = window.__DGP_COMPONENT_APP;
  const layoutEngine = () => window.DGP_GRAPH_LAYOUT;
  const displayPolicy = () => window.DGP_GRAPH_DISPLAY;

  function cssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  function nodeColor(type) {
    const visual = window.DGP_GRAPH_VISUAL;
    if (visual) return visual.getNodeColor(type);
    return cssVar('--ds-c-primary', '#2f6fbb');
  }

  function edgeColor(type) {
    const visual = window.DGP_GRAPH_VISUAL;
    if (visual) return visual.getEdgeColor(type);
    return cssVar('--ds-c-danger', '#cf3b27');
  }

  app.component('GraphCanvasChart', {
    props: {
      nodes: { type: Array, default: () => [] },
      edges: { type: Array, default: () => [] },
      selectedId: { type: String, default: '' },
      selectedType: { type: String, default: 'node' },
      layoutMode: { type: String, default: 'radial' },
      layoutMeta: { type: Object, default: () => ({}) },
      centerNodeId: { type: String, default: '' },
      treeRootId: { type: String, default: '' },
      pathNodeIds: { type: Array, default: () => [] },
      nodeColorMap: { type: Object, default: () => ({}) },
      edgeColorMap: { type: Object, default: () => ({}) },
      nodeLabelFields: { type: Object, default: () => ({}) },
      edgeLabelFields: { type: Object, default: () => ({}) },
    },
    emits: ['select-node', 'select-edge', 'click-canvas', 'contextmenu-node', 'contextmenu-edge', 'contextmenu-canvas'],
    data() {
      return {
        chart: null,
        minimapChart: null,
        resizeObserver: null,
        minimapResizeObserver: null,
        graphElementClicked: false,
      };
    },
    mounted() {
      this.initChart();
      this.bindResize();
    },
    beforeUnmount() {
      this.unbindResize();
      this.unbindMinimapResize();
      this.disposeMinimap();
      if (this.chart) {
        this.chart.dispose();
        this.chart = null;
      }
    },
    watch: {
      nodes: { deep: true, handler() { this.renderChart(true); this.renderMinimap(); } },
      edges: { deep: true, handler() { this.renderChart(true); this.renderMinimap(); } },
      selectedId() { this.renderChart(false); },
      selectedType() { this.renderChart(false); },
      layoutMode() { this.renderChart(true); },
      layoutMeta: { deep: true, handler() { this.renderChart(true); } },
      centerNodeId() { this.renderChart(true); },
      nodeColorMap: { deep: true, handler() { this.renderChart(false); } },
      edgeColorMap: { deep: true, handler() { this.renderChart(false); } },
      nodeLabelFields: { deep: true, handler() { this.renderChart(false); } },
      edgeLabelFields: { deep: true, handler() { this.renderChart(false); } },
    },
    methods: {
      bindResize() {
        if (!this.$refs.host || typeof ResizeObserver === 'undefined') return;
        let resizeTimer = null;
        this.resizeObserver = new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (this.chart) {
              this.chart.resize();
            }
          }, 80);
        });
        this.resizeObserver.observe(this.$refs.host);
      },
      unbindResize() {
        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
          this.resizeObserver = null;
        }
      },
      initChart() {
        if (!window.echarts || !this.$refs.host) return;
        this.chart = window.echarts.init(this.$refs.host);
        this.chart.on('click', (params) => {
          if (params.dataType === 'node') {
            this.markGraphElementClicked();
            const node = this.nodes.find((n) => n.id === params.data.id);
            if (node) this.$emit('select-node', node);
            return;
          }
          if (params.dataType === 'edge') {
            this.markGraphElementClicked();
            const edge = this.edges.find((e) => e.id === params.data.id);
            if (edge) this.$emit('select-edge', edge);
          }
        });
        this.chart.getZr().on('click', (event) => {
          if (!event.target) this.$emit('click-canvas');
        });
        this.chart.on('contextmenu', (params) => {
          const ev = params.event?.event;
          if (ev) ev.preventDefault();
          if (params.dataType === 'node') {
            const node = this.nodes.find((n) => n.id === params.data.id);
            if (node) this.$emit('contextmenu-node', { node, nativeEvent: ev });
            return;
          }
          if (params.dataType === 'edge') {
            const edge = this.edges.find((e) => e.id === params.data.id);
            if (edge) this.$emit('contextmenu-edge', { edge, nativeEvent: ev });
            return;
          }
          this.$emit('contextmenu-canvas', { nativeEvent: ev });
        });
        this.renderChart();
      },
      markGraphElementClicked() {
        this.graphElementClicked = true;
        window.setTimeout(() => {
          this.graphElementClicked = false;
        }, 0);
      },
      onHostClick() {
        if (this.graphElementClicked) return;
        this.$emit('click-canvas');
      },
      getPlotSize() {
        const host = this.$refs.host;
        const width = host?.clientWidth || 640;
        const height = host?.clientHeight || 430;
        const padX = 56;
        const padY = 48;
        return {
          width,
          height,
          plotWidth: Math.max(width - padX * 2, 220),
          plotHeight: Math.max(height - padY * 2, 180),
          padX,
          padY,
        };
      },
      resolvePositions(plot) {
        const engine = layoutEngine();
        if (!engine) return new Map();
        return engine.compute(this.layoutMode, this.nodes, this.edges, plot, {
          centerNodeId: this.centerNodeId,
          treeRootId: this.treeRootId,
          pathNodeIds: this.pathNodeIds,
          layoutMeta: this.layoutMeta || {},
        });
      },
      nodeDisplayText(node) {
        const field = this.nodeLabelFields[node.type || '未分类实体'] || 'label';
        if (field === 'id') return node.id;
        if (field === 'type') return node.type || '实体';
        if (field === 'label') return node.label || node.id;
        return node.props?.[field] || node.label || node.id;
      },
      edgeDisplayText(edge) {
        const field = this.edgeLabelFields[edge.type || '未分类关系'] || 'type';
        if (field === 'id') return edge.id;
        if (field === 'amount') return edge.amount || '-';
        if (field === 'type') return edge.type || '关系';
        return edge.props?.[field] || edge.type || edge.id;
      },
      buildOption() {
        const text1 = cssVar('--ds-text-1', '#1a2b33');
        const text2 = cssVar('--ds-text-2', '#5d6b73');
        const danger = cssVar('--ds-c-danger', '#cf3b27');
        const primary = cssVar('--ds-c-primary', '#2f6fbb');
        const plot = this.getPlotSize();
        const positions = this.resolvePositions(plot);
        const policy = displayPolicy();
        const ctx = policy
          ? policy.createContext({
            nodes: this.nodes,
            edges: this.edges,
            centerNodeId: this.centerNodeId,
            selectedId: this.selectedId,
            selectedType: this.selectedType,
          })
          : null;

        const data = this.nodes.map((n) => {
          const selected = this.selectedType === 'node' && this.selectedId === n.id;
          const color = this.nodeColorMap[n.type || '未分类实体'] || nodeColor(n.type);
          const point = positions.get(n.id);
          const isCenter = n.id === this.centerNodeId;
          const labelMode = ctx ? policy.nodeLabelMode(n.id, ctx) : 'full';
          const displayText = this.nodeDisplayText(n);
          return {
            id: n.id,
            name: displayText,
            value: n.type,
            symbolSize: Math.max(20, Math.round((n.size || 24) * (isCenter ? 1.15 : 0.9))),
            ...(point ? { x: point.x, y: point.y } : {}),
            itemStyle: {
              color,
              borderColor: selected ? primary : cssVar('--ds-bg-container', '#ffffff'),
              borderWidth: selected ? 4 : isCenter ? 3 : 2,
              shadowBlur: selected || isCenter ? 12 : 0,
              shadowColor: selected || isCenter ? 'rgba(47, 111, 187, 0.25)' : 'transparent',
            },
            label: {
              show: labelMode === 'full',
              position: 'bottom',
              distance: 10,
              color: text1,
              fontSize: isCenter ? 13 : 11,
              fontWeight: selected || isCenter ? 600 : 400,
              lineHeight: 16,
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 12,
                fontWeight: 600,
              },
            },
          };
        });

        const pathSet = new Set(this.pathNodeIds || []);
        const links = this.edges.map((e) => {
          const selected = this.selectedType === 'edge' && this.selectedId === e.id;
          const onPath = pathSet.has(e.from) && pathSet.has(e.to);
          const showEdge = ctx ? policy.showEdgeLabel(e, ctx) : selected || onPath;
          const baseOpacity = ctx ? policy.edgeLineOpacity(e, ctx, onPath) : (selected ? 1 : 0.78);
          const opacity = this.layoutMode === 'grid' && !selected && !onPath ? Math.min(baseOpacity, 0.22) : baseOpacity;
          const baseWidth = ctx ? policy.edgeLineWidth(e, ctx, onPath, selected) : (selected ? 3 : 1.2);
          const width = baseWidth;
          const displayText = this.edgeDisplayText(e);
          return {
            id: e.id,
            source: e.from,
            target: e.to,
            value: e.type,
            lineStyle: {
              color: selected ? primary : onPath ? cssVar('--ds-c-warning', '#c98a1a') : this.edgeColorMap[e.type || '未分类关系'] || edgeColor(e.type) || danger,
              width,
              opacity,
            },
            label: {
              show: showEdge,
              formatter: displayText,
              color: text2,
              fontSize: 10,
              distance: 6,
              backgroundColor: cssVar('--ds-bg-container', '#ffffff'),
              padding: [2, 4],
              borderRadius: 4,
            },
            emphasis: {
              label: { show: true },
              lineStyle: { width: 3, opacity: 1 },
            },
          };
        });

        return {
          backgroundColor: 'transparent',
          animation: false,
          animationDuration: 0,
          animationDurationUpdate: 0,
          tooltip: {
            trigger: 'item',
            confine: true,
            borderWidth: 1,
            borderColor: cssVar('--ds-border-subtle', '#e6ecef'),
            backgroundColor: cssVar('--ds-bg-container', '#ffffff'),
            textStyle: { color: text1, fontSize: 12 },
            formatter: (params) => {
              if (params.dataType === 'edge') {
                const fromNode = this.nodes.find((n) => n.id === params.data.source);
                const toNode = this.nodes.find((n) => n.id === params.data.target);
                return `${params.data.value || '关系'}<br/>${fromNode?.label || params.data.source} → ${toNode?.label || params.data.target}`;
              }
              if (params.dataType === 'node') {
                return `${params.name || params.data.id}<br/>${params.data.value || ''}`;
              }
              return '';
            },
          },
          series: [
            {
              type: 'graph',
              layout: 'none',
              data,
              links,
              roam: true,
              scaleLimit: { min: 0.15, max: 4 },
              draggable: true,
              focusNodeAdjacency: true,
              edgeSymbol: ['none', 'arrow'],
              edgeSymbolSize: 8,
              emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 3, opacity: 1 },
              },
            },
          ],
        };
      },
      renderChart(reset) {
        if (!this.chart) return;
        if (!this.nodes.length) {
          this.chart.clear();
          return;
        }
        const shouldReset = reset !== false;
        this.chart.setOption(this.buildOption(), { notMerge: shouldReset });
        if (shouldReset) {
          this.chart.resize();
        }
      },
      getRoamOrigin() {
        const host = this.$refs.host;
        return {
          originX: (host?.clientWidth || 0) / 2,
          originY: (host?.clientHeight || 0) / 2,
        };
      },
      graphRoam(zoom) {
        if (!this.chart) return;
        const { originX, originY } = this.getRoamOrigin();
        this.chart.dispatchAction({
          type: 'graphRoam',
          seriesIndex: 0,
          zoom,
          originX,
          originY,
        });
      },
      zoomIn() {
        this.graphRoam(1.2);
      },
      zoomOut() {
        this.graphRoam(1 / 1.2);
      },
      resetView() {
        if (!this.chart) return;
        this.renderChart(true);
      },
      focusCenter() {
        this.resetView();
      },
      buildMinimapOption() {
        const option = this.buildOption();
        const series = option.series?.[0];
        if (!series) return option;
        series.roam = true;
        series.draggable = false;
        series.focusNodeAdjacency = false;
        series.data = (series.data || []).map((item) => ({
          ...item,
          symbolSize: Math.max(4, Math.round((item.symbolSize || 12) * 0.32)),
          label: { show: false },
        }));
        series.links = (series.links || []).map((item) => ({
          ...item,
          lineStyle: {
            ...(item.lineStyle || {}),
            width: 1,
            opacity: 0.45,
          },
          label: { show: false },
        }));
        return {
          ...option,
          tooltip: { show: false },
          animation: false,
        };
      },
      bindMinimapResize(host) {
        this.unbindMinimapResize();
        if (!host || typeof ResizeObserver === 'undefined') return;
        this.minimapResizeObserver = new ResizeObserver(() => {
          if (this.minimapChart) this.minimapChart.resize();
        });
        this.minimapResizeObserver.observe(host);
      },
      unbindMinimapResize() {
        if (this.minimapResizeObserver) {
          this.minimapResizeObserver.disconnect();
          this.minimapResizeObserver = null;
        }
      },
      mountMinimap(host) {
        if (!window.echarts || !host) return;
        if (!this.minimapChart) {
          this.minimapChart = window.echarts.init(host);
        }
        this.bindMinimapResize(host);
        this.renderMinimap();
      },
      renderMinimap() {
        if (!this.minimapChart) return;
        if (!this.nodes.length) {
          this.minimapChart.clear();
          return;
        }
        this.minimapChart.setOption(this.buildMinimapOption(), { notMerge: true });
        this.minimapChart.resize();
      },
      disposeMinimap() {
        this.unbindMinimapResize();
        if (this.minimapChart) {
          this.minimapChart.dispose();
          this.minimapChart = null;
        }
      },
    },
    template: `
      <div ref="host" class="graph-canvas-chart" role="img" aria-label="图谱画布" @click="onHostClick"></div>
    `,
  });
})();
