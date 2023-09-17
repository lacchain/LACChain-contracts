import { ethers, lacchain } from "hardhat";
import { DIDRegistryGM } from "../../typechain-types";

const [owner] = lacchain.getSigners();
export async function deployDidRegistry(
  keyRotationTime = 3600
): Promise<string> {
  const Artifact = await ethers.getContractFactory(artifactName, owner);
  const instance = await lacchain.deployContract(
    Artifact,
    keyRotationTime,
    lacchain.baseRelayAddress
  );

  // setting anyways
  didRegistryInstance = Artifact.attach(instance.address);

  return instance.address;
}

const artifactName = "DIDRegistryGM";
let didRegistryInstance: DIDRegistryGM;
