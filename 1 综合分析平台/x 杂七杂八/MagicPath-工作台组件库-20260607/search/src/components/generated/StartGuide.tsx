import { Icon } from './Icon';
import { startActions } from './data';
type StartGuideProps = {
  activeAction: string;
  onActionChange: (id: string) => void;
};
export function StartGuide({
  activeAction,
  onActionChange
}: StartGuideProps) {
  return <div className="mp-intro">
      <div className="mp-logo-row" aria-label="MindJunc 图灵综合分析平台">
        <div className="mp-logo-mark">
          <span />
          <span />
          <span />
        </div>
        <div>
          <strong>MindJunc</strong>
          <span>图灵综合分析平台</span>
        </div>
      </div>
      <h2>你好，本次审计从哪里开始?</h2>
      <div className="mp-start-actions">
        {startActions.map(action => <button key={action.id} type="button" className={activeAction === action.id ? 'is-selected' : ''} onClick={() => onActionChange(action.id)}>
          
            <Icon name={action.icon} />
            <strong>{action.title}</strong>
            <span>{action.subtitle}</span>
          </button>)}
      </div>
    </div>;
}