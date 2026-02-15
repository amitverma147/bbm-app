import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { getActiveSections } from "../services/homeService";
import BrandVista from "./BrandVista";
import CategoriesGrid from "./CategoriesGrid";
import DailyDeals from "./DailyDeals"; // New Import
import DualCategorySection from "./DualCategorySection";
import DynamicMegaSale from "./DynamicMegaSale";
import DynamicProductSection from "./DynamicProductSection";
import FeaturedProducts from "./FeaturedProducts";
import HeroSection from "./HeroSection"; // New Import
import PromoBanner from "./PromoBanner";
import RecommendedProducts from "./RecommendedProducts";
import ShopByCategory from "./ShopByCategory";
import ShopByStore from "./ShopByStore";
import SmallPromoCards from "./SmallPromoCards";
import TabbedProductSection from "./TabbedProductSection";
import TopProducts from "./TopProducts";
import TrendingProducts from "./TrendingProducts";
import VideoCardSection from "./VideoCardSection";

// --- MAPPING of Component Names to Mobile Implementations ---
const COMPONENT_MAP: any = {
  HeroSection: HeroSection, // Updated Mapping
  ShopByCategory: ShopByCategory,
  BrandVista: BrandVista,
  VideoCardSection: VideoCardSection,
  DynamicMegaSale: (props: any) => (
    <DynamicMegaSale {...props} products={props.data?.products} />
  ),
  SmallPromoCards: SmallPromoCards,
  PromoBanner: PromoBanner,
  ShopByStore: ShopByStore,

  // Complex Sections
  DiscountCorner: () => (
    <DualCategorySection
      sectionLeftKey="discount_corner_left"
      sectionRightKey="discount_corner_right"
    />
  ),
  DualDeals: () => (
    <DualCategorySection
      sectionLeftKey="dual_deals_left"
      sectionRightKey="dual_deals_right"
    />
  ),
  MegaMonsoon: (props: any) => <TabbedProductSection {...props} />,

  // Product Sections (Using new Wrappers)
  NewArrivals: TopProducts, // Web maps TopProducts to New Arrivals essentially (logic wise)
  TopProducts: TopProducts,
  TrendingProducts: TrendingProducts,
  FeaturedProducts: FeaturedProducts,
  RecommendedProducts: RecommendedProducts,

  BigBestMartDeals: (props: any) => (
    <DynamicProductSection {...props} endpoint="/productsroute/super-saver" />
  ),
  QuickPicks: (props: any) => (
    <DynamicProductSection
      {...props}
      endpoint="/productsroute/super-saver?limit=50"
    />
  ),
  DailyDeals: DailyDeals, // Updated Mapping
  EverydayEssentials: (props: any) => (
    <DynamicProductSection {...props} endpoint="/productsroute/top-products" />
  ),

  QuickAccess: CategoriesGrid,
};

// Sections to ensure are present (as per web fallback logic)
const PRIORITY_SECTIONS = ["QuickAccess", "HeroSection", "DynamicMegaSale"];

const DynamicHome = ({
  ListHeaderComponent,
}: {
  ListHeaderComponent?: React.ReactElement;
}) => {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const data = await getActiveSections();

      // Replicate Web Logic: Filter & Inject Missing Sections
      let updatedSections = data.filter(
        (s: any) =>
          s.component_name !== "QuickAccess" &&
          s.component_name !== "PriceZone",
      );

      // Filter duplicates
      const seenComponents = new Set();
      updatedSections = updatedSections.filter((section: any) => {
        if (seenComponents.has(section.component_name)) return false;
        seenComponents.add(section.component_name);
        return true;
      });

      // Ensure Fallbacks
      const requiredComponents = [
        "NewArrivals",
        "BigBestMartDeals",
        "SmallPromoCards",
      ];

      const missingComponents = requiredComponents.filter(
        (name) => !updatedSections.some((s: any) => s.component_name === name),
      );

      if (missingComponents.length > 0) {
        const fallbackSectionObjects = missingComponents.map((name, i) => ({
          id: Date.now() + i,
          section_key: name.toLowerCase(),
          component_name: name,
          display_order: updatedSections.length + i + 1,
          section_name: name === "BigBestMartDeals" ? "Super Saver" : name,
        }));

        // Simplified injection: just add to end or specific points if critical
        // Web logic injects after priority sections.
        updatedSections = [...updatedSections, ...fallbackSectionObjects];
      }

      // Sort by display order provided by backend + injects
      updatedSections.sort(
        (a: any, b: any) => (a.display_order || 99) - (b.display_order || 99),
      );

      setSections(updatedSections);
    } catch (error) {
      console.error("Failed to load sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = React.useCallback(({ item }: { item: any }) => {
    const Component = COMPONENT_MAP[item.component_name];
    if (!Component) {
      return null;
    }
    return (
      <View className="mb-2 p-0 m-0 w-full bg-white">
        <Component
          sectionId={item.id}
          sectionName={item.section_name}
          sectionDescription={item.description}
          data={item}
        />
      </View>
    );
  }, []);

  const keyExtractor = React.useCallback(
    (item: any) => item.id?.toString() || item.section_key,
    [],
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FD5B00" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        ListHeaderComponent={ListHeaderComponent}
        data={sections}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialNumToRender={5}
        maxToRenderPerBatch={2}
        windowSize={10}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, padding: 0, margin: 0 }}
        updateCellsBatchingPeriod={50}
      />
    </View>
  );
};

export default DynamicHome;
