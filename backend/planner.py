import json
from openai import OpenAI
from configs import setting
client = OpenAI(api_key=setting.OPENAI_API_KEY)
build_qloo_request_tool = {
    "type": "function",
    "function": {
        "name": "build_qloo_request",
        "description": "Return the Qloo endpoint and query parameters",
        "parameters": {
            "type": "object",
            "properties": {
                "endpoint": {
                    "type": "string",
                    "enum": ["/v2/insights"]
                },
                "params": {
                        "type": "object",
                        "description": "Parameters to send to the endpoint",
                        "properties": {
                            "filter.type": {"type": "string"},
                            "filter.location.query": {"type": "string"},
                            "filter.location.radius": {"type": "string"},
                            "signal.interests.tags": {"type": "string"},
                            "limit": {"type": "integer"}
                        }
                    },
                "reasoning": {
                        "type": "string",
                        "description": "Explanation of why this endpoint was chosen"
                    },
            },
            "required": ["endpoint", "params", "reasoning"],
        }
    }
}
def plan_qloo_call(user_query, context) -> dict:
    prompt = f"""
You are the Qloo-Request Builder v3.
Return exactly one JSON object with this schema—no prose, no comments:
{{
  "user": "<verbatim user text>",
  "qloo_request": {{
    "endpoint": "/v2/insights",
    "params": {{
      "filter.type":  "urn:entity:place",
      "filter.location.query": "<extract exact city from user query>",
      "filter.location.radius": <int>,          
      "signal.interests.tags": "<comma-sep URNs for venue types AND cultural interests>",
      "limit": 25
    }}
  }}
}}
Location extraction rules:
- Extract the EXACT city mentioned by the user (e.g., "Brooklyn" → "Brooklyn, NY")
- If no city mentioned, default to "New York, NY"
signal.interests.tags rules:
1. ALWAYS include venue type URNs based on business type:
   - "coffee shop" → urn:tag:venue_type:restaurant,urn:tag:taste:coffee
   - "gallery" → urn:tag:venue_type:art_gallery
   - "bar" → urn:tag:venue_type:bar
   - "pop-up store" → urn:tag:venue_type:retail
   - "record store" → urn:tag:venue_type:retail
2. ADD cultural/taste URNs from user mentions:
   - "natural wine" → urn:tag:taste:natural_wine
   - "craft beer" → urn:tag:taste:craft_beer
   - "matcha" → urn:tag:taste:tea,urn:tag:cuisine:japanese
   - "vinyls" → urn:tag:interest:music,urn:tag:interest:vinyl
   - "Japanese" → urn:tag:cuisine:japanese
   - "city-pop" → urn:tag:genre:pop,urn:tag:interest:music
   - "art" → urn:tag:interest:art
3. Combine venue type + cultural interests in signal.interests.tags
4. Be specific - extract ALL relevant cultural elements from the query
User query: {user_query}
"""
    resp = client.chat.completions.create(
        model=setting.GPT_MODEL,
        messages=[
            {'role': 'user', 'content': prompt},
        ],
        tools=[build_qloo_request_tool], 
        tool_choice={"type": "function", "function": {"name": "build_qloo_request"}}
    )
    tool_call = None
    for choice in resp.choices:
        if choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            break
    if tool_call is None:
        raise ValueError("No tool_call returned by planner")
    args = json.loads(tool_call.function.arguments)
    if 'params' not in args:
        args['params'] = {}
    return args
