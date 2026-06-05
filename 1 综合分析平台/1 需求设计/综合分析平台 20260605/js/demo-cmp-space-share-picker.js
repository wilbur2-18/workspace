(function () {
  const app = window.__DEMO_APP;
  if (!app) return;

  const USER_ID_TO_LABEL = Object.fromEntries(PROJECT_SHARE_USER_OPTIONS.map((o) => [o.value, o.label]));

  function collectTreeKeys(nodes) {
    const keys = [];
    (nodes || []).forEach((n) => {
      keys.push(n.key);
      keys.push(...collectTreeKeys(n.children));
    });
    return keys;
  }

  /** 过滤部门树：关键词匹配标题；已勾选部门及其祖先路径始终保留 */
  function filterDeptTree(nodes, query, checkedDeptKeys) {
    const needle = (query || '').trim().toLowerCase();
    const checked = new Set(checkedDeptKeys || []);
    function subMatchTitle(n) {
      if (!needle) return true;
      if (String(n.title || '').toLowerCase().includes(needle)) return true;
      return (n.children || []).some(subMatchTitle);
    }
    function hasCheckedInSubtree(n) {
      if (checked.has(n.key)) return true;
      return (n.children || []).some(hasCheckedInSubtree);
    }
    function walk(list) {
      if (!list || !list.length) return [];
      const out = [];
      list.forEach((node) => {
        const kids = walk(node.children || []);
        const showForSearch = subMatchTitle(node);
        const showForCheck = hasCheckedInSubtree(node);
        const keep = showForSearch || showForCheck || kids.length > 0;
        if (keep) {
          out.push({
            ...node,
            children: kids.length ? kids : undefined,
          });
        }
      });
      return out;
    }
    return walk(nodes);
  }

  function deptTitle(treeNodes, targetKey) {
    function walk(nodes) {
      if (!nodes) return '';
      for (let i = 0; i < nodes.length; i += 1) {
        const n = nodes[i];
        if (n.key === targetKey) return n.title || '';
        const t = walk(n.children);
        if (t) return t;
      }
      return '';
    }
    return walk(treeNodes) || '';
  }

  app.component('SpaceSharePicker', {
    props: {
      userIds: { type: Array, default: () => [] },
      deptKeys: { type: Array, default: () => [] },
    },
    emits: ['update:userIds', 'update:deptKeys'],
    data() {
      return {
        treeData: PROJECT_SHARE_DEPT_TREE_DATA,
        expandedKeys: ['d-root', 'd-eco'],
        /** `dept`：仅部门树；`user`：搜索用户，无关键词时不展示列表 */
        leftPickMode: 'dept',
        /** 左栏搜索（部门模式下过滤部门树；用户模式下驱动用户查询结果） */
        leftSearchQuery: '',
      };
    },
    computed: {
      leftSearchTrimmed() {
        return (this.leftSearchQuery || '').trim();
      },
      leftSearchPlaceholder() {
        return this.leftPickMode === 'dept' ? '搜索部门' : '搜索用户';
      },
      leftSearchAriaLabel() {
        return this.leftPickMode === 'dept' ? '搜索部门' : '搜索用户';
      },
      /** 用户模式：是否已输入查询关键词 */
      userModeHasQuery() {
        return this.leftPickMode === 'user' && this.leftSearchTrimmed.length > 0;
      },
      displayTreeData() {
        return filterDeptTree(this.treeData, this.leftSearchQuery, this.deptKeys || []);
      },
      /** 左栏可选用户（用户模式全量候选） */
      leftPickUsers() {
        return PROJECT_SHARE_USER_OPTIONS.map((o) => ({ id: o.value, label: o.label }));
      },
      /** 用户模式：仅在有搜索词时返回匹配用户，供勾选 */
      userModeSearchResults() {
        if (this.leftPickMode !== 'user' || !this.userModeHasQuery) return [];
        const q = this.leftSearchTrimmed.toLowerCase();
        return this.leftPickUsers.filter((u) => String(u.label || '').toLowerCase().includes(q));
      },
      selectionCount() {
        return (this.deptKeys || []).length + (this.userIds || []).length;
      },
      /** 右栏展示顺序：部门在前、用户在后 */
      allSelectionChips() {
        const depts = (this.deptKeys || []).map((key) => ({
          kind: 'dept',
          id: 'd-' + key,
          deptKey: key,
          label: deptTitle(this.treeData, key) || key,
        }));
        const users = (this.userIds || []).map((uid) => ({
          kind: 'user',
          id: 'u-' + uid,
          userId: uid,
          label: USER_ID_TO_LABEL[uid] || uid,
        }));
        return depts.concat(users);
      },
      hasSelection() {
        return this.allSelectionChips.length > 0;
      },
      syncedDeptKeys: {
        get() {
          return this.deptKeys || [];
        },
        set(v) {
          let keys = v;
          if (keys && typeof keys === 'object' && !Array.isArray(keys)) {
            keys = keys.checked;
          }
          this.$emit('update:deptKeys', Array.isArray(keys) ? keys.slice() : []);
        },
      },
    },
    watch: {
      leftPickMode() {
        this.leftSearchQuery = '';
        this.expandedKeys = ['d-root', 'd-eco'];
      },
      leftSearchQuery(v) {
        if (this.leftPickMode !== 'dept') return;
        const q = (v || '').trim();
        if (!q) {
          this.expandedKeys = ['d-root', 'd-eco'];
          return;
        }
        this.syncTreeExpandForFilter();
      },
      deptKeys: {
        deep: true,
        handler() {
          if (this.leftPickMode !== 'dept') return;
          if (this.leftSearchTrimmed) this.syncTreeExpandForFilter();
        },
      },
    },
    methods: {
      /** 有搜索关键词时展开过滤后的整棵树，便于看到匹配与已勾选节点 */
      syncTreeExpandForFilter() {
        this.$nextTick(() => {
          this.expandedKeys = collectTreeKeys(this.displayTreeData);
        });
      },
      removeDept(key) {
        const next = (this.deptKeys || []).filter((k) => k !== key);
        this.$emit('update:deptKeys', next);
      },
      removeUser(id) {
        const next = (this.userIds || []).filter((u) => u !== id);
        this.$emit('update:userIds', next);
      },
      removeChip(item) {
        if (!item) return;
        if (item.kind === 'dept') this.removeDept(item.deptKey);
        else this.removeUser(item.userId);
      },
      isUserChecked(id) {
        return (this.userIds || []).includes(id);
      },
      onUserCheck(id, e) {
        const checked = !!(e && e.target && e.target.checked);
        const set = new Set(this.userIds || []);
        if (checked) set.add(id);
        else set.delete(id);
        this.$emit('update:userIds', Array.from(set));
      },
    },
    template: `
      <div class="ds-space-share-picker">
        <div class="ds-space-share-picker__cols" role="group" aria-label="工作台共享范围（部门与用户）">
          <div class="ds-space-share-picker__col ds-space-share-picker__col--available">
            <div class="ds-space-share-picker__col-hd ds-text-micro-secondary">可选部门与用户</div>
            <div class="ds-space-share-picker__mode-bar" role="tablist" aria-label="选择方式">
              <a-segmented
                v-model:value="leftPickMode"
                class="ds-ant-segmented ds-ant-segmented--compact ds-space-share-picker__mode-seg"
                size="small"
                :options="[
                  { label: '按部门选', value: 'dept' },
                  { label: '按用户选', value: 'user' },
                ]"
              />
            </div>
            <div class="ds-space-share-picker__search">
              <a-input
                v-model:value="leftSearchQuery"
                allow-clear
                :placeholder="leftSearchPlaceholder"
                class="ds-input-inline-search ds-space-share-picker__filter-input"
                :aria-label="leftSearchAriaLabel"
              >
                <template #prefix>
                  <ds-icon name="search" class="ds-input-inline-search__icon" aria-hidden="true" />
                </template>
              </a-input>
            </div>
            <div class="ds-space-share-picker__left-body">
              <template v-if="leftPickMode === 'dept'">
                <div class="ds-space-share-picker__tree-wrap ds-space-share-picker__tree-wrap--solo">
                  <a-tree
                    block-node
                    checkable
                    check-strictly
                    :tree-data="displayTreeData"
                    v-model:expanded-keys="expandedKeys"
                    v-model:checked-keys="syncedDeptKeys"
                  />
                </div>
              </template>
              <div
                v-else
                class="ds-space-share-picker__user-wrap ds-space-share-picker__user-only-wrap"
              >
                <div
                  v-if="!userModeHasQuery"
                  class="ds-space-share-picker__user-mode-idle"
                  role="status"
                >
                  <p class="ds-space-share-picker__user-mode-idle-text ds-text-caption-light">
                    请搜索用户后，在结果中选择要共享的用户
                  </p>
                </div>
                <template v-else-if="userModeSearchResults.length">
                  <label
                    v-for="u in userModeSearchResults"
                    :key="u.id"
                    class="ds-space-share-picker__user-row"
                  >
                    <a-checkbox
                      :checked="isUserChecked(u.id)"
                      @change="onUserCheck(u.id, $event)"
                    />
                    <span class="ds-space-share-picker__user-label">{{ u.label }}</span>
                  </label>
                </template>
                <a-empty
                  v-else
                  class="ds-space-share-picker__empty"
                  description="未找到匹配用户，请调整关键词"
                />
              </div>
            </div>
          </div>
          <div class="ds-space-share-picker__col ds-space-share-picker__col--selected">
            <div class="ds-space-share-picker__col-hd ds-text-micro-secondary">
              已选
              <span v-if="selectionCount" class="ds-space-share-picker__col-hd-count">（{{ selectionCount }}）</span>
            </div>
            <div
              class="ds-space-share-picker__selected-wrap"
              :class="{ 'is-empty': !hasSelection }"
              aria-label="已选部门与用户"
            >
              <template v-if="hasSelection">
                <TagSm
                  v-for="item in allSelectionChips"
                  :key="item.id"
                  variant="static"
                  closable
                  class="ds-space-share-picker__chip"
                  :class="item.kind === 'dept' ? 'ds-space-share-picker__chip--dept' : 'ds-space-share-picker__chip--user'"
                  @close="removeChip(item)"
                >{{ item.label }}</TagSm>
              </template>
              <span v-else class="ds-space-share-picker__selected-placeholder">尚未选择部门或用户</span>
            </div>
          </div>
        </div>
      </div>
    `,
  });
})();
