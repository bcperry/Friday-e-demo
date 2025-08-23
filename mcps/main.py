from fastmcp import FastMCP
import asyncio
import logging
from typing import Dict, List, Any, Optional
import requests
from bs4 import BeautifulSoup
from mcp.types import Tool, TextContent
from pydantic import BaseModel

# Initialize the MCP server with a descriptive name

print("MCP Server Initialized: web Scraper")

# Create MCP server
mcp = FastMCP("web-scraper")

# Headers to mimic a real browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_and_parse(url: str) -> BeautifulSoup:
    """Fetch webpage and return BeautifulSoup object"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        return BeautifulSoup(response.content, 'lxml')
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch URL: {str(e)}")

@mcp.tool()
async def scrape_website_tool(args: Dict[str, Any]) -> List[TextContent]:
    """Scrape website and extract data"""
    try:
        url = args["url"]
        extract_type = args.get("extract_type", "text")
        selector = args.get("selector")
        max_results = args.get("max_results", 10)
        
        soup = fetch_and_parse(url)
        title = soup.title.string if soup.title else "No title"
        
        data = []
        
        if extract_type == "text":
            elements = soup.select(selector) if selector else soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for elem in elements[:max_results]:
                text = elem.get_text(strip=True)
                if text:
                    data.append({
                        'text': text,
                        'tag': elem.name,
                        'class': elem.get('class', [])
                    })
        
        elif extract_type == "links":
            elements = soup.select(selector) if selector else soup.find_all('a', href=True)
            for elem in elements[:max_results]:
                data.append({
                    'text': elem.get_text(strip=True),
                    'href': elem.get('href'),
                    'title': elem.get('title', '')
                })
        
        elif extract_type == "images":
            elements = soup.select(selector) if selector else soup.find_all('img', src=True)
            for elem in elements[:max_results]:
                data.append({
                    'src': elem.get('src'),
                    'alt': elem.get('alt', ''),
                    'title': elem.get('title', '')
                })
        
        elif extract_type == "table":
            tables = soup.select(selector) if selector else soup.find_all('table')
            for table in tables[:max_results]:
                rows = table.find_all('tr')
                table_data = []
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    row_data = [cell.get_text(strip=True) for cell in cells]
                    if row_data:
                        table_data.append(' | '.join(row_data))
                if table_data:
                    data.append({
                        'table_data': '\n'.join(table_data),
                        'rows': len(table_data)
                    })
        
        result = {
            'url': url,
            'title': title,
            'extract_type': extract_type,
            'count': len(data),
            'data': data
        }
        
        return [TextContent(type="text", text=f"Successfully scraped {url}\n\n" + str(result))]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error scraping website: {str(e)}")]

@mcp.tool()
async def extract_headlines_tool(args: Dict[str, Any]) -> List[TextContent]:
    """Extract headlines from webpage"""
    try:
        url = args["url"]
        soup = fetch_and_parse(url)
        title = soup.title.string if soup.title else "No title"
        
        headlines = soup.find_all(['h1', 'h2', 'h3'])
        data = []
        
        for headline in headlines:
            text = headline.get_text(strip=True)
            if text:
                data.append({
                    'text': text,
                    'tag': headline.name,
                    'class': headline.get('class', []),
                    'id': headline.get('id', '')
                })
        
        result = {
            'url': url,
            'title': title,
            'headlines_count': len(data),
            'headlines': data
        }
        
        return [TextContent(type="text", text=f"Headlines from {url}\n\n" + str(result))]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error extracting headlines: {str(e)}")]

@mcp.tool()
async def extract_metadata_tool(args: Dict[str, Any]) -> List[TextContent]:
    """Extract metadata from webpage"""
    try:
        url = args["url"]
        soup = fetch_and_parse(url)
        
        metadata = {
            'url': url,
            'title': soup.title.string if soup.title else None,
            'description': None,
            'keywords': None,
            'author': None,
            'og_title': None,
            'og_description': None,
            'og_image': None,
            'twitter_title': None,
            'twitter_description': None,
        }
        
        # Extract meta tags
        meta_tags = soup.find_all('meta')
        for tag in meta_tags:
            name = tag.get('name', '').lower()
            property_name = tag.get('property', '').lower()
            content = tag.get('content', '')
            
            if name == 'description':
                metadata['description'] = content
            elif name == 'keywords':
                metadata['keywords'] = content
            elif name == 'author':
                metadata['author'] = content
            elif property_name == 'og:title':
                metadata['og_title'] = content
            elif property_name == 'og:description':
                metadata['og_description'] = content
            elif property_name == 'og:image':
                metadata['og_image'] = content
            elif name == 'twitter:title':
                metadata['twitter_title'] = content
            elif name == 'twitter:description':
                metadata['twitter_description'] = content
        
        return [TextContent(type="text", text=f"Metadata from {url}\n\n" + str(metadata))]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error extracting metadata: {str(e)}")]

@mcp.tool()
async def get_page_info_tool(args: Dict[str, Any]) -> List[TextContent]:
    """Get basic page information"""
    try:
        url = args["url"]
        soup = fetch_and_parse(url)
        
        # Extract basic info
        title = soup.title.string if soup.title else None
        meta_description = None
        
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc:
            meta_description = meta_desc.get('content')
        
        # Count elements
        info = {
            'url': url,
            'title': title,
            'description': meta_description,
            'stats': {
                'paragraphs': len(soup.find_all('p')),
                'headings': len(soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])),
                'links': len(soup.find_all('a', href=True)),
                'images': len(soup.find_all('img')),
                'tables': len(soup.find_all('table')),
                'forms': len(soup.find_all('form'))
            }
        }
        
        return [TextContent(type="text", text=f"Page information for {url}\n\n" + str(info))]
        
    except Exception as e:
        return [TextContent(type="text", text=f"Error getting page info: {str(e)}")]

if __name__ == "__main__":
    mcp.run(transport="http", host="127.0.0.1", port=8001)