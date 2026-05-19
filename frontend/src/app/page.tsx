"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS as DEFAULT_CONTRACT_ADDRESS, PAY_OR_PASS_ABI } from "../lib/constants/contracts";

export default function Home() {
  const [chainId, setChainId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [chainInfo, setChainInfo] = useState<any>(null);

  // Wallet State
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS;

  async function getProvider() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider("https://forno.celo.org"); // Standardized Forno Celo RPC
  }

  // Check & Auto-Connect for MiniPay
  useEffect(() => {
    async function checkMiniPay() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum;
        const isMin = !!eth.isMiniPay;
        setIsMiniPay(isMin);

        // Auto-connect inside MiniPay context silently
        if (isMin) {
          try {
            const provider = new ethers.BrowserProvider(eth);
            const accounts = await eth.request({ method: "eth_accounts" });
            if (accounts && accounts[0]) {
              setAddress(accounts[0]);
              setIsConnected(true);
              const bal = await provider.getBalance(accounts[0]);
              setBalance(ethers.formatEther(bal));
            } else {
              // fallback to request permission silently
              const reqAccounts = await eth.request({ method: "eth_requestAccounts" });
              if (reqAccounts && reqAccounts[0]) {
                setAddress(reqAccounts[0]);
                setIsConnected(true);
                const bal = await provider.getBalance(reqAccounts[0]);
                setBalance(ethers.formatEther(bal));
              }
            }
          } catch (err) {
            console.error("MiniPay Silent Connection failed:", err);
          }
        }
      }
    }
    checkMiniPay();
  }, []);

  async function connectWallet() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        setStatus("Connecting wallet...");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          setAddress(accounts[0]);
          setIsConnected(true);
          const bal = await provider.getBalance(accounts[0]);
          setBalance(ethers.formatEther(bal));
          setStatus("Wallet connected!");
        }
      } catch (err: any) {
        setStatus(`Connection failed: ${err.message}`);
      }
    } else {
      setStatus("No Web3 provider found. Please use Opera Mini / Valora.");
    }
  }

  async function updateBalance(provider: any, userAddr: string) {
    try {
      const bal = await provider.getBalance(userAddr);
      setBalance(ethers.formatEther(bal));
    } catch (err) {
      console.error("Failed to update balance:", err);
    }
  }

  async function createChain() {
    try {
      if (!isConnected) {
        await connectWallet();
      }
      setStatus("Creating chain...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const parsedAmount = ethers.parseEther(amount || "0");
      const tx = await contract.createChain(ethers.ZeroAddress, parsedAmount, {
        value: parsedAmount,
        type: 0 // LEGACY TRANSACTION TYPE (MANDATORY FOR MINIPAY)
      });
      setStatus("Broadcasting transaction...");
      await tx.wait();

      const newChainId = chainId || "1";
      setChainId(newChainId);
      setStatus(`Chain created successfully! ID: ${newChainId}`);
      await updateBalance(provider, address);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function loadChain() {
    try {
      setStatus("Loading chain...");
      const provider = await getProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, provider);

      const info = await contract.chains(chainId);
      const nextAmount = await contract.getNextAmount(chainId);
      const timeoutReached = await contract.isTimeoutReached(chainId);

      setChainInfo({
        originator: info.originator,
        currentHolder: info.currentHolder,
        amount: ethers.formatEther(info.amount),
        createdAt: new Date(Number(info.createdAt) * 1000).toLocaleString(),
        passCount: info.passCount.toString(),
        nextAmount: ethers.formatEther(nextAmount),
        timeoutReached,
        status: ["Active", "Completed", "TimedOut"][info.status],
      });
      setStatus("Chain details loaded!");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function pay() {
    try {
      if (!isConnected) {
        await connectWallet();
      }
      setStatus("Paying...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const info = await contract.chains(chainId);
      const tx = await contract.pay(chainId, { 
        value: info.amount,
        type: 0 // LEGACY TRANSACTION TYPE (MANDATORY FOR MINIPAY)
      });
      setStatus("Broadcasting payment...");
      await tx.wait();

      setStatus("Paid! Chain completed.");
      loadChain();
      await updateBalance(provider, address);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function passTo() {
    try {
      if (!isConnected) {
        await connectWallet();
      }
      setStatus("Passing...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const tx = await contract.pass(chainId, recipient, {
        type: 0 // LEGACY TRANSACTION TYPE (MANDATORY FOR MINIPAY)
      });
      setStatus("Broadcasting transfer...");
      await tx.wait();

      setStatus("Passed! Chain continues.");
      loadChain();
      await updateBalance(provider, address);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  const handleMax = () => {
    if (balance) {
      // Leave a tiny gas buffer
      const maxVal = Math.max(0, parseFloat(balance) - 0.005);
      setAmount(maxVal.toFixed(6));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-2xl mx-auto pt-12">
        {/* Wallet Status Header */}
        <div className="flex justify-end items-center mb-8 gap-4 bg-gray-800/40 p-4 rounded-xl border border-gray-700">
          {isConnected ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-mono">
                {address.substring(0, 6)}...{address.substring(address.length - 4)}
              </span>
              <span className="font-bold text-gray-200">
                {parseFloat(balance).toFixed(4)} CELO
              </span>
            </div>
          ) : (
            !isMiniPay && (
              <button
                onClick={connectWallet}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-semibold py-1.5 px-4 rounded-lg text-sm transition-all"
              >
                Connect Wallet
              </button>
            )
          )}
          {isMiniPay && (
            <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-mono">
              ⚡ MiniPay Optimized
            </span>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="/paynpass-logo.svg" 
              alt="PayOrPass Logo" 
              className="h-24 w-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">
            PayOrPass
          </h1>
          <p className="text-gray-400 text-lg">
            Pay the amount or pass it to someone else (with a 20% increase)
          </p>
        </div>

        {/* Create Chain Card */}
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-400">Create New Chain</h2>
            {isConnected && (
              <button
                onClick={handleMax}
                className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded text-xs font-semibold uppercase transition-all"
              >
                MAX
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                placeholder="Amount (CELO)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <div className="mt-2 text-xs text-gray-500 font-mono text-right">
                {amount && !isNaN(parseFloat(amount))
                  ? `≈ ${(parseFloat(amount) * 1e18).toLocaleString()} Wei`
                  : "0 Wei"}
              </div>
            </div>
            <button
              onClick={createChain}
              className="w-full bg-gradient-to-r from-green-500 to-teal-400 hover:from-green-600 hover:to-teal-500 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Create Chain (Pay Initial Amount)
            </button>
          </div>
        </div>

        {/* Load Chain Card */}
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Load Existing Chain</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Chain ID"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={loadChain}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              Load Chain
            </button>
          </div>
        </div>

        {/* Chain Info */}
        {chainInfo && (
          <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Chain #{chainId}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Status</span>
                <div className="font-semibold">{chainInfo.status}</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Current Holder</span>
                <div className="font-semibold text-xs break-all">{chainInfo.currentHolder}</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Current Amount</span>
                <div className="font-semibold">{chainInfo.amount} CELO</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Next Amount (if passed)</span>
                <div className="font-semibold text-green-400">{chainInfo.nextAmount} CELO</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Pass Count</span>
                <div className="font-semibold">{chainInfo.passCount}</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Timeout Reached</span>
                <div className={`font-semibold ${chainInfo.timeoutReached ? "text-red-400" : "text-green-400"}`}>
                  {chainInfo.timeoutReached ? "YES" : "No"}
                </div>
              </div>
            </div>

            {/* Actions */}
            {chainInfo.status === "Active" && (
              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={pay}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    💰 Pay {chainInfo.amount} CELO (End Chain)
                  </button>
                </div>
                <div className="space-y-2">
                  <span className="text-gray-400 text-sm">Or pass to someone (amount increases 20%):</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500"
                    />
                    <button
                      onClick={passTo}
                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all whitespace-nowrap"
                    >
                      🔁 Pass
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {status && (
          <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-green-500 mb-6">
            <p className="text-gray-300 font-mono text-sm">{status}</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 mt-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">How It Works</h3>
          <ol className="space-y-2 text-sm text-gray-400">
            <li>1. Someone creates a chain by paying an initial amount (e.g., 0.1 CELO)</li>
            <li>2. They can either <span className="text-red-400">Pay</span> to absorb the cost, ending the chain</li>
            <li>3. Or they can <span className="text-yellow-400">Pass</span> it to someone else, increasing the amount by 20%</li>
            <li>4. Each recipient faces the same choice: Pay to end it, or Pass it on (with higher stakes)</li>
            <li>5. The chain continues until someone Pays or timeout occurs</li>
          </ol>
          <p className="mt-4 text-xs text-gray-500">
            ⚠️ This is a game of social dynamics and pressure. Use responsibly!
          </p>
        </div>
      </div>
    </div>
  );
}
