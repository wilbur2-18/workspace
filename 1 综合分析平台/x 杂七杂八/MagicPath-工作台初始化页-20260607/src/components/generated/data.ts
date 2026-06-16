export type MainView = 'chat' | 'search' | 'skill' | 'task';
export type DocPanel = 'file' | 'database' | 'graph' | 'knowledge' | 'result';

export const conversations = [
{ id: 'guide', title: '初始化引导样例', time: '6 小时' },
{ id: 'delete-result', title: '请帮我删除结果树里...', time: '7 小时' },
{ id: 'contract-pay', title: '梳理合同付款节点与...', time: '8 小时' },
{ id: 'summary', title: '总结当前工作台中的主...', time: '1 周' }];


export const tasks = [
{ id: 'sample-check', title: '往来函证抽样核对', status: 'parsing', statusLabel: '运行中', time: '', icon: 'robot' },
{ id: 'business-query', title: '企业工商信息批量查询', status: 'parsing', statusLabel: '运行中', time: '', icon: 'table' },
{ id: 'purchase-risk', title: '采购异常专项扫描', status: 'failed', statusLabel: '失败', time: '', icon: 'file' },
{ id: 'download', title: '审计结果打包下载', status: 'done', statusLabel: '完成', time: '4 小时', icon: 'download' },
{ id: 'budget', title: '预算与对标分析', status: 'done', statusLabel: '完成', time: '2 天', icon: 'file' },
{ id: 'payment', title: '付款与验收追踪', status: 'done', statusLabel: '完成', time: '3 天', icon: 'file' },
{ id: 'contract-invoice', title: '合同与发票专项核对', status: 'done', statusLabel: '完成', time: '4 天', icon: 'file' }];


export const chatSteps = [
{ kind: 'thought', text: '思考 1秒' },
{ kind: 'read', text: '阅读《银行流水-解析失败.xlsx》 L10-L30' },
{ kind: 'text', text: '这一段同时出现付款节点、比例与「尾款」表述，和发票开具金额、审批流水里的实际支付时间点可能对不上。下面在资料与结果里多轮关键词检索，缩小需要人工核对的片段。' },
{ kind: 'query', text: '查询 总结当前工作台中的主要疑点' },
{ kind: 'query', text: '查询 尾款 · 付款节点 · 合同 50%' },
{ kind: 'error', text: '查询 应付账款 · 银行流水 · 实际支付日期' },
{ kind: 'query', text: '查询 采购审批单 · 发票号码 · 价税合计' },
{ kind: 'text', text: '检索命中若干段落；从金额、日期、科目三个维度粗对齐后，把仍无法解释的差额标成待核实项。接下来调用结构化技能做归纳与引用编号，再由技能要求驱动后续落地步骤。' },
{ kind: 'query', text: '调用 疑点归纳与交叉核对 技能' },
{ kind: 'text', text: '技能先给出检查框架与疑点口径（金额口径、时点先后、主体一致性）。下面按技能规则把核查动作拆成任务，先执行检索与回读，再统一产出结构化中间结果。' },
{ kind: 'query', text: '分析 银行流水-解析失败.xlsx、现场签证照片.png、整改说明.wps' },
{ kind: 'text', text: '核查任务已完成并生成中间结果：疑点条目、证据引用与风险分级已结构化。现在把可读结论同步写入审计备忘录草案，便于你继续追问或直接保存到结果。' }];


export const diffRows = [
{ no: 1, kind: '-', text: '待核实：合同金额与已开发票差异（演示）' },
{ no: 2, kind: '+', text: '待核实：合同金额与已开发票差异「高风险」（演示）' },
{ no: 3, kind: '+', text: '建议：补充 2024Q4 对账单及剩余发票复印件' }];


export const skills = [
{ id: 'contract', name: '施工合同与发票一致性核查', desc: '比对合同金额、发票累计金额与付款节点，识别超付、少付与提前支付风险。', tags: ['城建', '金额', '合规'] },
{ id: 'supplier', name: '采购环节供应商交叉比对（试用）', desc: '抽取供应商、合同金额和付款流水，检查收款方与合同主体一致性。', tags: ['采购', '私有'] },
{ id: 'change', name: '合同变更链路与金额追踪（演示失败）', desc: '识别合同变更金额与后续付款流水之间的链路断点。', tags: ['合同', '变更'] }];


export const resourcesByPanel: Record<DocPanel, Array<{id: string;title: string;meta: string;status?: string;}>> = {
  file: [
  { id: 'm1', title: '施工合同节选（演示）.pdf', meta: '合同资料 / 第8页' },
  { id: 'm2', title: '付款流水.pdf', meta: '资金流水 / 第3页' },
  { id: 'm3', title: '发票台账.xlsx', meta: 'Sheet1 / 第12-19行' },
  { id: 'm4', title: '现场签证照片.png', meta: '影像资料 / 现场证据' }],

  database: [
  { id: 'd1', title: '企业工商登记信息表', meta: '8,240 行 / 已连接' },
  { id: 'd2', title: '供应商付款明细表', meta: '2,316 行 / 待抽样' },
  { id: 'd3', title: '预算执行明细表', meta: '1,048 行 / 已引用' }],

  graph: [
  { id: 'g1', title: '城建集团供应商关系图谱', meta: '32 个主体 / 76 条关系' },
  { id: 'g2', title: '项目经理与供应商关联路径', meta: '4 条高风险路径' }],

  knowledge: [
  { id: 'k1', title: '政府投资项目审计关注点', meta: '制度库 / 2026 版' },
  { id: 'k2', title: '工程款支付合规检查清单', meta: '知识库 / 已引用' }],

  result: [
  { id: 'r1', title: '疑点摘录与跟进建议（会话稿）', meta: 'Markdown / 当前打开' },
  { id: 'r2', title: '合同与发票一致性检查结果', meta: '结构化结果 / 已完成' },
  { id: 'r3', title: '付款节点与批复对照', meta: '表格结果 / 已完成' }]

};

export const docTabs = [
{ id: 'memo', title: '审计备忘录-疑点摘录.md', icon: 'file' },
{ id: 'contract', title: '施工合同.pdf', icon: 'file' },
{ id: 'invoice', title: '发票台账.xlsx', icon: 'table' }];


export const batchChildren = [
{ id: 'c1', title: '杭州城建集团有限公司', status: 'done', statusLabel: '完成' },
{ id: 'c2', title: '浙江宏达建设股份有限公司', status: 'done', statusLabel: '完成' },
{ id: 'c3', title: '宁波港务投资有限公司', status: 'done', statusLabel: '完成' },
{ id: 'c4', title: '温州民商银行股份有限公司', status: 'parsing', statusLabel: '运行中' },
{ id: 'c5', title: '嘉兴科技城发展有限公司', status: 'queued', statusLabel: '排队中' },
{ id: 'c6', title: '金华义乌小商品贸易公司', status: 'failed', statusLabel: '失败' }];


export const startActions = [
{ id: 'file', icon: 'folder', title: '审文件', subtitle: '上传资料或压缩包' },
{ id: 'data', icon: 'database', title: '查数据', subtitle: '添加数据库表' },
{ id: 'graph', icon: 'map', title: '查人或关系', subtitle: '配置数据图谱' }];