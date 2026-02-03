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
    login: (civicId, password) => apiClient.post('/auth/login', { civicId, password }),
    signup: (username, civicId, password) => apiClient.post('/auth/signup', { username, civicId, password }),
    // User
    getUser: (civicId) => apiClient.get(`/users/${civicId}`),
    updateUser: (civicId, data) => apiClient.put(`/users/${civicId}`, data),
    // Wallet
    getWallet: (civicId) => apiClient.get(`/wallet/${civicId}`),
    sendCrypto: (from, to, amount) => apiClient.post('/wallet/send', { from, to, amount }),
    // Missions
    getMissions: () => apiClient.get('/missions'),
    acceptMission: (missionId) => apiClient.post(`/missions/${missionId}/accept`, {}),
    submitMission: (missionId, proof) => apiClient.post(`/missions/${missionId}/submit`, { proof }),
    // Governance
    getProposals: () => apiClient.get('/governance/proposals'),
    vote: (proposalId, vote) => apiClient.post(`/governance/proposals/${proposalId}/vote`, { vote }),
};
