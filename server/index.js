import express from "express";
import cors from "cors"; 
import mysql from "mysql2/promise";

const server = express();


server.get ("/", (req,res)=> {                  // "This code tells the server what to do when someone visits the home page."
  res.send ("The server is running ")
})

server.listen (4000, ()=>{
  console.log ("Server is listening at port 4000 ...")
})