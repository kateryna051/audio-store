const dotenv = require('dotenv');
dotenv.config({path: './config.env'});
const mongoose = require('mongoose');
process.env.NODE_ENV = 'production';

process.on('uncaughtException', (err) => {
    console.log(err.name, err.message);
    console.log('Uncaught Exception occured! Shutting down...',err);
        process.exit(1);
  })

const app = require('./my');
console.log(app);
console.log(process.env);

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true
}).then((conn) => {
   console.log('DB Connection Succesful');
});


const port = process.env.PORT || 80;

app.listen(80, () => {
    console.log('Server is running on http://84.32.214.42:80');
  });


process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('Unhandled rejection occured! Shutting down...');

    server.close(() =>{
        process.exit(1);
  })
})
