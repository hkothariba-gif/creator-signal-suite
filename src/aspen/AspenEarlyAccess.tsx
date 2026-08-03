import React from 'react';
import './aspen.css';

/* AspenEarlyAccess — ported from the Aspen design (Aspen Early Access.dc.html).
   Target in this repo: src/routes/signup.tsx
   Styling is Tailwind utilities against the Aspen tokens, which live in the
   @theme block of src/styles.css (this app is on Tailwind v4 — no JS config).
   Dynamic (data-driven) values stay in style={{}} — they cannot be classes.
   Pseudo-states are .ahN rules in aspen.css.

   DEVIATION FROM THE DESIGN: a PASSWORD field was added. /signup in this repo
   creates a real Supabase account (signUp needs a password) and is the only
   route into onboarding and the app. The design is a pure waitlist capture,
   which would have left the app unreachable. Delete the field and drop the
   `password` key from onSubmit to go back to waitlist-only.

   renderVals() is the data seam. Props let the route drive it:
     onSubmit({ company, email, password, brief, segment })
     busy / error / done        route-owned status */

type EarlyAccessSubmission = {
  company: string;
  email: string;
  password: string;
  brief: string;
  segment: string | null;
};

type AspenEarlyAccessProps = {
  onSubmit?: (values: EarlyAccessSubmission) => void;
  busy?: boolean;
  error?: string;
  done?: boolean;
};

export default class AspenEarlyAccess extends React.Component<AspenEarlyAccessProps, any> {
  state: any = { company: '', email: '', password: '', brief: '', segment: -1, busy: false, done: false, error: '' };
  segmentLabels = ['B2B / vertical SaaS', 'Startup', 'Coach or expert', 'Agency'];
  renderVals(): any {
    const { onSubmit, busy: busyProp, error: errorProp, done: doneProp } = this.props ?? {};
    const busy = busyProp ?? this.state.busy;
    const done = doneProp ?? this.state.done;
    // A local validation message always wins over the route's status text.
    const error = this.state.error || errorProp || '';

    const go = () => {
      if (busy) return;
      if (!this.state.company.trim() || !this.state.email.trim()) {
        this.setState({ error: 'Add your company and work email so we know who to bring in.' });
        return;
      }
      if (onSubmit) {
        if (this.state.password.length < 6) {
          this.setState({ error: 'Choose a password of at least 6 characters.' });
          return;
        }
        this.setState({ error: '' });
        onSubmit({
          company: this.state.company.trim(),
          email: this.state.email.trim(),
          password: this.state.password,
          brief: this.state.brief,
          segment: this.state.segment >= 0 ? this.segmentLabels[this.state.segment] : null,
        });
        return;
      }
      // Design-only fallback, used when the component renders without a route.
      this.setState({ busy: true, error: '' });
      setTimeout(() => this.setState({ busy: false, done: true }), 800);
    };
    return {
      company: this.state.company,
      email: this.state.email,
      password: this.state.password,
      brief: this.state.brief,
      error,
      done,
      notDone: !done,
      buttonLabel: busy ? 'Adding you…' : 'Get early access',
      segments: this.segmentLabels.map((label, i) => ({
        label,
        bg: this.state.segment === i ? '#17141E' : '#FAF7F1',
        fg: this.state.segment === i ? '#FAF7F1' : '#4A4553',
        bd: this.state.segment === i ? '#17141E' : '#E8E2D6',
        select: () => this.setState({ segment: i }),
      })),
      setCompany: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ company: e.target.value, error: '' }),
      setEmail: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ email: e.target.value, error: '' }),
      setPassword: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ password: e.target.value, error: '' }),
      setBrief: (e: React.ChangeEvent<HTMLTextAreaElement>) => this.setState({ brief: e.target.value }),
      submit: go,
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="aspen-scope min-h-screen bg-cream">
        <nav className="flex items-center justify-between max-w-[1240px] w-full mx-auto p-[20px_32px] box-border">
          <a href="/" className="flex items-center gap-[10px]">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[18px]">a</div>
            <span className="font-heading font-extrabold text-[21px] tracking-[-0.02em]">aspen</span>
          </a>
          <a href="/login" className="text-[15px] font-semibold">Log in</a>
        </nav>
      
        <div className="max-w-[1180px] mx-auto p-[40px_32px_90px] flex gap-[64px] flex-wrap items-start">
          <div className="flex-[1_1_420px] min-w-[300px]">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent">EARLY ACCESS</div>
            <h1 className="font-heading font-extrabold text-[clamp(38px,4.6vw,60px)] tracking-[-0.035em] leading-[1.03] m-[14px_0_0] max-w-[520px] text-balance">Get on the list. Open your workspace first.</h1>
            <p className="text-[17.5px] text-muted leading-[1.55] m-[20px_0_0] max-w-[460px]">We're opening Aspen in cohorts this quarter. Tell us who you are and we'll bring you in with the next one.</p>
      
            <div className="flex flex-col gap-[18px] mt-[36px] max-w-[460px]">
              <div className="flex gap-[16px] items-start">
                <div className="w-[30px] h-[30px] rounded-[10px] bg-tint text-accent-ink grid place-items-center font-extrabold text-[13px] shrink-0">1</div>
                <div><div className="font-bold text-[16px]">Onboarding with our team</div><div className="text-[14.5px] text-muted leading-[1.5] mt-[2px]">We set up your first campaign with you, on a call.</div></div>
              </div>
              <div className="flex gap-[16px] items-start">
                <div className="w-[30px] h-[30px] rounded-[10px] bg-tint text-accent-ink grid place-items-center font-extrabold text-[13px] shrink-0">2</div>
                <div><div className="font-bold text-[16px]">Launch pricing locked for 12 months</div><div className="text-[14.5px] text-muted leading-[1.5] mt-[2px]">Whatever we launch at, you keep for a year.</div></div>
              </div>
              <div className="flex gap-[16px] items-start">
                <div className="w-[30px] h-[30px] rounded-[10px] bg-tint text-accent-ink grid place-items-center font-extrabold text-[13px] shrink-0">3</div>
                <div><div className="font-bold text-[16px]">A say in what we build next</div><div className="text-[14.5px] text-muted leading-[1.5] mt-[2px]">Early cohorts shape the roadmap — Instagram and TikTok included.</div></div>
              </div>
            </div>
      
            <img src="/aspen/workspace.webp" alt="The Aspen workspace — discovery, affiliates and ads in one place" className="w-full max-w-[460px] mt-[40px] block rounded-[18px]" loading="lazy" />
          </div>
      
          <div className="flex-[1_1_400px] min-w-[300px] max-w-[460px]">
            <div className="bg-surface border-[1.5px] border-border rounded-[24px] p-[32px] shadow-[0_24px_60px_rgba(23,20,30,0.07)]">
              {v.done ? (<>
                <div>
                  <div className="w-[46px] h-[46px] rounded-[14px] bg-highlight grid place-items-center font-heading font-extrabold text-[22px]">✓</div>
                  <h2 className="font-heading font-extrabold text-[26px] tracking-[-0.02em] m-[18px_0_0]">You're on the list</h2>
                  <p className="text-[15.5px] text-muted leading-[1.6] m-[12px_0_0]">We'll email you when your cohort opens. Want a head start? Set up your first campaign brief now — it takes two minutes.</p>
                  <a href="/onboarding"  className="block text-center mt-[22px] bg-accent text-cream text-[16px] font-bold p-[15px_0] rounded-[14px] ah48">Start your campaign brief →</a>
                </div>
              </>) : null}
              {v.notDone ? (<>
                <div>
                  <h2 className="font-heading font-extrabold text-[24px] tracking-[-0.02em] m-0">Request early access</h2>
                  <label htmlFor="company" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[24px_0_8px]">COMPANY</label>
                  <input id="company" value={v.company} onChange={v.setCompany} placeholder="Acme Inc." className="w-full box-border h-[50px] p-[0_16px] rounded-[13px] border-[1.5px] border-border bg-cream text-[15.5px] text-dark outline-none" />
      
                  <label htmlFor="email" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[20px_0_8px]">WORK EMAIL</label>
                  <input id="email" type="email" value={v.email} onChange={v.setEmail} placeholder="you@company.com" className="w-full box-border h-[50px] p-[0_16px] rounded-[13px] border-[1.5px] border-border bg-cream text-[15.5px] text-dark outline-none" />
      
                  {/* Added to the design — see the DEVIATION note at the top of this file. */}
                  <label htmlFor="password" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[20px_0_8px]">PASSWORD</label>
                  <input id="password" type="password" value={v.password} onChange={v.setPassword} placeholder="At least 6 characters" className="w-full box-border h-[50px] p-[0_16px] rounded-[13px] border-[1.5px] border-border bg-cream text-[15.5px] text-dark outline-none" />

                  <div className="text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[22px_0_10px]">WHAT DO YOU SELL?</div>
                  <div className="flex gap-[8px] flex-wrap">
                    {(v.segments || []).map((s: any, $index: number) => (<React.Fragment key={$index}>
                      <button onClick={s.select} className="font-sans text-[13.5px] font-semibold p-[10px_15px] rounded-[11px] cursor-pointer" style={{ border: `1.5px solid ${s.bd}`, background: s.bg, color: s.fg }}>{s.label}</button>
                    </React.Fragment>))}
                  </div>
      
                  <label htmlFor="brief" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[22px_0_8px]">WHO ARE YOU TRYING TO REACH? <span className="font-semibold tracking-[0]">(optional)</span></label>
                  <textarea id="brief" value={v.brief} onChange={v.setBrief} placeholder="e.g. HR leaders at 200–2,000 person companies in the US" rows={3} className="w-full box-border p-[14px_16px] rounded-[13px] border-[1.5px] border-border bg-cream font-sans text-[15px] leading-[1.5] text-dark outline-none resize-y"></textarea>
      
                  <button onClick={v.submit}  className="w-full mt-[24px] h-[54px] border-0 rounded-[14px] bg-accent text-cream font-sans text-[16.5px] font-bold cursor-pointer ah49">{v.buttonLabel}</button>
                  {v.error ? (<>
                    <div className="mt-[14px] text-[14px] font-semibold text-accent-ink">{v.error}</div>
                  </>) : null}
                  <p className="text-[13px] text-subtle m-[16px_0_0] leading-[1.5]">No credit card, no contract. Enterprise team? <a href="#" className="font-bold text-accent">Talk to us</a>.</p>
                </div>
              </>) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
