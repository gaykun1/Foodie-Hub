"use client"
import { SignUp } from '@/api/api';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Eye, EyeOff, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type FormFiedsType = {
  password: string,
  username: string,
}

const strengthChecks = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /\d/.test(v), label: "One number" },
];

const Page = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormFiedsType>();
  const router = useRouter();
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const password = watch("password") ?? "";

  const onSubmit: SubmitHandler<FormFiedsType> = async (data: FormFiedsType) => {
    try {
      setLoading(true);
      setError(false);
      const status = await SignUp(data.password, data.username);
      if (status === 200) {
        setTimeout(() => {
          router.push("/");
        }, 300);
      } else if (status === 403) {
        setError(true);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
          withCredentials: true,
        });
        if (res.data) {
          router.push("/");
        }
      } catch {
        console.log("Not authorized!");
      }
    }
    getUser();
  }, [router]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-end p-12 bg-gradient-to-br from-teal-700 via-teal-600 to-ember-600 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-96 rounded-full bg-ember-300/25 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 -left-24 size-80 rounded-full bg-teal-300/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 text-white max-w-md">
          <span className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
            <UtensilsCrossed size={14} />
            Foodie Hub
          </span>
          <h2 className="text-4xl font-display font-bold leading-tight">Join Foodie Hub and start ordering in minutes.</h2>
          <p className="text-white/85 text-lg">Create an account to save your addresses, track orders, and get exclusive deals.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="max-w-[400px] w-full flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 w-fit lg:hidden">
            <Image width={36} height={36} src="/logo.svg" alt="logo" />
            <span className="font-display font-bold text-ink text-lg">Foodie Hub</span>
          </Link>

          <div>
            <h1 className="text-3xl font-display font-bold text-ink">Sign up</h1>
            <p className="text-inkMuted mt-1">Create your account to get started.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              id="label1"
              label="Username"
              placeholder="Type in your username..."
              autoComplete="username"
              {...register("username", { required: "Username is required" })}
              error={errors.username?.message}
            />
            <div className="flex flex-col gap-2">
              <Input
                id="label2"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Type in your password..."
                autoComplete="new-password"
                {...register("password", {
                  // Requires the mix below but otherwise allows any character —
                  // the previous [A-Za-z\d] class silently barred symbols (and any
                  // non-ASCII letters) from passwords entirely, which is backwards
                  // for password strength, not a security measure.
                  validate: {
                    password: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value) || "Password must have at least one lowercase, one uppercase, one digit and minimum 8 characters",
                  }
                })}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="cursor-pointer pointer-events-auto"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
              {errors.password && (
                <span data-testid="error" className="text-sm font-medium text-danger">
                  {errors.password.message}
                </span>
              )}
              {password && (
                <ul className="flex flex-col gap-1 mt-1">
                  {strengthChecks.map(({ test, label }) => {
                    const passed = test(password);
                    return (
                      <li key={label} className={cn("text-xs flex items-center gap-1.5", passed ? "text-success700" : "text-inkSubtle")}>
                        <span className={cn("size-1.5 rounded-full", passed ? "bg-success700" : "bg-inkSubtle")} />
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {error && (
              <span data-testid="error2" className="text-sm font-medium text-danger">Username is already taken!</span>
            )}
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Sign up
            </Button>
          </form>

          <p className="text-sm text-inkMuted text-center">
            Already have an account?{" "}
            <Link className="font-semibold text-brand hover:underline" href="login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
export default Page;
