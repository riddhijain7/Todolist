const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()
const _ = require('lodash')
const date = require(__dirname + "/date.js")

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


mongoose.connect("process.env.MONGODB_URI", { useNewUrlParser: true });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
    name: "Welcome to your list"
});
const item2 = new Item({
    name: "hit the + button to add a new item"
});
const item3 = new Item({
    name: "Now you can start"
});

const defaultItems = [item1, item2, item3]

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

let day = date.getDate();

// const items = ["Buy Food", "Eat Food"];
// const workItems = [];

app.get("/", async function (req, res) {
    let foundItems = [];

    foundItems = await Item.find({});
    // console.log(foundItems);

    if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
            .then(result => {
                console.log("Successfully added the document");
            })
            .catch(err => {
                console.log(err);
            });
        res.redirect("/");
    } else {
        res.render("list", {
            listTitle: day,
            newListItems: foundItems
        });
    }



});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then(foundList => {
            if (!foundList) {
                // console.log("Doesn't Exist");

                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName)

            } else {
                // console.log("Exists!");
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                })
            }
        })
        .catch(err => console.log(err));
});


app.post("/", function (req, res) {

    let itemName = req.body.newItem;
    let listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === day) {
        item.save();
        res.redirect("/")
    } 
    else {
        List.findOne({ name: listName })
            .then(foundList => {
                if (foundList) {
                    foundList.items.push(item);
                    foundList.save();
                    res.redirect("/" + listName)
                }
            })
            .catch(err => {
                console.log(err);
                res.redirect("/");
            });
    }


    // if (req.body.list === "Work") {
    //     workItems.push(item);
    //     res.redirect("/work");
    // }
    // else {
    //     items.push(item);
    //     res.redirect("/");
    // }

});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === day) {
        Item.findByIdAndRemove(checkedItemId)
            .then(result => {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
            .then(foundList => {
                res.redirect("/" + listName)
            })


    }

});

// app.get("/work", function (req, res) {
//     res.render("list", {
//         listTitle: "Work List",
//         newListItems: workItems
//     })
// })

// app.post("/work", function (req, res) {
//     let item = req.body.newItem
//     workItems.push(item);
//     res.redirect("/work");
// })



app.get("/about", function (req, res) {
    res.render("about");
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});