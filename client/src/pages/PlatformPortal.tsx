import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import logoUrl from "@assets/Latest Talks Logo png[1]_1764563665460.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Upload, Save, LogOut, AlertTriangle } from "lucide-react";

interface PlatformUserInfo {
  id: string;
  platformId: string;
  platformName: string;
  email: string;
  mustChangePassword: boolean;
}

interface PortalEpisode {
  websiteEpisodeId: string;
  episodeNumber: number | null;
  title: string;
  guestName: string | null;
  totalWatchTimeSeconds: number | null;
  views: number | null;
  avgWatchTimeSeconds: number | null;
  kpi1Auto: boolean;
  kpi2Auto: boolean;
  kpi3Auto: boolean;
  isLocked: boolean;
  globalLocked: boolean;
}

interface EditedRow {
  totalWatchTimeSeconds: number | null;
  views: number | null;
  avgWatchTimeSeconds: number | null;
  kpi1Auto: boolean;
  kpi2Auto: boolean;
  kpi3Auto: boolean;
}

interface CsvRow {
  episodeNumber?: string;
  title?: string;
  totalWatchTime?: string;
  views?: string;
  avgWatchTime?: string;
  [key: string]: string | undefined;
}

interface MappedCsvRow {
  websiteEpisodeId: string;
  episodeNumber: number | null;
  title: string;
  totalWatchTimeSeconds: number | null;
  views: number | null;
  avgWatchTimeSeconds: number | null;
  matched: boolean;
  csvRowIndex: number;
}

function formatTime(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function parseTime(timeStr: string): number | null {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function autoCalculate(row: EditedRow): EditedRow {
  const { totalWatchTimeSeconds: kpi1, views: kpi2, avgWatchTimeSeconds: kpi3 } = row;
  const updated = { ...row };

  const has1 = kpi1 !== null && kpi1 !== undefined;
  const has2 = kpi2 !== null && kpi2 !== undefined;
  const has3 = kpi3 !== null && kpi3 !== undefined;

  if (has1 && has2 && !has3) {
    if (kpi2! > 0) {
      updated.avgWatchTimeSeconds = Math.round(kpi1! / kpi2!);
      updated.kpi3Auto = true;
    }
  } else if (has1 && has3 && !has2) {
    if (kpi3! > 0) {
      updated.views = Math.round(kpi1! / kpi3!);
      updated.kpi2Auto = true;
    }
  } else if (has2 && has3 && !has1) {
    updated.totalWatchTimeSeconds = Math.round(kpi2! * kpi3!);
    updated.kpi1Auto = true;
  }

  return updated;
}

export default function PlatformPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editedRows, setEditedRows] = useState<Record<string, EditedRow>>({});
  const [modifiedRowIds, setModifiedRowIds] = useState<Set<string>>(new Set());
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [mappedCsvRows, setMappedCsvRows] = useState<MappedCsvRow[]>([]);
  const [warningDialog, setWarningDialog] = useState<{ open: boolean; warnings: string[]; pendingData: any[] }>({
    open: false,
    warnings: [],
    pendingData: [],
  });

  const { data: platformUser, isLoading: userLoading } = useQuery<PlatformUserInfo | null>({
    queryKey: ["/api/platform-auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/platform-auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (userLoading) return;
    if (!platformUser) {
      setLocation("/platform/login");
      return;
    }
    if (platformUser.mustChangePassword) {
      setLocation("/platform/change-password");
    }
  }, [platformUser, userLoading, setLocation]);

  const { data: episodes = [], isLoading: episodesLoading } = useQuery<PortalEpisode[]>({
    queryKey: ["/api/platform-portal/episodes"],
    enabled: !!platformUser && !platformUser.mustChangePassword,
  });

  useEffect(() => {
    if (episodes.length > 0 && Object.keys(editedRows).length === 0) {
      const initial: Record<string, EditedRow> = {};
      for (const ep of episodes) {
        initial[ep.websiteEpisodeId] = {
          totalWatchTimeSeconds: ep.totalWatchTimeSeconds,
          views: ep.views,
          avgWatchTimeSeconds: ep.avgWatchTimeSeconds,
          kpi1Auto: ep.kpi1Auto,
          kpi2Auto: ep.kpi2Auto,
          kpi3Auto: ep.kpi3Auto,
        };
      }
      setEditedRows(initial);
    }
  }, [episodes]);

  const updateKpi = useCallback((episodeId: string, field: keyof EditedRow, value: number | null) => {
    setEditedRows(prev => {
      const current = prev[episodeId] || {
        totalWatchTimeSeconds: null,
        views: null,
        avgWatchTimeSeconds: null,
        kpi1Auto: false,
        kpi2Auto: false,
        kpi3Auto: false,
      };

      const updated = { ...current, [field]: value };

      if (field === "totalWatchTimeSeconds") updated.kpi1Auto = false;
      if (field === "views") updated.kpi2Auto = false;
      if (field === "avgWatchTimeSeconds") updated.kpi3Auto = false;

      const calculated = autoCalculate(updated);
      return { ...prev, [episodeId]: calculated };
    });

    setModifiedRowIds(prev => new Set(prev).add(episodeId));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (rows: { websiteEpisodeId: string; totalWatchTimeSeconds: number | null; views: number | null; avgWatchTimeSeconds: number | null }[]) => {
      const results = [];
      for (const row of rows) {
        const res = await apiRequest("POST", "/api/platform-portal/kpis", row);
        const data = await res.json();
        results.push(data);
      }
      return results;
    },
    onSuccess: (results) => {
      const warnings = results.flatMap((r: any) => r.warnings || []);
      if (warnings.length > 0) {
        setWarningDialog({ open: true, warnings, pendingData: [] });
      } else {
        toast({ title: "Saved", description: "KPI data has been saved successfully." });
        setModifiedRowIds(new Set());
        queryClient.invalidateQueries({ queryKey: ["/api/platform-portal/episodes"] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    const rows = Array.from(modifiedRowIds).map(id => {
      const row = editedRows[id];
      return {
        websiteEpisodeId: id,
        totalWatchTimeSeconds: row?.totalWatchTimeSeconds ?? null,
        views: row?.views ?? null,
        avgWatchTimeSeconds: row?.avgWatchTimeSeconds ?? null,
      };
    });
    if (rows.length === 0) {
      toast({ title: "No changes", description: "No rows have been modified." });
      return;
    }
    saveMutation.mutate(rows);
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/platform-auth/logout");
    } catch {}
    setLocation("/platform/login");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === "xlsx") {
      toast({ title: "XLSX Support Coming Soon", description: "Please use CSV format for now." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (ext !== "csv") {
      toast({ title: "Unsupported File", description: "Please upload a .csv file.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mapped = matchCsvToEpisodes(results.data);
        setMappedCsvRows(mapped);
        setCsvDialogOpen(true);
      },
      error: () => {
        toast({ title: "Parse Error", description: "Failed to parse CSV file.", variant: "destructive" });
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const matchCsvToEpisodes = (csvData: CsvRow[]): MappedCsvRow[] => {
    return csvData.map((row, index) => {
      const epNum = row["Episode"] || row["Episode #"] || row["episodeNumber"] || row["episode_number"] || "";
      const title = row["Title"] || row["title"] || "";
      const twt = row["Total Watch Time"] || row["totalWatchTime"] || row["total_watch_time"] || "";
      const views = row["Views"] || row["views"] || "";
      const awt = row["Avg Watch Time"] || row["avgWatchTime"] || row["avg_watch_time"] || "";

      const epNumber = epNum ? parseInt(epNum, 10) : null;

      let matchedEpisode: PortalEpisode | undefined;
      if (epNumber) {
        matchedEpisode = episodes.find(e => e.episodeNumber === epNumber);
      }
      if (!matchedEpisode && title) {
        matchedEpisode = episodes.find(e => e.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(e.title.toLowerCase()));
      }

      const parsedTwt = twt.includes(':') ? parseTime(twt) : (twt ? parseInt(twt, 10) : null);
      const parsedViews = views ? parseInt(views, 10) : null;
      const parsedAwt = awt.includes(':') ? parseTime(awt) : (awt ? parseInt(awt, 10) : null);

      return {
        websiteEpisodeId: matchedEpisode?.websiteEpisodeId || "",
        episodeNumber: matchedEpisode?.episodeNumber ?? epNumber,
        title: matchedEpisode?.title || title,
        totalWatchTimeSeconds: isNaN(parsedTwt as number) ? null : parsedTwt,
        views: isNaN(parsedViews as number) ? null : parsedViews,
        avgWatchTimeSeconds: isNaN(parsedAwt as number) ? null : parsedAwt,
        matched: !!matchedEpisode,
        csvRowIndex: index,
      };
    });
  };

  const handleImportCsv = () => {
    const matched = mappedCsvRows.filter(r => r.matched);
    if (matched.length === 0) {
      toast({ title: "No matches", description: "No CSV rows matched any episodes.", variant: "destructive" });
      return;
    }

    const rows = matched.map(r => ({
      websiteEpisodeId: r.websiteEpisodeId,
      totalWatchTimeSeconds: r.totalWatchTimeSeconds,
      views: r.views,
      avgWatchTimeSeconds: r.avgWatchTimeSeconds,
    }));

    saveMutation.mutate(rows);
    setCsvDialogOpen(false);
  };

  if (userLoading || !platformUser) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-portal">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isLocked = (ep: PortalEpisode) => ep.isLocked || ep.globalLocked;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <img src={logoUrl} alt="Latest Talks" className="h-8" data-testid="img-portal-logo" />
            <Badge variant="secondary" data-testid="badge-platform-name">{platformUser.platformName}</Badge>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Episode KPIs</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileUpload}
              data-testid="input-file-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
            <Button
              onClick={handleSave}
              disabled={modifiedRowIds.size === 0 || saveMutation.isPending}
              data-testid="button-save-changes"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {episodesLoading ? (
          <div className="flex items-center justify-center py-12" data-testid="loading-episodes">
            <p className="text-muted-foreground">Loading episodes...</p>
          </div>
        ) : episodes.length === 0 ? (
          <div className="flex items-center justify-center py-12" data-testid="text-no-episodes">
            <p className="text-muted-foreground">No episodes found.</p>
          </div>
        ) : (
          <div className="border rounded-md overflow-auto">
            <Table data-testid="table-episodes">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 px-2">Ep #</TableHead>
                  <TableHead className="px-2">Title</TableHead>
                  <TableHead className="px-2">Guest</TableHead>
                  <TableHead className="px-2 w-40">Total Watch Time</TableHead>
                  <TableHead className="px-2 w-28">Views</TableHead>
                  <TableHead className="px-2 w-40">Avg Watch Time</TableHead>
                  <TableHead className="w-10 px-2"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes.map((ep) => {
                  const row = editedRows[ep.websiteEpisodeId];
                  const locked = isLocked(ep);
                  const modified = modifiedRowIds.has(ep.websiteEpisodeId);

                  return (
                    <TableRow
                      key={ep.websiteEpisodeId}
                      className={modified ? "bg-accent/30" : ""}
                      data-testid={`row-episode-${ep.websiteEpisodeId}`}
                    >
                      <TableCell className="px-2 font-mono text-sm" data-testid={`text-episode-number-${ep.websiteEpisodeId}`}>
                        {ep.episodeNumber ?? "—"}
                      </TableCell>
                      <TableCell className="px-2 text-sm font-medium" data-testid={`text-episode-title-${ep.websiteEpisodeId}`}>
                        {ep.title}
                      </TableCell>
                      <TableCell className="px-2 text-sm text-muted-foreground" data-testid={`text-episode-guest-${ep.websiteEpisodeId}`}>
                        {ep.guestName ?? "—"}
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          value={row ? formatTime(row.totalWatchTimeSeconds) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = parseTime(val);
                            if (parsed !== null) {
                              updateKpi(ep.websiteEpisodeId, "totalWatchTimeSeconds", parsed);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              updateKpi(ep.websiteEpisodeId, "totalWatchTimeSeconds", null);
                            }
                          }}
                          placeholder="HH:MM:SS"
                          disabled={locked}
                          className={`font-mono text-sm ${locked ? "opacity-50" : ""} ${row?.kpi1Auto ? "italic text-muted-foreground" : ""}`}
                          data-testid={`input-kpi1-${ep.websiteEpisodeId}`}
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          type="number"
                          value={row?.views ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateKpi(ep.websiteEpisodeId, "views", val === "" ? null : parseInt(val, 10));
                          }}
                          placeholder="Views"
                          disabled={locked}
                          className={`font-mono text-sm ${locked ? "opacity-50" : ""} ${row?.kpi2Auto ? "italic text-muted-foreground" : ""}`}
                          data-testid={`input-kpi2-${ep.websiteEpisodeId}`}
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        <Input
                          value={row ? formatTime(row.avgWatchTimeSeconds) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = parseTime(val);
                            if (parsed !== null) {
                              updateKpi(ep.websiteEpisodeId, "avgWatchTimeSeconds", parsed);
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              updateKpi(ep.websiteEpisodeId, "avgWatchTimeSeconds", null);
                            }
                          }}
                          placeholder="HH:MM:SS"
                          disabled={locked}
                          className={`font-mono text-sm ${locked ? "opacity-50" : ""} ${row?.kpi3Auto ? "italic text-muted-foreground" : ""}`}
                          data-testid={`input-kpi3-${ep.websiteEpisodeId}`}
                        />
                      </TableCell>
                      <TableCell className="px-2">
                        {locked && (
                          <Lock className="w-4 h-4 text-muted-foreground" data-testid={`icon-lock-${ep.websiteEpisodeId}`} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <footer className="border-t px-4 py-3 flex items-center justify-center gap-4 flex-wrap text-sm text-muted-foreground">
        <a href="mailto:Hello@LatestTalks.com" className="underline" data-testid="link-contact-support">
          Contact Support
        </a>
        <span>·</span>
        <a href="mailto:Hello@LatestTalks.com?subject=Bug%20Report" className="underline" data-testid="link-bug-report">
          Report a Bug
        </a>
      </footer>

      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review matched episodes before importing. Unmatched rows will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-auto">
            <Table data-testid="table-csv-preview">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2">Status</TableHead>
                  <TableHead className="px-2">Ep #</TableHead>
                  <TableHead className="px-2">Title</TableHead>
                  <TableHead className="px-2">Total Watch Time</TableHead>
                  <TableHead className="px-2">Views</TableHead>
                  <TableHead className="px-2">Avg Watch Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedCsvRows.map((row, i) => (
                  <TableRow key={i} className={row.matched ? "" : "opacity-50"} data-testid={`row-csv-${i}`}>
                    <TableCell className="px-2">
                      {row.matched ? (
                        <Badge variant="secondary" data-testid={`badge-matched-${i}`}>Matched</Badge>
                      ) : (
                        <Badge variant="outline" data-testid={`badge-unmatched-${i}`}>No Match</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-2 font-mono text-sm">{row.episodeNumber ?? "—"}</TableCell>
                    <TableCell className="px-2 text-sm">{row.title}</TableCell>
                    <TableCell className="px-2 font-mono text-sm">{formatTime(row.totalWatchTimeSeconds)}</TableCell>
                    <TableCell className="px-2 font-mono text-sm">{row.views ?? "—"}</TableCell>
                    <TableCell className="px-2 font-mono text-sm">{formatTime(row.avgWatchTimeSeconds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)} data-testid="button-cancel-import">
              Cancel
            </Button>
            <Button onClick={handleImportCsv} disabled={saveMutation.isPending} data-testid="button-confirm-import">
              {saveMutation.isPending ? "Importing..." : `Import ${mappedCsvRows.filter(r => r.matched).length} Rows`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warningDialog.open} onOpenChange={(open) => setWarningDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Warnings
            </DialogTitle>
            <DialogDescription>
              The following warnings were returned. Your changes have been saved.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 space-y-1 text-sm" data-testid="list-warnings">
            {warningDialog.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              onClick={() => {
                setWarningDialog({ open: false, warnings: [], pendingData: [] });
                setModifiedRowIds(new Set());
                queryClient.invalidateQueries({ queryKey: ["/api/platform-portal/episodes"] });
              }}
              data-testid="button-acknowledge-warnings"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
