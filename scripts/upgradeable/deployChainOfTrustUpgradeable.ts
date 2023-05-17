import { ethers, lacchain, upgrades } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "ChainOfTrustUpgradeable";
  const deployer = accounts[0];
  const rootManager = accounts[0];
  console.log("signing with", deployer.address);
  const Artifact = await ethers.getContractFactory(artifactName, deployer);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const depth = 3;
  const revokeMode = 0; // only direct parent can revoke
  const rootDid =
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C";
  const isRootMaintainer = false; // means only contract owner maintains "depth" and "revocation mode"
  const didRegistryAddress = "0xd3dC5Bb0C17359D5ff130B186056eA8DC97a8D79";
  const delegateType = keccak256(toUtf8Bytes("DefaultDelegateType"));
  await upgrades.deployProxy(
    Artifact,
    [
      lacchain.baseRelayAddress,
      depth,
      rootDid, // root did
      rootManager.address, // root account manager
      revokeMode,
      isRootMaintainer,
      didRegistryAddress,
      delegateType,
    ],
    { kind: "uups" }
  );
  console.log("update addresses ..."); // TODO: address this issue
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
