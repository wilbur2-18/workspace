(function registerUiTags() {
  const app = window.__DEMO_APP;
  if (!app) return;
  if (app.component("TagLg")) return;

  app.component("TagLg", {
    inheritAttrs: false,
    template: `
      <a-tag v-bind="boundAttrs" size="small" :class="rootClass">
        <slot />
      </a-tag>
    `,
    computed: {
      boundAttrs() {
        const { class: _c, ...rest } = this.$attrs;
        return rest;
      },
      rootClass() {
        const extra = this.$attrs.class;
        const base = ["ds-tag", "ds-tag--lg"];
        return extra ? [...base, extra] : base;
      },
    },
  });

  app.component("TagSm", {
    inheritAttrs: false,
    props: {
      variant: {
        type: String,
        default: "static",
        validator: (value) => value === "static" || value === "filter",
      },
      active: { type: Boolean, default: false },
      count: { type: [Number, String], default: undefined },
    },
    emits: ["click"],
    template: `
      <a-tag
        v-bind="passthrough"
        size="small"
        :class="rootClass"
        @click="onClick"
      >
        <slot />
        <span v-if="variant === 'filter' && count != null && count !== ''" class="skill-filter-chip-count">({{ count }})</span>
      </a-tag>
    `,
    computed: {
      rootClass() {
        const extra = this.$attrs.class;
        if (this.variant === "filter") {
          const base = ["ds-tag", "ds-tag--sm", "skill-filter-chip", this.active ? "skill-filter-chip--active" : ""].filter(Boolean);
          return extra ? [...base, extra] : base;
        }
        const base = ["ds-tag", "ds-tag--sm", "ds-tag--static"];
        return extra ? [...base, extra] : base;
      },
      passthrough() {
        const { class: _c, ...rest } = this.$attrs;
        return rest;
      },
    },
    methods: {
      onClick(event) {
        this.$emit("click", event);
      },
    },
  });

  app.component("UiTagLg", {
    inheritAttrs: false,
    props: ["tone"],
    template: `
      <TagLg v-bind="$attrs" :class="tone ? 'ds-tag--tone-' + tone : ''">
        <slot />
      </TagLg>
    `,
  });

  app.component("UiTagSm", {
    inheritAttrs: false,
    props: ["variant", "active", "count", "tone"],
    template: `
      <TagSm
        v-bind="$attrs"
        :class="tone ? 'ds-tag--tone-' + tone : ''"
        :variant="variant || 'static'"
        :active="!!active"
        :count="count"
      >
        <slot />
      </TagSm>
    `,
  });
})();
