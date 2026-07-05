import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, focused }) => {
          const map: Record<string, any> = {
            home: focused ? "home" : "home-outline",
            study: focused ? "book-open-page-variant" : "book-open-page-variant-outline",
            groups: focused ? "chat" : "chat-outline",
            notices: focused ? "bell" : "bell-outline",
            profile: focused ? "account-circle" : "account-circle-outline",
          };
          return <MaterialCommunityIcons name={map[route.name] || "circle"} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="study" options={{ title: "Study" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="notices" options={{ title: "Notices" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
