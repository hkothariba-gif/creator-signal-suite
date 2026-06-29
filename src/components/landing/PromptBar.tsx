import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Sparkles, Youtube, MessageSquare, Hash, Briefcase } from "lucide-react";

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

const QUICK_SUGGESTIONS = [
  { icon: Youtube, label: "YouTube tech reviewers under 500K subs" },
  { icon: MessageSquare, label: "Reddit power users in r/homelab" },
  { icon: Hash, label: "X creators in build-in-public niche" },
  { icon: Briefcase, label: "LinkedIn B2B thought leaders" },
];

export function PromptBar() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"input" | "creator">("input");
  const [productDesc, setProductDesc] = useState("");
  const [influencerType, setInfluencerType] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [productDesc]);

  const submitProduct = () => {
    if (!productDesc.trim()) return;
    setStep("creator");
  };

  const finish = (type: string) => {
    const finalType = (type || influencerType).trim();
    if (!finalType) return;
    localStorage.setItem(
      "ar_intent",
      JSON.stringify({ productDesc, adInventory: "", influencerType: finalType, savedAt: Date.now() })
    );
    navigate({ to: "/login" });
  };

  useEffect(() => {
    if (step === "creator") {
      const first = chipsContainerRef.current?.querySelector<HTMLButtonElement>("button");
      first?.focus();
    }
  }, [step]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitProduct();
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
    <div style={{ maxWidth: 680, margin: "0 auto 24px", width: "100%" }}>
      {step === "input" && (
        <>
          {/* Perplexity-style single search box */}
          <div
            className="group"
            style={{
              position: "relative",
              background: "rgba(12, 18, 34, 0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "14px 16px 12px",
              backdropFilter: "blur(16px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,217,126,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "border-color 160ms ease, box-shadow 160ms ease",
            }}
            onFocusCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,217,126,0.45)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.4), 0 0 0 3px rgba(0,217,126,0.12), inset 0 1px 0 rgba(255,255,255,0.04)";
            }}
            onBlurCapture={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,217,126,0.05), inset 0 1px 0 rgba(255,255,255,0.04)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Sparkles
                className="mt-1 shrink-0"
                style={{ width: 18, height: 18, color: "#00D97E" }}
              />
              <textarea
                ref={inputRef}
                rows={1}
                value={productDesc}
                onChange={(e) => setProductDesc(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Describe your product and who you want to reach…"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  color: "#F0F4FF",
                  fontSize: 16,
                  lineHeight: 1.5,
                  fontFamily: "inherit",
                  padding: "2px 0",
                  maxHeight: 160,
                  overflow: "auto",
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={submitProduct}
                disabled={!productDesc.trim()}
                aria-label="Find creators"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: productDesc.trim() ? "#00D97E" : "rgba(255,255,255,0.08)",
                  color: productDesc.trim() ? "#05080F" : "#8892A4",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: productDesc.trim() ? "pointer" : "not-allowed",
                  transition: "all 160ms ease",
                  boxShadow: productDesc.trim()
                    ? "0 0 20px rgba(0,217,126,0.35), inset 0 1px 0 rgba(255,255,255,0.25)"
                    : "none",
                  flexShrink: 0,
                }}
              >
                <ArrowUp style={{ width: 18, height: 18 }} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Quick suggestion chips */}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setProductDesc(s.label);
                  inputRef.current?.focus();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#8892A4",
                  fontSize: 12.5,
                  padding: "6px 12px",
                  borderRadius: 999,
                  cursor: "pointer",
                  transition: "all 160ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0,217,126,0.4)";
                  e.currentTarget.style.color = "#F0F4FF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#8892A4";
                }}
              >
                <s.icon style={{ width: 13, height: 13 }} />
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === "creator" && (
        <div
          style={{
            background: "rgba(12, 18, 34, 0.85)",
            border: "1px solid rgba(0, 217, 126, 0.25)",
            borderRadius: 16,
            padding: 20,
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 3px rgba(0,217,126,0.08)",
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 12, color: "#8892A4", marginBottom: 4 }}>
            <button
              type="button"
              onClick={() => setStep("input")}
              style={{
                background: "none",
                border: "none",
                color: "#00D97E",
                cursor: "pointer",
                padding: 0,
                fontSize: 12,
              }}
            >
              ← Edit
            </button>
            <span style={{ marginLeft: 8 }}>
              {productDesc.length > 70 ? productDesc.slice(0, 70) + "…" : productDesc}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#F0F4FF", margin: "10px 0 12px" }}>
            What kind of creator are you looking for?
          </div>
          <div ref={chipsContainerRef} onKeyDown={onChipsKeyDown} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                      setTimeout(() => customInputRef.current?.focus(), 0);
                    } else {
                      setCustomMode(false);
                      setInfluencerType(c);
                    }
                  }}
                  className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D97E]/60 ${
                    sel
                      ? "bg-[#00D97E]/15 border-[#00D97E] text-[#00D97E]"
                      : "bg-white/[0.04] border-white/10 text-[#F0F4FF] hover:border-white/30"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {customMode && (
            <input
              ref={customInputRef}
              type="text"
              value={influencerType}
              onChange={(e) => setInfluencerType(e.target.value)}
              onKeyDown={onCustomKeyDown}
              placeholder="Describe your ideal creator… (press Enter to continue)"
              style={{
                marginTop: 12,
                background: "rgba(5, 8, 15, 0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#F0F4FF",
                fontSize: 14,
                width: "100%",
                outline: "none",
              }}
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
              boxShadow: influencerType.trim()
                ? "0 0 24px rgba(0,217,126,0.35), inset 0 1px 0 rgba(255,255,255,0.25)"
                : "none",
            }}
          >
            Start Setup →
          </button>
        </div>
      )}
    </div>
  );
}
