(function () {
  const NS = window.DemoFreeAudit = window.DemoFreeAudit || {};
  NS.watch = {
        materialSearchQuery() {
          const auto = this.workbenchMaterialFileTreeAutoExpandKeys || [];
          if (!auto.length) return;
          const s = new Set(this.workbenchFileTreeExpandedKeys || []);
          auto.forEach((k) => s.add(k));
          this.workbenchFileTreeExpandedKeys = Array.from(s);
        },
        workbenchAnalysisSearchQuery() {
          const auto = this.workbenchAnalysisResultAntTreeAutoExpandKeys || [];
          if (!auto.length) return;
          const s = new Set(this.workbenchAnalysisResultTreeExpandedKeys || []);
          auto.forEach((k) => s.add(k));
          this.workbenchAnalysisResultTreeExpandedKeys = Array.from(s);
        },
        workbenchEmbedAnalysisOutputToolbarDisabled(disabled) {
          if (!disabled && this.selectedMaterial && this.selectedMaterial.type === 'analysis') {
            this.$nextTick(() => this.resetWorkbenchAnalysisEmbedDraftFromPreview());
          }
        },
        filteredBatchChildren() {
          this.ensureWbBatchChildPageInRange();
        },
  };
})();
