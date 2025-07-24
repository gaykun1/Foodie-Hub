"use client"
import { Order } from '@/redux/reduxTypes';
import { courierIcon, receiverIcon, restaurantIcon } from '@/utils/iconMapObjects';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { io, Socket } from 'socket.io-client';
import "leaflet/dist/leaflet.css";
import { InvalidateMapSize } from '@/utils/InvalidateMapSize ';



const MapTracker = ({ isWorking, socket, courierLocation }: { isWorking: Order | null, socket: Socket | null, courierLocation: [number, number] | null }) => {
    const [restaurantLocation, setRestaurantLocation] = useState<[number, number] | null>(null);
    const [receiverLocation, setReceiverLocation] = useState<[number, number] | null>(null);
    const [loadingLocation, setLoadingLocation] = useState<boolean>(true);

    // connecting to socket room, geocoding receiver adress
    useEffect(() => {
        if (socket && isWorking) {
            const geoCode = async () => {
                try {
                    await getRestaurentLocation();
                    await getReceiverLocation();
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoadingLocation(false);

                }

            }

            geoCode();

        }
    }, [socket, isWorking]);

    const isReady =
        !loadingLocation &&
        courierLocation &&
        receiverLocation &&
        restaurantLocation;

    // geocoding funcs -- latitude longitude for marker position on the map
    const getRestaurentLocation = async () => {
        try {
            if (isWorking) {
                const res1 = await axios.get(`http://localhost:5200/api/restaurant/restaurants/${isWorking.restaurantTitle}/address`);
                const adress = res1.data.adress;
                const address = `${adress.street} ${adress.houseNumber}, ${adress.city}`;
                const res2 = await axios.get(`http://localhost:5200/api/geocode?q=${address}`)

                const lat = res2.data[0].lat;
                const lng = res2.data[0].lon;
                setRestaurantLocation([lat, lng]);
            }

        } catch (err) {
            console.error(err);
        }
    }
    const getReceiverLocation = async () => {
        try {
            if (isWorking) {
                const address = `${isWorking.adress.street} ${isWorking.adress.houseNumber}, ${isWorking.adress.city}`;
                const res = await fetch(`http://localhost:5200/api/geocode?q=${address}`)
                const data = await res.json();
                console.log(data);
                const lat = data[0].lat;
                const lng = data[0].lon;
                setReceiverLocation([lat, lng]);
            }
        } catch (err) {
            console.error(err);
        } finally {
        }
    }


    return (<>

        {
            !isReady ? (<div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mx-auto"></div>) : courierLocation != null && receiverLocation != null && restaurantLocation != null &&
                // container
                <MapContainer className='h-full w-full' zoom={15} center={receiverLocation} >
                    <InvalidateMapSize /> {/* for prerendered map size  */}
                    <TileLayer attribution='copy& Copyright openStreetMap ' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                    <Marker position={receiverLocation} icon={receiverIcon} /> {/*Marker for receiver*/}
                    <Marker position={restaurantLocation} icon={restaurantIcon} /> {/*Marker for restaurant*/}
                    <Marker position={courierLocation} icon={courierIcon} /> {/*Marker for courier*/}
                </MapContainer >


        }

    </>
    )
}

export default MapTracker