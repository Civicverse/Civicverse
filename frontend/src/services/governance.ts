import axios from 'axios';

const API_URL = '/api/governance'; // Relative URL for proxy compatibility (Dev & Prod)

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'parameter_change' | 'treasury_allocation';
  value: number;
  votesFor: number;
  votesAgainst: number;
  status: 'voting' | 'passed' | 'rejected' | 'executed' | 'failed_execution';
  endTime: number;
  proposer: string;
  category?: string;
  aiWatchdogStatus?: 'pending' | 'compliant' | 'flagged';
  aiAuditLog?: string;
}

export const governanceApi = {
  getStatus: async () => {
    const response = await axios.get(`${API_URL}/status`);
    return response.data;
  },

  getProposals: async (): Promise<Proposal[]> => {
    const response = await axios.get(`${API_URL}/proposals`);
    return response.data;
  },

  createProposal: async (proposalData: Partial<Proposal>) => {
    const response = await axios.post(`${API_URL}/proposals`, proposalData);
    return response.data;
  },

  vote: async (proposalId: string, choice: 'yes' | 'no', voterId: string, weight: number = 1, voterLevel: number = 1) => {
    const response = await axios.post(`${API_URL}/vote`, { proposalId, choice, voterId, weight, voterLevel });
    return response.data;
  },

  executeProposal: async (proposalId: string) => {
    const response = await axios.post(`${API_URL}/execute`, { proposalId });
    return response.data;
  }
};
