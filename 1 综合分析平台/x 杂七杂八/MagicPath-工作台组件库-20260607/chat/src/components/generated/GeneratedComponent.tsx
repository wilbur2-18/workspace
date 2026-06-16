import { useState } from 'react';
import { WorkbenchChatStage } from './WorkbenchChatStage';

export const GeneratedComponent = () => {
  const [hint, setHint] = useState('');
  return (
    <div className="wb-asset-preview wb-asset-preview--stage">
      <header className="wb-header">
        <h1>总结当前工作台中的主要疑点</h1>
        <div className="wb-header-actions">
          <button type="button" onClick={() => setHint('生成技能')}>
            <span>生成技能</span>
          </button>
        </div>
      </header>
      <WorkbenchChatStage onOpenDoc={() => setHint('展开资料工作区')} onMenu={setHint} />
      {hint && <div className="wb-popover"><strong>{hint}</strong><button type="button" onClick={() => setHint('')}>关闭</button></div>}
    </div>
  );
};
