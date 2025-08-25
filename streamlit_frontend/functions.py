import streamlit as st
import requests
import json


# Function to fetch agents from the backend
def fetch_agents(BACKEND_URL):
    try:
        response = requests.get(f"{BACKEND_URL}/api/agents")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching agents: {e}")
        return []
    

@st.cache_data()
def run_agent(query, selected_agent, BACKEND_URL):
    try:
        # Make request to the agent endpoint
        payload = {"query": query}
        response = requests.post(
            f"{BACKEND_URL}/api/agent",
            json=payload,
            params={"agent_name": selected_agent}
        )
        response.raise_for_status()
        result = response.json()
        # Parse response as JSON if it's a string, otherwise keep as dict
        response_data = result.get("response")
        if isinstance(response_data, str):
            try:
                result['response_json'] = json.loads(response_data)
            except json.JSONDecodeError:
                print(result)
                print("Failed to decode response JSON")
        else:
            result['response_json'] = response_data

    except requests.exceptions.RequestException as e:
        st.error(f"Error processing query: {e}")
    return result

def show_results(response_data):
    result = st.session_state.query_result
    # Create expandable sections for response items
    if "response_json" in result and result["response_json"]:
        response_data = result["response_json"]
        st.subheader(f"{len(response_data)} Relevant result{'s' if len(response_data) != 1 else ''}")

        for key, value in response_data.items():


            # Create expander with item name or fallback title
            expander_title = value.get("name", value.get("title", f"Item {key}"))

            with st.expander(expander_title, expanded=True):
                if st.checkbox("View Json", key=f"view_json_{key}"):
                    st.json(value)
                # Display title if different from expander title
                if "title" in value and value["title"] != expander_title:
                    st.subheader(value["title"])

                # Display summary
                if "summary" in value:
                    st.write("**Summary:**")
                    updated_summary = st.text_area(
                        label="Summary", 
                        value=value["summary"], 
                        key=f"summary_{key}", 
                        label_visibility="collapsed"
                    )
                    
                    # Update the session state when summary changes
                    if updated_summary != value["summary"]:
                        st.session_state.query_result["response_json"][key]["summary"] = updated_summary
                        st.rerun()

                # Display content
                if "content" in value:
                    st.write("**Content:**")
                    st.write(value["content"], height=300, key=f"content_{key}")

                # Display media and images
                media_urls = []
                
                # Collect media URLs
                if "media" in value:
                    if isinstance(value["media"], list):
                        for media in value["media"]:
                            if isinstance(media, str):
                                media_urls.append(media)
                            elif isinstance(media, dict) and "url" in media:
                                media_urls.append(media["url"])
                
                # Collect image URLs
                if "images" in value:
                    if isinstance(value["images"], list):
                        for img in value["images"]:
                            if isinstance(img, str):
                                media_urls.append(img)
                            elif isinstance(img, dict) and "url" in img:
                                media_urls.append(img["url"])
                
                # Remove duplicates and display
                if media_urls:
                    unique_media_urls = list(dict.fromkeys(media_urls))  # Preserves order while removing duplicates
                    st.write("**Media:**")
                    for i, url in enumerate(unique_media_urls):
                        col1, col2 = st.columns([4, 1])
                        
                        with col1:
                            # Check file extension to determine media type
                            url_lower = url.lower()
                            if url_lower.endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp')):
                                st.image(url)
                            elif url_lower.endswith(('.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv')):
                                st.video(url)
                            elif url_lower.endswith(('.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac')):
                                st.audio(url)
                            else:
                                # Fallback for unknown types - display as link
                                st.markdown(f"[Media Link]({url})")
                        
                        with col2:
                            if st.button("Remove", key=f"remove_media_{key}_{i}"):
                                # Remove the specific URL from the session state data
                                if "media" in st.session_state.query_result["response_json"][key]:
                                    media_list = st.session_state.query_result["response_json"][key]["media"]
                                    if isinstance(media_list, list):
                                        # Find and remove the specific URL
                                        updated_media = []
                                        for m in media_list:
                                            if isinstance(m, str) and m == url:
                                                continue  # Skip this one
                                            elif isinstance(m, dict) and m.get("url") == url:
                                                continue  # Skip this one
                                            else:
                                                updated_media.append(m)
                                        st.session_state.query_result["response_json"][key]["media"] = updated_media
                                
                                if "images" in st.session_state.query_result["response_json"][key]:
                                    images_list = st.session_state.query_result["response_json"][key]["images"]
                                    if isinstance(images_list, list):
                                        # Find and remove the specific URL
                                        updated_images = []
                                        for img in images_list:
                                            if isinstance(img, str) and img == url:
                                                continue  # Skip this one
                                            elif isinstance(img, dict) and img.get("url") == url:
                                                continue  # Skip this one
                                            else:
                                                updated_images.append(img)
                                        st.session_state.query_result["response_json"][key]["images"] = updated_images
                                
                                st.rerun()  # Refresh the page to show changes

                if not st.session_state.get(f"identify_us_persons_{key}"):
                    if st.button("Identify US Persons", key=f"identify_us_persons_{key}", use_container_width=True):
                        st.session_state[f"identify_us_persons_{key}"] = True

                if st.session_state.get(f"identify_us_persons_{key}"):
                    USPER_data = run_agent(value["content"], "USPER", st.session_state.backend_url)
                    st.write("**Redacted Text**")
                    st.write(USPER_data['response_json']['redacted_text'])
                    st.session_state.query_result['redacted_text'] = USPER_data['response_json']['redacted_text']
                    st.success("Identified US Persons Successfully!")

                if st.button("Submit", key=f"submit_{key}", use_container_width=True):
                    st.success("Submitted Successfully!")
