const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please, enter your name.']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email.'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: String,
    role:{
        type: String,
        enum: ['user','admin'],
        default: 'user'
    },
    password:{
        type: String,
        required:[true, 'Please enter your password.'],
        minlength: 8,
        select: false
    },
    confirmPassword:{
        type: String,
        //required:[true, 'confirm your password'],
        /*validate:{
            validator:function(val){
                return val == this.password;
            },
            message: 'Password & Confirm Password does not match!'
        }*/
        },
        active:{
            type: Boolean,
            default:true,
            select: false
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date
})

UserSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();

    //encrypt the password before saving it
    this.password = await bcrypt.hash(this.password, 12);

    this.confirmPassword = undefined;
    next();
})

UserSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}});
    next();
})

UserSchema.methods.comparePasswordInDb = async function(pswd,pswdDB){
    return await bcrypt.compare(pswd, pswdDB);
}

UserSchema.methods.isPasswordChanged = async function(JWTTimestamp){
     if(this.passwordChangedAt){
        const pswdChangedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000, 10);
           console.log(this.passwordChangedAt, JWTTimestamp);

           return JWTTimestamp < pswdChangedTimestamp;
     }
     return false;
}

UserSchema.methods.createResetPasswordToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10*60*1000;

    console.log(resetToken, this.passwordResetToken);

    return resetToken;
}
const User = mongoose.model('User', UserSchema);

module.exports = User;