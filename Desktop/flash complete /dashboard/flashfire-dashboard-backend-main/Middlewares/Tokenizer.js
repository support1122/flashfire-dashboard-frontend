import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();


export default async function Tokenizer(req, res,next) {
  const { email, existanceOfUser } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required for token generation' });
  }
  try {
    const secret = process.env.JWT_SECRET || 'flashfire-secret-key-2024';
    const token = jwt.sign({email, name : existanceOfUser?.name} , secret , { expiresIn: '7d' });
    req.body.token = token;
    req.headers.authorization = `Bearer ${token}`
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate token' });
  }
}
