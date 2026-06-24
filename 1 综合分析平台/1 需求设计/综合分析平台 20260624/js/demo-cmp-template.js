(function () {
  const app = window.__DEMO_APP;
  const Modal = window.antd && window.antd.Modal;
  const DEFAULT_TEMPLATE_SORT = 'updated_desc';
  const TEMPLATE_SKILL_LIBRARY = { SHARED: 'shared', MARKET: 'market' };
  const TEMPLATE_CONFIRM_WRAP_CLASS = (window.dsConfirm && window.dsConfirm.WRAP_CLASS) || 'modal-w-520';
  const TEMPLATE_PROJECT_FALLBACKS = [
    { id: 'PRJ-2026-001', name: 'A市城建集团年度经济责任审计', description: '展示完整审计分析流程。' },
    { id: 'PRJ-2026-002', name: '模型繁忙与排队反馈', description: '进入后自动展示模型请求排队、等待与生成中反馈。' },
    { id: 'PRJ-2026-003', name: '工具调用授权确认', description: '进入后自动展示删除结果前的授权确认与审批状态。' },
    { id: 'PRJ-2026-004', name: '空白对话起步', description: '进入后展示空白工作台，便于演示首次对话入口。' },
  ];

  function normalizeTemplateSkillTab(tab) {
    const value = String(tab || '').trim();
    if (value === TEMPLATE_SKILL_LIBRARY.MARKET) return TEMPLATE_SKILL_LIBRARY.MARKET;
    if (value === SKILL_LIBRARY.PUBLIC) return TEMPLATE_SKILL_LIBRARY.SHARED;
    return TEMPLATE_SKILL_LIBRARY.SHARED;
  }

  function isTemplateMarketSkill(row) {
    const sourceKind = String((row && row.sourceKind) || '').trim();
    if (sourceKind) return sourceKind === 'market';
    const sharedBy = String((row && row.sharedBy) || '').trim();
    return sharedBy === '系统预置' || sharedBy === '平台管理员';
  }

  function getTemplateRuntimePublicSkills() {
    const rows = window.DemoSkillData && Array.isArray(window.DemoSkillData.publicSkillRuntimeRows)
      ? window.DemoSkillData.publicSkillRuntimeRows
      : null;
    return rows || skillDeepClone(SKILL_SEED_PUBLIC);
  }

  function newTemplateDimensionId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  function normalizeTemplateDimensionValues(values) {
    return (Array.isArray(values) ? values : [])
      .map((item, index) => {
        const label = String((item && item.label) || '').trim();
        const id = String((item && item.id) || '').trim() || newTemplateDimensionId('val');
        return {
          id,
          label: label || ('维度值 ' + (index + 1)),
          enabled: !(item && item.enabled === false),
        };
      })
      .filter((item) => item.label);
  }

  function normalizeTemplateSkillDimensions(rawDims) {
    const dims = rawDims || {};
    const sourceCategories = Array.isArray(dims.categories) && dims.categories.length
      ? dims.categories
      : [
        {
          id: 'auditScene',
          label: '业务场景',
          description: '用于按业务场景筛选技能。',
          values: Array.isArray(dims.auditScenes) ? dims.auditScenes : [],
        },
        {
          id: 'skillType',
          label: '技能类型',
          description: '用于区分资料核查、疑点分析、结果整理等技能类型。',
          values: Array.isArray(dims.skillTypes) ? dims.skillTypes : [],
        },
      ];
    const categories = sourceCategories
      .map((item, index) => {
        const id = String((item && item.id) || '').trim() || newTemplateDimensionId('dim');
        const label = String((item && item.label) || '').trim() || ('分类维度 ' + (index + 1));
        const values = normalizeTemplateDimensionValues(item && item.values);
        return {
          id,
          label,
          description: String((item && item.description) || '').trim(),
          values,
        };
      })
      .filter((item) => item.label);
    const auditScene = categories.find((item) => item.id === 'auditScene');
    const skillType = categories.find((item) => item.id === 'skillType');
    return {
      categories,
      auditScenes: auditScene ? auditScene.values.map((x) => ({ ...x })) : [],
      skillTypes: skillType ? skillType.values.map((x) => ({ ...x })) : [],
    };
  }

  function getTemplateSkillDimensions() {
    const dims = (window.DemoSkillData && window.DemoSkillData.skillDimensions) || {};
    return normalizeTemplateSkillDimensions(dims);
  }

  function getTemplateDimensionLabel(kind, value) {
    const dims = getTemplateSkillDimensions();
    const categoryId = kind === 'skillType' ? 'skillType' : (kind === 'auditScene' ? 'auditScene' : String(kind || ''));
    const category = (dims.categories || []).find((item) => String(item.id) === categoryId);
    const rows = category ? category.values : (kind === 'skillType' ? dims.skillTypes : dims.auditScenes);
    const hit = rows.find((item) => String(item.id) === String(value));
    return hit ? hit.label : (value ? String(value) : '未分类');
  }

  function getTemplateEnabledDimensionOptions(kind) {
    const dims = getTemplateSkillDimensions();
    const categoryId = kind === 'skillType' ? 'skillType' : (kind === 'auditScene' ? 'auditScene' : String(kind || ''));
    const category = (dims.categories || []).find((item) => String(item.id) === categoryId);
    const rows = category ? category.values : (kind === 'skillType' ? dims.skillTypes : dims.auditScenes);
    return rows.filter((item) => item && item.enabled !== false);
  }

  function templateSkillSourceId(row) {
    return String((row && (row.sourceSkillId || row.id)) || '').trim();
  }

  function templateNow() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  function openTemplatePageConfirm(opts) {
    const options = opts || {};
    if (!Modal || typeof Modal.confirm !== 'function') {
      if (typeof options.onOk === 'function') return options.onOk();
      return;
    }
    return Modal.confirm({
      wrapClassName: options.wrapClassName || TEMPLATE_CONFIRM_WRAP_CLASS,
      title: options.title || '',
      content: options.content || '',
      okText: options.okText || '确定',
      cancelText: options.cancelText || '取消',
      centered: true,
      icon: null,
      okButtonProps: options.okButtonProps,
      onOk: options.onOk,
      onCancel: options.onCancel,
    });
  }

  function getTemplateWorkbenchOptions() {
    const byId = new Map();
    TEMPLATE_PROJECT_FALLBACKS.forEach((row) => byId.set(row.id, { ...row }));
    try {
      const saved = JSON.parse(sessionStorage.getItem('workbenchV2ProjectOptions') || '[]');
      (Array.isArray(saved) ? saved : []).forEach((row) => {
        const id = String((row && row.id) || '').trim();
        if (!id) return;
        byId.set(id, {
          id,
          name: String(row.name || '').trim() || ('工作台 ' + id),
          description: String(row.description || row.summary || '').trim(),
        });
      });
    } catch (_) { /* noop */ }
    try {
      const pending = JSON.parse(sessionStorage.getItem('pendingNewProject') || 'null');
      if (pending && pending.id) {
        const id = String(pending.id);
        byId.set(id, {
          id,
          name: String(pending.name || '').trim() || ('工作台 ' + id),
          description: String(pending.description || pending.summary || '').trim(),
        });
      }
    } catch (_) { /* noop */ }
    const projectMap = typeof demoProjectAnalysisTemplatesById !== 'undefined' ? demoProjectAnalysisTemplatesById : {};
    Object.keys(projectMap || {}).forEach((id) => {
      if (!byId.has(id)) byId.set(id, { id, name: '工作台 ' + id, description: '' });
    });
    return Array.from(byId.values());
  }

  function buildTemplateSkillForWorkbench(row, tab) {
    if (!row) return null;
    const now = templateNow();
    const sourceId = templateSkillSourceId(row);
    let next = null;
    if (typeof demoSeedToAnalysisTemplateShape === 'function') {
      next = demoSeedToAnalysisTemplateShape(row, row.library || 'public');
    } else {
      next = skillDeepClone(row);
    }
    next.id = 'sk-prj-add-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    next.library = row.library || 'public';
    next.sourceSkillId = sourceId || row.id;
    next.sourceLibrary = tab === TEMPLATE_SKILL_LIBRARY.MARKET ? 'market' : 'shared';
    next.sourceKind = tab === TEMPLATE_SKILL_LIBRARY.MARKET ? 'market' : 'shared';
    next.sourceLabel = tab === TEMPLATE_SKILL_LIBRARY.MARKET ? '技能市场' : '公共技能';
    next.sourceSkillName = row.name || next.name || '';
    next.sourceVersionLabel = tab === TEMPLATE_SKILL_LIBRARY.MARKET ? '技能市场' : '公共技能';
    next.createdAt = now;
    next.updatedAt = now;
    if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
      DemoSkillFileTree.syncExtractionRulesFromSkillFiles(next);
    }
    return next;
  }

    app.component('TemplateCenterView', {
      template: `
        <a-layout class="shell-main">
          <div class="app-main template-center-shell">
            <TemplateListPanel :host="templateListHost" />

            <a-modal
              v-model:open="skillCreateBasicModalOpen"
              :title="skillCreateBasicModalTitle"
              width="640"
              wrapClassName="modal-w-640"
              centered
              :maskClosable="false"
              @cancel="closeSkillCreateBasicModal"
            >
              <a-form layout="vertical" class="skill-modal-form skill-wizard-panel">
                <a-form-item label="技能名称" required>
                  <a-input
                    v-model:value="skillCreateBasicForm.name"
                    placeholder="请输入技能名称"
                    allow-clear
                    :maxlength="60"
                  />
                </a-form-item>
                <a-form-item label="技能描述">
                  <a-textarea
                    v-model:value="skillCreateBasicForm.description"
                    placeholder="选填。描述该技能的用途与适用场景"
                    :rows="3"
                    :maxlength="300"
                    show-count
                  />
                </a-form-item>
                <a-form-item :label="auditSceneCategoryLabel" required>
                  <a-select
                    v-model:value="skillCreateBasicForm.auditScene"
                    :placeholder="'请选择' + auditSceneCategoryLabel"
                    style="width: 100%"
                  >
                    <a-select-option v-for="item in auditSceneDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item :label="skillTypeCategoryLabel" required>
                  <a-select
                    v-model:value="skillCreateBasicForm.skillType"
                    :placeholder="'请选择' + skillTypeCategoryLabel"
                    style="width: 100%"
                  >
                    <a-select-option v-for="item in skillTypeDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="输入">
                  <a-select
                    v-model:value="skillCreateBasicForm.skillInputs"
                    mode="tags"
                    placeholder="回车添加输入项，如：预算批复文件、付款台账"
                    style="width: 100%"
                  />
                </a-form-item>
                <a-form-item label="输出" style="margin-bottom: 0;">
                  <a-input
                    v-model:value="skillCreateBasicForm.outputSummary"
                    placeholder="一句话描述技能输出，如：输出异常清单与核查建议"
                    allow-clear
                    :maxlength="120"
                  />
                </a-form-item>
              </a-form>
              <template #footer>
                <a-button @click="closeSkillCreateBasicModal">取消</a-button>
                <a-button type="primary" :loading="skillCreateBasicSubmitting" @click="submitSkillCreateBasic">{{ skillCreateBasicSubmitLabel }}</a-button>
              </template>
            </a-modal>

            <a-modal
              v-model:open="skillCategoryModalOpen"
              title="分类设置"
              width="820"
              wrapClassName="modal-w-820"
              centered
              :maskClosable="false"
              @cancel="closeSkillCategoryModal"
            >
              <div class="template-category-admin">
                <aside class="template-category-admin__nav" aria-label="分类类型目录">
                  <button
                    v-for="category in skillCategoryDraft.categories"
                    :key="category.id"
                    type="button"
                    :class="['template-category-admin__nav-item', { 'is-active': activeSkillCategoryDraftId === category.id }]"
                    @click="selectSkillCategoryDimension(category.id)"
                  >
                    <span class="template-category-admin__nav-name">{{ category.label || '未命名分类' }}</span>
                  </button>
                </aside>
                <section v-if="activeSkillCategoryDraft" class="template-category-admin__panel">
                  <div class="template-category-admin__field">
                    <div class="template-category-admin__field-label">类型名称</div>
                    <a-input
                      v-model:value="activeSkillCategoryDraft.label"
                      placeholder="类型名称"
                      :maxlength="24"
                    />
                  </div>
                  <div class="template-category-admin__values-head">
                    <div>
                      <div class="template-category-admin__field-label">类型值</div>
                    </div>
                    <div class="template-category-admin__values-actions">
                      <button type="button" class="template-category-admin__add-value" @click="addSkillCategoryValue(activeSkillCategoryDraft)">
                        <ds-icon name="plus" aria-hidden="true" /> 添加
                      </button>
                    </div>
                  </div>
                  <a-list
                    class="template-category-admin__rows"
                    :data-source="activeSkillCategoryDraft.values"
                    :row-key="(item) => item.id"
                  >
                    <template #renderItem="{ item }">
                      <a-list-item
                        :class="['template-category-admin__row', { 'is-dragging': skillCategoryValueDraggingId === item.id }]"
                        draggable="true"
                        @dragstart="onSkillCategoryValueDragStart(activeSkillCategoryDraft, item.id, $event)"
                        @dragover.prevent
                        @drop.prevent="onSkillCategoryValueDrop(activeSkillCategoryDraft, item.id)"
                        @dragend="onSkillCategoryValueDragEnd"
                      >
                        <span class="template-category-admin__drag" aria-hidden="true">⋮⋮</span>
                        <a-input
                          v-model:value="item.label"
                          class="template-category-admin__value-input"
                          placeholder="类型值名称"
                          :maxlength="24"
                        />
                        <a-button
                          type="text"
                          danger
                          size="small"
                          class="template-category-admin__row-remove"
                          title="删除类型值"
                          aria-label="删除类型值"
                          :disabled="activeSkillCategoryDraft.values.length <= 1"
                          @click.prevent="removeSkillCategoryValue(activeSkillCategoryDraft, item.id)"
                        ><ds-icon name="trash" aria-hidden="true" /></a-button>
                      </a-list-item>
                    </template>
                  </a-list>
                </section>
              </div>
              <template #footer>
                <a-button @click="closeSkillCategoryModal">取消</a-button>
                <a-button type="primary" :disabled="!skillCategoryDraftDirty" @click="submitSkillCategorySettings">保存</a-button>
              </template>
            </a-modal>

            <a-modal
              v-model:open="skillClassifyModalOpen"
              title="归类技能"
              width="560"
              wrapClassName="modal-w-560"
              centered
              :maskClosable="false"
              @cancel="closeSkillClassifyModal"
            >
              <a-form layout="vertical" v-if="skillClassifyTarget">
                <a-form-item label="技能名称">
                  <a-input :value="skillClassifyTarget.name" disabled />
                </a-form-item>
                <a-form-item
                  v-for="category in skillEnabledCategoryRows"
                  :key="'classify-' + category.id"
                  :label="category.label"
                  required
                >
                  <a-select
                    v-model:value="skillClassifyForm.dimensionValues[category.id]"
                    :placeholder="'请选择' + category.label"
                    style="width: 100%"
                  >
                    <a-select-option v-for="item in getSkillDimensionOptions(category.id)" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-form>
              <template #footer>
                <a-button @click="closeSkillClassifyModal">取消</a-button>
                <a-button type="primary" @click="submitSkillClassify">保存</a-button>
              </template>
            </a-modal>

            <a-modal
              v-model:open="skillBasicModalOpen"
              :title="skillBasicModalTitleText"
              width="640"
              wrapClassName="modal-w-640"
              centered
              :maskClosable="false"
              @cancel="onSkillBasicModalCancel"
            >
              <div v-if="selectedSkill">
                <a-form layout="vertical" class="skill-modal-form skill-wizard-panel">
                  <a-form-item label="技能名称" required>
                    <a-input
                      v-model:value="skillForm.name"
                      placeholder="简短清晰的名称，便于在技能列表中识别"
                      allow-clear
                      :disabled="skillBasicFormLocked"
                    />
                  </a-form-item>
                  <a-form-item label="技能描述">
                    <a-textarea
                      v-model:value="skillForm.description"
                      placeholder="选填。说明该技能做什么、适合处理哪类输入或任务，方便自己与他人理解用途。"
                      :rows="3"
                      :disabled="skillBasicFormLocked"
                    />
                  </a-form-item>
                  <a-form-item :label="auditSceneCategoryLabel">
                    <a-select
                      v-model:value="skillForm.auditScene"
                      :placeholder="'请选择' + auditSceneCategoryLabel"
                      style="width: 100%"
                      :disabled="skillBasicFormLocked"
                    >
                      <a-select-option v-for="item in auditSceneDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item :label="skillTypeCategoryLabel">
                    <a-select
                      v-model:value="skillForm.skillType"
                      :placeholder="'请选择' + skillTypeCategoryLabel"
                      style="width: 100%"
                      :disabled="skillBasicFormLocked"
                    >
                      <a-select-option v-for="item in skillTypeDimensionOptions" :key="item.id" :value="item.id">{{ item.label }}</a-select-option>
                    </a-select>
                  </a-form-item>
                  <a-form-item label="输入">
                    <a-select
                      v-model:value="skillForm.skillInputs"
                      mode="tags"
                      placeholder="回车添加输入项，如：预算批复文件、付款台账"
                      style="width: 100%"
                      :disabled="skillBasicFormLocked"
                    />
                  </a-form-item>
                  <a-form-item label="输出" style="margin-bottom: 0;">
                    <a-input
                      v-model:value="skillForm.outputSummary"
                      placeholder="一句话描述技能输出，如：输出异常清单与核查建议"
                      allow-clear
                      :maxlength="120"
                      :disabled="skillBasicFormLocked"
                    />
                  </a-form-item>
                </a-form>
              </div>
              <div v-else style="padding: var(--ds-space-m) 0;">
                <a-empty description="未找到技能，请关闭后重试。" />
              </div>
              <template #footer>
                <a-button @click="onSkillBasicModalCancel">取消</a-button>
                <a-button
                  v-if="!skillBasicFormLocked"
                  :type="skillBasicPaneDirty ? 'primary' : 'default'"
                  :disabled="!skillBasicPaneDirty"
                  @click="saveSkillBasicPane"
                >保存</a-button>
              </template>
            </a-modal>

            <a-modal
              v-model:open="skillConfigModalOpen"
              width="1040"
              wrapClassName="modal-skill-config"
              centered
              :footer="selectedSkill && selectedSkill.library === 'private' ? null : undefined"
              :maskClosable="false"
              @cancel="() => closeSkillConfigModal(false)"
            >
              <template #title>
                <div class="skill-modal-config-title-row">
                  <div class="skill-modal-config-title-main">
                    <span class="skill-modal-config-title-text">{{ skillConfigModalTitleText }}</span>
                  </div>
                </div>
              </template>
              <div v-if="selectedSkill" class="tc-skill-modal-body tc-skill-modal-body--unified">
                <a-tabs
                  v-if="selectedSkill.library === 'private'"
                  :activeKey="skillDetailActiveTab"
                  class="skill-unified-modal-tabs"
                  tab-position="left"
                  @update:activeKey="onSkillConfigTabUpdate"
                >
                  <a-tab-pane key="config" tab="技能配置">
                    <div class="ds-unified-tab-pane-stack">
                      <div
                        v-if="!skillConfigFieldsLocked"
                        class="ds-unified-tab-pane-chrome"
                        role="toolbar"
                        aria-label="技能配置操作"
                      >
                        <div class="ds-unified-tab-pane-chrome__actions skill-modal-tab-chrome-actions">
                          <a-button type="default" @click="onSkillConfigSaveMenuClick({ key: 'publish-new' })">快照</a-button>
                          <a-button
                            :type="skillConfigPaneDirty ? 'primary' : 'default'"
                            :disabled="!skillConfigPaneDirty"
                            @click="saveSkillConfigPane"
                          >保存</a-button>
                        </div>
                      </div>
                      <SkillConfigEditor
                        :skill="selectedSkill"
                        v-model:nav-key="skillConfigNavKey"
                        v-model:expanded-keys="skillConfigTreeExpandedKeys"
                        :locked="skillConfigWorkLocked"
                        :polish-key="templateAiPolishKey"
                        :polish-undo="templatePolishUndo"
                        polish-prefix="skill"
                        :analysis-placeholder="getSkillAnalysisRulePlaceholder()"
                        @change="scheduleSkillConfigSync"
                        @polish-rule="demoAiPolishSkillAnalysisRule"
                        @undo-rule="undoTemplateSkillAnalysisRule"
                        @polish-file-field="demoAiPolishSkillFileField"
                        @undo-file-field="undoTemplateSkillFileField"
                      />
                    </div>
                  </a-tab-pane>
                  <a-tab-pane key="version" tab="历史版本">
                    <div class="skill-unified-tab-version-root">
                      <div class="ds-unified-tab-pane-chrome ds-unified-tab-pane-chrome--version-row" role="toolbar" aria-label="版本管理">
                        <h3 class="ds-unified-tab-pane-chrome__title">历史版本</h3>
                        <div class="ds-unified-tab-pane-chrome__actions skill-modal-tab-chrome-actions"></div>
                      </div>
                      <div class="skill-unified-tab-version-root__main skill-wizard-panel">
                        <template v-if="skillLibraryVersionMgmtHistory.length">
                          <SkillLibraryVersionHistoryTable
                            :columns="skillLibraryVersionMgmtColumns"
                            :history="skillLibraryVersionMgmtHistory"
                            :fields-locked="skillConfigFieldsLocked"
                            @open-version="openLibrarySkillVersionHistoryModal"
                            @restore-version="restoreLibrarySkillVersion"
                          />
                        </template>
                        <a-empty v-else description="暂无历史版本。" />
                      </div>
                    </div>
                  </a-tab-pane>
                </a-tabs>
                <div v-else class="ds-unified-tab-pane-stack">
                  <SkillConfigEditor
                    :skill="selectedSkill"
                    v-model:nav-key="skillConfigNavKey"
                    v-model:expanded-keys="skillConfigTreeExpandedKeys"
                    :locked="skillConfigWorkLocked"
                    :polish-key="templateAiPolishKey"
                    :polish-undo="templatePolishUndo"
                    polish-prefix="skill"
                    :analysis-placeholder="getSkillAnalysisRulePlaceholder()"
                    @change="scheduleSkillConfigSync"
                    @polish-rule="demoAiPolishSkillAnalysisRule"
                    @undo-rule="undoTemplateSkillAnalysisRule"
                    @polish-file-field="demoAiPolishSkillFileField"
                    @undo-file-field="undoTemplateSkillFileField"
                  />
                </div>
              </div>
              <div v-else style="padding: var(--ds-space-m) 0;">
                <a-empty description="未找到技能，请关闭后重试。" />
              </div>
              <template #footer>
                <template v-if="selectedSkill && selectedSkill.library !== 'private'">
                  <a-button @click="closeSkillConfigModal(false)">{{ skillConfigFieldsLocked ? '关闭' : '取消' }}</a-button>
                  <a-button
                    v-if="!skillConfigFieldsLocked"
                    :type="skillConfigPaneDirty ? 'primary' : 'default'"
                    :disabled="!skillConfigPaneDirty"
                    @click="saveSkillConfigPane"
                  >保存</a-button>
                </template>
              </template>
            </a-modal>
            <a-modal
              v-model:open="skillMarketPublishModalOpen"
              title="发布技能到市场"
              width="640"
              wrapClassName="modal-skill-market-publish"
              centered
              :maskClosable="false"
              @cancel="closeSkillMarketPublishModal"
            >
              <div v-if="skillMarketPublishSkill" class="template-skill-publish-confirm">
                <p class="template-skill-publish-confirm__lead">确定要将以下技能提交到技能市场进行发布申请吗？</p>
                <div class="template-skill-publish-confirm__table" role="table" aria-label="技能发布信息">
                  <div class="template-skill-publish-confirm__row" role="row">
                    <div class="template-skill-publish-confirm__label" role="cell">技能名称</div>
                    <div class="template-skill-publish-confirm__value" role="cell">{{ skillMarketPublishSkill.name || '—' }}</div>
                  </div>
                  <div class="template-skill-publish-confirm__row" role="row">
                    <div class="template-skill-publish-confirm__label" role="cell">标签</div>
                    <div class="template-skill-publish-confirm__value" role="cell">{{ skillMarketPublishTagsText }}</div>
                  </div>
                </div>
                <div class="template-skill-publish-confirm__notice" role="note" aria-label="发布提示">
                  <div class="template-skill-publish-confirm__notice-icon" aria-hidden="true">
                    <ds-icon name="circle-info" />
                  </div>
                  <div class="template-skill-publish-confirm__notice-text">提交后需等待远程技能市场管理员审核，审核结果将在申请列表中查看。</div>
                </div>
              </div>
              <template #footer>
                <a-button @click="closeSkillMarketPublishModal">取消</a-button>
                <a-button type="primary" :loading="skillMarketPublishSubmitting" @click="submitSkillMarketPublish">提交申请</a-button>
              </template>
            </a-modal>
            <a-modal
              v-model:open="skillPublishVersionModalOpen"
              title="创建版本"
              wrapClassName="modal-w-520"
              centered
              width="520"
              :maskClosable="false"
              @cancel="closePublishLibrarySkillVersionModal"
            >
              <a-form layout="vertical">
                <a-form-item label="版本号" required>
                  <a-input
                    v-model:value="skillPublishVersionForm.versionLabel"
                    placeholder="如 v3.0、v2.1-beta"
                    allow-clear
                    :maxlength="32"
                  />
                </a-form-item>
                <a-form-item label="版本说明" required>
                  <a-textarea
                    v-model:value="skillPublishVersionForm.versionNote"
                    placeholder="简要说明本版相对上一版的变更或发布原因，便于日后检索。"
                    :rows="3"
                    :maxlength="500"
                    show-count
                  />
                </a-form-item>
              </a-form>
              <template #footer>
                <a-button @click="closePublishLibrarySkillVersionModal">取消</a-button>
                <a-button type="primary" :loading="skillPublishVersionSubmitting" @click="submitPublishLibrarySkillVersion">发布</a-button>
              </template>
            </a-modal>
            <a-modal
              v-model:open="skillVersionHistoryModalOpen"
              wrapClassName="modal-skill-config"
              :title="skillVersionHistoryModalTitle"
              width="1040"
              :footer="null"
              :maskClosable="true"
              :body-style="skillVersionHistoryModalBodyStyle"
              @cancel="closeLibrarySkillVersionHistoryModal"
              @afterClose="afterLibrarySkillVersionHistoryModalClose"
            >
              <TemplateVersionSnapshotBody
                v-if="skillVersionHistoryRecord"
                :skill="skillVersionHistorySnapshot"
                v-model:nav-key="skillVersionHistoryNavKey"
                v-model:expanded-keys="skillVersionHistoryTreeExpandedKeys"
              />
            </a-modal>
          </div>
        </a-layout>
      `,
      data() {
        return {
          skillLibraryTab: TEMPLATE_SKILL_LIBRARY.SHARED,
          publicSkills: getTemplateRuntimePublicSkills(),
          privateSkills: skillDeepClone(SKILL_SEED_PRIVATE),
          skillSearchKeyword: '',
          skillFilterTagKeys: [],
          skillFilterTagMatchMode: 'any',
          skillDimensionFilterValues: {},
          skillSortBy: DEFAULT_TEMPLATE_SORT,
          skillTagSearchQuery: '',
          skillFilterPopoverOpen: false,
          skillDetailActiveTab: 'config',
          skillBasicModalOpen: false,
          skillBasicModalReadOnly: false,
          skillConfigModalIsCreate: false,
          skillConfigModalOpen: false,
          skillConfigModalReadOnly: false,
          skillConfigTemplateId: '',
          _skillModalSnapshot: null,
          /** 技能配置 Tab：左侧树选中项 — 'rule' 或分析对象 id */
          skillConfigNavKey: 'rule',
          /** 技能配置侧栏 a-tree：默认展开「分析对象」分组 */
          skillConfigTreeExpandedKeys: [],
          templateAiPolishKey: '',
          templatePolishUndo: {},
          skillMarketPublishModalOpen: false,
          skillMarketPublishSkill: null,
          skillMarketPublishSubmitting: false,
          skillPublishVersionModalOpen: false,
          skillPublishVersionSubmitting: false,
          skillPublishVersionForm: { versionLabel: '', versionNote: '' },
          skillVersionHistoryModalOpen: false,
          skillVersionHistoryRecord: null,
          /** 历史版本弹窗 · 与技能配置 Tab 同源：左侧树选中 key */
          skillVersionHistoryNavKey: 'rule',
          skillVersionHistoryTreeExpandedKeys: [],
          skillCreateBasicModalOpen: false,
          skillCreateBasicSubmitting: false,
          skillCreateBasicForm: { name: '', description: '', skillType: '', auditScene: '', skillInputs: [], outputSummary: '' },
          skillDimensionSettings: getTemplateSkillDimensions(),
          skillCategoryModalOpen: false,
          skillCategoryDraft: getTemplateSkillDimensions(),
          activeSkillCategoryDraftId: '',
          skillCategoryValueDraggingId: '',
          skillClassifyModalOpen: false,
          skillClassifyTarget: null,
          skillClassifyForm: { dimensionValues: {} },
          skillMarketSyncing: false,
          skillForm: {
            id: '',
            name: '',
            description: '',
            skillType: '',
            auditScene: '',
            skillInputs: [],
            outputSummary: '',
          },
          _skillBasicPaneSnap: null,
          _skillConfigPaneSnap: null,
          _skillModalCreateCommitted: false,
          _skillCreateAwaitingBasic: false,
        };
      },
      computed: {
        templateListHost() { return this; },
        currentSkillList() {
          const tab = normalizeTemplateSkillTab(this.skillLibraryTab);
          const publicRows = this.publicSkills || [];
          if (tab === TEMPLATE_SKILL_LIBRARY.MARKET) return publicRows.filter((row) => isTemplateMarketSkill(row));
          return publicRows.filter((row) => !isTemplateMarketSkill(row));
        },
        skillAuditSceneOptions() {
          const rows = (this.skillDimensionSettings && this.skillDimensionSettings.auditScenes) || [];
          return rows.filter((item) => item && item.enabled !== false);
        },
        skillTypeDimensionOptions() {
          return this.getSkillDimensionOptions('skillType');
        },
        auditSceneDimensionOptions() {
          return this.getSkillDimensionOptions('auditScene');
        },
        skillTypeCategoryLabel() {
          const cat = (this.skillCategoryRows || []).find((item) => String(item.id) === 'skillType');
          return cat && cat.label ? String(cat.label) : '技能类型';
        },
        auditSceneCategoryLabel() {
          const cat = (this.skillCategoryRows || []).find((item) => String(item.id) === 'auditScene');
          return cat && cat.label ? String(cat.label) : '业务场景';
        },
        skillCategoryRows() {
          return (this.skillDimensionSettings && this.skillDimensionSettings.categories) || [];
        },
        skillEnabledCategoryRows() {
          return this.skillCategoryRows.filter((category) => category && (category.values || []).some((item) => item && item.enabled !== false));
        },
        skillCategoryDraftDirty() {
          return JSON.stringify(normalizeTemplateSkillDimensions(this.skillCategoryDraft || {})) !== JSON.stringify(normalizeTemplateSkillDimensions(this.skillDimensionSettings || {}));
        },
        activeSkillCategoryDraft() {
          const rows = (this.skillCategoryDraft && this.skillCategoryDraft.categories) || [];
          return rows.find((item) => String(item.id) === String(this.activeSkillCategoryDraftId)) || rows[0] || null;
        },
        selectedSkill() {
          if (!this.skillConfigTemplateId) return null;
          const id = this.skillConfigTemplateId;
          const list = this.currentSkillList || [];
          const hit = list.find((x) => x.id === id);
          if (hit) return hit;
          return (this.privateSkills || []).find((x) => x.id === id) || null;
        },
        skillLibraryVersionMgmtColumns() {
          return [
            { title: '版本号', dataIndex: 'versionLabel', key: 'versionLabel', width: 88 },
            {
              title: '版本描述',
              dataIndex: 'versionNote',
              key: 'versionNote',
              width: 360,
              minWidth: 260,
              className: 'skill-version-mgmt-col-desc',
            },
            { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 152 },
            /* 历史行仅「详情+回退」链接，收窄以免挤占描述列 */
            { title: '操作', key: 'action', width: 112, className: 'skill-version-mgmt-col-action' },
          ];
        },
        skillLibraryVersionMgmtSortedRows() {
          const s = this.selectedSkill;
          if (!s || !Array.isArray(s.publishedVersions)) return [];
          const list = s.publishedVersions.map((v, i) => {
            const rawNote = String(v.versionNote || '').trim();
            return {
              key: 'pv-src-' + i + '-' + String(v.versionLabel || ''),
              versionLabel: v.versionLabel,
              versionNote: rawNote || '—',
              versionNoteRaw: rawNote,
              createdAt: v.createdAt,
              snapshot: v.snapshot,
              publisherName: v.publisherName,
              publisherRole: v.publisherRole,
              versionStatus: v.versionStatus,
            };
          });
          list.sort((a, b) => {
            const c = String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
            if (c !== 0) return c;
            return String(b.versionLabel || '').localeCompare(String(a.versionLabel || ''));
          });
          return list.map((row, idx) => ({ ...row, key: 'pv-' + idx + '-' + String(row.versionLabel || '') }));
        },
        skillLibraryVersionMgmtLatest() {
          const rows = this.skillLibraryVersionMgmtSortedRows;
          return rows.length ? rows[0] : null;
        },
        skillLibraryVersionMgmtHistory() {
          const rows = this.skillLibraryVersionMgmtSortedRows;
          return rows.length > 1 ? rows.slice(1) : [];
        },
        skillVersionHistorySnapshot() {
          const r = this.skillVersionHistoryRecord;
          return r && r.snapshot ? r.snapshot : {};
        },
        skillVersionHistoryHeaderSkillName() {
          const s = this.selectedSkill;
          if (s && s.name) return s.name;
          const snap = this.skillVersionHistorySnapshot;
          return snap && snap.name ? String(snap.name) : '—';
        },
        /** 版本详情弹窗顶栏：技能名称 + 版本号（如「某技能 v1.0.6」） */
        skillVersionHistoryModalTitle() {
          const r = this.skillVersionHistoryRecord;
          if (!r) return '版本详情';
          const name = String(this.skillVersionHistoryHeaderSkillName || '').trim() || '—';
          const v = r.versionLabel ? String(r.versionLabel).trim() : '';
          if (v) return (name === '—' ? '未命名技能' : name) + ' ' + v;
          return name === '—' ? '版本详情' : name;
        },
        skillVersionHistoryModalBodyStyle() {
          return {
            padding: 'var(--ds-space-sm) var(--ds-space-m) var(--ds-space-m)',
            maxHeight: 'min(78vh, 760px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          };
        },
        skillVersionHistoryApplicableScenario() {
          return String(this.skillVersionHistorySnapshot.applicableScenario != null ? this.skillVersionHistorySnapshot.applicableScenario : '');
        },
        skillBasicModalTitleText() {
          if (this.skillBasicFormLocked) return '查看基本信息';
          return '编辑';
        },
        skillCreateBasicModalTitle() {
          return this._skillCreateAwaitingBasic ? '完善技能基本信息' : '创建技能';
        },
        skillCreateBasicSubmitLabel() {
          return this._skillCreateAwaitingBasic ? '完成' : '提交并继续配置';
        },
        skillConfigModalTitleText() {
          if (this.skillConfigModalIsCreate) return '新建技能';
          const s = this.selectedSkill;
          if (!s) return '技能详情';
          const n = String(s.name || '').trim();
          return n || '未命名技能';
        },
        /** 弹窗标题旁：取「已发布」时间序最新版本号 */
        skillConfigModalHeadVersionLabel() {
          if (this.skillConfigModalIsCreate || !this.selectedSkill) return '';
          const s = this.selectedSkill;
          const rows = this.skillLibraryVersionMgmtSortedRows;
          if (!rows.length) return '';
          return String(rows[0].versionLabel || '').trim();
        },
        isSelectedSkillReadOnly() {
          if (!this.selectedSkill) return false;
          return isTemplateMarketSkill(this.selectedSkill);
        },
        skillConfigFieldsLocked() {
          return this.isSelectedSkillReadOnly || this.skillConfigModalReadOnly;
        },
        skillBasicFormLocked() {
          return this.skillBasicModalReadOnly;
        },
        skillConfigWorkLocked() {
          return this.skillConfigFieldsLocked;
        },
        skillBasicPaneDirty() {
          if (this.skillBasicFormLocked) return false;
          return window.DemoSkillConfig.basicDirty(this.skillForm, this._skillBasicPaneSnap);
        },
        skillConfigPaneDirty() {
          if (this.skillConfigFieldsLocked) return false;
          return window.DemoSkillConfig.configDirty(this.selectedSkill, this._skillConfigPaneSnap);
        },
        /** 「资料类型」输入框占位（见 demo-runtime.js） */
        skillObjectMaterialTypePlaceholder() {
          return (typeof window !== 'undefined' && window.__DEMO_SKILL_OBJECT_MATERIAL_TYPE_PLACEHOLDER) || '请填写资料名称或类型';
        },
        filterTagStats() {
          const list = this.currentSkillList || [];
          const map = new Map();
          list.forEach((s) => {
            (s.tags || []).forEach((t) => {
              const tag = String(t).trim();
              if (!tag) return;
              map.set(tag, (map.get(tag) || 0) + 1);
            });
          });
          return Array.from(map.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
        },
        tagFilteredStats() {
          const q = (this.skillTagSearchQuery || '').trim().toLowerCase();
          const rows = this.filterTagStats;
          if (!q) return rows;
          return rows.filter((r) => r.tag.toLowerCase().includes(q));
        },
        skillSortOptions() {
          return [
            { value: 'updated_desc', label: '按更新时间' },
            { value: 'downloads_desc', label: '按下载次数' },
            { value: 'name_asc', label: '按名称' },
          ];
        },
        currentSkillSortLabel() {
          const list = this.skillSortOptions || [];
          const hit = list.find((opt) => String(opt.value) === String(this.skillSortBy || ''));
          return hit ? hit.label : '按更新时间';
        },
        currentSkillSortShortLabel() {
          const map = {
            updated_desc: '更新时间',
            downloads_desc: '下载次数',
            name_asc: '名称',
          };
          return map[String(this.skillSortBy || '')] || '更新时间';
        },
        isSkillSortSelectedByFilter() {
          return !!((this.skillFilterTagKeys || []).length);
        },
        isSkillFilterSelected() {
          const values = this.skillDimensionFilterValues || {};
          return !!((this.skillFilterTagKeys || []).length) || Object.keys(values).some((key) => String(values[key] || '').trim());
        },
        skillDimensionFilterRows() {
          return (this.skillEnabledCategoryRows || [])
            .map((category) => ({
              id: category.id,
              label: category.label,
              values: (category.values || []).filter((item) => item && item.enabled !== false),
            }))
            .filter((category) => category.values.length);
        },
        skillAuditSceneFilterCategory() {
          return (this.skillDimensionFilterRows || []).find((item) => String(item.id) === 'auditScene') || null;
        },
        skillAuditSceneFilterVisible() {
          return !!(this.skillAuditSceneFilterCategory && this.skillAuditSceneFilterCategory.values.length);
        },
        skillAuditSceneFilterOptions() {
          const category = this.skillAuditSceneFilterCategory;
          const base = [{ id: 'all', label: '全部' }];
          if (!category) return base;
          return base.concat((category.values || []).map((item) => ({ id: String(item.id), label: item.label })));
        },
        skillAuditSceneFilterKey() {
          const value = String(((this.skillDimensionFilterValues || {}).auditScene) || '').trim();
          return value || 'all';
        },
        skillAuditSceneFilterLabel() {
          if (this.skillAuditSceneFilterKey === 'all') return '全部';
          const hit = (this.skillAuditSceneFilterOptions || []).find((item) => String(item.id) === this.skillAuditSceneFilterKey);
          return hit ? hit.label : '全部';
        },
        skillAuditSceneFilterActive() {
          return this.skillAuditSceneFilterKey !== 'all';
        },
        skillTypeFilterCategory() {
          return (this.skillDimensionFilterRows || []).find((item) => String(item.id) === 'skillType') || null;
        },
        skillTypeFilterTabs() {
          const category = this.skillTypeFilterCategory;
          if (!category) return [];
          return [{ id: 'all', label: '全部类型' }].concat(
            (category.values || []).map((item) => ({ id: String(item.id), label: item.label }))
          );
        },
        skillTypeFilterTab() {
          const value = String(((this.skillDimensionFilterValues || {}).skillType) || '').trim();
          return value || 'all';
        },
        skillSortFilterActive() {
          return String(this.skillSortBy || '') !== String(DEFAULT_TEMPLATE_SORT);
        },
        filteredSkills() {
          const list = this.currentSkillList;
          const kw = (this.skillSearchKeyword || '').trim().toLowerCase();
          const tagKeys = this.skillFilterTagKeys || [];
          const modeAll = this.skillFilterTagMatchMode === 'all';
          const dimensionFilters = this.skillDimensionFilterValues || {};
          const activeDimensionFilters = (this.skillDimensionFilterRows || [])
            .map((category) => ({
              id: String(category.id),
              value: String(dimensionFilters[category.id] || '').trim(),
            }))
            .filter((item) => item.value);
          const filtered = list.filter((s) => {
            const matchKw =
              !kw ||
              (s.name && s.name.toLowerCase().includes(kw)) ||
              (s.description && s.description.toLowerCase().includes(kw));
            const stags = s.tags || [];
            const matchTag =
              tagKeys.length === 0 ||
              (modeAll ? tagKeys.every((t) => stags.includes(t)) : tagKeys.some((t) => stags.includes(t)));
            const matchDimension = activeDimensionFilters.every((filter) => {
              const saved = s.dimensionValues && s.dimensionValues[filter.id];
              let value = saved;
              if (!value && filter.id === 'auditScene') value = s.auditScene;
              if (!value && filter.id === 'skillType') value = s.skillType;
              return String(value || '') === filter.value;
            });
            return matchKw && matchTag && matchDimension;
          });
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const str = (v) => String(v || '').trim();
          const time = (v) => {
            const t = Date.parse(str(v));
            return Number.isNaN(t) ? 0 : t;
          };
          const byName = (a, b) => collator.compare(str(a.name), str(b.name));
          const usageCount = (s) => this.getSkillUsageCount(s);
          const sorted = [...filtered].sort((a, b) => {
            const key = this.skillSortBy;
            if (key === 'downloads_desc') return usageCount(b) - usageCount(a) || byName(a, b);
            if (key === 'name_asc') return byName(a, b);
            if (key === 'updated_desc') return time(b.updatedAt) - time(a.updatedAt) || byName(a, b);
            return time(b.updatedAt) - time(a.updatedAt) || byName(a, b);
          });
          return sorted;
        },
        skillEmptyDescription() {
          if (!this.currentSkillList.length) {
            return this.skillLibraryTab === TEMPLATE_SKILL_LIBRARY.MARKET ? '暂无技能市场内容。' : '暂无公共技能。';
          }
          return '没有符合筛选条件的技能，请调整搜索或标签。';
        },
        skillMarketPublishTagsText() {
          const skill = this.skillMarketPublishSkill;
          if (!skill) return '暂无';
          const tags = Array.isArray(skill.tags) ? skill.tags.map((t) => String(t || '').trim()).filter(Boolean) : [];
          if (tags.length) return tags.join('、');
          return '暂无';
        },
      },
      methods: {
        /** 「审计思路」占位：须用 method，避免 computed 读 window 在 Vue3 下缓存为空 */
        getSkillAnalysisRulePlaceholder() {
          if (typeof window !== 'undefined' && typeof window.__demoGetSkillAnalysisRulePlaceholder === 'function') {
            return window.__demoGetSkillAnalysisRulePlaceholder();
          }
          return (typeof window !== 'undefined' && window.__DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER) || '';
        },
        getSkillUsageCount(skill) {
          const id = String((skill && skill.id) || '');
          const preset = {
            'sk-pub-1': 1286,
            'sk-pub-2': 842,
            'sk-pub-3': 736,
            'sk-pub-4': 1286,
          };
          const raw = skill && skill.usageCount != null ? Number(skill.usageCount) : NaN;
          if (!Number.isNaN(raw)) return raw;
          return preset[id] || 328;
        },
        beginTemplateAiPolish(key, getText, setText, onDone) {
          if (this.templateAiPolishKey) return;
          this.templatePolishUndo[key] = String(getText() == null ? '' : getText());
          this.templateAiPolishKey = key;
          window.setTimeout(() => {
            const sample =
              typeof window.__demoPolishSampleForKey === 'function' ? window.__demoPolishSampleForKey(key) : '';
            setText(sample);
            this.templateAiPolishKey = '';
            if (typeof onDone === 'function') onDone();
          }, 1300);
        },
        undoTemplatePolish(key, setText, onDone) {
          if (this.templateAiPolishKey) return;
          if (!Object.prototype.hasOwnProperty.call(this.templatePolishUndo, key)) return;
          const prev = this.templatePolishUndo[key];
          delete this.templatePolishUndo[key];
          setText(prev);
          if (typeof onDone === 'function') onDone();
        },
        demoAiPolishSkillFileField(file, field) {
          if (this.skillConfigWorkLocked || !file) return;
          const short = field === 'filename' ? 'fn' : 'ct';
          const key = String(file.id) + ':' + short;
          this.beginTemplateAiPolish(
            key,
            () => (field === 'filename' ? file.filename : file.content),
            (t) => {
              if (field === 'filename') file.filename = t;
              else file.content = t;
            },
            () => this.scheduleSkillConfigSync()
          );
        },
        undoTemplateSkillFileField(file, field) {
          if (this.skillConfigWorkLocked || !file) return;
          const short = field === 'filename' ? 'fn' : 'ct';
          const key = String(file.id) + ':' + short;
          this.undoTemplatePolish(
            key,
            (t) => {
              if (field === 'filename') file.filename = t;
              else file.content = t;
            },
            () => this.scheduleSkillConfigSync()
          );
        },
        demoAiPolishSkillAnalysisRule() {
          if (this.skillConfigWorkLocked) return;
          const s = this.selectedSkill;
          if (!s) return;
          this.beginTemplateAiPolish(
            'skill-analysisRule',
            () => s.analysisRule,
            (t) => {
              s.analysisRule = t;
            },
            () => this.scheduleSkillConfigSync()
          );
        },
        undoTemplateSkillAnalysisRule() {
          if (this.skillConfigWorkLocked) return;
          const s = this.selectedSkill;
          if (!s) return;
          this.undoTemplatePolish(
            'skill-analysisRule',
            (t) => {
              s.analysisRule = t;
            },
            () => this.scheduleSkillConfigSync()
          );
        },
        skillModalCreator(s) {
          if (!s) return '—';
          if (s.createdBy) return s.createdBy;
          if (s.library === SKILL_LIBRARY.PUBLIC) return s.sharedBy || '系统';
          return '我';
        },
        skillModalCreatedDateYmd(s) {
          if (!s || s.createdAt == null || s.createdAt === '') return '—';
          const t = String(s.createdAt).trim();
          const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
          if (m) return m[1];
          return t.slice(0, 10) || '—';
        },
        skillModalUpdatedCompact(s) {
          if (!s) return '—';
          const raw = s.updatedAt != null && s.updatedAt !== '' ? s.updatedAt : s.createdAt;
          if (raw == null || raw === '') return '—';
          const t = String(raw).trim();
          const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
          if (m) return m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5];
          const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (m2) return m2[2] + '-' + m2[3];
          return t.slice(0, 16) || '—';
        },
        isPublicSkillMineShared(s) {
          if (!s || s.library !== SKILL_LIBRARY.PUBLIC) return false;
          if (String(s.sharedBy || '').trim() === '我') return true;
          if (s.sourcePrivateSkillId) {
            const priv = this.privateSkills.find((p) => String(p.id) === String(s.sourcePrivateSkillId));
            return !!(priv && priv.sharedPublicSkillId === s.id);
          }
          return false;
        },
        resolveCardSkillTarget(s, options) {
          const preferEdit = !(options && options.readOnly);
          if (!s) return { skill: null, readOnly: true };
          if (isTemplateMarketSkill(s)) {
            return { skill: s, readOnly: true };
          }
          if (s.library === SKILL_LIBRARY.PRIVATE) {
            return { skill: s, readOnly: !preferEdit };
          }
          if (preferEdit && this.isPublicSkillMineShared(s)) {
            const priv = this.resolvePrivateSkillForPublicMineShared(s);
            if (priv) return { skill: priv, readOnly: false };
          }
          if (s.library === SKILL_LIBRARY.PUBLIC) {
            return { skill: s, readOnly: !preferEdit };
          }
          return { skill: s, readOnly: true };
        },
        resolveSkillExportTarget(s) {
          if (!s) return s;
          if (s.library === SKILL_LIBRARY.PRIVATE) return s;
          if (this.isPublicSkillMineShared(s)) {
            const priv = this.resolvePrivateSkillForPublicMineShared(s);
            if (priv) return priv;
          }
          return s;
        },
        resolvePrivateSkillForPublicMineShared(s) {
          if (!s) return null;
          let priv = this.privateSkills.find((p) => p.sharedPublicSkillId === s.id);
          if (priv) return priv;
          if (s.sourcePrivateSkillId) {
            priv = this.privateSkills.find((p) => String(p.id) === String(s.sourcePrivateSkillId));
            if (priv && priv.sharedPublicSkillId === s.id) return priv;
          }
          return null;
        },
        openMySharedPublicSkillConfig(s) {
          const priv = this.resolvePrivateSkillForPublicMineShared(s);
          if (!priv) {
            message.warning('未找到对应技能条目');
            return;
          }
          this.openSkillBasicModal(priv, { readOnly: false });
        },
        unshareFromPublicMineSharedCard(s) {
          const priv = this.resolvePrivateSkillForPublicMineShared(s);
          if (!priv) {
            message.warning('未找到对应技能条目');
            return;
          }
          this.unsharePrivateSkillFromPublic(priv);
        },
        unshareSharedSkillCard(s) {
          if (!s) return;
          if (this.isPublicSkillMineShared(s)) {
            openTemplatePageConfirm({
              title: '取消公开？',
              content: '取消后，该技能将从公共技能中移除，你仍可继续维护当前条目。',
              okText: '取消公开',
              onOk: () => {
                this.unshareFromPublicMineSharedCard(s);
              },
            });
            return;
          }
          if (s.library !== SKILL_LIBRARY.PUBLIC) return;
          openTemplatePageConfirm({
            title: '取消公开？',
            content: '取消后，该技能将从公共技能列表中撤下。',
            okText: '取消公开',
            onOk: () => {
              const id = s.id;
              this.publicSkills = this.publicSkills.filter((row) => row.id !== id);
              if (id === this.skillConfigTemplateId) {
                this._skillModalSnapshot = null;
                this.closeSkillConfigModal(false);
                this.closeSkillBasicModal(false);
              }
              message.success('已取消公开');
            },
          });
        },
        isSkillAddedToWorkbench(skill, projectId) {
          if (!skill || !projectId || typeof demoProjectAnalysisTemplatesById === 'undefined') return false;
          const sourceId = templateSkillSourceId(skill);
          const rows = demoProjectAnalysisTemplatesById[String(projectId)] || [];
          return rows.some((row) => {
            const rowSourceId = templateSkillSourceId(row);
            return sourceId && rowSourceId === sourceId;
          });
        },
        openSkillCategoryModal() {
          this.skillCategoryDraft = skillDeepClone(this.skillDimensionSettings || getTemplateSkillDimensions());
          const rows = (this.skillCategoryDraft && this.skillCategoryDraft.categories) || [];
          this.activeSkillCategoryDraftId = rows[0] ? rows[0].id : '';
          this.skillCategoryModalOpen = true;
        },
        closeSkillCategoryModal() {
          this.skillCategoryModalOpen = false;
        },
        addSkillCategoryDimension() {
          const rows = (this.skillCategoryDraft && this.skillCategoryDraft.categories) || [];
          const next = {
            id: newTemplateDimensionId('dim'),
            label: '分类类型 ' + (rows.length + 1),
            description: '',
            values: [
              { id: newTemplateDimensionId('val'), label: '类型值 1', enabled: true },
            ],
            collapsed: false,
          };
          rows.push(next);
          this.skillCategoryDraft.categories = rows;
          this.activeSkillCategoryDraftId = next.id;
        },
        removeSkillCategoryDimension(categoryId) {
          const rows = (this.skillCategoryDraft && this.skillCategoryDraft.categories) || [];
          if (rows.length <= 1) return;
          const next = rows.filter((item) => String(item.id) !== String(categoryId));
          this.skillCategoryDraft.categories = next;
          if (String(this.activeSkillCategoryDraftId) === String(categoryId)) {
            this.activeSkillCategoryDraftId = next[0] ? next[0].id : '';
          }
        },
        addSkillCategoryValue(category) {
          if (!category) return;
          if (!Array.isArray(category.values)) category.values = [];
          category.values.push({
            id: newTemplateDimensionId('val'),
            label: '类型值 ' + (category.values.length + 1),
            enabled: true,
          });
        },
        removeSkillCategoryValue(category, valueId) {
          if (!category || !Array.isArray(category.values) || category.values.length <= 1) return;
          category.values = category.values.filter((item) => String(item.id) !== String(valueId));
        },
        selectSkillCategoryDimension(categoryId) {
          this.activeSkillCategoryDraftId = categoryId;
        },
        onSkillCategoryValueDragStart(category, valueId, event) {
          if (!category || !Array.isArray(category.values)) return;
          this.skillCategoryValueDraggingId = valueId;
          if (event && event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(valueId));
          }
        },
        onSkillCategoryValueDrop(category, targetValueId) {
          if (!category || !Array.isArray(category.values)) return;
          const sourceId = String(this.skillCategoryValueDraggingId || '');
          const targetId = String(targetValueId || '');
          if (!sourceId || !targetId || sourceId === targetId) return;
          const sourceIndex = category.values.findIndex((item) => String(item.id) === sourceId);
          const targetIndex = category.values.findIndex((item) => String(item.id) === targetId);
          if (sourceIndex < 0 || targetIndex < 0) return;
          const next = category.values.slice();
          const moved = next.splice(sourceIndex, 1)[0];
          next.splice(targetIndex, 0, moved);
          category.values = next;
        },
        onSkillCategoryValueDragEnd() {
          this.skillCategoryValueDraggingId = '';
        },
        normalizeSkillCategoryDraft() {
          const next = normalizeTemplateSkillDimensions(this.skillCategoryDraft || {});
          if (!next.categories.length) {
            message.warning('请至少保留一个分类维度');
            return null;
          }
          const categoryNames = new Set();
          for (const category of next.categories) {
            const name = String(category.label || '').trim();
            if (!name) {
              message.warning('请填写分类维度名称');
              return null;
            }
            if (categoryNames.has(name)) {
              message.warning('分类维度名称不能重复');
              return null;
            }
            categoryNames.add(name);
            const values = category.values || [];
            if (!values.length) {
              message.warning('每个分类维度至少需要一个维度值');
              return null;
            }
            const valueNames = new Set();
            for (const item of values) {
              const label = String(item.label || '').trim();
              if (!label) {
                message.warning('请填写维度值名称');
                return null;
              }
              if (valueNames.has(label)) {
                message.warning('同一分类维度下的维度值不能重复');
                return null;
              }
              valueNames.add(label);
            }
          }
          return next;
        },
        submitSkillCategorySettings() {
          const next = this.normalizeSkillCategoryDraft();
          if (!next) return;
          this.skillDimensionSettings = skillDeepClone(next);
          if (window.DemoSkillData) {
            window.DemoSkillData.skillDimensions = skillDeepClone(this.skillDimensionSettings);
            window.DemoSkillData.skillDimensionsRevision = (window.DemoSkillData.skillDimensionsRevision || 0) + 1;
          }
          const available = new Map();
          this.skillEnabledCategoryRows.forEach((category) => {
            available.set(String(category.id), new Set((category.values || []).map((item) => String(item.id))));
          });
          const filters = {};
          Object.entries(this.skillDimensionFilterValues || {}).forEach(([categoryId, valueId]) => {
            const set = available.get(String(categoryId));
            if (set && set.has(String(valueId))) filters[categoryId] = valueId;
          });
          this.skillDimensionFilterValues = filters;
          this.skillCategoryModalOpen = false;
          message.success('分类设置已保存');
        },
        getSkillDimensionOptions(categoryId) {
          const rows = (this.skillCategoryRows || []).find((item) => String(item.id) === String(categoryId));
          return rows && Array.isArray(rows.values) ? rows.values.filter((item) => item && item.enabled !== false) : [];
        },
        getSkillDimensionLabel(kind, value) {
          const categoryId = kind === 'skillType' ? 'skillType' : (kind === 'auditScene' ? 'auditScene' : String(kind || ''));
          const category = (this.skillCategoryRows || []).find((item) => String(item.id) === categoryId);
          const rows = category && Array.isArray(category.values)
            ? category.values
            : (kind === 'skillType'
              ? ((this.skillDimensionSettings && this.skillDimensionSettings.skillTypes) || [])
              : ((this.skillDimensionSettings && this.skillDimensionSettings.auditScenes) || []));
          const hit = rows.find((item) => String(item.id) === String(value));
          return hit ? hit.label : (value ? String(value) : '未分类');
        },
        buildSkillDimensionForm(skill) {
          const saved = skill && skill.dimensionValues && typeof skill.dimensionValues === 'object'
            ? skill.dimensionValues
            : {};
          const values = {};
          (this.skillCategoryRows || []).forEach((category) => {
            let value = saved[category.id];
            if (!value && category.id === 'auditScene') value = skill && skill.auditScene;
            if (!value && category.id === 'skillType') value = skill && skill.skillType;
            values[category.id] = String(value || '');
          });
          return { dimensionValues: values };
        },
        syncSkillDimensionValues(skill, values) {
          if (!skill) return;
          const next = {};
          (this.skillCategoryRows || []).forEach((category) => {
            const value = String((values && values[category.id]) || '').trim();
            if (!value) return;
            next[category.id] = value;
            if (category.id === 'auditScene') skill.auditScene = value;
            if (category.id === 'skillType') skill.skillType = value;
          });
          skill.dimensionValues = next;
        },
        getSkillDimensionLabels(skill) {
          if (!skill) return [];
          return (this.skillCategoryRows || [])
            .map((category) => {
              const saved = skill.dimensionValues && skill.dimensionValues[category.id];
              let value = saved;
              if (!value && category.id === 'auditScene') value = skill.auditScene;
              if (!value && category.id === 'skillType') value = skill.skillType;
              return value ? this.getSkillDimensionLabel(category.id, value) : '';
            })
            .filter(Boolean);
        },
        openSkillClassifyModal(skill) {
          if (!skill) return;
          this.skillClassifyTarget = skill;
          this.skillClassifyForm = this.buildSkillDimensionForm(skill);
          this.skillClassifyModalOpen = true;
        },
        closeSkillClassifyModal() {
          this.skillClassifyModalOpen = false;
          this.skillClassifyTarget = null;
          this.skillClassifyForm = { dimensionValues: {} };
        },
        submitSkillClassify() {
          const skill = this.skillClassifyTarget;
          if (!skill) return;
          const values = (this.skillClassifyForm && this.skillClassifyForm.dimensionValues) || {};
          const missing = (this.skillEnabledCategoryRows || []).find((category) => !String(values[category.id] || '').trim());
          if (missing) {
            message.warning('请选择' + missing.label);
            return;
          }
          this.syncSkillDimensionValues(skill, values);
          skill.updatedAt = templateNow();
          this.closeSkillClassifyModal();
          message.success('归类已更新');
        },
        isMarketSkillIntaked(skill) {
          if (!skill) return false;
          const sourceId = templateSkillSourceId(skill);
          return (this.publicSkills || []).some((row) =>
            !isTemplateMarketSkill(row) && String(row.sourceSkillId || '') === sourceId
          );
        },
        openSkillPublishVersionModalForCard(skill) {
          if (!skill) return;
          const resolved = this.resolveCardSkillTarget(skill, { readOnly: false });
          const target = resolved && resolved.skill;
          if (!target || isTemplateMarketSkill(target)) return;
          this.skillLibraryTab = TEMPLATE_SKILL_LIBRARY.SHARED;
          this.skillConfigTemplateId = target.id;
          this.skillConfigModalReadOnly = false;
          this.skillBasicModalReadOnly = false;
          this.ensureSkillPublishedVersions(target);
          const n = target.publishedVersions.length + 1;
          this.skillPublishVersionForm = {
            versionLabel: 'v' + n + '.0',
            versionNote: '',
          };
          this.skillPublishVersionSubmitting = false;
          this.skillPublishVersionModalOpen = true;
        },
        openSkillMarketPublishModalForCard(skill) {
          if (!skill) return;
          const resolved = this.resolveCardSkillTarget(skill, { readOnly: false });
          const target = resolved && resolved.skill;
          if (!target || isTemplateMarketSkill(target)) return;
          this.skillLibraryTab = TEMPLATE_SKILL_LIBRARY.SHARED;
          this.skillConfigTemplateId = target.id;
          this.skillConfigModalReadOnly = false;
          this.skillBasicModalReadOnly = false;
          this.skillMarketPublishSkill = target;
          this.skillMarketPublishSubmitting = false;
          this.skillMarketPublishModalOpen = true;
        },
        closeSkillMarketPublishModal() {
          this.skillMarketPublishModalOpen = false;
          this.skillMarketPublishSubmitting = false;
          this.skillMarketPublishSkill = null;
        },
        submitSkillMarketPublish() {
          if (this.skillMarketPublishSubmitting || !this.skillMarketPublishSkill) return;
          this.skillMarketPublishSubmitting = true;
          window.setTimeout(() => {
            message.success('已提交发布申请，请等待技能市场管理员审核');
            this.closeSkillMarketPublishModal();
          }, 400);
        },
        toggleSharedSkillStatus(skill) {
          if (!skill) return;
          skill.libraryStatus = skill.libraryStatus === 'disabled' ? 'enabled' : 'disabled';
          skill.updatedAt = templateNow();
          message.success(skill.libraryStatus === 'disabled' ? '已停用' : '已启用');
        },
        exportOneSkill(s) {
          if (!s) return;
          const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'template-' + String(s.name || 'export').replace(/[/\\\\?%*:|"<>]/g, '_') + '.json';
          a.click();
          URL.revokeObjectURL(a.href);
          message.success('已导出');
        },
        sharePrivateSkillToPublic(s) {
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
          if (s.sharedPublicSkillId) {
            message.info('该技能已在公共技能中');
            return;
          }
          if (!this.privateSkillPassesShareValidation(s)) {
            message.warning('请补全技能配置后再公开');
            return;
          }
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const copy = skillDeepClone(s);
          delete copy.sharedPublicSkillId;
          copy.id = newSkillId('sk');
          copy.library = SKILL_LIBRARY.PUBLIC;
          copy.createdAt = now;
          copy.updatedAt = now;
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.remapSkillFilesTree) {
            copy.skillFiles = DemoSkillFileTree.remapSkillFilesTree(copy.skillFiles || []);
          } else {
            copy.skillFiles = [];
          }
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            DemoSkillFileTree.syncExtractionRulesFromSkillFiles(copy);
          }
          delete copy.createdBy;
          copy.sharedBy = '我';
          copy.sourcePrivateSkillId = s.id;
          this.publicSkills.unshift(copy);
          this.privateSkills = this.privateSkills.map((row) =>
            row.id === s.id ? { ...row, sharedPublicSkillId: copy.id, updatedAt: now } : row
          );
          message.success('已公开到公共技能');
        },
        sharePrivateSkillToPublicSilent(s) {
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE || s.sharedPublicSkillId) return;
          if (!this.privateSkillPassesShareValidation(s)) return;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const copy = skillDeepClone(s);
          delete copy.sharedPublicSkillId;
          copy.id = newSkillId('sk');
          copy.library = SKILL_LIBRARY.PUBLIC;
          copy.createdAt = now;
          copy.updatedAt = now;
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.remapSkillFilesTree) {
            copy.skillFiles = DemoSkillFileTree.remapSkillFilesTree(copy.skillFiles || []);
          } else {
            copy.skillFiles = [];
          }
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            DemoSkillFileTree.syncExtractionRulesFromSkillFiles(copy);
          }
          delete copy.createdBy;
          copy.sharedBy = '我';
          copy.sourcePrivateSkillId = s.id;
          this.publicSkills.unshift(copy);
          this.privateSkills = this.privateSkills.map((row) =>
            row.id === s.id ? { ...row, sharedPublicSkillId: copy.id, updatedAt: now } : row
          );
        },
        unsharePrivateSkillFromPublic(s) {
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE || !s.sharedPublicSkillId) return;
          const pubId = s.sharedPublicSkillId;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          this.publicSkills = this.publicSkills.filter((p) => p.id !== pubId);
          this.privateSkills = this.privateSkills.map((row) => {
            if (row.id !== s.id) return row;
            const next = { ...row, updatedAt: now };
            delete next.sharedPublicSkillId;
            return next;
          });
          message.success('已取消公开');
        },
        togglePrivateSkillPublicShare(s) {
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
          if (s.sharedPublicSkillId) this.unsharePrivateSkillFromPublic(s);
          else this.sharePrivateSkillToPublic(s);
        },
        duplicateSkillInPrivate(s) {
          if (!s) return;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const copy = skillDeepClone(s);
          copy.id = newSkillId('sk');
          copy.library = SKILL_LIBRARY.PRIVATE;
          copy.name = (copy.name || '未命名') + '（副本）';
          copy.createdAt = now;
          copy.updatedAt = now;
          copy.createdBy = '我';
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.remapSkillFilesTree) {
            copy.skillFiles = DemoSkillFileTree.remapSkillFilesTree(copy.skillFiles || []);
          } else {
            copy.skillFiles = [];
          }
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            DemoSkillFileTree.syncExtractionRulesFromSkillFiles(copy);
          }
          delete copy.sharedBy;
          delete copy.sharedPublicSkillId;
          delete copy.sourceSkillId;
          delete copy.sourceLibrary;
          delete copy.sourceSkillName;
          delete copy.sourceVersionLabel;
          copy.publishedVersions = [];
          this.privateSkills.unshift(copy);
          message.success('已复制');
        },
        copySkillToPrivateFromPublic(s) {
          if (!s) return;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const copy = skillDeepClone(s);
          copy.id = newSkillId('sk');
          copy.library = SKILL_LIBRARY.PRIVATE;
          copy.name = (copy.name || '未命名') + '（副本）';
          copy.createdAt = now;
          copy.updatedAt = now;
          copy.createdBy = '我';
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.remapSkillFilesTree) {
            copy.skillFiles = DemoSkillFileTree.remapSkillFilesTree(copy.skillFiles || []);
          } else {
            copy.skillFiles = [];
          }
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            DemoSkillFileTree.syncExtractionRulesFromSkillFiles(copy);
          }
          delete copy.sharedBy;
          delete copy.sourcePrivateSkillId;
          delete copy.sharedPublicSkillId;
          copy.sourceSkillId = s.id;
          copy.sourceLibrary = 'public';
          copy.sourceSkillName = s.name || s.id;
          copy.sourceVersionLabel = '组织快照';
          if (!Array.isArray(copy.publishedVersions)) copy.publishedVersions = [];
          this.privateSkills.unshift(copy);
          message.success('已复制技能');
        },
        deleteSkill(s) {
          if (!s) return;
          if (s.library === SKILL_LIBRARY.PRIVATE) {
            if (s.sharedPublicSkillId) {
              this.publicSkills = this.publicSkills.filter((p) => p.id !== s.sharedPublicSkillId);
            }
            this.privateSkills = this.privateSkills.filter((x) => x.id !== s.id);
          } else if (s.library === SKILL_LIBRARY.PUBLIC) {
            this.publicSkills = this.publicSkills.filter((x) => x.id !== s.id);
          } else {
            return;
          }
          if (s.id === this.skillConfigTemplateId) {
            this._skillModalSnapshot = null;
            this.closeSkillBasicModal(false);
            this.closeSkillConfigModal(false);
          }
          message.success('已删除');
        },
        onTemplateCardMenu(info, s) {
          const key = info && info.key;
          if (key === 'export') {
            this.exportOneSkill(this.resolveSkillExportTarget(s));
            return;
          }
          if (key === 'publish') {
            this.openSkillMarketPublishModalForCard(s);
            return;
          }
          if (key === 'update') return;
          if (key === 'edit') {
            const target = this.resolveCardSkillTarget(s, { readOnly: true });
            if (!target.skill) return;
            this.openSkillBasicModal(target.skill, { readOnly: target.readOnly });
            return;
          }
          if (key === 'config') {
            const target = this.resolveCardSkillTarget(s, { readOnly: true });
            if (!target.skill) return;
            this.openSkillConfig(target.skill, { readOnly: target.readOnly });
            return;
          }
          if (key === 'share' || key === 'unpublish') {
            this.unshareSharedSkillCard(s);
            return;
          }
          if (key === 'copy') {
            if (this.skillLibraryTab === SKILL_LIBRARY.PUBLIC) this.copySkillToPrivateFromPublic(s);
            else this.duplicateSkillInPrivate(s);
            return;
          }
          if (key === 'unshare') {
            if (this.isPublicSkillMineShared(s)) {
              this.unshareFromPublicMineSharedCard(s);
              return;
            }
            if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
            this.unsharePrivateSkillFromPublic(s);
            return;
          }
          if (key === 'delete') {
            window.dsConfirm.pageDelete({
              subject: '该技能',
              onOk: () => {
                this.deleteSkill(s);
              },
            });
          }
        },
        toggleSkillFilterTag(tag) {
          const keys = this.skillFilterTagKeys || [];
          const i = keys.indexOf(tag);
          if (i >= 0) {
            this.skillFilterTagKeys = keys.filter((t) => t !== tag);
          } else {
            this.skillFilterTagKeys = [...keys, tag];
          }
        },
        clearSkillFilterTags() {
          this.skillFilterTagKeys = [];
        },
        clearSkillFiltersAndSearch() {
          this.skillSearchKeyword = '';
          this.skillFilterTagKeys = [];
          this.skillFilterTagMatchMode = 'any';
          this.skillDimensionFilterValues = {};
          this.skillFilterPopoverOpen = false;
          this.skillTagSearchQuery = '';
        },
        setSkillDimensionFilterValue(categoryId, valueId) {
          const key = String(categoryId || '');
          if (!key) return;
          const value = String(valueId || '').trim();
          const next = { ...(this.skillDimensionFilterValues || {}) };
          if (value) next[key] = value;
          else delete next[key];
          this.skillDimensionFilterValues = next;
        },
        setSkillLibraryTab(tab) {
          this.skillMarketSyncing = false;
          this.skillLibraryTab = normalizeTemplateSkillTab(tab);
        },
        syncSkillMarketFromRemote() {
          if (this.skillMarketSyncing) return;
          if (normalizeTemplateSkillTab(this.skillLibraryTab) !== TEMPLATE_SKILL_LIBRARY.MARKET) return;
          this.skillMarketSyncing = true;
          window.setTimeout(() => {
            this.skillMarketSyncing = false;
            message.success('技能市场已同步至最新');
          }, 1600);
        },
        onSkillAuditSceneFilterMenuClick(info) {
          const key = info && info.key ? String(info.key) : 'all';
          this.setSkillDimensionFilterValue('auditScene', key === 'all' ? '' : key);
        },
        setSkillTypeFilterTab(tabId) {
          const id = String(tabId || 'all');
          this.setSkillDimensionFilterValue('skillType', id === 'all' ? '' : id);
        },
        isSkillDimensionFilterActive(categoryId, valueId) {
          const key = String(categoryId || '');
          const current = String(((this.skillDimensionFilterValues || {})[key]) || '');
          if (arguments.length < 2) return !!current;
          return current === String(valueId || '');
        },
        onSkillSortMenuClick(info) {
          const next = info && info.key ? String(info.key) : '';
          if (!next) return;
          this.skillSortBy = next;
        },
        parseTemplateHashQuery() {
          const raw = (typeof window !== 'undefined' && window.location && window.location.hash ? window.location.hash : '').replace(/^#/, '');
          const q = raw.includes('?') ? raw.split('?')[1] : '';
          const params = new URLSearchParams(q || '');
          const tab = params.get('tab');
          const templateId = params.get('templateId');
          const mode = params.get('mode');
          return {
            tab: tab ? normalizeTemplateSkillTab(tab) : null,
            templateId: templateId || '',
            mode: mode === 'edit' || mode === 'view' ? mode : '',
            panel: params.get('panel') === 'config' ? 'config' : 'basic',
          };
        },
        syncTemplateStateFromHash() {
          const q = this.parseTemplateHashQuery();
          if (q.tab) this.skillLibraryTab = q.tab;
          this.skillConfigTemplateId = q.templateId || '';
          this.skillConfigNavKey = 'rule';
          if (q.templateId) {
            this.skillConfigModalIsCreate = false;
            this.$nextTick(() => {
              if (this.selectedSkill) {
                const s = this.selectedSkill;
                const configReadOnly = true;
                const basicReadOnly = true;
                this.skillConfigModalReadOnly = configReadOnly;
                this.skillBasicModalReadOnly = basicReadOnly;
                this._skillBasicPaneSnap = null;
                this._skillConfigPaneSnap = null;
                this._skillModalCreateCommitted = false;
                this.skillDetailActiveTab = 'config';
                this.syncSkillFormFromSkill(s);
                this.ensureSkillPublishedVersions(s);
                if (q.panel === 'config' ? !configReadOnly : !basicReadOnly) {
                  this._skillModalSnapshot = skillDeepClone(s);
                } else {
                  this._skillModalSnapshot = null;
                }
                if (q.panel === 'config') {
                  this.skillBasicModalOpen = false;
                  this.skillConfigModalOpen = true;
                  this.ensureFirstObjectExpanded();
                  this.$nextTick(() => this.captureSkillPaneSnapshotsAfterOpen());
                } else {
                  this.skillConfigModalOpen = false;
                  this.skillBasicModalOpen = true;
                  this.$nextTick(() => this.captureSkillBasicPaneSnap());
                }
              } else {
                this.skillConfigTemplateId = '';
                this.skillConfigModalReadOnly = false;
                this.skillBasicModalReadOnly = false;
                this.skillConfigModalIsCreate = false;
                this.skillBasicModalOpen = false;
                this.skillConfigModalOpen = false;
                this._skillModalSnapshot = null;
                this.updateTemplateHash(this.skillLibraryTab, '');
                message.warning('未找到该技能，已返回列表。');
              }
            });
          } else {
            this.skillBasicModalOpen = false;
            this.skillConfigModalOpen = false;
            this.skillConfigModalReadOnly = false;
            this.skillConfigModalIsCreate = false;
            this._skillModalSnapshot = null;
          }
        },
        updateTemplateHash(tab, templateId, modeHint, panelHint) {
          const params = new URLSearchParams();
          params.set('tab', tab || this.skillLibraryTab);
          if (templateId) {
            params.set('templateId', templateId);
            if (modeHint === 'edit') params.set('mode', 'edit');
            else if (modeHint === 'view') params.set('mode', 'view');
            if (panelHint === 'config') params.set('panel', 'config');
          }
          const next = 'template?' + params.toString();
          if (typeof window !== 'undefined' && window.location) {
            if (window.location.hash !== '#' + next) window.location.hash = next;
            else this.syncTemplateStateFromHash();
          }
        },
        syncSkillFormFromSkill(s) {
          if (!s) return;
          const dimForm = this.buildSkillDimensionForm(s);
          this.skillForm = {
            id: s.id,
            name: s.name || '',
            description: s.description || '',
            skillType: dimForm.dimensionValues.skillType || s.skillType || '',
            auditScene: dimForm.dimensionValues.auditScene || s.auditScene || '',
            skillInputs: [...(s.skillInputs || [])],
            outputSummary: s.outputSummary || '',
          };
        },
        syncSkillFormToSelected() {
          const s = this.selectedSkill;
          if (!s || this.skillBasicFormLocked) return;
          const name = (this.skillForm.name || '').trim();
          const description = (this.skillForm.description || '').trim();
          const skillType = String(this.skillForm.skillType || '').trim();
          const auditScene = String(this.skillForm.auditScene || '').trim();
          const skillInputs = [...(this.skillForm.skillInputs || [])].map((t) => String(t).trim()).filter(Boolean);
          const outputSummary = String(this.skillForm.outputSummary || '').trim();
          s.name = name;
          s.description = description;
          s.skillInputs = skillInputs;
          s.outputSummary = outputSummary;
          this.syncSkillDimensionValues(s, { skillType, auditScene });
        },
        openSkillBasicModal(s, options) {
          if (!s || !s.id) return;
          const resolved = this.resolveCardSkillTarget(s, options);
          s = resolved.skill;
          if (!s || !s.id) return;
          const readOnly = resolved.readOnly;
          const tab = isTemplateMarketSkill(s) ? TEMPLATE_SKILL_LIBRARY.MARKET : TEMPLATE_SKILL_LIBRARY.SHARED;
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this.skillBasicModalReadOnly = readOnly;
          this.skillConfigModalIsCreate = false;
          this.skillLibraryTab = tab;
          this.skillConfigTemplateId = s.id;
          this.skillConfigModalOpen = false;
          if (!readOnly) {
            this._skillModalSnapshot = skillDeepClone(s);
          } else {
            this._skillModalSnapshot = null;
          }
          this.syncSkillFormFromSkill(s);
          this.ensureSkillPublishedVersions(s);
          this.skillBasicModalOpen = true;
          this.$nextTick(() => this.captureSkillBasicPaneSnap());
          this.updateTemplateHash(tab, s.id, readOnly ? 'view' : 'edit', 'basic');
        },
        openSkillConfig(s, options) {
          if (!s || !s.id) return;
          const resolved = this.resolveCardSkillTarget(s, options);
          s = resolved.skill;
          if (!s || !s.id) return;
          const readOnly = resolved.readOnly;
          const tab = isTemplateMarketSkill(s) ? TEMPLATE_SKILL_LIBRARY.MARKET : TEMPLATE_SKILL_LIBRARY.SHARED;
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this.skillConfigModalReadOnly = readOnly;
          this.skillConfigModalIsCreate = false;
          this.skillLibraryTab = tab;
          this.skillConfigTemplateId = s.id;
          this.skillDetailActiveTab = 'config';
          this.skillBasicModalOpen = false;
          if (!readOnly) {
            this._skillModalSnapshot = skillDeepClone(s);
          } else {
            this._skillModalSnapshot = null;
          }
          this.syncSkillFormFromSkill(s);
          this.ensureSkillPublishedVersions(s);
          this.skillConfigModalOpen = true;
          this.$nextTick(() => {
            this.ensureFirstObjectExpanded();
            this.captureSkillPaneSnapshotsAfterOpen();
          });
          this.updateTemplateHash(tab, s.id, readOnly ? 'view' : 'edit', 'config');
        },
        openSkillConfigFromBasic() {
          const proceed = () => {
            const s = this.selectedSkill;
            if (!s) return;
            const readOnly = this.skillBasicFormLocked;
            this.skillBasicModalOpen = false;
            this.openSkillConfig(s, { readOnly });
          };
          if (this.skillBasicPaneDirty) {
            openTemplatePageConfirm({
              title: '有未保存的编辑',
              content: '进入技能配置将放弃基本信息的未保存修改，是否继续？',
              okText: '放弃并继续',
              cancelText: '留在本页',
              onOk: () => {
                this.cancelSkillBasicPaneEdit();
                proceed();
              },
            });
            return;
          }
          proceed();
        },
        closeSkillBasicModal(fromSave) {
          const saved = fromSave === true;
          const createCommitted = this._skillModalCreateCommitted;
          const templateId = this.skillConfigTemplateId;
          const wasCreate = this.skillConfigModalIsCreate;
          const wasReadOnly = this.skillBasicModalReadOnly;
          if (!saved) {
            if (wasCreate && templateId && !createCommitted) {
              this.privateSkills = this.privateSkills.filter((x) => String(x.id) !== String(templateId));
            } else if (!wasReadOnly && this._skillModalSnapshot && templateId) {
              const snap = this._skillModalSnapshot;
              const privIdx = this.privateSkills.findIndex((x) => String(x.id) === String(templateId));
              if (privIdx >= 0 && snap) {
                this.privateSkills.splice(privIdx, 1, skillDeepClone(snap));
              }
              const pubIdx = this.publicSkills.findIndex((x) => String(x.id) === String(templateId));
              if (pubIdx >= 0 && snap) {
                this.publicSkills.splice(pubIdx, 1, skillDeepClone(snap));
              }
            }
          }
          this.skillBasicModalOpen = false;
          if (!this.skillConfigModalOpen) {
            this._skillModalSnapshot = null;
            this.skillConfigModalIsCreate = false;
            this.skillConfigTemplateId = '';
            this.skillConfigModalReadOnly = false;
            this.skillBasicModalReadOnly = false;
            this._skillBasicPaneSnap = null;
            this._skillConfigPaneSnap = null;
            this._skillModalCreateCommitted = false;
            this.updateTemplateHash(this.skillLibraryTab, '');
          }
        },
        onSkillBasicModalCancel() {
          if (this.skillBasicPaneDirty) {
            openTemplatePageConfirm({
              title: '有未保存的编辑',
              content: '关闭后将放弃未保存的修改，是否继续？',
              okText: '放弃并关闭',
              cancelText: '留在本页',
              onOk: () => this.closeSkillBasicModal(false),
            });
            return;
          }
          this.closeSkillBasicModal(false);
        },
        openSkillCreateBasicModal() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          this.startSkillCreateConfigFirst();
        },
        startSkillCreateConfigFirst() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const row = {
            id: newSkillId('sk'),
            library: SKILL_LIBRARY.PRIVATE,
            name: '',
            description: '',
            skillType: '',
            auditScene: '',
            skillInputs: [],
            outputSummary: '',
            skillFiles: [],
            extractionRules: [],
            analysisRule: '',
            applicableScenario: '',
            createdAt: now,
            updatedAt: now,
            createdBy: '我',
            publishedVersions: [],
          };
          this.privateSkills.unshift(row);
          this.skillConfigModalIsCreate = true;
          this._skillCreateAwaitingBasic = true;
          this.skillConfigModalReadOnly = false;
          this.skillLibraryTab = SKILL_LIBRARY.PRIVATE;
          this.skillConfigTemplateId = row.id;
          this.skillDetailActiveTab = 'config';
          this._skillModalSnapshot = null;
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this.syncSkillFormFromSkill(row);
          this.skillCreateBasicSubmitting = false;
          this.skillCreateBasicModalOpen = false;
          this.skillBasicModalOpen = false;
          this.skillConfigModalOpen = true;
          this.$nextTick(() => {
            this.ensureFirstObjectExpanded();
            this.captureSkillPaneSnapshotsAfterOpen();
          });
        },
        openSkillCreateBasicAfterConfig() {
          const s = this.selectedSkill;
          if (!s) return;
          this.skillCreateBasicSubmitting = false;
          this.skillCreateBasicForm = {
            name: String(s.name || '').trim(),
            description: String(s.description || '').trim(),
            skillType: String(s.skillType || '').trim(),
            auditScene: String(s.auditScene || '').trim(),
            skillInputs: Array.isArray(s.skillInputs) ? s.skillInputs.slice() : [],
            outputSummary: String(s.outputSummary || '').trim(),
          };
          this.skillConfigModalOpen = false;
          this.skillCreateBasicModalOpen = true;
        },
        discardSkillCreateDraft() {
          const templateId = String(this.skillConfigTemplateId || '').trim();
          if (templateId) {
            this.privateSkills = this.privateSkills.filter((x) => String(x.id) !== templateId);
          }
          this._skillCreateAwaitingBasic = false;
          this.skillConfigModalIsCreate = false;
          this.skillConfigTemplateId = '';
          this._skillModalCreateCommitted = false;
        },
        closeSkillCreateBasicModal() {
          if (this._skillCreateAwaitingBasic && this.skillConfigTemplateId) {
            openTemplatePageConfirm({
              title: '放弃创建技能？',
              content: '取消后将删除本次未完成的技能草稿。',
              okText: '放弃',
              cancelText: '继续填写',
              onOk: () => {
                this.discardSkillCreateDraft();
                this.skillCreateBasicSubmitting = false;
                this.skillCreateBasicModalOpen = false;
              },
            });
            return;
          }
          this.skillCreateBasicSubmitting = false;
          this.skillCreateBasicModalOpen = false;
        },
        submitSkillCreateBasic() {
          if (this.skillCreateBasicSubmitting) return;
          const name = String(this.skillCreateBasicForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
          const skillType = String(this.skillCreateBasicForm.skillType || '').trim();
          if (!skillType) {
            message.warning('请选择' + this.skillTypeCategoryLabel);
            return;
          }
          const auditScene = String(this.skillCreateBasicForm.auditScene || '').trim();
          if (!auditScene) {
            message.warning('请选择' + this.auditSceneCategoryLabel);
            return;
          }
          this.skillCreateBasicSubmitting = true;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const templateId = String(this.skillConfigTemplateId || '').trim();
          if (this._skillCreateAwaitingBasic && templateId) {
            const idx = this.privateSkills.findIndex((x) => String(x.id) === templateId);
            if (idx < 0) {
              this.skillCreateBasicSubmitting = false;
              message.warning('未找到待完善的技能，请重新创建');
              return;
            }
            const row = this.privateSkills[idx];
            row.name = name;
            row.description = String(this.skillCreateBasicForm.description || '').trim();
            row.skillType = skillType;
            row.auditScene = auditScene;
            row.skillInputs = Array.from(new Set((this.skillCreateBasicForm.skillInputs || []).map((t) => String(t).trim()).filter(Boolean)));
            row.outputSummary = String(this.skillCreateBasicForm.outputSummary || '').trim();
            row.updatedAt = now;
            this.syncSkillDimensionValues(row, { skillType, auditScene });
            this.privateSkills.splice(idx, 1, { ...row });
            this._skillModalCreateCommitted = true;
            this._skillCreateAwaitingBasic = false;
            this.skillConfigModalIsCreate = false;
            this.skillCreateBasicSubmitting = false;
            this.skillCreateBasicModalOpen = false;
            this.skillConfigTemplateId = '';
            message.success('技能创建成功');
            return;
          }
          const row = {
            id: newSkillId('sk'),
            library: SKILL_LIBRARY.PRIVATE,
            name,
            description: String(this.skillCreateBasicForm.description || '').trim(),
            skillType,
            auditScene,
            skillInputs: Array.from(new Set((this.skillCreateBasicForm.skillInputs || []).map((t) => String(t).trim()).filter(Boolean))),
            outputSummary: String(this.skillCreateBasicForm.outputSummary || '').trim(),
            skillFiles: [],
            extractionRules: [],
            analysisRule: '',
            applicableScenario: '',
            createdAt: now,
            updatedAt: now,
            createdBy: '我',
            publishedVersions: [],
          };
          this.syncSkillDimensionValues(row, { skillType, auditScene });
          this.privateSkills.unshift(row);
          this.skillConfigModalIsCreate = true;
          this.skillConfigModalReadOnly = false;
          this.skillLibraryTab = SKILL_LIBRARY.PRIVATE;
          this.skillConfigTemplateId = row.id;
          this.skillDetailActiveTab = 'config';
          this._skillModalSnapshot = null;
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this.syncSkillFormFromSkill(row);
          this.skillCreateBasicSubmitting = false;
          this.skillCreateBasicModalOpen = false;
          this.skillBasicModalOpen = false;
          this.skillConfigModalOpen = true;
          this.$nextTick(() => {
            this.ensureFirstObjectExpanded();
            this.captureSkillPaneSnapshotsAfterOpen();
          });
          this.updateTemplateHash(SKILL_LIBRARY.PRIVATE, row.id, 'edit', 'config');
        },
        openSkillCreateUnified() {
          this.startSkillCreateConfigFirst();
        },
        closeSkillConfigModal(fromSave) {
          const saved = fromSave === true;
          const createCommitted = this._skillModalCreateCommitted;
          if (this._skillConfigSyncTimer) {
            clearTimeout(this._skillConfigSyncTimer);
            this._skillConfigSyncTimer = null;
          }
          const templateId = this.skillConfigTemplateId;
          const wasCreate = this.skillConfigModalIsCreate;
          const wasReadOnly = this.skillConfigModalReadOnly;
          if (!saved) {
            if (wasCreate && templateId && !createCommitted) {
              this.privateSkills = this.privateSkills.filter((x) => String(x.id) !== String(templateId));
            } else if (!wasReadOnly && this._skillModalSnapshot && templateId) {
              const snap = this._skillModalSnapshot;
              const privIdx = this.privateSkills.findIndex((x) => String(x.id) === String(templateId));
              if (privIdx >= 0 && snap) {
                this.privateSkills.splice(privIdx, 1, skillDeepClone(snap));
              }
              const pubIdx = this.publicSkills.findIndex((x) => String(x.id) === String(templateId));
              if (pubIdx >= 0 && snap) {
                this.publicSkills.splice(pubIdx, 1, skillDeepClone(snap));
              }
            }
          }
          this._skillModalSnapshot = null;
          this.skillConfigModalIsCreate = false;
          this.skillConfigModalOpen = false;
          this.skillConfigTemplateId = '';
          this.skillConfigNavKey = 'rule';
          this.skillConfigTreeExpandedKeys = [];
          this.skillConfigModalReadOnly = false;
          this.skillBasicModalReadOnly = false;
          this.skillDetailActiveTab = 'config';
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this._skillCreateAwaitingBasic = false;
          this.skillBasicModalOpen = false;
          this.updateTemplateHash(this.skillLibraryTab, '');
        },
        ensureFirstObjectExpanded() {
          const s = this.selectedSkill;
          if (!s) return;
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (T && T.ensureSkillFiles) T.ensureSkillFiles(s);
          this.skillConfigNavKey = 'rule';
          this.skillConfigTreeExpandedKeys = T && T.defaultExpandedKeys ? T.defaultExpandedKeys(s.skillFiles || []) : [];
        },
        validateSkillFilesForSave() {
          return window.DemoSkillConfig.validateSkillFilesForSave(this.selectedSkill, message);
        },
        ensureSkillPublishedVersions(skill) {
          const s = skill || this.selectedSkill;
          if (!s || isTemplateMarketSkill(s)) return;
          if (!Array.isArray(s.publishedVersions)) s.publishedVersions = [];
        },
        privateSkillPassesShareValidation(s) {
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return false;
          if (!String((s.name || '').trim())) return false;
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (!T) return false;
          const dups = T.findDuplicatePaths(s.skillFiles || []);
          if (dups.length) return false;
          if (!String(s.analysisRule || '').trim()) return false;
          let bad = false;
          const walk = (nodes) => {
            (nodes || []).forEach((n) => {
              if (!n) return;
              if (n.kind === 'folder') {
                if (!String(n.name || '').trim()) bad = true;
                walk(n.children);
              } else if (n.kind === 'file') {
                if (!String(n.filename || '').trim() || !String(n.content || '').trim()) bad = true;
              }
            });
          };
          walk(s.skillFiles || []);
          return !bad;
        },
        openPublishLibrarySkillVersionModal() {
          if (this.skillConfigFieldsLocked) return;
          if (!this.validateSkillFilesForSave()) return;
          this.syncSkillFormToSelected();
          const s = this.selectedSkill;
          if (!s || isTemplateMarketSkill(s)) return;
          this.ensureSkillPublishedVersions(s);
          const n = s.publishedVersions.length + 1;
          this.skillPublishVersionForm = {
            versionLabel: 'v' + n + '.0',
            versionNote: '',
          };
          this.skillPublishVersionModalOpen = true;
        },
        closePublishLibrarySkillVersionModal() {
          this.skillPublishVersionModalOpen = false;
          this.skillPublishVersionSubmitting = false;
        },
        submitPublishLibrarySkillVersion() {
          if (this.skillPublishVersionSubmitting) return;
          if (this.skillConfigModalOpen) {
            if (this.skillConfigFieldsLocked) return;
            if (!this.validateSkillFilesForSave()) return;
            this.syncSkillFormToSelected();
          }
          const s = this.selectedSkill;
          if (!s || isTemplateMarketSkill(s)) return;
          const rawLabel = String(this.skillPublishVersionForm.versionLabel || '').trim();
          const rawNote = String(this.skillPublishVersionForm.versionNote || '').trim();
          if (!rawLabel) {
            message.warning('请填写版本号');
            return;
          }
          if (!rawNote) {
            message.warning('请填写版本说明');
            return;
          }
          this.ensureSkillPublishedVersions(s);
          const dup = (s.publishedVersions || []).some((v) => String(v.versionLabel || '').trim() === rawLabel);
          if (dup) {
            message.warning('版本号与已有记录重复，请换一个');
            return;
          }
          this.skillPublishVersionSubmitting = true;
          try {
            const snap = {
              name: s.name,
              description: s.description || '',
              skillType: s.skillType || '',
              skillInputs: [...(s.skillInputs || [])],
              outputSummary: s.outputSummary || '',
              analysisRule: String(s.analysisRule || ''),
              applicableScenario: String(s.applicableScenario || ''),
              skillFiles: skillDeepClone(s.skillFiles || []),
            };
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            s.publishedVersions.push({
              versionLabel: rawLabel,
              versionNote: rawNote,
              createdAt: now,
              snapshot: snap,
              publisherName: s.ownerName || s.createdBy || s.sharedBy || '平台管理员',
              publisherRole: '',
              versionStatus: 'published',
            });
            s.updatedAt = now;
            message.success('已发布新版本 ' + rawLabel);
            this.closePublishLibrarySkillVersionModal();
          } finally {
            this.skillPublishVersionSubmitting = false;
          }
        },
        openLibrarySkillVersionHistoryModal(record) {
          const snap = record && record.snapshot;
          if (!snap) {
            message.warning('该版本无可查看的快照');
            return;
          }
          const clone = skillDeepClone(snap);
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (T && T.ensureSkillFiles) {
            const holder = { skillFiles: clone.skillFiles || [] };
            T.ensureSkillFiles(holder);
            clone.skillFiles = holder.skillFiles;
          }
          this.skillVersionHistoryRecord = {
            versionLabel: record.versionLabel,
            versionNote: record.versionNoteRaw || '',
            createdAt: record.createdAt,
            snapshot: clone,
          };
          this.skillVersionHistoryNavKey = 'rule';
          this.skillVersionHistoryTreeExpandedKeys =
            T && T.defaultExpandedKeys ? T.defaultExpandedKeys(clone.skillFiles || []) : [];
          this.skillVersionHistoryModalOpen = true;
        },
        closeLibrarySkillVersionHistoryModal() {
          this.skillVersionHistoryModalOpen = false;
          this.skillVersionHistoryRecord = null;
          this.skillVersionHistoryNavKey = 'rule';
          this.skillVersionHistoryTreeExpandedKeys = [];
        },
        afterLibrarySkillVersionHistoryModalClose() {
          this.skillVersionHistoryRecord = null;
          this.skillVersionHistoryNavKey = 'rule';
          this.skillVersionHistoryTreeExpandedKeys = [];
        },
        restoreLibrarySkillVersion(record) {
          if (this.skillConfigFieldsLocked) return;
          const snap = record && record.snapshot;
          if (!snap) return;
          openTemplatePageConfirm({
            title: '恢复到该版本？',
            content: '当前未保存的编辑内容将被覆盖，是否继续？',
            okText: '恢复',
            onOk: () => {
              const s = this.selectedSkill;
              if (!s) return;
              s.name = snap.name;
              s.description = snap.description || '';
              s.skillType = snap.skillType || '';
              s.skillInputs = [...(snap.skillInputs || [])];
              s.outputSummary = snap.outputSummary || '';
              s.analysisRule = snap.analysisRule || '';
              s.applicableScenario = String(snap.applicableScenario != null ? snap.applicableScenario : '');
              s.skillFiles = skillDeepClone(snap.skillFiles || []);
              const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
              if (T && T.ensureSkillFiles) T.ensureSkillFiles(s);
              if (T && T.syncExtractionRulesFromSkillFiles) T.syncExtractionRulesFromSkillFiles(s);
              this.syncSkillFormFromSkill(s);
              this.skillConfigNavKey = 'rule';
              message.success('已恢复工作副本，请检查后保存');
              if (this.skillVersionHistoryModalOpen) this.closeLibrarySkillVersionHistoryModal();
            },
          });
        },
        syncSharedPublicEntryFromPrivateSkill(s) {
          if (!s || !s.sharedPublicSkillId) return;
          const idx = this.publicSkills.findIndex((p) => p.id === s.sharedPublicSkillId);
          if (idx < 0) return;
          const pub = this.publicSkills[idx];
          const next = skillDeepClone(s);
          next.id = pub.id;
          next.library = SKILL_LIBRARY.PUBLIC;
          next.sharedBy = pub.sharedBy || '我';
          next.sourcePrivateSkillId = s.id;
          next.createdAt = pub.createdAt || next.createdAt;
          next.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
          delete next.sharedPublicSkillId;
          delete next.createdBy;
          if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
            DemoSkillFileTree.syncExtractionRulesFromSkillFiles(next);
          }
          this.publicSkills.splice(idx, 1, next);
        },
        onSkillConfigSaveMenuClick(info) {
          const k = info && info.key;
          if (k === 'publish-new') this.openPublishLibrarySkillVersionModal();
        },
        scheduleSkillConfigSync() {
          if (this.skillConfigFieldsLocked) return;
          if (this._skillConfigSyncTimer) clearTimeout(this._skillConfigSyncTimer);
          this._skillConfigSyncTimer = setTimeout(() => this.syncSkillConfigNow(), 250);
        },
        syncSkillConfigNow() {
          const s = this.selectedSkill;
          if (!s) return;
          if (this.skillConfigFieldsLocked) return;
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          if (T && T.ensureSkillFiles) T.ensureSkillFiles(s);
          if (T && T.syncExtractionRulesFromSkillFiles) T.syncExtractionRulesFromSkillFiles(s);
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          s.analysisRule = String(s.analysisRule || '');
          s.applicableScenario = String(s.applicableScenario || '');
          s.updatedAt = now;
        },
        refreshSkillModalSnapshotAfterPaneSave() {
          const s = this.selectedSkill;
          if (!s || isTemplateMarketSkill(s)) return;
          this._skillModalSnapshot = window.DemoSkillConfig.skillSnapshot(s);
        },
        captureSkillBasicPaneSnap() {
          if (this.skillBasicFormLocked) return;
          this._skillBasicPaneSnap = window.DemoSkillConfig.basicSnapshot(this.skillForm);
        },
        captureSkillConfigPaneSnap() {
          const s = this.selectedSkill;
          if (!s || this.skillConfigFieldsLocked) return;
          this._skillConfigPaneSnap = window.DemoSkillConfig.skillSnapshot(s);
        },
        captureSkillPaneSnapshotsAfterOpen() {
          if (this.skillConfigFieldsLocked) {
            this._skillBasicPaneSnap = null;
            this._skillConfigPaneSnap = null;
            return;
          }
          this.captureSkillBasicPaneSnap();
          this.captureSkillConfigPaneSnap();
        },
        cancelSkillBasicPaneEdit() {
          const snap = this._skillBasicPaneSnap;
          if (snap) {
            this.skillForm.name = snap.name;
            this.skillForm.description = snap.description;
            this.skillForm.skillType = snap.skillType || '';
            this.skillForm.auditScene = snap.auditScene || '';
            this.skillForm.skillInputs = snap.skillInputs ? [...snap.skillInputs] : [];
            this.skillForm.outputSummary = snap.outputSummary || '';
          }
          this.captureSkillBasicPaneSnap();
        },
        saveSkillBasicPane() {
          if (this.skillBasicFormLocked) return;
          const name = (this.skillForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
          const skillType = String(this.skillForm.skillType || '').trim();
          const allowedType = new Set((this.skillTypeDimensionOptions || []).map((item) => String(item.id)));
          if (skillType && !allowedType.has(skillType)) {
            message.warning('所选' + this.skillTypeCategoryLabel + '已不在分类设置中，请重新选择');
            return;
          }
          const auditScene = String(this.skillForm.auditScene || '').trim();
          const allowedScene = new Set((this.auditSceneDimensionOptions || []).map((item) => String(item.id)));
          if (auditScene && !allowedScene.has(auditScene)) {
            message.warning('所选' + this.auditSceneCategoryLabel + '已不在分类设置中，请重新选择');
            return;
          }
          if (this._skillConfigSyncTimer) clearTimeout(this._skillConfigSyncTimer);
          this._skillConfigSyncTimer = null;
          this.syncSkillFormToSelected();
          const s = this.selectedSkill;
          if (s) {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            s.updatedAt = now;
            if (s.library === SKILL_LIBRARY.PRIVATE) {
              this.syncSkillConfigNow();
              if (s.sharedPublicSkillId) {
                this.syncSharedPublicEntryFromPrivateSkill(s);
              }
            }
          }
          this._skillModalCreateCommitted = true;
          if (s && s.library === SKILL_LIBRARY.PRIVATE) {
            this.refreshSkillModalSnapshotAfterPaneSave();
          } else if (s) {
            this._skillModalSnapshot = skillDeepClone(s);
          }
          this.captureSkillBasicPaneSnap();
          if (this.skillConfigModalIsCreate) this.skillConfigModalIsCreate = false;
          message.success('保存成功');
        },
        cancelSkillConfigPaneEdit() {
          const snap = this._skillConfigPaneSnap;
          if (snap && this.skillConfigTemplateId) {
            const privIdx = this.privateSkills.findIndex((x) => String(x.id) === String(this.skillConfigTemplateId));
            if (privIdx >= 0) {
              this.privateSkills.splice(privIdx, 1, skillDeepClone(snap));
            }
            const pubIdx = this.publicSkills.findIndex((x) => String(x.id) === String(this.skillConfigTemplateId));
            if (pubIdx >= 0) {
              this.publicSkills.splice(pubIdx, 1, skillDeepClone(snap));
            }
          }
          this.$nextTick(() => {
            this.captureSkillConfigPaneSnap();
            this.ensureFirstObjectExpanded();
          });
        },
        saveSkillConfigPane() {
          if (this.skillConfigFieldsLocked) return;
          if (!this.validateSkillFilesForSave()) return;
          if (this._skillConfigSyncTimer) clearTimeout(this._skillConfigSyncTimer);
          this._skillConfigSyncTimer = null;
          this.syncSkillFormToSelected();
          this.syncSkillConfigNow();
          const s = this.selectedSkill;
          if (s && s.library === SKILL_LIBRARY.PRIVATE && s.sharedPublicSkillId) {
            this.syncSharedPublicEntryFromPrivateSkill(s);
          }
          this._skillModalCreateCommitted = true;
          this.refreshSkillModalSnapshotAfterPaneSave();
          this.captureSkillPaneSnapshotsAfterOpen();
          if (this.skillConfigModalIsCreate && this._skillCreateAwaitingBasic) {
            message.success('配置已保存');
            this.openSkillCreateBasicAfterConfig();
            return;
          }
          if (this.skillConfigModalIsCreate) this.skillConfigModalIsCreate = false;
          message.success('保存成功');
        },
        onSkillConfigTabUpdate(key) {
          const next = String(key || 'config');
          if (next === String(this.skillDetailActiveTab)) return;
          const leaving = String(this.skillDetailActiveTab);
          if (leaving === 'config' && this.skillConfigPaneDirty) {
            openTemplatePageConfirm({
              title: '有未保存的编辑',
              content: '切换页签将放弃当前页签的未保存修改，是否继续？',
              okText: '放弃并切换',
              cancelText: '留在本页',
              onOk: () => {
                this.cancelSkillConfigPaneEdit();
                this.skillDetailActiveTab = next;
              },
            });
            return;
          }
          this.skillDetailActiveTab = next;
        },
        triggerSkillImport() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          const el = this.$refs.skillImportFileInput;
          if (el && typeof el.click === 'function') el.click();
        },
        onSkillImportFileChange(ev) {
          const input = ev && ev.target;
          const file = input && input.files && input.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const text = String((e.target && e.target.result) || '').trim();
              const raw = JSON.parse(text);
              const base = this.normalizeImportedSkillPayload(raw);
              if (!base) return;
              const lib = this.skillLibraryTab;
              const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
              const row = {
                name: base.name,
                description: base.description,
                skillType: base.skillType,
                skillInputs: base.skillInputs,
                outputSummary: base.outputSummary,
                analysisRule: base.analysisRule,
                id: newSkillId('sk'),
                library: lib,
                createdAt: now,
                updatedAt: now,
                createdBy: '我',
                skillFiles: Array.isArray(base.skillFiles) ? base.skillFiles : [],
                applicableScenario: base.applicableScenario != null ? String(base.applicableScenario) : '',
                extractionRules: [],
                publishedVersions: [],
              };
              if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
                DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
              }
              this.privateSkills.unshift(row);
              message.success('已导入到「我的」库');
            } catch (err) {
              message.error('文件解析失败，请使用由本页导出的 JSON');
            }
          };
          reader.onerror = () => message.error('读取文件失败');
          reader.readAsText(file, 'UTF-8');
          input.value = '';
        },
        normalizeImportedSkillPayload(raw) {
          if (!raw || typeof raw !== 'object') {
            message.warning('导入失败：内容不是有效的 JSON 对象');
            return null;
          }
          const name = String(raw.name || '').trim();
          if (!name) {
            message.warning('导入失败：缺少名称');
            return null;
          }
          const T = typeof window !== 'undefined' ? window.DemoSkillFileTree : null;
          let skillFiles = [];
          if (Array.isArray(raw.skillFiles) && raw.skillFiles.length) {
            try {
              skillFiles = JSON.parse(JSON.stringify(raw.skillFiles));
            } catch (_) {
              skillFiles = [];
            }
          }
          if (!skillFiles.length && Array.isArray(raw.extractionRules) && raw.extractionRules.length) {
            skillFiles = raw.extractionRules.map((er, i) => ({
              id: 'imp-' + i + '-' + Date.now().toString(36),
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: (String(er && er.title != null ? er.title : '').trim() || 'imported-' + (i + 1)) + '.md',
              content: String(er && er.body != null ? er.body : ''),
            }));
          }
          const analysisRule = String(raw.analysisRule || '').trim();
          if (!skillFiles.length && !analysisRule) {
            message.warning('导入失败：缺少 skillFiles、可转换的 extractionRules 或审计思路');
            return null;
          }
          if (T && typeof T.findDuplicatePaths === 'function') {
            const dups = T.findDuplicatePaths(skillFiles);
            if (dups.length) {
              message.warning('导入失败：文件名路径重复：' + dups.join('、'));
              return null;
            }
          }
          return {
            name,
            description: String(raw.description || '').trim(),
            skillType: String(raw.skillType || '').trim(),
            skillInputs: Array.isArray(raw.skillInputs) ? raw.skillInputs.map((t) => String(t).trim()).filter(Boolean) : [],
            outputSummary: String(raw.outputSummary || '').trim(),
            skillFiles,
            analysisRule,
            applicableScenario: String(raw.applicableScenario != null ? raw.applicableScenario : '').trim(),
          };
        },
      },
      mounted() {
        try {
          const pool = demoSharedPrivateAnalysisTemplatePool || [];
          pool.forEach((row) => {
            if (!row || !row.id) return;
            if (String(row.library || 'private') !== 'private') return;
            if (this.privateSkills.some((x) => x.id === row.id)) return;
            this.privateSkills.unshift(skillDeepClone(row));
          });
        } catch (_) { /* ignore */ }
        this.syncTemplateStateFromHash();
        const onHash = () => this.syncTemplateStateFromHash();
        window.addEventListener('hashchange', onHash);
        this._templateHashCleanup = () => window.removeEventListener('hashchange', onHash);
      },
      beforeUnmount() {
        if (this._skillConfigSyncTimer) clearTimeout(this._skillConfigSyncTimer);
        if (this._templateHashCleanup) this._templateHashCleanup();
      },
      watch: {
        skillLibraryTab() {
          this.skillTagSearchQuery = '';
          this.skillFilterTagKeys = [];
          this.skillFilterTagMatchMode = 'any';
          this.skillDimensionFilterValues = {};
          this.skillFilterPopoverOpen = false;
          if (this.skillConfigModalOpen && !this.selectedSkill) {
            message.warning('当前技能不在所选库，已返回列表。');
            this._skillModalSnapshot = null;
            this.closeSkillConfigModal(false);
          } else if (typeof window !== 'undefined' && window.location && window.location.hash.startsWith('#template')) {
            this.updateTemplateHash(
              this.skillLibraryTab,
              this.skillConfigTemplateId || '',
              this.skillConfigModalReadOnly ? 'view' : 'edit'
            );
          }
        },
      },
    });

})();
