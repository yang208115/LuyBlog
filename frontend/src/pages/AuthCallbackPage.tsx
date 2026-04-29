import { Box, Card, CardContent, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { AuthResponseSchema, UserInfoSchema } from "../../../common/validators/auth.schema";
import { useRef } from "react";
import { z } from "zod";
import { safeLocalStorage } from "../utils/storage";

export function AuthCallbackPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { refetch } = useAuth();
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (isProcessing.current) {
        return;
      }
      isProcessing.current = true;

      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (!code || !state) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(`/api/auth/github/callback?code=${code}&state=${state}`);
        const data: z.infer<typeof AuthResponseSchema> = await response.json();

        if (data.success && data.data) {
          // 1. 设置 token 到 localStorage (会触发 auth_token_changed 事件)
          safeLocalStorage.setItem("auth_token", data.data.sessionToken);
          // 2. 设置用户数据到 QueryClient 缓存
          queryClient.setQueryData<z.infer<typeof UserInfoSchema>>(["auth", "user"], data.data.user);
          // 3. 触发 refetch 以确保状态同步
          await refetch();
          // 4. 导航到控制台页面
          navigate("/dashboard");
        } else {
          console.error("Authentication failed:", data.message);
          navigate("/");
        }
      } catch (error) {
        console.error("Error during auth callback:", error);
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [location, navigate, queryClient, refetch]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: theme.pageBackground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          backgroundColor: theme.glass.background,
          backdropFilter: "blur(14px)",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: `0 10px 30px ${alpha(theme.palette.common.black, theme.palette.mode === "dark" ? 0.25 : 0.08)}`,
        }}
      >
        <CardContent sx={{ py: 4 }}>
          <Stack spacing={1.6} alignItems="center" textAlign="center">
            <CircularProgress />
            <Typography sx={{ fontWeight: 600 }}>正在验证您的身份，请稍候...</Typography>
            <Typography variant="body2" color="text.secondary">
              验证完成后将自动跳转到控制台。
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
