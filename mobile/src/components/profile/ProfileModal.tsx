import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import * as authApi from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import { color, control, font, space, textMuted } from "../../theme";

type Mode = "view" | "changePassword";

export interface PopoverAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

const POPOVER_WIDTH = 280;

// Anchored dropdown near the trigger element (the avatar), not a centered
// dialog — `anchor` comes from measuring that element with measureInWindow,
// which reports true screen coordinates matching Modal's own coordinate
// space (SafeAreaView-relative layout wouldn't line up here).
export function ProfileModal({
  visible,
  onClose,
  anchor,
}: {
  visible: boolean;
  onClose: () => void;
  anchor: PopoverAnchor | null;
}) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<Mode>("view");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMode("view");
      setCurrentPassword("");
      setNewPassword("");
      setError("");
      setSuccess(false);
    }
  }, [visible]);

  const handleChangePassword = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to change password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!anchor) return null;

  const screenWidth = Dimensions.get("window").width;
  const popoverStyle = {
    top: anchor.y + anchor.height + 8,
    right: Math.max(space[4], screenWidth - (anchor.x + anchor.width)),
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.popover, popoverStyle]}
          onPress={(e) => e.stopPropagation()}
        >
          {mode === "view" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldValue}>{user?.name ?? "—"}</Text>
              </View>
              <View style={styles.fieldLast}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text
                  style={[styles.fieldValue, styles.field]}
                  numberOfLines={1}
                >
                  {user?.email ?? "—"}
                </Text>
              </View>

              <Pressable
                style={styles.linkRow}
                onPress={() => setMode("changePassword")}
              >
                <Text style={styles.linkRowText}>Change password</Text>
              </Pressable>

              <Pressable style={styles.logoutButton} onPress={() => logout()}>
                <Text style={styles.logoutText}>Log out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Change password</Text>

              {success ? (
                <>
                  <Text style={styles.successText}>
                    Your password has been updated.
                  </Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => setMode("view")}
                  >
                    <Text style={styles.primaryButtonText}>Done</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Current password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••"
                    placeholderTextColor={textMuted(0.45)}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />

                  <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
                    New password
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••"
                    placeholderTextColor={textMuted(0.45)}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Pressable
                    style={styles.primaryButton}
                    onPress={handleChangePassword}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color={color.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => setMode("view")}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  popover: {
    position: "absolute",
    width: POPOVER_WIDTH,
    backgroundColor: color.surface,
    padding: space[4],
    gap: space[2],
    elevation: 8,
    shadowColor: color.neutral900,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: { fontFamily: font.headingBold, fontSize: 17, color: color.text },
  field: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: color.divider,
  },
  fieldLast: { paddingVertical: 10 },
  fieldLabel: {
    fontFamily: font.body,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: textMuted(0.55),
    marginBottom: 4,
  },
  fieldLabelSpaced: { marginTop: space[2] },
  fieldValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.text,
  },
  linkRow: {
    height: 44,
    justifyContent: "center",
    // borderBottomWidth: 1,
    // borderBottomColor: color.divider,
  },
  linkRowText: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.accent700,
  },
  logoutButton: {
    height: 44,
    backgroundColor: color.accent700,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: {
    fontFamily: font.body,
    fontSize: 14,
    fontWeight: "600",
    color: color.white,
  },
  input: {
    height: control.input,
    borderWidth: 1,
    borderColor: color.neutral400,
    backgroundColor: color.white,
    paddingHorizontal: space[3],
    fontFamily: font.body,
    fontSize: 15,
    color: color.text,
  },
  error: { fontFamily: font.body, color: color.accent700, fontSize: 12 },
  successText: { fontFamily: font.body, fontSize: 14, color: color.text },
  primaryButton: {
    height: 44,
    backgroundColor: color.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space[1],
  },
  primaryButtonText: {
    fontFamily: font.body,
    fontSize: 15,
    fontWeight: "600",
    color: color.white,
  },
  cancelButton: { height: 40, alignItems: "center", justifyContent: "center" },
  cancelButtonText: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    color: textMuted(0.7),
  },
});
