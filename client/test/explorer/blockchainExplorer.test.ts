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
import * as myExtension from '../../src/extension';
import * as vscode from 'vscode';
import * as path from 'path';
import { ConnectionTreeItem } from '../../src/explorer/model/ConnectionTreeItem';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { ConnectionIdentityTreeItem } from '../../src/explorer/model/ConnectionIdentityTreeItem';

chai.use(sinonChai);
const should = chai.should();

// tslint:disable no-unused-expression
describe('BlockchainExplorer', () => {

    describe('getChildren', () => {

        let mySandBox;

        beforeEach(() => {
            mySandBox = sinon.createSandbox();
        });

        afterEach(() => {
            mySandBox.restore();
        });

        it('should test a connection tree is created with add network at the end', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            const addNetwork = allChildren[allChildren.length - 1];

            addNetwork.contextValue.should.equal('blockchain-add-connection-item');
        });

        it('should display connection that has been added in alphabetical order', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            let connections: Array<any> = vscode.workspace.getConfiguration().get('fabric.connections');
            connections = [];

            const rootPath = path.dirname(__dirname);

            connections.push({
                name: 'myConnectionB',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                }]
            });

            connections.push({
                name: 'myConnectionC',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            });

            connections.push({
                name: 'myConnectionA',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                }]
            });

            connections.push({
                name: 'myConnectionA',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                }]
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

        it('should display connections with single identities', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const connections: Array<any> = [];

            const rootPath = path.dirname(__dirname);

            const myConnection = {
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                }]
            };

            connections.push(myConnection);

            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            const myCommand = {
                command: 'blockchainExplorer.connectEntry',
                title: '',
                arguments: [myConnection]
            };

            allChildren.length.should.equal(2);
            const connectionTreeItem = allChildren[0] as ConnectionTreeItem;
            connectionTreeItem.label.should.equal('myConnection');
            connectionTreeItem.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
            connectionTreeItem.connection.should.deep.equal(myConnection);
            connectionTreeItem.command.should.deep.equal(myCommand);
            allChildren[1].label.should.equal('Add new network');
        });

        it('should display connections with multiple identities', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const connections: Array<any> = [];

            const rootPath = path.dirname(__dirname);

            const myConnection = {
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                },
                    {
                        certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                    }]
            };

            const myConnectionIdentityOne = {
                name: myConnection.name,
                connectionProfilePath: myConnection.connectionProfilePath,
                certificatePath: myConnection.identities[0].certificatePath,
                privateKeyPath: myConnection.identities[0].privateKeyPath
            };

            const myConnectionIdentityTwo = {
                name: myConnection.name,
                connectionProfilePath: myConnection.connectionProfilePath,
                certificatePath: myConnection.identities[1].certificatePath,
                privateKeyPath: myConnection.identities[1].privateKeyPath
            };

            connections.push(myConnection);

            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            allChildren.length.should.equal(2);
            allChildren.length.should.equal(2);
            const connectionTreeItem = allChildren[0] as ConnectionTreeItem;
            connectionTreeItem.label.should.equal('myConnection');
            connectionTreeItem.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
            connectionTreeItem.connection.should.deep.equal(myConnection);
            should.not.exist(connectionTreeItem.command);
            allChildren[1].label.should.equal('Add new network');

            const myCommandOne = {
                command: 'blockchainExplorer.connectEntry',
                title: '',
                arguments: [myConnectionIdentityOne]
            };

            const myCommandTwo = {
                command: 'blockchainExplorer.connectEntry',
                title: '',
                arguments: [myConnectionIdentityTwo]
            };

            const identityChildren = await blockchainNetworkExplorerProvider.getChildren(connectionTreeItem);
            identityChildren.length.should.equal(2);

            const identityChildOne = identityChildren[0] as ConnectionIdentityTreeItem;
            identityChildOne.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
            identityChildOne.contextValue.should.equal('blockchain-connection-identity-item');
            identityChildOne.label.should.equal('Admin@org1.example.com');
            identityChildOne.command.should.deep.equal(myCommandOne);

            const identityChildTwo = identityChildren[1] as ConnectionIdentityTreeItem;
            identityChildTwo.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
            identityChildTwo.contextValue.should.equal('blockchain-connection-identity-item');
            identityChildTwo.label.should.equal('Admin@org1.example.com');
            identityChildTwo.command.should.deep.equal(myCommandTwo);
        });

        it('should throw an error if cert can be parsed with multiple identities', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const connections: Array<any> = [];

            const rootPath = path.dirname(__dirname);

            const myConnection = {
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/badPath/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                },
                    {
                        certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                    }]
            };

            const myConnectionIdentityOne = {
                name: myConnection.name,
                connectionProfilePath: myConnection.connectionProfilePath,
                certificatePath: myConnection.identities[0].certificatePath,
                privateKeyPath: myConnection.identities[0].privateKeyPath
            };

            const myConnectionIdentityTwo = {
                name: myConnection.name,
                connectionProfilePath: myConnection.connectionProfilePath,
                certificatePath: myConnection.identities[1].certificatePath,
                privateKeyPath: myConnection.identities[1].privateKeyPath
            };

            connections.push(myConnection);

            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren = await blockchainNetworkExplorerProvider.getChildren();

            allChildren.length.should.equal(2);
            allChildren.length.should.equal(2);

            const connectionTreeItem = allChildren[0] as ConnectionTreeItem;

            connectionTreeItem.label.should.equal('myConnection');
            connectionTreeItem.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
            connectionTreeItem.connection.should.deep.equal(myConnection);
            should.not.exist(connectionTreeItem.command);
            allChildren[1].label.should.equal('Add new network');

            const myCommandOne = {
                command: 'blockchainExplorer.connectEntry',
                title: '',
                arguments: [myConnectionIdentityOne]
            };

            const myCommandTwo = {
                command: 'blockchainExplorer.connectEntry',
                title: '',
                arguments: [myConnectionIdentityTwo]
            };

            const errorSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

            await blockchainNetworkExplorerProvider.getChildren(connectionTreeItem);

            errorSpy.should.have.been.called;
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

        it('should test when a connection is added the list is refreshed', async () => {

            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', [], vscode.ConfigurationTarget.Global);

            const showInputBoxStub = mySandBox.stub(vscode.window, 'showInputBox');

            const rootPath = path.dirname(__dirname);

            showInputBoxStub.onFirstCall().resolves('myConnection');
            showInputBoxStub.onSecondCall().resolves(path.join(rootPath, '../../test/data/connectionOne/connection.json'));
            showInputBoxStub.onThirdCall().resolves(path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'));
            showInputBoxStub.onCall(3).resolves(path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey'));

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            await vscode.commands.executeCommand('blockchainExplorer.addConnectionEntry');

            onDidChangeTreeDataSpy.should.have.been.called;
        });
    });
});
