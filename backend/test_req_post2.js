const http = require('http');

const data = JSON.stringify({ email: 'admin@restos.com', password: 'Admin@123456' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const token = JSON.parse(body).data.accessToken || JSON.parse(body).data.token;
    
    const postData = JSON.stringify({
      restaurant_name: "Test Restaurant " + Math.random(),
      business_name: "Test Business LLC",
      owner_name: "John Doe",
      email: "test_restaurant" + Math.random() + "@example.com",
      phone: "1234567890",
      subdomain_slug: "test-rest-" + Math.floor(Math.random() * 1000000)
    });

    const postReq = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/restaurants',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'Authorization': `Bearer ${token}`
      }
    }, res3 => {
      let b3 = '';
      res3.on('data', d => b3 += d);
      res3.on('end', () => console.log('POST RESTAURANT:', res3.statusCode, b3));
    });
    
    postReq.write(postData);
    postReq.end();
  });
});

req.write(data);
req.end();
