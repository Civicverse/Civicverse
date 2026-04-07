import { CivicIdentity } from '@civicverse/civic-identity';

export interface Job {
  id: string;
  title: string;
  description: string;
  employerPubKey: string;
  reward: number; // In CV tokens or currency
  status: 'Open' | 'Accepted' | 'Completed' | 'ProofSubmitted';
  workerPubKey?: string;
  streamingEnabled: boolean;
  proofData?: string;
  mapCoords?: [number, number];
}

export class CivicWatch {
  private jobs: Job[] = [];

  constructor(private identity: CivicIdentity) {}

  createJob(title: string, description: string, reward: number): string {
    const profile = this.identity.getProfile();
    if (!profile) throw new Error("Identity required");
    if (!this.identity.isVerified()) throw new Error("Verified status required to create jobs");

    const jobId = Math.random().toString(36).substr(2, 9);
    const job: Job = {
      id: jobId,
      title,
      description,
      employerPubKey: profile.publicKey,
      reward,
      status: 'Open',
      streamingEnabled: false
    };

    this.jobs.push(job);
    return jobId;
  }

  acceptJob(jobId: string): void {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) throw new Error("Job not found");
    const profile = this.identity.getProfile();
    if (!profile) throw new Error("Identity required");
    if (!this.identity.isVerified()) throw new Error("Verified status required to accept jobs");

    job.status = 'Accepted';
    job.workerPubKey = profile.publicKey;
  }

  submitProof(jobId: string, proof: string): void {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || job.workerPubKey !== this.identity.getProfile()?.publicKey) {
      throw new Error("Invalid worker or job");
    }
    job.status = 'ProofSubmitted';
    job.proofData = proof;
  }

  toggleStreaming(jobId: string, isEnabled: boolean): void {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) job.streamingEnabled = isEnabled;
  }

  getJobs(): Job[] {
    return this.jobs;
  }
}
