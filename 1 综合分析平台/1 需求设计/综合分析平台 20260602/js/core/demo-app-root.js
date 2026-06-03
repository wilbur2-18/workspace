    window.__DEMO_APP = createApp({
      template: `
        <a-config-provider :theme="appTheme">
          <a-layout class="app-shell">
            <!-- 必须用 v-if：.ant-layout-header 上有 display:flex !important，会压过 v-show 的内联 display:none，导致顶栏仍可见 -->
            <a-layout-header v-if="showGlobalHeader" class="app-header ds-header-bar ds-bg-enriched">
              <div class="header-section">
                <a href="#" class="header-logo-area" @click.prevent="navigate(VIEW_IDS.PROJECT)">
                  <div class="header-logo">MJ</div>
                  <span>综合分析平台</span>
                </a>
                <nav class="header-nav" aria-label="一级模块">
                  <a
                    v-for="item in navItems"
                    :key="item.id"
                    href="#"
                    :class="{ active: currentView === item.id }"
                    @click.prevent="navigate(item.id)"
                  >{{ item.label }}</a>
                </nav>
              </div>
              <div class="header-actions">
                <a-avatar size="small" class="header-avatar">U</a-avatar>
                <span class="header-user-name">审计员01</span>
              </div>
            </a-layout-header>
            <div class="demo-embed-main-wrap">
              <!-- 审计助手与工作台详情共用「引用技能」弹窗：ProjectCenterView 在助手页保持挂载（隐藏），以便复用 demo-cmp-project 内同一 a-modal。
                   v-show 须挂在外层 div：内层 a-layout.shell-main 含 display:flex !important，会压过直接写在组件上的 v-show（与顶栏 a-layout-header 同理）。 -->
              <div
                v-if="projectAssistShellMounted"
                v-show="currentView === VIEW_IDS.PROJECT"
                class="project-center-view-layer"
              >
                <project-center-view
                  :open-new-project-modal="openNewProjectModal"
                />
              </div>
              <free-audit-view
                v-if="currentView === VIEW_IDS.FREE_AUDIT"
                @navigate="navigate"
              />
              <free-audit-workbench-v2
                v-if="currentView === VIEW_IDS.FREE_AUDIT_V2"
                @navigate="navigate"
              />
              <template-center-view
                v-if="currentView === VIEW_IDS.TEMPLATE"
              />
              <settings-view
                v-if="currentView === VIEW_IDS.SETTINGS"
              />
            </div>
            <a-modal v-model:open="showNewProjectModal" title="创建工作台" width="640" wrapClassName="modal-w-640" @cancel="closeNewProjectModal">
              <a-form layout="vertical">
                <a-form-item label="工作台名称">
                  <a-input v-model:value="newProjectForm.name" allow-clear />
                </a-form-item>
                <a-form-item label="工作台简介">
                  <a-textarea v-model:value="newProjectForm.description" :rows="3" />
                </a-form-item>
                <a-form-item label="工作台权限">
                  <a-radio-group v-model:value="newProjectForm.visibility">
                    <a-radio value="private">仅我可见</a-radio>
                    <a-radio value="shared">指定用户可见</a-radio>
                  </a-radio-group>
                  <div v-show="newProjectForm.visibility === 'shared'" style="margin-top: var(--ds-space-sm);">
                    <space-share-picker
                      v-model:user-ids="newProjectForm.sharedUserIds"
                      v-model:dept-keys="newProjectForm.sharedDeptIds"
                    />
                  </div>
                </a-form-item>
              </a-form>
              <template #footer>
                <div class="ds-modal-footer-end">
                  <a-space>
                    <a-button @click="closeNewProjectModal">取消</a-button>
                    <a-button type="primary" @click="submitNewProject">创建</a-button>
                  </a-space>
                </div>
              </template>
            </a-modal>
          </a-layout>
        </a-config-provider>
      `,
      data() {
        const initialView = getHashView();
        return {
          VIEW_IDS,
          appTheme: APP_THEME,
          navItems: NAV_ITEMS,
          currentView: initialView,
          shellProjectDetailOpen: false,
          showNewProjectModal: false,
          newProjectForm: { name: '', description: '', visibility: 'private', sharedUserIds: [], sharedDeptIds: [] },
          /** 曾进入审计助手或工作台后保持挂载 ProjectCenterView，供助手侧调用「引用技能」与工作台同一弹窗 */
          projectAssistShellMounted: initialView === VIEW_IDS.PROJECT || initialView === VIEW_IDS.FREE_AUDIT || initialView === VIEW_IDS.FREE_AUDIT_V2,
        };
      },
      computed: {
        showGlobalHeader() {
          return this.currentView !== VIEW_IDS.FREE_AUDIT && this.currentView !== VIEW_IDS.FREE_AUDIT_V2;
        },
      },
      watch: {
        currentView: {
          immediate: true,
          handler(v) {
            if (v === VIEW_IDS.PROJECT || v === VIEW_IDS.FREE_AUDIT || v === VIEW_IDS.FREE_AUDIT_V2) this.projectAssistShellMounted = true;
          },
        },
        'newProjectForm.visibility'(v) {
          if (v !== 'shared' && this.newProjectForm) {
            this.newProjectForm.sharedUserIds = [];
            this.newProjectForm.sharedDeptIds = [];
          }
        },
      },
      methods: {
        navigate(viewId) {
          this.currentView = viewId;
          const curHash = (window.location.hash || '').slice(1);
          const base = curHash.split('?')[0];
          if (viewId === VIEW_IDS.PROJECT && curHash.startsWith('project/')) return;
          if (viewId === VIEW_IDS.FREE_AUDIT && base === 'freeaudit') return;
          if (viewId === VIEW_IDS.FREE_AUDIT_V2 && base === 'freeaudit-v2') return;
          window.location.hash = VIEW_TO_HASH[viewId] || 'project';
        },
        openNewProjectModal() {
          this.newProjectForm = { name: '', description: '', visibility: 'private', sharedUserIds: [], sharedDeptIds: [] };
          this.showNewProjectModal = true;
        },
        ensureProjectAssistShellMounted() {
          this.projectAssistShellMounted = true;
          return this.$nextTick();
        },
        closeNewProjectModal() {
          this.showNewProjectModal = false;
          this.newProjectForm = { name: '', description: '', visibility: 'private', sharedUserIds: [], sharedDeptIds: [] };
        },
        submitNewProject() {
          if (!this.newProjectForm.name || !this.newProjectForm.name.trim()) {
            message.warning('请填写工作台名称');
            return;
          }
          let vis = 'private';
          let sharedIds = [];
          if (this.newProjectForm.visibility === 'shared') {
            vis = 'shared';
            sharedIds = [...(this.newProjectForm.sharedUserIds || [])].filter(Boolean);
            const sharedDeptIds = [...(this.newProjectForm.sharedDeptIds || [])].filter(Boolean);
            if (sharedIds.length === 0 && sharedDeptIds.length === 0) {
              message.warning('请至少选择一个部门或一名用户');
              return;
            }
          }
          const newId = 'PRJ-' + Date.now();
          const sharedDeptIdsOut = vis === 'shared' ? [...(this.newProjectForm.sharedDeptIds || [])].filter(Boolean) : [];
          const payload = {
            id: newId,
            name: this.newProjectForm.name || '未命名工作台',
            description: this.newProjectForm.description || '',
            templateId: undefined,
            templateName: '-',
            fileCount: 0,
            createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
            visibility: vis,
            sharedUserIds: vis === 'shared' ? sharedIds : [],
            sharedDeptIds: vis === 'shared' ? sharedDeptIdsOut : [],
          };
          sessionStorage.setItem('pendingNewProject', JSON.stringify(payload));
          window.location.hash = 'freeaudit?projectId=' + encodeURIComponent(newId);
          this.closeNewProjectModal();
        },
      },
      mounted() {
        const onHashChange = () => {
          const nextView = getHashView();
          if (this.currentView !== nextView) this.currentView = nextView;
          this.shellProjectDetailOpen = false;
        };
        onHashChange();
        window.addEventListener('hashchange', onHashChange);
        const onMessage = (e) => {
          if (e.data && e.data.type === 'spa-navigate' && e.data.viewId) this.navigate(e.data.viewId);
        };
        window.addEventListener('message', onMessage);
        window.__demoEnsureProjectAssistShellMounted = () => this.ensureProjectAssistShellMounted();
        this._spaCleanup = () => {
          window.removeEventListener('hashchange', onHashChange);
          window.removeEventListener('message', onMessage);
          if (window.__demoEnsureProjectAssistShellMounted) window.__demoEnsureProjectAssistShellMounted = null;
        };
      },
      beforeUnmount() {
        if (this._spaCleanup) this._spaCleanup();
      }
    });
