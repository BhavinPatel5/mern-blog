const express = require('express');
const upload = require('express-fileupload')
const cors = require('cors');
const { connect } = require('mongoose');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const { notFound ,errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: "https://localhost:3000" }));
app.use(upload())

app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/uploads',express.static(__dirname +'/uploads'))

app.use(notFound)
app.use(errorHandler)

connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port 5000`);
    });
  })
  .catch(error => {
    console.log(error);
  });
