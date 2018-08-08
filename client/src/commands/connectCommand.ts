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
import { Util } from './util';
import { FabricClientConnection } from '../fabricClientConnection';
import { ParsedCertificate } from '../parsedCertificate';

export async function connect(connection: any): Promise<{} | string | void> {
    console.log('connect');

    if (!connection) {
        const connectionName: string = await Util.showConnectionQuickPickBox('Choose a connection to connect with');

        if (!connectionName) {
            return Promise.resolve();
        }

        const connections: Array<any> = vscode.workspace.getConfiguration().get('fabric.connections');
        const connectionConfig: any = connections.find((conn) => {
            return conn.name === connectionName;
        });

        if (!connectionConfig) {
            vscode.window.showErrorMessage('Could not connect as no connection found');
            return Promise.resolve();
        }

        connection = {
            connectionProfilePath: connectionConfig.connectionProfilePath
        };

        if (connectionConfig.identities.length > 1) {
            const identityName = await Util.showIdentityConnectionQuickPickBox('Choose an identity to connect with', connectionConfig);

            if (!identityName) {
                return Promise.resolve();
            }

            const foundIdentity = connectionConfig.identities.find(((identity) => {
                const parsedCert: any = new ParsedCertificate(identity.certificatePath);
                return parsedCert.getCommonName() === identityName;
            }));

            if (!foundIdentity) {
                vscode.window.showErrorMessage('Could not connect as no identity found');
                return Promise.resolve();
            }

            connection.certificatePath = foundIdentity.certificatePath;
            connection.privateKeyPath = foundIdentity.privateKeyPath;
        } else {
            connection.certificatePath = connectionConfig.identities[0].certificatePath;
            connection.privateKeyPath = connectionConfig.identities[0].privateKeyPath;
        }
    }

    try {
        const fabricConnection: FabricClientConnection = new FabricClientConnection(connection);
        await fabricConnection.connect();

        return vscode.commands.executeCommand('blockchainExplorer.refreshEntry', fabricConnection);
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
        return Promise.reject(error);
    }
}
