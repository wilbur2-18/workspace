/**
 * pm-ui-prototype-kit 弹窗工厂（确认类）
 * 删除 / 批量操作二次确认：文案、520 宽、删除主钮 danger 均在此收敛。
 */
(function () {
  if (typeof window === 'undefined' || !window.antd) return;
  var Modal = window.antd.Modal;

  var CONFIRM_WRAP = 'modal-w-520';

  var CONFIRM_COPY = {
    delete: {
      default: '删除后不可恢复，请确认是否删除？',
      task: '删除后将同步删除结果且不可恢复，是否确认删除？',
      taskBatch: '删除后将同步删除子任务与结果且不可恢复，是否确认删除？',
    },
  };

  function buildDeleteContent(kind, syncScope, taskBatch) {
    var k = kind || 'default';
    if (k === 'folder') {
      var scope = String(syncScope || '该项').trim() || '该项';
      return '删除后将同步删除' + scope + '且不可恢复，请确认是否删除？';
    }
    if (k === 'task') {
      return taskBatch ? CONFIRM_COPY.delete.taskBatch : CONFIRM_COPY.delete.task;
    }
    return CONFIRM_COPY.delete.default;
  }

  function baseConfirm(opts, danger) {
    var o = opts || {};
    var useDanger = danger || o.danger === true;
    var config = {
      centered: true,
      wrapClassName: CONFIRM_WRAP,
      title: o.title || '',
      content: o.content != null ? o.content : '',
      okText: o.okText || '确定',
      cancelText: o.cancelText || '取消',
      onOk: o.onOk,
      onCancel: o.onCancel,
    };
    if (useDanger) {
      /* 实心预警红钮：须 primary + dangerous，与 runtime-ui 中 .ant-btn-primary.ant-btn-dangerous 对齐 */
      config.okType = 'primary';
      config.okButtonProps = Object.assign({}, o.okButtonProps || {}, { danger: true });
    }
    return Modal.confirm(config);
  }

  /**
   * @param {Object} opts
   * @param {'default'|'folder'|'task'} [opts.kind]
   * @param {string} [opts.syncScope] folder kind：同步删除范围描述
   * @param {boolean} [opts.taskBatch] task kind：跑批父任务
   * @param {string} [opts.title]
   * @param {string} [opts.batchTitle] 同 title，批量时整段标题
   * @param {string} [opts.subject] 无 title 时拼「确定删除{subject}？」
   * @param {string} [opts.content] 覆盖自动正文
   * @param {string} [opts.okText]
   * @param {Function} opts.onOk
   */
  function dsConfirmDelete(opts) {
    var o = opts || {};
    var kind = o.kind || 'default';
    var title =
      o.title ||
      o.batchTitle ||
      (o.name ? '删除「' + o.name + '」？' : '确定删除' + (o.subject || '该项') + '？');
    var content = o.content != null ? o.content : buildDeleteContent(kind, o.syncScope, o.taskBatch);
    return baseConfirm(
      {
        title: title,
        content: content,
        okText: o.okText || '删除',
        cancelText: o.cancelText,
        onOk: o.onOk,
        onCancel: o.onCancel,
      },
      true
    );
  }

  /**
   * 非删除类二次确认（中止、重跑、批量共享等）
   * @param {Object} opts
   * @param {string} opts.title
   * @param {string} [opts.content]
   * @param {string} opts.okText
   */
  function dsConfirmAction(opts) {
    var o = opts || {};
    return baseConfirm(
      {
        title: o.title || '',
        content: o.content,
        okText: o.okText || '确定',
        cancelText: o.cancelText,
        onOk: o.onOk,
        onCancel: o.onCancel,
      },
      false
    );
  }

  window.dsConfirm = window.dsConfirm || {};
  window.dsConfirm.WRAP_CLASS = CONFIRM_WRAP;
  window.dsConfirm.COPY = CONFIRM_COPY;
  window.dsConfirm.buildDeleteContent = buildDeleteContent;
  window.dsConfirm.delete = dsConfirmDelete;
  window.dsConfirm.action = dsConfirmAction;
})();
