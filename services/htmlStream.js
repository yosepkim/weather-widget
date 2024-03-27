/*********************************************************************
   HTMLStream takes HTML streams, finds and replaces  
   weather widget placeholder elements with the actual 
   HTML snippets for the weather widgets.

  Parameters:
  * `db` can be either `hp` for HarperDB or EdgeKV by default
  * `key` is Location Key for dynamic <weather:widget />, e.g 109-c
**********************************************************************/
export class HTMLStream {
    constructor (httpRequest, readableStreamClass, writableStreamClass, database, dbType, queryKey) {
      let readController = null;
      
      // Initializing readableStream processor
      this.readable = new readableStreamClass({
        start(controller) {
          readController = controller;
        }
      });
  
      // `handlTemplate` uses regular expressions to find and replace weather widgets.
      async function handleTemplate (responseText) {
        const esiTagRegex = /(<weather:widget[ ]+locationid=['"](.*?)['"][ ]+unit=['"](.*?)['"][ ]*((dynamic)?)[ ]*\/>)/g;
  
        let match;
        // Finding a weather widget one at a time
        while ((match = esiTagRegex.exec(responseText)) !== null) {
          // Getting the tentire weather widget text that was matched
          const taggedContent = match[1]; 
          
          let key = '';
          // When Location Key is passed in and the widget is marked `dynamic`,
          // use the Location Key, otherwise Key defined in the widget
          if (queryKey && match[4] === 'dynamic') {
            key = queryKey;
          } else {
            const locationKey = match[2];
            const tempUnit = match[3];
            key = `${locationKey}-${tempUnit}`;
          }

          let widget = '';
          // If `hp` is passed in for HarperDB, get the HTML snippet from it, otherwise
          // get it from EdgeKV
          if (dbType === 'hp') {
            const url = 'https://harperdb.edgecloud9.com/weather-widget/?key=' + key;
            const options = {
              method: 'GET',
              headers: { 'Authorization': 'Basic {base64-encoded-username-colon-password}', 'Content-Type': 'application/json'},
            };
            const response = await httpRequest(url, options);
            const widgetJson = await response.json();
            widget = widgetJson[0].value;
          } else {
            widget = await database.getByKey(key);
          }

          // Replacing the widget placeholder with the HTML content 
          const replacedText = responseText.replace(taggedContent, widget);
          // Updating the original HTML content
          responseText = replacedText;
        }
        readController.enqueue(responseText);
      }
  
      // Defining a promise to be used to indicate the work is done
      let completeProcessing = Promise.resolve();
  
      // Initializing writableStreamClass
      this.writable = new writableStreamClass({
        write (text) {
          // As read stream is written, do the find and replace
          completeProcessing = handleTemplate(text, 0);
          return completeProcessing;
        },
        close () {
          return completeProcessing.then(() => readController.close());
        }
      });
    }
  }
  
  export default HTMLStream;