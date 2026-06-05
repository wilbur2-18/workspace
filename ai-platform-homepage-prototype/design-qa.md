# Design QA

final result: passed

## Scope

- Prototype target: independent temporary homepage prototype for `浙江人工智能综合服务平台`.
- Viewports checked: 1698 x 936 for full-page screenshot matching, and 1512 x 678 for the browser annotation on search placement.
- Local URL: `http://127.0.0.1:4177/`.

## Checks

- Top navigation preserves the original platform identity and active homepage state.
- Upper-left welcome title and intro follow the latest screenshot layout.
- Tabs stay on the left side of the control area; search is displayed on the far right.
- Service list uses a four-column desktop grid.
- All cards use the same width, height, horizontal icon/title layout, type tag, title, description, and arrow cue.
- Card density follows the browser annotations: 24px vertical padding, 16px icon/content gap, 18px title, and 14px description.
- Card copy uses the titles and descriptions visible in the original screenshot.
- Card type is expressed once per card; there is no duplicated `平台 / 平台能力` style metadata.
- Background is a page-level AI/data/audit visual focal point, not a white welcome card or marketing banner.
- Search, category filters, hover states, and reset action are implemented in React.
- The bottom trust line and `查看全部服务` action are present as shown in the latest screenshot.
- Accessibility polish is present: skip link, visible focus states, search focus state, and pressed feedback on interactive elements.
- HTML metadata is localized: `lang="zh-CN"`, page title, description, and theme color are set.
- Desktop grid keeps four columns through the 1280px range; narrower responsive breakpoints switch to two and one columns.

## Notes

- Tabs are `全部 / 平台 / 智能体`; `常用` was removed per browser annotation.
