import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const routeAfterAuth = (u: { role?: string; onboarded?: boolean }) => {
    if (u.role === "admin") return navigate({ to: "/admin" });
    navigate({ to: u.onboarded ? "/app" : "/onboarding" });
  };

  useEffect(() => {
    if (user) routeAfterAuth(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    const { error, user: u } = await signIn(email.trim(), password);
    setBusy(false);
    if (error || !u) {
      toast.error(error ?? "Sign in failed");
      return;
    }
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
                required
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
            disabled={busy}
            className="w-full h-12 rounded-lg font-bold text-[#05080F] bg-[#00D97E] hover:bg-[#00c472] transition-colors disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-sm text-[#8892A4]">
        Don't have an account?{" "}
        <Link to="/signup" className="text-[#00D97E] hover:underline">Start free trial →</Link>
      </p>
    </div>
  );
}
