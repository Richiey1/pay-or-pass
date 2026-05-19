import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("PayOrPass Contract", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployPayOrPassFixture() {
    const [owner, player1, player2, player3] = await ethers.getSigners();

    // Setup: 1 hour (3600 seconds) timeout, 12000 defaultMultiplier (120%)
    const defaultTimeout = 3600;
    const defaultMultiplier = 12000;

    const PayOrPass = await ethers.getContractFactory("PayOrPass");
    const payOrPass = await PayOrPass.deploy(defaultTimeout, defaultMultiplier);

    return { payOrPass, defaultTimeout, defaultMultiplier, owner, player1, player2, player3 };
  }

  describe("Deployment & Configuration", function () {
    it("Should set the right default parameters and owner", async function () {
      const { payOrPass, defaultTimeout, defaultMultiplier, owner } = await loadFixture(deployPayOrPassFixture);

      expect(await payOrPass.defaultTimeout()).to.equal(defaultTimeout);
      expect(await payOrPass.defaultMultiplier()).to.equal(defaultMultiplier);
      expect(await payOrPass.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to update timeout and multiplier", async function () {
      const { payOrPass } = await loadFixture(deployPayOrPassFixture);

      await payOrPass.setTimeout(7200);
      expect(await payOrPass.defaultTimeout()).to.equal(7200);

      await payOrPass.setMultiplier(15000);
      expect(await payOrPass.defaultMultiplier()).to.equal(15000);
    });
  });

  describe("Chain Lifecycle (Native Token)", function () {
    it("Should successfully create a payment chain", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);

      const initialAmount = ethers.parseEther("1.0");

      // player1 creates a chain using native token
      await expect(
        payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount })
      )
        .to.emit(payOrPass, "ChainCreated")
        .withArgs(1, player1.address, ethers.ZeroAddress, initialAmount, 12000);

      const chain = await payOrPass.chains(1);
      expect(chain.originator).to.equal(player1.address);
      expect(chain.currentHolder).to.equal(player1.address);
      expect(chain.amount).to.equal(initialAmount);
      expect(chain.passCount).to.equal(0n);
      expect(chain.status).to.equal(0); // ChainStatus.Active
    });

    it("Should fail chain creation with mismatched native value", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const amount = ethers.parseEther("1.0");

      await expect(
        payOrPass.connect(player1).createChain(ethers.ZeroAddress, amount, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(payOrPass, "InvalidAmount");
    });

    it("Should allow the current holder to pay and complete the chain", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const initialAmount = ethers.parseEther("1.0");

      // Create chain
      await payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount });

      // Player1 pays to complete the chain
      await expect(
        payOrPass.connect(player1).pay(1, { value: initialAmount })
      )
        .to.emit(payOrPass, "PayAction")
        .withArgs(1, player1.address, initialAmount);

      const chain = await payOrPass.chains(1);
      expect(chain.status).to.equal(1); // ChainStatus.Completed
    });

    it("Should successfully pass the chain, increasing the stakes by 20%", async function () {
      const { payOrPass, player1, player2 } = await loadFixture(deployPayOrPassFixture);
      const initialAmount = ethers.parseEther("1.0");

      // Create chain
      await payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount });

      const nextAmount = await payOrPass.getNextAmount(1);
      expect(nextAmount).to.equal(ethers.parseEther("1.2"));

      // Player1 passes to Player2
      // This transfers currentAmount (1.0 ETH) from contract to Player2, and updates currentHolder to Player2
      const balanceBefore = await ethers.provider.getBalance(player2.address);

      await expect(
        payOrPass.connect(player1).pass(1, player2.address)
      )
        .to.emit(payOrPass, "PassAction")
        .withArgs(1, player1.address, player2.address, initialAmount, nextAmount);

      const balanceAfter = await ethers.provider.getBalance(player2.address);
      expect(balanceAfter - balanceBefore).to.equal(initialAmount);

      const chain = await payOrPass.chains(1);
      expect(chain.currentHolder).to.equal(player2.address);
      expect(chain.amount).to.equal(nextAmount);
      expect(chain.passCount).to.equal(1n);
    });

    it("Should prevent non-holders from passing the chain", async function () {
      const { payOrPass, player1, player2, player3 } = await loadFixture(deployPayOrPassFixture);
      const initialAmount = ethers.parseEther("1.0");

      await payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount });

      // Player2 attempts to pass but player1 holds it
      await expect(
        payOrPass.connect(player2).pass(1, player3.address)
      ).to.be.revertedWithCustomError(payOrPass, "NotChainHolder");
    });
  });

  describe("Timeout Handling", function () {
    it("Should reject timeout trigger if duration has not passed", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const initialAmount = ethers.parseEther("1.0");

      await payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount });

      await expect(
        payOrPass.triggerTimeout(1)
      ).to.be.revertedWith("Timeout not reached");
    });

    it("Should trigger timeout successfully after delay", async function () {
      const { payOrPass, player1, defaultTimeout } = await loadFixture(deployPayOrPassFixture);
      const initialAmount = ethers.parseEther("1.0");

      await payOrPass.connect(player1).createChain(ethers.ZeroAddress, initialAmount, { value: initialAmount });

      // Increase EVM block time by 1 hour + 1 second
      await ethers.provider.send("evm_increaseTime", [defaultTimeout + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        payOrPass.triggerTimeout(1)
      )
        .to.emit(payOrPass, "ChainTimedOut")
        .withArgs(1, player1.address, initialAmount);

      const chain = await payOrPass.chains(1);
      expect(chain.status).to.equal(2); // ChainStatus.TimedOut
    });
  });
});
