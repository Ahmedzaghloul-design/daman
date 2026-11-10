import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./contexts.js";
import { must, supabase } from "../lib/supabase.js";

// Who is signed in, which factory workspaces they belong to, and which one is
// open. workspaceId null = "Demo on this device" (the original local mode).
const WS_KEY = "daman.workspace";
const readWs = () => {
  try {
    return localStorage.getItem(WS_KEY) || null;
  } catch {
    return null;
  }
};

export const ROLES = ["owner", "reviewer", "uploader", "verifier"];

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceId, setWorkspaceId] = useState(readWs);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const loadWorkspaces = useCallback(async () => {
    if (!session) return setWorkspaces([]);
    // Joining a workspace happens here: any invitation for this email is accepted.
    await supabase.rpc("accept_invitations");
    const rows = must(await supabase.from("members").select("role, workspace:workspaces(id, name)").eq("user_id", session.user.id));
    setWorkspaces(rows.filter((r) => r.workspace).map((r) => ({ id: r.workspace.id, name: r.workspace.name, role: r.role })));
  }, [session]);

  useEffect(() => {
    loadWorkspaces().catch(() => setWorkspaces([]));
  }, [loadWorkspaces]);

  const selectWorkspace = useCallback((id) => {
    setWorkspaceId(id);
    try {
      if (id) localStorage.setItem(WS_KEY, id);
      else localStorage.removeItem(WS_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const current = session ? workspaces.find((w) => w.id === workspaceId) ?? null : null;

  const value = useMemo(
    () => ({
      ready: session !== undefined,
      session,
      email: session?.user?.email ?? "",
      workspaces,
      workspace: current, // { id, name, role } or null (demo on device)
      role: current?.role ?? "local",
      selectWorkspace,
      reloadWorkspaces: loadWorkspaces,
      // Email link. The same email also carries a 6-digit code when the
      // Supabase email template includes {{ .Token }} (needed for the phone app,
      // where a link opens the browser instead of the installed app).
      sendLink: async (email) =>
        must(await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/account` } })),
      verifyCode: async (email, token) => must(await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: "email" })),
      signOut: async () => {
        await supabase.auth.signOut();
        selectWorkspace(null);
      },
      createWorkspace: async (name) => {
        const id = must(await supabase.rpc("create_workspace", { p_name: name }));
        await loadWorkspaces();
        selectWorkspace(id);
        return id;
      },
    }),
    [session, workspaces, current, selectWorkspace, loadWorkspaces],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** What the current role may do. "local" = demo on this device (everything). */
export function permissions(role) {
  return {
    edit: ["local", "owner", "reviewer"].includes(role), // registry, settings
    approve: ["local", "owner", "reviewer"].includes(role),
    send: role === "uploader",
    seeLedger: role !== "uploader",
    comment: ["owner", "reviewer", "verifier"].includes(role),
    team: role === "owner",
  };
}
