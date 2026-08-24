"use client"
import { promocodesApi } from '@/api'
import { errorMessage } from '@/lib/apiClient'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { useState } from 'react'
import { Ticket, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const PromocodeView = () => {
    const [promocode, setPromocode] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const checkPromo = async () => {
        if (!promocode.trim()) {
            setError("Please enter a promocode");
            setSuccess(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await promocodesApi.claimPromocode(promocode.trim());
            setSuccess(true);
            setPromocode("");
        } catch (err) {
            setSuccess(false);
            setError(errorMessage(err, "That promocode isn't valid."));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center py-20 px-4">
            <Card className="max-w-[440px] w-full flex flex-col items-center gap-5 text-center py-10">
                <div className="flex items-center justify-center size-12 rounded-full bg-ember-100 text-brand">
                    <Ticket size={22} />
                </div>
                <div>
                    <h1 className="section-title">Enter your Promocode</h1>
                    <p className="text-sm text-inkMuted mt-1">Unlock a discount on your next order.</p>
                </div>
                <form
                    onSubmit={(e) => { e.preventDefault(); checkPromo(); }}
                    className="flex gap-2 items-end w-full max-w-[320px]"
                >
                    <Input
                        id="promocode"
                        label="Promocode"
                        wrapperClassName="flex-1"
                        value={promocode}
                        onChange={(e) => setPromocode(e.target.value)}
                        placeholder="FEAST20"
                        autoComplete="off"
                    />
                    <Button type="submit" loading={loading}>Use</Button>
                </form>
                {success && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-success700">
                        <CheckCircle2 size={16} />
                        Promocode applied!
                    </span>
                )}
                {error && <span className="text-sm font-medium text-danger">{error}</span>}
            </Card>
        </div>
    )
}

const Page = () => (
    <RequireAuth
        title="Sign in to claim a promocode"
        description="Promocodes are saved to your account and applied at checkout."
    >
        <PromocodeView />
    </RequireAuth>
);

export default Page
