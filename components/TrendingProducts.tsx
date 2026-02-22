import { View } from "react-native";
import React from "react";
import DynamicProductSection from "./DynamicProductSection";

// Web TrendingProducts fetches from /product-sections/${sectionId}/content
const TrendingProducts = (props: any) => {
  // If sectionId is available, DynamicProductSection handles fetching content for it if we pass the right endpoint logic or if we let it handle 'content' fetching.
  // DynamicProductSection uses `getSectionData(endpoint)`.
  // We need to construct the endpoint for content if it's a section-based fetch.

  const endpoint = props.sectionId
    ? `/product-sections/${props.sectionId}/content`
    : `/productsroute/top-products`; // Fallback

  return (
    <DynamicProductSection
      {...props}
      endpoint={endpoint}
      sectionName={props.sectionName || "Trending Products"}
      gridLayout={true}
    />
  );
};

export default TrendingProducts;
