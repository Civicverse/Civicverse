// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICivicID {
    function hasPurpleCheck(address user) external view returns (bool);
    function attestationCount(address user) external view returns (uint256);
}
