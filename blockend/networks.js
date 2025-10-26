// Network configuration for Hardhat
const { TestnetInfo } = require('./network.json');

module.exports = {
  arcology: {
    url: "http://192.168.1.22:8545",
    chainId: 118,
    accounts: TestnetInfo.accounts.slice(0, 10), // Use first 10 accounts for deployment
    gasPrice: 1000000000, // 1 gwei
    timeout: 60000,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
  hardhat: {
    chainId: 31337,
  }
};

