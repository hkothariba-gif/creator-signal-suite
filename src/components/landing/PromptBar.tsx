import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Paperclip } from "lucide-react";

export function PromptBar() {
  const navigate = useNavigate();
  const [productDesc, setProductDesc] = useState("");
  const [showAttachTip, setShowAttachTip] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const v = productDesc.trim();
    if (!v) return;
    try {
      localStorage.setItem("aspen_hero_prompt", v);
    } catch {}
    navigate({ to: "/signup" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      <div className="ai-search-bar">
        <button
          type="button"
          className="ai-search-bar-attach"
          onMouseEnter={() => setShowAttachTip(true)}
          onMouseLeave={() => setShowAttachTip(false)}
          onFocus={() => setShowAttachTip(true)}
          onBlur={() => setShowAttachTip(false)}
          aria-label="Attach (coming soon)"
        >
          <Paperclip width={16} height={16} strokeWidth={2} />
          {showAttachTip && (
            <span
              style={{
                position: "absolute",
                bottom: "calc(100% + 8px)",
                left: 0,
                whiteSpace: "nowrap",
                background: "#131D2E",
                color: "#F0F4FF",
                fontSize: 11,
                padding: "5px 9px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                pointerEvents: "none",
              }}
            >
              Paste ad copy above
            </span>
          )}
        </button>

        <textarea
          ref={textareaRef}
          className="ai-search-bar-input"
          rows={1}
          value={productDesc}
          onChange={(e) => setProductDesc(e.target.value)}
          onInput={onInput}
          onKeyDown={onKeyDown}
          placeholder="Tell us a bit about your product and brand and who you're trying to sell to"
        />

        <div className="ai-search-bar-controls">
          <button
            type="button"
            className="ai-search-bar-submit"
            onClick={submit}
            disabled={!productDesc.trim()}
            aria-label="Show me the right creators"
          >
            <ArrowUp width={16} height={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <p className="ai-search-bar-hint">Press Enter to find the right creators</p>
    </div>
  );
}
