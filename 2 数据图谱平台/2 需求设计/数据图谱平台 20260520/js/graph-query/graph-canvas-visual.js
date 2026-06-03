/**
 * 图谱画布视觉约定（节点/边颜色与图例），供 chart 与 legend 共用
 */
(function () {
  function cssVar(name, fallback) {
    if (typeof document === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  const NODE_TYPE_ORDER = ['人员', '企业', '机动车', '行政事业单位', '电话'];

  const NODE_TYPE_COLORS = {
    人员: () => cssVar('--ds-c-primary', '#2f6fbb'),
    企业: () => cssVar('--ds-c-warning', '#c98a1a'),
    机动车: () => cssVar('--ds-c-success', '#3d8b72'),
    行政事业单位: () => cssVar('--ds-c-info', '#3a7ca5'),
    电话: () => cssVar('--ds-tone-purple-fg', '#7d57c2'),
  };

  function getNodeColor(type) {
    const pick = NODE_TYPE_COLORS[type];
    return pick ? pick() : cssVar('--ds-c-primary', '#2f6fbb');
  }

  const EDGE_LEGEND = [];

  const EDGE_TYPE_ORDER = ['财政供养', '人员关系', '拥有车辆', '企业核心人员', '法人股东', '缴纳社保', '开发票', '用有电话', '国库支付'];

  const EDGE_TYPE_COLORS = {
    财政供养: () => cssVar('--ds-c-info', '#3a7ca5'),
    人员关系: () => cssVar('--ds-c-primary', '#2f6fbb'),
    拥有车辆: () => cssVar('--ds-c-success', '#3d8b72'),
    企业核心人员: () => cssVar('--ds-c-warning', '#c98a1a'),
    法人股东: () => cssVar('--ds-c-danger', '#cf3b27'),
    缴纳社保: () => '#5a9e8f',
    开发票: () => cssVar('--ds-tone-purple-fg', '#7d57c2'),
    用有电话: () => cssVar('--ds-text-2', '#5d6b73'),
    国库支付: () => cssVar('--ds-c-danger', '#cf3b27'),
  };

  function getEdgeColor(type) {
    const pick = EDGE_TYPE_COLORS[type];
    return pick ? pick() : cssVar('--ds-c-danger', '#cf3b27');
  }

  const NODE_MARKERS = [
    { key: 'center', label: '查询中心 / 被审计主体', style: 'node-center' },
  ];

  function nodeLegendItems(nodes) {
    const types = [];
    const seen = new Set();
    NODE_TYPE_ORDER.forEach((type) => {
      if (nodes.some((n) => n.type === type) && !seen.has(type)) {
        seen.add(type);
        types.push({ type, color: getNodeColor(type) });
      }
    });
    nodes.forEach((n) => {
      if (n.type && !seen.has(n.type)) {
        seen.add(n.type);
        types.push({ type: n.type, color: getNodeColor(n.type) });
      }
    });
    return types;
  }

  function edgeLegendItems(edges) {
    const types = [];
    const seen = new Set();
    EDGE_TYPE_ORDER.forEach((type) => {
      if (edges.some((e) => e.type === type) && !seen.has(type)) {
        seen.add(type);
        types.push({ type, color: getEdgeColor(type) });
      }
    });
    edges.forEach((e) => {
      if (e.type && !seen.has(e.type)) {
        seen.add(e.type);
        types.push({ type: e.type, color: getEdgeColor(e.type) });
      }
    });
    return types;
  }

  window.DGP_GRAPH_VISUAL = {
    NODE_TYPE_ORDER,
    EDGE_TYPE_ORDER,
    getNodeColor,
    getEdgeColor,
    nodeLegendItems,
    edgeLegendItems,
    EDGE_LEGEND,
    NODE_MARKERS,
    cssVar,
  };
})();
