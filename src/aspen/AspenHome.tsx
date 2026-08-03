import React from 'react';
import './aspen.css';

/* AspenHome — ported from the Aspen design (Aspen Home v8.dc.html).
   Target in this repo: src/routes/index.tsx (landing page)
   Styling is Tailwind utilities against the Aspen tokens, which live in the
   @theme block of src/styles.css (this app is on Tailwind v4 — no JS config).
   Dynamic (data-driven) values stay in style={{}} — they cannot be classes.
   Pseudo-states are .ahN rules in aspen.css. */

export default class AspenHome extends React.Component<any, any> {
  state: any = { query: '', searched: false, openFaq: -1, demoIdx: 0, demoTyping: false, manual: false, track: 0 };
  trackData = [
    { id: 'yt', label: 'YouTube', dot: '#F03', eyebrow: 'YOUTUBE TRACK', title: 'Find creators. Email them directly.',
      summary: 'The deepest creator index of the four, and the only one where you can usually reach someone on the first try.',
      bullets: ['Channel emails pulled straight from the YouTube Data API.', 'Brand-fit scoring ranks creators by how much their audience overlaps your ICP.', 'If email goes cold, the outreach cascade keeps working down the list.'] },
    { id: 'rd', label: 'Reddit', dot: '#FF4500', eyebrow: 'REDDIT TRACK', title: 'Turn signals into promoted posts.',
      summary: 'The cheapest clicks in the stack, aimed at people already arguing about your category.',
      bullets: ['Your YouTube performance data seeds the Reddit ad targeting.', 'Top-performing videos get matched to the subreddits that actually care.', 'Launch Promoted Posts to audiences your creator campaigns already warmed up.'] },
    { id: 'x', label: 'X', dot: '#17141E', eyebrow: 'X TRACK', title: 'DM creators. Whitelist their reach.',
      summary: 'Where founders, operators and developers spend their day — and where a good DM still works.',
      bullets: ['Find creators with open DMs whose followers mirror your buyer.', 'Personalised DM sequences drafted in your brand voice.', 'Whitelist the posts that land and run them as X Ads.'] },
    { id: 'li', label: 'LinkedIn', dot: '#0A66C2', eyebrow: 'LINKEDIN TRACK', title: 'Work with professional voices. Convert B2B.',
      summary: 'Slowest to build, closest to pipeline. The buying committee is already reading these people.',
      bullets: ['Target the voices and analysts your buying committee follows.', 'Draft review posts with the creator so they read as credible, not sponsored.', 'Track which posts influence pipeline, not just impressions.'] },
  ];

  demoQueries = ['HR SaaS, mid-market people teams', 'B2B fintech, CFO buyers', 'CLI tool for indie SaaS devs'];
  resultSets = [
    [
      { color: '#F03', glyph: '▶', name: 'The People Ops Show', meta: '318K subs · HR & people ops · 4.6% eng.', fit: 94, action: 'Get email' },
      { color: '#0A66C2', glyph: 'in', name: 'Dana Reyes · HR Brew columnist', meta: '92K followers · CHRO audience', fit: 91, action: 'Reach out' },
      { color: '#FF4500', glyph: 'r/', name: 'u/askamanager_mod', meta: 'r/humanresources · buyer-intent threads', fit: 88, action: 'Reach out' },
    ],
    [
      { color: '#0A66C2', glyph: 'in', name: 'Marcus Vale · The CFO Memo', meta: '134K followers · finance leadership', fit: 95, action: 'Reach out' },
      { color: '#F03', glyph: '▶', name: 'Finance Stack Weekly', meta: '208K subs · fintech reviews · 3.8% eng.', fit: 92, action: 'Get email' },
      { color: '#17141E', glyph: 'X', name: '@quietcompounder', meta: '96K on X · CFO & controller audience', fit: 89, action: 'DM' },
    ],
    [
      { color: '#F03', glyph: '▶', name: 'Tech With Priya', meta: '412K subs · dev tools · 4.1% eng.', fit: 94, action: 'Get email' },
      { color: '#FF4500', glyph: 'r/', name: 'u/ship_it_sam · r/SaaS mod', meta: '86K karma · high buyer-intent threads', fit: 91, action: 'Reach out' },
      { color: '#17141E', glyph: 'MK', name: 'Maya Kessler · @mayabuilds', meta: '118K on X · indie dev audience', fit: 89, action: 'DM' },
    ],
  ];
  renderVals(): any {
    const faqData = [
      { q: 'When does Aspen launch?', a: 'We open early access this quarter, in cohorts. Waitlist members get onboarding with our team, priority support, and launch pricing locked for 12 months.' },
      { q: 'Where do the industry statistics on this page come from?', a: 'Published industry research: Influencer Marketing Hub, Mordor Intelligence, Grand View Research, WARC, and platform SEC filings. They describe the creator marketing channel as a whole — full source list in the footer. Once we launch, we\u2019ll publish our own campaign benchmarks.' },
      { q: 'Which platforms does Aspen cover?', a: 'YouTube, Reddit, X, and LinkedIn — discovery, outreach, ad creation, and attribution across all four from one workspace. Instagram and TikTok are on the roadmap.' },
      { q: 'How does Aspen attribute revenue to creators?', a: 'Every creator gets tracked links, promo codes, and a signal feed (CTR, comments, engagement velocity). Ads built from those signals inherit the attribution chain, so ROAS traces back to the exact creator and post that inspired it.' },
    ];
    const ti = this.state.track;
    const active = this.trackData[ti];
    return {
      tracks: this.trackData.map((t, i) => ({
        label: t.label, dot: t.dot,
        bg: i === ti ? '#FAF7F1' : 'transparent',
        fg: i === ti ? '#17141E' : '#B8B2C2',
        bd: i === ti ? '#FAF7F1' : '#3A3546',
        select: () => this.setState({ track: i }),
      })),
      track: {
        eyebrow: active.eyebrow, title: active.title, summary: active.summary,
        bullets: active.bullets.map((t, i) => ({ n: '0' + (i + 1), t })),
      },
      query: this.state.query,
      searched: this.state.searched,
      demoTyping: this.state.demoTyping,
      demoLabel: this.state.manual ? 'your query' : this.demoQueries[this.state.demoIdx],
      results: this.resultSets[this.state.manual ? 2 : this.state.demoIdx],
      setQuery: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ query: e.target.value, searched: false, manual: true, demoTyping: false }),
      onKey: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') this.setState({ searched: true }); },
      submit: () => this.setState({ searched: true, manual: true, demoTyping: false }),
      takeOver: () => { this.stopDemo(); this.setState({ manual: true, demoTyping: false, query: '', searched: false }); },
      h480: 480, h530: 530,
      tabsApp: [{ title: 'Aspen — Workspace' }],
      faqs: faqData.map((f, i) => ({
        q: f.q, a: f.a,
        open: this.state.openFaq === i,
        icon: this.state.openFaq === i ? '−' : '+',
        toggle: () => this.setState((s: any) => ({ openFaq: s.openFaq === i ? -1 : i })),
      })),
    };
  }

  /* Timer/observer handles the design code assigns to `this`. Declared so the
     class is typed; behaviour is unchanged. */
  _demoTimers: ReturnType<typeof setTimeout>[] = [];
  _heroTimers: ReturnType<typeof setTimeout>[] = [];
  _revealTimers: ReturnType<typeof setTimeout>[] = [];
  _vio: IntersectionObserver | null = null;

  stopDemo() { (this._demoTimers || []).forEach(clearTimeout); this._demoTimers = []; }
  runDemo(idx: number) {
    if (this.state.manual) return;
    const q = this.demoQueries[idx];
    this._demoTimers = [];
    this.setState({ demoIdx: idx, query: '', searched: false, demoTyping: true });
    for (let i = 1; i <= q.length; i++) {
      this._demoTimers.push(setTimeout(() => { if (!this.state.manual) this.setState({ query: q.slice(0, i) }); }, 350 + i * 42));
    }
    const typed = 350 + q.length * 42;
    this._demoTimers.push(setTimeout(() => { if (!this.state.manual) this.setState({ searched: true, demoTyping: false }); }, typed + 450));
    this._demoTimers.push(setTimeout(() => this.runDemo((idx + 1) % this.demoQueries.length), typed + 6500));
  }
  componentDidMount() {
    const start = (v: HTMLVideoElement) => {
      v.muted = true;
      v.playsInline = true;
      const attempt = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
      if (v.readyState >= 2) { attempt(); return; }
      if (v.readyState === 0) v.load();
      v.addEventListener('canplay', attempt, { once: true });
      v.addEventListener('loadeddata', attempt, { once: true });
      attempt();
    };
    document.querySelectorAll('video').forEach(v => { v.muted = true; v.playsInline = true; });
    const hero = document.querySelector<HTMLVideoElement>('header video');
    if (hero) { start(hero); this._heroTimers = [300, 1200].map(t => setTimeout(() => start(hero), t)); }
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const el = e.target as HTMLVideoElement;
          if (e.isIntersecting) start(el); else el.pause();
        });
      }, { threshold: 0.25 });
      document.querySelectorAll('[data-inview-clip]').forEach(v => vio.observe(v));
      this._vio = vio;
    }
    if (this.props.autoDemo ?? true) this._demoTimers = [setTimeout(() => this.runDemo(0), 1200)];
    const animate = this.props.animations ?? true;
    if (animate && 'IntersectionObserver' in window) {
      const reveal = (el: HTMLElement) => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; el.removeAttribute('data-hidden-reveal'); };
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { reveal(e.target as HTMLElement); io.unobserve(e.target); } });
      }, { threshold: 0.05 });
      const observeAll = () => {
        document.querySelectorAll<HTMLElement>('[data-hidden-reveal]').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) { reveal(el); return; }
          io.observe(el);
        });
      };
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(26px)';
        el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        el.setAttribute('data-hidden-reveal', '');
      });
      observeAll();
      const onScroll = () => {
        document.querySelectorAll<HTMLElement>('[data-hidden-reveal]').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.95) reveal(el);
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      this._revealTimers = [1000, 2500, 5000].map(t => setTimeout(observeAll, t));
    }
  }
  componentWillUnmount() {
    if (this._vio) this._vio.disconnect();
    (this._heroTimers || []).forEach(clearTimeout);
    this.stopDemo();
    (this._revealTimers || []).forEach(clearTimeout);
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="aspen-scope min-h-screen bg-cream overflow-x-hidden">
      
        {/* NAV */}
        <nav className="flex items-center justify-between max-w-[1240px] mx-auto p-[20px_32px]">
          <div className="flex items-center gap-[10px]">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[18px]">a</div>
            <span className="font-heading font-extrabold text-[21px] tracking-[-0.02em]">aspen</span>
          </div>
          <div className="flex items-center gap-[32px] text-[15px] font-semibold">
            <a href="#market">Why now</a><a href="#how">How it works</a><a href="#platforms">Platforms</a><a href="#toolkit">Toolkit</a><a href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center gap-[12px]">
            <a href="/login" className="text-[15px] font-semibold p-[10px_16px]">Log in</a>
            <a href="/signup"  className="bg-dark text-cream text-[15px] font-semibold p-[11px_22px] rounded-[12px] ah1">Get early access</a>
          </div>
        </nav>
      
        {/* HERO */}
        <header className="max-w-[1240px] mx-auto p-[60px_32px_90px] text-center">
          <h1 className="font-heading font-extrabold text-[clamp(44px,5.6vw,78px)] leading-[1.02] tracking-[-0.035em] mx-auto max-w-[960px] text-balance">Find the creators. Run the ads. <span className="text-accent">Keep the proof.</span></h1>
          <p className="text-[19px] leading-[1.5] text-muted max-w-[600px] m-[22px_auto_0] text-pretty">Aspen finds the right creators on YouTube, Reddit, X, and LinkedIn — then manages your affiliates and runs your ads from the same workspace.</p>
          <div className="flex justify-center gap-[14px] mt-[30px] flex-wrap">
            <a href="#cta"  className="bg-accent text-cream text-[16px] font-bold p-[15px_30px] rounded-[14px] ah2">Get early access</a>
            <a href="/tour"  className="border-[2px] border-dark text-dark text-[16px] font-bold p-[13px_28px] rounded-[14px] ah3">Take the 60-second tour →</a>
          </div>
          <video src="/aspen/vid/workspace.mp4" poster="/aspen/workspace.webp" autoPlay={true} muted={true} loop={true} playsInline={true} preload="auto" aria-label="The Aspen workspace — discovery, affiliates and ads in one place" className="w-[min(1020px,96%)] m-[56px_auto_0] block rounded-[20px]"></video>
        </header>
      
        {/* TRY IT */}
        <section id="try" className="max-w-[1240px] mx-auto p-[0_32px_90px] text-center">
          <div className="text-[13px] font-bold tracking-[0.16em] text-accent">TRY IT</div>
          <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0]">Watch Aspen find your creators</h2>
      
          <div className="max-w-[780px] m-[40px_auto_0] bg-surface border-[1.5px] border-border rounded-[22px] shadow-[0_30px_70px_rgba(23,20,30,0.12)] p-[12px] text-left">
            <div className="flex items-center p-[18px_16px_14px]">
              <input value={v.query} onChange={v.setQuery} onKeyDown={v.onKey} onFocus={v.takeOver} placeholder="Describe your product and ideal customer…" className="flex-1 border-0 outline-none text-[18px] bg-transparent text-dark p-0" />
              {v.demoTyping ? (<>
                <span className="w-[2px] h-[22px] bg-accent ml-[2px]" style={{ animation: "blink 1.1s infinite" }}></span>
              </>) : null}
            </div>
            <div className="flex items-center justify-between gap-[12px] p-[6px_8px_6px_12px] flex-wrap">
              <div className="flex gap-[8px] flex-wrap">
                <span className="inline-flex items-center gap-[7px] bg-cream border-[1.5px] border-border text-[13px] font-semibold p-[7px_13px] rounded-[10px]"><span className="w-[8px] h-[8px] rounded-full bg-youtube"></span>YouTube</span>
                <span className="inline-flex items-center gap-[7px] bg-cream border-[1.5px] border-border text-[13px] font-semibold p-[7px_13px] rounded-[10px]"><span className="w-[8px] h-[8px] rounded-full bg-reddit"></span>Reddit</span>
                <span className="inline-flex items-center gap-[7px] bg-cream border-[1.5px] border-border text-[13px] font-semibold p-[7px_13px] rounded-[10px]"><span className="w-[8px] h-[8px] rounded-full bg-dark"></span>X</span>
                <span className="inline-flex items-center gap-[7px] bg-cream border-[1.5px] border-border text-[13px] font-semibold p-[7px_13px] rounded-[10px]"><span className="w-[8px] h-[8px] rounded-full bg-linkedin"></span>LinkedIn</span>
              </div>
              <button onClick={v.submit}  className="bg-accent text-cream font-sans text-[16px] font-bold p-[14px_28px] rounded-[12px] border-0 cursor-pointer ah4">Find creators →</button>
            </div>
            {v.searched ? (<>
              <div className="border-t-[1.5px] border-border-soft mt-[8px] p-[16px_12px_8px]">
                <div className="flex justify-between items-center mb-[12px]">
                  <span className="text-[13px] font-bold text-subtle tracking-[0.08em]">128 MATCHES · TOP 3 BY BRAND FIT</span>
                  <span className="text-[12px] font-bold text-success-ink">0.8s</span>
                </div>
                <div className="flex flex-col gap-[8px]">
                  {(v.results || []).map((r: any, $index: number) => (<React.Fragment key={$index}>
                    <div className="flex items-center gap-[12px] bg-cream rounded-[14px] p-[12px_14px]">
                      <div className="w-[38px] h-[38px] rounded-[11px] text-surface grid place-items-center font-extrabold text-[13px] shrink-0" style={{ background: r.color }}>{r.glyph}</div>
                      <div className="flex-1 min-w-0"><div className="font-bold text-[14.5px]">{r.name}</div><div className="text-[12.5px] text-subtle">{r.meta}</div></div>
                      <span className="bg-tint text-accent-ink text-[12px] font-bold p-[5px_11px] rounded-[8px]">{r.fit} fit</span>
                      <span className="bg-dark text-surface text-[12.5px] font-semibold p-[8px_14px] rounded-[10px] cursor-pointer">{r.action}</span>
                    </div>
                  </React.Fragment>))}
                </div>
                <div className="text-center p-[12px_0_6px]"><a href="#cta" className="text-[14px] font-bold text-accent">See all 128 matches →</a></div>
              </div>
            </>) : null}
          </div>
          <div className="flex justify-center items-center gap-[10px] mt-[16px] flex-wrap">
            <span className="text-[13px] font-semibold text-subtle">Watching Aspen search: <strong className="text-muted">{v.demoLabel}</strong> — or type your own.</span>
          </div>
        </section>
      
        {/* WHY NOW */}
        <section id="market" className="max-w-[1240px] mx-auto p-[20px_32px_80px]" data-reveal="">
          <div className="flex items-end justify-between gap-[32px] flex-wrap mb-[44px]">
            <div>
              <div className="text-[13px] font-bold tracking-[0.16em] text-accent">WHY NOW</div>
              <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0] max-w-[640px]">Creator marketing works. Picking the right creators is the hard part.</h2>
            </div>
            <p className="text-[16.5px] text-muted leading-[1.5] max-w-[360px] m-0">The numbers behind the channel — from published industry research, sourced in the footer.</p>
          </div>
          <div className="flex flex-wrap gap-[20px]">
            <div className="flex-[1_1_540px] bg-dark text-cream rounded-[24px] p-[30px] flex flex-col min-w-0">
              <div className="flex justify-between items-baseline gap-[16px] flex-wrap">
                <div className="font-bold text-[17px]">Creator marketing spend, 2015 → 2031</div>
                <div className="text-[12.5px] text-on-dark font-semibold">Global, USD · Mordor Intelligence / IMH</div>
              </div>
              <svg viewBox="0 0 560 210" className="w-full flex-1 mt-[18px]" preserveAspectRatio="none">
                <defs><linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F2542D" stopOpacity="0.5"></stop><stop offset="100%" stopColor="#F2542D" stopOpacity="0"></stop></linearGradient></defs>
                <path d="M0 196 C 120 192, 200 180, 280 156 C 340 138, 380 118, 420 88 C 460 58, 510 34, 560 10 L 560 210 L 0 210 Z" fill="url(#mktGrad)"></path>
                <path d="M0 196 C 120 192, 200 180, 280 156 C 340 138, 380 118, 420 88 C 460 58, 510 34, 560 10" stroke="#F2542D" strokeWidth="3" fill="none"></path>
                <circle cx="280" cy="156" r="4.5" fill="#FAF7F1"></circle>
                <circle cx="420" cy="88" r="4.5" fill="#FAF7F1"></circle>
                <circle cx="556" cy="12" r="5" fill="#FFD84D"></circle>
              </svg>
              <div className="flex justify-between mt-[14px] text-[12.5px] font-bold text-on-dark">
                <div>2015<div className="font-heading text-[20px] text-cream tracking-[-0.02em]">$1.7B</div></div>
                <div>2025<div className="font-heading text-[20px] text-cream tracking-[-0.02em]">$32.5B</div></div>
                <div>2026<div className="font-heading text-[20px] text-cream tracking-[-0.02em]">$40.5B</div></div>
                <div className="text-right">2031 proj.<div className="font-heading text-[20px] text-highlight tracking-[-0.02em]">$152B</div></div>
              </div>
            </div>
            <div className="flex-[1_1_340px] bg-surface border-[1.5px] border-border rounded-[24px] p-[30px] flex flex-col justify-between min-w-0">
              <div>
                <div className="font-bold text-[17px]">What a dollar returns</div>
                <div className="text-[13px] text-subtle font-semibold mt-[4px]">Average earned value per $1 of creator spend</div>
              </div>
              <div className="flex items-baseline gap-[14px] m-[18px_0]">
                <span className="font-heading font-extrabold text-[72px] tracking-[-0.04em] text-accent leading-[1]">$5.78</span>
                <span className="text-[14px] font-semibold text-muted">per $1<br />spent</span>
              </div>
              <div className="flex flex-col gap-[10px]">
                <div className="flex items-center gap-[10px] text-[13px] font-semibold"><div className="h-[10px] rounded-[6px] bg-border flex-1 max-w-[29%]"></div><span className="text-subtle">$1 in</span></div>
                <div className="flex items-center gap-[10px] text-[13px] font-semibold"><div className="h-[10px] rounded-[6px] bg-accent flex-1 max-w-[58%]"></div><span>average return</span></div>
                <div className="flex items-center gap-[10px] text-[13px] font-semibold"><div className="h-[10px] rounded-[6px] bg-highlight flex-1"></div><span>$18–20 top campaigns</span></div>
              </div>
              <div className="mt-[16px] text-[12.5px] text-subtle font-semibold">The difference between average and top? Picking the right creators.</div>
            </div>
            <div className="flex-[1_1_300px] bg-surface border-[1.5px] border-border rounded-[24px] p-[26px] min-w-0">
              <div className="font-heading font-extrabold text-[44px] tracking-[-0.03em] leading-[1]">86%</div>
              <div className="font-bold text-[15px] mt-[8px]">of US marketers already run creator campaigns</div>
              <div className="text-[13.5px] text-muted leading-[1.5] mt-[8px]">74% are raising budgets in 2026. Not an experiment anymore — a line item.</div>
            </div>
            <div className="flex-[1_1_300px] bg-tint rounded-[24px] p-[26px] min-w-0">
              <div className="font-heading font-extrabold text-[44px] tracking-[-0.03em] leading-[1] text-accent-ink">50%</div>
              <div className="font-bold text-[15px] mt-[8px] text-accent-ink">of marketers still can't prove creator ROI</div>
              <div className="text-[13.5px] text-accent-ink-soft leading-[1.5] mt-[8px]">The #1 complaint in the channel — and the exact problem Aspen is built to fix.</div>
            </div>
          </div>
      
          {/* Platform band */}
          <div className="mt-[24px] bg-surface border-[1.5px] border-border rounded-[24px] flex flex-wrap">
            <div className="flex-[1_1_220px] p-[24px] border-r-[1.5px] border-border-soft min-w-0">
              <div className="flex items-center gap-[9px] mb-[12px]"><div className="w-[26px] h-[26px] rounded-[8px] bg-youtube grid place-items-center"><div className="w-[0] h-[0] border-l-[7px] border-surface ml-[2px]" style={{ borderTop: "4.5px solid transparent", borderBottom: "4.5px solid transparent" }}></div></div><span className="font-bold text-[14.5px]">YouTube</span></div>
              <div className="font-heading font-extrabold text-[26px] tracking-[-0.02em] leading-[1]">30+ days</div>
              <div className="text-[12.5px] text-muted leading-[1.45] mt-[5px]">of brand recall — the longest of any creator platform.</div>
            </div>
            <div className="flex-[1_1_220px] p-[24px] border-r-[1.5px] border-border-soft min-w-0">
              <div className="flex items-center gap-[9px] mb-[12px]"><div className="w-[26px] h-[26px] rounded-full bg-reddit text-surface grid place-items-center font-extrabold text-[10px]">r/</div><span className="font-bold text-[14.5px]">Reddit</span></div>
              <div className="font-heading font-extrabold text-[26px] tracking-[-0.02em] leading-[1]">+74% YoY</div>
              <div className="text-[12.5px] text-muted leading-[1.45] mt-[5px]">ad revenue growth. Clicks still cost a fraction of Meta's.</div>
            </div>
            <div className="flex-[1_1_220px] p-[24px] border-r-[1.5px] border-border-soft min-w-0">
              <div className="flex items-center gap-[9px] mb-[12px]"><div className="w-[26px] h-[26px] rounded-[8px] bg-dark text-surface grid place-items-center font-extrabold text-[11px]">X</div><span className="font-bold text-[14.5px]">X / Twitter</span></div>
              <div className="font-heading font-extrabold text-[26px] tracking-[-0.02em] leading-[1]">#2 in B2B</div>
              <div className="text-[12.5px] text-muted leading-[1.45] mt-[5px]">for creator campaigns — where founders and devs hang out.</div>
            </div>
            <div className="flex-[1_1_220px] p-[24px] min-w-0">
              <div className="flex items-center gap-[9px] mb-[12px]"><div className="w-[26px] h-[26px] rounded-[8px] bg-linkedin text-surface grid place-items-center font-extrabold text-[10px]">in</div><span className="font-bold text-[14.5px]">LinkedIn</span></div>
              <div className="font-heading font-extrabold text-[26px] tracking-[-0.02em] leading-[1]">3.2× leads</div>
              <div className="text-[12.5px] text-muted leading-[1.45] mt-[5px]">vs paid social, from creator-led B2B campaigns.</div>
            </div>
          </div>
        </section>
      
        {/* PAYOFF */}
        <section className="bg-dark text-cream p-[110px_32px]" data-reveal="">
          <div className="max-w-[940px] mx-auto text-center">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent mb-[22px]">THE PAYOFF</div>
            <h2 className="font-heading font-extrabold text-[clamp(32px,4.2vw,56px)] tracking-[-0.03em] leading-[1.12] m-0 text-balance">The gap between an average campaign and a great one is a single decision: who you partner with. Aspen exists to get that decision right.</h2>
          </div>
        </section>
      
        {/* WHO IT'S FOR */}
        <section className="max-w-[1240px] mx-auto p-[88px_32px_0]" data-reveal="">
          <div className="flex items-end justify-between gap-[32px] flex-wrap mb-[40px]">
            <div>
              <div className="text-[13px] font-bold tracking-[0.16em] text-accent">WHO IT'S FOR</div>
              <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0] max-w-[640px]">Built for teams that sell to professionals</h2>
            </div>
            <a href="#cta" className="text-[15px] font-bold text-accent p-[10px_0] whitespace-nowrap">Get early access →</a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[20px]">
            <div  className="bg-surface border-[1.5px] border-border rounded-[24px] p-[14px_14px_24px] flex flex-col ah5">
              <div className="h-[200px] mb-[20px]">
                <img src="/aspen/icp-saas.webp" alt="Clay product team gathered around a glowing dashboard" className="w-full h-full object-cover rounded-[16px] block" loading="lazy" />
              </div>
              <div className="p-[0_10px]">
                <div className="text-[12px] font-bold tracking-[0.14em] text-accent mb-[10px]">B2B &amp; VERTICAL SAAS</div>
                <div className="font-bold text-[17px] mb-[6px]">Reach the job function you sell to</div>
                <div className="text-[14px] text-muted leading-[1.55]">Every buyer role — CFOs, HR leads, devs — follows a few trusted voices. Aspen finds them.</div>
              </div>
            </div>
            <div  className="bg-surface border-[1.5px] border-border rounded-[24px] p-[14px_14px_24px] flex flex-col ah6">
              <div className="h-[200px] mb-[20px]">
                <img src="/aspen/icp-startup.webp" alt="Clay founders mapping ideas on a sticky-note whiteboard" className="w-full h-full object-cover rounded-[16px] block" loading="lazy" />
              </div>
              <div className="p-[0_10px]">
                <div className="text-[12px] font-bold tracking-[0.14em] text-accent mb-[10px]">STARTUPS</div>
                <div className="font-bold text-[17px] mb-[6px]">Pipeline before you have a brand</div>
                <div className="text-[14px] text-muted leading-[1.55]">Skip cold email. Turn buyer-intent threads on Reddit and X into your first repeatable lead channel.</div>
              </div>
            </div>
            <div  className="bg-surface border-[1.5px] border-border rounded-[24px] p-[14px_14px_24px] flex flex-col ah7">
              <div className="h-[200px] mb-[20px]">
                <img src="/aspen/icp-coach.webp" alt="Clay coach recording a lesson for an audience of laptops" className="w-full h-full object-cover rounded-[16px] block" loading="lazy" />
              </div>
              <div className="p-[0_10px]">
                <div className="text-[12px] font-bold tracking-[0.14em] text-accent mb-[10px]">COACHES &amp; EXPERTS</div>
                <div className="font-bold text-[17px] mb-[6px]">Get in front of knowledge workers</div>
                <div className="text-[14px] text-muted leading-[1.55]">Your clients are watching tutorials and scrolling LinkedIn. Partner with the creators they already learn from.</div>
              </div>
            </div>
            <div  className="bg-surface border-[1.5px] border-border rounded-[24px] p-[14px_14px_24px] flex flex-col ah8">
              <div className="h-[200px] mb-[20px]">
                <img src="/aspen/icp-agency.webp" alt="Clay agency team presenting results to clients" className="w-full h-full object-cover rounded-[16px] block" loading="lazy" />
              </div>
              <div className="p-[0_10px]">
                <div className="text-[12px] font-bold tracking-[0.14em] text-accent mb-[10px]">AGENCIES</div>
                <div className="font-bold text-[17px] mb-[6px]">Prove ROI to every client</div>
                <div className="text-[14px] text-muted leading-[1.55]">One workspace per client — discovery to attribution, with reporting you can put in front of anyone.</div>
              </div>
            </div>
          </div>
        </section>
      
        {/* HOW */}
        <section id="how" className="max-w-[1240px] mx-auto p-[88px_32px]">
          <div className="text-center mb-[56px]">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent">HOW IT WORKS</div>
            <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0]">Three steps to converting campaigns</h2>
          </div>
      
          <div className="flex flex-col gap-[72px]">
            <div className="flex gap-[48px] items-center flex-wrap" data-reveal="">
              <div className="flex-[1_1_320px] min-w-[280px]">
                <span className="text-[15px] font-semibold text-subtle">(01)</span>
                <h3 className="font-heading font-extrabold text-[36px] tracking-[-0.02em] m-[8px_0_12px]">Discover</h3>
                <p className="text-[16.5px] text-muted leading-[1.6] m-0 max-w-[400px]">Describe your product once. Aspen scores every creator across all four platforms on audience fit, topic match, and engagement — and ranks them by brand fit.</p>
              </div>
              <div className="flex-[1.4_1_480px] min-w-0">
                <video data-inview-clip="" src="/aspen/vid/signal.mp4" poster="/aspen/signal.webp" muted={true} loop={true} playsInline={true} preload="metadata" aria-label="Clay world map of creator districts across YouTube, Reddit, X and LinkedIn" className="w-full block rounded-[18px]"></video>
              </div>
            </div>
      
            <div className="flex gap-[48px] items-center" style={{ flexWrap: "wrap-reverse" }} data-reveal="">
              <div className="flex-[1.4_1_480px] min-w-0">
                <video data-inview-clip="" src="/aspen/vid/ads.mp4" poster="/aspen/ads.webp" muted={true} loop={true} playsInline={true} preload="metadata" aria-label="Clay ads control room launching campaigns to four platforms" className="w-full block rounded-[18px]"></video>
              </div>
              <div className="flex-[1_1_320px] min-w-[280px]">
                <span className="text-[15px] font-semibold text-subtle">(02)</span>
                <h3 className="font-heading font-extrabold text-[36px] tracking-[-0.02em] m-[8px_0_12px]">Build ads</h3>
                <p className="text-[16.5px] text-muted leading-[1.6] m-0 max-w-[400px]">When a creator's content spikes, Aspen turns that live signal into ad hooks in your brand voice — with the receipts attached.</p>
              </div>
            </div>
      
            <div className="flex gap-[48px] items-center flex-wrap" data-reveal="">
              <div className="flex-[1_1_320px] min-w-[280px]">
                <span className="text-[15px] font-semibold text-subtle">(03)</span>
                <h3 className="font-heading font-extrabold text-[36px] tracking-[-0.02em] m-[8px_0_12px]">Keep the proof</h3>
                <p className="text-[16.5px] text-muted leading-[1.6] m-0 max-w-[400px]">One click publishes across all four channels — and every dollar of revenue traces back to the exact creator and post that earned it.</p>
              </div>
              <div className="flex-[1.4_1_480px] min-w-0">
                <video data-inview-clip="" src="/aspen/vid/proof.mp4" poster="/aspen/proof.webp" muted={true} loop={true} playsInline={true} preload="metadata" aria-label="Clay proof vault of receipted, attributed results" className="w-full block rounded-[18px]"></video>
              </div>
            </div>
          </div>
        </section>
      
        {/* PLATFORM TRACKS */}
        <section id="platforms" className="bg-dark text-cream p-[88px_32px]">
          <div className="max-w-[1240px] mx-auto" data-reveal="">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent">YOUR REVENUE PLAYBOOK</div>
            <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0] max-w-[700px]">One platform. Four revenue channels.</h2>
            <p className="text-[17px] text-on-dark leading-[1.55] max-w-[560px] m-[16px_0_0]">Every network pays off differently. Aspen runs the right play on each one — and the four plays feed each other.</p>
      
            <div className="flex gap-[10px] flex-wrap mt-[38px]">
              {(v.tracks || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                <button onClick={t.select} className="inline-flex items-center gap-[9px] font-sans text-[14.5px] font-bold p-[11px_19px] rounded-[12px] cursor-pointer" style={{ border: `1.5px solid ${t.bd}`, background: t.bg, color: t.fg }}>
                  <span className="w-[9px] h-[9px] rounded-full" style={{ background: t.dot }}></span>{t.label}
                </button>
              </React.Fragment>))}
            </div>
      
            <div className="mt-[26px] bg-dark-raised border-[1.5px] border-dark-border rounded-[26px] p-[38px_40px] flex gap-[56px] flex-wrap">
              <div className="flex-[1_1_340px] min-w-[280px]">
                <div className="text-[12px] font-bold tracking-[0.14em] text-accent">{v.track.eyebrow}</div>
                <h3 className="font-heading font-extrabold text-[clamp(26px,2.6vw,36px)] tracking-[-0.025em] leading-[1.1] m-[12px_0_0]">{v.track.title}</h3>
                <p className="text-[15.5px] text-on-dark leading-[1.55] m-[14px_0_0] max-w-[380px]">{v.track.summary}</p>
              </div>
              <div className="flex-[1.2_1_420px] min-w-[280px] flex flex-col gap-[2px]">
                {(v.track.bullets || []).map((b: any, $index: number) => (<React.Fragment key={$index}>
                  <div className="flex gap-[18px] items-start p-[16px_0] border-t-[1px] border-dark-border">
                    <span className="text-[13px] font-bold text-subtle pt-[2px]">{b.n}</span>
                    <span className="text-[16px] leading-[1.5] text-cream">{b.t}</span>
                  </div>
                </React.Fragment>))}
              </div>
            </div>
          </div>
        </section>
      
        {/* OUTREACH CASCADE */}
        <section id="outreach" className="max-w-[1240px] mx-auto p-[88px_32px]" data-reveal="">
          <div className="flex gap-[56px] flex-wrap items-center">
            <div className="flex-[1_1_380px] min-w-[300px]">
              <div className="text-[13px] font-bold tracking-[0.16em] text-accent">HOW WE REACH CREATORS</div>
              <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0]">Every channel. One platform.</h2>
              <p className="text-[16.5px] text-muted leading-[1.6] m-[18px_0_0] max-w-[420px]">Creators are famously hard to reach. Aspen works down the contact list until someone answers — and logs every attempt, so nobody gets messaged twice.</p>
              <img src="/aspen/fit.webp" alt="Clay vetting bench where creator fit is measured" className="w-full mt-[32px] block rounded-[18px]" loading="lazy" />
            </div>
            <div className="flex-[1_1_440px] min-w-[300px] flex flex-col">
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-accent text-cream grid place-items-center font-extrabold text-[14px]">1</div>
                  <div className="flex-1 w-[1.5px] bg-border m-[6px_0]"></div>
                </div>
                <div className="pb-[26px]">
                  <div className="font-bold text-[16.5px]">YouTube channel email</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">Pulled from the creator's About tab via the YouTube Data API.</div>
                </div>
              </div>
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-accent text-cream grid place-items-center font-extrabold text-[14px]">2</div>
                  <div className="flex-1 w-[1.5px] bg-border m-[6px_0]"></div>
                </div>
                <div className="pb-[26px]">
                  <div className="font-bold text-[16.5px]">Personal website form</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">Found through the site linked in the channel bio.</div>
                </div>
              </div>
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-accent text-cream grid place-items-center font-extrabold text-[14px]">3</div>
                  <div className="flex-1 w-[1.5px] bg-border m-[6px_0]"></div>
                </div>
                <div className="pb-[26px]">
                  <div className="font-bold text-[16.5px]">X / Twitter DM</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">Profile matched via the handle in their YouTube bio.</div>
                </div>
              </div>
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-accent text-cream grid place-items-center font-extrabold text-[14px]">4</div>
                  <div className="flex-1 w-[1.5px] bg-border m-[6px_0]"></div>
                </div>
                <div className="pb-[26px]">
                  <div className="font-bold text-[16.5px]">Discord community</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">Server invite picked up from the video description.</div>
                </div>
              </div>
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-accent text-cream grid place-items-center font-extrabold text-[14px]">5</div>
                  <div className="flex-1 w-[1.5px] bg-border m-[6px_0]"></div>
                </div>
                <div className="pb-[26px]">
                  <div className="font-bold text-[16.5px]">LinkedIn message</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">Professional profile matched by name and niche.</div>
                </div>
              </div>
              <div className="flex gap-[20px] items-stretch">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-[34px] h-[34px] rounded-[11px] bg-dark text-cream grid place-items-center font-extrabold text-[14px]">6</div>
                </div>
                <div >
                  <div className="font-bold text-[16.5px]">Talent management agency</div>
                  <div className="text-[14px] text-muted leading-[1.5] mt-[3px]">For managed talent, the agency's form gets filled for you.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        {/* TOOLKIT */}
        <section id="toolkit" className="bg-sand-deep p-[88px_32px]">
          <div className="max-w-[1240px] mx-auto" data-reveal="">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent">TOOLKIT</div>
            <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0] max-w-[760px]">Creator management and ads management. One tool.</h2>
            <p className="text-[17px] text-muted leading-[1.55] max-w-[560px] m-[16px_0_40px]">Most teams juggle a discovery tool, a CRM, an affiliate platform, and four ad managers. Aspen replaces the whole stack.</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[20px]">
              <div  className="bg-surface rounded-[22px] p-[24px] ah9">
                <h3 className="font-heading font-bold text-[19px] m-[0_0_14px]">Brand-fit scoring</h3>
                <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[10px] text-[12.5px] font-semibold"><span className="w-[86px]">Audience fit</span><div className="flex-1 h-[8px] bg-cream rounded-full"><div className="w-[94%] h-[8px] bg-accent rounded-full"></div></div><span>94</span></div>
                  <div className="flex items-center gap-[10px] text-[12.5px] font-semibold"><span className="w-[86px]">Topic match</span><div className="flex-1 h-[8px] bg-cream rounded-full"><div className="w-[88%] h-[8px] bg-accent-soft rounded-full"></div></div><span>88</span></div>
                  <div className="flex items-center gap-[10px] text-[12.5px] font-semibold"><span className="w-[86px]">Engagement</span><div className="flex-1 h-[8px] bg-cream rounded-full"><div className="w-[76%] h-[8px] bg-highlight rounded-full"></div></div><span>76</span></div>
                </div>
              </div>
              <div  className="bg-surface rounded-[22px] p-[24px] ah10">
                <h3 className="font-heading font-bold text-[19px] m-[0_0_14px]">Hotlist CRM</h3>
                <div className="flex gap-[10px]">
                  <div className="flex-1 bg-cream rounded-[12px] p-[10px]"><div className="text-[10.5px] font-bold text-subtle mb-[8px]">CONTACTED</div><div className="h-[24px] bg-surface border-[1.5px] border-border rounded-[8px] mb-[6px]"></div><div className="h-[24px] bg-surface border-[1.5px] border-border rounded-[8px]"></div></div>
                  <div className="flex-1 bg-cream rounded-[12px] p-[10px]"><div className="text-[10.5px] font-bold text-subtle mb-[8px]">NEGOTIATING</div><div className="h-[24px] bg-highlight-wash border-[1.5px] border-highlight rounded-[8px]"></div></div>
                  <div className="flex-1 bg-cream rounded-[12px] p-[10px]"><div className="text-[10.5px] font-bold text-subtle mb-[8px]">LIVE</div><div className="h-[24px] bg-tint-deep border-[1.5px] border-accent rounded-[8px]"></div></div>
                </div>
              </div>
              <div  className="bg-surface rounded-[22px] p-[24px] ah11">
                <h3 className="font-heading font-bold text-[19px] m-[0_0_14px]">AI outreach that lands</h3>
                <div className="bg-cream rounded-[12px] p-[14px] text-[13px] leading-[1.5] text-muted"><strong className="text-dark">Hi Dana —</strong> your piece on onboarding debt hit home. We build the tool your comments keep asking about…</div>
              </div>
              <div  className="bg-surface rounded-[22px] p-[24px] ah12">
                <h3 className="font-heading font-bold text-[19px] m-[0_0_14px]">Affiliate & payout tracking</h3>
                <div className="flex items-end gap-[7px] h-[64px]">
                  <div className="flex-1 h-[30%] bg-border rounded-[5px_5px_0_0]"></div>
                  <div className="flex-1 h-[45%] bg-border rounded-[5px_5px_0_0]"></div>
                  <div className="flex-1 h-[40%] bg-highlight rounded-[5px_5px_0_0]"></div>
                  <div className="flex-1 h-[65%] bg-highlight rounded-[5px_5px_0_0]"></div>
                  <div className="flex-1 h-[85%] bg-accent rounded-[5px_5px_0_0]"></div>
                  <div className="flex-1 h-full bg-accent rounded-[5px_5px_0_0]"></div>
                </div>
              </div>
              <div  className="bg-surface rounded-[22px] p-[24px] ah13">
                <h3 className="font-heading font-bold text-[19px] m-[0_0_14px]">Live signal feed</h3>
                <div className="flex gap-[8px] flex-wrap">
                  <span className="bg-cream text-[12px] font-semibold p-[7px_12px] rounded-[9px]">Affiliate performance</span>
                  <span className="bg-cream text-[12px] font-semibold p-[7px_12px] rounded-[9px]">Comment sentiment</span>
                  <span className="bg-cream text-[12px] font-semibold p-[7px_12px] rounded-[9px]">Buyer intent</span>
                  <span className="bg-cream text-[12px] font-semibold p-[7px_12px] rounded-[9px]">Engagement velocity</span>
                  <span className="bg-cream text-[12px] font-semibold p-[7px_12px] rounded-[9px]">Social chatter</span>
                  <div className="text-[12.5px] text-subtle font-semibold mt-[6px]">Every ad draft traces back to the signal that inspired it.</div>
                </div>
              </div>
              <div  className="bg-dark text-cream rounded-[22px] p-[24px] flex flex-col justify-between ah14">
                <div>
                  <h3 className="font-heading font-bold text-[19px] m-0">Ads studio, built in</h3>
                  <p className="text-[13.5px] text-on-dark leading-[1.5] m-[10px_0_0]">Build, launch, and track ads on all four platforms — without leaving Aspen or losing attribution.</p>
                </div>
                <a href="#cta"  className="self-start mt-[20px] bg-accent text-cream text-[14px] font-semibold p-[10px_20px] rounded-[11px] ah15">Get early access</a>
              </div>
            </div>
          </div>
        </section>
      
        {/* PRICING */}
        <section id="pricing" className="max-w-[1240px] mx-auto p-[88px_32px]" data-reveal="">
          <div className="text-center mb-[48px]">
            <div className="text-[13px] font-bold tracking-[0.16em] text-accent">EARLY ACCESS PRICING</div>
            <h2 className="font-heading font-extrabold text-[clamp(34px,4vw,52px)] tracking-[-0.03em] leading-[1.05] m-[12px_0_0]">Join early. Lock in launch rates.</h2>
            <p className="text-[17px] text-muted m-[14px_0_0]">Early-access pricing is guaranteed for 12 months after launch. No setup fees, cancel anytime.</p>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[22px] items-stretch">
            <div className="bg-surface border-[1.5px] border-border rounded-[26px] p-[32px] flex flex-col">
              <h3 className="font-heading font-bold text-[20px] m-0">Starter</h3>
              <div className="m-[14px_0_22px]"><span className="font-heading font-extrabold text-[46px] tracking-[-0.03em]">$499</span><span className="text-[15px] text-subtle">/mo</span></div>
              <div className="flex flex-col gap-[11px] text-[15px] flex-1">
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>50 creator searches / mo</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>1 active campaign</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>YouTube discovery</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>Email outreach templates</div>
              </div>
              <a href="#cta"  className="mt-[26px] text-center border-[2px] border-dark text-[15px] font-semibold p-[12px_0] rounded-[14px] ah16">Get early access</a>
            </div>
            <div className="relative bg-dark text-cream rounded-[26px] p-[32px] flex flex-col shadow-[0_30px_60px_rgba(23,20,30,0.25)]" style={{ transform: "translateY(-12px)" }}>
              <div className="absolute top-[-13px] left-[50%] bg-highlight text-dark text-[11.5px] font-extrabold tracking-[0.08em] p-[6px_15px] rounded-[9px]" style={{ transform: "translateX(-50%)" }}>RECOMMENDED</div>
              <h3 className="font-heading font-bold text-[20px] m-0">Growth</h3>
              <div className="m-[14px_0_22px]"><span className="font-heading font-extrabold text-[46px] tracking-[-0.03em] text-accent">$999</span><span className="text-[15px] text-on-dark">/mo</span></div>
              <div className="flex flex-col gap-[11px] text-[15px] flex-1">
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>Unlimited searches</div>
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>5 active campaigns</div>
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>YouTube + Reddit + X + LinkedIn</div>
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>AI outreach sequences</div>
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>Affiliate & payout tracking</div>
                <div className="flex gap-[10px]"><span className="text-highlight font-bold">✓</span>Hotlist CRM kanban</div>
              </div>
              <a href="#cta"  className="mt-[26px] text-center bg-accent text-cream text-[15px] font-semibold p-[14px_0] rounded-[14px] ah17">Get early access</a>
            </div>
            <div className="bg-surface border-[1.5px] border-border rounded-[26px] p-[32px] flex flex-col">
              <h3 className="font-heading font-bold text-[20px] m-0">Enterprise</h3>
              <div className="m-[14px_0_22px]"><span className="font-heading font-extrabold text-[46px] tracking-[-0.03em]">Custom</span></div>
              <div className="flex flex-col gap-[11px] text-[15px] flex-1">
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>Everything in Growth</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>Admin dashboard & teams</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>Custom brand voice AI</div>
                <div className="flex gap-[10px]"><span className="text-accent font-bold">✓</span>Priority support</div>
              </div>
              <a href="#cta"  className="mt-[26px] text-center border-[2px] border-dark text-[15px] font-semibold p-[12px_0] rounded-[14px] ah18">Talk to us</a>
            </div>
          </div>
      
          <div className="max-w-[720px] m-[72px_auto_0]">
            <h3 className="font-heading font-extrabold text-[26px] tracking-[-0.02em] m-[0_0_20px] text-center">Questions, answered</h3>
            <div className="flex flex-col gap-[10px]">
              {(v.faqs || []).map((faq: any, $index: number) => (<React.Fragment key={$index}>
                <div className="bg-surface border-[1.5px] border-border rounded-[16px] overflow-hidden">
                  <button onClick={faq.toggle} className="w-full flex justify-between items-center gap-[16px] border-0 cursor-pointer p-[18px_20px] font-sans text-[15.5px] font-bold text-dark text-left" style={{ background: "none" }}>
                    {faq.q}<span className="text-accent text-[18px] shrink-0">{faq.icon}</span>
                  </button>
                  {faq.open ? (<>
                    <div className="p-[0_20px_18px] text-[14.5px] leading-[1.6] text-muted">{faq.a}</div>
                  </>) : null}
                </div>
              </React.Fragment>))}
            </div>
          </div>
        </section>
      
        {/* CTA */}
        <section id="cta" className="p-[0_32px_88px]">
          <div className="max-w-[1240px] mx-auto bg-highlight rounded-[32px] p-[80px_48px] text-center" data-reveal="">
            <h2 className="font-heading font-extrabold text-[clamp(36px,4.4vw,60px)] tracking-[-0.035em] leading-[1.02] mx-auto max-w-[820px] text-balance">Your buyers already trust a creator. Be the brand they mention.</h2>
            <p className="text-[17px] font-medium text-highlight-deep m-[18px_auto_0] max-w-[480px]">Early access opens this quarter. Waitlist members get onboarding with our team and locked launch pricing.</p>
            <div className="mt-[30px] flex justify-center">
              <a href="/signup"  className="bg-dark text-cream text-[17px] font-semibold p-[16px_34px] rounded-[14px] ah19">Get early access</a>
            </div>
            <p className="text-[14px] font-semibold text-highlight-mid m-[16px_0_0]">No credit card required · Cancel anytime</p>
          </div>
        </section>
      
        {/* FOOTER */}
        <footer className="bg-dark text-cream p-[64px_32px_36px]">
          <div className="max-w-[1240px] mx-auto">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[48px] pb-[48px]">
              <div>
                <div className="flex items-center gap-[10px] mb-[14px]">
                  <div className="w-[28px] h-[28px] rounded-[8px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[16px]">a</div>
                  <span className="font-heading font-extrabold text-[19px]">aspen</span>
                </div>
                <p className="text-[14px] leading-[1.6] text-on-dark max-w-[280px] m-0">Creator discovery, affiliate management, and paid ads — one workspace.</p>
              </div>
              <div className="flex flex-col gap-[11px] text-[14px]">
                <span className="font-bold text-subtle text-[12px] tracking-[0.12em]">PRODUCT</span>
                <a href="#market" className="text-cream">Why now</a><a href="#how" className="text-cream">How it works</a><a href="#platforms" className="text-cream">Platforms</a><a href="#outreach" className="text-cream">Outreach</a><a href="#toolkit" className="text-cream">Toolkit</a><a href="#pricing" className="text-cream">Pricing</a>
              </div>
              <div className="flex flex-col gap-[11px] text-[14px]">
                <span className="font-bold text-subtle text-[12px] tracking-[0.12em]">COMPANY</span>
                <a href="#" className="text-cream">About</a><a href="#" className="text-cream">Blog</a><a href="#" className="text-cream">Careers</a>
              </div>
              <div className="flex flex-col gap-[11px] text-[14px]">
                <span className="font-bold text-subtle text-[12px] tracking-[0.12em]">LEGAL</span>
                <a href="#" className="text-cream">Privacy</a><a href="#" className="text-cream">Terms</a>
              </div>
            </div>
            <div className="border-t-[1px] border-dark-border pt-[24px] flex flex-col gap-[10px] text-[12.5px] text-subtle">
              <span>Industry data sources: Influencer Marketing Hub Benchmark Report 2025–26 · Mordor Intelligence · Grand View Research · WARC Media · Reddit Inc. SEC filings · Sprout Social · TopRank B2B Report. Figures are industry-wide benchmarks, not Aspen results.</span>
              <span>© 2026 Aspen. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }
}
