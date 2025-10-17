// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@arcologynetwork/concurrentlib/lib/map/AddressU256Cum.sol";
import "@arcologynetwork/concurrentlib/lib/map/AddressUint256.sol";
import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";

/**
 * @title Market
 * @notice Prediction market with parallel betting support
 */
contract Market {
    
    // Market info
    uint256 public immutable marketId;
    string public question;
    uint256 public numOutcomes;
    uint256 public closingTime;
    address public creator;
    
    // Market state
    enum MarketState { OPEN, CLOSED, RESOLVED, FINALIZED, DISPUTED }
    MarketState public state;
    uint8 public winningOutcome;
    uint256 public disputeDeadline;
    
    // Concurrent data structures for parallel betting
    AddressU256CumMap public outcomePools;     // outcome address => total bet amount
    U256Cumulative public totalBets;
    U256Cumulative public totalVolume;
    
    // Dispute resolution (parallel-safe)
    AddressU256CumMap public disputeVotes;     // outcome address => total dispute stake
    
    // Events
    event BetPlaced(address indexed user, uint8 outcome, uint256 amount);
    event MarketClosed();
    event MarketResolved(uint8 winningOutcome);
    event DisputeSubmitted(address indexed disputer, uint8 outcome, uint256 stake);
    event MarketFinalized(uint8 finalOutcome);
    event WinningsClaimed(address indexed user, uint256 amount);
    
    constructor(
        uint256 _marketId,
        string memory _question,
        uint256 _numOutcomes,
        uint256 _closingTime,
        address _creator
    ) {
        marketId = _marketId;
        question = _question;
        numOutcomes = _numOutcomes;
        closingTime = _closingTime;
        creator = _creator;
        state = MarketState.OPEN;
        
        // Initialize concurrent structures
        outcomePools = new AddressU256CumMap();
        totalBets = new U256Cumulative(0, 1000000000);
        totalVolume = new U256Cumulative(0, type(uint256).max);
        disputeVotes = new AddressU256CumMap();
        
        // Pre-initialize all outcome pools with bounds
        for (uint8 i = 0; i < _numOutcomes; i++) {
            outcomePools.set(address(uint160(i)), 0, 0, type(uint256).max);
            disputeVotes.set(address(uint160(i)), 0, 0, type(uint256).max);
        }
    }
    
    /**
     * @notice Place a bet on an outcome
     * Multiple users can bet in parallel without conflicts
     */
    function placeBet(uint8 _outcome) external payable {
        // Update outcome pool - delta only (pre-initialized in constructor)
        outcomePools.set(address(uint160(_outcome)), int256(msg.value));
        
        // Update totals - these are U256Cumulative, safe for parallel adds
        totalBets.add(1);
        totalVolume.add(msg.value);
        
        emit BetPlaced(msg.sender, _outcome, msg.value);
    }
    
    /**
     * @notice Close market for betting
     */
    function closeMarket() external {
        require(msg.sender == creator || block.timestamp >= closingTime, "Not authorized");
        require(state == MarketState.OPEN, "Not open");
        
        state = MarketState.CLOSED;
        emit MarketClosed();
    }
    
    /**
     * @notice Resolve market with winning outcome
     * @dev Starts 24-hour dispute period
     */
    function resolveMarket(uint8 _winningOutcome) external {
        require(msg.sender == creator, "Only creator");
        require(state == MarketState.CLOSED, "Market not closed");
        require(_winningOutcome < numOutcomes, "Invalid outcome");
        
        winningOutcome = _winningOutcome;
        state = MarketState.RESOLVED;
        disputeDeadline = block.timestamp + 10; // 10 seconds for testing (use 24 hours in production)
        
        emit MarketResolved(_winningOutcome);
    }
    
    /**
     * @notice Submit dispute for market resolution
     * @dev PARALLEL SAFE: Multiple users can dispute simultaneously
     */
    function disputeResolution(uint8 _proposedOutcome) external payable {
        require(state == MarketState.RESOLVED, "Not in resolved state");
        require(block.timestamp < disputeDeadline, "Dispute period ended");
        require(_proposedOutcome < numOutcomes, "Invalid outcome");
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH stake");
        
        // Add to dispute votes - parallel safe (delta on pre-initialized entry)
        disputeVotes.set(address(uint160(_proposedOutcome)), int256(msg.value));
        
        emit DisputeSubmitted(msg.sender, _proposedOutcome, msg.value);
    }
    
    /**
     * @notice Finalize market after dispute period
     * @dev Checks if disputes overturn original resolution
     */
    function finalizeResolution() external {
        require(state == MarketState.RESOLVED, "Not resolved");
        require(block.timestamp >= disputeDeadline, "Dispute period not ended");
        
        // Find outcome with highest dispute stake
        uint8 finalOutcome = winningOutcome;
        uint256 maxStake = 0;
        
        for (uint8 i = 0; i < numOutcomes; i++) {
            uint256 stake = disputeVotes.get(address(uint160(i)));
            if (stake > maxStake) {
                maxStake = stake;
                finalOutcome = i;
            }
        }
        
        // If disputes overturn original resolution (require significant stake)
        if (maxStake > 1 ether && finalOutcome != winningOutcome) {
            winningOutcome = finalOutcome;
        }
        
        state = MarketState.FINALIZED;
        emit MarketFinalized(winningOutcome);
    }
    
    /**
     * @notice Get dispute votes for an outcome
     */
    function getDisputeVotes(uint8 _outcome) external returns (uint256) {
        return disputeVotes.get(address(uint160(_outcome)));
    }
    
    /**
     * @notice Claim winnings (simplified)
     */
    function claimWinnings() external view {
        require(state == MarketState.FINALIZED, "Not finalized yet");
        revert("Track bets off-chain via BetPlaced events");
    }
    
    /**
     * @notice Get pool amount for outcome (not view - modifies state)
     */
    function getOutcomePool(uint8 _outcome) external returns (uint256) {
        return outcomePools.get(address(uint160(_outcome)));
    }
    
    
    /**
     * @notice Get total bets count (not view - modifies state)
     */
    function getTotalBets() external returns (uint256) {
        return totalBets.get();
    }
    
    /**
     * @notice Get total volume (not view - modifies state)
     */
    function getTotalVolume() external returns (uint256) {
        return totalVolume.get();
    }
    
    /**
     * @notice Calculate current odds for all outcomes
     */
    function getCurrentOdds() external returns (uint256[] memory odds) {
        odds = new uint256[](numOutcomes);
        uint256 totalPool = totalVolume.get();
        
        if (totalPool == 0) {
            // Equal odds if no bets
            uint256 equalOdds = 10000 / numOutcomes;
            for (uint8 i = 0; i < numOutcomes; i++) {
                odds[i] = equalOdds;
            }
        } else {
            // Odds based on pool sizes
            for (uint8 i = 0; i < numOutcomes; i++) {
                uint256 pool = outcomePools.get(address(uint160(i)));
                odds[i] = (pool * 10000) / totalPool;  // basis points
            }
        }
        
        return odds;
    }
    
    receive() external payable {}
}
