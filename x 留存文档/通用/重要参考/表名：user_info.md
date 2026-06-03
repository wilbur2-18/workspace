表名：user_info  
表注释：用户信息表  
字段信息：  
```
user_id：用户编号,
user_name：用户名(账号),
name：姓名,
nick_name：昵称,
phone：电话1,
phone_verified：电话是否验证,
email：邮件,
email_verified：邮箱是否验证,
gender：性别,
birthday：生日,
birthday_update：会员生日修改时间（会员自己一年只能修改一次，记录的是修改时间）,
address：地址,
certificate_type：证件类型,
certificate_no：证件号码,
user_type-用户类型：0管理员；1个人用户；2企业用户,
platform_type：平台类型0:充电用户10:平台超级管理员(暂未使用)20:平台普通管理员30:平台创建的运营商超管(由平台管理员进行创建)40:普通运营商管理员(由运营商超管进行创建)50:企业管理员,
update_time：更新时间,
create_time：创建时间,
operator_id：运营商ID,
enterprise_id,
source-0-其它1-平台2-App3-微信公众号4-微信小程序5-第三方,
creater_user_id：创建人id,
elec_discount：电费折扣率,
service_discount：服务费折扣率,
pay_type：是否计费0不计费1计费,
province_id：省ID,
city_id：市ID,
county_id：区县ID,
append：备注,
overdraft：透支额度,
status-状态,
lock_reason：锁定原因,
portrait：用户头像,
maintain_type-0：非运维系统用户，1平台级运维管理员、2.区域级运维管理员、3区域级运维人员、4可协助运维人员,
dd_user_id：钉钉用户ID,
cancel_status-注销状态1注销,
skip_pass_level：是否跳过密码强度校验，0不跳过，1跳过,
source_operator_id：充电用户扫码的设备所属运营商,
is_driver：是否是司机,0否1是,
inviter_user_id：邀请人,
activity_id：活动id,
amount_coupon：最低优惠券使用额度,
coupon_priority：优惠券抵扣优先级0折扣金额1过期时间,
coupon_priority_status：优惠券抵扣优先级是否调整0未调整1已调整,
auto_refund：是否自动退款0否1是,
veteran_certification_name：荣军联盟认证姓名,
veteran_certification_status：荣军联盟认证成功失败状态：0-未认证，1-已认证,
user_level_type：会员等级标识0自定义会员，1专属会员，2贵宾会员,
level_id：会员等级id,
relegate_protect_time：降级保护时间,
upgrade_time：升级时间,
relegate_time：降级时间,
enable_sms：短信通知开关默认关0关闭1开启,
station_id：会员所属场站（保留字段）,
head_img_wx：用户头像wx公众号,
head_img_wx_applets：用户头像wx小程序,
head_img_ali-‘用户头像支付宝生活号,
head_img_alipay_applets_c：用户支付宝小程序C端头像,
soc：用户充电限制soc值,

```
  
表名：card_user  
表注释：电卡用户绑定  
字段信息：  
```
id：主键（从 AUTO_INCREMENT 和 PRIMARY KEY 推断）
card_id：卡编号
user_id：客户编号
bind_time：绑定时间
unbind_time：解绑时间
append：备注
update_time：更新时间

```
  
表名：charger  
表注释：充电系统表  
字段信息：  
```
charger_id：充电系统编号
name：充电系统名称
model：无注释
owner_operator_id：所属运营商编号
station_id：场站编码
charger_type：交直流类型
power：总功率
max_gun_power：枪最大功率
term_count：总终端数量
valid_term_count：有效枪数（除去占位的）
unit_model_id：模块型号
unit_count：模块数量
single_module_group_count：各系统模块组的模块数量
manufacture：厂家
communicate_mode：通信方式
device_id：设备唯一码
elec_loss：电损比例
status：状态
off_run：设备是否离线运行：1 是，0 否
create_time：无注释
update_time：更新时间
append：备注
device_type：无注释
project_id：项目ID
project_remark：项目备注
protect_time：超保时间（工单使用）
third_charger：0海汇德桩 1装直连 2中电
brand_type：品牌类型  1 海汇德自营、2 海汇德联营、3 商家外购
access_type：接入方式  1开头表示海汇德设备 2开头表示其他桩企设备 {  10海汇德设备直连平台，11海汇德设备双联，12树莓派转接，20第三方设备直连，21第三方设备平台接入}
access_version：第三方协议版本 100(2016版;) 101(2021版;) 102(自定义版本;) 201(云快充1.6;) 202(蔚景云2.0;) 203(蔚景云2.2;) 204(国网SDKV1.17:) 205(万马1.05;) 206(龙港:) 207(云快充1.5服务端;) 208(新绿新能源V1.0.10:) 209(绿源新能源高速1.2;) 210(绿源新能源高速V1.22;) 211(达克云V5.3;) 212(新绿新能源V1.0.15:) 213(海康桩直连V2.1:) 214(通利达4.9;) 215(绿电:) 216(特来电V1.0.4;) 217(特来电V1.8;)
access_platform：对接平台  1长安集团平台 2河北政府平台 3国网电动汽车平台 4黑龙江省平台 5青岛市平台 6沈阳城投运营平台 7聊城公交平台 8四川省监控平台 9联行平台 10江苏省电动汽车充电公共服务平台 11城运大屏对接平台 12阿克苏市公交几圈有限责任公司平台 13贵州省对接平台 14金华政府平台 15青岛城运海汇德新能源科技有限公司平台 16武汉新能源平台 17温州政府平台 18城云科技(中国)有限公司平台 19枣庄对接平台 20安心充电平台 21成都市平台 22内蒙古监管平台 23辽宁省平台 24宜宾监管平台 25华航悦行平台 26星星平台 27博通平台 28百度地图平台 29资阳瑞雁环保能源科技有限公司平台 30浙江省能源局（一键找桩）平台 31大连金德姆电子有限公司平台 32海康平台 33（川逸充）成都城投能源投资管理集团有限公司平台 34城投对接平台 35中电鸿信信息科技有限公司平台 36航信平台 37城云科技-海宁平台 38山西省监管平台 39城运云快充对接平台 40成都市监管平台 41江苏新奥能源科技有限公司平台 42泸州市监管平台 43道合科技开发有限责任公司平台 44江西省统一充电运营服务平台 45威海热电平台 46过渡平台 47高德平台 48北京e充网平台 49畅游第三方充电平台 50慈溪市平台 51嘉善市平台 52极氪第三方充电平台 53济南静太交通平台 54快电平台 55湖南省监管平台 56辽宁高速积成电子平台 57鲁能第三方充电平台 58泸州市监管平台 59平谷第三方充电平台 60青岛市监管平台 61蔚景云第三方充电平 62小桔第三方充电平 63羊城充监管平台 64易购第三方充电平台 65银联第三方充电平台 66云快充第三方充电平台 67彩云冲（云南）监管平台 68张家口监管平台 69德兴监管平台 70甘肃监管平台 71粤易充（广东）监管平台 72广西省监管平台 73贵州省监管平台 74河南省监管平台 75吉林省监管平台 76山东省监管平台 77西安市监管平台 78阳泉市监管平台
charger_brand：设备品牌 0海汇德 1 科华 2宜充 3钜能 4盛弘 5金威源 6聚电 7聚能 8汇聚 9科士达 10爱普拉 11金钟默勒 12中科海奥 13晶福元 14中恒 15英飞源 16英可瑞 17奥耐 18锐速 19恩亿梯 20汇能 21驿联 22易事特 23国电南瑞 24科陆 25南京南瑞 26普瑞特 27泰坦 28奥特讯 29众业达 30嘉盛 31科大智能 32广州联航科 33晨泰 34新科大智能 35盛弘_V2 36旧科大智能 37英威腾 38驿普乐士 39合康智能 40星星 41万城万充 42特来电 43永联 255其他
third_validate_command：无注释
union_flag：无注释
union_ac_gun_count：无注释
union_dc_gun_count：无注释
union_gun_count：无注释
max_rate_item：支持的最大费率端 1（16段）2（48段）
single_gun_rate：是否支持单枪计费 0否 1是
send_list_switch：是否支持充电中下发名单
platform_calc：平台计费：0非平台计费1平台计费
vin_check：平台vin校验:0不校验1校验vin不校验账户2校验vin校验账户3校验名单vin不校验账户4校验名单vin校验账户
protocol_version：设备协议版本
support_code：是否支持二维码 0 不支持 1 支持
offline_notice_switch：无注释
startup_policy_sync_type：启动策略 同步状态 0未同步 1已同步 6同步失败
dispatch_policy_sync_type：功率策略 同步状态 0未同步 1已同步 6同步失败
parking_iot_id：无注释
unit_power_switch：功率单元数据上传开关 0关1开
rab_upload_switch：录播文件上传的开关 0:关闭  1：打开
update_version：远程升级主控版本
charging_update_balance_switch：充电中余额同步的开关 0:关闭  1：打开
create_user：创建人
role_level：创建权限等级
update_user：修改人
abnormal_check：0开启1关闭
bind_ems_id：绑定EMS系统id
bind_trans_power_id：绑定变配电系统id
power_limit_type：限制功率开关 0-限功率开关关闭；1-限制充电系统功率 2-限制充电枪功率
sync_status：0未同步1已同步
support_prepay_payscore：是否支持预付费和微信支付分支付 0不支持 1支持 海汇德设备默认支持 三方设备默认不支持
stop_code_status：0不开启停止码 1开启停止码
terminate_type：停止充电条件类型,0:充满 1:定电量 2:定额 3:定时 4:定soc,为null显示全部，支持多种使用,分割，例如0,1,2表示支持充满定电量定额
v2g_enable：是否支持v2g放电 0 不支持 1支持
is_smart_charger：是否开启智能充电 0不开启 1开启

```
  
表名：account  
表注释：账户信息表  
字段信息：  
```
account_id：账户 id
enterprise_id：无注释
operator_id：运营商 ID
type：是否是独立结算账户 0 否 1 是
name：账户名称
balance：余额
pay_balance：本金余额
present_balance：赠送余额
coupon_balance：优惠券抵现余额
points_balance：积分抵现余额
pledge_balance：押金金额
sharing_balance：分账金额
invest_activity_present_balance：充值活动赠送金额
prepay_balance：预付费余额
transit_amount：在途退款总金额
transit_pay_amount：在途退款本金金额
transit_present_amount：在途退款赠送金额
transit_coupon_amount：在途退款优惠券抵扣金额
transit_points_amount：在途退款积分抵扣金额
transit_pledge_amount：在途退款押金余额
transit_sharing_amount：在途退款分账金额
transit_invest_activity_present_amount：在途退款充值活动赠送金额
transit_prepay_amount：在途退款预付费余额
status：账户状态
threshold：余额通知阈值
create_user_id：创建人 id
append：备注
create_time：创建时间
update_time：更新时间

```
  
表名：account_journal  
表注释：账户流水表  
字段信息：  
```
journal_id：流水 id
bussiness_id：业务 id
operator_id：用户所属运营商 ID
device_operator_id：设备所属运营商
account_id：账户 id
user_id：用户 id
card_id：电卡 id
vehicle_id：无注释
report_time：发生时间
amount：充值扣款金额（充值取账单金额）
pay_amount：充值扣款本金金额
present_amount：充值扣款赠送金额
coupon_amount：充值扣款优惠券金额
points_amount：充值扣扣积分金额
pledge_amount：充值扣款押金金额
sharing_amount：充值扣款分账金额
prepay_amount：预付费余额
invest_activity_present_amount：充值活动赠送金额
invest_activity_id：参与充值活动 id
invest_activity_present_points：充值活动赠送积分
invest_activity_present_coupon_num：充值活动赠送优惠券数量
total_elec_cost：电费
total_service_cost：服务费
balance：余额
pay_balance：本金余额
present_balance：赠送余额
coupon_balance：优惠券余额
points_balance：积分余额
pledge_balance：押金余额
sharing_balance：分账余额
prepay_balance：预付费余额
invest_activity_present_blance：充值活动赠送余额
charge_coupon_amount：充电优惠券抵扣金额（仅充电扣费时的优惠金额）
discount_rate_type：折扣方式 -1 刷卡启动 0 车辆分组 1 场站折扣 2 场站满减 3 用户折扣（专属价） 4 贵宾折扣 5 会员等级折扣 6 会员日折扣 7 平台一次定价 8 场站活动一次定价
charge_point_amount：充电积分抵扣金额（仅充电扣费时的优惠金额）
type：收支类型 4 (退款)
source：消费来源
is_overdraw：是否欠费：不欠费：0, 欠费 1
append：备注
prepay_deposit_id：预付费时的充值 id（正常 3 条为一组，充值、充电、退款）
charge_pay_id：充电订单的拉起支付时 业务 id 已 -t 结尾
place_gun_order_journal_id：占桩费结算流水 id

```
  
表名：charge_orders  
表注释：充电订单记录表  
字段信息：  
```
order_id：充电订单 ID
charger_id：充电机编号
user_id：用户 ID
vehicle_id：车辆编号
vehicle_vin：车辆 VIN
card_id：卡编号
elec_discount：电费折扣率
service_discount：服务费折扣率
connect_time：连接时间
begin_time：开始充电时间
end_time：结束充电时间
charge_time：充电时长
startup_source：启动来源
terminate_reason：结束充电原因
terminate_type：结束充电类型
terminate_condition：结束充电条件
begin_soc：开始 SOC
end_soc：结束 SOC
max_single_voltage：最大单体电压
max_single_voltage_pos：最大单体电压所在编号
min_single_voltage：最小单体电压
max_temperature：最高温度
max_temperature_pos：最高温度检测点
min_temperature：最低温度
min_temperature_pos：最低温度检测点
total_energy_upload：总电量上传值
total_energy：总电量
total_elec_cost_upload：总电费上传值
total_elec_cost：总电费
total_service_cost_upload：总服务费上传值
total_service_cost：总服务费
total_cost_upload：总费用上传值
total_cost：总费用
total_discount_cost_upload：无注释
total_discount_cost：无注释
tip_energy_upload：尖电量上传值
tip_energy：尖电量
tip_elec_cost_upload：尖电费上传值
tip_elec_cost：尖电费
tip_service_cost_upload：尖服务费上传值
tip_service_cost：尖服务费
peak_energy_upload：峰电量上传值
peak_energy：峰电量
peak_elec_cost_upload：峰电费上传值
peak_elec_cost：峰电费
peak_service_cost_upload：峰服务费上传值
peak_service_cost：峰服务费
normal_energy_upload：平电量上传值
normal_energy：平电量
normal_elec_cost_upload：平电费上传值
normal_elec_cost：平电费
normal_service_cost_upload：平服务费上传值
normal_service_cost：平服务费
valley_energy_upload：谷电量上传值
valley_energy：谷电量
valley_elec_cost_upload：谷电费上传值
valley_elec_cost：谷电费
valley_service_cost_upload：谷服务费上传值
valley_service_cost：谷服务费
deep_valley_energy_upload：深谷电量上传值
deep_valley_energy：深谷电量值
deep_valley_elec_cost_upload：深谷电费上传值
deep_valley_elec_cost：深谷电费
deep_valley_service_cost_upload：深谷服务费上传值
deep_valley_service_cost：深谷服务费
elec_loss：电损比例
report_time：上报时间
status：是否已结算 0 否 1 是 微信支付分 10 否 11 是 余额延迟 20 否 21 是

```
