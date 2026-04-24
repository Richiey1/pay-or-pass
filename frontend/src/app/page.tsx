"use client";

import { useState } from "react";
import { ethers } from "ethers";

export default function Home() {
  const [chainId, setChainId] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState("");
  const [chainInfo, setChainInfo] = useState<any>(null);

  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

  const PAY_OR_PASS_ABI = [
    "function createChain(address token, uint256 amount) external payable returns (uint256)",
    "function pay(uint256 chainId) external payable",
    "function pass(uint256 chainId, address to) external",
    "function chains(uint256) view returns (address originator, address currentHolder, uint256 amount, uint256 createdAt, uint256 lastActionAt, uint256 passCount, uint256 multiplier, address tokenAddress, uint8 status)",
    "function getNextAmount(uint256) view returns (uint256)",
    "function isTimeoutReached(uint256) view returns (bool)",
  ];

  async function getProvider() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider("https://alfajores-forno.celo-testnet.org");
  }

  async function createChain() {
    try {
      setStatus("Creating chain...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const tx = await contract.createChain(ethers.ZeroAddress, ethers.parseEther(amount || "0"), {
        value: ethers.parseEther(amount || "0"),
      });
      await tx.wait();

      const newChainId = chainId || "1";
      setChainId(newChainId);
      setStatus(`Chain created! ID: ${newChainId}`);
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
      setStatus("Chain loaded");
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function pay() {
    try {
      setStatus("Paying...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const info = await contract.chains(chainId);
      const tx = await contract.pay(chainId, { value: ethers.parseEther(info.amount) });
      await tx.wait();

      setStatus("Paid! Chain completed.");
      loadChain();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  async function passTo() {
    try {
      setStatus("Passing...");
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PAY_OR_PASS_ABI, signer);

      const tx = await contract.pass(chainId, recipient);
      await tx.wait();

      setStatus("Passed! Chain continues.");
      loadChain();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">
            PayOrPass
          </h1>
          <p className="text-gray-400 text-lg">
            Pay the amount or pass it to someone else (with a 20% increase)
          </p>
        </div>

        {/* Create Chain Card */}
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Create New Chain</h2>
          <div className="space-y-4">
            <input
              type="number"
              step="0.01"
              placeholder="Amount (ETH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
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
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
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
                <div className="font-semibold">{chainInfo.amount} ETH</div>
              </div>
              <div className="bg-gray-900/50 p-3 rounded-lg">
                <span className="text-gray-400">Next Amount (if passed)</span>
                <div className="font-semibold text-green-400">{chainInfo.nextAmount} ETH</div>
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
                    💰 Pay {chainInfo.amount} ETH (End Chain)
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
          <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-green-500">
            <p className="text-gray-300">{status}</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800/30 rounded-2xl p-6 mt-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">How It Works</h3>
          <ol className="space-y-2 text-sm text-gray-400">
            <li>1. Someone creates a chain by paying an initial amount (e.g., 0.1 ETH)</li>
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
