// Generated from the Supabase schema (MCP generate_typescript_types). Do not edit by hand;
// regenerate after every migration.

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
      ai_recommendations: {
        Row: {
          college_id: string
          generated_at: string
          id: string
          match_score: number
          program_id: string
          reasons: Json
          student_id: string
        }
        Insert: {
          college_id: string
          generated_at?: string
          id?: string
          match_score: number
          program_id: string
          reasons?: Json
          student_id: string
        }
        Update: {
          college_id?: string
          generated_at?: string
          id?: string
          match_score?: number
          program_id?: string
          reasons?: Json
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_scores: {
        Row: {
          application_id: string
          breakdown: Json
          enrollment_likelihood: number
          explanation: string | null
          fit_score: number
          generated_at: string
          id: string
        }
        Insert: {
          application_id: string
          breakdown?: Json
          enrollment_likelihood: number
          explanation?: string | null
          fit_score: number
          generated_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          breakdown?: Json
          enrollment_likelihood?: number
          explanation?: string | null
          fit_score?: number
          generated_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_scores_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          college_id: string
          created_at: string
          decided_at: string | null
          decision_message: string | null
          essay: string | null
          final_program_id: string | null
          id: string
          program_id: string
          second_program_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          decided_at?: string | null
          decision_message?: string | null
          essay?: string | null
          final_program_id?: string | null
          id?: string
          program_id: string
          second_program_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          decided_at?: string | null
          decision_message?: string | null
          essay?: string | null
          final_program_id?: string | null
          id?: string
          program_id?: string
          second_program_id?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_final_program_id_fkey"
            columns: ["final_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_second_program_id_fkey"
            columns: ["second_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          city: string | null
          created_at: string
          description: string
          id: string
          logo_path: string | null
          media_paths: string[]
          name: string
          profile_status: Database["public"]["Enums"]["publish_status"]
          province: string | null
          region: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_path?: string | null
          media_paths?: string[]
          name: string
          profile_status?: Database["public"]["Enums"]["publish_status"]
          province?: string | null
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_path?: string | null
          media_paths?: string[]
          name?: string
          profile_status?: Database["public"]["Enums"]["publish_status"]
          province?: string | null
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          label: string
          mime_type: string
          owner_id: string
          requirement_id: string | null
          review_notes: string | null
          review_status: Database["public"]["Enums"]["review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          size_bytes: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          label: string
          mime_type: string
          owner_id?: string
          requirement_id?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          label?: string
          mime_type?: string
          owner_id?: string
          requirement_id?: string | null
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          size_bytes?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          college_id: string
          created_at: string
          student_id: string
        }
        Insert: {
          college_id: string
          created_at?: string
          student_id: string
        }
        Update: {
          college_id?: string
          created_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_path: string | null
          body: string
          created_at: string
          id: string
          read_at: string | null
          scan_status: Database["public"]["Enums"]["scan_status"] | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          scan_status?: Database["public"]["Enums"]["scan_status"] | null
          sender_id?: string
          thread_id: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          scan_status?: Database["public"]["Enums"]["scan_status"] | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          applications_open: boolean
          featured_college_ids: string[]
          id: boolean
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          applications_open?: boolean
          featured_college_ids?: string[]
          id?: boolean
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          applications_open?: boolean
          featured_college_ids?: string[]
          id?: boolean
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          body: string
          college_id: string
          created_at: string
          event_at: string | null
          id: string
          media_path: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["publish_status"]
          title: string
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          college_id: string
          created_at?: string
          event_at?: string | null
          id?: string
          media_path?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          title: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          college_id?: string
          created_at?: string
          event_at?: string | null
          id?: string
          media_path?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          college_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notification_prefs: Json
          push_enabled: boolean
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          college_id?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          notification_prefs?: Json
          push_enabled?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          college_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notification_prefs?: Json
          push_enabled?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          college_id: string
          created_at: string
          deadline: string | null
          degree: string | null
          description: string
          essay_prompt: string | null
          id: string
          is_open: boolean
          min_gpa: number | null
          name: string
          prerequisites: string | null
          slots: number | null
          strands: string[]
          tuition_per_year: number | null
          updated_at: string
        }
        Insert: {
          college_id: string
          created_at?: string
          deadline?: string | null
          degree?: string | null
          description?: string
          essay_prompt?: string | null
          id?: string
          is_open?: boolean
          min_gpa?: number | null
          name: string
          prerequisites?: string | null
          slots?: number | null
          strands?: string[]
          tuition_per_year?: number | null
          updated_at?: string
        }
        Update: {
          college_id?: string
          created_at?: string
          deadline?: string | null
          degree?: string | null
          description?: string
          essay_prompt?: string | null
          id?: string
          is_open?: boolean
          min_gpa?: number | null
          name?: string
          prerequisites?: string | null
          slots?: number | null
          strands?: string[]
          tuition_per_year?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          platform: Database["public"]["Enums"]["device_platform"]
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          platform: Database["public"]["Enums"]["device_platform"]
          token: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          platform?: Database["public"]["Enums"]["device_platform"]
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          college_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          kind: Database["public"]["Enums"]["requirement_kind"]
          label: string
          program_id: string | null
          sort_order: number
        }
        Insert: {
          college_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          kind?: Database["public"]["Enums"]["requirement_kind"]
          label: string
          program_id?: string | null
          sort_order?: number
        }
        Update: {
          college_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          kind?: Database["public"]["Enums"]["requirement_kind"]
          label?: string
          program_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "requirements_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: Json
          career_goals: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          gpa: number | null
          interests: string[]
          last_name: string
          middle_name: string | null
          mobile: string | null
          parents: Json
          preferred_locations: string[]
          profile_complete: boolean
          senior_high_school: string | null
          sex: Database["public"]["Enums"]["sex"] | null
          strand: string | null
          target_majors: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json
          career_goals?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          gpa?: number | null
          interests?: string[]
          last_name?: string
          middle_name?: string | null
          mobile?: string | null
          parents?: Json
          preferred_locations?: string[]
          profile_complete?: boolean
          senior_high_school?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          strand?: string | null
          target_majors?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json
          career_goals?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          gpa?: number | null
          interests?: string[]
          last_name?: string
          middle_name?: string | null
          mobile?: string | null
          parents?: Json
          preferred_locations?: string[]
          profile_complete?: boolean
          senior_high_school?: string | null
          sex?: Database["public"]["Enums"]["sex"] | null
          strand?: string | null
          target_majors?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          admin_id: string | null
          college_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at: string
          student_id: string | null
          subject: string | null
        }
        Insert: {
          admin_id?: string | null
          college_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string
          student_id?: string | null
          subject?: string | null
        }
        Update: {
          admin_id?: string | null
          college_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["thread_kind"]
          last_message_at?: string
          student_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_broadcast: {
        Args: { p_audience?: string; p_body: string; p_title: string }
        Returns: number
      }
      admin_rls_overview: {
        Args: never
        Returns: {
          policies: string[]
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      admin_stats: { Args: never; Returns: Json }
      my_threads: {
        Args: never
        Returns: {
          college_id: string
          college_logo_path: string
          college_name: string
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message: string
          last_message_at: string
          last_sender_id: string
          student_id: string
          student_name: string
          subject: string
          unread_count: number
        }[]
      }
      register_push_token: {
        Args: {
          p_platform: Database["public"]["Enums"]["device_platform"]
          p_token: string
        }
        Returns: undefined
      }
      start_thread: {
        Args: {
          p_admin_id?: string
          p_college_id?: string
          p_student_id?: string
          p_subject?: string
        }
        Returns: {
          admin_id: string | null
          college_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["thread_kind"]
          last_message_at: string
          student_id: string | null
          subject: string | null
        }
        SetofOptions: {
          from: "*"
          to: "threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_application: {
        Args: { p_application_id: string }
        Returns: {
          college_id: string
          created_at: string
          decided_at: string | null
          decision_message: string | null
          essay: string | null
          final_program_id: string | null
          id: string
          program_id: string
          second_program_id: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "accepted"
        | "action_required"
        | "rejected"
      device_platform: "ios" | "android" | "web"
      post_type: "news" | "event" | "scholarship" | "deadline"
      publish_status: "draft" | "published"
      requirement_kind: "document" | "essay"
      review_status: "pending" | "approved" | "rejected" | "resubmit"
      scan_status: "pending" | "clean" | "blocked"
      sex: "male" | "female" | "other"
      thread_kind: "student_rep" | "rep_admin"
      user_role: "student" | "school_rep" | "admin"
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
      account_status: ["active", "suspended"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "accepted",
        "action_required",
        "rejected",
      ],
      device_platform: ["ios", "android", "web"],
      post_type: ["news", "event", "scholarship", "deadline"],
      publish_status: ["draft", "published"],
      requirement_kind: ["document", "essay"],
      review_status: ["pending", "approved", "rejected", "resubmit"],
      scan_status: ["pending", "clean", "blocked"],
      sex: ["male", "female", "other"],
      thread_kind: ["student_rep", "rep_admin"],
      user_role: ["student", "school_rep", "admin"],
    },
  },
} as const
