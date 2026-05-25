export async function executeWebSearch(
  query: string,
  apiKey?: string,
): Promise<{ results: Array<{ title: string; snippet: string; link: string }> }> {
  if (!apiKey) {
    return {
      results: [
        {
          title: 'Web search stub',
          snippet: `Search query: "${query}". Configure SERPAPI_KEY for live results.`,
          link: 'https://example.com',
        },
      ],
    };
  }

  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const response = await fetch(url);
  const data = (await response.json()) as {
    organic_results?: Array<{ title: string; snippet: string; link: string }>;
  };

  return {
    results: (data.organic_results || []).slice(0, 5).map((r) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
    })),
  };
}
