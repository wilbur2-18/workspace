(function () {
  const app = window.__DEMO_APP;

    /** 系统管理 / 工作台详情等共用的左侧侧栏：a-layout-sider + a-menu。视觉统一走 `app-shell-sider-menu`（见 demo-app.css），勿在业务里复制一套。
     *
     * 尺寸同步：
     *   :width="200"           ← pm-ui-prototype-kit/css-reference/foundation.css --ds-layout-sider-width
     *   :collapsed-width="80"  ← pm-ui-prototype-kit/css-reference/foundation.css --ds-layout-sider-collapsed-width
     * antdv 的 :width prop 只接受 Number，无法直接绑 CSS var，修改 token 必须同步本处。
     * 详见 pm-ui-prototype-kit/ui-foundation.md（Layout）与 foundation/tokens.css 中侧栏相关 token。
     */
    app.component('AppShellSiderMenu', {
      props: {
        selectedKey: { type: String, required: true },
        /** [{ key, label, icon }] icon 为 DsIcon 逻辑名，如 menu */
        menuItems: { type: Array, required: true },
        siderClass: { type: String, default: '' },
        ariaLabel: { type: String, default: '' },
      },
      emits: ['update:selectedKey'],
      data() {
        return { sidebarCollapsed: false };
      },
      template: `
        <a-layout-sider
          v-model:collapsed="sidebarCollapsed"
          :width="200"
          :collapsed-width="80"
          theme="light"
          :class="['sider-with-footer', 'app-shell-sider-menu', siderClass].filter(Boolean)"
          :aria-label="ariaLabel || undefined"
        >
          <div class="sider-body">
            <a-menu :selectedKeys="[selectedKey]" mode="inline" :inline-collapsed="sidebarCollapsed" class="menu-borderless" @click="onMenuClick">
              <template v-for="item in menuItems" :key="item.key">
                <a-menu-item :key="item.key" :title="sidebarCollapsed ? item.label : undefined">
                  <template #icon><ds-icon :name="item.icon" /></template>
                  {{ item.label }}
                </a-menu-item>
              </template>
            </a-menu>
          </div>
          <div class="sider-footer" :class="{ 'is-sider-collapsed': sidebarCollapsed }">
            <button
              type="button"
              class="app-shell-sider-footer-toggle"
              :aria-expanded="sidebarCollapsed ? 'false' : 'true'"
              :aria-label="sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
              :title="sidebarCollapsed ? '展开' : '收起'"
              @click="sidebarCollapsed = !sidebarCollapsed"
            >
              <span class="app-shell-sider-footer-toggle__icon" aria-hidden="true">
                <svg class="iconpark-icon" :class="{ 'is-flipped': sidebarCollapsed }"><use href="#left-bar"></use></svg>
              </span>
              <span class="app-shell-sider-footer-toggle__label">{{ sidebarCollapsed ? '展开' : '收起' }}</span>
            </button>
          </div>
        </a-layout-sider>
      `,
      methods: {
        onMenuClick({ key }) {
          this.$emit('update:selectedKey', key);
        },
      },
    });

})();
