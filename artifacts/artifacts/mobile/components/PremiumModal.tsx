import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/lib/revenuecat";

const FEATURES = [
  {
    icon: "infinity" as const,
    title: "Unlimited notes",
    desc: "No limits — write as much as you want",
  },
  {
    icon: "droplet" as const,
    title: "All note colors",
    desc: "6 beautiful color themes for your notes",
  },
  {
    icon: "share" as const,
    title: "Export notes",
    desc: "Share as text, copy or email your notes",
  },
  {
    icon: "tag" as const,
    title: "Custom categories",
    desc: "Organize notes with unlimited categories",
  },
  {
    icon: "zap" as const,
    title: "Priority sorting",
    desc: "Advanced sort & filter options",
  },
];

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

export function PremiumModal({ visible, onClose, reason }: PremiumModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { offerings, purchase, restore, isPurchasing, isRestoring, isSubscribed } =
    useSubscription();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentOffering = offerings?.current;
  const pkg = currentOffering?.availablePackages[0];
  const price = pkg?.product.priceString ?? "$4.99";
  const period = "/ month";

  if (isSubscribed) {
    onClose();
    return null;
  }

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (__DEV__) {
      setConfirmVisible(true);
    } else {
      doPurchase();
    }
  };

  const doPurchase = async () => {
    if (!pkg) {
      Alert.alert("Not available", "Subscription not available right now. Try again later.");
      return;
    }
    try {
      await purchase(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert("Purchase failed", err?.message ?? "Something went wrong.");
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Restored", "Your purchases have been restored.");
    } catch {
      Alert.alert("Restore failed", "No purchases found to restore.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {confirmVisible && (
        <View style={styles.confirmOverlay}>
          <View
            style={[
              styles.confirmBox,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>
              Confirm Purchase
            </Text>
            <Text style={[styles.confirmBody, { color: colors.mutedForeground }]}>
              Purchase Notebook Premium for {price}/month?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.muted }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setConfirmVisible(false);
                  doPurchase();
                }}
              >
                <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <LinearGradient
        colors={["#1A3829", "#2D6A4F", "#40916C"]}
        style={[styles.root, { paddingTop: insets.top + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <View style={styles.closeCircle}>
            <Feather name="x" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.heroSection}>
            <View style={styles.crownWrap}>
              <Ionicons name="sparkles" size={36} color="#FFD700" />
            </View>
            <Text style={styles.heroTitle}>Notebook Premium</Text>
            <Text style={styles.heroSubtitle}>
              Unlock the full power of your notes
            </Text>
          </View>

          {reason ? (
            <View style={styles.reasonBanner}>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          <View style={styles.featuresCard}>
            {FEATURES.map((f, i) => (
              <View key={f.icon} style={[styles.featureRow, i > 0 && styles.featureBorder]}>
                <View style={styles.featureIcon}>
                  <Feather name={f.icon} size={18} color="#74C69D" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
                <Feather name="check" size={16} color="#74C69D" />
              </View>
            ))}
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Start today</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>{price}</Text>
              <Text style={styles.pricePeriod}>{period}</Text>
            </View>
            <Text style={styles.priceNote}>Cancel anytime. No commitment.</Text>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={styles.subscribeBtn}
              onPress={handleSubscribe}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#2D6A4F" />
              ) : (
                <Text style={styles.subscribeBtnText}>Subscribe Now</Text>
              )}
            </Pressable>
          </Animated.View>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            <Text style={styles.restoreText}>
              {isRestoring ? "Restoring…" : "Restore purchases"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            Subscription auto-renews monthly. Cancel anytime in your App Store / Play Store
            account settings.
          </Text>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 16,
    right: 16,
    zIndex: 10,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  heroSection: {
    alignItems: "center",
    paddingTop: 24,
    gap: 10,
  },
  crownWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,215,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  reasonBanner: {
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  reasonText: {
    color: "#FFD700",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  featuresCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  featureBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(116,198,157,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  priceSection: {
    alignItems: "center",
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  priceAmount: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  pricePeriod: {
    fontSize: 18,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  priceNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  subscribeBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  subscribeBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#2D6A4F",
    letterSpacing: 0.2,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
  legal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 16,
    paddingBottom: 8,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 24,
  },
  confirmBox: {
    width: "100%",
    padding: 20,
    gap: 14,
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  confirmBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
