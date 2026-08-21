import { Suspense } from "react";
import { LoginContent } from "@/components/partials/Login";

export default function LoginPage() {
  // `useSearchParams` (the ?expired=1 flag) needs a Suspense boundary in the
  // App Router; the fallback is the page's own paper, so nothing flashes.
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <LoginContent />
    </Suspense>
  );
}
