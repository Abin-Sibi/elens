// var pop__up = document.querySelector('.pop__up__box')
function addToCart(prodId){
    // console.log("in here", prodId)
    // pop__up.classList.remove('hide')
    // console.log('script is running')
    $.ajax({
        url:'/add-cart/'+prodId,
        method:'get',
        success:(response)=>{
           if(response.status){
            let count=$('#cartcount').html()
            count=parseInt(count)+1
            $("#cartcount").html(count)
           }
        }
    })
}

