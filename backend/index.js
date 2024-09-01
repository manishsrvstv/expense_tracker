import { ApolloServer } from "@apollo/server";
// import { startStandaloneServer } from "@apollo/server/standalone";
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';

import dotenv from "dotenv";

import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";
import { configurePassport } from "./passport/passport.config.js";

import { buildContext } from "graphql-passport";

dotenv.config();
configurePassport();
const app=express();


const httpServer = http.createServer(app);

const MongoDBStore=connectMongo(session);

const store=new MongoDBStore({
    uri:process.env.MONGO_URI,
    collection:"session",
});

store.on("error",(err)=>console.log(err));

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false, // this option specifies whether to save the session to the store on every request
		saveUninitialized: false, // option specifies whether to save uninitialized sessions
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			httpOnly: true, // this option prevents the Cross-Site Scripting (XSS) attacks
		},
		store: store,
	})
);

app.use(passport.initialize());
app.use(passport.session());



import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";
import { connectDB } from "./db/connectDB.js";


const server=new ApolloServer({
    typeDefs:mergedTypeDefs,
    resolvers:mergedResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
    '/',
    cors({
        origin:"http://localhost:4000/",
        credentials:true,
    }),
    express.json(),
    // expressMiddleware accepts the same arguments:
    // an Apollo Server instance and optional configuration options
    expressMiddleware(server, {
      context: async ({ req,res }) =>buildContext ({ req,res}),
    }),
  );
  
  // Modified server startup
  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
await connectDB();

// const {url} =await startStandaloneServer(server);
console.log(`🚀 Server ready at http://localhost:4000/`);

// console.log(`server ready at ${url}`);