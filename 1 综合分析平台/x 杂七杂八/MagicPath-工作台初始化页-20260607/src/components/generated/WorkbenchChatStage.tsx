import { Icon } from './Icon';
import { chatSteps, diffRows } from './data';
export function WorkbenchChatStage({
  onOpenDoc,
  onMenu
}: {
  onOpenDoc: () => void;
  onMenu: (label: string) => void;
}) {
  return <section className="wb-stage wb-chat-stage" aria-label="新版工作台对话区">
      <div className="wb-chat-scroll">
        <p className="wb-user-prompt">针对「总结当前工作台中的主要疑点」，先对齐本次要用的资料范围与期望产出（疑点描述、证据指向、后续核查建议）。</p>
        <div className="wb-thinking">
          {chatSteps.map((step, index) => <div key={`${step.kind}-${index}`} className={`wb-step is-${step.kind}`}>
              <Icon name={step.kind === 'error' ? 'warn' : step.kind === 'thought' ? 'chevron' : 'check'} />
              <span>{step.text}</span>
              {(step.kind === 'query' || step.kind === 'read') && <Icon name="chevron" />}
            </div>)}
        </div>
        <article className="wb-result-card">
          <header>
            <span><Icon name="check" />审计备忘录-疑点摘录.md</span>
            <div><b>+2</b><b className="is-minus">-1</b></div>
          </header>
          {diffRows.map(row => <p key={row.no} className={row.kind === '+' ? 'is-add' : 'is-remove'}>
              <span>{row.no}</span>
              <strong>{row.kind}</strong>
              {row.text}
            </p>)}
          <footer>（上下文）第四条 付款方式按进度支付，尾款 50%。</footer>
        </article>
      </div>
      <form className="wb-composer" onSubmit={event => event.preventDefault()}>
        <textarea placeholder="输入问题； @ 引用资料或结果， / 选择技能； Enter 发送" />
        <div className="wb-composer-row">
          <button type="button" aria-label="上传文件" onClick={() => onMenu('上传文件')}><Icon name="paperclip" /></button>
          <button type="button" aria-label="打开资料工作区" onClick={onOpenDoc}><Icon name="folder" /></button>
          <button type="submit" className="is-send" aria-label="发送"><Icon name="send" /></button>
        </div>
      </form>
      <p className="wb-disclaimer">系统生成内容需人工核查，审计结论以人工确认为准。</p>
    </section>;
}