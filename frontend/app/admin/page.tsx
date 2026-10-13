import type { Metadata } from "next";
import { AdminDashboard } from "../components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Simulasi dashboard admin SMP Nurul Huda.",
  robots: { index: false, follow: false },
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
