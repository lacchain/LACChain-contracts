import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

describe("RootOfTrust", function () {
  const artifactName = "RootOfTrust";
  const [owner, rootManager, member1] = lacchain.getSigners();
  const depth = 3;
  const did =
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";

  async function deployRootOfTrust(
    depth: number,
    did: string,
    rootManagerAddress: string
  ): Promise<string> {
    const Artifact = await ethers.getContractFactory(artifactName, owner);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress,
      depth,
      did,
      rootManagerAddress // root account manager
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

    it("Should set right values on adding a new member", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const contractAddress = await deployRootOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      const result = await contract.addMemberTl(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      const t = await contract.group(memberAddress);
      const didAddress = getAddressFromDid(memberDid);
      expect(t.didAddress.substring(2).toLowerCase()).to.equal(didAddress);

      await expect(result)
        .to.emit(contract, "TlConfigChange")
        .withArgs(memberAddress, memberDid, anyValue);

      await expect(result)
        .to.emit(contract, "PkAdded")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue,
          anyValue
        );

      const trusted = await contract.trustedList(1, 2);
      expect(trusted.exp).to.be.greaterThanOrEqual(trusted.iat);
    });
  });

  const sleep = (seconds: number) =>
    new Promise((resolve, reject) => {
      setTimeout(() => resolve(true), seconds * 1000);
    });

  const getAddressFromDid = (did: string): string => {
    const codedDid = ethers.utils.defaultAbiCoder.encode(["string"], [did]);
    const hash = keccak256(codedDid);
    return hash.substring(26);
  };
});
