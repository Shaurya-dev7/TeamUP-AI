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
      admin_roles: {
        Row: {
          user_id: string
          role: 'super_admin' | 'admin' | 'moderator'
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          user_id: string
          role: 'super_admin' | 'admin' | 'moderator'
          granted_at?: string
          granted_by?: string | null
        }
        Update: {
          user_id?: string
          role?: 'super_admin' | 'admin' | 'moderator'
          granted_at?: string
          granted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_audit_logs: {
        Row: {
          id: number
          admin_user_id: string
          action: string
          target_table: string | null
          target_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          admin_user_id: string
          action: string
          target_table?: string | null
          target_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          admin_user_id?: string
          action?: string
          target_table?: string | null
          target_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      system_flags: {
        Row: {
          key: string
          value: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          key?: string
          value?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_members: {
        Row: {
          chat_id: string
          joined_at: string
          profile_id: string
          role: string | null
        }
        Insert: {
          chat_id: string
          joined_at?: string
          profile_id: string
          role?: string | null
        }
        Update: {
          chat_id?: string
          joined_at?: string
          profile_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          title?: string | null
        }
        Relationships: []
      }
      educations: {
        Row: {
          created_at: string
          degree: string | null
          end_year: number | null
          field_of_study: string | null
          id: number
          profile_id: string
          school: string
          start_year: number | null
        }
        Insert: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: number
          profile_id: string
          school: string
          start_year?: number | null
        }
        Update: {
          created_at?: string
          degree?: string | null
          end_year?: number | null
          field_of_study?: string | null
          id?: number
          profile_id?: string
          school?: string
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "educations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      profile_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          query: string | null
          target_profile_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: number
          query?: string | null
          target_profile_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: number
          query?: string | null
          target_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_events_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          created_at: string
          interest_id: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          interest_id: number
          profile_id: string
        }
        Update: {
          created_at?: string
          interest_id?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          created_at: string
          profile_id: string
          skill_id: number
        }
        Insert: {
          created_at?: string
          profile_id: string
          skill_id: number
        }
        Update: {
          created_at?: string
          profile_id?: string
          skill_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          username: string
          name: string | null
          age: number | null
          gender: string | null
          college: string | null
          hostel_city: string | null
          location: string | null
          skills: string | null
          rating: number | null
          workscore: number | null
          feedback_score: number | null
          reviews_count: number | null
          hackathons_participated: number | null
          projects_completed: number | null
          badges: string | null
          achievements: string | null
          forum_posts: number | null
          events_participated: number | null
          teams_joined: number | null
          saved_projects: number | null
          last_active_days: number | null
          profile_completed: boolean | null
          suspended: string | null
          last_active_at: string | null
          created_at: string
          updated_at: string
          // OAuth metadata
          auth_provider: string | null
          provider_id: string | null
          google_email: string | null
          github_username: string | null
          email: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          username: string
          name?: string | null
          age?: number | null
          gender?: string | null
          college?: string | null
          hostel_city?: string | null
          location?: string | null
          skills?: string | null
          rating?: number | null
          workscore?: number | null
          feedback_score?: number | null
          reviews_count?: number | null
          hackathons_participated?: number | null
          projects_completed?: number | null
          badges?: string | null
          achievements?: string | null
          forum_posts?: number | null
          events_participated?: number | null
          teams_joined?: number | null
          saved_projects?: number | null
          last_active_days?: number | null
          profile_completed?: boolean | null
          suspended?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
          // OAuth metadata
          auth_provider?: string | null
          provider_id?: string | null
          google_email?: string | null
          github_username?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          username?: string
          name?: string | null
          age?: number | null
          gender?: string | null
          college?: string | null
          hostel_city?: string | null
          location?: string | null
          skills?: string | null
          rating?: number | null
          workscore?: number | null
          feedback_score?: number | null
          reviews_count?: number | null
          hackathons_participated?: number | null
          projects_completed?: number | null
          badges?: string | null
          achievements?: string | null
          forum_posts?: number | null
          events_participated?: number | null
          teams_joined?: number | null
          saved_projects?: number | null
          last_active_days?: number | null
          profile_completed?: boolean | null
          suspended?: string | null
          last_active_at?: string | null
          created_at?: string
          updated_at?: string
          // OAuth metadata
          auth_provider?: string | null
          provider_id?: string | null
          google_email?: string | null
          github_username?: string | null
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      workplaces: {
        Row: {
          company: string
          created_at: string
          end_date: string | null
          id: number
          profile_id: string
          start_date: string | null
          title: string | null
        }
        Insert: {
          company: string
          created_at?: string
          end_date?: string | null
          id?: number
          profile_id: string
          start_date?: string | null
          title?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          end_date?: string | null
          id?: number
          profile_id?: string
          start_date?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workplaces_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_id: string
          title: string
          description: string | null
          language: string
          certificate_available: boolean
          platform: string
          redirect_url: string
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          course_id: string
          title: string
          description?: string | null
          language: string
          certificate_available: boolean
          platform: string
          redirect_url: string
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          title?: string
          description?: string | null
          language?: string
          certificate_available?: boolean
          platform?: string
          redirect_url?: string
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_clicks: {
        Row: {
          id: number
          course_id: string
          source_page: string
          clicked_at: string
        }
        Insert: {
          id?: number
          course_id: string
          source_page: string
          clicked_at?: string
        }
        Update: {
          id?: number
          course_id?: string
          source_page?: string
          clicked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_clicks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          }
        ]
      }
      category_clicks: {
        Row: {
          id: number
          category_name: string
          clicked_at: string
        }
        Insert: {
          id?: number
          category_name: string
          clicked_at?: string
        }
        Update: {
          id?: number
          category_name?: string
          clicked_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: number
          name: string
          description: string | null
          goal: string | null
          max_members: number
          is_private: boolean
          status: 'active' | 'archived' | 'deleted'
          conversation_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          goal?: string | null
          max_members?: number
          is_private?: boolean
          status?: 'active' | 'archived' | 'deleted'
          conversation_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          goal?: string | null
          max_members?: number
          is_private?: boolean
          status?: 'active' | 'archived' | 'deleted'
          conversation_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: number
          user_id: string
          role: 'leader' | 'co_leader' | 'member'
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: number
          user_id: string
          role?: 'leader' | 'co_leader' | 'member'
          joined_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: number
          user_id?: string
          role?: 'leader' | 'co_leader' | 'member'
          joined_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      team_roles_needed: {
        Row: {
          id: string
          team_id: number
          role_name: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: number
          role_name: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: number
          role_name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_roles_needed_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      team_join_requests: {
        Row: {
          id: string
          team_id: number
          user_id: string
          message: string | null
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          responded_at: string | null
          responded_by: string | null
        }
        Insert: {
          id?: string
          team_id: number
          user_id: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          responded_at?: string | null
          responded_by?: string | null
        }
        Update: {
          id?: string
          team_id?: number
          user_id?: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          responded_at?: string | null
          responded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      team_invites: {
        Row: {
          id: string
          team_id: number
          invited_user_id: string
          invited_by: string
          message: string | null
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at: string
          expires_at: string | null
          responded_at: string | null
        }
        Insert: {
          id?: string
          team_id: number
          invited_user_id: string
          invited_by: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string | null
          responded_at?: string | null
        }
        Update: {
          id?: string
          team_id?: number
          invited_user_id?: string
          invited_by?: string
          message?: string | null
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          created_at?: string
          expires_at?: string | null
          responded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      hackathons: {
        Row: {
            id: string
            external_source: string
            external_id: string
            title: string
            description: string | null
            start_date: string | null
            end_date: string | null
            mode: string | null
            location: string | null
            platform: string | null
            url: string | null
            image: string | null
            cash_prize: number | null
            prize_text: string | null
            is_featured: boolean
            is_active: boolean
            clicks: number
            views: number
            created_at: string
            updated_at: string
            last_synced_at: string | null
        }
        Insert: {
            id?: string
            external_source: string
            external_id: string
            title: string
            description?: string | null
            start_date?: string | null
            end_date?: string | null
            mode?: string | null
            location?: string | null
            platform?: string | null
            url?: string | null
            image?: string | null
            cash_prize?: number | null
            prize_text?: string | null
            is_featured?: boolean
            is_active?: boolean
            clicks?: number
            views?: number
            created_at?: string
            updated_at?: string
            last_synced_at?: string | null
        }
        Update: {
            id?: string
            external_source?: string
            external_id?: string
            title?: string
            description?: string | null
            start_date?: string | null
            end_date?: string | null
            mode?: string | null
            location?: string | null
            platform?: string | null
            url?: string | null
            image?: string | null
            cash_prize?: number | null
            prize_text?: string | null
            is_featured?: boolean
            is_active?: boolean
            clicks?: number
            views?: number
            created_at?: string
            updated_at?: string
            last_synced_at?: string | null
        }
        Relationships: []
      }
      chat_starter_templates: {
        Row: {
          id: string
          context: string
          content: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          context: string
          content: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          context?: string
          content?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      voice_note_settings: {
        Row: {
          id: string
          enabled: boolean
          cooldown_seconds: number
          max_requests_per_minute: number
          updated_at: string
        }
        Insert: {
          id?: string
          enabled?: boolean
          cooldown_seconds?: number
          max_requests_per_minute?: number
          updated_at?: string
        }
        Update: {
          id?: string
          enabled?: boolean
          cooldown_seconds?: number
          max_requests_per_minute?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recommend_profiles: {
        Args: { p_limit?: number; p_profile_id: string }
        Returns: {
          display_name: string
          id: string
          score: number
          username: string
        }[]
      }
      search_profiles: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          bio: string
          display_name: string
          id: string
          match_score: number
          username: string
        }[]
      }
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