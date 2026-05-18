import { Alert, Card, CardContent, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { glassCardSx } from "../components/Glass";
import { PublicPageLayout } from "../components/Layout";
import { MarkdownView } from "../components/MarkdownView";
import { contentApi } from "../services/content";

export function AboutPage() {
  const query = useQuery({ queryKey: ["page", "about"], queryFn: () => contentApi.page("about") });
  return (
    <PublicPageLayout maxWidth="md" title="关于" spacing={2}>
      {query.isLoading && <CircularProgress />}
      {query.isError && <Alert severity="warning">关于页内容尚未导入，先显示默认说明。</Alert>}
      <Card variant="outlined" sx={glassCardSx}>
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          {query.data ? (
            <MarkdownView content={query.data.contentMd} />
          ) : (
            <MarkdownView content={"这里是运阳的小窝，记录代码、部署、科研和日常。"} />
          )}
        </CardContent>
      </Card>
    </PublicPageLayout>
  );
}
