"use client";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login } from "@/redux/authSlice";
import { User } from "@/redux/reduxTypes";
import axios from "axios";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

type formType = {
  username: string,
  password: string,
  newPassword: string,
  newPasswordAgain: string,
  phoneNumber: string,
  email: string,

}

const Page = () => {


  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEquals, setIsEquals] = useState<boolean>(true);


  const handleSave: SubmitHandler<formType> = async (data) => {
    const payload: Partial<formType> = {};

    if (data.username && data.username !== user?.username) {
      payload.username = data.username;
    }

    if (data.email && data.email !== user?.email) {
      payload.email = data.email;
    }

    if (data.phoneNumber && data.phoneNumber !== user?.phoneNumber) {
      payload.phoneNumber = data.phoneNumber;

    }

    if (data.newPassword && data.newPassword === data.newPasswordAgain && data.password) {
      payload.password = data.password;
      payload.newPassword = data.newPassword;
      payload.newPasswordAgain = data.newPasswordAgain;
      if (payload.newPassword !== payload.newPasswordAgain) setIsEquals(false);
    }

    if (Object.keys(payload).length === 0) return;

    try {
      const res = await axios.patch("http://localhost:5200/api/auth/update-profile", {
        payload
      }, { withCredentials: true });
      if (res.data)
        dispatch(login(res.data));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
    setIsEditing(false);
  };

  const { register, handleSubmit, formState: { errors } } = useForm<formType>({
   });

  return (
    <div className="border-borderColor border-[1px] rounded-lg p-6 flex flex-col">
      <div className="mb-5 flex flex-col gap-2">
        <h1 className="leading-7 text-2xl font-semibold">Account Settings</h1>
        <p className="text-gray leading-5">Manage your personal information and password.</p>
      </div>
      <form onSubmit={handleSubmit(handleSave)}>
        <div className="grid grid-cols-2 gap-x-4  gap-y-3.5 border-b-[1px] border-borderColor text-sm pb-6 mb-[30px]">
          <div className="flex flex-col gap-[10px]">
            <label className="leading-3.5 font-medium">Full Name</label>
            <input className="input px-3 py-2"

              defaultValue={user?.username}
              {...register("username", {})}
              disabled={!isEditing}
            />
          </div>
          <div className="flex flex-col gap-[10px]">
            <label className="leading-3.5 font-medium">Email Address</label>
            <input className="input px-3 py-2"

              defaultValue={user?.email || ""}
              {...register("email", {
                validate: {
                  isUAFormat: (value) =>
                    /^\w+@\w+\.\w{2,3}$/.test(value) || "Wrong email format",
                }
              })}
              disabled={!isEditing}
            />
            {errors.email && (
              <div className="">{errors.email.message}</div>
            )}
          </div>
          <div className="flex flex-col gap-[10px]">
            <label className="leading-3.5 font-medium">Phone Number</label>
            <input type="tel" className="input px-3 py-2"

              defaultValue={user?.phoneNumber || ""}
              {...register("phoneNumber", {
                validate: {
                  isUAFormat: (value) =>
                    /^\+380\d{9}$/.test(value) || "Phone must be in +380XXXXXXXXX format",
                }
              })}
              disabled={!isEditing}
            />
            {errors.phoneNumber && (
              <div className="">{errors.phoneNumber.message}</div>
            )}
          </div>

        </div>
        <div className="">
          <h2 className="text-[18px] leading-7 font-medium mb-2.5">Password Management</h2>
          <div className="grid grid-cols-2 gap-x-4  gap-y-3.5 text-sm">
            <div className="flex flex-col gap-[10px]">
              <label className="leading-3.5 font-medium">Current Password</label>
              <input className="input px-3 py-2"
                type="password"
                {...register("password", {})}

                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col gap-[10px]">
              <label className={`leading-3.5 font-medium `}>New Password</label>
              <input className={`input px-3 py-2 ${isEquals ? "" : "border-red-500!"}  `}
                type="password"
                {...register("newPassword", {})}
                disabled={!isEditing}
              />
            </div>
            <div className="flex flex-col gap-[10px] ">
              <label className={`leading-3.5 font-medium `}>Confirm New Password</label>
              <input className={`input px-3 py-2 ${isEquals ? "" : "border-red-500!"}`}
                type="password"
                {...register("newPasswordAgain", {})}
                disabled={!isEditing}
              />
            </div>

          </div>
        </div>

        <div className="flex gap-4 mt-4">

          <button disabled={!isEditing}
            type="submit"
            className={`btn p-2 disabled:bg-gray! disabled:cursor-auto! `}
          >
            Save Changes
          </button>

          <button disabled={isEditing}
            type="button"
            onClick={() => { setIsEditing(true); }}
            className="btn p-2 disabled:bg-gray! disabled:cursor-auto!"
          >
            Edit
          </button>

        </div>
      </form>
    </div>
  );
};

export default Page;
