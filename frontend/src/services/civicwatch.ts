import axios from 'axios';

const API_URL = '/api';

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

const DEFAULT_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Park Cleanup & Waste Audit',
    description: 'Clean up local park and report collected waste metrics via photo verification.',
    type: 'paid',
    reward: 25,
    category: 'environmental',
    location: { lat: 34.0522, lng: -118.2437, address: 'Central Park, Downtown Sector 4' },
    status: 'open',
    assignee: null,
    issuer: 'did:civic:green_district_dao',
    requirements: ['Gloves & Trash Bag', 'Before/After Photos', 'GPS Lock'],
    ppeRequired: true,
    isStreaming: false,
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'job-2',
    title: 'Civic Infrastructure Survey',
    description: 'Conduct civic sidewalk and accessibility survey in assigned neighborhood corridor.',
    type: 'volunteer',
    reward: 50,
    category: 'civic',
    location: { lat: 34.0622, lng: -118.2537, address: 'Midtown Transit Corridor' },
    status: 'open',
    assignee: null,
    issuer: 'did:civic:transit_alliance',
    requirements: ['Completed survey form', 'Photo verification'],
    ppeRequired: false,
    isStreaming: false,
    createdAt: Date.now() - 3600000 * 5
  },
  {
    id: 'job-3',
    title: 'Community Garden Solar Panel Maintenance',
    description: 'Inspect micro-inverter connections and clean dust off community solar array.',
    type: 'paid',
    reward: 35,
    category: 'environmental',
    location: { lat: 34.0422, lng: -118.2637, address: 'Green District Community Hub' },
    status: 'open',
    assignee: null,
    issuer: 'did:civic:solar_collective',
    requirements: ['Safety Goggles', 'Diagnostic reading photo'],
    ppeRequired: true,
    isStreaming: false,
    createdAt: Date.now() - 3600000 * 8
  },
  {
    id: 'job-4',
    title: 'Historic District Street Art Documentation',
    description: 'Photograph and catalog cultural murals for decentralized archival preservation.',
    type: 'paid',
    reward: 60,
    category: 'social',
    location: { lat: 34.0722, lng: -118.2337, address: 'Arts Quarter, Sector 9' },
    status: 'open',
    assignee: null,
    issuer: 'did:civic:arts_council',
    requirements: ['High-res photo upload', 'Artist credit tag'],
    ppeRequired: false,
    isStreaming: false,
    createdAt: Date.now() - 3600000 * 12
  }
];

function getLocalJobs(): Job[] {
  try {
    const raw = localStorage.getItem('civicverse_jobs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_JOBS;
}

function saveLocalJobs(jobs: Job[]) {
  try {
    localStorage.setItem('civicverse_jobs', JSON.stringify(jobs));
  } catch (e) {}
}

export const civicWatchApi = {
  getJobs: async (): Promise<Job[]> => {
    try {
      const response = await axios.get(`${API_URL}/jobs`, { timeout: 1200 });
      if (Array.isArray(response.data) && response.data.length > 0) {
        saveLocalJobs(response.data);
        return response.data;
      }
    } catch (e) {
      console.info('[CivicWatch] Using decentralized client storage for jobs.');
    }
    return getLocalJobs();
  },

  createJob: async (jobData: Partial<Job>): Promise<{ success: boolean; job: Job }> => {
    try {
      const response = await axios.post(`${API_URL}/jobs`, jobData, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalJobs();
      const newJob: Job = {
        id: `job-${Date.now()}`,
        title: jobData.title || 'Untitled Mission',
        description: jobData.description || '',
        type: jobData.type || 'volunteer',
        reward: jobData.reward || 10,
        category: jobData.category || 'civic',
        location: jobData.location || { lat: 34.0522, lng: -118.2437, address: 'Current Sector' },
        status: 'open',
        assignee: null,
        issuer: jobData.issuer || 'did:civic:local_node',
        requirements: jobData.requirements || ['Photo verification'],
        ppeRequired: jobData.ppeRequired || false,
        isStreaming: false,
        createdAt: Date.now()
      };
      const updated = [newJob, ...current];
      saveLocalJobs(updated);
      return { success: true, job: newJob };
    }
  },

  acceptJob: async (jobId: string, workerId: string): Promise<{ success: boolean; job: Job }> => {
    try {
      const response = await axios.post(`${API_URL}/jobs/accept`, { jobId, workerId }, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalJobs();
      const target = current.find(j => j.id === jobId);
      if (target) {
        target.status = 'in_progress';
        target.assignee = workerId;
        saveLocalJobs(current);
        return { success: true, job: target };
      }
      throw new Error('Job not found');
    }
  },

  toggleStreaming: async (jobId: string, workerId: string, isStreaming: boolean): Promise<{ success: boolean }> => {
    try {
      const response = await axios.post(`${API_URL}/jobs/stream`, { jobId, workerId, isStreaming }, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalJobs();
      const target = current.find(j => j.id === jobId);
      if (target) {
        target.isStreaming = isStreaming;
        saveLocalJobs(current);
      }
      return { success: true };
    }
  },

  verifyJob: async (jobId: string, workerId: string, proofText: string, proofImage?: string | null, gpsData?: { lat: number; lng: number }): Promise<{ success: boolean; reward: number }> => {
    try {
      const response = await axios.post(`${API_URL}/jobs/verify`, { jobId, workerId, proofText, proofImage, gpsData }, { timeout: 1200 });
      return response.data;
    } catch (e) {
      const current = getLocalJobs();
      const target = current.find(j => j.id === jobId);
      let reward = 25;
      if (target) {
        target.status = 'completed';
        reward = target.reward;
        saveLocalJobs(current);
      }
      return { success: true, reward };
    }
  }
};
