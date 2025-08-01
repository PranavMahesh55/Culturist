import os, requests, pprint, sys
API = "https://hackathon.api.qloo.com"
HEADERS = {"X-Api-Key": os.getenv("QLOO_API_KEY")}
search = requests.get(
    f"{API}/v2/insights", 
    params={'filter.type': 'urn:entity:place', 'signal.interests.tags': 'urn:tag:genre:Hinduism', 'filter.location.query': 'Mumbai', 'filter.location.radius':15,'limit':1}, 
    headers=HEADERS, 
    timeout=10
    ).json()
if not search:
    sys.exit("No results found for the search query.")
entity_urn = search['results'].get('entities', [])
entity = entity_urn[0]
entity_urn = entity.get('entity_id')
print('Seed Entity:', entity_urn)
pprint.pprint(search)
