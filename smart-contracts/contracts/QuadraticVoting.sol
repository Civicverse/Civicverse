// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract QuadraticVoting {
    struct Proposal { uint id; string text; uint votes; }
    mapping(uint=>Proposal) public proposals;
    uint public nextId;
    mapping(address=>mapping(uint=>uint)) public votesBy; // cost stored externally in demo

    function createProposal(string calldata text) external {
        proposals[nextId] = Proposal(nextId, text, 0);
        nextId++;
    }
    function vote(uint proposalId, uint weight) external payable {
        // demo: weight is sqrt(cost) in JS; here we just accept vote
        proposals[proposalId].votes += weight;
        votesBy[msg.sender][proposalId] += weight;
    }
}
