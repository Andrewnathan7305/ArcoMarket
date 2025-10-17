// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Market.sol";
import "@arcologynetwork/concurrentlib/lib/map/AddressUint256.sol";
import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";

/**
 * @title MarketFactory
 * @notice Factory for creating prediction markets
 */
contract MarketFactory {
    
    // Market tracking
    AddressUint256Map public markets;          // marketId => market address
    U256Cumulative public totalMarketsCreated;
    U256Cumulative public totalProtocolVolume;
    
    uint256 public marketIdCounter;
    uint256 public minimumDeposit;
    
    // Events
    event MarketCreated(uint256 indexed marketId, address marketAddress, address creator, string question);
    
    constructor(uint256 _minimumDeposit) {
        minimumDeposit = _minimumDeposit;
        marketIdCounter = 0;
        
        // Initialize concurrent structures
        markets = new AddressUint256Map();
        totalMarketsCreated = new U256Cumulative(0, 1000000000);
        totalProtocolVolume = new U256Cumulative(0, type(uint256).max);
    }
    
    /**
     * @notice Create a new prediction market
     * Multiple users can create markets in parallel
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
        markets.set(address(uint160(marketId)), uint256(uint160(marketAddr)));
        
        // Update counters
        totalMarketsCreated.add(1);
        
        // Transfer deposit to market
        payable(address(newMarket)).transfer(msg.value);
        
        emit MarketCreated(marketId, marketAddr, msg.sender, _question);
        
        return marketId;
    }
    
    /**
     * @notice Get market address by ID (not view - modifies state)
     */
    function getMarket(uint256 _marketId) external returns (address) {
        uint256 addrAsUint = markets.get(address(uint160(_marketId)));
        return address(uint160(addrAsUint));
    }
    
    /**
     * @notice Get total markets created (not view - modifies state)
     */
    function getTotalMarkets() external returns (uint256) {
        return totalMarketsCreated.get();
    }
    
    /**
     * @notice Get total protocol volume (not view - modifies state)
     */
    function getTotalVolume() external returns (uint256) {
        return totalProtocolVolume.get();
    }
}
