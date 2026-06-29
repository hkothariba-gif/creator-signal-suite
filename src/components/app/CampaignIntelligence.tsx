import {
  generateRedditAdFromCampaign,
  generateLinkedInBriefFromCampaign,
  generateXAmplificationFromCampaign,
} from "@/lib/intelligence";
import { X } from "lucide-react";

export function CampaignIntelligence({
  campaignId,
  campaignName,
  onClose,
}: {
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}) {
  const reddit = generateRedditAdFromCampaign(campaignId);
  const linkedin = generateLinkedInBriefFromCampaign(campaignId);
  const x = generateXAmplificationFromCampaign(campaignId);

  const comingSoon = (label: string) => () => alert(`${label} — Coming Soon`);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[680px] h-full bg-[#0C1222] border-l border-white/[0.07] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0C1222] flex items-center justify-between p-6 border-b border-white/[0.07]">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#00D97E] font-bold">Intelligence</div>
            <h3 className="font-bold text-lg mt-0.5">{campaignName}</h3>
          </div>
          <button onClick={onClose} className="text-[#8892A4] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reddit Ad Draft */}
          {reddit && (
            <Panel title="Reddit Ad Draft" accent="#FF4500">
              <div className="space-y-2 mb-4">
                {reddit.targetSubreddits.map((s) => (
                  <div
                    key={s.name}
                    className="reddit-subreddit-row flex items-center justify-between px-4 py-3 rounded-lg bg-[#131D2E] border border-white/[0.06]"
                  >
                    <div>
                      <div className="font-bold text-sm text-[#FF4500]">{s.name}</div>
                      <div className="text-xs text-[#8892A4] mt-0.5">{s.memberCount} · {s.matchReason}</div>
                    </div>
                    <span className="text-xs font-bold text-[#00D97E]">{s.audienceOverlap}% match</span>
                  </div>
                ))}
              </div>
              <Field label="Ad Headline"><div className="text-[#F0F4FF] font-semibold">{reddit.adHeadline}</div></Field>
              <Field label="Ad Body Copy"><div className="text-sm text-[#C8D0DE] leading-relaxed">{reddit.adBodyCopy}</div></Field>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <MiniStat label="Suggested Budget" value={reddit.suggestedBudget} />
                <MiniStat label="Estimated CPM" value={reddit.estimatedCPM} />
              </div>
              <button onClick={comingSoon("Launch Reddit Ad")} className="mt-4 w-full h-11 rounded-lg bg-[#FF4500] hover:opacity-90 text-white font-bold text-sm">
                Launch Reddit Ad →
              </button>
            </Panel>
          )}

          {/* LinkedIn Brief */}
          {linkedin && (
            <Panel title="LinkedIn Brief" accent="#0A66C2">
              <Field label="Reviewer Profile">
                <div className="text-[#F0F4FF] font-semibold text-sm">{linkedin.targetReviewerProfile.title}</div>
                <div className="text-xs text-[#8892A4] mt-1">
                  {linkedin.targetReviewerProfile.followerRange} · {linkedin.targetReviewerProfile.postFrequency}
                  {linkedin.targetReviewerProfile.linkedinTopVoice && <span className="ml-2 text-[#0A66C2] font-bold">· Top Voice</span>}
                </div>
              </Field>
              <Field label="Review Ask"><div className="text-sm text-[#C8D0DE] leading-relaxed">{linkedin.reviewAsk}</div></Field>
              <Field label="Suggested Post Angle"><div className="text-sm italic text-[#F0F4FF]">{linkedin.suggestedPostAngle}</div></Field>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <MiniStat label="Compensation" value={linkedin.compensationType} />
                <MiniStat label="Est. Leads / Post" value={String(linkedin.estimatedLeadsPerPost)} />
              </div>
              <button onClick={comingSoon("Send LinkedIn Brief")} className="mt-4 w-full h-11 rounded-lg bg-[#0A66C2] hover:opacity-90 text-white font-bold text-sm">
                Send LinkedIn Brief →
              </button>
            </Panel>
          )}

          {/* X Amplification */}
          {x && (
            <Panel title="X Amplification" accent="#FFFFFF">
              <Field label="Tweet Hook"><div className="text-[#F0F4FF] font-semibold">{x.tweetHook}</div></Field>
              <Field label="Thread Outline">
                <ol className="space-y-2 mt-1">
                  {x.threadOutline.map((t, i) => (
                    <li key={i} className="text-sm text-[#C8D0DE] flex gap-3">
                      <span className="text-[#00D97E] font-bold">{i + 1}.</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </Field>
              <Field label="Whitelisting Note">
                <div className="text-sm text-[#C8D0DE] leading-relaxed p-3 rounded-lg bg-[#00D97E]/[0.06] border border-[#00D97E]/20">
                  {x.whitelistingNote}
                </div>
              </Field>
              <button onClick={comingSoon("Find X Creators")} className="mt-4 w-full h-11 rounded-lg bg-white hover:opacity-90 text-[#1A1A1A] font-bold text-sm">
                Find X Creators →
              </button>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#131D2E] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full" style={{ background: accent }} />
        <h4 className="font-bold text-[#F0F4FF]">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider text-[#8892A4] font-semibold mb-1">{label}</div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#05080F] border border-white/[0.06] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[#8892A4] font-semibold">{label}</div>
      <div className="text-sm font-bold text-[#F0F4FF] mt-0.5">{value}</div>
    </div>
  );
}
