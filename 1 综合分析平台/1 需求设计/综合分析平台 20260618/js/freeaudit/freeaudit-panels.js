(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};
  const panels = NS.panels = NS.panels || {};
  const app = window.__DEMO_APP;
  const toolbarBtnClass = 'ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn';

  function toolbarSearchButton(openExpr, toggleHandler) {
    return `
      <a-tooltip :title="${openExpr} ? '收起搜索' : '搜索'">
        <a-button type="text" class="${toolbarBtnClass}" :title="${openExpr} ? '收起搜索' : '搜索'" :aria-label="${openExpr} ? '收起搜索' : '搜索'" @click="${toggleHandler}">
          <ds-icon name="search" />
        </a-button>
      </a-tooltip>
    `;
  }

  function toolbarRefreshButton(resource, label) {
    return `
      <a-tooltip title="刷新">
        <a-button type="text" class="${toolbarBtnClass} nlm-toolbar-pool-refresh-btn" :disabled="!workbenchProjectId" title="刷新" aria-label="刷新${label}列表" @click="refreshWorkbenchDemoResources('${resource}')">
          <ds-icon name="refresh" aria-hidden="true" />
        </a-button>
      </a-tooltip>
    `;
  }

  function toolbarBulkButton(area, scope, label) {
    const bulkScope = scope || area;
    return `
      <a-tooltip :title="workbenchBulkScopeActive('${area}', '${bulkScope}') ? '取消多选' : '多选'">
        <a-button
          type="text"
          :class="['${toolbarBtnClass}', { 'is-active': workbenchBulkScopeActive('${area}', '${bulkScope}') }]"
          :disabled="!workbenchBulkScopeActive('${area}', '${bulkScope}') && !workbenchBulkSelectableKeys('${area}', '${bulkScope}').length"
          :title="workbenchBulkScopeActive('${area}', '${bulkScope}') ? '取消多选' : '多选'"
          :aria-label="workbenchBulkScopeActive('${area}', '${bulkScope}') ? '取消${label}多选' : '${label}多选'"
          :aria-pressed="workbenchBulkScopeActive('${area}', '${bulkScope}') ? 'true' : 'false'"
          @click.stop="workbenchBulkScopeActive('${area}', '${bulkScope}') ? resetWorkbenchBulkSelection('${area}') : startWorkbenchBulkMode('${area}', '${bulkScope}')"
        >
          <svg class="iconpark-icon" aria-hidden="true"><use href="#check-correct"></use></svg>
        </a-button>
      </a-tooltip>
    `;
  }

  panels.bulkBar = function bulkBar(area, scope) {
    const bulkScope = scope || area;
    return `
      <div v-if="workbenchBulkScopeActive('${area}', '${bulkScope}')" class="workbench-bulk-bar workbench-bulk-bar--${area}" role="toolbar" aria-label="批量操作">
        <span class="workbench-bulk-bar__summary">
          <a-checkbox
            class="workbench-bulk-bar__check"
            :checked="workbenchBulkAllSelected('${area}', '${bulkScope}')"
            :indeterminate="workbenchBulkSomeSelected('${area}', '${bulkScope}')"
            @change="(e) => toggleWorkbenchBulkSelectAll('${area}', '${bulkScope}', e)"
          />
          <span class="workbench-bulk-bar__count">已选 {{ workbenchBulkSelectedCount('${area}') }} 项</span>
          <button type="button" class="workbench-bulk-bar__cancel-link" @click.stop="resetWorkbenchBulkSelection('${area}')">取消</button>
        </span>
        <div class="workbench-bulk-bar__actions">
          <a-tooltip
            v-for="action in workbenchBulkActionKeys('${area}', 'primary')"
            :key="'bulk-primary-' + action"
            :title="workbenchBulkActionTooltip(action, '${area}')"
          >
            <span
              class="workbench-bulk-bar__action-badge"
              :class="{ 'has-count': workbenchBulkActionCount(action, '${area}') > 0 }"
              :data-count="workbenchBulkActionCountText(action, '${area}')"
            >
              <a-button
                type="text"
                class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn workbench-bulk-bar__btn"
                :title="workbenchBulkActionTooltip(action, '${area}')"
                :aria-label="workbenchBulkActionTooltip(action, '${area}')"
                :disabled="workbenchBulkActionCount(action, '${area}') <= 0"
                @click.stop="onWorkbenchBulkAction('${area}', action)"
              >
                <ds-icon :name="workbenchBulkActionIcon(action)" aria-hidden="true" />
                <span class="workbench-bulk-bar__btn-label">{{ workbenchBulkActionMenuLabel(action, '${area}').replace(/（.*$/, '') }}</span>
              </a-button>
            </span>
          </a-tooltip>
          <a-dropdown v-if="workbenchBulkActionKeys('${area}', 'more').length" :trigger="['click']" @click.stop>
            <a-tooltip title="更多">
              <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn workbench-bulk-bar__more" title="更多" aria-label="更多批量操作" @click.stop>
                <ds-icon name="more" aria-hidden="true" />
                <span class="workbench-bulk-bar__more-label">更多</span>
                <ds-icon name="chevron-down" class="workbench-bulk-bar__more-caret" aria-hidden="true" />
              </a-button>
            </a-tooltip>
            <template #overlay>
              <a-menu @click="({ key }) => onWorkbenchBulkAction('${area}', key)">
                <a-menu-item
                  v-for="action in workbenchBulkActionKeys('${area}', 'more')"
                  :key="action"
                  :danger="action === 'delete'"
                >{{ workbenchBulkActionMenuLabel(action, '${area}') }}</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    `;
  };

  panels.drawerSectionOpen = function drawerSectionOpen(kind, options) {
    const hasActions = !options || options.hasActions !== false;
    const headClass = hasActions ? 'nlm-resource-drawer__head nlm-resource-drawer__head--split' : 'nlm-resource-drawer__head';
    const head = `
      <section class="nlm-resource-drawer" :class="{ 'is-open': resourceDrawerOpen.${kind} }" :style="resourceDrawerSectionStyle('${kind}')">
        ${hasActions ? '<div class="nlm-resource-drawer__head-row">' : ''}
          <button type="button" class="${headClass}" @click="toggleResourceDrawer('${kind}')">
            <span class="nlm-resource-drawer__title">
              <ds-icon name="chevron-right" class="nlm-resource-drawer__chevron" aria-hidden="true" />
              <span class="nlm-stat-count-label-row">
                <span class="nlm-resource-drawer__title-label">{{ workbenchResourceDrawerHeadLabel('${kind}') }}</span>
                <span class="nlm-resource-drawer__title-count nlm-stat-count-tag">{{ workbenchResourceDrawerHeadCount('${kind}') }}</span>
              </span>
            </span>
          </button>
    `;
    return hasActions ? `${head}<div class="nlm-material-action-row__right">` : head;
  };

  panels.drawerBodyOpen = function drawerBodyOpen(kind, options) {
    const hasActions = !options || options.hasActions !== false;
    return `
        ${hasActions ? '</div></div>' : ''}
        <div v-show="resourceDrawerOpen.${kind}" :ref="(el) => setResourceDrawerBodyRef('${kind}', el)" class="nlm-resource-drawer__body">
    `;
  };

  panels.drawerSectionClose = function drawerSectionClose() {
    return `
      </section>
    `;
  };

  panels.v2ResourcePanelOpen = function v2ResourcePanelOpen(kind, options) {
    const hasActions = !options || options.hasActions !== false;
    if (hasActions) {
      return `
      <section class="nlm-right-split-section nlm-resource-panel workbench-v2-resource-panel">
        <div class="nlm-panel-header">
          <div class="nlm-panel-title-row nlm-panel-title-row--result-with-refresh">
            <span class="nlm-stat-count-label-row">
              <span class="nlm-panel-title">{{ workbenchResourceDrawerHeadLabel('${kind}') }}</span>
              <span class="nlm-stat-count-tag">{{ workbenchResourceDrawerHeadCount('${kind}') }}</span>
            </span>
            <div class="nlm-material-toolbar__actions">`;
    }
    return `
      <section class="nlm-right-split-section nlm-resource-panel workbench-v2-resource-panel">
        <div class="nlm-panel-header">
          <div class="nlm-panel-title-row">
            <span class="nlm-stat-count-label-row">
              <span class="nlm-panel-title">{{ workbenchResourceDrawerHeadLabel('${kind}') }}</span>
              <span class="nlm-stat-count-tag">{{ workbenchResourceDrawerHeadCount('${kind}') }}</span>
            </span>
          </div>
        </div>`;
  };

  panels.v2ResourcePanelHeaderClose = function v2ResourcePanelHeaderClose(options) {
    const hasActions = !options || options.hasActions !== false;
    if (!hasActions) return '';
    return `
            </div>
          </div>
        </div>`;
  };

  panels.v2ResourcePanelBodyOpen = function v2ResourcePanelBodyOpen(kind) {
    return `
        <div :ref="(el) => setResourceDrawerBodyRef('${kind}', el)" class="nlm-resource-panel__body">`;
  };

  panels.v2ResourcePanelClose = function v2ResourcePanelClose() {
    return `
        </div>
      </section>`;
  };

  panels.v2ResourcePanelActions = function v2ResourcePanelActions(kind) {
    if (kind === 'file') {
      return `
        <a-tooltip :title="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'">
          <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn" :title="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'" :aria-label="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'" @click="toggleWorkbenchMaterialSearchPanel">
            <ds-icon name="search" />
          </a-button>
        </a-tooltip>
        ${toolbarBulkButton('resource', 'material', '资料')}
        <a-tooltip title="刷新">
          <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-toolbar-pool-refresh-btn" :disabled="!workbenchProjectId" title="刷新" aria-label="刷新资料列表" @click="refreshWorkbenchDemoResources('material')">
            <ds-icon name="refresh" aria-hidden="true" />
          </a-button>
        </a-tooltip>
        <a-dropdown :trigger="['click']" @click.stop>
          <span class="nlm-upload-add-btn-wrap">
            <a-tooltip :title="workbenchUploadSessionFailedCount ? ('有 ' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加'">
              <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-upload-primary-btn" :disabled="!workbenchProjectId" :title="workbenchUploadSessionFailedCount ? ('有 ' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加'" :aria-label="workbenchUploadSessionFailedCount ? ('添加资料，' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加资料'">
                <ds-icon name="plus" aria-hidden="true" />
              </a-button>
            </a-tooltip>
            <span v-if="workbenchUploadSessionFailedCount" class="nlm-filter-icon-btn__badge nlm-upload-failed-badge">{{ workbenchUploadSessionFailedCount }}</span>
          </span>
          <template #overlay>
            <a-menu @click="({ key }) => onWorkbenchMaterialAddMenu(key, '')">
              <a-menu-item key="upload-file"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('upload-file')" aria-hidden="true" /><span>上传文件</span></span></a-menu-item>
              <a-menu-item key="cross-workbench-import"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('cross-workbench-import')" aria-hidden="true" /><span>引入文件</span></span></a-menu-item>
              <a-menu-item key="new-folder"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('new-folder')" aria-hidden="true" /><span>新建文件夹</span></span></a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>`;
    }
    if (kind === 'database' || kind === 'graph') {
      const searchOpen = kind === 'database' ? 'workbenchDbSearchOpen' : 'workbenchGraphSearchOpen';
      const searchToggle = kind === 'database' ? 'toggleWorkbenchDbSearchPanel' : 'toggleWorkbenchGraphSearchPanel';
      const addTitle = kind === 'database' ? '添加库表' : '添加图谱';
      const addAction = kind === 'database' ? 'openWorkbenchDbAddModal' : 'openWorkbenchGraphAddModal';
      return `
        <a-tooltip :title="${searchOpen} ? '收起搜索' : '搜索'">
          <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn" :title="${searchOpen} ? '收起搜索' : '搜索'" :aria-label="${searchOpen} ? '收起搜索' : '搜索'" @click="${searchToggle}">
            <ds-icon name="search" />
          </a-button>
        </a-tooltip>
        ${kind === 'database' ? toolbarBulkButton('resource', 'database', '库表') : ''}
        <a-tooltip title="${addTitle}">
          <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-upload-primary-btn" title="${addTitle}" aria-label="${addTitle}" @click="${addAction}">
            <ds-icon name="plus" aria-hidden="true" />
          </a-button>
        </a-tooltip>`;
    }
    return '';
  };

  panels.drawerActions = function drawerActions(kind) {
    if (kind === 'file') {
      return `
        <template v-if="resourceDrawerOpen.file">
          <a-tooltip :title="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'">
            <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn" :title="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'" :aria-label="workbenchMaterialSearchOpen ? '收起搜索' : '搜索'" @click="toggleWorkbenchMaterialSearchPanel">
              <ds-icon name="search" />
            </a-button>
          </a-tooltip>
          ${toolbarBulkButton('resource', 'material', '资料')}
          <a-tooltip title="刷新">
            <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-toolbar-pool-refresh-btn" :disabled="!workbenchProjectId" title="刷新" aria-label="刷新资料列表" @click="refreshWorkbenchDemoResources('material')">
              <ds-icon name="refresh" aria-hidden="true" />
            </a-button>
          </a-tooltip>
        </template>
        <a-dropdown :trigger="['click']" @click.stop>
          <span class="nlm-upload-add-btn-wrap">
            <a-tooltip :title="workbenchUploadSessionFailedCount ? ('有 ' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加'">
              <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-upload-primary-btn" :disabled="!workbenchProjectId" :title="workbenchUploadSessionFailedCount ? ('有 ' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加'" :aria-label="workbenchUploadSessionFailedCount ? ('添加资料，' + workbenchUploadSessionFailedCount + ' 个文件上传失败') : '添加资料'">
                <ds-icon name="plus" aria-hidden="true" />
              </a-button>
            </a-tooltip>
            <span v-if="workbenchUploadSessionFailedCount" class="nlm-filter-icon-btn__badge nlm-upload-failed-badge">{{ workbenchUploadSessionFailedCount }}</span>
          </span>
          <template #overlay>
            <a-menu @click="({ key }) => onWorkbenchMaterialAddMenu(key, '')">
              <a-menu-item key="upload-file"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('upload-file')" aria-hidden="true" /><span>上传文件</span></span></a-menu-item>
              <a-menu-item key="cross-workbench-import"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('cross-workbench-import')" aria-hidden="true" /><span>引入文件</span></span></a-menu-item>
              <a-menu-item key="new-folder"><span class="wb-menu-action-item"><ds-icon class="wb-menu-action-item__icon" :name="workbenchMenuItemIcon('new-folder')" aria-hidden="true" /><span>新建文件夹</span></span></a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      `;
    }
    if (kind === 'database' || kind === 'graph') {
      const searchOpen = kind === 'database' ? 'workbenchDbSearchOpen' : 'workbenchGraphSearchOpen';
      const searchToggle = kind === 'database' ? 'toggleWorkbenchDbSearchPanel' : 'toggleWorkbenchGraphSearchPanel';
      const addTitle = kind === 'database' ? '添加库表' : '添加图谱';
      const addAction = kind === 'database' ? 'openWorkbenchDbAddModal' : 'openWorkbenchGraphAddModal';
      return `
        <template v-if="resourceDrawerOpen.${kind}">
          <a-tooltip :title="${searchOpen} ? '收起搜索' : '搜索'">
            <a-button type="text" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn" :title="${searchOpen} ? '收起搜索' : '搜索'" :aria-label="${searchOpen} ? '收起搜索' : '搜索'" @click="${searchToggle}">
              <ds-icon name="search" />
            </a-button>
          </a-tooltip>
          ${kind === 'database' ? toolbarBulkButton('resource', 'database', '库表') : ''}
        </template>
        <a-tooltip title="${addTitle}">
          <a-button type="text" size="small" class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn nlm-sort-icon-btn nlm-upload-primary-btn" title="${addTitle}" aria-label="${addTitle}" @click="${addAction}">
            <ds-icon name="plus" aria-hidden="true" />
          </a-button>
        </a-tooltip>
      `;
    }
    return '';
  };

  panels.rightSplitPanelOpen = function rightSplitPanelOpen() {
    return `
      <div ref="rightSplitPanel" class="nlm-side-panel-body nlm-right-split-panel" :class="{ 'is-wb-batch-children-active': wbTaskListView === 'batch-children' }" style="display:flex;flex-direction:column;min-height:0;">
    `;
  };

  panels.rightSplitPanelClose = function rightSplitPanelClose() {
    return `
      </div>
    `;
  };

  panels.rightTaskSectionOpen = function rightTaskSectionOpen() {
    return `
      <section
        class="nlm-right-split-section nlm-right-split-section--task"
        :class="{ 'is-wb-batch-children-active': wbTaskListView === 'batch-children' }"
        :style="rightSplitTaskSectionStyle"
      >
        <div class="nlm-panel-header">
          <div class="nlm-panel-title-row nlm-panel-title-row--task-with-refresh">
            <a-tooltip v-if="wbTaskListView === 'batch-children'" title="返回">
              <a-button type="text" class="${toolbarBtnClass} wb-task-list-panel-back-btn" title="返回" aria-label="返回任务列表" @click.stop="exitBatchChildListView"><svg class="iconpark-icon"><use href="#arrow-left"></use></svg></a-button>
            </a-tooltip>
            <span class="nlm-panel-title">{{ wbTaskListPanelTitle }}</span>
            <div v-if="wbTaskListView !== 'batch-children'" class="nlm-material-toolbar__actions">
              ${toolbarBulkButton('task', 'task', '任务')}
              ${toolbarRefreshButton('task', '任务')}
              <a-tooltip title="新建">
                <a-button type="text" size="small" class="${toolbarBtnClass} nlm-task-add-icon-btn" title="新建" aria-label="新建任务" @click="handleWorkbenchTaskCreate"><ds-icon name="plus" aria-hidden="true" /></a-button>
              </a-tooltip>
            </div>
            <div v-else-if="wbActiveBatchParentTask" class="nlm-material-toolbar__actions">
              ${toolbarBulkButton('task', 'batch-child', '子任务')}
              ${toolbarRefreshButton('task', '任务')}
              <a-dropdown :trigger="['click']" @click.stop>
                <a-tooltip title="更多">
                  <a-button type="text" class="${toolbarBtnClass}" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" aria-hidden="true" /></a-button>
                </a-tooltip>
                <template #overlay>
                  <a-menu @click="({ key }) => handleBatchParentHeaderMenu(key)">
                    <a-menu-item v-if="batchParentShowAbortQuick(wbActiveBatchParentTask)" key="abort-task">一键中止</a-menu-item>
                    <a-menu-item v-if="batchParentCanRerunMenu(wbActiveBatchParentTask)" key="rerun-all">一键重跑</a-menu-item>
                    <a-menu-item
                      v-if="batchParentCanRerunMenu(wbActiveBatchParentTask)"
                      key="rerun-failed-only"
                      :disabled="!batchParentFailedChildCount(wbActiveBatchParentTask)"
                    >一键重跑（仅失败）</a-menu-item>
                    <a-menu-item
                      v-if="batchParentCanRerunMenu(wbActiveBatchParentTask)"
                      key="clear-failed-only"
                      :disabled="!batchParentFailedChildCount(wbActiveBatchParentTask)"
                    >一键清空（仅失败）</a-menu-item>
                    <a-menu-divider v-if="batchParentShowAbortQuick(wbActiveBatchParentTask) || batchParentCanRerunMenu(wbActiveBatchParentTask)" />
                    <a-menu-item key="delete" danger>删除</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
        <div class="nlm-fill-scroll nlm-right-split-scroll nlm-task-list-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;" @mouseleave="hoveredMaterialId = null" @click="onMaterialListAreaClick($event)">
    `;
  };

  panels.rightTaskSectionClose = function rightTaskSectionClose() {
    return `
        </div>
      </section>
      <div class="nlm-right-split-resizer" role="separator" aria-orientation="horizontal" title="调整任务和结果分区高度" @mousedown.stop.prevent="beginResize('rightSplit', $event)"></div>
    `;
  };

  panels.rightResultSectionOpen = function rightResultSectionOpen() {
    return `
      <section class="nlm-right-split-section nlm-right-split-section--result" :style="rightSplitResultSectionStyle">
        <div class="nlm-panel-header">
          <div class="nlm-panel-title-row nlm-panel-title-row--result-with-refresh">
            <span class="nlm-stat-count-label-row">
              <span class="nlm-panel-title">结果</span>
              <span class="nlm-stat-count-tag">{{ workbenchAnalysisResultPanelCount }}</span>
            </span>
            <div class="nlm-material-toolbar__actions">
              ${toolbarSearchButton('workbenchAnalysisSearchOpen', 'toggleWorkbenchAnalysisSearchPanel')}
              <a-dropdown :trigger="['click']" @click.stop>
                <a-tooltip title="排序">
                  <a-button
                    type="text"
                    class="${toolbarBtnClass}"
                    title="排序"
                    :aria-label="'结果排序：' + workbenchAnalysisResultSortLabel"
                    @click.stop
                  >
                    <ds-icon name="arrow-down-short-wide" aria-hidden="true" />
                  </a-button>
                </a-tooltip>
                <template #overlay>
                  <a-menu :selected-keys="[workbenchAnalysisResultSortMode || 'name']" @click="({ key }) => setWorkbenchAnalysisResultSortMode(key)">
                    <a-menu-item v-for="item in workbenchAnalysisResultSortOptions" :key="item.key">
                      <span class="nlm-sort-menu-item-label">
                        <ds-icon v-if="(workbenchAnalysisResultSortMode || 'name') === item.key" name="check" aria-hidden="true" />
                        <span>{{ item.label }}</span>
                      </span>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
              ${toolbarBulkButton('result', 'result', '结果')}
              ${toolbarRefreshButton('result', '结果')}
              <a-tooltip title="新建">
                <a-button type="text" class="${toolbarBtnClass}" title="新建" aria-label="创建文件夹" :disabled="!workbenchProjectId" @click="openWorkbenchAnalysisResultCreateFolderModal({ type: 'root' })">
                  <ds-icon name="folder-plus" aria-hidden="true" />
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </div>
        <div class="nlm-material-toolbar">
          <div v-if="workbenchAnalysisSearchOpen" class="nlm-material-query-row">
            <a-input
              v-model:value="workbenchAnalysisSearchQuery"
              allow-clear
              placeholder="搜索名称、技能或结果文件夹"
              class="ds-input-inline-search ds-input-inline-search--compact"
            >
              <template #prefix>
                <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
              </template>
            </a-input>
          </div>
          ${panels.bulkBar('result', 'result')}
        </div>
        <div class="nlm-fill-scroll nlm-right-split-scroll wb-material-file-drawer" style="flex:1;min-height:0;" @mouseleave="hoveredMaterialId = null" @click="onMaterialListAreaClick($event)">
    `;
  };

  panels.rightResultSectionClose = function rightResultSectionClose() {
    return `
        </div>
      </section>
    `;
  };

  if (app && !app.component('FreeAuditAnalysisOutputToolbar')) {
    app.component('FreeAuditAnalysisOutputToolbar', {
      props: {
        copyDisabled: { type: Boolean, default: false },
        copyVisible: { type: Boolean, default: true },
        exportDisabled: { type: Boolean, default: false },
        saveDisabled: { type: Boolean, default: false },
        saveVisible: { type: Boolean, default: true },
        dirty: { type: Boolean, default: false },
        exportFormats: { type: Array, default: () => ['md', 'pdf', 'docx'] },
      },
      emits: ['copy', 'export-menu', 'save'],
      methods: {
        exportLabel(fmt) {
          return {
            md: '下载为 Markdown',
            pdf: '下载为 PDF',
            docx: '下载为 Word',
            csv: '下载为 CSV',
          }[String(fmt || '').toLowerCase()] || `下载为 ${String(fmt || '').toUpperCase()}`;
        },
      },
      template: `
        <div class="analysis-result-preview-modal__toolbar-icons" role="toolbar" :aria-label="copyVisible ? '复制、下载与保存' : '下载'">
          <a-button
            v-if="copyVisible"
            type="default"
            class="analysis-result-preview-toolbar-outline-btn"
            :disabled="copyDisabled"
            title="复制当前内容"
            aria-label="复制当前内容"
            @click="$emit('copy')"
          >复制</a-button>
          <a-dropdown :trigger="['click']" :disabled="exportDisabled">
            <a-button
              type="default"
              class="analysis-result-preview-toolbar-outline-btn"
              :disabled="exportDisabled"
              title="选择导出格式"
              aria-label="下载，选择格式"
              aria-haspopup="true"
            >
              下载 <ds-icon name="chevron-down" style="margin-left:4px;font-size:10px;opacity:0.75" aria-hidden="true" />
            </a-button>
            <template #overlay>
              <a-menu @click="(info) => $emit('export-menu', info)">
                <a-menu-item v-for="fmt in exportFormats" :key="'export-' + fmt">{{ exportLabel(fmt) }}</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button
            v-if="saveVisible"
            class="analysis-result-preview-toolbar-outline-btn"
            :type="dirty ? 'primary' : 'default'"
            :disabled="saveDisabled"
            title="保存编辑内容"
            aria-label="保存编辑内容"
            @click="$emit('save')"
          >保存</a-button>
        </div>
      `,
    });
  }

  if (app && !app.component('FreeAuditStatusFilterBar')) {
    app.component('FreeAuditStatusFilterBar', {
      props: {
        items: { type: Array, default: () => [] },
        activeKey: { type: String, default: '' },
        ariaLabel: { type: String, default: '' },
      },
      emits: ['select'],
      template: `
        <div class="wb-material-status-footer__stats" :aria-label="ariaLabel || null">
          <button
            v-for="item in items"
            :key="item.key"
            type="button"
            :class="['ds-trigger-btn nlm-chat-result-toolbar-btn', { 'is-active': activeKey === item.key }]"
            @click.stop="$emit('select', item.key)"
          >
            <span class="ds-trigger-btn__text wb-status-chip" :class="item.tone ? ('wb-status-chip--' + item.tone) : ''">
              {{ item.label }}<span v-if="item.count !== undefined" class="wb-status-chip__count">{{ item.count }}</span>
            </span>
          </button>
        </div>
      `,
    });
  }

  if (app && !app.component('FreeAuditTaskCreateResourceRow')) {
    app.component('FreeAuditTaskCreateResourceRow', {
      props: {
        item: { type: Object, required: true },
        selected: { type: Boolean, default: false },
        selectedMode: { type: Boolean, default: false },
      },
      emits: ['remove', 'toggle'],
      template: `
        <div
          class="wb-task-create-transfer__list-item nlm-tree-leaf nlm-tree-leaf--analysis"
          :class="{ 'wb-task-create-transfer__list-item--selected': selectedMode }"
          @click="!selectedMode && $emit('toggle', item)"
        >
          <span v-if="!selectedMode" class="wb-task-create-transfer__check">
            <a-checkbox
              :checked="selected"
              @click.stop
              @change="$emit('toggle', item)"
            />
          </span>
          <span class="nlm-tree-leaf-icon">
            <svg v-if="item.iconClass === 'map-draw'" class="iconpark-icon" :class="item.iconToneClass || ''" aria-hidden="true"><use href="#map-draw"></use></svg>
            <ds-icon v-else :name="item.iconClass" :class="item.iconToneClass || ''" aria-hidden="true" />
          </span>
          <div class="nlm-tree-leaf-title-wrap">
            <div class="nlm-tree-leaf-col">
              <div class="nlm-tree-leaf-title">{{ item.name }}</div>
            </div>
          </div>
          <span v-if="selectedMode && item.typeLabel" class="nlm-tree-leaf-tag nlm-tree-leaf-tag--temp">{{ item.typeLabel }}</span>
          <a-tooltip v-if="selectedMode" title="移除">
            <a-button
              type="text"
              size="small"
              class="ds-icon-btn ds-icon-btn--compact ds-icon-btn--nlm nlm-input-bar-btn"
              title="移除"
              aria-label="移除资源"
              @click="$emit('remove', item.key)"
            >
              <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
            </a-button>
          </a-tooltip>
        </div>
      `,
    });
  }

  if (app && !app.component('FreeAuditTaskConfigResourceRow')) {
    app.component('FreeAuditTaskConfigResourceRow', {
      props: {
        row: { type: Object, required: true },
        iconMeta: { type: Object, default: () => ({}) },
        label: { type: String, default: '' },
        ariaLabel: { type: String, default: '' },
      },
      emits: ['open'],
      template: `
        <FreeAuditTaskDetailSimpleRow :aria-label="ariaLabel" @open="$emit('open', row)">
          <template #icon>
            <svg v-if="iconMeta.iconClass === 'map-draw'" class="iconpark-icon" :class="iconMeta.iconToneClass || ''" aria-hidden="true"><use href="#map-draw"></use></svg>
            <ds-icon v-else :name="iconMeta.iconClass" :class="iconMeta.iconToneClass || ''" />
          </template>
          {{ label }}
        </FreeAuditTaskDetailSimpleRow>
      `,
    });
  }

  if (app && !app.component('FreeAuditTaskDetailSimpleRow')) {
    app.component('FreeAuditTaskDetailSimpleRow', {
      props: {
        ariaLabel: { type: String, default: '' },
        iconClass: { type: [String, Array, Object], default: '' },
      },
      emits: ['open'],
      template: `
        <li
          class="wb-task-detail-simple-row"
          role="button"
          tabindex="0"
          :aria-label="ariaLabel || null"
          @click="$emit('open')"
          @keydown.enter.prevent="$emit('open')"
        >
          <span class="nlm-tree-leaf-icon wb-task-detail-simple-row__icon" :class="iconClass" aria-hidden="true">
            <slot name="icon" />
          </span>
          <span class="wb-task-detail-simple-row__text"><slot /></span>
        </li>
      `,
    });
  }

  if (app && !app.component('FreeAuditBatchChildRow')) {
    app.component('FreeAuditBatchChildRow', {
      props: {
        child: { type: Object, required: true },
        selected: { type: Boolean, default: false },
        status: { type: String, default: '' },
        showMore: { type: Boolean, default: false },
        canAbort: { type: Boolean, default: false },
        canRerun: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
        queuePosition: { type: Number, default: 0 },
        progress: { type: Number, default: 0 },
        bulkDescriptor: { type: Object, default: null },
        bulkSelected: { type: Boolean, default: false },
        bulkMode: { type: Boolean, default: false },
      },
      emits: ['open', 'menu', 'abort', 'rerun', 'bulk-toggle'],
      template: `
        <a-dropdown :trigger="['contextmenu']" @click.stop>
          <div :class="['nlm-tree-leaf', 'nlm-tree-leaf--analysis', { checked: selected, 'is-bulk-mode': bulkMode, 'is-bulk-selected': bulkSelected }]" @click="$emit('open', $event, child)">
            <span v-if="bulkMode && bulkDescriptor" class="workbench-bulk-tree-check" @click.stop>
              <a-checkbox :checked="bulkSelected" @change="(e) => $emit('bulk-toggle', bulkDescriptor, e)" />
            </span>
            <span class="nlm-tree-leaf-icon">
              <ds-icon name="edit-one" class="is-task-single" title="子任务" />
            </span>
            <div class="nlm-tree-leaf-title-wrap"><div class="nlm-tree-leaf-col"><div class="nlm-tree-leaf-title" :class="{ 'is-muted': ['queued','parsing','failed'].includes(status) }">{{ child.title || child.rowLabel }}</div></div></div>
            <span class="nlm-tree-leaf-right">
              <span v-if="status === 'parsing'" class="nlm-tree-leaf-task-status nlm-tree-leaf-task-progress-pct nlm-tree-leaf-state-text is-progress" :title="'执行中 ' + Math.round(progress) + '%'">{{ Math.round(progress) }}%</span>
              <span v-else-if="status === 'failed'" class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-failed" title="失败">失败</span>
              <span v-else-if="status === 'done'" class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-done" title="完成">完成</span>
              <span
                v-else-if="status === 'queued'"
                class="nlm-tree-leaf-task-status nlm-tree-leaf-state-text is-queued"
                :title="queuePosition > 0 ? ('当前排队第 ' + queuePosition + ' 位') : '排队中'"
              >{{ queuePosition > 0 ? ('第' + queuePosition + '位') : '排队中' }}</span>
              <div v-if="!bulkMode" class="nlm-tree-leaf-actions">
                <a-tooltip v-if="canAbort && !canRerun && !canDelete" title="中止">
                  <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="中止" aria-label="中止子任务" @click.stop="$emit('abort', child)"><ds-icon name="stop" /></a-button>
                </a-tooltip>
                <a-tooltip v-else-if="!canAbort && canRerun && !canDelete" title="重跑">
                  <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="重跑" aria-label="重跑子任务" @click.stop="$emit('rerun', child)"><ds-icon name="refresh" /></a-button>
                </a-tooltip>
                <a-tooltip v-else-if="!canAbort && !canRerun && canDelete" title="删除">
                  <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="删除" aria-label="删除子任务" @click.stop="$emit('menu', 'delete', child)"><ds-icon name="delete" /></a-button>
                </a-tooltip>
                <a-dropdown v-else-if="showMore" :trigger="['click']" @click.stop>
                  <a-tooltip title="更多">
                    <a-button type="text" class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon" title="更多" aria-label="更多操作" @click.stop><ds-icon name="more" /></a-button>
                  </a-tooltip>
                  <template #overlay><a-menu @click="({ key }) => $emit('menu', key, child)"><a-menu-item v-if="canAbort" key="abort-task">中止</a-menu-item><a-menu-item v-if="canRerun" key="rerun-task">重跑</a-menu-item><a-menu-divider v-if="canDelete && (canAbort || canRerun)" /><a-menu-item v-if="canDelete" key="delete" danger>删除</a-menu-item></a-menu></template>
                </a-dropdown>
              </div></span>
          </div>
          <template #overlay><a-menu @click="({ key }) => $emit('menu', key, child)"><a-menu-item v-if="canAbort" key="abort-task">中止</a-menu-item><a-menu-item v-if="canRerun" key="rerun-task">重跑</a-menu-item><a-menu-divider v-if="canDelete && (canAbort || canRerun)" /><a-menu-item v-if="canDelete" key="delete" danger>删除</a-menu-item></a-menu></template>
        </a-dropdown>
      `,
    });
  }

  if (app && !app.component('FreeAuditMetaRows')) {
    app.component('FreeAuditMetaRows', {
      props: {
        rows: { type: Array, default: () => [] },
        keyPrefix: { type: String, default: 'meta' },
        statusRowLabel: { type: String, default: '' },
        statusClass: { type: [String, Array, Object], default: '' },
        statusText: { type: String, default: '' },
      },
      template: `
        <template v-for="(row, idx) in rows" :key="keyPrefix + '-' + idx">
          <div class="material-preview-meta-dl-row">
            <span class="material-preview-meta-dl-label">{{ row.label }}</span>
            <span
              v-if="statusRowLabel && row.label === statusRowLabel"
              class="material-preview-meta-dl-value material-preview-meta-dl-value--status-pill"
            >
              <span class="ds-status-pill" :class="statusClass">
                <span class="ds-status-pill__dot"></span>
                <span class="ds-status-pill__label">{{ statusText }}</span>
              </span>
            </span>
            <span v-else class="material-preview-meta-dl-value">{{ row.value }}</span>
          </div>
        </template>
      `,
    });
  }

  if (app && !app.component('FreeAuditBasicInfoPane')) {
    app.component('FreeAuditBasicInfoPane', {
      props: {
        title: { type: String, default: '基本信息' },
        ariaLabel: { type: String, default: '基本信息' },
        hideChrome: { type: Boolean, default: false },
        paneClass: { type: String, default: '' },
        bodyClass: { type: String, default: 'material-preview-basic-tab' },
        nestedBodyClass: { type: String, default: '' },
        rows: { type: Array, default: () => [] },
        keyPrefix: { type: String, default: 'meta' },
        statusRowLabel: { type: String, default: '' },
        statusClass: { type: String, default: '' },
        statusText: { type: String, default: '' },
      },
      template: `
        <div v-if="paneClass" :class="paneClass">
          <div class="ds-unified-tab-pane-stack">
            <div v-if="!hideChrome" class="ds-unified-tab-pane-chrome" role="toolbar" :aria-label="ariaLabel">
              <h3 class="ds-unified-tab-pane-chrome__title">{{ title }}</h3>
              <div class="ds-unified-tab-pane-chrome__actions"></div>
            </div>
            <div :class="bodyClass">
              <div v-if="nestedBodyClass" :class="nestedBodyClass">
                <FreeAuditMetaRows
                  :rows="rows"
                  :key-prefix="keyPrefix"
                  :status-row-label="statusRowLabel"
                  :status-class="statusClass"
                  :status-text="statusText"
                />
              </div>
              <FreeAuditMetaRows
                v-else
                :rows="rows"
                :key-prefix="keyPrefix"
                :status-row-label="statusRowLabel"
                :status-class="statusClass"
                :status-text="statusText"
              />
            </div>
          </div>
        </div>
        <div v-else class="ds-unified-tab-pane-stack">
          <div v-if="!hideChrome" class="ds-unified-tab-pane-chrome" role="toolbar" :aria-label="ariaLabel">
            <h3 class="ds-unified-tab-pane-chrome__title">{{ title }}</h3>
            <div class="ds-unified-tab-pane-chrome__actions"></div>
          </div>
          <div :class="bodyClass">
            <div v-if="nestedBodyClass" :class="nestedBodyClass">
              <FreeAuditMetaRows
                :rows="rows"
                :key-prefix="keyPrefix"
                :status-row-label="statusRowLabel"
                :status-class="statusClass"
                :status-text="statusText"
              />
            </div>
            <FreeAuditMetaRows
              v-else
              :rows="rows"
              :key-prefix="keyPrefix"
              :status-row-label="statusRowLabel"
              :status-class="statusClass"
              :status-text="statusText"
            />
          </div>
        </div>
      `,
    });
  }

  if (app && !app.component('FreeAuditAnalysisHistoryTable')) {
    app.component('FreeAuditAnalysisHistoryTable', {
      props: {
        rows: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        emptyDescription: { type: String, default: '暂无历史快照。' },
      },
      emits: ['detail', 'rollback'],
      template: `
        <template v-if="(rows || []).length">
          <div
            class="skill-version-mgmt-history-section"
            role="region"
            aria-label="历史版本列表"
          >
            <h4 class="skill-version-mgmt-history__heading">历史版本 ({{ rows.length }})</h4>
            <div class="skill-version-mgmt-history">
              <div class="ds-l2-table-panel">
                <a-table
                  :columns="columns"
                  :data-source="rows"
                  row-key="key"
                  size="small"
                  :pagination="false"
                  class="skill-library-version-mgmt-table wb-analysis-version-mgmt-table"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'generationDesc'">
                      <span class="skill-version-table__cell-desc" :title="record.generationDesc">{{ record.generationDesc }}</span>
                    </template>
                    <template v-else-if="column.key === 'action'">
                      <span class="skill-version-mgmt-history__row-actions">
                        <a-button type="link" size="small" class="skill-version-table__version-link" @click="$emit('detail', record)">详情</a-button>
                        <a-button
                          type="link"
                          size="small"
                          class="skill-version-table__version-link"
                          @click="$emit('rollback', record)"
                        >回退</a-button>
                      </span>
                    </template>
                    <template v-else>{{ record[column.dataIndex] }}</template>
                  </template>
                </a-table>
              </div>
            </div>
          </div>
        </template>
        <a-empty v-else :description="emptyDescription" />
      `,
    });
  }

  if (app && !app.component('FreeAuditAnalysisHistoryPane')) {
    app.component('FreeAuditAnalysisHistoryPane', {
      props: {
        active: { type: Boolean, default: false },
        rows: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        tableEmptyDescription: { type: String, default: '暂无历史快照。' },
        inactiveDescription: { type: String, default: '暂无历史版本。' },
      },
      emits: ['detail', 'rollback'],
      template: `
        <div class="skill-unified-tab-version-root">
          <div class="skill-unified-tab-version-root__main skill-wizard-panel">
            <template v-if="active">
              <FreeAuditAnalysisHistoryTable
                :rows="rows"
                :columns="columns"
                :empty-description="tableEmptyDescription"
                @detail="(record) => $emit('detail', record)"
                @rollback="(record) => $emit('rollback', record)"
              />
            </template>
            <a-empty v-else :description="inactiveDescription" />
          </div>
        </div>
      `,
    });
  }

  if (app && !app.component('FreeAuditAnalysisOutputPane')) {
    app.component('FreeAuditAnalysisOutputPane', {
      props: {
        draftValue: { type: String, default: '' },
        resultFormat: { type: String, default: 'MD' },
        csvHeaders: { type: Array, default: () => [] },
        csvRows: { type: Array, default: () => [] },
        editorDisabled: { type: Boolean, default: false },
        copyDisabled: { type: Boolean, default: false },
        copyVisible: { type: Boolean, default: true },
        exportDisabled: { type: Boolean, default: false },
        saveDisabled: { type: Boolean, default: false },
        dirty: { type: Boolean, default: false },
        exportFormats: { type: Array, default: () => ['md', 'pdf', 'docx'] },
      },
      emits: ['update:draftValue', 'copy', 'export-menu', 'save'],
      template: `
        <div class="ds-unified-tab-pane-stack">
          <div class="ds-unified-tab-pane-chrome ds-unified-tab-pane-chrome--result-body" role="toolbar" aria-label="输出结果操作">
            <div class="ds-unified-tab-pane-chrome__actions" aria-label="正文与编辑器操作">
              <FreeAuditAnalysisOutputToolbar
                :copy-visible="String(resultFormat || 'MD').toUpperCase() !== 'CSV'"
                :copy-disabled="copyDisabled"
                :export-disabled="exportDisabled"
                :dirty="dirty"
                :save-disabled="saveDisabled"
                :save-visible="String(resultFormat || 'MD').toUpperCase() !== 'CSV'"
                :export-formats="exportFormats"
                @copy="$emit('copy')"
                @export-menu="(info) => $emit('export-menu', info)"
                @save="$emit('save')"
              />
            </div>
          </div>
          <div class="analysis-result-preview-modal__layout workbench-analysis-embed-wrap">
            <div class="preview-modal-content-frame">
              <div v-if="String(resultFormat || 'MD').toUpperCase() !== 'CSV'" class="analysis-result-preview-modal__panel analysis-result-preview-modal__panel--editor analysis-result-preview-modal__panel--tab-chrome-only">
                <div class="analysis-result-preview-modal__panel-body">
                  <a-textarea
                    :value="draftValue"
                    class="analysis-result-preview-modal__editor-textarea"
                    :rows="22"
                    :disabled="editorDisabled"
                    placeholder="支持编辑 Markdown 正文，保存后写入当前结果"
                    @update:value="$emit('update:draftValue', $event)"
                  />
                </div>
              </div>
              <div v-else class="material-preview-modal__viewer">
                <div class="material-preview-modal__viewer-body">
                  <div v-if="(csvHeaders || []).length" class="nlm-original-table-wrap analysis-result-preview-modal__csv-table-wrap">
                    <table class="nlm-original-table">
                      <thead>
                        <tr>
                          <th v-for="(header, hi) in csvHeaders" :key="'csv-head-' + hi">{{ header }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, ri) in (csvRows || [])" :key="'csv-row-' + ri">
                          <td v-for="(cell, ci) in row" :key="'csv-cell-' + ri + '-' + ci">{{ cell }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <a-empty v-else description="暂无表格预览" />
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    });
  }
})();
