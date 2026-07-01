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
      navTitle: { type: String, default: '可配置文件' },
      resourceTreeStyle: { type: Boolean, default: false },
      showSave: { type: Boolean, default: false },
      saveDisabled: { type: Boolean, default: true },
    },
    emits: [
      'update:navKey',
      'update:expandedKeys',
      'change',
      'save',
      'polish-rule',
      'undo-rule',
      'polish-file-field',
      'undo-file-field',
    ],
    data() {
      return {
        renameModalOpen: false,
        renameTargetKey: '',
        renameValue: '',
        navPaneWidth: 320,
        navPaneResizing: false,
      };
    },
    computed: {
      navPaneStyle() {
        return this.resourceTreeStyle ? { width: this.navPaneWidth + 'px' } : null;
      },
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
      renameOkDisabled() {
        return this.locked || !String(this.renameValue || '').trim();
      },
      renameFieldLabel() {
        return String(this.renameTargetKey || '').startsWith('folder:') ? '文件夹名称' : '文件名称';
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
      treeNodeIsFolder(key) {
        return String(key || '').startsWith('folder:');
      },
      treeNodeIcon(key) {
        return this.treeNodeIsFolder(key) ? 'folder' : 'file-lines';
      },
      treeNodeExpanded(key) {
        return (this.expandedKeys || []).includes(String(key || ''));
      },
      toggleTreeFolderExpanded(key) {
        if (!this.treeNodeIsFolder(key)) return;
        const raw = String(key);
        const next = new Set(this.expandedKeys || []);
        if (next.has(raw)) next.delete(raw);
        else next.add(raw);
        this.$emit('update:expandedKeys', Array.from(next));
      },
      treeNodeDraggable(node) {
        if (this.locked) return false;
        const T = window.DemoSkillFileTree;
        return !!(T && T.treeNodeIsDraggable && T.treeNodeIsDraggable(node));
      },
      addNode(info) {
        this.createTreeNode(info && info.key, this.navKey);
      },
      createTreeNode(key, parentKey) {
        if (this.locked || !this.skill) return;
        const T = window.DemoSkillFileTree;
        if (!T) return;
        const root = T.ensureSkillFiles(this.skill);
        const rawKey = String(key || '');
        const typeKey = rawKey.startsWith('create:') ? rawKey.slice('create:'.length) : rawKey;
        let node;
        if (typeKey === 'md') node = T.newFileNode('md', '');
        else if (typeKey === 'folder') node = T.newFolderNode();
        else if (typeKey.startsWith('code:')) node = T.newFileNode('code', typeKey.slice(5));
        else return;

        const parentRef = this.treeNodeIsFolder(parentKey)
          ? String(parentKey).slice('folder:'.length)
          : T.findAddParentRef(root, this.navKey);
        T.insertChild(root, parentRef, node);
        if (parentRef && parentRef !== 'root') {
          const next = new Set(this.expandedKeys || []);
          next.add('folder:' + parentRef);
          this.$emit('update:expandedKeys', Array.from(next));
        }
        if (node.kind === 'file') {
          this.setNavKey('file:' + node.id);
        } else {
          const next = new Set(this.expandedKeys || []);
          next.add('folder:' + node.id);
          this.$emit('update:expandedKeys', Array.from(next));
        }
        this.notifyChange();
      },
      findRenameTarget(treeKey) {
        if (!this.skill || !this.canDeleteTreeKey(treeKey)) return null;
        const T = window.DemoSkillFileTree;
        if (!T) return null;
        const raw = String(treeKey || '');
        const files = T.ensureSkillFiles(this.skill);
        const hit = raw.startsWith('file:')
          ? T.findFileNodeById(files, raw.slice('file:'.length))
          : T.findFolderNodeById(files, raw.slice('folder:'.length));
        if (!hit || !hit.node) return null;
        const field = raw.startsWith('file:') ? 'filename' : 'name';
        return { node: hit.node, field, name: String(hit.node[field] || '').trim() };
      },
      renameNode(treeKey) {
        if (this.locked || !this.skill || !this.canDeleteTreeKey(treeKey)) return;
        const target = this.findRenameTarget(treeKey);
        if (!target) return;
        this.renameTargetKey = String(treeKey || '');
        this.renameValue = target.name;
        this.renameModalOpen = true;
      },
      closeRenameModal() {
        this.renameModalOpen = false;
      },
      confirmRename() {
        const target = this.findRenameTarget(this.renameTargetKey);
        const trimmed = String(this.renameValue || '').trim();
        if (!target || !trimmed) return;
        this.renameModalOpen = false;
        if (trimmed === target.name) return;
        target.node[target.field] = trimmed;
        this.notifyChange();
      },
      handleTreeMenuClick(menuKey, treeKey) {
        const key = String(menuKey || '');
        if (key.startsWith('create:')) {
          this.createTreeNode(key, treeKey);
          return;
        }
        if (key === 'rename') {
          this.renameNode(treeKey);
          return;
        }
        if (key === 'delete') this.removeNode(treeKey);
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
        const key = selectedKeys[0];
        if (this.treeNodeIsFolder(key)) return;
        this.setNavKey(key);
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
      saveConfig() {
        this.$emit('save');
      },
      startNavPaneResize(event) {
        if (!this.resourceTreeStyle) return;
        this.navPaneResizing = true;
        event.preventDefault();
        if (event.currentTarget && event.currentTarget.setPointerCapture) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      },
      resizeNavPane(event) {
        if (!this.navPaneResizing) return;
        const root = event.currentTarget && event.currentTarget.closest('.skill-config-master-detail');
        if (!root) return;
        const rect = root.getBoundingClientRect();
        const max = Math.max(320, Math.min(520, rect.width - 360));
        const next = event.clientX - rect.left;
        this.navPaneWidth = Math.max(240, Math.min(next, max));
      },
      stopNavPaneResize(event) {
        this.navPaneResizing = false;
        if (
          event.currentTarget &&
          event.currentTarget.releasePointerCapture &&
          (!event.currentTarget.hasPointerCapture || event.currentTarget.hasPointerCapture(event.pointerId))
        ) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
    },
    template: `
      <div class="skill-config-master-detail">
        <aside class="skill-config-nav-pane" :style="navPaneStyle" aria-label="技能配置结构">
          <div class="skill-config-nav-tree">
            <div class="skill-config-nav-tree-head skill-config-nav-tree-head--with-actions">
              <span>{{ navTitle }}</span>
              <a-dropdown v-if="showAdd" :trigger="['click']" placement="bottomRight" overlayClassName="skill-config-add-file-dropdown">
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
                    <a-menu-item key="md"><ds-icon name="plus" aria-hidden="true" />新增文件</a-menu-item>
                    <a-menu-item key="folder"><ds-icon name="folder-plus" aria-hidden="true" />新增文件夹</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
            <div :class="['skill-config-nav-tree-body', { 'workbench-v2-scope': resourceTreeStyle }]">
              <a-tree
                :class="['skill-config-ant-tree', { 'wb-material-file-tree skill-config-ant-tree--resource': resourceTreeStyle }]"
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
                  <a-dropdown
                    v-if="resourceTreeStyle"
                    :trigger="canDeleteTreeKey(key) && !locked ? ['contextmenu'] : []"
                    overlayClassName="skill-config-add-file-dropdown"
                    @click.stop
                  >
                    <div
                    :class="['nlm-tree-leaf', treeNodeIsFolder(key) ? 'nlm-tree-leaf--folder' : 'nlm-tree-leaf--analysis', { checked: selectedKeys.includes(String(key)) }]"
                    @click.stop="treeNodeIsFolder(key) ? toggleTreeFolderExpanded(key) : setNavKey(key)"
                    >
                      <span
                        v-if="treeNodeIsFolder(key)"
                        class="nlm-tree-leaf-icon nlm-tree-leaf-icon--folder-toggle"
                        @click.stop="toggleTreeFolderExpanded(key)"
                      >
                        <ds-icon
                          name="chevron-right"
                          class="nlm-resource-drawer__chevron wb-material-file-tree-switcher-chev"
                          :class="{ 'wb-material-file-tree-switcher-chev--expanded': treeNodeExpanded(key) }"
                          aria-hidden="true"
                        />
                      </span>
                      <span v-else class="nlm-tree-leaf-icon">
                        <ds-icon :name="treeNodeIcon(key)" aria-hidden="true" />
                      </span>
                      <div class="nlm-tree-leaf-title-wrap">
                        <div :class="['nlm-tree-leaf-col', { 'nlm-tree-leaf-col--folder': treeNodeIsFolder(key) }]">
                          <div class="nlm-tree-leaf-title">{{ title }}</div>
                        </div>
                      </div>
                      <span class="nlm-tree-leaf-right" v-if="canDeleteTreeKey(key) && !locked">
                        <div class="nlm-tree-leaf-actions">
                          <a-dropdown :trigger="['click']" overlayClassName="skill-config-add-file-dropdown" @click.stop>
                            <a-tooltip title="更多">
                              <a-button
                                type="text"
                                size="small"
                                class="ds-icon-btn ds-icon-btn--xs ds-icon-btn--nlm nlm-tree-leaf-action-icon"
                                aria-label="更多操作"
                                title="更多"
                                @click.stop
                              >
                                <ds-icon name="more" aria-hidden="true" />
                              </a-button>
                            </a-tooltip>
                            <template #overlay>
                              <a-menu @click="({ key: menuKey }) => handleTreeMenuClick(menuKey, key)">
                                <template v-if="treeNodeIsFolder(key)">
                                  <a-menu-item key="create:md"><ds-icon name="plus" aria-hidden="true" />新增文件</a-menu-item>
                                  <a-menu-item key="create:folder"><ds-icon name="folder-plus" aria-hidden="true" />新增文件夹</a-menu-item>
                                  <a-menu-divider />
                                </template>
                                <a-menu-item key="rename">重命名</a-menu-item>
                                <a-menu-item key="delete" danger>删除</a-menu-item>
                              </a-menu>
                            </template>
                          </a-dropdown>
                        </div>
                      </span>
                    </div>
                    <template #overlay>
                      <a-menu @click="({ key: menuKey }) => handleTreeMenuClick(menuKey, key)">
                        <template v-if="treeNodeIsFolder(key)">
                          <a-menu-item key="create:md"><ds-icon name="plus" aria-hidden="true" />新增文件</a-menu-item>
                          <a-menu-item key="create:folder"><ds-icon name="folder-plus" aria-hidden="true" />新增文件夹</a-menu-item>
                          <a-menu-divider />
                        </template>
                        <a-menu-item key="rename">重命名</a-menu-item>
                        <a-menu-item key="delete" danger>删除</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                  <span v-else class="skill-config-tree-title-row">
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
        <div
          v-if="resourceTreeStyle"
          :class="['skill-config-pane-resizer', { 'is-dragging': navPaneResizing }]"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整目录宽度"
          @pointerdown="startNavPaneResize"
          @pointermove="resizeNavPane"
          @pointerup="stopNavPaneResize"
          @pointercancel="stopNavPaneResize"
        ></div>
        <div class="skill-config-detail-pane">
          <div v-if="navKey === 'rule'" class="skill-config-detail-inner">
            <div class="skill-config-section-head">
              <div class="skill-config-section-title-cluster">
                <h3 class="skill-config-col-title">{{ ruleTitle }}</h3>
              </div>
              <div class="skill-config-section-actions">
                <div v-if="!locked" class="skill-object-field-polish">
                  <span v-show="polishKey === rulePolishKey" class="ds-input-ai-polish-status">润色中...</span>
                  <button
                    type="button"
                    class="ds-icon-btn ds-input-ai-polish-undo-btn"
                    aria-label="撤回"
                    title="撤回至润色前"
                    :disabled="undoDisabled(rulePolishKey)"
                    @click.stop="undoRule"
                  >
                    <ds-icon name="arrow-rotate-left" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="ds-icon-btn ds-input-ai-polish-btn"
                    aria-label="智能润色"
                    title="智能润色"
                    :disabled="polishDisabled()"
                    @click.stop="polishRule"
                  >
                    <iconpark-icon name="optimize" aria-hidden="true"></iconpark-icon>
                  </button>
                </div>
                <a-button
                  v-if="showSave && !locked"
                  :type="saveDisabled ? 'default' : 'primary'"
                  :disabled="saveDisabled"
                  @click="saveConfig"
                >保存</a-button>
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
          <div v-else-if="selectedFile" class="skill-config-detail-inner">
            <div class="skill-config-section-head">
              <div class="skill-config-section-title-cluster">
                <h3 class="skill-config-col-title">{{ selectedFile.filename || '未命名文件' }}</h3>
              </div>
              <a-button
                v-if="showSave && !locked"
                :type="saveDisabled ? 'default' : 'primary'"
                :disabled="saveDisabled"
                @click="saveConfig"
              >保存</a-button>
            </div>
            <a-alert
              v-if="duplicatePaths.length"
              type="warning"
              show-icon
              :message="'文件名路径重复：' + duplicatePaths.join('、')"
              style="margin-bottom: var(--ds-space-sm);"
            />
            <div class="skill-rules-editor">
              <textarea
                class="skill-rules-editor-textarea"
                :class="{ 'ds-font-mono': selectedFile.fileKind !== 'md' }"
                v-model="selectedFile.content"
                :disabled="locked"
                :placeholder="selectedFile.fileKind === 'md' ? '写入该文件的说明、抽取口径或提示词片段等。' : '请输入代码或脚本内容。'"
                @blur="notifyChange"
              ></textarea>
            </div>
          </div>
        </div>
        <a-modal
          :open="renameModalOpen"
          title="重命名"
          ok-text="确定"
          cancel-text="取消"
          :ok-button-props="{ disabled: renameOkDisabled }"
          @ok="confirmRename"
          @cancel="closeRenameModal"
        >
          <a-form layout="vertical">
            <a-form-item :label="renameFieldLabel" required>
              <a-input
                v-model:value="renameValue"
                :placeholder="'请输入' + renameFieldLabel"
                @keyup.enter="confirmRename"
              />
            </a-form-item>
          </a-form>
        </a-modal>
      </div>
    `,
  });
})();
