export const validateStreamUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && Boolean(
      contentType?.includes('video/') || 
      contentType?.includes('application/x-mpegURL') ||
      contentType?.includes('application/vnd.apple.mpegurl')
    );
  } catch {
    return false;
  }
};