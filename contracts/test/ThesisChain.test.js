import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ThesisChain Smart Contracts", function () {
  async function deployFixture() {
    const [admin, creator, student, mentor] = await ethers.getSigners();

    const ThesisCredits = await ethers.getContractFactory("ThesisCredits");
    const tcr = await ThesisCredits.deploy();
    await tcr.waitForDeployment();

    const ThesisPlatform = await ethers.getContractFactory("ThesisPlatform");
    const platform = await ThesisPlatform.deploy(await tcr.getAddress());
    await platform.waitForDeployment();

    return { tcr, platform, admin, creator, student, mentor };
  }

  it("1. Mints 1,000,000 TCR to contract treasury and enforces one-time faucet claim", async function () {
    const { tcr, student } = await deployFixture();
    const treasuryBalance = await tcr.balanceOf(await tcr.getAddress());
    expect(treasuryBalance).to.equal(ethers.parseEther("1000000"));

    // First claim succeeds (500 TCR)
    await tcr.connect(student).claimFaucet();
    expect(await tcr.balanceOf(student.address)).to.equal(ethers.parseEther("500"));

    // Second claim reverts
    await expect(tcr.connect(student).claimFaucet()).to.be.revertedWith(
      "Faucet: Wallet has already claimed TCR"
    );
  });

  it("2. Registers project, mints Soulbound NFT, and blocks NFT transfers", async function () {
    const { platform, creator, student } = await deployFixture();
    const price = ethers.parseEther("100");

    await platform.connect(creator).registerProject(1, "ipfs://QmTestHash", price);
    expect(await platform.ownerOf(1)).to.equal(creator.address);

    // Attempt to transfer Soulbound certificate NFT must revert
    await expect(
      platform.connect(creator).transferFrom(creator.address, student.address, 1)
    ).to.be.revertedWith("Soulbound: Certificate NFTs are non-transferable");
  });

  it("3. Executes project licensing payment in TCR", async function () {
    const { tcr, platform, creator, student } = await deployFixture();
    const price = ethers.parseEther("100");

    await platform.connect(creator).registerProject(1, "ipfs://QmTestHash", price);
    await tcr.connect(student).claimFaucet();

    // Approve and purchase license
    await tcr.connect(student).approve(await platform.getAddress(), price);
    await platform.connect(student).licenseProject(1);

    expect(await tcr.balanceOf(creator.address)).to.equal(price);
    expect(await tcr.balanceOf(student.address)).to.equal(ethers.parseEther("400"));
    expect(await platform.hasLicensed(1, student.address)).to.equal(true);
  });

  it("4. Executes peer-to-peer mentorship payment in TCR", async function () {
    const { tcr, platform, student, mentor } = await deployFixture();
    const fee = ethers.parseEther("50");

    await tcr.connect(student).claimFaucet();
    await tcr.connect(student).approve(await platform.getAddress(), fee);
    await platform.connect(student).payMentorship(101, mentor.address, fee);

    expect(await tcr.balanceOf(mentor.address)).to.equal(fee);
    expect(await tcr.balanceOf(student.address)).to.equal(ethers.parseEther("450"));
  });
});