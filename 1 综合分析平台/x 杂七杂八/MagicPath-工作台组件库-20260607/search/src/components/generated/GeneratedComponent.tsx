import { useState } from 'react';
import { WorkbenchSearchView } from './WorkbenchSearchView';
import type { MainView } from './data';

export const GeneratedComponent = () => {
  const [hint, setHint] = useState('');
  return (
    <div className="wb-asset-preview wb-asset-preview--stage">
      <header className="wb-header"><h1>搜索</h1></header>
      <WorkbenchSearchView onView={(view: MainView) => setHint(`切换到 ${view}`)} onTask={(id) => setHint(`打开任务 ${id}`)} />
      {hint && <div className="wb-popover"><strong>{hint}</strong><button type="button" onClick={() => setHint('')}>关闭</button></div>}
    </div>
  );
};
