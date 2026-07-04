// Supabase Edge Function: generate-search-criteria
// Converts a brand's product description into YouTube influencer search criteria
// using the Lovable AI gateway (google/gemini-2.5-flash), with a rule-based fallback.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","for","to","of","in","on",
  "at","by","with","from","as","is","are","was","were","be","been","being","it",
  "its","this","that","these","those","we","our","you","your","they","their",
  "i","me","my","mine","he","she","him","her","his","hers","them","us","not",
  "no","yes","so","do","does","did","done","have","has","had","will","would",
  "can","could","should","shall","may","might","must","about","into","over",
  "than","too","very","just","also","more","most","some","any","all","each",
  "every","one","two","new","other","such","up","out","off","down","who","what",
  "when","where","why","how","which","product","products","brand","company",
]);

function ruleBasedExtraction(description: string, targetAudience?: string, goal?: string) {
  const text = `${description} ${targetAudience ?? ""} ${goal ?? ""}`.toLowerCase();
  const tokens = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2 && !STOPWORDS.has(w));

  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  const bigrams = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]} ${tokens[i + 1]}`;
    bigrams.set(bg, (bigrams.get(bg) ?? 0) + 1);
  }

  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);

  const phrases = [...bigrams.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  const primaryQuery = keywords.slice(0, 3).join(" ") || description.slice(0, 60);

  const searchQueries = [
    `${primaryQuery} review`,
    `best ${keywords[0] ?? "product"} ${keywords[1] ?? ""}`.trim(),
    `${phrases[0] ?? primaryQuery} tutorial`,
    `${keywords[0] ?? "product"} for ${targetAudience || "beginners"}`,
    `top ${keywords[0] ?? "product"} channels`,
  ].filter(Boolean);

  return {
    primaryQuery,
    keywords,
    phrases,
    searchQueries,
    topics: keywords.slice(0, 5),
    audienceNotes: targetAudience
      ? `Target audience: ${targetAudience}.`
      : "No specific audience provided; extracted from description.",
    method: "rule_based" as const,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { productDescription?: string; targetAudience?: string; goal?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { productDescription, targetAudience, goal } = body ?? {};
  if (!productDescription || typeof productDescription !== "string") {
    return new Response(
      JSON.stringify({ error: "productDescription (string) is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");

  const fallback = () => {
    const result = ruleBasedExtraction(productDescription, targetAudience, goal);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  };

  if (!apiKey) return fallback();

  try {
    const systemPrompt = `You are an expert influencer-marketing strategist specializing in YouTube creator discovery.
Given a brand's product description, target audience, and goal, produce structured YouTube search criteria to find relevant influencers.
Respond with STRICT JSON only, matching this schema exactly:
{
  "primaryQuery": string,           // one concise best YouTube search query
  "keywords": string[],             // 5-10 single-word keywords
  "phrases": string[],              // 3-8 multi-word phrases
  "searchQueries": string[],        // 3-5 ready-to-use YouTube search strings
  "topics": string[],               // 3-6 broader topic/niche labels
  "audienceNotes": string           // 1-2 sentences on the ideal creator audience
}
No prose, no markdown, JSON object only.`;

    const userPrompt = `Product description: ${productDescription}
Target audience: ${targetAudience ?? "(not specified)"}
Goal: ${goal ?? "(not specified)"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("AI gateway error", aiRes.status, await aiRes.text());
      return fallback();
    }

    const data = await aiRes.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return fallback();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return fallback();
    }

    return new Response(JSON.stringify({ ...parsed, method: "llm" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-search-criteria error:", err);
    return fallback();
  }
});
