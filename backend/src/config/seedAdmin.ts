import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const seedAdmin = async () => {
  const admins = [
    {
      name: "System Admin",
      email: "admin@example.com",
      password: "Admin@123",
    },
  ];

  for (const admin of admins) {
    const existingAdmin = await User.findOne({
      email: admin.email,
    });

    if (existingAdmin) {
      continue;
    }

    const hashedPassword = await bcrypt.hash(
      admin.password,
      12
    );

    await User.create({
      name: admin.name,
      email: admin.email,
      password: hashedPassword,
      role: "admin",
    });

    console.log(
      `Admin account created: ${admin.email}`
    );
  }
};