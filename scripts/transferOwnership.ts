import { ethers, lacchain } from "hardhat";
import { Wallet } from "ethers";
async function main() {
  const accounts = lacchain.getSigners();
  // update vars accordinly before continuing
  const artifactName = "ChainOfTrustBaseUpgradeable";
  const curentOwner = accounts[0];
  const contractAddress = "0x0449fa5FeD1784794b3e6024cDADF94fAF992384";
  const newOwnerAddress = accounts[1].address;
  // set new owner
  transferOwnership(
    curentOwner,
    newOwnerAddress,
    artifactName,
    contractAddress
  );
}

async function transferOwnership(
  curentOwner: Wallet,
  newOwnerAddress: string,
  artifactName: string,
  contractAddress: string
) {
  console.log("signing with", curentOwner.address);
  const Artifact = await ethers.getContractFactory(artifactName, curentOwner);
  const iFace = Artifact.attach(contractAddress);
  console.log("Transferring from", await iFace.owner(), "to", newOwnerAddress);
  await iFace.transferOwnership(newOwnerAddress);
  console.log("New Owner:", await iFace.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
