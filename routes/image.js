const fs = require('fs');
const db = require('../database/connection');

function postImages(username, images){
    this.username = username,
    this.images = images,
    this.bad_image = 1;

    this.check = function() {
        let x = 0;
        while (images[x])
        {
            let split = this.images[x].mimetype.split('/');
            let extension = split[1];

            if (extension == "jpeg" || extension == "png" || extension == "PNG" || extension == "jpg")
            {
                this.bad_image = 0;
                break;
            }
            x++;
        }
    }
    this.post = function() {
        var x = 0;
        console.log(images);
        while (images[x])
        {
            let split = this.images[x].mimetype.split('/');
            let extension = split[1];
            
            console.log("path"+this.images[x].path);
            let img = this.images[x].path+"."+extension;
            fs.rename(this.images[x].path, img, function(err) {
                if (err)
                {
                    console.log(err);
                }
            });
            db.query("INSERT INTO users (profile_pic) VALUES (?)", [this.username, img], function(err) {
                if (err)
                {
                    console.log(err);
                }
            });
            x++;
        }
    }
}

module.exports = postImages;