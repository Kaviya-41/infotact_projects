import { Schema, model, type Document as MongooseDocument } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserDocument extends MongooseDocument, Omit<IUser, '_id'> {
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<UserDocument>("User", UserSchema);
export default User;
