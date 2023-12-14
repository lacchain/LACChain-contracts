import { ethers, lacchain } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "ChainOfTrustGM";
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const revokeMode = 0; // only direct parent can revoke
  const isRootMaintainer = false; // means only contract owner maintains "depth" and "reovocation mode"
  const didRegistryAddress = "0xce24fF4fC5339Ff18836c82B11Bcefd6840075Fc";
  const delegateType = keccak256(toUtf8Bytes("DefaultDelegateType"));
  const instance = await lacchain.deployContract(
    Artifact,
    lacchain.baseRelayAddress,
    "3", // depth
    "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C", // root did
    "0xFFFCe4Cc7033746106986Aca1B8B8572B2f58B08", // root account manager
    revokeMode,
    isRootMaintainer,
    didRegistryAddress,
    delegateType
  );
  console.log(
    `${artifactName} instance successfully deployed at address: ` +
      instance.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
