/**
 * 审计场景：100 实体 × 5 类关系 多层关联图谱（确定性生成，可复现）
 */
(function () {
  const REL = {
    EMPLOY: '任职关系',
    INVEST: '投资控股',
    FUND: '资金往来',
    TRADE: '交易关系',
    COLLEAGUE: '同事关系',
  };

  const ENTITY_TYPES = ['人员', '企业', '账户', '项目', '凭证'];

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function rand() {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rand, list) {
    return list[Math.floor(rand() * list.length)];
  }

  function addEdge(edges, set, from, to, type, extra) {
    const key = `${from}->${to}:${type}`;
    if (from === to || set.has(key)) return;
    set.add(key);
    edges.push({
      id: `e${edges.length + 1}`,
      from,
      to,
      type,
      amount: extra?.amount || '-',
      amountValue: extra?.amountValue || Number.parseFloat(String(extra?.amount || '').replace(/[^\d.]/g, '')) || 0,
      directed: extra?.directed !== false,
      weight: extra?.weight || (type === REL.FUND ? 2 : type === REL.TRADE ? 1.4 : 1),
      pathKey: extra?.pathKey || '',
      props: { 类型: type, 来源: extra?.source || '模拟审计数据' },
    });
  }

  function buildAuditScenarioGraph() {
    const rand = mulberry32(20260520);
    const nodes = [];
    const edges = [];
    const edgeKeys = new Set();

    const CENTER_ID = 'ent-audit-root';
    const pathNodeIds = [];

    nodes.push({
      id: CENTER_ID,
      label: '浙江恒达建设集团有限公司',
      type: '企业',
      size: 40,
      layer: 0,
      props: {
        统一社会信用代码: '91330000MA27XXXX01',
        角色: '被审计主体',
        风险等级: '重点',
      },
    });

    let p = 0;
    let c = 0;
    let a = 0;
    let j = 0;
    let v = 0;

    const person = (label, extra) => {
      const id = `per-${++p}`;
      nodes.push({
        id,
        label,
        type: '人员',
        size: 22 + Math.floor(rand() * 8),
        layer: extra?.layer,
        props: { 职务: extra?.title || '职员', 所属单位: extra?.org || '—' },
      });
      return id;
    };

    const company = (label, extra) => {
      const id = `ent-${++c}`;
      nodes.push({
        id,
        label,
        type: '企业',
        size: 24 + Math.floor(rand() * 10),
        layer: extra?.layer,
        props: { 行业: extra?.industry || '建筑施工', 地区: extra?.region || '浙江' },
      });
      return id;
    };

    const account = (label, extra) => {
      const id = `acc-${++a}`;
      nodes.push({
        id,
        label,
        type: '账户',
        size: 20 + Math.floor(rand() * 6),
        layer: extra?.layer,
        props: { 开户行: extra?.bank || '建设银行杭州分行', 币种: 'CNY' },
      });
      return id;
    };

    const project = (label) => {
      const id = `prj-${++j}`;
      nodes.push({ id, label, type: '项目', size: 22, props: { 项目年度: '2025', 预算: '2.3亿' } });
      return id;
    };

    const voucher = (label) => {
      const id = `vou-${++v}`;
      nodes.push({ id, label, type: '凭证', size: 18, props: { 凭证号: label.replace('凭证#', '') } });
      return id;
    };

    /* —— 层1：被审计主体直属（任职 / 控股 / 账户） —— */
    const execIds = [];
    const execNames = ['周建国', '林晓梅', '陈浩', '赵立新', '孙婷', '王磊', '李芳'];
    execNames.forEach((name, i) => {
      const pid = person(name, { title: i === 0 ? '法定代表人' : '高管', org: '恒达建设' });
      execIds.push(pid);
      addEdge(edges, edgeKeys, pid, CENTER_ID, REL.EMPLOY, { source: '工商任职' });
    });

    const subIds = [];
    for (let i = 0; i < 6; i += 1) {
      const sid = company(`恒达系子公司${i + 1}`, { industry: '工程分包' });
      subIds.push(sid);
      addEdge(edges, edgeKeys, CENTER_ID, sid, REL.INVEST, { amount: `${(rand() * 40 + 10).toFixed(0)}%` });
    }

    const rootAccounts = [];
    for (let i = 0; i < 4; i += 1) {
      const aid = account(`恒达基本户-${i + 1}`, { bank: '工商银行' });
      rootAccounts.push(aid);
      addEdge(edges, edgeKeys, CENTER_ID, aid, REL.FUND, { source: '银行流水' });
    }

    /* —— 层2：项目与资金链 —— */
    const projectIds = [];
    for (let i = 0; i < 10; i += 1) {
      const pr = project(`市政水利项目-${String(i + 1).padStart(2, '0')}`);
      projectIds.push(pr);
      addEdge(edges, edgeKeys, CENTER_ID, pr, REL.TRADE, { source: '项目台账' });
      const prAcc = account(`项目专户-${i + 1}`);
      addEdge(edges, edgeKeys, pr, prAcc, REL.FUND);
      addEdge(edges, edgeKeys, rootAccounts[i % rootAccounts.length], prAcc, REL.FUND, { amount: `${(rand() * 800 + 200).toFixed(0)}万` });
    }

    /* —— 供应商集群（交易 + 资金） —— */
    const supplierIds = [];
    for (let i = 0; i < 14; i += 1) {
      const sup = company(`供应商-${String.fromCharCode(65 + (i % 26))}${i}`, { industry: '建材供应' });
      supplierIds.push(sup);
      addEdge(edges, edgeKeys, CENTER_ID, sup, REL.TRADE, { source: '采购合同' });
      if (i < 8) {
        const sAcc = account(`供应商账户-${i + 1}`);
        addEdge(edges, edgeKeys, sup, sAcc, REL.FUND);
        addEdge(edges, edgeKeys, pick(rand, rootAccounts), sAcc, REL.FUND, { amount: `${(rand() * 500 + 50).toFixed(0)}万` });
      }
    }

    /* —— 人员同事网（审计：经办人交叉） —— */
    const clerkPool = [];
    for (let i = 0; i < 18; i += 1) {
      clerkPool.push(person(`经办人-${i + 1}`, { title: '财务经办' }));
    }
    for (let i = 0; i < clerkPool.length; i += 1) {
      const a = clerkPool[i];
      const b = clerkPool[(i + 3) % clerkPool.length];
      if (rand() > 0.35) addEdge(edges, edgeKeys, a, b, REL.COLLEAGUE);
      if (rand() > 0.6) addEdge(edges, edgeKeys, a, pick(rand, supplierIds), REL.EMPLOY, { source: '历史任职' });
    }

    /* —— 投资穿透链（树形样本） —— */
    let treeParent = CENTER_ID;
    for (let i = 0; i < 4; i += 1) {
      const holding = company(`持股平台-L${i + 1}`, { industry: '投资' });
      addEdge(edges, edgeKeys, treeParent, holding, REL.INVEST, { amount: '51%' });
      treeParent = holding;
    }
    const treeLeaf = company('底层参股公司-东南建材');
    addEdge(edges, edgeKeys, treeParent, treeLeaf, REL.INVEST, { amount: '80%' });

    /* —— 资金回流小环（审计：循环交易） —— */
    const ringAcc = [];
    for (let i = 0; i < 4; i += 1) {
      ringAcc.push(account(`回流账户-R${i + 1}`));
    }
    for (let i = 0; i < ringAcc.length; i += 1) {
      addEdge(edges, edgeKeys, ringAcc[i], ringAcc[(i + 1) % ringAcc.length], REL.FUND, { amount: '380万', source: '异常流水模型' });
    }
    addEdge(edges, edgeKeys, pick(rand, rootAccounts), ringAcc[0], REL.FUND, { source: '期初转入' });

    /* —— 围标小组（同事 + 交易） —— */
    const bidPersons = [];
    for (let i = 0; i < 5; i += 1) bidPersons.push(person(`围标关联人-${i + 1}`));
    for (let i = 0; i < bidPersons.length; i += 1) {
      for (let j = i + 1; j < bidPersons.length; j += 1) {
        addEdge(edges, edgeKeys, bidPersons[i], bidPersons[j], REL.COLLEAGUE, { source: '同人同址' });
      }
    }
    const bidCos = supplierIds.slice(0, 4);
    bidCos.forEach((co, i) => {
      addEdge(edges, edgeKeys, bidPersons[i], co, REL.EMPLOY);
      addEdge(edges, edgeKeys, co, projectIds[i % projectIds.length], REL.TRADE, { source: '围标项目' });
    });

    /* —— 凭证链（层次样本） —— */
    const v1 = voucher('凭证#2025-08821');
    const v2 = voucher('凭证#2025-08822');
    const v3 = voucher('凭证#2025-08823');
    addEdge(edges, edgeKeys, pick(rand, supplierIds), v1, REL.TRADE);
    addEdge(edges, edgeKeys, v1, pick(rand, rootAccounts), REL.FUND, { amount: '128万' });
    addEdge(edges, edgeKeys, v1, v2, REL.FUND, { amount: '结转' });
    addEdge(edges, edgeKeys, v2, projectIds[0], REL.FUND);
    addEdge(edges, edgeKeys, v3, v2, REL.FUND);

    /* —— 补齐至约 100 实体 —— */
    while (nodes.length < 100) {
      const t = rand();
      if (t < 0.28) {
        const pid = person(`关联人员-${nodes.length}`);
        addEdge(edges, edgeKeys, pid, pick(rand, [CENTER_ID, ...subIds, ...supplierIds]), REL.EMPLOY);
        if (rand() > 0.5) addEdge(edges, edgeKeys, pid, pick(rand, clerkPool), REL.COLLEAGUE);
      } else if (t < 0.52) {
        const co = company(`关联企业-${nodes.length}`);
        addEdge(edges, edgeKeys, pick(rand, [CENTER_ID, ...subIds]), co, rand() > 0.5 ? REL.INVEST : REL.TRADE);
      } else if (t < 0.72) {
        const ac = account(`关联账户-${nodes.length}`);
        addEdge(edges, edgeKeys, pick(rand, rootAccounts), ac, REL.FUND);
      } else if (t < 0.9) {
        const pr = project(`延伸项目-${nodes.length}`);
        addEdge(edges, edgeKeys, CENTER_ID, pr, REL.TRADE);
      } else {
        voucher(`凭证#${9000 + nodes.length}`);
      }
    }

    /* —— 路径分析样本：被审计主体 → 专户 → 供应商 → 回流环 —— */
    pathNodeIds.push(CENTER_ID, rootAccounts[0], projectIds[0], supplierIds[0], ringAcc[0], ringAcc[1]);

    const typeCount = {};
    const relCount = {};
    nodes.forEach((n) => {
      typeCount[n.type] = (typeCount[n.type] || 0) + 1;
    });
    edges.forEach((e) => {
      relCount[e.type] = (relCount[e.type] || 0) + 1;
    });

    const groupByType = {
      人员: 'person-network',
      企业: 'company-network',
      账户: 'fund-network',
      项目: 'project-network',
      凭证: 'voucher-network',
    };
    nodes.forEach((node) => {
      if (node.id === CENTER_ID) {
        node.fixed = true;
        node.riskScore = 92;
        node.weight = 5;
        node.groupId = 'audit-core';
        return;
      }
      if (!node.groupId) node.groupId = groupByType[node.type] || 'other-network';
      if (node.label.includes('供应商') || node.label.includes('围标')) node.groupId = 'bid-risk';
      if (node.label.includes('回流') || node.label.includes('账户')) node.groupId = 'fund-risk';
      if (node.label.includes('持股') || node.label.includes('参股')) node.groupId = 'control-chain';
      if (node.label.includes('凭证')) node.groupId = 'voucher-chain';
      if (node.riskScore == null) {
        const base = node.groupId === 'bid-risk' ? 72 : node.groupId === 'fund-risk' ? 78 : node.groupId === 'control-chain' ? 64 : 42;
        node.riskScore = Math.min(96, base + Math.floor(rand() * 20));
      }
      if (node.weight == null) node.weight = Math.max(1, Math.round((node.size || 22) / 8));
    });
    edges.forEach((edge) => {
      if (pathNodeIds.includes(edge.from) && pathNodeIds.includes(edge.to)) edge.pathKey = 'main-audit-path';
      if (edge.type === REL.FUND && edge.amountValue === 0) edge.amountValue = 80 + Math.floor(rand() * 720);
    });

    const adj = new Map(nodes.map((n) => [n.id, []]));
    edges.forEach((edge) => {
      if (adj.has(edge.from) && adj.has(edge.to)) {
        adj.get(edge.from).push(edge.to);
        adj.get(edge.to).push(edge.from);
      }
    });
    const layerMap = new Map([[CENTER_ID, 0]]);
    const queue = [CENTER_ID];
    while (queue.length) {
      const cur = queue.shift();
      const depth = layerMap.get(cur);
      (adj.get(cur) || []).forEach((next) => {
        if (!layerMap.has(next)) {
          layerMap.set(next, Math.min(depth + 1, 4));
          queue.push(next);
        }
      });
    }
    nodes.forEach((node, index) => {
      node.layer = layerMap.has(node.id) ? layerMap.get(node.id) : 4 + (index % 2);
      node.props = { ...(node.props || {}), 层级: `第 ${node.layer} 层` };
    });

    return {
      name: '审计样本-100实体多层关联网络',
      centerNodeId: CENTER_ID,
      treeRootId: CENTER_ID,
      pathNodeIds,
      recommendedLayout: 'force',
      layoutMeta: {
        scenario: 'audit',
        rankdir: 'LR',
        sortBy: 'riskScore',
        groupBy: 'groupId',
        entityCount: nodes.length,
        edgeCount: edges.length,
        entityTypes: typeCount,
        relationTypes: relCount,
        relationLabels: Object.values(REL),
      },
      nodes,
      edges,
    };
  }

  window.DGP_AUDIT_SCENARIO_100 = {
    REL,
    buildAuditScenarioGraph,
  };
})();
