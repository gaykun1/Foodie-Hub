"use client";
import { useEffect } from "react";

export default function Ping() {
    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/ping`).catch(() => { });
    }, []);

    return null;
}
