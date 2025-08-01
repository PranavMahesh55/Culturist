import os
from dotenv import load_dotenv
load_dotenv()
class Settings:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    QLOO_API_KEY = os.getenv("QLOO_API_KEY")
    GPT_MODEL = 'gpt-4o-mini'
    EMBED_MODEL = os.getenv('EMBED_MODEL')
    VECTOR_DIR = 'vectorstore'
    COLLECTION_NAME = 'culturis'
setting = Settings()