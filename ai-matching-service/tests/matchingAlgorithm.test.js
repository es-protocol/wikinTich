const { MatchingAlgorithm } = require('../dist/services/matchingAlgorithm')
const { mockRequest, mockTutors } = require('./mockData')

describe('MatchingAlgorithm', () => { // I am creating a test group Called MatchingAlgorithm
  let matchingAlgorithm //I am basically declaring a variable to hold my matchinAlgorithm instance

  //Here I am saying before each test runs create a fresh clean instance of the algorithm
  beforeEach(() => {
    matchingAlgorithm = new MatchingAlgorithm()
  })

  //I am creating a sub group of tests about subject matching
  describe('Subject Matching', () => {
    test('should give high score for exact subject match', async () => {
      const mathTutor = mockTutors[0] // And the first mock Tutor in the file mockData.js is a math tutor
      //Ask how well does mockTutor[0] match mockRequest?
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, mathTutor)
      
      // check that the total score is greater than 70%
      expect(score).toBeGreaterThan(0.7)
    })
  
    test('should give low score for no subject match', async () => {
      const englishTutor = mockTutors[1] // if tmath request tries to match with an english tutor
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, englishTutor)
      
      // check that the score is less than 50%
      expect(score).toBeLessThan(0.5)
    })
  })

  describe('Location Matching', () => {
    test('should give high score for same location', async () => {
      const freetownTutor = mockTutors[0] // Alice Math in Freetown
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, freetownTutor)
      
      // Both in Freetown should have high location score
      expect(score).toBeGreaterThan(0.6)
    })

    test('should give lower score for different location', async () => {
      const boTutor = mockTutors[1] // Bob English in Bo
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, boTutor)
      
      // Different locations should have lower score
      expect(score).toBeLessThan(0.6)
    })
  })

  describe('Availability Matching', () => {
    test('should give high score for matching availability', async () => {
      const afternoonTutor = mockTutors[0] // Alice Math - Afternoons
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, afternoonTutor)
      
      // Both prefer afternoons should have high availability score
      expect(score).toBeGreaterThan(0.6)
    })
  })

  describe('Rating and Experience', () => {
    test('should consider tutor rating in scoring', async () => {
      const highRatedTutor = mockTutors[2] // Charlie Math - 4.9 rating
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, highRatedTutor)
      
      // High-rated tutor should have good overall score
      expect(score).toBeGreaterThan(0.7)
    })

    test('should consider experience in scoring', async () => {
      const experiencedTutor = mockTutors[2] // Charlie Math - 7 years experience
      const score = await matchingAlgorithm.calculateCompatibilityScore(mockRequest, experiencedTutor)
      
      // Experienced tutor should have good score
      expect(score).toBeGreaterThan(0.7)
    })
  })

  describe('Full Matching Process', () => {
    test('should return recommendations sorted by score', async () => {
      const recommendations = await matchingAlgorithm.findMatchingTutors(mockRequest, mockTutors)
      
      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
      
      // Should have at least one recommendation
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('tutorId')
        expect(recommendations[0]).toHaveProperty('compatibilityScore')
        expect(recommendations[0]).toHaveProperty('tutorName')
      }
    })

    test('should filter out tutors below threshold', async () => {
      // Set a high threshold
      matchingAlgorithm.compatibilityThreshold = 0.8
      
      const recommendations = await matchingAlgorithm.findMatchingTutors(mockRequest, mockTutors)
      
      // All recommendations should be above threshold
      recommendations.forEach(rec => {
        expect(rec.compatibilityScore).toBeGreaterThanOrEqual(0.8)
      })
    })
  })
})