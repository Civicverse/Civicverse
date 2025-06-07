// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CRAIGEnforcement {
    address public founder;
    string public protocolHash; // IPFS or Arweave hash of the full protocol
    bool public locked;

    mapping(address => bool) public authorizedAgents;

    event ProtocolUpdated(string newHash);
    event AgentAuthorized(address agent);
    event AgentRevoked(address agent);
    event ProtocolLocked();

    modifier onlyFounder() {
        require(msg.sender == founder, "Not founder");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedAgents[msg.sender] || msg.sender == founder, "Not authorized");
        _;
    }

    modifier isUnlocked() {
        require(!locked, "Protocol is locked");
        _;
    }

    constructor(string memory _initialHash) {
        founder = msg.sender;
        protocolHash = _initialHash;
        authorizedAgents[msg.sender] = true;
    }

    function authorizeAgent(address agent) external onlyFounder {
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    function revokeAgent(address agent) external onlyFounder {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    function updateProtocol(string memory newHash) external onlyAuthorized isUnlocked {
        protocolHash = newHash;
        emit ProtocolUpdated(newHash);
    }

    function lockProtocol() external onlyFounder {
        locked = true;
        emit ProtocolLocked();
    }

    function getProtocolHash() public view returns (string memory) {
        return protocolHash;
    }
}
