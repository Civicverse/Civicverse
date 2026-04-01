const ubiEngine = require('./UBI-engine/ubi-service');

class GovernanceService {
  constructor() {
    this.treasuryBalance = 150000; // Total CVT in Community Treasury
    this.proposals = [
      {
        id: 'prop_1',
        title: 'Increase Park Cleanup Rewards',
        description: 'Proposed 20% increase in CVT rewards for all environmental missions to encourage more participation in local sectors.',
        type: 'parameter_change',
        value: 1.2,
        votesFor: 4500,
        votesAgainst: 1200,
        status: 'voting',
        endTime: Date.now() + 86400000 * 3,
        proposer: 'did:civic:community_hq',
        voters: {}, // Map of voterId -> { choice, weight, cost }
        category: 'environmental',
        aiWatchdogStatus: 'compliant',
        aiAuditLog: 'Rule set compliance: Checked. Budget constraints: Within bounds. Priority: High.'
      },
      {
        id: 'prop_2',
        title: 'Community Garden Funding',
        description: 'Allocate 5000 CVT from treasury to build a new hydroponic garden in Sector 7 for food sovereignty.',
        type: 'treasury_allocation',
        value: 5000,
        votesFor: 12000,
        votesAgainst: 500,
        status: 'passed',
        endTime: Date.now() - 86400000,
        proposer: 'did:civic:sector7_council',
        voters: {},
        category: 'social',
        aiWatchdogStatus: 'compliant',
        aiAuditLog: 'Proposal matches Social Sovereignty mandate. Funds allocation verified.'
      }
    ];
  }

  getProposals() {
    return this.proposals;
  }

  getTreasuryBalance() {
    return this.treasuryBalance;
  }

  createProposal(proposalData) {
    const { title, description, type, value, proposer, category } = proposalData;
    
    if (!title || !description || !proposer) {
        throw new Error('Incomplete proposal data.');
    }

    const prop = { 
        id: `prop_${Date.now()}`, 
        title, 
        description, 
        type: type || 'parameter_change',
        value: value || 0,
        votesFor: 0, 
        votesAgainst: 0, 
        status: 'voting',
        endTime: Date.now() + 86400000 * 7, // 7 days default
        proposer,
        category: category || 'civic',
        voters: {},
        aiWatchdogStatus: 'pending',
        aiAuditLog: 'AI analysis in progress...'
    };

    // Simulate instant AI Watchdog check
    setTimeout(() => {
        prop.aiWatchdogStatus = 'compliant';
        prop.aiAuditLog = 'Automated compliance check passed. One-Person-One-Vote protocol active.';
    }, 2000);

    this.proposals.push(prop);
    return prop;
  }

  calculateQuadraticCost(currentWeight, additionalWeight) {
    // Total cost for n votes is n^2.
    // Cost for adding m votes to existing n votes is (n+m)^2 - n^2.
    const newTotal = currentWeight + additionalWeight;
    return (newTotal * newTotal) - (currentWeight * currentWeight);
  }

  vote(proposalId, choice, voterId, weight = 1, voterLevel = 1) {
    const prop = this.proposals.find(p => p.id === proposalId);
    if (!prop) throw new Error('Proposal not found');
    if (prop.status !== 'voting') throw new Error('Proposal is not active');
    
    // Identity Level Check based on Whitepaper
    // Verified CivicID (Purple Checkmark / Level 2) is required for full governance.
    // Level 1 can participate in Real-Time Polls but maybe restricted in parameter changes.
    if (voterLevel < 2 && prop.type === 'parameter_change') {
        throw new Error('Verification Level 2 required for Protocol Parameter changes.');
    }

    // Initialize voter record if new
    if (!prop.voters[voterId]) {
      prop.voters[voterId] = { choice: null, weight: 0, cost: 0 };
    }

    const voterRecord = prop.voters[voterId];
    
    // Check if voter is trying to change their vote (not fully supported in this simple prototype)
    if (voterRecord.choice && voterRecord.choice !== choice) {
        throw new Error('Changing vote direction is not supported in this version.');
    }

    const cost = this.calculateQuadraticCost(voterRecord.weight, weight);
    
    // Update proposal tallies
    if (choice === 'yes') {
        prop.votesFor += weight;
    } else if (choice === 'no') {
        prop.votesAgainst += weight;
    }

    // Update voter record
    voterRecord.weight += weight;
    voterRecord.cost += cost;
    voterRecord.choice = choice;

    return { 
        success: true, 
        proposal: prop,
        cost: cost,
        totalWeight: voterRecord.weight,
        totalCost: voterRecord.cost
    };
  }

  executeProposal(proposalId) {
    const prop = this.proposals.find(p => p.id === proposalId);
    if (!prop) throw new Error('Proposal not found');
    if (prop.status !== 'passed') throw new Error('Only passed proposals can be executed');
    
    // Execution Logic
    if (prop.type === 'treasury_allocation') {
        if (this.treasuryBalance < prop.value) {
            prop.status = 'failed_execution';
            throw new Error('Insufficient treasury funds.');
        }
        this.treasuryBalance -= prop.value;
        console.log(`[Governance] AI EXECUTOR: Transferred ${prop.value} CVT for ${prop.title}`);
    } else if (prop.type === 'parameter_change') {
        console.log(`[Governance] AI EXECUTOR: Applied parameter change ${prop.title} = ${prop.value}`);
    }
    
    prop.status = 'executed';
    prop.aiAuditLog += `\n[${new Date().toISOString()}] AI Executor: Successfully applied actions.`;
    return { success: true, proposal: prop, treasuryBalance: this.treasuryBalance };
  }
}

module.exports = new GovernanceService();
