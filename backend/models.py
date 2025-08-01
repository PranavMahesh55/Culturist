from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
class UserIn(BaseModel):
    agreeToTerms: bool
    firstName: str
class UserDB(UserIn):
    id: str = Field(alias="_id")
    createdAt: datetime
class ChatRequest(BaseModel):
    query: str = Field(..., description="Users natural language query")
class Plan(BaseModel):
    endpoint: str
    params: Dict[str, Any]
    reasoning: Optional[str] = None
class ChatResponse(BaseModel):
    plan: Plan
    qlooData: Dict[str, Any]
    pretty: str
