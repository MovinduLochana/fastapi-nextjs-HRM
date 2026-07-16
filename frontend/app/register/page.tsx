"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Mail, Lock, User, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema } from "@/lib/validations";
import { getApiErrorMessage } from "@/lib/errors";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const { user, loading: authLoading, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Validate with Zod
    const result = registerSchema.safeParse({
      full_name: fullName || undefined,
      email,
      username,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await register(email, username, password, fullName || undefined);
      toast.success("Registration successful! Please sign in.");
      router.push("/login");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-blue-700 p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <UserPlus className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white">Join HRM System</h1>
          <p className="text-lg text-purple-100">
            Create your account and start managing your team with ease and efficiency.
          </p>
          <div className="mt-8 space-y-3">
            {["Employee Management", "Payroll Processing", "Department Organization"].map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-white">{feature}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full items-center justify-center bg-muted/30 p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">HRM System</span>
          </div>

          <div className="animate-fade-in rounded-2xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Create Account</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in your details to get started</p>
            </div>

            {serverError && (
              <div className="mb-4 bg-hrm-red-light border border-hrm-red/20 rounded-lg p-3">
                <p className="text-sm text-hrm-red">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      clearFieldError("full_name");
                    }}
                    placeholder="John Doe"
                    className={`w-full rounded-xl border ${errors.full_name ? 'border-hrm-red' : 'border-input'} bg-background py-2.5 pl-10 pr-4 text-sm placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  />
                </div>
                {errors.full_name && <p className="mt-1 text-xs text-hrm-red">{errors.full_name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Email Address <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError("email");
                    }}
                    placeholder="you@company.com"
                    className={`w-full rounded-xl border ${errors.email ? 'border-hrm-red' : 'border-input'} bg-background py-2.5 pl-10 pr-4 text-sm placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-hrm-red">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Username <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearFieldError("username");
                    }}
                    placeholder="johndoe"
                    className={`w-full rounded-xl border ${errors.username ? 'border-hrm-red' : 'border-input'} bg-background py-2.5 pl-10 pr-4 text-sm placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-hrm-red">{errors.username}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Password <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                      }}
                      placeholder="••••••"
                      className={`w-full rounded-xl border ${errors.password ? 'border-hrm-red' : 'border-input'} bg-background py-2.5 pl-10 pr-4 text-sm placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-hrm-red">{errors.password}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Confirm <span className="text-destructive">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError("confirmPassword");
                      }}
                      placeholder="••••••"
                      className={`w-full rounded-xl border ${errors.confirmPassword ? 'border-hrm-red' : 'border-input'} bg-background py-2.5 pl-10 pr-4 text-sm placeholder-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-hrm-red">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
