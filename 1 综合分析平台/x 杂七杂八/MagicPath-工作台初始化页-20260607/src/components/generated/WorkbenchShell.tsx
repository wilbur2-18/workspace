import { useState } from 'react';
import { Icon } from './Icon';
import { WorkbenchChatStage } from './WorkbenchChatStage';
import { WorkbenchDocWorkspace } from './WorkbenchDocWorkspace';
import { WorkbenchSearchView } from './WorkbenchSearchView';
import { WorkbenchSidebar } from './WorkbenchSidebar';
import { WorkbenchSkillView } from './WorkbenchSkillView';
import { WorkbenchTaskWorkspace } from './WorkbenchTaskWorkspace';
import type { DocPanel, MainView } from './data';
const titles: Record<MainView, string> = {
  chat: '总结当前工作台中的主要疑点',
  search: '搜索',
  skill: '技能',
  task: '企业工商信息批量查询'
};
export function WorkbenchShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<MainView>('chat');
  const [activeConversation, setActiveConversation] = useState('summary');
  const [activeTask, setActiveTask] = useState('business-query');
  const [docOpen, setDocOpen] = useState(false);
  const [docPanel, setDocPanel] = useState<DocPanel>('result');
  const [docFullscreen, setDocFullscreen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(true);
  const [menu, setMenu] = useState('');
  const [modal, setModal] = useState('');
  const openView = (view: MainView) => {
    setActiveView(view);
    if (view === 'chat' || view === 'task') setDocOpen(view === 'task');
  };
  const shellClass = ['wb-shell', sidebarCollapsed ? 'is-sidebar-collapsed' : '', docOpen ? 'is-doc-open' : '', docFullscreen ? 'is-doc-fullscreen' : ''].filter(Boolean).join(' ');
  return <div className={shellClass}>
      <WorkbenchSidebar activeConversation={activeConversation} activeTask={activeTask} activeView={activeView} collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(true)} onExpand={() => setSidebarCollapsed(false)} onConversation={id => {
      setActiveConversation(id);
      openView('chat');
    }} onTask={id => {
      setActiveTask(id);
      openView('task');
    }} onView={openView} onMenu={setMenu} />
      
      {!sidebarCollapsed && <div className="wb-resizer" />}
      <main className="wb-main">
        <header className="wb-header">
          <h1>{titles[activeView]}</h1>
          <div className="wb-header-actions">
            {activeView === 'chat' && <button type="button" onClick={() => setModal('生成技能配置')}>
                <Icon name="brain" />
                <span>生成技能</span>
              </button>}
            {activeView === 'skill' && <>
                <button type="button" onClick={() => setMenu('引用技能')}>
                  <Icon name="book" />
                  <span>引用技能</span>
                </button>
                <button type="button" onClick={() => setModal('创建技能')}>
                  <Icon name="plus" />
                  <span>创建技能</span>
                </button>
              </>}
            {activeView === 'task' && <button type="button" onClick={() => setTaskDetailOpen(value => !value)}>
                <Icon name="info" />
                <span>{taskDetailOpen ? '隐藏任务详情' : '显示任务详情'}</span>
              </button>}
            {(activeView === 'chat' || activeView === 'task') && <button type="button" className={`wb-icon-btn ${docOpen ? 'is-active' : ''}`} aria-label={docOpen ? '收起资料工作区' : '展开资料工作区'} onClick={() => setDocOpen(value => !value)}>
              
                <Icon name="split" />
              </button>}
          </div>
        </header>

        {activeView === 'chat' && <WorkbenchChatStage onOpenDoc={() => setDocOpen(true)} onMenu={setMenu} />}
        {activeView === 'search' && <WorkbenchSearchView onView={openView} onTask={setActiveTask} />}
        {activeView === 'skill' && <WorkbenchSkillView onMenu={setMenu} onModal={setModal} />}
        {activeView === 'task' && <WorkbenchTaskWorkspace activeTask={activeTask} detailOpen={taskDetailOpen} onBack={() => openView('chat')} onOpenDoc={() => setDocOpen(true)} onMenu={setMenu} onModal={setModal} />}
      </main>

      {docOpen && <>
          <div className="wb-resizer wb-resizer-doc" />
          <WorkbenchDocWorkspace fullscreen={docFullscreen} panel={docPanel} onClose={() => setDocOpen(false)} onFullscreen={() => setDocFullscreen(value => !value)} onPanel={setDocPanel} onMenu={setMenu} onModal={setModal} />
        
        </>}

      {menu && <div className="wb-popover" role="menu">
          <strong>{menu}</strong>
          <button type="button" onClick={() => setMenu('添加到对话')}>
            <Icon name="chat" />添加到对话
          </button>
          <button type="button" onClick={() => setMenu('重跑任务')}>
            <Icon name="refresh" />重跑
          </button>
          <button type="button" onClick={() => setMenu('下载')}>
            下载
          </button>
          <button type="button" className="is-danger" onClick={() => setMenu('删除确认')}>
            <Icon name="close" />删除
          </button>
          <button type="button" className="wb-popover-close" onClick={() => setMenu('')}>
            关闭
          </button>
        </div>}

      {modal && <div className="wb-modal-backdrop">
          <section className="wb-modal" role="dialog" aria-label={modal}>
            <header>
              <h2>{modal}</h2>
              <button type="button" onClick={() => setModal('')} aria-label="关闭">
                <Icon name="close" />
              </button>
            </header>
            <div className="wb-modal-body">
              <p>这里用于表达 Vue 原型中的弹窗态。画布版本保留视觉结构，不执行真实业务。</p>
              <div className="wb-form-grid">
                <label>名称<input value="疑点归纳与交叉核对" readOnly /></label>
                <label>范围<input value="当前工作台资料与结果" readOnly /></label>
                <label>状态<input value="待确认" readOnly /></label>
              </div>
            </div>
            <footer>
              <button type="button" onClick={() => setModal('')}>取消</button>
              <button type="button" className="is-primary" onClick={() => setModal('')}>确认</button>
            </footer>
          </section>
        </div>}
    </div>;
}