var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers')
const cartHelpers = require('../helpers/cart-helpers')
const orderHelpers = require('../helpers/order-helpers')
const wishHelpers = require('../helpers/wish-helpers')
const fmt = require('indian-number-format')
require('dotenv').config()
var db = require('../config/connection')
var collection = require('../config/collection');
const { MongoCompatibilityError } = require('mongodb');
var objectId = require('mongodb').ObjectId
const configTwilio = require('../config/twilio');
const client = require('twilio')(configTwilio.accountSID, configTwilio.authToken)
let phone;
let countryCode = '+91'
//const { render, response } = require('../app');
const e = require('express');

const verifyLogin = (req, res, next) => {
  console.log("inside hiii");
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/user-login')
  }
}

// const { default: messagebird } = require('messagebird/types');
/* GET home page. */
var signupErr = null
var statuss = null
var otpNumberErr = null

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

router.get('/', async function (req, res, next) {
  console.log('hi abin');
  let user = req?.session?.user
  let category = await categoryHelpers.getAllCategory()
  let newProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ $natural: -1 }).limit(8).toArray();
  console.log('nghh', newProducts)
  productHelpers.getAllProduct().then((product) => {
    console.log(req.body);
    console.log('user1');
    res.render('user/user-launch', { product, newProducts, category });
  })
});


router.get('/user-login', (req, res) => {

  if (req.session.loggedIn) {
    res.redirect('/user-home')
  } else {
    res.render('user/user-login', { "loginErr": req.session.loginErr })
    req.session.loginErr = false
  }
})

router.get('/user-signup', (req, res) => {
  if (req.session.loggedIn) {
    let user = req.session.user
    res.redirect('/user-home')
  } else {
    res.render('user/user-signup', { signupErr })
    signupErr = null
  }

})

router.post('/signup', (req, res) => {
  console.log(req.body);
  if (req.body.referal != '') {
    userHelpers.referal(req.body.referal).then((result) => {

    })
  }

  userHelpers.doSignup(req.body).then((response) => {
    console.log(response)
    if (response.statuss) {
      console.log('IIII')
      res.redirect('/user-login')
    } else {

      signupErr = "The email-Id already exists!!"
      console.log('OOOO')
      res.redirect('/user-signup')
    }
  })
})

router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response == 'userBlocked') {
      req.session.loginErr = "Your account has blocked by Admin"
      res.redirect('/user-login')
    }
    else if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      console.log('user');
      productHelpers.getAllProducts().then((product) => {
        console.log(req.body);
        console.log('user1');
        res.redirect('/user-home')
      })
    } else {
      req.session.loginErr = "Invalid username or password"
      res.redirect('/user-login')
    }
  })
})



router.get('/user-home', async (req, res) => {

  if (req.session.loggedIn) {
    // let price= await productHelpers.getPrice()
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    let category = await categoryHelpers.getAllCategory()
    console.log("12345")
    console.log(category)
    productHelpers.getAllProducts(req.session.user._id).then((product) => {
      product.forEach(element => {
        element.offerPrice = fmt.format(element.offerPrice)
        if (element.offerPrice == element.price) {
          element.offerPrice = null;
        }
      });
      res.render('user/user-home', { product, cartCount,user:true, category })
    })

  } else {
    res.redirect('/user-login')
  }

})
    
router.get('/otp-login', (req, res) => {

  if (req.session.loggedIn) {
    res.redirect('/user-home')
  } else {
    console.log('qwert')
    res.render('user/otp-login', { otpNumberErr })
    otpNumberErr = null
  }
})

router.get('/verifyotp', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/user-home')
  } else {
    res.render('user/verifyotp', { otpErr: req.session.otpErr })
    req.session.otpErr = false
  }
})

// OTP login

router.post('/otplogin', (req, res) => {
  phone = req.body.number;
  console.log(`country : ${countryCode} phone :${phone}`);

  userHelpers.otpLogin(req.body).then((response) => {
    if (response.userNumber) {
      client
        .verify
        .services(configTwilio.serviceID)
        .verifications
        .create({
          to: `${countryCode}${phone}`,
          channel: "sms"
        })
        .then((data) => {
          console.log(data);
          res.redirect('/verifyotp')
        })
    } else {
      otpNumberErr = "phone number not exist"
      res.redirect('/otp-login')
    }
  })
})

// Veryfiy OTP

router.post('/verifyotp', (req, res) => {
  userHelpers.verifyOTP(phone).then((response) => {
    if (response.blocked) {
      req.session.otpErr = "Your account has blocked by Admin"
      res.redirect('/verifyotp')
    } else {
      client
        .verify
        .services(configTwilio.serviceID)
        .verificationChecks
        .create({
          to: `${countryCode}${phone}`,
          code: req.body.otp
        })
        .then((data) => {
          console.log(data);
          if (data.valid) {
            req.session.loggedIn = true
            req.session.user = response
            res.redirect('/user-home')
          } else {
            req.session.otpErr = true
            res.redirect('/verifyotp')
          }
        })
    }

  })
})


// router.use(verifyLogin)

router.get('/user-profile', verifyLogin, async (req, res) => {
  console.log('hellooo')
  let profile = await userHelpers.getUserProfile(req.session.user._id)
  let address = await userHelpers.getAddress(req.session.user._id)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  console.log(profile)

  res.render('user/user-profile', { profile, user: req.session.user, address, cartCount })
})


router.post('/user-address', verifyLogin, (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id).then((response) => {
    res.redirect('/user-profile')
  })
})

router.post('/new-address', verifyLogin, (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id).then((response) => {
    res.redirect('/checkout')
  })
})

// router.get('/edit-address/:id', verifyLogin, async (req, res) => {
//   let userId = req.session.user._id
//   console.log(userId)
//   console.log('12')
//   let userAddress = await userHelpers.getAddressDetails(userId)
//   let cartCount = await cartHelpers.getCartCount(req.session.user._id)
//   console.log('1234')
//   console.log(userAddress)
//   res.render('user/edit-address', { userAddress, user: req.session.user, cartCount })
// })

// router.post('/edit-address/:id', verifyLogin, async (req, res) => {
//   let cartCount = await cartHelpers.getCartCount(req.session.user._id)
//   let userId = req.session.user._id
//   let body = req.body
//   userHelpers.editAddress(userId, body).then(() => {
//     res.redirect('/user-profile', { cartCount })
//   })
// })


router.get('/delete-address/:id', verifyLogin, (req, res) => {
  console.log('qweerttyuui')
  let userId = req.session.user._id
  console.log(userId)
  userHelpers.deleteAddress(req.params.id).then((response) => {
    res.redirect('/user-profile')
  })
})

router.get('/view-product/:id', verifyLogin, async (req, res) => {
  console.log('req.params.id')
  let id = req.params.id
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  console.log('req.params.id')
  productHelpers.getProductDetails(id).then((product) => {
    console.log('product')
    res.render('user/view-product', { product, cartCount,user:true })
    signupErr = null
  }).
    catch((err) => {
      console.log('hereeeeebug')
      res.redirect('/error')
    })


})

/////////////////////wish////////////////


router.get('/wish-list', verifyLogin, async (req, res) => {
  let person = req.session.user
  let product = await wishHelpers.getWishListProducts(req.session.user._id)
  res.render('user/wishlist', { user: true, product, person })
})

// Product add to wishlist

router.get('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  wishHelpers.addToWishlist(req.params.id, req.session.user._id).then((wishlist) => {
    if (wishlist.length > 0) {
      if (resp.wishlist) {
        console.log('jhjhjhjhhjhj')
        res.json({ status: true, wishlist: true })

      } else {
        res.json({ status: true, wishlist: false })
      }
    }

  })
})

// Remove product from wish list

router.get('/wishlist_removeproduct/:id', verifyLogin, (req, res) => {
  wishHelpers.removeWishListProduct(req.params.id, req.session.user._id).then((response) => {
    res.json({ status: true })
  })
})


router.get('/add-cart/:id', verifyLogin, (req, res) => {
  console.log(req.params.id)
  cartHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
    console.log('req.params.id')
    res.json({ status: true })
  })
})

router.get('/view-cart', verifyLogin, async (req, res) => {
  let total = await cartHelpers.getTotalPrice(req.session.user._id)
  let product = await cartHelpers.getCartList(req.session.user._id)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  console.log(product)
  res.render('user/view-cart', { product, user: req.session.user, total, cartCount })
})


router.get('/removefromcart/:id', (req, res) => {
  console.log(req.session.user._id)
  console.log('abcd')
  cartHelpers.removeFromCart(req.params.id, req.session.user._id).then((response) => {
    res.json({ status: true })
  })
})

router.post('/change-quantity', async (req, res, next) => {
  console.log(req.body)
  let quantity = req.body.quantity;
  let count = req.body.count;
  await userHelpers.getMaxStock(req.body.product).then(async (product) => {
    if (count == 1) {
      if (Number(quantity) == Number(product.stock)) {
        console.log('quant',quantity,'stock',product.stock)
        res.json({ updation: false });
      }
      else {
        await cartHelpers.changeProdQuantity(req.body).then(async (response) => {
          response = await cartHelpers.getTotalPrice(req.body.user)
          console.log('this is +resp',response)
          response.total = response.totalprice
          response.offprice=response.offerprice
          response.status = true
          console.log('this', response)
          console.log('details.count,details.quantity')
          res.json(response)
        })
      }
    } else {
      await cartHelpers.changeProdQuantity(req.body).then(async (response) => {
        console.log('this is 1st resp',response)
        if(!response.removeProduct){
          response = await cartHelpers.getTotalPrice(req.body.user)
          response.total = response.totalprice
          response.offprice=response.offerprice
          response.status = true
          console.log('this is -resp', response)
          console.log('details.count,details.quantity')
        }
        res.json(response)
      })
    }
  })
})


router.get('/checkout', verifyLogin, async (req, res) => {
  let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(req.session.user._id) })
  console.log('this is the cart', cart)
  if(cart){
    let total = await cartHelpers.getTotalPrice(req.session.user._id)
    let user = await userHelpers.getUserProfile(req.session.user._id)
    let cartCount = await cartHelpers.getCartCount(req.session.user._id)
    let address = await userHelpers.getAddress(req.session.user._id)
    res.render('user/checkout', { total, user: req.session.user, cartCount, address, user, cart })
  }else{
    res.redirect('/view-cart')
  }
})

router.post('/place-order', async (req, res, next) => {
  console.log(req.body)
  let product = await orderHelpers.getCartProductList(req.session.user._id)
  let totalss = await cartHelpers.getTotalPrice(req.session.user._id)
  if (totalss.offerprice == 0) {
    var total = totalss.totalprice
  } else {
    total = totalss.offerprice
  }
  await orderHelpers.placeOrder(req.body, product, total).then((_id) => {
    console.log('this is id' + _id)
    if (req.body['payment-mode'] === 'COD') {
      res.json({ codSuccess: true })
    } else if (req.body['payment-mode'] === 'razorpay') {

      orderHelpers.generateRazorpay(_id, total).then((response) => {
        console.log('this is rasor res', response)
        res.json(response)
      })
    } else if (req.body['payment-mode'] === 'paypal') {
      console.log('im here')
      console.log('this is paypal res', response)
      res.json(response)
    } else if (req.body['payment-mode'] === 'wallet') {
      userHelpers.wallet(req.session.user._id, total).then((result) => {
        console.log('this is wallet res', result)
        res.json(result)
      }).catch((err)=>{
           res.send('Insufficiant balance in the wallet')
      })
    }
  })

})


router.get('/placed', async (req, res) => {
  try{
    console.log('qqwwer')
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  res.render('user/placed', { cartCount })
  }catch(err){
    res.redirect('/')
  }
})


router.get('/view-orders', async (req, res) => {
  console.log('hi hi hi')
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)

  res.render('user/view-orders', { cartCount })
})

router.get('/my-order', verifyLogin, async (req, res) => {
  let myorder = await orderHelpers.showOrders(req.session.user._id)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  myorder.forEach(element => {
    let a = element.date.toISOString().split('T')[0]
    console.log(a);
    element.date = a;
  });
  res.render('user/my-order', { user: req.session.user, myorder, cartCount })
})



router.get('/view-order/:id', verifyLogin, async (req, res) => {
  let product = await orderHelpers.getUserOrder(req.params.id)
  console.log('it is the product',product)
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let total = await orderHelpers.showOrders(req.session.user._id)
  res.render('user/view-order-product', { user: req.session.user, product, total, cartCount })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  orderHelpers.verifyPayment(req.body).then(() => {
    orderHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('successfull')
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err)
    res.json({ status: false, errMsg: "" })
  })
})

/////////////////paypal///////////////////

// router.post("/api/orders", async (req, res) => {
//   const order = await paypal.createOrder();
//   res.json(order);
// });

// router.post("/api/orders/:orderId/capture", async (req, res) => {
//   const { orderId } = req.params;
//   const captureData = await paypal.capturePayment(orderId);
//   res.json(captureData);
// });

router.get('/cancel-order/:id', verifyLogin, (req, res) => {
  orderHelpers.cancelOrder(req.params.id).then((resolve, reject) => {
    res.redirect('/my-order')
  })

})

router.get('/category/:name', verifyLogin, async (req, res) => {
  let cartCount = await cartHelpers.getCartCount(req.session.user._id)
  let category = await categoryHelpers.getAllCategory()
  productHelpers.getCatProducts(req.params.name).then((product) => {
    product.forEach(element => {
      if (element.offerPrice == element.price) {
        element.offerPrice = null;
      }
    });
    res.render('user/user-home', { product, cartCount,user:true, category })
  })
})

router.get('/rewards', verifyLogin, async (req, res) => {
  let coupon = await productHelpers.getCoupon()

  orderHelpers.getOrderCount(req.session.user._id).then((total) => {
    let fivestat = false;
    console.log(fivestat);
    if (total >= 5000) {
      coupon[0].fivestat = true
    } else {
      coupon[0].fivestat = false
    }
    console.log(fivestat);
    res.json(coupon)
    // res.render('user/rewards', { fivestat, coupon })
  })
})


router.get('/password', verifyLogin, (req, res) => {
  res.render('user/password', { user: true })
})

router.post('/changePass', verifyLogin, async (req, res) => {


  let userId = req.session.user._id;

  let enteredPassword = req.body.password;
  let newPassword = req.body.newPassword;
  let confirmPassword = req.body.Confirm


  if (newPassword == confirmPassword) {

    let userdetails = await userHelpers.getUserProfile(userId)

    console.log(userdetails);

    bcrypt.compare(enteredPassword, userdetails.password).then((status) => {
      if (status) {
        userHelpers.changePassword(userId, newPassword).then((response) => {
          req.session.success = true
          res.redirect('/user-profile')
        })

      }
    })

  } else {
    req.session.changePasswordError = "entered wrong password";
    res.redirect('/user-profile')
  }
})


router.post('/apply-coupon', async (req, res) => {
  let coupon = req.body.coupon
  console.log(coupon, 'hai1')
  await productHelpers.verifyCoupon(coupon, req.session.user._id)
  console.log('hailast')
  res.redirect('/checkout')
})

router.get('removeCoup', async (req, res) => {
  await productHelpers.removeCoupon(req.session.user._id)
  res.redirect('/checkout')
})

router.get('/search', (req, res) => {
  try {

    let searchkey = req?.query?.val

    userHelpers.search(searchkey).then((data) => {

      res.json(data);

    }).catch(() => { res.redirect('/error') });;
  } catch (error) {
    console.log(error);
  }
})

router.get('/logout', (req, res) => {
  req.session.loggedIn = null
  req.session.user = null
  res.redirect('/')
})
module.exports = router;