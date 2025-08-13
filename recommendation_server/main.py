from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from dotenv import load_dotenv
from pathlib import Path
import traceback
try:
    import google.generativeai as genai
except Exception:
    genai = None

# Load environment variables (ensure .env in this folder is loaded regardless of CWD)
env_path = Path(__file__).with_name('.env')
load_dotenv(dotenv_path=env_path)

# Initialize FastAPI app
app = FastAPI()

# CORS (Cross-Origin Resource Sharing) middleware
# This allows your React frontend to communicate with this FastAPI backend
origins = [
    "http://localhost:3000",  # Original assumption
    "http://localhost:3001",
    "http://localhost:5173",  # Your frontend's actual address
    "http://127.0.0.1:5173",  # Vite may bind on 127.0.0.1
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "edume")
COLLECTION_NAME = "recommended_courses"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

# --- Gemini AI Setup --- #
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and genai:
    genai.configure(api_key=GEMINI_API_KEY)
    print("[AI Assistant] Gemini configured: key detected, model:", os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
else:
    # Do not raise here to allow the server to start for other endpoints
    print("[AI Assistant] Warning: google-generativeai not installed or GEMINI_API_KEY not set. /chat will return 500.")

# Model config
GENERATION_CONFIG = {
    "temperature": 0.6,
    "top_p": 0.9,
    "top_k": 40,
    "max_output_tokens": 1024,
}
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# --- Machine Learning Model --- #

# Load data from MongoDB into a pandas DataFrame
def load_data_from_db():
    cursor = collection.find()
    df = pd.DataFrame(list(cursor))
    # Ensure the _id column is not used as a feature
    if '_id' in df.columns:
        df.drop('_id', axis=1, inplace=True)
    return df

courses_df = load_data_from_db()

# Combine relevant text features for the model
courses_df['combined_features'] = courses_df['course_title'] + ' ' + courses_df['subject']

# TF-IDF Vectorizer
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(courses_df['combined_features'])

# Cosine Similarity
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# --- API Endpoints --- #

class Interest(BaseModel):
    interests: list[str]

@app.post("/recommend/")
def get_recommendations(interest: Interest):
    if not interest.interests:
        raise HTTPException(status_code=400, detail="Interests list cannot be empty.")

    # Combine user interests into a single string
    interest_text = ' '.join(interest.interests)

    # Transform the interest text using the same TF-IDF vectorizer
    interest_vector = tfidf.transform([interest_text])

    # Calculate cosine similarity between the user's interest and all courses
    sim_scores = cosine_similarity(interest_vector, tfidf_matrix).flatten()

    # Get the indices of the top 20 most similar courses
    top_indices = sim_scores.argsort()[-20:][::-1]

    # Get the recommended courses
    recommended_courses = courses_df.iloc[top_indices]

    return recommended_courses.to_dict(orient='records')


# ---------- AI Assistant ---------- #
class ChatMessage(BaseModel):
    role: str = Field(..., description="one of: user, assistant")
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    system_prompt: str | None = None
    course_context: str | None = None


@app.post("/chat")
def chat(req: ChatRequest):
    if genai is None:
        raise HTTPException(status_code=500, detail="google-generativeai is not installed on the server. Please install it.")
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server")
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    # Build a helpful system prompt
    base_system = (
        req.system_prompt
        or """
You are EduMe's AI Learning Assistant. Help students with course topics, explain concepts simply, and provide step-by-step guidance. 
Be concise, cite formulas when needed, include small actionable examples, and suggest next steps or practice tasks. If asked about platform-specific actions, reference EduMe features (courses, discussions, certificates). Avoid hallucinations.
"""
    ).strip()

    # Include optional course/user context
    context_block = f"\nContext:\n{req.course_context}\n" if req.course_context else ""

    # Transform conversation to Gemini-compatible roles ('user' | 'model')
    convo = []
    for m in req.messages:
        if m.role == "assistant":
            role = "model"
        elif m.role == "user":
            role = "user"
        else:
            role = "user"
        convo.append({"role": role, "parts": [m.content]})

    try:
        model = genai.GenerativeModel(model_name=MODEL_NAME, generation_config=GENERATION_CONFIG,
                                      system_instruction=base_system + context_block)

        # Split history and last user message
        history = convo[:-1] if len(convo) > 1 else []
        last_user = convo[-1]["parts"][0]

        # Sanitize: ensure history starts with 'user' and alternates
        sanitized = []
        for turn in history:
            role = turn.get("role")
            if role not in ("user", "model"):
                continue
            if not sanitized:
                if role != "user":
                    # drop leading non-user messages
                    continue
                sanitized.append(turn)
            else:
                # allow any sequence; Gemini tolerates, but keep size moderate
                sanitized.append(turn)

        # Prefer chat session
        chat_session = model.start_chat(history=sanitized)
        response = chat_session.send_message(last_user)
        text = getattr(response, "text", None) or getattr(response, "candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not text:
            # Fallback: single-shot generation
            single = model.generate_content(last_user)
            text = getattr(single, "text", "")
        return {"reply": text or "I'm sorry, I couldn't generate a response."}
    except Exception as e:
        # Log full traceback server-side for debugging
        print("[AI Assistant] Gemini exception:")
        traceback.print_exc()
        # Bubble a concise message to client
        raise HTTPException(status_code=500, detail=f"Gemini error: {type(e).__name__}: {e}")

@app.get("/")
def read_root():
    return {"message": "Welcome to the EduMe Course Recommendation API"}


@app.get("/chat/health")
def chat_health():
    return {
        "genai_installed": genai is not None,
        "has_key": bool(GEMINI_API_KEY),
        "model": MODEL_NAME,
    }

# To run this app, use the command:
# uvicorn main:app --reload
