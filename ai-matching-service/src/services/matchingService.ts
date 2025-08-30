import { DatabaseService } from './database'
import { MatchingAlgorithm } from './matchingAlgorithm'
import { TutorRequest, TutorRecommendation, MatchingResult } from '../types'

export class MatchingService {
  private databaseService: DatabaseService
  private matchingAlgorithm: MatchingAlgorithm

  constructor() {
    this.databaseService = new DatabaseService()
    this.matchingAlgorithm = new MatchingAlgorithm()
  }

  /**
   * Main entry point for finding tutor recommendations
   */
  async findTutorRecommendations(requestId: string): Promise<MatchingResult> {
    try {
      console.log(`Finding tutor recommendations for request: ${requestId}`)

      // 1. Fetch the tutor request
      const request = await this.databaseService.getTutorRequest(requestId)
      if (!request) {
        throw new Error(`Tutor request not found: ${requestId}`)
      }

      // 2. Fetch all available verified tutors
      const availableTutors = await this.databaseService.getAvailableTutors()
      if (availableTutors.length === 0) {
        console.log('No verified tutors available')
        return this.createEmptyResult(requestId)
      }

      console.log(`Found ${availableTutors.length} available tutors`)

      // 3. Run AI matching algorithm
      const recommendations = await this.matchingAlgorithm.findMatchingTutors(
        request,
        availableTutors
      )

      console.log(`Generated ${recommendations.length} recommendations`)

      // 4. Create and return result
      const result: MatchingResult = {
        requestId,
        recommendations,
        totalTutorsConsidered: availableTutors.length,
        matchingTimestamp: new Date().toISOString(),
        algorithmVersion: '1.0.0'
      }

      return result
    } catch (error) {
      console.error('Error in findTutorRecommendations:', error)
      throw error
    }
  }

  /**
   * Find recommendations for multiple requests
   */
  async findRecommendationsForMultipleRequests(requestIds: string[]): Promise<MatchingResult[]> {
    try {
      const results = await Promise.all(
        requestIds.map(id => this.findTutorRecommendations(id))
      )
      return results
    } catch (error) {
      console.error('Error in findRecommendationsForMultipleRequests:', error)
      throw error
    }
  }

  /**
   * Get detailed tutor information for a specific recommendation
   */
  async getTutorDetails(tutorId: string): Promise<any> {
    try {
      const [
        qualifications,
        reviews,
        performance
      ] = await Promise.all([
        this.databaseService.getTutorQualifications(tutorId),
        this.databaseService.getTutorReviews(tutorId),
        this.databaseService.getTutorPerformance(tutorId)
      ])

      return {
        qualifications,
        reviews,
        performance,
        totalReviews: reviews.length,
        averageRating: reviews.length > 0 
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : null
      }
    } catch (error) {
      console.error('Error in getTutorDetails:', error)
      throw error
    }
  }

  /**
   * Check if a tutor is available for a specific request
   */
  async checkTutorAvailability(tutorId: string, requestId: string): Promise<boolean> {
    try {
      const [
        isAssigned,
        activeAssignments
      ] = await Promise.all([
        this.databaseService.isTutorAssignedToRequest(tutorId, requestId),
        this.databaseService.getTutorActiveAssignments(tutorId)
      ])

      // Tutor is available if:
      // 1. Not already assigned to this request
      // 2. Has reasonable number of active assignments (less than 5)
      return !isAssigned && activeAssignments < 5
    } catch (error) {
      console.error('Error in checkTutorAvailability:', error)
      return false
    }
  }

  /**
   * Get system statistics for monitoring
   */
  async getSystemStats(): Promise<any> {
    try {
      const availableTutors = await this.databaseService.getAvailableTutors()
      
      return {
        totalVerifiedTutors: availableTutors.length,
        tutorsWithRatings: availableTutors.filter(t => t.average_rating).length,
        averageTutorRating: availableTutors.length > 0 
          ? availableTutors.reduce((sum, t) => sum + (t.average_rating || 0), 0) / availableTutors.length
          : 0,
        serviceStatus: 'healthy',
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error in getSystemStats:', error)
      return {
        serviceStatus: 'error',
        error: error.message,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Create empty result when no recommendations found
   */
  private createEmptyResult(requestId: string): MatchingResult {
    return {
      requestId,
      recommendations: [],
      totalTutorsConsidered: 0,
      matchingTimestamp: new Date().toISOString(),
      algorithmVersion: '1.0.0'
    }
  }

  /**
   * Validate request ID format
   */
  private validateRequestId(requestId: string): boolean {
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(requestId)
  }
}
