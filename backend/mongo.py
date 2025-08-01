from motor.motor_asyncio import AsyncIOMotorClient
import os
mongo = AsyncIOMotorClient(os.getenv("MONGO_URI"))
db = mongo.myOnboardingDB
logs_col = db['chat_logs']