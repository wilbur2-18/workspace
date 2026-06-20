(function () {
  const app = window.__DEMO_APP;
  const message = antd.message;

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj || {}, key);
  }

  app.component('SkillConfigEditor', {
    props: {
      skill: { type: Object, default: null },
      navKey: { type: String, default: 'rule' },
      expandedKeys: { type: Array, default: () => [] },
      locked: { type: Boolean, default: false },
      polishKey: { type: String, default: '' },
      polishUndo: { type: Object, default: () => ({}) },
      polishPrefix: { type: String, default: 'skill' },
      analysisPlaceholder: { type: String, default: '' },
      ruleTitle: { type: String, default: 'skill.md' },
      ruleHelp: { type: String, default: '' },
      showAdd: { type: Boolean, default: true },
    },
    emits: [
      'update:navKey',
      'update:expandedKeys',
      'change',
      'polish-rule',
      'undo-rule',
      'polish-file-field',
      'undo-file-field',
    ],
    computed: {
      treeData() {
        const T = window.DemoSkillFileTree;
        if (!this.skill || !T || typeof T.buildAntTreeData !== 'function') return [{ key: 'rule', title: 'skill.md', isLeaf: true }];
        return T.buildAntTreeData(this.skill.skillFiles || []);
      },
      selectedKeys() {
        const k = this.navKey;
        if (!k || k === 'rule') return ['rule'];
        return [String(k)];
      },
      treeExpandedKeys: {
        get() {
          return this.expandedKeys || [];
        },
        set(value) {
          this.$emit('update:expandedKeys', Array.isArray(value) ? value : []);
        },
      },
      selectedFile() {
        const k = this.navKey;
        if (!k || String(k).indexOf('file:') !== 0 || !this.skill) return null;
        const T = window.DemoSkillFileTree;
        if (!T || typeof T.findFileNodeById !== 'function') return null;
        const hit = T.findFileNodeById(this.skill.skillFiles || [], String(k).slice('file:'.length));
        return hit ? hit.node : null;
      },
      selectedFolder() {
        const k = this.navKey;
        if (!k || String(k).indexOf('folder:') !== 0 || !this.skill) return null;
        const T = window.DemoSkillFileTree;
        if (!T || typeof T.findFolderNodeById !== 'function') return null;
        const hit = T.findFolderNodeById(this.skill.skillFiles || [], String(k).slice('folder:'.length));
        return hit ? hit.node : null;
      },
      duplicatePaths() {
        const T = window.DemoSkillFileTree;
        if (!this.skill || !T || typeof T.findDuplicatePaths !== 'function') return [];
        return T.findDuplicatePaths(this.skill.skillFiles || []);
      },
      rulePolishKey() {
        return this.polishPrefix === 'wb' ? 'wb-analysisRule' : 'skill-analysisRule';
      },
    },
    methods: {
      setNavKey(key) {
        this.$emit('update:navKey', key === 'rule' ? 'rule' : String(key));
      },
      notifyChange() {
        this.$emit('change');
      },
      canDeleteTreeKey(treeKey) {
        if (!treeKey || treeKey === 'rule') return false;
        return String(treeKey).startsWith('file:') || String(treeKey).startsWith('folder:');
      },
      treeNodeDraggable(node) {
        if (this.locked) return false;
        const T = window.DemoSkillFileTree;
        return !!(T && T.treeNodeIsDraggable && T.treeNodeIsDraggable(node));
      },
      addNode(info) {
        if (this.locked || !this.skill) return;
        const T = window.DemoSkillFileTree;
        if (!T) return;
        const root = T.ensureSkillFiles(this.skill);
        const key = info && info.key;
        let node;
        if (key === 'md') node = T.newFileNode('md', '');
        else if (key === 'folder') node = T.newFolderNode();
        else if (String(key || '').startsWith('code:')) node = T.newFileNode('code', String(key).slice(5));
        else return;

        T.insertChild(root, T.findAddParentRef(root, this.navKey), node);
        if (node.kind === 'file') {
          this.setNavKey('file:' + node.id);
        } else {
          this.setNavKey('folder:' + node.id);
          const next = new Set(this.expandedKeys || []);
          next.add('folder:' + node.id);
          this.$emit('update:expandedKeys', Array.from(next));
        }
        this.notifyChange();
      },
      removeNode(treeKey) {
        if (this.locked || !this.skill) return;
        const T = window.DemoSkillFileTree;
        if (!T || !treeKey || treeKey === 'rule') return;
        const raw = String(treeKey);
        const id = raw.startsWith('file:')
          ? raw.slice('file:'.length)
          : raw.startsWith('folder:')
            ? raw.slice('folder:'.length)
            : '';
        if (!id) return;
        const files = T.ensureSkillFiles(this.skill);
        const fileNode = T.findFileNodeById ? T.findFileNodeById(files, id) : null;
        const folderNode = !fileNode && T.findFolderNodeById ? T.findFolderNodeById(files, id) : null;
        const label =
          (fileNode && fileNode.filename) ||
          (folderNode && folderNode.name) ||
          (raw.startsWith('folder:') ? '该文件夹' : '该文件');
        const apply = () => {
          T.removeNodeById(files, id);
          if (String(this.navKey) === raw) this.setNavKey('rule');
          this.notifyChange();
        };
        const dc = window.dsConfirm;
        if (!dc || !dc.pageDelete) {
          apply();
          return;
        }
        dc.pageDelete({
          name: String(label).trim() || '该项',
          onOk: apply,
        });
      },
      onTreeSelect(selectedKeys) {
        if (!selectedKeys || !selectedKeys.length) return;
        this.setNavKey(selectedKeys[0]);
      },
      onTreeDrop(info) {
        if (this.locked || !this.skill) return;
        const T = window.DemoSkillFileTree;
        if (!T || !T.applyTreeDropFromAntEvent) return;
        const res = T.applyTreeDropFromAntEvent(this.skill, info);
        if (!res.ok) {
          message.warning(res.message || '无法放置到此处');
          return;
        }
        this.notifyChange();
      },
      codeLabel(file) {
        if (!file || file.fileKind !== 'code') return '代码';
        const map = { python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', shell: 'Shell' };
        return map[file.codeLang] || file.codeLang || '代码';
      },
      filePolishKey(file, short) {
        if (!file) return '';
        return this.polishPrefix === 'wb' ? 'wb-sf:' + file.id + ':' + short : String(file.id) + ':' + short;
      },
      undoDisabled(key) {
        return this.locked || !!this.polishKey || !hasOwn(this.polishUndo, key);
      },
      polishDisabled() {
        return this.locked || !!this.polishKey;
      },
      polishRule() {
        this.$emit('polish-rule');
      },
      undoRule() {
        this.$emit('undo-rule');
      },
      polishFileField(file, field) {
        this.$emit('polish-file-field', file, field);
      },
      undoFileField(file, field) {
        this.$emit('undo-file-field', file, field);
      },
    },
    template: `
      <div class="skill-config-master-detail">
        <aside class="skill-config-nav-pane" aria-label="技能配置结构">
          <div class="skill-config-nav-tree">
            <div class="skill-config-nav-tree-head skill-config-nav-tree-head--with-actions">
              <span>可配置文件</span>
              <a-dropdown v-if="showAdd" :trigger="['hover', 'click']" placement="bottomRight" overlayClassName="skill-config-add-file-dropdown">
                <a-button
                  type="text"
                  size="small"
                  class="ds-icon-btn ds-icon-btn--standard skill-config-nav-add-btn"
                  aria-label="添加文件或文件夹"
                  :disabled="locked"
                  @click.stop
                >
                  <ds-icon name="plus" aria-hidden="true" />
                </a-button>
                <template #overlay>
                  <a-menu @click="addNode">
                    <a-menu-item key="md">Markdown（.md）</a-menu-item>
                    <a-sub-menu key="sub-code" title="代码文件">
                      <a-menu-item key="code:python">Python</a-menu-item>
                      <a-menu-item key="code:javascript">JavaScript</a-menu-item>
                      <a-menu-item key="code:typescript">TypeScript</a-menu-item>
                      <a-menu-item key="code:shell">Shell</a-menu-item>
                    </a-sub-menu>
                    <a-menu-item key="folder">文件夹</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div class="skill-config-nav-tree-body">
              <a-tree
                class="skill-config-ant-tree"
                block-node
                show-line
                :tree-data="treeData"
                v-model:expanded-keys="treeExpandedKeys"
                :selected-keys="selectedKeys"
                :draggable="treeNodeDraggable"
                @select="onTreeSelect"
                @drop="onTreeDrop"
              >
                <template #title="{ key, title }">
                  <span class="skill-config-tree-title-row">
                    <span class="skill-config-tree-title-row__text" :class="{ 'skill-config-tree-title-row__text--ellipsis': key !== 'rule' }">{{ title }}</span>
                    <a-button
                      v-if="canDeleteTreeKey(key) && !locked"
                      type="text"
                      danger
                      size="small"
                      class="ds-icon-btn ds-icon-btn--xs skill-config-tree-title-row__del"
                      aria-label="删除该项"
                      @click.stop="removeNode(key)"
                    >
                      <svg class="iconpark-icon" aria-hidden="true"><use href="#close-small"></use></svg>
                    </a-button>
                  </span>
                </template>
              </a-tree>
            </div>
          </div>
        </aside>
        <div class="skill-config-detail-pane">
          <div v-if="navKey === 'rule'" class="skill-config-detail-inner">
            <div class="skill-config-section-head">
              <div class="skill-config-section-title-cluster">
                <h3 class="skill-config-col-title">{{ ruleTitle }}</h3>
              </div>
              <div v-if="!locked" class="skill-object-field-polish">
                <span v-show="polishKey === rulePolishKey" class="ds-input-ai-polish-status">润色中...</span>
                <button
                  type="button"
                  class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled"
                  aria-label="撤回"
                  title="撤回至润色前"
                  :disabled="undoDisabled(rulePolishKey)"
                  @click.stop="undoRule"
                >
                  <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                  <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                </button>
                <button
                  type="button"
                  class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled"
                  aria-label="智能润色"
                  title="智能润色"
                  :disabled="polishDisabled()"
                  @click.stop="polishRule"
                >
                  <ds-icon name="magic" aria-hidden="true" />
                  <span class="ds-input-ai-polish-btn__label">润色</span>
                </button>
              </div>
            </div>
            <div class="skill-rules-editor">
              <div v-if="ruleHelp" class="skill-rules-input-label">
                <div class="skill-object-field-label-row">
                  <div class="skill-object-field-label skill-object-field-label--inline">{{ ruleHelp }}</div>
                </div>
              </div>
              <div class="ds-input-ai-polish-wrap">
                <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': polishKey === rulePolishKey }">
                  <textarea
                    class="skill-rules-editor-textarea"
                    v-model="skill.analysisRule"
                    :disabled="locked"
                    :placeholder="analysisPlaceholder"
                    @blur="notifyChange"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="selectedFolder" class="skill-config-detail-inner">
            <div class="skill-config-section-head">
              <div class="skill-config-section-title-cluster">
                <h3 class="skill-config-col-title">文件夹</h3>
              </div>
            </div>
            <div class="skill-object-field-group">
              <div class="skill-object-field-label skill-object-field-label--inline">文件夹名称<span class="skill-required">*</span></div>
              <a-input
                v-model:value="selectedFolder.name"
                placeholder="例如：抽取脚本、辅助说明"
                :disabled="locked"
                @blur="notifyChange"
              />
            </div>
          </div>
          <div v-else-if="selectedFile" class="skill-config-detail-inner">
            <div class="skill-config-section-head">
              <div class="skill-config-section-title-cluster">
                <h3 class="skill-config-col-title">配置文件</h3>
                <UiTagSm v-if="selectedFile.fileKind === 'md'" class="ds-tag--tone-primary">Markdown</UiTagSm>
                <UiTagSm v-else>{{ codeLabel(selectedFile) }}</UiTagSm>
              </div>
            </div>
            <a-alert
              v-if="duplicatePaths.length"
              type="warning"
              show-icon
              :message="'文件名路径重复：' + duplicatePaths.join('、')"
              style="margin-bottom: var(--ds-space-sm);"
            />
            <div class="skill-object-field-group">
              <div class="skill-object-field-label-row">
                <div class="skill-object-field-label skill-object-field-label--inline">文件名<span class="skill-required">*</span></div>
                <div v-if="!locked" class="skill-object-field-polish">
                  <span v-show="polishKey === filePolishKey(selectedFile, 'fn')" class="ds-input-ai-polish-status">润色中...</span>
                  <button
                    type="button"
                    class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled"
                    aria-label="撤回"
                    title="撤回至润色前"
                    :disabled="undoDisabled(filePolishKey(selectedFile, 'fn'))"
                    @click.stop="undoFileField(selectedFile, 'filename')"
                  >
                    <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                    <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                  </button>
                  <button
                    type="button"
                    class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled"
                    aria-label="智能润色"
                    title="智能润色"
                    :disabled="polishDisabled()"
                    @click.stop="polishFileField(selectedFile, 'filename')"
                  >
                    <ds-icon name="magic" aria-hidden="true" />
                    <span class="ds-input-ai-polish-btn__label">润色</span>
                  </button>
                </div>
              </div>
              <div class="ds-input-ai-polish-wrap">
                <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': polishKey === filePolishKey(selectedFile, 'fn') }">
                  <a-input v-model:value="selectedFile.filename" :disabled="locked" placeholder="例如：notes.md、extract.py" @blur="notifyChange" />
                </div>
              </div>
            </div>
            <div class="skill-object-field-group">
              <div class="skill-object-field-label-row">
                <div class="skill-object-field-label skill-object-field-label--inline">具体内容<span class="skill-required">*</span></div>
                <div v-if="!locked" class="skill-object-field-polish">
                  <span v-show="polishKey === filePolishKey(selectedFile, 'ct')" class="ds-input-ai-polish-status">润色中...</span>
                  <button
                    type="button"
                    class="ds-input-ai-polish-undo-btn ds-input-ai-polish-undo-btn--labeled"
                    aria-label="撤回"
                    title="撤回至润色前"
                    :disabled="undoDisabled(filePolishKey(selectedFile, 'ct'))"
                    @click.stop="undoFileField(selectedFile, 'content')"
                  >
                    <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                    <span class="ds-input-ai-polish-undo-btn__label">撤回</span>
                  </button>
                  <button
                    type="button"
                    class="ds-input-ai-polish-btn ds-input-ai-polish-btn--labeled"
                    aria-label="智能润色"
                    title="智能润色"
                    :disabled="polishDisabled()"
                    @click.stop="polishFileField(selectedFile, 'content')"
                  >
                    <ds-icon name="magic" aria-hidden="true" />
                    <span class="ds-input-ai-polish-btn__label">润色</span>
                  </button>
                </div>
              </div>
              <div class="ds-input-ai-polish-wrap">
                <div class="ds-input-ai-polish-input-shell" :class="{ 'is-polishing': polishKey === filePolishKey(selectedFile, 'ct') }">
                  <textarea
                    v-if="selectedFile.fileKind === 'md'"
                    class="skill-rules-editor-textarea"
                    v-model="selectedFile.content"
                    :disabled="locked"
                    placeholder="写入该文件的说明、抽取口径或提示词片段等。"
                    rows="14"
                    @blur="notifyChange"
                  ></textarea>
                  <textarea
                    v-else
                    class="skill-rules-editor-textarea ds-font-mono"
                    v-model="selectedFile.content"
                    :disabled="locked"
                    placeholder="请输入代码或脚本内容。"
                    rows="14"
                    @blur="notifyChange"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });
})();
