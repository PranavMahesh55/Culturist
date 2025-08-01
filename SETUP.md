# Quick Setup Instructions

## Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- Git

## Setup Steps

### 1. Clone the Repository
```bash
git clone https://github.com/PranavMahesh55/Culturist.git
cd Culturist
```

### 2. Backend Setup
```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add your API keys:
# QLOO_API_KEY=your_qloo_api_key
# OPENAI_API_KEY=your_openai_api_key
# MONGODB_URI=your_mongodb_connection_string

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup (in new terminal)
```bash
cd culturis-studio

# Install dependencies
npm install

# Start frontend
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Required API Keys
1. **Qloo API Key**: Get from Qloo developer portal
2. **OpenAI API Key**: Get from OpenAI platform
3. **MongoDB**: Use local MongoDB or MongoDB Atlas

## For Judges/Reviewers
All documentation is included:
- `README.md` - Complete project overview
- `API_DOCUMENTATION.md` - API reference
- `ARCHITECTURE.md` - Technical architecture
- `DEPLOYMENT.md` - Deployment guide
- `USER_GUIDE.md` - User instructions
