# Culturis - AI-Powered Cultural Experience Discovery Platform


##  Overview

Culturis is an intelligent cultural venue discovery and route planning platform that leverages Qloo's real-world data and AI to help users discover and plan personalized cultural experiences. The platform combines taste profiling, interactive mapping, and intelligent chatbot assistance to create seamless cultural exploration journeys.

##  Hackathon Submission

This project was built for the Qloo Hackathon, demonstrating innovative use of Qloo's API for cultural venue recommendations and personalized experience planning.

### Key Innovation
- **AI-Powered Taste Extraction**: Natural language processing to understand user preferences
- **Real-Time Cultural Mapping**: Interactive 2D maps with cultural venue overlays
- **Intelligent Route Planning**: Optimized cultural journey planning with time and distance considerations
- **Conversational Interface**: Chat-based refinement of recommendations and routes

##  Features

### Core Functionality
- **Personalized Onboarding**: Interactive taste selection and preference profiling
- **Cultural Venue Discovery**: Real-time recommendations powered by Qloo's data
- **Interactive Mapping**: 2D map views with cultural venue markers
- **Route Planning**: Intelligent multi-venue journey optimization
- **AI Chat Assistant**: Natural language interaction for refining recommendations
- **Taste Extraction**: AI-powered analysis of user descriptions to identify preferences

### Technical Features
- **Real-Time Data**: Live integration with Qloo API for up-to-date venue information
- **Responsive Design**: Modern, mobile-friendly interface
- **Performance Optimized**: Fast loading and smooth interactions
- **Error Handling**: Robust error management and user feedback
- **Accessibility**: WCAG compliant design principles

##  Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Leaflet** - Interactive mapping with custom markers and overlays
- **React-Leaflet** - React integration for Leaflet maps
- **CSS3** - Modern styling with flexbox and grid layouts
- **Fetch API** - HTTP client for backend communication

### Backend
- **FastAPI** - High-performance Python web framework
- **Uvicorn** - ASGI server for FastAPI
- **OpenAI GPT** - AI-powered chat and taste extraction
- **Qloo API** - Cultural venue data and recommendations
- **MongoDB** - Document database for user data and logs
- **Python-dotenv** - Environment variable management

### APIs & Services
- **Qloo API** - Venue recommendations and cultural data
- **OpenAI API** - Natural language processing and chat
- **OpenStreetMap** - Base map tiles and geographic data
- **MongoDB Atlas** - Cloud database hosting

##  Prerequisites

Before running the project, ensure you have:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

### Required API Keys
- **Qloo API Key** - For venue recommendations
- **OpenAI API Key** - For AI chat and taste extraction
- **MongoDB Connection String** - For data persistence

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Qloo
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Add your API keys to .env:
# QLOO_API_KEY=your_qloo_api_key
# OPENAI_API_KEY=your_openai_api_key
# MONGODB_URI=your_mongodb_connection_string

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd culturis-studio

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the development server
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

##  Project Structure

```
Qloo/
├── README.md                    # This file
├── main.py                     # Root application entry
├── test-api.html              # API testing interface
├── test-frontend.html         # Frontend testing interface
├── backend/                   # FastAPI backend
│   ├── main.py               # FastAPI application
│   ├── models.py             # Pydantic models
│   ├── qloo_client.py        # Qloo API integration
│   ├── context.py            # Context building utilities
│   ├── planner.py            # Route planning logic
│   ├── stylist.py            # Response formatting
│   ├── mongo.py              # MongoDB integration
│   ├── vectorRAG.py          # Vector search capabilities
│   ├── configs.py            # Configuration management
│   ├── index.py              # Search indexing
│   ├── categorize_places.py  # Venue categorization
│   ├── explore_places.py     # Venue exploration
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables
│   └── data/                 # Static data files
│       ├── few_shots.json    # Example data
│       └── qloo_tags.json    # Qloo tag mappings
└── culturis-studio/          # React frontend
    ├── public/               # Static assets
    ├── src/                  # Source code
    │   ├── App.js           # Main application
    │   ├── components/      # React components
    │   │   ├── AboutPage.js          # Onboarding page
    │   │   ├── ChatbotPanel.js       # AI chat interface
    │   │   ├── Simple2DMapView.js    # 2D map component
    │   │   ├── TasteSeedPicker.js    # Taste selection
    │   │   ├── VenueDrawer.js        # Venue details
    │   │   ├── RoutePlanner.js       # Route planning
    │   │   └── ...                   # Other components
    │   └── hooks/           # Custom React hooks
    ├── package.json         # Node.js dependencies
    └── .env                 # Environment variables
```

##  Configuration

### Backend Environment (.env)
```bash
QLOO_API_KEY=your_qloo_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/culturis
ENVIRONMENT=development
```

### Frontend Environment (.env)
```bash
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

##  Deployment

### Backend Deployment
```bash
# Production server
uvicorn main:app --host 0.0.0.0 --port 8000

# With Gunicorn (recommended for production)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve static files
npx serve -s build -l 3000
```

##  API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /api/onboarding` - User taste profiling
- `POST /api/venues` - Get venue recommendations
- `POST /api/extract-tastes` - Extract tastes from text
- `POST /api/refine-route` - Refine route recommendations

### Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

##  Testing

### Backend Tests
```bash
cd backend
python -m pytest test_*.py
```

### Frontend Tests
```bash
cd culturis-studio
npm test
```

##  UI/UX Features

- **Modern Design**: Clean, intuitive interface with cultural theming
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Interactive Maps**: Smooth zooming, panning, and venue selection
- **Real-time Updates**: Live venue data and route recalculation
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Optimized loading and smooth animations

## 🔍 Key Components

### Taste Profiling
- Interactive onboarding flow
- Visual taste selection interface
- AI-powered preference extraction from natural language

### Venue Discovery
- Real-time Qloo API integration
- Intelligent filtering and ranking
- Cultural venue categorization

### Map Integration
- Custom cultural venue markers
- Route visualization
- Interactive venue selection

### AI Assistant
- Natural language query processing
- Context-aware recommendations
- Route refinement capabilities

##  Contributing

This project was built for the Qloo Hackathon. For questions or suggestions:

1. Create detailed issue descriptions
2. Follow existing code style and patterns
3. Include tests for new features
4. Update documentation as needed

##  License

This project is proprietary and was created for the Qloo Hackathon.

##  Acknowledgments

- **Qloo** - For providing the amazing cultural venue API and hackathon opportunity
- **OpenAI** - For GPT API that powers our intelligent features
- **OpenStreetMap** - For the mapping infrastructure
- **React & FastAPI Communities** - For the excellent frameworks

##  Support

For hackathon-related questions or technical support, please contact the development team.

---

**Built with ❤️ for the Qloo Hackathon**
