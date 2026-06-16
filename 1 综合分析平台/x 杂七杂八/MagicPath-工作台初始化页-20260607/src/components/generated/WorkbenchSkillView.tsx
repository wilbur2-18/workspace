import { Icon } from './Icon';
import { skills } from './data';
export function WorkbenchSkillView({
  onMenu,
  onModal
}: {
  onMenu: (label: string) => void;
  onModal: (label: string) => void;
}) {
  return <section className="wb-stage wb-skill-view" aria-label="工作台技能">
      <div className="wb-view-toolbar">
        <label className="wb-search-input"><Icon name="search" /><input placeholder="搜索技能名称或标签" /></label>
      </div>
      <div className="wb-skill-grid">
        {skills.map(card => <article key={card.id} className="wb-skill-card">
            <div className="wb-skill-top">
              <span><Icon name="book" /></span>
              <button type="button" className="wb-icon-btn" onClick={() => onModal('编辑技能')}><Icon name="file" /></button>
            </div>
            <h2>{card.name}</h2>
            <p>{card.desc}</p>
            <div className="wb-tags">{card.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <footer>
              <button type="button" onClick={() => onMenu('引用技能')}><Icon name="chat" />引用</button>
              <button type="button" onClick={() => onMenu('入库')}>入库</button>
              <button type="button" className="wb-icon-btn" onClick={() => onMenu('删除技能')}><Icon name="close" /></button>
            </footer>
          </article>)}
      </div>
    </section>;
}