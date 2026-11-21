import fs from "fs";
import path from "path";
import { network } from "hardhat";

async function main() {
  const { ethers, networkName } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying ThesisChain contracts to [${networkName}] with account: ${deployer.address}`);

  // 1. Deploy ThesisCredits (ERC-20 + Faucet)
  const ThesisCredits = await ethers.getContractFactory("ThesisCredits");
  const tcr = await ThesisCredits.deploy();
  await tcr.waitForDeployment();
  const tcrAddress = await tcr.getAddress();
  console.log(`ThesisCredits (TCR) deployed to: ${tcrAddress}`);

  // 2. Deploy ThesisPlatform (Soulbound ERC-721 + Marketplace)
  const ThesisPlatform = await ethers.getContractFactory("ThesisPlatform");
  const platform = await ThesisPlatform.deploy(tcrAddress);
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log(`ThesisPlatform deployed to:      ${platformAddress}`);

  // 3. Export ABIs and Addresses for Frontend
  const tcrArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/ThesisCredits.sol/ThesisCredits.json", "utf8")
  );
  const platformArtifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/ThesisPlatform.sol/ThesisPlatform.json", "utf8")
  );

  const exportData = {
    network: networkName,
    adminAddress: deployer.address,
    contracts: {
      ThesisCredits: {
        address: tcrAddress,
        abi: tcrArtifact.abi,
      },
      ThesisPlatform: {
        address: platformAddress,
        abi: platformArtifact.abi,
      },
    },
  };

  const outputPath = path.resolve("./deployedContracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`Contract metadata exported to:   ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});