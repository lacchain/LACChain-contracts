import { lacchain, ethers } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const artifactName = "DIDRegistryRecoverableGM";
  const Artifact = await ethers.getContractFactory(artifactName, accounts[0]);
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const _minKeyRotationTime = 3600;
  const _maxAttempts = 10;
  const _minControllers = 1;
  const _resetSeconds = 30;
  const trustedForwarderAddr = lacchain.baseRelayAddress;
  const instance = await lacchain.deployContract(
    Artifact,
    _minKeyRotationTime,
    _maxAttempts,
    _minControllers,
    _resetSeconds,
    trustedForwarderAddr
  );
  console.log(
    `${artifactName} instance successfully deployed at address: ` +
      instance.address
  );
  // const contract = Artifact.attach(instance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
