(function () {
  const app = window.__DEMO_APP;
  if (!app) return;

  if (!(app._context && app._context.components && app._context.components.FreeAuditChatPanel)) {
    app.component('FreeAuditChatPanel', {
      props: {
        host: { type: Object, required: true },
      },
      template: `<ChatPanelShell :host="host" />`,
    });
  }
})();
