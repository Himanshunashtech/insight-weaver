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
      agent_conversations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          title: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          workspace_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          workspace_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tool_calls: {
        Row: {
          conversation_id: string
          created_at: string
          error: string | null
          id: string
          input: Json
          latency_ms: number | null
          message_id: string | null
          output: Json
          status: string
          tool_name: string
          workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          message_id?: string | null
          output?: Json
          status?: string
          tool_name: string
          workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          latency_ms?: number | null
          message_id?: string | null
          output?: Json
          status?: string
          tool_name?: string
          workspace_id?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          model: string
          name: string
          system_prompt: string
          temperature: number
          tools: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          model?: string
          name: string
          system_prompt?: string
          temperature?: number
          tools?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          model?: string
          name?: string
          system_prompt?: string
          temperature?: number
          tools?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string
          hash: string
          id: string
          last_used_at: string | null
          name: string
          prefix: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          hash: string
          id?: string
          last_used_at?: string | null
          name: string
          prefix: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          hash?: string
          id?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          workspace_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          extracted: Json | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number
          status: string
          storage_path: string
          uploaded_by: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          extracted?: Json | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number
          status?: string
          storage_path: string
          uploaded_by: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          extracted?: Json | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number
          status?: string
          storage_path?: string
          uploaded_by?: string
          workspace_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          created_by: string
          enabled: boolean
          id: string
          kind: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by: string
          enabled?: boolean
          id?: string
          kind: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_audit_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          workflow_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workflow_run_steps: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          node_id: string
          node_label: string | null
          node_type: string
          output: Json
          run_id: string
          started_at: string
          status: Database["public"]["Enums"]["run_status"]
          step_order: number
          workspace_id: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          node_id: string
          node_label?: string | null
          node_type: string
          output?: Json
          run_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          step_order?: number
          workspace_id: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          node_id?: string
          node_label?: string | null
          node_type?: string
          output?: Json
          run_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["run_status"]
          step_order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_run_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          output: Json
          started_at: string
          started_by: string
          status: Database["public"]["Enums"]["run_status"]
          trigger: string
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          output?: Json
          started_at?: string
          started_by: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger?: string
          workflow_id: string
          workspace_id: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          output?: Json
          started_at?: string
          started_by?: string
          status?: Database["public"]["Enums"]["run_status"]
          trigger?: string
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workflow_webhooks_log: {
        Row: {
          created_at: string
          headers: Json
          id: string
          ip: string | null
          payload: Json
          run_id: string | null
          signature_valid: boolean
          workflow_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          headers?: Json
          id?: string
          ip?: string | null
          payload?: Json
          run_id?: string | null
          signature_valid?: boolean
          workflow_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          headers?: Json
          id?: string
          ip?: string | null
          payload?: Json
          run_id?: string | null
          signature_valid?: boolean
          workflow_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          graph: Json
          id: string
          name: string
          schedule: string | null
          schedule_timezone: string
          status: Database["public"]["Enums"]["workflow_status"]
          tags: string[]
          trigger_type: Database["public"]["Enums"]["workflow_trigger"]
          updated_at: string
          webhook_path: string | null
          webhook_secret: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          graph?: Json
          id?: string
          name: string
          schedule?: string | null
          schedule_timezone?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          tags?: string[]
          trigger_type?: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          webhook_path?: string | null
          webhook_secret?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          graph?: Json
          id?: string
          name?: string
          schedule?: string | null
          schedule_timezone?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          tags?: string[]
          trigger_type?: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          webhook_path?: string | null
          webhook_secret?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      rotate_workflow_webhook: {
        Args: { _workflow_id: string }
        Returns: {
          webhook_path: string
          webhook_secret: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      run_status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      workflow_status: "draft" | "active" | "paused" | "archived"
      workflow_trigger: "manual" | "webhook" | "schedule"
      workspace_role: "owner" | "admin" | "builder" | "viewer"
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
      app_role: ["admin", "user"],
      run_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      workflow_status: ["draft", "active", "paused", "archived"],
      workflow_trigger: ["manual", "webhook", "schedule"],
      workspace_role: ["owner", "admin", "builder", "viewer"],
    },
  },
} as const
