import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import TOSPage from './pages/TOSPage'
import WelcomePage from './pages/WelcomePage'
import SignupPage from './pages/SignupPage'
import MnemonicPage from './pages/MnemonicPage'
import WalletPage from './pages/WalletPage'
import FoyerPage from './pages/FoyerPage'
import SignInPage from './pages/SignInPage'

export default function App(){
  // Enforce startup flow: TOS -> Welcome -> SignIn/SignUp -> Mnemonic (new only) -> Wallet -> Foyer
  return (
    <Routes>
      <Route path="/tos" element={<TOSPage/>} />
      <Route path="/welcome" element={<WelcomePage/>} />
      <Route path="/signup" element={<SignupPage/>} />
      <Route path="/signin" element={<SignInPage/>} />
      <Route path="/mnemonic" element={<MnemonicPage/>} />
      <Route path="/wallet" element={<WalletPage/>} />
      <Route path="/foyer" element={<FoyerPage/>} />
      <Route path="/" element={<Navigate to="/tos" replace />} />
      <Route path="*" element={<Navigate to="/tos" replace />} />
    </Routes>
  )
}
