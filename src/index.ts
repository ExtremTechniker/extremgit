import express = require('express');
import cors = require("cors");
import fs = require('fs/promises');
import path = require('path');
import bodyParser = require('body-parser');
import { AddressInfo } from 'net';
import { exec } from "child_process";

require("dotenv").config();

const app = express();
const gitPath = process.env.GIT_HOME_PATH || "/Users/robert/.gitdeploy";

app.use(cors({origin:"*"}))


/* app.options("/createGitRepo", (req, res, next) => {
    res.setHeader("Allow","OPTIONS, POST")
    res.end(`OPTIONS ${req.originalUrl} HTTP/${req.httpVersion}`)
}),
 */

app.post("/gitRepo", bodyParser.json(), async (req, res, next) => {
    
    const { name } = req.body;
    if(!name) return res.json({
        status: "error",
        message: "No Git repo name defined"
    })
    
    try {
        await fs.mkdir(gitPath, {recursive: true});
    } catch (err) {
        if(!(err && err.code == "EEXIST"))
            return next(new Error(err));
    }
    
    try {
        await fs.access(path.join(gitPath,name+".git"))
        return res.json({
            status: "error",
            message: "The git repo name is allready taken."
        })
    } catch (err) {
        if(err && err.code == "ENOENT") {
            try {

                const git = exec("git init --bare "+name+".git", {
                    cwd: path.join(gitPath)
                })

                git.on("close", () => {
                    return res.json({
                        status: "ok",
                        message: "Git Repo initalised"
                    })
                });
                git.on("error", err => {
                    return next(err);
                })

            } catch (err) {
                return next(new Error(err));
            }
        }
    }
})

app.delete("/gitRepo", bodyParser.json(), async (req, res, _next) => {
    const { name } = req.body;
    if(!name) return res.json({
        status: "error",
        message: "No Git repo name defined"
    })
    
    try {
        await fs.access(gitPath);
    } catch (err) {
        return res.json({
            status: "error",
            message: "No gitdeploy directory found"
        })
    }
    
    try {
        await fs.access(path.join(gitPath,name+".git"))
       
        await fs.rmdir(path.join(gitPath,name+".git"), {recursive : true})

        return res.json({
            status: "ok",
            message: "Git Repo deleted"
        })
    } catch (err) {
        return res.json({
            status: "error",
            message: "No Git repo found"
        })
    }
})

function notFound(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.status(404);
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    next(error);
} 
  
function errorHandler(err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : (err.stack ? err.stack.split("\n") : "")
    });
}

app.use(notFound, errorHandler);

const server = app.listen(process.env.PORT || 5000, () => console.log(`Listening on http://localhost:${(server.address() as AddressInfo).port}`))