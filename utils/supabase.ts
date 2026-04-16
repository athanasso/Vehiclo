import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// ** TODO: Replace these with your actual Supabase URL and ANON KEY ** //
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Uploads a local file uri to Supabase Storage Bucket and returns public URL.
 */
export async function uploadImageToSupabase(uri: string, bucket: string, path: string): Promise<string | null> {
  try {
    const extMatch = uri.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1] : 'jpg';
    const fileName = `${path}.${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${ext}`,
    } as any);

    const { error } = await supabase.storage.from(bucket).upload(fileName, formData, {
      upsert: true,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * Uploads a file to a Private bucket and returns the object path (NOT a public URL).
 */
export async function uploadPrivateFileToSupabase(uri: string, bucket: string, path: string): Promise<string | null> {
  try {
    const extMatch = uri.match(/\.(\w+)$/);
    const ext = extMatch ? extMatch[1] : 'pdf';
    const fileName = `${path}.${ext}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: ext === 'pdf' ? 'application/pdf' : `image/${ext}`,
    } as any);

    const { error } = await supabase.storage.from(bucket).upload(fileName, formData, {
      upsert: true,
    });

    if (error) {
      console.error('Supabase private upload error:', error);
      return null;
    }

    return fileName; // Return internal path, since it's private
  } catch (error) {
    console.error('Error uploading private file:', error);
    return null;
  }
}

/**
 * Generates a short-lived Signed URL for viewing private files.
 */
export async function getPrivateFileUrl(bucket: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600); // 1 hour expiry
    if (error) throw error;
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Failed to generate signed Document URL:', error);
    return null;
  }
}
