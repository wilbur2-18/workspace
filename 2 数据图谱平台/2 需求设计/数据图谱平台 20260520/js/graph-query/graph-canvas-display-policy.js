/**
 * 图谱画布展示策略（大规模节点/边的行业通用做法：渐进披露，而非全量铺满标签）
 *
 * 参考：Gephi / yFiles / Neo4j Bloom / Graphistry 等产品的共性：
 * - 默认「关系结构优先」：边线表达关联，节点用颜色/大小区分类型
 * - 标签默认显示：节点名称和关系名称默认铺开；显示属性决定名称取自哪个字段
 * - 超过可读阈值时依赖缩放与聚焦，而非在同一屏显示全部文字
 */
(function () {
  function buildAdj(edges, undirected) {
    const adj = new Map();
    edges.forEach((e) => {
      if (!adj.has(e.from)) adj.set(e.from, new Set());
      if (!adj.has(e.to)) adj.set(e.to, new Set());
      adj.get(e.from).add(e.to);
      if (undirected) {
        if (!adj.has(e.to)) adj.set(e.to, new Set());
        adj.get(e.to).add(e.from);
      }
    });
    return adj;
  }

  function hopsFrom(adj, startId, maxHop) {
    const map = new Map();
    if (!startId || !adj.has(startId)) return map;
    const queue = [[startId, 0]];
    map.set(startId, 0);
    while (queue.length) {
      const [id, d] = queue.shift();
      if (maxHop != null && d >= maxHop) continue;
      (adj.get(id) || new Set()).forEach((next) => {
        if (!map.has(next)) {
          map.set(next, d + 1);
          queue.push([next, d + 1]);
        }
      });
    }
    return map;
  }

  const DISPLAY_LEGEND = [
    { key: 'default', label: '默认：显示节点名称与关系名称' },
    { key: 'focus', label: '选中节点/关系：高亮当前对象' },
    { key: 'hover', label: '悬停节点/关系：查看完整属性信息' },
    { key: 'field', label: '显示属性：决定名称取自哪个字段' },
  ];

  function createContext({ nodes, edges, centerNodeId, selectedId, selectedType }) {
    const adj = buildAdj(edges, true);
    const nodeCount = nodes.length;
    const smallGraph = nodeCount <= 45;
    return {
      nodeCount,
      smallGraph,
      centerNodeId: centerNodeId || '',
      selectedId: selectedType === 'node' ? selectedId : '',
      selectedEdgeId: selectedType === 'edge' ? selectedId : '',
      hopCenter: hopsFrom(adj, centerNodeId, smallGraph ? 99 : 1),
      hopSelected: hopsFrom(adj, selectedType === 'node' ? selectedId : '', 1),
    };
  }

  function nodeLabelMode(nodeId, ctx) {
    if (!nodeId) return 'hidden';
    return 'full';
  }

  function showEdgeLabel(edge, ctx) {
    return true;
  }

  function edgeLineOpacity(edge, ctx, onPath) {
    if (ctx.smallGraph) return onPath ? 0.95 : 0.72;
    if (edge.id === ctx.selectedEdgeId) return 1;
    if (onPath) return 0.88;
    if (ctx.selectedId && (edge.from === ctx.selectedId || edge.to === ctx.selectedId)) return 0.82;
    return 0.22;
  }

  function edgeLineWidth(edge, ctx, onPath, selected) {
    if (selected) return 2;
    return 1.2;
  }

  window.DGP_GRAPH_DISPLAY = {
    DISPLAY_LEGEND,
    createContext,
    nodeLabelMode,
    showEdgeLabel,
    edgeLineOpacity,
    edgeLineWidth,
  };
})();
