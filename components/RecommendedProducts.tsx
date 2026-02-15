import { View } from 'react-native'
import React from 'react'
import DynamicProductSection from './DynamicProductSection'

const RecommendedProducts = (props: any) => {
    const endpoint = props.sectionId
        ? `/product-sections/${props.sectionId}/content`
        : `/productsroute/top-products`; // Web logic seems similar, fetching content for section

    return (
        <DynamicProductSection
            {...props}
            endpoint={endpoint}
            sectionName={props.sectionName || "Recommended Products"}
        />
    )
}

export default RecommendedProducts
