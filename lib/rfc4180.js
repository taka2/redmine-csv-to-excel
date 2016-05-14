/**
 * rfc4180.js
 * CSV parser.
 *
 * @version 1.0.1
 * @author think49
 * @url https://gist.github.com/606500
 * @license http://www.opensource.org/licenses/mit-license.php (The MIT License)
 * @see <a href="http://www.ietf.org/rfc/rfc4180.txt">http://www.ietf.org/rfc/rfc4180.txt</a>
 */

var XMLHttpRequest = (typeof XMLHttpRequest === 'function' || typeof XMLHttpRequest === 'object') ? XMLHttpRequest : (function () {
  var i, l;

  for (i = 0, l = arguments.length; i < l; i++) {
    try {
      arguments[i]();
      return arguments[i];
    }
    catch (error) {}
  }

  throw new Error('XMLHttpRequest is not defined');
})(function () { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); }, function () { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); });


var RFC4180 = (function () {


  // HTTP constructor

  function HTTP () {

    if (!(this instanceof HTTP)) {
      throw new Error(this + ' is not a object created by constructor');
    }

    return this;
  }


  // HTTP.prototype

  (function () {

    // createReadystatechangeHandler(callbackfn [, thisObject, xhr])

    function createReadystatechangeHandler (callbackfn, thisObject, xhr) {
      var listener;

      if (typeof callbackfn !== 'function') {
        throw new TypeError(callbackfn + ' is not a function');
      }

      listener = function (event) {
        var responseText, responseXML;

        if (event && event.target) {
          xhr = event.target;
        }
        if (typeof xhr !== 'object') {
          throw new TypeError(xhr + ' is not a object');
        }

        if (xhr.readyState === 4) {
          if (xhr.status === 200) {

            responseText = xhr.responseText;
            responseXML = xhr.responseXML;

            if (responseText || responseXML) {

              if (thisObject) {
                callbackfn.call(thisObject, responseText, responseXML);
              } else {
                callbackfn(responseText, responseXML);
              }

            }
          }

  //        xhr.abort();  // Google Chrome 6 returns an error : XMLHttpRequest Exception 101

          if (xhr.removeEventListener) {
            xhr.removeEventListener('readystatechange', listener, false);
          } else {
            xhr.onreadystatechange = new Function;
          }
          callbackfn = thisObject = xhr = listener = null;
        }
      };

      return listener;
    }


    // HTTP.prototype.request(method, url [, callbackfn, options])

    this.request = function (method, url, callbackfn, options) {
      var async, data, thisObject, xhr, isDocument;

      // default value
      async = false;
      data = null;

      if (options !== null && typeof options === 'object') {
        if ('async' in options) {
          async = options.async;
        }
        if ('data' in options) {
          data = options.data;
        }

        thisObject = options.thisObject;
      }

      if (typeof url !== 'string') {
        throw new TypeError(method + ' is not a string');
      }

      // RFC 2616 (HTTP/1.1)
      if (method !== 'GET' && method !== 'POST' && method !== 'HEAD' && method !== 'PUT' && method !== 'OPTIONS' && method !== 'DELTE' && method !== 'TRACE' && method !== 'CONNECT') {
        throw new TypeError(method + ' is not a method (RFC 2616)');
      }

      if (method === 'GET' || method === 'HEAD') { // XMLHttpRequest (3.6.3. The send() method)
        data = null;
      }

      if (data !== null && typeof data === 'object' && data.nodeType === 9) {
        isDocument = true;
      }

      if (data !== null && !isDocument && typeof data !== 'string') { // XMLHttpRequest (3.6.3. The send() method)
        throw new TypeError(data + ' is not a null or document or string');
      }

      async = Boolean(async);


      xhr = new XMLHttpRequest;
      xhr.open(method, url, async);

      if (typeof callbackfn === 'function') {
        if (xhr.addEventListener) {
          xhr.addEventListener('readystatechange', createReadystatechangeHandler(callbackfn, thisObject), false); // XMLHttpRequest (3.4. Event Handler Attributes)
        } else {
          xhr.onreadystatechange = createReadystatechangeHandler(callbackfn, thisObject, xhr); // [IE8] Handler's thisObject is not [object XMLHttpRequest]
        }
      }

      xhr.setRequestHeader('Pragma', 'no-cache');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');

      // XMLHttpRequest (3.6.3. The send() method)
      if (isDocument) {
        xhr.setRequestHeader('Content-Type', 'application/xml');
      } else if (method === 'POST') {
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      } else if (typeof data === 'string') {
        xhr.setRequestHeader('Content-Type', 'text/plain; charset=UTF-8');
      }

      xhr.send(data);
    };


    // HTTP.prototype.get(url [, callbackfn, options])

    this.get = function (url /*, callbackfn, options*/) {
      var _arguments;

      _arguments = ['GET', url].concat(arguments);
      this.request.apply(this, _arguments);
    };

  }).call(HTTP.prototype);



  // RFC4180 constructor

  function RFC4180 (isLoose, separator) {
    var COMMA, CR, DQUOTE, LF, CRLF, TEXTDATA, escaped, non_escaped, field, name, header, record, file;

    if (!(this instanceof RFC4180)) {
      throw new Error(this + ' is not a object created by constructor');
    }

    isLoose = Boolean(isLoose);

    COMMA = typeof separator === 'string' ? separator : '\u002C';
    CR = '\u000D';      // as per section 6.1 of RFC 2234 [2]
    DQUOTE = '\u0022';  // as per section 6.1 of RFC 2234 [2]
    LF = '\u000A';      // as per section 6.1 of RFC 2234 [2]

    if (!isLoose) {
      CRLF = CR + LF;   // as per section 6.1 of RFC 2234 [2]
      TEXTDATA =  '[\u0020-\u0021\u0023-\u002B\u002D-\u007E]';
      escaped = DQUOTE + '(?:' + TEXTDATA + '|[' + COMMA +  CR + LF + ']|' + DQUOTE + '{2})*' + DQUOTE;
    } else {
       CRLF = '(?:' + CR + LF + '|[' + LF + CR + '])';
       TEXTDATA = '[^' + LF + CR + DQUOTE + COMMA + ']';
       escaped = DQUOTE + '(?:[^' + DQUOTE + ']|' +  DQUOTE + '{2})*' + DQUOTE;
    }

    non_escaped = TEXTDATA + '*';
    field = '(?:' + escaped + '|' + non_escaped + ')';
    name = field;
    header = name + '(?:' + COMMA + name + ')*';
    record = field + '(?:' + COMMA + field + ')*';
    file = '(?:' + header + CRLF + ')?' + record + '(?:' + CRLF + record + ')*(?:' + CRLF + ')?';

    this.isLoose = isLoose;
    this.syntaxString = { separator: COMMA };
    this.syntaxRegExp = {
      non_escaped: new RegExp('^' + non_escaped + '$'),
      file: new RegExp('^' + file + '$'),
      convert_strings: new RegExp([COMMA, CRLF, escaped, non_escaped, '[\\s\\S]'].join('|'), 'g')
    };

    return this;
  }


  // RFC4180.prototype

  (function () {

    // RFC4180.prototype.isCSV(csvString)

    this.isCSV = function (csvString) {
      if ('string' !== typeof csvString) {
        throw new TypeError(csvString + ' is not a string');
      }

      return this.syntaxRegExp.file.test(csvString);
    };


    // RFC4180.prototype.toArray(csvString)

    this.toArray = function (csvString) {
      var isLoose, separator, syntaxRegExp, non_escaped_reg, result, records, i, separatorAfterFlag, isCRLF;

      if ('string' !== typeof csvString) {
        throw new TypeError(csvString + ' is not a string');
      }

      isLoose = this.isLoose;
      separator = this.syntaxString.separator;
      syntaxRegExp = this.syntaxRegExp;
      non_escaped_reg = syntaxRegExp.non_escaped;
      separatorAfterFlag = true;
      isCRLF = false;

      records = [[]];
      i = 0;

      result = csvString.replace(syntaxRegExp.convert_strings, function (token) {
        switch (token.charAt(0)) {
          case '"':
            records[i].push(token.slice(1, token.length - 1).replace(/""/g, '"'));
            separatorAfterFlag = false;
            break;
          case separator:
            if (separatorAfterFlag) {
              records[i].push('');
            }
            separatorAfterFlag = true;
            break;
          case '\r':
            isCRLF = true;
          case '\n':
            if (!isCRLF && !isLoose) {
              csvString = isLoose = separator = syntaxRegExp = non_escaped_reg = result = records = i = separatorAfterFlag = isCRLF = null;
              throw new Error('not well-formed CSV');
            }
            if (separatorAfterFlag) {
              records[i].push('');
            }
            records[++i] = [];
            separatorAfterFlag = true;
            break;
          default:
            if (non_escaped_reg.test(token)) {
              if (separatorAfterFlag) {
                records[i].push(token);
                separatorAfterFlag = false;
              }
            } else {
              csvString = isLoose = separator = syntaxRegExp = non_escaped_reg = result = records = i = separatorAfterFlag = isCRLF = null;
              throw new Error('not well-formed CSV');
            }
            break;
        }
        return '';
      });

      if (result.length !== 0 || records.length < 1) {
        csvString = isLoose = separator = syntaxRegExp = non_escaped_reg = result = records = i = separatorAfterFlag = isCRLF = null;
        throw new Error('not well-formed CSV');
      }

      csvString = isLoose = separator = syntaxRegExp = non_escaped_reg = result = i = separatorAfterFlag = isCRLF = null;
      return records;
    };


    // RFC4180.prototype.toTable(csvString, doc [, useThead])

    this.toTable = function (csvString, doc, useThead) {
      var isLoose, separator, syntaxRegExp, non_escaped_reg, result, table, tbody, rows, tr, cellElement, cells, i, separatorAfterFlag, isCRLF;

      if (typeof csvString !== 'string') {
        throw new TypeError(csvString + ' is not a string');
      }

      if (typeof doc !== 'object' || typeof Node === 'function' && doc.nodeType !== Node.DOCUMENT_NODE || doc.nodeType !== 9) {
        throw new TypeError(doc + ' is not a document');
      }

      useThead = Boolean(useThead);
      isLoose = this.isLoose;
      separator = this.syntaxString.separator;
      syntaxRegExp = this.syntaxRegExp;
      non_escaped_reg = syntaxRegExp.non_escaped;
      separatorAfterFlag = true;
      isCRLF = false;

      table = doc.createElement('table');
      cellElement = useThead ? doc.createElement('th') : doc.createElement('td');
      tbody = useThead ? table.appendChild(doc.createElement('thead')) : table.appendChild(doc.createElement('tbody'));
      rows = tbody.rows;
      tr = tbody.insertRow(0);
      cells = tr.cells;
      i = 0;

      result = csvString.replace(syntaxRegExp.convert_strings, function (token) {
        switch (token.charAt(0)) {
          case '"':
            tr.appendChild(cellElement.cloneNode(false)).appendChild(doc.createTextNode(token.slice(1, token.length - 1).replace(/""/g, '"')));
            separatorAfterFlag = false;
            break;
          case separator:
            if (separatorAfterFlag) {
              tr.appendChild(cellElement.cloneNode(false));
            }
            separatorAfterFlag = true;
            break;
          case '\r':
            isCRLF = true;
          case '\n':
            if (!isCRLF && !isLoose) {
              csvString = doc = useThead = isLoose = separator = syntaxRegExp = non_escaped_reg = result = table = tbody = rows = tr = cellElement = cells = i = separatorAfterFlag = isCRLF = null;
              throw new Error('not well-formed CSV');
            }
            if (separatorAfterFlag) {
              tr.appendChild(cellElement.cloneNode(false));
            }
            if (useThead) {
              tbody = table.appendChild(doc.createElement('tbody'));
              rows = tbody.rows;
              cellElement = doc.createElement('td');
              useThead = false;
            }
            tr = tbody.insertRow(rows.length);
            cells = tr.cells;
            separatorAfterFlag = true;
            break;
          default:
            if (non_escaped_reg.test(token)) {
              if (separatorAfterFlag) {
                tr.appendChild(cellElement.cloneNode(false)).appendChild(doc.createTextNode(token));
                separatorAfterFlag = false;
              }
            } else {
              csvString = doc = useThead = isLoose = separator = syntaxRegExp = non_escaped_reg = result = table = tbody = rows = tr = cellElement = cells = i = separatorAfterFlag = isCRLF = null;
              throw new Error('not well-formed CSV');
            }
            break;
        }
        return '';
      });

      if (result.length !== 0 || cells.length === 0) {
        csvString = doc = useThead = isLoose = separator = syntaxRegExp = non_escaped_reg = result = table = tbody = rows = tr = cellElement = cells = i = separatorAfterFlag = isCRLF = null;
        throw new Error('not well-formed CSV');
      }

      csvString = doc = useThead = isLoose = separator = syntaxRegExp = non_escaped_reg = result = tbody = rows = tr = cellElement = cells = i = separatorAfterFlag = isCRLF = null;
      return table;
    };


    // RFC4180.prototype.fileToTable(url, doc, useThead, callbackfn [, options])

    this.fileToTable = function (url, doc, useThead, callbackfn /*, options*/) {
      var method, options, that;

      method = 'GET'; // default value
      options = arguments[4];
      that = this;

      if (options !== null && typeof options === 'object' && 'method' in options) {
        method = options.method;
        delete options.method;
      }

      new HTTP().request(method, url, function (responseText) {
        var table;

        table = that.toTable(responseText, doc, useThead);
        callbackfn(table);

        url = doc = useThead = callbackfn = method = options = that = null;
      }, options);
    };


    // RFC4180.prototype.fileToArray(url, callbackfn [, options])

    this.fileToArray = function (url, callbackfn /*, options*/) {
       var method, options, that;

      method = 'GET'; // default value
      options = arguments[2];
      that = this;

      if (options !== null && typeof options === 'object' && 'method' in options) {
        method = options.method;
        delete options.method;
      }

      new HTTP().request(method, url, function (responseText) {
        var array;

        array = that.toArray(responseText);
        callbackfn(array);

        url = callbackfn = method = options = that = null;
      }, options);
    };


  }).call(RFC4180.prototype);


  return RFC4180;

})();
