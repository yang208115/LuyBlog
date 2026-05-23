import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ArticleRounded,
  CodeRounded,
  DescriptionRounded,
  DynamicFeedRounded,
  LinkRounded,
  OpenInNewRounded,
  SearchRounded,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { interactiveGlassCardSx, SectionPanel } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { contentApi, type SearchResultItem, type SearchResultType } from "../services/content";
import { ModernLoader } from "../components/Loading";

const typeMeta: Record<
  SearchResultType,
  {
    label: string;
    icon: typeof ArticleRounded;
    color: string;
  }
> = {
  post: { label: "文章", icon: ArticleRounded, color: "#2563eb" },
  page: { label: "页面", icon: DescriptionRounded, color: "#0891b2" },
  moment: { label: "瞬间", icon: DynamicFeedRounded, color: "#db2777" },
  project: { label: "项目", icon: CodeRounded, color: "#16a34a" },
  friend: { label: "友链", icon: LinkRounded, color: "#f59e0b" },
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function ResultCard({ item }: { item: SearchResultItem }) {
  const theme = useTheme();
  const meta = typeMeta[item.type];
  const Icon = meta.icon;
  const isExternal = /^https?:\/\//.test(item.url);
  const date = formatDate(item.date);

  const cardContent = (
    <CardContent sx={{ p: { xs: 2, md: 2.4 }, "&:last-child": { pb: { xs: 2, md: 2.4 } } }}>
      <Stack spacing={1.3}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: meta.color,
              bgcolor: alpha(meta.color, theme.palette.mode === "dark" ? 0.2 : 0.12),
              flexShrink: 0,
            }}
          >
            <Icon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Chip size="small" label={meta.label} sx={{ borderRadius: 999, fontWeight: 800 }} />
              {date && (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {date}
                </Typography>
              )}
              {isExternal && <OpenInNewRounded sx={{ fontSize: 16, color: "text.secondary" }} />}
            </Stack>
            <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 900, lineHeight: 1.25 }}>
              {item.title}
            </Typography>
          </Box>
        </Stack>

        {item.excerpt && (
          <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
            {item.excerpt}
          </Typography>
        )}

        {item.meta.length > 0 && (
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            {item.meta.slice(0, 6).map((label) => (
              <Chip key={label} size="small" variant="outlined" label={label} sx={{ borderRadius: 999 }} />
            ))}
          </Stack>
        )}
      </Stack>
    </CardContent>
  );

  return (
    <Card
      component={isExternal ? "a" : RouterLink}
      href={isExternal ? item.url : undefined}
      to={isExternal ? undefined : item.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      variant="outlined"
      sx={{
        ...interactiveGlassCardSx,
        color: "inherit",
        textDecoration: "none",
        display: "block",
      }}
    >
      {cardContent}
    </Card>
  );
}

export function SearchPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const keyword = (params.get("q") || "").trim();
  const [input, setInput] = useState(keyword);

  useEffect(() => {
    setInput(keyword);
  }, [keyword]);

  const query = useQuery({
    queryKey: ["search", keyword],
    queryFn: () => contentApi.search(keyword),
    enabled: keyword.length > 0,
  });

  const groupedCounts = useMemo(() => {
    const counts = new Map<SearchResultType, number>();
    query.data?.items.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));
    return counts;
  }, [query.data?.items]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = input.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  return (
    <PublicPageLayout maxWidth="md" spacing={2.2}>
      <SectionPanel padding={{ xs: 2.2, md: 2.8 }}>
        <Stack spacing={2.2}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.9rem", md: "2.35rem" },
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              全局搜索
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.8 }}>
              搜索文章、页面、瞬间、项目和友链。
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                value={input}
                onChange={(event) => setInput(event.target.value)}
                autoFocus
                fullWidth
                placeholder="输入关键词"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 999,
                    backgroundColor: alpha(theme.palette.background.paper, 0.34),
                  },
                }}
              />
              <Button type="submit" variant="contained" sx={{ borderRadius: 999, px: 3, flexShrink: 0 }}>
                搜索
              </Button>
            </Stack>
          </Box>

          {keyword && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${query.data?.total ?? 0} 条结果`} color="primary" sx={{ borderRadius: 999, fontWeight: 800 }} />
              {Array.from(groupedCounts.entries()).map(([type, count]) => (
                <Chip key={type} label={`${typeMeta[type].label} ${count}`} variant="outlined" sx={{ borderRadius: 999 }} />
              ))}
            </Stack>
          )}
        </Stack>
      </SectionPanel>

      {!keyword && (
        <SectionPanel>
          <Typography color="text.secondary">输入关键词后开始搜索。</Typography>
        </SectionPanel>
      )}

      {query.isLoading && (
        <SectionPanel sx={{ display: "flex", justifyContent: "center" }}>
          <ModernLoader size={40} />
        </SectionPanel>
      )}

      {query.isError && (
        <SectionPanel>
          <Typography color="error">搜索失败，请稍后重试。</Typography>
        </SectionPanel>
      )}

      {keyword && !query.isLoading && !query.isError && query.data?.items.length === 0 && (
        <SectionPanel>
          <Typography color="text.secondary">没有找到匹配内容。</Typography>
        </SectionPanel>
      )}

      {query.data?.items.length ? (
        <Stack spacing={1.4}>
          {query.data.items.map((item) => (
            <ResultCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </Stack>
      ) : null}
    </PublicPageLayout>
  );
}
