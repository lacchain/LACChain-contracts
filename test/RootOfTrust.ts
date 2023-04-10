import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

describe("RootOfTrust", function () {
  const artifactName = "RootOfTrust";
  const [owner, rootManager, member1, member2, member3] = lacchain.getSigners();
  const depth = 3;
  const did =
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";

  async function deployRootOfTrust(
    depth: number,
    did: string,
    rootManagerAddress: string,
    revokeMode = 0
  ): Promise<string> {
    const Artifact = await ethers.getContractFactory(artifactName, owner);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress,
      depth,
      did,
      rootManagerAddress, // root account manager
      revokeMode
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
      const result = await contract.addOrUpdateMemberTl(
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
        .to.emit(contract, "PkChanged")
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
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "PkChanged")
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
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3) --> must fails since depth is 1
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      const trusted = await contract.trustedList(2, 3);
      expect(trusted.exp).to.be.eq(0);
    });
    it("Should allow updating a member if that member is already added by me", async () => {
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
      let result = await contract.addOrUpdateMemberTl(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue,
          anyValue
        );
      // Updating ...
      result = await contract.addOrUpdateMemberTl(
        memberAddress,
        memberDid,
        86400 * 20
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue,
          anyValue
        );
    });
    it("Should throw if a no longer trusted member tries to add a member", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 2; // max depth
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
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 2); // validity for just 2 seconds
      await sleep(3);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await expect(result).not.to.emit(contract, "PkChanged");
    });
    it("Should add a member in my Group (TL) if it already exists (doesn't matter who added it) but is no longer valid (expired)", async () => {
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
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);
      // at level 1, rootManager (gId = 1) adds member 2 (gId = 3)
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      await contract.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 3 (gId = 4) .. added for just 2 seconds
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member3Address = member3.address;
      const member3Did =
        "did:web:lacchain.id:0vBrrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb4C";
      let result = await contract1.addOrUpdateMemberTl(
        member3Address,
        member3Did,
        1 // for just 1 second
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          memberAddress,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );
      // at level 2, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      result = await contract2.addOrUpdateMemberTl(
        member3Address,
        member3Did,
        84600 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          member2Address,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );
      const member3Group = await contract2.group(member3Address);
      const t1 = await contract2.trustedBy(member3Group.gId);
      const member2Group = await contract2.group(member2Address);
      expect(t1).to.equal(member2Group.gId);
    });
    it("Should revoke a member in my Group (TL)", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 1; // max depth
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
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);

      const result = await contract.revokeMember(memberAddress, memberDid);
      await sleep(8);
      await expect(result)
        .to.emit(contract, "PkRevoked")
        .withArgs(
          rootManagerAddress,
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue
        );
    });

    it("Should add a member in my Group (TL) if it already exists (doesn't matter who added it) but some of its parents broke the required chain of trust", async () => {
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
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);
      // at level 1, rootManager (gId = 1) adds member 2 (gId = 3)
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      await contract.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 3 (gId = 4) .. added for just 2 seconds
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member3Address = member3.address;
      const member3Did =
        "did:web:lacchain.id:0vBrrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb4C";
      let result = await contract1.addOrUpdateMemberTl(
        member3Address,
        member3Did,
        86400 * 365
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          memberAddress,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );
      // at level 1, rootManager (gId = 1) revokes member 1
      result = await contract.revokeMember(memberAddress, memberDid);
      await sleep(4);
      await expect(result)
        .to.emit(contract, "PkRevoked")
        .withArgs(
          rootManagerAddress,
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue
        );
      // at level 2, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      result = await contract2.addOrUpdateMemberTl(
        member3Address,
        member3Did,
        84600 * 365
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          member2Address,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );
      const member3Group = await contract2.group(member3Address);
      const t1 = await contract2.trustedBy(member3Group.gId);
      const member2Group = await contract2.group(member2Address);
      expect(t1).to.equal(member2Group.gId);
    });
    it("Should allow a parent and the root parent to revoke an entity in a child group if configured that way", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 2; // max depth
      const revokeMode = 1; // root and parent can revoke
      const contractAddress = await deployRootOfTrust(
        depth,
        did,
        rootManagerAddress,
        revokeMode
      );
      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      // at level 1, rootManager (gId = 1) adds member 1 (gId = 2)
      const contract = Artifact.attach(contractAddress);
      const memberAddress = member1.address;
      await contract.addOrUpdateMemberTl(memberAddress, memberDid, 86400 * 365);
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      let result = await contract1.addOrUpdateMemberTl(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "PkChanged")
        .withArgs(
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );

      // must fail if root manager revokes a member who does not exist
      await expect(
        contract.callStatic.revokeMemberByRoot(member3.address, "abc")
      ).to.be.revertedWith("MNA");

      await expect(
        contract1.callStatic.revokeMemberByRoot(member2Address, member2Did)
      ).to.be.revertedWith("OR");

      // root manager revokes member 2
      result = await contract.revokeMemberByRoot(member2Address, member2Did);
      await sleep(4);
      await expect(result)
        .to.emit(contract, "PkRevoked")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue
        );
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
