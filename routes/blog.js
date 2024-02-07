const express = require('express');
const mongodb = require('mongodb');

const db = require('../data/database');

const router = express.Router();
const ObjectId = mongodb.ObjectId;

router.get('/', function (req, res) {
  res.redirect('/posts');
});

router.get('/posts', async function (req, res) {
  const posts = await db.getDb().collection('posts').find({}).project({ title: 1, summary: 1, 'author.name': 1 }).toArray();
  res.render('posts-list', { posts: posts });
});

router.get('/new-post', async function (req, res) {
  const authors = await db.getDb().collection('authors').find().toArray();
  // console.log(authors);
  res.render('create-post', { authors: authors });
});

router.post('/posts', async function (request, response) {
  const authorId = new ObjectId(request.body.author);
  const author = await db.getDb().collection('authors').findOne({ _id: authorId });

  const newPost = {
    title: request.body.title,
    summary: request.body.summary,
    body: request.body.content,
    created_at: new Date(),
    author: {
      id: authorId,
      name: author.name
    }
  };

  await db.getDb().collection('posts').insertOne(newPost);
  response.redirect('/posts');
});

router.get('/post/:id', async function (request, response, next) {
  let postId = request.params.id;

  //default error cannot catch wrong id
  try {
    postId = new ObjectId(postId);
  } catch (error) {
    return response.status(404).render('404');
    //return next(error); //pass to next middleware for error
  }

  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { summary: 0 });
  const author = await db.getDb().collection('authors').findOne({ _id: new ObjectId(post.author.id) });

  // console.log(post.author.id);
  // console.log(author);

  if (!post || !author) {
    return response.status(404).render('404');
  }

  post.humanReadableDate = post.created_at.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  post.created_at = post.created_at.toISOString();

  response.render('post-detail', { post: post, author: author });
});

router.get('/post/edit/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  const post = await db.getDb().collection('posts').findOne({ _id: postId }, { title: 1, summary: 1, body: 1 });

  if (!post) {
    return response.status(404).render('404');
  }

  response.render('update-post', { post: post });
})

router.post('/post/edit/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  await db.getDb().collection('posts').updateOne({ _id: postId }, {
    $set: {
      title: request.body.title,
      summary: request.body.summary,
      body: request.body.content
    }
  });

  response.redirect('/posts');
})

router.post('/post/delete/:id', async function (request, response) {
  const postId = new ObjectId(request.params.id);
  await db.getDb().collection('posts').deleteOne({ _id: postId });

  response.redirect('/posts');
})

module.exports = router;