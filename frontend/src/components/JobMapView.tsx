import React from 'react';
import { Job } from '../services/civicwatch';
import { MapPin, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export const JobMapView: React.FC<Props> = ({ jobs, onSelectJob }) => {
  // Simplified map scaling
  // We'll assume a bounding box around the jobs for the prototype
  const minLat = Math.min(...jobs.map(j => j.location.lat));
  const maxLat = Math.max(...jobs.map(j => j.location.lat));
  const minLng = Math.min(...jobs.map(j => j.location.lng));
  const maxLng = Math.max(...jobs.map(j => j.location.lng));

  const padding = 0.01;
  const latRange = (maxLat - minLat) || 0.05;
  const lngRange = (maxLng - minLng) || 0.05;

  return (
    <div className="relative w-full aspect-video bg-[#0d1117] rounded-3xl border border-gray-800 overflow-hidden shadow-inner">
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#30363d 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      {/* Scanning Line */}
      <motion.div 
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-blue-500/30 z-10"
      />

      {/* Map Content */}
      <div className="absolute inset-8">
        {jobs.map((job) => {
          const x = ((job.location.lng - (minLng - padding)) / (lngRange + padding * 2)) * 100;
          const y = (1 - (job.location.lat - (minLat - padding)) / (latRange + padding * 2)) * 100;

          return (
            <motion.div
              key={job.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.2, zIndex: 50 }}
              onClick={() => onSelectJob(job)}
              className="absolute cursor-pointer group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                {/* Ping Animation */}
                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${job.type === 'paid' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                
                {/* Marker */}
                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transform rotate-45 border ${
                  job.type === 'paid' ? 'bg-green-600 border-green-400' : 'bg-blue-600 border-blue-400'
                }`}>
                  <div className="-rotate-45">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap bg-gray-900 border border-gray-700 p-2 rounded-lg z-[100] shadow-xl">
                  <div className="text-[10px] font-bold text-white mb-1">{job.title}</div>
                  <div className="text-[9px] text-blue-400 font-bold">{job.reward} CVT</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Map UI Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl text-[10px] font-mono text-gray-400">
           LAT: 34.0522° N<br/>
           LNG: 118.2437° W<br/>
           SECTOR: CV-LA-01
        </div>
        <div className="bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded-full text-[10px] font-bold text-blue-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          LIVE DISPATCH ACTIVE
        </div>
      </div>
    </div>
  );
};
