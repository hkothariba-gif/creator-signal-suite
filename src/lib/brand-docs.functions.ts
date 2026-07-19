import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Ads Center v3-4: brand doc ingestion. The browser uploads the file straight
// to the brand-docs bucket and inserts a brand_docs row; these server fns do
// the heavy part — pull the file, extract text, mine it with the LLM, write
// verbatim excerpts into ad_corpus (kind 'brand_doc') and hand belief doc
// suggestions back for the user to apply. RLS keeps everything owner-scoped.

export type BrandDocRow = {
  id: string;
  file_name: string;
  storage_path: string;
  status: "uploaded" | "processed" | "failed";
  excerpt_count: number;
  error: string | null;
  created_at: string;
};

export type ProcessBrandDocResult = {
  excerptsInserted: number;
  suggestions: { beliefs: string[]; proofPoints: string[]; neverSay: string[] };
};

export const listBrandDocs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data, context }): Promise<BrandDocRow[]> => {
    if (!data.campaignId) return [];
    const { data: rows, error } = await context.supabase
      .from("brand_docs")
      .select("id,file_name,storage_path,status,excerpt_count,error,created_at")
      .eq("campaign_id", data.campaignId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as BrandDocRow[];
  });

export const processBrandDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { docId: string }) => data)
  .handler(async ({ data, context }): Promise<ProcessBrandDocResult> => {
    if (!data.docId) throw new Error("docId is required");
    if (!process.env.LLM_API_KEY) {
      throw new Error("Connect the LLM key to extract brand docs");
    }

    const { data: doc, error } = await context.supabase
      .from("brand_docs")
      .select("id,campaign_id,file_name,storage_path")
      .eq("id", data.docId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found");

    const { data: campaign } = await context.supabase
      .from("campaigns")
      .select("id,name,product_description")
      .eq("id", doc.campaign_id)
      .maybeSingle();

    const fail = async (message: string): Promise<never> => {
      await context.supabase
        .from("brand_docs")
        .update({ status: "failed", error: message.slice(0, 500), processed_at: new Date().toISOString() })
        .eq("id", doc.id);
      throw new Error(message);
    };

    const { data: blob, error: dlErr } = await context.supabase.storage
      .from("brand-docs")
      .download(doc.storage_path);
    if (dlErr || !blob) return fail("Could not read the uploaded file from storage");

    const { extractDocText, extractBrandDocMaterial } = await import("@/lib/brand-docs.server");

    let text = "";
    try {
      text = await extractDocText(doc.file_name, new Uint8Array(await blob.arrayBuffer()));
    } catch {
      return fail("Could not extract text from this file");
    }
    if (text.length < 40) return fail("The file contains too little readable text");

    const mined = await extractBrandDocMaterial({
      fileName: doc.file_name,
      text,
      productDescription: campaign?.product_description ?? campaign?.name ?? "",
    });
    if (!mined) return fail("Extraction is not configured or returned nothing");

    // Replace this document's previous excerpts, then insert the new set.
    await context.supabase
      .from("ad_corpus")
      .delete()
      .eq("campaign_id", doc.campaign_id)
      .eq("kind", "brand_doc")
      .like("external_id", `${doc.id}:%`);

    let inserted = 0;
    let lastInsertError: string | null = null;
    for (let i = 0; i < mined.excerpts.length; i += 1) {
      const { error: insErr } = await context.supabase.from("ad_corpus").upsert(
        {
          user_id: context.userId,
          campaign_id: doc.campaign_id,
          hotlist_id: null,
          kind: "brand_doc",
          source: "document",
          external_id: `${doc.id}:${i}`,
          author: doc.file_name,
          content: mined.excerpts[i],
          url: null,
          metrics: {},
        },
        { onConflict: "user_id,campaign_id,kind,external_id" },
      );
      if (!insErr) inserted += 1;
      else lastInsertError = insErr.message;
    }

    // Fail closed: excerpts were found but none could be stored (for example a
    // schema mismatch). Do not report an empty extraction as success.
    if (mined.excerpts.length > 0 && inserted === 0) {
      return fail(`Could not store excerpts: ${lastInsertError ?? "unknown database error"}`);
    }

    await context.supabase
      .from("brand_docs")
      .update({
        status: "processed",
        excerpt_count: inserted,
        error: null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", doc.id);

    return {
      excerptsInserted: inserted,
      suggestions: {
        beliefs: mined.beliefs,
        proofPoints: mined.proofPoints,
        neverSay: mined.neverSay,
      },
    };
  });

export const deleteBrandDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { docId: string }) => data)
  .handler(async ({ data, context }): Promise<{ removed: boolean }> => {
    if (!data.docId) throw new Error("docId is required");
    const { data: doc, error } = await context.supabase
      .from("brand_docs")
      .select("id,campaign_id,storage_path")
      .eq("id", data.docId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) return { removed: false };

    await context.supabase
      .from("ad_corpus")
      .delete()
      .eq("campaign_id", doc.campaign_id)
      .eq("kind", "brand_doc")
      .like("external_id", `${doc.id}:%`);
    await context.supabase.storage.from("brand-docs").remove([doc.storage_path]);
    const { error: delErr } = await context.supabase.from("brand_docs").delete().eq("id", doc.id);
    if (delErr) throw new Error(delErr.message);
    return { removed: true };
  });
