// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ICivicID.sol";

contract P2PGambling {
    ICivicID public idVerifier;
    string public constant TREASURY_XMR = "438XTJJvpD96uBFFM3jv1fevMx33YW5cjHtPZQ4bXABjfh9RV2eRNa8LiRyVJbDQgEHWpmZSCH836DcvzrQJa52CGBHVSEp";

    struct Game {
        address player1;
        address player2;
        uint256 betAmount;
        bytes32 commitment1;
        bytes32 commitment2;
        bool active;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCount;

    event MoneroPaymentInstruction(
        address indexed payer,
        string receiverXMR,
        uint256 amount,
        string memo,
        uint256 nonce
    );

    event GameCreated(uint256 indexed gameId, address p1, uint256 bet);

    constructor(address _idVerifier) {
        idVerifier = ICivicID(_idVerifier);
    }

    function createGame(bytes32 commitment, uint256 bet) external {
        require(idVerifier.hasPurpleCheck(msg.sender), "Verified CivicID required");
        uint256 id = gameCount++;
        Game storage g = games[id];
        g.player1 = msg.sender;
        g.betAmount = bet;
        g.commitment1 = commitment;
        g.active = true;
        emit GameCreated(id, msg.sender, bet);
    }

    // Simplified settlement for demonstration of 1% cut logic
    function settleGame(uint256 gameId, address winner, string calldata winnerXMRAddress) external {
        Game storage g = games[gameId];
        require(g.active, "Not active");
        // In real implementation, validate against commitments/reveals here
        
        uint256 totalPool = g.betAmount * 2;
        uint256 treasuryCut = totalPool / 100;
        uint256 winnings = totalPool - treasuryCut;
        uint256 nonce = block.timestamp;

        // Instructions for the loser to pay (or escrow settlement signal)
        address loser = (winner == g.player1) ? g.player2 : g.player1;

        emit MoneroPaymentInstruction(loser, winnerXMRAddress, winnings, "Gambling Win", nonce);
        emit MoneroPaymentInstruction(loser, TREASURY_XMR, treasuryCut, "Gambling 1% Treasury Cut", nonce + 1);

        g.active = false;
    }
}
