require("dotenv").config();
const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");
const displayHeader = require("../src/banner.js");

displayHeader();

const RPC_URL = "https://testnet-rpc.monad.xyz/";
const MON_CONTRACT = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const monContract = new ethers.Contract(MON_CONTRACT, [
  "function deposit() public payable",
  "function withdraw(uint256 wad) public"
], wallet);

function getRandomAmount() {
  const min = 0.01; 
  const max = 0.05; 
  return ethers.utils.parseEther((Math.random() * (max - min) + min).toFixed(4));
}

function getRandomDelay(min = 3000, max = 10000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function wrapMON(amount) {
  try {
    console.log(`🔄 Wrapping ${ethers.utils.formatEther(amount)} MON to WMON`.magenta);
    const tx = await monContract.deposit({ value: amount, gasLimit: 210000 });
    console.log("✅ Wrapped successfully! TX Hash:", tx.hash);
    await tx.wait();
  } catch (error) {
    console.error("❌ Error wrapping MON:", error);
  }
}

async function unwrapWMON(amount) {
  try {
    console.log(`🔄 Unwrapping ${ethers.utils.formatEther(amount)} WMON to MON`.magenta);
    const tx = await monContract.withdraw(amount, { gasLimit: 210000 });
    console.log("✅ Unwrapped successfully! TX Hash:", tx.hash);
    await tx.wait();
  } catch (error) {
    console.error("❌ Error unwrapping WMON:", error);
  }
}

async function runSwapCycle(cycles = 4) {
  try {
    for (let i = 0; i < cycles; i++) {
      const randomAmount = getRandomAmount(); 
      const randomDelay = getRandomDelay(); 

      await wrapMON(randomAmount);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      await unwrapWMON(randomAmount);

      if (i < cycles - 1) {
        const cycleDelay = getRandomDelay();
        console.log(`⏳ Waiting for ${(cycleDelay / 1000).toFixed(2)} seconds before next swap`.grey);
        await new Promise(resolve => setTimeout(resolve, cycleDelay)); 
      }
    }
    console.log("✅ Finished all swaps".green);
  } catch (error) {
    console.error("❌ Error during swap cycle:", error);
  }
}

(async () => {
  await runSwapCycle(4);
})();

module.exports = { wrapMON, unwrapWMON };
