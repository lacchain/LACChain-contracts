import { ethers, lacchain, upgrades } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "ChainOfTrustBaseUpgradeable";
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const revokeMode = 0; // only direct parent can revoke
  const isRootMaintainer = false; // means only contract owner maintains "depth" and "revocation mode"
  const instance = await upgrades.deployProxy(
    Artifact,
    [
      lacchain.baseRelayAddress,
      "3", // depth
      "did:web:lacchain.id:3DArjNYv1q235YgLb2F7HEQmtmNncxu7qdXVnXvPx22e3UsX2RgNhHyhvZEw1Gb5C", // root did
      "0xFFFCe4Cc7033746106986Aca1B8B8572B2f58B08", // root account manager
      revokeMode,
      isRootMaintainer,
    ],
    { kind: "uups" }
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
