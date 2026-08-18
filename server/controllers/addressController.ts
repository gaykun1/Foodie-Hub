import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Address from "../models/Address";

const REQUIRED_FIELDS = ["street", "houseNumber", "city", "countryOrRegion"] as const;

const isValidPayload = (body: any): boolean =>
    REQUIRED_FIELDS.every(field => body?.[field] !== undefined && body[field] !== "");

export const getAddresses = async (req: Request, res: Response): Promise<void> => {
    try {
        const addresses = await Address.find({ userId: (req as AuthRequest).userId }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json(addresses);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};

export const createAddress = async (req: Request, res: Response): Promise<void> => {
    const { label, street, houseNumber, apartmentNumbr, city, countryOrRegion, isDefault } = req.body;
    try {
        if (!isValidPayload(req.body)) {
            res.status(400).json("Form error!");
            return;
        }
        const userId = (req as AuthRequest).userId;
        if (isDefault) {
            await Address.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
        }
        const address = await Address.create({
            userId, label: label || "Address", street, houseNumber, apartmentNumbr, city, countryOrRegion, isDefault: !!isDefault,
        });
        res.status(201).json(address);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { label, street, houseNumber, apartmentNumbr, city, countryOrRegion, isDefault } = req.body;
    try {
        const userId = (req as AuthRequest).userId;
        const existing = await Address.findOne({ _id: id, userId });
        if (!existing) {
            res.status(404).json("Not found!");
            return;
        }
        if (isDefault) {
            await Address.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
        }
        const address = await Address.findOneAndUpdate({ _id: id, userId }, {
            $set: {
                ...(label !== undefined && { label }),
                ...(street !== undefined && { street }),
                ...(houseNumber !== undefined && { houseNumber }),
                ...(apartmentNumbr !== undefined && { apartmentNumbr }),
                ...(city !== undefined && { city }),
                ...(countryOrRegion !== undefined && { countryOrRegion }),
                ...(isDefault !== undefined && { isDefault: !!isDefault }),
            }
        }, { new: true });
        res.status(200).json(address);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const address = await Address.findOneAndDelete({ _id: id, userId: (req as AuthRequest).userId });
        if (!address) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json("Deleted!");
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
