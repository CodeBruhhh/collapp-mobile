import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { FeaturedCard } from "@/components/FeaturedCard/FeaturedCard";
import { FilterChips, type ChipOption } from "@/components/FilterChips";
import { NotificationButton } from "@/components/NotificationButton/NotificationButton";
import { QueryState } from "@/components/QueryState";
import { Screen } from "@/components/Screen";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { UniversityCard } from "@/components/UniversityCard/UniversityCard";
import { useQuery } from "@/hooks/useQuery";
import { useTheme } from "@/hooks/useTheme";
import { listColleges } from "@/services";
import type { College } from "@/types/models";

import { createStyles } from "./HomeScreen.styles";

const CATEGORIES = [
  "Top Universities",
  "Engineering",
  "Business",
  "Liberal Arts",
  "Science",
  "Health",
];

const CATEGORY_OPTIONS: ChipOption<string>[] = [
  { value: "all", label: "All" },
  ...CATEGORIES.map((category) => ({ value: category, label: category })),
];

const POPULAR_COUNT = 4;

function matches(college: College, query: string, category: string): boolean {
  if (category !== "all" && !college.categories.includes(category))
    return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    college.name,
    college.location,
    ...college.programs.map((p) => p.name),
  ];
  return haystack.some((text) => text.toLowerCase().includes(needle));
}

export function HomeScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const router = useRouter();

  const colleges = useQuery(listColleges);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const openDiscover = () => router.push("/student/explore");

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <View style={styles.header}>
        {/* Logo placeholder: replace with the real app logo. */}
        <View style={styles.logo}>
          <Ionicons name="school" size={26} color={colors.onPrimary} />
        </View>
        <View style={styles.titles}>
          <Text style={styles.caption}>Welcome back</Text>
          <Text accessibilityRole="header" style={styles.title}>
            CollApp
          </Text>
        </View>
        <NotificationButton />
      </View>

      <Screen>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search universities"
        />
        <FilterChips
          options={CATEGORY_OPTIONS}
          selected={category}
          onSelect={setCategory}
        />

        <FeaturedCard
          eyebrow="Featured"
          title="Explore Your Future"
          description="Find colleges and programs matched to your goals."
          actionLabel="Learn More"
          onActionPress={openDiscover}
        />

        <SectionHeader
          title="Popular Universities"
          actionLabel="See All"
          onActionPress={openDiscover}
        />
        <QueryState query={colleges}>
          {(items) => {
            const popular = items
              .filter((college) => matches(college, query, category))
              .sort((a, b) => b.studentCount - a.studentCount)
              .slice(0, POPULAR_COUNT);

            if (popular.length === 0) {
              return (
                <EmptyState
                  icon="search-outline"
                  title="No universities found"
                  message="Try a different search or category."
                />
              );
            }
            return popular.map((college) => (
              <UniversityCard key={college.id} college={college} />
            ));
          }}
        </QueryState>
      </Screen>
    </SafeAreaView>
  );
}
