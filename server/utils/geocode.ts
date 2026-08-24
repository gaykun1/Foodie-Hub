/**
 * Server-side address to coordinates resolution.
 *
 * Lives here rather than on the client so coordinates can be resolved *once*
 * and persisted (on the restaurant at creation, on the order at checkout).
 * Tracking then reads stored points instead of hitting Nominatim on every map
 * open, which was both slow and subject to that service's rate limits.
 */

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface AddressLike {
    street?: string | null;
    houseNumber?: number | string | null;
    city?: string | null;
    countryOrRegion?: string | null;
}

export const formatAddress = (address: AddressLike): string =>
    [
        [address.street, address.houseNumber].filter(Boolean).join(" "),
        address.city,
        address.countryOrRegion,
    ]
        .filter((part) => part && String(part).trim())
        .join(", ");

/**
 * Resolves a free-text address. Returns null rather than throwing: a missing
 * pin should degrade the map, never fail a checkout.
 */
export const geocodeAddress = async (query: string): Promise<GeoPoint | null> => {
    if (!query || !query.trim()) return null;
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            // Nominatim's usage policy requires an identifying User-Agent.
            { headers: { "User-Agent": "FoodieHub/1.0" } }
        );
        if (!response.ok) return null;
        const data = (await response.json()) as { lat?: string; lon?: string }[];
        const first = Array.isArray(data) ? data[0] : undefined;
        if (!first?.lat || !first?.lon) return null;
        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    } catch {
        return null;
    }
};

export const geocodeStructured = (address: AddressLike): Promise<GeoPoint | null> =>
    geocodeAddress(formatAddress(address));
