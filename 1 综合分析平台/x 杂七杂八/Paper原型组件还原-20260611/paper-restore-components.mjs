const MCP_URL = 'http://127.0.0.1:29979/mcp';

async function rpc(sessionId, id, method, params = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const text = await res.text();
  const session = res.headers.get('mcp-session-id') || sessionId;
  const dataLine = text.split(/\r?\n/).find((line) => line.startsWith('data: '));
  if (!dataLine) throw new Error(`No MCP data line: ${text.slice(0, 500)}`);
  const payload = JSON.parse(dataLine.slice(6));
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  return { session, payload };
}

async function call(sessionId, id, name, args = {}) {
  const { payload } = await rpc(sessionId, id, 'tools/call', { name, arguments: args });
  const content = payload.result?.content || [];
  const text = content.find((item) => item.type === 'text')?.text || '';
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const css = {
  font: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
  bg: '#f5f7fb',
  panel: '#ffffff',
  line: '#d9e0ea',
  lineSoft: '#e8edf5',
  text: '#1f2937',
  muted: '#667085',
  faint: '#98a2b3',
  blue: '#1677ff',
  blueSoft: '#eaf3ff',
  green: '#12a182',
  amber: '#f59e0b',
  red: '#f04438',
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function icon(label, bg = '#edf3ff', color = css.blue) {
  return `<div style="width:24px;height:24px;flex-shrink:0;border-radius:6px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;line-height:24px;">${esc(label)}</div>`;
}

function smallIcon(label, bg = '#f2f4f7', color = css.muted) {
  return `<div style="width:18px;height:18px;flex-shrink:0;border-radius:5px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;line-height:18px;">${esc(label)}</div>`;
}

function pill(text, tone = 'blue') {
  const map = {
    blue: ['#eaf3ff', '#1677ff', '#b8d7ff'],
    gray: ['#f3f5f8', '#667085', '#d9e0ea'],
    green: ['#eafaf4', '#12a182', '#bcebdc'],
    amber: ['#fff7e8', '#b7791f', '#f7d698'],
    red: ['#fff1f0', '#d92d20', '#ffc9c5'],
  };
  const [bg, color, border] = map[tone] || map.blue;
  return `<span style="height:22px;display:inline-flex;align-items:center;padding:0 8px;border-radius:999px;border:1px solid ${border};background:${bg};color:${color};font-size:12px;font-weight:600;line-height:22px;white-space:nowrap;">${esc(text)}</span>`;
}

function row(title, meta = '', opts = {}) {
  const active = opts.active;
  const status = opts.status;
  const glyph = opts.glyph || '';
  const bg = active ? '#edf5ff' : '#ffffff';
  const border = active ? '#b9d8ff' : 'transparent';
  const color = active ? css.blue : css.text;
  const statusHtml = status ? `<span style="margin-left:auto;flex-shrink:0;">${pill(status.text, status.tone)}</span>` : '';
  const metaHtml = meta ? `<span style="margin-left:auto;color:${css.faint};font-size:12px;line-height:18px;white-space:nowrap;">${esc(meta)}</span>` : '';
  return `<div style="height:36px;width:100%;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:8px;border:1px solid ${border};background:${bg};box-sizing:border-box;">
    ${glyph ? smallIcon(glyph, active ? '#d9ebff' : '#f2f4f7', active ? css.blue : css.muted) : ''}
    <div style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${color};font-size:14px;line-height:20px;">${esc(title)}</div>
    ${statusHtml || metaHtml}
  </div>`;
}

function sectionTitle(title, count = '') {
  return `<div style="height:28px;display:flex;align-items:center;padding:0 10px;color:${css.muted};font-size:13px;font-weight:600;line-height:20px;">
    <span>${esc(title)}</span>
    ${count ? `<span style="margin-left:auto;color:${css.faint};font-size:12px;font-weight:400;">${esc(count)}</span>` : ''}
  </div>`;
}

function buildSidebar() {
  const conversations = [
    ['初始化引导样例', '6 小时', false],
    ['请帮我删除结果树里「预算测算草稿」下的预算偏差临时表', '7 小时', false],
    ['梳理合同付款节点与发票开具的差异', '8 小时', false],
    ['总结当前工作台中的主要疑点', '1 周', true],
  ];
  const tasks = [
    ['往来函证抽样核对', 'T'],
    ['企业工商信息批量查询', 'B'],
    ['采购异常专项扫描', 'S'],
    ['审计结果打包下载', '4 小时'],
    ['预算与对标分析', '2 天'],
    ['付款与验收追踪', '3 天'],
    ['合同与发票专项核对', '4 天'],
  ];
  return `<div layer-name="侧边栏组件" style="width:260px;height:900px;background:#ffffff;border-right:1px solid ${css.line};box-sizing:border-box;padding:8px 12px;display:flex;flex-direction:column;font-family:${css.font};">
    <div style="height:52px;display:flex;align-items:center;gap:10px;">
      <div style="width:32px;height:32px;border-radius:10px;background:#1677ff;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;">浙</div>
      <div style="min-width:0;display:flex;flex-direction:column;">
        <div style="font-size:15px;font-weight:600;color:${css.text};line-height:21px;white-space:nowrap;">浙江审计综合分析</div>
        <div style="font-size:12px;color:${css.faint};line-height:16px;">Audit Analytics</div>
      </div>
      <div style="margin-left:auto;width:28px;height:28px;border:1px solid ${css.lineSoft};border-radius:7px;color:${css.muted};display:flex;align-items:center;justify-content:center;font-size:12px;">‹</div>
    </div>
    <div style="height:1px;background:${css.lineSoft};margin:6px 0 10px 0;"></div>
    <div style="height:42px;display:flex;flex-direction:column;justify-content:center;margin-bottom:10px;">
      <div style="font-size:12px;color:${css.faint};line-height:16px;">当前工作台</div>
      <div style="font-size:14px;font-weight:500;color:${css.text};line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">A市城建集团年度经济责任审计</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0;margin-bottom:12px;">
      ${row('新建会话', '', { glyph: '+', active: true })}
      ${row('新建任务', '', { glyph: 'T' })}
      ${row('搜索', '', { glyph: '⌕' })}
      ${row('技能', '', { glyph: 'K' })}
    </div>
    ${sectionTitle('对话')}
    <div style="display:flex;flex-direction:column;gap:0;">
      ${conversations.map(([t, m, a]) => row(t, m, { glyph: 'C', active: a })).join('')}
    </div>
    <div style="height:12px;"></div>
    ${sectionTitle('任务')}
    <div style="display:flex;flex-direction:column;gap:0;">
      ${tasks.map(([t, g], i) => row(t, i < 3 ? '' : g, { glyph: i < 3 ? g : 'T' })).join('')}
    </div>
    <div style="margin-top:auto;">${row('设置', '', { glyph: '⚙' })}</div>
  </div>`;
}

function buildChat() {
  const traceRows = [
    ['阅读', '《银行流水-解析失败.xlsx》 L10-L30'],
    ['查询', '尾款 · 付款节点 · 合同 50%'],
    ['查询', '应付账款 · 银行流水 · 实际支付日期'],
    ['调用', '疑点归纳与交叉核对 技能'],
    ['分析', '银行流水-解析失败.xlsx、现场签证照片.png、整改说明.wps'],
  ];
  return `<div layer-name="对话区组件" style="width:900px;height:680px;background:${css.bg};box-sizing:border-box;display:flex;flex-direction:column;font-family:${css.font};">
    <div style="height:48px;background:#fff;border-bottom:1px solid ${css.lineSoft};display:flex;align-items:center;padding:0 16px;box-sizing:border-box;">
      <div style="font-size:16px;font-weight:500;color:${css.text};">总结当前工作台中的主要疑点</div>
      <div style="margin-left:auto;height:28px;padding:0 12px;border-radius:7px;border:1px solid #b8d7ff;color:${css.blue};background:#f4f9ff;display:flex;align-items:center;font-size:13px;">生成技能</div>
    </div>
    <div style="flex:1;display:flex;justify-content:center;overflow:hidden;padding:16px 0 10px 0;box-sizing:border-box;">
      <div style="width:800px;display:flex;flex-direction:column;gap:12px;">
        <div style="align-self:flex-end;display:flex;flex-direction:column;gap:5px;align-items:flex-end;">
          <div style="max-width:520px;background:${css.blue};color:white;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:14px;line-height:22px;">总结当前工作台中的主要疑点</div>
          <div style="font-size:12px;color:${css.faint};">引用 3 项</div>
        </div>
        <div style="border-radius:14px;background:#fff;border:1px solid ${css.lineSoft};box-shadow:0 6px 18px rgba(31,41,55,0.05);overflow:hidden;">
          <div style="height:42px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid ${css.lineSoft};box-sizing:border-box;">
            ${smallIcon('思', '#f3f5f8', css.muted)}
            <div style="font-size:14px;font-weight:500;color:${css.text};">思考 1秒</div>
            <div style="margin-left:auto;color:${css.faint};font-size:12px;">展开详情</div>
          </div>
          <div style="padding:12px;display:flex;flex-direction:column;gap:10px;">
            <p style="margin:0;color:${css.text};font-size:14px;line-height:22px;">针对「总结当前工作台中的主要疑点」，先对齐本次要用的资料范围与期望产出。</p>
            ${traceRows.map(([k, t]) => `<div style="height:34px;border:1px solid ${css.lineSoft};border-radius:8px;background:#fbfcfe;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box;">
              ${smallIcon(k.slice(0, 1), '#edf5ff', css.blue)}
              <span style="font-size:13px;color:${css.muted};width:38px;">${esc(k)}</span>
              <span style="font-size:13px;color:${css.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(t)}</span>
            </div>`).join('')}
            <p style="margin:0;color:${css.text};font-size:14px;line-height:22px;">核查任务已完成并生成中间结果：疑点条目、证据引用与风险分级已结构化。</p>
            <div style="border:1px solid #cfe0f5;border-radius:8px;overflow:hidden;background:#fff;">
              <div style="height:38px;background:#f7faff;border-bottom:1px solid #dce9f8;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;">
                <span style="font-size:13px;font-weight:500;color:${css.text};">审计备忘录-疑点摘录.md</span>
                <span style="margin-left:auto;color:${css.green};font-size:12px;">+2</span>
                <span style="margin-left:8px;color:${css.red};font-size:12px;">-1</span>
              </div>
              <div style="padding:8px 12px;font-size:13px;line-height:22px;color:${css.text};font-family:Menlo,Consolas,monospace;">
                <div><span style="color:${css.faint};">1</span> - 待核实：合同金额与已开发票差异</div>
                <div><span style="color:${css.faint};">2</span> + 待核实：合同金额与已开发票差异 [高风险]</div>
                <div><span style="color:${css.faint};">3</span> + 建议：补充 2024Q4 对账单</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div style="height:114px;display:flex;justify-content:center;padding:8px 0 14px 0;box-sizing:border-box;">
      <div style="width:800px;height:92px;background:#fff;border:1px solid #cfd8e6;border-radius:14px;box-shadow:0 8px 24px rgba(31,41,55,0.08);padding:12px;display:flex;flex-direction:column;box-sizing:border-box;">
        <div style="height:42px;color:${css.faint};font-size:14px;line-height:22px;">继续追问、引用资料或创建任务...</div>
        <div style="height:32px;display:flex;align-items:center;">
          ${smallIcon('+', '#f3f5f8', css.muted)}
          <div style="margin-left:auto;width:32px;height:32px;border-radius:9px;background:${css.blue};color:white;display:flex;align-items:center;justify-content:center;font-size:14px;">↑</div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildTask() {
  const taskRows = [
    ['往来函证抽样核对', '完成', 'green'],
    ['企业工商信息批量查询', '运行中', 'blue'],
    ['采购异常专项扫描', '排队中', 'amber'],
    ['预算与对标分析', '失败', 'red'],
  ];
  return `<div layer-name="任务区组件" style="width:520px;height:580px;background:#fff;border:1px solid ${css.line};border-radius:12px;box-sizing:border-box;font-family:${css.font};display:flex;flex-direction:column;overflow:hidden;">
    <div style="height:56px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid ${css.lineSoft};box-sizing:border-box;">
      ${icon('T')}
      <div style="margin-left:10px;">
        <div style="font-size:16px;font-weight:500;color:${css.text};line-height:22px;">任务区</div>
        <div style="font-size:12px;color:${css.faint};line-height:16px;">按任务状态追踪审计执行</div>
      </div>
      <div style="margin-left:auto;">${pill('4 项任务', 'gray')}</div>
    </div>
    <div style="padding:12px 14px;border-bottom:1px solid ${css.lineSoft};display:flex;gap:8px;box-sizing:border-box;">
      ${['全部', '运行中', '失败'].map((t, i) => `<div style="height:30px;padding:0 12px;border-radius:8px;border:1px solid ${i === 0 ? '#b8d7ff' : css.lineSoft};background:${i === 0 ? css.blueSoft : '#fff'};color:${i === 0 ? css.blue : css.muted};display:flex;align-items:center;font-size:13px;">${t}</div>`).join('')}
    </div>
    <div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px;">
      ${taskRows.map(([name, st, tone]) => `<div style="border:1px solid ${css.lineSoft};border-radius:10px;background:#fbfcfe;padding:12px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${smallIcon('任', '#edf5ff', css.blue)}
          <div style="font-size:14px;font-weight:500;color:${css.text};line-height:20px;">${esc(name)}</div>
          <div style="margin-left:auto;">${pill(st, tone)}</div>
        </div>
        <div style="display:flex;gap:8px;color:${css.muted};font-size:12px;line-height:18px;">
          <span>资源 3</span><span>结果 2</span><span>最近更新 4 小时</span>
        </div>
        <div style="height:6px;background:#eef2f7;border-radius:999px;overflow:hidden;">
          <div style="width:${tone === 'green' ? '100' : tone === 'blue' ? '62' : tone === 'amber' ? '28' : '44'}%;height:100%;background:${tone === 'red' ? css.red : tone === 'amber' ? css.amber : css.blue};border-radius:999px;"></div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function buildSkill() {
  const skills = [
    ['疑点归纳与交叉核对', '金额口径、时点先后、主体一致性', '已引用'],
    ['合同付款节点核验', '合同条款、发票、银行流水交叉比对', '可运行'],
    ['采购异常专项扫描', '供应商、预算、验收单批量核查', '可运行'],
  ];
  return `<div layer-name="技能区组件" style="width:560px;height:520px;background:#fff;border:1px solid ${css.line};border-radius:12px;box-sizing:border-box;font-family:${css.font};display:flex;flex-direction:column;overflow:hidden;">
    <div style="height:56px;padding:0 16px;border-bottom:1px solid ${css.lineSoft};display:flex;align-items:center;box-sizing:border-box;">
      ${icon('K', '#eef8ff', '#0b72b9')}
      <div style="margin-left:10px;">
        <div style="font-size:16px;font-weight:500;color:${css.text};line-height:22px;">技能区</div>
        <div style="font-size:12px;color:${css.faint};line-height:16px;">沉淀当前审计动作，可生成或复用技能</div>
      </div>
      <div style="margin-left:auto;height:30px;padding:0 12px;border-radius:8px;background:${css.blue};color:#fff;display:flex;align-items:center;font-size:13px;">生成技能</div>
    </div>
    <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px;">
      <div style="height:36px;border:1px solid ${css.lineSoft};border-radius:9px;display:flex;align-items:center;padding:0 10px;box-sizing:border-box;color:${css.faint};font-size:13px;">搜索技能名称 / 审计思路</div>
      ${skills.map(([name, desc, state], i) => `<div style="border:1px solid ${i === 0 ? '#b8d7ff' : css.lineSoft};background:${i === 0 ? '#f8fbff' : '#fff'};border-radius:10px;padding:12px;display:flex;gap:10px;">
        ${smallIcon(String(i + 1), i === 0 ? '#d9ebff' : '#f3f5f8', i === 0 ? css.blue : css.muted)}
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="font-size:14px;font-weight:500;color:${css.text};line-height:20px;">${esc(name)}</div>
            ${pill(state, i === 0 ? 'blue' : 'gray')}
          </div>
          <div style="margin-top:6px;color:${css.muted};font-size:13px;line-height:20px;">${esc(desc)}</div>
          <div style="margin-top:10px;display:flex;gap:8px;">
            ${['查看', '引用', '运行'].map((x, j) => `<div style="height:26px;padding:0 10px;border:1px solid ${j === 1 ? '#b8d7ff' : css.lineSoft};border-radius:7px;color:${j === 1 ? css.blue : css.muted};display:flex;align-items:center;font-size:12px;">${x}</div>`).join('')}
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function buildResourceBrowser() {
  const files = [
    ['3', '底稿资料', 'folder'],
    ['银行流水-解析失败.xlsx', '未解析', 'red'],
    ['现场签证照片.png', '已解析', 'green'],
    ['整改说明.wps', '解析中', 'blue'],
    ['2', '审计结果', 'folder'],
    ['审计备忘录-疑点摘录.md', '结果', 'blue'],
  ];
  return `<div layer-name="资源浏览区组件" style="width:1020px;height:720px;background:${css.bg};border:1px solid ${css.line};border-radius:12px;box-sizing:border-box;font-family:${css.font};position:relative;overflow:hidden;">
    <div style="position:absolute;left:0;top:0;width:48px;height:720px;background:#fff;border-right:1px solid ${css.lineSoft};display:flex;flex-direction:column;align-items:center;padding-top:8px;gap:8px;box-sizing:border-box;">
      ${['›', '文', '表', '图', '库', '果'].map((x, i) => `<div style="width:28px;height:28px;border-radius:7px;border:1px solid ${i === 1 ? '#b8d7ff' : 'transparent'};background:${i === 1 ? css.blueSoft : '#fff'};color:${i === 1 ? css.blue : css.muted};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;">${x}</div>`).join('')}
    </div>
    <div style="position:absolute;left:48px;top:0;width:330px;height:720px;background:#fff;border-right:1px solid ${css.line};display:flex;flex-direction:column;box-sizing:border-box;">
      <div style="height:54px;display:flex;align-items:center;padding:0 14px;border-bottom:1px solid ${css.lineSoft};box-sizing:border-box;">
        <div style="font-size:16px;font-weight:500;color:${css.text};">文件目录</div>
        <div style="margin-left:8px;">${pill('6', 'gray')}</div>
        <div style="margin-left:auto;display:flex;gap:6px;">${smallIcon('⌕')}${smallIcon('+')}</div>
      </div>
      <div style="padding:10px 12px;border-bottom:1px solid ${css.lineSoft};display:flex;gap:8px;">
        ${['全部', '排队中', '解析中', '未解析'].map((t, i) => `<div style="height:24px;padding:0 8px;border-radius:999px;background:${i === 0 ? css.blueSoft : '#f4f6f9'};color:${i === 0 ? css.blue : css.muted};font-size:12px;display:flex;align-items:center;">${t}</div>`).join('')}
      </div>
      <div style="padding:10px 10px;display:flex;flex-direction:column;gap:4px;">
        ${files.map(([a, b, c], i) => c === 'folder'
          ? `<div style="height:34px;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:8px;background:${i === 0 ? '#f8fbff' : '#fff'};">${smallIcon('›', '#f3f5f8', css.muted)}<span style="height:18px;min-width:22px;padding:0 5px;border-radius:999px;background:#eef2f7;color:${css.muted};font-size:12px;display:flex;align-items:center;justify-content:center;">${a}</span><span style="font-size:14px;color:${css.text};">${b}</span></div>`
          : `<div style="height:40px;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:8px;background:${i === 1 ? '#edf5ff' : '#fff'};border:1px solid ${i === 1 ? '#b8d7ff' : 'transparent'};">${smallIcon('F', '#eef6ff', css.blue)}<span style="min-width:0;flex:1;font-size:13px;color:${css.text};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a}</span>${pill(b, c)}</div>`).join('')}
      </div>
    </div>
    <div style="position:absolute;left:378px;top:0;width:642px;height:720px;display:flex;flex-direction:column;background:#fff;box-sizing:border-box;">
      <div style="height:48px;border-bottom:1px solid ${css.lineSoft};display:flex;align-items:center;padding:0 12px;gap:8px;box-sizing:border-box;">
        <div style="height:32px;padding:0 10px;border:1px solid #b8d7ff;background:${css.blueSoft};border-radius:8px;color:${css.blue};display:flex;align-items:center;gap:6px;font-size:13px;">${smallIcon('F', '#d9ebff', css.blue)}银行流水-解析失败.xlsx</div>
        <div style="height:32px;padding:0 10px;border:1px solid ${css.lineSoft};border-radius:8px;color:${css.muted};display:flex;align-items:center;font-size:13px;">审计备忘录-疑点摘录.md</div>
        <div style="margin-left:auto;display:flex;gap:8px;">${smallIcon('⛶')}${smallIcon('×')}</div>
      </div>
      <div style="height:44px;border-bottom:1px solid ${css.lineSoft};display:flex;align-items:center;padding:0 16px;gap:8px;box-sizing:border-box;">
        ${['正文', '基础信息', '历史版本'].map((t, i) => `<div style="height:30px;padding:0 12px;border-radius:8px;background:${i === 0 ? css.blueSoft : '#fff'};color:${i === 0 ? css.blue : css.muted};display:flex;align-items:center;font-size:13px;">${t}</div>`).join('')}
        <div style="margin-left:auto;color:${css.faint};font-size:12px;">复制 · 下载 · 保存</div>
      </div>
      <div style="flex:1;display:flex;overflow:hidden;">
        <div style="width:190px;background:#fbfcfe;border-right:1px solid ${css.lineSoft};padding:14px 12px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:13px;font-weight:500;color:${css.text};line-height:20px;">目录</div>
          ${['L10-L30 付款节点', 'L31-L48 发票开具', 'L49-L75 银行流水', 'L76-L98 审批记录'].map((t, i) => `<div style="font-size:12px;line-height:18px;color:${i === 0 ? css.blue : css.muted};padding:6px 8px;border-radius:7px;background:${i === 0 ? css.blueSoft : 'transparent'};">${esc(t)}</div>`).join('')}
        </div>
        <div style="flex:1;padding:22px 28px;box-sizing:border-box;overflow:hidden;">
          <div style="font-size:20px;font-weight:500;color:${css.text};line-height:28px;margin-bottom:8px;">银行流水-解析失败.xlsx</div>
          <div style="display:flex;gap:8px;margin-bottom:18px;">${pill('XLSX', 'blue')}${pill('未解析', 'red')}${pill('引用中', 'green')}</div>
          <div style="border:1px solid ${css.lineSoft};border-radius:10px;overflow:hidden;">
            ${['日期          对方户名          摘要              金额', '2024-10-17    A市城建设计院    尾款支付          420,000.00', '2024-10-22    A市建材公司      发票价税合计      386,000.00', '2024-11-02    分包单位          工程款            186,000.00'].map((t, i) => `<div style="height:38px;padding:0 12px;border-bottom:${i === 3 ? '0' : `1px solid ${css.lineSoft}`};background:${i === 0 ? '#f7f9fc' : '#fff'};font-family:Menlo,Consolas,monospace;font-size:12px;color:${i === 0 ? css.muted : css.text};display:flex;align-items:center;white-space:pre;">${esc(t)}</div>`).join('')}
          </div>
          <div style="margin-top:18px;border-left:3px solid ${css.amber};background:#fffaf0;padding:10px 12px;color:${css.text};font-size:13px;line-height:22px;">疑点摘录：付款节点与发票开具金额存在差异，需要结合合同付款比例与审批记录继续核对。</div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildSpec() {
  return `<div layer-name="还原说明" style="width:1020px;background:#fff;border:1px solid ${css.line};border-radius:12px;box-sizing:border-box;padding:18px 22px;font-family:${css.font};display:flex;flex-direction:column;gap:12px;">
    <div style="font-size:20px;font-weight:600;color:${css.text};line-height:28px;">综合分析平台原型组件还原</div>
    <div style="font-size:13px;color:${css.muted};line-height:22px;">依据当前原型目录 <span style="font-family:Menlo,Consolas,monospace;color:${css.text};">综合分析平台 20260609</span> 的 HTML/CSS、运行截图和组件结构拆分。画布按组件分别还原：侧边栏、对话区、任务区、技能区、资源浏览区（右侧工具栏、目录树、阅读内容、页签、目录）。</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">${['workbench-v2-sidebar', 'nlm-chat-body', 'workbench-v2-doc-workspace', 'nlm-resource-panel', 'wb-material-file-tree'].map((t) => pill(t, 'gray')).join('')}</div>
  </div>`;
}

async function main() {
  let session = null;
  const init = await rpc(null, 1, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'codex-paper-restore', version: '1.0' },
  });
  session = init.session;
  await rpc(session, 2, 'tools/list', {});
  await call(session, 3, 'get_guide', { topic: 'paper-mcp-instructions' });
  await call(session, 4, 'get_basic_info', {});
  await call(session, 5, 'get_font_family_info', { familyNames: ['system-ui', 'PingFang SC', 'Microsoft YaHei'] });

  const created = await call(session, 6, 'create_file', { name: '综合分析平台原型组件还原 20260611' });
  const fileId = created.fileId || created.id || String(created).match(/[A-Z0-9]{20,}/)?.[0];
  if (!fileId) throw new Error(`Cannot parse file ID from create_file: ${JSON.stringify(created)}`);
  const opened = await call(session, 7, 'open_file', { fileId });

  const root = opened.rootNodeId || (await call(session, 8, 'get_basic_info', {})).rootNodeId;
  const boards = [
    ['还原说明', '1060px', '170px', buildSpec()],
    ['侧边栏', '300px', '940px', buildSidebar()],
    ['对话区', '940px', '720px', buildChat()],
    ['任务区', '560px', '620px', buildTask()],
    ['技能区', '600px', '560px', buildSkill()],
    ['资源浏览区', '1060px', '760px', buildResourceBrowser()],
  ];

  const artboardIds = [];
  for (let i = 0; i < boards.length; i += 1) {
    const [name, width, height, html] = boards[i];
    const artboard = await call(session, 20 + i * 2, 'create_artboard', {
      name,
      styles: {
        width,
        height,
        backgroundColor: css.bg,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
      },
    });
    const id = artboard.nodeId || artboard.id || artboard.artboardId;
    if (!id) throw new Error(`Cannot parse artboard ID: ${JSON.stringify(artboard)}`);
    artboardIds.push(id);
    await call(session, 21 + i * 2, 'write_html', {
      targetNodeId: id,
      mode: 'insert-children',
      html,
    });
    await call(session, 100 + i, 'get_screenshot', { nodeId: id, scale: 1 });
  }

  await call(session, 200, 'finish_working_on_nodes', { nodeIds: artboardIds });
  const info = await call(session, 201, 'get_basic_info', {});
  console.log(JSON.stringify({ fileId, url: info.url, artboards: info.artboards?.map((a) => a.name) || [] }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
