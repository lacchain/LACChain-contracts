import { ethers, lacchain } from "hardhat";
import { Wallet } from "ethers";
async function main() {
  const accounts = lacchain.getSigners();
  // update vars accordinly before continuing
  const artifactName = "ChainOfTrustUpgradeable"; // update this with the correspondent artifact name: ChainOfTrustUpgradeable, ChainOfTrust, ChainOfTrustBaseUpgradeable or ChainOfTrustBase
  const curentOwner = accounts[0]; // usually this is the account that deploys the contract
  const contractAddress = "0x1267E253DAa187b5E3080516765DFC237ab8a8F0"; // update this with the contract address to interact with.
  const newOwnerAddress = accounts[1].address; // update this with the new root manager
  // set new owner
  await transferRootManagerOwnership(
    curentOwner,
    newOwnerAddress,
    artifactName,
    contractAddress
  );
}

async function transferRootManagerOwnership(
  curentOwner: Wallet,
  newOwnerAddress: string,
  artifactName: string,
  contractAddress: string
) {
  console.log("signing with", curentOwner.address);
  const Artifact = await ethers.getContractFactory(artifactName, curentOwner);
  const iFace = Artifact.attach(contractAddress);
  console.log(
    "Transferring Root Manager from",
    await iFace.manager(1),
    "to",
    newOwnerAddress
  );
  await iFace.transferRoot(newOwnerAddress);
  console.log("New Owner:", await iFace.manager(1));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
