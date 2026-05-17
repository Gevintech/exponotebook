import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    gradient: ["#1A3829", "#2D6A4F"] as [string, string],
    icon: "book-open" as const,
    iconLib: "feather",
    title: "Your thoughts,\nbeautifully organized",
    body: "Write notes, ideas, to-dos and more. Everything in one clean, focused place.",
  },
  {
    gradient: ["#1A2A4A", "#2D5086"] as [string, string],
    icon: "pin",
    iconLib: "ionicons",
    title: "Never lose what\nmatters most",
    body: "Pin important notes, add colors, and organize with categories. Find anything instantly.",
  },
  {
    gradient: ["#2A1A3A", "#5B2D8A"] as [string, string],
    icon: "sparkles",
    iconLib: "ionicons",
    title: "Go Premium,\nunlock everything",
    body: "Unlimited notes, all colors, export & more. Cancel anytime.",
  },
];

const ONBOARDING_KEY = "@notebook_onboarding_done";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) setShowOnboarding(true);
      setChecked(true);
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "done");
    setShowOnboarding(false);
  };

  return { showOnboarding: checked && showOnboarding, dismissOnboarding: dismiss };
}

interface OnboardingModalProps {
  visible: boolean;
  onDone: () => void;
}

export function OnboardingModal({ visible, onDone }: OnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideUp, { toValue: 0, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      const next = currentSlide + 1;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
      setCurrentSlide(next);
    } else {
      onDone();
    }
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={slide.gradient}
        style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Animated.View
                style={[
                  styles.slideContent,
                  { opacity: fadeAnim, transform: [{ translateY: slideUp }] },
                ]}
              >
                <View style={styles.iconCircle}>
                  {s.iconLib === "ionicons" ? (
                    <Ionicons name={s.icon as any} size={48} color="#FFFFFF" />
                  ) : (
                    <Feather name={s.icon as any} size={48} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.body}>{s.body}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { opacity: i === currentSlide ? 1 : 0.3, width: i === currentSlide ? 20 : 6 },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{isLast ? "Get Started" : "Continue"}</Text>
            <Feather name="arrow-right" size={18} color="#2D6A4F" />
          </TouchableOpacity>

          {!isLast && (
            <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  slideContent: {
    alignItems: "center",
    gap: 20,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 32,
    width: "100%",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#2D6A4F",
  },
  skipBtn: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
});
