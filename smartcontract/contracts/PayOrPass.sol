// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PayOrPass
 * @notice Elite Social Payment Game on Celo - Yield-Generating "Hot Potato" Pressure Arena.
 * Players pass the "potato" which compounds yield virtually at 5% APY based on block timestamp.
 * If a player times out, their entry/reputation is forfeited and distributed as high-velocity dividends
 * to all previous players who successfully passed the chain!
 */
contract PayOrPass is Ownable, ReentrancyGuard {
    // Chain state
    struct Chain {
        address originator;      // Who started the chain
        address currentHolder;   // Who currently has the chain
        uint256 amount;          // Current base amount (in wei/token units)
        uint256 createdAt;       // Chain creation time
        uint256 lastActionAt;    // Last action timestamp
        uint256 passCount;       // Number of passes
        uint256 multiplier;      // Multiplier (e.g., 12000 = 120%)
        address tokenAddress;    // Token (address(0) = native)
        ChainStatus status;      // Active, Completed, TimedOut
    }

    // Player pass record
    struct PassRecord {
        uint256 chainId;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
    }

    enum ChainStatus { Active, Completed, TimedOut }

    // Chain storage
    mapping(uint256 => Chain) public chains;
    mapping(uint256 => PassRecord[]) public chainPasses;
    mapping(address => uint256[]) public playerChains;
    mapping(address => uint256) public playerTotalPaid;
    mapping(address => uint256) public playerTotalReceived;

    // Global state
    uint256 public chainCounter;
    uint256 public defaultTimeout;      // Seconds before auto-pay (e.g., 1 hour)
    uint256 public defaultMultiplier;   // Basis points (e.g., 12000 = 120%)
    uint256 public totalChains;
    uint256 public totalCompletedChains;

    // Supported tokens
    mapping(address => bool) public supportedTokens;

    // Yield Compounding Configuration
    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public apyBasisPoints = 500;       // 5% APY — governable
    uint256 public blacklistThreshold = 20;    // Min reputation before auto-blacklist — governable
    uint256 public defaultReputation = 100;    // Starting reputation for new players — governable

    // Dividends Ledger
    // claimableDividends[player][token] => Earned dividends
    mapping(address => mapping(address => uint256)) public claimableDividends;

    // Reputation Credit Engine
    mapping(address => uint256) public playerReputation;
    mapping(address => bool) public blacklisted;

    // Events
    event ChainCreated(
        uint256 indexed chainId,
        address indexed originator,
        address token,
        uint256 amount,
        uint256 multiplier
    );
    event PayAction(
        uint256 indexed chainId,
        address indexed payer,
        uint256 amount
    );
    event PassAction(
        uint256 indexed chainId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 newAmount
    );
    event ChainTimedOut(
        uint256 indexed chainId,
        address indexed finalHolder,
        uint256 amount
    );
    event DividendsClaimed(address indexed player, address indexed token, uint256 amount);
    event ReputationUpdated(address indexed player, uint256 newScore, string reason);

    // Errors
    error ChainNotFound();
    error ChainNotActive();
    error NotChainHolder();
    error TokenNotSupported();
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error ChainAlreadyCompleted();
    error PlayerBlacklisted();

    constructor(uint256 _defaultTimeout, uint256 _defaultMultiplier) Ownable(msg.sender) {
        defaultTimeout = _defaultTimeout;
        defaultMultiplier = _defaultMultiplier;

        // Native token always supported
        supportedTokens[address(0)] = true;
    }

    modifier onlyActivePlayer() {
        if (blacklisted[msg.sender]) revert PlayerBlacklisted();
        _;
    }

    // ---------------------------------------------
    // YIELD ENGINE (Compounding simulated yield)
    // ---------------------------------------------

    /**
     * @notice Calculate current base amount with virtually compounded yield.
     * Compounds virtually at 5% APY based on elapsed block timestamp after 60 seconds.
     */
    function getCurrentChainAmount(uint256 _chainId) public view returns (uint256) {
        Chain memory chain = chains[_chainId];
        if (chain.status != ChainStatus.Active) {
            return chain.amount;
        }
        uint256 elapsed = block.timestamp - chain.lastActionAt;
        if (elapsed < 60) {
            return chain.amount;
        }
        uint256 yield = (elapsed * chain.amount * apyBasisPoints) / (SECONDS_IN_YEAR * 10000);
        return chain.amount + yield;
    }

    /**
     * @notice Calculate next pass amount incorporating yield.
     */
    function getNextAmount(uint256 _chainId) public view returns (uint256) {
        uint256 currentAmount = getCurrentChainAmount(_chainId);
        Chain memory chain = chains[_chainId];
        return (currentAmount * chain.multiplier) / 10000;
    }

    /**
     * @notice Get reputation score for a player (defaults to 100).
     */
    function getReputation(address player) public view returns (uint256) {
        uint256 score = playerReputation[player];
        return score == 0 ? defaultReputation : score;
    }

    // ---------------------------------------------
    // CORE GAME ACTIONS
    // ---------------------------------------------

    function createChain(
        address _token,
        uint256 _amount
    ) external payable onlyActivePlayer returns (uint256) {
        if (_token != address(0)) {
            if (!supportedTokens[_token]) revert TokenNotSupported();
            if (_amount == 0) revert InvalidAmount();

            bool success = IERC20(_token).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
            if (!success) revert TransferFailed();
        } else {
            if (msg.value != _amount) revert InvalidAmount();
        }

        chainCounter++;
        uint256 chainId = chainCounter;

        chains[chainId] = Chain({
            originator: msg.sender,
            currentHolder: msg.sender,
            amount: _amount,
            createdAt: block.timestamp,
            lastActionAt: block.timestamp,
            passCount: 0,
            multiplier: defaultMultiplier,
            tokenAddress: _token,
            status: ChainStatus.Active
        });

        playerChains[msg.sender].push(chainId);

        // Boost reputation slightly for creating games
        _updateReputation(msg.sender, 5, true);

        emit ChainCreated(
            chainId,
            msg.sender,
            _token,
            _amount,
            defaultMultiplier
        );

        totalChains++;
        return chainId;
    }

    /**
     * @notice Pay - end the chain by absorbing the cost.
     */
    function pay(uint256 _chainId) external payable nonReentrant onlyActivePlayer {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();

        // Calculate dynamic payment amount with yield
        uint256 currentAmount = getCurrentChainAmount(_chainId);
        address token = chain.tokenAddress;
        address payer = msg.sender;

        // Mark as completed before transfers to prevent reentrancy
        chain.status = ChainStatus.Completed;
        chain.lastActionAt = block.timestamp;

        // Transfer tokens/ETH from payer to this contract
        if (token == address(0)) {
            if (msg.value != currentAmount) revert InvalidAmount();
        } else {
            bool success = IERC20(token).transferFrom(
                payer,
                address(this),
                currentAmount
            );
            if (!success) revert TransferFailed();
        }

        playerTotalPaid[payer] += currentAmount;

        // Boost reputation for paying timely
        _updateReputation(payer, 10, true);

        // Distribute dividends to all previous players who passed!
        _distributeDividends(_chainId, currentAmount);

        emit PayAction(_chainId, payer, currentAmount);

        totalCompletedChains++;
    }

    /**
     * @notice Pass - send increased amount to another user.
     */
    function pass(
        uint256 _chainId,
        address _to
    ) external nonReentrant onlyActivePlayer {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();
        if (chain.currentHolder != msg.sender) revert NotChainHolder();
        if (_to == address(0)) revert InvalidAddress();
        if (blacklisted[_to]) revert PlayerBlacklisted();

        // Calculate next escalated amount
        uint256 currentAmount = getCurrentChainAmount(_chainId);
        uint256 newAmount = (currentAmount * chain.multiplier) / 10000;

        // Record the pass
        chainPasses[_chainId].push(PassRecord({
            chainId: _chainId,
            from: msg.sender,
            to: _to,
            amount: currentAmount,
            timestamp: block.timestamp
        }));

        // Update chain state
        chain.amount = newAmount;
        chain.currentHolder = _to;
        chain.passCount++;
        chain.lastActionAt = block.timestamp;

        // Transfer funds from contract to new holder
        address token = chain.tokenAddress;
        if (token == address(0)) {
            uint256 bal = address(this).balance;
            uint256 transferAmt = currentAmount > bal ? bal : currentAmount;
            if (transferAmt > 0) {
                (bool success, ) = _to.call{value: transferAmt}("");
                if (!success) revert TransferFailed();
            }
        } else {
            uint256 bal = IERC20(token).balanceOf(address(this));
            uint256 transferAmt = currentAmount > bal ? bal : currentAmount;
            if (transferAmt > 0) {
                bool success = IERC20(token).transfer(_to, transferAmt);
                if (!success) revert TransferFailed();
            }
        }

        playerTotalReceived[_to] += currentAmount;
        playerTotalPaid[msg.sender] += currentAmount;
        playerChains[_to].push(_chainId);

        // Boost reputation for passing successfully
        _updateReputation(msg.sender, 5, true);

        emit PassAction(_chainId, msg.sender, _to, currentAmount, newAmount);
    }

    /**
     * @notice Trigger timeout - auto-pay / declare loser if holder hasn't acted in time.
     */
    function triggerTimeout(uint256 _chainId) external nonReentrant {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();
        if (block.timestamp < chain.lastActionAt + defaultTimeout) {
            revert("Timeout not reached");
        }

        chain.status = ChainStatus.TimedOut;
        uint256 finalAmount = getCurrentChainAmount(_chainId);
        address holder = chain.currentHolder;

        // Holder is declared Loser. Reputation takes a massive penalty.
        _updateReputation(holder, 50, false);

        // Attempt to liquidate holder's deposit or collect forfeit penalty if allowed
        // Previous players share dividends from the accumulated pool in contract
        _distributeDividends(_chainId, finalAmount);

        emit ChainTimedOut(_chainId, holder, finalAmount);
        totalCompletedChains++;
    }

    // ---------------------------------------------
    // DIVIDENDS & REPUTATION ENGINE
    // ---------------------------------------------

    /**
     * @notice Distribute final accumulated wagers/yields to previous players who passed.
     */
    function _distributeDividends(uint256 _chainId, uint256 _amount) internal {
        Chain memory chain = chains[_chainId];
        PassRecord[] memory passes = chainPasses[_chainId];
        uint256 numRecipients = passes.length + 1; // Passes + Originator

        uint256 share = _amount / numRecipients;
        if (share == 0) return;

        address token = chain.tokenAddress;

        // Originator gets their share
        claimableDividends[chain.originator][token] += share;

        // All successful passers get their share
        for (uint256 i = 0; i < passes.length; i++) {
            claimableDividends[passes[i].from][token] += share;
        }
    }

    /**
     * @notice Claim accumulated dividends.
     */
    function claimDividends(address _token) external nonReentrant {
        uint256 amount = claimableDividends[msg.sender][_token];
        if (amount == 0) revert InvalidAmount();

        claimableDividends[msg.sender][_token] = 0;

        if (_token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            bool success = IERC20(_token).transfer(msg.sender, amount);
            if (!success) revert TransferFailed();
        }

        emit DividendsClaimed(msg.sender, _token, amount);
    }

    function _updateReputation(address player, uint256 points, bool increase) internal {
        uint256 currentScore = getReputation(player);
        uint256 newScore;
        if (increase) {
            newScore = currentScore + points;
        } else {
            newScore = currentScore > points ? currentScore - points : 1;
        }

        playerReputation[player] = newScore;

        // Auto-blacklist if reputation drops below configurable threshold
        if (newScore < blacklistThreshold) {
            blacklisted[player] = true;
        }

        emit ReputationUpdated(player, newScore, increase ? "achievement" : "penalty");
    }

    // ---------------------------------------------
    // ADMIN FUNCTIONS
    // ---------------------------------------------

    function setTimeout(uint256 _timeout) external onlyOwner {
        defaultTimeout = _timeout;
    }

    function setMultiplier(uint256 _multiplier) external onlyOwner {
        defaultMultiplier = _multiplier;
    }

    function addToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    /// @notice Governance: update the virtual APY used in yield compounding
    function setApyBasisPoints(uint256 _apyBasisPoints) external onlyOwner {
        apyBasisPoints = _apyBasisPoints;
    }

    /// @notice Governance: update the reputation floor below which players are auto-blacklisted
    function setBlacklistThreshold(uint256 _threshold) external onlyOwner {
        blacklistThreshold = _threshold;
    }

    /// @notice Governance: update the default starting reputation for new players
    function setDefaultReputation(uint256 _defaultReputation) external onlyOwner {
        defaultReputation = _defaultReputation;
    }

    // ---------------------------------------------
    // UTILITY VIEWS
    // ---------------------------------------------

    function getPasses(uint256 _chainId) external view returns (PassRecord[] memory) {
        return chainPasses[_chainId];
    }

    function getPlayerChains(address _player) external view returns (uint256[] memory) {
        return playerChains[_player];
    }

    function isTimeoutReached(uint256 _chainId) external view returns (bool) {
        Chain memory chain = chains[_chainId];
        return block.timestamp >= chain.lastActionAt + defaultTimeout;
    }

    function _getChain(uint256 _chainId) internal view returns (Chain storage) {
        if (_chainId == 0 || _chainId > chainCounter) revert ChainNotFound();
        return chains[_chainId];
    }

    receive() external payable {}
}
