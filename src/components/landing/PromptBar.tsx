import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";


const CREATOR_CHIPS = [
  "Tech reviewers",
  "Finance educators",
  "Lifestyle bloggers",
  "B2B thought leaders",
  "Gaming creators",
  "Health & wellness",
  "Parenting / Family",
  "Fashion & beauty",
  "Custom...",
];

const cardStyle: React.CSSProperties = {
  background: "rgba(12, 18, 34, 0.8)",
  border: "1px solid rgba(0, 217, 126, 0.2)",
  borderRadius: 16,
  padding: 24,
  maxWidth: 640,
  margin: "0 auto 32px",
  backdropFilter: "blur(12px)",
  boxShadow: "0 0 40px rgba(0, 217, 126, 0.08)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(5, 8, 15, 0.6)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "#F0F4FF",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

export function PromptBar() {
  const navigate = useNavigate();
  const [intentStep, setIntentStep] = useState<"idle" | "product" | "influencer" | "done">("idle");
  const [productDesc, setProductDesc] = useState("");
  const [adInventory, setAdInventory] = useState("");
  const [influencerType, setInfluencerType] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const productInputRef = useRef<HTMLInputElement>(null);
  const adInputRef = useRef<HTMLInputElement>(null);
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => { if (intentStep === "idle") setIntentStep("product"); };

  const goStep2 = () => {
    if (!productDesc.trim()) return;
    setIntentStep("influencer");
  };

  const finish = (type: string) => {
    const finalType = type || influencerType;
    if (!finalType.trim()) return;
    localStorage.setItem(
      "ar_intent",
      JSON.stringify({ productDesc, adInventory, influencerType: finalType, savedAt: Date.now() })
    );
    setIntentStep("done");
    navigate({ to: "/login" });
  };

  // Auto-focus first chip when entering step 2
  useEffect(() => {
    if (intentStep === "influencer") {
      const first = chipsContainerRef.current?.querySelector<HTMLButtonElement>("button");
      first?.focus();
    }
  }, [intentStep]);

  const onProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (productDesc.trim()) adInputRef.current?.focus();
    }
  };

  const onAdKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goStep2();
    }
  };

  const onChipsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = chipsContainerRef.current;
    if (!container) return;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>("button"));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      buttons[(idx + 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.key === "Enter" && influencerType.trim() && !customMode) {
      e.preventDefault();
      finish(influencerType);
    }
  };

  const onCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && influencerType.trim()) {
      e.preventDefault();
      finish(influencerType);
    }
  };


  return (
    <div style={cardStyle}>
      {(intentStep === "idle" || intentStep === "product") && (
        <>
          <input
            ref={productInputRef}
            type="text"
            value={productDesc}
            onFocus={handleFocus}
            onChange={(e) => setProductDesc(e.target.value)}
            onKeyDown={onProductKeyDown}
            placeholder="Describe your product or paste an existing ad... (e.g. 'We sell a $49/mo CRM for real estate agents')"
            style={{ ...inputStyle, fontSize: 15, padding: "16px 18px" }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#00D97E")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            autoFocus
          />
          <input
            ref={adInputRef}
            type="text"
            value={adInventory}
            onChange={(e) => setAdInventory(e.target.value)}
            onKeyDown={onAdKeyDown}
            placeholder="Paste existing ad copy or campaign description (optional)"
            style={{ ...inputStyle, marginTop: 10 }}
            onFocusCapture={(e) => (e.currentTarget.style.borderColor = "#00D97E")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />

          <button
            type="button"
            onClick={goStep2}
            disabled={!productDesc.trim()}
            style={{
              marginTop: 14,
              width: "100%",
              background: "#00D97E",
              color: "#05080F",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              cursor: productDesc.trim() ? "pointer" : "not-allowed",
              opacity: productDesc.trim() ? 1 : 0.5,
            }}
          >
            Find My Creators →
          </button>
        </>
      )}

      {intentStep === "influencer" && (
        <>
          <div style={{ fontSize: 12, color: "#8892A4", marginBottom: 8 }}>
            Product: <span style={{ color: "#F0F4FF" }}>{productDesc.length > 60 ? productDesc.slice(0, 60) + "…" : productDesc}</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#F0F4FF", marginBottom: 14 }}>
            What kind of creator are you looking for?
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CREATOR_CHIPS.map((c) => {
              const sel = influencerType === c || (c === "Custom..." && customMode);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    if (c === "Custom...") {
                      setCustomMode(true);
                      setInfluencerType("");
                    } else {
                      setCustomMode(false);
                      setInfluencerType(c);
                    }
                  }}
                  className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                    sel
                      ? "bg-[#00D97E]/15 border-[#00D97E] text-[#00D97E]"
                      : "bg-white/[0.05] border-white/10 text-[#F0F4FF] hover:border-white/30"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {customMode && (
            <input
              type="text"
              value={influencerType}
              onChange={(e) => setInfluencerType(e.target.value)}
              placeholder="Describe your ideal creator..."
              style={{ ...inputStyle, marginTop: 12 }}
              autoFocus
            />
          )}
          <button
            type="button"
            onClick={() => finish(influencerType)}
            disabled={!influencerType.trim()}
            style={{
              marginTop: 16,
              width: "100%",
              background: "#00D97E",
              color: "#05080F",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              borderRadius: 10,
              padding: "12px 18px",
              cursor: influencerType.trim() ? "pointer" : "not-allowed",
              opacity: influencerType.trim() ? 1 : 0.5,
            }}
          >
            Start Setup →
          </button>
        </>
      )}
    </div>
  );
}
