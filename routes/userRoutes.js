import User from '../models/User.js'
import { Router } from 'express';

const router = Router();

router.post('/',async(req, res)=>{
    try{
        const {name, email,password,picture} = req.body;
        console.log(req.body);
        const user= await User.create({name, email,password,picture});
        res.status(201).json(user);
    }catch(e){
        let msg;
        if(e.code ==11000){
            msg = "User already exists";
        }else{
            msg = e.message;
        }
        console.log(e);
        res.status(400).json(msg);
    }
})


router.post('/login',async(req, res)=>{
    try{
        const {email,password} = req.body;
        const user= await User.findByCredentials(email,password);
        user.status = 'online';
        await user.save();
        res.status(201).json(user);
    }catch(e){
        res.status(400).json(e.message);
    }
})

export default router;