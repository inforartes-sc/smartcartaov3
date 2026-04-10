import fetch from 'node-fetch';

async function test() {
  const url = 'http://localhost:3000/';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WhatsApp/2.21.12.21 A'
    }
  });
  const html = await res.text();
  console.log(html);
}
test();
