(function () {
  const REAL_ENTITY_TYPES = ['人员', '企业', '机动车', '行政事业单位', '电话'];
  const REAL_EDGE_TYPES = ['财政供养', '人员关系', '拥有车辆', '企业核心人员', '法人股东', '缴纳社保', '开发票', '用有电话', '国库支付'];

  const graphs = [
    { id: 'g-audit', tabLabel: '浙江审计', name: '浙江审计关系图谱', desc: '人员、企业、行政事业单位、机动车与电话的审计关系网络', region: '浙江', permission: 'query', entities: 1280000, relations: 4200000 },
    { id: 'g-finance', tabLabel: '财政审计', name: '财政供养与国库支付图谱', desc: '财政供养、国库支付、开票和社保缴纳关系', region: '财政', permission: 'query', entities: 890000, relations: 2100000 },
    { id: 'g-procurement', tabLabel: '采购审计', name: '采购主体关联图谱', desc: '行政事业单位、承接企业、人员、电话与机动车关系', region: '浙江', permission: 'query', entities: 640000, relations: 1800000 },
    { id: 'g-company', tabLabel: '工商关联', name: '企业人员关联图谱', desc: '企业核心人员、法人股东、社保缴纳和电话关系', region: '华东', permission: 'view', entities: 5600000, relations: 9800000 },
    { id: 'g-social', tabLabel: '人员社保', name: '人员社保与财政供养图谱', desc: '人员、行政事业单位、企业与社保缴纳关系', region: '华东', permission: 'query', entities: 3200000, relations: 5100000 },
  ];

  const basicTemplates = [
    { id: 'entity', name: '实体信息查询', desc: '按实体类型、ID、名称和步数生成初始查询结果。' },
    { id: 'path', name: '路径分析', desc: '指定起点、终点和最大跳数，分析两实体间关联路径。' },
    { id: 'cypher', name: '查询语句', desc: '使用已有查询语句模板发起图谱探查。' },
  ];

  const dataTemplates = [
    {
      id: 'dt-chain',
      name: '主体链路穿透',
      type: '图数据模板',
      desc: '按人员、企业或行政事业单位拉取多跳关联。',
      variables: [
        { key: 'subjectName', label: '主体名称', type: 'text', required: true, placeholder: '输入人员、企业或行政事业单位名称' },
        { key: 'depth', label: '查询层级', type: 'number', required: true, default: 2, min: 1, max: 6 },
        { key: 'relationTypes', label: '关系类型', type: 'multiSelect', required: false, options: REAL_EDGE_TYPES },
      ],
    },
    {
      id: 'dt-risk',
      name: '高风险对象排查',
      type: '图数据模板',
      desc: '按风险评分展开重点人员、企业与外部线索。',
      variables: [
        { key: 'batchName', label: '排查批次', type: 'select', required: true, options: ['批次01', '批次02', '批次03'] },
        { key: 'minScore', label: '最低风险分', type: 'number', required: true, default: 60, min: 0, max: 100 },
      ],
    },
    {
      id: 'dt-treasury',
      name: '国库支付穿透',
      type: '图数据模板',
      desc: '围绕行政事业单位国库支付和开票关系做方向追踪。',
      variables: [
        { key: 'unitName', label: '单位名称', type: 'text', required: true },
        { key: 'windowDays', label: '时间窗口（天）', type: 'number', default: 30, min: 1, max: 365 },
      ],
    },
    {
      id: 'dt-control',
      name: '隐性控制识别',
      type: '图数据模板',
      desc: '通过法人股东、企业核心人员、电话和车辆识别疑似控制链。',
      variables: [
        { key: 'subjectName', label: '目标主体', type: 'text', required: true },
        { key: 'depth', label: '穿透层级', type: 'number', default: 3, min: 1, max: 8 },
        { key: 'includeInvoice', label: '纳入开票关系', type: 'select', options: ['是', '否'], default: '是' },
      ],
    },
    {
      id: 'dt-bid',
      name: '围标团伙排查',
      type: '图数据模板',
      desc: '按同电话、同车辆、人员关系和法人股东线索识别团伙。',
      variables: [
        { key: 'batchName', label: '采购批次', type: 'text', required: true },
        { key: 'companyName', label: '企业名称', type: 'text' },
      ],
    },
    {
      id: 'dt-loop',
      name: '支付闭环排查',
      type: '图数据模板',
      desc: '识别国库支付、开票、人员和电话形成的闭环链路。',
      variables: [
        { key: 'unitName', label: '单位名称', type: 'text', required: true },
        { key: 'dateRange', label: '时间范围说明', type: 'text', placeholder: '如 2025-01-01 至 2025-06-30' },
      ],
    },
  ].map((t) => ({ ...t, vars: (t.variables || []).length }));

  const reasoningTemplates = [
    { id: 'rt-control', name: '隐性控制关系推理', model: 'MindJunc-Lite', status: '已保存', desc: '基于法人股东、核心人员和电话推理隐性控制关系。' },
    { id: 'rt-risk', name: '风险传导推理', model: 'MindJunc-Lite', status: '测试中', desc: '根据关系路径和交叉线索识别风险传导链。' },
  ];

  const batchTasks = [
    { id: 'bt-01', name: '主体链路穿透-批次07', type: '数据模板批量执行', status: '已完成', progress: 100, result: '可预览 28 个查询图' },
    { id: 'bt-02', name: '高风险对象排查-批次02', type: '模板批量执行', status: '运行中', progress: 64, result: '已生成 64 条 JSON 结果' },
  ];

  function runtimeClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createCaseFactory(config) {
    const nodes = [];
    const edges = [];
    const edgeKeys = new Set();
    let edgeSeq = 0;

    function assertType(type, allowed, kind) {
      if (!allowed.includes(type)) {
        throw new Error(`${kind} 类型不在真实口径内: ${type}`);
      }
    }

    function addNode(id, label, type, layer, groupId, riskScore, extra = {}) {
      assertType(type, REAL_ENTITY_TYPES, '实体');
      const item = {
        id,
        label,
        type,
        layer,
        groupId,
        radialDepth: extra.radialDepth ?? layer,
        riskBand: extra.riskBand || '',
        communityRole: extra.communityRole || '',
        riskScore,
        weight: extra.weight || Math.max(1, Math.round((riskScore || 40) / 24)),
        size: extra.size || (layer === 0 ? 38 : layer === 1 ? 28 : 22),
        fixed: !!extra.fixed,
        props: {
          层级: `第 ${layer} 层`,
          分组: groupId,
          风险分: riskScore,
          ...(extra.props || {}),
        },
      };
      nodes.push(item);
      return item.id;
    }

    function addEdge(from, to, type, extra = {}) {
      assertType(type, REAL_EDGE_TYPES, '关系');
      const key = `${from}->${to}:${type}`;
      if (from === to || edgeKeys.has(key)) return;
      edgeKeys.add(key);
      edgeSeq += 1;
      edges.push({
        id: `${config.prefix}-e${edgeSeq}`,
        from,
        to,
        type,
        amount: extra.amount || '-',
        amountValue: extra.amountValue || Number.parseFloat(String(extra.amount || '').replace(/[^\d.]/g, '')) || 0,
        directed: extra.directed !== false,
        weight: 1,
        pathKey: extra.pathKey || '',
        props: { 类型: type, 来源: extra.source || config.source || '布局案例模拟数据', ...(extra.props || {}) },
      });
    }

    function build(extra = {}) {
      return {
        name: config.name,
        nodes,
        edges,
        centerNodeId: extra.centerNodeId || nodes[0]?.id || '',
        treeRootId: extra.treeRootId || extra.centerNodeId || nodes[0]?.id || '',
        pathNodeIds: extra.pathNodeIds || [],
        recommendedLayout: config.recommendedLayout,
        layoutMeta: {
          scenario: config.scenario,
          rankdir: config.rankdir || 'LR',
          sortBy: config.sortBy || 'riskScore',
          groupBy: 'groupId',
          circularNodeIds: extra.circularNodeIds || [],
          loopOrder: extra.loopOrder || extra.circularNodeIds || [],
          layerCount: Math.max(...nodes.map((n) => Number(n.layer) || 0)) + 1,
          caseSummary: `${nodes.length} 个节点，${new Set(nodes.map((n) => n.groupId)).size} 个结构分组`,
          visualGoal: config.visualGoal,
          edgeTypes: config.edgeTypes,
        },
      };
    }

    return { addNode, addEdge, build, nodes, edges };
  }

  function buildForceExplorationCase() {
    const c = createCaseFactory({
      prefix: 'force-case',
      name: '审计样本-多主体复杂关联',
      recommendedLayout: 'force',
      scenario: 'complexExplore',
      visualGoal: '识别多主体网络中的自然团簇与跨团簇桥接线索',
      edgeTypes: ['财政供养', '人员关系', '企业核心人员', '法人股东', '缴纳社保', '开发票', '用有电话', '拥有车辆', '国库支付'],
    });
    const groups = [
      ['unit', '行政事业单位', '主管单位-', 10, 60, '行政事业单位群'],
      ['enterprise', '企业', '关联企业-', 16, 70, '企业群'],
      ['person', '人员', '关键人员-', 16, 66, '人员群'],
      ['phone', '电话', '联系电话-', 12, 58, '电话群'],
      ['vehicle', '机动车', '公务车辆-', 10, 54, '机动车群'],
    ];
    const byGroup = {};
    groups.forEach(([key, type, prefix, count, riskBase, role], gi) => {
      byGroup[key] = [];
      for (let i = 0; i < count; i += 1) {
        byGroup[key].push(c.addNode(
          `force-${key}-${i + 1}`,
          `${prefix}${String(i + 1).padStart(2, '0')}`,
          type,
          gi + 1,
          `force-${key}`,
          Math.min(96, riskBase + ((i * 5) % 18)),
          { communityRole: role, props: { 社区: role } },
        ));
      }
    });
    for (let i = 0; i < 16; i += 1) {
      c.addEdge(byGroup.person[i], byGroup.enterprise[i], i % 2 ? '企业核心人员' : '法人股东', { pathKey: i < 4 ? 'force-bridge' : '' });
      c.addEdge(byGroup.person[i], byGroup.phone[i % 12], '用有电话');
      c.addEdge(byGroup.person[i], byGroup.vehicle[i % 10], '拥有车辆');
      c.addEdge(byGroup.enterprise[i], byGroup.unit[i % 10], i % 3 ? '开发票' : '国库支付', { amount: `${80 + i * 9}万`, amountValue: 80 + i * 9 });
      c.addEdge(byGroup.unit[i % 10], byGroup.person[i], '财政供养');
      if (i < 12) c.addEdge(byGroup.enterprise[i], byGroup.person[(i + 5) % 16], '缴纳社保');
    }
    for (let i = 0; i < 12; i += 1) c.addEdge(byGroup.person[i], byGroup.person[(i + 3) % 16], '人员关系', { directed: false });
    for (let i = 0; i < 8; i += 1) c.addEdge(byGroup.phone[i], byGroup.enterprise[(i * 2) % 16], '用有电话', { directed: false, pathKey: 'force-bridge' });
    return c.build({ centerNodeId: byGroup.unit[0], pathNodeIds: [byGroup.unit[0], byGroup.person[0], byGroup.enterprise[0], byGroup.phone[0], byGroup.vehicle[0]] });
  }

  function buildRadialPenetrationCase() {
    const c = createCaseFactory({
      prefix: 'radial-case',
      name: '主体链路-某行政事业单位四跳穿透',
      recommendedLayout: 'radial',
      scenario: 'entityPenetration',
      visualGoal: '从中心单位按 1-4 跳展开财政供养、企业、电话和车辆线索',
      edgeTypes: ['财政供养', '国库支付', '企业核心人员', '法人股东', '用有电话', '拥有车辆', '人员关系'],
    });
    const root = c.addNode('radial-root', '某行政事业单位', '行政事业单位', 0, 'radial-core', 88, { fixed: true, size: 42, radialDepth: 0, props: { 角色: '穿透中心主体' } });
    const layer1 = [];
    for (let i = 0; i < 12; i += 1) {
      layer1.push(c.addNode(`radial-person-${i + 1}`, `财政供养人员-${String(i + 1).padStart(2, '0')}`, '人员', 1, 'radial-hop1-person', 58 + (i % 8), { radialDepth: 1 }));
      c.addEdge(root, layer1[i], '财政供养');
    }
    const layer2 = [];
    for (let i = 0; i < 16; i += 1) {
      const type = i % 3 === 0 ? '电话' : i % 3 === 1 ? '企业' : '机动车';
      const labelPrefix = type === '电话' ? '共用电话-' : type === '企业' ? '关联企业-' : '关联车辆-';
      layer2.push(c.addNode(`radial-l2-${i + 1}`, `${labelPrefix}${String(i + 1).padStart(2, '0')}`, type, 2, `radial-hop2-${type}`, 64 + ((i * 3) % 16), { radialDepth: 2 }));
      c.addEdge(layer1[i % layer1.length], layer2[i], type === '电话' ? '用有电话' : type === '企业' ? '企业核心人员' : '拥有车辆');
    }
    const layer3 = [];
    for (let i = 0; i < 18; i += 1) {
      const type = i % 2 ? '企业' : '人员';
      layer3.push(c.addNode(`radial-l3-${i + 1}`, `${type === '企业' ? '开票企业' : '法人股东'}-${String(i + 1).padStart(2, '0')}`, type, 3, `radial-hop3-${type}`, 72 + ((i * 5) % 18), { radialDepth: 3, riskBand: '远端重点' }));
      c.addEdge(layer2[i % layer2.length], layer3[i], type === '企业' ? '开发票' : '法人股东', { amount: type === '企业' ? `${36 + i * 6}万` : '-' });
    }
    const layer4 = [];
    for (let i = 0; i < 16; i += 1) {
      const type = i % 2 ? '电话' : '机动车';
      layer4.push(c.addNode(`radial-l4-${i + 1}`, `${type === '电话' ? '远端电话' : '远端车辆'}-${String(i + 1).padStart(2, '0')}`, type, 4, `radial-hop4-${type}`, 80 + ((i * 4) % 12), { radialDepth: 4, riskBand: '远端交叉线索' }));
      c.addEdge(layer3[i % layer3.length], layer4[i], type === '电话' ? '用有电话' : '拥有车辆');
    }
    for (let i = 0; i < 8; i += 1) c.addEdge(layer1[i], layer3[(i + 6) % layer3.length], '人员关系', { directed: false });
    return c.build({ centerNodeId: root, pathNodeIds: [root, layer1[0], layer2[1], layer3[2], layer4[3]] });
  }

  function buildHierarchicalFundCase() {
    const c = createCaseFactory({
      prefix: 'pay-case',
      name: '国库支付-工程拨付链',
      recommendedLayout: 'hierarchical',
      scenario: 'capitalFlow',
      visualGoal: '按国库支付、开票、社保和人员关系从左到右追踪',
      edgeTypes: ['国库支付', '开发票', '企业核心人员', '缴纳社保', '用有电话', '拥有车辆'],
      rankdir: 'LR',
    });
    const units = [];
    const enterprises = [];
    const invoiceEnterprises = [];
    const persons = [];
    const phones = [];
    const vehicles = [];
    for (let i = 0; i < 6; i += 1) units.push(c.addNode(`pay-unit-${i + 1}`, `付款单位-${String(i + 1).padStart(2, '0')}`, '行政事业单位', 0, 'pay-layer-unit', 58 + i));
    for (let i = 0; i < 12; i += 1) enterprises.push(c.addNode(`pay-enterprise-${i + 1}`, `收款企业-${String(i + 1).padStart(2, '0')}`, '企业', 1, 'pay-layer-enterprise', 66 + (i % 8)));
    for (let i = 0; i < 14; i += 1) invoiceEnterprises.push(c.addNode(`pay-invoice-${i + 1}`, `开票企业-${String(i + 1).padStart(2, '0')}`, '企业', 2, 'pay-layer-invoice', 70 + (i % 10)));
    for (let i = 0; i < 14; i += 1) persons.push(c.addNode(`pay-person-${i + 1}`, `企业人员-${String(i + 1).padStart(2, '0')}`, '人员', 3, 'pay-layer-person', 62 + (i % 12)));
    for (let i = 0; i < 12; i += 1) phones.push(c.addNode(`pay-phone-${i + 1}`, `联系号码-${String(i + 1).padStart(2, '0')}`, '电话', 4, 'pay-layer-phone', 54 + (i % 8)));
    for (let i = 0; i < 10; i += 1) vehicles.push(c.addNode(`pay-vehicle-${i + 1}`, `关联车辆-${String(i + 1).padStart(2, '0')}`, '机动车', 4, 'pay-layer-vehicle', 50 + (i % 8)));
    enterprises.forEach((id, i) => c.addEdge(units[i % units.length], id, '国库支付', { amount: `${180 + i * 18}万`, amountValue: 180 + i * 18, pathKey: i < 4 ? 'pay-main-path' : '' }));
    invoiceEnterprises.forEach((id, i) => c.addEdge(enterprises[i % enterprises.length], id, '开发票', { amount: `${52 + i * 7}万`, amountValue: 52 + i * 7, pathKey: i < 4 ? 'pay-main-path' : '' }));
    persons.forEach((id, i) => {
      c.addEdge(id, invoiceEnterprises[i % invoiceEnterprises.length], i % 2 ? '企业核心人员' : '法人股东', { pathKey: i < 3 ? 'pay-main-path' : '' });
      c.addEdge(invoiceEnterprises[(i + 3) % invoiceEnterprises.length], id, '缴纳社保');
    });
    phones.forEach((id, i) => c.addEdge(persons[i % persons.length], id, '用有电话'));
    vehicles.forEach((id, i) => c.addEdge(persons[(i + 4) % persons.length], id, '拥有车辆'));
    return c.build({ centerNodeId: units[0], treeRootId: units[0], pathNodeIds: [units[0], enterprises[0], invoiceEnterprises[0], persons[0], phones[0]] });
  }

  function buildRiskConcentricCase() {
    const c = createCaseFactory({
      prefix: 'risk-case',
      name: '风险名单-财政供养交叉批次02',
      recommendedLayout: 'concentric',
      scenario: 'riskOverview',
      visualGoal: '按风险分圈层排布，高风险人员和企业集中在内圈',
      edgeTypes: ['财政供养', '企业核心人员', '法人股东', '缴纳社保', '用有电话', '拥有车辆', '开发票'],
    });
    const bands = [
      ['core', 12, '人员', '高风险人员-', 0, 90, '核心高风险'],
      ['high', 14, '企业', '高风险企业-', 1, 78, '次高风险'],
      ['mid-phone', 12, '电话', '共用电话-', 2, 62, '交叉线索'],
      ['mid-vehicle', 10, '机动车', '交叉车辆-', 2, 58, '交叉线索'],
      ['low', 14, '行政事业单位', '关联单位-', 3, 44, '背景对象'],
    ];
    const byBand = {};
    bands.forEach(([key, count, type, prefix, layer, riskBase, band]) => {
      byBand[key] = [];
      for (let i = 0; i < count; i += 1) {
        byBand[key].push(c.addNode(`risk-${key}-${i + 1}`, `${prefix}${String(i + 1).padStart(2, '0')}`, type, layer, `risk-${key}`, Math.min(98, riskBase + ((i * 3) % 10)), { riskBand: band, props: { 风险圈层: band } }));
      }
    });
    byBand.core.forEach((id, i) => {
      c.addEdge(byBand.low[i % byBand.low.length], id, '财政供养');
      c.addEdge(id, byBand.high[i % byBand.high.length], i % 2 ? '企业核心人员' : '法人股东');
      c.addEdge(id, byBand['mid-phone'][i % byBand['mid-phone'].length], '用有电话');
      c.addEdge(id, byBand['mid-vehicle'][i % byBand['mid-vehicle'].length], '拥有车辆');
    });
    byBand.high.forEach((id, i) => {
      c.addEdge(id, byBand.core[(i + 5) % byBand.core.length], '缴纳社保');
      c.addEdge(id, byBand.low[(i + 3) % byBand.low.length], '开发票', { amount: `${28 + i * 4}万`, amountValue: 28 + i * 4 });
    });
    return c.build({ centerNodeId: byBand.core[0], pathNodeIds: [byBand.core[0], byBand.high[0], byBand['mid-phone'][0], byBand.low[0]] });
  }

  function buildCapitalLoopCase() {
    const c = createCaseFactory({
      prefix: 'loop-case',
      name: '国库支付-发票人员闭环',
      recommendedLayout: 'circular',
      scenario: 'capitalLoop',
      visualGoal: '突出国库支付、开票、人员和电话形成的闭环主路径',
      edgeTypes: ['国库支付', '开发票', '企业核心人员', '法人股东', '用有电话', '人员关系', '拥有车辆'],
    });
    const loop = [];
    const loopSpec = [
      ['loop-unit-1', '某预算单位', '行政事业单位'],
      ['loop-company-1', '收款企业A', '企业'],
      ['loop-person-1', '核心人员A', '人员'],
      ['loop-phone-1', '共用电话A', '电话'],
      ['loop-company-2', '开票企业B', '企业'],
      ['loop-person-2', '法人股东B', '人员'],
      ['loop-vehicle-1', '共用车辆A', '机动车'],
      ['loop-company-3', '承接企业C', '企业'],
      ['loop-person-3', '经办人员C', '人员'],
      ['loop-phone-2', '共用电话B', '电话'],
      ['loop-company-4', '开票企业D', '企业'],
      ['loop-unit-2', '下属事业单位', '行政事业单位'],
    ];
    loopSpec.forEach(([id, label, type], i) => {
      loop.push(c.addNode(id, label, type, 1, 'loop-main-ring', 88 - (i % 5), { communityRole: '闭环主节点', riskBand: '高风险闭环' }));
    });
    const rels = ['国库支付', '企业核心人员', '用有电话', '用有电话', '法人股东', '拥有车辆', '拥有车辆', '企业核心人员', '人员关系', '用有电话', '国库支付', '开发票'];
    loop.forEach((id, i) => c.addEdge(id, loop[(i + 1) % loop.length], rels[i], { amount: i === 0 || i === 10 || i === 11 ? `${120 + i * 8}万` : '-', amountValue: 120 + i * 8, pathKey: 'loop-main' }));
    for (let i = 0; i < 16; i += 1) {
      const type = i % 2 ? '企业' : '人员';
      const node = c.addNode(`loop-evidence-${i + 1}`, `${type === '企业' ? '旁路企业' : '旁路人员'}-${String(i + 1).padStart(2, '0')}`, type, 2, 'loop-evidence', 58 + (i % 12));
      c.addEdge(loop[i % loop.length], node, type === '企业' ? '开发票' : '人员关系', { directed: false });
    }
    for (let i = 0; i < 20; i += 1) {
      const type = i % 2 ? '电话' : '机动车';
      const node = c.addNode(`loop-attach-${i + 1}`, `${type === '电话' ? '附属电话' : '附属车辆'}-${String(i + 1).padStart(2, '0')}`, type, 3, 'loop-attach', 48 + (i % 10));
      c.addEdge(loop[(i + 3) % loop.length], node, type === '电话' ? '用有电话' : '拥有车辆');
    }
    for (let i = 0; i < 14; i += 1) {
      const node = c.addNode(`loop-unit-extra-${i + 1}`, `延伸单位-${String(i + 1).padStart(2, '0')}`, '行政事业单位', 4, 'loop-unit-extra', 42 + (i % 8));
      c.addEdge(node, loop[i % loop.length], i % 2 ? '国库支付' : '财政供养', { amount: i % 2 ? `${45 + i * 3}万` : '-' });
    }
    return c.build({ centerNodeId: loop[0], circularNodeIds: loop, loopOrder: loop, pathNodeIds: loop.slice(0, 6) });
  }

  function buildGridBrowseCase() {
    const c = createCaseFactory({
      prefix: 'grid-case',
      name: '财政供养对象-名单抽查批次',
      recommendedLayout: 'grid',
      scenario: 'searchResult',
      visualGoal: '按对象类型规整浏览批量核查结果，关系线仅作辅助参考',
      edgeTypes: ['财政供养', '缴纳社保', '用有电话', '拥有车辆'],
    });
    const specs = [
      ['person', 22, '人员', '抽查人员-', 62],
      ['unit', 12, '行政事业单位', '供养单位-', 50],
      ['enterprise', 12, '企业', '社保企业-', 58],
      ['phone', 10, '电话', '登记电话-', 48],
      ['vehicle', 10, '机动车', '登记车辆-', 46],
    ];
    const byType = {};
    specs.forEach(([key, count, type, prefix, riskBase], layer) => {
      byType[key] = [];
      for (let i = 0; i < count; i += 1) {
        byType[key].push(c.addNode(`grid-${key}-${i + 1}`, `${prefix}${String(i + 1).padStart(2, '0')}`, type, layer, `grid-${key}`, riskBase + ((i * 5) % 18), { riskBand: i < 4 ? '抽查重点' : '普通对象' }));
      }
    });
    byType.person.forEach((id, i) => {
      c.addEdge(byType.unit[i % byType.unit.length], id, '财政供养');
      c.addEdge(byType.enterprise[i % byType.enterprise.length], id, '缴纳社保');
      if (i < byType.phone.length) c.addEdge(id, byType.phone[i], '用有电话');
      if (i < byType.vehicle.length) c.addEdge(id, byType.vehicle[i], '拥有车辆');
    });
    return c.build({ centerNodeId: byType.person[0], pathNodeIds: [byType.person[0], byType.unit[0], byType.enterprise[0], byType.phone[0]] });
  }

  function buildBidCommunityCase() {
    const c = createCaseFactory({
      prefix: 'bid-case',
      name: '围标排查-采购批次04',
      recommendedLayout: 'community',
      scenario: 'bidCommunity',
      visualGoal: '识别多个企业团伙及跨团伙共享电话、车辆和人员线索',
      edgeTypes: ['企业核心人员', '法人股东', '用有电话', '拥有车辆', '开发票', '人员关系', '国库支付'],
    });
    const communities = ['A组', 'B组', 'C组', 'D组', 'E组'];
    const bridgePhones = [];
    const bridgeVehicles = [];
    communities.forEach((name, gi) => {
      const group = `bid-community-${gi + 1}`;
      const unit = c.addNode(`bid-unit-${gi + 1}`, `采购单位-${name}`, '行政事业单位', 0, group, 52 + gi * 4, { communityRole: '采购单位' });
      const sharedPhone = c.addNode(`bid-phone-${gi + 1}`, `共享电话-${name}`, '电话', 2, group, 76 + gi, { communityRole: '共享电话' });
      const sharedVehicle = c.addNode(`bid-vehicle-${gi + 1}`, `共享车辆-${name}`, '机动车', 2, group, 70 + gi, { communityRole: '共享车辆' });
      bridgePhones.push(sharedPhone);
      bridgeVehicles.push(sharedVehicle);
      for (let i = 0; i < 5; i += 1) {
        const company = c.addNode(`bid-company-${gi + 1}-${i + 1}`, `参审企业-${name}-${i + 1}`, '企业', 1, group, 70 + ((i + gi) % 8), { communityRole: '参审企业' });
        const person = c.addNode(`bid-person-${gi + 1}-${i + 1}`, `联系人-${name}-${i + 1}`, '人员', 2, group, 64 + ((i * 3) % 10), { communityRole: '联系人' });
        c.addEdge(unit, company, i % 2 ? '国库支付' : '开发票', { amount: `${30 + i * 8}万`, amountValue: 30 + i * 8, pathKey: i < 2 ? 'bid-main' : '' });
        c.addEdge(person, company, i % 2 ? '企业核心人员' : '法人股东');
        c.addEdge(person, sharedPhone, '用有电话');
        c.addEdge(person, sharedVehicle, '拥有车辆');
        if (i > 0) c.addEdge(person, `bid-person-${gi + 1}-${i}`, '人员关系', { directed: false });
      }
    });
    bridgePhones.forEach((id, i) => c.addEdge(id, bridgePhones[(i + 1) % bridgePhones.length], '用有电话', { directed: false, pathKey: 'bid-bridge' }));
    bridgeVehicles.forEach((id, i) => {
      if (i % 2 === 0) c.addEdge(id, bridgeVehicles[(i + 2) % bridgeVehicles.length], '拥有车辆', { directed: false, pathKey: 'bid-bridge' });
    });
    return c.build({ centerNodeId: 'bid-unit-1', pathNodeIds: ['bid-unit-1', 'bid-company-1-1', 'bid-person-1-1', 'bid-phone-1'] });
  }

  function buildLayoutCaseGraphs() {
    return {
      force: buildForceExplorationCase(),
      radial: buildRadialPenetrationCase(),
      hierarchical: buildHierarchicalFundCase(),
      concentric: buildRiskConcentricCase(),
      circular: buildCapitalLoopCase(),
      grid: buildGridBrowseCase(),
      community: buildBidCommunityCase(),
    };
  }

  const layoutCaseGraphs = buildLayoutCaseGraphs();

  const history = [
    { id: 'h-audit-100', baseId: 'g-audit', name: '审计样本-多主体复杂关联', mode: '关系探索', updated: '2026-05-20 09:00' },
    { id: 'h-a-03', baseId: 'g-audit', name: '主体链路-某行政事业单位四跳穿透', mode: '主体链路穿透', updated: '2026-05-18 09:46' },
    { id: 'h-a-04', baseId: 'g-audit', name: '国库支付-工程拨付链', mode: '国库支付穿透', updated: '2026-05-18 08:55' },
    { id: 'h-a-06', baseId: 'g-audit', name: '风险名单-财政供养交叉批次02', mode: '高风险对象排查', updated: '2026-05-17 14:12' },
    { id: 'h-a-14', baseId: 'g-audit', name: '国库支付-发票人员闭环', mode: '支付闭环排查', updated: '2026-05-14 10:02' },
    { id: 'h-a-10', baseId: 'g-audit', name: '财政供养对象-名单抽查批次', mode: '财政供养抽查', updated: '2026-05-16 10:15' },
    { id: 'h-p-02', baseId: 'g-audit', name: '围标排查-采购批次04', mode: '围标团伙排查', updated: '2026-05-13 09:25' },
    { id: 'h-a', baseId: 'g-audit', name: '实体查询-人员关联样本', mode: '实体信息查询', updated: '2026-05-18 10:22' },
  ];

  const graphResultsByHistory = {
    'h-audit-100': layoutCaseGraphs.force,
    'h-a-03': layoutCaseGraphs.radial,
    'h-a-04': layoutCaseGraphs.hierarchical,
    'h-a-06': layoutCaseGraphs.concentric,
    'h-a-14': layoutCaseGraphs.circular,
    'h-a-10': layoutCaseGraphs.grid,
    'h-p-02': layoutCaseGraphs.community,
  };

  const graphResult = layoutCaseGraphs.radial;
  graphResultsByHistory['h-a'] = graphResult;

  function getResultForHistory(historyId) {
    return runtimeClone(graphResultsByHistory[historyId] || graphResult);
  }

  window.DGP_DATA = {
    graphs,
    basicTemplates,
    dataTemplates,
    reasoningTemplates,
    batchTasks,
    history,
    graphResult,
    graphResultsByHistory,
    getResultForHistory,
    REAL_ENTITY_TYPES,
    REAL_EDGE_TYPES,
  };
})();
