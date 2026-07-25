import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  AddRounded,
  ArrowBackRounded,
  AutoAwesomeRounded,
  ContentCopyRounded,
  SaveRounded,
  SendRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { PublishStatusField } from "../admin/AdminPrimitives";
import {
  adminApi,
  type AdminPost,
  type AiChatMessage,
  type AiCompletePostResponse,
  type AiCompletionField,
  joinLines,
  splitLines,
} from "../admin/adminApi";
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

const allCompletionFields: AiCompletionField[] = ["titles", "slug", "summary", "category", "tags"];

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

function completionLabel(field: AiCompletionField) {
  return { titles: "标题", slug: "Slug", summary: "摘要", category: "分类", tags: "标签" }[field];
}

export function AdminPostEditorPage() {
  const { user, isLoading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = params.id === "new";
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [completionResult, setCompletionResult] = useState<AiCompletePostResponse | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<AiCompletionField>>(new Set());
  const [selectedTitle, setSelectedTitle] = useState("");
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const contentInputRef = useRef<HTMLTextAreaElement | null>(null);

  const postQuery = useQuery({
    queryKey: ["admin", "post", params.id],
    queryFn: () => adminApi.post(params.id!),
    enabled: user?.role === "admin" && !isNew && Boolean(params.id),
  });
  const taxonomyQuery = useQuery({
    queryKey: ["admin", "post-taxonomy"],
    queryFn: adminApi.postTaxonomy,
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (postQuery.data) setForm(formFromPost(postQuery.data));
  }, [postQuery.data]);

  const createMutation = useMutation({
    mutationFn: () => adminApi.createPost(payload(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "post-taxonomy"] });
      navigate("/admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updatePost(params.id!, payload(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "post", params.id] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "post-taxonomy"] });
    },
  });

  const aiContext = useMemo(
    () => ({
      title: form.title,
      slug: form.slug,
      summary: form.summary,
      category: form.category,
      tags: splitLines(form.tagsText),
      contentMd: form.contentMd,
    }),
    [form],
  );

  const completionMutation = useMutation({
    mutationFn: (fields: AiCompletionField[]) =>
      adminApi.completePost(fields, aiContext, isNew ? undefined : params.id),
    onSuccess: (result) => {
      const present = allCompletionFields.filter((field) => {
        const value = result[field];
        return Array.isArray(value) ? value.length > 0 : Boolean(value);
      });
      setCompletionResult(result);
      setSelectedFields(new Set(present));
      setSelectedTitle(result.titles?.[0] ?? "");
    },
  });

  const chatMutation = useMutation({
    mutationFn: (messages: AiChatMessage[]) => adminApi.aiChat(messages, aiContext),
    onSuccess: ({ reply }) => {
      setChatMessages((current) => [...current, { role: "assistant" as const, content: reply }].slice(-20));
    },
  });

  const canSave = useMemo(() => Boolean(form.title.trim() && form.slug.trim() && form.contentMd.trim()), [form]);
  const canUseAi = Boolean(form.title.trim() || form.contentMd.trim());
  const tags = splitLines(form.tagsText);

  const requestCompletion = (fields: AiCompletionField[]) => {
    setCompletionResult(null);
    completionMutation.mutate(fields);
  };

  const toggleCompletionField = (field: AiCompletionField) => {
    setSelectedFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const applyCompletion = () => {
    if (!completionResult) return;
    setForm((current) => ({
      ...current,
      title: selectedFields.has("titles") ? selectedTitle || current.title : current.title,
      slug: selectedFields.has("slug") ? completionResult.slug || current.slug : current.slug,
      summary: selectedFields.has("summary") ? completionResult.summary || current.summary : current.summary,
      category: selectedFields.has("category") ? completionResult.category || current.category : current.category,
      tagsText: selectedFields.has("tags") ? joinLines(completionResult.tags) : current.tagsText,
    }));
    setCompletionResult(null);
  };

  const sendChat = () => {
    const content = chatInput.trim();
    if (!content || chatMutation.isPending) return;
    const nextMessages = [...chatMessages, { role: "user" as const, content }].slice(-20);
    setChatMessages(nextMessages);
    setChatInput("");
    chatMutation.mutate(nextMessages);
  };

  const insertIntoContent = (text: string, append = false) => {
    setMode("edit");
    setForm((current) => {
      if (append) {
        const separator = current.contentMd.trim() ? "\n\n" : "";
        return { ...current, contentMd: `${current.contentMd}${separator}${text}` };
      }
      const element = contentInputRef.current;
      const start = element?.selectionStart ?? current.contentMd.length;
      const end = element?.selectionEnd ?? start;
      const nextContent = `${current.contentMd.slice(0, start)}${text}${current.contentMd.slice(end)}`;
      window.requestAnimationFrame(() => {
        contentInputRef.current?.focus();
        contentInputRef.current?.setSelectionRange(start + text.length, start + text.length);
      });
      return { ...current, contentMd: nextContent };
    });
  };

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
      <div className="editor-shell">
      <Paper
        className="editor-bar"
        square
        elevation={0}
        sx={{
          position: "sticky",
          top: 76,
          zIndex: 10,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          backdropFilter: "blur(24px) saturate(150%)",
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ md: "center" }}
            justifyContent="space-between"
            sx={{ py: 1.4 }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
              <Button component={RouterLink} to="/admin" startIcon={<ArrowBackRounded />}>
                返回后台
              </Button>
              <Divider flexItem orientation="vertical" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                  {isNew ? "新建文章" : form.title || "编辑文章"}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {form.slug ? `/blog/${form.slug}` : "设置 slug 后生成文章地址"}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}>
                <ToggleButton value="edit">编辑</ToggleButton>
                <ToggleButton value="preview">
                  <VisibilityRounded fontSize="small" sx={{ mr: 0.5 }} />
                  预览
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                startIcon={<SaveRounded />}
                disabled={!canSave || saving}
                onClick={() => (isNew ? createMutation.mutate() : updateMutation.mutate())}
              >
                {saving ? "保存中" : "保存"}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 2.5 }, px: { xs: 2, md: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error instanceof Error ? error.message : "保存失败"}
          </Alert>
        )}
        {postQuery.isLoading ? (
          <SectionPanel>正在加载文章...</SectionPanel>
        ) : (
          <Box
            className="editor-grid"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(340px, 380px)" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper
              className={`editor-main${mode === "preview" ? " preview" : ""}`}
              variant="outlined"
              sx={{ ...glassCardSx, p: 2, minHeight: { lg: "calc(100vh - 190px)" }, minWidth: 0 }}
            >
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
                    inputRef={contentInputRef}
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
                  <Stack spacing={2} sx={{ px: { xs: 0, md: 2 }, py: 1 }}>
                    {form.cover && (
                      <Box
                        component="img"
                        src={form.cover}
                        alt={form.title}
                        sx={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 1.5 }}
                      />
                    )}
                    <Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: "1.9rem", md: "2.4rem" } }}>
                        {form.title || "未填写标题"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {form.slug ? `/blog/${form.slug}` : "尚未设置 slug"}
                      </Typography>
                    </Box>
                    {(form.category || tags.length > 0) && (
                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {form.category && <Chip size="small" color="primary" label={form.category} />}
                        {tags.map((tag) => (
                          <Chip key={tag} size="small" label={tag} variant="outlined" />
                        ))}
                      </Stack>
                    )}
                    {form.summary && <Alert severity="info">{form.summary}</Alert>}
                    <Divider />
                    <MarkdownView content={form.contentMd || "暂无内容"} />
                  </Stack>
                )}
              </Stack>
            </Paper>

            <Stack className="editor-side" spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 160 }, minWidth: 0, width: "100%" }}>
              <Paper className="ai-assistant-card" variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    AI 写作助手
                  </Typography>
                  <Button
                    size="small"
                    startIcon={completionMutation.isPending ? <CircularProgress size={15} /> : <AutoAwesomeRounded />}
                    disabled={!canUseAi || completionMutation.isPending}
                    onClick={() => requestCompletion(allCompletionFields)}
                  >
                    补全信息
                  </Button>
                </Stack>
                {completionMutation.isError && (
                  <Alert severity="error" sx={{ mb: 1.5 }}>
                    {completionMutation.error.message}
                  </Alert>
                )}
                <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto", mb: 1.2, pr: 0.5 }}>
                  {chatMessages.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      可以询问改写、结构、措辞或内容补充建议。
                    </Typography>
                  )}
                  {chatMessages.map((message, index) => (
                    <Box
                      key={`${message.role}-${index}`}
                      sx={{
                        alignSelf: message.role === "user" ? "flex-end" : "stretch",
                        maxWidth: message.role === "user" ? "86%" : "100%",
                      }}
                    >
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.2, bgcolor: message.role === "user" ? "action.selected" : "background.paper" }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                          {message.content}
                        </Typography>
                      </Paper>
                      {message.role === "assistant" && (
                        <Stack direction="row" spacing={0.3} sx={{ mt: 0.4 }}>
                          <Button
                            size="small"
                            startIcon={<AddRounded />}
                            onClick={() => insertIntoContent(message.content)}
                          >
                            插入
                          </Button>
                          <Button size="small" onClick={() => insertIntoContent(message.content, true)}>
                            追加
                          </Button>
                          <Button
                            size="small"
                            startIcon={<ContentCopyRounded />}
                            onClick={() => void navigator.clipboard.writeText(message.content)}
                          >
                            复制
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  ))}
                  {chatMutation.isPending && <CircularProgress size={20} sx={{ alignSelf: "center" }} />}
                </Stack>
                {chatMutation.isError && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {chatMutation.error.message}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  value={chatInput}
                  placeholder="询问当前文章..."
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendChat();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Button size="small" disabled={!chatInput.trim() || chatMutation.isPending} onClick={sendChat}>
                        <SendRounded />
                      </Button>
                    ),
                  }}
                />
              </Paper>

              <Paper variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>
                  发布设置
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <TextField
                      fullWidth
                      label="Slug"
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                    />
                    <Button
                      variant="outlined"
                      sx={{ minWidth: 88, minHeight: 56 }}
                      disabled={!canUseAi || completionMutation.isPending}
                      onClick={() => requestCompletion(["slug"])}
                    >
                      AI 生成
                    </Button>
                  </Stack>
                  <PublishStatusField value={form.status} onChange={(status) => setForm({ ...form, status })} />
                  <Autocomplete
                    freeSolo
                    options={taxonomyQuery.data?.categories ?? []}
                    value={form.category}
                    onInputChange={(_, value) => setForm((current) => ({ ...current, category: value }))}
                    renderInput={(inputParams) => <TextField {...inputParams} fullWidth label="分类" />}
                  />
                  <Autocomplete
                    multiple
                    freeSolo
                    options={taxonomyQuery.data?.tags ?? []}
                    value={tags}
                    onChange={(_, value) => setForm((current) => ({ ...current, tagsText: joinLines(value) }))}
                    renderTags={(value, getTagProps) =>
                      value.map((tag, index) => <Chip label={tag} size="small" {...getTagProps({ index })} key={tag} />)
                    }
                    renderInput={(inputParams) => (
                      <TextField {...inputParams} fullWidth label="标签" helperText="回车确认，可选择已有标签或新建" />
                    )}
                  />
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ ...glassCardSx, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 1.5 }}>
                  展示信息
                </Typography>
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth
                    label="摘要"
                    multiline
                    minRows={4}
                    value={form.summary}
                    onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  />
                  <TextField
                    fullWidth
                    label="封面 URL"
                    value={form.cover}
                    onChange={(event) => setForm({ ...form, cover: event.target.value })}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Box>
        )}
      </Container>

      <Dialog open={Boolean(completionResult)} onClose={() => setCompletionResult(null)} fullWidth maxWidth="sm">
        <DialogTitle>确认采用 AI 建议</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {completionResult?.titles && (
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox checked={selectedFields.has("titles")} onChange={() => toggleCompletionField("titles")} />
                  }
                  label={completionLabel("titles")}
                />
                <Stack sx={{ pl: 1 }}>
                  {completionResult.titles.map((title) => (
                    <FormControlLabel
                      key={title}
                      control={<Radio checked={selectedTitle === title} onChange={() => setSelectedTitle(title)} />}
                      label={title}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            {(["slug", "summary", "category", "tags"] as AiCompletionField[]).map((field) => {
              const value = completionResult?.[field];
              if (!value) return null;
              return (
                <Box key={field}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={selectedFields.has(field)} onChange={() => toggleCompletionField(field)} />
                    }
                    label={completionLabel(field)}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 4, whiteSpace: "pre-wrap" }}>
                    {Array.isArray(value) ? value.join("、") : value}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompletionResult(null)}>取消</Button>
          <Button variant="contained" disabled={selectedFields.size === 0} onClick={applyCompletion}>
            应用所选内容
          </Button>
        </DialogActions>
      </Dialog>
      </div>
    </AdminWorkspaceLayout>
  );
}
