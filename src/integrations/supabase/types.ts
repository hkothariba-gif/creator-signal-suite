export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          body: string | null
          created_at: string
          created_by: string
          cta: string | null
          headline: string | null
          id: string
          image_path: string | null
          image_prompt: string | null
          informed_by_affiliate: boolean
          insights: Json
          name: string
          organization_id: string
          project_id: string | null
          shared: boolean
          status: string
          target_platform: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by: string
          cta?: string | null
          headline?: string | null
          id?: string
          image_path?: string | null
          image_prompt?: string | null
          informed_by_affiliate?: boolean
          insights?: Json
          name?: string
          organization_id: string
          project_id?: string | null
          shared?: boolean
          status?: string
          target_platform?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string
          cta?: string | null
          headline?: string | null
          id?: string
          image_path?: string | null
          image_prompt?: string | null
          informed_by_affiliate?: boolean
          insights?: Json
          name?: string
          organization_id?: string
          project_id?: string | null
          shared?: boolean
          status?: string
          target_platform?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brief: string | null
          budget: string | null
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          name: string
          platforms: string[] | null
          product_description: string | null
          search_criteria: Json | null
          start_date: string | null
          status: string
          target_audience: Json | null
          user_id: string
        }
        Insert: {
          brief?: string | null
          budget?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          platforms?: string[] | null
          product_description?: string | null
          search_criteria?: Json | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          user_id: string
        }
        Update: {
          brief?: string | null
          budget?: string | null
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          platforms?: string[] | null
          product_description?: string | null
          search_criteria?: Json | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      hotlist: {
        Row: {
          avatar_url: string | null
          campaign_id: string | null
          cpm: string | null
          created_at: string
          creator_name: string
          external_id: string | null
          id: string
          platform: string | null
          profile_data: Json | null
          score: number | null
          source: string
          stage: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          campaign_id?: string | null
          cpm?: string | null
          created_at?: string
          creator_name: string
          external_id?: string | null
          id?: string
          platform?: string | null
          profile_data?: Json | null
          score?: number | null
          source?: string
          stage?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          campaign_id?: string | null
          cpm?: string | null
          created_at?: string
          creator_name?: string
          external_id?: string | null
          id?: string
          platform?: string | null
          profile_data?: Json | null
          score?: number | null
          source?: string
          stage?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotlist_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_profile: Json
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand_profile?: Json
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand_profile?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          category: string | null
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          notes: string | null
          onboarded: boolean
          platforms: string[]
          target_age: string | null
          target_gender: string | null
          target_income: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          category?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          notes?: string | null
          onboarded?: boolean
          platforms?: string[]
          target_age?: string | null
          target_gender?: string | null
          target_income?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          category?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          notes?: string | null
          onboarded?: boolean
          platforms?: string[]
          target_age?: string | null
          target_gender?: string | null
          target_income?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          author: string | null
          collected_at: string
          content: string | null
          created_at: string
          external_id: string
          id: string
          kind: string
          metrics: Json
          organization_id: string
          sentiment: string | null
          source: Database["public"]["Enums"]["signal_source"]
          title: string | null
          topic: string | null
          url: string | null
        }
        Insert: {
          author?: string | null
          collected_at?: string
          content?: string | null
          created_at?: string
          external_id: string
          id?: string
          kind?: string
          metrics?: Json
          organization_id: string
          sentiment?: string | null
          source: Database["public"]["Enums"]["signal_source"]
          title?: string | null
          topic?: string | null
          url?: string | null
        }
        Update: {
          author?: string | null
          collected_at?: string
          content?: string | null
          created_at?: string
          external_id?: string
          id?: string
          kind?: string
          metrics?: Json
          organization_id?: string
          sentiment?: string | null
          source?: Database["public"]["Enums"]["signal_source"]
          title?: string | null
          topic?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_org: { Args: { org: string }; Returns: boolean }
      is_org_admin: { Args: { org: string }; Returns: boolean }
      is_org_member: { Args: { org: string }; Returns: boolean }
      org_role: {
        Args: { org: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      shares_org_with: { Args: { target: string }; Returns: boolean }
    }
    Enums: {
      org_role: "admin" | "editor" | "reviewer"
      signal_source:
        | "brand24"
        | "phyllo"
        | "youtube"
        | "x"
        | "reddit"
        | "trends"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      org_role: ["admin", "editor", "reviewer"],
      signal_source: ["brand24", "phyllo", "youtube", "x", "reddit", "trends"],
    },
  },
} as const
