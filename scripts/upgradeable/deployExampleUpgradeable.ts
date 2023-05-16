import { ethers, lacchain, upgrades } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "ExampleUpgradeable";
  console.log("signing with", accounts[0].address);
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  await upgrades.deployProxy(Artifact, [4, lacchain.baseRelayAddress], {
    kind: "uups",
  });
  console.log("update addresses ..."); // TODO: address this issue
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
