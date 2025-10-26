// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Market.sol";

/**
 * @title MarketFactory
 * @notice Factory for creating prediction markets (Standard EVM)
 * @dev Converted from Arcology concurrent version
 */
contract MarketFactory {
    
    // Market tracking (Standard EVM storage)
    mapping(uint256 => address) public markets;     // marketId => market address
    uint256 public totalMarketsCreated;
    uint256 public totalProtocolVolume;
    
    uint256 public marketIdCounter;
    uint256 public minimumDeposit;
    
    // Additional tracking
    address[] public allMarkets;                    // List of all market addresses
    mapping(address => uint256[]) public userMarkets; // creator => marketIds
    
    // Events
    event MarketCreated(
        uint256 indexed marketId, 
        address indexed marketAddress, 
        address indexed creator, 
        string question
    );
    
    constructor(uint256 _minimumDeposit) {
        minimumDeposit = _minimumDeposit;
        marketIdCounter = 0;
        totalMarketsCreated = 0;
        totalProtocolVolume = 0;
    }
    
    /**
     * @notice Create a new prediction market
     */
    function createMarket(
        string memory _question,
        uint256 _numOutcomes,
        uint256 _closingTime
    ) external payable returns (uint256 marketId) {
        require(msg.value >= minimumDeposit, "Insufficient deposit");
        require(_numOutcomes >= 2, "Need at least 2 outcomes");
        require(_numOutcomes <= 10, "Maximum 10 outcomes");
        require(_closingTime > block.timestamp, "Closing time must be future");
        
        // Generate market ID
        marketId = marketIdCounter;
        marketIdCounter++;
        
        // Deploy new Market contract
        Market newMarket = new Market(
            marketId,
            _question,
            _numOutcomes,
            _closingTime,
            msg.sender
        );
        
        // Store market address
        address marketAddr = address(newMarket);
        markets[marketId] = marketAddr;
        allMarkets.push(marketAddr);
        userMarkets[msg.sender].push(marketId);
        
        // Update counters
        totalMarketsCreated++;
        totalProtocolVolume += msg.value;
        
        // Transfer deposit to market
        payable(marketAddr).transfer(msg.value);
        
        emit MarketCreated(marketId, marketAddr, msg.sender, _question);
        
        return marketId;
    }
    
    /**
     * @notice Get market address by ID
     */
    function getMarket(uint256 _marketId) external view returns (address) {
        return markets[_marketId];
    }
    
    /**
     * @notice Get total markets created
     */
    function getTotalMarkets() external view returns (uint256) {
        return totalMarketsCreated;
    }
    
    /**
     * @notice Get total protocol volume
     */
    function getTotalVolume() external view returns (uint256) {
        return totalProtocolVolume;
    }
    
    /**
     * @notice Get all markets created by a user
     */
    function getUserMarkets(address _user) external view returns (uint256[] memory) {
        return userMarkets[_user];
    }
    
    /**
     * @notice Get all market addresses
     */
    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }
    
    /**
     * @notice Get market count
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }
    
    /**
     * @notice Check if market exists
     */
    function marketExists(uint256 _marketId) external view returns (bool) {
        return markets[_marketId] != address(0);
    }
    
    /**
     * @notice Update minimum deposit (owner only - add access control if needed)
     */
    function updateMinimumDeposit(uint256 _newMinimum) external {
        // Add access control here if needed
        minimumDeposit = _newMinimum;
    }
}
