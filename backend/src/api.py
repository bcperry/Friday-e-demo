import logging
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import os
from agent import Agent
from enum import Enum



# Load agent definition
current_dir = os.path.dirname(__file__)
agent_def_path = os.path.join(current_dir, "agent_definition.json")
with open(agent_def_path, "r") as f:
    agent_definition = json.load(f)

agents = list(agent_definition.keys())
logging.basicConfig(level=logging.INFO)
logging.info(f"Loaded agents: {agents}")

app = FastAPI()

class QueryRequest(BaseModel):
    query: str = "what tools do you have available?"
# Create enum from agents list
AgentName = Enum('AgentName', {agent: agent for agent in agents})


@app.post("/agent")
async def agent_endpoint(request: QueryRequest, agent_name: AgentName = AgentName(agents[0])):

    if agent_name.value not in agent_definition:
        return {"error": "Agent not found"}

    logging.info(f"Creating agent: {agent_name.value}")
    logging.info(f"Agent config: {agent_definition[agent_name.value]}")
    # Create agent
    agent = await Agent.create(agent_definition[agent_name.value])

    logging.info(f"Agent created: {agent_name.value}")

    return StreamingResponse(agent.run_agent(request.query, streaming=False), media_type="text/plain")




@app.post("/agent_stream")
async def stream_response(request: QueryRequest, agent_name: AgentName = AgentName(agents[0])):

    if agent_name.value not in agent_definition:
        return {"error": "Agent not found"}

    logging.info(f"Creating agent: {agent_name.value}")
    logging.info(f"Agent config: {agent_definition[agent_name.value]}")
    # Create agent
    agent = await Agent.create(agent_definition[agent_name.value])

    logging.info(f"Agent created: {agent_name.value}")

    return StreamingResponse(agent.run_agent(request.query, streaming=True), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
