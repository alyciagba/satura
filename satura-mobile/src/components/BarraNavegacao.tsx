import { usePathname, useRouter } from "expo-router";
import { Bookmark, House, UserRound, WandSparkles } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

interface BarraNavegacaoProps {
  savedCount?: number;
}

export function BarraNavegacao({ savedCount = 0 }: BarraNavegacaoProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    {
      id: "home",
      route: "/home",
      label: "Início",
      icon: House,
    },
    {
      id: "criar",
      route: "/criar_paleta",
      label: "Criar",
      icon: WandSparkles,
    },
    {
      id: "salvas",
      route: "/paletas_salvas",
      label: "Salvas",
      icon: Bookmark,
      badge: savedCount > 0 ? savedCount : undefined,
    },
    {
      id: "perfil",
      route: "/perfil",
      label: "Perfil",
      icon: UserRound,
    },
  ];

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.route ||
          (tab.id === "home" && pathname === "/") ||
          (tab.id === "criar" && pathname === "/resultado_paleta");

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => {
              if (pathname !== tab.route) {
                router.replace(tab.route as any);
              }
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label}${tab.badge ? `, ${tab.badge} itens` : ""}`}
          >
            {isActive && <View style={styles.activeIndicator} />}

            <View style={styles.iconContainer}>
              <View style={isActive ? styles.activeIcon : undefined}>
                <tab.icon
                  size={24}
                  strokeWidth={2.2}
                  color={isActive ? Colors.primary : Colors.textMuted}
                />
              </View>
              {tab.badge !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const serifText = { fontFamily: Fonts.serif } as const;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E3D5",
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  tabButton: {
    flex: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 2,
    position: "relative",
    minHeight: 48,
  },
  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 28,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 2,
  },
  activeIcon: {
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -10,
    backgroundColor: Colors.accentPinkDark,
    borderRadius: 8,
    minWidth: 16,
    minHeight: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    ...serifText,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  tabLabel: {
    ...serifText,
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "500",
    flexShrink: 1,
    textAlign: "center",
  },
  activeTabLabel: {
    color: Colors.primary,
    fontWeight: "700",
  },
});
