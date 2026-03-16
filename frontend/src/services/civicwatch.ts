import axios from 'axios';

const API_URL = '/api'; // Relative URL for proxy compatibility (Dev & Prod)

export interface Job {
  id: string;
  title: string;
  description: string;
  type: 'volunteer' | 'paid';
  reward: number;
  category: string;
  location: { lat: number; lng: number; address: string };
  status: 'open' | 'in_progress' | 'verifying' | 'completed' | 'failed_verification';
  assignee: string | null;
  issuer: string;
  trainingUrl?: string;
  instructionalVideo?: string;
  requirements: string[];
  ppeRequired?: boolean;
  isStreaming?: boolean;
  stats?: Record<string, number>;
  createdAt: number;
}

export const civicWatchApi = {
  getJobs: async () => {
    const response = await axios.get(`${API_URL}/jobs`);
    return response.data;
  },

  createJob: async (jobData: Partial<Job>) => {
    const response = await axios.post(`${API_URL}/jobs`, jobData);
    return response.data;
  },

  acceptJob: async (jobId: string, workerId: string) => {
    const response = await axios.post(`${API_URL}/jobs/accept`, { jobId, workerId });
    return response.data;
  },

  toggleStreaming: async (jobId: string, workerId: string, isStreaming: boolean) => {
    const response = await axios.post(`${API_URL}/jobs/stream`, { jobId, workerId, isStreaming });
    return response.data;
  },

  verifyJob: async (jobId: string, workerId: string, proofText: string, proofImage?: string | null, gpsData?: { lat: number; lng: number }) => {
    const response = await axios.post(`${API_URL}/jobs/verify`, { jobId, workerId, proofText, proofImage, gpsData });
    return response.data;
  }
};
