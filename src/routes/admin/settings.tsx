import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { ImageUploadButton } from "@/components/admin/ImageUploader";
import { Button, Card, Input, Textarea } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { getAdminSiteConfigFn, rebuildSearchIndexFn, updateSiteConfigFn } from "@/server/functions/admin";
import type { SiteConfig } from "@/shared/siteConfig";

type KeyedFooterBadge = SiteConfig["footerBadges"][number] & { _key: string };

export const Route = createFileRoute("/admin/settings")({
  loader: () => getAdminSiteConfigFn(),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const loaded = Route.useLoaderData();
  const router = useRouter();
  const { toast } = useToast();
  const updateConfig = useServerFn(updateSiteConfigFn);
  const rebuildIndex = useServerFn(rebuildSearchIndexFn);

  const badgeSeq = useRef(0);
  const nextBadgeKey = () => {
    badgeSeq.current += 1;
    return `badge-${badgeSeq.current}`;
  };
  const withBadgeKeys = (badges: SiteConfig["footerBadges"]): KeyedFooterBadge[] =>
    badges.map((badge) => ({ ...badge, _key: nextBadgeKey() }));

  const [form, setForm] = useState<SiteConfig>(loaded);
  const [badges, setBadges] = useState<KeyedFooterBadge[]>(() => withBadgeKeys(loaded.footerBadges));
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  useEffect(() => {
    setForm(loaded);
    setBadges(
      loaded.footerBadges.map((badge) => {
        badgeSeq.current += 1;
        return { ...badge, _key: `badge-${badgeSeq.current}` };
      }),
    );
  }, [loaded]);

  const updateSocial = (key: keyof SiteConfig["social"], value: string) => {
    setForm((current) => ({ ...current, social: { ...current.social, [key]: value } }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: SiteConfig = {
        ...form,
        footerBadges: badges.map(({ _key, ...rest }) => rest),
      };
      await updateConfig({ data: payload });
      toast("站点配置已保存", "success");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "保存失败，请检查输入", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRebuildSearch = async () => {
    setRebuilding(true);
    try {
      const res = await rebuildIndex();
      toast(`搜索索引重建完成，共索引 ${res.indexed} 条记录`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "重建失败", "error");
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <p className="font-mono text-xs tracking-wider text-[var(--accent)] uppercase">SITE SETTINGS</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--ink)]">站点配置</h1>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            修改站点文案、视觉资源、社交链接、页脚徽章及索引维护。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleRebuildSearch} disabled={rebuilding}>
            <RefreshCw className={`h-4 w-4 ${rebuilding ? "animate-spin" : ""}`} />
            {rebuilding ? "重建中…" : "重建全站搜索索引"}
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "保存中…" : "保存配置"}
          </Button>
        </div>
      </header>

      <Card className="space-y-4 p-6">
        <h2 className="text-base font-semibold text-[var(--ink)]">01 · 基础信息</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">站点标题</span>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">副标题</span>
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">作者名称</span>
            <Input
              required
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">建站日期（ISO 格式）</span>
            <Input
              required
              value={form.buildDate}
              onChange={(e) => setForm({ ...form, buildDate: e.target.value })}
            />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">个人简介</span>
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-base font-semibold text-[var(--ink)]">02 · 品牌与视觉资源</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">导航前缀</span>
            <Input value={form.navTitle} onChange={(e) => setForm({ ...form, navTitle: e.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">连接符</span>
            <Input value={form.navSuffix} onChange={(e) => setForm({ ...form, navSuffix: e.target.value })} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">导航后缀</span>
            <Input value={form.navAfter} onChange={(e) => setForm({ ...form, navAfter: e.target.value })} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">站长头像 URL</span>
              <ImageUploadButton
                label="上传头像"
                onUploaded={(m) => setForm({ ...form, avatarUrl: m.url })}
              />
            </div>
            <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">首页精选插画 URL（留空则纯排版）</span>
              <ImageUploadButton
                label="上传插画"
                onUploaded={(m) => setForm({ ...form, heroImage: m.url })}
              />
            </div>
            <Input value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} />
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">Favicon URL</span>
              <ImageUploadButton
                label="上传图标"
                onUploaded={(m) => setForm({ ...form, faviconUrl: m.url })}
              />
            </div>
            <Input
              value={form.faviconUrl}
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--ink)]">默认文章封面 URL</span>
              <ImageUploadButton
                label="上传封面"
                onUploaded={(m) => setForm({ ...form, defaultPostCover: m.url })}
              />
            </div>
            <Input
              value={form.defaultPostCover}
              onChange={(e) => setForm({ ...form, defaultPostCover: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-base font-semibold text-[var(--ink)]">
          03 · 社交链接（留空不显示，非空全量渲染）
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">GitHub</span>
            <Input value={form.social.github} onChange={(e) => updateSocial("github", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">Demo 站点</span>
            <Input value={form.social.demo} onChange={(e) => updateSocial("demo", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">Gitee</span>
            <Input value={form.social.gitee} onChange={(e) => updateSocial("gitee", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">Google</span>
            <Input value={form.social.google} onChange={(e) => updateSocial("google", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">邮箱</span>
            <Input
              type="email"
              value={form.social.email}
              onChange={(e) => updateSocial("email", e.target.value)}
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">QQ</span>
            <Input value={form.social.qq} onChange={(e) => updateSocial("qq", e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">微信</span>
            <Input value={form.social.wechat} onChange={(e) => updateSocial("wechat", e.target.value)} />
          </label>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">04 · 页脚技术徽章</h2>
            <p className="text-xs text-[var(--muted)]">可视化增删，告别手写 JSON。</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setBadges((prev) => [...prev, { name: "New Badge", color: "indigo", _key: nextBadgeKey() }])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            添加徽章
          </Button>
        </div>

        <div className="space-y-2.5">
          {badges.map((badge) => (
            <div key={badge._key} className="flex flex-wrap items-center gap-2">
              <Input
                value={badge.name}
                onChange={(e) =>
                  setBadges((prev) =>
                    prev.map((b) => (b._key === badge._key ? { ...b, name: e.target.value } : b)),
                  )
                }
                placeholder="徽章名称"
                className="max-w-xs"
              />
              <select
                value={badge.color}
                onChange={(e) =>
                  setBadges((prev) =>
                    prev.map((b) => (b._key === badge._key ? { ...b, color: e.target.value } : b)),
                  )
                }
                className="h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
              >
                <option value="indigo">星海靛 (indigo)</option>
                <option value="pink">樱雾粉 (pink)</option>
                <option value="amber">琥珀橙 (amber)</option>
                <option value="emerald">翡翠绿 (emerald)</option>
                <option value="cyan">晴空蓝 (cyan)</option>
              </select>
              <button
                type="button"
                onClick={() => setBadges((prev) => prev.filter((b) => b._key !== badge._key))}
                className="rounded-lg p-2 text-rose-500 hover:bg-rose-500/10"
                aria-label="移除徽章"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-base font-semibold text-[var(--ink)]">05 · 备案与友链交换格式</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--ink)]">ICP 备案显示</span>
            <select
              value={form.icpConfig ? "enabled" : "disabled"}
              onChange={(e) =>
                setForm({
                  ...form,
                  icpConfig:
                    e.target.value === "enabled" ? { name: "", link: "https://beian.miit.gov.cn/" } : null,
                })
              }
              className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
            >
              <option value="disabled">不显示</option>
              <option value="enabled">显示</option>
            </select>
          </label>
          {form.icpConfig && (
            <>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[var(--ink)]">备案号</span>
                <Input
                  required
                  value={form.icpConfig.name}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      icpConfig: c.icpConfig ? { ...c.icpConfig, name: e.target.value } : null,
                    }))
                  }
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-[var(--ink)]">备案链接</span>
                <Input
                  required
                  type="url"
                  value={form.icpConfig.link}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      icpConfig: c.icpConfig ? { ...c.icpConfig, link: e.target.value } : null,
                    }))
                  }
                />
              </label>
            </>
          )}
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-[var(--ink)]">友链页面展示的本站申请模板</span>
          <Textarea
            rows={4}
            value={form.friendLinkApplyFormat}
            onChange={(e) => setForm({ ...form, friendLinkApplyFormat: e.target.value })}
          />
        </label>
      </Card>
    </form>
  );
}
