import { Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Stack, TextField, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { SendRounded } from "@mui/icons-material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { SectionPanel } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { useSiteConfig } from "../context/SiteConfigProvider";
import { contentApi } from "../services/content";
import { ModernLoader } from "../components/Loading";

type ApplyForm = {
  name: string;
  description: string;
  url: string;
  avatarUrl: string;
};

const emptyForm: ApplyForm = {
  name: "",
  description: "",
  url: "",
  avatarUrl: "",
};

function hostname(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function FriendsPage() {
  const theme = useTheme();
  const siteConfig = useSiteConfig();
  const [form, setForm] = useState<ApplyForm>(emptyForm);
  const query = useQuery({ queryKey: ["friend-links"], queryFn: contentApi.friendLinks });
  const applyMutation = useMutation({
    mutationFn: contentApi.applyFriendLink,
    onSuccess: () => setForm(emptyForm),
  });

  const update = (key: keyof ApplyForm, value: string) => {
    applyMutation.reset();
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyMutation.mutate({
      name: form.name,
      description: form.description,
      url: form.url,
      avatarUrl: form.avatarUrl,
    });
  };

  const panelSx = {
    borderRadius: 3,
    backgroundColor: theme.glass.background,
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.07)}`,
  };

  const linkCardSx = {
    ...panelSx,
    height: "100%",
    overflow: "hidden",
    transition: "all 0.25s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: alpha(theme.palette.primary.main, 0.4),
      boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  };

  return (
    <PublicPageLayout maxWidth="md" spacing={2.2} sx={{ py: { xs: 3, md: 5 } }}>
      <SectionPanel>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          友链
        </Typography>
        <Typography color="text.secondary">这里放我常用和推荐的站点。</Typography>
      </SectionPanel>

      {query.isLoading && <ModernLoader size={40} />}
      {(query.data ?? []).length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.6,
          }}
        >
          {(query.data ?? []).map((item) => (
            <Card key={item.url} sx={linkCardSx}>
              <CardActionArea component="a" href={item.url} target="_blank" rel="noreferrer" sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 2, md: 2.2 }, height: "100%" }}>
                  <Stack spacing={1.4} sx={{ minHeight: 118 }}>
                    <Stack direction="row" spacing={1.4} alignItems="center">
                      <Avatar
                        src={item.avatarUrl ?? undefined}
                        sx={{
                          width: 52,
                          height: 52,
                          border: `1px solid ${alpha(theme.palette.common.white, 0.24)}`,
                          transform: "rotate(0deg)",
                          transition: "transform 0.55s ease",
                          "&:hover": {
                            transform: "rotate(360deg)",
                          },
                        }}
                      >
                        {item.name.slice(0, 1)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: "1.05rem", fontWeight: 800, color: "text.primary" }}>
                          {item.name}
                        </Typography>
                        <Typography noWrap variant="caption" color="text.secondary">
                          {hostname(item.url)}
                        </Typography>
                      </Box>
                    </Stack>
                    {item.description && (
                      <Typography
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          minHeight: 44,
                          overflow: "hidden",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
      {query.data?.length === 0 && (
        <Card sx={panelSx}>
          <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
            <Typography color="text.secondary">暂无友链。</Typography>
          </CardContent>
        </Card>
      )}

      <Card sx={panelSx}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Stack component="form" spacing={2} onSubmit={submit}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                申请友链
              </Typography>
              {siteConfig.friendLinkApplyFormat && (
                <Typography component="pre" color="text.secondary" sx={{ mt: 1, fontFamily: "inherit", whiteSpace: "pre-wrap", m: 0 }}>
                  {siteConfig.friendLinkApplyFormat}
                </Typography>
              )}
            </Box>
            {applyMutation.isSuccess && <Alert severity="success">已提交，等待审核。</Alert>}
            {applyMutation.error && <Alert severity="error">{applyMutation.error instanceof Error ? applyMutation.error.message : "提交失败"}</Alert>}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <TextField required fullWidth label="站点名称" value={form.name} onChange={(event) => update("name", event.target.value)} />
              <TextField required fullWidth label="链接 URL" value={form.url} onChange={(event) => update("url", event.target.value)} />
            </Stack>
            <TextField required label="简介" value={form.description} onChange={(event) => update("description", event.target.value)} />
            <TextField required label="头像 URL" value={form.avatarUrl} onChange={(event) => update("avatarUrl", event.target.value)} />
            <Box>
              <Button type="submit" variant="contained" startIcon={<SendRounded />} disabled={applyMutation.isPending}>
                提交申请
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </PublicPageLayout>
  );
}
