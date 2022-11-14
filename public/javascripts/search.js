let searchInput = document.getElementById('search')
let rows = document.querySelectorAll('psearch')

searchInput.addEventListener('keyup',(event)=>{
    let q=event.target.value.toLowerCase()
   rows.forEach(row=>{
    row.textContent.toLocaleLowerCase().includes(q)? row.style.display='': row.style.display='none'

   })
})