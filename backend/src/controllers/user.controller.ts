import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Message from "../models/Message.js";


export const getUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const currentUserId = req.user?._id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      message: "Failed to get users",
    });
  }
};

export const getUser = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Delete all chats/messages sent by the user
    await Message.deleteMany({
      sender: user._id,
    });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and their chats deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to get user",
    });
  }
};

export const updateCurrentUser = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      email,
      currentPassword,
      password,
    } = req.body;

    const user = await User.findById(req.user!._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updateData: {
      name?: string;
      email?: string;
      password?: string;
    } = {
      name,
      email,
    };

    /*
     * Password change requested
     */
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      updateData.password =
        await bcrypt.hash(password, 10);
    }

    const updatedUser =
      await User.findByIdAndUpdate(
        req.user!._id,
        updateData,
        {
          returnDocument: "after",
          runValidators: true,
        }
      ).select("-password");

    res.json(updatedUser);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};