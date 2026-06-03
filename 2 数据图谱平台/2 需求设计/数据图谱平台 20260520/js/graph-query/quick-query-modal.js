(function () {
  const app = window.__DGP_COMPONENT_APP;
  const disambig = window.DGP_ENTITY_DISAMBIG || { needsEntityDisambiguation: () => false };

  app.component('QuickQueryModal', {
    props: {
      open: { type: Boolean, required: true },
      graph: { type: Object, required: true },
      basicTemplates: { type: Array, default: () => [] },
      initialMode: { type: String, default: 'entity' },
    },
    emits: ['update:open', 'submit', 'need-entity-confirm'],
    data() {
      return {
        quickMode: 'entity',
        entityType: '人员',
        entityId: '',
        entityName: '',
        entitySteps: 1,
        pathStartNode: '财政供养人员-01',
        pathEndNode: '关联企业-01',
        pathMaxHop: 3,
        cypherStatement: 'MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 100',
      };
    },
    computed: {
      title() {
        return `快捷查询 · ${this.graph?.name || ''}`;
      },
      segmentOptions() {
        return (this.basicTemplates || []).map((t) => ({
          label: t.id === 'entity' ? '实体查询' : t.name,
          value: t.id,
        }));
      },
    },
    watch: {
      open(v) {
        if (!v) return;
        this.quickMode = this.initialMode || 'entity';
        this.entityType = '人员';
        this.entityId = '';
        this.entityName = '';
        this.entitySteps = 1;
      },
    },
    template: `
      <a-modal :open="open" :title="title" width="860px" :footer="null" destroy-on-close @cancel="close">
        <quick-query-form
          v-model:mode="quickMode"
          v-model:entity-type="entityType"
          v-model:entity-id="entityId"
          v-model:entity-name="entityName"
          v-model:entity-steps="entitySteps"
          v-model:path-start-node="pathStartNode"
          v-model:path-end-node="pathEndNode"
          v-model:path-max-hop="pathMaxHop"
          v-model:cypher-statement="cypherStatement"
          :segment-options="segmentOptions"
        />
        <div class="dgp-row-between" style="margin-top: var(--ds-space-m);">
          <a-button @click="close">取消</a-button>
          <a-button type="primary" @click="onSubmit">提交查询</a-button>
        </div>
      </a-modal>
    `,
    methods: {
      close() {
        this.$emit('update:open', false);
      },
      buildParams() {
        if (this.quickMode === 'path') {
          return {
            startNode: this.pathStartNode,
            endNode: this.pathEndNode,
            maxHop: this.pathMaxHop,
          };
        }
        if (this.quickMode === 'cypher') {
          return { statement: this.cypherStatement };
        }
        return {
          entityType: this.entityType,
          idKeyword: this.entityId,
          nameKeyword: this.entityName,
          steps: this.entitySteps,
        };
      },
      onSubmit() {
        const params = this.buildParams();
        const payload = {
          source: 'quick',
          graph: this.graph,
          mode: this.quickMode,
          params,
        };
        if (disambig.needsEntityDisambiguation(this.quickMode, params)) {
          this.$emit('need-entity-confirm', payload);
          return;
        }
        this.$emit('submit', payload);
        this.close();
      },
    },
  });
})();
