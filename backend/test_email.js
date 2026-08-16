const nodemailer = require('nodemailer'); 
async function test() { 
  const transporter = nodemailer.createTransport({ 
    service: 'gmail', 
    auth: { user: 'zadel1026@gmail.com', pass: 'slqaeueebbwpnzke' } 
  }); 
  try { 
    console.log('testing connection...'); 
    await transporter.verify(); 
    console.log('success'); 
  } catch (e) { 
    console.error('error:', e); 
  } 
} 
test();
