const { ethers } = require("ethers");
require("dotenv").config();

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
const UNISWAP_V2_ROUTER_ADDRESS = "0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89";
const WETH_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";

const TOKEN_ADDRESSES = {
    "DAC  ": "0x0f0bdebf0f83cd1ee3974779bcb7315f9808c714",
    "USDT ": "0x88b8e2161dedc77ef4ab7585569d2415a1c1055d",
    "WETH ": "0x836047a99e11f376522b447bffb6e3495dd0637c",
    "MUK  ": "0x989d38aeed8408452f0273c7d4a17fef20878e62",
    "USDC ": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
    "CHOG ": "0xE0590015A873bF326bd645c3E1266d4db41C4E6B"
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
            console.log(`? Connected to ${url}`);
            return provider;
        } catch (error) {
            console.log(`Failed to connect to ${url}, trying another...`);
        }
    }
    throw new Error(`Unable to connect to any RPC`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomEthAmount() {
    return ethers.utils.parseEther((Math.random() * (0.01 - 0.0001) + 0.0001).toFixed(6));
}

async function swapEthForTokens(wallet, tokenAddress, amountInWei, tokenSymbol) {
    const router = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, [
        {
            "name": "swapExactETHForTokens",
            "type": "function",
            "stateMutability": "payable",
            "inputs": [
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ]
        }
    ], wallet);

    try {
        console.log(`Swap ${ethers.utils.formatEther(amountInWei)} MON > ${tokenSymbol}`);

        const nonce = await wallet.getTransactionCount("pending");

        const tx = await router.swapExactETHForTokens(
            0, 
            [WETH_ADDRESS, tokenAddress], 
            wallet.address, 
            Math.floor(Date.now() / 1000) + 60 * 10, 
            {
                value: amountInWei,
                gasLimit: 200000, 
                nonce: nonce 
            }
        );
        console.log(`? Hash: ${tx.hash}`);
    } catch (error) {
        console.error(`Failed to swap: ${error.message}`);
    }
}

async function swapTokensForEth(wallet, tokenAddress, tokenSymbol) {
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);

    if (balance.eq(0)) {
        console.log(`No balance for ${tokenSymbol}, skipping...`);
        return;
    }

    const router = new ethers.Contract(UNISWAP_V2_ROUTER_ADDRESS, [
        {
            "name": "swapExactTokensForETH",
            "type": "function",
            "stateMutability": "nonpayable",
            "inputs": [
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
                { "internalType": "address[]", "name": "path", "type": "address[]" },
                { "internalType": "address", "name": "to", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" }
            ]
        }
    ], wallet);

    try {
        console.log(`Swap ${tokenSymbol} > MON`);

        await tokenContract.approve(UNISWAP_V2_ROUTER_ADDRESS, balance);

        const nonce = await wallet.getTransactionCount("pending");

        const tx = await router.swapExactTokensForETH(
            balance, 
            0, 
            [tokenAddress, WETH_ADDRESS], 
            wallet.address, 
            Math.floor(Date.now() / 1000) + 60 * 10, 
            {
                gasLimit: 200000, 
                nonce: nonce 
            }
        );
        console.log(`? Hash: ${tx.hash}`);

        const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        console.log(`? Wait ${delay / 1000} seconds`);
        await sleep(delay);
    } catch (error) {
        console.error(`Failed to swap: ${error.message}`);
    }
}

async function getBalance(wallet) {
    const provider = wallet.provider;

    const monBalance = await provider.getBalance(wallet.address);
    console.log(`MON Balance: ${ethers.utils.formatEther(monBalance)} MON`);

    const wethContract = new ethers.Contract(WETH_ADDRESS, erc20Abi, wallet);
    const wethBalance = await wethContract.balanceOf(wallet.address);
    console.log(`WETH Balance: ${ethers.utils.formatEther(wethBalance)} WETH`);
    console.log(" ");
}

async function main() {
    const provider = await connectToRpc();
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Account: ${wallet.address}`);

    await getBalance(wallet);

    for (const [tokenSymbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        const ethAmount = getRandomEthAmount();
        await swapEthForTokens(wallet, tokenAddress, ethAmount, tokenSymbol);
        const delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        console.log(`? Wait ${delay / 1000} seconds`);
        await sleep(delay);
    }
    console.log(" ");
    console.log(`All Token Reverse to MONAD`);
    console.log(" ");
    for (const [tokenSymbol, tokenAddress] of Object.entries(TOKEN_ADDRESSES)) {
        await swapTokensForEth(wallet, tokenAddress, tokenSymbol);
    }
}

main().catch(console.error);