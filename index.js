const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser'); 
const mongoose = require("mongoose");


app.use(cors())
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to database
let myURI = process.env['MONGO-URI'];
var urlShort = mongoose.connect(myURI, { UseNewUrlParser: true, UseUnifiedTopology: true});

//create schema
const xciseSchema = new mongoose.Schema(
  {
  username: {type: String, required: true},
  count: {type: Number, default:0},
  log: [{description: String,
         duration: Number,
         date: Date}],
 
})  

let Xcise = mongoose.model("Xcise", xciseSchema);

app.post("/api/users", async function(req, res){
  var userInput = {
    username: req.body.username,
    };
  
  var user = new Xcise(userInput);
  await user.save();
  
  return res.status(200).json({"username": user.username, "_id": user['_id']});
})

// get all user endpoint
app.get("/api/users", async (req,res) => 
  {var userData = await Xcise.find().select({"username": 1, "_id":1});     
  return res.send(userData);
  });

// Create a user
app.post("/api/users/:_id/exercises", async function(req, res){
  var inputDate;
  if (req.body.date === "") inputDate = new Date(Date.now())
  else inputDate = req.body.date;    
  
 
  var log = {description: req.body.description,
             duration: Number(req.body.duration),
             date: inputDate};

  var userId = req.params["_id"];
  
// update the excercise info.  
  var updateUser = await Xcise.findOneAndUpdate({_id: userId}, {$push: { log: log}, $inc: {count: 1} }, {new: true}, function(err, updateUser){
    if(err) console.log(err)
    else return updateUser});

  var object = {};
  object['username'] = updateUser.username;
  object['_id'] = updateUser.id;
  object['description'] = log.description;
  object['date'] = new Date(log.date).toDateString();
  object['duration'] = log.duration;
  
  

  
  return res.status(200)
            .json({"username":updateUser.username,
                   "_id":updateUser["_id"],  
                   "description":log.description,
                   "date": new Date(log.date).toDateString(),
                   "duration":log.duration
                   
                                                                     })
                 
})

// logs api endpoint
app.get('/api/users/:_id/logs', async function(req, res){
  var showLimit = Number(req.query.limit);
  var fromDate = req.query.from || new Date(0);
  var toDate = req.query.to || new Date(Date.now());

 //console.log(`${fromDate}, ${toDate}`);
  
  /* const logs = await Xcise.find({
      _id: req.params["_id"],
      "log.date": { $gte: fromDate , $lte: toDate }
    })
    .select({"username":1, "count":1, "_id":1, "log":1})
    .limit(showLimit) */ 
    
  var logs = await Xcise.where("_id")
                  .eq(req.params["_id"])
                  .where("log.date")
                  .gte(fromDate)
                  .lte(toDate)
                  .select({"username":1, "count":1, "_id":1, "log":1})
                  .limit(showLimit);
  
  return res.status(200).send(logs)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
