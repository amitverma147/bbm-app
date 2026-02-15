// Polyfills for React Native environment
import "react-native-url-polyfill/auto";

// Create a proper in-memory storage for localStorage polyfill
const memoryStorage: { [key: string]: string } = {};

// Polyfill for window object - required for AsyncStorage
if (typeof window === "undefined") {
  // @ts-ignore
  global.window = global;
}

// Add event listener polyfills to window
if (!global.window.addEventListener) {
  // @ts-ignore
  global.window.addEventListener = () => {};
}
if (!global.window.removeEventListener) {
  // @ts-ignore
  global.window.removeEventListener = () => {};
}

// Polyfill for localStorage with proper implementation
if (typeof window !== "undefined" && !window.localStorage) {
  // @ts-ignore
  window.localStorage = {
    getItem: (key: string) => {
      return memoryStorage[key] || null;
    },
    setItem: (key: string, value: string) => {
      memoryStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
    },
    get length() {
      return Object.keys(memoryStorage).length;
    },
    key: (index: number) => {
      const keys = Object.keys(memoryStorage);
      return keys[index] || null;
    },
  };
}

// Also set as global for any direct access
if (typeof localStorage === "undefined") {
  // @ts-ignore
  global.localStorage = window.localStorage;
}
