export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== 'POST') return res.status(405).end();

  const { token } = req.body;
  const secret = process.env.HCAPTCHA_SECRET;

  const params = new URLSearchParams({ secret, response: token });
  const r = await fetch('https://hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await r.json();
  res.status(200).json({ success: data.success });
}
