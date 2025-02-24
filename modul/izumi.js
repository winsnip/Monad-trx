require("dotenv").config();
const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");
const displayHeader = require("../src/banner.js");

displayHeader();

const RPC_URL = "https://testnet-rpc.monorail.xyz";
const EXPLORER_URL = "https://testnet.monadexplorer.com/tx";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WMON_CONTRACT = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  WMON_CONTRACT,
  ["function deposit() public payable", "function withdraw(uint256 amount) public"],
  wallet
);

function getRandomAmount() {
  const min = 0.01;
  const max = 0.05;
  return ethers.utils.parseEther((Math.random() * (max - min) + min).toFixed(4));
}

function getRandomDelay() {
  return Math.floor(Math.random() * (3 * 60 * 1000 - 1 * 60 * 1000 + 1) + 1 * 60 * 1000);
}

async function wrapMON(amount) {
  try {
    console.log("Starting Izumi".green);
    console.log(`?? Wrap ${ethers.utils.formatEther(amount)} MON > WMON`.magenta);
    const tx = await contract.deposit({ value: amount, gasLimit: 500000 });
    console.log(`? Wrap MON > WMON successful`.green);
    console.log(`? Hash: ${EXPLORER_URL}/${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error("? Error wrapping MON:".red, error);
  }
}

async function unwrapMON(amount) {
  try {
    console.log(`?? Unwrap ${ethers.utils.formatEther(amount)} WMON > MON`.magenta);
    const tx = await contract.withdraw(amount, { gasLimit: 500000 });
    console.log(`? Unwrap WMON > MON successful`.green);
    console.log(`? Hash: ${EXPLORER_URL}/${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error("? Error unwrapping WMON:".red, error);
  }
}

async function runSwapCycle(cycles = 1) {
  try {
    for (let i = 0; i < cycles; i++) {
      const randomAmount = getRandomAmount();
      const randomDelay = getRandomDelay();
      await wrapMON(randomAmount);
      await unwrapMON(randomAmount);
      if (i < cycles - 1) {
        console.log(`?? Wait ${randomDelay / 1000 / 60} minutes`.yellow);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }
    }
    console.log("? Finished Izumi Swap".green);
  } catch (error) {
    console.error("? Error in runSwapCycle:".red, error);
  }
}

runSwapCycle().catch(error => {
  console.error("? Unhandled error in runSwapCycle:".red, error);
});