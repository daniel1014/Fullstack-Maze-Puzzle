import Cookies from 'js-cookie';

export const TOKEN_KEY = 'access_token';

export const authUtils = {
  setToken: (token: string) => {
    Cookies.set(TOKEN_KEY, token, { 
      expires: 1, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' 
    });
  },

  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken: () => {
    Cookies.remove(TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },
};

export default authUtils;