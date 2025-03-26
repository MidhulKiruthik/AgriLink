const bcrypt = require("bcryptjs");

bcrypt.hash("your_admin_password", 10, (err, hash) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Hashed Password:", hash);
    }
});
