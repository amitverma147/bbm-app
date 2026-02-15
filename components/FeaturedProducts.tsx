import { View } from 'react-native'
import React from 'react'
import DynamicProductSection from './DynamicProductSection'

const FeaturedProducts = (props: any) => {
    const endpoint = props.sectionId
        ? `/product-sections/${props.sectionId}/content`
        : `/productsroute/top-products`;

    return (
        <DynamicProductSection
            {...props}
            endpoint={endpoint}
            sectionName={props.sectionName || "Featured Products"}
        />
    )
}

export default FeaturedProducts
