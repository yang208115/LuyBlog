import { Alert, Box, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../components/SearchBar";
import {
  CloudPlayerBento,
  FeatureCarouselBento,
  ProfileBento,
  SiteDashboardBento,
  ThemeBento,
} from "../components/HomeBento";
import { PublicPageLayout } from "../components/Layout";
import { contentApi } from "../services/content";
import { ModernLoader } from "../components/Loading";

export default function HomePage() {
  const postsQuery = useQuery({ queryKey: ["home", "posts"], queryFn: () => contentApi.posts(8) });
  const activityQuery = useQuery({ queryKey: ["home", "activity"], queryFn: contentApi.activity });
  const momentsQuery = useQuery({ queryKey: ["home", "moments"], queryFn: contentApi.moments });

  const posts = postsQuery.data?.items ?? [];
  const moments = momentsQuery.data ?? [];
  const totalViews = postsQuery.data?.pagination.totalViews ?? posts.reduce((sum, post) => sum + post.viewCount, 0);

  return (
    <PublicPageLayout maxWidth="lg" spacing={3} sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <SearchBar posts={posts} activity={activityQuery.data ?? []} />
      </Box>

      {postsQuery.isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <ModernLoader size={56} />
        </Box>
      )}

      {postsQuery.isError && <Alert severity="warning">内容加载失败，部分面板可能为空。</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" }, gap: 3, alignItems: "stretch" }}>
        <Box sx={{ gridColumn: { xs: "1", lg: "span 4" }, minWidth: 0 }}>
          <ProfileBento postCount={postsQuery.data?.pagination.total ?? posts.length} momentCount={moments.length} totalViews={totalViews} />
        </Box>
        <Box sx={{ gridColumn: { xs: "1", lg: "span 3" }, minWidth: 0 }}>
          <ThemeBento minHeight={278} />
        </Box>
        <Box sx={{ gridColumn: { xs: "1", lg: "span 5" }, minWidth: 0 }}>
          <CloudPlayerBento />
        </Box>
      </Box>

      {posts.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(12, minmax(0, 1fr))" }, gap: 3 }}>
          <Box sx={{ gridColumn: "1 / -1", minWidth: 0 }}>
            <FeatureCarouselBento items={posts} />
          </Box>
        </Box>
      )}

      <SiteDashboardBento />
    </PublicPageLayout>
  );
}
