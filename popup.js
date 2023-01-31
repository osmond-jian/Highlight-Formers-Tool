// // Initialize button with user's preferred color
// let changeColor = document.getElementById("highlightFormers");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

// // When the button is clicked, inject setPageBackgroundColor into current page
// changeColor.addEventListener("click", async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       function: setPageBackgroundColor,
//     });
//   });
  
//   // The body of this function will be executed as a content script inside the
//   // current page
//   function setPageBackgroundColor() {
//     chrome.storage.sync.get("color", ({ color }) => {
//       document.body.style.backgroundColor = color;
//     });
//   }
  // //////////////////////////////////////////////////////////////////////////////////

let highlightFormer = document.getElementById("highlightFormers");
let companyName = document.getElementById("companyName");
let years = document.getElementById("years");

//to 'remember' previous settings if necessary for future
// chrome.storage.sync.get("previousSession", ({previousSession}) => {

// });


highlightFormer.addEventListener("click", async () => {
  
  let [tab] = await chrome.tabs.query({active:true, currentWindow:true});

  //store value in memory - should we use local, sync, or session?
  await chrome.storage.sync.set({
    "companyNameArray":companyName.value,
    "formerYears":years.options[years.selectedIndex].text,
  }).then(() => {
    console.log("Company is set to " + companyName.value);
    console.log("Years is set to " + years.value)
  })

  chrome.scripting.executeScript({
    target:{tabId:tab.id},
    function:highlightFormers,
  })
})

function highlightFormers(){
  //     chrome.storage.sync.get("color", ({ color }) => {
//       document.body.style.backgroundColor = color;
//     });
  chrome.storage.sync.get(["companyNameArray", "formerYears"], async (result) => {
    await console.log("Highlighting formers " + result.formerYears + " years out from the company " + result.companyNameArray);
    let companyName = result.companyNameArray;
    let formerYears = result.formerYears;
    let profiles = document.body.querySelectorAll('.profile-list__border-bottom');

    await profiles.forEach((element) => {
      let seeMoreButton = element.querySelector('ol.expandable-list button');
      if (seeMoreButton){
      seeMoreButton.click();
      console.log('click')
      };

      let companyNameSpan = element.querySelectorAll('ol.expandable-list li span');
      console.log(companyNameSpan);

      companyNameSpan.forEach((jobSpan) => {
        console.log(jobSpan.innerText);
        console.log(jobSpan.innerText.includes(companyName));
        console.log(companyName)

        if (jobSpan.innerText.includes(companyName)) {
          element.style.backgroundColor = "#CBC3E3";
          
        }
        // else{
        //   element.style.backgroundColor = "#CBC3E3";
        // }
      });
    });


  });
  

}