import asyncio
import json
from qloo_client import call_qloo
async def test_qloo_restaurants_bars():
    """Test what types of restaurants and bars Qloo API returns"""
    params = {
        'filter.type': 'urn:entity:place',
        'filter.location.query': 'New York, NY',
        'filter.location.radius': '10000',
        'filter.tags': 'urn:tag:venue_type:restaurant,urn:tag:venue_type:bar,urn:tag:venue_type:cafe',
        'limit': '15'
    }
    try:
        print("🔍 Calling Qloo API with restaurant/bar/cafe filter...")
        response = await call_qloo('/v2/insights', params)
        entities = response.get('results', {}).get('entities', [])
        print(f"📊 Found {len(entities)} entities")
        all_tags = {}
        for i, entity in enumerate(entities):
            name = entity.get('name', f'Unknown {i+1}')
            print(f"\n🍽️  Entity {i+1}: {name}")
            tags = entity.get('tags', [])
            venue_types = []
            categories = []
            genres = []
            for tag in tags:
                tag_name = tag.get('name', 'Unknown')
                tag_type = tag.get('type', 'Unknown')
                all_tags[tag_type] = all_tags.get(tag_type, set())
                all_tags[tag_type].add(tag_name)
                if tag_type == 'venue_type':
                    venue_types.append(tag_name)
                elif tag_type == 'category':
                    categories.append(tag_name)
                elif tag_type == 'genre':
                    genres.append(tag_name)
            if venue_types:
                print(f"   Venue Types: {', '.join(venue_types[:3])}")
            if categories:
                print(f"   Categories: {', '.join(categories[:3])}")
            if genres:
                print(f"   Genres: {', '.join(genres[:3])}")
        print(f"\n📊 ALL TAG TYPES FOUND:")
        for tag_type, tag_names in all_tags.items():
            print(f"\n{tag_type.upper()}:")
            for name in sorted(list(tag_names))[:10]:  
                print(f"   - {name}")
    except Exception as e:
        print(f"❌ Error: {e}")
if __name__ == "__main__":
    asyncio.run(test_qloo_restaurants_bars())
