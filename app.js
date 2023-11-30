require('dotenv').config();
const express = require('express');
require('./config/db')()

const { PrismaClient } = require('@prisma/client');
const { Client } = require('@elastic/elasticsearch');

const prisma = new PrismaClient()

const app = express();

app.use(express.json());

const client = new Client({
  // node: 'https://...', // Elasticsearch endpoint
  node: 'https://10ffbb7d67dc4d56a9c8dc9e9753677b.us-central1.gcp.cloud.es.io',
  auth: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD
  }
})

app.post('/book', async (req, res) => {
  try {
    const bookDetails = req.body;

    const exists = await prisma.book.findUnique({
      where: {
        name: bookDetails.name
      }
    })

    if (exists) throw new Error('Duplicate entry!')

    const newBook = await prisma.book.create({
      data: {
        ...bookDetails
      }
    })
    if (!newBook) throw new Error('Error posting book')
    // PUT test;
    // await client.indices.create({ index: 'books' });
    const dt = await client.index({
      index: 'books',
      id: newBook.id,
      document: {
        ...newBook
      },
    })
    console.log(dt);
    res.status(201).json({ msg: 'Book created successfully', newBook })
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
})

app.get('/books', async (req, res) => {
  try {
    const found = await client.search({
      index: 'books'
    })
    res.status(200).json({ msg: 'Found book', book: found.hits.hits.map(book => book._source) })
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error });
  }
})

app.get('/book/:name', async (req, res) => {
  try {
    const { name } = req.params;
    // const found = await client.get({
    //   index: 'books',
    //   id: 'my_document_id',
    // })
    // console.log(found);
    const found = await client.search({
      index: 'books',
      query: {
        match: {
          name,
        }
      }
    })
    res.status(200).json({ msg: 'Found book', book: found?.hits.hits[0]._source })
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
})

app.put('/book/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updateData = req.body;

    const book = await prisma.book.update({
      where: {
        name
      },
      data: {
        ...updateData
      }
    });

    if (!book) throw new Error('Error updating the selected book');

    const ggg = await client.update({
      index: 'books',
      id: +book.id,
      doc: {
        name,
        // new_field: 'new value'
        ...book
      }
    })
    console.log(ggg);

    res.status(200).json({ msg: 'Book updated', ggg })
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
})

app.delete('/book/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const book = await prisma.book.delete({
      where: {
        name
      }
    })

    if (!book) throw new Error('Error deleting')
    await client.delete({
      index: 'books',
      id: +book.id
    })
    res.status(200).json({ msg: 'deleted'});
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
})

app.listen(4040, () => console.log('Book store listening on port 4040'));

// await client.indices.delete({ index: 'my_index' })