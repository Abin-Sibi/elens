var db = require('../config/connection')
var collection = require('../config/collection');
const bcrypt = require('bcrypt')
const { MongoCompatibilityError } = require('mongodb');
//const { response } = require('../app');
const fmt = require('indian-number-format')
var objectId = require('mongodb').ObjectId
module.exports = {
    addProduct: (productData) => {
        return new Promise(async(resolve,reject)=>{
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({name:productData.category})
            let offer = category.offer
            let offerPrice = Number(100 - (offer)) / 100
            productData.price = parseInt(productData.price)
            productData.stock=parseInt(productData.stock)
            productData.offerPrice= parseInt(productData.price * offerPrice)
            console.log(productData)
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData).then((data) => {
                console.log(data)
                resolve(data.insertedId)
            })
        })
    },

    // addProduct: (productData, callback) => {
    //     let offer = await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({name:productData.category})
    //     console.log(productData)
    //     console.log(productData.category)
    //     productData.price = parseInt(productData.price)
    //     productData.stock=parseInt(productData.stock)
    //     productData.offerPrice= parseInt(productData.offerPrice)
    //     // $toInt(productData.price)
    //     console.log(productData)
    //     db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData).then((data) => {
    //         console.log(data)
    //         callback(data.insertedId)
    //     })
    // }

       getAllProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            let wishlist = await db.get().collection(collection.WISH_COLLECTION).findOne({user: objectId(userId)});
            console.log(wishlist);
            let name = []
            if(wishlist) {
                let wishpro = wishlist.product
                product.forEach(element => {
                    element.price=fmt.format(element.price)
                    element._id = element._id.toString()
                    for(j in wishpro) {
                       
                        if(element._id == wishpro[j].item) {
                            element.wishlisted = true;
                        }
                    }
                });
            }
            
            resolve(product)
      })

    },

    getAllProduct: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                    console.log(product)
                    resolve(product)
                })
            
        })
    },
    updateProduct: (productId, productDetails) => {
        var statuss = null
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(productId) }, {
                    $set: {
                        productname: productDetails.productname,
                        category: productDetails.category,
                        desc: productDetails.desc,
                        stock: parseInt(productDetails.stock),
                        price: parseInt(productDetails.price)
                    }
                }).then((response) => {
                    console.log(response)
                    resolve(`successfully edited`)
                })
        })
    },
    changeStatus: function (id) {
        return new Promise(async function (resolve, reject) {
            let product = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            if (product.blocked == true) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                    $set: {
                        blocked: false
                    }
                }).then(() => {
                    resolve("unblocked")
                })
            } else {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                    $set: {
                        blocked: true
                    }
                }).then((response) => {
                    resolve("blocked")
                })
            }
        })
    },

    getCatProducts: (name) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: name }).toArray()
            resolve(product)
        })
    },

    addOffer: (catname, body) => {
        var offer = body
        console.log('reeef', catname, body)
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CATEGORY_COLLECTION).updateOne({name:catname},
                {
                    $set:{offer:offer}
                })
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: catname }).toArray()
            for (var i = 0; i < products.length; i++) {
                var offerPrice = Number(100 - (offer)) / 100
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(products[i]._id) },
                    {
                        $set: { offerPrice: products[i].price * offerPrice }
                    })
            }
            resolve()
        })
    },
    addCoupon:(coupon)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((data)=>{
                resolve(data)
            })
        })
    },
    getCoupon:()=>{
        return new Promise(async(resolve,reject)=>{
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
            resolve(coupon)
        })
    },

    verifyCoupon:(coupon,userId)=>{
        return new Promise(async(resolve,reject)=>{
          let coupExist = await db.get().collection(collection.COUPON_COLLECTION).findOne({couponcode:coupon})
          console.log('hai is here',coupExist)
          if(coupExist){
            fromdate = new Date(coupExist.fromdate);
            todate = new Date(coupExist.todate);
            currentdate = new Date();
            if(currentdate >= fromdate && currentdate <= todate) {
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
            $set:{setCoup:true,coupdisc:coupExist.coupdisc}
           })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                    $set:{setCoup:false,coupdisc:null}
                   })   
            }
           
          }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                $set:{setCoup:false,coupdisc:null}
               })
          }
          console.log('discount ')
          resolve()
        })
    },
    removeCoupon:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                $set:{setCoup:false,coupdisc:null}
            })
            resolve()
        })
    }

}
    // getPrice:()=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let price= await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(_id)})
    //         console.log(price)
    //         resolve(price)
    //     })
        
    // }

// ,

// getPage:()=>{
//     return new Promise((resolve,reject)=>{
//         let users=db.get().collection(collection.USER_COLLECTION).find({
//             $or: [
//                 { name: { $regex: '.' + search + '.', $options: 'i' } },
//                 { category: { $regex: '.' + search + '.', $options: 'i' } },
//             ]
//         })
//             .skip((page - 1) * limit)
//             .limit(limit * 1)
//             .sort({ _id: -1 })
//             .exec()
//     }).then((response)=>{
//         resolve(users)
//     })
// }


// pagination

// var search='';
//     if(req.query.search){
//       search = req.query.search;
//     }

//     {
//         $or:[
//             {productname:{$regex:'.*'+search+'.*'} },
//             {price:{$regex:'.*'+search+'.*'} },
//             {desc:{$regex:'.*'+search+'.*'} }
//         ]
//     }