import { Server, Socket } from "socket.io";

export let io: Server;
// Maps for sockets
export let socketsMap = new Map<string, Socket>();
export let restaurantsSocketsMap = new Map<string, Socket>();

// Set for active admins
export const activeAdmins = new Set<string>();
export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        },
    });


    // websockets logic
    io.on("connection", (socket: Socket) => {
        // updating location
        socket.on("updateLocation", ({ orderId, lat, lng }: { orderId: string, lat: number, lng: number }) => {
            io.to(orderId).emit("locationUpdate", { lat, lng });
        })
        // room for courier and receiver
        socket.on("joinOrder", ({ orderId, userId }: { orderId: string, userId: string }) => {
            socket.join(orderId);
            socketsMap.set(userId, socket);

        })

        // rooms for dashboard roles
        socket.on("joinDashboard", (adminId: string) => {
            socket.join(adminId);
            socketsMap.set(adminId, socket);
            activeAdmins.add(adminId);
        })
        socket.on("joinDashboardRestaurant", (restaurantId: string) => {
            socket.join(restaurantId);
            restaurantsSocketsMap.set(restaurantId, socket);
        })


        socket.on("disconnect", () => {
            socketsMap.forEach((value, key) => {
                if (value === socket) {
                    socketsMap.delete(key);
                    activeAdmins.delete(key);
                }
            })
        })
    })
    return io;
};