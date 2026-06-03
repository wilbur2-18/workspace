(function () {
  const app = window.__DGP_COMPONENT_APP;

  function defaultValueForVariable(v) {
    if (v.default !== undefined && v.default !== null) return v.default;
    if (v.type === 'multiSelect') return [];
    if (v.type === 'number') return v.min !== undefined ? v.min : undefined;
    return '';
  }

  function buildInitialValues(variables) {
    const values = {};
    (variables || []).forEach((v) => {
      values[v.key] = defaultValueForVariable(v);
    });
    return values;
  }

  window.DGP_TEMPLATE_VARS = {
    buildInitialValues,
    defaultValueForVariable,
  };

  app.component('TemplateVariableForm', {
    props: {
      variables: { type: Array, default: () => [] },
      values: { type: Object, required: true },
      disabled: { type: Boolean, default: false },
    },
    emits: ['update:values'],
    methods: {
      patch(key, value) {
        this.$emit('update:values', { ...this.values, [key]: value });
      },
      validate() {
        const missing = (this.variables || []).filter((v) => {
          if (!v.required) return false;
          const val = this.values[v.key];
          if (v.type === 'multiSelect') return !Array.isArray(val) || val.length === 0;
          if (v.type === 'number') return val === undefined || val === null || val === '';
          return val === undefined || val === null || String(val).trim() === '';
        });
        return { ok: missing.length === 0, missing };
      },
    },
    template: `
      <a-form layout="vertical" class="graph-template-variable-form">
        <a-form-item
          v-for="v in variables"
          :key="v.key"
          :label="v.label"
          :required="!!v.required"
        >
          <a-input
            v-if="v.type === 'text'"
            :value="values[v.key]"
            :placeholder="v.placeholder || ''"
            :disabled="disabled"
            allow-clear
            @update:value="patch(v.key, $event)"
          />
          <a-textarea
            v-else-if="v.type === 'textarea'"
            :value="values[v.key]"
            :placeholder="v.placeholder || ''"
            :disabled="disabled"
            :rows="v.rows || 3"
            allow-clear
            @update:value="patch(v.key, $event)"
          />
          <a-input-number
            v-else-if="v.type === 'number'"
            :value="values[v.key]"
            :min="v.min"
            :max="v.max"
            :disabled="disabled"
            style="width: 100%;"
            @update:value="patch(v.key, $event)"
          />
          <a-select
            v-else-if="v.type === 'select'"
            :value="values[v.key]"
            :placeholder="v.placeholder || '请选择'"
            :disabled="disabled"
            allow-clear
            style="width: 100%;"
            @update:value="patch(v.key, $event)"
          >
            <a-select-option v-for="opt in (v.options || [])" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-select
            v-else-if="v.type === 'multiSelect'"
            :value="values[v.key]"
            mode="multiple"
            :placeholder="v.placeholder || '请选择'"
            :disabled="disabled"
            allow-clear
            style="width: 100%;"
            @update:value="patch(v.key, $event)"
          >
            <a-select-option v-for="opt in (v.options || [])" :key="opt" :value="opt">{{ opt }}</a-select-option>
          </a-select>
          <a-input
            v-else
            :value="values[v.key]"
            :placeholder="v.placeholder || ''"
            :disabled="disabled"
            allow-clear
            @update:value="patch(v.key, $event)"
          />
          <div v-if="v.hint" class="dgp-section-desc" style="margin-top: 4px;">{{ v.hint }}</div>
        </a-form-item>
        <a-empty v-if="!variables.length" description="该模板未配置查询变量" />
      </a-form>
    `,
  });
})();
