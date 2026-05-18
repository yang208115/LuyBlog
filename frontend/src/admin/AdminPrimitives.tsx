import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
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
import { AddRounded, RefreshRounded, SearchRounded } from "@mui/icons-material";
import { useState } from "react";
import { MarkdownView } from "../components/MarkdownView";
import { glassCardSx } from "../components/Glass";

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
  const enabled = status === "published" || status === "enabled" || status === "visible" || status === "active" || status === "admin";
  return <Chip size="small" label={status} color={enabled ? "success" : "default"} variant={enabled ? "filled" : "outlined"} />;
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
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        bgcolor: (theme) => alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.72 : 0.92),
        borderColor: "divider",
        boxShadow: "none",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
        <TextField
          size="small"
          placeholder="搜索"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { md: 320 } }}
        />
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {onRefresh && (
            <Button variant="outlined" startIcon={<RefreshRounded />} onClick={onRefresh}>
              刷新
            </Button>
          )}
          {onCreate && (
            <Button variant="contained" startIcon={<AddRounded />} onClick={onCreate}>
              {createLabel}
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

export function StateBlock({ loading, error, empty }: { loading?: boolean; error?: unknown; empty?: boolean }) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error instanceof Error ? error.message : "加载失败"}</Alert>;
  if (empty) return <Alert severity="info">暂无数据。</Alert>;
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
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">{label}</Typography>
        <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_, value) => value && setMode(value)}>
          <ToggleButton value="edit">编辑</ToggleButton>
          <ToggleButton value="preview">预览</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {mode === "edit" ? (
        <TextField multiline minRows={minRows} value={value} onChange={(event) => onChange(event.target.value)} fullWidth />
      ) : (
        <Paper variant="outlined" sx={{ ...glassCardSx, p: 2, minHeight: 220 }}>
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={onSave} disabled={saving}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
