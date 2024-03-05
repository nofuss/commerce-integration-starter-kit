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

const Openwhisk = require('../../../../../actions/openwhisk')
const consumer = require('../../../../../actions/stock/external/consumer')
const { HTTP_OK, HTTP_BAD_REQUEST, HTTP_NOT_FOUND, HTTP_INTERNAL_ERROR } = require('../../../../../actions/constants')

jest.mock('Openwhisk')

describe('Given stock external consumer', () => {
  describe('When method main is defined', () => {
    test('Then is an instance of Function', () => {
      expect(consumer.main).toBeInstanceOf(Function)
    })
  })
  describe('When required params are missing', () => {
    it.each([
      {},
      { data: {} },
      { type: 'be-observer.catalog_stock_create' }
    ])('Then for parameter %p returns error message', async (params) => {
      const INVALID_REQUEST_PARAMS_RESPONSE = {
        error: {
          body: {
            error: expect.any(String)
          },
          statusCode: HTTP_BAD_REQUEST
        }
      }
      expect(await consumer.main(params)).toMatchObject(INVALID_REQUEST_PARAMS_RESPONSE)
    })
  })
  describe('When stock event type received is not supported', () => {
    test('Then returns error response', async () => {
      const UNSUPPORTED_TYPE = 'foo'
      const TYPE_NOT_FOUND_RESPONSE = {
        error: {
          body: {
            error: 'This case type is not supported: foo'
          },
          statusCode: HTTP_BAD_REQUEST
        }
      }
      const params = { type: UNSUPPORTED_TYPE, data: {} }
      expect(await consumer.main(params)).toMatchObject(TYPE_NOT_FOUND_RESPONSE)
    })
  })
  describe('When stock event received is valid', () => {
    it.each([
      ['be-observer.catalog_stock_update', 'stock-backoffice/updated', 'data']
    ]
    )('When type is %p, Then forwards the request to the %p action', async (type, action, data) => {
      const params = { type, data }
      const invocation = Openwhisk.prototype.invokeAction = jest.fn()
      await consumer.main(params)
      expect(invocation).toHaveBeenCalledWith(action, data)
    })
  })
  describe('When downstream throw an exception', () => {
    test('Then returns error response', async () => {
      const ERROR_MESSAGE = 'Unexpected Error'
      const INTERNAL_SERVER_ERROR_RESPONSE = {
        error: {
          statusCode: HTTP_INTERNAL_ERROR,
          body: {
            error: expect.stringContaining(ERROR_MESSAGE)
          }
        }
      }
      const type = 'be-observer.catalog_stock_update'
      const params = { type, data: {} }
      Openwhisk.prototype.invokeAction = jest.fn().mockRejectedValue(new Error(ERROR_MESSAGE))
      expect(await consumer.main(params)).toMatchObject(INTERNAL_SERVER_ERROR_RESPONSE)
    })
  })
  describe('When downstream returns an error', () => {
    it.each([
      [HTTP_BAD_REQUEST, { success: false, error: 'Invalid data' }],
      [HTTP_NOT_FOUND, { success: false, error: 'Entity not found' }],
      [HTTP_INTERNAL_ERROR, { success: false, error: 'Internal error' }]
    ]
    )('Then returns error response with the status code %p', async (statusCode, response) => {
      const type = 'be-observer.catalog_stock_update'
      const ACTION_RESPONSE = {
        response: {
          result: {
            body: response,
            statusCode
          }
        }
      }
      const CONSUMER_RESPONSE = {
        error: {
          statusCode,
          body: {
            error: response.error
          }
        }
      }
      const params = { type, data: {} }
      Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue(ACTION_RESPONSE)
      expect(await consumer.main(params)).toMatchObject(CONSUMER_RESPONSE)
    })
  })
  describe('When downstream returns a success response', () => {
    test('Then returns success response', async () => {
      const type = 'be-observer.catalog_stock_update'
      const ACTION_RESPONSE = {
        response: {
          result: {
            body: {
              success: true,
              message: 'Success message'
            },
            statusCode: HTTP_OK
          }
        }
      }
      const CONSUMER_RESPONSE = {
        statusCode: HTTP_OK,
        body: {
          type,
          response: {
            success: true,
            message: 'Success message'
          }
        }
      }
      const params = { type, data: {} }
      Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue(ACTION_RESPONSE)
      expect(await consumer.main(params)).toMatchObject(CONSUMER_RESPONSE)
    })
  })
})
