    const { createApp, h } = Vue;
    const { message, Modal } = antd;
    // hash 仍为 freeaudit 以保持书签兼容；产品语义为「审计助手」（非独立「自由审计」产品线）
    function demoTelemetry(event, payload) {
      try {
        const row = { t: Date.now(), e: event, p: payload || {} };
        (window.__demoTelemetry = window.__demoTelemetry || []).push(row);
        if (typeof console !== 'undefined' && console.debug) console.debug('[demo-telemetry]', row);
      } catch (err) { /* ignore */ }
    }
    const VIEW_IDS = { PROJECT: 'project', TEMPLATE: 'template', SETTINGS: 'settings', FREE_AUDIT: 'freeaudit', FREE_AUDIT_V2: 'freeaudit-v2' };
    /** 色种与 Ant token 来源：`./ui/runtime-theme.antdv.js`（须先于本文件加载）。 */
    const F = globalThis.DS_FOUNDATION;
    if (!F) {
      throw new Error(
        '缺少 DS_FOUNDATION：请在 demo.html 中于 demo-runtime.js 之前加载 ./ui/runtime-theme.antdv.js。'
      );
    }
    const APP_THEME = {
      token: { ...F.DS_ANTD_THEME_TOKEN },
      components: { ...F.DS_ANTD_THEME_COMPONENTS },
    };
    /** ECharts / canvas：与 runtime-theme.antdv.js 中 DS_ECHARTS_TEXT_STYLE 同源 */
    window.__DEMO_ECHARTS_TEXT_STYLE = F.DS_ECHARTS_TEXT_STYLE;
    const NAV_ITEMS = Object.freeze([
      { id: VIEW_IDS.PROJECT, label: '工作台' },
      { id: VIEW_IDS.TEMPLATE, label: '技能库' },
      { id: VIEW_IDS.SETTINGS, label: '系统管理' },
    ]);
    const HASH_TO_VIEW = Object.freeze({
      project: VIEW_IDS.PROJECT,
      template: VIEW_IDS.TEMPLATE,
      settings: VIEW_IDS.SETTINGS,
      freeaudit: VIEW_IDS.FREE_AUDIT,
      'freeaudit-v2': VIEW_IDS.FREE_AUDIT,
    });
    const VIEW_TO_HASH = Object.freeze({
      [VIEW_IDS.PROJECT]: 'project',
      [VIEW_IDS.TEMPLATE]: 'template',
      [VIEW_IDS.SETTINGS]: 'settings',
      [VIEW_IDS.FREE_AUDIT]: 'freeaudit',
      [VIEW_IDS.FREE_AUDIT_V2]: 'freeaudit-v2',
    });
    const VIEW_COMPONENT_MAP = Object.freeze({
      [VIEW_IDS.PROJECT]: 'ProjectCenterView',
      [VIEW_IDS.TEMPLATE]: 'TemplateCenterView',
      [VIEW_IDS.SETTINGS]: 'SettingsView',
      [VIEW_IDS.FREE_AUDIT]: 'FreeAuditWorkbenchV2',
      [VIEW_IDS.FREE_AUDIT_V2]: 'FreeAuditWorkbenchV2',
    });
    const MOCK_AUDIT_TEMPLATES = Object.freeze([
      { id: 't1', name: '城建项目-标准技能', description: '适用于城市基础设施建设类审计' },
      { id: 't2', name: '财务审计-通用技能', description: '适用于财务收支、专项资金等审计场景' },
    ]);
    /** 工作台权限「指定用户可见」候选（创建工作台 / 编辑工作台共用） */
    const PROJECT_SHARE_USER_OPTIONS = Object.freeze([
      { value: 'u-1', label: '李审计' },
      { value: 'u-2', label: '王审计' },
      { value: 'u-3', label: '赵管理员' },
      { value: 'u-4', label: '财务对接-刘' },
    ]);
    /** 工作台权限「指定用户可见」左侧部门树（`SpaceSharePicker`） */
    const PROJECT_SHARE_DEPT_TREE_DATA = Object.freeze([
      {
        title: '审计厅',
        key: 'd-root',
        children: [
          {
            title: '经济责任审计处',
            key: 'd-eco',
            children: [
              { title: '一科', key: 'd-eco-1' },
              { title: '二科', key: 'd-eco-2' },
            ],
          },
          { title: '固定资产投资审计处', key: 'd-inv' },
        ],
      },
    ]);
    /** 科室直属用户演示数据，用户 id 与 PROJECT_SHARE_USER_OPTIONS 对齐 */
    const PROJECT_SHARE_USERS_BY_DEPT_KEY = Object.freeze({
      'd-eco-1': [
        { id: 'u-1', label: '李审计' },
        { id: 'u-2', label: '王审计' },
      ],
      'd-eco-2': [{ id: 'u-4', label: '财务对接-刘' }],
      'd-inv': [{ id: 'u-3', label: '赵管理员' }],
    });
    const STATUS_TONE_CLASS_MAP = Object.freeze({
      '分析中': 'is-success',
      '数据准备': 'is-warning',
    });
    const getHashView = () => {
      const raw = (window.location.hash || '#project').slice(1) || 'project';
      const hash = raw.split('?')[0] || 'project';
      const base = hash.split('/')[0];
      if (base === 'dashboard' || base === 'quick-start-v2') return VIEW_IDS.PROJECT;
      return HASH_TO_VIEW[base] || VIEW_IDS.PROJECT;
    };
    const getProjectIdFromHash = () => {
      const raw = (window.location.hash || '').slice(1) || '';
      const hash = raw.split('?')[0];
      if (hash.startsWith('project/')) return hash.slice('project/'.length) || null;
      const q = raw.includes('?') ? new URLSearchParams(raw.split('?')[1]) : new URLSearchParams();
      return q.get('id') || null;
    };
    /** 技能配置「审计思路」编辑器占位：完整示例（约 400 字、含换行与标题），与审计资料字段衔接 */
    const DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER_TEXT =
      '【以下为演示用完整示例｜可整段删除后自行撰写】\n\n' +
      '一、审计目标与资料衔接\n' +
      '本思路用于函证闭环。请在各审计资料条目中写清资料类型如何识别，并列出需抽取或核对的关键字段（示例：对方名称、含税金额、函证编号、发函日、计划回函日、实际回函日、差异说明、替代程序）。后续分析一律以上述字段为比对主键，与资料侧提示词口径一致；若资料条目更新字段，本思路应同步修订。\n\n' +
      '二、比对与执行规则（简述）\n' +
      '（1）优先以函证编号关联发函与回函；无编号时以「对方+金额+期间」弱主键。（2）跨期金额按发生期间分段核对；关联方与超阈值付款优先全量核对。（3）抽样：先锁定全部超期未回与回函差异，再对其余按风险分层抽样，并保留抽样轨迹备查。\n\n' +
      '三、关注判定与分级\n' +
      '超计划回函日仍未回函，且未见可接受替代程序记录的，列为「重点关注」；已回函但金额或日期差异未闭合的，列为「一般关注」；其余为「正常」。同一对方存在多笔函证时，按最不利情形合并判定。\n\n' +
      '四、输出物要求\n' +
      '输出函证结果汇总（对方、金额、期间、差异类型）、差异原因与证据索引（指向资料条目）、待办清单（待补资料/待执行程序/建议时限），便于复核与对外沟通。\n\n' +
      '【示例结束】';
    window.__DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER = DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER_TEXT;
    /**
     * 供各视图 method 调用：避免仅用 computed 读 window 时在 Vue3 下被缓存为空占位。
     * 闭包固定引用 DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER_TEXT。
     */
    window.__demoGetSkillAnalysisRulePlaceholder = function () {
      return DEMO_SKILL_ANALYSIS_RULE_PLACEHOLDER_TEXT;
    };

    /** 技能配置「审计资料 · 资料类型」输入框占位 */
    window.__DEMO_SKILL_OBJECT_MATERIAL_TYPE_PLACEHOLDER = '请填写资料名称或类型';

    /** 智能润色演示：单行名称类输入写回文案 */
    window.__DEMO_AI_POLISH_SAMPLE_SHORT = '合同与结算类资料智能识别（润色示例）';
    /** 智能润色演示：多行说明/规则类输入写回文案 */
    window.__DEMO_AI_POLISH_SAMPLE_LONG =
      '经润色后的示例表述（演示）：\n' +
      '本分析对象用于从工作台资料中系统性识别并抽取关键信息。资料范围建议覆盖合同正本及补充协议、对账单、发票及银行流水等；在字段层面，需核对含税金额、业务发生日期、交易对手名称、单据编号及费用科目等，口径与原件保持一致，便于后续交叉比对、趋势观察与审计结论输出。';
    /**
     * 按字段 key 返回演示用润色结果（名称类用短文案，其余用长文案）。
     * @param {string} key
     */
    window.__demoPolishSampleForKey = function (key) {
      if (key === 'summary:name') return window.__DEMO_AI_POLISH_SAMPLE_SHORT;
      return window.__DEMO_AI_POLISH_SAMPLE_LONG;
    };
