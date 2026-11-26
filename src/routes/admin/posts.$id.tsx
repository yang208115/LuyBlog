import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Eye, Link2, Save, Sparkles } from "lucide-react";
import {
  type ClipboardEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ImageUploadButton, uploadFileToR2 } from "@/components/admin/ImageUploader";
import {
  buildScrollAnchors,
  extractMarkdownHeadingRatios,
  mapScrollPosition,
} from "@/components/admin/scrollSync";
import { joinLines, normalizeSlugInput, splitTags } from "@/components/admin/utils";
import { ArticleHtml } from "@/components/public/ArticleHtml";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import {
  createPostFn,
  getAdminPostByIdFn,
  getPostTaxonomyFn,
  previewMarkdownFn,
  updatePostFn,
} from "@/server/functions/admin";

type EditorForm = {
  title: string;
  slug: string;
  summary: string;
  cover: string;
  category: string;
  tagsText: string;
  contentMd: string;
  status: "draft" | "published";
};

const emptyForm: EditorForm = {
  title: "",
  slug: "",
  summary: "",
  cover: "",
  category: "",
  tagsText: "",
  contentMd: "",
  status: "draft",
};

export const Route = createFileRoute("/admin/posts/$id")({
  loader: async ({ params }) => {
    const [taxonomy, post] = await Promise.all([
      getPostTaxonomyFn(),
      params.id === "new" ? Promise.resolve(null) : getAdminPostByIdFn({ data: { id: params.id } }),
    ]);
    return { taxonomy, post, isNew: params.id === "new" };
  },
  component: AdminPostEditorPage,
});

function AdminPostEditorPage() {
  const { taxonomy, post, isNew } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const { toast } = useToast();

  const createPost = useServerFn(createPostFn);
  const updatePost = useServerFn(updatePostFn);
  const previewMarkdown = useServerFn(previewMarkdownFn);

  const initialForm: EditorForm = useMemo(
    () =>
      post
        ? {
            title: post.title,
            slug: post.slug,
            summary: post.summary ?? "",
            cover: post.cover ?? "",
            category: post.category ?? "",
            tagsText: joinLines(post.tags),
            contentMd: post.contentMd,
            status: post.status,
          }
        : emptyForm,
    [post],
  );

  const [form, setForm] = useState<EditorForm>(initialForm);
  const [tab, setTab] = useState<"split" | "edit" | "preview">("split");
  const [syncScroll, setSyncScroll] = useState(true);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const hasPreviewRef = useRef(false);
  const scrollLockRef = useRef<{ pane: "editor" | "preview" | null; timer: number | null }>({
    pane: null,
    timer: null,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    void previewReloadKey;
    if (tab === "edit") return;
    if (!form.contentMd.trim()) {
      hasPreviewRef.current = false;
      setPreviewHtml("");
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const delay = hasPreviewRef.current ? 280 : 80;
    setPreviewLoading(true);
    setPreviewError(null);

    const timer = window.setTimeout(() => {
      void previewMarkdown({ data: { contentMd: form.contentMd } })
        .then((res) => {
          if (cancelled) return;
          hasPreviewRef.current = true;
          setPreviewHtml(res.html);
          setPreviewError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setPreviewError(err instanceof Error ? err.message : "预览渲染失败");
        })
        .finally(() => {
          if (cancelled) return;
          setPreviewLoading(false);
        });
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.contentMd, previewMarkdown, previewReloadKey, tab]);

  useEffect(() => {
    return () => {
      if (scrollLockRef.current.timer !== null) {
        window.clearTimeout(scrollLockRef.current.timer);
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const computeAnchors = useCallback(
    (editorEl: HTMLTextAreaElement, previewEl: HTMLDivElement) => {
      const charsPerLine = Math.max(20, Math.floor((editorEl.clientWidth - 40) / 8.4));
      const headingRatios = extractMarkdownHeadingRatios(form.contentMd, charsPerLine);
      const previewRect = previewEl.getBoundingClientRect();
      const previewHeadings = Array.from(previewEl.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((el) => ({
        text: el.textContent ?? "",
        top: el.getBoundingClientRect().top - previewRect.top + previewEl.scrollTop,
      }));
      return buildScrollAnchors({
        headingRatios,
        previewHeadings,
        editorScrollHeight: editorEl.scrollHeight,
        editorMaxScroll: Math.max(0, editorEl.scrollHeight - editorEl.clientHeight),
        previewMaxScroll: Math.max(0, previewEl.scrollHeight - previewEl.clientHeight),
      });
    },
    [form.contentMd],
  );

  const claimScrollPane = useCallback((pane: "editor" | "preview") => {
    if (scrollLockRef.current.pane && scrollLockRef.current.pane !== pane) {
      if (scrollLockRef.current.timer !== null) {
        window.clearTimeout(scrollLockRef.current.timer);
        scrollLockRef.current.timer = null;
      }
      scrollLockRef.current.pane = null;
    }
  }, []);

  const syncFrom = useCallback(
    (source: "editor" | "preview") => {
      if (!syncScroll || tab !== "split") return;
      if (scrollLockRef.current.pane && scrollLockRef.current.pane !== source) return;
      if (!textareaRef.current || !previewRef.current) return;

      scrollLockRef.current.pane = source;
      if (scrollLockRef.current.timer !== null) {
        window.clearTimeout(scrollLockRef.current.timer);
      }
      scrollLockRef.current.timer = window.setTimeout(() => {
        scrollLockRef.current.pane = null;
        scrollLockRef.current.timer = null;
      }, 120);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const currentEditor = textareaRef.current;
        const currentPreview = previewRef.current;
        if (!currentEditor || !currentPreview) return;
        const anchors = computeAnchors(currentEditor, currentPreview);
        if (source === "editor") {
          currentPreview.scrollTop = mapScrollPosition(anchors, currentEditor.scrollTop, "editorToPreview");
        } else {
          currentEditor.scrollTop = mapScrollPosition(anchors, currentPreview.scrollTop, "previewToEditor");
        }
      });
    },
    [computeAnchors, syncScroll, tab],
  );

  useEffect(() => {
    if (!previewHtml || !syncScroll || tab !== "split") return;
    const editorEl = textareaRef.current;
    if (!editorEl || editorEl.scrollTop <= 0) return;
    if (scrollLockRef.current.pane && scrollLockRef.current.pane !== "editor") return;
    const id = window.requestAnimationFrame(() => {
      syncFrom("editor");
    });
    return () => window.cancelAnimationFrame(id);
  }, [previewHtml, syncFrom, syncScroll, tab]);

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    if (!el) {
      setForm((f) => ({ ...f, contentMd: `${f.contentMd}\n${snippet}` }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = `${form.contentMd.slice(0, start)}${snippet}${form.contentMd.slice(end)}`;
    setForm((f) => ({ ...f, contentMd: next }));
    window.requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleImageFiles = async (files: FileList | File[]) => {
    const imageFile = Array.from(files).find((file) => file.type.startsWith("image/"));
    if (!imageFile) return;
    try {
      const uploaded = await uploadFileToR2(imageFile);
      insertAtCursor(`\n![${uploaded.filename}](${uploaded.url})\n`);
      toast("图片已上传并插入正文", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "上传失败", "error");
    }
  };

  const handleDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    if (e.dataTransfer.files.length === 0) return;
    e.preventDefault();
    void handleImageFiles(e.dataTransfer.files);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (!files || files.length === 0) return;
    const hasImage = Array.from(files).some((file) => file.type.startsWith("image/"));
    if (!hasImage) return;
    e.preventDefault();
    void handleImageFiles(files);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim() || !form.contentMd.trim()) {
      toast("请填写标题、Slug 和正文", "error");
      return;
    }
    setSaving(true);
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      summary: form.summary.trim() || null,
      cover: form.cover.trim() || null,
      category: form.category.trim() || null,
      tags: splitTags(form.tagsText),
      contentMd: form.contentMd,
      status: form.status,
    };

    try {
      if (isNew) {
        const created = await createPost({ data: body });
        toast("文章已创建", "success");
        await navigate({ to: "/admin/posts/$id", params: { id: created.id } });
      } else if (post) {
        await updatePost({ data: { id: post.id, ...body } });
        toast("文章已保存", "success");
        await router.invalidate();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            search={{ page: 1, status: "all" }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--ink)]">{isNew ? "新建文章" : "编辑文章"}</h1>
            <p className="font-mono text-xs text-[var(--muted)]">{dirty ? "有未保存修改" : "已同步"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "draft" | "published" }))}
            className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
          >
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
          </select>

          {!isNew && post?.status === "published" && (
            <Link
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--ink)]"
            >
              <Eye className="h-3.5 w-3.5" />
              预览线上
            </Link>
          )}

          <Button type="button" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存文章"}
          </Button>
        </div>
      </header>

      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">文章标题</span>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="输入文章标题"
          />
        </label>

        <div className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">Slug（小写字母、数字、连字符）</span>
          <div className="flex gap-2">
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="my-awesome-post"
              className="font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setForm((f) => ({ ...f, slug: normalizeSlugInput(f.title) || `post-${Date.now()}` }))
              }
              title="从标题生成 Slug"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">分类</span>
          <Input
            list="post-category-list"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="例如：工程札记"
          />
          <datalist id="post-category-list">
            {taxonomy.categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </label>

        <div className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">封面 URL</span>
          <div className="flex gap-2">
            <Input
              value={form.cover}
              onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
              placeholder="/api/media/... 或 https://..."
            />
            <ImageUploadButton
              label="上传封面"
              onUploaded={(media) => setForm((f) => ({ ...f, cover: media.url }))}
              className="h-9 shrink-0"
            />
          </div>
        </div>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">标签（每行或逗号分隔）</span>
          <Input
            value={form.tagsText}
            onChange={(e) => setForm((f) => ({ ...f, tagsText: e.target.value }))}
            placeholder="Cloudflare, TypeScript"
          />
          {taxonomy.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {taxonomy.tags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = splitTags(form.tagsText);
                    if (!current.includes(tag)) {
                      setForm((f) => ({ ...f, tagsText: [...current, tag].join(", ") }));
                    }
                  }}
                >
                  <Badge tone="neutral">+{tag}</Badge>
                </button>
              ))}
            </div>
          )}
        </label>

        <label className="space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">摘要</span>
          <Textarea
            rows={2}
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            placeholder="可选，用于首页与列表卡片简介"
          />
        </label>
      </Card>

      {/* Markdown 编辑器与实时预览 */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5">
          <div className="flex items-center gap-1">
            {(
              [
                ["split", "分栏"],
                ["edit", "纯编辑"],
                ["preview", "纯预览"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium ${
                  tab === key
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {label}
              </button>
            ))}
            {tab === "split" && (
              <button
                type="button"
                onClick={() => setSyncScroll((v) => !v)}
                aria-pressed={syncScroll}
                title={syncScroll ? "关闭左右同步滚动" : "开启左右同步滚动"}
                className={`ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  syncScroll
                    ? "border-[var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                同步滚动
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[var(--muted)] sm:inline">
              支持拖拽或粘贴图片直接上传 R2
            </span>
            <ImageUploadButton
              label="插入图片"
              onUploaded={(media) => insertAtCursor(`\n![${media.filename}](${media.url})\n`)}
            />
          </div>
        </div>

        <div
          className={
            tab === "split"
              ? "grid min-h-[540px] lg:grid-cols-2 lg:divide-x lg:divide-[var(--border)]"
              : "min-h-[540px]"
          }
        >
          {tab !== "preview" && (
            <textarea
              ref={textareaRef}
              value={form.contentMd}
              onChange={(e) => setForm((f) => ({ ...f, contentMd: e.target.value }))}
              onDrop={handleDrop}
              onPaste={handlePaste}
              onScroll={() => syncFrom("editor")}
              onWheel={() => claimScrollPane("editor")}
              onPointerDown={() => claimScrollPane("editor")}
              onTouchStart={() => claimScrollPane("editor")}
              placeholder="# 开始写作 Markdown…"
              className={`w-full bg-[var(--surface)] p-5 font-mono text-sm leading-relaxed text-[var(--ink)] focus:outline-none ${
                tab === "split"
                  ? "h-[68vh] min-h-[540px] max-h-[760px] resize-none overflow-y-auto"
                  : "h-full min-h-[540px] resize-y"
              }`}
            />
          )}
          {tab !== "edit" && (
            <div
              ref={previewRef}
              onScroll={() => syncFrom("preview")}
              onWheel={() => claimScrollPane("preview")}
              onPointerDown={() => claimScrollPane("preview")}
              onTouchStart={() => claimScrollPane("preview")}
              className={`relative overflow-y-auto bg-[var(--surface)] p-6 ${
                tab === "split" ? "h-[68vh] min-h-[540px] max-h-[760px]" : "min-h-[540px] max-h-[760px]"
              }`}
            >
              {previewError && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
                  <span>预览加载失败：{previewError}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPreviewReloadKey((k) => k + 1)}
                  >
                    重试预览
                  </Button>
                </div>
              )}
              {previewHtml ? (
                <>
                  {previewLoading && (
                    <span className="mb-3 inline-block rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">
                      同步预览中…
                    </span>
                  )}
                  <ArticleHtml html={previewHtml} />
                </>
              ) : previewLoading ? (
                <p className="text-sm text-[var(--muted)]">正在渲染预览…</p>
              ) : !previewError ? (
                <p className="text-sm text-[var(--muted)]">输入 Markdown 后这里会展示服务端同款高亮预览…</p>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
