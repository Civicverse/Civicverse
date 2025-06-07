const hre = require("hardhat");

async function main() {
  const initialHash = "ipfs://QmExampleHashForInitialVersion";

  const CRAIG = await hre.ethers.getContractFactory("CRAIGEnforcement");
  const craig = await CRAIG.deploy(initialHash);

  await craig.deployed();

  console.log(`CRAIG deployed to: ${craig.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
