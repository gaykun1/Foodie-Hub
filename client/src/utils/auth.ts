import { cookies } from "next/headers";

export async function checkAuth() {
    const token = (await cookies()).get("token")?.value;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    const data = await res.json();
    return data;
}