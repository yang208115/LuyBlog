import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Stack,
  Typography,
  Button,
  TextField,
  useTheme,
} from "@mui/material";
import { SearchRounded, SellRounded, VisibilityRounded } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { interactiveGlassCardSx, SectionPanel } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { contentApi, normalizeTags, type PostItem } from "../services/content";

type PostListResponse = {
  items: PostItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

type ArchiveGroup = {
  key: string;
  label: string;
  posts: PostItem[];
};

function getPostDate(post: PostItem) {
  return new Date(post.publishedAt || post.createdAt);
}

function formatArchiveDate(post: PostItem) {
  return getPostDate(post).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

function groupByMonth(posts: PostItem[]): ArchiveGroup[] {
  const groups = new Map<string, ArchiveGroup>();

  posts.forEach((post) => {
    const date = getPostDate(post);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });

    if (!groups.has(key)) {
      groups.set(key, { key, label, posts: [] });
    }
    groups.get(key)?.posts.push(post);
  });

  return [...groups.values()];
}

export function BlogListPage() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("全部");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["blog", "posts"],
    queryFn: () => contentApi.posts(100) as Promise<PostListResponse>,
  });

  const posts = data?.items ?? [];
  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => normalizeTags(post.tags).forEach((tag) => tagSet.add(tag)));
    return ["全部", ...Array.from(tagSet).sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return posts.filter((post) => {
      const postTags = normalizeTags(post.tags);
      const tagMatched = activeTag === "全部" || postTags.includes(activeTag);
      const text = [post.title, post.summary, post.category, ...postTags].filter(Boolean).join(" ").toLowerCase();
      const keywordMatched = !keyword || text.includes(keyword);
      return tagMatched && keywordMatched;
    });
  }, [activeTag, posts, search]);

  const archiveGroups = useMemo(() => groupByMonth(filteredPosts), [filteredPosts]);

  if (isLoading) {
    return (
      <PublicPageLayout maxWidth="md">
        <SectionPanel sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </SectionPanel>
      </PublicPageLayout>
    );
  }

  if (isError) {
    return (
      <PublicPageLayout maxWidth="md">
        <SectionPanel>
          <Typography color="error">加载文章失败，请稍后重试。</Typography>
        </SectionPanel>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout maxWidth="md" spacing={2.2}>
      <SectionPanel padding={{ xs: 2.2, md: 2.8 }}>
        <Stack spacing={2}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.9rem", md: "2.2rem" },
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            归档
          </Typography>
          <Typography color="text.secondary">按发布时间整理文章，可通过标签和关键词快速筛查。</Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索标题、摘要、分类或标签"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" />
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
            <Chip
              label={`${filteredPosts.length} / ${posts.length} 篇`}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, fontWeight: 700 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {tags.map((tag) => (
              <Chip
                key={tag}
                icon={tag === "全部" ? undefined : <SellRounded />}
                label={tag}
                clickable
                color={activeTag === tag ? "primary" : "default"}
                variant={activeTag === tag ? "filled" : "outlined"}
                onClick={() => setActiveTag(tag)}
                sx={{ borderRadius: 999 }}
              />
            ))}
          </Stack>
        </Stack>
      </SectionPanel>

      {archiveGroups.length === 0 ? (
        <SectionPanel>
          <Typography color="text.secondary">没有找到匹配的文章。</Typography>
        </SectionPanel>
      ) : (
        <Stack spacing={2}>
          {archiveGroups.map((group) => (
            <Box key={group.key}>
              <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 1.2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, minWidth: "fit-content" }}>
                  {group.label}
                </Typography>
                <Divider flexItem sx={{ flex: 1, alignSelf: "center" }} />
                <Chip size="small" label={`${group.posts.length} 篇`} />
              </Stack>

              <Stack
                spacing={1.2}
                sx={{
                  position: "relative",
                  pl: { xs: 2.4, md: 3 },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: { xs: 7, md: 11 },
                    top: 6,
                    bottom: 6,
                    width: 2,
                    borderRadius: 999,
                    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.65)}, ${alpha(
                      theme.palette.secondary.main,
                      0.18,
                    )})`,
                  },
                }}
              >
                {group.posts.map((post) => {
                  const postTags = normalizeTags(post.tags);

                  return (
                    <Box key={post.id} sx={{ position: "relative" }}>
                      <Box
                        sx={{
                          position: "absolute",
                          left: { xs: -19, md: -25 },
                          top: 26,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 5px ${alpha(theme.palette.primary.main, 0.14)}`,
                        }}
                      />
                      <Card
                        component={RouterLink}
                        to={`/blog/${post.slug}`}
                        variant="outlined"
                        sx={{
                          ...interactiveGlassCardSx,
                          color: "inherit",
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                          <Stack spacing={1}>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={{ xs: 0.7, sm: 1.4 }}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.28 }}>
                                {post.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ minWidth: "fit-content" }}>
                                {formatArchiveDate(post)}
                              </Typography>
                            </Stack>

                            {post.summary && (
                              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                                {post.summary}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" useFlexGap flexWrap="wrap">
                              <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                                {post.category && <Chip size="small" label={post.category} variant="outlined" />}
                                {postTags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    size="small"
                                    label={tag}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setActiveTag(tag);
                                    }}
                                    sx={{ borderRadius: 999 }}
                                  />
                                ))}
                                <Chip
                                  size="small"
                                  icon={<VisibilityRounded />}
                                  label={`${post.viewCount.toLocaleString("zh-CN")} 次浏览`}
                                  variant="outlined"
                                  sx={{ borderRadius: 999 }}
                                />
                              </Stack>
                              <Button size="small" sx={{ borderRadius: 999 }}>
                                阅读
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </PublicPageLayout>
  );
}
