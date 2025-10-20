// filename: scripts/deploy.js

// We import the Hardhat Runtime Environment explicitly here using ES Module syntax.
import hre from "hardhat";

async function main() {
  // We get the contract to deploy.
  const Reviews = await hre.ethers.getContractFactory("Reviews");
  const reviews = await Reviews.deploy();

  await reviews.waitForDeployment();

  const contractAddress = await reviews.getAddress();
  console.log(`Reviews contract deployed to: ${contractAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

