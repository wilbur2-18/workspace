(function (global) {
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value == null ? null : value));
  }

  function normalizeTags(tags) {
    return JSON.stringify(
      [...(tags || [])]
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .sort()
    );
  }

  function normalizeStringList(list) {
    return JSON.stringify(
      [...(list || [])]
        .map((item) => String(item).trim())
        .filter(Boolean)
        .sort()
    );
  }

  function basicSnapshot(form) {
    const f = form || {};
    return {
      name: f.name,
      description: f.description,
      skillType: f.skillType || '',
      auditScene: f.auditScene || '',
      skillInputs: Array.isArray(f.skillInputs) ? [...f.skillInputs] : [],
      outputSummary: f.outputSummary || '',
    };
  }

  function basicDirty(form, snap) {
    if (!snap) return false;
    const f = form || {};
    return (
      String(f.name || '') !== String(snap.name || '')
      || String(f.description || '') !== String(snap.description || '')
      || String(f.skillType || '') !== String(snap.skillType || '')
      || String(f.auditScene || '') !== String(snap.auditScene || '')
      || normalizeStringList(f.skillInputs) !== normalizeStringList(snap.skillInputs)
      || String(f.outputSummary || '') !== String(snap.outputSummary || '')
    );
  }

  function skillSnapshot(skill) {
    try {
      return deepClone(skill);
    } catch (_) {
      return null;
    }
  }

  function configDirty(skill, snap) {
    if (!snap || !skill) return false;
    try {
      return JSON.stringify(skillSnapshot(skill)) !== JSON.stringify(snap);
    } catch (_) {
      return true;
    }
  }

  function validateSkillFilesForSave(skill, messageApi) {
    const T = global.DemoSkillFileTree;
    if (!skill || !T) return false;
    const dups = T.findDuplicatePaths(skill.skillFiles || []);
    if (dups.length) {
      if (messageApi && messageApi.warning) messageApi.warning('文件名路径重复：' + dups.join('、'));
      return false;
    }
    if (!String(skill.analysisRule || '').trim()) {
      if (messageApi && messageApi.warning) messageApi.warning('请填写审计思路');
      return false;
    }
    let bad = false;
    const walk = (nodes) => {
      (nodes || []).forEach((node) => {
        if (!node) return;
        if (node.kind === 'folder') {
          if (!String(node.name || '').trim()) bad = true;
          walk(node.children);
        } else if (node.kind === 'file') {
          if (!String(node.filename || '').trim() || !String(node.content || '').trim()) bad = true;
        }
      });
    };
    walk(skill.skillFiles || []);
    if (bad) {
      if (messageApi && messageApi.warning) messageApi.warning('每个文件夹须有名称；每个文件须填写文件名与具体内容');
      return false;
    }
    return true;
  }

  global.DemoSkillConfig = {
    deepClone,
    normalizeTags,
    basicSnapshot,
    basicDirty,
    skillSnapshot,
    configDirty,
    validateSkillFilesForSave,
  };
})(typeof window !== 'undefined' ? window : globalThis);
