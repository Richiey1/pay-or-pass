// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IYieldProtocol {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

interface IYieldToken {
    function balanceOf(address user) external view returns (uint256);
}

contract PayOrPass is ReentrancyGuard {
    
    struct Gladiator {
        address player;
        uint256 principalStaked;
        uint256 totalYieldWon;
        uint256 wins;
        uint256 losses;
        uint256 lastFightAt;
        bool isActive;
        address stakeToken;
    }

    mapping(address => Gladiator) public gladiators;
    address[] public activePlayers;
    
    mapping(address => uint256) public totalSimulatedStakes;
    mapping(address => uint256) public totalMoolaStakes;
    mapping(address => uint256) public accumulatedPrizePools;
    
    mapping(address => address) public yieldPools;
    mapping(address => address) public mTokens;
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public entryFees;

    address public constant CELO_ERC20 = 0x471EcE3750Da237f93B8E339c536989b8978a438; 

    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public apyBasisPoints = 800; // 8% APY
    uint256 public lastYieldUpdate;
    
    uint256 public fightCooldown = 1 minutes;
    
    mapping(address => bool) public isAdmin;
    address[] public adminList;

    // --- PHASE 2 NEW STORAGE ---
    mapping(address => uint256) public referralBuffExpiry; // user => expiry timestamp
    uint256 public winnerBP = 7000;
    uint256 public poolSeedBP = 1000;
    uint256 public seasonalBP = 1000;
    uint256 public protocolBP = 1000;

    mapping(address => uint256) public seasonalFund; // token => amount
    mapping(address => uint256) public protocolFund; // token => amount
    
    struct FightSession {
        address player1;
        address player2;
        bytes32 commit1;
        bytes32 commit2;
        uint8 choice1; // 1: Attack, 2: Defend, 3: Invest
        uint8 choice2;
        uint256 startTime;
        bool resolved;
        address token;
    }
    
    mapping(uint256 => FightSession) public fights;
    uint256 public nextFightId = 1;
    mapping(address => uint256) public currentFight; // player => fightId

    event ArenaEntered(address indexed player, uint256 amount);
    event ArenaExited(address indexed player, uint256 amount);
    event FightInitiated(uint256 indexed fightId, address indexed p1, address indexed p2);
    event FightResolved(uint256 indexed fightId, address indexed winner, address indexed loser, uint256 yieldWon);
    event FightClash(uint256 indexed fightId, address indexed p1, address indexed p2);
    event YieldConfigured(address indexed pool, address indexed mToken, address indexed token);
    event MegaYieldThreshold(uint256 amount);
    event ReferralBuffClaimed(address indexed referrer, address indexed referee);

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an admin");
        _;
    }

    constructor() {
        lastYieldUpdate = block.timestamp;
        isAdmin[msg.sender] = true;
        adminList.push(msg.sender);
        
        supportedTokens[CELO_ERC20] = true;
        entryFees[CELO_ERC20] = 10 ether;
        
        address USDM = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
        supportedTokens[USDM] = true;
        entryFees[USDM] = 5 ether;

        address EURM = 0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73;
        supportedTokens[EURM] = true;
        entryFees[EURM] = 5 ether;

        address USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;
        supportedTokens[USDT] = true;
        entryFees[USDT] = 5 ether;

        address USDC = 0xcebA9300f2b948710d2653dD7B07f33A8B32118C;
        supportedTokens[USDC] = true;
        entryFees[USDC] = 5 ether;
    }

    function _updateSimulatedYield() internal {
        uint256 elapsed = block.timestamp - lastYieldUpdate;
        if (elapsed > 0) {
            address[5] memory tokens = [
                CELO_ERC20, 
                0x765DE816845861e75A25fCA122bb6898B8B1282a, 
                0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73, 
                0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e, 
                0xcebA9300f2b948710d2653dD7B07f33A8B32118C
            ];
            for (uint i = 0; i < tokens.length; i++) {
                if (totalSimulatedStakes[tokens[i]] > 0) {
                    uint256 newYield = (totalSimulatedStakes[tokens[i]] * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
                    accumulatedPrizePools[tokens[i]] += newYield;
                }
            }
        }
        lastYieldUpdate = block.timestamp;
    }

    function setYieldConfig(address token, address _yieldPool, address _mToken) external onlyAdmin {
        yieldPools[token] = _yieldPool;
        mTokens[token] = _mToken;
        emit YieldConfigured(_yieldPool, _mToken, token);
    }

    function setTokenSupport(address token, bool isSupported, uint256 fee) external onlyAdmin {
        supportedTokens[token] = isSupported;
        entryFees[token] = fee;
    }
    
    function setDistributionBPs(uint256 _winner, uint256 _poolSeed, uint256 _seasonal, uint256 _protocol) external onlyAdmin {
        require(_winner + _poolSeed + _seasonal + _protocol == 10000, "BPs must sum to 10000");
        winnerBP = _winner;
        poolSeedBP = _poolSeed;
        seasonalBP = _seasonal;
        protocolBP = _protocol;
    }

    function claimReferralBuff(address referee) external {
        require(msg.sender != referee, "Cannot refer self");
        referralBuffExpiry[msg.sender] = block.timestamp + 1 days;
        referralBuffExpiry[referee] = block.timestamp + 1 days;
        emit ReferralBuffClaimed(msg.sender, referee);
    }

    function _depositToYield(uint256 amount, address token) internal {
        address pool = yieldPools[token];
        if (pool != address(0)) {
            IERC20(token).approve(pool, amount);
            IYieldProtocol(pool).deposit(token, amount, address(this), 0);
        }
    }

    function _withdrawFromYield(uint256 amount, address to, address token) internal {
        address pool = yieldPools[token];
        if (pool != address(0)) {
            IYieldProtocol(pool).withdraw(token, amount, to);
        } else {
            if (token == CELO_ERC20) {
                (bool success, ) = to.call{value: amount}("");
                require(success, "Native transfer failed");
            } else {
                require(IERC20(token).transfer(to, amount), "ERC20 transfer failed");
            }
        }
    }

    function enterArena(address token) external payable nonReentrant {
        uint256 amount;
        if (token == address(0)) {
            token = CELO_ERC20;
        }
        require(supportedTokens[token], "Unsupported token");

        if (token == CELO_ERC20) {
            require(msg.value == entryFees[token], "Must stake exact entry fee to enter");
            amount = msg.value;
        } else {
            require(msg.value == 0, "Do not send native CELO for ERC20 entry");
            amount = entryFees[token];
            require(IERC20(token).transferFrom(msg.sender, address(this), amount), "ERC20 transfer failed");
        }
        
        _updateSimulatedYield();

        if (!gladiators[msg.sender].isActive) {
            if (gladiators[msg.sender].principalStaked == 0) {
                gladiators[msg.sender] = Gladiator({
                    player: msg.sender,
                    principalStaked: amount,
                    totalYieldWon: 0,
                    wins: 0,
                    losses: 0,
                    lastFightAt: 0,
                    isActive: true,
                    stakeToken: token
                });
                activePlayers.push(msg.sender);
            } else {
                require(gladiators[msg.sender].stakeToken == token, "Must use same token");
                gladiators[msg.sender].principalStaked += amount;
                gladiators[msg.sender].isActive = true;
            }
        } else {
            require(gladiators[msg.sender].stakeToken == token, "Must use same token");
            gladiators[msg.sender].principalStaked += amount;
        }
        
        // Auto-select strategy
        if (yieldPools[token] != address(0)) {
            totalMoolaStakes[token] += amount;
            _depositToYield(amount, token);
        } else {
            totalSimulatedStakes[token] += amount;
        }
        
        emit ArenaEntered(msg.sender, amount);
    }
    
    function submitChoice(address opponent, bytes32 commitHash) external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        require(gladiators[opponent].isActive, "Opponent not in the arena");
        require(msg.sender != opponent, "Cannot fight yourself");
        require(gladiators[msg.sender].stakeToken == gladiators[opponent].stakeToken, "Tokens must match");
        require(currentFight[msg.sender] == 0, "Already in a fight");
        require(currentFight[opponent] == 0, "Opponent already in a fight");
        require(block.timestamp >= gladiators[msg.sender].lastFightAt + fightCooldown, "Cooldown");

        uint256 fightId = nextFightId++;
        fights[fightId] = FightSession({
            player1: msg.sender,
            player2: opponent,
            commit1: commitHash,
            commit2: bytes32(0),
            choice1: 0,
            choice2: 0,
            startTime: block.timestamp,
            resolved: false,
            token: gladiators[msg.sender].stakeToken
        });
        
        currentFight[msg.sender] = fightId;
        currentFight[opponent] = fightId;
        
        emit FightInitiated(fightId, msg.sender, opponent);
    }
    
    function joinFight(uint256 fightId, bytes32 commitHash) external nonReentrant {
        FightSession storage f = fights[fightId];
        require(f.player2 == msg.sender, "Not your fight");
        require(f.commit2 == bytes32(0), "Already committed");
        require(!f.resolved, "Already resolved");
        
        f.commit2 = commitHash;
    }
    
    function revealChoice(uint256 fightId, uint8 choice, bytes32 salt) external nonReentrant {
        FightSession storage f = fights[fightId];
        require(!f.resolved, "Already resolved");
        require(choice >= 1 && choice <= 3, "Invalid choice"); // 1: Attack, 2: Defend, 3: Invest
        
        if (msg.sender == f.player1) {
            require(f.commit1 == keccak256(abi.encodePacked(choice, salt, msg.sender)), "Invalid commit");
            f.choice1 = choice;
        } else if (msg.sender == f.player2) {
            require(f.commit2 == keccak256(abi.encodePacked(choice, salt, msg.sender)), "Invalid commit");
            f.choice2 = choice;
        } else {
            revert("Not a participant");
        }
        
        // Both revealed?
        if (f.choice1 != 0 && f.choice2 != 0) {
            _resolveFight(fightId);
        }
    }
    
    function timeoutFight(uint256 fightId) external nonReentrant {
        FightSession storage f = fights[fightId];
        require(!f.resolved, "Already resolved");
        require(block.timestamp > f.startTime + 5 minutes, "Reveal window not closed");
        
        address winner = address(0);
        address loser = address(0);
        
        if (f.choice1 != 0 && f.choice2 == 0) {
            winner = f.player1;
            loser = f.player2;
        } else if (f.choice2 != 0 && f.choice1 == 0) {
            winner = f.player2;
            loser = f.player1;
        } else {
            // Both timed out, just clear it
            f.resolved = true;
            currentFight[f.player1] = 0;
            currentFight[f.player2] = 0;
            return;
        }
        
        f.resolved = true;
        currentFight[f.player1] = 0;
        currentFight[f.player2] = 0;
        
        gladiators[winner].wins++;
        gladiators[loser].losses++;
        gladiators[winner].lastFightAt = block.timestamp;
        
        _distributeFight(winner, f.token);
    }

    function _resolveFight(uint256 fightId) internal {
        FightSession storage f = fights[fightId];
        f.resolved = true;
        currentFight[f.player1] = 0;
        currentFight[f.player2] = 0;
        
        gladiators[f.player1].lastFightAt = block.timestamp;
        gladiators[f.player2].lastFightAt = block.timestamp;

        // Apply defense buff
        uint8 p1DefBonus = (referralBuffExpiry[f.player1] > block.timestamp) ? 1 : 0;
        uint8 p2DefBonus = (referralBuffExpiry[f.player2] > block.timestamp) ? 1 : 0;
        
        address winner = address(0);
        address loser = address(0);
        bool clash = false;

        // 1: Attack, 2: Defend, 3: Invest
        if (f.choice1 == 1) {
            if (f.choice2 == 1) clash = true;
            else if (f.choice2 == 2 && p2DefBonus == 0) {
                // p1 attacks, p2 defends but no bonus - let's say defend blocks attack
                // no winner
                clash = true;
            } else if (f.choice2 == 3) {
                // attack beats invest
                winner = f.player1;
                loser = f.player2;
            }
        } else if (f.choice1 == 2) {
            if (f.choice2 == 1 && p1DefBonus == 0) {
                clash = true;
            } else if (f.choice2 == 3) {
                // defend vs invest = no effect, maybe invest wins?
                winner = f.player2; // invest grows
                loser = f.player1;
            } else {
                clash = true;
            }
        } else if (f.choice1 == 3) {
            if (f.choice2 == 1) {
                winner = f.player2;
                loser = f.player1;
            } else if (f.choice2 == 2) {
                winner = f.player1;
                loser = f.player2;
            } else {
                clash = true; // both invest, clean round
            }
        }
        
        if (clash) {
            emit FightClash(fightId, f.player1, f.player2);
            return;
        }

        if (winner != address(0)) {
            gladiators[winner].wins++;
            gladiators[loser].losses++;
            _distributeFight(winner, f.token);
            emit FightResolved(fightId, winner, loser, 0); // Event can be updated with actual amount
        }
    }

    function _distributeFight(address winner, address token) internal {
        _updateSimulatedYield();

        uint256 moolaPrize = 0;
        if (yieldPools[token] != address(0) && mTokens[token] != address(0)) {
            uint256 currentBalance = IYieldToken(mTokens[token]).balanceOf(address(this));
            if (currentBalance > totalMoolaStakes[token]) {
                moolaPrize = currentBalance - totalMoolaStakes[token];
            }
        }

        uint256 simulatedPrize = accumulatedPrizePools[token];
        accumulatedPrizePools[token] = 0;

        uint256 totalPrize = moolaPrize + simulatedPrize;
        
        if (totalPrize > 0) {
            // 70/10/10/10 Split
            uint256 winnerAmount = (totalPrize * winnerBP) / 10000;
            uint256 poolAmount = (totalPrize * poolSeedBP) / 10000;
            uint256 seasonalAmount = (totalPrize * seasonalBP) / 10000;
            uint256 protocolAmount = totalPrize - winnerAmount - poolAmount - seasonalAmount;

            accumulatedPrizePools[token] += poolAmount; // Seed back
            seasonalFund[token] += seasonalAmount;
            protocolFund[token] += protocolAmount;

            gladiators[winner].totalYieldWon += winnerAmount;
            
            uint256 totalPayout = winnerAmount;
            
            // If paying out, calculate where it comes from
            if (moolaPrize > 0) {
                uint256 moolaPayout = (moolaPrize > totalPayout) ? totalPayout : moolaPrize;
                if (moolaPayout > 0) {
                    _withdrawFromYield(moolaPayout, winner, token);
                    totalPayout -= moolaPayout;
                }
            }
            
            if (totalPayout > 0) {
                if (token == CELO_ERC20) {
                    (bool success, ) = winner.call{value: totalPayout}("");
                    require(success, "Simulated CELO yield transfer failed");
                } else {
                    require(IERC20(token).transfer(winner, totalPayout), "Simulated ERC20 yield transfer failed");
                }
            }

            if (accumulatedPrizePools[token] >= 5 ether) { // Using 5 ether as a proxy threshold for mega yield
                emit MegaYieldThreshold(accumulatedPrizePools[token]);
            }
        }
    }

    function exitArena() external nonReentrant {
        require(gladiators[msg.sender].isActive, "You are not in the arena");
        require(currentFight[msg.sender] == 0, "Finish your fight first");
        
        _updateSimulatedYield();

        uint256 amountToReturn = gladiators[msg.sender].principalStaked;
        address token = gladiators[msg.sender].stakeToken;
        require(amountToReturn > 0, "No principal to return");
        
        gladiators[msg.sender].principalStaked = 0;
        gladiators[msg.sender].isActive = false;
        
        if (yieldPools[token] != address(0)) {
            totalMoolaStakes[token] -= amountToReturn;
            _withdrawFromYield(amountToReturn, msg.sender, token);
        } else {
            totalSimulatedStakes[token] -= amountToReturn;
            if (token == CELO_ERC20) {
                (bool success, ) = msg.sender.call{value: amountToReturn}("");
                require(success, "Principal return failed");
            } else {
                require(IERC20(token).transfer(msg.sender, amountToReturn), "Principal ERC20 return failed");
            }
        }
        
        emit ArenaExited(msg.sender, amountToReturn);
    }
    
    function getActivePlayers() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (gladiators[activePlayers[i]].isActive) count++;
        }
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < activePlayers.length; i++) {
            if (gladiators[activePlayers[i]].isActive) {
                active[idx] = activePlayers[i];
                idx++;
            }
        }
        return active;
    }

    function getCurrentPrizePool(address token) external view returns (uint256) {
        uint256 moolaPrize = 0;
        if (yieldPools[token] != address(0) && mTokens[token] != address(0)) {
            uint256 currentBalance = IYieldToken(mTokens[token]).balanceOf(address(this));
            if (currentBalance > totalMoolaStakes[token]) {
                moolaPrize = currentBalance - totalMoolaStakes[token];
            }
        }

        uint256 elapsed = block.timestamp - lastYieldUpdate;
        uint256 currentSimulatedYield = 0;
        if (elapsed > 0 && totalSimulatedStakes[token] > 0) {
            currentSimulatedYield = (totalSimulatedStakes[token] * apyBasisPoints * elapsed) / (SECONDS_IN_YEAR * 10000);
        }

        return accumulatedPrizePools[token] + currentSimulatedYield + moolaPrize;
    }
    
    function setApyBasisPoints(uint256 newApy) external onlyAdmin {
        _updateSimulatedYield();
        apyBasisPoints = newApy;
    }

    function setFightCooldown(uint256 _fightCooldown) external onlyAdmin {
        fightCooldown = _fightCooldown;
    }
    
    receive() external payable {
        accumulatedPrizePools[CELO_ERC20] += msg.value;
    }
}
