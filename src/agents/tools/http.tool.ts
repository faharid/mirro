export async function executeHttpRequest(options: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<{ status: number; data: unknown }> {
  const response = await fetch(options.url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return { status: response.status, data };
}
