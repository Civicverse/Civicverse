// scripts/deploy_dao.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying CRAIG DAO with account:", deployer.address);

  // Replace this with the actual deployed address of your CRAIG Enforcement contract
  const craigAddress = "0xYourCRAIGEnforcementContractAddress";

  const CRAIG_DAO = await hre.ethers.getContractFactory("CRAIG_DAO");
  const dao = await CRAIG_DAO.deploy(craigAddress);

  await dao.deployed();

  console.log("CRAIG DAO deployed to:", dao.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
