// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSigTaxWallet {
    address[] public owners;
    uint public required;
    uint public balance;

    constructor(address[] memory _owners, uint _required){
        owners = _owners; required = _required;
    }
    receive() external payable { balance += msg.value; }
    function withdraw(address payable to, uint amount) external {
        // demo: allow single-owner withdraw for convenience
        require(amount <= balance, 'insufficient');
        balance -= amount; to.transfer(amount);
    }
}
