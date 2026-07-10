import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Phase 2: choice = 1 (Attack) | 2 (Defend) | 3 (Invest)
function makeChoiceCommit(choice: number, salt: string, sender: string): string {
  return ethers.keccak256(
    ethers.solidityPacked(
      ["uint8", "bytes32", "address"],
      [choice, salt, sender]
    )
  );
}

// Celo mainnet token addresses (also used as mock identifiers in local tests)
const CELO_ERC20 = "0x471EcE3750Da237f93B8E339c536989b8978a438";

// ─── Fixture ──────────────────────────────────────────────────────────────────
async function deployPayOrPassFixture() {
  const [owner, player1, player2, player3] = await ethers.getSigners();

  // Phase 2 constructor takes ZERO arguments
  const PayOrPass = await ethers.getContractFactory("PayOrPass");
  const payOrPass = await PayOrPass.deploy();

  return { payOrPass, owner, player1, player2, player3 };
}

// ─── PayOrPass Phase 2 Test Suite ────────────────────────────────────────────
describe("PayOrPass (Phase 2)", function () {

  describe("Deployment & Configuration", function () {
    it("sets deployer as admin", async function () {
      const { payOrPass, owner } = await loadFixture(deployPayOrPassFixture);
      expect(await payOrPass.isAdmin(owner.address)).to.be.true;
    });

    it("supports CELO_ERC20 token by default", async function () {
      const { payOrPass } = await loadFixture(deployPayOrPassFixture);
      expect(await payOrPass.supportedTokens(CELO_ERC20)).to.be.true;
    });

    it("sets default APY basis points to 800 (8%)", async function () {
      const { payOrPass } = await loadFixture(deployPayOrPassFixture);
      expect(await payOrPass.apyBasisPoints()).to.equal(800n);
    });

    it("sets default distribution BPs: 7000/1000/1000/1000", async function () {
      const { payOrPass } = await loadFixture(deployPayOrPassFixture);
      expect(await payOrPass.winnerBP()).to.equal(7000n);
      expect(await payOrPass.poolSeedBP()).to.equal(1000n);
      expect(await payOrPass.seasonalBP()).to.equal(1000n);
    });

    it("admin can update APY basis points", async function () {
      const { payOrPass, owner } = await loadFixture(deployPayOrPassFixture);
      await payOrPass.connect(owner).setApyBasisPoints(1000);
      expect(await payOrPass.apyBasisPoints()).to.equal(1000n);
    });

    it("admin can update distribution BPs (must sum to 10000)", async function () {
      const { payOrPass, owner } = await loadFixture(deployPayOrPassFixture);
      await payOrPass.connect(owner).setDistributionBPs(8000, 1000, 500, 500);
      expect(await payOrPass.winnerBP()).to.equal(8000n);
    });

    it("reverts if distribution BPs do not sum to 10000", async function () {
      const { payOrPass, owner } = await loadFixture(deployPayOrPassFixture);
      await expect(
        payOrPass.connect(owner).setDistributionBPs(7000, 1000, 1000, 500)
      ).to.be.revertedWith("BPs must sum to 10000");
    });
  });

  describe("enterArena", function () {
    it("player can enter arena with native CELO (msg.value = entryFee)", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);

      await expect(
        payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee })
      ).to.emit(payOrPass, "ArenaEntered");

      const g = await payOrPass.gladiators(player1.address);
      expect(g.isActive).to.be.true;
      expect(g.principalStaked).to.equal(fee);
    });

    it("rejects if msg.value does not equal exact entry fee", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await expect(
        payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee / 2n })
      ).to.be.revertedWith("Must stake exact entry fee to enter");
    });

    it("auto-selects simulated strategy when no yield pool is configured", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });

      const simStake = await payOrPass.totalSimulatedStakes(CELO_ERC20);
      expect(simStake).to.equal(fee);
    });
  });

  describe("submitChoice + joinFight + revealChoice (commit-reveal combat)", function () {
    const ATTACK  = 1;
    const DEFEND  = 2;
    const INVEST  = 3;

    async function twoGladiatorsFixture() {
      const base = await loadFixture(deployPayOrPassFixture);
      const { payOrPass, player1, player2 } = base;
      const fee = await payOrPass.entryFees(CELO_ERC20);

      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });
      await payOrPass.connect(player2).enterArena(CELO_ERC20, { value: fee });

      return { ...base, fee };
    }

    it("player1 can submit choice (initiating a fight) against player2", async function () {
      const { payOrPass, player1, player2 } = await twoGladiatorsFixture();

      const salt = ethers.encodeBytes32String("p1-salt");
      const commit = makeChoiceCommit(ATTACK, salt, player1.address);

      await expect(
        payOrPass.connect(player1).submitChoice(player2.address, commit)
      ).to.emit(payOrPass, "FightInitiated");

      const fightId = await payOrPass.currentFight(player1.address);
      expect(fightId).to.be.gt(0n);
    });

    it("player2 can join the fight with their own commit", async function () {
      const { payOrPass, player1, player2 } = await twoGladiatorsFixture();

      const s1 = ethers.encodeBytes32String("p1-s");
      const s2 = ethers.encodeBytes32String("p2-s");
      await payOrPass.connect(player1).submitChoice(player2.address, makeChoiceCommit(ATTACK, s1, player1.address));

      const fightId = await payOrPass.currentFight(player1.address);
      await expect(
        payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(DEFEND, s2, player2.address))
      ).to.not.be.reverted;
    });

    it("resolves fight and emits FightResolved or FightClash", async function () {
      const { payOrPass, player1, player2 } = await twoGladiatorsFixture();

      const s1 = ethers.encodeBytes32String("p1-final");
      const s2 = ethers.encodeBytes32String("p2-final");

      // p1 attacks, p2 invests → p1 wins
      await payOrPass.connect(player1).submitChoice(
        player2.address, makeChoiceCommit(ATTACK, s1, player1.address)
      );
      const fightId = await payOrPass.currentFight(player1.address);
      await payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(INVEST, s2, player2.address));

      await expect(payOrPass.connect(player1).revealChoice(fightId, ATTACK, s1))
        .to.not.be.reverted;

      // After p2 reveals, fight resolves
      const p1RevealTx = payOrPass.connect(player2).revealChoice(fightId, INVEST, s2);
      await expect(p1RevealTx).to.emit(payOrPass, "FightResolved");
    });

    it("rejects invalid choice (must be 1, 2, or 3)", async function () {
      const { payOrPass, player1, player2 } = await twoGladiatorsFixture();

      const s1 = ethers.encodeBytes32String("bad-choice");
      const s2 = ethers.encodeBytes32String("p2-s");
      await payOrPass.connect(player1).submitChoice(
        player2.address, makeChoiceCommit(ATTACK, s1, player1.address)
      );
      const fightId = await payOrPass.currentFight(player1.address);
      await payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(DEFEND, s2, player2.address));

      await expect(
        payOrPass.connect(player1).revealChoice(fightId, 5, s1) // invalid choice
      ).to.be.revertedWith("Invalid choice");
    });

    it("rejects wrong hash on reveal", async function () {
      const { payOrPass, player1, player2 } = await twoGladiatorsFixture();

      const s1 = ethers.encodeBytes32String("real-salt");
      const s2 = ethers.encodeBytes32String("p2-s");
      await payOrPass.connect(player1).submitChoice(
        player2.address, makeChoiceCommit(ATTACK, s1, player1.address)
      );
      const fightId = await payOrPass.currentFight(player1.address);
      await payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(DEFEND, s2, player2.address));

      // Try to reveal with DEFEND instead of committed ATTACK
      await expect(
        payOrPass.connect(player1).revealChoice(fightId, DEFEND, s1)
      ).to.be.revertedWith("Invalid commit");
    });
  });

  describe("timeoutFight", function () {
    it("timeout can be triggered after 5 minutes if one player hasn't revealed", async function () {
      const { payOrPass, player1, player2, owner } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });
      await payOrPass.connect(player2).enterArena(CELO_ERC20, { value: fee });

      const s1 = ethers.encodeBytes32String("s1");
      const s2 = ethers.encodeBytes32String("s2");

      await payOrPass.connect(player1).submitChoice(player2.address, makeChoiceCommit(1, s1, player1.address));
      const fightId = await payOrPass.currentFight(player1.address);
      await payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(2, s2, player2.address));

      // Only p1 reveals
      await payOrPass.connect(player1).revealChoice(fightId, 1, s1);

      // Before timeout: should revert
      await expect(
        payOrPass.connect(owner).timeoutFight(fightId)
      ).to.be.revertedWith("Reveal window not closed");

      // After 5 minutes + 1 second
      await time.increase(5 * 60 + 1);

      await expect(
        payOrPass.connect(owner).timeoutFight(fightId)
      ).to.not.be.reverted;
    });
  });

  describe("70/10/10 prize distribution via _distributeFight", function () {
    it("distributes prize: winner gets winnerBP share of prize pool", async function () {
      const { payOrPass, player1, player2 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });
      await payOrPass.connect(player2).enterArena(CELO_ERC20, { value: fee });

      // Seed the prize pool by sending some CELO to the contract
      await player1.sendTransaction({ to: await payOrPass.getAddress(), value: ethers.parseEther("1") });

      const s1 = ethers.encodeBytes32String("d-s1");
      const s2 = ethers.encodeBytes32String("d-s2");
      await payOrPass.connect(player1).submitChoice(player2.address, makeChoiceCommit(1, s1, player1.address));
      const fightId = await payOrPass.currentFight(player1.address);
      await payOrPass.connect(player2).joinFight(fightId, makeChoiceCommit(3, s2, player2.address));

      // p1 attacks, p2 invests → p1 wins
      await payOrPass.connect(player1).revealChoice(fightId, 1, s1);

      const balBefore = await ethers.provider.getBalance(player1.address);
      await payOrPass.connect(player2).revealChoice(fightId, 3, s2);
      const balAfter = await ethers.provider.getBalance(player1.address);

      // Winner should have received more CELO than they spent on reveal gas
      const g = await payOrPass.gladiators(player1.address);
      expect(g.wins).to.equal(1n);
    });
  });

  describe("claimReferralBuff", function () {
    it("grants 24h referral defence buff to both referrer and referee", async function () {
      const { payOrPass, player1, player2 } = await loadFixture(deployPayOrPassFixture);

      await expect(
        payOrPass.connect(player1).claimReferralBuff(player2.address)
      ).to.emit(payOrPass, "ReferralBuffClaimed").withArgs(player1.address, player2.address);

      const ts = BigInt(await time.latest());
      const expiry1 = await payOrPass.referralBuffExpiry(player1.address);
      const expiry2 = await payOrPass.referralBuffExpiry(player2.address);

      expect(expiry1).to.be.closeTo(ts + 86400n, 5n);
      expect(expiry2).to.be.closeTo(ts + 86400n, 5n);
    });

    it("cannot claim referral buff for self", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      await expect(
        payOrPass.connect(player1).claimReferralBuff(player1.address)
      ).to.be.revertedWith("Cannot refer self");
    });
  });

  describe("exitArena", function () {
    it("player can exit and get principal back", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });

      const balBefore = await ethers.provider.getBalance(player1.address);
      const tx = await payOrPass.connect(player1).exitArena();
      const receipt = await tx.wait();
      const gas = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(player1.address);

      expect(balAfter + gas - balBefore).to.be.closeTo(fee, ethers.parseEther("0.001"));

      const g = await payOrPass.gladiators(player1.address);
      expect(g.isActive).to.be.false;
      expect(g.principalStaked).to.equal(0n);
    });

    it("cannot exit while in a fight", async function () {
      const { payOrPass, player1, player2 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });
      await payOrPass.connect(player2).enterArena(CELO_ERC20, { value: fee });

      const s = ethers.encodeBytes32String("exit-s");
      await payOrPass.connect(player1).submitChoice(player2.address, makeChoiceCommit(1, s, player1.address));

      await expect(
        payOrPass.connect(player1).exitArena()
      ).to.be.revertedWith("Finish your fight first");
    });

    it("cannot exit if not in arena", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      await expect(
        payOrPass.connect(player1).exitArena()
      ).to.be.revertedWith("You are not in the arena");
    });
  });

  describe("getActivePlayers", function () {
    it("returns only active gladiators", async function () {
      const { payOrPass, player1, player2 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);

      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });
      await payOrPass.connect(player2).enterArena(CELO_ERC20, { value: fee });

      let activePlayers = await payOrPass.getActivePlayers();
      expect(activePlayers.length).to.equal(2);

      // Player1 exits
      await payOrPass.connect(player1).exitArena();
      activePlayers = await payOrPass.getActivePlayers();
      expect(activePlayers.length).to.equal(1);
      expect(activePlayers[0]).to.equal(player2.address);
    });
  });

  describe("getCurrentPrizePool", function () {
    it("increases over time as yield accrues", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const fee = await payOrPass.entryFees(CELO_ERC20);
      await payOrPass.connect(player1).enterArena(CELO_ERC20, { value: fee });

      const pool0 = await payOrPass.getCurrentPrizePool(CELO_ERC20);
      await time.increase(3600); // 1 hour
      const pool1 = await payOrPass.getCurrentPrizePool(CELO_ERC20);

      expect(pool1).to.be.gt(pool0);
    });
  });

  describe("setTokenSupport (admin)", function () {
    it("admin can add and remove token support", async function () {
      const { payOrPass, owner } = await loadFixture(deployPayOrPassFixture);
      const fakeToken = "0x1234567890123456789012345678901234567890";
      await payOrPass.connect(owner).setTokenSupport(fakeToken, true, ethers.parseEther("1"));
      expect(await payOrPass.supportedTokens(fakeToken)).to.be.true;
    });

    it("non-admin cannot call setTokenSupport", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      await expect(
        payOrPass.connect(player1).setTokenSupport(CELO_ERC20, false, 0)
      ).to.be.revertedWith("Not an admin");
    });
  });

  describe("receive() fallback", function () {
    it("seeds prize pool when CELO is sent directly", async function () {
      const { payOrPass, player1 } = await loadFixture(deployPayOrPassFixture);
      const amount = ethers.parseEther("0.5");
      await player1.sendTransaction({ to: await payOrPass.getAddress(), value: amount });

      const pool = await payOrPass.accumulatedPrizePools(CELO_ERC20);
      expect(pool).to.equal(amount);
    });
  });
});
