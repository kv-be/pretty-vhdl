"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveAsserts = exports.ApplyNoNewLineAfter = exports.beautify3 = exports.beautifySemicolonBlock = exports.containsBeforeNextSemicolon = exports.countOpenBrackets = exports.beautifyEntity = exports.beautifyComponentBlock = exports.beautifyWhenBlock = exports.beautifyCaseBlock = exports.beautifyWithSelect = exports.beautifyMultilineIf = exports.beautifySignalAssignment2 = exports.beautifyBrackets = exports.beautifyMultilineDefault = exports.AlignSign = exports.AlignSigns = exports.beautifyPortGenericBlock = exports.FormattedLineToString = exports.FormattedLine = exports.beautify = exports.BeautifierSettings = exports.signAlignSettings = exports.SetNewLinesAfterSymbols = exports.NewLineSettings = void 0;
var isTesting = false;
var ILEscape = "@@";
var ILCommentPrefix = ILEscape + "comments";
var ILIndentedReturnPrefix = ILEscape;
var ILQuote = "⨵";
var ILSingleQuote = "⦼";
var ILBackslash = "⨸";
var ILForceSpace = "⨹";
var ILSemicolon = "⨴";
var ILNoAlignmentCorrection = "ª"
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
   FormatMode[FormatMode["functionOrProcedureDeclare"] = 8] = "functionOrProcedureDeclare";

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
      if (arr[k].Line.regexStartsWith(new RegExp("(.*?)\\s*:\\s*IN \\S+(.*)"))) {
         arr[k].Line = arr[k].Line.replace(new RegExp("(.*?\\s*:\\s*IN) (\\S+.*)"), "$1  $2"); // : in std_logic => : in  std_logic;
      }
      if (arr[k].Line.regexStartsWith(new RegExp("(.*?)\\s*:\\s*OUT \\S+(.*)"))) {
         arr[k].Line = arr[k].Line.replace(new RegExp("(.*?\\s*:\\s*OUT) (\\S+.*)@@comment(.*)"), "$1 $2 @@comment$3"); // : in std_logic => : in  std_logic;
      }
   }
   return arr;
}

function fix_closing_brackets(input) {
   //input = input.replace(/(\s*generic map)\s*\(\s*(\w*)\s*=>\s*(\w*)/gi, "$1\(\r\n$2 : $3"); // generic with bracket on next line
   //input = input.replace(/(\s*generic)\s*\(\s*(\w*)\s*:\s*(\w*)/gi, "$1 \(\r\n$2 : $3"); // generic with bracket on next line
   //input = input.replace(/(\s*generic\s+map)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line
   //input = input.replace(/(\s*generic)\s*\((.+)/gi, "$1\(\r\n$2"); // generic with bracket and assignment on the same line
   input = input.replace(/(.*\bENTITY\b.*)\((.*)\)/g, "$1[$2]")// trick to get entities with architecture between brackets aligned correctly. The next lines screw things up if not done.
   input = input.replace(/^(?!.*ENTITY.*)\);{1}([^;^\^\n)]*?\n+\s*(port|generic)\s*\()/gi, "\r\n);$1") // generic with closing bracket on the same line as last assingment
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
   input = input.replace(/(.*\bENTITY\b.*)\[(.*)\]/g, "$1($2)")// trick to get entities with architecture between brackets aligned correctly. The next lines screw things up if not done.
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
   input = input.replace(/:[ ]*(\bPROCESS\b|\bENTITY\b)/gi, ':$1');
   arr = input.split("\r\n");
   if (settings.RemoveAsserts) {
      RemoveAsserts(arr); //RemoveAsserts must be after EscapeQuotes
   }
   ReserveSemicolonInKeywords(arr);
   input = arr.join("\r\n");
   input = input.replace(/\b(PORT|GENERIC)\b\s+MAP/g, '$1 MAP');
   input = input.replace(/\b(PORT|PROCESS|GENERIC)\b[\s\n]*\(/g, '$1 (');
   input = input.replace(new RegExp(`\\b(REPORT)\\b[\\s\\n]*${ILQuote}`, "gi"), `$1 ${ILQuote}`); // make sure there is a space between report and the quote
   var newLineSettings = settings.NewLineSettings;
   if (newLineSettings != null) {
      input = SetNewLinesAfterSymbols(input, newLineSettings);
      arr = input.split("\r\n");
      ApplyNoNewLineAfter(arr, newLineSettings.noNewLineAfter);
      input = arr.join("\r\n");
   }
   input = input.replace(/(.*)IS\(/g, "$1 IS (") // make sure there is a space between is and ()
   input = input.replace(/([a-zA-Z0-9\); ])\);(@@comments[0-9]+)?@@end/g, '$1\r\n);$2@@end');
   input = input.replace(/(\S+)<=(\S+)/g, '$1 <= $2')
   input = input.replace(/(\S+):=(\S+)/g, '$1 := $2')
   input = input.replace(/(\S+)=>(\S+)/g, '$1 => $2')
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

   //input = input.replace(/\s*\)\s+RETURN\s+([\w]+;)/g, '\r\n) RETURN $1'); //function(..)\r\nreturn type; -> function(..\r\n)return type;
   //input = input.replace(/\)\s*(@@\w+)\r\n\s*RETURN\s+([\w]+;)/g, ') $1\r\n' + ILIndentedReturnPrefix + 'RETURN $2'); //function(..)\r\nreturn type; -> function(..\r\n)return type;

   var keywordAndSignRegex = new RegExp("(\\b" + KeyWords.join("\\b|\\b") + "\\b) +([\\-+]) +(\\w)", "g");
   input = input.replace(keywordAndSignRegex, "$1 $2$3"); // `WHEN - 2` -> `WHEN -2`
   input = input.replace(/([,|]) +([+\-]) +(\w)/g, '$1 $2$3'); // `1, - 2)` -> `1, -2)`
   input = input.replace(/(\() +([+\-]) +(\w)/g, '$1$2$3'); // `( - 2)` -> `(-2)`

   input = input.replace(/(\s*type\s*.*?\s+is)(.*?)\r*\n*\s*\brecord\b/gi, "$1 RECORD$2"); // type t_test is <<record on the next line>>

   input = input.replace(/(\s+port\s+map)\s*([^\(]*)\n\s*\(/gi, "$1 \($2"); // port with bracket on next line
   input = input.replace(/(\s+port)\s*([^\(]*)\r\n\s*\(/gi, "$1 \($2"); // port with bracket on next line
   input = input.replace(/WHEN *(\S+) *=> *([^;]+@@.*$)/gi, "WHEN $1 =>\r\n$2") // when followed by something and ending in a comment
   input = input.replace(/WHEN *(\S+) *=> *((?!.*@@)[^;]+$)/gi, "WHEN $1 =>\r\n$2") // when followed by not a comment
   input = input.replace(/\bREPORT\b(\S*)/gi, "REPORT $1") // when followed by not a comment

   // line starting with procedure and not containing IS
   // ***** be more relaxed on function and procedure definitions with new bracket system
   //input = input.replace(/(?!(\bis\b|;))(\s*PROCEDURE[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$2\r\n$3\r\n") //force multiline procedures to put arguments on the next line
   //input = input.replace(/(?!(\bis\b|;))(\s*FUNCTION[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$2\r\n$3\r\n") //force multiline functions to put arguments on the next line

   // line not containing keywords and ending in ) is
   // **** with new bracket system no longer needed to force on a new line
   //input = input.replace(/(\r*\n\s*)(?!\b(function|procedure|subtype|type|alias|component|architecture|case|entity)\s)(.*?)\)\s*(\bis\b.*)\r*\n/gi, "$1$3\r\n\) $4\r\n") //force the closing ") is" on a new line

   //    ^ (? !\b(function| procedure)) (.*\s *\bis\b)
   // line starting with procedure and not containing IS

   //**** new multiline support idea : be not too strict  
   //input = input.replace(/(\r*\n\s*)(?!(\bis\b|;))(\s*PROCEDURE[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$1$3\r\n$4\r\n") //force multiline procedures to put arguments on the next line
   //input = input.replace(/(\r*\n\s*)(?!(\bis\b|;))(\s*FUNCTION[\s\w]+?\()([^(@@|\r*\n)]+?)\r*\n/gi, "$1$3\r\n$4\r\n") //force multiline functions to put arguments on the next line
   // line not containing keywords and ending in ) is
   // ** double of a few lines above
   //input = input.replace(/(\r*\n\s*)(?!\b(function|procedure|subtype|type|alias|component|architecture|case|entity))(.*?)\)\s*(\bis\b.*)\r*\n/gi, "$1$3\r\n\) $4\r\n") //force the closing ") is" on a new line
   //    ^ (? !\b(function| procedure)) (.*\s *\bis\b)

   input = input.replace(/(.*;)(.*;)/gi, "$1\r\n$2"); // one executable statement per line
   input = input.replace(/\s*(signal\s+\w+)\s*,\s*(\w+)\s*:\s*(.*)/gi, "\r\n$1 : $3\r\nsignal $2 : $3"); // 2 signals defined on the same line
   input = input.replace(/\s*(variable\s+\w+)\s*,\s*(\w+)\s*:\s*(.*)/gi, "\r\n$1 : $3\r\nvariable $2 : $3"); // 2 signals defined on the same line
   input = input.replace(/(with\s+\S+\s+\bselect\b)([\s\S\n\r]+?)/gi, "$1\r\n$2");
   input = input.replace(/\r\n\r\n\r\n/g, '\r\n\r\n'); // remove double empty lines
   input = fix_closing_brackets(input);


   arr = input.split("\r\n");


   var result = [];
   try {
      beautify3(arr, result, settings, 0, 0);
   } catch (e) {
      var msg = e.stack.split("\n")
      var txt = msg.slice(0, 2).join("\n")
      return [, txt]
   }
   fix_in_allignment(result);

   var alignSettings = settings.SignAlignSettings;
   if (alignSettings != null && alignSettings.isAll) {
      AlignSigns(result, 0, result.length - 1, alignSettings.mode, settings.Indentation);
   }
   arr = FormattedLineToString(result, settings.Indentation);


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
   input = input.replace(new RegExp(ILNoAlignmentCorrection, "g"), " ")
   if (settings.AddNewLine && !input.endsWith(settings.EndOfLine)) {
      input += settings.EndOfLine;
   }
   input = autoformatOn(input);

   return [input,];
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

function beautifyFunctionDeclaration(inputs, result, settings, startIndex, parentEndIndex, indent, endWord) {
   var startResult = result.length
   var re = endWord
   var endIndex = getMatchingClosingBrackets(inputs, startIndex)
   if (inputs[endIndex].indexOf("RETURN") < 0) {
      // in case of a function, closing brackets alone are not enough. THe return statement can be on the next 2 lines:
      // all double empty lines are deleted by default, so in the worst case, there is an empty line after the last
      // closing bracket. 
      if (inputs.length - 1 > endIndex + 2) {
         if (inputs[endIndex + 1].indexOf("RETURN") > -1) endIndex = endIndex + 1
         else if (inputs[endIndex + 2].indexOf("RETURN") > -1) endIndex = endIndex + 2
      } else {
         if (inputs.length - 1 > endIndex + 1) {
            if (inputs[endIndex + 1].indexOf("RETURN") > -1) endIndex = endIndex + 1
         }
      }
   }
   var __i = beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, re), i = __i[0], inputs = __i[1]
   // now correct incorrect alignment of the return statement but only if it starts with return or ) return
   re = new RegExp(`[\\)]* *RETURN`)
   if (result[result.length - 1].Line.replaceAll(ILNoAlignmentCorrection, "").search(re) === 0) {
      result[result.length - 1].Line = result[result.length - 1].Line.replaceAll(ILNoAlignmentCorrection, "")
   }
   if (i < inputs.length - 2) {
      if ((inputs[i].search(re) < 0) && (inputs[i + 1].search(re) >= 0)) {
         // we assume that the return statement is on the line after the closing brackets of the function or procedure
         result.push(new FormattedLine(inputs[i + 1], indent));
         i++;
      }
   }
   for (var k = startResult; k < result.length; k++) {
      result[k].Line = result[k].Line.replaceAll(ILNoAlignmentCorrection, "`")
   }
   //align on assignment signs to get it clean. Is not done later due to the ILNoAlignmentCorrection
   AlignSign_(result, startResult, result.length - 1, ":", "global", "\r\r", settings.Indentation);
   AlignSign_(result, startResult, result.length - 1, ":=", "global", "\r\r", settings.Indentation);
   AlignSign_(result, startResult, result.length - 1, "@@comments", "global", "\\bWHEN\\b", settings.Indentation);
   for (var k = startResult; k < result.length; k++) {
      result[k].Line = result[k].Line.replaceAll("`", ILNoAlignmentCorrection)
   }
   var new_indent
   if (((inputs[i].indexOf(";") > -1) || (inputs[i].indexOf(ILSemicolon) > -1)) && (endWord.toString().indexOf("bIS") < 0)) {
      //function declaration, so no indent and return to continue parsing
      return [i, parentEndIndex];
   } else {
      // function definition, so indent and parse the body
      new_indent = indent + 1
      var _i = beautify3(inputs, result, settings, i + 1, new_indent, parentEndIndex), i = _i[0], endIndex = _i[1], inputs = _i[2];
      return [i, parentEndIndex];
   }

}


exports.beautifyFunctionDeclaration = beautifyFunctionDeclaration;


function AlignSigns(result, startIndex, endIndex, mode, indentation) {
   // except IS added to prevent var declarations in functions or procedures align to arguments defs
   // except ) at the beginning of the line is to break allignment for signals with multiline defaults
   // except procedure or function at the beginning of the line is to prevent that arguments of procs or functions are aliggned with signals above+
   // except entity is added to prevent that the colons in u_entity : entity work.jfkdfjk; are aligned in case of entities without ports
   AlignSign_(result, startIndex, endIndex, ":", mode, "(^(?!ATTRIBUTE)\\bIS\\b|^\\s*\\)|(^\\s*PROCEDURE)|(^\\s*FUNCTION)|(.*:\\s*\\bENTITY\\b))", indentation);
   // exlude when and if since the smaller than or equal operator is the same as the assignment operator, but we don't want to align on that
   AlignSign_(result, startIndex, endIndex, "(:|<)=", mode, "(^\(?!.*;\).*\\b(when|IF|ELSIF|ASSERT)\\b.*|^\\s*\\))", indentation);
   AlignSign_(result, startIndex, endIndex, "=>", mode, "\r\r", indentation);
   //AlignSign_(result, startIndex, endIndex, "<=", mode);
   //AlignSign_(result, startIndex, endIndex, "<=", mode);
   AlignSign_(result, startIndex, endIndex, "@@comments", mode, "\\bWHEN\\b", indentation);
}
exports.AlignSigns = AlignSigns;
function AlignSign_(result, startIndex, endIndex, symbol, mode, exclude, indentation, ignoreNoAlign = false) {
   var maxSymbolIndex = -1;
   var symbolIndices = {};
   var startLine = startIndex;
   var labelAndKeywords = [
      "([\\w\\s]*:(\\s)*\\bPROCESS\\b)",
      "([\\w\\s]*:(\\s)*POSTPONED PROCESS)",
      "([\\w\\s]*:\\s*$)",
      "([\\w\\s]*:.*\\s+GENERATE)",
      "\\b(PROCEDURE|FUNCTION)\\b\\s+[\\w]+\\s*\\(.*;"   // to filter out one line procedure/functions declarations containing default values
   ];
   var labelAndKeywordsStr = labelAndKeywords.join("|");
   var labelAndKeywordsRegex = new RegExp("(" + labelAndKeywordsStr + ")([^\\w]|$)");
   var colonIndex = 0
   var maxIndent = 0
   var forcedBlockEnd = false
   var noAlign = -1
   var skipLine = false
   if (ignoreNoAlign) {
      noAlign = 1e6
   }
   if (typeof exclude === 'undefined') {
      exclude = /\r\r/
   }
   var openBrackets = 0
   var endOfProcedure = false
   for (var i = startIndex; i <= endIndex; i++) {
      // mask out (other => <whatever>) constructs           
      var line = result[i].Line.replaceAll(/\(OTHERS => /g, "OOOOOOOOOOO");

      if (((symbol == ":") || (symbol == "(:|<)=")) && line.regexStartsWith(labelAndKeywordsRegex) || (endOfProcedure)) {
         forcedBlockEnd = true;
         endOfProcedure = false;
      }
      openBrackets = openBrackets + countOpenBrackets(line)[0];
      if ((openBrackets === 0) && (countOpenBrackets(line)[0] < 0)) {
         // if we found the closing brackets of a multiline, the end of a block is reached and alignment is needed
         // this to prevent that the local vars or constants would be aligned with the : or := in the argument list
         endOfProcedure = true;
      }
      // why is this????
      var regex = new RegExp("(?<=([\\s\\S\\\\]|^))" + symbol + "(?=[^=]+|$)");
      /*if (line.regexCount(regex) > 1) {
          continue;
      }*/
      var colonIndex = line.regexIndexOf(regex);
      if (symbol == "(:|<)=") {
         // filter out conditions which can appear in function calls as a boolean e.g a <= 5
         // the idea is that these kinds of constructions only appear when the number of open brackets at the position of the <= is > 0
         var a = countOpenBrackets(line.slice(0, colonIndex))
         if (a[0] > 0) {
            skipLine = true
         }

      }
      skipLine = skipLine || (result[i].Line.trim().search(/\b(IF|ELSIF|ASSERT)\b/) === 0)
      skipLine = skipLine || (result[i].Line.trim().search(ILNoAlignmentCorrection) > noAlign)

      if (colonIndex > 0 && (line.search(exclude) < 0) && !forcedBlockEnd && !skipLine) {
         //the WHEN lines in a case do
         maxSymbolIndex = Math.max(maxSymbolIndex, colonIndex);
         maxIndent = Math.max(maxIndent, result[i].Indent);
         symbolIndices[i] = colonIndex;

         // IF ELSE constructs are padded with ILForcedSpace
         // signal declarations and default values are padded with ILForcedSpace
         // WHEN .. ELSE constructs are padded wit ILForcedSpace
         // function calls play with the indent
         // so only thing to apply here is the correct alignment spaces
         if (((symbol == ":") || (symbol === "(:|<)=")) && (result[i].Line.indexOf(";") < 0)) {
            var text = ""
            var endOfMultline = i
            // here we detect when the ; is seen. In case of a multiline declaration, we need to fast forward 
            // to the end of the declaration
            if (endOfMultline < result.length - 1) {
               do {
                  endOfMultline++
                  text = text + " " + result[endOfMultline].Line.replaceAll(/\(OTHERS => /g, "OOOOOOOOOOO");
               } while (((result[endOfMultline].Line.indexOf(";") === -1) && (!skipLine)) && (endOfMultline < result.length - 1)) //search for the next ;
            }
            if (text.indexOf(ILForceSpace) >= 0) {// ILForceSpace found => indeed multiline assignment...
               // fast forward over the rest of the multiline declaration 
               do {
                  i++
                  if ((i <= endOfMultline) && (result[i].Line.indexOf(ILForceSpace) === 0)) {
                     symbolIndices[i] = colonIndex * -1;
                  } else {
                     break;
                  }
               } while (endOfMultline > i) // must be === 0 since case statements have also forced spaces but not at the start of a line
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
      //          end of IF                                end of assignment                     end of function/procedure
      if ((result[i].Line.indexOf("THEN") > -1) || (result[i].Line.indexOf(";") > -1) || (result[i].Line.search(/\bIS\b/) > -1)) {
         skipLine = false
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
      var padding = " "
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
      if (line.indexOf(ILForceSpace) === 0) {
         padding = ILForceSpace
      }
      result[lineIndex].Line = line.substring(0, symbolIndex)
         + (Array(noSpaces).join(padding))
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
      bracketlevel = bracketlevel + countOpenBrackets(inputs[i])[0]
      if (bracketlevel <= 0) { // smaller or equal since if a line starts with a closing bracket, we are doomed
         return i
      }
   }
   return -1
}

function beautifyMultilineIf(inputs, result, settings, startIndex, indent) {
   var padding = inputs[startIndex].trim().match(/[\S]+/)
   var i
   var elseif = (inputs[startIndex].indexOf("ELSIF") > -1)
   if (padding) {
      padding = padding[0].length + 1
   }
   var endIndex
   padding = ILForceSpace.repeat(padding)
   result.push(new FormattedLine(inputs[startIndex], indent));
   if (elseif) {
      result[startIndex].Indent--
      indent--
   }
   for (i = Math.min(startIndex + 1, inputs.length - 1); i < inputs.length - 1; i++) {
      inputs[i] = padding + inputs[i]

      result.push(new FormattedLine(inputs[i], indent));
      if (inputs[i].search(/\bTHEN\b/) > -1) {
         break;
      }
   }
   var _c = beautify3(inputs, result, settings, i + 1, indent + 1, endIndex), i = _c[0], endIndex = _c[1], inputs = _c[2];
   return [i, endIndex, inputs]
}
exports.beautifyMultilineIf = beautifyMultilineIf;

function beautifyMultilineIf2(inputs, result, settings, startIndex, indent) {
   var endIndex = inputs.length
   var elsif = (inputs[startIndex].indexOf("ELSIF") > -1)
   if (elsif) {
      indent--
   }
   var _i = beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, /(THEN|GENERATE)/, false), i = _i[0], inputs = _i[1]

   var _c = beautify3(inputs, result, settings, i + 1, indent + 1, endIndex), i = _c[0], endIndex = _c[1], inputs = _c[2];
   return [i, endIndex, inputs]
}
exports.beautifyMultilineIf2 = beautifyMultilineIf2;


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

function beautifyMultilineDefault2(inputs, result, settings, startIndex, indent) {
   var start = startIndex
   var endIndex = getSemicolonBlockEndIndex(inputs, settings, startIndex, inputs.length - 1)
   endIndex = endIndex[0]
   if (inputs[endIndex].indexOf(";") < 0) {
      endIndex++
   }

   var __u = beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, ";"), i = __u[0], inputs = __u[1]

   return [i, inputs];
}

exports.beautifyMultilineDefault2 = beautifyMultilineDefault2;

function beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, endPattern, skipFirstLine = false) {
   var openBrackets = 0
   var totalBrackets = 0
   var lastOpenBracket = -1
   var lastBracketPlace = 0
   var openBracketList = []
   var paddingSpaces = 0
   var basePadding = 0
   var onlyBracketFirstLine = false
   var paddingChar = ILForceSpace
   var endReached = false
   var line
   for (var i = startIndex; i <= endIndex; i++) {
      var patPos = inputs[i].match(endPattern)
      if ((patPos) && (endPattern.toString() != new RegExp('\\)').toString())) { //endpattern - /\)/ means returning after the last matching closing bracket and assumes the first line contains an opening bracket
         // hide everything behind the endPattern, to avoid bad brackets counting in case of e.g. ) := ( 
         line = inputs[i].slice(0, patPos.index) + patPos[0] + " ".repeat(inputs[i].slice(patPos.index).length)
      } else {
         line = inputs[i]
         if (((inputs[i].indexOf("IF") === 0) || (inputs[i].indexOf("ELSIF") === 0)) && (inputs[i].indexOf("(") < 0)) {
            // a if or elsif without brackets, add a bracket to get the alignment OK
            line = inputs[i].replace(/(IF|ELSIF) /, "$1\(")
         }
      }
      var __i = countOpenBrackets(line), openBrackets = __i[0], lastOpenBracket = __i[1], lastClosingBracket = __i[2]
      if (endReached) {
         break;
      }

      if (endPattern.toString() != new RegExp('\\)').toString()) {
         endReached = (line.search(endPattern) > -1)
      } else {
         if (!onlyBracketFirstLine) {
            endReached = ((totalBrackets + openBrackets) === 0)
         } else {
            endReached = ((totalBrackets + openBrackets) === 1)
         }
      }

      totalBrackets = totalBrackets + openBrackets
      var pad = 0
      for (var j = 0; j < lastOpenBracket.length; j++) {
         //here we want a openBracketList to be a list of which the first element is the absolute place on hte line
         //all the next ones are relative to this first level
         if (openBracketList.length === 0) {
            //if we did not get any bracket yet
            openBracketList.push(lastOpenBracket[j])
         } else {
            //there is already at least one bracket seen
            if (j === 0) {
               //one bracket seen, but on an earlier line
               if (openBracketList.length === 1) {
                  // if only the opening bracket was seen
                  pad = 1
               } else {
                  // another level already existed
                  pad = openBracketList[openBracketList.length - 1] + 1
               }
            }
            openBracketList.push(pad + lastOpenBracket[j])
            pad = pad + lastOpenBracket[j]
         }
      }
      //openBracketList = openBracketList.concat(lastOpenBracket)

      if (inputs[i].trim().indexOf(")") === 0) {
         //if closing bracket at the start of a line         
         paddingSpaces = openBracketList[openBracketList.length - 1]
         if ((paddingSpaces < 0) || (onlyBracketFirstLine) || (totalBrackets === 0)) {
            paddingSpaces = 0
         }
      }

      if (openBrackets < 0) {
         lastBracketPlace = openBracketList[openBracketList.length - 1]
         openBracketList = openBracketList.slice(0, openBracketList.length + openBrackets)
      }
      paddingSpaces = paddingSpaces < 0 ? 0 : paddingSpaces
      basePadding = basePadding < 0 ? 0 : basePadding
      if (!skipFirstLine) {
         result.push(new FormattedLine(paddingChar.repeat(paddingSpaces + basePadding) + inputs[i], indent));
      } else {
         skipFirstLine = false
      }
      if (i === startIndex) {

         if (openBracketList.length > 0) {
            // if there is an open bracket on the first line, align on this one, since it is normally behind the := 
            let line = inputs[i].replaceAll(/@@.*/g, "").trim()
            if (line[line.length - 1] === "(") {
               // if first line ends in an opening bracket (we suppose only one bracket)
               openBracketList[0] = 0
               openBracketList[1] = settings.Indentation.length - 1
               if (openBracketList.length > 1) {
                  openBracketList = openBracketList.slice(0, 2)
               }
               totalBrackets = openBracketList.length
               paddingSpaces = settings.Indentation.length
               basePadding = 0
               onlyBracketFirstLine = true
               // starting everything from a simple indent, no alignment correction is needed
               paddingChar = ILNoAlignmentCorrection
            } else {
               basePadding = openBracketList[0]
               if (totalBrackets > 1) { // if more than 1 bracket on the first line
                  paddingSpaces = openBracketList[openBracketList.length - 1] + 1
               } else {
                  paddingSpaces = 1
               }
            }

         } else {
            // no open bracket on the first line
            var a = inputs[i].match(/\S+/)
            if (a) {
               basePadding = a[0].length + 1
            }
            paddingSpaces = 0
         }
      }
      else {
         // not on the first line 
         if ((openBracketList.length > 1) && (totalBrackets > 1)) {
            paddingSpaces = openBracketList[openBracketList.length - 1] + 1
         } else { // last line with closing bracket
            paddingSpaces = 1
            if ((inputs[i].trim().indexOf(")") != -1) && (inputs[i].trim()[0] != ")") && (openBrackets < 0)) {
               //if closing bracket NOT at the start of a line        
               if (totalBrackets === 0) {
                  paddingSpaces = 1
                  basePadding--
               } else {
                  if (totalBrackets === 1) {
                     paddingSpaces = 1
                  } else {
                     paddingSpaces = openBracketList[openBracketList.length - 1] + 1
                  }
               }
            }
            if (totalBrackets === 0) {
               paddingSpaces = 0  // to fix if on bracketlevel 0
            }
         }
      }

   }
   i--
   return [i, inputs];
}
exports.beautifyBrackets = beautifyBrackets;

function beautifyDefaultAssignment(inputs, result, settings, startIndex, endIndex, indent) {
   // Please note that this function assumes that the line containing the default value assignment has already been pushed to result
   var openBrackets = 0
   var totalBrackets = 0
   var lastOpenBracket = -1
   var openBracketList = []
   var paddingSpaces = 0
   var paddingChar = ILForceSpace
   var assignmentSpace = result[result.length - 1].Line.search(/(:|<)=/) + 3 // + 3 to compensate for the length of the assignment and the space behind
   var basePadding = assignmentSpace
   if (assignmentSpace > 2) { // means that the assignment symbol was found
      var line = " ".repeat(assignmentSpace - 3) + result[result.length - 1].Line.slice(assignmentSpace - 3) // get rid of all things before assingment symbol
   } else {
      line = result[result.length - 1].Line
   }
   var __i = countOpenBrackets(line), openBrackets = __i[0], lastOpenBracket = __i[1], lastClosingBracket = __i[2]
   totalBrackets = totalBrackets + openBrackets

   for (var i = startIndex + 1; i <= endIndex; i++) {
      line = inputs[i]
      var __i = countOpenBrackets(line), openBrackets = __i[0], lastOpenBracket = __i[1], lastClosingBracket = __i[2]
      totalBrackets = totalBrackets + openBrackets
      openBracketList = openBracketList.concat(lastOpenBracket)

      if (openBrackets < 0) {
         openBracketList = openBracketList.slice(0, openBracketList.length + openBrackets)
      }

      result.push(new FormattedLine(paddingChar.repeat(paddingSpaces + basePadding) + inputs[i], indent));

      if (i === startIndex) {

         if (openBracketList.length > 0) {
            // if there is an open bracket on the first line, align on this one, since it is normally behind the := 
            let line = inputs[i].replaceAll(/@@.*/g, "").trim()
            basePadding = openBracketList[0] + 1
            if (totalBrackets > 1) { // if more than 1 bracket on the first line
               paddingSpaces = openBracketList[openBracketList.length - 1] + 1
            } else {
               paddingSpaces = 0
            }

         }
      }
      else {
         // not on the first line 

         if ((openBracketList.length > 0) && (totalBrackets > 0)) {
            paddingSpaces = openBracketList[openBracketList.length - 1] + 1
         } else { // last line with closing bracket
            paddingSpaces = 0
            if ((inputs[i].trim().indexOf(")") != -1) && (inputs[i].trim()[0] != ")") && (openBrackets < 0)) {
               //if closing bracket NOT at the start of a line        
               if (totalBrackets === 0) {
                  paddingSpaces = 0
               } else {
                  if (totalBrackets === 1) {
                     paddingSpaces = 0
                  } else {
                     paddingSpaces = openBracketList[openBracketList.length - 1]
                  }
               }
            }
         }
      }
      if (!paddingSpaces) {
         paddingSpaces = 0
      }
   }
   i--
   return [i, inputs];
}
exports.beautifyDefaultAssignment = beautifyDefaultAssignment;


function beautifySignalAssignment(inputs, result, settings, startIndex, indent) {
   var endIndex = getSemicolonBlockEndIndex(inputs, settings, startIndex, inputs.length - 1)
   var openBrackets = 0
   var totalBrackets = 0
   var lastOpenBracket = -1
   var openBracketList = []
   var paddingSpaces = 0
   var basePadding = 0
   var onlyBracketFirstLine = false
   var paddingChar = ILForceSpace
   endIndex = endIndex[0]
   if (inputs[endIndex].indexOf(";") < 0) {
      endIndex = endIndex + 1
   }

   for (var i = startIndex; i <= endIndex; i++) {
      var __i = countOpenBrackets(inputs[i]), openBrackets = __i[0], lastOpenBracket = __i[1], lastClosingBracket = __i[2]
      var assignmentSpace = inputs[i].indexOf(":=")
      if ((assignmentSpace > -1) && (i > startIndex)) {
         // at the level of the assignment, the bracket level should be 0
         // so to get the next alignment, we filter all brackets before the assignment
         // add one dummy entry to be able to reuse the mechanism
         // this adds a virtual starting ( at position 0
         totalBrackets = 1
         openBracketList = [-1]
         let line = inputs[i].slice(assignmentSpace + 2).trim() // + 2 to get the := out of it
         paddingSpaces = 0
         // this line will return the offsets relative to the :=
         __i = countOpenBrackets(line), openBrackets = __i[0], lastOpenBracket = __i[1], lastClosingBracket = __i[2]

      }
      totalBrackets = totalBrackets + openBrackets
      openBracketList = openBracketList.concat(lastOpenBracket)

      if (inputs[i].trim().indexOf(")") === 0) {
         //if closing bracket at the start of a line         
         paddingSpaces = openBracketList[openBracketList.length - 1]
         if (paddingSpaces < 0) {
            paddingSpaces = 0
         }
         if (totalBrackets === 0) {
            paddingSpaces = 0
            basePadding--
         }
         if (onlyBracketFirstLine) {
            basePadding = 0
         }
      }

      if (openBrackets < 0) {
         openBracketList = openBracketList.slice(0, openBracketList.length + openBrackets)
      }

      result.push(new FormattedLine(paddingChar.repeat(paddingSpaces + basePadding) + inputs[i], indent));

      if (i === startIndex) {

         if (openBracketList.length > 0) {
            // if there is an open bracket on the first line, align on this one, since it is normally behind the := 
            let line = inputs[i].replaceAll(/@@.*/g, "").trim()
            if (line[line.length - 1] === "(") {
               // if first line ends in an opening bracket (we suppose only one bracket)
               openBracketList[0] = settings.Indentation.length - 1 //to compensate the +1 on the next line
               onlyBracketFirstLine = true
               // starting everything from a simple indent, no alignment correction is needed
               paddingChar = ILNoAlignmentCorrection
            }
            basePadding = openBracketList[0] + 1
            if (totalBrackets > 1) { // if more than 1 bracket on the first line
               paddingSpaces = openBracketList[openBracketList.length - 1] + 1
            } else {
               paddingSpaces = 0
            }

         } else if (assignmentSpace > -1) {
            // no open brackets, but a default value on the first line
            basePadding = assignmentSpace + 3 //+3 to get past the :=
            if (lastOpenBracket.length > 0) {
               // assignment and open bracket on the same line
               basePadding = basePadding + lastOpenBracket[lastOpenBracket.length - 1]
            }
         }

      }
      else {
         // not on the first line 
         if (assignmentSpace > -1) {
            basePadding = basePadding + inputs[i].slice(0, assignmentSpace).length + 2 //+3 to get the := in it

            if (totalBrackets > 0) { // if more than 1 bracket on the first line
               paddingSpaces = openBracketList[openBracketList.length - 1] + 1
            }
         } else {
            if ((openBracketList.length > 1) && (totalBrackets > 1)) {
               paddingSpaces = openBracketList[openBracketList.length - 1] + 1
            } else { // last line with closing bracket
               paddingSpaces = 0
               if ((inputs[i].trim().indexOf(")") != -1) && (inputs[i].trim()[0] != ")") && (openBrackets < 0)) {
                  //if closing bracket NOT at the start of a line        
                  if (totalBrackets === 0) {
                     paddingSpaces = 0
                     basePadding--
                  } else {
                     if (totalBrackets === 1) {
                        paddingSpaces = 0
                     } else {
                        paddingSpaces = openBracketList[openBracketList.length - 1]
                     }
                  }
               }
            }
         }
      }
      if (!paddingSpaces) {
         paddingSpaces = 0
      }
      /*if (nextLinePadding > 0) {
         paddingSpaces = nextLinePadding
         nextLinePadding = 0
      }
      if (openBrackets > 0) {
         // we are on a line with a opening bracket

         nextLinePadding = lastOpenBracket + 1
      } else {
         if (openBrackets < 0) {
            // we are on a line with a closing bracket
            if (inputs[i].trim().search(/\)/) === 0) {
               // if the line only contains a );
               paddingSpaces--
               nextLinePadding = 0
            } else {
               // a line with a closing bracket and something else 
               var nothing_is_done = true
               nextLinePadding = Math.max(paddingSpaces - 1, 0)
            }
         }
         else {
            // no additional level of brackets found => stuff with the current padding
            if (assignmentSpace > -1) {
               //line contains a default assignment operator, but has no extra brackets => align on that
               nextLinePadding = assignmentSpace + 3 + paddingSpaces// + 3 since the assignment is 2 long + 1 normal space
               if ((totalBrackets > 0) && (lastOpenBracket >= 0) && (lastClosingBracket >= 0) && (lastClosingBracket < lastOpenBracket)) {
                  // case where e.g. declaration brackets close and default brackets open
                  // so this line contains something line ) := (
                  paddingSpaces--
                  nextLinePadding = paddingSpaces + lastOpenBracket + 1
               }
            }
         }
      }
      result.push(new FormattedLine(ILForceSpace.repeat(paddingSpaces) + inputs[i], indent));
      */
   }
   i--
   return [i, inputs];
}
exports.beautifySignalAssignment = beautifySignalAssignment;

function beautifySignalAssignment2(inputs, result, settings, startIndex, indent) {
   var endIndex = getSemicolonBlockEndIndex(inputs, settings, startIndex, inputs.length - 1)
   if (endIndex[0] === -1) {
      // no correct format found
      throw new Error(`File contains parsing errors in the line containing \n${inputs[startIndex]}`);
   }
   endIndex = endIndex[0]

   var startResult = result.length
   var _i = beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, /(;|:=)/, false), i = _i[0], inputs = _i[1]
   var assignmentSpace = result[result.length - 1].Line.search(/(:|<)=/) + 3 // + 3 to compensate for the length of the assignment and the space behind
   var line
   if (assignmentSpace > 2) { // means that the assignment symbol was found
      line = ILForceSpace.repeat(assignmentSpace - 2) + "_(" + result[result.length - 1].Line.slice(assignmentSpace) //replace the assigment by an opening bracket to reuse the bracket function
   } else {
      line = result[result.length - 1].Line
   }
   inputs[i] = line
   _i = beautifyBrackets(inputs, result, settings, i, endIndex, indent, /;/, true), i = _i[0], inputs = _i[1]
   for (var k = startResult; k < result.length; k++) {
      result[k].Line = result[k].Line.replaceAll(ILNoAlignmentCorrection, "`")
   }
   //align on assignment signs to get it clean. Is not done later due to the ILNoAlignmentCorrection
   AlignSign_(result, startResult, result.length - 1, "=>", "global", "\r\r", settings.Indentation);
   AlignSign_(result, startResult, result.length - 1, "@@comments", "global", "\\bWHEN\\b", settings.Indentation);
   for (var k = startResult; k < result.length; k++) {
      result[k].Line = result[k].Line.replaceAll("`", ILNoAlignmentCorrection)
   }
   return [i, inputs];
}
exports.beautifySignalAssignment2 = beautifySignalAssignment2;
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
      var indexOfSemicolon = input.search(new RegExp(`(;|${ILSemicolon})`));
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
         if (inputs[i].match(new RegExp(`^[ \\t]*\\)(;|${ILSemicolon}).*`))) {
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
         inputs[endIndex] = stuf.substr(0, stuf.length - settings.Indentation.length) + inputs[endIndex].trim()
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

function beautifySemicolonBlock2(inputs, result, settings, startIndex, parentEndIndex, indent) {
   var _a;
   var endIndex = startIndex;
   var functionStart = -1;
   // the following gets the start line of a semicolon block and the length of it (endIndex)
   _a = getSemicolonBlockEndIndex(inputs, settings, startIndex, parentEndIndex), endIndex = _a[0], parentEndIndex = _a[1];
   if (endIndex === -1) {
      endIndex = startIndex;
   }
   if (inputs[endIndex].indexOf(';') === -1) {
      endIndex++
   }
   var st = -1;
   var orgEndIndex = endIndex;
   var stuf = ""
   if (startIndex < endIndex) {
      // if a multiline detected
      var __i = beautifyBrackets(inputs, result, settings, startIndex, endIndex, indent, ";"), i = __i[0], inputs = __i[1]
   } else {
      result.push(new FormattedLine(inputs[startIndex], indent));
   }

   return [endIndex, parentEndIndex, inputs];
}
exports.beautifySemicolonBlock2 = beautifySemicolonBlock2;


/*
function countOpenBrackets(input) {
   var brackets = 0
   var lastOpenBracket = []
   var lastClosingBracket = []
   for (var j = 0; j < input.length; j++) {
      if (input[j] === "(") {
         brackets = brackets + 1
         lastOpenBracket.push(j) // add a bracket level

      }
      if (input[j] === ")") {
         brackets = brackets - 1
         lastClosingBracket.push(j)
         if ((lastOpenBracket.length > 1) && (brackets >= 0)) {
            // the (brackets > 0) make that lines starting with closing brackets
            // keep this position. We first need more opening brackets than closing ones before we start
            // deleting earlier closing ones 
            lastOpenBracket = lastOpenBracket.slice(0, lastOpenBracket.length - 1) // remove the opening brackets position
            if (lastClosingBracket.length > 1) {
               lastClosingBracket = lastClosingBracket.slice(0, lastClosingBracket.length - 1) // remove the opening brackets position
            }

         }
      }
   }
   return [brackets, lastOpenBracket[lastOpenBracket.length - 1], lastClosingBracket[lastClosingBracket.length - 1]]
}
*/
function countOpenBrackets(input, totatlBrackets = 0) {
   var brackets = 0
   var lastOpenBracket = []
   var lastClosingBracket = []
   for (var j = 0; j < input.length; j++) {
      if (input[j] === "(") {
         brackets = brackets + 1
         lastOpenBracket.push(j)
      }

      if (input[j] === ")") {
         brackets = brackets - 1
         lastClosingBracket.push(j)
         if ((lastOpenBracket.length > 0) && ((totatlBrackets + brackets) >= 0)) {
            lastOpenBracket = lastOpenBracket.slice(0, lastOpenBracket.length - 1) // remove the opening brackets position
            if (lastClosingBracket.length > 0) {
               lastClosingBracket = lastClosingBracket.slice(0, lastClosingBracket.length - 1) // remove the opening brackets position
            }

         }
      }
   }
   var bracketList = []
   if (lastOpenBracket.length > 0) {
      bracketList.push(lastOpenBracket[0])
      for (var j = 1; j < lastOpenBracket.length; j++) {
         bracketList.push(lastOpenBracket[j] - lastOpenBracket[j - 1])
      }
   }
   return [brackets, bracketList, lastClosingBracket[lastClosingBracket.length - 1]]
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

function getNextSymbolIndex(inputs, startindex, symbol, endIndex) {
   var j = startindex
   var end = inputs.length
   if (endIndex) {
      end = endIndex
   }
   for (j = startindex; j < end; j++) {
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
   if (inputs.length < i) {
      console.log(`around line ${i} "${inputs[i]}" possible loss of lines`)
   }
}

function beautify3(inputs, result, settings, startIndex, indent, endIndex) {
   //var oldInstanceAlignment = false
   var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
   var i;
   var regexOneLineBlockKeyWords = new RegExp(/(\bPROCEDURE\b)[^\w](?!.+[^\w]IS([^\w]|$))/); //match PROCEDURE..; but not PROCEDURE .. IS;
   var regexFunctionMultiLineBlockKeyWords = new RegExp(/\b(FUNCTION|IMPURE FUNCTION)\b[^\w](?=.+[^\w]IS([^\w]|$))/); //match FUNCTION .. IS; but not FUNCTION
   var blockMidKeyWords = ["BEGIN"];
   var blockStartsKeyWords = [
      "\\bIF\\b",
      "\\bCASE\\b",
      "\\bARCHITECTURE\\b",
      "\\bPROCEDURE\\b",
      "PACKAGE\\s+[\\w]+\\s+IS\\s*", // changed to prevent that package is new work.tdi_pkg generic map(<>) is not triggered
      "PACKAGE\\s+BODY\\s+[\\w]+\\s+IS\\s*", // changed to prevent that package is new work.tdi_pkg generic map(<>) is not triggered
      "(([\\w\\s]*:)?(\\s)*\\bPROCESS\\b)",
      "(([\\w\\s]*:)?(\\s)*POSTPONED +PROCESS)",
      "(.*\\s*\\bPROTECTED\\b)",
      "(\\bCOMPONENT\\b)",
      "\\bFOR\\b",
      "\\bWHILE\\b",
      "\\bLOOP\\b",
      "(.*\\s*\\bGENERATE)",
      "(\\bCONTEXT[\\w\\s\\\\]+IS)",
      "(\\bCONFIGURATION\\b(?!.+;))",
      "\\bBLOCK\\b",
      "\\bUNITS\\b",
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
      "(^\\s*[\\S\\\\]+[\\s]*<=)",
      "(^\\s*[\\S\\\\]+[\\s]*:=)"
   ]
   var functionOrProcedure = [
      "(?!.*<=)^\\s*[a-zA-Z0-9_.]+[\\s]*\\([^;]*$", // at the start of the line, any valid name follwed by a ( and then whatever as long as it doesn't contain <= nor ; 
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
      if (input.regexStartsWith(/(?!\bEND\b).*\bPROCESS\b/)) {
         // if it starts with process and open brackets are detected
         // *** SOLVE ME : 
         if (input.regexStartsWith(/(?!\bEND\b).*\bPROCESS\s*\(/)) {
            __i = beautifyBrackets(inputs, result, settings, i, endIndex, indent, new RegExp('\\)')), i = __i[0], inputs = __i[1]
            //result[result.length - 1].Line = result[result.length - 1].Line.replaceAll(ILForceSpace, " ").trim()
         } else { // process without sensitivity list or without open brackets on the first line
            result.push(new FormattedLine(input, indent));
         }
         __i = beautify3(inputs, result, settings, i + 1, indent + 1, endIndex), i = __i[0], endIndex = __i[1], inputs = __i[2]
         continue
      }

      if (input.regexStartsWith(/COMPONENT\s/)) {
         var modeCache = Mode;
         Mode = FormatMode.EndsWithSemicolon;
         _a = beautifyComponentBlock(inputs, result, settings, i, endIndex, indent), i = _a[0], endIndex = _a[1];
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
      }
      if (input.regexStartsWith(/\w+\s*:\s*(ENTITY)*/) && inputs[Math.min(i + 1, inputs.length - 1)].regexStartsWith(/[ ]*(PORT|GENERIC)+[ ]+MAP/) && settings.oldInstanceAlignment) {
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
         //if ((!containsBeforeNextSemicolon(inputs, i, /\bIS\b/)) && (Mode != FormatMode.functionOrProcedureDeclare)) {
         // multiline signal and constants are not supported as arguments of a procedure or function
         var modeCache = Mode;
         //Mode = FormatMode.MultilineAssignment;
         //var __i = beautifySignalAssignment(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1]
         var __i = beautifySignalAssignment2(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1]
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
         //}


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
      if (input.regexStartsWith(/TYPE\s+\w+\s+IS\s/)) {
         if ((input.search(/\bRECORD\b/) > -1) || input.regexStartsWith(/TYPE.*\bIS +PROTECTED[ BODY]*\b/)) {
            result.push(new FormattedLine(input, indent));
            _f = beautify3(inputs, result, settings, i + 1, indent + 1), i = _f[0], endIndex = _f[1], inputs = _f[2];
         } else { //possible enum, array definition, etc
            _f = beautifyBrackets(inputs, result, settings, i, endIndex, indent, /;/), i = _f[0], inputs = _f[1];
         }
         //_f = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "IS"), i = _f[0], endIndex = _f[1];
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
      if (input.regexStartsWith(/^(?!.*\bis$)\bPROCEDURE\b[\s\w]+\(.*/)) {
         var modeCache = Mode;
         Mode = FormatMode.functionOrProcedureDeclare
         // mode change needed to deal with last argument of a function declaration, whihc is indistinguisable from a multiline signal declaration
         //_h = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "PROCEDURE"), i = _h[0], endIndex = _h[1];
         var endword
         if (input.search(/\bIS\b/) > -1) { // procedure definition
            endword = new RegExp(`(\\bIS\\b)`)
         } else { // prodecure declaration
            endword = /\)/
         }
         _h = beautifyFunctionDeclaration(inputs, result, settings, i, endIndex, indent, endword), i = _h[0], endIndex = _h[1];
         Mode = modeCache
         /*if (inputs[i].regexStartsWith(/.*\)[\s]*IS/)) {
            _o = beautify3(inputs, result, settings, i + 1, indent + 1), i = _o[0], endIndex = _o[1], inputs = _o[2];
         }*/
         errorCheck(inputs, result, i, a)
         continue;
      }

      /*if (input.regexStartsWith(/FUNCTION[^\w]/)
         && input.regexIndexOf(/[^\w]RETURN[^\w]/) < 0) {
         var modeCache = Mode;
         Mode = FormatMode.functionOrProcedureDeclare
         // mode change needed to deal with last argument of a function declaration, whihc is indistinguisable from a multiline signal declaration
         _j = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "FUNCTION"), i = _j[0], endIndex = _j[1];
         Mode = modeCache
         if (!inputs[i].regexStartsWith(regexBlockEndsKeyWords)) {
            _p = beautify3(inputs, result, settings, i + 1, indent + 1), i = _p[0], endIndex = _p[1], inputs = _p[2];
         }
         else {
            result[i].Indent++;
         }
         errorCheck(inputs, result, i, a)
         continue;
      }*/
      if (input.regexStartsWith(/[IMPURE]* *FUNCTION[^\w]/)
         && input.regexIndexOf(/[^\w]RETURN[^\w]/) < 0) {
         var modeCache = Mode;
         Mode = FormatMode.functionOrProcedureDeclare
         // mode change needed to deal with last argument of a function declaration, whihc is indistinguisable from a multiline signal declaration
         //_k = beautifyPortGenericBlock(inputs, result, settings, i, endIndex, indent, "IMPURE FUNCTION"), i = _k[0], endIndex = _k[1];
         var endword
         if (input.search("\bIS\b") > -1) { // function definition
            endword = new RegExp(`(\\bIS\\b)`)
         } else { // function declaration
            endword = /RETURN/
         }

         _k = beautifyFunctionDeclaration(inputs, result, settings, i, endIndex, indent, endword), i = _k[0], endIndex = _k[1];
         Mode = modeCache
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
         var brackets = countOpenBrackets(input)[0]
         if (brackets > 0) {
            Mode = FormatMode.functionOrProcedure;
            //_l = beautifySemicolonBlock(inputs, result, settings, i, endIndex, indent), i = _l[0], endIndex = _l[1], inputs = _l[2];
            var startResult = result.length
            _l = beautifySemicolonBlock2(inputs, result, settings, i, endIndex, indent), i = _l[0], endIndex = _l[1], inputs = _l[2];
            Mode = modeCache;
            errorCheck(inputs, result, i, a)
            for (var k = startResult; k < result.length; k++) {
               result[k].Line = result[k].Line.replaceAll(ILNoAlignmentCorrection, "`")
            }
            AlignSign_(result, startResult, result.length - 1, "=>", "global", "\r\r", settings.Indentation);
            AlignSign_(result, startResult, result.length - 1, "@@comments", "global", "\\bWHEN\\b", settings.Indentation);
            for (var k = startResult; k < result.length; k++) {
               result[k].Line = result[k].Line.replaceAll("`", ILNoAlignmentCorrection)
            }

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
            //var __i = beautifyMultilineDefault(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1];
            var __i = beautifyMultilineDefault2(inputs, result, settings, i, indent), i = __i[0], inputs = __i[1];
            errorCheck(inputs, result, i, a)
            Mode = modeCache;
            continue;
         }
      }
      if (input.regexStartsWith(/(?!.*\bTHEN\b)^\b(IF|ELSIF)\b/)) {
         //a if or elseif wihtout a then on the same line
         var modeCache = Mode;
         Mode = FormatMode.MultilineAssignment;
         //var __i = beautifyMultilineIf(inputs, result, settings, i, indent), i = __i[0], endIndex = __i[1], inputs = __i[2];
         var __i = beautifyMultilineIf2(inputs, result, settings, i, indent), i = __i[0], endIndex = __i[1], inputs = __i[2];
         indent = result[result.length - 1].Indent
         errorCheck(inputs, result, i, a)
         Mode = modeCache;
         continue;
      }

      if (input.regexStartsWith(/\bREPORT\b/) && (input.indexOf(";") === -1)) {
         var start = result.length
         inputs[i] = inputs[i].replace(/\bREPORT\b/, "REPORT(") // add a bracket to make the magic happen
         __i = beautifyBrackets(inputs, result, settings, i, endIndex, indent, /(SEVERITY|;)/), i = __i[0], inputs = __i[1]
         result[start].Line = result[start].Line.replace(/\bREPORT\(/, "REPORT ") // remove the bracket
         if (result[result.length - 1].Line.search(/\bSEVERITY\b/) > -1) {
            result[result.length - 1].Line = result[result.length - 1].Line.replaceAll(ILForceSpace, " ").trim() // correct the severity 
         }
         continue
      }


      result.push(new FormattedLine(input, indent));


      if (startIndex != 0
         && (input.regexStartsWith(regexBlockMidKeyWords)
            || (Mode != FormatMode.functionOrProcedureDeclare && input.regexStartsWith(regexMidKeyElse))
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
      if (arr[i].match(/\bFUNCTION\b|\bPROCEDURE\b/) != null) {
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
