import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ArrowBackRounded, SaveRounded, VisibilityRounded } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { PublishStatusField } from "../admin/AdminPrimitives";
import { adminApi, AdminPost, joinLines, splitLines } from "../admin/adminApi";
import { glassCardSx, SectionPanel } from "../components/Glass";
import { AdminWorkspaceLayout, PublicPageLayout } from "../components/Layout";
import { MarkdownView } from "../components/MarkdownView";
import { useAuth } from "../hooks/useAuth";

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

function formFromPost(post: AdminPost): EditorForm {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary ?? "",
    cover: post.cover ?? "",
    category: post.category ?? "",
    tagsText: joinLines(post.tags),
    contentMd: post.contentMd,
    status: post.status,
  };
}

function payload(form: EditorForm) {
  return {
    title: form.title,
    slug: form.slug,
    summary: form.summary || null,
    cover: form.cover || null,
    category: form.category || null,
    tags: splitLines(form.tagsText),
    contentMd: form.contentMd,
    status: form.status,
  };
}

export function AdminPostEditorPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const postQuery = useQuery({
    queryKey: ["admin", "post", params.id],
    queryFn: () => adminApi.post(params.id!),
    enabled: user?.role === "admin" && !isNew && Boolean(params.id),
  });

  useEffect(() => {
    if (postQuery.data) setForm(formFromPost(postQuery.data));
  }, [postQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPost(payload(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      navigate("/admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updatePost(params.id!, payload(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "post", params.id] });
    },
  });

  const canSave = useMemo(() => Boolean(form.title.trim() && form.slug.trim() && form.contentMd.trim()), [form]);

  if (isLoading) {
    return (
      <PublicPageLayout maxWidth="sm">
        <SectionPanel>正在验证管理员身份...</SectionPanel>
      </PublicPageLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <PublicPageLayout maxWidth="sm">
        <Alert severity="error">仅管理员可访问。</Alert>
      </PublicPageLayout>
    );
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error || postQuery.error;

  return (
    <AdminWorkspaceLayout>
      <Paper square elevation={0} sx={{ position: "sticky", top: 64, zIndex: 10, borderBottom: 1, borderColor: "divider" }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between" sx={{ py: 1.4 }}>
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
              <Button component={RouterLink} to="/admin" startIcon={<ArrowBackRounded />}>返回后台</Button>
              <Divider flexItem orientation="vertical" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>{isNew ? "新建文章" : form.title || "编辑文章"}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{form.slug ? `/blog/${form.slug}` : "设置 slug 后生成文章地址"}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}>
                <ToggleButton value="edit">编辑</ToggleButton>
                <ToggleButton value="preview"><VisibilityRounded fontSize="small" sx={{ mr: 0.5 }} />预览</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="contained" startIcon={<SaveRounded />} disabled={!canSave || saving} onClick={() => (isNew ? createMutation.mutate() : updateMutation.mutate())}>
                {saving ? "保存中" : "保存"}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 2.5 }, px: { xs: 2, md: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error instanceof Error ? error.message : "保存失败"}</Alert>}
        {postQuery.isLoading ? (
          <SectionPanel>正在加载文章...</SectionPanel>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(340px, 360px)" }, gap: 2, alignItems: "start" }}>
            <Paper variant="outlined" sx={{ ...glassCardSx, p: 2, minHeight: { lg: "calc(100vh - 190px)" }, minWidth: 0 }}>
              <Stack spacing={2}>
                <TextField
                  variant="standard"
                  placeholder="文章标题"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  InputProps={{ sx: { fontSize: { xs: "1.8rem", md: "2.4rem" }, fontWeight: 900 } }}
                />
                {mode === "edit" ? (
                  <TextField
                    multiline
                    minRows={22}
                    placeholder="在这里写 Markdown..."
                    value={form.contentMd}
                    onChange={(event) => setForm({ ...form, contentMd: event.target.value })}
                    sx={{
                      "& .MuiInputBase-root": {
                        alignItems: "flex-start",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "0.98rem",
                        lineHeight: 1.8,
                      },
                    }}
                  />
                ) : (
                  <Box sx={{ px: { xs: 0, md: 2 }, py: 1 }}>
                    <MarkdownView content={form.contentMd || "暂无内容"} />
                  </Box>
                )}
              </Stack>
            </Paper>

            <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 148 }, minWidth: 0, width: "100%" }}>
              <Paper variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>发布设置</Typography>
                <Stack spacing={1.5}>
                  <TextField fullWidth label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
                  <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
                  <TextField fullWidth label="分类" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
                  <TextField fullWidth label="标签（逗号或换行分隔）" multiline minRows={3} value={form.tagsText} onChange={(event) => setForm({ ...form, tagsText: event.target.value })} />
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>展示信息</Typography>
                <Stack spacing={1.5}>
                  <TextField fullWidth label="摘要" multiline minRows={4} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
                  <TextField fullWidth label="封面 URL" value={form.cover} onChange={(event) => setForm({ ...form, cover: event.target.value })} />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Container>
    </AdminWorkspaceLayout>
  );
}
