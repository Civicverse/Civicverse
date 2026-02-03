const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  const termsHash = "0x123456789abcdef..."; // Replace with actual hash of Non-Negotiable Terms document

  const Craig = await hre.ethers.getContractFactory("CraigProtocolIntegrityEnforcer");
  const craig = await Craig.deploy(deployer.address, termsHash);

  await craig.deployed();

  console.log("Craig deployed to:", craig.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
