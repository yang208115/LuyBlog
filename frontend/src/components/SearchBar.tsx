import { Autocomplete, Box, InputAdornment, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import { SearchRounded } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ActivityItem, PostItem } from "../services/content";

type SearchItem = {
  label: string;
  path: string;
  caption: string;
};

export function SearchBar({ posts = [], activity = [] }: { posts?: PostItem[]; activity?: ActivityItem[] }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState("");
  const options = useMemo<SearchItem[]>(
    () => [
      ...posts.map((post) => ({ label: post.title, path: `/blog/${post.slug}`, caption: post.summary ?? "文章" })),
      ...activity
        .filter((item) => item.type === "moment")
        .map((item) => ({ label: item.summary?.slice(0, 28) || item.slug, path: "/moments", caption: "瞬间" })),
    ],
    [activity, posts],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputValue.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        width: "min(100%, 760px)",
        borderRadius: 999,
        backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.32 : 0.58),
        border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.16 : 0.48)}`,
        backdropFilter: "blur(18px) saturate(170%)",
        WebkitBackdropFilter: "blur(18px) saturate(170%)",
        boxShadow: `0 18px 45px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.28 : 0.1)}`,
        overflow: "hidden",
      }}
    >
      <Autocomplete
        options={options}
        inputValue={inputValue}
        onInputChange={(_, value) => setInputValue(value)}
        getOptionLabel={(option) => option.label}
        noOptionsText="没有匹配内容"
        onChange={(_, value) => {
          if (value) navigate(value.path);
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(18px)",
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="搜索文章、瞬间"
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchRounded color="primary" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: 58,
                borderRadius: 999,
                px: 1.3,
                fontWeight: 700,
                "& fieldset": { border: "none" },
              },
              "& .MuiInputBase-input": {
                py: 1.4,
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.path + option.label} sx={{ py: 1.1 }}>
            <Stack spacing={0.3} sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} noWrap>
                {option.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {option.caption}
              </Typography>
            </Stack>
          </Box>
        )}
      />
    </Paper>
  );
}
