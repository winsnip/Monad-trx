const { ethers } = require('ethers');
require('dotenv').config(); 
const fs = require('fs'); 
const colors = require("colors");
const cfonts = require("cfonts");
const displayHeader = require("../src/banner.js");

displayHeader();

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
    console.error('Private key tidak ditemukan di .env');
    process.exit(1);
}

const network = {
    name: "Monad Testnet",
    chainId: 10143,
    rpc: "https://testnet-rpc.monad.xyz/",
    symbol: "MON",
    explorer: "https://testnet.monadexplorer.com"
};

const provider = new ethers.providers.JsonRpcProvider(network.rpc);

function generateNewWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey
    };
}

async function transferTokens(wallet, index) {
    const newWallet = generateNewWallet();
    console.log(`Generated recipient address: ${newWallet.address}`);

    const randomAmount = Math.max(Math.random() * (0.001 - 0.0001) + 0.0001, 0.0001); 
    console.log(`Transferring ${randomAmount} ${network.symbol} to ${newWallet.address}`);

    const tx = {
        to: newWallet.address,
        value: ethers.utils.parseUnits(randomAmount.toFixed(18), 18) 
    };

    const transaction = await wallet.sendTransaction(tx);
    const shortAddress = newWallet.address.slice(-5); 

    console.log(`(${index + 1}/50) : ${randomAmount} ${network.symbol} sent to ${shortAddress} : ${transaction.hash}`);
    await transaction.wait();
    console.log('Transaction confirmed!');
}

async function handleTokenTransfers() {
    const wallet = new ethers.Wallet(privateKey, provider); 

    console.log(`Using wallet: ${wallet.address}`);
    console.log('Starting token transfer to 50 random wallets...');

    for (let i = 0; i < 50; i++) {
        console.log(`\nProcessing transfer ${i + 1} of 50...`);
        await transferTokens(wallet, i);
    }

    console.log('\nAll transactions completed successfully!');
}

handleTokenTransfers().catch(console.error);
