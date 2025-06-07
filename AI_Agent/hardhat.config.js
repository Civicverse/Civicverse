require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    }
    // Add testnet/mainnet configs here if needed
  }
};
