import { useState } from 'react';
import { WorkbenchTaskWorkspace } from './WorkbenchTaskWorkspace';

export const GeneratedComponent = () => {
  const [detailOpen, setDetailOpen] = useState(true);
  const [hint, setHint] = useState('');
  return (
    <div className="wb-asset-preview wb-asset-preview--stage">
      <header className="wb-header">
        <h1>企业工商信息批量查询</h1>
        <div className="wb-header-actions">
          <button type="button" onClick={() => setDetailOpen((value) => !value)}>
            <span>{detailOpen ? '隐藏任务详情' : '显示任务详情'}</span>
          </button>
        </div>
      </header>
      <WorkbenchTaskWorkspace
        activeTask="business-query"
        detailOpen={detailOpen}
        onBack={() => setHint('返回对话')}
        onOpenDoc={() => setHint('展开资料工作区')}
        onMenu={setHint}
        onModal={setHint}
      />
      {hint && <div className="wb-popover"><strong>{hint}</strong><button type="button" onClick={() => setHint('')}>关闭</button></div>}
    </div>
  );
};
