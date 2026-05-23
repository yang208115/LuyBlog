import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { SaveRounded } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, joinLines, splitLines } from "./adminApi";
import { StateBlock } from "./AdminPrimitives";
import { defaultSiteConfig, normalizeSiteConfig, SiteConfig } from "../config/siteConfig";
import { glassCardSx } from "../components/Glass";

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

  return normalizeSiteConfig({
    ...form,
    bgImages: splitLines(form.bgImagesText),
    footerBadges,
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        {title}
      </Typography>
      <Stack spacing={2}>{children}</Stack>
    </Paper>
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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateSocial = (key: keyof SiteConfig["social"], value: string) => setForm((current) => ({ ...current, social: { ...current.social, [key]: value } }));

  const save = () => {
    try {
      const payload = fromForm(form);
      if (!payload.footerBadges.length && form.footerBadgesText.trim() !== "[]") {
        JSON.parse(form.footerBadgesText);
      }
      setFooterBadgesError("");
      mutation.mutate(payload);
    } catch {
      setFooterBadgesError("页脚徽章必须是 JSON 数组，例如 [{\"name\":\"Hono\",\"color\":\"text-orange-500\"}]");
    }
  };

  const error = query.error || mutation.error;

  return (
    <Stack spacing={2}>
      <StateBlock loading={query.isLoading} />
      {error && <Alert severity="error">{error instanceof Error ? error.message : "加载失败"}</Alert>}
      {mutation.isSuccess && <Alert severity="success">站点配置已保存，前台刷新后生效。</Alert>}
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<SaveRounded />} disabled={!canSave || mutation.isPending} onClick={save}>
          保存配置
        </Button>
      </Stack>

      <Section title="基础信息">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="站点标题" value={form.title} onChange={(e) => update("title", e.target.value)} />
          <TextField fullWidth label="Favicon URL" value={form.faviconUrl} onChange={(e) => update("faviconUrl", e.target.value)} />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="作者名称" value={form.authorName} onChange={(e) => update("authorName", e.target.value)} />
          <TextField fullWidth label="头像 URL" value={form.avatarUrl} onChange={(e) => update("avatarUrl", e.target.value)} />
        </Stack>
        <TextField multiline minRows={3} label="简介" value={form.bio} onChange={(e) => update("bio", e.target.value)} />
      </Section>

      <Section title="导航品牌和外观">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="导航前缀" value={form.navTitle} onChange={(e) => update("navTitle", e.target.value)} />
          <TextField fullWidth label="导航连接符" value={form.navSuffix} onChange={(e) => update("navSuffix", e.target.value)} />
          <TextField fullWidth label="导航后缀" value={form.navAfter} onChange={(e) => update("navAfter", e.target.value)} />
        </Stack>
        <TextField multiline minRows={4} label="背景图片，一行一个 URL" value={form.bgImagesText} onChange={(e) => update("bgImagesText", e.target.value)} />
        <TextField label="默认文章封面 URL" value={form.defaultPostCover} onChange={(e) => update("defaultPostCover", e.target.value)} />
      </Section>

      <Section title="社交链接">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="GitHub" value={form.social.github} onChange={(e) => updateSocial("github", e.target.value)} />
          <TextField fullWidth label="Gitee" value={form.social.gitee} onChange={(e) => updateSocial("gitee", e.target.value)} />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Google" value={form.social.google} onChange={(e) => updateSocial("google", e.target.value)} />
          <TextField fullWidth label="邮箱" value={form.social.email} onChange={(e) => updateSocial("email", e.target.value)} />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="QQ" value={form.social.qq} onChange={(e) => updateSocial("qq", e.target.value)} />
          <TextField fullWidth label="微信" value={form.social.wechat} onChange={(e) => updateSocial("wechat", e.target.value)} />
        </Stack>
      </Section>

      <Section title="功能配置">
        <TextField label="建站时间" value={form.buildDate} onChange={(e) => update("buildDate", e.target.value)} />
        <TextField multiline minRows={5} label="页脚徽章 JSON" value={form.footerBadgesText} error={Boolean(footerBadgesError)} helperText={footerBadgesError || "格式：[字段 name 和 color 的对象数组]"} onChange={(e) => update("footerBadgesText", e.target.value)} />
      </Section>

      <Section title="AI 配置">
        <TextField
          fullWidth
          type="password"
          label="API Key"
          value={form.aiConfig.apiKey}
          helperText="仅后台接口返回完整值，前台站点配置接口会自动脱敏。"
          onChange={(e) => update("aiConfig", { ...form.aiConfig, apiKey: e.target.value })}
        />
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth label="Base URL" value={form.aiConfig.baseUrl} onChange={(e) => update("aiConfig", { ...form.aiConfig, baseUrl: e.target.value })} />
          <TextField fullWidth label="模型" value={form.aiConfig.model} onChange={(e) => update("aiConfig", { ...form.aiConfig, model: e.target.value })} />
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField fullWidth type="number" label="Max Tokens" value={form.aiConfig.maxTokens} onChange={(e) => update("aiConfig", { ...form.aiConfig, maxTokens: Number(e.target.value) })} />
          <TextField fullWidth type="number" label="Temperature" value={form.aiConfig.temperature} onChange={(e) => update("aiConfig", { ...form.aiConfig, temperature: Number(e.target.value) })} />
        </Stack>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="聊天系统提示词"
          value={form.aiConfig.systemPrompt}
          onChange={(e) => update("aiConfig", { ...form.aiConfig, systemPrompt: e.target.value })}
        />
      </Section>

      <Section title="备案和友链申请">
        <TextField select label="备案信息" value={form.icpConfig ? "enabled" : "disabled"} onChange={(e) => update("icpConfig", e.target.value === "enabled" ? { name: "", link: "" } : null)}>
          <MenuItem value="disabled">不显示</MenuItem>
          <MenuItem value="enabled">显示</MenuItem>
        </TextField>
        {form.icpConfig && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField fullWidth label="备案名称" value={form.icpConfig.name} onChange={(e) => update("icpConfig", { ...form.icpConfig!, name: e.target.value })} />
            <TextField fullWidth label="备案链接" value={form.icpConfig.link} onChange={(e) => update("icpConfig", { ...form.icpConfig!, link: e.target.value })} />
          </Stack>
        )}
        <TextField multiline minRows={5} label="友链申请格式" value={form.friendLinkApplyFormat} onChange={(e) => update("friendLinkApplyFormat", e.target.value)} />
      </Section>
    </Stack>
  );
}
