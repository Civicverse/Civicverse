import { ethers } from 'ethers';

const ETH_RPC = 'https://rpc.sepolia.org'; // Sepolia testnet for dev
const KASPA_API = 'https://api.kaspa.org'; // Mainnet Kaspa API (read-only)

export const blockchainService = {
  /**
   * Fetch ETH Balance from Sepolia
   */
  getEthBalance: async (address: string): Promise<number> => {
    try {
      if (!address || !address.startsWith('0x')) return 0;
      const provider = new ethers.JsonRpcProvider(ETH_RPC);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    } catch (e) {
      console.error('[Blockchain] ETH Balance check failed:', e);
      return 0;
    }
  },

  /**
   * Fetch Kaspa Balance from Public API
   */
  getKaspaBalance: async (address: string): Promise<number> => {
    try {
      if (!address || !address.startsWith('kaspa:')) return 0;
      // In a real implementation, we'd use a real Kaspa address
      // For the mock addresses in our system, we'll return 0 or a simulated value
      if (address.includes('mockaddress')) return 133.7; // Simulated live data for mock
      
      const response = await fetch(`${KASPA_API}/addresses/${address}/balance`);
      const data = await response.json();
      return (data.balance || 0) / 100000000; // Convert sompis to KAS
    } catch (e) {
      console.error('[Blockchain] Kaspa Balance check failed:', e);
      return 0;
    }
  },

  /**
   * Batch sync all chain balances
   */
  syncAllBalances: async (addresses: Record<string, string>): Promise<Record<string, number>> => {
    const balances: Record<string, number> = {};
    
    if (addresses.ETH) {
      balances.ETH = await blockchainService.getEthBalance(addresses.ETH);
    }
    
    if (addresses.KASPA) {
      balances.KASPA = await blockchainService.getKaspaBalance(addresses.KASPA);
    }

    // BTC and Monero would go here with their respective explorers/APIs
    
    return balances;
  }
};
