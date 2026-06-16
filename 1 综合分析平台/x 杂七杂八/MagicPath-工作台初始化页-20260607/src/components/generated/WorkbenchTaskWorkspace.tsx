import { Icon } from './Icon';
import { batchChildren, tasks } from './data';
export function WorkbenchTaskWorkspace({
  activeTask,
  detailOpen,
  onBack,
  onOpenDoc,
  onMenu,
  onModal
}: {
  activeTask: string;
  detailOpen: boolean;
  onBack: () => void;
  onOpenDoc: () => void;
  onMenu: (label: string) => void;
  onModal: (label: string) => void;
}) {
  const task = tasks.find(item => item.id === activeTask) || tasks[1];
  return <section className="wb-stage wb-task-stage" aria-label="工作台任务">
      <aside className="wb-batch-pane">
        <div className="wb-pane-head">
          <button type="button" className="wb-icon-btn" onClick={onBack}><Icon name="back" /></button>
          <strong>{task.title}</strong>
          <button type="button" className="wb-icon-btn" onClick={() => onMenu('子任务更多')}><Icon name="more" /></button>
        </div>
        <div className="wb-filterbar">
          <button className="is-active">全部 8</button>
          <button>完成 4</button>
          <button>运行中 1</button>
          <button>失败 1</button>
        </div>
        <div className="wb-child-list">
          {batchChildren.map(child => <button key={child.id} type="button" className={`is-${child.status}`} onClick={onOpenDoc}>
              <Icon name={child.status === 'failed' ? 'warn' : child.status === 'done' ? 'check' : 'robot'} />
              <span>{child.title}</span>
              <em>{child.statusLabel}</em>
            </button>)}
        </div>
      </aside>
      <div className={`wb-task-context ${detailOpen ? 'is-detail-open' : ''}`}>
        <div className="wb-task-chat">
          <div className="wb-msg is-system">已根据企业名单创建 8 个子任务，当前正在执行工商登记信息检索。</div>
          <div className="wb-msg is-assistant">已完成 4 个主体的工商信息核对，发现 1 个供应商名称与付款账号存在简称差异，建议进入右侧资料区查看证据。</div>
          <div className="wb-tool-line"><Icon name="check" />读取 企业名单.xlsx / 企业名称列</div>
          <div className="wb-tool-line"><Icon name="robot" />调用 施工合同与发票一致性核查 技能</div>
          <div className="wb-tool-line is-running"><Icon name="refresh" />生成结构化摘要与疑点清单</div>
          <button type="button" className="wb-inline-card" onClick={() => onModal('基本信息')}>
            <Icon name="info" />
            <span>查看任务基本信息与执行参数</span>
          </button>
        </div>
        {detailOpen && <aside className="wb-floating-detail">
            <header>
              <strong>{task.title}</strong>
              <button type="button" onClick={() => onModal('基本信息')}><Icon name="info" />基本信息</button>
            </header>
            <section>
              <h3>输入资料</h3>
              <p><Icon name="file" />企业名单.xlsx</p>
              <p><Icon name="file" />施工合同节选（演示）.pdf</p>
            </section>
            <section>
              <h3>执行要求</h3>
              <p>针对企业名称列逐行查询工商登记信息，输出主体名称、统一社会信用代码、法定代表人与风险提示。</p>
            </section>
            <section>
              <h3>输出结果</h3>
              <p><Icon name="file" />企业工商信息批量查询结果.md</p>
            </section>
          </aside>}
      </div>
    </section>;
}