import { ethers, lacchain } from "hardhat";
import { Wallet } from "ethers";
async function main() {
  const accounts = lacchain.getSigners();
  // update vars accordinly before continuing
  const artifactName = "ChainOfTrustUpgradeable"; // update this with the correspondent artifact name: ChainOfTrustUpgradeable, ChainOfTrust, ChainOfTrustBaseUpgradeable or ChainOfTrustBase
  const curentOwner = accounts[0]; // usually this is the account that deploys the contract
  const contractAddress = "0x39A8d906f030F531e0f1e3AA121B940F0E9609AF"; // update this with the contract address to interact with.
  const newRootManager = "0xBd268D0d4D6FC9A1a01e1c68BE9435D7b0187f4F"; //accounts[1].address; // update this with the new root manager
  const newDid =
    "did:lac1:1iT5KqRtJ9vZTYFyHRs3MFDHH5bRBFfabwi6rMuTppojx4o5J5DjK7JbWwp2mWF8DFYk"; // new did which has acknowledged the root manager in a relationship in its did document.
  // set new owner
  await transferRootManagerOwnership(
    curentOwner,
    newRootManager,
    artifactName,
    contractAddress,
    newDid
  );
}

async function transferRootManagerOwnership(
  curentOwner: Wallet,
  newRootManager: string,
  artifactName: string,
  contractAddress: string,
  newDid: string
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
  await iFace.transferRoot(newRootManager, newDid);
  console.log("New Root Manager: ", await iFace.manager(1));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
