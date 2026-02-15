const express = require('express'); // express ro import mikone
const bcrypt = require('bcryptjs'); // az bcrypt estefade mikone baraye hash kardane pass
const jwt = require('jsonwebtoken'); // baraye gereftan va verify kardane token
const AppDataSource = require('../src/data-source'); // baraye bargharari connection ba DB
const authGuard = require('../middleware/auth'); // guard 
const router = express.Router(); // auth,task,user express router object ro misaze
const validate = require('../middleware/validate');
const { signupDto, loginDto } = require('../src/dto/auth.dto');

function signAccessToken(user){
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    {expiresIn : '30m'}
  );
} // token dorost mikone Id va email ro dakhel token encode mikone ba secret code token verify mikone va expiretion time mizare

router.post('/signup',validate(signupDto), async (req, res)=>{ // endpoint misaze
  const { email, password, name} = req.body; // ba json body in 3 mored ro as client migire
   
  if (!email || !password){
    return res.status(400).json({ error:'Email and Password required'});
  }

  try{
   const userRepo = AppDataSource.getRepository('User'); // az DB be user table dastresi peyda mikonim
   const existingUser = await userRepo.findOneBy({email}); 
   if(existingUser){
    return res.status(400).json({ error:'User already exists'});
   } // az email check mikone ke user az ghabl vojod dare ya na
  
   const hashedPassword = await bcrypt.hash(password, 10); // az bcrypt estefade mikone va password ro hash mikone

   const user = userRepo.create({
    email,
    password: hashedPassword,
    name: name || null,
   }); // ye user object dorost mikone

   const savedUser = await userRepo.save(user); // user ro to DB save mikone
  const token = signAccessToken(savedUser); // login token mifreste

  return res.status(201).json({
    message: 'Signup was successful',
    token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
      }, // dar sorate signupe movafagh message va info mifreste
  });
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error during signup' });
  } // dar sorate be vojode omadane moshkel error mifreste
});

router.post('/signin', validate(loginDto), async (req, res)=>{
    const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try{
   const userRepo = AppDataSource.getRepository('User'); // az DB be user table dastresi peyda mikonim
   const user = await userRepo.findOneBy({email}); 
   if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    } // age user peyda nashe error mide

  const passwordMatches = await bcrypt.compare(password, user.password); // password ro ba passworde signup moghayese mikone
  if (!passwordMatches) {
      return res.status(401).json({error: 'Invalid password'});
    } // age pass dorost nabashe error mide
  
  const token = signAccessToken(user);

    return res.status(201).json({
    message: 'Signin was successful',
    token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
   });
}catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error during signin' });
  } 
});

router.get('/me', authGuard, async (req, res)=>{
  try{
    const userRepo = AppDataSource.getRepository('User');
    const user = await userRepo.findOneBy({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
  });
} catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error fetching profile' });
   }
});

module.exports = router;


