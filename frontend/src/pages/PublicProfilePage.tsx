import React from 'react';
import { useParams } from 'react-router-dom';
import SocialHub from '../components/SocialHub';

export default function PublicProfilePage() {
  const { civicId = '' } = useParams();
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <SocialHub profileId={decodeURIComponent(civicId)} />
      </div>
    </main>
  );
}
