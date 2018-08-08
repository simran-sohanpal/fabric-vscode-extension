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
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { Util } from '../../src/commands/util';
chai.use(sinonChai);
import * as fs from 'fs';

// Defines a Mocha test suite to group tests of similar kind together
describe('CreateFabricProjectCommand', () => {
    // suite variables
    let mySandBox;
    let sendCommandStub;
    let errorSpy;
    let quickPickStub;
    let openDialogStub;
    let rootPath;
    let uri: vscode.Uri;
    let uriArr: Array<vscode.Uri>;

    beforeEach(() => {
        mySandBox = sinon.createSandbox();
        sendCommandStub = mySandBox.stub(Util, 'sendCommand');
        errorSpy = mySandBox.spy(vscode.window, 'showErrorMessage');
        quickPickStub = mySandBox.stub(vscode.window, 'showQuickPick');
        openDialogStub = mySandBox.stub(vscode.window, 'showOpenDialog');
        rootPath = path.dirname(__dirname);
        uri = vscode.Uri.file(path.join(rootPath, '../../test/data/fabricProject') );
        uriArr = [uri];
    });
    afterEach(() => {
        mySandBox.restore();
    });

    // Define assertion
    it('should start a fabric project', async () => {
        mySandBox.restore();
        await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();
        try {
            fs.mkdirSync(uri.fsPath);
        } catch (error) {
            if (!error.message.includes('file already exists') ) {
                throw new error('failed to create test directory:' + uri.fsPath);
            }
        }
        openDialogStub = mySandBox.stub(vscode.window, 'showOpenDialog');
        openDialogStub.resolves(uriArr);

        await vscode.commands.executeCommand('createFabricProjectEntry');
        // check package.json has been created
        const pathToCheck = path.join(rootPath, '../../test/data/fabricProject/package.json');
        chai.assert(fs.existsSync(pathToCheck), 'No package.json found, looking here:' + pathToCheck);

    }).timeout(20000);

    it('should show error if npm is not installed', async () => {
        await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

        // npm not installed
        sendCommandStub.onCall(0).rejects();
        await vscode.commands.executeCommand('createFabricProjectEntry');
        errorSpy.should.have.been.calledWith('npm is required before creating a fabric project');
    });

    it('should show error is yo is not installed and not wanted', async () => {
        await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

        // yo not installed and not wanted
        sendCommandStub.onCall(0).rejects({message : 'npm ERR'});
        quickPickStub.resolves('no');
        await vscode.commands.executeCommand('createFabricProjectEntry');
        errorSpy.should.have.been.calledWith('npm modules: yo and generator-fabric are required before creating a fabric project');
    });

    it('should show error message if generator-fabric fails to install', async () => {
        await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

        // generator-fabric not installed and wanted but fails to install
        sendCommandStub.onCall(0).resolves();
        sendCommandStub.onCall(1).rejects();
        quickPickStub.resolves('yes');
        openDialogStub.resolves(uriArr);
        sendCommandStub.onCall(2).rejects();
        await vscode.commands.executeCommand('createFabricProjectEntry');
        errorSpy.should.have.been.calledWith('Issue installing generator-fabric module');
    });

    it('should show error message if yo fails to install', async () => {
        await vscode.extensions.getExtension('hyperledger.hyperledger-fabric').activate();

        // yo not installed and wanted but fails to install
        sendCommandStub.onCall(0).rejects({message : 'npm ERR'});
        quickPickStub.resolves('yes');
        openDialogStub.resolves(uriArr);
        sendCommandStub.onCall(1).rejects();
        await vscode.commands.executeCommand('createFabricProjectEntry');
        errorSpy.should.have.been.calledWith('Issue installing yo node module');
    });

    it('should show error message if we fail to create a smart contract', async () => {
        // generator-fabric and yo not installed and wanted
        sendCommandStub.onCall(0).rejects({message : 'npm ERR'});
        quickPickStub.resolves('yes');
        openDialogStub.resolves(uriArr);
        // npm install works
        sendCommandStub.onCall(1).resolves();
        sendCommandStub.onCall(2).resolves();
        // issue installing yo fabric should show an error
        sendCommandStub.onCall(3).rejects();
        await vscode.commands.executeCommand('createFabricProjectEntry');
        errorSpy.should.have.been.calledWith('Issue creating fabric project');
    });
}); // end of createFabricCommand tests
