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
import { BlockchainNetworkExplorerProvider } from './explorer/BlockchainNetworkExplorer';
import { addConnection } from './commands/addConnectionCommand';

let blockchainNetworkExplorerProvider;

export function activate(context: vscode.ExtensionContext): void {
    console.log('CLIENT activate!!!');

    blockchainNetworkExplorerProvider = new BlockchainNetworkExplorerProvider();

    vscode.window.registerTreeDataProvider('blockchainExplorer', blockchainNetworkExplorerProvider);
    vscode.commands.registerCommand('blockchainExplorer.refreshEntry', () => blockchainNetworkExplorerProvider.refresh());
    vscode.commands.registerCommand('blockchainExplorer.connectEntry', (config) => blockchainNetworkExplorerProvider.connect(config));
    vscode.commands.registerCommand('blockchainExplorer.addConnectionEntry', addConnection);
    vscode.commands.registerCommand('blockchainExplorer.testEntry', (data) => blockchainNetworkExplorerProvider.test(data));

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {

        if (e.affectsConfiguration('fabric.connections')) {
            return vscode.commands.executeCommand('blockchainExplorer.refreshEntry');
        }
    }));
}

/*
 * Needed for testing
 */
export function getBlockchainNetworkExplorerProvider(): BlockchainNetworkExplorerProvider {
    return blockchainNetworkExplorerProvider;
}
