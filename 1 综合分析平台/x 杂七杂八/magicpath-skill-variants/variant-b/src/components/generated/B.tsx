import { Icon } from "./Icon";
import type { SkillCard } from "./skillData";
import { PageHeader, ScopeTabs, SearchBar, SortDropdown, useSkillPage, VariantNote } from "./shared";
function AccentSkillCard({
  skill,
  showMeta,
  ctaLabel
}: {
  skill: SkillCard;
  showMeta: boolean;
  ctaLabel: string;
}) {
  return <article className="skill-card-b">
      <div className="skill-card-b__icon" aria-hidden="true">
        <Icon name="book-open" />
      </div>
      <div className="skill-card-b__main">
        <div className="skill-card-b__head">
          <div className="skill-card-b__title-block">
            <h2 className="skill-card-b__name">{skill.name}</h2>
            <p className="skill-card-b__desc">{skill.description}</p>
          </div>
          <button type="button" className="skill-card-b__more" aria-label="更多技能操作">
            <Icon name="more" />
          </button>
        </div>
        <div className="skill-card-b__tags">
          {skill.tags.slice(0, 3).map(tag => <span key={tag} className="skill-card-b__tag">
              {tag}
            </span>)}
        </div>
        {showMeta ? <div className="skill-card-b__meta">
            <span>
              <Icon name="user" />
              {skill.creator}
            </span>
            <span>
              <Icon name="download" />
              {skill.installCount} 次
            </span>
          </div> : null}
        <div className="skill-card-b__footer">
          <span className="skill-card-b__hint">点击卡片查看详情</span>
          <button type="button" className="skill-card-b__cta">
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>;
}
export const B = () => {
  const page = useSkillPage("market");
  return <section className="workbench-v2-skill-page skill-variant-b" aria-label="工作台技能">
      <VariantNote title="变体 B · 卡片样式改变" desc="强调技能图标、标签和底部操作区，让卡片更像可管理的技能资产。" />
      
      <PageHeader />
      <SearchBar value={page.query} onChange={page.setQuery} />
      <nav className="workbench-v2-skill-tabs" aria-label="技能分类">
        <ScopeTabs activeTab={page.activeTab} tabCounts={page.tabCounts} onChange={page.changeTab} />
        <div className="workbench-v2-skill-tabs__tools">
          <SortDropdown sortKey={page.sortKey} sortInstallVisible={page.sortInstallVisible} onChange={page.setSortKey} />
          
        </div>
      </nav>
      <section className="workbench-v2-skill-section" aria-label="技能列表">
        {page.cards.length === 0 ? <p className="workbench-v2-skill-empty">{page.emptyText}</p> : <div className="skill-card-b-grid">
            {page.cards.map(skill => <AccentSkillCard key={skill.key} skill={skill} showMeta={page.activeTab !== "workbench"} ctaLabel={page.ctaLabel} />)}
          </div>}
      </section>
    </section>;
};
