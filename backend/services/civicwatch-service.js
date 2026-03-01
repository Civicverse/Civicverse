const ubiEngine = require('./UBI-engine/ubi-service');

class CivicWatchService {
  constructor() {
    this.jobs = [
      {
        id: 'job_1',
        title: 'Community Park Cleanup',
        description: 'Clear litter from the Central Park playground area.',
        type: 'volunteer',
        reward: 50, // CVT
        location: { lat: 34.0522, lng: -118.2437 },
        status: 'open', // open, in_progress, verifying, completed
        assignee: null,
        requirements: ['photo_proof', 'video_proof'],
        createdAt: Date.now()
      },
      {
        id: 'job_2',
        title: 'Pothole Repair Report',
        description: 'Verify and document pothole repair on Main St.',
        type: 'paid',
        reward: 120, // CVT
        location: { lat: 34.0522, lng: -118.25 },
        status: 'open',
        assignee: null,
        requirements: ['photo_proof'],
        createdAt: Date.now()
      },
      {
        id: 'job_3',
        title: 'Elderly Grocery Assist',
        description: 'Deliver groceries to registered senior citizen.',
        type: 'volunteer',
        reward: 75,
        location: { lat: 34.06, lng: -118.24 },
        status: 'open',
        assignee: null,
        requirements: ['recipient_sign'],
        createdAt: Date.now()
      }
    ];
    this.verifications = new Map(); // jobId -> verificationData
  }

  getJobs() {
    return this.jobs;
  }

  getJob(id) {
    return this.jobs.find(j => j.id === id);
  }

  acceptJob(jobId, workerId) {
    const job = this.getJob(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'open') throw new Error('Job already taken');

    job.status = 'in_progress';
    job.assignee = workerId;
    job.acceptedAt = Date.now();
    return job;
  }

  submitVerification(jobId, workerId, proofData) {
    const job = this.getJob(jobId);
    if (!job) throw new Error('Job not found');
    if (job.assignee !== workerId) throw new Error('Not assigned to this job');
    if (job.status !== 'in_progress') throw new Error('Job not in progress');

    // Simulate AI verification (The "Craig AI" / "Fryboy Test")
    // In a real system, this would pass to an ML model.
    // For prototype: We verify that proofData exists.
    if (!proofData) throw new Error('No proof provided');

    job.status = 'verifying';
    this.verifications.set(jobId, { workerId, proofData, timestamp: Date.now() });
    
    // Auto-verify for prototype after 2 seconds
    return new Promise((resolve) => {
      setTimeout(() => {
        this.finalizeJob(jobId);
        resolve({ status: 'verified', job });
      }, 2000);
    });
  }

  finalizeJob(jobId) {
    const job = this.getJob(jobId);
    if (!job) return;

    job.status = 'completed';
    
    // Process Payout
    // Apply 1% tax on the reward? Or is the reward net?
    // Whitepaper says "1% opt-in civic micro-tax applies" to "Job payments".
    // So we deduct 1% from the reward.
    
    const { netAmount, taxAmount } = ubiEngine.processTransaction(job.reward);
    
    // In a real system, we'd transfer crypto.
    // Here we return the payout details for the controller to update the wallet.
    return { 
      jobId, 
      workerId: job.assignee, 
      payout: netAmount, 
      tax: taxAmount,
      currency: 'CVT'
    };
  }
}

module.exports = new CivicWatchService();
