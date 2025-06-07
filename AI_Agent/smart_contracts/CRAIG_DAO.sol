// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CRAIG_DAO {
    address public founder;
    uint256 public proposalCount;

    struct Proposal {
        uint256 id;
        string description;
        string newProtocolHash;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
    }

    mapping(address => bool) public voters;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 id, string description, string newHash, uint256 deadline);
    event Voted(uint256 proposalId, address voter, bool inFavor);
    event ProposalExecuted(uint256 proposalId, string newHash);

    CRAIGEnforcement craig;

    modifier onlyFounder() {
        require(msg.sender == founder, "Not founder");
        _;
    }

    modifier onlyVoter() {
        require(voters[msg.sender], "Not authorized to vote");
        _;
    }

    constructor(address _craigAddress) {
        founder = msg.sender;
        craig = CRAIGEnforcement(_craigAddress);
        voters[founder] = true;
    }

    function addVoter(address voter) external onlyFounder {
        voters[voter] = true;
    }

    function removeVoter(address voter) external onlyFounder {
        voters[voter] = false;
    }

    function proposeProtocolChange(string memory description, string memory newHash) external onlyVoter {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: description,
            newProtocolHash: newHash,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + 3 days,
            executed: false
        });

        emit ProposalCreated(proposalCount, description, newHash, block.timestamp + 3 days);
    }

    function vote(uint256 proposalId, bool inFavor) external onlyVoter {
        Proposal storage prop = proposals[proposalId];
        require(block.timestamp < prop.deadline, "Voting closed");
        require(!prop.executed, "Already executed");

        if (inFavor) {
            prop.votesFor++;
        } else {
            prop.votesAgainst++;
        }

        emit Voted(proposalId, msg.sender, inFavor);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage prop = proposals[proposalId];
        require(block.timestamp >= prop.deadline, "Voting still active");
        require(!prop.executed, "Already executed");

        require(prop.votesFor > prop.votesAgainst, "Proposal rejected");

        craig.updateProtocol(prop.newProtocolHash);
        prop.executed = true;

        emit ProposalExecuted(proposalId, prop.newProtocolHash);
    }
}

interface CRAIGEnforcement {
    function updateProtocol(string memory newHash) external;
}
