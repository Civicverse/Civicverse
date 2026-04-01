// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ICivicID.sol";

contract CivicWatchStreamTip {
    ICivicID public idVerifier;
    string public constant TREASURY_XMR = "438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp";

    event MoneroPaymentInstruction(
        address indexed payer,
        string receiverXMR,
        uint256 amount,
        string memo,
        uint256 nonce
    );

    constructor(address _idVerifier) {
        idVerifier = ICivicID(_idVerifier);
    }

    function tip(string calldata streamerXMRAddress, uint256 amount) external {
        require(idVerifier.hasPurpleCheck(msg.sender), "Verified CivicID required to tip");
        
        uint256 treasuryCut = amount / 100;
        uint256 streamerPayout = amount - treasuryCut;
        uint256 nonce = block.timestamp;

        // 1. Streamer Payout (99%)
        emit MoneroPaymentInstruction(
            msg.sender,
            streamerXMRAddress,
            streamerPayout,
            "Live Stream Tip",
            nonce
        );

        // 2. Treasury Cut (1%)
        emit MoneroPaymentInstruction(
            msg.sender,
            TREASURY_XMR,
            treasuryCut,
            "Stream Tip 1% Treasury Cut",
            nonce + 1
        );
    }
}
