// ============================================================
// AspenReach Cross-Platform Intelligence Engine
//
// ARCHITECTURE: All functions accept a typed input object and
// return a typed output object. Currently uses mock data.
// To connect real APIs: replace the mock data inside each
// function with the real API call — function signatures stay
// identical.
// ============================================================

// ── TYPES ────────────────────────────────────────────────────

export interface YouTubeCampaignSignal {
  campaignId: string;
  campaignName: string;
  productCategory: string;
  topPerformingHook: string;
  topVideoTitle: string;
  topVideoViews: number;
  avgCTR: number;
  avgEngagementRate: number;
  audienceAge: string;
  audienceInterests: string[];
  conversionRate: number;
  topNiches: string[];
}

export interface RedditAdDraft {
  targetSubreddits: Array<{
    name: string;
    memberCount: string;
    matchReason: string;
    audienceOverlap: number;
  }>;
  adHeadline: string;
  adBodyCopy: string;
  adCallToAction: string;
  suggestedBudget: string;
  estimatedCPM: string;
  hookOrigin: string;
}

export interface LinkedInBriefDraft {
  targetReviewerProfile: {
    title: string;
    followerRange: string;
    postFrequency: string;
    linkedinTopVoice: boolean;
  };
  briefHeadline: string;
  productSummary: string;
  reviewAsk: string;
  suggestedPostAngle: string;
  compensationType: string;
  estimatedLeadsPerPost: number;
  hookOrigin: string;
}

export interface XAmplificationDraft {
  targetCreatorProfile: {
    followerRange: string;
    engagementThreshold: string;
    topicKeywords: string[];
  };
  tweetHook: string;
  threadOutline: string[];
  whitelistingNote: string;
  hookOrigin: string;
}

// ── MOCK DATA SOURCE ─────────────────────────────────────────
// DATA SOURCE: mock — replace with API call
// REPLACE THIS SECTION with real YouTube Data API v3 calls
// when credentials are available. The function signatures
// below do NOT change — only this data block changes.
const MOCK_CAMPAIGN_SIGNALS: YouTubeCampaignSignal[] = [
  {
    campaignId: "camp_001",
    campaignName: "Summer Tech Drop",
    productCategory: "SaaS / Software",
    topPerformingHook: "Stop wasting money on influencers who don't convert",
    topVideoTitle: "We tried every creator tool — here's what actually works",
    topVideoViews: 284000,
    avgCTR: 0.071,
    avgEngagementRate: 0.094,
    audienceAge: "25-34",
    audienceInterests: ["SaaS", "marketing", "growth hacking", "B2B tools"],
    conversionRate: 0.038,
    topNiches: ["tech reviews", "marketing tools", "startup advice"],
  },
  {
    campaignId: "camp_002",
    campaignName: "Home Lab Awareness",
    productCategory: "Physical Products",
    topPerformingHook: "This tool paid for itself in the first week",
    topVideoTitle: "My complete home lab setup (budget edition)",
    topVideoViews: 412000,
    avgCTR: 0.058,
    avgEngagementRate: 0.087,
    audienceAge: "22-35",
    audienceInterests: ["home lab", "self-hosting", "tech DIY", "networking"],
    conversionRate: 0.029,
    topNiches: ["home lab", "tech DIY", "networking gear"],
  },
];

// ── INTELLIGENCE FUNCTIONS ───────────────────────────────────

/**
 * generateRedditAdFromCampaign
 * TO CONNECT REAL DATA: Replace MOCK_CAMPAIGN_SIGNALS lookup with
 * a real YouTube Analytics API call.
 */
export function generateRedditAdFromCampaign(campaignId: string): RedditAdDraft | null {
  // DATA SOURCE: mock — replace with API call
  const signal = MOCK_CAMPAIGN_SIGNALS.find((s) => s.campaignId === campaignId);
  if (!signal) return null;

  const subredditMap: Record<string, { name: string; memberCount: string; matchReason: string }> = {
    SaaS: { name: "r/SaaS", memberCount: "127K", matchReason: "Audience interest overlap: SaaS buyers" },
    marketing: { name: "r/marketing", memberCount: "1.2M", matchReason: "Strong buyer intent for marketing tools" },
    "growth hacking": { name: "r/EntrepreneurRideAlong", memberCount: "341K", matchReason: "Growth-focused community, high purchase intent" },
    "B2B tools": { name: "r/Entrepreneur", memberCount: "892K", matchReason: "Broad B2B decision maker audience" },
    "home lab": { name: "r/homelab", memberCount: "847K", matchReason: "Direct product category community" },
    "tech DIY": { name: "r/DIY", memberCount: "3.1M", matchReason: "High-volume, matches hands-on audience" },
    "self-hosting": { name: "r/selfhosted", memberCount: "312K", matchReason: "Niche exact match — high conversion potential" },
  };

  const matchedSubreddits = signal.audienceInterests
    .map((interest) => subredditMap[interest])
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => ({ ...s, audienceOverlap: Math.round(60 + Math.random() * 30) }));

  const redditHook =
    signal.topPerformingHook.replace(/^Stop /i, "Honest question — are you still ").replace(/\?$/, "") + "? (We fixed this)";

  return {
    targetSubreddits:
      matchedSubreddits.length > 0
        ? matchedSubreddits
        : [{ name: "r/Entrepreneur", memberCount: "892K", matchReason: "Broad match for product category", audienceOverlap: 68 }],
    adHeadline: redditHook,
    adBodyCopy: `Based on what's working in our YouTube campaigns (${(signal.avgCTR * 100).toFixed(1)}% CTR, ${(signal.conversionRate * 100).toFixed(1)}% conversion), we adapted this messaging for Reddit. ${signal.productCategory} brands see 2.3x better CPM on Reddit vs display when targeting the right subreddits.`,
    adCallToAction: "See how it works →",
    suggestedBudget: "$500–$2,000 / month",
    estimatedCPM: "$4.20–$8.50",
    hookOrigin: signal.topPerformingHook,
  };
}

/**
 * generateLinkedInBriefFromCampaign
 * TO CONNECT REAL DATA: Replace mock signal lookup with LinkedIn API
 * profile data + YouTube Analytics data.
 */
export function generateLinkedInBriefFromCampaign(campaignId: string): LinkedInBriefDraft | null {
  // DATA SOURCE: mock — replace with API call
  const signal = MOCK_CAMPAIGN_SIGNALS.find((s) => s.campaignId === campaignId);
  if (!signal) return null;

  const reviewerTitleMap: Record<string, string> = {
    "SaaS / Software": "Head of Marketing or VP Sales at a Series A–C SaaS company",
    "Physical Products": "Operations Director or Supply Chain Manager",
    "Supplements / Health": "Health & Wellness Coach or Corporate Wellness Director",
    "Finance / Crypto": "CFO, Financial Advisor, or Fintech Founder",
    "Education / Courses": "Learning & Development Manager or Chief People Officer",
  };

  const reviewerTitle = reviewerTitleMap[signal.productCategory] || "Department Director or Team Lead at a mid-market company";
  const linkedinAngle = `"I tested ${signal.topVideoTitle.split("—")[0].trim()} for 30 days. Here's what the data showed."`;

  return {
    targetReviewerProfile: {
      title: reviewerTitle,
      followerRange: "5K–50K followers",
      postFrequency: "3–5x per week",
      linkedinTopVoice: true,
    },
    briefHeadline: `Collaboration Brief: ${signal.campaignName}`,
    productSummary: `${signal.productCategory} product targeting ${signal.audienceAge} professionals in ${signal.audienceInterests.slice(0, 2).join(" and ")}. YouTube campaigns achieving ${(signal.avgEngagementRate * 100).toFixed(1)}% engagement.`,
    reviewAsk:
      "LinkedIn article or carousel post (700–1,200 words) with honest product review. We provide full access, data, and results. You keep 100% editorial control.",
    suggestedPostAngle: linkedinAngle,
    compensationType: signal.avgCTR > 0.065 ? "paid collaboration" : "gifted product + affiliate",
    estimatedLeadsPerPost: Math.round(signal.conversionRate * 1000 * 0.4),
    hookOrigin: signal.topPerformingHook,
  };
}

/**
 * generateXAmplificationFromCampaign
 * TO CONNECT REAL DATA: Replace with X/Twitter API + YouTube Analytics.
 */
export function generateXAmplificationFromCampaign(campaignId: string): XAmplificationDraft | null {
  // DATA SOURCE: mock — replace with API call
  const signal = MOCK_CAMPAIGN_SIGNALS.find((s) => s.campaignId === campaignId);
  if (!signal) return null;

  const words = signal.topPerformingHook.split(" ");
  const xHook = words.slice(0, 10).join(" ") + (words.length > 10 ? "..." : "");

  return {
    targetCreatorProfile: {
      followerRange: "10K–500K",
      engagementThreshold: `>${(signal.avgEngagementRate * 100 * 0.8).toFixed(1)}% engagement rate`,
      topicKeywords: signal.audienceInterests.slice(0, 4),
    },
    tweetHook: xHook,
    threadOutline: [
      `🧵 ${signal.topPerformingHook}`,
      `Here's what we found after running 90 days of ${signal.productCategory} campaigns:`,
      `The data: ${(signal.avgCTR * 100).toFixed(1)}% CTR, ${(signal.conversionRate * 100).toFixed(1)}% conversion. Here's the breakdown...`,
      `The pattern: audiences in ${signal.audienceInterests[0]} respond to ${signal.topNiches[0]} content the most`,
      `If you're in ${signal.productCategory}: this is what's working right now. Full breakdown →`,
    ],
    whitelistingNote: `High-value opportunity: creators in ${signal.topNiches[0]} with >100K followers should be approached for whitelisting — run our best-performing hooks as promoted posts through their handles.`,
    hookOrigin: signal.topPerformingHook,
  };
}

/**
 * getAllCampaignSignals
 * TO CONNECT REAL DATA: Replace return value with YouTube Analytics API batch call.
 */
export function getAllCampaignSignals(): YouTubeCampaignSignal[] {
  // DATA SOURCE: mock — replace with API call
  return MOCK_CAMPAIGN_SIGNALS;
}

/**
 * getCampaignSignalById
 * TO CONNECT REAL DATA: Replace with YouTube Analytics API single campaign call.
 */
export function getCampaignSignalById(id: string): YouTubeCampaignSignal | null {
  // DATA SOURCE: mock — replace with API call
  return MOCK_CAMPAIGN_SIGNALS.find((s) => s.campaignId === id) ?? null;
}
