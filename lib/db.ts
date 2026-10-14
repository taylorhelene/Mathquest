import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB || "mathquest";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return db;
}

export type UserDoc = {
  _id?: string;
  email: string;
  name: string;
  passwordHash: string;
  hasPaidAccess: boolean;
  createdAt: Date;
  role?: "learner" | "admin";
};

export type ProgressDoc = {
  _id?: string;
  userId: string;
  lessonId: string;
  attempts: number;
  correct: boolean;
  completedAt?: Date;
  lastAttemptAt: Date;
};

export type OrderDoc = {
  _id?: string;
  userId: string;
  email: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  merchantRequestId?: string;
  checkoutRequestId?: string;
  mpesaReceipt?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function usersCollection(): Promise<Collection<UserDoc>> {
  const database = await getDb();
  return database.collection<UserDoc>("users");
}

export async function progressCollection(): Promise<Collection<ProgressDoc>> {
  const database = await getDb();
  return database.collection<ProgressDoc>("progress");
}

export async function ordersCollection(): Promise<Collection<OrderDoc>> {
  const database = await getDb();
  return database.collection<OrderDoc>("orders");
}
