# Configuration Guide

Before starting it's worth noting that currently there are two networks in Lacchain:

- Lacchain Mainnet
- Lacchain Open-protestnet

To start using this repo you will need to configure hardhat.config.ts file, here is a detailed example
of how that file would look like for the lacchain network your are willing to connect to:

```ts
import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./extender";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    lacchain: {
      url: "http://35.185.112.219", // rpc connection
      gas: 0x989680,
      gasPrice: 0,
      nodeAddress: "0xad730de8c4bfc3d845f7ce851bcf2ea17c049585", // address the node you are connecting with.
      expiration: 1736394529, // expiration time which is at least greater than current 10 digits unix timestamp
      privateKeys: [
        // use the signers you are going to use for your project
        "0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63",
        "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
        "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
      ],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

// Adding Base Relay Address to HardhatRuntimeEnvironment
// lacchain Mainnet: 0xEAA5420AF59305c5ecacCB38fcDe70198001d147
// lacchain Open-protesnet: 0xa4B5eE2906090ce2cDbf5dfff944db26f397037D
extendEnvironment((hre) => {
  hre.lacchain.baseRelayAddress = "0xa4B5eE2906090ce2cDbf5dfff944db26f397037D";
});

export default config;
```
