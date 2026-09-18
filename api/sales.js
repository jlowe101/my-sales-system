import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const client = await connectToDatabase();
    const db = client.db('sales_management');
    const salesCollection = db.collection('sales');

    // POST: Save a new transaction
    if (req.method === 'POST') {
      const { planName, variantPrice, quantity, totalAmount, deductInvestment } = req.body;

      const saleRecord = {
        planName,
        variantPrice: Number(variantPrice),
        quantity: Number(quantity),
        totalAmount: Number(totalAmount),
        deductInvestment: Boolean(deductInvestment),
        createdAt: new Date()
      };

      const result = await salesCollection.insertOne(saleRecord);
      return res.status(201).json({ success: true, insertedId: result.insertedId });
    }

    // GET: Retrieve all sales records
    if (req.method === 'GET') {
      const sales = await salesCollection.find({}).sort({ createdAt: -1 }).toArray();
      return res.status(200).json({ success: true, sales });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
}