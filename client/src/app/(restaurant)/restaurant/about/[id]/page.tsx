"use client"
import { useAppSelector } from '@/hooks/reduxHooks';
import axios from 'axios';
import { FileText, Pen, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

const Page = () => {
    const { id } = useParams() as { id: string }
    const [info, setInfo] = useState<string>();
    const [draft, setDraft] = useState<string>("");
    const { user } = useAppSelector(state => state.auth);
    const [active, setActive] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const toast = useToast();

    const getTextAbout = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${id}/about`);
            setInfo(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const handleTextAbout = async () => {
        try {
            setSaving(true);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/${id}/about`, { id, info: draft });
            setInfo(res.data);
            setActive(false);
            toast.success("About info saved");
        } catch (err) {
            console.error(err);
            toast.error("Couldn't save. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        getTextAbout();
    }, [getTextAbout])

    return (
        <div className="flex flex-col gap-5 mb-12">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="section-title">About</h1>
                {user?.role === "admin" && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-inkMuted">Change or create info</span>
                        <Button
                            size="sm"
                            variant="secondary"
                            aria-label={active ? "Cancel editing" : "Edit about info"}
                            icon={active ? <X size={16} /> : <Pen size={16} />}
                            onClick={() => { setDraft(info ?? ""); setActive(!active); }}
                        />
                    </div>
                )}
            </div>

            {active && (
                <div className="flex flex-col items-end gap-3">
                    <Textarea
                        id="about-info"
                        label="About this restaurant"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="h-[220px] resize-none"
                        wrapperClassName="w-full"
                    />
                    <Button loading={saving} onClick={handleTextAbout}>Save</Button>
                </div>
            )}

            {loading ? (
                <PageSpinner />
            ) : info ? (
                <p className="text-lg leading-7 text-ink mt-4 whitespace-pre-wrap">{info}</p>
            ) : !active ? (
                <EmptyState icon={<FileText size={22} />} title="No info yet" description="This restaurant hasn't added an about section yet." />
            ) : null}
        </div>
    )
}

export default Page
