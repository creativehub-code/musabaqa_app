const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`; // Backend doesn't verify yet but good practice
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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
