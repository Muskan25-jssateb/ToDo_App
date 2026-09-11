import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../../types';
import { authApi } from '../../api/authApi';
import { TOKEN_STORAGE_KEY } from '../../api/client';

export const CACHED_USER_KEY = '@todo_app_cached_user';
export const REGISTERED_ACCOUNTS_KEY = '@todo_app_registered_accounts';

export interface LocalAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

const DEFAULT_ACCOUNTS: LocalAccount[] = [
  {
    id: 'user_1789110490184',
    name: 'tanmaee',
    email: 'tanmaee@gmail.com',
    password: 'tanmaee123',
    createdAt: '2026-09-11T07:08:10.184Z',
  },
];

export const getLocalAccounts = async (): Promise<LocalAccount[]> => {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_) {}
  await AsyncStorage.setItem(
    REGISTERED_ACCOUNTS_KEY,
    JSON.stringify(DEFAULT_ACCOUNTS)
  );
  return DEFAULT_ACCOUNTS;
};

export const saveLocalAccount = async (account: LocalAccount) => {
  const accounts = await getLocalAccounts();
  const index = accounts.findIndex(
    (a) => a.email.toLowerCase() === account.email.toLowerCase()
  );
  if (index !== -1) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }
  await AsyncStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringToken: true,
  error: null,
};

// Async Thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: { name: string; email: string; password: string },
    { rejectWithValue }
  ) => {
    const normalizedEmail = payload.email.toLowerCase().trim();

    // 1. Try backend registration
    try {
      const data = await authApi.register(
        payload.name.trim(),
        normalizedEmail,
        payload.password
      );
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      await saveLocalAccount({
        id: data.user.id,
        name: data.user.name,
        email: normalizedEmail,
        password: payload.password,
        createdAt: data.user.createdAt,
      });
      return data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      if (error.response?.status === 400) {
        return rejectWithValue(
          'An account with this email address already exists.'
        );
      }

      // 2. Offline registration fallback
      const accounts = await getLocalAccounts();
      const exists = accounts.some(
        (a) => a.email.toLowerCase() === normalizedEmail
      );
      if (exists) {
        return rejectWithValue(
          'An account with this email address already exists. Please sign in.'
        );
      }

      const newAccount: LocalAccount = {
        id: 'user_' + Date.now(),
        name: payload.name.trim(),
        email: normalizedEmail,
        password: payload.password,
        createdAt: new Date().toISOString(),
      };
      await saveLocalAccount(newAccount);

      const userObj: User = {
        id: newAccount.id,
        name: newAccount.name,
        email: newAccount.email,
        createdAt: newAccount.createdAt,
      };
      const offlineToken = 'token_' + newAccount.id;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, offlineToken);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj));

      return {
        success: true,
        message: 'Account registered successfully.',
        token: offlineToken,
        user: userObj,
      };
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    payload: { email: string; password: string },
    { rejectWithValue }
  ) => {
    const normalizedEmail = payload.email.toLowerCase().trim();

    // 1. Try backend login
    try {
      const data = await authApi.login(normalizedEmail, payload.password);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      await saveLocalAccount({
        id: data.user.id,
        name: data.user.name,
        email: normalizedEmail,
        password: payload.password,
        createdAt: data.user.createdAt,
      });
      return data;
    } catch (error: any) {
      // If backend explicitly rejected credentials with 400 or 401, DO NOT bypass!
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      }
      if (error.response?.status === 401 || error.response?.status === 400) {
        return rejectWithValue('Invalid email or password credentials.');
      }

      // 2. Offline authentication: check registered accounts store
      const accounts = await getLocalAccounts();
      const matchedUser = accounts.find(
        (a) => a.email.toLowerCase() === normalizedEmail
      );

      if (!matchedUser) {
        return rejectWithValue(
          'Account not found. Please create an account first or verify your email.'
        );
      }

      if (matchedUser.password !== payload.password) {
        return rejectWithValue(
          'Invalid password. Please check your password and try again.'
        );
      }

      // Password matches
      const userObj: User = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        createdAt: matchedUser.createdAt,
      };
      const offlineToken = 'token_' + matchedUser.id;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, offlineToken);
      await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(userObj));

      return {
        success: true,
        message: 'Logged in successfully.',
        token: offlineToken,
        user: userObj,
      };
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await authApi.getProfile();
      return data.user;
    } catch (error: any) {
      const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const restoreStoredToken = createAsyncThunk(
  'auth/restoreStoredToken',
  async () => {
    const token = await authApi.getStoredToken();
    if (token) {
      try {
        const profile = await authApi.getProfile();
        await AsyncStorage.setItem(
          CACHED_USER_KEY,
          JSON.stringify(profile.user)
        );
        return { token, user: profile.user };
      } catch (e) {
        const cached = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (cached) {
          try {
            return { token, user: JSON.parse(cached) };
          } catch (_) {}
        }
        return { token, user: DEFAULT_ACCOUNTS[0] };
      }
    }
    return { token: null, user: null };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authApi.logout();
  await AsyncStorage.removeItem(CACHED_USER_KEY);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Restore Token
    builder.addCase(restoreStoredToken.pending, (state) => {
      state.isRestoringToken = true;
    });
    builder.addCase(restoreStoredToken.fulfilled, (state, action) => {
      state.isRestoringToken = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = !!action.payload.token;
    });
    builder.addCase(restoreStoredToken.rejected, (state) => {
      state.isRestoringToken = false;
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    });

    // Profile
    builder.addCase(
      fetchUserProfile.fulfilled,
      (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      }
    );

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
