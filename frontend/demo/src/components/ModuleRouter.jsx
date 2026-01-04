import React from 'react'
import VotingPanel from './modules/VotingPanel'
import DexPanel from './modules/DexPanel'
import MarketplacePanel from './modules/MarketplacePanel'
import SocialPanel from './modules/SocialPanel'
import OnboardingPanel from './modules/OnboardingPanel'
import ZKQuestPanel from './modules/ZKQuestPanel'
import CharacterCustomization from './modules/CharacterCustomization'
import WalletConfig from './modules/WalletConfig'
import MinerDashboard from './modules/MinerDashboard'
import GovernancePanel from './modules/GovernancePanel'
import UBIPanel from './modules/UBIPanel'
import NewsPanel from './modules/NewsPanel'
import EducationPanel from './modules/EducationPanel'
import Dashboard from './modules/Dashboard'
import Treasury from './modules/Treasury'
import RoyalMatchPanel from './modules/RoyalMatchPanel'
import CraigPanel from './modules/CraigPanel'

export default function ModuleRouter({ module }) {
  const panels = {
    dashboard: <Dashboard />,
    treasury: <Treasury />,
    voting: <VotingPanel />,
    dex: <DexPanel />,
    marketplace: <MarketplacePanel />,
    social: <SocialPanel />,
    onboarding: <OnboardingPanel />,
    zk: <ZKQuestPanel />,
    character: <CharacterCustomization />,
    wallet: <WalletConfig />,
    miner: <MinerDashboard />,
    governance: <GovernancePanel />,
    ubi: <UBIPanel />,
    news: <NewsPanel />,
    education: <EducationPanel />,
    craig: <CraigPanel />,
    royal: <RoyalMatchPanel />
  }

  return <div className="module-view">{panels[module] || <div>Module not found</div>}</div>
}
