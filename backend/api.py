import logging
from fastapi import FastAPI, APIRouter, status
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
from fastapi import HTTPException
from pydantic import BaseModel
import json
import os
from agent import Agent
from enum import Enum

# Configure logging FIRST before any logging calls
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Configure environment variables
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

logging.info(f"Using {find_dotenv()}. Starting FastAPI app in {ENVIRONMENT} mode")

# Load agent definition
current_dir = os.path.dirname(__file__)
agent_def_path = os.path.join(current_dir, "agent_definition.json")
with open(agent_def_path, "r") as f:
    agent_definition = json.load(f)

agents = list(agent_definition.keys())
logging.info(f"Loaded agents: {agents}")


app = FastAPI()


# Add CORS middleware with environment-based configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Get the directory where this script is located
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

router = APIRouter(prefix="/api")


# API Routes
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}

class QueryRequest(BaseModel):
    query: str = "what are the recent documents about AI on bbc.com?"

# Create enum from agents list
AgentName = Enum('AgentName', {agent: agent for agent in agents})

@router.get("/agents", response_model=list[str])
async def get_agents():
    """Get list of available agents"""
    return agents

@router.post("/agent")
async def agent_endpoint(request: QueryRequest, agent_name: str = agents[0]):

    if agent_name not in agent_definition:
        raise HTTPException(status_code=404, detail="Agent not found")

    logging.info(f"Creating agent: {agent_name}")
    logging.info(f"Agent config: {agent_definition[agent_name]}")
    # Create agent
    agent = await Agent.create(agent_definition[agent_name])

    logging.info(f"Agent created: {agent_name}")
    try:
        result = await agent.run_agent(request.query)
        logging.info("Received response from agent: %s", result)
        
        # Check if the result contains a status_code indicating an error
        if isinstance(result, dict) and "status_code" in result:
            status_code = result["status_code"]
            if status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
            elif status_code >= 400:
                raise HTTPException(status_code=status_code, detail=result.get("response", {}).get("error", "An error occurred"))
        
        return result
    except HTTPException:
        # Re-raise HTTPExceptions (including the ones we just created above)
        raise
    except Exception as e:
        logging.error(f"Error running agent {agent_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# Include API routes BEFORE mounting the SPA so /api/* isn't shadowed by StaticFiles at "/".
app.include_router(router)

# Mount static files for SPA
if STATIC_DIR.exists():
    # Serve the React app from the static directory
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="spa")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
