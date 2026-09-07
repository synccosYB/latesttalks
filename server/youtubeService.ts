const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
}

interface YouTubeVideoItem {
  id: string;
  statistics: YouTubeVideoStatistics;
}

interface YouTubeResponse {
  items: YouTubeVideoItem[];
}

export async function getVideoStatistics(videoIds: string[]): Promise<Map<string, number>> {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured");
  }

  const viewCounts = new Map<string, number>();
  
  // YouTube API allows up to 50 video IDs per request
  const batchSize = 50;
  
  for (let i = 0; i < videoIds.length; i += batchSize) {
    const batch = videoIds.slice(i, i + batchSize);
    const idsParam = batch.join(",");
    
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${idsParam}&key=${YOUTUBE_API_KEY}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("YouTube API error:", errorText);
        throw new Error(`YouTube API returned ${response.status}`);
      }
      
      const data: YouTubeResponse = await response.json();
      
      for (const item of data.items) {
        const views = parseInt(item.statistics.viewCount, 10) || 0;
        viewCounts.set(item.id, views);
      }
    } catch (error) {
      console.error("Error fetching YouTube statistics:", error);
      throw error;
    }
  }
  
  return viewCounts;
}

export function isYouTubeConfigured(): boolean {
  return !!YOUTUBE_API_KEY;
}
