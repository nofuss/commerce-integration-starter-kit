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

const { Core, Events } = require('@adobe/aio-sdk')
const { stringParameters } = require('../../../actions/utils')
const { CloudEvent } = require('cloudevents')
const uuid = require('uuid')
const {
  HTTP_BAD_REQUEST, HTTP_OK, HTTP_INTERNAL_ERROR, HTTP_UNAUTHORIZED,
  BACKOFFICE_PROVIDER_KEY
} = require('../../../actions/constants')
const { getAdobeAccessToken } = require('../../../utils/adobe-auth')
const { getProviderByKey } = require('../../../utils/adobe-events-api')
const { validateData } = require('./validator')
const { checkAuthentication } = require('./auth')
const { errorResponse, successResponse } = require('../../responses')

/**
 * This web action allow external back-office application publish event to IO event using custom authentication mechanism.
 *
 * @param {object} params - method params includes environment and request data
 * @returns {object} - response with success status and result
 */
async function main (params) {
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  try {
    logger.info('[IngestionWebhook] Start processing request')
    logger.debug(`[IngestionWebhook] Webhook main params: ${stringParameters(params)}`)

    const authentication = await checkAuthentication(params)
    if (!authentication.success) {
      logger.error(`[IngestionWebhook] ${authentication.message}`)
      return errorResponse(HTTP_UNAUTHORIZED, authentication.message)
    }

    const validationResult = validateData(params)
    if (!validationResult.success) {
      logger.error(`[IngestionWebhook] ${validationResult.message}`)
      return errorResponse(HTTP_BAD_REQUEST, validationResult.message)
    }

    logger.debug('[IngestionWebhook] Generate Adobe access token')
    const accessToken = await getAdobeAccessToken(params)

    logger.debug('[IngestionWebhook] Get existing registrations')
    const provider = await getProviderByKey(params, accessToken, BACKOFFICE_PROVIDER_KEY)

    if (!provider) {
      const errorMessage = 'Could not find any external backoffice provider'
      logger.error(`IngestionWebhook] ${errorMessage}`)
      return errorResponse(HTTP_INTERNAL_ERROR, errorMessage)
    }

    const event = {
      providerId: provider.id,
      providerName: provider.label,
      type: params.data.event,
      data: params.data.value,
      uid: params.data.uid
    }

    logger.debug('[IngestionWebhook] Initiate events client')
    const eventsClient = await Events.init(
      params.OAUTH_ORG_ID,
      params.OAUTH_CLIENT_ID,
      accessToken)

    logger.info('[IngestionWebhook] Process event data')
    logger.debug(
          `[IngestionWebhook] Process event ${event.type} for entity ${event.entity}`)

    const cloudEvent = new CloudEvent({
      source: 'urn:uuid:' + event.providerId,
      type: event.type,
      datacontenttype: 'application/json',
      data: event.data,
      id: uuid.v4()
    })

    logger.debug(`[IngestionWebhook] Publish event ${event.type} to provider ${event.providerName}`)
    event.success = await eventsClient.publishEvent(cloudEvent)

    logger.info(`[IngestionWebhook] ${HTTP_OK}: successful request`)

    return successResponse(event.type, {
      success: true,
      message: 'Event published successfully'
    })
  } catch (error) {
    logger.error(`[IngestionWebhook] Server error: ${error.message}`)
    return errorResponse(HTTP_INTERNAL_ERROR, error.message)
  }
}

exports.main = main
