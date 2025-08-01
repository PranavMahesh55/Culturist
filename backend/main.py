import os
import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from models import UserIn, UserDB, ChatRequest, Plan, ChatResponse
from context import build_context
from planner import plan_qloo_call
from qloo_client import call_qloo, build_qloo_json, top_clusters
from stylist import prettify_answers
from mongo import logs_col
load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:5000",
        "http://localhost:5001",
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:5001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
mongo = AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = mongo.myOnboardingDB
@app.post('/api/onboarding')
async def onboarding(user:UserIn) -> Any:
    try:
        doc = user.dict()
        doc['createdAt'] = datetime.utcnow()
        result = await db.users.insert_one(doc)
        created = await db.users.find_one({"_id": result.inserted_id})
        created['_id'] = str(created['_id']) 
        return {"success": True, "user": UserDB(**created)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
@app.post('/api/chat')
async def chat(req: ChatRequest) -> Any:
    user_query = req.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Empty query")
    try:
        context = build_context(user_query)
        planner_result = plan_qloo_call(user_query, context)
        raw_qloo = await call_qloo(
            planner_result["endpoint"],
            planner_result["params"]
        )
        extractor_json = {
            "user": user_query,
            "qloo_request": {
                "endpoint": planner_result["endpoint"],
                "params": planner_result["params"]
            }
        }
        qloo_package = build_qloo_json(extractor_json, raw_qloo)
        pretty = prettify_answers(user_query, qloo_package)
        await logs_col.insert_one({
            "user_query": user_query,
            "planner_result": planner_result,
            "qloo_response": raw_qloo,
            "pretty_response": pretty,
            "createdAt": datetime.utcnow()
        })
        plan = Plan(
            endpoint=planner_result["endpoint"],
            params=planner_result["params"]
        )
        return ChatResponse(plan=plan, qlooData=qloo_package, pretty=pretty)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get('/api/qloo-search')
async def qloo_search(q: str) -> Any:
    try:
        params = {
            'filter.type': 'urn:entity:place',
            'filter.location.query': 'New York, NY',
            'filter.location.radius': '50000',
            'limit': 20
        }
        response = await call_qloo('/v2/insights', params)
        entities = response.get("results", {}).get("entities", [])
        matching_entities = []
        query_lower = q.lower()
        for entity in entities:
            name = entity.get("name", "").lower()
            tags = entity.get("tags", [])
            keywords = entity.get("properties", {}).get("keywords", [])
            if query_lower in name:
                matching_entities.append(entity)
                continue
            for tag in tags:
                tag_name = tag.get("name", "").lower()
                if query_lower in tag_name:
                    matching_entities.append(entity)
                    break
            if not any(query_lower in name for _ in [None]):
                for keyword in keywords:
                    keyword_name = keyword.get("name", "").lower()
                    if query_lower in keyword_name:
                        matching_entities.append(entity)
                        break
        return {
            "success": True,
            "results": {
                "entities": matching_entities[:10]
            }
        }
    except Exception as e:
        print(f"Error in qloo-search endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get('/api/qloo-insights')
async def qloo_insights(
    filter_type: str = "urn:entity:place",
    filter_location_query: str = "New York, NY", 
    filter_location_radius: str = "10000",
    limit: str = "0"
) -> Any:
    """Get Qloo insights for trending data"""
    try:
        params = {
            'filter.type': filter_type,
            'filter.location.query': filter_location_query,
            'filter.location.radius': filter_location_radius,
            'limit': limit
        }
        response = await call_qloo('/v2/insights', params)
        entities = response.get("results", {}).get("entities", [])
        clusters = top_clusters(response, k=5)
        return {
            "success": True,
            "results": {
                "entities": entities,
                "clusters": clusters
            }
        }
    except Exception as e:
        print(f"Error in qloo-insights endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.post('/api/extract-tastes')
async def extract_tastes(req: dict) -> Any:
    try:
        message = req.get("message", "").strip()
        existing_tastes = req.get("existing_tastes", [])
        location = req.get("location", "New York, NY")
        if not message:
            raise HTTPException(status_code=400, detail="Empty message")
        system_prompt = f"""You are a cultural taste extraction AI. Analyze user messages and extract specific cultural interests, activities, and venue types.
Location context: {location}
Existing tastes: {', '.join(existing_tastes)}
Extract new cultural tastes from the user's message. Return a JSON array of taste objects with this format:
{{"id": "unique_id", "name": "Taste Name", "color": "
Focus on:
- Specific venue types (jazz clubs, art galleries, bookstores, etc.)
- Activity preferences (live music, rooftop dining, craft cocktails, etc.)  
- Cultural interests (contemporary art, vintage shopping, local cuisine, etc.)
- Ambiance preferences (intimate, vibrant, quiet, social, etc.)
Only extract tastes that are clearly mentioned or strongly implied. Avoid duplicating existing tastes.
Return valid JSON only, no explanations."""
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.3,
            max_tokens=500
        )
        extracted_content = response.choices[0].message.content.strip()
        import json
        try:
            extracted_tastes = json.loads(extracted_content)
            if not isinstance(extracted_tastes, list):
                extracted_tastes = []
        except json.JSONDecodeError:
            extracted_tastes = mock_extract_tastes(message)
        return {
            "success": True,
            "extracted_tastes": extracted_tastes,
            "message": message,
            "location": location
        }
    except Exception as e:
        print(f"Error in extract-tastes endpoint: {e}")
        return {
            "success": True,
            "extracted_tastes": mock_extract_tastes(req.get("message", "")),
            "message": req.get("message", ""),
            "location": req.get("location", "New York, NY")
        }
def mock_extract_tastes(message):
    lower_message = message.lower()
    extracted_tastes = []
    taste_keywords = {
        'jazz': {"id": "jazz_music", "name": "Jazz Music", "color": "#8E44AD"},
        'coffee': {"id": "specialty_coffee", "name": "Specialty Coffee", "color": "#A0522D"},
        'art': {"id": "contemporary_art", "name": "Contemporary Art", "color": "#2E8B57"},
        'gallery': {"id": "art_galleries", "name": "Art Galleries", "color": "#4682B4"},
        'food': {"id": "gourmet_food", "name": "Gourmet Food", "color": "#CD853F"},
        'restaurant': {"id": "fine_dining", "name": "Fine Dining", "color": "#B22222"},
        'music': {"id": "live_music", "name": "Live Music", "color": "#FF6347"},
        'vintage': {"id": "vintage_shops", "name": "Vintage Shopping", "color": "#DAA520"},
        'books': {"id": "bookstores", "name": "Independent Bookstores", "color": "#483D8B"},
        'craft': {"id": "craft_beer", "name": "Craft Beer", "color": "#D2691E"},
        'outdoor': {"id": "outdoor_activities", "name": "Outdoor Activities", "color": "#228B22"},
        'theater': {"id": "theater", "name": "Theater & Performance", "color": "#8B008B"},
        'local': {"id": "local_culture", "name": "Local Culture", "color": "#556B2F"},
        'hidden': {"id": "hidden_gems", "name": "Hidden Gems", "color": "#708090"},
        'rooftop': {"id": "rooftop_venues", "name": "Rooftop Venues", "color": "#FF69B4"},
        'cocktail': {"id": "craft_cocktails", "name": "Craft Cocktails", "color": "#20B2AA"},
        'museum': {"id": "museums", "name": "Museums", "color": "#9932CC"},
        'market': {"id": "local_markets", "name": "Local Markets", "color": "#32CD32"},
        'nightlife': {"id": "nightlife", "name": "Nightlife", "color": "#FF1493"}
    }
    for keyword, taste in taste_keywords.items():
        if keyword in lower_message:
            extracted_tastes.append(taste)
    return extracted_tastes
@app.post('/api/venues')
async def get_venues(request: dict) -> Any:
    try:
        tastes = request.get('tastes', [])
        location = request.get('location', 'New York, NY')
        user_coords = request.get('coordinates', [40.7589, -73.9851])
        if not tastes:
            raise HTTPException(status_code=400, detail="No cultural tastes provided")
        taste_urns = []
        taste_names = []
        for taste in tastes:
            taste_id = taste.get('id', '')
            taste_name = taste.get('name', '')
            taste_names.append(taste_name)
            if taste_id and taste_id.startswith('urn:'):
                taste_urns.append(taste_id)
            else:
                taste_urns.append(taste_id)
        print(f"🎭 Using taste URNs for personalized recommendations: {taste_urns}")
        print(f"🏷️ Taste names for matching: {taste_names}")
        print(f"📍 Location: {location}")
        params = {
            'filter.type': 'urn:entity:place',
            'filter.location.query': location,
            'filter.location.radius': '10000',  
            'limit': '50'  
        }
        taste_categories = []
        for taste in tastes:
            taste_name = taste.get('name', '').lower()
            taste_id = taste.get('id', '')
            if 'artist:' in taste_id or any(word in taste_name for word in ['music', 'concert', 'jazz', 'live', 'band', 'artist']):
                taste_categories.append('music_entertainment')
            elif 'beverage:' in taste_id or any(word in taste_name for word in ['coffee', 'cafe', 'beer', 'wine', 'cocktail', 'bar', 'brew']):
                taste_categories.append('food_beverage')
            elif 'food:' in taste_id or 'cuisine:' in taste_id or any(word in taste_name for word in ['restaurant', 'food', 'dining', 'cuisine', 'kitchen']):
                taste_categories.append('food_beverage')
            elif any(word in taste_name for word in ['art', 'gallery', 'museum', 'creative', 'contemporary', 'design']):
                taste_categories.append('arts_culture')
            elif any(word in taste_name for word in ['shop', 'boutique', 'vintage', 'fashion', 'market']):
                taste_categories.append('shopping_markets')
            else:
                taste_categories.append('general_cultural')
        venue_filters = []
        if 'food_beverage' in taste_categories:
            venue_filters.extend(['urn:tag:genre:place:Restaurant', 'urn:tag:category:place:Restaurant'])
        if 'arts_culture' in taste_categories:
            venue_filters.extend(['urn:tag:genre:place:Museum', 'urn:tag:category:place:Art Museum'])
        if 'music_entertainment' in taste_categories:
            venue_filters.extend(['urn:tag:category:place:Event Venue', 'urn:tag:genre:place:Arena'])
        if 'shopping_markets' in taste_categories:
            venue_filters.extend(['urn:tag:category:place:Market', 'urn:tag:category:place:Shopping Mall'])
        params = {
            'filter.type': 'urn:entity:place',
            'filter.location.query': location,
            'filter.location.radius': '10000',  
            'limit': '20'  
        }
        print(f"🔍 Making single optimized API call...")
        response = await call_qloo('/v2/insights', params)
        entities = response.get('results', {}).get('entities', [])
        print(f"🏢 Processing {len(entities)} diverse entities from Qloo")
        cultural_entities = []
        for entity in entities:
            name = entity.get('name', '').lower()
            tags = entity.get('tags', [])
            skip_keywords = [
                'airport', 'international airport', 'medical center', 'hospital', 'urgent care',
                'gas station', 'auto repair', 'car wash', 'pharmacy chain', 'cvs', 'walgreens',
                'dentist office', 'veterinary', 'bank branch', 'atm', 'post office'
            ]
            if any(skip in name for skip in skip_keywords):
                continue
            is_cultural = False
            cultural_tag_types = {
                'urn:tag:category:place': ['restaurant', 'museum', 'art museum', 'market', 'cafe', 'deli', 'event venue'],
                'urn:tag:genre:place': ['restaurant', 'museum', 'art museum', 'market', 'deli', 'arena'],
                'urn:tag:amenity:place': ['restaurant', 'bar', 'cafe'],
                'urn:tag:offerings:place': ['comfort food', 'happy hour', 'live music']
            }
            for tag in tags:
                tag_name = tag.get('name', '').lower()
                tag_type = tag.get('type', '')
                if tag_type in cultural_tag_types:
                    if any(cultural_word in tag_name for cultural_word in cultural_tag_types[tag_type]):
                        is_cultural = True
                        break
            cultural_name_indicators = [
                'museum', 'gallery', 'market', 'deli', 'restaurant', 'cafe', 'bar', 'lounge',
                'center', 'house', 'theater', 'studio', 'kitchen', 'bistro', 'tavern',
                'club', 'palace', 'hall', 'room', 'eataly', 'katz', 'beauty & essex'
            ]
            if any(indicator in name for indicator in cultural_name_indicators):
                is_cultural = True
            if any(tag.get('name', '').lower() in ['tourist attraction', 'historical landmark', 'monument'] 
                   for tag in tags):
                is_cultural = True
            if is_cultural:
                cultural_entities.append(entity)
        print(f"🎭 Found {len(cultural_entities)} cultural venues after filtering")
        if len(cultural_entities) < 8:
            for entity in entities:
                if entity not in cultural_entities:
                    name = entity.get('name', '').lower()
                    if not any(skip in name for skip in ['airport', 'medical', 'hospital', 'gas station', 'auto', 'pharmacy']):
                        cultural_entities.append(entity)
                        if len(cultural_entities) >= 12:
                            break
        def calculate_taste_match_score(entity, user_tastes):
            """Calculate how well a venue matches user's taste profile"""
            score = 0.5  
            venue_name = entity.get('name', '').lower()
            venue_tags = entity.get('tags', [])
            venue_keywords = entity.get('properties', {}).get('keywords', [])
            for taste in user_tastes:
                taste_name = taste.get('name', '').lower()
                taste_id = taste.get('id', '')
                if any(word in venue_name for word in taste_name.split() if len(word) > 3):
                    score += 0.2
                if 'artist:' in taste_id:
                    music_indicators = ['music', 'concert', 'venue', 'club', 'bar', 'lounge']
                    if any(indicator in venue_name or 
                          any(indicator in tag.get('name', '').lower() for tag in venue_tags)
                          for indicator in music_indicators):
                        score += 0.15
                elif 'beverage:' in taste_id:
                    beverage_indicators = ['bar', 'cafe', 'coffee', 'brewery', 'wine', 'cocktail']
                    if any(indicator in venue_name or
                          any(indicator in tag.get('name', '').lower() for tag in venue_tags)
                          for indicator in beverage_indicators):
                        score += 0.15
                elif 'food:' in taste_id or 'cuisine:' in taste_id:
                    food_indicators = ['restaurant', 'kitchen', 'dining', 'food', 'eatery', 'bistro']
                    if any(indicator in venue_name or
                          any(indicator in tag.get('name', '').lower() for tag in venue_tags)
                          for indicator in food_indicators):
                        score += 0.15
                for tag in venue_tags:
                    tag_name = tag.get('name', '').lower()
                    if any(word in tag_name for word in taste_name.split() if len(word) > 3):
                        score += 0.1
                for keyword in venue_keywords[:5]:
                    keyword_name = keyword.get('name', '').lower()
                    if any(word in keyword_name for word in taste_name.split() if len(word) > 3):
                        score += 0.05
            return min(score, 0.95)  
        scored_entities = []
        for entity in cultural_entities:
            taste_score = calculate_taste_match_score(entity, tastes)
            entity['taste_match_score'] = taste_score
            scored_entities.append(entity)
        scored_entities.sort(key=lambda e: e.get('taste_match_score', 0.5), reverse=True)
        top_matched_entities = scored_entities[:15]
        print(f"🎯 Top venue taste scores: {[(e.get('name', '')[:20], round(e.get('taste_match_score', 0.5), 2)) for e in top_matched_entities[:5]]}")
        all_venues = []
        for i, entity in enumerate(top_matched_entities):
            venue_name = entity.get('name', f'Local Venue {i+1}')
            venue_type = 'Cultural Venue'
            skip_keywords = [
                'veterinary', 'hospital', 'medical', 'pharmacy', 'gas station', 'auto', 'car wash',
                'applebee', 'wendy', 'mcdonald', 'burger king', 'taco bell', 'subway', 'domino',
                'pizza hut', 'kfc', 'popeyes', 'chipotle', 'panera', 'starbucks chain',
                'cvs', 'walgreens', 'rite aid', 'walmart', 'target', 'home depot',
                'harley-davidson', 'ford', 'toyota', 'honda', 'bmw', 'mercedes'
            ]
            if any(skip in venue_name.lower() for skip in skip_keywords):
                continue
            venue_type = 'Cultural Venue'  
            tags = entity.get('tags', [])
            venue_type_hierarchy = [
                (['urn:tag:category:place:American Restaurant', 'urn:tag:category:place:Italian Restaurant', 
                  'urn:tag:category:place:Jewish Restaurant'], 'Restaurant'),
                (['urn:tag:category:place:Deli', 'urn:tag:genre:place:Deli'], 'Deli'),
                (['urn:tag:category:place:Cafe', 'urn:tag:amenity:place:Cafe'], 'Cafe'),
                (['urn:tag:genre:place:Restaurant'], 'Restaurant'),
                (['urn:tag:amenity:place:Bar', 'urn:tag:amenity:place:Bar / Lounge'], 'Bar'),
                (['urn:tag:category:place:Art Museum', 'urn:tag:genre:place:Art Museum'], 'Art Museum'),
                (['urn:tag:category:place:Modern Art Museum', 'urn:tag:genre:place:Modern Art Museum'], 'Modern Art Museum'),
                (['urn:tag:category:place:Museum', 'urn:tag:genre:place:Museum'], 'Museum'),
                (['urn:tag:category:place:Market', 'urn:tag:genre:place:Market'], 'Market'),
                (['urn:tag:category:place:Shopping Mall'], 'Shopping Mall'),
                (['urn:tag:category:place:Event Venue', 'urn:tag:genre:place:Event Venue'], 'Event Venue'),
                (['urn:tag:category:place:Arena', 'urn:tag:genre:place:Arena'], 'Arena'),
                (['urn:tag:genre:place:Stadium'], 'Stadium'),
                (['urn:tag:genre:place:Tourist Attraction'], 'Tourist Attraction'),
                (['urn:tag:category:place:Tourist Attraction'], 'Tourist Attraction'),
                (['urn:tag:category:place:Historical Landmark'], 'Historical Landmark'),
                (['urn:tag:category:place:Park', 'urn:tag:genre:place:Park'], 'Park'),
                (['urn:tag:category:place:Garden'], 'Garden')
            ]
            for tag_patterns, type_name in venue_type_hierarchy:
                for tag in tags:
                    tag_type_name = f"{tag.get('type', '')}:{tag.get('name', '')}"
                    if tag_type_name in tag_patterns:
                        venue_type = type_name
                        break
                if venue_type != 'Cultural Venue':
                    break
            if venue_type == 'Cultural Venue':
                name_lower = venue_name.lower()
                if 'deli' in name_lower or 'delicatessen' in name_lower:
                    venue_type = 'Deli'
                elif any(word in name_lower for word in ['museum', 'guggenheim', 'whitney']):
                    venue_type = 'Museum'
                elif 'market' in name_lower:
                    venue_type = 'Market'
                elif any(word in name_lower for word in ['restaurant', 'kitchen', 'house']) and 'museum' not in name_lower:
                    venue_type = 'Restaurant'
                elif any(word in name_lower for word in ['cafe', 'coffee']):
                    venue_type = 'Cafe'
                elif any(word in name_lower for word in ['bar', 'tavern', 'lounge']):
                    venue_type = 'Bar'
                elif any(word in name_lower for word in ['center', 'arena', 'garden']) and 'medical' not in name_lower:
                    if 'garden' in name_lower:
                        venue_type = 'Garden'
                    else:
                        venue_type = 'Event Venue'
                elif 'park' in name_lower:
                    venue_type = 'Park'
            base_affinity = float(entity.get('query', {}).get('affinity', 0.7))
            popularity = float(entity.get('popularity', 0.5))
            distance = float(entity.get('query', {}).get('distance', 2000))
            affinity_score = base_affinity * 100
            if popularity > 0.7:
                affinity_score += 10  
            if distance < 1000:
                affinity_score += 5   
            affinity_score = min(95, max(60, affinity_score))  
            rating = 3.5 + (popularity * 1.3) + (base_affinity * 0.5)
            rating = min(5.0, max(3.0, rating))
            coordinates = [user_coords[0], user_coords[1]]  
            if 'location' in entity and entity['location']:
                loc = entity['location']
                if 'lat' in loc and 'lng' in loc:
                    try:
                        lat = float(loc['lat'])
                        lng = float(loc['lng'])
                        if -90 <= lat <= 90 and -180 <= lng <= 180:
                            coordinates = [lat, lng]
                    except (ValueError, TypeError):
                        pass  
            if coordinates == [user_coords[0], user_coords[1]]:
                offset_lat = (random.random() - 0.5) * 0.02  
                offset_lng = (random.random() - 0.5) * 0.02
                coordinates = [user_coords[0] + offset_lat, user_coords[1] + offset_lng]
            cultural_matches = []
            venue_tags = entity.get('tags', [])
            venue_keywords = entity.get('properties', {}).get('keywords', [])
            venue_name_lower = venue_name.lower()
            for taste in tastes[:4]:  
                taste_name = taste.get('name', '').lower()
                taste_type = taste.get('type', '').lower()
                if any(word in venue_name_lower for word in taste_name.split() if len(word) > 2):
                    cultural_matches.append(taste.get('name', ''))
                    continue
                tag_match = False
                for tag in venue_tags:
                    tag_name = tag.get('name', '').lower()
                    tag_type = tag.get('type', '').lower()
                    if any(word in tag_name for word in taste_name.split() if len(word) > 2):
                        cultural_matches.append(taste.get('name', ''))
                        tag_match = True
                        break
                    if taste_type == 'food_beverage' and tag_type in ['venue_type', 'business_type']:
                        if any(food_word in tag_name for food_word in ['restaurant', 'cafe', 'coffee', 'bar', 'dining', 'food', 'drink']):
                            cultural_matches.append(taste.get('name', ''))
                            tag_match = True
                            break
                    if taste_type == 'visual_arts' and tag_type in ['venue_type', 'category']:
                        if any(art_word in tag_name for art_word in ['gallery', 'museum', 'art', 'studio', 'exhibition', 'creative']):
                            cultural_matches.append(taste.get('name', ''))
                            tag_match = True
                            break
                if tag_match:
                    continue
                for keyword in venue_keywords[:8]:  
                    keyword_name = keyword.get('name', '').lower()
                    if any(word in keyword_name or keyword_name in word 
                          for word in taste_name.split() if len(word) > 3):
                        cultural_matches.append(taste.get('name', ''))
                        break
                venue_type_mappings = {
                    'contemporary art': ['gallery', 'museum', 'art', 'creative', 'design'],
                    'specialty coffee': ['coffee', 'cafe', 'espresso', 'roast', 'brew'],
                    'craft beer': ['brewery', 'beer', 'tap', 'ale', 'lager', 'craft'],
                    'vintage fashion': ['vintage', 'boutique', 'thrift', 'retro', 'second hand'],
                    'fine dining': ['restaurant', 'dining', 'cuisine', 'chef', 'gourmet'],
                    'live music': ['music', 'concert', 'live', 'band', 'venue', 'stage'],
                    'wine': ['wine', 'vineyard', 'tasting', 'cellar', 'sommelier'],
                    'street food': ['food truck', 'street', 'casual', 'quick', 'takeout']
                }
                if taste_name in venue_type_mappings:
                    mapping_words = venue_type_mappings[taste_name]
                    if any(map_word in venue_name_lower or 
                          any(map_word in tag.get('name', '').lower() for tag in venue_tags) or
                          any(map_word in kw.get('name', '').lower() for kw in venue_keywords)
                          for map_word in mapping_words):
                        cultural_matches.append(taste.get('name', ''))
            cultural_matches = list(dict.fromkeys(cultural_matches))
            if len(cultural_matches) >= 2:
                cultural_match_text = f"{cultural_matches[0]} + {cultural_matches[1]}"
                if len(cultural_matches) > 2:
                    cultural_match_text += f" + {len(cultural_matches)-2} more"
            elif len(cultural_matches) == 1:
                cultural_match_text = cultural_matches[0]
            else:
                if venue_type in ['Restaurant', 'Bar', 'Cafe']:
                    food_tastes = [t.get('name', '') for t in tastes if t.get('type') == 'food_beverage']
                    if food_tastes:
                        cultural_match_text = f"{venue_type.lower()} culture"
                    else:
                        cultural_match_text = "dining experience"
                elif venue_type in ['Art Gallery', 'Museum', 'Creative Space']:
                    art_tastes = [t.get('name', '') for t in tastes if t.get('type') == 'visual_arts']
                    if art_tastes:
                        cultural_match_text = "arts & culture"
                    else:
                        cultural_match_text = "creative space"
                elif venue_type == 'Boutique':
                    cultural_match_text = "curated shopping"
                else:
                    if tastes:
                        cultural_match_text = f"{tastes[0].get('name', 'cultural')} adjacent"
                    else:
                        cultural_match_text = 'local culture'
            venue_data = {
                'id': i + 1,
                'number': i + 1,
                'name': venue_name,
                'type': venue_type,
                'affinity': round(affinity_score),
                'rating': round(rating, 1),
                'coordinates': coordinates,
                'address': f"{location} Area",
                'culturalMatch': cultural_match_text,
                'qloo_data': {
                    'entity_id': entity.get('id', ''),
                    'popularity': popularity,
                    'keywords': [k.get('name', '') for k in venue_keywords[:3]]
                }
            }
            all_venues.append(venue_data)
        print(f"🎭 Pre-diversity venue count: {len(all_venues)}")
        venue_type_counts = {}
        for venue in all_venues:
            vtype = venue['type']
            venue_type_counts[vtype] = venue_type_counts.get(vtype, 0) + 1
        print(f"📊 Pre-diversity types: {venue_type_counts}")
        all_venues.sort(key=lambda v: v['affinity'], reverse=True)
        diversity_limits = {
            'Restaurant': 4,  
            'Deli': 2,        
            'Cafe': 2,        
            'Bar': 2,         
            'Art Museum': 3,  
            'Museum': 3,      
            'Market': 2,      
            'Event Venue': 2, 
            'Arena': 1,       
            'Park': 2,        
            'Tourist Attraction': 2,  
            'Historical Landmark': 1, 
        }
        diverse_venues = []
        type_counts = {}
        for venue in all_venues:
            venue_type = venue['type']
            current_count = type_counts.get(venue_type, 0)
            max_allowed = diversity_limits.get(venue_type, 3)  
            if current_count < max_allowed:
                diverse_venues.append(venue)
                type_counts[venue_type] = current_count + 1
                if len(diverse_venues) >= 15:
                    break
        if len(diverse_venues) < 10:
            for venue in all_venues:
                if venue not in diverse_venues and len(diverse_venues) < 15:
                    diverse_venues.append(venue)
        for i, venue in enumerate(diverse_venues):
            venue['id'] = i + 1
            venue['number'] = i + 1
        final_type_counts = {}
        for venue in diverse_venues:
            vtype = venue['type']
            final_type_counts[vtype] = final_type_counts.get(vtype, 0) + 1
        print(f"🌈 Post-diversity venue count: {len(diverse_venues)}")
        print(f"📊 Final diverse types: {final_type_counts}")
        return {
            'success': True,
            'venues': diverse_venues,
            'location': location,
            'coordinates': user_coords,
            'total_found': len(diverse_venues),
            'taste_urns_used': taste_urns,
            'diversity_applied': True,
            'venue_type_distribution': final_type_counts
        }
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error in venues endpoint: {e}")
        print(f"Full traceback: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Failed to get venue recommendations: {str(e)}")
@app.post('/api/refine-route')
async def refine_route(request: dict):
    """
    Refine an existing route based on user feedback
    """
    try:
        current_route = request.get('current_route', {})
        user_request = request.get('user_request', '')
        available_venues = request.get('available_venues', [])
        print(f"🛠️ Route refinement request: {user_request}")
        print(f"📍 Current route has {len(current_route.get('venues', []))} venues")
        route_venues = current_route.get('venues', [])
        request_lower = user_request.lower()
        if 'replace' in request_lower or 'different' in request_lower:
            replacement_made = False
            if 'first' in request_lower and len(route_venues) > 0:
                current_type = route_venues[0].get('type', '')
                alternatives = [v for v in available_venues 
                              if v.get('type') == current_type 
                              and v.get('id') != route_venues[0].get('id')]
                if alternatives:
                    route_venues[0] = alternatives[0]
                    replacement_made = True
            elif 'restaurant' in request_lower:
                for i, venue in enumerate(route_venues):
                    if 'restaurant' in venue.get('type', '').lower():
                        alternatives = [v for v in available_venues 
                                      if 'restaurant' in v.get('type', '').lower()
                                      and v.get('id') != venue.get('id')]
                        if alternatives:
                            route_venues[i] = alternatives[0]
                            replacement_made = True
                            break
            if replacement_made:
                return {
                    'success': True,
                    'message': 'Route updated with your requested changes',
                    'updated_route': {
                        **current_route,
                        'venues': route_venues
                    }
                }
        elif 'details' in request_lower or 'tell me about' in request_lower:
            if 'first' in request_lower and len(route_venues) > 0:
                venue = route_venues[0]
                return {
                    'success': True,
                    'message': f"The first venue is {venue.get('name', 'Unknown')}, a {venue.get('type', 'venue')} with a {venue.get('affinity', 0)}% cultural match. It's rated {venue.get('rating', 0):.1f} stars.",
                    'venue_details': venue
                }
        return {
            'success': True,
            'message': "I understand you want to refine your route. Could you be more specific about what you'd like to change?",
            'suggestions': [
                "Replace the first venue",
                "Find a different restaurant", 
                "Tell me about the second venue",
                "Adjust the timing"
            ]
        }
    except Exception as e:
        print(f"❌ Route refinement error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refine route: {str(e)}")
@app.get('/health')
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "CultureCanvas backend is running"}