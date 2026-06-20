(function () {
  const app = window.__DEMO_APP;
  const Modal = antd.Modal;
  const message = antd.message;

    // FreeAuditCapabilityHost：新版审计工作台内部能力宿主，共用资料、任务、结果、技能与对话能力。
    const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
    const getFreeAuditQuery = freeauditUtils.getFreeAuditQuery || function () { return {}; };
    const presetSuggestions = freeauditUtils.presetSuggestions || [];
    const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};
    const SUMMARY_RESPONSE_DEMO = freeauditUtils.SUMMARY_RESPONSE_DEMO || '';
    const DEMO_RUN_SUMMARY_TEXT = freeauditUtils.DEMO_RUN_SUMMARY_TEXT || '';
    const demoToolDiffLineClass = freeauditUtils.demoToolDiffLineClass || function () { return 'nlm-tool-diff-line--ctx'; };
    const demoLinesUnifiedDiff = freeauditUtils.demoLinesUnifiedDiff || function () { return { lines: [], truncated: false }; };
    const toAnalysisTemplateShared = freeauditUtils.toAnalysisTemplateShared || function (seed) { return seed; };
    const buildWorkbenchMaterialAntTreeData = freeauditUtils.buildWorkbenchMaterialAntTreeData || function () { return { treeData: [], autoExpandKeys: [] }; };
    const buildWorkbenchAnalysisResultAntTreeData = freeauditUtils.buildWorkbenchAnalysisResultAntTreeData || function () { return { treeData: [], autoExpandKeys: [], initialExpandKeys: [] }; };
    const buildWorkbenchAnalysisResultFolderPickerTree = freeauditUtils.buildWorkbenchAnalysisResultFolderPickerTree || function () { return []; };
    const WB_TASK_CREATE_RESULT_OUTPUT_ROOT = freeauditUtils.WB_TASK_CREATE_RESULT_OUTPUT_ROOT || '__root__';
    const resolveWbTaskCreateResultOutputFolder = freeauditUtils.resolveWbTaskCreateResultOutputFolder || function () { return { folderId: null, folderLabel: '根目录' }; };
    const applyWorkbenchMaterialTreeDrop = freeauditUtils.applyWorkbenchMaterialTreeDrop || function () { return { ok: false, message: '未实现' }; };
    const applyWorkbenchAnalysisResultTreeDrop = freeauditUtils.applyWorkbenchAnalysisResultTreeDrop || function () { return { ok: false, message: '未实现' }; };
    const wbMatMaterialPathPrefixForRow = freeauditUtils.wbMatMaterialPathPrefixForRow || function () { return ''; };
    const wbMatAntTreeKey = freeauditUtils.wbMatAntTreeKey || function (k, id) { return `${k}:${id}`; };
    const freeauditPanels = (window.DemoFreeAudit && window.DemoFreeAudit.panels) || {};
    /** 侧栏「添加库表」可选数据源（与工作台已无添加的扁平表列表分离，避免两边重复同步） */
    const DEMO_WORKBENCH_DB_CATALOGS = Object.freeze([
      {
        id: 'db-1',
        nameEn: 'fiscal_payment',
        name: '财政支付库',
        source: '核心业务库',
        owner: '数据中心',
        updatedAt: '2026-05-06 09:30:00',
        tables: Object.freeze([
          { name: 'payment_order', comment: '财政集中支付主单', rowCount: 124600, ddl: 'CREATE TABLE payment_order (id bigint, amount decimal(16,2), dept_name varchar(128));' },
          { name: 'payment_detail', comment: '支付明细与科目拆分', rowCount: 982000, ddl: 'CREATE TABLE payment_detail (order_id bigint, item_name varchar(128), amount decimal(16,2));' },
        ]),
      },
      {
        id: 'db-2',
        nameEn: 'contract_execution',
        name: '合同执行库',
        source: '合同管理系统',
        owner: '审计组A',
        updatedAt: '2026-05-05 15:20:00',
        tables: Object.freeze([
          { name: 'contract_main', comment: '合同主数据与履约状态', rowCount: 18630, ddl: 'CREATE TABLE contract_main (contract_no varchar(64), vendor_name varchar(128), signed_at datetime);' },
        ]),
      },
    ]);
    app.component('FreeAuditCapabilityHost', {
      emits: ['navigate', 'task-created'],
      props: {
        embedMode: { type: String, default: '' },
      },
      template: `<a-layout class="shell-main shell-main-flex-col workbench-v2-scope workbench-v2-capability-host"><a-layout-content class="content-reset-flex-col">
            <div class="nlm-main nlm-main-shell">
          <div v-if="toastMessage" class="nlm-toast">{{ toastMessage }}</div>
          <div v-if="citationPopover.show" class="nlm-extract-citation-popover" :style="{ left: citationPopover.x + 'px', top: citationPopover.y + 'px' }" @mouseenter="onCitationPopoverEnter" @mouseleave="onExtractCitationLeave">
            <div class="nlm-extract-citation-popover-title">{{ citationPopover.title || '原文' }}</div>
            <div class="nlm-extract-citation-popover-content">{{ citationPopover.excerpt }}</div>
          </div>
          <div v-if="sourcesLeftFullscreen" class="nlm-fullscreen-overlay">
            <button class="close-btn" @click="sourcesLeftFullscreen = false; fullscreenMaterialId = null; fullscreenLeftView = 'list'; fullscreenSelectedSourceId = null; fullscreenExcerptRefs = {}; fullscreenOriginalHighlight = null; fullscreenOriginalPageRefs = {}; fullscreenOriginalRowRefs = {}"><ds-icon name="close" /></button>
            <h2 v-if="fullscreenMaterial" class="nlm-heading-reset">{{ fullscreenMaterial.title }}</h2>
            <div v-if="fullscreenMaterial && fullscreenMaterial.type === 'raw'" class="nlm-fullscreen-raw-single nlm-fill-scroll">
              <div v-if="(fullscreenMaterial.rawSubtype || 'document') === 'document' && fullscreenMaterial.originalView && fullscreenMaterial.originalView.pages" class="nlm-original-doc-view nlm-fill-scroll">
                <div v-for="(page, pi) in fullscreenMaterial.originalView.pages" :key="pi" :class="['nlm-original-doc-page', { 'nlm-original-doc-page-highlight': fullscreenOriginalHighlight && fullscreenOriginalHighlight.pageIndex === pi }]" :ref="el => setFullscreenOriginalPageRef(pi, el)">{{ page }}</div>
              </div>
              <div v-else-if="(fullscreenMaterial.rawSubtype || 'document') === 'table' && fullscreenMaterial.originalView && fullscreenMaterial.originalView.headers" class="nlm-original-table-wrap nlm-fill-scroll">
                <table class="nlm-original-table">
                  <thead><tr><th v-for="(h, hi) in fullscreenMaterial.originalView.headers" :key="hi">{{ h }}</th></tr></thead>
                  <tbody><tr v-for="(row, ri) in (fullscreenMaterial.originalView.rows || [])" :key="ri" :class="{ 'nlm-original-row-highlight': fullscreenOriginalHighlight && fullscreenOriginalHighlight.rowIndex === ri }" :ref="el => setFullscreenOriginalRowRef(ri, el)"><td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td></tr></tbody>
                </table>
              </div>
              <div v-else class="nlm-source-read nlm-fill-scroll">
                <div v-for="(ex, i) in (fullscreenMaterial.excerpts || [])" :key="i" class="excerpt">{{ ex }}</div>
              </div>
            </div>
            <div v-else-if="fullscreenMaterial && ['analysis','report'].includes(fullscreenMaterial.type)" class="nlm-dual-column nlm-dual-column-fill" ref="fullscreenAnalysisContainer">
              <div v-if="fullscreenSourceMaterials.length" class="col nlm-col-flex nlm-col-flex-wide">
                <div v-if="fullscreenLeftView === 'list'" class="nlm-fill-hidden-col">
                  <h4>依据资料</h4>
                  <div class="nlm-fill-scroll">
                    <div v-for="sm in fullscreenSourceMaterials" :key="sm.id" :class="['nlm-source-item', 'nlm-source-item-soft', { selected: fullscreenSelectedSourceId === sm.id }]" @click="fullscreenSelectedSourceId = sm.id; fullscreenLeftView = 'detail'">
                      <span class="type-icon"><ds-icon :name="getMaterialIcon(sm)" /></span>
                      <span class="title">{{ sm.title }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="nlm-fill-hidden-col">
                  <div class="back-row nlm-back-row-compact">
                    <a-tooltip title="返回">
                      <button type="button" class="back-btn back-btn--icon-only" title="返回" aria-label="返回列表" @click="fullscreenLeftView = 'list'"><svg class="iconpark-icon"><use href="#arrow-left"></use></svg></button>
                    </a-tooltip>
                  </div>
                  <div v-if="fullscreenSelectedSource" class="nlm-fill-hidden-col">
                    <h4 class="nlm-source-title">{{ fullscreenSelectedSource.title }}</h4>
                    <div class="nlm-source-read nlm-fill-scroll">
                      <div v-for="(ex, i) in (fullscreenSelectedSource.excerpts || [])" :key="i" :class="['excerpt', { highlight: fullscreenHighlightSourceId === fullscreenSelectedSource.id && fullscreenHighlightExcerptIndex === i }]" :ref="el => setFullscreenExcerptRef(fullscreenSelectedSource.id, i, el)">{{ ex }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col" :style="fullscreenSourceMaterials.length ? 'flex: 2;' : 'flex: 1;'">
                <h4>{{ fullscreenMaterial.type === 'analysis' ? '结果' : '报告' }}</h4>
                <div class="nlm-source-read" v-html="renderFullscreenAnalysisContent(fullscreenMaterial)" @click="handleFullscreenCitationClick($event)"></div>
              </div>
            </div>
          </div>
          <div
            v-if="workbenchHasUploadingMaterials"
            class="workbench-uploading-global-hint"
            role="status"
            aria-live="polite"
            title="点击查看上传进度"
            :aria-label="workbenchUploadingMaterialCount + ' 个文件正在上传，点击查看进度'"
            @click="openWorkbenchUploadingStatusView"
          >
            <span class="workbench-uploading-global-hint__icon" aria-hidden="true">
              <svg class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
            </span>
            <span class="workbench-uploading-global-hint__text">{{ workbenchUploadingMaterialCount }} 个文件正在上传，请勿关闭或刷新页面</span>
          </div>
          <a-modal
            v-model:open="wbDetailBasicInfoModalOpen"
            :title="wbDetailBasicInfoModalTitle"
            width="560"
            wrapClassName="modal-w-560 material-preview-modal"
            centered
            :maskClosable="true"
            @cancel="closeWorkbenchBasicInfoModal"
          >
            <FreeAuditBasicInfoPane
              :rows="wbDetailBasicInfoModalRows"
              key-prefix="wb-detail-basic-info-modal"
              hide-chrome
            />
            <template #footer>
              <div class="ds-modal-footer-end">
                <a-button type="primary" @click="closeWorkbenchBasicInfoModal">关闭</a-button>
              </div>
            </template>
          </a-modal>

          <div ref="mainBody" class="workbench-v2-capability-body">
            <teleport
              v-if="embedMode !== 'v2' || workbenchV2RightDrawerHostReady"
              to="#workbench-v2-right-drawer-host"
              :disabled="embedMode !== 'v2'"
            >
              <div
                v-if="embedMode === 'v2' && workbenchV2RightPanel"
                class="workbench-v2-right-teleport-root"
              >
                ${freeauditPanels.workbenchV2RightPoolMarkup()}
              </div>
            </teleport>
            <section class="nlm-assistant-column" :style="{ flex: layoutMode === 'B' ? 4 : layoutRatios.middle, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
              <template v-if="layoutMode === 'B'">
                <div class="nlm-mode-b-canvas">
                  <div class="nlm-draft-block"><label>抽取技能草案</label><textarea v-model="experienceDrafts.extract" rows="4" placeholder="抽取技能草案" /></div>
                  <div class="nlm-draft-block"><label>分析技能草案</label><textarea v-model="experienceDrafts.analysis" rows="4" placeholder="分析技能草案" /></div>
                  <div class="nlm-draft-block"><label>报告技能草案</label><textarea v-model="experienceDrafts.report" rows="4" placeholder="报告技能草案" /></div>
                  <div class="nlm-mode-b-actions">
                    <button class="nlm-btn" @click="exitExperienceDraftMode">返回模式 A</button>
                    <a-button type="primary" @click="saveExperienceToTemplate">保存至技能库</a-button>
                  </div>
                </div>
              </template>
              <template v-else>
              <div class="workbench-v2-assistant-tour-frame" data-tour-id="workbench-assistant-frame" aria-hidden="true"></div>
              <FreeAuditChatPanel :host="freeAuditChatHost" />
              <ChatComposer :host="freeAuditChatHost">
              <div
                class="nlm-chat-input-wrap"
                :class="{ 'nlm-chat-input-wrap--queue-notice': (chatQueueNotice && chatQueueNotice.visible && chatQueueNoticeBody) || chatInputIncompleteRefNoticeBody }"
                data-tour-id="workbench-chat-composer"
                @dragover.prevent
                @drop="onChatAreaDrop"
              >
                <div
                  v-if="chatQueueNotice && chatQueueNotice.visible && chatQueueNoticeBody"
                  class="nlm-chat-queue-notice-slot"
                >
                  <div class="nlm-chat-queue-notice" role="status" aria-live="polite">
                    <div class="nlm-chat-queue-notice__main">
                      <div class="nlm-chat-queue-notice__hd">
                        <span class="nlm-chat-queue-notice__icon" aria-hidden="true">
                          <ds-icon
                            name="circle-info"
                            class="nlm-chat-queue-notice__icon-svg"
                          />
                        </span>
                        <span class="nlm-chat-queue-notice__title">排队提醒</span>
                      </div>
                      <p class="nlm-chat-queue-notice__body">
                        当前模型请求量较高，你目前排在第 <span class="nlm-chat-queue-notice__rank">{{ chatQueueNotice.position }}</span> 位。请耐心等待
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="chatInputIncompleteRefNoticeBody"
                  class="nlm-chat-ref-notice"
                  role="note"
                >
                  <span class="nlm-chat-ref-notice__icon" aria-hidden="true">
                    <svg class="iconpark-icon nlm-chat-ref-notice__icon-svg"><use href="#attention-l5b439e8"></use></svg>
                  </span>
                  <span class="nlm-chat-ref-notice__text">{{ chatInputIncompleteRefNoticeBody }}</span>
                </div>
                <teleport to="body">
                  <div
                    v-if="chatInputTriggerOpen && chatInputTriggerKind === 'at'"
                    ref="chatAtTriggerFloater"
                    class="nlm-chat-input-trigger-floater nlm-chat-input-trigger-floater--at-fixed nlm-chat-at-dropdown-root"
                    role="listbox"
                    aria-label="引用资料或结果"
                    :style="chatAtFloaterStyle"
                    @mousedown.prevent
                  >
                    <div class="nlm-chat-at-menu-wrap">
                      <template v-if="chatAtMenuHasAnythingToRef">
                        <template v-if="chatTriggerFilterTrimmed">
                          <div class="nlm-chat-at-cascade nlm-chat-at-cascade--solo">
                            <div class="nlm-chat-at-card nlm-chat-at-card--single nlm-chat-at-card--match-list">
                              <div class="nlm-chat-at-card__chrome">
                                <div class="nlm-chat-at-ref-head">匹配资料与结果</div>
                              </div>
                              <div class="nlm-chat-at-card__body nlm-chat-at-card__body--scroll">
                                <button
                                  v-for="row in chatAtUnifiedMatchRows"
                                  :key="'chat-at-uni-' + row.kind + '-' + row.m.id"
                                  type="button"
                                  class="nlm-chat-at-item-row nlm-chat-at-item-row--unified"
                                  @click="onChatInputTriggerPickMaterial(row.m)"
                                >
                                  <span
                                    class="nlm-chat-at-item-row__kind nlm-chat-at-item-row__kind--ic"
                                    :title="row.kind === 'raw' ? '资料' : '结果'"
                                    :aria-label="row.kind === 'raw' ? '资料' : '结果'"
                                  >
                                    <ds-icon v-if="row.kind === 'raw'" :name="getMaterialIcon(row.m)" :class="[getMaterialIconColorClass(row.m), chatAtUnifiedRowStatusClass(row)]" aria-hidden="true" />
                                    <svg v-else class="iconpark-icon" :class="chatAtUnifiedRowStatusClass(row) || 'is-result'" aria-hidden="true"><use href="#notes"></use></svg>
                                  </span>
                                  <span class="nlm-chat-at-item-row__title">{{ row.kind === 'raw' ? chatAtRawMaterialDisplayTitle(row.m) : (row.m.title || row.m.name || '未命名') }}</span>
                                </button>
                                <div v-if="!chatAtUnifiedMatchRows.length" class="nlm-chat-at-item-row nlm-chat-at-item-row--empty" aria-disabled="true">无匹配项</div>
                              </div>
                            </div>
                          </div>
                        </template>
                        <template v-else>
                          <div class="nlm-chat-at-cascade">
                            <div class="nlm-chat-at-flyout-anchor">
                              <div class="nlm-chat-at-card nlm-chat-at-card--flyout-rail">
                                <div class="nlm-chat-at-card__chrome">
                                  <div class="nlm-chat-at-ref-head">引用</div>
                                </div>
                                <div class="nlm-chat-at-card__body nlm-chat-at-card__body--rail">
                                  <button
                                    v-for="cat in chatAtMenuRailCategories"
                                    :key="'chat-trg-at-cat-' + cat.key"
                                    type="button"
                                    class="nlm-chat-at-cat-row"
                                    @click="openChatInputAtSubmenu(cat.key)"
                                  >
                                    <span class="nlm-chat-at-cat-row__label">{{ cat.label }}</span>
                                    <ds-icon name="chevron-right" class="nlm-chat-at-cat-row__chev" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                              <div v-if="chatAtMenuPanel === 'items'" class="nlm-chat-at-card nlm-chat-at-card--flyout-sub">
                                <div class="nlm-chat-at-ref-head nlm-chat-at-ref-head--sub">
                                  <a-tooltip title="返回">
                                    <button
                                      type="button"
                                      class="nlm-chat-at-back"
                                      title="返回"
                                      aria-label="返回引用分类"
                                      @click="backChatInputAtSubmenu"
                                    >
                                      <svg class="iconpark-icon"><use href="#arrow-left"></use></svg>
                                    </button>
                                  </a-tooltip>
                                  <span class="nlm-chat-at-ref-head__title">{{ chatAtSubmenuTitle }}</span>
                                </div>
                                <div class="nlm-chat-at-card__body nlm-chat-at-card__body--scroll">
                                  <template v-if="chatInputAtRail === 'raw'">
                                    <button
                                      v-for="m in chatAtMenuRawMaterials"
                                      :key="'chat-trg-at-mat-' + m.id"
                                      type="button"
                                      class="nlm-chat-at-item-row"
                                      @click="onChatInputTriggerPickMaterial(m)"
                                    >
                                      <span class="nlm-chat-at-item-row__title">{{ chatAtRawMaterialDisplayTitle(m) }}</span>
                                    </button>
                                    <div v-if="!chatAtMenuRawMaterials.length" class="nlm-chat-at-item-row nlm-chat-at-item-row--empty" aria-disabled="true">暂无资料</div>
                                  </template>
                                  <template v-else-if="chatInputAtRail === 'result'">
                                    <button
                                      v-for="m in chatAtMenuResultMaterials"
                                      :key="'chat-trg-at-res-' + m.id"
                                      type="button"
                                      class="nlm-chat-at-item-row"
                                      @click="onChatInputTriggerPickMaterial(m)"
                                    >
                                      <span class="nlm-chat-at-item-row__title">{{ m.title || m.name || '未命名' }}</span>
                                    </button>
                                    <div v-if="!chatAtMenuResultMaterials.length" class="nlm-chat-at-item-row nlm-chat-at-item-row--empty" aria-disabled="true">暂无结果</div>
                                  </template>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>
                      </template>
                      <div v-else class="nlm-chat-at-cascade nlm-chat-at-cascade--solo">
                        <div class="nlm-chat-at-card nlm-chat-at-card--single">
                          <div class="nlm-chat-at-card__chrome">
                            <div class="nlm-chat-at-ref-head">引用</div>
                            <p class="nlm-chat-at-ref-hint">上传资料并产出结果后，可输入 @ 引用</p>
                          </div>
                          <div class="nlm-chat-at-card__body">
                            <div class="nlm-chat-at-item-row nlm-chat-at-item-row--empty">暂无可引用项</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </teleport>
                <div
                  v-if="chatInputTriggerOpen && chatInputTriggerKind === 'slash'"
                  class="nlm-chat-input-trigger-floater nlm-chat-insert-dropdown"
                  role="listbox"
                  aria-label="选择技能"
                  @mousedown.prevent
                >
                  <a-menu class="nlm-chat-insert-menu" @click="onChatInputTriggerSlashMenuClick">
                    <template v-if="chatSlashMenuHasAnyItem">
                      <template v-for="sec in chatSlashMenuSectionsFiltered" :key="'chat-trg-slash-sec-' + sec.key">
                        <a-menu-item-group :title="sec.label">
                          <a-menu-item v-for="node in sec.children" :key="node.key">{{ node.raw.name || '未命名' }}</a-menu-item>
                        </a-menu-item-group>
                      </template>
                    </template>
                    <a-menu-item v-else key="chat-trg-slash-empty" disabled>{{ chatTriggerFilter.trim() ? '无匹配技能' : '暂无技能' }}</a-menu-item>
                  </a-menu>
                </div>
                <div v-if="chatDailyGuideStage" class="nlm-chat-guide-mask" aria-hidden="true"></div>
                <div
                  class="nlm-chat-input-box"
                  :class="{ 'nlm-chat-input-box--decision': !!chatComposerDecision, 'nlm-chat-input-box--guide': !!chatDailyGuideStage }"
                >
                  <button
                    v-if="chatDailyGuideStage"
                    type="button"
                    class="nlm-chat-guide-suppress"
                    @click="disableDailyGuideReminder"
                  >
                    <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
                    <span>不再提醒</span>
                  </button>
                  <template v-if="chatComposerDecision">
                    <div
                      class="nlm-chat-approval-composer"
                      :class="{ 'is-detail-expanded': approvalDecisionDetailExpanded(chatComposerDecision) }"
                    >
                      <div class="nlm-chat-approval-composer__head">
                        <div class="nlm-chat-approval-composer__title-wrap">
                          <span class="nlm-chat-approval-composer__ic" aria-hidden="true"><svg class="iconpark-icon"><use href="#attention"></use></svg></span>
                          <span class="nlm-chat-approval-composer__title">工具调用请求</span>
                        </div>
                        <span v-if="approvalDecisionTimeoutRemainingSeconds(chatComposerDecision)" class="nlm-chat-approval-composer__auto-reject"><span class="nlm-chat-approval-composer__auto-reject-count">{{ approvalDecisionTimeoutRemainingSeconds(chatComposerDecision) }}</span>秒后自动拒绝</span>
                      </div>
                      <p class="nlm-chat-approval-composer__question">
                        <template v-if="approvalDecisionRequestParts(chatComposerDecision).objectName">
                          <span>{{ approvalDecisionRequestParts(chatComposerDecision).prefix }}</span><span>{{ approvalDecisionRequestParts(chatComposerDecision).objectName }}</span><span>{{ approvalDecisionRequestParts(chatComposerDecision).suffix }}</span>
                        </template>
                        <template v-else>{{ approvalDecisionRequestText(chatComposerDecision) }}</template>
                      </p>
                      <div class="nlm-chat-approval-composer__affected">
                        <span class="nlm-chat-approval-composer__affected-label">影响：</span>
                        <button
                          v-for="row in approvalDecisionAllObjectRows(chatComposerDecision)"
                          :key="row.key"
                          type="button"
                          class="nlm-chat-approval-composer__affected-item"
                          :class="{ 'is-clickable': row.canPreview }"
                          :disabled="!row.canPreview"
                          :title="row.canPreview ? '预览结果' : null"
                          @click.stop="row.canPreview && openApprovalDecisionObjectPreview(chatComposerDecision, row)"
                        >
                          <span class="nlm-tree-leaf-icon" aria-hidden="true"><ds-icon :name="row.icon" :class="row.iconClass" /></span>
                          <span class="nlm-chat-approval-composer__affected-name">{{ row.name }}</span>
                        </button>
                      </div>
                      <div v-if="approvalDecisionHasDetail(chatComposerDecision)" class="nlm-chat-approval-composer__detail">
                        <div class="nlm-chat-approval-composer__detail-head">
                          <button
                            type="button"
                            class="nlm-chat-approval-composer__detail-label"
                            @click.stop="toggleApprovalDecisionDetail(chatComposerDecision)"
                          >{{ approvalDecisionDetailExpanded(chatComposerDecision) ? '隐藏技术细节' : '显示技术细节' }}</button>
                        </div>
                        <div v-if="approvalDecisionDetailExpanded(chatComposerDecision)" class="nlm-chat-approval-composer__detail-wrap">
                          <dl class="nlm-chat-approval-composer__detail-fields">
                            <template v-for="field in approvalDecisionTechnicalFields(chatComposerDecision)" :key="field.label">
                              <dt>{{ field.label }}</dt>
                              <dd>{{ field.value }}</dd>
                            </template>
                          </dl>
                          <div v-for="codeBlock in approvalDecisionTechnicalCodeBlocks(chatComposerDecision)" :key="codeBlock.title" class="nlm-chat-approval-composer__detail-code-block">
                            <div class="nlm-chat-approval-composer__detail-code-title">{{ codeBlock.title }}</div>
                            <pre class="nlm-chat-approval-composer__detail-code">{{ codeBlock.code }}</pre>
                          </div>
                        </div>
                      </div>
                      <div class="nlm-chat-approval-composer__actions">
                        <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--reject" @click="decideResultTreeDecision(null, 'rejected', chatComposerDecision)">
                          <span class="ds-trigger-btn__text">拒绝</span>
                        </button>
                        <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--primary" @click="decideResultTreeDecision(null, 'approved', chatComposerDecision)"><span class="ds-trigger-btn__text">{{ approvalDecisionConfirmLabel(chatComposerDecision) }}</span></button>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div
                      v-if="chatDailyGuideNudgeText"
                      class="nlm-chat-guide-nudge"
                      :class="'is-' + chatDailyGuideStage"
                    >
                      <span class="nlm-chat-guide-nudge__text">{{ chatDailyGuideNudgeText }}</span>
                    </div>
                    <div v-if="chatUploadAttachmentRows.length || chatInputRefRows.length" class="nlm-chat-refs" aria-label="待发送附件与引用">
                      <a-tooltip
                        v-for="item in chatUploadAttachmentRows"
                        :key="'chat-upload-att-tip-' + item.uid"
                        placement="top"
                        overlay-class-name="nlm-chat-ref-chip-tooltip"
                        :title="chatUploadAttachmentTooltip(item)"
                      >
                        <span
                          class="nlm-chat-ref-chip nlm-chat-ref-chip--upload"
                          :class="'is-' + item.status"
                          :style="chatUploadAttachmentProgressStyle(item)"
                        >
                          <span class="nlm-chat-ref-chip-progress" aria-hidden="true"></span>
                          <span class="nlm-chat-ref-chip-icon" aria-hidden="true">
                            <ds-icon :name="item.iconName" :class="item.iconToneClass" />
                          </span>
                          <span class="nlm-chat-ref-chip-title">{{ item.name }}</span>
                          <button
                            v-if="item.status === 'failed'"
                            type="button"
                            class="nlm-chat-ref-chip-retry"
                            aria-label="重新上传"
                            title="重新上传"
                            @click.stop="retryChatUploadAttachment(item.uid)"
                          >重试</button>
                          <button
                            type="button"
                            class="nlm-chat-ref-chip-remove"
                            aria-label="移除附件"
                            title="移除附件"
                            @click="removeChatUploadAttachment(item.uid)"
                          >
                            <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
                          </button>
                        </span>
                      </a-tooltip>
                      <a-tooltip
                        v-for="row in chatInputRefRows"
                        :key="'chat-ref-chip-tip-' + row.key"
                        placement="top"
                        overlay-class-name="nlm-chat-ref-chip-tooltip"
                        :title="chatInputRefChipTitle(row)"
                      >
                        <span
                          class="nlm-chat-ref-chip"
                          :class="chatInputRefChipClass(row)"
                          :style="chatInputRefChipProgressStyle(row)"
                        >
                          <span class="nlm-chat-ref-chip-progress" aria-hidden="true"></span>
                          <span class="nlm-chat-ref-chip-icon" aria-hidden="true">
                            <ds-icon
                              v-if="row.kind === 'material' && (row.material.type === 'raw' || row.material.type === undefined)"
                              :name="getMaterialIcon(row.material)"
                              :class="getMaterialIconColorClass(row.material)"
                            />
                            <svg v-else-if="row.kind === 'material'" class="iconpark-icon is-result"><use href="#notes"></use></svg>
                            <ds-icon
                              v-else-if="row.kind === 'material-folder' || row.kind === 'result-folder'"
                              name="folder"
                              :class="row.kind === 'result-folder' ? 'is-result' : 'is-status-pending'"
                            />
                            <ds-icon
                              v-else-if="row.kind === 'database-table' || row.kind === 'database-catalog'"
                              name="database"
                              class="is-status-pending"
                            />
                            <ds-icon v-else-if="row.kind === 'graph'" name="chat-ref" class="is-status-queued" />
                            <ds-icon v-else name="chat-ref" />
                          </span>
                          <span class="nlm-chat-ref-chip-title">{{ row.title }}</span>
                          <button
                            type="button"
                            class="nlm-chat-ref-chip-remove"
                            aria-label="移除引用"
                            title="移除引用"
                            @click="removeChatInputRef(row.key)"
                          >
                            <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
                          </button>
                        </span>
                      </a-tooltip>
                    </div>
                    <div class="nlm-chat-input-text">
                      <textarea
                        ref="chatInputEl"
                        v-model="chatInput"
                        placeholder="输入问题；@ 引用资料或结果，/ 选择技能；Enter 发送"
                        rows="1"
                        @keydown="onChatInputKeydown"
                        @input="onChatInputInput"
                        @focus="onChatInputFocus"
                        @blur="onChatInputBlur"
                      ></textarea>
                      </div>
                      <div class="nlm-chat-input-bar">
                        <div class="nlm-chat-input-bar__left">
                        <input
                          ref="chatUploadFileInput"
                          class="nlm-chat-upload-file-input"
                          type="file"
                          multiple
                          @change="onChatUploadFileInputChange"
                        />
                        <a-tooltip
                          overlay-class-name="nlm-chat-upload-tip"
                          title="支持 PDF、Word、表格、图片、ZIP、MD、TXT、JSON、XML 等格式。单次上传总大小不超过 4GB，文件发送后将保存到资源区并自动引用到当前对话。"
                        >
                          <button
                            type="button"
                            class="ds-icon-btn ds-icon-btn--standard nlm-chat-attach-btn"
                            :class="{ 'is-guide-target': chatDailyGuideStage === 'upload' }"
                            data-tour-id="chat-upload-attachment-button"
                            title="上传附件"
                            aria-label="上传附件"
                            @click="triggerChatUploadAttachmentPicker"
                          >
                            <svg class="iconpark-icon" aria-hidden="true"><use href="#paperclip"></use></svg>
                          </button>
                        </a-tooltip>
                        <span v-if="chatDailyGuideStage === 'upload'" class="nlm-chat-guide-callout nlm-chat-guide-callout--upload">点击这里上传附件</span>
                      </div>
                      <div class="nlm-chat-input-bar__right">
                        <a-tooltip v-if="chatReplyInProgress" title="暂停">
                          <button
                            type="button"
                            class="ds-icon-btn ds-icon-btn--standard nlm-chat-send-btn nlm-chat-send-btn--pause"
                            title="暂停"
                            aria-label="暂停生成"
                            @click="pauseChatGeneration"
                          >
                            <svg class="iconpark-icon nlm-chat-send-btn__icon" aria-hidden="true"><use href="#pause"></use></svg>
                          </button>
                        </a-tooltip>
                        <a-tooltip v-else :title="chatUploadAttachmentSendBlockTip">
                          <button
                            type="button"
                            class="ds-icon-btn ds-icon-btn--standard nlm-chat-send-btn"
                            :class="{ 'is-guide-target': chatDailyGuideStage === 'send' }"
                            data-tour-id="chat-send-button"
                            title="发送"
                            aria-label="发送"
                            :disabled="chatUploadAttachmentSendBlocked"
                            @click="sendChat"
                          >
                            <svg class="iconpark-icon nlm-chat-send-btn__icon" aria-hidden="true"><use href="#send"></use></svg>
                          </button>
                        </a-tooltip>
                        <span v-if="chatDailyGuideStage === 'send'" class="nlm-chat-guide-callout nlm-chat-guide-callout--send">点击这里发送</span>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
              <div class="nlm-disclaimer">系统生成内容需人工核查，审计结论以人工确认为准。</div>
              </ChatComposer>
              </template>
            </section>

            <teleport
              v-if="embedMode !== 'v2' || workbenchV2DetailHostReady"
              to="#workbench-v2-detail-host"
              :disabled="embedMode !== 'v2'"
            >
            <div
              v-show="isWorkbenchV2DetailPaneVisible"
              class="workbench-v2-scope workbench-v2-detail-scaffold"
            >
              <div class="workbench-v2-capability-body workbench-v2-capability-body--detail">
            <aside class="workbench-v2-side-rail workbench-v2-side-rail--detail workbench-v2-detail-teleport" :style="rightWorkbenchRailStyle">
              <div class="nlm-side-panel workbench-v2-side-panel" :class="{ 'is-analysis-detail-open': isWorkbenchV2DetailPaneVisible && selectedMaterial && selectedMaterial.type === 'analysis', 'is-right-split-list': sourcesRightView === 'list' && !isWorkbenchV2DetailPaneVisible }">
                <template v-if="sourcesRightView === 'list' && !isWorkbenchV2DetailPaneVisible">
                  ${freeauditPanels.rightSplitPanelOpen()}
                    ${freeauditPanels.rightTaskSectionOpen()}
                        <template v-if="wbTaskListView === 'batch-children'">
                          <div class="wb-task-batch-children-view">
                          <div class="wb-material-status-footer wb-batch-child-status-footer wb-material-status-footer--file-pool ds-popover-panel__footer">
                            <div class="wb-material-status-footer__right">
                              <FreeAuditStatusFilterBar
                                aria-label="子任务状态摘要"
                                :active-key="wbBatchChildStatusView"
                                :items="[
                                  { key: 'all', label: '全部' },
                                  { key: 'queued', label: '排队中', tone: 'queued' },
                                  { key: 'parsing', label: '运行中', tone: 'parsing' },
                                  { key: 'done', label: '成功', tone: 'done' },
                                  { key: 'no-result', label: '无结果', tone: 'queued' },
                                  { key: 'failed', label: '失败', tone: 'failed' },
                                ]"
                                @select="(key) => key === 'all' ? resetWbBatchChildStatusView() : setWbBatchChildStatusView(key)"
                              />
                            </div>
                          </div>
                          ${freeauditPanels.bulkBar('task', 'batch-child')}
                          <div class="wb-task-batch-child-list-shell">
                          <div class="nlm-cards-wrap nlm-tree-wrap nlm-task-batch-child-list" style="flex:1;min-height:0;overflow:auto;">
                            <FreeAuditBatchChildRow
                              v-for="child in pagedBatchChildren"
                              :key="child.id"
                              :child="child"
                              :selected="selectedMaterialId === child.id"
                              :bulk-descriptor="workbenchBulkBatchChildDescriptor(child)"
                              :bulk-selected="workbenchBulkIsSelected(workbenchBulkBatchChildDescriptor(child))"
                              :bulk-mode="workbenchBulkScopeActive('task', 'batch-child')"
                              :status="workbenchAnalysisStatusOf(child)"
                              :queue-position="batchChildQueuePosition(child)"
                              :show-more="batchChildShowMoreMenu(child)"
                              :can-abort="batchChildCanAbort(child)"
                              :can-rerun="batchChildCanRerun(child)"
                              :can-delete="batchChildCanDelete(child)"
                              @open="onWorkbenchBulkBatchChildRowOpen"
                              @menu="handleBatchChildContextMenu"
                              @abort="workbenchTaskRowAbort"
                              @rerun="workbenchTaskRowRerun"
                              @bulk-toggle="toggleWorkbenchBulkSelection"
                            />
                            <a-empty v-if="!filteredBatchChildren.length" description="暂无子任务" />
                          </div>
                          <div class="wb-task-batch-child-list-footer">
                            <div class="wb-material-list-top-actions wb-batch-child-list-top-actions">
                              <span class="wb-batch-child-list-top-actions__count">共 {{ filteredBatchChildren.length }} 条</span>
                            </div>
                            <a-pagination
                              v-if="filteredBatchChildren.length"
                              size="small"
                              :current="wbBatchChildPage"
                              :page-size="wbBatchChildPageSize"
                              :total="filteredBatchChildren.length"
                              :show-size-changer="false"
                              @change="onWbBatchChildPageChange"
                            />
                          </div>
                          </div>
                          </div>
                        </template>
                        <template v-else>
                        ${freeauditPanels.bulkBar('task', 'task')}
                        <div class="nlm-cards-wrap nlm-tree-wrap">
                          <template v-if="poolTabAnalysisTaskCount > 0">
                            <template v-for="section in workbenchTaskTreeSections" :key="(section.treeScope || 'pool') + '-' + section.key">
                              <div class="nlm-tree-children">
                                <a-dropdown v-for="node in section.children" :key="node.id" :trigger="['contextmenu']" @click.stop>
                                  <div :class="['nlm-tree-leaf', { 'nlm-tree-leaf--analysis': section.key === 'analysis', 'nlm-source-item-loading': node.raw.loading, checked: isTreeNodeSelected(node, section.key) }, workbenchBulkRowClass(workbenchBulkTaskDescriptor(node))]" draggable="true" @click="onWorkbenchBulkTaskNodeRowClick($event, node, section.key)" @dragstart="onTreeLeafDragStart($event, node, section.key)">
                                    <span v-if="workbenchBulkScopeActive('task', 'task') && workbenchBulkTaskDescriptor(node)" class="workbench-bulk-tree-check" @click.stop>
                                      <a-checkbox :checked="workbenchBulkIsSelected(workbenchBulkTaskDescriptor(node))" @change="(e) => toggleWorkbenchBulkSelection(workbenchBulkTaskDescriptor(node), e)" />
                                    </span>
                                    <span class="nlm-tree-leaf-icon">
                                      <ds-icon v-if="section.treeScope === 'task' && section.key === 'analysis' && isWorkbenchPackageDownloadTask(node.raw)"
                                        name="download"
                                        aria-hidden="true"
                                        title="打包下载任务"
                                      />
                                      <ds-icon v-else-if="section.treeScope === 'task' && section.key === 'analysis' && node.raw && node.raw.taskConfig && (node.raw.taskConfig.taskType === 'generate-skill' || String(node.raw.taskConfig.skillId || '').trim() === 'generate-skill')"
                                        name="tips"
                                        aria-hidden="true"
                                        title="生成技能任务"
                                      />
                                      <ds-icon v-else-if="section.treeScope === 'task' && section.key === 'analysis' && isWorkbenchBatchParentTask(node.raw)"
                                        name="document-folder"
                                        aria-hidden="true"
                                        title="跑批任务"
                                      />
                                      <ds-icon v-else-if="section.treeScope === 'task' && section.key === 'analysis'"
                                        name="edit-one"
                                        class="is-task-single"
                                        aria-hidden="true"
                                        title="单次任务"
                                      />
                                      <a-spin v-else-if="node.raw.loading" size="small" class="nlm-tree-leaf-spin" />
                                      <ds-icon v-else :name="getMaterialIcon(node.raw)" :class="getMaterialIconColorClass(node.raw)" />
                                    </span>
                                    <div class="nlm-tree-leaf-title-wrap">
                                      <div class="nlm-tree-leaf-col">
                                        <div class="nlm-tree-leaf-title nlm-tree-leaf-title--with-meta" :class="{ 'is-muted': (section.key === 'analysis' && ['queued', 'parsing', 'failed'].includes(workbenchAnalysisStatusOf(node.raw))) }" @click.stop="workbenchBulkScopeActive('task', 'task') && workbenchBulkTaskDescriptor(node) ? toggleWorkbenchBulkSelection(workbenchBulkTaskDescriptor(node)) : openDetailFromTreeTitle(node, section.key)">
                                          <span class="nlm-tree-leaf-title__text">{{ node.raw.title }}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <span class="nlm-tree-leaf-right">
	                                      <span
	                                        v-if="section.treeScope === 'task' && section.key === 'analysis' && workbenchAnalysisStatusOf(node.raw) === 'parsing' && isWorkbenchBatchParentTask(node.raw)"
	                                        class="nlm-tree-leaf-task-status nlm-tree-leaf-task-progress-pct nlm-tree-leaf-state-text is-progress"
	                                        :title="'执行中 ' + Math.round(workbenchAnalysisTaskProgressPercent(node.raw)) + '%'"
	                                      >{{ Math.round(workbenchAnalysisTaskProgressPercent(node.raw)) }}%</span>
	                                      <span
	                                        v-else-if="section.treeScope === 'task' && section.key === 'analysis' && workbenchAnalysisStatusOf(node.raw) === 'parsing'"
	                                        class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-progress"
	                                        title="执行中"
	                                      >执行中</span>
	                                      <span
	                                        v-else-if="section.treeScope === 'task' && section.key === 'analysis' && workbenchAnalysisStatusOf(node.raw) === 'queued'"
	                                        class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-queued"
	                                        title="排队中"
	                                      >排队中</span>
	                                      <span
	                                        v-else-if="section.treeScope === 'task' && section.key === 'analysis' && workbenchAnalysisStatusOf(node.raw) === 'failed'"
	                                        class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-failed"
	                                        title="失败"
	                                      >失败</span>
	                                      <span
	                                        v-else-if="section.treeScope === 'task' && section.key === 'analysis' && workbenchAnalysisStatusOf(node.raw) === 'done'"
	                                        class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-done"
	                                        title="完成"
	                                      >完成</span>
                                      <div v-if="!workbenchBulkScopeActive('task', 'task')" class="nlm-tree-leaf-actions">
                                        <template v-if="section.treeScope === 'task'">
                                          <a-tooltip v-if="workbenchPackageTaskCanDownload(node.raw)" title="下载">
                                            <a-button
                                              type="text"
                                              class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                              title="下载"
                                              aria-label="下载打包结果"
                                              @click.stop="downloadWorkbenchPackageTask(node.raw)"
                                            ><ds-icon name="download" /></a-button>
                                          </a-tooltip>
                                          <a-dropdown :trigger="['click']" @click.stop>
                                            <a-tooltip title="更多">
                                              <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                                            </a-tooltip>
                                            <template #overlay>
                                              <a-menu @click="({ key }) => handleTreeContextMenu(key, node, section.key, section.treeScope)">
                                                <a-menu-item v-if="workbenchPackageTaskCanDownload(node.raw)" key="download-package">下载</a-menu-item>
                                                <a-menu-item v-if="isWorkbenchPackageDownloadTask(node.raw) && ['queued','parsing'].includes(workbenchAnalysisStatusOf(node.raw))" key="abort-task">中止</a-menu-item>
                                                <a-menu-item v-if="batchParentShowAbortQuick(node.raw)" key="abort-task">一键中止</a-menu-item>
                                                <a-menu-item v-if="batchParentCanRerunMenu(node.raw)" key="rerun-all">一键重跑</a-menu-item>
                                                <a-menu-item
                                                  v-if="batchParentCanRerunMenu(node.raw)"
                                                  key="rerun-failed-only"
                                                  :disabled="!batchParentFailedChildCount(node.raw)"
                                                >一键重跑（仅失败）</a-menu-item>
                                                <a-menu-item
                                                  v-if="batchParentCanRerunMenu(node.raw)"
                                                  key="clear-failed-only"
                                                  :disabled="!batchParentFailedChildCount(node.raw)"
                                                >一键清空（仅失败）</a-menu-item>
                                                <a-menu-item v-if="workbenchTaskCanShowRerun(node.raw)" key="rerun-task">{{ workbenchTaskRerunMenuLabel(node.raw) }}</a-menu-item>
                                                <a-menu-divider v-if="workbenchTaskMenuHasNonDelete(node.raw)" />
                                                <a-menu-item key="delete" danger>删除</a-menu-item>
                                              </a-menu>
                                            </template>
                                          </a-dropdown>
                                        </template>
                                        <template v-else>
                                          <a-dropdown :trigger="['click']" @click.stop>
                                            <a-tooltip title="更多">
                                              <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                                            </a-tooltip>
                                            <template #overlay>
                                              <a-menu @click="({ key }) => handleTreeContextMenu(key, node, section.key, section.treeScope)">
                                                <a-menu-item v-if="section.key === 'material'" key="rerun">重跑</a-menu-item>
                                                <a-menu-item v-if="section.key === 'material'" key="download">下载</a-menu-item>
                                                <a-sub-menu v-if="section.key === 'analysis'" key="export-analysis-sub-queue" title="下载">
                                                  <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                                                  <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                                                  <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                                                </a-sub-menu>
                                                <a-menu-divider />
                                                <a-menu-item key="rename">重命名</a-menu-item>
                                                <a-menu-item key="delete" danger>删除</a-menu-item>
                                              </a-menu>
                                            </template>
                                          </a-dropdown>
                                          <a-tooltip title="添加到对话">
                                            <a-button
                                              type="text"
                                              class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                              title="添加到对话"
                                              aria-label="添加到对话"
                                              @click.stop="handleTreeContextMenu('ref', node, section.key, section.treeScope)"
                                            ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                                          </a-tooltip>
                                        </template>
                                      </div>
                                    </span>
                                  </div>
                                  <template #overlay>
                                    <a-menu @click="({ key }) => handleTreeContextMenu(key, node, section.key, section.treeScope)">
                                      <template v-if="section.treeScope === 'task'">
                                        <a-menu-item v-if="workbenchPackageTaskCanDownload(node.raw)" key="download-package">下载</a-menu-item>
                                        <a-menu-item v-if="isWorkbenchPackageDownloadTask(node.raw) && ['queued','parsing'].includes(workbenchAnalysisStatusOf(node.raw))" key="abort-task">中止</a-menu-item>
                                        <a-menu-item v-if="batchParentShowAbortQuick(node.raw)" key="abort-task">一键中止</a-menu-item>
                                        <a-menu-item v-if="batchParentCanRerunMenu(node.raw)" key="rerun-all">一键重跑</a-menu-item>
                                        <a-menu-item
                                          v-if="batchParentCanRerunMenu(node.raw)"
                                          key="rerun-failed-only"
                                          :disabled="!batchParentFailedChildCount(node.raw)"
                                        >一键重跑（仅失败）</a-menu-item>
                                        <a-menu-item
                                          v-if="batchParentCanRerunMenu(node.raw)"
                                          key="clear-failed-only"
                                          :disabled="!batchParentFailedChildCount(node.raw)"
                                        >一键清空（仅失败）</a-menu-item>
                                        <a-menu-item v-if="workbenchTaskCanShowRerun(node.raw)" key="rerun-task">{{ workbenchTaskRerunMenuLabel(node.raw) }}</a-menu-item>
                                        <a-menu-divider v-if="workbenchTaskMenuHasNonDelete(node.raw)" />
                                        <a-menu-item key="delete" danger>删除</a-menu-item>
                                      </template>
                                      <template v-else>
                                        <a-menu-item key="ref">
                                          <span class="wb-menu-action-item">
                                            <iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon wb-menu-action-item__icon" aria-hidden="true"></iconpark-icon>
                                            <span>添加到对话</span>
                                          </span>
                                        </a-menu-item>
                                        <a-menu-item v-if="section.key === 'material'" key="rerun">重跑</a-menu-item>
                                        <a-menu-item v-if="section.key === 'material'" key="download">下载</a-menu-item>
                                        <a-sub-menu v-if="section.key === 'analysis'" key="export-analysis-sub-queue-ctx" title="下载">
                                          <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                                          <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                                          <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                                        </a-sub-menu>
                                        <a-menu-divider />
                                        <a-menu-item key="rename">重命名</a-menu-item>
                                        <a-menu-item key="delete" danger>删除</a-menu-item>
                                      </template>
                                    </a-menu>
                                  </template>
                                </a-dropdown>
                              </div>
                            </template>
                          </template>
                          <a-empty v-else class="nlm-task-queue-empty nlm-task-queue-empty--guided wb-material-file-tree-empty" :description="false" />
                        </div>
                        </template>
                    ${freeauditPanels.rightTaskSectionClose()}
                    ${freeauditPanels.rightResultSectionOpen()}
                        <div class="nlm-cards-wrap nlm-tree-wrap">
                        <a-tree
                          v-if="workbenchAnalysisResultAntTreeData.length"
                          class="wb-material-file-tree"
                          block-node
                          :show-line="{ showLeafIcon: false }"
                          :show-icon="false"
                          :tree-data="workbenchAnalysisResultAntTreeData"
                          v-model:expanded-keys="workbenchAnalysisResultTreeExpandedKeys"
                          draggable
                          @drop="onWorkbenchAnalysisResultTreeDrop"
                        >
                          <template #switcherIcon><span aria-hidden="true"></span></template>
                          <template #title="d">
                            <a-dropdown v-if="d.isFolder" :trigger="['contextmenu']" @click.stop>
                              <div
                                :class="['nlm-tree-leaf', 'nlm-tree-leaf--folder', {
                                  'nlm-tree-leaf--result-user-folder': d.folderKind === 'userResult' && !d.linkedTaskFolder,
                                  'nlm-tree-leaf--task-run': d.linkedTaskFolder,
                                }, workbenchBulkRowClass(workbenchBulkResultFolderDescriptor(d))]"
                                :title="d.linkedTaskFolder ? '任务完成时自动创建，可改名或删除' : ''"
                                @click.stop="onWorkbenchBulkResultFolderRowClick($event, d)"
                              >
                                <span v-if="workbenchBulkScopeActive('result', 'result')" class="workbench-bulk-tree-check" @click.stop>
                                  <a-checkbox :checked="workbenchBulkIsSelected(workbenchBulkResultFolderDescriptor(d))" @change="(e) => toggleWorkbenchBulkSelection(workbenchBulkResultFolderDescriptor(d), e)" />
                                </span>
                                <span class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle" aria-hidden="true">
                                  <ds-icon name="chevron-right" class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev"
                                    v-if="!d.isLeaf"
                                    :class="{ 'wb-material-file-tree-switcher-chev--expanded': workbenchAnalysisResultTreeExpandedKeys.includes(String(d.key)) }"
                                   />
                                </span>
                                <div class="nlm-tree-leaf-title-wrap">
                                  <div class="nlm-tree-leaf-col nlm-tree-leaf-col--folder">
                                    <span class="nlm-stat-count-label-row">
                                      <span class="nlm-stat-count-tag">{{ Number(d.descendantFileCount) || 0 }}</span>
                                      <div class="nlm-tree-leaf-title">{{ d.title }}</div>
                                    </span>
                                  </div>
                                </div>
                                <span class="nlm-tree-leaf-right">
                                  <div v-if="!workbenchBulkScopeActive('result', 'result')" class="nlm-tree-leaf-actions">
                                    <a-dropdown :trigger="['click']" @click.stop>
                                      <a-tooltip title="更多">
                                        <a-button
                                          type="text"
                                          class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                          title="更多"
                                          aria-label="文件夹操作"
                                          @click.stop
                                        ><ds-icon name="more" /></a-button>
                                      </a-tooltip>
                                      <template #overlay>
                                        <a-menu @click="({ key }) => onWorkbenchAnalysisResultAnyFolderMenu(key, d)">
                                          <a-menu-item key="new-folder">
                                            <span class="wb-menu-action-item">
                                              <ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('new-folder')" aria-hidden="true" />
                                              <span>新建文件夹</span>
                                            </span>
                                          </a-menu-item>
                                          <a-menu-item key="download-folder-package">打包下载</a-menu-item>
                                          <template v-if="d.userFolderId">
                                            <a-menu-divider />
                                            <a-menu-item key="rename">重命名</a-menu-item>
                                            <a-menu-item key="delete" danger>删除</a-menu-item>
                                          </template>
                                        </a-menu>
                                      </template>
                                    </a-dropdown>
                                    <a-tooltip title="添加到对话">
                                      <a-button
                                        type="text"
                                        class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                        title="添加到对话"
                                        :aria-label="workbenchAnalysisResultFolderChatRefMenuLabel(d)"
                                        @click.stop="onWorkbenchAnalysisResultAnyFolderMenu('ref', d)"
                                      ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                                    </a-tooltip>
                                  </div>
                                </span>
                              </div>
                              <template #overlay>
                                <a-menu @click="({ key }) => onWorkbenchAnalysisResultAnyFolderMenu(key, d)">
                                  <a-menu-item key="new-folder">
                                    <span class="wb-menu-action-item">
                                      <ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('new-folder')" aria-hidden="true" />
                                      <span>新建文件夹</span>
                                    </span>
                                  </a-menu-item>
                                  <a-menu-divider />
                                  <a-menu-item key="ref">
                                    <span class="wb-menu-action-item">
                                      <iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon wb-menu-action-item__icon" aria-hidden="true"></iconpark-icon>
                                      <span>{{ workbenchAnalysisResultFolderChatRefMenuLabel(d) }}</span>
                                    </span>
                                  </a-menu-item>
                                  <a-menu-item key="download-folder-package">打包下载</a-menu-item>
                                  <template v-if="d.userFolderId">
                                    <a-menu-divider />
                                    <a-menu-item key="rename">重命名</a-menu-item>
                                    <a-menu-item key="delete" danger>删除</a-menu-item>
                                  </template>
                                </a-menu>
                              </template>
                            </a-dropdown>
                            <a-dropdown v-else :trigger="['contextmenu']" @click.stop>
                              <div
                                :class="['nlm-tree-leaf', 'nlm-tree-leaf--analysis', { checked: isWorkbenchAnalysisResultTreeLeafSelected(d) }, workbenchBulkRowClass(workbenchBulkResultFileDescriptor(d))]"
                                draggable="true"
                                @click.stop="onWorkbenchBulkResultFileRowClick($event, d)"
                                @dragstart="onWorkbenchAnalysisResultTreeDragStart($event, d)"
                              >
                                <span v-if="workbenchBulkScopeActive('result', 'result')" class="workbench-bulk-tree-check" @click.stop>
                                  <a-checkbox :checked="workbenchBulkIsSelected(workbenchBulkResultFileDescriptor(d))" @change="(e) => toggleWorkbenchBulkSelection(workbenchBulkResultFileDescriptor(d), e)" />
                                </span>
                                <span class="nlm-tree-leaf-icon">
                                  <ds-icon
                                    :name="getMaterialIcon(wbMaterialVmById(d.materialId) || { type: 'analysis' })"
                                    :class="getMaterialIconColorClass(wbMaterialVmById(d.materialId) || { type: 'analysis' })"
                                    title="结果"
                                    aria-hidden="true"
                                  />
                                </span>
                                <div class="nlm-tree-leaf-title-wrap">
                                  <div class="nlm-tree-leaf-col">
                                    <div
                                      class="nlm-tree-leaf-title"
                                      @click.stop="workbenchBulkScopeActive('result', 'result') ? toggleWorkbenchBulkSelection(workbenchBulkResultFileDescriptor(d)) : openWorkbenchAnalysisResultTreeLeafDetail(d)"
                                    >{{ (wbMaterialVmById(d.materialId) || {}).title }}</div>
                                  </div>
                                </div>
                                <span class="nlm-tree-leaf-right" v-if="wbMaterialVmById(d.materialId)">
                                  <div v-if="!workbenchBulkScopeActive('result', 'result')" class="nlm-tree-leaf-actions">
                                    <a-dropdown :trigger="['click']" @click.stop>
                                      <a-tooltip title="更多">
                                        <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                                      </a-tooltip>
                                      <template #overlay>
                                        <a-menu @click="({ key }) => onWorkbenchAnalysisResultTreeRawMenu(key, d)">
                                          <a-sub-menu key="export-result-tree-ellipsis" title="下载">
                                            <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                                            <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                                            <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                                          </a-sub-menu>
                                          <a-menu-divider />
                                          <a-menu-item key="rename">重命名</a-menu-item>
                                          <a-menu-item key="delete" danger>删除</a-menu-item>
                                        </a-menu>
                                      </template>
                                    </a-dropdown>
                                    <a-tooltip title="添加到对话">
                                      <a-button
                                        type="text"
                                        class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                        title="添加到对话"
                                        aria-label="添加到对话"
                                        @click.stop="onWorkbenchAnalysisResultTreeRawToggleRef(d)"
                                      ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                                    </a-tooltip>
                                  </div>
                                </span>
                              </div>
                              <template #overlay>
                                <a-menu @click="({ key }) => onWorkbenchAnalysisResultTreeRawMenu(key, d)">
                                  <a-menu-item key="ref">
                                    <span class="wb-menu-action-item">
                                      <iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon wb-menu-action-item__icon" aria-hidden="true"></iconpark-icon>
                                      <span>添加到对话</span>
                                    </span>
                                  </a-menu-item>
                                  <a-sub-menu key="export-result-tree-ctx" title="下载">
                                    <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                                    <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                                    <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                                  </a-sub-menu>
                                  <a-menu-divider />
                                  <a-menu-item key="rename">重命名</a-menu-item>
                                  <a-menu-item key="delete" danger>删除</a-menu-item>
                                </a-menu>
                              </template>
                            </a-dropdown>
                          </template>
                        </a-tree>
                        <a-empty v-else class="wb-material-file-tree-empty" :description="false" />
                        </div>
                    ${freeauditPanels.rightResultSectionClose()}
                  ${freeauditPanels.rightSplitPanelClose()}
                </template>
                <div v-if="isWorkbenchV2DetailPaneVisible" class="nlm-side-panel-body is-analysis-detail-open" style="display:flex;flex-direction:column;min-height:0;">
                  <div class="workbench-v2-detail-pane__body">
                  <div
                    v-if="workbenchEmbedMode === 'v2' && selectedExtractionResult"
                    class="nlm-source-detail nlm-extraction-detail"
                  >
                    <div v-if="workbenchEmbedMode !== 'v2'" class="back-row">
                      <a-tooltip title="返回">
                        <button type="button" class="back-btn back-btn--icon-only" title="返回" aria-label="关闭详情" @click="selectedExtractionId = null; selectedTreeNode = null; sourcesRightView = 'list'"><svg class="iconpark-icon"><use href="#arrow-left"></use></svg></button>
                      </a-tooltip>
                    </div>
                    <h3 class="nlm-source-title">{{ selectedExtractionResult.dataSourceName }} 抽取结果</h3>
                    <div class="nlm-source-guide">
                      <div class="nlm-source-guide-header" @click="sourceGuideOpen = !sourceGuideOpen">
                        摘要 <ds-icon :name="sourceGuideOpen ? 'up' : 'down'" />
                      </div>
                      <div v-show="sourceGuideOpen" class="nlm-source-guide-body">
                        <p>{{ (selectedExtractionResult.snippets || []).length }} 条抽取结果，根据规则「{{ selectedExtractionResult.prompt || '（未填写）' }}」从 {{ selectedExtractionResult.dataSourceName }} 获取。</p>
                      </div>
                    </div>
                    <div class="nlm-source-read">
                      <div v-for="(sn, i) in (selectedExtractionResult.snippets || [])" :key="i" class="excerpt nlm-extraction-detail-snippet">
                        <strong>{{ sn.title }}</strong>
                        <p style="margin:var(--ds-space-xxs) 0 0 0">{{ sn.desc }}</p>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else-if="workbenchEmbedMode === 'v2' && selectedResourcePreview"
                    class="nlm-source-detail nlm-source-detail--workbench-preview material-preview-modal material-preview-modal--workbench-embed workbench-v2-material-preview"
                  >
                    <div v-if="workbenchEmbedMode !== 'v2'" class="back-row workbench-v2-detail-action-row" style="display:flex; align-items:center; flex-wrap:nowrap; justify-content:flex-start; gap:var(--ds-space-xxs);">
                      <a-tooltip v-if="workbenchEmbedMode !== 'v2'" title="返回">
                        <button type="button" class="back-btn back-btn--icon-only" title="返回" aria-label="关闭详情" @click="closeResourcePreview"><svg class="iconpark-icon"><use href="#arrow-left"></use></svg></button>
                      </a-tooltip>
                      <span class="back-row__title" style="text-align:left;">{{ selectedResourcePreview.name || '资源预览' }}</span>
                      <a-tooltip title="添加到对话">
                        <a-button
                          type="text"
                          class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                          title="添加到对话"
                          aria-label="添加到对话"
                          style="margin-left:auto;"
                          @click.stop="addResourceToChat(selectedResourcePreview.type, selectedResourcePreview)"
                        ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                      </a-tooltip>
                      <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                        <a-tooltip title="更多">
                          <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                        </a-tooltip>
                        <template #overlay>
                          <a-menu @click="({ key }) => onResourcePreviewContextMenu(key, selectedResourcePreview)">
                            <a-menu-item key="delete" danger>删除</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                    </div>
                    <h3
                      v-if="v2ResourcePreviewTabCount === 1"
                      class="workbench-v2-material-preview-title"
                    >{{ v2ResourcePreviewSingleTabLabel }}</h3>
                    <a-tabs
                      v-model:activeKey="resourcePreviewTab"
                      class="workbench-v2-material-preview-tabs"
                      :class="{ 'is-single-tab': v2ResourcePreviewTabCount === 1 }"
                      tab-position="top"
                      aria-label="资源预览"
                    >
                      <a-tab-pane v-if="selectedResourcePreview.type === 'database'" key="schema" tab="字段信息">
                        <div class="workbench-v2-preview-pane">
                          <div class="workbench-v2-preview-pane__body">
                            <div class="nlm-source-read">
                              <div v-for="table in (selectedResourcePreview.tables || [])" :key="table.name" class="excerpt">
                                <strong>{{ table.name }}</strong>
                                <p style="margin:var(--ds-space-xxs) 0 0 0; white-space:pre-wrap;">{{ table.ddl }}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </a-tab-pane>
                      <a-tab-pane v-else key="topology" tab="本体建模">
                        <div class="workbench-v2-preview-pane">
                          <div class="workbench-v2-preview-pane__body">
                            <div class="nlm-empty-state">
                              <p class="nlm-empty-desc">拓扑视图占位：实体 {{ selectedResourcePreview.entityCount || 0 }}，关系 {{ selectedResourcePreview.edgeCount || 0 }}</p>
                            </div>
                          </div>
                        </div>
                      </a-tab-pane>
                    </a-tabs>
                  </div>
                  <div
                    v-else-if="workbenchEmbedMode === 'v2' && selectedMaterialDetail && !(selectedMaterial && selectedMaterial.type === 'analysis')"
                    class="nlm-source-detail nlm-source-detail--workbench-preview material-preview-modal material-preview-modal--workbench-embed workbench-v2-material-preview"
                  >
                    <div v-if="workbenchEmbedMode !== 'v2'" class="back-row workbench-v2-detail-action-row" style="display:flex; align-items:center; flex-wrap:nowrap; justify-content:flex-start; gap:var(--ds-space-xxs);">
                      <a-tooltip v-if="workbenchEmbedMode !== 'v2'" title="返回">
                        <button type="button" class="back-btn back-btn--icon-only" title="返回" aria-label="关闭详情" @click="closeWorkbenchMaterialDetail"><svg class="iconpark-icon"><use href="#arrow-left"></use></svg></button>
                      </a-tooltip>
                      <span class="back-row__title" style="text-align:left;">{{ (workbenchSelectedProjectMaterialRow && workbenchSelectedProjectMaterialRow.name) || (selectedMaterial && selectedMaterial.title) || '资料预览' }}</span>
                      <template v-if="selectedMaterial && selectedMaterial.type === 'raw'">
                        <div style="margin-left:auto;display:flex;align-items:center;gap:var(--ds-space-xxs);">
                          <a-dropdown v-if="workbenchMaterialMoreActions(selectedMaterial).length" :trigger="['click']" placement="bottomRight" @click.stop>
                            <a-tooltip title="更多">
                              <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                            </a-tooltip>
                            <template #overlay>
                              <a-menu @click="({ key }) => handleWorkbenchMaterialAction(key, selectedMaterial)">
                                <template v-for="(action, idx) in workbenchMaterialMoreActions(selectedMaterial)" :key="'v2-detail-more-' + String(selectedMaterial.id || '') + '-' + action">
                                  <a-menu-divider v-if="action === 'delete' && idx > 0" />
                                  <a-menu-item :key="action" :danger="workbenchMaterialActionDanger(action)">{{ workbenchMaterialActionLabel(action) }}</a-menu-item>
                                </template>
                              </a-menu>
                            </template>
                          </a-dropdown>
                          <template v-for="action in workbenchMaterialPrimaryActions(selectedMaterial)" :key="'v2-detail-primary-' + String(selectedMaterial.id || '') + '-' + action">
                            <a-tooltip :title="workbenchMaterialActionLabel(action)">
                              <a-button
                                type="text"
                                class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                :title="workbenchMaterialActionLabel(action)"
                                :aria-label="action === 'ref' ? '添加到对话' : workbenchMaterialActionLabel(action)"
                                @click.stop="handleWorkbenchMaterialAction(action, selectedMaterial)"
                              ><iconpark-icon v-if="action === 'ref'" name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon><ds-icon v-else :name="workbenchMaterialActionIcon(action)" /></a-button>
                            </a-tooltip>
                          </template>
                        </div>
                      </template>
                    </div>
                    <template v-if="selectedMaterial && selectedMaterial.type === 'raw' && selectedMaterial.projectSource && workbenchSelectedProjectMaterialRow">
                      <h3
                        v-if="v2WbMaterialPreviewTabCount === 1"
                        class="workbench-v2-material-preview-title"
                      >{{ v2WbMaterialPreviewSingleTabLabel }}</h3>
                      <a-tabs
                        v-model:activeKey="wbMaterialPreviewActiveTab"
                        class="workbench-v2-material-preview-tabs"
                        :class="{ 'is-single-tab': v2WbMaterialPreviewTabCount === 1 }"
                        tab-position="top"
                        aria-label="资料预览：文件预览或解析结果"
                      >
                        <a-tab-pane key="preview" tab="文件预览">
                          <div class="workbench-v2-preview-pane">
                            <div
                              v-if="(selectedMaterial.rawSubtype || 'document') !== 'table'"
                              class="workbench-v2-preview-pane__chrome"
                              role="toolbar"
                              aria-label="文件预览操作"
                            >
                              <div class="workbench-v2-preview-pane__actions">
                                <a-button
                                  type="default"
                                  class="material-preview-download-link"
                                  title="下载"
                                  aria-label="下载"
                                  @click.stop="downloadWorkbenchMaterialPreview(selectedMaterial)"
                                >下载</a-button>
                              </div>
                            </div>
                            <div class="workbench-v2-preview-pane__body">
                              <template v-if="(selectedMaterial.rawSubtype || 'document') !== 'table'">
                                <div
                                  v-for="(page, pi) in workbenchMaterialDocumentPages"
                                  :key="'v2-wb-embed-mp-' + pi"
                                  class="nlm-original-doc-page workbench-v2-preview-page"
                                >{{ page }}</div>
                              </template>
                              <div v-else-if="selectedMaterial.originalView && selectedMaterial.originalView.headers" class="nlm-original-table-wrap">
                                <table class="nlm-original-table">
                                  <thead><tr><th v-for="(h, hi) in selectedMaterial.originalView.headers" :key="hi">{{ h }}</th></tr></thead>
                                  <tbody><tr v-for="(row, ri) in (selectedMaterial.originalView.rows || [])" :key="ri"><td v-for="(cell, ci) in row" :key="ci">{{ cell }}</td></tr></tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </a-tab-pane>
                        <a-tab-pane key="ocr" tab="解析结果">
                          <div class="workbench-v2-preview-pane workbench-v2-preview-pane--ocr">
                            <div
                              v-if="(selectedMaterial.rawSubtype || 'document') !== 'table'"
                              class="workbench-v2-preview-pane__chrome"
                              role="toolbar"
                              aria-label="解析结果预览"
                            >
                              <div class="workbench-v2-preview-pane__actions material-preview-ocr-chrome-actions">
                                <div class="ds-mode-switch-slider material-preview-ocr-mode-switch" :class="{ 'is-assisted': materialPreviewOcrShowLineNumbers, 'is-auto': !materialPreviewOcrShowLineNumbers }" role="tablist" aria-label="解析结果预览模式切换">
                                  <span class="ds-mode-switch-slider__thumb" aria-hidden="true"></span>
                                  <a-tooltip title="普通">
                                    <button
                                      type="button"
                                      class="ds-mode-switch-slider__item"
                                      :class="{ 'is-current': !materialPreviewOcrShowLineNumbers }"
                                      role="tab"
                                      :aria-selected="!materialPreviewOcrShowLineNumbers"
                                      :tabindex="!materialPreviewOcrShowLineNumbers ? 0 : -1"
                                      title="普通"
                                      aria-label="普通预览"
                                      @click="materialPreviewOcrShowLineNumbers = false"
                                    >
                                      <ds-icon name="eye" aria-hidden="true" />
                                    </button>
                                  </a-tooltip>
                                  <a-tooltip title="行号">
                                    <button
                                      type="button"
                                      class="ds-mode-switch-slider__item"
                                      :class="{ 'is-current': materialPreviewOcrShowLineNumbers }"
                                      role="tab"
                                      :aria-selected="materialPreviewOcrShowLineNumbers"
                                      :tabindex="materialPreviewOcrShowLineNumbers ? 0 : -1"
                                      title="行号"
                                      aria-label="带行号预览"
                                      @click="materialPreviewOcrShowLineNumbers = true"
                                    >
                                      <ds-icon name="code" aria-hidden="true" />
                                    </button>
                                  </a-tooltip>
                                </div>
                              </div>
                            </div>
                            <div class="workbench-v2-preview-pane__body">
                              <div
                                v-for="(page, pi) in workbenchMaterialOcrPagesDisplayed"
                                :key="'v2-wb-embed-ocr-' + pi"
                                :class="['nlm-original-doc-page', 'workbench-v2-preview-page', { 'ds-font-mono': materialPreviewOcrShowLineNumbers }]"
                              >{{ page }}</div>
                            </div>
                          </div>
                        </a-tab-pane>
                      </a-tabs>
                    </template>
                    <template v-else-if="selectedMaterial && selectedMaterial.type === 'raw'">
                      <div class="wb-material-preview-shell wb-material-preview-shell--workbench-embed">
                        <div class="wb-material-preview-toolbar">
                          <span class="wb-material-preview-toolbar-meta">在线预览（PDF）</span>
                          <span class="wb-material-preview-toolbar-meta">1 / {{ workbenchMaterialDocumentPages.length || 1 }}</span>
                        </div>
                        <div class="wb-material-preview-body">
                          <div
                            v-for="(page, pi) in workbenchMaterialDocumentPages"
                            :key="'v2-wb-embed-fb-' + pi"
                            class="nlm-original-doc-page wb-material-preview-page"
                          >{{ page }}</div>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <h3 class="nlm-source-title">{{ selectedMaterialDetail.title }}</h3>
                      <div class="nlm-source-read" ref="sourceRead">
                        <div v-for="(ex, i) in detailExcerpts" :key="i" :class="['excerpt', { highlight: highlightSourceId === selectedMaterialDetail.id && highlightExcerptIndex === i }]" :ref="el => setExcerptRef(selectedMaterialDetail.id, i, el)">{{ ex }}</div>
                      </div>
                    </template>
                  </div>
                  <div
                    v-else-if="workbenchEmbedMode === 'v2' && wbDetailSelectedSkill && workbenchV2DetailActiveSkillTab"
                    class="nlm-source-detail nlm-source-detail--workbench-preview material-preview-modal material-preview-modal--workbench-embed workbench-v2-material-preview workbench-v2-skill-preview-embed"
                    style="flex:1;min-height:0;"
                  >
                    <div class="tc-skill-modal-body tc-skill-modal-body--unified workbench-v2-skill-preview-embed__body">
                      <SkillConfigEditor
                        :skill="wbDetailSelectedSkill"
                        v-model:nav-key="wbProjectSkillConfigNavKey"
                        v-model:expanded-keys="wbProjectSkillConfigTreeExpandedKeys"
                        :locked="true"
                        :polish-key="freeAuditAiPolishKey"
                        :polish-undo="freeAuditPolishUndo"
                        polish-prefix="wb"
                        :analysis-placeholder="getSkillAnalysisRulePlaceholder()"
                        rule-title="审计思路"
                      />
                    </div>
                  </div>
                  <div
                    v-if="workbenchEmbedMode !== 'v2' && !(selectedExtractionResult || selectedResourcePreview || (selectedMaterialDetail && !(selectedMaterial && selectedMaterial.type === 'analysis')))"
                    class="nlm-panel-header"
                    style="flex-shrink:0;"
                  >
                    <div class="nlm-panel-title-row">
                      <span class="nlm-panel-title">{{ selectedMaterialIsWorkbenchCreatedTask ? '任务' : '结果' }}</span>
                    </div>
                  </div>
                  <div
                    class="nlm-source-detail nlm-source-detail--workbench-preview nlm-fill-scroll analysis-result-preview-modal analysis-result-preview-modal--workbench-embed"
                    style="flex:1;min-height:0;"
                    v-if="selectedMaterial && selectedMaterial.type === 'analysis'"
                  >
                    <div v-if="workbenchEmbedMode !== 'v2'" class="back-row workbench-v2-detail-action-row" style="display:flex; align-items:center; flex-wrap:nowrap; justify-content:flex-start; gap:var(--ds-space-xxs);">
                      <a-tooltip v-if="workbenchEmbedMode !== 'v2'" title="返回">
                        <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--nlm wb-back-icon-btn" title="返回" aria-label="返回列表" @click="closeWorkbenchMaterialDetail">
                          <svg class="iconpark-icon"><use href="#arrow-left"></use></svg>
                        </a-button>
                      </a-tooltip>
                      <span class="back-row__title" style="text-align:left;">{{ workbenchEmbedRightAnalysisHeaderTitle }}</span>
                      <a-dropdown v-if="selectedMaterial && !selectedMaterialIsWorkbenchCreatedTask" :trigger="['click']" placement="bottomRight" @click.stop>
                        <a-tooltip title="更多">
                          <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" style="margin-left:auto;" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                        </a-tooltip>
                        <template #overlay>
                          <a-menu @click="({ key }) => handleTreeContextMenu(key, { raw: selectedMaterial }, 'analysis')">
                            <a-menu-item key="rename">重命名</a-menu-item>
                            <a-sub-menu key="export-embed-header-sub" title="下载">
                              <a-menu-item key="export-md">下载为 Markdown</a-menu-item>
                              <a-menu-item key="export-pdf">下载为 PDF</a-menu-item>
                              <a-menu-item key="export-docx">下载为 Word</a-menu-item>
                            </a-sub-menu>
                            <a-menu-item key="delete">删除</a-menu-item>
                          </a-menu>
                        </template>
                      </a-dropdown>
                      <a-tooltip v-if="selectedMaterial && !selectedMaterialIsWorkbenchCreatedTask" title="添加到对话">
                        <a-button
                          type="text"
                          class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                          title="添加到对话"
                          aria-label="添加到对话"
                          @click.stop="handleTreeContextMenu('ref', { raw: selectedMaterial }, 'analysis')"
                        ><iconpark-icon name="xinxiyifasong-yinyong" class="iconpark-icon" aria-hidden="true"></iconpark-icon></a-button>
                      </a-tooltip>
                      <template v-else-if="selectedMaterialIsWorkbenchCreatedTask">
                        <a-tooltip title="刷新">
                          <a-button
                            type="text"
                            class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon nlm-toolbar-pool-refresh-btn"
                            style="margin-left:auto;"
                            :disabled="!workbenchProjectId"
                            title="刷新"
                            aria-label="重新加载任务列表，不刷新对话"
                            @click.stop="refreshWorkbenchDemoResources('task')"
                          ><ds-icon name="refresh" aria-hidden="true" /></a-button>
                        </a-tooltip>
                        <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
                          <a-tooltip title="更多">
                            <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                          </a-tooltip>
                          <template #overlay>
                            <a-menu @click="({ key }) => handleTreeContextMenu(key, { raw: selectedMaterial }, 'analysis', 'task')">
                              <a-menu-item v-if="selectedMaterial && ['queued','parsing'].includes(workbenchAnalysisStatusOf(selectedMaterial))" key="abort-task">中止</a-menu-item>
                              <a-menu-item v-if="selectedMaterial && batchParentCanRerunMenu(selectedMaterial)" key="rerun-all">一键重跑</a-menu-item>
                              <a-menu-item v-if="selectedMaterial && workbenchTaskCanShowRerun(selectedMaterial)" key="rerun-task">{{ workbenchTaskRerunMenuLabel(selectedMaterial) }}</a-menu-item>
                              <a-menu-item key="delete">删除</a-menu-item>
                            </a-menu>
                          </template>
                        </a-dropdown>
                      </template>
                    </div>
                    <div class="workbench-analysis-result-embed">
                      <div class="tc-skill-modal-body tc-skill-modal-body--unified workbench-analysis-result-unified-body">
                        <a-tabs
                          :activeKey="wbAnalysisResultPreviewActiveTab"
                          class="skill-unified-modal-tabs workbench-analysis-result-embed-tabs workbench-embed-top-tabs"
                          tab-position="top"
                          aria-label="任务/结果预览：基本信息与任务详情"
                          @update:activeKey="onWorkbenchAnalysisResultPreviewTabUpdate"
                        >
                          <a-tab-pane v-if="selectedMaterialIsWorkbenchCreatedTask" key="task-config" tab="任务详情">
                            <div class="workbench-result-preview-pane workbench-result-preview-pane--body">
                              <div class="ds-unified-tab-pane-stack">
                                <div class="workbench-result-preview-tab-inner workbench-result-preview-tab-inner--task-dag">
                                  <div
                                    v-if="workbenchSelectedTaskConfigDagModel"
                                    class="wb-task-detail-sections"
                                    role="region"
                                    :aria-label="wbTaskConfigIsGenerateSkillTask ? '任务详情：产出技能、生成要求与引用上下文' : '任务详情：产出结果、使用技能与引用资源'"
                                  >
                                    <template v-if="selectedMaterialIsPackageDownloadTask">
                                      <section class="wb-task-detail-section">
                                        <div class="wb-task-detail-section__head">
                                          <h4 class="wb-task-detail-section__title">任务产物</h4>
                                          <a-tooltip title="下载">
                                            <a-button
                                              type="text"
                                              class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm wb-task-detail-section__action"
                                              title="下载"
                                              aria-label="下载打包结果"
                                              :disabled="!workbenchPackageTaskCanDownload(selectedMaterial)"
                                              @click="downloadWorkbenchPackageTask(selectedMaterial)"
                                            ><ds-icon name="download" /></a-button>
                                          </a-tooltip>
                                        </div>
                                        <ul v-if="workbenchPackageTaskCanDownload(selectedMaterial)" class="wb-task-detail-simple-list">
                                          <FreeAuditTaskDetailSimpleRow @open="downloadWorkbenchPackageTask(selectedMaterial)">
                                            <template #icon>
                                              <ds-icon name="download" title="ZIP 文件包" />
                                            </template>
                                            {{ workbenchPackageTaskArtifactLabel(selectedMaterial) }}
                                          </FreeAuditTaskDetailSimpleRow>
                                        </ul>
                                        <div v-else class="wb-task-detail-generate-req-box" role="region" aria-label="任务产物">
                                          <p v-if="workbenchAnalysisStatusOf(selectedMaterial) === 'failed'" class="wb-task-detail-generate-req-body">{{ wbPackageTaskFailureReason }}</p>
                                          <p v-else class="wb-task-detail-generate-req-body">文件包生成中，完成后可在任务列表直接下载。</p>
                                        </div>
                                      </section>
                                      <section class="wb-task-detail-section">
                                        <h4 class="wb-task-detail-section__title">打包范围</h4>
                                        <div class="wb-task-detail-generate-req-box" role="region" aria-label="打包范围">
                                          <div class="wb-task-detail-package-scope">
                                            <p class="wb-task-detail-generate-req-body">{{ wbPackageTaskScopeText }}</p>
                                            <div class="wb-task-detail-package-scope__tree-panel wb-task-create-transfer">
                                              <div class="wb-task-create-transfer__scroll wb-material-file-drawer wb-task-detail-package-scope__tree-scroll">
                                                <div class="nlm-cards-wrap nlm-tree-wrap wb-task-create-resource-tree-wrap">
                                                  <div
                                                    v-for="row in wbPackageTaskPreviewRows"
                                                    :key="'task-pkg-scope-' + row.kind + '-' + row.key + '-' + row.depth"
                                                    :class="[
                                                      'nlm-tree-leaf',
                                                      'wb-task-detail-package-scope__tree-row',
                                                      row.kind === 'folder' ? 'nlm-tree-leaf--folder' : 'nlm-tree-leaf--analysis',
                                                    ]"
                                                    role="treeitem"
                                                    :style="{ paddingLeft: (row.depth * 16) + 'px' }"
                                                  >
                                                    <span class="wb-task-create-tree-check" @click.stop>
                                                      <a-checkbox :checked="true" disabled />
                                                    </span>
                                                    <span
                                                      v-if="row.kind === 'folder'"
                                                      class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle"
                                                      aria-hidden="true"
                                                    >
                                                      <ds-icon
                                                        name="chevron-right"
                                                        class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev wb-material-file-tree-switcher-chev--expanded"
                                                      />
                                                    </span>
                                                    <span v-else class="nlm-tree-leaf-icon" aria-hidden="true">
                                                      <svg class="iconpark-icon is-result"><use href="#notes"></use></svg>
                                                    </span>
                                                    <div class="nlm-tree-leaf-title-wrap">
                                                      <div class="nlm-tree-leaf-col" :class="{ 'nlm-tree-leaf-col--folder': row.kind === 'folder' }">
                                                        <div
                                                          class="nlm-tree-leaf-title wb-task-detail-package-scope__tree-title"
                                                          :class="{ 'wb-task-detail-package-scope__tree-title--folder': row.kind === 'folder' }"
                                                          :title="row.title"
                                                        >{{ row.title }}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </section>
                                      <section class="wb-task-detail-section">
                                        <h4 class="wb-task-detail-section__title">打包配置</h4>
                                        <div class="wb-task-detail-generate-req-box" role="region" aria-label="打包配置">
                                          <p class="wb-task-detail-generate-req-body">目录结构：{{ wbPackageTaskStructureText }}</p>
                                          <p class="wb-task-detail-generate-req-body">下载格式：{{ wbPackageTaskFormatText }}</p>
                                          <p class="wb-task-detail-generate-req-body">下载包有效期：30 天</p>
                                        </div>
                                      </section>
                                    </template>
                                    <template v-else>
                                    <section v-if="selectedMaterialIsBatchParentTask" class="wb-task-detail-section wb-task-detail-section--batch-overview">
                                      <h4 class="wb-task-detail-section__title">跑批概览</h4>
                                      <div class="wb-task-detail-generate-req-box" role="region">
                                        <p class="wb-task-detail-generate-req-body">数据源：{{ (selectedMaterial.batchMeta && selectedMaterial.batchMeta.fileName) || '—' }}</p>
                                        <p class="wb-task-detail-generate-req-body">标识列：{{ wbBatchMetaIdColumnText(selectedMaterial) }}</p>
                                        <p class="wb-task-detail-generate-req-body">子任务：{{ workbenchBatchProgressText(selectedMaterial) }}（共 {{ (selectedMaterial.batchMeta && selectedMaterial.batchMeta.total) || 0 }} 条）</p>
                                      </div>
                                    </section>
                                    <section class="wb-task-detail-section">
                                      <h4 class="wb-task-detail-section__title">{{ selectedMaterialIsBatchParentTask ? '执行汇总' : '产出结果' }}</h4>
                                      <ul v-if="!selectedMaterialIsBatchParentTask" class="wb-task-detail-simple-list">
                                        <FreeAuditTaskDetailSimpleRow @open="wbTaskConfigIsGenerateSkillTask ? wbOpenTaskDetailSkill() : openWorkbenchAnalysisModal()">
                                          <template #icon>
                                            <template v-if="selectedMaterial && selectedMaterialIsWorkbenchCreatedTask">
                                              <template v-if="wbTaskConfigIsGenerateSkillTask">
                                                <ds-icon v-if="workbenchAnalysisStatusOf(selectedMaterial) === 'queued'"
                                                  name="clock" class="is-status-queued"
                                                  title="排队中"
                                                 />
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'parsing'"
                                                  class="iconpark-icon is-spin is-status-pending nlm-tree-leaf-progress-ring"
                                                  aria-hidden="true" focusable="false" title="生成中"
                                                ><use href="#loading-four"></use></svg>
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'failed'"
                                                  class="iconpark-icon is-status-failed"
                                                  title="技能生成失败"
                                                ><use href="#close-one"></use></svg>
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'done'"
                                                  class="iconpark-icon is-md"
                                                  title="已产出技能"
                                                ><use href="#book-open"></use></svg>
                                                <svg v-else class="iconpark-icon is-md" title="产出技能"><use href="#book-open"></use></svg>
                                              </template>
                                              <template v-else>
                                                <ds-icon v-if="workbenchAnalysisStatusOf(selectedMaterial) === 'queued'"
                                                  name="clock" class="is-status-queued"
                                                  title="排队中"
                                                 />
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'parsing'"
                                                  class="iconpark-icon is-spin is-status-pending nlm-tree-leaf-progress-ring"
                                                  aria-hidden="true" focusable="false" title="执行中"
                                                ><use href="#loading-four"></use></svg>
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'failed'"
                                                  class="iconpark-icon is-status-failed"
                                                  title="产出失败"
                                                ><use href="#close-one"></use></svg>
                                                <svg v-else-if="workbenchAnalysisStatusOf(selectedMaterial) === 'done'"
                                                  class="iconpark-icon is-result"
                                                  title="Markdown 产出"
                                                ><use href="#notes"></use></svg>
                                                <svg v-else class="iconpark-icon is-result" title="产出结果"><use href="#notes"></use></svg>
                                              </template>
                                            </template>
                                            <svg v-else class="iconpark-icon is-result" title="产出结果"><use href="#notes"></use></svg>
                                          </template>
                                          {{
                                            wbTaskConfigIsGenerateSkillTask ? wbTaskConfigGenerateSkillOutputRowSingleLine : wbTaskConfigResultRowSingleLine
                                          }}
                                        </FreeAuditTaskDetailSimpleRow>
                                      </ul>
                                      <div v-else class="wb-task-detail-generate-req-box"><p class="wb-task-detail-generate-req-body">跑批父任务不展示单条产出；请点击左侧父任务进入子任务列表查看各行结果（演示）。</p></div>
                                    </section>
                                    <section v-if="!wbTaskConfigIsGenerateSkillTask" class="wb-task-detail-section">
                                      <h4 class="wb-task-detail-section__title">任务指令</h4>
                                      <div class="wb-task-detail-generate-req-box" role="region" aria-label="任务指令">
                                        <p class="wb-task-detail-generate-req-body">{{ wbSelectedTaskInstructionDisplay }}</p>
                                      </div>
                                    </section>
                                    <section class="wb-task-detail-section">
                                      <h4 class="wb-task-detail-section__title">{{ wbTaskConfigIsGenerateSkillTask ? '生成要求' : '使用技能' }}</h4>
                                      <template v-if="wbTaskConfigIsGenerateSkillTask">
                                        <div class="wb-task-detail-generate-req-box" role="region" aria-label="创建任务时填写的生成技能要求">
                                          <p class="wb-task-detail-generate-req-body">{{ wbSelectedGenerateSkillIntentDisplay }}</p>
                                        </div>
                                      </template>
                                      <ul v-else class="wb-task-detail-simple-list">
                                        <FreeAuditTaskDetailSimpleRow
                                          :icon-class="{ 'wb-task-detail-tree__icon--accent': workbenchSelectedTaskConfigDagModel.dagMode === 'generate-skill' }"
                                          @open="wbOpenTaskDetailSkill"
                                        >
                                          <template #icon>
                                            <svg class="iconpark-icon" aria-hidden="true" title="技能"><use href="#book-open"></use></svg>
                                          </template>
                                          {{ wbTaskConfigSkillRowSingleLine }}
                                        </FreeAuditTaskDetailSimpleRow>
                                      </ul>
                                    </section>
                                    <section
                                      class="wb-task-detail-section"
                                      :class="{ 'wb-task-detail-section--task-detail-context-embed': wbTaskConfigIsGenerateSkillTask }"
                                    >
                                      <h4 class="wb-task-detail-section__title">{{ wbTaskConfigIsGenerateSkillTask ? '引用上下文' : '引用资源' }}</h4>
                                      <template v-if="wbTaskConfigIsGenerateSkillTask">
                                        <div class="wb-task-context-chat-wrap nlm-chat-body">
                                          <div class="nlm-chat-messages wb-task-context-chat-messages" role="log" aria-live="polite">
                                            <div
                                              v-for="turn in workbenchSelectedTaskDialogTurns"
                                              :key="turn.id"
                                              :class="['nlm-chat-turn', { 'nlm-chat-turn--tool-trace': turn.role === 'thinking' }]"
                                            >
                                              <div v-if="turn.role === 'thinking'" class="nlm-thinking wb-task-context-thinking">
                                                <div class="nlm-thinking-steps nlm-tool-calls">
                                                  <div
                                                    v-for="(call, ci) in (turn.toolCalls || [])"
                                                    :key="turn.id + '-tc-embed-' + ci"
                                                    class="nlm-tool-call nlm-tool-call--plain"
                                                    :class="{ 'nlm-tool-call--stream': call.type === 'text' }"
                                                  >
                                                    <p v-if="call.type === 'text'" class="nlm-tool-stream-text">{{ call.body }}</p>
                                                    <p
                                                      v-else-if="call.type === 'action'"
                                                      class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line"
                                                      :class="{ 'nlm-tool-call-line--running': call.status === 'running' }"
                                                    >
                                                      <span class="nlm-tool-call-line__ic" aria-hidden="true">
                                                        <svg v-if="call.status === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
                                                        <svg v-else-if="call.status === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
                                                        <svg v-else class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
                                                      </span>
                                                      <span class="nlm-tool-call-line__txt">{{ call.label }}</span>
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                              <div v-else class="nlm-msg-row">
                                                <div class="nlm-msg-wrap">
                                                  <div :class="['nlm-msg', turn.role, { 'wb-task-context-msg--system': turn.kind === 'system' }]">{{ turn.text }}</div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </template>
                                      <template v-else>
                                        <ul v-if="workbenchTaskConfigResourcesList.length" class="wb-task-detail-simple-list">
                                          <FreeAuditTaskConfigResourceRow
                                            v-for="(row, idx) in workbenchTaskConfigResourcesList"
                                            :key="'wb-tc-res-' + (row.key || idx)"
                                            :aria-label="wbTaskConfigResourceRowAriaLabel(row)"
                                            :row="row"
                                            :icon-meta="wbTaskConfigResourceIconMeta(row)"
                                            :label="wbTaskConfigResourceRowSingleLine(row)"
                                            @open="openWbTaskResourcePreview"
                                          />
                                        </ul>
                                        <a-empty v-else description="未配置引用资源" />
                                      </template>
                                    </section>
                                    </template>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </a-tab-pane>
                          <a-tab-pane v-if="selectedMaterialIsWorkbenchCreatedTask" key="task-context" tab="上下文">
                            <div class="workbench-result-preview-pane workbench-result-preview-pane--body wb-task-context-tab-pane">
                              <div class="ds-unified-tab-pane-stack">
                                <div class="workbench-result-preview-tab-inner wb-task-context-chat-wrap nlm-chat-body">
                                  <div class="nlm-chat-messages wb-task-context-chat-messages" role="log" aria-live="polite">
                                    <div
                                      v-for="turn in workbenchSelectedTaskDialogTurns"
                                      :key="turn.id"
                                      :class="['nlm-chat-turn', { 'nlm-chat-turn--tool-trace': turn.role === 'thinking' }]"
                                    >
                                      <div v-if="turn.role === 'thinking'" class="nlm-thinking wb-task-context-thinking">
                                        <div class="nlm-thinking-steps nlm-tool-calls">
                                          <div
                                            v-for="(call, ci) in (turn.toolCalls || [])"
                                            :key="turn.id + '-tc-' + ci"
                                            class="nlm-tool-call nlm-tool-call--plain"
                                            :class="{ 'nlm-tool-call--stream': call.type === 'text' }"
                                          >
                                            <p v-if="call.type === 'text'" class="nlm-tool-stream-text">{{ call.body }}</p>
                                            <p
                                              v-else-if="call.type === 'action'"
                                              class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line"
                                              :class="{ 'nlm-tool-call-line--running': call.status === 'running' }"
                                            >
                                              <span class="nlm-tool-call-line__ic" aria-hidden="true">
                                                <svg v-if="call.status === 'running'" class="iconpark-icon is-spin"><use href="#loading-four"></use></svg>
                                                <svg v-else-if="call.status === 'fail'" class="iconpark-icon nlm-tool-call-status--fail"><use href="#close-one"></use></svg>
                                                <svg v-else class="iconpark-icon nlm-tool-call-status--ok"><use href="#check-one"></use></svg>
                                              </span>
                                              <span class="nlm-tool-call-line__txt">{{ call.label }}</span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div v-else class="nlm-msg-row">
                                        <div class="nlm-msg-wrap">
                                          <div :class="['nlm-msg', turn.role, { 'wb-task-context-msg--system': turn.kind === 'system' }]">{{ turn.text }}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </a-tab-pane>
                          <a-tab-pane v-else key="body" tab="输出结果">
                            <div class="workbench-result-preview-pane workbench-result-preview-pane--body">
                              <FreeAuditAnalysisOutputPane
                                v-model:draft-value="workbenchAnalysisEmbedDraft"
                                :result-format="workbenchAnalysisPreviewFormat"
                                :csv-headers="workbenchAnalysisPreviewCsvTable.headers"
                                :csv-rows="workbenchAnalysisPreviewCsvTable.rows"
                                :editor-disabled="workbenchEmbedAnalysisOutputToolbarDisabled || workbenchAnalysisPreviewIsCsv"
                                :copy-disabled="!workbenchSelectedAnalysisResultRow || workbenchEmbedAnalysisOutputToolbarDisabled || workbenchAnalysisPreviewIsCsv"
                                :export-disabled="!workbenchSelectedAnalysisResultRow || workbenchEmbedAnalysisOutputToolbarDisabled"
                                :dirty="workbenchAnalysisEmbedDirty"
                                :save-disabled="!workbenchAnalysisEmbedDirty || workbenchEmbedAnalysisOutputToolbarDisabled || workbenchAnalysisPreviewIsCsv"
                                :export-formats="workbenchAnalysisPreviewExportFormats"
                                @copy="copyWorkbenchAnalysisEmbedPreview"
                                @export-menu="(info) => onWorkbenchAnalysisResultToolbarExportMenu(info, 'embed')"
                                @save="saveWorkbenchAnalysisEmbedEdit"
                              />
                            </div>
                          </a-tab-pane>
                          <a-tab-pane v-if="!selectedMaterialIsWorkbenchCreatedTask" key="history" tab="历史版本">
                            <div class="workbench-result-preview-pane workbench-result-preview-pane--history">
                              <FreeAuditAnalysisHistoryPane
                                :active="!!(selectedMaterial && selectedMaterial.type === 'analysis')"
                                :rows="workbenchAnalysisVersionHistoryOnlyRows"
                                :columns="workbenchAnalysisVersionMgmtColumns"
                                table-empty-description="暂无历史快照。"
                                inactive-description="暂无历史版本。"
                                @detail="(record) => openWorkbenchAnalysisHistoryDiff(record, 'embed')"
                                @rollback="(record) => applyWorkbenchAnalysisMarkdownRollbackById(selectedMaterial && selectedMaterial.id, record.markdown)"
                              />
                            </div>
                          </a-tab-pane>
                        </a-tabs>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>            </aside>
              </div>
            </div>
            </teleport>
          </div>
          <a-modal
            v-model:open="wbTaskCreateModalOpen"
            title="创建任务"
            width="960"
            wrapClassName="modal-w-960 wb-task-create-modal"
            centered
            :maskClosable="false"
            @cancel="closeWorkbenchTaskCreateModal"
          >
            <div class="wb-task-create-modal__body">
              <a-steps :current="wbTaskCreateStep - 1" size="small" class="wb-task-create-modal__steps">
                <a-step title="执行方式" />
                <a-step title="选择资源" />
              </a-steps>
              <template v-if="wbTaskCreateStep === 1">
              <a-form layout="vertical" class="wb-task-create-modal__form">
                <a-form-item label="任务名称" required>
                  <a-input
                    v-model:value="wbTaskCreateForm.taskName"
                    allow-clear
                    placeholder="请输入任务名称"
                    aria-label="任务名称"
                  />
                </a-form-item>
                <a-form-item label="任务类型" required>
                  <a-radio-group v-model:value="wbTaskCreateForm.taskType" @change="onWbTaskCreateTypeChange">
                    <a-radio value="single">单次任务</a-radio>
                    <a-radio value="batch">跑批任务</a-radio>
                  </a-radio-group>
                </a-form-item>
                <a-form-item label="选择要执行的技能" required>
                  <a-select
                    v-model:value="wbTaskCreateForm.skillId"
                    :options="wbTaskCreateSkillOptions"
                    placeholder="请选择一个技能"
                    show-search
                    option-filter-prop="label"
                    allow-clear
                    @change="onWbTaskCreateSkillChange"
                  />
                </a-form-item>
                <template v-if="wbTaskCreateForm.taskType === 'batch'">
                  <a-form-item label="配置分析对象" required class="wb-task-create-analysis-object-item">
                    <div
                      class="wb-task-create-datasource"
                      :class="{ 'wb-task-create-datasource--has-file': !!wbTaskCreateForm.dataSourceFile }"
                    >
                      <div
                        v-if="!wbTaskCreateForm.dataSourceFile"
                        class="wb-task-create-datasource__dragger ant-upload ant-upload-drag"
                        role="button"
                        tabindex="0"
                        @click="mockWbTaskCreateDataSourceUpload"
                        @keydown.enter.prevent="mockWbTaskCreateDataSourceUpload"
                        @keydown.space.prevent="mockWbTaskCreateDataSourceUpload"
                      >
                        <span class="ant-upload ant-upload-btn">
                          <p class="ant-upload-drag-icon"><ds-icon name="file-arrow-up" aria-hidden="true" /></p>
                          <div class="wb-task-create-datasource__dragger-text">
                            <p class="ant-upload-text">拖拽文件到此处，或点击上传</p>
                            <p class="ant-upload-hint">支持 .xlsx / .csv，单文件不超过 50MB</p>
                          </div>
                        </span>
                      </div>
                      <div v-else class="wb-task-create-datasource__dragger wb-task-create-datasource__dragger--filled">
                        <div class="wb-task-create-datasource__dragger-inner">
                          <p class="ant-upload-drag-icon">
                            <ds-icon
                              name="file-sheet"
                              aria-hidden="true"
                            />
                          </p>
                          <span class="wb-task-create-datasource__file-name" :title="wbTaskCreateForm.dataSourceFile.name">{{
                            wbTaskCreateForm.dataSourceFile.name
                          }}</span>
                          <a-button
                            type="link"
                            size="small"
                            class="wb-task-create-datasource__change"
                            @click.stop="clearWbTaskCreateDataSource"
                          >
                            更换文件
                          </a-button>
                        </div>
                      </div>
                      <p class="wb-task-create-preview-guide">请选择标识列（可多选），AI 将根据所选标识区分不同的子任务</p>
                      <div
                        class="wb-task-create-preview-table"
                        :class="{ 'wb-task-create-preview-table--empty': !wbTaskCreateForm.dataSourceFile }"
                      >
                        <a-table
                          :columns="wbTaskCreatePreviewColumns"
                          :data-source="wbTaskCreatePreviewRows"
                          :pagination="false"
                          size="small"
                          :scroll="{ x: 'max-content', y: wbTaskCreatePreviewScrollY }"
                          class="skill-library-version-mgmt-table"
                        >
                          <template v-if="!wbTaskCreateForm.dataSourceFile" #emptyText>
                            <div class="wb-task-create-preview-empty">
                              <a-empty :image="false" description="上传文件后预览数据（默认展示前 5 行）" />
                            </div>
                          </template>
                          <template #headerCell="{ column }">
                            <div
                              v-if="wbTaskCreateForm.dataSourceFile"
                              class="wb-task-create-preview-th"
                              role="button"
                              tabindex="0"
                              :class="{ 'wb-task-create-preview-th--active': isWbTaskCreateIdColumnSelected(column.dataIndex) }"
                              @click="toggleWbTaskCreateIdColumn(column.dataIndex)"
                              @keydown.enter.prevent="toggleWbTaskCreateIdColumn(column.dataIndex)"
                              @keydown.space.prevent="toggleWbTaskCreateIdColumn(column.dataIndex)"
                            >
                              <a-checkbox
                                :checked="isWbTaskCreateIdColumnSelected(column.dataIndex)"
                                @click.stop="toggleWbTaskCreateIdColumn(column.dataIndex)"
                              />
                              <span class="wb-task-create-preview-th__title" :title="column.title">{{ column.title }}</span>
                            </div>
                          </template>
                          <template #bodyCell="{ column, text }">
                            <span
                              v-if="wbTaskCreateForm.dataSourceFile"
                              class="wb-task-create-preview-cell"
                              :class="{ 'wb-task-create-preview-cell--id': isWbTaskCreateIdColumnSelected(column.dataIndex) }"
                            >{{ text }}</span>
                          </template>
                        </a-table>
                      </div>
                      <div
                        v-if="wbTaskCreateForm.dataSourceFile"
                        class="wb-task-create-preview-meta"
                      >
                        <span class="wb-task-create-preview-meta__left">数据预览{{ wbTaskCreatePreviewRowCount }}行</span>
                        <span class="wb-task-create-preview-meta__right">
                          <template v-if="wbTaskCreateBatchSelectedColumnCount">
                            已选 {{ wbTaskCreateBatchSelectedColumnCount }} 列，预计生成 {{ wbTaskCreateBatchEstimatedChildCount }} 个子任务
                          </template>
                          <template v-else>请选择标识列</template>
                        </span>
                      </div>
                    </div>
                  </a-form-item>
                </template>
                <template v-if="wbTaskCreateForm.taskType === 'batch'">
                  <a-form-item label="子任务命名" required class="wb-task-create-subtask-naming-item">
                    <a-radio-group
                      v-model:value="wbTaskCreateForm.subtaskNamingMode"
                      @change="onWbTaskCreateSubtaskNamingModeChange"
                    >
                      <a-radio value="same_as_object">和分析对象同名</a-radio>
                      <a-radio value="custom">自定义</a-radio>
                    </a-radio-group>
                    <a-select
                      v-if="wbTaskCreateForm.subtaskNamingMode === 'custom'"
                      v-model:value="wbTaskCreateForm.subtaskNamingColumns"
                      mode="multiple"
                      class="wb-task-create-subtask-naming-columns"
                      :options="wbTaskCreateDataSourceColumnOptions"
                      placeholder="请从数据源中选择列（可多选）"
                      :disabled="!wbTaskCreateForm.dataSourceFile"
                      show-search
                      option-filter-prop="label"
                      aria-label="子任务命名列"
                    />
                  </a-form-item>
                </template>
                <a-form-item label="结果输出位置" required>
                  <a-tree-select
                    v-model:value="wbTaskCreateForm.resultOutputFolderId"
                    class="wb-task-create-result-output-select"
                    :tree-data="wbTaskCreateResultOutputTreeData"
                    placeholder="从结果树选择文件夹"
                    tree-default-expand-all
                    :dropdown-style="{ maxHeight: '280px', overflow: 'auto' }"
                    show-search
                    tree-node-filter-prop="title"
                    :allow-clear="false"
                    aria-label="结果输出位置"
                  />
                </a-form-item>
                <a-form-item label="任务指令" required class="wb-task-create-instruction-item">
                  <div class="wb-task-create-instruction-control">
                    <div
                      class="wb-task-create-instruction-field"
                      :class="'wb-task-create-instruction-field--' + wbTaskCreateInstructionState"
                    >
                    <a-textarea
                      v-model:value="wbTaskCreateForm.instruction"
                      :rows="5"
                      :disabled="wbTaskCreateInstructionDisabled"
                      :placeholder="wbTaskCreateInstructionPlaceholder"
                      aria-label="任务指令"
                      :aria-busy="wbTaskCreateInstructionState === 'generating'"
                    />
                    <div
                      v-if="wbTaskCreateInstructionState === 'generating'"
                      class="wb-task-create-instruction-generating"
                      aria-live="polite"
                    >
                      <a-spin size="small" />
                      <span>正在根据配置生成任务指令…</span>
                    </div>
                  </div>
                    <div
                      v-show="wbTaskCreateInstructionState === 'ready'"
                      class="wb-task-create-instruction-hint"
                      role="note"
                      aria-label="任务指令说明"
                    >
                      <ds-icon name="circle-info" class="wb-task-create-instruction-hint__icon" aria-hidden="true" />
                      <span class="wb-task-create-instruction-hint__text">
                        该指令基于配置自动生成/覆盖，将应用于引导大模型创建子任务，请谨慎修改。
                      </span>
                    </div>
                  </div>
                </a-form-item>
              </a-form>
              </template>
              <section
                v-else
                class="wb-task-create-modal__resources"
                aria-labelledby="wb-task-create-resources-heading"
              >
                <div id="wb-task-create-resources-heading" class="wb-task-create-modal__resources-heading">
                  <span class="wb-task-create-modal__resources-required-mark" aria-hidden="true">*</span>
                  <span>请选择资源</span>
                </div>
                <div class="wb-task-create-transfer">
                  <section class="wb-task-create-transfer__panel">
                    <div class="wb-task-create-transfer__panel-head">
                      <a-tabs
                        :activeKey="wbTaskCreateForm.resourceTab"
                        size="small"
                        class="wb-task-create-transfer__tabs"
                        @update:activeKey="onWbTaskCreateResourceTabChange"
                      >
                        <a-tab-pane key="file" tab="文件" />
                        <a-tab-pane key="result" tab="结果" />
                        <a-tab-pane key="database" tab="数据库" />
                        <a-tab-pane key="graph" tab="图谱" />
                      </a-tabs>
                    </div>
                    <div class="wb-task-create-transfer__panel-body">
                      <div class="wb-task-create-transfer__tools">
                        <a-input
                          v-model:value="wbTaskCreateForm.resourceQuery"
                          allow-clear
                          placeholder="搜索资源名称"
                          class="ds-input-inline-search ds-input-inline-search--compact wb-task-create-transfer__search"
                          @change="syncWbTaskCreateTreeExpandedKeys(wbTaskCreateForm.resourceTab)"
                        >
                          <template #prefix>
                            <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
                          </template>
                        </a-input>
                        <div class="wb-task-create-transfer__batch-actions">
                          <a-button size="small" class="wb-task-create-transfer__batch-btn" :disabled="!wbTaskCreateCurrentSelectableResources.length" @click="selectAllWbTaskCreateCurrentResources">全选</a-button>
                          <a-button size="small" class="wb-task-create-transfer__batch-btn" :disabled="!wbTaskCreateCurrentSelectedCount" @click="cancelAllWbTaskCreateCurrentResources">取消全选</a-button>
                        </div>
                      </div>
                      <div :class="['wb-task-create-transfer__scroll', { 'wb-material-file-drawer': wbTaskCreateIsTreeResourceTab }]">
                      <template v-if="wbTaskCreateForm.resourceTab === 'file'">
                        <div v-if="wbTaskCreateFileTreeData.length" class="nlm-cards-wrap nlm-tree-wrap wb-task-create-resource-tree-wrap">
                        <a-tree
                          class="wb-material-file-tree wb-task-create-resource-tree"
                          block-node
                          :show-line="{ showLeafIcon: false }"
                          :show-icon="false"
                          :tree-data="wbTaskCreateFileTreeData"
                          v-model:expanded-keys="wbTaskCreateForm.fileExpandedKeys"
                        >
                          <template #switcherIcon><span aria-hidden="true"></span></template>
                          <template #title="d">
                            <div
                              v-if="d.isFolder"
                              :class="['nlm-tree-leaf', 'nlm-tree-leaf--folder']"
                              @click.stop="toggleWbTaskCreateTreeNodeExpanded(d, 'file')"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateTreeNodeChecked(d, 'file')"
                                  :indeterminate="isWbTaskCreateTreeNodeIndeterminate(d, 'file')"
                                  @change="toggleWbTaskCreateTreeNodeSelection(d, 'file')"
                                />
                              </span>
                              <span class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle" aria-hidden="true">
                                <ds-icon name="chevron-right" class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev"
                                  :class="{ 'wb-material-file-tree-switcher-chev--expanded': (wbTaskCreateForm.fileExpandedKeys || []).includes(String(d.key)) }"
                                 />
                              </span>
                              <div class="nlm-tree-leaf-title-wrap">
                                <div class="nlm-tree-leaf-col nlm-tree-leaf-col--folder">
                                  <span class="nlm-stat-count-label-row">
                                    <div class="nlm-tree-leaf-title">{{ d.title }}</div>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              v-else
                              :class="['nlm-tree-leaf']"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateTreeNodeChecked(d, 'file')"
                                  @change="toggleWbTaskCreateTreeNodeSelection(d, 'file')"
                                />
                              </span>
                              <span class="nlm-tree-leaf-icon">
                                <ds-icon
                                  :name="getMaterialIcon(wbWorkbenchMaterialVmForTreeFile(d))"
                                  :class="getMaterialIconColorClass(wbWorkbenchMaterialVmForTreeFile(d))"
                                  aria-hidden="true"
                                />
                              </span>
                              <div class="nlm-tree-leaf-title-wrap">
                                <div class="nlm-tree-leaf-col">
                                  <div class="nlm-tree-leaf-title">{{ (wbMaterialVmById(d.materialId) || {}).title || d.title }}</div>
                                </div>
                              </div>
                            </div>
                          </template>
                        </a-tree>
                        </div>
                        <a-empty v-else description="暂无可添加资源" />
                      </template>
                      <template v-else-if="wbTaskCreateForm.resourceTab === 'result'">
                        <div v-if="wbTaskCreateResultTreeData.length" class="nlm-cards-wrap nlm-tree-wrap wb-task-create-resource-tree-wrap">
                        <a-tree
                          class="wb-material-file-tree wb-task-create-resource-tree"
                          block-node
                          :show-line="{ showLeafIcon: false }"
                          :show-icon="false"
                          :tree-data="wbTaskCreateResultTreeData"
                          v-model:expanded-keys="wbTaskCreateForm.resultExpandedKeys"
                        >
                          <template #switcherIcon><span aria-hidden="true"></span></template>
                          <template #title="d">
                            <div
                              v-if="d.isFolder"
                              :class="['nlm-tree-leaf', 'nlm-tree-leaf--folder', {
                                'nlm-tree-leaf--result-user-folder': d.folderKind === 'userResult' && !d.linkedTaskFolder,
                                'nlm-tree-leaf--task-run': d.linkedTaskFolder,
                              }]"
                              @click.stop="toggleWbTaskCreateTreeNodeExpanded(d, 'result')"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateTreeNodeChecked(d, 'result')"
                                  :indeterminate="isWbTaskCreateTreeNodeIndeterminate(d, 'result')"
                                  @change="toggleWbTaskCreateTreeNodeSelection(d, 'result')"
                                />
                              </span>
                              <span class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle" aria-hidden="true">
                                <ds-icon name="chevron-right" class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev"
                                  :class="{ 'wb-material-file-tree-switcher-chev--expanded': (wbTaskCreateForm.resultExpandedKeys || []).includes(String(d.key)) }"
                                 />
                              </span>
                              <div class="nlm-tree-leaf-title-wrap">
                                <div class="nlm-tree-leaf-col nlm-tree-leaf-col--folder">
                                  <span class="nlm-stat-count-label-row">
                                    <div class="nlm-tree-leaf-title">{{ d.title }}</div>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              v-else
                              :class="['nlm-tree-leaf', 'nlm-tree-leaf--analysis']"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateTreeNodeChecked(d, 'result')"
                                  @change="toggleWbTaskCreateTreeNodeSelection(d, 'result')"
                                />
                              </span>
                              <span class="nlm-tree-leaf-icon">
                                <ds-icon
                                  :name="getMaterialIcon(wbMaterialVmById(d.materialId) || { type: 'analysis' })"
                                  :class="getMaterialIconColorClass(wbMaterialVmById(d.materialId) || { type: 'analysis' })"
                                  title="已完成"
                                  aria-hidden="true"
                                />
                              </span>
                              <div class="nlm-tree-leaf-title-wrap">
                                <div class="nlm-tree-leaf-col">
                                  <div class="nlm-tree-leaf-title">{{ (wbMaterialVmById(d.materialId) || {}).title || d.title }}</div>
                                </div>
                              </div>
                            </div>
                          </template>
                        </a-tree>
                        </div>
                        <a-empty v-else description="暂无可添加资源" />
                      </template>
                      <div v-else-if="wbTaskCreateForm.resourceTab === 'database' && wbTaskCreateDatabaseResourceGroups.length" class="wb-task-create-db-groups">
                        <section
                          v-for="grp in wbTaskCreateDatabaseResourceGroups"
                          :key="'task-db-' + grp.databaseId"
                          class="nlm-db-table-group wb-task-create-db-group"
                          :aria-label="'数据源：' + grp.databaseName"
                        >
                          <div
                            class="nlm-tree-leaf nlm-db-table-group__head-row"
                            :class="{ 'is-expanded': isWorkbenchDbTableGroupExpanded(grp.databaseId) }"
                          >
                            <div
                              class="nlm-db-table-group__head-main"
                              role="button"
                              tabindex="0"
                              :aria-expanded="isWorkbenchDbTableGroupExpanded(grp.databaseId) ? 'true' : 'false'"
                              :aria-label="'展开或收起：' + grp.databaseName"
                              @click.stop="toggleWorkbenchDbTableGroup(grp.databaseId)"
                              @keydown.enter.prevent="toggleWorkbenchDbTableGroup(grp.databaseId)"
                              @keydown.space.prevent="toggleWorkbenchDbTableGroup(grp.databaseId)"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateDbGroupChecked(grp)"
                                  :indeterminate="isWbTaskCreateDbGroupIndeterminate(grp)"
                                  @change="toggleWbTaskCreateDbGroupSelection(grp)"
                                />
                              </span>
                              <span class="nlm-db-table-group__chev" aria-hidden="true"><ds-icon name="chevron-right" class="nlm-resource-drawer__chevron" /></span>
                              <span class="nlm-stat-count-label-row nlm-db-table-group__name-row">
                                <span class="nlm-db-table-group__name">{{ grp.databaseName }}</span>
                              </span>
                            </div>
                          </div>
                          <div v-show="isWorkbenchDbTableGroupExpanded(grp.databaseId)" class="nlm-db-table-group__body">
                            <div
                              v-for="tbl in grp.tables"
                              :key="tbl.key"
                              :class="['nlm-tree-leaf', 'nlm-tree-leaf--db-table-item', 'wb-task-create-db-table-row', { checked: isWbTaskCreateResourceSelected(tbl.key) }]"
                              @click.stop="toggleWbTaskCreateResource(tbl)"
                            >
                              <span class="wb-task-create-tree-check" @click.stop>
                                <a-checkbox
                                  :checked="isWbTaskCreateResourceSelected(tbl.key)"
                                  @change="toggleWbTaskCreateResource(tbl)"
                                />
                              </span>
                              <span class="nlm-tree-leaf-icon"><svg class="iconpark-icon" aria-hidden="true"><use href="#form"></use></svg></span>
                              <div class="nlm-tree-leaf-title-wrap">
                                <div class="nlm-tree-leaf-col">
                                  <div class="nlm-tree-leaf-title" :title="tbl.comment || tbl.name">{{ tbl.comment || tbl.name }}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>
                      <div v-else-if="wbTaskCreateVisibleResources.length" class="wb-task-create-transfer__list">
                        <FreeAuditTaskCreateResourceRow
                          v-for="item in wbTaskCreateVisibleResources"
                          :key="item.key"
                          :item="item"
                          :selected="isWbTaskCreateResourceSelected(item.key)"
                          @toggle="toggleWbTaskCreateResource"
                        />
                      </div>
                      <a-empty v-else description="暂无可添加资源" />
                      </div>
                    </div>
                  </section>
                  <section class="wb-task-create-transfer__panel wb-task-create-transfer__panel--selected">
                    <div class="wb-task-create-transfer__selected-head">
                      <span>已选资源（{{ wbTaskCreateForm.selectedResources.length }}）</span>
                      <a-button
                        v-if="wbTaskCreateForm.selectedResources.length"
                        type="link"
                        size="small"
                        @click="clearWbTaskCreateResources"
                      >清空</a-button>
                    </div>
                    <div class="wb-task-create-transfer__panel-body">
                      <div class="wb-task-create-transfer__scroll">
                      <div v-if="wbTaskCreateForm.selectedResources.length" class="wb-task-create-transfer__list">
                        <FreeAuditTaskCreateResourceRow
                          v-for="item in wbTaskCreateForm.selectedResources"
                          :key="'sel-' + item.key"
                          :item="item"
                          selected-mode
                          @remove="removeWbTaskCreateResource"
                        />
                      </div>
                      <a-empty v-else description="请从左侧添加资源" />
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </div>
            <template #footer>
              <a-button @click="closeWorkbenchTaskCreateModal">取消</a-button>
              <a-button v-if="wbTaskCreateStep === 2" @click="wbTaskCreateStep = 1">上一步</a-button>
              <a-button
                v-if="wbTaskCreateStep === 1"
                type="primary"
                :disabled="wbTaskCreateStep1NextDisabled"
                @click="goWbTaskCreateStep2"
              >下一步</a-button>
              <a-button
                v-else
                type="primary"
                :disabled="wbTaskCreateSubmitDisabled"
                @click="submitWorkbenchTaskCreate"
              >创建任务</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbPackageDownloadModalOpen"
            title="文件打包任务"
            wrapClassName="modal-w-520 wb-package-download-modal"
            :destroyOnClose="true"
            @cancel="closeWorkbenchPackageDownloadModal"
          >
            <a-form layout="vertical" class="wb-package-download-modal__form">
              <a-form-item
                label="任务名称"
                required
                :validate-status="String((wbPackageDownloadForm && wbPackageDownloadForm.taskName) || '').trim() ? '' : 'error'"
                :help="String((wbPackageDownloadForm && wbPackageDownloadForm.taskName) || '').trim() ? '' : '请输入任务名称'"
              >
                <a-input
                  v-model:value="wbPackageDownloadForm.taskName"
                  placeholder="请输入任务名称"
                  :maxlength="60"
                  show-count
                />
              </a-form-item>
              <a-form-item label="打包范围">
                <div class="wb-package-download-modal__scope">
                  <div class="wb-package-download-modal__scope-summary">{{ workbenchPackageDownloadScopeText() }}</div>
                  <div class="wb-package-download-modal__tree-panel wb-task-create-transfer">
                    <div class="wb-task-create-transfer__scroll wb-material-file-drawer wb-package-download-modal__tree-scroll">
                      <div class="nlm-cards-wrap nlm-tree-wrap wb-task-create-resource-tree-wrap">
                        <div
                          v-for="row in workbenchPackageDownloadPreviewRows()"
                          :key="'pkg-scope-' + row.kind + '-' + row.key + '-' + row.depth"
                          :class="[
                            'nlm-tree-leaf',
                            'wb-package-download-modal__tree-row',
                            row.kind === 'folder' ? 'nlm-tree-leaf--folder' : 'nlm-tree-leaf--analysis',
                          ]"
                          role="treeitem"
                          :style="{ paddingLeft: (row.depth * 16) + 'px' }"
                        >
                          <span class="wb-task-create-tree-check" @click.stop>
                            <a-checkbox :checked="true" disabled />
                          </span>
                          <span
                            v-if="row.kind === 'folder'"
                            class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle"
                            aria-hidden="true"
                          >
                            <ds-icon
                              name="chevron-right"
                              class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev wb-material-file-tree-switcher-chev--expanded"
                            />
                          </span>
                          <span v-else class="nlm-tree-leaf-icon" aria-hidden="true">
                            <svg class="iconpark-icon is-result"><use href="#notes"></use></svg>
                          </span>
                          <div class="nlm-tree-leaf-title-wrap">
                            <div class="nlm-tree-leaf-col" :class="{ 'nlm-tree-leaf-col--folder': row.kind === 'folder' }">
                              <div
                                class="nlm-tree-leaf-title wb-package-download-modal__tree-title"
                                :class="{ 'wb-package-download-modal__tree-title--folder': row.kind === 'folder' }"
                                :title="row.title"
                              >{{ row.title }}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </a-form-item>
              <a-form-item label="目录结构">
                <a-radio-group v-model:value="wbPackageDownloadForm.structureMode">
                  <a-radio value="keep">保留层级</a-radio>
                  <a-radio value="flat">剔除层级</a-radio>
                </a-radio-group>
              </a-form-item>
              <a-form-item label="下载格式">
                <a-radio-group v-model:value="wbPackageDownloadForm.formatMode">
                  <a-radio value="raw">全部保留原始格式</a-radio>
                  <a-radio value="pdf">全部按 MD 转 PDF</a-radio>
                </a-radio-group>
                <div
                  v-if="wbPackageDownloadForm.formatMode === 'pdf'"
                  class="wb-package-download-modal__notice wb-task-create-instruction-hint"
                  role="status"
                >
                  <ds-icon name="circle-info" class="wb-task-create-instruction-hint__icon" aria-hidden="true" />
                  <span class="wb-task-create-instruction-hint__text">MD 转 PDF 需要额外转换处理，预计耗时更长。</span>
                </div>
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button @click="closeWorkbenchPackageDownloadModal">取消</a-button>
              <a-button type="primary" @click="submitWorkbenchPackageDownloadTask">创建任务</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbGenerateSkillConfigModalOpen"
            title="生成技能配置"
            width="640"
            wrapClassName="modal-w-640 wb-generate-skill-config-modal"
            centered
            :maskClosable="false"
            :destroyOnClose="true"
            @cancel="closeGenerateSkillConfigModal"
          >
            <div class="wb-generate-skill-config-modal__body">
              <a-form layout="vertical" class="wb-generate-skill-config-modal__form">
                <a-form-item label="请输入生成技能要求" required>
                  <a-textarea
                    v-model:value="wbGenerateSkillIntentText"
                    :rows="5"
                    :maxlength="2000"
                    :show-count="true"
                    placeholder="请简要描述你期望生成的具体技能要求或目标"
                    class="wb-generate-skill-config-modal__intent"
                    aria-label="请简要描述你期望生成的具体技能要求或目标"
                  />
                </a-form-item>
              </a-form>
              <section class="wb-generate-skill-reco" aria-labelledby="wb-generate-skill-reco-h">
                <h4 id="wb-generate-skill-reco-h" class="wb-generate-skill-reco__title">智能推荐</h4>
                <div class="wb-generate-skill-reco__list" role="list">
                  <div
                    v-for="(reco, idx) in wbGenerateSkillRecommendationItems"
                    :key="'wb-skill-reco-' + idx"
                    class="wb-generate-skill-reco__card"
                    :class="{
                      'wb-generate-skill-reco__card--loading': reco.loading,
                      'wb-generate-skill-reco__card--ready': !reco.loading && reco.text,
                    }"
                    role="listitem"
                    :aria-busy="reco.loading"
                  >
                    <template v-if="reco.loading">
                      <a-spin size="small" />
                      <span class="wb-generate-skill-reco__loading-text">生成中…</span>
                    </template>
                    <template v-else>
                      <button
                        type="button"
                        class="wb-generate-skill-reco__main"
                        :disabled="!reco.text"
                        @click="applyGenerateSkillRecommendation(reco.text)"
                      >
                        <span class="wb-generate-skill-reco__text">{{ reco.text }}</span>
                      </button>
                      <a-button
                        type="primary"
                        size="small"
                        class="wb-generate-skill-reco__use"
                        :disabled="!reco.text"
                        aria-label="使用本条推荐填入意图描述"
                        @click.stop="applyGenerateSkillRecommendation(reco.text)"
                      >
                        使用
                      </a-button>
                    </template>
                  </div>
                </div>
              </section>
            </div>
            <template #footer>
              <a-button @click="closeGenerateSkillConfigModal">取消</a-button>
              <a-button type="primary" :disabled="!wbGenerateSkillIntentTrimmed" @click="submitGenerateSkillConfig">创建任务</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="saveResultModalVisible"
            title="保存结果"
            width="520"
            wrapClassName="modal-w-520"
            @cancel="closeSaveResultModal"
            @ok="confirmSaveResultModal"
            ok-text="保存"
            cancel-text="取消"
          >
            <div style="display:flex;flex-direction:column;gap:var(--ds-space-sm);">
              <a-form layout="vertical">
                <a-form-item label="结果名称" required>
                  <a-input
                    v-model:value="saveResultForm.name"
                    placeholder="例如：合同与发票一致性检查结果"
                    allow-clear
                    :maxlength="60"
                  />
                </a-form-item>
              </a-form>
            </div>
          </a-modal>
          <a-modal
            v-model:open="summaryTaskResultModalVisible"
            title="技能配置确认"
            width="960"
            wrapClassName="modal-w-960"
            @cancel="closeSummaryTaskResultModal"
            @ok="confirmSummaryTaskResultModal"
            ok-text="确认保存为工作台级技能"
            cancel-text="取消"
          >
            <div class="analysis-template-config-modal-body">
              <div class="analysis-template-config-card">
                <div class="skill-object-field-group">
                  <div class="skill-object-field-label">技能名称<span class="skill-required">*</span></div>
                  <div class="ds-input-ai-polish-wrap">
                    <div
                      class="ds-input-ai-polish-input-shell ds-input-ai-polish-input-shell--with-corner ds-input-ai-polish-input-shell--affix"
                      :class="{ 'is-polishing': freeAuditAiPolishKey === 'summary:name' }"
                    >
                      <a-input v-model:value="summaryTaskResultForm.name" placeholder="请输入技能名称" allow-clear />
                      <div class="ds-input-ai-polish-corner">
                        <span v-show="freeAuditAiPolishKey === 'summary:name'" class="ds-input-ai-polish-status">润色中...</span>
                        <a-tooltip title="回退">
                          <a-button type="text" class="ds-icon-btn ds-input-ai-polish-undo-btn" aria-label="回退" title="回退" :disabled="freeAuditPolishUndoDisabled('summary:name')" @click.stop="undoSummaryTaskName">
                            <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                          </a-button>
                        </a-tooltip>
                        <a-tooltip title="润色">
                          <a-button type="text" class="ds-icon-btn ds-input-ai-polish-btn" aria-label="智能润色" title="润色" :disabled="!!freeAuditAiPolishKey" @click.stop="demoAiPolishSummaryTaskName">
                            <ds-icon name="magic" aria-hidden="true" />
                          </a-button>
                        </a-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="analysis-template-config-grid">
                <div class="analysis-template-config-card">
                  <div class="skill-config-section-head">
                    <div class="skill-config-section-title-cluster">
                      <h3 class="skill-config-col-title">审计资料</h3>
                    </div>
                    <a-button type="primary" size="small" ghost @click="addSummaryTemplateExtractionRule"><ds-icon name="plus" style="margin-right: var(--ds-space-xxs);" />添加</a-button>
                  </div>
                  <div class="skill-object-list-wrap skill-object-list-wrap--config">
                    <div
                      v-for="(er, idx) in (summaryTaskResultForm.extractionRules || [])"
                      :key="er.id"
                      class="skill-object-row"
                      :class="{ 'is-expanded': summaryTaskResultExpandedRuleId === er.id }"
                    >
                      <div class="skill-object-row-main" @click="toggleSummaryTemplateRuleExpand(er.id)">
                        <span class="skill-object-idx">{{ idx + 1 }}</span>
                        <div class="skill-object-row-text">
                          <div class="skill-object-title-line">{{ (er.title || '').trim() || '（未填写资料说明）' }}</div>
                          <div class="skill-object-body-preview">{{ (er.body || '').trim() || '（未填写抽取或核对字段）' }}</div>
                          <div class="ds-text-micro-secondary" style="margin-top: var(--ds-space-xxs);">已匹配 {{ summaryRuleMatchedMaterialCount(er) }} 份文档</div>
                        </div>
                        <div class="skill-object-row-actions">
                          <a-button
                            type="text"
                            danger
                            size="small"
                            shape="circle"
                            class="ds-icon-btn ds-icon-btn--standard ds-icon-btn--danger skill-object-row-delete-btn"
                            aria-label="删除该分析对象"
                            title="删除"
                            @click.stop="removeSummaryTemplateExtractionRule(idx)"
                            :disabled="(summaryTaskResultForm.extractionRules || []).length <= 1"
                          >
                            <template #icon><svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg></template>
                          </a-button>
                        </div>
                      </div>
                      <div v-show="summaryTaskResultExpandedRuleId === er.id" class="skill-object-row-detail" @click.stop>
                        <div class="skill-object-field-group">
                          <div class="skill-object-field-label-row">
                            <div class="skill-object-field-label skill-object-field-label--inline">请输入资料类型（可输入多个）<span class="skill-required">*</span></div>
                            <div class="skill-object-field-polish">
                              <span v-show="freeAuditAiPolishKey === 'summary-er:' + er.id + ':title'" class="ds-input-ai-polish-status">润色中...</span>
                              <button type="button" class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled" aria-label="撤回" title="撤回至润色前" :disabled="freeAuditPolishUndoDisabled('summary-er:' + er.id + ':title')" @click.stop="undoSummaryErField(er, 'title')">
                                <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                                <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                              </button>
                              <button type="button" class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled" aria-label="智能润色" title="智能润色" :disabled="!!freeAuditAiPolishKey" @click.stop="demoAiPolishSummaryErField(er, 'title')">
                                <ds-icon name="magic" aria-hidden="true" />
                                <span class="ds-input-ai-polish-btn__label">润色</span>
                              </button>
                            </div>
                          </div>
                          <div class="ds-input-ai-polish-wrap">
                            <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': freeAuditAiPolishKey === 'summary-er:' + er.id + ':title' }">
                              <a-textarea
                                v-model:value="er.title"
                                :rows="2"
                                :placeholder="skillObjectMaterialTypePlaceholder"
                              />
                            </div>
                          </div>
                        </div>
                        <div class="skill-object-field-group">
                          <div class="skill-object-field-label-row">
                            <div class="skill-object-field-label skill-object-field-label--inline">请详细描述或罗列该审计资料中需要审计的具体内容<span class="skill-required">*</span></div>
                            <div class="skill-object-field-polish">
                              <span v-show="freeAuditAiPolishKey === 'summary-er:' + er.id + ':body'" class="ds-input-ai-polish-status">润色中...</span>
                              <button type="button" class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled" aria-label="撤回" title="撤回至润色前" :disabled="freeAuditPolishUndoDisabled('summary-er:' + er.id + ':body')" @click.stop="undoSummaryErField(er, 'body')">
                                <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                                <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                              </button>
                              <button type="button" class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled" aria-label="智能润色" title="智能润色" :disabled="!!freeAuditAiPolishKey" @click.stop="demoAiPolishSummaryErField(er, 'body')">
                                <ds-icon name="magic" aria-hidden="true" />
                                <span class="ds-input-ai-polish-btn__label">润色</span>
                              </button>
                            </div>
                          </div>
                          <div class="ds-input-ai-polish-wrap">
                            <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': freeAuditAiPolishKey === 'summary-er:' + er.id + ':body' }">
                              <a-textarea v-model:value="er.body" placeholder="列出后续比对、测算或下结论所依赖的字段及口径（尽量与资料表述一致）。示例：含税金额、业务日期、对方名称、单据编号；涉及明细时的维度字段（如部门、项目、费用类型等）。" :rows="4" />
                            </div>
                          </div>
                        </div>
                        <div class="skill-object-field-group">
                          <div class="skill-object-field-label">匹配文档（可多选）<span class="skill-required">*</span></div>
                          <a-select
                            v-model:value="er.materialIds"
                            mode="multiple"
                            allow-clear
                            size="small"
                            :max-tag-count="3"
                            class="template-material-multi-select"
                            placeholder="请选择要参与该分析对象的资料"
                            :options="workbenchMaterialSelectOptions"
                          />
                          <div class="ds-text-micro-secondary" style="margin-top: var(--ds-space-xs);">当前已匹配 {{ summaryRuleMatchedMaterialCount(er) }} 份文档</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="analysis-template-config-card">
                  <div class="skill-config-section-head">
                    <div class="skill-config-section-title-cluster">
                      <h3 class="skill-config-col-title">审计思路</h3>
                    </div>
                    <div class="skill-object-field-polish">
                      <span v-show="freeAuditAiPolishKey === 'summary:analysisRule'" class="ds-input-ai-polish-status">润色中...</span>
                      <button type="button" class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled" aria-label="撤回" title="撤回至润色前" :disabled="freeAuditPolishUndoDisabled('summary:analysisRule')" @click.stop="undoSummaryTaskAnalysisRule">
                        <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                        <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                      </button>
                      <button type="button" class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled" aria-label="智能润色" title="智能润色" :disabled="!!freeAuditAiPolishKey" @click.stop="demoAiPolishSummaryTaskAnalysisRule">
                        <ds-icon name="magic" aria-hidden="true" />
                        <span class="ds-input-ai-polish-btn__label">润色</span>
                      </button>
                    </div>
                  </div>
                  <div class="ds-input-ai-polish-wrap">
                    <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': freeAuditAiPolishKey === 'summary:analysisRule' }">
                      <a-textarea v-model:value="summaryTaskResultForm.analysisRule" :rows="16" :placeholder="getSkillAnalysisRulePlaceholder()" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </a-modal>
          <a-modal
            v-model:open="wbProjectSkillCreateBasicModalOpen"
            :title="wbProjectSkillCreateBasicModalTitle"
            width="640"
            wrapClassName="modal-w-640"
            centered
            :maskClosable="false"
            @cancel="closeWbProjectSkillCreateBasicModal"
          >
            <a-form layout="vertical" class="skill-modal-form skill-wizard-panel">
              <a-form-item label="技能名称" required>
                <a-input
                  v-model:value="wbProjectSkillCreateBasicForm.name"
                  placeholder="请输入技能名称"
                  allow-clear
                  :maxlength="60"
                />
              </a-form-item>
              <a-form-item label="技能描述">
                <a-textarea
                  v-model:value="wbProjectSkillCreateBasicForm.description"
                  placeholder="选填。描述该技能的用途与适用场景"
                  :rows="3"
                  :maxlength="300"
                  show-count
                />
              </a-form-item>
              <a-form-item :label="wbProjectAuditSceneCategoryLabel">
                <a-select
                  v-model:value="wbProjectSkillCreateBasicForm.auditScene"
                  :placeholder="'请选择' + wbProjectAuditSceneCategoryLabel"
                  style="width: 100%"
                >
                  <a-select-option v-for="item in wbProjectAuditSceneDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item :label="wbProjectSkillTypeCategoryLabel">
                <a-select
                  v-model:value="wbProjectSkillCreateBasicForm.skillType"
                  :placeholder="'请选择' + wbProjectSkillTypeCategoryLabel"
                  style="width: 100%"
                >
                  <a-select-option v-for="item in wbProjectSkillTypeDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="输入">
                <a-select
                  v-model:value="wbProjectSkillCreateBasicForm.skillInputs"
                  mode="tags"
                  placeholder="回车添加输入项，如：预算批复文件、付款台账"
                  style="width: 100%"
                />
              </a-form-item>
              <a-form-item label="输出" style="margin-bottom: 0;">
                <a-input
                  v-model:value="wbProjectSkillCreateBasicForm.outputSummary"
                  placeholder="一句话描述技能输出，如：输出异常清单与核查建议"
                  allow-clear
                  :maxlength="120"
                />
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button @click="closeWbProjectSkillCreateBasicModal">取消</a-button>
              <a-button type="primary" :loading="wbProjectSkillCreateBasicSubmitting" @click="submitWbProjectSkillCreateBasic">{{ wbProjectSkillCreateBasicSubmitLabel }}</a-button>
            </template>
          </a-modal>
          <a-modal
                v-model:open="wbProjectSkillBasicModalOpen"
                :title="wbProjectSkillDetailModalTitle"
                width="640"
                wrapClassName="modal-w-640"
                centered
                :maskClosable="false"
                @cancel="onWbProjectSkillBasicModalCancel"
              >
                <div v-if="wbDetailSelectedSkill">
                  <a-form layout="vertical" class="skill-modal-form skill-wizard-panel">
                    <a-form-item label="技能名称" required>
                      <a-input
                        v-model:value="wbProjectSkillForm.name"
                        placeholder="简短清晰的名称，便于在技能列表中识别"
                        allow-clear
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      />
                    </a-form-item>
                    <a-form-item label="技能描述">
                      <a-textarea
                        v-model:value="wbProjectSkillForm.description"
                        placeholder="选填。说明该技能做什么、适合处理哪类输入或任务，方便自己与他人理解用途。"
                        :rows="3"
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      />
                    </a-form-item>
                    <a-form-item :label="wbProjectAuditSceneCategoryLabel">
                      <a-select
                        v-model:value="wbProjectSkillForm.auditScene"
                        :placeholder="'请选择' + wbProjectAuditSceneCategoryLabel"
                        style="width: 100%"
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      >
                        <a-select-option v-for="item in wbProjectAuditSceneDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-form-item :label="wbProjectSkillTypeCategoryLabel">
                      <a-select
                        v-model:value="wbProjectSkillForm.skillType"
                        :placeholder="'请选择' + wbProjectSkillTypeCategoryLabel"
                        style="width: 100%"
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      >
                        <a-select-option v-for="item in wbProjectSkillTypeDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                      </a-select>
                    </a-form-item>
                    <a-form-item label="输入">
                      <a-select
                        v-model:value="wbProjectSkillForm.skillInputs"
                        mode="tags"
                        placeholder="回车添加输入项，如：预算批复文件、付款台账"
                        style="width: 100%"
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      />
                    </a-form-item>
                    <a-form-item label="输出" style="margin-bottom: 0;">
                      <a-input
                        v-model:value="wbProjectSkillForm.outputSummary"
                        placeholder="一句话描述技能输出，如：输出异常清单与核查建议"
                        allow-clear
                        :maxlength="120"
                        :disabled="wbProjectSkillBasicFieldsLocked"
                      />
                    </a-form-item>
                  </a-form>
                </div>
                <div v-else style="padding: var(--ds-space-m) 0;">
                  <a-empty description="未找到技能，请关闭后重试。" />
                </div>
                <template #footer>
                  <a-button @click="onWbProjectSkillBasicModalCancel">取消</a-button>
                  <a-button
                    v-if="!wbProjectSkillBasicFieldsLocked"
                    :type="wbProjectSkillBasicPaneDirty ? 'primary' : 'default'"
                    :disabled="!wbProjectSkillBasicPaneDirty"
                    @click="saveWbProjectSkillBasicPane"
                  >保存</a-button>
                </template>
              </a-modal>
              <a-modal
                v-model:open="wbProjectSkillDetailModalOpen"
                width="1040"
                wrapClassName="modal-skill-config modal-project-skill-config"
                centered
                :maskClosable="false"
                @cancel="() => closeWbProjectSkillDetailModal(false)"
              >
                <template #title>
                  <div class="skill-modal-config-title-row">
                    <div class="skill-modal-config-title-main">
                      <span class="skill-modal-config-title-text">{{ wbProjectSkillDetailModalTitle }}</span>
                    </div>
                  </div>
                </template>
                <div v-if="wbDetailSelectedSkill" class="tc-skill-modal-body tc-skill-modal-body--unified">
                  <div class="ds-unified-tab-pane-stack">
                    <SkillConfigEditor
                      :skill="wbDetailSelectedSkill"
                      v-model:nav-key="wbProjectSkillConfigNavKey"
                      v-model:expanded-keys="wbProjectSkillConfigTreeExpandedKeys"
                      :locked="wbProjectSkillConfigTabLocked"
                      :polish-key="freeAuditAiPolishKey"
                      :polish-undo="freeAuditPolishUndo"
                      polish-prefix="wb"
                      :analysis-placeholder="getSkillAnalysisRulePlaceholder()"
                      rule-title="审计思路"
                      @change="scheduleWbProjectSkillDetailSync"
                      @polish-rule="demoAiPolishWbAnalysisRule"
                      @undo-rule="undoWbAnalysisRule"
                      @polish-file-field="demoAiPolishWbSkillFileField"
                      @undo-file-field="undoWbSkillFileField"
                    />
                  </div>
                </div>
                <div v-else style="padding: var(--ds-space-m) 0;">
                  <a-empty description="未找到技能，请关闭后重试。" />
                </div>
                <template #footer>
                  <div class="ds-modal-footer-end">
                    <a-space>
                      <a-button @click="() => closeWbProjectSkillDetailModal(false)">{{ wbProjectSkillDetailReadOnly ? '关闭' : '取消' }}</a-button>
                      <a-button
                        v-if="!wbProjectSkillDetailReadOnly"
                        :type="wbProjectSkillConfigPaneDirty ? 'primary' : 'default'"
                        :disabled="!wbProjectSkillConfigPaneDirty"
                        @click="saveWbProjectSkillConfigPane"
                      >保存</a-button>
                    </a-space>
                  </div>
                </template>
              </a-modal>
          <a-modal
            v-model:open="wbTaskRerunConfirmOpen"
            :title="workbenchTaskRerunConfirmTitle()"
            width="520"
            wrapClassName="modal-w-520"
            :maskClosable="false"
            @ok="confirmWorkbenchTaskRerun"
            @cancel="closeWorkbenchTaskRerunConfirm"
            cancel-text="取消"
            ok-text="确认重跑"
          >
            <a-form layout="vertical">
              <a-form-item style="margin-bottom: 0;">
                <p style="margin:0 0 var(--ds-space-sm);line-height:1.6;">请确认是否删除上次执行产出的结果</p>
                <a-radio-group v-model:value="wbTaskRerunConfirmDisposition">
                  <a-radio value="keep">保留当前结果</a-radio>
                  <a-radio value="delete">删除当前结果</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-form>
          </a-modal>
          <a-modal
            v-model:open="wbMaterialMetaEditVisible"
            title="重命名资料"
            width="520"
            wrapClassName="modal-w-520"
            :maskClosable="false"
            @cancel="cancelWorkbenchProjectMaterialMetaEdit"
          >
            <a-form layout="vertical">
              <a-form-item label="资料名称" style="margin-bottom: 0;">
                <a-input v-model:value="wbMaterialMetaEditForm.name" placeholder="请输入资料名称" allow-clear />
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button
                :type="wbMaterialMetaEditDirty ? 'primary' : 'default'"
                :disabled="!wbMaterialMetaEditDirty"
                @click="confirmWorkbenchProjectMaterialMetaEdit"
              >确定</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbCreateFolderModalOpen"
            title="新建文件夹"
            width="520"
            wrapClassName="modal-w-520"
            :maskClosable="false"
            @cancel="closeWorkbenchMaterialCreateFolderModal"
          >
            <a-form layout="vertical">
              <a-form-item label="文件夹名称" style="margin-bottom: 0;">
                <a-input v-model:value="wbCreateFolderForm.name" placeholder="请输入文件夹名称" allow-clear />
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button @click="closeWorkbenchMaterialCreateFolderModal">取消</a-button>
              <a-button type="primary" @click="confirmWorkbenchMaterialCreateFolder">创建</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbCrossWorkbenchImportOpen"
            title="引入文件"
            width="960"
            wrapClassName="modal-w-960 modal-wb-cross-import"
            centered
            destroy-on-close
            :maskClosable="false"
            @cancel="closeCrossWorkbenchImportModal"
          >
            <div class="wb-cross-import wb-task-create-modal__body">
              <section
                class="wb-task-create-modal__resources wb-cross-import__resources"
                aria-labelledby="wb-cross-import-resources-heading"
              >
                <div id="wb-cross-import-resources-heading" class="wb-task-create-modal__resources-heading">
                  <span>请选择要引入的资源</span>
                </div>
                <div class="wb-cross-import__source-bar">
                  <span class="wb-cross-import__source-label">来源工作台</span>
                  <a-select
                    v-model:value="wbCrossWorkbenchImportSourceProjectId"
                    :options="crossWorkbenchImportSourceOptions()"
                    class="wb-cross-import__source-select"
                    placeholder="请选择来源工作台"
                    @change="onCrossWorkbenchImportSourceChange"
                  />
                </div>
                <div class="wb-task-create-transfer wb-cross-import__transfer">
                  <section class="wb-task-create-transfer__panel">
                    <div class="wb-task-create-transfer__panel-head">
                      <a-tabs
                        v-model:activeKey="wbCrossWorkbenchImportTab"
                        size="small"
                        class="wb-task-create-transfer__tabs"
                        @change="onCrossWorkbenchImportTabChange"
                      >
                        <a-tab-pane key="file" tab="文件"></a-tab-pane>
                        <a-tab-pane key="result" tab="结果"></a-tab-pane>
                      </a-tabs>
                    </div>
                    <div class="wb-task-create-transfer__panel-body">
                      <div class="wb-task-create-transfer__tools">
                        <a-input
                          v-model:value="wbCrossWorkbenchImportQuery"
                          allow-clear
                          class="ds-input-inline-search ds-input-inline-search--compact wb-task-create-transfer__search"
                          placeholder="搜索资源名称"
                          @change="syncCrossWorkbenchImportExpandedKeys"
                        >
                          <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
                        </a-input>
                        <div class="wb-task-create-transfer__batch-actions">
                          <a-button size="small" class="wb-task-create-transfer__batch-btn" :disabled="!crossWorkbenchImportCurrentSelectableResources().length" @click="selectAllCrossWorkbenchImportCurrentResources">全选</a-button>
                          <a-button size="small" class="wb-task-create-transfer__batch-btn" :disabled="!crossWorkbenchImportCurrentSelectedCount()" @click="cancelAllCrossWorkbenchImportCurrentResources">取消全选</a-button>
                        </div>
                      </div>
                      <div class="wb-task-create-transfer__scroll wb-material-file-drawer">
                        <div v-if="crossWorkbenchImportTreeData().length" class="nlm-cards-wrap nlm-tree-wrap wb-task-create-resource-tree-wrap">
                          <a-tree
                            class="wb-material-file-tree wb-task-create-resource-tree"
                            block-node
                            :show-line="{ showLeafIcon: false }"
                            :show-icon="false"
                            :tree-data="crossWorkbenchImportTreeData()"
                            v-model:expanded-keys="wbCrossWorkbenchImportExpandedKeys"
                          >
                            <template #switcherIcon><span aria-hidden="true"></span></template>
                            <template #title="d">
                              <div
                                v-if="d.isFolder"
                                :class="['nlm-tree-leaf', 'nlm-tree-leaf--folder']"
                                @click.stop="toggleCrossWorkbenchImportTreeNodeExpanded(d)"
                              >
                                <span class="wb-task-create-tree-check" @click.stop>
                                  <a-checkbox
                                    :checked="isCrossWorkbenchImportTreeNodeChecked(d)"
                                    :indeterminate="isCrossWorkbenchImportTreeNodeIndeterminate(d)"
                                    @change="toggleCrossWorkbenchImportTreeNodeSelection(d)"
                                  />
                                </span>
                                <span class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle" aria-hidden="true">
                                  <ds-icon
                                    name="chevron-right"
                                    class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev"
                                    :class="{ 'wb-material-file-tree-switcher-chev--expanded': (wbCrossWorkbenchImportExpandedKeys || []).includes(String(d.key)) }"
                                  />
                                </span>
                                <div class="nlm-tree-leaf-title-wrap">
                                  <div class="nlm-tree-leaf-col nlm-tree-leaf-col--folder">
                                    <span class="nlm-stat-count-label-row">
                                      <div class="nlm-tree-leaf-title">{{ d.title }}</div>
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div
                                v-else
                                :class="['nlm-tree-leaf', { 'nlm-tree-leaf--analysis': wbCrossWorkbenchImportTab === 'result' }]"
                              >
                                <span class="wb-task-create-tree-check" @click.stop>
                                  <a-checkbox
                                    :checked="isCrossWorkbenchImportTreeNodeChecked(d)"
                                    @change="toggleCrossWorkbenchImportTreeNodeSelection(d)"
                                  />
                                </span>
                                <span class="nlm-tree-leaf-icon">
                                  <ds-icon
                                    :name="crossWorkbenchImportTreeNodeIconMeta(d).iconClass"
                                    :class="crossWorkbenchImportTreeNodeIconMeta(d).iconToneClass"
                                    aria-hidden="true"
                                  />
                                </span>
                                <div class="nlm-tree-leaf-title-wrap">
                                  <div class="nlm-tree-leaf-col">
                                    <div class="nlm-tree-leaf-title">{{ d.title }}</div>
                                  </div>
                                </div>
                              </div>
                            </template>
                          </a-tree>
                        </div>
                        <a-empty v-else description="当前来源下暂无可引入内容" />
                      </div>
                    </div>
                  </section>
                  <section class="wb-task-create-transfer__panel wb-task-create-transfer__panel--selected">
                    <div class="wb-task-create-transfer__selected-head">
                      <span>已选内容（{{ crossWorkbenchImportSelectedRows().length }}）</span>
                      <a-button
                        v-if="crossWorkbenchImportSelectedRows().length"
                        type="link"
                        size="small"
                        @click="clearCrossWorkbenchImportResources"
                      >清空</a-button>
                    </div>
                    <div class="wb-task-create-transfer__panel-body">
                      <div class="wb-task-create-transfer__scroll">
                        <div v-if="crossWorkbenchImportSelectedRows().length" class="wb-task-create-transfer__list">
                          <FreeAuditTaskCreateResourceRow
                            v-for="item in crossWorkbenchImportSelectedRows()"
                            :key="'cross-sel-' + item.key"
                            :item="item"
                            selected-mode
                            @remove="removeCrossWorkbenchImportResource"
                          />
                        </div>
                        <a-empty v-else description="请从左侧添加资源" />
                      </div>
                    </div>
                  </section>
                </div>
              </section>
              <div class="wb-cross-import__target-bar">
                <div class="wb-task-create-instruction-hint" role="note" aria-label="引入说明">
                  <ds-icon name="circle-info" class="wb-task-create-instruction-hint__icon" aria-hidden="true" />
                  <span class="wb-task-create-instruction-hint__text">引入后将在当前工作台生成独立副本；来源权限变化、来源删除和当前删除互不影响。</span>
                </div>
              </div>
            </div>
            <template #footer>
              <div class="ds-modal-footer-end">
                <a-space>
                  <a-button @click="closeCrossWorkbenchImportModal">取消</a-button>
                  <a-button type="primary" :disabled="crossWorkbenchImportSubmitDisabled()" @click="submitCrossWorkbenchImport">引入</a-button>
                </a-space>
              </div>
            </template>
          </a-modal>
          <a-modal v-model:open="wbUploadMaterialVisible" title="上传文件" width="1080" wrapClassName="modal-material-upload" @cancel="closeWorkbenchUploadMaterialModal">
            <div class="project-material-upload" :class="{ 'project-material-upload--has-session': workbenchHasUploadSessionItems }">
              <template v-if="workbenchHasUploadSessionItems">
                <div class="project-material-upload__session-layout">
                  <div class="project-material-upload__session-side">
                    <a-upload-dragger
                      class="project-material-upload__dragger project-material-upload__dragger--split"
                      :multiple="true"
                      :open-file-dialog-on-click="false"
                      :before-upload="blockWorkbenchRealUploadMaterial"
                      :file-list="[]"
                      :show-upload-list="false"
                    >
                      <div class="project-material-upload__drop-action" role="button" tabindex="0" @click="simulateWorkbenchUploadMaterial" @keydown.enter.prevent="simulateWorkbenchUploadMaterial" @keydown.space.prevent="simulateWorkbenchUploadMaterial">
                        <p class="ant-upload-drag-icon"><ds-icon name="file-import" /></p>
                        <p class="ant-upload-text">将文件拖拽至此区域或<span class="project-material-upload__upload-link">选择文件上传</span></p>
                      </div>
                    </a-upload-dragger>
                    <section class="project-material-upload__guide" aria-label="上传说明">
                      <div class="project-material-upload__guide-title">上传说明</div>
                      <ol class="project-material-upload__guide-list">
                        <li class="project-material-upload__guide-item">
                          <span class="project-material-upload__guide-index">1.</span>
                          <div class="project-material-upload__guide-content">
                            <span class="project-material-upload__guide-text">支持上传 PDF、图片、表格、文档、MD、TXT、JSON、XML 等常见格式。</span>
                            <a-popover trigger="hover" placement="right" overlayClassName="project-material-upload__format-popover">
                              <template #content>
                                <div class="project-material-upload__format-detail">
                                  <div class="project-material-upload__format-title">上传支持格式</div>
                                  <dl class="project-material-upload__format-groups">
                                    <div><dt>文档</dt><dd>PDF、DOC、DOCX、WPS、MD、TXT</dd></div>
                                    <div><dt>表格</dt><dd>XLSX、XLS、CSV</dd></div>
                                    <div><dt>图片</dt><dd>JPG、PNG、BMP、TIF</dd></div>
                                    <div><dt>结构化数据</dt><dd>JSON、XML</dd></div>
                                  </dl>
                                  <p class="project-material-upload__format-note">系统会自动提取文档文字和表格数据，用于后续解析、引用和审计分析；DOC / WPS 文件会自动转换为 DOCX 后再进入解析。</p>
                                </div>
                              </template>
                              <button type="button" class="project-material-upload__detail-btn">查看细则</button>
                            </a-popover>
                          </div>
                        </li>
                        <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">2.</span><span class="project-material-upload__guide-text">支持上传 ZIP 压缩包。</span></li>
                        <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">3.</span><span class="project-material-upload__guide-text">一批最多上传4GB文件（数量不限）</span></li>
                      </ol>
                    </section>
                  </div>
                  <section class="project-material-upload__file-panel" aria-label="当前上传会话文件列表">
                    <div class="project-material-upload__file-panel-head">
                      <h3 class="project-material-upload__file-title">待上传文件</h3>
                      <div class="project-material-upload__file-panel-actions">
                        <a-button type="link" danger class="project-material-upload__clear-btn" :disabled="!workbenchUploadSessionPendingCount" @click="clearWorkbenchUploadPendingItems">
                          <ds-icon name="trash" aria-hidden="true" />
                          <span>清空</span>
                        </a-button>
                      </div>
                    </div>
                    <div class="project-material-upload__bulk-wrap">
                      ${freeauditPanels.bulkBar('upload', 'session')}
                    </div>
                    <div class="project-material-upload__table" role="table" aria-label="当前上传会话文件列表">
                      <div class="project-material-upload__table-row project-material-upload__table-row--head" role="row" :class="{ 'is-bulk-mode': workbenchBulkScopeActive('upload', 'session') }">
                        <div v-if="workbenchBulkScopeActive('upload', 'session')" role="columnheader" class="project-material-upload__table-check-cell"></div>
                        <div role="columnheader">文件名</div>
                        <div role="columnheader">大小</div>
                        <div role="columnheader">状态</div>
                        <div role="columnheader">操作</div>
                      </div>
                      <div
                        v-for="file in workbenchUploadSessionItems"
                        :key="file.uid"
                        class="project-material-upload__table-row"
                        :class="{ 'is-bulk-mode': workbenchBulkScopeActive('upload', 'session'), 'is-bulk-selected': workbenchBulkIsSelected(workbenchBulkUploadSessionDescriptor(file)) }"
                        role="row"
                      >
                        <div v-if="workbenchBulkScopeActive('upload', 'session')" role="cell" class="project-material-upload__table-check-cell">
                          <a-checkbox
                            :checked="workbenchBulkIsSelected(workbenchBulkUploadSessionDescriptor(file))"
                            @change="(e) => toggleWorkbenchBulkSelection(workbenchBulkUploadSessionDescriptor(file), e)"
                          />
                        </div>
                        <div role="cell" class="project-material-upload__file-meta">
                          <div class="project-material-upload__file-name" :title="file.name">{{ file.name }}</div>
                          <div v-if="workbenchUploadSessionFailureText(file)" class="project-material-upload__file-subtext">{{ workbenchUploadSessionFailureText(file) }}</div>
                        </div>
                        <div role="cell">{{ formatWorkbenchUploadMaterialSize(file.size) }}</div>
                        <div role="cell">
                          <span class="project-material-upload__status" :class="'is-' + file.status">{{ workbenchUploadSessionStatusLabel(file) }}</span>
                        </div>
                        <div role="cell" class="project-material-upload__ops">
                          <button
                            v-if="workbenchUploadSessionSecondaryAction(file)"
                            type="button"
                            class="project-material-upload__remove-btn"
                            @click="handleWorkbenchUploadSessionItemAction(workbenchUploadSessionSecondaryAction(file), file)"
                          >{{ workbenchUploadSessionActionLabel(workbenchUploadSessionSecondaryAction(file)) }}</button>
                          <button
                            v-if="workbenchUploadSessionItemAction(file)"
                            type="button"
                            class="project-material-upload__remove-btn"
                            :class="{ 'is-primary': workbenchUploadSessionItemAction(file) === 'retry-upload' }"
                            @click="handleWorkbenchUploadSessionItemAction(workbenchUploadSessionItemAction(file), file)"
                          >{{ workbenchUploadSessionActionLabel(workbenchUploadSessionItemAction(file)) }}</button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </template>
              <template v-else>
                <a-upload-dragger
                  class="project-material-upload__dragger project-material-upload__dragger--empty"
                  :multiple="true"
                  :open-file-dialog-on-click="false"
                  :before-upload="blockWorkbenchRealUploadMaterial"
                  :file-list="[]"
                  :show-upload-list="false"
                >
                  <div class="project-material-upload__drop-action" role="button" tabindex="0" @click="simulateWorkbenchUploadMaterial" @keydown.enter.prevent="simulateWorkbenchUploadMaterial" @keydown.space.prevent="simulateWorkbenchUploadMaterial">
                    <p class="ant-upload-drag-icon"><ds-icon name="file-import" /></p>
                    <p class="ant-upload-text">将文件拖拽至此区域或<span class="project-material-upload__upload-link">选择文件上传</span></p>
                  </div>
                </a-upload-dragger>
                <section class="project-material-upload__guide" aria-label="上传说明">
                  <div class="project-material-upload__guide-title">上传说明</div>
                  <ol class="project-material-upload__guide-list">
                    <li class="project-material-upload__guide-item">
                      <span class="project-material-upload__guide-index">1.</span>
                      <div class="project-material-upload__guide-content">
                        <span class="project-material-upload__guide-text">支持上传 PDF、图片、表格、文档、MD、TXT、JSON、XML 等常见格式。</span>
                        <a-popover trigger="hover" placement="right" overlayClassName="project-material-upload__format-popover">
                          <template #content>
                            <div class="project-material-upload__format-detail">
                              <div class="project-material-upload__format-title">上传支持格式</div>
                              <dl class="project-material-upload__format-groups">
                                <div><dt>文档</dt><dd>PDF、DOC、DOCX、WPS、MD、TXT</dd></div>
                                <div><dt>表格</dt><dd>XLSX、XLS、CSV</dd></div>
                                <div><dt>图片</dt><dd>JPG、PNG、BMP、TIF</dd></div>
                                <div><dt>结构化数据</dt><dd>JSON、XML</dd></div>
                              </dl>
                              <p class="project-material-upload__format-note">系统会自动提取文档文字和表格数据，用于后续解析、引用和审计分析；DOC / WPS 文件会自动转换为 DOCX 后再进入解析。</p>
                            </div>
                          </template>
                          <button type="button" class="project-material-upload__detail-btn">查看细则</button>
                        </a-popover>
                      </div>
                    </li>
                    <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">2.</span><span class="project-material-upload__guide-text">支持上传 ZIP 压缩包。</span></li>
                    <li class="project-material-upload__guide-item"><span class="project-material-upload__guide-index">3.</span><span class="project-material-upload__guide-text">一批最多上传4GB文件（数量不限）</span></li>
                  </ol>
                </section>
              </template>
            </div>
            <template #footer>
              <div class="ds-modal-footer-end">
                <a-space>
                  <a-button @click="closeWorkbenchUploadMaterialModal">关闭</a-button>
                  <a-button v-if="workbenchUploadSessionPendingCount" type="primary" @click="submitWorkbenchUploadMaterials">
                    <span>{{ workbenchUploadSessionHasStartedUpload ? '追加上传' : '开始上传' }}（{{ workbenchUploadSessionPendingCount }}）</span>
                  </a-button>
                </a-space>
              </div>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbDeleteFolderModalOpen"
            title="删除文件夹"
            width="520"
            wrapClassName="modal-w-520"
            ok-text="删除"
            ok-type="primary"
            :ok-button-props="{ danger: true }"
            @ok="confirmDeleteWorkbenchMaterialFolder"
            @cancel="wbDeleteFolderModalOpen = false; wbDeleteFolderTarget = null"
          >
            <p v-if="wbDeleteFolderConfirmContent" style="margin:0;line-height:1.6;">{{ wbDeleteFolderConfirmContent }}</p>
          </a-modal>
          <a-modal
            v-model:open="wbArResultCreateFolderModalOpen"
            title="创建文件夹"
            width="520"
            wrapClassName="modal-w-520"
            :maskClosable="false"
            @cancel="closeWorkbenchAnalysisResultCreateFolderModal"
          >
            <a-form layout="vertical">
              <a-form-item label="文件夹名称" style="margin-bottom: 0;">
                <a-input v-model:value="wbArResultCreateFolderName" placeholder="请输入文件夹名称" allow-clear />
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button @click="closeWorkbenchAnalysisResultCreateFolderModal">取消</a-button>
              <a-button type="primary" @click="confirmWorkbenchAnalysisResultCreateFolder">创建</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbTaskResourcePreviewOpen"
            width="760"
            wrapClassName="modal-w-760 material-preview-modal material-preview-modal--unified-tabs wb-task-resource-preview-modal"
            centered
            :footer="null"
            :destroyOnClose="true"
            :maskClosable="true"
            @cancel="closeWbTaskResourcePreview"
          >
            <template #title>
              <div class="preview-modal-title-row">
                <span class="preview-modal-title-row__text">{{ wbTaskResourcePreviewModalTitle }}</span>
              </div>
            </template>
            <div class="preview-modal-body-scroll">
              <div class="tc-skill-modal-body tc-skill-modal-body--unified material-preview-unified-body workbench-material-preview-unified-body">
                <a-tabs
                  v-model:activeKey="wbTaskResourcePreviewActiveTab"
                  class="skill-unified-modal-tabs material-preview-unified-tabs"
                  tab-position="left"
                  :aria-label="wbTaskResourcePreviewModalTabsAriaLabel"
                >
                  <a-tab-pane key="basic" tab="基本信息">
                    <FreeAuditBasicInfoPane :rows="wbTaskResourcePreviewBasicRows" key-prefix="wb-trp-meta" hide-chrome />
                  </a-tab-pane>
                  <a-tab-pane v-if="wbTaskResourcePreviewIsDatabase" key="fields" tab="字段信息">
                    <div class="ds-unified-tab-pane-stack">
                      <div class="preview-modal-content-frame preview-modal-content-frame--material wb-db-ddl-preview-wrap">
                        <div class="material-preview-modal__viewer">
                          <div class="material-preview-modal__viewer-body">
                            <div v-if="wbTaskResourcePreviewDatabaseTables.length" class="nlm-source-read">
                              <div v-for="(t, ti) in wbTaskResourcePreviewDatabaseTables" :key="'wb-trp-ddl-' + ti + '-' + t.name" class="excerpt">
                                <strong>{{ t.name }}</strong>
                                <p style="margin:var(--ds-space-xxs) 0 0 0; white-space:pre-wrap;">{{ t.ddl }}</p>
                              </div>
                            </div>
                            <a-empty v-else description="暂无建表语句" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </a-tab-pane>
                  <a-tab-pane v-if="wbTaskResourcePreviewResolvedMaterial && (wbTaskResourcePreviewResolvedMaterial.type === 'raw' || wbTaskResourcePreviewResolvedMaterial.type === undefined) && wbTaskResourcePreviewResolvedMaterial.projectSource" key="preview" tab="文件预览">
                    <div class="ds-unified-tab-pane-stack">
                      <div class="ds-unified-tab-pane-chrome" role="toolbar" aria-label="文件预览操作">
                        <div class="ds-unified-tab-pane-chrome__actions">
                          <a-button
                            v-if="wbTaskResourcePreviewResolvedRawSubtype !== 'table'"
                            type="default"
                            class="material-preview-download-link"
                            title="下载"
                            aria-label="下载"
                            @click.stop="downloadWbTaskResourcePreview"
                          >下载</a-button>
                        </div>
                      </div>
                      <div class="preview-modal-content-frame preview-modal-content-frame--material">
                        <div v-if="wbTaskResourcePreviewResolvedRawSubtype !== 'table'" class="material-preview-modal__viewer">
                          <div class="material-preview-modal__viewer-body">
                            <div
                              v-for="(page, pi) in wbTaskResourcePreviewDocumentPages"
                              :key="'wb-trp-doc-' + pi"
                              class="nlm-original-doc-page material-preview-modal__page"
                            >{{ page }}</div>
                          </div>
                        </div>
                        <div v-else class="material-preview-modal__viewer">
                          <div class="material-preview-modal__viewer-body">
                            <div v-if="wbTaskResourcePreviewResolvedMaterial.originalView && wbTaskResourcePreviewResolvedMaterial.originalView.headers" class="nlm-original-table-wrap">
                              <table class="nlm-original-table">
                                <thead><tr><th v-for="(h, hi) in wbTaskResourcePreviewResolvedMaterial.originalView.headers" :key="hi">{{ h }}</th></tr></thead>
                                <tbody><tr v-for="(trow, ri) in (wbTaskResourcePreviewResolvedMaterial.originalView.rows || [])" :key="ri"><td v-for="(cell, ci) in trow" :key="ci">{{ cell }}</td></tr></tbody>
                              </table>
                            </div>
                            <a-empty v-else description="暂无表格预览" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </a-tab-pane>
                  <a-tab-pane
                    v-if="wbTaskResourcePreviewResolvedMaterial && (wbTaskResourcePreviewResolvedMaterial.type === 'raw' || wbTaskResourcePreviewResolvedMaterial.type === undefined) && wbTaskResourcePreviewResolvedMaterial.projectSource && wbTaskResourcePreviewResolvedRawSubtype !== 'table'"
                    key="ocr"
                    tab="OCR结果"
                  >
                    <div class="ds-unified-tab-pane-stack">
                      <div class="ds-unified-tab-pane-chrome" role="toolbar" aria-label="OCR结果">
                        <div class="ds-unified-tab-pane-chrome__actions material-preview-ocr-chrome-actions">
                          <div class="ds-mode-switch-slider material-preview-ocr-mode-switch" :class="{ 'is-assisted': wbTaskResourcePreviewOcrLines, 'is-auto': !wbTaskResourcePreviewOcrLines }" role="tablist" aria-label="OCR预览模式切换">
                            <span class="ds-mode-switch-slider__thumb" aria-hidden="true"></span>
                            <a-tooltip title="普通">
                              <button
                                type="button"
                                class="ds-mode-switch-slider__item"
                                :class="{ 'is-current': !wbTaskResourcePreviewOcrLines }"
                                role="tab"
                                :aria-selected="!wbTaskResourcePreviewOcrLines"
                                :tabindex="!wbTaskResourcePreviewOcrLines ? 0 : -1"
                                title="普通"
                                aria-label="普通预览"
                                @click="wbTaskResourcePreviewOcrLines = false"
                              >
                                <ds-icon name="eye" aria-hidden="true" />
                              </button>
                            </a-tooltip>
                            <a-tooltip title="行号">
                              <button
                                type="button"
                                class="ds-mode-switch-slider__item"
                                :class="{ 'is-current': wbTaskResourcePreviewOcrLines }"
                                role="tab"
                                :aria-selected="wbTaskResourcePreviewOcrLines"
                                :tabindex="wbTaskResourcePreviewOcrLines ? 0 : -1"
                                title="行号"
                                aria-label="带行号预览"
                                @click="wbTaskResourcePreviewOcrLines = true"
                              >
                                <ds-icon name="code" aria-hidden="true" />
                              </button>
                            </a-tooltip>
                          </div>
                        </div>
                      </div>
                      <div class="material-preview-modal__viewer material-preview-modal__viewer--ocr-tab">
                        <div class="material-preview-modal__viewer-body">
                          <div
                            v-for="(page, oi) in wbTaskResourcePreviewOcrDisplayed"
                            :key="'wb-trp-ocr-' + oi"
                            :class="['nlm-original-doc-page', 'material-preview-modal__page', { 'ds-font-mono': wbTaskResourcePreviewOcrLines }]"
                          >{{ page }}</div>
                        </div>
                      </div>
                    </div>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </a-modal>
          <a-modal
            v-model:open="wbAnalysisResultMetaEditVisible"
            title="重命名分析结果"
            width="520"
            wrapClassName="modal-w-520"
            :maskClosable="false"
            @cancel="closeWorkbenchAnalysisResultMetaEdit"
          >
            <a-form layout="vertical">
              <a-form-item label="结果名称" style="margin-bottom: 0;">
                <a-input v-model:value="wbAnalysisResultMetaEditForm.name" placeholder="请输入结果名称" allow-clear />
              </a-form-item>
            </a-form>
            <template #footer>
              <a-button @click="closeWorkbenchAnalysisResultMetaEdit">取消</a-button>
              <a-button type="primary" @click="confirmWorkbenchAnalysisResultMetaEdit">确定</a-button>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbAnalysisModalOpen"
            width="760"
            wrapClassName="modal-w-760 analysis-result-preview-modal analysis-result-preview-modal--unified-tabs"
            centered
            :footer="null"
            @cancel="closeWbAnalysisModal"
          >
            <template #title>
              <div class="preview-modal-title-row">
                <span class="preview-modal-title-row__text">{{ (wbAnalysisModalRecord && wbAnalysisModalRecord.name) || '结果预览' }}</span>
              </div>
            </template>
            <div class="preview-modal-body-scroll">
              <div v-if="wbAnalysisModalRecord" class="tc-skill-modal-body tc-skill-modal-body--unified analysis-result-unified-body">
                <a-tabs
                  :activeKey="wbAnalysisModalActiveTab"
                  class="skill-unified-modal-tabs analysis-result-unified-tabs"
                  tab-position="left"
                  aria-label="结果预览：基本信息、输出结果与历史版本"
                  @update:activeKey="onWbAnalysisModalTabUpdate"
                >
                  <a-tab-pane key="basic" tab="基本信息">
                    <FreeAuditBasicInfoPane
                      pane-class="workbench-result-preview-pane workbench-result-preview-pane--basic"
                      body-class="workbench-result-preview-tab-inner"
                      nested-body-class="material-preview-basic-tab"
                      :rows="wbAnalysisModalBasicMetaRows"
                      key-prefix="wb-am-meta"
                      status-row-label="状态"
                      :status-class="analysisStatusChipClass(wbAnalysisModalRecord && wbAnalysisModalRecord.status)"
                      :status-text="analysisResultStatusLabel(wbAnalysisModalRecord && wbAnalysisModalRecord.status)"
                      hide-chrome
                    />
                  </a-tab-pane>
                  <a-tab-pane key="body" tab="输出结果">
                    <FreeAuditAnalysisOutputPane
                      v-model:draft-value="wbAnalysisModalEmbedDraft"
                      :result-format="wbAnalysisModalPreviewFormat"
                      :csv-headers="wbAnalysisModalPreviewCsvTable.headers"
                      :csv-rows="wbAnalysisModalPreviewCsvTable.rows"
                      :editor-disabled="wbAnalysisModalPreviewIsCsv"
                      :copy-disabled="!wbAnalysisModalRecord || wbAnalysisModalPreviewIsCsv"
                      :export-disabled="!wbAnalysisModalRecord"
                      :dirty="wbAnalysisModalEmbedDirty"
                      :save-disabled="!wbAnalysisModalEmbedDirty || wbAnalysisModalPreviewIsCsv"
                      :export-formats="wbAnalysisModalExportFormats"
                      @copy="copyWbAnalysisModalEmbedPreview"
                      @export-menu="(info) => onWorkbenchAnalysisResultToolbarExportMenu(info, 'modal')"
                      @save="saveWbAnalysisModalEmbedEdit"
                    />
                  </a-tab-pane>
                  <a-tab-pane key="history" tab="历史版本">
                    <FreeAuditAnalysisHistoryPane
                      :active="!!wbAnalysisModalRecord"
                      :rows="wbAnalysisModalVersionHistoryOnlyRows"
                      :columns="workbenchAnalysisVersionMgmtColumns"
                      table-empty-description="暂无历史快照。"
                      inactive-description="暂无历史版本。"
                      @detail="(record) => openWorkbenchAnalysisHistoryDiff(record, 'modal')"
                      @rollback="(record) => applyWorkbenchAnalysisMarkdownRollbackById(wbAnalysisModalRecord && wbAnalysisModalRecord.id, record.markdown)"
                    />
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>
          </a-modal>
          <a-modal
            v-model:open="wbAnalysisHistoryDiffOpen"
            width="760"
            wrapClassName="modal-w-760"
            title="与当前版本对比"
            :footer="null"
            destroy-on-close
            @cancel="closeWorkbenchAnalysisHistoryDiff"
          >
            <div class="nlm-tool-diff-md" role="region" aria-label="Markdown 行级差异">
              <div v-if="!wbAnalysisHistoryDiffLines.length" class="text-secondary">无差异或内容为空。</div>
              <div
                v-for="(ln, di) in wbAnalysisHistoryDiffLines"
                :key="'wb-ar-diff-' + di"
                class="nlm-tool-diff-line"
                :class="toolDiffLineClass(ln)"
              ><span class="nlm-tool-diff-line__gutter">{{ di + 1 }}</span><span class="nlm-tool-diff-line__code">{{ ln }}</span></div>
              <div v-if="wbAnalysisHistoryDiffTruncated" class="text-secondary" style="margin-top:8px;">以下差异已省略展示（展示上限）。</div>
            </div>
          </a-modal>
          <a-modal
            v-model:open="wbAnalysisVersionDetailVisible"
            title="版本详情"
            width="760"
            wrapClassName="modal-w-760 analysis-result-preview-modal"
            centered
            :footer="null"
            destroy-on-close
            @cancel="closeWbAnalysisVersionDetail"
          >
            <div class="analysis-result-preview-modal__md" v-html="wbAnalysisVersionDetailHtml"></div>
          </a-modal>
          <a-modal
            v-model:open="wbDbAddModalOpen"
            wrapClassName="modal-w-760 modal-wb-db-add"
            width="760"
            centered
            destroy-on-close
            :keyboard="false"
            :closable="true"
            :mask-closable="false"
            @cancel="closeWorkbenchDbAddModal"
          >
            <template #title>添加库表</template>
            <div class="nlm-db-add-modal">
              <div class="nlm-db-add-field">
                <label class="nlm-db-add-label" for="wb-db-add-catalog-select">请选择数据库</label>
                <a-select
                  id="wb-db-add-catalog-select"
                  v-model:value="wbDbAddCatalogId"
                  class="nlm-db-add-catalog-select"
                  placeholder="请选择数据库"
                  allow-clear
                  show-search
                  :options="wbDbAddCatalogOptions"
                  :filter-option="filterWbDbAddCatalogOption"
                  option-filter-prop="label"
                  aria-label="选择数据库"
                  @change="onWorkbenchDbAddCatalogChange"
                />
              </div>
              <template v-if="wbDbAddCatalogId">
                <div class="nlm-db-add-table-toolbar">
                  <p class="nlm-db-add-step-hint nlm-db-add-step-hint--after-select nlm-db-add-table-toolbar__line1">请选择要添加的表</p>
                  <div class="nlm-db-add-table-toolbar__line2">
                    <span class="nlm-db-add-table-toolbar__count">当前已选：{{ (wbDbAddSelectedTableNames || []).length }}</span>
                    <a-input
                      v-model:value="wbDbAddTableSearchQuery"
                      allow-clear
                      placeholder="搜索表名或注释"
                      class="ds-input-inline-search ds-input-inline-search--compact nlm-db-add-table-toolbar-search"
                      aria-label="搜索数据表"
                    />
                  </div>
                </div>
                <div class="nlm-db-add-table-panel">
                  <div class="nlm-db-add-table-scroll">
                    <a-table
                      row-key="value"
                      size="small"
                      :columns="wbDbAddTableColumns"
                      :data-source="wbDbAddTableRowsFiltered"
                      :pagination="false"
                      :scroll="{ y: 320 }"
                      :bordered="false"
                      :row-selection="wbDbAddTableRowSelection"
                      :locale="wbDbAddTableLocale"
                      class="nlm-db-add-table-ant"
                      aria-label="待添加的数据表列表"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'name'">
                          <span class="nlm-db-add-cell-name">{{ record.name }}<span v-if="record.disabled" class="nlm-db-add-table-line__badge">已添加</span></span>
                        </template>
                        <template v-else-if="column.key === 'comment'">
                          <span class="nlm-db-add-cell-comment">{{ record.comment }}</span>
                        </template>
                      </template>
                    </a-table>
                  </div>
                </div>
              </template>
              <p v-else class="nlm-db-add-catalog-placeholder ds-text-caption-light">请先选择数据库，系统将列出该库下可选的数据表。</p>
            </div>
            <template #footer>
              <div class="nlm-db-add-modal-footer">
                <a-button @click="closeWorkbenchDbAddModal">取消</a-button>
                <a-button type="primary" :disabled="submitWorkbenchDbAddTablesDisabled" @click="submitWorkbenchDbAddTables">添加</a-button>
              </div>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbGraphAddModalOpen"
            wrapClassName="modal-w-960 modal-wb-graph-add"
            width="960"
            centered
            destroy-on-close
            :keyboard="false"
            :closable="true"
            :mask-closable="false"
            @cancel="closeWorkbenchGraphAddModal"
          >
            <template #title>添加数据图谱</template>
            <div class="project-detail-template-scroll project-detail-template-scroll--graph-add">
              <a-row v-if="wbGraphAddCatalogCards.length" :gutter="[16, 16]" class="recent-projects-row project-detail-proj-template-grid">
                <a-col v-for="item in wbGraphAddCatalogCards" :key="item.id" :span="8">
                  <div
                    class="tc-template-card ds-page-card ds-list-card project-detail-proj-template-card project-detail-proj-template-card--selectable"
                    :class="{ 'is-skill-library-selected': wbGraphAddSelectedIds.includes(item.id), 'is-row-disabled': item.disabled }"
                    role="button"
                    tabindex="0"
                    :aria-label="'选择图谱：' + item.name"
                    @click="toggleWorkbenchGraphCard(item)"
                    @keydown.enter.prevent="toggleWorkbenchGraphCard(item)"
                    @keydown.space.prevent="toggleWorkbenchGraphCard(item)"
                  >
                    <div
                      class="template-card-select-check project-detail-proj-template-card__chk"
                      @click.stop
                      @mousedown.stop
                    >
                      <a-checkbox
                        :checked="wbGraphAddSelectedIds.includes(item.id)"
                        :disabled="item.disabled"
                        @click.stop
                        @change="onWbGraphAddCheckboxChange(item, $event)"
                      />
                    </div>
                    <div class="ds-list-card-body wb-graph-add-card-body">
                      <h3 class="tc-template-card__name">{{ item.name }}</h3>
                      <p class="project-center-card-desc">{{ item.description || '暂无描述' }}</p>
                      <div
                        class="project-center-card-stats ds-space-stat-row wb-graph-add-card-stats"
                        role="group"
                        :aria-label="(item.entityCount || 0) + ' 个实体，' + (item.edgeCount || 0) + ' 条连线'"
                      >
                        <span class="ds-space-stat-hit ds-space-stat-hit--graph-entity" tabindex="-1">
                          <span class="ds-space-stat-hit__icon" aria-hidden="true"><ds-icon name="cube" /></span>
                          <span class="ds-space-stat-hit__num tabular-nums">{{ item.entityCount }}</span>
                        </span>
                        <span class="ds-space-stat-hit ds-space-stat-hit--graph-link" tabindex="-1">
                          <span class="ds-space-stat-hit__icon" aria-hidden="true"><ds-icon name="share" /></span>
                          <span class="ds-space-stat-hit__num tabular-nums">{{ item.edgeCount }}</span>
                        </span>
                      </div>
                      <div class="ds-card-foot wb-graph-add-card-foot" @click.stop>
                        <span v-if="item.disabled" class="ds-text-caption-light wb-graph-add-card-foot__badge">已添加</span>
                        <a-button
                          type="button"
                          class="ds-trigger-btn ds-trigger-btn--icon-text wb-graph-add-card-foot__action"
                          @click.stop="openWorkbenchGraphDetailModal(item)"
                        >
                          <ds-icon name="circle-info" class="ds-trigger-btn__icon" aria-hidden="true" />
                          <span class="ds-trigger-btn__text">详情</span>
                        </a-button>
                      </div>
                    </div>
                  </div>
                </a-col>
              </a-row>
              <a-empty v-else description="暂无可添加图谱" />
            </div>
            <template #footer>
              <div class="ds-modal-footer-end">
                <a-space>
                  <a-button @click="closeWorkbenchGraphAddModal">取消</a-button>
                  <a-button type="primary" :disabled="submitWorkbenchGraphAddDisabled" @click="submitWorkbenchGraphAdd">添加</a-button>
                </a-space>
              </div>
            </template>
          </a-modal>
          <a-modal
            v-model:open="wbGraphDetailModalOpen"
            :title="(wbGraphDetailRecord && wbGraphDetailRecord.name) || '数据图谱详情'"
            width="960"
            wrapClassName="modal-w-960 material-preview-modal material-preview-modal--unified-tabs modal-wb-graph-detail"
            centered
            destroy-on-close
            :mask-closable="false"
            @cancel="closeWorkbenchGraphDetailModal"
          >
            <div class="tc-skill-modal-body tc-skill-modal-body--unified material-preview-unified-body">
              <a-tabs v-model:activeKey="wbGraphDetailActiveTab" class="skill-unified-modal-tabs material-preview-unified-tabs" tab-position="left">
                <a-tab-pane key="basic" tab="基本信息">
                  <FreeAuditBasicInfoPane aria-label="图谱基本信息" :rows="wbGraphDetailBasicMetaRows" key-prefix="wb-graph-meta" hide-chrome />
                </a-tab-pane>
                <a-tab-pane key="topology" tab="拓扑图">
                  <div class="ds-unified-tab-pane-stack">
                    <div class="preview-modal-content-frame preview-modal-content-frame--material">
                      <div class="material-preview-modal__viewer">
                        <div class="material-preview-modal__viewer-body">
                          <div class="nlm-empty-state" style="padding: var(--ds-space-m) var(--ds-space-sm);">
                            <p class="nlm-empty-desc">拓扑图占位：实体 {{ (wbGraphDetailRecord && wbGraphDetailRecord.entityCount) || 0 }}，关系 {{ (wbGraphDetailRecord && wbGraphDetailRecord.edgeCount) || 0 }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </a-tab-pane>
              </a-tabs>
            </div>
            <template #footer>
              <div class="ds-modal-footer-end">
                <a-space>
                  <a-button @click="closeWorkbenchGraphDetailModal">关闭</a-button>
                </a-space>
              </div>
            </template>
          </a-modal>
            </div>
          </a-layout></a-layout-content></a-layout>`,
      data() {
        return window.DemoFreeAudit.state.createState();
      },
      computed: window.DemoFreeAudit.computed,
      watch: Object.assign({}, window.DemoFreeAudit.watch, {
        embedMode: {
          immediate: true,
          handler(mode) {
            if (typeof this.setWorkbenchEmbedMode === 'function') {
              this.setWorkbenchEmbedMode(mode || '');
            }
          },
        },
      }),
      methods: window.DemoFreeAudit.actions,
      mounted() {
        if (String(this.embedMode || '') === 'v2') {
          window.__DEMO_FREEAUDIT_CAPABILITY_HOST = this;
        }
        this.initFromUrl();
        this.$nextTick(() => this.updateResourceDrawerHeights());
        /** 工作台「上传资料」在 ProjectCenter 弹窗提交后回调，此处同步资料并打开文件抽屉 */
        this._onMaterialsUploadedBridge = (projectId) => {
          const pid = String(projectId || '');
          if (!pid || String(this.workbenchProjectId || '') !== pid) return;
          this.refreshWorkbenchDemoResources('material');
          this.ensureResourceDrawerOpen('file');
        };
        const b = typeof window !== 'undefined' ? window.__demoQuoteSkillBridge : null;
        if (b && typeof b === 'object') b.onMaterialsUploaded = this._onMaterialsUploadedBridge;
        const onHash = () => this.initFromUrl();
        window.addEventListener('hashchange', onHash);
        this._freeauditHashCleanup = () => window.removeEventListener('hashchange', onHash);
        const onResize = () => this.updateResourceDrawerHeights();
        window.addEventListener('resize', onResize);
        this._resourceDrawerResizeCleanup = () => window.removeEventListener('resize', onResize);
        const onBeforeUnload = (event) => {
          if (!this.workbenchHasUploadingMaterials) return undefined;
          const text = '文件仍在上传中，离开页面可能导致上传中断。';
          event.preventDefault();
          event.returnValue = text;
          return text;
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        this._workbenchBeforeUnloadCleanup = () => window.removeEventListener('beforeunload', onBeforeUnload);
	        this.$el.addEventListener('click', e => {
	          const el = e.target.closest('.nlm-citation');
	          if (!el) return;
          const sourceId = el.dataset.sourceId;
          const excerptIndex = parseInt(el.dataset.excerptIndex, 10);
          const found = this.findMaterialBySourceId(sourceId);
          if (!found) return;
          const materialId = found.material.id;
          this.sourcesCollapsed = false;
          this.lastDetailFocus = 'left';
          this.sourcesLeftView = 'detail';
          this.selectedMaterialId = materialId;
          this.sourcesDetailWidth = 450;
          this.highlightSourceId = materialId;
          this.highlightExcerptIndex = excerptIndex;
          this.$nextTick(() => {
            const ref = this.excerptRefs[materialId] && this.excerptRefs[materialId][excerptIndex];
            if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
	            setTimeout(() => { this.highlightSourceId = null; this.highlightExcerptIndex = null; }, 2000);
	          });
	        });
	        this._onRightSplitResizeStart = (e) => {
	          const el = e.target && e.target.closest ? e.target.closest('.nlm-right-split-resizer') : null;
	          if (!el) return;
	          this.beginResize('rightSplit', e);
	        };
	        this.$el.addEventListener('mousedown', this._onRightSplitResizeStart);
        this.approvalDecisionTick = Date.now();
        this._approvalDecisionCountdownTimer = window.setInterval(() => {
          if (this.updateApprovalDecisionCountdown) this.updateApprovalDecisionCountdown();
        }, 1000);
        if (String(this.embedMode || '') === 'v2' && typeof this.syncWorkbenchV2DetailHostReady === 'function') {
          this.syncWorkbenchV2DetailHostReady();
          this._workbenchV2DetailHostObserver = new MutationObserver(() => {
            if (typeof this.syncWorkbenchV2DetailHostReady === 'function') {
              this.syncWorkbenchV2DetailHostReady();
            }
          });
          this._workbenchV2DetailHostObserver.observe(document.body, { childList: true, subtree: true });
        }
	      },
	      beforeUnmount() {
	        if (window.__DEMO_FREEAUDIT_CAPABILITY_HOST === this) window.__DEMO_FREEAUDIT_CAPABILITY_HOST = null;
	        const br = typeof window !== 'undefined' ? window.__demoQuoteSkillBridge : null;
	        if (br && br.onMaterialsUploaded === this._onMaterialsUploadedBridge) br.onMaterialsUploaded = null;
	        if (this._onRightSplitResizeStart) this.$el.removeEventListener('mousedown', this._onRightSplitResizeStart);
	        this.unbindChatAtFloaterReposition();
        if (this._chatInputBlurTimer) window.clearTimeout(this._chatInputBlurTimer);
        if (this._freeauditHashCleanup) this._freeauditHashCleanup();
        if (this._resourceDrawerResizeCleanup) this._resourceDrawerResizeCleanup();
        if (this._workbenchBeforeUnloadCleanup) this._workbenchBeforeUnloadCleanup();
        if (this._approvalDecisionCountdownTimer) {
          window.clearInterval(this._approvalDecisionCountdownTimer);
          this._approvalDecisionCountdownTimer = null;
        }
        if (this._wbProjectSkillDetailSyncTimer) {
          window.clearTimeout(this._wbProjectSkillDetailSyncTimer);
          this._wbProjectSkillDetailSyncTimer = null;
        }
        if (this._summaryTaskTimers) {
          Object.keys(this._summaryTaskTimers).forEach((id) => this._clearSummaryTaskTimers(id));
        }
        if (this._workbenchUploadTimers) {
          Object.keys(this._workbenchUploadTimers).forEach((id) => this._clearWorkbenchUploadTimers(id));
        }
        if (this._workbenchV2DetailHostObserver) {
          this._workbenchV2DetailHostObserver.disconnect();
          this._workbenchV2DetailHostObserver = null;
        }
      }
    });

})();
