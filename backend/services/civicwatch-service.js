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
        category: 'environmental',
        location: { lat: 34.0522, lng: -118.2437, address: 'Central Park' },
        status: 'open', // open, in_progress, verifying, completed
        assignee: null,
        requirements: ['photo_proof', 'video_proof'],
        stats: { environmental: 10, civic: 2 },
        createdAt: Date.now()
      },
      {
        id: 'job_2',
        title: 'Pothole Repair Report',
        description: 'Verify and document pothole repair on Main St.',
        type: 'paid',
        reward: 120, // CVT
        category: 'civic',
        location: { lat: 34.0522, lng: -118.25, address: 'Main St & 4th' },
        status: 'open',
        assignee: null,
        requirements: ['photo_proof'],
        stats: { civic: 15, logistics: 5 },
        createdAt: Date.now()
      },
      {
        id: 'job_3',
        title: 'Elderly Grocery Assist',
        description: 'Deliver groceries to registered senior citizen.',
        type: 'volunteer',
        reward: 75,
        category: 'social',
        location: { lat: 34.06, lng: -118.24, address: 'Oak Residential' },
        status: 'open',
        assignee: null,
        requirements: ['recipient_sign'],
        stats: { social: 20, empathy: 10 },
        createdAt: Date.now()
      },
      {
        id: 'job_4',
        title: 'Traffic Signal Audit',
        description: 'Monitor and report timing issues at the intersection of 5th and Broadway.',
        type: 'paid',
        reward: 200,
        category: 'logistics',
        location: { lat: 34.048, lng: -118.245, address: '5th & Broadway' },
        status: 'open',
        assignee: null,
        requirements: ['video_proof', 'timing_log'],
        stats: { logistics: 25, civic: 10 },
        createdAt: Date.now()
      },
      {
        id: 'job_5',
        title: 'Digital Literacy Workshop',
        description: 'Help residents set up their CivicVerse identity at the community center.',
        type: 'volunteer',
        reward: 100,
        category: 'educational',
        location: { lat: 34.055, lng: -118.26, address: 'Tech Hub' },
        status: 'open',
        assignee: null,
        requirements: ['participant_count', 'photo_proof'],
        stats: { educational: 30, social: 15 },
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
    const { netAmount, taxAmount } = ubiEngine.processTransaction(job.reward);
    
    return { 
      jobId, 
      workerId: job.assignee, 
      payout: netAmount, 
      tax: taxAmount,
      stats: job.stats, // Include stats for reputation gain
      currency: 'CVT'
    };
  }
}

module.exports = new CivicWatchService();
