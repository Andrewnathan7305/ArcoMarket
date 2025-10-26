Will the new US citizenship test start after October 20, 2025? (Yes/No)

Has the US government updated immigration petition rules recently? (Yes/No)

Is the UK Parliament debating new policies this week? (Yes/No)

Did India launch a rural women credit scheme in Bihar? (Yes/No)

Is Solar Orbiter a NASA and ESA joint mission? (Yes/No)

Does Delhi’s pollution significantly reduce life expectancy? (Yes/No)

Was a new missile system recently developed by China? (Yes/No)

Will early citizenship applicants take the older civics test? (Yes/No)

Is the Assisted Dying Bill under review in UK’s House of Lords? (Yes/No)

Has USCIS introduced stricter moral character checks? (Yes/No)





 Step 1 – Start Anvil
Start your local blockchain network:

bash
anvil
Leave it running in that terminal window. It will show you accounts, their balances, and private keys .​

⚙️ Step 2 – Ensure Dependencies Are Installed
In your benchmark folder (where your JavaScript file is located):

bash
npm init -y
npm install ethers@6
This installs the required Ethers v6 library .​

📝 Step 3 – Create the Benchmark File
Save your JS code as a file, for example:

text
benchmark.js
Make sure your signer setup looks like this:

js
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);
▶️ Step 4 – Run the Script
Execute directly with Node:

bash
node benchmark.js
If using CommonJS (with require('ethers')), ensure your file starts with:

js
const { ethers } = require("ethers");
and your package.json does not have "type": "module".

If using ESM (import syntax), add "type": "module" in package.json.

📈 Step 5 – View Results
You’ll see console output like:

text
╔═══════════════════════════════════════════════════════════╗
║     PREDICTION MARKET BENCHMARK SUITE                     ║
╚═══════════════════════════════════════════════════════════╝

📍 Network: 31337
📊 TEST 1: MinimalMarket Throughput
   ✓ Completed: 100 bets
   ⏱️ Duration: 3.25s
   🚀 TPS: 30.77
   ⛽ Avg Gas: 82491
✅ Summary
Command sequence:

bash
anvil
npm install ethers@6
node benchmark.js
This runs your benchmark script on the local Anvil node, interacting with the deployed contracts on http://127.0.0.1:8545 using the test private key .​