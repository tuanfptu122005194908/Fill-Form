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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      form_history: {
        Row: {
          error_message: string | null
          form_url: string | null
          history_id: number
          ip_address: string | null
          ran_at: string
          status: Database["public"]["Enums"]["history_status"]
          tool_name: string | null
          txn_id: number | null
          user_id: number
        }
        Insert: {
          error_message?: string | null
          form_url?: string | null
          history_id?: number
          ip_address?: string | null
          ran_at?: string
          status?: Database["public"]["Enums"]["history_status"]
          tool_name?: string | null
          txn_id?: number | null
          user_id: number
        }
        Update: {
          error_message?: string | null
          form_url?: string | null
          history_id?: number
          ip_address?: string | null
          ran_at?: string
          status?: Database["public"]["Enums"]["history_status"]
          tool_name?: string | null
          txn_id?: number | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_history_txn_id_fkey"
            columns: ["txn_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["txn_id"]
          },
          {
            foreignKeyName: "form_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_vnd: number
          created_at: string
          forms_to_add: number
          note: string | null
          order_id: number
          status: Database["public"]["Enums"]["order_status"]
          transfer_content: string
          updated_at: string
          user_id: number
        }
        Insert: {
          amount_vnd: number
          created_at?: string
          forms_to_add: number
          note?: string | null
          order_id?: number
          status?: Database["public"]["Enums"]["order_status"]
          transfer_content: string
          updated_at?: string
          user_id: number
        }
        Update: {
          amount_vnd?: number
          created_at?: string
          forms_to_add?: number
          note?: string | null
          order_id?: number
          status?: Database["public"]["Enums"]["order_status"]
          transfer_content?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_vnd: number
          bank_account_name: string
          bank_account_no: string
          bank_name: string
          confirmed_at: string | null
          confirmed_by: number | null
          created_at: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: number
          paid_at: string | null
          payment_id: number
          qr_code_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transfer_content: string
        }
        Insert: {
          amount_vnd: number
          bank_account_name: string
          bank_account_no: string
          bank_name: string
          confirmed_at?: string | null
          confirmed_by?: number | null
          created_at?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id: number
          paid_at?: string | null
          payment_id?: number
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_content: string
        }
        Update: {
          amount_vnd?: number
          bank_account_name?: string
          bank_account_no?: string
          bank_name?: string
          confirmed_at?: string | null
          confirmed_by?: number | null
          created_at?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: number
          paid_at?: string | null
          payment_id?: number
          qr_code_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transfer_content?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          order_id: number | null
          txn_id: number
          type: Database["public"]["Enums"]["txn_type"]
          user_id: number
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          order_id?: number | null
          txn_id?: number
          type: Database["public"]["Enums"]["txn_type"]
          user_id: number
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          order_id?: number | null
          txn_id?: number
          type?: Database["public"]["Enums"]["txn_type"]
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profile: {
        Row: {
          avatar_url: string | null
          full_name: string
          phone: string | null
          profile_id: number
          updated_at: string
          user_id: number
        }
        Insert: {
          avatar_url?: string | null
          full_name: string
          phone?: string | null
          profile_id?: number
          updated_at?: string
          user_id: number
        }
        Update: {
          avatar_url?: string | null
          full_name?: string
          phone?: string | null
          profile_id?: number
          updated_at?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_wallet: {
        Row: {
          form_balance: number
          last_updated: string
          total_forms_added: number
          total_forms_used: number
          user_id: number
          wallet_id: number
        }
        Insert: {
          form_balance?: number
          last_updated?: string
          total_forms_added?: number
          total_forms_used?: number
          user_id: number
          wallet_id?: number
        }
        Update: {
          form_balance?: number
          last_updated?: string
          total_forms_added?: number
          total_forms_used?: number
          user_id?: number
          wallet_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_wallet_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          password_hash: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          email: string
          password_hash: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: number
        }
        Update: {
          created_at?: string
          email?: string
          password_hash?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: number
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
      history_status: "success" | "failed" | "blocked"
      order_status: "pending" | "approved" | "rejected" | "cancelled"
      payment_method: "manual" | "auto"
      payment_status: "pending" | "paid" | "confirmed" | "failed"
      txn_type: "credit" | "debit"
      user_role: "USER" | "ADMIN"
      user_status: "active" | "blocked"
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
      history_status: ["success", "failed", "blocked"],
      order_status: ["pending", "approved", "rejected", "cancelled"],
      payment_method: ["manual", "auto"],
      payment_status: ["pending", "paid", "confirmed", "failed"],
      txn_type: ["credit", "debit"],
      user_role: ["USER", "ADMIN"],
      user_status: ["active", "blocked"],
    },
  },
} as const
