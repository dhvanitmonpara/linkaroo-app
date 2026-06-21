"use client";

import { SignUp, useAuth } from "@clerk/nextjs"
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

function SignUpPage() {
  const navigate = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      navigate.push("/");
    }
  }, [isSignedIn, navigate]);
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <SignUp routing="hash" />
    </div>
  )
}

export default SignUpPage