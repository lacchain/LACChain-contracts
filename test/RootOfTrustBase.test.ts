import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { getAddressFromDid, sleep } from "./util";

const artifactName = "RootOfTrustBase";
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
    isRootMaintainer = false // means only owner maintains "depth" and "reovocation mode"
  ): Promise<string> {
    const Artifact = await ethers.getContractFactory(artifactName, owner);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress,
      depth,
      did,
      rootManagerAddress, // root account manager
      revokeMode,
      isRootMaintainer
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
      const result = await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      const t = await contract.group(memberAddress);
      const didAddress = getAddressFromDid(memberDid);
      expect(t.didAddress.substring(2).toLowerCase()).to.equal(didAddress);
      await expect(result)
        .to.emit(contract, "MemberConfigChanged")
        .withArgs(memberAddress, memberDid, anyValue);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateGroupMember(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3) --> must fails since depth is 1
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateGroupMember(
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
      let result = await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue,
          anyValue
        );
      // Updating ...
      result = await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 20
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
      await contract.addOrUpdateGroupMember(memberAddress, memberDid, 2); // validity for just 2 seconds
      await sleep(3);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const result = await contract1.addOrUpdateGroupMember(
        member2Address,
        member2Did,
        86400 * 365
      );
      await expect(result).not.to.emit(contract, "GroupMemberChanged");
    });
    // Note: intermitently failing when running together with multiple tests
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      // at level 1, rootManager (gId = 1) adds member 2 (gId = 3)
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      await contract.addOrUpdateGroupMember(
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
      let result = await contract1.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        1 // for just 1 second
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          memberAddress,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );

      let counter = 0;
      const maxCycles = 10;
      while (true) {
        // waiting for expiration to take effect
        const exp = (await contract.trustedList(2, 4)).exp;
        const currentTime = Math.floor(Date.now() / 1000);
        if (exp.lte(currentTime)) {
          break;
        }
        counter++;

        if (counter > maxCycles) {
          console.log("Waiting cylcles were exceeded");
          break;
        }
        await sleep(1);
      }
      // at level 2, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      result = await contract2.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        84600 * 365
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
    // Note: intermitently failing when running together with multiple tests
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      const result = await contract.revokeMember(memberAddress, memberDid);
      await sleep(8);
      await expect(result)
        .to.emit(contract, "GroupMemberRevoked")
        .withArgs(
          rootManagerAddress,
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue
        );
    });
    // Note: intermitently failing when running together with multiple tests
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      // at level 1, rootManager (gId = 1) adds member 2 (gId = 3)
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      await contract.addOrUpdateGroupMember(
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
      let result = await contract1.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        86400 * 365
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
        .to.emit(contract, "GroupMemberRevoked")
        .withArgs(
          rootManagerAddress,
          rootManagerAddress,
          memberAddress,
          memberDid,
          anyValue,
          anyValue
        );

      let counter = 0;
      const maxCycles = 10;
      while (true) {
        // waiting for expiration to take effect
        const exp = (await contract.trustedList(1, 2)).exp;
        const currentTime = Math.floor(Date.now() / 1000);
        if (exp.lte(currentTime)) {
          break;
        }
        counter++;
        console.log("cycling!");

        if (counter > maxCycles) {
          console.log("Waiting cylcles were exceeded");
          break;
        }
        await sleep(1);
      }

      // at level 2, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      result = await contract2.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        84600 * 365
      );
      await sleep(4);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      let result = await contract1.addOrUpdateGroupMember(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );
      // fails since member3 was not added
      result = await contract.revokeMemberByRoot(member3.address, "abc");
      await sleep(3);
      await expect(result).not.to.emit(contract, "GroupMemberRevoked");
      // fails since sender is not the root manager
      result = await contract1.revokeMemberByRoot(member2Address, member2Did);
      await sleep(3);
      await expect(result).not.to.emit(contract, "GroupMemberRevoked");
      // root manager revokes member 2
      result = await contract.revokeMemberByRoot(member2Address, member2Did);
      await sleep(3);
      await expect(result)
        .to.emit(contract, "GroupMemberRevoked")
        .withArgs(
          rootManagerAddress,
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue
        );
    });
    it("Should allow any parent to revoke an entity in a child group if configured that way", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 3; // max depth
      const revokeMode = 2; // root and parent can revoke
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      let result = await contract1.addOrUpdateGroupMember(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );

      // at level 3, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      const member3Address = member3.address;
      const member3Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      result = await contract2.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          member2Address,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );
      // now member1 revokes member3
      result = await contract1.revokeMemberByAnyAncestor(
        member3Address,
        member3Did
      );
      await sleep(3);
      await expect(result)
        .to.emit(contract, "GroupMemberRevoked")
        .withArgs(
          memberAddress,
          member2Address,
          member3Address,
          member3Did,
          anyValue,
          anyValue
        );
    });
    it("Should allow updating revoke config mode and depth to root entity as maintainer", async () => {
      const rootManagerAddress = rootManager.address;
      const depth = 3; // max depth
      const revokeMode = 2; // root and parent can revoke
      const isRootMaintainer = false;
      const contractAddress = await deployRootOfTrust(
        depth,
        did,
        rootManagerAddress,
        revokeMode,
        isRootMaintainer
      );
      const A0 = await ethers.getContractFactory(artifactName, owner);
      const c0 = A0.attach(contractAddress);

      const Artifact = await ethers.getContractFactory(
        artifactName,
        rootManager
      );
      const contract = Artifact.attach(contractAddress);

      let result = await contract.updateDepth(1);
      expect(result).not.to.emit(contract, "DepthChanged");
      result = await contract.updateRevokeMode(0);
      expect(result).not.to.emit(contract, "RevokeModeChanged");

      // owner updates maintainer mode so root can update now
      result = await c0.updateMaintainerMode(true);
      expect(result)
        .to.emit(c0, "MaintainerModeChanged")
        .withArgs(true, anyValue);

      // since "isRootMaintainer" is true then rootManager can update "depth" and "revocationMode" properties
      result = await contract.updateDepth(1);
      expect(result).to.emit(contract, "DepthChanged").withArgs(3, 1, anyValue);
      result = await contract.updateRevokeMode(0);
      expect(result)
        .to.emit(contract, "RevokeModeChanged")
        .withArgs(2, 0, anyValue);
    });
    it("Should allow a member to update their did", async () => {
      const memberDid =
        "did:web:lacchain.id:5DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5H";
      const rootManagerAddress = rootManager.address;
      const depth = 3; // max depth
      const revokeMode = 2; // root and parent can revoke
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
      await contract.addOrUpdateGroupMember(
        memberAddress,
        memberDid,
        86400 * 365
      );
      await sleep(2);
      // at level 2, member1 (gId = 2) adds member 2 (gId = 3)
      const Artifact1 = await ethers.getContractFactory(artifactName, member1);
      const contract1 = Artifact1.attach(contractAddress);
      const member2Address = member2.address;
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      let result = await contract1.addOrUpdateGroupMember(
        member2Address,
        member2Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          memberAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );

      // at level 3, member2 (gId = 3) adds member 3 (gId = 4)
      const Artifact2 = await ethers.getContractFactory(artifactName, member2);
      const contract2 = Artifact2.attach(contractAddress);
      const member3Address = member3.address;
      const member3Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      result = await contract2.addOrUpdateGroupMember(
        member3Address,
        member3Did,
        86400 * 365
      );
      await sleep(2);
      await expect(result)
        .to.emit(contract, "GroupMemberChanged")
        .withArgs(
          member2Address,
          member3Address,
          member3Did,
          anyValue,
          anyValue,
          anyValue
        );

      const Artifact3 = await ethers.getContractFactory(artifactName, member3);
      const contract3 = Artifact3.attach(contractAddress);
      const newMember3Did =
        "did:web:lacchain.id:0YbXNNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZXYvnP2Z";

      result = await contract3.updateDid(newMember3Did);
      await sleep(2);
      await expect(result)
        .to.emit(contract3, "DidChanged")
        .withArgs(member3.address, newMember3Did, anyValue);

      // revoking
      result = await contract1.revokeMemberByAnyAncestor(
        member3.address,
        newMember3Did
      );
      await sleep(2);
      await expect(result).to.emit(contract1, "GroupMemberRevoked");

      const new2Member3Did =
        "did:web:lacchain.id:1NbXNNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZXYvnP2Z";

      result = await contract3.updateDid(new2Member3Did);
      await sleep(2);
      await expect(result).not.to.emit(contract3, "DidChanged");
    });
  });
});
