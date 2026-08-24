"use client";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login } from "@/redux/authSlice";
import { authApi } from "@/api";
import { errorMessage } from "@/lib/apiClient";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

type formType = {
  username: string,
  password: string,
  newPassword: string,
  newPasswordAgain: string,
  phoneNumber: string,
  email: string,
  city: string,
  street: string,
  houseNumber: number,
}

const ProfileView = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEquals, setIsEquals] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const toast = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<formType>();

  const handleSave: SubmitHandler<formType> = async (data) => {
    const payload: Partial<formType> = {};

    if (data.username && data.username !== user?.username) payload.username = data.username;
    if (data.email && data.email !== user?.email) payload.email = data.email;
    if (data.phoneNumber && data.phoneNumber !== user?.phoneNumber) payload.phoneNumber = data.phoneNumber;
    if (data.city && data.city !== user?.address?.city) payload.city = data.city;
    if (data.street && data.street !== user?.address?.street) payload.street = data.street;
    if (data.houseNumber && data.houseNumber !== user?.address?.houseNumber) payload.houseNumber = data.houseNumber;

    if (data.newPassword || data.newPasswordAgain) {
      if (data.newPassword !== data.newPasswordAgain) {
        setIsEquals(false);
        return;
      }
      setIsEquals(true);
      if (data.newPassword && data.password) {
        payload.password = data.password;
        payload.newPassword = data.newPassword;
        payload.newPasswordAgain = data.newPasswordAgain;
      }
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      const updated = await authApi.updateProfile({ payload });
      if (updated) dispatch(login(updated));
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      // Surfaces the server's own reason (e.g. "Current password is wrong")
      // instead of a generic message the user can't act on.
      toast.error(errorMessage(err, "Couldn't save changes. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-5 flex flex-col gap-1">
        <h1 className="leading-7 text-2xl font-semibold text-ink">Account Settings</h1>
        <p className="text-inkMuted leading-5">Manage your personal information and password.</p>
      </div>
      <form onSubmit={handleSubmit(handleSave)}>
        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-4 border-b border-border pb-6 mb-8">
          <Input
            id="profile-username" label="Full Name"
            defaultValue={user?.username}
            disabled={!isEditing}
            {...register("username")}
          />
          <Input
            id="profile-email" label="Email Address" type="email"
            defaultValue={user?.email || ""}
            disabled={!isEditing}
            error={errors.email?.message}
            {...register("email", {
              validate: {
                isValidEmailForm: (value) => !value || /^\w+@\w+\.\w{2,3}$/.test(value) || "Wrong email format",
              }
            })}
          />
          <Input
            id="profile-phone" label="Phone Number" type="tel"
            defaultValue={user?.phoneNumber || ""}
            disabled={!isEditing}
            error={errors.phoneNumber?.message}
            {...register("phoneNumber", {
              validate: {
                isUAFormat: (value) => !value || /^\+380\d{9}$/.test(value) || "Phone must be in +380XXXXXXXXX format",
              }
            })}
          />
          <Input
            id="profile-city" label="City"
            defaultValue={user?.address?.city || ""}
            disabled={!isEditing}
            {...register("city")}
          />
          <Input
            id="profile-street" label="Street"
            defaultValue={user?.address?.street || ""}
            disabled={!isEditing}
            {...register("street")}
          />
          <Input
            id="profile-house-number" label="House number"
            defaultValue={user?.address?.houseNumber || ""}
            disabled={!isEditing}
            {...register("houseNumber")}
          />
        </div>
        <div>
          <h2 className="text-lg leading-7 font-medium mb-3 text-ink">Password Management</h2>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-4">
            <Input
              id="profile-current-password" label="Current Password" type="password"
              disabled={!isEditing}
              {...register("password")}
            />
            <Input
              id="profile-new-password" label="New Password" type="password"
              disabled={!isEditing}
              error={!isEquals ? "Passwords don't match" : errors.newPassword?.message}
              {...register("newPassword", {
                validate: {
                  password: (value) => !value || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value) || "Password must have at least one lowercase, one uppercase, one digit and minimum 8 characters",
                }
              })}
            />
            <Input
              id="profile-confirm-password" label="Confirm New Password" type="password"
              disabled={!isEditing}
              error={!isEquals ? "Passwords don't match" : undefined}
              {...register("newPasswordAgain")}
            />
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={!isEditing} loading={saving}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isEditing}
            onClick={() => { setIsEditing(true); setIsEquals(true); }}
          >
            Edit
          </Button>
        </div>
      </form>
    </Card>
  );
};

const Page = () => (
  <RequireAuth
    title="Sign in to manage your account"
    description="Account settings belong to a signed-in profile."
  >
    <ProfileView />
  </RequireAuth>
);

export default Page;
