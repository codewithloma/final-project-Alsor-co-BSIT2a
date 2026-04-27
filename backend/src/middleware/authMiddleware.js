import jwt from "jsonwebtoken";

// =============================
// PROTECT ROUTES
// Verifies JWT token and attaches decoded user to req.user
// =============================
export const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();

  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// =============================
// ALIAS FOR NEW EVENT ROUTES
// Allows new code to use protect
// =============================
export const protect = authMiddleware;

// =============================
// ROLE-BASED AUTHORIZATION
// Allows only selected roles
// =============================
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(403).json({ message: "User role not found" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized`,
      });
    }

    next();
  };
};