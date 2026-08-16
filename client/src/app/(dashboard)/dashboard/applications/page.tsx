"use client"

import axios from "axios";
import { Check, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUser } from "lucide-react";

interface ICourier {
    fullname: string,
    phoneNumber: string,
    email: string,
    transport: string,
    age: number,
    _id: string,
    city: string,
}

const Page = () => {
    const [applications, setApplications] = useState<ICourier[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const getApplications = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/applications`, { withCredentials: true });
            if (!res.data) return;
            setApplications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        getApplications();
    }, [])

    const toggleApplication = async (status: string, id: string) => {
        try {
            setActingId(id);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/courier/applications/${id}`, { status });
            if (res) {
                setApplications((prev) => prev?.filter((item) => item._id !== id) || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActingId(null);
        }
    }

    return (
        <div>
            <h1 className="section-title mb-6">Job applications</h1>
            {loading ? (
                <PageSpinner />
            ) : !applications || applications.length === 0 ? (
                <EmptyState icon={<FileUser size={22} />} title="No applications" description="Courier applications will appear here." />
            ) : (
                <div className="grid xl:grid-cols-2 gap-6">
                    {applications.map((app) => (
                        <Card key={app._id} padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="border border-border size-14 hidden sm:flex items-center justify-center shrink-0 rounded-md text-inkMuted">
                                    <User size={24} />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h3 className="text-base font-semibold text-ink">{app.fullname}</h3>
                                    <span className="text-sm text-inkMuted">Age: {app.age} · City: {app.city}</span>
                                    <span className="text-sm text-inkMuted">{app.email}</span>
                                    <span className="text-sm text-inkMuted">{app.phoneNumber}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    variant="success"
                                    size="sm"
                                    aria-label={`Accept ${app.fullname}`}
                                    loading={actingId === app._id}
                                    icon={<Check size={16} />}
                                    onClick={() => toggleApplication("accepted", app._id)}
                                />
                                <Button
                                    variant="danger"
                                    size="sm"
                                    aria-label={`Decline ${app.fullname}`}
                                    disabled={actingId === app._id}
                                    icon={<X size={16} />}
                                    onClick={() => toggleApplication("declined", app._id)}
                                />
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Page
