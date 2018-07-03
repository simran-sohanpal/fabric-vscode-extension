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

import * as path from 'path';

import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { FabricClientConnection } from '../src/fabricClientConnection';
import * as fabricClient from 'fabric-client';

chai.should();
chai.use(sinonChai);

// tslint:disable no-unused-expression
describe('FabricClientConnection', () => {

    let fabricClientStub;
    let fabricClientConnection;

    let mySandBox;

    afterEach(() => {
        mySandBox.restore();
    });

    beforeEach(async () => {
        mySandBox = sinon.createSandbox();

        const rootPath = path.dirname(__dirname);

        const connectionData = {
            connectionProfilePath: path.join(rootPath, '../test/data/connectionOne/connection.json'),
            certificatePath: path.join(rootPath, '../test/data/connectionOne/credentials/certificate'),
            privateKeyPath: path.join(rootPath, '../test/data/connectionOne/credentials/privateKey')
        };

        fabricClientConnection = new FabricClientConnection(connectionData);

        fabricClientStub = mySandBox.createStubInstance(fabricClient);

        mySandBox.stub(fabricClient, 'loadFromConfig').resolves(fabricClientStub);

        fabricClientStub.getMspid.returns('myMSPId');
    });

    describe('connect', () => {
        it('should connect to a fabric', async () => {
            await fabricClientConnection.connect();
            fabricClientStub.setAdminSigningIdentity.should.have.been.calledWith(sinon.match.string, sinon.match.string, 'myMSPId');
        });
    });

    describe('getAllPeerNames', () => {
        it('should get all the names of the peer', async () => {
            const peerOne: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1454', {name: 'peerOne'});
            const peerTwo: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1453', {name: 'peerTwo'});

            fabricClientStub.getPeersForOrg.returns([peerOne, peerTwo]);

            await fabricClientConnection.connect();

            const peerNames: Array<string> = await fabricClientConnection.getAllPeerNames();
            peerNames.should.deep.equal(['peerOne', 'peerTwo']);
        });
    });

    describe('getPeer', () => {
        it('should get a peer', async () => {
            const peerOne: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1454', {name: 'peerOne'});
            const peerTwo: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1453', {name: 'peerTwo'});

            fabricClientStub.getPeersForOrg.returns([peerOne, peerTwo]);

            await fabricClientConnection.connect();

            const peer: fabricClient.Peer = await fabricClientConnection.getPeer('peerTwo');
            peer.getName().should.deep.equal('peerTwo');
        });
    });

    describe('getAllChannelsForPeer', () => {
        it('should get all the channels a peer has joined', async () => {
            const peerOne: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1454', {name: 'peerOne'});

            fabricClientStub.getPeersForOrg.returns([peerOne]);

            const channelOne = {channel_id: 'channel-one'};
            const channelTwo = {channel_id: 'channel-two'};
            fabricClientStub.queryChannels.resolves({channels: [channelOne, channelTwo]});

            await fabricClientConnection.connect();

            const channelNames: Array<string> = await fabricClientConnection.getAllChannelsForPeer('peerTwo');

            channelNames.should.deep.equal(['channel-one', 'channel-two']);
        });
    });

    describe('getInstalledChaincode', () => {
        it('should get the install chaincode', async () => {
            const peerOne: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1454', {name: 'peerOne'});
            const peerTwo: fabricClient.Peer = new fabricClient.Peer('grpc://localhost:1453', {name: 'peerTwo'});

            fabricClientStub.getPeersForOrg.returns([peerOne, peerTwo]);

            fabricClientStub.queryInstalledChaincodes.withArgs(peerOne).resolves({
                chaincodes: [{
                    name: 'biscuit-network',
                    version: '0.7'
                }, {name: 'biscuit-network', version: '0.8'}, {name: 'cake-network', version: '0.8'}]
            });

            await fabricClientConnection.connect();
            const installedChaincode: Map<string, Array<string>> = await fabricClientConnection.getInstalledChaincode('peerOne');
            installedChaincode.size.should.equal(2);
            Array.from(installedChaincode.keys()).should.deep.equal(['biscuit-network', 'cake-network']);
            installedChaincode.get('biscuit-network').should.deep.equal(['0.7', '0.8']);
            installedChaincode.get('cake-network').should.deep.equal(['0.8']);
        });
    });

    describe('getInstantiatedChaincode', () => {
        it('should get the instantiated chaincode', async () => {
            const channelOne = {channel_id: 'channel-one', queryInstantiatedChaincodes: mySandBox.stub()};

            channelOne.queryInstantiatedChaincodes.resolves({
                chaincodes: [{name: 'biscuit-network', version: '0,7'}, {name: 'cake-network', version: '0.8'}]
            });

            fabricClientStub.getChannel.returns(channelOne);

            await fabricClientConnection.connect();
            const instantiatedChainodes: Array<any> = await fabricClientConnection.getInstantiatedChaincode('channel-one');

            instantiatedChainodes.should.deep.equal([{name: 'biscuit-network', version: '0,7'}, {
                name: 'cake-network',
                version: '0.8'
            }]);
        });
    });
});
