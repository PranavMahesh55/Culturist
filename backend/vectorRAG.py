import os
import json
import uuid
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBED_MODEL = os.getenv("EMBED_MODEL")
TAGS_PATH = 'data/qloo_tags.json'
SHOTS_PATH = 'data/few_shots.json'
VECTOR_DIR = 'vectorstore'
COLLECTION_NAME = 'culturis'
def main():
    client = chromadb.PersistentClient(path=VECTOR_DIR)
    embed_fn = embedding_functions.OpenAIEmbeddingFunction(
        api_key=OPENAI_API_KEY,
        model_name=EMBED_MODEL,
    )
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collect = client.create_collection(COLLECTION_NAME, embedding_function=embed_fn)
    with open(TAGS_PATH, 'r') as f:
        tags = json.load(f)
    with open(SHOTS_PATH, 'r') as f:
        shots = json.load(f)
    docs = []
    metadata = []
    ids = []
    for t in tags:
        text = f"{t['name']} ({t['type']}) -> {t['id']}"
        docs.append(text)
        metadata.append({"kind": "tag", **t})
        ids.append(str(uuid.uuid4()))
    for s in shots:
        text = f"USER: {s['user']}\nQLOO: {json.dumps(s['qloo_request'])}"
        docs.append(text)
        metadata.append({"kind": "fewshot"})
        ids.append(str(uuid.uuid4()))
    collect.add(documents=docs, metadatas=metadata, ids=ids)
    print(f"Indexed {len(ids)} docs into '{COLLECTION_NAME}' at {VECTOR_DIR}")
if __name__ == "__main__":
    main()