"""
Test script to verify the /api/venues endpoint returns properly formatted data
"""
import requests
import json
def test_venue_api():
    """Test the venues API with different taste combinations"""
    base_url = "http://127.0.0.1:8000"
    test_cases = [
        {
            "name": "Food & Beverage Tastes",
            "tastes": [
                {"id": "urn:entity:beverage:specialty_coffee", "name": "Specialty Coffee", "type": "food_beverage"},
                {"id": "urn:entity:food:fine_dining", "name": "Fine Dining", "type": "food_beverage"}
            ]
        },
        {
            "name": "Arts & Culture Tastes", 
            "tastes": [
                {"id": "urn:entity:art:contemporary_art", "name": "Contemporary Art", "type": "visual_arts"},
                {"id": "urn:entity:art:museums", "name": "Museums", "type": "visual_arts"}
            ]
        },
        {
            "name": "Mixed Cultural Tastes",
            "tastes": [
                {"id": "urn:entity:artist:jazz", "name": "Jazz Music", "type": "music"},
                {"id": "urn:entity:food:local_cuisine", "name": "Local Cuisine", "type": "food_beverage"},
                {"id": "urn:entity:art:galleries", "name": "Art Galleries", "type": "visual_arts"}
            ]
        }
    ]
    for test_case in test_cases:
        print(f"\n🧪 Testing: {test_case['name']}")
        print("=" * 50)
        payload = {
            "tastes": test_case["tastes"],
            "location": "New York, NY",
            "coordinates": [40.7589, -73.9851]
        }
        try:
            response = requests.post(f"{base_url}/api/venues", json=payload, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("venues"):
                    venues = data["venues"]
                    print(f"✅ Success: {len(venues)} venues returned")
                    venue_types = {}
                    for venue in venues:
                        vtype = venue.get("type", "Unknown")
                        venue_types[vtype] = venue_types.get(vtype, 0) + 1
                    print(f"📊 Venue Types: {dict(venue_types)}")
                    print("🏆 Top 3 Venues:")
                    for i, venue in enumerate(venues[:3]):
                        print(f"  {i+1}. {venue.get('name', 'Unknown')} ({venue.get('type', 'Unknown')}) - {venue.get('affinity', 0)}% match")
                        if venue.get('culturalMatch'):
                            print(f"     Cultural Match: {venue['culturalMatch']}")
                        if venue.get('qloo_data', {}).get('keywords'):
                            keywords = venue['qloo_data']['keywords'][:2]
                            print(f"     Keywords: {', '.join(keywords)}")
                else:
                    print(f"❌ API returned success=False or no venues")
                    print(f"Response: {data}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text[:200]}")
        except Exception as e:
            print(f"❌ Request failed: {e}")
if __name__ == "__main__":
    test_venue_api()
