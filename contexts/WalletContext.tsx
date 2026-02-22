import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as walletService from '../services/walletService';

interface Transaction {
    id: string;
    amount: number;
    transaction_type: 'TOPUP' | 'SPEND' | 'REFUND' | 'ADMIN_CREDIT' | 'ADMIN_DEBIT' | 'REVERSAL';
    description: string;
    balance_after: number;
    created_at: string;
}

interface WalletState {
    balance: number;
    isFrozen: boolean;
    frozenReason: string | null;
    transactions: Transaction[];
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, getAccessToken } = useAuth();
    const [balance, setBalance] = useState(0);
    const [isFrozen, setIsFrozen] = useState(false);
    const [frozenReason, setFrozenReason] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);

            const token = await getAccessToken();
            if (!token) {
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const [walletData, transactionData] = await Promise.all([
                walletService.getWalletDetails(token),
                walletService.getWalletTransactions(token, 1, 20)
            ]);

            if (walletData.success && walletData.wallet) {
                setBalance(parseFloat(walletData.wallet.balance));
                setIsFrozen(walletData.wallet.is_frozen);
                setFrozenReason(walletData.wallet.frozen_reason || null);
            }

            if (transactionData.success) {
                setTransactions(transactionData.transactions || []);
            }
        } catch (err: any) {
            console.error('Error fetching wallet data:', err);
            setError(err.message || 'Failed to fetch wallet information');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        if (currentUser) {
            fetchWalletData();
        } else {
            setBalance(0);
            setTransactions([]);
            setLoading(false);
        }
    }, [currentUser, fetchWalletData]);

    const refreshWallet = async () => {
        await fetchWalletData(true);
    };

    return (
        <WalletContext.Provider
            value={{
                balance,
                isFrozen,
                frozenReason,
                transactions,
                loading,
                refreshing,
                error,
                refreshWallet,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
