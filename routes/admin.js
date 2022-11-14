var express = require('express');
var router = express.Router();
//const { render, response } = require('../app');
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers')
const categoryHelpers = require('../helpers/category-helpers')
const orderHelpers = require('../helpers/order-helpers')
const chartHelpers = require('../helpers/chart-helpers')
const chartJs = require('chart.js')
const fmt = require('indian-number-format')

const credentials = {
  email: "admin@gmail.com",
  password: "admin"
}

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

/* GET users listing. */
router.get('/',async function (req, res, next) {
  console.log('here')
  if (req.session.adminLoggedIn) {
    let Users=await userHelpers.totUsers()
    let Products=await userHelpers.totProducts()
    let Orders=await userHelpers.totOrders()
    res.render('admin/admin-launch', { admin: true,Users,Products,Orders });
  }
  else {
    console.log('here2')
    res.redirect('/admin/login')
    console.log('here3')
  }
});

router.get('/admin-launch/day', async (req, res) => {
  await chartHelpers.findOrdersByDay().then((data) => {
    res.json(data)
  })
})

router.post('/admin-launch/graphdata', async (req, res) => {
  await chartHelpers.graphdata().then((data) => {
    res.json({ data })
  })
})

router.get('/login', function (req, res) {

  if (req.session.adminLoggedIn) {
    res.redirect('/admin')
  } else {
    console.log('here4')
    res.render('admin/admin-login', { noHeader: true, 'adminLoginError': req.session.adminLoginError })
    req.session.adminLoginError = null
  }
})

router.post('/adminlogin', function (req, res) {
  console.log('here5')
  if (req.body.email == credentials.email && req.body.password == credentials.password) {
    console.log('admin logged in');
    req.session.adminLoggedIn = true;
    req.session.admin = req.body.email;
    console.log(req.session);
    res.redirect('/admin');
    console.log(req.session);
  } else {
    console.log("admin not logged in");
    req.session.adminLoginError = "Invalid Username or Password"
    res.redirect('/admin')
  }
})

router.post('/size', (req, res) => {

  size = req.body.size
  console.log('the size we got is ', size, 'and req body is ', req.body)
  res.redirect('/admin/usermanage/1')
})

router.get('/usermanage', async function (req, res, next) {
  if (req.session.adminLoggedIn) {
    // let perPage = 9
    // let page = req.params.page || 1
    // if (req.query.page) {
    //     page = req.query.page
    // }
    // const limit = 10
    // let orders = await Order.find({
    //     $or: [
    //         { name: { $regex: '.' + search + '.', $options: 'i' } },
    //         { category: { $regex: '.' + search + '.', $options: 'i' } },
    //     ]
    // })
    //     .skip((page - 1) * limit)
    //     .limit(limit * 1)
    //     .sort({ _id: -1 })
    //     .exec()


    // let count = await Order.find({
    //     $or: [
    //         { name: { $regex: '.' + search + '.', $options: 'i' } },
    //         { category: { $regex: '.' + search + '.', $options: 'i' } },
    //     ]
    // }).countDocuments()
    // let order = await Order.find().sort({ _id: -1 })
    let page = req.params.id
    size = req.body.s

    console.log(page)
    console.log(req.body.s)
    if (!page) {
      page = 1
    }
    if (!size) {
      size = 10
    }
    const limit = parseInt(size)
    const skip = (page - 1) * size

    // userhelper.getUsers({limit,skip}).then((users)=>{
    //   res.render('admin/view-user',{admin,users});
    //   })
    userHelpers.getAllUsers({ limit, skip }).then((user) => {
      console.log(req.body);
      // console.log(user);
      res.render('admin/usermanage', { admin: true, user })
    })
  } else {
    res.redirect('/admin/login')
  }
});





router.get('/productmanage', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    productHelpers.getAllProducts().then((product) => {
      console.log(req.body);
      // console.log(user);
      res.render('admin/productmanage', { admin: true, product })
    })
  } else {
    res.redirect('/admin/login')
  }
})

// router.get('/categorymanage',function (req, res,next) {
//   categoryHelpers.getAllCategory().then((data) => {
//     console.log(req.body);
//     // console.log(user);
//     res.render('admin/categorymanage',{admin:true ,data})
//   })

// })

router.get('/add-product', function (req, res) {
  if (req.session.adminLoggedIn) {
    categoryHelpers.getAllCategory().then((data) => {
      console.log(req.body);
      res.render('admin/add-product', { admin: true, data })
    })
  } else {
    res.redirect('/admin/login')
  }

})

// router.post('/add-product', function (req, res) {
//   console.log(req.body)
//   console.log(req.files.image)

//   productHelpers.addProduct(req.body, (data) => {
//     let image = req.files?.image
//     let image1 = req.files?.image1
//     let image2 = req.files?.image2
//     let image3 = req.files?.image3
//     image.mv(`./public/product-image/${data}.png`, (err, done) => {
//     })
//     image1.mv(`./public/product-image/${data}1.png`, (err, done) => {
//     })
//     image2.mv(`./public/product-image/${data}2.png`, (err, done) => {
//     })
//     image3.mv(`./public/product-image/${data}3.png`, (err, done) => {
//     })
//     res.redirect('/admin/productmanage')
//   })
// })

router.post('/add-product', function (req, res) {
  console.log(req.body)
  console.log(req.files.image)

  productHelpers.addProduct(req.body).then((data) => {
    let image = req.files?.image
    let image1 = req.files?.image1
    let image2 = req.files?.image2
    let image3 = req.files?.image3
    image.mv(`./public/product-image/${data}.png`, (err, done) => {
    })
    image1.mv(`./public/product-image/${data}1.png`, (err, done) => {
    })
    image2.mv(`./public/product-image/${data}2.png`, (err, done) => {
    })
    image3.mv(`./public/product-image/${data}3.png`, (err, done) => {
    })
    res.redirect('/admin/productmanage')
  })
})

router.delete('/delete-product/:id', (req, res) => {
  console.log('hgfdfddffdhfhf')
  let productId = req.params.id
  console.log(productId);
  productHelpers.deleteProduct(productId).then((response) => {
    res.json('done')
    // res.redirect('/admin/productmanage')
  })
})


router.get('/edit-product/:id', async (req, res) => {
  console.log('here here hrerr')
  if (req.session.admin) {
    let product = await productHelpers.getProductDetails(req.params.id)
    categoryHelpers.getAllCategory().then((data) => {

      console.log(req.params.id)
      console.log(product)
      res.render('admin/edit-product', { product, admin: true, data })
      signupErr = null
    }).catch((err)=>{
      console.log('hereeeeebug')
      res.redirect('/error')
    })
  } else {
    res.redirect('/admin')
  }
})
// router.post('/edit-product/:id', (req, res) => {
//   console.log(req.params.id)

//   productHelpers.updateProduct(req.params.id, req.body).then((response) => {
//     if(response.statuss){
//     res.redirect('/admin')
//   }else{
//     signupErr="The email-Id already exists!!"
//     res.redirect(`/admin/edit-product/${req.params.id}`)
//   }
//   })
// })

router.get('/categorymanage', function (req, res, next) {
  if (req.session.adminLoggedIn) {
    categoryHelpers.getAllCategory().then((data) => {
      console.log(req.body);
      // console.log(user);
      res.render('admin/categorymanage', { admin: true, data })
    })
  } else {
    res.redirect('/admin/login')
  }
})

router.post('/edit-product/:id', (req, res) => {
  console.table(req.params.id)
  console.log(req.params.id)
  let data = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(async (response) => {
    try {
      if (req.files.image) {
        let image = req.files?.image
        await image.mv(`./public/product-image/${data}.png`, (err, succ) => {
          if (err) {
            console.warn(err)
          } {
            console.log('success')
          }
        })
      }
      if (req.files.image1) {
        let image1 = req.files?.image1
        await image1.mv(`./public/product-image/${data}1.png`, (err, succ) => {
          if (err) {
            console.warn(err)
          } else {
            console.log('success')
          }
        })
      }
      if (req.files.image2) {
        let image2 = req.files?.image2
        await image2.mv(`./public/product-image/${data}2.png`, (err, succ) => {
          if (err) {
            console.warn(err)
          } {
            console.log('success')
          }
        })
      }
      if (req.files.image3) {
        let image3 = req.files?.image3
        await image3.mv(`./public/product-image/${data}3.png`, (err, succ) => {
          if (err) {
            console.warn(err)
          } {
            console.log('success')
          }
        })
      }
      res.redirect('/admin/productmanage')
    }
    catch (err) {
      res.redirect('/admin/productmanage')
    }
  })
})

// router.get('/showCategory',(req,res)=>{
//   categoryHelpers.getAllCategory().then((data)=>{
//     res.render('admin/show-category',{data,category:true})
//     admin__msg = ''
//   })
// })
router.get('/add-category', (req, res) => {
  if (req.session.adminLoggedIn) {
    categoryHelpers.getAllCategory().then((data) => {
      res.render('admin/add-category', { data, admin: true })
      admin__msg = ''
    })
  } else {
    res.redirect('/admin/login')
  }

})
router.post('/add-category', (req, res) => {
  console.log('got inside the addcategory post method')
  categoryHelpers.addCategory(req.body).then((response) => {
    admin__msg = response
   
    response.insertedId=response.insertedId.toString()
    console.log('this is insid',response.insertedId)
    let image = req.files?.image
    image.mv(`./public/product-image/${response.insertedId}.png`, (err, done) => {
    })
    res.redirect('/admin/categorymanage')
  })
})

///////////// For deleting a category///////////////////
router.get('/deleteCategory/:id', (req, res) => {
  categoryHelpers.deleteCategory(req.params.id).then((response) => {
    admin__msg = response
    res.redirect('/admin/categorymanage')
  })
})

router.get('/edit-category/:id', async (req, res) => {
  try {
    if (req.session.adminLoggedIn) {
    console.log('here here hrerr')
    let category = await categoryHelpers.getCategoryDetails(req.params.id)
    console.log(req.params.id)
    console.log(category)
    res.render('admin/edit-category', { category, admin: true })
    admin__msg = ''

  }
  } catch (error) {
    res.redirect('/error')
  }
  

})

// router.post('/edit-product/:id', (req, res) => {
//   console.log(req.params.id)

//   productHelpers.updateProduct(req.params.id, req.body).then((response) => {
//     if(response.statuss){
//     res.redirect('/admin')
//   }else{
//     signupErr="The email-Id already exists!!"
//     res.redirect(`/admin/edit-product/${req.params.id}`)
//   }
//   })
// })

router.post('/edit-category/:id', (req, res) => {
  categoryHelpers.updateCategory(req.params.id, req.body).then((response) => {
    if (response) {
      res.redirect('/admin/categorymanage')
    } else {
      res.redirect(`/admin/edit-category/${req.params.id}`)
    }
  })
})

router.get('/changestatus', (req, res) => {
  console.log('hhhhhhhhhh')
  productHelpers.changeStatus(req.query.id).then((response) => {
    admin__msg = response
    res.redirect('/admin/usermanage')
  })
})

router.get('/ordermanage', async (req, res) => {

  if (req.session.adminLoggedIn) {
    let myorder = await orderHelpers.showOrder()
    myorder.forEach(element => {
      let a = element.date.toISOString().split('T')[0]
      console.log(a);
          element.date = a;
        });
    res.render('admin/ordermanage', { myorder, admin: true })
  }

})

router.get('/salesreport', async (req, res) => {

  if (req.session.adminLoggedIn) {
    let myorder = await orderHelpers.showOrder()
    myorder.forEach(element => {
      let a = element.date.toISOString().split('T')[0]
      console.log(a);
          element.date = a;
        });

    res.render('admin/salesreport', { myorder, admin: true })
  }

})

router.post('/edit-status/:id', async (req, res) => {
  console.log('hhhhhhhhhh')
  console.log(req.body, 'is the body')
  if (req.session.adminLoggedIn) {
    await orderHelpers.updateStatus(req.body, req.params.id).then((response) => {
      res.redirect('/admin/ordermanage')
    })
  }
})

router.get('/addoffer', async (req, res) => {
  if (req.session.adminLoggedIn) {
    let category = await categoryHelpers.getAllCategory()
  res.render('admin/addoffer', { admin: true, category })
  }
  else {
    console.log('here2')
    res.redirect('/admin/login')
    console.log('here3')
  } 
})

router.post('/addoffer', async (req, res) => {
  console.log('is the body iiiis', req.body)
  productHelpers.addOffer(req.body.category, req.body.discount).then(() => {
    console.log('is the  iiiis')
    res.redirect('/admin/addoffer')
  })
})

router.get('/edit-offer', async (req, res) => {
  productHelpers.get
})

router.get('/add-coupon', async (req, res) => {
  if (req.session.adminLoggedIn) {
    let coupon = await productHelpers.getCoupon()
    console.log('rage', coupon)
    res.render('admin/add-coupon', { admin: true, coupon })
  }
  else {
    console.log('here2')
    res.redirect('/admin/login')
    console.log('here3')
  }
  
})

router.post('/add-coupon', async (req, res) => {
  productHelpers.addCoupon(req.body).then(() => {
    res.render('admin/add-coupon')
  })
})

router.get('/view-order-details/:id', async (req, res) => {
    console.log('assssssd')
  let order = await orderHelpers.getOrderDetails(req.params.id)
  res.render('admin/view-order-details', { order })

})

router.get('/adminlogout', (req, res) => {
  console.log('aaa')
  req.session.admin = null
  req.session.adminLoggedIn = null
  req.session.adminLoginError = null
  // req.session.adminLoginError=null
  res.redirect('/admin/login')
})



module.exports = router;
