const ubiEngine = require('./UBI-engine/ubi-service');
const aiService = require('./ai-service');
const crypto = require('crypto');

class CivicWatchService {
  constructor() {
    this.jobs = [
      {
        id: 'job_1',
        title: 'Community Park Cleanup',
        description: 'Clear litter from the Central Park playground area.',
        type: 'volunteer',
        reward: 50,
        category: 'environmental',
        location: { lat: 34.0522, lng: -118.2437, address: 'Central Park' },
        status: 'open',
        assignee: null,
        issuer: 'did:civic:community_hq',
        trainingUrl: 'https://civicverse.org/training/park-safety',
        instructionalVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        requirements: ['Clear litter', 'Take a photo of the area', 'Dispose of waste in bins'],
        ppeRequired: true,
        isStreaming: false,
        stats: { environmental: 10, civic: 2 },
        createdAt: Date.now()
      }
    ];
    this.verifications = new Map();
    this.imageHashes = new Set();
  }

  getJobs() {
    return this.jobs;
  }

  getJob(id) {
    return this.jobs.find(j => j.id === id);
  }

  createJob(jobData) {
    const { title, description, type, reward, category, location, issuer, trainingUrl, instructionalVideo, requirements, ppeRequired, stats } = jobData;
    
    if (!title || !description || !location || !issuer) {
        throw new Error('Incomplete mission data. Title, description, location, and issuer are required.');
    }

    const newJob = {
        id: `job_${Date.now()}`,
        title,
        description,
        type: type || 'volunteer',
        reward: reward || 0,
        category: category || 'civic',
        location,
        status: 'open',
        assignee: null,
        issuer,
        trainingUrl: trainingUrl || '',
        instructionalVideo: instructionalVideo || '',
        requirements: requirements || [],
        ppeRequired: !!ppeRequired,
        isStreaming: false,
        stats: stats || { civic: 5 },
        createdAt: Date.now()
    };

    this.jobs.push(newJob);
    console.log(`[CivicWatch] New mission created by ${issuer}: ${title}`);
    return newJob;
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

  toggleStreaming(jobId, workerId, isStreaming) {
    const job = this.getJob(jobId);
    if (!job || job.assignee !== workerId) throw new Error('Unauthorized');
    job.isStreaming = isStreaming;
    console.log(`[CivicWatch] Worker ${workerId} is ${isStreaming ? 'LIVE' : 'OFFLINE'} for job ${jobId}`);
    return job;
  }

  calculateDistance(lat1, lon1, lat2, lng2) {
    // Simple Euclidean distance for prototype (approx 1 degree = 111km)
    // In production, use Haversine.
    const dLat = (lat2 - lat1) * 111000;
    const dLng = (lng2 - lon1) * 111000 * Math.cos(lat1 * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }

  async submitVerification(jobId, workerId, proofText, proofImage, gpsData) {
    const job = this.getJob(jobId);
    if (!job) throw new Error('Job not found');
    if (job.assignee !== workerId) throw new Error('Not assigned to this job');
    if (job.status !== 'in_progress') throw new Error('Job not in progress');

    if (!proofText && !proofImage) throw new Error('No proof provided (text or image required)');

    // Image Hash Verification (Prevent Replay Attacks)
    let currentImageHash = null;
    if (proofImage) {
        // Create SHA-256 hash of the image data (base64 string)
        currentImageHash = crypto.createHash('sha256').update(proofImage).digest('hex');
        
        if (this.imageHashes.has(currentImageHash)) {
            console.warn(`[CivicWatch] Duplicate image submission detected! Hash: ${currentImageHash}`);
            throw new Error('Duplicate proof image detected. This photo has already been used for verification.');
        }
    }

    // GPS Verification Logic
    if (gpsData) {
        const distance = this.calculateDistance(gpsData.lat, gpsData.lng, job.location.lat, job.location.lng);
        console.log(`[CivicWatch] GPS Verification for ${workerId}: distance=${distance.toFixed(2)}m`);
        
        // Threshold: 500 meters
        if (distance > 500) {
            throw new Error(`GPS verification failed. You are ${distance.toFixed(0)}m from the target location. Required: <500m.`);
        }
    } else {
        // Fallback for demo environments without GPS, but log a warning
        console.warn(`[CivicWatch] Warning: No GPS data provided for verification of job ${jobId}`);
    }

    job.status = 'verifying';
    this.verifications.set(jobId, { workerId, proofText, proofImage, gpsData, timestamp: Date.now() });
    
    // Trigger AI Verification via Local LLM (Ollama)
    console.log(`[CivicWatch] Dispatching AI verification for job ${jobId}...`);
    // Use proofText for AI, fallback to a generic message if only image provided (though specific description is better)
    const textForAI = proofText || "User provided an image proof without description.";
    const aiResult = await aiService.verifyJobProof(job.description, textForAI);

    if (aiResult.verified) {
        // If verified, store the image hash permanently to prevent reuse
        if (currentImageHash) {
            this.imageHashes.add(currentImageHash);
            console.log(`[CivicWatch] Stored image hash for job ${jobId}: ${currentImageHash.substring(0, 8)}...`);
        }

        const payoutDetails = this.finalizeJob(jobId);
        return { 
            status: 'verified', 
            job, 
            payoutDetails, 
            aiConfidence: aiResult.confidence,
            aiReasoning: aiResult.reasoning 
        };
    } else {
        job.status = 'failed_verification';
        return { 
            status: 'rejected', 
            job, 
            aiConfidence: aiResult.confidence,
            aiReasoning: aiResult.reasoning 
        };
    }
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
