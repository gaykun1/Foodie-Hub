"use client"

import { courierApi } from "@/api";
import { errorMessage, isNotFound } from "@/lib/apiClient";
import { Check, User, X, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
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
    const [error, setError] = useState<boolean>(false);
    const [actingId, setActingId] = useState<string | null>(null);
    const toast = useToast();

    const getApplications = useCallback(async () => {
        try {
            setLoading(true);
            setError(false);
            setApplications((await courierApi.getApplications()) as unknown as ICourier[]);
        } catch (err) {
            if (isNotFound(err)) {
                setApplications([]);
            } else {
                console.error(err);
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void getApplications();
    }, [getApplications])

    const toggleApplication = async (status: "accepted" | "declined", id: string) => {
        try {
            setActingId(id);
            await courierApi.decideApplication(id, { status });
            setApplications((prev) => prev?.filter((item) => item._id !== id) ?? []);
            toast.success(status === "accepted" ? "Courier approved" : "Application declined");
        } catch (err) {
            console.error(err);
            toast.error(errorMessage(err, "Couldn't update this application."));
        } finally {
            setActingId(null);
        }
    }

    return (
        <div>
            <h1 className="section-title mb-6">Job applications</h1>
            {loading ? (
                <ListSkeleton count={3} />
            ) : error ? (
                <EmptyState
                    icon={<TriangleAlert size={22} />}
                    title="Couldn't load applications"
                    description="The request didn't get through. No application has been changed."
                    action={<Button onClick={getApplications}>Try again</Button>}
                />
            ) : !applications || applications.length === 0 ? (
                <EmptyState icon={<FileUser size={22} />} title="No pending applications" description="New courier applications will appear here as they come in." />
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
