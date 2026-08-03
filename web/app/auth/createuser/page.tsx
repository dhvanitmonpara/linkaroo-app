"use client";

import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react'
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

function CreateUserForm() {

  const navigate = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    const createUserHandler = async () => {
      try {
        if (!isLoaded) return

        const email = user?.primaryEmailAddress?.emailAddress;
        if (!email) {
          navigate.push("/auth/signin")
          return
        }

        const res = await axios({
          method: "POST",
          data: {
            email: user?.primaryEmailAddress?.emailAddress,
            username: user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0],
            clerkId: user?.id
          },
          url: `${process.env.NEXT_PUBLIC_SERVER_API_URL}/users`,
          withCredentials: true,
        });

        if (res.status === 201 || res.status === 200) {
          navigate.push("/");
          return;
        }

        toast.error('Failed to create user');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (
            error.response?.status === 200 ||
            (error.response?.data?.message && error.response.data.message.includes("already exists"))
          ) {
            navigate.push("/");
            return;
          }
          toast.error(error.response?.data?.message || "Error while creating user");
        } else {
          console.error(error);
          toast.error("Error while creating user");
        }
      }
    };
    createUserHandler();
  }, [isLoaded, isSignedIn, navigate, user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate.push("/auth/signin");
      return;
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className='h-screen w-screen flex justify-center items-center flex-col'>
      <h3 className='font-bold text-2xl'>Setting up your account</h3>
      <Loader2 className="animate-spin text-2xl mt-6" />
    </div>
  )
}

export default CreateUserForm