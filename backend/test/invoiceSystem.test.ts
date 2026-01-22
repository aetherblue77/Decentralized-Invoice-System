import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { MockUSDC__factory } from "../typechain-types"

describe("Invoice System", function () {
    // --- SETUP FIXTURE (DEPLOY CONTRACT) ---
    // This function only run once, and then the result will be saved (snapshot)
    async function deployInvoiceFixture() {
        // Take testing accounts (Signers)
        const [deployer, seller, client] = await ethers.getSigners()

        const mockTokenFactory = await ethers.getContractFactory("MockUSDC")
        const mockUSDC = await mockTokenFactory.deploy()

        const invoiceSystemFactory =
            await ethers.getContractFactory("InvoiceSystem")
        const invoiceSystem = await invoiceSystemFactory.deploy()

        return { invoiceSystem, mockUSDC, deployer, seller, client }
    }

    describe("Deployment", function () {
        it("Should start with invoiceId 0", async function () {
            const { invoiceSystem } = await loadFixture(deployInvoiceFixture)
            // First still 0, but next at the createInvoice will be 1
            expect(await invoiceSystem.invoiceId()).to.equal(0)
        })
    })

    describe("createInvoice", function () {
        it("Should create invoice successfully", async function () {
            const { invoiceSystem, seller, client, mockUSDC } =
                await loadFixture(deployInvoiceFixture)
            const amount = ethers.parseUnits("100", 18)

            await expect(
                invoiceSystem
                    .connect(seller)
                    .createInvoice(
                        client.address,
                        amount,
                        await mockUSDC.getAddress(),
                        "Test Invoice",
                    ),
            )
                .to.emit(invoiceSystem, "InvoiceCreated")
                .withArgs(
                    1,
                    seller.address,
                    client.address,
                    amount,
                    "Test Invoice",
                )

            const invoice = await invoiceSystem.invoices(1)
            expect(invoice.amount).to.equal(amount)
            expect(invoice.seller).to.equal(seller.address)
            expect(invoice.client).to.equal(client.address)
            expect(invoice.id).to.equal(1)
        })

        it("Revert if amount is 0", async function () {
            const { invoiceSystem, seller, client, mockUSDC } =
                await loadFixture(deployInvoiceFixture)
            await expect(
                invoiceSystem
                    .connect(seller)
                    .createInvoice(
                        client.address,
                        0,
                        await mockUSDC.getAddress(),
                        "Free",
                    ),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvalidAmount",
            )
        })

        it("Revert if token address is ZeroAddress", async function () {
            const { invoiceSystem, seller, client } =
                await loadFixture(deployInvoiceFixture)
            await expect(
                invoiceSystem
                    .connect(seller)
                    .createInvoice(
                        client.address,
                        100,
                        ethers.ZeroAddress,
                        "Error",
                    ),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvalidTokenAddress",
            )
        })

        it("Revert if client address is ZeroAddress", async function () {
            const { invoiceSystem, seller, mockUSDC } =
                await loadFixture(deployInvoiceFixture)
            await expect(
                invoiceSystem
                    .connect(seller)
                    .createInvoice(
                        ethers.ZeroAddress,
                        100,
                        await mockUSDC.getAddress(),
                        "Error",
                    ),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvalidClientAddress",
            )
        })
    })

    describe("payInvoice", function () {
        // Invoice must already exist before payInvoice testing
        async function deployWithInvoiceFixture() {
            const data = await loadFixture(deployInvoiceFixture)
            const amount = ethers.parseUnits("100", 18)

            // Seller create Invoice (automatically InvoiceId = 1)
            await data.invoiceSystem
                .connect(data.seller)
                .createInvoice(
                    data.client.address,
                    amount,
                    await data.mockUSDC.getAddress(),
                    "Design",
                )

            // Give client some mockUSDC
            await data.mockUSDC.mint(
                data.client.address,
                ethers.parseUnits("1000", 18),
            )
            return { ...data, amount }
        }

        it("Revert if invoice doesn't exist (ID 99)", async function () {
            const { invoiceSystem, client } = await deployWithInvoiceFixture()
            await expect(
                invoiceSystem.connect(client).payInvoice(99),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvoiceNotFound",
            )
        })

        it("Revert if invoice ID 0 is accessed because start from 1", async function () {
            const { invoiceSystem, client } = await deployWithInvoiceFixture()
            await expect(
                invoiceSystem.connect(client).payInvoice(0),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvoiceNotFound",
            )
        })

        it("Should allow payment for ID 1", async function () {
            const { invoiceSystem, client, seller, mockUSDC, amount } =
                await deployWithInvoiceFixture()

            await mockUSDC
                .connect(client)
                .approve(await invoiceSystem.getAddress(), amount)

            // Pay Invoice ID 1
            await expect(invoiceSystem.connect(client).payInvoice(1))
                .to.emit(invoiceSystem, "InvoicePaid")
                .withArgs(1, client.address)
            const invoice = await invoiceSystem.invoices(1)
            expect(invoice.isPaid).to.equal(true)
            expect(await mockUSDC.balanceOf(seller.address)).to.equal(amount)
        })

        it("Revert if invoice is already paid", async function () {
            const { invoiceSystem, client, mockUSDC, amount } =
                await deployWithInvoiceFixture()
            // First Payment
            await mockUSDC
                .connect(client)
                .approve(await invoiceSystem.getAddress(), amount)
            await invoiceSystem.connect(client).payInvoice(1)

            // Second Payment (Must fail)
            await expect(
                invoiceSystem.connect(client).payInvoice(1),
            ).to.be.revertedWithCustomError(
                invoiceSystem,
                "InvoiceSystem__InvoiceAlreadyPaid",
            )
        })

        it("Revert if client has sufficient balance but No Allowance", async function () {
            const { invoiceSystem, client } = await deployWithInvoiceFixture()
            // Client have sufficient balance but no allowance
            await expect(invoiceSystem.connect(client).payInvoice(1)).to.be
                .reverted
        })

        it("Revert if client has allowance but insufficient balance", async function () {
            const { invoiceSystem, seller, client, mockUSDC, amount } =
                await deployWithInvoiceFixture()
            await mockUSDC
                .connect(client)
                .approve(await invoiceSystem.getAddress(), amount)
            // Client empties his wallet
            const clientBalance = await mockUSDC.balanceOf(client.address)
            // We throw the money to the Seller (or to a null address) so that the client's balance becomes 0
            await mockUSDC
                .connect(client)
                .transfer(seller.address, clientBalance)
            expect(await mockUSDC.balanceOf(client.address)).to.equal(0)
            await expect(invoiceSystem.connect(client).payInvoice(1)).to.be
                .reverted
        })
    })

    describe("getAllInvoices", function () {
        it("Should return empty array if no invoces created", async function () {
            const {invoiceSystem} = await loadFixture(deployInvoiceFixture)
            const allInvoices = await invoiceSystem.getAllInvoices()
            expect(allInvoices.length).to.equal(0)
        })

        it("Should return all created invoices with correct IDs and data", async function () {
            const {invoiceSystem, seller, client, mockUSDC} = await loadFixture(deployInvoiceFixture)
            const amount =  ethers.parseUnits("100", 18)
            const tokenAddress = await mockUSDC.getAddress()

            await invoiceSystem.connect(seller).createInvoice(client.address, amount, tokenAddress, "First Invoice")
            await invoiceSystem.connect(seller).createInvoice(client.address, amount, tokenAddress, "Second Invoice")
            await invoiceSystem.connect(seller).createInvoice(client.address, amount, tokenAddress, "Third Invoice")

            const allInvoices = await invoiceSystem.getAllInvoices()
            expect(allInvoices.length).to.equal(3)

            expect(allInvoices[0].id).to.equal(1)
            expect(allInvoices[0].description).to.equal("First Invoice");
            expect(allInvoices[0].client).to.equal(client.address);

            expect(allInvoices[1].id).to.equal(2)
            expect(allInvoices[1].description).to.equal("Second Invoice");

            expect(allInvoices[2].id).to.equal(3)
            expect(allInvoices[2].description).to.equal("Third Invoice");
        })
    })
})
