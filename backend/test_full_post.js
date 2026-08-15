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
      restaurant_name: "Biriyani House",
      business_name: "Biriyani House Pvt Ltd",
      owner_name: "Rahul Sharma",
      email: "owner@restaurant.com",
      phone: "+91 98765 43210",
      country: "India",
      website_title: "Biriyani House",
      subdomain_slug: "biriyanihouse" + Math.floor(Math.random() * 1000),
      plan: "starter",
      trial_days: 14,
      storage_limit_mb: 500,
      website_enabled: true,
      cms_enabled: true,
      blog_enabled: false,
      reservation_enabled: false,
      events_enabled: false,
      affiliate_enabled: false,
      marketing_enabled: false
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
