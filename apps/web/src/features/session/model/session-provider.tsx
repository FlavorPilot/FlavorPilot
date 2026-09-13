'use client';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { env, hasAuth } from '@/shared/config';
interface SessionContextValue {
    client: SupabaseClient | null;
    session: Session | null;
    loading: boolean;
    error: boolean;
}
const Context = createContext<SessionContextValue>({ client: null, session: null, loading: true, error: false });
export function SessionProvider({ children }: {
    children: ReactNode;
}) {
    const client = useMemo(() => hasAuth ? createBrowserClient(env.supabaseUrl, env.supabaseKey, { auth: { flowType: 'pkce', detectSessionInUrl: false } }) : null, []);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(Boolean(client));
    const [error, setError] = useState(false);
    useEffect(() => {
        if (!client)
            return;
        let live = true;
        const { data: { subscription } } = client.auth.onAuthStateChange((_event, value) => {
            if (live) {
                setSession(value);
                setLoading(false);
            }
        });
        client.auth.getSession().then(({ data, error: problem }) => {
            if (live) {
                setSession(data.session);
                setError(Boolean(problem));
                setLoading(false);
            }
        }).catch(() => {
            if (live) {
                setError(true);
                setLoading(false);
            }
        });
        return () => { live = false; subscription.unsubscribe(); };
    }, [client]);
    return <Context.Provider value={{ client, session, loading, error }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
