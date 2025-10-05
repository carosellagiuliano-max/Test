import { createClient } from '@/lib/supabase/client'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role?: 'customer' | 'staff' | 'admin' | 'super_admin'
}

export const authService = {
  // Client-side authentication
  async signUp(email: string, password: string, metadata?: { full_name?: string; phone?: string }) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return data
  },

  async signIn(email: string, password: string) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  },

  async signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async resetPassword(email: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error
  },

  async updatePassword(newPassword: string) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  },

  async getSession() {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error
    return session
  },

  async getUser() {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  // OAuth providers
  async signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  },

  async signInWithFacebook() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
  }
}

// Server-side authentication helpers
export const serverAuth = {
  async getSession() {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) throw error
    return session
  },

  async getUser() {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error
    return user
  },

  async getUserProfile(userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  async isAuthenticated() {
    const session = await this.getSession()
    return !!session
  },

  async requireAuth() {
    const session = await this.getSession()
    if (!session) {
      throw new Error('Authentication required')
    }
    return session
  },

  async requireRole(requiredRole: string) {
    const session = await this.requireAuth()
    const profile = await this.getUserProfile(session.user.id)

    const roleHierarchy = {
      'super_admin': 4,
      'admin': 3,
      'staff': 2,
      'customer': 1
    }

    const userLevel = roleHierarchy[profile.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (userLevel < requiredLevel) {
      throw new Error('Insufficient permissions')
    }

    return { session, profile }
  }
}