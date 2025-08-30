// AI Matching Service Integration for Tutor-Link
// This utility provides functions to interact with the AI matching microservice

export interface AIRecommendation {
  tutorId: string
  tutorName: string
  compatibilityScore: number
  reasoning: string[]
  availability: string[]
  hourlyRate?: number
  rating?: number
  subjects: string[]
  experience?: number
  education?: string
  verified: boolean
  totalReviews?: number
}

export interface AIMatchingResult {
  requestId: string
  recommendations: AIRecommendation[]
  totalTutorsConsidered: number
  matchingTimestamp: string
  algorithmVersion: string
}

export interface AIRecommendationWithDetails extends AIRecommendation {
  // Additional fields for display in the dashboard
  displayScore: string
  displayReasoning: string
  displayAvailability: string
  isRecommended: boolean
}

class AIMatchingService {
  private baseUrl: string
  private isEnabled: boolean

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = process.env.NEXT_PUBLIC_AI_MATCHING_SERVICE_URL || 'http://localhost:3002'
    this.isEnabled = process.env.NEXT_PUBLIC_AI_MATCHING_ENABLED === 'true'
  }

  /**
   * Check if AI matching service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    if (!this.isEnabled) return false
    
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      return data.status === 'healthy'
    } catch (error) {
      console.warn('AI Matching Service not available:', error)
      return false
    }
  }

  /**
   * Get AI recommendations for a tutor request
   */
  async getRecommendations(requestId: string): Promise<AIRecommendationWithDetails[]> {
    if (!this.isEnabled) {
      console.log('AI Matching Service is disabled')
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get recommendations')
      }

      // Transform recommendations for display
      return result.data.recommendations.map((rec: AIRecommendation) => ({
        ...rec,
        displayScore: `${Math.round(rec.compatibilityScore * 100)}%`,
        displayReasoning: rec.reasoning.join(', '),
        displayAvailability: rec.availability.join(', '),
        isRecommended: rec.compatibilityScore >= 0.8
      }))

    } catch (error) {
      console.error('Error getting AI recommendations:', error)
      return []
    }
  }

  /**
   * Get system statistics from AI service
   */
  async getSystemStats(): Promise<any> {
    if (!this.isEnabled) return null

    try {
      const response = await fetch(`${this.baseUrl}/stats`)
      const result = await response.json()
      
      if (result.success) {
        return result.data
      }
      
      return null
    } catch (error) {
      console.error('Error getting AI service stats:', error)
      return null
    }
  }

  /**
   * Check if a specific tutor is available for a request
   */
  async checkTutorAvailability(tutorId: string, requestId: string): Promise<boolean> {
    if (!this.isEnabled) return true // Default to available if service is disabled

    try {
      const response = await fetch(
        `${this.baseUrl}/tutor/${tutorId}/availability?requestId=${requestId}`
      )
      const result = await response.json()
      
      if (result.success) {
        return result.data.isAvailable
      }
      
      return true // Default to available if check fails
    } catch (error) {
      console.error('Error checking tutor availability:', error)
      return true // Default to available if service is unavailable
    }
  }

  /**
   * Get detailed tutor information
   */
  async getTutorDetails(tutorId: string): Promise<any> {
    if (!this.isEnabled) return null

    try {
      const response = await fetch(`${this.baseUrl}/tutor/${tutorId}`)
      const result = await response.json()
      
      if (result.success) {
        return result.data
      }
      
      return null
    } catch (error) {
      console.error('Error getting tutor details:', error)
      return null
    }
  }

  /**
   * Format compatibility score for display
   */
  formatCompatibilityScore(score: number): string {
    if (score >= 0.9) return 'Excellent Match'
    if (score >= 0.8) return 'Great Match'
    if (score >= 0.7) return 'Good Match'
    if (score >= 0.6) return 'Fair Match'
    return 'Limited Match'
  }

  /**
   * Get color class for compatibility score
   */
  getScoreColorClass(score: number): string {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  /**
   * Get badge color for compatibility score
   */
  getScoreBadgeColor(score: number): string {
    if (score >= 0.8) return 'bg-green-100 text-green-800'
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }
}

// Export singleton instance
export const aiMatchingService = new AIMatchingService()

// Export individual functions for convenience
export const {
  checkServiceHealth,
  getRecommendations,
  getSystemStats,
  checkTutorAvailability,
  getTutorDetails,
  formatCompatibilityScore,
  getScoreColorClass,
  getScoreBadgeColor
} = aiMatchingService
