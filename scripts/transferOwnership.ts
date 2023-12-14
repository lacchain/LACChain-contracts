import { ethers, lacchain } from "hardhat";
import { Wallet } from "ethers";
async function main() {
  const accounts = lacchain.getSigners();
  // update vars accordinly before continuing
  const artifactName = "PublicDirectory";
  const curentOwner = accounts[0];
  const contractAddress = "0x67319e72eE1c8aca3435b7748Be547cF17c5e384";
  const newOwnerAddress = "0xD751E0A91A4a431ea49271B56cB7dfB0d5aF394B"; // accounts[1].address;
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
