import { View, ActivityIndicator } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import ProductSection from "./ProductSection";
import { getSectionData, getCachedSectionData } from "../services/homeService";

interface DynamicProductSectionProps {
  section?: any;
  endpoint: string;
  sectionName?: string;
  gridLayout?: boolean;
}

const DynamicProductSection = (props: DynamicProductSectionProps) => {
  const { section, endpoint, gridLayout } = props;

  // Synchronous cache check — if data was already fetched, render instantly
  const cachedData = getCachedSectionData(endpoint);

  const [products, setProducts] = useState<any[]>(cachedData || []);
  const [loading, setLoading] = useState(!cachedData);
  const hasFetched = useRef(!!cachedData);

  useEffect(() => {
    // Skip fetch if we already have cached data
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSectionData(endpoint);
      let productsList: any[] = [];
      if (Array.isArray(data)) {
        productsList = data;
      } else if (data && Array.isArray(data.products)) {
        productsList = data.products;
      } else if (data && Array.isArray(data.data)) {
        productsList = data.data;
      }
      setProducts(productsList);
    } catch (error) {
      console.error(
        `DynamicProductSection [${props.sectionName}] error:`,
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  // Only show spinner on very first load (no cache)
  if (loading && products.length === 0) {
    return (
      <View className="h-40 justify-center">
        <ActivityIndicator color="#FD5B00" />
      </View>
    );
  }

  // Hide section entirely if no products after loading
  if (!loading && products.length === 0) return null;

  return (
    <ProductSection
      title={
        section?.section_name ||
        section?.component_name ||
        props.sectionName ||
        "Section"
      }
      data={products}
      gridLayout={gridLayout}
    />
  );
};

export default React.memo(DynamicProductSection);
