# AI Matching Service for Tutor-Link

An intelligent microservice that provides AI-powered tutor-student matching recommendations for the Tutor-Link educational platform.

## 🚀 Features

- **AI-Powered Matching**: Intelligent algorithms that consider multiple factors
- **Real-time Recommendations**: Instant tutor suggestions based on student needs
- **Multi-factor Scoring**: Subject expertise, location, availability, ratings, and more
- **Scalable Architecture**: Built as a microservice for easy scaling
- **RESTful API**: Clean endpoints for integration with existing systems

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING MONOLITH                       │
│  (Tutor-Link Next.js app)                                 │
│  - User interfaces                                         │
│  - Database operations                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API calls
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                AI MATCHING SERVICE                         │
│  - Express.js server                                       │
│  - AI matching algorithms                                  │
│  - Supabase integration                                    │
│  - RESTful endpoints                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to Tutor-Link Supabase database
- Environment variables configured

## 🛠️ Installation

1. **Clone and navigate to the service directory:**
   ```bash
   cd ai-matching-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   PORT=3002
   NODE_ENV=development
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   MAX_RECOMMENDATIONS=5
   COMPATIBILITY_THRESHOLD=0.6
   ```

4. **Build the service:**
   ```bash
   npm run build
   ```

## 🚀 Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The service will start on port 3002 (or the port specified in your `.env` file).

## 🔌 API Endpoints

### Health Check
```http
GET /health
```
Returns service status and version information.

### Get Tutor Recommendations
```http
POST /match
Content-Type: application/json

{
  "requestId": "uuid-of-tutor-request"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "uuid",
    "recommendations": [
      {
        "tutorId": "tutor-uuid",
        "tutorName": "John Doe",
        "compatibilityScore": 0.95,
        "reasoning": ["Excellent subject match", "Highly rated by students"],
        "availability": ["Weekdays 3-6 PM", "Weekends 9-12 PM"],
        "rating": 4.8,
        "subjects": ["Mathematics", "Physics"],
        "experience": 5,
        "education": "Master's Degree",
        "verified": true,
        "totalReviews": 23
      }
    ],
    "totalTutorsConsidered": 15,
    "matchingTimestamp": "2024-01-15T10:30:00Z",
    "algorithmVersion": "1.0.0"
  }
}
```

### Batch Matching
```http
POST /match/batch
Content-Type: application/json

{
  "requestIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Get Tutor Details
```http
GET /tutor/{tutorId}
```

### Check Tutor Availability
```http
GET /tutor/{tutorId}/availability?requestId={requestId}
```

### System Statistics
```http
GET /stats
```

## 🧠 How the AI Matching Works

### 1. **Subject Matching (35% weight)**
- Analyzes requested subjects vs. tutor expertise
- Uses fuzzy matching for subject variations
- Considers subject depth and breadth

### 2. **Location Proximity (20% weight)**
- Matches location preferences
- Considers home visit vs. center-based tutoring
- Geographic convenience scoring

### 3. **Availability Alignment (20% weight)**
- Schedule compatibility analysis
- Time slot overlap detection
- Flexibility scoring

### 4. **Rating Compatibility (15% weight)**
- Past performance analysis
- Student feedback consideration
- Rating normalization

### 5. **Experience Level (7% weight)**
- Grade level to experience mapping
- Teaching experience relevance
- Graduated scoring system

### 6. **Verification Status (3% weight)**
- Credential verification bonus
- Trust and reliability scoring

## 🔧 Integration with Existing System

### Phase 1: Super Admin Dashboard Integration
```typescript
// In super admin dashboard
const getAIRecommendations = async (requestId: string) => {
  try {
    const response = await fetch('http://localhost:3002/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    })
    
    const result = await response.json()
    if (result.success) {
      // Display AI recommendations alongside manual selection
      setAiRecommendations(result.data.recommendations)
    }
  } catch (error) {
    console.error('Error fetching AI recommendations:', error)
  }
}
```

### Phase 2: Parent Dashboard Integration
```typescript
// In parent dashboard - after form submission
const showAIRecommendations = async (requestId: string) => {
  const recommendations = await getAIRecommendations(requestId)
  // Display recommendations for parent selection
}
```

## 📊 Monitoring and Debugging

### Health Check
```bash
curl http://localhost:3002/health
```

### System Statistics
```bash
curl http://localhost:3002/stats
```

### Test Matching
```bash
curl -X POST http://localhost:3002/match \
  -H "Content-Type: application/json" \
  -d '{"requestId": "request-uuid"}'
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
1. Start the service: `npm run dev`
2. Use the health check endpoint to verify it's running
3. Test with a real request ID from your database
4. Verify recommendations are returned

## 🔄 Development Workflow

### 1. **Start with Super Admin Integration**
- Integrate AI recommendations into existing workflow
- Test matching quality with real data
- Validate algorithm performance

### 2. **Move to Parent Dashboard**
- Add AI recommendations to parent interface
- Implement self-service selection
- Test end-to-end user experience

### 3. **Remove from Super Admin**
- Eliminate manual matching workflow
- Super admin focuses on other tasks
- Full automation achieved

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase credentials in `.env`
   - Check network connectivity
   - Ensure database tables exist

2. **No Recommendations Returned**
   - Check if tutors exist and are verified
   - Verify request ID is valid
   - Check compatibility threshold settings

3. **Performance Issues**
   - Monitor database query performance
   - Check for missing indexes
   - Verify algorithm efficiency

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your `.env` file.

## 📈 Performance Considerations

- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Consider Redis for caching tutor data
- **Load Balancing**: Scale horizontally for high traffic
- **Monitoring**: Track response times and success rates

## 🔮 Future Enhancements

- **Machine Learning**: Train models on successful matches
- **Real-time Updates**: WebSocket integration for live recommendations
- **Advanced Analytics**: Deep insights into matching patterns
- **Multi-language Support**: Localized matching algorithms

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check service logs
4. Verify database connectivity

---

**Built with ❤️ for Tutor-Link**
