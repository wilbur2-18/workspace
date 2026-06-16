import { useState } from 'react';
import { WorkbenchSidebar } from './WorkbenchSidebar';
import type { MainView } from './data';

export const GeneratedComponent = () => {
  const [activeView, setActiveView] = useState<MainView>('chat');
  const [collapsed, setCollapsed] = useState(false);
  const [conversation, setConversation] = useState('summary');
  const [task, setTask] = useState('business-query');
  return (
    <div className={`wb-asset-preview wb-asset-preview--sidebar wb-shell ${collapsed ? 'is-sidebar-collapsed' : ''}`}>
      <WorkbenchSidebar
        activeConversation={conversation}
        activeTask={task}
        activeView={activeView}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(true)}
        onExpand={() => setCollapsed(false)}
        onConversation={setConversation}
        onTask={setTask}
        onView={setActiveView}
        onMenu={() => {}}
      />
    </div>
  );
};
