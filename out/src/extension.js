'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
var vscode = require("vscode");
var VHDLFormatter = require("./VHDLFormatter/VHDLFormatter");
var config = require("./config");
function getDocumentRange(document) {
    var start = new vscode.Position(0, 0);
    var lastLine = document.lineCount - 1;
    var end = new vscode.Position(lastLine, document.lineAt(lastLine).text.length);
    return new vscode.Range(start, end);
}


const getCurrentTextSelection = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        return editor.document.getText();
    }
    return editor.document.getText(selection);
};

const updateCurrentTextSelection = text => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const selection = editor.selection;
    if (selection.isEmpty) {
        editor.edit(builder => {
            const currentText = editor.document.getText();
            const definiteLastCharacter = currentText.length;
            const range = new vscode.Range(0, 0, editor.document.lineCount, definiteLastCharacter);
            builder.replace(range, text);
        });
    }
    else {
        editor.edit(builder => {
            builder.replace(selection, text);
        });
    }
};

function activate(context) {
    vscode.languages.registerDocumentFormattingEditProvider('vhdl', {
        provideDocumentFormattingEdits: function (document, options) {
            //var range = getDocumentRange(document);
            //var content = document.getText(range);
            var content = getCurrentTextSelection()
            var result = [];
            var beautifierSettings = config.getConfig(options);
            var msg = ""
            var formatted
            try {
                var _i = VHDLFormatter.beautify(content, beautifierSettings), formatted = _i[0], msg = _i[1];
            } catch (e) {
                msg = e.stack.split()
                msg = msg.slice(0, 2).join("\n")
                vscode.window.showErrorMessage(`Unxexpected problem : ${msg}`)
            }
            if (formatted) {
                //result.push(new vscode.TextEdit(range, formatted));
                updateCurrentTextSelection(formatted)
            } else {
                vscode.window.showErrorMessage(`Problem : ${msg}`)
            }
            return result;
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map