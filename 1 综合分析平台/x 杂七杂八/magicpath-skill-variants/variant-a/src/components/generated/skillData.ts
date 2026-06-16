export type SkillTab = "workbench" | "org" | "market";

export const TABS: {id: SkillTab;label: string;}[] = [
{ id: "workbench", label: "已安装" },
{ id: "org", label: "共享技能" },
{ id: "market", label: "技能市场" }];


export type SkillCard = {
  key: string;
  name: string;
  description: string;
  creator: string;
  installCount: number;
  updatedAt: string;
  tags: string[];
};

export const TYPE_FILTER_OPTIONS = [
{ id: "all", label: "全部" },
{ id: "compliance", label: "合规核查" },
{ id: "finance", label: "资金财务" },
{ id: "investment", label: "投资进度" }] as
const;

export type TypeFilterId = (typeof TYPE_FILTER_OPTIONS)[number]["id"];

const TYPE_FILTER_KEYWORDS: Record<string, string[]> = {
  compliance: ["合规", "核查", "审查", "一致性"],
  finance: ["资金", "财务", "付款", "预算", "发票", "拨付", "金额"],
  investment: ["投资", "进度", "偏差"]
};

const WORKBENCH_SKILL_CARDS: SkillCard[] = [
{
  key: "contract-invoice",
  name: "施工合同与发票一致性核查",
  description: "暂无摘要",
  creator: "我",
  installCount: 88,
  updatedAt: "2024-03-10 18:30",
  tags: ["城建", "金额", "合规"]
},
{
  key: "supplier-cross",
  name: "采购环节供应商交叉比对（试用）",
  description: "暂无摘要",
  creator: "我",
  installCount: 89,
  updatedAt: "2024-03-08 12:00",
  tags: ["采购", "合规"]
},
{
  key: "contract-change",
  name: "合同变更链路与金额追踪",
  description: "梳理合同补充协议、变更审批与最终结算金额，追踪变更是否合理。",
  creator: "我",
  installCount: 5,
  updatedAt: "2024-02-20 09:00",
  tags: ["合规", "金额"]
}];


const ORG_SKILL_CARDS: SkillCard[] = [
{
  key: "org-budget",
  name: "资金拨付与预算批复一致性检查",
  description: "系统对照预算批复、拨付台账与用途说明，定位超预算与用途偏离。",
  creator: "资金监管组",
  installCount: 37,
  updatedAt: "2024-03-01 10:00",
  tags: ["资金", "预算", "合规"]
},
{
  key: "org-payment",
  name: "工程款节点支付合规核对",
  description: "系统比对合同付款节点与实际付款时间金额，提示提前支付或超节点支付风险。",
  creator: "平台管理员",
  installCount: 54,
  updatedAt: "2024-03-08 12:00",
  tags: ["付款节点", "合规", "城建"]
},
{
  key: "org-progress",
  name: "投资完成进度偏差扫描",
  description: "系统对照计划与实际投资进度，自动标记偏离并提示是否需补充说明。",
  creator: "审计管理员",
  installCount: 86,
  updatedAt: "2024-02-08 14:00",
  tags: ["投资", "进度", "财务"]
}];


const MARKET_SKILL_CARDS: SkillCard[] = [
{
  key: "market-contract",
  name: "施工合同与发票一致性核查",
  description: "系统从合同与发票中自动抽取并对账，帮你快速发现金额与时间逻辑异常。",
  creator: "系统预置",
  installCount: 128,
  updatedAt: "2024-03-10 18:30",
  tags: ["城建", "金额", "合规"]
},
{
  key: "market-progress",
  name: "投资完成进度偏差扫描",
  description: "系统对照计划与实际投资进度，自动标记偏离并提示是否需补充说明。",
  creator: "审计管理员",
  installCount: 86,
  updatedAt: "2024-02-08 14:00",
  tags: ["投资", "进度", "财务"]
},
{
  key: "market-payment",
  name: "工程款节点支付合规核对",
  description: "系统比对合同付款节点与实际付款时间金额，提示提前支付或超节点支付风险。",
  creator: "平台管理员",
  installCount: 54,
  updatedAt: "2024-03-08 12:00",
  tags: ["付款节点", "合规", "城建"]
},
{
  key: "market-budget",
  name: "资金拨付与预算批复一致性检查",
  description: "系统对照预算批复、拨付台账与用途说明，定位超预算与用途偏离。",
  creator: "资金监管组",
  installCount: 37,
  updatedAt: "2024-03-01 10:00",
  tags: ["资金", "预算", "合规"]
}];


export function getSkillsForTab(tab: SkillTab): SkillCard[] {
  if (tab === "workbench") return WORKBENCH_SKILL_CARDS;
  if (tab === "org") return ORG_SKILL_CARDS;
  return MARKET_SKILL_CARDS;
}

export function getTabCounts(): Record<SkillTab, number> {
  return {
    workbench: WORKBENCH_SKILL_CARDS.length,
    org: ORG_SKILL_CARDS.length,
    market: MARKET_SKILL_CARDS.length
  };
}

export function getCtaLabel(tab: SkillTab): string {
  return tab === "workbench" ? "试用" : "安装";
}

export function getEmptyText(
tab: SkillTab,
hasQuery: boolean,
hasTypeFilter: boolean)
: string {
  if (hasQuery) return "未找到匹配的技能";
  if (hasTypeFilter) return "当前类型下暂无技能";
  if (tab === "workbench") return "暂无已安装技能";
  if (tab === "org") return "暂无共享技能";
  return "暂无技能市场内容";
}

function getTimestamp(card: SkillCard): number {
  const parsed = Date.parse(card.updatedAt.replace(" ", "T"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function matchTypeFilter(card: SkillCard, filterId: TypeFilterId): boolean {
  if (!filterId || filterId === "all") return true;
  const hay = [card.name, card.description, ...card.tags].join(" ");
  const keywords = TYPE_FILTER_KEYWORDS[filterId] || [filterId];
  return keywords.some((keyword) => hay.includes(keyword));
}

export function sortSkills(
cards: SkillCard[],
sortBy: "time" | "install",
sortOrder: "asc" | "desc")
: SkillCard[] {
  const dir = sortOrder === "asc" ? 1 : -1;
  return cards.slice().sort((a, b) => {
    const left = sortBy === "install" ? a.installCount : getTimestamp(a);
    const right = sortBy === "install" ? b.installCount : getTimestamp(b);
    if (left === right) {
      return a.name.localeCompare(b.name, "zh-CN") * dir;
    }
    return (left - right) * dir;
  });
}

export const SORT_OPTIONS = [
{ id: "time-desc", label: "时间 · 最新优先", sortBy: "time" as const, sortOrder: "desc" as const },
{ id: "time-asc", label: "时间 · 最早优先", sortBy: "time" as const, sortOrder: "asc" as const },
{
  id: "install-desc",
  label: "安装次数 · 从高到低",
  sortBy: "install" as const,
  sortOrder: "desc" as const,
  installOnly: true
},
{
  id: "install-asc",
  label: "安装次数 · 从低到高",
  sortBy: "install" as const,
  sortOrder: "asc" as const,
  installOnly: true
}];