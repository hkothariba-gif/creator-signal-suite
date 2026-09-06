export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          attributes: Json;
          created_at: string;
          domain: string | null;
          external_id: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          attributes?: Json;
          created_at?: string;
          domain?: string | null;
          external_id?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          attributes?: Json;
          created_at?: string;
          domain?: string | null;
          external_id?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      action_invocations: {
        Row: {
          action_type: string;
          action_version: number;
          actor_type: string;
          actor_user_id: string | null;
          campaign_id: string | null;
          causation_id: string | null;
          correlation_id: string | null;
          error_summary: string | null;
          event_type: string;
          id: string;
          idempotency_key: string;
          input_hash: string;
          invocation_key: string;
          occurred_at: string;
          organization_id: string;
          policy_snapshot: Json;
          request_payload: Json;
          result_payload: Json;
          sequence_number: number;
        };
        Insert: {
          action_type: string;
          action_version?: number;
          actor_type: string;
          actor_user_id?: string | null;
          campaign_id?: string | null;
          causation_id?: string | null;
          correlation_id?: string | null;
          error_summary?: string | null;
          event_type: string;
          id?: string;
          idempotency_key: string;
          input_hash: string;
          invocation_key: string;
          occurred_at?: string;
          organization_id: string;
          policy_snapshot?: Json;
          request_payload?: Json;
          result_payload?: Json;
          sequence_number: number;
        };
        Update: {
          action_type?: string;
          action_version?: number;
          actor_type?: string;
          actor_user_id?: string | null;
          campaign_id?: string | null;
          causation_id?: string | null;
          correlation_id?: string | null;
          error_summary?: string | null;
          event_type?: string;
          id?: string;
          idempotency_key?: string;
          input_hash?: string;
          invocation_key?: string;
          occurred_at?: string;
          organization_id?: string;
          policy_snapshot?: Json;
          request_payload?: Json;
          result_payload?: Json;
          sequence_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "action_invocations_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "action_invocations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_accounts: {
        Row: {
          capabilities: Json;
          created_at: string;
          currency: string | null;
          display_name: string;
          external_account_id: string;
          id: string;
          last_synced_at: string | null;
          metadata: Json;
          organization_id: string;
          provider: string;
          status: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          capabilities?: Json;
          created_at?: string;
          currency?: string | null;
          display_name: string;
          external_account_id: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id: string;
          provider: string;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          capabilities?: Json;
          created_at?: string;
          currency?: string | null;
          display_name?: string;
          external_account_id?: string;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_accounts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_corpus: {
        Row: {
          author: string | null;
          campaign_id: string;
          collected_at: string;
          content: string;
          created_by: string;
          external_id: string;
          hotlist_id: string | null;
          id: string;
          kind: string;
          metrics: Json;
          organization_id: string;
          source: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          author?: string | null;
          campaign_id: string;
          collected_at?: string;
          content: string;
          created_by?: string;
          external_id: string;
          hotlist_id?: string | null;
          id?: string;
          kind: string;
          metrics?: Json;
          organization_id?: string;
          source: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          author?: string | null;
          campaign_id?: string;
          collected_at?: string;
          content?: string;
          created_by?: string;
          external_id?: string;
          hotlist_id?: string | null;
          id?: string;
          kind?: string;
          metrics?: Json;
          organization_id?: string;
          source?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_corpus_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_corpus_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "ad_corpus_hotlist_id_fkey";
            columns: ["hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_corpus_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "ad_corpus_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ad_daily: {
        Row: {
          ad_id: string;
          clicks: number;
          created_at: string;
          currency: string;
          day: string;
          impressions: number;
          organization_id: string;
          spend_minor: number;
          updated_at: string;
        };
        Insert: {
          ad_id: string;
          clicks?: number;
          created_at?: string;
          currency?: string;
          day: string;
          impressions?: number;
          organization_id: string;
          spend_minor?: number;
          updated_at?: string;
        };
        Update: {
          ad_id?: string;
          clicks?: number;
          created_at?: string;
          currency?: string;
          day?: string;
          impressions?: number;
          organization_id?: string;
          spend_minor?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ad_daily_ad_id_fkey";
            columns: ["ad_id"];
            isOneToOne: false;
            referencedRelation: "ads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_daily_ad_org_fk";
            columns: ["organization_id", "ad_id"];
            isOneToOne: false;
            referencedRelation: "ads";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "ad_daily_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ads: {
        Row: {
          body: string | null;
          campaign_id: string | null;
          created_at: string;
          created_by: string;
          cta: string | null;
          headline: string | null;
          id: string;
          image_path: string | null;
          image_prompt: string | null;
          informed_by_affiliate: boolean;
          insights: Json;
          name: string;
          organization_id: string;
          project_id: string | null;
          provenance: Json;
          shared: boolean;
          status: string;
          target_platform: string | null;
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by: string;
          cta?: string | null;
          headline?: string | null;
          id?: string;
          image_path?: string | null;
          image_prompt?: string | null;
          informed_by_affiliate?: boolean;
          insights?: Json;
          name?: string;
          organization_id: string;
          project_id?: string | null;
          provenance?: Json;
          shared?: boolean;
          status?: string;
          target_platform?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          cta?: string | null;
          headline?: string | null;
          id?: string;
          image_path?: string | null;
          image_prompt?: string | null;
          informed_by_affiliate?: boolean;
          insights?: Json;
          name?: string;
          organization_id?: string;
          project_id?: string | null;
          provenance?: Json;
          shared?: boolean;
          status?: string;
          target_platform?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ads_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_connections: {
        Row: {
          connected_by: string;
          created_at: string;
          external_account_id: string | null;
          id: string;
          organization_id: string;
          provider: Database["public"]["Enums"]["affiliate_provider"];
          status: string;
          updated_at: string;
        };
        Insert: {
          connected_by: string;
          created_at?: string;
          external_account_id?: string | null;
          id?: string;
          organization_id: string;
          provider: Database["public"]["Enums"]["affiliate_provider"];
          status?: string;
          updated_at?: string;
        };
        Update: {
          connected_by?: string;
          created_at?: string;
          external_account_id?: string | null;
          id?: string;
          organization_id?: string;
          provider?: Database["public"]["Enums"]["affiliate_provider"];
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_daily: {
        Row: {
          clicks: number;
          conversions: number;
          currency: string;
          day: string;
          link_id: string;
          organization_id: string;
          revenue_minor: number;
        };
        Insert: {
          clicks?: number;
          conversions?: number;
          currency?: string;
          day: string;
          link_id: string;
          organization_id: string;
          revenue_minor?: number;
        };
        Update: {
          clicks?: number;
          conversions?: number;
          currency?: string;
          day?: string;
          link_id?: string;
          organization_id?: string;
          revenue_minor?: number;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_daily_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_events: {
        Row: {
          click_ref: string | null;
          created_at: string;
          currency: string;
          external_id: string;
          id: string;
          link_id: string | null;
          metadata: Json;
          occurred_at: string;
          organization_id: string;
          provider: Database["public"]["Enums"]["affiliate_provider"];
          revenue_minor: number;
          type: Database["public"]["Enums"]["affiliate_event_type"];
        };
        Insert: {
          click_ref?: string | null;
          created_at?: string;
          currency?: string;
          external_id: string;
          id?: string;
          link_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          organization_id: string;
          provider: Database["public"]["Enums"]["affiliate_provider"];
          revenue_minor?: number;
          type: Database["public"]["Enums"]["affiliate_event_type"];
        };
        Update: {
          click_ref?: string | null;
          created_at?: string;
          currency?: string;
          external_id?: string;
          id?: string;
          link_id?: string | null;
          metadata?: Json;
          occurred_at?: string;
          organization_id?: string;
          provider?: Database["public"]["Enums"]["affiliate_provider"];
          revenue_minor?: number;
          type?: Database["public"]["Enums"]["affiliate_event_type"];
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_events_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_links: {
        Row: {
          affiliate_id: string | null;
          campaign_id: string | null;
          created_at: string;
          created_by: string;
          destination_url: string;
          hotlist_id: string | null;
          id: string;
          label: string | null;
          organization_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          affiliate_id?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by: string;
          destination_url: string;
          hotlist_id?: string | null;
          id?: string;
          label?: string | null;
          organization_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          destination_url?: string;
          hotlist_id?: string | null;
          id?: string;
          label?: string | null;
          organization_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey";
            columns: ["affiliate_id"];
            isOneToOne: false;
            referencedRelation: "affiliates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_links_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_links_hotlist_id_fkey";
            columns: ["hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_links_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "affiliate_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliates: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_citations: {
        Row: {
          citation_order: number;
          content_hash: string | null;
          created_at: string;
          engine: string;
          feature_area: string;
          id: string;
          metadata: Json;
          model_name: string | null;
          model_provider: string | null;
          model_version: string | null;
          observed_at: string;
          organization_id: string;
          output_reference: string;
          output_type: string;
          query_reference: string | null;
          retrieved_at: string | null;
          source_excerpt: string | null;
          source_reference: string;
          source_title: string | null;
          source_type: string;
          source_url: string | null;
        };
        Insert: {
          citation_order?: number;
          content_hash?: string | null;
          created_at?: string;
          engine: string;
          feature_area: string;
          id?: string;
          metadata?: Json;
          model_name?: string | null;
          model_provider?: string | null;
          model_version?: string | null;
          observed_at?: string;
          organization_id: string;
          output_reference: string;
          output_type: string;
          query_reference?: string | null;
          retrieved_at?: string | null;
          source_excerpt?: string | null;
          source_reference: string;
          source_title?: string | null;
          source_type: string;
          source_url?: string | null;
        };
        Update: {
          citation_order?: number;
          content_hash?: string | null;
          created_at?: string;
          engine?: string;
          feature_area?: string;
          id?: string;
          metadata?: Json;
          model_name?: string | null;
          model_provider?: string | null;
          model_version?: string | null;
          observed_at?: string;
          organization_id?: string;
          output_reference?: string;
          output_type?: string;
          query_reference?: string | null;
          retrieved_at?: string | null;
          source_excerpt?: string | null;
          source_reference?: string;
          source_title?: string | null;
          source_type?: string;
          source_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_citations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      approvals: {
        Row: {
          action_type: string;
          assigned_to: string | null;
          automation_rule_id: string | null;
          decided_at: string | null;
          decided_by: string | null;
          decision_reason: string | null;
          expires_at: string | null;
          id: string;
          input_hash: string;
          invocation_key: string;
          organization_id: string;
          request_summary: Json;
          requested_at: string;
          requested_by_type: string;
          requested_by_user_id: string | null;
          status: string;
        };
        Insert: {
          action_type: string;
          assigned_to?: string | null;
          automation_rule_id?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          input_hash: string;
          invocation_key: string;
          organization_id: string;
          request_summary: Json;
          requested_at?: string;
          requested_by_type: string;
          requested_by_user_id?: string | null;
          status?: string;
        };
        Update: {
          action_type?: string;
          assigned_to?: string | null;
          automation_rule_id?: string | null;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          input_hash?: string;
          invocation_key?: string;
          organization_id?: string;
          request_summary?: Json;
          requested_at?: string;
          requested_by_type?: string;
          requested_by_user_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approvals_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approvals_rule_org_fk";
            columns: ["organization_id", "automation_rule_id"];
            isOneToOne: false;
            referencedRelation: "automation_rules";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      asset_groups: {
        Row: {
          created_at: string;
          external_asset_group_id: string;
          id: string;
          last_synced_at: string | null;
          name: string;
          organization_id: string;
          platform_campaign_id: string;
          provider: string;
          raw_payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          external_asset_group_id: string;
          id?: string;
          last_synced_at?: string | null;
          name: string;
          organization_id: string;
          platform_campaign_id: string;
          provider: string;
          raw_payload?: Json;
          status: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          external_asset_group_id?: string;
          id?: string;
          last_synced_at?: string | null;
          name?: string;
          organization_id?: string;
          platform_campaign_id?: string;
          provider?: string;
          raw_payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "asset_groups_campaign_org_fk";
            columns: ["organization_id", "platform_campaign_id"];
            isOneToOne: false;
            referencedRelation: "platform_campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "asset_groups_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      attribution_models: {
        Row: {
          active: boolean;
          algorithm: string;
          created_at: string;
          display_name: string;
          id: string;
          lookback_days: number;
          model_key: string;
          organization_id: string;
          settings: Json;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          algorithm: string;
          created_at?: string;
          display_name: string;
          id?: string;
          lookback_days?: number;
          model_key: string;
          organization_id: string;
          settings?: Json;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          algorithm?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          lookback_days?: number;
          model_key?: string;
          organization_id?: string;
          settings?: Json;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "attribution_models_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      attributions: {
        Row: {
          attributed_value_minor: number | null;
          attribution_model_id: string;
          calculated_at: string;
          calculation_version: string;
          channel_id: string;
          conversion_id: string;
          credit: number;
          currency: string | null;
          id: string;
          maturity_status: string;
          metadata: Json;
          organization_id: string;
          touchpoint_id: string | null;
        };
        Insert: {
          attributed_value_minor?: number | null;
          attribution_model_id: string;
          calculated_at?: string;
          calculation_version: string;
          channel_id: string;
          conversion_id: string;
          credit: number;
          currency?: string | null;
          id?: string;
          maturity_status: string;
          metadata?: Json;
          organization_id: string;
          touchpoint_id?: string | null;
        };
        Update: {
          attributed_value_minor?: number | null;
          attribution_model_id?: string;
          calculated_at?: string;
          calculation_version?: string;
          channel_id?: string;
          conversion_id?: string;
          credit?: number;
          currency?: string | null;
          id?: string;
          maturity_status?: string;
          metadata?: Json;
          organization_id?: string;
          touchpoint_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attributions_channel_org_fk";
            columns: ["organization_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "attributions_conversion_org_fk";
            columns: ["organization_id", "conversion_id"];
            isOneToOne: false;
            referencedRelation: "conversions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "attributions_model_org_fk";
            columns: ["organization_id", "attribution_model_id"];
            isOneToOne: false;
            referencedRelation: "attribution_models";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "attributions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attributions_touchpoint_org_fk";
            columns: ["organization_id", "touchpoint_id"];
            isOneToOne: false;
            referencedRelation: "touchpoints";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      audiences: {
        Row: {
          ad_account_id: string | null;
          audience_type: string | null;
          created_at: string;
          definition: Json;
          expires_at: string | null;
          external_audience_id: string | null;
          id: string;
          last_synced_at: string | null;
          name: string;
          organization_id: string;
          provider: string;
          raw_payload: Json;
          size_estimate: number | null;
          status: string;
        };
        Insert: {
          ad_account_id?: string | null;
          audience_type?: string | null;
          created_at?: string;
          definition?: Json;
          expires_at?: string | null;
          external_audience_id?: string | null;
          id?: string;
          last_synced_at?: string | null;
          name: string;
          organization_id: string;
          provider: string;
          raw_payload?: Json;
          size_estimate?: number | null;
          status?: string;
        };
        Update: {
          ad_account_id?: string | null;
          audience_type?: string | null;
          created_at?: string;
          definition?: Json;
          expires_at?: string | null;
          external_audience_id?: string | null;
          id?: string;
          last_synced_at?: string | null;
          name?: string;
          organization_id?: string;
          provider?: string;
          raw_payload?: Json;
          size_estimate?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audiences_account_org_fk";
            columns: ["organization_id", "ad_account_id"];
            isOneToOne: false;
            referencedRelation: "ad_accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "audiences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_rules: {
        Row: {
          action_configuration: Json;
          action_type: string;
          approval_policy: string;
          approval_threshold: Json;
          condition_expression: Json;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          trigger_configuration: Json;
          trigger_type: string;
          updated_at: string;
          version: number;
          wait_seconds: number;
        };
        Insert: {
          action_configuration?: Json;
          action_type: string;
          approval_policy?: string;
          approval_threshold?: Json;
          condition_expression?: Json;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          status?: string;
          trigger_configuration?: Json;
          trigger_type: string;
          updated_at?: string;
          version?: number;
          wait_seconds?: number;
        };
        Update: {
          action_configuration?: Json;
          action_type?: string;
          approval_policy?: string;
          approval_threshold?: Json;
          condition_expression?: Json;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          trigger_configuration?: Json;
          trigger_type?: string;
          updated_at?: string;
          version?: number;
          wait_seconds?: number;
        };
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_assets: {
        Row: {
          asset_type: string;
          campaign_id: string | null;
          checksum: string | null;
          created_at: string;
          created_by: string;
          creator_brand_link_id: string | null;
          external_url: string | null;
          id: string;
          metadata: Json;
          name: string;
          organization_id: string;
          production_mode: string;
          rights_expires_at: string | null;
          rights_scope: Json;
          rights_starts_at: string | null;
          rights_status: string;
          storage_path: string | null;
          talent_reference: string | null;
          updated_at: string;
        };
        Insert: {
          asset_type: string;
          campaign_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id?: string | null;
          external_url?: string | null;
          id?: string;
          metadata?: Json;
          name: string;
          organization_id: string;
          production_mode?: string;
          rights_expires_at?: string | null;
          rights_scope?: Json;
          rights_starts_at?: string | null;
          rights_status?: string;
          storage_path?: string | null;
          talent_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          asset_type?: string;
          campaign_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id?: string | null;
          external_url?: string | null;
          id?: string;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          production_mode?: string;
          rights_expires_at?: string | null;
          rights_scope?: Json;
          rights_starts_at?: string | null;
          rights_status?: string;
          storage_path?: string | null;
          talent_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_assets_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "brand_assets_creator_link_org_fk";
            columns: ["organization_id", "creator_brand_link_id"];
            isOneToOne: false;
            referencedRelation: "creator_brand_links";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "brand_assets_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      brand_docs: {
        Row: {
          campaign_id: string;
          created_at: string;
          created_by: string;
          error: string | null;
          excerpt_count: number;
          file_name: string;
          id: string;
          organization_id: string;
          processed_at: string | null;
          status: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          created_by?: string;
          error?: string | null;
          excerpt_count?: number;
          file_name: string;
          id?: string;
          organization_id?: string;
          processed_at?: string | null;
          status?: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          created_by?: string;
          error?: string | null;
          excerpt_count?: number;
          file_name?: string;
          id?: string;
          organization_id?: string;
          processed_at?: string | null;
          status?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_docs_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brand_docs_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "brand_docs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_plans: {
        Row: {
          amount_minor: number;
          cadence: string;
          campaign_id: string | null;
          channel_id: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          id: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          status: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          amount_minor: number;
          cadence: string;
          campaign_id?: string | null;
          channel_id?: string | null;
          created_at?: string;
          created_by?: string;
          currency: string;
          id?: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          amount_minor?: number;
          cadence?: string;
          campaign_id?: string | null;
          channel_id?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          id?: string;
          organization_id?: string;
          period_end?: string;
          period_start?: string;
          status?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "budget_plans_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "budget_plans_channel_org_fk";
            columns: ["organization_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "budget_plans_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_recommendations: {
        Row: {
          applied_at: string | null;
          budget_plan_id: string;
          calculation_version: string;
          confidence: number | null;
          created_at: string;
          currency: string;
          decided_at: string | null;
          decided_by: string | null;
          external_write_ref: string | null;
          id: string;
          organization_id: string;
          rationale: Json;
          recommended_amount_minor: number;
          status: string;
        };
        Insert: {
          applied_at?: string | null;
          budget_plan_id: string;
          calculation_version: string;
          confidence?: number | null;
          created_at?: string;
          currency: string;
          decided_at?: string | null;
          decided_by?: string | null;
          external_write_ref?: string | null;
          id?: string;
          organization_id: string;
          rationale: Json;
          recommended_amount_minor: number;
          status?: string;
        };
        Update: {
          applied_at?: string | null;
          budget_plan_id?: string;
          calculation_version?: string;
          confidence?: number | null;
          created_at?: string;
          currency?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          external_write_ref?: string | null;
          id?: string;
          organization_id?: string;
          rationale?: Json;
          recommended_amount_minor?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_recommendations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_recommendations_plan_org_fk";
            columns: ["organization_id", "budget_plan_id"];
            isOneToOne: false;
            referencedRelation: "budget_plans";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      campaigns: {
        Row: {
          brand_beliefs: string | null;
          brief: string | null;
          budget: string | null;
          budget_minor: number | null;
          created_at: string;
          created_by: string;
          currency: string;
          end_date: string | null;
          goal: string | null;
          id: string;
          name: string;
          never_say: string | null;
          offer: Json;
          operating_status: string;
          organization_id: string;
          platforms: string[] | null;
          product_description: string | null;
          proof_points: string | null;
          search_criteria: Json | null;
          start_date: string | null;
          status: string;
          target_audience: Json | null;
          user_id: string;
        };
        Insert: {
          brand_beliefs?: string | null;
          brief?: string | null;
          budget?: string | null;
          budget_minor?: number | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          end_date?: string | null;
          goal?: string | null;
          id?: string;
          name: string;
          never_say?: string | null;
          offer?: Json;
          operating_status?: string;
          organization_id?: string;
          platforms?: string[] | null;
          product_description?: string | null;
          proof_points?: string | null;
          search_criteria?: Json | null;
          start_date?: string | null;
          status?: string;
          target_audience?: Json | null;
          user_id: string;
        };
        Update: {
          brand_beliefs?: string | null;
          brief?: string | null;
          budget?: string | null;
          budget_minor?: number | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          end_date?: string | null;
          goal?: string | null;
          id?: string;
          name?: string;
          never_say?: string | null;
          offer?: Json;
          operating_status?: string;
          organization_id?: string;
          platforms?: string[] | null;
          product_description?: string | null;
          proof_points?: string | null;
          search_criteria?: Json | null;
          start_date?: string | null;
          status?: string;
          target_audience?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_connections: {
        Row: {
          created_at: string;
          created_by: string;
          external_account_id: string | null;
          from_address: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          provider: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          external_account_id?: string | null;
          from_address?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          provider: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          external_account_id?: string | null;
          from_address?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channel_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_daily: {
        Row: {
          channel_id: string;
          clicks: number | null;
          conversions: number | null;
          currency: string;
          impressions: number | null;
          metadata: Json;
          metric_date: string;
          organization_id: string;
          revenue_minor: number | null;
          source: string;
          spend_minor: number | null;
          synced_at: string;
        };
        Insert: {
          channel_id: string;
          clicks?: number | null;
          conversions?: number | null;
          currency: string;
          impressions?: number | null;
          metadata?: Json;
          metric_date: string;
          organization_id: string;
          revenue_minor?: number | null;
          source: string;
          spend_minor?: number | null;
          synced_at?: string;
        };
        Update: {
          channel_id?: string;
          clicks?: number | null;
          conversions?: number | null;
          currency?: string;
          impressions?: number | null;
          metadata?: Json;
          metric_date?: string;
          organization_id?: string;
          revenue_minor?: number | null;
          source?: string;
          spend_minor?: number | null;
          synced_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channel_daily_channel_org_fk";
            columns: ["organization_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "channel_daily_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      channel_tokens: {
        Row: {
          access_token: string;
          created_at: string;
          id: string;
          organization_id: string | null;
          provider: string;
          refresh_token: string | null;
          scope: string | null;
          token_expires_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          provider: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          provider?: string;
          refresh_token?: string | null;
          scope?: string | null;
          token_expires_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channel_tokens_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      channels: {
        Row: {
          active: boolean;
          channel_group: string;
          channel_key: string;
          created_at: string;
          display_name: string;
          id: string;
          organization_id: string;
          platform: string | null;
          provider: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          channel_group: string;
          channel_key: string;
          created_at?: string;
          display_name: string;
          id?: string;
          organization_id: string;
          platform?: string | null;
          provider?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          channel_group?: string;
          channel_key?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
          organization_id?: string;
          platform?: string | null;
          provider?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channels_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      claim_conflicts: {
        Row: {
          conflict_type: string;
          conversion_id: string;
          created_at: string;
          details: Json;
          first_touchpoint_id: string | null;
          id: string;
          organization_id: string;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          second_touchpoint_id: string | null;
          status: string;
        };
        Insert: {
          conflict_type: string;
          conversion_id: string;
          created_at?: string;
          details?: Json;
          first_touchpoint_id?: string | null;
          id?: string;
          organization_id: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          second_touchpoint_id?: string | null;
          status?: string;
        };
        Update: {
          conflict_type?: string;
          conversion_id?: string;
          created_at?: string;
          details?: Json;
          first_touchpoint_id?: string | null;
          id?: string;
          organization_id?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          second_touchpoint_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "claim_conflicts_conversion_org_fk";
            columns: ["organization_id", "conversion_id"];
            isOneToOne: false;
            referencedRelation: "conversions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "claim_conflicts_first_touch_org_fk";
            columns: ["organization_id", "first_touchpoint_id"];
            isOneToOne: false;
            referencedRelation: "touchpoints";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "claim_conflicts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claim_conflicts_second_touch_org_fk";
            columns: ["organization_id", "second_touchpoint_id"];
            isOneToOne: false;
            referencedRelation: "touchpoints";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      consents: {
        Row: {
          channel: string;
          evidence: Json;
          id: string;
          legal_basis: string | null;
          organization_id: string;
          person_id: string;
          purpose: string;
          recorded_at: string;
          source: string;
          status: string;
        };
        Insert: {
          channel: string;
          evidence?: Json;
          id?: string;
          legal_basis?: string | null;
          organization_id: string;
          person_id: string;
          purpose: string;
          recorded_at?: string;
          source: string;
          status: string;
        };
        Update: {
          channel?: string;
          evidence?: Json;
          id?: string;
          legal_basis?: string | null;
          organization_id?: string;
          person_id?: string;
          purpose?: string;
          recorded_at?: string;
          source?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consents_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "consents_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      conversions: {
        Row: {
          account_id: string | null;
          created_at: string;
          currency: string | null;
          event_definition_id: string;
          external_conversion_id: string;
          id: string;
          journey_mode: string;
          occurred_at: string;
          organization_id: string;
          person_id: string | null;
          properties: Json;
          source: string;
          value_minor: number | null;
        };
        Insert: {
          account_id?: string | null;
          created_at?: string;
          currency?: string | null;
          event_definition_id: string;
          external_conversion_id: string;
          id?: string;
          journey_mode: string;
          occurred_at: string;
          organization_id: string;
          person_id?: string | null;
          properties?: Json;
          source: string;
          value_minor?: number | null;
        };
        Update: {
          account_id?: string | null;
          created_at?: string;
          currency?: string | null;
          event_definition_id?: string;
          external_conversion_id?: string;
          id?: string;
          journey_mode?: string;
          occurred_at?: string;
          organization_id?: string;
          person_id?: string | null;
          properties?: Json;
          source?: string;
          value_minor?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversions_account_org_fk";
            columns: ["organization_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "conversions_definition_org_fk";
            columns: ["organization_id", "event_definition_id"];
            isOneToOne: false;
            referencedRelation: "event_definitions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "conversions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversions_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "conversions_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      cost_items: {
        Row: {
          account_id: string | null;
          amount_minor: number;
          campaign_id: string | null;
          channel_id: string | null;
          cost_basis: string;
          cost_type: string;
          created_at: string;
          created_by: string;
          currency: string;
          description: string;
          external_ref: string | null;
          fidelity_rung: string;
          id: string;
          incurred_on: string;
          organization_id: string;
          source: string;
          updated_at: string;
        };
        Insert: {
          account_id?: string | null;
          amount_minor: number;
          campaign_id?: string | null;
          channel_id?: string | null;
          cost_basis?: string;
          cost_type: string;
          created_at?: string;
          created_by?: string;
          currency: string;
          description: string;
          external_ref?: string | null;
          fidelity_rung?: string;
          id?: string;
          incurred_on: string;
          organization_id: string;
          source?: string;
          updated_at?: string;
        };
        Update: {
          account_id?: string | null;
          amount_minor?: number;
          campaign_id?: string | null;
          channel_id?: string | null;
          cost_basis?: string;
          cost_type?: string;
          created_at?: string;
          created_by?: string;
          currency?: string;
          description?: string;
          external_ref?: string | null;
          fidelity_rung?: string;
          id?: string;
          incurred_on?: string;
          organization_id?: string;
          source?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cost_items_account_org_fk";
            columns: ["organization_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "cost_items_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "cost_items_channel_org_fk";
            columns: ["organization_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "cost_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      creative_tags: {
        Row: {
          brand_asset_id: string;
          confidence: number | null;
          created_at: string;
          created_by: string | null;
          id: string;
          model_version: string | null;
          organization_id: string;
          source: string;
          tag_type: string;
          tag_value: string;
        };
        Insert: {
          brand_asset_id: string;
          confidence?: number | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id: string;
          source: string;
          tag_type: string;
          tag_value: string;
        };
        Update: {
          brand_asset_id?: string;
          confidence?: number | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          model_version?: string | null;
          organization_id?: string;
          source?: string;
          tag_type?: string;
          tag_value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creative_tags_asset_org_fk";
            columns: ["organization_id", "brand_asset_id"];
            isOneToOne: false;
            referencedRelation: "brand_assets";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "creative_tags_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_brand_links: {
        Row: {
          accepted_at: string | null;
          creator_user_id: string;
          hotlist_id: string | null;
          id: string;
          invited_at: string;
          invited_by: string | null;
          metadata: Json;
          organization_id: string;
          revoked_at: string | null;
          status: string;
        };
        Insert: {
          accepted_at?: string | null;
          creator_user_id: string;
          hotlist_id?: string | null;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          metadata?: Json;
          organization_id: string;
          revoked_at?: string | null;
          status?: string;
        };
        Update: {
          accepted_at?: string | null;
          creator_user_id?: string;
          hotlist_id?: string | null;
          id?: string;
          invited_at?: string;
          invited_by?: string | null;
          metadata?: Json;
          organization_id?: string;
          revoked_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creator_brand_links_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "creator_brand_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      creator_contacts: {
        Row: {
          address: string;
          channel: string;
          confidence: number;
          created_at: string;
          created_by: string;
          hotlist_id: string;
          id: string;
          metadata: Json;
          organization_id: string;
          source: string;
          updated_at: string;
          user_id: string;
          verified: boolean;
        };
        Insert: {
          address: string;
          channel: string;
          confidence?: number;
          created_at?: string;
          created_by?: string;
          hotlist_id: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          source?: string;
          updated_at?: string;
          user_id: string;
          verified?: boolean;
        };
        Update: {
          address?: string;
          channel?: string;
          confidence?: number;
          created_at?: string;
          created_by?: string;
          hotlist_id?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          source?: string;
          updated_at?: string;
          user_id?: string;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "creator_contacts_hotlist_id_fkey";
            columns: ["hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "creator_contacts_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "creator_contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_terms: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          campaign_id: string | null;
          commission_bps: number | null;
          compensation_type: string;
          created_at: string;
          created_by: string;
          creator_brand_link_id: string;
          currency: string | null;
          flat_fee_minor: number | null;
          id: string;
          offered_at: string | null;
          organization_id: string;
          status: string;
          terms: Json;
          version: number;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          campaign_id?: string | null;
          commission_bps?: number | null;
          compensation_type: string;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id: string;
          currency?: string | null;
          flat_fee_minor?: number | null;
          id?: string;
          offered_at?: string | null;
          organization_id: string;
          status?: string;
          terms?: Json;
          version?: number;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          campaign_id?: string | null;
          commission_bps?: number | null;
          compensation_type?: string;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id?: string;
          currency?: string | null;
          flat_fee_minor?: number | null;
          id?: string;
          offered_at?: string | null;
          organization_id?: string;
          status?: string;
          terms?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "deal_terms_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "deal_terms_link_org_fk";
            columns: ["organization_id", "creator_brand_link_id"];
            isOneToOne: false;
            referencedRelation: "creator_brand_links";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "deal_terms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      deliverables: {
        Row: {
          approved_at: string | null;
          campaign_id: string | null;
          created_at: string;
          created_by: string;
          creator_brand_link_id: string;
          deliverable_type: string;
          description: string | null;
          due_at: string | null;
          id: string;
          organization_id: string;
          status: string;
          submission_metadata: Json;
          submission_url: string | null;
          submitted_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id: string;
          deliverable_type: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          organization_id: string;
          status?: string;
          submission_metadata?: Json;
          submission_url?: string | null;
          submitted_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id?: string;
          deliverable_type?: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          organization_id?: string;
          status?: string;
          submission_metadata?: Json;
          submission_url?: string | null;
          submitted_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deliverables_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "deliverables_link_org_fk";
            columns: ["organization_id", "creator_brand_link_id"];
            isOneToOne: false;
            referencedRelation: "creator_brand_links";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "deliverables_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      diversity_snapshots: {
        Row: {
          calculated_at: string;
          campaign_id: string | null;
          dimension: string;
          distribution: Json;
          id: string;
          methodology_version: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          sample_size: number;
        };
        Insert: {
          calculated_at?: string;
          campaign_id?: string | null;
          dimension: string;
          distribution: Json;
          id?: string;
          methodology_version: string;
          organization_id: string;
          period_end: string;
          period_start: string;
          sample_size: number;
        };
        Update: {
          calculated_at?: string;
          campaign_id?: string | null;
          dimension?: string;
          distribution?: Json;
          id?: string;
          methodology_version?: string;
          organization_id?: string;
          period_end?: string;
          period_start?: string;
          sample_size?: number;
        };
        Relationships: [
          {
            foreignKeyName: "diversity_snapshots_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "diversity_snapshots_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      esp_connections: {
        Row: {
          capabilities: Json;
          created_at: string;
          external_account_id: string | null;
          id: string;
          last_synced_at: string | null;
          metadata: Json;
          organization_id: string;
          provider: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          capabilities?: Json;
          created_at?: string;
          external_account_id?: string | null;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id: string;
          provider: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          capabilities?: Json;
          created_at?: string;
          external_account_id?: string | null;
          id?: string;
          last_synced_at?: string | null;
          metadata?: Json;
          organization_id?: string;
          provider?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "esp_connections_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      event_definitions: {
        Row: {
          active: boolean;
          category: string;
          conversion_kind: string | null;
          created_at: string;
          default_attribution_model_key: string;
          display_name: string;
          event_key: string;
          id: string;
          journey_mode: string;
          lookback_days: number;
          maturity_days: number;
          metadata: Json;
          organization_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          active?: boolean;
          category: string;
          conversion_kind?: string | null;
          created_at?: string;
          default_attribution_model_key?: string;
          display_name: string;
          event_key: string;
          id?: string;
          journey_mode?: string;
          lookback_days?: number;
          maturity_days?: number;
          metadata?: Json;
          organization_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          active?: boolean;
          category?: string;
          conversion_kind?: string | null;
          created_at?: string;
          default_attribution_model_key?: string;
          display_name?: string;
          event_key?: string;
          id?: string;
          journey_mode?: string;
          lookback_days?: number;
          maturity_days?: number;
          metadata?: Json;
          organization_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "event_definitions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      event_receipts: {
        Row: {
          event_id: string;
          event_occurred_at: string;
          external_event_id: string;
          id: string;
          organization_id: string;
          received_at: string;
          source: string;
        };
        Insert: {
          event_id: string;
          event_occurred_at: string;
          external_event_id: string;
          id?: string;
          organization_id: string;
          received_at?: string;
          source: string;
        };
        Update: {
          event_id?: string;
          event_occurred_at?: string;
          external_event_id?: string;
          id?: string;
          organization_id?: string;
          received_at?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_receipts_event_fk";
            columns: ["organization_id", "event_occurred_at", "event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["organization_id", "occurred_at", "id"];
          },
          {
            foreignKeyName: "event_receipts_event_fk";
            columns: ["organization_id", "event_occurred_at", "event_id"];
            isOneToOne: false;
            referencedRelation: "events_redacted";
            referencedColumns: ["organization_id", "occurred_at", "id"];
          },
          {
            foreignKeyName: "event_receipts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          account_id: string | null;
          event_definition_id: string;
          event_key: string;
          external_event_id: string;
          id: string;
          occurred_at: string;
          organization_id: string;
          person_id: string | null;
          properties: Json;
          received_at: string;
          source: string;
          visitor_id: string | null;
        };
        Insert: {
          account_id?: string | null;
          event_definition_id: string;
          event_key: string;
          external_event_id: string;
          id?: string;
          occurred_at: string;
          organization_id: string;
          person_id?: string | null;
          properties?: Json;
          received_at?: string;
          source: string;
          visitor_id?: string | null;
        };
        Update: {
          account_id?: string | null;
          event_definition_id?: string;
          event_key?: string;
          external_event_id?: string;
          id?: string;
          occurred_at?: string;
          organization_id?: string;
          person_id?: string | null;
          properties?: Json;
          received_at?: string;
          source?: string;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_account_org_fk";
            columns: ["organization_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_definition_org_fk";
            columns: ["organization_id", "event_definition_id"];
            isOneToOne: false;
            referencedRelation: "event_definitions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_visitor_org_fk";
            columns: ["organization_id", "visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_visitor_org_fk";
            columns: ["organization_id", "visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      events_default: {
        Row: {
          account_id: string | null;
          event_definition_id: string;
          event_key: string;
          external_event_id: string;
          id: string;
          occurred_at: string;
          organization_id: string;
          person_id: string | null;
          properties: Json;
          received_at: string;
          source: string;
          visitor_id: string | null;
        };
        Insert: {
          account_id?: string | null;
          event_definition_id: string;
          event_key: string;
          external_event_id: string;
          id?: string;
          occurred_at: string;
          organization_id: string;
          person_id?: string | null;
          properties?: Json;
          received_at?: string;
          source: string;
          visitor_id?: string | null;
        };
        Update: {
          account_id?: string | null;
          event_definition_id?: string;
          event_key?: string;
          external_event_id?: string;
          id?: string;
          occurred_at?: string;
          organization_id?: string;
          person_id?: string | null;
          properties?: Json;
          received_at?: string;
          source?: string;
          visitor_id?: string | null;
        };
        Relationships: [];
      };
      external_campaign_refs: {
        Row: {
          adopted_at: string | null;
          adopted_by: string | null;
          campaign_id: string | null;
          created_at: string;
          external_account_id: string | null;
          external_campaign_id: string;
          external_name: string | null;
          id: string;
          import_domain: string;
          metadata: Json;
          organization_id: string;
          ownership_mode: string;
          provider: string;
          updated_at: string;
        };
        Insert: {
          adopted_at?: string | null;
          adopted_by?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          external_account_id?: string | null;
          external_campaign_id: string;
          external_name?: string | null;
          id?: string;
          import_domain: string;
          metadata?: Json;
          organization_id: string;
          ownership_mode?: string;
          provider: string;
          updated_at?: string;
        };
        Update: {
          adopted_at?: string | null;
          adopted_by?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          external_account_id?: string | null;
          external_campaign_id?: string;
          external_name?: string | null;
          id?: string;
          import_domain?: string;
          metadata?: Json;
          organization_id?: string;
          ownership_mode?: string;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "external_campaign_refs_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "external_campaign_refs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      hotlist: {
        Row: {
          avatar_url: string | null;
          campaign_id: string | null;
          cpm: string | null;
          created_at: string;
          created_by: string;
          creator_name: string;
          external_id: string | null;
          id: string;
          organization_id: string;
          platform: string | null;
          profile_data: Json | null;
          score: number | null;
          source: string;
          stage: string | null;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          campaign_id?: string | null;
          cpm?: string | null;
          created_at?: string;
          created_by?: string;
          creator_name: string;
          external_id?: string | null;
          id?: string;
          organization_id?: string;
          platform?: string | null;
          profile_data?: Json | null;
          score?: number | null;
          source?: string;
          stage?: string | null;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          campaign_id?: string | null;
          cpm?: string | null;
          created_at?: string;
          created_by?: string;
          creator_name?: string;
          external_id?: string | null;
          id?: string;
          organization_id?: string;
          platform?: string | null;
          profile_data?: Json | null;
          score?: number | null;
          source?: string;
          stage?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hotlist_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hotlist_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "hotlist_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      identities: {
        Row: {
          created_at: string;
          external_id: string | null;
          id: string;
          identity_type: string;
          metadata: Json;
          normalized_hash: string | null;
          organization_id: string;
          person_id: string | null;
          verified_at: string | null;
          visitor_id: string | null;
        };
        Insert: {
          created_at?: string;
          external_id?: string | null;
          id?: string;
          identity_type: string;
          metadata?: Json;
          normalized_hash?: string | null;
          organization_id: string;
          person_id?: string | null;
          verified_at?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          created_at?: string;
          external_id?: string | null;
          id?: string;
          identity_type?: string;
          metadata?: Json;
          normalized_hash?: string | null;
          organization_id?: string;
          person_id?: string | null;
          verified_at?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "identities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "identities_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "identities_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "identities_visitor_org_fk";
            columns: ["organization_id", "visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "identities_visitor_org_fk";
            columns: ["organization_id", "visitor_id"];
            isOneToOne: false;
            referencedRelation: "visitors_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      import_jobs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          cursor: Json;
          error_summary: string | null;
          id: string;
          idempotency_key: string;
          import_domain: string;
          organization_id: string;
          provider: string;
          requested_by: string;
          started_at: string | null;
          status: string;
          summary: Json;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          cursor?: Json;
          error_summary?: string | null;
          id?: string;
          idempotency_key: string;
          import_domain: string;
          organization_id: string;
          provider: string;
          requested_by?: string;
          started_at?: string | null;
          status?: string;
          summary?: Json;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          cursor?: Json;
          error_summary?: string | null;
          id?: string;
          idempotency_key?: string;
          import_domain?: string;
          organization_id?: string;
          provider?: string;
          requested_by?: string;
          started_at?: string | null;
          status?: string;
          summary?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "import_jobs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          organization_id: string;
          role: Database["public"]["Enums"]["org_role"];
          status: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          status?: string;
          token?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      journey_runs: {
        Row: {
          completed_at: string | null;
          context: Json;
          current_step_id: string | null;
          id: string;
          journey_id: string;
          next_action_at: string | null;
          organization_id: string;
          person_id: string;
          started_at: string;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          context?: Json;
          current_step_id?: string | null;
          id?: string;
          journey_id: string;
          next_action_at?: string | null;
          organization_id: string;
          person_id: string;
          started_at?: string;
          status?: string;
        };
        Update: {
          completed_at?: string | null;
          context?: Json;
          current_step_id?: string | null;
          id?: string;
          journey_id?: string;
          next_action_at?: string | null;
          organization_id?: string;
          person_id?: string;
          started_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journey_runs_journey_org_fk";
            columns: ["organization_id", "journey_id"];
            isOneToOne: false;
            referencedRelation: "journeys";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "journey_runs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journey_runs_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "journey_runs_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "journey_runs_step_org_fk";
            columns: ["organization_id", "current_step_id"];
            isOneToOne: false;
            referencedRelation: "journey_steps";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      journey_steps: {
        Row: {
          configuration: Json;
          created_at: string;
          id: string;
          journey_id: string;
          message_id: string | null;
          organization_id: string;
          step_order: number;
          step_type: string;
          updated_at: string;
          wait_seconds: number | null;
        };
        Insert: {
          configuration?: Json;
          created_at?: string;
          id?: string;
          journey_id: string;
          message_id?: string | null;
          organization_id: string;
          step_order: number;
          step_type: string;
          updated_at?: string;
          wait_seconds?: number | null;
        };
        Update: {
          configuration?: Json;
          created_at?: string;
          id?: string;
          journey_id?: string;
          message_id?: string | null;
          organization_id?: string;
          step_order?: number;
          step_type?: string;
          updated_at?: string;
          wait_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_org_fk";
            columns: ["organization_id", "journey_id"];
            isOneToOne: false;
            referencedRelation: "journeys";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "journey_steps_message_org_fk";
            columns: ["organization_id", "message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "journey_steps_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      journeys: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          entry_rules: Json;
          exit_rules: Json;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          trigger_event_key: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          entry_rules?: Json;
          exit_rules?: Json;
          id?: string;
          name: string;
          organization_id: string;
          status?: string;
          trigger_event_key: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          entry_rules?: Json;
          exit_rules?: Json;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          trigger_event_key?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "journeys_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      keywords: {
        Row: {
          bid_minor: number | null;
          created_at: string;
          external_keyword_id: string | null;
          id: string;
          keyword_text: string;
          last_synced_at: string | null;
          match_type: string | null;
          organization_id: string;
          platform_ad_group_id: string;
          provider: string;
          raw_payload: Json;
          status: string;
        };
        Insert: {
          bid_minor?: number | null;
          created_at?: string;
          external_keyword_id?: string | null;
          id?: string;
          keyword_text: string;
          last_synced_at?: string | null;
          match_type?: string | null;
          organization_id: string;
          platform_ad_group_id: string;
          provider: string;
          raw_payload?: Json;
          status?: string;
        };
        Update: {
          bid_minor?: number | null;
          created_at?: string;
          external_keyword_id?: string | null;
          id?: string;
          keyword_text?: string;
          last_synced_at?: string | null;
          match_type?: string | null;
          organization_id?: string;
          platform_ad_group_id?: string;
          provider?: string;
          raw_payload?: Json;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "keywords_ad_group_org_fk";
            columns: ["organization_id", "platform_ad_group_id"];
            isOneToOne: false;
            referencedRelation: "platform_ad_groups";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "keywords_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      landing_pages: {
        Row: {
          campaign_id: string | null;
          content: Json;
          created_at: string;
          created_by: string;
          id: string;
          organization_id: string;
          published_at: string | null;
          seo: Json;
          slug: string;
          status: string;
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          campaign_id?: string | null;
          content?: Json;
          created_at?: string;
          created_by?: string;
          id?: string;
          organization_id: string;
          published_at?: string | null;
          seo?: Json;
          slug: string;
          status?: string;
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          campaign_id?: string | null;
          content?: Json;
          created_at?: string;
          created_by?: string;
          id?: string;
          organization_id?: string;
          published_at?: string | null;
          seo?: Json;
          slug?: string;
          status?: string;
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "landing_pages_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "landing_pages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      message_sends: {
        Row: {
          channel: string;
          delivered_at: string | null;
          esp_connection_id: string | null;
          external_message_id: string | null;
          id: string;
          journey_run_id: string | null;
          message_id: string;
          metadata: Json;
          organization_id: string;
          person_id: string;
          queued_at: string;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          channel: string;
          delivered_at?: string | null;
          esp_connection_id?: string | null;
          external_message_id?: string | null;
          id?: string;
          journey_run_id?: string | null;
          message_id: string;
          metadata?: Json;
          organization_id: string;
          person_id: string;
          queued_at?: string;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          channel?: string;
          delivered_at?: string | null;
          esp_connection_id?: string | null;
          external_message_id?: string | null;
          id?: string;
          journey_run_id?: string | null;
          message_id?: string;
          metadata?: Json;
          organization_id?: string;
          person_id?: string;
          queued_at?: string;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_sends_esp_org_fk";
            columns: ["organization_id", "esp_connection_id"];
            isOneToOne: false;
            referencedRelation: "esp_connections";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "message_sends_message_org_fk";
            columns: ["organization_id", "message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "message_sends_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_sends_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "message_sends_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "message_sends_run_org_fk";
            columns: ["organization_id", "journey_run_id"];
            isOneToOne: false;
            referencedRelation: "journey_runs";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      messages: {
        Row: {
          body_template: string;
          channel: string;
          content_version: number;
          created_at: string;
          created_by: string;
          id: string;
          metadata: Json;
          name: string;
          organization_id: string;
          status: string;
          subject_template: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          body_template: string;
          channel: string;
          content_version?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          metadata?: Json;
          name: string;
          organization_id: string;
          status?: string;
          subject_template?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          body_template?: string;
          channel?: string;
          content_version?: number;
          created_at?: string;
          created_by?: string;
          id?: string;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          status?: string;
          subject_template?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      model_defaults: {
        Row: {
          attribution_model_id: string;
          created_at: string;
          effective_from: string;
          effective_to: string | null;
          id: string;
          journey_mode: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          attribution_model_id: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          journey_mode: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          attribution_model_id?: string;
          created_at?: string;
          effective_from?: string;
          effective_to?: string | null;
          id?: string;
          journey_mode?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "model_defaults_model_org_fk";
            columns: ["organization_id", "attribution_model_id"];
            isOneToOne: false;
            referencedRelation: "attribution_models";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "model_defaults_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      oauth_states: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string | null;
          provider: string;
          redirect_to: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          provider: string;
          redirect_to?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string | null;
          provider?: string;
          redirect_to?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "oauth_states_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          brand_profile: Json;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          brand_profile?: Json;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          brand_profile?: Json;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      outreach_messages: {
        Row: {
          body: string;
          channel: string;
          created_at: string;
          created_by: string;
          direction: string;
          error: string | null;
          external_id: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          sent_at: string | null;
          sent_by: string | null;
          status: string;
          subject: string | null;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          channel: string;
          created_at?: string;
          created_by?: string;
          direction: string;
          error?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: string;
          subject?: string | null;
          thread_id: string;
          user_id: string;
        };
        Update: {
          body?: string;
          channel?: string;
          created_at?: string;
          created_by?: string;
          direction?: string;
          error?: string | null;
          external_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          sent_at?: string | null;
          sent_by?: string | null;
          status?: string;
          subject?: string | null;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "outreach_threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_messages_thread_org_fk";
            columns: ["organization_id", "thread_id"];
            isOneToOne: false;
            referencedRelation: "outreach_threads";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      outreach_sequence_steps: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          delay_days: number;
          id: string;
          organization_id: string;
          sequence_id: string;
          step_order: number;
          subject: string | null;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string;
          delay_days?: number;
          id?: string;
          organization_id?: string;
          sequence_id: string;
          step_order: number;
          subject?: string | null;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          delay_days?: number;
          id?: string;
          organization_id?: string;
          sequence_id?: string;
          step_order?: number;
          subject?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_sequence_steps_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_sequence_steps_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "outreach_sequences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_steps_sequence_org_fk";
            columns: ["organization_id", "sequence_id"];
            isOneToOne: false;
            referencedRelation: "outreach_sequences";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      outreach_sequences: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name: string;
          organization_id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_sequences_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_sequences_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "outreach_sequences_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      outreach_threads: {
        Row: {
          campaign_id: string | null;
          channel: string;
          created_at: string;
          created_by: string;
          hotlist_id: string;
          id: string;
          last_message_at: string | null;
          organization_id: string;
          status: string;
          subject: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          campaign_id?: string | null;
          channel: string;
          created_at?: string;
          created_by?: string;
          hotlist_id: string;
          id?: string;
          last_message_at?: string | null;
          organization_id?: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          campaign_id?: string | null;
          channel?: string;
          created_at?: string;
          created_by?: string;
          hotlist_id?: string;
          id?: string;
          last_message_at?: string | null;
          organization_id?: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_threads_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_threads_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "outreach_threads_hotlist_id_fkey";
            columns: ["hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_threads_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "outreach_threads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ownership_backfill_quarantine: {
        Row: {
          discovered_at: string;
          entity_id: string;
          entity_table: string;
          id: string;
          organization_count: number;
          owner_user_id: string;
          reason: string;
          resolution_note: string | null;
          resolved_at: string | null;
        };
        Insert: {
          discovered_at?: string;
          entity_id: string;
          entity_table: string;
          id?: string;
          organization_count: number;
          owner_user_id: string;
          reason: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          discovered_at?: string;
          entity_id?: string;
          entity_table?: string;
          id?: string;
          organization_count?: number;
          owner_user_id?: string;
          reason?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      payouts: {
        Row: {
          amount_minor: number;
          approved_at: string | null;
          approved_by: string | null;
          campaign_id: string | null;
          created_at: string;
          creator_brand_link_id: string;
          currency: string;
          deal_term_id: string | null;
          external_payout_id: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          paid_at: string | null;
          provider: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_minor: number;
          approved_at?: string | null;
          approved_by?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          creator_brand_link_id: string;
          currency: string;
          deal_term_id?: string | null;
          external_payout_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          paid_at?: string | null;
          provider?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          amount_minor?: number;
          approved_at?: string | null;
          approved_by?: string | null;
          campaign_id?: string | null;
          created_at?: string;
          creator_brand_link_id?: string;
          currency?: string;
          deal_term_id?: string | null;
          external_payout_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          paid_at?: string | null;
          provider?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payouts_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "payouts_deal_org_fk";
            columns: ["organization_id", "deal_term_id"];
            isOneToOne: false;
            referencedRelation: "deal_terms";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "payouts_link_org_fk";
            columns: ["organization_id", "creator_brand_link_id"];
            isOneToOne: false;
            referencedRelation: "creator_brand_links";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "payouts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      persons: {
        Row: {
          attributes: Json;
          created_at: string;
          external_id: string | null;
          id: string;
          organization_id: string;
          primary_account_id: string | null;
          primary_email: string | null;
          updated_at: string;
        };
        Insert: {
          attributes?: Json;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          organization_id: string;
          primary_account_id?: string | null;
          primary_email?: string | null;
          updated_at?: string;
        };
        Update: {
          attributes?: Json;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          organization_id?: string;
          primary_account_id?: string | null;
          primary_email?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "persons_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "persons_primary_account_org_fk";
            columns: ["organization_id", "primary_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      plan_costs: {
        Row: {
          assumptions: Json;
          cost_basis: string;
          created_at: string;
          created_by: string;
          currency: string;
          effective_from: string;
          effective_to: string | null;
          fidelity_rung: string;
          id: string;
          one_time_amount_minor: number | null;
          organization_id: string;
          plan_key: string;
          recurring_amount_minor: number | null;
          updated_at: string;
        };
        Insert: {
          assumptions?: Json;
          cost_basis?: string;
          created_at?: string;
          created_by?: string;
          currency: string;
          effective_from: string;
          effective_to?: string | null;
          fidelity_rung?: string;
          id?: string;
          one_time_amount_minor?: number | null;
          organization_id: string;
          plan_key: string;
          recurring_amount_minor?: number | null;
          updated_at?: string;
        };
        Update: {
          assumptions?: Json;
          cost_basis?: string;
          created_at?: string;
          created_by?: string;
          currency?: string;
          effective_from?: string;
          effective_to?: string | null;
          fidelity_rung?: string;
          id?: string;
          one_time_amount_minor?: number | null;
          organization_id?: string;
          plan_key?: string;
          recurring_amount_minor?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_costs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_ad_groups: {
        Row: {
          bid_minor: number | null;
          bid_strategy: string | null;
          created_at: string;
          external_ad_group_id: string;
          id: string;
          last_synced_at: string | null;
          name: string;
          organization_id: string;
          platform_campaign_id: string;
          provider: string;
          raw_payload: Json;
          status: string;
          targeting: Json;
          updated_at: string;
        };
        Insert: {
          bid_minor?: number | null;
          bid_strategy?: string | null;
          created_at?: string;
          external_ad_group_id: string;
          id?: string;
          last_synced_at?: string | null;
          name: string;
          organization_id: string;
          platform_campaign_id: string;
          provider: string;
          raw_payload?: Json;
          status: string;
          targeting?: Json;
          updated_at?: string;
        };
        Update: {
          bid_minor?: number | null;
          bid_strategy?: string | null;
          created_at?: string;
          external_ad_group_id?: string;
          id?: string;
          last_synced_at?: string | null;
          name?: string;
          organization_id?: string;
          platform_campaign_id?: string;
          provider?: string;
          raw_payload?: Json;
          status?: string;
          targeting?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_ad_groups_campaign_org_fk";
            columns: ["organization_id", "platform_campaign_id"];
            isOneToOne: false;
            referencedRelation: "platform_campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_ad_groups_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_ads: {
        Row: {
          asset_group_id: string | null;
          created_at: string;
          creative_payload: Json;
          destination_url: string | null;
          external_ad_id: string;
          format: string | null;
          id: string;
          last_synced_at: string | null;
          name: string | null;
          organization_id: string;
          platform_ad_group_id: string | null;
          platform_campaign_id: string;
          provider: string;
          raw_payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          asset_group_id?: string | null;
          created_at?: string;
          creative_payload?: Json;
          destination_url?: string | null;
          external_ad_id: string;
          format?: string | null;
          id?: string;
          last_synced_at?: string | null;
          name?: string | null;
          organization_id: string;
          platform_ad_group_id?: string | null;
          platform_campaign_id: string;
          provider: string;
          raw_payload?: Json;
          status: string;
          updated_at?: string;
        };
        Update: {
          asset_group_id?: string | null;
          created_at?: string;
          creative_payload?: Json;
          destination_url?: string | null;
          external_ad_id?: string;
          format?: string | null;
          id?: string;
          last_synced_at?: string | null;
          name?: string | null;
          organization_id?: string;
          platform_ad_group_id?: string | null;
          platform_campaign_id?: string;
          provider?: string;
          raw_payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_ads_ad_group_org_fk";
            columns: ["organization_id", "platform_ad_group_id"];
            isOneToOne: false;
            referencedRelation: "platform_ad_groups";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_ads_asset_group_org_fk";
            columns: ["organization_id", "asset_group_id"];
            isOneToOne: false;
            referencedRelation: "asset_groups";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_ads_campaign_org_fk";
            columns: ["organization_id", "platform_campaign_id"];
            isOneToOne: false;
            referencedRelation: "platform_campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_ads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_campaigns: {
        Row: {
          ad_account_id: string;
          campaign_id: string | null;
          created_at: string;
          currency: string | null;
          daily_budget_minor: number | null;
          external_campaign_id: string;
          id: string;
          last_synced_at: string | null;
          lifetime_budget_minor: number | null;
          name: string;
          objective: string | null;
          organization_id: string;
          provider: string;
          raw_payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          ad_account_id: string;
          campaign_id?: string | null;
          created_at?: string;
          currency?: string | null;
          daily_budget_minor?: number | null;
          external_campaign_id: string;
          id?: string;
          last_synced_at?: string | null;
          lifetime_budget_minor?: number | null;
          name: string;
          objective?: string | null;
          organization_id: string;
          provider: string;
          raw_payload?: Json;
          status: string;
          updated_at?: string;
        };
        Update: {
          ad_account_id?: string;
          campaign_id?: string | null;
          created_at?: string;
          currency?: string | null;
          daily_budget_minor?: number | null;
          external_campaign_id?: string;
          id?: string;
          last_synced_at?: string | null;
          lifetime_budget_minor?: number | null;
          name?: string;
          objective?: string | null;
          organization_id?: string;
          provider?: string;
          raw_payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_campaigns_account_org_fk";
            columns: ["organization_id", "ad_account_id"];
            isOneToOne: false;
            referencedRelation: "ad_accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_campaigns_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_campaigns_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_sync_log: {
        Row: {
          details: Json;
          entity_type: string;
          external_id: string | null;
          id: string;
          import_job_id: string | null;
          occurred_at: string;
          operation: string;
          organization_id: string;
          provider: string;
          status: string;
        };
        Insert: {
          details?: Json;
          entity_type: string;
          external_id?: string | null;
          id?: string;
          import_job_id?: string | null;
          occurred_at?: string;
          operation: string;
          organization_id: string;
          provider: string;
          status: string;
        };
        Update: {
          details?: Json;
          entity_type?: string;
          external_id?: string | null;
          id?: string;
          import_job_id?: string | null;
          occurred_at?: string;
          operation?: string;
          organization_id?: string;
          provider?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_sync_log_job_org_fk";
            columns: ["organization_id", "import_job_id"];
            isOneToOne: false;
            referencedRelation: "import_jobs";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_sync_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_type: string;
          category: string | null;
          company_name: string | null;
          created_at: string;
          email: string | null;
          id: string;
          notes: string | null;
          onboarded: boolean;
          platforms: string[];
          target_age: string | null;
          target_gender: string | null;
          target_income: string | null;
          updated_at: string;
        };
        Insert: {
          account_type?: string;
          category?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          id: string;
          notes?: string | null;
          onboarded?: boolean;
          platforms?: string[];
          target_age?: string | null;
          target_gender?: string | null;
          target_income?: string | null;
          updated_at?: string;
        };
        Update: {
          account_type?: string;
          category?: string | null;
          company_name?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          notes?: string | null;
          onboarded?: boolean;
          platforms?: string[];
          target_age?: string | null;
          target_gender?: string | null;
          target_income?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      revenue_recognition: {
        Row: {
          amount_minor: number;
          conversion_id: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          external_ref: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          recognition_end: string;
          recognition_start: string;
          recognized_on: string;
          revenue_type: string;
          source: string;
        };
        Insert: {
          amount_minor: number;
          conversion_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency: string;
          external_ref?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          recognition_end: string;
          recognition_start: string;
          recognized_on: string;
          revenue_type: string;
          source: string;
        };
        Update: {
          amount_minor?: number;
          conversion_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          external_ref?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          recognition_end?: string;
          recognition_start?: string;
          recognized_on?: string;
          revenue_type?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revenue_recognition_conversion_org_fk";
            columns: ["organization_id", "conversion_id"];
            isOneToOne: false;
            referencedRelation: "conversions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "revenue_recognition_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      review_events: {
        Row: {
          actor_user_id: string;
          comment: string | null;
          created_at: string;
          deliverable_id: string;
          event_type: string;
          id: string;
          metadata: Json;
          organization_id: string;
        };
        Insert: {
          actor_user_id?: string;
          comment?: string | null;
          created_at?: string;
          deliverable_id: string;
          event_type: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
        };
        Update: {
          actor_user_id?: string;
          comment?: string | null;
          created_at?: string;
          deliverable_id?: string;
          event_type?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_events_deliverable_org_fk";
            columns: ["organization_id", "deliverable_id"];
            isOneToOne: false;
            referencedRelation: "deliverables";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "review_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sending_domains: {
        Row: {
          created_at: string;
          created_by: string;
          dkim_status: string | null;
          dmarc_status: string | null;
          domain: string;
          id: string;
          last_checked_at: string | null;
          organization_id: string;
          spf_status: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          dkim_status?: string | null;
          dmarc_status?: string | null;
          domain: string;
          id?: string;
          last_checked_at?: string | null;
          organization_id: string;
          spf_status?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          dkim_status?: string | null;
          dmarc_status?: string | null;
          domain?: string;
          id?: string;
          last_checked_at?: string | null;
          organization_id?: string;
          spf_status?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sending_domains_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      sequence_enrollments: {
        Row: {
          created_at: string;
          created_by: string;
          current_step: number;
          error: string | null;
          hotlist_id: string;
          id: string;
          next_send_at: string | null;
          organization_id: string;
          sequence_id: string;
          status: string;
          thread_id: string | null;
          to_address: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string;
          current_step?: number;
          error?: string | null;
          hotlist_id: string;
          id?: string;
          next_send_at?: string | null;
          organization_id?: string;
          sequence_id: string;
          status?: string;
          thread_id?: string | null;
          to_address: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          current_step?: number;
          error?: string | null;
          hotlist_id?: string;
          id?: string;
          next_send_at?: string | null;
          organization_id?: string;
          sequence_id?: string;
          status?: string;
          thread_id?: string | null;
          to_address?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sequence_enrollments_hotlist_id_fkey";
            columns: ["hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sequence_enrollments_hotlist_org_fk";
            columns: ["organization_id", "hotlist_id"];
            isOneToOne: false;
            referencedRelation: "hotlist";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "sequence_enrollments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_id_fkey";
            columns: ["sequence_id"];
            isOneToOne: false;
            referencedRelation: "outreach_sequences";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sequence_enrollments_sequence_org_fk";
            columns: ["organization_id", "sequence_id"];
            isOneToOne: false;
            referencedRelation: "outreach_sequences";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "sequence_enrollments_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "outreach_threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sequence_enrollments_thread_org_fk";
            columns: ["organization_id", "thread_id"];
            isOneToOne: false;
            referencedRelation: "outreach_threads";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      signals: {
        Row: {
          author: string | null;
          collected_at: string;
          content: string | null;
          created_at: string;
          external_id: string;
          id: string;
          kind: string;
          metrics: Json;
          organization_id: string;
          sentiment: string | null;
          source: Database["public"]["Enums"]["signal_source"];
          title: string | null;
          topic: string | null;
          url: string | null;
        };
        Insert: {
          author?: string | null;
          collected_at?: string;
          content?: string | null;
          created_at?: string;
          external_id: string;
          id?: string;
          kind?: string;
          metrics?: Json;
          organization_id: string;
          sentiment?: string | null;
          source: Database["public"]["Enums"]["signal_source"];
          title?: string | null;
          topic?: string | null;
          url?: string | null;
        };
        Update: {
          author?: string | null;
          collected_at?: string;
          content?: string | null;
          created_at?: string;
          external_id?: string;
          id?: string;
          kind?: string;
          metrics?: Json;
          organization_id?: string;
          sentiment?: string | null;
          source?: Database["public"]["Enums"]["signal_source"];
          title?: string | null;
          topic?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "signals_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      suppressions: {
        Row: {
          channel: string;
          destination_hash: string;
          expires_at: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          reason: string;
          source: string;
          suppressed_at: string;
        };
        Insert: {
          channel: string;
          destination_hash: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          reason: string;
          source: string;
          suppressed_at?: string;
        };
        Update: {
          channel?: string;
          destination_hash?: string;
          expires_at?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          reason?: string;
          source?: string;
          suppressed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppressions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      thread_messages: {
        Row: {
          attachments: Json;
          body: string;
          created_at: string;
          id: string;
          organization_id: string;
          sender_user_id: string;
          thread_id: string;
        };
        Insert: {
          attachments?: Json;
          body: string;
          created_at?: string;
          id?: string;
          organization_id: string;
          sender_user_id?: string;
          thread_id: string;
        };
        Update: {
          attachments?: Json;
          body?: string;
          created_at?: string;
          id?: string;
          organization_id?: string;
          sender_user_id?: string;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "thread_messages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "thread_messages_thread_org_fk";
            columns: ["organization_id", "thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      threads: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          created_by: string;
          creator_brand_link_id: string;
          deliverable_id: string | null;
          id: string;
          last_message_at: string | null;
          organization_id: string;
          status: string;
          subject: string | null;
          updated_at: string;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id: string;
          deliverable_id?: string | null;
          id?: string;
          last_message_at?: string | null;
          organization_id: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          created_by?: string;
          creator_brand_link_id?: string;
          deliverable_id?: string | null;
          id?: string;
          last_message_at?: string | null;
          organization_id?: string;
          status?: string;
          subject?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threads_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "threads_deliverable_org_fk";
            columns: ["organization_id", "deliverable_id"];
            isOneToOne: false;
            referencedRelation: "deliverables";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "threads_link_org_fk";
            columns: ["organization_id", "creator_brand_link_id"];
            isOneToOne: false;
            referencedRelation: "creator_brand_links";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "threads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      touchpoints: {
        Row: {
          account_id: string | null;
          campaign_id: string | null;
          channel: string;
          channel_id: string;
          created_at: string;
          event_id: string;
          event_occurred_at: string;
          external_ref: string | null;
          id: string;
          medium: string | null;
          occurred_at: string;
          organization_id: string;
          person_id: string | null;
          properties: Json;
          source: string;
        };
        Insert: {
          account_id?: string | null;
          campaign_id?: string | null;
          channel: string;
          channel_id: string;
          created_at?: string;
          event_id: string;
          event_occurred_at: string;
          external_ref?: string | null;
          id?: string;
          medium?: string | null;
          occurred_at: string;
          organization_id: string;
          person_id?: string | null;
          properties?: Json;
          source: string;
        };
        Update: {
          account_id?: string | null;
          campaign_id?: string | null;
          channel?: string;
          channel_id?: string;
          created_at?: string;
          event_id?: string;
          event_occurred_at?: string;
          external_ref?: string | null;
          id?: string;
          medium?: string | null;
          occurred_at?: string;
          organization_id?: string;
          person_id?: string | null;
          properties?: Json;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "touchpoints_account_org_fk";
            columns: ["organization_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "touchpoints_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "touchpoints_channel_org_fk";
            columns: ["organization_id", "channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "touchpoints_event_org_fk";
            columns: ["organization_id", "event_occurred_at", "event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["organization_id", "occurred_at", "id"];
          },
          {
            foreignKeyName: "touchpoints_event_org_fk";
            columns: ["organization_id", "event_occurred_at", "event_id"];
            isOneToOne: false;
            referencedRelation: "events_redacted";
            referencedColumns: ["organization_id", "occurred_at", "id"];
          },
          {
            foreignKeyName: "touchpoints_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "touchpoints_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "touchpoints_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      tracking_health: {
        Row: {
          check_key: string;
          diagnostics: Json;
          failure_count: number;
          id: string;
          last_checked_at: string;
          last_event_at: string | null;
          organization_id: string;
          run_key: string;
          source: string;
          status: string;
        };
        Insert: {
          check_key: string;
          diagnostics?: Json;
          failure_count?: number;
          id?: string;
          last_checked_at?: string;
          last_event_at?: string | null;
          organization_id: string;
          run_key: string;
          source: string;
          status: string;
        };
        Update: {
          check_key?: string;
          diagnostics?: Json;
          failure_count?: number;
          id?: string;
          last_checked_at?: string;
          last_event_at?: string | null;
          organization_id?: string;
          run_key?: string;
          source?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracking_health_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      visitors: {
        Row: {
          anonymous_id: string;
          created_at: string;
          first_seen_at: string;
          id: string;
          last_seen_at: string;
          organization_id: string;
          traits: Json;
          updated_at: string;
        };
        Insert: {
          anonymous_id: string;
          created_at?: string;
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          organization_id: string;
          traits?: Json;
          updated_at?: string;
        };
        Update: {
          anonymous_id?: string;
          created_at?: string;
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string;
          organization_id?: string;
          traits?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visitors_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      action_invocations_redacted: {
        Row: {
          action_type: string | null;
          action_version: number | null;
          actor_type: string | null;
          actor_user_id: string | null;
          campaign_id: string | null;
          causation_id: string | null;
          correlation_id: string | null;
          error_summary: string | null;
          event_type: string | null;
          id: string | null;
          invocation_key: string | null;
          occurred_at: string | null;
          organization_id: string | null;
          sequence_number: number | null;
        };
        Insert: {
          action_type?: string | null;
          action_version?: number | null;
          actor_type?: string | null;
          actor_user_id?: string | null;
          campaign_id?: string | null;
          causation_id?: string | null;
          correlation_id?: string | null;
          error_summary?: string | null;
          event_type?: string | null;
          id?: string | null;
          invocation_key?: string | null;
          occurred_at?: string | null;
          organization_id?: string | null;
          sequence_number?: number | null;
        };
        Update: {
          action_type?: string | null;
          action_version?: number | null;
          actor_type?: string | null;
          actor_user_id?: string | null;
          campaign_id?: string | null;
          causation_id?: string | null;
          correlation_id?: string | null;
          error_summary?: string | null;
          event_type?: string | null;
          id?: string | null;
          invocation_key?: string | null;
          occurred_at?: string | null;
          organization_id?: string | null;
          sequence_number?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "action_invocations_campaign_org_fk";
            columns: ["organization_id", "campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "action_invocations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      events_redacted: {
        Row: {
          account_id: string | null;
          event_definition_id: string | null;
          event_key: string | null;
          id: string | null;
          occurred_at: string | null;
          organization_id: string | null;
          person_id: string | null;
          received_at: string | null;
        };
        Insert: {
          account_id?: string | null;
          event_definition_id?: string | null;
          event_key?: string | null;
          id?: string | null;
          occurred_at?: string | null;
          organization_id?: string | null;
          person_id?: string | null;
          received_at?: string | null;
        };
        Update: {
          account_id?: string | null;
          event_definition_id?: string | null;
          event_key?: string | null;
          id?: string | null;
          occurred_at?: string | null;
          organization_id?: string | null;
          person_id?: string | null;
          received_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_account_org_fk";
            columns: ["organization_id", "account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_definition_org_fk";
            columns: ["organization_id", "event_definition_id"];
            isOneToOne: false;
            referencedRelation: "event_definitions";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "events_person_org_fk";
            columns: ["organization_id", "person_id"];
            isOneToOne: false;
            referencedRelation: "persons_redacted";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      persons_redacted: {
        Row: {
          created_at: string | null;
          id: string | null;
          organization_id: string | null;
          primary_account_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string | null;
          organization_id?: string | null;
          primary_account_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string | null;
          organization_id?: string | null;
          primary_account_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "persons_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "persons_primary_account_org_fk";
            columns: ["organization_id", "primary_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["organization_id", "id"];
          },
        ];
      };
      platform_sync_log_redacted: {
        Row: {
          entity_type: string | null;
          external_id: string | null;
          id: string | null;
          import_job_id: string | null;
          occurred_at: string | null;
          operation: string | null;
          organization_id: string | null;
          provider: string | null;
          status: string | null;
        };
        Insert: {
          entity_type?: string | null;
          external_id?: string | null;
          id?: string | null;
          import_job_id?: string | null;
          occurred_at?: string | null;
          operation?: string | null;
          organization_id?: string | null;
          provider?: string | null;
          status?: string | null;
        };
        Update: {
          entity_type?: string | null;
          external_id?: string | null;
          id?: string | null;
          import_job_id?: string | null;
          occurred_at?: string | null;
          operation?: string | null;
          organization_id?: string | null;
          provider?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "platform_sync_log_job_org_fk";
            columns: ["organization_id", "import_job_id"];
            isOneToOne: false;
            referencedRelation: "import_jobs";
            referencedColumns: ["organization_id", "id"];
          },
          {
            foreignKeyName: "platform_sync_log_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      visitors_redacted: {
        Row: {
          created_at: string | null;
          first_seen_at: string | null;
          id: string | null;
          last_seen_at: string | null;
          organization_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_seen_at?: string | null;
          id?: string | null;
          last_seen_at?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_seen_at?: string | null;
          id?: string | null;
          last_seen_at?: string | null;
          organization_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "visitors_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      campaign_spend_daily: {
        Args: { p_campaign: string; p_org: string };
        Returns: {
          ads_with_spend: number;
          currency: string;
          day: string;
          spend_minor: number;
        }[];
      };
      can_edit_org: { Args: { org: string }; Returns: boolean };
      decide_approval: {
        Args: {
          decision: string;
          expected_input_hash: string;
          reason?: string;
          target_approval_id: string;
        };
        Returns: {
          action_type: string;
          assigned_to: string | null;
          automation_rule_id: string | null;
          decided_at: string | null;
          decided_by: string | null;
          decision_reason: string | null;
          expires_at: string | null;
          id: string;
          input_hash: string;
          invocation_key: string;
          organization_id: string;
          request_summary: Json;
          requested_at: string;
          requested_by_type: string;
          requested_by_user_id: string | null;
          status: string;
        };
        SetofOptions: {
          from: "*";
          to: "approvals";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      has_creator_brand_access: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
      is_creator_link_participant: {
        Args: {
          target_creator_brand_link_id: string;
          target_organization_id: string;
        };
        Returns: boolean;
      };
      is_org_admin: { Args: { org: string }; Returns: boolean };
      is_org_member: { Args: { org: string }; Returns: boolean };
      org_role: {
        Args: { org: string };
        Returns: Database["public"]["Enums"]["org_role"];
      };
      recompute_affiliate_daily: { Args: { p_org: string }; Returns: undefined };
      resolve_single_org_for_user: {
        Args: { subject_user_id: string };
        Returns: string;
      };
      seed_attribution_defaults: {
        Args: { target_organization_id: string };
        Returns: undefined;
      };
      seed_default_event_definitions: {
        Args: { target_organization_id: string };
        Returns: undefined;
      };
      shares_org_with: { Args: { target: string }; Returns: boolean };
    };
    Enums: {
      affiliate_event_type: "click" | "conversion";
      affiliate_provider: "stripe" | "shopify" | "paddle" | "lemonsqueezy" | "manual";
      org_role: "admin" | "editor" | "reviewer";
      signal_source: "brand24" | "phyllo" | "youtube" | "x" | "reddit" | "trends";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      affiliate_event_type: ["click", "conversion"],
      affiliate_provider: ["stripe", "shopify", "paddle", "lemonsqueezy", "manual"],
      org_role: ["admin", "editor", "reviewer"],
      signal_source: ["brand24", "phyllo", "youtube", "x", "reddit", "trends"],
    },
  },
} as const;
