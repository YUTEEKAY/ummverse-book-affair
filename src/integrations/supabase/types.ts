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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      book_vendors: {
        Row: {
          book_id: string
          created_at: string
          vendor_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          vendor_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_vendors_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      book_views: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string | null
          view_type: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id?: string | null
          view_type?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_views_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          affiliate_amazon: string | null
          affiliate_barnesnoble: string | null
          affiliate_harlequin: string | null
          api_source: string | null
          author: string
          cover_url: string | null
          created_at: string | null
          genre: string | null
          heat_level: string | null
          id: string
          import_source: string | null
          isbn: string | null
          isbn13: string | null
          language: string | null
          mood: string | null
          page_count: number | null
          publication_year: number | null
          publisher: string | null
          purchase_link: string | null
          rating: number | null
          summary: string | null
          title: string
          trope: string | null
        }
        Insert: {
          affiliate_amazon?: string | null
          affiliate_barnesnoble?: string | null
          affiliate_harlequin?: string | null
          api_source?: string | null
          author: string
          cover_url?: string | null
          created_at?: string | null
          genre?: string | null
          heat_level?: string | null
          id?: string
          import_source?: string | null
          isbn?: string | null
          isbn13?: string | null
          language?: string | null
          mood?: string | null
          page_count?: number | null
          publication_year?: number | null
          publisher?: string | null
          purchase_link?: string | null
          rating?: number | null
          summary?: string | null
          title: string
          trope?: string | null
        }
        Update: {
          affiliate_amazon?: string | null
          affiliate_barnesnoble?: string | null
          affiliate_harlequin?: string | null
          api_source?: string | null
          author?: string
          cover_url?: string | null
          created_at?: string | null
          genre?: string | null
          heat_level?: string | null
          id?: string
          import_source?: string | null
          isbn?: string | null
          isbn13?: string | null
          language?: string | null
          mood?: string | null
          page_count?: number | null
          publication_year?: number | null
          publisher?: string | null
          purchase_link?: string | null
          rating?: number | null
          summary?: string | null
          title?: string
          trope?: string | null
        }
        Relationships: []
      }
      enrichment_logs: {
        Row: {
          book_id: string | null
          created_at: string | null
          data_source: string | null
          error_message: string | null
          fields_updated: string[] | null
          id: string
          status: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          data_source?: string | null
          error_message?: string | null
          fields_updated?: string[] | null
          id?: string
          status: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          data_source?: string | null
          error_message?: string | null
          fields_updated?: string[] | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_logs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          updated_at: string
          user_id: string
          uses: number
        }
        Insert: {
          updated_at?: string
          user_id: string
          uses?: number
        }
        Update: {
          updated_at?: string
          user_id?: string
          uses?: number
        }
        Relationships: []
      }
      genres: {
        Row: {
          color_theme: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      moods: {
        Row: {
          background_style: string | null
          color_theme: string | null
          created_at: string | null
          genre_list: string[] | null
          id: string
          name: string
          tagline: string | null
        }
        Insert: {
          background_style?: string | null
          color_theme?: string | null
          created_at?: string | null
          genre_list?: string[] | null
          id?: string
          name: string
          tagline?: string | null
        }
        Update: {
          background_style?: string | null
          color_theme?: string | null
          created_at?: string | null
          genre_list?: string[] | null
          id?: string
          name?: string
          tagline?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          favorite_genres: string[] | null
          free_views_count: number
          free_views_reset_date: string
          full_name: string | null
          id: string
          is_premium: boolean
          lemon_squeezy_customer_id: string | null
          notification_preferences: Json | null
          preferred_heat_levels: string[] | null
          profile_visibility: string | null
          reading_goal_monthly: number | null
          subscription_ends_at: string | null
          subscription_id: string | null
          subscription_product_id: string | null
          subscription_status: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          subscription_variant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          favorite_genres?: string[] | null
          free_views_count?: number
          free_views_reset_date?: string
          full_name?: string | null
          id: string
          is_premium?: boolean
          lemon_squeezy_customer_id?: string | null
          notification_preferences?: Json | null
          preferred_heat_levels?: string[] | null
          profile_visibility?: string | null
          reading_goal_monthly?: number | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          subscription_variant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          favorite_genres?: string[] | null
          free_views_count?: number
          free_views_reset_date?: string
          full_name?: string | null
          id?: string
          is_premium?: boolean
          lemon_squeezy_customer_id?: string | null
          notification_preferences?: Json | null
          preferred_heat_levels?: string[] | null
          profile_visibility?: string | null
          reading_goal_monthly?: number | null
          subscription_ends_at?: string | null
          subscription_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          subscription_variant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quiz_history: {
        Row: {
          answers: Json
          book_ids: string[]
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          answers?: Json
          book_ids?: string[]
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          answers?: Json
          book_ids?: string[]
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          author: string
          book_title: string | null
          created_at: string | null
          id: string
          source: string | null
          text: string
        }
        Insert: {
          author: string
          book_title?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          text: string
        }
        Update: {
          author?: string
          book_title?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          text?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_id: string | null
          created_at: string | null
          hearts: number | null
          id: string
          nickname: string | null
          pen_name: string | null
          rating: number | null
          review_text: string
          timestamp: string | null
          user_id: string | null
          user_ip: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          hearts?: number | null
          id?: string
          nickname?: string | null
          pen_name?: string | null
          rating?: number | null
          review_text: string
          timestamp?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          hearts?: number | null
          id?: string
          nickname?: string | null
          pen_name?: string | null
          rating?: number | null
          review_text?: string
          timestamp?: string | null
          user_id?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_books: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tropes: {
        Row: {
          color_theme: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_lists: {
        Row: {
          added_at: string
          book_id: string
          id: string
          list_type: string
          user_id: string
        }
        Insert: {
          added_at?: string
          book_id: string
          id?: string
          list_type: string
          user_id: string
        }
        Update: {
          added_at?: string
          book_id?: string
          id?: string
          list_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_lists_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          created_at: string
          id: string
          instagram_handle: string | null
          name: string
          phone_number: string | null
          type: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_handle?: string | null
          name: string
          phone_number?: string | null
          type?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instagram_handle?: string | null
          name?: string
          phone_number?: string | null
          type?: string
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: { check_env?: string }
        Returns: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          email: string
          full_name: string
          id: string
          is_manual: boolean
          price_id: string
          status: string
          trials_used: number
        }[]
      }
      admin_reset_trials: { Args: { target_user: string }; Returns: undefined }
      admin_set_tier: {
        Args: { check_env?: string; target_user: string; tier: string }
        Returns: undefined
      }
      consume_trial: {
        Args: { check_env?: string; device_uses: number }
        Returns: Json
      }
      get_book_reviews: {
        Args: { _book_id: string }
        Returns: {
          created_at: string
          full_access: boolean
          hearts: number
          id: string
          pen_name: string
          review_text: string
          total_count: number
        }[]
      }
      get_book_vendors: {
        Args: { _book_id: string }
        Returns: {
          full_access: boolean
          id: string
          instagram_handle: string
          name: string
          phone_number: string
          total_count: number
          type: string
          website_url: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_paid_member: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_tier: "free" | "premium_monthly" | "lifetime"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
      subscription_tier: ["free", "premium_monthly", "lifetime"],
    },
  },
} as const
