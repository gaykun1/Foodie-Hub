// Bridges checkout form data across the redirect Stripe may perform for
// payment methods that require it (3D Secure, certain wallets/banks) — the
// success page needs this to actually finalize the order, since a full page
// navigation loses React state.
export type PendingCheckout = {
    formData: {
        name: string;
        surname: string;
        city: string;
        countryOrRegion: string;
        street: string;
        houseNumber: string;
        apartmentNumbr?: string;
    };
    shipping: number;
    percent: number;
    cartId?: string;
};

const key = (orderId: string) => `foodiehub:pendingCheckout:${orderId}`;

export const savePendingCheckout = (orderId: string, data: PendingCheckout) => {
    try {
        sessionStorage.setItem(key(orderId), JSON.stringify(data));
    } catch { }
};

export const readPendingCheckout = (orderId: string): PendingCheckout | null => {
    try {
        const raw = sessionStorage.getItem(key(orderId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearPendingCheckout = (orderId: string) => {
    try {
        sessionStorage.removeItem(key(orderId));
    } catch { }
};
