# 🎨 Civicverse Frontend: The Hub

## 🚀 Overview
The Civicverse frontend, known as **The Hub**, is a React-powered dashboard and non-custodial wallet interface. It serves as the primary entry point for users to manage their **CivicID**, access the **Civic Vault**, and bridge into the **NEON REIGN** Godot Foyer.

### 🎯 Key Features
- **Sovereign Vault:** Secure local encryption (PBKDF2/AES-256) for identity secrets.
- **PoP Verification:** Integrated UI for the Proof-of-Personhood peer verification flow.
- **Mining Dashboard:** Real-time telemetry for community mining and treasury stats.
- **Foyer Bridge:** Seamless integration with the Godot-powered 3D Hub.

---

## 🏗 Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Modern, Neon aesthetic)
- **State Management:** React Hooks & Context API
- **Local Storage:** IndexedDB (for secure vault data)

---

## 🛠 Getting Started

### Local Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The application will be available at `http://localhost:3000` by default.

---

## 📁 Directory Structure
- `src/components/`: Reusable UI components.
- `src/pages/`: Main application views (Vault, Mining, Foyer).
- `src/context/`: Global state providers for identity and wallet.
- `public/`: Static assets and the exported Godot Foyer build.

---

## 🤝 Contribution
When contributing to the frontend, maintain the "Neon Reign" aesthetic. Ensure all components are responsive and all identity-related operations are performed locally and securely.
