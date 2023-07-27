import { expect } from "chai";
import { ethers, lacchain } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { sleep } from "../util";
import { deployDidRegistry } from "../identity/Identity.test";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

const artifactName = "ChainOfTrust";
describe(artifactName, function () {
  const delegateType = keccak256(toUtf8Bytes("DefaultDelegateType"));
  const [owner, rootManager, member1, member2, member3] = lacchain.getSigners();
  const depth = 3;
  const did =
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";

  async function deployChainOfTrust(
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

  describe("Chain of Trust", () => {
    it("Should set right values on artifact deployment", async () => {
      const rootManagerAddress = rootManager.address;
      const contractAddress = await deployChainOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const Artifact = await ethers.getContractFactory(artifactName, owner);
      const contract = Artifact.attach(contractAddress);
      expect(await contract.depth()).to.equal(3);
      const t = await contract.group(rootManagerAddress);
      expect(t.did).to.equal(did);
    });

    it("Should update a member in my Group (TL) by delegate", async () => {
      const didRegistryContractAddress = await deployDidRegistry();
      const DidRegistryArtifact = await ethers.getContractFactory(
        "DIDRegistry",
        rootManager
      );
      const rootManagerDidRegistryContract = DidRegistryArtifact.attach(
        didRegistryContractAddress
      );

      const identity = rootManager.address;
      const delegate = member1.address;

      let result = await rootManagerDidRegistryContract.addDelegate(
        identity,
        delegateType,
        delegate,
        86400 * 365
      );
      await sleep(2);
      await expect(result).to.emit(
        rootManagerDidRegistryContract,
        "DIDDelegateChanged"
      );

      const rootManagerAddress = rootManager.address;
      const contractAddress = await deployChainOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const unauthorizedArtifact = await ethers.getContractFactory(
        artifactName,
        member3
      );
      const unauthorizedContract = unauthorizedArtifact.attach(contractAddress);
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const member2Address = member2.address;
      result = await unauthorizedContract.addOrUpdateGroupMemberByDelegate(
        rootManagerAddress,
        member2Address,
        member2Did,
        86400 * 365
      );
      expect(result).not.to.emit(unauthorizedContract, "GroupMemberChanged");

      // now should passs
      const delegateArtifact = await ethers.getContractFactory(
        artifactName,
        member1
      );
      const delegateContract = delegateArtifact.attach(contractAddress);
      result = await delegateContract.addOrUpdateGroupMemberByDelegate(
        rootManagerAddress,
        member2Address,
        member2Did,
        86400 * 365
      );
      expect(result)
        .to.emit(delegateContract, "GroupMemberChanged")
        .withArgs(
          rootManagerAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );
    });

    it("Should revoke a member in my Group (TL) by delegate", async () => {
      const didRegistryContractAddress = await deployDidRegistry();
      const DidRegistryArtifact = await ethers.getContractFactory(
        "DIDRegistry",
        rootManager
      );
      const rootManagerDidRegistryContract = DidRegistryArtifact.attach(
        didRegistryContractAddress
      );

      const identity = rootManager.address;
      const delegate = member1.address;

      let result = await rootManagerDidRegistryContract.addDelegate(
        identity,
        delegateType,
        delegate,
        86400 * 365
      );
      await sleep(2);
      await expect(result).to.emit(
        rootManagerDidRegistryContract,
        "DIDDelegateChanged"
      );

      const rootManagerAddress = rootManager.address;
      const contractAddress = await deployChainOfTrust(
        depth,
        did,
        rootManagerAddress
      );
      const unauthorizedArtifact = await ethers.getContractFactory(
        artifactName,
        member3
      );
      const unauthorizedContract = unauthorizedArtifact.attach(contractAddress);
      const member2Did =
        "did:web:lacchain.id:6EArrNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb3B";
      const member2Address = member2.address;
      result = await unauthorizedContract.addOrUpdateGroupMemberByDelegate(
        rootManagerAddress,
        member2Address,
        member2Did,
        86400 * 365
      );
      expect(result).not.to.emit(unauthorizedContract, "GroupMemberChanged");

      // now should passs
      const delegateArtifact = await ethers.getContractFactory(
        artifactName,
        member1
      );
      const delegateContract = delegateArtifact.attach(contractAddress);
      result = await delegateContract.addOrUpdateGroupMemberByDelegate(
        rootManagerAddress,
        member2Address,
        member2Did,
        86400 * 365
      );

      result = await delegateContract.revokeMemberByDelegate(
        rootManagerAddress,
        member2Address,
        member2Did
      );
      expect(result)
        .to.emit(delegateContract, "GroupMemberRevoked")
        .withArgs(
          rootManagerAddress,
          member2Address,
          member2Did,
          anyValue,
          anyValue,
          anyValue
        );
    });
  });
});
