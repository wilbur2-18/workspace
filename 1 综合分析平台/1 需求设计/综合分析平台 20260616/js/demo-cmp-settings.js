(function () {
  const app = window.__DEMO_APP;
  const { h, resolveComponent } = Vue;

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
                    <a-segmented v-model:value="usageRange" :options="usageRangeOptions" class="ds-ant-segmented ds-ant-segmented--compact ds-settings-statistics-range" />
                    <a-button @click="handleUsageRefresh">
                      <ds-icon name="refresh" class="icon-gap-right" />刷新
                    </a-button>
                  </div>
                </div>
                <div class="ds-settings-body ds-settings-statistics">
                  <div class="ds-settings-statistics-summary">
                    <div v-for="item in currentUsageSummaryCards" :key="item.key" class="ds-settings-stat-card">
                      <div class="ds-settings-stat-card__main">
                        <span class="ds-settings-stat-card__icon" :class="'is-' + item.tone">
                          <ds-icon :name="item.icon" />
                        </span>
                        <div class="ds-settings-stat-card__text">
                          <div class="ds-settings-stat-card__label">
                            <span>{{ item.label }}</span>
                            <a-tooltip :title="item.desc">
                              <span class="ds-settings-stat-card__help" role="img" :aria-label="item.desc">
                                <ds-icon name="circle-info" />
                              </span>
                            </a-tooltip>
                          </div>
                          <div class="ds-settings-stat-card__value">{{ item.value }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="ds-settings-statistics-grid">
                    <section class="ds-settings-statistics-panel ds-settings-statistics-panel--org">
                      <div class="ds-settings-statistics-panel__head">
                        <div class="ds-settings-statistics-panel__title-group">
                          <h3 class="ds-settings-statistics-panel__title" :title="usageOrgScopeLabel">
                            <span class="ds-settings-statistics-panel__scope">{{ usageOrgScopeLabel }}</span>
                            <span>用量统计</span>
                            <a-tooltip title="每行统计本组织及下级组织">
                              <span class="ds-settings-statistics-panel__title-help" role="img" aria-label="每行统计本组织及下级组织">
                                <ds-icon name="circle-info" />
                              </span>
                            </a-tooltip>
                          </h3>
                        </div>
                        <div class="ds-settings-statistics-panel__ops">
                          <a-button v-if="usageSelectedOrgId" type="link" size="small" @click="clearUsageOrg">取消选中</a-button>
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
                      >
                        <template #bodyCell="{ column, record }">
                          <template v-if="column.key === 'token'">
                            <span class="ds-settings-statistics-num">{{ formatUsageNumber(record.totalTokens) }}</span>
                          </template>
                          <template v-else-if="column.key === 'activeUsers'">
                            <a-tooltip :title="formatActiveUserShareTip(record)">
                              <span>{{ formatUsagePercent(record.activeUsers, currentUsageSummary.activeUserCount) }}</span>
                            </a-tooltip>
                          </template>
                          <template v-else-if="column.key === 'calls'">
                            <span>{{ formatUsageNumber(record.calls) }}</span>
                          </template>
                        </template>
                      </a-table>
                    </section>
                    <section class="ds-settings-statistics-panel ds-settings-statistics-panel--users">
                      <div class="ds-settings-statistics-panel__head">
                        <div class="ds-settings-statistics-panel__title-group">
                          <h3 class="ds-settings-statistics-panel__title" :title="usageUserScopeLabel">
                            <span class="ds-settings-statistics-panel__scope">{{ usageUserScopeLabel }}</span>
                            <span>用户消耗榜单</span>
                          </h3>
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
                      >
                        <template #bodyCell="{ column, record }">
                          <template v-if="column.key === 'rank'">
                            <span class="ds-settings-user-rank" :class="record.rank <= 3 ? 'is-top' : 'is-plain'">{{ record.rank }}</span>
                          </template>
                          <template v-else-if="column.key === 'user'">
                            <div class="ds-settings-user-cell">
                              <span class="ds-settings-user-cell__name">{{ record.name }}</span>
                              <span class="ds-settings-user-cell__org">{{ record.orgName || '-' }}</span>
                            </div>
                          </template>
                          <template v-else-if="column.key === 'token'">
                            <span class="ds-settings-statistics-num">{{ formatUsageNumber(record.totalTokens) }}</span>
                          </template>
                          <template v-else-if="column.key === 'calls'">
                            <span>{{ formatUsageNumber(record.calls) }}</span>
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
          usageRange: 'month',
          usageScopeOrgId: null,
          usageSelectedOrgId: null,
          usageUserCurrentPage: 1,
          usageUserPageSize: 8,
          usageUserPageSizeOptions: ['5', '8', '10'],
          usageRangeOptions: [
            { label: '最近1周', value: 'week' },
            { label: '最近1月', value: 'month' },
            { label: '最近半年', value: 'halfYear' }
          ],
          usageStatsByRange: {
            week: { totalTokens: 286400, activeOrgCount: 7, activeUserCount: 28, callCount: 684 },
            month: { totalTokens: 1265800, activeOrgCount: 12, activeUserCount: 86, callCount: 3421 },
            halfYear: { totalTokens: 6843200, activeOrgCount: 19, activeUserCount: 146, callCount: 18620 }
          },
          usageOrgTreeByRange: {
            week: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 98500, activeUsers: 9, calls: 218, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-1', name: '一科', totalTokens: 56200, activeUsers: 5, calls: 126, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 42300, activeUsers: 4, calls: 92, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 76400, activeUsers: 8, calls: 181, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 39200, activeUsers: 4, calls: 96, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 37200, activeUsers: 4, calls: 85, lastUsedAt: '2026-05-27 15:24' }
              ] },
              { id: 'org-fin', name: '财政金融审计处', totalTokens: 68100, activeUsers: 7, calls: 164, lastUsedAt: '2026-05-28 11:35' },
              { id: 'org-data', name: '数据分析中心', totalTokens: 43400, activeUsers: 4, calls: 121, lastUsedAt: '2026-05-29 08:55' }
            ],
            month: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 482000, activeUsers: 24, calls: 1026, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-1', name: '一科', totalTokens: 273600, activeUsers: 13, calls: 596, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 208400, activeUsers: 11, calls: 430, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 354800, activeUsers: 19, calls: 842, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 189600, activeUsers: 10, calls: 462, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 165200, activeUsers: 9, calls: 380, lastUsedAt: '2026-05-27 15:24' }
              ] },
              { id: 'org-fin', name: '财政金融审计处', totalTokens: 248700, activeUsers: 17, calls: 701, lastUsedAt: '2026-05-28 11:35' },
              { id: 'org-data', name: '数据分析中心', totalTokens: 180300, activeUsers: 26, calls: 852, lastUsedAt: '2026-05-29 08:55' }
            ],
            halfYear: [
              { id: 'org-eco', name: '经济责任审计处', totalTokens: 2448600, activeUsers: 42, calls: 6226, lastUsedAt: '2026-05-29 09:42', children: [
                { id: 'org-eco-1', name: '一科', totalTokens: 1326400, activeUsers: 22, calls: 3418, lastUsedAt: '2026-05-29 09:42' },
                { id: 'org-eco-2', name: '二科', totalTokens: 1122200, activeUsers: 20, calls: 2808, lastUsedAt: '2026-05-28 17:16' }
              ] },
              { id: 'org-inv', name: '固定资产投资审计处', totalTokens: 1895400, activeUsers: 38, calls: 5024, lastUsedAt: '2026-05-28 18:08', children: [
                { id: 'org-inv-1', name: '项目审计一组', totalTokens: 986200, activeUsers: 19, calls: 2596, lastUsedAt: '2026-05-28 18:08' },
                { id: 'org-inv-2', name: '项目审计二组', totalTokens: 909200, activeUsers: 19, calls: 2428, lastUsedAt: '2026-05-27 15:24' }
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
        currentUsageSummary() {
          return this.usageStatsByRange[this.usageRange] || this.usageStatsByRange.month;
        },
        currentUsageSummaryCards() {
          const s = this.currentUsageSummary;
          return [
            { key: 'tokens', label: 'Token 总量', value: this.formatUsageNumber(s.totalTokens), desc: '大模型 Token 消耗', icon: 'database', tone: 'blue' },
            { key: 'calls', label: '调用次数', value: this.formatUsageNumber(s.callCount), desc: '大模型调用记录数', icon: 'magic', tone: 'purple' },
            { key: 'orgs', label: '活跃组织数', value: this.formatUsageNumber(s.activeOrgCount), desc: '产生过模型调用的组织', icon: 'sitemap', tone: 'green' },
            { key: 'users', label: '活跃用户数', value: this.formatUsageNumber(s.activeUserCount), desc: '产生过模型调用的用户', icon: 'user', tone: 'amber' }
          ];
        },
        baseUsageOrgTree() {
          return this.usageOrgTreeByRange[this.usageRange] || [];
        },
        currentUsageOrgTree() {
          if (!this.usageScopeOrg) return this.baseUsageOrgTree;
          return Array.isArray(this.usageScopeOrg.children) && this.usageScopeOrg.children.length ? this.usageScopeOrg.children : [this.usageScopeOrg];
        },
        currentUsageOrgTreeSelectData() {
          const mapTree = (items) => (items || []).map(item => ({
            title: item.name,
            value: item.id,
            key: item.id,
            children: mapTree(item.children)
          }));
          return mapTree(this.baseUsageOrgTree);
        },
        usageScopeOrg() {
          if (!this.usageScopeOrgId) return null;
          const findOrg = (items) => {
            for (const item of items || []) {
              if (item.id === this.usageScopeOrgId) return item;
              const child = findOrg(item.children || []);
              if (child) return child;
            }
            return null;
          };
          return findOrg(this.baseUsageOrgTree);
        },
        selectedUsageOrg() {
          if (!this.usageSelectedOrgId) return null;
          const findOrg = (items) => {
            for (const item of items || []) {
              if (item.id === this.usageSelectedOrgId) return item;
              const child = findOrg(item.children || []);
              if (child) return child;
            }
            return null;
          };
          return findOrg(this.currentUsageOrgTree);
        },
        activeUsageOrg() {
          return this.selectedUsageOrg || this.usageScopeOrg;
        },
        activeUsageOrgIds() {
          if (!this.activeUsageOrg) return null;
          const ids = [];
          const collect = (item) => {
            if (!item) return;
            ids.push(item.id);
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
          const users = this.usageUsersByRange[this.usageRange] || [];
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
            .map((item, index) => ({ ...item, rank: index + 1 }));
        },
        pagedUsageUsers() {
          const start = (this.usageUserCurrentPage - 1) * this.usageUserPageSize;
          return this.currentUsageUsers.slice(start, start + this.usageUserPageSize);
        },
        usageOrgColumns() {
          return [
            { title: '组织单位', dataIndex: 'name', key: 'name', ellipsis: true, width: 190 },
            { title: 'Token 用量', key: 'token', width: 96, align: 'right' },
            { title: '调用次数', key: 'calls', width: 84, align: 'right' },
            { title: '活跃用户占比', key: 'activeUsers', width: 96, align: 'right' }
          ];
        },
        usageUserColumns() {
          return [
            { title: '排名', key: 'rank', width: 48, align: 'center' },
            { title: '用户', key: 'user' },
            { title: 'Token 用量', key: 'token', align: 'right' },
            { title: '调用次数', key: 'calls', align: 'right' }
          ];
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
        selectUsageOrg(record) {
          this.usageSelectedOrgId = record && record.id ? record.id : null;
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
          return record && record.id === this.usageSelectedOrgId ? 'ds-settings-statistics-org-row is-selected' : 'ds-settings-statistics-org-row';
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
          if (num >= 10000) {
            const formatted = (num / 10000).toFixed(num >= 100000 ? 1 : 2).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1');
            return `${formatted}万`;
          }
          return num.toLocaleString('zh-CN');
        },
        formatUsagePercent(value, total) {
          const denominator = Number(total) || 0;
          if (!denominator) return '-';
          const percent = ((Number(value) || 0) / denominator) * 100;
          return `${percent.toFixed(1).replace(/\.0$/, '')}%`;
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
