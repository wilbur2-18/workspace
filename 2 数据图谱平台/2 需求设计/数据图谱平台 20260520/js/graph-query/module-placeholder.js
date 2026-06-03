(function () {
  const app = window.__DGP_COMPONENT_APP;
  app.component('ModulePlaceholderView', {
    props: {
      title: { type: String, required: true },
      desc: { type: String, required: true },
      points: { type: Array, default: () => [] },
    },
    template: `
      <div class="dgp-scroll">
        <main class="dgp-page">
          <section class="dgp-card graph-placeholder-card">
            <div class="graph-panel-kicker">模块占位</div>
            <h1 class="graph-hero-title">{{ title }}</h1>
            <p class="dgp-section-desc">{{ desc }}</p>
            <div class="graph-placeholder-list">
              <div v-for="p in points" :key="p" class="graph-placeholder-item">{{ p }}</div>
            </div>
          </section>
        </main>
      </div>
    `,
  });
})();
