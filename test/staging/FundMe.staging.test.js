const { assert, expect } = require("chai");
const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe;
      let sentValue;
      let deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        fundMe = await ethers.getContract("FundMe", deployer);
        sentValue = ethers.utils.parseEther("1000");
        // making trans to fundme contract

        // msg = await deployer.sendTransaction({
        //   to: fundMe.address,
        //   value: 1,
        //   data: "0x4b729aff0000000000000000000000000000000000000000000000000000000000000001",
        // });
      });

      it("allows to fund and withdraw", async () => {
        await fundMe.fund({ value: sentValue });
        await fundMe.withdraw();
        const endBalance = await ethers.provider.getBalance(fundMe.address);
        assert.equal(endBalance.toString(), "0");
      });
    });
