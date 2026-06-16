import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { SORT_OPTIONS, TABS, getCtaLabel, getEmptyText, getSkillsForTab, getTabCounts, matchTypeFilter, sortSkills, type SkillCard, type SkillTab, type TypeFilterId } from "./skillData";
export function useSkillPage(defaultTab: SkillTab = "org") {
  const [activeTab, setActiveTab] = useState<SkillTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilterId>("all");
  const [sortKey, setSortKey] = useState("time-desc");
  const filterVisible = activeTab === "org" || activeTab === "market";
  const sortInstallVisible = filterVisible;
  const activeSort = SORT_OPTIONS.find(item => item.id === sortKey) || SORT_OPTIONS[0];
  const tabCounts = getTabCounts();
  const ctaLabel = getCtaLabel(activeTab);
  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = getSkillsForTab(activeTab);
    if (q) {
      rows = rows.filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.creator.toLowerCase().includes(q));
    }
    if (filterVisible) {
      rows = rows.filter(card => matchTypeFilter(card, typeFilter));
    }
    return sortSkills(rows, activeSort.sortBy, activeSort.sortOrder);
  }, [query, activeTab, typeFilter, filterVisible, activeSort.sortBy, activeSort.sortOrder]);
  const emptyText = getEmptyText(activeTab, !!query.trim(), filterVisible && typeFilter !== "all");
  const changeTab = (tab: SkillTab) => {
    setActiveTab(tab);
    setTypeFilter("all");
    if (tab === "workbench" && activeSort.sortBy === "install") {
      setSortKey("time-desc");
    }
  };
  return {
    activeTab,
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    sortKey,
    setSortKey,
    filterVisible,
    sortInstallVisible,
    tabCounts,
    ctaLabel,
    cards,
    emptyText,
    changeTab,
    tabs: TABS
  };
}
export function VariantNote({
  title,
  desc
}: {
  title: string;
  desc: string;
}) {
  return <div className="skill-variant-note">
      <strong>{title}</strong>
      <span>{desc}</span>
    </div>;
}
export function PageHeader() {
  return <header className="workbench-v2-skill-header">
      <div className="workbench-v2-skill-header__main">
        <h1 className="workbench-v2-skill-header__title">技能</h1>
        <p className="workbench-v2-skill-header__subtitle">通过技能为大模型注入审计思路</p>
      </div>
      <div className="workbench-v2-skill-header__actions">
        <button type="button" className="workbench-v2-skill-header__action" aria-label="创建技能">
          <Icon name="plus" className="workbench-v2-skill-header__action-icon" />
          <span>创建技能</span>
        </button>
      </div>
    </header>;
}
export function SearchBar({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return <div className="workbench-v2-skill-search-row">
      <label className="workbench-v2-skill-search">
        <Icon name="search" className="workbench-v2-skill-search__icon" />
        <input type="search" className="workbench-v2-skill-search__input" placeholder="搜索技能" value={value} onChange={event => onChange(event.target.value)} aria-label="搜索技能" />
        
      </label>
    </div>;
}
export function ScopeTabs({
  activeTab,
  tabCounts,
  onChange
}: {
  activeTab: SkillTab;
  tabCounts: Record<SkillTab, number>;
  onChange: (tab: SkillTab) => void;
}) {
  return <div className="workbench-v2-skill-tabs__list">
      {TABS.map(tab => <button key={tab.id} type="button" className={`workbench-v2-skill-tab${activeTab === tab.id ? " is-active" : ""}`} onClick={() => onChange(tab.id)}>
        
          <span>{tab.label}</span>
          <span className="workbench-v2-skill-tab__count">{tabCounts[tab.id]}</span>
        </button>)}
    </div>;
}
export function SortDropdown({
  sortKey,
  sortInstallVisible,
  onChange
}: {
  sortKey: string;
  sortInstallVisible: boolean;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sortActive = sortKey !== "time-desc";
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);
  return <div ref={rootRef} className="workbench-v2-skill-dropdown is-right">
      <button type="button" className={`workbench-v2-skill-tabs__tool${sortActive ? " is-active" : ""}`} aria-label="排序" onClick={() => setOpen(value => !value)}>
        
        <Icon name="sort" />
      </button>
      {open ? <div className="workbench-v2-skill-dropdown__menu" role="menu">
          {SORT_OPTIONS.filter(option => !option.installOnly || sortInstallVisible).map(option => <button key={option.id} type="button" role="menuitem" className={`workbench-v2-skill-dropdown__item${sortKey === option.id ? " is-selected" : ""}`} onClick={() => {
        onChange(option.id);
        setOpen(false);
      }}>
          
              <span className="workbench-v2-skill-menu-item">
                {sortKey === option.id ? <Icon name="check" /> : <span className="workbench-v2-skill-menu-item__spacer" />}
                <span>{option.label}</span>
              </span>
            </button>)}
        </div> : null}
    </div>;
}
export function SkillMeta({
  skill
}: {
  skill: SkillCard;
}) {
  return <div className="workbench-v2-skill-item__meta" aria-label="技能信息">
      <span className="workbench-v2-skill-item__meta-item">
        <Icon name="user" />
        <span>{skill.creator}</span>
      </span>
      <span className="workbench-v2-skill-item__meta-item">
        <Icon name="download" />
        <span>{skill.installCount} 次</span>
      </span>
    </div>;
}
export function DefaultSkillCard({
  skill,
  showMeta,
  ctaLabel
}: {
  skill: SkillCard;
  showMeta: boolean;
  ctaLabel: string;
}) {
  return <article className="workbench-v2-skill-item">
      <div className="workbench-v2-skill-item__body">
        <h2 className="workbench-v2-skill-item__name">{skill.name}</h2>
        <p className="workbench-v2-skill-item__desc">{skill.description}</p>
        {showMeta ? <SkillMeta skill={skill} /> : null}
      </div>
      <div className="workbench-v2-skill-item__actions">
        <button type="button" className="workbench-v2-skill-item__cta">
          {ctaLabel}
        </button>
      </div>
    </article>;
}
export type SkillPageState = ReturnType<typeof useSkillPage>;