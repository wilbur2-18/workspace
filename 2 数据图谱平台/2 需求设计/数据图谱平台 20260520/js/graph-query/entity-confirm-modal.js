(function () {
  const app = window.__DGP_COMPONENT_APP;

  const DEFAULT_CANDIDATES = [
    { id: 'p-001', label: '财政供养人员-01', type: '人员', meta: 'ID P-001 · 财政供养' },
    { id: 'e-011', label: '财政供养人员-01关联企业', type: '企业', meta: 'ID E-011 · 法人股东关系' },
  ];

  function needsEntityDisambiguation(mode, params) {
    if (mode !== 'entity') return false;
    const name = String(params?.nameKeyword || '').trim();
    if (!name) return false;
    return name === '财政供养人员-01';
  }

  window.DGP_ENTITY_DISAMBIG = {
    needsEntityDisambiguation,
    DEFAULT_CANDIDATES,
  };

  app.component('EntityConfirmModal', {
    props: {
      open: { type: Boolean, required: true },
      candidates: { type: Array, default: () => DEFAULT_CANDIDATES },
      keyword: { type: String, default: '' },
    },
    emits: ['update:open', 'confirm', 'cancel'],
    data() {
      return { selectedId: '' };
    },
    watch: {
      open(v) {
        if (v) this.selectedId = '';
      },
    },
    template: `
      <a-modal
        :open="open"
        title="确认分析实体"
        width="640px"
        :footer="null"
        destroy-on-close
        @cancel="onCancel"
      >
        <a-alert
          type="info"
          show-icon
          message="查询到多个可能实体，请选择要分析的对象。"
          style="margin-bottom: var(--ds-space-s);"
        />
        <p v-if="keyword" class="dgp-section-desc" style="margin-bottom: var(--ds-space-s);">关键词：{{ keyword }}</p>
        <a-radio-group v-model:value="selectedId" style="width: 100%;">
          <div
            v-for="item in candidates"
            :key="item.id"
            class="graph-choice-card"
            :class="{ 'is-selected': selectedId === item.id }"
            style="margin-bottom: var(--ds-space-xs);"
          >
            <a-radio :value="item.id">
              <strong>{{ item.label }}</strong>
              <span v-if="item.type"> · {{ item.type }}</span>
              <span v-if="item.meta"> · {{ item.meta }}</span>
            </a-radio>
          </div>
        </a-radio-group>
        <div class="dgp-row-between" style="margin-top: var(--ds-space-m);">
          <a-button @click="onCancel">返回修改</a-button>
          <a-button type="primary" :disabled="!selectedId" @click="onConfirm">确认并执行查询</a-button>
        </div>
      </a-modal>
    `,
    methods: {
      onCancel() {
        this.$emit('update:open', false);
        this.$emit('cancel');
      },
      onConfirm() {
        const entity = this.candidates.find((c) => c.id === this.selectedId);
        if (!entity) return;
        this.$emit('confirm', entity);
        this.$emit('update:open', false);
      },
    },
  });
})();
