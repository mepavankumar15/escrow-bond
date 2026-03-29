# 🛡️ Escrow Bond: Secure Solana Vaults

**Escrow Bond** is a high-fidelity, production-grade Escrow DApp built on the Solana blockchain. It provides a trustless interface for users to create, fund, and execute secure token exchanges using Program-Derived Addresses (PDAs).

![Dashboard Preview](https://escrow-bond.vercel.app)

## 🚀 Features

-   **Live On-Chain Monitoring**: Real-time sync with Solana Devnet to track active vaults and transaction history.
-   **Multi-Token Support**: Professional Token Selector for USDC, SOL, and custom demo tokens.
-   **Security First**: 
    -   Temporary vault locks with automated expiry logic.
    -   Collision-resistant PDA derivation via unique user-defined seeds.
    -   Explicit Maker/Taker permission checks.
-   **Premium UI/UX**: Built with **Tailwind CSS v4** and **Vite**, featuring a sleek dark-mode dashboard with advanced feedback systems.
-   **Developer Friendly**: Full Anchor integration with latest IDL standards (v0.30+).

## 🛠️ Architecture

The project is split into two main components:

1.  **`escrow/`**: The Anchor smart contract.
    -   `InitializeEscrow`: Creates the vault and state account.
    -   `DepositByTaker`: Taker funds the exchange.
    -   `ExecuteEscrow`: Finalizes the swap and distributes funds.
    -   `CancelEscrow`: Allows the maker to reclaim funds if the escrow expires.
2.  **`escrow-ui/`**: The React/TypeScript frontend.
    -   Uses `@solana/wallet-adapter` for seamless wallet integration.
    -   Direct RPC interaction for state fetching and transaction broadcasting.

## 📦 Getting Started

### Prerequisites
-   Node.js & npm
-   Anchor CLI (0.30+)
-   Solana CLI

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/mepavankumar15/escrow-bond.git
    cd escrow-bond
    ```
2.  Install Frontend Dependencies:
    ```bash
    cd escrow-ui
    npm install
    ```
3.  Run Locally:
    ```bash
    npm run dev
    ```

## 📜 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgements
Built for project evaluation and demonstration on the Solana Devnet.
