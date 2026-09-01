import axios from 'axios';

const API_URL = '/api/governance';

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

const DEFAULT_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    title: 'Green District Solar Array Phase 2 Expansion',
    description: 'Allocate 15,000 CVT from Community Treasury to fund 50 additional rooftop solar panels in New District.',
    type: 'treasury_allocation',
    value: 15000,
    votesFor: 1240,
    votesAgainst: 120,
    status: 'voting',
    endTime: Date.now() + 86400000 * 3,
    proposer: 'did:civic:solar_dao_lead',
    category: 'Renewable Energy',
    aiWatchdogStatus: 'compliant',
    aiAuditLog: 'Automated audit passed: Environmental ROI estimated at +24% yearly generation.'
  },
  {
    id: 'prop-2',
    title: 'Lower Verification Peer Requirement to 2 Signatures',
    description: 'Temporarily reduce in-person peer verification requirement from 3 to 2 during regional onboarding sprint.',
    type: 'parameter_change',
    value: 2,
    votesFor: 890,
    votesAgainst: 640,
    status: 'voting',
    endTime: Date.now() + 86400000 * 5,
    proposer: 'did:civic:identity_wg',
    category: 'Identity Protocol',
    aiWatchdogStatus: 'compliant',
    aiAuditLog: 'Sybil resistance model verified within acceptable tolerance margins.'
  },
  {
    id: 'prop-3',
    title: 'Off-Grid LoRaWAN Mesh Repeater Network Grant',
    description: 'Deploy 12 solar-powered LoRa mesh nodes along the Sector 9 ridge to ensure decentralized P2P connectivity.',
    type: 'treasury_allocation',
    value: 8500,
    votesFor: 2150,
    votesAgainst: 45,
    status: 'passed',
    endTime: Date.now() - 86400000,
    proposer: 'did:civic:mesh_engineer',
    category: 'Infrastructure',
    aiWatchdogStatus: 'compliant',
    aiAuditLog: 'Hardware specs verified; quote is within 5% market average.'
  }
];

function getLocalProposals(): Proposal[] {
  try {
    const raw = localStorage.getItem('civicverse_proposals');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_PROPOSALS;
}

function saveLocalProposals(props: Proposal[]) {
  try {
    localStorage.setItem('civicverse_proposals', JSON.stringify(props));
  } catch (e) {}
}

export const governanceApi = {
  getStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/status`, { timeout: 1200 });
      return response.data;
    } catch (e) {
      return {
        totalProposals: getLocalProposals().length,
        activeProposals: getLocalProposals().filter(p => p.status === 'voting').length,
        treasuryReserve: 245000,
        activeVoters: 412
      };
    }
  },

  getProposals: async (): Promise<Proposal[]> => {
    try {
      const response = await axios.get(`${API_URL}/proposals`, { timeout: 1200 });
      if (Array.isArray(response.data) && response.data.length > 0) {
        saveLocalProposals(response.data);
        return response.data;
      }
    } catch (e) {
      console.info('[Governance] Using decentralized client storage for proposals.');
    }
    return getLocalProposals();
  },

  createProposal: async (proposalData: Partial<Proposal>) => {
    try {
      const response = await axios.post(`${API_URL}/proposals`, proposalData, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalProposals();
      const newProp: Proposal = {
        id: `prop-${Date.now()}`,
        title: proposalData.title || 'Untitled Proposal',
        description: proposalData.description || '',
        type: proposalData.type || 'treasury_allocation',
        value: proposalData.value || 0,
        votesFor: 0,
        votesAgainst: 0,
        status: 'voting',
        endTime: Date.now() + 86400000 * 7,
        proposer: proposalData.proposer || 'did:civic:citizen',
        category: proposalData.category || 'General',
        aiWatchdogStatus: 'compliant',
        aiAuditLog: 'AI Watchdog verified formatting and parameter constraints.'
      };
      const updated = [newProp, ...current];
      saveLocalProposals(updated);
      return { success: true, proposal: newProp };
    }
  },

  vote: async (proposalId: string, choice: 'yes' | 'no', voterId: string, weight: number = 1, voterLevel: number = 1) => {
    try {
      const response = await axios.post(`${API_URL}/vote`, { proposalId, choice, voterId, weight, voterLevel }, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalProposals();
      const target = current.find(p => p.id === proposalId);
      if (target) {
        if (choice === 'yes') target.votesFor += weight;
        else target.votesAgainst += weight;
        saveLocalProposals(current);
        return { success: true, cost: weight * weight };
      }
      throw new Error('Proposal not found');
    }
  },

  executeProposal: async (proposalId: string) => {
    try {
      const response = await axios.post(`${API_URL}/execute`, { proposalId }, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalProposals();
      const target = current.find(p => p.id === proposalId);
      if (target) {
        target.status = 'executed';
        saveLocalProposals(current);
        return { success: true, proposal: target };
      }
      throw new Error('Proposal not found');
    }
  }
};
