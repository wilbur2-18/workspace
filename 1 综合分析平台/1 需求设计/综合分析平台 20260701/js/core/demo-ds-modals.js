/**
 * pm-ui-prototype-kit 确认工厂
 * 小浮层仅用于对话列表、任务列表、资源目录和结果目录中的删除确认。
 * 其他二次确认统一使用页面级 Modal.confirm。
 */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !window.Vue) return;

  var reactive = Vue.reactive;
  var nextTick = Vue.nextTick;
  var Modal = window.antd && window.antd.Modal;

  var CONFIRM_WRAP = 'modal-w-520';

  var CONFIRM_COPY = {
    delete: {
      default: '删除后不可恢复，请确认是否删除？',
      task: '删除后将同步删除结果且不可恢复，是否确认删除？',
      taskBatch: '删除后将同步删除子任务与结果且不可恢复，是否确认删除？',
    },
  };

  var lastPointer = { x: 0, y: 0, el: null, menuEvent: null };
  var lastDropdownTrigger = { x: 0, y: 0, el: null, at: 0 };
  var confirmGen = 0;
  var INFO_BORDER_SELECTOR = [
    '.nlm-tree-leaf',
    '.workbench-bulk-bar',
    '.project-material-upload__file',
    '.project-material-upload__file-panel',
    '.nlm-extraction-card',
    '.wb-task-create-transfer__list-item',
  ].join(', ');

  function capturePointer(ev) {
    if (!ev) return;
    lastPointer.x = ev.clientX;
    lastPointer.y = ev.clientY;
    var target = ev.target;
    var menuItem = target && target.closest ? target.closest('.ant-dropdown-menu-item, .ant-menu-item') : null;
    lastPointer.menuEvent = menuItem ? ev : null;
    if (target && target.closest) {
      lastPointer.el = target.closest(
        'button, .ant-btn, .ant-menu-item, .ant-dropdown-menu-item, [role="menuitem"], .ds-icon-btn, .nlm-tree-leaf-action-icon, .ant-tabs-tab, .ant-segmented-item, a'
      );
    } else {
      lastPointer.el = target || null;
    }
    if (!lastPointer.el) lastPointer.el = target || null;
    if (menuItem) lastPointer.el = menuItem;
    if (!menuItem && lastPointer.el && lastPointer.el.closest && lastPointer.el.closest('.ant-dropdown, .ant-dropdown-menu')) return;
    if (!menuItem && lastPointer.el) {
      lastDropdownTrigger = {
        x: ev.clientX,
        y: ev.clientY,
        el: lastPointer.el,
        at: Date.now(),
      };
    }
  }

  document.addEventListener('pointerdown', capturePointer, true);
  document.addEventListener('click', capturePointer, true);

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

  function resolveMenuEvent(opts) {
    var o = opts || {};
    return o.event || lastPointer.menuEvent || null;
  }

  function resolveAnchor(opts) {
    var o = opts || {};
    var menuEvent = resolveMenuEvent(o);
    if (menuEvent) {
      var activeTrigger = findActiveDropdownTrigger() || recentDropdownTrigger();
      var infoBorder =
        (activeTrigger && findInfoBorderElement(activeTrigger.el)) ||
        findInfoBorderElement(lastDropdownTrigger.el);
      return {
        x: activeTrigger ? activeTrigger.x : menuEvent.clientX,
        y: activeTrigger ? activeTrigger.y : menuEvent.clientY,
        el:
          o.trigger ||
          infoBorder ||
          (activeTrigger && activeTrigger.el) ||
          (menuEvent.currentTarget && menuEvent.currentTarget.nodeType ? menuEvent.currentTarget : null) ||
          lastPointer.el,
        menuEvent: menuEvent,
        infoBorder: !!infoBorder,
      };
    }
    if (o.event) {
      return {
        x: o.event.clientX,
        y: o.event.clientY,
        el:
          o.trigger ||
          (o.event.currentTarget && o.event.currentTarget.nodeType ? o.event.currentTarget : null) ||
          lastPointer.el,
      };
    }
    if (o.trigger && o.trigger.getBoundingClientRect) {
      var rect = o.trigger.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.bottom, el: o.trigger };
    }
    return { x: lastPointer.x, y: lastPointer.y, el: lastPointer.el };
  }

  function findInfoBorderElement(el) {
    return el && el.closest ? el.closest(INFO_BORDER_SELECTOR) : null;
  }

  function recentDropdownTrigger() {
    if (!lastDropdownTrigger.el || !document.body.contains(lastDropdownTrigger.el)) return null;
    if (Date.now() - lastDropdownTrigger.at > 5000) return null;
    return lastDropdownTrigger;
  }

  function findActiveDropdownTrigger() {
    var list = Array.from(document.querySelectorAll('.ant-dropdown-open'));
    var el = list.find(function (item) {
      return item && item.closest && !item.closest('.ant-dropdown, .ant-dropdown-menu');
    });
    if (!el || !el.getBoundingClientRect) return null;
    var rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      el: el,
      at: Date.now(),
    };
  }

  function resolveAnchorPoint(anchor) {
    var rect = anchor.el && anchor.el.getBoundingClientRect ? anchor.el.getBoundingClientRect() : null;
    if (rect && anchor.infoBorder) {
      var viewportMid = (window.innerWidth || document.documentElement.clientWidth || 0) / 2;
      var rowMid = rect.left + rect.width / 2;
      var pointLeft = rowMid > viewportMid;
      return {
        x: Math.round(pointLeft ? rect.left : rect.right),
        y: Math.round(rect.top + rect.height / 2),
        placement: pointLeft ? 'left' : 'right',
      };
    }
    if (anchor && anchor.menuEvent && rect) {
      return { x: Math.round(rect.right - 4), y: Math.round(rect.top + rect.height / 2), placement: 'rightTop' };
    }
    if (anchor && anchor.menuEvent) {
      return { x: Math.round(anchor.x || 0), y: Math.round(anchor.y || 0), placement: 'rightTop' };
    }
    if (rect) {
      return { x: Math.round(rect.right - 4), y: Math.round(rect.top + rect.height / 2), placement: 'rightTop' };
    }
    return { x: Math.round(anchor.x || 0), y: Math.round(anchor.y || 0), placement: 'rightTop' };
  }

  function runMaybeAsync(fn) {
    return new Promise(function (resolve, reject) {
      var result;
      try {
        result = fn && fn();
      } catch (err) {
        reject(err);
        return;
      }
      if (result && typeof result.then === 'function') {
        result.then(resolve).catch(reject);
        return;
      }
      resolve(result);
    });
  }

  var state = reactive({
    open: false,
    title: '',
    content: '',
    okText: '确定',
    cancelText: '取消',
    danger: false,
    okLoading: false,
    anchorX: 0,
    anchorY: 0,
    placement: 'rightTop',
    onOk: null,
    onCancel: null,
  });

  window.__dsConfirmState = state;

  function closeActiveConfirm() {
    confirmGen += 1;
    state.open = false;
    state.okLoading = false;
    state.onOk = null;
    state.onCancel = null;
    lastPointer.menuEvent = null;
  }

  function openAnchorConfirm(opts, danger) {
    var o = opts || {};
    var useDanger = danger === true || o.danger === true;
    var anchor = resolveAnchor(o);
    closeActiveConfirm();
    var menuItem =
      anchor.el && anchor.el.closest
        ? anchor.el.closest('.ant-dropdown-menu-item, .ant-menu-item')
        : null;
    if (menuItem) {
      anchor.el = menuItem;
    }

    var point = resolveAnchorPoint(anchor);
    state.title = o.title || '';
    state.content = o.content != null ? String(o.content) : '';
    state.okText = o.okText || '确定';
    state.cancelText = o.cancelText || '取消';
    state.danger = useDanger;
    state.anchorX = point.x;
    state.anchorY = point.y;
    state.placement = point.placement || 'rightTop';
    state.onOk = o.onOk;
    state.onCancel = o.onCancel;
    state.okLoading = false;
    var openGen = confirmGen + 1;
    confirmGen = openGen;
    state.open = false;
    nextTick(function () {
      if (openGen !== confirmGen) return;
      state.open = true;
    });

    return { destroy: closeActiveConfirm };
  }

  function dsConfirmDelete(opts) {
    var o = opts || {};
    var kind = o.kind || 'default';
    var title =
      o.title ||
      o.batchTitle ||
      (o.name ? '删除「' + o.name + '」？' : '确定删除' + (o.subject || '该项') + '？');
    var content = o.content != null ? o.content : buildDeleteContent(kind, o.syncScope, o.taskBatch);
    return openAnchorConfirm(
      {
        title: title,
        content: content,
        okText: o.okText || '删除',
        cancelText: o.cancelText,
        onOk: o.onOk,
        onCancel: o.onCancel,
        trigger: o.trigger,
        event: o.event,
      },
      true
    );
  }

  function openPageConfirm(opts, danger) {
    var o = opts || {};
    var useDanger = danger === true || o.danger === true;
    if (!Modal || typeof Modal.confirm !== 'function') {
      if (typeof o.onOk === 'function') return o.onOk();
      return;
    }
    return Modal.confirm({
      wrapClassName: o.wrapClassName || CONFIRM_WRAP,
      title: o.title || '',
      content: o.content != null ? o.content : '',
      okText: o.okText || '确定',
      cancelText: o.cancelText || '取消',
      centered: true,
      icon: null,
      okButtonProps: useDanger ? { danger: true } : o.okButtonProps,
      onOk: o.onOk,
      onCancel: o.onCancel,
    });
  }

  function dsConfirmPageDelete(opts) {
    var o = opts || {};
    var title =
      o.title ||
      o.batchTitle ||
      (o.name ? '删除「' + o.name + '」？' : '确定删除' + (o.subject || '该项') + '？');
    var content = o.content != null ? o.content : buildDeleteContent(o.kind || 'default', o.syncScope, o.taskBatch);
    return openPageConfirm(
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

  function dsConfirmAction(opts) {
    var o = opts || {};
    return openPageConfirm(
      {
        title: o.title || '',
        content: o.content,
        okText: o.okText || '确定',
        cancelText: o.cancelText,
        onOk: o.onOk,
        onCancel: o.onCancel,
        trigger: o.trigger,
        event: o.event,
      },
      false
    );
  }

  window.dsConfirm = window.dsConfirm || {};
  window.dsConfirm.WRAP_CLASS = CONFIRM_WRAP;
  window.dsConfirm.COPY = CONFIRM_COPY;
  window.dsConfirm.buildDeleteContent = buildDeleteContent;
  window.dsConfirm.delete = dsConfirmDelete;
  window.dsConfirm.page = openPageConfirm;
  window.dsConfirm.pageDelete = dsConfirmPageDelete;
  window.dsConfirm.action = dsConfirmAction;
  window.dsConfirm.close = closeActiveConfirm;
  window.dsConfirm.runMaybeAsync = runMaybeAsync;
  window.dsConfirm.setAnchor = function (eventOrEl) {
    if (!eventOrEl) return;
    if (eventOrEl.getBoundingClientRect) {
      lastPointer.el = eventOrEl;
      var r = eventOrEl.getBoundingClientRect();
      lastPointer.x = r.left + r.width / 2;
      lastPointer.y = r.bottom;
      return;
    }
    capturePointer(eventOrEl);
  };
})();
