import { Icon } from './Icon';
type ComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
};
export function Composer({
  draft,
  onDraftChange
}: ComposerProps) {
  return <form className="mp-composer" onSubmit={event => event.preventDefault()}>
      <label htmlFor="mp-composer-input">输入问题</label>
      <textarea id="mp-composer-input" value={draft} onChange={event => onDraftChange(event.target.value)} placeholder="输入问题； @ 引用资料或结果， / 选择技能； Enter 发送" />
      
      <div className="mp-composer-row">
        <button type="button" className="mp-attach" aria-label="上传文件">
          <Icon name="paperclip" />
        </button>
        <button type="submit" className="mp-send" aria-label="发送">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 4 9 15" />
            <path d="m20 4-6 17-4-6-6-4z" />
          </svg>
        </button>
      </div>
    </form>;
}