(function registerUiInfoControlRail() {
  const app = window.__DGP_COMPONENT_APP;
  if (!app) return;
  if (app.component('InfoControlRail')) return;

  const definition = {
    props: {
      ariaLabel: { type: String, default: '列表信息与展示操作' },
    },
    computed: {
      hasLeftCustom() { return !!this.$slots.left; },
      hasRightCustom() { return !!this.$slots.right; },
      hasTotalSlot() { return !!this.$slots.total; },
      hasSelectionSlot() { return !!this.$slots.selection; },
      hasFilterSlot() { return !!this.$slots.filter; },
      hasQuerySlot() { return !!this.$slots.query; },
      hasSortSlot() { return !!this.$slots.sort; },
      hasToggleSlot() { return !!this.$slots.toggle; },
      hasQuerySortCluster() {
        return this.hasQuerySlot || this.hasFilterSlot || this.hasSortSlot;
      },
      hasRightColumn() {
        return this.hasRightCustom || this.hasQuerySlot || this.hasFilterSlot || this.hasSortSlot || this.hasToggleSlot;
      },
      hasLeftColumn() {
        return this.hasLeftCustom || this.hasTotalSlot || this.hasSelectionSlot;
      },
    },
    template: `
      <div
        class="ds-info-control-rail ds-l1-control-rail"
        role="region"
        data-component="info-control-rail"
        :aria-label="ariaLabel"
      >
        <div
          v-if="hasLeftColumn"
          class="ds-info-control-rail__left"
          :class="{ 'ds-info-control-rail__left--custom': hasLeftCustom }"
        >
          <template v-if="hasLeftCustom">
            <slot name="left" />
          </template>
          <template v-else>
            <div v-if="hasTotalSlot" class="ds-info-control-rail__total ds-l1-control-rail__stats">
              <slot name="total" />
            </div>
            <div v-if="hasSelectionSlot" class="ds-info-control-rail__selection ds-l1-control-rail__ops">
              <slot name="selection" />
            </div>
          </template>
        </div>
        <div
          v-if="hasRightColumn"
          class="ds-info-control-rail__right ds-l1-control-rail__display"
        >
          <template v-if="hasRightCustom">
            <slot name="right" />
          </template>
          <template v-else>
            <div class="ds-l1-control-display-cluster">
              <div class="ds-l1-filter-sort-bar ds-info-control-rail__filter-sort-bar">
                <div
                  v-if="hasQuerySortCluster"
                  class="l1-rail-query-sort-cluster ds-info-control-rail__query-sort-cluster"
                >
                  <div v-if="hasQuerySlot" class="ds-info-control-rail__slot ds-info-control-rail__slot--query">
                    <slot name="query" />
                  </div>
                  <div v-if="hasFilterSlot" class="ds-info-control-rail__slot ds-info-control-rail__slot--filter">
                    <slot name="filter" />
                  </div>
                  <div v-if="hasSortSlot" class="ds-info-control-rail__slot ds-info-control-rail__slot--sort">
                    <slot name="sort" />
                  </div>
                </div>
                <div v-if="hasToggleSlot" class="ds-info-control-rail__slot ds-info-control-rail__slot--toggle">
                  <slot name="toggle" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    `,
  };

  app.component('InfoControlRail', definition);
  app.component('UiInfoControlRail', definition);
})();
