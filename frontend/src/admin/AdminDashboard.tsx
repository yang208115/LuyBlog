import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { adminApi } from "./adminApi";

const statConfig: Array<{
  key: keyof Awaited<ReturnType<typeof adminApi.stats>>;
  label: string;
  trend: string;
  icon: string;
  color: string;
}> = [
  { key: "posts", label: "文章", trend: "+12%", icon: "¶", color: "#6de4e0" },
  { key: "moments", label: "瞬间", trend: "+4", icon: "◌", color: "#ff8fae" },
  { key: "projects", label: "项目", trend: "+1", icon: "◇", color: "#a99cff" },
  { key: "pages", label: "页面", trend: "0", icon: "□", color: "#8ee7a8" },
  { key: "friendLinks", label: "友链", trend: "+2", icon: "∞", color: "#f5a7cf" },
  { key: "music", label: "音乐", trend: "+6", icon: "♫", color: "#79d8ff" },
  { key: "comments", label: "评论", trend: "+18%", icon: "⊙", color: "#8ca9ff" },
  { key: "users", label: "用户", trend: "+9%", icon: "♙", color: "#b8c2d8" },
];

const activity = [
  ["发布文章", "新的文章已经出现在前台", "12 分钟前", "¶"],
  ["收到评论", "有读者留下了新评论", "38 分钟前", "⊙"],
  ["更新瞬间", "记录了一条新的生活切片", "2 小时前", "◌"],
  ["友链申请", "一位新邻居等待审核", "昨天", "∞"],
];

const days = [
  ["周四", 42],
  ["周五", 58],
  ["周六", 36],
  ["周日", 74],
  ["周一", 62],
  ["周二", 88],
  ["今天", 68],
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: adminApi.stats });

  return (
    <>
      <section className="admin-welcome">
        <div>
          <span className="eyebrow">GOOD EVENING, YUNYANG</span>
          <h2>今晚也留下一点什么吧。</h2>
          <p>站点运行稳定，内容数据库与边缘节点已经就绪。可以从一篇文章或一条瞬间开始。</p>
        </div>
        <div className="quick-actions">
          <button type="button" onClick={() => navigate("/admin/posts/new")}>
            <b>＋</b>
            <span>
              写文章<small>打开 Markdown 编辑器</small>
            </span>
          </button>
          <button type="button">
            <b>◌</b>
            <span>
              发瞬间<small>记录此刻的想法</small>
            </span>
          </button>
          <a href="/admin#comments">
            <b>⊙</b>
            <span>
              审评论<small>查看等待处理的内容</small>
            </span>
          </a>
        </div>
      </section>

      {query.isLoading ? (
        <div className="empty-state">
          <div className="loader" />
          <strong>正在同步数据</strong>
        </div>
      ) : (
        <div className="stat-grid">
          {statConfig.map((item) => (
            <article className="stat-card" style={{ "--stat-color": item.color } as React.CSSProperties} key={item.key}>
              <div className="stat-card-top">
                <span className="stat-icon">{item.icon}</span>
                <span className="stat-trend">{item.trend}</span>
              </div>
              <strong>{(query.data?.[item.key] ?? 0).toLocaleString("zh-CN")}</strong>
              <small>{item.label}总数</small>
              <a href={`/admin#${item.key}`}>管理 {item.label} →</a>
            </article>
          ))}
        </div>
      )}

      <div className="dashboard-grid">
        <section className="admin-panel analytics-panel">
          <header>
            <div>
              <span className="eyebrow">TRAFFIC</span>
              <h2>近 7 天访问</h2>
            </div>
            <strong>
              8,642 <small>PV</small>
            </strong>
          </header>
          <div className="bar-chart" aria-label="近七天访问趋势">
            {days.map(([day, height], index) => (
              <div key={day}>
                <span
                  className={index === days.length - 1 ? "active" : undefined}
                  style={{ height: `${height}%` }}
                >
                  <i>{Math.round(Number(height) * 17.4)}</i>
                </span>
                <small>{day}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="admin-panel activity-panel">
          <header>
            <div>
              <span className="eyebrow">ACTIVITY</span>
              <h2>最近动态</h2>
            </div>
            <RouterLink to="/admin">查看全部 →</RouterLink>
          </header>
          <div className="activity-list">
            {activity.map(([type, text, time, icon]) => (
              <div key={`${type}-${time}`}>
                <span className="activity-icon">{icon}</span>
                <p>
                  <strong>{type}</strong>
                  {text}
                  <small>{time}</small>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="system-card">
        <div>
          <span className="eyebrow">SYSTEM STATUS</span>
          <h2>
            <i /> 工作台就绪
          </h2>
          <p>内容数据库、对象存储与边缘节点同步正常。所有管理操作将直接作用于站点真实数据。</p>
        </div>
        <div className="system-meta">
          <div>
            <span>VERSION</span>
            <strong>2.4.0</strong>
          </div>
          <div>
            <span>UPDATED</span>
            <strong>刚刚</strong>
          </div>
          <div>
            <span>DATABASE</span>
            <strong>D1 · HEALTHY</strong>
          </div>
          <div>
            <span>REGION</span>
            <strong>APAC</strong>
          </div>
        </div>
      </section>
    </>
  );
}
