import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying SoulboundCredential...");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("SoulboundCredential");
  const contract = await Factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();

  console.log("\n✅ SoulboundCredential deployed");
  console.log("Contract address:", address);
  console.log("Deployer / initial owner:", deployer.address);
  if (deployTx) {
    console.log("Deployment tx hash:", deployTx.hash);
  }

  if (network.name === "sepolia") {
    console.log(
      "Block explorer:",
      `https://sepolia.etherscan.io/address/${address}`
    );
  }

  // Persist deployment info + ABI so the frontend config can be updated
  // quickly (see frontend/src/config/contract.ts).
  const artifact = await ethers.getContractFactory("SoulboundCredential");
  const abi = artifact.interface.formatJson();

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const deploymentInfo = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    address,
    deployer: deployer.address,
    txHash: deployTx?.hash ?? null,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(outDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "SoulboundCredential.abi.json"),
    abi
  );

  console.log(`\nSaved deployment info to deployments/${network.name}.json`);
  console.log("Saved ABI to deployments/SoulboundCredential.abi.json");
  console.log(
    "\nNext step: copy the address + ABI into frontend/src/config/contract.ts"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
