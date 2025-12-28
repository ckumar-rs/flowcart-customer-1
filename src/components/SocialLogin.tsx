'use client';

import { useState, useEffect } from 'react';
import { Chrome, Facebook } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

interface SocialLoginProps {
  onSuccess?: (provider: string, token: string) => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    google?: any;
    FB?: any;
    gapi?: any;
  }
}

export default function SocialLogin({ onSuccess, onError }: SocialLoginProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [facebookLoaded, setFacebookLoaded] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  // Check if SDKs are already available on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.google) {
        setGoogleLoaded(true);
      }
      if (window.FB) {
        setFacebookLoaded(true);
      }
    }
  }, []);

  // Load Google OAuth script
  useEffect(() => {
    const handleGoogleCallback = async (response: any) => {
      if (!response.credential) {
        toast.error('Google login failed');
        onError?.('Google login failed');
        setLoading(null);
        return;
      }

      try {
        // Send credential to backend for verification
        const apiClient = (await import('@/services/api/client')).apiClient;
        const authResponse = await apiClient.post('/api/auth/google', {
          credential: response.credential,
        });

        const { token, refreshToken, user } = authResponse.data;

        // Store tokens
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Update auth store
        setToken(token);
        setUser(user);

        toast.success('Logged in with Google successfully!');
        onSuccess?.('google', token);
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Google login error:', error);
        toast.error(error.response?.data?.message || 'Failed to login with Google');
        onError?.(error.message);
      } finally {
        setLoading(null);
      }
    };

    const initializeGoogle = () => {
      try {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.warn('Google Client ID not configured');
          setGoogleLoaded(false);
          return;
        }

        if (!window.google) {
          console.error('window.google is not available');
          setGoogleLoaded(false);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCallback,
        });
        
          setGoogleLoaded(true);
          setGoogleLoading(false);
          console.log('Google OAuth initialized successfully');
        } catch (error) {
          console.error('Error initializing Google OAuth:', error);
          setGoogleLoaded(false);
          setGoogleLoading(false);
        }
      };

    const loadGoogleScript = () => {
      if (window.google) {
        setGoogleLoading(false);
        initializeGoogle();
        return;
      }

      setGoogleLoading(true);

      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          if (window.google) {
            initializeGoogle();
          }
        });
        // Also check if it's already loaded
        if (window.google) {
          initializeGoogle();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google OAuth script loaded');
        if (window.google) {
          initializeGoogle();
        } else {
          console.error('Google OAuth script loaded but window.google is not available');
          setGoogleLoaded(false);
          setGoogleLoading(false);
        }
      };

      script.onerror = (error) => {
        console.error('Failed to load Google OAuth script:', error);
        setGoogleLoaded(false);
        setGoogleLoading(false);
        toast.error('Failed to load Google OAuth. Please check your internet connection and try again.');
      };

      document.head.appendChild(script);
    };

    const initializeFacebook = () => {
      try {
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        if (!appId) {
          console.warn('Facebook App ID not configured');
          setFacebookLoaded(false);
          return;
        }

        if (!window.FB) {
          console.error('window.FB is not available');
          setFacebookLoaded(false);
          return;
        }

        // Check if already initialized
        try {
          const currentAppId = window.FB.getAppId();
          if (currentAppId === appId) {
            console.log('Facebook SDK already initialized');
            setFacebookLoaded(true);
            return;
          }
        } catch (e) {
          // getAppId might throw if not initialized, which is fine
        }

        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
        
        setFacebookLoaded(true);
        setFacebookLoading(false);
        console.log('Facebook SDK initialized successfully');
      } catch (error) {
        console.error('Error initializing Facebook SDK:', error);
        setFacebookLoaded(false);
        setFacebookLoading(false);
      }
    };

    const loadFacebookScript = () => {
      if (window.FB) {
        setFacebookLoading(false);
        initializeFacebook();
        return;
      }

      setFacebookLoading(true);

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="connect.facebook.net"]');
      if (existingScript) {
        // If script is already marked as loaded, initialize immediately
        if (existingScript.hasAttribute('data-loaded')) {
          if (window.FB) {
            initializeFacebook();
          } else {
            // Wait a bit for window.FB to be available
            const checkFB = setInterval(() => {
              if (window.FB) {
                clearInterval(checkFB);
                initializeFacebook();
              }
            }, 100);
            setTimeout(() => clearInterval(checkFB), 3000);
          }
        } else {
          // Script exists but not loaded yet, wait for it
          existingScript.addEventListener('load', () => {
            existingScript.setAttribute('data-loaded', 'true');
            const checkFB = setInterval(() => {
              if (window.FB) {
                clearInterval(checkFB);
                initializeFacebook();
              }
            }, 100);
            setTimeout(() => clearInterval(checkFB), 3000);
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('Facebook SDK script loaded');
        // Mark script as loaded
        script.setAttribute('data-loaded', 'true');
        
        // Wait a bit for window.FB to be available (sometimes it takes a moment)
        const checkFB = setInterval(() => {
          if (window.FB) {
            clearInterval(checkFB);
            initializeFacebook();
          }
        }, 100);

        // Timeout after 3 seconds
        setTimeout(() => {
          clearInterval(checkFB);
          if (window.FB) {
            initializeFacebook();
          } else {
            console.error('Facebook SDK script loaded but window.FB is not available after 3 seconds');
            setFacebookLoaded(false);
          }
        }, 3000);
      };

      script.onerror = (error) => {
        console.error('Failed to load Facebook SDK script:', error);
        setFacebookLoaded(false);
        toast.error('Failed to load Facebook SDK. Please check your internet connection and try again.');
      };

      document.head.appendChild(script);
    };

    // Load scripts with retry mechanism
    const loadScripts = () => {
      // Only load if environment variables are set
      if (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        // Check if already available
        if (window.google) {
          setGoogleLoaded(true);
          setGoogleLoading(false);
        } else {
          loadGoogleScript();
        }
      } else {
        // No Google Client ID configured, mark as not loading
        setGoogleLoading(false);
      }

      if (process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
        // Check if already available
        if (window.FB) {
          setFacebookLoaded(true);
          setFacebookLoading(false);
        } else {
          loadFacebookScript();
        }
      } else {
        // No Facebook App ID configured, mark as not loading
        setFacebookLoading(false);
      }
    };

    // Initial load
    loadScripts();

    // Retry loading if not loaded after 3 seconds
    const retryTimeout = setTimeout(() => {
      if (!googleLoaded && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.log('Retrying Google OAuth script load...');
        loadGoogleScript();
      }
      if (!facebookLoaded && process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
        console.log('Retrying Facebook SDK script load...');
        loadFacebookScript();
      }
    }, 3000);

    return () => {
      clearTimeout(retryTimeout);
    };
  }, [router, setToken, setUser, onSuccess, onError, googleLoaded, facebookLoaded]);

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      // Wait for Google to be loaded (with timeout)
      if (!googleLoaded && !window.google) {
        // Try to wait a bit for it to load
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        if (!window.google) {
          toast.error('Google OAuth is still loading. Please wait a moment and try again.');
          setLoading(null);
          return;
        }
      }

      if (!window.google) {
        toast.error('Google OAuth is not loaded. Please refresh the page.');
        setLoading(null);
        return;
      }

      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        toast.error('Google OAuth is not configured. Please use email/password login.');
        setLoading(null);
        return;
      }

      // Use One Tap or fallback to popup
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup OAuth flow
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              scope: 'email profile',
              callback: async (tokenResponse: any) => {
                try {
                  const apiClient = (await import('@/services/api/client')).apiClient;
                  const userInfoResponse = await fetch(
                    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`
                  );
                  
                  if (!userInfoResponse.ok) {
                    throw new Error('Failed to fetch user info from Google');
                  }
                  
                  const userInfo = await userInfoResponse.json();

                  const authResponse = await apiClient.post('/api/auth/google', {
                    email: userInfo.email,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    googleId: userInfo.id,
                    accessToken: tokenResponse.access_token,
                  });

                  const { token, refreshToken, user } = authResponse.data;

                  if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));
                  }

                  setToken(token);
                  setUser(user);

                  toast.success('Logged in with Google successfully!');
                  onSuccess?.('google', token);
                  router.push('/dashboard');
                } catch (error: any) {
                  console.error('Google login error:', error);
                  toast.error(error.response?.data?.message || 'Failed to login with Google');
                  onError?.(error.message);
                } finally {
                  setLoading(null);
                }
              },
            });
            tokenClient.requestAccessToken();
          }
        });
      } catch (error: any) {
        console.error('Error triggering Google login:', error);
        toast.error('Failed to start Google login. Please try again.');
        setLoading(null);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Failed to login with Google');
      onError?.(error.message);
      setLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading('facebook');
    try {
      // Wait for Facebook SDK to be fully loaded (with multiple retries)
      let retries = 0;
      const maxRetries = 10; // Wait up to 5 seconds (10 * 500ms)
      
      while (!window.FB && retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }

      if (!window.FB) {
        // Check if script is still loading
        const script = document.querySelector('script[src*="connect.facebook.net"]');
        if (script && !script.hasAttribute('data-loaded')) {
          toast.error('Facebook SDK is taking longer than expected. Please wait a moment and try again.');
        } else {
          toast.error('Facebook SDK failed to load. Please refresh the page or check your internet connection.');
        }
        setLoading(null);
        return;
      }

      // Verify Facebook SDK is initialized
      if (!facebookLoaded) {
        // Try to initialize if not already done
        const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
        if (appId && window.FB && !window.FB.getAppId()) {
          try {
            window.FB.init({
              appId: appId,
              cookie: true,
              xfbml: true,
              version: 'v18.0',
            });
            setFacebookLoaded(true);
          } catch (error) {
            console.error('Error initializing Facebook SDK on demand:', error);
          }
        }
      }

      if (!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
        toast.error('Facebook OAuth is not configured. Please use email/password login.');
        setLoading(null);
        return;
      }

      window.FB.login(
        async (response: any) => {
          if (response.authResponse) {
            try {
              // Get user info from Facebook
              window.FB.api('/me', { fields: 'id,name,email,first_name,last_name' }, async (userInfo: any) => {
                try {
                  const apiClient = (await import('@/services/api/client')).apiClient;
                  const authResponse = await apiClient.post('/api/auth/facebook', {
                    email: userInfo.email,
                    firstName: userInfo.first_name,
                    lastName: userInfo.last_name,
                    facebookId: userInfo.id,
                    accessToken: response.authResponse.accessToken,
                  });

                  const { token, refreshToken, user } = authResponse.data;

                  if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));
                  }

                  setToken(token);
                  setUser(user);

                  toast.success('Logged in with Facebook successfully!');
                  onSuccess?.('facebook', token);
                  router.push('/dashboard');
                } catch (error: any) {
                  console.error('Facebook login error:', error);
                  toast.error(error.response?.data?.message || 'Failed to login with Facebook');
                  onError?.(error.message);
                } finally {
                  setLoading(null);
                }
              });
            } catch (error: any) {
              console.error('Facebook API error:', error);
              toast.error('Failed to get Facebook user information');
              onError?.(error.message);
              setLoading(null);
            }
          } else {
            toast.error('Facebook login was cancelled or failed');
            onError?.('Facebook login cancelled');
            setLoading(null);
          }
        },
        { scope: 'email,public_profile' }
      );
    } catch (error: any) {
      console.error('Facebook login error:', error);
      toast.error('Failed to login with Facebook');
      onError?.(error.message);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading !== null || (googleLoading && !window.google && !googleLoaded)}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={googleLoading && !window.google ? 'Google OAuth is loading...' : ''}
        >
          <Chrome className="w-5 h-5" />
          {loading === 'google' 
            ? 'Loading...' 
            : (googleLoading && !window.google && !googleLoaded 
              ? 'Loading SDK...' 
              : 'Google')}
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={loading !== null || (facebookLoading && !window.FB && !facebookLoaded)}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={facebookLoading && !window.FB ? 'Facebook SDK is loading...' : ''}
        >
          <Facebook className="w-5 h-5 text-blue-600" />
          {loading === 'facebook' 
            ? 'Loading...' 
            : (facebookLoading && !window.FB && !facebookLoaded 
              ? 'Loading SDK...' 
              : 'Facebook')}
        </button>
      </div>
    </div>
  );
}

