import {
  Alert,
  Box,
  Button,
  Chip,
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
  const enabled = status === "published" || status === "enabled" || status === "visible" || status === "active" || status === "admin";
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        fontSize: "0.7rem",
        height: 22,
        bgcolor: enabled ? (theme) => alpha(theme.palette.success.main, 0.15) : (theme) => alpha(theme.palette.text.secondary, 0.1),
        color: enabled ? "success.main" : "text.secondary",
        border: "none"
      }}
    />
  );
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
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
        <TextField
          size="small"
          placeholder="搜索内容..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }
          }}
          sx={{ minWidth: { md: 360 } }}
        />
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
          {onRefresh && (
            <Button
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={onRefresh}
              sx={{ borderRadius: 2, color: "text.secondary", borderColor: "divider" }}
            >
              刷新
            </Button>
          )}
          {onCreate && (
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={onCreate}
              disableElevation
              sx={{ borderRadius: 2, px: 3 }}
            >
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
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <ModernLoader size={48} />
      </Box>
    );
  }
  if (error) return (
    <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
      {error instanceof Error ? error.message : "加载失败"}
    </Alert>
  );
  if (empty) return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <Typography color="text.secondary" sx={{ fontWeight: 500 }}>暂无数据</Typography>
    </Box>
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
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{label}</Typography>
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
                }
              }
            },
            bgcolor: (theme) => alpha(theme.palette.divider, 0.5),
            p: 0.5,
            borderRadius: 2
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
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5)
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
          borderRadius: 3,
          backgroundImage: "none",
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, px: 3, py: 2.5, letterSpacing: "-0.01em" }}>
        {title}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, borderColor: "divider" }}>
        {children}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: (theme) => alpha(theme.palette.background.default, 0.5) }}>
        <Button onClick={onClose} sx={{ color: "text.secondary", fontWeight: 600 }}>取消</Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={saving}
          disableElevation
          sx={{ borderRadius: 2, px: 3 }}
        >
          {saving ? "保存中..." : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
