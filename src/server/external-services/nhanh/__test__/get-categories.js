const fetch = require('node-fetch');
const FormData = require('form-data');
const md5 = require('md5');

const form = new FormData();
const version = '1.0'
const apiUsername = 'Username';
const data = 'productcategory';
const checksum = md5(md5('ApiKey'+ data) + data);

form.append('version', version);
form.append('apiUsername', apiUsername);
form.append('data', data);
form.append('checksum', checksum);
 
fetch('https://dev.nhanh.vn/api/product/category', { method: 'POST', body: form })
    .then(res => res.json())
    .then(json => console.log(json));