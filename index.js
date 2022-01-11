const express = require("express");
const session = require("express-session");
const { render } = require("express/lib/response");
const mongo = require("mongodb");

const app = express();

const uri="mongodb+srv://root:root123@cluster0.jr906.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new mongo.MongoClient(uri);

let db = null;
let message_result=[];

client.connect(async function (err) {
    if(err){
        console.log("連線失敗",err);
        return;
    }
    db = client.db("meaasge-system");
    console.log("資料庫連線成功");
    
});

app.use(session({
    secret:'secret',
    saveUninitialized:false,
    resave:true
}));

app.set('view engine',"ejs");
app.set("views","./views");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

app.get("/",async function(req,res){
    let collection = db.collection("message");
    
    message_result = await collection.find({}).toArray();

    // console.log(message_result);
    
    res.render("index.ejs",{message_list:message_result})
});
app.get("/add_message",async function (req,res) {
    const name = req.query.name;
    const message = req.query.message;
    const date = new Date();
    let date_object={year:date.getFullYear(),month:date.getMonth()+1,day:date.getDate()
                    ,hours:date.getHours(),minutes:date.getMinutes(),seconds:date.getSeconds()
                    };
    if(name!==undefined && message!==undefined && name!=="" && message!==""){
        let collection = db.collection("message");
        let result = await collection.insertOne({
            name:name,
            message:message,
            date:date_object
        });
        
        if(result.acknowledged===true){
            res.redirect("/");
        }
        
    }else{
        res.redirect("/error");
    }
});
app.get("/clear",function (req,res) {
    let clear_item = req.query.clear_item; 
    
    let msg_copy = message_result;
    
    message_result.forEach(function(element,index){
        if (element._id.toString() === clear_item){
            
            msg_copy.splice(index,1);
        }
    });

    message_result = msg_copy;
    res.render("index.ejs",{message_list:message_result})
})
app.get("/delete",async function (req,res) {
    let delete_item = mongo.ObjectId (req.query.delete_item); 

    let collection = db.collection("message");
    let delete_result = await collection.deleteOne({
        _id:delete_item
    });
    //onsole.log("delete:"+delete_result.acknowledged);
    if(delete_result.acknowledged === true){
        let msg_copy = message_result;
    
        message_result.forEach(function(element,index){
            if (element._id.toString() === delete_item.toString()){
                
                msg_copy.splice(index,1);
            }
        });

        message_result = msg_copy;


        res.render("index.ejs",{message_list:message_result})
    }else{
        res.render("deleted_error.ejs");
    }
    
});
app.get("/error",function (req,res) {
    res.render("error.ejs");
});
app.listen(3000,function() {console.log("Server started"); 
});