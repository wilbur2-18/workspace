(function () {
  const app = window.__DEMO_APP;
  const message = antd.message;

  function cloneTemplateJson(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  const DEFAULT_PROJECT_LIST = [
    { id: 'PRJ-2026-001', name: 'A市城建集团年度经济责任审计', description: '展示完整审计分析流程。', visibility: 'private' },
    { id: 'PRJ-2026-002', name: '模型繁忙与排队反馈', description: '进入后自动展示模型请求排队、等待与生成中反馈。', visibility: 'private' },
    { id: 'PRJ-2026-003', name: '工具调用授权确认', description: '进入后自动展示删除结果前的授权确认与审批状态。', visibility: 'private' },
    { id: 'PRJ-2026-004', name: '空白对话起步', description: '进入后展示已添加资源下的初始化引导，便于演示首次对话入口。', visibility: 'private' },
  ];

  app.component('ProjectCenterView', {
    props: { openNewProjectModal: { type: Function } },
    template: `<a-layout class="shell-main">
      <div class="app-main">
        <project-center-list-panel
          :project-list-search="projectListSearch"
          :project-list-scope="projectListScope"
          :filtered-project-list="filteredProjectList"
          :empty-description="projectListEmptyDescription"
          :project-total-count="(projectList || []).length"
          :project-sort-by="projectListSortBy"
          :project-sort-options="projectListSortOptions"
          :card-material-count="projectCardMaterialCount"
          :card-analysis-result-count="projectCardAnalysisResultCount"
          :card-template-count="projectCardTemplateCount"
          :card-task-count="projectCardTaskCount"
          @update:project-list-search="projectListSearch = $event"
          @update:project-list-scope="projectListScope = $event"
          @update:project-sort-by="projectListSortBy = $event"
          @clear-search="projectListSearch = ''"
          @create-space="openNewProjectModal && openNewProjectModal()"
          @open-detail="goToProjectDetail"
          @open-workbench="goToWorkbenchFromList"
          @card-menu="(info, p) => onProjectCardMoreMenu(info, p)"
        />

        <a-modal v-model:open="analysisTemplateModalVisible" title="引用技能" width="960" wrapClassName="modal-w-960 modal-analysis-template-picker">
          <ProjectTemplatePickerPanel
            v-model:search-keyword="analysisTemplateSearchKeyword"
            v-model:library-tab="analysisTemplateLibraryTab"
            v-model:filter-tag-keys="analysisTemplateFilterTagKeys"
            v-model:filter-tag-match-mode="analysisTemplateFilterTagMatchMode"
            v-model:filter-popover-open="analysisTemplateFilterPopoverOpen"
            v-model:sort-by="analysisTemplateSortBy"
            v-model:sort-dropdown-open="analysisTemplateSortDropdownOpen"
            v-model:tag-search-query="analysisTemplateTagSearchQuery"
            :templates="filteredTemplatePool"
            :template-total-count="analysisTemplatePool.length"
            :selected-ids="analysisTemplateSelectedIds"
            :tag-filtered-stats="analysisTemplateTagFilteredStats"
            :sort-options="analysisTemplateSortOptions"
            :current-sort-label="analysisTemplateCurrentSortLabel"
            @quote="quoteTemplateToProject"
            @detail="openAnalysisTemplateDetail"
            @toggle-select="toggleAnalysisTemplateSelection"
            @clear-filters="clearAnalysisTemplateFilters"
            @clear-tags="clearAnalysisTemplateFilterTags"
          />
          <template #footer>
            <div class="ds-modal-footer-end">
              <a-space>
                <a-button @click="analysisTemplateModalVisible = false">关闭</a-button>
                <a-button type="primary" :disabled="!analysisTemplateSelectedIds.length" @click="quoteSelectedAnalysisTemplates">引用到当前工作台</a-button>
              </a-space>
            </div>
          </template>
        </a-modal>

        <a-modal v-model:open="analysisTemplateDetailVisible" :title="analysisTemplateDetailTitle" width="720" wrapClassName="modal-w-720">
          <div v-if="analysisTemplateDetailRecord" class="analysis-template-config-modal-body">
            <section class="analysis-template-config-card">
              <h3 class="ds-section-subtitle">基本信息</h3>
              <p class="ds-text-caption-light">{{ analysisTemplateDetailRecord.description || '暂无描述' }}</p>
            </section>
            <section class="analysis-template-config-card">
              <h3 class="ds-section-subtitle">审计思路</h3>
              <p class="ds-text-caption-light">{{ analysisTemplateDetailRecord.analysisRule || '暂无审计思路' }}</p>
            </section>
          </div>
          <template #footer>
            <div class="ds-modal-footer-end">
              <a-button @click="analysisTemplateDetailVisible = false">关闭</a-button>
            </div>
          </template>
        </a-modal>

        <a-modal v-model:open="uploadMaterialVisible" title="上传文档" width="1080" wrapClassName="modal-material-upload" @cancel="closeUploadMaterialModal">
          <div class="project-material-upload">
            <a-upload-dragger
              class="project-material-upload__dragger"
              :multiple="true"
              :open-file-dialog-on-click="false"
              :before-upload="beforeUploadMaterial"
              :file-list="uploadMaterialBatch"
              :show-upload-list="false"
              @remove="removeUploadMaterial"
              @click.capture.prevent="mockUploadMaterialSelect"
            >
              <p class="ant-upload-drag-icon"><ds-icon name="upload-inbox" /></p>
              <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <div class="project-material-upload__format-tags" aria-label="支持格式">
                <span v-for="fmt in uploadMaterialAcceptFormats" :key="fmt" class="project-material-upload__format-tag">{{ fmt }}</span>
              </div>
              <p class="project-material-upload__limit">每次最多上传 <strong>50</strong> 个文件，单个文件不超过 <strong>1000.00 MB</strong></p>
              <p class="ant-upload-hint">系统将自动识别文档中的文字内容或表格数据，DOC/WPS 格式将自动转换为 DOCX 处理，XLS/XLSX 多Sheet将自动拆分，ZIP 格式将自动解压处理</p>
            </a-upload-dragger>
            <section v-if="uploadMaterialBatch.length" class="project-material-upload__file-panel" aria-label="文件列表">
              <div class="project-material-upload__file-panel-head">
                <h3 class="project-material-upload__file-title">文件列表</h3>
                <a-button class="project-material-upload__clear-btn" @click="clearUploadMaterialBatch">
                  <ds-icon name="trash" aria-hidden="true" />
                  <span>清空列表</span>
                </a-button>
              </div>
              <div class="project-material-upload__table" role="table" aria-label="待上传文件列表">
                <div class="project-material-upload__table-row project-material-upload__table-row--head" role="row">
                  <div role="columnheader">文件名</div>
                  <div role="columnheader">大小</div>
                  <div role="columnheader">状态</div>
                  <div role="columnheader">操作</div>
                </div>
                <div v-for="file in uploadMaterialBatch" :key="file.uid" class="project-material-upload__table-row" role="row">
                  <div class="project-material-upload__file-name" role="cell" :title="file.name">{{ file.name }}</div>
                  <div role="cell">{{ formatUploadMaterialSize(file.size) }}</div>
                  <div role="cell"><span class="project-material-upload__status">待上传</span></div>
                  <div role="cell">
                    <button type="button" class="project-material-upload__remove-btn" @click="removeUploadMaterial(file)">
                      <ds-icon name="trash" aria-hidden="true" />
                      <span>移除</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <template #footer>
            <div class="ds-modal-footer-end">
              <a-space>
                <a-button @click="closeUploadMaterialModal">取消</a-button>
                <a-button type="primary" :disabled="!uploadMaterialBatch.length" @click="submitUploadMaterials">开始上传</a-button>
              </a-space>
            </div>
          </template>
        </a-modal>

        <a-modal v-model:open="projectEditVisible" title="编辑工作台" width="640" wrapClassName="modal-w-640" @cancel="cancelProjectEdit">
          <a-form layout="vertical">
            <a-form-item label="工作台名称"><a-input v-model:value="projectEditForm.name" allow-clear /></a-form-item>
            <a-form-item label="工作台简介"><a-textarea v-model:value="projectEditForm.description" :rows="3" /></a-form-item>
          </a-form>
          <template #footer>
            <div class="ds-modal-footer-end">
              <a-button
                :type="projectEditDirty ? 'primary' : 'default'"
                :disabled="!projectEditDirty"
                @click="saveProjectEdit"
              >保存</a-button>
            </div>
          </template>
        </a-modal>
      </div>
    </a-layout>`,
    data() {
      return {
        projectList: DEFAULT_PROJECT_LIST.slice(),
        projectListSearch: '',
        projectListScope: 'mine',
        projectListSortBy: 'created_desc',
        projectIdFromHash: null,
        projectEditVisible: false,
        projectEditForm: { id: '', name: '', description: '' },
        _projectEditSnap: null,
        analysisTemplateModalVisible: false,
        analysisTemplateSearchKeyword: '',
        analysisTemplateLibraryTab: 'private',
        analysisTemplateSelectedIds: [],
        analysisTemplateFilterTagKeys: [],
        analysisTemplateFilterTagMatchMode: 'any',
        analysisTemplateFilterPopoverOpen: false,
        analysisTemplateTagSearchQuery: '',
        analysisTemplateSortBy: 'updated_desc',
        analysisTemplateSortDropdownOpen: false,
        analysisTemplateDetailVisible: false,
        analysisTemplateDetailRecord: null,
        quoteSkillTargetProjectId: '',
        uploadMaterialVisible: false,
        uploadMaterialBatch: [],
        uploadMaterialAcceptFormats: ['PDF', 'JPG', 'PNG', 'BMP', 'TIF', 'XLSX', 'XLS', 'CSV', 'DOC', 'DOCX', 'WPS', 'ZIP', 'MD', 'TXT', 'JSON', 'XML'],
        /** 从审计助手文件夹入口上传时，由 bridge 传入，提交后写入资料 parentId */
        uploadMaterialParentFolderId: null,
      };
    },
    computed: {
      projectListSortOptions() {
        return [
          { value: 'name_asc', label: '按名称（A→Z / 拼音）' },
          { value: 'name_desc', label: '按名称（Z→A / 拼音）' },
          { value: 'created_desc', label: '按创建时间（新→旧）' },
          { value: 'created_asc', label: '按创建时间（旧→新）' },
        ];
      },
      filteredProjectList() {
        const list = this.projectList || [];
        const scopeList = list.filter((p) => (this.projectListScope === 'shared' ? p.visibility === 'shared' : p.visibility !== 'shared'));
        const kw = String(this.projectListSearch || '').trim().toLowerCase();
        const filtered = scopeList.filter((p) => {
          if (!kw) return true;
          return String(p.name || '').toLowerCase().includes(kw) || String(p.description || '').toLowerCase().includes(kw);
        });
        const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
        if (this.projectListSortBy === 'name_asc') return [...filtered].sort(byName);
        if (this.projectListSortBy === 'name_desc') return [...filtered].sort((a, b) => byName(b, a));
        return filtered;
      },
      projectListEmptyDescription() {
        if ((this.projectList || []).length === 0) return '暂无工作台，请先创建。';
        if (String(this.projectListSearch || '').trim()) return '没有符合搜索条件的工作台，请调整关键词。';
        return this.projectListScope === 'shared' ? '暂无共享工作台。' : '暂无我的工作台。';
      },
        analysisTemplatePool() {
          const rawPool = this.analysisTemplateLibraryTab === 'public'
            ? (typeof SKILL_SEED_PUBLIC !== 'undefined' && Array.isArray(SKILL_SEED_PUBLIC) ? SKILL_SEED_PUBLIC : [])
            : (Array.isArray(demoSharedPrivateAnalysisTemplatePool) ? demoSharedPrivateAnalysisTemplatePool : []);
          return rawPool.map((tpl) => this.normalizeAnalysisTemplateForQuote(tpl, this.analysisTemplateLibraryTab === 'public' ? 'public' : 'private'));
        },
        allAnalysisTemplatePool() {
          const privateRows = (Array.isArray(demoSharedPrivateAnalysisTemplatePool) ? demoSharedPrivateAnalysisTemplatePool : [])
            .map((tpl) => this.normalizeAnalysisTemplateForQuote(tpl, 'private'));
          const publicRows = (typeof SKILL_SEED_PUBLIC !== 'undefined' && Array.isArray(SKILL_SEED_PUBLIC) ? SKILL_SEED_PUBLIC : [])
            .map((tpl) => this.normalizeAnalysisTemplateForQuote(tpl, 'public'));
          return privateRows.concat(publicRows);
        },
        filteredTemplatePool() {
          const pool = this.analysisTemplatePool || [];
          const kw = String(this.analysisTemplateSearchKeyword || '').trim().toLowerCase();
          const tagKeys = this.analysisTemplateFilterTagKeys || [];
          const modeAll = this.analysisTemplateFilterTagMatchMode === 'all';
          const filtered = pool.filter((tpl) => {
            const textOk = !kw
              || String(tpl.name || '').toLowerCase().includes(kw)
              || String(tpl.description || '').toLowerCase().includes(kw)
              || (Array.isArray(tpl.tags) && tpl.tags.some((tag) => String(tag || '').toLowerCase().includes(kw)));
            if (!textOk) return false;
            if (!tagKeys.length) return true;
            const tags = Array.isArray(tpl.tags) ? tpl.tags.map((tag) => String(tag)) : [];
            return modeAll ? tagKeys.every((tag) => tags.includes(tag)) : tagKeys.some((tag) => tags.includes(tag));
          });
          return [...filtered].sort((a, b) => {
            const key = this.analysisTemplateSortBy;
            if (key === 'name_asc') return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
            if (key === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''), 'zh-CN');
            const at = Date.parse(a.updatedAt || a.createdAt || '') || 0;
            const bt = Date.parse(b.updatedAt || b.createdAt || '') || 0;
            if (key === 'updated_asc') return at - bt;
            return bt - at;
          });
        },
        analysisTemplateTagStats() {
          const map = new Map();
          (this.analysisTemplatePool || []).forEach((tpl) => {
            (tpl.tags || []).forEach((tag) => {
              const k = String(tag || '').trim();
              if (!k) return;
              map.set(k, (map.get(k) || 0) + 1);
            });
          });
          return Array.from(map.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
        },
        analysisTemplateTagFilteredStats() {
          const kw = String(this.analysisTemplateTagSearchQuery || '').trim().toLowerCase();
          if (!kw) return this.analysisTemplateTagStats;
          return this.analysisTemplateTagStats.filter((item) => String(item.tag || '').toLowerCase().includes(kw));
        },
        analysisTemplateSortOptions() {
          return [
            { value: 'updated_desc', label: '最近更新' },
            { value: 'updated_asc', label: '最早更新' },
            { value: 'name_asc', label: '名称 A→Z / 拼音' },
            { value: 'name_desc', label: '名称 Z→A / 拼音' },
          ];
        },
        analysisTemplateCurrentSortLabel() {
          const hit = this.analysisTemplateSortOptions.find((opt) => opt.value === this.analysisTemplateSortBy);
          return hit ? hit.label : '排序';
        },
        analysisTemplateDetailTitle() {
          const r = this.analysisTemplateDetailRecord;
          return r && r.name ? r.name : '技能详情';
        },
        projectEditDirty() {
          const snap = this._projectEditSnap;
          const f = this.projectEditForm;
          if (!snap || !f || !f.id) return false;
          return (
            String(f.name || '') !== String(snap.name || '')
            || String(f.description || '') !== String(snap.description || '')
          );
        },
    },
    mounted() {
      const onHashChange = () => {
        this.projectIdFromHash = getProjectIdFromHash();
        if (this.projectIdFromHash) {
          this.goToWorkbenchFromList(this.projectIdFromHash);
          return;
        }
        this.applyPendingNewProject();
      };
      window.addEventListener('hashchange', onHashChange);
      this._projectHashCleanup = () => window.removeEventListener('hashchange', onHashChange);

      this.projectIdFromHash = getProjectIdFromHash();
      if (this.projectIdFromHash) this.goToWorkbenchFromList(this.projectIdFromHash);
      this.applyPendingNewProject();

      window.__demoQuoteSkillBridge = {
        _owner: this,
        /** FreeAuditView 挂载时赋值：资料上传弹窗提交成功后回调 */
        onMaterialsUploaded: null,
        openForWorkbenchProject: (projectId) => {
          if (!projectId) return;
          this.quoteSkillTargetProjectId = String(projectId);
          this.analysisTemplateLibraryTab = 'private';
          this.analysisTemplateSelectedIds = [];
          this.analysisTemplateSearchKeyword = '';
          this.analysisTemplateFilterTagKeys = [];
          this.analysisTemplateFilterTagMatchMode = 'any';
          this.analysisTemplateFilterPopoverOpen = false;
          this.analysisTemplateTagSearchQuery = '';
          this.analysisTemplateSortBy = 'updated_desc';
          this.analysisTemplateSortDropdownOpen = false;
          this.analysisTemplateDetailVisible = false;
          this.analysisTemplateDetailRecord = null;
          this.analysisTemplateModalVisible = true;
        },
        openUploadForWorkbenchProject: (projectId, opts) => {
          if (!projectId) return;
          this.projectIdFromHash = String(projectId);
          const pf = opts && opts.parentFolderId != null && String(opts.parentFolderId).trim() !== '' ? String(opts.parentFolderId).trim() : null;
          this.uploadMaterialParentFolderId = pf;
          this.uploadMaterialBatch = [];
          this.uploadMaterialVisible = true;
        },
        openEditForWorkbenchProject: (projectId) => {
          if (!projectId) return;
          const pid = String(projectId);
          const target = (this.projectList || []).find((p) => String(p.id) === pid);
          if (!target) return;
          this.projectEditForm = { id: pid, name: target.name || '', description: target.description || '' };
          this._projectEditSnap = { ...this.projectEditForm };
          this.projectEditVisible = true;
        },
      };
    },
    beforeUnmount() {
      if (this._projectHashCleanup) this._projectHashCleanup();
      if (window.__demoQuoteSkillBridge && window.__demoQuoteSkillBridge._owner === this) window.__demoQuoteSkillBridge = null;
    },
    methods: {
      goToProjectDetail(id) { this.goToWorkbenchFromList(id); },
      goToWorkbenchFromList(projectId) {
        window.location.hash = 'freeaudit?projectId=' + encodeURIComponent(projectId);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      },
      onProjectCardMoreMenu(info, p) {
        const key = info && info.key;
        if (key === 'edit') {
          this.projectEditForm = { id: p.id, name: p.name || '', description: p.description || '' };
          this._projectEditSnap = { ...this.projectEditForm };
          this.projectEditVisible = true;
          return;
        }
        if (key === 'delete') {
          const dc = window.dsConfirm;
          const run = () => {
            this.projectList = (this.projectList || []).filter((x) => x.id !== p.id);
            message.success('已删除');
          };
          if (!dc || !dc.delete) {
            run();
            return;
          }
          dc.delete({
            subject: '该工作台',
            onOk: run,
          });
        }
      },
      saveProjectEdit() {
        const id = this.projectEditForm.id;
        const name = String(this.projectEditForm.name || '').trim();
        if (!id || !name) {
          message.warning('请填写工作台名称');
          return;
        }
        const i = (this.projectList || []).findIndex((x) => String(x.id) === String(id));
        if (i >= 0) {
          const desc = String(this.projectEditForm.description || '');
          this.projectList.splice(i, 1, { ...this.projectList[i], name, description: desc });
          this._projectEditSnap = { id, name, description: desc };
          message.success('保存成功');
        }
        this.projectEditVisible = false;
      },
      cancelProjectEdit() {
        const snap = this._projectEditSnap;
        if (snap) {
          this.projectEditForm = { id: snap.id, name: snap.name, description: snap.description };
        }
        this.projectEditVisible = false;
      },
      beforeUploadMaterial(file) {
        const uid = file && file.uid ? String(file.uid) : ('upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));
        this.uploadMaterialBatch.push({ uid, name: file.name, size: file.size, type: file.type });
        return false;
      },
      mockUploadMaterialSelect() {
        this.uploadMaterialBatch = [{
          uid: 'mock-upload-material',
          name: '专项债资金拨付台账.pdf',
          size: 2867200,
          type: 'application/pdf',
        }];
      },
      removeUploadMaterial(file) {
        const uid = String(file && file.uid ? file.uid : '');
        this.uploadMaterialBatch = this.uploadMaterialBatch.filter((x) => String(x.uid) !== uid);
      },
      clearUploadMaterialBatch() {
        this.uploadMaterialBatch = [];
      },
      closeUploadMaterialModal() {
        this.uploadMaterialVisible = false;
        this.uploadMaterialBatch = [];
        this.uploadMaterialParentFolderId = null;
      },
      formatUploadMaterialSize(size) {
        const bytes = Number(size || 0);
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      },
      submitUploadMaterials() {
        const pid = String(this.projectIdFromHash || this.quoteSkillTargetProjectId || '');
        if (!pid) {
          message.warning('未定位到工作台');
          return;
        }
        if (!Array.isArray(this.uploadMaterialBatch) || this.uploadMaterialBatch.length === 0) {
          message.warning('请先选择资料');
          return;
        }
        const rows = Array.isArray(demoProjectMaterialsById[pid]) ? demoProjectMaterialsById[pid] : [];
        const parentFolder = this.uploadMaterialParentFolderId ? String(this.uploadMaterialParentFolderId) : null;
        const siblingSortMax = rows.reduce((acc, r) => {
          const same = (r && String(r.parentId || '') === String(parentFolder || ''));
          if (!same) return acc;
          const s = Number(r.sort);
          return Number.isFinite(s) ? Math.max(acc, s) : acc;
        }, 0);
        this.uploadMaterialBatch.forEach((f, idx) => {
          rows.unshift({
            id: 'mat-' + Date.now() + '-' + idx,
            name: f.name || '未命名资料',
            status: 'done',
            uploadedAt: dayjs().format('YYYY-MM-DD HH:mm'),
            tags: [],
            format: String((f.name || '').split('.').pop() || '').toUpperCase() || 'FILE',
            size: Number(f.size || 0),
            parentId: parentFolder,
            sort: siblingSortMax + idx + 1,
          });
        });
        demoProjectMaterialsById[pid] = rows;
        this.uploadMaterialVisible = false;
        this.uploadMaterialBatch = [];
        this.uploadMaterialParentFolderId = null;
        message.success('已加入上传队列');
        const bridge = typeof window !== 'undefined' ? window.__demoQuoteSkillBridge : null;
        if (bridge && typeof bridge.onMaterialsUploaded === 'function') {
          try {
            bridge.onMaterialsUploaded(pid);
          } catch (_) { /* noop */ }
        }
      },
      quoteTemplateToProject(tpl) {
        const pid = String(this.quoteSkillTargetProjectId || '');
        if (!pid || !tpl) return;
        this.quoteAnalysisTemplates([tpl]);
      },
      quoteSelectedAnalysisTemplates() {
        const selected = new Set((this.analysisTemplateSelectedIds || []).map((id) => String(id)));
        if (!selected.size) return;
        const rows = (this.allAnalysisTemplatePool || []).filter((tpl) => selected.has(String(tpl.id)));
        this.quoteAnalysisTemplates(rows);
      },
      quoteAnalysisTemplates(list) {
        const pid = String(this.quoteSkillTargetProjectId || '');
        const selectedRows = Array.isArray(list) ? list.filter(Boolean) : [];
        if (!pid || !selectedRows.length) return;
        const rows = Array.isArray(demoProjectAnalysisTemplatesById[pid]) ? demoProjectAnalysisTemplatesById[pid] : [];
        let inserted = 0;
        selectedRows.forEach((tpl) => {
          const row = this.normalizeAnalysisTemplateForQuote(tpl, tpl.library || this.analysisTemplateLibraryTab);
          const exists = rows.some((x) => String(x.id) === String(row.id));
          if (!exists) {
            rows.unshift(row);
            inserted += 1;
          }
        });
        demoProjectAnalysisTemplatesById[pid] = rows;
        this.analysisTemplateSelectedIds = [];
        this.analysisTemplateModalVisible = false;
        this.analysisTemplateDetailVisible = false;
        message.success(inserted ? `已引用 ${inserted} 个技能到当前工作台` : '所选技能已在当前工作台');
      },
      toggleAnalysisTemplateSelection(tpl) {
        if (!tpl || !tpl.id) return;
        const id = String(tpl.id);
        const ids = (this.analysisTemplateSelectedIds || []).map((x) => String(x));
        this.analysisTemplateSelectedIds = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      },
      clearAnalysisTemplateFilterTags() {
        this.analysisTemplateFilterTagKeys = [];
      },
      clearAnalysisTemplateFilters() {
        this.analysisTemplateSearchKeyword = '';
        this.analysisTemplateFilterTagKeys = [];
        this.analysisTemplateFilterTagMatchMode = 'any';
        this.analysisTemplateTagSearchQuery = '';
        this.analysisTemplateFilterPopoverOpen = false;
      },
      normalizeAnalysisTemplateForQuote(tpl, library) {
        const seed = tpl || {};
        const row = {
          id: seed.id,
          name: seed.name || '未命名技能',
          description: seed.description || '',
          tags: Array.isArray(seed.tags) ? seed.tags.slice() : [],
          skillFiles: Array.isArray(seed.skillFiles) ? cloneTemplateJson(seed.skillFiles) : [],
          extractionRules: Array.isArray(seed.extractionRules) ? cloneTemplateJson(seed.extractionRules) : [],
          analysisRule: seed.analysisRule || '',
          applicableScenario: seed.applicableScenario != null ? String(seed.applicableScenario) : '',
          linkedResourceIds: Array.isArray(seed.linkedResourceIds) ? seed.linkedResourceIds.map((id) => String(id)) : [],
          linkedResourceMeta: seed.linkedResourceMeta && typeof seed.linkedResourceMeta === 'object' ? { ...seed.linkedResourceMeta } : {},
          createdAt: seed.createdAt,
          updatedAt: seed.updatedAt,
          library: library || seed.library || 'private',
        };
        if (seed.sourceSkillId) row.sourceSkillId = seed.sourceSkillId;
        if (seed.sourceLibrary) row.sourceLibrary = seed.sourceLibrary;
        if (seed.sourceSkillName) row.sourceSkillName = seed.sourceSkillName;
        if (seed.sourceVersionLabel) row.sourceVersionLabel = seed.sourceVersionLabel;
        if (Array.isArray(seed.publishedVersions)) row.publishedVersions = cloneTemplateJson(seed.publishedVersions);
        if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
          DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
        }
        return row;
      },
      openAnalysisTemplateDetail(tpl) {
        if (!tpl) return;
        this.analysisTemplateDetailRecord = this.normalizeAnalysisTemplateForQuote(tpl, tpl.library || this.analysisTemplateLibraryTab);
        this.analysisTemplateDetailVisible = true;
      },
      applyPendingNewProject() {
        const raw = sessionStorage.getItem('pendingNewProject');
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (!parsed || !parsed.id) return;
          const exists = (this.projectList || []).some((p) => String(p.id) === String(parsed.id));
          if (!exists) {
            this.projectList.push({
              id: parsed.id,
              name: parsed.name || '未命名工作台',
              description: parsed.description || '',
              visibility: parsed.visibility === 'shared' ? 'shared' : 'private',
              sharedUserIds: Array.isArray(parsed.sharedUserIds) ? parsed.sharedUserIds.slice() : [],
              sharedDeptIds: Array.isArray(parsed.sharedDeptIds) ? parsed.sharedDeptIds.slice() : [],
            });
          }
          if (!Array.isArray(demoProjectMaterialsById[parsed.id])) demoProjectMaterialsById[parsed.id] = [];
          if (typeof demoProjectMaterialFoldersById !== 'undefined' && !Array.isArray(demoProjectMaterialFoldersById[parsed.id])) {
            demoProjectMaterialFoldersById[parsed.id] = [];
          }
          if (!Array.isArray(demoProjectAnalysisTemplatesById[parsed.id])) demoProjectAnalysisTemplatesById[parsed.id] = [];
          if (!Array.isArray(demoProjectAnalysisResultsById[parsed.id])) demoProjectAnalysisResultsById[parsed.id] = [];
          if (typeof demoProjectAnalysisResultFoldersById !== 'undefined' && !Array.isArray(demoProjectAnalysisResultFoldersById[parsed.id])) {
            demoProjectAnalysisResultFoldersById[parsed.id] = [];
          }
          sessionStorage.removeItem('pendingNewProject');
        } catch (_) { /* ignore */ }
      },
      projectCardMaterialCount(projectId) {
        const rows = demoProjectMaterialsById[String(projectId)] || [];
        const total = rows.length;
        const done = rows.filter((r) => String(r.status || '') === 'done').length;
        return done + '/' + total;
      },
      projectCardAnalysisResultCount(projectId) {
        const rows = demoProjectAnalysisResultsById[String(projectId)] || [];
        const done = rows.filter((r) => String(r.status || '') === 'done').length;
        return done;
      },
      projectCardTemplateCount(projectId) {
        const rows = demoProjectAnalysisTemplatesById[String(projectId)] || [];
        return rows.length;
      },
      projectCardTaskCount(projectId) {
        const pid = String(projectId || '');
        const rows = Array.isArray(demoWorkbenchTaskRows)
          ? demoWorkbenchTaskRows.filter((r) => String((r && r.projectId) || 'PRJ-2026-001') === pid)
          : [];
        const visibleRows = rows.filter((r) => r && String(r.taskType || '') !== 'batch-child');
        const completed = visibleRows.filter((r) => ['done', 'failed'].includes(String(r.status || ''))).length;
        return completed + '/' + visibleRows.length;
      },
    },
  });
})();
