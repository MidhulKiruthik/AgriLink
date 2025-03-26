let x= 25;
let y=56.6;
//input user input
//1,Window prompt
let username;
username = window.prompt("whats is u rname");
console.log(username);
//2,TExt box
document.getElementById("mysubmit").onclick=function(){
    username=document.getElementById("mytext").ariaValueMax;
    document.getElementById("myH1").textContent=`Hello ${username}`


}
