// src/utils/cloudinaryUpload.ts
import { Platform } from 'react-native';
import crypto from 'crypto-js';

export const CLOUDINARY = {
  cloudName: 'daltvmeyl',
  uploadPreset: 'signed_shop',
  apiKey: '758861461658613',
  apiSecret: 'ruNoxcMn1KpTrLgUvlVvJbPTXXo',
};

export async function uploadToCloudinarySigned(
  localUri: string,
  opts?: { folder?: string; fileName?: string; mime?: string },
): Promise<string> {
  const folder = opts?.folder;
  const fileName = opts?.fileName ?? `image_${Date.now()}.jpg`;
  const mime = opts?.mime ?? 'image/jpeg';
  const timestamp = Math.floor(Date.now() / 1000);

  // Build signature string
  const sigBase = [folder ? `folder=${folder}` : null, `timestamp=${timestamp}`]
    .filter(Boolean)
    .join('&');

  const signature = crypto.SHA1(`${sigBase}${CLOUDINARY.apiSecret}`).toString();

  // Fix iOS URI
  const uri =
    Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri;

  // Build form data
  const form = new FormData();
  form.append('file', { uri, name: fileName, type: mime } as any);
  form.append('api_key', CLOUDINARY.apiKey);
  form.append('timestamp', timestamp.toString());
  if (folder) form.append('folder', folder);
  form.append('signature', signature);

  // Upload
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) throw new Error('No secure_url returned by Cloudinary');

  return json.secure_url;
}
