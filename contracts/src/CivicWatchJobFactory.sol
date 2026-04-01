// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CivicWatchJob.sol";

/**
 * @title CivicWatchJobFactory
 * @notice Simplifies job creation for verified citizens.
 */
contract CivicWatchJobFactory {
    address public immutable verifier;
    address public immutable treasury;

    event JobCreated(address indexed employer, address jobAddress, string jobIPFS, uint256 reward);

    constructor(address _verifier, address _treasury) {
        verifier = _verifier;
        treasury = _treasury;
    }

    /**
     * @notice Deploy a new job mission contract.
     * @param jobIPFS IPFS hash of job details.
     * @param reward Total payout amount for the job.
     */
    function createJob(string memory jobIPFS, uint256 reward) external payable returns (address) {
        require(ICivicIDVerifier(verifier).hasPurpleCheck(msg.sender), "Purple Check Required to deploy jobs");
        require(msg.value >= reward, "Funding must cover reward");

        // Deploy new contract and fund it instantly
        CivicWatchJob newJob = (new CivicWatchJob){value: msg.value}(
            msg.sender,
            treasury,
            verifier,
            jobIPFS,
            reward
        );

        emit JobCreated(msg.sender, address(newJob), jobIPFS, reward);
        return address(newJob);
    }
}
