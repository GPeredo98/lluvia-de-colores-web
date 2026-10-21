import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Credentials, UserProfile } from '../../../domain/models';
import { AuthGateway } from '../../../domain/ports';
import { caseMapper } from '../../supabase/row-mapper';
import { SupabaseClientProvider } from '../../supabase/supabase-client';

@Injectable()
export class SupabaseAuthAdapter implements AuthGateway {
  private readonly supabase = inject(SupabaseClientProvider).client;
  private readonly mapper = caseMapper<UserProfile>();

  async currentUser(): Promise<UserProfile | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session ? this.loadProfile(data.session.user) : null;
  }

  async signIn({ email, password }: Credentials): Promise<UserProfile> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message,
      );
    }
    return this.loadProfile(data.user);
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async sendPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/login`,
    });
    if (error) throw new Error(error.message);
  }

  onChange(callback: (user: UserProfile | null) => void): () => void {
    const { data } = this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') callback(null);
      // Se difiere para no llamar a Supabase dentro del callback (recomendación del SDK).
      else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setTimeout(
          () => session && this.loadProfile(session.user).then(callback, () => callback(null)),
        );
      }
    });
    return () => data.subscription.unsubscribe();
  }

  private async loadProfile(user: User): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error || !data) throw new Error('Tu cuenta no tiene un perfil asignado');
    return this.mapper.toDomain(data);
  }
}
