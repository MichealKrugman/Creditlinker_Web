"use client";

// Reports page — consolidated into Financing.
// Redirect to /financer/financing#reports so there's no duplicate page.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FinancerReports() {
  const router = useRouter();
  useEffect(() => { router.replace("/financer/financing"); }, [router]);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Loader2 size={24} style={{ color: "#D1D5DB", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
