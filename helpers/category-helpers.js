const db = require('../config/connection')
const collection = require('../config/collection')
//const { response } = require('../app')
const objectId = require('mongodb').ObjectId

module.exports={
    getAllCategory:(req)=>{
        return new Promise (async(resolve,reject)=>{
            console.log('ggot inside the get__category')
            var categoryList =await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            // console.log(category__list)
            resolve(categoryList)
        })
    },addCategory:(data)=>{
        return new Promise (async(resolve,reject)=>{
            let catexist=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({name:data.name})
            console.log('sadfffghgh',catexist)
            if(catexist){
                resolve('Cant Add Same Category again!!!')
            }else{
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(data).then((response)=>{
                    console.log('got inside the add__category promise ')
                    resolve(response)
                })
            }
           
        })
    },getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((category) => {
                console.log(category)
                resolve(category)
            })
        })
    },
    deleteCategory:(id)=>{
        return new Promise (async(resolve,reject)=>{
            await db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(id)}).then((response)=>{
                resolve('Successfuly deleted the Category')
            })
        })
    },
    // updateProduct: (productId, productDetails) => {
    //     var statuss = null
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collection.PRODUCT_COLLECTION)
    //             .updateOne({ _id: objectId(productId) }, {
    //                 $set: {
    //                     productname: productDetails.productname,
    //                     category:productDetails.category,
    //                     desc: productDetails.desc,
    //                     price: productDetails.price
    //                 }
    //             }).then((response) => {
    //                 console.log(response)
    //                 resolve(`successfully edited`)
    //             })
    //     })
    // }
    updateCategory:(categoryId,categoryList)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(categoryId)},{
                $set:{name:categoryList.name}
            }).then((response)=>{
                resolve(`successfully edited`)
            })
        })
    }
}