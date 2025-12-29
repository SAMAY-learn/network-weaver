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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      case_suspects: {
        Row: {
          case_id: string
          id: string
          role: string | null
          suspect_id: string
        }
        Insert: {
          case_id: string
          id?: string
          role?: string | null
          suspect_id: string
        }
        Update: {
          case_id?: string
          id?: string
          role?: string | null
          suspect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_suspects_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_suspects_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          cluster_id: string | null
          created_at: string
          description: string | null
          fraud_amount: number | null
          id: string
          location: string | null
          reported_date: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          title: string
          updated_at: string
          victim_count: number | null
        }
        Insert: {
          case_number: string
          cluster_id?: string | null
          created_at?: string
          description?: string | null
          fraud_amount?: number | null
          id?: string
          location?: string | null
          reported_date?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title: string
          updated_at?: string
          victim_count?: number | null
        }
        Update: {
          case_number?: string
          cluster_id?: string | null
          created_at?: string
          description?: string | null
          fraud_amount?: number | null
          id?: string
          location?: string | null
          reported_date?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title?: string
          updated_at?: string
          victim_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "fraud_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_members: {
        Row: {
          cluster_id: string
          id: string
          joined_at: string | null
          role: string | null
          suspect_id: string
        }
        Insert: {
          cluster_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          suspect_id: string
        }
        Update: {
          cluster_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          suspect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "fraud_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_members_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_model: string | null
          id: string
          imei: string
          is_active: boolean | null
          last_location: string | null
          suspect_id: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_model?: string | null
          id?: string
          imei: string
          is_active?: boolean | null
          last_location?: string | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_model?: string | null
          id?: string
          imei?: string
          is_active?: boolean | null
          last_location?: string | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_clusters: {
        Row: {
          created_at: string
          estimated_fraud_amount: number | null
          id: string
          name: string
          notes: string | null
          primary_location: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_fraud_amount?: number | null
          id?: string
          name: string
          notes?: string | null
          primary_location?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_fraud_amount?: number | null
          id?: string
          name?: string
          notes?: string | null
          primary_location?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Relationships: []
      }
      ip_addresses: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          is_vpn: boolean | null
          isp: string | null
          location: string | null
          suspect_id: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          is_vpn?: boolean | null
          isp?: string | null
          location?: string | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          is_vpn?: boolean | null
          isp?: string | null
          location?: string | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_addresses_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      mule_accounts: {
        Row: {
          account_holder: string | null
          account_number: string
          bank_name: string | null
          created_at: string
          id: string
          ifsc_code: string | null
          is_frozen: boolean | null
          suspect_id: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          total_transactions: number | null
          updated_at: string
        }
        Insert: {
          account_holder?: string | null
          account_number: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_frozen?: boolean | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          total_transactions?: number | null
          updated_at?: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string
          bank_name?: string | null
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_frozen?: boolean | null
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          total_transactions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mule_accounts_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      network_edges: {
        Row: {
          created_at: string
          edge_type: Database["public"]["Enums"]["edge_type"]
          id: string
          metadata: Json | null
          source_id: string
          source_type: Database["public"]["Enums"]["node_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["node_type"]
          weight: number | null
        }
        Insert: {
          created_at?: string
          edge_type: Database["public"]["Enums"]["edge_type"]
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: Database["public"]["Enums"]["node_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["node_type"]
          weight?: number | null
        }
        Update: {
          created_at?: string
          edge_type?: Database["public"]["Enums"]["edge_type"]
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: Database["public"]["Enums"]["node_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["node_type"]
          weight?: number | null
        }
        Relationships: []
      }
      sim_cards: {
        Row: {
          created_at: string
          id: string
          imsi: string | null
          is_active: boolean | null
          location: string | null
          phone_number: string
          suspect_id: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          imsi?: string | null
          is_active?: boolean | null
          location?: string | null
          phone_number: string
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          imsi?: string | null
          is_active?: boolean | null
          location?: string | null
          phone_number?: string
          suspect_id?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sim_cards_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      suspects: {
        Row: {
          alias: string | null
          created_at: string
          fraud_amount: number | null
          id: string
          last_active: string | null
          location: string | null
          name: string
          notes: string | null
          threat_level: Database["public"]["Enums"]["threat_level"] | null
          threat_score: number | null
          updated_at: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          fraud_amount?: number | null
          id?: string
          last_active?: string | null
          location?: string | null
          name: string
          notes?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          threat_score?: number | null
          updated_at?: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          fraud_amount?: number | null
          id?: string
          last_active?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"] | null
          threat_score?: number | null
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
      case_status: "active" | "monitoring" | "contained" | "closed"
      edge_type: "call" | "transaction" | "shared_device" | "shared_ip"
      node_type: "suspect" | "sim" | "device" | "account" | "ip"
      threat_level: "high" | "medium" | "low"
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
      case_status: ["active", "monitoring", "contained", "closed"],
      edge_type: ["call", "transaction", "shared_device", "shared_ip"],
      node_type: ["suspect", "sim", "device", "account", "ip"],
      threat_level: ["high", "medium", "low"],
    },
  },
} as const
