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
        // Use a new distinct database and collection
        collection = client.db('VintageCamerasDB').collection('Cameras');
        console.log('Connected to MongoDB Atlas (VintageCamerasDB)');

        // Seed some data if empty
        const count = await collection.countDocuments();
        if (count === 0) {
            const seedData = [
                {
                    brand: "Leica",
                    model: "M3",
                    year: "1954",
                    format: "35mm Rangefinder",
                    image: "images/leica.png",
                    description: "A legendary 35mm rangefinder camera favored by photojournalists, characterized by its exceptionally bright viewfinder and high-quality build."
                },
                {
                    brand: "Hasselblad",
                    model: "500C/M",
                    year: "1970",
                    format: "Medium Format",
                    image: "images/hasselblad.png",
                    description: "An iconic modular medium-format SLR that captured history, including the Apollo space missions to the moon."
                },
                {
                    brand: "Nikon",
                    model: "F",
                    year: "1959",
                    format: "35mm SLR",
                    image: "images/nikon.png",
                    description: "The professional workhorse of the 60s and 70s. It defined the modern 35mm Single Lens Reflex camera."
                }
            ];
            await collection.insertMany(seedData);
            console.log(' Database seeded with initial vintage cameras');
        }
    } catch (ex) {
        console.error(' MongoDB Connection failed:', ex);
    }
}

// Controller functions
const postCamera = async (camera) => {
    return await collection.insertOne(camera);
}

const getAllCameras = async () => {
    return await collection.find({}).toArray();
}

// Routes
app.get('/api/cameras', async (req, res) => {
    try {
        const result = await getAllCameras();
        res.json({ statusCode: 200, data: result, message: 'get all cameras success' });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'error fetching cameras' });
    }
});

app.post('/api/cameras', async (req, res) => {
    try {
        const camera = req.body;
        const result = await postCamera(camera);
        res.json({ statusCode: 201, data: result, message: 'camera added successfully' });
    } catch (err) {
        res.status(500).json({ statusCode: 500, message: 'error adding camera' });
    }
});

app.listen(port, () => {
    console.log(`App listening to: ${port}`);
    runDBConnection();
});
