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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#F0F4FF] flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#00D97E]" /> Reach out to {creatorName}
        </h3>
        <button
          onClick={discover}
          disabled={discovering}
          className="text-xs font-semibold px-3 h-8 rounded-lg border border-white/10 text-[#8892A4] hover:text-white inline-flex items-center gap-1.5 disabled:opacity-50"
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
            onClick={() => {
              setChannel(ch);
              const first = contacts.find((c) => c.channel === ch);
              setAddress(first ? first.address : "");
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              channel === ch ? "bg-[#00D97E] text-[#05080F]" : "bg-white/[0.05] text-[#8892A4] hover:text-white"
            }`}
          >
            {CHANNEL_LABEL[ch]}
          </button>
        ))}
      </div>

      {/* Discovered contacts for this channel */}
      {loading ? (
        <p className="text-xs text-[#5A6478]">Loading contacts…</p>
      ) : channel !== "linkedin" ? (
        <div>
          <label className="text-xs text-[#8892A4]">
            {channel === "email" ? "Email address" : channel === "x" ? "X username or user id" : "Reddit username"}
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={channel === "email" ? "creator@example.com" : "@handle"}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E]"
          />
          {forChannel.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {forChannel.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAddress(c.address)}
                  className="text-[10px] px-2 py-1 rounded-full bg-white/[0.05] text-[#8892A4] hover:text-white inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> {c.address}
                  <span className="text-[#5A6478]">· {c.source.replace("_", " ")}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#8892A4]">
          LinkedIn doesn't allow automated cold messages. We'll open a prefilled compose window for you to send
          manually, and log it in the thread.
        </p>
      )}

      {channel === "email" && (
        <p className="text-[11px] text-[#5A6478]">
          Sending as{" "}
          {identity ? (
            <span className="text-[#00D97E]">{identity}</span>
          ) : (
            <>
              the platform sender —{" "}
              <span className="text-[#8892A4]">connect your own inbox on the Outreach page</span>
            </>
          )}
        </p>
      )}

      {channel === "email" && sequences.length > 0 && (
        <div>
          <label className="text-xs text-[#8892A4]">Send</label>
          <select
            value={sequenceId}
            onChange={(e) => setSequenceId(e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E]"
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
        <p className="text-xs text-[#8892A4]">
          The sequence's own subject and messages will be used, personalized with the creator's
          name. It stops automatically if they reply.
        </p>
      ) : (
        <>
          {channel === "email" && (
            <div>
              <label className="text-xs text-[#8892A4]">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E]"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-[#8892A4]">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder={`Hi ${creatorName}, we love your content and think you'd be a great fit for…`}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E] resize-y"
            />
          </div>
        </>
      )}

      <div className="flex gap-2 justify-end">
        {onClose && (
          <button onClick={onClose} className="px-4 h-10 rounded-lg border border-white/10 text-sm text-[#8892A4] hover:text-white">
            Close
          </button>
        )}
        <button
          onClick={send}
          disabled={sending}
          className="px-5 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {channel === "linkedin" ? "Open compose" : channel === "email" && sequenceId ? "Enroll" : "Send"}
        </button>
      </div>
    </div>
  );
}
