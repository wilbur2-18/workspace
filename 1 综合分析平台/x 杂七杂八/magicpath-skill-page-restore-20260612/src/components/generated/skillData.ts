export type SkillScope = "workbench" | "org" | "market";
export type SkillCategory = "all" | "extract" | "analysis" | "risk" | "report" | "other";
export type AuditScene = "all" | "construction" | "finance" | "procurement";

export type SkillCard = {
  key: string;
  name: string;
  description: string;
  creator: string;
  installCount: number;
  updatedAt: string;
  category: SkillCategory;
  scene: AuditScene;
};

export const SCOPE_TABS: { id: SkillScope; label: string }[] = [
  { id: "workbench", label: "已安装" },
  { id: "org", label: "共享技能" },
  { id: "market", label: "技能市场" },
];

export const CATEGORY_TABS: { id: SkillCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "extract", label: "信息抽取" },
  { id: "analysis", label: "数据分析" },
  { id: "risk", label: "疑点挖掘" },
  { id: "report", label: "报告生成" },
  { id: "other", label: "其他" },
];

export const SCENE_OPTIONS: { id: AuditScene; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "construction", label: "工程建设审计" },
  { id: "finance", label: "资金财务审计" },
  { id: "procurement", label: "采购审计" },
];

export const SORT_OPTIONS = [
  { id: "time-desc", label: "最新优先", sortBy: "time" as const, sortOrder: "desc" as const },
  { id: "time-asc", label: "最早优先", sortBy: "time" as const, sortOrder: "asc" as const },
  { id: "install-desc", label: "安装次数高", sortBy: "install" as const, sortOrder: "desc" as const, installOnly: true },
  { id: "install-asc", label: "安装次数低", sortBy: "install" as const, sortOrder: "asc" as const, installOnly: true },
];

const WORKBENCH_SKILLS: SkillCard[] = [
  {
    key: "contract-invoice",
    name: "施工合同与发票一致性核查",
    description: "暂无摘要",
    creator: "我",
    installCount: 128,
    updatedAt: "2026-06-11 15:29",
    category: "analysis",
    scene: "construction",
  },
  {
    key: "contract-change",
    name: "合同变更链路与金额追踪（演示失败）",
    description: "暂无摘要",
    creator: "我",
    installCount: 64,
    updatedAt: "2026-06-10 09:00",
    category: "analysis",
    scene: "construction",
  },
  {
    key: "supplier-cross",
    name: "采购环节供应商交叉比对（试用）",
    description: "暂无摘要",
    creator: "我",
    installCount: 89,
    updatedAt: "2026-06-09 18:00",
    category: "analysis",
    scene: "procurement",
  },
];

const ORG_SKILLS: SkillCard[] = [
  {
    key: "org-budget",
    name: "资金拨付与预算批复一致性检查",
    description: "系统对照预算批复、拨付台账与用途说明，定位超预算与用途偏离。",
    creator: "资金监管组",
    installCount: 37,
    updatedAt: "2026-06-08 10:00",
    category: "analysis",
    scene: "finance",
  },
  {
    key: "org-payment",
    name: "工程款节点支付合规核对",
    description: "系统比对合同付款节点与实际付款时间金额，提示提前支付或超节点支付风险。",
    creator: "平台管理员",
    installCount: 54,
    updatedAt: "2026-06-07 12:00",
    category: "risk",
    scene: "construction",
  },
  {
    key: "org-progress",
    name: "投资完成进度偏差扫描",
    description: "系统对照计划与实际投资进度，自动标记偏离并提示是否需补充说明。",
    creator: "审计管理员",
    installCount: 86,
    updatedAt: "2026-06-06 14:00",
    category: "risk",
    scene: "finance",
  },
];

const MARKET_SKILLS: SkillCard[] = [
  ...WORKBENCH_SKILLS,
  ...ORG_SKILLS,
  {
    key: "market-report",
    name: "审计备忘录自动归纳",
    description: "按疑点、证据、风险等级生成结构化中间结果，辅助审计结论沉淀。",
    creator: "系统预置",
    installCount: 45,
    updatedAt: "2026-06-05 11:30",
    category: "report",
    scene: "finance",
  },
];

export function getSkills(scope: SkillScope): SkillCard[] {
  if (scope === "workbench") return WORKBENCH_SKILLS;
  if (scope === "org") return ORG_SKILLS;
  return MARKET_SKILLS;
}

export function getCtaLabel(scope: SkillScope): string {
  return scope === "workbench" ? "使用" : "安装";
}

export function getEmptyText(scope: SkillScope, hasQuery: boolean, hasSceneFilter: boolean): string {
  if (hasQuery) return "未找到匹配的技能";
  if (hasSceneFilter) return "当前审计场景下暂无技能";
  if (scope === "workbench") return "暂无已安装技能";
  if (scope === "org") return "暂无共享技能";
  return "暂无技能市场内容";
}

export function sortSkills(cards: SkillCard[], sortBy: "time" | "install", sortOrder: "asc" | "desc"): SkillCard[] {
  const direction = sortOrder === "asc" ? 1 : -1;
  return cards.slice().sort((left, right) => {
    const leftValue = sortBy === "install" ? left.installCount : Date.parse(left.updatedAt.replace(" ", "T"));
    const rightValue = sortBy === "install" ? right.installCount : Date.parse(right.updatedAt.replace(" ", "T"));
    if (leftValue === rightValue) return left.name.localeCompare(right.name, "zh-CN") * direction;
    return (leftValue - rightValue) * direction;
  });
}
