import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { DIDRegistryGM } from "../../typechain-types";

const [owner, account1, account2] = lacchain.getSigners();
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
describe(artifactName, function () {
  this.beforeEach(async function () {
    await deployDidRegistry();
  });
  describe("Did Registry tests", () => {
    it("Should change controller", async function () {
      const Artifact = await ethers.getContractFactory(artifactName, account1);
      const didRegFromAcct1: DIDRegistryGM = Artifact.attach(
        didRegistryInstance.address
      );
      const tx0 = await didRegFromAcct1.addController(
        account1.address,
        account2.address
      );
      const tx = await didRegFromAcct1.changeController(
        account1.address,
        account2.address
      );
      await tx.wait();
      expect(
        await didRegistryInstance.identityController(account1.address)
      ).to.equal(account2.address);
    });
  });
});
