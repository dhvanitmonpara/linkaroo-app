"use client";

import { SignUp, useAuth } from "@clerk/nextjs"
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

function SignUpPage() {
  const navigate = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate.push("/");
    }
  }, [isLoaded, isSignedIn, navigate]);
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <SignUp routing="hash" signInUrl="/auth/signin" forceRedirectUrl="/" />
    </div>
  )
}

export default SignUpPage