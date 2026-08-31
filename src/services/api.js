import Constants from 'expo-constants';

const API_BASE_URL = Constants.manifest?.extra?.API_BASE_URL || Constants.expoConfig?.extra?.API_BASE_URL || 'https://ocean-cleanup-cardano-v2.vercel.app';
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function clearAuthToken() {
  authToken = null;
}

async function handleResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { ok: false, message: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, message: data.message || response.statusText || 'Request failed' };
  }

  return data;
}

function getToken() {
  return authToken;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    }
  });
  return handleResponse(res);
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: JSON.stringify(body)
  });
  return handleResponse(res);
}

// Multipart submit — used when a file (e.g. video) has to ride along as a
// real upload rather than a base64 data URL in the JSON body. No
// Content-Type header here: fetch sets the multipart boundary itself.
export async function apiPostForm(path, formData) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: formData
  });
  return handleResponse(res);
}

export async function authLogin(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse(res);
}

export async function authSignup(payload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function authRequestPasswordReset(email) {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return handleResponse(res);
}

export async function authVerify(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function authLogout(token) {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(res);
}

export async function authUpdateProfile(payload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export const citizenApi = {
  getStats: () => apiGet('/api/citizen/stats'),
  getLeaderboard: () => apiGet('/api/citizen/leaderboard'),
  getFeed: (limit = 15) => apiGet(`/api/citizen/feed?limit=${limit}`),
  getActivities: () => apiGet('/api/citizen/activities'),
  getOrganizations: () => apiGet('/api/dashboard/organizations'),
  analyzeImage: (payload) => apiPost('/api/ai/analyze-image', payload),
  submitReport: (formData) => apiPost('/api/activities', formData),
  submitReportForm: (formData) => apiPostForm('/api/activities', formData),
  // Blue Mind quick-report classifier — draft an event from a photo, a
  // voice note, or typed text. Exactly one of imageBase64/audioBase64/text
  // should be set; see POST /api/ai/infer on the backend.
  infer: (payload) => apiPost('/api/ai/infer', payload)
};
