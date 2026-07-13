import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Small reusable selector for scoping a page to one campaign. Emits the
// campaign id, or undefined for the "All campaigns" overview.
export function CampaignPicker({
  value,
  onChange,
  allowAll = true,
  label = "Campaign",
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  allowAll?: boolean;
  label?: string;
}) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id,name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!cancelled) setCampaigns((data ?? []) as { id: string; name: string }[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <label className="inline-flex items-center gap-2 text-xs text-[#8892A4]">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-9 px-2 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E]"
      >
        {allowAll && <option value="">All campaigns</option>}
        {campaigns.length === 0 && !allowAll && <option value="">No campaigns yet</option>}
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
