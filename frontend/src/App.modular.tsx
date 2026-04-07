import React, { useState, useEffect } from 'react';
import { CivicIdentity } from '@civicverse/civic-identity';
import { CivicWatch } from '@civicverse/civic-watch';
import { CivicMining } from '@civicverse/civic-mining';
import { CivicFoyer } from '@civicverse/civic-foyer';

// Microservice Base URLs
const ONBOARDING_API = 'http://localhost:3001';
const VAULT_API = 'http://localhost:3008';
const IDENTITY_API = 'http://localhost:3009';
const WATCH_API = 'http://localhost:3002';
const MINING_API = 'http://localhost:3005';

export default function App() {
  const [profile, setProfile] = useState(identity.getProfile());
  const [mnemonic, setMnemonic] = useState('');
  const [jobs, setJobs] = useState(watch.getJobs());

  const handleCreateWallet = async () => {
    const m = await identity.createWallet();
    setMnemonic(m);
    await identity.importWallet(m);
    setProfile(identity.getProfile());
  };

  const handleVerifyPoP = async () => {
    // 3-step PoP verification
    await identity.completePoP("123456", "qr-data-abc", "Initial verification notes");
    setProfile(identity.getProfile());
  };

  return (
    <div className="civicverse-container p-8 font-mono">
      <h1 className="text-3xl font-bold mb-6">CivicVerse Sovereign Node</h1>
      
      {/* --- Identity & Vault --- */}
      <section className="identity-vault bg-gray-900 p-6 rounded-lg border border-cyan-500 mb-6">
        <h2 className="text-xl text-cyan-400 mb-4">Identity Vault</h2>
        {!profile ? (
          <button onClick={handleCreateWallet} className="bg-cyan-600 p-2 rounded">Create New CivicID (BIP-39)</button>
        ) : (
          <div>
            <p>DID: {profile.did}</p>
            <p>Status: {profile.isVerified ? '✅ VERIFIED' : '❌ UNVERIFIED'}</p>
            <p>Tier: {profile.tier}</p>
            {!profile.isVerified && (
              <button onClick={handleVerifyPoP} className="mt-4 bg-orange-600 p-2 rounded">Complete PoP Verification</button>
            )}
          </div>
        )}
        {mnemonic && <div className="mt-4 p-2 bg-black text-red-400 border border-red-900">SEED: {mnemonic}</div>}
      </section>

      {/* --- CivicWatch (Verified Only) --- */}
      <section className="civic-watch-hub bg-gray-900 p-6 rounded-lg border border-green-500 mb-6">
        <h2 className="text-xl text-green-400 mb-4">CivicWatch Job Board</h2>
        {profile?.isVerified ? (
          <div>
            <p>Verified access granted.</p>
            <ul>
              {jobs.map(j => <li key={j.id}>{j.title} - {j.reward} CV</li>)}
            </ul>
          </div>
        ) : (
          <p className="text-red-500">Verification Required to Access Job Board.</p>
        )}
      </section>

      {/* --- Mining Logic --- */}
      <section className="mining-logic bg-gray-900 p-6 rounded-lg border border-yellow-500">
        <h2 className="text-xl text-yellow-400 mb-4">Community Mining</h2>
        <p>Active Hashrate: {mining.getStats()?.hashrate || 0} H/s</p>
        <p>Reputation Earned: {mining.getStats()?.contributionReputation || 0}</p>
      </section>
    </div>
  );
}
