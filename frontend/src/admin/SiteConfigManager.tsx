import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, joinLines, splitLines } from "./adminApi";
import { StateBlock } from "./AdminPrimitives";
import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from "../config/siteConfig";

type FormState = Omit<SiteConfig, "bgImages" | "footerBadges"> & {
  bgImagesText: string;
  footerBadgesText: string;
};

function toForm(config: SiteConfig): FormState {
  return {
    ...config,
    bgImagesText: joinLines(config.bgImages),
    footerBadgesText: JSON.stringify(config.footerBadges, null, 2),
  };
}

function fromForm(form: FormState): SiteConfig {
  let footerBadges: SiteConfig["footerBadges"] = [];
  try {
    const parsed = JSON.parse(form.footerBadgesText) as SiteConfig["footerBadges"];
    footerBadges = Array.isArray(parsed) ? parsed : [];
  } catch {
    footerBadges = [];
  }
  return normalizeSiteConfig({ ...form, bgImages: splitLines(form.bgImagesText), footerBadges });
}

function Section({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-card">
      <header><span>{index}</span><div><h2>{title}</h2><p>{description}</p></div></header>
      <div className="form-grid">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  full,
  help,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  help?: string;
}) {
  return (
    <label className={`field${full ? " full" : ""}`}>
      <span>{label}</span>
      {children}
      {help && <small className="field-help">{help}</small>}
    </label>
  );
}

export function SiteConfigManager() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "site-config"], queryFn: adminApi.siteConfig });
  const [form, setForm] = useState<FormState>(() => toForm(defaultSiteConfig));
  const [footerBadgesError, setFooterBadgesError] = useState("");

  useEffect(() => {
    if (query.data) setForm(toForm(query.data));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: adminApi.updateSiteConfig,
    onSuccess: async (data) => {
      setForm(toForm(data));
      await queryClient.invalidateQueries({ queryKey: ["admin", "site-config"] });
    },
  });

  const canSave = useMemo(() => Boolean(form.title.trim() && form.authorName.trim()), [form]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateSocial = (key: keyof SiteConfig["social"], value: string) =>
    setForm((current) => ({ ...current, social: { ...current.social, [key]: value } }));

  const save = () => {
    try {
      const payload = fromForm(form);
      if (!payload.footerBadges.length && form.footerBadgesText.trim() !== "[]") JSON.parse(form.footerBadgesText);
      setFooterBadgesError("");
      mutation.mutate(payload);
    } catch {
      setFooterBadgesError("页脚徽章必须是合法 JSON 数组");
    }
  };

  const error = query.error || mutation.error;
  return (
    <>
      <div className="config-intro">
        <div className="config-preview">
          <span className="admin-brand-mark">{form.authorName.slice(0, 1) || "运"}</span>
          <p><strong>{form.navTitle} <i>{form.navSuffix}</i> {form.navAfter}</strong><small>{form.bio}</small></p>
        </div>
        <p>修改内容会影响前台展示。API 密钥等敏感配置在保存后不会再次明文显示。</p>
      </div>
      <StateBlock loading={query.isLoading} />
      {error && <div className="admin-state-block error">{error instanceof Error ? error.message : "加载失败"}</div>}
      {mutation.isSuccess && <div className="admin-state-block success">站点配置已保存，前台刷新后生效。</div>}
      <div className="config-save-row">
        <button className="button primary" type="button" disabled={!canSave || mutation.isPending} onClick={save}>✓ 保存配置</button>
      </div>

      <form className="form-stack" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <Section index="01" title="基础信息" description="站点名称、作者身份和公共简介。">
          <Field label="站点标题"><input value={form.title} onChange={(e) => update("title", e.target.value)} /></Field>
          <Field label="Favicon URL"><input value={form.faviconUrl} onChange={(e) => update("faviconUrl", e.target.value)} /></Field>
          <Field label="作者名称"><input value={form.authorName} onChange={(e) => update("authorName", e.target.value)} /></Field>
          <Field label="头像 URL"><input value={form.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)} /></Field>
          <Field label="简介" full><textarea rows={3} value={form.bio} onChange={(e) => update("bio", e.target.value)} /></Field>
        </Section>

        <Section index="02" title="导航品牌与外观" description="控制顶部品牌组合和前台背景图片。">
          <Field label="导航前缀"><input value={form.navTitle} onChange={(e) => update("navTitle", e.target.value)} /></Field>
          <Field label="连接符"><input value={form.navSuffix} onChange={(e) => update("navSuffix", e.target.value)} /></Field>
          <Field label="导航后缀"><input value={form.navAfter} onChange={(e) => update("navAfter", e.target.value)} /></Field>
          <Field label="背景图片 URL（一行一个）" full><textarea rows={4} value={form.bgImagesText} onChange={(e) => update("bgImagesText", e.target.value)} /></Field>
          <Field label="默认文章封面 URL" full><input value={form.defaultPostCover} onChange={(e) => update("defaultPostCover", e.target.value)} /></Field>
        </Section>

        <Section index="03" title="社交链接" description="留空的项目不会在前台显示。">
          <Field label="GitHub"><input value={form.social.github} onChange={(e) => updateSocial("github", e.target.value)} /></Field>
          <Field label="Demo"><input value={form.social.demo} onChange={(e) => updateSocial("demo", e.target.value)} /></Field>
          <Field label="Gitee"><input value={form.social.gitee} onChange={(e) => updateSocial("gitee", e.target.value)} /></Field>
          <Field label="Google"><input value={form.social.google} onChange={(e) => updateSocial("google", e.target.value)} /></Field>
          <Field label="邮箱"><input type="email" value={form.social.email} onChange={(e) => updateSocial("email", e.target.value)} /></Field>
          <Field label="QQ"><input value={form.social.qq} onChange={(e) => updateSocial("qq", e.target.value)} /></Field>
          <Field label="微信"><input value={form.social.wechat} onChange={(e) => updateSocial("wechat", e.target.value)} /></Field>
        </Section>

        <Section index="04" title="功能配置" description="建站时间与页脚徽章数据。">
          <Field label="建站时间"><input value={form.buildDate} onChange={(e) => update("buildDate", e.target.value)} /></Field>
          <Field label="页脚徽章 JSON" full help={footerBadgesError || "请输入合法 JSON 数组，保存前会进行格式检查。"}>
            <textarea rows={5} value={form.footerBadgesText} onChange={(e) => update("footerBadgesText", e.target.value)} />
          </Field>
        </Section>

        <Section index="05" title="AI 配置" description="用于文章编辑器内的写作助手。">
          <Field label="API Key" help="仅在服务端加密保存。"><input type="password" value={form.aiConfig.apiKey} onChange={(e) => update("aiConfig", { ...form.aiConfig, apiKey: e.target.value })} /></Field>
          <Field label="Base URL"><input value={form.aiConfig.baseUrl} onChange={(e) => update("aiConfig", { ...form.aiConfig, baseUrl: e.target.value })} /></Field>
          <Field label="模型"><input value={form.aiConfig.model} onChange={(e) => update("aiConfig", { ...form.aiConfig, model: e.target.value })} /></Field>
          <Field label="Max Tokens"><input type="number" value={form.aiConfig.maxTokens} onChange={(e) => update("aiConfig", { ...form.aiConfig, maxTokens: Number(e.target.value) })} /></Field>
          <Field label="Temperature"><input type="number" step="0.1" value={form.aiConfig.temperature} onChange={(e) => update("aiConfig", { ...form.aiConfig, temperature: Number(e.target.value) })} /></Field>
          <Field label="系统提示词" full><textarea rows={5} value={form.aiConfig.systemPrompt} onChange={(e) => update("aiConfig", { ...form.aiConfig, systemPrompt: e.target.value })} /></Field>
        </Section>

        <Section index="06" title="备案与友链申请" description="配置页脚备案信息和前台申请说明。">
          <Field label="备案信息">
            <select value={form.icpConfig ? "enabled" : "disabled"} onChange={(e) => update("icpConfig", e.target.value === "enabled" ? { name: "", link: "" } : null)}>
              <option value="disabled">不显示</option><option value="enabled">显示</option>
            </select>
          </Field>
          {form.icpConfig && <>
            <Field label="备案名称"><input value={form.icpConfig.name} onChange={(e) => update("icpConfig", { ...form.icpConfig!, name: e.target.value })} /></Field>
            <Field label="备案链接" full><input value={form.icpConfig.link} onChange={(e) => update("icpConfig", { ...form.icpConfig!, link: e.target.value })} /></Field>
          </>}
          <Field label="友链申请格式" full><textarea rows={6} value={form.friendLinkApplyFormat} onChange={(e) => update("friendLinkApplyFormat", e.target.value)} /></Field>
        </Section>
      </form>
    </>
  );
}
