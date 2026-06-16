const MCP_URL = 'http://127.0.0.1:29979/mcp';
const FILE_ID = '01KTTMS46YMT6AK7NBKR6B31A0';
const SIDEBAR_ARTBOARD_ID = 'G-0';

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

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function svgIcon(kind, color = '#525252') {
  const common = `width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const paths = {
    plus: `<path d="M8 3.5v9M3.5 8h9"/>`,
    search: `<circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2l2.8 2.8"/>`,
    book: `<path d="M3 3.5h4.2c.7 0 1.3.6 1.3 1.3v8.1c0-.7-.6-1.3-1.3-1.3H3z"/><path d="M13 3.5H8.8c-.7 0-1.3.6-1.3 1.3v8.1c0-.7.6-1.3 1.3-1.3H13z"/>`,
    chat: `<path d="M3 4.2c0-.9.7-1.7 1.7-1.7h6.6c.9 0 1.7.7 1.7 1.7v4.4c0 .9-.7 1.7-1.7 1.7H7.2L4.2 13v-2.7c-.7-.2-1.2-.8-1.2-1.6z"/><path d="M5.5 5.6h5M5.5 8h3.8"/>`,
    workbench: `<rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M5.2 6h5.6M5.2 8h5.6M5.2 10h3.2"/>`,
    leftbar: `<rect x="3" y="3" width="10" height="10" rx="1.4"/><path d="M6.2 3v10"/>`,
    task: `<path d="M4 3h6l2 2v8H4z"/><path d="M10 3v3h3M6 8h4M6 10.5h4"/>`,
    batch: `<path d="M3 5h10M5 3v10M11 3v10"/><rect x="3" y="3" width="10" height="10" rx="1.4"/>`,
    download: `<path d="M8 3v6"/><path d="M5.5 6.8L8 9.3l2.5-2.5"/><path d="M4 12.5h8"/>`,
    tool: `<path d="M10.5 3.2l2.3 2.3-6.9 6.9H3.6v-2.3z"/><path d="M9.4 4.3l2.3 2.3"/>`,
  };
  return `<svg ${common}>${paths[kind] || paths.chat}</svg>`;
}

function iconSlot(kind, color = '#525252') {
  return `<div style="width:16px;height:24px;position:absolute;left:8px;top:6px;display:flex;align-items:center;justify-content:center;color:${color};">${svgIcon(kind, color)}</div>`;
}

function action(y, icon, text, active = false) {
  return `<div layer-name="${esc(text)}" style="position:absolute;left:12px;top:${y}px;width:236px;height:36px;border-radius:6px;background:${active ? 'rgba(23,23,23,0.1)' : 'transparent'};color:#171717;font-size:14px;font-weight:500;line-height:21px;">
    ${iconSlot(icon)}
    <div style="position:absolute;left:36px;top:7.5px;width:180px;height:21px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(text)}</div>
  </div>`;
}

function sectionHead(y, text) {
  return `<div layer-name="${esc(text)}分组标题" style="position:absolute;left:12px;top:${y}px;width:236px;height:28px;border-radius:6px;color:#737373;font-size:14px;font-weight:500;line-height:19.6px;">
    <div style="position:absolute;left:8px;top:4px;width:190px;height:20px;">${esc(text)}</div>
  </div>`;
}

function conversation(y, icon, title, time, active = false, statusIcon = '') {
  const bg = active ? 'rgba(23,23,23,0.1)' : 'transparent';
  const titleWidth = time || statusIcon ? 146 : 184;
  const right = statusIcon
    ? `<div style="position:absolute;right:8px;top:10px;width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:${statusIcon.color};">${statusIcon.svg}</div>`
    : `<div style="position:absolute;right:8px;top:8.5px;width:42px;height:19px;color:#737373;font-size:14px;font-weight:400;line-height:18.9px;white-space:nowrap;text-align:right;">${esc(time || '')}</div>`;
  return `<div layer-name="${esc(title)}" style="position:absolute;left:12px;top:${y}px;width:236px;height:36px;border-radius:6px;background:${bg};color:#171717;">
    ${iconSlot(icon)}
    <div style="position:absolute;left:32px;top:8.5px;width:${titleWidth}px;height:19px;color:#171717;font-size:14px;font-weight:400;line-height:18.9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(title)}</div>
    ${right}
  </div>`;
}

function sidebarHtml() {
  return `<div layer-name="侧边栏组件-css复刻" style="position:relative;width:260px;height:900px;box-sizing:border-box;background:rgb(227,239,255);font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei','Segoe UI',sans-serif;color:#171717;overflow:hidden;">
    <div layer-name="品牌区" style="position:absolute;left:12px;top:0;width:236px;height:48px;">
      <div style="position:absolute;left:0;top:8px;width:32px;height:32px;border-radius:6px;background:rgb(22,119,255);display:flex;align-items:center;justify-content:center;color:#fff;">${svgIcon('workbench', '#ffffff')}</div>
      <div style="position:absolute;left:40px;top:7px;width:128px;height:20px;font-size:16px;font-weight:500;line-height:20px;color:#171717;white-space:nowrap;">浙江审计综合分析</div>
      <div style="position:absolute;left:40px;top:27px;width:128px;height:15px;font-size:12px;font-weight:400;line-height:15px;color:#737373;white-space:nowrap;">Audit Analytics</div>
      <div style="position:absolute;right:0;top:10px;width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#525252;">${svgIcon('leftbar', '#525252')}</div>
    </div>
    <div layer-name="当前工作台" style="position:absolute;left:20px;top:56px;width:220px;height:19px;color:#525252;font-size:14px;font-weight:400;line-height:18.9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">A市城建集团年度经济责任审计</div>
    ${action(83, 'plus', '新建会话')}
    ${action(119, 'plus', '新建任务')}
    ${action(155, 'search', '搜索')}
    ${action(191, 'book', '技能')}
    ${sectionHead(239, '对话')}
    ${conversation(267, 'chat', '初始化引导样例', '6 小时')}
    ${conversation(303, 'chat', '请帮我删除结果树里「预算测算草稿」下的预算偏差临时表', '7 小时')}
    ${conversation(339, 'chat', '梳理合同付款节点与发票开具的差异', '8 小时')}
    ${conversation(375, 'chat', '总结当前工作台中的主要疑点', '1 周', true)}
    ${sectionHead(423, '任务')}
    ${conversation(451, 'chat', '往来函证抽样核对', '', false, { color: '#1677ff', svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1677ff" stroke-width="1.5"><path d="M8 2.5a5.5 5.5 0 1 1-5.1 7.6" stroke-linecap="round"/><path d="M2.5 10.2V13h2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` })}
    ${conversation(487, 'batch', '企业工商信息批量查询', '', false, { color: '#1677ff', svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#1677ff" stroke-width="1.5"><path d="M8 2.5a5.5 5.5 0 1 1-5.1 7.6" stroke-linecap="round"/><path d="M2.5 10.2V13h2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>` })}
    ${conversation(523, 'task', '采购异常专项扫描', '', false, { color: '#d92d20', svg: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#d92d20" stroke-width="1.5"><circle cx="8" cy="8" r="5.2"/><path d="M6 6l4 4M10 6l-4 4" stroke-linecap="round"/></svg>` })}
    ${conversation(559, 'download', '审计结果打包下载', '4 小时')}
    ${conversation(595, 'task', '预算与对标分析', '2 天')}
    ${conversation(631, 'task', '付款与验收追踪', '3 天')}
    ${conversation(667, 'task', '合同与发票专项核对', '4 天')}
    ${action(856, 'tool', '设置')}
  </div>`;
}

async function main() {
  let { session } = await rpc(null, 1, 'initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'codex-sidebar-fix', version: '1.0' },
  });
  await rpc(session, 2, 'tools/list', {});
  await call(session, 3, 'get_guide', { topic: 'paper-mcp-instructions' });
  await call(session, 4, 'open_file', { fileId: FILE_ID });
  await call(session, 5, 'get_font_family_info', { familyNames: ['system-ui', 'PingFang SC', 'Microsoft YaHei'] });
  const children = await call(session, 6, 'get_children', { nodeId: SIDEBAR_ARTBOARD_ID });
  const childRows = Array.isArray(children) ? children : (Array.isArray(children.children) ? children.children : []);
  const childIds = childRows.map((child) => child.id).filter(Boolean);
  if (childIds.length) await call(session, 7, 'delete_nodes', { nodeIds: childIds });
  await call(session, 8, 'update_styles', {
    updates: [{
      nodeIds: [SIDEBAR_ARTBOARD_ID],
      styles: {
        width: '260px',
        height: '900px',
        padding: '0px',
        backgroundColor: 'rgb(227,239,255)',
      },
    }],
  });
  await call(session, 9, 'write_html', {
    targetNodeId: SIDEBAR_ARTBOARD_ID,
    mode: 'insert-children',
    html: sidebarHtml(),
  });
  const nextChildren = await call(session, 10, 'get_children', { nodeId: SIDEBAR_ARTBOARD_ID });
  const nextRows = Array.isArray(nextChildren) ? nextChildren : (Array.isArray(nextChildren.children) ? nextChildren.children : []);
  const restored = nextRows.find((child) => child.name === '侧边栏组件-css复刻');
  if (restored && restored.id) {
    await call(session, 11, 'update_styles', {
      updates: [{
        nodeIds: [restored.id],
        styles: {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '260px',
          height: '900px',
        },
      }],
    });
  }
  await call(session, 12, 'get_screenshot', { nodeId: SIDEBAR_ARTBOARD_ID, scale: 1 });
  await call(session, 13, 'finish_working_on_nodes', { nodeIds: [SIDEBAR_ARTBOARD_ID] });
  const info = await call(session, 14, 'get_basic_info', {});
  console.log(JSON.stringify({ url: info.url, artboard: SIDEBAR_ARTBOARD_ID, nodeCount: info.nodeCount }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
