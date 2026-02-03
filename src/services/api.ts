import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const civicIdApi = {
  // Auth
  login: (civicId: string, password: string) =>
    apiClient.post('/auth/login', { civicId, password }),
  signup: (username: string, civicId: string, password: string) =>
    apiClient.post('/auth/signup', { username, civicId, password }),

  // User
  getUser: (civicId: string) => apiClient.get(`/users/${civicId}`),
  updateUser: (civicId: string, data: any) =>
    apiClient.put(`/users/${civicId}`, data),

  // Wallet
  getWallet: (civicId: string) => apiClient.get(`/wallet/${civicId}`),
  sendCrypto: (from: string, to: string, amount: number) =>
    apiClient.post('/wallet/send', { from, to, amount }),

  // Missions
  getMissions: () => apiClient.get('/missions'),
  acceptMission: (missionId: string) =>
    apiClient.post(`/missions/${missionId}/accept`, {}),
  submitMission: (missionId: string, proof: string) =>
    apiClient.post(`/missions/${missionId}/submit`, { proof }),

  // Governance
  getProposals: () => apiClient.get('/governance/proposals'),
  vote: (proposalId: string, vote: boolean) =>
    apiClient.post(`/governance/proposals/${proposalId}/vote`, { vote }),
};
