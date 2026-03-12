const fetch = require('node-fetch');
const FormData = require('form-data');
const md5 = require('md5');

const form = new FormData();
const body = {
  uriListenProductAdd: "https://giveaway-premium.herokuapp.com/hooks/product",
  uriListenInventory: "",
  uriListenNewNotification: "",
  uriListenOrderStatus: ""
}
const version = '1.0'
const apiUsername = '';
const data = JSON.stringify(body);
const checksum = md5(md5(''+ data) + data);

form.append('version', version);
form.append('apiUsername', apiUsername);
form.append('data', data);
form.append('checksum', checksum);
 
fetch('https://dev.nhanh.vn/api/store/configwebhooks', { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => console.log(json));