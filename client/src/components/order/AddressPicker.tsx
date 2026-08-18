"use client"
import { MapPin, Pencil } from "lucide-react";
import { Address } from "@/redux/reduxTypes";
import { cn } from "@/lib/cn";

interface AddressPickerProps {
    addresses: Address[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onUseManual: () => void;
}

const AddressPicker = ({ addresses, selectedId, onSelect, onUseManual }: AddressPickerProps) => (
    <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Saved addresses">
            {addresses.map((address) => (
                <label
                    key={address._id}
                    className={cn(
                        "flex items-start gap-3 py-3 px-4 rounded-md border cursor-pointer transition-colors",
                        selectedId === address._id ? "border-brand bg-ember-50" : "border-border hover:bg-surfaceRaised"
                    )}
                >
                    <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedId === address._id}
                        onChange={() => onSelect(address._id)}
                        className="accent-brand cursor-pointer size-4 mt-1"
                    />
                    <MapPin size={18} className="text-brand shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-sm">
                        <span className="font-semibold text-ink">
                            {address.label}{address.isDefault ? " (Default)" : ""}
                        </span>
                        <span className="text-inkMuted">
                            {address.street} {address.houseNumber}{address.apartmentNumbr ? `, apt ${address.apartmentNumbr}` : ""}, {address.city}, {address.countryOrRegion}
                        </span>
                    </div>
                </label>
            ))}
        </div>
        <button
            type="button"
            onClick={onUseManual}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline w-fit cursor-pointer"
        >
            <Pencil size={14} /> Enter a different address
        </button>
    </div>
);

export default AddressPicker;
