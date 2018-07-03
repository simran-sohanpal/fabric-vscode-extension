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

import * as myExtension from '../../src/extension';
import * as fabricClient from 'fabric-client';
import { FabricClientConnection } from '../../src/fabricClientConnection';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { BlockchainTreeItem } from '../../src/explorer/model/BlockchainTreeItem';
import { ConnectionTreeItem } from '../../src/explorer/model/ConnectionTreeItem';

chai.should();
chai.use(sinonChai);
// tslint:disable-next-line no-var-requires
chai.use(require('chai-as-promised'));

// tslint:disable no-unused-expression
describe('ConnectCommand', () => {

    describe('connect', () => {

        let mySandBox;
        let fabricClientMock;

        beforeEach(() => {
            fabricClientMock = sinon.createStubInstance(fabricClient);
            mySandBox = sinon.createSandbox();
        });

        afterEach(async () => {
            await vscode.commands.executeCommand('blockchainExplorer.disconnectEntry');
            mySandBox.restore();

        });

        it('should test the a fabric can be connected to from the command', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            mySandBox.stub(vscode.window, 'showQuickPick').resolves('myConnection');

            const loadFromConfigStub = mySandBox.stub(fabricClient, 'loadFromConfig').returns(fabricClientMock);

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            loadFromConfigStub.should.have.been.called;

            refreshSpy.callCount.should.equal(3);
            refreshSpy.getCall(1).should.have.been.calledWith('blockchainExplorer.refreshEntry', sinon.match.instanceOf(FabricClientConnection));
            refreshSpy.getCall(2).should.have.been.calledWith('setContext', 'blockchain-connected');
        });

        it('should test the a fabric can be connected to from the command with multiple identities', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                },
                    {
                        certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                    }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const quickPickStub = mySandBox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onFirstCall().resolves('myConnection');
            quickPickStub.onSecondCall().resolves('Admin@org1.example.com');

            const loadFromConfigStub = mySandBox.stub(fabricClient, 'loadFromConfig').returns(fabricClientMock);

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            loadFromConfigStub.should.have.been.called;

            refreshSpy.callCount.should.equal(3);
            refreshSpy.getCall(1).should.have.been.calledWith('blockchainExplorer.refreshEntry', sinon.match.instanceOf(FabricClientConnection));
            refreshSpy.getCall(2).should.have.been.calledWith('setContext', 'blockchain-connected');
        });

        it('should test that can cancel on choosing connection', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const quickPickStub = mySandBox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onFirstCall().resolves();

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            refreshSpy.callCount.should.equal(1);
            refreshSpy.getCall(0).should.have.been.calledWith('blockchainExplorer.connectEntry');
        });

        it('should test that can be cancelled on choose identity', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                },
                    {
                        certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                    }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const quickPickStub = mySandBox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onFirstCall().resolves('myConnection');
            quickPickStub.onSecondCall().resolves();

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            refreshSpy.callCount.should.equal(1);
            refreshSpy.getCall(0).should.have.been.calledWith('blockchainExplorer.connectEntry');
        });

        it('should test the a fabric can be connected to from the tree', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren();

            const myConnectionItem: ConnectionTreeItem = allChildren[0] as ConnectionTreeItem;

            const loadFromConfigStub = mySandBox.stub(fabricClient, 'loadFromConfig').returns(fabricClientMock);

            const myConnection = {
                connectionProfilePath: myConnectionItem.connection.connectionProfilePath,
                certificatePath: myConnectionItem.connection.identities[0].certificatePath,
                privateKeyPath: myConnectionItem.connection.identities[0].privateKeyPath
            };

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry', myConnection);

            loadFromConfigStub.should.have.been.called;

            refreshSpy.callCount.should.equal(3);
            refreshSpy.getCall(1).should.have.been.calledWith('blockchainExplorer.refreshEntry', sinon.match.instanceOf(FabricClientConnection));
            refreshSpy.getCall(2).should.have.been.calledWith('setContext', 'blockchain-connected');
        });

        it('should handle connection not found', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            mySandBox.stub(vscode.window, 'showQuickPick').resolves('no connection');

            const errorMessageSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            errorMessageSpy.should.have.been.calledWith('Could not connect as no connection found');

            refreshSpy.callCount.should.equal(1);
            refreshSpy.getCall(0).should.have.been.calledWith('blockchainExplorer.connectEntry');
        });

        it('should handle identity not found', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                },
                    {
                        certificatePath: path.join(rootPath, '../../test/data/connectionTwo/credentials/certificate'),
                        privateKeyPath: path.join(rootPath, '../../test/data/connectionTwo/credentials/privateKey')
                    }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const quickPickStub = mySandBox.stub(vscode.window, 'showQuickPick');
            quickPickStub.onFirstCall().resolves('myConnection');
            quickPickStub.onSecondCall().resolves('no identity');

            const errorMessageSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry');

            errorMessageSpy.should.have.been.calledWith('Could not connect as no identity found');

            refreshSpy.callCount.should.equal(1);
            refreshSpy.getCall(0).should.have.been.calledWith('blockchainExplorer.connectEntry');
        });

        it('should handle error from conecting', async () => {
            await vscode.extensions.getExtension('IBM.blockchain-network-explorer').activate();

            const rootPath = path.dirname(__dirname);

            const connections = [{
                name: 'myConnection',
                connectionProfilePath: path.join(rootPath, '../../test/data/connectionOne/connection.json'),
                identities: [{
                    certificatePath: path.join(rootPath, '../../test/data/connectionOne/credentials/certificate'),
                    privateKeyPath: path.join(rootPath, '../../test/data/connectionOne/credentials/privateKey')
                }]
            }];

            // reset the available connections
            await vscode.workspace.getConfiguration().update('fabric.connections', connections, vscode.ConfigurationTarget.Global);

            const refreshSpy = mySandBox.spy(vscode.commands, 'executeCommand');

            const blockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
            const allChildren: Array<BlockchainTreeItem> = await blockchainNetworkExplorerProvider.getChildren();

            const myConnectionItem: ConnectionTreeItem = allChildren[0] as ConnectionTreeItem;

            const errorMessageSpy = mySandBox.spy(vscode.window, 'showErrorMessage');

            const loadFromConfigStub = mySandBox.stub(fabricClient, 'loadFromConfig').rejects({message: 'some error'});

            await vscode.commands.executeCommand('blockchainExplorer.connectEntry', myConnectionItem.connection).should.be.rejected;

            loadFromConfigStub.should.have.been.called;

            errorMessageSpy.should.have.been.calledWith('some error');

            refreshSpy.callCount.should.equal(1);
            refreshSpy.getCall(0).should.have.been.calledWith('blockchainExplorer.connectEntry');
        });
    });
});
