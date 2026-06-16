const MCP_URL = 'http://127.0.0.1:29979/mcp';
const FILE_ID = '01KTTMS46YMT6AK7NBKR6B31A0';

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
  const textItem = content.find((item) => item.type === 'text');
  if (!textItem) return content;
  try {
    return JSON.parse(textItem.text);
  } catch {
    return textItem.text;
  }
}

function svgIcon(kind, color = '#525252') {
  const common = `width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const paths = {
    plus: `<path d="M8 3.5v9M3.5 8h9"/>`,
    search: `<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2l2.8 2.8"/>`,
    book: `<path d="M3 3.5h4.2c.7 0 1.3.6 1.3 1.3v8.1c0-.7-.6-1.3-1.3-1.3H3z"/><path d="M13 3.5H8.8c-.7 0-1.3.6-1.3 1.3v8.1c0-.7.6-1.3 1.3-1.3H13z"/>`,
    workbench: `<rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M5.2 6h5.6M5.2 8h5.6M5.2 10h3.2"/>`,
    tool: `<path d="M10.5 3.2l2.3 2.3-6.9 6.9H3.6v-2.3z"/><path d="M9.4 4.3l2.3 2.3"/>`,
  };
  return `<svg ${common}>${paths[kind] || paths.plus}</svg>`;
}

function collapsedSidebarHtml() {
  const iconButton = (top, icon, label) => `<div layer-name="${label}" style="position:absolute;left:8px;top:${top}px;width:47px;height:36px;border-radius:6px;background:transparent;display:flex;align-items:center;justify-content:center;color:#525252;">${svgIcon(icon)}</div>`;
  return `<div layer-name="侧边栏折叠态-css复刻" style="position:relative;width:64px;height:900px;box-sizing:border-box;background:rgb(227,239,255);border-right:1px solid rgb(229,229,229);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;overflow:hidden;">
    <div layer-name="品牌图标" style="position:absolute;left:16px;top:8px;width:32px;height:32px;border-radius:6px;background:rgb(22,119,255);display:flex;align-items:center;justify-content:center;color:#fff;">${svgIcon('workbench', '#ffffff')}</div>
    ${iconButton(56, 'plus', '新建会话')}
    ${iconButton(92, 'plus', '新建任务')}
    ${iconButton(128, 'search', '搜索')}
    ${iconButton(164, 'book', '技能')}
    ${iconButton(856, 'tool', '设置')}
  </div>`;
}

function chip(text, left, width, color = '#1677ff', bg = '#eaf3ff') {
  return `<div style="position:absolute;left:${left}px;top:88px;width:${width}px;height:44px;border-radius:8px;background:${bg};border:1px solid rgba(22,119,255,.26);display:flex;align-items:center;justify-content:center;color:${color};font-size:13px;font-weight:500;line-height:18px;text-align:center;">${text}</div>`;
}

function responsiveRulesHtml() {
  return `<div layer-name="工作台响应式布局规则" style="position:relative;width:1060px;height:420px;background:#ffffff;border:1px solid #d9e0ea;border-radius:12px;box-sizing:border-box;padding:0;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;color:#171717;overflow:hidden;">
    <div style="position:absolute;left:24px;top:22px;font-size:20px;font-weight:600;line-height:28px;">响应式布局规则</div>
    <div style="position:absolute;left:24px;top:56px;width:760px;font-size:13px;line-height:22px;color:#525252;">来自真实原型 <span style="font-family:Menlo,Consolas,monospace;color:#171717;">v2ShellGridStyle()</span> 和 <span style="font-family:Menlo,Consolas,monospace;color:#171717;">.workbench-v2-shell.is-sidebar-collapsed</span>：不要把工作台画成单一固定宽度，侧栏、主区、文档区和右侧工具栏需要按列响应。</div>
    <div style="position:absolute;left:24px;top:88px;width:1012px;height:84px;border-radius:10px;background:#f7f9fc;border:1px solid #e8edf5;">
      ${chip('sidebar<br/>200-400px<br/>默认 260', 16, 144)}
      <div style="position:absolute;left:172px;top:98px;width:1px;height:24px;background:#cfd8e6;"></div>
      ${chip('main<br/>minmax(280px, 1fr)', 188, 284, '#525252', '#ffffff')}
      <div style="position:absolute;left:488px;top:98px;width:1px;height:24px;background:#cfd8e6;"></div>
      ${chip('doc workspace<br/>>=240px<br/>内容阅读 / 详情', 504, 300, '#0b72b9', '#eef8ff')}
      ${chip('rail<br/>48px', 820, 72, '#525252', '#ffffff')}
      <div style="position:absolute;left:904px;top:99px;font-size:12px;line-height:18px;color:#737373;">预览态存在时保留</div>
    </div>
    <div style="position:absolute;left:24px;top:196px;width:488px;height:172px;border:1px solid #e8edf5;border-radius:10px;background:#fbfcfe;">
      <div style="position:absolute;left:16px;top:14px;font-size:15px;font-weight:600;">展开态</div>
      <div style="position:absolute;left:16px;top:46px;width:124px;height:76px;border-radius:8px;background:rgb(227,239,255);border:1px solid #cfe0f5;display:flex;align-items:center;justify-content:center;color:#1677ff;font-size:13px;font-weight:600;">260px</div>
      <div style="position:absolute;left:152px;top:46px;width:304px;height:76px;border-radius:8px;background:#ffffff;border:1px dashed #cfd8e6;display:flex;align-items:center;justify-content:center;color:#525252;font-size:13px;">主内容随剩余宽度伸缩</div>
      <div style="position:absolute;left:16px;top:132px;width:420px;font-size:12px;line-height:18px;color:#737373;">拖拽侧栏分隔线时，侧栏限制在 200-400px；未折叠时保留 1px resizer。</div>
    </div>
    <div style="position:absolute;left:548px;top:196px;width:488px;height:172px;border:1px solid #e8edf5;border-radius:10px;background:#fbfcfe;">
      <div style="position:absolute;left:16px;top:14px;font-size:15px;font-weight:600;">折叠态</div>
      <div style="position:absolute;left:16px;top:46px;width:64px;height:76px;border-radius:8px;background:rgb(227,239,255);border:1px solid #e5e5e5;display:flex;align-items:center;justify-content:center;color:#1677ff;font-size:13px;font-weight:600;">64px</div>
      <div style="position:absolute;left:92px;top:46px;width:364px;height:76px;border-radius:8px;background:#ffffff;border:1px dashed #cfd8e6;display:flex;align-items:center;justify-content:center;color:#525252;font-size:13px;">隐藏品牌文字、项目名、对话/任务列表，只保留入口图标</div>
      <div style="position:absolute;left:16px;top:132px;width:430px;font-size:12px;line-height:18px;color:#737373;">折叠态无 1px sidebar resizer；右侧文档工具栏仍为 48px。</div>
    </div>
  </div>`;
}

async function main() {
  let { session } = await rpc(null, 1, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'codex-responsive-layout', version: '1.0' },
  });
  await rpc(session, 2, 'tools/list', {});
  await call(session, 3, 'get_guide', { topic: 'paper-mcp-instructions' });
  await call(session, 4, 'open_file', { fileId: FILE_ID });
  await call(session, 5, 'get_font_family_info', { familyNames: ['system-ui', 'PingFang SC', 'Microsoft YaHei', 'Menlo'] });

  const collapsed = await call(session, 6, 'create_artboard', {
    name: '侧边栏-折叠态',
    styles: {
      width: '64px',
      height: '900px',
      padding: '0px',
      backgroundColor: 'rgb(227,239,255)',
      display: 'flex',
      flexDirection: 'column',
    },
  });
  const collapsedId = collapsed.nodeId || collapsed.id || collapsed.artboardId;
  await call(session, 7, 'write_html', {
    targetNodeId: collapsedId,
    mode: 'insert-children',
    html: collapsedSidebarHtml(),
  });

  const rules = await call(session, 8, 'create_artboard', {
    name: '工作台响应式布局',
    styles: {
      width: '1100px',
      height: '460px',
      padding: '20px',
      backgroundColor: '#f5f7fb',
      display: 'flex',
      flexDirection: 'column',
    },
  });
  const rulesId = rules.nodeId || rules.id || rules.artboardId;
  await call(session, 9, 'write_html', {
    targetNodeId: rulesId,
    mode: 'insert-children',
    html: responsiveRulesHtml(),
  });
  await call(session, 10, 'get_screenshot', { nodeId: collapsedId, scale: 1 });
  await call(session, 11, 'get_screenshot', { nodeId: rulesId, scale: 1 });
  await call(session, 12, 'finish_working_on_nodes', { nodeIds: [collapsedId, rulesId] });
  const info = await call(session, 13, 'get_basic_info', {});
  console.log(JSON.stringify({
    url: info.url,
    artboardCount: info.artboardCount,
    added: ['侧边栏-折叠态', '工作台响应式布局'],
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
