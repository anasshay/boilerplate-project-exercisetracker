const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
require('dotenv').config()

// DB url
const url = 'mongodb+srv://anass:aaa123456@cluster0.6bpfc.mongodb.net/users?retryWrites=true&w=majority'

// Connect to DB
mongoose.connect(url, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to Database"));

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// username schema
const userSchema = new mongoose.Schema({
  username: { type: String },
});
const Users = mongoose.model('users', userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: { type: String },
  date: Date,
  duration: Number,
  description: { type: String },
})
const Exercise = mongoose.model('exercise', exerciseSchema);


// //Delete data at start
// Users.deleteMany({}).then(function() {
//   console.log("Data deleted"); // Success
// }).catch(function(error) {
//   console.log(error); // Failure
// });
// Exercise.deleteMany({}).then(function() {
//   console.log("Data deleted"); // Success
// }).catch(function(error) {
//   console.log(error); // Failure
// });

// Subscribe
app.post('/api/users', (req, res) => {
  const name = req.body.username;
  Users.create({ username: name });
  setTimeout(() => {
    Users.findOne({ username: name }, (err, person) => {
      if (err) return console.log(err)
      res.send({ username: person.username, _id: person._id })
    })
  }, 1000);
})
app.get('/api/users', (req, res) => {
  Users.find({}, (err, items) => {
    if (err) return console.log(err)
    res.send(items)
  })
})

app.post('/api/users/:id/exercises', (req, res) => {
  const _id = req.params.id;
  const { description, duration, date } = req.body
  let newdate;
  if (!date) {
    // newdate = new Date().toISOString().split('T')[0];
    newdate = new Date().toDateString();
  } else {
    console.log(date)
    newdate = new Date(date).toDateString();
  }

  if (!description || !duration) {
    res.send({ message: 'Empty entry' })
  }

  Users.findById(_id, (err, user) => {
    if (!user) return res.send('Unknown userId');
    else {
      const username = user.username
      const newExercise = new Exercise({ userId: _id, date: newdate, duration, description });
      newExercise.save()
      res.json({ _id, username, date: newdate, duration: parseInt(duration), description })
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const newid = req.params._id;

  var count = 0;
  var log = [];

  if (Object.keys(req.query).length) {
    const { from, to, limit } = req.query;
    Exercise.find({ userId: newid }, { date: { $gte: new Date(from), $lte: new Date(to) } }).select(["userId", "description", 'duration', 'date']).limit(limit).exec((err, data) => {
      if (err) return console.log(err);
      count = data.length
      data.map(item => {
          let date = new Date(item.date).toDateString()
          log.push({ description: item.description, duration: item.duration, date })
        })
        console.log(data)
      res.send({_id:data[0].userId, username:'username', count,log})
    })
  }


  else {
    Users.findOne({ _id: newid }, (err, item) => {
      let username = item.username;
      Exercise.find({ userId: newid }, (err, itemsList) => {
        count = itemsList.length;
        itemsList.map(item => {
          let date = new Date(item.date).toDateString()
          log.push({ description: item.description, duration: item.duration, date })
        })
        res.json({ _id: newid, username, count, log })
      })
    })
  }




})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
