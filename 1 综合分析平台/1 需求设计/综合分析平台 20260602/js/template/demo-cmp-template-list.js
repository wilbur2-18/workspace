(function () {
  const app = window.__DEMO_APP;
  const BRIDGED_NAMES = [
    'clearSkillFilterTags',
    'clearSkillFiltersAndSearch',
    'copySkillToPrivateFromPublic',
    'currentSkillList',
    'currentSkillSortLabel',
    'filteredSkills',
    'isPublicSkillMineShared',
    'isSkillFilterSelected',
    'isSkillSelected',
    'isSkillSortSelectedByFilter',
    'onSkillCardCheckboxChange',
    'onSkillImportFileChange',
    'onSkillSortMenuClick',
    'onTemplateCardMenu',
    'openMySharedPublicSkillConfig',
    'openSkillConfig',
    'openSkillCreateUnified',
    'skillEmptyDescription',
    'skillFilterPopoverOpen',
    'skillFilterTagKeys',
    'skillFilterTagMatchMode',
    'skillLibraryTab',
    'skillSearchKeyword',
    'skillSortBy',
    'skillSortDropdownOpen',
    'skillSortOptions',
    'skillTagSearchQuery',
    'tagFilteredStats',
    'togglePrivateSkillPublicShare',
    'toggleSkillFilterTag',
    'triggerSkillImport',
    'unshareFromPublicMineSharedCard',
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
    },
    emits: ['menu'],
    template: `
      <a-dropdown :trigger="['click']" placement="bottomRight" @click.stop>
        <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--standard ds-list-card-more-btn" @click.stop aria-label="更多操作">
          <ds-icon name="more" aria-hidden="true" />
        </a-button>
        <template #overlay>
          <a-menu @click="(info) => $emit('menu', info, skill)">
            <a-menu-item v-if="libraryTab === 'private'" key="copy">复制</a-menu-item>
            <a-menu-item v-if="libraryTab === 'private' && skill.sharedPublicSkillId" key="unshare">取消共享</a-menu-item>
            <a-menu-item key="export">导出</a-menu-item>
            <a-menu-item key="delete" danger :disabled="libraryTab === 'public'">删除</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    `,
  });

  app.component('TemplateSkillCard', {
    props: {
      skill: { type: Object, required: true },
      libraryTab: { type: String, required: true },
      selected: { type: Boolean, default: false },
      mineShared: { type: Boolean, default: false },
    },
    emits: [
      'add-public',
      'checkbox-change',
      'edit',
      'menu',
      'open',
      'open-shared-source',
      'toggle-share',
      'unshare-public',
    ],
    methods: {
      openDefault() {
        this.$emit('open', this.skill, { readOnly: this.libraryTab !== 'private' });
      },
      menu(info) {
        this.$emit('menu', info, this.skill);
      },
    },
    template: `
      <div
        class="tc-template-card tc-template-card--list ds-page-card ds-hover-lift ds-list-card ds-list-card--with-corner ds-list-card-clickable ds-l1-grid-card"
        :class="{ 'tc-template-card--public': libraryTab === 'public', 'is-skill-selected': selected }"
        tabindex="0"
        role="button"
        :aria-label="(libraryTab === 'private' ? '编辑技能：' : '查看技能：') + (skill.name || '')"
        @click="openDefault"
        @keydown.enter.prevent="openDefault"
        @keydown.space.prevent="openDefault"
      >
        <div class="template-card-select-check" @click.stop @mousedown.stop>
          <a-checkbox
            :checked="selected"
            @change="(e) => $emit('checkbox-change', skill, e)"
            @click.stop
          />
        </div>
        <div class="ds-list-card-corner"></div>
        <div class="tc-template-card__body">
          <div class="tc-template-card__title-row">
            <div class="tc-template-card__title-cluster">
              <h3 class="tc-template-card__name">{{ skill.name }}</h3>
            </div>
          </div>
          <p
            class="tc-template-card__desc"
            :title="(skill.description || '暂无简介，编辑技能时可补一句话说明系统能帮你做什么。')"
          >{{ skill.description || '暂无简介，编辑技能时可补一句话说明系统能帮你做什么。' }}</p>
          <div class="tc-template-card__tags tc-template-card__tags--compact">
            <TagLg v-for="t in skill.tags" :key="skill.id + '-' + t">{{ t }}</TagLg>
            <span v-if="!skill.tags || !skill.tags.length" class="ds-text-micro-secondary">未打标签</span>
          </div>

          <div
            v-if="libraryTab === 'private'"
            class="ds-card-foot"
            role="group"
            :aria-label="'技能操作：' + (skill.name || skill.id)"
            @click.stop
          >
            <span v-if="skill.sharedPublicSkillId" class="ds-status-pill is-success ds-status-pill--card-footer" aria-label="共享状态：已共享">
              <span class="ds-status-pill__dot"></span>
              <span class="ds-status-pill__label">已共享</span>
            </span>
            <a-button
              class="ds-trigger-btn ds-trigger-btn--icon-text"
              :title="skill.sharedPublicSkillId ? '取消该技能的共享状态' : '将该技能共享到共享技能库'"
              :aria-label="skill.sharedPublicSkillId ? '取消共享该技能' : '共享该技能'"
              @click.stop="$emit('toggle-share', skill)"
            >
              <ds-icon v-if="skill.sharedPublicSkillId" name="unlink" class="ds-trigger-btn__icon" aria-hidden="true" />
              <svg v-else class="iconpark-icon ds-trigger-btn__icon" aria-hidden="true"><use href="#link-one"></use></svg>
              <span class="ds-trigger-btn__text">{{ skill.sharedPublicSkillId ? '取消共享' : '共享' }}</span>
            </a-button>
            <a-button
              class="ds-trigger-btn ds-trigger-btn--icon-text"
              title="编辑技能基本信息与配置"
              aria-label="编辑该技能"
              @click.stop="$emit('edit', skill, { readOnly: false })"
            >
              <ds-icon name="edit" class="ds-trigger-btn__icon" aria-hidden="true" />
              <span class="ds-trigger-btn__text">编辑</span>
            </a-button>
            <TemplateSkillCardMoreMenu :skill="skill" :library-tab="libraryTab" @menu="menu" />
          </div>

          <div
            v-else-if="libraryTab === 'public' && mineShared"
            class="ds-card-foot"
            role="group"
            :aria-label="'本人共享的技能：' + (skill.name || skill.id)"
            @click.stop
          >
            <span class="ds-status-pill is-success ds-status-pill--card-footer" aria-label="共享状态：我共享">
              <span class="ds-status-pill__dot"></span>
              <span class="ds-status-pill__label">我 共享</span>
            </span>
            <div class="ds-list-card-actions-row ds-list-card-actions-row--card-footer">
              <div class="ds-list-card-action-cell">
                <a-button
                  class="ds-trigger-btn ds-trigger-btn--icon-text"
                  title="在「我的技能」中编辑该技能"
                  aria-label="编辑该技能"
                  @click.stop="$emit('open-shared-source', skill)"
                >
                  <ds-icon name="edit" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">编辑</span>
                </a-button>
              </div>
              <div class="ds-list-card-action-cell">
                <a-button
                  class="ds-trigger-btn ds-trigger-btn--icon-text"
                  title="从共享技能库撤回该共享"
                  aria-label="取消共享"
                  @click.stop="$emit('unshare-public', skill)"
                >
                  <ds-icon name="unlink" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">取消共享</span>
                </a-button>
              </div>
              <div class="ds-list-card-action-cell">
                <TemplateSkillCardMoreMenu :skill="skill" :library-tab="libraryTab" @menu="menu" />
              </div>
            </div>
          </div>

          <div
            v-else-if="libraryTab === 'public'"
            class="ds-card-foot"
            role="group"
            :aria-label="'共享技能：' + (skill.name || skill.id)"
            @click.stop
          >
            <span class="ds-text-micro-secondary ds-card-footer-share-text" :aria-label="'共享状态：' + (skill.sharedBy || '平台') + '共享'">{{ (skill.sharedBy || '平台') + ' 共享' }}</span>
            <div class="ds-list-card-actions-row ds-list-card-actions-row--card-footer">
              <div class="ds-list-card-action-cell">
                <a-button
                  class="ds-trigger-btn ds-trigger-btn--icon-text"
                  title="复制到我的技能库，可在「我的技能」中编辑"
                  aria-label="添加到我的技能"
                  @click.stop="$emit('add-public', skill)"
                >
                  <ds-icon name="plus" class="ds-trigger-btn__icon" aria-hidden="true" />
                  <span class="ds-trigger-btn__text">添加到我的</span>
                </a-button>
              </div>
              <div class="ds-list-card-action-cell">
                <TemplateSkillCardMoreMenu :skill="skill" :library-tab="libraryTab" @menu="menu" />
              </div>
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
          <p class="ds-page-hero__subtitle">把常用的审计分析方法转化为“技能”，在多个审计项目里复用；支持从共享技能复制到我的技能并独立维护。</p>
        </header>
        <div class="ds-l1-toolbar-rail-content-stack">
          <div class="ds-page-toolbar ds-page-toolbar--skill ds-page-toolbar--l1">
            <div class="ds-page-toolbar__tabs">
              <a-segmented
                v-model:value="skillLibraryTab"
                class="ds-ant-segmented ds-ant-segmented--l1-skill-scope"
                size="large"
                :options="[
                  { label: '我的技能', value: 'private' },
                  { label: '共享技能', value: 'public' },
                ]"
                aria-label="我的技能与共享技能"
              />
            </div>
            <div class="ds-page-toolbar__end">
              <input ref="skillImportFileInput" type="file" accept="application/json,.json" style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;" @change="onSkillImportFileChange" />
              <div v-if="skillLibraryTab === 'private'" class="ds-page-heading-actions ds-page-toolbar__actions">
                <a-button size="large" class="ds-btn-page-secondary ds-btn--icon-text" title="从 JSON 文件导入技能" aria-label="导入技能" @click="triggerSkillImport">
                  <ds-icon name="file-import" class="ds-btn-icon-before" />导入技能
                </a-button>
                <a-button type="primary" size="large" class="ds-btn-page-cta" title="新建一条技能" aria-label="创建技能" @click="openSkillCreateUnified">
                  <ds-icon name="plus" class="ds-btn-icon-before" />创建技能
                </a-button>
              </div>
            </div>
          </div>

          <ui-info-control-rail aria-label="列表统计与筛选排序">
            <template #total>
              <span class="ds-l1-stat-line">
                <span>共 {{ filteredSkills.length }} 个技能</span>
              </span>
            </template>
            <template #selection></template>
            <template #query>
              <a-input
                v-model:value="skillSearchKeyword"
                placeholder="搜索"
                size="middle"
                class="l1-rail-inline-search ds-input-inline-search"
                allow-clear
                aria-label="搜索"
              >
                <template #prefix>
                  <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
                </template>
              </a-input>
            </template>
            <template #filter>
              <div class="ds-l1-tag-filter-group">
                <a-popover
                  v-model:open="skillFilterPopoverOpen"
                  trigger="click"
                  placement="bottomLeft"
                  :arrow="false"
                  overlayClassName="skill-filter-popover-inner skill-filter-popover-inner--l1"
                >
                  <template #content>
                    <div class="skill-filter-popover-body skill-filter-popover-body--skill-l1">
                      <div class="ds-l1-popover-row ds-l1-popover-row--selected">
                        <div class="ds-l1-popover-selected-main">
                          <span class="ds-l1-popover-line-label">已选：</span>
                          <span
                            class="ds-l1-popover-selected-text"
                            :title="skillFilterTagKeys.length ? skillFilterTagKeys.join('、') : ''"
                          >{{ skillFilterTagKeys.length ? skillFilterTagKeys.join('、') : '暂无' }}</span>
                        </div>
                        <a-button
                          v-if="skillFilterTagKeys.length"
                          type="link"
                          size="small"
                          class="ds-l1-popover-clear-link"
                          @click="clearSkillFilterTags"
                        >清空</a-button>
                      </div>
                      <div class="ds-l1-popover-row ds-l1-popover-row--match" role="group" aria-labelledby="skill-l1-popover-match-label">
                        <span id="skill-l1-popover-match-label" class="ds-l1-popover-line-label">多标签匹配：</span>
                        <a-radio-group v-model:value="skillFilterTagMatchMode" size="small" class="ds-l1-popover-match-radios">
                          <a-radio value="any">满足任意</a-radio>
                          <a-radio value="all">满足全部</a-radio>
                        </a-radio-group>
                      </div>
                      <div class="ds-l1-popover-row ds-l1-popover-row--search">
                        <span class="ds-l1-popover-line-label">当前标签：</span>
                        <a-input
                          v-model:value="skillTagSearchQuery"
                          allow-clear
                          placeholder="搜索"
                          size="small"
                          class="ds-input-inline-search ds-input-inline-search--popover"
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
                            :key="'d-filter-' + item.tag"
                            variant="filter"
                            :active="skillFilterTagKeys.includes(item.tag)"
                            :count="item.count"
                            @click="toggleSkillFilterTag(item.tag)"
                          >{{ item.tag }}</TagSm>
                        </template>
                        <span v-else class="skill-filter-empty">无匹配标签</span>
                      </div>
                    </div>
                  </template>
                  <button
                    type="button"
                    class="ds-trigger-btn ds-trigger-btn--icon-text"
                    :class="{ 'is-active': skillFilterPopoverOpen || isSkillFilterSelected, 'is-open': skillFilterPopoverOpen }"
                    :title="skillFilterTagKeys.length ? ('筛选标签（已选 ' + skillFilterTagKeys.length + ' 个）') : '筛选标签'"
                    aria-label="筛选标签"
                    :aria-expanded="skillFilterPopoverOpen ? 'true' : 'false'"
                  >
                    <ds-icon name="filter" class="ds-trigger-btn__icon" aria-hidden="true" />
                    <span class="ds-trigger-btn__text">标签</span>
                    <span v-if="skillFilterTagKeys.length" class="ds-l1-tag-picker-trigger__count">{{ skillFilterTagKeys.length }}</span>
                  </button>
                </a-popover>
              </div>
            </template>
            <template #sort>
              <div class="ds-l1-sort-wrap">
                <a-dropdown v-model:open="skillSortDropdownOpen" :trigger="['click']" placement="bottomRight">
                  <button
                    type="button"
                    class="ds-trigger-btn ds-trigger-btn--icon-text"
                    :class="{ 'is-active': skillSortDropdownOpen || isSkillSortSelectedByFilter, 'is-open': skillSortDropdownOpen }"
                    :title="'排序：' + currentSkillSortLabel"
                    aria-label="选择排序方式"
                    :aria-expanded="skillSortDropdownOpen ? 'true' : 'false'"
                  >
                    <ds-icon name="arrow-down-short-wide" class="ds-trigger-btn__icon" aria-hidden="true" />
                    <span class="ds-trigger-btn__text">排序</span>
                  </button>
                  <template #overlay>
                    <a-menu @click="onSkillSortMenuClick">
                      <a-menu-item v-for="opt in skillSortOptions" :key="opt.value">
                        <span class="ds-trigger-menu-item-label">
                          <ds-icon
                            v-if="skillSortBy === opt.value"
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

          <div v-if="filteredSkills.length" class="ds-l1-list">
            <a-row :gutter="16" class="recent-projects-row">
              <a-col v-for="s in filteredSkills" :key="s.id" :span="8">
                <TemplateSkillCard
                  :skill="s"
                  :library-tab="skillLibraryTab"
                  :selected="isSkillSelected(s.id)"
                  :mine-shared="isPublicSkillMineShared(s)"
                  @add-public="copySkillToPrivateFromPublic"
                  @checkbox-change="onSkillCardCheckboxChange"
                  @edit="openSkillConfig"
                  @menu="onTemplateCardMenu"
                  @open="openSkillConfig"
                  @open-shared-source="openMySharedPublicSkillConfig"
                  @toggle-share="togglePrivateSkillPublicShare"
                  @unshare-public="unshareFromPublicMineSharedCard"
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
