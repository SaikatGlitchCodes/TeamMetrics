import { createClient } from "@/lib/supabase/client";
import { AuthError } from "@supabase/supabase-js";

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

/**
 * Sign in with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred during sign in";
    return { success: false, error: message };
  }
}

/**
 * Sign out
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred during sign out";
    return { success: false, error: message };
  }
}

/**
 * Get current session
 */
export async function getSession() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: error.message };
    }

    return { session: data.session, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred fetching session";
    return { session: null, error: message };
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred fetching user";
    return { user: null, error: message };
  }
}
