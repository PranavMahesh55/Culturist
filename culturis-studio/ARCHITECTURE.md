# CultureCanvas Architecture Documentation

## Overview
CultureCanvas is a React-based web application that provides a professional, interactive 2D map experience for discovering culturally-relevant venues based on user-selected tastes and location. The app uses real venue data from the Qloo API via a FastAPI backend.

## Frontend Architecture

### Main Components

#### 1. PaintMyMapPage.js (Main Page)
- **Layout**: 3-section layout with NavigationPanel (left), MapView (center), ChatbotPanel (right)
- **State Management**: Manages location and taste state throughout the app
- **Map Integration**: Uses only Simple2DMapView for a fast, reliable 2D map experience

#### 2. NavigationPanel.js (Left Sidebar)
- **Purpose**: User location input and taste selection interface
- **Features**:
  - Auto-suggestion dropdown for popular cities
  - Professional react-icons iconography
  - Clean, production-ready styling
  - Keyboard and mouse navigation support
- **Icons Used**: FiMapPin, FiSearch, FiChevronDown, etc.

#### 3. Simple2DMapView.js (Map Section)
- **Technology**: Leaflet + react-leaflet for interactive 2D mapping
- **Features**:
  - Custom numbered, color-coded markers
  - Real venue popups with cultural match details
  - Loading overlays and smooth interactions
  - Responsive design
- **Data Source**: Fetches from `/api/venues` endpoint with fallback to mock data

#### 4. ChatbotPanel.js (Right Sidebar) ✅ COMPLETED
- **Purpose**: AI-powered cultural discovery assistant
- **Features**:
  - Professional react-icons throughout (no emojis)
  - Interactive chat interface with LLM integration
  - Taste extraction from natural language
  - Real-time venue recommendation updates
  - Statistics tracking and quick suggestions
- **Icons Used**: 
  - `FiMessageSquare` - Chat header
  - `RiRobotLine` - Bot avatar (professional AI representation)
  - `FiUser` - User avatar
  - `FiSend`, `FiLoader` - Input controls
  - `HiLightBulb`, `FiTarget` - Quick suggestions
  - `HiSparkles` - Discovered interests
  - `FiTrendingUp` - Statistics

#### 5. TasteSeedPicker.js
- **Purpose**: Taste selection interface with search and trending options
- **Features**: Fuzzy search, local/remote taste catalogs, accessibility features

## Backend Architecture

### FastAPI Backend (/backend/)
- **main.py**: FastAPI server with CORS configuration
- **qloo_client.py**: Qloo API integration for venue recommendations
- **planner.py**: Cultural matching and venue processing logic
- **/api/venues**: Main endpoint for fetching real venue data based on tastes and location

### Key Features:
- Real venue names, types, and coordinates
- Cultural match explanations based on user tastes
- Filtering for culturally-relevant venues
- Error handling and fallback mechanisms

## Design System

### Icon Library
- **Primary**: react-icons (professional, consistent iconography)
- **Removed**: All emoji usage for production-ready appearance
- **Categories Used**:
  - Feather Icons (Fi*): Primary UI elements
  - Heroicons (Hi*): Special elements (sparkles, lightbulb)
  - Remix Icons (Ri*): Specialized icons (robot for AI)

### Color Scheme
- **Primary Gradient**: #667eea to #764ba2 (headers, buttons)
- **Secondary**: #3b82f6 to #1e40af (user elements)
- **Neutral**: Modern grays and whites for content areas
- **Accent Colors**: Dynamic colors for taste categories

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px, 1024px
- Adaptive UI components (hidden elements on mobile)
- Touch-friendly interactions

## Data Flow

1. **User Input**: Location selection and taste preferences in NavigationPanel
2. **State Management**: PaintMyMapPage manages and passes state to all components
3. **API Calls**: Simple2DMapView fetches venues from FastAPI backend
4. **Venue Processing**: Backend integrates with Qloo API for real recommendations
5. **Map Display**: Interactive markers and popups show venue details
6. **Chat Enhancement**: ChatbotPanel extracts additional tastes from conversations

## Development Standards

### Code Quality
- ✅ All components use professional react-icons
- ✅ No console errors or import issues
- ✅ Accessibility considerations (ARIA labels, keyboard navigation)
- ✅ Responsive design patterns
- ✅ Error handling and loading states

### Performance
- Efficient re-rendering with React hooks
- Lazy loading and debounced search
- Optimized API calls with caching
- Lightweight 2D mapping instead of heavy 3D libraries

### Production Readiness
- ✅ Professional UI suitable for launch
- ✅ Real data integration (no mock data dependencies)
- ✅ Comprehensive error handling
- ✅ Clean, maintainable codebase
- ✅ Documentation for future developers

## Recent Improvements

### ChatbotPanel Refactor (Completed)
1. **Icon Standardization**: Replaced all emoji/CSS icons with react-icons
2. **Professional Appearance**: Production-ready styling and layout
3. **Fixed Import Errors**: Resolved FiLightbulb → HiLightBulb
4. **Enhanced UX**: Better AI representation with RiRobotLine
5. **Code Cleanup**: Removed unused variables and imports

### NavigationPanel Enhancement (Completed)
1. **Professional Icons**: Integrated react-icons throughout
2. **Auto-suggestion**: Added city dropdown with keyboard support
3. **Layout Optimization**: Removed clutter, improved spacing
4. **Production Polish**: Launch-ready appearance

## Next Steps (Optional)
- Geocoding for arbitrary locations (beyond popular cities)
- Enhanced venue type filtering and categorization
- Performance monitoring and optimization
- Additional LLM integrations for chat functionality
- A/B testing for user experience improvements

---

This architecture provides a solid foundation for a modern, scalable, and professional cultural discovery application.
