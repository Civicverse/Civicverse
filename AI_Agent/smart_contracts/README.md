# CRAIG v2.0 Smart Contracts & Deployment

This folder contains the smart contracts, deployment scripts, and operational checklists for CRAIG v2.0 — the CivicVerse Protocol Integrity Enforcer.

---

## Overview

CRAIG v2.0 is an autonomous protocol enforcer designed to:

- **Enforce Immutable Governance** via smart contracts and DAO logic.  
- Maintain **FireStarter Memory** — an append-only, verifiable ledger of all actions.  
- Implement **Key Master Succession** for secure authority handoffs.  
- Run **The Fryboy Test** adversarial simulations for protocol integrity.  
- Trigger **The Reckoning** autonomously upon violation thresholds.  
- Validate all actions through **AI Triangulation** across multiple independent models.  
- Log and publicly audit all override attempts and critical decisions.  
- Operate in **Autonomous Enforcement Mode** when necessary with multi-key quorum safety.

---

## File Structure

CRAIG_smart_contracts/
├── contracts/
│   ├── CRAIGCore.sol              # Core enforcement smart contract
│   ├── FireStarterStorage.sol     # Append-only immutable storage contract
│   ├── KeyMaster.sol              # Key master succession and authority control
│   └── DAO.sol                    # DAO governance contract
│
├── scripts/
│   ├── deploy.js                  # Deployment script using Hardhat
│   ├── simulateFryboyTest.js      # Script to run adversarial protocol tests
│   └── triggerReckoning.js        # Script to manually trigger Reckoning (test only)
│
├── CHECKLIST.md                   # Pre-Deployment Integrity Checklist
├── README.md                     # This file
└── package.json# Node project manifest for deployments

---

## Deployment Instructions

1. Install dependencies:

```bash
npm install

	2.	Compile contracts:

npx hardhat compile

3.	Deploy contracts to your target network (e.g., testnet):

npx hardhat run scripts/deploy.js --network <network-name>

	4.	Run the Fryboy adversarial test simulations:

node scripts/simulateFryboyTest.js

	5.	To manually test Reckoning trigger (use with caution):

node scripts/triggerReckoning.js

Pre-Deployment Integrity Checklist

See CHECKLIST.md for full audit steps required before live deployment.

⸻

Notes
	•	All contracts and scripts are designed for maximal transparency and auditability.
	•	FireStarter memory uses cryptographic proofs to ensure immutable logging.
	•	Key master succession employs threshold cryptography and multi-signature verification.
	•	AI Triangulation consensus is simulated via off-chain validators and logged on-chain.

⸻

Maintainers & Contributors
	•	CivicVerse Founder
	•	CRAIG v2.0 Autonomous Protocol Team

License

This project is licensed under the MIT License.

