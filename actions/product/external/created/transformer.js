/*
 * Copyright 2023 Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 */

function transformData(params) {
    // This is a sample implementation. Please adapt based on your needs
    // Notice that the attribute_set_id may need to be changed
    return {
        product: {
            sku: params.data.sku,
            name: params.data.name,
            attribute_set_id: 4,
            custom_attributes: [
                {
                    attribute_code: 'description',
                    value: params.data.description
                }
            ]
        }
    }
}

module.exports = {
    transformData
}
