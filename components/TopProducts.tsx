import { View } from "react-native";
import React from "react";
import DynamicProductSection from "./DynamicProductSection";

// Web TopProducts fetches from /productsroute/new-arrivals?limit=100
const TopProducts = (props: any) => {
  return (
    <DynamicProductSection
      {...props}
      endpoint="/productsroute/new-arrivals?limit=100"
      sectionName={props.sectionName || "Top Products"}
      gridLayout={true}
    />
  );
};

export default TopProducts;
