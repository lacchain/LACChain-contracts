import { ethers, lacchain } from "hardhat";
import { Wallet } from "ethers";
async function main() {
  const accounts = lacchain.getSigners();
  // update vars accordinly before continuing
  const artifactName = "ChainOfTrustUpgradeable"; // update this with the correspondent artifact name: ChainOfTrustUpgradeable, ChainOfTrust, ChainOfTrustBaseUpgradeable or ChainOfTrustBase
  const curentOwner = accounts[0]; // usually this is the account that deploys the contract
  const contractAddress = "0xEBB6854aa875867f684dd1d2338eC20908039c67"; // update this with the contract address to interact with.
  const newRootManager = "0x4E4967AE0d1709B1ad865b56cfff0E0De475b25E"; //accounts[1].address; // update this with the new root manager
  // set new owner
  await transferRootManagerOwnership(
    curentOwner,
    newRootManager,
    artifactName,
    contractAddress
  );
}

async function transferRootManagerOwnership(
  curentOwner: Wallet,
  newRootManager: string,
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
    newRootManager
  );
  await iFace.transferRoot(newRootManager);
  console.log("New Root Manager: ", await iFace.manager(1));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
