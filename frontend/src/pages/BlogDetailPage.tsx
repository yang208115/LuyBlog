import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { VisibilityRounded } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Comments } from "../components/Comments";
import { glassCardSx, SectionPanel } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi, normalizeTags } from "../services/content";
import { ModernLoader } from "../components/Loading";

export function BlogDetailPage() {
  const { slug = "" } = useParams();
  const postQuery = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => contentApi.post(slug),
    enabled: Boolean(slug),
  });

  if (postQuery.isLoading) {
    return (
      <PublicPageLayout maxWidth="md">
        <SectionPanel sx={{ display: "flex", justifyContent: "center" }}>
          <ModernLoader size={40} />
        </SectionPanel>
      </PublicPageLayout>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <PublicPageLayout maxWidth="md">
        <Alert severity="error">文章不存在或已下线。</Alert>
      </PublicPageLayout>
    );
  }

  const post = postQuery.data;
  const tags = normalizeTags(post.tags);

  return (
    <PublicPageLayout maxWidth="md" spacing={2.2}>
      <SectionPanel padding={{ xs: 2.2, md: 3 }}>
        <Stack spacing={1.2}>
          {post.cover && (
            <Box
              component="img"
              src={post.cover}
              alt={post.title}
              sx={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 1.5 }}
            />
          )}
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: "1.9rem", md: "2.4rem" } }}>
            {post.title}
          </Typography>
          <Stack direction="row" spacing={1.2} alignItems="center" useFlexGap flexWrap="wrap">
            <Typography color="text.secondary">
              {new Date(post.publishedAt || post.createdAt).toLocaleString("zh-CN")}
              {post.readingTime ? ` · ${post.readingTime} 分钟阅读` : ""}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
              <VisibilityRounded fontSize="small" />
              <Typography variant="body2">{post.viewCount} 次浏览</Typography>
            </Stack>
          </Stack>
          {tags.length > 0 && (
            <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
              {tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
          {post.summary && <Alert severity="info">{post.summary}</Alert>}
        </Stack>
      </SectionPanel>

      <Card variant="outlined" sx={glassCardSx}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <MarkdownView content={post.contentMd} />
        </CardContent>
      </Card>

      <Comments targetType="post" targetSlug={post.slug} />
    </PublicPageLayout>
  );
}
