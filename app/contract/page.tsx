'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from '../hooks/useMetaMask';
import { useContract } from '../hooks/useContract';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES, TEST_ACCOUNTS } from '../config/network';

// Contract ABIs (simplified for demo - in production, use actual compiled ABIs)
const MARKET_FACTORY_ABI = [
  "function createMarket(string memory _question, uint256 _numOutcomes, uint256 _closingTime) external payable returns (uint256)",
  "function getMarket(uint256 _marketId) external returns (address)",
  "function getTotalMarkets() external returns (uint256)",
  "function getTotalVolume() external returns (uint256)"
];

const MARKET_ABI = [
  "function placeBet(uint8 _outcome) external payable",
  "function closeMarket() external",
  "function resolveMarket(uint8 _winningOutcome) external",
  "function disputeResolution(uint8 _proposedOutcome) external payable",
  "function finalizeResolution() external",
  "function getDisputeVotes(uint8 _outcome) external returns (uint256)",
  "function getOutcomePool(uint8 _outcome) external returns (uint256)",
  "function getTotalBets() external returns (uint256)",
  "function getTotalVolume() external returns (uint256)",
  "function getCurrentOdds() external returns (uint256[])",
  "function state() external view returns (uint8)",
  "function winningOutcome() external view returns (uint8)",
  "function question() external view returns (string)",
  "function numOutcomes() external view returns (uint256)",
  "function closingTime() external view returns (uint256)",
  "function creator() external view returns (address)"
];

const MANAGER_ABI = [
  "function batchBet(uint256[] memory _marketIds, uint8[] memory _outcomes, uint256[] memory _amounts) external payable",
  "function getBatchStats(uint256[] memory _marketIds) external returns (uint256[] memory, uint256[] memory)",
  "function getPortfolio(uint256[] memory _marketIds, address _user) external returns (uint256)",
  "function batchClaim(uint256[] memory _marketIds) external",
  "function createParlay(uint256[] memory _marketIds, uint8[] memory _outcomes) external payable returns (bytes32)",
  "function checkParlayStatus(bytes32 _parlayId) external returns (bool, bool, uint256)",
  "function claimParlay(bytes32 _parlayId) external returns (uint256)",
  "function getUserParlays(address _user) external view returns (bytes32[])",
  "function getParlayDetails(bytes32 _parlayId) external view returns (tuple(uint256[] marketIds, uint8[] outcomes, uint256 totalStake, address bettor, bool claimed, uint256 createdAt))"
];

// Contract addresses are now imported from config/network.ts

export default function ContractPage() {
  // Use custom hooks
  const { 
    isConnected, 
    account, 
    provider, 
    signer, 
    chainId, 
    balance, 
    loading: walletLoading, 
    error: walletError, 
    connect, 
    disconnect, 
    switchNetwork,
    refreshAccount 
  } = useMetaMask();
  
  const { 
    error: contractError, 
    callFactory, 
    callMarket, 
    callManager, 
    clearError 
  } = useContract();
  
  // State for contract interactions
  const [marketId, setMarketId] = useState<string>('');
  const [marketAddress, setMarketAddress] = useState<string>('');
  
  // Results and loading states
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Contract instances
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [managerContract, setManagerContract] = useState<ethers.Contract | null>(null);
  const [marketContract, setMarketContract] = useState<ethers.Contract | null>(null);

  // Initialize contracts when signer is available
  useEffect(() => {
    if (signer && isConnected) {
      const factory = new ethers.Contract(CONTRACT_ADDRESSES.MARKET_FACTORY, MARKET_FACTORY_ABI, signer);
      const manager = new ethers.Contract(CONTRACT_ADDRESSES.MANAGER, MANAGER_ABI, signer);
      
      setFactoryContract(factory);
      setManagerContract(manager);
    }
  }, [signer, isConnected]);

  // Get market contract instance
  const getMarketContract = async (marketId: string) => {
    if (!factoryContract) {
      setResults(prev => ({ ...prev, error: 'Factory contract not initialized' }));
      return;
    }
    
    try {
      const address = await factoryContract.getMarket(marketId);
      console.log('Market address from contract:', address);
      setMarketAddress(address);
      const contract = new ethers.Contract(address, MARKET_ABI, signer!);
      setMarketContract(contract);
      setResults(prev => ({ ...prev, marketAddress: String(address) }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, error: `Failed to get market: ${err.message}` }));
    }
  };

  // Generic contract call handler using MetaMask directly
  const makeContractCall = async (contractName: string, method: string, args: any[] = [], value?: string) => {
    if (!isConnected || !signer) {
      setResults(prev => ({ ...prev, error: 'Please connect MetaMask first' }));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let contract: ethers.Contract | null = null;
      
      switch (contractName) {
        case 'factory':
          contract = factoryContract;
          break;
        case 'manager':
          contract = managerContract;
          break;
        case 'market':
          contract = marketContract;
          break;
        default:
          throw new Error('Invalid contract name');
      }
      
      if (!contract) {
        throw new Error(`${contractName} contract not initialized`);
      }
      
      console.log(`${contractName} contract initialized at:`, contract.target);
      
      const txOptions: any = {
        gasLimit: 5000000  // Set gas limit like in the test script
      };
      if (value) {
        txOptions.value = ethers.parseEther(value);
      }
      
      console.log(`Calling ${contractName}.${method} with args:`, args, 'value:', value);
      console.log('Contract address:', contract.target);
      console.log('Transaction options:', txOptions);
      
      // Log the contract method to ensure it exists
      if (typeof contract[method] !== 'function') {
        throw new Error(`Method ${method} does not exist on ${contractName} contract`);
      }
      
      console.log(`Method ${method} exists on contract`);
      console.log('Contract methods:', Object.getOwnPropertyNames(contract).filter(name => typeof contract[name] === 'function'));
      
      // Test if we can populate the transaction first
      try {
        const populatedTx = await contract[method].populateTransaction(...args, txOptions);
        console.log('Populated transaction:', populatedTx);
        console.log('Transaction data length:', populatedTx.data?.length || 0);
      } catch (populateError) {
        console.error('Error populating transaction:', populateError);
        throw populateError;
      }
      
      const result = await contract[method](...args, txOptions);
      
      if (result.wait) {
        console.log('Transaction sent, waiting for confirmation...');
        console.log('Transaction hash:', result.hash);
        
        const receipt = await result.wait();
        console.log('Transaction confirmed:', receipt.hash);
        console.log('Full receipt:', JSON.stringify(receipt, null, 2));
        console.log('Receipt status:', receipt.status);
        console.log('Gas used:', receipt.gasUsed.toString());
        console.log('Block number:', receipt.blockNumber);
        
        // Parse and display events
        const events: any[] = [];
        if (receipt.logs && receipt.logs.length > 0) {
          console.log('Events emitted:');
          receipt.logs.forEach((log: any, index: number) => {
            console.log(`Event ${index + 1}:`, log);
            
            // Try to parse MarketCreated event
            let parsedEvent: any = null;
            if (log.topics && log.topics.length > 0) {
              // MarketCreated event signature: MarketCreated(uint256 indexed marketId, address marketAddress, address creator, string question)
              // The event signature hash is: keccak256("MarketCreated(uint256,address,address,string)")
              const marketCreatedSignature = '0x2b91ffc4f3ea962a05a3f50785d7fb3f21291480f14fb1475381f92dd553e304';
              
              if (log.topics[0] === marketCreatedSignature) {
                try {
                  console.log('Parsing MarketCreated event...');
                  console.log('Event data:', log.data);
                  console.log('Event topics:', log.topics);
                  
                  // Parse the event data: [address marketAddress, address creator, string question]
                  const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['address', 'address', 'string'],
                    log.data
                  );
                  
                  // Get marketId from topics[1] (indexed parameter)
                  const marketId = ethers.getBigInt(log.topics[1]);
                  
                  parsedEvent = {
                    name: 'MarketCreated',
                    marketId: marketId.toString(),
                    marketAddress: decoded[0],
                    creator: decoded[1],
                    question: decoded[2]
                  };
                  
                  console.log('✅ Parsed MarketCreated event:', parsedEvent);
                  
                  // Auto-update the market ID and address fields
                  setMarketId(parsedEvent.marketId);
                  setMarketAddress(parsedEvent.marketAddress);
                  
                  // Show success message
                  setResults(prev => ({
                    ...prev,
                    marketCreated: {
                      marketId: parsedEvent.marketId,
                      marketAddress: parsedEvent.marketAddress,
                      question: parsedEvent.question
                    }
                  }));
                } catch (e) {
                  console.log('Could not parse MarketCreated event:', e);
                }
              } else {
                console.log('Event signature does not match MarketCreated:', log.topics[0]);
              }
            }
            
            events.push({
              address: log.address,
              topics: log.topics,
              data: log.data,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              logIndex: log.logIndex,
              parsed: parsedEvent
            });
          });
        }
        
        setResults(prev => ({
          ...prev,
          [`${contractName}_${method}`]: {
            txHash: receipt.hash,
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status,
            blockNumber: receipt.blockNumber,
            from: receipt.from,
            to: receipt.to,
            events: events,
            fullReceipt: receipt
          }
        }));
      } else {
        console.log('View function result:', result);
        setResults(prev => ({
          ...prev,
          [`${contractName}_${method}`]: typeof result === 'object' 
            ? JSON.stringify(result, null, 2)
            : String(result)
        }));
      }
      
    } catch (err: any) {
      console.error(`${contractName}.${method} failed:`, err);
      
      // Check for specific error types
      if (err.message.includes('transaction execution reverted')) {
        if (err.message.includes('0x0000000000000000000000000000000000000000')) {
          setError(`❌ Contract not deployed! Please deploy contracts first. Check DEPLOY_NOW.md for instructions.`);
        } else {
          setError(`❌ Transaction reverted: ${err.message}. Check contract logic and parameters.`);
        }
      } else if (err.message.includes('insufficient funds')) {
        setError(`❌ Insufficient funds for transaction. Please add more ETH to your account.`);
      } else if (err.message.includes('user rejected')) {
        setError(`❌ Transaction rejected by user.`);
      } else {
        setError(`${contractName}.${method} failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Contract Interaction Dashboard</h1>
        
        {/* Quick Start Guide */}
        {(!factoryContract || !managerContract) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">🚀 Quick Start Guide</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span className="font-medium">1.</span>
                <span>Deploy your contracts to Arcology localnet using your Hardhat setup</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">2.</span>
                <span>Update contract addresses in <code className="bg-blue-100 px-1 rounded">app/config/network.ts</code></span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">3.</span>
                <span>Connect MetaMask and switch to Arcology network (Chain ID: 118)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-medium">4.</span>
                <span>Start creating markets and placing bets!</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={walletLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {walletLoading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-green-600">✅ Connected</p>
              <p className="text-sm text-gray-600">Account: {account}</p>
              <p className="text-sm text-gray-600">Balance: {balance} ETH</p>
              <p className="text-sm text-gray-600">Chain ID: {chainId}</p>
              <button
                onClick={disconnect}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Network Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Network Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RPC URL
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={NETWORK_CONFIG.RPC_URL}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chain ID
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={NETWORK_CONFIG.CHAIN_ID}
                readOnly
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                if (isConnected) {
                  switchNetwork(NETWORK_CONFIG.CHAIN_ID.toString());
                }
              }}
              disabled={!isConnected}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              Switch to Arcology Localnet
            </button>
          </div>
        </div>

        {/* Contract Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Contract Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${factoryContract ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm text-gray-600">Factory Contract</p>
              <p className="text-xs text-gray-500">{factoryContract ? 'Connected' : 'Not Deployed'}</p>
              <p className="text-xs text-gray-400">{CONTRACT_ADDRESSES.MARKET_FACTORY}</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${managerContract ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm text-gray-600">Manager Contract</p>
              <p className="text-xs text-gray-500">{managerContract ? 'Connected' : 'Not Deployed'}</p>
              <p className="text-xs text-gray-400">{CONTRACT_ADDRESSES.MANAGER}</p>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${marketContract ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <p className="text-sm text-gray-600">Market Contract</p>
              <p className="text-xs text-gray-500">{marketContract ? 'Connected' : 'Not Loaded'}</p>
              <p className="text-xs text-gray-400">{marketAddress || 'Load a market first'}</p>
            </div>
          </div>
          
          {(!factoryContract || !managerContract) && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Contracts Not Deployed</h3>
              <p className="text-sm text-yellow-700">
                The contracts haven't been deployed yet. Please deploy your contracts to the Arcology localnet 
                and update the addresses in <code className="bg-yellow-200 px-1 rounded">app/config/network.ts</code>
              </p>
              <div className="mt-2 text-xs text-yellow-600">
                <p>Factory Address: {CONTRACT_ADDRESSES.MARKET_FACTORY}</p>
                <p>Manager Address: {CONTRACT_ADDRESSES.MANAGER}</p>
              </div>
            </div>
          )}
        </div>

        {(walletError || contractError || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {walletError || contractError || error}
          </div>
        )}

        {results.marketCreated && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <h3 className="font-medium text-green-800 mb-2">🎉 Market Created Successfully!</h3>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Market ID:</span> {String(results.marketCreated.marketId)}</div>
              <div><span className="font-medium">Market Address:</span> <span className="font-mono text-blue-600">{String(results.marketCreated.marketAddress)}</span></div>
              <div><span className="font-medium">Question:</span> {String(results.marketCreated.question)}</div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  setMarketId(String(results.marketCreated.marketId));
                  setMarketAddress(String(results.marketCreated.marketAddress));
                  getMarketContract(String(results.marketCreated.marketId));
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                Load This Market
              </button>
            </div>
          </div>
        )}

        {(walletLoading || loading || loading) && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {walletLoading ? 'Connecting to wallet...' : 'Contract call in progress...'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market Factory Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Market Factory</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Who will win the election?"
                  id="question"
                  defaultValue="Will this test market work?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Outcomes
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="2"
                  id="numOutcomes"
                  defaultValue="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closing Time (Unix timestamp)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={(Math.floor(Date.now() / 1000) + 3600).toString()}
                  id="closingTime"
                  defaultValue={(Math.floor(Date.now() / 1000) + 3600).toString()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit (ETH)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.01"
                  id="deposit"
                  defaultValue="0.01"
                />
              </div>
              
              <button
                onClick={() => {
                  const question = (document.getElementById('question') as HTMLInputElement)?.value;
                  const numOutcomes = (document.getElementById('numOutcomes') as HTMLInputElement)?.value;
                  const closingTime = (document.getElementById('closingTime') as HTMLInputElement)?.value;
                  const deposit = (document.getElementById('deposit') as HTMLInputElement)?.value;
                  
                  // Validate inputs
                  if (!question || !numOutcomes || !closingTime || !deposit) {
                    setError('Please fill in all fields');
                    return;
                  }
                  
                  const numOutcomesInt = parseInt(numOutcomes);
                  const closingTimeInt = parseInt(closingTime);
                  
                  if (numOutcomesInt < 2) {
                    setError('Number of outcomes must be at least 2');
                    return;
                  }
                  
                  if (closingTimeInt <= Math.floor(Date.now() / 1000)) {
                    setError('Closing time must be in the future');
                    return;
                  }
                  
                  console.log('Creating market with params:', {
                    question,
                    numOutcomes: numOutcomesInt,
                    closingTime: closingTimeInt,
                    deposit
                  });
                  
                  makeContractCall('factory', 'createMarket', 
                    [question, numOutcomesInt, closingTimeInt], 
                    deposit
                  );
                }}
                disabled={!isConnected || !factoryContract || loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Create Market
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    console.log('Testing getTotalMarkets...');
                    try {
                      const result = await factoryContract?.getTotalMarkets();
                      console.log('✅ getTotalMarkets result:', result.toString());
                      setResults(prev => ({ ...prev, getTotalMarkets: result.toString() }));
                    } catch (error: any) {
                      console.log('❌ getTotalMarkets error:', error.message);
                      setError(`getTotalMarkets failed: ${error.message}`);
                    }
                  }}
                  disabled={!isConnected || !factoryContract || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Get Total Markets
                </button>
                
                <button
                  onClick={() => makeContractCall('factory', 'getTotalVolume', [])}
                  disabled={!isConnected || !factoryContract || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Get Total Volume
                </button>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={async () => {
                    console.log('Testing contract connection...');
                    console.log('Factory contract:', factoryContract);
                    console.log('Factory contract target:', factoryContract?.target);
                    console.log('Factory contract methods:', factoryContract ? Object.getOwnPropertyNames(factoryContract).filter(name => typeof factoryContract[name] === 'function') : 'No contract');
                    
                    if (factoryContract && signer) {
                      try {
                        // Check if contract has code
                        const code = await signer.provider?.getCode(CONTRACT_ADDRESSES.MARKET_FACTORY);
                        console.log('Contract code length:', code?.length || 0);
                        console.log('Contract has code:', code !== '0x');
                        
                        if (code === '0x') {
                          console.log('❌ Contract not deployed at address:', CONTRACT_ADDRESSES.MARKET_FACTORY);
                          setError('Contract not deployed at the specified address');
                          return;
                        }
                        
                        console.log('Testing getTotalMarkets...');
                        const result = await factoryContract.getTotalMarkets();
                        console.log('✅ getTotalMarkets result:', result.toString());
                        setResults(prev => ({ ...prev, contractTest: 'Contract is working!' }));
                      } catch (error: any) {
                        console.log('❌ Contract test error:', error.message);
                        setError(`Contract test failed: ${error.message}`);
                      }
                    }
                  }}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Test Contract Connection
                </button>
              </div>
            </div>
          </div>

          {/* Market Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Market Operations</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market ID
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                />
              </div>
              
              <button
                onClick={async () => {
                  if (marketId) {
                    await getMarketContract(marketId);
                  }
                }}
                disabled={!isConnected || !factoryContract || loading}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                Load Market
              </button>
              
              {marketAddress && (
                <p className="text-sm text-gray-600">Market Address: {marketAddress}</p>
              )}
              
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outcome
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0"
                    id="outcome"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bet Amount (ETH)
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="0.05"
                    id="betAmount"
                  />
                </div>
                
                <button
                  onClick={() => {
                    const outcome = (document.getElementById('outcome') as HTMLInputElement)?.value;
                    const betAmount = (document.getElementById('betAmount') as HTMLInputElement)?.value;
                    
                    makeContractCall('market', 'placeBet', [parseInt(outcome)], betAmount);
                  }}
                  disabled={!isConnected || !marketContract || loading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Place Bet
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => makeContractCall('market', 'closeMarket', [])}
                  disabled={!isConnected || !marketContract || loading}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                >
                  Close Market
                </button>
                
                <button
                  onClick={() => {
                    const winningOutcome = (document.getElementById('winningOutcome') as HTMLInputElement)?.value;
                    makeContractCall('market', 'resolveMarket', [parseInt(winningOutcome)]);
                  }}
                  disabled={!isConnected || !marketContract || loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  Resolve Market
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Winning Outcome
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0"
                  id="winningOutcome"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => makeContractCall('market', 'getCurrentOdds', [])}
                  disabled={!isConnected || !marketContract || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Get Odds
                </button>
                
                <button
                  onClick={() => makeContractCall('market', 'getTotalBets', [])}
                  disabled={!isConnected || !marketContract || loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Get Total Bets
                </button>
              </div>
            </div>
          </div>

          {/* Manager Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Multi-Market Manager</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market IDs (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0,1,2"
                  id="marketIds"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcomes (comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0,1,0"
                  id="outcomes"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amounts (ETH, comma-separated)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.05,0.05,0.05"
                  id="amounts"
                />
              </div>
              
              <button
                onClick={() => {
                  const marketIds = (document.getElementById('marketIds') as HTMLInputElement)?.value.split(',').map(id => parseInt(id.trim()));
                  const outcomes = (document.getElementById('outcomes') as HTMLInputElement)?.value.split(',').map(outcome => parseInt(outcome.trim()));
                  const amounts = (document.getElementById('amounts') as HTMLInputElement)?.value.split(',').map(amount => amount.trim());
                  
                  makeContractCall('manager', 'batchBet', 
                    [marketIds, outcomes, amounts.map(amount => ethers.parseEther(amount))], 
                    amounts.reduce((sum, amount) => sum + parseFloat(amount), 0).toString()
                  );
                }}
                disabled={!isConnected || !managerContract || loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                Batch Bet
              </button>
              
              <button
                onClick={() => {
                  const marketIds = (document.getElementById('marketIds') as HTMLInputElement)?.value.split(',').map(id => parseInt(id.trim()));
                  makeContractCall('manager', 'getBatchStats', [marketIds]);
                }}
                disabled={!isConnected || !managerContract || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Get Batch Stats
              </button>
              
              <button
                onClick={() => {
                  const marketIds = (document.getElementById('marketIds') as HTMLInputElement)?.value.split(',').map(id => parseInt(id.trim()));
                  makeContractCall('manager', 'getPortfolio', [marketIds, account]);
                }}
                disabled={!isConnected || !managerContract || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Get Portfolio
              </button>
            </div>
          </div>
        </div>

        {/* Results Display */}
        {Object.keys(results).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Transaction Results</h2>
            
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{key}</h3>
                
                {result.txHash && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Transaction Hash:</span>
                        <div className="font-mono text-blue-600 break-all">{result.txHash}</div>
                      </div>
                      <div>
                        <span className="font-medium">Block Number:</span>
                        <div className="font-mono">{String(result.blockNumber)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Gas Used:</span>
                        <div className="font-mono">{String(result.gasUsed)}</div>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <div className={`font-mono ${result.status === 1 ? 'text-green-600' : 'text-red-600'}`}>
                          {result.status === 1 ? 'Success' : 'Failed'}
                        </div>
                      </div>
                    </div>
                    
                    {result.events && result.events.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Events Emitted ({result.events.length}):</h4>
                        {result.events.map((event: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                            {event.parsed ? (
                              <div>
                                <div className="font-medium text-green-700 mb-2">✅ {event.parsed.name}</div>
                                <div className="text-sm space-y-1">
                                  {event.parsed.marketId && <div><span className="font-medium">Market ID:</span> {String(event.parsed.marketId)}</div>}
                                  {event.parsed.marketAddress && <div><span className="font-medium">Market Address:</span> <span className="font-mono text-blue-600">{String(event.parsed.marketAddress)}</span></div>}
                                  {event.parsed.creator && <div><span className="font-medium">Creator:</span> <span className="font-mono">{String(event.parsed.creator)}</span></div>}
                                  {event.parsed.question && <div><span className="font-medium">Question:</span> {String(event.parsed.question)}</div>}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm">
                                  <div><span className="font-medium">Address:</span> {String(event.address)}</div>
                                  <div><span className="font-medium">Topics:</span> {String(event.topics.length)}</div>
                                  <div><span className="font-medium">Data:</span> {String(event.data)}</div>
                                  <div><span className="font-medium">Log Index:</span> {String(event.logIndex)}</div>
                                </div>
                                {event.topics.length > 0 && (
                                  <div className="mt-2">
                                    <div className="font-medium text-xs text-gray-600">Topics:</div>
                                    {event.topics.map((topic: any, topicIndex: number) => (
                                      <div key={topicIndex} className="font-mono text-xs text-gray-500 break-all">
                                        {topicIndex}: {String(topic)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-gray-700 hover:text-gray-900">
                          View Full Receipt
                        </summary>
                        <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                          {typeof result.fullReceipt === 'object' 
                            ? JSON.stringify(result.fullReceipt, null, 2)
                            : typeof result === 'object' 
                              ? JSON.stringify(result, null, 2)
                              : String(result)
                          }
                        </pre>
                      </details>
                    </div>
                  </div>
                )}
                
                {!result.txHash && (
                  <div className="text-sm">
                    <pre className="bg-gray-100 p-3 rounded overflow-auto">
                      {typeof result === 'object' 
                        ? JSON.stringify(result, null, 2)
                        : String(result)
                      }
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}