import type { ReactNode } from 'react';
import React from 'react';

// Real implementation now that packages are installed
import {
  KryptogoKitProvider,
  connectorsForWallets,
  kryptogoConnector,
} from "@kryptogo/kryptogokit-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createClient, http } from "viem";
import { WagmiProvider, createConfig } from "wagmi";

// Import chains
import { arbitrum, bsc, mainnet, polygon } from "wagmi/chains";

// Import wallets
import {
  coinbaseWallet,
  injectedWallet,
  kryptogoWallet,
  okxWallet,
  walletConnectWallet,
} from "@kryptogo/kryptogokit-sdk-react/wallets";

// Import pre-built styles
import "@kryptogo/kryptogokit-sdk-react/styles.css";

interface PaymentProviderProps {
  children: ReactNode;
}

export const KryptogoPaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const queryClient = new QueryClient();
  
  // Your organization's KryptoGO clientId - replace with your actual clientId
  const clientId = "3e0dbb46bc51698b";

  const connectors = connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [walletConnectWallet, coinbaseWallet, kryptogoWallet],
      },
      {
        groupName: "More",
        wallets: [okxWallet, injectedWallet],
      },
    ],
    {
      appName: "College Application Planner",
    }
  );

  const KryptogoConnector = kryptogoConnector();

  const config = createConfig({
    connectors: [...connectors, KryptogoConnector],
    chains: [mainnet, arbitrum, polygon, bsc],
    client({ chain }) {
      return createClient({ chain, transport: http() });
    },
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KryptogoKitProvider
          clientId={clientId}
          appInfo={{ appName: "College Application Planner" }}
        >
          {children as any}
        </KryptogoKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default KryptogoPaymentProvider; 