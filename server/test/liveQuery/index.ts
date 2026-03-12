import * as Parse from 'parse/node';
Parse.initialize("myAppId", "myJavascriptKey");
//javascriptKey is required only if you have it on server.

// @ts-ignore
Parse.serverURL = 'http://localhost:1337/api'

const query = new Parse.Query('Channel');
query.equalTo("name", "Consignment").subscribe().then((subscription) => {
  console.log("------------")
  subscription.on('open', () => {
    console.log('subscription opened');
  });
   
  // subscription.on('create', (object) => {
  //   console.log('object created: ', object);
  // });
  
  subscription.on('update', (object) => {
    console.log('object updated', object);
  });
}).catch(err => console.error(err));
