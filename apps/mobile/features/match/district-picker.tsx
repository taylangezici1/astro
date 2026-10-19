import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { Theme } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useT } from "@/lib/i18n";
import { getDistricts, type District } from "@/lib/api";

interface Props {
  value: District | null;
  onChange: (district: District) => void;
}

/**
 * The district list is ~80 KB and effectively static, so it's fetched once
 * per app session and shared by every picker (signup, edit birth details).
 */
let cachedDistricts: Promise<District[]> | null = null;

function loadDistricts(): Promise<District[]> {
  cachedDistricts ??= getDistricts().catch((err: unknown) => {
    cachedDistricts = null; // let the next attempt retry
    throw err;
  });
  return cachedDistricts;
}

export function DistrictPicker({ value, onChange }: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState<District[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadDistricts()
      .then((all) => {
        if (!cancelled) setDistricts(all);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const filtered = useMemo(() => {
    if (!districts) return [];
    const q = normalize(query).trim();
    if (!q) return districts;
    return districts.filter(
      (d) => normalize(d.name).includes(q) || normalize(d.province).includes(q),
    );
  }, [districts, query]);

  const handleSelect = (district: District) => {
    onChange(district);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && styles.triggerPressed,
        ]}>
        <View style={styles.triggerLeft}>
          <ThemedText style={styles.triggerIcon}>📍</ThemedText>
          <ThemedText style={styles.triggerText}>
            {value
              ? `${value.name}, ${value.province}`
              : t.form.placeholders.districtTrigger}
          </ThemedText>
        </View>
        <ThemedText style={styles.triggerCaret}>▾</ThemedText>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{t.districts.title}</ThemedText>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <ThemedText style={styles.cancel}>{t.common.cancel}</ThemedText>
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.form.placeholders.districtSearch}
            placeholderTextColor={theme.placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />

          {failed ? (
            <View style={styles.errorBanner}>
              <ThemedText style={styles.errorText}>{t.districts.loadFailed}</ThemedText>
              <Pressable
                onPress={() => {
                  setFailed(false);
                  setAttempt((n) => n + 1);
                }}
                hitSlop={8}>
                <ThemedText style={styles.retry}>{t.common.retry}</ThemedText>
              </Pressable>
            </View>
          ) : !districts ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <ThemedText style={styles.empty}>{t.districts.empty}</ThemedText>
              }
              renderItem={({ item }) => {
                const selected = value?.id === item.id;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                      selected && styles.rowSelected,
                    ]}>
                    <View style={styles.rowLeft}>
                      <ThemedText style={styles.rowName}>{item.name}</ThemedText>
                      <ThemedText style={styles.rowProvince}>
                        {item.province}
                      </ThemedText>
                    </View>
                    {selected ? (
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

/** Same Turkish-aware normalisation the API uses, so client filter matches. */
function normalize(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.inputBackground,
      minHeight: 48,
    },
    triggerPressed: {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.accentBorder,
    },
    triggerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    triggerIcon: {
      fontSize: 16,
    },
    triggerText: {
      fontSize: 15,
      color: theme.text,
      flex: 1,
    },
    triggerCaret: {
      fontSize: 14,
      color: theme.muted,
    },
    modalRoot: {
      flex: 1,
      padding: 20,
      gap: 16,
      backgroundColor: theme.background,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    cancel: {
      color: theme.accent,
      fontWeight: "600",
      fontSize: 16,
    },
    search: {
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.text,
      backgroundColor: theme.inputBackground,
      fontSize: 15,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    empty: {
      textAlign: "center",
      color: theme.muted,
      paddingTop: 32,
    },
    errorBanner: {
      backgroundColor: theme.danger + "22",
      borderRadius: 12,
      padding: 14,
      gap: 8,
    },
    errorText: {
      color: theme.danger,
    },
    retry: {
      color: theme.accent,
      fontWeight: "700",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 4,
    },
    rowPressed: {
      backgroundColor: theme.surfaceMuted,
    },
    rowSelected: {
      backgroundColor: theme.accentSoft,
    },
    rowLeft: {
      flex: 1,
    },
    rowName: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    rowProvince: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2,
    },
    checkmark: {
      color: theme.accent,
      fontSize: 18,
      fontWeight: "700",
    },
  });
}
