import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSiteConfig } from "../context/SiteConfigProvider";

export const Footer = () => {
  const siteConfig = useSiteConfig();
  const theme = useTheme();
  return (
    <Box
      component="footer"
      sx={{
        py: { xs: 2.5, md: 3 },
        px: 2,
        mt: "auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            p: { xs: 2, md: 2.4 },
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.28 : 0.46),
            border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
            backdropFilter: "blur(16px)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {siteConfig.title}. Built with Cloudflare.
          </Typography>
          <Stack direction="row" spacing={2.4} useFlexGap flexWrap="wrap">
            <Link
              href="https://github.com/NekroAI/nekro-edge-template"
              target="_blank"
              rel="noopener"
              variant="body2"
              color="text.secondary"
            >
              GitHub
            </Link>
            <Link href="https://edge.nekro.ai" target="_blank" rel="noopener" variant="body2" color="text.secondary">
              Demo
            </Link>
            <Link href="https://cloudflare.com" target="_blank" rel="noopener" variant="body2" color="text.secondary">
              Cloudflare
            </Link>
            {siteConfig.icpConfig && (
              <Link href={siteConfig.icpConfig.link} target="_blank" rel="noopener" variant="body2" color="text.secondary">
                {siteConfig.icpConfig.name}
              </Link>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};
