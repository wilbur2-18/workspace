(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};

  const Modal = antd.Modal;
  const message = antd.message;
  const freeauditUtils = window.__DEMO_FREEAUDIT_UTILS || {};
  const getFreeAuditQuery = freeauditUtils.getFreeAuditQuery || function () { return {}; };
  const presetSuggestions = freeauditUtils.presetSuggestions || [];
  const resolveWorkbenchDemoScenario = freeauditUtils.resolveWorkbenchDemoScenario || function () { return null; };
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

  NS.actionGroups = NS.actionGroups || {};
  NS.actionGroups.chatActions = {
        chatAtUnifiedRowStatusClass(row) {
          if (!row || !row.m) return '';
          if (row.kind === 'raw') {
            const st = this.workbenchMaterialStatusOf(row.m);
            if (st === 'queued') return 'is-status-queued';
            if (st === 'parsing') return 'is-status-pending';
            if (st === 'failed') return 'is-status-unparsed';
            return '';
          }
          if (row.kind === 'result') {
            const st = this.workbenchAnalysisStatusOf(row.m);
            if (st === 'queued') return 'is-status-queued';
            if (st === 'parsing') return 'is-status-pending';
            if (st === 'failed') return 'is-status-failed';
            return '';
          }
          return '';
        },
        addResourceToChat(type, row) {
          if (!row) return;
          if (type === 'knowledge') {
            message.info('知识库能力暂未开放');
            return;
          }
          if (type === 'database' && row.databaseName && row.tableName) {
            this.addChatInputRefItem({
              key: `database-table:${String(row.databaseId || row.databaseName)}:${String(row.tableName)}`,
              kind: 'database-table',
              title: `数据库：${row.databaseName}.${row.tableName}`,
            }, { focus: true });
            return;
          }
          if (type === 'database' && row.databaseName && !row.tableName) {
            this.addChatInputRefItem({
              key: `database-catalog:${String(row.databaseId || row.databaseName)}`,
              kind: 'database-catalog',
              title: `数据库：${String(row.databaseName).trim()}`,
            }, { focus: true });
            return;
          }
          if (type === 'graph') {
            this.addChatInputRefItem({
              key: `graph:${String(row.id || row.name)}`,
              kind: 'graph',
              title: `图谱：${String(row.name || row.id || '未命名')}`,
            }, { focus: true });
            return;
          }
          this.addChatInputRefItem({
            key: `${String(type || 'resource')}:${String(row.id || row.name || 'unknown')}`,
            kind: 'resource',
            title: `资源：${String(row.name || row.id || '未命名')}`,
          }, { focus: true });
        },
        addChatInputMaterialRef(material, options) {
          const m = material || null;
          if (!m || !m.id) return;
          this.addChatInputRefItem({
            key: `material:${String(m.id)}`,
            kind: 'material',
            materialId: String(m.id),
          }, options);
        },
        addChatInputFolderRef(kind, folderId, title, options) {
          const folderKind = kind === 'result-folder' ? 'result-folder' : 'material-folder';
          const id = folderId != null ? String(folderId) : '';
          this.addChatInputRefItem({
            key: `${folderKind}:${id || String(title || 'folder')}`,
            kind: folderKind,
            folderId: id,
            title: String(title || '文件夹').trim() || '文件夹',
          }, options);
        },
        addChatInputRefItem(item, options) {
          const ref = item || null;
          if (!ref || !ref.key) return;
          const key = String(ref.key);
          const opts = options || {};
          const next = Array.isArray(this.chatInputRefItems) ? this.chatInputRefItems.slice() : [];
          if (!next.some((x) => String(x && x.key) === key)) next.push({ ...ref, key });
          this.chatInputRefItems = next;
          if (opts.consumeAtTrigger) this.replaceChatInputTriggerWith('');
          if (opts.focus !== false) this.focusChatInput();
        },
        removeChatInputRef(refKey) {
          const key = refKey != null ? String(refKey) : '';
          if (!key) return;
          this.chatInputRefItems = (this.chatInputRefItems || []).filter((x) => String(x && x.key) !== key);
          this.focusChatInput();
        },
        chatUploadAttachmentStatusLabel(item) {
          const st = String((item && item.status) || '');
          const progress = Math.max(0, Math.min(100, Number(item && item.progress) || 0));
          if (st === 'uploading') return `上传中 ${progress}%`;
          if (st === 'queued') return '排队中';
          if (st === 'parsing') return `解析中 ${progress}%`;
          if (st === 'ready') return '待发送';
          if (st === 'failed') return String((item && item.failureReason) || '').trim() || '上传失败';
          return '待发送';
        },
        chatUploadAttachmentTooltip(item) {
          const name = String((item && item.name) || '未命名文件').trim() || '未命名文件';
          const label = this.chatUploadAttachmentStatusLabel(item);
          return `${name} · ${label}`;
        },
        chatUploadAttachmentProgressStyle(item) {
          const st = String((item && item.status) || '');
          const progress = Math.max(0, Math.min(100, Number(item && item.progress) || 0));
          const pct = (st === 'uploading' || st === 'parsing') ? progress : 0;
          return { '--chat-upload-progress': `${pct}%` };
        },
        chatInputRefChipStatus(row) {
          const m = row && row.kind === 'material' ? row.material : null;
          if (!m || !(m.type === 'raw' || m.type === undefined)) return '';
          return this.workbenchMaterialStatusOf ? this.workbenchMaterialStatusOf(m) : '';
        },
        chatInputRefChipClass(row) {
          const st = this.chatInputRefChipStatus(row);
          if (!st || st === 'done') return '';
          return `nlm-chat-ref-chip--material is-${st}`;
        },
        chatInputRefChipProgressStyle(row) {
          const st = this.chatInputRefChipStatus(row);
          const m = row && row.material ? row.material : {};
          const ps = m.projectSource || {};
          const progress = Math.max(0, Math.min(100, Number(ps.progress != null ? ps.progress : m.progress) || 0));
          return { '--chat-upload-progress': st === 'parsing' ? `${progress}%` : '0%' };
        },
        chatInputRefChipStatusLabel(row) {
          const st = this.chatInputRefChipStatus(row);
          if (!st) return '';
          const m = row && row.material ? row.material : {};
          const ps = m.projectSource || {};
          const progress = Math.max(0, Math.min(100, Number(ps.progress != null ? ps.progress : m.progress) || 0));
          if (st === 'queued') {
            const pos = this.workbenchMaterialQueuePosition ? this.workbenchMaterialQueuePosition(m) : 0;
            return pos > 0 ? `排队中，第 ${pos} 位` : '排队中';
          }
          if (st === 'parsing') return `解析中 ${progress}%`;
          if (st === 'done') return '解析完成';
          if (st === 'failed') {
            const reason = String(ps.failureReason || m.failureReason || '').trim();
            const normalizedReason = reason.replace(/^解析失败[:：]\s*/, '');
            return normalizedReason ? `未解析：${normalizedReason}` : '未解析';
          }
          return '';
        },
        chatInputRefChipTitle(row) {
          const title = String((row && row.title) || '').trim();
          const label = this.chatInputRefChipStatusLabel(row);
          return label ? `${title} · ${label}` : title;
        },
        triggerChatUploadAttachmentPicker() {
          const samples = [
            { name: '对话补充资料.pdf', size: 3.6 * 1024 * 1024, type: 'application/pdf' },
            { name: '临时访谈纪要.docx', size: 860 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
            { name: '补充流水明细.xlsx', size: 2.4 * 1024 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          ];
          const index = (this.chatUploadAttachments || []).length % samples.length;
          this.addChatUploadAttachmentFromFile(samples[index]);
        },
        onChatUploadFileInputChange(ev) {
          const files = Array.from((ev && ev.target && ev.target.files) || []);
          this.addChatUploadAttachmentsFromFiles(files);
          if (ev && ev.target) ev.target.value = '';
        },
        addChatUploadAttachmentsFromFiles(files) {
          const list = Array.isArray(files) ? files : [];
          if (!list.length) return;
          list.forEach((file) => this.addChatUploadAttachmentFromFile(file));
          this.focusChatInput();
        },
        addChatUploadAttachmentFromFile(file) {
          const f = file || {};
          const name = String(f.name || '补充审计资料.pdf').trim() || '补充审计资料.pdf';
          const size = Number(f.size || 0) || 0;
          const uid = 'chat-upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
          const format = String(name.split('.').pop() || '').toUpperCase() || 'FILE';
          const maxBytes = 4 * 1024 * 1024 * 1024;
          const existingBytes = (this.chatUploadAttachments || []).reduce((acc, item) => acc + (Number(item && item.size) || 0), 0);
          const overLimit = existingBytes + size > maxBytes;
          const item = {
            uid,
            name,
            size,
            type: String(f.type || ''),
            format,
            status: overLimit ? 'failed' : 'uploading',
            progress: overLimit ? 0 : 12,
            failureReason: overLimit ? '超过 4GB 限制' : '',
          };
          this.chatUploadAttachments = [item, ...((this.chatUploadAttachments || []).slice(0, 5))];
          if (!overLimit) this.startChatUploadAttachmentSimulation(uid);
        },
        startChatUploadAttachmentSimulation(uid) {
          const key = String(uid || '');
          if (!key) return;
          this.clearChatUploadAttachmentTimers(key);
          const stages = [
            { delay: 520, status: 'uploading', progress: 46 },
            { delay: 1100, status: 'parsing', progress: 18 },
            { delay: 1900, status: 'parsing', progress: 62 },
            { delay: 3000, status: 'ready', progress: 100 },
          ];
          const timers = stages.map((stage) => window.setTimeout(() => {
            this.patchChatUploadAttachment(key, stage);
            if (stage.status === 'ready') this.clearChatUploadAttachmentTimers(key);
          }, stage.delay));
          this._chatUploadAttachmentTimers = { ...(this._chatUploadAttachmentTimers || {}), [key]: timers };
        },
        patchChatUploadAttachment(uid, patch) {
          const key = String(uid || '');
          if (!key) return;
          this.chatUploadAttachments = (this.chatUploadAttachments || []).map((item) => {
            if (!item || String(item.uid) !== key) return item;
            if (String(item.status || '') === 'failed') return item;
            return { ...item, ...(patch || {}) };
          });
        },
        clearChatUploadAttachmentTimers(uid) {
          const key = String(uid || '');
          const timers = this._chatUploadAttachmentTimers || {};
          (timers[key] || []).forEach((tid) => window.clearTimeout(tid));
          if (key && timers[key]) delete timers[key];
        },
        removeChatUploadAttachment(uid) {
          const key = String(uid || '');
          if (!key) return;
          this.clearChatUploadAttachmentTimers(key);
          this.chatUploadAttachments = (this.chatUploadAttachments || []).filter((item) => String(item && item.uid) !== key);
          this.focusChatInput();
        },
        ingestChatUploadAttachmentsToMaterials(items) {
          const pid = this.workbenchProjectId;
          if (!pid || typeof demoProjectMaterialsById === 'undefined') return [];
          const rows = Array.isArray(demoProjectMaterialsById[pid]) ? demoProjectMaterialsById[pid] : [];
          const attachments = (Array.isArray(items) ? items : []).filter((item) => item && String(item.status || '') !== 'failed');
          const created = attachments.map((item, index) => {
            const status = String(item.status || '') === 'ready' ? 'done' : (String(item.status || '') || 'queued');
            const id = 'mat-chat-' + Date.now() + '-' + index + '-' + Math.random().toString(36).slice(2, 6);
            return {
              id,
              name: item.name || '未命名资料',
              status,
              progress: status === 'done' ? 100 : Math.max(0, Math.min(100, Number(item.progress || 0) || 0)),
              failureReason: '',
              uploadedAt: dayjs().format('YYYY-MM-DD HH:mm'),
              tags: [],
              format: String(item.format || (item.name || '').split('.').pop() || 'FILE').toUpperCase(),
              size: Number(item.size || 0),
              parentId: null,
              sort: rows.length + index + 1,
            };
          });
          if (!created.length) return [];
          demoProjectMaterialsById[pid] = [...created, ...rows];
          this.refreshWorkbenchDemoResources('material');
          this.ensureResourceDrawerOpen('file');
          const parsingIds = created.filter((row) => row.status === 'queued' || row.status === 'parsing').map((row) => row.id);
          if (parsingIds.length && this._startWorkbenchParseSimulation) this._startWorkbenchParseSimulation(parsingIds, 'parsing');
          return created;
        },
        analysisCitationDisplayIndex(key) {
          const raw = String(key || '').trim();
          const matched = raw.match(/(\d+)$/);
          return matched ? matched[1] : raw;
        },
        buildAnalysisCitationEntries(markdown, citationMap) {
          const text = String(markdown || '');
          const map = citationMap || {};
          const seen = new Set();
          const keys = [];
          text.replace(/\[(E\d+)\]/g, (_, key) => {
            if (!seen.has(key)) {
              seen.add(key);
              keys.push(key);
            }
            return _;
          });
          return keys.map((key) => {
            const data = map[key] || {};
            return {
              key,
              indexLabel: this.analysisCitationDisplayIndex(key),
              sourceLabel: String(data.sourceLabel || '引用来源').trim() || '引用来源',
              excerpt: String(data.sourceExcerpt || data.sourceFullText || '').trim() || '暂无可展示的引用内容',
            };
          });
        },
        normalizeResultInlineCitationText(text) {
          return String(text || '')
            .replace(/【(\d+)】/g, '（$1）')
            .replace(/\[(\d+)\]/g, '（$1）')
            .replace(/\[(E\d+)\]/g, (_, key) => `（${this.analysisCitationDisplayIndex(key)}）`);
        },
        buildMessageResultCitationEntries(msg) {
          const list = Array.isArray(msg && msg.citations) ? msg.citations : [];
          const seen = new Set();
          return list.reduce((acc, item, index) => {
            const sourceId = String(item && item.sourceId || '').trim();
            const excerptIndex = Number(item && item.excerptIndex);
            const dedupeKey = `${sourceId}::${Number.isFinite(excerptIndex) ? excerptIndex : 0}`;
            if (!sourceId || seen.has(dedupeKey)) return acc;
            seen.add(dedupeKey);
            const sourceLabel = this.getCitationSourceLabel(sourceId);
            const excerpt = this.buildCitationPopoverExcerpt(this.getExcerptTextForCitation(sourceId, Number.isFinite(excerptIndex) ? excerptIndex : 0));
            acc.push({
              indexLabel: index + 1,
              sourceLabel: sourceLabel || '引用来源',
              excerpt: excerpt || '暂无可展示的引用内容',
            });
            return acc;
          }, []);
        },
        buildPlainTextCitationSection(entries) {
          if (!entries || !entries.length) return '';
          const lines = ['### 引用信息', ''];
          entries.forEach((item) => {
            lines.push(`**（${item.indexLabel}）${item.sourceLabel}**`);
            String(item.excerpt || '').split('\n').forEach((line) => {
              lines.push(`> ${line}`);
            });
            lines.push('');
          });
          return lines.join('\n').trim();
        },
        formatSavedResultBodyFromMessage(msg) {
          const text = this.normalizeResultInlineCitationText(this.getMessageResultPlainText(msg));
          const appendix = this.buildPlainTextCitationSection(this.buildMessageResultCitationEntries(msg));
          return [text, appendix].filter(Boolean).join('\n\n');
        },
        getAnalysisArtifactFromMessage(msg) {
          const calls = Array.isArray(msg && msg.toolCalls) ? msg.toolCalls : [];
          const hit = calls.find((call) => call && call.type === 'analysis' && call.analysisArtifact);
          return (hit && hit.analysisArtifact) || null;
        },
        workbenchMaterialFolderChatRefMenuLabel() {
          return '添加到对话';
        },
        toggleWorkbenchMaterialFolderInChat(d) {
          const rows = this.collectDoneRawProjectRowsInMaterialFolder(d && d.folderId);
          if (!rows.length) {
            message.info('该文件夹下暂无已解析完成的文件');
            return;
          }
          const pid = this.workbenchProjectId;
          let folderName = String((d && d.title) || '').trim();
          if (!folderName && pid && typeof demoProjectMaterialFoldersById !== 'undefined') {
            const folds = demoProjectMaterialFoldersById[pid] || [];
            const row = folds.find((f) => String(f.id) === String(d && d.folderId));
            folderName = String((row && row.name) || '').trim();
          }
          if (!folderName) folderName = '文件夹';
          this.addChatInputFolderRef('material-folder', d && d.folderId, folderName, { focus: true });
          this.toastMessage = '已添加文件夹引用到对话';
          setTimeout(() => { this.toastMessage = ''; }, 1800);
        },
        workbenchAnalysisResultFolderChatRefMenuLabel() {
          return '添加到对话';
        },
        toggleWorkbenchAnalysisResultFolderInChat(d) {
          const mats = this.collectDoneAnalysisMaterialsInResultFolder(d);
          if (!mats.length) {
            message.info('该文件夹下暂无可引用的结果');
            return;
          }
          const pid = this.workbenchProjectId;
          const fid = d && d.userFolderId ? String(d.userFolderId) : '';
          let folderName = String((d && d.title) || '').trim();
          if (!folderName && fid && pid && typeof demoProjectAnalysisResultFoldersById !== 'undefined') {
            const folds = demoProjectAnalysisResultFoldersById[pid] || [];
            const row = folds.find((f) => String(f.id) === fid);
            folderName = String((row && row.name) || '').trim();
          }
          if (!folderName) folderName = '文件夹';
          this.addChatInputFolderRef('result-folder', fid, folderName, { focus: true });
          this.toastMessage = '已添加文件夹引用到对话';
          setTimeout(() => { this.toastMessage = ''; }, 1800);
        },
        buildDemoAnalysisBotMessage(userText) {
          const atTitles = this.parseChatInputAtReferences(userText);
          let mat = null;
          for (let i = 0; i < atTitles.length; i++) {
            const title = atTitles[i];
            mat = this.materials.find((m) => String(m.title != null ? m.title : '未命名').trim() === title);
            if (mat) break;
          }
          if (!mat) mat = this.materials.find((m) => m.checked) || this.materials[0];
          const materials = this.materials || [];
          const rawList = materials.filter((m) => m && (m.type === 'raw' || m.type === undefined));
          const analysisTarget = (this.selectedMaterial && this.selectedMaterial.type === 'analysis')
            ? this.selectedMaterial
            : materials.find((m) => m.type === 'analysis');
          const baseRaw = mat && (mat.type === 'raw' || mat.type === undefined) ? mat : (rawList[0] || mat || materials[0]);
          const secondRaw = rawList.find((m) => m.id !== baseRaw?.id) || baseRaw;
          const thirdRaw = rawList.find((m) => m.id !== baseRaw?.id && m.id !== secondRaw?.id) || secondRaw;
          /** 与 SUMMARY 正文 [1][2][3][4] 一一对应，保证均可点击溯源 */
          const citationSlots = [
            baseRaw,
            analysisTarget && analysisTarget.id ? analysisTarget : baseRaw,
            secondRaw,
            thirdRaw || analysisTarget || baseRaw,
          ];
          let citations = citationSlots
            .filter((m) => m && m.id)
            .map((m) => ({ sourceId: m.id, excerptIndex: 0 }));
          while (citations.length < 4 && baseRaw && baseRaw.id) {
            citations.push({ sourceId: baseRaw.id, excerptIndex: 0 });
          }
          if (!citations.length && materials.length) {
            const fb = materials[0];
            citations = [{ sourceId: fb.id, excerptIndex: 0 }];
            while (citations.length < 4) citations.push({ sourceId: fb.id, excerptIndex: 0 });
          }
          const fullText = SUMMARY_RESPONSE_DEMO.replace('总结当前工作台中的主要疑点', userText ? `「${userText}」` : '所选资料');
          const splitIdx = fullText.indexOf('\n\n');
          let chatIntro = null;
          let bodyText = fullText;
          if (splitIdx > 0) {
            const intro = fullText.slice(0, splitIdx).trimEnd();
            const body = fullText.slice(splitIdx + 2).trimStart();
            if (intro) {
              chatIntro = intro;
              bodyText = body;
            }
          }
          return {
            id: 'm' + Date.now() + 2,
            role: 'bot',
            text: bodyText,
            ...(chatIntro ? { chatIntro, chatIntroProgress: 0 } : {}),
            chatRunSummary: DEMO_RUN_SUMMARY_TEXT,
            chatRunSummaryProgress: 0,
            citations,
            saved: false,
            chatResultTitle: (analysisTarget && String(analysisTarget.title || analysisTarget.name || '').trim()) || '',
          };
        },
        buildDemoToolCalls(refTitles, userText) {
          const rawTitle = (Array.isArray(refTitles) && refTitles[0]) || (this.materials[0] && this.materials[0].title) || '工作台已加载资料';
          const fileLabel = String(rawTitle != null ? rawTitle : '资料').trim() || '资料';
          const q = String(userText || '').trim();
          const queryText = q.length >= 2 ? q.slice(0, 48) + (q.length > 48 ? '…' : '') : '合同金额 · 发票 · 审批流水';
          const lead = q.length >= 2
            ? `针对「${q.length > 20 ? q.slice(0, 18) + '…' : q}」，先对齐本次要用的资料范围与期望产出（疑点描述、证据指向、后续核查建议）。`
            : '先对齐本次问题的范围：结合工作台内已选资料与既有分析结果，输出可追溯的疑点与证据链。';
          const readActionDetailBody = [
            `文档：《${fileLabel}》`,
            `读取行号：L10–L30（演示）`,
            '',
            '回读片段（演示数据，非真实 OCR）：',
            '',
            '「……第四条 付款方式及进度',
            '（1）主体结构封顶后累计支付至合同价款的 50%；',
            '（2）竣工验收合格且资料移交完毕后支付尾款 50%；',
            '（3）乙方须在每次付款前提供等额合法有效的增值税专用发票……」',
          ].join('\n');
          const mkQueryActionDetailBody = (kw) => [
            '检索 / 关键词扩展（演示）',
            `主检索表达式：${kw}`,
            '',
            '命中统计（示意）：段落 12、表格 3、批注 0',
            '',
            'Top 命中标题：',
            '1) 付款方式与进度里程碑对照表',
            '2) 工程变更对合同价款的影响说明',
            '3) 质保金释放条件与尾款支付前提',
          ].join('\n');
          const skillActionDetailBody = [
            '技能（编排）调用明细（演示）',
            '技能名称：疑点归纳与交叉核对',
            '',
            '本次绑定上下文：',
            `- 主资料：${fileLabel}`,
            `- 用户问题摘要：${queryText}`,
            '',
            '运行参数（JSON）：',
            '{"runner":"skill_sandbox_v1","maxFindings":12,"strictCitations":true,"export":"csv"}',
          ].join('\n');
          const analysisArtifact = this.buildDemoAnalysisArtifact(refTitles, userText);
          return [
            { type: 'text', body: lead },
            {
              type: 'deep_think',
              body:
                '从「尾款 50%」与发票价税合计两条线索出发，优先验证时间先后：若发票早于合同约定的里程碑节点，需区分是预开票、暂估还是流程倒置；若晚于付款审批，则重点核对银行回单摘要与会计科目归集。\n\n'
                + '另需交叉核对：合同含税总额与采购订单、验收单是否闭环；若存在拆分开票或负数调整行，是否在备注与附件索引中可追溯；同时将「尾款」触发条件与保函/质保金释放条款对照，避免把制度性尾款与商务尾款混为一谈。',
            },
            { type: 'read', fileLabel, lineStart: 10, lineEnd: 30, actionDetailBody: readActionDetailBody },
            {
              type: 'text',
              body: '这一段同时出现付款节点、比例与「尾款」表述，和发票开具金额、审批流水里的实际支付时点可能对不上。下面在资料与结果里分多轮关键词检索，缩小需要人工核对的片段。',
            },
            { type: 'query', text: queryText, actionDetailBody: mkQueryActionDetailBody(queryText) },
            { type: 'query', text: '尾款 · 付款节点 · 合同 50%', actionDetailBody: mkQueryActionDetailBody('尾款 · 付款节点 · 合同 50%') },
            { type: 'query', text: '应付账款 · 银行流水 · 实际支付日期', demoToolStatus: 'fail', actionDetailBody: mkQueryActionDetailBody('应付账款 · 银行流水 · 实际支付日期') },
            { type: 'query', text: '采购审批单 · 发票号码 · 价税合计', actionDetailBody: mkQueryActionDetailBody('采购审批单 · 发票号码 · 价税合计') },
            {
              type: 'text',
              body: '检索命中若干段落；从金额、日期、科目三个维度粗对齐后，把仍无法解释的差额标成待核实项。接下来调用结构化技能做归纳与引用编号，再由技能要求驱动后续落地步骤。',
            },
            { type: 'skill', name: '疑点归纳与交叉核对', actionDetailBody: skillActionDetailBody },
            {
              type: 'text',
              body: '技能先给出检查框架与疑点口径（金额口径、时点先后、主体一致性）。下面按技能规则把核查动作拆成任务，先执行检索与回读，再统一产出结构化中间结果。',
            },
            {
              type: 'todo',
              contextFileLabel: fileLabel,
              items: [
                '按技能检查项核对「付款节点—发票—流水」时间链',
                '对未命中检索构造替代关键词并写入扩展备忘',
                '汇总异常并形成结构化中间结果，准备落入审计备忘录',
              ],
            },
            {
              type: 'analysis',
              id: 'analysis-' + Date.now().toString(36),
              fileName: '中间结果.csv',
              analysisArtifact,
            },
            {
              type: 'text',
              body: '核查任务已完成并生成中间结果：疑点条目、证据引用与风险分级已结构化。现在把可读结论同步写入审计备忘录草案，便于你继续追问或直接保存到结果。',
            },
            {
              type: 'edit',
              fileName: '审计备忘录-疑点摘录.md',
              /** 演示：点击 diff 卡标题栏时在结果栏打开的分析结果标题（正式环境可由接口返回结果 ID） */
              previewResultTitle: '合同与发票一致性检查结果',
              added: 2,
              removed: 1,
              diffExpanded: false,
              diffLines: [
                '- 待核实：合同金额与已开发票差异（演示）',
                '+ 待核实：合同金额与已开发票差异 [高风险]（演示）',
                '+ 建议：补充 2024Q4 对账单及剩余发票复印件',
                '  （上下文）第四条 付款方式按进度支付，尾款 50%。',
                '- 备注：原草稿行，仅在展开后可见',
                '+ 备注：已关联采购审批单 PR-2026-014',
              ],
            },
          ];
        },
        isToolCallTextStream(call) {
          return !!(call && (call.type === 'text' || call.type === 'deep_think'));
        },
        isDeepThinkCollapsed(msg, i) {
          if (!msg || msg.role !== 'thinking') return true;
          if (msg.thinkPhaseIndex == null) {
            return i < (msg.currentStep ?? 0);
          }
          return i < (msg.thinkPhaseIndex ?? 0);
        },
        formatDeepThinkSeconds(call) {
          const ms = call && call.deepThinkDurationMs;
          if (ms == null || Number.isNaN(ms)) return '1秒';
          const sec = Math.max(1, Math.round(ms / 1000));
          return sec + '秒';
        },
        toggleDeepThinkUserExpand(call) {
          if (!call || call.type !== 'deep_think') return;
          call.deepThinkUserExpanded = !call.deepThinkUserExpanded;
        },
        todoItemIsDone(call, ti) {
          return !!(call && call.todoDoneFlags && call.todoDoneFlags[ti]);
        },
        todoCardHeaderLabel(msg, i, call) {
          if (!call || call.type !== 'todo') return '规划中';
          const phase = msg.thinkPhaseIndex ?? 0;
          const past =
            msg.thinkPhaseIndex == null ? i < (msg.currentStep ?? 0) : i < phase;
          if (past) return '执行完成';
          if (call._todoUiPhase === 'planning') return '规划中';
          if (call._todoUiPhase === 'executing') return '执行中';
          if (call._todoUiPhase === 'complete') return '执行完成';
          return '执行完成';
        },
        todoTaskListVisible(msg, i, call) {
          if (!call || call.type !== 'todo') return false;
          const phase = msg.thinkPhaseIndex ?? 0;
          const past =
            msg.thinkPhaseIndex == null ? i < (msg.currentStep ?? 0) : i < phase;
          if (past) return true;
          return call._todoUiPhase === 'executing' || call._todoUiPhase === 'complete';
        },
        buildTodoSimPlan(contextFileLabel) {
          const fl = String(contextFileLabel || '资料').trim() || '资料';
          return [
            { kind: 'think', text: '任务 1（技能检查项）：把合同付款节点、发票开具日与银行回单摘要映射到同一时间轴，标出「先票后款」「先款后票」类异常。', delayMs: 580 },
            { kind: 'query', text: '里程碑 · 开票日期 · 银行摘要 · 尾款 50%', delayMs: 760 },
            { kind: 'markDone', itemIndex: 0, delayMs: 440 },
            { kind: 'think', text: '任务 2（检索扩展）：对上一轮未命中段落做同义词与科目别名扩展，覆盖暂估、预开票、价税拆分等常见表述。', delayMs: 560 },
            { kind: 'query', text: '暂估 · 预开票 · 科目重分类 · 价税合计', delayMs: 720 },
            { kind: 'edit', fileName: '检索扩展备忘.md', detail: '追加候选关键词组', delayMs: 980 },
            { kind: 'markDone', itemIndex: 1, delayMs: 420 },
            { kind: 'think', text: '任务 3（汇总成型）：把已核对片段映射到疑点条目与引用编号字段，并回读资料头部摘要避免漏引。', delayMs: 540 },
            { kind: 'read', fileLabel: fl, lineStart: 1, lineEnd: 12, delayMs: 840 },
            { kind: 'markDone', itemIndex: 2, delayMs: 440 },
          ];
        },
        appendTodoExecutionLogEntry(call, step) {
          if (!call || !step || step.kind === 'markDone') return;
          if (!Array.isArray(call.todoExecutionLog)) call.todoExecutionLog = [];
          const id = 'tlog-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
          if (step.kind === 'think') {
            call.todoExecutionLog.push({ id, kind: 'think', text: step.text });
          } else if (step.kind === 'query') {
            call.todoExecutionLog.push({ id, kind: 'query', text: step.text, running: true });
          } else if (step.kind === 'read') {
            call.todoExecutionLog.push({
              id,
              kind: 'read',
              fileLabel: step.fileLabel,
              lineStart: step.lineStart,
              lineEnd: step.lineEnd,
              running: true,
            });
          } else if (step.kind === 'edit') {
            call.todoExecutionLog.push({
              id,
              kind: 'edit',
              fileName: step.fileName,
              detail: step.detail,
              running: true,
            });
          }
        },
        finalizeTodoExecutionLogEntryForStep(call, step) {
          if (!step || step.kind === 'markDone' || step.kind === 'think') return;
          const log = call.todoExecutionLog;
          if (!log || !log.length) return;
          const last = log[log.length - 1];
          if (last && last.running) last.running = false;
        },
        applyTodoMarkDoneStep(call, step) {
          if (step && step.kind === 'markDone' && call.todoDoneFlags && step.itemIndex != null) {
            const ix = step.itemIndex;
            if (ix >= 0 && ix < call.todoDoneFlags.length) {
              call.todoDoneFlags[ix] = true;
            }
          }
        },
        advanceTodoPlanningDemo(thinking, idx) {
          const calls = thinking.toolCalls || [];
          const call = calls[idx];
          if (!call || call.type !== 'todo') return;
          const items = call.items || [];
          const planningHoldMs = 560;
          if (!call._todoPlanBuilt) {
            call._todoPlanBuilt = true;
            call._todoPlan = this.buildTodoSimPlan(call.contextFileLabel);
            call.todoDoneFlags = items.map(() => false);
            call._todoPlanIdx = 0;
            call.todoExecutionLog = [];
            call._todoUiPhase = 'planning';
            call._todoPlanningUntil = Date.now() + planningHoldMs;
            thinking.thinkToolStartedAt = null;
            return;
          }
          if (call._todoUiPhase === 'planning') {
            if (Date.now() < (call._todoPlanningUntil || 0)) return;
            call._todoUiPhase = 'executing';
            return;
          }
          const plan = call._todoPlan || [];
          const pi = call._todoPlanIdx ?? 0;
          if (pi >= plan.length) {
            call._todoUiPhase = 'complete';
            thinking.thinkPhaseIndex = idx + 1;
            thinking.thinkToolStartedAt = null;
            thinking.thinkTextChars = 0;
            if (thinking.thinkPhaseIndex >= calls.length) this.finalizeThinkingDemo(thinking);
            return;
          }
          const step = plan[pi];
          if (thinking.thinkToolStartedAt == null) {
            this.appendTodoExecutionLogEntry(call, step);
            thinking.thinkToolStartedAt = Date.now();
            return;
          }
          const need = step.delayMs != null ? step.delayMs : 650;
          if (Date.now() - thinking.thinkToolStartedAt < need) return;
          this.finalizeTodoExecutionLogEntryForStep(call, step);
          this.applyTodoMarkDoneStep(call, step);
          call._todoPlanIdx = pi + 1;
          thinking.thinkToolStartedAt = null;
        },
        toolCallIsDone(msg, i) {
          if (msg.thinkPhaseIndex == null) {
            return i < (msg.currentStep ?? 0);
          }
          return i < (msg.thinkPhaseIndex ?? 0);
        },
        thinkingTextSlice(msg, call, i) {
          if (!this.isToolCallTextStream(call)) return '';
          const body = call.body || '';
          if (msg.thinkPhaseIndex == null) {
            const cur = msg.currentStep ?? 0;
            return i <= cur ? body : '';
          }
          const phase = msg.thinkPhaseIndex ?? 0;
          if (i < phase) return body;
          if (i > phase) return '';
          return body.slice(0, Math.min(body.length, msg.thinkTextChars ?? 0));
        },
        toolCallStepPending(msg, i) {
          const calls = msg.toolCalls || [];
          if (!calls.length) return false;
          if (msg.thinkPhaseIndex == null) {
            const cur = msg.currentStep ?? 0;
            if (cur >= calls.length) return false;
            return i === cur;
          }
          const phase = msg.thinkPhaseIndex ?? 0;
          if (phase >= calls.length || i !== phase) return false;
          const c = calls[i];
          return !!(c && !this.isToolCallTextStream(c));
        },
        toolCallActionStatus(msg, i, call) {
          if (!call || this.isToolCallTextStream(call)) return null;
          if (call.type === 'todo') {
            const plan = call._todoPlan || [];
            const pi = call._todoPlanIdx ?? 0;
            const planRunning = pi < plan.length;
            if (msg.thinkPhaseIndex == null) {
              const cur = msg.currentStep ?? 0;
              if (i < cur) return 'ok';
              if (i !== cur) return null;
              if (call._todoUiPhase === 'planning') return 'running';
              if (call._todoUiPhase === 'executing') return planRunning ? 'running' : 'ok';
              return 'ok';
            }
            const phase = msg.thinkPhaseIndex ?? 0;
            if (i < phase) return 'ok';
            if (i > phase) return null;
            if (call._todoUiPhase === 'planning') return 'running';
            if (call._todoUiPhase === 'executing') return planRunning ? 'running' : 'ok';
            return 'ok';
          }
          const calls = msg.toolCalls || [];
          if (msg.thinkPhaseIndex == null) {
            const cur = msg.currentStep ?? 0;
            if (i < cur) return call.demoToolStatus === 'fail' ? 'fail' : 'ok';
            if (i === cur && cur < calls.length) {
              const c = calls[i];
              if (c && !this.isToolCallTextStream(c)) return 'running';
            }
            return null;
          }
          const phase = msg.thinkPhaseIndex ?? 0;
          if (i < phase) return call.demoToolStatus === 'fail' ? 'fail' : 'ok';
          if (i > phase) return null;
          if (this.toolCallStepPending(msg, i)) return 'running';
          return 'ok';
        },
        advanceThinkingDemo(thinking) {
          if (!thinking || thinking._finalized || thinking._queueMode) return;
          const calls = thinking.toolCalls || [];
          if (!calls.length) {
            this.finalizeThinkingDemo(thinking);
            return;
          }
          let idx = thinking.thinkPhaseIndex ?? 0;
          if (idx >= calls.length) {
            this.finalizeThinkingDemo(thinking);
            return;
          }
          const c = calls[idx];
          if (this.isToolCallTextStream(c)) {
            const body = c.body || '';
            if (!body.length) {
              if (c.type === 'deep_think') {
                c.deepThinkDurationMs = 0;
                delete c._deepThinkStart;
              }
              thinking.thinkPhaseIndex = idx + 1;
              thinking.thinkTextChars = 0;
              thinking.thinkToolStartedAt = null;
              if (thinking.thinkPhaseIndex >= calls.length) this.finalizeThinkingDemo(thinking);
              return;
            }
            let chars = thinking.thinkTextChars ?? 0;
            if (chars < body.length) {
              if (c.type === 'deep_think' && c._deepThinkStart == null) {
                c._deepThinkStart = Date.now();
              }
              const n = body.length;
              const perTick = n > 140 ? 3 : n > 55 ? 2 : 1;
              thinking.thinkTextChars = Math.min(body.length, chars + perTick);
              return;
            }
            if (c.type === 'deep_think') {
              if (c._deepThinkStart != null) {
                c.deepThinkDurationMs = Date.now() - c._deepThinkStart;
                delete c._deepThinkStart;
              } else {
                c.deepThinkDurationMs = c.deepThinkDurationMs ?? 0;
              }
            }
            thinking.thinkPhaseIndex = idx + 1;
            thinking.thinkTextChars = 0;
            thinking.thinkToolStartedAt = null;
            if (thinking.thinkPhaseIndex >= calls.length) this.finalizeThinkingDemo(thinking);
            return;
          }
          if (c.type === 'todo') {
            this.advanceTodoPlanningDemo(thinking, idx);
            return;
          }
          if (thinking.thinkToolStartedAt == null) {
            thinking.thinkToolStartedAt = Date.now();
            return;
          }
          const delays = { read: 920, query: 780, skill: 1200, analysis: 1350, edit: 1400 };
          const need = delays[c.type] || 850;
          if (Date.now() - thinking.thinkToolStartedAt < need) return;
          thinking.thinkPhaseIndex = idx + 1;
          thinking.thinkToolStartedAt = null;
          thinking.thinkTextChars = 0;
          if (thinking.thinkPhaseIndex >= calls.length) this.finalizeThinkingDemo(thinking);
        },
        displayChatIntroSlice(msg) {
          if (!msg || !msg.chatIntro) return '';
          const full = msg.chatIntro;
          const p = msg.chatIntroProgress;
          if (p == null) return full;
          return full.slice(0, Math.min(full.length, p));
        },
        chatIntroRevealMarkdown(msg) {
          if (!msg || !msg.chatIntro) return true;
          const len = (msg.chatIntro || '').length;
          const p = msg.chatIntroProgress;
          if (p == null) return true;
          return p >= len;
        },
        scheduleChatIntroTypewriter(botMsg) {
          if (!botMsg || !botMsg.chatIntro) {
            this.scheduleBotRunSummary(botMsg);
            return;
          }
          const msgId = botMsg.id;
          botMsg.chatIntroProgress = 0;
          if (botMsg._chatIntroIv) {
            clearInterval(botMsg._chatIntroIv);
            botMsg._chatIntroIv = null;
          }
          const iv = setInterval(() => {
            const cur = this.chatMessages.find((x) => x.id === msgId);
            if (!cur || !cur.chatIntro) {
              clearInterval(iv);
              return;
            }
            const len = cur.chatIntro.length;
            const step = len > 80 ? 2 : 1;
            const next = Math.min(len, (cur.chatIntroProgress || 0) + step);
            cur.chatIntroProgress = next;
            if (next >= len) {
              clearInterval(iv);
              cur._chatIntroIv = null;
              this.scheduleBotRunSummary(cur);
            }
            this.$nextTick(() => {
              const w = this.$refs.chatMessages;
              if (w) w.scrollTop = w.scrollHeight;
            });
          }, 42);
          const m = this.chatMessages.find((x) => x.id === msgId);
          if (m) m._chatIntroIv = iv;
        },
        finalizeThinkingDemo(thinking) {
          if (!thinking || thinking._finalized) return;
          thinking._finalized = true;
          if (thinking._intervalId) {
            clearInterval(thinking._intervalId);
            thinking._intervalId = null;
          }
          const thinkId = thinking.id;
          const userText = thinking._demoSendText || '';
          const botMsg = this.buildDemoAnalysisBotMessage(userText);
          const ins = this.chatMessages.findIndex((m) => m.id === thinkId);
          if (ins >= 0) this.chatMessages.splice(ins + 1, 0, botMsg);
          else this.chatMessages.push(botMsg);
          this.$nextTick(() => {
            const w = this.$refs.chatMessages;
            if (w) w.scrollTop = w.scrollHeight;
            this.scheduleChatIntroTypewriter(botMsg);
          });
        },
        toolDiffLineClass(line) {
          return demoToolDiffLineClass(line);
        },
        visibleToolDiffLines(call, expanded) {
          const lines = call.diffLines || [];
          if (expanded) return lines;
          return lines.slice(0, 4);
        },
        toggleToolDiffExpand(toolCall) {
          if (!toolCall || toolCall.type !== 'edit') return;
          toolCall.diffExpanded = !toolCall.diffExpanded;
        },
        toolCallActionDetailBody(call) {
          if (!call) return '';
          const custom = call.actionDetailBody != null ? String(call.actionDetailBody).trim() : '';
          if (custom) return String(call.actionDetailBody);
          if (call.type === 'analysis' && call.analysisArtifact && typeof call.analysisArtifact.csvData === 'string' && call.analysisArtifact.csvData.trim()) {
            return ['结构化中间结果（CSV）', '', String(call.analysisArtifact.csvData)].join('\n');
          }
          return '';
        },
        toolCallActionDetailLines(call) {
          const t = this.toolCallActionDetailBody(call);
          if (!t) return [];
          return t.split(/\r?\n/);
        },
        toolCallActionDetailTitle(call) {
          const map = { query: '查询详情', read: '阅读详情', skill: '调用详情', analysis: '分析详情' };
          return map[call && call.type] || '详情';
        },
        toggleToolCallActionDetailExpand(call) {
          if (!call || !['query', 'read', 'skill', 'analysis'].includes(call.type)) return;
          if (!this.toolCallActionDetailBody(call)) return;
          call._actionDetailExpanded = !call._actionDetailExpanded;
        },
        copyToolCallActionDetail(call) {
          const body = this.toolCallActionDetailBody(call);
          if (!body) {
            message.info('暂无可复制内容');
            return;
          }
          navigator.clipboard?.writeText(body);
          this.toastMessage = '已复制';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        chatBotResultHasBody(msg) {
          return !!(msg && msg.role === 'bot' && String(msg.text || '').trim());
        },
        chatBotResultWriteTitle(msg) {
          if (!this.chatBotResultHasBody(msg)) return '分析结果';
          const explicit = String(msg.chatResultTitle || '').trim();
          if (explicit) return explicit.slice(0, 80);
          const raw = String(msg.text || '').trim();
          const m = raw.match(/^#{1,6}\s+(.+)$/m);
          if (m) return m[1].trim().slice(0, 80) || '分析结果';
          const first = raw.split(/\r?\n/).find((ln) => String(ln || '').trim());
          const t = String(first || '').trim().replace(/^[-*\d.\s]+/, '');
          return (t || '分析结果').slice(0, 80);
        },
        chatBotResultWriteLine(msg) {
          return `写入《${this.chatBotResultWriteTitle(msg)}》`;
        },
        toggleChatBotResultMdExpand(msg) {
          if (!this.chatBotResultHasBody(msg)) return;
          msg._chatResultMdExpanded = !msg._chatResultMdExpanded;
        },
        copyChatBotResultMarkdown(msg) {
          const t = String(msg && msg.text || '').trim();
          if (!t) {
            message.info('暂无可复制内容');
            return;
          }
          navigator.clipboard?.writeText(t);
          this.toastMessage = '已复制';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        buildDemoAnalysisArtifact(refTitles, userText) {
          const selected = (Array.isArray(refTitles) ? refTitles : []).filter(Boolean);
          const fallbackTitles = (this.materials || [])
            .filter((m) => m && m.type === 'raw')
            .slice(0, 3)
            .map((m) => m.title || m.name || '未命名资料');
          const sourceLabels = (selected.length ? selected : fallbackTitles).slice(0, 3);
          const displayPrompt = String(userText || '').trim() || '当前工作台资料一致性分析';
          const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
          return {
            fileName: '中间结果.csv',
            toolName: '分析工具',
            generatedAt,
            sourceLabels,
            hitCount: 6,
            objectCount: 3,
            summaryItems: [
              { label: '命中对象', value: '3 个对象' },
              { label: '异常条目', value: '3 条高风险疑点' },
              { label: '来源资料', value: `${sourceLabels.length} 份资料` },
              { label: '处理状态', value: '已生成' },
            ],
            jsonData: {
              task: 'analysis_tool',
              prompt: displayPrompt,
              sourceMaterials: sourceLabels.map((label, index) => ({ id: `src-${index + 1}`, label })),
              summary: { objectCount: 3, hitCount: 6, riskLevel: 'high' },
              findings: [
                { id: 'finding-1', title: '合同金额与累计开票金额不一致', severity: 'high', evidenceRefs: ['E1'], suggestion: '补充补充协议与红冲记录核对口径' },
                { id: 'finding-2', title: '付款日期早于验收节点', severity: 'high', evidenceRefs: ['E2'], suggestion: '核查是否存在先付后验的审批豁免' },
                { id: 'finding-3', title: '供应商主体名称存在近似差异', severity: 'medium', evidenceRefs: ['E3'], suggestion: '补充主体授权与开户证明资料' },
              ],
            },
            csvData: [
              '疑点ID,疑点标题,风险等级,证据引用,建议动作',
              '"finding-1","合同金额与累计开票金额不一致","高","E1","补充补充协议与红冲记录核对口径"',
              '"finding-2","付款日期早于验收节点","高","E2","核查是否存在先付后验的审批豁免"',
              '"finding-3","供应商主体名称存在近似差异","中","E3","补充主体授权与开户证明资料"',
            ].join('\n'),
            resultMarkdown: [
              '## 一、分析结论',
              `围绕“${displayPrompt}”，分析工具对 ${sourceLabels.join('、')} 进行了结构化对齐，识别出金额口径差异、付款时点异常与主体名称近似不一致三类问题。`,
              '',
              '## 二、关键发现',
              '- 合同金额与累计开票金额存在差异，需补充核验变更与红冲记录。（1）',
              '- 付款发生在验收完成前，存在流程倒置风险。（2）',
              '- 供应商主体名称在合同与开户信息中表述不一致，需确认是否为同一主体。（3）',
              '',
              '## 三、建议动作',
              '- 先核对金额差异的变更依据与对账口径。',
              '- 再复核付款、验收、审批三者的时间链。',
              '- 最后补齐主体授权、开户与工商登记资料。',
              '',
              '---',
              '',
              '### 引用信息',
              '',
              `**（1）${DEMO_ANALYSIS_CITATION_MAP.E1.sourceLabel}**`,
              ...String(DEMO_ANALYSIS_CITATION_MAP.E1.sourceExcerpt || '').split('\n').map((line) => `> ${line}`),
              '',
              `**（2）${DEMO_ANALYSIS_CITATION_MAP.E2.sourceLabel}**`,
              ...String(DEMO_ANALYSIS_CITATION_MAP.E2.sourceExcerpt || '').split('\n').map((line) => `> ${line}`),
              '',
              `**（3）${DEMO_ANALYSIS_CITATION_MAP.E3.sourceLabel}**`,
              ...String(DEMO_ANALYSIS_CITATION_MAP.E3.sourceExcerpt || '').split('\n').map((line) => `> ${line}`),
            ].join('\n'),
          };
        },
        analysisToolCallLabel(call) {
          const labels = Array.isArray(call && call.analysisArtifact && call.analysisArtifact.sourceLabels)
            ? call.analysisArtifact.sourceLabels.filter(Boolean)
            : [];
          if (!labels.length) return '分析已选资料并生成结构化中间结果';
          return `分析 ${labels.join('、')}`;
        },
        openChatToolEditPreview(call) {
          if (!call || call.type !== 'edit') return;
          const materials = this.materials || [];
          const analyses = materials.filter((m) => m && m.type === 'analysis');
          let target = null;
          const hint = String(call.previewResultTitle || '').trim();
          if (hint) {
            target =
              analyses.find((m) => String(m.title || '').trim() === hint) ||
              analyses.find((m) => String(m.title || '').includes(hint));
          }
          if (!target) {
            const stem = String(call.fileName || '')
              .replace(/\.(md|markdown)$/i, '')
              .trim();
            if (stem) {
              target = analyses.find((m) => {
                const t = String(m.title || '');
                return t.includes(stem) || stem.includes(t);
              });
            }
          }
          if (!target) {
            target = analyses.find((m) => this.canOpenAnalysisPreview(m)) || analyses[0];
          }
          if (!target) {
            message.info('当前工作台暂无可预览的分析结果');
            return;
          }
          if (!this.canOpenAnalysisPreview(target)) {
            message.info('该结果尚未完成，暂不可预览');
            return;
          }
          this.sourcesCollapsed = false;
          this.studioCollapsed = false;
          this.clearWorkbenchAnalysisCitationFloats();
          this.openMaterialDetail(target);
        },
        createWorkbenchResultRowFromMarkdown(payload) {
          const pid = this.workbenchProjectId;
          if (!pid) {
            message.warning('缺少工作台上下文');
            return null;
          }
          const title = String(payload && payload.name || '').trim();
          const format = String(payload && payload.format || '').trim().toUpperCase() || 'MD';
          const markdown = String(payload && payload.markdown || '').trim();
          const csvData = String(payload && payload.csvData || '').trim();
          if (!title) return null;
          if (format === 'CSV' ? !csvData : !markdown) return null;
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const id = 'ar-msg-' + Date.now();
          const row = {
            id,
            name: title,
            format,
            resultTreeBucket: 'dialog',
            resultFolderId: null,
            sourceSkillName: '审计助手对话',
            createdAt: now,
            status: 'done',
            analysisMarkdown: format === 'CSV' ? '' : markdown,
            analysisCsvData: format === 'CSV' ? csvData : '',
          };
          if (!demoProjectAnalysisResultsById[pid]) demoProjectAnalysisResultsById[pid] = [];
          demoProjectAnalysisResultsById[pid].unshift(row);
          const material = mapAnalysisResultRowToWorkbench(row, pid);
          material.analysisMarkdown = row.analysisMarkdown;
          material.analysisCsvData = row.analysisCsvData;
          const previewText = format === 'CSV' ? row.analysisCsvData : row.analysisMarkdown;
          material.excerpts = [previewText];
          material.excerptsWithCitations = [{ text: previewText, citations: [] }];
          material.overview = String(payload && payload.overview || previewText).slice(0, 150) + (previewText.length > 150 ? '...' : '');
          this.materials.push(material);
          this.selectedMaterialId = material.id;
          this.sourcesCollapsed = false;
          this.studioCollapsed = false;
          this.clearWorkbenchAnalysisCitationFloats();
          this.sourcesRightView = 'detail';
          this.sourcesLeftView = 'list';
          this.sourcesDetailWidth = 450;
          material.checked = true;
          return { row, material };
        },
        clearChatThinkingIntervals() {
          (this.chatMessages || []).forEach((m) => {
            if (m._intervalId) {
              clearInterval(m._intervalId);
              m._intervalId = null;
            }
            if (m._runSummaryStartTid) {
              clearTimeout(m._runSummaryStartTid);
              m._runSummaryStartTid = null;
            }
            if (m._runSummaryIv) {
              clearInterval(m._runSummaryIv);
              m._runSummaryIv = null;
            }
            if (m._chatIntroIv) {
              clearInterval(m._chatIntroIv);
              m._chatIntroIv = null;
            }
          });
        },
        hideChatQueueNotice() {
          if (this._chatQueuePollIv) {
            clearInterval(this._chatQueuePollIv);
            this._chatQueuePollIv = null;
          }
          if (this.chatQueueNotice) {
            this.chatQueueNotice.visible = false;
            this.chatQueueNotice.position = 0;
          }
        },
        showChatQueueNotice(position) {
          const pos = Math.max(1, Number(position) || 3);
          if (!this.chatQueueNotice) {
            this.chatQueueNotice = { visible: true, position: pos };
          } else {
            this.chatQueueNotice.visible = true;
            this.chatQueueNotice.position = pos;
          }
          if (this._chatQueuePollIv) {
            clearInterval(this._chatQueuePollIv);
            this._chatQueuePollIv = null;
          }
          this._chatQueuePollIv = setInterval(() => {
            if (!this.chatQueueNotice || !this.chatQueueNotice.visible) return;
            const cur = Number(this.chatQueueNotice.position) || 1;
            if (cur <= 1) return;
            this.chatQueueNotice.position = cur - 1;
          }, 12000);
        },
        activateChatQueueDemo(position) {
          const thinking = (this.chatMessages || []).find((m) => m && m.role === 'thinking' && m._queueMode);
          if (thinking) {
            thinking._finalized = false;
            thinking.thinkToolStartedAt = Date.now();
          }
          this.showChatQueueNotice(position);
        },
        defaultChatDemoRefTitles() {
          return (this.materials || [])
            .filter((m) => m && m.type === 'raw')
            .slice(0, 3)
            .map((m) => m.title || m.name || '未命名资料');
        },
        buildQueuedDemoConversation(text, refTitles, queuePosition) {
          const cleanText = String(text || '').trim();
          const refs = Array.isArray(refTitles) ? refTitles.slice() : [];
          const userMsg = {
            id: 'm-queue-' + Date.now(),
            role: 'user',
            text: cleanText,
            refCount: refs.length,
            refTitles: refs,
          };
          const allTools = this.buildDemoToolCalls(refs, cleanText);
          const stopAt = Math.min(5, allTools.length);
          const partialTools = allTools.slice(0, stopAt).map((call, idx) => {
            const cloned = JSON.parse(JSON.stringify(call));
            if (cloned.type === 'deep_think' && idx < stopAt - 1) {
              cloned.deepThinkDurationMs = 2800;
            }
            return cloned;
          });
          const runningPhase = Math.max(0, stopAt - 1);
          const thinkingMsg = {
            id: 'think-queue-' + Date.now(),
            role: 'thinking',
            toolCalls: partialTools,
            thinkPhaseIndex: runningPhase,
            thinkTextChars: 0,
            thinkToolStartedAt: Date.now(),
            _demoSendText: cleanText,
            _finalized: false,
            _queueMode: true,
            _queuePosition: Math.max(1, Number(queuePosition) || 3),
            _intervalId: null,
          };
          return [userMsg, thinkingMsg];
        },
        buildResultTreeApprovalBlock(suffix, status, extra) {
          const now = Date.now();
          const title = (extra && extra.title) || '是否删除结果';
          const objectTitle = (extra && extra.objectTitle) || '预算偏差临时表';
          const objectType = (extra && extra.objectType) || '结果文件';
          const path = (extra && extra.path) || '结果 / 预算测算草稿 / 预算偏差临时表';
          const actionLabel = (extra && extra.actionLabel) || String(title).replace(/^是否/, '');
          const timeoutLabel = String((extra && extra.timeoutLabel) || '59s 后自动取消');
          const timeoutSeconds = Number((timeoutLabel.match(/^\d+/) || [59])[0]) || 59;
          const isPending = (status || 'pending') === 'pending';
          return {
            type: 'tool.approval',
            id: 'decision-tool-' + suffix + '-' + now,
            status: status || 'pending',
            title,
            timeoutLabel: isPending ? timeoutLabel : '',
            timeoutExpiresAt: isPending ? now + timeoutSeconds * 1000 : 0,
            materialId: (extra && extra.materialId) || '',
            objectTitle,
            objectDisplayName: (extra && extra.objectDisplayName) || (/结果$/.test(String(objectTitle)) ? objectTitle : `${objectTitle}结果`),
            objectType,
            path,
            actionLabel,
            toolName: (extra && extra.toolName) || '删除文件或目录工具',
            detailJson: (extra && extra.detailJson) || {
              action: 'delete',
              object_type: 'analysis_result',
              object_name: objectTitle,
              object_path: path,
              approval_scene: 'result_tree_sensitive_change',
            },
            impact: (extra && extra.impact) || '允许后将从结果树移除；拒绝后保留在当前文件夹。',
            summary: (extra && extra.summary) || '',
            items: Array.isArray(extra && extra.items) ? extra.items.slice() : [],
            _actionDetailExpanded: !!(extra && extra.expanded),
          };
        },
        findPendingApprovalBlock(messages) {
          const list = Array.isArray(messages) ? messages : [];
          for (let i = 0; i < list.length; i++) {
            const msg = list[i];
            const blocks = Array.isArray(msg && msg.blocks) ? msg.blocks : [];
            for (let j = 0; j < blocks.length; j++) {
              const block = blocks[j];
              if (block && block.type === 'tool.approval' && String(block.status || 'pending') === 'pending') return block;
            }
          }
          return null;
        },
        approvalDecisionStatusText(status) {
          return {
            pending: '待审批',
            approved: '已同意',
            rejected: '已拒绝',
            timeout: '已超时',
          }[String(status || 'pending')] || '待审批';
        },
        approvalDecisionStatusIcon(status) {
          return {
            pending: 'loading-four',
            approved: 'check-one',
            rejected: 'close-one',
            timeout: 'close-one',
          }[String(status || 'pending')] || 'loading-four';
        },
        approvalDecisionActionTitle(block) {
          const raw = String((block && (block.actionLabel || block.title)) || '待确认操作').replace(/^是否/, '').trim();
          if (/^删除/.test(raw)) return '删除';
          if (/^移动/.test(raw)) return '移动';
          return raw;
        },
        approvalDecisionRowLabel(block) {
          const status = String((block && block.status) || 'pending');
          const actionTitle = this.approvalDecisionActionTitle(block);
          const objectName = this.approvalDecisionObjectName(block);
          if (status === 'pending') return `待确认，${actionTitle}「${objectName}」需要你允许`;
          if (status === 'rejected') return `已拒绝，未${actionTitle}「${objectName}」`;
          if (status === 'timeout') return `已超时，未${actionTitle}「${objectName}」`;
          if (status === 'approved') return `已允许，已${actionTitle}「${objectName}」`;
          return `待确认，${actionTitle}「${objectName}」需要你允许`;
        },
        approvalDecisionObjectName(block) {
          if (block && block.objectDisplayName) return block.objectDisplayName;
          const title = String((block && block.objectTitle) || '未命名结果');
          return /结果$/.test(title) ? title : `${title}结果`;
        },
        approvalDecisionToolName(block) {
          const payload = block && block.detailJson ? block.detailJson : {};
          return String(
            (block && (block.toolName || block.toolLabel))
            || payload.toolName
            || payload.tool
            || payload['工具']
            || '删除文件或目录工具'
          ).trim();
        },
        approvalDecisionRequestText(block) {
          const action = this.approvalDecisionActionTitle(block);
          const rows = this.approvalDecisionAllObjectRows(block);
          const toolName = this.approvalDecisionToolName(block);
          if (rows.length > 1) return `是否允许调用「${toolName}」${action} ${rows.length} 个对象？`;
          return `是否允许调用「${toolName}」${action}「${this.approvalDecisionObjectName(block)}」？`;
        },
        approvalDecisionRequestParts(block) {
          const action = this.approvalDecisionActionTitle(block);
          const rows = this.approvalDecisionAllObjectRows(block);
          const toolName = this.approvalDecisionToolName(block);
          if (rows.length !== 1) return { text: this.approvalDecisionRequestText(block) };
          const row = rows[0];
          return {
            prefix: `是否允许调用「${toolName}」${action}「`,
            objectName: this.approvalDecisionObjectName(block),
            suffix: '」？',
            row,
            canPreview: action === '删除' && !!(row && row.canPreview),
          };
        },
        approvalDecisionConfirmLabel(block) {
          return '允许';
        },
        approvalDecisionNormalizeObjectRow(block, item, index) {
          const source = item && typeof item === 'object' ? item : {};
          const rawName = typeof item === 'string'
            ? item
            : (source.objectDisplayName || source.name || source.title || source.objectTitle || '');
          const name = String(rawName || (index === 0 ? this.approvalDecisionObjectName(block) : '未命名对象')).trim();
          const meta = String(source.path || source.objectPath || source.meta || (index === 0 && block ? block.path : '') || source.objectType || '').trim();
          const typeText = String(source.objectType || (index === 0 && block ? block.objectType : '') || '').trim();
          const isFolder = /目录|文件夹|folder/i.test(typeText + ' ' + name + ' ' + meta);
          const materialId = String(source.materialId || source.previewMaterialId || (index === 0 && block ? (block.materialId || block.previewMaterialId || '') : '') || '').trim();
          const previewHit = materialId ? (this.wbMaterialVmById ? this.wbMaterialVmById(materialId) : null) : (index === 0 ? this.approvalDecisionResolveMaterial(block) : null);
          return {
            key: String(source.id || source.key || materialId || `${index}-${name}`),
            name,
            meta,
            icon: isFolder ? 'document-folder' : 'file-text',
            iconClass: isFolder ? '' : 'is-result',
            materialId,
            canPreview: !!previewHit,
          };
        },
        approvalDecisionAllObjectRows(block) {
          const items = Array.isArray(block && block.items) && block.items.length ? block.items : [block || {}];
          return items.map((item, index) => this.approvalDecisionNormalizeObjectRow(block, item, index));
        },
        approvalDecisionResolveMaterial(block, row) {
          if (!block) return null;
          const directId = String((row && row.materialId) || block.materialId || block.previewMaterialId || '').trim();
          if (directId) {
            const hit = this.wbMaterialVmById ? this.wbMaterialVmById(directId) : null;
            if (hit) return hit;
          }
          const candidates = Array.from(new Set([
            this.approvalDecisionObjectName(block),
            block.objectDisplayName,
            block.objectTitle,
            String(block.objectTitle || '').replace(/结果$/, ''),
          ].filter(Boolean).map((item) => String(item).trim())));
          return (this.materials || []).find((m) => {
            if (!m || m.type !== 'analysis') return false;
            const title = String(m.title || m.name || '').trim();
            return candidates.includes(title);
          }) || null;
        },
        approvalDecisionCanPreview(block) {
          return !!this.approvalDecisionResolveMaterial(block);
        },
        openApprovalDecisionObjectPreview(block, row) {
          const material = this.approvalDecisionResolveMaterial(block, row);
          if (!material) {
            message.info('该对象暂不可预览');
            return;
          }
          this.openDetailFromTreeTitle({ id: material.id, raw: material }, 'analysis');
        },
        approvalDecisionImpactText(block) {
          if (block && block.impact) return block.impact;
          const action = this.approvalDecisionActionTitle(block);
          if (action === '删除') return '允许后将从结果树移除；拒绝后保留在当前文件夹。';
          if (action === '移动') return '允许后将变更结果树位置；拒绝后保留在当前文件夹。';
          return '允许后操作将立即执行；拒绝后不会变更现有结果。';
        },
        approvalDecisionDetailJson(block) {
          const payload = block && block.detailJson ? block.detailJson : {};
          return JSON.stringify(payload, null, 2);
        },
        approvalDecisionTechnicalFields(block) {
          if (!block) return [];
          const payload = block.detailJson || {};
          const action = this.approvalDecisionActionTitle(block);
          const toolName = this.approvalDecisionToolName(block);
          const toolDisplay = toolName.replace(/工具$/, '');
          const rows = this.approvalDecisionAllObjectRows(block);
          const objectText = rows.length > 1 ? `${rows.length} 个对象` : this.approvalDecisionObjectName(block);
          const objectPath = rows.length > 1
            ? rows.map(row => row.meta || row.name).filter(Boolean).join('\n')
            : ((rows[0] && rows[0].meta) || block.path || payload.object_path || payload.path || '');
          const status = String(block.status || 'pending');
          const timeoutRest = status === 'pending' ? this.approvalDecisionTimeoutRest(block.timeoutLabel || '') : '';
          const timeoutCount = status === 'pending' ? this.approvalDecisionTimeoutRemainingSeconds(block) : '';
          const timeoutText = status === 'pending' && timeoutCount ? `${timeoutCount}${timeoutRest || '秒后自动拒绝'}` : '';
          return [
            { label: '即将执行的操作', value: `${action}（${toolDisplay || toolName}）` },
            { label: '工具', value: toolName },
            { label: '动作', value: action },
            { label: '操作对象', value: objectText },
            { label: '对象位置', value: objectPath },
            { label: '摘要', value: block.summary || payload.summary || action },
            { label: '影响', value: this.approvalDecisionImpactText(block) },
            { label: '审批编号', value: block.approvalId || block.approval_id || block.id },
            { label: '当前状态', value: this.approvalDecisionStatusText(status) },
            { label: '剩余时间', value: timeoutText },
          ].filter(item => String(item.value || '').trim());
        },
        approvalDecisionTechnicalCodeBlocks(block) {
          if (!block) return [];
          const rawBlocks = Array.isArray(block.detailCodeBlocks)
            ? block.detailCodeBlocks
            : (Array.isArray(block.detailBlocks) ? block.detailBlocks : null);
          if (rawBlocks && rawBlocks.length) {
            return rawBlocks.map((item, index) => {
              const source = item && typeof item === 'object' ? item : { code: item };
              const code = typeof source.code === 'string' ? source.code : JSON.stringify(source.code || source, null, 2);
              return {
                title: source.title || source.label || `详情 ${index + 1}`,
                code,
              };
            }).filter(item => String(item.code || '').trim());
          }
          return [{
            title: '详情',
            code: this.approvalDecisionDetailJson(block),
          }];
        },
        approvalDecisionHasDetail(block) {
          if (!block) return false;
          return this.approvalDecisionTechnicalFields(block).length > 0 || this.approvalDecisionTechnicalCodeBlocks(block).length > 0;
        },
        approvalDecisionTimeoutCount(label) {
          const text = String(label || '');
          const match = text.match(/^\d+/);
          return match ? match[0] : '';
        },
        approvalDecisionTimeoutRemainingSeconds(block) {
          if (!block || String(block.status || 'pending') !== 'pending') return '';
          this.approvalDecisionTick;
          const expiresAt = Number(block.timeoutExpiresAt) || 0;
          if (!expiresAt) return this.approvalDecisionTimeoutCount(block.timeoutLabel);
          return String(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
        },
        approvalDecisionTimeoutRest(label) {
          const text = String(label || '');
          const count = this.approvalDecisionTimeoutCount(text);
          return count ? text.slice(count.length) : text;
        },
        approvalDecisionCanToggleDetail(block) {
          return this.approvalDecisionHasDetail(block);
        },
        approvalDecisionDetailExpanded(block) {
          return !!(block && block._approvalDetailExpanded);
        },
        toggleApprovalDecisionDetail(block) {
          if (!block || !this.approvalDecisionCanToggleDetail(block)) return;
          block._approvalDetailExpanded = !block._approvalDetailExpanded;
        },
        approvalDecisionDetailToggleLabel(block) {
          return this.approvalDecisionDetailExpanded(block) ? '收起' : '展开';
        },
        approvalDecisionCanExpand(block) {
          return !!(block && String(block.status || 'pending') !== 'pending');
        },
        approvalDecisionToggleExpand(block) {
          if (!this.approvalDecisionCanExpand(block)) return;
          block._actionDetailExpanded = !block._actionDetailExpanded;
        },
        applyResultTreeDecision(block, status) {
          if (!block) return;
          const next = status === 'approved' ? 'approved' : (status === 'timeout' ? 'timeout' : 'rejected');
          block.status = next;
          block.timeoutLabel = '';
          block.timeoutExpiresAt = 0;
          block._actionDetailExpanded = true;
          if (this.chatComposerDecision === block) this.chatComposerDecision = null;
          this.toastMessage = next === 'approved' ? '已同意，本次操作继续执行' : (next === 'timeout' ? '审批超时，本次操作已自动取消' : '已拒绝，本次操作不执行');
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        updateApprovalDecisionCountdown() {
          this.approvalDecisionTick = Date.now();
          const block = this.chatComposerDecision;
          if (!block || String(block.status || 'pending') !== 'pending') return;
          const expiresAt = Number(block.timeoutExpiresAt) || 0;
          if (expiresAt && expiresAt <= this.approvalDecisionTick) {
            this.applyResultTreeDecision(block, 'timeout');
          }
        },
        buildResultTreeDecisionDemoConversation() {
          const now = Date.now();
          const cleanText = '请帮我删除结果树里「预算测算草稿」下的预算偏差临时表';
          const refs = ['预算测算草稿'];
          const userMsg = {
            id: 'decision-user-' + now,
            role: 'user',
            text: cleanText,
            refCount: refs.length,
            refTitles: refs,
          };
          const toolCalls = [
            {
              type: 'text',
              body: '先确认删除对象是否属于结果树显性对象，再核对同目录下是否已有历史审批记录，避免重复触发敏感变更。',
            },
            {
              type: 'deep_think',
              body: '这次请求会删除结果树里的显性对象，所以需要进入审批流程。处理时按时间顺序回放已有审批：超时记录只保留状态，拒绝记录不重复执行，最后把当前这次真正待确认的删除动作挂到输入区，让用户直接决策。',
            },
            {
              type: 'query',
              text: '定位删除对象：预算测算草稿 / 预算偏差临时表',
              actionDetailBody: [
                '结果树对象定位（演示）',
                '',
                '当前请求对象：',
                '1) 结果 / 预算测算草稿 / 预算偏差临时表',
                '',
                '识别结论：该对象属于结果树显性结果文件，删除前需要用户确认。'
              ].join('\n'),
            },
            {
              type: 'query',
              text: '历史审批记录：1 次超时取消 · 1 次用户拒绝 · 1 次待确认',
              actionDetailBody: [
                '历史审批状态核对（演示）',
                '',
                '第一次：删除「预算偏差临时表-旧版」→ 已超时，默认取消',
                '第二次：删除「预算测算说明-副本」→ 用户拒绝',
                '第三次：删除「预算偏差临时表」→ 当前待确认',
                '',
                '处理规则：前两条仅做历史回放，最后一条进入当前审批态。'
              ].join('\n'),
            },
            {
              type: 'todo',
              contextFileLabel: '结果树敏感变更',
              items: [
                '定位当前删除对象',
                '回放历史审批状态',
                '生成当前待审批动作',
              ],
            },
            {
              type: 'text',
              body: '审批上下文已整理完成。下面先展示两条历史记录，最后保留当前这一条待审批动作。',
            },
          ].map((call) => {
            const cloned = JSON.parse(JSON.stringify(call));
            if (cloned.type === 'todo') {
              cloned.todoDoneFlags = Array.isArray(cloned.items) ? cloned.items.map(() => true) : [];
              cloned._todoUiPhase = 'complete';
              cloned.todoExecutionLog = [];
            }
            return cloned;
          });
          const thinkingMsg = {
            id: 'decision-think-' + now,
            role: 'thinking',
            toolCalls,
            thinkPhaseIndex: toolCalls.length,
            thinkTextChars: 0,
            thinkToolStartedAt: null,
            _demoSendText: cleanText,
            _finalized: true,
            _intervalId: null,
          };
          const summaryMsg = {
            id: 'decision-bot-summary-' + now,
            role: 'bot',
            suppressActions: true,
            plainBotText: true,
            text: [
              '我先核对了当前删除请求和同目录下的历史审批记录。',
              '',
              '前两条只做状态回放，不会再次执行；最后一条才是当前这次删除，需要你确认后我再继续。'
            ].join('\n'),
          };
          const decisionMsg = {
            id: 'decision-bot-records-' + now,
            role: 'bot',
            suppressActions: true,
            blocks: [
              this.buildResultTreeApprovalBlock('timeout', 'timeout', {
                title: '是否删除旧版临时表',
                objectTitle: '预算偏差临时表-旧版',
                objectType: '结果文件',
                path: '结果 / 预算测算草稿 / 预算偏差临时表-旧版',
                impact: '该删除操作上次已超时，系统按默认取消处理，原文件仍保留在结果树中。',
              }),
              this.buildResultTreeApprovalBlock('rejected', 'rejected', {
                title: '是否删除草稿副本',
                objectTitle: '预算测算说明-副本',
                objectType: '结果文件',
                path: '结果 / 预算测算草稿 / 预算测算说明-副本',
                impact: '该删除动作上次被用户拒绝，本次不重复执行，文件继续保留在原位置。',
              }),
              this.buildResultTreeApprovalBlock('pending', 'pending', {
                title: '是否删除结果',
                objectTitle: '预算偏差临时表',
                objectType: '结果文件',
                materialId: 'ar-approval-budget-temp',
                path: '结果 / 预算测算草稿 / 预算偏差临时表',
                impact: '允许后将从结果树移除；拒绝后保留在当前文件夹。',
              }),
            ],
          };
          return [
            userMsg,
            thinkingMsg,
            summaryMsg,
            decisionMsg,
          ];
        },
        loadChatDemoScenario(scenario) {
          if (!scenario || !scenario.id) return;
          this.clearChatThinkingIntervals();
          this.hideChatQueueNotice();
          this.chatComposerDecision = null;
          const refs = this.defaultChatDemoRefTitles();
          const seedText = String(scenario.seedText || '').trim() || '总结当前工作台中的主要疑点';
          if (scenario.kind === 'queued') {
            this.chatMessages = this.buildQueuedDemoConversation(seedText, refs, scenario.queuePosition);
            this.activeChatScenarioId = scenario.id;
            this.chatInput = '';
            this.chatInputRefItems = [];
            this.chatUploadAttachments = [];
            this.$nextTick(() => {
              this.activateChatQueueDemo(scenario.queuePosition);
              const wrap = this.$refs.chatMessages;
              if (wrap) wrap.scrollTop = wrap.scrollHeight;
            });
            return;
          }
          if (scenario.kind === 'result-decision') {
            this.chatMessages = this.buildResultTreeDecisionDemoConversation();
            this.chatComposerDecision = this.findPendingApprovalBlock(this.chatMessages);
            this.activeChatScenarioId = scenario.id;
            this.chatInput = '';
            this.chatInputRefItems = [];
            this.chatUploadAttachments = [];
            this.$nextTick(() => {
              const wrap = this.$refs.chatMessages;
              if (wrap) wrap.scrollTop = wrap.scrollHeight;
            });
            return;
          }
          this.chatMessages = this.buildSeededDemoConversation(seedText, refs);
          this.activeChatScenarioId = scenario.id;
          this.chatInput = '';
          this.chatInputRefItems = [];
          this.chatUploadAttachments = [];
          this.$nextTick(() => {
            const wrap = this.$refs.chatMessages;
            if (wrap) wrap.scrollTop = wrap.scrollHeight;
          });
        },
        onChatHistoryMenuClick(info) {
          const key = info && info.key;
          if (!key) return;
          const session = (this.sessionHistory || []).find((s) => s.id === key);
          if (session) this.restoreSession(session);
        },
        decideResultTreeDecision(msg, status, block) {
          const decision = block || (msg && msg.resultDecision);
          if (!decision || String(decision.status || 'pending') !== 'pending') return;
          this.applyResultTreeDecision(decision, status);
        },
        pauseChatGeneration() {
          this.hideChatQueueNotice();
          const list = this.chatMessages || [];
          for (let i = list.length - 1; i >= 0; i--) {
            const m = list[i];
            if (m.role !== 'bot') continue;
            const introLen = (m.chatIntro || '').length;
            const introGoing = !!(m.chatIntro && introLen && m.chatIntroProgress != null && m.chatIntroProgress < introLen);
            const rs = m.chatRunSummary || '';
            const runGoing = !!(rs.length && (m.chatRunSummaryProgress ?? 0) < rs.length);
            if (!introGoing && !runGoing) continue;
            if (m._chatIntroIv) {
              clearInterval(m._chatIntroIv);
              m._chatIntroIv = null;
            }
            if (introLen) m.chatIntroProgress = introLen;
            if (m._runSummaryStartTid) {
              clearTimeout(m._runSummaryStartTid);
              m._runSummaryStartTid = null;
            }
            if (m._runSummaryIv) {
              clearInterval(m._runSummaryIv);
              m._runSummaryIv = null;
            }
            if (rs.length) m.chatRunSummaryProgress = rs.length;
            this.toastMessage = '已暂停生成';
            setTimeout(() => {
              this.toastMessage = '';
            }, 1500);
            return;
          }
          for (let i = list.length - 1; i >= 0; i--) {
            const m = list[i];
            if (m.role !== 'thinking' || m._finalized) continue;
            if (m._intervalId) {
              clearInterval(m._intervalId);
              m._intervalId = null;
            }
            m._finalized = true;
            m._generationPaused = true;
            this.toastMessage = '已暂停生成';
            setTimeout(() => {
              this.toastMessage = '';
            }, 1500);
            return;
          }
        },
        viewExtractionResult(id) {
          this.clearWorkbenchAnalysisCitationFloats();
          this.selectedExtractionId = id;
          this.sourcesLeftView = 'detail';
          this.sourcesRightView = 'list';
          this.sourcesDetailWidth = 450;
        },
        removeExtractionResult(id) {
          const dc = window.dsConfirm;
          if (!dc || !dc.delete) {
            this._applyRemoveExtractionResult(id);
            return;
          }
          dc.delete({
            subject: '该抽取结果',
            onOk: () => {
              this._applyRemoveExtractionResult(id);
            },
          });
        },
        _applyRemoveExtractionResult(id) {
          this.extractionResults = this.extractionResults.filter((r) => r.id !== id);
          if (this.selectedExtractionId === id) {
            this.selectedExtractionId = null;
            this.selectedTreeNode = null;
            this.sourcesLeftView = 'list';
            this.sourcesWidth = 300;
          }
        },
        importExtractionResult(item) {
          if (item.status !== 'done' || !item.snippets) return;
          const pid = this.workbenchProjectId;
          if (!pid) return;
          const id = 'ar-ext-' + Date.now();
          const title = item.dataSourceName + ' 抽取结果';
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const row = {
            id,
            name: title,
            resultTreeBucket: 'dialog',
            resultFolderId: null,
            sourceSkillName: String(item.dataSourceName || '结构化抽取').trim() || '结构化抽取',
            createdAt: now,
            status: 'done',
          };
          if (!demoProjectAnalysisResultsById[pid]) demoProjectAnalysisResultsById[pid] = [];
          demoProjectAnalysisResultsById[pid].unshift(row);
          const material = mapAnalysisResultRowToWorkbench(row, pid);
          material.excerpts = item.snippets.map((s) => s.title + '\n' + s.desc);
          material.excerptsWithCitations = item.snippets.map((s) => ({ text: s.title + '：' + s.desc, citations: [] }));
          material.overview = '从 ' + item.dataSourceName + ' 抽取的 ' + item.snippets.length + ' 条结果';
          this.materials.push(material);
          this.selectedMaterialId = material.id;
          this.extractionResults = this.extractionResults.filter((r) => r.id !== item.id);
          if (this.selectedExtractionId === item.id) {
            this.selectedExtractionId = null;
            this.selectedTreeNode = null;
            this.sourcesLeftView = 'list';
          }
          this.toastMessage = '已导入到结果';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        goBackToProjectCenter() {
          window.location.hash = 'project' + (this.workbenchProjectId ? '/' + this.workbenchProjectId : '');
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
        goBackToProjectCenterList() {
          window.location.hash = 'project';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
        openWorkbenchProjectEdit() {
          const pid = this.workbenchProjectId;
          if (!pid) return;
          const bridge = window.__demoQuoteSkillBridge;
          if (bridge && typeof bridge.openEditForWorkbenchProject === 'function') {
            bridge.openEditForWorkbenchProject(pid);
            return;
          }
          message.warning('工作台编辑入口暂不可用，请稍后重试');
        },
        onWorkbenchHeaderMenu(info) {
          if (info && info.key === 'edit') this.openWorkbenchProjectEdit();
        },
        enterExperienceDraftMode() {
          this.layoutMode = 'B';
          this.experienceDrafts = { extract: '（抽取技能草案占位）', analysis: '（分析技能草案占位）', report: '（报告技能草案占位）' };
        },
        exitExperienceDraftMode() { this.layoutMode = 'A'; },
        setExcerptRef(sourceId, index, el) {
          if (!el) return;
          if (!this.excerptRefs[sourceId]) this.excerptRefs[sourceId] = {};
          this.excerptRefs[sourceId][index] = el;
        },
        wbFileIconSuffixFromFormatName(format, fileName) {
          const api = window.DemoFileIcons;
          if (api && typeof api.iconFor === 'function') return api.iconFor(format, fileName).iconName;
          return 'file-lines';
        },
        getMaterialIcon(m) {
          if (!m) return 'file-lines';
          if (m.type === 'raw') {
            if (m.rawSubtype === 'table') return 'file-sheet';
            const ps = m.projectSource || {};
            return this.wbFileIconSuffixFromFormatName(m.format || ps.format, m.title || ps.name);
          }
          if (m.type === 'analysis') {
            const ps = m.projectSource || {};
            const fmt = String((m.format || ps.format) || '').toUpperCase();
            const name = String(m.title || ps.name || '').trim();
            if (fmt === 'CSV') return 'file-sheet';
            if (fmt === 'MD' || fmt === 'MARKDOWN' || /\.md$/i.test(name)) return 'file-lines';
            return 'file-lines';
          }
          return 'file-lines';
        },
        getMaterialIconColorClass(m) {
          if (!m) return '';
          if (m.type === 'analysis' && this.workbenchAnalysisStatusOf(m) !== 'done') return '';
          const ps = m.projectSource || {};
          const name = String(m.title || ps.name || '').trim();
          const fmt = String((m.format || ps.format) || '').toUpperCase();
          if (fmt === 'MD' || fmt === 'MARKDOWN') return m.type === 'analysis' ? 'is-markdown' : 'is-md';
          if (fmt === 'CSV') return 'is-sheet';
          const api = window.DemoFileIcons;
          if (api && typeof api.iconFor === 'function') {
            const meta = api.iconFor(m.format || ps.format, name);
            if (meta.group === 'text' && /\.md$/i.test(name)) return m.type === 'analysis' ? 'is-markdown' : 'is-md';
            if (meta.toneClass) return meta.toneClass;
          }
          if (m.type === 'analysis') {
            if (/\.md$/i.test(name)) return 'is-markdown';
            return 'is-markdown';
          }
          return '';
        },
        workbenchMaterialStatusOf(m) {
          const status = (m && m.projectSource && m.projectSource.status) || (m && m.status) || 'queued';
          if (status === 'queued' || status === 'parsing' || status === 'done' || status === 'failed') return status;
          return 'queued';
        },
        workbenchAnalysisStatusOf(m) {
          const status = (m && m.projectSource && m.projectSource.status) || (m && m.status) || 'done';
          if (status === 'queued' || status === 'parsing' || status === 'done' || status === 'failed') return status;
          return 'done';
        },
        canOpenAnalysisPreview(m) {
          if (!m || m.type !== 'analysis') return true;
          return this.workbenchAnalysisStatusOf(m) === 'done';
        },
        canOpenMaterialPreview(m) {
          return !!m;
        },
        workbenchMaterialProgressOf(m) {
          const p = Number((m && m.projectSource && m.projectSource.progress) ?? (m && m.progress) ?? 0);
          if (Number.isNaN(p)) return 0;
          return Math.max(0, Math.min(100, p));
        },
        workbenchMaterialProgressStatus(m) {
          const status = this.workbenchMaterialStatusOf(m);
          if (status === 'failed') return 'exception';
          if (status === 'done') return 'success';
          return 'active';
        },
        isWorkbenchMaterialDone(m) {
          return this.workbenchMaterialStatusOf(m) === 'done';
        },
        filteredWorkbenchRawMaterials(rawRows) {
          const rows = Array.isArray(rawRows) ? rawRows : [];
          const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
          const timeOf = (v) => {
            const t = Date.parse(String(v || '').trim());
            return Number.isNaN(t) ? 0 : t;
          };
          return [...rows].sort((a, b) => {
            const aSource = a.projectSource || {};
            const bSource = b.projectSource || {};
            const byName = () => collator.compare(String(a.title || ''), String(b.title || ''));
            return timeOf(bSource.uploadedAt || b.meta) - timeOf(aSource.uploadedAt || a.meta) || byName();
          });
        },
        rerunWorkbenchMaterial(m) {
          if (!m || (m.type && m.type !== 'raw') || !this.workbenchProjectId) return;
          const dc = window.dsConfirm;
          if (!dc || !dc.action) {
            this._applyRerunWorkbenchMaterial(m);
            return;
          }
          dc.action({
            title: '重跑该资料？',
            content: '将重新进入解析队列。',
            okText: '重跑',
            onOk: () => {
              this._applyRerunWorkbenchMaterial(m);
            },
          });
        },
        _applyRerunWorkbenchMaterial(m) {
          const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
          const idx = arr.findIndex((x) => x.id === m.id);
          if (idx < 0) return;
          this._clearWorkbenchParseTimers(m.id);
          arr.splice(idx, 1, { ...arr[idx], status: 'parsing', progress: 12 });
          if (m.projectSource) {
            m.projectSource.status = 'parsing';
            m.projectSource.progress = 12;
          }
          this._startWorkbenchParseSimulation([m.id], 'parsing');
          this.toastMessage = '已加入重跑队列';
          setTimeout(() => { this.toastMessage = ''; }, 1200);
        },
        _markWorkbenchMaterialFailed(m, projectRow) {
          const applyFailed = (row) => {
            if (!row || typeof row !== 'object') return;
            row.status = 'failed';
            row.progress = 0;
          };
          applyFailed(projectRow);
          if (m.projectSource && m.projectSource !== projectRow) applyFailed(m.projectSource);
          applyFailed(m);
        },
        abortWorkbenchMaterial(m) {
          if (!m || (m.type && m.type !== 'raw') || !this.workbenchProjectId) return;
          const st = this.workbenchMaterialStatusOf(m);
          if (st !== 'parsing' && st !== 'queued') return;
          const dc = window.dsConfirm;
          if (!dc || !dc.action) {
            this._applyAbortWorkbenchMaterial(m);
            return;
          }
          dc.action({
            title: '中止该资料？',
            content: '中止后将标记为失败。',
            okText: '中止',
            onOk: () => {
              this._applyAbortWorkbenchMaterial(m);
            },
          });
        },
        _applyAbortWorkbenchMaterial(m, toastText) {
          const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
          const idx = arr.findIndex((x) => x && String(x.id) === String(m.id));
          if (idx < 0) return;
          this._clearWorkbenchParseTimers(m.id);
          this._markWorkbenchMaterialFailed(m, arr[idx]);
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          if (toastText !== false) {
            this.toastMessage = typeof toastText === 'string' ? toastText : '已中止，状态已标记为失败';
            setTimeout(() => { this.toastMessage = ''; }, 1200);
          }
        },
        _setWorkbenchBatchToast(text, timeout = 1200) {
          this.toastMessage = text;
          setTimeout(() => { this.toastMessage = ''; }, timeout);
        },
        onWorkbenchMaterialBatchMenu(info) {
          const key = info && info.key;
          if (key === 'abort') this.batchAbortWorkbenchMaterials();
          else if (key === 'rerun') this.batchRerunWorkbenchMaterials();
          else if (key === 'delete') this.batchClearWorkbenchMaterials();
        },
        batchAbortWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          const view = this.workbenchMaterialStatusView || 'all';
          if (!targets.length || (view !== 'parsing' && view !== 'queued') || !this.workbenchProjectId) return;
          const n = targets.length;
          const dc = window.dsConfirm;
          if (!dc || !dc.action) {
            this._applyBatchAbortWorkbenchMaterials();
            return;
          }
          dc.action({
            title: `中止已选 ${n} 项资料？`,
            content: '中止后将标记为失败。',
            okText: '中止',
            onOk: () => {
              this._applyBatchAbortWorkbenchMaterials();
            },
          });
        },
        _applyBatchAbortWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
          if (!arr.length) return;
          const idSet = new Set(targets.map((m) => m.id));
          let changed = 0;
          arr.forEach((row) => {
            if (!row || !idSet.has(row.id)) return;
            const st = String(row.status || '');
            if (st !== 'parsing' && st !== 'queued') return;
            const vm = (this.materials || []).find((m) => m && String(m.id) === String(row.id));
            if (vm) this._markWorkbenchMaterialFailed(vm, row);
            else {
              row.status = 'failed';
              row.progress = 0;
            }
            changed += 1;
          });
          if (!changed) return;
          this.workbenchDemoRefreshTick = (this.workbenchDemoRefreshTick || 0) + 1;
          this._setWorkbenchBatchToast(`已中止 ${changed} 个资料，状态已标记为失败`);
        },
        batchRerunWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          const view = this.workbenchMaterialStatusView || 'all';
          if (!targets.length || (view !== 'parsing' && view !== 'failed') || !this.workbenchProjectId) return;
          const n = targets.length;
          const dc = window.dsConfirm;
          if (!dc || !dc.action) {
            this._applyBatchRerunWorkbenchMaterials();
            return;
          }
          dc.action({
            title: `重跑已选 ${n} 项资料？`,
            content: '将重新进入解析队列。',
            okText: '重跑',
            onOk: () => {
              this._applyBatchRerunWorkbenchMaterials();
            },
          });
        },
        _applyBatchRerunWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
          if (!arr.length) return;
          const idSet = new Set(targets.map((m) => m.id));
          let changed = 0;
          arr.forEach((row) => {
            if (!row || !idSet.has(row.id)) return;
            row.status = 'parsing';
            row.progress = 12;
            changed += 1;
          });
          if (!changed) return;
          (this.materials || []).forEach((m) => {
            if (!m || !idSet.has(m.id)) return;
            if (m.projectSource) {
              m.projectSource.status = 'parsing';
              m.projectSource.progress = 12;
            } else {
              m.status = 'parsing';
              m.progress = 12;
            }
          });
          this._setWorkbenchBatchToast(`已重跑 ${changed} 个资料`);
        },
        batchClearWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          if (!targets.length || !this.workbenchProjectId) return;
          const n = targets.length;
          const dc = window.dsConfirm;
          if (!dc || !dc.delete) {
            this._applyBatchClearWorkbenchMaterials();
            return;
          }
          dc.delete({
            title: `删除已选 ${n} 项资料？`,
            kind: 'default',
            onOk: () => {
              this._applyBatchClearWorkbenchMaterials();
            },
          });
        },
        _applyBatchClearWorkbenchMaterials() {
          const targets = this.workbenchMaterialBatchTargets || [];
          const idSet = new Set(targets.map((m) => m.id));
          const arr = demoProjectMaterialsById[this.workbenchProjectId] || [];
          if (arr.length) {
            for (let i = arr.length - 1; i >= 0; i -= 1) {
              if (idSet.has(arr[i].id)) arr.splice(i, 1);
            }
          }
          const removedSelected = this.selectedMaterialId && idSet.has(this.selectedMaterialId);
          for (let i = (this.materials || []).length - 1; i >= 0; i -= 1) {
            if (idSet.has(this.materials[i].id)) this.materials.splice(i, 1);
          }
          if (removedSelected) {
            const next = (this.workbenchRawMaterialsForTree || [])[0] || this.materials[0] || null;
            this.selectedMaterialId = next ? next.id : null;
            if (!next) {
              this.selectedTreeNode = null;
              this.sourcesLeftView = 'list';
            }
          }
          this._setWorkbenchBatchToast(`已清空 ${targets.length} 个资料`, 1500);
        },
        materialMeta(m) {
          if (!m) return '—';
          if (m.meta) return m.meta;
          if (m.createdAt) return typeof m.createdAt === 'string' ? m.createdAt : '—';
          return '—';
        },
        noop() {},
        toggleAllMaterials() {
          const checked = !this.allMaterialsChecked;
          this.materials.forEach(m => { m.checked = checked; });
        },
        handleMaterialMenuClick(key, m) {
          if (!m) return;
          if (key === 'rerun') {
            if (m.type && m.type !== 'raw') return;
            this.rerunWorkbenchMaterial(m);
            return;
          }
          if (key === 'delete') {
            if ((this.workbenchCreatedTasks || []).some((t) => t && t.id === m.id)) {
              this.deleteWorkbenchCreatedTask(m);
              return;
            }
            this.deleteMaterial(m);
          }
        },
        deleteWorkbenchCreatedTask(m) {
          if (!m || !m.id) return;
          const isBatchParent = this.isWorkbenchBatchParentTask(m);
          const dc = window.dsConfirm;
          const run = () => {
            this.workbenchCreatedTasks = (this.workbenchCreatedTasks || []).filter((t) => t.id !== m.id);
            if (this.wbActiveBatchParentId === m.id) {
              this.exitBatchChildListView();
            }
            if (this.selectedMaterialId === m.id) {
              this.closeWorkbenchMaterialDetail();
            }
            this.selectedTreeNode = null;
            message.success('任务已删除');
          };
          if (!dc || !dc.delete) {
            run();
            return;
          }
          dc.delete({
            title: isBatchParent ? '删除跑批任务？' : '删除任务？',
            kind: 'task',
            taskBatch: isBatchParent,
            onOk: run,
          });
        },
        rerunWorkbenchCreatedTask(m) {
          if (!m || !m.id) return;
          if (this.isWorkbenchPackageDownloadTask && this.isWorkbenchPackageDownloadTask(m)) {
            this.openWorkbenchTaskRerunConfirm(m, 'package');
            return;
          }
          if (this.isWorkbenchBatchChildTask(m)) {
            if (!this.batchChildCanRerun(m)) return;
            this.openWorkbenchTaskRerunConfirm(m, 'batch-child');
            return;
          }
          this.openWorkbenchTaskRerunConfirm(m, 'task');
        },
        abortWorkbenchCreatedTask(m) {
          if (!m || !m.id) return;
          const st = this.workbenchAnalysisStatusOf(m);
          if (st !== 'queued' && st !== 'parsing') return;
          const isChild = this.isWorkbenchBatchChildTask(m);
          window.dsConfirm.action({
            title: isChild ? '中止子任务？' : '中止任务？',
            content: '中止后任务将停止执行，可稍后重新发起。',
            okText: '中止',
            onOk: () => {
              const t = this.resolveCreatedWorkbenchTaskRef(m);
              if (!t) return;
              this.clearBatchChildRerunTimers(t);
              this.setWorkbenchTaskStatus(t, 'failed');
              const parent = this.findWorkbenchBatchParentOfChild(t);
              if (parent) this.syncBatchParentStatus(parent);
              message.info('已中止');
            },
          });
        },
        deleteMaterial(m) {
          if (!m) return;
          const dc = window.dsConfirm;
          if (!dc || !dc.delete) {
            this._applyDeleteMaterial(m);
            return;
          }
          dc.delete({
            subject: '该资料',
            onOk: () => {
              this._applyDeleteMaterial(m);
            },
          });
        },
        _applyDeleteMaterial(m, toastText) {
          const pid = this.workbenchProjectId;
          if (m && m.projectSource && pid) {
            if (m.type === 'analysis') {
              const arr = demoProjectAnalysisResultsById[pid];
              if (arr) {
                const j = arr.findIndex((x) => x.id === m.id);
                if (j >= 0) arr.splice(j, 1);
              }
            } else {
              const arr = demoProjectMaterialsById[pid];
              if (arr) {
                const j = arr.findIndex((x) => x.id === m.id);
                if (j >= 0) arr.splice(j, 1);
              }
            }
          }
          const i = this.materials.findIndex((x) => x.id === m.id);
          if (i < 0) return;
          this.materials.splice(i, 1);
          if (this.selectedMaterialId === m.id) {
            const next = this.materials[i] || this.materials[i - 1];
            this.selectedMaterialId = next ? next.id : null;
            if (!next) {
              this.selectedTreeNode = null;
              this.sourcesLeftView = 'list';
            }
          }
          if (toastText !== false) {
            this.toastMessage = typeof toastText === 'string' ? toastText : '已删除资料';
            setTimeout(() => { this.toastMessage = ''; }, 1500);
          }
        },
        openWorkbenchTreeItemMetaEdit(m, sectionKey) {
          if (!m) return;
          const ps = m.projectSource;
          if (!ps || !ps.id) {
            message.info('该条目暂不支持在此编辑');
            return;
          }
          if (sectionKey === 'material' && m.type === 'raw') {
            this.openWorkbenchProjectMaterialMetaEdit(ps);
            return;
          }
          if (sectionKey === 'analysis' && m.type === 'analysis') {
            this.openWorkbenchAnalysisResultMetaEdit(ps);
            return;
          }
          message.info('该条目暂不支持在此编辑');
        },
        openMaterialDetail(m) {
          if (m && m.loading) return;
          if (this.isWorkbenchBatchParentTask(m)) {
            this.enterBatchChildListView(m);
            return;
          }
          if (!this.canOpenMaterialPreview(m)) {
            message.info('该资料尚未完成解析，暂不可预览');
            return;
          }
          const isEphemeralBenchTask =
            !!(m && Array.isArray(this.workbenchCreatedTasks) && this.workbenchCreatedTasks.some((t) => t && t.id === m.id));
          /** 与 selectedMaterialIsWorkbenchCreatedTask 一致：含演示任务行，否则默认页签会落到不存在的「输出结果」导致首屏空白 */
          const isWorkbenchTaskSidebarRow =
            isEphemeralBenchTask ||
            !!(m && Array.isArray(this.workbenchTaskDemoRows) && this.workbenchTaskDemoRows.some((t) => t && t.id === m.id));
          if (!isWorkbenchTaskSidebarRow && !this.canOpenAnalysisPreview(m)) {
            message.info('该结果尚未完成，暂不可预览');
            return;
          }
          this.clearWorkbenchAnalysisCitationFloats();
          this.workbenchAnalysisEmbedDraft = '';
          this._workbenchAnalysisEmbedSnap = '';
          /** 先于页签状态写入，便于任务详情下 task-config / basic 等 v-if 与 Tabs activeKey 对齐 */
          this.selectedMaterialId = m.id;
          if (m.type === 'analysis') {
            this.wbMaterialPreviewActiveTab = 'basic';
            this.wbAnalysisResultPreviewActiveTab = 'basic';
          } else {
            this.wbMaterialPreviewActiveTab = 'preview';
            this.wbAnalysisResultPreviewActiveTab = 'basic';
          }
          this.studioCollapsed = false;
          if (m.type === 'analysis') {
            this.lastDetailFocus = 'right';
            this.sourcesRightView = 'detail';
            this.sourcesLeftView = 'list';
          } else {
            this.lastDetailFocus = 'left';
            this.sourcesLeftView = 'detail';
            this.sourcesRightView = 'list';
            this.sourcesDetailWidth = 450;
          }
          if (m.type === 'analysis') {
            this.$nextTick(() => this.resetWorkbenchAnalysisEmbedDraftFromPreview());
          }
        },
        closeWorkbenchMaterialDetail() {
          this.clearWorkbenchAnalysisCitationFloats();
          this.workbenchAnalysisEmbedDraft = '';
          this._workbenchAnalysisEmbedSnap = '';
          if (this.sourcesRightView === 'detail' && this.selectedMaterial && this.selectedMaterial.type === 'analysis') {
            this.sourcesRightView = 'list';
          } else {
            this.sourcesLeftView = 'list';
          }
          this.selectedTreeNode = null;
          this.sourcesWidth = 300;
        },
        clearWorkbenchAnalysisCitationFloats() {
          this.workbenchAnalysisCitationPopover = { show: false, title: '', excerpt: '', x: 0, y: 0 };
          if (this.workbenchAnalysisCitationPopoverTimer) {
            window.clearTimeout(this.workbenchAnalysisCitationPopoverTimer);
            this.workbenchAnalysisCitationPopoverTimer = null;
          }
        },
        showWorkbenchAnalysisCitationPopoverByKey(key, rect) {
          const map = this.workbenchAnalysisCitationMap || {};
          const data = map[key];
          if (!data) return;
          if (this.workbenchAnalysisCitationPopoverTimer) {
            window.clearTimeout(this.workbenchAnalysisCitationPopoverTimer);
            this.workbenchAnalysisCitationPopoverTimer = null;
          }
          let x = rect.left;
          let y = rect.bottom + 4;
          const maxW = 320;
          const maxH = 220;
          if (x + maxW > window.innerWidth) x = window.innerWidth - maxW - 8;
          if (x < 8) x = 8;
          if (y + maxH > window.innerHeight) y = rect.top - maxH - 4;
          if (y < 8) y = 8;
          const title = `${key} · ${data.sourceLabel || '溯源信息'}`;
          const excerpt = String(data.sourceExcerpt || data.sourceFullText || '').trim() || '暂无溯源内容';
          this.workbenchAnalysisCitationPopover = { show: true, title, excerpt, x, y };
        },
        onWorkbenchAnalysisPreviewCitationHover(event) {
          const el = event && event.target ? event.target.closest('.analysis-inline-citation') : null;
          if (!el) return;
          const key = String(el.getAttribute('data-cite') || '').trim();
          if (!key) return;
          this.showWorkbenchAnalysisCitationPopoverByKey(key, el.getBoundingClientRect());
        },
        onWorkbenchAnalysisPreviewCitationLeave() {
          this.workbenchAnalysisCitationPopoverTimer = window.setTimeout(() => {
            this.workbenchAnalysisCitationPopover = { show: false, title: '', excerpt: '', x: 0, y: 0 };
            this.workbenchAnalysisCitationPopoverTimer = null;
          }, 120);
        },
        onWorkbenchAnalysisCitationPopoverEnter() {
          if (this.workbenchAnalysisCitationPopoverTimer) {
            window.clearTimeout(this.workbenchAnalysisCitationPopoverTimer);
            this.workbenchAnalysisCitationPopoverTimer = null;
          }
        },
        onWorkbenchAnalysisCitationPopoverLeave() {
          this.onWorkbenchAnalysisPreviewCitationLeave();
        },
        workbenchAnalysisDialogueSourceLineFromRecord(r) {
          if (!r) return '';
          const base = '初始结果通过对话生成';
          const who = String(r.analysisMarkdownEditedBy || '').trim();
          const when = String(r.analysisMarkdownEditedAt || '').trim();
          if (who && when) return `${base}（${who} 于 ${when} 编辑）`;
          return base;
        },
        workbenchAnalysisResultBasicMetaLine(record) {
          const r = record || {};
          const when = this.wbToOverviewMetaValue(r.createdAt, '—');
          return `${when} 生成`;
        },
        workbenchAnalysisMarkdownFromMaterial(m) {
          if (!m || m.type !== 'analysis') return '';
          if (m.analysisMarkdown) return m.analysisMarkdown;
          const ps = m.projectSource || {};
          return buildAnalysisResultPreviewMarkdown({ name: m.title || ps.name, createdAt: m.meta || ps.createdAt });
        },
        pushWorkbenchAnalysisVersionEntry(resultId, label, markdown, savedAt, sourceSummary) {
          if (!resultId || markdown == null) return;
          const key = `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          const at =
            savedAt != null && String(savedAt).trim()
              ? String(savedAt).trim()
              : new Date().toISOString().slice(0, 19).replace('T', ' ');
          const sum = String(sourceSummary || '').trim();
          const prev = (this.workbenchAnalysisVersionHistoryById || {})[resultId] || [];
          const next = [
            {
              key,
              label: String(label || '快照').trim() || '快照',
              markdown: String(markdown),
              savedAt: at,
              ...(sum ? { sourceSummary: sum } : {}),
            },
            ...prev,
          ].slice(0, 30);
          this.workbenchAnalysisVersionHistoryById = { ...(this.workbenchAnalysisVersionHistoryById || {}), [resultId]: next };
        },
        ensureWorkbenchAnalysisVersionHistoryForSelected() {
          const m = this.selectedMaterial;
          if (!m || m.type !== 'analysis') return;
        },
        ensureWorkbenchAnalysisVersionHistoryForRecord(record) {
          const r = record || this.wbAnalysisModalRecord;
          if (!r || !r.id) return;
        },
        closeWorkbenchAnalysisHistoryDiff() {
          this.wbAnalysisHistoryDiffOpen = false;
          this.wbAnalysisHistoryDiffLines = [];
          this.wbAnalysisHistoryDiffTruncated = false;
        },
        workbenchAnalysisResolveMaterialNameById(materialId) {
          const id = String(materialId || '').trim();
          if (!id) return '';
          const rows = this.materials || [];
          const r = rows.find((x) => x && String(x.id) === id);
          return (r && r.title) ? String(r.title).trim() : id;
        },
        openWbAnalysisVersionDetail(record) {
          if (!record) return;
          this.wbAnalysisVersionDetailMarkdown = String(record.markdown || '');
          this.wbAnalysisVersionDetailVisible = true;
        },
        closeWbAnalysisVersionDetail() {
          this.wbAnalysisVersionDetailVisible = false;
          this.wbAnalysisVersionDetailMarkdown = '';
        },
        openWorkbenchAnalysisHistoryDiff(record, scope) {
          if (!record || record.key === '_current') {
            message.info('已为当前版本');
            return;
          }
          const hist = String(record.markdown ?? '');
          const cur =
            scope === 'modal'
              ? String(this.wbAnalysisModalPreviewMarkdown || '')
              : String(this.workbenchAnalysisPreviewMarkdown || '');
          const { lines, truncated } = demoLinesUnifiedDiff(hist, cur, { maxOut: 500 });
          this.wbAnalysisHistoryDiffLines = lines;
          this.wbAnalysisHistoryDiffTruncated = truncated;
          this.wbAnalysisHistoryDiffOpen = true;
        },
        onWbAnalysisModalTabUpdate(key) {
          const next = String(key || 'basic');
          if (next === String(this.wbAnalysisModalActiveTab)) return;
          if (String(this.wbAnalysisModalActiveTab) === 'body' && this.wbAnalysisModalEmbedDirty && next !== 'body') {
            window.dsConfirm.action({
              title: '有未保存的编辑',
              content: '切换页签将放弃对正文的未保存修改，是否继续？',
              okText: '放弃并切换',
              cancelText: '留在本页',
              onOk: () => {
                this.cancelWbAnalysisModalEmbedEdit();
                if (next === 'history') this.ensureWorkbenchAnalysisVersionHistoryForRecord(this.wbAnalysisModalRecord);
                this.wbAnalysisModalActiveTab = next;
              },
            });
            return;
          }
          if (next === 'history') this.ensureWorkbenchAnalysisVersionHistoryForRecord(this.wbAnalysisModalRecord);
          this.wbAnalysisModalActiveTab = next;
        },
        applyWorkbenchAnalysisMarkdownRollbackById(resultId, md) {
          const pid = this.workbenchProjectId;
          const id = String(resultId || '');
          if (!id || !pid) return;
          const m = (this.materials || []).find((x) => x && x.type === 'analysis' && String(x.id) === id);
          const text = String(md ?? '');
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          const patch = {
            analysisMarkdown: text,
            analysisMarkdownEditedBy: '我',
            analysisMarkdownEditedAt: now,
          };
          const rows = demoProjectAnalysisResultsById[pid];
          if (Array.isArray(rows)) {
            const idx = rows.findIndex((r) => r && r.id === id);
            if (idx >= 0) rows.splice(idx, 1, { ...rows[idx], ...patch });
          }
          if (m) {
            m.analysisMarkdown = text;
            if (m.projectSource) Object.assign(m.projectSource, patch);
          }
          if (this.wbAnalysisModalOpen && this.wbAnalysisModalRecord && this.wbAnalysisModalRecord.id === id) {
            this.wbAnalysisModalRecord = { ...this.wbAnalysisModalRecord, ...patch };
          }
          this.resetWorkbenchAnalysisEmbedDraftFromPreview();
          this.resetWbAnalysisModalEmbedDraftFromPreview();
          message.success('已回退到所选版本');
        },
        onWorkbenchAnalysisResultPreviewTabUpdate(key) {
          const next = String(key || 'basic');
          if (next === String(this.wbAnalysisResultPreviewActiveTab)) return;
          if (String(this.wbAnalysisResultPreviewActiveTab) === 'body' && this.workbenchAnalysisEmbedDirty && next !== 'body') {
            window.dsConfirm.action({
              title: '有未保存的编辑',
              content: '切换页签将放弃对正文的未保存修改，是否继续？',
              okText: '放弃并切换',
              cancelText: '留在本页',
              onOk: () => {
                this.cancelWorkbenchAnalysisEmbedEdit();
                if (next === 'history') this.ensureWorkbenchAnalysisVersionHistoryForSelected();
                this.wbAnalysisResultPreviewActiveTab = next;
              },
            });
            return;
          }
          if (next === 'history') this.ensureWorkbenchAnalysisVersionHistoryForSelected();
          this.wbAnalysisResultPreviewActiveTab = next;
        },
        resetWorkbenchAnalysisEmbedDraftFromPreview() {
          const md = String(this.workbenchAnalysisPreviewMarkdown || '');
          this.workbenchAnalysisEmbedDraft = md;
          this._workbenchAnalysisEmbedSnap = md;
        },
        resetWbAnalysisModalEmbedDraftFromPreview() {
          const md = String(this.wbAnalysisModalPreviewMarkdown || '');
          this.wbAnalysisModalEmbedDraft = md;
          this._wbAnalysisModalEmbedSnap = md;
        },
        cancelWorkbenchAnalysisEmbedEdit() {
          this.workbenchAnalysisEmbedDraft = String(this._workbenchAnalysisEmbedSnap ?? '');
        },
        saveWorkbenchAnalysisEmbedEdit() {
          const m = this.selectedMaterial;
          const pid = this.workbenchProjectId;
          if (!m || m.type !== 'analysis' || !pid) return;
          if (String((m.projectSource && m.projectSource.format) || m.format || 'MD').toUpperCase() === 'CSV') return;
          const oldMd = this.workbenchAnalysisMarkdownFromMaterial(m);
          const md = String(this.workbenchAnalysisEmbedDraft ?? '');
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          if (oldMd !== md) {
            this.pushWorkbenchAnalysisVersionEntry(m.id, `${now} · 保存前`, oldMd, now, '编辑前版本');
          }
          const patch = {
            analysisMarkdown: md,
            analysisMarkdownEditedBy: '我',
            analysisMarkdownEditedAt: now,
          };
          const id = m.id;
          const list = demoProjectAnalysisResultsById[pid];
          if (Array.isArray(list)) {
            const idx = list.findIndex((r) => r && r.id === id);
            if (idx >= 0) {
              list.splice(idx, 1, { ...list[idx], ...patch });
            }
          }
          m.analysisMarkdown = md;
          if (m.projectSource) Object.assign(m.projectSource, patch);
          if (this.wbAnalysisModalOpen && this.wbAnalysisModalRecord && this.wbAnalysisModalRecord.id === id) {
            this.wbAnalysisModalRecord = { ...this.wbAnalysisModalRecord, ...patch };
            this.$nextTick(() => this.resetWbAnalysisModalEmbedDraftFromPreview());
          }
          this._workbenchAnalysisEmbedSnap = md;
          message.success('保存成功');
        },
        copyWorkbenchAnalysisEmbedPreview() {
          if (!this.workbenchSelectedAnalysisResultRow) return;
          if (String(this.workbenchSelectedAnalysisResultRow.format || 'MD').toUpperCase() === 'CSV') return;
          const text = String(this.workbenchAnalysisEmbedDraft ?? '');
          const ok = () => message.success('已复制到剪贴板');
          const fail = () => message.warning('复制失败');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(ok).catch(fail);
          } else {
            try {
              const ta = document.createElement('textarea');
              ta.value = text;
              ta.style.cssText = 'position:fixed;left:-9999px;top:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              ok();
            } catch (_) {
              fail();
            }
          }
        },
        simulateWorkbenchAnalysisResultExport(format) {
          const map = { md: 'Markdown', pdf: 'PDF', docx: 'Word', csv: 'CSV' };
          const label = map[format] || format;
          message.success(`已开始下载为 ${label}`);
        },
        onWorkbenchAnalysisResultToolbarExportMenu(info, scope) {
          const key = info && info.key;
          if (!key || String(key).indexOf('export-') !== 0) return;
          const fmt = String(key).slice('export-'.length);
          if (fmt !== 'md' && fmt !== 'pdf' && fmt !== 'docx' && fmt !== 'csv') return;
          const record = scope === 'modal' ? this.wbAnalysisModalRecord : this.workbenchSelectedAnalysisResultRow;
          const allowed = String((record && record.format) || 'MD').toUpperCase() === 'CSV' ? ['csv'] : ['md', 'pdf', 'docx'];
          if (!allowed.includes(fmt)) return;
          if (scope === 'embed') {
            if (!this.workbenchSelectedAnalysisResultRow || this.workbenchEmbedAnalysisOutputToolbarDisabled) return;
          } else if (scope === 'modal') {
            if (!this.wbAnalysisModalRecord) return;
          } else {
            return;
          }
          this.simulateWorkbenchAnalysisResultExport(fmt);
        },
        openWorkbenchAnalysisResultMetaEdit(record) {
          if (!record || !record.id) return;
          this.wbAnalysisResultMetaEditForm = {
            name: String(record.name || '').trim(),
          };
          this.wbAnalysisResultMetaEditTargetId = record.id;
          this.wbAnalysisResultMetaEditVisible = true;
        },
        closeWorkbenchAnalysisResultMetaEdit() {
          this.wbAnalysisResultMetaEditVisible = false;
          this.wbAnalysisResultMetaEditTargetId = '';
        },
        confirmWorkbenchAnalysisResultMetaEdit() {
          const id = this.wbAnalysisResultMetaEditTargetId;
          const pid = this.workbenchProjectId;
          const name = String((this.wbAnalysisResultMetaEditForm && this.wbAnalysisResultMetaEditForm.name) || '').trim();
          if (!pid || !id) return;
          if (!name) {
            message.warning('请填写结果名称');
            return;
          }
          const rows = demoProjectAnalysisResultsById[pid] || [];
          const idx = rows.findIndex((x) => x.id === id);
          if (idx < 0) return;
          rows.splice(idx, 1, { ...rows[idx], name });
          const m = (this.materials || []).find((x) => x.id === id && x.type === 'analysis');
          if (m) {
            m.title = name;
            if (m.projectSource) {
              m.projectSource = { ...m.projectSource, name };
            }
          }
          if (this.wbAnalysisModalRecord && this.wbAnalysisModalRecord.id === id) {
            this.wbAnalysisModalRecord = { ...this.wbAnalysisModalRecord, name };
          }
          this.closeWorkbenchAnalysisResultMetaEdit();
          message.success('已重命名');
        },
        wbToOverviewMetaValue(v, fallback = '—') {
          const s = String(v == null ? '' : v).trim();
          return s || fallback;
        },
        wbMaterialPreviewSizeFormatLine(record) {
          const r = record || {};
          const sizePart =
            r.size == null || r.size === ''
              ? '—'
              : `${Number(r.size).toFixed(1)} MB`;
          const fmt = String(r.format || '').trim() || '—';
          return `大小 ${sizePart} · 格式 ${fmt}`;
        },
        wbMaterialPreviewBasicMetaLine(record) {
          const r = record || {};
          const who = String(r.uploader || r.uploadedBy || '').trim() || '—';
          const when = this.wbToOverviewMetaValue(r.uploadedAt, '—');
          return `${who} 于 ${when} 上传`;
        },
        clearWbAnalysisModalCitationFloats() {
          this.wbAnalysisModalCitationPopover = { show: false, title: '', excerpt: '', x: 0, y: 0 };
          if (this.wbAnalysisModalCitationPopoverTimer) {
            window.clearTimeout(this.wbAnalysisModalCitationPopoverTimer);
            this.wbAnalysisModalCitationPopoverTimer = null;
          }
        },
        showWbAnalysisModalCitationPopoverByKey(key, rect) {
          const map = this.wbAnalysisModalCitationMap || {};
          const data = map[key];
          if (!data) return;
          if (this.wbAnalysisModalCitationPopoverTimer) {
            window.clearTimeout(this.wbAnalysisModalCitationPopoverTimer);
            this.wbAnalysisModalCitationPopoverTimer = null;
          }
          let x = rect.left;
          let y = rect.bottom + 4;
          const maxW = 320;
          const maxH = 220;
          if (x + maxW > window.innerWidth) x = window.innerWidth - maxW - 8;
          if (x < 8) x = 8;
          if (y + maxH > window.innerHeight) y = rect.top - maxH - 4;
          if (y < 8) y = 8;
          const title = `${key} · ${data.sourceLabel || '溯源信息'}`;
          const excerpt = String(data.sourceExcerpt || data.sourceFullText || '').trim() || '暂无溯源内容';
          this.wbAnalysisModalCitationPopover = { show: true, title, excerpt, x, y };
        },
        onWbAnalysisModalPreviewCitationHover(event) {
          const el = event && event.target ? event.target.closest('.analysis-inline-citation') : null;
          if (!el) return;
          const key = String(el.getAttribute('data-cite') || '').trim();
          if (!key) return;
          this.showWbAnalysisModalCitationPopoverByKey(key, el.getBoundingClientRect());
        },
        onWbAnalysisModalPreviewCitationLeave() {
          this.wbAnalysisModalCitationPopoverTimer = window.setTimeout(() => {
            this.wbAnalysisModalCitationPopover = { show: false, title: '', excerpt: '', x: 0, y: 0 };
            this.wbAnalysisModalCitationPopoverTimer = null;
          }, 120);
        },
        onWbAnalysisModalCitationPopoverEnter() {
          if (this.wbAnalysisModalCitationPopoverTimer) {
            window.clearTimeout(this.wbAnalysisModalCitationPopoverTimer);
            this.wbAnalysisModalCitationPopoverTimer = null;
          }
        },
        onWbAnalysisModalCitationPopoverLeave() {
          this.onWbAnalysisModalPreviewCitationLeave();
        },
        onChatAreaDrop(ev) {
          ev.preventDefault();
          const files = Array.from((ev.dataTransfer && ev.dataTransfer.files) || []);
          if (files.length) {
            this.addChatUploadAttachmentsFromFiles(files);
            return;
          }
          let raw = ev.dataTransfer.getData('application/json');
          if (!raw) raw = ev.dataTransfer.getData('text/plain');
          if (!raw) return;
          try {
            const payload = JSON.parse(raw);
            this.onTreeLeafDropInChat(ev, payload);
          } catch (e) { /* ignore */ }
        },
        onTreeLeafDropInChat(ev, payload) {
          ev.preventDefault();
          if (!payload || payload.source !== 'material' || payload.id == null) return;
          const m = this.materials.find((x) => x.id === payload.id);
          if (m) this.addChatInputMaterialRef(m, { focus: true });
          this.toastMessage = '已添加到对话';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        openFullscreenDual(m) {
          this.fullscreenMaterialId = m.id;
          this.fullscreenLeftView = 'list';
          this.fullscreenSelectedSourceId = null;
          this.fullscreenHighlightSourceId = null;
          this.fullscreenHighlightExcerptIndex = null;
          this.fullscreenOriginalHighlight = null;
          this.fullscreenOriginalPageRefs = {};
          this.fullscreenOriginalRowRefs = {};
          this.sourcesLeftFullscreen = true;
        },
        setFullscreenOriginalPageRef(pi, el) {
          if (!el) return;
          this.fullscreenOriginalPageRefs[pi] = el;
        },
        setFullscreenOriginalRowRef(ri, el) {
          if (!el) return;
          this.fullscreenOriginalRowRefs[ri] = el;
        },
        onExtractCitationEnter(ev, ref, paired) {
          if (!paired || !paired.citations) return;
          const c = paired.citations.find((x) => x.ref === ref);
          if (!c || c.excerpt == null) return;
          if (this.citationPopoverTimer) {
            clearTimeout(this.citationPopoverTimer);
            this.citationPopoverTimer = null;
          }
          const rect = ev.target.getBoundingClientRect();
          let x = rect.left;
          let y = rect.bottom + 4;
          const maxW = 320;
          const maxH = 200;
          if (x + maxW > window.innerWidth) x = window.innerWidth - maxW - 8;
          if (x < 8) x = 8;
          if (y + maxH > window.innerHeight) y = rect.top - maxH - 4;
          if (y < 8) y = 8;
          this.citationPopover = {
            show: true,
            title: '来源片段',
            excerpt: this.buildCitationPopoverExcerpt(c.excerpt),
            x,
            y,
          };
        },
        onCitationPopoverEnter() {
          if (this.citationPopoverTimer) {
            clearTimeout(this.citationPopoverTimer);
            this.citationPopoverTimer = null;
          }
        },
        onExtractCitationLeave() {
          this.citationPopoverTimer = setTimeout(() => {
            this.citationPopover = { show: false, title: '', excerpt: '', x: 0, y: 0 };
            this.citationPopoverTimer = null;
          }, 150);
        },
        onExtractCitationClick(ref, paired) {
          if (!this.sourcesLeftFullscreen || !paired || !paired.citations) return;
          const c = paired.citations.find((x) => x.ref === ref);
          if (!c) return;
          if (c.pageIndex != null) {
            this.fullscreenOriginalHighlight = { pageIndex: c.pageIndex };
            this.$nextTick(() => {
              const el = this.fullscreenOriginalPageRefs[c.pageIndex];
              if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { this.fullscreenOriginalHighlight = null; }, 2000);
            });
          } else if (c.rowIndex != null) {
            this.fullscreenOriginalHighlight = { rowIndex: c.rowIndex };
            this.$nextTick(() => {
              const el = this.fullscreenOriginalRowRefs[c.rowIndex];
              if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { this.fullscreenOriginalHighlight = null; }, 2000);
            });
          }
        },
        setFullscreenExcerptRef(sourceId, index, el) {
          if (!el) return;
          if (!this.fullscreenExcerptRefs[sourceId]) this.fullscreenExcerptRefs[sourceId] = {};
          this.fullscreenExcerptRefs[sourceId][index] = el;
        },
        renderFullscreenAnalysisContent(material) {
          if (!material || !material.excerptsWithCitations) return (material?.excerpts || []).map(e => (e || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('<br><br>');
          let html = '';
          material.excerptsWithCitations.forEach((block, bi) => {
            let text = (block.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            (block.citations || []).forEach((c, ci) => {
              const num = String(ci + 1);
              const regex = new RegExp('\\[' + (ci + 1) + '\\]');
              text = text.replace(
                regex,
                '<span class="nlm-citation" data-source-id="' +
                  c.sourceId +
                  '" data-excerpt-index="' +
                  c.excerptIndex +
                  '" aria-label="引用 ' +
                  num +
                  '">' +
                  num +
                  '</span>'
              );
            });
            html += (bi ? '<br><br>' : '') + '<div class="excerpt">' + text + '</div>';
          });
          return html;
        },
        handleFullscreenCitationClick(e) {
          const el = e.target.closest('.nlm-citation');
          if (!el) return;
          const sourceId = el.dataset.sourceId;
          const excerptIndex = parseInt(el.dataset.excerptIndex, 10);
          this.fullscreenLeftView = 'detail';
          this.fullscreenSelectedSourceId = sourceId;
          this.fullscreenHighlightSourceId = sourceId;
          this.fullscreenHighlightExcerptIndex = excerptIndex;
          this.$nextTick(() => {
            const ref = this.fullscreenExcerptRefs[sourceId] && this.fullscreenExcerptRefs[sourceId][excerptIndex];
            if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { this.fullscreenHighlightSourceId = null; this.fullscreenHighlightExcerptIndex = null; }, 2000);
          });
        },
        getMessageFullPlainText(msg) {
          if (!msg) return '';
          if (msg.role === 'user') return String(msg.text || '');
          const t = msg.text || '';
          if (msg.chatIntro) {
            let s = `${msg.chatIntro}\n\n${t}`;
            if (msg.chatRunSummary) s += `\n\n${msg.chatRunSummary}`;
            return s;
          }
          return t;
        },
        getMessageResultPlainText(msg) {
          if (!msg) return '';
          if (msg.role === 'user') return String(msg.text || '');
          const t = String(msg.text || '');
          if (msg.chatIntro) {
            return `${msg.chatIntro}\n\n${t}`;
          }
          return t;
        },
        renderMarkdownFromBotText(raw, msg) {
          let out;
          if (typeof marked !== 'undefined') {
            try {
              const parsed = marked.parse(raw, { gfm: true, breaks: true, async: false });
              out = (typeof parsed === 'string' ? parsed : String(parsed || '')).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/\s(on\w+)=["'][^"']*["']/g, '');
            } catch (err) {
              out = raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
          } else {
            out = raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }
          if (msg.citations && msg.citations.length) {
            msg.citations.forEach((c, i) => {
              const idx = i + 1;
              const num = String(idx);
              const squarePattern = new RegExp(`\\[${idx}\\]`, 'g');
              const fullPattern = new RegExp(`【${idx}】`, 'g');
              const span = `<span class="nlm-citation" data-source-id="${c.sourceId}" data-excerpt-index="${c.excerptIndex}" aria-label="引用 ${num}">${num}</span>`;
              out = out.replace(squarePattern, span);
              out = out.replace(fullPattern, span);
            });
          }
          out = out.replace(/\[(E\d+)\]/g, (_, k) => `<span class="analysis-inline-citation" data-cite="${k}" aria-label="引用 ${k}">${k}</span>`);
          return out;
        },
        renderMessage(msg) {
          if (msg && msg.resultDecision) return this.renderResultTreeDecisionCardHtml(msg);
          if (msg.role === 'user') return msg.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return this.renderMarkdownFromBotText(msg.text || '', msg);
        },
        escapeResultTreeDecisionHtml(text) {
          return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        },
        renderResultTreeDecisionCardHtml(msg) {
          const d = (msg && msg.resultDecision) || {};
          const status = String(d.status || 'pending');
          const statusTextMap = {
            pending: '待决策',
            approved: '用户已同意',
            rejected: '用户已拒绝',
            timeout: '已超时，默认取消',
          };
          const statusIconMap = {
            pending: 'loading-four',
            approved: 'check-one',
            rejected: 'close-one',
            timeout: 'close-one',
          };
          const statusIconClassMap = {
            pending: ' is-spin',
            approved: ' nlm-tool-call-status--ok',
            rejected: ' nlm-tool-call-status--fail',
            timeout: ' nlm-tool-call-status--fail',
          };
          const objectLine = d.summary
            ? this.escapeResultTreeDecisionHtml(d.summary)
            : `${this.escapeResultTreeDecisionHtml(d.objectType || '结果对象')} · ${this.escapeResultTreeDecisionHtml(d.objectTitle || '未命名结果')}`;
          const items = Array.isArray(d.items) ? d.items : [];
          const itemHtml = items.slice(0, 3).map((item) => `<li>${this.escapeResultTreeDecisionHtml(item)}</li>`).join('');
          const moreHtml = items.length > 3 ? `<div class="nlm-result-decision-card__more">还有 ${items.length - 3} 项结果未展示</div>` : '';
          const pendingActions = status === 'pending'
            ? `<div class="nlm-result-decision-card__actions">
                <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn" data-result-decision-action="rejected" data-result-decision-id="${this.escapeResultTreeDecisionHtml(msg.id)}"><span class="ds-trigger-btn__text">拒绝</span></button>
                <button type="button" class="ds-trigger-btn nlm-chat-result-toolbar-btn nlm-result-decision-card__btn nlm-result-decision-card__btn--primary" data-result-decision-action="approved" data-result-decision-id="${this.escapeResultTreeDecisionHtml(msg.id)}"><span class="ds-trigger-btn__text">同意</span></button>
              </div>`
            : '';
          return `<div class="nlm-result-decision-card is-${this.escapeResultTreeDecisionHtml(status)}">
            <div class="nlm-tool-call-action-with-detail">
              <div class="nlm-tool-call-action-toolbar">
                <p class="nlm-tool-stream-text nlm-tool-stream-text--action nlm-tool-call-line">
                  <span class="nlm-tool-call-line__ic nlm-result-decision-card__ic" aria-hidden="true"><svg class="iconpark-icon${statusIconClassMap[status] || statusIconClassMap.pending}"><use href="#${statusIconMap[status] || statusIconMap.pending}"></use></svg></span>
                  <span class="nlm-tool-call-line__txt">${this.escapeResultTreeDecisionHtml(`${d.title || '是否变更结果'}（${statusTextMap[status] || statusTextMap.pending}）`)}</span>
                </p>
              </div>
              <div class="analysis-result-preview-modal__panel nlm-chat-result-md-panel nlm-result-decision-card__panel">
                <div class="analysis-result-preview-modal__panel-hd analysis-result-preview-modal__panel-hd--sub analysis-result-preview-modal__panel-hd--editor-toolbar nlm-chat-result-md-toolbar nlm-result-decision-card__panel-hd">
                  <span class="analysis-result-preview-modal__panel-hd-label">结果树变更确认</span>
                  ${d.timeoutLabel ? `<span class="nlm-result-decision-card__timeout">${this.escapeResultTreeDecisionHtml(d.timeoutLabel)}</span>` : ''}
                </div>
                <div class="analysis-result-preview-modal__panel-body">
                  <div class="nlm-result-decision-card__body">
                    <div class="nlm-result-decision-card__section">
                      <div class="nlm-result-decision-card__label">对象</div>
                      <div class="nlm-result-decision-card__object">
                        <div class="nlm-result-decision-card__object-title">${objectLine}</div>
                        ${d.path ? `<div class="nlm-result-decision-card__path">路径：${this.escapeResultTreeDecisionHtml(d.path)}</div>` : ''}
                        ${itemHtml ? `<ul class="nlm-result-decision-card__items">${itemHtml}</ul>${moreHtml}` : ''}
                      </div>
                    </div>
                    <div class="nlm-result-decision-card__section">
                      <div class="nlm-result-decision-card__label">影响</div>
                      <div class="nlm-result-decision-card__impact">${this.escapeResultTreeDecisionHtml(d.impact || '该操作会改变结果树结构。')}</div>
                    </div>
                    ${pendingActions}
                  </div>
                </div>
              </div>
            </div>
          </div>`;
        },
        renderMessageBodyHtml(msg) {
          return this.renderMarkdownFromBotText(msg.text || '', msg);
        },
        onChatMarkdownBodyClick(e) {
          const decisionBtn = e.target.closest('[data-result-decision-action]');
          if (decisionBtn) {
            e.preventDefault();
            const id = String(decisionBtn.getAttribute('data-result-decision-id') || '');
            const action = String(decisionBtn.getAttribute('data-result-decision-action') || '');
            const msg = (this.chatMessages || []).find((m) => String(m && m.id) === id);
            this.decideResultTreeDecision(msg, action);
            return;
          }
          if (!e.target.closest('.nlm-citation')) return;
          e.preventDefault();
          this.handleCitationClick(e);
        },
        handleChatAnalysisInlineCitationClick(e) {
          const el = e.target.closest('.analysis-inline-citation');
          if (!el) return;
          const key = String(el.getAttribute('data-cite') || '').trim();
          if (!key || !this.workbenchAnalysisCitationMap[key]) return;
          const current = this.selectedMaterial;
          let target = null;
          if (current && current.type === 'analysis') target = current;
          else target = (this.materials || []).find((m) => m.type === 'analysis') || null;
          if (!target) return;
          this.sourcesCollapsed = false;
          this.studioCollapsed = false;
          this.lastDetailFocus = 'right';
          this.sourcesRightView = 'detail';
          this.sourcesLeftView = 'list';
          this.sourcesDetailWidth = 450;
          this.selectedMaterialId = target.id;
        },
        handleCitationClick(e) {
          const el = e.target.closest('.nlm-citation');
          if (!el) return;
          const sourceId = el.dataset.sourceId;
          const excerptIndex = parseInt(el.dataset.excerptIndex, 10);
          const found = this.findMaterialBySourceId(sourceId);
          if (!found) return;
          const m = found.material;
          if (m.loading) return;
          if (!this.canOpenMaterialPreview(m)) {
            message.info('该资料尚未完成解析，暂不可预览');
            return;
          }
          if (!this.canOpenAnalysisPreview(m)) {
            message.info('该结果尚未完成，暂不可预览');
            return;
          }
          this.sourcesCollapsed = false;
          this.studioCollapsed = false;
          this.clearWorkbenchAnalysisCitationFloats();
          this.openMaterialDetail(m);
          if (m.type === 'analysis') {
            this.$nextTick(() => {
              const root = this.$el && this.$el.querySelector ? this.$el : document.body;
              const scrollEl = root.querySelector('.analysis-result-preview-modal--workbench-embed.nlm-fill-scroll');
              if (scrollEl) scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
            });
            return;
          }
          this.highlightSourceId = m.id;
          this.highlightExcerptIndex = excerptIndex;
          this.$nextTick(() => {
            const ref = this.excerptRefs[m.id] && this.excerptRefs[m.id][excerptIndex];
            if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              this.highlightSourceId = null;
              this.highlightExcerptIndex = null;
            }, 2000);
          });
        },
        getExcerptTextForCitation(sourceId, excerptIndex) {
          const found = this.findMaterialBySourceId(sourceId);
          if (!found) return '';
          const m = found.material;
          if (m.type === 'analysis' || m.type === 'report') {
            const block = m.excerptsWithCitations && m.excerptsWithCitations[excerptIndex];
            return block && block.text != null ? block.text : '';
          }
          if (m.excerpts && m.excerpts[excerptIndex] != null) return m.excerpts[excerptIndex];
          if (m.paired && m.paired.citations && m.paired.citations[excerptIndex]) return m.paired.citations[excerptIndex].excerpt || '';
          return '';
        },
        getCitationSourceLabel(sourceId) {
          const found = this.findMaterialBySourceId(sourceId);
          if (!found || !found.material) return '引用来源';
          return String(found.material.title || '引用来源');
        },
        buildCitationPopoverExcerpt(text) {
          const raw = String(text || '').trim();
          if (!raw) return '暂无可展示的溯源内容';
          const compact = raw.replace(/\s+/g, ' ').trim();
          return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact;
        },
        onChatMsgMouseEnter(ev) {
          const analysisEl = ev.target.closest('.analysis-inline-citation');
          if (analysisEl) {
            const key = String(analysisEl.getAttribute('data-cite') || '').trim();
            const data = this.workbenchAnalysisCitationMap[key];
            if (!data) return;
            if (this.citationPopoverTimer) {
              clearTimeout(this.citationPopoverTimer);
              this.citationPopoverTimer = null;
            }
            const rect = analysisEl.getBoundingClientRect();
            let x = rect.left;
            let y = rect.bottom + 4;
            const maxW = 320;
            const maxH = 200;
            if (x + maxW > window.innerWidth) x = window.innerWidth - maxW - 8;
            if (x < 8) x = 8;
            if (y + maxH > window.innerHeight) y = rect.top - maxH - 4;
            if (y < 8) y = 8;
            this.citationPopover = {
              show: true,
              title: data.sourceLabel ? `来源：${data.sourceLabel}` : '引用来源',
              excerpt: this.buildCitationPopoverExcerpt(data.sourceExcerpt || ''),
              x,
              y,
            };
            return;
          }
          const el = ev.target.closest('.nlm-citation');
          if (!el) return;
          const sourceId = el.dataset.sourceId;
          const excerptIndex = parseInt(el.dataset.excerptIndex, 10);
          if (isNaN(excerptIndex)) return;
          const excerpt = this.getExcerptTextForCitation(sourceId, excerptIndex);
          if (this.citationPopoverTimer) {
            clearTimeout(this.citationPopoverTimer);
            this.citationPopoverTimer = null;
          }
          const rect = el.getBoundingClientRect();
          let x = rect.left;
          let y = rect.bottom + 4;
          const maxW = 320;
          const maxH = 200;
          if (x + maxW > window.innerWidth) x = window.innerWidth - maxW - 8;
          if (x < 8) x = 8;
          if (y + maxH > window.innerHeight) y = rect.top - maxH - 4;
          if (y < 8) y = 8;
          this.citationPopover = {
            show: true,
            title: `来源：${this.getCitationSourceLabel(sourceId)}`,
            excerpt: this.buildCitationPopoverExcerpt(excerpt || ''),
            x,
            y,
          };
        },
        onChatMsgMouseLeave(ev) {
          if (ev.relatedTarget && ev.relatedTarget.closest('.nlm-extract-citation-popover')) return;
          this.onExtractCitationLeave();
        },
        copyMessage(msg) {
          navigator.clipboard?.writeText(this.getMessageFullPlainText(msg));
          this.toastMessage = '已复制';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        pinMessage(msg) {
          if (msg.pinned === undefined) msg.pinned = false;
          msg.pinned = !msg.pinned;
          this.toastMessage = msg.pinned ? '已钉住' : '已取消钉住';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        collectChatInputAtReferences(text) {
          const t = String(text || '');
          const candidates = [];
          (this.materials || []).forEach((m) => {
            const isRaw = m && (m.type === 'raw' || m.type === undefined);
            const title = isRaw
              ? String(this.chatAtRawMaterialDisplayTitle(m) || '').trim() || '未命名'
              : String(m && (m.title != null ? m.title : m.name != null ? m.name : '未命名')).trim() || '未命名';
            candidates.push({ id: m && m.id, title, material: m });
          });
          candidates.sort((a, b) => b.title.length - a.title.length);
          const used = new Set();
          const matches = [];
          let pos = 0;
          while (pos < t.length) {
            const at = t.indexOf('@', pos);
            if (at < 0) break;
            const after = t.slice(at + 1);
            let matched = null;
            for (let c = 0; c < candidates.length; c++) {
              const cand = candidates[c];
              if (after.startsWith(cand.title)) {
                const nextCh = after[cand.title.length];
                if (nextCh === undefined || /\s/.test(nextCh) || '，。、；：!！?？）]}'.includes(nextCh)) {
                  matched = cand;
                  break;
                }
              }
            }
            if (matched) {
              const ukey = 'm:' + matched.id;
              if (!used.has(ukey)) {
                used.add(ukey);
                matches.push(matched);
              }
              pos = at + 1 + matched.title.length;
            } else {
              pos = at + 1;
            }
          }
          return matches;
        },
        parseChatInputAtReferences(text) {
          return this.collectChatInputAtReferences(text).map((item) => item.title);
        },
        appendChatInputToken(token) {
          const raw = String(token || '').trim();
          if (!raw) return;
          const cur = this.chatInput || '';
          const sep = cur.length && !/\s$/.test(cur) ? ' ' : '';
          this.chatInput = cur + sep + raw + (/\s$/.test(raw) ? '' : ' ');
          this.$nextTick(() => {
            this.adjustInputHeight();
            const el = this.$refs.chatInputEl;
            if (el && el.focus) el.focus();
          });
        },
        closeChatInputTriggerMenu() {
          this.unbindChatAtFloaterReposition();
          this.chatAtFloaterStyle = {};
          this.chatInputTriggerOpen = false;
          this.chatInputTriggerKind = null;
          this.chatTriggerFilter = '';
          this.chatAtMenuPanel = 'categories';
        },
        pickDefaultChatInputAtRail() {
          if (this.chatAtMenuRawMaterials.length) return 'raw';
          if (this.chatAtMenuResultMaterials.length) return 'result';
          return 'raw';
        },
        syncChatInputTriggerFromCaret(text, pos) {
          const t = String(text || '');
          const p = pos == null ? t.length : Math.min(Math.max(0, pos), t.length);
          const prefix = t.slice(0, p);
          const atM = prefix.match(/(?:^|[\s\n])@([^\s\n@]*)$/);
          const slashM = prefix.match(/(?:^|[\s\n])\/([^\s\n/]*)$/);
          let pick = null;
          let atFilter = '';
          let slashFilter = '';
          if (atM) {
            atFilter = atM[1] || '';
            pick = 'at';
          }
          if (slashM) {
            slashFilter = slashM[1] || '';
            if (!pick) pick = 'slash';
            else {
              const atTrig = prefix.length - atM[0].length + (atM[0][0] === '@' ? 0 : 1);
              const slashTrig = prefix.length - slashM[0].length + (slashM[0][0] === '/' ? 0 : 1);
              pick = atTrig >= slashTrig ? 'at' : 'slash';
            }
          }
          if (pick === 'at') {
            const prev = this.chatInputTriggerKind;
            this.chatInputTriggerOpen = true;
            this.chatInputTriggerKind = 'at';
            this.chatTriggerFilter = atFilter;
            if (prev !== 'at') {
              this.chatAtMenuPanel = 'categories';
              this.chatInputAtRail = this.pickDefaultChatInputAtRail();
            }
            this.$nextTick(() => {
              this.bindChatAtFloaterReposition();
              this.scheduleUpdateChatAtFloaterPosition();
            });
            return;
          }
          if (pick === 'slash') {
            this.unbindChatAtFloaterReposition();
            this.chatAtFloaterStyle = {};
            this.chatInputTriggerOpen = true;
            this.chatInputTriggerKind = 'slash';
            this.chatTriggerFilter = slashFilter;
            return;
          }
          this.closeChatInputTriggerMenu();
        },
        onChatInputInput(e) {
          this.adjustInputHeight();
          const el = e && e.target;
          if (!el) return;
          this.syncChatInputTriggerFromCaret(el.value, el.selectionStart);
          if (this.chatInputTriggerKind === 'at' && this.chatInputTriggerOpen) {
            this.$nextTick(() => this.scheduleUpdateChatAtFloaterPosition());
          }
        },
        onChatInputKeydown(e) {
          if (e.isComposing || e.keyCode === 229) return;
          if (e.key === 'Escape' && this.chatInputTriggerOpen) {
            e.preventDefault();
            this.closeChatInputTriggerMenu();
            return;
          }
          if (e.key === 'Enter' && !e.shiftKey && this.chatInputTriggerOpen) {
            e.preventDefault();
            return;
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendChat();
          }
        },
        onChatInputFocus() {
          if (this._chatInputBlurTimer) {
            window.clearTimeout(this._chatInputBlurTimer);
            this._chatInputBlurTimer = null;
          }
        },
        onChatInputBlur() {
          if (this._chatInputBlurTimer) window.clearTimeout(this._chatInputBlurTimer);
          this._chatInputBlurTimer = window.setTimeout(() => {
            this._chatInputBlurTimer = null;
            this.closeChatInputTriggerMenu();
          }, 180);
        },
        computeChatAtTriggerCharIndex(text, caretPos) {
          const t = String(text || '');
          const p = caretPos == null ? t.length : Math.min(Math.max(0, caretPos), t.length);
          const prefix = t.slice(0, p);
          const m = prefix.match(/(?:^|[\s\n])@([^\s\n@]*)$/);
          if (!m) return -1;
          return prefix.length - m[0].length + (m[0][0] === '@' ? 0 : 1);
        },
        getTextareaCaretViewportRectAtIndex(textarea, index) {
          if (!textarea || index == null || index < 0) return null;
          const text = String(textarea.value || '');
          const pos = Math.min(Math.max(0, index), text.length);
          const computed = window.getComputedStyle(textarea);
          const mirror = document.createElement('div');
          const ms = mirror.style;
          ms.position = 'fixed';
          ms.visibility = 'hidden';
          ms.pointerEvents = 'none';
          ms.whiteSpace = 'pre-wrap';
          ms.wordBreak = 'break-word';
          ms.overflow = 'hidden';
          ms.boxSizing = computed.boxSizing;
          ms.width = `${textarea.clientWidth}px`;
          ms.maxHeight = `${textarea.clientHeight}px`;
          ms.font = computed.font;
          ms.fontSize = computed.fontSize;
          ms.fontFamily = computed.fontFamily;
          ms.fontWeight = computed.fontWeight;
          ms.fontStyle = computed.fontStyle;
          ms.letterSpacing = computed.letterSpacing;
          ms.lineHeight = computed.lineHeight;
          ms.padding = computed.padding;
          ms.border = computed.border;
          ms.textAlign = computed.textAlign;
          ms.textTransform = computed.textTransform;
          ms.textIndent = computed.textIndent;
          const taRect = textarea.getBoundingClientRect();
          const pl = parseFloat(computed.paddingLeft) || 0;
          const pt = parseFloat(computed.paddingTop) || 0;
          const bl = parseFloat(computed.borderLeftWidth) || 0;
          const bt = parseFloat(computed.borderTopWidth) || 0;
          ms.top = `${taRect.top + bt + pt}px`;
          ms.left = `${taRect.left + bl + pl}px`;
          mirror.textContent = text.slice(0, pos);
          const span = document.createElement('span');
          span.textContent = text.slice(pos, pos + 1) || '\u200b';
          mirror.appendChild(span);
          document.body.appendChild(mirror);
          mirror.scrollTop = textarea.scrollTop;
          const rect = span.getBoundingClientRect();
          document.body.removeChild(mirror);
          const lineHeight = parseFloat(computed.lineHeight) || 20;
          const h = rect.height > 0 ? rect.height : lineHeight;
          return { left: rect.left, top: rect.top, height: h };
        },
        scheduleUpdateChatAtFloaterPosition() {
          if (this.chatInputTriggerKind !== 'at' || !this.chatInputTriggerOpen) return;
          this.$nextTick(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const ta = this.$refs.chatInputEl;
                if (!ta || this.chatInputTriggerKind !== 'at' || !this.chatInputTriggerOpen) return;
                const idx = this.computeChatAtTriggerCharIndex(this.chatInput || '', ta.selectionStart);
                if (idx < 0) return;
                const caret = this.getTextareaCaretViewportRectAtIndex(ta, idx);
                if (!caret) return;
                const gap = 6;
                const floater = this.$refs.chatAtTriggerFloater;
                const fw = floater && floater.offsetWidth ? floater.offsetWidth : 280;
                const fh = floater && floater.offsetHeight ? floater.offsetHeight : 220;
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const pad = 8;
                let left = caret.left;
                left = Math.min(Math.max(pad, left), vw - fw - pad);
                let top = caret.top - gap;
                const minTop = pad + fh;
                if (top < minTop) top = minTop;
                if (top > vh - pad) top = vh - pad;
                this.chatAtFloaterStyle = {
                  position: 'fixed',
                  left: `${Math.round(left)}px`,
                  top: `${Math.round(top)}px`,
                  transform: 'translateY(-100%)',
                  zIndex: 1100,
                };
              });
            });
          });
        },
        bindChatAtFloaterReposition() {
          if (this._chatAtFloaterReposBound) return;
          const fn = () => {
            if (this.chatInputTriggerKind === 'at' && this.chatInputTriggerOpen) this.scheduleUpdateChatAtFloaterPosition();
          };
          this._chatAtFloaterReposBound = fn;
          window.addEventListener('scroll', fn, true);
          window.addEventListener('resize', fn);
          if (window.visualViewport) {
            window.visualViewport.addEventListener('scroll', fn);
            window.visualViewport.addEventListener('resize', fn);
          }
        },
        unbindChatAtFloaterReposition() {
          if (!this._chatAtFloaterReposBound) return;
          const fn = this._chatAtFloaterReposBound;
          window.removeEventListener('scroll', fn, true);
          window.removeEventListener('resize', fn);
          if (window.visualViewport) {
            window.visualViewport.removeEventListener('scroll', fn);
            window.visualViewport.removeEventListener('resize', fn);
          }
          this._chatAtFloaterReposBound = null;
        },
        openChatInputAtSubmenu(key) {
          if (key !== 'raw' && key !== 'result') return;
          this.chatInputAtRail = key;
          this.chatAtMenuPanel = 'items';
          this.$nextTick(() => this.scheduleUpdateChatAtFloaterPosition());
        },
        backChatInputAtSubmenu() {
          this.chatAtMenuPanel = 'categories';
          this.$nextTick(() => this.scheduleUpdateChatAtFloaterPosition());
        },
        replaceChatInputTriggerWith(insertion) {
          const el = this.$refs.chatInputEl;
          if (!el) return;
          const text = this.chatInput || '';
          const pos = el.selectionStart;
          const prefix = text.slice(0, pos);
          const kind = this.chatInputTriggerKind;
          let start = -1;
          if (kind === 'at') {
            const m = prefix.match(/(?:^|[\s\n])@([^\s\n@]*)$/);
            if (m) start = prefix.length - m[0].length + (m[0][0] === '@' ? 0 : 1);
          } else if (kind === 'slash') {
            const m = prefix.match(/(?:^|[\s\n])\/([^\s\n/]*)$/);
            if (m) start = prefix.length - m[0].length + (m[0][0] === '/' ? 0 : 1);
          }
          if (start < 0) {
            this.closeChatInputTriggerMenu();
            return;
          }
          this.chatInput = text.slice(0, start) + insertion + text.slice(pos);
          this.closeChatInputTriggerMenu();
          this.$nextTick(() => {
            this.adjustInputHeight();
            el.focus();
            const np = start + insertion.length;
            el.selectionStart = el.selectionEnd = np;
          });
        },
        onChatInputTriggerPickMaterial(m) {
          if (!m) return;
          this.addChatInputMaterialRef(m, { consumeAtTrigger: true, focus: true });
          this.chatAtMenuPanel = 'categories';
        },
        onChatInputTriggerSlashMenuClick(info) {
          const key = info && info.key;
          if (!key || key === 'chat-trg-slash-empty') return;
          const secs = this.workbenchTemplateTreeSections || [];
          for (let s = 0; s < secs.length; s++) {
            const node = (secs[s].children || []).find((c) => c.key === key);
            if (node && node.raw) {
              const name = String(node.raw.name != null ? node.raw.name : '未命名').trim() || '未命名';
              this.replaceChatInputTriggerWith('/' + name + ' ');
              return;
            }
          }
        },
        adjustInputHeight() {
          this.$nextTick(() => {
            const el = this.$refs.chatInputEl;
            if (!el) return;
            el.style.height = 'auto';
            const minH = 40;
            const maxH = 176;
            const h = Math.min(maxH, Math.max(minH, el.scrollHeight));
            el.style.height = h + 'px';
            if (this.chatInputTriggerKind === 'at' && this.chatInputTriggerOpen) {
              this.scheduleUpdateChatAtFloaterPosition();
            }
          });
        },
        startDemoConversation(text, refTitles) {
          this.hideChatQueueNotice();
          const cleanText = String(text || '').trim();
          const refs = Array.isArray(refTitles) ? refTitles.slice() : [];
          const userMsg = { id: 'm' + Date.now(), role: 'user', text: cleanText, refCount: refs.length, refTitles: refs };
          this.chatMessages.push(userMsg);
          const toolCalls = this.buildDemoToolCalls(refs, cleanText);
          const thinkId = 'think-' + Date.now();
          const thinkingMsg = {
            id: thinkId,
            role: 'thinking',
            toolCalls,
            thinkPhaseIndex: 0,
            thinkTextChars: 0,
            thinkToolStartedAt: null,
            _demoSendText: cleanText,
            _finalized: false,
            _intervalId: null,
          };
          this.chatMessages.push(thinkingMsg);
          this.$nextTick(() => {
            const wrap = this.$refs.chatMessages;
            if (wrap) wrap.scrollTop = wrap.scrollHeight;
          });
          const tickMs = 48;
          const iv = setInterval(() => {
            const thinking = this.chatMessages.find((m) => m.id === thinkId && m.role === 'thinking');
            if (!thinking || thinking._finalized) {
              clearInterval(iv);
              return;
            }
            this.advanceThinkingDemo(thinking);
            this.$nextTick(() => {
              const wrap = this.$refs.chatMessages;
              if (wrap) wrap.scrollTop = wrap.scrollHeight;
            });
          }, tickMs);
          thinkingMsg._intervalId = iv;
        },
        buildSeededDemoConversation(text, refTitles) {
          const cleanText = String(text || '').trim();
          const refs = Array.isArray(refTitles) ? refTitles.slice() : [];
          const userMsg = {
            id: 'm-seed-' + Date.now(),
            role: 'user',
            text: cleanText,
            refCount: refs.length,
            refTitles: refs,
          };
          const toolCalls = this.buildDemoToolCalls(refs, cleanText).map((call) => {
            const cloned = JSON.parse(JSON.stringify(call));
            if (cloned.type === 'todo') {
              cloned.todoDoneFlags = Array.isArray(cloned.items) ? cloned.items.map(() => true) : [];
              cloned._todoUiPhase = 'complete';
              cloned.todoExecutionLog = [];
            }
            return cloned;
          });
          const thinkingMsg = {
            id: 'think-seed-' + Date.now(),
            role: 'thinking',
            toolCalls,
            thinkPhaseIndex: toolCalls.length,
            thinkTextChars: 0,
            thinkToolStartedAt: null,
            _demoSendText: cleanText,
            _finalized: true,
            _intervalId: null,
          };
          const botMsg = this.buildDemoAnalysisBotMessage(cleanText);
          if (botMsg.chatIntro) botMsg.chatIntroProgress = botMsg.chatIntro.length;
          if (botMsg.chatRunSummary) botMsg.chatRunSummaryProgress = botMsg.chatRunSummary.length;
          return [userMsg, thinkingMsg, botMsg];
        },
        isChatHistoryMenuItemActive(item) {
          if (!item) return false;
          if (item.source === 'demo') return this.activeChatScenarioId === item.id;
          return false;
        },
        ensureDefaultDemoConversation() {
          if (!this.workbenchProjectId) return;
          if ((this.chatMessages || []).length > 0) return;
          const scenario = resolveWorkbenchDemoScenario(this.workbenchProjectId);
          if (scenario && scenario.kind !== 'guide') {
            this.loadChatDemoScenario(scenario);
            return;
          }
          this.activeChatScenarioId = '';
          this.chatComposerDecision = null;
          this.chatInput = '';
          this.chatInputRefItems = [];
          this.chatUploadAttachments = [];
        },
        sendChat() {
          if (this.chatReplyInProgress) return;
          if (this.chatUploadAttachmentSendBlocked) {
            message.warning(this.chatUploadAttachmentSendBlockTip || '请先处理附件');
            return;
          }
          let text = String(this.chatInput || '').trim();
          const textRefTitles = this.parseChatInputAtReferences(text);
          const chipRefTitles = (this.chatInputRefRows || []).map((item) => item.title).filter(Boolean);
          const uploadAttachments = (this.chatUploadAttachmentRows || []).slice();
          const uploadRefTitles = uploadAttachments.map((item) => item.name).filter(Boolean);
          const refTitles = Array.from(new Set([].concat(chipRefTitles, textRefTitles, uploadRefTitles)));
          const hasRefs = refTitles.length > 0;
          if (!text && !hasRefs) return;
          if (!text && hasRefs) text = '请根据 @引用 内容进行分析';
          uploadAttachments.forEach((item) => this.clearChatUploadAttachmentTimers(item.uid));
          this.ingestChatUploadAttachmentsToMaterials(uploadAttachments);
          this.chatInput = '';
          this.chatInputRefItems = [];
          this.chatUploadAttachments = [];
          this.closeChatInputTriggerMenu();
          this.adjustInputHeight();
          this.startDemoConversation(text, refTitles);
        },
        visibleToolCalls(msg) {
          const calls = msg.toolCalls || [];
          if (!calls.length) return [];
          if (msg.thinkPhaseIndex == null) {
            const current = msg.currentStep ?? 0;
            return calls.slice(0, Math.min((current ?? 0) + 1, calls.length));
          }
          const phase = msg.thinkPhaseIndex ?? 0;
          return calls.slice(0, Math.min(phase + 1, calls.length));
        },
        newSession() {
          if (this.chatMessages.length === 0) {
            this.toastMessage = '当前无对话内容';
            setTimeout(() => { this.toastMessage = ''; }, 1500);
            return;
          }
          this.clearChatThinkingIntervals();
          this.hideChatQueueNotice();
          this.activeChatScenarioId = '';
          const now = new Date();
          const title = '会话 ' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
          this.sessionHistory.unshift({
            id: 'session-' + Date.now(),
            title,
            createdAt: title,
            messages: JSON.parse(JSON.stringify(this.chatMessages))
          });
          this.chatMessages = [];
          this.chatInput = '';
          this.chatInputRefItems = [];
          this.chatUploadAttachments = [];
          this.historyDropdownOpen = false;
          this.toastMessage = '已保存为历史会话';
          setTimeout(() => { this.toastMessage = ''; }, 1500);
        },
        focusChatInput() {
          this.$nextTick(() => {
            const el = this.$refs.chatInputEl;
            if (el && typeof el.focus === 'function') el.focus();
          });
        },
        restoreSession(session) {
          this.historyDropdownOpen = false;
          this.hideChatQueueNotice();
          this.activeChatScenarioId = '';
          const messages = JSON.parse(JSON.stringify(session.messages));
          messages.forEach((m) => {
            if (m._intervalId != null) {
              m._intervalId = undefined;
            }
            if (m._runSummaryStartTid != null) {
              m._runSummaryStartTid = undefined;
            }
            if (m._runSummaryIv != null) {
              m._runSummaryIv = undefined;
            }
            if (m._chatIntroIv != null) {
              m._chatIntroIv = undefined;
            }
            if (m.role === 'thinking' && Array.isArray(m.toolCalls)) {
              m.toolCalls.forEach((tc) => {
                delete tc._deepThinkStart;
                if (tc.type === 'todo') {
                  delete tc._todoPlanBuilt;
                  delete tc._todoPlan;
                  delete tc._todoPlanIdx;
                  delete tc.todoScratch;
                  delete tc.todoExecutionLog;
                  delete tc._todoUiPhase;
                  delete tc._todoPlanningUntil;
                }
              });
            }
          });
          this.chatMessages = messages;
          this.chatInput = '';
          this.chatInputRefItems = [];
          this.chatUploadAttachments = [];
          const queuedThinking = messages.find((m) => m && m.role === 'thinking' && m._queueMode);
          if (queuedThinking) {
            queuedThinking._finalized = false;
            queuedThinking.thinkToolStartedAt = Date.now();
            this.activateChatQueueDemo(queuedThinking._queuePosition || 3);
          }
          this.$nextTick(() => {
            const wrap = this.$refs.chatMessages;
            if (wrap) wrap.scrollTop = wrap.scrollHeight;
          });
        },
        beginResize(side, e) {
          e.preventDefault();
          const startX = typeof e.clientX === 'number' ? e.clientX : Number(e.x || e.pageX || e.screenX || 0);
          const startY = typeof e.clientY === 'number' ? e.clientY : Number(e.y || e.pageY || e.screenY || 0);
          const splitPanel = this.$refs.rightSplitPanel;
          const splitPanelRect = splitPanel && splitPanel.getBoundingClientRect ? splitPanel.getBoundingClientRect() : null;
          this.resizing = {
            side,
            startX,
            startY,
            sourcesWidth: this.sourcesWidth,
            sourcesDetailWidth: this.sourcesDetailWidth,
            studioWidth: this.studioWidth,
            rightSplitTaskPct: this.currentRightSplitTaskPct,
            rightSplitPanelHeight: splitPanelRect ? splitPanelRect.height : 0,
          };
          document.addEventListener('mousemove', this.onResizeMove);
          document.addEventListener('mouseup', this.stopResize);
        },
        onResizeMove(e) {
          if (!this.resizing || !this.$refs.mainBody) return;
          const clientX = typeof e.clientX === 'number' ? e.clientX : Number(e.x || e.pageX || e.screenX || 0);
          const clientY = typeof e.clientY === 'number' ? e.clientY : Number(e.y || e.pageY || e.screenY || 0);
          const delta = clientX - this.resizing.startX;
          if (this.resizing.side === 'rightSplit') {
            const panelHeight = Math.max(240, Number(this.resizing.rightSplitPanelHeight) || 0);
            const usableHeight = Math.max(1, panelHeight - 8);
            const minPct = Math.min(45, Math.max(10, (120 / usableHeight) * 100));
            const maxPct = 100 - minPct;
            const startPct = Number(this.resizing.rightSplitTaskPct) || 25;
            const nextPct = Math.min(maxPct, Math.max(minPct, startPct + ((clientY - this.resizing.startY) / usableHeight) * 100));
            if (this.wbTaskListView === 'batch-children') {
              this.rightSplitBatchTaskPct = nextPct;
            } else {
              this.rightSplitTaskPct = nextPct;
            }
          } else if (this.resizing.side === 'sources') {
            if (this.sourcesLeftView === 'detail') {
              this.sourcesDetailWidth = Math.min(600, Math.max(350, this.resizing.sourcesDetailWidth + delta));
            } else {
              this.sourcesWidth = Math.min(500, Math.max(200, this.resizing.sourcesWidth + delta));
            }
          } else {
            this.studioWidth = Math.min(500, Math.max(240, this.resizing.studioWidth - delta));
          }
        },
        stopResize() {
          this.resizing = null;
          document.removeEventListener('mousemove', this.onResizeMove);
          document.removeEventListener('mouseup', this.stopResize);
        }
  };
})();
