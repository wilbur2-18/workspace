(function () {
  const app = window.__DGP_COMPONENT_APP;
  const { compactNumber } = window.DGP_RUNTIME;
  const { buildInitialValues } = window.DGP_TEMPLATE_VARS || {
    buildInitialValues: () => ({}),
  };

  app.component('TemplateQueryModal', {
    props: {
      open: { type: Boolean, required: true },
      graphs: { type: Array, required: true },
      dataTemplates: { type: Array, required: true },
      initialGraph: { type: Object, default: null },
      initialTemplateId: { type: String, default: '' },
    },
    emits: ['update:open', 'finish'],
    data() {
      return {
        step: 0,
        selectedGraphId: '',
        dataTemplateId: '',
        paramValues: {},
      };
    },
    watch: {
      open: {
        immediate: true,
        handler(v) {
          if (!v) return;
          this.selectedGraphId = this.initialGraph?.id || this.graphs[0]?.id || '';
          this.dataTemplateId = this.initialTemplateId || this.dataTemplates[0]?.id || '';
          if (this.initialTemplateId && !this.dataTemplates.some((t) => t.id === this.initialTemplateId)) {
            this.dataTemplateId = this.dataTemplates[0]?.id || '';
          }
          this.resetParamValues();
        },
      },
      dataTemplateId() {
        this.resetParamValues();
      },
    },
    computed: {
      selectedGraph() {
        return this.graphs.find((g) => g.id === this.selectedGraphId) || this.graphs[0];
      },
      selectedTemplate() {
        return (
          this.dataTemplates.find((t) => t.id === this.dataTemplateId) ||
          this.dataTemplates[0] ||
          null
        );
      },
      title() {
        if (this.selectedTemplate?.name) return `模板查询 · ${this.selectedTemplate.name}`;
        return '模板查询';
      },
      templateVariables() {
        return this.selectedTemplate?.variables || [];
      },
      canSubmitParams() {
        return !!this.selectedTemplate;
      },
    },
    template: `
      <a-modal :open="open" :title="title" width="860px" :footer="null" destroy-on-close @cancel="close">
        <div class="graph-template-single-modal">
          <label class="graph-template-single-modal__field">
            <span>查询图谱</span>
            <a-select v-model:value="selectedGraphId" aria-label="查询图谱">
              <a-select-option v-for="g in graphs" :key="g.id" :value="g.id">
                {{ g.name }}
              </a-select-option>
            </a-select>
          </label>
          <section class="graph-template-single-modal__section">
            <div class="graph-template-single-modal__title">选择模板</div>
            <div class="graph-wizard-grid graph-template-single-modal__templates">
            <div
              v-for="t in dataTemplates"
              :key="t.id"
              class="graph-choice-card"
              :class="{ 'is-selected': dataTemplateId === t.id }"
              @click="selectTemplate(t)"
            >
              <div class="dgp-row-between">
                <strong>{{ t.name }}</strong>
              </div>
              <p class="dgp-section-desc">{{ t.desc }}</p>
              <a-tag>{{ t.type }}</a-tag>
            </div>
          </div>
          </section>
          <section class="graph-template-single-modal__section">
            <div class="graph-template-single-modal__title">填写参数</div>
          <a-alert
            v-if="selectedTemplate"
            type="info"
            show-icon
            :message="selectedTemplate.name"
            :description="selectedTemplate.desc"
            style="margin-bottom: var(--ds-space-s);"
          />
          <template-variable-form
            ref="variableForm"
            :variables="templateVariables"
            :values="paramValues"
            @update:values="paramValues = $event"
          />
          </section>
          <div class="dgp-row-between" style="margin-top: var(--ds-space-m);">
            <a-button @click="close">取消</a-button>
            <a-button type="primary" :disabled="!canSubmitParams" @click="submit">提交查询</a-button>
          </div>
        </div>
      </a-modal>
    `,
    methods: {
      compactNumber,
      close() {
        this.$emit('update:open', false);
      },
      resetParamValues() {
        const tpl = this.dataTemplates.find((t) => t.id === this.dataTemplateId);
        this.paramValues = buildInitialValues(tpl?.variables || []);
      },
      selectTemplate(t) {
        this.dataTemplateId = t.id;
      },
      submit() {
        const form = this.$refs.variableForm;
        if (form && typeof form.validate === 'function') {
          const { ok, missing } = form.validate();
          if (!ok) {
            const labels = missing.map((v) => v.label).join('、');
            antd.message.warning(`请填写：${labels}`);
            return;
          }
        }
        if (!this.selectedGraph || !this.selectedTemplate) return;
        this.$emit('finish', {
          source: 'template',
          graph: this.selectedGraph,
          template: this.selectedTemplate,
          params: { ...this.paramValues },
        });
        this.close();
      },
    },
  });
})();
