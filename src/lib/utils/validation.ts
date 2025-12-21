export const validateStreamUrl = async (url: string): Promise<{ isValid: boolean; finalUrl?: string }> => {
  try {
    // Create manual timeout controller for better browser support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow', // Automatically stops after 20 redirects
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    const finalUrl = response.url; // This will be the final URL after redirects
    
    const isValid = response.ok && Boolean(
      contentType?.includes('video/') || 
      contentType?.includes('application/x-mpegURL') ||
      contentType?.includes('application/vnd.apple.mpegurl') ||
      contentType?.includes('application/octet-stream') || // For .mkv files
      finalUrl.match(/\.(mp4|mkv|avi|mov|webm|m3u8)$/i) // Check file extension
    );
    
    return { isValid, finalUrl: isValid ? finalUrl : undefined };
  } catch (error) {
    // This will catch infinite redirects, timeouts, and network errors
    console.error('Stream validation error:', error);
    return { isValid: false };
  }
};