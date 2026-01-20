# Backend Service ⚙️

This directory contains the **Smart Contract logic** and **Deployment Scripts** for the Decentralized Invoice System. It acts as the backbone of the application, ensuring that all invoice records and financial transactions are secure, transparent, and immutable on the blockchain.

---

## 📜 Smart Contracts Overview

This project utilizes two primary Solidity contracts to handle the business logic and testing environment.

### 1. `InvoiceSystem.sol` (Core Logic)
This is the main contract that powers the application. It acts as a decentralized escrow and record-keeper.

**Key Data Structure:**
* **`Invoice Struct`**: Stores essential data for every transaction, including:
    * `creator`: The freelancer's wallet address.
    * `client`: The client's wallet address (payer).
    * `amount`: The total payment required.
    * `token`: The address of the ERC-20 token used for payment (e.g., USDC).
    * `isPaid`: A boolean status to track settlement.

**Core Functions:**
* **`createInvoice(...)`**:
    * **Purpose:** Allows a user to generate a new invoice on-chain.
    * **Logic:** It accepts payment details (Token, Amount, Description) and maps them to a unique `invoiceId`.
* **`payInvoice(uint256 _invoiceId)`**:
    * **Purpose:** Executes the payment transaction.
    * **Logic:** It performs a strictly validated `transferFrom` to move ERC-20 tokens directly from the Client to the Freelancer. It ensures the Invoice exists, hasn't been paid yet, and the client has sufficient balance/allowance.
* **`invoices(uint256 _invoiceId)`**:
    * **Purpose:** The public mapping serves as a getter to retrieve the full details of a specific invoice securely.

### 2. `MockUSDC.sol` (Testing Utility)
A standard ERC-20 Token contract deployed specifically for the development and Testnet phase.

* **Why is this needed?**
    Standard Testnet Faucets (like Sepolia USDC) often have strict limits (e.g., sending only $10 per day). To simulate real-world business scenarios—such as paying a $5,000 invoice—we deployed this Mock Token.
* **Functionality:** It mimics the behavior of real USDC/USDT but allows us to mint sufficient balances for testing purposes.

---

## 🛠️ Tools & Frameworks

The backend is engineered using industry-standard Web3 tooling to ensure reliability and security:

| Tool | Purpose |
| :--- | :--- |
| **Hardhat** | The primary development environment for compiling, deploying, and debugging. |
| **Solidity (v0.8.28)** | The programming language used for writing the Smart Contracts. |
| **TypeScript** | Used for writing robust, type-safe Deployment Scripts and Tests. |
| **Mocha & Chai** | Testing frameworks used to achieve **100% Test Coverage**, ensuring every function works as expected. |
| **Ethers.js (v6)** | Library for interacting with the Ethereum Blockchain and Smart Contracts. |

---

## 🧪 Testing & Validation

Before deployment, the system underwent rigorous Unit Testing to cover various scenarios, including:
* ✅ Successful Invoice Creation.
* ✅ Successful Payment & Token Transfer.
* 🛡️ Reverting when paying with insufficient balance.
* 🛡️ Reverting when trying to pay a non-existent or already paid invoice.

---

## 👨‍💻 Author

**Aether Blue (Jonathan Evan)**