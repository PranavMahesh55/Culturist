# Culturis Technical Architecture

## System Overview

Culturis is built as a modern full-stack application with a clear separation between frontend and backend services, designed for scalability and maintainability.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   React Client  │◄──►│  FastAPI Server  │◄──►│   Qloo API      │
│   (Port 3000)   │    │   (Port 8000)    │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       
         │                       ▼                       
         │              ┌──────────────────┐             
         │              │                  │             
         │              │   MongoDB Atlas  │             
         │              │                  │             
         │              └──────────────────┘             
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌──────────────────┐             
│                 │    │                  │             
│  OpenStreetMap  │    │   OpenAI API     │             
│     Tiles       │    │                  │             
│                 │    │                  │             
└─────────────────┘    └──────────────────┘             
```

## Frontend Architecture

### Technology Stack
- **React 18**: Modern functional components with hooks
- **Leaflet**: Interactive mapping library
- **Native Fetch**: HTTP client for API communication
- **CSS3**: Modern styling with custom properties

### Component Hierarchy
```
App
├── WelcomePage
├── AboutPage (Onboarding)
│   └── TasteSeedPicker
├── PaintMyMapPage
│   ├── Simple2DMapView
│   │   ├── VenueDrawer
│   │   └── NavigationPanel
│   ├── ChatbotPanel
│   └── RoutePlanner
├── HowItWorksPage
└── DemoGuide
```

### Key Frontend Components

#### 1. TasteSeedPicker
- **Purpose**: User preference selection and onboarding
- **Features**: 
  - Visual taste selection interface
  - Category-based filtering
  - Real-time preference updates
- **API Integration**: Submits to `/api/onboarding`

#### 2. Simple2DMapView
- **Purpose**: Main mapping interface
- **Features**:
  - Interactive Leaflet map
  - Custom venue markers
  - Route visualization
  - Real-time venue loading
- **State Management**: Manages venues, routes, and map interactions

#### 3. ChatbotPanel
- **Purpose**: AI-powered conversation interface
- **Features**:
  - Natural language processing
  - Taste extraction from user input
  - Route refinement suggestions
- **API Integration**: 
  - `/api/extract-tastes`
  - `/api/refine-route`

#### 4. VenueDrawer
- **Purpose**: Detailed venue information display
- **Features**:
  - Venue details and images
  - Reviews and ratings
  - Action buttons (directions, save)

### State Management
- **Local State**: Component-level state with useState
- **Prop Drilling**: Parent-to-child data flow
- **Context**: Minimal use for global application state

### API Communication
```javascript
// Example API call pattern
const response = await fetch('http://localhost:8000/api/venues', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestData)
});
```

## Backend Architecture

### Technology Stack
- **FastAPI**: Modern Python web framework
- **Uvicorn**: High-performance ASGI server
- **Pydantic**: Data validation and serialization
- **Motor**: Async MongoDB driver
- **OpenAI**: GPT API integration

### Service Layer Architecture

#### 1. Main Application (main.py)
- **FastAPI app initialization**
- **CORS middleware configuration**
- **Route definitions**
- **Error handling**

#### 2. Data Models (models.py)
```python
class UserIn(BaseModel):
    tastes: List[str]
    location: Optional[str] = None

class VenueRequest(BaseModel):
    tastes: List[str]
    location: str
    limit: int = 10

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
```

#### 3. Qloo Integration (qloo_client.py)
- **API client wrapper**
- **Request/response handling**
- **Data transformation**
- **Error handling and retries**

#### 4. AI Services (context.py, stylist.py)
- **OpenAI GPT integration**
- **Prompt engineering**
- **Response formatting**
- **Context building**

### API Endpoints

#### Core Endpoints
```python
@app.post("/api/onboarding")
async def submit_onboarding(user_data: UserIn)

@app.post("/api/venues")
async def get_venues(request: VenueRequest)

@app.post("/api/extract-tastes")
async def extract_tastes(request: ChatRequest)

@app.post("/api/refine-route")
async def refine_route(request: ChatRequest)

@app.get("/health")
async def health_check()
```

## Data Flow

### 1. User Onboarding Flow
```
User Selection → TasteSeedPicker → POST /api/onboarding → MongoDB → Response
```

### 2. Venue Discovery Flow
```
Map Interaction → Simple2DMapView → POST /api/venues → Qloo API → Processed Results → Map Update
```

### 3. Chat Interaction Flow
```
User Message → ChatbotPanel → POST /api/extract-tastes → OpenAI API → Taste Analysis → Venue Update
```

## External API Integration

### Qloo API
- **Endpoint**: Cultural venue recommendations
- **Authentication**: API key in headers
- **Rate Limiting**: Handled with retry logic
- **Data Processing**: Custom transformation for UI needs

### OpenAI API
- **Model**: GPT-3.5/4 for natural language processing
- **Use Cases**:
  - Taste extraction from user descriptions
  - Route refinement suggestions
  - Conversational responses

### MongoDB Atlas
- **Collections**:
  - `users`: User profiles and preferences
  - `logs`: Application logs and analytics
  - `venues`: Cached venue data (if needed)

## Performance Considerations

### Frontend Optimizations
- **Component Memoization**: React.memo for expensive components
- **Lazy Loading**: Dynamic imports for route components
- **Image Optimization**: Compressed assets and lazy loading
- **Bundle Splitting**: Code splitting for smaller initial loads

### Backend Optimizations
- **Async Operations**: All I/O operations are async
- **Connection Pooling**: MongoDB connection pooling
- **Caching**: In-memory caching for frequent requests
- **Request Batching**: Efficient API calls to external services

## Security Measures

### API Security
- **CORS Configuration**: Restricted origins in production
- **Input Validation**: Pydantic model validation
- **Error Handling**: No sensitive data in error responses
- **Rate Limiting**: Protection against abuse

### Data Protection
- **Environment Variables**: Sensitive data in .env files
- **API Key Management**: Secure storage and rotation
- **Data Sanitization**: Clean user inputs before processing

## Deployment Architecture

### Development Environment
```
Frontend (localhost:3000) ← → Backend (localhost:8000) ← → External APIs
```

### Production Environment
```
Load Balancer → Frontend (CDN) → Backend (Multiple Instances) → Database Cluster
```

## Monitoring and Logging

### Application Logging
- **Backend**: Structured logging with context
- **Frontend**: Error tracking and user analytics
- **Database**: Query performance monitoring

### Health Checks
- **Backend**: `/health` endpoint for service monitoring
- **Database**: Connection status checks
- **External APIs**: Dependency health monitoring

## Scalability Considerations

### Horizontal Scaling
- **Stateless Backend**: Easy to replicate instances
- **Database Sharding**: MongoDB horizontal scaling
- **CDN Distribution**: Frontend asset distribution

### Performance Monitoring
- **Response Times**: API endpoint performance tracking
- **Error Rates**: System reliability monitoring
- **Resource Usage**: CPU, memory, and database metrics

## Development Workflow

### Code Organization
- **Modular Design**: Separate concerns and responsibilities
- **Type Safety**: Pydantic models and TypeScript (if added)
- **Error Handling**: Comprehensive error management
- **Testing**: Unit and integration test coverage

### Deployment Pipeline
1. **Development**: Local development and testing
2. **Staging**: Integration testing environment
3. **Production**: Live deployment with monitoring

This architecture provides a solid foundation for the Culturis application, ensuring scalability, maintainability, and excellent user experience.
