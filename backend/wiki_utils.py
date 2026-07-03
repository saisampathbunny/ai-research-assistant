"""Fetch a Wikipedia article's text using the free `wikipedia` package."""

import wikipedia

# Wikimedia rate-limits the `wikipedia` package's default User-Agent very
# aggressively (it's shared by every project using this library). Setting a
# distinct one avoids near-instant 429 "too many requests" errors.
wikipedia.set_user_agent("ai-research-assistant-demo/1.0 (educational project)")


class WikipediaFetchError(Exception):
    """Raised when we can't find (or must disambiguate) a Wikipedia topic."""


def fetch_wikipedia_article(topic: str) -> dict:
    """Look up `topic` on Wikipedia and return its title, url and full text.

    Returns a dict: {"title": str, "url": str, "content": str}
    """
    # wikipedia's built-in auto_suggest is unreliable (it sometimes "corrects"
    # a perfectly valid title into gibberish), so we search first ourselves
    # and then fetch that exact title with auto_suggest turned off.
    search_results = wikipedia.search(topic)
    if not search_results:
        raise WikipediaFetchError(f"No Wikipedia article found for '{topic}'.")

    try:
        page = wikipedia.page(search_results[0], auto_suggest=False)
    except wikipedia.exceptions.DisambiguationError as e:
        # Multiple articles match this topic, ask the user to be specific
        options = ", ".join(e.options[:5])
        raise WikipediaFetchError(
            f"'{topic}' is ambiguous. Did you mean: {options}?"
        )
    except wikipedia.exceptions.PageError:
        raise WikipediaFetchError(f"No Wikipedia article found for '{topic}'.")

    return {
        "title": page.title,
        "url": page.url,
        "content": page.content,
    }
