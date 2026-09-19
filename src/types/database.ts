/**
 * Hand-written to match supabase/migrations/0001_init.sql. Once the project
 * is linked to a real Supabase instance, regenerate with:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 * (re-add the AiMode/AiProvider/etc. unions afterward, codegen won't emit them).
 */

export type PlanTier = 'free' | 'paid';
export type GroupRole = 'admin' | 'member';
export type ProofType = 'text' | 'link' | 'photo' | 'video';
export type CommentTargetType = 'weekly_goal' | 'hundred_day_goal';
export type AiMode = 'platform_agent' | 'byo_api_key' | 'byo_endpoint';
export type AiProvider = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          signature_color: string;
          avatar_url: string | null;
          plan_tier: PlanTier;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          signature_color?: string;
          avatar_url?: string | null;
          plan_tier?: PlanTier;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          plan_tier: PlanTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          plan_tier?: PlanTier;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['groups']['Insert']>;
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['group_members']['Insert']>;
      };
      seasons: {
        Row: {
          id: string;
          group_id: string;
          start_date: string;
          end_date: string;
          week_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          start_date: string;
          end_date: string;
          week_count: number;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>;
      };
      hundred_day_goals: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          goal_number: number;
          text: string;
          reward_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          goal_number: number;
          text: string;
          reward_text?: string | null;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['hundred_day_goals']['Insert']>;
      };
      hundred_day_progress: {
        Row: {
          hundred_day_goal_id: string;
          week_number: number;
          completed: boolean;
        };
        Insert: {
          hundred_day_goal_id: string;
          week_number: number;
          completed?: boolean;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['hundred_day_progress']['Insert']>;
      };
      weeks: {
        Row: {
          id: string;
          season_id: string;
          week_number: number;
          week_start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          week_number: number;
          week_start_date: string;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['weeks']['Insert']>;
      };
      weekly_goals: {
        Row: {
          id: string;
          week_id: string;
          user_id: string;
          goal_number: number;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_id: string;
          user_id: string;
          goal_number: number;
          text: string;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['weekly_goals']['Insert']>;
      };
      daily_checkins: {
        Row: {
          id: string;
          weekly_goal_id: string;
          day_of_week: number;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          weekly_goal_id: string;
          day_of_week: number;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['daily_checkins']['Insert']>;
      };
      proofs: {
        Row: {
          id: string;
          weekly_goal_id: string;
          type: ProofType;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          weekly_goal_id: string;
          type: ProofType;
          content: string;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['proofs']['Insert']>;
      };
      comments: {
        Row: {
          id: string;
          target_type: CommentTargetType;
          target_id: string;
          author_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: CommentTargetType;
          target_id: string;
          author_id: string;
          body: string;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
      };
      ai_settings: {
        Row: {
          user_id: string;
          mode: AiMode;
          provider: AiProvider | null;
          encrypted_api_key: string | null;
          custom_endpoint_url: string | null;
          enabled_features: Record<string, boolean>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mode?: AiMode;
          provider?: AiProvider | null;
          encrypted_api_key?: string | null;
          custom_endpoint_url?: string | null;
          enabled_features?: Record<string, boolean>;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['ai_settings']['Insert']>;
      };
      notification_prefs: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          email_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
        };
        Relationships: [];
        Update: Partial<Database['public']['Tables']['notification_prefs']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_group_by_code: {
        Args: { p_invite_code: string };
        Returns: string;
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type Season = Database['public']['Tables']['seasons']['Row'];
export type HundredDayGoal = Database['public']['Tables']['hundred_day_goals']['Row'];
export type HundredDayProgress = Database['public']['Tables']['hundred_day_progress']['Row'];
export type Week = Database['public']['Tables']['weeks']['Row'];
export type WeeklyGoal = Database['public']['Tables']['weekly_goals']['Row'];
export type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
export type Proof = Database['public']['Tables']['proofs']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type AiSettings = Database['public']['Tables']['ai_settings']['Row'];
export type NotificationPrefs = Database['public']['Tables']['notification_prefs']['Row'];
