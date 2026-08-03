import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { processBrandDoc } from "@/lib/brand-docs.functions";
import AspenOnboarding from "@/aspen/AspenOnboarding";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

// v3-5: onboarding is plain account setup that ends in the user's first
// campaign. Product first: we ask about the product and its buyer, then create
// the campaign and land in the Ads Center. No store or payout steps and no
// summary screen; those connections live in Settings once they exist.
//
// The Aspen design supplies the markup and owns the step/field state. This
// route keeps every side effect it had before: profile update, campaign
// insert, lookalike + brand-doc uploads, and the search-criteria call.

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Step 2 asks SENIORITY and TYPICAL DEAL SIZE. These replaced the old gender
// skew / income tier pair outright — those two are no longer collected, typed
// or written anywhere. (profiles.target_gender / target_income still exist as
// nullable columns in the database; nothing reads or writes them, so removing
// them is a migration for another day.)

type Submission = {
  brief: string;
  notes: string;
  age: string;
  seniority: string;
  deal: string;
  platforms: { youtube: boolean; reddit: boolean; x: boolean; linkedin: boolean };
  docs: File[];
  sheet: File | null;
};

// The landing hero prompt is consumed once: it prefills the brief on the visit
// right after signup, then the key is removed so stale text from an earlier
// session never reappears on a fresh onboarding run.
function takeHeroPrompt(): string {
  if (typeof window === "undefined") return "";
  try {
    const v = localStorage.getItem("aspen_hero_prompt") ?? "";
    localStorage.removeItem("aspen_hero_prompt");
    return v;
  } catch {
    return "";
  }
}

function OnboardingPage() {
  const { user, update } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [initialBrief] = useState(takeHeroPrompt);

  const platformLabels = (platforms: Submission["platforms"]) => {
    const out: string[] = [];
    if (platforms.youtube) out.push("YouTube");
    if (platforms.reddit) out.push("Reddit");
    if (platforms.x) out.push("X");
    if (platforms.linkedin) out.push("LinkedIn");
    return out;
  };

  const seedFirstCampaign = async (values: Submission): Promise<string | null> => {
    if (!user) return null; // tester bypass: no session, skip DB writes
    const desc = values.brief.trim();
    const name = (desc.split("\n")[0] || "My first campaign").slice(0, 60) || "My first campaign";
    const platformsArr = platformLabels(values.platforms);
    const audience = {
      age: values.age,
      seniority: values.seniority,
      deal_size: values.deal,
      notes: values.notes.trim() || null,
      platforms: platformsArr,
      lookalike_sheet_path: null as string | null,
      lookalike_sheet_name: values.sheet?.name ?? null,
    };

    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name,
        status: "draft",
        goal: "Brand Awareness",
        product_description: desc || null,
        platforms: platformsArr.length ? platformsArr : ["YouTube", "Reddit", "X", "LinkedIn"],
        target_audience: audience,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("seed campaign failed", error);
      return null;
    }

    // Upload lookalike sheet (best-effort) and patch the campaign.
    if (values.sheet) {
      const safeName = values.sheet.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${inserted.id}/${Date.now()}-${safeName}`;
      const up = await supabase.storage
        .from("audience-sheets")
        .upload(path, values.sheet, { upsert: false, contentType: values.sheet.type || undefined });
      if (!up.error) {
        audience.lookalike_sheet_path = path;
        await supabase.from("campaigns").update({ target_audience: audience }).eq("id", inserted.id);
      } else {
        console.error("lookalike upload failed", up.error);
      }
    }

    // Upload brand docs against the campaign (best-effort). Extraction into the
    // grounding corpus runs server-side; failures never block onboarding.
    for (const f of values.docs) {
      try {
        const safeName = f.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/${inserted.id}/${Date.now()}-${safeName}`;
        const up = await supabase.storage
          .from("brand-docs")
          .upload(path, f, { upsert: false, contentType: f.type || undefined });
        if (up.error) continue;
        const { data: doc } = await supabase
          .from("brand_docs")
          .insert({ user_id: user.id, campaign_id: inserted.id, file_name: f.name, storage_path: path })
          .select("id")
          .single();
        if (doc) {
          processBrandDoc({ data: { docId: doc.id } }).catch(() => {
            // Extraction needs the LLM key; the doc stays listed for a retry later.
          });
        }
      } catch (e) {
        console.error("brand doc upload failed", e);
      }
    }

    // Fire generate-search-criteria (non-blocking; ignore failures).
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-search-criteria`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          productDescription: desc || name,
          targetAudience: audience,
          goal: "Brand Awareness",
        }),
      });
      if (res.ok) {
        const criteria = await res.json();
        await supabase.from("campaigns").update({ search_criteria: criteria }).eq("id", inserted.id);
      }
    } catch (e) {
      console.error("generate-search-criteria failed", e);
    }

    return inserted.id;
  };

  const finish = async (values: Submission) => {
    if (submitting) return;
    setSubmitting(true);
    const { error } = await update({
      onboarded: true,
      brand: {
        category: values.brief,
        age: values.age,
        seniority: values.seniority,
        deal_size: values.deal,
        notes: values.notes,
        platforms: values.platforms,
      },
    });
    if (error && error !== "Not signed in") {
      setSubmitting(false);
      toast.error(`Could not save profile: ${error}`);
      return;
    }
    try {
      localStorage.setItem("aspen_onboarded", "true");
    } catch {}
    const campaignId = await seedFirstCampaign(values);
    setSubmitting(false);
    if (campaignId) {
      toast.success("Your first campaign is ready.");
      navigate({ to: "/app/ads", search: { campaign: campaignId } });
    } else if (user) {
      toast.error("Could not create your campaign. You can create one from the Campaigns page.");
      navigate({ to: "/app/campaigns" });
    } else {
      navigate({ to: "/app/campaigns" });
    }
  };

  return (
    <AspenOnboarding
      onFinish={finish}
      busy={submitting}
      initialBrief={initialBrief}
      maxFileBytes={MAX_UPLOAD_BYTES}
      onFileError={(message) => toast.error(message)}
    />
  );
}
