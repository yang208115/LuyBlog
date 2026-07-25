import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthResponseSchema, UserInfoSchema } from "../../../common/validators/auth.schema";
import { useAuth } from "../hooks/useAuth";
import { safeLocalStorage } from "../utils/storage";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { refetch } = useAuth();
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (isProcessing.current) return;
      isProcessing.current = true;

      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const expectedState = safeLocalStorage.getItem("github_oauth_state");
      safeLocalStorage.removeItem("github_oauth_state");

      if (!code || !state || !expectedState || state !== expectedState) {
        navigate("/");
        return;
      }

      try {
        const response = await fetch(`/api/auth/github/callback?code=${code}&state=${state}`);
        const data: z.infer<typeof AuthResponseSchema> = await response.json();
        if (data.success && data.data) {
          safeLocalStorage.setItem("auth_token", data.data.sessionToken);
          queryClient.setQueryData<z.infer<typeof UserInfoSchema>>(["auth", "user"], data.data.user);
          await refetch();
        }
      } catch {
        // The callback always returns home; failed authentication simply leaves
        // the visitor signed out.
      } finally {
        navigate("/");
      }
    };

    void handleAuthCallback();
  }, [location, navigate, queryClient, refetch]);

  return (
    <div className="page-shell reading">
      <div className="status-page">
        <section className="status-card">
          <div className="loader" />
          <span className="eyebrow">AUTHENTICATING</span>
          <h1>正在确认身份</h1>
          <p>验证完成后将自动返回首页，请稍候。</p>
        </section>
      </div>
    </div>
  );
}
