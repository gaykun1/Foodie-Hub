"use client"
import { LogIn } from '@/api/api';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react'
import { Eye, EyeOff, UtensilsCrossed } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { DemoCredentials } from '@/components/auth/DemoCredentials';

/** Only same-origin paths are honoured, so `?next=` can't be used as an open redirect. */
const safeNext = (value: string | null): string => {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
};

const LoginForm = () => {
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    const getUser = async () => {
      try {
        await apiClient.get(`/api/auth/profile`);
        // Already signed in — go straight where they were headed.
        router.push(next);
      } catch {
        // Not signed in, which is the expected case on this screen.
      }
    }
    getUser();
  }, [router, next]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const status = await LogIn(password, username);
      if (status === 200) {
        setError(false);
        setTimeout(() => {
          router.push(next);
        }, 300);
      } else if (status === 404) {
        setError(true);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-end p-12 bg-gradient-to-br from-ember-600 via-ember-500 to-ember-700 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-24 -right-24 size-96 rounded-full bg-teal-400/25 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 -left-24 size-80 rounded-full bg-ember-300/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 text-white max-w-md">
          <span className="inline-flex items-center gap-2 w-fit px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
            <UtensilsCrossed size={14} />
            Foodie Hub
          </span>
          <h2 className="text-4xl font-display font-bold leading-tight">Welcome back. Your next favorite meal is waiting.</h2>
          <p className="text-white/85 text-lg">Log in to track orders, save favorites, and check out faster.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="max-w-[400px] w-full flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 w-fit lg:hidden">
            <Image width={36} height={36} src="/logo.svg" alt="logo" />
            <span className="font-display font-bold text-ink text-lg">Foodie Hub</span>
          </Link>

          <div>
            <h1 className="text-3xl font-display font-bold text-ink">Log in to your account</h1>
            <p className="text-inkMuted mt-1">Welcome back! Enter your details below.</p>
          </div>

          <DemoCredentials onUse={(demoUser, demoPassword) => { setUsername(demoUser); setPassword(demoPassword); }} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="label1"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Type in your username..."
              autoComplete="username"
            />
            <Input
              id="label2"
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type in your password..."
              autoComplete="current-password"
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
            {error && (
              <span data-testid="error" className="text-sm font-medium text-danger">
                We couldn&apos;t find an account with that username and password.
              </span>
            )}
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Log in
            </Button>
          </form>

          <p className="text-sm text-inkMuted text-center">
            Don&apos;t have an account?{" "}
            <Link className="font-semibold text-brand hover:underline" href={`/auth/register?next=${encodeURIComponent(next)}`}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// useSearchParams needs a suspense boundary to keep this route statically
// renderable rather than forcing it dynamic.
const Page = () => (
  <Suspense fallback={<PageSpinner />}>
    <LoginForm />
  </Suspense>
);

export default Page;
