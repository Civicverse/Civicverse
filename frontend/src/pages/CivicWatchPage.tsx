import React, { useEffect, useState } from 'react';
import { civicWatchApi, Job } from '../services/civicwatch';
import CivicIdentity from '../lib/civicIdentity';

const CivicWatchPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [did, setDid] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [verificationFile, setVerificationFile] = useState<string | null>(null);

  useEffect(() => {
    const storedDid = CivicIdentity.getStoredDID();
    setDid(storedDid);
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await civicWatchApi.getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (jobId: string) => {
    if (!did) return alert('Please create an identity first');
    try {
      await civicWatchApi.acceptJob(jobId, did);
      fetchJobs();
      alert('Job Accepted! Go do the work.');
    } catch (err) {
      alert('Failed to accept job');
    }
  };

  const handleVerify = async () => {
    if (!selectedJob || !did || !verificationFile) return;
    try {
      const res = await civicWatchApi.verifyJob(selectedJob.id, did, verificationFile);
      if (res.payoutDetails) {
        alert(`Job Verified! You earned ${res.payoutDetails.payout} CVT (Tax: ${res.payoutDetails.tax} CVT)`);
      } else {
        alert('Verification submitted. Waiting for AI approval...');
      }
      setSelectedJob(null);
      setVerificationFile(null);
      fetchJobs();
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">CivicWatch</h1>
            <p className="text-gray-400">Real-world missions. Real value.</p>
          </div>
          {did ? (
            <div className="text-sm bg-gray-800 p-2 rounded">
              Logged in as: <span className="text-green-400">{did.slice(0, 16)}...</span>
            </div>
          ) : (
            <div className="text-red-400">No Identity Found. Please create one in Wallet.</div>
          )}
        </header>

        {loading ? (
          <div>Loading missions...</div>
        ) : (
          <div className="grid gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{job.title}</h2>
                    <p className="text-gray-300 mb-4">{job.description}</p>
                    <div className="flex gap-2 text-sm">
                      <span className={`px-2 py-1 rounded ${job.type === 'paid' ? 'bg-green-900 text-green-300' : 'bg-purple-900 text-purple-300'}`}>
                        {job.type.toUpperCase()}
                      </span>
                      <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">
                        Reward: {job.reward} CVT
                      </span>
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        Status: {job.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {job.status === 'open' && (
                      <button 
                        onClick={() => handleAccept(job.id)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
                        disabled={!did}
                      >
                        Accept Mission
                      </button>
                    )}
                    
                    {job.status === 'in_progress' && job.assignee === did && (
                      <button 
                        onClick={() => setSelectedJob(job)}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold"
                      >
                        Verify Work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Verify: {selectedJob.title}</h3>
              <p className="mb-4 text-sm text-gray-400">
                Upload a photo/video proof of your work. The Craig AI agent will verify it.
              </p>
              
              <input 
                type="file" 
                onChange={handleFileUpload} 
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
              />

              {verificationFile && (
                <div className="mb-4">
                  <img src={verificationFile} alt="Preview" className="w-full h-48 object-cover rounded border border-gray-600" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => { setSelectedJob(null); setVerificationFile(null); }}
                  className="px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVerify}
                  disabled={!verificationFile}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  Submit Proof
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CivicWatchPage;
