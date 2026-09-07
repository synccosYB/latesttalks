import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plane, Upload, Camera, CheckCircle, Search, Loader2, Video, X, MapPin, Calendar, User, Tv, Heart, ExternalLink, Smartphone, Plus, Play } from "lucide-react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import elAlLogo from "@assets/image_1764475161415.png";
import unitedLogo from "@assets/image_1764955422755.png";
import latestTalksPlayIcon from "@assets/Latest_Talks_Video_Icon_1764884292670.png";
import latestTalksOutlineIcon from "@assets/Latest_Talks_Video_Icon_-_Full_Color_Outline[1]_1764897446102.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { CommunityPhoto, Episode } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const AIRLINES = [
  { value: "elal", label: "El Al Israel Airlines", code: "LY", color: "#003366" },
  { value: "united", label: "United Airlines", code: "UA", color: "#0033A0" },
  { value: "delta", label: "Delta Air Lines", code: "DL", color: "#C01933" },
  { value: "american", label: "American Airlines", code: "AA", color: "#0078D2" },
  { value: "lufthansa", label: "Lufthansa", code: "LH", color: "#05164D" },
  { value: "british", label: "British Airways", code: "BA", color: "#075AAA" },
  { value: "emirates", label: "Emirates", code: "EK", color: "#D71920" },
  { value: "turkish", label: "Turkish Airlines", code: "TK", color: "#C70A0C" },
  { value: "swiss", label: "Swiss International", code: "LX", color: "#E2001A" },
  { value: "austrian", label: "Austrian Airlines", code: "OS", color: "#E20A17" },
  { value: "other", label: "Other Airline", code: "", color: "#666666" },
];

// Common routes for quick selection when API lookup fails
const COMMON_ROUTES: Record<string, string[]> = {
  elal: [
    // USA to TLV
    "JFK → TLV", "TLV → JFK", 
    "EWR → TLV", "TLV → EWR",
    "LAX → TLV", "TLV → LAX",
    "MIA → TLV", "TLV → MIA",
    "BOS → TLV", "TLV → BOS",
    // Europe to TLV
    "LHR → TLV", "TLV → LHR",
    "CDG → TLV", "TLV → CDG",
  ],
  united: [
    // USA to TLV
    "EWR → TLV", "TLV → EWR",
    // USA to Europe
    "JFK → LHR", "LHR → JFK",
    "EWR → LHR", "LHR → EWR",
    "EWR → FRA", "FRA → EWR",
    "SFO → LHR", "LHR → SFO",
    "ORD → LHR", "LHR → ORD",
    "LAX → LHR", "LHR → LAX",
    "IAD → LHR", "LHR → IAD",
    "BOS → LHR", "LHR → BOS",
    // Europe to TLV
    "FRA → TLV", "TLV → FRA",
  ],
  delta: [
    // USA to TLV
    "JFK → TLV", "TLV → JFK",
    // USA to Europe
    "JFK → LHR", "LHR → JFK",
    "JFK → CDG", "CDG → JFK",
    "JFK → AMS", "AMS → JFK",
    "ATL → LHR", "LHR → ATL",
    "ATL → CDG", "CDG → ATL",
    "ATL → AMS", "AMS → ATL",
    "LAX → LHR", "LHR → LAX",
    "LAX → CDG", "CDG → LAX",
    "BOS → LHR", "LHR → BOS",
    // Europe to TLV
    "CDG → TLV", "TLV → CDG",
    "AMS → TLV", "TLV → AMS",
  ],
  american: [
    // USA to TLV
    "JFK → TLV", "TLV → JFK",
    // USA to Europe
    "JFK → LHR", "LHR → JFK",
    "JFK → CDG", "CDG → JFK",
    "MIA → LHR", "LHR → MIA",
    "MIA → CDG", "CDG → MIA",
    "DFW → LHR", "LHR → DFW",
    "LAX → LHR", "LHR → LAX",
    "ORD → LHR", "LHR → ORD",
    "PHL → LHR", "LHR → PHL",
    // Europe to TLV
    "LHR → TLV", "TLV → LHR",
  ],
  lufthansa: [
    // USA to Germany
    "JFK → FRA", "FRA → JFK",
    "EWR → FRA", "FRA → EWR",
    "JFK → MUC", "MUC → JFK",
    "LAX → FRA", "FRA → LAX",
    "ORD → FRA", "FRA → ORD",
    "MIA → FRA", "FRA → MIA",
    "SFO → FRA", "FRA → SFO",
    "BOS → FRA", "FRA → BOS",
    "IAD → FRA", "FRA → IAD",
    // Germany to TLV
    "FRA → TLV", "TLV → FRA",
    "MUC → TLV", "TLV → MUC",
  ],
  british: [
    // USA to UK
    "JFK → LHR", "LHR → JFK",
    "LAX → LHR", "LHR → LAX",
    "MIA → LHR", "LHR → MIA",
    "SFO → LHR", "LHR → SFO",
    "ORD → LHR", "LHR → ORD",
    "BOS → LHR", "LHR → BOS",
    "IAD → LHR", "LHR → IAD",
    "DEN → LHR", "LHR → DEN",
    "JFK → LGW", "LGW → JFK",
    "LAX → LGW", "LGW → LAX",
    "MIA → LGW", "LGW → MIA",
    // UK to TLV
    "LHR → TLV", "TLV → LHR",
  ],
  emirates: [
    // USA to Dubai
    "JFK → DXB", "DXB → JFK",
    "LAX → DXB", "DXB → LAX",
    "SFO → DXB", "DXB → SFO",
    "ORD → DXB", "DXB → ORD",
    "BOS → DXB", "DXB → BOS",
    "IAD → DXB", "DXB → IAD",
    "MIA → DXB", "DXB → MIA",
    "DFW → DXB", "DXB → DFW",
    // Dubai to TLV
    "DXB → TLV", "TLV → DXB",
  ],
  turkish: [
    // USA to Istanbul
    "JFK → IST", "IST → JFK",
    "LAX → IST", "IST → LAX",
    "MIA → IST", "IST → MIA",
    "ORD → IST", "IST → ORD",
    "SFO → IST", "IST → SFO",
    "IAD → IST", "IST → IAD",
    "BOS → IST", "IST → BOS",
    "ATL → IST", "IST → ATL",
    // Istanbul to TLV
    "IST → TLV", "TLV → IST",
  ],
  swiss: [
    // USA to Zurich
    "JFK → ZRH", "ZRH → JFK",
    "EWR → ZRH", "ZRH → EWR",
    "LAX → ZRH", "ZRH → LAX",
    "MIA → ZRH", "ZRH → MIA",
    "SFO → ZRH", "ZRH → SFO",
    "ORD → ZRH", "ZRH → ORD",
    "BOS → ZRH", "ZRH → BOS",
    // Zurich to TLV
    "ZRH → TLV", "TLV → ZRH",
  ],
  austrian: [
    // USA to Vienna
    "JFK → VIE", "VIE → JFK",
    "EWR → VIE", "VIE → EWR",
    "ORD → VIE", "VIE → ORD",
    "LAX → VIE", "VIE → LAX",
    "MIA → VIE", "VIE → MIA",
    "IAD → VIE", "VIE → IAD",
    // Vienna to TLV
    "VIE → TLV", "TLV → VIE",
  ],
  other: [
    // Common USA to TLV
    "JFK → TLV", "TLV → JFK",
    "EWR → TLV", "TLV → EWR",
    "LAX → TLV", "TLV → LAX",
    "MIA → TLV", "TLV → MIA",
    // Common USA to Europe
    "JFK → LHR", "LHR → JFK",
    "JFK → CDG", "CDG → JFK",
    "LAX → LHR", "LHR → LAX",
    // Europe to TLV
    "LHR → TLV", "TLV → LHR",
    "CDG → TLV", "TLV → CDG",
  ],
};

function AirlineLogo({ airline, className = "" }: { airline: string; className?: string }) {
  const airlineData = AIRLINES.find(a => a.value === airline);
  
  const airlineLogos: Record<string, string> = {
    elal: elAlLogo,
    united: unitedLogo,
  };

  const logoSrc = airlineLogos[airline];
  
  if (logoSrc) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img src={logoSrc} alt={airlineData?.label || airline} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  const airlineStyles: Record<string, { text: string; bg: string; textColor: string; fontStyle?: string }> = {
    delta: { text: "DELTA", bg: "#C01933", textColor: "white", fontStyle: "font-bold tracking-wider" },
    american: { text: "American", bg: "#0078D2", textColor: "white", fontStyle: "font-semibold italic" },
    lufthansa: { text: "Lufthansa", bg: "#05164D", textColor: "#FFD700", fontStyle: "font-bold" },
    british: { text: "British Airways", bg: "#075AAA", textColor: "white", fontStyle: "font-semibold text-[8px]" },
    emirates: { text: "Emirates", bg: "#D71920", textColor: "white", fontStyle: "font-bold" },
    turkish: { text: "Turkish", bg: "#C70A0C", textColor: "white", fontStyle: "font-bold" },
    swiss: { text: "SWISS", bg: "#E2001A", textColor: "white", fontStyle: "font-bold tracking-widest" },
    austrian: { text: "Austrian", bg: "#E20A17", textColor: "white", fontStyle: "font-semibold" },
    other: { text: "Other", bg: "#666666", textColor: "white", fontStyle: "font-medium" },
  };

  const style = airlineStyles[airline] || airlineStyles.other;
  
  return (
    <div 
      className={`flex items-center justify-center rounded ${style.fontStyle || ''} ${className}`}
      style={{ 
        backgroundColor: style.bg, 
        color: style.textColor,
        fontSize: airline === "british" ? "8px" : "11px",
        lineHeight: 1.2,
      }}
    >
      {style.text}
    </div>
  );
}

export default function OnElAlPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
  const [uploadedThumbnailPath, setUploadedThumbnailPath] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [mediaType, setMediaType] = useState<"photo" | "video">("photo");
  const [airlineFilter, setAirlineFilter] = useState<string>("all");
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<string[]>([]);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [isEpisodeDropdownOpen, setIsEpisodeDropdownOpen] = useState(false);
  const [airlineSearch, setAirlineSearch] = useState("");
  const [isAirlineDropdownOpen, setIsAirlineDropdownOpen] = useState(false);
  const [customAirline, setCustomAirline] = useState("");
  const [formData, setFormData] = useState({
    imageUrl: "",
    videoUrl: "",
    videoThumbnailUrl: "",
    caption: "",
    submitterName: "",
    submitterEmail: "",
    submitterPhone: "",
    airline: "",
    flightNumber: "",
    route: "",
    flightDate: "",
    episodeId: "",
    episodeWatched: "",
    enjoyedMost: "",
  });

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const generateVideoThumbnail = (videoUrl: string): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      video.playsInline = true;
      
      const timeoutId = setTimeout(() => {
        console.log("Thumbnail generation timed out");
        video.src = "";
        resolve(null);
      }, 10000);
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };
      
      video.onseeked = () => {
        clearTimeout(timeoutId);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              video.src = "";
              resolve(blob);
            },
            "image/jpeg",
            0.8
          );
        } else {
          video.src = "";
          resolve(null);
        }
      };
      
      video.onerror = () => {
        clearTimeout(timeoutId);
        console.log("Could not generate thumbnail - video format issue");
        video.src = "";
        resolve(null);
      };
      
      video.src = videoUrl;
      video.load();
    });
  };

  const uploadThumbnail = async (thumbnailBlob: Blob): Promise<string | null> => {
    try {
      const uploadParams = await handleGetUploadParameters();
      await fetch(uploadParams.url, {
        method: "PUT",
        body: thumbnailBlob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });
      
      const response = await apiRequest("PUT", "/api/community-photos/upload", {
        imageURL: uploadParams.url,
      });
      const data = await response.json();
      return data.objectPath;
    } catch (error) {
      console.error("Failed to upload thumbnail:", error);
      return null;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.uploadURL;
      const fileName = uploadedFile.name || "";
      
      // Get the original file data (blob) from the Uppy result
      const fileData = uploadedFile.data as Blob | undefined;
      
      // Auto-detect media type from file extension or MIME type
      const isVideo = fileName.match(/\.(mp4|mov|avi|webm|mkv)$/i) || 
                      (uploadedFile.type && uploadedFile.type.startsWith("video/"));
      
      if (uploadURL) {
        try {
          // For videos, generate thumbnail from the local file blob before uploading
          let thumbnailBlob: Blob | null = null;
          if (isVideo && fileData) {
            setMediaType("video");
            setIsGeneratingThumbnail(true);
            try {
              // Create a local object URL from the original file blob
              const localVideoUrl = URL.createObjectURL(fileData);
              thumbnailBlob = await generateVideoThumbnail(localVideoUrl);
              // Clean up the object URL after use
              URL.revokeObjectURL(localVideoUrl);
            } catch (thumbError) {
              console.log("Thumbnail generation failed, continuing without thumbnail");
            }
          }
          
          // Now register the main file with permanent storage
          const response = await apiRequest("PUT", "/api/community-photos/upload", {
            imageURL: uploadURL,
          });
          const data = await response.json();
          
          if (isVideo) {
            setUploadedVideoPath(data.objectPath);
            setFormData(prev => ({ ...prev, videoUrl: data.objectPath }));
            
            // Upload the thumbnail if we generated one
            if (thumbnailBlob) {
              try {
                const thumbnailPath = await uploadThumbnail(thumbnailBlob);
                if (thumbnailPath) {
                  setUploadedThumbnailPath(thumbnailPath);
                  setFormData(prev => ({ ...prev, videoThumbnailUrl: thumbnailPath }));
                }
              } catch (thumbUploadError) {
                console.log("Thumbnail upload failed, continuing without thumbnail");
              }
            }
            setIsGeneratingThumbnail(false);
          } else {
            setUploadedImagePath(data.objectPath);
            setFormData(prev => ({ ...prev, imageUrl: data.objectPath }));
            setMediaType("photo");
          }
          toast({
            title: isVideo ? "Video uploaded!" : "Photo uploaded!",
            description: "Now fill in the details below to complete your submission.",
          });
        } catch {
          setIsGeneratingThumbnail(false);
          toast({
            title: "Error",
            description: "Failed to process uploaded file.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const { data: photos, isLoading } = useQuery<CommunityPhoto[]>({
    queryKey: ["/api/community-photos?status=approved"],
  });

  // Fetch published episodes for the dropdown
  const { data: episodes } = useQuery<Episode[]>({
    queryKey: ["/api/episodes?status=published"],
  });

  // Flight route lookup mutation
  const flightLookupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/flight-lookup", {
        airline: formData.airline,
        flightNumber: formData.flightNumber,
        flightDate: formData.flightDate,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.route) {
        setFormData(prev => ({ ...prev, route: data.route }));
        toast({
          title: "Route found!",
          description: `${data.route}`,
        });
      }
    },
    onError: (error: Error) => {
      // Silently fail - user can enter route manually
    },
  });

  // Auto-lookup flight route when flight number changes
  const lookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Clear previous timeout
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }
    
    // Only lookup if flight number is at least 4 characters and no route yet
    if (formData.flightNumber && formData.flightNumber.length >= 4 && !formData.route) {
      lookupTimeoutRef.current = setTimeout(() => {
        flightLookupMutation.mutate();
      }, 500); // Debounce 500ms
    }
    
    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
      }
    };
  }, [formData.flightNumber]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Build episodeWatched text from all selected episodes
      const episodeWatchedList = selectedEpisodeIds.map(id => {
        const ep = episodes?.find(e => e.id === id);
        if (!ep) return "";
        const epNum = ep.episodeNumber ? `Episode ${ep.episodeNumber}` : "Episode";
        const guest = ep.guestName || "";
        return guest ? `${epNum} - ${guest}` : epNum;
      }).filter(Boolean).join(", ");
      
      const submitData = {
        ...formData,
        // If "other" is selected, use the custom airline name
        airline: formData.airline === "other" && customAirline ? customAirline : formData.airline,
        mediaType,
        isAnonymous,
        episodeId: selectedEpisodeIds[0] || null, // First episode for legacy compatibility
        episodeIds: selectedEpisodeIds.length > 0 ? selectedEpisodeIds : null,
        episodeWatched: episodeWatchedList || null,
      };
      return apiRequest("POST", "/api/community-photos", submitData);
    },
    onSuccess: () => {
      toast({
        title: mediaType === "video" ? "Video submitted!" : "Photo submitted!",
        description: "Your submission will appear after approval. Thank you for sharing!",
      });
      setFormData({
        imageUrl: "",
        videoUrl: "",
        videoThumbnailUrl: "",
        caption: "",
        submitterName: "",
        submitterEmail: "",
        submitterPhone: "",
        airline: "",
        flightNumber: "",
        route: "",
        flightDate: "",
        episodeId: "",
        episodeWatched: "",
        enjoyedMost: "",
      });
      setSelectedEpisodeIds([]);
      setUploadedImagePath(null);
      setUploadedVideoPath(null);
      setUploadedThumbnailPath(null);
      setIsAnonymous(false);
      setMediaType("photo");
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community-photos"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl && !formData.videoUrl) {
      toast({
        title: "Error",
        description: "Please upload a photo or video first",
        variant: "destructive",
      });
      return;
    }
    // Validate phone number if provided
    if (formData.submitterPhone && !isValidPhoneNumber(formData.submitterPhone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }
    // Validate airline selection
    if (!formData.airline) {
      toast({
        title: "Airline Required",
        description: "Please select which airline you were flying on",
        variant: "destructive",
      });
      return;
    }
    // Validate custom airline name if "Other" is selected
    if (formData.airline === "other" && !customAirline.trim()) {
      toast({
        title: "Airline Name Required",
        description: "Please enter the airline name",
        variant: "destructive",
      });
      return;
    }
    // For videos without a thumbnail, use a placeholder
    if (mediaType === "video" && !formData.imageUrl) {
      setFormData(prev => ({ ...prev, imageUrl: formData.videoUrl }));
    }
    submitMutation.mutate();
  };

  const getAirlineLabel = (value: string) => {
    const airline = AIRLINES.find(a => a.value === value);
    return airline?.label || value;
  };

  const resetForm = () => {
    setFormData({
      imageUrl: "",
      videoUrl: "",
      videoThumbnailUrl: "",
      caption: "",
      submitterName: "",
      submitterEmail: "",
      submitterPhone: "",
      airline: "",
      flightNumber: "",
      route: "",
      flightDate: "",
      episodeId: "",
      episodeWatched: "",
      enjoyedMost: "",
    });
    setSelectedEpisodeIds([]);
    setUploadedImagePath(null);
    setUploadedVideoPath(null);
    setUploadedThumbnailPath(null);
    setIsAnonymous(false);
    setMediaType("photo");
    setIsDialogOpen(false);
    setEpisodeSearch("");
    setIsEpisodeDropdownOpen(false);
    setIsPhoneFocused(false);
    setAirlineSearch("");
    setIsAirlineDropdownOpen(false);
    setCustomAirline("");
  };

  // Add episode to selection
  const addEpisode = (episodeId: string) => {
    if (!selectedEpisodeIds.includes(episodeId)) {
      setSelectedEpisodeIds([...selectedEpisodeIds, episodeId]);
    }
  };

  // Remove episode from selection
  const removeEpisode = (episodeId: string) => {
    setSelectedEpisodeIds(selectedEpisodeIds.filter(id => id !== episodeId));
  };

  // Helper to get episode by ID
  const getEpisodeById = (episodeId: string | null | undefined) => {
    if (!episodeId || !episodes) return null;
    return episodes.find(ep => ep.id === episodeId);
  };

  // Format episode display as "Episode X - Guest Name"
  const formatEpisodeDisplay = (episodeId: string | null | undefined) => {
    const episode = getEpisodeById(episodeId);
    if (!episode) return "Watch Episode";
    const epNum = episode.episodeNumber ? `Episode ${episode.episodeNumber}` : "Episode";
    const guest = episode.guestName || "";
    return guest ? `${epNum} - ${guest}` : epNum;
  };

  // Track episode view when clicking episode link
  const trackEpisodeView = (episodeId: string) => {
    apiRequest("POST", `/api/episodes/${episodeId}/view`, { country: "In-Flight" }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <Header />

      <main className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4" data-testid="text-page-title">
              Latest Talks In-Flight Entertainment
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're proud to be featured on airline in-flight entertainment systems worldwide! 
              Share your experience watching Latest Talks at 30,000 feet.
            </p>
          </div>

          {/* Compact Upload Strip */}
          <div className="flex justify-center mb-10">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center gap-6 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Share Your In-Flight Experience</p>
                  <p className="text-xs text-muted-foreground">Upload a photo or video of you watching Latest Talks</p>
                </div>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} data-testid="button-open-upload">
                <Plus className="h-4 w-4 mr-2" />
                Share Photo/Video
              </Button>
            </div>
          </div>

          {/* Upload Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(open); }}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:top-[55%]" onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Share Your In-Flight Experience
                </DialogTitle>
                <DialogDescription>
                  Upload a photo or video and tell us about your flight
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Upload Area / Preview */}
                {(uploadedImagePath || uploadedVideoPath) ? (
                  <div className="relative rounded-lg overflow-hidden border bg-muted">
                    {mediaType === "video" && uploadedVideoPath ? (
                      <>
                        <video 
                          src={uploadedVideoPath}
                          controls
                          className="w-full h-40 object-contain bg-black"
                          poster={uploadedThumbnailPath || undefined}
                        />
                        {uploadedThumbnailPath && (
                          <div className="absolute bottom-2 left-2">
                            <div className="bg-black/70 rounded overflow-hidden flex items-center">
                              <img 
                                src={uploadedThumbnailPath} 
                                alt="Video thumbnail" 
                                className="h-10 w-auto object-cover"
                              />
                              <span className="text-white text-[10px] px-1.5">Thumbnail</span>
                            </div>
                          </div>
                        )}
                        {isGeneratingThumbnail && (
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Generating thumbnail...
                          </div>
                        )}
                      </>
                    ) : uploadedImagePath ? (
                      <img 
                        src={uploadedImagePath} 
                        alt="Uploaded preview" 
                        className="w-full h-40 object-cover"
                      />
                    ) : null}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {mediaType === "video" ? "Video" : "Photo"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 text-xs"
                        onClick={() => {
                          setUploadedImagePath(null);
                          setUploadedVideoPath(null);
                          setUploadedThumbnailPath(null);
                          setFormData(prev => ({ ...prev, imageUrl: "", videoUrl: "", videoThumbnailUrl: "" }));
                          setMediaType("photo");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-4 bg-muted/30 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Photos up to 10MB • Videos up to 50MB
                    </p>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={52428800}
                      allowedFileTypes={["image/*", "video/*"]}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                    >
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Choose File
                      </div>
                    </ObjectUploader>
                  </div>
                )}

                {/* Flight Details */}
                <div className="space-y-3">
                  {/* Airline Selection - Searchable Input */}
                  <div className="relative">
                    <div className="relative">
                      <Input
                        value={formData.airline ? AIRLINES.find(a => a.value === formData.airline)?.label || airlineSearch : airlineSearch}
                        onChange={(e) => {
                          setAirlineSearch(e.target.value);
                          setIsAirlineDropdownOpen(true);
                          if (!e.target.value) {
                            setFormData({ ...formData, airline: "" });
                          }
                        }}
                        onFocus={() => {
                          setIsAirlineDropdownOpen(true);
                          if (formData.airline) {
                            setAirlineSearch("");
                          }
                        }}
                        onBlur={() => setTimeout(() => setIsAirlineDropdownOpen(false), 200)}
                        placeholder="Select airline"
                        data-testid="input-airline-search"
                      />
                    </div>
                    
                    {/* Dropdown Results */}
                    {isAirlineDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {AIRLINES
                          .filter(airline => {
                            if (!airlineSearch) return true;
                            const searchText = airlineSearch.toLowerCase();
                            return (
                              airline.label.toLowerCase().includes(searchText) ||
                              airline.code.toLowerCase().includes(searchText) ||
                              airline.value.toLowerCase().includes(searchText)
                            );
                          })
                          .map((airline) => (
                            <button
                              key={airline.value}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${formData.airline === airline.value ? 'bg-accent' : ''}`}
                              onClick={() => {
                                setFormData({ ...formData, airline: airline.value });
                                setAirlineSearch("");
                                setIsAirlineDropdownOpen(false);
                              }}
                              data-testid={`airline-option-${airline.value}`}
                            >
                              {airline.label} {airline.code && `(${airline.code})`}
                            </button>
                          ))}
                        {AIRLINES.filter(airline => {
                          if (!airlineSearch) return true;
                          const searchText = airlineSearch.toLowerCase();
                          return (
                            airline.label.toLowerCase().includes(searchText) ||
                            airline.code.toLowerCase().includes(searchText) ||
                            airline.value.toLowerCase().includes(searchText)
                          );
                        }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No airlines found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Custom Airline Input - Shows when "Other" is selected */}
                  {formData.airline === "other" && (
                    <Input
                      value={customAirline}
                      onChange={(e) => setCustomAirline(e.target.value)}
                      placeholder="Enter airline name"
                      data-testid="input-custom-airline"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={formData.flightNumber}
                      onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
                      placeholder="Flight # (e.g., LY001)"
                      data-testid="input-flight-number"
                    />
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.flightDate}
                        onChange={(e) => setFormData({ ...formData, flightDate: e.target.value })}
                        onFocus={() => setIsDateFocused(true)}
                        onBlur={() => setIsDateFocused(false)}
                        className={!formData.flightDate && !isDateFocused ? "text-transparent" : ""}
                        data-testid="input-flight-date"
                      />
                      {!formData.flightDate && !isDateFocused && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          Date
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        value={formData.route}
                        onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                        placeholder={flightLookupMutation.isPending ? "Looking up route..." : "Route (e.g., JFK → TLV)"}
                        disabled={flightLookupMutation.isPending}
                        data-testid="input-route"
                      />
                      {flightLookupMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Quick Route Selection */}
                    {formData.airline && !formData.route && COMMON_ROUTES[formData.airline] && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Quick select route:</p>
                        <div className="flex flex-wrap gap-1">
                          {COMMON_ROUTES[formData.airline].slice(0, 6).map((route) => (
                            <Button
                              key={route}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 text-xs px-2"
                              onClick={() => setFormData({ ...formData, route })}
                              data-testid={`button-route-${route.replace(/\s+/g, "-")}`}
                            >
                              {route}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Episode Selection - Multiple Episodes */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm font-medium">Which episode(s) did you watch?</Label>
                  
                  {/* Selected Episodes */}
                  {selectedEpisodeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEpisodeIds.map((epId) => {
                        const ep = getEpisodeById(epId);
                        return (
                          <Badge 
                            key={epId} 
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                          >
                            <span className="text-xs">
                              #{ep?.episodeNumber} - {ep?.guestName || ep?.title?.substring(0, 20)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 hover:bg-destructive/20"
                              onClick={() => removeEpisode(epId)}
                              data-testid={`button-remove-episode-${epId}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Episode - Searchable Input */}
                  <div className="relative">
                    <div className="relative">
                      <Input
                        value={episodeSearch}
                        onChange={(e) => {
                          setEpisodeSearch(e.target.value);
                          setIsEpisodeDropdownOpen(true);
                        }}
                        onFocus={() => setIsEpisodeDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsEpisodeDropdownOpen(false), 200)}
                        placeholder={selectedEpisodeIds.length > 0 ? "Add another episode..." : "Select episode"}
                        data-testid="input-episode-search"
                      />
                    </div>
                    
                    {/* Dropdown Results */}
                    {isEpisodeDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {episodes?.slice()
                          .filter(ep => !selectedEpisodeIds.includes(ep.id))
                          .filter(ep => {
                            if (!episodeSearch) return true;
                            const searchNum = episodeSearch.replace(/[^0-9]/g, "");
                            const searchText = episodeSearch.toLowerCase();
                            return (
                              (searchNum && ep.episodeNumber?.toString().includes(searchNum)) ||
                              ep.guestName?.toLowerCase().includes(searchText) ||
                              ep.title?.toLowerCase().includes(searchText)
                            );
                          })
                          .sort((a, b) => (b.episodeNumber || 0) - (a.episodeNumber || 0))
                          .map((ep) => (
                            <button
                              key={ep.id}
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                              onClick={() => {
                                addEpisode(ep.id);
                                setEpisodeSearch("");
                                setIsEpisodeDropdownOpen(false);
                              }}
                              data-testid={`episode-option-${ep.id}`}
                            >
                              #{ep.episodeNumber} - {ep.guestName || ep.title?.substring(0, 35)}{(ep.guestName || ep.title || "").length > 35 ? "..." : ""}
                            </button>
                          ))}
                        {episodes?.filter(ep => !selectedEpisodeIds.includes(ep.id)).filter(ep => {
                          if (!episodeSearch) return true;
                          const searchNum = episodeSearch.replace(/[^0-9]/g, "");
                          const searchText = episodeSearch.toLowerCase();
                          return (
                            (searchNum && ep.episodeNumber?.toString().includes(searchNum)) ||
                            ep.guestName?.toLowerCase().includes(searchText) ||
                            ep.title?.toLowerCase().includes(searchText)
                          );
                        }).length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No episodes found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedEpisodeIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedEpisodeIds.length} episode{selectedEpisodeIds.length > 1 ? "s" : ""} selected
                    </p>
                  )}

                  <Input
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Share your experience"
                    data-testid="input-caption"
                  />
                </div>

                {/* Personal Info */}
                <div className="space-y-3 border-t pt-3">
                  <Input
                    value={formData.submitterName}
                    onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                    placeholder="Your name *"
                    required
                    data-testid="input-name"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                      data-testid="checkbox-anonymous"
                    />
                    <Label htmlFor="anonymous" className="text-sm text-muted-foreground">
                      Hide my name publicly
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="email"
                      value={formData.submitterEmail}
                      onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
                      placeholder="Email"
                      data-testid="input-email"
                    />
                    <div className="relative" data-testid="input-phone">
                      {!isPhoneFocused && !formData.submitterPhone ? (
                        <Input
                          placeholder="Phone"
                          onFocus={() => setIsPhoneFocused(true)}
                          readOnly
                        />
                      ) : (
                        <div className="phone-input-wrapper">
                          <PhoneInput
                            international
                            defaultCountry="US"
                            value={formData.submitterPhone}
                            onChange={(value) => setFormData({ ...formData, submitterPhone: value || "" })}
                            onBlur={() => {
                              if (!formData.submitterPhone) {
                                setIsPhoneFocused(false);
                              }
                            }}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-1 focus-within:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold italic">Email and phone are not shared publicly</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitMutation.isPending || (!uploadedImagePath && !uploadedVideoPath)}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Community Photos with Filter */}
          <div className="mt-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 className="text-xl font-semibold">Community Photos</h2>
              
              {/* Airline Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAirlineFilter("all")}
                  className={airlineFilter === "all" ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : ""}
                  data-testid="filter-all"
                >
                  All Airlines
                </Button>
                {AIRLINES.map((airline) => {
                  const count = photos?.filter(p => p.airline === airline.value).length || 0;
                  if (count === 0) return null;
                  return (
                    <Button
                      key={airline.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setAirlineFilter(airline.value)}
                      className={airlineFilter === airline.value ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : ""}
                      data-testid={`filter-${airline.value}`}
                    >
                      {airline.label}
                      <span className="ml-1 text-xs opacity-70">({count})</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : photos && photos.filter(p => airlineFilter === "all" || p.airline === airlineFilter).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {photos
                  .filter(p => airlineFilter === "all" || p.airline === airlineFilter)
                  .sort((a, b) => {
                    const dateA = a.flightDate ? new Date(a.flightDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                    const dateB = b.flightDate ? new Date(b.flightDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                    return dateB - dateA;
                  })
                  .map((photo) => (
                  <Card key={photo.id} className="overflow-hidden" data-testid={`photo-${photo.id}`}>
                    <div className="aspect-square relative group">
                      {photo.mediaType === "video" && photo.videoUrl ? (
                        <>
                          {/* Check if we have a valid thumbnail (not same as video URL) */}
                          {photo.videoThumbnailUrl && photo.videoThumbnailUrl !== photo.videoUrl ? (
                            <video
                              src={photo.videoUrl}
                              controls
                              className="w-full h-full object-cover"
                              poster={photo.videoThumbnailUrl}
                            />
                          ) : photo.imageUrl && photo.imageUrl !== photo.videoUrl ? (
                            <video
                              src={photo.videoUrl}
                              controls
                              className="w-full h-full object-cover"
                              poster={photo.imageUrl}
                            />
                          ) : (
                            /* No valid thumbnail - show video with gradient background */
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                              <video
                                src={photo.videoUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <img
                          src={photo.imageUrl}
                          alt={photo.caption || "Community photo"}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {photo.mediaType === "video" && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          Video
                        </div>
                      )}
                    </div>
                    {(photo.episodeIds?.length || photo.episodeId || photo.episodeWatched) && (
                      <div className="px-2 pt-2 pb-1 space-y-1">
                        {photo.episodeIds && photo.episodeIds.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {photo.episodeIds.map((epId, idx) => (
                              <Link 
                                key={epId}
                                href={`/episode/${epId}`}
                                onClick={() => trackEpisodeView(epId)}
                                className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                              >
                                {idx === 0 && <img src={latestTalksOutlineIcon} alt="" className="h-3 flex-shrink-0" style={{ width: 'auto' }} />}
                                <span className="truncate">{formatEpisodeDisplay(epId)}</span>
                              </Link>
                            ))}
                          </div>
                        ) : photo.episodeId ? (
                          <Link 
                            href={`/episode/${photo.episodeId}`}
                            onClick={() => trackEpisodeView(photo.episodeId!)}
                            className="text-xs text-primary hover:underline flex items-center gap-1 justify-center"
                          >
                            <img src={latestTalksOutlineIcon} alt="" className="h-3 flex-shrink-0" style={{ width: 'auto' }} />
                            <span className="truncate">{formatEpisodeDisplay(photo.episodeId)}</span>
                          </Link>
                        ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                            <Tv className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{photo.episodeWatched}</span>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="p-2 pt-1 flex justify-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            data-testid={`button-photo-details-${photo.id}`}
                          >
                            <AirlineLogo airline={photo.airline || "other"} className="h-8 w-16" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="center">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">{getAirlineLabel(photo.airline || "")}</h4>
                            {photo.flightNumber && (
                              <div className="flex items-center gap-2 text-sm">
                                <Plane className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Flight {photo.flightNumber}</span>
                              </div>
                            )}
                            {photo.route && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{photo.route}</span>
                              </div>
                            )}
                            {photo.flightDate && (
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{new Date(photo.flightDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {(photo.episodeIds?.length || photo.episodeId || photo.episodeWatched) && (
                              <div className="flex items-start gap-2 text-sm pt-1 border-t">
                                <Tv className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                <div className="flex flex-col gap-1">
                                  {photo.episodeIds && photo.episodeIds.length > 0 ? (
                                    photo.episodeIds.map((epId) => (
                                      <Link 
                                        key={epId}
                                        href={`/episode/${epId}`}
                                        onClick={() => trackEpisodeView(epId)}
                                        className="text-primary hover:underline flex items-center gap-1"
                                      >
                                        {formatEpisodeDisplay(epId)}
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    ))
                                  ) : photo.episodeId ? (
                                    <Link 
                                      href={`/episode/${photo.episodeId}`}
                                      onClick={() => trackEpisodeView(photo.episodeId!)}
                                      className="text-primary hover:underline flex items-center gap-1"
                                    >
                                      {formatEpisodeDisplay(photo.episodeId)}
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  ) : (
                                    <span>{photo.episodeWatched}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            {photo.enjoyedMost && (
                              <div className="flex items-start gap-2 text-sm">
                                <Heart className="h-3.5 w-3.5 text-primary mt-0.5" />
                                <span className="text-muted-foreground">{photo.enjoyedMost}</span>
                              </div>
                            )}
                            {photo.caption && (
                              <p className="text-sm text-muted-foreground pt-1 border-t italic">
                                "{photo.caption}"
                              </p>
                            )}
                            {photo.submitterName && !photo.isAnonymous && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground/70 pt-1">
                                <User className="h-3 w-3" />
                                <span>{photo.submitterName}</span>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {airlineFilter === "all" 
                    ? "No photos yet. Be the first to share!" 
                    : `No photos from ${getAirlineLabel(airlineFilter)} yet. Be the first to share!`}
                </p>
              </div>
            )}
          </div>

          {/* Featured Partner Card */}
          <Card className="mt-12">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={elAlLogo} 
                  alt="El Al" 
                  className="h-10 w-auto object-contain"
                />
                <h3 className="font-semibold">Featured Partner: El Al</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Latest Talks is proudly featured on El Al's in-flight entertainment system. 
                Passengers can enjoy our episodes while flying to and from Israel. 
                We're excited to bring Yiddish entertainment to the skies!
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
