import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

describe("RootOfTrust", function () {
  const artifactName = "RootOfTrust";
  const [owner, rootManager, member1, member2] = lacchain.getSigners();
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

    it("Should add a member at a level higher than one when depth > 0", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 2; // max depth
      const contractAddress = await deployRootOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      // at level 1, rootManager (gId = 1) adds member 1 (gId = 2)
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      await contract.addMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);

      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);

      await expect(result)
        .to.emit(contract, "PkAdded")
        .withArgs(
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );

      const trusted = await contract.trustedList(2, 3);
      expect(trusted.iat).to.be.greaterThan(0);
      expect(trusted.exp).to.be.greaterThanOrEqual(trusted.iat);
    });

    it("Should fail if depth is exceeded", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 1; // max depth
      const contractAddress = await deployRootOfTrust(
        // on deployment, root manager is automatically assigned as depth 0 (level 0)
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      // at level 1, rootManager (gId = 1) adds member 1 (gId = 2)
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      await contract.addMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);

      // at level 2, member1 (gId = 2) adds member 2 (gId = 3) --> must fails since depth is 1
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      const trusted = await contract.trustedList(2, 3);
      expect(trusted.exp).to.be.eq(0);
    });

    it("Should fail on adding a member if that member is already added and is still a valid member", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 1; // max depth
      const contractAddress = await deployRootOfTrust(
        // on deployment, root manager is automatically assigned as depth 0 (level 0)
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      // at level 1, rootManager (gId = 1) adds member 1 (gId = 2)
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      await contract.addMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);
      await expect(
        contract.callStatic.addMemberTl(memberAddress, memberDid, 86400 * 365)
      ).to.be.revertedWith("MAA");
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
