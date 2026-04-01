// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICivicIDVerifier {
    function hasPurpleCheck(address) external view returns (bool);
}

/**
 * @title P2PDonation
 * @notice Simple verified-to-verified donation with 1% cut.
 */
contract P2PDonation is ReentrancyGuard {
    address public immutable treasury;
    ICivicIDVerifier public immutable verifier;

    event DonationSent(address indexed sender, address indexed recipient, uint256 amount);

    constructor(address _verifier, address _treasury) {
        verifier = ICivicIDVerifier(_verifier);
        treasury = _treasury;
    }

    function sendDonation(address payable recipient) external payable nonReentrant {
        require(verifier.hasPurpleCheck(msg.sender), "Sender Purple Check Required");
        require(verifier.hasPurpleCheck(recipient), "Recipient Purple Check Required");
        require(msg.value > 0, "No donation provided");

        uint256 fee = (msg.value * 1) / 100;
        uint256 net = msg.value - fee;

        (bool s1, ) = recipient.call{value: net}("");
        require(s1, "Transfer to recipient failed");

        (bool s2, ) = treasury.call{value: fee}("");
        require(s2, "Transfer to treasury failed");

        emit DonationSent(msg.sender, recipient, net);
    }
}
