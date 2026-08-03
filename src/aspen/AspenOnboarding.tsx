import React from 'react';
import './aspen.css';

/* AspenOnboarding — ported from the Aspen design (Aspen Onboarding.dc.html).
   Target in this repo: src/routes/onboarding.tsx
   Styling is Tailwind utilities against the Aspen tokens, which live in the
   @theme block of src/styles.css (this app is on Tailwind v4 — no JS config).
   Dynamic (data-driven) values stay in style={{}} — they cannot be classes.
   Pseudo-states are .ahN rules in aspen.css.

   DEVIATION FROM THE DESIGN: the two upload controls are now real file inputs.
   The design's "+ Add file" fabricated a filename string and "Upload .csv" set
   a boolean, because it had no data layer. The route uploads these to Supabase
   storage for real, so `docs` holds File[] and `sheet` holds File | null.
   The controls keep the design's exact styling — a <label> wrapping a hidden
   <input type="file">.

   renderVals() is the data seam. Props let the route drive it:
     onFinish({ brief, notes, age, seniority, deal, platforms, docs, sheet })
     busy / done                route-owned status
     maxFileBytes, onFileError  per-file size guard (route shows the toast) */

type OnboardingSubmission = {
  brief: string;
  notes: string;
  age: string;
  seniority: string;
  deal: string;
  platforms: { youtube: boolean; reddit: boolean; x: boolean; linkedin: boolean };
  docs: File[];
  sheet: File | null;
};

type AspenOnboardingProps = {
  onFinish?: (values: OnboardingSubmission) => void;
  busy?: boolean;
  done?: boolean;
  maxFileBytes?: number;
  onFileError?: (message: string) => void;
  /* Seeds the step-1 brief — the landing hero prompt is carried in this way. */
  initialBrief?: string;
};

export default class AspenOnboarding extends React.Component<AspenOnboardingProps, any> {
  state: any = {
    step: 1, brief: this.props?.initialBrief ?? '', notes: '', age: '25-34', seniority: 'Any', deal: 'Any',
    docs: [] as File[], sheet: null as File | null,
    picked: { youtube: true, reddit: true, x: true, linkedin: false }, busy: false,
  };

  /* Rejects anything over the route's limit through onFileError, so the size
     rule and its toast stay owned by the route. */
  acceptFiles(picked: File[]): File[] {
    const max = this.props?.maxFileBytes;
    if (!max) return picked;
    return picked.filter((f) => {
      if (f.size > max) {
        this.props?.onFileError?.(`${f.name} is too large (max ${Math.round(max / (1024 * 1024))}MB)`);
        return false;
      }
      return true;
    });
  }
  platformMeta = [
    { key: 'youtube', label: 'YouTube', glyph: '▶', color: '#F03', sub: 'Long form · high intent' },
    { key: 'reddit', label: 'Reddit', glyph: 'r/', color: '#FF4500', sub: 'Community trust · cheap clicks' },
    { key: 'x', label: 'X', glyph: 'X', color: '#17141E', sub: 'Niche authority · live' },
    { key: 'linkedin', label: 'LinkedIn', glyph: 'in', color: '#0A66C2', sub: 'B2B · director+ reach' },
  ];
  renderVals(): any {
    const s = this.state;
    const total = 2;
    const { onFinish, busy: busyProp, done: doneProp } = this.props ?? {};
    const busy = busyProp ?? s.busy;
    const isDone = doneProp ?? s.step === 3;
    return {
      progress: s.step === 1 ? '50%' : '100%',
      stepLabel: s.step > total ? 'Done' : 'Step ' + s.step + ' of ' + total,
      isStep1: !isDone && s.step === 1,
      isStep2: !isDone && s.step === 2,
      isDone,
      brief: s.brief, notes: s.notes, age: s.age, seniority: s.seniority, deal: s.deal,
      nextOpacity: s.brief.trim() ? '1' : '0.45',
      sheetLabel: s.sheet ? 'Replace file' : 'Upload .csv',
      sheetName: s.sheet ? s.sheet.name : '',
      finishLabel: busy ? 'Creating your campaign…' : 'Create your first campaign →',
      docs: s.docs.map((f: File, i: number) => ({
        name: f.name,
        remove: () => this.setState((st: any) => ({ docs: st.docs.filter((_: File, j: number) => j !== i) })),
      })),
      platforms: this.platformMeta.map(p => {
        const on = s.picked[p.key];
        return {
          label: p.label, glyph: p.glyph, color: p.color, sub: p.sub,
          bg: on ? '#fff' : '#F5F1E9',
          bd: on ? p.color : '#E8E2D6',
          tick: on ? '✓' : '+',
          tickColor: on ? p.color : '#B5AFA3',
          toggle: () => this.setState((st: any) => ({ picked: { ...st.picked, [p.key]: !st.picked[p.key] } })),
        };
      }),
      setBrief: (e: React.ChangeEvent<HTMLTextAreaElement>) => this.setState({ brief: e.target.value }),
      setNotes: (e: React.ChangeEvent<HTMLTextAreaElement>) => this.setState({ notes: e.target.value }),
      setAge: (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({ age: e.target.value }),
      setSeniority: (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({ seniority: e.target.value }),
      setDeal: (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({ deal: e.target.value }),
      addDoc: (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = Array.from(e.target.files ?? []);
        e.target.value = ''; // let the same file be re-picked after a remove
        const kept = this.acceptFiles(picked);
        if (kept.length) this.setState((st: any) => ({ docs: [...st.docs, ...kept] }));
      },
      addSheet: (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        e.target.value = '';
        if (!picked) return;
        const kept = this.acceptFiles([picked]);
        if (kept.length) this.setState({ sheet: kept[0] });
      },
      clearSheet: () => this.setState({ sheet: null }),
      next: () => { if (this.state.brief.trim()) this.setState({ step: 2 }); },
      back: () => this.setState({ step: 1 }),
      finish: () => {
        if (busy) return;
        if (onFinish) {
          onFinish({
            brief: s.brief, notes: s.notes, age: s.age, seniority: s.seniority, deal: s.deal,
            platforms: s.picked, docs: s.docs, sheet: s.sheet,
          });
          return;
        }
        // Design-only fallback, used when the component renders without a route.
        this.setState({ busy: true });
        setTimeout(() => this.setState({ busy: false, step: 3 }), 1100);
      },
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="aspen-scope min-h-screen bg-cream">
        <div className="h-[4px] bg-border">
          <div className="h-[4px] bg-accent" style={{ transition: "width 0.5s ease", width: v.progress }}></div>
        </div>
      
        <nav className="flex items-center justify-between max-w-[760px] mx-auto p-[20px_24px]">
          <a href="/" className="flex items-center gap-[10px]">
            <div className="w-[28px] h-[28px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[16px]">a</div>
            <span className="font-heading font-extrabold text-[19px] tracking-[-0.02em]">aspen</span>
          </a>
          <span className="text-[13px] font-semibold text-subtle">{v.stepLabel}</span>
        </nav>
      
        <div className="max-w-[760px] mx-auto p-[24px_24px_100px]">
      
          {v.isStep1 ? (<>
            <div>
              <h1 className="font-heading font-extrabold text-[clamp(32px,4vw,44px)] tracking-[-0.03em] leading-[1.05] m-0">Tell us about your product</h1>
              <p className="text-[16.5px] text-muted leading-[1.6] m-[14px_0_0] max-w-[560px]">Everything here becomes your first campaign — creator matching, audience scoring, and the ads you build all read from it. Write freely, or attach a doc.</p>
      
              <textarea value={v.brief} onChange={v.setBrief} placeholder="Describe your product, your brand, and who you're trying to reach — as much detail as you like…" rows={7} className="w-full box-border mt-[28px] p-[20px] rounded-[18px] border-[1.5px] border-border bg-surface text-[16px] leading-[1.6] text-dark outline-none resize-y"></textarea>
      
              <div className="mt-[16px] border-[1.5px] border-dashed border-sand-line rounded-[16px] bg-surface p-[18px_20px] flex items-center justify-between gap-[16px] flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">Attach product or brand docs</div>
                  <div className="text-[13.5px] text-subtle mt-[2px]">PDF, TXT or MD — optional. We pull real excerpts into your ad corpus, so drafts quote you, not us.</div>
                </div>
                <label htmlFor="aspen-brand-docs" className="inline-block border-[1.5px] border-dark bg-transparent font-sans text-[14px] font-bold p-[11px_18px] rounded-[12px] cursor-pointer whitespace-nowrap ah50">+ Add file</label>
                <input id="aspen-brand-docs" type="file" multiple accept=".pdf,.txt,.md" onChange={v.addDoc} className="hidden" />
              </div>
      
              {(v.docs || []).map((d: any, $index: number) => (<React.Fragment key={$index}>
                <div className="mt-[10px] bg-surface border-[1.5px] border-border rounded-[13px] p-[13px_16px] flex items-center justify-between gap-[12px]">
                  <span className="text-[14.5px] font-semibold">{d.name}</span>
                  <button onClick={d.remove}  className="border-0 bg-transparent font-sans text-[13px] font-bold text-subtle cursor-pointer ah51">Remove</button>
                </div>
              </React.Fragment>))}
      
              <div className="flex justify-center mt-[40px]">
                <button onClick={v.next}  style={{ opacity: v.nextOpacity }} className="border-0 bg-accent text-cream font-sans text-[16.5px] font-bold p-[16px_40px] rounded-[14px] cursor-pointer ah52">Continue →</button>
              </div>
            </div>
          </>) : null}
      
          {v.isStep2 ? (<>
            <div>
              <button onClick={v.back}  className="border-0 bg-transparent font-sans text-[13.5px] font-bold text-subtle cursor-pointer p-0 mb-[20px] ah53">← Back</button>
              <h1 className="font-heading font-extrabold text-[clamp(32px,4vw,44px)] tracking-[-0.03em] leading-[1.05] m-0">Describe your ideal buyer</h1>
              <p className="text-[16.5px] text-muted leading-[1.6] m-[14px_0_0] max-w-[560px]">We score every creator's audience against this before you spend a cent.</p>
      
              <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px] mt-[28px]">
                <div>
                  <label htmlFor="age" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle mb-[8px]">AGE RANGE</label>
                  <select id="age" value={v.age} onChange={v.setAge} className="w-full h-[48px] p-[0_14px] rounded-[13px] border-[1.5px] border-border bg-surface text-[15px] text-dark outline-none">
                    <option value="18-24">18–24</option>
                    <option value="25-34">25–34</option>
                    <option value="35-44">35–44</option>
                    <option value="45-54">45–54</option>
                    <option value="55+">55+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="seniority" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle mb-[8px]">SENIORITY</label>
                  <select id="seniority" value={v.seniority} onChange={v.setSeniority} className="w-full h-[48px] p-[0_14px] rounded-[13px] border-[1.5px] border-border bg-surface text-[15px] text-dark outline-none">
                    <option value="Any">Any</option>
                    <option value="Practitioner">Practitioner</option>
                    <option value="Manager">Manager</option>
                    <option value="Director+">Director+</option>
                    <option value="Founder / C-suite">Founder / C-suite</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="deal" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle mb-[8px]">TYPICAL DEAL SIZE</label>
                  <select id="deal" value={v.deal} onChange={v.setDeal} className="w-full h-[48px] p-[0_14px] rounded-[13px] border-[1.5px] border-border bg-surface text-[15px] text-dark outline-none">
                    <option value="Any">Any</option>
                    <option value="Under $1K">Under $1K</option>
                    <option value="$1K-$10K">$1K–$10K</option>
                    <option value="$10K-$50K">$10K–$50K</option>
                    <option value="$50K+">$50K+</option>
                  </select>
                </div>
              </div>
      
              <label htmlFor="notes" className="block text-[12.5px] font-bold tracking-[0.06em] text-subtle m-[24px_0_8px]">ANYTHING ELSE ABOUT THEM?</label>
              <textarea id="notes" value={v.notes} onChange={v.setNotes} placeholder="e.g. People ops leads who already run a tool they complain about" rows={3} className="w-full box-border p-[14px_16px] rounded-[15px] border-[1.5px] border-border bg-surface text-[15px] leading-[1.55] text-dark outline-none resize-y"></textarea>
      
              <div className="mt-[32px]">
                <div className="text-[12.5px] font-bold tracking-[0.06em] text-subtle">WHERE DO YOUR BUYERS HANG OUT?</div>
                <div className="text-[13.5px] text-subtle mt-[4px]">Pick every platform we should scout creators on.</div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[12px] mt-[16px]">
                  {(v.platforms || []).map((p: any, $index: number) => (<React.Fragment key={$index}>
                    <button onClick={p.toggle} className="text-left cursor-pointer p-[18px] rounded-[18px] font-sans" style={{ border: `1.5px solid ${p.bd}`, background: p.bg }}>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-[9px]">
                          <span className="w-[26px] h-[26px] rounded-[8px] text-surface grid place-items-center font-extrabold text-[11px]" style={{ background: p.color }}>{p.glyph}</span>
                          <span className="font-bold text-[15.5px] text-dark">{p.label}</span>
                        </span>
                        <span className="text-[15px] font-extrabold" style={{ color: p.tickColor }}>{p.tick}</span>
                      </div>
                      <div className="text-[13px] text-subtle mt-[8px]">{p.sub}</div>
                    </button>
                  </React.Fragment>))}
                </div>
              </div>
      
              <div className="mt-[28px] border-[1.5px] border-dashed border-sand-line rounded-[16px] bg-surface p-[18px_20px] flex items-center justify-between gap-[16px] flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">Audience lookalike sheet</div>
                  <div className="text-[13.5px] text-subtle mt-[2px]">Optional. Upload a CSV of your best customers and we'll find creators whose audiences look like them.</div>
                </div>
                <label htmlFor="aspen-lookalike-sheet" className="inline-block border-[1.5px] border-dark bg-transparent font-sans text-[14px] font-bold p-[11px_18px] rounded-[12px] cursor-pointer whitespace-nowrap ah54">{v.sheetLabel}</label>
                <input id="aspen-lookalike-sheet" type="file" accept=".csv,.tsv,.xls,.xlsx" onChange={v.addSheet} className="hidden" />
              </div>

              {v.sheetName ? (<>
                <div className="mt-[10px] bg-surface border-[1.5px] border-border rounded-[13px] p-[13px_16px] flex items-center justify-between gap-[12px]">
                  <span className="text-[14.5px] font-semibold">{v.sheetName}</span>
                  <button onClick={v.clearSheet} className="border-0 bg-transparent font-sans text-[13px] font-bold text-subtle cursor-pointer ah51">Remove</button>
                </div>
              </>) : null}
      
              <button onClick={v.finish}  className="w-full mt-[36px] border-0 bg-accent text-cream font-sans text-[17px] font-bold p-[18px_0] rounded-[15px] cursor-pointer ah55">{v.finishLabel}</button>
              <p className="text-center text-[13.5px] text-subtle leading-[1.55] m-[14px_0_0]">You'll land in the Ads Center with this campaign selected. Connect your store and payouts later from Settings.</p>
            </div>
          </>) : null}
      
          {v.isDone ? (<>
            <div className="text-center p-[40px_0]">
              <div className="w-[52px] h-[52px] rounded-[16px] bg-highlight grid place-items-center font-heading font-extrabold text-[24px] mx-auto">✓</div>
              <h1 className="font-heading font-extrabold text-[clamp(30px,3.6vw,42px)] tracking-[-0.03em] leading-[1.05] m-[22px_0_0]">Your first campaign is ready</h1>
              <p className="text-[16.5px] text-muted leading-[1.6] m-[14px_auto_0] max-w-[460px]">We're scoring creators against your brief now. When your cohort opens, this is the first thing you'll see.</p>
              <img src="/aspen/signal.webp" alt="Clay world map of creator districts across four platforms" className="w-full max-w-[520px] m-[32px_auto_0] block rounded-[18px]" loading="lazy" />
              <div className="flex justify-center gap-[12px] mt-[32px] flex-wrap">
                <a href="/"  className="bg-dark text-cream text-[16px] font-bold p-[15px_28px] rounded-[14px] ah56">Back to Aspen</a>
                <a href="/tour"  className="border-[2px] border-dark text-[16px] font-bold p-[13px_26px] rounded-[14px] ah57">Take the 60-second tour →</a>
              </div>
            </div>
          </>) : null}
        </div>
      </div>
    );
  }
}
