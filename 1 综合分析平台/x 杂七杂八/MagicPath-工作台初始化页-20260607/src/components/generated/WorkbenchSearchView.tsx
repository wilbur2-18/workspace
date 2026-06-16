import { Icon } from './Icon';
import { conversations, tasks, type MainView } from './data';
export function WorkbenchSearchView({
  onView,
  onTask
}: {
  onView: (view: MainView) => void;
  onTask: (id: string) => void;
}) {
  return <section className="wb-stage wb-search-view" aria-label="工作台搜索">
      <div className="wb-search-shell">
        <label className="wb-search-input"><Icon name="search" /><input placeholder="搜索对话、任务" defaultValue="合同" /></label>
        <div className="wb-search-columns">
          <section>
            <header><h2>最近对话</h2><span>{conversations.length}</span></header>
            {conversations.map(item => <button key={item.id} type="button" className="wb-wide-card" onClick={() => onView('chat')}>
                <Icon name="chat" />
                <span><strong>{item.title}</strong><em>{item.time}</em></span>
              </button>)}
          </section>
          <section>
            <header><h2>最近任务</h2><span>{tasks.length}</span></header>
            {tasks.slice(0, 5).map(item => <button key={item.id} type="button" className="wb-wide-card" onClick={() => {
            onTask(item.id);
            onView('task');
          }}>
                <Icon name={item.icon} />
                <span><strong>{item.title}</strong><em>{item.statusLabel}</em></span>
                <b className={`wb-status is-${item.status}`}>{item.statusLabel}</b>
              </button>)}
          </section>
        </div>
      </div>
    </section>;
}