import { ethers, network } from "hardhat"
import { verify } from "../utils/verify"
import { networkConfig, developmentChains } from "../helper-hardhat-config"

async function main() {
    const chainId = network.config.chainId!
    const isDevelopment = developmentChains.includes(network.name)

    console.log("----------------------------------------------")
    console.log(`📡 Deploying to Network: ${network.name.toUpperCase()}`)
    console.log("----------------------------------------------")

    const [deployer] = await ethers.getSigners()

    // ===========================================
    // 1. DEPLOY MOCK USDC
    // ===========================================
    console.log("Deploying MockUSDC...")
    const mockTokenFactory = await ethers.getContractFactory("MockUSDC")
    const mockUSDC = await mockTokenFactory.deploy()

    const deployTxUSDC = mockUSDC.deploymentTransaction()
    if (deployTxUSDC) {
        console.log("🔨 Tx Hash:", deployTxUSDC.hash)
        console.log("⏳ Waiting for confirmations...")
    }
    await mockUSDC.waitForDeployment()

    const mockUSDCAddress = await mockUSDC.getAddress()
    console.log("✅ MockUSDC deployed at:", mockUSDCAddress)
    const waitBlockConfirmations =
        networkConfig[chainId].blockConfirmations || 1

    if (!isDevelopment) {
        console.log(
            `⏳ Waiting for ${waitBlockConfirmations} block confirmations...`,
        )
        await mockUSDC.deploymentTransaction()?.wait(waitBlockConfirmations)
        await verify(mockUSDCAddress, [])
    }

    // ===========================================
    // 2. DEPLOY INVOICE SYSTEM
    // ===========================================
    console.log("Deploying InvoiceSystem...")
    const invoiceSystemFactory =
        await ethers.getContractFactory("InvoiceSystem")
    const invoiceSystem = await invoiceSystemFactory.deploy()

    const deployTxInvoiceSystem = invoiceSystem.deploymentTransaction()
    if (deployTxInvoiceSystem) {
        console.log("🔨 Tx Hash:", deployTxInvoiceSystem.hash)
        console.log("⏳ Waiting for confirmation...")
    }
    await invoiceSystem.waitForDeployment()

    const invoiceSystemAddress = await invoiceSystem.getAddress()
    console.log("✅ InvoiceSystem deployed at:", invoiceSystemAddress)

    if (!isDevelopment) {
        console.log(
            `⏳ Waiting for ${waitBlockConfirmations} block confirmations...`,
        )
        await invoiceSystem
            .deploymentTransaction()
            ?.wait(waitBlockConfirmations)
        await verify(invoiceSystemAddress, [])
    }

    // ===========================================
    // 3. POST-DEPLOYMENT (LOCAL ONLY)
    // ===========================================
    if (isDevelopment) {
        console.log("\n🎁 Local Setup: Minting Tokens...")
        const mintAmount = ethers.parseUnits("10000", 18)
        await mockUSDC.mint(deployer.address, mintAmount)
        console.log("💰 Minted 10,000 MockUSDC to", deployer.address)

        // Check Balance
        const balance = await mockUSDC.balanceOf(deployer.address)
        console.log("💰 Deployer Balance:", ethers.formatUnits(balance, 18), "MockUSDC")
    }

    console.log("----------------------------------------------")
    console.log("✅ DEPLOYMENT COMPLETE!")
    console.log("----------------------------------------------")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
