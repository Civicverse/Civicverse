# CivicWatch Smart Contract System - Implementation Guide

## 🚀 Architecture Overview
The system is built on **EVM L2** (Base/Arbitrum) but operates **off-platform**. 
- **Ethereum/L2**: Enforces rules, logic, and emits immutable payment instructions (Events).
- **Monero**: Executes actual P2P value movement (99% to worker, 1% to Treasury).
- **CivicNodes (Offline-First)**: Executes WASM-compiled versions of these contracts locally for validation and queues transactions for on-chain sync.

## 📄 Contracts Implemented
1. `CivicIDVerifier.sol`: Soulbound Purple Check (NFT) via 3 peer attestations.
2. `CivicWatchJob.sol`: Per-job logic with mandatory 1% Treasury cut.
3. `CivicWatchJobFactory.sol`: Scalable job deployment.
4. `CivicWatchStreamTip.sol`: Verified-only streaming tips with 1% cut.
5. `P2PDonation.sol` & `P2PGambling.sol`: Direct settlements with 1% cut.
6. `CommunityTreasury.sol`: Governance-voted spending instructions.
7. `Governance.sol`: 1p1v + Quadratic contribution-weighted voting.

---

## 🛠 WASM / Offline Usage Guide
To run these contracts on a **CivicNode (Raspberry Pi)**:
1. **Compile to WASM**: Use `solc` with the WebAssembly target or deploy via **Arbitrum Stylus** which supports Solidity-to-WASM execution.
2. **Local EVM Runtime**: Run a lightweight `anvil` or `geth` instance on the node.
3. **Transaction Queuing**: 
   - Node validates `submitProof()` locally using AI.
   - Node signs a local state transition.
   - Transaction is added to a Merkle-tree based queue.
   - When online, the queue is "flushed" to the L2 chain.

---

## 🤖 AI / Node Verifier Pseudocode
```python
# Executed locally on CivicNode / Raspberry Pi
async def validate_mission_proof(job_id, worker_id, proof_data):
    # 1. Verify Verification Level
    if not blockchain.has_purple_check(worker_id):
        return Reject("Worker not verified")

    # 2. Geo-Verification
    distance = calculate_distance(proof_data.gps, job.target_location)
    if distance > 500: # meters
        return Reject("Out of bounds")

    # 3. AI Media Audit (Ollama/Craig AI)
    ai_result = await ollama.analyze(
        image=proof_data.image_hash, 
        prompt=job.requirements_description
    )
    
    if ai_result.confidence > 0.85:
        # 4. Trigger Contract releasePayment instruction
        contract.releasePayment(worker_xmr_address)
        return Success("Proof verified on-chain")
```

---

## 🔄 End-to-End User Flows

### 1. Job Flow (Monetary)
1. **Employer**: Deploys `CivicWatchJob` via Factory with 100 XMR reward.
2. **Worker (Purple Check only)**: Calls `acceptJob()`.
3. **Worker**: Completes real-world work, calls `submitProof(ipfs_hash, geo_hash)`.
4. **AI Node**: Validates proof locally, then triggers `releasePayment()`.
5. **On-Chain Event**: 
   - `Payment(receiver: worker, amount: 99 XMR)`
   - `Payment(receiver: Treasury, amount: 1 XMR)`
6. **Civic Wallet**: Scans events, signs and broadcasts two Monero TXs.

### 2. Live Stream Tipping
1. **Spectator**: Opens `CivicWatchStreamTip`.
2. **Spectator**: Enters 5 XMR tip.
3. **Contract**: Emits instructions for 4.95 XMR to Streamer and 0.05 XMR to Treasury.
4. **Wallet**: Auto-executes Monero transfer.

---

## 🛡 Security Checklist
- [x] **Soulbound Identity**: Purple checks cannot be sold or moved (anti-Sybil).
- [x] **Reentrancy Guards**: Applied to all settlement logic.
- [x] **Verified Gates**: `idVerifier.hasPurpleCheck(msg.sender)` on all monetary functions.
- [x] **Immutable Treasury**: Treasury address is hardcoded constant in settlement contracts.
- [x] **1% Enforcement**: Calculated within the `releasePayment` logic, cannot be bypassed by UI.

---

## 📍 Integration Notes (Frontend Stub)
The current grid menu on the Community Hub should be updated to:
1. Check `user.verificationLevel == 2` before allowing "Accept Dispatch".
2. Use `ethers.js` to call `jobFactory.deployJob()` when in Employer Mode.
3. Listen for `MoneroPaymentInstruction` events to trigger the Monero wallet bridge.
