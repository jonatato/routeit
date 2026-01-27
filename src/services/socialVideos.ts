import { supabase } from '../lib/supabase';

export type SocialVideo = {
  id: string;
  itinerary_id: string;
  user_id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  video_url: string;
  embed_code?: string;
  thumbnail_url?: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  tags?: { id: string; name: string }[];
  reactions?: VideoReaction[];
  user_name?: string;
};

export type VideoReaction = {
  id: string;
  video_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'fire' | 'laugh';
  comment?: string;
  created_at: string;
  user_name?: string;
};

export type VideoTag = {
  video_id: string;
  tag_id: string;
};

// Parsear URL y extraer información de la plataforma
export function parseVideoUrl(url: string): { platform: 'tiktok' | 'instagram' | 'youtube'; videoId: string } | null {
  // TikTok: https://www.tiktok.com/@username/video/1234567890 o https://vm.tiktok.com/ABC123/
  const tiktokMatch = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
  const tiktokShortMatch = url.match(/vm\.tiktok\.com\/([\w-]+)/);
  if (tiktokMatch) return { platform: 'tiktok', videoId: tiktokMatch[1] };
  if (tiktokShortMatch) return { platform: 'tiktok', videoId: tiktokShortMatch[1] };
  
  // Instagram Reels: https://www.instagram.com/reel/ABC123/ o https://www.instagram.com/p/ABC123/
  const instaMatch = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/);
  if (instaMatch) return { platform: 'instagram', videoId: instaMatch[1] };
  
  // YouTube Shorts: https://www.youtube.com/shorts/ABC123 o https://youtu.be/ABC123
  const youtubeMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/);
  const youtubeShortMatch = url.match(/youtu\.be\/([\w-]+)/);
  if (youtubeMatch) return { platform: 'youtube', videoId: youtubeMatch[1] };
  if (youtubeShortMatch) return { platform: 'youtube', videoId: youtubeShortMatch[1] };
  
  return null;
}

// Generar código embed según plataforma
export function generateEmbedCode(platform: 'tiktok' | 'instagram' | 'youtube', videoId: string, videoUrl: string): string {
  switch (platform) {
    case 'tiktok':
      // TikTok oEmbed - usaremos el formato blockquote que TikTok procesa
      return `<blockquote class="tiktok-embed" cite="${videoUrl}" data-video-id="${videoId}" style="max-width: 605px; min-width: 325px; margin: 0 auto;">
        <section>
          <a target="_blank" title="@user" href="${videoUrl}">Ver en TikTok</a>
        </section>
      </blockquote>`;
    case 'instagram':
      // Instagram oEmbed - usaremos iframe que es más confiable
      return `<iframe src="https://www.instagram.com/p/${videoId}/embed/captioned" width="400" height="600" frameborder="0" scrolling="no" allowtransparency="true" style="border:none;overflow:hidden;max-width:540px;width:100%;margin:0 auto;display:block;" allowfullscreen="true"></iframe>`;
    case 'youtube':
      return `<iframe width="100%" height="600" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 605px; margin: 0 auto; display: block;"></iframe>`;
    default:
      return '';
  }
}

// Función para obtener embed HTML desde oEmbed API (más confiable)
export async function fetchOEmbedHtml(platform: 'tiktok' | 'instagram' | 'youtube', videoUrl: string): Promise<string | null> {
  try {
    let oembedUrl = '';
    
    switch (platform) {
      case 'tiktok':
        oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        break;
      case 'instagram':
        // Instagram requiere un token de acceso, así que usaremos el iframe directo
        return null; // Usaremos el iframe estándar en su lugar
      case 'youtube':
        oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
        break;
      default:
        return null;
    }

    if (!oembedUrl) return null;

    const response = await fetch(oembedUrl);
    if (!response.ok) return null;

    const data = await response.json();
    return data.html || null;
  } catch (error) {
    console.error('Error fetching oEmbed:', error);
    return null;
  }
}

// Generar thumbnail URL según plataforma
export function generateThumbnailUrl(platform: 'tiktok' | 'instagram' | 'youtube', videoId: string): string {
  switch (platform) {
    case 'tiktok':
      // TikTok no tiene URLs de thumbnail públicas fáciles, retornar placeholder
      return 'https://placehold.co/400x600/9b87f5/ffffff?text=TikTok';
    case 'instagram':
      // Instagram no permite thumbnails externos fácilmente
      return 'https://placehold.co/400x600/E1306C/ffffff?text=Instagram';
    case 'youtube':
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    default:
      return 'https://placehold.co/400x600/6b7280/ffffff?text=Video';
  }
}

// Obtener todos los videos de un itinerario
export async function fetchVideos(itineraryId: string): Promise<SocialVideo[]> {
  const { data, error } = await supabase
    .from('social_videos')
    .select(`
      *,
      video_tags(tag_id, tags(id, name)),
      video_reactions(*)
    `)
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  // Transformar datos para formato más amigable
  const videos = (data || []).map(video => ({
    ...video,
    tags: video.video_tags?.map((vt: any) => vt.tags) || [],
    reactions: video.video_reactions || [],
  }));
  
  return videos as SocialVideo[];
}

// Obtener un video específico
export async function fetchVideo(videoId: string): Promise<SocialVideo | null> {
  const { data, error } = await supabase
    .from('social_videos')
    .select(`
      *,
      video_tags(tag_id, tags(id, name)),
      video_reactions(*)
    `)
    .eq('id', videoId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }
  
  return {
    ...data,
    tags: data.video_tags?.map((vt: any) => vt.tags) || [],
    reactions: data.video_reactions || [],
  } as SocialVideo;
}

// Agregar nuevo video
export async function addVideo(
  itineraryId: string,
  userId: string,
  videoUrl: string,
  description?: string
): Promise<SocialVideo> {
  const parsed = parseVideoUrl(videoUrl);
  if (!parsed) {
    throw new Error('URL de video no válida. Soportamos TikTok, Instagram Reels y YouTube Shorts.');
  }
  
  // Intentar obtener el embed desde oEmbed primero, si falla usar el generado
  let embedCode = generateEmbedCode(parsed.platform, parsed.videoId, videoUrl);
  try {
    const oembedHtml = await fetchOEmbedHtml(parsed.platform, videoUrl);
    if (oembedHtml) {
      embedCode = oembedHtml;
    }
  } catch (error) {
    console.log('Using fallback embed code for', parsed.platform);
  }
  
  const thumbnailUrl = generateThumbnailUrl(parsed.platform, parsed.videoId);
  
  const { data, error } = await supabase
    .from('social_videos')
    .insert({
      itinerary_id: itineraryId,
      user_id: userId,
      platform: parsed.platform,
      video_url: videoUrl,
      embed_code: embedCode,
      thumbnail_url: thumbnailUrl,
      description: description || null,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data as SocialVideo;
}

// Actualizar video
export async function updateVideo(
  videoId: string,
  updates: { description?: string }
): Promise<void> {
  const { error } = await supabase
    .from('social_videos')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);
    
  if (error) throw error;
}

// Eliminar video
export async function deleteVideo(videoId: string): Promise<void> {
  const { error } = await supabase
    .from('social_videos')
    .delete()
    .eq('id', videoId);
    
  if (error) throw error;
}

// Agregar tags a un video
export async function addVideoTags(videoId: string, tagIds: string[]): Promise<void> {
  const videoTags = tagIds.map(tagId => ({
    video_id: videoId,
    tag_id: tagId,
  }));
  
  const { error } = await supabase
    .from('video_tags')
    .insert(videoTags);
    
  if (error) throw error;
}

// Eliminar tags de un video
export async function removeVideoTags(videoId: string, tagIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('video_tags')
    .delete()
    .eq('video_id', videoId)
    .in('tag_id', tagIds);
    
  if (error) throw error;
}

// Agregar reacción
export async function addReaction(
  videoId: string,
  userId: string,
  reactionType: 'like' | 'love' | 'fire' | 'laugh',
  comment?: string
): Promise<VideoReaction> {
  const { data, error } = await supabase
    .from('video_reactions')
    .insert({
      video_id: videoId,
      user_id: userId,
      reaction_type: reactionType,
      comment: comment || null,
    })
    .select()
    .single();
    
  if (error) throw error;
  return data as VideoReaction;
}

// Actualizar reacción
export async function updateReaction(
  reactionId: string,
  updates: { reaction_type?: 'like' | 'love' | 'fire' | 'laugh'; comment?: string }
): Promise<void> {
  const { error } = await supabase
    .from('video_reactions')
    .update(updates)
    .eq('id', reactionId);
    
  if (error) throw error;
}

// Eliminar reacción
export async function deleteReaction(reactionId: string): Promise<void> {
  const { error } = await supabase
    .from('video_reactions')
    .delete()
    .eq('id', reactionId);
    
  if (error) throw error;
}

// Filtrar videos por tags
export async function filterVideosByTags(itineraryId: string, tagIds: string[]): Promise<SocialVideo[]> {
  const { data, error } = await supabase
    .from('social_videos')
    .select(`
      *,
      video_tags!inner(tag_id, tags(id, name)),
      video_reactions(*)
    `)
    .eq('itinerary_id', itineraryId)
    .in('video_tags.tag_id', tagIds)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  const videos = (data || []).map(video => ({
    ...video,
    tags: video.video_tags?.map((vt: any) => vt.tags) || [],
    reactions: video.video_reactions || [],
  }));
  
  return videos as SocialVideo[];
}

// Obtener estadísticas de reacciones para un video
export async function getVideoReactionStats(videoId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId);
    
  if (error) throw error;
  
  const stats: Record<string, number> = {
    like: 0,
    love: 0,
    fire: 0,
    laugh: 0,
  };
  
  data?.forEach(reaction => {
    stats[reaction.reaction_type] = (stats[reaction.reaction_type] || 0) + 1;
  });
  
  return stats;
}
