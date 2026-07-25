import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { TextFieldProps } from "@mui/material";
import { useState } from "react";
import { MarkdownView } from "../components/MarkdownView";
import { ModernLoader } from "../components/Loading";

export type PublishStatus = "draft" | "published";

export function PublishStatusField({
  value,
  onChange,
  label = "状态",
  fullWidth = true,
  sx,
}: {
  value: PublishStatus;
  onChange: (value: PublishStatus) => void;
  label?: string;
  fullWidth?: boolean;
  sx?: TextFieldProps["sx"];
}) {
  return (
    <TextField
      select
      fullWidth={fullWidth}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as PublishStatus)}
      sx={[{ minWidth: 140 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <MenuItem value="draft">草稿</MenuItem>
      <MenuItem value="published">发布</MenuItem>
    </TextField>
  );
}

export function StatusChip({ status }: { status: string }) {
  const labels: Record<string, string> = {
    published: "已发布",
    draft: "草稿",
    enabled: "启用",
    disabled: "禁用",
    visible: "可见",
    hidden: "隐藏",
    active: "正常",
    banned: "封禁",
    admin: "管理员",
    user: "用户",
    pending: "待审核",
  };
  const muted = ["draft", "disabled", "hidden", "banned", "user"];
  const warning = ["pending"];
  const className = warning.includes(status) ? "status warn" : muted.includes(status) ? "status draft" : "status";
  return <span className={className}>{labels[status] ?? status}</span>;
}

export function AdminToolbar({
  search,
  onSearch,
  onRefresh,
  onCreate,
  createLabel = "新建",
}: {
  search: string;
  onSearch: (value: string) => void;
  onRefresh?: () => void;
  onCreate?: () => void;
  createLabel?: string;
}) {
  return (
    <>
      <div className="toolbar admin-toolbar">
        <label className="search-field">
          <span>⌕</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="搜索内容…"
          />
        </label>
        <div className="toolbar-group">
          {onRefresh && (
            <button className="button ghost" type="button" onClick={onRefresh}>↻ 刷新</button>
          )}
          {onCreate && (
            <button className="button primary" type="button" onClick={onCreate}>＋ {createLabel}</button>
          )}
        </div>
      </div>
    </>
  );
}

export function StateBlock({ loading, error, empty }: { loading?: boolean; error?: unknown; empty?: boolean }) {
  if (loading) {
    return (
      <div className="admin-state-block">
        <ModernLoader size={48} />
      </div>
    );
  }
  if (error)
    return (
      <div className="admin-state-block error" role="alert">
        {error instanceof Error ? error.message : "加载失败"}
      </div>
    );
  if (empty)
    return (
      <div className="empty-state">
        <b>⌕</b>
        <strong>没有找到匹配的数据</strong>
        <span>试试更换关键词或状态筛选。</span>
      </div>
    );
  return null;
}

export function MarkdownEditor({
  label,
  value,
  onChange,
  minRows = 10,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(_, value) => value && setMode(value)}
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              py: 0.5,
              borderRadius: 1.5,
              border: "none",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": {
                  bgcolor: "primary.dark",
                },
              },
            },
            bgcolor: (theme) => alpha(theme.palette.divider, 0.5),
            p: 0.5,
            borderRadius: 2,
          }}
        >
          <ToggleButton value="edit">编辑</ToggleButton>
          <ToggleButton value="preview">预览</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {mode === "edit" ? (
        <TextField
          multiline
          minRows={minRows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          fullWidth
          InputProps={{ sx: { borderRadius: 2, fontFamily: "monospace", fontSize: "0.9rem" } }}
        />
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            minHeight: 220,
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
          }}
        >
          <MarkdownView content={value || "暂无内容"} />
        </Paper>
      )}
    </Stack>
  );
}

export function EntityDialog({
  open,
  title,
  children,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, px: 3, py: 2.5, letterSpacing: "-0.01em" }}>{title}</DialogTitle>
      <DialogContent dividers sx={{ p: 3, borderColor: "divider" }}>
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: 600 }}>
          取消
        </Button>
        <Button variant="contained" onClick={onSave} disabled={saving} disableElevation sx={{ borderRadius: 2, px: 3 }}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
