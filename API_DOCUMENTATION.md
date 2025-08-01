# Culturis API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com`

## Authentication
All requests require appropriate API keys configured in the backend environment.

## Endpoints

### Health Check

#### `GET /health`
Check if the API is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-01T12:00:00Z",
  "version": "1.0.0"
}
```

---

### User Onboarding

#### `POST /api/onboarding`
Submit user taste preferences during onboarding.

**Request Body:**
```json
{
  "tastes": ["music", "art", "theater", "museums"],
  "location": "New York, NY",
  "preferences": {
    "budget": "medium",
    "time_of_day": "evening"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user_12345",
  "message": "Onboarding completed successfully",
  "recommended_venues": []
}
```

**Error Response:**
```json
{
  "error": "Invalid taste preferences",
  "details": "At least one taste must be provided"
}
```

---

### Venue Recommendations

#### `POST /api/venues`
Get personalized venue recommendations based on user preferences.

**Request Body:**
```json
{
  "tastes": ["art", "music"],
  "location": "San Francisco, CA",
  "limit": 10,
  "radius": 5000,
  "filters": {
    "price_range": "$$",
    "open_now": true
  }
}
```

**Response:**
```json
{
  "venues": [
    {
      "id": "venue_123",
      "name": "Museum of Modern Art",
      "description": "Contemporary art museum featuring...",
      "category": "museum",
      "coordinates": [37.7749, -122.4194],
      "address": "123 Art Street, San Francisco, CA",
      "rating": 4.5,
      "price_range": "$$",
      "hours": {
        "monday": "10:00-18:00",
        "tuesday": "10:00-18:00"
      },
      "images": ["https://example.com/image1.jpg"],
      "tags": ["contemporary", "sculpture", "painting"],
      "qloo_score": 0.95
    }
  ],
  "total": 25,
  "page": 1,
  "has_more": true
}
```

---

### Taste Extraction

#### `POST /api/extract-tastes`
Extract taste preferences from natural language user input.

**Request Body:**
```json
{
  "message": "I love going to jazz clubs and contemporary art galleries. I'm also interested in craft breweries and live theater performances.",
  "context": "user_onboarding"
}
```

**Response:**
```json
{
  "extracted_tastes": ["jazz", "contemporary art", "craft beer", "theater"],
  "confidence_scores": {
    "jazz": 0.92,
    "contemporary art": 0.88,
    "craft beer": 0.85,
    "theater": 0.90
  },
  "suggested_venues": [
    {
      "name": "Blue Note Jazz Club",
      "category": "music_venue",
      "match_score": 0.94
    }
  ]
}
```

---

### Route Refinement

#### `POST /api/refine-route`
Refine and optimize route recommendations based on user feedback.

**Request Body:**
```json
{
  "message": "I want to spend more time at museums and less at restaurants",
  "current_route": [
    {
      "venue_id": "museum_1",
      "duration": 60
    },
    {
      "venue_id": "restaurant_1", 
      "duration": 90
    }
  ],
  "preferences": {
    "total_time": 240,
    "transportation": "walking"
  }
}
```

**Response:**
```json
{
  "refined_route": [
    {
      "venue_id": "museum_1",
      "name": "Art Museum",
      "duration": 120,
      "arrival_time": "14:00",
      "coordinates": [37.7749, -122.4194]
    },
    {
      "venue_id": "museum_2",
      "name": "History Museum", 
      "duration": 90,
      "arrival_time": "16:30",
      "coordinates": [37.7849, -122.4094]
    }
  ],
  "route_metrics": {
    "total_duration": 240,
    "total_distance": 2.3,
    "walking_time": 30,
    "estimated_cost": 45
  },
  "ai_explanation": "I've adjusted your route to spend more time at museums as requested..."
}
```

---

## Data Models

### UserIn
```python
class UserIn(BaseModel):
    tastes: List[str]
    location: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
```

### VenueRequest
```python
class VenueRequest(BaseModel):
    tastes: List[str]
    location: str
    limit: int = 10
    radius: Optional[int] = 5000
    filters: Optional[Dict[str, Any]] = None
```

### ChatRequest
```python
class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    current_route: Optional[List[Dict]] = None
    preferences: Optional[Dict[str, Any]] = None
```

### Venue
```python
class Venue(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    coordinates: List[float]
    address: str
    rating: Optional[float]
    price_range: Optional[str]
    hours: Optional[Dict[str, str]]
    images: List[str] = []
    tags: List[str] = []
    qloo_score: Optional[float]
```

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details",
  "code": 400,
  "timestamp": "2025-08-01T12:00:00Z"
}
```

### Common Error Codes
- **400**: Bad Request - Invalid input parameters
- **401**: Unauthorized - Missing or invalid API key
- **404**: Not Found - Resource not found
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server-side error
- **502**: Bad Gateway - External API error
- **503**: Service Unavailable - Service temporarily down

---

## Rate Limiting

- **Default Limit**: 100 requests per minute per IP
- **Burst Limit**: 10 requests per second
- **Headers**: Rate limit information in response headers
  - `X-RateLimit-Limit`: Total limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Integration Examples

### JavaScript/Frontend
```javascript
// Get venue recommendations
const getVenues = async (tastes, location) => {
  try {
    const response = await fetch('http://localhost:8000/api/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tastes,
        location,
        limit: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.venues;
  } catch (error) {
    console.error('Error fetching venues:', error);
    throw error;
  }
};
```

### Python
```python
import requests

def get_venues(tastes, location):
    url = "http://localhost:8000/api/venues"
    payload = {
        "tastes": tastes,
        "location": location,
        "limit": 10
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()["venues"]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching venues: {e}")
        raise
```

---

## WebSocket Support (Future)

### Real-time Updates
```javascript
// Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'venue_update') {
    updateVenueOnMap(data.venue);
  }
};
```

---

## Testing

### Example Test Cases
```bash
# Health check
curl -X GET http://localhost:8000/health

# Submit onboarding
curl -X POST http://localhost:8000/api/onboarding \
  -H "Content-Type: application/json" \
  -d '{"tastes": ["art", "music"], "location": "New York"}'

# Get venues
curl -X POST http://localhost:8000/api/venues \
  -H "Content-Type: application/json" \
  -d '{"tastes": ["art"], "location": "San Francisco", "limit": 5}'
```

---

For interactive API documentation, visit `http://localhost:8000/docs` when the server is running.
