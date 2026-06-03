(function () {
  const VIEW_IDS = {
    DASHBOARD: 'dashboard',
    GRAPH_QUERY: 'graph-query',
    GRAPH_CANVAS: 'graph-canvas',
    GRAPH_MANAGEMENT: 'graph-management',
    SYSTEM: 'system',
  };

  const HASH_TO_VIEW = {
    dashboard: VIEW_IDS.DASHBOARD,
    'graph-query': VIEW_IDS.GRAPH_QUERY,
    query: VIEW_IDS.GRAPH_QUERY,
    home: VIEW_IDS.GRAPH_QUERY,
    'graph-canvas': VIEW_IDS.GRAPH_CANVAS,
    canvas: VIEW_IDS.GRAPH_CANVAS,
    workbench: VIEW_IDS.GRAPH_CANVAS,
    'graph-management': VIEW_IDS.GRAPH_MANAGEMENT,
    management: VIEW_IDS.GRAPH_MANAGEMENT,
    system: VIEW_IDS.SYSTEM,
  };

  function parseHash() {
    const raw = (window.location.hash || '#graph-query').slice(1);
    const [path, query = ''] = raw.split('?');
    const params = new URLSearchParams(query);
    return { path: path || 'graph-query', view: HASH_TO_VIEW[path] || VIEW_IDS.GRAPH_QUERY, params };
  }

  function setHash(view, params) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    window.location.hash = view + query;
  }

  function compactNumber(n) {
    if (typeof n !== 'number') return '-';
    if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return Math.round(n / 10000) + '万';
    return String(n);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  const F = globalThis.DS_FOUNDATION || {};
  window.DGP_RUNTIME = {
    VIEW_IDS,
    parseHash,
    setHash,
    compactNumber,
    clone,
    APP_THEME: {
      token: Object.assign({}, F.DS_ANTD_THEME_TOKEN || {}),
      components: Object.assign({}, F.DS_ANTD_THEME_COMPONENTS || {}),
    },
  };
})();
