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

import * as myExtension from '../../src/extension';
import * as vscode from 'vscode';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.should();
chai.use(sinonChai);

// tslint:disable no-unused-expression
describe('BlockchainExplorer', () => {

    describe('getChildren', () => {

        it('should test a config tree is created with add network at the end', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            const addNetwork = allChildren[allChildren.length - 1];

            addNetwork.contextValue.should.equal('blockchain-add-config-item');
        });

        it('should display config that has been added in alphabetical order', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            let connections: Array<any> = vscode.workspace.getConfiguration().get('fabric.connections');
            connections = [];

            connections.push({
                name: 'myConnectionB',
                connectionProfilePath: '../data/connectionTwo/connection.json',
                certificatePath: '../data/connectionTwo/credentials/certificate',
                privateKeyPath: '../data/connectionTwo/credentials/privateKey'
            });

            connections.push({
                name: 'myConnectionC',
                connectionProfilePath: '../data/connectionOne/connection.json',
                certificatePath: '../data/connectionOne/credentials/certificate',
                privateKeyPath: '../data/connectionOne/credentials/privateKey'
            });

            connections.push({
                name: 'myConnectionA',
                connectionProfilePath: '../data/connectionTwo/connection.json',
                certificatePath: '../data/connectionTwo/credentials/certificate',
                privateKeyPath: '../data/connectionTwo/credentials/privateKey'
            });

            connections.push({
                name: 'myConnectionA',
                connectionProfilePath: '../data/connectionTwo/connection.json',
                certificatePath: '../data/connectionTwo/credentials/certificate',
                privateKeyPath: '../data/connectionTwo/credentials/privateKey'
            });

            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            allChildren.length.should.equal(5);
            allChildren[0].label.should.equal('myConnectionA');
            allChildren[1].label.should.equal('myConnectionA');
            allChildren[2].label.should.equal('myConnectionB');
            allChildren[3].label.should.equal('myConnectionC');
            allChildren[4].label.should.equal('Add new network');
        });
    });

    describe('refresh', () => {

        let mySandBox;

        beforeEach(() => {
            mySandBox = sinon.createSandbox();
        });

        afterEach(() => {
            mySandBox.restore();
        });

        it('should test the tree is refreshed when the refresh command is run', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            await vscode.commands.executeCommand('blockchainExplorer.refreshEntry');

            onDidChangeTreeDataSpy.should.have.been.called;
        });

        xit('should test the tree is refreshed when the refresh button is pressed', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            // TODO work out how to press the refresh button;
            'true'.should.equal(false);
        });

        it('should test when a config is added the list is refreshed', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', [], vscode.ConfigurationTarget.Global);

            const showInputBoxStub = mySandBox.stub(vscode.window, 'showInputBox');

            showInputBoxStub.onFirstCall().resolves('myConnection');
            showInputBoxStub.onSecondCall().resolves('connection.json');
            showInputBoxStub.onThirdCall().resolves('/myCertPath');
            showInputBoxStub.onCall(3).resolves('/myPrivateKeyPath');

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            await vscode.commands.executeCommand('blockchainExplorer.addConnectionEntry');

            onDidChangeTreeDataSpy.should.have.been.called;
        });
    });
});
