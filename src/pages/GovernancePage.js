import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Clock, Plus, X } from 'lucide-react';
export function GovernancePage() {
    const [showProposalForm, setShowProposalForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [proposals, setProposals] = useState([
        {
            id: '1',
            title: 'Increase Mission Rewards by 20%',
            description: 'Community proposal to increase reward amounts for all missions to incentivize participation.',
            votes: { yes: 234, no: 45 },
            timeRemaining: '2d 4h',
        },
        {
            id: '2',
            title: 'Add Environmental Category Missions',
            description: 'New environmental protection missions focused on climate change mitigation efforts.',
            votes: { yes: 156, no: 78 },
            timeRemaining: '1d 12h',
        },
        {
            id: '3',
            title: 'Governance Token Distribution',
            description: 'Proposal to distribute governance tokens to long-term community members.',
            votes: { yes: 89, no: 120 },
            timeRemaining: '3h 45m',
        },
    ]);
    const handleVote = (proposalId, vote) => {
        setProposals(proposals.map((p) => p.id === proposalId
            ? {
                ...p,
                votes: vote ? { ...p.votes, yes: p.votes.yes + 1 } : { ...p.votes, no: p.votes.no + 1 },
                userVoted: true,
            }
            : p));
    };
    const handleSubmitProposal = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim())
            return;
        const newProposal = {
            id: (proposals.length + 1).toString(),
            title: formData.title,
            description: formData.description,
            votes: { yes: 0, no: 0 },
            timeRemaining: '7d',
            userVoted: false,
            author: 'You',
        };
        setProposals([newProposal, ...proposals]);
        setFormData({ title: '', description: '' });
        setShowProposalForm(false);
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-dark", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-4xl font-bold text-white mb-2", children: "Governance" }), _jsx("p", { className: "text-dark-300", children: "Vote on proposals that shape CivicVerse's future" })] }), _jsxs(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: () => setShowProposalForm(!showProposalForm), className: "bg-civic-500 hover:bg-civic-600 text-white font-bold py-3 px-6 rounded-lg transition flex items-center gap-2", children: [_jsx(Plus, { className: "w-5 h-5" }), "Submit Proposal"] })] }), showProposalForm && (_jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, className: "bg-dark-800 border border-civic-500/50 rounded-xl p-6 mb-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Submit a New Proposal" }), _jsx("button", { onClick: () => setShowProposalForm(false), className: "p-2 hover:bg-dark-700 rounded-lg transition", children: _jsx(X, { className: "w-6 h-6 text-dark-300" }) })] }), _jsxs("form", { onSubmit: handleSubmitProposal, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-white font-semibold mb-2", children: "Proposal Title" }), _jsx("input", { type: "text", value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), placeholder: "e.g., Increase Mission Rewards by 25%", className: "w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 transition outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-white font-semibold mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Provide details about your proposal and why it's important for the community...", rows: 4, className: "w-full bg-dark-700 border border-dark-600 rounded-lg px-4 py-2 text-white placeholder-dark-400 focus:border-civic-500 focus:ring-2 focus:ring-civic-500/20 transition outline-none resize-none" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, type: "submit", className: "flex-1 bg-civic-500 hover:bg-civic-600 text-white font-bold py-2 px-4 rounded-lg transition", children: "Submit Proposal" }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, type: "button", onClick: () => setShowProposalForm(false), className: "flex-1 bg-dark-700 hover:bg-dark-600 text-white font-bold py-2 px-4 rounded-lg transition", children: "Cancel" })] })] })] })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12", children: [
                        { label: 'Active Proposals', value: '3', icon: '🗳️' },
                        { label: 'Your Voting Power', value: '1,250 CIVIC', icon: '⚡' },
                        { label: 'Governance Participation', value: '85%', icon: '📊' },
                    ].map((stat, i) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.1 }, className: "bg-dark-800 border border-dark-700 rounded-xl p-6", children: [_jsx("div", { className: "text-3xl mb-2", children: stat.icon }), _jsx("p", { className: "text-dark-300 text-sm font-medium", children: stat.label }), _jsx("p", { className: "text-2xl font-bold text-white mt-2", children: stat.value })] }, i))) }), _jsx("div", { className: "space-y-4", children: proposals.map((proposal, index) => {
                        const totalVotes = proposal.votes.yes + proposal.votes.no;
                        const yesPercent = totalVotes > 0 ? (proposal.votes.yes / totalVotes) * 100 : 0;
                        const noPercent = totalVotes > 0 ? (proposal.votes.no / totalVotes) * 100 : 0;
                        return (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.1 }, className: "bg-dark-800 border border-dark-700 rounded-xl p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-xl font-bold text-white mb-2", children: proposal.title }), _jsx("p", { className: "text-dark-300", children: proposal.description })] }), _jsxs("div", { className: "flex items-center gap-2 text-dark-300 text-sm ml-4", children: [_jsx(Clock, { className: "w-4 h-4" }), proposal.timeRemaining] })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium text-dark-200", children: "Vote Results" }), _jsxs("span", { className: "text-sm text-dark-400", children: [totalVotes, " votes"] })] }), _jsxs("div", { className: "flex h-3 rounded-full overflow-hidden bg-dark-700 gap-1", children: [_jsx("div", { className: "bg-green-500 transition-all", style: { width: `${yesPercent}%` } }), _jsx("div", { className: "bg-red-500 transition-all", style: { width: `${noPercent}%` } })] }), _jsxs("div", { className: "flex justify-between mt-2 text-sm", children: [_jsxs("span", { className: "text-green-400", children: ["\u2713 Yes: ", proposal.votes.yes] }), _jsxs("span", { className: "text-red-400", children: ["\u2717 No: ", proposal.votes.no] })] })] }), !proposal.userVoted ? (_jsxs("div", { className: "flex gap-3", children: [_jsxs("button", { onClick: () => handleVote(proposal.id, true), className: "flex-1 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/50 text-green-400 font-semibold rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(ThumbsUp, { className: "w-4 h-4" }), " Vote Yes"] }), _jsxs("button", { onClick: () => handleVote(proposal.id, false), className: "flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-semibold rounded-lg transition flex items-center justify-center gap-2", children: [_jsx(ThumbsDown, { className: "w-4 h-4" }), " Vote No"] })] })) : (_jsx("div", { className: "p-3 bg-civic-500/10 border border-civic-500/50 rounded-lg text-civic-300 text-center font-semibold", children: "\u2713 You have voted on this proposal" }))] }, proposal.id));
                    }) })] }) }));
}
