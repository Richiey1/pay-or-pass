// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PayOrPass
 * @notice Social payment game where players choose to pay or pass increased amounts
 * @dev A chain-based minigame with time constraints and social dynamics
 */
contract PayOrPass is Ownable, ReentrancyGuard {
    // Chain state
    struct Chain {
        address originator;      // Who started the chain
        address currentHolder;   // Who currently has the chain
        uint256 amount;          // Current amount (in wei/token units)
        uint256 createdAt;       // Chain creation time
        uint256 lastActionAt;    // Last action timestamp
        uint256 passCount;       // Number of passes
        uint256 multiplier;      // Multiplier (e.g., 120 = 120%)
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

    // Errors
    error ChainNotFound();
    error ChainNotActive();
    error NotChainHolder();
    error TokenNotSupported();
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();
    error ChainAlreadyCompleted();

    constructor(uint256 _defaultTimeout, uint256 _defaultMultiplier) Ownable(msg.sender) {
        defaultTimeout = _defaultTimeout;
        defaultMultiplier = _defaultMultiplier;

        // Native token always supported
        supportedTokens[address(0)] = true;
    }

    function createChain(
        address _token,
        uint256 _amount
    ) external payable returns (uint256) {
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
     * @notice Pay - end the chain by absorbing the cost
     */
    function pay(uint256 _chainId) external payable nonReentrant {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();

        // Mark as completed
        chain.status = ChainStatus.Completed;
        chain.lastActionAt = block.timestamp;

        uint256 amount = chain.amount;
        address token = chain.tokenAddress;
        address payer = msg.sender;

        // Transfer tokens/ETH from payer to this contract (burn/collect)
        if (token == address(0)) {
            if (msg.value != amount) revert InvalidAmount();
        } else {
            bool success = IERC20(token).transferFrom(
                payer,
                address(this),
                amount
            );
            if (!success) revert TransferFailed();
        }

        playerTotalPaid[payer] += amount;

        emit PayAction(_chainId, payer, amount);

        totalCompletedChains++;
    }

    /**
     * @notice Pass - send increased amount to another user
     */
    function pass(
        uint256 _chainId,
        address _to
    ) external nonReentrant {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();
        if (chain.currentHolder != msg.sender) revert NotChainHolder();
        if (_to == address(0)) revert InvalidAddress();

        // Calculate new amount
        uint256 currentAmount = chain.amount;
        uint256 newAmount = (currentAmount * chain.multiplier) / 10000;

        // Record the pass
        chainPasses[_chainId].push(PassRecord({
            chainId: _chainId,
            from: msg.sender,
            to: _to,
            amount: currentAmount,
            timestamp: block.timestamp
        }));

        // Update chain
        chain.amount = newAmount;
        chain.currentHolder = _to;
        chain.passCount++;
        chain.lastActionAt = block.timestamp;

        // Transfer funds from current holder to new holder
        address token = chain.tokenAddress;
        if (token == address(0)) {
            (bool success, ) = _to.call{value: currentAmount}("");
            if (!success) revert TransferFailed();
        } else {
            bool success = IERC20(token).transfer(_to, currentAmount);
            if (!success) revert TransferFailed();
        }

        playerTotalReceived[_to] += currentAmount;
        playerTotalPaid[msg.sender] += currentAmount;
        playerChains[_to].push(_chainId);

        emit PassAction(_chainId, msg.sender, _to, currentAmount, newAmount);
    }

    /**
     * @notice Trigger timeout - auto-pay if holder hasn't acted
     */
    function triggerTimeout(uint256 _chainId) external nonReentrant {
        Chain storage chain = _getChain(_chainId);

        if (chain.status != ChainStatus.Active) revert ChainAlreadyCompleted();
        if (block.timestamp < chain.lastActionAt + defaultTimeout) {
            revert("Timeout not reached");
        }

        chain.status = ChainStatus.TimedOut;
        uint256 amount = chain.amount;
        address token = chain.tokenAddress;
        address holder = chain.currentHolder;

        // Auto-collect from holder (simplified: collect from contract balance)
        // In practice, need pull pattern

        emit ChainTimedOut(_chainId, holder, amount);
        totalCompletedChains++;
    }

    /**
     * @notice Admin: Set default timeout
     */
    function setTimeout(uint256 _timeout) external onlyOwner {
        defaultTimeout = _timeout;
    }

    /**
     * @notice Admin: Set default multiplier (basis points)
     */
    function setMultiplier(uint256 _multiplier) external onlyOwner {
        defaultMultiplier = _multiplier;
    }

    /**
     * @notice Admin: Add supported token
     */
    function addToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    /**
     * @notice Get chain pass history
     */
    function getPasses(uint256 _chainId) external view returns (PassRecord[] memory) {
        return chainPasses[_chainId];
    }

    /**
     * @notice Get player chains
     */
    function getPlayerChains(address _player) external view returns (uint256[] memory) {
        return playerChains[_player];
    }

    /**
     * @notice Check if timeout reached
     */
    function isTimeoutReached(uint256 _chainId) external view returns (bool) {
        Chain memory chain = chains[_chainId];
        return block.timestamp >= chain.lastActionAt + defaultTimeout;
    }

    /**
     * @notice Calculate next pass amount
     */
    function getNextAmount(uint256 _chainId) external view returns (uint256) {
        Chain memory chain = chains[_chainId];
        return (chain.amount * chain.multiplier) / 10000;
    }

    function _getChain(uint256 _chainId) internal view returns (Chain storage) {
        if (_chainId == 0 || _chainId > chainCounter) revert ChainNotFound();
        return chains[_chainId];
    }

    receive() external payable {}
}
