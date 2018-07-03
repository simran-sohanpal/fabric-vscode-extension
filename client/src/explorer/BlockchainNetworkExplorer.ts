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

// tslint:disable max-classes-per-file
'use strict';
import * as vscode from 'vscode';

import { FabricClientConnection } from '../fabricClientConnection';
import { GenerateTests } from './generateTests';
import { ParsedCertificate } from '../parsedCertificate';

import { PeerTreeItem } from './model/PeerTreeItem';
import { ChannelTreeItem } from './model/ChannelTreeItem';
import { AddConnectionTreeItem } from './model/AddConnectionTreeItem';
import { ConnectionIdentityTreeItem } from './model/ConnectionIdentityTreeItem';
import { BlockchainTreeItem } from './model/BlockchainTreeItem';
import { ConnectionTreeItem } from './model/ConnectionTreeItem';
import { ChainCodeTreeItem } from './model/ChainCodeTreeItem';
import { InstantiatedChainCodesTreeItem } from './model/InstantiatedChaincodesTreeItem';
import { PeersTreeItem } from './model/PeersTreeItem';
import { InstalledChainCodeTreeItem } from './model/InstalledChainCodeTreeItem';
import { InstalledChainCodeVersionTreeItem } from './model/InstalledChaincodeVersionTreeItem';

export class BlockchainNetworkExplorerProvider implements vscode.TreeDataProvider<BlockchainTreeItem> {

    // only for testing so can get the updated tree
    public tree: Array<BlockchainTreeItem> = [];

    private _onDidChangeTreeData: vscode.EventEmitter<any | undefined> = new vscode.EventEmitter<any | undefined>();
    // tslint:disable-next-line member-ordering
    readonly onDidChangeTreeData: vscode.Event<any | undefined> = this._onDidChangeTreeData.event;

    private connection: FabricClientConnection = null;

    async refresh(connection?: FabricClientConnection): Promise<void> {
        console.log('refresh', connection);
        if (connection) {
            this.connection = connection;
            // This controls which menu buttons appear
            await vscode.commands.executeCommand('setContext', 'blockchain-connected', true);
        }
        this._onDidChangeTreeData.fire();
    }

    async disconnect(): Promise<void> {
        console.log('disconnect');
        this.connection = null;
        // This controls which menu buttons appear
        await vscode.commands.executeCommand('setContext', 'blockchain-connected', false);
        return this.refresh();
    }

    test(data): Promise<void> {
        console.log('test', data);
        return GenerateTests.createFile();
    }

    getTreeItem(element: BlockchainTreeItem): vscode.TreeItem {
        console.log('getTreeItem', element);
        return element;
    }

    async getChildren(element?: BlockchainTreeItem): Promise<BlockchainTreeItem[]> {
        console.log('getChildren', element);

        try {

            if (element) {
                if (element instanceof ConnectionTreeItem) {
                    this.tree = await this.createConnectionIdentityTree(element as ConnectionTreeItem);
                }

                if (element instanceof ChannelTreeItem) {
                    this.tree = [];
                    const channelElement: ChannelTreeItem = element as ChannelTreeItem;
                    this.tree.push(new PeersTreeItem('Peers', channelElement.peers));
                    this.tree.push(new InstantiatedChainCodesTreeItem('Instantiated Chaincodes', element.label));
                }

                if (element instanceof PeersTreeItem) {
                    this.tree = await this.createPeerTree(element as PeersTreeItem);
                }

                if (element instanceof PeerTreeItem) {
                    this.tree = await this.createInstalledChaincodeTree(element as PeerTreeItem);
                }

                if (element instanceof InstantiatedChainCodesTreeItem) {
                    this.tree = await this.createInstantiatedChaincodeTree(element as InstantiatedChainCodesTreeItem);
                }

                if (element instanceof InstalledChainCodeTreeItem) {
                    this.tree = await this.createInstalledChaincodeVersionTree(element as InstalledChainCodeTreeItem);
                }

                return this.tree;
            }

            if (this.connection) {
                this.tree = await this.createConnectedTree();
            } else {
                this.tree = await this.createConnectionTree();
            }

        } catch (error) {
            vscode.window.showErrorMessage(error.message);
        }

        return this.tree;
    }

    private createInstalledChaincodeVersionTree(chaincodeElement: InstalledChainCodeTreeItem): Promise<Array<InstalledChainCodeVersionTreeItem>> {
        console.log('createInstalledChaincodeVersionTree', chaincodeElement);
        const tree: Array<InstalledChainCodeVersionTreeItem> = [];

        chaincodeElement.versions.forEach((version) => {
            tree.push(new InstalledChainCodeVersionTreeItem(version));
        });

        return Promise.resolve(tree);
    }

    private async createInstalledChaincodeTree(peerElement: PeerTreeItem): Promise<Array<InstalledChainCodeTreeItem>> {
        console.log('createInstalledChaincodeTree', peerElement);
        const tree: Array<InstalledChainCodeTreeItem> = [];

        const installedChainCodes: Map<string, Array<string>> = await this.connection.getInstalledChaincode(peerElement.label);
        installedChainCodes.forEach((versions, name) => {
            tree.push(new InstalledChainCodeTreeItem(name, versions));
        });

        return tree;
    }

    private async createInstantiatedChaincodeTree(instantiatedChainCodesElement: InstantiatedChainCodesTreeItem): Promise<Array<ChainCodeTreeItem>> {
        console.log('createInstantiatedChaincodeTree', instantiatedChainCodesElement);
        const tree: Array<ChainCodeTreeItem> = [];

        const instantiatedChaincodes: Array<any> = await this.connection.getInstantiatedChaincode(instantiatedChainCodesElement.channel);

        instantiatedChaincodes.forEach((instantiatedChaincode) => {
            tree.push(new ChainCodeTreeItem(instantiatedChaincode.name + ' - ' + instantiatedChaincode.version));
        });

        return tree;
    }

    private createPeerTree(peersElement: PeersTreeItem): Promise<Array<PeerTreeItem>> {
        console.log('createPeerTree', peersElement);
        const tree: Array<PeerTreeItem> = [];

        peersElement.peers.forEach((peer) => {
            tree.push(new PeerTreeItem(peer));
        });

        return Promise.resolve(tree);
    }

    private async createConnectedTree(): Promise<Array<ChannelTreeItem>> {
        console.log('createConnectedTree');
        const tree: Array<ChannelTreeItem> = [];

        const channelMap: Map<string, Array<string>> = await this.createChannelMap();

        channelMap.forEach((peers, channel) => {
            tree.push(new ChannelTreeItem(channel, peers));
        });

        return tree;
    }

    private async createChannelMap(): Promise<Map<string, Array<string>>> {
        console.log('createChannelMap');
        const allPeerNames: Array<string> = await this.connection.getAllPeerNames();

        const channelMap = new Map<string, Array<string>>();
        return allPeerNames.reduce((promise: Promise<void>, peerName) => {
            return promise
                .then(() => {
                    return this.connection.getAllChannelsForPeer(peerName);
                })
                .then((channels: Array<any>) => {
                    channels.forEach((channelName: string) => {
                        let peers = channelMap.get(channelName);
                        if (peers) {
                            peers.push(peerName);
                            channelMap.set(channelName, peers);
                        } else {
                            peers = [peerName];
                            channelMap.set(channelName, peers);
                        }
                    });
                });
        }, Promise.resolve()).then(() => {
            return channelMap;
        });
    }

    private createConnectionIdentityTree(element: ConnectionTreeItem): Promise<ConnectionIdentityTreeItem[]> {
        console.log('createConnectionIdentityTree', element);
        const tree: Array<ConnectionIdentityTreeItem> = [];

        element.connection.identities.forEach((identity) => {
            try {
                const cert: ParsedCertificate = new ParsedCertificate(identity.certificatePath);
                const commonName: string = cert.getCommonName();

                const fabricConnection = {
                    name: element.connection.name,
                    connectionProfilePath: element.connection.connectionProfilePath,
                    certificatePath: identity.certificatePath,
                    privateKeyPath: identity.privateKeyPath
                };

                const command = {
                    command: 'blockchainExplorer.connectEntry',
                    title: '',
                    arguments: [fabricConnection]
                };

                tree.push(new ConnectionIdentityTreeItem(commonName, command));

            } catch (error) {
                vscode.window.showErrorMessage('Error parsing certificate ' + error.message);
            }
        });

        return Promise.resolve(tree);
    }

    private createConnectionTree(): Promise<BlockchainTreeItem[]> {
        console.log('createdConnectionTree');
        const tree: Array<BlockchainTreeItem> = [];

        const allConnections: Array<any> = this.getNetworkConnection();

        allConnections.forEach((connection) => {

            let collapsibleState: vscode.TreeItemCollapsibleState;
            let command: vscode.Command;

            if (connection.identities.length > 1) {
                collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            } else {
                const fabricConnection = {
                    connectionProfilePath: connection.connectionProfilePath,
                    certificatePath: connection.identities[0].certificatePath,
                    privateKeyPath: connection.identities[0].privateKeyPath
                };

                collapsibleState = vscode.TreeItemCollapsibleState.None;
                command = {
                    command: 'blockchainExplorer.connectEntry',
                    title: '',
                    arguments: [fabricConnection]
                };
            }

            tree.push(new ConnectionTreeItem(connection.name,
                connection,
                collapsibleState,
                command));
        });

        tree.sort((connectionA, connectionB) => {
            if (connectionA.label > connectionB.label) {
                return 1;
            } else if (connectionA.label < connectionB.label) {
                return -1;
            } else {
                return 0;
            }
        });

        tree.push(new AddConnectionTreeItem('Add new network', {
            command: 'blockchainExplorer.addConnectionEntry',
            title: ''
        }));

        return Promise.resolve(tree);
    }

    private getNetworkConnection(): Array<any> {
        console.log('getNetworkConnection');
        return vscode.workspace.getConfiguration().get('fabric.connections');
    }
}
