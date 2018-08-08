/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/
'use strict';
import * as vscode from 'vscode';
import * as path from 'path';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Util } from '../../src/commands/util';
chai.use(sinonChai);

// Defines a Mocha test suite to group tests of similar kind together
describe('Command Utility Function Tests', () => {

    let mySandBox;

    beforeEach(() => {
        mySandBox = sinon.createSandbox();
     });

    afterEach(() => {
        mySandBox.restore();
    });

    it('should send a shell command', async () => {

        const rootPath = path.dirname(__dirname);
        const uri: vscode.Uri = vscode.Uri.file(path.join(rootPath, '../../test'));
        const command = await Util.sendCommand('echo Hyperledgendary', uri.fsPath);
        command.should.equal('Hyperledgendary');

    });
});
