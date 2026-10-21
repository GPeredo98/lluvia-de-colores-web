import { Credentials, UserProfile } from '../models';

export abstract class AuthGateway {
  /** Restaura la sesión guardada, si existe. */
  abstract currentUser(): Promise<UserProfile | null>;
  abstract signIn(credentials: Credentials): Promise<UserProfile>;
  abstract signOut(): Promise<void>;
  abstract sendPasswordReset(email: string): Promise<void>;
  /** Notifica cambios de sesión (expiración, cierre en otra pestaña). Devuelve la función para desuscribirse. */
  abstract onChange(callback: (user: UserProfile | null) => void): () => void;
}
