import chromadb
from chromadb.utils import embedding_functions
from configs import setting
import os
class RAGRetriever:
    def __init__(self):
        if not os.getenv('CHROMA_OPENAI_API_KEY') and setting.OPENAI_API_KEY:
            os.environ['CHROMA_OPENAI_API_KEY'] = setting.OPENAI_API_KEY
        self.client = chromadb.PersistentClient(path=setting.VECTOR_DIR)
        self.collection = self.client.get_or_create_collection(
            setting.COLLECTION_NAME,
            embedding_function=embedding_functions.OpenAIEmbeddingFunction(
                model_name=setting.EMBED_MODEL or "text-embedding-ada-002"
            )
        )
    def retrieve(self, query, k = 8):
        result = self.collection.query(query_texts=[query], n_results=k)
        docs = []
        for i, doc in enumerate(result['documents'][0]):
            meta = result['metadatas'][0][i]  
            docs.append({"text": doc, "metadata": meta})
        tag_snips = [d for d in docs if d['metadata'].get("kind") == 'tag']
        shot_snips = [d for d in docs if d['metadata'].get("kind") == 'fewshot']
        return tag_snips, shot_snips
retriever = RAGRetriever()