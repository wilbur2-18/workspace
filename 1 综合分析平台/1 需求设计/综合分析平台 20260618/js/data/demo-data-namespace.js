(function registerDemoDataNamespace(global) {
  const project = global.DemoProjectData || {};
  const skill = global.DemoSkillData || {};
  const material = global.DemoMaterialData || {};
  const taskResult = global.DemoTaskResultData || {};
  global.DemoData = {
    projects: project.projects || [],
    materialFoldersByProject: material.materialFoldersByProject || project.materialFoldersByProject || {},
    materialsByProject: material.materialsByProject || {},
    analysisResultsByProject: taskResult.analysisResultsByProject || {},
    analysisResultFoldersByProject: taskResult.analysisResultFoldersByProject || {},
    workbenchTaskRows: taskResult.workbenchTaskRows || [],
    projectAnalysisTemplatesByProject: project.projectAnalysisTemplatesByProject || {},
    sharedPrivateAnalysisTemplates: skill.sharedPrivateAnalysisTemplates || [],
    skillLibrary: skill.skillLibrary || {},
    publicSkillSeeds: skill.publicSkillSeeds || [],
    privateSkillSeeds: skill.privateSkillSeeds || [],
  };
})(window);
