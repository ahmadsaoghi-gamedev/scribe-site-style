import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCHOOL } from "@/lib/auth";
import { isIOS, isStandalone } from "@/lib/pwa";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Only show on mobile/tablet
    const isMobileTablet = window.matchMedia("(max-width: 1024px)").matches;
    if (!isMobileTablet) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS doesn't fire BIP — show iOS hint banner after a small delay
    if (isIOS()) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
    setIosOpen(false);
  };

  const install = async () => {
    if (isIOS()) {
      setIosOpen(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const r = await deferred.userChoice;
    if (r.outcome === "accepted") localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] no-print lg:hidden">
      <div className="mx-auto max-w-md bg-card border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        {/* Main banner */}
        <div className="p-3 flex items-center gap-3">
          <img
            src={SCHOOL.logo}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">Pasang aplikasi ini</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              Pasang di layar utama HP kamu!
            </p>
          </div>
          <Button size="sm" onClick={install} className="h-10 rounded-full px-4">
            <Download className="h-4 w-4 mr-1" />
            Pasang
          </Button>
          <button
            aria-label="Tutup"
            onClick={dismiss}
            className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* iOS instructions — inline expandable panel (NO Dialog/Modal so body stays fully interactive) */}
        {iosOpen && (
          <div className="border-t border-border/40 px-4 py-3 bg-muted/30 text-sm space-y-2">
            <p className="font-semibold text-foreground">Cara pasang di iPhone / iPad:</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>
                Ketuk ikon{" "}
                <Share className="inline h-4 w-4 mx-1 text-primary" />
                <b>Share</b> di bagian bawah Safari.
              </li>
              <li>
                Pilih <b>Add to Home Screen</b> (Tambah ke Layar Utama).
              </li>
              <li>
                Ketuk <b>Add</b> di pojok kanan atas.
              </li>
            </ol>
            <button
              onClick={dismiss}
              className="mt-1 text-xs text-muted-foreground underline"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
