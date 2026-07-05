import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({ baseURL: `${BASE}/api`, timeout: 15000 });

const KEY = "ourspace_token";
const isWeb = Platform.OS === "web";

export const saveToken = async (t: string) => {
  if (isWeb) await AsyncStorage.setItem(KEY, t);
  else await SecureStore.setItemAsync(KEY, t);
};
export const getToken = async () => {
  if (isWeb) return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
};
export const clearToken = async () => {
  if (isWeb) await AsyncStorage.removeItem(KEY);
  else await SecureStore.deleteItemAsync(KEY);
};

api.interceptors.request.use(async (config) => {
  const t = await getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});
