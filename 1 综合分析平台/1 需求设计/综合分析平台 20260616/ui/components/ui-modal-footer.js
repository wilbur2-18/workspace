(function registerUiModalFooter() {
  const app = window.__DEMO_APP;
  if (!app) return;
  if (app.component("UiModalFooter")) return;

  app.component("UiModalFooter", {
    template: '<div class="ds-modal-footer-end"><slot /></div>',
  });
})();
