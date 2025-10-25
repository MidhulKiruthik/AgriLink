// Utility to resolve product image URLs consistently across environments
export function resolveImageSrc(imageUrl) {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
  const region = process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1';

  if (!imageUrl) return '/uploads/placeholder-product.jpg';
  if (typeof imageUrl !== 'string') return '/uploads/placeholder-product.jpg';

  // Absolute URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;

  // Already a public uploads path like /uploads/abc.jpg
  if (imageUrl.startsWith('/uploads/')) {
    if (cdn) return `${cdn}${imageUrl}`; // preserve leading slash
    if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com${imageUrl}`;
    return imageUrl; // served via backend proxy or local static
  }

  // S3 key form like uploads/abc.jpg
  if (imageUrl.startsWith('uploads/')) {
    const key = imageUrl.replace(/^uploads\//, '');
    if (cdn) return `${cdn}/uploads/${key}`;
    if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com/uploads/${key}`;
    return `/uploads/${key}`; // backend proxy
  }

  // Bare filename or unknown path -> treat as key within uploads/
  const key = imageUrl.replace(/^\/+/, '');
  if (cdn) return `${cdn}/uploads/${key}`;
  if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com/uploads/${key}`;
  return `/uploads/${key}`;
}
