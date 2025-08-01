from index import retriever
def build_context(query):
    tag_snips, shot_snips = retriever.retrieve(query, k=8)
    sections = ["Retriever tags:"] + [d['text'] for d in tag_snips]
    sections += ["\nFew-shot examples"] + [d['text'] for d in shot_snips]
    return "\n---\n".join(sections)