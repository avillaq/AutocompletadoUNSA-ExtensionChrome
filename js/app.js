document.addEventListener('DOMContentLoaded', init);
function init() {

    let calificacion = null;

    ///////////
    const btnCali = document.querySelector("#btnCali");
    btnCali.addEventListener('click', function (e) {
        e.preventDefault();
        const radio = document.querySelectorAll("input[type='radio'][name='radio']")
        radio.forEach(e => {
            if(e.checked){
                calificacion= e.id;
            }
        })

        if(calificacion != null){
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  function: fill,
                  args : [calificacion]
                });
              });
        }
    });
    
    ///////////
    const btnLimp = document.querySelector("#btnLimp");
    btnLimp.addEventListener('click', function(e){
        e.preventDefault();
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: clear
            });
          });
    });

    function fill(id) {
        for(let i = 1; i < 22; i++) {
            const radios = document.querySelectorAll(`#radio${i}`);
            let prob = Math.floor((Math.random())*2);
            if (prob === 0){
                radios[parseInt(id)].checked = true;
            }else{
                radios[parseInt(id)+1].checked = true;
            }
            
            //console.log(e.value);    
        }
    }
    function clear(){
        const radios = document.querySelectorAll("input[type='radio']");
        radios.forEach(e => {
            e.checked = false;
        })
    }
}