require("dotenv").config();
const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");
const displayHeader = require("../src/banner.js");

displayHeader();

const RPC_URL = "https://testnet-rpc.monad.xyz/"; 
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
    console.log(`🪫 Starting Bebop ⏩⏩⏩⏩`.blue);
    console.log(` `);
    console.log(`🔄 Wrapping ${ethers.utils.formatEther(amount)} MON to WMON`.magenta);

    const tx = await contract.deposit({ value: amount, gasLimit: 210000 });
    console.log(`✅ Successfully wrapped MON to WMON`.green);
    console.log(`➡️  Hash: ${tx.hash}`.grey);
    await tx.wait();
  } catch (error) {
    console.error(`❌ Error while wrapping MON to WMON:`.red, error);
  }
}


async function unwrapMON(amount) {
  try {
    console.log(`🔄 Unwrapping ${ethers.utils.formatEther(amount)} WMON to MON`.magenta);
    const tx = await contract.withdraw(amount, { gasLimit: 210000 });
    console.log(`✅ Successfully unwrapped WMON to MON`.green);
    console.log(`➡️  Hash: ${tx.hash}`.grey);
    await tx.wait();
  } catch (error) {
    console.error(`❌ Error while unwrapping WMON to MON:`.red, error);
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
        console.log(`⏳ Waiting for ${randomDelay / 1000 / 60} minutes`.grey);
        await new Promise(resolve => setTimeout(resolve, randomDelay)); 
      }
    }
    console.log(`✅ Finished`.green);
  } catch (error) {
    console.error(`❌ Error during swap cycle:`.red, error);
  }
}

runSwapCycle(1).catch(error => {
  console.error(`❌ Error in runSwapCycle:`.red, error);
});
