import { useState } from 'react';
import { WorkbenchDocWorkspace } from './WorkbenchDocWorkspace';
import type { DocPanel } from './data';

export const GeneratedComponent = () => {
  const [panel, setPanel] = useState<DocPanel>('result');
  const [fullscreen, setFullscreen] = useState(false);
  const [hint, setHint] = useState('');
  return (
    <div className="wb-asset-preview wb-asset-preview--doc">
      <WorkbenchDocWorkspace
        fullscreen={fullscreen}
        panel={panel}
        onClose={() => setHint('收起资料工作区')}
        onFullscreen={() => setFullscreen((value) => !value)}
        onPanel={setPanel}
        onMenu={setHint}
        onModal={setHint}
      />
      {hint && <div className="wb-popover"><strong>{hint}</strong><button type="button" onClick={() => setHint('')}>关闭</button></div>}
    </div>
  );
};
