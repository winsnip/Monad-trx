const prompts = require("prompts");
const displayHeader = require("./src/banner.js");
displayHeader();

console.log("List Modul AUTO\n");

console.log(`⏩ Uniswap`.red);
console.log(`⏩ Rubic Swap`.red);
console.log(`⏩ Magma Staking`.red);
console.log(`⏩ Izumi Swap`.red);
console.log(`⏩ Kitsu Staking`.red);
console.log(`⏩ aPriori Staking`.red);
console.log(`⏩ Auto Send`.red);
console.log("");

const scripts = [
  { name: "Uniswap", path: "./modul/uniswap.js" },
  { name: "Rubic Swap", path: "./modul/rubic.js" },
  { name: "Magma Staking", path: "./modul/magma.js" },
  { name: "Izumi Swap", path: "./modul/izumi.js" },
  { name: "Kitsu Staking", path: "./modul/kitsu.js" },
  { name: "aPriori Staking", path: "./modul/apriori.js" },
  { name: "Auto Send", path: "./modul/send.js" },
];

const { spawn } = require("child_process");

async function runScript(script) {
  console.log(`\n✅ Running ${script.name}...`);

  return new Promise((resolve, reject) => {
    const process = spawn("node", [script.path]);

    process.stdout.on("data", (data) => console.log(data.toString()));
    process.stderr.on("data", (data) => console.error(data.toString()));

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`? Finished ${script.name}`);
        resolve();
      } else {
        console.error(`❌ Error in ${script.name} (Exit code: ${code})`);
        reject(new Error(`Script ${script.name} failed`));
      }
    });
  });
}

async function runScriptsSequentially(loopCount) {
  for (let i = 0; i < loopCount; i++) {
    for (const script of scripts) {
      await runScript(script);
    }
  }
}

async function main() {
  while (true) {
    const response = await prompts({
      type: "number",
      name: "loopCount",
      message: "Looping : ",
      validate: (value) => (value > 0 ? true : "Enter a valid number greater than 0"),
    });

    const loopCount = response.loopCount || 1;
    console.log(`\n✅✅ Executing all scripts ${loopCount} times...\n`);
    
    await runScriptsSequentially(loopCount);

    console.log("\n✅✅ All scripts have been executed\n");
  }
}

main();
