const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
  const { deployer } = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);
  console.log("Funded!!!!");
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);
  console.log("FUND WITHDRAWN!!!!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
