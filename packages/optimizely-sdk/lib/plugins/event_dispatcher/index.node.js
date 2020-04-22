/**
 * Copyright 2016-2018, 2020, Optimizely
 *
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
import http from 'http';
import https from 'https';
import url from 'url';
import HttpProxyAgent from 'http-proxy-agent';
import HttpsProxyAgent from 'https-proxy-agent';

/**
 * Dispatch an HTTP request to the given url and the specified options
 * @param {Object}  eventObj          Event object containing
 * @param {string}  eventObj.url      the url to make the request to
 * @param {Object}  eventObj.params   parameters to pass to the request (i.e. in the POST body)
 * @param {string}  eventObj.httpVerb the HTTP request method type. only POST is supported.
 * @param {function} callback         callback to execute
 * @return {ClientRequest|undefined}          ClientRequest object which made the request, or undefined if no request was made (error)
 */
export var dispatchEvent = function(eventObj, callback) {
  // Non-POST requests not supported
  if (eventObj.httpVerb !== 'POST') {
    return;
  }

  var proxyUrl = eventObj.proxyUrl;
  var proxyAgent = null;  
  var parsedUrl = url.parse(eventObj.url);
  var dataString = JSON.stringify(eventObj.params);
  var isSecure = parsedUrl.protocol === 'https:';

  if (proxyUrl) {
    proxyAgent = new (isSecure ? HttpsProxyAgent : HttpProxyAgent)(proxyUrl);
  }

  var requestOptions = {
    host: parsedUrl.host,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': dataString.length.toString(),
    },
    agent: proxyAgent,
  };

  var requestCallback = function(response) {
    if (response && response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
      callback(response);
    }
  };

  var req = (isSecure ? https : http).request(requestOptions, requestCallback);
  // Add no-op error listener to prevent this from throwing
  req.on('error', function() {});
  req.write(dataString);
  req.end();
  return req;
};

export default {
  dispatchEvent,
};
