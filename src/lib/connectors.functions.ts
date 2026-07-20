import { createServerFn } from "@tanstack/react-start";

// Reports connector status as booleans only. Never returns key material.
// A key is configured when its environment variable is present on the server.
// Account level connections report whether the current organization has
// completed the OAuth link. Those tables arrive in later phases, so account
// level statuses stay false until then.

export type PlatformConnectors = {
  supabase: boolean;
  email: boolean;
  listening: boolean;
  creatorPerformance: boolean;
  youtube: boolean;
  x: boolean;
  reddit: boolean;
  trends: boolean;
  llm: boolean;
  image: boolean;
  adsMiddleware: boolean;
  stripe: boolean;
  paypal: boolean;
  identity: boolean;
  enrichment: boolean;
};

export type ConnectorStatus = {
  platform: PlatformConnectors;
  account: {
    adAccount: boolean;
    sales: boolean;
    billing: boolean;
  };
};

function present(...vars: Array<string | undefined>): boolean {
  return vars.every((v) => typeof v === "string" && v.trim().length > 0);
}

export const getConnectorStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<ConnectorStatus> => {
    const env = process.env;
    return {
      platform: {
        supabase: present(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY),
        email: present(env.EMAIL_API_KEY),
        listening: present(env.BRAND24_API_KEY),
        creatorPerformance: present(env.PHYLLO_CLIENT_ID, env.PHYLLO_SECRET),
        // The live secret is named YOU_TUBE_API; accept either name so status
        // matches what discovery actually uses.
        youtube: present(env.YOUTUBE_API_KEY) || present(env.YOU_TUBE_API),
        x: present(env.X_API_KEY, env.X_API_SECRET),
        reddit: present(env.REDDIT_CLIENT_ID, env.REDDIT_SECRET),
        trends: present(env.TRENDS_API_KEY),
        llm: present(env.LLM_API_KEY),
        image: present(env.IMAGE_API_KEY),
        adsMiddleware: present(env.ADS_MIDDLEWARE_KEY),
        stripe: present(env.STRIPE_SECRET_KEY),
        paypal: present(env.PAYPAL_CLIENT_ID, env.PAYPAL_SECRET),
        identity: present(env.IDENTITY_API_KEY),
        enrichment: present(env.HUNTER_API_KEY) || present(env.APOLLO_API_KEY),
      },
      account: {
        adAccount: false,
        sales: false,
        billing: false,
      },
    };
  },
);
