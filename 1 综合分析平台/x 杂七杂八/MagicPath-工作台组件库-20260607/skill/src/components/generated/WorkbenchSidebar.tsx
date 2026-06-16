import { Icon } from './Icon';
import { conversations, tasks, type MainView } from './data';

type Props = {
  activeConversation: string;
  activeTask: string;
  activeView: MainView;
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onConversation: (id: string) => void;
  onTask: (id: string) => void;
  onView: (view: MainView) => void;
  onMenu: (label: string) => void;
};

export function WorkbenchSidebar(props: Props) {
  return (
    <aside className="wb-sidebar" aria-label="工作台对话与任务">
      <div className="wb-brand">
        <button
          type="button"
          className="wb-brand-mark"
          title={props.collapsed ? '展开左栏' : '浙江审计综合分析'}
          aria-label={props.collapsed ? '展开左栏' : '浙江审计综合分析'}
          onClick={props.collapsed ? props.onExpand : undefined}
        >
          <span className="wb-brand-logo"><Icon name="workbench" /></span>
          <span className="wb-brand-expand"><Icon name="panel" /></span>
        </button>
        <span className="wb-brand-text">
          <strong>浙江审计综合分析</strong>
          <em>Audit Analytics</em>
        </span>
        <button type="button" className="wb-icon-btn wb-collapse-btn" onClick={props.onCollapse} aria-label="收起左栏">
          <Icon name="panel" />
        </button>
      </div>

      <nav className="wb-sidebar-actions" aria-label="主内容">
        <button type="button" onClick={() => props.onConversation('summary')}>
          <Icon name="plus" /><span>新建会话</span>
        </button>
        <button type="button" onClick={() => props.onView('task')}>
          <Icon name="plus" /><span>新建任务</span>
        </button>
        <button type="button" className={props.activeView === 'search' ? 'is-active' : ''} onClick={() => props.onView('search')}>
          <Icon name="search" /><span>搜索</span>
        </button>
        <button type="button" className={props.activeView === 'skill' ? 'is-active' : ''} onClick={() => props.onView('skill')}>
          <Icon name="book" /><span>技能</span>
        </button>
      </nav>

      <section className="wb-sidebar-list" aria-label="历史对话和任务列表">
        <h2>A市城建集团年度经济责任审计</h2>
        <div className="wb-section-head">
          <span><Icon name="chevron" />对话</span>
          <em>{conversations.length}</em>
        </div>
        <div className="wb-list">
          {conversations.map((item) => (
            <button key={item.id} type="button" className={item.id === props.activeConversation ? 'is-active' : ''} onClick={() => props.onConversation(item.id)}>
              <Icon name="chat" />
              <span>{item.title}</span>
              <em>{item.time}</em>
            </button>
          ))}
        </div>
        <div className="wb-section-head wb-task-head">
          <span><Icon name="chevron" />任务</span>
          <em>{tasks.length}</em>
        </div>
        <div className="wb-list wb-task-list">
          {tasks.map((item) => (
            <button key={item.id} type="button" className={item.id === props.activeTask ? 'is-active' : ''} onClick={() => props.onTask(item.id)} onContextMenu={(event) => { event.preventDefault(); props.onMenu(item.title); }}>
              <Icon name={item.icon} />
              <span>{item.title}</span>
              {item.time ? <em>{item.time}</em> : <i className={`wb-status-dot is-${item.status}`} />}
            </button>
          ))}
        </div>
      </section>

      <button type="button" className="wb-settings" onClick={() => props.onMenu('编辑工作台')}>
        <Icon name="tool" /><span>设置</span>
      </button>
    </aside>
  );
}
