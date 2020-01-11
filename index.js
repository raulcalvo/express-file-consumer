'use strict';

const requirer = require("../extended-requirer/index.js");
const r = new requirer(__dirname);

const expressSimpleApi = r.require("express-simple-api");
const logger = r.require('logger-to-memory');
const fileconsumer = r.require('file-consumer');
const configLoader = r.require('config-loader-manager');

const mergeJSON = r.require('merge-json');
const busboy = r.require('connect-busboy');
const fs = r.require('fs');
const path = r.require('path');

function getModuleName(){
    return __dirname.split(path.sep).slice(-1)[0];
}

module.exports = class expressfileconsumer{
    constructor(config) {
        this._logger = console;
        var defaultConfig = {};
        defaultConfig[getModuleName()] = {};
        this._config = configLoader.load(__dirname, config, defaultConfig);
        
        this._expressSimpleApi = new expressSimpleApi(config);
        this._consumer = new fileconsumer(config);
        this._expressSimpleApi._express.use(busboy());
        this.addDefaultConsumerPaths();
    }

    getConfig(key){
        return this._config[__dirname.split(path.sep).slice(-1)[0]][key];
    }
    setLogger(logger){
        this._logger = logger;
        this._consumer.setLogger(logger);
        this._expressSimpleApi.setLogger(logger);
    }    

    addDefaultConsumerPaths() {
        var _logger = this._logger;
        this._expressSimpleApi.addGetPath("/upload", "Upload files to process", async (req, res) => {
            var html = " " + fs.readFileSync("upload.html");
            res.send(html);
        });
        var inputFolder = this._consumer.getConfig("inputFolder");
        this._expressSimpleApi.addPostPath('/uploadFile', "Upload simple file", function (req, res) {
            var fstream;
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                _logger.log("Uploading: " + filename);
                fstream = fs.createWriteStream(inputFolder + "/" + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    res.redirect('back');
                });
            });
        });
        this._expressSimpleApi.addGetPath("/results", "Show output directory files in order to allow download them.", (req, res) => {
            //joining path of directory 
            const directoryPath = this._expressSimpleApi.getConfig("outputFolder");
            //passsing directoryPath and callback function
            fs.readdir(directoryPath, function (err, files) {
                //handling error
                if (err) {
                    return _logger.log('Unable to scan directory: ' + err);
                }
                var output = "";
                //listing all files using forEach
                files.forEach(function (file) {
                    output += "<a href='/downloadResultFile?file=" + file + "'>" + file + "</a><br>";
                    // Do whatever you want to do with the file
                    _logger.log(file);
                });
                res.send(output);
            });
        });
    }

    startListening(){
        this._expressSimpleApi.startListening();
    }
}
