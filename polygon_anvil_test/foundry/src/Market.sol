// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Market
 * @notice Prediction market (Standard EVM - Sequential Execution)
 * @dev Converted from Arcology concurrent version
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
    
    // Standard EVM storage (replacing concurrent structures)
    mapping(uint8 => uint256) public outcomePools;      // outcome => total bet amount
    mapping(address => mapping(uint8 => uint256)) public userBets; // user => outcome => amount
    uint256 public totalBets;
    uint256 public totalVolume;
    
    // Dispute resolution
    mapping(uint8 => uint256) public disputeVotes;      // outcome => total dispute stake
    mapping(address => mapping(uint8 => uint256)) public userDisputes; // track disputes
    
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
    }
    
    /**
     * @notice Place a bet on an outcome
     */
    function placeBet(uint8 _outcome) external payable {
        require(state == MarketState.OPEN, "Market not open");
        require(_outcome < numOutcomes, "Invalid outcome");
        require(msg.value > 0, "Must bet something");
        
        // Update outcome pool
        outcomePools[_outcome] += msg.value;
        
        // Track user bet
        userBets[msg.sender][_outcome] += msg.value;
        
        // Update totals
        totalBets += 1;
        totalVolume += msg.value;
        
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
        disputeDeadline = block.timestamp + 10; // 10 seconds for testing
        
        emit MarketResolved(_winningOutcome);
    }
    
    /**
     * @notice Submit dispute for market resolution
     */
    function disputeResolution(uint8 _proposedOutcome) external payable {
        require(state == MarketState.RESOLVED, "Not in resolved state");
        require(block.timestamp < disputeDeadline, "Dispute period ended");
        require(_proposedOutcome < numOutcomes, "Invalid outcome");
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH stake");
        
        // Add to dispute votes
        disputeVotes[_proposedOutcome] += msg.value;
        userDisputes[msg.sender][_proposedOutcome] += msg.value;
        
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
            if (disputeVotes[i] > maxStake) {
                maxStake = disputeVotes[i];
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
    function getDisputeVotes(uint8 _outcome) external view returns (uint256) {
        return disputeVotes[_outcome];
    }
    
    /**
     * @notice Calculate winnings for a user
     */
    function calculateWinnings(address _user) public view returns (uint256) {
        require(state == MarketState.FINALIZED, "Not finalized");
        
        uint256 userWinningBet = userBets[_user][winningOutcome];
        if (userWinningBet == 0) return 0;
        
        uint256 winningPool = outcomePools[winningOutcome];
        if (winningPool == 0) return 0;
        
        // User's share of winning pool * total volume
        return (userWinningBet * totalVolume) / winningPool;
    }
    
    /**
     * @notice Claim winnings
     */
    function claimWinnings() external {
        require(state == MarketState.FINALIZED, "Not finalized yet");
        
        uint256 winnings = calculateWinnings(msg.sender);
        require(winnings > 0, "No winnings");
        
        // Mark as claimed
        userBets[msg.sender][winningOutcome] = 0;
        
        // Transfer winnings
        (bool success, ) = msg.sender.call{value: winnings}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(msg.sender, winnings);
    }
    
    /**
     * @notice Get pool amount for outcome
     */
    function getOutcomePool(uint8 _outcome) external view returns (uint256) {
        return outcomePools[_outcome];
    }
    
    /**
     * @notice Get total bets count
     */
    function getTotalBets() external view returns (uint256) {
        return totalBets;
    }
    
    /**
     * @notice Get total volume
     */
    function getTotalVolume() external view returns (uint256) {
        return totalVolume;
    }
    
    /**
     * @notice Get user's bet on an outcome
     */
    function getUserBet(address _user, uint8 _outcome) external view returns (uint256) {
        return userBets[_user][_outcome];
    }
    
    /**
     * @notice Calculate current odds for all outcomes
     */
    function getCurrentOdds() external view returns (uint256[] memory odds) {
        odds = new uint256[](numOutcomes);
        
        if (totalVolume == 0) {
            // Equal odds if no bets
            uint256 equalOdds = 10000 / numOutcomes;
            for (uint8 i = 0; i < numOutcomes; i++) {
                odds[i] = equalOdds;
            }
        } else {
            // Odds based on pool sizes (in basis points)
            for (uint8 i = 0; i < numOutcomes; i++) {
                odds[i] = (outcomePools[i] * 10000) / totalVolume;
            }
        }
        
        return odds;
    }
    
    receive() external payable {}
}
