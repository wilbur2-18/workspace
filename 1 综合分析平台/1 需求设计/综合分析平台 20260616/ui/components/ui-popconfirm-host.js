(function registerDsPopconfirmHost() {
  const app = window.__DEMO_APP;
  if (!app || app.component('DsPopconfirmHost')) return;

  const state = window.__dsConfirmState;
  if (!state) return;

  app.component('DsPopconfirmHost', {
    data() {
      return { state };
    },
    watch: {
      'state.open'(open) {
        if (
          !open &&
          (this.state.pinnedMenu || this.state.onOk || this.state.onCancel)
        ) {
          window.dsConfirm.close();
        }
      },
    },
    methods: {
      popupContainer(triggerNode) {
        const pinned = this.state.pinnedMenu;
        if (pinned && pinned.dropdown && document.body.contains(pinned.dropdown)) {
          return pinned.dropdown;
        }
        if (triggerNode && triggerNode.closest) {
          const drop = triggerNode.closest('.ant-dropdown');
          if (drop) return drop;
        }
        return document.body;
      },
      async onConfirm() {
        const ok = this.state.onOk;
        this.state.okLoading = true;
        try {
          await window.dsConfirm.runMaybeAsync(ok);
        } finally {
          this.state.okLoading = false;
          window.dsConfirm.close();
        }
      },
      onCancel() {
        if (this.state.onCancel) this.state.onCancel();
        window.dsConfirm.close();
      },
    },
    template: `
      <div class="ds-popconfirm-host" aria-hidden="true">
        <a-popconfirm
          v-model:open="state.open"
          :trigger="[]"
          :title="state.title"
          :description="state.content || undefined"
          :ok-text="state.okText"
          :cancel-text="state.cancelText"
          :ok-button-props="{ danger: state.danger, loading: state.okLoading }"
          :placement="state.placement || 'rightTop'"
          overlay-class-name="ds-popconfirm-host-overlay"
          :get-popup-container="popupContainer"
          @confirm="onConfirm"
          @cancel="onCancel"
        >
          <span
            class="ds-popconfirm-host__trigger"
            :style="{ left: state.anchorX + 'px', top: state.anchorY + 'px' }"
          ></span>
        </a-popconfirm>
      </div>
    `,
  });
})();
