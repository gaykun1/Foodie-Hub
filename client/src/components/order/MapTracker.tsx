"use client"
import { Order } from '@/redux/reduxTypes';
import { courierIcon, receiverIcon, restaurantIcon } from '@/utils/iconMapObjects';
import { geocodeApi, restaurantsApi } from '@/api';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import "leaflet/dist/leaflet.css";
import { InvalidateMapSize } from '@/utils/InvalidateMapSize';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { MapPinOff } from 'lucide-react';

type Point = [number, number];

/**
 * The socket connection is deliberately not a prop: the courier's position is
 * owned by whichever screen holds the connection and arrives here as
 * `courierLocation`. The route itself comes from the order.
 */
const MapTracker = ({
    isWorking,
    courierLocation,
}: {
    isWorking: Order | null,
    courierLocation: Point | null,
}) => {
    const [restaurantLocation, setRestaurantLocation] = useState<Point | null>(null);
    const [receiverLocation, setReceiverLocation] = useState<Point | null>(null);
    const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
    const [failed, setFailed] = useState<boolean>(false);

    useEffect(() => {
        if (!isWorking) return;
        let cancelled = false;
        setLoadingLocation(true);
        setFailed(false);

        const resolveLocations = async () => {
            try {
                // Orders placed since coordinates were added to the schema already
                // carry both endpoints, so the common path costs zero requests.
                const stored = isWorking.route;
                if (stored?.restaurant && stored?.customer) {
                    if (!cancelled) {
                        setRestaurantLocation([stored.restaurant.lat, stored.restaurant.lng]);
                        setReceiverLocation([stored.customer.lat, stored.customer.lng]);
                    }
                    return;
                }

                // Fallback for orders saved before that: resolve what is missing,
                // preferring the restaurant's own stored location over geocoding.
                let restaurantPoint: Point | null = stored?.restaurant
                    ? [stored.restaurant.lat, stored.restaurant.lng]
                    : null;

                if (!restaurantPoint) {
                    const restaurant = await restaurantsApi.getRestaurantAddress(isWorking.restaurantTitle);
                    restaurantPoint = restaurant?.location
                        ? [restaurant.location.lat, restaurant.location.lng]
                        : restaurant?.address
                            ? await geocodeApi.geocodeAddress(
                                `${restaurant.address.street} ${restaurant.address.houseNumber}, ${restaurant.address.city}`
                            )
                            : null;
                }

                const receiverPoint: Point | null = stored?.customer
                    ? [stored.customer.lat, stored.customer.lng]
                    : isWorking.address
                        ? await geocodeApi.geocodeAddress(
                            `${isWorking.address.street} ${isWorking.address.houseNumber}, ${isWorking.address.city}`
                        )
                        : null;

                if (cancelled) return;
                if (!restaurantPoint || !receiverPoint) {
                    setFailed(true);
                    return;
                }
                setRestaurantLocation(restaurantPoint);
                setReceiverLocation(receiverPoint);
            } catch (err) {
                console.error(err);
                if (!cancelled) setFailed(true);
            } finally {
                if (!cancelled) setLoadingLocation(false);
            }
        };

        void resolveLocations();
        return () => { cancelled = true; };
    }, [isWorking]);

    if (loadingLocation) {
        return <div className="flex h-full min-h-64 items-center justify-center bg-sand-100"><PageSpinner /></div>;
    }

    if (failed || !receiverLocation || !restaurantLocation) {
        return (
            <div className="flex h-full min-h-64 items-center justify-center bg-sand-100 p-6">
                <EmptyState
                    icon={<MapPinOff size={22} />}
                    title="Map unavailable"
                    description="We couldn't place this delivery on the map. Your order status above is still live."
                    className="border-none"
                />
            </div>
        );
    }

    return (
        <MapContainer className='h-full w-full rounded-lg' zoom={14} center={receiverLocation}>
            <InvalidateMapSize /> {/* recalculates size once the container has real dimensions */}
            <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            {/* The delivery leg, so the map reads as a route rather than three loose pins. */}
            <Polyline positions={[restaurantLocation, receiverLocation]} pathOptions={{ color: "#0d9488", weight: 3, opacity: 0.5, dashArray: "6 8" }} />
            <Marker position={receiverLocation} icon={receiverIcon} />
            <Marker position={restaurantLocation} icon={restaurantIcon} />
            {courierLocation ? <Marker position={courierLocation} icon={courierIcon} /> : null}
        </MapContainer>
    )
}

export default MapTracker
