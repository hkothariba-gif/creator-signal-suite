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
      profiles: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
