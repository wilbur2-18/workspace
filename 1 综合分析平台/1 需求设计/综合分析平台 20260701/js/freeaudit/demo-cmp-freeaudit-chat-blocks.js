(function () {
  const app = window.__DEMO_APP;
  if (!app) return;

  function h(vm) {
    return vm && vm.host ? vm.host : {};
  }

  function decisionStatusText(status) {
    return {
      pending: '待决策',
      approved: '用户已同意',
      rejected: '用户已拒绝',
      timeout: '已超时，默认取消',
    }[status] || '待决策';
  }

  function decisionStatusIcon(status) {
    return {
      pending: 'loading-four',
      approved: 'check-one',
      rejected: 'close-one',
      timeout: 'close-one',
    }[status] || 'loading-four';
  }

  app.component('BotTextBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      block: { type: Object, default: () => ({}) },
    },
    computed: {
      html() {
        const host = h(this);
        const raw = this.block && this.block.content != null ? this.block.content : this.msg.text || '';
        return host.renderMarkdownFromBotText ? host.renderMarkdownFromBotText(raw, this.msg) : String(raw || '');
      },
    },
    template: `<span v-html="html" @click="host.onChatMarkdownBodyClick && host.onChatMarkdownBodyClick($event)"></span>`,
  });

  app.component('DeepThinkBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    template: `
      <div class="nlm-tool-deep-think" :class="{ 'nlm-tool-deep-think--collapsed': host.isDeepThinkCollapsed(msg, index) }">
        <template v-if="!host.isDeepThinkCollapsed(msg, index)">
          <div class="nlm-tool-deep-think__head">
            <span class="nlm-tool-deep-think__head-ic" aria-hidden="true">
              <a-spin size="small" class="nlm-tool-deep-think__spin" />
            </span>
            <span class="nlm-tool-deep-think__label">思考中</span>
          </div>
          <div class="nlm-tool-deep-think__quote">
            <p class="nlm-tool-stream-text nlm-tool-deep-think__body">{{ host.thinkingTextSlice(msg, call, index) }}</p>
          </div>
        </template>
        <template v-else>
          <button
            type="button"
            class="nlm-tool-deep-think__toggle"
            :aria-expanded="!!call.deepThinkUserExpanded"
            aria-label="展开或收起思考过程"
            @click.stop="host.toggleDeepThinkUserExpand(call)"
          >
            <span class="nlm-tool-deep-think__toggle-text">思考 {{ host.formatDeepThinkSeconds(call) }}</span>
            <ds-icon name="chevron-right" class="nlm-tool-deep-think__toggle-chevron" :class="{ 'is-expanded': call.deepThinkUserExpanded }" aria-hidden="true" />
          </button>
          <div v-if="call.deepThinkUserExpanded" class="nlm-tool-deep-think__quote nlm-tool-deep-think__quote--replay">
            <p class="nlm-tool-stream-text nlm-tool-deep-think__body">{{ call.body || '' }}</p>
          </div>
        </template>
      </div>
    `,
  });

  app.component('ToolCallDetailPanel', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    template: `
      <div v-if="call._actionDetailExpanded && host.toolCallActionDetailBody(call)" class="nlm-tool-call-action-detail analysis-result-preview-modal__panel nlm-chat-result-md-panel">
        <div class="analysis-result-preview-modal__panel-hd analysis-result-preview-modal__panel-hd--sub analysis-result-preview-modal__panel-hd--editor-toolbar nlm-chat-result-md-toolbar nlm-tool-call-action-detail-hd">
          <span class="analysis-result-preview-modal__panel-hd-label">{{ host.toolCallActionDetailTitle(call) }}</span>
          <div class="analysis-result-preview-modal__panel-hd-actions">
            <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn" title="复制" aria-label="复制" @click.stop="host.copyToolCallActionDetail(call)">
              <ds-icon name="copy" class="ds-trigger-btn__icon" aria-hidden="true" />
              <span class="ds-trigger-btn__text">复制</span>
            </button>
          </div>
        </div>
        <div class="analysis-result-preview-modal__panel-body nlm-tool-call-action-detail-body">
          <div class="nlm-tool-call-action-detail-lines" role="region" aria-label="工具调用明细">
            <div v-for="(dln, dli) in host.toolCallActionDetailLines(call)" :key="'tdl-' + msg.id + '-' + index + '-' + dli" class="nlm-tool-call-action-detail-line">
              <span class="nlm-tool-call-action-detail-line__gutter">{{ dli + 1 }}</span>
              <span class="nlm-tool-call-action-detail-line__code">{{ dln }}</span>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  app.component('ToolActionLineBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    computed: {
      label() {
        if (this.call.type === 'read') return `阅读 《${this.call.fileLabel}》 L${this.call.lineStart}-L${this.call.lineEnd}`;
        if (this.call.type === 'query') return `查询 ${this.call.text}`;
        if (this.call.type === 'skill') return `调用 ${this.call.name} 技能`;
        if (this.call.type === 'analysis') return h(this).analysisToolCallLabel(this.call);
        return this.call.text || this.call.name || '';
      },
      status() {
        return h(this).toolCallActionStatus(this.msg, this.index, this.call);
      },
    },
    template: `
      <div class="nlm-tool-call-action-with-detail">
        <div
          class="nlm-tool-call-action-toolbar"
          :class="{ 'nlm-tool-call-action-toolbar--expandable': !!host.toolCallActionDetailBody(call) }"
          :tabindex="host.toolCallActionDetailBody(call) ? 0 : -1"
          :role="host.toolCallActionDetailBody(call) ? 'button' : undefined"
          :aria-expanded="host.toolCallActionDetailBody(call) ? !!call._actionDetailExpanded : undefined"
          :aria-label="host.toolCallActionDetailBody(call) ? (call._actionDetailExpanded ? '收起详情' : '展开详情') : undefined"
          :title="host.toolCallActionDetailBody(call) ? (call._actionDetailExpanded ? '收起详情' : '展开详情') : undefined"
          @click="host.toolCallActionDetailBody(call) && host.toggleToolCallActionDetailExpand(call)"
          @keydown.enter.prevent="host.toolCallActionDetailBody(call) && host.toggleToolCallActionDetailExpand(call)"
          @keydown.space.prevent="host.toolCallActionDetailBody(call) && host.toggleToolCallActionDetailExpand(call)"
        >
          <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line" :class="{ 'nlm-tool-call-line--running': status === 'running' }">
            <span class="nlm-tool-call-line__ic" aria-hidden="true">
              <svg v-if="status === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
              <svg v-else-if="status === 'ok'" class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
              <svg v-else-if="status === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
            </span>
            <span class="nlm-tool-call-line__txt">{{ label }}</span>
            <span v-if="host.toolCallActionDetailBody(call)" class="nlm-tool-call-action-expand-btn" aria-hidden="true">
              <ds-icon name="chevron-right" class="nlm-tool-deep-think__toggle-chevron" :class="{ 'is-expanded': call._actionDetailExpanded }" aria-hidden="true" />
            </span>
          </p>
        </div>
        <ToolCallDetailPanel :host="host" :msg="msg" :call="call" :index="index" />
      </div>
    `,
  });

  app.component('TodoToolCard', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    methods: {
      logLabel(ex) {
        if (!ex) return '';
        if (ex.kind === 'query') return `查询 ${ex.text}`;
        if (ex.kind === 'read') return `阅读 《${ex.fileLabel}》 L${ex.lineStart}-L${ex.lineEnd}`;
        if (ex.kind === 'edit') return `编辑 《${ex.fileName}》 · ${ex.detail}`;
        return ex.text || '';
      },
    },
    template: `
      <template>
        <div class="nlm-tool-todo" :class="{ 'nlm-tool-todo--running': host.toolCallActionStatus(msg, index, call) === 'running' }">
          <div class="nlm-tool-todo__hd">
            <span class="nlm-tool-call-line__ic nlm-tool-todo__hd-ic" aria-hidden="true">
              <svg v-if="host.toolCallActionStatus(msg, index, call) === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
              <svg v-else-if="host.toolCallActionStatus(msg, index, call) === 'ok'" class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
              <svg v-else-if="host.toolCallActionStatus(msg, index, call) === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
            </span>
            <span class="nlm-tool-todo__hd-txt">{{ host.todoCardHeaderLabel(msg, index, call) }}</span>
          </div>
          <ul v-show="host.todoTaskListVisible(msg, index, call)" class="nlm-tool-todo__ul nlm-tool-todo__ul--plan" role="list">
            <li
              v-for="(todoItem, ti) in (call.items || [])"
              :key="ti"
              class="nlm-tool-todo__li"
              :class="{ 'nlm-tool-todo__li--done': host.todoItemIsDone(call, ti) }"
            >
              <span class="nlm-tool-todo__num" aria-hidden="true">{{ ti + 1 }}</span>
              <span class="nlm-tool-todo__txt">{{ todoItem }}</span>
            </li>
          </ul>
        </div>
        <div v-if="(call.todoExecutionLog || []).length && host.todoTaskListVisible(msg, index, call)" class="nlm-tool-todo-follow" role="log" aria-live="polite">
          <template v-for="ex in (call.todoExecutionLog || [])" :key="ex.id">
            <p v-if="ex.kind === 'think'" class="nlm-tool-stream-text nlm-tool-todo-follow__think">{{ ex.text }}</p>
            <p
              v-else-if="ex.kind === 'query' || ex.kind === 'read' || ex.kind === 'edit'"
              class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line nlm-tool-todo-follow__line"
              :class="{ 'nlm-tool-call-line--running': ex.running }"
            >
              <span class="nlm-tool-call-line__ic" aria-hidden="true">
                <svg v-if="ex.running" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
                <svg v-else class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
              </span>
              <span class="nlm-tool-call-line__txt">{{ logLabel(ex) }}</span>
            </p>
          </template>
        </div>
      </template>
    `,
  });

  app.component('EditToolPanel', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    template: `
      <div class="analysis-result-preview-modal__panel nlm-chat-result-md-panel nlm-tool-md-editor">
        <div
          class="analysis-result-preview-modal__panel-hd analysis-result-preview-modal__panel-hd--sub analysis-result-preview-modal__panel-hd--editor-toolbar nlm-chat-result-md-toolbar nlm-tool-md-editor__hd--clickable"
          role="button"
          tabindex="0"
          title="预览对应结果"
          aria-label="预览对应结果"
          @click.stop="host.openChatToolEditPreview(call)"
          @keydown.enter.prevent.stop="host.openChatToolEditPreview(call)"
          @keydown.space.prevent.stop="host.openChatToolEditPreview(call)"
        >
          <span class="analysis-result-preview-modal__panel-hd-label nlm-tool-md-editor__label">
            <span class="nlm-tool-md-editor__hd-ic" aria-hidden="true">
              <svg v-if="host.toolCallActionStatus(msg, index, call) === 'ok'" class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
              <svg v-else-if="host.toolCallActionStatus(msg, index, call) === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
            </span>
            <span class="nlm-tool-md-editor__file">{{ call.fileName }}</span>
          </span>
          <div class="analysis-result-preview-modal__panel-hd-actions nlm-tool-md-editor__actions">
            <span class="nlm-tool-edit-stat nlm-tool-edit-stat--add" title="新增行">+{{ call.added }}</span>
            <span class="nlm-tool-edit-stat nlm-tool-edit-stat--del" title="删除行">-{{ call.removed }}</span>
          </div>
        </div>
        <div class="analysis-result-preview-modal__panel-body">
          <div v-if="host.toolCallStepPending(msg, index)" class="nlm-tool-edit-loading" role="status" aria-live="polite">
            <a-spin size="small" class="nlm-tool-edit-loading__spin" aria-hidden="true" />
            <span class="nlm-tool-edit-loading__tx">编辑中</span>
          </div>
          <template v-else>
            <div class="nlm-tool-diff-md nlm-tool-diff-md--embedded" role="region" aria-label="差异内容">
              <div
                v-for="(ln, di) in host.visibleToolDiffLines(call, call.diffExpanded)"
                :key="di"
                class="nlm-tool-diff-line"
                :class="host.toolDiffLineClass(ln)"
              ><span class="nlm-tool-diff-line__gutter">{{ di + 1 }}</span><span class="nlm-tool-diff-line__code">{{ ln }}</span></div>
            </div>
            <div v-if="(call.diffLines || []).length > 4" class="nlm-tool-diff-expand-row">
              <a-tooltip :title="call.diffExpanded ? '收起' : '展开'">
                <button
                  type="button"
                  class="nlm-tool-diff-expand-btn"
                  :title="call.diffExpanded ? '收起' : '展开'"
                  :aria-label="call.diffExpanded ? '收起 diff' : '展开完整 diff'"
                  @click.stop="host.toggleToolDiffExpand(call)"
                >
                  <ds-icon :name="call.diffExpanded ? 'up' : 'down'" aria-hidden="true" />
                </button>
              </a-tooltip>
            </div>
          </template>
        </div>
      </div>
    `,
  });

  app.component('ChatToolCallBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      call: { type: Object, required: true },
      index: { type: Number, required: true },
    },
    computed: {
      isStreamType() {
        return ['text', 'deep_think', 'read', 'query', 'skill', 'analysis', 'todo'].includes(this.call.type);
      },
    },
    template: `
      <div
        class="nlm-tool-call"
        :class="{
          'nlm-tool-call--done': host.toolCallIsDone(msg, index),
          'nlm-tool-call--plain': true,
          'nlm-tool-call--stream': isStreamType,
          'nlm-tool-call--md-shell': call.type === 'edit',
          'nlm-tool-call--section-break': !!call.sectionBreak,
        }"
      >
        <p v-if="call.type === 'text'" class="nlm-tool-stream-text">{{ host.thinkingTextSlice(msg, call, index) }}</p>
        <DeepThinkBlock v-else-if="call.type === 'deep_think'" :host="host" :msg="msg" :call="call" :index="index" />
        <ToolActionLineBlock v-else-if="call.type === 'read' || call.type === 'query' || call.type === 'skill' || call.type === 'analysis'" :host="host" :msg="msg" :call="call" :index="index" />
        <TodoToolCard v-else-if="call.type === 'todo'" :host="host" :msg="msg" :call="call" :index="index" />
        <EditToolPanel v-else-if="call.type === 'edit'" :host="host" :msg="msg" :call="call" :index="index" />
      </div>
    `,
  });

  app.component('ResultWriteBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      block: { type: Object, default: () => ({}) },
    },
    template: `
      <template>
        <div class="nlm-msg-chat-intro">{{ host.displayChatIntroSlice(msg) }}</div>
        <div v-if="host.chatIntroRevealMarkdown(msg)" class="nlm-tool-call-action-with-detail">
          <div
            class="nlm-tool-call-action-toolbar"
            :class="{ 'nlm-tool-call-action-toolbar--expandable': host.chatBotResultHasBody(msg) }"
            :tabindex="host.chatBotResultHasBody(msg) ? 0 : -1"
            :role="host.chatBotResultHasBody(msg) ? 'button' : undefined"
            :aria-expanded="host.chatBotResultHasBody(msg) ? !!msg._chatResultMdExpanded : undefined"
            :aria-label="host.chatBotResultHasBody(msg) ? (msg._chatResultMdExpanded ? '收起详情' : '展开详情') : undefined"
            :title="host.chatBotResultHasBody(msg) ? (msg._chatResultMdExpanded ? '收起详情' : '展开详情') : undefined"
            @click="host.chatBotResultHasBody(msg) && host.toggleChatBotResultMdExpand(msg)"
            @keydown.enter.prevent="host.chatBotResultHasBody(msg) && host.toggleChatBotResultMdExpand(msg)"
            @keydown.space.prevent="host.chatBotResultHasBody(msg) && host.toggleChatBotResultMdExpand(msg)"
          >
            <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line">
              <span class="nlm-tool-call-line__ic" aria-hidden="true"><svg class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg></span>
              <span class="nlm-tool-call-line__txt">{{ host.chatBotResultWriteLine(msg) }}</span>
              <span v-if="host.chatBotResultHasBody(msg)" class="nlm-tool-call-action-expand-btn" aria-hidden="true">
                <ds-icon name="chevron-right" class="nlm-tool-deep-think__toggle-chevron" :class="{ 'is-expanded': msg._chatResultMdExpanded }" aria-hidden="true" />
              </span>
            </p>
          </div>
          <div v-if="msg._chatResultMdExpanded && host.chatBotResultHasBody(msg)" class="nlm-tool-call-action-detail analysis-result-preview-modal__panel nlm-chat-result-md-panel">
            <div class="analysis-result-preview-modal__panel-hd analysis-result-preview-modal__panel-hd--sub analysis-result-preview-modal__panel-hd--editor-toolbar nlm-chat-result-md-toolbar nlm-tool-call-action-detail-hd">
              <span class="analysis-result-preview-modal__panel-hd-label">写入详情</span>
              <div class="analysis-result-preview-modal__panel-hd-actions">
                <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn" title="复制" aria-label="复制" @click.stop="host.copyChatBotResultMarkdown(msg)">
                  <ds-icon name="copy" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">复制</span>
                </button>
              </div>
            </div>
            <div class="analysis-result-preview-modal__panel-body nlm-tool-call-action-detail-body nlm-chat-bot-result-md-body">
              <div class="analysis-result-preview-modal__md nlm-msg-chat-md" v-html="host.renderMessageBodyHtml(msg)" @click="host.onChatMarkdownBodyClick($event)"></div>
            </div>
          </div>
        </div>
        <p v-if="msg.chatRunSummary && (msg.chatRunSummaryProgress || 0) > 0" class="nlm-msg-chat-run-summary">{{ msg.chatRunSummary.slice(0, msg.chatRunSummaryProgress || 0) }}</p>
      </template>
    `,
  });

  app.component('ApprovalToolBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      block: { type: Object, required: true },
    },
    data() {
      return {
        collapsedGroupIds: {},
      };
    },
    computed: {
      status() {
        return String(this.block.status || 'pending');
      },
      isCompleted() {
        return this.status !== 'pending';
      },
      statusIcon() {
        return this.host.approvalDecisionStatusIcon
          ? this.host.approvalDecisionStatusIcon(this.status)
          : decisionStatusIcon(this.status);
      },
      toolName() {
        return this.host.approvalDecisionToolName
          ? this.host.approvalDecisionToolName(this.block)
          : '工具';
      },
      cardTitle() {
        return `${this.toolName}调用审批`;
      },
      resultText() {
        if (this.status === 'approved') return '已允许';
        if (this.status === 'rejected') return '已拒绝';
        if (this.status === 'timeout') return '已超时';
        return '待确认';
      },
      rowLabel() {
        if (this.host.approvalDecisionRowLabel) return this.host.approvalDecisionRowLabel(this.block);
        const actionTitle = String(this.block.actionLabel || this.block.title || '待确认操作').replace(/^是否/, '');
        return `请求执行${actionTitle}动作`;
      },
      expanded() {
        return !!this.block._approvalTraceExpanded;
      },
      hasDetail() {
        return this.host.approvalDecisionHasDetail ? this.host.approvalDecisionHasDetail(this.block) : false;
      },
      technicalFields() {
        return this.host.approvalDecisionTechnicalFields ? this.host.approvalDecisionTechnicalFields(this.block) : [];
      },
      technicalCodeBlocks() {
        return this.host.approvalDecisionTechnicalCodeBlocks ? this.host.approvalDecisionTechnicalCodeBlocks(this.block) : [];
      },
    },
    methods: {
      toggleExpand() {
        this.block._approvalTraceExpanded = !this.block._approvalTraceExpanded;
      },
    },
    template: `
      <div v-if="isCompleted" class="nlm-approval-tool-trace" :class="'is-' + status">
        <div
          class="nlm-tool-call-action-toolbar nlm-tool-call-action-toolbar--expandable nlm-approval-tool-trace__toolbar"
          :aria-expanded="expanded"
          :aria-label="expanded ? '收起审批卡' : '展开审批卡'"
          :title="expanded ? '收起审批卡' : '展开审批卡'"
          role="button"
          tabindex="0"
          @click="toggleExpand"
          @keydown.enter.prevent="toggleExpand"
          @keydown.space.prevent="toggleExpand"
        >
          <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line">
            <span class="nlm-tool-call-line__ic nlm-approval-tool-trace__ic" aria-hidden="true">
              <svg
                class="iconpark-icon"
                :class="{
                  'nlm-tool-call-status--ok': status === 'approved',
                  'nlm-tool-call-status--fail': status === 'rejected' || status === 'timeout',
                }"
              >
                <use :href="'#' + statusIcon"></use>
              </svg>
            </span>
            <span class="nlm-tool-call-line__txt">{{ rowLabel }}</span>
            <span class="nlm-tool-call-action-expand-btn" aria-hidden="true">
              <ds-icon name="chevron-right" class="nlm-tool-deep-think__toggle-chevron" :class="{ 'is-expanded': expanded }" aria-hidden="true" />
            </span>
          </p>
        </div>
        <div v-if="expanded" class="nlm-approval-tool-card" :class="'is-' + status">
          <div class="nlm-approval-tool-card__head">
            <span class="nlm-approval-tool-card__head-title">工具调用请求</span>
            <span class="nlm-approval-tool-card__head-status">{{ resultText }}</span>
          </div>
          <div class="nlm-approval-tool-card__body">
            <div v-if="hasDetail" class="nlm-approval-tool-card__detail">
              <dl class="nlm-approval-tool-card__detail-fields">
                <template v-for="field in technicalFields" :key="field.label">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ field.value }}</dd>
                </template>
              </dl>
              <div v-for="codeBlock in technicalCodeBlocks" :key="codeBlock.title" class="nlm-approval-tool-card__detail-code-block">
                <div class="nlm-approval-tool-card__detail-code-title">{{ codeBlock.title }}</div>
                <pre class="nlm-approval-tool-card__detail-code">{{ codeBlock.code }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="nlm-approval-tool-trace" :class="'is-' + status">
        <div class="nlm-tool-call-action-toolbar nlm-approval-tool-trace__toolbar">
          <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line">
            <span class="nlm-tool-call-line__ic nlm-approval-tool-trace__ic" aria-hidden="true">
              <svg
                class="iconpark-icon"
                :class="{
                  'is-spin': status === 'pending',
                  'nlm-tool-call-status--ok': status === 'approved',
                  'nlm-tool-call-status--fail': status === 'rejected' || status === 'timeout',
                }"
              >
                <use :href="'#' + statusIcon"></use>
              </svg>
            </span>
            <span class="nlm-tool-call-line__txt">{{ rowLabel }}</span>
          </p>
        </div>
      </div>
    `,
  });

  app.component('DataScopeDecisionBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      block: { type: Object, required: true },
    },
    data() {
      return {
        collapsedGroupIds: {},
      };
    },
    computed: {
      pending() {
        return String(this.block.status || 'pending') === 'pending';
      },
      visibleGroups() {
        return this.host.dataScopeVisibleGroups ? this.host.dataScopeVisibleGroups(this.block) : [];
      },
      candidateGroups() {
        return this.host.dataScopeCandidateGroups ? this.host.dataScopeCandidateGroups(this.block) : [];
      },
      selectedCount() {
        return this.host.dataScopeSelectedCount ? this.host.dataScopeSelectedCount(this.block) : 0;
      },
      totalCount() {
        return this.host.dataScopeTotalCount ? this.host.dataScopeTotalCount(this.block) : 0;
      },
      groupCount() {
        return this.host.dataScopeGroupCount ? this.host.dataScopeGroupCount(this.block) : 0;
      },
      allVisibleSelected() {
        return this.host.dataScopeAllVisibleSelected ? this.host.dataScopeAllVisibleSelected(this.block) : false;
      },
      candidateCounts() {
        return this.host.dataScopeCandidateCounts ? this.host.dataScopeCandidateCounts(this.block) : { groups: 0, selected: 0, total: 0 };
      },
      candidateAllSelected() {
        const rows = this.candidateGroups.reduce((list, group) => list.concat(group.tables || []), []);
        return !!rows.length && rows.every((row) => row.selected);
      },
      candidatePartialSelected() {
        const rows = this.candidateGroups.reduce((list, group) => list.concat(group.tables || []), []);
        return rows.some((row) => row.selected) && !rows.every((row) => row.selected);
      },
      compact() {
        return !this.block.detailVisible;
      },
    },
    methods: {
      groupSelected(group) {
        const rows = group && group.tables ? group.tables : [];
        return !!rows.length && rows.every((row) => row.selected);
      },
      groupPartial(group) {
        const rows = group && group.tables ? group.tables : [];
        return rows.some((row) => row.selected) && !rows.every((row) => row.selected);
      },
      groupCollapsed(group) {
        return !!(group && this.collapsedGroupIds[group.id]);
      },
      toggleAll() {
        if (this.host.toggleDataScopeAll) this.host.toggleDataScopeAll(this.block);
      },
      toggleGroup(group) {
        if (this.host.toggleDataScopeGroup) this.host.toggleDataScopeGroup(this.block, group);
      },
      toggleCandidateAll() {
        const rows = this.candidateGroups.reduce((list, group) => list.concat(group.tables || []), []);
        const next = !this.candidateAllSelected;
        rows.forEach((row) => { row.selected = next; });
      },
      toggleCandidateGroup(group) {
        const rows = group && group.tables ? group.tables : [];
        const next = !rows.length || !rows.every((row) => row.selected);
        rows.forEach((row) => { row.selected = next; });
      },
      toggleTable(row) {
        if (this.host.toggleDataScopeTable) this.host.toggleDataScopeTable(this.block, row);
      },
      toggleGroupExpanded(group) {
        if (group && group.id) this.collapsedGroupIds[group.id] = !this.collapsedGroupIds[group.id];
      },
      addCandidates() {
        if (this.host.addDataScopeCandidateTables) this.host.addDataScopeCandidateTables(this.block);
      },
      submit() {
        if (this.host.submitDataScopeDecision) this.host.submitDataScopeDecision(this.msg, this.block);
      },
    },
    template: `
      <div class="nlm-data-scope-card" :class="{ 'is-submitted': !pending, 'is-compact': compact }" @click.stop>
        <div class="nlm-data-scope-card__eyebrow">
          <span class="nlm-data-scope-card__mark"><ds-icon name="circle-info" aria-hidden="true" /></span>
          <span>数据范围确认</span>
          <span v-if="!pending" class="nlm-data-scope-card__status">已提交</span>
        </div>
        <div class="nlm-data-scope-card__title">请确认本次查询的数据表范围</div>
        <div class="nlm-data-scope-card__controls">
          <div class="nlm-data-scope-card__count">{{ groupCount }} 个库 · 已选 {{ selectedCount }} / {{ totalCount }} 张表</div>
          <label class="nlm-data-scope-search">
            <ds-icon class="nlm-data-scope-search__icon" name="search" aria-hidden="true" />
            <input v-model="block.searchText" type="search" placeholder="搜索表名" :disabled="!pending" />
          </label>
        </div>
        <div class="nlm-data-scope-table" :class="{ 'is-compact': compact }">
          <div class="nlm-data-scope-row nlm-data-scope-row--head">
            <div class="nlm-data-scope-frozen nlm-data-scope-frozen--head">
              <button type="button" class="nlm-data-scope-check" :class="{ 'is-checked': allVisibleSelected }" :disabled="!pending" aria-label="全选当前列表" @click="toggleAll">
                <ds-icon v-if="allVisibleSelected" name="check" aria-hidden="true" />
              </button>
              <span class="nlm-data-scope-cell nlm-data-scope-cell--name">表名</span>
            </div>
            <span class="nlm-data-scope-cell nlm-data-scope-cell--reason">推荐理由</span>
            <template v-if="!compact">
              <span class="nlm-data-scope-cell">置信度</span>
              <span class="nlm-data-scope-cell">类型</span>
              <span class="nlm-data-scope-cell">主领域</span>
              <span class="nlm-data-scope-cell">行数</span>
              <span class="nlm-data-scope-cell nlm-data-scope-cell--related">关联表</span>
            </template>
          </div>
          <template v-for="group in visibleGroups" :key="group.id">
            <div
              class="nlm-data-scope-row nlm-data-scope-row--group"
              :class="{ 'is-collapsed': groupCollapsed(group) }"
              role="button"
              tabindex="0"
              :aria-expanded="!groupCollapsed(group)"
              @click="toggleGroupExpanded(group)"
              @keydown.enter.prevent="toggleGroupExpanded(group)"
              @keydown.space.prevent="toggleGroupExpanded(group)"
            >
              <div class="nlm-data-scope-frozen nlm-data-scope-frozen--group">
                <button
                  type="button"
                  class="nlm-data-scope-check"
                  :class="{ 'is-checked': groupSelected(group), 'is-partial': groupPartial(group) }"
                  :disabled="!pending"
                  :aria-label="'选择' + group.name"
                  @click.stop="toggleGroup(group)"
                >
                  <ds-icon v-if="groupSelected(group)" name="check" aria-hidden="true" />
                  <span v-else-if="groupPartial(group)" class="nlm-data-scope-check__partial"></span>
                </button>
                <span class="nlm-data-scope-group-name">{{ group.name }}</span>
                <ds-icon class="nlm-data-scope-caret" name="down" aria-hidden="true" />
              </div>
            </div>
            <template v-if="!groupCollapsed(group)">
              <div v-for="row in group.tables" :key="row.id" class="nlm-data-scope-row nlm-data-scope-row--table">
                <div class="nlm-data-scope-frozen nlm-data-scope-frozen--table">
                  <button
                    type="button"
                    class="nlm-data-scope-check"
                    :class="{ 'is-checked': row.selected }"
                    :disabled="!pending"
                    :aria-label="'选择' + row.name"
                    @click="toggleTable(row)"
                  >
                    <ds-icon v-if="row.selected" name="check" aria-hidden="true" />
                  </button>
                  <span class="nlm-data-scope-indent"></span>
                  <span class="nlm-data-scope-cell nlm-data-scope-cell--name">{{ row.name }}</span>
                </div>
                <span class="nlm-data-scope-cell nlm-data-scope-cell--reason">{{ row.reason }}</span>
                <template v-if="!compact">
                  <span class="nlm-data-scope-cell">{{ row.confidence }}</span>
                  <span class="nlm-data-scope-cell">{{ row.type }}</span>
                  <span class="nlm-data-scope-cell">{{ row.domain }}</span>
                  <span class="nlm-data-scope-cell">{{ row.rows }}</span>
                  <span class="nlm-data-scope-cell nlm-data-scope-cell--related">{{ row.related }}</span>
                </template>
              </div>
            </template>
          </template>
        </div>
        <button type="button" class="nlm-data-scope-add" :disabled="!pending" @click="block.addModalOpen = true">
          <ds-icon name="plus" aria-hidden="true" />
          <span>新增数据表</span>
        </button>
        <div class="nlm-data-scope-card__footer">
          <button type="button" class="nlm-data-scope-switch" :class="{ 'is-on': block.detailVisible }" @click="block.detailVisible = !block.detailVisible">
            <span class="nlm-data-scope-switch__track"><span class="nlm-data-scope-switch__dot"></span></span>
            <span>显示详细信息</span>
          </button>
          <div class="nlm-data-scope-card__actions">
            <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--reject" :disabled="!pending">取消</button>
            <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--primary" :disabled="!pending || !selectedCount" @click="submit">
              <span class="ds-trigger-btn__text">{{ pending ? '确认' : '已确认' }}</span>
            </button>
          </div>
        </div>
        <a-modal
          v-model:open="block.addModalOpen"
          title="新增数据表"
          width="800"
          wrapClassName="modal-data-scope-add"
          :footer="null"
          @cancel="block.addModalOpen = false"
        >
          <div class="nlm-data-scope-add-modal">
            <div class="nlm-data-scope-card__controls">
              <div class="nlm-data-scope-card__count">{{ candidateCounts.groups }} 个库 · 已选 {{ candidateCounts.selected }} / {{ candidateCounts.total }} 张表</div>
              <label class="nlm-data-scope-search">
                <ds-icon class="nlm-data-scope-search__icon" name="search" aria-hidden="true" />
                <input v-model="block.addSearchText" type="search" placeholder="搜索表名" />
              </label>
            </div>
            <div class="nlm-data-scope-table nlm-data-scope-table--candidate">
              <div class="nlm-data-scope-row nlm-data-scope-row--head">
                <div class="nlm-data-scope-frozen nlm-data-scope-frozen--head">
                  <button type="button" class="nlm-data-scope-check" :class="{ 'is-checked': candidateAllSelected, 'is-partial': candidatePartialSelected }" aria-label="全选候选表" @click="toggleCandidateAll">
                    <ds-icon v-if="candidateAllSelected" name="check" aria-hidden="true" />
                    <span v-else-if="candidatePartialSelected" class="nlm-data-scope-check__partial"></span>
                  </button>
                  <span class="nlm-data-scope-cell nlm-data-scope-cell--name">表名</span>
                </div>
                <span class="nlm-data-scope-cell">类型</span>
                <span class="nlm-data-scope-cell">主领域</span>
                <span class="nlm-data-scope-cell">行数</span>
                <span class="nlm-data-scope-cell nlm-data-scope-cell--related">关联表</span>
              </div>
              <template v-for="group in candidateGroups" :key="group.id">
                <div
                  class="nlm-data-scope-row nlm-data-scope-row--group"
                  :class="{ 'is-collapsed': groupCollapsed(group) }"
                  role="button"
                  tabindex="0"
                  :aria-expanded="!groupCollapsed(group)"
                  @click="toggleGroupExpanded(group)"
                  @keydown.enter.prevent="toggleGroupExpanded(group)"
                  @keydown.space.prevent="toggleGroupExpanded(group)"
                >
                  <div class="nlm-data-scope-frozen nlm-data-scope-frozen--group">
                    <button
                      type="button"
                      class="nlm-data-scope-check"
                      :class="{ 'is-checked': groupSelected(group), 'is-partial': groupPartial(group) }"
                      :aria-label="'选择' + group.name"
                      @click.stop="toggleCandidateGroup(group)"
                    >
                      <ds-icon v-if="groupSelected(group)" name="check" aria-hidden="true" />
                      <span v-else-if="groupPartial(group)" class="nlm-data-scope-check__partial"></span>
                    </button>
                    <span class="nlm-data-scope-group-name">{{ group.name }}</span>
                    <ds-icon class="nlm-data-scope-caret" name="down" aria-hidden="true" />
                  </div>
                </div>
                <template v-if="!groupCollapsed(group)">
                  <div v-for="row in group.tables" :key="row.id" class="nlm-data-scope-row nlm-data-scope-row--table">
                    <div class="nlm-data-scope-frozen nlm-data-scope-frozen--table">
                      <button type="button" class="nlm-data-scope-check" :class="{ 'is-checked': row.selected }" :aria-label="'选择' + row.name" @click="row.selected = !row.selected">
                        <ds-icon v-if="row.selected" name="check" aria-hidden="true" />
                      </button>
                      <span class="nlm-data-scope-indent"></span>
                      <span class="nlm-data-scope-cell nlm-data-scope-cell--name">{{ row.name }}</span>
                    </div>
                    <span class="nlm-data-scope-cell">{{ row.type }}</span>
                    <span class="nlm-data-scope-cell">{{ row.domain }}</span>
                    <span class="nlm-data-scope-cell">{{ row.rows }}</span>
                    <span class="nlm-data-scope-cell nlm-data-scope-cell--related">{{ row.related }}</span>
                  </div>
                </template>
              </template>
            </div>
            <div class="nlm-data-scope-add-modal__footer">
              <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--reject" @click="block.addModalOpen = false">取消</button>
              <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--primary" :disabled="!candidateCounts.selected" @click="addCandidates">
                <span class="ds-trigger-btn__text">加入范围</span>
              </button>
            </div>
          </div>
        </a-modal>
      </div>
    `,
  });

  app.component('DecisionCardBlock', {
    props: {
      host: { type: Object, required: true },
      msg: { type: Object, required: true },
      block: { type: Object, required: true },
    },
    computed: {
      status() {
        return String(this.block.status || 'pending');
      },
      statusText() {
        return decisionStatusText(this.status);
      },
      statusIcon() {
        return decisionStatusIcon(this.status);
      },
      objectLine() {
        if (this.block.summary) return this.block.summary;
        return `${this.block.objectType || '结果对象'} · ${this.block.objectTitle || '未命名结果'}`;
      },
      shownItems() {
        return Array.isArray(this.block.items) ? this.block.items.slice(0, 3) : [];
      },
      hiddenItemCount() {
        const items = Array.isArray(this.block.items) ? this.block.items : [];
        return Math.max(0, items.length - 3);
      },
    },
    methods: {
      decide(action) {
        if (this.host && this.host.decideResultTreeDecision) this.host.decideResultTreeDecision(this.msg, action, this.block);
      },
    },
    template: `
      <div class="nlm-result-decision-card" :class="'is-' + status">
        <div class="nlm-tool-call-action-with-detail">
          <div class="nlm-tool-call-action-toolbar">
            <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line">
              <span class="nlm-tool-call-line__ic nlm-result-decision-card__ic" aria-hidden="true"><svg class="iconpark-icon"><use :href="'#' + statusIcon"></use></svg></span>
              <span class="nlm-tool-call-line__txt">{{ block.title || '是否变更结果' }}</span>
              <span class="nlm-result-decision-card__status">{{ statusText }}</span>
            </p>
          </div>
          <div class="analysis-result-preview-modal__panel nlm-chat-result-md-panel nlm-result-decision-card__panel">
            <div class="analysis-result-preview-modal__panel-hd analysis-result-preview-modal__panel-hd--sub analysis-result-preview-modal__panel-hd--editor-toolbar nlm-chat-result-md-toolbar nlm-result-decision-card__panel-hd">
              <span class="analysis-result-preview-modal__panel-hd-label">结果树变更确认</span>
              <span v-if="block.timeoutLabel" class="nlm-result-decision-card__timeout"><span v-if="host.approvalDecisionTimeoutCount && host.approvalDecisionTimeoutCount(block.timeoutLabel)" class="nlm-result-decision-card__timeout-num">{{ host.approvalDecisionTimeoutCount(block.timeoutLabel) }}</span>{{ host.approvalDecisionTimeoutRest ? host.approvalDecisionTimeoutRest(block.timeoutLabel) : block.timeoutLabel }}</span>
            </div>
            <div class="analysis-result-preview-modal__panel-body">
              <div class="nlm-result-decision-card__body">
                <div class="nlm-result-decision-card__section">
                  <div class="nlm-result-decision-card__label">对象</div>
                  <div class="nlm-result-decision-card__object">
                    <div class="nlm-result-decision-card__object-title">{{ objectLine }}</div>
                    <div v-if="block.path" class="nlm-result-decision-card__path">路径：{{ block.path }}</div>
                    <template v-if="shownItems.length">
                      <ul class="nlm-result-decision-card__items">
                        <li v-for="(item, idx) in shownItems" :key="idx">{{ item }}</li>
                      </ul>
                      <div v-if="hiddenItemCount" class="nlm-result-decision-card__more">还有 {{ hiddenItemCount }} 项结果未展示</div>
                    </template>
                  </div>
                </div>
                <div class="nlm-result-decision-card__section">
                  <div class="nlm-result-decision-card__label">影响</div>
                  <div class="nlm-result-decision-card__impact">{{ block.impact || '该操作会改变结果树结构。' }}</div>
                </div>
                <div v-if="status === 'pending'" class="nlm-result-decision-card__actions">
                  <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn" @click.stop="decide('rejected')"><span class="ds-trigger-btn__text">拒绝</span></button>
                  <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--primary" @click.stop="decide('approved')"><span class="ds-trigger-btn__text">同意</span></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
})();
