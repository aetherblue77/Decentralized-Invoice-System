# Decentralized Invoice System 🧾

> **A blockchain-based invoicing solution designed to simplify cross-border payments for freelancers and clients worldwide.**

---

## 🚧 Project Status: Active Development

This repository is divided into two main parts. Here is the current progress:

| Module | Status | Description |
| :--- | :--- | :--- |
| **Backend** | ✅ **COMPLETED** | Smart Contracts created, tested (100% coverage), and deployed to **Sepolia Testnet**. |
| **Frontend** | ✅ **COMPLETED** | Fully functional User Interface built with **Next.js** to interact with the Smart Contracts. |

---

## 💡 About The Project

The **Decentralized Invoice System** is a DApp (Decentralized Application) that allows users to generate invoice records directly on the blockchain and settle payments using Cryptocurrency (ERC-20 Tokens).

### The Problem it Solves
In the traditional world, international payments are often slow, expensive, and opaque.
* **Freelancers** often wait days for bank transfers to clear.
* **Clients** lose money on high currency exchange rates and administrative fees.
* **Trust Issues:** "Did you send the money?" vs "I haven't received it yet."

### The Solution
By moving invoices to the blockchain, we create a **trustless system**:
1.  **Immutable Record:** Once an invoice is created, it cannot be tampered with.
2.  **Instant Settlement:** Payments are made in stablecoins (like USDC), arriving in seconds, not days.
3.  **Transparency:** Both parties can verify the payment status in real-time on the blockchain.

---

## 🌍 Real-World Use Case

If deployed to the Mainnet (Real World), this system is designed to help **The Global Gig Economy**.

**Target Audience:**
* **Freelancers & Contractors:** especially those working remotely for clients in different countries.
* **International Clients/Businesses:** who frequently pay vendors overseas.

**Example Scenario:**
Imagine a Freelancer in **Indonesia** working for a Client in the **United States**.
Instead of using a traditional bank (which involves IDR to USD conversion fees and 3-5 days waiting time), the Freelancer sends a Decentralized Invoice. The Client pays 500 USDC, and the Freelancer receives exactly 500 USDC in their wallet almost instantly. No middlemen, no hidden fees.

---

## 📂 Repository Structure

This project is organized as a monorepo. Click on the folder names below to explore the code:

* **[`/backend`](./backend)**: Contains the Hardhat environment, Solidity Smart Contracts (`InvoiceSystem.sol`), Deployment Scripts, and Unit Tests.
* **[`/frontend`](./frontend)**: Contains the Next.js application, UI Components, and Web3 Integration logic.

---

## 🛠️ Tech Stack

### Backend (Smart Contracts)
* **Language:** Solidity & TypeScript
* **Framework:** Hardhat
* **Testing:** Mocha & Chai
* **Network:** Sepolia Testnet (Ethereum)
* **Token Standard:** ERC-20 (Using a custom Mock USDC for testing purposes)

### Frontend (User Interface)
* **Framework:** Next.js (React) & TypeScript
* **Styling:** Tailwind CSS & shadcn/ui
* **Web3 Integration:** Wagmi, Viem, & RainbowKit
* **UX Features:** Optimistic UI Updates, Skeleton Loading, Toast Notifications

---

## 👨‍💻 Author

**Aether Blue (Jonathan Evan)**
* Passionate Web3 & Blockchain Developer.
* Always learning and building in public.

---

## 🤝 Feedback

I am building this project in public to learn and improve. I welcome any feedback regarding the Smart Contract logic, UI/UX flow, or security best practices.

Feel free to explore the code and open an issue if you find any bugs!