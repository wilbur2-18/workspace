// skill-data.js
// 从 demo-mock-data.js 机械拆分，保留原有全局常量/函数名以兼容零构建脚本加载。

const DEMO_SKILL_LINKED_RESOURCE_PRESET_MAP = {
      'sk-pub-1': {
        ids: ['m-001-03', 'm-001-02', 'm-001-01'],
        meta: {
          'm-001-03': '命中规则：合同金额/付款条款',
          'm-001-02': '命中规则：发票金额/开票时间',
          'm-001-01': '关联类型：会议纪要（合同执行背景）',
        },
      },
      'sk-pub-2': {
        ids: ['m-001-07', 'm-001-08', 'm-001-10'],
        meta: {
          'm-001-07': '命中规则：计划投资字段',
          'm-001-08': '命中规则：实际完成进度字段',
          'm-001-10': '关联类型：验收报告（偏差说明）',
        },
      },
      'sk-prv-1': {
        ids: ['m-001-04', 'm-001-05'],
        meta: {
          'm-001-04': '命中规则：供应商主体',
          'm-001-05': '命中规则：收款方账号',
        },
      },
    };
    function getDemoSkillLinkedResourcePreset(skillId) {
      const raw = DEMO_SKILL_LINKED_RESOURCE_PRESET_MAP[String(skillId || '')] || null;
      return {
        ids: raw && Array.isArray(raw.ids) ? Array.from(new Set(raw.ids.map((x) => String(x)).filter(Boolean))) : [],
        meta: raw && raw.meta && typeof raw.meta === 'object' ? { ...raw.meta } : {},
      };
    }

const SKILL_LIBRARY = { PUBLIC: 'public', PRIVATE: 'private' };
    const SKILL_SEED_PUBLIC = [
      {
        id: 'sk-pub-1',
        library: 'public',
        name: '施工合同与发票一致性核查',
        description: '系统从合同与发票中自动抽取并对账，帮你快速发现金额与时间逻辑异常。',
        tags: ['城建', '金额', '合规'],
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
        createdAt: '2024-02-01 10:00',
        updatedAt: '2024-03-10 18:30',
        sharedBy: '系统预置',
      },
      {
        id: 'sk-pub-2',
        library: 'public',
        name: '投资完成进度偏差扫描',
        description: '系统对照计划与实际投资进度，自动标记偏离并提示是否需补充说明。',
        tags: ['投资', '进度', '财务'],
        skillFiles: [
          {
            id: 'sk-pub-2-fd',
            kind: 'folder',
            name: '结构化抽取',
            children: [
              {
                id: 'sk-pub-2-f1',
                kind: 'file',
                fileKind: 'md',
                codeLang: '',
                filename: '财务数据表.md',
                content: '提取计划投资、实际完成、完成比例等字段。',
              },
              {
                id: 'sk-pub-2-f2',
                kind: 'file',
                fileKind: 'md',
                codeLang: '',
                filename: '会议纪要.md',
                content: '提取会议时间、整改要求、责任主体与完成时限。',
              },
            ],
          },
        ],
        analysisRule: '按年度与截至月对比计划与实际完成比例，结合时间进度阈值标记偏差；归纳会议纪要中是否对滞后原因有书面说明。',
        createdAt: '2024-02-08 14:00',
        updatedAt: '2024-03-08 12:00',
        sharedBy: '审计管理员',
      },
      {
        id: 'sk-pub-3',
        library: 'public',
        name: '工程款节点支付合规核对',
        description: '系统比对合同付款节点与实际付款时间金额，提示提前支付或超节点支付风险。',
        tags: ['城建', '付款节点', '合规'],
        skillFiles: [
          {
            id: 'sk-pub-3-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '工程合同.md',
            content: '提取付款节点、节点条件、应付比例、签署日期。',
          },
          {
            id: 'sk-pub-3-f2',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '付款台账.md',
            content: '提取付款日期、付款金额、付款事由、对应合同编号。',
          },
        ],
        analysisRule: '按合同节点校验付款时间与金额，识别提前支付、超比例支付及缺少节点依据的付款记录。',
        createdAt: '2024-02-20 09:20',
        updatedAt: '2024-03-20 15:10',
        sharedBy: '平台管理员',
      },
      {
        id: 'sk-pub-4',
        library: 'public',
        name: '资金拨付与预算批复一致性检查',
        description: '系统对照预算批复、拨付台账与用途说明，定位超预算与用途偏离。',
        tags: ['预算', '资金拨付', '合规'],
        skillFiles: [
          {
            id: 'sk-pub-4-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '预算批复文件.md',
            content: '提取预算科目、批复金额、批复日期、使用范围。',
          },
          {
            id: 'sk-pub-4-f2',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '资金拨付记录.md',
            content: '提取拨付金额、拨付日期、用途说明、执行单位。',
          },
        ],
        analysisRule: '按预算科目汇总对比批复与实际拨付，标注超预算拨付与用途不匹配记录并输出风险说明。',
        createdAt: '2024-02-26 10:40',
        updatedAt: '2024-03-22 17:30',
        sharedBy: '资金监管组',
      },
    ];
    const SKILL_SEED_PRIVATE = [
      {
        id: 'sk-prv-1',
        library: 'private',
        name: '采购环节供应商交叉比对（试用）',
        description: '系统交叉核对合同与流水中供应商及账号，列出待核实项。',
        tags: ['采购', '私有'],
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
        createdAt: '2024-03-01 09:00',
        updatedAt: '2024-03-12 16:20',
      },
      {
        id: 'sk-prv-2',
        library: 'private',
        name: '往来科目余额勾稽',
        description: '系统按科目汇总余额变动，提示长期挂账与借贷方向异常。',
        tags: ['往来', '余额', '财务'],
        skillFiles: [
          {
            id: 'sk-prv-2-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '科目余额表.md',
            content: '提取科目代码、科目名称、期初、本期借/贷、期末余额。',
          },
          {
            id: 'sk-prv-2-f2',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '账龄附件.md',
            content: '提取账龄区间、金额、主要对手方说明。',
          },
        ],
        analysisRule: '对同名科目多期余额变动进行勾稽；标注余额长期不变或借贷方向与业务不符的科目。',
        createdAt: '2024-03-05 11:00',
        updatedAt: '2024-03-18 10:00',
      },
      {
        id: 'sk-prv-3',
        library: 'private',
        name: '三公经费异常波动扫描',
        description: '系统按部门扫描三公经费环比/同比波动，超限结果集中标出。',
        tags: ['三公', '预算', '私有'],
        skillFiles: [
          {
            id: 'sk-prv-3-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '费用明细.md',
            content: '提取费用类型、金额、发生日期、审批单号、部门。',
          },
        ],
        analysisRule: '计算各部门三类费用环比/同比，超过设定比例输出清单并要求说明原因。',
        createdAt: '2024-03-06 14:30',
        updatedAt: '2024-03-14 09:15',
      },
      {
        id: 'sk-prv-4',
        library: 'private',
        name: '往来函证缺口提醒',
        description: '系统对照发函与回函记录，汇总逾期未回与替代程序缺口。',
        tags: ['函证', '往来', '合规'],
        skillFiles: [
          {
            id: 'sk-prv-4-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '发函清单.md',
            content: '提取函证对象、科目、账面金额、发函日期。',
          },
          {
            id: 'sk-prv-4-f2',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '回函登记.md',
            content: '提取回函日期、差异说明、经办人。',
          },
        ],
        analysisRule: '匹配发函与回函记录；对超期未回函且无替代程序记录的条目汇总为待办。',
        applicableScenario: '往来函证阶段；资料中含发函登记与回函登记或回函快递单时启用。',
        createdAt: '2024-03-08 16:00',
        updatedAt: '2024-03-19 11:40',
      },
      {
        id: 'sk-prv-5',
        library: 'private',
        name: '资产类与盘点差异初筛',
        description: '系统比对资产卡片与盘点结果，初筛有账无物、有物无账线索。',
        tags: ['资产', '盘点'],
        skillFiles: [
          {
            id: 'sk-prv-5-f1',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '资产卡片.md',
            content: '提取资产编号、名称、原值、使用部门、存放地点。',
          },
          {
            id: 'sk-prv-5-f2',
            kind: 'file',
            fileKind: 'md',
            codeLang: '',
            filename: '盘点表.md',
            content: '提取实盘数量、盘盈盘亏标记、备注。',
          },
        ],
        analysisRule: '以编号或名称模糊匹配卡片与盘点行，输出双向未匹配清单供现场核实。',
        createdAt: '2024-03-11 09:20',
        updatedAt: '2024-03-11 09:20',
      },
    ];
    /** 技能库「我的技能」种子：多条已发布版本（演示：最新 + 历史折叠列表） */
    function buildDemoPrivateSkillPublishedVersions(seed) {
      if (!seed) return [];
      const baseSnap = (rev) => {
        const o = {
          name: seed.name || '未命名技能',
          description: seed.description || '',
          tags: Array.isArray(seed.tags) ? seed.tags.slice() : [],
          analysisRule: seed.analysisRule || '',
          applicableScenario: seed.applicableScenario != null ? String(seed.applicableScenario) : '',
          skillFiles: Array.isArray(seed.skillFiles) ? JSON.parse(JSON.stringify(seed.skillFiles)) : [],
        };
        if (rev > 0 && o.name && !/·\s*r\d+$/.test(o.name)) o.name = o.name + ' · r' + rev;
        return o;
      };
      const labels = ['v1.0.0', 'v1.0.1', 'v1.0.2', 'v1.0.3', 'v1.0.4', 'v1.0.5', 'v1.0.6'];
      const times = [
        '2026-01-05 10:00',
        '2026-02-01 14:20',
        '2026-02-15 09:30',
        '2026-02-28 11:00',
        '2026-03-05 16:45',
        '2026-03-08 20:00',
        '2026-03-09 22:11',
      ];
      return labels.map((versionLabel, i) => ({
        versionLabel,
        versionNote: '演示：' + versionLabel + ' 发布说明（可恢复快照）。',
        createdAt: times[i] || seed.updatedAt || seed.createdAt || '2026-03-09 22:11',
        publisherName: '周宇',
        publisherRole: '（教授）',
        versionStatus: 'published',
        snapshot: baseSnap(i),
      }));
    }
    (SKILL_SEED_PRIVATE || []).forEach((s) => {
      if (!s) return;
      if (!Array.isArray(s.publishedVersions)) s.publishedVersions = [];
      if (s.publishedVersions.length === 0) s.publishedVersions = buildDemoPrivateSkillPublishedVersions(s);
    });
    /** 工作台 / 审计助手「引用技能」共用的「我的技能」池（可运行时追加） */
    function demoSeedToAnalysisTemplateShape(seed, library) {
      const skillFiles = Array.isArray(seed.skillFiles)
        ? JSON.parse(JSON.stringify(seed.skillFiles))
        : [];
      const linkedPreset = getDemoSkillLinkedResourcePreset(seed && seed.id);
      const linkedIdsFromSeed = Array.isArray(seed && seed.linkedResourceIds)
        ? seed.linkedResourceIds.map((id) => String(id))
        : linkedPreset.ids;
      const row = {
        id: seed.id,
        name: seed.name,
        description: seed.description || '',
        tags: Array.isArray(seed.tags) ? seed.tags.slice() : [],
        skillFiles,
        analysisRule: seed.analysisRule || '',
        applicableScenario: seed.applicableScenario != null ? String(seed.applicableScenario) : '',
        createdAt: seed.createdAt,
        updatedAt: seed.updatedAt,
        library: library || seed.library || 'private',
        extractionRules: [],
        linkedResourceIds: Array.from(new Set(linkedIdsFromSeed.filter(Boolean))),
        linkedResourceMeta: seed && seed.linkedResourceMeta && typeof seed.linkedResourceMeta === 'object'
          ? { ...seed.linkedResourceMeta }
          : linkedPreset.meta,
        publishedVersions: Array.isArray(seed.publishedVersions)
          ? JSON.parse(JSON.stringify(seed.publishedVersions))
          : [],
      };
      if (seed.sourceSkillId) row.sourceSkillId = seed.sourceSkillId;
      if (seed.sourceLibrary) row.sourceLibrary = seed.sourceLibrary;
      if (seed.sourceSkillName) row.sourceSkillName = seed.sourceSkillName;
      if (seed.sourceVersionLabel) row.sourceVersionLabel = seed.sourceVersionLabel;
      if (typeof DemoSkillFileTree !== 'undefined' && DemoSkillFileTree.syncExtractionRulesFromSkillFiles) {
        DemoSkillFileTree.syncExtractionRulesFromSkillFiles(row);
      }
      return row;
    }
    const demoSharedPrivateAnalysisTemplatePool = Vue.reactive(
      (SKILL_SEED_PRIVATE || []).map((s) => demoSeedToAnalysisTemplateShape(s, 'private'))
    );
    function skillDeepClone(o) { return JSON.parse(JSON.stringify(o)); }
    function newSkillId(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

(function registerDemoSkillData(global) {
  global.DemoSkillData = {
    skillLibrary: typeof SKILL_LIBRARY !== 'undefined' ? SKILL_LIBRARY : {},
    publicSkillSeeds: typeof SKILL_SEED_PUBLIC !== 'undefined' ? SKILL_SEED_PUBLIC : [],
    privateSkillSeeds: typeof SKILL_SEED_PRIVATE !== 'undefined' ? SKILL_SEED_PRIVATE : [],
    sharedPrivateAnalysisTemplates: typeof demoSharedPrivateAnalysisTemplatePool !== 'undefined' ? demoSharedPrivateAnalysisTemplatePool : [],
  };
})(window);
