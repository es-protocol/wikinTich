import { TutorRequest, Tutor, TutorRecommendation, MatchingCriteria } from '../types'

export class MatchingAlgorithm {
  private readonly maxRecommendations: number
  private readonly compatibilityThreshold: number

  constructor() {
    this.maxRecommendations = parseInt(process.env.MAX_RECOMMENDATIONS || '5')
    this.compatibilityThreshold = parseFloat(process.env.COMPATIBILITY_THRESHOLD || '0.6')
  }

  /**
   * Main matching function that processes a request and returns tutor recommendations
   */
  async findMatchingTutors(
    request: TutorRequest,
    availableTutors: Tutor[]
  ): Promise<TutorRecommendation[]> {
    try {
      // Filter out tutors who are already assigned to this request
      const unassignedTutors = availableTutors.filter(
        tutor => tutor.id !== request.matched_tutor_id
      )

      // Calculate compatibility scores for all tutors
      const scoredTutors = await Promise.all(
        unassignedTutors.map(async (tutor) => {
          const compatibilityScore = await this.calculateCompatibilityScore(request, tutor)
          return { tutor, compatibilityScore }
        })
      )

      // Sort by compatibility score (highest first)
      const sortedTutors = scoredTutors
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .filter(item => item.compatibilityScore >= this.compatibilityThreshold)

      // Take top recommendations
      const topTutors = sortedTutors.slice(0, this.maxRecommendations)

      // Convert to recommendation format
      const recommendations = topTutors.map(({ tutor, compatibilityScore }) => {
        const reasoning = this.generateReasoning(request, tutor, compatibilityScore)
        
        return {
          tutorId: tutor.id,
          tutorName: this.getTutorName(tutor),
          compatibilityScore: Math.round(compatibilityScore * 100) / 100,
          reasoning,
          availability: this.extractAvailability(tutor),
          hourlyRate: this.estimateHourlyRate(tutor),
          rating: this.getTutorRating(tutor),
          subjects: tutor.subjects || [],
          experience: this.getExperienceYears(tutor),
          education: this.getEducationLevel(tutor),
          verified: tutor.is_verified,
          totalReviews: this.getTotalReviews(tutor)
        }
      })

      return recommendations
    } catch (error) {
      console.error('Error in findMatchingTutors:', error)
      return []
    }
  }

  /**
   * Calculate overall compatibility score between a request and tutor
   */
  private async calculateCompatibilityScore(
    request: TutorRequest,
    tutor: Tutor
  ): Promise<number> {
    const criteria: MatchingCriteria = {
      subjectMatch: this.calculateSubjectMatch(request, tutor),
      locationProximity: this.calculateLocationProximity(request, tutor),
      availabilityAlignment: this.calculateAvailabilityAlignment(request, tutor),
      ratingCompatibility: this.calculateRatingCompatibility(tutor),
      experienceLevel: this.calculateExperienceLevel(request, tutor),
      verificationStatus: this.calculateVerificationStatus(tutor)
    }

    // Weighted scoring system
    const weights = {
      subjectMatch: 0.35,        // Most important - subject expertise
      locationProximity: 0.20,   // Geographic convenience
      availabilityAlignment: 0.20, // Schedule compatibility
      ratingCompatibility: 0.15, // Past performance
      experienceLevel: 0.07,     // Experience relevance
      verificationStatus: 0.03   // Verification bonus
    }

    // Calculate weighted score
    let totalScore = 0
    let totalWeight = 0

    for (const [key, weight] of Object.entries(weights)) {
      const score = criteria[key as keyof MatchingCriteria]
      totalScore += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  /**
   * Calculate subject match score
   */
  private calculateSubjectMatch(request: TutorRequest, tutor: Tutor): number {
    if (!tutor.subjects || !Array.isArray(tutor.subjects)) {
      return 0
    }

    const requestSubjects = request.subjects.toLowerCase().split(',').map(s => s.trim())
    const tutorSubjects = tutor.subjects.map(s => s.toLowerCase())

    let matchCount = 0
    let totalRequestSubjects = requestSubjects.length

    for (const requestSubject of requestSubjects) {
      if (tutorSubjects.some(tutorSubject => 
        tutorSubject.includes(requestSubject) || requestSubject.includes(tutorSubject)
      )) {
        matchCount++
      }
    }

    return totalRequestSubjects > 0 ? matchCount / totalRequestSubjects : 0
  }

  /**
   * Calculate location proximity score
   */
  private calculateLocationProximity(request: TutorRequest, tutor: Tutor): number {
    // For now, using a simple location matching
    // In production, use actual coordinates and distance calculation
    const requestLocation = request.location.toLowerCase()
    const tutorLocation = tutor.availability?.location?.toLowerCase() || ''

    if (requestLocation === 'home_visit' && tutorLocation.includes('home')) {
      return 1.0
    }

    if (requestLocation === tutorLocation) {
      return 1.0
    }

    // Partial location match
    if (tutorLocation.includes(requestLocation) || requestLocation.includes(tutorLocation)) {
      return 0.7
    }

    return 0.3 // Default score for different locations
  }

  /**
   * Calculate availability alignment score
   */
  private calculateAvailabilityAlignment(request: TutorRequest, tutor: Tutor): number {
    if (!request.preferred_schedule || !tutor.availability) {
      return 0.5 // Neutral score if no schedule info
    }

    const requestSchedule = request.preferred_schedule.toLowerCase()
    const tutorAvailability = JSON.stringify(tutor.availability).toLowerCase()

    // Check for schedule overlap
    if (tutorAvailability.includes(requestSchedule)) {
      return 1.0
    }

    // Partial schedule match
    if (this.hasScheduleOverlap(requestSchedule, tutorAvailability)) {
      return 0.8
    }

    return 0.3
  }

  /**
   * Calculate rating compatibility score
   */
  private calculateRatingCompatibility(tutor: Tutor): number {
    const rating = this.getTutorRating(tutor)
    
    if (!rating) {
      return 0.5 // Neutral score for tutors without ratings
    }

    // Normalize rating to 0-1 scale (assuming 5-star rating system)
    return rating / 5
  }

  /**
   * Calculate experience level score
   */
  private calculateExperienceLevel(request: TutorRequest, tutor: Tutor): number {
    const experience = this.getExperienceYears(tutor)
    
    if (!experience) {
      return 0.5 // Neutral score for tutors without experience info
    }

    // Grade level to experience mapping
    const gradeLevel = request.grade_level.toLowerCase()
    
    if (gradeLevel.includes('primary') && experience >= 1) {
      return 1.0
    }
    
    if (gradeLevel.includes('secondary') && experience >= 2) {
      return 1.0
    }
    
    if (gradeLevel.includes('university') && experience >= 3) {
      return 1.0
    }

    // Graduated scoring based on experience
    return Math.min(experience / 5, 1.0)
  }

  /**
   * Calculate verification status score
   */
  private calculateVerificationStatus(tutor: Tutor): number {
    return tutor.is_verified ? 1.0 : 0.0
  }

  /**
   * Generate human-readable reasoning for the match
   */
  private generateReasoning(
    request: TutorRequest,
    tutor: Tutor,
    compatibilityScore: number
  ): string[] {
    const reasoning: string[] = []

    // Subject match reasoning
    const subjectMatch = this.calculateSubjectMatch(request, tutor)
    if (subjectMatch >= 0.8) {
      reasoning.push('Excellent subject match')
    } else if (subjectMatch >= 0.6) {
      reasoning.push('Good subject coverage')
    } else if (subjectMatch >= 0.4) {
      reasoning.push('Partial subject match')
    }

    // Experience reasoning
    const experience = this.getExperienceYears(tutor)
    if (experience && experience >= 3) {
      reasoning.push('Experienced tutor')
    } else if (experience && experience >= 1) {
      reasoning.push('Some teaching experience')
    }

    // Rating reasoning
    const rating = this.getTutorRating(tutor)
    if (rating && rating >= 4.5) {
      reasoning.push('Highly rated by students')
    } else if (rating && rating >= 4.0) {
      reasoning.push('Well-rated tutor')
    }

    // Verification reasoning
    if (tutor.is_verified) {
      reasoning.push('Verified credentials')
    }

    // Availability reasoning
    if (this.calculateAvailabilityAlignment(request, tutor) >= 0.8) {
      reasoning.push('Schedule compatible')
    }

    return reasoning
  }

  /**
   * Helper methods
   */
  private getTutorName(tutor: Tutor): string {
    if (tutor.availability?.display_name) {
      return tutor.availability.display_name
    }
    return tutor.email || 'Tutor'
  }

  private extractAvailability(tutor: Tutor): string[] {
    if (!tutor.availability) return ['Contact for availability']
    
    try {
      const availability = typeof tutor.availability === 'string' 
        ? JSON.parse(tutor.availability) 
        : tutor.availability
      
      if (availability.schedule) {
        return Array.isArray(availability.schedule) 
          ? availability.schedule 
          : [availability.schedule]
      }
    } catch (error) {
      console.error('Error parsing tutor availability:', error)
    }
    
    return ['Contact for availability']
  }

  private estimateHourlyRate(tutor: Tutor): number | undefined {
    // This would be enhanced with actual pricing data
    // For now, return undefined to indicate pricing should be discussed
    return undefined
  }

  private getTutorRating(tutor: Tutor): number | undefined {
    if (tutor.availability?.rating) {
      return parseFloat(tutor.availability.rating)
    }
    return tutor.average_rating || undefined
  }

  private getExperienceYears(tutor: Tutor): number | undefined {
    if (tutor.availability?.experience_years) {
      return parseInt(tutor.availability.experience_years)
    }
    return undefined
  }

  private getEducationLevel(tutor: Tutor): string | undefined {
    return tutor.availability?.education_level
  }

  private getTotalReviews(tutor: Tutor): number | undefined {
    return tutor.availability?.total_reviews
  }

  private hasScheduleOverlap(requestSchedule: string, tutorAvailability: string): boolean {
    // Simple overlap detection - can be enhanced with proper time parsing
    const requestWords = requestSchedule.split(' ')
    return requestWords.some(word => 
      word.length > 2 && tutorAvailability.includes(word.toLowerCase())
    )
  }
}
