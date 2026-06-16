import { TYPE_FILTER_OPTIONS } from "./skillData";
import { DefaultSkillCard, PageHeader, ScopeTabs, SearchBar, SortDropdown, useSkillPage, VariantNote } from "./shared";
export const A = () => {
  const page = useSkillPage("market");
  return <section className="workbench-v2-skill-page skill-variant-a" aria-label="工作台技能">
      <VariantNote title="变体 A · 类型筛选外放" desc="将类型筛选从下拉改为页签下方常驻 Chip，减少一次点击、提升可发现性。" />
      
      <PageHeader />
      <SearchBar value={page.query} onChange={page.setQuery} />
      <nav className="workbench-v2-skill-tabs" aria-label="技能分类">
        <ScopeTabs activeTab={page.activeTab} tabCounts={page.tabCounts} onChange={page.changeTab} />
        <div className="workbench-v2-skill-tabs__tools">
          <SortDropdown sortKey={page.sortKey} sortInstallVisible={page.sortInstallVisible} onChange={page.setSortKey} />
          
        </div>
      </nav>
      {page.filterVisible ? <div className="skill-type-row" aria-label="类型筛选">
          <div className="skill-type-row__head">
            <span className="skill-type-row__label">类型</span>
            <span className="skill-type-row__hint">外放常用筛选，当前结果 {page.cards.length} 个</span>
          </div>
          <div className="skill-type-row__chips">
            {TYPE_FILTER_OPTIONS.map(option => <button key={option.id} type="button" className={`skill-type-chip${page.typeFilter === option.id ? " is-active" : ""}`} onClick={() => page.setTypeFilter(option.id)}>
            
                {option.label}
              </button>)}
          </div>
        </div> : null}
      <section className="workbench-v2-skill-section" aria-label="技能列表">
        {page.cards.length === 0 ? <p className="workbench-v2-skill-empty">{page.emptyText}</p> : <div className="workbench-v2-skill-grid">
            {page.cards.map(skill => <DefaultSkillCard key={skill.key} skill={skill} showMeta={page.activeTab !== "workbench"} ctaLabel={page.ctaLabel} />)}
          </div>}
      </section>
    </section>;
};
