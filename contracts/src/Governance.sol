// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ICivicID.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title Governance
 * @dev 1p1v + quadratic hybrid voting based on verified job contributions.
 */
contract Governance is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    
    ICivicID public idVerifier;
    
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Track verified contributions for quadratic weight
    mapping(address => uint256) public contributionScore;

    constructor() {
        _disableInitializers();
    }

    function initialize(address _idVerifier) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        idVerifier = ICivicID(_idVerifier);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function createProposal(string calldata description, uint256 duration) external {
        require(idVerifier.hasPurpleCheck(msg.sender), "Only verified citizens");
        uint256 id = proposalCount++;
        Proposal storage p = proposals[id];
        p.description = description;
        p.endTime = block.timestamp + duration;
    }

    function vote(uint256 proposalId, bool support) external {
        require(idVerifier.hasPurpleCheck(msg.sender), "Only verified citizens");
        Proposal storage p = proposals[proposalId];
        require(block.timestamp < p.endTime, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");

        // 1p1v Base + Quadratic bonus from contributions
        uint256 weight = 1 + sqrt(contributionScore[msg.sender]);
        
        if (support) p.votesFor += weight;
        else p.votesAgainst += weight;

        p.hasVoted[msg.sender] = true;
    }

    function recordContribution(address contributor, uint256 amount) external {
        // Only authorized job contracts or factory can call this
        // In a real setup, we'd have an AccessControl list
        contributionScore[contributor] += amount;
    }

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
