const db = require('../config/connection')
const collection = require('../config/collection')
//const { response, get } = require('../app')
//const { CART_COLLECTION } = require('../config/collection')
const objectId = require('mongodb').ObjectId
const Razorpay=require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_bwpnuyv9GlsW4W',
    key_secret: '6Oxi7InqxBxcRE0qRprOmuiN',
  });
  

module.exports={
    placeOrder:(order,product,total)=>{
      return new Promise((resolve,reject)=>{
      
      let status = order['payment-mode']=== 'COD'||order['payment-mode']=== 'paypal'||order['payment-mode']=== 'wallet'?'Placed':'Pending'
      var today=new Date()
      let orderObj={
        deliveryDetails:{
            address:order.address,
            pin:order.pin,
            city:order.city
            },
        userId:objectId(order.userId),
        paymentMode:order['payment-mode'],
        product:product,
        totalAmount:total,
        status:status,
        cancelled:false,
        do:false,
        date:today
      }
      
        db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
            product.forEach(async element => {
                console.log(element,"products")
                console.log();
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id: element.item});
                let pquantity = Number(product.stock);
                pquantity = pquantity - element.quantity
                await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id: element.item}, {
                    $set:{
                        stock: pquantity
                         }
                })
           })
            db.get().collection(collection.CART_COLLECTION).deleteOne({user: orderObj.userId})
            console.log('this is it    '+response.insertedId)
            resolve(response.insertedId)
          })
      
   
    })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
      let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
      console.log(cart)
      if(cart){
        resolve(cart.product)
      }else{
        resolve(0)
      }
        })
    },

    // showOrders:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let myorder= await db.get().collection(collection.ORDER_COLLECTION).aggregate(
    //             [
    //                 {
    //                     $match:{userId:objectId(userId)}
    //                   },
    //               {
    //                 $project: {

    //                    date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
    //                    //status:status,
    //                    totalAmount:totalAmount,
    //                    paymentMode:paymentMode,
    //                    _id:_id
    //                 }
    //               }
    //             ]
    //          )
    //         resolve(myorder)
    //     })
    // },

    showOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let myorder= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).sort({$natural:-1}).toArray()
            // myorder.forEach(element => {
            //     var today=element.date
            //     console.log('this is date',today)
            //     // var dd = String(today.getDate()).padStart(2, '0');
            //     var mm = String(today.getMonth() + 1).padStart(2, '0'); 
            //     var yyyy = today.getFullYear();
            //     console.log('this is date',mm)
            //     console.log('this is date',yyyy)
            //     // today = mm + '-' + dd + '-' + yyyy;
            //     element.date = today;
            //   });
            console.log(myorder)
            resolve(myorder)
        })
    },

    showOrder:()=>{
        return new Promise(async(resolve,reject)=>{
            let myorder= await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            console.log(myorder)
            resolve(myorder)
        })
    },
    updateStatus:(body,details)=>{
         let {status}= body
         console.log(status)
        return new Promise((resolve,reject)=>{
            if(status=='delivered'||status=='cancelled'){
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details)},
            {
                
                $set:{
                    do:true,
                    status:status
                }
            }).then((response)=>{
                console.log('hqqqqqhhhh')
                resolve()
                console.log('hhrrrrrrrrhh')
            })
            }else{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details)},
                {
                    
                    $set:{
                        status:status
                    }
                }).then((response)=>{
                    console.log('second')
                    resolve()
                    console.log('2second')
                }) 
            }
           
        })
    },

    getUserOrder:(orderId)=>{
        return new Promise(async (resolve,reject)=>{
           let myorder= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
              $match:{_id:objectId(orderId)}
            },
            {
                $unwind:'$product'
            },
            {
                $project:{
                    item:'$product.item',
                    quantity:'$product.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                     as:'product'
                }
            },

            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
           ]).toArray()
        //    console.log(cartItems.product)  refer this difference
           console.log('ljhgdfkjhgfhdf',myorder)
           if(myorder.length==0){
            resolve()
           }else{
            resolve(myorder)
           }
        })
    },


    getOrderDetails:(id)=>{
            return new Promise(async (resolve, reject) => {
                let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id:objectId(id)}
                    },
                    {
                        $lookup:{
                            from:collection.USER_COLLECTION,
                            localField:'userId',
                            foreignField:'_id',
                            as:'user'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'product.item',
                            foreignField:'_id',
                            as:'orderdetail'
                        }
                    },
                    {
                        $unwind:'$orderdetail'
                    },
                    
                    {
                        $unwind:'$user'
                    },
                    {
                        $project:{
                            id:'$orderdetail._id',
                            name:'$orderdetail.productname',      
                            totalAmount:'$orderdetail.price',
                            // ordercanceled:'$orders.ordercanceled',
                            city:'$deliveryDetails.city',
                            address:'$deliveryDetails.address',
                            pincode:'$deliveryDetails.pin',
                            status:'$status',
                            discountPrice:'$orderdetail.offerPrice',
                            payment:'$paymentMode',
                            category:'$orderdetail.category',
                            image:'$orderdetail._id',
                            email:'$user.email',
                            Nameuser:'$user.name'
                        }
                    }
                ]).toArray()
                console.log(order);
                resolve(order)
            })
        } ,
 



    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount:Number(total*100),
                currency:"INR",
                receipt:""+orderId
            }
            instance.orders.create(options,function(err,order){
               if(err){
                console.log(err)
               }else{
                console.log(order)
                resolve(order)
               }
            })
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
         const crypto = require('crypto')
         let hmac = crypto.createHmac('sha256', '6Oxi7InqxBxcRE0qRprOmuiN');
         hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
         hmac=hmac.digest('hex')
         if(hmac==details['payment[razorpay_signature]']){
            resolve()
         }else{
            reject()
         }
        })
    },

    // generatePaypal: (orderId, totalPrice) => {
    //     parseInt(totalPrice).toFixed(2)
    //     // console.log(totalPrice);
    //     return new Promise(async (resolve, reject) => {
    //         const create_payment_json = {
    //             "intent": "sale",
    //             "payer": {
    //                 "payment_method": "paypal"
    //             },
    //             "redirect_urls": {
    //                 "return_url": "http://localhost:3000/success",
    //                 "cancel_url": "http://localhost:3000/cancel"
    //             },
    //             "transactions": [{
    //                 "item_list": {
    //                     "items": [{
    //                         "name": "Red Sox Hat",
    //                         "sku": "001",
    //                         "price": totalPrice,
    //                         "currency": "USD",
    //                         "quantity": 1
    //                     }]
    //                 },
    //                 "amount": {
    //                     "currency": "USD",
    //                     "total": totalPrice
    //                 },
    //                 "description": "Hat "
    //             }]
    //         };

    //         let data = paypal.payment.create(create_payment_json, function (error, payment) {
    //             if (error) {
    //                 console.log(error, 'error ahda kuta');
    //                 throw error;
    //             } else {
    //                 console.log('payment ayiiii');
    //                 resolve(payment)
    //             }
    //         })

    //     })
    // },
    
    getOrderCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0

            let order= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            
            if(order){
               count=order.length
               console.log('this is order count',count)
            }
            let status=order[count-1].status
            let total = order[count-1].totalAmount
            console.log('this status',total)
            resolve(total)
        })
    },


    changePaymentStatus:(orderId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
      })
    },
    cancelOrder: (orderId)=> {
        return new Promise(function(resolve, reject) {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},{
                $set:{
                    status:"cancelled",
                    do:true,
                    cancelled:true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    }
}