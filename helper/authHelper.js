const bcrypt = require("bcrypt");

const hashpassword = async(password) => {
    try{
        const SaltRounds=10;
        const hashed = await bcrypt.hash(password,SaltRounds);
        return hashed;
    }catch(error){
        console.log(error);
    }
}

const compare = async(password,hashed) => {
    return bcrypt.compare(password,hashed);
}

module.exports = {hashpassword,compare};