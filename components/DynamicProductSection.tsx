import { View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import ProductSection from "./ProductSection";
import { getSectionData } from "../services/homeService";

interface DynamicProductSectionProps {
  section?: any;
  endpoint: string; // Endpoint to fetch products from (e.g., '/productsroute/new-arrivals')
  sectionName?: string;
  gridLayout?: boolean;
}

const DynamicProductSection = (props: DynamicProductSectionProps) => {
  const { section, endpoint, gridLayout } = props;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getSectionData(endpoint);
    let productsList = [];
    if (Array.isArray(data)) {
      productsList = data;
    } else if (data && Array.isArray(data.products)) {
      productsList = data.products;
    } else if (data && Array.isArray(data.data)) {
      productsList = data.data;
    }
    console.log(
      `DynamicProductSection [${props.sectionName || endpoint}] items:`,
      productsList.length,
    );
    setProducts(productsList);
    setLoading(false);
  };

  if (loading)
    return (
      <View className="h-40 justify-center">
        <ActivityIndicator color="#FD5B00" />
      </View>
    );

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
