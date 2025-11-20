import { jwttoken } from "#utils/jwt.js";

export function createTestToken(
  id = 1,
  role = "admin",
  email = "test@example.com",
  phone = "0000000000"
) {
  return jwttoken.sign({
    id,
    role,
    email,
    phone,
  });
}
