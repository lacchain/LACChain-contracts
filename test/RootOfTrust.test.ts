import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { getAddressFromDid } from "./util";

const artifactName = "RootOfTrust";
describe(artifactName, function () {
  const [owner, rootManager, member1, member2, member3] = lacchain.getSigners();
  const depth = 3;
  const did =
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";

  async function deployRootOfTrust(
    depth: number,
    did: string,
    rootManagerAddress: string,
    revokeMode = 0,
    isRootMaintainer = false, // means only owner maintains "depth" and "reovocation mode"
    didRegistryAddress = "0xce24fF4fC5339Ff18836c82B11Bcefd6840075Fc",
    delegateType = keccak256(toUtf8Bytes("DefaultDelegateType"))
  ): Promise<string> {
    const Artifact = await ethers.getContractFactory(artifactName, owner);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress,
      depth,
      did,
      rootManagerAddress, // root account manager
      revokeMode,
      isRootMaintainer,
      didRegistryAddress,
      delegateType
    );
    return instance.address;
  }

  describe("Deployment", () => {
    it("Should set right values on artifact deployment", async () => {
      const rootManagerAddress = rootManager.address;
      const contractAddress = await deployRootOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(artifactName, owner);
      const contract = Artifact.attach(contractAddress);
      expect(await contract.depth()).to.equal(3);
      const t = await contract.group(rootManagerAddress);
      const didAddress = getAddressFromDid(did);
      expect(t.didAddress.substring(2).toLowerCase()).to.equal(didAddress);
    });
  });
});
