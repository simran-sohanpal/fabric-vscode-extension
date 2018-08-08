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
import { window, Uri, commands, OutputChannel } from 'vscode';
import {Util} from './util';

export async function createFabricProject(): Promise<void> {
    console.log('create Fabric Project');
    // check for yo and generator-fabric
    let needYo: boolean = false;
    let needGenFab: boolean = false;

    try {
        await Util.sendCommand('npm view yo version');
        console.log('yo is installed');
        try {
            await Util.sendCommand('npm view generator-fabric version');
            console.log('generator-fabric installed');
        } catch (error) {
            needGenFab = true;
            console.log('generator-fabric missing');
        }
    } catch (error) {
        if (error.message.includes('npm ERR')) {
            console.log('npm installed, yo missing');
            needYo = true;
            needGenFab = true; // assume generator-fabric isn't installed either
        } else {
            console.log('npm not installed');
            window.showErrorMessage('npm is required before creating a fabric project');
            return;
        }
    }
    // if yo/generator fabric are missing, ask if we can install them
    if (needYo || needGenFab) {
        const quickPickOptions = {
            placeHolder: 'Can this extension install missing npm packages before proceeding?',
            ignoreFocusOut: true
        };
        const installPermission: string = await window.showQuickPick(['yes', 'no'], quickPickOptions);
        if (installPermission !== 'yes') {
            window.showErrorMessage('npm modules: yo and generator-fabric are required before creating a fabric project');
            return;
        }
    }

    // Create and show output channel
    const outputChannel: OutputChannel = window.createOutputChannel('Hyperledger Fabric');
    outputChannel.show();

    // Install missing node modules
    if (needYo) {
        outputChannel.appendLine('Installing yo');
        try {
            const yoInstOut: string = await Util.sendCommand('npm install -g yo');
            outputChannel.appendLine(yoInstOut);
        } catch (error) {
            window.showErrorMessage('Issue installing yo node module');
            outputChannel.appendLine(error);
            return;
        }
    }
    if (needGenFab) {
        outputChannel.appendLine('Installing generator-fabric');
        try {
            const genFabInstOut: string = await Util.sendCommand('npm install -g generator-fabric');
            outputChannel.appendLine(genFabInstOut);
        } catch (error) {
            window.showErrorMessage('Issue installing generator-fabric module');
            outputChannel.appendLine(error);
            return;
        }
    }

    // Prompt the user for a file system folder
    const openDialogOptions = {
        canSelectFolders: true,
        openLabel: 'Open'
    };
    const folderSelect: Uri[] | undefined = await window.showOpenDialog(openDialogOptions);
    if (folderSelect) {  // undefined if the user cancels the open dialog box

        // Open the returned folder in explorer, in a new window
        console.log('new fabric project folder is :' + folderSelect[0].fsPath);
        await commands.executeCommand('vscode.openFolder', folderSelect[0], true);

        // Run yo:fabric with default options in folderSelect
        // redirect to stdout as yo fabric prints to stderr
        const yoFabricCmd: string = `yo fabric:chaincode -- --language=javascript --name="new-smart-contract" --version=0.0.1 --description="My Smart Contract" --author="John Doe" --license=Apache-2.0 2>&1`;
        try {
            const yoFabricOut = await Util.sendCommand(yoFabricCmd, folderSelect[0].fsPath);
            outputChannel.appendLine(yoFabricOut);
            outputChannel.appendLine('Successfully generated fabric project');
        } catch (error) {
            console.log('found issue running yo:fabric command, see stderr:', error.stderr);
            window.showErrorMessage('Issue creating fabric project');
            outputChannel.appendLine(error);
        }

    } // end of if folderSelect

} // end of createFabricProject function
