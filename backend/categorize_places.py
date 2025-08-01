import asyncio
import json
from qloo_client import call_qloo
async def categorize_qloo_places():
    """Categorize all the types of places Qloo returns"""
    params = {
        'filter.type': 'urn:entity:place',
        'filter.location.query': 'New York, NY',
        'filter.location.radius': '8000',
        'limit': '50'  
    }
    try:
        print("🔍 Getting comprehensive list of Qloo places...")
        response = await call_qloo('/v2/insights', params)
        entities = response.get('results', {}).get('entities', [])
        print(f"📊 Analyzing {len(entities)} entities")
        place_categories = {}
        place_genres = {}
        for entity in entities:
            name = entity.get('name', 'Unknown')
            tags = entity.get('tags', [])
            entity_categories = []
            entity_genres = []
            for tag in tags:
                tag_name = tag.get('name', '')
                tag_type = tag.get('type', '')
                if tag_type == 'urn:tag:category:place':
                    entity_categories.append(tag_name)
                    place_categories[tag_name] = place_categories.get(tag_name, 0) + 1
                elif tag_type == 'urn:tag:genre:place':
                    entity_genres.append(tag_name)
                    place_genres[tag_name] = place_genres.get(tag_name, 0) + 1
            if len(entity_categories) > 0 or len(entity_genres) > 0:
                print(f"🏢 {name}")
                if entity_categories:
                    print(f"   Categories: {', '.join(entity_categories[:3])}")
                if entity_genres:
                    print(f"   Genres: {', '.join(entity_genres[:3])}")
        print(f"\n📊 PLACE CATEGORIES (by frequency):")
        for cat, count in sorted(place_categories.items(), key=lambda x: x[1], reverse=True):
            print(f"   {cat}: {count}")
        print(f"\n🎭 PLACE GENRES (by frequency):")
        for genre, count in sorted(place_genres.items(), key=lambda x: x[1], reverse=True):
            print(f"   {genre}: {count}")
    except Exception as e:
        print(f"❌ Error: {e}")
if __name__ == "__main__":
    asyncio.run(categorize_qloo_places())
