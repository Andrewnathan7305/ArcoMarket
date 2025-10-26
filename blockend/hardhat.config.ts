import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import * as fs from "fs";

// Read network configuration
const networkConfig = JSON.parse(fs.readFileSync('./network.json', 'utf8'));

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: { 
          optimizer: { 
            enabled: true, 
            runs: 1000 
          },
          viaIR: true
        },
      },
      {
        version: "0.4.18",
        settings: { optimizer: { enabled: true, runs: 200 } },
        viaIR: true,
      }
    ],
    overrides: {
      "contracts/WETH9.sol": {
        version: "0.4.18",
        settings: { optimizer: { enabled: true, runs: 200 } },
      }
    }
  },
  networks: {
    ...networkConfig,
    arcology: {
      url: "http://192.168.1.22:8545",
      chainId: 118,
      accounts: networkConfig.TestnetInfo.accounts
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v5",
  },
};

export default config;
