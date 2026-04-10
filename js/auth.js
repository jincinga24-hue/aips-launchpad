// js/auth.js — Authentication
import { supabase } from './supabase.js';

let currentUser = null;
let currentProfile = null;

export function getUser() { return currentUser; }
export function getProfile() { return currentProfile; }
export function isAdmin() { return currentProfile?.role === 'admin'; }
export function isLoggedIn() { return currentUser !== null; }

export async function initAuth(onAuthChange) {
  // onAuthStateChange fires immediately with current session — no need for separate getSession()
  // This avoids the "lock was stolen" race condition
  supabase.auth.onAuthStateChange(async (event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      currentProfile = data;
    } else {
      currentProfile = null;
    }
    onAuthChange(currentUser, currentProfile);
  });
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) throw error;
}

export async function signInWithEmail(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(email, password, displayName) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName } }
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
