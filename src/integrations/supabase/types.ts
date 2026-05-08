export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          login_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          login_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          login_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          member_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id?: string;
          member_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          member_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          body: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          image_url: string | null;
          published: boolean;
          slug: string;
          title: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          image_url?: string | null;
          published?: boolean;
          slug: string;
          title: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          image_url?: string | null;
          published?: boolean;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
        };
        Relationships: [];
      };
      diet_intakes: {
        Row: {
          activity: string;
          age: number;
          allergies: string | null;
          created_at: string;
          email: string | null;
          gender: string;
          goal: string;
          height_cm: number;
          id: string;
          name: string;
          plan: Json | null;
          user_id: string | null;
          weight_kg: number;
        };
        Insert: {
          activity: string;
          age: number;
          allergies?: string | null;
          created_at?: string;
          email?: string | null;
          gender: string;
          goal: string;
          height_cm: number;
          id?: string;
          name: string;
          plan?: Json | null;
          user_id?: string | null;
          weight_kg: number;
        };
        Update: {
          activity?: string;
          age?: number;
          allergies?: string | null;
          created_at?: string;
          email?: string | null;
          gender?: string;
          goal?: string;
          height_cm?: number;
          id?: string;
          name?: string;
          plan?: Json | null;
          user_id?: string | null;
          weight_kg?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          due_date_snapshot: string | null;
          id: string;
          invoice_no: string;
          member_id: string;
          mode: string;
          next_due_date: string | null;
          payment_date: string;
          transaction_id: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          due_date_snapshot?: string | null;
          id?: string;
          invoice_no?: string;
          member_id: string;
          mode?: string;
          next_due_date?: string | null;
          payment_date?: string;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          due_date_snapshot?: string | null;
          id?: string;
          invoice_no?: string;
          member_id?: string;
          mode?: string;
          next_due_date?: string | null;
          payment_date?: string;
          transaction_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          alert_disabled: boolean;
          attendance_override: boolean;
          created_at: string;
          email: string;
          fee_amount: number;
          fee_due_date: string;
          id: string;
          joining_date: string;
          member_id: string;
          name: string;
          phone: string | null;
          photo_url: string | null;
          updated_at: string;
        };
        Insert: {
          alert_disabled?: boolean;
          attendance_override?: boolean;
          created_at?: string;
          email: string;
          fee_amount?: number;
          fee_due_date?: string;
          id: string;
          joining_date?: string;
          member_id: string;
          name?: string;
          phone?: string | null;
          photo_url?: string | null;
          updated_at?: string;
        };
        Update: {
          alert_disabled?: boolean;
          attendance_override?: boolean;
          created_at?: string;
          email?: string;
          fee_amount?: number;
          fee_due_date?: string;
          id?: string;
          joining_date?: string;
          member_id?: string;
          name?: string;
          phone?: string | null;
          photo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          difficulty: string | null;
          id: string;
          image_url: string | null;
          title: string;
          video_url: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          image_url?: string | null;
          title: string;
          video_url?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: string;
          image_url?: string | null;
          title?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "member";
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const;
