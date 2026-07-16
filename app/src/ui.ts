import { Alert, Platform } from "react-native";

// React Native's Alert.alert does nothing on web (RN-Web). Use window.alert there.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    const w = globalThis as any;
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof w.alert === "function") w.alert(text);
    else console.log(text);
  } else {
    Alert.alert(title, message);
  }
}

// Two-button confirm. Resolves true when the user confirms, false otherwise.
export function confirmDialog(
  title: string,
  message: string,
  confirmLabel: string,
  cancelLabel: string,
): Promise<boolean> {
  if (Platform.OS === "web") {
    const w = globalThis as any;
    const ok = typeof w.confirm === "function" ? w.confirm(`${title}\n\n${message}`) : true;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
