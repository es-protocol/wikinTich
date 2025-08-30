import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { TutorRequest, Tutor, TutorProfile, TutorDisplayInfo, TutorQualification, TutorReview } from '../types'

export class DatabaseService {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Fetch a specific tutor request by ID
   */
  async getTutorRequest(requestId: string): Promise<TutorRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('home_tutoring_requests')
        .select('*')
        .eq('id', requestId)
        .single()

      if (error) {
        console.error('Error fetching tutor request:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getTutorRequest:', error)
      return null
    }
  }

  /**
   * Fetch all available verified tutors with their profiles and additional info
   */
  async getAvailableTutors(): Promise<Tutor[]> {
    try {
      const { data, error } = await this.supabase
        .from('tutors')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          ),
          tutor_display_info (
            display_name,
            subjects_taught,
            experience_years,
            education_level,
            bio_summary,
            availability_summary,
            rating,
            total_reviews
          )
        `)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching available tutors:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAvailableTutors:', error)
      return []
    }
  }

  /**
   * Fetch tutor qualifications
   */
  async getTutorQualifications(tutorId: string): Promise<TutorQualification[]> {
    try {
      const { data, error } = await this.supabase
        .from('tutor_qualifications')
        .select('*')
        .eq('tutor_id', tutorId)
        .eq('is_verified', true)

      if (error) {
        console.error('Error fetching tutor qualifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTutorQualifications:', error)
      return []
    }
  }

  /**
   * Fetch tutor reviews and ratings
   */
  async getTutorReviews(tutorId: string): Promise<TutorReview[]> {
    try {
      const { data, error } = await this.supabase
        .from('tutor_reviews')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tutor reviews:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTutorReviews:', error)
      return []
    }
  }

  /**
   * Fetch tutor performance metrics
   */
  async getTutorPerformance(tutorId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('tutor_performance')
        .select('*')
        .eq('tutor_id', tutorId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching tutor performance:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getTutorPerformance:', error)
      return null
    }
  }

  /**
   * Check if tutor is already assigned to a specific request
   */
  async isTutorAssignedToRequest(tutorId: string, requestId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('home_tutoring_requests')
        .select('matched_tutor_id')
        .eq('id', requestId)
        .eq('matched_tutor_id', tutorId)
        .single()

      if (error) {
        return false
      }

      return !!data?.matched_tutor_id
    } catch (error) {
      return false
    }
  }

  /**
   * Get tutor's current active assignments count
   */
  async getTutorActiveAssignments(tutorId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('home_tutoring_requests')
        .select('*', { count: 'exact', head: true })
        .eq('matched_tutor_id', tutorId)
        .in('status', ['matched', 'in_progress'])

      if (error) {
        console.error('Error fetching tutor active assignments:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getTutorActiveAssignments:', error)
      return 0
    }
  }
}
