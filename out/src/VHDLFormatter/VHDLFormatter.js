"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAsserts = exports.ApplyNoNewLineAfter = exports.beautify3 = exports.beautifySemicolonBlock = exports.beautifyComponentBlock = exports.beautifyCaseBlock = exports.AlignSign = exports.AlignSigns = exports.beautifyPortGenericBlock = exports.FormattedLineToString = exports.FormattedLine = exports.beautify = exports.BeautifierSettings = exports.signAlignSettings = exports.SetNewLinesAfterSymbols = exports.NewLineSettings = void 0;
var isTesting = false;
var ILEscape = "@@";
var ILCommentPrefix = ILEscape + "comments";
var ILIndentedReturnPrefix = ILEscape;
var ILQuote = "⨵";
var ILSingleQuote = "⦼";
var ILBackslash = "⨸";
var ILOthers = "⨹";
var ILSemicolon = "⨴";
var FormatMode;
(function (FormatMode) {
    FormatMode[FormatMode["Default"] = 0] = "Default";
    FormatMode[FormatMode["EndsWithSemicolon"] = 1] = "EndsWithSemicolon";
    FormatMode[FormatMode["CaseWhen"] = 2] = "CaseWhen";
    FormatMode[FormatMode["IfElse"] = 3] = "IfElse";
    FormatMode[FormatMode["PortGeneric"] = 4] = "PortGeneric";
})(FormatMode || (FormatMode = {}));
var Mode = FormatMode.Default;
var NewLineSettings = /** @class */ (function () {
    function NewLineSettings() {
        this.newLineAfter = [];
        this.noNewLineAfter = [];
    }
    NewLineSettings.prototype.newLineAfterPush = function (keyword) {
        this.newLineAfter.push(keyword);
    };
    NewLineSettings.prototype.noNewLineAfterPush = function (keyword) {
        this.noNewLineAfter.push(keyword);
    };
    NewLineSettings.prototype.push = function (keyword, addNewLine) {
        var str = addNewLine.toLowerCase();
        if (str == "none") {
            return;
        }
        else if (!str.startsWith("no")) {
            this.newLineAfterPush(keyword);
        }
        else {
            this.noNewLineAfterPush(keyword);
        }
    };
    return NewLineSettings;
}());
exports.NewLineSettings = NewLineSettings;
function ConstructNewLineSettings(dict) {
    var settings = new NewLineSettings();
    for (var key in dict) {
        settings.push(key, dict[key]);
    }
    return settings;
}
String.prototype.regexCount = function (pattern) {
    if (pattern.flags.indexOf("g") < 0) {
        pattern = new RegExp(pattern.source, pattern.flags + "g");
    }
    return (this.match(pattern) || []).length;
};
String.prototype.count = function (text) {
    return this.split(text).length - 1;
};
String.prototype.regexStartsWith = function (pattern) {
    var searchResult = this.search(pattern);
    return searchResult == 0;
};
String.prototype.regexIndexOf = function (pattern, startIndex) {
    startIndex = startIndex || 0;
    var searchResult = this.substr(startIndex).search(pattern);
    return (-1 === searchResult) ? -1 : searchResult + startIndex;
};
String.prototype.regexLastIndexOf = function (pattern, startIndex) {
    pattern = (pattern.global) ? pattern :
        new RegExp(pattern.source, 'g' + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : ''));
    if (typeof (startIndex) === 'undefined') {
        startIndex = this.length;
    }
    else if (startIndex < 0) {
        startIndex = 0;
    }
    var stringToWorkWith = this.substring(0, startIndex + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    var result;
    while ((result = pattern.exec(stringToWorkWith)) != null) {
        lastIndexOf = result.index;
        pattern.lastIndex = ++nextStop;
    }
    return lastIndexOf;
};
String.prototype.reverse = function () {
    return this.split('').reverse().join('');
};
String.prototype.convertToRegexBlockWords = function () {
    var result = new RegExp("(" + this + ")([^\\w]|$)");
    return result;
};
Array.prototype.convertToRegexBlockWords = function () {
    var wordsStr = this.join("|");
    var result = new RegExp("(" + wordsStr + ")([^\\w]|$)");
    return result;
};
function EscapeComments(arr) {
    var comments = [];
    var count = 0;
    for (var i = 0; i < arr.length; i++) {
        var line = arr[i];
        var commentStartIndex = line.indexOf("--");
        if (commentStartIndex >= 0) {
            comments.push(line.substr(commentStartIndex));
            if (line.substr(commentStartIndex - 1, commentStartIndex) !== " ") {
                arr[i] = line.substr(0, commentStartIndex) + " " + ILCommentPrefix + count;
            }
            else {
                arr[i] = line.substr(0, commentStartIndex) + ILCommentPrefix + count;
            }
            count++;
        }
    }
    var isInComment = false;
    var commentRegex = new RegExp("(?<=" + ILCommentPrefix + "[\\d]+).");
    for (var i = 0; i < arr.length; i++) {
        var commentStartIndex = 0;
        var hasComment = true;
        var commentEndInlineIndex = 0;
        while (hasComment) {
            var line = arr[i];
            if (!isInComment) {
                commentStartIndex = line.indexOf("/*");
                var commentEndIndex = line.indexOf("*/", commentStartIndex);
                if (commentStartIndex >= 0) {
                    if (commentEndIndex >= 0) {
                        commentEndInlineIndex = commentEndIndex + 2;
                        isInComment = false;
                        comments.push(line.substring(commentStartIndex, commentEndInlineIndex));
                        arr[i] = line.substr(0, commentStartIndex) + ILCommentPrefix + count + line.substr(commentEndInlineIndex);
                        count++;
                        hasComment = true;
                        if (commentStartIndex + 2 == line.length) {
                            hasComment = false;
                        }
                    }
                    else {
                        isInComment = true;
                        comments.push(line.substr(commentStartIndex));
                        arr[i] = line.substr(0, commentStartIndex) + ILCommentPrefix + count;
                        count++;
                        hasComment = false;
                    }
                }
                else {
                    hasComment = false;
                }
                continue;
            }
            if (isInComment) {
                var lastCommentEndIndex = line.regexLastIndexOf(commentRegex, line.length);
                if (commentStartIndex == 0) {
                    var commentEndIndex = line.indexOf("*/", lastCommentEndIndex);
                }
                else {
                    var commentEndIndex = line.indexOf("*/", commentStartIndex);
                }
                if (commentEndIndex >= 0) {
                    isInComment = false;
                    comments.push(line.substr(0, commentEndIndex + 2));
                    arr[i] = ILCommentPrefix + count + line.substr(commentEndIndex + 2);
                    count++;
                    hasComment = true;
                }
                else {
                    comments.push(line);
                    arr[i] = ILCommentPrefix + count;
                    count++;
                    hasComment = false;
                }
            }
        }
    }
    return comments;
}
function ToLowerCases(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].toLowerCase();
    }
}
function ToUpperCases(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].toUpperCase();
    }
}
function ToCamelCases(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0) + arr[i].slice(1).toLowerCase();
    }
}
function ReplaceKeyWords(text, keywords) {
    for (var k = 0; k < keywords.length; k++) {
        text = text.replace(new RegExp("([^a-zA-Z0-9_@]|^)" + keywords[k] + "([^a-zA-Z0-9_]|$)", 'gi'), "$1" + keywords[k] + "$2");
    }
    return text;
}
function SetKeywordCase(input, keywordcase, keywords) {
    var inputcase = keywordcase.toLowerCase();
    switch (inputcase) {
        case "lowercase":
            ToLowerCases(keywords);
            break;
        case "defaultcase":
            ToCamelCases(keywords);
            break;
        case "uppercase":
            ToUpperCases(keywords);
    }
    input = ReplaceKeyWords(input, keywords);
    return input;
}
function SetNewLinesAfterSymbols(text, newLineSettings) {
    if (newLineSettings == null) {
        return text;
    }
    if (newLineSettings.newLineAfter != null) {
        newLineSettings.newLineAfter.forEach(function (symbol) {
            var upper = symbol.toUpperCase();
            var rexString = "(" + upper + ")[ ]?([^ \r\n@])";
            var regex = null;
            if (upper.regexStartsWith(/\w/)) {
                regex = new RegExp("\\b" + rexString, "g");
            }
            else {
                regex = new RegExp(rexString, "g");
            }
            text = text.replace(regex, '$1\r\n$2');
            if (upper == "PORT") {
                text = text.replace(/\bPORT\b\s+MAP/, "PORT MAP");
            }
        });
    }
    if (newLineSettings.noNewLineAfter != null) {
        newLineSettings.noNewLineAfter.forEach(function (symbol) {
            var rexString = "(" + symbol.toUpperCase() + ")[ \r\n]+([^@])";
            var regex = null;
            if (symbol.regexStartsWith(/\w/)) {
                regex = new RegExp("\\b" + rexString, "g");
                text = text.replace(regex, '$1 $2');
            }
            else {
                regex = new RegExp(rexString, "g");
            }
            text = text.replace(regex, '$1 $2');
        });
    }
    return text;
}
exports.SetNewLinesAfterSymbols = SetNewLinesAfterSymbols;
var signAlignSettings = /** @class */ (function () {
    function signAlignSettings(isRegional, isAll, mode, keyWords) {
        this.isRegional = isRegional;
        this.isAll = isAll;
        this.mode = mode;
        this.keyWords = keyWords;
    }
    return signAlignSettings;
}());
exports.signAlignSettings = signAlignSettings;
var BeautifierSettings = /** @class */ (function () {
    function BeautifierSettings(removeComments, removeReport, checkAlias, signAlignSettings, keywordCase, typeNameCase, indentation, newLineSettings, endOfLine, addNewLine) {
        this.RemoveComments = removeComments;
        this.RemoveAsserts = removeReport;
        this.CheckAlias = checkAlias;
        this.SignAlignSettings = signAlignSettings;
        this.KeywordCase = keywordCase;
        this.TypeNameCase = typeNameCase;
        this.Indentation = indentation;
        this.NewLineSettings = newLineSettings;
        this.EndOfLine = endOfLine;
        this.AddNewLine = addNewLine;
    }
    return BeautifierSettings;
}());

function fix_in_allignment(arr) {
    for (let k = 0; k < arr.length; k++) {
        if (arr[k].regexStartsWith(new RegExp("(.*?)\\s*:\\s*IN \\S+(.*)"))) {
            arr[k] = arr[k].replace(new RegExp("(.*?\\s*:\\s*IN) (\\S+.*)"), "$1  $2"); // : in std_logic => : in  std_logic;
        }
    }
    return arr;
}

function fix_closing_brackets(input) {
    //input = input.replace(/(\s*generic map)\s*\(\s*(\w*)\s*=>\s*(\w*)/gi, "$1\(\r\n$2 : $3"); // generic with bracket on next line
    input = input.replace(/(\s*generic)\s*\(\s*(\w*)\s*:\s*(\w*)/gi, "$1 \(\r\n$2 : $3"); // generic with bracket on next line
    input = input.replace(/(\s*generic\s+map)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line
    input = input.replace(/(\s*generic)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line

    input = input.replace(/\);{1}([^;^\^\n)]*?\n+\s*port\s*\()/gi, "\r\n);$1") // generic with closing bracket on the same line as last assingment
    input = input.replace(/\){1}([^,^\^\n)]*?\n+\s*port\s+map\s*\()/gi, "\r\n)$1") // generic with closing bracket on the same line as last assingment
    input = input.replace(/(\s*port\s+map[\s\S\n]+?)\);(.*)/gi, "$1\r\n);$2"); // closing port map bracket not on seperate line
    input = input.replace(/(\s*port\s*\([\s\S\n]+?)\);([^\)]+\bend\s+)/gi, "$1\r\n);$2"); // force closing port bracket on next line
    input = input.replace(/\r\n\s*[\r\n]+(\s*\);.*)/gi, "\r\n$1"); // delete empty line before ); 
    input = input.replace(/\r\n\s*[\r\n]+(\s*\).*)/gi, "\r\n$1"); // delete empyt line before )
    input = input.replace(/\r\n\s*[\r\n]+(\s*port.*)/gi, "\r\n$1"); // delete empty line before port
    input = input.replace(/\r\n\s*[\r\n]+(\s*generic.*)/gi, "\r\n$1"); // delete empty line before generic
    input = input.replace(/\r\n\s*[\r\n]+(\s*end.*)/gi, "\r\n$1"); // delete empty line before end
    return input;
}



function allignOn(arr, object, endpat, toallign) {
    let start = 0;
    let end = 0;
    let max = 0;
    let pos = 0;
    let delta = 0;
    let starts = []
    let ends = []
    let maxs = []
    let toallignpat = new RegExp(`(?<=^\\s*[\\S]+[\\S\\s]+)${toallign}`)
    for (let k = 0; k < arr.length; k++) {
        if (arr[k].regexStartsWith(new RegExp(object))) {
            start = k;
        }
        if (start > 0) {
            pos = arr[k].search(toallignpat)
            if ((pos >= 0) && (pos > max)) {
                if (max > 0) {
                    delta = pos - max;
                }
                max = pos;
            }
        }
        if (arr[k].regexStartsWith(endpat) && (start > 0)) {
            end = k;
            starts.push(start)
            ends.push(end)
            maxs.push(max)
            start = 0
            end = 0
            max = 0
        }
    }
    let corr = " "
    for (let s = 0; s < starts.length; s++) {
        for (let k = starts[s]; k < ends[s] + 1; k++) {
            pos = arr[k].search(toallignpat)
            if ((pos >= 0) && (pos < maxs[s])) {

                arr[k] = arr[k].replace(toallignpat, corr.repeat(maxs[s] - pos) + toallign)
            }
        }
    }
}

function fix_architecture(arr) {
    let start = 0;
    let begins = 0
    for (let k = 0; k < arr.length; k++) {
        if ((arr[k].regexStartsWith(/\s*begin/gi)) && (begins == 0)) {
            start = 0
        }
        if (start > 0) {
            if (arr[k].regexStartsWith(/\s*(function|procedure|block|component|for|generate")+/gi)) {
                begins = begins + 1;
            }
            if (arr[k].regexStartsWith(/\s*end/gi)) {
                begins = begins - 1;
            }
            arr[k] = arr[k].replace(/^\s{3}/gi, "")
        }
        if (arr[k].regexStartsWith(/\s*architecture/gi)) {
            start = k;
        }
    }
}

function autoformatOff(arr) {
    let offset = 0
    let replace = 0
    for (let k = 0; k < arr.length; k++) {
        if (arr[k].regexStartsWith(new RegExp("^\\s*--autoformat_on"))) {
            replace = 0;
        }
        if (replace > 0) {
            if (k == replace + 1) {
                offset = arr[k].search(/\S/)
                arr[k] = arr[k].replace(/(\s*)(\S+)/, "$1--$2")
            }
            else {
                arr[k] = arr[k].replace(new RegExp("^(\\s{" + offset + "})"), "$1--")
            }
        }
        if (arr[k].regexStartsWith(new RegExp("^\\s*--autoformat_off"))) {
            replace = k;
        }
    }

}

function autoformatOn(text) {
    let replace = 0
    let offset = 0
    let arr = text.split('\n')
    for (let k = 0; k < arr.length; k++) {
        if (arr[k].regexStartsWith(new RegExp("^\\s*--autoformat_on"))) {
            replace = 0;
        }
        if (replace > 0) {
            if (k == replace + 1) {
                offset = arr[k].search(/\S/)
                arr[k] = arr[k].replace(/^(\s*)--/, "$1")
            }
            else {
                arr[k] = arr[k].replace(new RegExp("^(\\s{" + offset + "})--"), "$1")
            }
        }
        if (arr[k].regexStartsWith(new RegExp("^\\s*--autoformat_off"))) {
            replace = k;
        }
    }
    return arr.join('\n')
}

exports.BeautifierSettings = BeautifierSettings;
var KeyWords = ["ABS", "ACCESS", "AFTER", "ALIAS", "ALL", "AND", "ARCHITECTURE", "ARRAY", "ASSERT", "ATTRIBUTE", "BEGIN", "BLOCK", "BODY", "BUFFER", "BUS", "CASE", "COMPONENT", "CONFIGURATION", "CONSTANT", "CONTEXT", "COVER", "DISCONNECT", "DOWNTO", "DEFAULT", "ELSE", "ELSIF", "END", "ENTITY", "EXIT", "FAIRNESS", "FILE", "FOR", "FORCE", "FUNCTION", "GENERATE", "GENERIC", "GROUP", "GUARDED", "IF", "IMPURE", "IN", "INERTIAL", "INOUT", "IS", "LABEL", "LIBRARY", "LINKAGE", "LITERAL", "LOOP", "MAP", "MOD", "NAND", "NEW", "NEXT", "NOR", "NOT", "NULL", "OF", "ON", "OPEN", "OR", "OTHERS", "OUT", "PACKAGE", "PORT", "POSTPONED", "PROCEDURE", "PROCESS", "PROPERTY", "PROTECTED", "PURE", "RANGE", "RECORD", "REGISTER", "REJECT", "RELEASE", "REM", "REPORT", "RESTRICT", "RESTRICT_GUARANTEE", "RETURN", "ROL", "ROR", "SELECT", "SEQUENCE", "SEVERITY", "SHARED", "SIGNAL", "SLA", "SLL", "SRA", "SRL", "STRONG", "SUBTYPE", "THEN", "TO", "TRANSPORT", "TYPE", "UNAFFECTED", "UNITS", "UNTIL", "USE", "VARIABLE", "VMODE", "VPROP", "VUNIT", "WAIT", "WHEN", "WHILE", "WITH", "XNOR", "XOR"];
var TypeNames = ["BOOLEAN", "BIT", "CHARACTER", "INTEGER", "TIME", "NATURAL", "POSITIVE", "STD_LOGIC", "STD_LOGIC_VECTOR", "STD_ULOGIC", "STD_ULOGIC_VECTOR", "STRING"];
function beautify(input, settings) {
    input = input.replace(/\r\n/g, "\n");
    input = input.replace(/\n/g, "\r\n");
    var arr = input.split("\r\n");
    autoformatOff(arr)

    var comments = EscapeComments(arr);
    var backslashes = escapeText(arr, "\\\\[^\\\\]+\\\\", ILBackslash);
    var quotes = escapeText(arr, '"([^"]+)"', ILQuote);
    var singleQuotes = escapeText(arr, "'[^']'", ILSingleQuote);
    var others = escapeText(arr, "\(others\\s*=>\\s*.*?\)", ILOthers);
    RemoveLeadingWhitespaces(arr);
    input = arr.join("\r\n");
    if (settings.RemoveComments) {
        input = input.replace(/\r\n[ \t]*@@comments[0-9]+[ \t]*\r\n/g, '\r\n');
        input = input.replace(/@@comments[0-9]+/g, '');
        comments = [];
    }
    input = SetKeywordCase(input, "uppercase", KeyWords);
    input = SetKeywordCase(input, "uppercase", TypeNames);
    input = RemoveExtraNewLines(input);
    input = input.replace(/[\t ]+/g, ' ');
    input = input.replace(/\([\t ]+/g, '\(');
    input = input.replace(/[ ]+;/g, ';');
    input = input.replace(/:[ ]*(PROCESS|ENTITY)/gi, ':$1');
    arr = input.split("\r\n");
    if (settings.RemoveAsserts) {
        RemoveAsserts(arr); //RemoveAsserts must be after EscapeQuotes
    }
    ReserveSemicolonInKeywords(arr);
    input = arr.join("\r\n");
    input = input.replace(/\b(PORT|GENERIC)\b\s+MAP/g, '$1 MAP');
    input = input.replace(/\b(PORT|PROCESS|GENERIC)\b[\s\n]*\(/g, '$1 (');
    var newLineSettings = settings.NewLineSettings;
    if (newLineSettings != null) {
        input = SetNewLinesAfterSymbols(input, newLineSettings);
        arr = input.split("\r\n");
        ApplyNoNewLineAfter(arr, newLineSettings.noNewLineAfter);
        input = arr.join("\r\n");
    }
    input = input.replace(/([a-zA-Z0-9\); ])\);(@@comments[0-9]+)?@@end/g, '$1\r\n);$2@@end');
    input = input.replace(/[ ]?([&=:\-\+|\*]|[<>]+)[ ]?/g, ' $1 ');
    input = input.replace(/(\d+e) +([+\-]) +(\d+)/g, '$1$2$3'); // fix exponential notation format broken by previous step
    input = input.replace(/[ ]?([,])[ ]?/g, '$1 ');
    input = input.replace(/[ ]?(['"])(THEN)/g, '$1 $2');
    input = input.replace(/[ ]?(\?)?[ ]?(<|:|>|\/)?[ ]+(=)?[ ]?/g, ' $1$2$3 ');
    input = input.replace(/(IF)[ ]?([\(\)])/g, '$1 $2');
    input = input.replace(/([\(\)])[ ]?(THEN)/gi, '$1 $2');
    input = input.replace(/(^|[\(\)])[ ]?(AND|OR|XOR|XNOR)[ ]*([\(])/g, '$1 $2 $3');
    input = input.replace(/ ([\-\*\/=+<>])[ ]*([\-\*\/=+<>]) /g, " $1$2 ");
    //input = input.replace(/\r\n[ \t]+--\r\n/g, "\r\n");
    input = input.replace(/[ ]+/g, ' ');
    input = input.replace(/[ \t]+\r\n/g, "\r\n");
    input = input.replace(/\r\n\r\n\r\n/g, '\r\n\r\n'); // remove double empty lines
    //input = input.replace(/[\r\n\s]+$/g, '');
    input = input.replace(/[ \t]+\)/g, ')');
    input = input.replace(/\s*\)\s+RETURN\s+([\w]+;)/g, '\r\n) RETURN $1'); //function(..)\r\nreturn type; -> function(..\r\n)return type;
    input = input.replace(/\)\s*(@@\w+)\r\n\s*RETURN\s+([\w]+;)/g, ') $1\r\n' + ILIndentedReturnPrefix + 'RETURN $2'); //function(..)\r\nreturn type; -> function(..\r\n)return type;
    var keywordAndSignRegex = new RegExp("(\\b" + KeyWords.join("\\b|\\b") + "\\b) +([\\-+]) +(\\w)", "g");
    input = input.replace(keywordAndSignRegex, "$1 $2$3"); // `WHEN - 2` -> `WHEN -2`
    input = input.replace(/([,|]) +([+\-]) +(\w)/g, '$1 $2$3'); // `1, - 2)` -> `1, -2)`
    input = input.replace(/(\() +([+\-]) +(\w)/g, '$1$2$3'); // `( - 2)` -> `(-2)`

    input = input.replace(/(\s*type\s*.*?\s+is)(.*?)\r*\n*\s*record/gi, "$1 RECORD$2"); // type t_test is <<record on the next line>>

    input = input.replace(/(\s+port\s+map)\s*([^\(]*)\n\s*\(/gi, "$1 \($2"); // port with bracket on next line
    input = input.replace(/(\s+port)\s*([^\(]*)\r\n\s*\(/gi, "$1 \($2"); // port with bracket on next line

    input = input.replace(/(.*;)(.*;)/gi, "$1\r\n$2"); // one executable statement per line
    input = input.replace(/(\s*signal\s+\w+\s*),(\s*\w+\s*):(.*)/gi, "$1 : $3\r\nsignal $2 : $3"); // 2 signals defined on the same line
    input = input.replace(/(\s*variable\s+\w+\s*),(\s*\w+\s*):(.*)/gi, "$1 : $3\r\nvariable $2 : $3"); // 2 signals defined on the same line
    //input = input.replace(/(\s+G_\S+\s+:+\s*[0-9a-zA-Z()_ +-/*']+)\);([^\(]*)/gi, "$1\r\n);$2"); //generic with closing bracket on last line
    //input = input.replace(/(\s+G_\S+\s+=>+\s*[0-9a-zA-Z()_ +-/*']+)\)([^\(]*)/gi, "$1\r\n)$2"); //generic MAP with closing bracket on last line
    //input = input.replace(/(\s+\S+\s+=>+\s*[0-9a-zA-Z()_ +-/*']+)\);([^\(]*)/gi, "$1\r\n);$2"); //generic MAP with closing bracket on last line
    //input = input.replace(/(.*):\s*in (.*)\r\n/g, "$1: in  $2\r\n"); // : in std_logic => : in  std_logic;
    input = fix_closing_brackets(input);


    arr = input.split("\r\n");


    var result = [];
    beautify3(arr, result, settings, 0, 0);
    var alignSettings = settings.SignAlignSettings;
    if (alignSettings != null && alignSettings.isAll) {
        AlignSigns(result, 0, result.length - 1, alignSettings.mode);
    }
    arr = FormattedLineToString(result, settings.Indentation);

    fix_in_allignment(arr);

    allignOn(arr, "\\bENTITY", "\\bEND", ":");
    allignOn(arr, "\\bENTITY", "\\bEND", "@@")

    allignOn(arr, "\\bCOMPONENT", "\\bEND", ":");
    allignOn(arr, "\\bCOMPONENT", "\\bEND", "@@")

    allignOn(arr, "\\bGENERIC\\s*MAP", "\\s*\\)\s*;", "=>");
    allignOn(arr, "\\bGENERIC\\s*MAP", "\\s*\\)\s*;", "@@");
    allignOn(arr, "\\bPORT\\s*MAP", "\\s*\\)\s*;", "=>");
    allignOn(arr, "\\bPORT\\s*MAP", "\\s*\\)\s*;", "@@");

    //fix_architecture(arr)

    input = arr.join("\r\n");
    input = input.replace(/@@RETURN/g, "RETURN");
    input = SetKeywordCase(input, settings.KeywordCase, KeyWords);
    input = SetKeywordCase(input, settings.TypeNameCase, TypeNames);
    input = replaceEscapedWords(input, quotes, ILQuote);
    input = replaceEscapedWords(input, singleQuotes, ILSingleQuote);
    input = replaceEscapedComments(input, comments, ILCommentPrefix);
    input = replaceEscapedWords(input, backslashes, ILBackslash);
    input = replaceEscapedWords(input, others, ILOthers);
    input = input.replace(new RegExp(ILSemicolon, "g"), ";");

    input = input.replace(/@@[a-z]+/g, "");
    var escapedTexts = new RegExp("[" + ILBackslash + ILQuote + ILSingleQuote + "]", "g");
    input = input.replace(escapedTexts, "");
    input = fix_begin_end(input)
    input = input.replace(/\r\n/g, settings.EndOfLine);
    if (settings.AddNewLine && !input.endsWith(settings.EndOfLine)) {
        input += settings.EndOfLine;
    }
    input = autoformatOn(input);


    return input;
}
exports.beautify = beautify;
function replaceEscapedWords(input, arr, prefix) {
    for (var i = 0; i < arr.length; i++) {
        var text = arr[i];
        var regex = new RegExp("(" + prefix + "){" + text.length + "}");
        input = input.replace(regex, text);
    }
    return input;
}
function replaceEscapedComments(input, arr, prefix) {
    for (var i = 0; i < arr.length; i++) {
        input = input.replace(prefix + i, arr[i]);
    }
    return input;
}
function RemoveLeadingWhitespaces(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].replace(/^\s+/, "");
    }
}
var FormattedLine = /** @class */ (function () {
    function FormattedLine(line, indent) {
        this.Line = line;
        this.Indent = indent;
    }
    return FormattedLine;
}());
exports.FormattedLine = FormattedLine;
function FormattedLineToString(arr, indentation) {
    var result = [];
    if (arr == null) {
        return result;
    }
    if (indentation == null) {
        indentation = "";
    }
    arr.forEach(function (i) {
        if (i instanceof FormattedLine) {
            if (i.Line.length > 0) {
                result.push((Array(i.Indent + 1).join(indentation)) + i.Line);
            }
            else {
                result.push("");
            }
        }
        else {
            result = result.concat(FormattedLineToString(i, indentation));
        }
    });
    return result;
}
exports.FormattedLineToString = FormattedLineToString;
function GetCloseparentheseEndIndex(inputs, startIndex) {
    var openParentheseCount = 0;
    var closeParentheseCount = 0;
    for (var i = startIndex; i < inputs.length; i++) {
        var input = inputs[i];
        openParentheseCount += input.count("(");
        closeParentheseCount += input.count(")");
        if (openParentheseCount > 0
            && openParentheseCount <= closeParentheseCount) {
            return i;
        }
    }
    return startIndex;
}
function beautifyPortGenericBlock(inputs, result, settings, startIndex, parentEndIndex, indent, mode) {
    var firstLine = inputs[startIndex];
    var regex = new RegExp("[\\w\\s:]*(" + mode + ")([\\s]|$)");
    if (!firstLine.regexStartsWith(regex)) {
        return [startIndex, parentEndIndex];
    }
    var firstLineHasParenthese = firstLine.indexOf("(") >= 0;
    var hasParenthese = firstLineHasParenthese;
    var blockBodyStartIndex = startIndex;
    var secondLineHasParenthese = startIndex + 1 < inputs.length && inputs[startIndex + 1].startsWith("(");
    if (secondLineHasParenthese) {
        hasParenthese = true;
        blockBodyStartIndex++;
    }
    var endIndex = hasParenthese ? GetCloseparentheseEndIndex(inputs, startIndex) : startIndex;
    if (endIndex != startIndex && firstLineHasParenthese) {
        inputs[startIndex] = inputs[startIndex].replace(/\b(PORT|GENERIC|PROCEDURE)\b([\w ]+)\(([\w\(\) ]+)/, '$1$2(\r\n$3');
        var newInputs = inputs[startIndex].split("\r\n");
        if (newInputs.length == 2) {
            inputs[startIndex] = newInputs[0];
            inputs.splice(startIndex + 1, 0, newInputs[1]);
            endIndex++;
            parentEndIndex++;
        }
    }
    else if (endIndex > startIndex + 1 && secondLineHasParenthese) {
        inputs[startIndex + 1] = inputs[startIndex + 1].replace(/\(([\w\(\) ]+)/, '(\r\n$1');
        var newInputs = inputs[startIndex + 1].split("\r\n");
        if (newInputs.length == 2) {
            inputs[startIndex + 1] = newInputs[0];
            inputs.splice(startIndex + 2, 0, newInputs[1]);
            endIndex++;
            parentEndIndex++;
        }
    }
    if (firstLineHasParenthese && inputs[startIndex].indexOf("MAP") > 0) {
        inputs[startIndex] = inputs[startIndex].replace(/([^\w])(MAP)\s+\(/g, '$1$2(');
    }
    result.push(new FormattedLine(inputs[startIndex], indent));
    if (secondLineHasParenthese) {
        var secondLineIndent = indent;
        if (endIndex == startIndex + 1) {
            secondLineIndent++;
        }
        result.push(new FormattedLine(inputs[startIndex + 1], secondLineIndent));
    }
    var blockBodyEndIndex = endIndex;
    var i = beautify3(inputs, result, settings, blockBodyStartIndex + 1, indent + 1, endIndex);
    if (inputs[i].startsWith(")")) {
        result[i].Indent--;
        blockBodyEndIndex--;
    }
    var alignSettings = settings.SignAlignSettings;
    if (alignSettings != null) {
        if (alignSettings.isRegional && !alignSettings.isAll
            && alignSettings.keyWords != null
            && alignSettings.keyWords.indexOf(mode) >= 0) {
            blockBodyStartIndex++;
            AlignSigns(result, blockBodyStartIndex, blockBodyEndIndex, alignSettings.mode);
        }
    }
    return [i, parentEndIndex];
}
exports.beautifyPortGenericBlock = beautifyPortGenericBlock;
function AlignSigns(result, startIndex, endIndex, mode) {
    AlignSign_(result, startIndex, endIndex, ":", mode);
    AlignSign_(result, startIndex, endIndex, "[:<]{1}=", mode);
    AlignSign_(result, startIndex, endIndex, "<=", mode);
    AlignSign_(result, startIndex, endIndex, "=>", mode);
    AlignSign_(result, startIndex, endIndex, "@@comments", mode);
}
exports.AlignSigns = AlignSigns;
function AlignSign_(result, startIndex, endIndex, symbol, mode) {
    var maxSymbolIndex = -1;
    var symbolIndices = {};
    var startLine = startIndex;
    var labelAndKeywords = [
        "([\\w\\s]*:(\\s)*PROCESS)",
        "([\\w\\s]*:(\\s)*POSTPONED PROCESS)",
        "([\\w\\s]*:\\s*$)",
        "([\\w\\s]*:.*\\s+GENERATE)"
    ];
    var labelAndKeywordsStr = labelAndKeywords.join("|");
    var labelAndKeywordsRegex = new RegExp("(" + labelAndKeywordsStr + ")([^\\w]|$)");
    for (var i = startIndex; i <= endIndex; i++) {
        var line = result[i].Line;
        if (symbol == ":" && line.regexStartsWith(labelAndKeywordsRegex)) {
            continue;
        }
        //var regex = new RegExp("([\\s\\w\\\\]|^)" + symbol + "([\\s\\w\\\\]|$)");
        var regex = new RegExp("([\\s\\w\\\\]|^)" + symbol + "([\\s\\w\\\\]|$)");
        if (line.regexCount(regex) > 1) {
            continue;
        }
        var colonIndex = line.regexIndexOf(regex);
        if (colonIndex > 0) {
            maxSymbolIndex = Math.max(maxSymbolIndex, colonIndex);
            symbolIndices[i] = colonIndex;
        }
        else if ((mode != "local" && !line.startsWith(ILCommentPrefix) && line.length != 0)
            || (mode == "local")) {
            if (startLine < i - 1) // if cannot find the symbol, a block of symbols ends
            {
                AlignSign(result, startLine, i - 1, symbol, maxSymbolIndex, symbolIndices);
            }
            maxSymbolIndex = -1;
            symbolIndices = {};
            startLine = i;
        }
    }
    if (startLine < endIndex) // if cannot find the symbol, a block of symbols ends
    {
        AlignSign(result, startLine, endIndex, symbol, maxSymbolIndex, symbolIndices);
    }
}
function AlignSign(result, startIndex, endIndex, symbol, maxSymbolIndex, symbolIndices) {
    if (maxSymbolIndex === void 0) { maxSymbolIndex = -1; }
    if (symbolIndices === void 0) { symbolIndices = {}; }
    if (maxSymbolIndex < 0) {
        return;
    }
    for (var lineIndex in symbolIndices) {
        var symbolIndex = symbolIndices[lineIndex];
        if (symbolIndex == maxSymbolIndex) {
            continue;
        }
        var line = result[lineIndex].Line;
        result[lineIndex].Line = line.substring(0, symbolIndex)
            + (Array(maxSymbolIndex - symbolIndex + 1).join(" "))
            + line.substring(symbolIndex);
    }
}
exports.AlignSign = AlignSign;
function beautifyCaseBlock(inputs, result, settings, startIndex, indent) {
    if (!inputs[startIndex].regexStartsWith(/(.+:\s*)?(CASE)([\s]|$)/)) {
        return startIndex;
    }
    result.push(new FormattedLine(inputs[startIndex], indent));
    var i = beautify3(inputs, result, settings, startIndex + 1, indent + 2);
    result[i].Indent = indent;
    return i;
}
exports.beautifyCaseBlock = beautifyCaseBlock;
function getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex) {
    var endIndex = 0;
    var openBracketsCount = 0;
    var closeBracketsCount = 0;
    for (var i = startIndex; i < inputs.length; i++) {
        var input = inputs[i];
        var indexOfSemicolon = input.indexOf(";");
        var splitIndex = indexOfSemicolon < 0 ? input.length : indexOfSemicolon + 1;
        var stringBeforeSemicolon = input.substring(0, splitIndex);
        var stringAfterSemicolon = input.substring(splitIndex);
        stringAfterSemicolon = stringAfterSemicolon.replace(new RegExp(ILCommentPrefix + "[0-9]+"), "");
        openBracketsCount += stringBeforeSemicolon.count("(");
        closeBracketsCount += stringBeforeSemicolon.count(")");
        if (indexOfSemicolon < 0) {
            continue;
        }
        if (openBracketsCount == closeBracketsCount) {
            endIndex = i;
            if (stringAfterSemicolon.trim().length > 0 && settings.NewLineSettings.newLineAfter.indexOf(";") >= 0) {
                inputs[i] = stringBeforeSemicolon;
                inputs.splice(i, 0, stringAfterSemicolon);
                parentEndIndex++;
            }
            break;
        }
    }
    return [endIndex, parentEndIndex];
}
function beautifyComponentBlock(inputs, result, settings, startIndex, parentEndIndex, indent) {
    var endIndex = startIndex;
    for (var i = startIndex; i < inputs.length; i++) {
        if (inputs[i].regexStartsWith(/END(\s|$)/)) {
            endIndex = i;
            break;
        }
    }
    result.push(new FormattedLine(inputs[startIndex], indent));
    if (endIndex != startIndex) {
        var actualEndIndex = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex);
        var incremental = actualEndIndex - endIndex;
        endIndex += incremental;
        parentEndIndex += incremental;
    }
    return [endIndex, parentEndIndex];
}
exports.beautifyComponentBlock = beautifyComponentBlock;
function beautifySemicolonBlock(inputs, result, settings, startIndex, parentEndIndex, indent) {
    var _a;
    var endIndex = startIndex;
    _a = getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex), endIndex = _a[0], parentEndIndex = _a[1];
    result.push(new FormattedLine(inputs[startIndex], indent));
    if (endIndex != startIndex) {
        var i = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex);
    }
    return [endIndex, parentEndIndex];
}
exports.beautifySemicolonBlock = beautifySemicolonBlock;
function beautify3(inputs, result, settings, startIndex, indent, endIndex) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var i;
    var regexOneLineBlockKeyWords = new RegExp(/(PROCEDURE)[^\w](?!.+[^\w]IS([^\w]|$))/); //match PROCEDURE..; but not PROCEDURE .. IS;
    var regexFunctionMultiLineBlockKeyWords = new RegExp(/(FUNCTION|IMPURE FUNCTION)[^\w](?=.+[^\w]IS([^\w]|$))/); //match FUNCTION .. IS; but not FUNCTION
    var blockMidKeyWords = ["BEGIN"];
    var blockStartsKeyWords = [
        "IF",
        "CASE",
        "ARCHITECTURE",
        "PROCEDURE",
        "PACKAGE",
        "(([\\w\\s]*:)?(\\s)*PROCESS)",
        "(([\\w\\s]*:)?(\\s)*POSTPONED PROCESS)",
        "(.*\\s*PROTECTED)",
        "(COMPONENT)",
        "(ENTITY(?!.+;))",
        "FOR",
        "WHILE",
        "LOOP",
        "(.*\\s*GENERATE)",
        "(CONTEXT[\\w\\s\\\\]+IS)",
        "(CONFIGURATION(?!.+;))",
        "BLOCK",
        "UNITS",
        "\\w+\\s+\\w+\\s+IS\\s+RECORD"
    ];
    var blockEndsKeyWords = ["END", ".*\\)\\s*RETURN\\s+[\\w]+;"]
    var indentedEndsKeyWords = [ILIndentedReturnPrefix + "RETURN\\s+\\w+;"];
    var blockEndsWithSemicolon = [
        "(WITH\\s+[\\w\\s\\\\]+SELECT)",
        "([\\w\\\\]+[\\s]*<=)",
        "([\\w\\\\]+[\\s]*:=)",
        "FOR\\s+[\\w\\s,]+:\\s*\\w+\\s+USE",
        "REPORT"
    ];
    var newLineAfterKeyWordsStr = blockStartsKeyWords.join("|");
    var regexBlockMidKeyWords = blockMidKeyWords.convertToRegexBlockWords();
    var regexBlockStartsKeywords = new RegExp("([\\w]+\\s*:\\s*)?(" + newLineAfterKeyWordsStr + ")([^\\w]|$)");
    var regexBlockEndsKeyWords = blockEndsKeyWords.convertToRegexBlockWords();
    var regexBlockIndentedEndsKeyWords = indentedEndsKeyWords.convertToRegexBlockWords();
    var regexblockEndsWithSemicolon = blockEndsWithSemicolon.convertToRegexBlockWords();
    var regexMidKeyWhen = "WHEN".convertToRegexBlockWords();
    var regexMidKeyElse = "ELSE|ELSIF".convertToRegexBlockWords();
    if (endIndex == null) {
        endIndex = inputs.length - 1;
    }
    for (i = startIndex; i <= endIndex; i++) {
        if (indent < 0) {
            indent = 0;
        }
        var input = inputs[i].trim();
        if (input.regexStartsWith(regexBlockIndentedEndsKeyWords)) {
            result.push(new FormattedLine(input, indent));
            return i;
        }
        if (input.regexStartsWith(/COMPONENT\s/)) {
            var modeCache = Mode;
            Mode = FormatMode.EndsWithSemicolon;
            _a = beautifyComponentBlock(inputs, result, settings, i, endIndex, indent), i = _a[0], endIndex = _a[1];
            Mode = modeCache;
            continue;
        }
        if (input.regexStartsWith(/\w+\s*:\s*ENTITY/)) {
            var modeCache = Mode;
            Mode = FormatMode.EndsWithSemicolon;
            _b = beautifySemicolonBlock(inputs, result, settings, i, endIndex, indent), i = _b[0], endIndex = _b[1];
            Mode = modeCache;
            continue;
        }
        if (Mode != FormatMode.EndsWithSemicolon && input.regexStartsWith(regexblockEndsWithSemicolon)
            && !(input.regexStartsWith(/port|generic/i))
            && !(input.regexStartsWith(newLineAfterKeyWordsStr))
        ) {
            //if (Mode != FormatMode.EndsWithSemicolon && input.regexStartsWith(regexblockEndsWithSemicolon) ) {
            var modeCache = Mode;
            Mode = FormatMode.EndsWithSemicolon;
            _c = beautifySemicolonBlock(inputs, result, settings, i, endIndex, indent), i = _c[0], endIndex = _c[1];
            Mode = modeCache;
            continue;
        }
        if (input.regexStartsWith(/(.+:\s*)?(CASE)([\s]|$)/)) {
            var modeCache = Mode;
            Mode = FormatMode.CaseWhen;
            i = beautifyCaseBlock(inputs, result, settings, i, indent);
            Mode = modeCache;
            continue;
        }
        if (input.regexStartsWith(/.*?\:\=\s*\($/)) {
            _d = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, ":="), i = _d[0], endIndex = _d[1];
            continue;
        }
        if (input.regexStartsWith(/[\w\s:]*\bPORT\b([\s]|$)/)) {
            _e = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "PORT"), i = _e[0], endIndex = _e[1];
            continue;
        }
        if (input.regexStartsWith(/TYPE\s+\w+\s+IS\s+\(/)) {
            _f = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "IS"), i = _f[0], endIndex = _f[1];
            continue;
        }
        if (input.regexStartsWith(/[\w\s:]*GENERIC([\s]|$)/)) {
            _g = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "GENERIC"), i = _g[0], endIndex = _g[1];
            continue;
        }
        if (input.regexStartsWith(/[\w\s:]*PROCEDURE[\s\w]+\($/)) {
            _h = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "PROCEDURE"), i = _h[0], endIndex = _h[1];
            if (inputs[i].regexStartsWith(/.*\)[\s]*IS/)) {
                i = beautify3(inputs, result, settings, i + 1, indent + 1);
            }
            continue;
        }

        if (input.regexStartsWith(/FUNCTION[^\w]/)
            && input.regexIndexOf(/[^\w]RETURN[^\w]/) < 0) {
            _j = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "FUNCTION"), i = _j[0], endIndex = _j[1];
            if (!inputs[i].regexStartsWith(regexBlockEndsKeyWords)) {
                i = beautify3(inputs, result, settings, i + 1, indent + 1);
            }
            else {
                result[i].Indent++;
            }
            continue;
        }
        if (input.regexStartsWith(/IMPURE FUNCTION[^\w]/)
            && input.regexIndexOf(/[^\w]RETURN[^\w]/) < 0) {
            _k = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "IMPURE FUNCTION"), i = _k[0], endIndex = _k[1];
            if (!inputs[i].regexStartsWith(regexBlockEndsKeyWords)) {
                if (inputs[i].regexStartsWith(regexBlockIndentedEndsKeyWords)) {
                    result[i].Indent++;
                }
                else {
                    i = beautify3(inputs, result, settings, i + 1, indent + 1);
                }
            }
            else {
                result[i].Indent++;
            }
            continue;
        }
        result.push(new FormattedLine(input, indent));
        if (startIndex != 0
            && (input.regexStartsWith(regexBlockMidKeyWords)
                || (Mode != FormatMode.EndsWithSemicolon && input.regexStartsWith(regexMidKeyElse))
                || (Mode == FormatMode.CaseWhen && input.regexStartsWith(regexMidKeyWhen)))) {
            result[i].Indent--;
        }
        else if (startIndex != 0
            && (input.regexStartsWith(regexBlockEndsKeyWords))) {
            result[i].Indent--;
            return i;
        }
        if (input.regexStartsWith(regexOneLineBlockKeyWords)) {
            continue;
        }
        if (input.regexStartsWith(regexFunctionMultiLineBlockKeyWords)
            || input.regexStartsWith(regexBlockStartsKeywords)) {
            i = beautify3(inputs, result, settings, i + 1, indent + 1);
        }
    }
    i--;
    return i;
}
exports.beautify3 = beautify3;
function ReserveSemicolonInKeywords(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].match(/FUNCTION|PROCEDURE/) != null) {
            arr[i] = arr[i].replace(/;/g, ILSemicolon);
        }
    }
}
function ApplyNoNewLineAfter(arr, noNewLineAfter) {
    if (noNewLineAfter == null) {
        return;
    }
    var _loop_1 = function (i) {
        noNewLineAfter.forEach(function (n) {
            var regex = new RegExp("(" + n.toUpperCase + ")[ a-z0-9]+[a-z0-9]+");
            if (arr[i].regexIndexOf(regex) >= 0) {
                arr[i] += "@@singleline";
            }
        });
    };
    for (var i = 0; i < arr.length; i++) {
        _loop_1(i);
    }
}
exports.ApplyNoNewLineAfter = ApplyNoNewLineAfter;
function RemoveAsserts(arr) {
    var need_semi = false;
    var inAssert = false;
    var n = 0;
    for (var i = 0; i < arr.length; i++) {
        var has_semi = arr[i].indexOf(";") >= 0;
        if (need_semi) {
            arr[i] = '';
        }
        n = arr[i].indexOf("ASSERT ");
        if (n >= 0) {
            inAssert = true;
            arr[i] = '';
        }
        if (!has_semi) {
            if (inAssert) {
                need_semi = true;
            }
        }
        else {
            need_semi = false;
        }
    }
}
exports.RemoveAsserts = RemoveAsserts;
function escapeText(arr, regex, escapedChar) {
    var quotes = [];
    var regexEpr = new RegExp(regex, "g");
    for (var i = 0; i < arr.length; i++) {
        var matches = arr[i].match(regexEpr);
        if (matches != null) {
            for (var j = 0; j < matches.length; j++) {
                var match = matches[j];
                arr[i] = arr[i].replace(match, escapedChar.repeat(match.length));
                quotes.push(match);
            }
        }
    }
    return quotes;
}
function RemoveExtraNewLines(input) {
    //input = input.replace(/(?:\r\n|\r|\n)/g, '\r\n');
    input = input.replace(/ \r\n/g, '\r\n');
    //input = input.replace(/\r\n\r\n\r\n/g, '\r\n');
    return input;
}

function fix_begin_end(input) {
    input = input.replace(/   (-----+ *\r\n)   (-- begin --\r\n)   (-------*)/gi, "$1$2$3");
    input = input.replace(/   (-----+ *\r\n)   (-- end --\r\n)   (-------*)/gi, "$1$2$3");
    input = input.replace(/   (-----+ *\r\n)   (-- begin *\r\n)   (-------*)/gi, "$1$2$3");
    input = input.replace(/   (-----+ *\r\n)   (-- end *\r\n)   (-------*)/gi, "$1$2$3");
    return input
}
//# sourceMappingURL=VHDLFormatter.js.map