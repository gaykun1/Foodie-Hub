"use client"
import axios from 'axios';
import { SubmitHandler, useForm } from 'react-hook-form'
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

type formFields = {
    code: string,
    percent: number,
    type: "Usual" | "Special",
}

const Page = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<formFields>({
        defaultValues: { type: "Usual" },
    });
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const onSubmit: SubmitHandler<formFields> = async (data) => {
        try {
            setLoading(true);
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/promocode/promocodes`, { data }, { withCredentials: true });
            if (res) {
                reset();
                toast.success("Promocode created");
            }
        } catch (err) {
            console.error(err);
            toast.error("Couldn't create promocode. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-7">
            <h1 className="section-title">Promocodes</h1>
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-ink">Create promocode</h2>
                <Card className="w-fit">
                    <form className="flex flex-col sm:flex-row sm:items-end gap-4" onSubmit={handleSubmit(onSubmit)}>
                        <Input id="promo-code" label="Code" error={errors.code?.message} {...register("code", { required: "Code is required" })} />
                        <Select id="promo-type" label="Type" {...register("type")}>
                            <option>Special</option>
                            <option>Usual</option>
                        </Select>
                        <Input
                            id="promo-percent" label="Percent" type="number" wrapperClassName="w-24"
                            error={errors.percent?.message}
                            {...register("percent", { required: "Required", valueAsNumber: true, min: { value: 1, message: "Min 1" }, max: { value: 100, message: "Max 100" } })}
                        />
                        <Button type="submit" loading={loading}>Create</Button>
                    </form>
                </Card>
            </div>
        </div>
    )
}

export default Page
