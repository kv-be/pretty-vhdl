"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAsserts = exports.ApplyNoNewLineAfter = exports.beautify3 = exports.beautifySemicolonBlock = exports.containsBeforeNextSemicolon = exports.countOpenBrackets = exports.beautifyEntity = exports.beautifyComponentBlock = exports.beautifyWhenBlock = exports.beautifyCaseBlock = exports.beautifyWithSelect = exports.beautifyMultilineDefault = exports.AlignSign = exports.AlignSigns = exports.beautifyPortGenericBlock = exports.FormattedLineToString = exports.FormattedLine = exports.beautify = exports.BeautifierSettings = exports.signAlignSettings = exports.SetNewLinesAfterSymbols = exports.NewLineSettings = void 0;
var isTesting = false;
var ILEscape = "@@";
var ILCommentPrefix = ILEscape + "comments";
var ILIndentedReturnPrefix = ILEscape;
var ILQuote = "⨵";
var ILSingleQuote = "⦼";
var ILBackslash = "⨸";
var ILForceSpace = "⨹";
var ILSemicolon = "⨴";
var FormatMode;
(function (FormatMode) {
   FormatMode[FormatMode["Default"] = 0] = "Default";
   FormatMode[FormatMode["EndsWithSemicolon"] = 1] = "EndsWithSemicolon";
   FormatMode[FormatMode["CaseWhen"] = 2] = "CaseWhen";
   FormatMode[FormatMode["IfElse"] = 3] = "IfElse";
   FormatMode[FormatMode["PortGeneric"] = 4] = "PortGeneric";
   FormatMode[FormatMode["functionOrProcedure"] = 5] = "functionOrProcedure";
   FormatMode[FormatMode["WithSelect"] = 6] = "WithSelect";
   FormatMode[FormatMode["MultilineAssignment"] = 7] = "MultilineAssignment";
   /*FormatMode[FormatMode["MultilineAssignment"] = 7] = "MultilineAssignment";
   FormatMode[FormatMode["MultilineAssignment"] = 7] = "MultilineAssignment";
   FormatMode[FormatMode["MultilineAssignment"] = 7] = "MultilineAssignment";*/
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
   function signAlignSettings(isRegional, isAll, mode, keyWords, entityInstanceAlignment) {
      this.isRegional = isRegional;
      this.isAll = isAll;
      this.mode = mode;
      this.keyWords = keyWords;
      this.entityInstanceAlignment = entityInstanceAlignment;
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
   //input = input.replace(/(\s*generic)\s*\(\s*(\w*)\s*:\s*(\w*)/gi, "$1 \(\r\n$2 : $3"); // generic with bracket on next line
   //input = input.replace(/(\s*generic\s+map)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line
   //input = input.replace(/(\s*generic)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line

   input = input.replace(/\);{1}([^;^\^\n)]*?\n+\s*(port|generic)\s*\()/gi, "\r\n);$1") // generic with closing bracket on the same line as last assingment
   input = input.replace(/\){1}([^,^\^\n)]*?\n+\s*(port|generic)\s+map\s*\()/gi, "\r\n)$1") // generic with closing bracket on the same line as last assingment
   input = input.replace(/(?!.*<>\))(\r*\n\s*(port|generic)\s+map[\s\S\n]+?)\);(.*)/gi, "$1\r\n);$3"); // closing port map bracket not on seperate line
   input = input.replace(/(?!.*<>\))(\r*\n\s*(port|generic)\s+map[\s\S\n]+?)\);(.*)/gi, "$1\r\n);$3"); // closing port map bracket not on seperate line
   //deze lijn geeft een heel raar probleem met een generic package=> zie tmp.vhd of in image_format_pkg.vhd van 874
   //de lijn hieronder zet het sluitend haakje van de port declaratie van een ENTITY op een nieuwe lijn
   input = input.replace(/((entity|component)\s*[A-Za-z0-9_]+\s*is\s*(port|generic)\s*\([\s\S\n]+?)[\)]?;([^\)]+?(\bend|\breport|\bassert)\s+)/gi, "$1\r\n);$4"); // force closing port bracket on next line

   input = input.replace(/(package\s*[A-Za-z0-9_]+\s*is\s*generic\s*\([\s\S\n]+?)\);([^\)]+?(\bend|\bfunction|\btype|\bsubtype|\bsignal|\bshared|\bconstant|\bprocedure)\s+)/gi, "$1\r\n);$2"); // force closing port bracket on next line
   input = input.replace(/\r\n\s*[\r\n]+(\s*\);.*)/gi, "\r\n$1"); // delete empty line before ); 
   input = input.replace(/\r\n\s*[\r\n]+(\s*\).*)/gi, "\r\n$1"); // delete empyt line before )
   input = input.replace(/\r\n\s*[\r\n]+(\s*(port|generic).*)/gi, "\r\n$1"); // delete empty line before port
   //input = input.replace(/\r\n\s*[\r\n]+(\s*generic.*)/gi, "\r\n$1"); // delete empty line before generic
   //input = input.replace(/\r\n\s*[\r\n]+(\s*end.*)/gi, "\r\n$1"); // delete empty line before end
   return input;
}



function allignOn(arr, object, endpat, toallign, startingWith, endingWith) {
   let start = -1;
   let end = -1;
   let max = 0;
   let pos = 0;
   let delta = 0;
   let starts = []
   let ends = []
   let maxs = []
   if (typeof startingWith == 'undefined') {
      startingWith = ""
   }
   let toallignpat = new RegExp(`(?<=^ *${startingWith}\\s*[\\S]+[\\S\\s]+)${toallign}`)
   if (endingWith) {
      toallignpat = new RegExp(`(?<=^ *${startingWith}\\s*[\\S]+[\\S\\s]+)${toallign}.*${endingWith}`)
   }
   for (let k = 0; k < arr.length; k++) {
      if (arr[k].regexStartsWith(new RegExp(object))) {
         start = k;
      }
      if (start > -1) {
         pos = arr[k].search(toallignpat)
         if ((pos >= 0) && (pos > max)) {
            if (max > 0) {
               delta = pos - max;
            }
            max = pos;
         }
      }
      if (arr[k].regexStartsWith(endpat) && (start > -1)) {
         end = k;
         starts.push(start)
         ends.push(end)
         maxs.push(max)
         start = -1
         end = -1
         max = 0
      }
   }
   let corr = " "
   for (let s = 0; s < starts.length; s++) {
      for (let k = starts[s]; k < ends[s] + 1; k++) {
         pos = arr[k].search(toallignpat)
         if ((pos >= 0) && (pos < maxs[s])) {
            var m = arr[k].match(toallignpat)
            arr[k] = arr[k].slice(0, pos) + corr.repeat(maxs[s] - pos) + arr[k].slice(pos).trim()
            // the line below prevented that regular expression could be used for the alignment pattern
            //arr[k] = replace(toallignpat, corr.repeat(maxs[s] - pos) + toallign)
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

function PatchMagicalComments(input, commentKind) {

   var endRegEx = new RegExp("([ \\t]*[--]+\\r*\\n[ \\t]*[--]+[ \\t]*" + commentKind + "[ \\t]*.*\\r*\\n[ \\t]*[--]+)")
   var endIndex = input.search(endRegEx)
   if (endIndex > 0) {
      var theEnd = input.match(endRegEx)[0]
      var endLength = theEnd.length
      input = input.replace(endRegEx, "@@" + commentKind)
   }
   return [input, theEnd]
}

function entityInstanceAlignmentSetting(input, settings) {
   var noOld = 0
   var noNew = 0
   var m
   var index = 0
   do {
      m = /(?<firstspace>[ ]*).*:.*\r*\n(?<Secspace>[ ]*)(port|generic)[ ]*map[ ]*\(/gi.exec(input.slice(index))
      if (m) {
         if (m.groups.firstspace.length === m.groups.Secspace.length) {
            noNew++;
         } else {
            noOld++;
         }
         index += (m.index + m[0].length)
      }
   } while (m)
   if (settings.SignAlignSettings.entityInstanceAlignment === "Compatible") {
      settings.oldInstanceAlignment = false
      if (noOld > noNew) {
         settings.oldInstanceAlignment = true
      }
   }
   if (settings.SignAlignSettings.entityInstanceAlignment === "Not indented") {
      settings.oldInstanceAlignment = false
   }
   if (settings.SignAlignSettings.entityInstanceAlignment === "Indented") {
      settings.oldInstanceAlignment = true
   }

}

exports.BeautifierSettings = BeautifierSettings;
var KeyWords = ["ABS", "ACCESS", "AFTER", "ALIAS", "ALL", "AND", "ARCHITECTURE", "ARRAY", "ASSERT", "ATTRIBUTE", "BEGIN", "BLOCK", "BODY", "BUFFER", "BUS", "CASE", "COMPONENT", "CONFIGURATION", "CONSTANT", "CONTEXT", "COVER", "DISCONNECT", "DOWNTO", "DEFAULT", "ELSE", "ELSIF", "END", "ENTITY", "EXIT", "FAIRNESS", "FILE", "FOR", "FORCE", "FUNCTION", "GENERATE", "GENERIC", "GROUP", "GUARDED", "IF", "IMPURE", "IN", "INERTIAL", "INOUT", "IS", "LABEL", "LIBRARY", "LINKAGE", "LITERAL", "LOOP", "MAP", "MOD", "NAND", "NEW", "NEXT", "NOR", "NOT", "NULL", "OF", "ON", "OPEN", "OR", "OTHERS", "OUT", "PACKAGE", "PORT", "POSTPONED", "PROCEDURE", "PROCESS", "PROPERTY", "PROTECTED", "PURE", "RANGE", "RECORD", "REGISTER", "REJECT", "RELEASE", "REM", "REPORT", "RESTRICT", "RESTRICT_GUARANTEE", "RETURN", "ROL", "ROR", "SELECT", "SEQUENCE", "SEVERITY", "SHARED", "SIGNAL", "SLA", "SLL", "SRA", "SRL", "STRONG", "SUBTYPE", "THEN", "TO", "TRANSPORT", "TYPE", "UNAFFECTED", "UNITS", "UNTIL", "USE", "VARIABLE", "VMODE", "VPROP", "VUNIT", "WAIT", "WHEN", "WHILE", "WITH", "XNOR", "XOR"];
var TypeNames = ["BOOLEAN", "BIT", "CHARACTER", "INTEGER", "TIME", "NATURAL", "POSITIVE", "STD_LOGIC", "STD_LOGIC_VECTOR", "STD_ULOGIC", "STD_ULOGIC_VECTOR", "STRING"];
function beautify(input, settings) {
   var [input, theEnd] = PatchMagicalComments(input, "END")
   var [input, theBegin] = PatchMagicalComments(input, "BEGIN")

   input = input.replace(/\r\n/g, "\n");
   input = input.replace(/\n/g, "\r\n");
   entityInstanceAlignmentSetting(input, settings)
   var arr = input.split("\r\n");
   autoformatOff(arr)

   var comments = EscapeComments(arr);
   var backslashes = escapeText(arr, "\\\\[^\\\\]+\\\\", ILBackslash);
   var quotes = escapeText(arr, '"([^"]+)"', ILQuote);
   var singleQuotes = escapeText(arr, "'[^']'", ILSingleQuote);
   //var others = escapeText(arr, "\(others\\s*=>\\s*.*?\)", ILForceSpace);
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
   //input = input.replace(/[ ]?([&=:\-\+|\*><]{1}[ ]?/g, ' $1 ');
   input = input.replace(/(?<=[a-z0-9A-Z])[ ]?([&=:\-\+*></]{1})[ ]?(?=[a-z0-9A-Z])/g, ' $1 '); // space after operator + - / * & = > <
   input = input.replace(/(?<=[a-z0-9A-Z])[ ]?((=>|<=|!=|:=|\*\*){1})[ ]?(?=[a-z0-9A-Z])/g, ' $1 '); // space after operator + - / * & = > <
   input = input.replace(/(\d+e) +([+\-]) +(\d+)/g, '$1$2$3'); // fix exponential notation format broken by previous step
   input = input.replace(/[ ]?([,])[ ]?/g, '$1 '); //space after a comma
   input = input.replace(/[ ]?(['"])(THEN)/g, '$1 $2');
   //input = input.replace(/[ ]?(\?)?[ ]?(<|:|>|\/)?[ ]+(=)?[ ]?/g, ' $1$2$3 ');
   input = input.replace(/(IF)[ ]?([\(\)])/g, '$1 $2');
   input = input.replace(/([\(\)])[ ]?(THEN)/gi, '$1 $2');
   input = input.replace(/(^|[\(\)])[ ]?(AND|OR|XOR|XNOR)[ ]*([\(])/g, '$1 $2 $3');
   //input = input.replace(/(?<=[a-z0-9A-Z])[ ]?(=>|<=|:=)[ ]?(?=[a-z0-9A-Z])/g, " $1 ");
   //input = input.replace(/ ([\-\*\/=+<>])[ ]*([\-\*\/=+<>]) /g, " $1$2 ");
   //input = input.replace(/\r\n[ \t]+--\r\n/g, "\r\n");
   input = input.replace(/[ ]+/g, ' ');
   input = input.replace(/[ \t]+\r\n/g, "\r\n");
   //input = input.replace(/[\r\n\s]+$/g, '');
   input = input.replace(/[ \t]+\)/g, ')');
   input = input.replace(/(\s*FUNCTION\s+[\w]+) *\r*\n\s*(RETURN\s+.*;.*)/g, '$1 $2') //function declaration without arguments with return on the next line => stupid so put return behind the function
   input = input.replace(/\s*\)\s+RETURN\s+([\w]+;)/g, '\r\n) RETURN $1'); //function(..)\r\nreturn type; -> function(..\r\n)return type;
   input = input.replace(/\)\s*(@@\w+)\r\n\s*RETURN\s+([\w]+;)/g, ') $1\r\n' + ILIndentedReturnPrefix + 'RETURN $2'); //function(..)\r\nreturn type; -> function(..\r\n)return type;
   var keywordAndSignRegex = new RegExp("(\\b" + KeyWords.join("\\b|\\b") + "\\b) +([\\-+]) +(\\w)", "g");
   input = input.replace(keywordAndSignRegex, "$1 $2$3"); // `WHEN - 2` -> `WHEN -2`
   input = input.replace(/([,|]) +([+\-]) +(\w)/g, '$1 $2$3'); // `1, - 2)` -> `1, -2)`
   input = input.replace(/(\() +([+\-]) +(\w)/g, '$1$2$3'); // `( - 2)` -> `(-2)`

   input = input.replace(/(\s*type\s*.*?\s+is)(.*?)\r*\n*\s*\brecord\b/gi, "$1 RECORD$2"); // type t_test is <<record on the next line>>

   input = input.replace(/(\s+port\s+map)\s*([^\(]*)\n\s*\(/gi, "$1 \($2"); // port with bracket on next line
   input = input.replace(/(\s+port)\s*([^\(]*)\r\n\s*\(/gi, "$1 \($2"); // port with bracket on next line
   input = input.replace(/WHEN *(\S+) *=> *([^;]+@@.*$)/gi, "WHEN $1 =>\r\n$2") // when followed by something and ending in a comment
   input = input.replace(/WHEN *(\S+) *=> *((?!.*@@)[^;]+$)/gi, "WHEN $1 =>\r\n$2") // when followed by not a comment

   // line starting with procedure and not containing IS
   input = input.replace(/(?!(\bis\b|;))(\s*PROCEDURE[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$2\r\n$3\r\n") //force multiline procedures to put arguments on the next line
   // line not containing keywords and ending in ) is
   input = input.replace(/\r*\n\s*(?!\b(function|procedure|subtype|type|alias|component|architecture|case|entity)\s)(.*?)\)\s*(\bis\b.*)\r*\n/gi, "$2\r\n\) $3\r\n") //force the closing ") is" on a new line
   //    ^ (? !\b(function| procedure)) (.*\s *\bis\b)
   // line starting with procedure and not containing IS
   input = input.replace(/\r*\n\s*(?!(\bis\b|;))(\s*PROCEDURE[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$2\r\n$3\r\n") //force multiline procedures to put arguments on the next line
   // line not containing keywords and ending in ) is
   input = input.replace(/\r*\n\s*(?!\b(function|procedure|subtype|type|alias|component|architecture|case|entity))(.*?)\)\s*(\bis\b.*)\r*\n/gi, "$2\r\n\) $3\r\n") //force the closing ") is" on a new line
   //    ^ (? !\b(function| procedure)) (.*\s *\bis\b)

   input = input.replace(/(.*;)(.*;)/gi, "$1\r\n$2"); // one executable statement per line
   input = input.replace(/\s*(signal\s+\w+)\s*,\s*(\w+)\s*:\s*(.*)/gi, "\r\n$1 : $3\r\nsignal $2 : $3"); // 2 signals defined on the same line
   input = input.replace(/\s*(variable\s+\w+)\s*,\s*(\w+)\s*:\s*(.*)/gi, "\r\n$1 : $3\r\nvariable $2 : $3"); // 2 signals defined on the same line
   input = input.replace(/(with\s+\S+\s+\bselect\b)([\s\S\n\r]+?)/gi, "$1\r\n$2");
   input = input.replace(/\r\n\r\n\r\n/g, '\r\n\r\n'); // remove double empty lines
   input = fix_closing_brackets(input);


   arr = input.split("\r\n");


   var result = [];
   beautify3(arr, result, settings, 0, 0);
   var alignSettings = settings.SignAlignSettings;
   if (alignSettings != null && alignSettings.isAll) {
      AlignSigns(result, 0, result.length - 1, alignSettings.mode, settings.Indentation);
   }
   arr = FormattedLineToString(result, settings.Indentation);

   fix_in_allignment(arr);

   allignOn(arr, "\\bENTITY", "[ ]*\\bEND\\b", ":");
   allignOn(arr, "\\bENTITY", "[ ]*\\bEND\\b", "@@")

   allignOn(arr, "\\s*COMPONENT", "[ ]*\\bEND\b", ":");
   allignOn(arr, "\\s*COMPONENT", "[ ]*\\bEND\b", "@@")

   allignOn(arr, "\\s*GENERIC\\s*MAP", "\\s*\\)\s*;", "=>");
   allignOn(arr, "\\s*GENERIC\\s*MAP", "\\s*\\)\s*;", "@@");
   allignOn(arr, "\\s*PORT\\s*MAP", "\\s*\\)\s*;", "=>");
   allignOn(arr, "\\s*PORT\\s*MAP", "\\s*\\)\s*;", "@@");
   // support alignment for case with commands after when
   allignOn(arr, "\\s*CASE\\s*", "[ ]*\\bEND", "=>", "when\s+.+", ";.*");
   allignOn(arr, "\\s*CASE\\s*", "[ ]*\\bEND", "(:|<)=", "when\s+.", ";.*");
   allignOn(arr, "\\bCASE", "[ ]*\\bEND", "@@")

   //fix_architecture(arr)

   input = arr.join("\r\n");
   input = input.replace(/@@RETURN/g, "RETURN");
   input = SetKeywordCase(input, settings.KeywordCase, KeyWords);
   input = SetKeywordCase(input, settings.TypeNameCase, TypeNames);
   input = replaceEscapedWords(input, quotes, ILQuote);
   input = replaceEscapedWords(input, singleQuotes, ILSingleQuote);
   input = replaceEscapedComments(input, comments, ILCommentPrefix);
   input = replaceEscapedWords(input, backslashes, ILBackslash);
   //input = replaceEscapedWords(input, others, ILForceSpace);
   input = input.replace(new RegExp(ILSemicolon, "g"), ";");
   input = input.replace(/ *@@END/, theEnd)
   input = input.replace(/ *@@BEGIN/, theBegin)

   input = input.replace(/@@[a-z]+/g, "");
   var escapedTexts = new RegExp("[" + ILBackslash + ILQuote + ILSingleQuote + "]", "g");
   //input = input.replace(escapedTexts, "");
   //if (!alignSettings.beginEndWithoutSpace) {
   //    input = fix_begin_end(input)
   //} 
   // fix multilines : [a-zA-Z_0-9\(\)+*-/ ]+<= *[\s\S\r*\n]+?; selects multiline assignments

   // input = fixMultilineFunctions(input);
   input = input.replace(/\r\n/g, settings.EndOfLine);

   input = input.replace(new RegExp(ILForceSpace, "g"), " ")
   if (settings.AddNewLine && !input.endsWith(settings.EndOfLine)) {
      input += settings.EndOfLine;
   }
   input = autoformatOn(input);

   return input;
}
exports.beautify = beautify;

function fixMultilineFunctions(input) {
   let index = 0
   let new_text
   while (index < input.length) {
      let result = input.substring(index, input.length).match(/[a-zA-Z_0-9\(\)+*-/ ]+<= *[a-zA-Z_0-9\(\),+*-/ ]+\r*\n[\s\S]+?;/);
      if (result != null) {
         new_text = input.substring(index + result.index, index + result.index + result[0].length)
         let spaceresult = new_text.match(/.*<= *[\S]+?\(/)
         if (spaceresult != null) {
            let arr = new_text.split(/\r*\n/)
            for (var i = 1; i < arr.length; i++) {
               arr[i] = " ".repeat(spaceresult[0].length) + arr[i].trim(" ")
            }
            new_text = arr.join("\r\n")
         }
         input = input.substring(0, index + result.index) + new_text + input.substring(index + result.index + result[0].length, input.length)
         index = index + result.index + new_text.length
      } else {
         index = input.length
      }
   }
   return input
}

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
      arr[i] = arr[i].replace(/^[ \t]*/, "");
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
   if (startIndex < endIndex && inputs[endIndex].trim().indexOf(");") > 0) {
      inputs[endIndex] = inputs[endIndex].replace(/(.*)(\);.*)/, '$1\r\n$2');
      var newInputs = inputs[endIndex].split("\r\n");
      if (newInputs.length == 2) {
         inputs[endIndex] = newInputs[0];
         inputs.splice(endIndex + 1, 0, newInputs[1]);
         endIndex++;
         parentEndIndex++;
      }

   }
   if (startIndex < endIndex && inputs[endIndex].trim().indexOf(");") > 0) {
      inputs[endIndex] = inputs[endIndex].replace(/(.*)(\);.*)/, '$1\r\n$2');
      var newInputs = inputs[endIndex].split("\r\n");
      if (newInputs.length == 2) {
         inputs[endIndex] = newInputs[0];
         inputs.splice(endIndex + 1, 0, newInputs[1]);
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
   if (startIndex === endIndex) {
      return [endIndex, parentEndIndex, parentEndIndex];
   }

   var blockBodyEndIndex = endIndex;
   var i
   var _i = beautify3(inputs, result, settings, blockBodyStartIndex + 1, indent + 1, endIndex), i = _i[0], endIndex = _i[1], inputs = _i[2];
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
function AlignSigns(result, startIndex, endIndex, mode, indentation) {
   // except IS added to prevent var declarations in functions or procedures align to arguments defs
   // except ) at the beginning of the line is to break allignment for signals with multiline defaults
   // except procedure or function at the beginning of the line is to prevent that arguments of procs or functions are aliggned with signals above
   AlignSign_(result, startIndex, endIndex, ":", mode, "(\\bIS\\b|^\\s*\\)|(^\\s*PROCEDURE)|(^\\s*FUNCTION))", indentation);
   AlignSign_(result, startIndex, endIndex, "(:|<)=", mode, "(^\(?!.*;\).*\\bwhen\\b.*|^\\s*\\))", indentation);
   AlignSign_(result, startIndex, endIndex, "=>", mode, "\r\r", indentation);
   //AlignSign_(result, startIndex, endIndex, "<=", mode);
   //AlignSign_(result, startIndex, endIndex, "<=", mode);
   AlignSign_(result, startIndex, endIndex, "@@comments", mode, "\\bWHEN\\b", indentation);
}
exports.AlignSigns = AlignSigns;
function AlignSign_(result, startIndex, endIndex, symbol, mode, exclude, indentation) {
   var maxSymbolIndex = -1;
   var symbolIndices = {};
   var startLine = startIndex;
   var labelAndKeywords = [
      "([\\w\\s]*:(\\s)*PROCESS)",
      "([\\w\\s]*:(\\s)*POSTPONED PROCESS)",
      "([\\w\\s]*:\\s*$)",
      "([\\w\\s]*:.*\\s+GENERATE)",
      "(PROCEDURE|FUNCTION)\\s+[\\w]+\\s*\\(.*"   // to filter out one line procedure/functions declarations containing default values
   ];
   var labelAndKeywordsStr = labelAndKeywords.join("|");
   var labelAndKeywordsRegex = new RegExp("(" + labelAndKeywordsStr + ")([^\\w]|$)");
   var colonIndex = 0
   var maxIndent = 0
   var forcedBlockEnd = false
   if (typeof exclude === 'undefined') {
      exclude = /\r\r/
   }
   for (var i = startIndex; i <= endIndex; i++) {
      var line = result[i].Line;

      if (((symbol == ":") || (symbol == "(:|<)=")) && line.regexStartsWith(labelAndKeywordsRegex)) {
         forcedBlockEnd = true;
      }
      // why is this????
      var regex = new RegExp("(?<=([\\s\\S\\\\]|^))" + symbol + "(?=[^=]+|$)");
      /*if (line.regexCount(regex) > 1) {
          continue;
      }*/
      var colonIndex = line.regexIndexOf(regex);
      if (colonIndex > 0 && (line.search(exclude) < 0) && !forcedBlockEnd) {
         //the WHEN lines in a case do
         maxSymbolIndex = Math.max(maxSymbolIndex, colonIndex);
         maxIndent = Math.max(maxIndent, result[i].Indent);
         symbolIndices[i] = colonIndex;
         if ((symbol === "(:|<)=") && (result[i].Line.indexOf(";") < 0)) { // if a multiline assignment using when else OR last argument of function or procedure call!
            //if a multiline assignment, additional spaces are padded with ILForceSpace
            //so if we detect on ILForceSpace, we know if multiline or not
            var text = ""
            var l = i
            do {
               l++
               text = text + " " + result[l].Line
            } while ((result[l].Line.indexOf(";") === -1) && (l < result.length)) //search for the next ;
            if (text.indexOf(ILForceSpace) >= 0) {// ILForceSpace found => indeed multiline assignment...

               /*var text = ""
               var l = i
               do {
                  l++
                  text = text + " " + result[l].Line
               } while ((result[l].Line.indexOf(";") === -1) && (l < result.length)) //search for the next ;
               if (text.indexOf("IS") < 0) {// no IS defined => indeed multiline assignment...
                  var m = line.match(/([ ]+) :/) //detect leading spaces
                  var spaces = 0
                  if (m) {
                     spaces = m[1].length
                  }*/
               //if assignment found not ending in ; => multiline, so search for ending ;
               //and add the same space padding in front to let the second lines allign
               do {
                  i++
                  if ((i <= endIndex) && (result[i].Line.indexOf(ILForceSpace) === 0)) {
                     //by setting the symbolIndex to -colonIndex tells to the AlignSign to just add spaces
                     symbolIndices[i] = colonIndex * -1;
                  } else {
                     break;
                  }
               } while (result[i].Line.indexOf(ILForceSpace) === 0) // must be === 0 since case statements have also forced spaces but not at the start of a line
               i-- //we detect that a line doesn't contain a forced space anymore, so we need to decrement i to let this line parse again in the main lop
            }
         }
      }
      else if ((mode != "local" && !line.startsWith(ILCommentPrefix) && line.length != 0)
         || (mode == "local")) {
         if (startLine < i - 1) // if cannot find the symbol, a block of symbols ends
         {
            AlignSign(result, startLine, i - 1, symbol, maxSymbolIndex, symbolIndices, maxIndent, indentation.length);
         }
         maxSymbolIndex = -1;
         symbolIndices = {};
         startLine = i;
         maxIndent = -1
         forcedBlockEnd = false
      }
   }
   if (startLine < endIndex) // if cannot find the symbol, a block of symbols ends
   {
      AlignSign(result, startLine, endIndex, symbol, maxSymbolIndex, symbolIndices, maxIndent, indentation.length);
   }
}


function AlignSign(result, startIndex, endIndex, symbol, maxSymbolIndex, symbolIndices, maxIndent, indentation) {
   if (maxSymbolIndex === void 0) { maxSymbolIndex = -1; }
   if (symbolIndices === void 0) { symbolIndices = {}; }
   if (maxSymbolIndex < 0) {
      return;
   }
   for (var lineIndex in symbolIndices) {
      var symbolIndex = symbolIndices[lineIndex];

      var line = result[lineIndex].Line;
      var noSpaces = maxSymbolIndex - symbolIndex + 1
      if (symbolIndex < 0) {
         // if symbolIndex < 0, it means the line only needs spaces in front
         noSpaces = maxSymbolIndex + symbolIndex + 1
      }
      if (symbol === "@@comments") {
         // only for comments, take the indent into account to allign the comments correctly
         noSpaces = Math.max(noSpaces + (maxIndent - result[lineIndex].Indent) * indentation, 0)

      }

      result[lineIndex].Line = line.substring(0, symbolIndex)
         + (Array(noSpaces).join(" "))
         + line.substring(symbolIndex);
   }
}
exports.AlignSign = AlignSign;
function beautifyCaseBlock(inputs, result, settings, startIndex, indent, indentation) {
   var endCase = -1
   if (!inputs[startIndex].regexStartsWith(/(.+:\s*)?(CASE)([\s]|$)/)) {
      return startIndex;
   }
   result.push(new FormattedLine(inputs[startIndex], indent));
   var _i = beautify3(inputs, result, settings, startIndex + 1, indent + 2), i = _i[0], endIndex = _i[1], inputs = _i[2];
   result[i].Indent = indent;
   for (var i = startIndex; i < inputs.length; i++) {
      if (inputs[i].search(/end\s+case/i) > -1) {
         endCase = i
         break
      }
   }
   if (endCase > -1) {
      AlignSign_(result, startIndex, endCase, "=>", "global", "\\r\\\r", indentation);
   }

   return [i, inputs];
}
exports.beautifyCaseBlock = beautifyCaseBlock;

function getMatchingClosingBrackets(inputs, startIndex) {
   var bracketlevel = 0
   for (var i = startIndex; i < inputs.length; i++) {
      bracketlevel = bracketlevel + countOpenBrackets(inputs[i])
      if (bracketlevel <= 0) { // smaller or equal since if a line starts with a closing bracket, we are doomed
         return i
      }
   }
   return -1
}

function beautifyMultilineDefault(inputs, result, settings, startIndex, indent) {
   var start = startIndex
   var endIndex = getSemicolonBlockEndIndex(inputs, settings, startIndex, inputs.length - 1)
   endIndex = endIndex[0]
   if (inputs[endIndex].indexOf(";") < 0) {
      endIndex = endIndex + 1
   }

   var assignmentSpace = -1;
   for (var i = start; i <= endIndex; i++) {
      if (assignmentSpace < 0) {
         //search for the first assignment operator
         assignmentSpace = inputs[i].trim().indexOf("<=")
         if (assignmentSpace > 0) {
            assignmentSpace = assignmentSpace + 3
            result.push(new FormattedLine(inputs[i], indent));
         } else {
            assignmentSpace = inputs[i].trim().indexOf(":=")
            if (assignmentSpace > 0) {
               assignmentSpace = assignmentSpace + 3
               result.push(new FormattedLine(inputs[i], indent));
            }
            else {
               result.push(new FormattedLine(inputs[i], indent));
            }
         }
      } else {
         // assignment found, stuff following lines with spaces
         inputs[i] = ILForceSpace.repeat(assignmentSpace) + inputs[i]
         result.push(new FormattedLine(inputs[i], indent));
      }
   }
   i--
   return [i, inputs];
}

exports.beautifyMultilineDefault = beautifyMultilineDefault;
/*

// this code supports multiple function calls in signal assignments, but removes the nice allignment of e.g. arrays

function beautifyMultilineDefault(inputs, result, settings, startIndex, indent) {
   var start = startIndex
   var endIndex = getNextSymbolIndex(inputs, startIndex, ";")
   if (endIndex >= 0) {
      if (inputs[endIndex].indexOf(";") < 0) {
         endIndex = endIndex + 1
      }
   } else {
      endIndex = getMatchingClosingBrackets(inputs, startIndex)
      if (endIndex === -1) {
         endIndex = startIndex
      }
   }
   var assignmentSpace = -1;
   if ((countOpenBrackets(inputs[startIndex]) > 0) || (getNextSymbolIndex([inputs[startIndex]], startIndex, ":=") > -1)) { // opening brackets
      //missing closing bracket => so keep the current line, add indent for all following ones
      var i = startIndex
      result.push(new FormattedLine(inputs[i], indent));
      do {
         i = beautifyMultilineDefault(inputs, result, settings, i + 1, indent + 1)
      } while (i < endIndex)
      return i;
   } else {
      if ((countOpenBrackets(inputs[startIndex]) < 0) || (getNextSymbolIndex([inputs[startIndex]], startIndex, ";") > -1)) { // closing brackets
         var i = startIndex
         result.push(new FormattedLine(inputs[i], indent - 1));
         do {
            i = beautifyMultilineDefault(inputs, result, settings, i + 1, indent - 1)
         } while (i < endIndex)
         return i
      } else {
         if (assignmentSpace < 0) {  // when no assignments found, copy the lines
            for (var i = start; i <= endIndex; i++) {
               result.push(new FormattedLine(inputs[i], indent));
            }
            i--
            return i;
         } else {
            i--
            return i;
         }

      }
   }
}
exports.beautifyMultilineDefault = beautifyMultilineDefault;
*/

function beautifyWithSelect(inputs, result, settings, startIndex, indent) {
   var start = startIndex
   if (inputs[startIndex].regexStartsWith(/(WITH\s+[\w\s\\]+SELECT)/i)) {
      result.push(new FormattedLine(inputs[startIndex], indent));
      start++ // in case of with select, only start searching for the <= in the next line
      // in case of <= when .. else, we start looking from the first line.
   }
   var endIndex = getSemicolonBlockEndIndex(inputs, settings, startIndex, inputs.length - 1)
   if (inputs[endIndex[0]].indexOf(";") < 0) {
      endIndex = endIndex[0] + 1 // include the line containing ;
   } else {
      endIndex = endIndex[0]
   }
   var assignmentSpace = -1;
   var whenList = []
   var whenMax = -1
   for (var i = start; i <= endIndex; i++) {
      if (assignmentSpace < 0) {
         //search for the first assignment operator
         assignmentSpace = inputs[i].trim().indexOf("<=")
         if (assignmentSpace > 0) {
            assignmentSpace = assignmentSpace + 3
         } else {
            assignmentSpace = inputs[i].trim().indexOf(":=")
            if (assignmentSpace > 0) {
               assignmentSpace = assignmentSpace + 3
            }
         }
      } else {
         // assignment found, stuff following lines with spaces
         inputs[i] = ILForceSpace.repeat(assignmentSpace) + inputs[i]
      }
      whenList[i] = inputs[i].trim().indexOf("WHEN")
      whenMax = Math.max(whenMax, whenList[i])
   }
   for (var i = start; i <= endIndex; i++) {
      if (whenList[i] >= 0) {
         inputs[i] = inputs[i].slice(0, whenList[i]) + ILForceSpace.repeat(whenMax - whenList[i]) + inputs[i].slice(whenList[i])
      }
      if (start == startIndex) {
         // in case of <= when ... else
         result.push(new FormattedLine(inputs[i], indent));
      }
   }
   if (start != startIndex) {
      // in case of with .. select
      var _i = beautify3(inputs, result, settings, start, indent + 1, endIndex), i = _i[0], endIndex = _i[1], inputs = _i[2];
      result[i].Indent = indent;
   } else {
      i--
   }
   return [i, inputs];
}
exports.beautifyWithSelect = beautifyWithSelect;

function beautifyWhenBlock(inputs, result, settings, startIndex, indent) {
   var _a = getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex), endIndex = _a[0], parentEndIndex = _a[1];
   if (inputs[endIndex].indexOf(";") < 0) {
      endIndex = endIndex + 1 // we want the ; to be included
   }
   result.push(new FormattedLine(inputs[startIndex], indent));

   var stuf = inputs[startIndex].match(/.*<= */)
   if (stuf) {
      for (i = startIndex + 1; i <= endIndex; i++) {
         inputs[i] = ILForceSpace.repeat(stuf[0].length) + inputs[i]
      }
   }

   if (endIndex != startIndex) {
      var i
      var _i = beautify3(inputs, result, settings, startIndex + 1, indent, endIndex), i = _i[0], endIndex = _i[1], inputs = _i[2];
   }
   return [endIndex, inputs];
}
exports.beautifyWhenBlock = beautifyWhenBlock;



function getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex) {
   var endIndex = -1;
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
         continue; // loop until ; found
      }
      if (openBracketsCount == closeBracketsCount) {
         endIndex = i;
         if (inputs[i].match(/^[ \t]*\);.*/)) {
            // in case the line with the semicolon only contains );, it is not included in the result
            // this makes that the ); get one indent less than the rest 
            endIndex = i - 1;
         }
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
      var _c = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex), actualEndIndex = _c[0], endIndex = _c[1], inputs = _c[2];
      var incremental = actualEndIndex - endIndex;
      endIndex += incremental;
      parentEndIndex += incremental;
   }
   return [endIndex, parentEndIndex];
}
function beautifyEntity(inputs, result, settings, startIndex, parentEndIndex, indent) {
   var _a;
   var endIndex = startIndex;
   var orgEndIndex = endIndex
   _a = getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex), endIndex = _a[0], parentEndIndex = _a[1];
   if (inputs[endIndex].indexOf(";") < 0) {
      endIndex = endIndex + 1 // we want the ; to be included
   }
   orgEndIndex = endIndex
   result.push(new FormattedLine(inputs[startIndex], indent));
   if (endIndex != startIndex) {

      var _i = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex), _a = _i[0], endIndex = _i[1], inputs = _i[2];
   }
   return [endIndex, parentEndIndex + endIndex - orgEndIndex];
}
exports.beautifyEntity = beautifyEntity;




exports.beautifyComponentBlock = beautifyComponentBlock;
function beautifySemicolonBlock(inputs, result, settings, startIndex, parentEndIndex, indent) {
   var _a;
   var endIndex = startIndex;
   var functionStart = -1;
   // the following gets the start line of a semicolon block and the length of it (endIndex)
   _a = getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex), endIndex = _a[0], parentEndIndex = _a[1];
   if (endIndex === -1) {
      endIndex = startIndex;
   }
   var st = -1;
   var orgEndIndex = endIndex;
   var stuf = ""
   if (startIndex < endIndex) {
      // if a multiline detected
      if (((inputs[startIndex].indexOf("<=") > 0) | (inputs[startIndex].indexOf(":=") > 0))) {
         // in case of a function call, the bracket after the function name is needed.
         inputs[startIndex] = inputs[startIndex].trim()
         var r = new RegExp(/[\s\S]+?\s*(<|:)=\s*[a-zA-Z0-9_.]+\s*\( *[a-zA-Z0-9_.]+ *(,|downto|to)*/)
         var m = inputs[startIndex].match(r)
         if (m && m.length) {
            // in case of a function call with argument on the first line
            // we move the argument to the next line
            let st = m[0].length - 1
            let mm = inputs[startIndex].match(/^[\s\S]+?\s*(<|:)=\s*[a-zA-Z0-9_.]+\s*\( */)
            let procCalIndex = 0
            if (mm) {
               procCalIndex = mm[0].length
            }
            let procCal = inputs[startIndex].substr(0, procCalIndex)
            let arg = inputs[startIndex].substr(procCalIndex, inputs[startIndex].length - procCalIndex)
            inputs[startIndex] = procCal
            inputs = inputs.slice(0, startIndex + 1).concat(arg).concat(inputs.slice(startIndex + 1))
            endIndex = endIndex + 1;
         }
         r = new RegExp(/[\s\S]+?\s*(<|:)=\s*/)
         st = inputs[startIndex].match(r)[0].length
         if (st > 0) {
            // only for function calls, we need to stuff additional spaces
            stuf = ILForceSpace.repeat(st)
         }
      } else {
         // first check the position of the first argument (on the same line as the proc call or not)
         if (inputs[startIndex].regexStartsWith(/^[a-zA-Z0-9_.]+[\s]*\( *[a-zA-Z0-9_.]+ *=*>* *[0-9A-Za-z_.]*,/)) {
            // in case of a procedure call with argument on the first line, we take the first bracket to align on
            let m = inputs[startIndex].match(/^[a-zA-Z0-9_.]+[\s]*\(/)
            let procCalIndex = 0
            if (m) {
               procCalIndex = m[0].length
            }
            let procCal = inputs[startIndex].substr(0, procCalIndex)
            let arg = inputs[startIndex].substr(procCalIndex, inputs[startIndex].length - procCalIndex)
            inputs[startIndex] = procCal
            inputs = inputs.slice(0, startIndex + 1).concat(arg).concat(inputs.slice(startIndex + 1))
            endIndex = endIndex + 1;
         } else {
            // in case of a proc call without argument on the first line => do nothing
            // arguments will be indented automatically by one indent, which is OK
            st = 0
         }
      }
      // now check if the closing brackets are on a separate line
      if ((inputs[endIndex].match(/\S*\);.*/))) {
         // closing brackets are on the same line as the last argument => add a line
         //inputs[endIndex+1] = ILForceSpace.repeat(functionStart) + inputs[i].trim()
         let m = inputs[endIndex].match(/.*\);/)
         let procCalIndex = 0
         if (m) {
            //-2 to subtract the );
            procCalIndex = m[0].length - 2

         }
         let procCal = inputs[endIndex].substr(0, procCalIndex)
         let arg = inputs[endIndex].substr(procCalIndex, inputs[endIndex].length - procCalIndex)
         inputs[endIndex] = procCal
         inputs = inputs.slice(0, endIndex + 1).concat(arg).concat(inputs.slice(endIndex + 1))
         endIndex = endIndex + 1;
      } else {
         // include ); in the range
         endIndex = endIndex + 1;
         orgEndIndex = orgEndIndex + 1;
      }

      if (stuf.length > 0) {
         //endIndex = endIndex+ 1 ;
         for (var i = startIndex + 1; i <= endIndex - 1; i++) {
            inputs[i] = stuf + inputs[i].trim()
         }
         inputs[endIndex] = stuf.substr(0, stuf.length - 3) + inputs[endIndex].trim()
      }
   }

   result.push(new FormattedLine(inputs[startIndex], indent));
   if (endIndex != startIndex) {
      if (stuf.length > 0) {
         // case for functions and assignments
         var _a = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex), i = _a[0], endIndex = _a[1], inputs = _a[2];
      } else {
         var _a = beautify3(inputs, result, settings, startIndex + 1, indent + 1, endIndex), i = _a[0], endIndex = _a[1], inputs = _a[2];
         // set the line below in comments to prevent duplication of the last line of a procedure call without arguments on the first line
         //result.push(new FormattedLine(inputs[endIndex], indent));
         result[i].Indent--;
      }
   }
   return [endIndex, parentEndIndex + (endIndex - orgEndIndex), inputs];
}
exports.beautifySemicolonBlock = beautifySemicolonBlock;

function countOpenBrackets(input) {
   var brackets = 0
   for (var j = 0; j < input.length; j++) {
      if (input[j] === "(") {
         brackets = brackets + 1
      }
      if (input[j] === ")") {
         brackets = brackets - 1
      }
   }
   return brackets
}
exports.countOpenBrackets = countOpenBrackets;

function containsBeforeNextSemicolon(inputs, startindex, symbol) {
   var j = startindex
   var text = ""
   do {
      j++
      text = text + " " + inputs[j]
   } while ((text.indexOf(";") < 0) && (j < inputs.length));

   if (text.match(symbol)) { // if the text doesn't contain IS, the line is a multiline declaration. In the other case, it is the last line of a function or procedure declaration.
      return true
   } else {
      return false
   }
}
exports.containsBeforeNextSemicolon = containsBeforeNextSemicolon;

function getNextSymbolIndex(inputs, startindex, symbol) {
   var j = startindex
   for (j = startindex; j < inputs.length; j++) {
      if (inputs[j].indexOf(symbol) >= 0) {
         return j
      }
   }
   return -1
}
exports.getNextSymbolIndex = getNextSymbolIndex;

function errorCheck(inputs, result, i, a) {
   if (i < a) {
      console.log(`around line ${i} "${inputs[i]}" looping back`)
   }
   if (result.length != i + 1) {
      console.log(`around line ${i} "${inputs[i]}" possible loss of lines`)
   }
}

function beautify3(inputs, result, settings, startIndex, indent, endIndex) {
   //var oldInstanceAlignment = false
   var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
   var i;
   var regexOneLineBlockKeyWords = new RegExp(/(PROCEDURE)[^\w](?!.+[^\w]IS([^\w]|$))/); //match PROCEDURE..; but not PROCEDURE .. IS;
   var regexFunctionMultiLineBlockKeyWords = new RegExp(/(FUNCTION|IMPURE FUNCTION)[^\w](?=.+[^\w]IS([^\w]|$))/); //match FUNCTION .. IS; but not FUNCTION
   var blockMidKeyWords = ["BEGIN"];
   var blockStartsKeyWords = [
      "IF",
      "CASE",
      "ARCHITECTURE",
      "PROCEDURE",
      "PACKAGE\\s+[\\w]+\\s+IS\\s*$", // changed to prevent that package is new work.tdi_pkg generic map(<>) is not triggered
      "PACKAGE\\s+BODY\\s+[\\w]+\\s+IS\\s*$", // changed to prevent that package is new work.tdi_pkg generic map(<>) is not triggered
      "(([\\w\\s]*:)?(\\s)*PROCESS)",
      "(([\\w\\s]*:)?(\\s)*POSTPONED PROCESS)",
      "(.*\\s*PROTECTED)",
      "(COMPONENT)",
      "FOR",
      "WHILE",
      "LOOP",
      "(.*\\s*GENERATE)",
      "(CONTEXT[\\w\\s\\\\]+IS)",
      "(CONFIGURATION(?!.+;))",
      "BLOCK",
      "UNITS",
      "\\w+\\s+\\w+\\s+IS\\s+\\bRECORD\\b"
   ];

   //var blockEndsKeyWords = ["END", ".*\\)\\s*RETURN\\s+[\\w]+;", "[\\s]*\\)+[\\s]*;"]
   var blockEndsKeyWords = ["END", ".*\\)\\s*RETURN\\s+[\\w]+;"]
   var indentedEndsKeyWords = [ILIndentedReturnPrefix + "RETURN\\s+\\w+;"];
   var blockEndsWithSemicolon = [
      //"(WITH\\s+[\\w\\s\\\\]+SELECT)",
      "FOR\\s+[\\w\\s,]+:\\s*\\w+\\s+USE",
      "ASSERT"
   ];
   var multilineAssignment = [
      "([\\w\\\\]+[\\s]*<=)",
      "([\\w\\\\]+[\\s]*:=)"
   ]
   var functionOrProcedure = [
      "([a-zA-Z0-9_.]+[\\s]*\\(.*)",
      "(([\\s\\S]+?[\\s]*(<|:)=)[\\s]*[a-zA-Z0-9_.]+[\\s]*\\(.*)"
   ];
   var regexBlockEndsKeyWords = blockEndsKeyWords.convertToRegexBlockWords();
   var regexBlockIndentedEndsKeyWords = indentedEndsKeyWords.convertToRegexBlockWords();
   var regexblockEndsWithSemicolon = blockEndsWithSemicolon.convertToRegexBlockWords();
   var regexmultilineAssignment = multilineAssignment.convertToRegexBlockWords();
   var regexfunctionOrProcedure = functionOrProcedure[0] + "|" + functionOrProcedure[1]
   regexfunctionOrProcedure = regexfunctionOrProcedure.convertToRegexBlockWords();
   var regexMidKeyWhen = "WHEN".convertToRegexBlockWords();
   var regexMidKeyElse = "ELSE|ELSIF".convertToRegexBlockWords();
   var regexKeyword = new RegExp("(\\b" + KeyWords.join("\\b|\\b") + "\\b)")

   if (settings.oldInstanceAlignment) {
      blockStartsKeyWords.push("(ENTITY(?!.+;))") // old way of aligning entities

   } else {
      blockStartsKeyWords.push("(^[]*ENTITY(?!.+;))")   // when normal instance alignment
   }

   var newLineAfterKeyWordsStr = blockStartsKeyWords.join("|");
   var regexBlockMidKeyWords = blockMidKeyWords.convertToRegexBlockWords();
   var regexBlockStartsKeywords = new RegExp("([\\w]+\\s*:\\s*)?(" + newLineAfterKeyWordsStr + ")([^\\w]|$)");



   if (endIndex == null) {
      endIndex = inputs.length - 1;
   }
   var a = 0
   var foutje_gevonden = -1
   for (i = startIndex; i <= endIndex; i++) {
      a = i
      if (indent < 0) {
         indent = 0;
      }
      if (i > inputs.length - 1) {
         break;
      }
      var input = inputs[i].trim();
      if (input.regexStartsWith(regexBlockIndentedEndsKeyWords)) {
         result.push(new FormattedLine(input, indent));
         return [i, endIndex, inputs];
      }
      if (input.regexStartsWith(/COMPONENT\s/)) {
         var modeCache = Mode;
         Mode = FormatMode.EndsWithSemicolon;
         _a = beautifyComponentBlock(inputs, result, settings, i, endIndex, indent), i = _a[0], endIndex = _a[1];
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
      }
      if (input.regexStartsWith(/\w+\s*:\s*(ENTITY)*/) && inputs[i + 1].regexStartsWith(/[ ]*(PORT|GENERIC)+[ ]+MAP/) && settings.oldInstanceAlignment) {
         //entity instantiation : remove this line when instances need to start at indent +0
         var modeCache = Mode;
         Mode = FormatMode.EndsWithSemicolon;
         _b = beautifyEntity(inputs, result, settings, i, endIndex, indent), i = _b[0], endIndex = _b[1];
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
      }
      if (input.regexStartsWith(/(.+:\s*)?(CASE)([\s]|$)/)) {
         var modeCache = Mode;
         Mode = FormatMode.CaseWhen;
         var __i = beautifyCaseBlock(inputs, result, settings, i, indent, settings.Indentation), i = __i[0], inputs = __i[1]
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
      }
      if (input.regexStartsWith(/(WITH\s+[\w\s\\]+SELECT)/) || input.regexStartsWith(/.*(<|:)=.*\bWHEN\b.*\bELSE\b/)) {
         var modeCache = Mode;
         Mode = FormatMode.WithSelect;
         var __i = beautifyWithSelect(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1]
         Mode = modeCache;
         continue;
      }
      if (input.regexStartsWith(/\s*(\bSIGNAL\b|\bCONSTANT\b|\bVARIABLE\b|\bALIAS\b).*:[^;]+$/)) {
         // signal or constant assignment on multiple lines IF not part of an argument list of a function or procedure!!!
         if (!containsBeforeNextSemicolon(inputs, i, /\bIS\b/)) { // if the text doesn't contain IS, the line is a multiline declaration. In the other case, it is the last line of a function or procedure declaration.
            var modeCache = Mode;
            Mode = FormatMode.MultilineAssignment;
            var __i = beautifyMultilineDefault(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1]
            errorCheck(inputs, result, i, a)
            Mode = modeCache;
            continue;
         }


      }
      /*if (input.regexStartsWith(/.*\bWHEN\b.*\bELSE\b/)) {
          var modeCache = Mode;
          _m = beautifyWhenBlock(inputs, result, settings, i, indent), i = _m[0], inputs = _m[1]
          Mode = modeCache;
          continue;
      }
*/
      if (input.regexStartsWith(/.*?\:\=\s*\($/)) {
         _d = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, ":="), i = _d[0], endIndex = _d[1];
         errorCheck(inputs, result, i, a)
         continue;
      }
      if (input.regexStartsWith(/[\w\s:]*\bPORT\b([\s]|$)/)) {
         _e = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "PORT"), i = _e[0], endIndex = _e[1];
         errorCheck(inputs, result, i, a)
         continue;
      }
      if (input.regexStartsWith(/TYPE\s+\w+\s+IS\s+\(/)) {
         _f = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "IS"), i = _f[0], endIndex = _f[1];
         errorCheck(inputs, result, i, a)
         continue;
      }
      if (input.regexStartsWith(/[\w\s:]*GENERIC([\s]|$)/)) {
         let pack = -1
         if (i > 0) {
            pack = inputs[i - 1].indexOf("IS NEW")
         }
         _g = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "GENERIC"), i = _g[0], endIndex = _g[1];
         if (pack > -1) {
            indent--;
         }
         errorCheck(inputs, result, i, a)
         continue;
      }
      if (input.regexStartsWith(/^(?!.*\bis$)PROCEDURE[\s\w]+\(.*/)) {
         _h = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "PROCEDURE"), i = _h[0], endIndex = _h[1];
         if (inputs[i].regexStartsWith(/.*\)[\s]*IS/)) {
            _o = beautify3(inputs, result, settings, i + 1, indent + 1), i = _o[0], endIndex = _o[1], inputs = _o[2];
         }
         errorCheck(inputs, result, i, a)
         continue;
      }

      if (input.regexStartsWith(/FUNCTION[^\w]/)
         && input.regexIndexOf(/[^\w]RETURN[^\w]/) < 0) {
         _j = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "FUNCTION"), i = _j[0], endIndex = _j[1];
         if (!inputs[i].regexStartsWith(regexBlockEndsKeyWords)) {
            _p = beautify3(inputs, result, settings, i + 1, indent + 1), i = _p[0], endIndex = _p[1], inputs = _p[2];
         }
         else {
            result[i].Indent++;
         }
         errorCheck(inputs, result, i, a)
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
               _q = beautify3(inputs, result, settings, i + 1, indent + 1), i = _q[0], endIndex = _q[1], inputs = _q[2];
            }
         }
         else {
            result[i].Indent++;
         }
         errorCheck(inputs, result, i, a)
         continue;
      }

      if (Mode != FormatMode.functionOrProcedure && input.regexStartsWith(regexfunctionOrProcedure)
         && !(input.regexStartsWith(regexKeyword))
         && (input.indexOf("WHEN") === -1)
         && (input.indexOf("ELSE") === -1)
         && !(input.regexStartsWith(newLineAfterKeyWordsStr))
      ) {
         //multiline function or procedure or assignment or slice of a port assignment  f(0) => '0' 
         var modeCache = Mode;
         var brackets = countOpenBrackets(input)
         if (brackets > 0) {
            Mode = FormatMode.functionOrProcedure;
            _l = beautifySemicolonBlock(inputs, result, settings, i, endIndex, indent), i = _l[0], endIndex = _l[1], inputs = _l[2];
            Mode = modeCache;
            errorCheck(inputs, result, i, a)
            continue;
         }
      }

      if (Mode != FormatMode.blockEndsWithSemicolon && input.regexStartsWith(regexblockEndsWithSemicolon)
         && !(input.regexStartsWith(/port|generic/i))
         && !(input.regexStartsWith(newLineAfterKeyWordsStr))
      ) {
         // for ... loop and assert
         var modeCache = Mode;
         Mode = FormatMode.EndsWithSemicolon;
         _c = beautifyEntity(inputs, result, settings, i, endIndex, indent), i = _c[0], endIndex = _c[1];
         Mode = modeCache;
         errorCheck(inputs, result, i, a)
         continue;
      }

      if (Mode != FormatMode.blockEndsWithSemicolon && input.regexStartsWith(regexmultilineAssignment)
         && !(input.regexStartsWith(/port|generic/i))
         && !(input.regexStartsWith(newLineAfterKeyWordsStr))
      ) {
         // assignment of a signal on multiple lines
         if (!containsBeforeNextSemicolon(inputs, i, /\bIS\b/)) { // if the text doesn't contain IS, the line is a multiline declaration. In the other case, it is the last line of a function or procedure declaration.
            var modeCache = Mode;
            Mode = FormatMode.MultilineAssignment;
            var __i = beautifyMultilineDefault(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1];
            errorCheck(inputs, result, i, a)
            Mode = modeCache;
            continue;
         }
      }


      result.push(new FormattedLine(input, indent));
      if (startIndex != 0
         && (input.regexStartsWith(regexBlockMidKeyWords)
            || (Mode != FormatMode.EndsWithSemicolon && input.regexStartsWith(regexMidKeyElse))
            || (Mode == FormatMode.CaseWhen && input.regexStartsWith(regexMidKeyWhen)))) {
         result[i].Indent--;
         errorCheck(inputs, result, i, a)
         continue
         //indent--;// done to correct indent after a end generate statement. If not done, the indent doesn't decrease
      }
      else if (startIndex != 0
         && (input.regexStartsWith(regexBlockEndsKeyWords))) {
         result[i].Indent--;
         return [i, endIndex, inputs];
      }

      if (input.regexStartsWith(regexOneLineBlockKeyWords)) {
         continue;
      }
      if (input.regexStartsWith(regexFunctionMultiLineBlockKeyWords)
         || (input.regexStartsWith(regexBlockStartsKeywords)) && input.indexOf(";") < 0) {
         _r = beautify3(inputs, result, settings, i + 1, result[i].Indent + 1), i = _r[0], endIndex = _r[1], inputs = _r[2];
         errorCheck(inputs, result, i, a)
      }
      if (foutje_gevonden == 1) {
         var pecht = 1
      }
   }
   i--;
   if (i > inputs.length - 1) {
      var zever = 1;
   }
   return [i, endIndex, inputs];
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
   input = input.replace(/ *\r\n *\r\n[\r\n]+/g, '\r\n\r\n');
   //input = input.replace(/\r\n\r\n\r\n/g, '\r\n');
   return input;
}
