'use client';

import { supabase } from './supabase';

/**
 * Small helper: convert a data URL (from Webcam/getScreenshot)
 * into a Blob we can upload to Supabase Storage.
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/** Visibility flag stored on the posts table */
export type Visibility = 'public' | 'private';

/**
 * Upload a profile avatar image to the `avatars` bucket and
 * save the public URL to the current user's profile row.
 *
 * @returns the public URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes?.user;
  if (!user) throw new Error('Not signed in');

  const path = `avatars/${user.id}/avatar.png`;

  // Upload (overwrite if exists)
  const { error: upErr } = await supabase
    .storage
    .from('avatars')
    .upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/png',
      cacheControl: '3600',
    });

  if (upErr) throw upErr;

  // Make/get a public URL
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = pub.publicUrl;

  // Update profile row
  const { error: profErr } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (profErr) throw profErr;

  return avatarUrl;
}

/**
 * Upload a post image captured from the webcam (data URL)
 * to the `posts` bucket and return its public URL.
 */
export async function uploadPostImageFromDataUrl(dataUrl: string): Promise<string> {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes?.user;
  if (!user) throw new Error('Not signed in');

  const blob = await dataUrlToBlob(dataUrl);

  // filename: crypto.randomUUID() when available, else Date.now()
  const filename =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `${crypto.randomUUID()}.jpg`
      : `${Date.now()}.jpg`;

  const path = `posts/${user.id}/${filename}`;

  const { error: upErr } = await supabase
    .storage
    .from('posts')
    .upload(path, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('posts').getPublicUrl(path);
  return pub.publicUrl;
}

/**
 * Insert a new row into the `posts` table after you’ve uploaded
 * the image to Storage and obtained its `imageUrl`.
 */
export async function createPost(args: {
  imageUrl: string;
  caption: string;
  visibility: Visibility;
}): Promise<void> {
  const { imageUrl, caption, visibility } = args;

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes?.user;
  if (!user) throw new Error('Not signed in');

  // YYYY-MM-DD like your local code expects
  const dateStr = new Date().toISOString().split('T')[0];

  const { error } = await supabase.from('posts').insert({
    user_id: user.id,
    image_url: imageUrl,
    caption,
    date: dateStr,
    visibility,
  });

  if (error) throw error;
}
