import { Box, Card, CardContent, Container, Link, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

type FriendLink = {
  name: string;
  desc: string;
  url: string;
};

const friendLinks: FriendLink[] = [
  {
    name: "GitHub · 运阳",
    desc: "主要开源项目与代码仓库。",
    url: "https://github.com/yang208115",
  },
];

export function FriendsPage() {
  const theme = useTheme();

  const cardSx = {
    borderRadius: 3,
    backgroundColor: theme.glass.background,
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.palette.divider}`,
    transition: "all 0.25s ease",
    boxShadow: `0 8px 28px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.24 : 0.07)}`,
    "&:hover": {
      transform: "translateY(-2px)",
      borderColor: alpha(theme.palette.primary.main, 0.4),
      boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: theme.pageBackground,
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={2.2}>
          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                友链
              </Typography>
              <Typography color="text.secondary">这里放我常用和推荐的站点。</Typography>
            </CardContent>
          </Card>

          {friendLinks.map((item) => (
            <Card key={item.url} sx={cardSx}>
              <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
                <Stack spacing={1}>
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    underline="hover"
                    sx={{ fontSize: "1.1rem", fontWeight: 700, color: "text.primary", "&:hover": { color: "primary.main" } }}
                  >
                    {item.name}
                  </Link>
                  <Typography color="text.secondary">{item.desc}</Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
