import { TYPE_FILTER_OPTIONS } from "./skillData";
import { Icon } from "./Icon";
import type { SkillCard } from "./skillData";
import { PageHeader, SearchBar, useSkillPage, VariantNote } from "./shared";
function BestSkillCard({
  skill,
  showMeta,
  ctaLabel
}: {
  skill: SkillCard;
  showMeta: boolean;
  ctaLabel: string;
}) {
  return <article className="skill-card-c">
      <div className="skill-card-c__marker" aria-hidden="true">
        <Icon name="book-open" />
      </div>
      <div className="skill-card-c__body">
        <div className="skill-card-c__title-row">
          <h2 className="skill-card-c__name">{skill.name}</h2>
          <span className="skill-card-c__type">{skill.tags[0]}</span>
        </div>
        <p className="skill-card-c__desc">{skill.description}</p>
        {showMeta ? <div className="skill-card-c__meta">
            <span>{skill.creator}</span>
            <span aria-hidden="true">·</span>
            <span>{skill.installCount} 次安装</span>
          </div> : null}
      </div>
      <div className="skill-card-c__actions">
        <button type="button" className="skill-card-c__more" aria-label="更多技能操作">
          <Icon name="more" />
        </button>
        <button type="button" className="skill-card-c__cta">
          {ctaLabel}
        </button>
      </div>
    </article>;
}
export const C = () => {
  const page = useSkillPage("market");
  return <section className="workbench-v2-skill-page skill-variant-c" aria-label="工作台技能">
      <VariantNote title="变体 C · 最佳实践" desc="将筛选、统计、排序和列表操作组合成一个检索工作流，适合技能数量增长后的管理场景。" />
      
      <PageHeader />
      <div className="skill-toolbar-c">
        <SearchBar value={page.query} onChange={page.setQuery} />
        <div className="skill-toolbar-c__row">
          <div className="skill-segment-c" role="tablist" aria-label="技能分类">
            {page.tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={page.activeTab === tab.id} className={`skill-segment-c__item${page.activeTab === tab.id ? " is-active" : ""}`} onClick={() => page.changeTab(tab.id)}>
              
                {tab.label}
                <span>{page.tabCounts[tab.id]}</span>
              </button>)}
          </div>
          <label className="skill-sort-select">
            <span>排序</span>
            <select value={page.sortKey} onChange={event => page.setSortKey(event.target.value)} aria-label="排序">
              
              <option value="time-desc">时间 · 最新优先</option>
              <option value="time-asc">时间 · 最早优先</option>
              {page.sortInstallVisible ? <>
                  <option value="install-desc">安装次数 · 从高到低</option>
                  <option value="install-asc">安装次数 · 从低到高</option>
                </> : null}
            </select>
          </label>
        </div>
      </div>
      <section className="workbench-v2-skill-section" aria-label="技能列表">
        <div className={`skill-practice-layout${page.filterVisible ? "" : " skill-practice-layout--single"}`}>
          {page.filterVisible ? <aside className="skill-filter-rail" aria-label="类型筛选">
              <div className="skill-filter-rail__title">类型</div>
              {TYPE_FILTER_OPTIONS.map(option => <button key={option.id} type="button" className={`skill-filter-rail__item${page.typeFilter === option.id ? " is-active" : ""}`} onClick={() => page.setTypeFilter(option.id)}>
                  <span>{option.label}</span>
                </button>)}
            </aside> : null}
          <div className="skill-practice-main">
            <div className="skill-result-bar">
              <span>
                共 <strong>{page.cards.length}</strong> 个技能
              </span>
              {page.query.trim() ? <span className="skill-result-bar__hint">已按关键词筛选</span> : <span className="skill-result-bar__hint">优先展示可安装技能</span>}
            </div>
            {page.cards.length === 0 ? <div className="skill-empty-c">
                <Icon name="search" />
                <p>{page.emptyText}</p>
              </div> : <div className="skill-card-c-list">
                {page.cards.map(skill => <BestSkillCard key={skill.key} skill={skill} showMeta={page.activeTab !== "workbench"} ctaLabel={page.ctaLabel} />)}
              </div>}
          </div>
        </div>
      </section>
    </section>;
};
