import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, lacchain, network } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { DIDRegistry } from "../../typechain-types";
import { Wallet } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";
import { arrayify } from "@ethersproject/bytes";

const artifactName = "VerificationRegistry";
const [deployer, entity1, entity2, entity3] = lacchain.getSigners();
let verificationRegistryAddress: string;
let defaultDidRegistryInstance: DIDRegistry;
const genericMessage = "some message";
const didRegistryArtifactName = "DIDRegistry";
const defaultDelegateType =
  "0x0be0ff6b6d81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f4";
const EIP712ContractName = "VerificationRegistry";
describe(artifactName, function () {
  async function deployDidRegistry(
    keyRotationTime = 3600
  ): Promise<DIDRegistry> {
    const Artifact = await ethers.getContractFactory(
      didRegistryArtifactName,
      deployer
    );
    const instance = await lacchain.deployContract(
      Artifact,
      keyRotationTime,
      lacchain.baseRelayAddress
    );
    return Artifact.attach(instance.address);
  }

  async function deployVerificationRegistry(
    _defaultDelegateType = defaultDelegateType
  ) {
    defaultDidRegistryInstance = await deployDidRegistry();
    const Artifact = await ethers.getContractFactory(artifactName, deployer);
    const instance = await lacchain.deployContract(
      Artifact,
      lacchain.baseRelayAddress,
      defaultDidRegistryInstance.address,
      _defaultDelegateType
    );

    verificationRegistryAddress = instance.address;
  }

  this.beforeEach(async function () {
    await deployVerificationRegistry();
  });

  describe("Verification Registry", () => {
    it("Should setright values on contract deployment", async function () {
      const Artifact = await ethers.getContractFactory(artifactName, entity1);
      const ci = Artifact.attach(verificationRegistryAddress);
      expect(await ci.defaultDelegateType()).to.equal(defaultDelegateType);
      expect(await ci.defaultDidRegistry()).to.equal(
        defaultDidRegistryInstance.address
      );
    });
    it("Should set right values on artifact deployment", async () => {
      await issue(verificationRegistryAddress);
    });
    it("Should throw on setting an invalid expiration time", async () => {
      const message = "some message digest";
      const digest = keccak256(toUtf8Bytes(message));
      const delta = -3600 * 24 * 365;
      const exp = Math.floor(Date.now() / 1000) + delta;
      const Artifact = await ethers.getContractFactory(artifactName, entity1);
      const verificationRegistry = Artifact.attach(verificationRegistryAddress);
      try {
        await verificationRegistry.issue(digest, exp, entity1.address);
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should throw on issuing an already issued digest by the same entity", async () => {
      const message = "some message digest";
      const digest = keccak256(toUtf8Bytes(message));
      const delta = 3600 * 24 * 365;
      const exp = Math.floor(Date.now() / 1000) + delta;
      const Artifact = await ethers.getContractFactory(artifactName, entity1);
      const verificationRegistry = Artifact.attach(verificationRegistryAddress);
      await verificationRegistry.issue(digest, exp, entity1.address);
      try {
        await verificationRegistry.issue(
          digest,
          exp,
          entity1.address // assuming entity2.address is the main entity
        );
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Shoud throw on attempting to send a transaction with an unauthorized controller", async () => {
      const message = "some message digest";
      const digest = keccak256(toUtf8Bytes(message));
      const delta = 3600 * 24 * 365;
      const exp = Math.floor(Date.now() / 1000) + delta;
      const Artifact = await ethers.getContractFactory(artifactName, entity1); // entity1 is the address of the sender account
      const verificationRegistry = Artifact.attach(verificationRegistryAddress);
      try {
        await verificationRegistry.issue(
          digest,
          exp,
          entity2.address // assuming entity2.address is the main entity
        );
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should return expected values on revoking a previously issued digest", async () => {
      const message = "some message";
      const delta = 3600 * 24 * 365;
      await issue(verificationRegistryAddress, "some message", delta, entity1);
      await revoke(verificationRegistryAddress, message, entity1);
    });
    it("Should set onHold to true on setting a digest in onHold", async () => {
      await issue();
      await toggletOnHold(true);
    });
    it("Should pass on performing onHold on a non issued digest", async () => {
      await toggletOnHold(true);
    });
    it("Should transition from true to false when calling Onhold", async () => {
      await toggletOnHold(true);
      await toggletOnHold(false);
    });
    it("Should issue by delegate", async () => {
      const organization = entity1;
      const delegate = entity2;
      await authorizeDelegate(delegate.address, organization);
      await issueByDelegate(
        verificationRegistryAddress,
        "some message",
        3600 * 24 * 365,
        organization,
        delegate
      );
    });
    it("Should throw on issuing with an unauthorized delegate", async () => {
      try {
        await issueByDelegate(); // will fail since delegate authorization was not set in advance
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should issue by delegate with custom type", async () => {
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const organization = entity1;
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        defaultDidRegistryInstance.address,
        customDelegateType
      );
      await issueByDelegateWithCustomType(
        customDelegateType,
        verificationRegistryAddress,
        "some message",
        3600 * 24 * 365,
        organization,
        delegate
      );
    });
    it("Should issue by delegate with custom delegate type and custom didRegistry", async () => {
      const customDidRegistry = await deployDidRegistry(3600);
      const organization = entity1;
      await addCustomDidRegistry(customDidRegistry.address, organization);
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        customDidRegistry.address,
        customDelegateType
      );
      await issueByDelegateWithCustomType(
        customDelegateType,
        verificationRegistryAddress,
        "some message",
        3600 * 24 * 365,
        organization,
        delegate
      );
    });
    it("Should throw on issuing with an invalid custom type", async () => {
      const organization = entity1;
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const delegate = entity2;
      await authorizeDelegate(delegate.address, organization); // authorizing delegate with the default delegate type
      try {
        await issueByDelegateWithCustomType(
          customDelegateType,
          verificationRegistryAddress,
          "some message",
          3600 * 24 * 365,
          organization,
          delegate
        );
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail.
      } catch (error) {}
    });
    it("Should revoke by delegate", async () => {
      const organization = entity1;
      const delegate = entity2;
      await authorizeDelegate(delegate.address, organization);
      await revokeByDelegate(
        verificationRegistryAddress,
        "some message",
        organization,
        delegate
      );
    });
    it("Should revoke by delegate with custom type", async () => {
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const organization = entity1;
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        defaultDidRegistryInstance.address,
        customDelegateType
      );
      await revokeByDelegateWithCustomType(
        customDelegateType,
        verificationRegistryAddress,
        "some message",
        organization,
        delegate
      );
    });
    it("Should issue by signed way", async () => {
      const organization = entity1;
      await issueSigned(organization);
    });
    it("Should throw on attempting to issue signed with an invalid signature", async () => {
      const organization = entity1;
      const { typeDataHash, digest, exp } = await getTypedDataHashForIssue(
        organization
      );
      // sign type data hash
      const impersonator = entity2;
      const signingKey = impersonator._signingKey;
      const { v, r, s } = signingKey().signDigest(typeDataHash);
      // 3. Send Signed Transaction
      const anySender = entity3;
      const Artifact = await ethers.getContractFactory(artifactName, anySender);
      const contractInstance = Artifact.attach(verificationRegistryAddress);
      try {
        await contractInstance.issueSigned(
          digest,
          exp,
          organization.address,
          v,
          r,
          s
        );
        throw new Error("Workaround ..."); // should never reach here since it is expected that issue operation will fail before
      } catch (error) {}
    });
    it("Should revoke by signed way", async () => {
      const organization = entity1;
      await revokeSigned(organization);
    });
    it("Should issue by delegate by signed way", async () => {
      const organization = entity1;
      const delegate = entity2;
      await authorizeDelegate(delegate.address, organization);
      await issueByDelegateSigned(organization, delegate);
    });
    it("Should revoke by delegate by signed way", async () => {
      const organization = entity1;
      const delegate = entity2;
      await authorizeDelegate(delegate.address, organization);
      await revokeByDelegateSigned(organization, delegate);
    });
    it("Should issue by delegate with custom type by signed way", async () => {
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const organization = entity1;
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        defaultDidRegistryInstance.address,
        customDelegateType
      );
      await issueByDelegateWithCustomDelegateTypeSigned(
        customDelegateType,
        organization,
        delegate
      );
    });
    it("Should revoke by delegate with custom type by signed way", async () => {
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const organization = entity1;
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        defaultDidRegistryInstance.address,
        customDelegateType
      );
      await revokeByDelegateWithCustomDelegateTypeSigned(
        customDelegateType,
        organization,
        delegate
      );
    });
    it("Should update", async () => {
      const organization = entity1;
      const Artifact = await ethers.getContractFactory(
        artifactName,
        organization
      );
      const contractInstance = Artifact.attach(verificationRegistryAddress);
      const message = "some message";
      const digest = keccak256(toUtf8Bytes(message));
      await issue(verificationRegistryAddress, message);
      const delta = 3600 * 24 * 2;
      const exp = Math.floor(Date.now() / 1000) + delta;
      const result = await contractInstance.update(
        digest,
        exp,
        organization.address
      );
      await expect(result)
        .to.emit(contractInstance, "NewUpdate")
        .withArgs(digest, organization.address, exp);
    });
    it("Should revoke by delegate with custom did registry and custom delegate type", async () => {
      const customDidRegistry = await deployDidRegistry(3600);
      const organization = entity1;
      await addCustomDidRegistry(customDidRegistry.address, organization);
      const customDelegateType =
        "0x0be0ff6adc81f13f4d66a7dbb4cd4b6018141f5d65f53b245681255a1d2667f5";
      const delegate = entity2;
      await setCustomDelegateType(organization, customDelegateType);
      await authorizeDelegate(
        delegate.address,
        organization,
        customDidRegistry.address,
        customDelegateType
      );
      await revokeByDelegateWithCustomDelegateTypeSigned(
        customDelegateType,
        organization,
        delegate
      );
    });
  });
});

async function issue(
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  delta = 3600 * 24 * 365,
  sender = entity1
) {
  const digest = keccak256(toUtf8Bytes(message));
  const exp = Math.floor(Date.now() / 1000) + delta;
  const Artifact = await ethers.getContractFactory(artifactName, sender);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.issue(digest, exp, sender.address);
  await expect(result)
    .to.emit(verificationRegistry, "NewIssuance")
    .withArgs(digest, sender.address, anyValue, exp);
  const q = await verificationRegistry.getDetails(sender.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function revoke(
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  sender = entity1
) {
  const digest = keccak256(toUtf8Bytes(message));
  const Artifact = await ethers.getContractFactory(artifactName, sender);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.revoke(digest, sender.address);
  await expect(result)
    .to.emit(verificationRegistry, "NewRevocation")
    .withArgs(digest, sender.address, anyValue, anyValue);
}

async function toggletOnHold(
  expected: boolean,
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  sender = entity1
) {
  const digest = keccak256(toUtf8Bytes(message));
  const Artifact = await ethers.getContractFactory(artifactName, sender);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.onHoldChange(
    digest,
    sender.address,
    expected
  );
  await expect(result)
    .to.emit(verificationRegistry, "NewOnHoldChange")
    .withArgs(digest, sender.address, expected, anyValue);
  const q = await verificationRegistry.getDetails(sender.address, digest);
  expect(q.onHold).to.equal(expected);
}

async function issueByDelegate(
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  delta = 3600 * 24 * 365,
  organization = entity1,
  delegate = entity2
) {
  const digest = keccak256(toUtf8Bytes(message));
  const exp = Math.floor(Date.now() / 1000) + delta;
  const Artifact = await ethers.getContractFactory(artifactName, delegate);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.issueByDelegate(
    organization.address,
    digest,
    exp
  );
  await expect(result)
    .to.emit(verificationRegistry, "NewIssuance")
    .withArgs(digest, organization.address, anyValue, exp);
  const q = await verificationRegistry.getDetails(organization.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function issueByDelegateWithCustomType(
  customDelegateType: string,
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  delta = 3600 * 24 * 365,
  organization = entity1,
  delegate = entity2
) {
  const digest = keccak256(toUtf8Bytes(message));
  const exp = Math.floor(Date.now() / 1000) + delta;
  const Artifact = await ethers.getContractFactory(artifactName, delegate);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.issueByDelegateWithCustomType(
    customDelegateType,
    organization.address,
    digest,
    exp
  );
  await expect(result)
    .to.emit(verificationRegistry, "NewIssuance")
    .withArgs(digest, organization.address, anyValue, exp);
  const q = await verificationRegistry.getDetails(organization.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function authorizeDelegate(
  delegateAddress: string,
  organization: Wallet,
  didRegistryAddress = defaultDidRegistryInstance.address,
  delegateType = defaultDelegateType
) {
  const Artifact = await ethers.getContractFactory(
    didRegistryArtifactName,
    organization
  );
  const didRegistryOrg = Artifact.attach(didRegistryAddress);
  await didRegistryOrg.addDelegate(
    organization.address,
    delegateType,
    delegateAddress,
    3600 * 24 * 365
  );

  const d = await didRegistryOrg.validDelegate(
    organization.address,
    delegateType,
    delegateAddress
  );
  expect(d).to.equal(true);
}

async function setCustomDelegateType(
  organization: Wallet,
  customDelegateType: string
) {
  const Artifact = await ethers.getContractFactory(artifactName, organization);
  const ci = Artifact.attach(verificationRegistryAddress);
  const result = await ci.addDelegateType(customDelegateType);
  await expect(result)
    .to.emit(ci, "NewDelegateTypeChange")
    .withArgs(customDelegateType, organization.address, true);
}

async function addCustomDidRegistry(
  customDidRegistryAddress: string,
  organization: Wallet,
  _verificationRegistryAddress = verificationRegistryAddress
) {
  const Artifact = await ethers.getContractFactory(artifactName, organization);
  const verificationRegistryOrg = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistryOrg.addDidRegistry(
    customDidRegistryAddress
  );
  await expect(result)
    .to.emit(verificationRegistryOrg, "DidRegistryChange")
    .withArgs(organization.address, customDidRegistryAddress, true);
}

async function revokeByDelegate(
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  organization = entity1,
  delegate = entity2
) {
  const digest = keccak256(toUtf8Bytes(message));
  const Artifact = await ethers.getContractFactory(artifactName, delegate);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.revokeByDelegate(
    organization.address,
    digest
  );
  await expect(result)
    .to.emit(verificationRegistry, "NewRevocation")
    .withArgs(digest, organization.address, anyValue, anyValue);
}

async function revokeByDelegateWithCustomType(
  customDelegateType: string,
  _verificationRegistryAddress = verificationRegistryAddress,
  message = genericMessage,
  organization = entity1,
  delegate = entity2
) {
  const digest = keccak256(toUtf8Bytes(message));
  const Artifact = await ethers.getContractFactory(artifactName, delegate);
  const verificationRegistry = Artifact.attach(_verificationRegistryAddress);
  const result = await verificationRegistry.revokeByDelegateWithCustomType(
    customDelegateType,
    organization.address,
    digest
  );
  await expect(result)
    .to.emit(verificationRegistry, "NewRevocation")
    .withArgs(digest, organization.address, anyValue, anyValue);
}

async function issueSigned(
  organization: Wallet,
  contractName = EIP712ContractName,
  message = "some message",
  delta = 3600 * 24 * 365,
  chainId = network.config.chainId,
  anySender = entity2
) {
  const { typeDataHash, digest, exp } = await getTypedDataHashForIssue(
    organization,
    contractName,
    message,
    delta,
    chainId
  );
  // sign type data hash
  const signingKey = organization._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result = await contractInstance.issueSigned(
    digest,
    exp,
    organization.address,
    v,
    r,
    s
  );
  await expect(result)
    .to.emit(contractInstance, "NewIssuance")
    .withArgs(digest, organization.address, anyValue, exp);
  const q = await contractInstance.getDetails(organization.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function revokeSigned(
  organization: Wallet,
  contractName = EIP712ContractName,
  message = "some message",
  anySender = entity2
) {
  const { typeDataHash, digest } = await getTypedDataHashForRevocation(
    organization,
    contractName,
    message
  );
  // sign type data hash
  const signingKey = organization._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result = await contractInstance.revokeSigned(
    digest,
    organization.address,
    v,
    r,
    s
  );
  await expect(result)
    .to.emit(contractInstance, "NewRevocation")
    .withArgs(digest, organization.address, anyValue, anyValue);
}

async function issueByDelegateSigned(
  organization: Wallet,
  delegate = entity3,
  contractName = EIP712ContractName,
  message = "some message",
  delta = 3600 * 24 * 365,
  chainId = network.config.chainId,
  anySender = entity2
) {
  const { typeDataHash, digest, exp } = await getTypedDataHashForIssue(
    organization,
    contractName,
    message,
    delta,
    chainId
  );
  // sign type data hash
  const signingKey = delegate._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result = await contractInstance.issueByDelegateSigned(
    digest,
    exp,
    organization.address,
    v,
    r,
    s
  );
  await expect(result)
    .to.emit(contractInstance, "NewIssuance")
    .withArgs(digest, organization.address, anyValue, exp);
  const q = await contractInstance.getDetails(organization.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function revokeByDelegateSigned(
  organization: Wallet,
  delegate = entity2,
  contractName = EIP712ContractName,
  message = "some message",
  anySender = entity2
) {
  const { typeDataHash, digest } = await getTypedDataHashForRevocation(
    organization,
    contractName,
    message
  );
  // sign type data hash
  const signingKey = delegate._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result = await contractInstance.revokeByDelegateSigned(
    digest,
    organization.address,
    v,
    r,
    s
  );
  await expect(result)
    .to.emit(contractInstance, "NewRevocation")
    .withArgs(digest, organization.address, anyValue, anyValue);
}

async function issueByDelegateWithCustomDelegateTypeSigned(
  delegateType: string,
  organization: Wallet,
  delegate = entity3,
  contractName = EIP712ContractName,
  message = "some message",
  delta = 3600 * 24 * 365,
  chainId = network.config.chainId,
  anySender = entity2
) {
  const { typeDataHash, digest, exp } = await getTypedDataHashForIssue(
    organization,
    contractName,
    message,
    delta,
    chainId
  );
  // sign type data hash
  const signingKey = delegate._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result =
    await contractInstance.issueByDelegateWithCustomDelegateTypeSigned(
      delegateType,
      digest,
      exp,
      organization.address,
      v,
      r,
      s
    );
  await expect(result)
    .to.emit(contractInstance, "NewIssuance")
    .withArgs(digest, organization.address, anyValue, exp);
  const q = await contractInstance.getDetails(organization.address, digest);
  expect(q.exp).to.equal(exp);
  expect(q.onHold).to.equal(false);
}

async function revokeByDelegateWithCustomDelegateTypeSigned(
  delegateType: string,
  organization: Wallet,
  delegate = entity3,
  contractName = EIP712ContractName,
  message = "some message",
  anySender = entity2
) {
  const { typeDataHash, digest } = await getTypedDataHashForRevocation(
    organization,
    contractName,
    message
  );
  // sign type data hash
  const signingKey = delegate._signingKey;
  const { v, r, s } = signingKey().signDigest(typeDataHash);

  // 3. Send Signed Transaction
  const Artifact = await ethers.getContractFactory(artifactName, anySender);
  const contractInstance = Artifact.attach(verificationRegistryAddress);
  const result =
    await contractInstance.revokeByDelegateWithCustomDelegateTypeSigned(
      delegateType,
      digest,
      organization.address,
      v,
      r,
      s
    );
  await expect(result)
    .to.emit(contractInstance, "NewRevocation")
    .withArgs(digest, organization.address, anyValue, anyValue);
}

async function getTypedDataHashForIssue(
  organization: Wallet,
  contractName = EIP712ContractName,
  message = "some message",
  delta = 3600 * 24 * 365,
  chainId = network.config.chainId
): Promise<{ typeDataHash: string; digest: string; exp: number }> {
  const ISSUE_TYPEHASH = keccak256(
    toUtf8Bytes("Issue(bytes32 digest, uint256 exp, address identity)")
  ); // OK -> 0xaaf414ba23a8cfcf004a7f75188441e59666f98d85447b5665cf04052d8e2bc3

  // 0. Build digest
  const digest = keccak256(toUtf8Bytes(message));

  // 1. Build struct data hash
  const exp = Math.floor(Date.now() / 1000) + delta;
  const encodedMessage = defaultAbiCoder.encode(
    ["bytes32", "bytes32", "uint256", "address"],
    [ISSUE_TYPEHASH, digest, exp, organization.address]
  );
  const structHash = keccak256(arrayify(encodedMessage)); // OK

  // 2. EIP712
  // 2.1 build domainSeparator
  const TYPE_HASH = keccak256(
    toUtf8Bytes(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    )
  );
  const _hashedName = keccak256(toUtf8Bytes(contractName));
  const _hashedVersion = keccak256(toUtf8Bytes("1"));

  const contractAddress = verificationRegistryAddress;
  const eds = defaultAbiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint256", "address"],
    [TYPE_HASH, _hashedName, _hashedVersion, chainId, contractAddress]
  );
  const domainSeparator = keccak256(eds); // OK

  // 2.2 Build type data hash
  // Inputs: structHash and domainSeparator
  const typeData = ethers.utils.solidityPack(
    ["bytes1", "bytes1", "bytes32", "bytes32"],
    [0x19, 0x01, domainSeparator, structHash]
  );
  const typeDataHash = keccak256(typeData);
  return { typeDataHash, exp, digest };
}

async function getTypedDataHashForRevocation(
  organization: Wallet,
  contractName = EIP712ContractName,
  message = "some message"
): Promise<{ typeDataHash: string; digest: string }> {
  const ISSUE_TYPEHASH = keccak256(
    toUtf8Bytes("Revoke(bytes32 digest, address identity)")
  );
  // 0. Build digest
  const digest = keccak256(toUtf8Bytes(message));

  // 1. Build struct data hash
  const encodedMessage = defaultAbiCoder.encode(
    ["bytes32", "bytes32", "address"],
    [ISSUE_TYPEHASH, digest, organization.address]
  );
  const structHash = keccak256(arrayify(encodedMessage));

  const domainSeparator = await getDomainSeparator(contractName);
  // 2.2 Build type data hash
  // Inputs: structHash and domainSeparator
  const typeData = ethers.utils.solidityPack(
    ["bytes1", "bytes1", "bytes32", "bytes32"],
    [0x19, 0x01, domainSeparator, structHash]
  );
  const typeDataHash = keccak256(typeData);
  return { typeDataHash, digest };
}

async function getDomainSeparator(
  contractName: string,
  version = "1",
  chainId = network.config.chainId
): Promise<string> {
  // 1. EIP712
  // 1.1 build domainSeparator
  const TYPE_HASH = keccak256(
    toUtf8Bytes(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    )
  );
  const _hashedName = keccak256(toUtf8Bytes(contractName));
  const _hashedVersion = keccak256(toUtf8Bytes(version));

  const contractAddress = verificationRegistryAddress;
  const eds = defaultAbiCoder.encode(
    ["bytes32", "bytes32", "bytes32", "uint256", "address"],
    [TYPE_HASH, _hashedName, _hashedVersion, chainId, contractAddress]
  );
  const domainSeparator = keccak256(eds);
  return domainSeparator;
}
