(function () {
  const app = window.__DEMO_APP;
  const BRIDGED_NAMES = [
    'auditSceneCategoryLabel',
    'clearSkillFilterTags',
    'clearSkillFiltersAndSearch',
    'copySkillToPrivateFromPublic',
    'currentSkillList',
    'currentSkillSortLabel',
    'currentSkillSortShortLabel',
    'filteredSkills',
    'isSkillDimensionFilterActive',
    'isPublicSkillMineShared',
    'isSkillFilterSelected',
    'isSkillSortSelectedByFilter',
    'onSkillAuditSceneFilterMenuClick',
    'onSkillImportFileChange',
    'onSkillSortMenuClick',
    'onTemplateCardMenu',
    'openMySharedPublicSkillConfig',
    'getSkillDimensionLabel',
    'getSkillDimensionLabels',
    'isMarketSkillIntaked',
    'openMarketSkillIntakeModal',
    'openSkillCategoryModal',
    'openSkillClassifyModal',
    'openSkillBasicModal',
    'openSkillConfig',
    'openSkillCreateUnified',
    'setSkillDimensionFilterValue',
    'setSkillLibraryTab',
    'setSkillTypeFilterTab',
    'skillAuditSceneFilterActive',
    'skillAuditSceneFilterKey',
    'skillAuditSceneFilterLabel',
    'skillAuditSceneFilterOptions',
    'skillAuditSceneFilterVisible',
    'skillEmptyDescription',
    'skillSortFilterActive',
    'skillTypeFilterTab',
    'skillTypeFilterTabs',
    'skillFilterPopoverOpen',
    'skillFilterTagKeys',
    'skillFilterTagMatchMode',
    'skillLibraryTab',
    'skillMarketSyncing',
    'syncSkillMarketFromRemote',
    'skillSearchKeyword',
    'skillSortBy',
    'skillSortOptions',
    'skillTagSearchQuery',
    'tagFilteredStats',
    'togglePrivateSkillPublicShare',
    'toggleSharedSkillStatus',
    'toggleSkillFilterTag',
    'triggerSkillImport',
    'unshareFromPublicMineSharedCard',
    'unshareSharedSkillCard',
  ];
  const bridgedComputed = {};

  BRIDGED_NAMES.forEach((name) => {
    bridgedComputed[name] = {
      get() {
        const host = this.host || {};
        const value = host[name];
        return typeof value === 'function' ? value.bind(host) : value;
      },
      set(value) {
        if (this.host) this.host[name] = value;
      },
    };
  });

  app.component('SkillLibraryVersionHistoryTable', {
    props: {
      columns: { type: Array, default: () => [] },
      history: { type: Array, default: () => [] },
      fieldsLocked: { type: Boolean, default: false },
    },
    emits: ['open-version', 'restore-version'],
    template: `
      <div class="skill-version-mgmt-history-section" role="region" aria-label="历史版本列表">
        <div class="skill-version-mgmt-history">
          <div class="ds-l2-table-panel">
            <a-table
              :columns="columns"
              :data-source="history"
              row-key="key"
              size="small"
              :pagination="false"
              class="skill-library-version-mgmt-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'versionLabel'">
                  <a-button type="link" size="small" class="skill-version-table__version-link" @click="$emit('open-version', record)">{{ record.versionLabel }}</a-button>
                </template>
                <template v-else-if="column.key === 'versionNote'">
                  <span class="skill-version-table__cell-desc" :title="record.versionNote !== '—' ? (record.versionNoteRaw || record.versionNote) : ''">{{ record.versionNote }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <span class="skill-version-mgmt-history__row-actions">
                    <a-button type="link" size="small" class="skill-version-table__version-link" @click="$emit('open-version', record)">详情</a-button>
                    <a-button type="link" size="small" :disabled="fieldsLocked" @click="$emit('restore-version', record)">回退</a-button>
                  </span>
                </template>
                <template v-else>{{ record[column.dataIndex] }}</template>
              </template>
            </a-table>
          </div>
        </div>
      </div>
    `,
  });

  app.component('TemplateVersionSnapshotBody', {
    props: {
      skill: { type: Object, default: null },
      navKey: { type: String, default: 'rule' },
      expandedKeys: { type: Array, default: () => [] },
    },
    emits: ['update:navKey', 'update:expandedKeys'],
    template: `
      <div v-if="skill" class="skill-version-history-modal skill-version-history-modal--readonly">
        <SkillConfigEditor
          :skill="skill"
          :nav-key="navKey"
          :expanded-keys="expandedKeys"
          locked
          :show-add="false"
          rule-help="该版本快照中的审计思路"
          @update:nav-key="$emit('update:navKey', $event)"
          @update:expanded-keys="$emit('update:expandedKeys', $event)"
        />
      </div>
    `,
  });

  app.component('TemplateSkillCardMoreMenu', {
    props: {
      skill: { type: Object, required: true },
      libraryTab: { type: String, required: true },
      mineShared: { type: Boolean, default: false },
    },
    emits: ['menu'],
    computed: {
      canManage() {
        return this.libraryTab === 'private' || this.mineShared;
      },
      shareMenuLabel() {
        if (this.libraryTab === 'private') {
          return this.skill && this.skill.sharedPublicSkillId ? '取消共享' : '共享';
        }
        return '取消共享';
      },
    },
    template: `
      <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
        <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--standard ds-list-card-more-btn" @click.stop aria-label="更多操作">
          <ds-icon name="more" aria-hidden="true" />
        </a-button>
        <template #overlay>
          <a-menu @click="(info) => $emit('menu', info, skill)">
            <a-menu-item key="edit">编辑</a-menu-item>
            <a-menu-item key="config">配置</a-menu-item>
            <a-menu-item v-if="canManage" key="share">{{ shareMenuLabel }}</a-menu-item>
            <a-menu-item key="export">导出</a-menu-item>
            <a-menu-item v-if="canManage" key="delete" danger>删除</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    `,
  });

  app.component('TemplateSkillCard', {
    props: {
      skill: { type: Object, required: true },
      libraryTab: { type: String, required: true },
      mineShared: { type: Boolean, default: false },
      auditSceneLabel: { type: String, default: '未分类' },
      skillTypeLabel: { type: String, default: '未分类' },
      dimensionLabels: { type: Array, default: () => [] },
      marketIntaked: { type: Boolean, default: false },
    },
    emits: [
      'classify',
      'edit',
      'intake',
      'menu',
      'open',
      'open-shared-source',
      'toggle-status',
      'toggle-share',
      'unshare-public',
    ],
    methods: {
      visibleDimensionLabels() {
        const rows = Array.isArray(this.dimensionLabels) && this.dimensionLabels.length
          ? this.dimensionLabels
          : [this.auditSceneLabel, this.skillTypeLabel];
        return rows.map((item) => String(item || '').trim()).filter(Boolean);
      },
      flattenSkillFiles(files) {
        const out = [];
        const walk = (rows) => {
          (Array.isArray(rows) ? rows : []).forEach((row) => {
            if (!row) return;
            if (row.kind === 'folder') walk(row.children || []);
            else out.push(row);
          });
        };
        walk(files || []);
        return out;
      },
      inputFileNames() {
        const inputs = this.skill && this.skill.skillInputs;
        if (Array.isArray(inputs) && inputs.length) {
          return inputs.slice(0, 3).map((item) => String(item || '').trim()).filter(Boolean);
        }
        const files = this.flattenSkillFiles(this.skill && this.skill.skillFiles);
        return files.slice(0, 3).map((file) => String(file.filename || file.name || '输入文件').trim()).filter(Boolean);
      },
      outputSummary() {
        const text = String((this.skill && this.skill.outputSummary) || '').trim();
        if (text) return text;
        const rule = String((this.skill && this.skill.analysisRule) || '').trim();
        if (rule) return '输出疑点清单，并给出风险说明与核查建议。';
        return '输出分析结果、核查结论与后续处理建议。';
      },
      usageCount() {
        const id = String((this.skill && this.skill.id) || '');
        const preset = {
          'sk-pub-1': 1286,
          'sk-pub-2': 842,
          'sk-pub-3': 736,
          'sk-pub-4': 1286,
        };
        return preset[id] || 328;
      },
      ownerLabel() {
        if (this.libraryTab === 'market') return '技能市场';
        const skill = this.skill || {};
        const org = String(skill.ownerOrg || skill.organization || skill.department || skill.dept || '').trim();
        const name = String(skill.ownerName || skill.userName || skill.createdBy || skill.sharedBy || '').trim();
        if (org && name && org !== name) return org + '-' + name;
        return name || org || '审计中心';
      },
      ownerParts() {
        if (this.libraryTab === 'market') return { name: this.sourceLabel(), org: '' };
        const skill = this.skill || {};
        let org = String(skill.ownerOrg || skill.organization || skill.department || skill.dept || '').trim();
        let name = String(skill.ownerName || skill.userName || skill.createdBy || '').trim();
        const sharedBy = String(skill.sharedBy || '').trim();
        if (!name && sharedBy) {
          const parts = sharedBy.split(/[-－—]/).map((part) => part.trim()).filter(Boolean);
          if (!org && parts.length >= 2) org = parts.slice(0, -1).join('-');
          name = parts.length >= 2 ? parts[parts.length - 1] : sharedBy;
        }
        if (!name && org) name = org;
        return { name: name || '审计中心', org: org && org !== name ? org : '' };
      },
      ownerNameLabel() {
        return this.ownerParts().name;
      },
      ownerOrgLabel() {
        return this.ownerParts().org;
      },
      updatedDateLabel() {
        const raw = String((this.skill && (this.skill.updatedAt || this.skill.createdAt)) || '').trim();
        const m = raw.match(/^\d{4}-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
        if (m) return m[1] + '-' + m[2] + ' ' + m[3] + ':' + m[4];
        const dateOnly = raw.match(/^\d{4}-(\d{2})-(\d{2})/);
        return dateOnly ? (dateOnly[1] + '-' + dateOnly[2]) : (raw.slice(0, 10) || '—');
      },
      openDefault() {
        this.$emit('config', this.skill, { readOnly: this.libraryTab === 'market' });
      },
      sourceLabel() {
        if (this.libraryTab === 'market') return '技能市场';
        return ((this.skill && this.skill.sharedBy) || '组织') + ' 共享';
      },
      menu(info) {
        this.$emit('menu', info, this.skill);
      },
      onSharedManageMenu(info) {
        const key = info && info.key;
        if (key === 'share') this.$emit('unshare-public', this.skill);
        else this.$emit('menu', info, this.skill);
      },
    },
    template: `
      <div
        class="tc-template-card tc-template-card--list ds-page-card ds-hover-lift ds-list-card ds-list-card--with-corner ds-list-card-clickable ds-l1-grid-card"
        :class="{ 'tc-template-card--public': libraryTab !== 'private' }"
        tabindex="0"
        role="button"
        :aria-label="(libraryTab === 'market' ? '查看技能配置：' : '配置技能：') + (skill.name || '')"
        @click="openDefault"
        @keydown.enter.prevent="openDefault"
        @keydown.space.prevent="openDefault"
      >
        <div class="ds-list-card-corner"></div>
        <div class="tc-template-card__body">
          <div class="tc-template-card__head">
            <div class="tc-template-card__hero-icon" aria-hidden="true">
              <ds-icon name="book-open" />
            </div>
            <div class="tc-template-card__title-block">
              <div class="tc-template-card__title-line">
                <h3 class="tc-template-card__name">{{ skill.name }}</h3>
              </div>
              <div class="tc-template-card__tags tc-template-card__tags--compact">
                <TagLg v-if="auditSceneLabel">{{ auditSceneLabel }}</TagLg>
                <TagLg v-if="skillTypeLabel">{{ skillTypeLabel }}</TagLg>
                <span class="tc-template-card__download-tag">
                  <ds-icon name="download" aria-hidden="true" />
                  <span>{{ usageCount().toLocaleString('zh-CN') }} 次下载</span>
                </span>
              </div>
            </div>
            <a-dropdown
              v-if="libraryTab === 'shared'"
              :trigger="['click']"
              placement="bottomRight"
            >
              <a-button
                type="text"
                size="small"
                class="tc-template-card__more-btn ds-icon-btn ds-icon-btn--standard"
                aria-label="更多操作"
                @click.stop
              >
                <ds-icon name="more" aria-hidden="true" />
              </a-button>
              <template #overlay>
                <a-menu @click="onSharedManageMenu">
                  <a-menu-item key="publish">发布</a-menu-item>
                  <a-menu-item key="share">取消共享</a-menu-item>
                  <a-menu-item key="export">导出</a-menu-item>
                  <a-menu-item v-if="mineShared" key="delete" danger>删除</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <p
            class="tc-template-card__desc"
            :title="(skill.description || '暂无简介，编辑技能时可补一句话说明系统能帮你做什么。')"
          >{{ skill.description || '暂无简介，编辑技能时可补一句话说明系统能帮你做什么。' }}</p>

          <div class="tc-template-card__io">
            <div class="tc-template-card__io-row">
              <span class="tc-template-card__io-label">输入</span>
              <div class="tc-template-card__file-list">
                <span v-for="name in inputFileNames()" :key="skill.id + '-file-' + name" class="tc-template-card__file-chip">
                  <ds-icon name="file-lines" aria-hidden="true" />
                  <span>{{ name }}</span>
                </span>
                <span v-if="!inputFileNames().length" class="tc-template-card__io-text">按技能配置读取审计资料。</span>
              </div>
            </div>
            <div class="tc-template-card__io-row">
              <span class="tc-template-card__io-label">输出</span>
              <span class="tc-template-card__io-text">{{ outputSummary() }}</span>
            </div>
          </div>

          <div
            v-if="libraryTab === 'shared'"
            class="ds-card-foot tc-template-card__footer"
            role="group"
            :aria-label="'技能操作：' + (skill.name || skill.id)"
            @click.stop
          >
            <div class="tc-template-card__meta">
              <span class="tc-template-card__owner">
                <ds-icon name="user" aria-hidden="true" />
                <span class="tc-template-card__owner-name">{{ ownerNameLabel() }}</span>
                <span v-if="ownerOrgLabel()" class="tc-template-card__owner-org">{{ ownerOrgLabel() }}</span>
              </span>
            </div>
            <div class="tc-template-card__footer-right">
              <span class="tc-template-card__updated"><ds-icon name="clock" aria-hidden="true" />{{ updatedDateLabel() }}</span>
              <a-button
                class="ds-trigger-btn ds-trigger-btn--icon-text tc-template-card__manage-btn"
                aria-label="编辑该技能"
                @click.stop="$emit('edit', skill, { readOnly: false })"
              >
                <ds-icon name="edit" class="ds-trigger-btn__icon" aria-hidden="true" />
                <span class="ds-trigger-btn__text">编辑</span>
              </a-button>
            </div>
          </div>

          <div
            v-else-if="libraryTab === 'market'"
            class="ds-card-foot tc-template-card__footer"
            role="group"
            :aria-label="'技能来源：' + (skill.name || skill.id)"
            @click.stop
          >
            <div class="tc-template-card__meta">
              <span><ds-icon name="user" aria-hidden="true" />{{ sourceLabel() }}</span>
            </div>
            <div class="tc-template-card__footer-right">
              <span class="tc-template-card__updated"><ds-icon name="clock" aria-hidden="true" />{{ updatedDateLabel() }}</span>
              <a-button
                class="ds-trigger-btn ds-trigger-btn--icon-text tc-template-card__manage-btn"
                aria-label="查看技能详情"
                @click.stop="$emit('edit', skill, { readOnly: true })"
              >
                <ds-icon name="eye" class="ds-trigger-btn__icon" aria-hidden="true" />
                <span class="ds-trigger-btn__text">详情</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  app.component('TemplateListPanel', {
    props: {
      host: { type: Object, required: true },
    },
    computed: bridgedComputed,
    template: `
      <div class="main-container">
        <header class="ds-page-hero ds-page-hero--l1">
          <h1 class="ds-page-hero__title ds-page-hero__title--with-icon">
            <span class="ds-page-hero__title-icon ds-page-hero__title-icon--skill-library" aria-hidden="true"><svg class="iconpark-icon"><use href="#book-open"></use></svg></span>
            <span class="ds-page-hero__title-text">技能库</span>
          </h1>
          <p class="ds-page-hero__subtitle">管理平台共享技能和上级技能市场入库内容，统一维护分类、状态与可分发技能。</p>
        </header>
        <div class="ds-l1-toolbar-rail-content-stack">
          <div class="ds-page-toolbar ds-page-toolbar--skill ds-page-toolbar--l1">
            <div class="ds-page-toolbar__tabs">
              <a-segmented
                :value="skillLibraryTab"
                class="ds-ant-segmented ds-ant-segmented--l1-skill-scope"
                size="large"
                :options="[
                  { label: '共享技能', value: 'shared' },
                  { label: '技能市场', value: 'market' },
                ]"
                aria-label="共享技能与技能市场"
                @update:value="setSkillLibraryTab"
              />
            </div>
            <div class="ds-page-toolbar__end">
              <input ref="skillImportFileInput" type="file" accept="application/json,.json" style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;" @change="onSkillImportFileChange" />
              <div v-if="skillLibraryTab === 'shared'" class="ds-page-heading-actions ds-page-toolbar__actions">
                <a-button type="primary" size="large" class="ds-btn-page-cta" title="维护业务场景与技能类型" aria-label="类型管理" @click="openSkillCategoryModal">
                  <ds-icon name="config" class="ds-btn-icon-before" />类型管理
                </a-button>
              </div>
              <div v-else-if="skillLibraryTab === 'market'" class="ds-page-heading-actions ds-page-toolbar__actions">
                <a-button
                  type="primary"
                  size="large"
                  class="ds-btn-page-cta"
                  :loading="skillMarketSyncing"
                  :disabled="skillMarketSyncing"
                  title="从上级技能市场拉取最新内容"
                  aria-label="同步技能市场"
                  @click="syncSkillMarketFromRemote"
                >
                  <ds-icon v-if="!skillMarketSyncing" name="refresh" class="ds-btn-icon-before" aria-hidden="true" />
                  {{ skillMarketSyncing ? '同步中' : '同步' }}
                </a-button>
              </div>
            </div>
          </div>

          <div class="template-library-filter workbench-v2-skill-search-row">
            <label class="workbench-v2-skill-search">
              <ds-icon name="search" class="workbench-v2-skill-search__icon" aria-hidden="true" />
              <input
                v-model="skillSearchKeyword"
                type="search"
                class="workbench-v2-skill-search__input"
                placeholder="搜索技能名称、描述"
                aria-label="搜索技能名称、描述"
              />
            </label>
            <div class="workbench-v2-skill-search-row__actions">
              <a-dropdown
                v-if="skillAuditSceneFilterVisible"
                :trigger="['click']"
                placement="bottomRight"
              >
                <button
                  type="button"
                  class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                  :class="{ 'is-active': skillAuditSceneFilterActive }"
                  :title="'按' + auditSceneCategoryLabel + '过滤'"
                  :aria-label="'按' + auditSceneCategoryLabel + '过滤'"
                  @click.stop
                >
                  <span class="workbench-v2-skill-filter-control__label">{{ auditSceneCategoryLabel }}</span>
                  <span class="workbench-v2-skill-filter-control__value">{{ skillAuditSceneFilterLabel }}</span>
                  <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                </button>
                <template #overlay>
                  <a-menu
                    :selected-keys="[skillAuditSceneFilterKey]"
                    @click="onSkillAuditSceneFilterMenuClick"
                  >
                    <a-menu-item
                      v-for="option in skillAuditSceneFilterOptions"
                      :key="option.id"
                    >
                      {{ option.label }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              <a-dropdown :trigger="['click']" placement="bottomRight">
                <button
                  type="button"
                  class="workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label"
                  :class="{ 'is-active': skillSortFilterActive }"
                  title="排序"
                  aria-label="排序"
                  @click.stop
                >
                  <span class="workbench-v2-skill-filter-control__label">排序</span>
                  <span class="workbench-v2-skill-filter-control__value">{{ currentSkillSortShortLabel }}</span>
                  <ds-icon name="chevron-down" class="workbench-v2-skill-filter-control__arrow" aria-hidden="true" />
                </button>
                <template #overlay>
                  <a-menu
                    :selected-keys="[skillSortBy]"
                    @click="onSkillSortMenuClick"
                  >
                    <a-menu-item v-for="opt in skillSortOptions" :key="opt.value">
                      {{ opt.label }}
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>

          <nav v-if="skillTypeFilterTabs.length" class="workbench-v2-skill-type-tabs template-library-type-tabs" aria-label="技能类型">
            <div class="workbench-v2-skill-tabs__list">
              <button
                v-for="tab in skillTypeFilterTabs"
                :key="'skill-type-filter-' + tab.id"
                type="button"
                class="workbench-v2-skill-tab"
                :class="{ 'is-active': skillTypeFilterTab === tab.id }"
                @click="setSkillTypeFilterTab(tab.id)"
              >
                <span>{{ tab.label }}</span>
              </button>
            </div>
          </nav>

          <div v-if="filteredSkills.length" class="ds-l1-list">
            <a-row :gutter="16" class="recent-projects-row">
              <a-col v-for="s in filteredSkills" :key="s.id" :span="12">
                <TemplateSkillCard
                  :skill="s"
                  :library-tab="skillLibraryTab"
                  :mine-shared="isPublicSkillMineShared(s)"
                  :audit-scene-label="getSkillDimensionLabel('auditScene', s.auditScene)"
                  :skill-type-label="getSkillDimensionLabel('skillType', s.skillType)"
                  :dimension-labels="getSkillDimensionLabels(s)"
                  :market-intaked="skillLibraryTab === 'market' && isMarketSkillIntaked(s)"
                  @classify="openSkillClassifyModal"
                  @config="openSkillConfig"
                  @edit="openSkillBasicModal"
                  @intake="openMarketSkillIntakeModal"
                  @menu="onTemplateCardMenu"
                  @open-shared-source="openMySharedPublicSkillConfig"
                  @toggle-status="toggleSharedSkillStatus"
                  @toggle-share="togglePrivateSkillPublicShare"
                  @unshare-public="unshareSharedSkillCard"
                />
              </a-col>
            </a-row>
          </div>
          <div v-else class="ds-page-empty-block ds-page-empty-block--l1">
            <a-empty :description="skillEmptyDescription" />
            <a-button v-if="currentSkillList.length && !filteredSkills.length" type="link" @click="clearSkillFiltersAndSearch">清除筛选与搜索</a-button>
          </div>
        </div>
      </div>
    `,
  });
})();
