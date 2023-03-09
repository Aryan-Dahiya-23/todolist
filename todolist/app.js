//jshint esversion:6


const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const dbUrl = "mongodb://127.0.0.1:27017/todolistDB";

const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

mongoose.connect(dbUrl, connectionParams)
  .then(() => {
    console.info("Connected to DB");
  })
  .catch((e) => {
    console.log("error", e);
  });


const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
  name: "Welcome to the todolist"
});

const Item2 = new Item({
  name: "Click + button to add items"
});

const Item3 = new Item({
  name: "click delete to remove item"
});

const defaultItems = [Item1, Item2, Item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved defult items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    });
});

app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundItems) {
      if (foundItems) {
        console.log(foundItems);
        res.render("list", { listTitle: foundItems.name, newListItems: foundItems.items });
      }
      else {
        console.log("Adding " + customListName + " to the list!")
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }

    });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName })
      .then(function (foundlist) {
        foundlist.items.push(item);
        foundlist.save();
        res.redirect("/" + listName);
      });
  }

});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId)
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      });
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(function (foundlist) {
        res.redirect("/" + listName);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
