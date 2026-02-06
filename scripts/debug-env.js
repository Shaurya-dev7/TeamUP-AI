require('dotenv').config({ path: '.env.local' });
console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('Program')));
