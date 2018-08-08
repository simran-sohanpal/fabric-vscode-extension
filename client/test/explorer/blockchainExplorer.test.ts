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
import { AddConnectionTreeItem } from '../../src/explorer/model/AddConnectionTreeItem';
import { FabricClientConnection } from '../../src/fabricClientConnection';
import { BlockchainTreeItem } from '../../src/explorer/model/BlockchainTreeItem';
import { BlockchainNetworkExplorerProvider } from '../../src/explorer/BlockchainNetworkExplorer';
import { ChannelTreeItem } from '../../src/explorer/model/ChannelTreeItem';
import { PeersTreeItem } from '../../src/explorer/model/PeersTreeItem';
import { InstantiatedChainCodesTreeItem } from '../../src/explorer/model/InstantiatedChaincodesTreeItem';
import { PeerTreeItem } from '../../src/explorer/model/PeerTreeItem';
import { ChainCodeTreeItem } from '../../src/explorer/model/ChainCodeTreeItem';
import { InstalledChainCodeTreeItem } from '../../src/explorer/model/InstalledChainCodeTreeItem';
import { InstalledChainCodeVersionTreeItem } from '../../src/explorer/model/InstalledChaincodeVersionTreeItem';

chai.use(sinonChai);
const should = chai.should();

// tslint:disable no-unused-expression
describe('BlockchainExplorer', () => {

    describe('getChildren', () => {

        describe('unconnected tree', () => {

            let mySandBox;

            beforeEach(() => {
                mySandBox = sinon.createSandbox();
            });

            afterEach(() => {
                mySandBox.restore();
            });

            it('should test a connection tree is created with add network at the end', async () => {

                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

                const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
                const allChildren = await blockchainNetworkExplorerProvider.getChildren();

                const addNetwork = allChildren[allChildren.length - 1];

                addNetwork.should.be.instanceOf(AddConnectionTreeItem);

                addNetwork.tooltip.should.equal('Add new network');
                addNetwork.label.should.equal('Add new network');
            });

            it('should display connection that has been added in alphabetical order', async () => {

                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

                const connections: Array<any> = [];

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
                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

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

                const myCommandConnection = {
                    connectionProfilePath: myConnection.connectionProfilePath,
                    certificatePath: myConnection.identities[0].certificatePath,
                    privateKeyPath: myConnection.identities[0].privateKeyPath
                };

                const myCommand = {
                    command: 'blockchainExplorer.connectEntry',
                    title: '',
                    arguments: [myCommandConnection]
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

                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

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

            it('should throw an error if cert can\'t be parsed with multiple identities', async () => {

                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

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

                const errorSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

                await blockchainNetworkExplorerProvider.getChildren(connectionTreeItem);

                errorSpy.should.have.been.calledWith(sinon.match((value) => {
                    return value.startsWith('Error parsing certificate ENOENT: no such file or directory');
                }));
            });

            it('should handle error with tree', async () => {
                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

                const connections: Array<any> = [];

                const rootPath = path.dirname(__dirname);

                const myConnection = {
                    name: 'myConnection',
                    connectionProfilePath: path.join(rootPath, '../../test/data/connectionTwo/connection.json'),
                    identities: [{
                        certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/badPath/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                    }]
                };

                connections.push(myConnection);

                await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

                const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

                const errorSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

                mySandBox.stub(blockchainNetworkExplorerProvider, 'createConnectionTree').rejects({message: 'some error'});

                await blockchainNetworkExplorerProvider.getChildren();

                errorSpy.should.have.been.calledWith('some error');
            });
        });

        describe('connected tree', () => {

            let mySandBox;
            let allChildren: Array<BlockchainTreeItem>;
            let blockchainNetworkExplorerProvider: BlockchainNetworkExplorerProvider;

            beforeEach(async () => {
                mySandBox = sinon.createSandbox();

                await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

                const rootPath = path.dirname(__dirname);

                const myConnection = {
                    connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                };

                const fabricClientConnection: FabricClientConnection = new FabricClientConnection(myConnection);
                mySandBox.stub(fabricClientConnection, 'getAllPeerNames').resolves(['peerOne', 'peerTwo']);
                const getAllChannelsForPeerStub = mySandBox.stub(fabricClientConnection, 'getAllChannelsForPeer');
                getAllChannelsForPeerStub.onFirstCall().resolves(['channelOne', 'channelTwo']);
                getAllChannelsForPeerStub.onSecondCall().resolves(['channelTwo']);

                const installedChaincodeStub = mySandBox.stub(fabricClientConnection, 'getInstalledChaincode');

                const installedChaincodeMapOne: Map<string, Array<string>> = new Map<string, Array<string>>();
                installedChaincodeMapOne.set('sample-car-network', ['1.0', '1.2']);
                installedChaincodeMapOne.set('sample-food-network', ['0.6']);

                installedChaincodeStub.withArgs('peerOne').returns(installedChaincodeMapOne);

                const installedChaincodeMapTwo: Map<string, Array<string>> = new Map<string, Array<string>>();
                installedChaincodeMapTwo.set('biscuit-network', ['0.7']);
                installedChaincodeStub.withArgs('peerTwo').returns(installedChaincodeMapTwo);

                const instantiatedChaincodeStub = mySandBox.stub(fabricClientConnection, 'getInstantiatedChaincode');
                instantiatedChaincodeStub.withArgs('channelOne').resolves([{name: 'biscuit-network', version: '0.7'}]);
                instantiatedChaincodeStub.withArgs('channelTwo').resolves([{name: 'cake-network', version: '0.10'}]);

                blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
                blockchainNetworkExplorerProvider['connection'] = fabricClientConnection;

                allChildren = await blockchainNetworkExplorerProvider.getChildren();
            });

            afterEach(() => {
                mySandBox.restore();
            });

            it('should create a connected tree if there is a connection', async () => {

                allChildren.length.should.equal(2);

                const channelOne: ChannelTreeItem = allChildren[0] as ChannelTreeItem;
                channelOne.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                channelOne.contextValue.should.equal('blockchain-channel-item');
                channelOne.label.should.equal('channelOne');
                channelOne.peers.should.deep.equal(['peerOne']);

                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;
                channelTwo.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                channelTwo.contextValue.should.equal('blockchain-channel-item');
                channelTwo.label.should.equal('channelTwo');
                channelTwo.peers.should.deep.equal(['peerOne', 'peerTwo']);
            });

            it('should create channel children correctly', async () => {

                allChildren.length.should.equal(2);

                const channelOne: ChannelTreeItem = allChildren[0] as ChannelTreeItem;

                const channelChildrenOne: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelOne);
                channelChildrenOne.length.should.equal(2);

                const peersItemOne: PeersTreeItem = channelChildrenOne[0] as PeersTreeItem;
                peersItemOne.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                peersItemOne.contextValue.should.equal('blockchain-peers-item');
                peersItemOne.label.should.equal('Peers');
                peersItemOne.peers.should.deep.equal(['peerOne']);

                const instantiatedTreeItemOne: InstantiatedChainCodesTreeItem = channelChildrenOne[1] as InstantiatedChainCodesTreeItem;
                instantiatedTreeItemOne.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                instantiatedTreeItemOne.channel.should.equal('channelOne');
                instantiatedTreeItemOne.contextValue.should.equal('blockchain-instantiated-chaincodes-item');
                instantiatedTreeItemOne.label.should.equal('Instantiated Chaincodes');

                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;
                const channelChildrenTwo: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelTwo);
                channelChildrenTwo.length.should.equal(2);

                const peersItemTwo: PeersTreeItem = channelChildrenTwo[0] as PeersTreeItem;
                peersItemTwo.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                peersItemTwo.contextValue.should.equal('blockchain-peers-item');
                peersItemTwo.label.should.equal('Peers');
                peersItemTwo.peers.should.deep.equal(['peerOne', 'peerTwo']);

                const instantiatedTreeItemTwo: InstantiatedChainCodesTreeItem = channelChildrenTwo[1] as InstantiatedChainCodesTreeItem;
                instantiatedTreeItemTwo.collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                instantiatedTreeItemTwo.channel.should.equal('channelTwo');
                instantiatedTreeItemTwo.contextValue.should.equal('blockchain-instantiated-chaincodes-item');
                instantiatedTreeItemTwo.label.should.equal('Instantiated Chaincodes');
            });

            it('should create the peers correctly', async () => {

                const channelOne: ChannelTreeItem = allChildren[0] as ChannelTreeItem;

                const channelChildrenOne: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelOne);
                channelChildrenOne.length.should.equal(2);

                const peersItemOne: PeersTreeItem = channelChildrenOne[0] as PeersTreeItem;

                const peerItems: Array<PeerTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peersItemOne) as Array<PeerTreeItem>;

                peerItems.length.should.equal(1);
                peerItems[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                peerItems[0].contextValue.should.equal('blockchain-peer-item');
                peerItems[0].label.should.equal('peerOne');

                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;

                const channelChildrenTwo: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelTwo);
                channelChildrenTwo.length.should.equal(2);

                const peersItemTwo: PeersTreeItem = channelChildrenTwo[0] as PeersTreeItem;

                const peerItemsTwo: Array<PeerTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peersItemTwo) as Array<PeerTreeItem>;

                peerItemsTwo.length.should.equal(2);
                peerItemsTwo[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                peerItemsTwo[0].contextValue.should.equal('blockchain-peer-item');
                peerItemsTwo[0].label.should.equal('peerOne');

                peerItemsTwo[1].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                peerItemsTwo[1].contextValue.should.equal('blockchain-peer-item');
                peerItemsTwo[1].label.should.equal('peerTwo');
            });

            it('should create the install chaincode correctly', async () => {

                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;

                const channelChildrenTwo: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelTwo);
                channelChildrenTwo.length.should.equal(2);

                const peersItemOne: PeersTreeItem = channelChildrenTwo[0] as PeersTreeItem;

                const peerItems: Array<PeerTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peersItemOne) as Array<PeerTreeItem>;

                const chaincodeItems: Array<InstalledChainCodeTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peerItems[0]) as Array<InstalledChainCodeTreeItem>;

                chaincodeItems.length.should.equal(2);
                chaincodeItems[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                chaincodeItems[0].contextValue.should.equal('blockchain-installed-chaincode-item');
                chaincodeItems[0].label.should.equal('sample-car-network');

                chaincodeItems[1].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                chaincodeItems[1].contextValue.should.equal('blockchain-installed-chaincode-item');
                chaincodeItems[1].label.should.equal('sample-food-network');

                const chaincodeItemsTwo: Array<ChainCodeTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peerItems[1]) as Array<ChainCodeTreeItem>;

                chaincodeItemsTwo.length.should.equal(1);
                chaincodeItemsTwo[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.Collapsed);
                chaincodeItemsTwo[0].contextValue.should.equal('blockchain-installed-chaincode-item');
                chaincodeItemsTwo[0].label.should.equal('biscuit-network');
            });

            it('should create the installed versions correctly', async () => {
                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;

                const channelChildrenTwo: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelTwo);
                channelChildrenTwo.length.should.equal(2);

                const peersItemOne: PeersTreeItem = channelChildrenTwo[0] as PeersTreeItem;

                const peerItems: Array<PeerTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peersItemOne) as Array<PeerTreeItem>;

                const chaincodeItems: Array<InstalledChainCodeTreeItem> = await blockchainNetworkExplorerProvider.getChildren(peerItems[0]) as Array<InstalledChainCodeTreeItem>;

                const versionsItemsOne: Array<InstalledChainCodeVersionTreeItem> = await blockchainNetworkExplorerProvider.getChildren(chaincodeItems[0]) as Array<InstalledChainCodeVersionTreeItem>;
                versionsItemsOne.length.should.equal(2);
                versionsItemsOne[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
                versionsItemsOne[0].contextValue.should.equal('blockchain-installed-chaincode-version-item');
                versionsItemsOne[0].label.should.equal('1.0');

                versionsItemsOne[1].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
                versionsItemsOne[1].contextValue.should.equal('blockchain-installed-chaincode-version-item');
                versionsItemsOne[1].label.should.equal('1.2');

                const versionsItemsTwo: Array<InstalledChainCodeVersionTreeItem> = await blockchainNetworkExplorerProvider.getChildren(chaincodeItems[1]) as Array<InstalledChainCodeVersionTreeItem>;

                versionsItemsTwo.length.should.equal(1);
                versionsItemsTwo[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
                versionsItemsTwo[0].contextValue.should.equal('blockchain-installed-chaincode-version-item');
                versionsItemsTwo[0].label.should.equal('0.6');

            });

            it('should create instantiated chaincode correctly', async () => {

                const channelOne: ChannelTreeItem = allChildren[0] as ChannelTreeItem;

                const channelChildrenOne: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelOne);
                channelChildrenOne.length.should.equal(2);

                const instatiateChaincodesItemOne: InstantiatedChainCodesTreeItem = channelChildrenOne[1] as InstantiatedChainCodesTreeItem;

                const instantiatedChainItemsOne: Array<ChainCodeTreeItem> = await blockchainNetworkExplorerProvider.getChildren(instatiateChaincodesItemOne) as Array<ChainCodeTreeItem>;

                instantiatedChainItemsOne.length.should.equal(1);
                instantiatedChainItemsOne[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
                instantiatedChainItemsOne[0].contextValue.should.equal('blockchain-chaincode-item');
                instantiatedChainItemsOne[0].label.should.equal('biscuit-network - 0.7');

                const channelTwo: ChannelTreeItem = allChildren[1] as ChannelTreeItem;

                const channelChildrenTwo: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren(channelTwo);
                channelChildrenTwo.length.should.equal(2);

                const instatiateChaincodesItemTwo: InstantiatedChainCodesTreeItem = channelChildrenTwo[1] as InstantiatedChainCodesTreeItem;

                const instantiatedChainItemsTwo: Array<ChainCodeTreeItem> = await blockchainNetworkExplorerProvider.getChildren(instatiateChaincodesItemTwo) as Array<ChainCodeTreeItem>;

                instantiatedChainItemsTwo.length.should.equal(1);
                instantiatedChainItemsTwo[0].collapsibleState.should.equal(vscode.TreeItemCollapsibleState.None);
                instantiatedChainItemsTwo[0].contextValue.should.equal('blockchain-chaincode-item');
                instantiatedChainItemsTwo[0].label.should.equal('cake-network - 0.10');
            });
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

            await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            await vscode.commands.executeCommand('blockchainExplorer.refreshEntry');

            onDidChangeTreeDataSpy.should.have.been.called;
        });

        it('should test when a connection is added the list is refreshed', async () => {

            await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

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

        it('should test the tree is refreshed when a client connection is passed in', async () => {

            await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            const rootPath = path.dirname(__dirname);

            const myConnection = {
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
            };

            const myClientConnection = new FabricClientConnection(myConnection);

            const executeCommandSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            await vscode.commands.executeCommand('blockchainExplorer.refreshEntry', myClientConnection);

            onDidChangeTreeDataSpy.should.have.been.called;

            blockchainNetworkExplorerProvider['connection'].should.deep.equal(myClientConnection);

            executeCommandSpy.should.have.been.calledTwice;
            executeCommandSpy.getCall(1).should.have.been.calledWith('setContext', 'blockchain-connected');
        });
    });

    describe('disconnect', () => {

        let mySandBox;

        beforeEach(() => {
            mySandBox = sinon.createSandbox();
        });

        afterEach(() => {
            mySandBox.restore();
        });

        it('should disconnect the client connection', async () => {
            const rootPath = path.dirname(__dirname);

            const myConnection = {
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
            };

            const myClientConnection = new FabricClientConnection(myConnection);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            blockchainNetworkExplorerProvider['connection'] = myClientConnection;

            const onDidChangeTreeDataSpy = mySandBox.spy(blockchainNetworkExplorerProvider['_onDidChangeTreeData'], 'fire');

            const executeCommandSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            await vscode.commands.executeCommand('blockchainExplorer.disconnectEntry');

            onDidChangeTreeDataSpy.should.have.been.called;

            should.not.exist(blockchainNetworkExplorerProvider['connection']);

            executeCommandSpy.should.have.been.calledTwice;
            executeCommandSpy.getCall(1).should.have.been.calledWith('setContext', 'blockchain-connected');
        });
    });

    describe('getTreeItem', () => {

        let mySandBox;

        beforeEach(() => {
            mySandBox = sinon.createSandbox();
        });

        afterEach(() => {
            mySandBox.restore();
        });

        it('should get a tree item', async () => {
            await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

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

            connections.push(myConnection);

            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren();

            const result: ConnectionTreeItem = blockchainNetworkExplorerProvider.getTreeItem(allChildren[0]) as ConnectionTreeItem;

            result.label.should.equal('myConnection');
        });
    });
});
