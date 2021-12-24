//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:chakshu7@todolistazure.ix3ay.mongodb.net/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Your todolist!"
});

const item2 = new Item({
  name: "<-- Hit this button to delete an item."
});

const item3 = new Item({
  name: "Hit the + button to add a new item."
});

const defaultItems = [item1, item2, item3];
const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, function(err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Inserted the default items");
        }
      });
      res.redirect("/");
    } else {
      const day = date.getDate();
      res.render("list", {
        listTitle: day,
        newListItems: results
      });
    }

  });
});

app.post("/", function(req, res) {

  const itemname = req.body.newItem;
  const listname = req.body.list;
  const item = new Item({
    name: itemname
  });
  if (listname === date.getDate()) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listname},function(err,foundlist){
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/"+listname);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName=req.body.listname;

  if(listName === date.getDate()){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id: checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/:listName", function(req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({
    name: listName
  }, function(err, results) {
    if (!err) {
      if (!results) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: listName,
          newListItems: results.items
        });
      }
    }
  });


});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(4000, function() {
  console.log("Server started on port 4000");
});
