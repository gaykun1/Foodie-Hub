"use client"

import { courierApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form"
import { Input, Select } from "@/components/ui/Field"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { CheckCircle2 } from "lucide-react"

type formFields = {
    name: string,
    surname: string,
    phoneNumber: string,
    email: string,
    age: string,
    transport: string,
    city: string,
}

const ApplicationForm = () => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<formFields>();
    const [loading, setLoading] = useState<boolean>(false);
    const [alreadySent, setAlreadySent] = useState<boolean>(false);
    const toast = useToast();

    const onSubmit: SubmitHandler<formFields> = async (data: formFields) => {
        try {
            setLoading(true);
            const res = await courierApi.createApplication({ data });
            setAlreadySent(res.status);
            reset();
        } catch (err) {
            console.error(err);
            // Previously logged and swallowed, so a rejected application (e.g.
            // one already on file) left the form looking like nothing happened.
            toast.error(errorMessage(err, "Couldn't send your application. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const checkIfSent = async () => {
            try {
                const res = await courierApi.getApplicationStatus();
                setAlreadySent(res.status);
            } catch (err) {
                console.error(err);
            }
        }
        checkIfSent()
    }, [])

    if (alreadySent) {
        return (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={28} className="text-success700" />
                <p className="font-semibold text-ink">Application sent!</p>
                <p className="text-sm text-inkMuted">We&apos;ll reach out once it&apos;s been reviewed.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <Input id="app-name" label="Name" autoComplete="given-name" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
                <Input id="app-surname" label="Surname" autoComplete="family-name" error={errors.surname?.message} {...register("surname", { required: "Surname is required" })} />
                <Input
                    id="app-age"
                    label="Age"
                    inputMode="numeric"
                    error={errors.age?.message}
                    {...register("age", {
                        required: "Age is required",
                        validate: {
                            isNumber: (value) => /^\d+$/.test(value) || "Must be a number",
                            min: (value) => +value >= 18 || "Must be at least 18",
                            max: (value) => +value <= 99 || "Must be at most 99",
                        },
                    })}
                />
                <Select id="app-city" label="City" defaultValue="Lviv" {...register("city", { required: true })}>
                    <option value="Lviv">Lviv</option>
                    <option value="Warsaw">Warsaw</option>
                    <option value="Berlin">Berlin</option>
                </Select>
                <Input
                    id="app-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register("email", {
                        required: "Email is required",
                        validate: { validEmail: (value) => /^\w+@\w+\.\w{2,3}$/.test(value) || "Wrong email format" },
                    })}
                />
                <Input
                    id="app-phone"
                    label="Phone Number"
                    type="tel"
                    autoComplete="tel"
                    error={errors.phoneNumber?.message}
                    {...register("phoneNumber", { required: "Phone number is required" })}
                />
                <Input id="app-transport" label="Transport" hint="Optional — e.g. bicycle, car" {...register("transport")} />
            </div>

            <Button type="submit" loading={loading} className="w-fit">
                Send application
            </Button>
        </form>
    )
}

export default ApplicationForm
