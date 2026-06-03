// material-data.js
// 从 demo-mock-data.js 机械拆分，保留原有全局常量/函数名以兼容零构建脚本加载。

// 工作台与审计助手共用的资料 / 审计发现（结果）数据源
    function demoMakeProjectMaterials() {
      const tagPool = ['会议纪要', '银行流水', '合同', '发票', '总账明细', '审批单', '项目台账', '资金拨付表', '往来函证', '验收报告'];
      const uploaderPool = ['张审计', '李审计', '王审计', '系统导入'];
      const extByTag = {
        会议纪要: 'DOCX',
        银行流水: 'PDF',
        合同: 'PDF',
        发票: 'PDF',
        总账明细: 'XLSX',
        审批单: 'PDF',
        项目台账: 'XLSX',
        资金拨付表: 'XLSX',
        往来函证: 'PDF',
        验收报告: 'DOCX',
      };
      const list = [];
      const sortBucket = { __root: 0, mf001: 0, mf002: 0, mf003: 0, __abn: 0 };
      function nextSort(bucket) {
        sortBucket[bucket] = (sortBucket[bucket] || 0) + 1;
        return sortBucket[bucket];
      }
      for (let i = 1; i <= 35; i++) {
        const tag = tagPool[(i - 1) % tagPool.length];
        const format = extByTag[tag] || 'PDF';
        const seq = String(i).padStart(2, '0');
        const day = String((i % 28) + 1).padStart(2, '0');
        let status = 'done';
        let progress = 100;
        if (i % 9 === 0) {
          status = 'failed';
          progress = 100;
        } else if (i % 5 === 0) {
          status = 'parsing';
          progress = 25 + ((i * 7) % 70);
        } else if (i % 7 === 0) {
          status = 'queued';
          progress = 0;
        }
        let parentId = null;
        let sort = 0;
        if (status === 'done') {
          const b = i % 6;
          if (b === 0 || b === 1) {
            parentId = null;
            sort = nextSort('__root');
          } else if (b === 2 || b === 3) {
            parentId = 'mf-001';
            sort = nextSort('mf001');
          } else if (b === 4) {
            parentId = 'mf-002';
            sort = nextSort('mf002');
          } else {
            parentId = 'mf-003';
            sort = nextSort('mf003');
          }
        } else {
          parentId = null;
          sort = nextSort('__abn');
        }
        list.push({
          id: 'm-001-' + seq,
          name: `${tag}-资料-${seq}.${format.toLowerCase()}`,
          uploader: uploaderPool[(i - 1) % uploaderPool.length],
          size: Number((0.8 + (i * 0.65) % 16).toFixed(1)),
          format,
          status,
          progress,
          parentId,
          sort,
          uploadedAt: `2026-03-${day} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
        });
      }
      list.unshift(
        { id: 'm-001-parse-failed-demo', name: '银行流水-解析失败.xlsx', uploader: '系统导入', size: 9.8, format: 'XLSX', status: 'failed', progress: 0, failureReason: '解析失败：表头缺失，请修正后重跑', parentId: null, sort: -7, uploadedAt: '2026-03-21 09:12' },
        { id: 'm-001-sample-img', name: '现场签证照片.png', uploader: '张审计', size: 1.6, format: 'PNG', status: 'done', progress: 100, parentId: null, sort: -6, uploadedAt: '2026-03-21 09:20' },
        { id: 'm-001-sample-wps', name: '整改说明.wps', uploader: '李审计', size: 0.7, format: 'WPS', status: 'done', progress: 100, parentId: null, sort: -5, uploadedAt: '2026-03-21 09:28' },
        { id: 'm-001-sample-csv', name: '银行流水导出.csv', uploader: '系统导入', size: 3.4, format: 'CSV', status: 'done', progress: 100, parentId: null, sort: -4, uploadedAt: '2026-03-21 09:36' },
        { id: 'm-001-sample-txt', name: '访谈纪要补充.txt', uploader: '王审计', size: 0.2, format: 'TXT', status: 'done', progress: 100, parentId: null, sort: -3, uploadedAt: '2026-03-21 09:44' },
        { id: 'm-001-sample-json', name: '合同抽取字段.json', uploader: '系统导入', size: 0.4, format: 'JSON', status: 'done', progress: 100, parentId: null, sort: -2, uploadedAt: '2026-03-21 09:52' },
        { id: 'm-001-sample-xml', name: '发票接口回执.xml', uploader: '系统导入', size: 0.5, format: 'XML', status: 'done', progress: 100, parentId: null, sort: -1, uploadedAt: '2026-03-21 10:00' },
      );
      return list;
    }
    function demoMakeAnalysisResults() {
      /** 与 workbenchTaskDemoRows 中已完成任务 id 对齐；对话产出使用 resultTreeBucket: 'dialog' */
      return [
        {
          id: 'ar-001',
          name: '合同与发票一致性检查结果',
          format: 'MD',
          sourceTaskId: 'wb-task-01',
          sourceTaskName: '合同与发票专项核对',
          sourceSkillName: '施工合同与发票一致性核查',
          sourceMaterialIds: ['m-001-03', 'm-001-02', 'm-001-01'],
          createdAt: '2026-03-24 10:20',
          status: 'done',
          analysisMarkdownEditedBy: '王审计',
          analysisMarkdownEditedAt: '2026-03-24 14:30',
        },
        {
          id: 'ar-003',
          name: '付款节点与批复对照',
          format: 'MD',
          sourceTaskId: 'wb-task-02',
          sourceTaskName: '付款与验收追踪',
          sourceSkillName: '工程款节点支付合规核对',
          sourceMaterialIds: ['m-001-04', 'm-001-05'],
          createdAt: '2026-03-24 09:12',
          status: 'done',
        },
        {
          id: 'ar-csv-002',
          name: '合同发票金额差异明细',
          format: 'CSV',
          sourceTaskId: 'wb-task-01',
          sourceTaskName: '合同与发票专项核对',
          sourceSkillName: '施工合同与发票一致性核查',
          sourceMaterialIds: ['m-001-03', 'm-001-02'],
          createdAt: '2026-03-24 11:05',
          status: 'done',
          analysisCsvData: [
            '合同编号,合同金额(万元),发票累计(万元),差额(万元),差异类型,备注',
            'HT-2025-018,1250.00,1094.00,156.00,金额口径不一致,末次发票未含变更增补',
            'HT-2025-031,860.00,860.00,0.00,一致,—',
            'HT-2025-042,420.50,398.20,22.30,部分开票滞后,待补 3 月进度款发票',
            'HT-2025-055,680.00,712.40,-32.40,发票超合同,需核对是否含代垫费用',
          ].join('\n'),
        },
        {
          id: 'ar-csv-003',
          name: '付款节点批复对照表',
          format: 'CSV',
          sourceTaskId: 'wb-task-02',
          sourceTaskName: '付款与验收追踪',
          sourceSkillName: '工程款节点支付合规核对',
          sourceMaterialIds: ['m-001-04', 'm-001-05'],
          createdAt: '2026-03-24 09:45',
          status: 'done',
          analysisCsvData: [
            '节点名称,计划付款日,实际付款日,批复金额(万元),验收状态,是否提前支付',
            '开工预付款,2025-11-15,2025-11-14,300.00,已批复,否',
            '主体封顶款,2026-01-20,2026-01-08,520.00,验收未完成,是',
            '竣工验收款,2026-03-10,—,680.00,待验收,—',
            '质保金返还,2027-03-10,—,120.00,未到期,—',
          ].join('\n'),
        },
        {
          id: 'ar-007',
          name: '预算执行率分项汇总',
          format: 'CSV',
          sourceTaskId: 'wb-task-03',
          sourceTaskName: '预算与对标分析',
          sourceSkillName: '预算执行率分项汇总（技能）',
          createdAt: '2026-03-22 18:30',
          status: 'done',
          analysisCsvData: [
            '分项,预算金额,执行金额,执行率,偏差说明',
            '"土建工程","12500000","11860000","94.88%","主体工程未完成最终结算"',
            '"安装工程","4680000","5010000","107.05%","设备调试追加材料费"',
            '"监理费","520000","520000","100.00%","按合同节点执行"',
            '"其他费用","930000","1180000","126.88%","现场签证与检测费用增加"',
          ].join('\n'),
        },
        {
          id: 'ar-approval-budget-temp',
          name: '预算偏差临时表结果',
          format: 'MD',
          sourceTaskId: 'wb-task-03',
          sourceTaskName: '预算与对标分析',
          sourceSkillName: '预算偏差临时测算',
          createdAt: '2026-03-25 10:18',
          status: 'done',
        },
        {
          id: 'ar-dlg-01',
          name: '疑点摘录与跟进建议（会话稿）',
          format: 'MD',
          resultTreeBucket: 'dialog',
          resultFolderId: 'arf-dialog-notes',
          sourceSkillName: '审计助手对话',
          createdAt: '2026-03-25 09:00',
          status: 'done',
        },
        {
          id: 'ar-csv-dlg-02',
          name: '疑点清单（表格）',
          format: 'CSV',
          resultTreeBucket: 'dialog',
          resultFolderId: 'arf-dialog-notes',
          sourceSkillName: '审计助手对话',
          createdAt: '2026-03-25 09:18',
          status: 'done',
          analysisCsvData: [
            '疑点编号,疑点标题,风险等级,关联资料,跟进建议',
            'D-001,付款早于验收节点,高,付款申请单·验收记录,优先复核主体封顶款',
            'D-002,供应商名称近似不一致,中,合同·发票,核对主体授权与更名记录',
            'D-003,发票累计超合同金额,中,合同台账·发票清单,确认是否含变更增补',
            'D-004,预算执行率超 100% 分项,低,预算表·执行明细,补充偏差说明材料',
          ].join('\n'),
        },
        {
          id: 'ar-batch-c-01',
          name: '杭州城建集团有限公司工商信息摘要',
          format: 'CSV',
          sourceTaskId: 'wb-batch-c-01',
          sourceTaskName: '杭州城建集团有限公司',
          sourceSkillName: '施工合同与发票一致性核查',
          createdAt: '2026-03-25 09:16',
          status: 'done',
          analysisCsvData: [
            '字段,内容',
            '企业名称,杭州城建集团有限公司',
            '统一社会信用代码,91330100MA2XXXX01',
            '注册地址,杭州市西湖区文三路 88 号',
            '法定代表人,张某某',
            '注册资本,50000 万元',
            '成立日期,1998-06-12',
            '经营状态,存续',
            '所属行业,建筑业',
          ].join('\n'),
        },
        {
          id: 'ar-batch-c-03',
          name: '宁波港务投资有限公司工商信息摘要',
          format: 'MD',
          sourceTaskId: 'wb-batch-c-03',
          sourceTaskName: '宁波港务投资有限公司',
          sourceSkillName: '施工合同与发票一致性核查',
          createdAt: '2026-03-25 09:22',
          status: 'done',
        },
      ];
    }
    /** 工作台资料文件夹（与 demoProjectMaterialsById 同 projectId 对齐；仅演示） */
    const demoProjectMaterialFoldersById = Vue.reactive({
      'PRJ-2026-001': [
        { id: 'mf-001', name: '二零二六年度工程项目合同与财务资料归档整理专用文件夹演示专用', parentId: null, sort: 0 },
        { id: 'mf-002', name: '合同扫描件', parentId: 'mf-001', sort: 0 },
        { id: 'mf-003', name: '进度与验收', parentId: null, sort: 1 },
      ],
      'PRJ-2026-002': [],
      'PRJ-2026-003': [],
    });
    const demoProjectMaterialsById = Vue.reactive({
      'PRJ-2026-001': demoMakeProjectMaterials(),
      'PRJ-2026-002': [
        { id: 'm-101', name: '专项资金台账.xlsx', uploader: '张审计', size: 2.8, format: 'XLSX', status: 'done', progress: 100, parentId: null, sort: 0, uploadedAt: '2026-03-22 18:45' },
        { id: 'm-102', name: '审批单-支付节点.pdf', uploader: '李审计', size: 0.9, format: 'PDF', status: 'done', progress: 100, parentId: null, sort: 1, uploadedAt: '2026-03-22 18:48' },
      ],
      'PRJ-2026-003': [],
    });
    const demoProjectAnalysisResultsById = Vue.reactive({
      'PRJ-2026-001': demoMakeAnalysisResults(),
      'PRJ-2026-003': [],
    });
    /** 审计助手「结果」树文件夹（与 demoProjectAnalysisResultsById 同 projectId；根级 parentId 为空；linkedTaskId 表示任务完成时自动创建的任务夹） */
    const demoProjectAnalysisResultFoldersById = Vue.reactive({
      'PRJ-2026-001': [
        { id: 'arf-tr-wb-task-01', name: '合同与发票专项核对', parentId: null, sort: 10, linkedTaskId: 'wb-task-01' },
        { id: 'arf-tr-wb-task-02', name: '付款与验收追踪', parentId: null, sort: 11, linkedTaskId: 'wb-task-02' },
        { id: 'arf-tr-wb-task-03', name: '预算与对标分析', parentId: null, sort: 12, linkedTaskId: 'wb-task-03' },
        { id: 'arf-dialog-notes', name: '会话纪要夹', parentId: null, sort: 1 },
      ],
      'PRJ-2026-002': [],
      'PRJ-2026-003': [],
    });
    const demoCloneRows = (rows) => JSON.parse(JSON.stringify(Array.isArray(rows) ? rows : []));
    ['PRJ-2026-002', 'PRJ-2026-003'].forEach((pid) => {
      demoProjectMaterialFoldersById[pid] = demoCloneRows(demoProjectMaterialFoldersById['PRJ-2026-001']);
      demoProjectMaterialsById[pid] = demoCloneRows(demoProjectMaterialsById['PRJ-2026-001']);
      demoProjectAnalysisResultsById[pid] = demoCloneRows(demoProjectAnalysisResultsById['PRJ-2026-001']);
      demoProjectAnalysisResultFoldersById[pid] = demoCloneRows(demoProjectAnalysisResultFoldersById['PRJ-2026-001']);
    });
    demoProjectMaterialFoldersById['PRJ-2026-004'] = [];
    demoProjectMaterialsById['PRJ-2026-004'] = [];
    demoProjectAnalysisResultsById['PRJ-2026-004'] = [];
    demoProjectAnalysisResultFoldersById['PRJ-2026-004'] = [];
    /** 跑批任务创建 · 数据源预览（演示，不解析真实 xlsx/csv） */
    const DEMO_BATCH_DATASOURCE_PREVIEW = {
      columns: ['企业名称', '统一社会信用代码', '注册地址', '法定代表人', '注册资本', '成立日期', '经营状态', '所属行业'],
      rows: [
        ['杭州城建集团有限公司', '91330100MA2XXXX01', '杭州市西湖区文三路 88 号', '张某某', '50000 万元', '1998-06-12', '存续', '建筑业'],
        ['浙江宏达建设股份有限公司', '91330100MA2XXXX02', '杭州市滨江区江南大道 168 号', '李某某', '12000 万元', '2005-03-08', '存续', '建筑业'],
        ['宁波港务投资有限公司', '91330200MA2XXXX03', '宁波市北仑区港口路 1 号', '王某某', '80000 万元', '2001-11-20', '存续', '交通运输'],
        ['温州民商银行股份有限公司', '91330300MA2XXXX04', '温州市鹿城区车站大道 200 号', '陈某某', '200000 万元', '2015-01-16', '存续', '金融业'],
        ['嘉兴科技城发展有限公司', '91330400MA2XXXX05', '嘉兴市南湖区科技城路 66 号', '赵某某', '30000 万元', '2010-07-30', '存续', '房地产业'],
        ['绍兴纺织产业集团有限公司', '91330600MA2XXXX06', '绍兴市柯桥区纺都大道 18 号', '周某某', '15000 万元', '2003-09-05', '存续', '制造业'],
        ['金华义乌小商品贸易公司', '91330700MA2XXXX07', '金华市义乌市稠州北路 100 号', '吴某某', '5000 万元', '2012-04-22', '存续', '批发零售'],
        ['台州海洋装备制造有限公司', '91331000MA2XXXX08', '台州市椒江区滨海大道 50 号', '郑某某', '25000 万元', '2008-12-01', '存续', '制造业'],
        ['湖州绿色能源科技有限公司', '91330500MA2XXXX09', '湖州市吴兴区新能源路 9 号', '孙某某', '8000 万元', '2018-05-17', '存续', '电力热力'],
        ['舟山远洋渔业发展有限公司', '91330900MA2XXXX10', '舟山市定海区渔港路 3 号', '钱某某', '6000 万元', '2006-08-28', '存续', '农林牧渔'],
      ],
    };
    window.DEMO_BATCH_DATASOURCE_PREVIEW = DEMO_BATCH_DATASOURCE_PREVIEW;

(function registerDemoMaterialData(global) {
  global.DemoMaterialData = {
    materialFoldersByProject: typeof demoProjectMaterialFoldersById !== 'undefined' ? demoProjectMaterialFoldersById : {},
    materialsByProject: typeof demoProjectMaterialsById !== 'undefined' ? demoProjectMaterialsById : {},
    analysisResultsByProject: typeof demoProjectAnalysisResultsById !== 'undefined' ? demoProjectAnalysisResultsById : {},
    analysisResultFoldersByProject: typeof demoProjectAnalysisResultFoldersById !== 'undefined' ? demoProjectAnalysisResultFoldersById : {},
    batchDatasourcePreview: typeof DEMO_BATCH_DATASOURCE_PREVIEW !== 'undefined' ? DEMO_BATCH_DATASOURCE_PREVIEW : {},
  };
})(window);
