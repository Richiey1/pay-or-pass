import { useState, useEffect, useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useBalance, usePublicClient, useReadContracts } from "wagmi";
import { formatUnits, parseUnits, keccak256, encodePacked, formatEther } from "viem";
import { readContract } from "wagmi/actions";
import { useConfig } from "wagmi";
import { LOSSLESS_ARENA_ABI, CONTRACT_ADDRESS, FUNCTION_NAMES } from "@/lib/constants/contracts";
import { ERC20_ABI } from "@/lib/constants/erc20";
import { useCeloFeeCurrency } from './useCeloFeeCurrency';

export interface Gladiator {
  player: string;
  principalStaked: bigint;
  totalYieldWon: bigint;
  wins: bigint;
  losses: bigint;
  lastFightAt: bigint;
  isActive: boolean;
}

export type TxState = "idle" | "preparing" | "broadcasting" | "confirming" | "confirmed" | "error";

export function useLosslessArena(tokenAddress: string = "0x471EcE3750Da237f93B8E339c536989b8978a438", tokenDecimals: number = 18) {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient();
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const { feeCurrency } = useCeloFeeCurrency();
  
  // Transaction lifecycle state
  const [txState, setTxState] = useState<TxState>("idle");
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"enter" | "fight" | "exit" | null>(null);

  // User's balance
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });

  const formattedBalance = balanceData ? formatEther(balanceData.value) : "0.0";

  // Contract Reads
  const { data: totalStakeData, isLoading: isLoadingStake, refetch: refetchTotalStake } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.TOTAL_ARENA_STAKE,
  });
  
  const { data: currentPrizeData, isLoading: isLoadingPrize, refetch: refetchPrize } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GET_CURRENT_PRIZE_POOL,
    args: [tokenAddress as `0x${string}`],
  });
  
  const { data: activePlayersData, isLoading: isLoadingPlayers, refetch: refetchPlayers } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GET_ACTIVE_PLAYERS,
  });

  const { data: myGladiatorData, isLoading: isLoadingGladiator, refetch: refetchMyGladiator } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.GLADIATORS,
    args: address ? [address] : undefined,
  });

  const { data: currentFightIdData, refetch: refetchCurrentFightId } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.CURRENT_FIGHT,
    args: address ? [address] : undefined,
  });

  const currentFightId = currentFightIdData as bigint | undefined;

  const { data: currentFightData, refetch: refetchCurrentFightData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.FIGHTS,
    args: currentFightId && currentFightId > BigInt(0) ? [currentFightId] : undefined,
  });

  const { data: entryFeeData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.ENTRY_FEE,
    args: [tokenAddress as `0x${string}`],
  });

  const { data: isAdminData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.IS_ADMIN,
    args: address ? [address] : undefined,
  });

  // Formatted/Derived states
  const totalStake = totalStakeData ? formatUnits(totalStakeData as bigint, tokenDecimals) : "0.0";
  const currentPrize = currentPrizeData ? formatUnits(currentPrizeData as bigint, tokenDecimals) : "0.000";
  const activePlayers = Array.from(new Set(((activePlayersData as string[]) || []).map(a => a.toLowerCase())));
  const entryFee = entryFeeData ? formatUnits(entryFeeData as bigint, tokenDecimals) : "";
  
  const { data: ownerData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: LOSSLESS_ARENA_ABI,
    functionName: FUNCTION_NAMES.OWNER,
  });

  const isAdmin = address && (
    isAdminData === true || (ownerData && (ownerData as string).toLowerCase() === address.toLowerCase())
  );
  const isLoading = isLoadingStake || isLoadingPrize || isLoadingPlayers || isLoadingGladiator;

  
  const { data: allGladiatorsData } = useReadContracts({
    contracts: activePlayers.map((player) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: LOSSLESS_ARENA_ABI,
      functionName: FUNCTION_NAMES.GLADIATORS,
      args: [player as `0x${string}`],
    })),
    query: {
      enabled: activePlayers.length > 0,
    }
  });

  const arenaPlayers = activePlayers.filter((address, index) => {
    const data = allGladiatorsData?.[index]?.result as any;
    if (!data) return false;
    const stakeToken = data[7];
    // if native, token is 0x471..., but in contract is it 0x471...? Yes, or 0x00...
    const isTokenMatch = stakeToken.toLowerCase() === tokenAddress.toLowerCase() || 
      (tokenAddress.toLowerCase() === "0x471ece3750da237f93b8e339c536989b8978a438" && stakeToken === "0x0000000000000000000000000000000000000000");
    return isTokenMatch;
  });

  // Calculate ranks based on Yield Won for arenaPlayers
  const arenaPlayersWithData = arenaPlayers.map((address) => {
    const idx = activePlayers.indexOf(address);
    const data = allGladiatorsData?.[idx]?.result as any;
    const yieldWon = data ? parseFloat(formatUnits(data[2], tokenDecimals)) : 0;
    const wins = data ? Number(data[3]) : 0;
    const losses = data ? Number(data[4]) : 0;
    const currentStreak = data ? Number(data[9]) : 0;
    const longestStreak = data ? Number(data[10]) : 0;
    const totalFights = wins + losses;
    return { address, yieldWon, wins, losses, currentStreak, longestStreak, totalFights, seasonRank: 0 };
  }).sort((a, b) => b.yieldWon - a.yieldWon).map((p, idx) => ({ ...p, seasonRank: idx + 1 }));

  const getPlayerRank = (addr: string) => {
    const index = arenaPlayersWithData.findIndex(p => p.address.toLowerCase() === addr.toLowerCase());
    return index >= 0 ? index + 1 : 0;
  };

  const myRank = address ? getPlayerRank(address) : 0;

  const myGladiator = myGladiatorData as any;
  const isInArena = myGladiator ? myGladiator[6] : false; // isActive field
  const myWins = myGladiator ? Number(myGladiator[3]) : 0;
  const myLosses = myGladiator ? Number(myGladiator[4]) : 0;
  const myYieldWon = myGladiator ? formatUnits(myGladiator[2], tokenDecimals) : "0.0";
  const myStreak = myGladiator ? Number(myGladiator[9]) : 0;

  // Contract Writes
  const { writeContractAsync } = useWriteContract();

  const triggerRefetch = useCallback(() => {
    refetchMyGladiator();
    refetchPlayers();
    refetchTotalStake();
    refetchPrize();
    refetchBalance();
    refetchCurrentFightId();
    refetchCurrentFightData();
  }, [refetchMyGladiator, refetchPlayers, refetchTotalStake, refetchPrize, refetchBalance, refetchCurrentFightId, refetchCurrentFightData]);

  // Actions
  const enterArena = async (customAmount: string, token: string, strategy: number) => {
    if (!isConnected) return;
    try {
      setActiveAction("enter");
      setTxState("preparing");
      setTxError(null);
      
      const isStable = token.toLowerCase() === "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e".toLowerCase() || token.toLowerCase() === "0xcebA9300f2b948710d2653dD7B07f33A8B32118C".toLowerCase();
      const isNative = token.toLowerCase() === "0x471ece3750da237f93b8e339c536989b8978a438" || token === "0x0000000000000000000000000000000000000000";
      const stakeVal = parseUnits(customAmount || "10", isStable ? 6 : 18);
      if (isNative && balanceData && balanceData.value < stakeVal) {
        throw new Error(`Insufficient CELO balance. Required: ${formatEther(stakeVal)} CELO, Available: ${formattedBalance} CELO`);
      }

      // Check and Approve ERC20 if needed
      if (!isNative && address) {
        setTxState("preparing");
        const currentAllowance = await readContract(config, {
          address: token as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, CONTRACT_ADDRESS],
        }) as bigint;

        if (currentAllowance < stakeVal) {
          setTxState("broadcasting");
          const approveHash = await writeContractAsync({
            address: token as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [CONTRACT_ADDRESS, stakeVal],
            ...(feeCurrency ? { feeCurrency } : {}),
          } as any);
          // Wait for approval confirmation
          if (publicClient) {
            setTxState("confirming");
            const receipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
            if (receipt.status !== 'success') {
              throw new Error("Approval transaction reverted on-chain");
            }
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.ENTER_ARENA,
        args: [token as `0x${string}`],
        value: isNative ? stakeVal : BigInt(0),
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to enter Arena");
      throw err;
    }
  };

  const fight = async (choice: number) => {
    if (!isConnected || !selectedOpponent) return;
    try {
      setActiveAction("fight");
      setTxState("preparing");
      setTxError(null);

      const salt = "salt_" + Math.random().toString();
      const commitHash = keccak256(encodePacked(["uint8", "string", "address"], [choice, salt, address as `0x${string}`]));
      localStorage.setItem(`payorpass_commit_${address}`, JSON.stringify({ choice, salt }));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.SUBMIT_CHOICE,
        args: [selectedOpponent as `0x${string}`, commitHash],
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to initiate fight");
      throw err;
    }
  };

  const joinFight = async (fightId: bigint, choice: number) => {
    if (!isConnected) return;
    try {
      setActiveAction("fight");
      setTxState("preparing");
      setTxError(null);

      const salt = "salt_" + Math.random().toString();
      const commitHash = keccak256(encodePacked(["uint8", "string", "address"], [choice, salt, address as `0x${string}`]));
      localStorage.setItem(`payorpass_commit_${address}`, JSON.stringify({ choice, salt }));

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.JOIN_FIGHT,
        args: [fightId, commitHash],
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to join fight");
      throw err;
    }
  };

  const revealChoice = async (fightId: bigint) => {
    if (!isConnected) return;
    try {
      setActiveAction("fight");
      setTxState("preparing");
      setTxError(null);

      const saved = localStorage.getItem(`payorpass_commit_${address}`);
      if (!saved) throw new Error("No saved commit found. Cannot reveal.");
      
      const { choice, salt } = JSON.parse(saved);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.REVEAL_CHOICE,
        args: [fightId, choice, salt],
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to reveal choice");
      throw err;
    }
  };

  const exitArena = async () => {
    if (!isConnected) return;
    try {
      setActiveAction("exit");
      setTxState("preparing");
      setTxError(null);

      // Simulate step
      await new Promise(r => setTimeout(r, 800));

      setTxState("broadcasting");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: FUNCTION_NAMES.EXIT_ARENA,
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to exit Arena");
      throw err;
    }
  };

  // User must manually trigger refetch from the UI to avoid annoying page reloads

  const claimReferralBuff = async (referee: string) => {
    if (!isConnected) return;
    try {
      setTxState("preparing");
      setTxError(null);

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: LOSSLESS_ARENA_ABI,
        functionName: "claimReferralBuff",
        args: [referee],
        ...(feeCurrency ? { feeCurrency } : {}),
      } as any);

      setTxHash(hash);
      setTxState("confirming");
    } catch (err: any) {
      setTxState("error");
      setTxError(err.message || "Failed to claim referral buff");
      throw err;
    }
  };

  return {
    address,
    isConnected,
    totalStake,
    currentPrize,
    activePlayers,
    entryFee,
    isAdmin,
    isInArena,
    myWins,
    myLosses,
    myYieldWon,
    myStreak,
    selectedOpponent,
    setSelectedOpponent,
    myRank,
    getPlayerRank,
    arenaPlayers,
    arenaPlayersWithData,
    currentFightId,
    currentFightData,
    enterArena,
    fight,
    joinFight,
    revealChoice,
    exitArena,
    claimReferralBuff,
    triggerRefetch,
    balance: balanceData,
    formattedBalance,
    txState,
    setTxState,
    txError,
    txHash,
    setTxHash,
    activeAction,
    isLoading,
  };
}
