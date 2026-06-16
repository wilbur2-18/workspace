import fs from 'node:fs/promises';

const conversations = [
  { title: '初始化引导样例', time: '6 小时', active: false },
  { title: '请帮我删除结果树里「预算测算草稿」下的预算偏差临时表', time: '7 小时', active: false },
  { title: '梳理合同付款节点与发票开具的差异', time: '8 小时', active: false },
  { title: '总结当前工作台中的主要疑点', time: '1 周', active: true },
];

const tasks = [
  { title: '往来函证抽样核对', status: 'running' },
  { title: '企业工商信息批量查询', status: 'done' },
  { title: '采购异常专项扫描', status: 'failed' },
  { title: '审计结果打包下载', time: '4 小时' },
  { title: '预算与对标分析', time: '2 天' },
  { title: '付款与验收追踪', time: '3 天' },
  { title: '合同与发票专项核对', time: '4 天' },
];

const chatSteps = [
  '针对「总结当前工作台中的主要疑点」，先对齐本次要用的资料范围与期望产出（疑点描述、证据指向、后续核查建议）。',
  '阅读 《银行流水-解析失败.xlsx》 L10-L30',
  '这一段同时出现付款节点、比例与「尾款」表述，和发票开具金额、审批流水里的实际支付时点可能对不上。',
  '查询 总结当前工作台中的主要疑点',
  '查询 尾款 · 付款节点 · 合同 50%',
  '调用 疑点归纳与交叉核对 技能',
  '分析 银行流水-解析失败.xlsx、现场签证照片.png、整改说明.wps',
];

let seq = 0;
function id(prefix = 'n') {
  seq += 1;
  return `${prefix}${seq}`;
}

function textNode(name, content, opts = {}) {
  return {
    type: 'text',
    id: id('t'),
    name,
    fill: opts.fill || '#171717ff',
    content,
    fontFamily: 'Inter',
    fontSize: opts.fontSize || 14,
    fontWeight: opts.fontWeight || '400',
    ...(opts.textGrowth ? { textGrowth: opts.textGrowth } : {}),
    ...(opts.width ? { width: opts.width } : {}),
    ...(opts.height ? { height: opts.height } : {}),
    ...(opts.lineHeight ? { lineHeight: opts.lineHeight } : {}),
  };
}

function iconNode(name, icon, fill = '#333840ff', size = 18) {
  return {
    type: 'icon',
    id: id('i'),
    name,
    width: size,
    height: size,
    icon,
    library: 'lucide',
    fill,
  };
}

function sidebarAction(label, icon, active = false) {
  return {
    type: 'frame',
    id: id('sa'),
    name: label,
    height: 32,
    width: 'fill_container',
    cornerRadius: 8,
    gap: 8,
    padding: [0, 10],
    alignItems: 'center',
    fill: active ? '#e8e8e8ff' : '#00000000',
    children: [
      iconNode(`${label}图标`, icon),
      textNode(label, label, { fontSize: 14, fontWeight: '500', fill: '#30343aff' }),
    ],
  };
}

function conversationRow(item) {
  const children = [
    iconNode('对话图标', 'message-square', '#525252ff', 14),
    {
      type: 'frame',
      id: id('cm'),
      name: '标题区',
      width: 'fill_container',
      layout: 'vertical',
      children: [
        textNode('标题', item.title, {
          fontSize: 14,
          fontWeight: item.active ? '600' : '400',
          fill: item.active ? '#171717ff' : '#30343aff',
          textGrowth: 'fixed-width',
          width: 'fill_container',
        }),
      ],
    },
  ];
  if (item.time) {
    children.push(textNode('时间', item.time, { fontSize: 12, fill: '#737373ff' }));
  }
  return {
    type: 'frame',
    id: id('cv'),
    name: item.title,
    width: 'fill_container',
    height: 36,
    cornerRadius: 8,
    gap: 8,
    padding: [0, 8],
    alignItems: 'center',
    fill: item.active ? '#ebebebff' : '#00000000',
    children,
  };
}

function taskRow(item) {
  const statusIcon = item.status === 'done'
    ? iconNode('完成', 'circle-check', '#16a34aff', 14)
    : item.status === 'failed'
      ? iconNode('失败', 'circle-x', '#dc2626ff', 14)
      : item.status === 'running'
        ? iconNode('运行', 'loader-circle', '#2563ebff', 14)
        : null;
  const children = [
    iconNode('任务图标', 'file-text', '#525252ff', 14),
    {
      type: 'frame',
      id: id('tm'),
      name: '任务标题区',
      width: 'fill_container',
      children: [textNode('任务标题', item.title, { fontSize: 14, fill: '#30343aff', textGrowth: 'fixed-width', width: 'fill_container' })],
    },
  ];
  if (item.time) children.push(textNode('时间', item.time, { fontSize: 12, fill: '#737373ff' }));
  else if (statusIcon) children.push(statusIcon);
  children.push(iconNode('更多', 'ellipsis', '#737373ff', 14));
  return {
    type: 'frame',
    id: id('tk'),
    name: item.title,
    width: 'fill_container',
    height: 36,
    cornerRadius: 8,
    gap: 8,
    padding: [0, 8],
    alignItems: 'center',
    children,
  };
}

function railButton(label, icon, pressed = false) {
  return {
    type: 'frame',
    id: id('rb'),
    name: label,
    width: 40,
    height: 40,
    cornerRadius: 10,
    layout: 'vertical',
    justifyContent: 'center',
    alignItems: 'center',
    fill: pressed ? '#e8e8e8ff' : '#00000000',
    children: [iconNode(`${label}图标`, icon, pressed ? '#1677ffff' : '#333840ff', 18)],
  };
}

function chatStep(text, done = true) {
  return {
    type: 'frame',
    id: id('st'),
    name: text.slice(0, 24),
    width: 'fill_container',
    gap: 8,
    padding: [4, 0],
    alignItems: 'center',
    children: [
      iconNode('状态', done ? 'circle-check' : 'circle-x', done ? '#16a34aff' : '#dc2626ff', 14),
      textNode('步骤', text, { fontSize: 14, fill: '#30343aff', textGrowth: 'fixed-width', width: 'fill_container' }),
      iconNode('展开', 'chevron-right', '#737373ff', 14),
    ],
  };
}

const page = {
  version: '2.13',
  children: [
    {
      type: 'frame',
      id: 'pageRoot',
      x: 0,
      y: 0,
      name: '审计工作台 v2 · 对话模式',
      clip: true,
      width: 1600,
      height: 900,
      fill: '#f5f5f5ff',
      layout: 'horizontal',
      children: [
        {
          type: 'frame',
          id: 'sidebar',
          name: '左侧栏',
          width: 260,
          height: 'fill_container',
          fill: '#f5f5f5ff',
          layout: 'vertical',
          gap: 8,
          padding: [12, 12, 12, 12],
          children: [
            {
              type: 'frame',
              id: 'brand',
              name: '品牌区',
              width: 'fill_container',
              height: 48,
              gap: 10,
              alignItems: 'center',
              children: [
                {
                  type: 'frame',
                  id: 'brandMark',
                  name: 'Logo',
                  width: 32,
                  height: 32,
                  fill: '#1677ffff',
                  cornerRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  children: [iconNode('工作台', 'landmark', '#ffffffff', 16)],
                },
                {
                  type: 'frame',
                  id: 'brandText',
                  name: '品牌文字',
                  width: 'fill_container',
                  layout: 'vertical',
                  gap: 2,
                  children: [
                    textNode('品牌名', '浙江审计综合分析', { fontSize: 14, fontWeight: '600' }),
                    textNode('副标题', 'Audit Analytics', { fontSize: 12, fill: '#737373ff' }),
                  ],
                },
                iconNode('收起', 'panel-left-close', '#525252ff', 16),
              ],
            },
            {
              type: 'frame',
              id: 'sidebarActions',
              name: '主操作',
              width: 'fill_container',
              layout: 'vertical',
              gap: 4,
              children: [
                sidebarAction('新建会话', 'square-pen'),
                sidebarAction('新建任务', 'file-plus-2'),
                sidebarAction('搜索', 'search'),
                sidebarAction('技能', 'book-open'),
              ],
            },
            {
              type: 'frame',
              id: 'convList',
              name: '历史对话和任务',
              width: 'fill_container',
              height: 'fill_container',
              layout: 'vertical',
              gap: 12,
              children: [
                textNode('项目标题', 'A市城建集团年度经济责任审计', {
                  fontSize: 16,
                  fontWeight: '600',
                  textGrowth: 'fixed-width',
                  width: 'fill_container',
                }),
                {
                  type: 'frame',
                  id: 'historyGroup',
                  name: '对话分组',
                  width: 'fill_container',
                  layout: 'vertical',
                  gap: 4,
                  children: [
                    textNode('对话标签', '对话', { fontSize: 12, fontWeight: '600', fill: '#737373ff' }),
                    ...conversations.map(conversationRow),
                  ],
                },
                {
                  type: 'frame',
                  id: 'taskGroup',
                  name: '任务分组',
                  width: 'fill_container',
                  layout: 'vertical',
                  gap: 4,
                  children: [
                    textNode('任务标签', '任务', { fontSize: 12, fontWeight: '600', fill: '#737373ff' }),
                    ...tasks.map(taskRow),
                  ],
                },
              ],
            },
            sidebarAction('设置', 'settings'),
          ],
        },
        {
          type: 'frame',
          id: 'main',
          name: '主工作区',
          width: 'fill_container',
          height: 'fill_container',
          fill: '#ffffffff',
          cornerRadius: 8,
          layout: 'vertical',
          children: [
            {
              type: 'frame',
              id: 'header',
              name: '顶栏',
              width: 'fill_container',
              height: 48,
              padding: [0, 16],
              alignItems: 'center',
              children: [
                textNode('页面标题', '总结当前工作台中的主要疑点', {
                  fontSize: 14,
                  fontWeight: '600',
                  width: 'fill_container',
                  textGrowth: 'fixed-width-height',
                  height: 20,
                }),
                {
                  type: 'frame',
                  id: 'genSkillBtn',
                  name: '生成技能',
                  height: 28,
                  cornerRadius: 6,
                  gap: 4,
                  padding: [0, 8],
                  alignItems: 'center',
                  fill: '#00000000',
                  children: [
                    iconNode('灯泡', 'lightbulb', '#525252ff', 13),
                    textNode('生成技能文字', '生成技能', { fontSize: 12, fontWeight: '500', fill: '#525252ff' }),
                  ],
                },
              ],
            },
            {
              type: 'frame',
              id: 'chatArea',
              name: '对话区',
              width: 'fill_container',
              height: 'fill_container',
              layout: 'vertical',
              gap: 12,
              padding: [0, 24, 12, 24],
              children: [
                {
                  type: 'frame',
                  id: 'userBubble',
                  name: '用户消息',
                  width: 'fill_container',
                  justifyContent: 'end',
                  children: [
                    {
                      type: 'frame',
                      id: 'userBubbleInner',
                      name: '用户气泡',
                      fill: '#1677ffff',
                      cornerRadius: 12,
                      padding: [10, 14],
                      children: [
                        textNode('用户提问', '总结当前工作台中的主要疑点', {
                          fontSize: 14,
                          fontWeight: '500',
                          fill: '#ffffffff',
                        }),
                      ],
                    },
                  ],
                },
                {
                  type: 'frame',
                  id: 'assistantIntro',
                  name: '助手开场',
                  width: 'fill_container',
                  children: [
                    textNode('助手说明', chatSteps[0], {
                      fontSize: 14,
                      fill: '#30343aff',
                      textGrowth: 'fixed-width',
                      width: 900,
                      lineHeight: 1.45,
                    }),
                  ],
                },
                ...chatSteps.slice(1, 6).map((step) => chatStep(step, step.includes('应付账款') ? false : true)),
                {
                  type: 'frame',
                  id: 'diffCard',
                  name: '差异卡片',
                  width: 'fill_container',
                  fill: '#fafafaff',
                  cornerRadius: 8,
                  stroke: { align: 'inside', thickness: 1, fill: '#e5e5e5ff' },
                  layout: 'vertical',
                  gap: 8,
                  padding: [12, 12],
                  children: [
                    {
                      type: 'frame',
                      id: 'diffHead',
                      name: '差异标题',
                      width: 'fill_container',
                      gap: 8,
                      alignItems: 'center',
                      children: [
                        iconNode('完成', 'circle-check', '#16a34aff', 14),
                        textNode('文件名', '审计备忘录-疑点摘录.md', { fontSize: 14, fontWeight: '500' }),
                        textNode('diff统计', '+2 -1', { fontSize: 12, fill: '#737373ff' }),
                      ],
                    },
                    textNode('删除行', '- 1. 待核实：合同金额与已开发票差异（演示）', {
                      fontSize: 13,
                      fill: '#b91c1cff',
                      textGrowth: 'fixed-width',
                      width: 'fill_container',
                    }),
                    textNode('新增行1', '+ 2. 待核实：合同金额与已开发票差异 [高风险]（演示）', {
                      fontSize: 13,
                      fill: '#15803dff',
                      textGrowth: 'fixed-width',
                      width: 'fill_container',
                    }),
                    textNode('新增行2', '+ 3. 建议：补充 2024Q4 对账单及剩余发票复印件', {
                      fontSize: 13,
                      fill: '#15803dff',
                      textGrowth: 'fixed-width',
                      width: 'fill_container',
                    }),
                  ],
                },
                textNode('收尾说明', '本次模型已完成：资料阅读与多轮关键词检索、技能「疑点归纳与交叉核对」结构化输出，并已更新《审计备忘录-疑点摘录.md》差异草案。', {
                  fontSize: 14,
                  fill: '#30343aff',
                  textGrowth: 'fixed-width',
                  width: 900,
                  lineHeight: 1.45,
                }),
              ],
            },
            {
              type: 'frame',
              id: 'composer',
              name: '输入区',
              width: 'fill_container',
              layout: 'vertical',
              gap: 6,
              padding: [8, 24, 16, 24],
              children: [
                {
                  type: 'frame',
                  id: 'inputBox',
                  name: '输入框',
                  width: 'fill_container',
                  height: 44,
                  cornerRadius: 10,
                  stroke: { align: 'inside', thickness: 1, fill: '#d4d4d4ff' },
                  padding: [0, 12],
                  alignItems: 'center',
                  gap: 8,
                  children: [
                    iconNode('附件', 'paperclip', '#737373ff', 16),
                    textNode('占位符', '输入问题；@ 引用资料或结果，/ 选择技能；Enter 发送', {
                      fontSize: 14,
                      fill: '#a3a3a3ff',
                      width: 'fill_container',
                      textGrowth: 'fixed-width-height',
                      height: 20,
                    }),
                    iconNode('发送', 'send', '#1677ffff', 16),
                  ],
                },
                textNode('免责声明', '系统生成内容需人工核查，审计结论以人工确认为准。', {
                  fontSize: 12,
                  fill: '#a3a3a3ff',
                }),
              ],
            },
          ],
        },
        {
          type: 'frame',
          id: 'rail',
          name: '右侧工具栏',
          width: 48,
          height: 'fill_container',
          fill: '#f5f5f5ff',
          layout: 'vertical',
          gap: 4,
          padding: [8, 4],
          alignItems: 'center',
          children: [
            railButton('展开或收起右栏', 'panel-right'),
            railButton('文件', 'file-text'),
            railButton('库表', 'table-2'),
            railButton('图谱', 'share-2'),
            railButton('知识库', 'book-open'),
            railButton('结果', 'file-output'),
          ],
        },
      ],
    },
  ],
};

const outPath = new URL('./audit-workbench-v2.pen', import.meta.url);
await fs.writeFile(outPath, JSON.stringify(page, null, 2) + '\n', 'utf8');
JSON.parse(await fs.readFile(outPath, 'utf8'));
console.log('Wrote', outPath.pathname);
