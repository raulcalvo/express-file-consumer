'use strict';

const expressSimpleApi = require("express-simple-api");
const logger = require('logger-to-memory');
const mergeJSON = require('merge-json');
const busboy = require('connect-busboy');
const fileconsumer = require('file-consumer');
const fs = require('fs');

module.exports = class expressfileconsumer extends expressSimpleApi {
    constructor(config) {
        var defaultConfig = {
            consumer: {
                inputFolder: "./input",
                outputFolder: "./output",
                watch: true,
                afterProcessPolicy: 2
            },
            logger: console
        };
        var localConfig = mergeJSON.merge(defaultConfig, config);
        super(localConfig);
        this._consumer = new fileconsumer(this._c);
        this._express.use(busboy());
        this.addDefaultConsumerPaths();
    }

    addDefaultConsumerPaths() {
        this.addGetPath("/upload", "Upload files to process", async (req, res) => {
            var html = " " + fs.readFileSync("upload.html");
            res.send(html);
        });
        var inputFolder = this._c.consumer.inputFolder;
        this.addPostPath('/uploadFile', "Upload simple file", function (req, res) {
            var fstream;
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                console.log("Uploading: " + filename);
                fstream = fs.createWriteStream(inputFolder + "/" + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    res.redirect('back');
                });
            });
        });
        addPath("/results", "Show output directory files in order to allow download them.", (req, res) => {
            //joining path of directory 
            const directoryPath = this._c.consumer.outputFolder;
            //passsing directoryPath and callback function
            fs.readdir(directoryPath, function (err, files) {
                //handling error
                if (err) {
                    return console.log('Unable to scan directory: ' + err);
                }
                var output = "";
                //listing all files using forEach
                files.forEach(function (file) {
                    output += "<a href='/downloadResultFile?file=" + file + "'>" + file + "</a><br>";
                    // Do whatever you want to do with the file
                    console.log(file);
                });
                res.send(output);
            });
        });


    }
}
