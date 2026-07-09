/**
 * Runtime theme seed for the static demo.
 * Kept in demo runtime folder and maintained through pm-ui-prototype-kit.
 */
const DS_THEME_COLORS = Object.freeze({
  primary: '#1677ff',
  bgLayout: '#f5f5f5',
  bgContainer: '#ffffff',
  textBase: '#171717',
  textSecondary: '#525252',
  textTertiary: '#737373',
  border: '#d4d4d4',
  borderSecondary: '#e5e5e5',
  success: '#169c34',
  warning: '#b96b00',
  error: '#d83a3a',
  fillSecondary: '#fafafa',
  fillTertiary: '#f5f5f5',
  textDisabled: '#a3a3a3',
});

// 按钮圆角与字阶/字重以 runtime-ui.css 中 --ds-btn-radius-*、--ds-btn-font-size-*、--ds-btn-font-weight-* 及 #app .ant-btn 覆盖为准（大 16/500、中 14/400、小 12/400）。
// Canonical CSS token mapping (runtime-ui.css :root):
// primary -> --ds-c-primary
// bgLayout -> --ds-bg-layout
// bgContainer -> --ds-bg-container
// textBase -> --ds-text-1
// border -> --ds-border
// success -> --ds-c-success
// warning -> --ds-c-warning
// error -> --ds-c-error
// textDisabled -> --ds-text-disabled

const DS_ANTD_THEME_TOKEN = Object.freeze({
  colorPrimary: DS_THEME_COLORS.primary,
  colorInfo: DS_THEME_COLORS.primary,
  colorLink: DS_THEME_COLORS.primary,
  colorSuccess: DS_THEME_COLORS.success,
  colorWarning: DS_THEME_COLORS.warning,
  borderRadius: 4,
  borderRadiusSM: 5,
  borderRadiusLG: 12,
  colorBgLayout: DS_THEME_COLORS.bgLayout,
  colorBgContainer: DS_THEME_COLORS.bgContainer,
  colorTextBase: DS_THEME_COLORS.textBase,
  colorTextSecondary: DS_THEME_COLORS.textSecondary,
  colorTextTertiary: DS_THEME_COLORS.textTertiary,
  colorTextPlaceholder: DS_THEME_COLORS.textTertiary,
  colorTextDescription: DS_THEME_COLORS.textTertiary,
  colorBorder: DS_THEME_COLORS.border,
  colorBorderSecondary: DS_THEME_COLORS.borderSecondary,
  colorError: DS_THEME_COLORS.error,
  colorFillSecondary: DS_THEME_COLORS.fillSecondary,
  colorFillTertiary: DS_THEME_COLORS.fillTertiary,
  colorFillQuaternary: DS_THEME_COLORS.bgLayout,
  colorTextDisabled: DS_THEME_COLORS.textDisabled,
  colorTextQuaternary: DS_THEME_COLORS.textTertiary,
  colorBgMask: 'rgba(23, 23, 23, 0.45)',
  fontSize: 16,
  fontSizeSM: 14,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeHeading1: 26,
  fontSizeHeading2: 22,
  fontSizeHeading3: 20,
  fontSizeHeading4: 16,
  fontSizeHeading5: 14,
  lineHeight: 1.5,
  lineHeightLG: 1.5,
  lineHeightSM: 1.43,
  lineHeightHeading1: 1.23,
  lineHeightHeading2: 1.27,
  lineHeightHeading3: 1.4,
  lineHeightHeading4: 1.5,
  lineHeightHeading5: 1.43,
  fontWeightStrong: 500,
  fontFamily:
    'Inter, -apple-system, system-ui, "Segoe UI", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  controlHeight: 32,
  controlHeightSM: 24,
  controlHeightLG: 40,
});

const DS_ECHARTS_TEXT_STYLE = Object.freeze({
  fontFamily: DS_ANTD_THEME_TOKEN.fontFamily,
  axisLabel: { fontSize: 12, fontWeight: 400, lineHeight: 16, color: DS_THEME_COLORS.textSecondary },
  axisName: { fontSize: 12, fontWeight: 400, lineHeight: 18, color: DS_THEME_COLORS.textSecondary },
  title: { fontSize: 14, fontWeight: 500, lineHeight: 20, color: DS_THEME_COLORS.textBase },
  legend: { fontSize: 12, fontWeight: 400, lineHeight: 16, color: DS_THEME_COLORS.textSecondary },
  tooltip: { fontSize: 12, fontWeight: 400, lineHeight: 16 },
});

const DS_ANTD_THEME_COMPONENTS = Object.freeze({
  /* 字重由 runtime-ui.css #app .ant-btn 分档覆盖；基线用 400 以免压过「中档」 */
  Button: { fontWeight: 400 },
  Input: { controlHeight: 32, colorBorder: DS_THEME_COLORS.border },
  Select: { controlHeight: 32, colorBorder: DS_THEME_COLORS.border },
  Table: {
    colorBgContainer: DS_THEME_COLORS.bgContainer,
    headerBg: DS_THEME_COLORS.bgLayout,
    colorBorderSecondary: DS_THEME_COLORS.border,
    borderColor: DS_THEME_COLORS.border,
    cellPaddingBlock: 8,
    cellPaddingInline: 12,
    rowHoverBg: DS_THEME_COLORS.bgLayout,
  },
  Modal: { borderRadiusLG: 12 },
  Menu: { itemColor: DS_THEME_COLORS.textBase },
  Empty: { colorTextDescription: DS_THEME_COLORS.textTertiary },
  Card: { colorBorderSecondary: DS_THEME_COLORS.border },
  Popover: { colorBgElevated: DS_THEME_COLORS.bgContainer },
  Tree: { colorBgContainer: 'transparent' },
  Spin: { colorPrimary: DS_THEME_COLORS.primary, dotSize: 14, dotSizeSM: 12 },
  Segmented: {
    trackBg: 'rgba(23, 23, 23, 0.05)',
    itemColor: DS_THEME_COLORS.textSecondary,
    itemHoverColor: DS_THEME_COLORS.primary,
    itemHoverBg: 'transparent',
    itemActiveBg: 'transparent',
    itemSelectedBg: DS_THEME_COLORS.bgContainer,
    itemSelectedColor: DS_THEME_COLORS.primary,
    trackPadding: 4,
  },
  Form: { labelFontSize: 14, verticalLabelPadding: '0 0 4px' },
  FormItem: { marginBottom: 16 },
});

if (typeof globalThis !== 'undefined') {
  globalThis.DS_FOUNDATION = Object.freeze({
    DS_THEME_COLORS,
    DS_ANTD_THEME_TOKEN,
    DS_ANTD_THEME_COMPONENTS,
    DS_ECHARTS_TEXT_STYLE,
  });
  globalThis.UI_FOUNDATION = globalThis.DS_FOUNDATION;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DS_THEME_COLORS,
    DS_ANTD_THEME_TOKEN,
    DS_ANTD_THEME_COMPONENTS,
    DS_ECHARTS_TEXT_STYLE,
  };
}
