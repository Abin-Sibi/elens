var db=require('../config/connection')
var collection=require('../config/collection');
const bcrypt=require('bcrypt')
const { MongoCompatibilityError } = require('mongodb');
var objectId = require('mongodb').ObjectId

//const { response } = require('../app');
module.exports={
    doSignup:(userData) => {
        var statuss=null
        return new Promise(async(resolve,reject)=>{
        console.log(userData.password);
        let emailId=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
        if(!emailId){
            userData.blocked=false
            userData.password = await bcrypt.hash(userData.password,10)
            console.log(userData.password)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data);
                
                resolve({statuss:true})
            })
        }else{
            console.log("This email exists")
            resolve({statuss:false})   
        }
    })
    },

    referal: (referalcode) => {
        return new Promise(async (resolve,reject) => {
            await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(referalcode) },
                { $inc: { wallet: 1000 } })
            resolve('success')
        })
    },

    wallet: (userId, total) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            if (user.wallet > (total - 1)) {
                await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                    $inc: { wallet: -total }
                }).then((result) => {
                    if (result.acknowledged) {
                        resolve('success')
                    } else {
                        reject('error')
                    }
                })
            }else{
                reject('Insufficient Balance in your Wallet')
            }
        })
    },

    doLogin:(userData)=>{
        let loginStatus=false
        let isValid=false
            let response={}
        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(!user){
                console.log("login failed")
                resolve({status:false})
            }
            else if(user.blocked==true){
                isValid='userBlocked'
                resolve(isValid)
            }
            else {
                console.log(userData.password)
                console.log(user.password)
                bcrypt.compare(userData.password,user.password).then((status)=>{
                if(status){
                console.log("login success");
                response.user=user
                response.status=true
                resolve(response)
                }else{
                    console.log("login failed")
                    resolve({status:false})
                }
                })
            }
        })
    },

    otpLogin: (userData) => {
        console.log(typeof (userData.phonenumber) + ' phone number that user typed');
        return new Promise(async (resolve, reject) => {
            let userNumber = false
            let number = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: userData.number })
            if (number) {
                resolve({ userNumber: true })
            } else {
                resolve({ userNumber: false })
            }
        })
    },
    verifyOTP: (number) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: number })
            if (user) {
                resolve(user)
            }
      })
    },

    getAllUsers: ({limit,skip}) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).find().limit(limit).skip(skip).toArray()
            resolve(user)
        })
    },
    
    
    
    getUserProfile:(userId)=>{
        return new Promise(async(resolve,reject) => {
            let profile=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            console.log(profile)
            resolve(profile)
        })
    },

    addAddress:(address,userId)=>{
        return new Promise(async(resolve,reject)=>{
            address.userId=userId
         db.get().collection(collection.ADDRESS_COLLECTION).insertOne(address).then((response)=>{
            console.log('wooow')
            console.log(address)
            console.log(response)
            resolve(response)
         })
        })
    },

    getAddress:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let address= await db.get().collection(collection.ADDRESS_COLLECTION).find({userId:userId}).toArray()
            console.log(address)
            resolve(address)
        })
    },
    getAddressDetails: (addressId) => {
        return new Promise((resolve, reject) => {
            console.log('123456')
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: objectId(addressId) }).then((address) => {
                resolve(address)
            })
        })
    },
    // editAddress:(userId,body)=>{
    //     return new Promise((resolve,reject)=>{
    //         db.get().collection(collection.ADDRESS_COLLECTION).
    //         updateOne({_id:objectId(userId)},{
    //             $set:{
    //                 address:body.address
    //             }
    //         }).then((response)=>{
    //             resolve('successfully edited')
    //         })
    //     })
    // },

    deleteAddress:(addressId)=>{
        return new Promise((resolve,reject)=>{
            
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(addressId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    changePassword:(userId,newPassword)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne(
                {_id:objectId(userId)},
                {
                    $set:{
                        password:await bcrypt.hash(newPassword,10),
                    }
                }
            ).then((response)=>{
                resolve()
            })
        })
    },
    getMaxStock: (productId) => {
        return new Promise(async (resolve, reject) => {
            // let stock= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate({$match:{_id:ObjectID(productId)}},
            // { $project:{_id:0,stock:1}}

            let stock = await db.get().collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: objectId(productId) });
            // ).toArray()
            console.log("stock", stock);
            resolve(stock);
        });
    },
    search:(val) => {
       
        return new Promise(async (resolve, reject) => {
          try {
      
          let data = await db.get().collection(collection.PRODUCT_COLLECTION).find({productname:{$regex: new RegExp('^'+val+'.*','i')} }).toArray()
         
       
          resolve(data);
         
             
        } catch (error) {
            
        }
    })
      },
  
   totUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        var totalUsers = await db.get().collection(collection.USER_COLLECTION).count();
        resolve(totalUsers)
    })
   },
   totProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        var totalProducts = await db.get().collection(collection.PRODUCT_COLLECTION).count();
        resolve(totalProducts)
    })
   },

   totOrders:()=>{
    return new Promise(async(resolve,reject)=>{
        var totalOrders = await db.get().collection(collection.ORDER_COLLECTION).count();
        resolve(totalOrders)
    })
   }
}