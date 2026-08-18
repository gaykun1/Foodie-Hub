"use client"
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Address } from "@/redux/reduxTypes";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

type AddressFormFields = {
    label: string,
    street: string,
    houseNumber: number,
    apartmentNumbr?: number,
    city: string,
    countryOrRegion: string,
    isDefault: boolean,
}

const Page = () => {
    const [addresses, setAddresses] = useState<Address[]>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressFormFields>();
    const toast = useToast();

    const getAddresses = useCallback(async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/address/addresses`, { withCredentials: true });
            setAddresses(res.data ?? []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        getAddresses();
    }, [getAddresses]);

    const openCreate = () => {
        setEditingAddress(null);
        reset({ label: "", street: "", houseNumber: undefined, apartmentNumbr: undefined, city: "", countryOrRegion: "Ukraine", isDefault: false });
        setModalOpen(true);
    };

    const openEdit = (address: Address) => {
        setEditingAddress(address);
        reset({
            label: address.label, street: address.street, houseNumber: address.houseNumber,
            apartmentNumbr: address.apartmentNumbr ?? undefined, city: address.city,
            countryOrRegion: address.countryOrRegion, isDefault: address.isDefault,
        });
        setModalOpen(true);
    };

    const onSubmit: SubmitHandler<AddressFormFields> = async (data) => {
        try {
            setSaving(true);
            if (editingAddress) {
                await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/address/addresses/${editingAddress._id}`, data, { withCredentials: true });
                toast.success("Address updated");
            } else {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/address/addresses`, data, { withCredentials: true });
                toast.success("Address saved");
            }
            setModalOpen(false);
            await getAddresses();
        } catch (err) {
            console.error(err);
            toast.error("Couldn't save this address. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            setDeletingId(id);
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/address/addresses/${id}`, { withCredentials: true });
            setAddresses((prev) => prev?.filter(a => a._id !== id));
            toast.success("Address removed");
        } catch (err) {
            console.error(err);
            toast.error("Couldn't remove this address. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-ink">Saved Addresses</h1>
                <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add address</Button>
            </div>

            {!addresses ? null : addresses.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                        <Card key={address._id} padding="sm" className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 min-w-0">
                                    <MapPin size={18} className="text-brand shrink-0 mt-0.5" />
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn("font-semibold text-ink", "truncate")}>
                                            {address.label}{address.isDefault && (
                                                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand"><Star size={12} className="fill-brand" /> Default</span>
                                            )}
                                        </span>
                                        <span className="text-sm text-inkMuted">
                                            {address.street} {address.houseNumber}{address.apartmentNumbr ? `, apt ${address.apartmentNumbr}` : ""}, {address.city}, {address.countryOrRegion}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => openEdit(address)}>Edit</Button>
                                <Button
                                    variant="danger" size="sm" icon={<Trash2 size={14} />}
                                    loading={deletingId === address._id}
                                    onClick={() => deleteAddress(address._id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState icon={<MapPin size={22} />} title="No saved addresses yet" description="Save an address to check out faster next time." />
            )}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAddress ? "Edit address" : "Add address"}>
                <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                    <Input id="address-label" label="Label" placeholder="Home, Work, ..." {...register("label")} />
                    <Select id="address-country" label="Country/Region" {...register("countryOrRegion", { required: true })}>
                        <option value="Ukraine">Ukraine</option>
                        <option value="Poland">Poland</option>
                        <option value="Germany">Germany</option>
                    </Select>
                    <Input id="address-city" label="City" error={errors.city?.message} {...register("city", { required: "Required" })} />
                    <Input id="address-street" label="Street" error={errors.street?.message} {...register("street", { required: "Required" })} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input id="address-house-number" label="House number" type="number" error={errors.houseNumber?.message} {...register("houseNumber", { required: "Required", valueAsNumber: true })} />
                        <Input id="address-apartment" label="Apartment number" hint="Optional" type="number" {...register("apartmentNumbr", { valueAsNumber: true })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                        <input type="checkbox" className="accent-brand size-4 cursor-pointer" {...register("isDefault")} />
                        Set as default address
                    </label>
                    <Button type="submit" loading={saving} fullWidth>
                        {editingAddress ? "Save changes" : "Save address"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default Page;
