// task-result-data.js
// 从 demo-mock-data.js 机械拆分，保留原有全局常量/函数名以兼容零构建脚本加载。

const demoWorkbenchTaskRows = Vue.reactive((() => {
      const nowMs = Date.now();
      const completedAt = new Date(nowMs - 3600000).toISOString().slice(0, 19).replace('T', ' ');
      const md = '## 任务输出（演示）\n\n用于任务完成态预览；关联结果见右侧「结果」树。';
      const formatTs = (ms) => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
      const taskBody = (id, title, skillId, skillName, resources, status, createdOffsetMin, extra) => {
        const created = formatTs(nowMs - Math.max(0, Number(createdOffsetMin) || 0) * 60000);
        const extraData = { ...(extra || {}) };
        const extraTaskConfig = extraData.taskConfig || {};
        const projectId = String(extraData.projectId || 'PRJ-2026-001');
        delete extraData.taskConfig;
        return {
          id,
          projectId,
          type: 'analysis',
          title,
          status,
          analysisMarkdown: md,
          taskConfig: { skillId, skillName, resources, instruction: (extra && extra.instruction) || '', ...extraTaskConfig },
          projectSource: {
            id,
            status,
            createdAt: created,
            completedAt: status === 'done' ? completedAt : null,
            sourceSkillName: skillName,
            name: title,
            analysisMarkdown: md,
          },
          ...extraData,
        };
      };
      const batchParentId = 'wb-task-batch-01';
      const batchSkillId = 'sk-prj-fork-001';
      const batchSkillName = '施工合同与发票一致性核查';
      const batchResources = [
        { key: 'file:contract-sample', name: '施工合同节选（演示）', type: 'file', format: 'PDF' },
      ];
      const batchInstruction =
        '请使用技能「{{技能名称}}」，针对数据源中「{{标识列}}」列的每一行企业，查询工商登记信息并输出结构化摘要（演示）。';
      const batchChild = (id, rowLabel, status, offsetMin) =>
        taskBody(id, rowLabel, batchSkillId, batchSkillName, batchResources, status, offsetMin, {
          taskType: 'batch-child',
          parentId: batchParentId,
          rowLabel,
          taskConfig: {
            skillId: batchSkillId,
            skillName: batchSkillName,
            resources: batchResources,
            instruction: batchInstruction.replace('{{标识列}}', '企业名称').replace('{{技能名称}}', batchSkillName),
          },
        });
      const batchChildren = [
        batchChild('wb-batch-c-01', '杭州城建集团有限公司', 'done', 90),
        batchChild('wb-batch-c-02', '浙江宏达建设股份有限公司', 'done', 88),
        batchChild('wb-batch-c-03', '宁波港务投资有限公司', 'done', 86),
        batchChild('wb-batch-c-04', '温州民商银行股份有限公司', 'parsing', 20),
        batchChild('wb-batch-c-05', '嘉兴科技城发展有限公司', 'queued', 18),
        batchChild('wb-batch-c-06', '绍兴纺织产业集团有限公司', 'queued', 16),
        batchChild('wb-batch-c-07', '金华义乌小商品贸易公司', 'failed', 14),
        batchChild('wb-batch-c-08', '台州海洋装备制造有限公司', 'done', 12),
      ];
      const batchParent = taskBody(
        batchParentId,
        '企业工商信息批量查询',
        batchSkillId,
        batchSkillName,
        batchResources,
        'parsing',
        100,
        {
          taskType: 'batch',
          children: batchChildren,
          batchMeta: {
            fileName: '企业名单.xlsx',
            idColumn: '企业名称',
            idColumns: ['企业名称'],
            total: batchChildren.length,
            instruction: batchInstruction,
          },
          taskConfig: {
            skillId: batchSkillId,
            skillName: batchSkillName,
            resources: batchResources,
            instruction: batchInstruction,
          },
        }
      );
      const packageTaskMeta = {
        scope: {
          total: 2,
          fileCount: 3,
          folderCount: 1,
        },
        structureMode: 'keep',
        formatMode: 'raw',
        ready: true,
        expireDays: 30,
        previewRows: [
          { key: 'result-folder:arf-tr-wb-task-01', kind: 'folder', title: '合同与发票专项核对', depth: 0 },
          { key: 'result-material:ar-001', kind: 'file', title: '合同与发票一致性检查结果', depth: 1 },
          { key: 'result-material:ar-003', kind: 'file', title: '付款节点与批复对照', depth: 0 },
          { key: 'result-material:ar-dlg-01', kind: 'file', title: '疑点摘录与跟进建议（会话稿）', depth: 0 },
        ],
        items: [
          { key: 'result-folder:arf-tr-wb-task-01', kind: 'result-folder', title: '合同与发票专项核对' },
          { key: 'result-material:ar-dlg-01', kind: 'result-material', title: '疑点摘录与跟进建议（会话稿）' },
        ],
      };
      /** 创建时间错开，便于任务列表按「创建时间倒序」展示时有稳定先后（数值越小越新） */
      return [
        batchParent,
        taskBody('wb-task-01', '合同与发票专项核对', 'sk-prj-fork-001', '施工合同与发票一致性核查', [
          { key: 'file:contract-sample', name: '施工合同节选（演示）', type: 'file', format: 'PDF' },
          { key: 'file:invoice-sample', name: '发票样本（演示）', type: 'file', format: 'PDF' },
        ], 'done', 5760),
        taskBody('wb-task-02', '付款与验收追踪', 'sk-pub-3', '工程款节点支付合规核对', [
          { key: 'file:pay-approve', name: '付款审批（演示）', type: 'file', format: 'PDF' },
        ], 'done', 4320),
        taskBody('wb-task-03', '预算与对标分析', 'sk-prj-fork-003', '合同变更链路与金额追踪（演示失败）', [
          { key: 'file:budget-xls', name: '预算执行表（演示）', type: 'file', format: 'XLSX' },
        ], 'done', 2880),
        taskBody('wb-task-package-01', '审计结果打包下载', 'download-package', '文件打包', [], 'done', 240, {
          taskType: 'download-package',
          packageMeta: packageTaskMeta,
          taskConfig: {
            taskType: 'download-package',
            skillId: 'download-package',
            skillName: '文件打包',
            packageMeta: packageTaskMeta,
          },
        }),
        taskBody('wb-task-04', '往来函证抽样核对', 'sk-pub-2', '投资完成进度偏差扫描', [
          { key: 'file:sample-04', name: '函证控制表（演示）', type: 'file', format: 'XLSX' },
        ], 'parsing', 15, { taskConfig: { taskType: 'generate-skill' } }),
        taskBody('wb-task-05', '采购异常专项扫描', 'sk-prj-fork-002', '采购环节供应商交叉比对（试用）', [
          { key: 'file:sample-05', name: '供应商清单（演示）', type: 'file', format: 'XLSX' },
        ], 'failed', 120),
      ];
    })());

/** 与工作台「结果预览」共用的证据溯源映射（演示数据） */
    const DEMO_ANALYSIS_CITATION_MAP = {
      E1: {
        /** 演示：点击溯源「弹出」时打开的本工作台资料 id（与 demoMakeProjectMaterials 中「合同」条目一致） */
        materialId: 'm-001-03',
        conclusionLabel: '金额一致性异常',
        conclusionContext: '系统识别合同金额与发票累计金额存在异常偏差，且超出阈值。该偏差直接影响资金支付准确性，需优先核查。',
        sourceLabel: '施工合同.pdf（第8页）｜发票台账.xlsx（Sheet1）',
        anchor: '合同#CT-2026-018 第4条；发票台账第12-19行',
        sourceExcerpt: '“合同总价款为人民币 1,260 万元，按进度节点分期支付。”\n“截至 2026-03-18，累计开票金额 1,416 万元。”',
        sourceFullText:
          '【施工合同 CT-2026-018 摘录 · 金额与支付条款】\n\n'
          + '第四条 合同价款与调整\n'
          + '4.1 合同总价款为人民币 1,260 万元（含税），按进度节点分期支付；具体节点与比例见附件《付款计划表》。\n'
          + '4.2 若发生设计变更或现场签证，应按业主确认的变更价款调整合同总价，并同步更新累计开票与结算口径。\n\n'
          + '【发票台账 Sheet1 摘录 · 累计开票】\n'
          + '截至 2026-03-18，本工作台累计开票金额 1,416 万元，较合同总价款超出 156 万元。台账备注栏显示存在跨期开票与红冲记录，需结合合同补充协议与现场签证逐项核对。',
      },
      E2: {
        materialId: 'm-001-02',
        conclusionLabel: '付款时点异常',
        conclusionContext: '部分支付发生在验收节点之前，存在提前支付风险，可能造成资金拨付与工程进度不匹配。',
        sourceLabel: '付款流水.pdf（第3页）｜进度验收单.docx（第2页）',
        anchor: '流水#PAY-334；验收单第2页“未验收”',
        sourceExcerpt: '“2026-02-28 支付进度款 280 万元。”\n“截至 2026-03-05，该节点工程尚未验收通过。”',
        sourceFullText:
          '【付款流水 PAY-334】\n'
          + '2026-02-28 支付进度款 280 万元；摘要：二期路基工程进度款；收款方与合同乙方一致。\n\n'
          + '【进度验收单 · 节点 B-2】\n'
          + '截至 2026-03-05，该节点工程尚未验收通过；现场存在问题清单：基层压实度抽检 2 处不达标，需整改复验后方可进入下一付款节点。\n\n'
          + '审计提示：在验收未通过前发生大额进度款支付，应核查是否满足合同“先验后付”或类似条款，并补充审批豁免资料。',
      },
      E3: {
        materialId: 'm-001-03',
        conclusionLabel: '主体一致性疑点',
        conclusionContext: '供应商主体名称在不同资料中不完全一致，可能是简称，也可能涉及主体识别偏差，需人工确认。',
        sourceLabel: '采购合同.pdf（第1页）｜开户信息表.xlsx（第4行）',
        anchor: '采购合同乙方字段；开户信息表第4行',
        sourceExcerpt: '“乙方：建工实业有限公司。”\n“账户名称：建工实业。”',
        sourceFullText:
          '【采购合同首页 · 乙方信息】\n'
          + '乙方：建工实业有限公司；统一社会信用代码：91**************12；注册地址：……\n\n'
          + '【开户信息表 第4行】\n'
          + '账户名称：建工实业；开户行：……；账号：……\n\n'
          + '说明：名称差异可能为简称，也可能涉及分支机构或授权收款主体。建议调取工商登记与授权委托书，确认付款对象与合同主体法律关系一致。',
      },
    };

    function analysisCitationDisplayIndex(key) {
      const raw = String(key || '').trim();
      const matched = raw.match(/(\d+)$/);
      return matched ? matched[1] : raw;
    }

    function collectAnalysisCitationKeys(text) {
      const seen = new Set();
      const keys = [];
      String(text || '').replace(/\[(E\d+)\]/g, (_, key) => {
        if (!seen.has(key)) {
          seen.add(key);
          keys.push(key);
        }
        return _;
      });
      return keys;
    }

    function buildAnalysisCitationAppendix(text, citationMap) {
      const keys = collectAnalysisCitationKeys(text);
      if (!keys.length) return '';
      const map = citationMap || DEMO_ANALYSIS_CITATION_MAP;
      const lines = ['---', '', '### 引用信息', ''];
      keys.forEach((key) => {
        const data = map[key] || {};
        const idx = analysisCitationDisplayIndex(key);
        const sourceLabel = String(data.sourceLabel || '引用来源').trim() || '引用来源';
        const excerpt = String(data.sourceExcerpt || data.sourceFullText || '').trim() || '暂无可展示的引用内容';
        lines.push(`**（${idx}）${sourceLabel}**`);
        excerpt.split('\n').forEach((line) => {
          lines.push(`> ${line}`);
        });
        lines.push('');
      });
      return lines.join('\n').trim();
    }

    function normalizeAnalysisCitationText(text) {
      return String(text || '').replace(/\[(E\d+)\]/g, (_, key) => `（${analysisCitationDisplayIndex(key)}）`);
    }

    function buildAnalysisResultPreviewMarkdown(rec) {
      const createdAt = rec.createdAt || '—';
      const name = rec.name || '当前分析任务';
      const base = [
        '## 一、分析结论摘要',
        `围绕“${name}”，系统对合同、发票、付款流水与验收记录进行了交叉比对。初步识别出金额口径不一致、付款时点与验收节点不匹配等问题，其中金额差异集中在少数高金额条目，具备进一步核查价值。[E1]`,
        '本次分析显示，异常并非单点偶发，而是呈现出“同类字段在多个资料中重复偏离”的模式，提示流程控制环节可能存在系统性执行偏差。建议优先核验高金额条目及跨月支付记录，并补充项目变更审批链路资料，以提高结论稳定性。',
        '',
        '## 二、关键发现',
        '- 发现 3 处合同金额与发票累计金额差异，最高差额 156 万元；[E1]',
        '- 发现 2 处付款日期早于对应验收节点，存在提前支付风险；[E2]',
        '- 发现 1 处供应商名称近似不一致，需进一步确认主体是否同一。[E3]',
        '',
        '## 三、审计建议',
        '建议按“先金额、后流程、再主体一致性”的顺序推进复核：先确认金额差异是否由补充协议引起，再核验付款与验收的流程闭环，最后核查供应商主体一致性与授权关系。对已确认异常项，建议同步补充责任部门说明，形成可落地整改台账。',
        '',
        `> 生成时间：${createdAt}`,
      ].join('\n');
      const appendix = buildAnalysisCitationAppendix(base, rec && rec.citationMap);
      return [normalizeAnalysisCitationText(base), appendix].filter(Boolean).join('\n\n');
    }

    /**
     * 分析结果「生成说明」：技能名 + 资料名列表（演示）。
     * @param {object} rec - 含 sourceSkillName、可选 sourceMaterialIds
     * @param {(id: string) => string} [resolveMaterialName] - 资料 id → 展示名
     */
    function buildAnalysisResultGenerationDesc(rec, resolveMaterialName) {
      const skill = String((rec && rec.sourceSkillName) || '').trim() || '关联技能';
      const ids = Array.isArray(rec && rec.sourceMaterialIds) ? rec.sourceMaterialIds : [];
      const resolver = typeof resolveMaterialName === 'function' ? resolveMaterialName : (id) => String(id || '').trim();
      const names = ids.map((id) => resolver(id)).filter(Boolean);
      if (!names.length) {
        return `使用技能「${skill}」基于当前工作台所选资料生成的结果（演示）。`;
      }
      const max = 5;
      const shown = names.slice(0, max);
      const more = names.length > max ? ` 等共 ${names.length} 项资料` : '';
      return `使用技能「${skill}」基于《${shown.join('》《')}》${more}生成的结果。`;
    }

    function isCsvAnalysisResultRow(row) {
      return String((row && row.format) || '').trim().toUpperCase() === 'CSV';
    }

    function hydrateDemoAnalysisResultMarkdown(rows) {
      return (rows || []).map((row) => (
        row && row.status === 'done' && !isCsvAnalysisResultRow(row) && !row.analysisMarkdown
          ? { ...row, analysisMarkdown: buildAnalysisResultPreviewMarkdown(row) }
          : row
      ));
    }

    /** 资料预览 · 仅文档页示意（不含文件元信息；与基本信息 Tab 拆分） */
    function materialPreviewDocumentPagesFromRecord(rec) {
      if (!rec) return ['暂无内容'];
      const fmt = String(rec.format || '').toUpperCase();
      if (fmt === 'XLSX' || fmt === 'XLS' || fmt === 'CSV') {
        return ['【表格预览】\n\n结构化表格内容请在「文件预览」表格区查看（演示）。'];
      }
      return [
        '【在线预览页 1】\n\n这里展示 PDF 首屏内容（演示态）。\n系统后续可替换为真实 PDF 渲染流。',
        '【在线预览页 2】\n\n这是第 2 页示意内容。\n你可以继续补充 OCR 文本、关键段落高亮、页码跳转等能力。\n\n当前版本重点是：资料点击即可弹出在线浏览窗口。',
      ];
    }

    /** 资料预览 · OCR 演示页（每页对应文档预览页） */
    function materialPreviewOcrPagesFromRecord(rec) {
      if (!rec) return ['暂无 OCR 内容'];
      const fmt = String(rec.format || '').toUpperCase();
      if (fmt === 'XLSX' || fmt === 'XLS' || fmt === 'CSV') {
        return [
          '【OCR 结果 · 演示】\n\n表格类资料的单元格级 OCR 可在后续版本接入；当前为占位说明。',
        ];
      }
      const name = String(rec.name || '未命名文件');
      const docs = materialPreviewDocumentPagesFromRecord(rec);
      return docs.map(
        (body, index) =>
          `【OCR 识别结果 · 第 ${index + 1} 页】\n文件：${name}\n\n${body}`,
      );
    }

    /** 为 OCR 结果纯文本左侧追加行号（与 pre-wrap 展示配合；开启时建议配合等宽字体类） */
    function materialPreviewOcrPageWithLineNumbers(pageText, showLineNumbers) {
      if (!showLineNumbers) return String(pageText == null ? '' : pageText);
      const s = String(pageText == null ? '' : pageText);
      if (!s) return s;
      const lines = s.split('\n');
      const w = String(lines.length).length;
      return lines.map((line, i) => `${String(i + 1).padStart(w, ' ')}  ${line}`).join('\n');
    }

    /**
     * 兼容旧调用：历史上与「在线预览」页片同源；现等同于文档预览页数组。
     * @deprecated 新代码请使用 materialPreviewDocumentPagesFromRecord
     */
    function materialPreviewPagesFromRecord(rec) {
      return materialPreviewDocumentPagesFromRecord(rec);
    }

    /** 资料行 → 审计助手资料池节点（保留 projectSource 引用） */
    function mapProjectRowToWorkbenchMaterial(row, projectId) {
      const fmt = String(row.format || '').toUpperCase();
      const rawSubtype = fmt === 'XLSX' || fmt === 'XLS' || fmt === 'CSV' ? 'table' : 'document';
      const title = row.name || '未命名';
      const statusText = ({ uploading: '上传中', queued: '排队中', parsing: '解析中', done: '解析完成', failed: '未解析' })[row.status] || (row.status || '—');
      return {
        id: row.id,
        type: 'raw',
        rawSubtype,
        title,
        projectSource: row,
        checked: false,
        overview: '资料',
        meta: row.uploadedAt || '—',
        originalView: rawSubtype === 'table'
          ? { type: 'table', headers: ['说明'], rows: [['请在工作台查看表格类资料全文。']] }
          : { type: 'document', pages: materialPreviewPagesFromRecord(row) },
        paired: {
          id: 'ex-' + row.id,
          title: title + ' - 提取结果',
          overview: row.status === 'done' ? '解析完成' : `状态：${statusText}`,
          summary: '解析摘要',
          excerpts: [],
          extractBlocks: [],
        },
        excerpts: [],
      };
    }
        /** 工作台结果行 → 审计助手中的审计发现节点 */
    function mapAnalysisResultRowToWorkbench(row, projectId) {
      const title = row.name || '未命名';
      const isCsv = isCsvAnalysisResultRow(row);
      const analysisMarkdown = isCsv ? '' : (row.analysisMarkdown || buildAnalysisResultPreviewMarkdown({ name: title, createdAt: row.createdAt }));
      const analysisCsvData = isCsv ? String(row.analysisCsvData || '').trim() : '';
      const line = `【${title}】\n生成时间：${row.createdAt || '—'}`;
      return {
        id: row.id,
        type: 'analysis',
        title,
        projectSource: row,
        checked: false,
        overview: '审计发现',
        format: String(row.format || 'MD').toUpperCase(),
        sourceMaterialIds: Array.isArray(row.sourceMaterialIds) ? row.sourceMaterialIds.slice() : [],
        analysisMarkdown,
        analysisCsvData,
        citationMap: row.citationMap || DEMO_ANALYSIS_CITATION_MAP,
        excerpts: [isCsv ? (analysisCsvData || line) : line],
        excerptsWithCitations: [{ text: isCsv ? (analysisCsvData || line) : line, citations: [] }],
        meta: row.createdAt || '—',
      };
    }

    Object.keys(demoProjectAnalysisResultsById).forEach((projectId) => {
      demoProjectAnalysisResultsById[projectId] = hydrateDemoAnalysisResultMarkdown(demoProjectAnalysisResultsById[projectId]);
    });

/**
     * 工作台 / 审计助手共用：按选定技能向 demoProjectAnalysisResultsById 追加演示分析任务。
     * @param {string} projectId
     * @param {object[]} templates
     * @param {{ message?: { success?: Function, warning?: Function }, successMessage?: string, registerTimer?: (id: number) => void }} [options]
     * @returns {number} 提交条数，0 表示未提交
     */
    function demoSubmitProjectTemplateAnalysisJobs(projectId, templates, options) {
      const opts = options || {};
      const msg = opts.message || {};
      const pid = String(projectId || '');
      const tpls = Array.isArray(templates) ? templates.filter(Boolean) : [];
      if (!pid || !tpls.length) {
        if (msg.warning) msg.warning('暂无可提交的技能');
        return 0;
      }
      if (!Array.isArray(demoProjectAnalysisResultsById[pid])) demoProjectAnalysisResultsById[pid] = [];
      const reg =
        typeof opts.registerTimer === 'function'
          ? opts.registerTimer
          : (id) => {
              if (!window.__demoAnalysisJobTimers) window.__demoAnalysisJobTimers = [];
              window.__demoAnalysisJobTimers.push(id);
            };
      const now = new Date();
      const createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
      const batchTaskId = 'wb-task-01';
      const batchTaskName = '合同与发票专项核对';
      const insert = tpls.map((tpl, idx) => ({
        id: 'ar-' + (Date.now() + idx),
        name: `${tpl.name} - 发现结果`,
        sourceTaskId: batchTaskId,
        sourceTaskName: batchTaskName,
        sourceSkillName: String(tpl.name || '').trim() || '技能',
        tags: Array.isArray(tpl.tags) ? tpl.tags.slice(0, 3) : [],
        createdAt,
        status: 'queued',
      }));
      demoProjectAnalysisResultsById[pid] = [...insert, ...demoProjectAnalysisResultsById[pid]];
      insert.forEach((item, idx) => {
        const parseDelay = 400 + idx * 240;
        const doneDelay = parseDelay + 900 + idx * 260;
        const t1 = window.setTimeout(() => {
          const rows = demoProjectAnalysisResultsById[pid] || [];
          const i = rows.findIndex((r) => r.id === item.id);
          if (i < 0) return;
          demoProjectAnalysisResultsById[pid].splice(i, 1, { ...rows[i], status: 'parsing' });
        }, parseDelay);
        const t2 = window.setTimeout(() => {
          const rows = demoProjectAnalysisResultsById[pid] || [];
          const i = rows.findIndex((r) => r.id === item.id);
          if (i < 0) return;
          const isFailed = Math.random() < 0.2;
          demoProjectAnalysisResultsById[pid].splice(i, 1, { ...rows[i], status: isFailed ? 'failed' : 'done' });
        }, doneDelay);
        reg(t1);
        reg(t2);
      });
      const custom = opts.successMessage != null && String(opts.successMessage).trim() !== '';
      if (msg.success) msg.success(custom ? String(opts.successMessage).trim() : `已提交 ${insert.length} 条分析任务`);
      return insert.length;
    }

(function registerDemoTaskResultData(global) {
  global.DemoTaskResultData = {
    taskRows: typeof demoWorkbenchTaskRows !== 'undefined' ? demoWorkbenchTaskRows : [],
    workbenchTaskRows: typeof demoWorkbenchTaskRows !== 'undefined' ? demoWorkbenchTaskRows : [],
    analysisResultsByProject: typeof demoProjectAnalysisResultsById !== 'undefined' ? demoProjectAnalysisResultsById : {},
    analysisResultFoldersByProject: typeof demoProjectAnalysisResultFoldersById !== 'undefined' ? demoProjectAnalysisResultFoldersById : {},
    citations: typeof DEMO_ANALYSIS_CITATION_MAP !== 'undefined' ? DEMO_ANALYSIS_CITATION_MAP : {},
  };
})(window);
