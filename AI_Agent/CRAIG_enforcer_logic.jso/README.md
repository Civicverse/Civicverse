# CRAIG v2.0 — CivicVerse Protocol Integrity Enforcer

## Overview

CRAIG v2.0 is the core smart contract component of the CivicVerse autonomous enforcement protocol. It serves as an immutable on-chain guardian of the CivicVerse Non-Negotiable Terms of Resolution, The Fryboy Test, and The Reckoning Trigger.

CRAIG enforces integrity by:

- Logging override attempts  
- Managing Key Master succession to maintain ethical oversight  
- Acting as the trust anchor for autonomous enforcement

## Repo Structure

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+  
- [Hardhat](https://hardhat.org/) development environment  
- An Ethereum wallet (e.g., MetaMask) for deployment  
- Access to an Ethereum testnet or local blockchain node

### Installation

1. Clone the CivicVerse repo:  
   ```bash
   git clone https://github.com/your-username/CivicVerse.git
   cd CivicVerse/AI_Agent
npm install

Deployment
	1.	Configure deployment parameters in scripts/deploy.js, especially the termsHash which should be the IPFS or on-chain hash of the Non-Negotiable Terms document.
	2.	Deploy the contract to your target network:

 npx hardhat run scripts/deploy.js --network <your-network>

 	3.	After deployment, CRAIG will be live at the address output in the console.

Usage
	•	The contract’s Key Master can be changed only by the current Key Master, ensuring controlled succession.
	•	Override attempts are logged on-chain for immutable auditability.
	•	Off-chain AI enforcement logic should interact with this contract for full protocol integrity.

Contributing

Feel free to submit issues or pull requests to improve CRAIG’s logic, integration, and tooling.

License

MIT License — see LICENSE file.

   
