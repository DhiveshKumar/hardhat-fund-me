const { deployments, getNamedAccounts, ethers, network } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  //   const fundMe = await ethers.getContract("FundMe", deployer);
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funding....");

  const transactionReceipt = await fundMe.fund({
    value: ethers.utils.parseEther("0.1"),
  });

  await transactionReceipt.wait(1);
  console.log("Funded!!!!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
