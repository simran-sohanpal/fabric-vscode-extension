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

export class BlockchainNetworkExplorerProvider implements vscode.TreeDataProvider<BlockchainTreeItem> {

    // only for testing so can get the updated tree
    public tree: Array<BlockchainTreeItem> = [];

    private _onDidChangeTreeData: vscode.EventEmitter<BlockchainTreeItem | undefined> = new vscode.EventEmitter<BlockchainTreeItem | undefined>();
    // tslint:disable-next-line member-ordering
    readonly onDidChangeTreeData: vscode.Event<BlockchainTreeItem | undefined> = this._onDidChangeTreeData.event;

    // TODO: not sure if need both of these
    private connection: FabricClientConnection = null;
    private connected: boolean = false;

    refresh(): void {
        console.log('refresh');
        this._onDidChangeTreeData.fire();
    }

    test(data): Promise<void> {
        console.log('test', data);
        return GenerateTests.createFile();
    }

    async connect(connection: ConnectionTreeItem): Promise<void> {
        console.log('connect', connection);

        this.connection = new FabricClientConnection(connection);
        await this.connection.connect();
        this.connected = true;

        this.refresh();
    }

    getTreeItem(element: BlockchainTreeItem): vscode.TreeItem {
        console.log('getTreeItem', element);
        return element;
    }

    async getChildren(element?: BlockchainTreeItem): Promise<BlockchainTreeItem[]> {
        console.log('getChildren', element);

        if (element) {
            if (element.contextValue === 'blockchain-connection-item') {
                return this.createConnectionIdentityTree(element as ConnectionTreeItem);
            }
            if (element.contextValue === 'blockchain-channel-item') {
                return this.createPeerTree(element as ChannelTreeItem);
            }

            if (element.contextValue === 'blockchain-peer-item') {
                // return this.createInstalledChaincodeTree(element as PeerTreeItem);
            }
        }

        if (this.connection && this.connected) {
            this.tree = await this.createConnectedTree();
        } else {
            this.tree = await this.createConnectionTree();
        }

        return this.tree;
    }

    // private createInstalledChaincodeTree(peerElement: PeerTreeItem) : Promise<Array<InstalledChainCodeTreeItem>> {
    // 	const tree = [];

    // 	const peer = peerElement.peer;

    // 	this.connection.getInstalledChaincode(peer);
    // }

    private createPeerTree(channelElement: ChannelTreeItem): Promise<Array<PeerTreeItem>> {
        const tree: Array<PeerTreeItem> = [];

        const peers: Array<string> = channelElement.peers;

        peers.forEach((peer) => {
            tree.push(new PeerTreeItem(peer));
        });

        return Promise.resolve(tree);
    }

    private async createConnectedTree(): Promise<Array<ChannelTreeItem>> {
        const tree: Array<ChannelTreeItem> = [];

        const channelMap: Map<string, Array<string>> = await this.createChannelMap();

        channelMap.forEach((peers, channel) => {
            tree.push(new ChannelTreeItem(channel, peers));
        });

        return tree;
    }

    private createChannelMap(): Promise<Map<string, Array<string>>> {
        // TODO: this should not return actual peers should just return names
        const allPeers = this.connection.getAllPeers();

        const channelMap = new Map<string, Array<any>>();
        return allPeers.reduce((promise: Promise<void>, peer) => {
            return promise
                .then(() => {
                    // TODO: should just return channelNames
                    return this.connection.getAllChannelsForPeer(peer.getName());
                })
                .then((channels: Array<any>) => {
                    channels.forEach((channel) => {
                        const channelName = channel.channel_id;
                        let peers = channelMap.get(channelName);
                        if (peers) {
                            peers.push(peer);
                            channelMap.set(channelName, peers);
                        } else {
                            peers = [peer];
                            channelMap.set(channelName, peers);
                        }
                    });
                });
        }, Promise.resolve()).then(() => {
            return channelMap;
        });
    }

    private createConnectionIdentityTree(element: ConnectionTreeItem): Promise<ConnectionIdentityTreeItem[]> {
        const tree: Array<ConnectionIdentityTreeItem> = [];

        element.connection.identities.forEach((identity) => {
            try {
                const cert: ParsedCertificate = new ParsedCertificate(identity.certificatePath);
                const commonName: string = cert.getCommonName();

                const connection = {
                    name: element.connection.name,
                    connectionProfilePath: element.connection.connectionProfilePath,
                    certificatePath: identity.certificatePath,
                    privateKeyPath: identity.privateKeyPath
                };

                const command = {
                    command: 'blockchainExplorer.connectEntry',
                    title: '',
                    arguments: [connection]
                };

                tree.push(new ConnectionIdentityTreeItem(commonName, command));

            } catch (error) {
                vscode.window.showErrorMessage('Error parsing certificate ' + error.message);
            }
        });

        return Promise.resolve(tree);
    }

    private createConnectionTree(): Promise<BlockchainTreeItem[]> {
        const tree: Array<BlockchainTreeItem> = [];

        const allConnections: Array<any> = this.getNetworkConnection();

        allConnections.forEach((connection) => {

            let collapsibleState: vscode.TreeItemCollapsibleState;
            let command: vscode.Command;

            if (connection.identities.length > 1) {
                collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            } else {
                collapsibleState = vscode.TreeItemCollapsibleState.None;
                command = {
                    command: 'blockchainExplorer.connectEntry',
                    title: '',
                    arguments: [connection]
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
        return vscode.workspace.getConfiguration().get('fabric.connections');
    }
}
