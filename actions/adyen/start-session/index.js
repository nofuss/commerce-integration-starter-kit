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

/**
 * Russ's first big adventure
 *
 * @returns {object} returns starter kit version and registration data
 * @param {object} params - includes the env params
 */
async function main (params) {
  const version = require('../../../package.json').version
  const registrations = require('../../../scripts/onboarding/config/starter-kit-registrations.json')

  // create a Logger
  const logger = Core.Logger('adyen-start-session', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the adyen start session action')

    // log the response status code
    logger.info(`Successful request: ${HTTP_OK}`)
    return actionSuccessResponse({
      say_hello_to_adyen: "hello adyen",
      starter_kit_version: version,
      registrations
    })
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return actionErrorResponse(HTTP_INTERNAL_ERROR, `Server error: ${error.message}`)
  }
}

exports.main = main
