(function () {
  const app = window.__DEMO_APP;
  const templateUtils = window.__DEMO_TEMPLATE_UTILS || {};
  const DEFAULT_TEMPLATE_SORT = templateUtils.DEFAULT_TEMPLATE_SORT || 'updated_desc';

    app.component('TemplateCenterView', {
      template: `
        <a-layout class="shell-main">
          <div class="app-main template-center-shell">
            <TemplateListPanel :host="templateListHost" />

            <a-modal
              v-model:open="skillCreateBasicModalOpen"
              title="创建技能"
              width="640"
              wrapClassName="modal-w-640"
              centered
              :maskClosable="false"
              @cancel="closeSkillCreateBasicModal"
            >
              <a-form layout="vertical">
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
                <a-form-item label="标签" style="margin-bottom: 0;">
                  <a-select
                    v-model:value="skillCreateBasicForm.tags"
                    mode="tags"
                    placeholder="回车添加标签，如：函证、凭证核对"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-form>
              <template #footer>
                <a-button @click="closeSkillCreateBasicModal">取消</a-button>
                <a-button type="primary" :loading="skillCreateBasicSubmitting" @click="submitSkillCreateBasic">提交并继续配置</a-button>
              </template>
            </a-modal>

            <a-modal
              v-model:open="skillConfigModalOpen"
              width="1040"
              wrapClassName="modal-skill-config"
              centered
              :footer="null"
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
                <a-tabs :activeKey="skillDetailActiveTab" class="skill-unified-modal-tabs" tab-position="left" @update:activeKey="onSkillTabUpdate">
                  <a-tab-pane key="basic" tab="基本信息">
                    <div class="ds-unified-tab-pane-stack">
                      <div class="ds-unified-tab-pane-chrome" role="toolbar" aria-label="基本信息操作">
                        <h3 class="ds-unified-tab-pane-chrome__title">基本信息</h3>
                        <div class="ds-unified-tab-pane-chrome__actions skill-modal-tab-chrome-actions">
                          <template v-if="!skillConfigFieldsLocked">
                            <a-button
                              :type="skillBasicPaneDirty ? 'primary' : 'default'"
                              :disabled="!skillBasicPaneDirty"
                              @click="saveSkillBasicPane"
                            >保存</a-button>
                          </template>
                        </div>
                      </div>
                      <a-form layout="vertical" class="skill-modal-form skill-wizard-panel skill-unified-tab-basic">
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
                        <a-form-item label="标签" style="margin-bottom: 0;">
                          <a-select
                            v-model:value="skillForm.tags"
                            mode="tags"
                            placeholder="回车添加标签，用于分类与检索，如：自动化、数据处理、集成"
                            style="width: 100%"
                            :disabled="skillBasicFormLocked"
                          />
                        </a-form-item>
                      </a-form>
                    </div>
                  </a-tab-pane>
                  <a-tab-pane key="config" tab="技能配置">
                <div class="ds-unified-tab-pane-stack">
                  <div class="ds-unified-tab-pane-chrome" role="toolbar" aria-label="技能配置操作">
                    <h3 class="ds-unified-tab-pane-chrome__title">技能配置</h3>
                    <div class="ds-unified-tab-pane-chrome__actions skill-modal-tab-chrome-actions">
                      <template v-if="!skillConfigFieldsLocked">
                        <a-button type="default" @click="onSkillConfigSaveMenuClick({ key: 'publish-new' })">快照</a-button>
                        <a-button
                          :type="skillConfigPaneDirty ? 'primary' : 'default'"
                          :disabled="!skillConfigPaneDirty"
                          @click="saveSkillConfigPane"
                        >保存</a-button>
                      </template>
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
                  <a-tab-pane v-if="selectedSkill && selectedSkill.library === 'private'" key="version" tab="历史版本">
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
              </div>
              <div v-else style="padding: var(--ds-space-m) 0;">
                <a-empty description="未找到技能，请关闭后重试。" />
              </div>
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
            <a-modal
              v-model:open="batchTagModalOpen"
              title="批量打标签"
              width="520"
              wrapClassName="modal-w-520"
              :maskClosable="false"
              @cancel="closeBatchTagModal"
            >
              <a-form layout="vertical">
                <a-form-item label="标签" required>
                  <a-select
                    v-model:value="batchTagFormTags"
                    mode="tags"
                    placeholder="输入后回车，可一次添加多个标签"
                    style="width: 100%;"
                  />
                </a-form-item>
                <div class="ds-text-micro-secondary">将应用到已选 {{ selectedCurrentLibrarySkillCount }} 项技能。</div>
              </a-form>
              <template #footer>
                <a-button @click="closeBatchTagModal">取消</a-button>
                <a-button type="primary" @click="submitBatchTag">应用</a-button>
              </template>
            </a-modal>
          </div>
        </a-layout>
      `,
      data() {
        return {
          skillLibraryTab: SKILL_LIBRARY.PRIVATE,
          publicSkills: skillDeepClone(SKILL_SEED_PUBLIC),
          privateSkills: skillDeepClone(SKILL_SEED_PRIVATE),
          skillSearchKeyword: '',
          skillFilterTagKeys: [],
          skillFilterTagMatchMode: 'any',
          skillSortBy: DEFAULT_TEMPLATE_SORT,
          skillSortDropdownOpen: false,
          skillTagSearchQuery: '',
          skillFilterPopoverOpen: false,
          skillDetailActiveTab: 'basic',
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
          selectedSkillIds: [],
          batchTagModalOpen: false,
          batchTagFormTags: [],
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
          skillCreateBasicForm: { name: '', description: '', tags: [] },
          skillForm: {
            id: '',
            name: '',
            description: '',
            tags: [],
          },
          _skillBasicPaneSnap: null,
          _skillConfigPaneSnap: null,
          _skillModalCreateCommitted: false,
        };
      },
      computed: {
        templateListHost() { return this; },
        currentSkillList() {
          return this.skillLibraryTab === SKILL_LIBRARY.PUBLIC ? this.publicSkills : this.privateSkills;
        },
        selectedSkill() {
          if (!this.skillConfigTemplateId) return null;
          const list = this.currentSkillList || [];
          return list.find((x) => x.id === this.skillConfigTemplateId) || null;
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
        skillConfigModalTitleText() {
          if (this.skillConfigModalIsCreate) return '新建技能';
          const s = this.selectedSkill;
          if (!s) return '技能详情';
          const n = String(s.name || '').trim();
          return n || '未命名技能';
        },
        /** 弹窗标题旁：我的技能下取「已发布」时间序最新版本号 */
        skillConfigModalHeadVersionLabel() {
          if (this.skillConfigModalIsCreate || !this.selectedSkill) return '';
          const s = this.selectedSkill;
          if (s.library !== SKILL_LIBRARY.PRIVATE) return '';
          const rows = this.skillLibraryVersionMgmtSortedRows;
          if (!rows.length) return '';
          return String(rows[0].versionLabel || '').trim();
        },
        isSelectedSkillReadOnly() {
          if (!this.selectedSkill) return false;
          return this.selectedSkill.library !== SKILL_LIBRARY.PRIVATE;
        },
        skillConfigFieldsLocked() {
          return this.isSelectedSkillReadOnly || this.skillConfigModalReadOnly;
        },
        skillBasicFormLocked() {
          return this.skillConfigFieldsLocked;
        },
        skillConfigWorkLocked() {
          return this.skillConfigFieldsLocked;
        },
        skillBasicPaneDirty() {
          if (this.skillConfigFieldsLocked) return false;
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
            { value: 'name_asc', label: '按名称（A→Z / 拼音）' },
            { value: 'name_desc', label: '按名称（Z→A / 拼音）' },
            { value: 'updated_desc', label: '按更新时间（新→旧）' },
            { value: 'updated_asc', label: '按更新时间（旧→新）' },
            { value: 'created_desc', label: '按创建时间（新→旧）' },
            { value: 'created_asc', label: '按创建时间（旧→新）' },
          ];
        },
        currentSkillSortLabel() {
          const list = this.skillSortOptions || [];
          const hit = list.find((opt) => String(opt.value) === String(this.skillSortBy || ''));
          return hit ? hit.label : '排序';
        },
        isSkillSortSelectedByFilter() {
          return !!((this.skillFilterTagKeys || []).length);
        },
        isSkillFilterSelected() {
          return !!((this.skillFilterTagKeys || []).length);
        },
        selectedCurrentLibrarySkillRows() {
          const set = new Set((this.selectedSkillIds || []).map((id) => String(id)));
          return (this.currentSkillList || []).filter((row) => set.has(String(row.id)));
        },
        selectedCurrentLibrarySkillCount() {
          return this.selectedCurrentLibrarySkillRows.length;
        },
        isAllFilteredSkillsSelected() {
          const rows = this.filteredSkills || [];
          if (!rows.length) return false;
          const set = new Set((this.selectedSkillIds || []).map((id) => String(id)));
          return rows.every((row) => set.has(String(row.id)));
        },
        filteredSkills() {
          const list = this.currentSkillList;
          const kw = (this.skillSearchKeyword || '').trim().toLowerCase();
          const tagKeys = this.skillFilterTagKeys || [];
          const modeAll = this.skillFilterTagMatchMode === 'all';
          const filtered = list.filter((s) => {
            const matchKw =
              !kw ||
              (s.name && s.name.toLowerCase().includes(kw)) ||
              (s.description && s.description.toLowerCase().includes(kw));
            const stags = s.tags || [];
            const matchTag =
              tagKeys.length === 0 ||
              (modeAll ? tagKeys.every((t) => stags.includes(t)) : tagKeys.some((t) => stags.includes(t)));
            return matchKw && matchTag;
          });
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const str = (v) => String(v || '').trim();
          const time = (v) => {
            const t = Date.parse(str(v));
            return Number.isNaN(t) ? 0 : t;
          };
          const byName = (a, b) => collator.compare(str(a.name), str(b.name));
          const sorted = [...filtered].sort((a, b) => {
            const key = this.skillSortBy;
            if (key === 'name_asc') return byName(a, b);
            if (key === 'name_desc') return byName(b, a);
            if (key === 'updated_desc') return time(b.updatedAt) - time(a.updatedAt) || byName(a, b);
            if (key === 'updated_asc') return time(a.updatedAt) - time(b.updatedAt) || byName(a, b);
            if (key === 'created_desc') return time(b.createdAt) - time(a.createdAt) || byName(a, b);
            if (key === 'created_asc') return time(a.createdAt) - time(b.createdAt) || byName(a, b);
            return time(b.updatedAt) - time(a.updatedAt) || byName(a, b);
          });
          return sorted;
        },
        skillEmptyDescription() {
          if (!this.currentSkillList.length) return '本列表暂无技能，可点击右上角「创建技能」或「导入技能」。';
          return '没有符合筛选条件的技能，请调整搜索或标签。';
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
            message.warning('未找到对应「我的技能」条目');
            return;
          }
          this.openSkillConfig(priv, { readOnly: false });
        },
        unshareFromPublicMineSharedCard(s) {
          const priv = this.resolvePrivateSkillForPublicMineShared(s);
          if (!priv) {
            message.warning('未找到对应「我的技能」条目');
            return;
          }
          this.unsharePrivateSkillFromPublic(priv);
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
            message.info('该技能已在共享技能库中');
            return;
          }
          if (!this.privateSkillPassesShareValidation(s)) {
            message.warning('请补全技能配置后再共享到组织');
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
          message.success('已共享到共享技能库');
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
          message.success('已取消共享');
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
          message.success('已复制到我的技能');
        },
        copySkillToPrivateFromPublicSilent(s) {
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
        },
        isSkillSelected(id) {
          if (id == null) return false;
          return (this.selectedSkillIds || []).some((x) => String(x) === String(id));
        },
        onSkillCardCheckboxChange(s, e) {
          if (!s || s.id == null) return;
          const checked = !!(e && e.target && e.target.checked);
          const id = String(s.id);
          const ids = [...(this.selectedSkillIds || [])].map((x) => String(x));
          const idx = ids.indexOf(id);
          if (checked && idx < 0) ids.push(id);
          if (!checked && idx >= 0) ids.splice(idx, 1);
          this.selectedSkillIds = ids;
        },
        toggleSelectAllFilteredSkills() {
          const rows = this.filteredSkills || [];
          if (!rows.length) {
            message.info('当前列表暂无可选项');
            return;
          }
          const rowIds = rows.map((row) => String(row.id));
          const rowSet = new Set(rowIds);
          const selected = new Set((this.selectedSkillIds || []).map((id) => String(id)));
          const isAllSelected = rowIds.every((id) => selected.has(id));
          if (isAllSelected) {
            this.selectedSkillIds = (this.selectedSkillIds || []).filter((id) => !rowSet.has(String(id)));
            return;
          }
          const merged = [...(this.selectedSkillIds || [])].map((id) => String(id));
          rowIds.forEach((id) => {
            if (!selected.has(id)) merged.push(id);
          });
          this.selectedSkillIds = merged;
        },
        openBatchTagModal() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          if (this.selectedCurrentLibrarySkillCount <= 0) {
            message.info('请先选择技能');
            return;
          }
          this.batchTagFormTags = [];
          this.batchTagModalOpen = true;
        },
        closeBatchTagModal() {
          this.batchTagModalOpen = false;
        },
        submitBatchTag() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          const tags = [...(this.batchTagFormTags || [])].map((t) => String(t).trim()).filter(Boolean);
          if (!tags.length) {
            message.warning('请至少输入一个标签');
            return;
          }
          const selected = new Set(this.selectedCurrentLibrarySkillRows.map((row) => String(row.id)));
          const n = selected.size;
          const apply = () => {
            const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
            this.privateSkills = this.privateSkills.map((row) => {
              if (!selected.has(String(row.id))) return row;
              const merged = Array.from(new Set([...(row.tags || []), ...tags]));
              return { ...row, tags: merged, updatedAt: now };
            });
            this.batchTagModalOpen = false;
            message.success(`已为 ${n} 项技能添加标签`);
          };
          window.dsConfirm.action({
            title: `为已选 ${n} 项添加标签？`,
            content: '将合并到现有标签。',
            okText: '确定',
            onOk: apply,
          });
        },
        batchDeletePrivateSkills() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          const rows = this.selectedCurrentLibrarySkillRows;
          if (!rows.length) {
            message.info('请先选择技能');
            return;
          }
          const idSet = new Set(rows.map((row) => String(row.id)));
          const n = rows.length;
          window.dsConfirm.delete({
            title: `删除已选 ${n} 项技能？`,
            kind: 'default',
            okText: '删除',
            onOk: () => {
              const pubIds = new Set(
                rows.map((row) => row.sharedPublicSkillId).filter(Boolean).map((id) => String(id))
              );
              if (pubIds.size) {
                this.publicSkills = this.publicSkills.filter((p) => !pubIds.has(String(p.id)));
              }
              this.privateSkills = this.privateSkills.filter((row) => !idSet.has(String(row.id)));
              this.selectedSkillIds = (this.selectedSkillIds || []).filter((id) => !idSet.has(String(id)));
              if (this.skillConfigTemplateId && idSet.has(String(this.skillConfigTemplateId))) {
                this._skillModalSnapshot = null;
                this.closeSkillConfigModal(false);
              }
              message.success(`已删除 ${n} 项技能`);
            },
          });
        },
        batchAddPublicSkillsToPrivate() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PUBLIC) return;
          const rows = this.selectedCurrentLibrarySkillRows.filter((row) => !this.isPublicSkillMineShared(row));
          if (!rows.length) {
            message.info('所选均为本人已共享技能，无需再添加到我的技能');
            return;
          }
          const skipped = this.selectedCurrentLibrarySkillRows.length - rows.length;
          const n = rows.length;
          window.dsConfirm.action({
            title: `添加已选 ${n} 项到我的技能？`,
            okText: '添加',
            onOk: () => {
              rows.forEach((row) => this.copySkillToPrivateFromPublicSilent(row));
              this.selectedSkillIds = [];
              message.success(
                skipped
                  ? `已添加 ${n} 项到我的技能（已跳过 ${skipped} 项本人共享）`
                  : `已添加 ${n} 项到我的技能`
              );
            },
          });
        },
        batchSharePrivateSkills() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          const rows = this.selectedCurrentLibrarySkillRows.filter((row) => !row.sharedPublicSkillId);
          if (!rows.length) {
            message.info('所选技能均已共享或无可共享项');
            return;
          }
          const ok = [];
          const bad = [];
          rows.forEach((row) => {
            if (this.privateSkillPassesShareValidation(row)) ok.push(row);
            else bad.push(row);
          });
          if (!ok.length) {
            message.warning('选中项均未通过完整配置校验，未执行批量共享');
            return;
          }
          const n = ok.length;
          window.dsConfirm.action({
            title: `共享已选 ${n} 项技能？`,
            content: '将发布到共享技能库。',
            okText: '共享',
            onOk: () => {
              ok.forEach((row) => this.sharePrivateSkillToPublicSilent(row));
              if (bad.length) {
                message.warning(`有 ${bad.length} 项未通过配置校验已跳过；已共享 ${n} 项到共享技能库`);
              } else {
                message.success(`已共享 ${n} 项到共享技能库`);
              }
            },
          });
        },
        batchExportSelectedSkills() {
          const rows = this.selectedCurrentLibrarySkillRows;
          if (!rows.length) {
            message.info('请先选择技能');
            return;
          }
          const n = rows.length;
          window.dsConfirm.action({
            title: `导出已选 ${n} 项技能？`,
            okText: '导出',
            onOk: () => {
              const payload = rows.map((row) => skillDeepClone(row));
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              const scope = this.skillLibraryTab === SKILL_LIBRARY.PUBLIC ? 'public' : 'private';
              a.download = `templates-${scope}-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              message.success(`已导出 ${n} 项技能`);
            },
          });
        },
        deleteSkill(s) {
          if (!s) return;
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          if (s.sharedPublicSkillId) {
            this.publicSkills = this.publicSkills.filter((p) => p.id !== s.sharedPublicSkillId);
          }
          this.privateSkills = this.privateSkills.filter((x) => x.id !== s.id);
          if (s.id === this.skillConfigTemplateId) {
            this._skillModalSnapshot = null;
            this.closeSkillConfigModal(false);
          }
          message.success('已删除');
        },
        onTemplateCardMenu(info, s) {
          const key = info && info.key;
          if (key === 'export') {
            this.exportOneSkill(s);
            return;
          }
          if (key === 'copy') {
            if (this.skillLibraryTab === SKILL_LIBRARY.PUBLIC) this.copySkillToPrivateFromPublic(s);
            else this.duplicateSkillInPrivate(s);
            return;
          }
          if (key === 'unshare') {
            if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
            this.unsharePrivateSkillFromPublic(s);
            return;
          }
          if (key === 'delete') {
            if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
            window.dsConfirm.delete({
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
          this.skillFilterPopoverOpen = false;
          this.skillTagSearchQuery = '';
        },
        onSkillSortMenuClick(info) {
          const next = info && info.key ? String(info.key) : '';
          if (!next) return;
          this.skillSortBy = next;
          this.skillSortDropdownOpen = false;
        },
        parseTemplateHashQuery() {
          const raw = (typeof window !== 'undefined' && window.location && window.location.hash ? window.location.hash : '').replace(/^#/, '');
          const q = raw.includes('?') ? raw.split('?')[1] : '';
          const params = new URLSearchParams(q || '');
          const tab = params.get('tab');
          const templateId = params.get('templateId');
          const mode = params.get('mode');
          return {
            tab: tab === SKILL_LIBRARY.PUBLIC || tab === SKILL_LIBRARY.PRIVATE ? tab : null,
            templateId: templateId || '',
            mode: mode === 'edit' || mode === 'view' ? mode : '',
          };
        },
        syncTemplateStateFromHash() {
          const q = this.parseTemplateHashQuery();
          if (q.tab) this.skillLibraryTab = q.tab;
          this.skillConfigTemplateId = q.templateId || '';
          this.skillConfigNavKey = 'rule';
          if (q.templateId) {
            // 与 openSkillConfig 写入的 mode 一致；无 mode 的旧链接默认只读预览
            this.skillConfigModalReadOnly = q.mode !== 'edit';
            this.skillConfigModalIsCreate = false;
            this.$nextTick(() => {
              if (this.selectedSkill) {
                const s = this.selectedSkill;
                this._skillBasicPaneSnap = null;
                this._skillConfigPaneSnap = null;
                this._skillModalCreateCommitted = false;
                this.skillDetailActiveTab = 'basic';
                this.syncSkillFormFromSkill(s);
                this.ensurePrivateSkillPublishedVersions();
                if (!this.skillConfigModalReadOnly && s.library === SKILL_LIBRARY.PRIVATE) {
                  this._skillModalSnapshot = skillDeepClone(s);
                } else {
                  this._skillModalSnapshot = null;
                }
                this.skillConfigModalOpen = true;
                this.ensureFirstObjectExpanded();
                this.$nextTick(() => this.captureSkillPaneSnapshotsAfterOpen());
              } else {
                this.skillConfigTemplateId = '';
                this.skillConfigModalReadOnly = false;
                this.skillConfigModalIsCreate = false;
                this.skillConfigModalOpen = false;
                this._skillModalSnapshot = null;
                this.updateTemplateHash(this.skillLibraryTab, '');
                message.warning('未找到该技能，已返回列表。');
              }
            });
          } else {
            this.skillConfigModalOpen = false;
            this.skillConfigModalReadOnly = false;
            this.skillConfigModalIsCreate = false;
            this._skillModalSnapshot = null;
          }
        },
        updateTemplateHash(tab, templateId, modeHint) {
          const params = new URLSearchParams();
          params.set('tab', tab || this.skillLibraryTab);
          if (templateId) {
            params.set('templateId', templateId);
            if (modeHint === 'edit') params.set('mode', 'edit');
            else if (modeHint === 'view') params.set('mode', 'view');
          }
          const next = 'template?' + params.toString();
          if (typeof window !== 'undefined' && window.location) {
            if (window.location.hash !== '#' + next) window.location.hash = next;
            else this.syncTemplateStateFromHash();
          }
        },
        syncSkillFormFromSkill(s) {
          if (!s) return;
          this.skillForm = {
            id: s.id,
            name: s.name || '',
            description: s.description || '',
            tags: [...(s.tags || [])],
          };
        },
        syncSkillFormToSelected() {
          const s = this.selectedSkill;
          if (!s || this.skillConfigFieldsLocked) return;
          const name = (this.skillForm.name || '').trim();
          const description = (this.skillForm.description || '').trim();
          const tags = [...(this.skillForm.tags || [])].map((t) => String(t).trim()).filter(Boolean);
          s.name = name;
          s.description = description;
          s.tags = tags;
        },
        openSkillConfig(s, options) {
          if (!s || !s.id) return;
          const readOnly = !!(options && options.readOnly);
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
          this.skillConfigModalReadOnly = readOnly;
          this.skillConfigModalIsCreate = false;
          const tab = s.library === SKILL_LIBRARY.PUBLIC ? SKILL_LIBRARY.PUBLIC : SKILL_LIBRARY.PRIVATE;
          this.skillLibraryTab = tab;
          this.skillConfigTemplateId = s.id;
          this.skillDetailActiveTab = 'basic';
          if (!readOnly && s.library === SKILL_LIBRARY.PRIVATE) {
            this._skillModalSnapshot = skillDeepClone(s);
          } else {
            this._skillModalSnapshot = null;
          }
          this.syncSkillFormFromSkill(s);
          this.ensurePrivateSkillPublishedVersions();
          this.skillConfigModalOpen = true;
          this.$nextTick(() => {
            this.ensureFirstObjectExpanded();
            this.captureSkillPaneSnapshotsAfterOpen();
          });
          this.updateTemplateHash(tab, s.id, readOnly ? 'view' : 'edit');
        },
        openSkillCreateBasicModal() {
          if (this.skillLibraryTab !== SKILL_LIBRARY.PRIVATE) return;
          this.skillCreateBasicSubmitting = false;
          this.skillCreateBasicForm = { name: '', description: '', tags: [] };
          this.skillCreateBasicModalOpen = true;
        },
        closeSkillCreateBasicModal() {
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
          this.skillCreateBasicSubmitting = true;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const row = {
            id: newSkillId('sk'),
            library: SKILL_LIBRARY.PRIVATE,
            name,
            description: String(this.skillCreateBasicForm.description || '').trim(),
            tags: Array.from(new Set((this.skillCreateBasicForm.tags || []).map((t) => String(t).trim()).filter(Boolean))),
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
          this.skillConfigModalOpen = true;
          this.$nextTick(() => {
            this.ensureFirstObjectExpanded();
            this.captureSkillPaneSnapshotsAfterOpen();
          });
          this.updateTemplateHash(SKILL_LIBRARY.PRIVATE, row.id, 'edit');
        },
        openSkillCreateUnified() {
          this.openSkillCreateBasicModal();
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
              const idx = this.privateSkills.findIndex((x) => String(x.id) === String(templateId));
              if (idx >= 0 && snap) {
                this.privateSkills.splice(idx, 1, skillDeepClone(snap));
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
          this.skillDetailActiveTab = 'basic';
          this._skillBasicPaneSnap = null;
          this._skillConfigPaneSnap = null;
          this._skillModalCreateCommitted = false;
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
        ensurePrivateSkillPublishedVersions() {
          const s = this.selectedSkill;
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
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
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
          this.ensurePrivateSkillPublishedVersions();
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
          if (this.skillConfigFieldsLocked) return;
          if (!this.validateSkillFilesForSave()) return;
          this.syncSkillFormToSelected();
          const s = this.selectedSkill;
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
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
          this.ensurePrivateSkillPublishedVersions();
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
              tags: [...(s.tags || [])],
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
              publisherName: '周宇',
              publisherRole: '（教授）',
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
          window.dsConfirm.action({
            title: '恢复到该版本？',
            content: '当前未保存的编辑内容将被覆盖，是否继续？',
            okText: '恢复',
            onOk: () => {
              const s = this.selectedSkill;
              if (!s) return;
              s.name = snap.name;
              s.description = snap.description || '';
              s.tags = [...(snap.tags || [])];
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
          if (s.library !== SKILL_LIBRARY.PRIVATE) return;
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
          if (!s || s.library !== SKILL_LIBRARY.PRIVATE) return;
          this._skillModalSnapshot = window.DemoSkillConfig.skillSnapshot(s);
        },
        captureSkillBasicPaneSnap() {
          if (this.skillConfigFieldsLocked) return;
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
            this.skillForm.tags = snap.tags ? [...snap.tags] : [];
          }
          this.captureSkillBasicPaneSnap();
        },
        saveSkillBasicPane() {
          if (this.skillConfigFieldsLocked) return;
          const name = (this.skillForm.name || '').trim();
          if (!name) {
            message.warning('请填写技能名称');
            return;
          }
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
          if (this.skillConfigModalIsCreate) this.skillConfigModalIsCreate = false;
          message.success('保存成功');
        },
        cancelSkillConfigPaneEdit() {
          const snap = this._skillConfigPaneSnap;
          if (snap && this.skillConfigTemplateId) {
            const idx = this.privateSkills.findIndex((x) => String(x.id) === String(this.skillConfigTemplateId));
            if (idx >= 0) {
              this.privateSkills.splice(idx, 1, skillDeepClone(snap));
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
          if (this.skillConfigModalIsCreate) this.skillConfigModalIsCreate = false;
          message.success('保存成功');
        },
        onSkillTabUpdate(key) {
          const next = String(key || 'basic');
          if (next === String(this.skillDetailActiveTab)) return;
          const leaving = String(this.skillDetailActiveTab);
          if ((leaving === 'basic' && this.skillBasicPaneDirty) || (leaving === 'config' && this.skillConfigPaneDirty)) {
            window.dsConfirm.action({
              title: '有未保存的编辑',
              content: '切换页签将放弃当前页签的未保存修改，是否继续？',
              okText: '放弃并切换',
              cancelText: '留在本页',
              onOk: () => {
                if (leaving === 'basic') this.cancelSkillBasicPaneEdit();
                if (leaving === 'config') this.cancelSkillConfigPaneEdit();
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
                tags: base.tags,
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
            tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
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
          this.skillFilterPopoverOpen = false;
          this.selectedSkillIds = [];
          this.batchTagModalOpen = false;
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
