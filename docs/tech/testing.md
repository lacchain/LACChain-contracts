# Testing Guide

## Testing Commands:

Tests are made against Lacchain Open Pro Testnet because of the Gas Model needed to simulate transactions.

```sh
 yarn hardhat test test/chainOfTrust/ChainOfTrustBase.test.ts  --network lacchain
 yarn hardhat test test/chainOfTrust/ChainOfTrust.test.ts  --network lacchain
 yarn hardhat test test/publicDirectory/PublicDirectory.test.ts --network lacchain
```
