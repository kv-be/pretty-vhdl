'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.getExtSettings = exports.getSettings = exports.CONFIGURATION_CASE_TYPENAME = exports.CONFIGURATION_CASE_KEYWORD = exports.CONFIGURATION_NEWLINE_AFTER_GENERIC = exports.CONFIGURATION_NEWLINE_AFTER_ELSE = exports.CONFIGURATION_NEWLINE_AFTER_SEMICOLON = exports.CONFIGURATION_NEWLINE_AFTER_THEN = exports.CONFIGURATION_NEWLINE_AFTER_PORT = exports.CONFIGURATION_ALIGN_SIGN_MODE = exports.CONFIGURATION_ALIGN_GENERIC_SIGN = exports.CONFIGURATION_ALIGN_PROCEDURE_SIGN = exports.CONFIGURATION_ALIGN_FUNCTION_SIGN = exports.CONFIGURATION_ALIGN_PORT_SIGN = exports.CONFIGURATION_ALIGN_ALL_SIGN = exports.CONFIGURATION_CHECK_ALIAS = exports.CONFIGURATION_REMOVE_REPORTS = exports.CONFIGURATION_REMOVE_COMMENTS = exports.CONFIGURATION_INSERT_FINAL_NEW_LINE = exports.CONFIGURATION_FIX_SIGNALS= exports.CONFIGURATION_BEGIN_END = exports.CONFIGURATION_KEY = void 0;
var vscode = require("vscode");
var VHDLFormatter = require("./VHDLFormatter/VHDLFormatter");
exports.CONFIGURATION_KEY = "prettyvhdl";
exports.CONFIGURATION_INSERT_FINAL_NEW_LINE = "insertFinalNewline"; // Boolean
exports.CONFIGURATION_REMOVE_COMMENTS = "removeComments"; // Boolean
exports.CONFIGURATION_REMOVE_REPORTS = "removeReports"; // Boolean
exports.CONFIGURATION_CHECK_ALIAS = "replaceByAliases"; // Boolean
exports.CONFIGURATION_ALIGN_ALL_SIGN = "align.all"; // Boolean
exports.CONFIGURATION_ALIGN_PORT_SIGN = "align.port"; // Boolean
exports.CONFIGURATION_ALIGN_FUNCTION_SIGN = "align.function"; // Boolean
exports.CONFIGURATION_ALIGN_PROCEDURE_SIGN = "align.procedure"; // Boolean
exports.CONFIGURATION_ALIGN_GENERIC_SIGN = "align.generic"; // Boolean
exports.CONFIGURATION_ALIGN_SIGN_MODE = "align.mode"; // AlignMode
exports.CONFIGURATION_NEWLINE_AFTER_PORT = "newline.port"; // NewLineConfig
exports.CONFIGURATION_NEWLINE_AFTER_THEN = "newline.then"; // NewLineConfig
exports.CONFIGURATION_NEWLINE_AFTER_SEMICOLON = "newline.semicolon"; // NewLineConfig
exports.CONFIGURATION_NEWLINE_AFTER_ELSE = "newline.else"; // NewLineConfig
exports.CONFIGURATION_NEWLINE_AFTER_GENERIC = "newline.generic"; // NewLineConfig
exports.CONFIGURATION_CASE_KEYWORD = "case.keyword"; // CaseType
exports.CONFIGURATION_CASE_TYPENAME = "case.typename"; // CaseType
exports.CONFIGURATION_FIX_SIGNALS = "fix.signals"; // testcase
exports.CONFIGURATION_BEGIN_END = "begin_end"; // testcase
var AlignMode;
(function (AlignMode) {
    AlignMode[AlignMode["Local"] = 0] = "Local";
    AlignMode[AlignMode["Global"] = 1] = "Global";
})(AlignMode || (AlignMode = {}));
var CaseType;
(function (CaseType) {
    CaseType[CaseType["UpperCase"] = 0] = "UpperCase";
    CaseType[CaseType["LowerCase"] = 1] = "LowerCase";
    CaseType[CaseType["DefaultCase"] = 2] = "DefaultCase";
})(CaseType || (CaseType = {}));
var NewLineConfig;
(function (NewLineConfig) {
    NewLineConfig[NewLineConfig["NewLine"] = 0] = "NewLine";
    NewLineConfig[NewLineConfig["NoNewLine"] = 1] = "NoNewLine";
    NewLineConfig[NewLineConfig["None"] = 2] = "None";
})(NewLineConfig || (NewLineConfig = {}));
function getSettings(section, key, defaultValue) {
    return vscode.workspace.getConfiguration(section, null).get(key, defaultValue);
}
exports.getSettings = getSettings;
function getExtSettings(key, defaultValue) {
    return getSettings(exports.CONFIGURATION_KEY, key, defaultValue);
}
exports.getExtSettings = getExtSettings;
function getEndOfLine() {
    var endOfLine = getSettings("files", "eol", "\n");
    var isValid = endOfLine == "\r\n" || endOfLine == "\n";
    return isValid ? endOfLine : "\n";
}
function getIndentation(options) {
    //if (!options.insertSpaces)
    //    return "\t";
    var tabSize = options.tabSize;
    if (tabSize < 1)
        tabSize = 3;
    return " ".repeat(tabSize);
}
function getConfig(options) {
    if (!options)
        options = { insertSpaces: true, tabSize: 3 };
    var indentation = getIndentation(options)
    var endOfLine = getEndOfLine();
    var removeComments = false //getExtSettings(exports.CONFIGURATION_REMOVE_COMMENTS, false);
    var removeReports = false //getExtSettings(exports.CONFIGURATION_REMOVE_REPORTS, false);
    var checkAlias = false //getExtSettings(exports.CONFIGURATION_CHECK_ALIAS, false);
    var addNewLine = false //getExtSettings(exports.CONFIGURATION_INSERT_FINAL_NEW_LINE, false);
    var newLineAfterPort = 'NoNewLine' //getExtSettings(exports.CONFIGURATION_NEWLINE_AFTER_PORT, NewLineConfig.None);
    var newLineAfterThen = 'NewLine'//getExtSettings(exports.CONFIGURATION_NEWLINE_AFTER_THEN, NewLineConfig.NewLine);
    var newLineAfterSemicolon = 'NewLine'//getExtSettings(exports.CONFIGURATION_NEWLINE_AFTER_SEMICOLON, NewLineConfig.NewLine);
    var newLineAfterElse = 'None'//getExtSettings(exports.CONFIGURATION_NEWLINE_AFTER_ELSE, NewLineConfig.NewLine);
    var newLineAfterGeneric = 'NoNewLine'//getExtSettings(exports.CONFIGURATION_NEWLINE_AFTER_GENERIC, NewLineConfig.None);
    var alignAllSign = true//getExtSettings(exports.CONFIGURATION_ALIGN_ALL_SIGN, false);
    var alignPortSign = true//getExtSettings(exports.CONFIGURATION_ALIGN_PORT_SIGN, false);
    var alignFunctionSign = true//getExtSettings(exports.CONFIGURATION_ALIGN_FUNCTION_SIGN, false);
    var alignProcedureSign = true//getExtSettings(exports.CONFIGURATION_ALIGN_PROCEDURE_SIGN, false);
    var alignGenericSign = true//getExtSettings(exports.CONFIGURATION_ALIGN_GENERIC_SIGN, false);
    var signAlignMode = 'global'//getExtSettings(exports.CONFIGURATION_ALIGN_SIGN_MODE, AlignMode.Local).toString().toLowerCase();
    var keywordCase = 'lowercase'//getExtSettings(exports.CONFIGURATION_CASE_KEYWORD, CaseType.UpperCase).toString().toLowerCase();
    var typenameCase = 'lowercase'//getExtSettings(exports.CONFIGURATION_CASE_TYPENAME, CaseType.UpperCase).toString().toLowerCase();
    var fixSignals = false//getExtSettings(exports.CONFIGURATION_FIX_SIGNALS, false);
    // FOR_SETTING: if ever settings are needed, check the following line 
    //var beginEndWithoutSpace = getExtSettings(exports.CONFIGURATION_BEGIN_END, false);
    var beginEndWithoutSpace = false
    var newLineSettings = new VHDLFormatter.NewLineSettings();
    newLineSettings.push("generic", newLineAfterGeneric.toString());
    newLineSettings.push("generic map", newLineAfterGeneric.toString());
    newLineSettings.push("port", newLineAfterPort.toString());
    newLineSettings.push("port map", newLineAfterPort.toString());
    newLineSettings.push(";", newLineAfterSemicolon.toString());
    newLineSettings.push("then", newLineAfterThen.toString());
    newLineSettings.push("else", newLineAfterElse.toString());
    var signAlignKeywords = [];
    if (alignGenericSign)
        signAlignKeywords.push("GENERIC");
    if (alignPortSign)
        signAlignKeywords.push("PORT");
    if (alignProcedureSign)
        signAlignKeywords.push("PROCEDURE");
    if (alignFunctionSign) {
        signAlignKeywords.push("FUNCTION");
        signAlignKeywords.push("IMPURE FUNCTION");
    }
    // FOR_SETTING:  the setting goes here in the datastructure (see last argument)
    var alignSettings = new VHDLFormatter.signAlignSettings(signAlignKeywords.length > 0, alignAllSign, signAlignMode, signAlignKeywords, beginEndWithoutSpace);
    return new VHDLFormatter.BeautifierSettings(removeComments, removeReports, checkAlias, alignSettings, keywordCase, typenameCase, indentation, newLineSettings, endOfLine, addNewLine);
}
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map