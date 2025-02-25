import { config } from "dotenv";
import { ethers } from "ethers";
import solc from "solc";
import chalk from "chalk";
import ora from "ora";
import readline from "readline";
config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = "https://testnet-rpc.monad.xyz";

if (!PRIVATE_KEY || !RPC_URL) {
    console.log(chalk.red.bold("❌ Missing environment variables!"));
    process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const chemicalTerms = [
    "Atom", "Molecule", "Electron", "Proton", "Neutron", "Ion", "Isotope", "Reaction", "Catalyst", "Solution",
    "Acid", "Base", "pH", "Oxidation", "Reduction", "Bond", "Valence", "Electrolyte", "Polymer", "Monomer",
    "Enzyme", "Substrate", "Covalent", "Ionic", "Metal", "Nonmetal", "Gas", "Liquid", "Solid", "Plasma",
    "Entropy", "Enthalpy", "Thermodynamics", "OrganicChemistry", "InorganicChemistry", "Biochemistry", "PhysicalChemistry", "Analytical", "Synthesis", "Decomposition",
    "Exothermic", "Endothermic", "Stoichiometry", "Concentration", "Molarity", "Molality", "Titration", "Indicator", "Chromatography", "Spectroscopy",
    "Electrochemistry", "GalvanicCell", "Electrolysis", "Anode", "Cathode", "Electrode", "Hydrolysis", "Hydrogenation", "Dehydrogenation", "Polymerization",
    "Depolymerization", "Catalyst", "Inhibitor", "Adsorption", "Absorption", "Diffusion", "Osmosis", "Colloid", "Suspension", "Emulsion",
    "Aerosol", "Surfactant", "Detergent", "Soap", "AminoAcid", "Protein", "Carbohydrate", "Lipid", "Nucleotide", "DNA",
    "RNA", "ActivationEnergy", "Complex", "Ligand", "Coordination", "Crystal", "Amorphous", "Isomer", "Stereochemistry"
];

const planets = [
    "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Ceres",
    "Eris", "Haumea", "Makemake", "Ganymede", "Titan", "Callisto", "Io", "Europa", "Triton", "Charon",
    "Titania", "Oberon", "Rhea", "Iapetus", "Dione", "Tethys", "Enceladus", "Miranda", "Ariel", "Umbriel",
    "Proteus", "Nereid", "Phobos", "Deimos", "Amalthea", "Himalia", "Elara", "Pasiphae", "Sinope", "Lysithea",
    "Carme", "Ananke", "Leda", "Thebe", "Adrastea", "Metis", "Callirrhoe", "Themisto", "Megaclite", "Taygete",
    "Chaldene", "Harpalyke", "Kalyke", "Iocaste", "Erinome", "Isonoe", "Praxidike", "Autonoe", "Thyone", "Hermippe",
    "Aitne", "Eurydome", "Euanthe", "Euporie", "Orthosie", "Sponde", "Kale", "Pasithee", "Hegemone", "Mneme",
    "Aoede", "Thelxinoe", "Arche", "Kallichore", "Helike", "Carpo", "Eukelade", "Cyllene", "Kore", "Herse",
    "Dia", "S2003J2", "S2003J3", "S2003J4", "S2003J5", "S2003J9", "S2003J10", "S2003J12", "S2003J15"
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function generateRandomName() {
    const combinedTerms = [...chemicalTerms, ...planets];
    const shuffled = combinedTerms.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).join("");
}

const contractSource = `
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;
    
    event CountIncremented(uint256 newCount);
    
    function increment() public {
        count += 1;
        emit CountIncremented(count);
    }
    
    function getCount() public view returns (uint256) {
        return count;
    }
}
`;

function compileContract() {
    const spinner = ora("Compiling contract...").start();

    try {
        const input = {
            language: "Solidity",
            sources: { "Counter.sol": { content: contractSource } },
            settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
        };

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        const contract = output.contracts["Counter.sol"].Counter;

        spinner.succeed(chalk.green("Contract compiled successfully!"));
        return { abi: contract.abi, bytecode: contract.evm.bytecode.object };
    } catch (error) {
        spinner.fail(chalk.red("Contract compilation failed!"));
        console.error(error);
        process.exit(1);
    }
}

async function deployContract(contractName) {
    const { abi, bytecode } = compileContract();
    const spinner = ora(`Deploying contract ${contractName} to blockchain...`).start();

    try {

        const nonce = await provider.getTransactionCount(wallet.address, "latest");
        console.log(chalk.gray(`Using nonce: ${nonce}`));

        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const contract = await factory.deploy(); 

        console.log("⏳ Waiting for transaction confirmation...");
        const txReceipt = await contract.deployTransaction.wait();

        spinner.succeed(chalk.green(`Contract ${contractName} deployed successfully!`));
        console.log(chalk.cyan.bold("\n📌 Contract Address: ") + chalk.yellow(contract.address));
        console.log(chalk.cyan.bold("\n📜 Transaction Hash: ") + chalk.yellow(txReceipt.transactionHash));
        console.log(chalk.green("\n✅ Deployment complete! 🎉\n"));
    } catch (error) {
        spinner.fail(chalk.red("Deployment failed!"));
        console.error(error);
        process.exit(1);
    }
}

console.log(chalk.blue("🪫  Starting Deploy Contract ⏩⏩⏩⏩"));
console.log(" ");

const numberOfContracts = 5;

for (let i = 0; i < numberOfContracts; i++) {
    const contractName = generateRandomName();
    console.log(chalk.yellow(`\n🚀 Deploying contract ${i + 1}/${numberOfContracts}: ${contractName}`));
    await deployContract(contractName);

    const delay = Math.floor(Math.random() * (6000 - 4000 + 1)) + 4000;
    console.log(chalk.gray(`⏳ Waiting for ${delay / 1000} Seconds`));
    await new Promise((resolve) => setTimeout(resolve, delay));
}

console.log(chalk.green.bold("\n✅ All contracts deployed successfully! 🎉\n"));
