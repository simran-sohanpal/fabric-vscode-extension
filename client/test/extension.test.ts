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
import * as vscode from 'vscode';
import * as myExtension from '../src/extension';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

// tslint:disable no-unused-expression
// Defines a Mocha test suite to group tests of similar kind together
describe('Extension Tests', () => {

    let mySandBox;

    beforeEach(() => {
        mySandBox = sinon.createSandbox();
    });

    afterEach(() => {
        mySandBox.restore();
    });

    // Defines a Mocha unit test
    it('should check all the commands are registered', async () => {

        // execute a command to force the extension activation
        await vscode.commands.executeCommand('blockchainExplorer.refreshEntry');

        const allCommands = await vscode.commands.getCommands();

        const blockchainCommands = allCommands.filter((command) => {
            return command.startsWith('blockchain');
        });

        blockchainCommands.should.deep.equal([
            'blockchainExplorer.refreshEntry',
            'blockchainExplorer.connectEntry',
            'blockchainExplorer.addConnectionEntry',
            'blockchainExplorer.testEntry']);
    });

    it('should refresh the tree when a configuration is added', async () => {
        await vscode.workspace.getConfiguration().update('fabric.connections', [], vscode.ConfigurationTarget.Global);

        await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

        const treeDataProvider = myExtension.getBlockchainNetworkExplorerProvider();

        const treeSpy = mySandBox.spy(treeDataProvider['_onDidChangeTreeData'], 'fire');

        const config = [{
            name: 'myConnection',
            connectionProfilePath: 'connection.json',
            certificatePath: '/myCertPath',
            privateKeyPath: '/myPrivateKeyPath'
        }];

        await vscode.workspace.getConfiguration().update('fabric.connections', config, vscode.ConfigurationTarget.Global);

        treeSpy.should.have.been.called;
    });
});
