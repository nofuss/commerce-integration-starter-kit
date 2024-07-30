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

const action = require('../../../../actions/adyen/start-session/index.js')
describe('Given the adyen start session action', () => {
  describe('When method main is defined', () => {
    test('Then it is an instance of Function', () => {
      expect(action.main).toBeInstanceOf(Function)
    })
  })
  // describe('When invoked', () => {
  //   test('Then the starter kit version is included in the response', async () => {
  //     const params = {}
  //     const response = await action.main(params)
  //
  //     expect(response).toHaveProperty('body.message.starter_kit_version')
  //   })
  //   test('And Adyen is greeted', async () => {
  //     const params = {}
  //     const response = await action.main(params)
  //
  //     expect(response).toHaveProperty('body.message.say_hello_to_adyen')
  //   })
  // })
})
