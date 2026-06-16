import { useState } from 'react';
import { WorkbenchSkillView } from './WorkbenchSkillView';

export const GeneratedComponent = () => {
  const [hint, setHint] = useState('');
  return (
    <div className="wb-asset-preview wb-asset-preview--stage">
      <header className="wb-header">
        <h1>技能</h1>
        <div className="wb-header-actions">
          <button type="button" onClick={() => setHint('引用技能')}>引用技能</button>
          <button type="button" onClick={() => setHint('创建技能')}>创建技能</button>
        </div>
      </header>
      <WorkbenchSkillView onMenu={setHint} onModal={setHint} />
      {hint && <div className="wb-popover"><strong>{hint}</strong><button type="button" onClick={() => setHint('')}>关闭</button></div>}
    </div>
  );
};
