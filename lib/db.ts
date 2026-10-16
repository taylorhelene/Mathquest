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
  emailVerified: boolean;
  otpHash?: string;
  otpExpires?: Date;
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
  resultCode?: string;
  resultDesc?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Service health / analytics events (TTS failures, etc.) */
export type ServiceEventDoc = {
  _id?: string;
  service: "elevenlabs" | "mpesa" | "email" | string;
  level: "error" | "warn" | "info";
  code?: string;
  message: string;
  statusCode?: number;
  createdAt: Date;
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

export async function serviceEventsCollection(): Promise<
  Collection<ServiceEventDoc>
> {
  const database = await getDb();
  return database.collection<ServiceEventDoc>("service_events");
}


export type ArtistDoc = {
  _id?: string;
  displayName: string;
  email: string;
  /** Short bio */
  bio?: string;
  /** Public URL to .glb/.gltf (Sketchfab, GitHub raw, CDN, etc.) */
  modelUrl: string;
  modelTitle: string;
  license?: string;
  /** Optional thumbnail image URL */
  thumbnailUrl?: string;
  /** Appreciation: PayPal email or paypal.me username */
  paypal?: string;
  /** Appreciation: M-Pesa phone e.g. 07XXXXXXXX */
  mpesaPhone?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};

export async function artistsCollection(): Promise<
  Collection<ArtistDoc>
> {
  const database = await getDb();
  return database.collection<ArtistDoc>("artists");
}

export async function logServiceEvent(
  event: Omit<ServiceEventDoc, "_id" | "createdAt">,
): Promise<void> {
  try {
    const col = await serviceEventsCollection();
    await col.insertOne({ ...event, createdAt: new Date() });
  } catch (err) {
    console.error("Could not log service event:", err);
  }
}
