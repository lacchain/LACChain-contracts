import { ethers, lacchain, upgrades } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "PublicDirectoryGMUpgradeable";
  const deployer = accounts[0];
  console.log("signing with", deployer.address);
  const Artifact = await ethers.getContractFactory(artifactName, deployer);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  await upgrades.deployProxy(Artifact, [lacchain.baseRelayAddress], {
    kind: "uups",
  });
  console.log("update addresses ..."); // TODO: address this issue
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
