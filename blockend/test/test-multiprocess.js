const hre = require("hardhat");
var frontendUtil = require('@arcologynetwork/frontend-util/utils/util')
const nets = require('../network.json');

async function main() {
    accounts = await ethers.getSigners(); 

    console.log('======start deploying contract======')
    const mmp_factory = await ethers.getContractFactory("MyMultiProcess");
    const mmp = await mmp_factory.deploy();
    await mmp.deployed();
    console.log(`Deployed MyMultiProcess Test at ${mmp.address}`)

    let tx,receipt

    console.log('======start executing TXs calling add======')
    tx = await mmp.add(5,2);
    receipt=await tx.wait();
    frontendUtil.showResult(frontendUtil.parseReceipt(receipt));
    if(Number(frontendUtil.parseEvent(receipt,mmp,"QueryBalance"))===10){
      console.log("✅ Test Successful");
    }else{
      console.log("❌ Test Failed");
    } 

    console.log('======start executing TXs calling reset======')
    tx = await mmp.reset();
    receipt=await tx.wait();
    frontendUtil.showResult(frontendUtil.parseReceipt(receipt));
    if(Number(frontendUtil.parseEvent(receipt,mmp,"QueryBalance"))===0){
      console.log("✅ Test Successful");
    }else{
      console.log("❌ Test Failed");
    } 

    console.log('======start executing TXs calling add======')
    tx = await mmp.add(4,3);
    receipt=await tx.wait();
    frontendUtil.showResult(frontendUtil.parseReceipt(receipt));
    if(Number(frontendUtil.parseEvent(receipt,mmp,"QueryBalance"))===12){
      console.log("✅ Test Successful");
    }else{
      console.log("❌ Test Failed");
    } 
}

  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });