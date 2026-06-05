(function registerUiTableShell() {
  const app = window.__DEMO_APP;
  if (!app) return;
  if (app.component("UiTableShell")) return;

  app.component("UiTableShell", {
    template: '<section class="ds-l2-table-panel"><slot /></section>',
  });
})();
