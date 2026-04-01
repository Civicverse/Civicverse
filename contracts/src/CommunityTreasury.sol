// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ICivicID.sol";

/**
 * @title CommunityTreasury
 * @dev Tracks the 1% cuts and manages governance-voted spending instructions.
 */
contract CommunityTreasury {
    ICivicID public idVerifier;
    address public governance;

    event SpendingInstruction(string recipientXMR, uint256 amount, string memo);

    constructor(address _idVerifier) {
        idVerifier = ICivicID(_idVerifier);
        governance = msg.sender;
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    function updateGovernance(address _newGov) external onlyGovernance {
        governance = _newGov;
    }

    function proposeSpending(string calldata recipientXMR, uint256 amount, string calldata memo) external onlyGovernance {
        // This would be triggered after a successful governance vote
        emit SpendingInstruction(recipientXMR, amount, memo);
    }
}
