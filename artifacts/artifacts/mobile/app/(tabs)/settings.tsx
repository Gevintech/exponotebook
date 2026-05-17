import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PremiumModal } from "@/components/PremiumModal";
import { useNotes, type SortOption } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import { FREE_NOTE_LIMIT, useSubscription } from "@/lib/revenuecat";

const SORT_OPTIONS: {
  key: SortOption;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: "updatedAt", label: "Last modified", icon: "clock" },
  { key: "createdAt", label: "Date created", icon: "calendar" },
  { key: "title", label: "Title A–Z", icon: "type" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, sortBy, setSortBy } = useNotes();
  const { isSubscribed, offerings, restore, isRestoring } = useSubscription();
  const colorScheme = useColorScheme();
  const [showPremium, setShowPremium] = useState(false);

  const totalWords = notes.reduce(
    (acc, n) => acc + n.content.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const pinnedCount = notes.filter((n) => n.isPinned).length;
  const pkg = offerings?.current?.availablePackages[0];
  const price = pkg?.product.priceString ?? "$4.99";

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 + 84 : insets.bottom + 90;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad, paddingBottom: bottomPad },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

      <Animated.Text
        entering={FadeInDown.springify()}
        style={[styles.pageTitle, { color: colors.foreground }]}
      >
        Settings
      </Animated.Text>

      {!isSubscribed ? (
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => setShowPremium(true)}
          >
            <LinearGradient
              colors={["#1A3829", "#2D6A4F", "#40916C"]}
              style={[styles.premiumCard, { borderRadius: colors.radius + 2 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.premiumTop}>
                <View style={styles.premiumIcon}>
                  <Ionicons name="sparkles" size={22} color="#FFD700" />
                </View>
                <View style={styles.premiumText}>
                  <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                  <Text style={styles.premiumSubtitle}>
                    Unlimited notes, all colors & more
                  </Text>
                </View>
                <Text style={styles.premiumPrice}>{price}/mo</Text>
              </View>
              <View style={styles.premiumFeatures}>
                {["Unlimited notes", "All 6 colors", "Export notes", "Custom categories"].map(
                  (f) => (
                    <View key={f} style={styles.premiumFeatureItem}>
                      <Feather name="check" size={11} color="#74C69D" />
                      <Text style={styles.premiumFeatureText}>{f}</Text>
                    </View>
                  )
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          style={[
            styles.premiumActiveCard,
            {
              backgroundColor: colors.secondary,
              borderRadius: colors.radius,
              borderColor: colors.primary + "40",
            },
          ]}
        >
          <Ionicons name="sparkles" size={18} color="#FFD700" />
          <View style={styles.premiumActiveText}>
            <Text style={[styles.premiumActiveTitle, { color: colors.primary }]}>
              Premium Active
            </Text>
            <Text style={[styles.premiumActiveSub, { color: colors.mutedForeground }]}>
              Enjoying all premium features
            </Text>
          </View>
          <Feather name="check-circle" size={20} color={colors.primary} />
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
        <StatCard value={String(notes.length)} label="Notes" suffix={!isSubscribed ? `/${FREE_NOTE_LIMIT}` : undefined} colors={colors} />
        <StatCard value={String(totalWords)} label="Words" colors={colors} />
        <StatCard value={String(pinnedCount)} label="Pinned" colors={colors} />
      </Animated.View>

      <SectionHeader label="Sort by" colors={colors} delay={150} />

      <Animated.View
        entering={FadeInDown.delay(175).springify()}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {SORT_OPTIONS.map((opt, i) => (
          <React.Fragment key={opt.key}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                Haptics.selectionAsync();
                setSortBy(opt.key);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Feather
                  name={opt.icon}
                  size={17}
                  color={sortBy === opt.key ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.rowLabel,
                    { color: sortBy === opt.key ? colors.primary : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
              </View>
              {sortBy === opt.key && (
                <Feather name="check" size={17} color={colors.primary} />
              )}
            </TouchableOpacity>
            {i < SORT_OPTIONS.length - 1 && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
          </React.Fragment>
        ))}
      </Animated.View>

      <SectionHeader label="Appearance" colors={colors} delay={200} />

      <Animated.View
        entering={FadeInDown.delay(225).springify()}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons
              name={colorScheme === "dark" ? "moon" : "sunny"}
              size={17}
              color={colors.mutedForeground}
            />
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Theme</Text>
          </View>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
            {colorScheme === "dark" ? "Dark" : "Light"} (system)
          </Text>
        </View>
      </Animated.View>

      {isSubscribed && (
        <>
          <SectionHeader label="Subscription" colors={colors} delay={250} />
          <Animated.View
            entering={FadeInDown.delay(275).springify()}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <TouchableOpacity style={styles.row} onPress={restore} activeOpacity={0.7}>
              <View style={styles.rowLeft}>
                <Feather name="refresh-cw" size={17} color={colors.mutedForeground} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Restore purchases
                </Text>
              </View>
              {isRestoring ? (
                <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                  Restoring…
                </Text>
              ) : (
                <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </>
      )}

      <SectionHeader label="About" colors={colors} delay={300} />
      <Animated.View
        entering={FadeInDown.delay(325).springify()}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name="book" size={17} color={colors.mutedForeground} />
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Notebook</Text>
          </View>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>v1.0</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather name="hard-drive" size={17} color={colors.mutedForeground} />
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Storage</Text>
          </View>
          <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
            Local (on device)
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function SectionHeader({
  label,
  colors,
  delay = 0,
}: {
  label: string;
  colors: ReturnType<typeof useColors>;
  delay?: number;
}) {
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.sectionHeader, { color: colors.mutedForeground }]}
    >
      {label.toUpperCase()}
    </Animated.Text>
  );
}

function StatCard({
  value,
  label,
  suffix,
  colors,
}: {
  value: string;
  label: string;
  suffix?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        statStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <Text style={[statStyles.value, { color: colors.primary }]}>
        {value}
        {suffix && <Text style={[statStyles.suffix, { color: colors.mutedForeground }]}>{suffix}</Text>}
      </Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderWidth: 1,
    gap: 2,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  suffix: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  pageTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  premiumCard: {
    padding: 18,
    gap: 12,
    marginBottom: 16,
  },
  premiumTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  premiumIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,215,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  premiumText: { flex: 1 },
  premiumTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  premiumSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  premiumPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  premiumFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  premiumFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  premiumFeatureText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  premiumActiveCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  premiumActiveText: { flex: 1 },
  premiumActiveTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  premiumActiveSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 6,
  },
  card: { borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  rowValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
});
