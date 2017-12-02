// server.js
// where your node app starts

// init project
const express = require('express');
const fileUpload = require('express-fileupload');
const yaml = require('js-yaml')
const XLSX = require('xlsx')
const SHA512 = require('js-sha512')
const app = express();
app.use(fileUpload())



app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// Just the one endpoint, and no real validation - this is just a simple tool
// for the good Dr Bray to use 
app.post("/fileupload", function (request, response) {

  // load the files,it's super important NOT to load the excel doc to any temp folder
  // since it might contain personal information. By loading it into memory we ensure that
  // should the process crash, nothing will be left hanging about on any server
  let config = yaml.load(request.files.configFile.data)
  let workbook = XLSX.read(request.files.workFile.data, {type:'buffer'});
  
  //apply each translation
  for (var t in config.translations) {
    const translation = config.translations[t]
    const sheet = workbook.Sheets[translation.sheet]
    // but only if the sheet exists
    if (sheet) {
      // if the requested first row is valid, we start from there, otherwise we
      // start from 1 
      var row = translation.from_row >= 1 ? translation.from_row : 1

      // the first key column is where the hash will be written
      const target_key = translation.key[0]

      // we keep going until we find an empty target key 
      var no_vals = false
      while(!no_vals) {
        //build the key and salt it if requested
        var hash = SHA512.create();
        if(config.salt) {
          hash.update(config.salt)
        }
        
        // build up the hash 
        for (var k in translation.key) {
          const key = translation.key[k]        
          const cell_value = sheet[key+row]
          if (cell_value) {
            hash.update(cell_value.v)    
            if (translation.hide.indexOf(key)!= -1) {
              sheet[key+row].v = ''
            }
          } else {
            if(target_key == key) {
              no_vals =true  
            }
          }
        }
        

        
        // write the hash
        if (!no_vals) {
          sheet[target_key + row].v = hash.hex()
        }
        row++
      }
      
    }
  }
  
  //now, finally, write out the file
  var fileName = "secret."+request.files.workFile.name;
  response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
  response.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  var wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer'});
   response.send(new Buffer(wbout));
  
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
