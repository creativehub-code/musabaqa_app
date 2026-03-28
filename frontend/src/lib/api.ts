const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'https://musabaqa-app.onrender.com/api';
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url.replace(/\/$/, ''); // Remove trailing slash if present
};

const API_BASE_URL = getBaseUrl();

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`Making request to: ${fullUrl} [${method}]`);

  const response = await fetch(fullUrl, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // Disable caching completely for judge isolation and dynamic data
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('API Error Status:', response.status);
    console.error('API Error Body:', text);
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || 'API request failed');
    } catch (e) {
      throw new Error(`API Error ${response.status}: ${text.slice(0, 100)}`);
    }
  }

  return response.json();
};
