# Deployment Guide

## Deploying any of the gas model contracts:

```sh
 yarn hardhat run --network lacchain scripts/deployPublicDirectoryGM.ts # Deploys a non-upgradeable instance of the Public Dicrectory Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrustBaseGM.ts # deploys Base Chain Of Trust Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrustGM.ts # deploys Chain Of Trust Smart Contract
```

## Deploying upgradeable contracts:

```sh
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustBaseGMUpgradeable.ts # deploys a chain of trust base upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustGMUpgradeable.ts # deploys a chain of trust didRegistry-integrated upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployPublicDirectoryGMUpgradeable.ts # deploys upgradeable version of public directory smart contract
```
