/**
 * Session Management Service
 * Handles user sessions, business context, and session data persistence
 * Designed for scalability with thousands of concurrent users
 */

export interface SessionData {
  userId?: string;
  businessId: string;
  businessData?: any;
  timestamp: number;
  expiresAt: number;
  sessionId: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  businessId: string;
  createdAt: number;
  lastAccessed: number;
  expiresAt: number;
  data: Record<string, any>;
}

class SessionService {
  private readonly SESSION_PREFIX = 'flowcart_session_';
  private readonly BUSINESS_PREFIX = 'flowcart_business_';
  private readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly BUSINESS_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SESSIONS = 10; // Maximum sessions per user

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get current session ID or create a new one
   */
  getSessionId(): string {
    if (typeof window === 'undefined') return '';

    const sessionId = sessionStorage.getItem('flowcart_session_id');
    if (sessionId) {
      return sessionId;
    }

    const newSessionId = this.generateSessionId();
    sessionStorage.setItem('flowcart_session_id', newSessionId);
    return newSessionId;
  }

  /**
   * Create or update a session for the current user
   */
  createSession(businessId: string, userId?: string, businessData?: any): SessionData {
    if (typeof window === 'undefined') {
      throw new Error('Session service can only be used in browser');
    }

    const sessionId = this.getSessionId();
    const now = Date.now();
    const expiresAt = now + this.SESSION_EXPIRY;

    const sessionData: SessionData = {
      sessionId,
      userId,
      businessId,
      businessData,
      timestamp: now,
      expiresAt,
    };

    // Store session data
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

    // Store business ID in localStorage for persistence
    localStorage.setItem('flowcart_business_id', businessId);

    // Cache business data in sessionStorage
    if (businessData) {
      const businessKey = `${this.BUSINESS_PREFIX}${businessId}`;
      sessionStorage.setItem(businessKey, JSON.stringify({
        ...businessData,
        timestamp: now,
        expiresAt: now + this.BUSINESS_CACHE_EXPIRY,
      }));
    }

    // Track session in localStorage (for cleanup)
    this.trackSession(sessionId, businessId, userId);

    return sessionData;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    const sessionId = this.getSessionId();
    if (!sessionId) return null;

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const sessionDataStr = sessionStorage.getItem(sessionKey);

    if (!sessionDataStr) return null;

    try {
      const sessionData: SessionData = JSON.parse(sessionDataStr);

      // Check if session expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession();
        return null;
      }

      // Update last accessed time
      sessionData.timestamp = Date.now();
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

      return sessionData;
    } catch (error) {
      console.error('Error parsing session data:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Get current business ID from session
   */
  getCurrentBusinessId(): string | null {
    const session = this.getSession();
    if (session) {
      return session.businessId;
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('flowcart_business_id');
    }

    return null;
  }

  /**
   * Get cached business data
   */
  getCachedBusinessData(businessId: string): any | null {
    if (typeof window === 'undefined') return null;

    const businessKey = `${this.BUSINESS_PREFIX}${businessId}`;
    const cachedDataStr = sessionStorage.getItem(businessKey);

    if (!cachedDataStr) return null;

    try {
      const cachedData = JSON.parse(cachedDataStr);

      // Check if cache expired
      if (Date.now() > cachedData.expiresAt) {
        sessionStorage.removeItem(businessKey);
        return null;
      }

      return cachedData;
    } catch (error) {
      console.error('Error parsing cached business data:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  updateSession(updates: Partial<SessionData>): void {
    if (typeof window === 'undefined') return;

    const session = this.getSession();
    if (!session) return;

    const updatedSession: SessionData = {
      ...session,
      ...updates,
      timestamp: Date.now(),
    };

    const sessionKey = `${this.SESSION_PREFIX}${session.sessionId}`;
    sessionStorage.setItem(sessionKey, JSON.stringify(updatedSession));
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    if (typeof window === 'undefined') return;

    const sessionId = this.getSessionId();
    if (sessionId) {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      sessionStorage.removeItem(sessionKey);
    }

    sessionStorage.removeItem('flowcart_session_id');
    // Note: We keep businessId in localStorage for convenience
    // but clear it if explicitly requested
  }

  /**
   * Clear all sessions (for logout or cleanup)
   */
  clearAllSessions(): void {
    if (typeof window === 'undefined') return;

    // Clear sessionStorage
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.SESSION_PREFIX) || key.startsWith(this.BUSINESS_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear business ID from localStorage
    localStorage.removeItem('flowcart_business_id');

    // Clear session tracking
    this.clearSessionTracking();
  }

  /**
   * Track session in localStorage for cleanup
   */
  private trackSession(sessionId: string, businessId: string, userId?: string): void {
    if (typeof window === 'undefined') return;

    const trackingKey = 'flowcart_sessions';
    const sessionsStr = localStorage.getItem(trackingKey);
    const sessions: Array<{ sessionId: string; businessId: string; userId?: string; createdAt: number }> = sessionsStr ? JSON.parse(sessionsStr) : [];

    // Add new session
    sessions.push({
      sessionId,
      businessId,
      userId,
      createdAt: Date.now(),
    });

    // Keep only recent sessions (limit to MAX_SESSIONS)
    const sortedSessions = sessions.sort((a, b) => b.createdAt - a.createdAt);
    const recentSessions = sortedSessions.slice(0, this.MAX_SESSIONS);

    localStorage.setItem(trackingKey, JSON.stringify(recentSessions));
  }

  /**
   * Clear session tracking
   */
  private clearSessionTracking(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('flowcart_sessions');
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(sessionStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(this.SESSION_PREFIX)) {
        try {
          const sessionDataStr = sessionStorage.getItem(key);
          if (sessionDataStr) {
            const sessionData: SessionData = JSON.parse(sessionDataStr);
            if (now > sessionData.expiresAt) {
              sessionStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove invalid session data
          sessionStorage.removeItem(key);
        }
      }

      if (key.startsWith(this.BUSINESS_PREFIX)) {
        try {
          const cachedDataStr = sessionStorage.getItem(key);
          if (cachedDataStr) {
            const cachedData = JSON.parse(cachedDataStr);
            if (now > cachedData.expiresAt) {
              sessionStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove invalid cached data
          sessionStorage.removeItem(key);
        }
      }
    });
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    return session !== null && Date.now() < session.expiresAt;
  }

  /**
   * Extend session expiry
   */
  extendSession(): void {
    const session = this.getSession();
    if (!session) return;

    const newExpiresAt = Date.now() + this.SESSION_EXPIRY;
    this.updateSession({ expiresAt: newExpiresAt });
  }

  /**
   * Initialize session service (call on app startup)
   */
  initialize(): void {
    if (typeof window === 'undefined') return;

    // Clean up expired sessions on initialization
    this.cleanupExpiredSessions();

    // Set up periodic cleanup (every 5 minutes)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupExpiredSessions();
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Extend session on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, () => {
        this.extendSession();
      }, { passive: true });
    });
  }
}

// Export singleton instance
export const sessionService = new SessionService();

// Initialize on module load (browser only)
if (typeof window !== 'undefined') {
  sessionService.initialize();
}

