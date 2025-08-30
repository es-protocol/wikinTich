import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { MatchingService } from './services/matchingService'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3002

// Initialize services
const matchingService = new MatchingService()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tutor-link.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Matching Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Main matching endpoint
app.post('/match', async (req, res) => {
  try {
    const { requestId } = req.body

    if (!requestId) {
      return res.status(400).json({
        error: 'Missing requestId parameter',
        message: 'Please provide a valid request ID'
      })
    }

    console.log(`Received matching request for: ${requestId}`)

    const result = await matchingService.findTutorRecommendations(requestId)
    
    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error in /match endpoint:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to generate tutor recommendations'
    })
  }
})

// Batch matching endpoint
app.post('/match/batch', async (req, res) => {
  try {
    const { requestIds } = req.body

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid requestIds parameter',
        message: 'Please provide an array of valid request IDs'
      })
    }

    console.log(`Received batch matching request for ${requestIds.length} requests`)

    const results = await matchingService.findRecommendationsForMultipleRequests(requestIds)
    
    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error in /match/batch endpoint:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to generate batch tutor recommendations'
    })
  }
})

// Get tutor details endpoint
app.get('/tutor/:tutorId', async (req, res) => {
  try {
    const { tutorId } = req.params

    if (!tutorId) {
      return res.status(400).json({
        error: 'Missing tutorId parameter',
        message: 'Please provide a valid tutor ID'
      })
    }

    console.log(`Fetching details for tutor: ${tutorId}`)

    const details = await matchingService.getTutorDetails(tutorId)
    
    res.json({
      success: true,
      data: details
    })
  } catch (error) {
    console.error('Error in /tutor/:tutorId endpoint:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to fetch tutor details'
    })
  }
})

// Check tutor availability endpoint
app.get('/tutor/:tutorId/availability', async (req, res) => {
  try {
    const { tutorId } = req.params
    const { requestId } = req.query

    if (!tutorId || !requestId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide both tutorId and requestId'
      })
    }

    console.log(`Checking availability for tutor ${tutorId} and request ${requestId}`)

    const isAvailable = await matchingService.checkTutorAvailability(
      tutorId as string,
      requestId as string
    )
    
    res.json({
      success: true,
      data: {
        tutorId,
        requestId,
        isAvailable
      }
    })
  } catch (error) {
    console.error('Error in /tutor/:tutorId/availability endpoint:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to check tutor availability'
    })
  }
})

// System statistics endpoint
app.get('/stats', async (req, res) => {
  try {
    console.log('Fetching system statistics')

    const stats = await matchingService.getSystemStats()
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error in /stats endpoint:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: 'Failed to fetch system statistics'
    })
  }
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`
  })
})

// Start server
app.listen(port, () => {
  console.log(`🚀 AI Matching Service running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/health`)
  console.log(`🔍 Matching endpoint: http://localhost:${port}/match`)
  console.log(`📈 Stats endpoint: http://localhost:${port}/stats`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})
