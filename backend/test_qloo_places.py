import asyncio
import json
from qloo_client import call_qloo
async def test_qloo_places():
    """Test what types of places Qloo API returns"""
    params = {
        'filter.type': 'urn:entity:place',
        'filter.location.query': 'New York, NY',
        'filter.location.radius': '10000',
        'limit': '10'
    }
    try:
        print("🔍 Calling Qloo API with basic place filter...")
        response = await call_qloo('/v2/insights', params)
        entities = response.get('results', {}).get('entities', [])
        print(f"📊 Found {len(entities)} entities")
        venue_types = {}
        business_types = {}
        categories = {}
        for i, entity in enumerate(entities[:10]):
            name = entity.get('name', f'Unknown {i+1}')
            print(f"\n🏢 Entity {i+1}: {name}")
            tags = entity.get('tags', [])
            print(f"   Tags ({len(tags)} total):")
            for tag in tags[:5]:  
                tag_name = tag.get('name', 'Unknown')
                tag_type = tag.get('type', 'Unknown')
                print(f"     - {tag_type}: {tag_name}")
                if tag_type == 'venue_type':
                    venue_types[tag_name] = venue_types.get(tag_name, 0) + 1
                elif tag_type == 'business_type':
                    business_types[tag_name] = business_types.get(tag_name, 0) + 1
                elif tag_type == 'category':
                    categories[tag_name] = categories.get(tag_name, 0) + 1
        print(f"\n📈 VENUE TYPES FOUND:")
        for vtype, count in sorted(venue_types.items(), key=lambda x: x[1], reverse=True):
            print(f"   {vtype}: {count}")
        print(f"\n🏪 BUSINESS TYPES FOUND:")
        for btype, count in sorted(business_types.items(), key=lambda x: x[1], reverse=True):
            print(f"   {btype}: {count}")
        print(f"\n📂 CATEGORIES FOUND:")
        for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
            print(f"   {cat}: {count}")
    except Exception as e:
        print(f"❌ Error: {e}")
if __name__ == "__main__":
    asyncio.run(test_qloo_places())
