# Deployment Guide

## Deploying any of the other contracts:

```sh
 yarn hardhat run --network lacchain scripts/deployPublicDirectory.ts # Deploys a non-upgradeable instance of the Public Dicrectory Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrustBase.ts # deploys Base Chain Of Trust Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrust.ts # deploys Chain Of Trust Smart Contract
```

## Deploying upgradeable contracts:

```sh
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustBaseUpgradeable.ts # deploys a chain of trust base upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustUpgradeable.ts # deploys a chain of trust didRegistry-integrated upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployPublicDirectoryUpgradeable.ts # deploys upgradeable version of public directory smart contract
```
