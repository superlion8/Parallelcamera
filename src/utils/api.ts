// API utility for making requests to the backend
// In development, requests go to localhost; in production, they go to the same domain

const getApiBase = () => {
  // In Vercel, API routes are at /api/*
  // This works for both development (localhost:3000) and production
  return '/api';
};

export const API_BASE = getApiBase();

// API endpoints
export const API_ENDPOINTS = {
  analyzeImage: `${API_BASE}/analyze-image`,
  generateImage: `${API_BASE}/generate-image`,
  generateCreativeElement: `${API_BASE}/generate-creative-element`,
  speechToText: `${API_BASE}/speech-to-text`,
  getHistory: `${API_BASE}/get-history`,
  saveHistory: `${API_BASE}/save-history`,
  deleteHistory: `${API_BASE}/delete-history`,
  health: `${API_BASE}/health`,
};

// Helper function for making API requests
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.details || error.error || 'API request failed');
  }

  return response.json();
}

