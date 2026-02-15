const jwt = require('jsonwebtoken'); // JWT library ro import mikone

function authGuard(req, res, next) { // function baraye middleware
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  } // auth header ro migire va age darayft nakard error mide
  
  const token = authHeader.split(' ')[1]; // token ro extract mikone va az bearer joda mikone

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET); // token ro verify mikone
    req.user = {
    id: payload.id,
    email: payload.email,
    };
    return next(); // ejaze mide request edame peyda kone age nabashe req haminja tamom mishe
  } catch (error) {
  return res.status(401).json({ error: 'Invalid or expired token' });
  } // age token invalid bashe error mide
}
module.exports = authGuard; // function ro export mikone ta beshe azash be onvane router estefade kard
