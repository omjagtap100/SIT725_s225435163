const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
const app = express();
const port = process.env.port || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB Connection
const uri = "mongodb+srv://omjagtap3304_db_user:bu24sMMXlXo5jO8G@cluster0.zyrfzy8.mongodb.net/";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let collection;

async function runDBConnection() {
    try {
        await client.connect();
        collection = client.db('ExoticPlantsDB').collection('Plants');
        console.log('Connected to MongoDB Atlas (ExoticPlantsDB)');

        // Seed some data if empty
        const count = await collection.countDocuments();
        if (count === 0) {
            const seedData = [
                {
                    name: "Monstera Deliciosa",
                    scientificName: "Monstera deliciosa",
                    careLevel: "Medium",
                    price: "$45.00",
                    image: "images/plant1.jpg",
                    description: "Known for its iconic heart-shaped leaves with natural holes."
                },
                {
                    name: "Fiddle Leaf Fig",
                    scientificName: "Ficus lyrata",
                    careLevel: "High",
                    price: "$60.00",
                    image: "images/plant2.jpg",
                    description: "A stunning statement plant with large, violin-shaped leaves."
                },
                {
                    name: "Snake Plant",
                    scientificName: "Dracaena trifasciata",
                    careLevel: "Low",
                    price: "$25.00",
                    image: "images/plant3.jpg",
                    description: "One of the toughest indoor plants, perfect for beginners."
                }
            ];
            await collection.insertMany(seedData);
            console.log(' Database seeded with initial plants');
        }
    } catch (ex) {
        console.error(' MongoDB Connection failed:', ex);
    }
}

// Controller functions
const postPlant = async (plant) => {
    return await collection.insertOne(plant);
}

const getAllPlants = async () => {
    return await collection.find({}).toArray();
}

// Routes
app.get('/api/plants', async (req, res) => {
    try {
        const result = await getAllPlants();
        res.json({ statusCode: 200, data: result, message: 'get all plants success' });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'error fetching plants' });
    }
});

app.post('/api/plants', async (req, res) => {
    try {
        const plant = req.body;
        const result = await postPlant(plant);
        res.json({ statusCode: 201, data: result, message: 'plant added successfully' });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'error adding plant' });
    }
});

app.listen(port, () => {
    console.log(`App listening to: ${port}`);
    runDBConnection();
});
