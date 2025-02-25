const { ethers } = require("ethers");
const colors = require("colors");
const cfonts = require("cfonts");

const displayHeader = require("../src/banner.js");
require("dotenv").config();
displayHeader();

const RPC_URL = "https://testnet-rpc.monad.xyz";
const EXPLORER_URL = "https://testnet.monadexplorer.com/tx/";
const CONTRACT_ADDRESS = "0xC995498c22a012353FAE7eCC701810D673E25794";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error(colors.red("❌ Private key tidak ditemukan! Set dalam .env file."));
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
console.log(`ðŸª«  Starting Monorail â©â©â©â©`.blue);
console.log(` `);
console.log(colors.green(`✅ Wallet initialized: ${wallet.address}`));

async function checkBalance() {
  const balance = await provider.getBalance(wallet.address);
  console.log(colors.cyan(`💰 Balance: ${ethers.utils.formatEther(balance)} ETH`));

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    console.error(colors.red("❌ Saldo tidak cukup untuk transaksi."));
    process.exit(1);
  }
}

async function sendTransaction() {
  await checkBalance();

  const walletData = { account: { address: wallet.address } };
  const data = `0x96f25cbe0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e0590015a873bf326bd645c3e1266d4db41c4e6b000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000${walletData.account.address.replace(/^0x/, "")}000000000000000000000000000000000000000000000000542f8f7c3d64ce470000000000000000000000000000000000000000000000000000002885eeed340000000000000000000000000000000000000000000000000000000000000004000000000000000000000000760afe86e5de5fa0ee542fc7b7b713e1c5425701000000000000000000000000760afe86e5de5fa0ee542fc7b7b713e1c5425701000000000000000000000000cba6b9a951749b8735c603e7ffc5151849248772000000000000000000000000760afe86e5de5fa0ee542fc7b7b713e1c54257010000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000004d0e30db0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000cba6b9a951749b8735c603e7ffc5151849248772000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010438ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000542f8f7c3d64ce4700000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000c995498c22a012353fae7ecc701810d673e257940000000000000000000000000000000000000000000000000000002885eeed340000000000000000000000000000000000000000000000000000000000000002000000000000000000000000760afe86e5de5fa0ee542fc7b7b713e1c5425701000000000000000000000000e0590015a873bf326bd645c3e1266d4db41c4e6b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044095ea7b3000000000000000000000000cba6b9a951749b8735c603e7ffc5151849248772000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000`;

  const value = ethers.utils.parseEther("0.1");

  try {
    console.log(colors.yellow("🔍 Memeriksa apakah transaksi bisa dieksekusi..."));
    await provider.call({ to: CONTRACT_ADDRESS, data: data });
    console.log(colors.green("✅ Transaksi valid. Melanjutkan..."));

    let gasLimit;
    try {
      gasLimit = await provider.estimateGas({
        from: wallet.address,
        to: CONTRACT_ADDRESS,
        value: value,
        data: data,
      });
    } catch (err) {
      console.warn(colors.yellow("⚠️ Estimasi gas gagal. Menggunakan gas limit default."));
      gasLimit = ethers.utils.hexlify(500000);
    }

    const tx = {
      from: wallet.address,
      to: CONTRACT_ADDRESS,
      data: data,
      value: value,
      gasLimit: gasLimit,
      gasPrice: await provider.getGasPrice(),
    };

    console.log(colors.blue("🚀 Mengirim transaksi..."));
    const txResponse = await wallet.sendTransaction(tx);
    console.log(colors.green(`✅ Transaksi dikirim! Menunggu konfirmasi...`));
    await txResponse.wait();

    console.log(colors.green(`🎉 Transaksi sukses!`));
    console.log(colors.cyan(`🔗 Explorer: ${EXPLORER_URL}${txResponse.hash}`));
  } catch (error) {
    console.error(colors.red("❌ Error terjadi:", error.message || error));
  }
}

sendTransaction();
