(function () {
  const app = window.__DEMO_APP;
  if (!app) return;

  app.component('FreeAuditChatPanel', {
    props: {
      host: { type: Object, required: true },
    },
    template: `<ChatPanelShell :host="host" />`,
  });
})();
