import { Alert, Card, CardContent } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { glassCardSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { MarkdownView } from "../components/MarkdownView";
import { ModernLoader } from "../components/Loading";
import { contentApi } from "../services/content";

export function MarkdownPage() {
  const { slug = "" } = useParams();
  const query = useQuery({
    queryKey: ["page", slug],
    queryFn: () => contentApi.page(slug),
    enabled: Boolean(slug),
  });

  return (
    <PublicPageLayout maxWidth="md" title={query.data?.title || slug} spacing={2}>
      {query.isLoading && <ModernLoader size={40} />}
      {query.isError && <Alert severity="warning">页面不存在或尚未发布。</Alert>}
      {query.data && (
        <Card variant="outlined" sx={glassCardSx}>
          <CardContent sx={{ p: { xs: 2.4, md: 3.2 } }}>
            <MarkdownView content={query.data.contentMd} />
          </CardContent>
        </Card>
      )}
    </PublicPageLayout>
  );
}
