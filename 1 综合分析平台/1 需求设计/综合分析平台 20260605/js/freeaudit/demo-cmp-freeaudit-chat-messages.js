(function () {
  const app = window.__DEMO_APP;
  if (!app) return;

  function makeTextBlock(msg) {
    return { type: 'text', content: msg && msg.text ? msg.text : '' };
  }

  function legacyDecisionToBlock(msg) {
    const d = (msg && msg.resultDecision) || {};
    return {
      type: 'decision.resultTree',
      id: msg && msg.id,
      status: d.status || 'pending',
      title: d.title || '是否变更结果',
      timeoutLabel: d.timeoutLabel || '',
      actionLabel: d.actionLabel || '',
      objectTitle: d.objectTitle || '',
      objectType: d.objectType || '',
      path: d.path || '',
      impact: d.impact || '',
      summary: d.summary || '',
      items: Array.isArray(d.items) ? d.items.slice() : [],
    };
  }

  app.component('ChatThinkingMessage', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
    },
    template: `
      <div class="nlm-thinking">
        <transition-group name="nlm-step" tag="div" class="nlm-thinking-steps nlm-tool-calls">
          <ChatToolCallBlock
            v-for="(call, i) in host.visibleToolCalls(msg)"
            :key="i"
            :host="host"
            :msg="msg"
            :call="call"
            :index="i"
          />
        </transition-group>
      </div>
    `,
  });

  app.component('ChatMessage', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
    },
    computed: {
      blocks() {
        if (Array.isArray(this.msg.blocks) && this.msg.blocks.length) return this.msg.blocks;
        if (this.msg.chatIntro) return [{ type: 'resultWrite' }];
        if (this.msg.resultDecision) return [legacyDecisionToBlock(this.msg)];
        return [makeTextBlock(this.msg)];
      },
      messageClass() {
        return [
          'nlm-msg',
          this.msg.role,
          {
            'nlm-msg--split-result': this.msg.role === 'bot' && this.blocks.some((block) => block && block.type === 'resultWrite'),
            'nlm-msg--approval-trace': this.msg.role === 'bot' && this.blocks.some((block) => block && block.type === 'tool.approval'),
            'nlm-msg--plain-bot-text': this.msg.role === 'bot' && !!this.msg.plainBotText,
          },
        ];
      },
      showActions() {
        return this.msg.role === 'bot' && !this.msg.chatIntro && !this.msg.suppressActions && !this.msg.resultDecision;
      },
    },
    methods: {
      blockKey(block, index) {
        return (block && (block.id || block.type)) ? `${block.id || block.type}-${index}` : `block-${index}`;
      },
      isTextBlock(block) {
        return !block || !block.type || block.type === 'text';
      },
      isDecisionBlock(block) {
        return block && String(block.type || '') === 'decision.resultTree';
      },
      isApprovalToolBlock(block) {
        return block && String(block.type || '') === 'tool.approval';
      },
    },
    template: `
      <div :class="['nlm-chat-turn', { 'nlm-chat-turn--tool-trace': msg.role === 'thinking' }]">
        <ChatThinkingMessage v-if="msg.role === 'thinking'" :host="host" :msg="msg" />
        <transition v-else name="nlm-msg-enter">
          <div :key="msg.id" class="nlm-msg-row">
            <div class="nlm-msg-wrap">
              <div
                :class="messageClass"
                @click="host.onMsgBubbleClick(msg, $event)"
                @mouseover="host.onChatMsgMouseEnter($event)"
                @mouseleave="host.onChatMsgMouseLeave($event)"
              >
                <template v-if="msg.role === 'bot'">
                  <template v-for="(block, index) in blocks" :key="blockKey(block, index)">
                    <ResultWriteBlock v-if="block && block.type === 'resultWrite'" :host="host" :msg="msg" :block="block" />
                    <ApprovalToolBlock v-else-if="isApprovalToolBlock(block)" :host="host" :msg="msg" :block="block" />
                    <DecisionCardBlock v-else-if="isDecisionBlock(block)" :host="host" :msg="msg" :block="block" />
                    <BotTextBlock v-else-if="isTextBlock(block)" :host="host" :msg="msg" :block="block" />
                  </template>
                </template>
                <span v-else v-html="host.renderMessage(msg)" @click="host.onChatMarkdownBodyClick($event)"></span>
              </div>
              <div v-if="msg.role === 'user' && (msg.refCount || 0) > 0" class="nlm-msg-refs-hint">引用 {{ msg.refCount }} 项</div>
              <div v-if="showActions" class="msg-actions">
                <button type="button" class="msg-action-btn" @click="host.openSummarizeToTemplateModal(msg)"><ds-icon name="file-contract" />总结为技能</button>
                <button type="button" class="msg-action-btn" @click="host.copyMessage(msg)"><ds-icon name="copy" />复制</button>
                <button type="button" class="msg-action-btn" title="保存到结果" aria-label="保存到结果" @click="host.openSaveResultModal(msg)"><ds-icon name="save" />保存</button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    `,
  });

  app.component('ChatMessageList', {
    props: {
      host: { type: Object, required: true },
    },
    methods: {
      setMessagesRef(el) {
        if (this.host && this.host.$refs) this.host.$refs.chatMessages = el || undefined;
      },
    },
    template: `
      <div class="nlm-chat-messages" :ref="setMessagesRef">
        <div
          v-if="host.workbenchProjectId && host.workbenchResourcePanelEmpty && !(host.chatMessages || []).length"
          class="nlm-empty-state nlm-empty-state--guide nlm-empty-state--start"
        >
          <img class="nlm-empty-brand-logo" src="./assets/generated/综合分析平台logo.png" alt="综合分析平台" />
          <h2 class="nlm-empty-title">你好，本次审计从哪里开始？</h2>
          <div class="nlm-guide-actions nlm-guide-actions--resource-start">
            <button type="button" class="nlm-guide-card" @click="host.openProjectCenterUpload">
              <span class="nlm-guide-card__icon"><ds-icon name="folder" aria-hidden="true" /></span>
              <span class="nlm-guide-card__title">审文件</span>
              <span class="nlm-guide-card__desc">上传资料或压缩包</span>
            </button>
            <button type="button" class="nlm-guide-card" @click="host.openWorkbenchDbAddModal">
              <span class="nlm-guide-card__icon"><ds-icon name="database" aria-hidden="true" /></span>
              <span class="nlm-guide-card__title">查数据</span>
              <span class="nlm-guide-card__desc">添加数据库表</span>
            </button>
            <button type="button" class="nlm-guide-card" @click="host.openWorkbenchGraphAddModal">
              <span class="nlm-guide-card__icon"><svg class="iconpark-icon" aria-hidden="true"><use href="#map-draw"></use></svg></span>
              <span class="nlm-guide-card__title">查人或关系</span>
              <span class="nlm-guide-card__desc">配置数据图谱</span>
            </button>
          </div>
        </div>
        <div v-else-if="host.workbenchProjectId && !(host.chatMessages || []).length" class="nlm-empty-state nlm-empty-state--guide nlm-empty-state--start">
          <h2 class="nlm-empty-title">资源已就绪，接下来想怎么审？</h2>
          <div :class="['nlm-guide-actions', 'nlm-guide-actions--audit-start', { 'nlm-guide-actions--audit-start-two': !host.workbenchTemplateTotalCount }]">
            <button type="button" class="nlm-guide-card" @click="host.focusChatInput">
              <span class="nlm-guide-card__icon"><ds-icon name="chat-ref" aria-hidden="true" /></span>
              <span class="nlm-guide-card__title">直接提问</span>
              <span class="nlm-guide-card__desc">围绕当前资料追问、核对、总结</span>
            </button>
            <button type="button" class="nlm-guide-card" @click="host.workbenchLeftPrimaryTab = 'skill'; host.sourcesCollapsed = false; host.sourcesLeftView = 'list'">
              <span class="nlm-guide-card__icon"><svg class="iconpark-icon" aria-hidden="true"><use href="#book-open"></use></svg></span>
              <span class="nlm-guide-card__title">配置技能</span>
              <span class="nlm-guide-card__desc">创建或引用审计方法（技能）</span>
            </button>
            <button v-if="host.workbenchTemplateTotalCount" type="button" class="nlm-guide-card" @click="host.handleWorkbenchTaskCreate">
              <span class="nlm-guide-card__icon"><ds-icon name="edit-one" class="is-task-single" aria-hidden="true" /></span>
              <span class="nlm-guide-card__title">创建任务</span>
              <span class="nlm-guide-card__desc">重复执行技能，批量审计</span>
            </button>
          </div>
        </div>
        <div v-else-if="host.workbenchResourcePanelEmpty && !(host.chatMessages || []).length" class="nlm-empty-state">
          <p class="nlm-empty-desc">待上传资料并完成技能配置后，执行技能以查看结果。</p>
        </div>
        <div v-else-if="!(host.chatMessages || []).length" class="nlm-suggestions"></div>
        <template v-else>
          <ChatMessage v-for="msg in host.chatMessages" :key="msg.id" :host="host" :msg="msg" />
        </template>
      </div>
    `,
  });

  app.component('ChatPanelShell', {
    props: {
      host: { type: Object, required: true },
    },
    template: `
      <div class="nlm-chat-body" @dragover.prevent @drop="host.onChatAreaDrop">
        <ChatMessageList :host="host" />
      </div>
    `,
  });

  app.component('ChatHeaderActions', {
    props: {
      host: { type: Object, required: true },
    },
    template: `<slot />`,
  });

  app.component('ChatComposer', {
    props: {
      host: { type: Object, required: true },
    },
    template: `<slot />`,
  });
})();
