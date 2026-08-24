"use client"
import { Order } from '@/redux/reduxTypes';
import { courierIcon, receiverIcon, restaurantIcon } from '@/utils/iconMapObjects';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import {  Socket } from 'socket.io-client';
import "leaflet/dist/leaflet.css";
import { InvalidateMapSize } from '@/utils/InvalidateMapSize ';
import { PageSpinner } from '@/components/ui/Spinner';



const MapTracker = ({ isWorking, socket, courierLocation }: { isWorking: Order | null, socket: Socket | null, courierLocation: [number, number] | null }) => {
    const [restaurantLocation, setRestaurantLocation] = useState<[number, number] | null>(null);
    const [receiverLocation, setReceiverLocation] = useState<[number, number] | null>(null);
    const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

    // Resolve both endpoints whenever the selected live order changes.
    useEffect(() => {
        if (!socket || !isWorking) return;
        let cancelled = false;
        setLoadingLocation(true);

        const geocode = async (address: string): Promise<[number, number]> => {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/geocode`, { params: { q: address } });
            const first = response.data?.[0];
            if (!first) throw new Error(`No map result for ${address}`);
            return [Number(first.lat), Number(first.lon)];
        };

        const resolveLocations = async () => {
            try {
                const restaurantResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${isWorking.restaurantTitle}/address`);
                const restaurantAddress = restaurantResponse.data.adress;
                const [restaurant, receiver] = await Promise.all([
                    geocode(`${restaurantAddress.street} ${restaurantAddress.houseNumber}, ${restaurantAddress.city}`),
                    geocode(`${isWorking.adress.street} ${isWorking.adress.houseNumber}, ${isWorking.adress.city}`),
                ]);
                if (!cancelled) {
                    setRestaurantLocation(restaurant);
                    setReceiverLocation(receiver);
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setLoadingLocation(false);
            }
        };

        void resolveLocations();
        return () => { cancelled = true; };
    }, [socket, isWorking]);

    // Preparing orders do not have a courier location yet. The route endpoints
    // are still useful, so show the map as soon as those are available and add
    // the courier marker later when the socket publishes it.
    const isReady = !loadingLocation && receiverLocation && restaurantLocation;

    return (<>

        {
            !isReady ? <div className="flex h-full min-h-64 items-center justify-center bg-sand-100"><PageSpinner /></div> : receiverLocation != null && restaurantLocation != null &&
                // container
                <MapContainer className='h-full w-full rounded-lg' zoom={15} center={receiverLocation} >
                    <InvalidateMapSize /> {/* for prerendered map size  */}
                    <TileLayer attribution='copy& Copyright openStreetMap ' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                    <Marker position={receiverLocation} icon={receiverIcon} /> {/*Marker for receiver*/}
                    <Marker position={restaurantLocation} icon={restaurantIcon} /> {/*Marker for restaurant*/}
                    {courierLocation ? <Marker position={courierLocation} icon={courierIcon} /> : null} {/*Marker for courier*/}
                </MapContainer >


        }

    </>
    )
}

export default MapTracker
