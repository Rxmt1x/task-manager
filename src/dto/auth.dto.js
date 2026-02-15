const z = require('zod');

const signupDto = z.object({
  email: z.string().email({ message: "Email is not valid" }),
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
  name: z.string().optional(),
});

const loginDto = z.object({
  email: z.string().email({ message: "Email is not valid" }),
  password: z.string().min(1, { message: "Password is required" }),
});

module.exports = {
  registerDto: signupDto,
  loginDto,
};