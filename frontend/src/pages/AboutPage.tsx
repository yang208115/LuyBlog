import { useQuery } from "@tanstack/react-query";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi } from "../services/content";

const fallbackAbout = `## 你好，我是运阳 👋

人生苦短，我用 Python。

我是一名喜欢折腾新技术的开发者。这里是我的数字小窝，用来记录项目、代码、音乐，以及生活里偶尔闪光的瞬间。

> 清晰比聪明重要，完成比完美重要，而工具最终应该把人的注意力还给人。

## 正在做的事

- 维护 AI 与效率工具相关的开源项目
- 学习如何把复杂系统解释得更简单
- 持续整理这个小窝里的文章和瞬间

## 喜欢的东西

Python、Linux、二次元、音乐，还有下雨时窗外安静的城市灯光。`;

export function AboutPage() {
  const query = useQuery({ queryKey: ["page", "about"], queryFn: () => contentApi.page("about") });

  return (
    <div className="page-shell reading markdown-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ABOUT / 关于</span>
          <h1>关于</h1>
        </div>
      </header>
      <article className="article-body markdown-page-card">
        {query.isLoading ? <div className="loader" /> : <MarkdownView content={query.data?.contentMd || fallbackAbout} />}
      </article>
    </div>
  );
}
