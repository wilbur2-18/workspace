import { Composer } from './Composer';
import { Icon } from './Icon';
import { StartGuide } from './StartGuide';
type WorkbenchMainProps = {
  activeAction: string;
  draft: string;
  onActionChange: (id: string) => void;
  onDraftChange: (value: string) => void;
};
export function WorkbenchMain({
  activeAction,
  draft,
  onActionChange,
  onDraftChange
}: WorkbenchMainProps) {
  return <main className="mp-main">
      <header className="mp-header">
        <h1>初始化引导样例</h1>
        <div className="mp-header-actions">
          <button type="button">
            <Icon name="brain" />
            <span>生成技能</span>
          </button>
          <button className="mp-header-icon" type="button" aria-label="展开右栏">
            <Icon name="split" />
          </button>
        </div>
      </header>

      <section className="mp-stage" aria-label="初始化引导">
        <StartGuide activeAction={activeAction} onActionChange={onActionChange} />
        <Composer draft={draft} onDraftChange={onDraftChange} />
        <p className="mp-disclaimer">系统生成内容需人工核查，审计结论以人工确认为准。</p>
      </section>
    </main>;
}