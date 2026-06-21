import AppLayout from "@/components/layouts/AppLayout";
import React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
