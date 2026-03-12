const fetch = require('node-fetch');
const FormData = require('form-data');
const md5 = require('md5');

// const products = [{"id":1541245,"code":"SSGS2","name":"Samsung Galaxy S2","importPrice":12000000,"price":13500000}];
const params = {
  page: 1,
  icpp: 10,
  sort: { id: 'desc' }
}
const form = new FormData();
const version = '1.0'
const apiUsername = 'username';
const checksum = md5(md5('secretKey'+ data) + data);
const data = JSON.stringify(params);

form.append('version', version);
form.append('apiUsername', apiUsername);
form.append('data', data);
form.append('checksum', checksum);
 
fetch('https://graph.nhanh.vn/api/product/search', { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => console.log(json.data.products['33631205']));