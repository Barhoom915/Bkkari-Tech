import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

function getBrowserClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment environment."
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}

// Next.js server-renders Client Components during prerendering. Keep that
// render from eagerly constructing a browser Supabase client (which requires
// NEXT_PUBLIC_* values at build time). Actual Supabase access must happen in
// browser effects or event handlers.
const serverRenderClient = new Proxy({} as BrowserClient, {
  get(_target, property) {
    throw new Error(
      `Supabase browser client property "${String(property)}" was accessed during server rendering. Use it only in browser effects or event handlers.`
    );
  },
});

export function createClient(): BrowserClient {
  if (typeof window === "undefined") {
    return serverRenderClient;
  }

  return getBrowserClient();
}
