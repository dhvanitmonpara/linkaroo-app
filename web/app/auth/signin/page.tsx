"use client";

import { SignIn, useAuth } from "@clerk/nextjs"
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

function LoginPage() {
  const navigate = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate.push("/");
    }
  }, [isLoaded, isSignedIn, navigate]);
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <SignIn routing="hash" signUpUrl="/auth/signup" forceRedirectUrl="/" />
    </div>
  )
}

export default LoginPage