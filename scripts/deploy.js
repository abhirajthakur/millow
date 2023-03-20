const hre = require("hardhat");

const tokens = (num) => {
  return hre.ethers.utils.parseEther(num.toString());
}

async function main() {
  // Setup accounts
  const [buyer, seller, inspector, lender] = await hre.ethers.getSigners();

  // Deploy Real Estate contract
  const RealEstate = await hre.ethers.getContractFactory('RealEstate');
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed Real Estate contract at: ${realEstate.address}`);

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`);
    await transaction.wait();
  }

  // Deploy Escrow contract
  const Escrow = await hre.ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy(
    realEstate.address,
    lender.address,
    inspector.address,
    seller.address
  )
  await escrow.deployed();

  console.log(`Deployed Escrow contract at: ${escrow.address}`);

  for (let i = 0; i < 3; i++) {
    // Approve properties
    const transaction = await realEstate.connect(seller).approve(escrow.address, i + 1);
    await transaction.wait();
  }

  let transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
  await transaction.wait()

  console.log(`Finished.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
