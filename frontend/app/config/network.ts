// Network configuration for Arcology Localnet
export const NETWORK_CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://192.168.1.22:8545',
  CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '118'),
  CHAIN_NAME: 'Arcology Localnet',
  BLOCK_EXPLORER: null, // No block explorer for localnet
  CURRENCY: {
    name: 'Arcology',
    symbol: 'ARC',
    decimals: 18
  }
};

// Test accounts from network.json (for development only)
export const TEST_ACCOUNTS = [
  '5bb1315c3ffa654c89f1f8b27f93cb4ef6b0474c4797cf2eb40d1bdd98dc26e7',
  '2289ae919f03075448d567c9c4a22846ce3711731c895f1bea572cef25bb346f',
  '19c439237a1e2c86f87b2d31438e5476738dd67297bf92d752b16bdb4ff37aa2',
  '236c7b430c2ea13f19add3920b0bb2795f35a969f8be617faa9629bc5f6201f1',
  'c4fbe435d6297959b0e326e560fdfb680a59807d75e1dec04d873fcd5b36597b'
];

// Contract addresses (update these with actual deployed addresses)
export const CONTRACT_ADDRESSES = {
  MARKET_FACTORY: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || '0xB1e0e9e68297aAE01347F6Ce0ff21d5f72D3fa0F',
  MANAGER: process.env.NEXT_PUBLIC_MANAGER_ADDRESS || '0x1642dD5c38642f91E4aa0025978b572fe30Ed89d'
};

