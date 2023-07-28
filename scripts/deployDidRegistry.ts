import { lacchain, ethers } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "DIDRegistryGM";
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const instance = await lacchain.deployContract(
    Artifact,
    3600,
    lacchain.baseRelayAddress
  );
  console.log(
    `${artifactName} instance successfully deployed at address: ` +
      instance.address
  );
  // const contract = Artifact.attach(instance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
