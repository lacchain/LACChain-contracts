import { ethers, lacchain } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "CredentialRegistry";
  const defaultDidRegistry = "0xabD12121728099199E307faDbc12E6341fc2eE22";
  const defaultDelegateType =
    "0x0be0ff6b6d81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f4"; // bytes32
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const instance = await lacchain.deployContract(
    Artifact,
    lacchain.baseRelayAddress,
    defaultDidRegistry,
    defaultDelegateType
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
