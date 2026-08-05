import React from "react";
import "./aspen.css";

/* AspenLogin — ported from the Aspen design (Aspen Login.dc.html).
   Target in this repo: src/routes/login.tsx
   Styling is Tailwind utilities against the Aspen tokens, which live in the
   @theme block of src/styles.css (this app is on Tailwind v4 — no JS config).
   Dynamic (data-driven) values stay in style={{}} — they cannot be classes.
   Pseudo-states are .ahN rules in aspen.css.

   renderVals() is the data seam. Props let the route drive it:
     onSubmit(email, password)  real sign-in; omit for the design-only stub
     busy                       route-owned pending state
     notice                     route-owned error/status message */

type AspenLoginProps = {
  onSubmit?: (email: string, password: string) => void;
  busy?: boolean;
  notice?: string;
};

export default class AspenLogin extends React.Component<AspenLoginProps, any> {
  state: any = { email: "", password: "", show: false, busy: false, notice: "" };
  renderVals(): any {
    const { onSubmit, busy: busyProp, notice: noticeProp } = this.props ?? {};
    const busy = busyProp ?? this.state.busy;
    // A local validation message always wins over the route's status text.
    const notice = this.state.notice || noticeProp || "";

    const go = () => {
      if (busy) return;
      if (!this.state.email.trim() || !this.state.password) {
        this.setState({ notice: "Enter your work email and password to continue." });
        return;
      }
      if (onSubmit) {
        this.setState({ notice: "" });
        onSubmit(this.state.email.trim(), this.state.password);
        return;
      }
      // Design-only fallback, used when the component renders without a route.
      this.setState({ busy: true, notice: "" });
      setTimeout(
        () =>
          this.setState({
            busy: false,
            notice:
              "Aspen is in private early access — your workspace opens when your cohort starts.",
          }),
        900,
      );
    };
    return {
      email: this.state.email,
      password: this.state.password,
      notice,
      pwType: this.state.show ? "text" : "password",
      pwLabel: this.state.show ? "Hide" : "Show",
      buttonLabel: busy ? "Signing in…" : "Log in",
      setEmail: (e: React.ChangeEvent<HTMLInputElement>) =>
        this.setState({ email: e.target.value, notice: "" }),
      setPassword: (e: React.ChangeEvent<HTMLInputElement>) =>
        this.setState({ password: e.target.value, notice: "" }),
      toggle: () => this.setState((s: any) => ({ show: !s.show })),
      onKey: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") go();
      },
      submit: go,
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="aspen-scope min-h-screen bg-cream flex flex-col">
        <nav className="flex items-center justify-between max-w-[1240px] w-full mx-auto p-[20px_32px] box-border">
          <a href="/" className="flex items-center gap-[10px]">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[18px]">
              a
            </div>
            <span className="font-heading font-extrabold text-[21px] tracking-[-0.02em]">
              aspen
            </span>
          </a>
          <a href="/signup" className="text-[15px] font-semibold">
            Get early access →
          </a>
        </nav>

        <div className="flex-1 flex items-center justify-center p-[40px_24px_80px]">
          <div className="w-full max-w-[440px]">
            <h1 className="font-heading font-extrabold text-[40px] tracking-[-0.03em] leading-[1.05] m-0 text-center">
              Welcome back
            </h1>
            <p className="text-[16px] text-subtle m-[12px_0_0] text-center">
              Sign in to your Aspen workspace.
            </p>

            <div className="bg-surface border-[1.5px] border-border rounded-[24px] p-[32px] mt-[32px] shadow-[0_24px_60px_rgba(23,20,30,0.07)]">
              <label
                htmlFor="email"
                className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle mb-[8px]"
              >
                WORK EMAIL
              </label>
              <input
                id="email"
                type="email"
                value={v.email}
                onChange={v.setEmail}
                placeholder="you@company.com"
                className="w-full box-border h-[50px] p-[0_16px] rounded-[13px] border-[1.5px] border-border bg-cream text-[15.5px] text-dark outline-none"
              />

              <label
                htmlFor="password"
                className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[20px_0_8px]"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={v.pwType}
                  value={v.password}
                  onChange={v.setPassword}
                  onKeyDown={v.onKey}
                  placeholder="••••••••"
                  className="w-full box-border h-[50px] p-[0_74px_0_16px] rounded-[13px] border-[1.5px] border-border bg-cream text-[15.5px] text-dark outline-none"
                />
                <button
                  onClick={v.toggle}
                  className="absolute right-[8px] top-[8px] h-[34px] p-[0_12px] border-0 bg-transparent font-sans text-[13px] font-bold text-subtle cursor-pointer ah46"
                >
                  {v.pwLabel}
                </button>
              </div>

              <div className="flex justify-end mt-[12px]">
                <a href="#" className="text-[13.5px] font-semibold text-subtle">
                  Forgot password?
                </a>
              </div>

              <button
                onClick={v.submit}
                className="w-full mt-[22px] h-[52px] border-0 rounded-[14px] bg-accent text-cream font-sans text-[16px] font-bold cursor-pointer ah47"
              >
                {v.buttonLabel}
              </button>

              {v.notice ? (
                <>
                  <div className="mt-[16px] bg-tint rounded-[13px] p-[14px_16px] text-[14px] leading-[1.5] text-accent-ink">
                    {v.notice}
                  </div>
                </>
              ) : null}
            </div>

            <p className="text-center text-[15px] text-subtle m-[24px_0_0]">
              Don't have an account?{" "}
              <a href="/signup" className="font-bold text-accent">
                Get early access →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
