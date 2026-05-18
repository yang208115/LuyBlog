import { Card, CardContent, CircularProgress, ImageList, ImageListItem, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { glassCardSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi } from "../services/content";

export function MomentsPage() {
  const query = useQuery({ queryKey: ["moments"], queryFn: contentApi.moments });

  return (
    <PublicPageLayout maxWidth="md" title="瞬间" subtitle="像朋友圈一样记录日常片段。" spacing={2.2}>
      {query.isLoading && <CircularProgress />}
      {query.data?.map((moment) => (
        <Card key={moment.id} variant="outlined" sx={glassCardSx}>
          <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
            <Stack spacing={1.4}>
              <Typography variant="body2" color="text.secondary">
                {new Date(moment.publishedAt || moment.createdAt).toLocaleString("zh-CN")}
              </Typography>
              <MarkdownView content={moment.contentMd} />
              {moment.images.length > 0 && (
                <ImageList cols={moment.images.length > 1 ? 2 : 1} gap={8}>
                  {moment.images.slice(0, 8).map((image) => (
                    <ImageListItem key={image}>
                      <img src={image} alt="" loading="lazy" style={{ borderRadius: 8, objectFit: "cover" }} />
                    </ImageListItem>
                  ))}
                </ImageList>
              )}
            </Stack>
          </CardContent>
        </Card>
      ))}
      {query.data?.length === 0 && <Typography color="text.secondary">暂无瞬间。</Typography>}
    </PublicPageLayout>
  );
}
