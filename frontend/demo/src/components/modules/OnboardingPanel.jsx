import React, { useState } from 'react'

export default function OnboardingPanel() {
  const [step, setStep] = useState(1)

  return (
    <div className="panel">
      <h3>ONBOARDING</h3>
      <div className="stat-row">Step {step}/5</div>
      <p>SHA-256 citizen attestation</p>
      {step < 5 && (
        <button className="action-btn" onClick={() => setStep(s => s + 1)}>
          Next step
        </button>
      )}
      {step === 5 && (
        <button className="action-btn" style={{ background: '#00ff88' }}>
          ✓ Complete
        </button>
      )}
    </div>
  )
}
