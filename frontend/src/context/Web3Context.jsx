import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import deployedContracts from '../deployedContracts.json';
import { supabase } from '../lib/supabase';

const Web3Context = createContext(null);

const EXPECTED_CHAIN_ID = '0xaa36a7';

const NETWORK_PARAMS = {
  chainId: '0xaa36a7',
  chainName: 'Sepolia test network',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export function Web3Provider({ children }) {
  const [account, setAccount] = useState('');
  const [profile, setProfile] = useState(null);
  const [tcrBalance, setTcrBalance] = useState('0');
  const [hasClaimedFaucet, setHasClaimedFaucet] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tcrContract, setTcrContract] = useState(null);
  const [platformContract, setPlatformContract] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBlockchainData = useCallback(async (userAddress, browserProvider) => {
    try {
      const signer = await browserProvider.getSigner();
      const tcrInfo = deployedContracts.contracts.ThesisCredits;
      const platformInfo = deployedContracts.contracts.ThesisPlatform;

      const tcr = new ethers.Contract(tcrInfo.address, tcrInfo.abi, signer);
      const platform = new ethers.Contract(platformInfo.address, platformInfo.abi, signer);

      setTcrContract(tcr);
      setPlatformContract(platform);

      const rawBal = await tcr.balanceOf(userAddress);
      setTcrBalance(ethers.formatEther(rawBal));

      const claimed = await tcr.hasClaimed(userAddress);
      setHasClaimedFaucet(claimed);

      const adminMatch =
        userAddress.toLowerCase() === deployedContracts.adminAddress.toLowerCase();
      setIsAdmin(adminMatch);

      // Ensure profile exists in Supabase
      const normalizedWallet = userAddress.toLowerCase();
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', normalizedWallet)
        .single();

      if (!existingProfile) {
        const defaultName = adminMatch
          ? 'Platform Admin'
          : `Student ${userAddress.slice(0, 6)}`;
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            wallet_address: normalizedWallet,
            full_name: defaultName,
            university: 'FAST NUCES',
            role: adminMatch ? 'admin' : 'student',
          })
          .select()
          .single();
        existingProfile = newProfile;
      }
      setProfile(existingProfile);
    } catch (err) {
      console.error('Error loading blockchain/profile data:', err);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!tcrContract || !account) return;
    const rawBal = await tcrContract.balanceOf(account);
    setTcrBalance(ethers.formatEther(rawBal));
    const claimed = await tcrContract.hasClaimed(account);
    setHasClaimedFaucet(claimed);
  }, [tcrContract, account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install the MetaMask browser extension.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Switch to Localhost 8545 (Chain ID 31337) if on another network
      const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChain !== EXPECTED_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: EXPECTED_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: EXPECTED_CHAIN_ID,
                  chainName: 'Hardhat Localhost 8545',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['http://127.0.0.1:8545'],
                },
              ],
            });
          }
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const userAddress = accounts[0];
      setAccount(userAddress);
      await loadBlockchainData(userAddress, browserProvider);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount('');
        setProfile(null);
        setTcrBalance('0');
        setIsAdmin(false);
      } else {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setAccount(accounts[0]);
        loadBlockchainData(accounts[0], browserProvider);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
  }, [loadBlockchainData]);

  return (
    <Web3Context.Provider
      value={{
        account,
        profile,
        setProfile,
        tcrBalance,
        hasClaimedFaucet,
        isAdmin,
        tcrContract,
        platformContract,
        loading,
        connectWallet,
        refreshBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);