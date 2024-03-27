import { ReadableStream, WritableStream } from 'streams';
import { httpRequest } from 'http-request';
import { createResponse } from 'create-response';
import { TextEncoderStream, TextDecoderStream } from 'text-encode-transform';
import { EdgeKV } from './edgekv.js';
import HTMLStream from './services/htmlStream.js';
import URLSearchParams from 'url-search-params';

const UNSAFE_RESPONSE_HEADERS = ['content-length', 'transfer-encoding', 'connection', 'vary',
  'accept-encoding', 'content-encoding', 'keep-alive',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'upgrade'];

export async function responseProvider(request) {
    // Initializing the EdgeKV client
    const database = new EdgeKVDatabase();

    // Getting query variables from URL
    const params = new URLSearchParams(request.query);
    const dbType = params.get('db');      // `db` can be either `hp` for HarperDB or EdgeKV by default 
    const queryKey = params.get('key');   // `key` is Location Key for dynamic <weather:widget />, e.g 109-c

    // Forwarding the request to get the target from origin
    return httpRequest(`${request.scheme}://${request.host}${request.url}`).then(async response => { 
        try {
            // Returning a response from the origin with original values except the content 
            return createResponse(
                response.status,
                getSafeResponseHeaders(response.getHeaders()),
                response.body
                    .pipeThrough(new TextDecoderStream())
                    // Here is where magic happens. Streaming the content through the custom provider, HTMLStream 
                    .pipeThrough(new HTMLStream(httpRequest, ReadableStream, WritableStream, database, dbType, queryKey))
                    .pipeThrough(new TextEncoderStream())
            );

        } catch (exception) {
            // In case an exception, instead of sending the original content over, sending Exception details
            return createResponse(
                500,
                { 'Content-Type': ['application/json'] },
                JSON.stringify({ 
                    path: request.path,
                    error: exception,
                    errorMessage: exception.message,
                    stacktrace: exception.stack
                })
            );
        }
    });
}

/***************************************************** 
   EdgeKVDatabase is a wrapper around EdgeKV client.
   This is useful, when unit testing using a fake
   database client
******************************************************/
class EdgeKVDatabase {
    constructor () {
        this.store = new EdgeKV({namespace: "weather-data", group: "0"});
    }

    getByKey(key) {
        return this.store.getText({ item: key });
    }

    set(key, value) {
        this.store.putTextNoWait({
            item: key,
            value: value
        });
    }
}

function getSafeResponseHeaders(headers) {
    for (let unsafeResponseHeader of UNSAFE_RESPONSE_HEADERS) {
        if (unsafeResponseHeader in headers) {
            delete headers[unsafeResponseHeader]
        }
    }
    return headers;
}