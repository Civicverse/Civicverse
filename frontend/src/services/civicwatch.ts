import axios from 'axios';

const API_URL = 'http://localhost:3003/api'; // Adjust if needed

export interface Job {
  id: string;
  title: string;
  description: string;
  type: 'volunteer' | 'paid';
  reward: number;
  location: { lat: number; lng: number };
  status: 'open' | 'in_progress' | 'verifying' | 'completed';
  assignee: string | null;
  requirements: string[];
}

export const civicWatchApi = {
  getJobs: async (): Promise<Job[]> => {
    const response = await axios.get(`${API_URL}/jobs`);
    return response.data;
  },

  acceptJob: async (jobId: string, workerId: string) => {
    const response = await axios.post(`${API_URL}/jobs/accept`, { jobId, workerId });
    return response.data;
  },

  verifyJob: async (jobId: string, workerId: string, proofData: string) => {
    const response = await axios.post(`${API_URL}/jobs/verify`, { jobId, workerId, proofData });
    return response.data;
  }
};
