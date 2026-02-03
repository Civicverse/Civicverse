import { create } from 'zustand';
export const useGameStore = create((set) => ({
    isAuthenticated: false,
    user: null,
    wallet: null,
    treasuryBalance: 0,
    missions: [],
    currentMission: null,
    demoMode: true,
    loading: true,
    marketplaceHistory: [],
    sellers: {},
    proposals: [],
    miningActive: false,
    totalMiningHashRate: 0,
    totalTreasuryFromMining: 0,
    totalCryptoMined: {
        BTC: 0,
        ETH: 0,
        Monero: 0,
        Kaspa: 0,
        CIVIC: 0,
    },
    miningFacilities: [
        { id: '1', name: 'Solar Farm Alpha', solarPower: 100, active: true, cryptoType: 'BTC', outputPerSecond: 0.0001, totalMined: 0, location: 'Desert Southwest', hashRate: 0, treasuryContribution: 0 },
        { id: '2', name: 'Solar Farm Beta', solarPower: 100, active: true, cryptoType: 'ETH', outputPerSecond: 0.002, totalMined: 0, location: 'Mountain Ridge', hashRate: 0, treasuryContribution: 0 },
        { id: '3', name: 'Solar Farm Gamma', solarPower: 100, active: true, cryptoType: 'Monero', outputPerSecond: 0.01, totalMined: 0, location: 'Tropical Zone', hashRate: 0, treasuryContribution: 0 },
        { id: '4', name: 'Solar Farm Delta', solarPower: 100, active: true, cryptoType: 'Kaspa', outputPerSecond: 0.05, totalMined: 0, location: 'Arctic Station', hashRate: 0, treasuryContribution: 0 },
        { id: '5', name: 'Solar Farm Epsilon', solarPower: 100, active: true, cryptoType: 'CIVIC', outputPerSecond: 0.03, totalMined: 0, location: 'Equatorial Hub', hashRate: 0, treasuryContribution: 0 },
    ],
    jobs: [
        { id: 'job1', title: 'Park Cleanup Drive', description: 'Clean up local park and report via photo verification', location: 'Central Park, Downtown', reward: 25, difficulty: 'easy', category: 'environmental', estimatedTime: 30, verificationTasks: ['Take before photo', 'Take after photo', 'Confirm area cleaned'], status: 'available' },
        { id: 'job2', title: 'Survey Data Collection', description: 'Conduct civic survey in assigned zone', location: 'District 7, Midtown', reward: 50, difficulty: 'medium', category: 'civic', estimatedTime: 45, verificationTasks: ['Complete survey form', 'Photo verification'], status: 'available' },
        { id: 'job3', title: 'Community Garden Maintenance', description: 'Water plants and maintain garden beds', location: 'Green District Hub', reward: 35, difficulty: 'easy', category: 'environmental', estimatedTime: 25, verificationTasks: ['Before/after photos', 'Plant count verification'], status: 'available' },
        { id: 'job4', title: 'Street Art Documentation', description: 'Photograph and catalog street art installations', location: 'Arts Quarter', reward: 60, difficulty: 'hard', category: 'social', estimatedTime: 60, verificationTasks: ['Photo collection', 'GPS verification', 'Artist notes'], status: 'available' },
        { id: 'job5', title: 'Local Interview', description: 'Interview community member about civic initiatives', location: 'Community Center', reward: 40, difficulty: 'medium', category: 'civic', estimatedTime: 40, verificationTasks: ['Audio recording', 'Consent form', 'Summary submission'], status: 'available' },
        { id: 'job6', title: 'Tree Planting Event', description: 'Participate in neighborhood tree planting', location: 'Forest Ridge Trail', reward: 55, difficulty: 'medium', category: 'environmental', estimatedTime: 90, verificationTasks: ['Plant GPS', 'Photo evidence', 'Participant count'], status: 'available' },
    ],
    currentJobStatus: 'available',
    currentJobProgress: 0,
    selectedJob: null,
    login: async (civicId, password) => {
        set({ loading: true });
        try {
            // Demo: simulate login
            const user = {
                civicId,
                username: `Citizen_${civicId.slice(0, 8)}`,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${civicId}`,
                trustScore: 75,
                level: 3,
            };
            const wallet = {
                address: `0x${civicId.slice(0, 40)}`,
                balance: 1250.5,
                pendingBalance: 150,
                currency: 'CIVIC',
            };
            set({
                isAuthenticated: true,
                user,
                wallet,
                loading: false,
            });
            localStorage.setItem('civicId', civicId);
        }
        catch (error) {
            console.error('Login failed:', error);
            set({ loading: false });
            throw error;
        }
    },
    signup: async (username, civicId, password) => {
        set({ loading: true });
        try {
            // Demo: simulate signup
            const user = {
                civicId,
                username,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${civicId}`,
                trustScore: 50,
                level: 1,
            };
            const wallet = {
                address: `0x${civicId.slice(0, 40)}`,
                balance: 100,
                pendingBalance: 0,
                currency: 'CIVIC',
            };
            set({
                isAuthenticated: true,
                user,
                wallet,
                loading: false,
            });
            localStorage.setItem('civicId', civicId);
        }
        catch (error) {
            console.error('Signup failed:', error);
            set({ loading: false });
            throw error;
        }
    },
    logout: () => {
        localStorage.removeItem('civicId');
        set({
            isAuthenticated: false,
            user: null,
            wallet: null,
            missions: [],
            currentMission: null,
        });
    },
    updateUser: (user) => set((state) => ({
        user: state.user ? { ...state.user, ...user } : null,
    })),
    updateWallet: (wallet) => set((state) => ({
        wallet: state.wallet ? { ...state.wallet, ...wallet } : null,
    })),
    // Apply a global microtax (1%) to an amount, credit treasury, return net
    applyMicrotax: (amount) => {
        const tax = Math.max(0, Math.round((amount * 0.01) * 100) / 100);
        const net = Math.max(0, Math.round((amount - tax) * 100) / 100);
        set((state) => ({ treasuryBalance: (state.treasuryBalance || 0) + tax }));
        return { net, tax };
    },
    // Marketplace purchase flow: buyer pays price, seller receives price minus 1% microtax
    marketplaceBuy: async (sellerAddress, price) => {
        set({ loading: true });
        try {
            await new Promise((r) => setTimeout(r, 300));
            set((state) => {
                const wallet = state.wallet
                    ? { ...state.wallet, balance: Math.max(0, state.wallet.balance - price) }
                    : null;
                return { wallet, loading: false };
            });
            // apply tax, credit treasury, record history, and credit simulated seller balance
            set((state) => {
                const tax = Math.max(0, Math.round((price * 0.01) * 100) / 100);
                const net = Math.max(0, Math.round((price - tax) * 100) / 100);
                const historyEntry = { id: `hist_${Date.now()}`, itemId: undefined, buyer: state.wallet?.address, seller: sellerAddress, price, timestamp: Date.now() };
                const newHistory = (state.marketplaceHistory || []).concat(historyEntry);
                const sellers = { ...(state.sellers || {}) };
                sellers[sellerAddress] = (sellers[sellerAddress] || 0) + net;
                // if the seller is the local wallet, credit wallet balance
                const wallet = state.wallet && state.wallet.address === sellerAddress ? { ...state.wallet, balance: state.wallet.balance + net } : state.wallet;
                return { treasuryBalance: (state.treasuryBalance || 0) + tax, marketplaceHistory: newHistory, sellers, wallet };
            });
            return;
        }
        catch (err) {
            console.error('marketplaceBuy failed', err);
            set({ loading: false });
            throw err;
        }
    },
    // Payouts (e.g., gambling) - apply 1% microtax on gross payout
    payoutGambling: async (recipientAddress, grossAmount) => {
        set({ loading: true });
        try {
            await new Promise((r) => setTimeout(r, 300));
            // apply tax
            set((state) => {
                const tax = Math.max(0, Math.round((grossAmount * 0.01) * 100) / 100);
                const net = Math.max(0, Math.round((grossAmount - tax) * 100) / 100);
                // credit recipient only if local user matches
                const wallet = state.wallet && state.wallet.address === recipientAddress
                    ? { ...state.wallet, balance: state.wallet.balance + net }
                    : state.wallet;
                return { wallet, treasuryBalance: (state.treasuryBalance || 0) + tax, loading: false };
            });
            return;
        }
        catch (err) {
            console.error('payoutGambling failed', err);
            set({ loading: false });
            throw err;
        }
    },
    // Credit seller helper (demo, local only)
    creditSeller: (sellerAddress, amount) => {
        set((state) => {
            const sellers = { ...(state.sellers || {}) };
            sellers[sellerAddress] = (sellers[sellerAddress] || 0) + amount;
            // if local wallet is seller, credit wallet too
            const wallet = state.wallet && state.wallet.address === sellerAddress ? { ...state.wallet, balance: state.wallet.balance + amount } : state.wallet;
            return { sellers, wallet };
        });
    },
    // Treasury governance: proposals and UBI distribution
    createProposal: (title, amount) => {
        set((state) => ({ proposals: [...(state.proposals || []), { id: `prop_${Date.now()}`, title, amount, votesFor: 0, votesAgainst: 0, proposer: state.wallet?.address || 'unknown', executed: false }] }));
    },
    voteProposal: (proposalId, support) => {
        set((state) => ({ proposals: (state.proposals || []).map((p) => p.id === proposalId ? { ...p, votesFor: support ? p.votesFor + 1 : p.votesFor, votesAgainst: support ? p.votesAgainst : p.votesAgainst + 1 } : p) }));
    },
    distributeUBI: async (amount) => {
        set({ loading: true });
        try {
            await new Promise((r) => setTimeout(r, 300));
            set((state) => {
                const treasury = (state.treasuryBalance || 0);
                const disburse = Math.min(treasury, amount);
                // demo: credit current wallet with entire disbursement
                const wallet = state.wallet ? { ...state.wallet, balance: state.wallet.balance + disburse } : state.wallet;
                return { wallet, treasuryBalance: treasury - disburse, loading: false };
            });
        }
        catch (err) {
            console.error('distributeUBI failed', err);
            set({ loading: false });
            throw err;
        }
    },
    sendCrypto: async (to, amount) => {
        set({ loading: true });
        try {
            // Demo: simulate transaction
            await new Promise((resolve) => setTimeout(resolve, 2000));
            set((state) => ({
                wallet: state.wallet
                    ? { ...state.wallet, balance: state.wallet.balance - amount }
                    : null,
                loading: false,
            }));
        }
        catch (error) {
            console.error('Transaction failed:', error);
            set({ loading: false });
            throw error;
        }
    },
    setMissions: (missions) => set({ missions }),
    acceptMission: (missionId) => set((state) => ({
        missions: state.missions.map((m) => m.id === missionId ? { ...m, status: 'in-progress' } : m),
    })),
    completeMission: (missionId, proof) => set((state) => ({
        missions: state.missions.map((m) => m.id === missionId ? { ...m, status: 'completed' } : m),
        wallet: state.wallet
            ? {
                ...state.wallet,
                pendingBalance: state.wallet.pendingBalance +
                    (state.missions.find((m) => m.id === missionId)?.reward || 0),
            }
            : null,
    })),
    setCurrentMission: (mission) => set({ currentMission: mission }),
    // Mining simulation: 5 solar facilities, each mining different crypto
    startMining: () => {
        set({ miningActive: true });
        let miningInterval;
        const runMiningTick = () => {
            set((state) => {
                if (!state.miningActive) {
                    clearInterval(miningInterval);
                    return state;
                }
                const facilities = state.miningFacilities || [];
                const newTotalMined = { ...(state.totalCryptoMined || {}) };
                const cryptoPrices = { BTC: 45000, ETH: 2500, Monero: 150, Kaspa: 0.15, CIVIC: 1.5 };
                let totalHashRate = 0;
                let totalTreasuryIncrease = 0;
                const newFacilities = facilities.map((facility) => {
                    if (!facility.active)
                        return facility;
                    // Calculate output based on solar power efficiency (per second)
                    const output = (facility.outputPerSecond * facility.solarPower) / 100;
                    const currentMined = (newTotalMined[facility.cryptoType] || 0) + output;
                    // Prevent exceeding 100 units per crypto per facility
                    const maxPerFacility = 100;
                    const actualOutput = Math.min(output, Math.max(0, maxPerFacility - (newTotalMined[facility.cryptoType] || 0)));
                    newTotalMined[facility.cryptoType] = Math.min(maxPerFacility, currentMined);
                    // Hash rate simulation (hashes per second based on crypto type)
                    const hashRates = { BTC: 1000, ETH: 5000, Monero: 2000, Kaspa: 8000, CIVIC: 3000 };
                    const hashRate = (hashRates[facility.cryptoType] || 1000) * (facility.solarPower / 100);
                    totalHashRate += hashRate;
                    // Treasury contribution from this facility
                    const price = cryptoPrices[facility.cryptoType] || 1;
                    const treasuryValue = (actualOutput * price * 0.005); // 0.5% of mined value per second
                    totalTreasuryIncrease += treasuryValue;
                    return {
                        ...facility,
                        totalMined: newTotalMined[facility.cryptoType],
                        hashRate,
                        treasuryContribution: (facility.treasuryContribution || 0) + treasuryValue
                    };
                });
                return {
                    miningFacilities: newFacilities,
                    totalCryptoMined: newTotalMined,
                    totalMiningHashRate: totalHashRate,
                    totalTreasuryFromMining: (state.totalTreasuryFromMining || 0) + totalTreasuryIncrease,
                    treasuryBalance: (state.treasuryBalance || 0) + totalTreasuryIncrease,
                };
            });
        };
        miningInterval = setInterval(runMiningTick, 1000); // Update every second
    },
    stopMining: () => {
        set({ miningActive: false });
    },
    simulateMining: () => {
        // Manual one-time mining simulation for testing
        set((state) => {
            const facilities = state.miningFacilities || [];
            const newTotalMined = { ...(state.totalCryptoMined || {}) };
            const cryptoPrices = { BTC: 45000, ETH: 2500, Monero: 150, Kaspa: 0.15, CIVIC: 1.5 };
            let totalTreasuryIncrease = 0;
            const newFacilities = facilities.map((facility) => {
                if (!facility.active)
                    return facility;
                const output = facility.outputPerSecond * 10; // Simulate 10 seconds
                newTotalMined[facility.cryptoType] = Math.min(100, (newTotalMined[facility.cryptoType] || 0) + output);
                const price = cryptoPrices[facility.cryptoType] || 1;
                const treasuryValue = output * price * 0.05;
                totalTreasuryIncrease += treasuryValue;
                return { ...facility, totalMined: Math.min(100, facility.totalMined + output), treasuryContribution: (facility.treasuryContribution || 0) + treasuryValue };
            });
            return {
                miningFacilities: newFacilities,
                totalCryptoMined: newTotalMined,
                treasuryBalance: (state.treasuryBalance || 0) + totalTreasuryIncrease,
            };
        });
    },
    // Job Board Functions
    selectJob: (jobId) => {
        set((state) => ({
            selectedJob: state.jobs?.find(j => j.id === jobId) || null,
            currentJobStatus: 'accepting',
            currentJobProgress: 0,
        }));
    },
    acceptJob: (jobId) => {
        set((state) => ({
            selectedJob: state.selectedJob?.id === jobId ? { ...state.selectedJob, status: 'in-progress' } : state.selectedJob,
            currentJobStatus: 'dispatched',
            currentJobProgress: 10,
        }));
    },
    verifyJobCompletion: (jobId, verificationResult) => {
        set((state) => ({
            currentJobStatus: verificationResult ? 'completed' : 'verifying',
            currentJobProgress: verificationResult ? 100 : 50,
        }));
    },
    completeJob: async (jobId) => {
        set({ loading: true });
        try {
            await new Promise((r) => setTimeout(r, 800));
            set((state) => {
                const job = state.jobs?.find(j => j.id === jobId);
                if (!job)
                    return { loading: false };
                // Apply 1% microtax to job reward
                const tax = Math.max(0, Math.round((job.reward * 0.01) * 100) / 100);
                const netReward = Math.max(0, Math.round((job.reward - tax) * 100) / 100);
                // Credit wallet and treasury
                const wallet = state.wallet ? { ...state.wallet, balance: state.wallet.balance + netReward } : state.wallet;
                const newJobs = state.jobs?.map(j => j.id === jobId ? { ...j, status: 'completed' } : j) || [];
                // Record in marketplace history
                const historyEntry = {
                    id: `hist_${Date.now()}`,
                    itemId: jobId,
                    buyer: state.wallet?.address,
                    seller: 'SYSTEM_JOB_BOARD',
                    price: job.reward,
                    timestamp: Date.now()
                };
                return {
                    wallet,
                    jobs: newJobs,
                    treasuryBalance: (state.treasuryBalance || 0) + tax,
                    marketplaceHistory: [...(state.marketplaceHistory || []), historyEntry],
                    selectedJob: null,
                    currentJobStatus: 'available',
                    currentJobProgress: 0,
                    loading: false,
                };
            });
        }
        catch (err) {
            console.error('Job completion failed', err);
            set({ loading: false });
            throw err;
        }
    },
}));
