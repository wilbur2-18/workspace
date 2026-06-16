/**
 * Global DsIcon component — IconPark Outline subset via ICONPARK_ICONS + DEMO_ICON_MAP.
 */
(function () {
  const ICON_MIN_PX = 14;
  const app = window.__DEMO_APP;
  if (!app) return;

  const mapApi = () => window.DEMO_ICON_MAP || {};
  const registry = () => window.ICONPARK_ICONS || {};

  app.component('DsIcon', {
    name: 'DsIcon',
    inheritAttrs: true,
    props: {
      name: { type: String, required: true },
      size: { type: [Number, String], default: null },
      spin: { type: Boolean, default: false },
    },
    computed: {
      logicalName() {
        const raw = String(this.name || '').trim();
        if (!raw) return '';
        const { LOGICAL_TO_ICONPARK, FA_LEGACY_TO_LOGICAL, faSuffixToLogical } = mapApi();
        if (LOGICAL_TO_ICONPARK && LOGICAL_TO_ICONPARK[raw]) return raw;
        if (raw.startsWith('fa-')) {
          const suffix = raw.slice(3);
          if (typeof faSuffixToLogical === 'function') return faSuffixToLogical(suffix) || suffix;
          return suffix;
        }
        if (FA_LEGACY_TO_LOGICAL && FA_LEGACY_TO_LOGICAL[raw]) return FA_LEGACY_TO_LOGICAL[raw];
        return raw;
      },
      parkName() {
        const { resolveIconParkName } = mapApi();
        if (typeof resolveIconParkName === 'function') {
          return resolveIconParkName(this.logicalName);
        }
        const { LOGICAL_TO_ICONPARK } = mapApi();
        return (LOGICAL_TO_ICONPARK && LOGICAL_TO_ICONPARK[this.logicalName]) || null;
      },
      iconData() {
        const pn = this.parkName;
        if (!pn) return null;
        return registry()[pn] || null;
      },
      svgAria() {
        const a = {};
        if (this.$attrs['aria-hidden'] != null) a['aria-hidden'] = this.$attrs['aria-hidden'];
        else a['aria-hidden'] = 'true';
        if (this.$attrs.title) a.title = this.$attrs.title;
        if (this.$attrs.role) a.role = this.$attrs.role;
        return a;
      },
      sizePx() {
        if (this.size != null && this.size !== '') {
          const n = Number(this.size);
          return Number.isNaN(n) ? 16 : Math.max(ICON_MIN_PX, n);
        }
        return null;
      },
      svgClass() {
        const base = ['ds-icon'];
        if (this.spin) base.push('is-spin');
        return base;
      },
      svgStyle() {
        const st = {};
        if (this.sizePx != null) {
          st.width = `${this.sizePx}px`;
          st.height = `${this.sizePx}px`;
        }
        return st;
      },
    },
    mounted() {
      if (!this.iconData && this.logicalName) {
        console.warn('[DsIcon] unknown icon:', this.name, '→', this.logicalName, this.parkName);
      }
    },
    template: `
      <svg
        v-if="iconData"
        xmlns="http://www.w3.org/2000/svg"
        :class="[svgClass, $attrs.class]"
        :style="[svgStyle, $attrs.style]"
        :viewBox="iconData.viewBox"
        fill="none"
        focusable="false"
        v-bind="svgAria"
      ><g v-html="iconData.body" /></svg>
      <span
        v-else
        class="ds-icon ds-icon--missing"
        :class="$attrs.class"
        :style="[svgStyle, $attrs.style]"
        v-bind="svgAria"
      />
    `,
  });
})();
