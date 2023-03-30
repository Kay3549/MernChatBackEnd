import mongoose from 'mongoose'
import { config } from 'dotenv';

config();

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PW}@royalroader.vbztej6.mongodb.net/chatAppMern?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.log(error);
    });