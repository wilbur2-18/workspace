import { useMemo, useState } from "react";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  DownOutlined,
  FileTextOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import focusBackground from "./assets/ai-service-focus.png";

const navItems = [
  "首页",
  "会议纪要",
  "复核审理",
  "问题清单",
  "审计知识助手开发平台",
  "数据综合分析平台",
  "更多",
];

const filters = ["全部", "平台", "智能体"];

const services = [
  {
    title: "审计知识助手开发平台",
    description: "文书规范撰写，资料精准梳理，经验沉淀复用",
    type: "平台",
    accent: "neutral",
    icon: AuditOutlined,
  },
  {
    title: "数据综合分析平台",
    description: "文档智能处理，多源融合分析，审计技能沉淀",
    type: "平台",
    accent: "blue",
    icon: DatabaseOutlined,
  },
  {
    title: "会议纪要",
    description: "会议纪要智能体 只支持会议纪要格式文档的解析和抽取，不支持解析上会材料等",
    type: "智能体",
    accent: "gray",
    icon: FileTextOutlined,
  },
  {
    title: "复核审理",
    description: "复核审理智能体可智能审查审计报告，自动排查内容漏洞、识别错误问题并精准标注，同...",
    type: "智能体",
    accent: "blue",
    icon: ApartmentOutlined,
  },
  {
    title: "问题清单",
    description: "问题清单智能体能够自动提取、汇总审计报告中的各类问题，一键梳理整合为规范结构化...",
    type: "智能体",
    accent: "orange",
    icon: CheckSquareOutlined,
  },
];

export function App() {
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");

  const visibleServices = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesFilter =
        activeFilter === "全部" ||
        service.type === activeFilter;
      const matchesQuery =
        !keyword ||
        service.title.toLowerCase().includes(keyword) ||
        service.description.toLowerCase().includes(keyword);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳至主要内容</a>
      <header className="top-nav">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">浙</div>
          <span>浙江人工智能综合服务平台</span>
        </div>
        <nav className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <button className={item === "首页" ? "nav-item active" : "nav-item"} key={item}>
              <span>{item}</span>
              {item === "更多" && <DownOutlined className="down-icon" />}
            </button>
          ))}
        </nav>
        <div className="user-area">
          <span className="user-avatar"><UserOutlined /></span>
          <span>hujie</span>
          <DownOutlined className="down-icon" />
        </div>
      </header>

      <main className="page" id="main-content">
        <section className="hero-panel" aria-labelledby="welcome-title">
          <img className="hero-visual" src={focusBackground} alt="" aria-hidden="true" />
          <div className="hero-copy">
            <h1 id="welcome-title">欢迎使用浙江人工智能综合服务平台</h1>
            <p>
              聚合人工智能能力，赋能审计业务全流程。
            </p>
          </div>
        </section>

        <section className="directory" aria-label="服务目录">
          <div className="directory-toolbar">
            <div className="tabs" role="tablist" aria-label="服务类型">
              {filters.map((filter) => (
                <button
                  className={filter === activeFilter ? "tab active" : "tab"}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  role="tab"
                  aria-selected={filter === activeFilter}
                >
                  {filter}
                </button>
              ))}
            </div>

            <label className="search-box">
              <SearchOutlined />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索平台或智能体"
                type="search"
              />
            </label>
          </div>

          <div className="service-grid">
            {visibleServices.map((service) => {
              const Icon = service.icon;

              return (
                <button
                  className="service-card"
                  key={service.title}
                >
                  <div className="card-main">
                    <span className={`service-icon ${service.accent}`}>
                      <Icon />
                    </span>
                    <div className="card-copy">
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className={`service-type ${service.accent === "orange" ? "warm" : ""}`}>
                      {service.type}
                    </span>
                    <ArrowRightOutlined />
                  </div>
                </button>
              );
            })}
          </div>

          {visibleServices.length === 0 && (
            <div className="empty-state">
              <AppstoreOutlined />
              <p>未找到匹配的服务，请调整分类或搜索关键词。</p>
            </div>
          )}

          <div className="page-footer">
            <div className="trust-line">
              <span className="shield">✓</span>
              <span>安全合规</span>
              <span>·</span>
              <span>数据保密</span>
              <span>·</span>
              <span>权限可控</span>
            </div>
            <button className="all-services" onClick={() => { setActiveFilter("全部"); setQuery(""); }}>
              查看全部服务
              <ArrowRightOutlined />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
