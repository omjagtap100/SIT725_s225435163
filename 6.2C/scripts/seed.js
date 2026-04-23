const { MongoClient, ServerApiVersion } = require('mongodb');
const { DB_NAME, COLLECTION_NAME, Decimal128 } = require('../models/book.model');


const uri =
  'mongodb+srv://omjagtap3304_db_user:bu24sMMXlXo5jO8G@cluster0.zyrfzy8.mongodb.net/';

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

const books = [
  {
    id: 'b1',
    title: 'The Three-Body Problem',
    author: 'Liu Cixin',
    year: 2008,
    genre: 'Science Fiction',
    summary:
      "The Three-Body Problem is the first novel in the Remembrance of Earth's Past trilogy. The series portrays a fictional past, present, and future wherein Earth encounters an alien civilization from a nearby system of three Sun-like stars orbiting one another, a representative example of the three-body problem in orbital mechanics.",
    price: Decimal128.fromString('29.99')
  },
  {
    id: 'b2',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    year: 1847,
    genre: 'Classic',
    summary:
      "An orphaned governess confronts class, morality, and love at Thornfield Hall, uncovering Mr. Rochester's secret and forging her own independence.",
    price: Decimal128.fromString('22')
  },
  {
    id: 'b3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    year: 1813,
    genre: 'Classic',
    summary:
      'Elizabeth Bennet and Mr. Darcy navigate pride, misjudgement, and social expectations in a sharp study of manners and marriage.',
    price: Decimal128.fromString('22')
  },
  {
    id: 'b4',
    title: 'The English Patient',
    author: 'Michael Ondaatje',
    year: 1992,
    genre: 'Historical Fiction',
    summary:
      'In a ruined Italian villa at the end of WWII, four strangers with intersecting pasts confront memory, identity, and loss.',
    price: Decimal128.fromString('25.39')
  },
  {
    id: 'b5',
    title: 'Small Gods',
    author: 'Terry Pratchett',
    year: 1992,
    genre: 'Fantasy',
    summary:
      'In Omnia, the god Om returns as a tortoise, and novice Brutha must confront dogma, empire, and the nature of belief. The Discworld is flat and is orbited by its sun, but Omnian doctrine says that the world is round and orbits the sun.',
    price: Decimal128.fromString('31.99')
  }
];

async function seed() {
  await client.connect();
  const coll = client.db(DB_NAME).collection(COLLECTION_NAME);

  await coll.deleteMany({});
  await coll.insertMany(books);
  await coll.createIndex({ id: 1 }, { unique: true });

  console.log(`Seeded ${books.length} books into ${DB_NAME}.${COLLECTION_NAME}`);
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
