import React, { createContext, useState, useEffect, useContext } from "react";
import { useCart } from "./CartContext";
import { API_BASE_URL } from "../constants/Config";

interface Milestone {
    id: string;
    min_order_value: number;
    delivery_charge: number;
    surcharge?: number;
    [key: string]: any;
}

interface DeliveryChargeContextType {
    milestones: Milestone[];
    defaultDeliveryCharge: number;
    loading: boolean;
    getDeliverySettings: (amount?: number | null) => any;
    getUpsellMessage: (amount?: number | null) => string | null;
    refreshMilestones: () => Promise<void>;
}

const DeliveryChargeContext = createContext<DeliveryChargeContextType | undefined>(undefined);

export const DeliveryChargeProvider = ({ children }: { children: React.ReactNode }) => {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(30);
    const [loading, setLoading] = useState(true);
    const { getCartTotal } = useCart();

    useEffect(() => {
        fetchMilestones();
    }, []);

    const fetchMilestones = async () => {
        try {
            setLoading(true);

            // Fetch Milestones
            const milestonesResponse = await fetch(`${API_BASE_URL}/delivery-charges`);
            if (milestonesResponse.ok) {
                const data = await milestonesResponse.json();
                if (data.success) {
                    const sortedMilestones = (data.data || []).sort(
                        (a: Milestone, b: Milestone) => a.min_order_value - b.min_order_value
                    );
                    setMilestones(sortedMilestones);
                }
            }

            // Fetch Default Delivery Charge
            const settingsResponse = await fetch(`${API_BASE_URL}/charge-settings`);
            if (settingsResponse.ok) {
                const settingsData = await settingsResponse.json();
                if (settingsData.success && settingsData.data) {
                    setDefaultDeliveryCharge(parseFloat(settingsData.data.delivery_charge) || 30);
                }
            }
        } catch (error) {
            console.error("Error fetching delivery data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getDeliverySettings = (amount: number | null = null) => {
        const currentTotal = amount !== null ? amount : getCartTotal();

        let applicableCharge = defaultDeliveryCharge;
        let appliedMilestone = null;
        let nextMilestone = null;

        if (milestones.length === 0) {
            return {
                charge: applicableCharge,
                isFree: applicableCharge === 0,
                nextTier: null,
                amountToNextTier: 0,
                appliedMilestone: null
            };
        }

        const matchedIndex = milestones.findIndex(m => currentTotal <= m.min_order_value);

        if (matchedIndex !== -1) {
            appliedMilestone = milestones[matchedIndex];
            applicableCharge = appliedMilestone.delivery_charge;
            nextMilestone = appliedMilestone;
        } else {
            applicableCharge = 0;
            appliedMilestone = null;
            nextMilestone = null;
        }

        let amountToNextTier = 0;
        if (matchedIndex !== -1) {
            amountToNextTier = milestones[matchedIndex].min_order_value - currentTotal;
            if (amountToNextTier <= 0) amountToNextTier = 1;
        }

        return {
            charge: applicableCharge,
            surcharge: appliedMilestone ? (parseFloat(appliedMilestone.surcharge as any) || 0) : 0,
            isFree: applicableCharge === 0,
            nextTier: nextMilestone,
            amountToNextTier: Math.max(0, amountToNextTier),
            appliedMilestone
        };
    };

    const getUpsellMessage = (amount: number | null = null) => {
        const settings = getDeliverySettings(amount);
        if (settings.isFree) return null;

        const diff = settings.amountToNextTier;
        return `Add items worth ₹${diff.toFixed(0)} to avoid delivery charge!`;
    };

    return (
        <DeliveryChargeContext.Provider
            value={{
                milestones,
                defaultDeliveryCharge,
                loading,
                getDeliverySettings,
                getUpsellMessage,
                refreshMilestones: fetchMilestones
            }}
        >
            {children}
        </DeliveryChargeContext.Provider>
    );
};

export const useDelivery = () => {
    const context = useContext(DeliveryChargeContext);
    if (!context) {
        throw new Error("useDelivery must be used within a DeliveryChargeProvider");
    }
    return context;
};

export default DeliveryChargeContext;
