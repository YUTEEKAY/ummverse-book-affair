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
          mood: string | null
          publication_year: number | null
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
          mood?: string | null
          publication_year?: number | null
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
          mood?: string | null
          publication_year?: number | null
          purchase_link?: string | null
          rating?: number | null
          summary?: string | null
          title?: string
          trope?: string | null
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
          hearts: number | null
          id: string
          pen_name: string | null
          review_text: string
          timestamp: string | null
        }
        Insert: {
          book_id?: string | null
          hearts?: number | null
          id?: string
          pen_name?: string | null
          review_text: string
          timestamp?: string | null
        }
        Update: {
          book_id?: string | null
          hearts?: number | null
          id?: string
          pen_name?: string | null
          review_text?: string
          timestamp?: string | null
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
