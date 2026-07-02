(function registerUiPageShell() {
  const app = window.__DEMO_APP;
  if (!app) return;
  if (app.component("UiPageShell")) return;

  app.component("UiPageShell", {
    template: `
      <section class="ds-page-shell">
        <slot name="hero"></slot>
        <slot name="toolbar"></slot>
        <slot name="rail"></slot>
        <slot></slot>
      </section>
    `,
  });
})();
