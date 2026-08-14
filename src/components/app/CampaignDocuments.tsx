import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  listBrandDocs,
  processBrandDoc,
  deleteBrandDoc,
  type BrandDocRow,
} from "@/lib/brand-docs.functions";

/* Documents panel for a campaign. Onboarding and the Ads Center both accept
   product and brand docs, but until now nothing showed the user what had been
   stored or whether the text extraction behind the ad corpus actually worked.
   This is that list: filename, when it arrived, extraction status with the
   excerpt count, plus retry and delete. It also names the audience lookalike
   sheet, which is uploaded during onboarding and was equally invisible. */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const STATUS: Record<BrandDocRow["status"], { label: string; bg: string; fg: string }> = {
  uploaded: { label: "Queued", bg: "#F5F1E9", fg: "#8A8494" },
  processed: { label: "Mined", bg: "#DDF3E6", fg: "#0E7A3D" },
  failed: { label: "Failed", bg: "#FFE3DB", fg: "#B03418" },
};

function when(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CampaignDocuments({
  campaignId,
  sheetName,
}: {
  campaignId: string;
  /** Name of the audience lookalike sheet stored on the campaign, if any. */
  sheetName?: string | null;
}) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<BrandDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setDocs(await listBrandDocs({ data: { campaignId } }));
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is over 10MB.");
      return;
    }
    setUploading(true);
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${campaignId}/${Date.now()}-${safeName}`;
    const up = await supabase.storage
      .from("brand-docs")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (up.error) {
      setUploading(false);
      toast.error(up.error.message);
      return;
    }
    const { data: row, error } = await supabase
      .from("brand_docs")
      .insert({
        user_id: user.id,
        campaign_id: campaignId,
        file_name: file.name,
        storage_path: path,
      })
      .select("id")
      .single();
    setUploading(false);
    if (error || !row) {
      // The file is already in storage at this point. Without this rollback it
      // stays there forever, invisible to the user and to every list query.
      await supabase.storage.from("brand-docs").remove([path]);
      toast.error(error?.message ?? "Could not save the document — nothing was kept");
      return;
    }

    await load();
    setBusyId(row.id);
    try {
      const res = await processBrandDoc({ data: { docId: row.id } });
      toast.success(`${file.name}: ${res.excerptsInserted} excerpts added to your ad corpus`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setBusyId(null);
      await load();
    }
  };

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      const res = await processBrandDoc({ data: { docId: id } });
      toast.success(`${res.excerptsInserted} excerpts added to your ad corpus`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setBusyId(null);
      await load();
    }
  };

  const remove = async (id: string, name: string) => {
    setBusyId(id);
    try {
      await deleteBrandDoc({ data: { docId: id } });
      toast.success(`${name} removed`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove the document");
    } finally {
      setBusyId(null);
      await load();
    }
  };

  return (
    <div className="bg-surface border-[1.5px] border-border rounded-[22px] p-[24px]">
      <div className="flex items-start justify-between gap-[16px] flex-wrap">
        <div>
          <h3 className="font-heading font-bold text-[17px] m-0">Documents</h3>
          <div className="text-[13px] text-subtle mt-[3px]">
            Everything you have given this campaign. Mined excerpts are what your ad drafts quote.
          </div>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[9px_15px] rounded-[12px] cursor-pointer disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "+ Add file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) upload(f);
          }}
        />
      </div>

      <div className="mt-[18px] flex flex-col gap-[10px]">
        {loading ? (
          <div className="text-[13.5px] text-subtle">Loading</div>
        ) : docs.length === 0 ? (
          <div className="rounded-[16px] border-[1.5px] border-dashed border-border p-[20px] text-center">
            <div className="text-[14px] font-bold">No documents on this campaign</div>
            <div className="text-[13px] text-subtle mt-[4px]">
              Add a product page, a sales deck or a support doc. We pull real excerpts from it so ad
              drafts quote you, not us.
            </div>
          </div>
        ) : (
          docs.map((d) => {
            const s = STATUS[d.status] ?? STATUS.uploaded;
            const working = busyId === d.id;
            return (
              <div
                key={d.id}
                className="flex items-center gap-[14px] flex-wrap rounded-[16px] border-[1.5px] border-border-soft p-[14px_16px]"
              >
                <div className="flex-[1_1_220px] min-w-0">
                  <div className="font-bold text-[14px] truncate">{d.file_name}</div>
                  <div className="text-[12.5px] text-subtle">
                    Added {when(d.created_at)}
                    {d.status === "processed" ? ` · ${d.excerpt_count} excerpts` : ""}
                    {d.status === "failed" && d.error ? ` · ${d.error}` : ""}
                  </div>
                </div>
                <span
                  className="text-[11.5px] font-bold p-[5px_10px] rounded-[8px]"
                  style={{ background: s.bg, color: s.fg }}
                >
                  {working ? "Working…" : s.label}
                </span>
                <button
                  onClick={() => retry(d.id)}
                  disabled={working}
                  className="border-[1.5px] border-border bg-transparent text-[12.5px] font-bold p-[7px_12px] rounded-[10px] cursor-pointer disabled:opacity-50"
                >
                  {d.status === "processed" ? "Re-extract" : "Retry"}
                </button>
                <button
                  onClick={() => remove(d.id, d.file_name)}
                  disabled={working}
                  className="border-[1.5px] border-border bg-transparent text-[12.5px] font-bold p-[7px_12px] rounded-[10px] cursor-pointer disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            );
          })
        )}

        {sheetName ? (
          <div className="flex items-center gap-[12px] flex-wrap rounded-[16px] bg-sand p-[14px_16px]">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px] truncate">{sheetName}</div>
              <div className="text-[12.5px] text-subtle">
                Audience lookalike sheet · used for buyer matching
              </div>
            </div>
            <span className="text-[11.5px] font-bold p-[5px_10px] rounded-[8px] bg-surface text-subtle">
              Stored
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
