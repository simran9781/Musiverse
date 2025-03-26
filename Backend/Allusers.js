const express = require("express");
const { MongoClient } = require("mongodb");
const bodyparser = require("body-parser");
const app = express();
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());
const uri = "mongodb://localhost:27017"; 
const dbName = "music_player"; 
const collectionName = "User";

app.get("/all-users", async (req, res) => {
  const client = new MongoClient(uri);
    try {
      await client.connect();
      const db = client.db(dbName);
      const Usercollection = db.collection(collectionName);
      const users = await Usercollection.find({}).toArray();
      res.status(200).json(users);
    } catch (err) {
      console.error("Error fetching tracks:", err);
      res.status(500).send({ msg: "Failed to fetch users." });
    }finally {

      await client.close();
    }
  });

module.exports = { app };

