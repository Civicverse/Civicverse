// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICivicIDVerifier {
    function hasPurpleCheck(address) external view returns (bool);
}

/**
 * @title CivicWatchJob
 * @notice A sovereign, non-custodial escrow for a single job mission.
 * @dev Enforces 1% treasury cut on release.
 */
contract CivicWatchJob is ReentrancyGuard {
    address public immutable employer;
    address public immutable treasury;
    ICivicIDVerifier public immutable verifier;
    
    string public jobIPFS; // Job details & metadata
    uint256 public reward;
    address public operator; // The citizen who accepted the job
    bool public isCompleted;
    bool public isReleased;

    event JobAccepted(address indexed operator);
    event ProofSubmitted(string proofIPFS);
    event RewardReleased(address indexed operator, uint256 amount, uint256 treasuryFee);

    constructor(
        address _employer,
        address _treasury,
        address _verifier,
        string memory _jobIPFS,
        uint256 _reward
    ) payable {
        employer = _employer;
        treasury = _treasury;
        verifier = ICivicIDVerifier(_verifier);
        jobIPFS = _jobIPFS;
        reward = _reward;
        require(msg.value >= _reward, "Insufficient funding for reward");
    }

    /**
     * @notice Accept the job. Must have a Purple Checkmark.
     */
    function acceptJob() external {
        require(verifier.hasPurpleCheck(msg.sender), "Purple Check Required");
        require(operator == address(0), "Job already accepted");
        operator = msg.sender;
        emit JobAccepted(msg.sender);
    }

    /**
     * @notice Release the escrowed reward. Split 99/1.
     * @dev Only callable by employer after proof is submitted.
     */
    function releasePayment() external nonReentrant {
        require(msg.sender == employer, "Only employer can release payment");
        require(operator != address(0), "No operator assigned");
        require(!isReleased, "Payment already released");

        isReleased = true;
        
        // The 1% Treasury Cut (Mandatory)
        uint256 treasuryFee = (reward * 1) / 100;
        uint256 operatorPayment = reward - treasuryFee;

        // Transfers (Sovereign P2P)
        (bool success1, ) = payable(operator).call{value: operatorPayment}("");
        require(success1, "Transfer to operator failed");
        
        (bool success2, ) = payable(treasury).call{value: treasuryFee}("");
        require(success2, "Transfer to treasury failed");

        emit RewardReleased(operator, operatorPayment, treasuryFee);
    }
}
