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

require('dotenv').config();
const {checkMissingRequestInputs} = require("../actions/utils");
const {addSuffix} = require("./utils/naming");
const fetch = require('node-fetch')
const uuid = require('uuid');

async function getExistingProviders(envConfigs, accessToken) {
    const getCreatedProvidersReq = await fetch(
        `${envConfigs.IO_MANAGEMENT_BASE_URL}${envConfigs.IO_CONSUMER_ID}/providers`,
        {
            method: 'GET',
            headers: {
                'x-api-key': `${envConfigs.OAUTH_CLIENT_ID}`,
                'Authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'Accept': 'application/hal+json'
            }
        }
    )
    const getCreatedProvidersResult = await getCreatedProvidersReq.json()
    const existingProviders = [];
    if (getCreatedProvidersResult?._embedded?.providers) {
        getCreatedProvidersResult._embedded.providers.forEach(provider => {
            existingProviders[provider.label] = provider;
        })
    }
    return existingProviders;
}

async function createProvider(envConfigs, accessToken, provider) {
    const createCustomEventProviderReq = await fetch(
        `${envConfigs.IO_MANAGEMENT_BASE_URL}${envConfigs.IO_CONSUMER_ID}/${envConfigs.IO_PROJECT_ID}/${envConfigs.IO_WORKSPACE_ID}/providers`,
        {
            method: 'POST',
            headers: {
                'x-api-key': `${envConfigs.OAUTH_CLIENT_ID}`,
                'Authorization': `Bearer ${accessToken}`,
                'content-type': 'application/json',
                'Accept': 'application/hal+json'
            },
            body: JSON.stringify(
                {
                    // read here about the use of the spread operator to merge objects: https://dev.to/sagar/three-dots---in-javascript-26ci
                    ...(provider?.key === 'commerce' ? {provider_metadata: 'dx_commerce_events', instance_id: `${uuid.v4()}`} : null),
                    ...(provider?.label ? {label: `${provider?.label}`} : null),
                    ...(provider?.description ? {description: `${provider?.description}`} : null),
                    ...(provider?.docs_url ? {docs_url: `${provider?.docs_url}`} : null)
                }
            )
        }
    )
    const result = await createCustomEventProviderReq.json()
    if (!result?.id) {
        return {
            success: false,
            error: {
                reason: result?.reason,
                message: result?.message
            }
        }
    }
    return {
        success: true,
        provider: result
    };
}


function hasSelection(selection, clientRegistrations) {
    for (const [entityName, options] of Object.entries(clientRegistrations)) {
        return !!(options !== undefined && options.includes(selection));
    }
    return false;
}

async function main(clientRegistrations, accessToken) {
    // Load predefined provider, providerEvents and clientRegistrations
    const providersList = require("./config/providers.json");
    const providersEventsConfig = require("./config/events.json");
    const envConfigs = process.env;

    try {
        // 'info' is the default level if not set
        console.log('Start process of creating providers: ', providersEventsConfig)

        // Validate client registration selection
        const requiredRegistrations = ['product', 'customer', 'order', 'stock', 'shipment']
        const errorMessage = checkMissingRequestInputs(clientRegistrations, requiredRegistrations, [])
        if (errorMessage) {
            // return and log client errors
            return {
                code: 400,
                success: false,
                error: errorMessage
            }
        }

        // Load the existing providers in org
        const existingProviders = await getExistingProviders(envConfigs, accessToken);

        const result = [];

        // Loop over the predefined providers and create the provider in the System
        for (const provider of providersList) {
            // Calculate provider label
            provider.label = addSuffix(provider.label, envConfigs)
            const isProviderSelectedByClient = hasSelection(provider.key, clientRegistrations);
            if (isProviderSelectedByClient) {
                // Check if provider is already created
                const persistedProvider = existingProviders[provider.label];
                // persistedProvider = { value, expiration }
                if (persistedProvider) {
                    console.log(`Skipping creation of "${provider.label}" creation`)

                    result.push({
                        key: provider.key,
                        id: persistedProvider.id,
                        instanceId: persistedProvider.instance_id,
                        label: provider.label
                    })
                    continue
                }

                console.log(`Creating provider with: ` + provider.label)
                console.log(`provider information: ${JSON.stringify(provider)}`)

                const createProviderResult = await createProvider(envConfigs, accessToken, provider);
                if (!createProviderResult?.success) {
                    let errorMessage = `Unable to create provider: reason = '${createProviderResult.error?.reason}', message = '${createProviderResult.error?.message}'`;
                    console.log(errorMessage)
                    return {
                        code: 500,
                        success: false,
                        error: errorMessage
                    };
                }

                result.push({
                    key: provider.key,
                    id: createProviderResult.provider?.id,
                    instanceId: createProviderResult.provider?.instance_id,
                    label: provider.label
                });
            }
        }

        result.forEach(provider => console.log(`Defining the ${provider.key} provider id as : ${provider.id}`));

        const response = {
            code: 200,
            success: true,
            result
        }

        // log the response status code
        console.log(`${response.code}: Process of creating providers done successfully`)
        return response
    } catch (error) {
        let errorMessage = `Unable to complete the process of creating providers: ${error.message}`;
        console.log(errorMessage)
        return {
            code: 500,
            success: false,
            error: errorMessage
        }
    }
}

exports.main = main
