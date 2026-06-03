(function () {
  const app = window.__DGP_COMPONENT_APP;

  app.component('QuickQueryForm', {
    props: {
      mode: { type: String, default: 'entity' },
      entityType: { type: String, default: '人员' },
      entityId: { type: String, default: '' },
      entityName: { type: String, default: '' },
      entitySteps: { type: Number, default: 1 },
      pathStartNode: { type: String, default: '' },
      pathEndNode: { type: String, default: '' },
      pathMaxHop: { type: Number, default: 3 },
      cypherStatement: { type: String, default: '' },
      segmentOptions: { type: Array, default: () => [] },
      showModeSwitch: { type: Boolean, default: true },
    },
    emits: [
      'update:mode',
      'update:entityType',
      'update:entityId',
      'update:entityName',
      'update:entitySteps',
      'update:pathStartNode',
      'update:pathEndNode',
      'update:pathMaxHop',
      'update:cypherStatement',
    ],
    template: `
      <div class="graph-quick-query-form-block">
        <a-segmented
          v-if="showModeSwitch && segmentOptions.length"
          :value="mode"
          class="ds-ant-segmented ds-ant-segmented--l1-skill-scope"
          :options="segmentOptions"
          style="margin-bottom: var(--ds-space-m);"
          @update:value="$emit('update:mode', $event)"
        />
        <a-form layout="vertical">
          <template v-if="mode === 'entity'">
            <a-form-item label="对象类型">
              <a-select :value="entityType" style="width: 100%;" @update:value="$emit('update:entityType', $event)">
                <a-select-option value="人员">人员</a-select-option>
                <a-select-option value="企业">企业</a-select-option>
                <a-select-option value="机动车">机动车</a-select-option>
                <a-select-option value="行政事业单位">行政事业单位</a-select-option>
                <a-select-option value="电话">电话</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="ID">
              <a-input :value="entityId" placeholder="输入 ID 搜索值" allow-clear @update:value="$emit('update:entityId', $event)" />
            </a-form-item>
            <a-form-item label="姓名">
              <a-input :value="entityName" placeholder="输入姓名搜索值" allow-clear @update:value="$emit('update:entityName', $event)" />
            </a-form-item>
            <a-form-item label="查询步数">
              <a-input-number :value="entitySteps" :min="1" :max="5" style="width: 100%;" @update:value="$emit('update:entitySteps', $event)" />
            </a-form-item>
          </template>
          <template v-else-if="mode === 'path'">
            <a-form-item label="起点实体">
              <a-input :value="pathStartNode" placeholder="输入起点名称或 ID" allow-clear @update:value="$emit('update:pathStartNode', $event)" />
            </a-form-item>
            <a-form-item label="终点实体">
              <a-input :value="pathEndNode" placeholder="输入终点名称或 ID" allow-clear @update:value="$emit('update:pathEndNode', $event)" />
            </a-form-item>
            <a-form-item label="最大深度">
              <a-input-number :value="pathMaxHop" :min="1" :max="8" style="width: 100%;" @update:value="$emit('update:pathMaxHop', $event)" />
            </a-form-item>
          </template>
          <template v-else>
            <a-form-item label="查询语句">
              <a-textarea :value="cypherStatement" :rows="5" @update:value="$emit('update:cypherStatement', $event)" />
            </a-form-item>
          </template>
        </a-form>
      </div>
    `,
  });
})();
