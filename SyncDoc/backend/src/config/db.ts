import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoMemoryServer: MongoMemoryServer | null = null;

const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      // Attempt connection to Atlas/configured URI with a fast 4-second timeout
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log("MongoDB connected successfully to configured URI");
      return;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`Could not connect to configured MONGO_URI: ${msg}`);
      console.warn("Falling back to local in-memory MongoDB server...");
    }
  }

  // Fallback: Start in-memory MongoDB server so app works seamlessly anywhere
  mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log("MongoDB connected successfully (In-Memory Database)");
};

export default connectDatabase;

