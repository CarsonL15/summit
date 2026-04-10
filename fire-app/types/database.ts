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
          type: string | null
          points_required: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          type?: string | null
          points_required?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          type?: string | null
          points_required?: number | null
          created_at?: string
        }
        Relationships: []
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
          notes: string | null
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
          notes?: string | null
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
          notes?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          name: string
          description: string | null
          instructions: string | null
          video_url: string | null
          thumbnail_url: string | null
          sets: number
          reps: number
          duration_seconds: number | null
          category: string | null
          equipment_needed: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          instructions?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          sets?: number
          reps?: number
          duration_seconds?: number | null
          category?: string | null
          equipment_needed?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          instructions?: string | null
          video_url?: string | null
          thumbnail_url?: string | null
          sets?: number
          reps?: number
          duration_seconds?: number | null
          category?: string | null
          equipment_needed?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fms_scores: {
        Row: {
          id: string
          user_id: string
          assessed_by: string
          total_score: number
          deep_squat: number | null
          hurdle_step: number | null
          inline_lunge: number | null
          shoulder_mobility: number | null
          aslr: number | null
          trunk_stability: number | null
          rotary_stability: number | null
          // Raw L/R scores (1-3, as entered before pain/clearing)
          deep_squat_raw: number | null
          hurdle_step_left: number | null
          hurdle_step_right: number | null
          inline_lunge_left: number | null
          inline_lunge_right: number | null
          shoulder_mobility_left: number | null
          shoulder_mobility_right: number | null
          aslr_left: number | null
          aslr_right: number | null
          trunk_stability_raw: number | null
          rotary_stability_left: number | null
          rotary_stability_right: number | null
          // Per-side pain flags
          deep_squat_pain_left: boolean | null
          deep_squat_pain_right: boolean | null
          hurdle_step_pain_left: boolean | null
          hurdle_step_pain_right: boolean | null
          inline_lunge_pain_left: boolean | null
          inline_lunge_pain_right: boolean | null
          shoulder_mobility_pain_left: boolean | null
          shoulder_mobility_pain_right: boolean | null
          aslr_pain_left: boolean | null
          aslr_pain_right: boolean | null
          trunk_stability_pain_left: boolean | null
          trunk_stability_pain_right: boolean | null
          rotary_stability_pain_left: boolean | null
          rotary_stability_pain_right: boolean | null
          // Clearing tests (true = pass, false = fail)
          clearing_ankle: boolean | null
          clearing_shoulder: boolean | null
          clearing_extension: boolean | null
          clearing_flexion: boolean | null
          // Mobility scores
          left_mobility_score: number | null
          right_mobility_score: number | null
          weak_areas: Json | null
          notes: string | null
          assessed_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          assessed_by: string
          total_score: number
          deep_squat?: number | null
          hurdle_step?: number | null
          inline_lunge?: number | null
          shoulder_mobility?: number | null
          aslr?: number | null
          trunk_stability?: number | null
          rotary_stability?: number | null
          deep_squat_raw?: number | null
          hurdle_step_left?: number | null
          hurdle_step_right?: number | null
          inline_lunge_left?: number | null
          inline_lunge_right?: number | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          aslr_left?: number | null
          aslr_right?: number | null
          trunk_stability_raw?: number | null
          rotary_stability_left?: number | null
          rotary_stability_right?: number | null
          deep_squat_pain_left?: boolean | null
          deep_squat_pain_right?: boolean | null
          hurdle_step_pain_left?: boolean | null
          hurdle_step_pain_right?: boolean | null
          inline_lunge_pain_left?: boolean | null
          inline_lunge_pain_right?: boolean | null
          shoulder_mobility_pain_left?: boolean | null
          shoulder_mobility_pain_right?: boolean | null
          aslr_pain_left?: boolean | null
          aslr_pain_right?: boolean | null
          trunk_stability_pain_left?: boolean | null
          trunk_stability_pain_right?: boolean | null
          rotary_stability_pain_left?: boolean | null
          rotary_stability_pain_right?: boolean | null
          clearing_ankle?: boolean | null
          clearing_shoulder?: boolean | null
          clearing_extension?: boolean | null
          clearing_flexion?: boolean | null
          left_mobility_score?: number | null
          right_mobility_score?: number | null
          weak_areas?: Json | null
          notes?: string | null
          assessed_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          assessed_by?: string
          total_score?: number
          deep_squat?: number | null
          hurdle_step?: number | null
          inline_lunge?: number | null
          shoulder_mobility?: number | null
          aslr?: number | null
          trunk_stability?: number | null
          rotary_stability?: number | null
          deep_squat_raw?: number | null
          hurdle_step_left?: number | null
          hurdle_step_right?: number | null
          inline_lunge_left?: number | null
          inline_lunge_right?: number | null
          shoulder_mobility_left?: number | null
          shoulder_mobility_right?: number | null
          aslr_left?: number | null
          aslr_right?: number | null
          trunk_stability_raw?: number | null
          rotary_stability_left?: number | null
          rotary_stability_right?: number | null
          deep_squat_pain_left?: boolean | null
          deep_squat_pain_right?: boolean | null
          hurdle_step_pain_left?: boolean | null
          hurdle_step_pain_right?: boolean | null
          inline_lunge_pain_left?: boolean | null
          inline_lunge_pain_right?: boolean | null
          shoulder_mobility_pain_left?: boolean | null
          shoulder_mobility_pain_right?: boolean | null
          aslr_pain_left?: boolean | null
          aslr_pain_right?: boolean | null
          trunk_stability_pain_left?: boolean | null
          trunk_stability_pain_right?: boolean | null
          rotary_stability_pain_left?: boolean | null
          rotary_stability_pain_right?: boolean | null
          clearing_ankle?: boolean | null
          clearing_shoulder?: boolean | null
          clearing_extension?: boolean | null
          clearing_flexion?: boolean | null
          left_mobility_score?: number | null
          right_mobility_score?: number | null
          weak_areas?: Json | null
          notes?: string | null
          assessed_date?: string
          created_at?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          id: string
          name: string
          description: string | null
          duration_weeks: number
          target_area: string | null
          difficulty_level: string | null
          series_type: 'rehab' | 'strength_conditioning' | null
          days_per_week: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration_weeks?: number
          target_area?: string | null
          difficulty_level?: string | null
          series_type?: 'rehab' | 'strength_conditioning' | null
          days_per_week?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration_weeks?: number
          target_area?: string | null
          difficulty_level?: string | null
          series_type?: 'rehab' | 'strength_conditioning' | null
          days_per_week?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_assignments: {
        Row: {
          id: string
          user_id: string
          series_id: string
          assigned_by: string | null
          fms_score_id: string | null
          start_date: string
          end_date: string
          current_week: number
          completed: boolean
          completion_percentage: number
          points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          series_id: string
          assigned_by?: string | null
          fms_score_id?: string | null
          start_date: string
          end_date: string
          current_week?: number
          completed?: boolean
          completion_percentage?: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          series_id?: string
          assigned_by?: string | null
          fms_score_id?: string | null
          start_date?: string
          end_date?: string
          current_week?: number
          completed?: boolean
          completion_percentage?: number
          points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      series_exercises: {
        Row: {
          id: string
          series_id: string
          exercise_id: string
          week_number: number
          day_number: number | null
          order_in_week: number
          custom_sets: number | null
          custom_reps: number | null
          custom_duration: number | null
        }
        Insert: {
          id?: string
          series_id: string
          exercise_id: string
          week_number: number
          day_number?: number | null
          order_in_week: number
          custom_sets?: number | null
          custom_reps?: number | null
          custom_duration?: number | null
        }
        Update: {
          id?: string
          series_id?: string
          exercise_id?: string
          week_number?: number
          day_number?: number | null
          order_in_week?: number
          custom_sets?: number | null
          custom_reps?: number | null
          custom_duration?: number | null
        }
        Relationships: []
      }
      stations: {
        Row: {
          id: string
          name: string
          department: string
          location: string | null
          city: string | null
          state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          department: string
          location?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          department?: string
          location?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'firefighter' | 'chief' | 'admin' | 'clinic' | 'assessor'
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
          role?: 'firefighter' | 'chief' | 'admin' | 'clinic' | 'assessor'
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
          role?: 'firefighter' | 'chief' | 'admin' | 'clinic' | 'assessor'
          badge_number?: string | null
          station_id?: string | null
          points?: number
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string | null
          created_at?: string
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
      [_ in never]: never
    }
  }
}
