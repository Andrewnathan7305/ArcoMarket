require("@nomiclabs/hardhat-waffle");
require('dotenv').config()
const networks = require('./networks.js');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
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
  networks: networks
};
