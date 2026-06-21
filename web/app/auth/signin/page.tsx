"use client";

import { SignIn, useAuth } from "@clerk/nextjs"
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

function LoginPage() {
  const navigate = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      navigate.push("/dashboard");
    }
  }, [isSignedIn, navigate]);
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <SignIn routing="hash" />
    </div>
  )
}

export default LoginPage