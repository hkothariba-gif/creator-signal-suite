import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Send, Mail, Plus } from "lucide-react";
import {
  listContacts,
  sendOutreachMessage,
  type CreatorContact,
  type Channel,
} from "@/lib/outreach.functions";
import { discoverCreatorContacts } from "@/lib/contact-discovery.functions";
import { getEmailOAuthStatus } from "@/lib/email-oauth.functions";
import { listSequences, enrollInSequence, type Sequence } from "@/lib/sequences.functions";

// Compose and send an outreach message to one creator. Handles contact
// discovery, channel selection, and the LinkedIn assisted path (opens a
// prefilled compose window since LinkedIn forbids automated cold DMs). Used
// from the creator profile and from the unified inbox.
const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email",
  x: "X DM",
  reddit: "Reddit DM",
  linkedin: "LinkedIn (assisted)",
};

export function OutreachComposer({
  hotlistId,
  campaignId,
  creatorName,
  onSent,
  onClose,
}: {
  hotlistId: string;
  campaignId?: string | null;
  creatorName: string;
  onSent?: () => void;
  onClose?: () => void;
}) {
  const [contacts, setContacts] = useState<CreatorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");
  const [address, setAddress] = useState("");
  const [subject, setSubject] = useState(`Partnership with ${creatorName}`);
  const [body, setBody] = useState("");
  // Phase 4E: connected sending identity + sequence enrollment.
  const [identity, setIdentity] = useState<string | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [sequenceId, setSequenceId] = useState<string>("");

  useEffect(() => {
    getEmailOAuthStatus()
      .then((s) => {
        const active = s.connections.find((c) => c.status === "active");
        setIdentity(
          active?.from_address
            ? `${active.from_address} (${active.provider === "outlook" ? "Outlook" : "Gmail"})`
            : null,
        );
      })
      .catch(() => setIdentity(null));
    listSequences()
      .then(setSequences)
      .catch(() => setSequences([]));
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const rows = await listContacts({ data: { hotlistId } });
      setContacts(rows);
      const preferred = rows.find((r) => r.channel === channel) ?? rows.find((r) => r.channel !== "website");
      if (preferred && !address) {
        setChannel(preferred.channel === "website" ? "email" : (preferred.channel as Channel));
        if (preferred.channel !== "website") setAddress(preferred.address);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotlistId]);

  const forChannel = useMemo(
    () => contacts.filter((c) => c.channel === channel),
    [contacts, channel],
  );

  const discover = async () => {
    setDiscovering(true);
    try {
      const res = await discoverCreatorContacts({ data: { hotlistId } });
      if (res.needsYouTubeKey) {
        toast.info("Connect the YouTube key to discover contacts automatically");
      } else {
        toast.success(res.found > 0 ? `Found ${res.found} contact point(s)` : "No contacts found automatically");
      }
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Discovery failed");
    } finally {
      setDiscovering(false);
    }
  };

  const send = async () => {
    if (channel !== "linkedin" && !address.trim()) {
      toast.error("Add a destination address or handle first");
      return;
    }
    // Sequence enrollment replaces the one-off send for email.
    if (channel === "email" && sequenceId) {
      setSending(true);
      try {
        await enrollInSequence({
          data: { sequenceId, hotlistId, toAddress: address.trim() },
        });
        toast.success("Enrolled — step 1 sends within the next run");
        onSent?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Enrollment failed");
      } finally {
        setSending(false);
      }
      return;
    }
    if (!body.trim()) {
      toast.error("Write a message first");
      return;
    }
    setSending(true);
    try {
      const res = await sendOutreachMessage({
        data: {
          hotlistId,
          campaignId: campaignId ?? null,
          channel,
          to: address.trim(),
          subject: channel === "email" ? subject : undefined,
          body,
        },
      });
      if (res.assistUrl) {
        window.open(res.assistUrl, "_blank", "noopener");
        toast.success("LinkedIn compose opened — send it there, we've logged it");
      } else {
        toast.success("Message sent");
      }
      setBody("");
      onSent?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  // Re-skinned to the Aspen tokens: this renders inside cream cards on the
  // Outreach page and inside a cream modal on the creator profile, so the old
  // dark palette read as a different product.
  const inputClass =
    "mt-1 w-full h-10 px-3 rounded-[11px] bg-cream border-[1.5px] border-border text-[14px] text-dark focus:outline-none focus:border-accent";
  const labelClass = "text-[12px] font-bold tracking-[0.04em] text-subtle";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading font-bold text-[17px] text-dark flex items-center gap-2 m-0">
          <Mail className="w-4 h-4 text-accent" /> Reach out to {creatorName}
        </h3>
        <button
          onClick={discover}
          disabled={discovering}
          className="text-[12px] font-bold px-3 h-8 rounded-[10px] border-[1.5px] border-border text-muted hover:border-dark inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Find contacts
        </button>
      </div>

      {/* Channel picker */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(CHANNEL_LABEL) as Channel[]).map((ch) => (
          <button
            key={ch}
            aria-pressed={channel === ch}
            onClick={() => {
              setChannel(ch);
              const first = contacts.find((c) => c.channel === ch);
              setAddress(first ? first.address : "");
              // Subject belongs to email; keeping it across a channel switch
              // left a stale line behind on X and Reddit.
              if (ch !== "email") setSubject("");
            }}
            className={`px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-colors ${
              channel === ch
                ? "bg-accent text-cream"
                : "bg-sand text-muted hover:text-dark"
            }`}
          >
            {CHANNEL_LABEL[ch]}
          </button>
        ))}
      </div>

      {/* Discovered contacts for this channel */}
      {loading ? (
        <p className="text-[12.5px] text-subtle">Loading contacts…</p>
      ) : channel !== "linkedin" ? (
        <div>
          <label className={labelClass} htmlFor="outreach-address">
            {channel === "email" ? "Email address" : channel === "x" ? "X username or user id" : "Reddit username"}
          </label>
          <input
            id="outreach-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={channel === "email" ? "creator@example.com" : "@handle"}
            className={inputClass}
          />
          {forChannel.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {forChannel.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAddress(c.address)}
                  className="text-[11px] font-bold px-2 py-1 rounded-[8px] bg-sand text-muted hover:text-dark inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {c.address}
                  <span className="text-subtle">· {c.source.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[12.5px] text-muted leading-[1.55]">
          LinkedIn doesn't allow automated cold messages. We'll open a prefilled compose window for you to send
          manually, and log it in the thread.
        </p>
      )}

      {channel === "email" && (
        <p className="text-[11.5px] text-subtle">
          Sending as{" "}
          {identity ? (
            <span className="font-bold text-accent">{identity}</span>
          ) : (
            <>
              the platform sender —{" "}
              <span className="text-muted">connect your own inbox on the Outreach page</span>
            </>
          )}
        </p>
      )}

      {channel === "email" && sequences.length > 0 && (
        <div>
          <label className={labelClass} htmlFor="outreach-sequence">
            Send
          </label>
          <select
            id="outreach-sequence"
            value={sequenceId}
            onChange={(e) => setSequenceId(e.target.value)}
            className={inputClass}
          >
            <option value="">One-off message</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>
                Sequence: {s.name} ({s.steps.length} step{s.steps.length === 1 ? "" : "s"})
              </option>
            ))}
          </select>
        </div>
      )}

      {channel === "email" && sequenceId ? (
        <p className="text-[12.5px] text-muted leading-[1.55]">
          The sequence's own subject and messages will be used, personalized with the creator's
          name. It stops automatically if they reply.
        </p>
      ) : (
        <>
          {channel === "email" && (
            <div>
              <label className={labelClass} htmlFor="outreach-subject">
                Subject
              </label>
              <input
                id="outreach-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="outreach-body">
              Message
            </label>
            <textarea
              id="outreach-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={`Hi ${creatorName}, we love your content and think you'd be a great fit for…`}
              className="mt-1 w-full px-3 py-2 rounded-[11px] bg-cream border-[1.5px] border-border text-[14px] text-dark focus:outline-none focus:border-accent resize-y"
            />
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 h-10 rounded-[11px] border-[1.5px] border-border text-[14px] font-bold text-muted hover:border-dark"
          >
            Close
          </button>
        )}
        <button
          onClick={send}
          disabled={sending}
          className="px-5 h-10 rounded-[11px] bg-accent text-cream text-[14px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {channel === "linkedin" ? "Open compose" : channel === "email" && sequenceId ? "Enroll" : "Send"}
        </button>
      </div>
    </div>
  );
}

