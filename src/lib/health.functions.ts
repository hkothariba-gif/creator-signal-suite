import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const checkSupabaseHealth = createServerFn({ method: "GET" }).handler(
  async () => {
    const start = Date.now();

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { error } = await supabase
      .from("campaigns")
      .select("id")
      .limit(0);

    const latency = Date.now() - start;

    if (error) {
      return { ok: false as const, latency, message: error.message };
    }

    return { ok: true as const, latency };
  }
);
