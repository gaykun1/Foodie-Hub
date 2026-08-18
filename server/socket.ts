import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Order from "./models/Order";
import User from "./models/User";

export let io: Server;
// Maps for sockets
export let socketsMap = new Map<string, Socket>();
export let restaurantsSocketsMap = new Map<string, Socket>();

// Set for active admins
export const activeAdmins = new Set<string>();

interface SocketData {
    userId: string;
    role: string;
}

// No socket.io-client dependency for this, so parse the raw cookie header by hand
// rather than pulling in a new package for one line of work.
const parseCookies = (header?: string): Record<string, string> => {
    const result: Record<string, string> = {};
    if (!header) return result;
    header.split(";").forEach(pair => {
        const idx = pair.indexOf("=");
        if (idx === -1) return;
        const key = pair.slice(0, idx).trim();
        if (key) result[key] = decodeURIComponent(pair.slice(idx + 1).trim());
    });
    return result;
};

export const initSocket = (server: any) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        },
    });

    // Same auth cookie the REST API requires. Without this, the room-join handlers
    // below only had a client-supplied id to go on, so anyone could join any
    // admin/restaurant dashboard room or any order's live GPS tracking room just by
    // guessing/knowing its id, and could push fake courier locations into it too.
    io.use((socket, next) => {
        try {
            const token = parseCookies(socket.handshake.headers.cookie).token;
            if (!token) {
                next(new Error("Unauthorized"));
                return;
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string };
            (socket.data as SocketData).userId = decoded.userId;
            (socket.data as SocketData).role = decoded.role;
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });

    // websockets logic
    io.on("connection", (socket: Socket) => {
        const { userId, role } = socket.data as SocketData;

        // updating location — only the courier actually assigned to this order may
        // publish a position into its tracking room.
        socket.on("updateLocation", async ({ orderId, lat, lng }: { orderId: string, lat: number, lng: number }) => {
            try {
                const order = await Order.findById(orderId);
                if (!order || order.courierId?.toString() !== userId) return;
                io.to(orderId).emit("locationUpdate", { lat, lng });
            } catch { }
        })
        // room for courier and receiver — only the order's own customer or its
        // assigned courier may join, and identity comes from the verified token,
        // not the (spoofable) userId the client sent.
        socket.on("joinOrder", async ({ orderId }: { orderId: string }) => {
            try {
                const order = await Order.findById(orderId);
                if (!order) return;
                const isOwner = order.userId.toString() === userId;
                const isCourier = order.courierId?.toString() === userId;
                if (!isOwner && !isCourier) return;
                socket.join(orderId);
                socketsMap.set(userId, socket);
            } catch { }
        })

        // rooms for dashboard roles
        socket.on("joinDashboard", () => {
            if (role !== "admin") return;
            socket.join(userId);
            socketsMap.set(userId, socket);
            activeAdmins.add(userId);
        })
        socket.on("joinDashboardRestaurant", async () => {
            try {
                if (role !== "restaurant") return;
                const actingUser = await User.findById(userId);
                const restaurantId = actingUser?.restaurantId?.toString();
                if (!restaurantId) return;
                socket.join(restaurantId);
                restaurantsSocketsMap.set(restaurantId, socket);
            } catch { }
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
