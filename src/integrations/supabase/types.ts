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
      destination_events: {
        Row: {
          active: boolean
          created_at: string
          description: string
          destination_id: string
          display_order: number
          id: string
          schedule: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          destination_id: string
          display_order?: number
          id?: string
          schedule?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          destination_id?: string
          display_order?: number
          id?: string
          schedule?: string[]
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_events_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_links: {
        Row: {
          active: boolean
          created_at: string
          destination_id: string
          display_order: number
          id: string
          kind: Database["public"]["Enums"]["destination_link_type"]
          label: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_id: string
          display_order?: number
          id?: string
          kind: Database["public"]["Enums"]["destination_link_type"]
          label?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_id?: string
          display_order?: number
          id?: string
          kind?: Database["public"]["Enums"]["destination_link_type"]
          label?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "destination_links_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_photos: {
        Row: {
          active: boolean
          caption: string | null
          created_at: string
          destination_id: string
          display_order: number
          id: string
          image_url: string
          post_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          caption?: string | null
          created_at?: string
          destination_id: string
          display_order?: number
          id?: string
          image_url: string
          post_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          caption?: string | null
          created_at?: string
          destination_id?: string
          display_order?: number
          id?: string
          image_url?: string
          post_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "destination_photos_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          active: boolean
          booking_message: string | null
          booking_url: string | null
          breakfast_menu_url: string | null
          cluster: string | null
          created_at: string
          dinner_menu_url: string | null
          discover_url: string | null
          display_order: number
          id: string
          image_key: string | null
          instagram_spot: boolean
          instagram_url: string | null
          level_id: string
          lunch_menu_url: string | null
          menu_url: string | null
          name: string
          price_list_url: string | null
          short_description: string
          type: Database["public"]["Enums"]["destination_type"]
          updated_at: string
          vegan_menu_url: string | null
          vegetarian_menu_url: string | null
        }
        Insert: {
          active?: boolean
          booking_message?: string | null
          booking_url?: string | null
          breakfast_menu_url?: string | null
          cluster?: string | null
          created_at?: string
          dinner_menu_url?: string | null
          discover_url?: string | null
          display_order?: number
          id: string
          image_key?: string | null
          instagram_spot?: boolean
          instagram_url?: string | null
          level_id: string
          lunch_menu_url?: string | null
          menu_url?: string | null
          name: string
          price_list_url?: string | null
          short_description?: string
          type: Database["public"]["Enums"]["destination_type"]
          updated_at?: string
          vegan_menu_url?: string | null
          vegetarian_menu_url?: string | null
        }
        Update: {
          active?: boolean
          booking_message?: string | null
          booking_url?: string | null
          breakfast_menu_url?: string | null
          cluster?: string | null
          created_at?: string
          dinner_menu_url?: string | null
          discover_url?: string | null
          display_order?: number
          id?: string
          image_key?: string | null
          instagram_spot?: boolean
          instagram_url?: string | null
          level_id?: string
          lunch_menu_url?: string | null
          menu_url?: string | null
          name?: string
          price_list_url?: string | null
          short_description?: string
          type?: Database["public"]["Enums"]["destination_type"]
          updated_at?: string
          vegan_menu_url?: string | null
          vegetarian_menu_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destinations_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          clusters: string[]
          created_at: string
          display_order: number
          id: string
          image_key: string | null
          line: string
          title: string
          updated_at: string
        }
        Insert: {
          clusters?: string[]
          created_at?: string
          display_order?: number
          id: string
          image_key?: string | null
          line: string
          title: string
          updated_at?: string
        }
        Update: {
          clusters?: string[]
          created_at?: string
          display_order?: number
          id?: string
          image_key?: string | null
          line?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          display_order: number
          key: string
          label: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          key: string
          label?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          key?: string
          label?: string | null
          updated_at?: string
          value?: string
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
      destination_link_type:
        | "DISCOVER"
        | "INFO"
        | "DETAILS"
        | "MENU"
        | "BREAKFAST_MENU"
        | "LUNCH_MENU"
        | "DINNER_MENU"
        | "VEGETARIAN_MENU"
        | "VEGAN_MENU"
        | "PRICE_LIST"
        | "BROCHURE"
        | "TREATMENTS"
        | "ACTIVITIES"
        | "BOOK"
        | "INSTAGRAM"
        | "VISIT"
        | "HOURS"
        | "WEBSITE"
      destination_type:
        | "restaurant"
        | "bar"
        | "spa"
        | "experience"
        | "pool"
        | "fitness"
        | "kids"
        | "retail"
        | "gallery"
        | "accommodation"
        | "service"
        | "beach"
        | "recreation"
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
      destination_link_type: [
        "DISCOVER",
        "INFO",
        "DETAILS",
        "MENU",
        "BREAKFAST_MENU",
        "LUNCH_MENU",
        "DINNER_MENU",
        "VEGETARIAN_MENU",
        "VEGAN_MENU",
        "PRICE_LIST",
        "BROCHURE",
        "TREATMENTS",
        "ACTIVITIES",
        "BOOK",
        "INSTAGRAM",
        "VISIT",
        "HOURS",
        "WEBSITE",
      ],
      destination_type: [
        "restaurant",
        "bar",
        "spa",
        "experience",
        "pool",
        "fitness",
        "kids",
        "retail",
        "gallery",
        "accommodation",
        "service",
        "beach",
        "recreation",
      ],
    },
  },
} as const
