(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};

  const Modal = antd.Modal;
  const message = antd.message;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const getFreeAuditQuery = freeauditUtils.getFreeAuditQuery || function () { return {}; };
  const presetSuggestions = freeauditUtils.presetSuggestions || [];
  const CHAT_DEMO_SCENARIOS = freeauditUtils.CHAT_DEMO_SCENARIOS || [];
  const WORKBENCH_PROJECT_NAME_BY_ID = freeauditUtils.WORKBENCH_PROJECT_NAME_BY_ID || {};
  const SUMMARY_RESPONSE_DEMO = freeauditUtils.SUMMARY_RESPONSE_DEMO || '';
  const DEMO_RUN_SUMMARY_TEXT = freeauditUtils.DEMO_RUN_SUMMARY_TEXT || '';
  const demoToolDiffLineClass = freeauditUtils.demoToolDiffLineClass || function () { return 'nlm-tool-diff-line--ctx'; };
  const demoLinesUnifiedDiff = freeauditUtils.demoLinesUnifiedDiff || function () { return { lines: [], truncated: false }; };
  const toAnalysisTemplateShared = freeauditUtils.toAnalysisTemplateShared || function (seed) { return seed; };
  const buildWorkbenchMaterialAntTreeData = freeauditUtils.buildWorkbenchMaterialAntTreeData || function () { return { treeData: [], autoExpandKeys: [] }; };
  const buildWorkbenchAnalysisResultAntTreeData = freeauditUtils.buildWorkbenchAnalysisResultAntTreeData || function () { return { treeData: [], autoExpandKeys: [], initialExpandKeys: [] }; };
  const buildWorkbenchAnalysisResultFolderPickerTree = freeauditUtils.buildWorkbenchAnalysisResultFolderPickerTree || function () { return []; };
  const WB_TASK_CREATE_RESULT_OUTPUT_ROOT = freeauditUtils.WB_TASK_CREATE_RESULT_OUTPUT_ROOT || '__root__';
  const resolveWbTaskCreateResultOutputFolder = freeauditUtils.resolveWbTaskCreateResultOutputFolder || function () { return { folderId: null, folderLabel: '根目录' }; };
  const applyWorkbenchMaterialTreeDrop = freeauditUtils.applyWorkbenchMaterialTreeDrop || function () { return { ok: false, message: '未实现' }; };
  const applyWorkbenchAnalysisResultTreeDrop = freeauditUtils.applyWorkbenchAnalysisResultTreeDrop || function () { return { ok: false, message: '未实现' }; };
  const wbMatMaterialPathPrefixForRow = freeauditUtils.wbMatMaterialPathPrefixForRow || function () { return ''; };
  const wbMatAntTreeKey = freeauditUtils.wbMatAntTreeKey || function (k, id) { return `${k}:${id}`; };

  function collectTreeNodeKeys(nodes, predicate) {
    const out = [];
    const visit = (arr) => {
      (Array.isArray(arr) ? arr : []).forEach((node) => {
        if (!node) return;
        if (!predicate || predicate(node)) out.push(String(node.key || ''));
        if (Array.isArray(node.children)) visit(node.children);
      });
    };
    visit(nodes);
    return out.filter(Boolean);
  }

  function parseCsvPreviewTable(csvText) {
    const input = String(csvText || '');
    if (!input.trim()) return { headers: [], rows: [] };
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (inQuotes) {
        if (ch === '"') {
          if (input[i + 1] === '"') {
            cell += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
        continue;
      }
      if (ch === '"') {
        inQuotes = true;
        continue;
      }
      if (ch === ',') {
        row.push(cell);
        cell = '';
        continue;
      }
      if (ch === '\r') continue;
      if (ch === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        continue;
      }
      cell += ch;
    }
    row.push(cell);
    if (row.some((item) => String(item || '').length > 0) || rows.length === 0) rows.push(row);
    const headers = rows.shift() || [];
    return { headers, rows };
  }

  function normalizeWbSkillDimensionValues(values) {
    return (Array.isArray(values) ? values : [])
      .map((item, index) => {
        const label = String((item && item.label) || '').trim();
        const id = String((item && item.id) || '').trim() || ('wb-skill-dim-val-' + index);
        return {
          id,
          label: label || ('维度值 ' + (index + 1)),
          enabled: !(item && item.enabled === false),
        };
      })
      .filter((item) => item.label);
  }

  function normalizeWbSkillDimensions(rawDims) {
    const dims = rawDims || {};
    const sourceCategories = Array.isArray(dims.categories) && dims.categories.length
      ? dims.categories
      : [
        {
          id: 'auditScene',
          label: '业务场景',
          description: '用于按业务场景筛选技能。',
          values: Array.isArray(dims.auditScenes) ? dims.auditScenes : [],
        },
        {
          id: 'skillType',
          label: '技能类型',
          description: '用于区分资料核查、疑点分析、结果整理等技能类型。',
          values: Array.isArray(dims.skillTypes) ? dims.skillTypes : [],
        },
      ];
    const categories = sourceCategories
      .map((item, index) => {
        const id = String((item && item.id) || '').trim() || ('wb-skill-dim-' + index);
        const label = String((item && item.label) || '').trim() || ('分类维度 ' + (index + 1));
        return {
          id,
          label,
          description: String((item && item.description) || '').trim(),
          values: normalizeWbSkillDimensionValues(item && item.values),
        };
      })
      .filter((item) => item.label);
    const auditScene = categories.find((item) => item.id === 'auditScene');
    const skillType = categories.find((item) => item.id === 'skillType');
    return {
      categories,
      auditScenes: auditScene ? auditScene.values.map((x) => ({ ...x })) : [],
      skillTypes: skillType ? skillType.values.map((x) => ({ ...x })) : [],
    };
  }

  NS.computed = {
        /** 生成技能配置弹窗：意图非空才可提交 */
        wbGenerateSkillIntentTrimmed() {
          return String(this.wbGenerateSkillIntentText || '').trim();
        },
        freeAuditChatHost() { return this; },
        isWorkbenchV2DetailPaneVisible() {
          return this.sourcesRightView === 'detail'
            || (this.workbenchEmbedMode === 'v2' && !!String(this.workbenchV2DetailActiveTabKey || '').trim());
        },
        skillObjectMaterialTypePlaceholder() {
          return (typeof window !== 'undefined' && window.__DEMO_SKILL_OBJECT_MATERIAL_TYPE_PLACEHOLDER) || '请填写资料名称或类型';
        },
        selectedMaterial() {
          const id = this.selectedMaterialId;
          const m = (this.materials || []).find((x) => x.id === id);
          if (m) return m;
          const created = (this.workbenchCreatedTasks || []).find((x) => x && x.id === id);
          if (created) return created;
          const demo = (this.workbenchTaskDemoRows || []).find((x) => x && x.id === id);
          if (demo) return demo;
          return this.findWorkbenchTaskChildById(id);
        },
        /** 演示任务列表（含已完成 / 执行中 / 失败）；数据源自 demo-mock-data.js 中 Vue 响应式 demoWorkbenchTaskRows */
        workbenchTaskDemoRows() {
          if (typeof demoWorkbenchTaskRows === 'undefined' || !Array.isArray(demoWorkbenchTaskRows)) return [];
          const pid = String(this.workbenchProjectId || '').trim();
          if (!pid) return demoWorkbenchTaskRows;
          return demoWorkbenchTaskRows.filter((row) => String((row && row.projectId) || 'PRJ-2026-001') === pid);
        },
        /** 侧栏任务清单中新建的、仅存在于 workbenchCreatedTasks 的条目（非资料区分析结果物料） */
        selectedMaterialIsWorkbenchCreatedTask() {
          const id = this.selectedMaterialId;
          const inCreated = !!(this.workbenchCreatedTasks || []).find((x) => x && x.id === id);
          if (inCreated) return true;
          if (!!(this.workbenchTaskDemoRows || []).find((x) => x && x.id === id)) return true;
          return !!this.findWorkbenchTaskChildById(id);
        },
        /** 右侧内嵌预览顶栏标题：任务条目与正式结果条目区分布局一致，仅文案区分 */
        workbenchEmbedRightAnalysisHeaderTitle() {
          const fb = this.selectedMaterialIsWorkbenchCreatedTask ? '任务详情' : '结果预览';
          const r = this.workbenchSelectedAnalysisResultRow;
          return (r && r.name) || (this.selectedMaterial && this.selectedMaterial.title) || fb;
        },
        /** 新建任务台账在未成功前仅展示占位型输出说明，不提供复制 / 下载 / 编辑入库能力 */
        workbenchEmbedAnalysisOutputToolbarDisabled() {
          if (!this.selectedMaterialIsWorkbenchCreatedTask || !this.selectedMaterial) return false;
          return this.workbenchAnalysisStatusOf(this.selectedMaterial) !== 'done';
        },
        workbenchAnalysisEmbedDirty() {
          if (this.workbenchEmbedAnalysisOutputToolbarDisabled) return false;
          return String(this.workbenchAnalysisEmbedDraft ?? '') !== String(this._workbenchAnalysisEmbedSnap ?? '');
        },
        wbAnalysisModalEmbedDirty() {
          if (!this.wbAnalysisModalRecord) return false;
          return String(this.wbAnalysisModalEmbedDraft ?? '') !== String(this._wbAnalysisModalEmbedSnap ?? '');
        },
        wbMaterialMetaEditDirty() {
          const snap = this._wbMaterialMetaSnap;
          const f = this.wbMaterialMetaEditForm;
          if (!snap || !f) return false;
          return String(f.name || '').trim() !== String(snap.name || '').trim();
        },
        /** 当前侧栏选中资料对应的工作台资料行（与工作台资料预览同源） */
        workbenchSelectedProjectMaterialRow() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'raw' || !m.projectSource) return null;
          return m.projectSource;
        },
        /** 侧栏/内嵌：当前分析结果对应的工作台内结果行（与工作台「结果预览」弹窗同源字段） */
        workbenchSelectedAnalysisResultRow() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return null;
          const ps = m.projectSource || {};
          const rowStatus = ps.status || m.status || 'done';
          return {
            id: ps.id || m.id,
            name: ps.name || m.title,
            format: String(ps.format || m.format || 'MD').toUpperCase(),
            sourceSkillName: ps.sourceSkillName || m.sourceSkillName,
            createdAt: ps.createdAt || m.meta,
            status: rowStatus,
            analysisMarkdown: m.analysisMarkdown || ps.analysisMarkdown,
            analysisCsvData: m.analysisCsvData || ps.analysisCsvData || '',
            analysisMarkdownEditedBy: ps.analysisMarkdownEditedBy,
            analysisMarkdownEditedAt: ps.analysisMarkdownEditedAt,
          };
        },
        workbenchAnalysisDialogueSourceLine() {
          return this.workbenchAnalysisDialogueSourceLineFromRecord(this.workbenchSelectedAnalysisResultRow);
        },
        selectedMaterialDetail() {
          if (!this.selectedMaterial) return null;
          return this.selectedMaterial;
        },
        sourceMaterialCount() { return this.selectedMaterial?.sourceMaterialIds?.length ?? 0; },
        detailExcerpts() {
          if (!this.selectedMaterialDetail) return [];
          const m = this.selectedMaterial;
          if (m && (m.type === 'analysis' || m.type === 'report') && m.excerptsWithCitations) return m.excerptsWithCitations.map(x => x.text);
          return this.selectedMaterialDetail.excerpts || [];
        },
        checkedMaterialCount() { return this.materials.filter(m => m.checked).length; },
        workbenchMaterialSelectOptions() {
          const folders = this.workbenchMaterialFoldersList || [];
          return (this.materials || [])
            .filter((m) => m && (m.type === 'raw' || m.type === undefined))
            .map((m) => {
              const row = m.projectSource || {};
              const prefix = wbMatMaterialPathPrefixForRow(row, folders);
              const title = m.title || m.id;
              return { value: String(m.id), label: prefix ? `${prefix}${title}` : title };
            });
        },
        /** @ 引用菜单：资料 */
        chatAtMenuRawMaterials() {
          return (this.materials || []).filter((m) => m && (m.type === 'raw' || m.type === undefined));
        },
        /** @ 引用菜单：结果 */
        chatAtMenuResultMaterials() {
          return (this.materials || []).filter((m) => m && (m.type === 'analysis' || m.type === 'report'));
        },
        chatAtMenuHasAnythingToRef() {
          return this.chatAtMenuRawMaterials.length > 0 || this.chatAtMenuResultMaterials.length > 0;
        },
        chatAtMenuRailCategories() {
          return [
            { key: 'raw', label: '资料' },
            { key: 'result', label: '结果' },
          ];
        },
        chatAtSubmenuTitle() {
          const k = this.chatInputAtRail;
          if (k === 'raw') return '资料';
          if (k === 'result') return '结果';
          return '';
        },
        chatAtMenuRawMaterialsFiltered() {
          const q = (this.chatTriggerFilter || '').trim().toLowerCase();
          const list = this.chatAtMenuRawMaterials;
          if (!q) return list;
          return list.filter((m) => {
            const t = String(m.title != null ? m.title : m.name != null ? m.name : '').toLowerCase();
            const disp = String(this.chatAtRawMaterialDisplayTitle(m) || '').toLowerCase();
            return t.includes(q) || disp.includes(q);
          });
        },
        chatAtMenuResultMaterialsFiltered() {
          const q = (this.chatTriggerFilter || '').trim().toLowerCase();
          const list = this.chatAtMenuResultMaterials;
          if (!q) return list;
          return list.filter((m) => {
            const t = String(m.title != null ? m.title : m.name != null ? m.name : '').toLowerCase();
            return t.includes(q);
          });
        },
        chatSlashMenuSectionsFiltered() {
          const q = (this.chatTriggerFilter || '').trim().toLowerCase();
          return (this.workbenchTemplateTreeSections || [])
            .map((sec) => ({
              key: sec.key,
              label: sec.label,
              children: (sec.children || []).filter((node) => {
                if (!q) return true;
                const name = String(node.raw && node.raw.name != null ? node.raw.name : '未命名').toLowerCase();
                return name.includes(q);
              }),
            }))
            .filter((sec) => sec.children.length > 0);
        },
        chatSlashMenuHasAnyItem() {
          return this.chatSlashMenuSectionsFiltered.some((s) => (s.children || []).length > 0);
        },
        chatTriggerFilterTrimmed() {
          return (this.chatTriggerFilter || '').trim();
        },
        /** @ 后有关键字时：合并展示匹配的资料 + 结果 */
        chatAtUnifiedMatchRows() {
          if (!this.chatTriggerFilterTrimmed) return [];
          const rows = [];
          this.chatAtMenuRawMaterialsFiltered.forEach((m) => {
            rows.push({ kind: 'raw', m });
          });
          this.chatAtMenuResultMaterialsFiltered.forEach((m) => {
            rows.push({ kind: 'result', m });
          });
          return rows;
        },
        materialsForList() {
          const q = (this.materialSearchQuery || '').trim().toLowerCase();
          const rank = (m) => (m.type === 'raw' || m.type === undefined ? 0 : 1);
          const list = this.materials.filter((m) => {
            if (!q) return true;
            const inTitle = (m.title || '').toLowerCase().includes(q);
            return inTitle;
          });
          const rawRows = list.filter((m) => m.type === 'raw' || m.type === undefined);
          const analysisRows = list.filter((m) => m.type === 'analysis');
          return [...this.filteredWorkbenchRawMaterials(rawRows), ...analysisRows].sort((a, b) => rank(a) - rank(b));
        },
        workbenchAnalysisListSource() {
          return (this.materialsForList || []).filter((m) => m && m.type === 'analysis');
        },
        materialTreeSections() {
          const rawMaterials = this.workbenchRawMaterialsForTree;
          const analysisMaterials = this.materialsForList.filter((m) => m.type === 'analysis');
          const materialNodes = rawMaterials.map((m) => ({ source: 'material', id: m.id, raw: m }));
          const analysisNodes = analysisMaterials.map((m) => ({ source: 'material', id: m.id, raw: m }));
          return [
            { key: 'material', label: '资料', children: materialNodes },
            { key: 'analysis', label: '结果', children: analysisNodes }
          ];
        },
        workbenchLeftTreeSections() {
          return (this.materialTreeSections || []).filter((s) => s.key === 'material');
        },
        workbenchRawMaterialQueuedList() {
          void this.workbenchDemoRefreshTick;
          return (this.materials || []).filter((m) => (m.type === 'raw' || m.type === undefined) && this.workbenchMaterialStatusOf(m) === 'queued');
        },
        workbenchUploadSessionItems() {
          void this.workbenchDemoRefreshTick;
          const pid = String(this.workbenchProjectId || '');
          if (!pid) return [];
          const rows = (this.wbUploadMaterialSessionByProjectId || {})[pid];
          return Array.isArray(rows) ? rows : [];
        },
        workbenchUploadSessionSelectedKeys() {
          const pid = String(this.workbenchProjectId || '');
          if (!pid) return [];
          const rows = (this.wbUploadMaterialSelectionByProjectId || {})[pid];
          return Array.isArray(rows) ? rows : [];
        },
        workbenchUploadSessionPendingList() {
          return (this.workbenchUploadSessionItems || []).filter((item) => String(item.status || '') === 'pending');
        },
        workbenchUploadSessionUploadingList() {
          return (this.workbenchUploadSessionItems || []).filter((item) => String(item.status || '') === 'uploading');
        },
        workbenchUploadSessionFailedList() {
          return (this.workbenchUploadSessionItems || []).filter((item) => String(item.status || '') === 'failed');
        },
        workbenchUploadingMaterialCount() {
          return (this.workbenchUploadSessionUploadingList || []).length;
        },
        workbenchHasUploadingMaterials() {
          return this.workbenchUploadingMaterialCount > 0;
        },
        workbenchHasUploadSessionItems() {
          return (this.workbenchUploadSessionItems || []).length > 0;
        },
        workbenchUploadSessionPendingCount() {
          return (this.workbenchUploadSessionPendingList || []).length;
        },
        workbenchUploadSessionHasStartedUpload() {
          return (this.workbenchUploadSessionItems || []).some((item) => {
            const st = String((item && item.status) || '');
            return st === 'uploading' || st === 'done' || st === 'failed';
          });
        },
        workbenchUploadSubmitButtonLabel() {
          const count = this.workbenchUploadSessionPendingCount;
          if (!count) return '';
          const prefix = this.workbenchUploadSessionHasStartedUpload ? '追加上传' : '开始上传';
          return `${prefix}（${count}）`;
        },
        workbenchUploadSessionFailedCount() {
          return (this.workbenchUploadSessionFailedList || []).length;
        },
        workbenchRawMaterialParsingList() {
          void this.workbenchDemoRefreshTick;
          return (this.materials || []).filter((m) => (m.type === 'raw' || m.type === undefined) && this.workbenchMaterialStatusOf(m) === 'parsing');
        },
        workbenchRawMaterialFailedList() {
          void this.workbenchDemoRefreshTick;
          return (this.materials || []).filter((m) => (m.type === 'raw' || m.type === undefined) && this.workbenchMaterialStatusOf(m) === 'failed');
        },
        workbenchRawMaterialStatusSummary() {
          return {
            queued: (this.workbenchRawMaterialQueuedList || []).length,
            parsing: (this.workbenchRawMaterialParsingList || []).length,
            failed: (this.workbenchRawMaterialFailedList || []).length,
          };
        },
        /** 资料存在排队/解析中时在状态条边框展示主色流光（非仅失败态） */
        workbenchRawMaterialFlowBorderActive() {
          const s = this.workbenchRawMaterialStatusSummary || {};
          return (Number(s.queued) || 0) + (Number(s.parsing) || 0) > 0;
        },
        workbenchShouldShowMaterialStatusFooter() {
          const s = this.workbenchRawMaterialStatusSummary || {};
          return Number(s.queued || 0) > 0 || Number(s.parsing || 0) > 0 || Number(s.failed || 0) > 0;
        },
        /** 左栏资源抽屉标题：资源名（数量） */
        workbenchResourceDrawerCounts() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          let fileCount = 0;
          if (pid && typeof demoProjectMaterialsById !== 'undefined') {
            fileCount = (demoProjectMaterialsById[pid] || []).filter((m) => ['queued', 'parsing', 'failed', 'done'].includes(String((m && m.status) || ''))).length;
          } else {
            fileCount = (this.materials || []).filter((m) => m && (m.type === 'raw' || m.type === undefined) && ['queued', 'parsing', 'failed', 'done'].includes(this.workbenchMaterialStatusOf(m))).length;
          }
          return {
            file: fileCount,
            database: (this.dbResourceList || []).length,
            graph: (this.graphResourceList || []).length,
            knowledge: (this.knowledgeResourceList || []).length,
          };
        },
        workbenchResourcePanelEmpty() {
          const hasRawFiles = (this.materials || []).some((m) => m && (m.type === 'raw' || m.type === undefined));
          return !hasRawFiles &&
            !(this.dbResourceList || []).length &&
            !(this.graphResourceList || []).length &&
            !(this.knowledgeResourceList || []).length;
        },
        workbenchMaterialBatchTargets() {
          const view = this.workbenchMaterialStatusView || 'all';
          if (view !== 'queued' && view !== 'parsing' && view !== 'failed') return [];
          return (this.workbenchRawMaterialsForTree || []).filter((m) => this.workbenchMaterialStatusOf(m) === view);
        },
        workbenchMaterialBatchTargetCount() {
          return (this.workbenchMaterialBatchTargets || []).length;
        },
        workbenchRawMaterialsForTree() {
          void this.workbenchDemoRefreshTick;
          const rows = (this.materialsForList || []).filter((m) => m.type === 'raw' || m.type === undefined);
          const view = this.workbenchMaterialStatusView || 'all';
          if (view === 'queued' || view === 'parsing' || view === 'failed') {
            return rows.filter((m) => this.workbenchMaterialStatusOf(m) === view);
          }
          return rows.filter((m) => ['queued', 'parsing', 'failed', 'done'].includes(this.workbenchMaterialStatusOf(m)));
        },
        workbenchMaterialFoldersList() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialFoldersById === 'undefined') return [];
          return Array.isArray(demoProjectMaterialFoldersById[pid]) ? demoProjectMaterialFoldersById[pid] : [];
        },
        workbenchDoneProjectRowsForFileTree() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') return [];
          const rows = demoProjectMaterialsById[pid] || [];
          return rows.filter((r) => String(r.status || '') === 'done');
        },
        workbenchProjectRowsForFileTree() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') return [];
          return (demoProjectMaterialsById[pid] || []).filter((row) => ['queued', 'parsing', 'failed', 'done'].includes(String((row && row.status) || '')));
        },
        workbenchMaterialFileTreePayload() {
          void this.workbenchDemoRefreshTick;
          return buildWorkbenchMaterialAntTreeData({
            folders: this.workbenchMaterialFoldersList,
            materialProjectRows: this.workbenchProjectRowsForFileTree,
            includeStatuses: ['queued', 'parsing', 'done', 'failed'],
            searchQuery: this.materialSearchQuery || '',
          });
        },
        workbenchMaterialFileTreeData() {
          return (this.workbenchMaterialFileTreePayload || {}).treeData || [];
        },
        workbenchMaterialFileTreeAutoExpandKeys() {
          return (this.workbenchMaterialFileTreePayload || {}).autoExpandKeys || [];
        },
        workbenchAnalysisResultFoldersList() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectAnalysisResultFoldersById === 'undefined') return [];
          return Array.isArray(demoProjectAnalysisResultFoldersById[pid]) ? demoProjectAnalysisResultFoldersById[pid] : [];
        },
        workbenchFileTreeSelectedKeys() {
          const st = this.selectedTreeNode;
          if (st && st.source === 'material' && st.id) {
            const m = (this.materials || []).find((x) => String(x.id) === String(st.id));
            if (m && this.workbenchMaterialStatusOf(m) === 'done') return [wbMatAntTreeKey('raw', st.id)];
          }
          return [];
        },
        workbenchAnalysisQueuedList() {
          return (this.materials || []).filter((m) => m && m.type === 'analysis' && this.workbenchAnalysisStatusOf(m) === 'queued');
        },
        workbenchAnalysisParsingList() {
          return (this.materials || []).filter((m) => m && m.type === 'analysis' && this.workbenchAnalysisStatusOf(m) === 'parsing');
        },
        workbenchAnalysisFailedList() {
          return (this.materials || []).filter((m) => m && m.type === 'analysis' && this.workbenchAnalysisStatusOf(m) === 'failed');
        },
        workbenchAnalysisTaskListSource() {
          const created = this.workbenchCreatedTasks || [];
          const idSet = new Set(created.map((x) => x && x.id).filter(Boolean));
          const demo = (this.workbenchTaskDemoRows || []).filter((x) => x && !idSet.has(x.id));
          return [...created, ...demo];
        },
        workbenchAnalysisStatusSummary() {
          return {
            queued: (this.workbenchAnalysisQueuedList || []).length,
            parsing: (this.workbenchAnalysisParsingList || []).length,
            failed: (this.workbenchAnalysisFailedList || []).length,
          };
        },
        workbenchTaskTreeSections() {
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const list = [...(this.workbenchAnalysisTaskListSource || [])].filter((m) => m && m.taskType !== 'batch-child');
          const createdAtMsOf = (m) => {
            if (!m || typeof m !== 'object') return 0;
            const ps = m.projectSource || {};
            const raw = String(ps.createdAt || m.meta || m.createdAt || '').trim();
            if (!raw) return 0;
            const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
            const t = Date.parse(normalized);
            return Number.isNaN(t) ? 0 : t;
          };
          list.sort((a, b) => {
            const diff = createdAtMsOf(b) - createdAtMsOf(a);
            if (diff !== 0) return diff;
            return collator.compare(String(a.title || ''), String(b.title || ''));
          });
          const taskNodes = list.map((m) => ({ source: 'material', id: m.id, raw: m }));
          return [{ key: 'analysis', treeScope: 'task', label: '任务', children: taskNodes }];
        },
        /** 与右侧结果树中与任务同名的文件夹一一对应：仅「已完成」任务，顺序与左侧任务列表一致 */
        workbenchCompletedTasksForResultTree() {
          const sec = (this.workbenchTaskTreeSections || []).find((s) => s.key === 'analysis');
          const nodes = (sec && sec.children) || [];
          return nodes
            .filter((node) => {
              if (!node || !node.raw) return false;
              if (this.workbenchAnalysisStatusOf(node.raw) !== 'done') return false;
              return !(this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(node.raw));
            })
            .map((node) => ({
              id: node.id,
              folderTitle: String((node.raw.projectSource && node.raw.projectSource.name) || node.raw.title || '未命名任务').trim() || '未命名任务',
            }));
        },
        /** 右侧「结果」分栏：仅已完成项；排序交给结果树构建函数统一处理 */
        workbenchDoneSortedAnalysisMaterialsForResultPanel() {
          let list = [...(this.workbenchAnalysisListSource || [])];
          const q = String(this.workbenchAnalysisSearchQuery || '').trim().toLowerCase();
          if (q) {
            const rfList = this.workbenchAnalysisResultFoldersList || [];
            list = list.filter((m) => {
              const title = String(m.title || '').toLowerCase();
              const ps = m.projectSource || {};
              const skill = String(ps.sourceSkillName || '').toLowerCase();
              const taskName = String(ps.sourceTaskName || ps.taskName || '').toLowerCase();
              const dlg = ps.resultTreeBucket === 'dialog';
              if (dlg && ['对话', '会话', '助手'].some((kw) => q.includes(kw))) return true;
              const rfd = ps.resultFolderId;
              if (rfd) {
                const fold = rfList.find((f) => String(f.id) === String(rfd));
                if (fold && String(fold.name || '').toLowerCase().includes(q)) return true;
              }
              return title.includes(q) || skill.includes(q) || taskName.includes(q);
            });
          }
          list = list.filter((m) => this.workbenchAnalysisStatusOf(m) === 'done');
          return list;
        },
        workbenchAnalysisResultPanelCount() {
          return (this.workbenchDoneSortedAnalysisMaterialsForResultPanel || []).length;
        },
        workbenchAnalysisResultPanelHasContent() {
          const hasDoneResult = (this.workbenchAnalysisListSource || [])
            .some((m) => this.workbenchAnalysisStatusOf(m) === 'done');
          return hasDoneResult || !!(this.workbenchAnalysisResultFoldersList || []).length;
        },
        workbenchAnalysisResultSortOptions() {
          return [
            { key: 'name', label: '按名称排序' },
            { key: 'created_desc', label: '最新在前' },
            { key: 'created_asc', label: '最早在前' },
          ];
        },
        workbenchAnalysisResultSortLabel() {
          const cur = String(this.workbenchAnalysisResultSortMode || 'name');
          const hit = (this.workbenchAnalysisResultSortOptions || []).find((item) => item.key === cur);
          return hit ? hit.label : '按名称排序';
        },
        workbenchAnalysisResultAntTreePayload() {
          void this.workbenchDemoRefreshTick;
          const list = this.workbenchDoneSortedAnalysisMaterialsForResultPanel || [];
          return buildWorkbenchAnalysisResultAntTreeData({
            materials: list,
            searchQuery: this.workbenchAnalysisSearchQuery || '',
            resultFolders: this.workbenchAnalysisResultFoldersList || [],
            sortMode: this.workbenchAnalysisResultSortMode || 'name',
          });
        },
        workbenchAnalysisResultAntTreeData() {
          return (this.workbenchAnalysisResultAntTreePayload || {}).treeData || [];
        },
        workbenchAnalysisResultAntTreeAutoExpandKeys() {
          return (this.workbenchAnalysisResultAntTreePayload || {}).autoExpandKeys || [];
        },
        workbenchAnalysisResultAntTreeInitialExpandKeys() {
          return (this.workbenchAnalysisResultAntTreePayload || {}).initialExpandKeys || [];
        },
        filteredDatabaseResources() {
          const rows = this.dbResourceList || [];
          const q = String(this.dbResourceSearchQuery || '').trim().toLowerCase();
          if (!q) return rows;
          return rows.filter((row) => {
            const tn = String(row.tableName || row.name || '').toLowerCase();
            const dn = String(row.databaseName || '').toLowerCase();
            const src = String(row.source || '').toLowerCase();
            const cm = String(row.comment || '').toLowerCase();
            return tn.includes(q) || dn.includes(q) || src.includes(q) || cm.includes(q);
          });
        },
        /** 按 databaseId 分组，组内仅渲染表行（组头展示库名）；组与表名均按 zh-CN 排序 */
        filteredDatabaseResourceGroups() {
          const rows = this.filteredDatabaseResources || [];
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const byId = new Map();
          rows.forEach((row) => {
            const k = String(row.databaseId || '').trim() || `name:${String(row.databaseName || '').trim() || 'unknown'}`;
            if (!byId.has(k)) {
              byId.set(k, {
                databaseId: k,
                databaseName: row.databaseName || '',
                source: row.source || '',
                tables: [],
              });
            }
            byId.get(k).tables.push(row);
          });
          const groups = Array.from(byId.values());
          groups.forEach((g) => {
            g.tables.sort((a, b) => collator.compare(String(a.tableName || a.name || ''), String(b.tableName || b.name || '')));
          });
          groups.sort((a, b) => collator.compare(String(a.databaseName || ''), String(b.databaseName || '')));
          return groups;
        },
        wbDbAddCatalogOptions() {
          return (this.dbCatalogs || []).map((c) => {
            const en = String(c.nameEn != null ? c.nameEn : c.code != null ? c.code : '').trim();
            const zh = String(c.name || '—').trim() || '—';
            const left = en || String(c.id || '').trim() || zh;
            return { label: `${left}（${zh}）`, value: c.id };
          });
        },
        wbDbAddTableRows() {
          const cId = this.wbDbAddCatalogId;
          const c = (this.dbCatalogs || []).find((x) => x.id === cId);
          const tbls = c ? (c.tables || []) : [];
          return tbls.map((t) => ({
            value: t.name,
            name: t.name,
            comment: (t.comment && String(t.comment).trim()) ? String(t.comment) : '—',
            disabled: this.workbenchDbTableRowExists(cId, t.name),
          }));
        },
        wbDbAddTableRowsFiltered() {
          const rows = this.wbDbAddTableRows || [];
          const q = String(this.wbDbAddTableSearchQuery || '').trim().toLowerCase();
          if (!q) return rows;
          return rows.filter((r) => {
            const name = String(r.name || '').toLowerCase();
            const comment = String(r.comment || '').toLowerCase();
            return name.includes(q) || comment.includes(q);
          });
        },
        wbDbAddTableColumns() {
          return [
            { title: '表名', dataIndex: 'name', key: 'name', ellipsis: true, width: 200 },
            { title: '注释', dataIndex: 'comment', key: 'comment', ellipsis: true },
          ];
        },
        wbDbAddTableRowSelection() {
          return {
            selectedRowKeys: this.wbDbAddSelectedTableNames,
            columnWidth: 40,
            onChange: this.onWbDbAddTableRowSelectionChange,
            getCheckboxProps: this.wbDbAddTableGetCheckboxProps,
          };
        },
        wbDbAddTableLocale() {
          const rows = this.wbDbAddTableRows || [];
          const filtered = this.wbDbAddTableRowsFiltered || [];
          const q = String(this.wbDbAddTableSearchQuery || '').trim();
          let emptyText = '暂无数据';
          if (!rows.length) emptyText = '该库下暂无可选表';
          else if (!filtered.length && q) emptyText = '无匹配的表';
          return { emptyText };
        },
        wbGraphAddCatalogCards() {
          const exists = new Set((this.graphResourceList || []).map((g) => String(g.id)));
          return (this.graphCatalogs || []).map((g) => ({
            ...g,
            disabled: exists.has(String(g.id)),
          }));
        },
        wbGraphDetailBasicMetaRows() {
          const r = this.wbGraphDetailRecord;
          if (!r) return [];
          return [
            { label: '图谱名称', value: String(r.name || '').trim() || '—' },
            { label: '描述', value: String(r.description || '').trim() || '—' },
            { label: '节点数量', value: `${Number(r.entityCount || 0)} 个` },
            { label: '边数量', value: `${Number(r.edgeCount || 0)} 条` },
            { label: '来源', value: String(r.source || '').trim() || '—' },
            { label: '更新时间', value: String(r.updatedAt || '').trim() || '—' },
          ];
        },
        submitWorkbenchGraphAddDisabled() {
          return !(this.wbGraphAddSelectedIds && this.wbGraphAddSelectedIds.length);
        },
        submitWorkbenchDbAddTablesDisabled() {
          const id = this.wbDbAddCatalogId;
          if (id === undefined || id === null || id === '') return true;
          return !(this.wbDbAddSelectedTableNames && this.wbDbAddSelectedTableNames.length);
        },
        filteredGraphResources() {
          const q = String(this.graphResourceSearchQuery || '').trim().toLowerCase();
          if (!q) return this.graphResourceList || [];
          return (this.graphResourceList || []).filter((g) => String(g.name || '').toLowerCase().includes(q) || String(g.source || '').toLowerCase().includes(q));
        },
        poolTabMaterialCount() {
          return (this.materials || []).filter((m) => m && (m.type === 'raw' || m.type === undefined)).length;
        },
        poolTabAnalysisCount() {
          const list = this.workbenchDoneSortedAnalysisMaterialsForResultPanel || [];
          return list.length;
        },
        poolTabAnalysisTaskCount() {
          const sec = (this.workbenchTaskTreeSections || []).find((s) => s.key === 'analysis');
          return sec ? sec.children.length : 0;
        },
        allMaterialsChecked() { return this.materials.length > 0 && this.materials.every(m => m.checked); },
        selectedExtractionResult() {
          if (!this.selectedExtractionId) return null;
          return this.extractionResults.find(r => r.id === this.selectedExtractionId) || null;
        },
        effectiveSourcesWidth() {
          if (this.sourcesLeftView === 'detail') return this.sourcesDetailWidth;
          return this.sourcesWidth;
        },
        currentRightSplitTaskPct() {
          const raw = this.wbTaskListView === 'batch-children'
            ? this.rightSplitBatchTaskPct
            : this.rightSplitTaskPct;
          const pct = Number(raw);
          if (!Number.isFinite(pct)) return this.wbTaskListView === 'batch-children' ? 66.666 : 25;
          return Math.min(80, Math.max(20, pct));
        },
        rightSplitTaskSectionStyle() {
          return {
            flex: `0 0 ${this.currentRightSplitTaskPct}%`,
            minHeight: '120px',
          };
        },
        rightSplitResultSectionStyle() {
          return {
            flex: '1 1 0%',
            minHeight: '120px',
          };
        },
        layoutRatios() {
          const leftDetail = this.sourcesLeftView === 'detail' && !this.sourcesCollapsed;
          const rightDetail = this.sourcesRightView === 'detail' && !this.studioCollapsed;

          if (!leftDetail && !rightDetail) return { left: 2.5, middle: 5, right: 2.5 };
          if (leftDetail && !rightDetail) return { left: 4, middle: 4, right: 2 };
          if (!leftDetail && rightDetail) return { left: 2, middle: 4, right: 4 };

          if (this.lastDetailFocus === 'right') return { left: 2, middle: 4, right: 4 };
          return { left: 4, middle: 4, right: 2 };
        },
        /** 左栏轨 flex：稿面资源面板宽约 300，比例由 layoutRatios.left 与中间栏共同分配 */
        leftWorkbenchRailStyle() {
          if (this.sourcesCollapsed) return { flex: '0 0 0px', minWidth: 0 };
          const w = Number(this.effectiveSourcesWidth) || 300;
          const min = this.sourcesLeftView === 'detail' ? 350 : 200;
          const max = this.sourcesLeftView === 'detail' ? 600 : 500;
          const width = Math.min(max, Math.max(min, w));
          return { flex: `0 0 ${width}px`, width: `${width}px`, minWidth: `${min}px`, maxWidth: `${max}px` };
        },
        rightWorkbenchRailStyle() {
          if (this.studioCollapsed) return { flex: '0 0 0px' };
          if (this.workbenchEmbedMode === 'v2' && this.sourcesRightView === 'detail') {
            return { flex: '1 1 auto', width: '100%', minWidth: '0px', maxWidth: 'none', height: '100%' };
          }
          const min = this.sourcesRightView === 'detail' ? 500 : 240;
          const width = Math.min(500, Math.max(min, Number(this.studioWidth) || 340));
          return { flex: `0 0 ${width}px`, width: `${width}px`, minWidth: '240px', maxWidth: '500px' };
        },
        workbenchV2RightDrawerStyle() {
          if (this.workbenchEmbedMode === 'v2') {
            if (!this.workbenchV2RightPanel) {
              return { flex: '0 0 0px', width: '0px', minWidth: 0, maxWidth: 0, overflow: 'hidden' };
            }
            return {
              flex: '1 1 auto',
              width: '100%',
              minWidth: 0,
              maxWidth: 'none',
              minHeight: 0,
              height: '100%',
            };
          }
          if (this.workbenchV2RightDrawerCollapsed || !this.workbenchV2RightPanel) {
            return { flex: '0 0 0px', width: '0px', minWidth: 0, maxWidth: 0, overflow: 'hidden' };
          }
          const min = 240;
          const width = Math.min(500, Math.max(min, Number(this.studioWidth) || 340));
          return {
            flex: `0 0 ${width}px`,
            width: `${width}px`,
            minWidth: `${min}px`,
            maxWidth: '500px',
            minHeight: 0,
            height: '100%',
          };
        },
        fullscreenMaterial() { return this.materials.find(m => m.id === this.fullscreenMaterialId) || null; },
        fullscreenSourceMaterials() {
          if (!this.fullscreenMaterial || !this.fullscreenMaterial.sourceMaterialIds) return [];
          return this.fullscreenMaterial.sourceMaterialIds.map(id => this.materials.find(m => m.id === id)).filter(Boolean);
        },
        fullscreenSelectedSource() {
          if (!this.fullscreenSelectedSourceId) return null;
          return this.materials.find(m => m.id === this.fullscreenSelectedSourceId) || null;
        },
        workbenchPageHeadTitle() {
          if (!this.workbenchProjectId) return '审计助手';
          const named = WORKBENCH_PROJECT_NAME_BY_ID[this.workbenchProjectId];
          if (named) return named;
          try {
            const raw = sessionStorage.getItem('pendingNewProject');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.id === this.workbenchProjectId && parsed.name) return String(parsed.name);
            }
          } catch (_) {}
          return '工作台 ' + this.workbenchProjectId;
        },
        workbenchProjectTemplates() {
          void this.workbenchDemoRefreshTick;
          const pid = this.workbenchProjectId;
          if (!pid) return [];
          return demoProjectAnalysisTemplatesById[pid] || [];
        },
        workbenchProjectTemplateCount() {
          return (this.workbenchProjectTemplates || []).length;
        },
        workbenchTemplateTreeSections() {
          const q = String(this.wbSkillSidebarSearchKeyword || '').trim().toLowerCase();
          let project = (this.workbenchProjectTemplates || []).filter((tpl) => {
            if (this.isWbProjectSkillSummarizing(tpl)) return false;
            if (q) {
              const name = String(tpl.name || '').toLowerCase();
              const tags = Array.isArray(tpl.tags) ? tpl.tags.map((t) => String(t || '').toLowerCase()) : [];
              if (!name.includes(q) && !tags.some((t) => t.includes(q))) return false;
            }
            return true;
          });
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const byName = (a, b) => collator.compare(String(a.name || ''), String(b.name || ''));
          project = [...project].sort((a, b) => byName(a, b));
          const mapNode = (tpl, scope) => ({
            source: 'template',
            id: tpl.id,
            key: `${scope}:${tpl.id}`,
            scope,
            raw: tpl,
          });
          return [
            { key: 'project', label: '技能', children: project.map((tpl) => mapNode(tpl, 'project')) },
          ];
        },
        workbenchTemplateTotalCount() {
          return (this.workbenchTemplateTreeSections || []).reduce((sum, sec) => sum + ((sec.children || []).length), 0);
        },
        wbTaskCreateSkillOptions() {
          return (this.workbenchProjectTemplates || [])
            .filter((tpl) => !this.isWbProjectSkillSummarizing(tpl))
            .map((tpl) => ({ label: tpl.name || '未命名技能', value: String(tpl.id) }));
        },
        wbTaskCreateResourceTypeLabel() {
          return {
            file: '文件',
            'file-folder': '文件夹',
            result: '结果',
            'result-folder': '结果文件夹',
            database: '数据库表',
            graph: '知识图谱',
            knowledge: '知识库',
          };
        },
        wbTaskCreateResourceRows() {
          const folders = this.workbenchMaterialFoldersList || [];
          const fileRows = (this.materials || [])
            .filter((m) => (m.type === 'raw' || m.type === undefined))
            .map((m) => {
              const row = m.projectSource || {};
              const prefix = wbMatMaterialPathPrefixForRow(row, folders);
              const base = String(m.title || '未命名文件');
              return {
                key: `file:${m.id}`,
                type: 'file',
                typeLabel: '文件',
                id: String(m.id),
                name: prefix ? `${prefix}${base}` : base,
                iconClass: this.getMaterialIcon({ ...m, type: 'raw' }),
                iconToneClass: this.getMaterialIconColorClass(m),
              };
            });
          const dbRows = (this.dbResourceList || []).map((row) => ({
            key: `database:${row.id}`,
            type: 'database',
            typeLabel: '数据库表',
            id: String(row.id),
            name: String(row.tableName || row.name || '未命名数据库资源'),
            tableName: String(row.tableName || row.name || ''),
            databaseId: String(row.databaseId || ''),
            databaseName: String(row.databaseName || ''),
            comment: String(row.comment || ''),
            source: String(row.source || ''),
            iconClass: 'table',
            iconToneClass: 'is-data',
          }));
          const graphRows = (this.graphResourceList || []).map((row) => ({
            key: `graph:${row.id}`,
            type: 'graph',
            typeLabel: '知识图谱',
            id: String(row.id),
            name: String(row.name || '未命名图谱'),
            iconClass: 'map-draw',
            iconToneClass: 'is-data',
          }));
          return { file: fileRows, result: [], database: dbRows, graph: graphRows, knowledge: [] };
        },
        wbTaskCreateResourceTypeCount() {
          const rows = this.wbTaskCreateResourceRows || { file: [], result: [], database: [], graph: [], knowledge: [] };
          return {
            file: (rows.file || []).length,
            result: (rows.result || []).length,
            database: (rows.database || []).length,
            graph: (rows.graph || []).length,
            knowledge: (rows.knowledge || []).length,
          };
        },
        wbTaskCreateAvailableResources() {
          const tab = this.wbTaskCreateForm.resourceTab || 'file';
          const q = String(this.wbTaskCreateForm.resourceQuery || '').trim().toLowerCase();
          const rows = (this.wbTaskCreateResourceRows && this.wbTaskCreateResourceRows[tab]) || [];
          return rows.filter((item) => {
            if (!q) return true;
            if (tab === 'database') {
              const tn = String(item.tableName || item.name || '').toLowerCase();
              const dn = String(item.databaseName || '').toLowerCase();
              const src = String(item.source || '').toLowerCase();
              const cm = String(item.comment || '').toLowerCase();
              return tn.includes(q) || dn.includes(q) || src.includes(q) || cm.includes(q);
            }
            return String(item.name || '').toLowerCase().includes(q);
          });
        },
        wbTaskCreateVisibleResources() {
          return this.wbTaskCreateAvailableResources || [];
        },
        wbTaskCreateDatabaseResourceGroups() {
          const rows = this.wbTaskCreateAvailableResources || [];
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const byId = new Map();
          rows.forEach((row) => {
            const k = String(row.databaseId || '').trim() || `name:${String(row.databaseName || '').trim() || 'unknown'}`;
            if (!byId.has(k)) {
              byId.set(k, {
                databaseId: k,
                databaseName: row.databaseName || '',
                tables: [],
              });
            }
            byId.get(k).tables.push(row);
          });
          const groups = Array.from(byId.values());
          groups.forEach((g) => {
            g.tables.sort((a, b) => collator.compare(String(a.tableName || a.name || ''), String(b.tableName || b.name || '')));
          });
          groups.sort((a, b) => collator.compare(String(a.databaseName || ''), String(b.databaseName || '')));
          return groups;
        },
        wbTaskCreateIsTreeResourceTab() {
          const tab = String((this.wbTaskCreateForm && this.wbTaskCreateForm.resourceTab) || 'file');
          return tab === 'file' || tab === 'result';
        },
        wbTaskCreateFileTreePayload() {
          void this.workbenchDemoRefreshTick;
          return buildWorkbenchMaterialAntTreeData({
            folders: this.workbenchMaterialFoldersList,
            doneMaterialProjectRows: this.workbenchDoneProjectRowsForFileTree,
            searchQuery: (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceQuery) || '',
          });
        },
        wbTaskCreateFileTreeData() {
          return (this.wbTaskCreateFileTreePayload || {}).treeData || [];
        },
        wbTaskCreateFileTreeFolderKeys() {
          return collectTreeNodeKeys(this.wbTaskCreateFileTreeData, (node) => !!node.isFolder);
        },
        wbTaskCreateResultTreePayload() {
          void this.workbenchDemoRefreshTick;
          const list = [...(this.workbenchAnalysisListSource || [])]
            .filter((m) => this.workbenchAnalysisStatusOf(m) === 'done')
            .sort((a, b) => {
              const ta = Date.parse(String((a && (a.meta || (a.projectSource && a.projectSource.createdAt))) || '').replace(' ', 'T'));
              const tb = Date.parse(String((b && (b.meta || (b.projectSource && b.projectSource.createdAt))) || '').replace(' ', 'T'));
              const da = Number.isNaN(ta) ? 0 : ta;
              const db = Number.isNaN(tb) ? 0 : tb;
              return db - da || String((a && a.title) || '').localeCompare(String((b && b.title) || ''), 'zh-CN');
            });
          return buildWorkbenchAnalysisResultAntTreeData({
            materials: list,
            searchQuery: (this.wbTaskCreateForm && this.wbTaskCreateForm.resourceQuery) || '',
            resultFolders: this.workbenchAnalysisResultFoldersList || [],
          });
        },
        wbTaskCreateResultTreeData() {
          return (this.wbTaskCreateResultTreePayload || {}).treeData || [];
        },
        wbTaskCreateResultTreeFolderKeys() {
          return collectTreeNodeKeys(this.wbTaskCreateResultTreeData, (node) => !!node.isFolder);
        },
        wbTaskCreateCurrentSelectableResources() {
          if (this.wbTaskCreateIsTreeResourceTab) {
            return typeof this.collectWbTaskCreateCurrentTreeResources === 'function'
              ? this.collectWbTaskCreateCurrentTreeResources()
              : [];
          }
          return this.wbTaskCreateAvailableResources || [];
        },
        wbTaskCreateCurrentSelectedCount() {
          const keys = new Set((this.wbTaskCreateCurrentSelectableResources || []).map((item) => item && item.key).filter(Boolean));
          return (this.wbTaskCreateForm.selectedResources || []).filter((item) => item && keys.has(item.key)).length;
        },
        wbTaskCreateResultOutputTreeData() {
          void this.workbenchDemoRefreshTick;
          return buildWorkbenchAnalysisResultFolderPickerTree(this.workbenchAnalysisResultFoldersList || []);
        },
        wbTaskCreateSubmitDisabled() {
          const name = String(this.wbTaskCreateForm.taskName || '').trim();
          return !name || !this.wbTaskCreateForm.skillId || !(this.wbTaskCreateForm.selectedResources || []).length;
        },
        wbTaskCreateStep1NextDisabled() {
          const f = this.wbTaskCreateForm || {};
          const name = String(f.taskName || '').trim();
          if (!name || !f.skillId) return true;
          if (!String(f.resultOutputFolderId || '').trim()) return true;
          if (this.wbTaskCreateInstructionState !== 'ready') return true;
          if (!String(f.instruction || '').trim()) return true;
          if (f.taskType === 'batch') {
            if (!f.dataSourceFile || !this.wbTaskCreateBatchSelectedColumnCount) return true;
            if (f.subtaskNamingMode === 'custom' && !(f.subtaskNamingColumns || []).length) return true;
          }
          return false;
        },
        wbTaskCreateDataSourceColumnOptions() {
          if (!this.wbTaskCreateForm.dataSourceFile) return [];
          const preview = this.wbTaskCreateBatchPreviewSource;
          const cols = (preview && preview.columns) || [];
          return cols.map((c) => ({ label: c, value: c }));
        },
        wbTaskCreateBatchNamingColumns() {
          const f = this.wbTaskCreateForm || {};
          if (f.subtaskNamingMode === 'custom') return (f.subtaskNamingColumns || []).slice();
          return this.wbTaskCreateBatchIdColumns;
        },
        wbTaskCreateInstructionDisabled() {
          return this.wbTaskCreateInstructionState !== 'ready';
        },
        wbTaskCreateInstructionPlaceholder() {
          if (this.wbTaskCreateInstructionState === 'generating') return '';
          if (this.wbTaskCreateInstructionState === 'ready') return '可在此微调自动生成的任务指令';
          if (this.wbTaskCreateForm.taskType === 'batch') {
            return '请先选择技能、上传数据源并选择标识列';
          }
          return '请先选择技能';
        },
        wbTaskCreateBatchPreviewSource() {
          return (
            (typeof window !== 'undefined' && window.DEMO_BATCH_DATASOURCE_PREVIEW) ||
            (typeof DEMO_BATCH_DATASOURCE_PREVIEW !== 'undefined' ? DEMO_BATCH_DATASOURCE_PREVIEW : null)
          );
        },
        wbTaskCreatePreviewRowCount() {
          return 5;
        },
        wbTaskCreatePreviewScrollY() {
          return this.wbTaskCreatePreviewRowCount * 39;
        },
        wbTaskCreatePreviewColumns() {
          if (!this.wbTaskCreateForm.dataSourceFile) return [];
          const preview = this.wbTaskCreateBatchPreviewSource;
          const cols = (preview && preview.columns) || [];
          const idCols = this.wbTaskCreateBatchIdColumns;
          return cols.map((c) => ({
            title: c,
            dataIndex: c,
            key: c,
            ellipsis: true,
            customHeaderCell: () => ({
              class: idCols.includes(c) ? 'wb-preview-th--id' : '',
            }),
            customCell: () => ({
              class: idCols.includes(c) ? 'wb-preview-cell--id' : '',
            }),
          }));
        },
        wbTaskCreatePreviewRows() {
          if (!this.wbTaskCreateForm.dataSourceFile) return [];
          const preview = this.wbTaskCreateBatchPreviewSource;
          const cols = (preview && preview.columns) || [];
          const rows = (preview && preview.rows) || [];
          return rows.slice(0, this.wbTaskCreatePreviewRowCount).map((row, i) => {
            const o = { key: 'preview-' + i };
            cols.forEach((col, ci) => {
              o[col] = row[ci];
            });
            return o;
          });
        },
        wbTaskCreateBatchIdColumns() {
          const raw = (this.wbTaskCreateForm && this.wbTaskCreateForm.idColumns) || [];
          if (!Array.isArray(raw)) return [];
          return raw.map((c) => String(c || '').trim()).filter(Boolean);
        },
        wbTaskCreateBatchSelectedColumnCount() {
          return this.wbTaskCreateBatchIdColumns.length;
        },
        wbTaskCreateBatchEstimatedChildCount() {
          if (!this.wbTaskCreateForm.dataSourceFile) return 0;
          const idCols = this.wbTaskCreateBatchIdColumns;
          if (!idCols.length) return 0;
          const preview = this.wbTaskCreateBatchPreviewSource;
          if (!preview) return 0;
          const indices = idCols
            .map((col) => (preview.columns || []).indexOf(col))
            .filter((idx) => idx >= 0);
          if (!indices.length) return 0;
          const seen = new Set();
          (preview.rows || []).forEach((row) => {
            const parts = indices.map((idx) => String((row && row[idx]) || '').trim());
            if (parts.some((p) => p)) seen.add(parts.join('\u0001'));
          });
          return seen.size;
        },
        wbActiveBatchParentTask() {
          return this.findWorkbenchTaskById(this.wbActiveBatchParentId);
        },
        wbTaskListPanelTitle() {
          if (this.wbTaskListView === 'batch-children') {
            const parent = this.wbActiveBatchParentTask;
            const name = parent && String(parent.title || '').trim();
            return name || '子任务';
          }
          return '任务';
        },
        wbBatchChildStatusSummary() {
          const children = (this.wbActiveBatchParentTask && this.wbActiveBatchParentTask.children) || [];
          const sum = { queued: 0, parsing: 0, done: 0, failed: 0 };
          children.forEach((c) => {
            const st = this.workbenchAnalysisStatusOf(c);
            if (st === 'queued') sum.queued += 1;
            else if (st === 'parsing') sum.parsing += 1;
            else if (st === 'done') sum.done += 1;
            else if (st === 'failed') sum.failed += 1;
          });
          return sum;
        },
        filteredBatchChildren() {
          const children = (this.wbActiveBatchParentTask && this.wbActiveBatchParentTask.children) || [];
          const view = this.wbBatchChildStatusView || 'all';
          if (view === 'all') return children.slice();
          if (view === 'no-result') {
            return children.filter((c) => this.workbenchAnalysisStatusOf(c) === 'done' && !this.batchChildHasResultFile(c));
          }
          if (view === 'done') {
            return children.filter((c) => this.workbenchAnalysisStatusOf(c) === 'done' && this.batchChildHasResultFile(c));
          }
          return children.filter((c) => this.workbenchAnalysisStatusOf(c) === view);
        },
        wbBatchChildStatusSummary() {
          const children = (this.wbActiveBatchParentTask && this.wbActiveBatchParentTask.children) || [];
          const sum = { all: children.length, queued: 0, parsing: 0, done: 0, failed: 0, noResult: 0 };
          children.forEach((child) => {
            const st = this.workbenchAnalysisStatusOf(child);
            if (st === 'queued') sum.queued += 1;
            else if (st === 'parsing') sum.parsing += 1;
            else if (st === 'failed') sum.failed += 1;
            else if (st === 'done') {
              if (this.batchChildHasResultFile(child)) sum.done += 1;
              else sum.noResult += 1;
            }
          });
          return sum;
        },
        pagedBatchChildren() {
          const page = Math.max(1, Number(this.wbBatchChildPage) || 1);
          const size = Math.max(1, Number(this.wbBatchChildPageSize) || 1);
          const start = (page - 1) * size;
          return this.filteredBatchChildren.slice(start, start + size);
        },
        selectedMaterialIsBatchParentTask() {
          const m = this.selectedMaterial;
          return !!(m && m.taskType === 'batch');
        },
        selectedMaterialIsBatchChildTask() {
          const m = this.selectedMaterial;
          return !!(m && m.taskType === 'batch-child');
        },
        selectedMaterialIsPackageDownloadTask() {
          return this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(this.selectedMaterial);
        },
        wbSelectedTaskInstructionDisplay() {
          const m = this.selectedMaterial;
          const tc = (m && m.taskConfig) || {};
          const raw = String(tc.instruction || (m && m.batchMeta && m.batchMeta.instruction) || '').trim();
          return raw || '—';
        },
        workbenchAnalysisPreviewMarkdown() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return '';
          const fmt = String((m.projectSource && m.projectSource.format) || m.format || 'MD').toUpperCase();
          if (fmt === 'CSV') return '';
          if (m.analysisMarkdown) return m.analysisMarkdown;
          const ps = m.projectSource || {};
          const wbEphemeral = !!(this.workbenchCreatedTasks || []).find((t) => t && t.id === m.id);
          if (wbEphemeral) {
            const st = this.workbenchAnalysisStatusOf(m);
            if (st === 'queued') {
              return ['## 输出结果（任务）', '', '当前为 **排队中**。执行开始后将在此处展示可读输出摘要与结构化段落（演示）。', '', '> 基本信息页签可随时查看本次任务的配置（技能与关联资料）。'].join('\n');
            }
            if (st === 'parsing') {
              return ['## 输出结果（任务）', '', '当前为 **执行中**。', '', '- 系统将按任务详情中的资源配置逐项检索与分析；', '- 完成后本页将与「结果」侧栏条目展示形态对齐（演示）。'].join('\n');
            }
            if (st === 'failed') {
              return ['## 输出结果（任务）', '', '**本次执行失败（演示）。**', '', '可在任务列表中使用 **重跑** 发起新的执行尝试；若在排队/执行中选择 **中止**，也会回到可重试状态（演示口径）。'].join('\n');
            }
          }
          return buildAnalysisResultPreviewMarkdown({ name: m.title || ps.name, createdAt: m.meta || ps.createdAt });
        },
        workbenchAnalysisPreviewFormat() {
          const r = this.workbenchSelectedAnalysisResultRow || {};
          return String(r.format || 'MD').toUpperCase();
        },
        workbenchAnalysisPreviewIsCsv() {
          return this.workbenchAnalysisPreviewFormat === 'CSV';
        },
        workbenchAnalysisPreviewCsvTable() {
          const r = this.workbenchSelectedAnalysisResultRow || {};
          return parseCsvPreviewTable(r.analysisCsvData || '');
        },
        workbenchAnalysisPreviewExportFormats() {
          return this.workbenchAnalysisPreviewIsCsv ? ['csv'] : ['md', 'pdf', 'docx'];
        },
        workbenchAnalysisCitationMap() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return DEMO_ANALYSIS_CITATION_MAP;
          return m.citationMap || DEMO_ANALYSIS_CITATION_MAP;
        },
        workbenchAnalysisPreviewHtml() {
          const md = this.workbenchAnalysisPreviewMarkdown || '';
          const html = (window.marked && typeof window.marked.parse === 'function')
            ? window.marked.parse(md)
            : md.replace(/\n/g, '<br>');
          return html.replace(/\[(E\d+)\]/g, (_, k) => `<span class="analysis-inline-citation" aria-label="引用 ${this.analysisCitationDisplayIndex(k)}">（${this.analysisCitationDisplayIndex(k)}）</span>`);
        },
        workbenchAnalysisVersionMenuList() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return [];
          const list = (this.workbenchAnalysisVersionHistoryById || {})[m.id];
          return Array.isArray(list) ? list : [];
        },
        workbenchAnalysisVersionMgmtColumns() {
          return [
            { title: '生成时间', dataIndex: 'generatedAt', key: 'generatedAt', width: 156 },
            {
              title: '生成说明',
              dataIndex: 'generationDesc',
              key: 'generationDesc',
              ellipsis: true,
              className: 'skill-version-mgmt-col-desc',
            },
            { title: '操作', key: 'action', width: 128, align: 'left', className: 'skill-version-mgmt-col-action' },
          ];
        },
        workbenchAnalysisVersionCurrentRow() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return null;
          const ps = m.projectSource || {};
          const base = this.workbenchSelectedAnalysisResultRow || {};
          const rec = {
            ...ps,
            ...base,
            sourceSkillName: base.sourceSkillName || ps.sourceSkillName,
            sourceMaterialIds: Array.isArray(ps.sourceMaterialIds)
              ? ps.sourceMaterialIds
              : (Array.isArray(m.sourceMaterialIds) ? m.sourceMaterialIds : []),
          };
          const generatedAt = String(ps.analysisMarkdownEditedAt || m.meta || ps.createdAt || '').trim() || '—';
          const resolver = (mid) => this.workbenchAnalysisResolveMaterialNameById(mid);
          const generationDesc =
            typeof buildAnalysisResultGenerationDesc === 'function'
              ? buildAnalysisResultGenerationDesc(rec, resolver)
              : `使用技能「${String(rec.sourceSkillName || '关联技能')}」生成的结果（演示）。`;
          return {
            key: '_current',
            generatedAt,
            generationDesc,
            markdown: this.workbenchAnalysisPreviewMarkdown || '',
          };
        },
        workbenchAnalysisVersionHistoryOnlyRows() {
          const list = this.workbenchAnalysisVersionMenuList || [];
          return list.map((v) => {
            const raw = String(v.markdown || '');
            const gd = String(v.generationDesc || '').trim();
            const savedAt = String(v.savedAt || '').trim();
            const generationDesc = gd || (savedAt ? `历史快照 · ${savedAt}` : '历史快照');
            const generatedAt = savedAt || String(v.label || '').trim() || '—';
            return {
              key: v.key,
              generatedAt,
              generationDesc,
              markdown: raw,
            };
          });
        },
        workbenchAnalysisStatusLabel() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return '—';
          const st = (m.projectSource && m.projectSource.status) || m.status || 'done';
          const map = { queued: '排队中', parsing: '执行中', done: '成功', failed: '失败' };
          return map[st] || map.done;
        },
        workbenchAnalysisStatusChipClass() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return 'is-neutral';
          const st = (m.projectSource && m.projectSource.status) || m.status || 'done';
          return this.analysisStatusChipClass(st);
        },
        /** 工作台侧栏「原始文件」与工作台资料预览同源：文档页 / OCR 页由 demo-mock-data 拆分函数提供 */
        workbenchMaterialDocumentPages() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'raw' || !m.projectSource) return ['暂无内容'];
          return materialPreviewDocumentPagesFromRecord(m.projectSource);
        },
        workbenchMaterialOcrPagesList() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'raw' || !m.projectSource) return ['暂无 OCR 内容'];
          return materialPreviewOcrPagesFromRecord(m.projectSource);
        },
        workbenchMaterialOcrPagesDisplayed() {
          const pages = this.workbenchMaterialOcrPagesList;
          if (!this.materialPreviewOcrShowLineNumbers) return pages;
          return pages.map((p) => materialPreviewOcrPageWithLineNumbers(p, true));
        },
        v2ResourcePreviewTabDefs() {
          const r = this.selectedResourcePreview;
          if (!r || this.workbenchEmbedMode !== 'v2') return [];
          if (r.type === 'database') return [{ key: 'schema', label: '字段信息' }];
          return [{ key: 'topology', label: '本体建模' }];
        },
        v2ResourcePreviewTabCount() {
          return (this.v2ResourcePreviewTabDefs || []).length;
        },
        v2ResourcePreviewSingleTabLabel() {
          const tabs = this.v2ResourcePreviewTabDefs || [];
          return tabs.length === 1 ? tabs[0].label : '';
        },
        v2WbMaterialPreviewTabDefs() {
          if (!this.selectedMaterial || this.selectedMaterial.type !== 'raw' || !this.selectedMaterial.projectSource || !this.workbenchSelectedProjectMaterialRow) return [];
          return [
            { key: 'preview', label: '文件预览' },
            { key: 'ocr', label: '解析结果' },
          ];
        },
        v2WbMaterialPreviewTabCount() {
          return (this.v2WbMaterialPreviewTabDefs || []).length;
        },
        v2WbMaterialPreviewSingleTabLabel() {
          const tabs = this.v2WbMaterialPreviewTabDefs || [];
          return tabs.length === 1 ? tabs[0].label : '';
        },
        resourcePreviewBasicMetaRows() {
          const r = this.selectedResourcePreview;
          if (!r) return [];
          const databaseLabel = String(r.databaseName || '').trim();
          const tableLabel = String(r.tableName || r.name || '').trim();
          const rowCount = Number(r.rowCount);
          const rowCountLabel = String(r.rowCountLabel || '').trim()
            || (Number.isFinite(rowCount)
              ? (rowCount >= 10000 ? `${(rowCount / 10000).toFixed(rowCount % 10000 === 0 ? 0 : 1)} 万行` : `${rowCount.toLocaleString('zh-CN')} 行`)
              : '—');
          const rows = [
            { label: '资源类型', value: r.type === 'database' ? '数据库' : '数据图谱' },
            { label: '名称', value: r.type === 'database' && databaseLabel && tableLabel ? `${databaseLabel} / ${tableLabel}` : String(r.name || '').trim() || '—' },
          ];
          if (r.type === 'database') {
            rows.push({ label: '表注释', value: String(r.tableComment || r.comment || '').trim() || '—' });
            rows.push({ label: '数据量', value: rowCountLabel });
          }
          rows.push({ label: '来源', value: String(r.source || '').trim() || '—' });
          rows.push({ label: '更新时间', value: String(r.updatedAt || '').trim() || '—' });
          return rows;
        },
        workbenchMaterialPreviewBasicMetaRows() {
          const r = this.workbenchSelectedProjectMaterialRow;
          return this.materialBasicMetaRowsFromProjectSourceRow(r);
        },
        /** 与工作台结果预览 Modal 的 buildOverviewResultMeta 字段一致 */
        workbenchAnalysisResultBasicMetaRows() {
          return this.analysisResultBasicMetaRowsFromRecord(this.workbenchSelectedAnalysisResultRow);
        },
        /** 大结果预览弹窗 · 基本信息（与同物料在侧栏「结果」下字段一致） */
        wbAnalysisModalBasicMetaRows() {
          return this.analysisResultBasicMetaRowsFromRecord(this.wbAnalysisModalRecord);
        },
        /** 侧栏内嵌「基本信息」：任务仅四字段，结果沿用 workbenchAnalysisResultBasicMetaRows */
        workbenchEmbedBasicMetaRows() {
          if (!this.selectedMaterialIsWorkbenchCreatedTask) return this.workbenchAnalysisResultBasicMetaRows;
          const m = this.selectedMaterial;
          const ps = (m && m.projectSource) || {};
          const status = this.workbenchAnalysisStatusOf(m);
          const stLabel = this.analysisResultStatusLabel(status);
          const name = String(ps.name || (m && m.title) || '').trim() || '—';
          const created = String(ps.createdAt || '').trim() || '—';
          let completed = '—';
          if (status === 'done' || status === 'failed') {
            completed = String(ps.completedAt || ps.failedAt || ps.createdAt || '').trim() || '—';
          }
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(m)) {
            return [
              { label: '任务名称', value: name },
              { label: '任务类型', value: '打包下载' },
              { label: '状态', value: stLabel },
              { label: '创建时间', value: created },
              { label: '完成时间', value: completed },
            ];
          }
          return [
            { label: '任务名称', value: name },
            { label: '状态', value: stLabel },
            { label: '生成时间', value: created },
            { label: '完成时间', value: completed },
          ];
        },
        /** 任务详情 Tab：摘要模型（技能名等；资源列表用 workbenchTaskConfigResourcesList） */
        workbenchSelectedTaskConfigDagModel() {
          const m = this.selectedMaterial;
          if (!m || !m.taskConfig) return null;
          const tc = m.taskConfig || {};
          if (tc.taskType === 'generate-skill') {
            const intent = String(tc.intent || '').trim();
            const resArr = Array.isArray(tc.resources)
              ? tc.resources.map((x, i) => ({
                  key: String((x && x.key) || `r-${i}`),
                  label: String((x && (x.title || x.name || x.fileName || x.label)) || '').trim() || '未命名',
                }))
              : [];
            const skillNm = String(tc.skillName || '生成技能配置').trim() || '生成技能配置';
            return {
              dagMode: 'generate-skill',
              resources: resArr.length
                ? resArr
                : [{ key: 'intent', label: intent ? (intent.length > 220 ? intent.slice(0, 220) + '…' : intent) : '—' }],
              skill: { id: 'generate-skill', name: skillNm },
            };
          }
          const skillName =
            String(tc.skillName || (this.workbenchSelectedAnalysisResultRow && this.workbenchSelectedAnalysisResultRow.sourceSkillName) || '')
              .trim() || '—';
          const skillId = String(tc.skillId || '').trim();
          const resources = Array.isArray(tc.resources)
            ? tc.resources.map((x, i) => ({
                key: String((x && x.key) || `r-${i}`),
                label: String((x && (x.title || x.name || x.fileName || x.label)) || '').trim() || '未命名资源',
              }))
            : [];
          return {
            dagMode: 'default',
            resources,
            skill: { id: skillId, name: skillName },
          };
        },
        /** 侧栏选中为「生成技能」类工作台任务 */
        wbTaskConfigIsGenerateSkillTask() {
          const m = this.selectedMaterial;
          const tc = m && m.taskConfig;
          return !!(tc && tc.taskType === 'generate-skill');
        },
        wbPackageTaskScopeText() {
          const meta = (this.selectedMaterial && this.selectedMaterial.packageMeta) || {};
          const scope = meta.scope || {};
          return `已选 ${Number(scope.total || 0)} 项 · 结果文件 ${Number(scope.fileCount || 0)} 个 · 文件夹 ${Number(scope.folderCount || 0)} 个`;
        },
        wbPackageTaskPreviewRows() {
          const meta = (this.selectedMaterial && this.selectedMaterial.packageMeta) || {};
          const rows = Array.isArray(meta.previewRows) ? meta.previewRows.filter(Boolean) : [];
          if (rows.length) return rows;
          const items = Array.isArray(meta.items) ? meta.items : [];
          return items.map((item) => ({
            key: String((item && item.key) || ''),
            kind: String((item && item.kind) || '').indexOf('folder') >= 0 ? 'folder' : 'file',
            title: String((item && item.title) || '未命名').trim() || '未命名',
            depth: 0,
          }));
        },
        wbPackageTaskStructureText() {
          const meta = (this.selectedMaterial && this.selectedMaterial.packageMeta) || {};
          return meta.structureMode === 'flat' ? '剔除层级' : '保留层级';
        },
        wbPackageTaskFormatText() {
          const meta = (this.selectedMaterial && this.selectedMaterial.packageMeta) || {};
          return meta.formatMode === 'pdf' ? 'MD 转 PDF' : '保留原始格式';
        },
        wbPackageTaskFailureReason() {
          return '文件转换或压缩包生成失败，请重新打包。';
        },
        /** 生成技能任务在「产出结果」中展示的产物技能名称（单行主文案，不含状态后缀） */
        wbTaskConfigGenerateSkillProductName() {
          const m = this.selectedMaterial;
          if (!m || !m.taskConfig || m.taskConfig.taskType !== 'generate-skill') return '';
          const tc = m.taskConfig;
          const explicit = String(tc.outputSkillName || tc.generatedSkillName || '').trim();
          if (explicit) return this.wbTaskDetailStripDemoLabel(explicit) || explicit;
          const ps = m.projectSource || {};
          const fromPs = String(ps.outputSkillName || ps.resultSkillName || ps.name || '').trim();
          if (fromPs) return this.wbTaskDetailStripDemoLabel(fromPs) || fromPs;
          return '可复用技能草稿';
        },
        /** 生成技能任务 · 产出结果行：技能名称 + 状态与时间（结构同 wbTaskConfigResultRowSingleLine） */
        wbTaskConfigGenerateSkillOutputRowSingleLine() {
          const nameRaw = String(this.wbTaskConfigGenerateSkillProductName || '').trim() || '—';
          const name = this.wbTaskDetailStripDemoLabel(nameRaw) || '—';
          const sub = String(this.wbTaskConfigResultListSubtitle || '').trim();
          if (!sub || sub === '—') return name;
          return this.wbTaskDetailStripDemoLabel(`${name} · ${sub}`) || name;
        },
        /** 创建任务时在弹窗中填写的「生成技能要求」全文 */
        wbSelectedGenerateSkillIntentDisplay() {
          const m = this.selectedMaterial;
          const tc = m && m.taskConfig;
          if (!tc || tc.taskType !== 'generate-skill') return '—';
          const raw = String(tc.intent || '').trim();
          return raw || '—';
        },
        /** 任务详情：资源列表原始行（含 type / key；生成技能无 resources 时用意图占位） */
        workbenchTaskConfigResourcesList() {
          const m = this.selectedMaterial;
          if (!m || !m.taskConfig) return [];
          const tc = m.taskConfig || {};
          const raw = Array.isArray(tc.resources) ? tc.resources : [];
          if (raw.length) return raw;
          if (tc.taskType === 'generate-skill') {
            const intent = String(tc.intent || '').trim();
            return [{
              key: 'intent',
              name: intent ? (intent.length > 220 ? `${intent.slice(0, 220)}…` : intent) : '—',
              type: 'intent',
            }];
          }
          return [];
        },
        /** 任务详情：结果标题（优先 projectSource 显式名称） */
        workbenchTaskDagResultDisplayName() {
          const m = this.selectedMaterial;
          if (!m) return '—';
          if (!this.selectedMaterialIsWorkbenchCreatedTask) {
            const r = this.workbenchSelectedAnalysisResultRow;
            return (r && String(r.name || '').trim()) || '—';
          }
          const ps = m.projectSource || {};
          const fromPs = String(ps.outputTitle || ps.resultName || ps.name || '').trim();
          if (fromPs) return fromPs;
          const r = this.workbenchSelectedAnalysisResultRow;
          if (r && String(r.name || '').trim()) return String(r.name).trim();
          const t = String(m.title || '').trim();
          const stripped = t.replace(/[（(][^）)]*[）)]\s*$/, '').trim();
          return stripped || t || '—';
        },
        wbTaskConfigResultListSubtitle() {
          const r = this.workbenchSelectedAnalysisResultRow;
          const m = this.selectedMaterial;
          if (!m) return '—';
          const ps = m.projectSource || {};
          const status = (r && r.status) || ps.status || m.status || 'queued';
          const st = this.analysisResultStatusLabel(status);
          const t = String((r && r.createdAt) || ps.createdAt || '').trim();
          return t ? `${st} · ${t}` : st;
        },
        /** 任务详情 · 产出结果：单行（名称 + 状态与时间），不含「（演示）」 */
        wbTaskConfigResultRowSingleLine() {
          const nameRaw = String(this.workbenchTaskDagResultDisplayName || '').trim() || '—';
          const name = this.wbTaskDetailStripDemoLabel(nameRaw) || '—';
          const sub = String(this.wbTaskConfigResultListSubtitle || '').trim();
          if (!sub || sub === '—') return name;
          return this.wbTaskDetailStripDemoLabel(`${name} · ${sub}`) || name;
        },
        /** 任务详情「上下文」页：只读多轮对话与执行轨迹（模拟） */
        workbenchSelectedTaskDialogTurns() {
          const m = this.selectedMaterial;
          if (!m || !this.selectedMaterialIsWorkbenchCreatedTask) return [];
          return this.buildWorkbenchTaskDialogTurnsSnapshot(m);
        },
        /** 任务详情 · 使用技能：单行，名称不含「（演示）」 */
        wbTaskConfigSkillRowSingleLine() {
          const d = this.workbenchSelectedTaskConfigDagModel;
          if (!d || !d.skill) return '—';
          const nmRaw = String(d.skill.name || '').trim() || '—';
          const nm = this.wbTaskDetailStripDemoLabel(nmRaw) || '—';
          const id = String(d.skill.id || '').trim();
          if (!id || id === 'generate-skill') return nm;
          return `${nm} · ${id}`;
        },
        wbTaskResourcePreviewModalTitle() {
          const item = this.wbTaskResourcePreviewItem;
          return item ? this.wbTaskConfigResourceDisplayTitle(item) : '资源预览';
        },
        wbTaskResourcePreviewIsDatabase() {
          if (!this.wbTaskResourcePreviewOpen || !this.wbTaskResourcePreviewItem) return false;
          return this.wbTaskConfigResolveResourceKind(this.wbTaskResourcePreviewItem) === 'database';
        },
        wbTaskResourcePreviewDatabaseTables() {
          if (!this.wbTaskResourcePreviewIsDatabase) return [];
          return this.wbTaskResourceResolveDatabasePreviewTables(this.wbTaskResourcePreviewItem || {});
        },
        wbTaskResourcePreviewModalTabsAriaLabel() {
          if (!this.wbTaskResourcePreviewOpen) return '资源预览';
          if (this.wbTaskResourcePreviewIsDatabase) return '数据库表资源预览：基本信息与建表语句';
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          const hasFile = vm && (vm.type === 'raw' || vm.type === undefined) && vm.projectSource;
          if (hasFile) return '资源预览：基本信息与文件预览';
          return '资源预览：基本信息';
        },
        wbTaskResourcePreviewBasicRows() {
          if (!this.wbTaskResourcePreviewOpen) return [];
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          if (vm && (vm.type === 'raw' || vm.type === undefined) && vm.projectSource) {
            return this.materialBasicMetaRowsFromProjectSourceRow(vm.projectSource);
          }
          const item = this.wbTaskResourcePreviewItem;
          return item ? this.wbTaskConfigResourceDetailRowsForItem(item) : [];
        },
        wbTaskResourcePreviewDocumentPages() {
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          if (!vm || (vm.type !== 'raw' && vm.type !== undefined) || !vm.projectSource) return ['暂无内容'];
          return materialPreviewDocumentPagesFromRecord(vm.projectSource);
        },
        wbTaskResourcePreviewOcrPagesList() {
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          if (!vm || (vm.type !== 'raw' && vm.type !== undefined) || !vm.projectSource) return ['暂无 OCR 内容'];
          return materialPreviewOcrPagesFromRecord(vm.projectSource);
        },
        wbTaskResourcePreviewOcrDisplayed() {
          const pages = this.wbTaskResourcePreviewOcrPagesList || [];
          if (!this.wbTaskResourcePreviewOcrLines) return pages;
          return pages.map((p) => materialPreviewOcrPageWithLineNumbers(p, true));
        },
        wbTaskResourcePreviewResolvedRawSubtype() {
          const vm = this.wbTaskResourcePreviewResolvedMaterial;
          if (!vm) return 'document';
          return String(vm.rawSubtype || 'document');
        },
        workbenchSelectedTaskResultSummary() {
          const m = this.selectedMaterial;
          if (!m || !this.selectedMaterialIsWorkbenchCreatedTask) return '—';
          const tc = m.taskConfig || {};
          const status = this.workbenchAnalysisStatusOf(m);
          if (tc.taskType === 'generate-skill') {
            if (status === 'parsing' || status === 'queued') {
              return '正在根据意图生成技能配置，完成后将出现在工作台技能列表（演示）。';
            }
            if (status === 'failed') return '生成技能配置失败，可在任务更多菜单中重试（演示）。';
            return '技能配置已生成，可在左侧技能栏查看并与资料关联（演示）。';
          }
          if (status === 'parsing' || status === 'queued') return '任务执行中，结果生成后会同步到结果列表（演示）。';
          if (status === 'failed') return '任务执行失败，可在更多菜单或核心按钮中重跑。';
          return '任务执行成功，已生成结果。';
        },
        wbAnalysisModalPreviewMarkdown() {
          if (!this.wbAnalysisModalOpen) return '';
          const r = this.wbAnalysisModalRecord || {};
          if (String(r.format || 'MD').toUpperCase() === 'CSV') return '';
          if (r.analysisMarkdown) return r.analysisMarkdown;
          return buildAnalysisResultPreviewMarkdown(r);
        },
        wbAnalysisModalPreviewFormat() {
          const r = this.wbAnalysisModalRecord || {};
          return String(r.format || 'MD').toUpperCase();
        },
        wbAnalysisModalPreviewIsCsv() {
          return this.wbAnalysisModalPreviewFormat === 'CSV';
        },
        wbAnalysisModalPreviewCsvTable() {
          const r = this.wbAnalysisModalRecord || {};
          return parseCsvPreviewTable(r.analysisCsvData || '');
        },
        wbAnalysisModalExportFormats() {
          return this.wbAnalysisModalPreviewIsCsv ? ['csv'] : ['md', 'pdf', 'docx'];
        },
        wbAnalysisModalVersionMenuList() {
          const r = this.wbAnalysisModalRecord;
          if (!r || !r.id) return [];
          const list = (this.workbenchAnalysisVersionHistoryById || {})[r.id];
          return Array.isArray(list) ? list : [];
        },
        wbAnalysisModalVersionCurrentRow() {
          const r = this.wbAnalysisModalRecord;
          if (!r || !r.id) return null;
          const generatedAt = String(r.analysisMarkdownEditedAt || r.createdAt || '').trim() || '—';
          const resolver = (mid) => this.workbenchAnalysisResolveMaterialNameById(mid);
          const generationDesc =
            typeof buildAnalysisResultGenerationDesc === 'function'
              ? buildAnalysisResultGenerationDesc(r, resolver)
              : `使用技能「${String(r.sourceSkillName || '关联技能')}」生成的结果（演示）。`;
          return {
            key: '_current',
            generatedAt,
            generationDesc,
            markdown: this.wbAnalysisModalPreviewMarkdown || '',
          };
        },
        wbAnalysisModalVersionHistoryOnlyRows() {
          const list = this.wbAnalysisModalVersionMenuList || [];
          return list.map((v) => {
            const raw = String(v.markdown || '');
            const gd = String(v.generationDesc || '').trim();
            const savedAt = String(v.savedAt || '').trim();
            const generationDesc = gd || (savedAt ? `历史快照 · ${savedAt}` : '历史快照');
            const generatedAt = savedAt || String(v.label || '').trim() || '—';
            return {
              key: v.key,
              generatedAt,
              generationDesc,
              markdown: raw,
            };
          });
        },
        wbAnalysisVersionDetailHtml() {
          const md = this.wbAnalysisVersionDetailMarkdown || '';
          const html = (window.marked && typeof window.marked.parse === 'function')
            ? window.marked.parse(md)
            : md.replace(/\n/g, '<br>');
          return html.replace(/\[(E\d+)\]/g, (_, k) => `<span class="analysis-inline-citation" aria-label="引用 ${this.analysisCitationDisplayIndex(k)}">（${this.analysisCitationDisplayIndex(k)}）</span>`);
        },
        wbAnalysisModalCitationMap() {
          const r = this.wbAnalysisModalRecord;
          if (!r) return DEMO_ANALYSIS_CITATION_MAP;
          return r.citationMap || DEMO_ANALYSIS_CITATION_MAP;
        },
        wbAnalysisModalDialogueSourceLine() {
          return this.workbenchAnalysisDialogueSourceLineFromRecord(this.wbAnalysisModalRecord);
        },
        wbAnalysisModalPreviewHtml() {
          const md = this.wbAnalysisModalPreviewMarkdown || '';
          const html = (window.marked && typeof window.marked.parse === 'function')
            ? window.marked.parse(md)
            : md.replace(/\n/g, '<br>');
          return html.replace(/\[(E\d+)\]/g, (_, k) => `<span class="analysis-inline-citation" aria-label="引用 ${this.analysisCitationDisplayIndex(k)}">（${this.analysisCitationDisplayIndex(k)}）</span>`);
        },
        wbAnalysisModalStatusLabel() {
          const r = this.wbAnalysisModalRecord || {};
          const st = r.status || 'done';
          const map = { queued: '排队中', parsing: '分析中', done: '完成', failed: '失败' };
          return map[st] || '完成';
        },
        wbAnalysisModalStatusChipClass() {
          const r = this.wbAnalysisModalRecord || {};
          const st = r.status || 'done';
          return this.analysisStatusChipClass(st);
        },
        wbDetailSelectedSkill() {
          const pid = this.workbenchProjectId;
          if (!this.wbProjectSkillDetailId || !pid) return null;
          if (
            this.wbProjectSkillDetailReadOnly
            && this.wbProjectSkillReadonlyPreview
            && String(this.wbProjectSkillReadonlyPreview.id) === String(this.wbProjectSkillDetailId)
          ) {
            return this.wbProjectSkillReadonlyPreview;
          }
          const list = demoProjectAnalysisTemplatesById[pid] || [];
          return list.find((x) => x.id === this.wbProjectSkillDetailId) || null;
        },
        workbenchV2DetailActiveSkillTab() {
          if (this.workbenchEmbedMode !== 'v2') return null;
          const key = String(this.workbenchV2DetailActiveTabKey || '').trim();
          if (!key) return null;
          const tab = (this.workbenchV2DetailTabs || []).find((item) => item && String(item.key || '') === key);
          return tab && tab.kind === 'skill' ? tab : null;
        },
        wbProjectSkillDetailModalTitle() {
          if (this.wbProjectSkillDetailModalIsCreate) return '新建技能';
          const s = this.wbDetailSelectedSkill;
          if (!s) return '技能详情';
          const n = String(s.name || '').trim();
          return n || '未命名技能';
        },
        wbProjectSkillCreateBasicModalTitle() {
          return this._wbProjectSkillCreateAwaitingBasic ? '完善技能基本信息' : '创建技能';
        },
        wbProjectSkillCreateBasicSubmitLabel() {
          return this._wbProjectSkillCreateAwaitingBasic ? '完成' : '提交并继续配置';
        },
        wbProjectSkillDetailModalHeadVersionLabel() {
          if (this.wbProjectSkillDetailModalIsCreate || !this.wbDetailSelectedSkill) return '';
          const s = this.wbDetailSelectedSkill;
          const list = Array.isArray(s.publishedVersions) ? s.publishedVersions : [];
          if (!list.length) return '';
          const sorted = [...list].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
          const v = sorted[0] && sorted[0].versionLabel;
          return v ? String(v).trim() : '';
        },
        wbProjectSkillDimensionSettings() {
          void (window.DemoSkillData && window.DemoSkillData.skillDimensionsRevision);
          const dims = (window.DemoSkillData && window.DemoSkillData.skillDimensions) || {};
          return normalizeWbSkillDimensions(dims);
        },
        wbProjectSkillCategoryRows() {
          return (this.wbProjectSkillDimensionSettings && this.wbProjectSkillDimensionSettings.categories) || [];
        },
        wbProjectSkillTypeDimensionOptions() {
          const rows = (this.wbProjectSkillCategoryRows || []).find((item) => String(item.id) === 'skillType');
          return rows && Array.isArray(rows.values) ? rows.values.filter((item) => item && item.enabled !== false) : [];
        },
        wbProjectAuditSceneDimensionOptions() {
          const rows = (this.wbProjectSkillCategoryRows || []).find((item) => String(item.id) === 'auditScene');
          return rows && Array.isArray(rows.values) ? rows.values.filter((item) => item && item.enabled !== false) : [];
        },
        wbProjectSkillTypeCategoryLabel() {
          const cat = (this.wbProjectSkillCategoryRows || []).find((item) => String(item.id) === 'skillType');
          return cat && cat.label ? String(cat.label) : '技能类型';
        },
        wbProjectAuditSceneCategoryLabel() {
          const cat = (this.wbProjectSkillCategoryRows || []).find((item) => String(item.id) === 'auditScene');
          return cat && cat.label ? String(cat.label) : '业务场景';
        },
        wbProjectSkillBasicFieldsLocked() {
          return this.wbProjectSkillDetailReadOnly;
        },
        wbProjectSkillConfigTabLocked() {
          return this.wbProjectSkillDetailReadOnly;
        },
        wbProjectSkillBasicPaneDirty() {
          if (this.wbProjectSkillDetailReadOnly) return false;
          return window.DemoSkillConfig.basicDirty(this.wbProjectSkillForm, this._wbProjectSkillBasicPaneSnap);
        },
        wbProjectSkillConfigPaneDirty() {
          if (this.wbProjectSkillDetailReadOnly) return false;
          return window.DemoSkillConfig.configDirty(this.wbDetailSelectedSkill, this._wbProjectSkillConfigPaneSnap);
        },
        wbProjectSkillResourceTabLocked() {
          return this.wbProjectSkillDetailReadOnly;
        },
        wbProjectSkillLinkedResourceSelectOptions() {
          const pid = this.workbenchProjectId;
          const mats = pid ? demoProjectMaterialsById[pid] || [] : [];
          return mats.map((m) => ({ value: String(m.id), label: String(m.name || m.id || '') }));
        },
        wbProjectSkillSaveConfigButtonLabel() {
          return '保存配置';
        },
        /** 思考轨未结束或引导语/收尾总结仍在打字时视为「生成中」（此时显示处理中条并禁用发送） */
        chatReplyInProgress() {
          const list = this.chatMessages || [];
          for (let i = 0; i < list.length; i++) {
            const m = list[i];
            if (m.role === 'thinking' && m._finalized === false) return true;
            if (m.role === 'bot') {
              const introLen = (m.chatIntro || '').length;
              if (introLen) {
                const ip = m.chatIntroProgress;
                if (ip != null && ip < introLen) return true;
              }
              const rs = m.chatRunSummary || '';
              if (rs.length) {
                const rp = m.chatRunSummaryProgress ?? 0;
                if (rp < rs.length) return true;
              }
            }
          }
          return false;
        },
        wbDeleteFolderConfirmContent() {
          const t = this.wbDeleteFolderTarget;
          if (!t) return '';
          const name = String(t.name || '文件夹').trim() || '文件夹';
          const build = window.dsConfirm && window.dsConfirm.buildDeleteContent;
          if (!build) {
            return `删除后将同步删除文件夹「${name}」下的子文件夹与资料且不可恢复，请确认是否删除？`;
          }
          return build('folder', `文件夹「${name}」下的子文件夹与资料`);
        },
        chatDemoScenarioMenuItems() {
          const list = Array.isArray(this.chatDemoScenarios) && this.chatDemoScenarios.length
            ? this.chatDemoScenarios
            : CHAT_DEMO_SCENARIOS;
          return list.map((s) => ({
            id: s.id,
            title: String(s.title || s.seedText || '').trim() || '未命名会话',
            kind: s.kind,
            seedText: s.seedText,
            queuePosition: s.queuePosition,
            isDefault: !!s.isDefault,
          }));
        },
        /** 历史下拉：仅展示用户归档会话；样例入口已迁移到独立工作台 */
        chatHistoryMenuItems() {
          const sessions = (this.sessionHistory || []).map((s) => ({
            id: s.id,
            title: String(s.title || '').trim() || '未命名会话',
            source: 'session',
          }));
          return sessions;
        },
        chatQueueNoticeBody() {
          const n = this.chatQueueNotice && this.chatQueueNotice.position;
          if (!n) return '';
          return `当前模型请求量较高，你目前排在第 ${n} 位。请耐心等待`;
        },
        chatUploadAttachmentRows() {
          const items = Array.isArray(this.chatUploadAttachments) ? this.chatUploadAttachments : [];
          return items.map((item) => {
            const status = String((item && item.status) || 'uploading');
            const progress = Math.max(0, Math.min(100, Number(item && item.progress) || 0));
            const fileName = String((item && item.name) || '未命名文件').trim() || '未命名文件';
            const format = String((item && item.format) || '').trim() || fileName.split('.').pop() || 'FILE';
            const api = window.DemoFileIcons;
            const iconMeta = api && typeof api.iconFor === 'function'
              ? api.iconFor(format, fileName)
              : { iconName: 'file-lines', toneClass: '' };
            return {
              ...item,
              uid: String((item && item.uid) || fileName),
              name: fileName,
              status,
              progress,
              format,
              iconName: iconMeta.iconName || 'file-lines',
              iconToneClass: iconMeta.toneClass || '',
              statusLabel: this.chatUploadAttachmentStatusLabel ? this.chatUploadAttachmentStatusLabel(item) : status,
              sizeLabel: this.formatWorkbenchUploadMaterialSize ? this.formatWorkbenchUploadMaterialSize(item && item.size) : '',
            };
          });
        },
        chatUploadAttachmentSendBlocked() {
          return (this.chatUploadAttachmentRows || []).some((item) => {
            const st = String((item && item.status) || '');
            return st === 'uploading' || st === 'failed';
          });
        },
        chatUploadAttachmentSendBlockTip() {
          const rows = this.chatUploadAttachmentRows || [];
          if (rows.some((item) => String(item.status || '') === 'uploading')) return '文件上传中，暂不可发送';
          if (rows.some((item) => String(item.status || '') === 'failed')) return '请先移除上传失败的文件';
          return '发送';
        },
        chatDailyGuideNudgeText() {
          if (this.chatDailyGuideStage === 'upload') return '';
          if (this.chatDailyGuideStage === 'send') return '';
          return '';
        },
        chatInputRefRows() {
          const items = Array.isArray(this.chatInputRefItems) ? this.chatInputRefItems : [];
          return items.map((item) => {
            const kind = String(item && item.kind || '');
            if (kind === 'material') {
              const m = this.wbMaterialVmById ? this.wbMaterialVmById(item.materialId) : null;
              if (!m) return null;
              return {
                key: String(item.key || `material:${m.id}`),
                kind,
                material: m,
                title: (m.type === 'raw' || m.type === undefined)
                  ? String(this.chatAtRawMaterialDisplayTitle(m) || '').trim() || '未命名'
                  : String(m.title != null ? m.title : m.name != null ? m.name : '未命名').trim() || '未命名',
              };
            }
            if (kind === 'material-folder' || kind === 'result-folder') {
              return {
                key: String(item.key || `${kind}:${item.folderId || ''}`),
                kind,
                folderId: String(item.folderId || ''),
                title: String(item.title || '文件夹').trim() || '文件夹',
              };
            }
            if (kind === 'database-table' || kind === 'database-catalog' || kind === 'graph' || kind === 'resource') {
              return {
                key: String(item.key || `${kind}:${item.title || ''}`),
                kind,
                title: String(item.title || '未命名引用').trim() || '未命名引用',
              };
            }
            return null;
          }).filter(Boolean);
        },
        chatInputIncompleteRefMaterials() {
          const map = new Map();
          (this.chatInputRefRows || []).forEach((item) => {
            const m = item && item.kind === 'material' ? item.material : null;
            if (m && (m.type === 'raw' || m.type === undefined) && this.workbenchMaterialStatusOf(m) !== 'done') {
              map.set(String(m.id), m);
            }
          });
          this.collectChatInputAtReferences(this.chatInput).forEach((item) => {
            const m = item && item.material;
            if (m && (m.type === 'raw' || m.type === undefined) && this.workbenchMaterialStatusOf(m) !== 'done') {
              map.set(String(m.id), m);
            }
          });
          (this.chatUploadAttachmentRows || []).forEach((item) => {
            const st = String((item && item.status) || '');
            if (st === 'queued' || st === 'parsing') map.set(String(item.uid), item);
          });
          return Array.from(map.values());
        },
        chatInputIncompleteRefNoticeBody() {
          return '';
        },
  };
})();
