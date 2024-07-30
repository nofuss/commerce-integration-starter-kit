/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { Core } = require('@adobe/aio-sdk')
const { actionSuccessResponse, actionErrorResponse } = require('../../responses')
const { HTTP_OK, HTTP_INTERNAL_ERROR } = require('../../constants')
const { Client, CheckoutAPI } = require('@adyen/api-library');

/**
 * Russ's first big adventure
 *
 * @returns {object} returns starter kit version and registration data
 * @param {object} params - includes the env params
 */
async function main (params) {

  const logger = Core.Logger('adyen-create-session', { level: params.LOG_LEVEL || 'info' })

  const client = new Client({apiKey: params.ADYEN_API_KEY, environment: params.ADYEN_ENVIRONMENT});
  const createCheckoutSessionRequest = {
    merchantAccount: params.ADYEN_MERCHANT_ACCOUNT,
    amount: params.amount,
    returnUrl: params.returnUrl,
    reference: params.reference,
    countryCode: "NL"
  }

  try {
    logger.info('Calling the adyen create session action')
    const checkoutAPI = new CheckoutAPI(client);
    const response = await checkoutAPI.PaymentsApi.sessions(createCheckoutSessionRequest, { idempotencyKey: crypto.randomUUID()});
    logger.info(`Successful request: ${HTTP_OK}`)
    return actionSuccessResponse(response)
  } catch (error) {
    logger.error(error)
    return actionErrorResponse(HTTP_INTERNAL_ERROR, `Server error: ${error.message}`)
  }
}

exports.main = main
