import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GitHub, EmailOutlined } from "@mui/icons-material";

type Skill = {
  name: string;
  percent: number;
};

const skills: Skill[] = [
  { name: "Python", percent: 95 },
  { name: "C++", percent: 60 },
  { name: "Java", percent: 30 },
  { name: "Next.js", percent: 10 },
  { name: "Linux", percent: 75 },
];

export function AboutPage() {
  const theme = useTheme();
  const [hitokoto, setHitokoto] = useState("加载中…");

  useEffect(() => {
    let cancelled = false;

    fetch("https://v1.hitokoto.cn?encode=json&c=b")
      .then((response) => response.json())
      .then((data) => {
        const text =
          typeof data === "object" && data !== null && "hitokoto" in data && typeof data.hitokoto === "string"
            ? data.hitokoto
            : "保持热爱，奔赴山海。";
        if (!cancelled) {
          setHitokoto(text);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHitokoto("保持热爱，奔赴山海。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cardSx = useMemo(
    () => ({
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
    }),
    [theme],
  );

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
          <Card sx={{ ...cardSx, p: { xs: 2.2, md: 3 } }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm="auto" sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-start" } }}>
                <Avatar
                  src="https://avatars.githubusercontent.com/u/132762661?v=4"
                  alt="运阳"
                  sx={{ width: 120, height: 120, boxShadow: `0 6px 24px ${alpha(theme.palette.common.black, 0.2)}` }}
                />
              </Grid>
              <Grid item xs>
                <Stack spacing={1.5} alignItems={{ xs: "center", sm: "flex-start" }} textAlign={{ xs: "center", sm: "left" }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Hi, I’m 运阳
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: { xs: "1rem", md: "1.05rem" } }}>
                    广州中职 • Python 爱好者 • 能写 C++ 能看懂 JAVA & Next.js
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton component={Link} href="https://github.com/yang208115" target="_blank" rel="noreferrer" color="primary">
                      <GitHub />
                    </IconButton>
                    <IconButton component={Link} href="mailto:a3305587173@outlook.com" color="primary">
                      <EmailOutlined />
                    </IconButton>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Card>

          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.3 }}>
                About me
              </Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.85 }}>
                现居广州，市属中职计算机专业在读。Python 是第一语言，GitHub 上的开源库几乎都用 Python
                写成；同时会用 C++，能看懂 JAVA 和 Next.js。喜欢把学到的知识立刻写成小工具，也热衷于记录踩坑过程。
              </Typography>
            </CardContent>
          </Card>

          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Skills
              </Typography>
              <Stack spacing={1.8}>
                {skills.map((skill) => (
                  <Stack key={skill.name} direction="row" spacing={1.5} alignItems="center">
                    <Typography sx={{ minWidth: 80, fontWeight: 600, fontSize: "0.95rem" }}>{skill.name}</Typography>
                    <Box
                      sx={{
                        flex: 1,
                        height: 9,
                        borderRadius: 999,
                        overflow: "hidden",
                        backgroundColor: alpha(theme.palette.text.primary, 0.12),
                      }}
                    >
                      <Box
                        sx={{
                          width: `${skill.percent}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        }}
                      />
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={cardSx}>
            <CardContent sx={{ p: { xs: 2.2, md: 3 }, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.2 }}>
                一言
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.8 }}>
                “{hitokoto}”
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
