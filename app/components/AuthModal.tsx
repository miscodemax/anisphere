"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthModal() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${
          window.location.origin
        }/auth/callback?redirect=${encodeURIComponent(pathname)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-sm w-[90%] mx-auto animate-in slide-in-from-bottom-5 duration-300 
                   rounded-2xl shadow-lg p-6 bg-gradient-to-b from-white to-[#FFF8E1]"
      >
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            Bienvenue 👋
          </DialogTitle>
          <p className="text-center text-sm text-gray-600 mt-1">
            Connectez-vous pour continuer et découvrir plus.
          </p>
        </DialogHeader>

        {error && (
          <div
            className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 
                          rounded-lg px-3 py-2 text-sm mt-4"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-label="Se connecter avec Google"
            className="w-full flex items-center justify-center gap-2 
                       bg-white text-gray-900 border-2 border-[#F6C445] 
                       hover:bg-[#FFF3C5] shadow-sm transition-all 
                       rounded-xl py-4 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 text-gray-700" />
                Redirection...
              </>
            ) : (
              <>Continuer avec Google</>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            🔒 Nous ne partagerons jamais vos données sans votre accord.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
