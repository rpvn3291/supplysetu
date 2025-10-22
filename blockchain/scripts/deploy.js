// filename: scripts/deploy.js
import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("Deploying contracts...");

  // --- Deploy the Reviews Contract ---
  const Reviews = await ethers.getContractFactory("Reviews");
  const reviews = await Reviews.deploy();
  await reviews.waitForDeployment();
  const reviewsAddress = await reviews.getAddress();
  console.log(`Reviews contract deployed to: ${reviewsAddress}`);

  // --- Deploy the NEW Traceability Contract ---
  const Traceability = await ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();
  await traceability.waitForDeployment();
  const traceabilityAddress = await traceability.getAddress();
  console.log(`Traceability contract deployed to: ${traceabilityAddress}`);

  console.log("\nDeployment complete!");
  console.log("Update your .env file with these new addresses if needed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

