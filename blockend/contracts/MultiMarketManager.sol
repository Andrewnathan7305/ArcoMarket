// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MarketFactory.sol";
import "./Market.sol";

/**
 * @title MultiMarketManager
 * @notice Manage batch operations across multiple markets
 */
contract MultiMarketManager {
    
    MarketFactory public factory;
    
    struct ParlayBet {
        uint256[] marketIds;
        uint8[] outcomes;
        uint256 totalStake;
        address bettor;
        bool claimed;
        uint256 createdAt;
    }
    
    mapping(bytes32 => ParlayBet) public parlays;
    mapping(address => bytes32[]) public userParlays;
    
    event BatchBetsPlaced(address indexed user, uint256[] marketIds, uint256 totalAmount);
    event ParlayCreated(bytes32 indexed parlayId, address indexed bettor, uint256 totalStake, uint256 numMarkets);
    event ParlayResolved(bytes32 indexed parlayId, bool won, uint256 payout);
    
    constructor(address _factory) {
        factory = MarketFactory(_factory);
    }
    
    /**
     * @notice Place bets on multiple markets at once
     * Demonstrates cross-market atomic operations
     */
    function batchBet(
        uint256[] memory _marketIds,
        uint8[] memory _outcomes,
        uint256[] memory _amounts
    ) external payable {
        require(_marketIds.length == _outcomes.length, "Length mismatch");
        require(_marketIds.length == _amounts.length, "Length mismatch");
        
        uint256 totalRequired = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalRequired += _amounts[i];
        }
        require(msg.value >= totalRequired, "Insufficient value");
        
        // Place bets on each market
        for (uint256 i = 0; i < _marketIds.length; i++) {
            address marketAddr = factory.getMarket(_marketIds[i]);
            require(marketAddr != address(0), "Market not found");
            
            Market market = Market(payable(marketAddr));
            market.placeBet{value: _amounts[i]}(_outcomes[i]);
        }
        
        emit BatchBetsPlaced(msg.sender, _marketIds, totalRequired);
    }
    
    /**
     * @notice Get stats for multiple markets
     */
    function getBatchStats(uint256[] memory _marketIds) external returns (
        uint256[] memory totalBets,
        uint256[] memory totalVolumes
    ) {
        totalBets = new uint256[](_marketIds.length);
        totalVolumes = new uint256[](_marketIds.length);
        
        for (uint256 i = 0; i < _marketIds.length; i++) {
            address marketAddr = factory.getMarket(_marketIds[i]);
            if (marketAddr != address(0)) {
                Market market = Market(payable(marketAddr));
                totalBets[i] = market.getTotalBets();
                totalVolumes[i] = market.getTotalVolume();
            }
        }
        
        return (totalBets, totalVolumes);
    }
    
    /**
     * @notice Get portfolio stats across multiple markets
     * Note: Per-user tracking removed for parallel safety
     */
    function getPortfolio(uint256[] memory _marketIds, address _user) external returns (
        uint256 totalMarkets
    ) {
        totalMarkets = _marketIds.length;
        return totalMarkets;
    }
    
    /**
     * @notice Claim winnings from multiple markets
     */
    function batchClaim(uint256[] memory _marketIds) external {
        for (uint256 i = 0; i < _marketIds.length; i++) {
            address marketAddr = factory.getMarket(_marketIds[i]);
            if (marketAddr != address(0)) {
                Market market = Market(payable(marketAddr));
                try market.claimWinnings() {
                    // Success
                } catch {
                    // Skip if claim fails
                }
            }
        }
    }
    
    // ============ Parlay Betting ============
    
    /**
     * @notice Create a parlay bet across multiple markets
     * @dev Atomic operation - all bets succeed or all fail
     * Example: Bet that Democrats win Presidency, Senate, and House
     */
    function createParlay(
        uint256[] memory _marketIds,
        uint8[] memory _outcomes
    ) external payable returns (bytes32 parlayId) {
        require(_marketIds.length == _outcomes.length, "Array length mismatch");
        require(_marketIds.length >= 2, "Need at least 2 markets for parlay");
        require(_marketIds.length <= 10, "Maximum 10 markets per parlay");
        require(msg.value > 0, "Need stake amount");
        
        // Generate unique parlay ID
        parlayId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            _marketIds,
            block.number
        ));
        
        require(parlays[parlayId].bettor == address(0), "Parlay ID collision");
        
        // Calculate stake per market
        uint256 stakePerMarket = msg.value / _marketIds.length;
        require(stakePerMarket > 0, "Stake too small");
        
        // ATOMIC: Place bets on all markets (all succeed or all fail)
        for (uint256 i = 0; i < _marketIds.length; i++) {
            address marketAddr = factory.getMarket(_marketIds[i]);
            require(marketAddr != address(0), "Market not found");
            
            Market market = Market(payable(marketAddr));
            require(market.state() == Market.MarketState.OPEN, "Market not open");
            
            market.placeBet{value: stakePerMarket}(_outcomes[i]);
        }
        
        // Store parlay info
        parlays[parlayId] = ParlayBet({
            marketIds: _marketIds,
            outcomes: _outcomes,
            totalStake: msg.value,
            bettor: msg.sender,
            claimed: false,
            createdAt: block.timestamp
        });
        
        userParlays[msg.sender].push(parlayId);
        
        emit ParlayCreated(parlayId, msg.sender, msg.value, _marketIds.length);
        
        return parlayId;
    }
    
    /**
     * @notice Check if parlay won (all predictions correct)
     * @dev Reads across multiple markets
     */
    function checkParlayStatus(bytes32 _parlayId)
        external
        returns (
            bool allFinalized,
            bool allCorrect,
            uint256 potentialPayout
        )
    {
        ParlayBet storage parlay = parlays[_parlayId];
        require(parlay.bettor != address(0), "Parlay not found");
        
        allFinalized = true;
        allCorrect = true;
        uint256 multipliedOdds = 10000; // Start at 1.0 (basis points)
        
        for (uint256 i = 0; i < parlay.marketIds.length; i++) {
            address marketAddr = factory.getMarket(parlay.marketIds[i]);
            Market market = Market(payable(marketAddr));
            
            // Check if finalized
            if (market.state() != Market.MarketState.FINALIZED) {
                allFinalized = false;
                allCorrect = false;
                break;
            }
            
            // Check if outcome matches prediction
            if (market.winningOutcome() != parlay.outcomes[i]) {
                allCorrect = false;
            }
            
            // Calculate multiplied odds (simplified: 2x per correct leg)
            multipliedOdds = (multipliedOdds * 20000) / 10000;
        }
        
        if (allFinalized && allCorrect) {
            potentialPayout = (parlay.totalStake * multipliedOdds) / 10000;
        } else {
            potentialPayout = 0;
        }
        
        return (allFinalized, allCorrect, potentialPayout);
    }
    
    /**
     * @notice Claim parlay winnings if all markets resolved correctly
     */
    function claimParlay(bytes32 _parlayId) external returns (uint256 payout) {
        ParlayBet storage parlay = parlays[_parlayId];
        require(parlay.bettor == msg.sender, "Not parlay owner");
        require(!parlay.claimed, "Already claimed");
        
        bool allFinalized = true;
        bool allCorrect = true;
        
        // Verify all markets resolved correctly
        for (uint256 i = 0; i < parlay.marketIds.length; i++) {
            address marketAddr = factory.getMarket(parlay.marketIds[i]);
            Market market = Market(payable(marketAddr));
            
            if (market.state() != Market.MarketState.FINALIZED) {
                allFinalized = false;
                break;
            }
            
            if (market.winningOutcome() != parlay.outcomes[i]) {
                allCorrect = false;
                break;
            }
        }
        
        require(allFinalized, "Not all markets finalized");
        require(allCorrect, "Parlay lost");
        
        parlay.claimed = true;
        
        // Calculate payout (2x per leg)
        uint256 multiplier = 2 ** parlay.marketIds.length;
        payout = parlay.totalStake * multiplier;
        
        if (payout > address(this).balance) {
            payout = address(this).balance;
        }
        
        payable(msg.sender).transfer(payout);
        
        emit ParlayResolved(_parlayId, true, payout);
        
        return payout;
    }
    
    /**
     * @notice Get all parlays for a user
     */
    function getUserParlays(address _user) external view returns (bytes32[] memory) {
        return userParlays[_user];
    }
    
    /**
     * @notice Get parlay details
     */
    function getParlayDetails(bytes32 _parlayId)
        external
        view
        returns (ParlayBet memory)
    {
        return parlays[_parlayId];
    }
    
    receive() external payable {}
}
