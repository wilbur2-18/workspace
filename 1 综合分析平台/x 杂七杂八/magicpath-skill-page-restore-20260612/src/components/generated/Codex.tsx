import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import {
  CATEGORY_TABS,
  SCENE_OPTIONS,
  SCOPE_TABS,
  SORT_OPTIONS,
  getCtaLabel,
  getEmptyText,
  getSkills,
  sortSkills,
  type AuditScene,
  type SkillCategory,
  type SkillScope,
} from "./skillData";

type DropdownProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
};

function DropdownMenu({ open, onToggle, onClose, trigger, children }: DropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="skill-page-dropdown">
      <div onClick={onToggle}>{trigger}</div>
      {open ? (
        <div className="skill-page-dropdown__menu" role="menu">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Sidebar() {
  const conversations = [
    ["初始化引导样例", "6 小时"],
    ["请帮我删除结果树里「预算测算草稿」", "7 小时"],
    ["梳理合同付款节点与发票开具的差异", "8 小时"],
    ["总结当前工作台中的主要疑点", ""],
  ];
  const tasks = [
    ["往来函证抽样核对", "running"],
    ["企业工商信息批量查询", "running"],
    ["采购异常专项扫描", "failed"],
    ["审计结果打包下载", "4 小时"],
    ["预算与对标分析", "2 天"],
    ["付款与验收追踪", "3 天"],
    ["合同与发票专项核对", "4 天"],
  ];

  return (
    <aside className="workbench-sidebar" aria-label="工作台侧边栏">
      <div className="workbench-sidebar__brand">
        <span className="workbench-sidebar__logo"><Icon name="workbench" /></span>
        <span>
          <strong>浙江审计综合分析</strong>
          <small>Audit Analytics</small>
        </span>
        <button type="button" className="workbench-sidebar__collapse" title="收起侧边栏">
          <Icon name="left-bar" />
        </button>
      </div>

      <nav className="workbench-sidebar__actions" aria-label="主导航">
        <button type="button"><Icon name="edit-two" />新建对话</button>
        <button type="button"><Icon name="task" />新建任务</button>
        <button type="button"><Icon name="search" />搜索</button>
        <button type="button" className="is-active"><Icon name="book-open" />技能</button>
      </nav>

      <div className="workbench-sidebar__project">
        <span>当前工作台</span>
        <strong>A市城建集团年度经济责任审计</strong>
      </div>

      <section className="workbench-sidebar__group">
        <div className="workbench-sidebar__group-head">
          <span>对话</span>
          <Icon name="chevron-down" />
        </div>
        {conversations.map(([title, time], index) => (
          <button key={title} type="button" className={`workbench-sidebar__row${index === 3 ? " is-selected" : ""}`}>
            <Icon name="message" />
            <span>{title}</span>
            {time ? <em>{time}</em> : <Icon name="more" />}
          </button>
        ))}
      </section>

      <section className="workbench-sidebar__group">
        <div className="workbench-sidebar__group-head">
          <span>任务</span>
          <Icon name="chevron-down" />
        </div>
        {tasks.map(([title, status]) => (
          <button key={title} type="button" className="workbench-sidebar__row">
            <Icon name={status === "running" ? "tips" : status === "failed" ? "fail" : "edit-one"} />
            <span>{title}</span>
            {status === "running" ? <i className="workbench-sidebar__spin" /> : <em>{status}</em>}
          </button>
        ))}
      </section>

      <button type="button" className="workbench-sidebar__settings">
        <Icon name="edit" />
        设置
      </button>
    </aside>
  );
}

export const Codex = () => {
  const [scope, setScope] = useState<SkillScope>("workbench");
  const [category, setCategory] = useState<SkillCategory>("all");
  const [scene, setScene] = useState<AuditScene>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("time-desc");
  const [sceneOpen, setSceneOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [cardMenuOpen, setCardMenuOpen] = useState<string | null>(null);

  const sort = SORT_OPTIONS.find((item) => item.id === sortKey) || SORT_OPTIONS[0];
  const sceneLabel = SCENE_OPTIONS.find((item) => item.id === scene)?.label || "全部";
  const visibleSceneFilter = scope === "org" || scope === "market";

  const cards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let rows = getSkills(scope);
    if (normalizedQuery) {
      rows = rows.filter((card) => {
        const haystack = `${card.name} ${card.description} ${card.creator}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
    if (category !== "all") rows = rows.filter((card) => card.category === category);
    if (visibleSceneFilter && scene !== "all") rows = rows.filter((card) => card.scene === scene);
    return sortSkills(rows, sort.sortBy, sort.sortOrder);
  }, [scope, query, category, scene, visibleSceneFilter, sort.sortBy, sort.sortOrder]);

  const changeScope = (next: SkillScope) => {
    setScope(next);
    setCategory("all");
    setScene("all");
    if (next === "workbench" && sort.sortBy === "install") setSortKey("time-desc");
  };

  return (
    <div className="audit-workbench-frame">
      <Sidebar />
      <main className="workbench-main-card">
        <section className="workbench-v2-skill-page" aria-label="工作台技能">
          <header className="workbench-v2-skill-header">
            <div className="workbench-v2-skill-header__main">
              <h1 className="workbench-v2-skill-header__title">技能</h1>
              <p className="workbench-v2-skill-header__subtitle">通过技能为大模型注入审计思路</p>
            </div>
            <div className="workbench-v2-skill-header__actions">
              <button type="button" className="ds-btn-page-cta workbench-v2-skill-header__action" title="创建技能" aria-label="创建技能">
                <Icon name="plus" className="ds-btn-icon-before" />
                <span>创建技能</span>
              </button>
            </div>
          </header>

          <div className="workbench-v2-skill-tabs" aria-label="技能分类">
            <div className="workbench-v2-skill-scope-tabs" role="tablist">
              {SCOPE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`workbench-v2-skill-scope-tab${scope === tab.id ? " is-active" : ""}`}
                  onClick={() => changeScope(tab.id)}
                  role="tab"
                  aria-selected={scope === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="workbench-v2-skill-search-row">
            <label className="workbench-v2-skill-search">
              <Icon name="search" className="workbench-v2-skill-search__icon" />
              <input
                type="search"
                className="workbench-v2-skill-search__input"
                placeholder="搜索技能名称、描述"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="搜索技能名称、描述"
              />
            </label>
            <div className="workbench-v2-skill-search-row__actions">
              {visibleSceneFilter ? (
                <DropdownMenu
                  open={sceneOpen}
                  onToggle={() => setSceneOpen((value) => !value)}
                  onClose={() => setSceneOpen(false)}
                  trigger={
                    <button
                      type="button"
                      className={`workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label${scene !== "all" ? " is-active" : ""}`}
                      title="按审计场景过滤"
                      aria-label="按审计场景过滤"
                    >
                      <span className="workbench-v2-skill-filter-control__label">审计场景</span>
                      <span className="workbench-v2-skill-filter-control__value">{sceneLabel}</span>
                      <Icon name="chevron-down" className="workbench-v2-skill-filter-control__arrow" />
                    </button>
                  }
                >
                  {SCENE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="menuitem"
                      className={`skill-page-dropdown__item${scene === option.id ? " is-selected" : ""}`}
                      onClick={() => {
                        setScene(option.id);
                        setSceneOpen(false);
                      }}
                    >
                      {scene === option.id ? <Icon name="check" /> : <span />}
                      {option.label}
                    </button>
                  ))}
                </DropdownMenu>
              ) : null}
              <DropdownMenu
                open={sortOpen}
                onToggle={() => setSortOpen((value) => !value)}
                onClose={() => setSortOpen(false)}
                trigger={
                  <button
                    type="button"
                    className={`workbench-v2-skill-tabs__tool workbench-v2-skill-tabs__tool--label${sortKey !== "time-desc" ? " is-active" : ""}`}
                    title="排序"
                    aria-label="排序"
                  >
                    <span className="workbench-v2-skill-filter-control__label">排序</span>
                    <span className="workbench-v2-skill-filter-control__value">{sort.label}</span>
                    <Icon name="chevron-down" className="workbench-v2-skill-filter-control__arrow" />
                  </button>
                }
              >
                {SORT_OPTIONS.filter((option) => !option.installOnly || scope !== "workbench").map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitem"
                    className={`skill-page-dropdown__item${sortKey === option.id ? " is-selected" : ""}`}
                    onClick={() => {
                      setSortKey(option.id);
                      setSortOpen(false);
                    }}
                  >
                    {sortKey === option.id ? <Icon name="check" /> : <span />}
                    {option.label}
                  </button>
                ))}
              </DropdownMenu>
            </div>
          </div>

          <nav className="workbench-v2-skill-type-tabs" aria-label="技能类型">
            <div className="workbench-v2-skill-tabs__list">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`workbench-v2-skill-tab${category === tab.id ? " is-active" : ""}`}
                  onClick={() => setCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <section className="workbench-v2-skill-section" aria-label="技能列表">
            {cards.length ? (
              <div className="workbench-v2-skill-grid">
                {cards.map((card) => (
                  <article
                    key={card.key}
                    className="workbench-v2-skill-item is-workbench"
                    role="button"
                    tabIndex={0}
                    onClick={() => setCardMenuOpen(null)}
                  >
                    <div className="workbench-v2-skill-item__body">
                      <h2 className="workbench-v2-skill-item__name">{card.name}</h2>
                      <p className="workbench-v2-skill-item__desc">{card.description}</p>
                      {scope !== "workbench" ? (
                        <div className="workbench-v2-skill-item__meta" aria-label="技能信息">
                          <span className="workbench-v2-skill-item__meta-item"><Icon name="user" />{card.creator}</span>
                          <span className="workbench-v2-skill-item__meta-item"><Icon name="download" />{card.installCount} 次</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="workbench-v2-skill-item__actions" onClick={(event) => event.stopPropagation()}>
                      {scope === "workbench" ? (
                        <DropdownMenu
                          open={cardMenuOpen === card.key}
                          onToggle={() => setCardMenuOpen((value) => (value === card.key ? null : card.key))}
                          onClose={() => setCardMenuOpen(null)}
                          trigger={<button type="button" className="workbench-v2-skill-item__more" title="管理" aria-label="管理">管理</button>}
                        >
                          <button type="button" className="skill-page-dropdown__item"><span /><span>编辑</span></button>
                          <button type="button" className="skill-page-dropdown__item"><span /><span>共享</span></button>
                          <button type="button" className="skill-page-dropdown__item is-danger"><span /><span>删除</span></button>
                        </DropdownMenu>
                      ) : null}
                      <button type="button" className={`workbench-v2-skill-item__cta${scope === "workbench" ? " is-use" : ""}`}>{getCtaLabel(scope)}</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="workbench-v2-skill-empty">{getEmptyText(scope, !!query.trim(), visibleSceneFilter && scene !== "all")}</div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
};
