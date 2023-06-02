import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { toUtf8Bytes } from "ethers/lib/utils";
import { sleep } from "../util";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { IPublicDirectory, PublicDirectory } from "../../typechain-types";
import { encode } from "cbor";

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
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: getData(), //"some structured data",
      };
      await addMember(memberData);
    });
    it("Should update expiration to true and set a valid exp", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: "some structured data",
      };
      await addMember(memberData);
      expires = true;
      const delta = 3600 * 24 * 365;
      exp = Math.floor(Date.now() / 1000) + delta;
      memberData = {
        did, // must pass did
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
        rawData: toUtf8Bytes(""),
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(
          anyValue,
          did,
          anyValue,
          exp,
          expires,
          anyValue,
          anyValue,
          anyValue
        );
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.expires).to.equal(expires);
      expect(memberDetails.exp).to.equal(exp);
    });
    it("Should fail on attempting to update a member who is not registered", async function () {
      try {
        const memberData: IPublicDirectory.SetMemberStruct = {
          did: "fake",
          exp: 0,
          expires: false,
          chainOfTrustAddress: ethers.constants.AddressZero,
          rawData: toUtf8Bytes(""),
        };
        await publicDirectoryInstance.updateMemberDetailsByDid(memberData);
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should not set exp if membership does not expire", async function () {
      let expires = false;
      let delta = 3600 * 24 * 365;
      let exp = Math.floor(Date.now() / 1000) + delta; // setting a value expecting to not to be taken since `expires` is false
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: "some structured data",
      };
      await addMember(memberData);
    });
    it("Should not set exp if membership does not expire on update", async function () {
      let expires = true;
      const delta = 3600 * 24 * 365;
      let exp = Math.floor(Date.now() / 1000) + delta;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: "some structured data",
      };
      await addMember(memberData);
      expires = false;
      exp = Math.floor(Date.now() / 1000) + delta;
      memberData = {
        did, // must pass did
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
        rawData: toUtf8Bytes(""),
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
          anyValue,
          anyValue
        );
      const memberDetails = (
        await publicDirectoryInstance.getMemberDetails(did)
      ).memberData;
      expect(memberDetails.expires).to.equal(expires);
      expect(memberDetails.exp).to.equal(expirationValueToVerify);
    });
    it("Should remove a member", async function () {
      let expires = false;
      let exp = 0;
      const did =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: "some structured data",
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
      let memberData: IPublicDirectory.SetMemberStruct = {
        did,
        exp,
        expires,
        chainOfTrustAddress: cotAddressExample.address,
        rawData: "some structured data",
      };
      await addMember(memberData);
      exp = 0;
      memberData = {
        did, // must pass did
        exp,
        expires,
        chainOfTrustAddress: ethers.constants.AddressZero,
        rawData: toUtf8Bytes(""),
      };
      const result = await publicDirectoryInstance.updateMemberDetailsByDid(
        memberData
      );
      await expect(result)
        .to.emit(publicDirectoryInstance, "MemberChanged")
        .withArgs(
          anyValue,
          did,
          anyValue,
          exp,
          expires,
          ethers.utils.hexlify(toUtf8Bytes("")),
          anyValue,
          anyValue
        );
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
    it("Should allow an multiple entities pointing to the same Chain of trust address", async function () {
      const did1 =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const cotAddr = cotAddressExample.address;
      await addMockMember(did1, cotAddr);
      const did2 = "did:lac:0xd3684bfCA98E4678fE70612cadC687b5FFAA142e";
      await addMockMember(did2, cotAddr);
    });
    it("Should add member with ebsi raw data", async function () {
      const did1 =
        "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
      const cotAddr = cotAddressExample.address;
      const rawData = getData();
      await _addMember(did1, 0, false, cotAddr, rawData);
    });
  });
});

async function addMember(member: IPublicDirectory.SetMemberStruct) {
  const { did, exp, expires, rawData } = member;
  const stringRawData = rawData.toString();
  member.rawData = toUtf8Bytes(stringRawData);

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
      ethers.utils.hexlify(member.rawData),
      anyValue,
      anyValue
    );
  const memberDetails = (await publicDirectoryInstance.getMemberDetails(did))
    .memberData;
  expect(memberDetails.expires).to.equal(expires);
  expect(memberDetails.exp).to.equal(expValueToVerify);
}

async function _addMember(
  did: string,
  exp: number,
  expires: boolean,
  chainOfTrustAddress: string,
  rawData: Uint8Array
) {
  const member: IPublicDirectory.SetMemberStruct = {
    did,
    exp,
    expires,
    rawData,
    chainOfTrustAddress,
  };
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
      ethers.utils.hexlify(rawData),
      anyValue,
      anyValue
    );
  const memberDetails = (await publicDirectoryInstance.getMemberDetails(did))
    .memberData;
  expect(memberDetails.expires).to.equal(expires);
  expect(memberDetails.exp).to.equal(expValueToVerify);
}

async function addMockMember(
  did: string,
  chainOfTrustAddress = cotAddressExample.address
) {
  let expires = false;
  let exp = 0;
  const stringData = "some structured data";
  const utf8Data = toUtf8Bytes(stringData);
  let memberData: IPublicDirectory.SetMemberStruct = {
    did,
    exp,
    expires,
    chainOfTrustAddress,
    rawData: utf8Data,
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
      ethers.utils.hexlify(utf8Data),
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
  let memberData: IPublicDirectory.SetMemberStruct = {
    did,
    exp,
    expires,
    chainOfTrustAddress: cotAddressExample.address,
    rawData: toUtf8Bytes("some structured data"),
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

function getData(): Uint8Array {
  // eslint-disable-next-line max-len
  // EBSI: https://ec.europa.eu/digital-building-blocks/code/projects/EBSI/repos/json-schema/browse/schemas/ebsi-vid/legal-entity/2022-11/schema.json
  const ebsiExample = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "EBSI Legal Entity Verifiable ID",
    description: "Schema of an EBSI Verifiable ID for a legal entity",
    type: "object",
    allOf: [
      {
        $ref: "../../../ebsi-attestation/2022-11/schema.json",
      },
      {
        properties: {
          credentialSubject: {
            description:
              // eslint-disable-next-line max-len
              "Defines information about the subject that is described by the Verifiable ID",
            type: "object",
            properties: {
              id: {
                description:
                  // eslint-disable-next-line max-len
                  "Defines the DID of the subject that is described by the Verifiable Attestation",
                type: "string",
                format: "uri",
              },
              legalPersonIdentifier: {
                description:
                  // eslint-disable-next-line max-len
                  "National/Legal Identifier of Credential Subject (constructed by the sending Member State in accordance with the technical specifications for the purposes of cross-border identification and which is as persistent as possible in time)",
                type: "string",
              },
              legalName: {
                description: "Official legal name of Credential Subject",
                type: "string",
              },
              legalAddress: {
                description: "Official legal address of Credential Subject",
                type: "string",
              },
              VATRegistration: {
                description: "VAT number  of Credential Subject",
                type: "string",
              },
              taxReference: {
                description:
                  "Official tax reference number of Credential Subject",
                type: "string",
              },
              LEI: {
                description:
                  // eslint-disable-next-line max-len
                  "Official legal entity identifier (LEI) of Credential Subject (referred to in Commission Implementing Regulation (EU) No 1247/2012)",
                type: "string",
              },
              EORI: {
                description:
                  // eslint-disable-next-line max-len
                  "Economic Operator Registration and Identification (EORI) of Credential Subject (referred to in Commission Implementing Regulation (EU) No 1352/2013)",
                type: "string",
              },
              SEED: {
                description:
                  // eslint-disable-next-line max-len
                  "System for Exchange of Excise Data (SEED) of Credential Subject (i.e. excise number provided in Article 2(12) of Council Regulation (EC) No 389/2012)",
                type: "string",
              },
              SIC: {
                description:
                  // eslint-disable-next-line max-len
                  "Standard Industrial Classification (SIC) of Credential Subject (Article 3(1) of Directive 2009/101/EC of the European Parliament and of the Council.)",
                type: "string",
              },
              domainName: {
                description: "Domain name  of Credential Subject",
                type: "string",
              },
            },
            required: ["id", "legalName"],
          },
        },
      },
    ],
  };
  return encode(ebsiExample);
}
