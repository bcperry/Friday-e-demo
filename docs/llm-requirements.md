# LLM Requirements Document for Friday-e-demo Project

## 1. Project Overview & Context

### Purpose
This document provides comprehensive instructions for LLMs working on the Friday-e-demo project. Follow these requirements meticulously to ensure consistent, maintainable, and high-quality code contributions.

### Technology Stack
- **Backend**: Python with UV package manager
- **Frontend**: TypeScript with Vite build tool
- **AI/LLM**: Azure OpenAI (Azure USGov cloud)
- **Agent Framework**: Custom agent implementation with Azure OpenAI
- **Data Storage**: In-memory or file-based (no database required)

### Core Principles
- **Clarity over cleverness**: Write code that is easy to understand
- **Consistency over personal preference**: Follow established patterns
- **Robustness over speed**: Prioritize error handling and edge cases
- **Documentation as first-class citizen**: Document while coding, not after
- **Type safety first**: Leverage TypeScript and Python type hints throughout

## 2. Code Organization

### Directory Structure
```
friday-e-demo/
├── backend/                # Python backend application
│   ├── src/                # Source code
│   │   ├── api/            # API endpoints and routes
│   │   ├── agents/         # AI agent implementations
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Data models and schemas (Pydantic)
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration management
│   │   └── core/           # Core application setup
│   ├── tests/              # Test files
│   ├── data/               # Sample data and file storage
│   ├── static/             # Built frontend assets (generated from frontend/dist)
│   └── pyproject.toml      # UV/Python project configuration
├── frontend/               # TypeScript/Vite frontend
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients and business logic
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── assets/         # Static assets
│   ├── public/             # Public static files
│   ├── dist/               # Build output (copied to backend/static)
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── tsconfig.json       # TypeScript configuration
├── docs/                   # Documentation
└── README.md               # Project overview
```

### File Organization Rules
- One component/class per file (both Python and TypeScript)
- Keep files under 300 lines (prefer 100-200)
- Python modules: snake_case file names
- TypeScript: PascalCase for components, camelCase for utilities
- Agent-specific organization: Each agent type has its own module in `agents/`

## 3. Architecture & Infrastructure

### Architecture Patterns
- **Frontend**: Component-based architecture with TypeScript
- **Backend**: FastAPI with layered architecture (Router → Service → Agent)
- **API Design**: RESTful principles with OpenAPI/Swagger documentation
- **Agent Architecture**: Modular agent system with Azure OpenAI integration
- **Data Storage**: In-memory storage with optional file persistence
- **Authentication**: Not implemented for demo (public endpoints)
- **Static File Serving**: Frontend builds into backend/static and is served by FastAPI

### Infrastructure Requirements
- **Cloud Platform**: Azure USGov (required for Azure OpenAI)
- **AI Services**: Azure OpenAI Service (USGov region)
- **Containerization**: Docker for both frontend and backend
- **CI/CD**: GitHub Actions (with USGov compliance considerations)

## 4. Required Files & Configuration

### Backend Files (Python/UV)
- `backend/pyproject.toml` - UV project configuration and dependencies
- `backend/.env.example` - Environment variable template (Azure OpenAI config)
- `backend/main.py` - Application entry point
- `backend/src/config/azure_openai.py` - Azure OpenAI configuration

### Frontend Files (TypeScript/Vite)
- `frontend/package.json` - Node.js dependencies
- `frontend/vite.config.ts` - Vite build configuration (output to ../backend/static)
- `frontend/tsconfig.json` - TypeScript configuration

### Build Configuration
**Frontend build must output to backend/static:**
- Vite should be configured to build into `../backend/static`
- Backend FastAPI should serve static files from `/static` directory
- Frontend assets should be accessible at root URL (`/`) when served by backend

## 5. Naming Conventions

### Python Code Naming
- **Classes**: PascalCase (`UserService`, `ChatAgent`)
- **Functions/variables**: snake_case (`get_user_by_id`, `user_age`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Private members**: Leading underscore (`_internal_helper`)
- **Boolean variables**: Prefix with is/has/should (`is_loading`)

### TypeScript Code Naming
- **Classes/Interfaces**: PascalCase (`UserService`, `UserData`)
- **Functions/Variables**: camelCase (`calculateTotal`, `userAge`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **React Components**: PascalCase (`UserProfile`)
- **Event handlers**: handle prefix (`handleClick`)

## 6. API Endpoints

### Agent Interactions
```
POST   /api/v1/agents/{agent_type}/chat
POST   /api/v1/agents/{agent_type}/execute
GET    /api/v1/agents/types
GET    /api/v1/agents/{agent_type}/status
```

### Session Management (in-memory)
```
POST   /api/v1/sessions
GET    /api/v1/sessions/{session_id}
DELETE /api/v1/sessions/{session_id}
POST   /api/v1/sessions/{session_id}/messages
```

### Health and Monitoring
```
GET    /api/v1/health
GET    /api/v1/health/azure-openai
```

## 7. Implementation Guidelines

### Backend Code Style (Python)
- **Indentation**: 4 spaces (PEP 8 standard)
- **Line length**: Max 88 characters (Black formatter)
- **Quotes**: Double quotes for strings
- **Type hints**: Always use for function signatures
- **Async/Await**: Use for I/O operations
- **Docstrings**: Google style docstrings

### Frontend Code Style (TypeScript)
- **Indentation**: 2 spaces
- **Line length**: Max 100 characters
- **Quotes**: Single quotes for strings (except JSON)
- **Semicolons**: Always use
- **Async/Await**: Prefer over promises

### Error Handling Rules
1. Never swallow errors silently
2. Log errors with context
3. Provide meaningful error messages
4. Use appropriate HTTP status codes
5. Handle Azure OpenAI API errors gracefully

## 8. Testing Requirements

### Test Coverage Goals
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: All API endpoints
- **Agent Tests**: Mock Azure OpenAI responses

### Testing Frameworks
- **Backend**: pytest with pytest-asyncio
- **Frontend**: Vitest with React Testing Library

## 9. Environment Configuration

### Backend Environment Variables
```bash
# Azure OpenAI Configuration (USGov)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.us/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
SESSION_TIMEOUT_MINUTES=30
MAX_CONCURRENT_SESSIONS=100
```

## 10. Development Workflow

### Backend Development
1. Use `uv sync` to ensure dependencies are installed
2. Set up Azure OpenAI credentials in `.env` file
3. Run `uv run uvicorn main:app --reload` for development server
4. Use `uv run pytest` for testing
5. Run `uv run black . && uv run isort .` for formatting

### Frontend Development
1. Use `npm install` for dependencies
2. Run `npm run dev` for development server with HMR
3. Use `npm run test` for testing
4. Run `npm run lint:fix` for linting

### Production Build & Deployment
1. **Build frontend**: Run `npm run build` in frontend directory
2. **Verify static files**: Check that assets are built to `backend/static/`
3. **Start backend**: Backend serves both API routes and static frontend
4. **Access application**: Visit backend URL (frontend loads from `/` route)

### Build Configuration Requirements
**Vite config must include:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
  // ... other config
});
```

**FastAPI must serve static files:**
```python
# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Mount static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
```

## 11. Implementation Checklist

### Before Starting
- [ ] Understand requirements completely
- [ ] Review existing codebase and patterns
- [ ] Plan the approach and architecture
- [ ] Identify potential risks and edge cases

### During Development
- [ ] Follow naming conventions strictly
- [ ] Write tests alongside code
- [ ] Document complex logic
- [ ] Handle errors appropriately
- [ ] Consider performance implications

### Before Submission
- [ ] All tests pass locally
- [ ] Code is properly formatted
- [ ] No console.logs or debug code
- [ ] Documentation is updated
- [ ] Error messages are helpful

## 12. Agent-Specific Guidelines

### Agent Types
- **chat**: General purpose conversation agent
- **task**: Task execution and planning agent
- **analysis**: Data analysis and insights agent

### Agent Implementation Pattern
1. Create base agent interface
2. Implement specific agent types
3. Use factory pattern for agent creation
4. Handle Azure OpenAI integration consistently
5. Implement proper session management

---

*Document Version: 2.0*
*Last Updated: August 2025*
