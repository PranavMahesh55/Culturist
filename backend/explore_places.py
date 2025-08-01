import asyncio
import json
from qloo_client import call_qloo
async def explore_qloo_places():
    """Explore what place types Qloo actually has"""
    test_queries = [
        {
            'name': 'Basic Places',
            'params': {
                'filter.type': 'urn:entity:place',
                'filter.location.query': 'New York, NY',
                'filter.location.radius': '5000',
                'limit': '20'
            }
        },
        {
            'name': 'Try Restaurant Genre',
            'params': {
                'filter.type': 'urn:entity:place',
                'filter.location.query': 'New York, NY',
                'filter.location.radius': '5000',
                'filter.tags': 'urn:tag:genre:place:Restaurant',
                'limit': '10'
            }
        },
        {
            'name': 'Try Food Category',
            'params': {
                'filter.type': 'urn:entity:place',
                'filter.location.query': 'New York, NY',
                'filter.location.radius': '5000',
                'filter.tags': 'urn:tag:category:place:Restaurant',
                'limit': '10'
            }
        }
    ]
    for query in test_queries:
        try:
            print(f"\n🔍 Testing: {query['name']}")
            print(f"   Params: {query['params']}")
            response = await call_qloo('/v2/insights', query['params'])
            entities = response.get('results', {}).get('entities', [])
            print(f"   📊 Found {len(entities)} entities")
            for i, entity in enumerate(entities[:3]):
                name = entity.get('name', f'Unknown {i+1}')
                print(f"   🏢 {name}")
                tags = entity.get('tags', [])
                food_related = []
                for tag in tags:
                    tag_name = tag.get('name', '')
                    tag_type = tag.get('type', '')
                    if any(word in tag_name.lower() for word in ['restaurant', 'food', 'dining', 'bar', 'cafe', 'kitchen', 'cuisine']):
                        food_related.append(f"{tag_type}: {tag_name}")
                if food_related:
                    print(f"      Food-related tags: {food_related[:3]}")
        except Exception as e:
            print(f"   ❌ Error: {e}")
if __name__ == "__main__":
    asyncio.run(explore_qloo_places())
