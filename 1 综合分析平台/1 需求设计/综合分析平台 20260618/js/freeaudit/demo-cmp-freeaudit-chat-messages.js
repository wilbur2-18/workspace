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
      handleSuggestionClick(item) {
        if (this.host && typeof this.host.applyWorkbenchNextSuggestion === 'function') {
          this.host.applyWorkbenchNextSuggestion(item);
        }
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
              <div v-if="msg.role === 'bot' && Array.isArray(msg.nextSuggestions) && msg.nextSuggestions.length" class="nlm-next-suggestions" aria-label="下一步建议">
                <div class="nlm-next-suggestions__title">下一步可以继续：</div>
                <div class="nlm-next-suggestions__actions">
                  <button
                    v-for="item in msg.nextSuggestions"
                    :key="item.label || item"
                    type="button"
                    class="nlm-next-suggestion-btn"
                    @click="handleSuggestionClick(item)"
                  >{{ item.label || item }}</button>
                </div>
              </div>
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
    data() {
      return {
        activeGuideMode: 'daily',
        guideModes: [
          { key: 'daily', label: '日常办公' },
          { key: 'audit', label: '推荐技能' },
          { key: 'tool', label: '便捷应用' },
        ],
        dailyGuideCards: [
          {
            key: 'revise',
            title: '修改材料',
            desc: '统一金额日期格式，检查前后对应',
            tags: ['材料修改', '格式校验'],
            prompt: [
              '请基于我已经准备好的相关审计材料，帮我对材料文字进行规范性修改完善。',
              '',
              '请在不改变原有事实、数据和审计结论的前提下，重点检查并修改金额、日期、引用文件等格式是否统一，同类事项、单位名称、人员称呼等表述是否一致，标题与内容、问题与依据、建议与问题之间是否前后对应，并检查是否符合正式公文或审计材料的写法要求。',
              '',
              '请先输出一版可直接使用的修改稿，再简要说明主要修改点。如果发现依据不足、口径不清、前后矛盾或需要我补充确认的内容，请单独列出。',
            ].join('\n'),
          },
          {
            key: 'summary',
            title: '信息汇总',
            desc: '从多份材料提取信息，填入明细表',
            tags: ['信息抽取', '明细填表'],
            prompt: [
              '请基于我已经准备好的若干审计材料和明细表，帮我提取关键信息并填充或完善明细表。',
              '',
              '请先识别明细表需要填充的字段，再从材料中提取对应信息，例如收款人、付款人、事项、金额、日期、单位、项目名称、合同编号、文件依据、审批信息等。请尽量保持字段口径与原明细表一致。',
              '',
              '请输出一份可复制到明细表中的汇总结果，并说明每条信息来自哪份材料。对于材料中没有明确依据、无法确认或口径不一致的字段，请标记为待补充或待核实。',
            ].join('\n'),
          },
          {
            key: 'analysis',
            title: '数据分析',
            desc: '按表格字段统计，筛查异常疑点',
            tags: ['表格统计', '疑点筛查'],
            prompt: [
              '请基于我已经准备好的表格数据，帮我做一次审计数据分析。',
              '',
              '请先理解表头、字段含义、数据范围和金额单位，再根据审计目标进行分类汇总、金额统计、异常筛选、重复或缺失检查、时间趋势分析、主体维度分析等。请明确每一项统计或筛查使用的字段、口径和筛选条件。',
              '',
              '如果适合用 SQL 或类似查询方式分析，请给出可参考的 SQL、筛选条件或统计规则。请输出分析结果、统计口径、异常或疑点、需要进一步核实的数据项和下一步核查建议。',
            ].join('\n'),
          },
          {
            key: 'evidence-draft',
            title: '取证单初稿',
            desc: '围绕审计问题，生成取证单初稿',
            tags: ['材料生成', '取证单'],
            prompt: [
              '请基于我已经准备好的相关资料，根据格式要求，帮我生成一份审计取证单初稿。',
              '',
              '请围绕给定问题或资料中已经能够支撑的事实起草，结构上包含项目名称、被审计单位、审计事项、资料来源、问题定性、主要内容、定性依据。表述要正式、稳妥，包含日期、金额等关键信息，避免超出资料证据范围作确定性结论。',
              '',
              '如果现有资料不足以形成完整初稿，请先给出一版可继续补充的框架稿，并在文末列出还需要补充或核实的信息。',
            ].join('\n'),
          },
          {
            key: 'workpaper-draft',
            title: '工作底稿初稿',
            desc: '梳理核查过程，生成工作底稿',
            tags: ['材料生成', '工作底稿'],
            prompt: [
              '请基于我已经准备好的相关资料，根据格式要求，帮我生成一份审计工作底稿初稿。',
              '',
              '请围绕给定资料起草，结构上包含项目名称、被审计单位、审计事项、核查过程、资料来源、问题定性、主要内容、定性依据、被审计单位意见及审计组采纳情况。表述要正式、稳妥，包含日期、金额等关键信息，避免超出资料证据范围作确定性结论。',
              '',
              '如果现有资料不足以形成完整初稿，请先给出一版可继续补充的框架稿，并在文末列出还需要补充或核实的信息。',
            ].join('\n'),
          },
          {
            key: 'report-draft',
            title: '审计报告初稿',
            desc: '汇总问题建议，生成审计报告初稿',
            tags: ['材料生成', '审计报告'],
            prompt: [
              '请基于我已经准备好的相关资料，根据格式要求，帮我生成一份审计报告初稿。',
              '',
              '请围绕给定资料起草，结构上由基本情况、审计评价、审计发现问题、审计建议四部分组成。表述要正式、稳妥，包含日期、金额等关键信息，避免超出资料证据范围作确定性结论。',
              '',
              '如果现有资料不足以形成完整初稿，请先给出一版可继续补充的框架稿，并在文末列出还需要补充或核实的信息。',
            ].join('\n'),
          },
        ],
        dailyGuideBatchIndex: 0,
        auditGuideActions: [
          { key: 'refresh', label: '换一批', icon: 'refresh' },
          { key: 'market', label: '查看全部', icon: 'chevron-right' },
        ],
        auditGuideBatchIndex: 0,
        auditGuideCards: [
          {
            key: 'contract-invoice',
            title: '合同发票一致性核查',
            desc: '自动核对合同、发票、付款流水及验收资料的一致性，识别金额、时间和主体差异',
            tags: ['资金财务审计', '资料核查'],
          },
          {
            key: 'purchase-risk',
            title: '采购异常扫描',
            desc: '识别供应商、金额、频次和采购事项中的异常特征',
            tags: ['采购审计', '疑点分析', '热门技能'],
          },
          {
            key: 'budget-analysis',
            title: '预算执行分析',
            desc: '围绕预算、支付、项目和科目维度开展执行差异分析',
            tags: ['资金财务审计', '疑点分析', '预算执行', '表格分析'],
          },
          {
            key: 'payment-acceptance',
            title: '付款验收追踪',
            desc: '核查付款节点、验收资料和合同约定之间的闭环关系',
            tags: ['工程建设审计', '资料核查', '付款验收'],
          },
          {
            key: 'bid-review',
            title: '招投标资料核查',
            desc: '检查招投标流程、关键文件和审批节点是否完整一致',
            tags: ['采购审计', '资料核查', '招投标'],
          },
          {
            key: 'result-summary',
            title: '审计发现归集',
            desc: '',
            tags: ['投资审计', '结果整理', '材料生成', '取证线索'],
          },
        ],
      };
    },
    methods: {
      setMessagesRef(el) {
        if (this.host && this.host.$refs) this.host.$refs.chatMessages = el || undefined;
      },
      setGuideMode(mode) {
        if (!this.guideModes.some((item) => item.key === mode)) return;
        this.activeGuideMode = mode;
      },
      focusChatInput() {
        this.$nextTick(() => {
          const el = this.host && this.host.$refs && this.host.$refs.chatInputEl;
          if (el && typeof el.focus === 'function') {
            el.focus();
            return;
          }
          const fallback = this.$el && this.$el.parentElement
            ? this.$el.parentElement.querySelector('.nlm-chat-input-text textarea')
            : null;
          if (fallback && typeof fallback.focus === 'function') fallback.focus();
        });
      },
      applyGuidePrompt(prompt) {
        if (!this.host) return;
        this.host.chatInput = prompt;
        if (typeof this.host.adjustInputHeight === 'function') this.host.adjustInputHeight();
        this.focusChatInput();
      },
      applyDailyGuidePrompt(card) {
        const prompt = card && card.prompt ? card.prompt : '';
        if (
          this.host
          && typeof this.host.hasDailyGuideResource === 'function'
          && !this.host.hasDailyGuideResource()
          && typeof this.host.startDailyGuideUploadPrompt === 'function'
        ) {
          this.host.startDailyGuideUploadPrompt(prompt, card && card.title ? card.title : '');
          return;
        }
        this.applyGuidePrompt(prompt);
      },
      visibleDailyGuideCards() {
        const cards = this.dailyGuideCards || [];
        if (cards.length <= 3) return cards;
        const start = (this.dailyGuideBatchIndex * 3) % cards.length;
        const group = cards.slice(start, start + 3);
        return group.length === 3 ? group : group.concat(cards.slice(0, 3 - group.length));
      },
      rotateDailyGuideCards() {
        const count = Math.max(1, Math.ceil((this.dailyGuideCards || []).length / 3));
        this.dailyGuideBatchIndex = (this.dailyGuideBatchIndex + 1) % count;
      },
      visibleAuditGuideCards() {
        const cards = this.auditGuideCards || [];
        if (cards.length <= 3) return cards;
        const start = (this.auditGuideBatchIndex * 3) % cards.length;
        const group = cards.slice(start, start + 3);
        return group.length === 3 ? group : group.concat(cards.slice(0, 3 - group.length));
      },
      visibleGuideTags(card) {
        return Array.isArray(card && card.tags) ? card.tags.slice(0, 2) : [];
      },
      guideTagExtraCount(card) {
        return Math.max(0, (Array.isArray(card && card.tags) ? card.tags.length : 0) - 2);
      },
      guideTagToneClass(tag) {
        const value = String(tag || '');
        const exactToneMap = {
          材料修改: 'purple',
          材料生成: 'purple',
          取证单: 'purple',
          工作底稿: 'purple',
          审计报告: 'purple',
          结果整理: 'purple',
          取证线索: 'purple',
          信息抽取: 'green',
          明细填表: 'green',
          资料核查: 'green',
          格式校验: 'blue',
          表格统计: 'blue',
          资金财务审计: 'blue',
          预算执行: 'blue',
          表格分析: 'blue',
          疑点筛查: 'amber',
          疑点分析: 'amber',
          热门技能: 'amber',
          采购审计: 'amber',
          招投标: 'amber',
          付款验收: 'amber',
          工程建设审计: 'amber',
          投资审计: 'purple',
        };
        return `nlm-empty-guide-card__tag--${exactToneMap[value] || 'neutral'}`;
      },
      applyAuditSkillGuidePrompt(card) {
        const title = card && card.title ? card.title : '审计方法';
        const prompt = [
          `/${title}，阅读这个技能。`,
          '',
          '请先从适用场景、需要材料、产出结果三个方面介绍它适合解决什么问题，并判断当前工作台已有资料是否足以执行。',
          '',
          '如果资料不足，请列出需要补充的材料和建议上传顺序；如果资料已满足，请说明执行前需要我确认的事项，并给出下一步操作建议。',
        ].join('\n');
        this.applyGuidePrompt(prompt);
      },
      openSkillPage() {
        if (this.host && typeof this.host.openWorkbenchSkillLibrary === 'function') {
          this.host.openWorkbenchSkillLibrary();
          return;
        }
        if (this.host && typeof this.host.setMainView === 'function') {
          this.host.setMainView('skill');
          return;
        }
        if (typeof window !== 'undefined' && typeof window.__DEMO_FREEAUDIT_V2_SET_MAIN_VIEW_BRIDGE === 'function') {
          window.__DEMO_FREEAUDIT_V2_SET_MAIN_VIEW_BRIDGE('skill');
        }
      },
      applyAuditGuidePrompt(action) {
        const key = action && action.key;
        if (key === 'refresh') {
          const count = Math.max(1, Math.ceil((this.auditGuideCards || []).length / 3));
          this.auditGuideBatchIndex = (this.auditGuideBatchIndex + 1) % count;
          return;
        }
        if (key === 'market') {
          this.openSkillPage();
          return;
        }
        if (key === 'resource' && this.host && typeof this.host.openWorkbenchUploadMaterialModal === 'function') {
          this.host.openWorkbenchUploadMaterialModal();
          this.focusChatInput();
          return;
        }
        const prompt = key === 'market'
          ? '我想查看可用的审计方法。请帮我从适用场景、需要材料和产出结果三个方面介绍，并引导我选择合适的技能。'
          : '我想先添加审计资料或配置资源，请引导我上传资料、连接数据库或选择图谱范围，并基于资源推荐适合的审计方法。';
        this.applyGuidePrompt(prompt);
      },
    },
    template: `
      <div class="nlm-chat-messages" :ref="setMessagesRef">
        <div
          v-if="host.workbenchProjectId && !(host.chatMessages || []).length"
          class="nlm-empty-state nlm-empty-state--guide nlm-empty-state--start"
        >
          <div class="nlm-empty-guide-core" data-tour-id="workbench-assistant-stage">
            <div class="nlm-empty-guide-header">
              <img class="nlm-empty-brand-logo" src="./assets/generated/qian-kun-logo-square.svg" alt="QianKun 审计分析平台" />
              <h2 class="nlm-empty-title" data-tour-id="workbench-empty-start-guide">你好，我能帮你做什么？</h2>
              <div class="nlm-empty-guide-switch" role="tablist" aria-label="空态引导模式">
                <button
                  v-for="mode in guideModes"
                  :key="mode.key"
                  type="button"
                  :class="['nlm-empty-guide-switch__btn', { 'is-active': activeGuideMode === mode.key }]"
                  role="tab"
                  :aria-selected="activeGuideMode === mode.key"
                  @click="setGuideMode(mode.key)"
                >{{ mode.label }}</button>
              </div>
            </div>

            <div v-if="activeGuideMode === 'daily'" class="nlm-empty-guide-panel">
              <div class="nlm-empty-guide-card-list" aria-label="日常办公任务">
                <button
                  v-for="card in visibleDailyGuideCards()"
                  :key="card.key"
                  type="button"
                  :class="['nlm-empty-guide-card', 'nlm-empty-guide-card--daily', { 'has-tags': card.tags && card.tags.length }]"
                  @click="applyDailyGuidePrompt(card)"
                >
                  <span class="nlm-empty-guide-card__title">{{ card.title }}</span>
                  <span class="nlm-empty-guide-card__desc">{{ card.desc }}</span>
                  <span v-if="card.tags && card.tags.length" class="nlm-empty-guide-card__tags" aria-label="指令标签">
                    <span
                      v-for="tag in visibleGuideTags(card)"
                      :key="card.key + '-' + tag"
                      :class="['nlm-empty-guide-card__tag', guideTagToneClass(tag)]"
                    >{{ tag }}</span>
                    <span v-if="guideTagExtraCount(card)" class="nlm-empty-guide-card__tag nlm-empty-guide-card__tag--more">+{{ guideTagExtraCount(card) }}</span>
                  </span>
                  <span class="nlm-empty-guide-card__try">
                    <ds-icon name="copy" class="nlm-empty-guide-card__try-icon" aria-hidden="true" />
                    <span>使用</span>
                  </span>
                </button>
              </div>
              <div
                v-if="dailyGuideCards.length > 3"
                class="nlm-empty-guide-action-list nlm-empty-guide-action-list--daily"
                aria-label="日常办公引导"
              >
                <button type="button" class="nlm-empty-guide-action" @click="rotateDailyGuideCards">
                  <ds-icon name="refresh" class="nlm-empty-guide-action__icon" aria-hidden="true" />
                  <span>换一批</span>
                </button>
              </div>
            </div>

            <div v-else-if="activeGuideMode === 'audit'" class="nlm-empty-guide-panel">
              <div class="nlm-empty-guide-card-list" aria-label="推荐技能">
                <button
                  v-for="card in visibleAuditGuideCards()"
                  :key="card.key"
                  type="button"
                  :class="['nlm-empty-guide-card', 'nlm-empty-guide-card--skill', { 'has-desc': card.desc, 'has-tags': card.tags && card.tags.length }]"
                  @click="applyAuditSkillGuidePrompt(card)"
                >
                  <span class="nlm-empty-guide-card__title">{{ card.title }}</span>
                  <span v-if="card.desc" class="nlm-empty-guide-card__desc">{{ card.desc }}</span>
                  <span v-if="card.tags && card.tags.length" class="nlm-empty-guide-card__tags" aria-label="技能标签">
                    <span
                      v-for="tag in visibleGuideTags(card)"
                      :key="card.key + '-' + tag"
                      :class="['nlm-empty-guide-card__tag', guideTagToneClass(tag)]"
                    >{{ tag }}</span>
                    <span v-if="guideTagExtraCount(card)" class="nlm-empty-guide-card__tag nlm-empty-guide-card__tag--more">+{{ guideTagExtraCount(card) }}</span>
                  </span>
                  <span class="nlm-empty-guide-card__try">
                    <ds-icon name="copy" class="nlm-empty-guide-card__try-icon" aria-hidden="true" />
                    <span>使用</span>
                  </span>
                </button>
              </div>
              <div class="nlm-empty-guide-action-list nlm-empty-guide-action-list--audit" aria-label="推荐技能引导">
                <button
                  v-for="action in auditGuideActions"
                  :key="action.key"
                  type="button"
                  :class="['nlm-empty-guide-action', 'nlm-empty-guide-action--' + action.key]"
                  @click="applyAuditGuidePrompt(action)"
                >
                  <ds-icon :name="action.icon" class="nlm-empty-guide-action__icon" aria-hidden="true" />
                  <span>{{ action.label }}</span>
                </button>
              </div>
            </div>

            <div v-else class="nlm-empty-guide-panel">
              <p class="nlm-empty-guide-dev">该模块正在开发中，敬请期待。</p>
            </div>
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

  if (!(app._context && app._context.components && app._context.components.FreeAuditChatPanel)) {
    app.component('FreeAuditChatPanel', {
      props: {
        host: { type: Object, required: true },
      },
      template: `<ChatPanelShell :host="host" />`,
    });
  }

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
