import { useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";

interface ProtectedVideoProps {
  youtubeId: string;
  title: string;
  autoplay?: boolean;
  className?: string;
  isPremium?: boolean;
}

export default function ProtectedVideo({ 
  youtubeId, 
  title, 
  autoplay = false, 
  className = "",
  isPremium = false 
}: ProtectedVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showProtectionNotice, setShowProtectionNotice] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isPremium) {
        setShowProtectionNotice(true);
        setTimeout(() => setShowProtectionNotice(false), 2000);
      }
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.key === 'S') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'i') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'j') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'c') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'U') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 'P')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (isPremium) {
          setShowProtectionNotice(true);
          setTimeout(() => setShowProtectionNotice(false), 2000);
        }
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (isPremium) {
        e.preventDefault();
        return false;
      }
    };

    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('dragstart', handleDragStart);
    container.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [isPremium]);

  const embedParams = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    showinfo: '0',
    iv_load_policy: '3',
    disablekb: isPremium ? '1' : '0',
    playsinline: '1',
    cc_load_policy: '0',
    fs: '1',
    ...(autoplay && { autoplay: '1' }),
  });

  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?${embedParams.toString()}`;

  return (
    <div 
      ref={containerRef}
      className={`relative select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onCopy={(e) => isPremium && e.preventDefault()}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className="aspect-video rounded-lg overflow-hidden bg-black relative">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          style={{
            pointerEvents: 'auto',
            border: 'none',
          }}
          data-testid="iframe-protected-video"
        />
        
        {isPremium && (
          <>
            <div 
              className="absolute top-0 left-0 right-0 h-12 pointer-events-auto bg-transparent z-10"
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'default' }}
            />
            
            <div 
              className="absolute bottom-10 right-0 w-28 h-8 pointer-events-auto bg-transparent z-10"
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'default' }}
            />
            
            <div 
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-xs z-20 pointer-events-none"
            >
              <Shield className="h-3 w-3 text-primary" />
              <span>LT+ Protected</span>
            </div>
          </>
        )}
        
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 5 }}
        />
      </div>
      
      {showProtectionNotice && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm">Content is protected</span>
        </div>
      )}
      
      {isPremium && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>This premium content is protected and available exclusively on Latest Talks</span>
        </div>
      )}
    </div>
  );
}
