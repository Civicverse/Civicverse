async function main(){
  const [deployer] = await ethers.getSigners()
  console.log('Deploying with', deployer.address)
  const QV = await ethers.getContractFactory('QuadraticVoting')
  const qv = await QV.deploy()
  await qv.deployed()
  console.log('QuadraticVoting deployed to', qv.address)
  const MS = await ethers.getContractFactory('MultiSigTaxWallet')
  const ms = await MS.deploy([deployer.address],1)
  await ms.deployed()
  console.log('MultiSigTaxWallet deployed to', ms.address)
  // write deployed addresses for backend to consume
  const fs = require('fs')
  const out = {
    QuadraticVoting: qv.address,
    MultiSigTaxWallet: ms.address,
    deployer: deployer.address
  }
  fs.writeFileSync('deployed.json', JSON.stringify(out, null, 2))
  console.log('Wrote deployed.json')
}

main().catch(e=>{console.error(e);process.exit(1)})
