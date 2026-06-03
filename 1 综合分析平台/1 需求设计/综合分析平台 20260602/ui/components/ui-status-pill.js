(function registerUiStatusPill() {
  const app = window.__DEMO_APP;
  if (!app) return;
  if (app.component("UiStatusPill")) return;

  app.component("UiStatusPill", {
    props: ["state", "label"],
    computed: {
      cls() {
        const s = (this.state || "neutral").toLowerCase();
        return `ds-status-pill is-${s}`;
      },
    },
    template: '<span :class="cls">{{ label }}</span>',
  });
})();
