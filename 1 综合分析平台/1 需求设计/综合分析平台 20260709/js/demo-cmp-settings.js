(function () {
  const app = window.__DEMO_APP;
  const { h, nextTick, onBeforeUnmount, onMounted, ref, resolveComponent, watch } = Vue;

  app.component('UsageTrendChart', {
    props: {
      data: { type: Array, default: () => [] },
      series: { type: Array, default: () => [] },
      variant: { type: String, default: 'spark' }
    },
    setup(props) {
      const chartRef = ref(null);
      let chart = null;
      let resizeObserver = null;
      let resizeHandler = null;

      const getColor = (name, fallback) => {
        const el = chartRef.value;
        if (!el) return fallback;
        return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
      };

      const buildOption = () => {
        const inputSeries = Array.isArray(props.series) && props.series.length
          ? props.series
          : [{ name: '趋势', data: props.data }];
        const chartSeries = inputSeries.map((item, index) => ({
          name: item && item.name ? item.name : `指标${index + 1}`,
          data: Array.isArray(item && item.data) && item.data.length ? item.data.map(value => Number(value) || 0) : [0]
        }));
        const values = chartSeries.flatMap(item => item.data);
        const color = chartRef.value ? getComputedStyle(chartRef.value).color : 'rgb(22, 119, 255)';
        const secondaryColor = getColor('--ds-text-3', 'rgb(115, 115, 115)');
        const gridColor = getColor('--ds-bg-layout', 'rgb(245, 247, 250)');
        const palette = [color, secondaryColor];
        const isDetail = props.variant === 'detail';
        const pointCount = Math.max.apply(null, chartSeries.map(item => item.data.length));
        const max = Math.max.apply(null, values);
        const min = Math.min.apply(null, values);
        const padding = Math.max(1, (max - min) * 0.18);
        return {
          animation: false,
          grid: isDetail
            ? { top: 12, right: 8, bottom: 8, left: 8 }
            : { top: 6, right: 2, bottom: 6, left: 2 },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: Array.from({ length: pointCount }, (_, index) => String(index + 1)),
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false }
          },
          yAxis: {
            type: 'value',
            min: min - padding,
            max: max + padding,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: {
              show: isDetail,
              lineStyle: { color: gridColor, width: 1 }
            }
          },
          series: chartSeries.map((item, index) => {
            const seriesColor = palette[index % palette.length];
            const option = {
              name: item.name,
              type: 'line',
              data: item.data,
              smooth: false,
              symbol: isDetail ? 'circle' : 'none',
              symbolSize: isDetail ? 7 : 0,
              showSymbol: isDetail,
              silent: true,
              lineStyle: {
                color: seriesColor,
                width: isDetail ? 3 : 2
              },
              itemStyle: { color: seriesColor }
            };
            if (index === 0) {
              option.areaStyle = {
                color: seriesColor,
                opacity: isDetail ? 0.08 : 0.1
              };
            }
            return option;
          })
        };
      };

      const renderChart = () => {
        const el = chartRef.value;
        if (!el || !window.echarts) return;
        if (!chart) chart = window.echarts.init(el, null, { renderer: 'canvas' });
        chart.setOption(buildOption(), true);
        chart.resize();
      };

      onMounted(() => {
        nextTick(() => {
          renderChart();
          if (window.ResizeObserver && chartRef.value) {
            resizeObserver = new ResizeObserver(() => {
              if (chart) chart.resize();
            });
            resizeObserver.observe(chartRef.value);
          } else {
            resizeHandler = () => {
              if (chart) chart.resize();
            };
            window.addEventListener('resize', resizeHandler);
          }
        });
      });

      onBeforeUnmount(() => {
        if (resizeObserver) resizeObserver.disconnect();
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        if (chart) chart.dispose();
        chart = null;
      });

      watch(
        () => [props.data, props.series, props.variant],
        () => nextTick(renderChart),
        { deep: true }
      );

      return { chartRef };
    },
    template: `<div ref="chartRef" class="ds-usage-trend-chart" aria-hidden="true"></div>`
  });

    // SettingsView
    app.component('SettingsView', {
      template: `
        <a-layout class="shell-main shell-main--sider-page">
          <AppShellSiderMenu v-model:selected-key="settingsActiveTab" :menu-items="settingsMenuItems" />
          <div class="ant-layout-content main-content-area app-shell-content-workspace">
            <div class="ds-page-card ds-card-section app-shell-content-card">
            <div class="ds-page-shell" :class="{ 'ds-page-shell--statistics': settingsActiveTab === 'statistics' }">
              <template v-if="settingsActiveTab === 'statistics'">
                <div class="ds-settings-statistics-head">
                  <div class="ds-settings-statistics-head__main">
                    <h2 class="ds-section-title title-reset">信息统计</h2>
                  </div>
                  <div class="ds-settings-statistics-head__actions">
                    <a-tree-select
                      v-model:value="usageScopeOrgId"
                      class="ds-settings-statistics-org-select"
                      :tree-data="currentUsageOrgTreeSelectData"
                      placeholder="全部组织"
                      tree-default-expand-all
                      :dropdown-style="{ maxHeight: '280px', overflow: 'auto' }"
                      show-search
                      tree-node-filter-prop="title"
                      allow-clear
                      aria-label="选择统计组织"
                    />
                    <a-range-picker
                      v-model:value="usageTimeRange"
                      class="ds-settings-statistics-range-picker"
                      :allow-clear="false"
                      :placeholder="['开始时间', '结束时间']"
                      :presets="usageRangePresets"
                      :show-time="{ format: 'HH:mm' }"
                      format="YYYY-MM-DD HH:mm"
                      @change="handleUsageTimeRangeChange"
                    />
                    <a-button @click="handleUsageRefresh">
                      <ds-icon name="refresh" class="icon-gap-right" />刷新
                    </a-button>
                  </div>
                </div>
                <div class="ds-settings-body ds-settings-statistics">
                  <section class="ds-settings-statistics-summary-panel">
                    <div class="ds-settings-statistics-summary">
                      <button v-for="item in currentUsageSummaryCards" :key="item.key" type="button" class="ds-settings-stat-card" :class="['is-' + item.tone, { 'is-highlight': item.highlight }]" @click="openUsageMetricModal(item.key)">
                        <div class="ds-settings-stat-card__text">
                          <div class="ds-settings-stat-card__label">{{ item.label }}</div>
                          <div class="ds-settings-stat-card__value">{{ item.value }}</div>
                          <div class="ds-settings-stat-card__trend">
                            <span>较上期</span>
                            <span class="ds-settings-stat-card__delta" :class="'is-' + item.deltaTone">{{ item.delta }}</span>
                          </div>
                        </div>
                        <UsageTrendChart class="ds-settings-stat-card__spark" :data="item.trendData" variant="spark" />
                      </button>
                    </div>
                  </section>
                  <section class="ds-settings-statistics-leaderboard">
                    <div class="ds-settings-statistics-leaderboard__head">
                      <div class="ds-settings-statistics-leaderboard__title-group">
                        <h3 class="ds-settings-statistics-leaderboard__title">重点榜单</h3>
                        <span class="ds-settings-statistics-leaderboard__desc">当前范围 Top 5</span>
                      </div>
                    </div>
                    <div class="ds-settings-statistics-leaderboard__nav">
                      <a-segmented
                        v-model:value="usageLeaderboardScope"
                        :options="usageLeaderboardScopeOptions"
                        class="ds-settings-statistics-leaderboard__tabs"
                      />
                      <div v-if="showUsageLeaderboardLevel" class="ds-settings-statistics-leaderboard__level">
                        <span class="ds-settings-statistics-leaderboard__level-label">层级</span>
                        <a-select
                          v-model:value="usageLeaderboardLevel"
                          :options="currentUsageLeaderboardLevelOptions"
                          class="ds-settings-statistics-leaderboard__level-select"
                          aria-label="选择榜单层级"
                        />
                      </div>
                    </div>
                    <div class="ds-settings-statistics-leaderboard__grid">
                      <article v-for="board in currentUsageLeaderboardBoards" :key="board.key" class="ds-settings-leaderboard-card">
                        <div class="ds-settings-leaderboard-card__head">
                          <div class="ds-settings-leaderboard-card__title-meta">
                            <h4>{{ board.title }}</h4>
                            <span>{{ board.desc }}</span>
                          </div>
                          <a-button size="small" class="ds-settings-leaderboard-card__export" :aria-label="'导出' + board.title + '全量数据'" @click="handleUsageLeaderboardExport(board.key)">
                            <ds-icon name="download" class="ds-btn-icon-before" />导出
                          </a-button>
                        </div>
                        <div class="ds-settings-leaderboard-card__columns" :class="{ 'has-secondary': board.secondaryColumn }">
                          <span></span>
                          <span>对象</span>
                          <span>{{ board.primaryColumn }}</span>
                          <span v-if="board.secondaryColumn">{{ board.secondaryColumn }}</span>
                        </div>
                        <ol v-if="board.rows.length" class="ds-settings-leaderboard-list" :class="{ 'has-secondary': board.secondaryColumn }">
                          <li v-for="(row, index) in board.rows" :key="row.id" class="ds-settings-leaderboard-list__item">
                            <span class="ds-settings-leaderboard-list__rank">{{ index + 1 }}</span>
                            <span class="ds-settings-leaderboard-list__main">
                              <span class="ds-settings-leaderboard-list__name">{{ row.name }}</span>
                              <span v-if="row.meta" class="ds-settings-leaderboard-list__meta">{{ row.meta }}</span>
                            </span>
                            <strong class="ds-settings-leaderboard-list__value">{{ row.primaryValue }}</strong>
                            <span v-if="board.secondaryColumn" class="ds-settings-leaderboard-list__aux">{{ row.secondaryValue }}</span>
                          </li>
                        </ol>
                        <div v-else class="ds-settings-leaderboard-card__empty">暂无符合条件的数据</div>
                      </article>
                    </div>
                  </section>
                  <div class="ds-settings-statistics-grid">
                    <section class="ds-settings-statistics-panel ds-settings-statistics-panel--org">
                      <div class="ds-settings-statistics-panel__head">
                        <div class="ds-settings-statistics-panel__title-group">
                          <h3 class="ds-settings-statistics-panel__title">
                            <span>组织统计</span>
                          </h3>
                          <p class="ds-settings-statistics-panel__desc">
                            <span class="ds-settings-statistics-panel__meta-tag">范围：{{ usageOrgScopeLabel }}</span>
                            <span class="ds-settings-statistics-panel__meta-tag">默认：Token 用量降序</span>
                          </p>
                        </div>
                        <div class="ds-settings-statistics-panel__ops">
                          <a-button class="ds-btn--icon-text ds-settings-statistics-export-btn" @click="handleUsageOrgExport">
                            <ds-icon name="download" class="ds-btn-icon-before" />导出
                          </a-button>
                        </div>
                      </div>
                      <a-table
                        :columns="usageOrgColumns"
                        :data-source="currentUsageOrgTree"
                        :pagination="false"
                        :custom-row="usageOrgRowProps"
                        :row-class-name="usageOrgRowClassName"
                        :expand-icon="renderUsageOrgExpandIcon"
                        size="small"
                        row-key="id"
                        @change="handleUsageOrgTableChange"
                      >
                        <template #bodyCell="{ column, record }">
                          <template v-if="column.key === 'token'">
                            <span class="ds-settings-statistics-num">{{ formatUsageNumber(record.totalTokens) }}</span>
                          </template>
                          <template v-else-if="column.key === 'accounts'">
                            <span>{{ formatUsageNumber(getUsageOrgAccountCount(record)) }}</span>
                          </template>
                          <template v-else-if="column.key === 'periodUsers'">
                            <span>{{ formatUsageNumber(record.activeUsers) }}</span>
                          </template>
                          <template v-else-if="column.key === 'usageRate'">
                            <span :class="getUsageRateToneClass(record)">{{ formatUsageRate(record) }}</span>
                          </template>
                          <template v-else-if="column.key === 'avgDaily'">
                            <span>{{ formatDailyAverage(record) }}</span>
                          </template>
                          <template v-else-if="column.key === 'peakDaily'">
                            <span>{{ formatUsageNumber(getUsagePeakDailyActive(record)) }}</span>
                          </template>
                          <template v-else-if="column.key === 'calls'">
                            <span>{{ formatUsageNumber(record.calls) }}</span>
                          </template>
                        </template>
                      </a-table>
                      <div class="ds-settings-statistics-panel__hint">点击组织行后，仅切换下方用户消耗榜单范围。</div>
                    </section>
                    <section class="ds-settings-statistics-panel ds-settings-statistics-panel--users">
                      <div class="ds-settings-statistics-panel__head">
                        <div class="ds-settings-statistics-panel__title-group">
                          <h3 class="ds-settings-statistics-panel__title">
                            <span>用户统计</span>
                          </h3>
                          <p class="ds-settings-statistics-panel__desc">
                            <span v-if="!usageSelectedOrgId" class="ds-settings-statistics-panel__meta-tag">范围：{{ usageUserScopeLabel }}</span>
                            <span v-else class="ds-settings-statistics-scope-tag">
                              <span>范围：{{ usageUserScopeLabel }}</span>
                              <button type="button" class="ds-settings-statistics-scope-tag__clear" aria-label="清除用户统计范围" @click="clearUsageOrg">×</button>
                            </span>
                            <span class="ds-settings-statistics-panel__meta-tag">默认：Token 用量降序</span>
                          </p>
                        </div>
                        <div class="ds-settings-statistics-panel__ops">
                          <a-button class="ds-btn--icon-text ds-settings-statistics-export-btn" @click="handleUsageUserExport">
                            <ds-icon name="download" class="ds-btn-icon-before" />导出
                          </a-button>
                        </div>
                      </div>
                      <a-table
                        class="ds-settings-user-usage-table"
                        :columns="usageUserColumns"
                        :data-source="pagedUsageUsers"
                        :pagination="false"
                        size="small"
                        row-key="id"
                        @change="handleUsageUserTableChange"
                      >
                        <template #bodyCell="{ column, record }">
                          <template v-if="column.key === 'displayRank'">
                            <span class="ds-settings-user-display-rank">{{ record.displayRank }}</span>
                          </template>
                          <template v-else-if="column.key === 'user'">
                            <div class="ds-settings-user-cell">
                              <span class="ds-settings-user-cell__name">{{ record.name }}</span>
                            </div>
                          </template>
                          <template v-else-if="column.key === 'org'">
                            <span class="ds-settings-statistics-muted">{{ record.orgName || '-' }}</span>
                          </template>
                          <template v-else-if="column.key === 'token'">
                            <span class="ds-settings-statistics-num">{{ formatUsageNumber(record.totalTokens) }}</span>
                          </template>
                          <template v-else-if="column.key === 'calls'">
                            <span>{{ formatUsageNumber(record.calls) }}</span>
                          </template>
                          <template v-else-if="column.key === 'conversations'">
                            <span>{{ formatUsageNumber(getUserUsageDerivedMetric(record, 'conversations')) }}</span>
                          </template>
                          <template v-else-if="column.key === 'tasks'">
                            <span>{{ formatUsageNumber(getUserUsageDerivedMetric(record, 'tasks')) }}</span>
                          </template>
                          <template v-else-if="column.key === 'workspaces'">
                            <span>{{ formatUsageNumber(getUserUsageDerivedMetric(record, 'workspaces')) }}</span>
                          </template>
                          <template v-else-if="column.key === 'skills'">
                            <span>{{ formatUsageNumber(getUserUsageDerivedMetric(record, 'skills')) }}</span>
                          </template>
                        </template>
                      </a-table>
                      <div class="ds-settings-user-usage-pagination">
                        <a-pagination
                          size="small"
                          :current="usageUserCurrentPage"
                          :page-size="usageUserPageSize"
                          :page-size-options="usageUserPageSizeOptions"
                          :total="currentUsageUsers.length"
                          :show-size-changer="true"
                          :show-total="formatUsageUserPaginationTotal"
                          @change="handleUsageUserPageChange"
                          @showSizeChange="handleUsageUserPageSizeChange"
                        />
                      </div>
                    </section>
                  </div>
                </div>
              </template>
              <template v-else>
              <div class="ds-settings-breadcrumb">系统管理 / {{ currentSettingsTabLabel }}</div>
              <div class="ds-settings-toolbar">
                <h2 class="ds-section-title title-reset">{{ currentSettingsTabLabel }}列表</h2>
                <div class="ds-settings-toolbar-actions">
                  <a-button v-if="settingsActiveTab === 'datasource'" type="primary" size="large" class="ds-btn-page-cta" @click="datasourceFormVisible = true">+ 新建</a-button>
                  <a-button v-else type="primary" size="large" class="ds-btn-page-cta">+ 新建</a-button>
                  <a-dropdown>
                    <a-button size="small">更多 <ds-icon name="chevron-down" class="icon-gap-left" /></a-button>
                    <template #overlay>
                      <a-menu>
                        <a-menu-item key="export">导出</a-menu-item>
                        <a-menu-item key="import">导入</a-menu-item>
                      </a-menu>
                    </template>
                  </a-dropdown>
                </div>
              </div>
              <div class="ds-settings-body" v-if="settingsActiveTab === 'datasource'">
                <div class="ds-card-section">
                  <a-table :columns="datasourceColumns" :data-source="datasourceList" :pagination="{ pageSize: 10, showTotal: (t) => '共 ' + t + ' 条' }" size="small" row-key="id">
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'action'">
                        <a-space>
                          <a @click="datasourceFormVisible = true">编辑</a>
                          <a @click="message.success('连接测试通过')">测试连接</a>
                          <a class="ds-link-danger">删除</a>
                        </a-space>
                      </template>
                    </template>
                  </a-table>
                </div>
              </div>
              <div class="ds-settings-body" v-else>
                <div class="ds-card-section">
                  <div class="ds-empty-state">
                    <a-empty :description="currentSettingsPlaceholder" />
                    <p class="ds-page-meta meta-centered">具体功能以生产环境为准，此处为占位展示。</p>
                  </div>
                </div>
              </div>
              </template>
              <a-modal
                :open="!!activeUsageMetricCard"
                :title="activeUsageMetricModalTitle"
                width="720"
                wrapClassName="ds-usage-metric-modal"
                :footer="null"
                :closable="true"
                @cancel="closeUsageMetricModal"
              >
                <section v-if="activeUsageMetricCard" class="ds-usage-metric-detail">
                  <div class="ds-usage-metric-detail__body">
                    <div class="ds-usage-metric-detail__filters">
                      <a-tree-select
                        v-model:value="usageMetricModalOrgId"
                        class="ds-usage-metric-detail__org-select"
                        :tree-data="usageMetricModalOrgTreeSelectData"
                        placeholder="全部组织"
                        tree-default-expand-all
                        :dropdown-style="{ maxHeight: '280px', overflow: 'auto' }"
                        show-search
                        tree-node-filter-prop="title"
                        allow-clear
                        aria-label="选择趋势统计组织"
                      />
                      <a-range-picker
                        v-model:value="usageMetricModalTimeRange"
                        class="ds-usage-metric-detail__range-picker"
                        :allow-clear="false"
                        :placeholder="['开始时间', '结束时间']"
                        :presets="usageMetricModalRangePresets"
                        :show-time="{ format: 'HH:mm' }"
                        format="YYYY-MM-DD HH:mm"
                        @change="handleUsageMetricModalTimeRangeChange"
                      />
                    </div>
                    <div class="ds-usage-metric-detail__meta-row">
                      <label v-if="usageMetricGranularityOptions.length > 2" class="ds-usage-metric-detail__granularity">
                        <span>统计颗粒度</span>
                        <a-select
                          v-model:value="usageMetricModalGranularity"
                          class="ds-usage-metric-detail__granularity-select"
                          :options="usageMetricGranularityOptions"
                          aria-label="选择统计颗粒度"
                        />
                      </label>
                    </div>
                    <section class="ds-usage-metric-detail__chart-card">
                      <div class="ds-usage-metric-detail__chart-head">
                        <h4>{{ activeUsageMetricTrendTitle }}</h4>
                        <div class="ds-usage-metric-detail__legend">
                          <span class="ds-usage-metric-detail__legend-item">
                            <span class="ds-usage-metric-detail__legend-line"></span>
                            <span>{{ activeUsageMetricCard.label }}</span>
                          </span>
                        </div>
                      </div>
                      <UsageTrendChart class="ds-usage-metric-detail__chart" :series="activeUsageMetricTrendSeries" variant="detail" />
                      <div class="ds-usage-metric-detail__axis">
                        <span v-for="label in activeUsageMetricAxisLabels" :key="label">{{ label }}</span>
                      </div>
                    </section>
                    <section class="ds-usage-metric-detail__table">
                      <div class="ds-usage-metric-detail__table-head">
                        <h4>趋势明细</h4>
                        <a-button size="small" class="ds-usage-metric-detail__export" @click="handleUsageMetricDetailExport">
                          <ds-icon name="download" class="ds-btn-icon-before" />导出
                        </a-button>
                      </div>
                      <div class="ds-usage-metric-detail__table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>统计周期</th>
                              <th>{{ activeUsageMetricCard.label }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="row in activeUsageMetricDetailRows" :key="row.period">
                              <td>{{ row.period }}</td>
                              <td>{{ row.value }}</td>
                            </tr>
                            <tr v-if="!activeUsageMetricDetailRows.length">
                              <td colspan="2" class="ds-usage-metric-detail__empty">暂无明细数据</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </div>
                </section>
              </a-modal>
              <a-modal v-model:open="datasourceFormVisible" title="数据源" width="640" wrapClassName="modal-w-640" :footer="null" @cancel="datasourceFormVisible = false">
                <a-form layout="vertical">
                  <a-form-item label="数据源名称"><a-input placeholder="请输入名称" /></a-form-item>
                  <a-form-item label="类型"><a-select placeholder="请选择" style="width:100%" :options="[{ label: '数据库', value: '数据库' }, { label: 'API', value: 'API' }, { label: '知识库', value: '知识库' }, { label: '数据图谱', value: '数据图谱' }]" /></a-form-item>
                  <a-form-item label="连接信息"><a-textarea placeholder="请输入连接串或配置说明" :rows="3" /></a-form-item>
                  <a-form-item>
                    <a-space>
                      <a-button type="primary" @click="datasourceFormVisible = false; message.success('保存成功')">保存</a-button>
                      <a-button @click="datasourceFormVisible = false">取消</a-button>
                    </a-space>
                  </a-form-item>
                </a-form>
              </a-modal>
            </div>
            </div>
          </div>
        </a-layout>
      `,
      data() {
        const now = window.dayjs ? window.dayjs() : null;
        return {
          settingsActiveTab: 'menu',
          settingsMenuItems: [
            { key: 'menu', label: '菜单管理', icon: 'menu' },
            { key: 'dept', label: '部门管理', icon: 'sitemap' },
            { key: 'role', label: '角色管理', icon: 'shield' },
            { key: 'user', label: '用户管理', icon: 'user' },
            { key: 'statistics', label: '信息统计', icon: 'table' },
            { key: 'datasource', label: '数据源管理', icon: 'plug' },
            { key: 'model', label: '模型管理', icon: 'database' },
            { key: 'oauth', label: '三方登录', icon: 'link' },
            { key: 'cert', label: '证书管理', icon: 'certificate' }
          ],
          usageRange: 'week',
          usageRangeLabel: '最近一周',
          usageRangeIsCustom: false,
          usageTimeRange: now ? [now.subtract(1, 'week'), now] : [],
          usageScopeOrgId: null,
          usageSelectedOrgId: null,
          usageMetricModalKey: null,
          usageMetricModalOrgId: null,
          usageMetricModalRange: 'week',
          usageMetricModalRangeLabel: '最近一周',
          usageMetricModalRangeIsCustom: false,
          usageMetricModalTimeRange: now ? [now.subtract(1, 'week'), now] : [],
          usageMetricModalGranularity: 'auto',
          usageOrgSort: { key: 'token', order: 'descend' },
          usageUserSort: { key: 'token', order: 'descend' },
          usageUserCurrentPage: 1,
          usageUserPageSize: 8,
          usageUserPageSizeOptions: ['5', '8', '10'],
          usageLeaderboardScope: 'department',
          usageLeaderboardLevel: 'city',
          usageLeaderboardScopeOptions: [
            { label: '地区榜单', value: 'region' },
            { label: '部门榜单', value: 'department' },
            { label: '用户榜单', value: 'user' }
          ],
          usageRangeOptions: [
            { label: '最近1小时', value: 'hour' },
            { label: '最近1天', value: 'day' },
            { label: '最近一周', value: 'week' },
            { label: '最近1月', value: 'month' },
            { label: '最近半年', value: 'halfYear' },
            { label: '最近1年', value: 'year' }
          ],
          usageStatsByRange: {
            hour: { totalTokens: 18600, activeUserCount: 18, callCount: 42, coverageAreaCount: 5, coverageAreaTotal: 12, coverageDeptCount: 18, coverageDeptTotal: 48, accountCount: 162, maxDailyActive: 18, avgDailyActive: 18 },
            day: { totalTokens: 86400, activeUserCount: 41, callCount: 214, coverageAreaCount: 7, coverageAreaTotal: 12, coverageDeptCount: 27, coverageDeptTotal: 48, accountCount: 162, maxDailyActive: 41, avgDailyActive: 32 },
            week: { totalTokens: 286400, activeUserCount: 64, callCount: 684, coverageAreaCount: 8, coverageAreaTotal: 12, coverageDeptCount: 31, coverageDeptTotal: 48, accountCount: 162, maxDailyActive: 38, avgDailyActive: 24.6 },
            month: { totalTokens: 1265800, activeUserCount: 86, callCount: 3421, coverageAreaCount: 12, coverageAreaTotal: 16, coverageDeptCount: 43, coverageDeptTotal: 58, accountCount: 196, maxDailyActive: 54, avgDailyActive: 31.8 },
            halfYear: { totalTokens: 6843200, activeUserCount: 146, callCount: 18620, coverageAreaCount: 19, coverageAreaTotal: 24, coverageDeptCount: 68, coverageDeptTotal: 86, accountCount: 238, maxDailyActive: 91, avgDailyActive: 52.4 },
            year: { totalTokens: 12865400, activeUserCount: 192, callCount: 38640, coverageAreaCount: 24, coverageAreaTotal: 24, coverageDeptCount: 82, coverageDeptTotal: 86, accountCount: 268, maxDailyActive: 118, avgDailyActive: 68.6 }
          },
          usageLeaderboardData: [
            { id: 'region-province-1', scope: 'region', level: 'province', name: 'A省', orgIds: ['org-eco', 'org-eco-self', 'org-eco-1', 'org-eco-2', 'org-fin'], tokens: 166600, calls: 382, conversations: 164, tasks: 72, skills: 10 },
            { id: 'region-province-2', scope: 'region', level: 'province', name: 'B省', orgIds: ['org-inv', 'org-inv-self', 'org-inv-1', 'org-inv-2', 'org-data'], tokens: 119800, calls: 302, conversations: 129, tasks: 58, skills: 8 },
            { id: 'region-province-3', scope: 'region', level: 'province', name: 'C省', orgIds: ['org-eco-1', 'org-inv-1', 'org-data'], tokens: 106400, calls: 284, conversations: 118, tasks: 55, skills: 7 },
            { id: 'region-province-4', scope: 'region', level: 'province', name: 'D省', orgIds: ['org-eco-2', 'org-inv-2', 'org-fin'], tokens: 87400, calls: 238, conversations: 104, tasks: 47, skills: 6 },
            { id: 'region-province-5', scope: 'region', level: 'province', name: 'E省', orgIds: ['org-data', 'org-fin'], tokens: 68200, calls: 176, conversations: 76, tasks: 33, skills: 5 },
            { id: 'region-city-1', scope: 'region', level: 'city', name: 'A市', orgIds: ['org-eco', 'org-eco-self', 'org-eco-1', 'org-eco-2'], tokens: 98500, calls: 218, conversations: 94, tasks: 41, skills: 6 },
            { id: 'region-city-2', scope: 'region', level: 'city', name: 'B市', orgIds: ['org-inv', 'org-inv-self', 'org-inv-1', 'org-inv-2'], tokens: 76400, calls: 181, conversations: 78, tasks: 35, skills: 5 },
            { id: 'region-city-3', scope: 'region', level: 'city', name: 'C市', orgIds: ['org-fin'], tokens: 68100, calls: 164, conversations: 70, tasks: 30, skills: 4 },
            { id: 'region-city-4', scope: 'region', level: 'city', name: 'D市', orgIds: ['org-data'], tokens: 43400, calls: 121, conversations: 52, tasks: 23, skills: 3 },
            { id: 'region-city-5', scope: 'region', level: 'city', name: 'E市', orgIds: ['org-eco-1', 'org-inv-1'], tokens: 38600, calls: 108, conversations: 46, tasks: 21, skills: 3 },
            { id: 'region-county-1', scope: 'region', level: 'county', name: '东城区', orgIds: ['org-eco-1'], tokens: 51200, calls: 116, conversations: 50, tasks: 22, skills: 4 },
            { id: 'region-county-2', scope: 'region', level: 'county', name: '西城区', orgIds: ['org-eco-2'], tokens: 37300, calls: 82, conversations: 35, tasks: 16, skills: 3 },
            { id: 'region-county-3', scope: 'region', level: 'county', name: '高新区', orgIds: ['org-inv-1'], tokens: 35200, calls: 86, conversations: 37, tasks: 17, skills: 3 },
            { id: 'region-county-4', scope: 'region', level: 'county', name: '临港区', orgIds: ['org-inv-2'], tokens: 33200, calls: 75, conversations: 32, tasks: 14, skills: 2 },
            { id: 'region-county-5', scope: 'region', level: 'county', name: '金湾区', orgIds: ['org-fin'], tokens: 29400, calls: 64, conversations: 28, tasks: 12, skills: 2 },
            { id: 'department-province-1', scope: 'department', level: 'province', name: '省审计厅', orgIds: ['org-eco', 'org-eco-self', 'org-eco-1', 'org-eco-2', 'org-inv', 'org-inv-self', 'org-inv-1', 'org-inv-2', 'org-fin', 'org-data'], tokens: 286400, calls: 684, conversations: 294, tasks: 129, skills: 18 },
            { id: 'department-province-2', scope: 'department', level: 'province', name: '省经济责任审计中心', orgIds: ['org-eco', 'org-eco-self', 'org-eco-1', 'org-eco-2'], tokens: 98500, calls: 218, conversations: 94, tasks: 41, skills: 6 },
            { id: 'department-province-3', scope: 'department', level: 'province', name: '省投资审计中心', orgIds: ['org-inv', 'org-inv-self', 'org-inv-1', 'org-inv-2'], tokens: 76400, calls: 181, conversations: 78, tasks: 35, skills: 5 },
            { id: 'department-province-4', scope: 'department', level: 'province', name: '省财政金融审计中心', orgIds: ['org-fin'], tokens: 68100, calls: 164, conversations: 70, tasks: 30, skills: 4 },
            { id: 'department-province-5', scope: 'department', level: 'province', name: '省数据分析中心', orgIds: ['org-data'], tokens: 43400, calls: 121, conversations: 52, tasks: 23, skills: 3 },
            { id: 'department-city-1', scope: 'department', level: 'city', name: 'A市审计局', orgIds: ['org-eco', 'org-eco-self', 'org-eco-1', 'org-eco-2'], tokens: 98500, calls: 218, conversations: 94, tasks: 41, skills: 6 },
            { id: 'department-city-2', scope: 'department', level: 'city', name: 'B市审计局', orgIds: ['org-inv', 'org-inv-self', 'org-inv-1', 'org-inv-2'], tokens: 76400, calls: 181, conversations: 78, tasks: 35, skills: 5 },
            { id: 'department-city-3', scope: 'department', level: 'city', name: 'C市审计局', orgIds: ['org-fin'], tokens: 68100, calls: 164, conversations: 70, tasks: 30, skills: 4 },
            { id: 'department-city-4', scope: 'department', level: 'city', name: 'D市审计局', orgIds: ['org-data'], tokens: 43400, calls: 121, conversations: 52, tasks: 23, skills: 3 },
            { id: 'department-city-5', scope: 'department', level: 'city', name: 'E市审计局', orgIds: ['org-eco-1', 'org-inv-1'], tokens: 38600, calls: 108, conversations: 46, tasks: 21, skills: 3 },
            { id: 'department-county-1', scope: 'department', level: 'county', name: '东城区审计局', orgIds: ['org-eco-1'], tokens: 51200, calls: 116, conversations: 50, tasks: 22, skills: 4 },
            { id: 'department-county-2', scope: 'department', level: 'county', name: '西城区审计局', orgIds: ['org-eco-2'], tokens: 37300, calls: 82, conversations: 35, tasks: 16, skills: 3 },
            { id: 'department-county-3', scope: 'department', level: 'county', name: '高新区审计局', orgIds: ['org-inv-1'], tokens: 35200, calls: 86, conversations: 37, tasks: 17, skills: 3 },
            { id: 'department-county-4', scope: 'department', level: 'county', name: '临港区审计局', orgIds: ['org-inv-2'], tokens: 33200, calls: 75, conversations: 32, tasks: 14, skills: 2 },
            { id: 'department-county-5', scope: 'department', level: 'county', name: '金湾区审计局', orgIds: ['org-fin'], tokens: 29400, calls: 64, conversations: 28, tasks: 12, skills: 2 }
          ],
          usageOrgTreeByRange: {
            week: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 98500, activeUsers: 9, calls: 218, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-self', name: '本级', totalTokens: 10000, activeUsers: 1, calls: 20, lastUsedAt: '2026-05-29 09:42', isSelfNode: true, scopeOrgIds: ['org-eco'] },
                { id: 'org-eco-1', name: '一科', totalTokens: 51200, activeUsers: 5, calls: 116, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 37300, activeUsers: 3, calls: 82, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 76400, activeUsers: 8, calls: 181, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-self', name: '本级', totalTokens: 8000, activeUsers: 1, calls: 20, lastUsedAt: '2026-05-28 18:08', isSelfNode: true, scopeOrgIds: ['org-inv'] },
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 35200, activeUsers: 4, calls: 86, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 33200, activeUsers: 3, calls: 75, lastUsedAt: '2026-05-27 15:24' }
              ] },
              { id: 'org-fin', name: '财政金融审计处', totalTokens: 68100, activeUsers: 7, calls: 164, lastUsedAt: '2026-05-28 11:35' },
              { id: 'org-data', name: '数据分析中心', totalTokens: 43400, activeUsers: 4, calls: 121, lastUsedAt: '2026-05-29 08:55' }
            ],
            month: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 482000, activeUsers: 24, calls: 1026, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-self', name: '本级', totalTokens: 48000, activeUsers: 2, calls: 100, lastUsedAt: '2026-05-29 09:42', isSelfNode: true, scopeOrgIds: ['org-eco'] },
                { id: 'org-eco-1', name: '一科', totalTokens: 253600, activeUsers: 12, calls: 546, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 180400, activeUsers: 10, calls: 380, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 354800, activeUsers: 19, calls: 842, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-self', name: '本级', totalTokens: 35000, activeUsers: 2, calls: 80, lastUsedAt: '2026-05-28 18:08', isSelfNode: true, scopeOrgIds: ['org-inv'] },
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 174600, activeUsers: 9, calls: 422, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 145200, activeUsers: 8, calls: 340, lastUsedAt: '2026-05-27 15:24' }
              ] },
              { id: 'org-fin', name: '财政金融审计处', totalTokens: 248700, activeUsers: 17, calls: 701, lastUsedAt: '2026-05-28 11:35' },
              { id: 'org-data', name: '数据分析中心', totalTokens: 180300, activeUsers: 26, calls: 852, lastUsedAt: '2026-05-29 08:55' }
            ],
            halfYear: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 2448600, activeUsers: 42, calls: 6226, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-self', name: '本级', totalTokens: 240000, activeUsers: 4, calls: 600, lastUsedAt: '2026-05-29 09:42', isSelfNode: true, scopeOrgIds: ['org-eco'] },
                { id: 'org-eco-1', name: '一科', totalTokens: 1206400, activeUsers: 20, calls: 3118, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 1002200, activeUsers: 18, calls: 2508, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 1895400, activeUsers: 38, calls: 5024, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-self', name: '本级', totalTokens: 180000, activeUsers: 4, calls: 500, lastUsedAt: '2026-05-28 18:08', isSelfNode: true, scopeOrgIds: ['org-inv'] },
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 886200, activeUsers: 17, calls: 2296, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 829200, activeUsers: 17, calls: 2228, lastUsedAt: '2026-05-27 15:24' }
              ] },
              { id: 'org-fin', name: '财政金融审计处', totalTokens: 1387800, activeUsers: 31, calls: 3906, lastUsedAt: '2026-05-28 11:35' },
              { id: 'org-data', name: '数据分析中心', totalTokens: 1111400, activeUsers: 35, calls: 3464, lastUsedAt: '2026-05-29 08:55' }
            ]
          },
          usageUsersByRange: {
            week: [
              { id: 'u-1', name: '李审计', account: 'li.audit', orgId: 'org-eco-1', orgName: '一科', totalTokens: 43200, calls: 96, lastUsedAt: '2026-05-29 09:42' },
              { id: 'u-3', name: '赵管理员', account: 'zhao.admin', orgId: 'org-inv-1', orgName: '项目审计一组', totalTokens: 39200, calls: 88, lastUsedAt: '2026-05-28 18:08' },
              { id: 'u-8', name: '韩分析', account: 'han.data', orgId: 'org-data', orgName: '数据分析中心', totalTokens: 35600, calls: 112, lastUsedAt: '2026-05-29 08:55' },
              { id: 'u-2', name: '王审计', account: 'wang.audit', orgId: 'org-eco-2', orgName: '二科', totalTokens: 32600, calls: 76, lastUsedAt: '2026-05-28 17:16' },
              { id: 'u-5', name: '周复核', account: 'zhou.review', orgId: 'org-fin', orgName: '财政金融审计处', totalTokens: 29400, calls: 64, lastUsedAt: '2026-05-28 11:35' },
              { id: 'u-4', name: '刘投资', account: 'liu.invest', orgId: 'org-inv-2', orgName: '项目审计二组', totalTokens: 28100, calls: 62, lastUsedAt: '2026-05-27 15:24' }
            ],
            month: [
              { id: 'u-1', name: '李审计', account: 'li.audit', orgId: 'org-eco-1', orgName: '一科', totalTokens: 96300, calls: 218, lastUsedAt: '2026-05-29 09:42' },
              { id: 'u-8', name: '韩分析', account: 'han.data', orgId: 'org-data', orgName: '数据分析中心', totalTokens: 88400, calls: 284, lastUsedAt: '2026-05-29 08:55' },
              { id: 'u-3', name: '赵管理员', account: 'zhao.admin', orgId: 'org-inv-1', orgName: '项目审计一组', totalTokens: 82700, calls: 196, lastUsedAt: '2026-05-28 18:08' },
              { id: 'u-2', name: '王审计', account: 'wang.audit', orgId: 'org-eco-2', orgName: '二科', totalTokens: 76400, calls: 174, lastUsedAt: '2026-05-28 17:16' },
              { id: 'u-5', name: '周复核', account: 'zhou.review', orgId: 'org-fin', orgName: '财政金融审计处', totalTokens: 69800, calls: 156, lastUsedAt: '2026-05-28 11:35' },
              { id: 'u-4', name: '刘投资', account: 'liu.invest', orgId: 'org-inv-2', orgName: '项目审计二组', totalTokens: 64200, calls: 151, lastUsedAt: '2026-05-27 15:24' },
              { id: 'u-6', name: '陈财审', account: 'chen.finance', orgId: 'org-fin', orgName: '财政金融审计处', totalTokens: 58100, calls: 143, lastUsedAt: '2026-05-27 10:18' },
              { id: 'u-7', name: '孙核查', account: 'sun.check', orgId: 'org-eco-1', orgName: '一科', totalTokens: 52600, calls: 128, lastUsedAt: '2026-05-26 16:42' },
              { id: 'u-9', name: '吴建审', account: 'wu.project', orgId: 'org-inv-2', orgName: '项目审计二组', totalTokens: 48700, calls: 119, lastUsedAt: '2026-05-26 14:05' }
            ],
            halfYear: [
              { id: 'u-1', name: '李审计', account: 'li.audit', orgId: 'org-eco-1', orgName: '一科', totalTokens: 518600, calls: 1286, lastUsedAt: '2026-05-29 09:42' },
              { id: 'u-8', name: '韩分析', account: 'han.data', orgId: 'org-data', orgName: '数据分析中心', totalTokens: 493200, calls: 1420, lastUsedAt: '2026-05-29 08:55' },
              { id: 'u-3', name: '赵管理员', account: 'zhao.admin', orgId: 'org-inv-1', orgName: '项目审计一组', totalTokens: 462800, calls: 1218, lastUsedAt: '2026-05-28 18:08' },
              { id: 'u-2', name: '王审计', account: 'wang.audit', orgId: 'org-eco-2', orgName: '二科', totalTokens: 421500, calls: 1092, lastUsedAt: '2026-05-28 17:16' },
              { id: 'u-5', name: '周复核', account: 'zhou.review', orgId: 'org-fin', orgName: '财政金融审计处', totalTokens: 388900, calls: 1004, lastUsedAt: '2026-05-28 11:35' },
              { id: 'u-4', name: '刘投资', account: 'liu.invest', orgId: 'org-inv-2', orgName: '项目审计二组', totalTokens: 356200, calls: 982, lastUsedAt: '2026-05-27 15:24' },
              { id: 'u-6', name: '陈财审', account: 'chen.finance', orgId: 'org-fin', orgName: '财政金融审计处', totalTokens: 326800, calls: 896, lastUsedAt: '2026-05-27 10:18' },
              { id: 'u-7', name: '孙核查', account: 'sun.check', orgId: 'org-eco-1', orgName: '一科', totalTokens: 302600, calls: 842, lastUsedAt: '2026-05-26 16:42' },
              { id: 'u-9', name: '吴建审', account: 'wu.project', orgId: 'org-inv-2', orgName: '项目审计二组', totalTokens: 281700, calls: 786, lastUsedAt: '2026-05-26 14:05' }
            ]
          },
          datasourceList: [
            { id: 'ds1', name: '主业务库', type: '数据库', connectionStatus: '正常', lastChecked: '2024-03-11 10:00', createdAt: '2024-02-01' },
            { id: 'ds2', name: '政策知识库 API', type: 'API', connectionStatus: '正常', lastChecked: '2024-03-10 18:30', createdAt: '2024-02-05' },
            { id: 'ds3', name: '审计规范知识库', type: '知识库', connectionStatus: '正常', lastChecked: '2024-03-11 09:00', createdAt: '2024-02-08' }
          ],
          datasourceFormVisible: false
        };
      },
      computed: {
        currentSettingsTabLabel() {
          const item = this.settingsMenuItems.find(m => m.key === this.settingsActiveTab);
          return item ? item.label : '';
        },
        currentSettingsPlaceholder() {
          const map = {
            menu: '菜单管理：配置系统导航菜单、图标、排序与权限标识。',
            dept: '部门管理：维护组织架构与部门层级。',
            role: '角色管理：定义角色及其权限范围。',
            user: '用户管理：管理系统用户账号与归属。',
            statistics: '信息统计：统计组织和用户的大模型调用用量。',
            datasource: '数据源管理：配置数据库、API、知识库、数据图谱等数据源连接。',
            model: '模型管理：配置大模型调用与资源策略。',
            oauth: '三方登录：配置 OAuth、SSO 等第三方登录方式。',
            cert: '证书管理：管理 SSL 证书与 API 密钥。'
          };
          return map[this.settingsActiveTab] || '占位内容';
        },
        currentUsageRangeSource() {
          return this.getUsageRangeSource(this.usageRange);
        },
        currentUsageSummary() {
          return this.usageStatsByRange[this.usageRange] || this.usageStatsByRange.month;
        },
        currentUsageSummaryCards() {
          return this.buildUsageSummaryCards(this.currentUsageSummary);
        },
        activeUsageMetricSummary() {
          const base = this.usageStatsByRange[this.usageMetricModalRange] || this.usageStatsByRange.week;
          const org = this.usageMetricModalOrg;
          if (!org) return base;
          const totalTokens = Number(org.totalTokens) || 0;
          const totalBaseTokens = this.getUsageOrgTreeTotalForRange(this.usageMetricModalRange);
          const ratio = totalBaseTokens ? Math.min(1, totalTokens / totalBaseTokens) : 1;
          const coverageAreaCount = Math.min(base.coverageAreaCount, Math.max(1, Math.round(base.coverageAreaCount * ratio)));
          const coverageDeptCount = Math.min(base.coverageDeptCount, Math.max(1, Math.round(base.coverageDeptCount * ratio)));
          return {
            ...base,
            totalTokens,
            callCount: Number(org.calls) || 0,
            activeUserCount: Number(org.activeUsers) || 0,
            coverageAreaCount,
            coverageDeptCount,
            accountCount: this.getUsageOrgAccountCount(org),
            maxDailyActive: this.getUsagePeakDailyActive(org),
            avgDailyActive: this.getUsageDailyAverageValue(org, this.usageMetricModalRange)
          };
        },
        activeUsageMetricCards() {
          return this.buildUsageSummaryCards(this.activeUsageMetricSummary);
        },
        activeUsageMetricCard() {
          if (!this.usageMetricModalKey) return null;
          return this.activeUsageMetricCards.find(item => item.key === this.usageMetricModalKey) || null;
        },
        activeUsageMetricModalTitle() {
          return this.activeUsageMetricCard ? `${this.activeUsageMetricCard.label}趋势分析` : '';
        },
        currentUsageRangeLabel() {
          if (this.usageRangeLabel) return this.usageRangeLabel;
          const item = this.usageRangeOptions.find(option => option.value === this.usageRange);
          return item ? item.label : '';
        },
        usageRangePresets() {
          return this.usageRangeOptions.map(item => ({
            label: item.label,
            value: this.getUsageQuickRange(item.value)
          }));
        },
        usageMetricModalRangePresets() {
          return this.usageRangePresets;
        },
        usageMetricModalOrgTreeSelectData() {
          return this.mapUsageOrgTreeSelectData(this.getUsageOrgTreeForRange(this.usageMetricModalRange));
        },
        usageMetricModalOrg() {
          if (!this.usageMetricModalOrgId) return null;
          return this.findUsageOrgById(this.usageMetricModalOrgId, this.getUsageOrgTreeForRange(this.usageMetricModalRange));
        },
        activeUsageMetricScopeLabel() {
          return this.usageMetricModalOrg ? this.usageMetricModalOrg.name : '全部组织';
        },
        activeUsageMetricRangeLabel() {
          if (this.usageMetricModalRangeLabel) return this.usageMetricModalRangeLabel;
          const item = this.usageRangeOptions.find(option => option.value === this.usageMetricModalRange);
          return item ? item.label : '';
        },
        usageMetricGranularityLabelMap() {
          return {
            tenMinute: '按10分钟',
            hour: '按小时',
            day: '按日',
            week: '按周',
            month: '按月'
          };
        },
        defaultUsageMetricGranularity() {
          const map = { hour: 'tenMinute', day: 'hour', week: 'day', month: 'day', halfYear: 'month', year: 'month' };
          return map[this.usageMetricModalRange] || 'day';
        },
        usageMetricGranularityOptions() {
          const rangeMap = {
            hour: ['tenMinute'],
            day: ['hour'],
            week: ['day'],
            month: ['day'],
            halfYear: ['month'],
            year: ['month']
          };
          const values = rangeMap[this.usageMetricModalRange] || ['day'];
          const autoLabel = this.usageMetricGranularityLabelMap[this.defaultUsageMetricGranularity] || '按日';
          return [
            { label: `自动（${autoLabel}）`, value: 'auto' },
            ...values.map(value => ({ label: this.usageMetricGranularityLabelMap[value], value }))
          ];
        },
        activeUsageMetricGranularityValue() {
          const value = this.usageMetricModalGranularity;
          const validValues = this.usageMetricGranularityOptions.map(item => item.value);
          if (value && value !== 'auto' && validValues.includes(value)) return value;
          return this.defaultUsageMetricGranularity;
        },
        activeUsageMetricGranularityLabel() {
          return this.usageMetricGranularityLabelMap[this.activeUsageMetricGranularityValue] || '按日';
        },
        showUsageLeaderboardLevel() {
          return this.usageLeaderboardScope !== 'user';
        },
        currentUsageLeaderboardLevelOptions() {
          const labels = this.usageLeaderboardScope === 'region'
            ? { province: '省级', city: '地市级', county: '区县级' }
            : { province: '省厅级', city: '地市局级', county: '区县局级' };
          return [
            { label: labels.province, value: 'province' },
            { label: labels.city, value: 'city' },
            { label: labels.county, value: 'county' }
          ];
        },
        currentUsageLeaderboardLevelLabel() {
          const item = this.currentUsageLeaderboardLevelOptions.find(option => option.value === this.usageLeaderboardLevel);
          return item ? item.label : '';
        },
        currentUsageLeaderboardTokenFactor() {
          const base = Number(this.usageStatsByRange.week && this.usageStatsByRange.week.totalTokens) || 1;
          return (Number(this.currentUsageSummary.totalTokens) || base) / base;
        },
        currentUsageLeaderboardCallFactor() {
          const base = Number(this.usageStatsByRange.week && this.usageStatsByRange.week.callCount) || 1;
          return (Number(this.currentUsageSummary.callCount) || base) / base;
        },
        usageUsersForCurrentRange() {
          const source = this.currentUsageRangeSource;
          const users = this.usageUsersByRange[this.usageRange] || this.scaleUsageUsers(this.usageUsersByRange[source.key] || [], source.factor);
          return users
            .slice()
            .sort((a, b) => {
              if (b.totalTokens !== a.totalTokens) return b.totalTokens - a.totalTokens;
              if (b.calls !== a.calls) return b.calls - a.calls;
              return String(b.lastUsedAt || '').localeCompare(String(a.lastUsedAt || ''));
            })
            .map((item, index) => ({ ...item, rank: index + 1 }));
        },
        usageScopeOrgIds() {
          if (!this.usageScopeOrg) return null;
          const ids = [];
          const collect = (item) => {
            if (!item) return;
            ids.push(...(item.scopeOrgIds || [item.id]));
            (item.children || []).forEach(collect);
          };
          collect(this.usageScopeOrg);
          return ids;
        },
        usageLeaderboardUserEntries() {
          const users = this.usageScopeOrgIds
            ? this.usageUsersForCurrentRange.filter(user => this.usageScopeOrgIds.includes(user.orgId))
            : this.usageUsersForCurrentRange;
          return users.map(user => ({
            id: `leader-user-${user.id}`,
            scope: 'user',
            level: null,
            name: user.name,
            orgName: user.orgName,
            orgIds: [user.orgId],
            tokens: user.totalTokens,
            calls: user.calls,
            conversations: this.getUserUsageDerivedMetric(user, 'conversations'),
            tasks: this.getUserUsageDerivedMetric(user, 'tasks'),
            skills: this.getUserUsageDerivedMetric(user, 'skills')
          }));
        },
        currentUsageLeaderboardEntries() {
          if (this.usageLeaderboardScope === 'user') return this.usageLeaderboardUserEntries;
          return this.usageLeaderboardData
            .filter(item => item.scope === this.usageLeaderboardScope && item.level === this.usageLeaderboardLevel)
            .filter(item => !this.usageScopeOrgIds || (item.orgIds || []).some(id => this.usageScopeOrgIds.includes(id)))
            .map(item => this.getScaledUsageLeaderboardEntry(item));
        },
        currentUsageLeaderboardBoards() {
          return ['resources', 'activity', 'skills'].map(key => ({
            key,
            ...this.getUsageLeaderboardBoardMeta(key),
            rows: this.getUsageLeaderboardRows(key)
          }));
        },
        activeUsageMetricTrendTitle() {
          const suffix = `${this.activeUsageMetricGranularityLabel}，起点=100`;
          if (this.usageMetricModalRangeIsCustom) return `所选时间趋势（${suffix}）`;
          const map = {
            hour: '最近 1 小时趋势',
            day: '最近 24 小时趋势',
            week: '最近 7 日趋势',
            month: '最近 1 月趋势',
            halfYear: '最近 6 月趋势',
            year: '最近 12 月趋势'
          };
          return `${map[this.usageMetricModalRange] || '最近 7 日趋势'}（${suffix}）`;
        },
        activeUsageMetricAxisLabels() {
          const granularity = this.activeUsageMetricGranularityValue;
          if (granularity === 'tenMinute') return ['0分', '10分', '20分', '30分', '40分', '50分'];
          if (granularity === 'hour') return Array.from({ length: 24 }, (_, index) => `${index}时`);
          if (granularity === 'day') {
            if (this.usageMetricModalRange === 'month') return Array.from({ length: 30 }, (_, index) => `${index + 1}日`);
            return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
          }
          if (granularity === 'week') {
            const count = this.usageMetricModalRange === 'halfYear' ? 26 : 4;
            return Array.from({ length: count }, (_, index) => `第${index + 1}周`);
          }
          if (granularity === 'month') {
            const count = this.usageMetricModalRange === 'year' ? 12 : 6;
            return Array.from({ length: count }, (_, index) => `${index + 1}月`);
          }
          return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        },
        activeUsageMetricTrendData() {
          const card = this.activeUsageMetricCard;
          return this.getUsageMetricTrendDataForCard(card);
        },
        activeUsageMetricTrendSeries() {
          const card = this.activeUsageMetricCard;
          if (!card) return [];
          return [{ name: card.label, data: this.normalizeUsageTrendData(this.getUsageMetricTrendDataForCard(card)) }];
        },
        activeUsageMetricDetailRows() {
          const card = this.activeUsageMetricCard;
          if (!card) return [];
          const values = this.getUsageMetricDetailValues(card.key, this.activeUsageMetricTrendData);
          return this.activeUsageMetricAxisLabels.map((period, index) => ({
            period: this.formatUsageMetricDetailPeriod(period, index),
            value: this.formatUsageMetricDetailValue(card.key, values[index]),
            granularity: this.activeUsageMetricGranularityLabel
          }));
        },
        baseUsageOrgTree() {
          return this.getUsageOrgTreeForRange(this.usageRange);
        },
        currentUsageOrgTree() {
          const rows = !this.usageScopeOrg
            ? this.baseUsageOrgTree
            : (Array.isArray(this.usageScopeOrg.children) && this.usageScopeOrg.children.length ? this.usageScopeOrg.children : [this.usageScopeOrg]);
          return this.sortUsageOrgRows(rows);
        },
        currentUsageOrgTreeSelectData() {
          return this.mapUsageOrgTreeSelectData(this.baseUsageOrgTree);
        },
        usageScopeOrg() {
          if (!this.usageScopeOrgId) return null;
          return this.findUsageOrgById(this.usageScopeOrgId, this.baseUsageOrgTree);
        },
        selectedUsageOrg() {
          if (!this.usageSelectedOrgId) return null;
          return this.findUsageOrgById(this.usageSelectedOrgId, this.currentUsageOrgTree);
        },
        activeUsageOrg() {
          return this.selectedUsageOrg || this.usageScopeOrg;
        },
        activeUsageOrgIds() {
          if (!this.activeUsageOrg) return null;
          const ids = [];
          const collect = (item) => {
            if (!item) return;
            ids.push(...(item.scopeOrgIds || [item.id]));
            (item.children || []).forEach(collect);
          };
          collect(this.activeUsageOrg);
          return ids;
        },
        usageUserScopeLabel() {
          if (!this.activeUsageOrg) return '全部组织';
          return this.activeUsageOrg.name;
        },
        usageOrgScopeLabel() {
          return this.usageScopeOrg ? this.usageScopeOrg.name : '全部组织';
        },
        currentUsageUsers() {
          const source = this.currentUsageRangeSource;
          const users = this.usageUsersByRange[this.usageRange] || this.scaleUsageUsers(this.usageUsersByRange[source.key] || [], source.factor);
          const filtered = this.activeUsageOrgIds
            ? users.filter(user => this.activeUsageOrgIds.includes(user.orgId))
            : users;
          return filtered
            .slice()
            .sort((a, b) => {
              if (b.totalTokens !== a.totalTokens) return b.totalTokens - a.totalTokens;
              if (b.calls !== a.calls) return b.calls - a.calls;
              return String(b.lastUsedAt || '').localeCompare(String(a.lastUsedAt || ''));
            })
            .map((item, index) => ({ ...item, rank: index + 1 }))
            .sort((a, b) => this.compareUsageUserRows(a, b))
            .map((item, index) => ({ ...item, displayRank: index + 1 }));
        },
        pagedUsageUsers() {
          const start = (this.usageUserCurrentPage - 1) * this.usageUserPageSize;
          return this.currentUsageUsers.slice(start, start + this.usageUserPageSize);
        },
        usageOrgColumns() {
          return [
            { title: '统计对象', dataIndex: 'name', key: 'name', ellipsis: true, width: 276 },
            { title: '开通账号', key: 'accounts', width: 86, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('accounts') },
            { title: this.usageRangeUsageColumnTitle, key: 'periodUsers', width: 86, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('periodUsers') },
            { title: '使用率', key: 'usageRate', width: 76, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('usageRate') },
            { title: '平均日活', key: 'avgDaily', width: 76, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('avgDaily') },
            { title: '最高日活', key: 'peakDaily', width: 76, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('peakDaily') },
            { title: 'Token 用量', key: 'token', width: 110, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('token') },
            { title: '调用次数', key: 'calls', width: 82, align: 'right', sorter: true, sortOrder: this.usageOrgColumnSortOrder('calls') }
          ];
        },
        usageUserColumns() {
          return [
            { title: '排名', key: 'displayRank', width: 64 },
            { title: '用户', key: 'user', width: 124 },
            { title: '所属组织', key: 'org', width: 204, ellipsis: true },
            { title: 'Token 用量', key: 'token', width: 116, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('token') },
            { title: '调用', key: 'calls', width: 86, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('calls') },
            { title: '对话', key: 'conversations', width: 80, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('conversations') },
            { title: '任务', key: 'tasks', width: 80, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('tasks') },
            { title: '工作台创建', key: 'workspaces', width: 128, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('workspaces') },
            { title: '技能创建', key: 'skills', width: 120, align: 'right', sorter: true, sortOrder: this.usageUserColumnSortOrder('skills') }
          ];
        },
        usageRangeUsageColumnTitle() {
          if (this.usageRangeIsCustom) return '范围使用';
          const map = {
            hour: '1小时使用',
            day: '1天使用',
            week: '本周使用',
            month: '本月使用',
            halfYear: '半年使用',
            year: '全年使用'
          };
          return map[this.usageRange] || '本周使用';
        },
        datasourceColumns() {
          return [
            { title: '数据源名称', dataIndex: 'name', key: 'name', ellipsis: true },
            { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
            { title: '连接状态', dataIndex: 'connectionStatus', key: 'connectionStatus', width: 100 },
            { title: '最近校验时间', dataIndex: 'lastChecked', key: 'lastChecked', width: 160 },
            { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120 },
            { title: '操作', key: 'action', width: 220 }
          ];
        }
      },
      watch: {
        usageRange() {
          this.usageUserCurrentPage = 1;
        },
        usageScopeOrgId() {
          this.usageSelectedOrgId = null;
          this.usageUserCurrentPage = 1;
        },
        usageSelectedOrgId() {
          this.usageUserCurrentPage = 1;
        }
      },
      methods: {
        buildUsageSummaryCards(summary) {
          const s = summary || {};
          const tokenTrend = { trendData: [120, 168, 154, 205, 238, 211, 252] };
          const callTrend = { trendData: [90, 112, 108, 132, 148, 139, 160] };
          const areaTrend = { trendData: [5, 6, 6, 7, 7, 8, 8] };
          const deptTrend = { trendData: [22, 24, 25, 28, 29, 30, 31] };
          const accountTrend = { trendData: [141, 145, 150, 154, 157, 160, 162] };
          const userTrend = { trendData: [42, 48, 46, 54, 58, 61, 64] };
          const maxDailyTrend = { trendData: [18, 22, 31, 26, 38, 30, 34] };
          const avgDailyTrend = { trendData: [19, 20, 21, 22, 23, 24, 24.6] };
          return [
            { key: 'tokens', pairKey: 'calls', label: 'Token 总量', value: this.formatUsageNumber(s.totalTokens), delta: '+12.4%', deltaTone: 'up', tone: 'blue', desc: '当前时间范围内的大模型 Token 消耗总量', ...tokenTrend },
            { key: 'calls', pairKey: 'tokens', label: '调用次数', value: this.formatUsageNumber(s.callCount), delta: '+8.7%', deltaTone: 'up', tone: 'blue', desc: '当前时间范围内的大模型调用记录数', ...callTrend },
            { key: 'areaCoverage', pairKey: 'deptCoverage', label: '地区覆盖率', value: this.formatCoverageValue(s.coverageAreaCount, s.coverageAreaTotal), delta: '+8.3%', deltaTone: 'up', tone: 'blue', desc: '有使用记录的地区数 / 地区总数', ...areaTrend },
            { key: 'deptCoverage', pairKey: 'areaCoverage', label: '部门覆盖率', value: this.formatCoverageValue(s.coverageDeptCount, s.coverageDeptTotal), delta: '+4.2%', deltaTone: 'up', tone: 'blue', desc: '有使用记录的部门数 / 部门总数', ...deptTrend },
            { key: 'accounts', pairKey: 'users', label: '开通账号数', value: this.formatUsageNumber(s.accountCount), delta: '+6', deltaTone: 'up', tone: 'blue', desc: '当前可统计范围内已开通的平台账号数量', ...accountTrend },
            { key: 'users', pairKey: 'accounts', label: '使用人数', value: this.formatUsageNumber(s.activeUserCount), delta: '+18.5%', deltaTone: 'up', tone: 'blue', desc: '当前时间范围内产生过使用行为的用户数量', ...userTrend },
            { key: 'maxDaily', pairKey: 'avgDaily', label: '最高日活', value: this.formatUsageNumber(s.maxDailyActive), delta: '+9', deltaTone: 'up', tone: 'blue', desc: '当前时间范围内单日活跃用户峰值', ...maxDailyTrend },
            { key: 'avgDaily', pairKey: 'maxDaily', label: '平均日活', value: this.formatDecimal(s.avgDailyActive), delta: '+3.2', deltaTone: 'up', tone: 'blue', desc: '当前时间范围内日活跃用户平均值', ...avgDailyTrend }
          ];
        },
        getUsageRangeSource(key) {
          const map = {
            hour: { key: 'week', factor: 0.12 },
            day: { key: 'week', factor: 0.36 },
            year: { key: 'halfYear', factor: 1.75 }
          };
          return map[key] || { key, factor: 1 };
        },
        getUsageRangeConfig(key) {
          const map = {
            hour: { amount: 1, unit: 'hour' },
            day: { amount: 1, unit: 'day' },
            week: { amount: 1, unit: 'week' },
            month: { amount: 1, unit: 'month' },
            halfYear: { amount: 6, unit: 'month' },
            year: { amount: 1, unit: 'year' }
          };
          return map[key] || map.week;
        },
        getUsageQuickRange(key) {
          if (!window.dayjs) return [];
          const end = window.dayjs();
          const config = this.getUsageRangeConfig(key);
          return [end.subtract(config.amount, config.unit), end];
        },
        getUsageRangeKeyFromTimeRange(value) {
          if (!Array.isArray(value) || !value[0] || !value[1] || !window.dayjs) return 'week';
          const minutes = Math.max(1, window.dayjs(value[1]).diff(window.dayjs(value[0]), 'minute'));
          if (minutes <= 90) return 'hour';
          if (minutes <= 2160) return 'day';
          if (minutes <= 14400) return 'week';
          if (minutes <= 64800) return 'month';
          if (minutes <= 316800) return 'halfYear';
          return 'year';
        },
        getUsageRangePresetKey(value) {
          if (!Array.isArray(value) || !value[0] || !value[1] || !window.dayjs) return null;
          const start = window.dayjs(value[0]);
          const end = window.dayjs(value[1]);
          const matched = this.usageRangeOptions.find(item => {
            const config = this.getUsageRangeConfig(item.value);
            return Math.abs(start.diff(end.subtract(config.amount, config.unit), 'minute')) <= 2;
          });
          return matched ? matched.value : null;
        },
        formatUsageTimeRange(value) {
          if (!Array.isArray(value) || !value[0] || !value[1] || !window.dayjs) return '';
          return `${window.dayjs(value[0]).format('YYYY-MM-DD HH:mm')} 至 ${window.dayjs(value[1]).format('YYYY-MM-DD HH:mm')}`;
        },
        formatUsageMetricDetailPeriod(fallback, index) {
          if (!window.dayjs || !Array.isArray(this.usageMetricModalTimeRange) || !this.usageMetricModalTimeRange[0]) return fallback;
          const start = window.dayjs(this.usageMetricModalTimeRange[0]);
          if (!start.isValid()) return fallback;
          const granularity = this.activeUsageMetricGranularityValue;
          if (granularity === 'tenMinute') return start.add(index * 10, 'minute').format('YYYY-MM-DD HH:mm');
          if (granularity === 'hour') return start.startOf('hour').add(index, 'hour').format('YYYY-MM-DD HH:00');
          if (granularity === 'day') {
            const day = start.add(index, 'day');
            const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            return `${day.format('YYYY-MM-DD')}（${weekdays[day.day()]}）`;
          }
          if (granularity === 'week') return start.add(index, 'week').format('YYYY-MM-DD');
          if (granularity === 'month') return start.startOf('month').add(index, 'month').format('YYYY-MM');
          return fallback;
        },
        handleUsageTimeRangeChange(value) {
          if (!Array.isArray(value) || !value[0] || !value[1]) return;
          const presetKey = this.getUsageRangePresetKey(value);
          this.usageRange = presetKey || this.getUsageRangeKeyFromTimeRange(value);
          this.usageRangeIsCustom = !presetKey;
          this.usageRangeLabel = presetKey
            ? (this.usageRangeOptions.find(item => item.value === presetKey) || {}).label
            : this.formatUsageTimeRange(value);
        },
        handleUsageMetricModalTimeRangeChange(value) {
          if (!Array.isArray(value) || !value[0] || !value[1]) return;
          const presetKey = this.getUsageRangePresetKey(value);
          this.usageMetricModalRange = presetKey || this.getUsageRangeKeyFromTimeRange(value);
          this.usageMetricModalRangeIsCustom = !presetKey;
          this.usageMetricModalRangeLabel = presetKey
            ? (this.usageRangeOptions.find(item => item.value === presetKey) || {}).label
            : this.formatUsageTimeRange(value);
          this.usageMetricModalGranularity = 'auto';
        },
        scaleUsageValue(value, factor, min = 0) {
          const num = Number(value) || 0;
          if (!num) return 0;
          return Math.max(min, Math.round(num * factor));
        },
        scaleUsageRows(rows, factor) {
          return (rows || []).map(row => {
            const next = {
              ...row,
              totalTokens: this.scaleUsageValue(row.totalTokens, factor),
              activeUsers: this.scaleUsageValue(row.activeUsers, factor, 1),
              calls: this.scaleUsageValue(row.calls, factor, 1)
            };
            if (Array.isArray(row.children)) next.children = this.scaleUsageRows(row.children, factor);
            return next;
          });
        },
        scaleUsageUsers(users, factor) {
          return (users || []).map(user => ({
            ...user,
            totalTokens: this.scaleUsageValue(user.totalTokens, factor),
            calls: this.scaleUsageValue(user.calls, factor, 1)
          }));
        },
        getUsageOrgTreeForRange(range) {
          const direct = this.usageOrgTreeByRange[range];
          if (direct) return direct;
          const source = this.getUsageRangeSource(range);
          return this.scaleUsageRows(this.usageOrgTreeByRange[source.key] || [], source.factor);
        },
        mapUsageOrgTreeSelectData(items) {
          return (items || []).map(item => ({
            title: item.name,
            value: item.id,
            key: item.id,
            children: this.mapUsageOrgTreeSelectData(item.children)
          }));
        },
        findUsageOrgById(id, items) {
          for (const item of items || []) {
            if (item.id === id) return item;
            const child = this.findUsageOrgById(id, item.children || []);
            if (child) return child;
          }
          return null;
        },
        getUsageOrgTreeTotalForRange(range) {
          const rows = this.getUsageOrgTreeForRange(range);
          return (rows || []).reduce((sum, item) => sum + (Number(item && item.totalTokens) || 0), 0);
        },
        getScaledUsageLeaderboardEntry(item) {
          const countFactor = this.currentUsageLeaderboardCallFactor;
          return {
            ...item,
            tokens: this.scaleUsageValue(item.tokens, this.currentUsageLeaderboardTokenFactor),
            calls: this.scaleUsageValue(item.calls, countFactor, 1),
            conversations: this.scaleUsageValue(item.conversations, countFactor, 1),
            tasks: this.scaleUsageValue(item.tasks, countFactor, 1),
            skills: this.scaleUsageValue(item.skills, Math.min(countFactor, 4), item.skills ? 1 : 0)
          };
        },
        getUsageLeaderboardActivityValue(item) {
          return (Number(item && item.conversations) || 0) + (Number(item && item.tasks) || 0);
        },
        getUsageLeaderboardBoardMeta(type) {
          const map = {
            resources: { title: '资源使用榜', desc: '按 Token 降序', primaryColumn: 'Token 用量', secondaryColumn: '调用' },
            activity: { title: '应用活跃榜', desc: '按交互总数降序', primaryColumn: '交互总数', secondaryColumn: '对话 / 任务' },
            skills: { title: '技能建设榜', desc: '按技能创建降序', primaryColumn: '技能创建', secondaryColumn: '' }
          };
          return map[type] || map.resources;
        },
        getUsageLeaderboardSortedEntries(type) {
          const rows = this.currentUsageLeaderboardEntries.slice();
          return rows.sort((a, b) => {
            if (type === 'activity') {
              const activityDiff = this.getUsageLeaderboardActivityValue(b) - this.getUsageLeaderboardActivityValue(a);
              if (activityDiff) return activityDiff;
              if (b.conversations !== a.conversations) return b.conversations - a.conversations;
              return b.tasks - a.tasks;
            }
            if (type === 'skills') {
              if (b.skills !== a.skills) return b.skills - a.skills;
              return b.tokens - a.tokens;
            }
            if (b.tokens !== a.tokens) return b.tokens - a.tokens;
            return b.calls - a.calls;
          });
        },
        getUsageLeaderboardRows(type) {
          return this.getUsageLeaderboardSortedEntries(type).slice(0, 5).map(item => this.formatUsageLeaderboardRow(item, type));
        },
        formatUsageLeaderboardRow(item, type) {
          const meta = this.usageLeaderboardScope === 'user' ? item.orgName : '';
          if (type === 'activity') {
            return {
              id: `${type}-${item.id}`,
              name: item.name,
              meta,
              primaryValue: this.formatUsageNumber(this.getUsageLeaderboardActivityValue(item)),
              secondaryValue: `${this.formatUsageNumber(item.conversations)} / ${this.formatUsageNumber(item.tasks)}`
            };
          }
          if (type === 'skills') {
            return {
              id: `${type}-${item.id}`,
              name: item.name,
              meta,
              primaryValue: this.formatUsageNumber(item.skills),
              secondaryValue: ''
            };
          }
          return {
            id: `${type}-${item.id}`,
            name: item.name,
            meta,
            primaryValue: this.formatUsageNumber(item.tokens),
            secondaryValue: this.formatUsageNumber(item.calls)
          };
        },
        getUsageLeaderboardScopeLabel() {
          const option = this.usageLeaderboardScopeOptions.find(item => item.value === this.usageLeaderboardScope);
          return option ? String(option.label).replace('榜单', '') : '全部';
        },
        getUsageLeaderboardLevelExportLabel() {
          return this.showUsageLeaderboardLevel ? this.currentUsageLeaderboardLevelLabel : '';
        },
        getUsageLeaderboardExportRows(type) {
          const contextColumns = ['统计口径', '层级', '组织范围', '时间范围'];
          const contextValues = [
            this.getUsageLeaderboardScopeLabel(),
            this.getUsageLeaderboardLevelExportLabel(),
            this.usageOrgScopeLabel,
            this.currentUsageRangeLabel
          ];
          const sorted = this.getUsageLeaderboardSortedEntries(type);
          if (type === 'activity') {
            return [
              ['排名', '对象', '所属组织', '交互总数', '对话', '任务', 'Token 用量', '调用'].concat(contextColumns),
              ...sorted.map((item, index) => [
                index + 1,
                item.name,
                this.usageLeaderboardScope === 'user' ? item.orgName : '',
                this.getUsageLeaderboardActivityValue(item),
                item.conversations,
                item.tasks,
                item.tokens,
                item.calls
              ].concat(contextValues))
            ];
          }
          if (type === 'skills') {
            return [
              ['排名', '对象', '所属组织', '技能创建', 'Token 用量', '调用'].concat(contextColumns),
              ...sorted.map((item, index) => [
                index + 1,
                item.name,
                this.usageLeaderboardScope === 'user' ? item.orgName : '',
                item.skills,
                item.tokens,
                item.calls
              ].concat(contextValues))
            ];
          }
          return [
            ['排名', '对象', '所属组织', 'Token 用量', '调用'].concat(contextColumns),
            ...sorted.map((item, index) => [
              index + 1,
              item.name,
              this.usageLeaderboardScope === 'user' ? item.orgName : '',
              item.tokens,
              item.calls
            ].concat(contextValues))
          ];
        },
        getUsageMetricDetailExportRows() {
          const card = this.activeUsageMetricCard;
          if (!card) return [];
          return [
            ['统计周期', card.label, '统计颗粒度', '组织范围', '时间范围', '指标口径'],
            ...this.activeUsageMetricDetailRows.map(row => [
              row.period,
              row.value,
              row.granularity,
              this.activeUsageMetricScopeLabel,
              this.activeUsageMetricRangeLabel,
              card.desc
            ])
          ];
        },
        formatUsageCsvCell(value) {
          const text = value == null ? '' : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        },
        downloadUsageCsvFile(filename, rows) {
          if (!Array.isArray(rows) || !rows.length || typeof document === 'undefined') return;
          const body = rows.map(row => row.map(this.formatUsageCsvCell).join(',')).join('\r\n');
          const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        },
        getUsageExportFileName(parts) {
          const text = (Array.isArray(parts) ? parts : [parts]).filter(Boolean).join('-') || '导出';
          return `${text.replace(/[/\\?%*:|"<>]/g, '_')}.csv`;
        },
        handleUsageLeaderboardExport(type) {
          const board = this.getUsageLeaderboardBoardMeta(type);
          const sorted = this.getUsageLeaderboardSortedEntries(type);
          if (!sorted.length) {
            message.info('暂无可导出的榜单数据');
            return;
          }
          const filename = this.getUsageExportFileName([
            '重点榜单',
            this.getUsageLeaderboardScopeLabel(),
            this.getUsageLeaderboardLevelExportLabel(),
            board.title,
            this.currentUsageRangeLabel
          ]);
          this.downloadUsageCsvFile(filename, this.getUsageLeaderboardExportRows(type));
          message.success(`已导出${board.title}全量数据`);
        },
        handleUsageMetricDetailExport() {
          const card = this.activeUsageMetricCard;
          const rows = this.getUsageMetricDetailExportRows();
          if (!card || rows.length <= 1) {
            message.info('暂无可导出的趋势明细');
            return;
          }
          const filename = this.getUsageExportFileName([
            '趋势明细',
            card.label,
            this.activeUsageMetricScopeLabel,
            this.activeUsageMetricRangeLabel
          ]);
          this.downloadUsageCsvFile(filename, rows);
          message.success('已导出趋势明细');
        },
        selectUsageOrg(record) {
          this.usageSelectedOrgId = record && record.id ? record.id : null;
        },
        openUsageMetricModal(key) {
          this.usageMetricModalOrgId = this.usageScopeOrgId || null;
          this.usageMetricModalRange = this.usageRange;
          this.usageMetricModalRangeLabel = this.currentUsageRangeLabel;
          this.usageMetricModalRangeIsCustom = this.usageRangeIsCustom;
          this.usageMetricModalTimeRange = Array.isArray(this.usageTimeRange) ? this.usageTimeRange.slice() : [];
          this.usageMetricModalGranularity = 'auto';
          this.usageMetricModalKey = key;
        },
        closeUsageMetricModal() {
          this.usageMetricModalKey = null;
        },
        handleUsageOrgTableChange(pagination, filters, sorter) {
          this.usageOrgSort = this.normalizeUsageSorter(sorter, 'token');
        },
        handleUsageUserTableChange(pagination, filters, sorter) {
          this.usageUserSort = this.normalizeUsageSorter(sorter, 'token');
          this.usageUserCurrentPage = 1;
        },
        normalizeUsageSorter(sorter, fallbackKey) {
          const item = Array.isArray(sorter) ? sorter.find(entry => entry && entry.order) : sorter;
          if (!item || !item.order) return { key: fallbackKey, order: 'descend' };
          return {
            key: item.columnKey || item.field || item.key,
            order: item.order
          };
        },
        usageOrgColumnSortOrder(key) {
          return this.usageOrgSort && this.usageOrgSort.key === key ? this.usageOrgSort.order : null;
        },
        usageUserColumnSortOrder(key) {
          return this.usageUserSort && this.usageUserSort.key === key ? this.usageUserSort.order : null;
        },
        sortUsageOrgRows(rows) {
          const normalized = (rows || []).map(row => {
            const children = this.sortUsageOrgRows(row.children || []);
            return children.length ? { ...row, children } : { ...row };
          });
          if (!this.usageOrgSort || !this.usageOrgSort.order) return normalized;
          const direction = this.usageOrgSort.order === 'ascend' ? 1 : -1;
          return normalized.sort((a, b) => {
            if (a && a.isSelfNode) return -1;
            if (b && b.isSelfNode) return 1;
            return this.compareUsageSortValues(
              this.getUsageOrgSortValue(a, this.usageOrgSort.key),
              this.getUsageOrgSortValue(b, this.usageOrgSort.key)
            ) * direction;
          });
        },
        compareUsageUserRows(a, b) {
          if (!this.usageUserSort || !this.usageUserSort.order) return 0;
          const direction = this.usageUserSort.order === 'ascend' ? 1 : -1;
          const compared = this.compareUsageSortValues(
            this.getUsageUserSortValue(a, this.usageUserSort.key),
            this.getUsageUserSortValue(b, this.usageUserSort.key)
          );
          return compared * direction || a.rank - b.rank;
        },
        compareUsageSortValues(a, b) {
          if (typeof a === 'string' || typeof b === 'string') return String(a || '').localeCompare(String(b || ''), 'zh-CN');
          return (Number(a) || 0) - (Number(b) || 0);
        },
        getUsageOrgSortValue(record, key) {
          const map = {
            accounts: this.getUsageOrgAccountCount(record),
            periodUsers: record && record.activeUsers,
            usageRate: this.getUsageRateValue(record),
            avgDaily: Number(this.formatDailyAverage(record)) || 0,
            peakDaily: this.getUsagePeakDailyActive(record),
            token: record && record.totalTokens,
            calls: record && record.calls
          };
          return map[key];
        },
        getUsageUserSortValue(record, key) {
          const map = {
            token: record && record.totalTokens,
            calls: record && record.calls,
            conversations: this.getUserUsageDerivedMetric(record, 'conversations'),
            tasks: this.getUserUsageDerivedMetric(record, 'tasks'),
            workspaces: this.getUserUsageDerivedMetric(record, 'workspaces'),
            skills: this.getUserUsageDerivedMetric(record, 'skills')
          };
          return map[key];
        },
        clearUsageOrg() {
          this.usageSelectedOrgId = null;
        },
        usageOrgRowProps(record) {
          return {
            onClick: () => this.selectUsageOrg(record)
          };
        },
        usageOrgRowClassName(record) {
          const classes = ['ds-settings-statistics-org-row'];
          if (record && record.id === this.usageSelectedOrgId) classes.push('is-selected');
          const rate = this.getUsageRateValue(record);
          if (rate === 0) classes.push('is-zero-usage');
          else if (rate > 0 && rate < 0.4) classes.push('is-low-usage');
          return classes.join(' ');
        },
        renderUsageOrgExpandIcon(props) {
          const record = props && props.record;
          const hasChildren = !!(record && Array.isArray(record.children) && record.children.length);
          if (!hasChildren) {
            return h('span', {
              class: 'ds-settings-statistics-org-expand is-leaf',
              'aria-hidden': 'true'
            });
          }
          const DsIcon = resolveComponent('DsIcon');
          const expanded = !!(props && props.expanded);
          return h('span', {
            class: ['ds-settings-statistics-org-expand', { 'is-expanded': expanded }],
            role: 'button',
            tabindex: 0,
            'aria-label': expanded ? '收起组织' : '展开组织',
            'aria-expanded': String(expanded),
            onClick: (event) => {
              event.stopPropagation();
              if (typeof props.onExpand === 'function') props.onExpand(record, event);
            },
            onKeydown: (event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              if (typeof props.onExpand === 'function') props.onExpand(record, event);
            }
          }, [
            h(DsIcon, {
              name: 'chevron-right',
              class: 'ds-settings-statistics-org-expand__chev',
              'aria-hidden': 'true'
            })
          ]);
        },
        formatUsageNumber(value) {
          const num = Number(value) || 0;
          return num.toLocaleString('zh-CN');
        },
        formatDecimal(value) {
          const num = Number(value) || 0;
          return num.toFixed(1).replace(/\.0$/, '');
        },
        formatUsagePercent(value, total) {
          const denominator = Number(total) || 0;
          if (!denominator) return '-';
          const percent = ((Number(value) || 0) / denominator) * 100;
          return `${percent.toFixed(1).replace(/\.0$/, '')}%`;
        },
        formatCoverageValue(value, total) {
          return `${this.formatUsageNumber(value)} / ${this.formatUsageNumber(total)}`;
        },
        getUsageOrgAccountCount(record) {
          const activeUsers = Number(record && record.activeUsers) || 0;
          return Math.max(activeUsers, Math.round(activeUsers * 1.75));
        },
        getUsageRateValue(record) {
          const accounts = this.getUsageOrgAccountCount(record);
          if (!accounts) return 0;
          return (Number(record && record.activeUsers) || 0) / accounts;
        },
        formatUsageRate(record) {
          return `${(this.getUsageRateValue(record) * 100).toFixed(1).replace(/\.0$/, '')}%`;
        },
        getUsageRateToneClass(record) {
          const rate = this.getUsageRateValue(record);
          if (rate >= 0.5) return 'ds-settings-statistics-rate is-good';
          if (rate > 0) return 'ds-settings-statistics-rate is-warn';
          return 'ds-settings-statistics-rate is-empty';
        },
        getUsagePeakDailyActive(record) {
          const activeUsers = Number(record && record.activeUsers) || 0;
          return activeUsers ? Math.max(1, Math.ceil(activeUsers * 0.62)) : 0;
        },
        getUsageDailyAverageValue(record, range) {
          const activeUsers = Number(record && record.activeUsers) || 0;
          if (!activeUsers) return 0;
          const divisorMap = { hour: 1, day: 1, week: 7, month: 30, halfYear: 180, year: 365 };
          const divisor = divisorMap[range] || 7;
          return activeUsers * Math.min(divisor, 14) / divisor;
        },
        formatDailyAverage(record) {
          return this.formatDecimal(this.getUsageDailyAverageValue(record, this.usageRange));
        },
        getUsageMetricTrendDataForCard(card) {
          if (!card || !Array.isArray(card.trendData)) return [];
          const pointCount = this.activeUsageMetricAxisLabels.length;
          const data = card.trendData.map(value => Number(value) || 0);
          if (!data.length || pointCount <= 0) return [];
          if (pointCount === 1) return [data[data.length - 1]];
          return Array.from({ length: pointCount }, (_, index) => {
            const position = (index / (pointCount - 1)) * (data.length - 1);
            const lower = Math.floor(position);
            const upper = Math.ceil(position);
            if (lower === upper) return data[lower];
            const ratio = position - lower;
            return Math.round((data[lower] + (data[upper] - data[lower]) * ratio) * 10) / 10;
          });
        },
        normalizeUsageTrendData(data) {
          if (!Array.isArray(data) || !data.length) return [];
          const first = Number(data[0]) || 1;
          return data.map(value => Math.round(((Number(value) || 0) / first) * 1000) / 10);
        },
        getUsageMetricDetailTargetValue(key) {
          const summary = this.activeUsageMetricSummary || {};
          const map = {
            tokens: summary.totalTokens,
            calls: summary.callCount,
            areaCoverage: summary.coverageAreaCount,
            deptCoverage: summary.coverageDeptCount,
            accounts: summary.accountCount,
            users: summary.activeUserCount,
            maxDaily: summary.maxDailyActive,
            avgDaily: summary.avgDailyActive
          };
          return Number(map[key]) || 0;
        },
        getUsageMetricDetailValues(key, data) {
          const source = Array.isArray(data) ? data.map(value => Number(value) || 0) : [];
          if (!source.length) return [];
          const target = this.getUsageMetricDetailTargetValue(key);
          if (!target) return source.map(() => 0);
          if (['tokens', 'calls'].includes(key)) {
            const total = source.reduce((sum, value) => sum + value, 0) || 1;
            let used = 0;
            return source.map((value, index) => {
              if (index === source.length - 1) return Math.max(0, Math.round(target - used));
              const next = Math.max(0, Math.round((value / total) * target));
              used += next;
              return next;
            });
          }
          const max = Math.max(...source, 1);
          const denominator = key === 'maxDaily' ? max : (source[source.length - 1] || max);
          const scale = denominator ? target / denominator : 1;
          return source.map(value => {
            const next = value * scale;
            return key === 'avgDaily' ? Math.round(next * 10) / 10 : Math.max(0, Math.round(next));
          });
        },
        formatUsageMetricDetailValue(key, value) {
          const summary = this.activeUsageMetricSummary || {};
          const num = Number(value) || 0;
          if (key === 'areaCoverage') {
            const total = Number(summary.coverageAreaTotal) || 0;
            return this.formatCoverageValue(Math.min(total, Math.max(0, Math.round(num))), total);
          }
          if (key === 'deptCoverage') {
            const total = Number(summary.coverageDeptTotal) || 0;
            return this.formatCoverageValue(Math.min(total, Math.max(0, Math.round(num))), total);
          }
          if (key === 'avgDaily') return this.formatDecimal(num);
          return this.formatUsageNumber(Math.round(num));
        },
        getUserUsageDerivedMetric(record, type) {
          const calls = Number(record && record.calls) || 0;
          const rank = Number(record && record.rank) || 1;
          const map = {
            conversations: Math.round(calls * 0.43),
            tasks: Math.round(calls * 0.18),
            workspaces: Math.max(0, 7 - rank),
            skills: Math.max(0, 5 - Math.ceil(rank / 2))
          };
          return map[type] || 0;
        },
        formatActiveUserShareTip(record) {
          const activeUsers = this.formatUsageNumber(record && record.activeUsers);
          const totalUsers = this.formatUsageNumber(this.currentUsageSummary.activeUserCount);
          return `${activeUsers} / ${totalUsers}`;
        },
        formatUsageUserPaginationTotal(total) {
          return `共 ${total} 人`;
        },
        handleUsageUserPageChange(page, pageSize) {
          this.usageUserCurrentPage = page;
          this.usageUserPageSize = pageSize;
        },
        handleUsageUserPageSizeChange(current, pageSize) {
          this.usageUserCurrentPage = 1;
          this.usageUserPageSize = pageSize;
        },
        handleUsageRefresh() {
          message.success('统计数据已刷新');
        },
        handleUsageOrgExport() {
          message.info('导出组织用量统计入口已预留');
        },
        handleUsageUserExport() {
          message.info('导出用户消耗榜单入口已预留');
        }
      },
    });

})();
