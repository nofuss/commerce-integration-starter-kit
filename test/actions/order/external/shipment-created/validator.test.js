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

const validator = require('../../../../../actions/order/external/shipment-created/validator')

describe('Given order external shipment created validator', () => {
  describe('When method validateData is defined', () => {
    test('Then is an instance of Function', () => {
      expect(validator.validateData).toBeInstanceOf(Function)
    })
  })
  describe('When data to validate is valid', () => {
    it.each([
      [{
        data: {
          orderId: 6,
          items: [{ orderItemId: 7, qty: 1 }],
          tracks: [{ trackNumber: 'Custom Value', title: 'Custom Title', carrierCode: 'custom' }],
          comments: [{ notifyCustomer: false, comment: 'Order Shipped from API', visibleOnFront: true }],
          stockSourceCode: 'default'
        }
      }]
    ])('Then for %o,  returns successful response', (params) => {
      const SUCCESSFUL_RESPONSE = { success: true }
      expect(validator.validateData(params)).toMatchObject(SUCCESSFUL_RESPONSE)
    })
  })
  describe('When data to validate is not valid', () => {
    it.each([
      [{ data: { orderId: 7 } }],
      [{
        data: {
          orderId: '6',
          items: [{ orderItemId: '7', qty: '1' }],
          tracks: [{ trackNumber: 'Custom Value', title: 'Custom Title', carrierCode: 'custom' }],
          comments: [{ notifyCustomer: 0, comment: 'Order Shipped from API', visibleOnFront: 1 }],
          stockSourceCode: 'default'
        }
      }] // wrong type property
    ])('Then for %o,  returns error response', (params) => {
      const UNSUCCESSFUL_RESPONSE = { success: false }
      expect(validator.validateData(params)).toMatchObject(UNSUCCESSFUL_RESPONSE)
    })
  })
})
