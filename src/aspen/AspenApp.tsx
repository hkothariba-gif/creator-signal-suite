import React from 'react';
import './aspen.css';

/* AspenApp — ported from the Aspen design (Aspen App.dc.html).
   Target in this repo: src/routes/app.*.tsx (all 12 app screens, one component)
   Styling is Tailwind utilities against the Aspen tokens, which live in the
   @theme block of src/styles.css (this app is on Tailwind v4 — no JS config).
   Dynamic (data-driven) values stay in style={{}} — they cannot be classes.
   Pseudo-states are .ahN rules in aspen.css.

   NOT YET ROUTED. Nothing renders this component; splitting it into the
   app.*.tsx routes is a separate pass. The types below were tightened only
   enough to satisfy `tsc --noEmit` — no behaviour or structure was changed.
   Note it renders no `.aspen-scope` wrapper yet; add one when it is routed,
   or the Aspen token overrides in styles.css will not reach it. */

export default class AspenApp extends React.Component<any, any> {
  state: any = {
    screen: 'home', campaign: 0, campaignTab: 'all', search: 'HR software for mid-market people teams',
    stage: 'negotiating', platformFilter: 'All', adsTab: 'generate', communityTab: 0, thread: 0, inbox: 'open',
    companyName: 'Northbeam',
    terms: ['spreadsheet of shame', '"the onboarding debt problem"'],
    adHeadline: 'Your first 90 days shouldn\u2019t live in a spreadsheet',
    adBody: 'People teams keep onboarding in tabs nobody owns. Northbeam gives every new hire a real path — and gives you the audit trail when someone asks.',
    adCta: 'See how it works',
  };
  threadData = [
    {
      name: 'The People Ops Show', channel: 'Email', channelColor: '#F03', status: 'replied', when: '22 min ago',
      meta: 'hello@peopleopsshow.com · Q3 people-ops push',
      preview: 'Happy to look at it — can you send the rate card?',
      messages: [
        ['out', 'Delivered', 'Sponsorship for the onboarding episode', 'Hi Dana — your piece on onboarding debt hit home. We build the tool your comments keep asking about, and we\u2019d like to sponsor the next onboarding episode. Flat fee or affiliate, your call.'],
        ['in', 'Received', '', 'Happy to look at it. Can you send the rate card and what you\u2019d want covered? I don\u2019t do scripted reads but I\u2019ll talk about tools I actually use.'],
        ['out', 'Delivered', 'Re: Sponsorship', 'No script — we\u2019d rather you use it and say what you think. Rate card attached, plus a trial workspace so you can poke at it first.'],
      ],
    },
    {
      name: 'Marcus Vale', channel: 'LinkedIn', channelColor: '#0A66C2', status: 'active', when: 'Yesterday',
      meta: 'The CFO Memo · CFO memo test',
      preview: 'Sent the brief and the belief doc.',
      messages: [
        ['out', 'Sent', '', 'Marcus — your memo on close-cycle tooling is the closest thing to our pitch that we didn\u2019t write. Would you review the product for your list? Paid, disclosed, and you keep editorial control.'],
      ],
    },
    {
      name: 'u/ship_it_sam', channel: 'Reddit', channelColor: '#FF4500', status: 'active', when: '2 days ago',
      meta: 'r/SaaS moderator · Dev tools launch',
      preview: 'Mod approval for an AMA thread.',
      messages: [
        ['out', 'Sent', '', 'Hi Sam — we\u2019d like to run an AMA in r/SaaS when we launch. Happy to follow the self-promo rules and pay for a promoted post alongside it rather than sneaking it in.'],
        ['in', 'Received', '', 'AMA is fine if you answer the hard questions. Promoted post goes through the normal queue.'],
      ],
    },
    {
      name: 'Tech With Priya', channel: 'Email', channelColor: '#F03', status: 'bounced', when: '3 days ago',
      meta: 'Channel email bounced · retrying down the cascade',
      preview: 'Email bounced — website form queued next.',
      messages: [
        ['out', 'Bounced', 'Dev-tool review partnership', 'Hi Priya — we\u2019d love you to look at our CLI. Aspen queued the website form next, then an X DM.'],
      ],
    },
    {
      name: '@quietcompounder', channel: 'X', channelColor: '#17141E', status: 'replied', when: '4 days ago',
      meta: 'DM thread · CFO memo test',
      preview: 'Asked for the affiliate split.',
      messages: [
        ['out', 'Delivered', '', 'Your thread on month-end close got quoted in our standup. Want to try the product and post honestly about it? Affiliate or flat.'],
        ['in', 'Received', '', 'What\u2019s the affiliate split and does it track past the first month?'],
      ],
    },
  ];
  signalData = [
    [
      ['r/', '#FF4500', 'r/humanresources', '4 hours ago', '"We\u2019re onboarding 30 people next month and still doing it in a spreadsheet. What are people actually using that doesn\u2019t cost enterprise money?"', 'Category question with budget language and a timeline — the strongest buying signal shape we track.', 'High intent'],
      ['X', '#17141E', '@hrops_kate', '9 hours ago', '"Third quarter in a row where onboarding slipped because nobody owned the manager handoff."', 'Names the exact pain your product page leads with, from an account matching your ICP.', 'High intent'],
      ['r/', '#FF4500', 'r/ExperiencedDevs', 'Yesterday', '"Manager gave me a Notion doc and a laptop and called it onboarding."', 'Practitioner complaint — useful as ad language, weaker as a lead.', 'Watching'],
    ],
    [
      ['▶', '#F03', 'The People Ops Show · comments', '2 hours ago', '"Northbeam got mentioned twice in this thread and I still don\u2019t know what it does."', 'Awareness without comprehension — a positioning problem worth an ad test.', 'Watching'],
      ['in', '#0A66C2', 'Dana Reyes post', 'Yesterday', '"Trialling Northbeam this month, will report back."', 'Public trial from a creator already in your hotlist. Worth a check-in.', 'High intent'],
    ],
    [
      ['r/', '#FF4500', 'r/humanresources', '6 hours ago', '"We left our old tool after the pricing change and haven\u2019t replaced it yet."', 'Competitor churn in your category — feeds the switch-from-competitor ad angle.', 'High intent'],
      ['X', '#17141E', '@peopletechwatch', 'Yesterday', '"Every onboarding tool demo looks the same until you ask about audit trails."', 'Differentiator your product actually has. Good hook material.', 'Watching'],
    ],
    [
      ['r/', '#FF4500', 'Across 38 subreddits', 'This week', '"Onboarding debt" appearing 4× more often than last month.', 'Rising term across communities you watch — worth leading an ad with it while it\u2019s fresh.', 'Watching'],
      ['▶', '#F03', 'YouTube · people ops', 'This week', 'Upload velocity on people-ops channels up 18% ahead of hiring season.', 'More inventory and cheaper CPMs for the next six weeks.', 'Watching'],
    ],
  ];
  campaigns = ['Q3 people-ops push', 'CFO memo test', 'Dev tools launch'];
  screenMeta: any = {
    home: ['Home', 'What moved across your campaigns today'],
    campaigns: ['Campaigns', 'Every campaign, its platforms and its stage'],
    discovery: ['Creator discovery', 'Search YouTube, Reddit, X and LinkedIn in one query'],
    creator: ['Creator profile', 'Fit, contact paths and stage'],
    hotlist: ['Hotlist CRM', 'Creators for this campaign, scored and staged'],
    outreach: ['Outreach inbox', 'Email, X, Reddit and LinkedIn in one thread list'],
    ads: ['Ads Center', 'Ads built from real audience language'],
    affiliate: ['Affiliate & payouts', 'Tracking links, conversions and what you owe'],
    community: ['Community signals', 'Reddit and X conversations about your category'],
    expansion: ['Expansion & upsell', 'Scale what already works'],
    platforms: ['Platforms', 'Connections that power discovery, ads and attribution'],
    settings: ['Settings', 'Workspace, team and billing'],
  };
  nav: any[] = [
    ['WORKSPACE', [['home', 'Home', ''], ['campaigns', 'Campaigns', '4']]],
    ['FIND', [['discovery', 'Discovery', ''], ['hotlist', 'Hotlist CRM', '42'], ['community', 'Community signals', '9']]],
    ['RUN', [['outreach', 'Outreach inbox', '4'], ['ads', 'Ads Center', '']]],
    ['PROVE', [['affiliate', 'Affiliate & payouts', ''], ['expansion', 'Expansion', '']]],
    ['SETUP', [['platforms', 'Platforms', ''], ['settings', 'Settings', '']]],
  ];
  go(screen: string) { this.setState({ screen }); if (typeof window !== 'undefined') window.scrollTo(0, 0); }
  renderVals(): any {
    const s = this.state;
    const meta = this.screenMeta[s.screen] || ['Aspen', ''];
    const stages = [['saved', 'Saved'], ['contacted', 'Contacted'], ['negotiating', 'Negotiating'], ['contracted', 'Contracted'], ['live', 'Live / posted']];
    const kanbanData: any = {
      saved: [['Tech With Priya', '▶', '#F03', 94, '$28 CPM'], ['r/humanresources mods', 'r/', '#FF4500', 88, 'Promoted'], ['@quietcompounder', 'X', '#17141E', 89, '$14 CPM']],
      contacted: [['Finance Stack Weekly', '▶', '#F03', 92, '$36 CPM'], ['Marcus Vale', 'in', '#0A66C2', 95, '$41 CPM']],
      negotiating: [['The People Ops Show', '▶', '#F03', 94, '$32 CPM'], ['Dana Reyes', 'in', '#0A66C2', 91, '$26 CPM']],
      contracted: [['u/ship_it_sam', 'r/', '#FF4500', 91, 'Rev-share']],
      live: [['Maya Kessler', 'X', '#17141E', 89, '$18 CPM'], ['HR Brew column', 'in', '#0A66C2', 87, '$33 CPM']],
    };
    const campaignRows: any = [
      ['Q3 people-ops push', [['YouTube', '#F03'], ['LinkedIn', '#0A66C2']], 'Affiliate sales', 'Aspen HR onboarding suite for mid-market teams', 'Active', '$24,000'],
      ['CFO memo test', [['LinkedIn', '#0A66C2'], ['X', '#17141E']], 'Thought leadership', 'Finance ops product for controllers at Series B+', 'Active', '$12,500'],
      ['Dev tools launch', [['YouTube', '#F03'], ['Reddit', '#FF4500'], ['X', '#17141E']], 'Brand awareness', 'CLI tool for indie SaaS developers', 'Draft', '$8,000'],
      ['Spring review push', [['YouTube', '#F03']], 'Product review', 'Q1 product-review sponsorships', 'Completed', '$31,200'],
    ];
    const tabFilter: any = { all: null, active: 'Active', draft: 'Draft', completed: 'Completed' };
    const statusStyle: any = { Active: ['#DDF3E6', '#0E7A3D'], Draft: ['#F5F1E9', '#8A8494'], Completed: ['#E7EDFB', '#3159A8'] };
    return {
      title: meta[0], subtitle: meta[1],
      campaignName: this.campaigns[s.campaign],
      cycleCampaign: () => this.setState({ campaign: (s.campaign + 1) % this.campaigns.length }),
      isHome: s.screen === 'home', isCampaigns: s.screen === 'campaigns', isDiscovery: s.screen === 'discovery',
      isCreator: s.screen === 'creator', isHotlist: s.screen === 'hotlist', isOutreach: s.screen === 'outreach',
      isAds: s.screen === 'ads', isAffiliate: s.screen === 'affiliate', isCommunity: s.screen === 'community',
      isExpansion: s.screen === 'expansion', isPlatforms: s.screen === 'platforms', isSettings: s.screen === 'settings',
      goHome: () => this.go('home'), goCampaignNew: () => this.go('campaigns'), goDiscovery: () => this.go('discovery'),
      goHotlist: () => this.go('hotlist'), goOutreach: () => this.go('outreach'), goAds: () => this.go('ads'),
      goAffiliate: () => this.go('affiliate'), goCreator: () => this.go('creator'),
      navGroups: this.nav.map(([title, items]) => ({
        title,
        items: items.map(([key, label, badge]: any[]) => {
          const on = s.screen === key || (key === 'discovery' && s.screen === 'creator');
          return {
            label, badge,
            bg: on ? '#F2542D' : 'transparent',
            fg: on ? '#FAF7F1' : '#B8B2C2',
            badgeFg: on ? '#FFD9CC' : '#6E6879',
            select: () => this.go(key),
          };
        }),
      })),
      activity: [
        { glyph: '▶', color: '#F03', text: 'The People Ops Show replied — asking for the affiliate rate card', when: '22 minutes ago' },
        { glyph: 'r/', color: '#FF4500', text: 'Promoted post live in r/humanresources · 1,840 clicks so far', when: '3 hours ago' },
        { glyph: 'in', color: '#0A66C2', text: 'Marcus Vale moved to Contracted', when: 'Yesterday' },
        { glyph: 'X', color: '#17141E', text: '2 new ad drafts from this week\u2019s comment signals', when: 'Yesterday' },
        { glyph: '$', color: '#F2542D', text: '$4,210 in attributed revenue posted from 3 tracking links', when: '2 days ago' },
      ],
      topCreators: [
        { name: 'Marcus Vale · The CFO Memo', platform: 'LinkedIn', score: 95, width: '95%' },
        { name: 'The People Ops Show', platform: 'YouTube', score: 94, width: '94%' },
        { name: 'Tech With Priya', platform: 'YouTube', score: 94, width: '94%' },
        { name: 'u/ship_it_sam', platform: 'Reddit', score: 91, width: '91%' },
      ],
      revenueBars: [28, 34, 30, 46, 42, 55, 62, 58, 71, 66, 84, 100].map((h, i) => ({
        height: h + '%', color: i > 8 ? '#F2542D' : i > 5 ? '#FFD84D' : '#3A3546',
      })),
      campaignTabs: [['all', 'All (4)'], ['active', 'Active (2)'], ['draft', 'Draft (1)'], ['completed', 'Completed (1)']].map(([key, label]) => ({
        label,
        fg: s.campaignTab === key ? '#17141E' : '#8A8494',
        bd: s.campaignTab === key ? '#F2542D' : 'transparent',
        select: () => this.setState({ campaignTab: key }),
      })),
      campaignRows: campaignRows
        .filter((r: any) => !tabFilter[s.campaignTab] || r[4] === tabFilter[s.campaignTab])
        .map(([name, platforms, goal, product, status, budget]: any[]) => ({
          name, goal, product, status, budget,
          statusBg: statusStyle[status][0], statusFg: statusStyle[status][1],
          platforms: platforms.map(([label, color]: any[]) => ({ label, color })),
        })),
      searchQuery: s.search,
      setSearch: (e: any) => this.setState({ search: e.target.value }),
      discoveryResults: [
        ['The People Ops Show', '▶', '#F03', 'YouTube', 94, 'Weekly interviews with people ops leaders on hiring, retention and the tools they keep. 318K subs, 4.6% engagement.'],
        ['Dana Reyes · HR Brew', 'in', '#0A66C2', 'LinkedIn', 91, 'Columnist writing on HR tech buying for a CHRO audience. 92K followers, high comment quality from directors and up.'],
        ['u/askamanager_mod', 'r/', '#FF4500', 'Reddit', 88, 'Moderates two of the largest HR communities. Threads regularly turn into buying discussions about onboarding tools.'],
        ['Tech With Priya', '▶', '#F03', 'YouTube', 94, 'Dev-tool reviews with an unusually senior audience. 412K subs and the highest click-through of any channel we track.'],
        ['@quietcompounder', 'X', '#17141E', 'X', 89, 'Finance operator writing threads for CFOs and controllers. Open DMs and a history of paid collaborations.'],
        ['Finance Stack Weekly', '▶', '#F03', 'YouTube', 92, 'Fintech tool reviews aimed at finance teams at Series B and later. 208K subs, 3.8% engagement.'],
      ].map(([name, glyph, color, platform, fit, description]) => ({ name, glyph, color, platform, fit, description })),
      stageChips: stages.map(([key, label]) => {
        const on = s.stage === key;
        return {
          label,
          bg: on ? '#F2542D' : 'transparent',
          fg: on ? '#FAF7F1' : '#4A4553',
          bd: on ? '#F2542D' : '#E8E2D6',
          select: () => this.setState({ stage: key }),
        };
      }),
      platformFilters: ['All', 'YouTube', 'Reddit', 'X', 'LinkedIn'].map(label => {
        const on = s.platformFilter === label;
        return {
          label,
          bg: on ? '#FAF7F1' : 'transparent',
          fg: on ? '#17141E' : '#B8B2C2',
          bd: on ? '#FAF7F1' : '#3A3546',
          select: () => this.setState({ platformFilter: label }),
        };
      }),
      searchEmpty: !s.search.trim(),
      hasResults: !!s.search.trim(),
      threadPaneDisplay: s.inbox === 'archived' ? 'none' : 'block',
      inboxEmpty: s.inbox === 'archived',
      inboxTabs: [['open', 'Open (5)'], ['archived', 'Archived']].map(([key, label]) => ({
        label,
        bg: s.inbox === key ? '#17141E' : '#fff',
        fg: s.inbox === key ? '#FAF7F1' : '#4A4553',
        bd: s.inbox === key ? '#17141E' : '#E8E2D6',
        select: () => this.setState({ inbox: key }),
      })),
      threads: (s.inbox === 'archived' ? [] : this.threadData).map((t, i) => ({
        name: t.name, channel: t.channel, channelColor: t.channelColor, status: t.status,
        statusColor: t.status === 'replied' ? '#F2542D' : t.status === 'bounced' ? '#C0341A' : '#1FA463',
        when: t.when, preview: t.preview,
        bd: s.thread === i ? '#F2542D' : '#E8E2D6',
        select: () => this.setState({ thread: i }),
      })),
      thread: (() => {
        const t = this.threadData[s.thread] || this.threadData[0];
        return {
          name: t.name, meta: t.meta,
          messages: t.messages.map(m => ({
            who: m[0] === 'out' ? 'YOU' : t.name.toUpperCase(),
            status: m[1], subject: m[2], body: m[3],
            bg: m[0] === 'out' ? '#FFF6F2' : '#FAF7F1',
            bd: m[0] === 'out' ? '#FFD9CC' : '#E8E2D6',
            indentLeft: m[0] === 'out' ? '32px' : '0px',
            indentRight: m[0] === 'out' ? '0px' : '32px',
          })),
        };
      })(),
      adsTabs: [['generate', 'Generate'], ['library', 'Library'], ['intelligence', 'Intelligence']].map(([key, label]) => ({
        label,
        bg: s.adsTab === key ? '#17141E' : 'transparent',
        fg: s.adsTab === key ? '#FAF7F1' : '#4A4553',
        bd: s.adsTab === key ? '#17141E' : '#E8E2D6',
        select: () => this.setState({ adsTab: key }),
      })),
      intelGroups: [
        ['HOOKS', ['"still doing this in a spreadsheet"', '"the onboarding debt problem"', '"nobody owns this"']],
        ['PHRASES', ['spreadsheet of shame', 'first 90 days', 'manager handoff', 'audit trail']],
        ['THEMES', ['compliance anxiety', 'manual busywork', 'tool sprawl']],
        ['AFFILIATE ANGLES', ['switch-from-competitor', 'time saved per hire', 'proof for the CFO']],
      ].map(([title, terms]: any[]) => ({
        title,
        terms: terms.map((label: any) => {
          const on = this.state.terms.includes(label);
          return {
            label,
            bg: on ? '#FFECD9' : '#FAF7F1',
            fg: on ? '#B33A12' : '#4A4553',
            bd: on ? '#F2542D' : '#E8E2D6',
            select: () => this.setState((st: any) => ({
              terms: st.terms.includes(label) ? st.terms.filter((x: any) => x !== label) : [...st.terms, label],
            })),
          };
        }),
      })),
      adHeadline: s.adHeadline,
      adBody: s.adBody,
      adCta: s.adCta,
      setAdHeadline: (e: any) => this.setState({ adHeadline: e.target.value }),
      setAdBody: (e: any) => this.setState({ adBody: e.target.value }),
      setAdCta: (e: any) => this.setState({ adCta: e.target.value }),
      affiliateLinks: [
        ['The People Ops Show', 'aspen.link/pops-q3', '12,480', '486', '$68,240', '3.9%'],
        ['Marcus Vale · CFO Memo', 'aspen.link/cfo-memo', '8,210', '312', '$44,900', '3.8%'],
        ['r/humanresources promoted', 'aspen.link/hr-reddit', '9,640', '241', '$31,180', '2.5%'],
        ['Tech With Priya', 'aspen.link/twp-cli', '6,120', '176', '$26,400', '2.9%'],
        ['@quietcompounder', 'aspen.link/qc-dm', '2,490', '69', '$13,480', '2.8%'],
      ].map(([name, url, clicks, conversions, revenue, rate]) => ({ name, url, clicks, conversions, revenue, rate })),
      communityTabs: ['Buyer intent', 'Brand mentions', 'Competitor mentions', 'Trending topics'].map((label, i) => ({
        label,
        fg: s.communityTab === i ? '#17141E' : '#8A8494',
        bd: s.communityTab === i ? '#F2542D' : 'transparent',
        select: () => this.setState({ communityTab: i }),
      })),
      signals: this.signalData[s.communityTab].map(x => ({
        glyph: x[0], color: x[1], where: x[2], when: x[3], quote: x[4], why: x[5],
        tag: x[6],
        tagBg: x[6] === 'High intent' ? '#FFECD9' : '#F5F1E9',
        tagFg: x[6] === 'High intent' ? '#B33A12' : '#4A4553',
      })),
      performers: [
        ['The People Ops Show', '▶', '#F03', '$68,240', '5.8×', 'Renew', '#DDF3E6', '#0E7A3D'],
        ['Marcus Vale · CFO Memo', 'in', '#0A66C2', '$44,900', '4.4×', 'Renew', '#DDF3E6', '#0E7A3D'],
        ['r/humanresources', 'r/', '#FF4500', '$31,180', '3.1×', 'Scale spend', '#FFECD9', '#B33A12'],
        ['@quietcompounder', 'X', '#17141E', '$13,480', '1.6×', 'Watch', '#F5F1E9', '#8A8494'],
      ].map(([name, glyph, color, revenue, roas, tag, tagBg, tagFg]) => ({ name, glyph, color, revenue, roas, tag, tagBg, tagFg })),
      platformCards: [
        ['YouTube', '▶', '#F03', '#FFF0EF', 'Creator partnerships', 'Video sponsorships and integrations', 'Video', 'Channel emails, topic clusters and audience fit all read from the YouTube Data API.', 'Connected · 4,120 channels indexed', '#0E7A3D', 'Manage'],
        ['Reddit', 'r/', '#FF4500', '#FFF2EC', 'Audience intelligence', 'Ad targeting from community signals', 'Ads', 'Subreddit mapping, sentiment and Promoted Posts, seeded by your best-performing videos.', 'Connected · 38 subreddits watched', '#0E7A3D', 'Manage'],
        ['X', 'X', '#17141E', '#F5F1E9', 'Creator amplification', 'DM outreach, whitelisting and paid reach', 'Social', 'Find open-DM creators, run sequences, then whitelist the posts that land as X Ads.', 'Connected · DM sending live', '#0E7A3D', 'Manage'],
        ['LinkedIn', 'in', '#0A66C2', '#EFF5FD', 'Professional reviews', 'B2B thought leadership and advocacy', 'B2B', 'Match voices to your buying committee and track which posts influence pipeline.', 'Connected · pipeline tracking on', '#0E7A3D', 'Manage'],
      ].map(([, glyph, color, bandBg, title, subtitle, tag, body, status, statusFg, action]) => ({
        glyph, color, bandBg, title, subtitle, tag, body, status, statusFg, action,
        tagBg: '#fff', tagFg: '#4A4553',
      })),
      companyName: s.companyName,
      setCompanyName: (e: any) => this.setState({ companyName: e.target.value }),
      kanban: stages.map(([key, label]: any[]) => {
        const cards = (kanbanData[key] || []).filter((c: any) => s.platformFilter === 'All' || (
          s.platformFilter === 'YouTube' ? c[2] === '#F03' :
          s.platformFilter === 'Reddit' ? c[2] === '#FF4500' :
          s.platformFilter === 'X' ? c[2] === '#17141E' : c[2] === '#0A66C2'
        ));
        return {
          label, count: cards.length,
          cards: cards.map(([name, glyph, color, fit, cpm]: any[]) => ({ name, glyph, color, fit, cpm })),
        };
      }),
    };
  }

  render() {
    const v: any = this.renderVals();
    return (
      <div className="flex min-h-screen bg-cream">
      
        {/* SIDEBAR */}
        <aside className="w-[246px] shrink-0 bg-dark text-cream p-[22px_16px] flex flex-col gap-[26px] sticky top-0 h-[100vh] box-border overflow-y-auto">
          <a href="/" className="flex items-center gap-[10px] p-[0_8px]">
            <div className="w-[28px] h-[28px] rounded-[9px] bg-accent grid place-items-center text-cream font-heading font-extrabold text-[16px]">a</div>
            <span className="font-heading font-extrabold text-[19px] tracking-[-0.02em] text-cream">aspen</span>
          </a>
      
          <div className="bg-dark-raised rounded-[14px] p-[12px_13px]">
            <div className="text-[10.5px] font-bold tracking-[0.12em] text-subtle">CAMPAIGN</div>
            <div className="flex items-center justify-between gap-[8px] mt-[6px]">
              <span className="font-bold text-[14px] text-cream">{v.campaignName}</span>
              <button onClick={v.cycleCampaign}  className="border-0 bg-transparent text-subtle text-[13px] font-bold cursor-pointer ah20">⇄</button>
            </div>
          </div>
      
          {(v.navGroups || []).map((g: any, $index: number) => (<React.Fragment key={$index}>
            <div className="flex flex-col gap-[3px]">
              <div className="text-[10.5px] font-bold tracking-[0.14em] text-dark-muted p-[0_10px_6px]">{g.title}</div>
              {(g.items || []).map((i: any, $index: number) => (<React.Fragment key={$index}>
                <button onClick={i.select} className="flex items-center justify-between gap-[8px] w-full text-left border-0 cursor-pointer p-[9px_11px] rounded-[11px] text-[14.5px] font-semibold" style={{ background: i.bg, color: i.fg }}>
                  {i.label}<span className="text-[11px] font-bold" style={{ color: i.badgeFg }}>{i.badge}</span>
                </button>
              </React.Fragment>))}
            </div>
          </React.Fragment>))}
      
          <div className="mt-[auto] border-t-[1px] border-dark-border pt-[16px] flex items-center gap-[10px]">
            <div className="w-[32px] h-[32px] rounded-[10px] bg-highlight text-dark grid place-items-center font-extrabold text-[13px]">PN</div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold text-cream">Priya Nair</div>
              <div className="text-[11.5px] text-subtle">Northbeam · Admin</div>
            </div>
          </div>
        </aside>
      
        {/* MAIN */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center justify-between gap-[20px] p-[20px_32px] border-b-[1.5px] border-border bg-cream sticky top-0 z-10 flex-wrap">
            <div>
              <h1 className="font-heading font-extrabold text-[26px] tracking-[-0.025em] m-0">{v.title}</h1>
              <div className="text-[13.5px] text-subtle mt-[2px]">{v.subtitle}</div>
            </div>
            <div className="flex items-center gap-[10px]">
              <span className="inline-flex items-center gap-[8px] bg-surface border-[1.5px] border-border rounded-[11px] p-[9px_13px] text-[13px] font-semibold text-muted"><span className="w-[8px] h-[8px] rounded-full bg-success"></span>4 platforms connected</span>
              <button onClick={v.goCampaignNew}  className="border-0 bg-accent text-cream text-[14px] font-bold p-[11px_18px] rounded-[12px] cursor-pointer ah21">+ New campaign</button>
            </div>
          </header>
      
          <div className="p-[28px_32px_64px] flex-1">
      
            {/* HOME */}
            {v.isHome ? (<>
              <div className="flex flex-col gap-[20px]">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
                    <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">CAMPAIGNS</div>
                    <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">4</div>
                    <div className="text-[13px] text-muted">2 active · 1 draft · 1 done</div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
                    <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">CREATORS IN HOTLIST</div>
                    <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">42</div>
                    <div className="text-[13px] text-muted">9 added this week</div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
                    <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">PENDING OUTREACH</div>
                    <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">18</div>
                    <div className="text-[13px] text-muted">6 awaiting a reply over 5 days</div>
                  </div>
                  <div className="bg-tint rounded-[20px] p-[20px]">
                    <div className="text-[12.5px] font-bold tracking-[0.1em] text-accent-ink">AVG BRAND FIT</div>
                    <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px] text-accent-ink">87</div>
                    <div className="text-[13px] text-accent-ink-soft">Across scored creators in this campaign</div>
                  </div>
                </div>
      
                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[16px]">
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <div className="flex items-center justify-between mb-[16px]">
                      <h3 className="font-heading font-bold text-[17px] m-0">Recent campaign activity</h3>
                      <button onClick={v.goOutreach} className="border-0 bg-transparent text-[13px] font-bold text-accent cursor-pointer">Open inbox →</button>
                    </div>
                    <div className="flex flex-col">
                      {(v.activity || []).map((a: any, $index: number) => (<React.Fragment key={$index}>
                        <div className="flex gap-[13px] items-start p-[12px_0] border-t-[1px] border-border-soft">
                          <div className="w-[30px] h-[30px] rounded-[9px] text-surface grid place-items-center font-extrabold text-[11px] shrink-0" style={{ background: a.color }}>{a.glyph}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-semibold leading-[1.4]">{a.text}</div>
                            <div className="text-[12px] text-subtle mt-[2px]">{a.when}</div>
                          </div>
                        </div>
                      </React.Fragment>))}
                    </div>
                  </div>
      
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_18px]">Top creators by brand fit</h3>
                    <div className="flex flex-col gap-[16px]">
                      {(v.topCreators || []).map((c: any, $index: number) => (<React.Fragment key={$index}>
                        <div>
                          <div className="flex justify-between items-baseline gap-[12px] mb-[7px]">
                            <span className="text-[14px] font-bold">{c.name}</span>
                            <span className="text-[12px] font-semibold text-subtle">{c.platform}</span>
                          </div>
                          <div className="flex items-center gap-[11px]">
                            <div className="flex-1 h-[8px] rounded-full bg-sand">
                              <div className="h-[8px] rounded-full bg-accent" style={{ width: c.width }}></div>
                            </div>
                            <span className="text-[12.5px] font-bold text-accent">{c.score}</span>
                          </div>
                        </div>
                      </React.Fragment>))}
                    </div>
                  </div>
                </div>
      
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[16px]">
                  <div className="bg-dark text-cream rounded-[20px] p-[22px]">
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <h3 className="font-heading font-bold text-[17px] m-0">Attributed revenue</h3>
                      <span className="text-[12.5px] font-semibold text-on-dark">Last 30 days</span>
                    </div>
                    <div className="flex items-baseline gap-[12px] mt-[14px]">
                      <span className="font-heading font-extrabold text-[42px] tracking-[-0.03em]">$184,200</span>
                      <span className="text-[13.5px] font-bold text-highlight">+22%</span>
                    </div>
                    <div className="flex items-end gap-[6px] h-[78px] mt-[18px]">
                      {(v.revenueBars || []).map((b: any, $index: number) => (<React.Fragment key={$index}>
                        <div className="flex-1 rounded-[4px_4px_0_0]" style={{ background: b.color, height: b.height }}></div>
                      </React.Fragment>))}
                    </div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_4px]">Quick actions</h3>
                    <div className="text-[13px] text-subtle mb-[16px]">Where teams usually pick up.</div>
                    <div className="grid grid-cols-[1fr_1fr] gap-[10px]">
                      <button onClick={v.goDiscovery}  className="text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah22">
                        <div className="font-bold text-[14.5px]">Find creators</div>
                        <div className="text-[12.5px] text-subtle mt-[3px]">Search all four platforms</div>
                      </button>
                      <button onClick={v.goOutreach}  className="text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah23">
                        <div className="font-bold text-[14.5px]">Send outreach</div>
                        <div className="text-[12.5px] text-subtle mt-[3px]">18 drafts waiting</div>
                      </button>
                      <button onClick={v.goAds}  className="text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah24">
                        <div className="font-bold text-[14.5px]">Build an ad</div>
                        <div className="text-[12.5px] text-subtle mt-[3px]">From this week's signals</div>
                      </button>
                      <button onClick={v.goAffiliate}  className="text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah25">
                        <div className="font-bold text-[14.5px]">View payouts</div>
                        <div className="text-[12.5px] text-subtle mt-[3px]">3 due this week</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>) : null}
      
            {/* CAMPAIGNS */}
            {v.isCampaigns ? (<>
              <div>
                <div className="flex gap-[26px] border-b-[1.5px] border-border mb-[22px]">
                  {(v.campaignTabs || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                    <button onClick={t.select} className="border-0 bg-transparent cursor-pointer p-[0_0_13px] text-[14.5px] font-bold mb-[-1.5px]" style={{ color: t.fg, borderBottom: `2.5px solid ${t.bd}` }}>{t.label}</button>
                  </React.Fragment>))}
                </div>
                <div className="flex flex-col gap-[12px]">
                  {(v.campaignRows || []).map((c: any, $index: number) => (<React.Fragment key={$index}>
                    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px_24px] flex gap-[24px] items-center flex-wrap">
                      <div className="flex-[1_1_260px] min-w-0">
                        <div className="font-bold text-[16.5px]">{c.name}</div>
                        <div className="flex gap-[6px] mt-[9px] flex-wrap">
                          {(c.platforms || []).map((p: any, $index: number) => (<React.Fragment key={$index}>
                            <span className="text-[11px] font-bold text-surface p-[4px_9px] rounded-[7px]" style={{ background: p.color }}>{p.label}</span>
                          </React.Fragment>))}
                        </div>
                      </div>
                      <div className="flex-[1_1_260px] min-w-0 text-[13.5px] text-muted leading-[1.5]">
                        <div className="font-semibold text-dark">Goal: {c.goal}</div>
                        <div>{c.product}</div>
                      </div>
                      <div className="flex items-center gap-[14px] flex-wrap">
                        <span className="text-[12px] font-bold p-[6px_12px] rounded-[8px]" style={{ background: c.statusBg, color: c.statusFg }}>{c.status}</span>
                        <span className="text-[14px] font-bold">{c.budget}</span>
                        <button onClick={v.goHotlist}  className="border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah26">Creators</button>
                        <button onClick={v.goAds}  className="border-0 bg-dark text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer ah27">Open →</button>
                      </div>
                    </div>
                  </React.Fragment>))}
                </div>
              </div>
            </>) : null}
      
            {/* DISCOVERY */}
            {v.isDiscovery ? (<>
              <div>
                <div className="flex gap-[10px] mb-[12px] flex-wrap">
                  <input value={v.searchQuery} onChange={v.setSearch} placeholder="Search creators by name, niche, or keyword" className="flex-1 min-w-[260px] h-[52px] p-[0_18px] rounded-[14px] border-[1.5px] border-border bg-surface text-[15.5px] outline-none" />
                  <button  className="border-0 bg-accent text-cream text-[15px] font-bold p-[0_26px] rounded-[14px] cursor-pointer ah28">Search</button>
                </div>
                <div className="text-[13.5px] text-subtle mb-[22px]">Scored against <strong className="text-muted">{v.campaignName}</strong> — product, audience and brief all feed the fit estimate.</div>
                {v.searchEmpty ? (<>
                  <div className="bg-surface border-[1.5px] border-border rounded-[24px] p-[44px_32px] text-center max-w-[520px] mx-auto">
                    <img src="/aspen/empty-discovery.webp" alt="A clay telescope on a plinth" className="w-[190px] block mx-auto" loading="lazy" />
                    <div className="font-heading font-extrabold text-[22px] tracking-[-0.02em] mt-[6px]">Nothing to look at yet</div>
                    <p className="text-[14.5px] text-muted leading-[1.6] m-[10px_auto_0] max-w-[340px]">Describe who you want to reach and Aspen searches YouTube, Reddit, X and LinkedIn at once.</p>
                  </div>
                </>) : null}
                {v.hasResults ? (<>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[16px]">
                  {(v.discoveryResults || []).map((c: any, $index: number) => (<React.Fragment key={$index}>
                    <div  className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px] flex flex-col ah29">
                      <div className="flex gap-[12px] items-center">
                        <div className="w-[44px] h-[44px] rounded-[13px] text-surface grid place-items-center font-extrabold text-[14px] shrink-0" style={{ background: c.color }}>{c.glyph}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-[15.5px]">{c.name}</div>
                          <div className="flex gap-[6px] mt-[5px]">
                            <span className="text-[11px] font-bold p-[3px_8px] rounded-[7px] bg-sand text-muted">{c.platform}</span>
                            <span className="text-[11px] font-bold p-[3px_8px] rounded-[7px] bg-tint text-accent-ink">~{c.fit}% fit</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[13.5px] text-muted leading-[1.5] m-[14px_0_18px] flex-1">{c.description}</p>
                      <div className="flex gap-[8px]">
                        <button onClick={v.goHotlist}  className="flex-1 border-0 bg-accent text-cream text-[13.5px] font-bold p-[11px_0] rounded-[11px] cursor-pointer ah30">Add to hotlist</button>
                        <button onClick={v.goCreator}  className="flex-1 border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[10px_0] rounded-[11px] cursor-pointer ah31">Profile →</button>
                      </div>
                    </div>
                  </React.Fragment>))}
                </div>
                </>) : null}
              </div>
            </>) : null}
      
            {/* CREATOR PROFILE */}
            {v.isCreator ? (<>
              <div className="flex flex-col gap-[16px] max-w-[920px]">
                <button onClick={v.goDiscovery}  className="self-start border-0 bg-transparent text-[13.5px] font-bold text-subtle cursor-pointer p-0 ah32">← Back to discovery</button>
                <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[26px] flex gap-[22px] items-start flex-wrap">
                  <div className="w-[76px] h-[76px] rounded-[22px] bg-youtube text-surface grid place-items-center font-extrabold text-[22px] shrink-0">▶</div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-[10px] flex-wrap">
                      <h2 className="font-heading font-extrabold text-[30px] tracking-[-0.025em] m-0">The People Ops Show</h2>
                      <span className="text-[11px] font-bold text-surface bg-youtube p-[4px_9px] rounded-[7px]">YouTube</span>
                      <span className="text-[11px] font-bold bg-sand text-muted p-[4px_9px] rounded-[7px]">Negotiating</span>
                    </div>
                    <div className="text-[14.5px] text-muted mt-[8px]"><strong className="text-dark">94%</strong> brand fit · <strong className="text-dark">$32</strong> CPM · 318K subscribers · 4.6% engagement</div>
                  </div>
                  <div className="flex gap-[10px]">
                    <button onClick={v.goOutreach}  className="border-0 bg-accent text-cream text-[14px] font-bold p-[12px_18px] rounded-[12px] cursor-pointer ah33">Contact creator</button>
                    <button  className="border-[1.5px] border-accent bg-transparent text-accent text-[14px] font-bold p-[11px_16px] rounded-[12px] cursor-pointer ah34">★ In hotlist</button>
                  </div>
                </div>
      
                <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
                  <h3 className="font-heading font-bold text-[17px] m-[0_0_14px]">Stage</h3>
                  <div className="flex gap-[8px] flex-wrap">
                    {(v.stageChips || []).map((s: any, $index: number) => (<React.Fragment key={$index}>
                      <button onClick={s.select} className="text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer" style={{ border: `1.5px solid ${s.bd}`, background: s.bg, color: s.fg }}>{s.label}</button>
                    </React.Fragment>))}
                  </div>
                </div>
      
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px]">
                  <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_10px]">About</h3>
                    <p className="text-[14.5px] leading-[1.6] text-muted m-0">Weekly interviews with people ops leaders on hiring, retention and the tools they actually keep. Audience skews HR directors and CHROs at 200–2,000 person companies in the US and UK.</p>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_14px]">Why it fits</h3>
                    <div className="flex flex-col gap-[10px]">
                      <div className="flex items-center gap-[11px] text-[13px] font-semibold"><span className="w-[96px] text-muted">Audience fit</span><div className="flex-1 h-[8px] bg-sand rounded-full"><div className="w-[94%] h-[8px] bg-accent rounded-full"></div></div><span>94</span></div>
                      <div className="flex items-center gap-[11px] text-[13px] font-semibold"><span className="w-[96px] text-muted">Topic match</span><div className="flex-1 h-[8px] bg-sand rounded-full"><div className="w-[91%] h-[8px] bg-accent-soft rounded-full"></div></div><span>91</span></div>
                      <div className="flex items-center gap-[11px] text-[13px] font-semibold"><span className="w-[96px] text-muted">Engagement</span><div className="flex-1 h-[8px] bg-sand rounded-full"><div className="w-[78%] h-[8px] bg-highlight rounded-full"></div></div><span>78</span></div>
                      <div className="flex items-center gap-[11px] text-[13px] font-semibold"><span className="w-[96px] text-muted">Comments</span><div className="flex-1 h-[8px] bg-sand rounded-full"><div className="w-[86%] h-[8px] bg-accent-soft rounded-full"></div></div><span>86</span></div>
                    </div>
                  </div>
                </div>
      
                <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
                  <h3 className="font-heading font-bold text-[17px] m-[0_0_14px]">Contact paths found</h3>
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex items-center justify-between gap-[14px] bg-cream rounded-[13px] p-[13px_16px]"><span className="text-[14px] font-semibold">Channel email · hello@peopleopsshow.com</span><span className="text-[12px] font-bold text-success">Verified</span></div>
                    <div className="flex items-center justify-between gap-[14px] bg-cream rounded-[13px] p-[13px_16px]"><span className="text-[14px] font-semibold">X DM · @peopleopsshow</span><span className="text-[12px] font-bold text-subtle">Open DMs</span></div>
                    <div className="flex items-center justify-between gap-[14px] bg-cream rounded-[13px] p-[13px_16px]"><span className="text-[14px] font-semibold">LinkedIn · Dana Reyes</span><span className="text-[12px] font-bold text-subtle">Match by name + niche</span></div>
                  </div>
                </div>
              </div>
            </>) : null}
      
            {/* HOTLIST */}
            {v.isHotlist ? (<>
              <div>
                <div className="flex gap-[16px] flex-wrap mb-[20px]">
                  <div className="flex-[1_1_420px] min-w-[300px] bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <div className="flex items-center justify-between gap-[12px] mb-[6px]">
                      <h3 className="font-heading font-bold text-[17px] m-0">Fit &amp; reach map</h3>
                      <button  className="border-0 bg-accent text-cream text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah35">Score creators</button>
                    </div>
                    <div className="text-[13px] text-subtle mb-[14px]">Drag the budget line to filter. The best-match zone is highlighted.</div>
                    <svg viewBox="0 0 520 220" className="w-full block">
                      <rect x="300" y="20" width="200" height="110" rx="12" fill="#FFECD9"></rect>
                      <text x="310" y="40" fontFamily="Instrument Sans" fontSize="11" fontWeight="700" fill="#B33A12">BEST MATCH</text>
                      <line x1="40" y1="196" x2="500" y2="196" stroke="#E8E2D6" strokeWidth="1.5"></line>
                      <line x1="40" y1="20" x2="40" y2="196" stroke="#E8E2D6" strokeWidth="1.5"></line>
                      <line x1="40" y1="140" x2="500" y2="140" stroke="#FFD84D" strokeWidth="2" strokeDasharray="6 5"></line>
                      <text x="46" y="134" fontFamily="Instrument Sans" fontSize="10.5" fontWeight="700" fill="#9A7A00">BUDGET CAP · $40 CPM</text>
                      <circle cx="392" cy="52" r="9" fill="#F2542D"></circle>
                      <circle cx="436" cy="76" r="7" fill="#F2542D"></circle>
                      <circle cx="342" cy="92" r="6" fill="#F98A6B"></circle>
                      <circle cx="470" cy="42" r="6" fill="#F2542D"></circle>
                      <circle cx="228" cy="118" r="7" fill="#C9C1B4"></circle>
                      <circle cx="166" cy="160" r="6" fill="#C9C1B4"></circle>
                      <circle cx="104" cy="178" r="5" fill="#C9C1B4"></circle>
                      <circle cx="272" cy="166" r="5" fill="#C9C1B4"></circle>
                      <text x="270" y="214" fontFamily="Instrument Sans" fontSize="10.5" fontWeight="700" fill="#8A8494">BRAND FIT →</text>
                    </svg>
                  </div>
                  <div className="flex-[1_1_240px] min-w-[240px] bg-dark text-cream rounded-[20px] p-[22px] flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-[17px] m-0">42 creators, 5 stages</h3>
                      <p className="text-[13.5px] text-on-dark leading-[1.55] m-[10px_0_0]">Drag a card to move it. Every stage change logs against the campaign, so the outreach cascade never double-messages anyone.</p>
                    </div>
                    <div className="flex gap-[7px] flex-wrap mt-[20px]">
                      {(v.platformFilters || []).map((f: any, $index: number) => (<React.Fragment key={$index}>
                        <button onClick={f.select} className="text-[12.5px] font-bold p-[8px_13px] rounded-[10px] cursor-pointer" style={{ border: `1.5px solid ${f.bd}`, background: f.bg, color: f.fg }}>{f.label}</button>
                      </React.Fragment>))}
                    </div>
                  </div>
                </div>
      
                <div className="flex gap-[14px] overflow-x-auto pb-[12px]">
                  {(v.kanban || []).map((col: any, $index: number) => (<React.Fragment key={$index}>
                    <div className="min-w-[262px] w-[262px] shrink-0 bg-sand-deep rounded-[18px] p-[14px]">
                      <div className="flex items-center gap-[8px] mb-[12px]">
                        <span className="font-bold text-[14px]">{col.label}</span>
                        <span className="text-[11px] font-bold text-subtle bg-surface p-[2px_8px] rounded-[7px]">{col.count}</span>
                      </div>
                      <div className="flex flex-col gap-[9px]">
                        {(col.cards || []).map((c: any, $index: number) => (<React.Fragment key={$index}>
                          <div className="bg-surface border-[1.5px] border-border rounded-[14px] p-[13px] cursor-grab">
                            <div className="flex gap-[10px] items-center">
                              <div className="w-[30px] h-[30px] rounded-[9px] text-surface grid place-items-center font-extrabold text-[11px] shrink-0" style={{ background: c.color }}>{c.glyph}</div>
                              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-bold leading-[1.3]">{c.name}</div></div>
                            </div>
                            <div className="flex gap-[6px] mt-[10px] flex-wrap">
                              <span className="text-[10.5px] font-bold bg-tint text-accent-ink p-[3px_7px] rounded-[6px]">{c.fit}% fit</span>
                              <span className="text-[10.5px] font-bold bg-sand text-muted p-[3px_7px] rounded-[6px]">{c.cpm}</span>
                            </div>
                          </div>
                        </React.Fragment>))}
                      </div>
                    </div>
                  </React.Fragment>))}
                </div>
              </div>
            </>) : null}
      
            {/* OUTREACH */}
            {v.isOutreach ? (<>
              <div>
                <div className="text-[14px] text-muted mb-[18px]">12 conversations · 4 replied — email, X, Reddit and LinkedIn in one place.</div>
                <div className="flex gap-[16px] items-start flex-wrap">
                  <div className="flex-[0_1_320px] min-w-[280px] flex flex-col gap-[9px]">
                    <div className="flex gap-[7px] mb-[3px]">
                      {(v.inboxTabs || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                        <button onClick={t.select} className="text-[12.5px] font-bold p-[8px_13px] rounded-[10px] cursor-pointer" style={{ border: `1.5px solid ${t.bd}`, background: t.bg, color: t.fg }}>{t.label}</button>
                      </React.Fragment>))}
                    </div>
                    {v.inboxEmpty ? (<>
                      <div className="bg-surface border-[1.5px] border-border rounded-[18px] p-[32px_22px] text-center">
                        <img src="/aspen/empty-outreach.webp" alt="A clay letterbox with one folded note" className="w-[120px] block mx-auto" loading="lazy" />
                        <div className="font-heading font-extrabold text-[18px] tracking-[-0.02em] mt-[4px]">Nothing archived</div>
                        <p className="text-[13.5px] text-muted leading-[1.55] m-[8px_auto_0] max-w-[230px]">Conversations you close land here, with every contact attempt still logged.</p>
                      </div>
                    </>) : null}
                    {(v.threads || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                      <button onClick={t.select} className="text-left cursor-pointer bg-surface rounded-[15px] p-[14px_15px]" style={{ border: `1.5px solid ${t.bd}` }}>
                        <div className="flex items-center justify-between gap-[10px]">
                          <span className="text-[14.5px] font-bold">{t.name}</span>
                          <span className="text-[10.5px] font-bold text-surface p-[3px_8px] rounded-[6px]" style={{ background: t.channelColor }}>{t.channel}</span>
                        </div>
                        <div className="flex items-center gap-[9px] mt-[7px]">
                          <span className="text-[11.5px] font-bold" style={{ color: t.statusColor }}>● {t.status}</span>
                          <span className="text-[11.5px] text-subtle">{t.when}</span>
                        </div>
                        <div className="text-[12.5px] text-subtle mt-[7px] leading-[1.4]">{t.preview}</div>
                      </button>
                    </React.Fragment>))}
                  </div>
      
                  <div className="flex-[1_1_420px] min-w-[320px] bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]" style={{ display: v.threadPaneDisplay }}>
                    <div className="flex items-center justify-between gap-[12px] pb-[16px] border-b-[1.5px] border-border-soft">
                      <div>
                        <div className="font-heading font-bold text-[18px]">{v.thread.name}</div>
                        <div className="text-[12.5px] text-subtle mt-[2px]">{v.thread.meta}</div>
                      </div>
                      <button  className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer ah36">Reply →</button>
                    </div>
                    <div className="flex flex-col gap-[12px] mt-[18px]">
                      {(v.thread.messages || []).map((m: any, $index: number) => (<React.Fragment key={$index}>
                        <div className="rounded-[15px] p-[15px]" style={{ background: m.bg, border: `1.5px solid ${m.bd}`, marginLeft: m.indentLeft, marginRight: m.indentRight }}>
                          <div className="flex items-center justify-between gap-[10px] mb-[7px]">
                            <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">{m.who}</span>
                            <span className="text-[11px] font-semibold text-subtle">{m.status}</span>
                          </div>
                          <div className="text-[13.5px] font-bold mb-[4px]">{m.subject}</div>
                          <div className="text-[14px] leading-[1.6] text-muted">{m.body}</div>
                        </div>
                      </React.Fragment>))}
                    </div>
                  </div>
                </div>
      
                <div className="text-[12px] font-bold tracking-[0.14em] text-subtle m-[34px_0_14px]">SENDING &amp; AUTOMATION</div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[16px]">
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[16.5px] m-[0_0_14px]">Sending identity</h3>
                    <div className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] p-[13px_15px]">
                      <span className="text-[14px] font-semibold">priya@northbeam.io · Gmail</span>
                      <span className="text-[11.5px] font-bold text-success-ink">Connected</span>
                    </div>
                    <div className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] p-[13px_15px] mt-[9px]">
                      <span className="text-[14px] font-semibold">partnerships@northbeam.io</span>
                      <button className="border-0 bg-transparent text-[12.5px] font-bold text-accent cursor-pointer">Connect</button>
                    </div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[16.5px] m-[0_0_14px]">Delivery</h3>
                    <div className="flex gap-[22px] flex-wrap">
                      <div><div className="font-heading font-extrabold text-[28px] tracking-[-0.02em]">96%</div><div className="text-[12.5px] text-subtle font-semibold">Delivered</div></div>
                      <div><div className="font-heading font-extrabold text-[28px] tracking-[-0.02em]">41%</div><div className="text-[12.5px] text-subtle font-semibold">Opened</div></div>
                      <div><div className="font-heading font-extrabold text-[28px] tracking-[-0.02em] text-accent">18%</div><div className="text-[12.5px] text-subtle font-semibold">Replied</div></div>
                    </div>
                    <div className="text-[12.5px] text-subtle leading-[1.5] mt-[14px]">Bounces retry down the cascade automatically — website form next, then X DM.</div>
                  </div>
                  <div className="bg-dark text-cream rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[16.5px] m-[0_0_12px]">Sequences</h3>
                    <div className="flex flex-col gap-[9px]">
                      <div className="flex items-center justify-between gap-[12px] bg-dark-raised rounded-[12px] p-[12px_14px]"><span className="text-[13.5px] font-semibold">People-ops intro · 3 steps</span><span className="text-[11.5px] font-bold text-highlight">Running</span></div>
                      <div className="flex items-center justify-between gap-[12px] bg-dark-raised rounded-[12px] p-[12px_14px]"><span className="text-[13.5px] font-semibold">Reddit mod outreach · 2 steps</span><span className="text-[11.5px] font-bold text-subtle">Paused</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </>) : null}
      
            {/* ADS CENTER */}
            {v.isAds ? (<>
              <div>
                <div className="flex gap-[8px] mb-[20px] flex-wrap">
                  {(v.adsTabs || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                    <button onClick={t.select} className="text-[13.5px] font-bold p-[10px_17px] rounded-[12px] cursor-pointer" style={{ border: `1.5px solid ${t.bd}`, background: t.bg, color: t.fg }}>{t.label}</button>
                  </React.Fragment>))}
                </div>
      
                <div className="flex gap-[16px] items-start flex-wrap">
                  <div className="flex-[0_1_340px] min-w-[290px] flex flex-col gap-[16px]">
                    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
                      <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[12px]">SIGNAL SOURCES</div>
                      <div className="flex gap-[7px] flex-wrap">
                        <span className="text-[11.5px] font-bold bg-success-wash text-success-ink p-[5px_10px] rounded-[8px]">YouTube</span>
                        <span className="text-[11.5px] font-bold bg-success-wash text-success-ink p-[5px_10px] rounded-[8px]">Reddit</span>
                        <span className="text-[11.5px] font-bold bg-success-wash text-success-ink p-[5px_10px] rounded-[8px]">X</span>
                        <span className="text-[11.5px] font-bold bg-success-wash text-success-ink p-[5px_10px] rounded-[8px]">LinkedIn</span>
                        <span className="text-[11.5px] font-bold bg-success-wash text-success-ink p-[5px_10px] rounded-[8px]">Affiliate</span>
                        <span className="text-[11.5px] font-bold bg-sand text-subtle p-[5px_10px] rounded-[8px]">Trends</span>
                      </div>
                      <div className="flex gap-[8px] mt-[14px]">
                        <input placeholder="Topic to listen for" className="flex-1 min-w-0 h-[42px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none" />
                        <button  className="border-0 bg-dark text-cream text-[13px] font-bold p-[0_15px] rounded-[11px] cursor-pointer ah37">Refresh</button>
                      </div>
                    </div>
      
                    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
                      <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">RANKED INTELLIGENCE</div>
                      <div className="text-[12.5px] text-subtle m-[8px_0_16px]">From 1,284 signals this week. Pick the terms that feed the draft.</div>
                      <div className="flex flex-col gap-[16px]">
                        {(v.intelGroups || []).map((g: any, $index: number) => (<React.Fragment key={$index}>
                          <div>
                            <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[8px]">{g.title}</div>
                            <div className="flex gap-[7px] flex-wrap">
                              {(g.terms || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                                <button onClick={t.select} className="text-[12.5px] font-semibold p-[7px_11px] rounded-[10px] cursor-pointer text-left" style={{ border: `1.5px solid ${t.bd}`, background: t.bg, color: t.fg }}>{t.label}</button>
                              </React.Fragment>))}
                            </div>
                          </div>
                        </React.Fragment>))}
                      </div>
                    </div>
                  </div>
      
                  <div className="flex-[1_1_420px] min-w-[320px] flex flex-col gap-[16px]">
                    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                      <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[12px]">GENERATE COPY</div>
                      <textarea placeholder="What are you advertising? Product, offer, and audience." rows={3} className="w-full box-border p-[14px] rounded-[14px] border-[1.5px] border-border bg-cream text-[14.5px] leading-[1.55] outline-none resize-y"></textarea>
                      <div className="flex gap-[10px] mt-[12px] flex-wrap items-center">
                        <select className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px]">
                          <option>Reddit</option><option>X</option><option>YouTube</option><option>LinkedIn</option>
                        </select>
                        <select className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px]">
                          <option>Confident</option><option>Direct</option><option>Playful</option><option>Expert</option>
                        </select>
                        <button  className="border-0 bg-accent text-cream text-[14px] font-bold p-[0_20px] h-[42px] rounded-[11px] cursor-pointer ah38">Generate copy</button>
                      </div>
                    </div>
      
                    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                      <div className="flex items-center justify-between gap-[12px] mb-[16px]">
                        <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">EDITOR</div>
                        <span className="text-[11px] font-bold bg-tint text-accent-ink p-[5px_10px] rounded-[8px]">Informed by affiliate performance</span>
                      </div>
                      <div className="flex gap-[20px] flex-wrap">
                        <div className="flex-[1_1_260px] min-w-[240px] flex flex-col gap-[12px]">
                          <div>
                            <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">HEADLINE</div>
                            <input value={v.adHeadline} onChange={v.setAdHeadline} className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14.5px] font-semibold outline-none" />
                          </div>
                          <div>
                            <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">BODY</div>
                            <textarea value={v.adBody} onChange={v.setAdBody} rows={4} className="w-full box-border p-[13px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14px] leading-[1.55] outline-none resize-y"></textarea>
                          </div>
                          <div>
                            <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[6px]">CALL TO ACTION</div>
                            <input value={v.adCta} onChange={v.setAdCta} className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14.5px] outline-none" />
                          </div>
                          <div className="flex gap-[9px] mt-[2px]">
                            <button  className="border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[11px_16px] rounded-[11px] cursor-pointer ah39">Save</button>
                            <button  className="border-0 bg-dark text-cream text-[13.5px] font-bold p-[12px_17px] rounded-[11px] cursor-pointer ah40">Save and share</button>
                          </div>
                        </div>
                        <div className="flex-[0_1_230px] min-w-[200px]">
                          <div className="text-[10.5px] font-bold tracking-[0.12em] text-sand-ink mb-[8px]">IMAGERY</div>
                          <img src="/aspen/ads.webp" alt="Generated ad creative" className="w-full rounded-[14px] block" loading="lazy" />
                          <textarea rows={2} placeholder="Describe the image" className="w-full box-border mt-[10px] p-[11px] rounded-[11px] border-[1.5px] border-border bg-cream text-[13px] leading-[1.5] outline-none resize-y"></textarea>
                          <button  className="w-full mt-[8px] border-[1.5px] border-border bg-transparent text-[13px] font-bold p-[10px_0] rounded-[11px] cursor-pointer ah41">Generate image</button>
                        </div>
                      </div>
                      <div className="text-[12.5px] text-subtle leading-[1.5] mt-[18px] pt-[16px] border-t-[1.5px] border-border-soft">Traced back to: <strong className="text-muted">"spreadsheet of shame"</strong> — 14 Reddit comments · <strong className="text-muted">"onboarding debt"</strong> — The People Ops Show, 2 videos</div>
                    </div>
                  </div>
                </div>
              </div>
            </>) : null}
      
            {/* AFFILIATE */}
            {v.isAffiliate ? (<>
              <div>
                <div className="flex items-center justify-between gap-[14px] bg-surface border-[1.5px] border-border rounded-[20px] p-[18px_22px] mb-[16px] flex-wrap">
                  <div>
                    <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle">SALES CONNECTION</div>
                    <div className="text-[14.5px] font-semibold mt-[5px]">Stripe connected — conversions post in through the ingest endpoint.</div>
                  </div>
                  <span className="text-[12px] font-bold text-success-ink bg-success-wash p-[7px_13px] rounded-[9px]">✓ Live</span>
                </div>
      
                <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[16px] mb-[16px]">
                  <div className="bg-dark text-cream rounded-[20px] p-[22px]">
                    <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">ATTRIBUTED REVENUE</div>
                    <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">$184,200</div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">CONVERSIONS</div>
                    <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">1,284</div>
                  </div>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <div className="text-[12px] font-bold tracking-[0.1em] text-subtle">CLICKS</div>
                    <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px]">38,940</div>
                  </div>
                  <div className="bg-tint rounded-[20px] p-[22px]">
                    <div className="text-[12px] font-bold tracking-[0.1em] text-accent-ink">PAYOUTS DUE</div>
                    <div className="font-heading font-extrabold text-[36px] tracking-[-0.03em] mt-[8px] text-accent-ink">$21,640</div>
                  </div>
                </div>
      
                <div className="flex gap-[10px] items-end bg-surface border-[1.5px] border-border rounded-[20px] p-[20px_22px] mb-[16px] flex-wrap">
                  <div className="flex-[1_1_260px] min-w-[220px]">
                    <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[7px]">DESTINATION URL</div>
                    <input placeholder="https://northbeam.io/pricing" className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none" />
                  </div>
                  <div className="flex-[0_1_180px] min-w-[150px]">
                    <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[7px]">LABEL</div>
                    <input placeholder="Optional" className="w-full box-border h-[44px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none" />
                  </div>
                  <button  className="border-0 bg-accent text-cream text-[14px] font-bold h-[44px] p-[0_20px] rounded-[11px] cursor-pointer ah42">Create link</button>
                </div>
      
                <div className="bg-surface border-[1.5px] border-border rounded-[20px] overflow-hidden">
                  <div className="flex gap-[12px] p-[14px_22px] border-b-[1.5px] border-border-soft text-[10.5px] font-bold tracking-[0.12em] text-subtle">
                    <span className="flex-[2]">CREATOR / LINK</span><span className="flex-1 text-right">CLICKS</span><span className="flex-1 text-right">CONV.</span><span className="flex-1 text-right">REVENUE</span><span className="flex-1 text-right">RATE</span>
                  </div>
                  {(v.affiliateLinks || []).map((l: any, $index: number) => (<React.Fragment key={$index}>
                    <div className="flex gap-[12px] items-center p-[15px_22px] border-b-[1px] border-sand">
                      <div className="flex-[2] min-w-0">
                        <div className="text-[14.5px] font-bold">{l.name}</div>
                        <div className="text-[12.5px] text-subtle mt-[2px]">{l.url}</div>
                      </div>
                      <span className="flex-1 text-right text-[14px] font-semibold text-muted">{l.clicks}</span>
                      <span className="flex-1 text-right text-[14px] font-semibold text-muted">{l.conversions}</span>
                      <span className="flex-1 text-right text-[14px] font-bold">{l.revenue}</span>
                      <span className="flex-1 text-right text-[14px] font-bold text-accent">{l.rate}</span>
                    </div>
                  </React.Fragment>))}
                </div>
              </div>
            </>) : null}
      
            {/* COMMUNITY */}
            {v.isCommunity ? (<>
              <div>
                <div className="flex gap-[26px] border-b-[1.5px] border-border mb-[22px] overflow-x-auto">
                  {(v.communityTabs || []).map((t: any, $index: number) => (<React.Fragment key={$index}>
                    <button onClick={t.select} className="border-0 bg-transparent cursor-pointer p-[0_0_13px] text-[14.5px] font-bold whitespace-nowrap mb-[-1.5px]" style={{ color: t.fg, borderBottom: `2.5px solid ${t.bd}` }}>{t.label}</button>
                  </React.Fragment>))}
                </div>
                <div className="flex flex-col gap-[12px] max-w-[920px]">
                  {(v.signals || []).map((s: any, $index: number) => (<React.Fragment key={$index}>
                    <div className="bg-surface border-[1.5px] border-border rounded-[18px] p-[20px_22px]">
                      <div className="flex items-center gap-[10px] flex-wrap">
                        <span className="w-[26px] h-[26px] rounded-[8px] text-surface grid place-items-center font-extrabold text-[10px]" style={{ background: s.color }}>{s.glyph}</span>
                        <span className="text-[13.5px] font-bold">{s.where}</span>
                        <span className="text-[12px] text-subtle">{s.when}</span>
                        <span className="ml-[auto] text-[11px] font-bold p-[5px_10px] rounded-[8px]" style={{ background: s.tagBg, color: s.tagFg }}>{s.tag}</span>
                      </div>
                      <p className="text-[14.5px] leading-[1.6] text-muted m-[13px_0_0]">{s.quote}</p>
                      <div className="text-[12.5px] text-subtle mt-[11px] pt-[11px] border-t-[1px] border-border-soft"><strong className="text-muted">Why flagged:</strong> {s.why}</div>
                    </div>
                  </React.Fragment>))}
                </div>
              </div>
            </>) : null}
      
            {/* EXPANSION */}
            {v.isExpansion ? (<>
              <div className="flex flex-col gap-[16px] max-w-[1020px]">
                <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                  <h3 className="font-heading font-bold text-[17px] m-[0_0_16px]">Creator performance</h3>
                  <div className="flex flex-col">
                    {(v.performers || []).map((p: any, $index: number) => (<React.Fragment key={$index}>
                      <div className="flex items-center gap-[16px] p-[14px_0] border-t-[1px] border-border-soft flex-wrap">
                        <div className="w-[30px] h-[30px] rounded-[9px] text-surface grid place-items-center font-extrabold text-[11px] shrink-0" style={{ background: p.color }}>{p.glyph}</div>
                        <div className="flex-[1_1_180px] min-w-0 text-[14.5px] font-bold">{p.name}</div>
                        <div className="flex-[1_1_140px] text-[13.5px] text-muted"><strong className="text-dark">{p.revenue}</strong> attributed</div>
                        <div className="flex-[0_1_120px] text-[13.5px] text-muted">{p.roas} ROAS</div>
                        <span className="text-[11.5px] font-bold p-[5px_11px] rounded-[8px]" style={{ background: p.tagBg, color: p.tagFg }}>{p.tag}</span>
                      </div>
                    </React.Fragment>))}
                  </div>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[16px]">
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_3px]">Recommended creators</h3>
                    <div className="text-[13px] text-subtle mb-[16px]">Audiences that look like your top three performers.</div>
                    <div className="flex flex-col gap-[10px]">
                      <div className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] p-[13px_15px]"><span className="text-[14px] font-semibold">Ops Weekly · YouTube</span><span className="text-[12px] font-bold text-accent">92% match</span></div>
                      <div className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] p-[13px_15px]"><span className="text-[14px] font-semibold">r/ExperiencedDevs</span><span className="text-[12px] font-bold text-accent">90% match</span></div>
                      <div className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] p-[13px_15px]"><span className="text-[14px] font-semibold">Nina Patel · LinkedIn</span><span className="text-[12px] font-bold text-accent">88% match</span></div>
                    </div>
                  </div>
                  <div className="bg-dark text-cream rounded-[20px] p-[22px]">
                    <h3 className="font-heading font-bold text-[17px] m-[0_0_3px]">Budget reallocation</h3>
                    <div className="text-[13px] text-on-dark mb-[16px]">Based on the last 30 days of attribution.</div>
                    <div className="flex flex-col gap-[11px]">
                      <div className="bg-dark-raised rounded-[13px] p-[14px_15px]"><div className="text-[14px] font-semibold">Move $4,000 from X ads → Reddit promoted posts</div><div className="text-[12.5px] text-subtle mt-[4px]">Reddit is returning 2.4× the revenue per click this month.</div></div>
                      <div className="bg-dark-raised rounded-[13px] p-[14px_15px]"><div className="text-[14px] font-semibold">Renew The People Ops Show at a higher tier</div><div className="text-[12.5px] text-subtle mt-[4px]">Best ROAS of any partnership, and the audience hasn't fatigued.</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </>) : null}
      
            {/* PLATFORMS */}
            {v.isPlatforms ? (<>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[16px] max-w-[1020px]">
                {(v.platformCards || []).map((p: any, $index: number) => (<React.Fragment key={$index}>
                  <div className="bg-surface border-[1.5px] border-border rounded-[20px] overflow-hidden">
                    <div className="flex items-center gap-[12px] p-[18px_20px]" style={{ background: p.bandBg }}>
                      <span className="w-[34px] h-[34px] rounded-[11px] text-surface grid place-items-center font-extrabold text-[13px] shrink-0" style={{ background: p.color }}>{p.glyph}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[15.5px]">{p.title}</div>
                        <div className="text-[12.5px] text-muted mt-[2px]">{p.subtitle}</div>
                      </div>
                      <span className="text-[11px] font-bold p-[5px_10px] rounded-[8px]" style={{ background: p.tagBg, color: p.tagFg }}>{p.tag}</span>
                    </div>
                    <div className="p-[18px_20px]">
                      <div className="text-[13.5px] text-muted leading-[1.55]">{p.body}</div>
                      <div className="flex items-center justify-between gap-[12px] mt-[16px]">
                        <span className="text-[12.5px] font-bold" style={{ color: p.statusFg }}>{p.status}</span>
                        <button  className="border-[1.5px] border-border bg-transparent text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah43">{p.action}</button>
                      </div>
                    </div>
                  </div>
                </React.Fragment>))}
              </div>
            </>) : null}
      
            {/* SETTINGS */}
            {v.isSettings ? (<>
              <div className="max-w-[760px] flex flex-col gap-[16px]">
                <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[24px]">
                  <h3 className="font-heading font-bold text-[17px] m-[0_0_18px]">Workspace</h3>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[16px]">
                    <div>
                      <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">COMPANY NAME</div>
                      <input value={v.companyName} onChange={v.setCompanyName} className="w-full box-border h-[46px] p-[0_14px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14.5px] outline-none" />
                    </div>
                    <div>
                      <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">ACCOUNT EMAIL</div>
                      <div className="h-[46px] flex items-center p-[0_14px] rounded-[12px] bg-sand text-[14.5px] text-muted">priya@northbeam.io</div>
                    </div>
                    <div>
                      <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">PLAN</div>
                      <div className="h-[46px] flex items-center p-[0_14px] rounded-[12px] bg-sand text-[14.5px] text-muted">Growth · early access</div>
                    </div>
                    <div>
                      <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">YOUR ROLE</div>
                      <div className="h-[46px] flex items-center p-[0_14px] rounded-[12px] bg-sand text-[14.5px] text-muted">Admin</div>
                    </div>
                  </div>
                </div>
      
                <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[24px]">
                  <div className="flex items-center justify-between gap-[12px] mb-[16px] flex-wrap">
                    <h3 className="font-heading font-bold text-[17px] m-0">Team</h3>
                    <div className="flex gap-[9px]">
                      <input placeholder="teammate@company.com" className="h-[42px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none" />
                      <button  className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[0_17px] h-[42px] rounded-[11px] cursor-pointer ah44">Invite</button>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-[14px] p-[13px_0] border-t-[1px] border-border-soft"><div className="w-[32px] h-[32px] rounded-[10px] bg-highlight text-dark grid place-items-center font-extrabold text-[12px]">PN</div><div className="flex-1"><div className="text-[14.5px] font-bold">Priya Nair</div><div className="text-[12.5px] text-subtle">priya@northbeam.io</div></div><span className="text-[12px] font-bold text-muted">Admin</span></div>
                    <div className="flex items-center gap-[14px] p-[13px_0] border-t-[1px] border-border-soft"><div className="w-[32px] h-[32px] rounded-[10px] bg-accent text-cream grid place-items-center font-extrabold text-[12px]">TM</div><div className="flex-1"><div className="text-[14.5px] font-bold">Tom Meyer</div><div className="text-[12.5px] text-subtle">tom@northbeam.io</div></div><span className="text-[12px] font-bold text-muted">Editor</span></div>
                    <div className="flex items-center gap-[14px] p-[13px_0] border-t-[1px] border-border-soft"><div className="w-[32px] h-[32px] rounded-[10px] bg-sand text-subtle grid place-items-center font-extrabold text-[12px]">?</div><div className="flex-1"><div className="text-[14.5px] font-bold">sam@northbeam.io</div><div className="text-[12.5px] text-subtle">Invitation sent 2 days ago</div></div><span className="text-[12px] font-bold text-subtle">Pending</span></div>
                  </div>
                </div>
      
                <div className="bg-tint rounded-[20px] p-[24px]">
                  <h3 className="font-heading font-bold text-[17px] m-0 text-accent-ink">Billing</h3>
                  <p className="text-[14.5px] leading-[1.6] text-accent-ink-soft m-[10px_0_0]">You're on early-access pricing — locked for 12 months after launch. Nothing is charged until your cohort opens.</p>
                  <button  className="mt-[16px] border-[1.5px] border-accent-ink bg-transparent text-accent-ink text-[13.5px] font-bold p-[11px_17px] rounded-[11px] cursor-pointer ah45">Manage in Stripe</button>
                </div>
              </div>
            </>) : null}
      
          </div>
        </main>
      </div>
    );
  }
}
