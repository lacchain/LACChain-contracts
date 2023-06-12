# Additional Scripts

## General

### Transfer ownership on any ownable contract:

Before executing set variables in **scripts/transferOwnership.ts**

```sh
 yarn hardhat run --network lacchain scripts/transferOwnership.ts
```

## Chain of Trust

### Transfer Root of Manager:

Before executing this script, update the variables in the file: `scripts/chainOfTrustTransferRootManager.ts`

```sh
yarn hardhat run --network lacchain scripts/chainOfTrustTransferRootManager.ts
```
