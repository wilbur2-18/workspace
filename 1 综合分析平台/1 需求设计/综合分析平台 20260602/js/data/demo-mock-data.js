// demo-mock-data.js
// 兼容聚合入口：实际 mock 数据已拆分到 project/skill/material/task-result data 文件。
// 保留本文件用于维持旧加载点和 README 中的兼容口径。

(function registerDemoMockDataCompat(global) {
  global.DemoMockData = {
    project: global.DemoProjectData || {},
    skill: global.DemoSkillData || {},
    material: global.DemoMaterialData || {},
    taskResult: global.DemoTaskResultData || {},
  };
})(window);
