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
      users: {
        Row: {
          id: string
          email: string
          role: 'patient' | 'employee' | 'owner'
          clinic_id: string | null
          first_name: string
          last_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'patient' | 'employee' | 'owner'
          clinic_id?: string | null
          first_name: string
          last_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'patient' | 'employee' | 'owner'
          clinic_id?: string | null
          first_name?: string
          last_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      clinics: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      fms_assessments: {
        Row: {
          id: string
          patient_id: string
          employee_id: string
          deep_squat: number
          hurdle_step_left: number
          hurdle_step_right: number
          inline_lunge_left: number
          inline_lunge_right: number
          shoulder_mobility_left: number
          shoulder_mobility_right: number
          active_straight_leg_raise_left: number
          active_straight_leg_raise_right: number
          trunk_stability_push_up: number
          rotary_stability_left: number
          rotary_stability_right: number
          total_score: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          employee_id: string
          deep_squat: number
          hurdle_step_left: number
          hurdle_step_right: number
          inline_lunge_left: number
          inline_lunge_right: number
          shoulder_mobility_left: number
          shoulder_mobility_right: number
          active_straight_leg_raise_left: number
          active_straight_leg_raise_right: number
          trunk_stability_push_up: number
          rotary_stability_left: number
          rotary_stability_right: number
          total_score: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          employee_id?: string
          deep_squat?: number
          hurdle_step_left?: number
          hurdle_step_right?: number
          inline_lunge_left?: number
          inline_lunge_right?: number
          shoulder_mobility_left?: number
          shoulder_mobility_right?: number
          active_straight_leg_raise_left?: number
          active_straight_leg_raise_right?: number
          trunk_stability_push_up?: number
          rotary_stability_left?: number
          rotary_stability_right?: number
          total_score?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          video_url: string | null
          duration_seconds: number
          sets: number
          reps: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          description: string
          video_url?: string | null
          duration_seconds: number
          sets: number
          reps: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string
          video_url?: string | null
          duration_seconds?: number
          sets?: number
          reps?: number
          created_at?: string
          updated_at?: string
        }
      }
      exercise_assignments: {
        Row: {
          id: string
          patient_id: string
          exercise_id: string
          assigned_by: string
          assigned_date: string
          due_date: string  // Keep for backward compatibility
          start_date: string
          end_date: string
          daily_target: number
          custom_sets: number | null
          custom_reps: number | null
          total_completions_required: number
          assessment_id: string | null
          phase: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          exercise_id: string
          assigned_by: string
          assigned_date: string
          due_date?: string  // Optional for backward compatibility
          start_date: string
          end_date: string
          daily_target?: number
          custom_sets?: number | null
          custom_reps?: number | null
          total_completions_required?: number
          assessment_id?: string | null
          phase: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          exercise_id?: string
          assigned_by?: string
          assigned_date?: string
          due_date?: string
          start_date?: string
          end_date?: string
          daily_target?: number
          custom_sets?: number | null
          custom_reps?: number | null
          total_completions_required?: number
          assessment_id?: string | null
          phase?: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          created_at?: string
          updated_at?: string
        }
      }
      exercise_completions: {
        Row: {
          id: string
          assignment_id: string
          patient_id: string
          completed_at: string
          completion_date: string  // Generated column from DATE(completed_at)
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          patient_id: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          patient_id?: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      patient_progress: {
        Row: {
          id: string
          patient_id: string
          phase: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          points: number
          streak_days: number
          last_activity_date: string | null
          total_exercises_completed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          phase?: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          points?: number
          streak_days?: number
          last_activity_date?: string | null
          total_exercises_completed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          phase?: 'analyze' | 'mobilize' | 'stabilize' | 'optimize'
          points?: number
          streak_days?: number
          last_activity_date?: string | null
          total_exercises_completed?: number
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          patient_id: string
          type: string
          name: string
          description: string
          earned_at: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          type: string
          name: string
          description: string
          earned_at: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          type?: string
          name?: string
          description?: string
          earned_at?: string
          created_at?: string
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