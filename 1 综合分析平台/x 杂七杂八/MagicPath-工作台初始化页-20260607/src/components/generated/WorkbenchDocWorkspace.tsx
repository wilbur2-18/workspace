import { Icon } from './Icon';
import { docTabs, resourcesByPanel, type DocPanel } from './data';
const panels: Array<{
  id: DocPanel;
  label: string;
  icon: string;
}> = [{
  id: 'file',
  label: '打开文件目录',
  icon: 'file'
}, {
  id: 'database',
  label: '打开库表目录',
  icon: 'table'
}, {
  id: 'graph',
  label: '打开数据图谱目录',
  icon: 'map'
}, {
  id: 'knowledge',
  label: '打开知识库目录',
  icon: 'book'
}, {
  id: 'result',
  label: '打开结果目录',
  icon: 'folder'
}];
export function WorkbenchDocWorkspace({
  fullscreen,
  panel,
  onClose,
  onFullscreen,
  onPanel,
  onMenu,
  onModal
}: {
  fullscreen: boolean;
  panel: DocPanel;
  onClose: () => void;
  onFullscreen: () => void;
  onPanel: (panel: DocPanel) => void;
  onMenu: (label: string) => void;
  onModal: (label: string) => void;
}) {
  return <section className={`wb-doc ${fullscreen ? 'is-fullscreen' : ''}`} aria-label="资料预览与目录">
      <div className="wb-doc-tabs">
        <div className="wb-tab-strip">
          {docTabs.map((tab, index) => <button key={tab.id} type="button" className={index === 0 ? 'is-active' : ''}>
              <Icon name={tab.icon} />
              <span>{tab.title}</span>
              {index > 0 && <Icon name="close" />}
            </button>)}
          <button type="button" className="wb-add-tab" onClick={() => onMenu('打开资料来源')}><Icon name="plus" /></button>
        </div>
        <div className="wb-doc-actions">
          <button type="button" className={fullscreen ? 'is-active' : ''} onClick={onFullscreen} aria-label="全屏查看"><Icon name="maximize" /></button>
          <button type="button" onClick={onClose} aria-label="收起资料工作区"><Icon name="split" /></button>
        </div>
      </div>
      <div className="wb-doc-path">
        <span>结果 / 疑点摘录与跟进建议（会话稿） / 审计备忘录-疑点摘录.md</span>
        <button type="button" onClick={() => onMenu('添加到对话')}><Icon name="chat" /></button>
        <button type="button" onClick={() => onMenu('当前详情更多')}><Icon name="more" /></button>
      </div>
      <div className="wb-doc-body">
        <article className="wb-preview">
          <header>
            <h2>疑点摘录与跟进建议</h2>
            <button type="button" onClick={() => onModal('结果详情')}>详情</button>
          </header>
          <p>系统根据合同、发票台账、付款流水和现场签证材料，形成三个待核查疑点。以下内容仅作为审计备忘录草案，需人工复核。</p>
          <table>
            <thead><tr><th>疑点</th><th>证据</th><th>建议</th></tr></thead>
            <tbody>
              <tr><td>合同金额与发票累计金额差异</td><td>施工合同第8页 / 发票台账 Sheet1</td><td>补充对账单及剩余发票复印件</td></tr>
              <tr><td>付款节点早于验收节点</td><td>付款流水第3页 / 进度验收单</td><td>核查是否存在审批豁免</td></tr>
              <tr><td>供应商主体名称不完全一致</td><td>采购合同首页 / 开户信息表</td><td>调取工商登记与授权委托书</td></tr>
            </tbody>
          </table>
        </article>
        <aside className="wb-directory">
          <div className="wb-directory-switcher">
            {panels.map(item => <button key={item.id} type="button" className={panel === item.id ? 'is-active' : ''} title={item.label} onClick={() => onPanel(item.id)}>
                <Icon name={item.icon} />
              </button>)}
          </div>
          <div className="wb-directory-list">
            <header>
              <strong>{panels.find(item => item.id === panel)?.label.replace('打开', '')}</strong>
              <button type="button" onClick={() => onMenu('目录更多')}><Icon name="more" /></button>
            </header>
            {resourcesByPanel[panel].map(item => <button key={item.id} type="button" onClick={() => onMenu(item.title)}>
                <Icon name={panel === 'database' ? 'table' : panel === 'graph' ? 'map' : 'file'} />
                <span><strong>{item.title}</strong><em>{item.meta}</em></span>
              </button>)}
          </div>
        </aside>
      </div>
    </section>;
}