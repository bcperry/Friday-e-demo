# Enhanced MCP Web Scraper with Advanced Stealth Features
# Improved scraper with better success rates and anti-detection measures

import asyncio
import logging
import random
import time
import json
from fastmcp import FastMCP
from typing import Dict, List, Any, Optional, Union, Literal
from urllib.parse import urljoin, urlparse
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field
import html

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create MCP server
mcp = FastMCP("enhanced-web-scraper")

class StealthConfig:
    """Configuration for stealth scraping features"""
    
    # Rotate between different realistic user agents
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
    
    # Common browser headers to appear more legitimate
    BROWSER_HEADERS = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }

class EnhancedScraper:
    """Enhanced web scraper with stealth features and resilience"""
    
    def __init__(self):
        self.session = requests.Session()
        self._setup_session()
        
    def _setup_session(self):
        """Configure session with retry strategy and realistic headers"""
        # Setup retry strategy
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set default headers
        self.session.headers.update(StealthConfig.BROWSER_HEADERS)
        
    def _get_stealth_headers(self, url: str) -> Dict[str, str]:
        """Generate stealth headers for the request"""
        headers = StealthConfig.BROWSER_HEADERS.copy()
        headers['User-Agent'] = random.choice(StealthConfig.USER_AGENTS)
        
        # Add referer for internal links
        parsed_url = urlparse(url)
        if parsed_url.netloc:
            headers['Referer'] = f"{parsed_url.scheme}://{parsed_url.netloc}/"
            
        return headers
    
    def _detect_encoding(self, response: requests.Response) -> str:
        """Detect proper encoding for the response"""
        # Prefer server-declared encoding if not the default ISO-8859-1
        if response.encoding and response.encoding.lower() != 'iso-8859-1':
            return response.encoding

        # Use requests' apparent_encoding (charset-normalizer under the hood)
        try:
            if getattr(response, 'apparent_encoding', None):
                return response.apparent_encoding
        except Exception:
            pass

        # Fallback to UTF-8
        return 'utf-8'
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
            
        # Decode HTML entities
        text = html.unescape(text)
        
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def fetch_with_fallback(self, url: str, use_javascript: bool = False) -> BeautifulSoup:
        """
        Fetch webpage with multiple fallback strategies
        """
        errors = []
        
        # Strategy 1: Enhanced requests with stealth headers
        try:
            return self._fetch_with_requests(url)
        except Exception as e:
            errors.append(f"Requests method failed: {str(e)}")
            logger.warning(f"Requests method failed for {url}: {e}")
        
        # Strategy 2: Simplified requests with minimal headers
        try:
            return self._fetch_simple(url)
        except Exception as e:
            errors.append(f"Simple method failed: {str(e)}")
            logger.warning(f"Simple method failed for {url}: {e}")
            
        # Strategy 3: Raw content approach
        try:
            return self._fetch_raw(url)
        except Exception as e:
            errors.append(f"Raw method failed: {str(e)}")
            logger.warning(f"Raw method failed for {url}: {e}")
        
        # If all strategies fail, raise combined error
        raise Exception(f"All fetch strategies failed for {url}. Errors: {'; '.join(errors)}")
    
    def _fetch_with_requests(self, url: str) -> BeautifulSoup:
        """Primary fetch method with stealth features"""
        headers = self._get_stealth_headers(url)
        # Small random delay to appear more human-like without causing timeouts
        time.sleep(random.uniform(0.1, 0.3))

        response = self.session.get(
            url,
            headers=headers,
            timeout=10,
            allow_redirects=True,
            verify=True,
        )
        response.raise_for_status()

        # Detect and use proper encoding
        encoding = self._detect_encoding(response)
        response.encoding = encoding

        # Parse with multiple parsers as fallback
        try:
            return BeautifulSoup(response.text, 'lxml')
        except Exception:
            try:
                return BeautifulSoup(response.text, 'html.parser')
            except Exception:
                return BeautifulSoup(response.content, 'html.parser')

    def _fetch_simple(self, url: str) -> BeautifulSoup:
        """Simplified fetch method"""
        simple_headers = {
            'User-Agent': random.choice(StealthConfig.USER_AGENTS)
        }
        response = requests.get(url, headers=simple_headers, timeout=8)
        response.raise_for_status()

        # Auto-detect encoding
        encoding = self._detect_encoding(response)
        response.encoding = encoding

        return BeautifulSoup(response.text, 'html.parser')

    def _fetch_raw(self, url: str) -> BeautifulSoup:
        """Raw fetch method as last resort"""
        response = requests.get(url, timeout=5)
        response.raise_for_status()

        # Use raw content and let BeautifulSoup handle encoding
        return BeautifulSoup(response.content, 'html.parser')

# Global scraper instance
scraper = EnhancedScraper()

def extract_metadata(soup: BeautifulSoup, url: str, include_technical: bool = True) -> Dict[str, Any]:
    """Extract page metadata including Open Graph, Twitter, and basic tags.

    Args:
        soup: BeautifulSoup document
        url: Page URL used for resolving relative links
        include_technical: If True, include extra technical metadata

    Returns:
        Dict with at least 'title' and 'description'
    """
    def abs_url(href: Optional[str]) -> Optional[str]:
        if not href:
            return None
        return urljoin(url, href)

    def get_meta(property_name: str = None, name: str = None, itemprop: str = None) -> Optional[str]:
        if property_name:
            el = soup.find('meta', property=property_name)
            if el and el.get('content'):
                return scraper._clean_text(el.get('content'))
        if name:
            el = soup.find('meta', attrs={'name': name})
            if el and el.get('content'):
                return scraper._clean_text(el.get('content'))
        if itemprop:
            el = soup.find('meta', attrs={'itemprop': itemprop})
            if el and el.get('content'):
                return scraper._clean_text(el.get('content'))
        return None

    title = get_meta('og:title') or (scraper._clean_text(soup.title.string) if soup.title and soup.title.string else '')
    description = get_meta('og:description') or get_meta(name='description') or ''
    site_name = get_meta('og:site_name') or urlparse(url).netloc
    canonical = None
    link_canon = soup.find('link', rel=lambda v: v and 'canonical' in v)
    if link_canon and link_canon.get('href'):
        canonical = abs_url(link_canon.get('href'))
    language = None
    if soup.html and soup.html.get('lang'):
        language = soup.html.get('lang').lower()
    # favicon
    favicon = None
    for rel in ('icon', 'shortcut icon', 'apple-touch-icon'):
        link = soup.find('link', rel=lambda v: v and rel in v)
        if link and link.get('href'):
            favicon = abs_url(link.get('href'))
            break
    author = get_meta(name='author') or get_meta(property_name='article:author')
    published = get_meta(property_name='article:published_time') or get_meta(name='article:published_time') or get_meta(name='date') or get_meta(name='dc.date') or get_meta(itemprop='datePublished')
    if not published:
        t = soup.find('time')
        if t and t.get('datetime'):
            published = scraper._clean_text(t.get('datetime'))

    # og and twitter
    og_image = get_meta('og:image')
    og_type = get_meta('og:type')
    og_url = get_meta('og:url')
    twitter_card = get_meta(name='twitter:card')
    twitter_title = get_meta(name='twitter:title')
    twitter_desc = get_meta(name='twitter:description')
    twitter_image = get_meta(name='twitter:image')

    # robots and viewport
    robots = get_meta(name='robots')
    viewport = get_meta(name='viewport')
    generator = get_meta(name='generator')

    # keywords/tags
    tags: List[str] = []
    kw = get_meta(name='keywords')
    if kw:
        tags.extend([scraper._clean_text(x) for x in kw.split(',') if x.strip()])
    for container_sel in ['.tags', '.post-tags', "[rel='tag']"]:
        for el in soup.select(container_sel):
            if el.name == 'a':
                t = scraper._clean_text(el.get_text())
                if t:
                    tags.append(t)
            else:
                for a in el.find_all('a'):
                    t = scraper._clean_text(a.get_text())
                    if t:
                        tags.append(t)
    tags = list(dict.fromkeys(tags))

    metadata: Dict[str, Any] = {
        'title': title,
        'description': description,
        'site_name': site_name,
        'canonical': canonical,
        'language': language,
        'favicon': favicon,
        'author': author,
        'published': published,
        'open_graph': {
            'image': abs_url(og_image) if og_image else None,
            'type': og_type,
            'url': og_url or url,
        },
        'twitter': {
            'card': twitter_card,
            'title': twitter_title,
            'description': twitter_desc,
            'image': abs_url(twitter_image) if twitter_image else None,
        },
        'robots': robots,
        'viewport': viewport,
        'generator': generator,
        'tags': tags,
    }

    if include_technical:
        # simple technical info
        images_count = len(soup.find_all('img'))
        links_count = len(soup.find_all('a'))
        content_type = None
        charset = soup.original_encoding if hasattr(soup, 'original_encoding') else None
        metadata.update({
            'technical': {
                'images_count': images_count,
                'links_count': links_count,
                'charset': charset,
                'content_type': content_type,
            }
        })

    return metadata

@mcp.tool()
async def list_links_with_descriptions_tool(
        url: str = Field(..., description="The page URL to scan for links"),
        max_links: int = Field(50, ge=1, le=200, description="Maximum number of links to include"),
        include_anchor_text: bool = Field(True, description="Use the anchor text as description when available"),
        include_title_attribute: bool = Field(True, description="Use the <a title> or aria-label when available"),
    fetch_linked_pages: bool = Field(False, description="Fetch each linked page to get meta description/title (slower)"),
        fetch_limit: int = Field(10, ge=1, le=50, description="When fetching linked pages, cap how many to fetch")
) -> str:
    """Generate a mapping of {link: description} found on the page.

    Description priority on the source page:
    - aria-label
    - title attribute
    - anchor text

    If fetch_linked_pages=True, we will fetch up to `fetch_limit` linked pages
    and replace empty/short descriptions with the linked page's meta description
    or title.
    """
    try:
        # Fetch and parse the base page
        soup = scraper.fetch_with_fallback(url)

        links = soup.find_all('a', href=True)
        results: dict[str, str] = {}

        def is_http(href: str) -> bool:
            p = urlparse(href)
            if not p.scheme:
                return True  # relative, will be joined below
            return p.scheme in {"http", "https"}

        # First pass: collect links and best local description
        ordered: list[tuple[str, str]] = []
        seen: set[str] = set()
        for a in links:
            href = a.get('href')
            if not href:
                continue
            if href.startswith('#'):
                continue  # skip same-page anchors
            if not is_http(href):
                continue  # skip mailto:, javascript:, tel:, etc.

            absolute = urljoin(url, href)
            # Normalize by removing fragments
            parsed = urlparse(absolute)
            normalized = parsed._replace(fragment='').geturl()
            if normalized in seen:
                continue
            seen.add(normalized)

            desc_candidates: list[str] = []
            if include_title_attribute:
                for attr in ('aria-label', 'title'):
                    val = a.get(attr)
                    if val:
                        desc_candidates.append(scraper._clean_text(val))
            if include_anchor_text:
                txt = scraper._clean_text(a.get_text())
                if txt:
                    desc_candidates.append(txt)

            # choose first non-empty, prefer longer than 3 chars
            description = next((d for d in desc_candidates if len(d) > 3), (desc_candidates[0] if desc_candidates else ''))
            ordered.append((normalized, description))

            if len(ordered) >= max_links:
                break

        # Optional: enrich by fetching linked pages (limited)
        if fetch_linked_pages and ordered:
            to_enrich = ordered[: min(fetch_limit, len(ordered))]
            for i, (link_url, description) in enumerate(to_enrich):
                # Only fetch if we don't already have a decent description
                if description and len(description) >= 20:
                    continue
                try:
                    linked_soup = scraper.fetch_with_fallback(link_url)
                    meta = extract_metadata(linked_soup, link_url, include_technical=False)
                    meta_desc = meta.get('description') or ''
                    meta_title = meta.get('title') or ''
                    enriched = scraper._clean_text(meta_desc or meta_title)
                    if enriched:
                        to_enrich[i] = (link_url, enriched)
                except Exception:
                    # Ignore fetch errors for individual links
                    pass

            # Merge enriched back
            enriched_map = {u: d for (u, d) in to_enrich}
            ordered = [(u, (enriched_map.get(u) or d)) for (u, d) in ordered]

        # Build mapping
        for link_url, description in ordered:
            results[link_url] = description

        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error extracting links from {url}: {e}")
        return json.dumps({"error": f"Failed to extract links: {str(e)}"}, ensure_ascii=False)

@mcp.tool()
async def extract_article_content_tool(
        url: str = Field(..., description="The URL to extract article content from"),
        use_javascript: bool = Field(True, description="Enable JavaScript rendering")
) -> Dict[str, Any]:
    """Extract main article content and return a structured dict with text, images, links, and metadata."""
    try:
        soup = scraper.fetch_with_fallback(url, use_javascript=use_javascript)

        # Utility: absolute URL
        def abs_url(href: Optional[str]) -> Optional[str]:
            if not href:
                return None
            return urljoin(url, href)

        # Title priority: og:title -> <title>
        def get_title() -> str:
            og = soup.find("meta", property="og:title")
            if og and og.get("content"):
                return scraper._clean_text(og.get("content"))
            if soup.title and soup.title.string:
                return scraper._clean_text(soup.title.string)
            return ""

        # Description priority: og:description -> meta[name=description]
        def get_description() -> str:
            og = soup.find("meta", property="og:description")
            if og and og.get("content"):
                return scraper._clean_text(og.get("content"))
            md = soup.find("meta", attrs={"name": "description"})
            if md and md.get("content"):
                return scraper._clean_text(md.get("content"))
            return ""

        # Site name
        def get_site_name() -> str:
            og = soup.find("meta", property="og:site_name")
            if og and og.get("content"):
                return scraper._clean_text(og.get("content"))
            return urlparse(url).netloc

        # Canonical
        def get_canonical() -> Optional[str]:
            link = soup.find("link", rel=lambda v: v and "canonical" in v)
            return abs_url(link.get("href")) if link and link.get("href") else None

        # Language
        def get_lang() -> Optional[str]:
            html_tag = soup.find("html")
            if html_tag and html_tag.get("lang"):
                return html_tag.get("lang").lower()
            return None

        # Favicon
        def get_favicon() -> Optional[str]:
            for rel in ("icon", "shortcut icon", "apple-touch-icon"):
                link = soup.find("link", rel=lambda v: v and rel in v)
                if link and link.get("href"):
                    return abs_url(link.get("href"))
            return None

        # Author
        def get_author() -> Optional[str]:
            for sel in [
                'meta[name="author"]',
                'meta[property="article:author"]',
                '[itemprop="author"]',
                '.byline', '.author', '.post-author'
            ]:
                el = soup.select_one(sel)
                if el:
                    content = el.get("content") if el.name == "meta" else el.get_text()
                    content = scraper._clean_text(content or "")
                    if content:
                        return content
            return None

        # Published date
        def get_published() -> Optional[str]:
            meta_props = [
                ('meta', {"property": "article:published_time"}),
                ('meta', {"name": "article:published_time"}),
                ('meta', {"name": "date"}),
                ('meta', {"name": "dc.date"}),
                ('meta', {"itemprop": "datePublished"}),
            ]
            for tag, attrs in meta_props:
                el = soup.find(tag, attrs=attrs)
                if el and el.get("content"):
                    return scraper._clean_text(el.get("content"))
            # <time datetime>
            t = soup.find("time")
            if t and t.get("datetime"):
                return scraper._clean_text(t.get("datetime"))
            return None

        # Detect primary content container
        content_selectors = [
            'article', '[role="main"]', 'main', '.content', '#content',
            '.post-content', '.entry-content', '.article-content',
            '.story-body', '.article-body'
        ]
        main_el = None
        for selector in content_selectors:
            el = soup.select_one(selector)
            if el:
                main_el = el
                break
        if not main_el:
            main_el = soup.body or soup

        # Extract text: headings + paragraphs within the main content
        text_chunks: List[str] = []
        for node in main_el.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"], recursive=True):
            txt = scraper._clean_text(node.get_text(separator=" "))
            if txt and len(txt) > 3:
                text_chunks.append(txt)
        # Build a long-form text and a short excerpt
        text = "\n\n".join(text_chunks[:400])  # cap to avoid overlong payloads
        excerpt = " ".join(text_chunks[:3]) if text_chunks else ""

        # Extract headings separately
        headings = []
        for tag in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            for h in main_el.find_all(tag):
                t = scraper._clean_text(h.get_text())
                if t:
                    headings.append({"tag": tag, "text": t})

        # Extract images from main content (fallback to page-wide if none)
        def collect_images(scope) -> List[Dict[str, Any]]:
            out: List[Dict[str, Any]] = []
            for img in scope.find_all("img", src=True)[:50]:
                src = abs_url(img.get("src"))
                if not src:
                    continue
                out.append({
                    "src": src,
                    "alt": scraper._clean_text(img.get("alt", "")),
                    "title": scraper._clean_text(img.get("title", "")),
                    "width": img.get("width"),
                    "height": img.get("height"),
                })
            return out

        images = collect_images(main_el)
        if not images:
            images = collect_images(soup)

        # Extract links within main content
        links: List[Dict[str, Any]] = []
        for a in main_el.find_all("a", href=True)[:100]:
            href = abs_url(a.get("href"))
            if not href:
                continue
            # Skip same-page anchors
            if href.endswith("#") or urlparse(href).fragment:
                continue
            txt = scraper._clean_text(a.get_text())
            if not txt:
                continue
            links.append({
                "url": href,
                "text": txt,
                "title": a.get("title") or "",
            })

        # Tags/keywords
        tags: List[str] = []
        mk = soup.find("meta", attrs={"name": "keywords"})
        if mk and mk.get("content"):
            tags.extend([scraper._clean_text(x) for x in mk.get("content").split(",") if x.strip()])
        for container_sel in [".tags", ".post-tags", "[rel='tag']"]:
            for el in soup.select(container_sel):
                if el.name == "a":
                    t = scraper._clean_text(el.get_text())
                    if t:
                        tags.append(t)
                else:
                    for a in el.find_all("a"):
                        t = scraper._clean_text(a.get_text())
                        if t:
                            tags.append(t)
        # Dedupe tags
        tags = list(dict.fromkeys(tags))

        # Build metadata
        metadata: Dict[str, Any] = {
            "title": get_title(),
            "description": get_description(),
            "site_name": get_site_name(),
            "canonical": get_canonical(),
            "language": get_lang(),
            "favicon": get_favicon(),
            "author": get_author(),
            "published": get_published(),
            "tags": tags,
        }

        # Final structured result
        result: Dict[str, Any] = {
            "url": url,
            "title": metadata.get("title") or get_title(),
            "text": text,
            "excerpt": excerpt,
            "images": images,
            "links": links,
            "headings": headings,
            "metadata": metadata,
            "word_count": len(text.split()) if text else 0,
            "content_length": len(text),
            "extraction_method": "enhanced_article_extraction_v2",
            "timestamp": time.time(),
        }

        return result
    except Exception as e:
        return {
            "url": url,
            "error": f"Error extracting article: {str(e)}",
        }


if __name__ == "__main__":

    mcp.run(transport='streamable-http', host='0.0.0.0', port=8001)
