const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js")

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Aniket:aniket0920@cluster0.moupo.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name : String
};

const newListsSchema = {
  name : String,
  items : [itemsSchema]
};
const newListsNameSchema = {
  name : String
};

const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", newListsSchema);

const Listname = mongoose.model("Listname", newListsNameSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully saved defaultItems to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: day, newListItems: foundItems});
    }

  })

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete-newlist", function(req, res) {

  const checkListId = req.body.checkbox;
  const listName = _.capitalize(req.body.listName);

  Listname.findByIdAndRemove(checkListId, function(err) {
    if(!err) {
      console.log("Successfully deleted new list.");
      res.redirect("/new-list");
    }
  });

  List.findOneAndRemove({name : listName}, function(err, foundList) {
    if(err) {
      console.log(err);
    }
  });

});

app.post("/delete", function(req, res) {

  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === day) {
    Item.findByIdAndRemove(checkItemId, function(err) {
      if(!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  if(req.params.customListName === "new-list"){
    Listname.find({}, function(err, foundListsName) {
      if(err){
        console.log(err);
      } else {
        res.render("newlists", {listTitle: "New Lists", newListItems: foundListsName});
      }
    });
  } else {
    List.findOne({name: customListName}, async function(err, foundList) {
      if(!err){
        if(!foundList){
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          await list.save();
          res.redirect("/" + customListName);
        } else {
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
    });
  }

});

app.post("/add", async function(req, res) {
  const newListTitle = req.body.newItem;

  const listName = new Listname({
    name : newListTitle
  });
  await listName.save()
  res.redirect("/new-list");
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server is running on port 3000...");
});
