(function () {
  const app = window.__DEMO_APP;

  app.component('ProjectCenterCard', {
    props: {
      project: { type: Object, required: true },
      cardMaterialCount: { type: Function, required: true },
      cardAnalysisResultCount: { type: Function, required: true },
      cardTemplateCount: { type: Function, required: true },
      cardTaskCount: { type: Function, required: true },
    },
    emits: ['open-detail', 'card-menu'],
    template: `
      <div
        class="ds-page-card ds-hover-lift ds-list-card ds-list-card--with-corner project-center-list-card ds-list-card-clickable ds-l1-grid-card"
        tabindex="0"
        role="button"
        :aria-label="'打开工作台：' + (project.name || '')"
        @click="$emit('open-detail', project.id)"
        @keydown.enter.prevent="$emit('open-detail', project.id)"
        @keydown.space.prevent="$emit('open-detail', project.id)"
      >
        <a-dropdown class="ds-list-card-corner" :trigger="['click']" placement="bottomRight" @click.stop>
          <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--standard ds-list-card-more-btn" @click.stop aria-label="更多操作">
            <ds-icon name="more" aria-hidden="true" />
          </a-button>
          <template #overlay>
            <a-menu @click="(info) => $emit('card-menu', info, project)">
              <a-menu-item key="edit">编辑</a-menu-item>
              <a-menu-item key="delete" danger>删除</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
        <div class="ds-list-card-body">
          <h3 class="ds-list-card-title">{{ project.name }}</h3>
          <p class="project-center-card-desc" :title="project.description || '暂无描述'">{{ project.description || '暂无描述' }}</p>
          <div class="project-center-card-stats ds-space-stat-row" role="group" aria-label="工作台统计">
            <span
              class="ds-space-stat-hit ds-space-stat-hit--materials"
              :aria-label="'资源 ' + cardMaterialCount(project.id)"
              @click.stop
            >
              <span class="ds-space-stat-hit__icon" aria-hidden="true"><ds-icon name="file-lines" role="presentation" /></span>
              <span class="ds-space-stat-hit__num tabular-nums">{{ cardMaterialCount(project.id) }}</span>
            </span>
            <span
              class="ds-space-stat-hit ds-space-stat-hit--skills"
              :aria-label="'技能 ' + cardTemplateCount(project.id) + ' 个'"
              @click.stop
            >
              <span class="ds-space-stat-hit__icon" aria-hidden="true"><svg class="iconpark-icon" role="presentation"><use href="#book-open"></use></svg></span>
              <span class="ds-space-stat-hit__num tabular-nums">{{ cardTemplateCount(project.id) }}</span>
            </span>
            <span
              class="ds-space-stat-hit ds-space-stat-hit--tasks"
              :aria-label="'任务 ' + cardTaskCount(project.id)"
              @click.stop
            >
              <span class="ds-space-stat-hit__icon" aria-hidden="true"><ds-icon name="check-circle" role="presentation" /></span>
              <span class="ds-space-stat-hit__num tabular-nums">{{ cardTaskCount(project.id) }}</span>
            </span>
            <span
              class="ds-space-stat-hit ds-space-stat-hit--results"
              :aria-label="'结果 ' + cardAnalysisResultCount(project.id) + ' 条'"
              @click.stop
            >
              <span class="ds-space-stat-hit__icon" aria-hidden="true"><svg class="iconpark-icon" role="presentation"><use href="#notes"></use></svg></span>
              <span class="ds-space-stat-hit__num tabular-nums">{{ cardAnalysisResultCount(project.id) }}</span>
            </span>
          </div>
          <div class="ds-card-foot" @click.stop>
            <div class="project-center-card-actions">
              <a
                class="workbench-v2-card-entry"
                :href="workbenchV2Href(project.id)"
                target="_blank"
                rel="noopener"
                title="新页面打开新版工作台"
                aria-label="新页面打开新版工作台"
                @click.stop
              >V2</a>
              <a-button class="ds-trigger-btn ds-trigger-btn--icon-text" @click.stop="$emit('open-detail', project.id)">
                <ds-icon name="play" class="ds-trigger-btn__icon" aria-hidden="true" /><span class="ds-trigger-btn__text">继续审计</span>
              </a-button>
            </div>
          </div>
        </div>
      </div>
    `,
    methods: {
      workbenchV2Href(projectId) {
        return './demo.html#freeaudit-v2?projectId=' + encodeURIComponent(projectId);
      },
    },
  });

  app.component('ProjectTemplatePickerPanel', {
    props: {
      searchKeyword: { type: String, default: '' },
      libraryTab: { type: String, default: 'private' },
      filterTagKeys: { type: Array, default: () => [] },
      filterTagMatchMode: { type: String, default: 'any' },
      filterPopoverOpen: { type: Boolean, default: false },
      sortBy: { type: String, default: 'updated_desc' },
      sortDropdownOpen: { type: Boolean, default: false },
      tagSearchQuery: { type: String, default: '' },
      templates: { type: Array, default: () => [] },
      templateTotalCount: { type: Number, default: 0 },
      selectedIds: { type: Array, default: () => [] },
      tagFilteredStats: { type: Array, default: () => [] },
      sortOptions: { type: Array, default: () => [] },
      currentSortLabel: { type: String, default: '排序' },
    },
    emits: [
      'update:searchKeyword',
      'update:libraryTab',
      'update:filterTagKeys',
      'update:filterTagMatchMode',
      'update:filterPopoverOpen',
      'update:sortBy',
      'update:sortDropdownOpen',
      'update:tagSearchQuery',
      'quote',
      'detail',
      'toggle-select',
      'clear-filters',
      'clear-tags',
    ],
    computed: {
      selectedIdSet() {
        return new Set((this.selectedIds || []).map((id) => String(id)));
      },
      isFilterSelected() {
        return (this.filterTagKeys || []).length > 0;
      },
      isSortSelected() {
        return this.sortBy !== 'updated_desc';
      },
      totalLabel() {
        const total = Number(this.templateTotalCount || 0);
        if (!total || total === this.templates.length) return `共 ${this.templates.length} 个技能`;
        return `共 ${this.templates.length}/${total} 个技能`;
      },
      hasActiveQueryOrFilter() {
        return !!String(this.searchKeyword || '').trim() || (this.filterTagKeys || []).length > 0;
      },
      selectedLabel() {
        const count = (this.selectedIds || []).length;
        return count ? `已选 ${count} 个` : '';
      },
    },
    methods: {
      isSelected(tpl) {
        return tpl && this.selectedIdSet.has(String(tpl.id));
      },
      toggleFilterTag(tag) {
        const key = String(tag || '').trim();
        if (!key) return;
        const current = (this.filterTagKeys || []).map((item) => String(item));
        const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
        this.$emit('update:filterTagKeys', next);
      },
      onSortMenuClick(info) {
        this.$emit('update:sortBy', info && info.key ? info.key : 'updated_desc');
        this.$emit('update:sortDropdownOpen', false);
      },
    },
    template: `
      <div class="analysis-template-picker">
        <div class="ds-page-toolbar ds-page-toolbar--skill ds-page-toolbar--l1 ds-page-toolbar--modal-picker">
          <div class="ds-page-toolbar__tabs">
            <a-segmented
              class="ds-ant-segmented ds-ant-segmented--l1-skill-scope"
              size="large"
              :value="libraryTab"
              :options="[
                { label: '我的技能', value: 'private' },
                { label: '共享技能', value: 'public' },
              ]"
              aria-label="我的技能与共享技能"
              @update:value="$emit('update:libraryTab', $event)"
            />
          </div>
        </div>

        <ui-info-control-rail aria-label="技能列表统计与筛选排序">
          <template #total>
            <span class="ds-l1-stat-line">
              <span>{{ totalLabel }}</span>
            </span>
          </template>
          <template #selection>
            <span v-if="selectedLabel" class="analysis-template-picker-row__selected-hint">{{ selectedLabel }}</span>
          </template>
          <template #query>
            <a-input
              :value="searchKeyword"
              allow-clear
              placeholder="搜索"
              size="middle"
              class="l1-rail-inline-search ds-input-inline-search"
              aria-label="搜索技能"
              @update:value="$emit('update:searchKeyword', $event)"
            >
              <template #prefix><ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" /></template>
            </a-input>
          </template>
          <template #filter>
            <div class="ds-l1-tag-filter-group">
              <a-popover
                :open="filterPopoverOpen"
                trigger="click"
                placement="bottomLeft"
                :arrow="false"
                overlayClassName="skill-filter-popover-inner skill-filter-popover-inner--l1"
                @update:open="$emit('update:filterPopoverOpen', $event)"
              >
                <template #content>
                  <div class="skill-filter-popover-body skill-filter-popover-body--skill-l1">
                    <div class="ds-l1-popover-row ds-l1-popover-row--selected">
                      <div class="ds-l1-popover-selected-main">
                        <span class="ds-l1-popover-line-label">已选：</span>
                        <span
                          class="ds-l1-popover-selected-text"
                          :title="filterTagKeys.length ? filterTagKeys.join('、') : ''"
                        >{{ filterTagKeys.length ? filterTagKeys.join('、') : '暂无' }}</span>
                      </div>
                      <a-button
                        v-if="filterTagKeys.length"
                        type="link"
                        size="small"
                        class="ds-l1-popover-clear-link"
                        @click="$emit('clear-tags')"
                      >清空</a-button>
                    </div>
                    <div class="ds-l1-popover-row ds-l1-popover-row--match" role="group" aria-labelledby="analysis-template-picker-match-label">
                      <span id="analysis-template-picker-match-label" class="ds-l1-popover-line-label">多标签匹配：</span>
                      <a-radio-group
                        :value="filterTagMatchMode"
                        size="small"
                        class="ds-l1-popover-match-radios"
                        @update:value="$emit('update:filterTagMatchMode', $event)"
                      >
                        <a-radio value="any">满足任意</a-radio>
                        <a-radio value="all">满足全部</a-radio>
                      </a-radio-group>
                    </div>
                    <div class="ds-l1-popover-row ds-l1-popover-row--search">
                      <span class="ds-l1-popover-line-label">当前标签：</span>
                      <a-input
                        :value="tagSearchQuery"
                        allow-clear
                        placeholder="搜索"
                        size="small"
                        class="ds-input-inline-search ds-input-inline-search--popover"
                        @update:value="$emit('update:tagSearchQuery', $event)"
                      >
                        <template #prefix>
                          <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
                        </template>
                      </a-input>
                    </div>
                    <div class="skill-filter-tags skill-filter-tags--popover">
                      <template v-if="tagFilteredStats.length">
                        <TagSm
                          v-for="item in tagFilteredStats"
                          :key="'quote-filter-' + item.tag"
                          variant="filter"
                          :active="filterTagKeys.includes(item.tag)"
                          :count="item.count"
                          @click="toggleFilterTag(item.tag)"
                        >{{ item.tag }}</TagSm>
                      </template>
                      <span v-else class="skill-filter-empty">无匹配标签</span>
                    </div>
                  </div>
                </template>
                <button
                  type="button"
                  class="ds-trigger-btn ds-trigger-btn--icon-text"
                  :class="{ 'is-active': filterPopoverOpen || isFilterSelected, 'is-open': filterPopoverOpen }"
                  :title="filterTagKeys.length ? ('筛选标签（已选 ' + filterTagKeys.length + ' 个）') : '筛选标签'"
                  aria-label="筛选标签"
                  :aria-expanded="filterPopoverOpen ? 'true' : 'false'"
                >
                  <ds-icon name="filter" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">标签</span>
                  <span v-if="filterTagKeys.length" class="ds-l1-tag-picker-trigger__count">{{ filterTagKeys.length }}</span>
                </button>
              </a-popover>
            </div>
          </template>
          <template #sort>
            <div class="ds-l1-sort-wrap">
              <a-dropdown
                :open="sortDropdownOpen"
                :trigger="['click']"
                placement="bottomRight"
                @update:open="$emit('update:sortDropdownOpen', $event)"
              >
                <button
                  type="button"
                  class="ds-trigger-btn ds-trigger-btn--icon-text"
                  :class="{ 'is-active': sortDropdownOpen || isSortSelected, 'is-open': sortDropdownOpen }"
                  :title="'排序：' + currentSortLabel"
                  aria-label="选择排序方式"
                  :aria-expanded="sortDropdownOpen ? 'true' : 'false'"
                >
                  <ds-icon name="arrow-down-short-wide" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">排序</span>
                </button>
                <template #overlay>
                  <a-menu @click="onSortMenuClick">
                    <a-menu-item v-for="opt in sortOptions" :key="opt.value">
                      <span class="ds-trigger-menu-item-label">
                        <ds-icon
                          v-if="sortBy === opt.value"
                          name="check"
                          style="font-size:var(--ds-type-icon-inline-fs);line-height:var(--ds-type-icon-symbol-lh);"
                        />
                        <span v-else style="width:var(--ds-icon-chevron-placeholder-w);"></span>
                        {{ opt.label }}
                      </span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </template>
        </ui-info-control-rail>

        <div class="project-detail-template-scroll analysis-template-picker-scroll">
          <a-row v-if="templates.length" :gutter="16" class="recent-projects-row project-detail-proj-template-grid">
            <a-col v-for="tpl in templates" :key="tpl.id" :span="8">
              <div
                class="tc-template-card ds-page-card ds-list-card project-detail-proj-template-card project-detail-proj-template-card--selectable"
                :class="{ 'is-skill-library-selected': isSelected(tpl) }"
                tabindex="0"
                role="checkbox"
                :aria-checked="isSelected(tpl) ? 'true' : 'false'"
                :aria-label="'选择技能：' + (tpl.name || '')"
                @click="$emit('toggle-select', tpl)"
                @keydown.enter.prevent="$emit('toggle-select', tpl)"
                @keydown.space.prevent="$emit('toggle-select', tpl)"
              >
                <div class="template-card-select-check project-detail-proj-template-card__chk" @click.stop>
                  <a-checkbox
                    :checked="isSelected(tpl)"
                    :aria-label="'选择技能：' + (tpl.name || '')"
                    @change="$emit('toggle-select', tpl)"
                  />
                </div>
                <div class="tc-template-card__body">
                  <div class="tc-template-card__title-row">
                    <div class="tc-template-card__title-cluster">
                      <h3 class="tc-template-card__name">{{ tpl.name }}</h3>
                    </div>
                  </div>
                  <p class="tc-template-card__desc">{{ tpl.description || '暂无描述' }}</p>
                  <div class="ds-card-foot" @click.stop>
                    <div class="ds-list-card-actions-row ds-list-card-actions-row--card-footer">
                      <div class="ds-list-card-action-cell">
                        <a-button class="ds-trigger-btn ds-trigger-btn--icon-text" @click.stop="$emit('detail', tpl)">
                          <ds-icon name="eye" class="ds-trigger-btn__icon" aria-hidden="true" />
                          <span class="ds-trigger-btn__text">详情</span>
                        </a-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </a-col>
          </a-row>
          <div v-else class="ds-page-empty-block ds-page-empty-block--l1">
            <a-empty description="暂无可引用技能" />
            <a-button v-if="hasActiveQueryOrFilter" type="link" @click="$emit('clear-filters')">清除筛选与搜索</a-button>
          </div>
        </div>
      </div>
    `,
  });

  /* === DEMO:project-list · 工作台卡片列表（子组件） === */
  app.component('ProjectCenterListPanel', {
    props: {
      projectListSearch: { type: String, default: '' },
      filteredProjectList: { type: Array, default: () => [] },
      emptyDescription: { type: String, default: '' },
      cardMaterialCount: { type: Function, required: true },
      cardAnalysisResultCount: { type: Function, required: true },
      cardTemplateCount: { type: Function, required: true },
      cardTaskCount: { type: Function, required: true },
      projectTotalCount: { type: Number, default: 0 },
      projectSortBy: { type: String, default: 'created_desc' },
      projectSortOptions: { type: Array, default: () => [] },
      /** 'mine' | 'shared' — 与父级 projectListScope 同步 */
      projectListScope: { type: String, default: 'mine' },
    },
    emits: [
      'update:projectListSearch',
      'update:projectListScope',
      'update:projectSortBy',
      'create-space',
      'open-detail',
      'open-workbench',
      'card-menu',
      'clear-search',
    ],
    template: `
      <div class="main-container">
          <header class="ds-page-hero ds-page-hero--l1" aria-label="工作台">
            <h1 class="ds-page-hero__title ds-page-hero__title--with-icon">
              <span class="ds-page-hero__title-icon ds-page-hero__title-icon--audit-space" aria-hidden="true"><svg class="iconpark-icon"><use href="#workbench"></use></svg></span>
              <span class="ds-page-hero__title-text">工作台</span>
            </h1>
            <p class="ds-page-hero__subtitle">在此开启审计任务，围绕工作台持续管理资料、技能与结果，并进入对话协同分析。</p>
          </header>
          <div class="ds-l1-toolbar-rail-content-stack">
          <div class="ds-page-toolbar ds-page-toolbar--l1 ds-page-toolbar--split">
            <div class="ds-page-toolbar__start">
              <a-segmented
                class="ds-ant-segmented ds-ant-segmented--l1-skill-scope"
                size="large"
                :value="projectListScope"
                :options="[
                  { label: '我的工作台', value: 'mine' },
                  { label: '共享工作台', value: 'shared' },
                ]"
                aria-label="我的工作台与共享工作台"
                @update:value="$emit('update:projectListScope', $event)"
              />
            </div>
            <div class="ds-page-toolbar__end">
              <div class="ds-page-heading-actions ds-page-toolbar__actions">
                <a-button type="primary" size="large" class="ds-btn-page-cta" @click="$emit('create-space')"><ds-icon name="plus" class="ds-btn-icon-before" />创建工作台</a-button>
              </div>
            </div>
          </div>

          <ui-info-control-rail aria-label="列表统计与排序">
            <template #total>
              <span class="ds-l1-stat-line">
                <span>共 {{ filteredProjectList.length }} 个工作台</span>
              </span>
            </template>
            <template #query>
              <a-input
                :value="projectListSearch"
                placeholder="搜索"
                size="middle"
                class="l1-rail-inline-search ds-input-inline-search"
                allow-clear
                aria-label="搜索"
                @update:value="$emit('update:projectListSearch', $event)"
              >
                <template #prefix>
                  <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
                </template>
              </a-input>
            </template>
            <template #sort>
              <div class="ds-l1-sort-wrap">
                <a-dropdown v-model:open="projectSortDropdownOpen" :trigger="['click']" placement="bottomRight">
                  <button
                    type="button"
                    class="ds-trigger-btn ds-trigger-btn--icon-text"
                    :class="{ 'is-active': projectSortDropdownOpen || isProjectSortSelected, 'is-open': projectSortDropdownOpen }"
                    :title="'排序：' + currentProjectSortLabel"
                    aria-label="选择排序方式"
                    :aria-expanded="projectSortDropdownOpen ? 'true' : 'false'"
                  >
                    <ds-icon name="arrow-down-short-wide" class="ds-trigger-btn__icon" aria-hidden="true" />
                    <span class="ds-trigger-btn__text">排序</span>
                  </button>
                  <template #overlay>
                    <a-menu @click="onProjectSortMenuClick">
                      <a-menu-item v-for="opt in projectSortOptions" :key="opt.value">
                        <span class="ds-trigger-menu-item-label">
                          <ds-icon v-if="projectSortBy === opt.value"
                            name="check"
                            style="font-size:var(--ds-type-icon-inline-fs);line-height:var(--ds-type-icon-symbol-lh);"
                           />
                          <span v-else style="width:var(--ds-icon-chevron-placeholder-w);"></span>
                          {{ opt.label }}
                        </span>
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </div>
            </template>
          </ui-info-control-rail>

          <div class="ds-l1-list">
          <a-row :gutter="16" class="recent-projects-row">
            <a-col v-for="p in filteredProjectList" :key="p.id" :span="8">
              <ProjectCenterCard
                :project="p"
                :card-material-count="cardMaterialCount"
                :card-analysis-result-count="cardAnalysisResultCount"
                :card-template-count="cardTemplateCount"
                :card-task-count="cardTaskCount"
                @open-detail="$emit('open-detail', $event)"
                @card-menu="(info, row) => $emit('card-menu', info, row)"
              />
            </a-col>
          </a-row>
          </div>
          <div v-if="!filteredProjectList.length" class="ds-page-empty-block ds-page-empty-block--l1">
            <a-empty :description="emptyDescription" />
            <template v-if="projectTotalCount === 0">
              <a-button type="primary" size="large" class="ds-btn-page-cta" @click="$emit('create-space')"><ds-icon name="plus" class="ds-btn-icon-before" />创建工作台</a-button>
            </template>
            <template v-else-if="(projectListSearch || '').trim()">
              <a-button type="default" @click="$emit('clear-search')">清除搜索</a-button>
            </template>
          </div>
          </div>
      </div>
    `,
    methods: {
      onProjectSortMenuClick(info) {
        const next = info && info.key ? String(info.key) : '';
        if (!next) return;
        this.$emit('update:projectSortBy', next);
        this.projectSortDropdownOpen = false;
      },
    },
    computed: {
      currentProjectSortLabel() {
        const list = this.projectSortOptions || [];
        const hit = list.find((opt) => String(opt.value) === String(this.projectSortBy || ''));
        return hit ? hit.label : '排序';
      },
      isProjectSortSelected() {
        return String(this.projectSortBy || '') !== 'created_desc';
      },
    },
    data() {
      return {
        projectSortDropdownOpen: false,
      };
    },
  });
})();
