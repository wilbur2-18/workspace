// project-data.js
// 从 demo-mock-data.js 机械拆分，保留原有全局常量/函数名以兼容零构建脚本加载。

/** 工作台级分析技能（工作台与审计助手共享，新增技能在两端同步可见） */
    const demoProjectAnalysisTemplatesById = Vue.reactive({
      'PRJ-2026-001': [
        {
          id: 'sk-prj-fork-001',
          library: 'public',
          name: '施工合同与发票一致性核查',
          sourceSkillId: 'sk-pub-1',
          sourceLibrary: 'public',
          sourceSkillName: '施工合同与发票一致性核查',
          sourceVersionLabel: '组织快照',
          tags: ['城建', '金额', '合规'],
          auditScene: 'construction',
          skillType: 'verification',
          skillFiles: [
            {
              id: 'sk-pub-1-f1',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '施工合同.md',
              content: '从施工合同中提取：合同金额、付款方式、工程期限、甲乙双方。',
            },
            {
              id: 'sk-pub-1-f2',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '发票.md',
              content: '从发票中提取：发票金额、开票日期、销方名称、购方名称。',
            },
          ],
          analysisRule: '比对合同金额与发票累计金额，识别超付或少付；检查发票开具日期与合同签订日期的先后关系并标注异常。',
          linkedResourceIds: ['m-001-03', 'm-001-02', 'm-001-01'],
          linkedResourceMeta: {
            'm-001-03': '命中规则：合同金额/付款条款',
            'm-001-02': '命中规则：发票金额/开票时间',
            'm-001-01': '关联类型：会议纪要（合同执行背景）',
          },
          createdBy: '我',
          ownerOrg: '审计管理组',
          updatedAt: '2026-06-11 15:29',
        },
        {
          id: 'sk-prj-fork-002',
          library: 'private',
          name: '采购环节供应商交叉比对（试用）',
          sourceSkillId: 'sk-prv-1',
          sourceLibrary: 'private',
          sourceSkillName: '采购环节供应商交叉比对（试用）',
          sourceVersionLabel: '技能库副本',
          tags: ['采购', '私有'],
          auditScene: 'procurement',
          skillType: 'verification',
          skillFiles: [
            {
              id: 'sk-prv-1-f1',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '采购合同.md',
              content: '提取供应商名称、合同金额、签约日期、付款节点。',
            },
            {
              id: 'sk-prv-1-f2',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '付款流水.md',
              content: '提取收款方名称、金额、日期、摘要。',
            },
          ],
          analysisRule: '比对合同供应商与流水中收款方一致性；对名称近似但非完全一致的情况列出待人工核实清单。',
          linkedResourceIds: ['m-001-04', 'm-001-05'],
          linkedResourceMeta: {
            'm-001-04': '命中规则：供应商主体',
            'm-001-05': '命中规则：收款方账号',
          },
          createdBy: '我',
          ownerOrg: '审计管理组',
          updatedAt: '2026-06-09 18:00',
        },
        {
          id: 'sk-prj-fork-003',
          library: 'private',
          name: '合同变更链路与金额追踪（演示失败）',
          sourceSkillId: 'sk-prv-2',
          sourceLibrary: 'private',
          sourceSkillName: '合同变更链路与金额追踪（技能）',
          sourceVersionLabel: '技能库副本',
          tags: ['合同', '变更'],
          auditScene: 'construction',
          skillType: 'analysis',
          skillFiles: [
            {
              id: 'sk-prv-2-f1',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '合同变更记录.md',
              content: '提取变更金额、变更时间、审批单号和对应合同条款编号。',
            },
            {
              id: 'sk-prv-2-f2',
              kind: 'file',
              fileKind: 'md',
              codeLang: '',
              filename: '付款台账.md',
              content: '提取付款金额、付款节点、付款时间并与变更单进行映射。',
            },
          ],
          analysisRule: '识别合同变更金额与后续付款流水是否存在链路断点，定位未闭环变更单。',
          linkedResourceIds: ['m-001-09'],
          linkedResourceMeta: {
            'm-001-09': '命中规则：变更单号/金额映射',
          },
          createdBy: '我',
          ownerOrg: '审计管理组',
          updatedAt: '2026-06-10 09:00',
        },
      ],
      'PRJ-2026-003': [],
    });
    ['PRJ-2026-002', 'PRJ-2026-003'].forEach((pid) => {
      demoProjectAnalysisTemplatesById[pid] = JSON.parse(JSON.stringify(demoProjectAnalysisTemplatesById['PRJ-2026-001'] || []));
    });
    demoProjectAnalysisTemplatesById['PRJ-2026-004'] = [];
    (function hydrateProjectTemplateExtractionRules() {
      const T = typeof DemoSkillFileTree !== 'undefined' ? DemoSkillFileTree : null;
      if (!T || typeof T.syncExtractionRulesFromSkillFiles !== 'function') return;
      Object.keys(demoProjectAnalysisTemplatesById).forEach((pid) => {
        const list = demoProjectAnalysisTemplatesById[pid];
        (list || []).forEach((row) => T.syncExtractionRulesFromSkillFiles(row));
      });
    })();
    (function hydrateProjectTemplateSkillDimensions() {
      const resolve = typeof resolveDemoSkillDimensionsFromSourceId === 'function'
        ? resolveDemoSkillDimensionsFromSourceId
        : null;
      if (!resolve) return;
      Object.keys(demoProjectAnalysisTemplatesById).forEach((pid) => {
        (demoProjectAnalysisTemplatesById[pid] || []).forEach((row) => {
          if (!row || (row.auditScene && row.skillType)) return;
          const dims = resolve(row.sourceSkillId || row.id);
          if (!row.auditScene && dims.auditScene) row.auditScene = dims.auditScene;
          if (!row.skillType && dims.skillType) row.skillType = dims.skillType;
        });
      });
    })();

(function registerDemoProjectData(global) {
  global.DemoProjectData = {
    projects: typeof demoProjectSpaces !== 'undefined' ? demoProjectSpaces : [],
    materialFoldersByProject: typeof demoProjectMaterialFoldersById !== 'undefined' ? demoProjectMaterialFoldersById : {},
    projectAnalysisTemplatesByProject: typeof demoProjectAnalysisTemplatesById !== 'undefined' ? demoProjectAnalysisTemplatesById : {},
  };
})(window);
