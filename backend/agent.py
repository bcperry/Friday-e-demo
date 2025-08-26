import asyncio
from datetime import datetime

from semantic_kernel import Kernel
from semantic_kernel.utils.logging import setup_logging
from semantic_kernel.functions import kernel_function
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.ollama import OllamaChatCompletion
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.agents import ChatCompletionAgent, ChatHistoryAgentThread
from semantic_kernel.contents.utils.author_role import AuthorRole

from semantic_kernel.connectors.ai.chat_completion_client_base import ChatCompletionClientBase
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.functions.kernel_arguments import KernelArguments
from semantic_kernel.contents import ChatMessageContent, StreamingChatMessageContent, FunctionCallContent, FunctionResultContent

from semantic_kernel.connectors.ai.open_ai.prompt_execution_settings.azure_chat_prompt_execution_settings import (
    AzureChatPromptExecutionSettings,
)
from semantic_kernel.contents import ChatHistorySummarizationReducer

from semantic_kernel.connectors.mcp import MCPStreamableHttpPlugin, MCPSsePlugin

import logging
import json
import os
from dotenv import load_dotenv



class Agent:
    def __init__(self, agent_definition: dict):
        # Initialize the kernel
        self.service_id = agent_definition.get("name", "Agent")

        self.kernel = Kernel()
        self._setup_chat_completion(agent_definition)
        self.kernel.add_service(self.chat_completion)


        self.system_message = agent_definition.get("system_message", "You are a helpful assistant. Use your tools to assist users.")
        logging.debug(f"System message: {self.system_message}")
        

        # Suppose chat_service is your AzureChatCompletion service instance
        chat_history_reducer = ChatHistorySummarizationReducer(
            service=self.chat_completion,
            target_count=10,               # keep 10 most recent messages in detail
            threshold_count=5,             # allow a few extra before reducing
            auto_reduce=True,              # auto-summarize when using async adds
            include_function_content_in_summary=True,
            system_message=self.system_message    # summarize function content if it exceeds 3 messages
        )



        self.thread = ChatHistoryAgentThread(chat_history=chat_history_reducer)

        self.mcp_server_objects = []

        self._setup_logging()
        settings = self.kernel.get_prompt_execution_settings_from_service_id(service_id=self.service_id)
        # Configure the function choice behavior to auto invoke kernel functions
        settings.function_choice_behavior = FunctionChoiceBehavior.Auto(maximum_auto_invoke_attempts=15)
        settings.temperature = 0
        settings.max_tokens = 16384
        logging.debug(f"LLM settings: {settings}")


        self.agent = ChatCompletionAgent(
            kernel = self.kernel, 
            name = agent_definition.get("name", "Agent"),
            # instructions = "respond like a pirate for debugging",
            instructions = self.system_message,
            arguments = KernelArguments(settings = settings)
            )

    def _setup_logging(self, loglevel = logging.INFO):
        # Get the root logger to ensure we use the existing configuration
        root_logger = logging.getLogger()
        
        # Configure logging levels for different components
        logging.getLogger("semantic_kernel").setLevel(loglevel)
        logging.getLogger("semantic_kernel.kernel").setLevel(loglevel)
        logging.getLogger("semantic_kernel.connectors").setLevel(loglevel)
        
        # Set the level for the current module's logger
        logging.getLogger(__name__).setLevel(loglevel)
    
        # Only set up basic config if no handlers are configured
        if not root_logger.handlers:
            logging.basicConfig(
                level=loglevel,
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )

    async def _setup_mcp_plugins(self, mcp_plugins):
        """Setup MCP plugins from either a list of dicts or a dict of server configs"""

        # Handle if mcp_plugins is a dict (from agent_definition.json servers section)
        if isinstance(mcp_plugins, dict):
            servers_list = []
            for server_name, server_config in mcp_plugins.items():
                server_dict = {
                    "name": server_name,
                    **server_config
                }
                servers_list.append(server_dict)
            mcp_plugins = servers_list
        
        # Handle if mcp_plugins is already a list
        if not isinstance(mcp_plugins, list):
            logging.warning(f"mcp_plugins should be a list or dict, got {type(mcp_plugins)}")
            return
            
        for server in mcp_plugins:
            server_name = server.get("name", "unknown")
            server_type = server.get("type", "http")  # default to http
            server_url = server.get("url")
            
            if not server_url:
                logging.warning(f"No URL provided for server {server_name}, skipping")
                continue
            
            mcp_server = None
            if "/mcp" in server_url:
                mcp_server = MCPStreamableHttpPlugin(
                    name=server_name,
                    url=server_url,
                )
            elif "/sse" in server_url:
                mcp_server = MCPSsePlugin(
                    name=server_name,
                    url=server_url,
                )
            else:
                logging.warning(f"Unknown server type '{server_type}' for server {server_name}, skipping")
                continue
            
            if mcp_server:
                try:
                    await mcp_server.connect()
                    self.available_tools = await mcp_server.session.list_tools()
                    self.kernel.add_plugin(mcp_server)
                    self.mcp_server_objects.append(mcp_server)
                    logging.info(f"Successfully connected to MCP server: {server_name} ({server_type})")
                    await mcp_server.close()
                except Exception as e:
                    logging.error(f"Error connecting to {server_name} MCP server: {e}")

    @classmethod
    async def create(cls, agent_definition: dict):
        """Async factory that constructs an Agent and awaits MCP plugin setup.

        Usage:
            agent = await Agent.create(agent_definition)
        """
        inst = cls(agent_definition)
        logging.info("Created agent instance...")
        
        # Use mcp_plugins parameter if provided, otherwise use servers from agent_definition
        servers_to_setup = agent_definition.get("servers", {})
        
        logging.info(f"Setting up MCP plugins: {servers_to_setup}")
        await inst._setup_mcp_plugins(servers_to_setup)

        return inst

    async def run_agent(self, user_input: str):
        response = None  # Initialize response to avoid UnboundLocalError

        try:
            logging.info(f"Running agent with user input: {user_input}")
            for server in self.mcp_server_objects:
                await server.connect()

            async for response in self.agent.invoke(messages=user_input, thread=self.thread):
                logging.debug(f"Response content: {response.content}")
                self.thread = response.thread

            # Display messages from the agent thread (agent.thread.get_messages() is an async generator)
            i=0
            async for message in (self.thread.get_messages()):
                i+=1
                logging.info(f"{i}: Role: {message.role}")
                if message.role == "tool":
                    logging.info(f"\t{message.items[0].function_name}: \n\targs: {message.items[0].metadata['arguments']}")
                else:
                    logging.info(f"\t{message.content[:50]}")

            for server in self.mcp_server_objects:
                # Attempt to close the server connection gracefully
                try:
                    logging.debug(f"Closing MCP server connection: {server.name}")
                    await server.close()
                except Exception as e:
                    logging.error(f"Failed to close server connection: {e}")
        except Exception as e:
            # Best-effort cleanup; ignore errors
            if "429" in str(e) or "rate_limit_exceeded" in str(e).lower():
                logging.warning(f"Rate limit exceeded for agent {self.service_id}: {e}")
                return {"status_code": 429, "response": {
                    "error": "Rate limit exceeded. Please try again later."
                }}
            else:
                logging.error(f"Error running agent {self.service_id}: {e}")
                return {"error": "An error occurred while processing your request"}
        
        response_dict = {
            "response": response.content.content if response and hasattr(response, 'content') and hasattr(response.content, 'content') else "No response",
            "chat_history": [{"role": message.role, "content": message.content} for message in self.thread._chat_history.messages] if self.thread else [],
            "tools_called": [
                {
                    "name": item.function_name,
                    "arguments": item.metadata.get("arguments", None),
                    "results": getattr(item, "result", [None])[0].text if hasattr(item, "result") and item.result else None
                }
                for message in (self.thread._chat_history.messages if self.thread else []) if message.items
                for item in message.items if isinstance(item, FunctionResultContent)
            ],
        }

        if self.thread:
            await self.thread.delete()
        return response_dict

    def _setup_chat_completion(self, agent_definition):
        """Setup the chat completion service based on agent definition."""
        try:
            if "env_file_path" in agent_definition:
                logging.info(f"Loading environment variables from {agent_definition['env_file_path']}")
                # Load environment variables from .env file
                load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), agent_definition['env_file_path']))

                # Override agent_definition with environment variables if they exist
                if os.getenv("AZURE_OPENAI_ENDPOINT"):
                    agent_definition["endpoint"] = os.getenv("AZURE_OPENAI_ENDPOINT")
                if os.getenv("AZURE_OPENAI_API_KEY"):
                    agent_definition["api_key"] = os.getenv("AZURE_OPENAI_API_KEY")
                if os.getenv("AZURE_OPENAI_MODEL"):
                    agent_definition["deployment_name"] = os.getenv("AZURE_OPENAI_MODEL")
                if os.getenv("OPENAI_API_VERSION"):
                    agent_definition["api_version"] = os.getenv("OPENAI_API_VERSION")\
                    
                logging.info(f"Azure OpenAI endpoint: {agent_definition.get('endpoint', None)}")
            if "azure" in agent_definition.get("endpoint", ""):
                logging.info("Configuring Azure OpenAI Chat Completion")
                
                self.chat_completion = AzureChatCompletion(
                    service_id=agent_definition.get("service_id", "Agent"),
                    api_key=agent_definition.get("api_key", None),
                    deployment_name=agent_definition.get("deployment_name", None),
                    endpoint=agent_definition.get("endpoint", None),
                    base_url=agent_definition.get("base_url", None),
                    api_version=agent_definition.get("api_version", None),
                    ad_token=agent_definition.get("ad_token", None),
                    ad_token_provider=agent_definition.get("ad_token_provider", None),
                    token_endpoint=agent_definition.get("token_endpoint", None),
                    default_headers=agent_definition.get("default_headers", None),
                    async_client=agent_definition.get("async_client", None),
                    env_file_path=agent_definition.get("env_file_path", None),
                    env_file_encoding=agent_definition.get("env_file_encoding", None),
                    instruction_role=agent_definition.get("instruction_role", None),
                )

            else:
                logging.info("Configuring Ollama Chat Completion")
                self.chat_completion = OllamaChatCompletion(
                    ai_model_id=agent_definition.get("deployment_name", "gpt-oss:20b"),
                    host=agent_definition.get("endpoint", "http://localhost:11434"), # Default to local Ollama Instance
                )
            logging.info(f"Chat completion service configured: {self.chat_completion.__class__.__name__}")
        except Exception as e:
            logging.error(f"Failed to setup chat completion: {e}")


# Run the main function
if __name__ == "__main__":
    resp = asyncio.run(Agent())
