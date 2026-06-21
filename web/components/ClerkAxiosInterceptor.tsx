"use client";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect } from "react";

export function ClerkAxiosInterceptor({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptorId = axios.interceptors.request.use(async (config) => {
            const token = await getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return () => {
            axios.interceptors.request.eject(interceptorId);
        };
    }, [getToken]);

    return <>{children}</>;
}
