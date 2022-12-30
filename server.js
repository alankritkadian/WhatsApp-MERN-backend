//importing
import express from "express"
import mongoose from "mongoose"
import Messages from "./dbMessages.js"
mongoose.set('strictQuery', false);
import Pusher from 'pusher'

//app config
const app = express()
const port = process.env.PORT || 9000
const pusher = new Pusher({
    appId: "1531423",
    key: "b87f4dfd3c599a718fc9",
    secret: "c38251fa59a76ee9da44",
    cluster: "ap2",
    useTLS: true
  });
  
//middleware
app.use(express.json())
app.use((req,res,next)=>{
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Headers","*");
    next();
})
//DB config
import { MongoClient, ServerApiVersion } from 'mongodb'
const connection_url = 'mongodb+srv://alankritkadian:ZRc6z3u5a7xaWSu8@cluster0.nsrnloq.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(connection_url,{ useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

const db = mongoose.connection
db.once('open',()=>{
    console.log('DB is connected')

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change',(change)=>{
        console.log('change')
        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',{
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        }else{
            console.log('Error triggering pusher')
        }
    })
})
 
//api routes
app.get('/',(req,res)=>res.status(200).send('hello world'))

app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req,res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err,data)=>{
        if(err) {
            res.status(500).send(err)
        }
        else{
            res.status(201).send(data)
        }
    })
})

//listen
app.listen(port,()=>console.log(`listening on Localhost:${port}`))