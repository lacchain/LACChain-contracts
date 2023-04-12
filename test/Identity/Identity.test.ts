import { ethers, lacchain } from "hardhat";

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
  return instance.address;
}

const artifactName = "DIDRegistry";
describe(artifactName, function () {
  describe("Deployment", () => {});
});
