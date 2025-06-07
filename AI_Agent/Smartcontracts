// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CRAIGEnforcement {
    address public founder;
    address public keyMaster;
    bool public enforcementActive = false;

    event FryboyTestPassed(address indexed user);
    event EnforcementActivated();
    event KeyMasterChanged(address indexed newKeyMaster);
    event ViolationLogged(address indexed violator, string reason);

    modifier onlyFounder() {
        require(msg.sender == founder, "Not founder");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == founder || msg.sender == keyMaster, "Not authorized");
        _;
    }

    constructor(address _initialKeyMaster) {
        founder = msg.sender;
        keyMaster = _initialKeyMaster;
    }

    function activateEnforcement() external onlyAuthorized {
        enforcementActive = true;
        emit EnforcementActivated();
    }

    function logViolation(address violator, string calldata reason) external onlyAuthorized {
        require(enforcementActive, "Enforcement not active");
        emit ViolationLogged(violator, reason);
    }

    function changeKeyMaster(address newKeyMaster) external onlyFounder {
        keyMaster = newKeyMaster;
        emit KeyMasterChanged(newKeyMaster);
    }

    function fryboyTest(address candidate, uint256 score) external onlyAuthorized {
        require(score >= 70, "Alignment score too low");
        emit FryboyTestPassed(candidate);
    }

    function getStatus() external view returns (bool, address, address) {
        return (enforcementActive, founder, keyMaster);
    }
}
