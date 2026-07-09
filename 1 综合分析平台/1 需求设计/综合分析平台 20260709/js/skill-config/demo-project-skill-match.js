/**
 * 技能：配置校验与资料 ID 规范化（子串建议关联）。
 * 工作台内「引用/新建技能」后由 demo-cmp-project 延时触发 normalize，卡片上展示「匹配资料中」动效。
 * 依赖：demo-mock-data.js 中的 demoProjectAnalysisTemplatesById（Vue reactive）
 */
(function (global) {
  function getTimerState() {
    if (!global.__demoTemplateMatchTimers) global.__demoTemplateMatchTimers = {};
    if (!global.__demoTemplateMatchIntervals) global.__demoTemplateMatchIntervals = {};
    return { timers: global.__demoTemplateMatchTimers, intervals: global.__demoTemplateMatchIntervals };
  }

  function clearAllTemplateMatchTimers() {
    const { timers, intervals } = getTimerState();
    Object.keys(timers).forEach((k) => {
      window.clearTimeout(timers[k]);
      delete timers[k];
    });
    Object.keys(intervals).forEach((k) => {
      window.clearInterval(intervals[k]);
      delete intervals[k];
    });
  }

  function cancelTemplateMatchTimers(templateId) {
    const id = String(templateId || '');
    const { timers, intervals } = getTimerState();
    if (timers[id]) {
      window.clearTimeout(timers[id]);
      delete timers[id];
    }
    if (intervals[id]) {
      window.clearInterval(intervals[id]);
      delete intervals[id];
    }
  }

  /** 按文档特征 title 与资料名称做演示级子串匹配 */
  function autoMatchMaterialIdsForRule(rule, materials) {
    const rows = Array.isArray(materials) ? materials : [];
    if (!rows.length) return [];
    const title = String((rule && rule.title) || '')
      .trim()
      .toLowerCase();
    if (!title) return [];
    const ids = rows
      .filter((m) => String(m.name || '').toLowerCase().includes(title))
      .map((m) => m.id);
    return Array.from(new Set(ids.map((x) => String(x))));
  }

  function matchedMaterialCount(template) {
    const T = global.DemoSkillFileTree;
    const rules =
      T && typeof T.flattenToExtractionRules === 'function'
        ? T.flattenToExtractionRules(template || {})
        : Array.isArray(template && template.extractionRules)
          ? template.extractionRules
          : [];
    const ids = new Set();
    rules.forEach((r) => (Array.isArray(r.materialIds) ? r.materialIds : []).forEach((id) => ids.add(String(id))));
    return ids.size;
  }

  function isTemplateSelectable(template) {
    return !!template;
  }

  /** 校验是否可执行匹配/保存配置（不要求 materialIds） */
  function validateProjectSkillConfigForMatch(s, messageApi) {
    const msg = messageApi || {};
    if (!s) return false;
    if (!String(s.name || '').trim()) {
      if (msg.warning) msg.warning('请先填写技能名称（点击「编辑」）');
      return false;
    }
    if (!String(s.analysisRule || '').trim()) {
      if (msg.warning) msg.warning('请填写审计思路');
      return false;
    }
    const T = global.DemoSkillFileTree;
    if (T && typeof T.findDuplicatePaths === 'function') {
      const dups = T.findDuplicatePaths(Array.isArray(s.skillFiles) ? s.skillFiles : []);
      if (dups.length) {
        if (msg.warning) msg.warning('文件名路径重复：' + dups.join('、'));
        return false;
      }
    }
    const rules =
      T && typeof T.flattenToExtractionRules === 'function'
        ? T.flattenToExtractionRules(s)
        : Array.isArray(s.extractionRules)
          ? s.extractionRules
          : [];
    for (let i = 0; i < rules.length; i++) {
      const t = String(rules[i].title || '').trim();
      const b = String(rules[i].body || '').trim();
      if (!t || !b) {
        if (msg.warning) msg.warning(`第 ${i + 1} 个配置文件须填写文件名与具体内容`);
        return false;
      }
    }
    return true;
  }

  /** 不弹窗，用于按钮 disabled */
  function validateProjectSkillConfigSilent(s) {
    if (!s || !String(s.name || '').trim()) return false;
    if (!String(s.analysisRule || '').trim()) return false;
    const T = global.DemoSkillFileTree;
    if (T && typeof T.findDuplicatePaths === 'function') {
      const dups = T.findDuplicatePaths(Array.isArray(s.skillFiles) ? s.skillFiles : []);
      if (dups.length) return false;
    }
    const rules =
      T && typeof T.flattenToExtractionRules === 'function'
        ? T.flattenToExtractionRules(s)
        : Array.isArray(s.extractionRules)
          ? s.extractionRules
          : [];
    for (let i = 0; i < rules.length; i++) {
      if (!String(rules[i].title || '').trim() || !String(rules[i].body || '').trim()) return false;
    }
    return true;
  }

  function dedupeRuleMaterialIds(rule) {
    const next = { ...(rule || {}) };
    next.materialIds = Array.isArray(next.materialIds) ? Array.from(new Set(next.materialIds.map((x) => String(x)))) : [];
    return next;
  }

  function normalizeRuleForProjectTemplate(rule, autoMatchMaterialIdsForRule) {
    const next = { ...(rule || {}) };
    if (!Array.isArray(next.materialIds) || !next.materialIds.length) {
      next.materialIds = autoMatchMaterialIdsForRule(next);
    } else {
      next.materialIds = Array.from(new Set(next.materialIds.map((x) => String(x))));
    }
    return next;
  }

  /** 保留空实现：历史代码可能仍调用，已不再执行异步「匹配」流程 */
  function scheduleTemplateAutoMatch() {}

  function overviewTemplateCardStatusLine() {
    return '';
  }

  global.DemoProjectSkillMatch = {
    getTimerState,
    clearAllTemplateMatchTimers,
    cancelTemplateMatchTimers,
    autoMatchMaterialIdsForRule,
    matchedMaterialCount,
    isTemplateSelectable,
    validateProjectSkillConfigForMatch,
    validateProjectSkillConfigSilent,
    dedupeRuleMaterialIds,
    normalizeRuleForProjectTemplate,
    scheduleTemplateAutoMatch,
    overviewTemplateCardStatusLine,
  };
})(typeof window !== 'undefined' ? window : globalThis);
