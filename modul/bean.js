const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");
const fs = require("fs");

const { ROUTER_CONTRACT, WMON_CONTRACT, USDC_CONTRACT, BEAN_CONTRACT, JAI_CONTRACT, ABI } = require("../abi/BEAN.js");

const displayHeader = require("../src/banner.js");

require("dotenv").config();
displayHeader();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error("No Privatekey in .env");
}

const RPC_URLS = [
    "https://testnet-rpc.monorail.xyz",
    "https://testnet-rpc.monad.xyz",
    "https://monad-testnet.drpc.org"
];

const CHAIN_ID = 10143;
const BEAN_SWAP_ROUTER_ADDRESS = ROUTER_CONTRACT; 
const WETH_ADDRESS = WMON_CONTRACT; 

const TOKEN_ADDRESSES = {
    "WMON": WMON_CONTRACT, 
    "USDC": USDC_CONTRACT, 
    "BEAN": BEAN_CONTRACT,  
    "JAI ": JAI_CONTRACT
};

const erc20Abi = [
    { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
    { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
];

async function connectToRpc() {
    for (const url of RPC_URLS) {
        try {
            const provider = new ethers.providers.JsonRpcProvider(url);
            await provider.getNetwork();
            console.log(`🪫  Starting BeanSwap ⏩⏩⏩⏩`.blue);
            console.log(` `);
            return provider;
        } catch (error) {
            console.log(`Failed to connect to ${url}, trying another...`);
        }
    }
    throw new Error(`❌ Unable to connect`.red);
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomEthAmount() {
    return ethers.utils.parseEther((Math.random() * (0.01 - 0.0001) + 0.0001).toFixed(6));
}

async function swapEthForTokens(wallet, tokenAddress, amountInWei, tokenSymbol) {
    const router = new ethers.Contract(BEAN_SWAP_ROUTER_ADDRESS, ABI, wallet); 

    try {
        console.log(`🔄 Swap ${ethers.utils.formatEther(amountInWei)} MON > ${tokenSymbol}`.green);

        const nonce = await wallet.getTransactionCount("pending");

        const tx = await router.swapExactETHForTokens(
            0, 
            [WETH_ADDRESS, tokenAddress], 
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 10, 
            {
                value: amountInWei,
                gasLimit: 210000, 
                nonce: nonce 
            }
        );
        console.log(`➡️  Hash: ${tx.hash}`.yellow);
    } catch (error) {
        console.error(`❌ Failed swap: ${error.message}`.red);
    }
}

async function swapTokensForEth(wallet, tokenAddress, tokenSymbol) {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);

    if (balance.eq(0)) {
        console.log(`❌ No balance ${tokenSymbol}, skip`.black);
        return;
    }

    const router = new ethers.Contract(BEAN_SWAP_ROUTER_ADDRESS, ABI, wallet);

    try {
        console.log(`🔄 Swap ${tokenSymbol} > MON`.green);

        await tokenContract.approve(BEAN_SWAP_ROUTER_ADDRESS, balance);

        const nonce = await wallet.getTransactionCount("pending");

        const tx = await router.swapExactTokensForETH(
            balance, 
            0, 
            [tokenAddress, WETH_ADDRESS], 
            wallet.address, 
            Math.floor(Date.now() / 1000) + 60 * 10, 
            {
                gasLimit: 210000, 
                nonce: nonce 
            }
        );
        console.log(`➡️  Hash ${tx.hash}`.yellow);

        const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        console.log(`⏳ Wait ${delay / 1000} seconds`.grey);
        console.log(` `);

        await sleep(delay);
    } catch (error) {
        console.error(`❌ Failed: ${error.message}`.red);
    }
}

async function getBalance(wallet) {
    const provider = wallet.provider;

    const monBalance = await provider.getBalance(wallet.address);
    console.log(`🧧 MON    : ${ethers.utils.formatEther(monBalance)} MON`.green);

    const wethContract = new ethers.Contract(WETH_ADDRESS, erc20Abi, wallet);
    const wethBalance = await wethContract.balanceOf(wallet.address);
    console.log(`🧧 WETH   : ${ethers.utils.formatEther(wethBalance)} WETH`.green);
    console.log(" ");
}

async function main() {
    const provider = await connectToRpc();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`🧧 Account: ${wallet.address}`.green);

    await getBalance(wallet);

    for (const [tokenSymbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        const ethAmount = getRandomEthAmount();
        await swapEthForTokens(wallet, tokenAddress, ethAmount, tokenSymbol);
        const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        console.log(`⏳ Wait ${delay / 1000} seconds`.grey);
        console.log(` `);
        await sleep(delay);
    }

    console.log(" ");
    console.log(`🧿 All Token Reverse to MONAD`.white);
    console.log(" ");
    
    for (const [tokenSymbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        await swapTokensForEth(wallet, tokenAddress, tokenSymbol);
    }
}

main().catch(console.error);
