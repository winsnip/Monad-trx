require("dotenv").config();
const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");
const displayHeader = require("../src/banner.js");

displayHeader();

const RPC_URL = "https://testnet-rpc.monorail.xyz";
const EXPLORER_URL = "https://testnet.monadexplorer.com/tx/";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const WMON_CONTRACT = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  WMON_CONTRACT,
  [
    "function deposit() public payable",
    "function withdraw(uint256 amount) public",
  ],
  wallet
);

function getRandomAmount() {
  const min = 0.01;
  const max = 0.05;
  const randomAmount = Math.random() * (max - min) + min;
  return ethers.utils.parseEther(randomAmount.toFixed(4));
}

function getRandomDelay() {
  const minDelay = 1 * 60 * 1000;
  const maxDelay = 3 * 60 * 1000;
  return Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
}

async function wrapMON(amount) {
  try {
    console.log(` `);
    console.log(`🔄 Wrap ${ethers.utils.formatEther(amount)} MON > WMON`.magenta);
    const tx = await contract.deposit({ value: amount, gasLimit: 500000 });
    console.log(`✅ Wrap MON > WMON successful`.green);
    console.log(`➡️  Hash: ${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error(`❌ Error wrap MON:`.red, error);
  }
}

async function unwrapMON(amount) {
  try {
    console.log(`🔄 Unwrap ${ethers.utils.formatEther(amount)} WMON > MON`.magenta);
    const tx = await contract.withdraw(amount, { gasLimit: 500000 });
    console.log(`✅ Unwrap WMON > MON successful`.green);
    console.log(`➡️  Hash: ${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error(`❌ Error unwrapping WMON:`.red, error);
  }
}

async function runSwapCycle(cycles = 1, interval = null) {
  for (let i = 0; i < cycles; i++) {
    const randomAmount = getRandomAmount();
    const randomDelay = getRandomDelay();
    await wrapMON(randomAmount);
    await unwrapMON(randomAmount);
    console.log(`⏳ Wait ${randomDelay / 1000 / 60} Minute`.grey);
    await new Promise((resolve) => setTimeout(resolve, randomDelay));
  }
}

(async () => {
  console.log(`🪫  Starting Rubic ⏩⏩⏩⏩`.blue);
  await runSwapCycle();
})();
