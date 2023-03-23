import { ethers, lacchain } from "hardhat";

async function main() {
  const accounts = lacchain.getSigners();
  const MigrationsArtifact = await ethers.getContractFactory(
    "Migrations",
    accounts[0]
  );
  console.log("Using Base Relay Address:", lacchain.baseRelayAddress);
  const migrationsInstance = await lacchain.deployContract(
    MigrationsArtifact,
    lacchain.baseRelayAddress
  );
  console.log(
    "migrations Instance successfully deployed at address: " +
      migrationsInstance.address
  );
  // const migration = MigrationsArtifact.attach(migrationsInstance.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
