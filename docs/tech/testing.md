# Testing Guide

## Testing Commands:

Tests are made against Lacchain Open Pro Testnet because of the Gas Model needed to simulate transactions.

```sh
 yarn hardhat test test/chainOfTrust/ChainOfTrustBaseGM.test.ts  --network lacchain
 yarn hardhat test test/chainOfTrust/ChainOfTrustGM.test.ts  --network lacchain
 yarn hardhat test test/publicDirectory/PublicDirectoryGM.test.ts --network lacchain
```
