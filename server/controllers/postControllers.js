const Post = require("../models/postModel");
const HttpError = require("../models/errorModel");
const { v4: uuid } = require('uuid');

// ======================== CREATE A NEW POST
// POST : api/posts
// PROTECTED
const createPost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return next(new HttpError("Please fill in all fields.", 422));
    }

    const newPost = await Post.create({
      title,
      content,
      category,
      author: req.user.id, // Assuming the user ID comes from the authentication middleware
    });

    res.status(201).json(`New post created with ID: ${newPost._id}`);
  } catch (error) {
    return next(new HttpError("Post creation failed.", 422));
  }
};

// ======================== GET ALL POSTS
// GET : api/posts
// UNPROTECTED
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate('author', 'name email'); // Assuming author is a reference to User model
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError("Failed to fetch posts.", 422));
  }
};

// ======================== GET A SINGLE POST
// GET : api/posts/:id
// UNPROTECTED
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', 'name email');

    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError("Failed to fetch post.", 422));
  }
};

// ======================== EDIT A POST
// PUT : api/posts/:id
// PROTECTED
const editPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    // Check if the user is the author
    if (post.author.toString() !== req.user.id) {
      return next(new HttpError("You are not authorized to edit this post.", 403));
    }

    // Update the post
    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError("Failed to edit post.", 422));
  }
};

// ======================== DELETE A POST
// DELETE : api/posts/:id
// PROTECTED
const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return next(new HttpError("Post not found.", 404));
    }

    // Check if the user is the author
    if (post.author.toString() !== req.user.id) {
      return next(new HttpError("You are not authorized to delete this post.", 403));
    }

    await post.remove();
    res.status(200).json({ message: "Post deleted successfully." });
  } catch (error) {
    return next(new HttpError("Failed to delete post.", 422));
  }
};

// ======================== GET POSTS BY CATEGORY
// GET : api/posts/category/:category
// UNPROTECTED
const getPostsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const posts = await Post.find({ category }).populate('author', 'name email');

    if (posts.length === 0) {
      return next(new HttpError("No posts found for this category.", 404));
    }

    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError("Failed to fetch posts by category.", 422));
  }
};

// ======================== GET USER POSTS
// GET : api/posts/user/:userId
// PROTECTED
const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ author: userId }).populate('author', 'name email');

    if (!posts || posts.length === 0) {
      return next(new HttpError("No posts found for this user.", 404));
    }

    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError("Failed to fetch user posts.", 422));
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  editPost,
  deletePost,
  getPostsByCategory,
  getUserPosts,
};
