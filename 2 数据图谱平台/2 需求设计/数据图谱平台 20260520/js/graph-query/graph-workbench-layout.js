(function () {
  window.DGP_WORKBENCH_LAYOUT = {
    data() {
      return {
        sourcesCollapsed: true,
        studioCollapsed: false,
        sourcesWidth: 300,
        studioWidth: 344,
        resizing: null,
      };
    },
    computed: {
      leftWorkbenchRailStyle() {
        if (this.sourcesCollapsed) return { flex: '0 0 0px', minWidth: 0, width: '0px', overflow: 'hidden' };
        const width = Math.min(500, Math.max(200, Number(this.sourcesWidth) || 300));
        return { flex: `0 0 ${width}px`, width: `${width}px`, minWidth: '200px', maxWidth: '500px' };
      },
      rightWorkbenchRailStyle() {
        if (this.studioCollapsed) return { flex: '0 0 0px', minWidth: 0, width: '0px', overflow: 'hidden' };
        const width = Math.min(500, Math.max(240, Number(this.studioWidth) || 344));
        return { flex: `0 0 ${width}px`, width: `${width}px`, minWidth: '240px', maxWidth: '500px' };
      },
    },
    methods: {
      toggleSourcesCollapsed() {
        this.sourcesCollapsed = !this.sourcesCollapsed;
      },
      toggleStudioCollapsed() {
        this.studioCollapsed = !this.studioCollapsed;
      },
      beginResize(side, e) {
        e.preventDefault();
        const startX = typeof e.clientX === 'number' ? e.clientX : Number(e.x || e.pageX || 0);
        this.resizing = {
          side,
          startX,
          sourcesWidth: this.sourcesWidth,
          studioWidth: this.studioWidth,
        };
        document.addEventListener('mousemove', this.onResizeMove);
        document.addEventListener('mouseup', this.stopResize);
      },
      onResizeMove(e) {
        if (!this.resizing) return;
        const clientX = typeof e.clientX === 'number' ? e.clientX : Number(e.x || e.pageX || 0);
        const delta = clientX - this.resizing.startX;
        if (this.resizing.side === 'sources') {
          this.sourcesWidth = Math.min(500, Math.max(200, this.resizing.sourcesWidth + delta));
        } else if (this.resizing.side === 'studio') {
          this.studioWidth = Math.min(500, Math.max(240, this.resizing.studioWidth - delta));
        }
      },
      stopResize() {
        this.resizing = null;
        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.stopResize);
      },
    },
    beforeUnmount() {
      this.stopResize();
    },
  };
})();
