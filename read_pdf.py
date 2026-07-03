from pypdf import PdfReader

reader = PdfReader("test.pdf")

text = ""

for page in reader.pages:
    text = text + page.extract_text()

#print(text)

chunk_size = 500
chunks = []

for i in range(0, len(text), chunk_size):
    chunk = text[i : i + chunk_size]
    chunks.append(chunk)

print("Number of chunks:", len(chunks))
#print("First chunk:", chunks[0])

import chromadb

client = chromadb.Client()

collection = client.create_collection(name="my_documents")

ids = []
for i in range(len(chunks)):
    ids.append("chunk" + str(i))

collection.add(
    documents=chunks,
    ids=ids
)

print("Stored", len(chunks), "chunks in ChromaDB!")

question = "What is the HTTPS port number?"

results = collection.query(
    query_texts=[question],
    n_results=2
)

print("Question:", question)
print("Most relevant chunks found:")
for chunk in results["documents"][0]:
    print("-----")
    print(chunk)