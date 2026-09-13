export const env = {
    apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, ''),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
};
export const hasApi = Boolean(env.apiUrl);
export const hasAuth = Boolean(env.supabaseUrl && env.supabaseKey);
