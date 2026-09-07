import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useMemberAuth } from "@/lib/memberAuth";

export function SynkDexWidget() {
  const { user } = useAuth();
  const { member } = useMemberAuth();

  const userName = user?.name || member?.name || "";
  const userEmail = user?.email || member?.email || "";

  useEffect(() => {
    const existingScript = document.getElementById("synkdex-widget-script");
    if (existingScript) {
      existingScript.setAttribute("data-user-name", userName);
      existingScript.setAttribute("data-user-email", userEmail);
      return;
    }

    const script = document.createElement("script");
    script.id = "synkdex-widget-script";
    script.src = "https://www.synkdex.com/widget.js";
    script.setAttribute("data-api-key", import.meta.env.VITE_SYNKDEX_API_KEY || "");
    script.setAttribute("data-brand-name", "Latest Talks");
    script.setAttribute("data-brand-logo", "https://www.synkdex.com/synkdex-logo.webp");
    script.setAttribute("data-user-name", userName);
    script.setAttribute("data-user-email", userEmail);
    document.body.appendChild(script);

    return () => {
      const s = document.getElementById("synkdex-widget-script");
      if (s) document.body.removeChild(s);
    };
  }, [userName, userEmail]);

  return null;
}
