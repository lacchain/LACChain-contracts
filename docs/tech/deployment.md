# Deployment Guide

## Deploying a contract example:

```sh
 yarn hardhat run --network lacchain scripts/deployExample.ts
```

Output:

```sh
Using Base Relay Address: 0xa4B5eE2906090ce2cDbf5dfff944db26f397037D
migrations Instance successfully deployed at address: 0xE74B710bCC51fE2B290b8653F9754125f39e4Dd3
```

## Deploying any of the other contracts:

```sh
 yarn hardhat run --network lacchain scripts/deployDidRegistry.ts # deploys DidRegistry Smart Contract
 yarn hardhat run --network lacchain scripts/deployCredentialRegistry.ts # deploys Credential Registry Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrustBase.ts # deploys Base Chain Of Trust Smart Contract
 yarn hardhat run --network lacchain scripts/deployChainOfTrust.ts # deploys Chain Of Trust Smart Contract
```

## Deploying upgradeable contracts:

```sh
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployExampleUpgradeable.ts # deploys a simple upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustBaseUpgradeable.ts # deploys a chain of trust base upgradeable contract
env DEBUG='@openzeppelin:*' yarn hardhat run --network lacchain scripts/upgradeable/deployChainOfTrustUpgradeable.ts # deploys a chain of trust didRegistry-integrated upgradeable contract
```
