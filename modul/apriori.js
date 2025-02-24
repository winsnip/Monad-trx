require("dotenv").config();
const ethers = require("ethers");
const colors = require("colors");
const displayHeader = require("../src/banner.js");
const readline = require("readline");
const axios = require("axios");

displayHeader();

const RPC_URL = "https://testnet-rpc.monad.xyz"; 
const EXPLORER_URL = "https://testnet.monadexplorer.com/tx/";
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const contractAddress = "0xb2f82D0f38dc453D596Ad40A37799446Cc89274A";
const gasLimitStake = 500000;
const gasLimitUnstake = 800000;
const gasLimitClaim = 800000;

const minimalABI = [
  "function getPendingUnstakeRequests(address) view returns (uint256[] memory)",
];

const contract = new ethers.Contract(contractAddress, minimalABI, provider);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getRandomAmount() {
  const min = 0.01;
  const max = 0.05;
  const randomAmount = Math.random() * (max - min) + min;
  return ethers.utils.parseEther(randomAmount.toFixed(4));
}

function getRandomDelay() {
  const minDelay = 1 * 60 * 1000;
  const maxDelay = 2 * 60 * 1000;
  return Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function stakeMON(cycleNumber) {
  try {
    const stakeAmount = getRandomAmount();
    console.log(
      `Random stake?: ${ethers.utils.formatEther(stakeAmount)} MON`
    );

    const data =
      "0x6e553f65" +
      ethers.utils.hexZeroPad(stakeAmount.toHexString(), 32).slice(2) +
      ethers.utils.hexZeroPad(wallet.address, 32).slice(2);

    const tx = {
      to: contractAddress,
      data: data,
      gasLimit: ethers.utils.hexlify(gasLimitStake),
      value: stakeAmount,
    };

    console.log("?? Sending stake transaction");
    const txResponse = await wallet.sendTransaction(tx);
    console.log(
      `?? Hash: ${txResponse.hash}`.yellow
    );

    console.log("Wait confirmation");
    const receipt = await txResponse.wait();
    console.log(`??  Stake successful!`.green);

    return { receipt, stakeAmount };
  } catch (error) {
    console.error("? Staking failed:".red, error.message);
    throw error;
  }
}

async function requestUnstakeAprMON(amountToUnstake, cycleNumber) {
  try {
    console.log(
      `Amount unstake: ${ethers.utils.formatEther(
        amountToUnstake
      )} aprMON`
    );

    const data =
      "0x7d41c86e" +
      ethers.utils.hexZeroPad(amountToUnstake.toHexString(), 32).slice(2) +
      ethers.utils.hexZeroPad(wallet.address, 32).slice(2) +
      ethers.utils.hexZeroPad(wallet.address, 32).slice(2);

    const tx = {
      to: contractAddress,
      data: data,
      gasLimit: ethers.utils.hexlify(gasLimitUnstake),
      value: ethers.utils.parseEther("0"),
    };

    console.log("?? Sending unstake");
    const txResponse = await wallet.sendTransaction(tx);
    console.log(
      `??  Hash: ${txResponse.hash}`.yellow
    );

    console.log("?? Wait confirmation");
    const receipt = await txResponse.wait();
    console.log(`??  Unstake successful!`.green);

    return receipt;
  } catch (error) {
    console.error("? Unstake failed:".red, error.message);
    throw error;
  }
}

async function checkClaimableStatus(walletAddress) {
  try {
    const apiUrl = `https://testnet.monadexplorer.com/api/v1/unstake-requests?address=${walletAddress}`;
    const response = await axios.get(apiUrl);

    const claimableRequest = response.data.find(
      (request) => !request.claimed && request.is_claimable
    );

    if (claimableRequest) {
      console.log(`Found claimable request ID: ${claimableRequest.id}`);
      return {
        id: claimableRequest.id,
        isClaimable: true,
      };
    }
    return {
      id: null,
      isClaimable: false,
    };
  } catch (error) {
    console.error(
      "? Failed to check claimable status from API:".red,
      error.message
    );
    return {
      id: null,
      isClaimable: false,
    };
  }
}

async function claimMON(cycleNumber) {
  try {
    const { id, isClaimable } = await checkClaimableStatus(wallet.address);

    if (!isClaimable || !id) {
      console.log("No claimable withdrawals found at this time");
      return null;
    }

    console.log(`Claim withdrawal: ${id}`);

    const data =
      "0x492e47d2" +
      "0000000000000000000000000000000000000000000000000000000000000040" +
      ethers.utils.hexZeroPad(wallet.address, 32).slice(2) +
      "0000000000000000000000000000000000000000000000000000000000000001" +
      ethers.utils
        .hexZeroPad(ethers.BigNumber.from(id).toHexString(), 32)
        .slice(2);

    const tx = {
      to: contractAddress,
      data: data,
      gasLimit: ethers.utils.hexlify(gasLimitClaim),
      value: ethers.utils.parseEther("0"),
    };

    console.log("Sending claim ");
    const txResponse = await wallet.sendTransaction(tx);
    console.log(`Hash: ${txResponse.hash}`);

    console.log("Wait transaction confirmation");
    const receipt = await txResponse.wait();
    console.log(`Claim successful ID: ${id}`.green.underline);

    return receipt;
  } catch (error) {
    console.error("Claim failed:", error.message);
    throw error;
  }
}

async function runCycle(cycleNumber) {
  try {
    const { stakeAmount } = await stakeMON(cycleNumber);

    const delayTimeBeforeUnstake = getRandomDelay();
    console.log(
      `?? Waiting for ${
        delayTimeBeforeUnstake / 1000
      } Seconds `
    );
    await delay(delayTimeBeforeUnstake);

    await requestUnstakeAprMON(stakeAmount, cycleNumber);

    console.log(
      `Wait`.magenta
    );
    await delay(660000);


    await claimMON(cycleNumber);

    console.log();
  } catch (error) {
    console.error(`? Cycle ${cycleNumber} failed:`.red, error.message);
    throw error;
  }
}

async function getCycleCount() {
  return 1;
}

async function main() {
  try {
    console.log("Starting aPriori ".green);

    const cycleCount = await getCycleCount();

    for (let i = 1; i <= cycleCount; i++) {
      await runCycle(i);

      if (i < cycleCount) {
        const interCycleDelay = getRandomDelay();
        console.log();
        await delay(interCycleDelay);
      }
    }

    console.log(
      `\nAll completed successfully!`.green.bold
    );
  } catch (error) {
    console.error("Operation failed:".red, error.message);
  } finally {
    rl.close();
  }
}

main();

module.exports = {
  stakeMON,
  requestUnstakeAprMON,
  claimMON,
  getRandomAmount,
  getRandomDelay,
};