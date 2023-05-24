import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { getAddressFromDid, sleep } from "../util";
import { deployDidRegistry } from "../identity/Identity.test";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { IPublicDirectory, PublicDirectory } from "../../typechain-types";
import { any } from "hardhat/internal/core/params/argumentTypes";

const artifactName = "PublicDirectory";
let publicDirectoryInstance: PublicDirectory;
const [owner, cotAddressExample] = lacchain.getSigners();
const mockCoTAddress = "0xA1130263713dA838E5a348C33606841d8ee273BC";
describe(artifactName, function () {
  async function deployPublicDirectory(): Promise<string> {
    const Artifact = await ethers.getContractFactory(artifactName, owner);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress
    );
    publicDirectoryInstance = Artifact.attach(instance.address);
    return instance.address;
  }

  this.beforeEach(async function () {
    await deployPublicDirectory();
  });

  describe("Public Directory", () => {
    it("Should setright values on contract deployment", async function () {
      expect(await publicDirectoryInstance.owner()).to.equal(owner.address);
    });
    it("Should add a new member data", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name: "Acme",
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
    });
    it("Should update expiration to true and set a valid exp", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      expires = true;
      const delta = 3600 * 24 * 365;
      exp = Math.floor(Date.now() / 1000) + delta;
      memberData = {
        did, // must pass did
        name: "",
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(anyValue, did, anyValue, exp, expires, anyValue, anyValue);
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.name).to.equal(name);
      expect(memberDetails.expires).to.equal(expires);
      expect(memberDetails.exp).to.equal(exp);
    });
    it("Should fail on attempting to update a member who is not registered", async function () {
      try {
        const memberData: IPublicDirectory.SetMemberStruct = {
          did: "fake",
          name: "fake",
          exp: 0,
          expires: false,
          chainOfTrustAddress: ethers.constants.AddressZero,
        };
        await publicDirectoryInstance.updateMemberDetailsByDid(memberData);
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should update member name", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      const newName = "Acme-V1";
      exp = 0;
      memberData = {
        did, // must pass did
        name: newName,
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(anyValue, did, anyValue, exp, expires, anyValue, anyValue);
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.name).to.equal(newName);
    });
    it("Should not set exp if membership does not expire", async function () {
      let expires = false;
      let delta = 3600 * 24 * 365;
      let exp = Math.floor(Date.now() / 1000) + delta; // setting a value expecting to not to be taken since `expires` is false
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
    });
    it("Should not set exp if membership does not expire on update", async function () {
      let expires = true;
      const delta = 3600 * 24 * 365;
      let exp = Math.floor(Date.now() / 1000) + delta;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      expires = false;
      exp = Math.floor(Date.now() / 1000) + delta;
      memberData = {
        did, // must pass did
        name: "",
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      const expirationValueToVerify = 0;
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(
          anyValue,
          did,
          anyValue,
          expirationValueToVerify,
          expires,
          anyValue,
          anyValue
        );
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.expires).to.equal(expires);
      expect(memberDetails.exp).to.equal(expirationValueToVerify);
    });
    it("Should not update a property set empty", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      const newName = ""; // leaving empty so meaning this is not updated
      exp = 0;
      memberData = {
        did, // must pass did
        name: newName,
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(anyValue, did, anyValue, exp, expires, anyValue, anyValue);
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.name).to.equal(name);
    });
    it("Should remove a member", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name: "Acme",
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      const result = publicDirectoryInstance.removeMemberByDid(did);
      expires = true;
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(
          anyValue,
          did,
          anyValue,
          anyValue,
          expires,
          anyValue,
          anyValue
        );
      sleep(2);
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.expires).to.equal(true);
      expect(memberDetails.exp).to.lessThanOrEqual(
        Math.floor(Date.now() / 1000)
      );
      expect(memberDetails.exp).to.greaterThan(0);
    });
    it("Should update member data", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const name = "Acme";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        name,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
      };
      await addMember(memberData);
      const newName = "Acme-V1"; // leaving empty so meaning this is not updated
      exp = 0;
      memberData = {
        did, // must pass did
        name: newName,
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(anyValue, did, anyValue, exp, expires, anyValue, anyValue);
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.name).to.equal(newName);
    });
    it("Should associate a new did to an existing member", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
    });
    it("Should throw on attemting to associate an already associated did", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
      try {
        await createMemberAndAssociateAdditionalDid(did, newDid); // repeating again to make sure i'll fail the second time
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should disassociate a new did to an existing member", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
      const didToDisassociate = newDid;
      const result = await publicDirectoryInstance.disassociateDid(
        did,
        didToDisassociate
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "DidDisassociated")
        .withArgs(didToDisassociate, anyValue, anyValue);
    });
    it("Should throw if did disassociation is made against the only one did", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
      const didToDisassociate = newDid;
      await publicDirectoryInstance.disassociateDid(did, didToDisassociate);
      try {
        await publicDirectoryInstance.disassociateDid(did, didToDisassociate); // repeating again to make sure i'll fail the second time
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should throw if did disassociation is made twice", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
      const newDid2 = "did:lac:0x5eF1480a9BC51DFC28121E18429b50aB2d45E3E1";
      await associateAdditionalDid(newDid, newDid2);
      const didToDisassociate = newDid;
      await publicDirectoryInstance.disassociateDid(did, didToDisassociate);
      try {
        await publicDirectoryInstance.disassociateDid(did, didToDisassociate); // repeating again to make sure i'll fail the second time
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should throw if did disassociation is made against the only one did", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const newDid = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await createMemberAndAssociateAdditionalDid(did, newDid);
      const didToDisassociate = newDid;
      const result = await publicDirectoryInstance.disassociateDid(
        did,
        didToDisassociate
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "DidDisassociated")
        .withArgs(didToDisassociate, anyValue, anyValue);
    });
    it("Should add a chain of trust address to an existing member", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      await addMockMember(did);
      const result = await publicDirectoryInstance.associateCoTAddressByDid(
        mockCoTAddress,
        did
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "CoTChange")
        .withArgs(mockCoTAddress, anyValue, true, anyValue);
    });
    it("Should throw if adding a Chain of Trust address twice to an existing member", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      await addMockMember(did);
      await publicDirectoryInstance.associateCoTAddressByDid(
        mockCoTAddress,
        did
      );
      try {
        await publicDirectoryInstance.associateCoTAddressByDid(
          mockCoTAddress,
          did
        ); // repeating again to make sure i'll fail the second time
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should disassociate a chain of trust address from an existing member", async function () {
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      await addMockMember(did);
      await publicDirectoryInstance.associateCoTAddressByDid(
        mockCoTAddress,
        did
      );
      const result = await publicDirectoryInstance.disassociateCoTAddressByDid(
        mockCoTAddress,
        did
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "CoTChange")
        .withArgs(mockCoTAddress, anyValue, false, anyValue);
    });
  });
});

async function addMember(member: IPublicDirectory.SetMemberStruct) {
  const { did, exp, expires } = member;
  const result = await publicDirectoryInstance.addMember(member);
  await sleep(2);
  let expValueToVerify = expires ? exp : 0;
  await expect(result)
    .to.emit(publicDirectoryInstance, "MemberChanged")
    .withArgs(
      anyValue,
      did,
      anyValue,
      expValueToVerify,
      expires,
      anyValue,
      anyValue
    );
}

async function addMockMember(did: string) {
  let expires = false;
  let exp = 0;
  let memberData: IPublicDirectory.SetMemberStruct = {
    did,
    name: "Acme",
    exp,
    expires,
    chainOfTrustAddress: cotAddressExample.address,
  };
  const result = await publicDirectoryInstance.addMember(memberData);
  await sleep(2);
  let expValueToVerify = expires ? exp : 0;
  await expect(result)
    .to.emit(publicDirectoryInstance, "MemberChanged")
    .withArgs(
      anyValue,
      did,
      anyValue,
      expValueToVerify,
      expires,
      anyValue,
      anyValue
    );
}

async function createMemberAndAssociateAdditionalDid(
  did: string,
  newDid: string
) {
  let expires = false;
  let exp = 0;
  const name = "Acme";
  let memberData: IPublicDirectory.SetMemberStruct = {
    did,
    name,
    exp,
    expires,
    chainOfTrustAddress: cotAddressExample.address,
  };
  await addMember(memberData);
  await associateAdditionalDid(did, newDid);
}

async function associateAdditionalDid(did: string, newDid: string) {
  const memberId = (await publicDirectoryInstance.getMemberDetails(did))
    .memberId;
  const result = await publicDirectoryInstance.associateDid(did, newDid);
  await expect(result)
    .to.emit(publicDirectoryInstance, "DidAssociated")
    .withArgs(newDid, memberId, anyValue);
}
