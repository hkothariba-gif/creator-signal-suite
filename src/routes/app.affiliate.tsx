import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Copy, Plus, ExternalLink, Check } from "lucide-react";

export const Route = createFileRoute("/app/affiliate")({
    component: AffiliatePage,
});

type AffLink = {
    id: string;
    name: string;
    url: string;
    clicks: number;
    conversions: number;
    revenue: string;
    created: string;
};

const SEED_LINKS: AffLink[] = [
  { id: "aff_001", name: "TechWithMarcus – Summer Bundle", url: "https://go.aspenreach.com/aff_001", clicks: 1840, conversions: 143, revenue: "$2,860", created: "Jun 1, 2026" },
  { id: "aff_002", name: "r/homelab mod – Storage Deal", url: "https://go.aspenreach.com/aff_002", clicks: 940, conversions: 89, revenue: "$1,424", created: "Jun 5, 2026" },
  { id: "aff_003", name: "@buildinpublic_sara – SaaS Trial", url: "https://go.aspenreach.com/aff_003", clicks: 620, conversions: 67, revenue: "$1,608", created: "Jun 8, 2026" },
  { id: "aff_004", name: "CodeWithChris – Pro Plan", url: "https://go.aspenreach.com/aff_004", clicks: 2100, conversions: 210, revenue: "$6,300", created: "Jun 12, 2026" },
  ];

function generateId() {
    return "aff_" + Math.random().toString(36).slice(2, 9).toUpperCase();
}

function AffiliatePage() {
    const [links, setLinks] = useState<AffLink[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [newName, setNewName] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
          try {
                  const stored = localStorage.getItem("ar_affiliate_links");
                  if (stored) {
                            setLinks(JSON.parse(stored));
                  } else {
                            setLinks(SEED_LINKS);
                            localStorage.setItem("ar_affiliate_links", JSON.stringify(SEED_LINKS));
                  }
          } catch {
                  setLinks(SEED_LINKS);
          }
    }, []);

    const save = (updated: AffLink[]) => {
          setLinks(updated);
          localStorage.setItem("ar_affiliate_links", JSON.stringify(updated));
    };

    const handleCreate = () => {
          if (!newName.trim()) return;
          const id = generateId();
          const slug = id.toLowerCase();
          const link: AffLink = {
                  id,
                  name: newName.trim(),
                  url: `https://go.aspenreach.com/${slug}`,
                  clicks: 0,
                  conversions: 0,
                  revenue: "$0",
                  created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          };
          save([link, ...links]);
          setNewName("");
          setShowModal(false);
    };

    const handleCopy = (link: AffLink) => {
          navigator.clipboard.writeText(link.url).catch(() => {});
          setCopiedId(link.id);
          setTimeout(() => setCopiedId(null), 2000);
    };

    const totalRevenue = links.reduce((sum, l) => {
          const n = parseFloat(l.revenue.replace(/[$,]/g, "")) || 0;
          return sum + n;
    }, 0);
    const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);

    return (
          <AppShell title="Affiliate & Payouts">
            {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
            { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}` },
            { label: "Total Conversions", value: totalConversions.toLocaleString() },
            { label: "Total Clicks", value: totalClicks.toLocaleString() },
                    ].map((s) => (
                                <div key={s.label} className="bg-[#0C1222] border border-white/[0.07] rounded-lg p-4">
                                            <p className="text-xs text-[#8892A4] mb-1">{s.label}</p>p>
                                            <p className="text-2xl font-bold text-[#F0F4FF]">{s.value}</p>p>
                                </div>div>
                        ))}
                </div>div>
          
            {/* Header + New Link button */}
                <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-[#F0F4FF]">Affiliate Links</h2>h2>
                        <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#00D97E] text-[#05080F] font-semibold rounded-lg text-sm hover:bg-[#00bf6e] transition-colors"
                                  >
                                  <Plus className="w-4 h-4" />
                                  Generate New Link
                        </button>button>
                </div>div>
          
            {/* Links table */}
                <div className="bg-[#0C1222] border border-white/[0.07] rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                                  <thead>
                                              <tr className="border-b border-white/[0.07]">
                                                {["Campaign Name", "Affiliate URL", "Clicks", "Conversions", "Revenue", "Created", ""].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-xs text-[#8892A4] font-medium">{h}</th>th>
                                                            ))}
                                              </tr>tr>
                                  </thead>thead>
                                  <tbody>
                                    {links.map((link) => (
                          <tr key={link.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                          <td className="px-4 py-3 text-[#F0F4FF] font-medium">{link.name}</td>td>
                                          <td className="px-4 py-3">
                                                            <span className="text-[#00D97E] font-mono text-xs truncate max-w-[180px] block">{link.url}</span>span>
                                          </td>td>
                                          <td className="px-4 py-3 text-[#8892A4]">{link.clicks.toLocaleString()}</td>td>
                                          <td className="px-4 py-3 text-[#8892A4]">{link.conversions.toLocaleString()}</td>td>
                                          <td className="px-4 py-3 text-[#00D97E] font-semibold">{link.revenue}</td>td>
                                          <td className="px-4 py-3 text-[#8892A4] text-xs">{link.created}</td>td>
                                          <td className="px-4 py-3">
                                                            <button
                                                                                  onClick={() => handleCopy(link)}
                                                                                  className="flex items-center gap-1 px-3 py-1 rounded border border-white/[0.1] text-xs text-[#8892A4] hover:text-white hover:border-[#00D97E] transition-colors"
                                                                                >
                                                              {copiedId === link.id ? <Check className="w-3 h-3 text-[#00D97E]" /> : <Copy className="w-3 h-3" />}
                                                              {copiedId === link.id ? "Copied!" : "Copy"}
                                                            </button>button>
                                          </td>td>
                          </tr>tr>
                                              ))}
                                  </tbody>tbody>
                        </table>table>
                  {links.length === 0 && (
                      <div className="text-center py-12 text-[#8892A4]">No affiliate links yet. Generate your first link above.</div>div>
                        )}
                </div>div>
          
            {/* Create modal */}
            {showModal && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                              <div className="bg-[#0C1222] border border-white/[0.1] rounded-xl p-6 w-full max-w-md">
                                          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Generate New Affiliate Link</h3>h3>
                                          <label className="block text-xs text-[#8892A4] mb-1">Campaign / Creator Name</label>label>
                                          <input
                                                          value={newName}
                                                          onChange={(e) => setNewName(e.target.value)}
                                                          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                                          placeholder="e.g. TechWithMarcus – Q3 Push"
                                                          className="w-full bg-[#131D2E] border border-white/[0.1] rounded-lg px-3 py-2 text-[#F0F4FF] text-sm mb-4 focus:outline-none focus:border-[#00D97E]"
                                                          autoFocus
                                                        />
                                          <div className="flex gap-3 justify-end">
                                                        <button
                                                                          onClick={() => { setShowModal(false); setNewName(""); }}
                                                                          className="px-4 py-2 rounded-lg border border-white/[0.1] text-[#8892A4] text-sm hover:text-white"
                                                                        >
                                                                        Cancel
                                                        </button>button>
                                                        <button
                                                                          onClick={handleCreate}
                                                                          disabled={!newName.trim()}
                                                                          className="px-4 py-2 rounded-lg bg-[#00D97E] text-[#05080F] font-semibold text-sm disabled:opacity-50 hover:bg-[#00bf6e]"
                                                                        >
                                                                        Generate →
                                                        </button>button>
                                          </div>div>
                              </div>div>
                    </div>div>
                )}
          </AppShell>AppShell>
        );
}</AppShell>
    )
    })
    }
          }
    }
    }
          }
                  }
                  }
          }
    })
}
}
]
}
})