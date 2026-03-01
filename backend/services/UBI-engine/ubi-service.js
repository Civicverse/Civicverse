/**
 * Civicverse UBI & Micro-Tax Engine
 * Handles distribution of mining yields and the 1% micro-tax logic.
 */

class UBIEngine {
  constructor() {
    this.communityTreasury = 0;
    this.totalDistributed = 0;
    this.taxRate = 0.01; // 1% Micro-tax
    this.ubiPool = 0;
    this.lastDistributionTime = Date.now();
    this.distributionInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Process a transaction and apply the 1% micro-tax
   * @param {number} amount - Transaction amount
   * @returns {Object} - { netAmount, taxAmount }
   */
  processTransaction(amount) {
    const taxAmount = amount * this.taxRate;
    const netAmount = amount - taxAmount;
    
    this.communityTreasury += taxAmount;
    this.ubiPool += taxAmount * 0.7; // 70% of tax goes to UBI
    
    return { netAmount, taxAmount };
  }

  /**
   * Add mining yield to the treasury
   * @param {number} amount - Mined amount
   */
  addMiningYield(amount) {
    this.communityTreasury += amount;
    this.ubiPool += amount * 0.5; // 50% of mining goes to UBI
  }

  /**
   * Calculate UBI payout for a player based on participation
   * @param {Object} playerState - Player state (kills, levels, etc.)
   * @returns {number} - Payout amount
   */
  calculatePayout(playerState) {
    // Basic UBI + Participation Bonus
    const base = 10; 
    const participationBonus = (playerState.kills || 0) * 2 + (playerState.level || 1) * 5;
    return base + participationBonus;
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      communityTreasury: this.communityTreasury,
      ubiPool: this.ubiPool,
      totalDistributed: this.totalDistributed,
      nextDistribution: this.lastDistributionTime + this.distributionInterval,
      taxRate: this.taxRate
    };
  }
}

module.exports = new UBIEngine();
