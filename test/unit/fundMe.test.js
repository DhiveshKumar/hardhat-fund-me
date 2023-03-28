const { assert, expect } = require("chai");
const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe("FundMe", () => {
      let fundMe;
      let mockV3Aggregator;
      let msg;
      let sentValue;
      let deployer;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
        sentValue = ethers.utils.parseEther("1");
        // making trans to fundme contract

        // msg = await deployer.sendTransaction({
        //   to: fundMe.address,
        //   value: 1,
        //   data: "0x4b729aff0000000000000000000000000000000000000000000000000000000000000001",
        // });
      });

      describe("constructor", () => {
        it("checking whether the correct aggregator is assigned", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      // describe("receive ", () => {
      //   it("checks whether the receive fn is called only for msg with no data", async () => {
      //     const expectedResponse = "0x";
      //     const response = await msg.data;
      //     assert.equal(response.toString(), expectedResponse.toString());
      //     console.log("msg has no call data");
      //   });
      // });

      // describe("fallback", () => {
      //   it("checks whether the fallback fn is called only for msg/trans with data", async () => {
      //     const expectedResponse = "0x";
      //     const response = await msg.data;
      //     assert.equal(response.toString(), expectedResponse.toString());
      //     console.log("msg has call data");
      //   });
      // });

      describe("fund", () => {
        it("checks if the fund is sufficient or not", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updates the address and amt of the sender", async () => {
          // sending trans from deployer
          await fundMe.fund({ value: sentValue });
          const responseValue = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(responseValue.toString(), sentValue);
        });

        it("adds funder to the funders' array", async () => {
          await fundMe.fund({ value: sentValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sentValue });
        });

        it("withdraws the fund and sends it to the deployer(owner of contract)", async () => {
          const startFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gas calculation
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFundMeBalance, 0);
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasCost).toString()
          );
        });

        it("withdraws the amt funded by multiple funders", async () => {
          // getting the accs
          const accounts = await ethers.getSigners();

          // funding from  each acc
          for (let i = 0; i < 4; i++) {
            // at 0th index=> deployer(due to beforeEachg trans)
            await fundMe.connect(accounts[i]);
            await fundMe.fund({ value: sentValue });
          }

          const startFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gas calculation
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFundMeBalance, 0);
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasCost).toString()
          );

          // check whethers the getFunder array has been reset
          // console.log("0th at getFunder", await fundMe.getFunder(0));
          expect(fundMe.getFunder(0)).to.be.revertedWith("ARR IS RESET");

          // checking the mapping has been set 0
          for (var i = 0; i < 5; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("doesn't allow others except owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attackerAccount = accounts[1];
          // connecting attacker and contract
          const attackerConnectedContract = await fundMe.connect(
            attackerAccount
          );

          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );

          // await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
          //   "FundMe__NotOwner"
          // );
        });
      });

      describe("cheaperwithdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sentValue });
        });

        it("withdraws the fund and sends it to the deployer(owner of contract)", async () => {
          const startFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperwithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gas calculation
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFundMeBalance, 0);
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasCost).toString()
          );
        });

        it("withdraws the amt funded by multiple funders", async () => {
          // getting the accs
          const accounts = await ethers.getSigners();

          // funding from  each acc
          for (let i = 0; i < 4; i++) {
            // at 0th index=> deployer(due to beforeEachg trans)
            await fundMe.connect(accounts[i]);
            await fundMe.fund({ value: sentValue });
          }

          const startFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.cheaperwithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          // gas calculation
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endDeployerBalance = await ethers.provider.getBalance(deployer);

          assert.equal(endFundMeBalance, 0);
          assert.equal(
            startFundMeBalance.add(startDeployerBalance).toString(),
            endDeployerBalance.add(gasCost).toString()
          );

          // check whethers the getFunder array has been reset
          // console.log("0th at getFunder", await fundMe.getFunder(0));
          expect(fundMe.getFunder(0)).to.be.revertedWith("ARR IS RESET");

          // checking the mapping has been set 0
          for (var i = 0; i < 5; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("doesn't allow others except owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attackerAccount = accounts[1];
          // connecting attacker and contract
          const attackerConnectedContract = await fundMe.connect(
            attackerAccount
          );

          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          );

          // await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
          //   "FundMe__NotOwner"
          // );
        });
      });
    })
  : describe.skip;
