import {ethers, network, artifacts} from "hardhat"
import * as fs from "fs"
import * as path from "path"
import { verify } from "../utils/verify"
import { developmentChains, networkConfig } from "../helper-hardhat-config"


const FRONTEND_CONSTANT_DIR = path.resolve(__dirname, "../../frontend/constants")
const FRONTEND_ADDRESS_FILE = path.join(FRONTEND_CONSTANT_DIR, "contractAddresses.json")
const FRONTEND_ABI_INVOICE_FILE = path.join(FRONTEND_CONSTANT_DIR, "invoiceSystemAbi.json")
const FRONTEND_ABI_MOCK_FILE = path.join(FRONTEND_CONSTANT_DIR, "mockUsdcAbi.json")

async function main() {
    const chainId = network.config.chainId!

    console.log("------------------------------------")
    console.log("🚀 Starting deployment to network:", network.name.toUpperCase())
    console.log("------------------------------------")

    const [deployer] = await ethers.getSigners()

    // =========================================
    // 1. DEPLOY MOCK USDC CONTRACT
    // =========================================
    console.log("Deploying MockUSDC...")
    const mockUSDCFactory = await ethers.getContractFactory("MockUSDC")
    const mockUSDC = await mockUSDCFactory.deploy()
    await mockUSDC.waitForDeployment()

    const mockUSDCAddress = await mockUSDC.getAddress()
    console.log("✅ MockUSDC deployed at:", mockUSDCAddress)

    // VERIFY MOCK USDC CONTRACT
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("⏳ Waiting for 6 block confirmations for MockUSDC...")
        await mockUSDC.deploymentTransaction()?.wait(6)
        console.log("Verifying MockUSDC...")
        await verify(mockUSDCAddress, [])
    }

    // =========================================
    // 2. DEPLOY INVOICE SYSTEM
    // =========================================
    console.log("Deploying InvoiceSystem...")
    const invoiceSystemFactory = await ethers.getContractFactory("InvoiceSystem")
    const InvoiceSystem = await invoiceSystemFactory.deploy()
    await InvoiceSystem.waitForDeployment()

    const invoiceSystemAddress = await InvoiceSystem.getAddress()
    console.log("✅ InvoiceSystem deployed at:", invoiceSystemAddress)

    // VERIFY INVOICE SYSTEM CONTRACT
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("⏳ Waiting for 6 block confirmations for InvoiceSystem...")
        await InvoiceSystem.deploymentTransaction()?.wait(6)
        console.log("Verifying InvoiceSystem...")
        await verify(invoiceSystemAddress, [])
    }

    // =========================================
    // 3. UPDATE FRONTEND
    // =========================================
    if (process.env.UPDATE_FRONTEND === "true") {
        console.log("Updating Frontend Constants...")
        await updateContractAddresses(invoiceSystemAddress, mockUSDCAddress)
        await updateAbi()
    }
}

// Function 1: Update Address (Multi-Contract Support)
async function updateContractAddresses(invoiceSystemAddress: string, mockUSDCAddress: string) {
    const chainId = network.config.chainId!

    // 1. Make sure the folder exist
    if (!fs.existsSync(FRONTEND_CONSTANT_DIR)) {
        fs.mkdirSync(FRONTEND_CONSTANT_DIR, {recursive: true})
    }

    // 2. Read Old File (if exist)
    let currentAddressses: any = {}
    if (fs.existsSync(FRONTEND_ADDRESS_FILE)) {
        const fileContent = fs.readFileSync(FRONTEND_ADDRESS_FILE, "utf8")
        if (fileContent) {
            currentAddressses = JSON.parse(fileContent)
        }
    }

    // 3. Update Address (InvoiceSystem and MockUSDC)
    if (chainId in currentAddressses) {
        if (!currentAddressses[chainId]["InvoiceSystem"]) {
            currentAddressses[chainId]["InvoiceSystem"] = []
        }

        if (!currentAddressses[chainId]["InvoiceSystem"].includes(invoiceSystemAddress)) {
            currentAddressses[chainId]["InvoiceSystem"].push(invoiceSystemAddress)
        }
    } else {
        currentAddressses[chainId] = {
            InvoiceSystem: [invoiceSystemAddress],
            MockUSDC: [mockUSDCAddress] 
        }
    }

    // 4. Update Logic (MockUSDC) - Handle case if chainId existed but MockUSDC key didn't
    if (!currentAddressses[chainId]["MockUSDC"]) {
        currentAddressses[chainId]["MockUSDC"] = []
    }

    if (!currentAddressses[chainId]["MockUSDC"].includes(mockUSDCAddress)) {
        currentAddressses[chainId]["MockUSDC"].push(mockUSDCAddress)
    }

    fs.writeFileSync(FRONTEND_ADDRESS_FILE, JSON.stringify(currentAddressses, null, 2))
    console.log(`   - Addresses saved to ${FRONTEND_ADDRESS_FILE}`)
}

// Function 2: Update ABI
async function updateAbi() {
    // 1. Take ABI InvoiceSystem
    const invoiceArtifact = artifacts.readArtifactSync("InvoiceSystem")
    fs.writeFileSync(FRONTEND_ABI_INVOICE_FILE, JSON.stringify(invoiceArtifact.abi, null, 2))
    console.log(`   - InvoiceSystemABI saved to ${FRONTEND_ABI_INVOICE_FILE}`)

    // 2. Take ABI MockUSDC
    const mockArtifact = artifacts.readArtifactSync("MockUSDC")
    fs.writeFileSync(FRONTEND_ABI_MOCK_FILE, JSON.stringify(mockArtifact.abi, null, 2))
    console.log(`   - MockABI saved to ${FRONTEND_ABI_MOCK_FILE}`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})