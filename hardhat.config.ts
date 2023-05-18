import { HardhatUserConfig, extendEnvironment } from "hardhat/config";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-toolbox";
import "./extender";
import "hardhat-contract-sizer";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    lacchain: {
      url: "<RPC_URL_CONNECTION>", // rpc connection
      gas: 0x989680,
      gasPrice: 0,
      nodeAddress: "<NODE_ADDRESS>", // address the node you are connecting with.
      expiration: 1736394529, // expiration time which is at least greater than current 10 digits unix timestamp
      privateKeys: [
        // use the signers you are going to use for your project
        "<0xPrivateKey1>",
        "<0xPrivateKey2>",
        "<0xPrivateKeyn>",
      ],
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  mocha: {
    timeout: 500000,
  },
};

// Adding Base Relay Address to HardhatRuntimeEnvironment
// lacchain Mainnet: 0xEAA5420AF59305c5ecacCB38fcDe70198001d147
// lacchain Open-protesnet: 0xa4B5eE2906090ce2cDbf5dfff944db26f397037D
extendEnvironment((hre) => {
  hre.lacchain.baseRelayAddress = "<Base Relay Recipient Address>";
});

export default config;
