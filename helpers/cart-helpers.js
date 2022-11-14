const db = require('../config/connection')
const collection = require('../config/collection')
//const { response, get } = require('../app')
//const { CART_COLLECTION } = require('../config/collection')
const objectId = require('mongodb').ObjectId
const fmt = require('indian-number-format')

module.exports = {

    addToCart: (prodId, userId) => {
        let prodObject = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let ProdExist = userCart.product.findIndex(product => product.item == prodId)
                if (ProdExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'product.item': objectId(prodId) },
                            {
                                $inc: { 'product.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { product: prodObject }

                            }).then((response) => {
                                resolve()
                            })
                }

                console.log(ProdExist)
            } else {
                console.log(prodId)
                let cartObject = {
                    user: objectId(userId),
                    product: [prodObject]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObject).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTION,
                //         let: {prodList:'$product'},
                //         pipeline:[
                //         {
                //             $match:{
                //                 $expr:{
                //                     $in:[
                //                       '$_id',"$$prodList"
                //                     ]    
                //                 }
                //             }
                //         }
                //         ],
                //         as:'cartItems'
                //     }
                // }

                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            //    console.log(cartItems.product)  refer this difference
            console.log(cartItems)
            if (cartItems.length == 0) {
                resolve()
            } else {
                console.log(cartItems[0].product)
                resolve(cartItems)
            }
        })
    },

    removeFromCart: (prodId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ user: objectId(userId) }, {
                    $pull: { product: { item: objectId(prodId) } }
                }).then((response) => {
                    console.log(response)
                    resolve(response)
                })
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.product.length
                console.log(count)
            }
            resolve(count)
        })
    },
    changeProdQuantity: (details) => {
        details.quantity = parseInt(details.quantity)
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            console.log(details.count, details.quantity)
            if (details.count === -1 && details.quantity === 1) {
                console.log('Now i am here')
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { product: { item: objectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'product.item': objectId(details.product) },
                        {
                            $inc: { 'product.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }

        })
    },
    getTotalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log('hai2')
            let disc = 0
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        // p:'$product.price',
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } },
                        offer: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
                    }
                }
            ]).toArray()
            let coupExist = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId) })
            if(coupExist){
                if (coupExist.setCoup) {
                    let coupdisc = Number(coupExist.coupdisc)
                    console.log(coupdisc,'hai3')
                    disc = Number(100 - (coupdisc)) / 100
                    if (total.length == 0) {
                        resolve(0)
                    } else if (total[0].offer == 0) {
                        totalprice = Number(total[0].total * disc)
                        console.log(totalprice,'hai4')
                        resolve({totalprice,coupdisc})
                    } else {
                        totalprice=Number(total[0].total)
                        offerprice = Number(total[0].offer * disc)
                        console.log(offerprice,'hai5')
                        resolve({totalprice,offerprice,coupdisc})
                    }
                } else {
                    
                    if (total.length == 0) {
                        resolve(0)
                    } else if (total[0].offer == 0) {
                        totalprice=Number(total[0].total)
                        console.log(total,'hai6')
                        resolve({totalprice})
                    } else {
                        totalprice=Number(total[0].total)
                        offerprice=Number(total[0].offer)
                        console.log(total,'hai7')
                        resolve({totalprice,offerprice})
                    }
                    //    console.log(cartItems[0].product)
                }
            } else {
                resolve(0)
            }
            console.log(coupExist,'hai3')
            
        })
    }
}