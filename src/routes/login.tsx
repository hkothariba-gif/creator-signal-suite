import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const routeAfterAuth = (u: { role?: string; onboarded?: boolean }) => {
    if (u.role === "admin") return navigate({ to: "/admin" });
    try {
      const raw = localStorage.getItem("ar_intent");
      if (raw) {
        const intent = JSON.parse(raw);
        if (intent?.savedAt && Date.now() - intent.savedAt < 1800000) {
          return navigate({ to: "/onboarding" });
        }
      }
    } catch {}
    navigate({ to: u.onboarded ? "/app" : "/onboarding" });
  };

  useEffect(() => {
    if (user) routeAfterAuth(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const u = login(email);
    routeAfterAuth(u);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 0% 100%, rgba(0,217,126,0.3) 0%, transparent 60%), #05080F",
      }}
    >
      <div className="mb-8 animate-[fadeIn_0.6s_ease]">
        <span className="text-2xl font-extrabold tracking-tight text-white">
          Aspen<span className="text-[#00D97E]">Reach</span>
        </span>
      </div>

      <div
        className="w-full max-w-[420px] p-10 rounded-2xl"
        style={{ background: "#0C1222", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h1 className="text-[28px] font-bold text-[#F0F4FF]">Welcome back</h1>
        <p className="mt-1 text-sm text-[#8892A4]">Sign in to your AspenReach workspace</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8892A4] mb-1.5">Work email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 text-[#F0F4FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D97E]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#8892A4] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 rounded-lg bg-[#131D2E] border border-white/10 text-[#F0F4FF] placeholder:text-[#4B5563] focus:outline-none focus:border-[#00D97E]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892A4] hover:text-white"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-lg font-bold text-[#05080F] bg-[#00D97E] hover:bg-[#00c472] transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-[#4B5563]">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={submit as any}
          type="button"
          className="w-full h-12 rounded-lg font-semibold bg-white text-[#1A1A1A] hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continue with Google
        </button>
      </div>

      <p className="mt-6 text-sm text-[#8892A4]">
        Don't have an account?{" "}
        <Link to="/login" className="text-[#00D97E] hover:underline">Start free trial →</Link>
      </p>
    </div>
  );
}
