export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          category: string | null
          points_required: number | null
          streak_required: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          category?: string | null
          points_required?: number | null
          streak_required?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          category?: string | null
          points_required?: number | null
          streak_required?: number | null
          created_at?: string
        }
      }
      exercise_completions: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          series_assignment_id: string | null
          week_number: number | null
          completed_date: string
          completed_at: string
          points_awarded: number
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          series_assignment_id?: string | null
          week_number?: number | null
          completed_date: string
          completed_at?: string
          points_awarded?: number
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          series_assignment_id?: string | null
          week_number?: number | null
          completed_date?: string
          completed_at?: string
          points_awarded?: number
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          description: string | null
          video_url: string | null
          instructions: string | null
          equipment_needed: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description?: string | null
          video_url?: string | null
          instructions?: string | null
          equipment_needed?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string | null
          video_url?: string | null
          instructions?: string | null
          equipment_needed?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      fms_scores: {
        Row: {
          id: string
          user_id: string
          assessed_by: string
          assessed_date: string
          deep_squat: number
          hurdle_step_left: number
          hurdle_step_right: number
          inline_lunge_left: number
          inline_lunge_right: number
          shoulder_mobility_left: number
          shoulder_mobility_right: number
          leg_raise_left: number
          leg_raise_right: number
          trunk_stability: number
          rotary_stability_left: number
          rotary_stability_right: number
          total_score: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessed_by: string
          assessed_date: string
          deep_squat: number
          hurdle_step_left: number
          hurdle_step_right: number
          inline_lunge_left: number
          inline_lunge_right: number
          shoulder_mobility_left: number
          shoulder_mobility_right: number
          leg_raise_left: number
          leg_raise_right: number
          trunk_stability: number
          rotary_stability_left: number
          rotary_stability_right: number
          total_score: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessed_by?: string
          assessed_date?: string
          deep_squat?: number
          hurdle_step_left?: number
          hurdle_step_right?: number
          inline_lunge_left?: number
          inline_lunge_right?: number
          shoulder_mobility_left?: number
          shoulder_mobility_right?: number
          leg_raise_left?: number
          leg_raise_right?: number
          trunk_stability?: number
          rotary_stability_left?: number
          rotary_stability_right?: number
          total_score?: number
          notes?: string | null
          created_at?: string
        }
      }
      series: {
        Row: {
          id: string
          name: string
          description: string | null
          target_areas: string[] | null
          target_area: string | null
          difficulty_level: string | null
          series_type: 'rehab' | 'strength_conditioning' | null
          days_per_week: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          target_areas?: string[] | null
          target_area?: string | null
          difficulty_level?: string | null
          series_type?: 'rehab' | 'strength_conditioning' | null
          days_per_week?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          target_areas?: string[] | null
          target_area?: string | null
          difficulty_level?: string | null
          series_type?: 'rehab' | 'strength_conditioning' | null
          days_per_week?: number | null
          created_at?: string
        }
      }
      series_assignments: {
        Row: {
          id: string
          user_id: string
          series_id: string
          start_date: string
          end_date: string
          current_week: number
          completion_percentage: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          series_id: string
          start_date: string
          end_date: string
          current_week?: number
          completion_percentage?: number
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          series_id?: string
          start_date?: string
          end_date?: string
          current_week?: number
          completion_percentage?: number
          completed?: boolean
          created_at?: string
        }
      }
      series_exercises: {
        Row: {
          id: string
          series_id: string
          exercise_id: string
          week_number: number
          day_number: number | null
          sets: number
          reps: number | null
          duration_seconds: number | null
          order_index: number
        }
        Insert: {
          id?: string
          series_id: string
          exercise_id: string
          week_number: number
          day_number?: number | null
          sets?: number
          reps?: number | null
          duration_seconds?: number | null
          order_index?: number
        }
        Update: {
          id?: string
          series_id?: string
          exercise_id?: string
          week_number?: number
          day_number?: number | null
          sets?: number
          reps?: number | null
          duration_seconds?: number | null
          order_index?: number
        }
      }
      stations: {
        Row: {
          id: string
          name: string
          city: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          state?: string | null
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      injuries: {
        Row: {
          id: string
          user_id: string
          injury_type: string
          body_location: string
          injury_date: string
          days_out: number
          return_date: string | null
          fms_score_at_time: number | null
          followed_protocol: boolean
          severity: 'minor' | 'moderate' | 'severe' | null
          cost_impact: number | null
          status: 'active' | 'closed' | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          injury_type: string
          body_location: string
          injury_date: string
          days_out?: number
          return_date?: string | null
          fms_score_at_time?: number | null
          followed_protocol?: boolean
          severity?: 'minor' | 'moderate' | 'severe' | null
          cost_impact?: number | null
          status?: 'active' | 'closed' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          injury_type?: string
          body_location?: string
          injury_date?: string
          days_out?: number
          return_date?: string | null
          fms_score_at_time?: number | null
          followed_protocol?: boolean
          severity?: 'minor' | 'moderate' | 'severe' | null
          cost_impact?: number | null
          status?: 'active' | 'closed' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'firefighter' | 'chief' | 'admin' | 'clinic'
          badge_number: string | null
          station_id: string | null
          points: number
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'firefighter' | 'chief' | 'admin' | 'pt'
          badge_number?: string | null
          station_id?: string | null
          points?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'firefighter' | 'chief' | 'admin' | 'pt'
          badge_number?: string | null
          station_id?: string | null
          points?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}