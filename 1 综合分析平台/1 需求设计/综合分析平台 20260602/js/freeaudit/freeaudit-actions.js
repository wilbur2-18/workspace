(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};
  const groups = NS.actionGroups || {};

  NS.actions = Object.assign(
    {},
    groups.taskActions || {},
    groups.resourceActions || {},
    groups.resultActions || {},
    groups.bulkActions || {},
    groups.skillActions || {},
    groups.chatActions || {}
  );
})();
