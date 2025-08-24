# Friday-e Demo - Semantic Kernel MCP Agent

This is a demonstration of a multi-agent system using Microsoft Semantic Kernel with Model Context Protocol (MCP) integration. The application provides a FastAPI backend that can connect to both Azure OpenAI and Ollama models, with support for external tool integration via MCP servers.

## Project Structure

```
friday-e-demo/
├── backend/
│   └── src/
│       ├── agent.py              # Core agent implementation using Semantic Kernel
│       ├── agent_definition.json # Agent configuration and MCP server definitions
│       ├── api.py                # FastAPI application with agent endpoints
│       ├── pyproject.toml        # UV package manager configuration
│       ├── uv.lock              # Dependency lock file
│       ├── .env                 # Environment variables (create from .envexample)
│       └── .envexample          # Environment template
├── docs/                        # Project documentation
│   ├── user-requirements.md     # User requirements specification
│   └── llm-requirements.md      # LLM development requirements
└── README.md                    # This file
```

## Key Features

### Agent System
- **Multi-model support**: Connect to Azure OpenAI (USGov cloud) or local Ollama models
- **MCP Integration**: Extensible tool system via Model Context Protocol servers
- **Streaming responses**: Real-time streaming of agent responses
- **Tool execution**: Agents can use external tools and APIs through MCP

### Available Agents
- **Azure Agent**: Uses Azure OpenAI with configured MCP tools
- **Ollama Agent**: Uses local Ollama models (gpt-oss:20b) with MCP tools

### MCP Tool Servers
- **FF Tools**: Custom tool server for specialized functionality
- **SQL Tools**: Database interaction capabilities via MCP

## Technology Stack

- **Backend Framework**: FastAPI with async support
- **AI Framework**: Microsoft Semantic Kernel
- **Model Providers**: 
  - Azure OpenAI (Azure USGov cloud)
  - Ollama (local models)
- **Tool Integration**: Model Context Protocol (MCP)
- **Package Management**: UV (Python)
- **Environment Management**: python-dotenv

## Getting Started

### Prerequisites

- Python 3.12+
- UV package manager
- Access to either:
  - Azure OpenAI (USGov cloud) OR
  - Local Ollama installation with models

### Setup

1. **Clone and navigate to the project:**
   ```powershell
   cd backend/src
   ```

2. **Install dependencies:**
   ```powershell
   uv sync
   ```

3. **Configure environment:**
   ```powershell
   cp .envexample .env
   ```
   
   Edit `.env` with your Azure OpenAI credentials or Ollama endpoint.

4. **Start the FastAPI server:**
   ```powershell
   uv run python api.py
   ```

   Or using FastAPI directly:
   ```powershell
   uv run fastapi dev api.py
   ```

5. **Access the API:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

6. **Developing the full stack:**
   - ```
   ctrl+shift+b
   ```
## API Endpoints

### Agent Interaction

#### Non-streaming Chat
```http
POST /agent
```
**Parameters:**
- `agent_name`: Choose from available agents (azure_agent, Ollama_agent)
- **Request Body:**
  ```json
  {
    "query": "what tools do you have available?"
  }
  ```

#### Streaming Chat
```http
POST /agent_stream
```
**Parameters:**
- `agent_name`: Choose from available agents
- **Request Body:**
  ```json
  {
    "query": "help me analyze this data"
  }
  ```

### Example Usage

```bash
# Query the Azure agent
curl -X POST "http://localhost:8000/agent?agent_name=azure_agent" \
  -H "Content-Type: application/json" \
  -d '{"query": "what tools do you have available?"}'

# Stream response from Ollama agent
curl -X POST "http://localhost:8000/agent_stream?agent_name=Ollama_agent" \
  -H "Content-Type: application/json" \
  -d '{"query": "help me with data analysis"}'
```

## Configuration

### Agent Definition (`agent_definition.json`)

The agent configuration defines:

- **Azure Agent Configuration:**
  ```json
  {
    "azure_agent": {
      "env_file_path": ".env",
      "system_message": "you are an expert and help find answers. you have tools, and can use them",
      "servers": {
        "ff_tools": {
          "url": "http://192.168.86.103:8000/mcp",
          "type": "http"
        }
      }
    }
  }
  ```

- **Ollama Agent Configuration:**
  ```json
  {
    "Ollama_agent": {
      "deployment_name": "gpt-oss:20b",
      "endpoint": "http://ollama.home",
      "system_message": "you are an expert and help find answers. you have tools, and can use them",
      "servers": {
        "ff_tools": {
          "url": "http://192.168.86.103:8000/mcp",
          "type": "http"
        }
      }
    }
  }
  ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Azure OpenAI Configuration (for azure_agent)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.us/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Ollama Configuration (for Ollama_agent)
OLLAMA_ENDPOINT=http://ollama.home
OLLAMA_MODEL=gpt-oss:20b

# Application Settings
LOG_LEVEL=INFO
```

## Development

### Adding New Agents

1. Add agent configuration to `agent_definition.json`
2. The `Agent` class will automatically detect and load new agents
3. Agents will be available in the API enum automatically

### Adding MCP Tools

1. Set up your MCP server
2. Add server configuration to the agent's `servers` section in `agent_definition.json`
3. The agent will automatically connect and load available tools

### Code Structure

- **`agent.py`**: Core agent implementation using Semantic Kernel
- **`api.py`**: FastAPI application with endpoint definitions
- **`agent_definition.json`**: Configuration for all agents and their MCP servers

## MCP Integration

This demo showcases Model Context Protocol integration, allowing agents to:

1. **Connect to external tool servers**
2. **Discover available tools dynamically**
3. **Execute tools with parameters**
4. **Handle streaming responses**

MCP servers can provide various capabilities:
- Database operations
- File system access
- API integrations
- Custom business logic

## Troubleshooting

### Common Issues

1. **Agent creation fails**
   - Check your Azure OpenAI credentials in `.env`
   - Verify Ollama is running if using Ollama agent
   - Check MCP server connectivity

2. **MCP tools not available**
   - Verify MCP server URLs in `agent_definition.json`
   - Check network connectivity to MCP servers
   - Some servers may be demo/placeholder URLs

3. **Import errors**
   - Ensure all dependencies are installed: `uv sync`
   - Check Python version (3.12+ required)

### Logging

The application uses structured logging. Set `LOG_LEVEL` in your environment for debug information:

```env
LOG_LEVEL=DEBUG
```

## Architecture Notes

### Semantic Kernel Integration
This demo leverages Microsoft Semantic Kernel's:
- **Kernel framework** for AI orchestration
- **Plugin system** for tool integration
- **Chat completion services** for model abstraction
- **MCP connectors** for external tool integration

### Async Design
The entire application is built with async/await patterns:
- Non-blocking agent operations
- Streaming response support
- Concurrent MCP server connections

## Contributing

1. **Follow async patterns** throughout the codebase
2. **Add proper error handling** for MCP connections
3. **Document new agent configurations** in `agent_definition.json`
4. **Test with both Azure OpenAI and Ollama** if possible

## Security Considerations

- **Environment variables**: Never commit `.env` files
- **MCP servers**: Validate external server URLs before connecting
- **Azure USGov**: Ensure compliance with government cloud requirements
- **Local models**: Consider data privacy when using Ollama

## Future Enhancements

- [ ] Web UI for agent interaction
- [ ] Session management and persistence
- [ ] Additional MCP tool integrations
- [ ] Agent workflow orchestration
- [ ] Multi-agent collaboration patterns

## Resources

- [Semantic Kernel Documentation](https://learn.microsoft.com/en-us/semantic-kernel/)
- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [UV Package Manager](https://docs.astral.sh/uv/)

## License

This is a demonstration project for educational and development purposes.
