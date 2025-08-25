import streamlit as st
from functions import fetch_agents, run_agent, show_results

st.title("FRIDAY-E")

st.set_page_config(page_title="FRIDAY-E", layout="wide", page_icon=":robot:")

# Display logo
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    st.image("https://via.placeholder.com/300x100/1f77b4/white?text=FRIDAY-E", width=300)

# Backend API configuration
BACKEND_URL = "http://127.0.0.1:8000"

st.session_state.backend_url = BACKEND_URL


# Main app
st.header("Available Agents")

# Fetch and display agents
agents = fetch_agents(BACKEND_URL)
st.session_state.agents = agents

if agents:
    st.success(f"Found {len(agents)} agents: {', '.join(agents)}")

    # Display agents as a selectbox
    selected_agent = st.session_state.agents[0] if st.session_state.agents else None
    st.subheader("Using the {} Agent".format(selected_agent))

    if selected_agent:
        
        # Add a text input for queries
        st.subheader("Ask a Question, or select locations and topics below")
        query = st.text_area("Enter your query:", placeholder="What would you like to know?")

        # Add location and topic selectors
        locations = ["BBC News", "CNN", "Reuters", "Associated Press", "NPR", "Fox News", "CNBC", "Bloomberg", "The Guardian", "Wall Street Journal"]
        topics = ["Ukraine", "China", "War", "Technology", "Science", "Breaking News"]

        selected_locations = st.multiselect("Select Locations", locations)
        selected_topics = st.multiselect("Select Topics", topics)

        if selected_locations or selected_topics:
            query = f"The user provided {query} as well as [Locations: {', '.join(selected_locations)}] [Topics: {', '.join(selected_topics)}]"

        if st.button("Submit Query"):
            if query:
                with st.spinner("Processing your query..."):
                    result = run_agent(query, selected_agent, BACKEND_URL)
                    if result:
                        # Store result in session state
                        st.session_state.query_result = result
            else:
                st.warning("Please enter a query")

        # Display results from session state (outside the button callback)
        if 'query_result' in st.session_state and st.session_state.query_result:
            show_results(st.session_state.query_result)
else:
    st.error("No agents available or backend is not accessible")

